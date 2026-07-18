#!/usr/bin/env node
// bench-engine.mjs — Phase 1A deterministic engine-scaling benchmark.
//
// Measures, per population, the per-tick cost of:
//   verify  — admission-style signature verification of every input
//   hash    — stateHash of the pre-state and of the post-state
//   next    — nextState execution (which re-validates inputs internally)
// plus total tick time, ticks/sec, replay ticks/sec, replay speedup
// relative to the live 600 ms cadence, and the final state hash (the
// cross-build equivalence anchor).
//
// NON-CONSENSUS: runs outside witness execution; timings never enter state.
//
// Usage:
//   node bench/bench-engine.mjs [--pops 100,500,1000,2000] [--ticks 40]
//                               [--engine ../engine.js] [--json out.json]
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { buildScenario, inputsForTick, stats, ms, fmt } from './bench-lib.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

const arg = (name, dflt) => {
  const i = process.argv.indexOf('--' + name)
  return i === -1 ? dflt : process.argv[i + 1]
}
const pops = arg('pops', '100,500,1000,2000').split(',').map(Number)
const ticks = Number(arg('ticks', '40'))
const enginePath = path.resolve(here, arg('engine', '../engine.js'))
const jsonOut = arg('json', null)

const E = require(enginePath)
E.initCrypto()
const { buildWorld } = await import(path.resolve(here, '../worldgen.mjs'))

const LIVE_TPS = 1000 / E.TICK_MS
const results = []
console.log(`# engine: ${path.relative(process.cwd(), enginePath)}  ticks/pop: ${ticks}  node: ${process.version}`)
if (typeof E.perfStats === 'function') console.log('# backend:', E.perfStats().backend)

for (const n of pops) {
  const { state: initial, ids, worldId } = buildScenario(E, buildWorld, n)
  // Pre-sign the whole history so signing cost never pollutes tick timing.
  const prevByPlayer = new Map()
  const history = []
  for (let t = 0; t < ticks; t++) history.push(inputsForTick(E, ids, worldId, initial.tick + t, prevByPlayer))

  const tVerify = [], tHash = [], tNext = [], tTotal = []
  let state = initial
  const t0all = process.hrtime.bigint()
  for (let t = 0; t < ticks; t++) {
    const inputs = history[t]
    let a = process.hrtime.bigint()
    for (const inp of inputs) E.verifyInputSig(inp) // admission
    let b = process.hrtime.bigint()
    E.stateHash(state)                              // prev-hash binding
    let c = process.hrtime.bigint()
    state = E.nextState(state, inputs)              // execution (re-validates)
    let d = process.hrtime.bigint()
    E.stateHash(state)                              // resulting hash
    let e = process.hrtime.bigint()
    tVerify.push(ms(b - a)); tHash.push(ms(c - b) + ms(e - d))
    tNext.push(ms(d - c)); tTotal.push(ms(e - a))
  }
  const wallMs = ms(process.hrtime.bigint() - t0all)
  const finalHash = E.stateHash(state)

  // Replay: recompute the same history through nextState alone, as a
  // catching-up witness would (state-machine re-validation included).
  let rs = initial
  const r0 = process.hrtime.bigint()
  for (let t = 0; t < ticks; t++) rs = E.nextState(rs, history[t])
  const replayMs = ms(process.hrtime.bigint() - r0)
  if (E.stateHash(rs) !== finalHash) throw new Error('replay diverged from live run — determinism bug')

  const row = {
    population: n, ticks,
    verify: stats(tVerify), hash: stats(tHash), next: stats(tNext), total: stats(tTotal),
    ticksPerSec: 1000 * ticks / wallMs,
    replayTicksPerSec: 1000 * ticks / replayMs,
    replaySpeedup: (1000 * ticks / replayMs) / LIVE_TPS,
    finalHash,
    perf: typeof E.perfStats === 'function' ? E.perfStats() : null,
  }
  results.push(row)
  console.log(`\npopulation ${n} (${ticks} ticks) — final hash ${finalHash.slice(0, 16)}…`)
  console.log('  component      median      p95      max   (ms)')
  for (const [k, v] of [['verify', row.verify], ['hash', row.hash], ['nextState', row.next], ['tick total', row.total]])
    console.log(`  ${k.padEnd(11)}${fmt(v.median)} ${fmt(v.p95)} ${fmt(v.max)}`)
  console.log(`  ticks/sec ${row.ticksPerSec.toFixed(1)}   replay ${row.replayTicksPerSec.toFixed(1)}/s   replay speedup ${row.replaySpeedup.toFixed(1)}x (live=${LIVE_TPS.toFixed(2)}/s)`)
  if (row.perf) console.log('  counters:', JSON.stringify(row.perf))
}

if (jsonOut) {
  fs.writeFileSync(jsonOut, JSON.stringify({ engine: enginePath, node: process.version, when: new Date().toISOString(), results }, null, 2))
  console.log('\nwrote', jsonOut)
}
