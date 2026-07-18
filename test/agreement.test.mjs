// Milestone 4/5 acceptance tests (fix brief Phase 1/4/9 test lists).
// The agreement layer takes an injected clock and publish callback, so a
// whole witness network runs here in-process with a controllable
// transport: delay, drop, and partition are one array-filter away.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import E from '../engine.js'
import * as P from '../protocol.mjs'
import { IntervalAgreement } from '../agreement.mjs'

const RULES = 'c'.repeat(64)
const w1 = E.generateIdentity(), w2 = E.generateIdentity(), w3 = E.generateIdentity()
const alice = E.generateIdentity()

// A tiny in-process witness network with a controllable clock + transport.
function makeNet({ witnesses = [w1, w2, w3], quorum = 2, observers = 0, byzantineTolerance } = {}) {
  const genesis = E.makeGenesis('agree-seed', RULES, 0, 40, 30)
  genesis.witnesses = witnesses.map(w => w.playerId)
  genesis.quorum = quorum
  // largest Byzantine threshold this (n,q) safely carries, or 0
  genesis.byzantineTolerance = byzantineTolerance ?? (() => {
    for (let f = E.maxByzantine(genesis.witnesses.length); f >= 0; f--)
      if (E.byzantineSafe(genesis.witnesses.length, quorum, f)) return f
    return 0
  })()
  const worldId = E.worldId(genesis)
  const clock = { t: 0 }
  const net = { nodes: [], partition: null, dropBundlesFrom: new Set(), log: [] }

  const build = () => {
    const s = E.newWorld(genesis)
    E.addPlayer(s, alice.playerId, 5, 5)
    E.addNode(s, 'tree-1', 'tree', 4, 5)
    return s
  }
  const mk = (witnessKey, name) => {
    const holder = { state: build(), finalized: [] }
    const ag = new IntervalAgreement({
      genesis, worldId, name, witnessKey,
      getState: () => holder.state,
      setState: (next) => { holder.state = next },
      publish: (kind, obj) => net.deliver(ag, kind, obj),
      onFinalized: (record) => holder.finalized.push(record),
      now: () => clock.t, allowEphemeralStores: true,
      log: (l) => net.log.push(`[${name}] ${l}`),
    })
    ag._holder = holder
    return ag
  }
  witnesses.forEach((w, i) => net.nodes.push(mk(w, 'w' + i)))
  for (let i = 0; i < observers; i++) net.nodes.push(mk(null, 'obs' + i))

  net.deliver = (from, kind, obj) => {
    if (kind === 'bundle' && net.dropBundlesFrom.has(from)) return
    const msg = JSON.parse(JSON.stringify(obj)) // over the wire: bytes, not references
    for (const n of net.nodes) {
      if (n === from) continue
      if (net.partition && net.partition(from, n)) continue
      if (kind === 'bundle') n.onBundle(msg)
      else if (kind === 'attestation') n.onAttestation(msg)
      else n.onFinality(msg)
    }
  }
  net.genesis = genesis
  net.worldId = worldId
  net.clock = clock
  // step wall-clock forward and let every driver act
  net.run = (ms, stepMs = 100) => {
    for (let el = 0; el < ms; el += stepMs) {
      clock.t += stepMs
      for (const n of net.nodes) n.drive()
    }
  }
  net.sign = (fields) => E.signInput({ worldId, playerId: alice.playerId, ...fields }, alice.privateKey)
  return net
}

test('an input on opposite sides of the local boundary still yields ONE finalized bundle', () => {
  const net = makeNet()
  const [a, b, c] = net.nodes
  const move = net.sign({ tick: 0, type: 'move', dx: 1, dy: 0 })
  a.addInput(move)            // node a saw it "before the boundary"
  net.run(700)                // boundary passes; b and c never saw the raw input
  // whichever witness proposed, all three finalized the same bundle & state
  for (const n of net.nodes) assert.equal(n._holder.state.tick, 1, `${n.name} finalized tick 0`)
  const recs = net.nodes.map(n => n._holder.finalized[0])
  assert.equal(new Set(recs.map(r => r.bundleHash)).size, 1, 'one canonical bundle')
  assert.equal(new Set(recs.map(r => r.resultingStateHash)).size, 1, 'one certified result')
  // the input applied everywhere IF the proposer had it, nowhere otherwise —
  // and since a is not guaranteed proposer, assert only cross-node equality
  const xs = net.nodes.map(n => n._holder.state.players[alice.playerId].x)
  assert.equal(new Set(xs).size, 1)
})

