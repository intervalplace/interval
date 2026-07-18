#!/usr/bin/env node
// compare-phase2.mjs — Phase 2E deterministic old-versus-new replay.
//
// Loads the frozen Phase 1 engine (bench/phase1-engine.cjs) and the Phase 2
// engine (engine.js) into one process, feeds both the identical
// deterministic Phase 2A history (role-based workloads on either world
// profile), and demands at every tick:
//
//   1. identical admission verdicts for every input, and
//   2. identical state hashes after the transition.
//
// The first mismatch aborts with tick, both hashes, and the input bundle.
//
// Usage: node bench/compare-phase2.mjs [--pop 100] [--ticks 300]
//          [--profile current|expanded] [--workload ordinary|active|adversarial]
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
const ticks = Number(arg('ticks', 300))
const profile = arg('profile', 'current')
const workload = arg('workload', 'ordinary')

const OLD = require(path.join(here, 'phase1-engine.cjs'))
const NEW = require(path.join(here, '../engine.js'))
OLD.initCrypto(); NEW.initCrypto()

const sc = buildScenario2(NEW, (await import(path.join(here, '../worldgen.mjs'))).buildWorld, { profile, pop, workload })
let sOld = JSON.parse(JSON.stringify(sc.state))
let sNew = JSON.parse(JSON.stringify(sc.state))
if (OLD.stateHash(sOld) !== NEW.stateHash(sNew)) {
  console.error('FAIL: engines disagree on the initial state hash'); process.exit(1)
}
console.log(`# ${profile} world, ${workload} workload, pop ${pop}, ${ticks} ticks; roles ${JSON.stringify(sc.roleCounts)}`)

let inputsSeen = 0, invalidSeen = 0
const t0 = Date.now()
for (let t = 0; t < ticks; t++) {
  const tick = sNew.tick
  const inputs = inputsForTick(NEW, sc, tick)
  for (const inp of inputs) {
    const vo = OLD.verifyInputSig(inp), vn = NEW.verifyInputSig(inp)
    if (vo !== vn) {
      console.error(`FAIL tick ${tick}: admission verdicts differ (old=${vo} new=${vn}) for`, JSON.stringify(inp))
      process.exit(1)
    }
    inputsSeen++; if (!vn) invalidSeen++
  }
  sOld = OLD.nextState(sOld, inputs)
  sNew = NEW.nextState(sNew, inputs)
  const ho = OLD.stateHash(sOld), hn = NEW.stateHash(sNew)
  if (ho !== hn) {
    console.error(`FAIL at tick ${tick}:`)
    console.error(`  phase1 resulting hash: ${ho}`)
    console.error(`  phase2 resulting hash: ${hn}`)
    console.error(`  ordered input bundle (${inputs.length} inputs):`)
    console.error(JSON.stringify(inputs, null, 1).slice(0, 4000))
    process.exit(1)
  }
  if ((t + 1) % 50 === 0)
    process.stderr.write(`  tick ${t + 1}/${ticks} in agreement (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`)
}

const verrOld = OLD.validateState(sOld), verrNew = NEW.validateState(sNew)
if (verrOld || verrNew) { console.error('FAIL: final state invalid:', verrOld, verrNew); process.exit(1) }
console.log(`PASS: ${ticks} ticks x ${pop} citizens (${profile}/${workload}) — every admission verdict and`)
console.log(`every per-tick state hash identical across engines. ${inputsSeen} inputs judged (${invalidSeen} invalid),`)
console.log(`final hash ${NEW.stateHash(sNew)}`)
