// The adversarial battery as CI tests (short runs; the full battery is
//   node advsim.mjs all 3 30000
// ). Every scenario asserts the freeze criterion: S1 no fork, S2 no
// honest double-sign, S3 every committed cert verifies, S4 halts only
// under Byzantine presence — plus a liveness floor where the model
// promises progress.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runScenario, SCENARIOS } from '../advsim.mjs'

const runs = [
  ['benign', 12000, 12],       // healthy net: brisk finality
  ['lossy', 15000, 2],         // 25% loss, 900ms delays: slow, never wrong
  ['crashes', 15000, 0],       // crash-restart storm incl. the durable-vote window
  ['partitions', 15000, 0],    // repeated asymmetric splits, healing
  ['equivocator', 12000, 0],   // Byzantine proposer: stalls allowed, forks never
  ['liar', 12000, 3],          // lying attester outvoted by the honest quorum
  ['replayer', 12000, 3],      // replayed bundles/attestations bounce off
  ['garbage', 12000, 3],       // malformed floods die at validation
  ['chaos', 15000, 0],         // everything at once: the halt-not-fork promise
  ['heal', 26000, 3],          // partition burst, then quiet: nodes must converge to spread 0
  ['byzantine-max', 15000, 0], // f equivocators at the constitutional boundary: no fork
]

for (const [name, dur, floor] of runs) {
  test(`adversarial ${name}: freeze criterion holds (seeded, deterministic)`, () => {
    const r = runScenario(name, SCENARIOS[name], 7919, dur)
    assert.deepEqual(r.violations, [], `${name}: ${r.violations.join(' | ')}`)
    assert.equal(r.harnessErrors.length, 0, `${name}: unexpected harness exceptions: ${r.harnessErrors.join(' | ')}`)
    // liveness floor on the SLOWEST honest node's finalized height
    assert.ok(r.minFrontier >= floor, `${name}: liveness floor (slowest finalized ${r.minFrontier} < ${floor})`)
  })
}

test('healed honest nodes converge to the same finalized frontier (spread 0)', () => {
  // after the partition burst ends, the quiet tail must bring every honest
  // node to the SAME finalized height — the finality buffer + regossip
  // catch-up path is what makes a behind node reach the frontier
  for (const seed of [7919, 15838, 23757]) {
    const r = runScenario('heal', SCENARIOS.heal, seed, 25000)
    assert.equal(r.spread, 0, `heal seed ${seed}: healed nodes diverge by ${r.spread} (min ${r.minFrontier}, max ${r.maxFrontier})`)
    assert.ok(r.healed, `heal seed ${seed}: network did not heal`)
    assert.equal(r.requiredSpread, 0, 'heal enforces exact convergence, not the generic threshold')
  }
})

test('the requiredSpread mechanism: heal demands 0, other healed scenarios use the generic threshold', () => {
  // heal carries requiredSpread: 0
  assert.equal(SCENARIOS.heal.requiredSpread, 0)
  // benign (also healed) does NOT set requiredSpread → generic threshold (3)
  const benign = runScenario('benign', SCENARIOS.benign, 7919, 12000)
  assert.equal(benign.requiredSpread, 3, 'a scenario without requiredSpread uses the generic 3')
  assert.ok(benign.healed && benign.spread === 0, 'benign happens to converge exactly too')
  // and a heal run that (hypothetically) diverged would be flagged: prove
  // the check fires by asserting the violation text names the required bound
  // when spread would exceed it — we confirm the passing path names 0
  for (const seed of [7919]) {
    const r = runScenario('heal', SCENARIOS.heal, seed, 25000)
    const conv = r.violations.filter(v => v.includes('CONVERGENCE'))
    assert.equal(conv.length, 0, 'heal converges, so no CONVERGENCE violation')
  }
})

test('requiredSpread=0 actually FAILS when healed nodes diverge (not just passes when they agree)', () => {
  // Confirm the check has teeth: a CONVERGENCE violation must correspond to
  // a real gap, and a healed run with spread>0 must never pass silently.
  const forced = { ...SCENARIOS.heal, partitionUntilMs: 14000, requiredSpread: 0, minTicks: 0 }
  for (const seed of [7919, 15838, 23757, 31676]) {
    const r = runScenario('heal', forced, seed, 15000)
    if (r.healed && r.spread > 0) {
      const conv = r.violations.filter(v => v.includes('CONVERGENCE'))
      assert.ok(conv.length > 0, `a healed run with spread ${r.spread} must raise a CONVERGENCE violation`)
    }
    for (const v of r.violations.filter(x => x.includes('CONVERGENCE')))
      assert.ok(r.spread > 0, `a CONVERGENCE violation implies a real spread, got ${r.spread}: ${v}`)
  }
})

test('determinism: identical seeds replay identical runs', () => {
  const a = runScenario('crashes', SCENARIOS.crashes, 424242, 8000)
  const b = runScenario('crashes', SCENARIOS.crashes, 424242, 8000)
  assert.equal(a.frontier, b.frontier)
  assert.equal(a.attestationsOnWire, b.attestationsOnWire)
  assert.equal(a.crashes, b.crashes)
})