test('empty intervals produce one certified empty bundle, not local improvisation', () => {
  const net = makeNet()
  net.run(700)
  for (const n of net.nodes) {
    const r = n._holder.finalized[0]
    assert.ok(r, `${n.name} finalized`)
    assert.equal(r.bundle.inputs.length, 0)
    assert.ok(r.attestations.length >= net.genesis.quorum)
    assert.equal(P.verifyFinalityProof(net.genesis, net.worldId, r), null)
  }
})

test('proposer disappears: the next deterministic round finalizes', () => {
  const net = makeNet()
  // find who proposes round 0 for tick 0 and silence their bundles
  const prev = net.nodes[0].prevHash
  const r0 = P.proposerFor(net.genesis, net.worldId, prev, 0, 0)
  const dead = net.nodes.find(n => n.witnessKey?.playerId === r0)
  net.dropBundlesFrom.add(dead)
  net.run(700)
  const alive = net.nodes.filter(n => n !== dead)
  for (const n of alive) assert.equal(n._holder.state.tick, 0, 'round 0 cannot finalize without its proposal')
  net.run(700) // round 1 window opens: the next witness in canonical order proposes
  for (const n of alive) {
    assert.ok(n._holder.state.tick >= 1, `${n.name} finalized via fallback round`)
    assert.equal(n._holder.finalized[0].round, 1, 'tick 0 was certified in round 1, not round 0')
  }
})

test('short partition converges by rebroadcast; a multi-round lock split stalls WITHOUT forking (H2)', () => {
  // A: the proposer is briefly cut off — its lock rebroadcast converges everyone
  const netA = makeNet()
  netA.partition = () => true
  netA.run(700)                    // round 0 proposer proposed + locked; nobody else saw it
  const lockedA = netA.nodes.filter(n => n.lock)
  assert.equal(lockedA.length, 1, 'only the round-0 proposer locked')
  netA.partition = null
  netA.run(700)                    // rebroadcast (every RT/2) delivers the locked bundle
  for (const n of netA.nodes) assert.ok(n._holder.state.tick >= 1, `${n.name} converged on the early lock`)
  const hA = netA.nodes.map(n => n._holder.finalized[0].resultingStateHash)
  assert.equal(new Set(hA).size, 1, 'one chain')

  // B: total isolation through THREE rounds — every witness locks its own
  // bundle. 1-1-1 can never reach quorum 2: the tick stalls permanently.
  // CONSENSUS.md §8 H2: liveness is sacrificed, never safety.
  const netB = makeNet()
  netB.partition = () => true
  // rounds now open with EXPONENTIAL backoff (adversarial-sim finding):
  // round r starts at due + roundStartMs(r) — run until round 2 has opened
  netB.run(600 + P.roundStartMs(2) + 200)
  assert.equal(netB.nodes.filter(n => n.lock).length, 3, 'three witnesses, three locks')
  assert.equal(new Set(netB.nodes.map(n => n.lock.bundleHash)).size, 3, 'all on different bundles')
  netB.partition = null
  netB.run(4000)                   // heal: rebroadcasts fly, locks hold
  for (const n of netB.nodes) {
    assert.equal(n._holder.state.tick, 0, `${n.name} stays at tick 0: locks are never released`)
    assert.equal(n.halted, false, 'a stall is not a halt')
  }
  // and no witness ever signed two hashes for the tick — count signatures
  for (const n of netB.nodes)
    for (const [bh, m] of n.atts)
      for (const w of netB.nodes.filter(x => x.witnessKey))
        if (m.has(w.witnessKey.playerId))
          assert.equal(bh === w.lock.bundleHash, true, 'every signature matches its signer\'s lock')
})

