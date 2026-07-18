#!/usr/bin/env node
// bench-phase2.mjs — Phase 2A deterministic engine-scaling benchmark.
//
// Extends the Phase 1 harness with world profiles, workloads, and (when the
// engine under test exposes them) nextState section timings and scan/index
// counters. NON-CONSENSUS: timings never enter state; the final state hash
// is the cross-build equivalence anchor.
//
// Usage:
//   node bench/bench-phase2.mjs [--pops 100,500,1000,2000] [--ticks 30]
//     [--profile current|expanded] [--workload ordinary|active|adversarial]
//     [--engine ../engine.js] [--json out.json] [--clone json|structured|fast]
//     [--indexes on|off]
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { buildScenario2, inputsForTick } from './phase2-lib.mjs'
import { stats, ms, fmt } from './bench-lib.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const arg = (name, dflt) => {
  const i = process.argv.indexOf('--' + name)
  return i === -1 ? dflt : process.argv[i + 1]
}
const pops = arg('pops', '100,500,1000,2000').split(',').map(Number)
const ticks = Number(arg('ticks', '30'))
const profile = arg('profile', 'current')
const workload = arg('workload', 'ordinary')
const enginePath = path.resolve(here, arg('engine', '../engine.js'))
const jsonOut = arg('json', null)
const cloneMode = arg('clone', null)
const indexes = arg('indexes', null)

if (cloneMode) process.env.INTERVAL_CLONE = cloneMode
if (indexes) process.env.INTERVAL_INDEXES = indexes

const E = require(enginePath)
E.initCrypto()
const { buildWorld } = await import(path.resolve(here, '../worldgen.mjs'))
const P2 = E._phase2Perf ?? null
if (P2) P2.enable()

const LIVE_TPS = 1000 / E.TICK_MS
const results = []
console.log(`# engine: ${path.relative(process.cwd(), enginePath)}  profile: ${profile}  workload: ${workload}  ticks/pop: ${ticks}  node: ${process.version}`)
if (P2) console.log(`# clone: ${P2.cloneMode()}  indexes: ${P2.indexesEnabled() ? 'on' : 'off'}`)

for (const n of pops) {
  const sc = buildScenario2(E, buildWorld, { profile, pop: n, workload })
  sc.worldNodes = Object.keys(sc.state.nodes).length
  sc.worldMobs = Object.keys(sc.state.mobs).length
  const history = []
  for (let t = 0; t < ticks; t++) history.push(inputsForTick(E, sc, sc.state.tick + t))

  const S = { verify: [], hash: [], next: [], total: [] }
  const sections = {}
  let counters = null
  let state = sc.state
  if (P2) P2.reset()
  const t0all = process.hrtime.bigint()
  for (let t = 0; t < ticks; t++) {
    const inputs = history[t]
    const a = process.hrtime.bigint()
    for (const inp of inputs) E.verifyInputSig(inp)
    const b = process.hrtime.bigint()
    E.stateHash(state)
    const c = process.hrtime.bigint()
    if (P2) P2.tickStart()
    const next = E.nextState(state, inputs)
    const d = process.hrtime.bigint()
    E.stateHash(next)
    const e = process.hrtime.bigint()
    S.verify.push(ms(b - a)); S.hash.push(ms(c - b) + ms(e - d))
    S.next.push(ms(d - c)); S.total.push(ms(e - a))
    if (P2) {
      const secs = P2.tickSections()
      for (const [k, v] of Object.entries(secs)) (sections[k] ??= []).push(v)
    }
    state = next
  }
  const wallMs = ms(process.hrtime.bigint() - t0all)
  if (P2) counters = P2.counters()
  const finalHash = E.stateHash(state).toString('hex')
  const st = Object.fromEntries(Object.entries(S).map(([k, v]) => [k, stats(v)]))
  const secStats = Object.fromEntries(Object.entries(sections).map(([k, v]) => [k, stats(v)]))
  const tps = ticks / (wallMs / 1000)
  const row = {
    pop: n, profile, workload, ticks,
    worldNodes: sc.worldNodes, worldMobs: sc.worldMobs, roles: sc.roleCounts,
    inputsPerTick: history[0].length,
    stats: st, sections: secStats, counters,
    replayTps: tps, replaySpeedup: tps / LIVE_TPS, finalHash,
  }
  results.push(row)
  console.log(`\n## pop ${n}  (${sc.worldNodes} nodes, ${sc.worldMobs} mobs, ${row.inputsPerTick} inputs/tick)`)
  console.log(`   roles: ${JSON.stringify(sc.roleCounts)}`)
  for (const k of ['verify', 'hash', 'next', 'total'])
    console.log(`   ${k.padEnd(7)} median ${fmt(st[k].median)}  p95 ${fmt(st[k].p95)}  max ${fmt(st[k].max)}  ms`)
  if (Object.keys(secStats).length) {
    console.log('   nextState sections (median ms):')
    for (const [k, v] of Object.entries(secStats)) console.log(`     ${k.padEnd(22)} ${fmt(v.median)}`)
  }
  if (counters) console.log('   counters:', JSON.stringify(counters))
  console.log(`   replay: ${tps.toFixed(2)} ticks/s = ${(tps / LIVE_TPS).toFixed(2)}x real time`)
  console.log(`   final hash: ${finalHash}`)
}

if (jsonOut) {
  fs.writeFileSync(path.resolve(process.cwd(), jsonOut), JSON.stringify({
    engine: path.relative(here, enginePath), node: process.version,
    profile, workload, ticks, when: new Date().toISOString(), results,
  }, null, 2))
  console.log('\nwrote', jsonOut)
}
