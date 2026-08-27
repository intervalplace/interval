// verify-pool.mjs — parallel arrival-time signature verification.
//
// NON-CONSENSUS, and that claim is load-bearing enough to state precisely.
//
// Verification is a PURE PREDICATE over an input: the same bytes give the same
// answer on any machine, in any order, at any time. Parallelising it changes
// WHERE the ed25519 work happens and nothing about WHAT is accepted. The engine
// still verifies authoritatively inside `nextState`; this only ensures that by
// the time it does, the answer is already in the engine's memo cache. A forged
// signature caches false here and is refused there, exactly as before.
//
// There is no ordering to preserve: application order is decided later and
// separately, by the engine, from the canonical bundle. That is what makes this
// safe to parallelise when the tick itself never can be.
//
// Why it matters: verification measured 388 ms of an 850 ms tick at 5,000
// acting citizens — the largest single component, and the only large one that
// is embarrassingly parallel. Nothing else in the tick may be split at all.
//
// Degrades to inline verification when a pool is not available or not wanted:
// a single core is not a reason to add thread-hop latency to every input.

import os from 'node:os'
import { Worker } from 'node:worker_threads'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const WORKER_SRC = `
const { parentPort, workerData } = require('node:worker_threads')
const E = require(workerData.enginePath)
E.initCrypto()
parentPort.on('message', (batch) => {
  // Verify, and report only the VERDICTS. The inputs themselves are already on
  // the main thread; shipping them back would double the structured-clone cost
  // for no gain.
  const out = new Array(batch.length)
  for (let i = 0; i < batch.length; i++) {
    try { out[i] = E.verifyInputSig(batch[i]) === true } catch { out[i] = false }
  }
  parentPort.postMessage(out)
})
`

export class VerifyPool {
  #workers = []
  #queue = []
  #idle = []
  #enginePath
  #closed = false
  #audited = 0
  #poolFaulted = false
  #onFault = null

  // size: worker count. 0 or 1 disables the pool entirely and verification
  // stays inline, which is correct on a single core — a thread hop per input
  // costs more than the verify it is trying to move.
  constructor(enginePath, size = Math.max(0, (os.availableParallelism?.() ?? os.cpus().length) - 1)) {
    this.#enginePath = enginePath
    if (size < 2) return
    for (let i = 0; i < size; i++) {
      const w = new Worker(WORKER_SRC, { eval: true, workerData: { enginePath } })
      w.unref()
      w.on('error', () => { this.#retire(w) })
      this.#workers.push(w)
      this.#idle.push(w)
    }
  }

  get enabled() { return !this.#poolFaulted && this.#workers.length > 1 }
  get faulted() { return this.#poolFaulted }
  onFault(fn) { this.#onFault = fn; return this }
  get size() { return this.#workers.length }

  #retire(w) {
    // A worker that dies takes no inputs with it: anything it was verifying is
    // simply verified inline by the engine later. Losing the whole pool costs
    // throughput and nothing else, which is the point of keeping this off the
    // consensus path.
    this.#workers = this.#workers.filter(x => x !== w)
    this.#idle = this.#idle.filter(x => x !== w)
    try { w.terminate() } catch {}
  }

  // Verify a batch, warming the engine's memo cache on this thread.
  // Returns the number verified true. Never throws.
  async warm(inputs, E) {
    if (this.#closed || !inputs.length) return 0
    if (!this.enabled) {
      let n = 0
      for (const inp of inputs) { try { if (E.verifyInputSig(inp) === true) n++ } catch {} }
      return n
    }
    const chunks = this.#split(inputs, this.#workers.length)
    const results = await Promise.all(chunks.map(c => this.#run(c)))
    // Seed the verdicts into the engine's memo. This is a Map write per input,
    // NOT a verify — the ed25519 work already happened off-thread, and seeding
    // rather than re-verifying here is the whole reason the pool is worth
    // having. Re-calling verifyInputSig would move the work back onto the main
    // thread and buy exactly nothing.
    let n = 0
    for (let c = 0; c < chunks.length; c++) {
      const verdicts = results[c]
      if (!verdicts) { // that chunk's worker died; verify it inline instead
        for (const inp of chunks[c]) { try { if (E.verifyInputSig(inp) === true) n++ } catch {} }
        continue
      }
      for (let i = 0; i < chunks[c].length; i++) {
        const ok = verdicts[i] === true
        // AUDIT. Seeding means trusting a verdict this thread did not compute,
        // and a worker that returned garbage -- a bad build, a corrupted
        // engine copy, memory trouble -- would fork this node silently while
        // every other node in the world stayed correct. That is the most
        // expensive failure this codebase has, so it is not left to trust.
        //
        // One input in every 64 is verified here as well and compared. On any
        // disagreement the pool is retired for the life of the process and
        // everything falls back inline: throughput is worth much less than
        // being right, and a pool that is wrong once is not to be trusted
        // again. The cost is ~1.6% of the work the pool was meant to remove.
        if ((this.#audited++ & 63) === 0) {
          let truth = false
          try { truth = E.verifyInputSig(chunks[c][i]) === true } catch { truth = false }
          if (truth !== ok) {
            this.#poolFaulted = true
            this.#onFault?.(chunks[c][i])
            await this.close()
            // finish this batch honestly, inline
            let m = 0
            for (const inp of inputs) { try { if (E.verifyInputSig(inp) === true) m++ } catch {} }
            return m
          }
          if (truth) n++
          continue // already in the cache from the audit; seeding would no-op
        }
        E.seedSigVerdict(chunks[c][i], ok)
        if (ok) n++
      }
    }
    return n
  }

  #split(arr, k) {
    const out = [], per = Math.ceil(arr.length / k)
    for (let i = 0; i < arr.length; i += per) out.push(arr.slice(i, i + per))
    return out
  }

  #run(batch) {
    return new Promise((resolve) => {
      const dispatch = (w) => {
        const done = (msg) => { w.off('message', done); this.#idle.push(w); this.#drain(); resolve(msg) }
        w.on('message', done)
        try { w.postMessage(batch) } catch { w.off('message', done); resolve(null) }
      }
      const w = this.#idle.pop()
      if (w) dispatch(w)
      else this.#queue.push(dispatch)
    })
  }

  #drain() {
    while (this.#queue.length && this.#idle.length) {
      const dispatch = this.#queue.shift()
      dispatch(this.#idle.pop())
    }
  }

  async close() {
    this.#closed = true
    await Promise.all(this.#workers.map(w => w.terminate().catch(() => {})))
    this.#workers = []; this.#idle = []; this.#queue = []
  }
}