test('equivocation: X to half the witnesses, Y to the other half — one deterministic outcome', () => {
  const net = makeNet()
  const [a, b, c] = net.nodes
  const X = net.sign({ tick: 0, type: 'move', dx: 1, dy: 0 })
  const Y = net.sign({ tick: 0, type: 'move', dx: -1, dy: 0 })
  a.addInput(X); b.addInput(X)
  c.addInput(Y)
  net.run(2000)
  // no conflicting state finalizes; the engine's duplicate rule excludes the
  // player when the certified bundle carries both versions, and applies one
  // version when the proposer saw only one — either way, ONE certified result
  const recs = net.nodes.map(n => n._holder.finalized[0])
  assert.equal(new Set(recs.map(r => r.resultingStateHash)).size, 1)
  const xs = net.nodes.map(n => n._holder.state.players[alice.playerId].x)
  assert.equal(new Set(xs).size, 1, 'every node agrees where alice stands')
  // and the evidence rule: a bundle carrying both versions is valid, carrying
  // three is not
  const st = net.nodes[0]._holder.state, tk = st.tick, prev = net.nodes[0].prevHash
  const both = P.makeBundle({ worldId: net.worldId, tick: tk, round: 0, previousStateHash: prev, inputs: [net.sign({ tick: tk, type: 'move', dx: 1, dy: 0 }), net.sign({ tick: tk, type: 'stop' })], witness: w1 })
  assert.equal(P.validateBundle(st, net.worldId, both, null), null)
  const three = P.makeBundle({ worldId: net.worldId, tick: tk, round: 0, previousStateHash: prev, inputs: [net.sign({ tick: tk, type: 'move', dx: 1, dy: 0 }), net.sign({ tick: tk, type: 'stop' }), net.sign({ tick: tk, type: 'move', dx: 0, dy: 1 })], witness: w1 })
  assert.equal(P.validateBundle(st, net.worldId, three, null), 'equivocation cap exceeded')
})

test('a wrong-lineage or forged bundle is rejected; a jumped round is rejected', () => {
  const net = makeNet()
  const n0 = net.nodes[0]
  net.run(100) // round 0 open
  const forged = P.makeBundle({ worldId: net.worldId, tick: 0, round: 0, previousStateHash: n0.prevHash, inputs: [], witness: alice }) // alice is no witness
  n0.onBundle(forged)
  assert.equal(n0.proposals.size, 0, 'non-proposer bundle refused')
  const badPrev = P.makeBundle({ worldId: net.worldId, tick: 0, round: 0, previousStateHash: 'e'.repeat(64), inputs: [], witness: w1 })
  n0.onBundle(badPrev)
  assert.equal(n0.proposals.size, 0, 'wrong lineage refused')
  const early = P.makeBundle({ worldId: net.worldId, tick: 0, round: 5, previousStateHash: n0.prevHash, inputs: [], witness: w1 })
  n0.onBundle(early)
  assert.equal(n0.proposals.size, 0, 'a round cannot be jumped early')
})

test('finality proof: sub-quorum, non-witness, and duplicate-witness proofs are refused', () => {
  const net = makeNet()
  net.run(700)
  const rec = net.nodes[0]._holder.finalized[0]
  assert.equal(P.verifyFinalityProof(net.genesis, net.worldId, rec), null)
  assert.equal(P.verifyFinalityProof(net.genesis, net.worldId, { ...rec, attestations: rec.attestations.slice(0, 1) }), 'non-canonical proof: need exactly quorum attestations')
  const dup = { ...rec, attestations: [rec.attestations[0], rec.attestations[0]] }
  assert.equal(P.verifyFinalityProof(net.genesis, net.worldId, dup), 'non-canonical proof: attestations not in witness order')
  const outsider = P.makeAttestation({ worldId: net.worldId, tick: rec.tick, round: rec.round, bundleHash: rec.bundleHash, resultingStateHash: rec.resultingStateHash, witness: alice })
  const two = [rec.attestations[0], outsider].sort((x, y) => x.witness < y.witness ? -1 : 1)
  assert.equal(P.verifyFinalityProof(net.genesis, net.worldId, { ...rec, attestations: two }), 'attestation from non-witness')
  const tampered = JSON.parse(JSON.stringify(rec))
  tampered.attestations[0].resultingStateHash = 'f'.repeat(64)
  assert.notEqual(P.verifyFinalityProof(net.genesis, net.worldId, tampered), null)
})

