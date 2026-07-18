#!/usr/bin/env node
// compare-equivalence.mjs — Phase 1E deterministic old-versus-new replay.
//
// Loads the pre-optimization engine (bench/baseline-engine.cjs) and the
// optimized engine (engine.js) into one process, feeds both the identical
// deterministic history (valid moves, corrupted signatures, stale
// duplicates, idle citizens), and demands at every tick:
//
//   1. identical admission verdicts for every input (verifyInputSig), and
//   2. identical state hashes after the transition.
//
// The first mismatch aborts with the tick number, both hashes, and the
// ordered input bundle for that tick, per the brief. Zero mismatches over
// the full campaign is the Phase 1 acceptance signal that the optimization
// was implementation-only.
//
// Usage: node bench/compare-equivalence.mjs [--pop 100] [--ticks 300]
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { buildScenario, inputsForTick } from './bench-lib.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const arg = (name, dflt) => {
  const i = process.argv.indexOf('--' + name)
  return i === -1 ? dflt : Number(process.argv[i + 1])
}
const pop = arg('pop', 100)
const ticks = arg('ticks', 300)

const OLD = require(path.join(here, 'baseline-engine.cjs'))
const NEW = require(path.join(here, '../engine.js'))
OLD.initCrypto(); NEW.initCrypto()

// One scenario, built once; each engine walks its own private copy so the
// two runs share not a single object.
const { state, ids, worldId } = buildScenario(NEW, (await import(path.join(here, '../worldgen.mjs'))).buildWorld, pop)
let sOld = JSON.parse(JSON.stringify(state))
let sNew = JSON.parse(JSON.stringify(state))
if (OLD.stateHash(sOld) !== NEW.stateHash(sNew)) {
  console.error('FAIL: engines disagree on the genesis state hash'); process.exit(1)
}

const prevByPlayer = new Map()
let inputsSeen = 0, invalidSeen = 0
const t0 = Date.now()
for (let t = 0; t < ticks; t++) {
  const tick = sNew.tick
  const inputs = inputsForTick(NEW, ids, worldId, tick, prevByPlayer)
  for (const inp of inputs) {
    const vo = OLD.verifyInputSig(inp)
    const vn = NEW.verifyInputSig(inp)
    if (vo !== vn) {
      console.error(`FAIL tick ${tick}: admission verdicts differ (old=${vo} new=${vn}) for`, JSON.stringify(inp))
      process.exit(1)
    }
    inputsSeen++; if (!vn) invalidSeen++
  }
  sOld = OLD.nextState(sOld, inputs)
  sNew = NEW.nextState(sNew, inputs)
  const ho = OLD.stateHash(sOld)
  const hn = NEW.stateHash(sNew)
  if (ho !== hn) {
    console.error(`FAIL at tick ${tick}:`)
    console.error(`  old resulting hash: ${ho}`)
    console.error(`  new resulting hash: ${hn}`)
    console.error(`  ordered input bundle (${inputs.length} inputs):`)
    console.error(JSON.stringify(inputs, null, 1).slice(0, 4000))
    process.exit(1)
  }
  if ((t + 1) % 50 === 0)
    process.stderr.write(`  tick ${t + 1}/${ticks} in agreement (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`)
}

const verrOld = OLD.validateState(sOld), verrNew = NEW.validateState(sNew)
if (verrOld || verrNew) { console.error('FAIL: final state invalid:', verrOld, verrNew); process.exit(1) }

console.log(`PASS: ${ticks} ticks × ${pop} citizens — every admission verdict and every per-tick`)
console.log(`state hash identical across engines. ${inputsSeen} inputs judged (${invalidSeen} invalid),`)
console.log(`final hash ${NEW.stateHash(sNew)}`)
console.log('new-engine counters:', JSON.stringify(NEW.perfStats()))
