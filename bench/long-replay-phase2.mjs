#!/usr/bin/env node
// long-replay-phase2.mjs — Phase 2E long-replay campaign (scaled).
//
// Runs a long deterministic history through the Phase 2 engine, and:
//   - every REF_EVERY ticks, replays that single tick in test-only reference
//     mode (JSON clone, indexes disabled) from the same pre-state and
//     demands an identical resulting hash;
//   - samples memory to demonstrate no sustained growth;
//   - validates the final state constitutionally.
//
// The constitutional campaign lengths (100k/25k/10k ticks) are specified
// for release hardware; pass --ticks accordingly there.
//
// Usage: node bench/long-replay-phase2.mjs [--pop 100] [--ticks 3000]
//          [--profile expanded] [--workload ordinary]
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { buildScenario2, inputsForTick } from './phase2-lib.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const arg = (name, dflt) => {
  const i = process.argv.indexOf('--' + name)
  return i === -1 ? dflt : process.argv[i + 1]
}
const pop = Number(arg('pop', 100))
const ticks = Number(arg('ticks', 3000))
const profile = arg('profile', 'expanded')
const workload = arg('workload', 'ordinary')
const REF_EVERY = Number(arg('refevery', 250))

const E = require(path.join(here, '../engine.js'))
E.initCrypto()
const T2 = E._phase2Testing
const sc = buildScenario2(E, (await import(path.join(here, '../worldgen.mjs'))).buildWorld, { profile, pop, workload })
console.log(`# long replay: ${profile}/${workload}, pop ${pop}, ${ticks} ticks, reference spot-check every ${REF_EVERY}`)

let s = sc.state
let refChecks = 0
const mem = []
const t0 = Date.now()
for (let t = 0; t < ticks; t++) {
  const inputs = inputsForTick(E, sc, s.tick)
  if (t > 0 && t % REF_EVERY === 0) {
    T2.setClone('json'); T2.setIndexes(false)
    let ref
    try { ref = E.nextState(s, inputs) } finally { T2.setClone(null); T2.setIndexes(null) }
    const next = E.nextState(s, inputs)
    if (E.stateHash(next) !== E.stateHash(ref)) {
      console.error(`FAIL tick ${s.tick}: indexed transition diverged from scan reference`)
      process.exit(1)
    }
    refChecks++
    s = next
  } else {
    s = E.nextState(s, inputs)
  }
  if (t % 500 === 0 || t === ticks - 1) {
    global.gc?.()
    const m = process.memoryUsage()
    mem.push({ t, heapMB: +(m.heapUsed / 1048576).toFixed(1), rssMB: +(m.rss / 1048576).toFixed(1) })
    process.stderr.write(`  tick ${t}/${ticks}  heap ${mem.at(-1).heapMB} MB  rss ${mem.at(-1).rssMB} MB  (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`)
  }
}
const verr = E.validateState(s)
if (verr) { console.error('FAIL: final state invalid:', verr); process.exit(1) }
const secs = (Date.now() - t0) / 1000
console.log(`PASS: ${ticks} ticks in ${secs.toFixed(0)}s (${(ticks / secs).toFixed(2)} t/s = ${(ticks / secs / (1000 / E.TICK_MS)).toFixed(2)}x real time)`)
console.log(`  ${refChecks} reference spot-checks agreed; final state constitutionally valid`)
console.log(`  memory samples: ${JSON.stringify(mem)}`)
console.log(`  final hash ${E.stateHash(s)}`)