test('an observer finalizes from certified records and replays them, never adopting raw state', () => {
  const net = makeNet({ observers: 1 })
  const obs = net.nodes[3]
  assert.equal(obs.witnessKey, null)
  net.run(1400) // two intervals
  assert.equal(obs._holder.state.tick, 2, 'observer follows the certified chain')
  // a record claiming a result the bundle does not produce HALTS the observer
  const net2 = makeNet({ observers: 1 })
  const obs2 = net2.nodes[3]
  net2.partition = (from, to) => to === obs2 // starve the observer of everything
  net2.run(700)
  assert.equal(obs2._holder.state.tick, 0)
  const rec = net2.nodes[0]._holder.finalized[0]
  const lie = JSON.parse(JSON.stringify(rec))
  lie.resultingStateHash = 'a'.repeat(64)
  assert.notEqual(obs2.onFinality(lie), null, 'a forged result cannot carry a valid proof')
  assert.equal(obs2.halted, false)
  assert.equal(obs2.onFinality(rec), null, 'the honest record replays cleanly')
  assert.equal(obs2._holder.state.tick, 1)
})

test('local mismatch with a certified result halts the node instead of forking it', () => {
  const net = makeNet({ observers: 1 })
  const obs = net.nodes[3]
  net.partition = (from, to) => to === obs
  net.run(700)
  const rec = net.nodes[0]._holder.finalized[0]
  // simulate a corrupted local implementation: the observer's state drifted
  obs._holder.state.players[alice.playerId].hp = 9
  obs.prevHash = E.stateHash(obs._holder.state)
  const fake = JSON.parse(JSON.stringify(rec))
  fake.previousStateHash = obs.prevHash // lineage matches its (corrupt) state…
  // …but the proof does not certify this altered record
  assert.notEqual(obs.onFinality(fake), null)
  // now the deeper case: proof valid, lineage valid, but local replay of the
  // certified bundle computes a different result → HALT (fix brief §3.5)
  const net3 = makeNet()
  net3.partition = () => true
  net3.run(700) // round 0 proposer proposed to itself and locked
  const w = net3.nodes.find(n => n.proposals.size > 0)
  assert.ok(w, 'someone proposed')
  const bh = [...w.proposals.keys()][0]
  const p = w.proposals.get(bh)
  const liarKeys = [w1, w2, w3].filter(k => k.playerId !== w.witnessKey.playerId)
  const liars = liarKeys.map(wk => P.makeAttestation({
    worldId: net3.worldId, tick: 0, round: p.bundle.round,
    bundleHash: bh, resultingStateHash: 'd'.repeat(64), witness: wk,
  }))
  for (const a of liars) w.onAttestation(a)
  assert.equal(w.halted, true, 'a quorum certifying an unreproducible result halts us')
  assert.equal(w.haltCode, 'HALT_CERTIFIED_RESULT_MISMATCH', 'the halt is a certified-result mismatch, not proposer equivocation')
  assert.match(w.haltReason, /local replay produced/)
  // the halt carries the full quorum as evidence (§4)
  assert.ok(Array.isArray(w.haltEvidence.certifyingAttestations) && w.haltEvidence.certifyingAttestations.length >= net3.genesis.quorum, 'certifying quorum attached as evidence')
  assert.ok(w.haltEvidence.localResult && w.haltEvidence.certifiedResult && w.haltEvidence.localResult !== w.haltEvidence.certifiedResult)
})
