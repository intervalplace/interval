// Remaining-fixes brief, Priority 6 — the consensus-safety test batch.
// Every test here corresponds to a rule in CONSENSUS.md.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import E from '../engine.js'
import * as P from '../protocol.mjs'
import { IntervalAgreement } from '../agreement.mjs'
import { readAll } from '../node.mjs'

const RULES = 'c'.repeat(64)
const w1 = E.generateIdentity(), w2 = E.generateIdentity(), w3 = E.generateIdentity(), w4 = E.generateIdentity()
const alice = E.generateIdentity()

function makeWorld({ witnesses = [w1, w2, w3], quorum = 2, byzantineTolerance } = {}) {
  const genesis = E.makeGenesis('safety-seed', RULES, 0, 40, 30)
  genesis.witnesses = witnesses.map(w => w.playerId)
  genesis.quorum = quorum
  // largest Byzantine threshold this (n,q) safely carries, or 0
  genesis.byzantineTolerance = byzantineTolerance ?? (() => {
    for (let f = E.maxByzantine(genesis.witnesses.length); f >= 0; f--)
      if (E.byzantineSafe(genesis.witnesses.length, quorum, f)) return f
    return 0
  })()
  const worldId = E.worldId(genesis)
  const build = () => {
    const s = E.newWorld(genesis)
    E.addPlayer(s, alice.playerId, 5, 5)
    return s
  }
  return { genesis, worldId, build }
}

function makeWitness(world, witnessKey, { lockStore, clock = { t: 0 }, sink = [] } = {}) {
  const holder = { state: world.build(), finalized: [] }
  const ag = new IntervalAgreement({
    genesis: world.genesis, worldId: world.worldId, name: 'w', witnessKey, lockStore,
    getState: () => holder.state,
    setState: (n) => { holder.state = n },
    publish: (kind, obj) => sink.push({ kind, obj }),
    onFinalized: (r) => holder.finalized.push(r),
    now: () => clock.t, allowEphemeralStores: true,
    log: () => {},
  })
  ag._holder = holder
  ag._clock = clock
  ag._sink = sink
  return ag
}

const signMove = (world, tick, dx) =>
  E.signInput({ worldId: world.worldId, playerId: alice.playerId, tick, type: 'move', dx, dy: 0 }, alice.privateKey)

test('LOCK-2: a witness never signs conflicting bundles ACROSS rounds of one tick', () => {
  const world = makeWorld()
  const w = makeWitness(world, w2) // w2: a witness that (likely) isn't every round's proposer
  w._clock.t = 700 // round 0 open
  const prev = w.prevHash
  const p0 = P.proposerFor(world.genesis, world.worldId, prev, 0, 0)
  const p1 = P.proposerFor(world.genesis, world.worldId, prev, 0, 1)
  const key = (pid) => [w1, w2, w3].find(k => k.playerId === pid)
  const A = P.makeBundle({ worldId: world.worldId, tick: 0, round: 0, previousStateHash: prev, inputs: [], witness: key(p0) })
  w.onBundle(A)
  assert.equal(w.lock?.bundleHash, P.bundleHash(A), 'locked on the round-0 bundle')
  const signedA = w._sink.filter(m => m.kind === 'attestation' && m.obj.witness === w2.playerId)
  // round 1 opens with a DIFFERENT bundle from the legitimate round-1 proposer
  w._clock.t = 1300
  const B = P.makeBundle({ worldId: world.worldId, tick: 0, round: 1, previousStateHash: prev, inputs: [signMove(world, 0, 1)], witness: key(p1) })
  w.onBundle(B)
  const signedB = w._sink.filter(m => m.kind === 'attestation' && m.obj.witness === w2.playerId && m.obj.bundleHash === P.bundleHash(B))
  assert.equal(signedB.length, 0, 'the lock forbids signing a different hash at ANY round')
  assert.equal(w.lock.bundleHash, P.bundleHash(A), 'the lock stands')
  // …but the SAME locked bundle may be re-attested freely
  const before = w._sink.length
  w.onBundle(JSON.parse(JSON.stringify(A)))
  assert.ok(w._sink.slice(before).some(m => m.kind === 'attestation' && m.obj.bundleHash === P.bundleHash(A)), 'identical bundle → rebroadcast allowed')
})

test('unsafe quorum (2q <= n) is rejected at construction AND by the verifier', () => {
  const bad = makeWorld({ witnesses: [w1, w2, w3, w4], quorum: 2 }) // two disjoint pairs possible
  assert.throws(() => makeWitness(bad, w1), /unsafe quorum/)
  assert.equal(P.quorumSafe(bad.genesis), false)
  assert.match(P.verifyFinalityProof(bad.genesis, bad.worldId, { tick: 0 }) ?? '', /unsafe quorum/)
  assert.ok(P.quorumSafe(makeWorld({ witnesses: [w1], quorum: 1 }).genesis), 'solo n=1 q=1 is safe')
  assert.ok(P.quorumSafe(makeWorld().genesis), 'n=3 q=2 is safe')
})

test('LOCK-3: a restarted witness reloads its vote and never signs a rival bundle', () => {
  const world = makeWorld()
  let mem = null
  const lockStore = { save: (l) => { mem = JSON.parse(JSON.stringify(l)) }, load: () => mem }
  const key = (pid) => [w1, w2, w3].find(k => k.playerId === pid)

  const w = makeWitness(world, w2, { lockStore })
  w._clock.t = 700
  const prev = w.prevHash
  const A = P.makeBundle({ worldId: world.worldId, tick: 0, round: 0, previousStateHash: prev, inputs: [], witness: key(P.proposerFor(world.genesis, world.worldId, prev, 0, 0)) })
  w.onBundle(A)
  assert.ok(mem, 'the lock was persisted BEFORE the vote broadcast')
  assert.equal(mem.bundleHash, P.bundleHash(A))

  // crash. restart with the same disk and the same (unfinalized) state.
  const w9 = makeWitness(world, w2, { lockStore })
  w9._clock.t = 1300
  assert.equal(w9.lock?.bundleHash, P.bundleHash(A), 'lock restored from disk')
  const B = P.makeBundle({ worldId: world.worldId, tick: 0, round: 1, previousStateHash: prev, inputs: [signMove(world, 0, 1)], witness: key(P.proposerFor(world.genesis, world.worldId, prev, 0, 1)) })
  w9.onBundle(B)
  assert.equal(w9._sink.filter(m => m.kind === 'attestation' && m.obj.bundleHash === P.bundleHash(B)).length, 0, 'after restart: rebroadcast only, never a second vote')
  // the restarted witness still helps finalize its ORIGINAL vote
  const others = [w1, w3].map(wk => P.makeAttestation({ worldId: world.worldId, tick: 0, round: 0, bundleHash: P.bundleHash(A), resultingStateHash: w9.proposals.get(P.bundleHash(A))?.rsh ?? E.stateHash(E.nextState(w9._holder.state, [])), witness: wk }))
  w9.onBundle(JSON.parse(JSON.stringify(A))) // re-verify A after restart
  for (const a of others) w9.onAttestation(a)
  assert.equal(w9._holder.state.tick, 1, 'the original vote finalizes')
})

test('proposer equivocation: two signed bundles for one (tick, round) → evidence, refusal, next round advances', () => {
  const world = makeWorld()
  const w = makeWitness(world, w2)
  w._clock.t = 700
  const prev = w.prevHash
  const p0key = [w1, w2, w3].find(k => k.playerId === P.proposerFor(world.genesis, world.worldId, prev, 0, 0))
  if (p0key.playerId === w2.playerId) { // ensure the observer-witness isn't the equivocator itself
    // then judge from w3's seat instead
  }
  const judge = p0key.playerId === w2.playerId ? makeWitness(world, w3) : w
  judge._clock.t = 700
  const A = P.makeBundle({ worldId: world.worldId, tick: 0, round: 0, previousStateHash: prev, inputs: [], witness: p0key })
  const B = P.makeBundle({ worldId: world.worldId, tick: 0, round: 0, previousStateHash: prev, inputs: [signMove(world, 0, 1)], witness: p0key })
  judge.onBundle(A)
  judge.onBundle(B)
  assert.equal(judge.proposerEquivocations.length, 1, 'evidence recorded')
  const ev = judge.proposerEquivocations[0]
  assert.equal(ev.type, 'proposer-equivocation')
  assert.equal(ev.proposer, p0key.playerId)
  assert.notEqual(P.bundleHash(ev.bundleA), P.bundleHash(ev.bundleB))
  assert.equal(judge.lock?.bundleHash, P.bundleHash(A), 'first vote stands; the later bundle was never processed')
  assert.ok(judge.poisonedProposers.has(p0key.playerId), 'the equivocator is ignored for the rest of the tick')
})

test('a certificate mixing rounds is refused everywhere (the one verifier)', () => {
  const world = makeWorld()
  const w = makeWitness(world, w1)
  w._clock.t = 700
  const prev = w.prevHash
  const p0key = [w1, w2, w3].find(k => k.playerId === P.proposerFor(world.genesis, world.worldId, prev, 0, 0))
  const A = P.makeBundle({ worldId: world.worldId, tick: 0, round: 0, previousStateHash: prev, inputs: [], witness: p0key })
  const rsh = E.stateHash(E.nextState(w._holder.state, []))
  const att = (wk, round) => P.makeAttestation({ worldId: world.worldId, tick: 0, round, bundleHash: P.bundleHash(A), resultingStateHash: rsh, witness: wk })
  const canon = (list) => list.sort((a, b) => a.witness < b.witness ? -1 : 1) // canonical proof order
  const good = { tick: 0, round: 0, previousStateHash: prev, bundleHash: P.bundleHash(A), resultingStateHash: rsh, bundle: A, attestations: canon([att(w1, 0), att(w2, 0)]) }
  assert.equal(P.verifyFinalityProof(world.genesis, world.worldId, good), null)
  // canonical form: shuffled or oversized attestation sets are refused
  assert.equal(P.verifyFinalityProof(world.genesis, world.worldId, { ...good, attestations: [...good.attestations].reverse() }), 'non-canonical proof: attestations not in witness order')
  assert.equal(P.verifyFinalityProof(world.genesis, world.worldId, { ...good, attestations: canon([att(w1, 0), att(w2, 0), att(w3, 0)]) }), 'non-canonical proof: need exactly quorum attestations')
  // attestation at a different round than the bundle's
  const mixed = { ...good, attestations: canon([att(w1, 0), att(w2, 1)]) }
  assert.equal(P.verifyFinalityProof(world.genesis, world.worldId, mixed), 'attestation for different round')
  // record claiming a different round than its bundle
  const wrongRecRound = { ...good, round: 1, attestations: canon([att(w1, 1), att(w2, 1)]) }
  assert.equal(P.verifyFinalityProof(world.genesis, world.worldId, wrongRecRound), 'bundle round does not match record')
  // a quorum "certifying" a bundle from the WRONG proposer is refused:
  // replay never bypasses proposer verification just because a quorum exists
  const wrongProposerKey = [w1, w2, w3].find(k => k.playerId !== p0key.playerId)
  const Bad = P.makeBundle({ worldId: world.worldId, tick: 0, round: 0, previousStateHash: prev, inputs: [], witness: wrongProposerKey })
  const badAtt = (wk) => P.makeAttestation({ worldId: world.worldId, tick: 0, round: 0, bundleHash: P.bundleHash(Bad), resultingStateHash: rsh, witness: wk })
  const usurped = { tick: 0, round: 0, previousStateHash: prev, bundleHash: P.bundleHash(Bad), resultingStateHash: rsh, bundle: Bad, attestations: canon([badAtt(w1), badAtt(w2)]) }
  assert.equal(P.verifyFinalityProof(world.genesis, world.worldId, usurped), 'bundle proposer is not the constitutional proposer')
  // and a record with no bundle at all proves nothing
  assert.equal(P.verifyFinalityProof(world.genesis, world.worldId, { ...good, bundle: undefined }), 'record carries no bundle')
})

test('oversized streams abort mid-read, before allocation grows unbounded', async () => {
  async function* firehose() {
    for (let i = 0; i < 1000; i++) yield Buffer.alloc(1024, 0x41)
  }
  await assert.rejects(() => readAll(firehose(), 10 * 1024), /exceeded 10240 bytes/)
  // a compliant stream in many small chunks reads fine (no one-chunk assumption)
  async function* trickle() { yield Buffer.from('{"from"'); yield Buffer.from(':0,"to"'); yield Buffer.from(':5}') }
  assert.deepEqual(JSON.parse((await readAll(trickle(), 1024)).toString()), { from: 0, to: 5 })
})

test('the bundle cap never splits a player\'s equivocation pair', () => {
  const world = makeWorld()
  const players = [E.generateIdentity(), E.generateIdentity(), E.generateIdentity()]
    .sort((a, b) => a.playerId < b.playerId ? -1 : 1)
  const byPlayer = new Map()
  const put = (id, input) => {
    if (!byPlayer.has(id.playerId)) byPlayer.set(id.playerId, new Map())
    byPlayer.get(id.playerId).set(P.inputHash(input), input)
  }
  const sig = (id, extra) => E.signInput({ worldId: world.worldId, playerId: id.playerId, tick: 0, ...extra }, id.privateKey)
  put(players[0], sig(players[0], { type: 'stop' }))
  put(players[1], sig(players[1], { type: 'move', dx: 1, dy: 0 }))  // an equivocation pair
  put(players[1], sig(players[1], { type: 'move', dx: -1, dy: 0 }))
  put(players[2], sig(players[2], { type: 'stop' }))
  const picked = P.selectBundleInputs(byPlayer, 2)
  assert.equal(picked.length, 1, 'the pair would not fit whole at cap 2, so it is wholly excluded')
  assert.equal(picked[0].playerId, players[0].playerId)
  const picked3 = P.selectBundleInputs(byPlayer, 3)
  assert.equal(picked3.length, 3, 'cap 3 fits player0 + the whole pair')
  assert.equal(picked3.filter(i => i.playerId === players[1].playerId).length, 2, 'both sides of the pair, or neither')
  // input equivocation evidence object
  const pair = [...byPlayer.get(players[1].playerId).values()]
  const ev = P.inputEquivocationEvidence(pair[0], pair[1])
  assert.equal(ev.type, 'input-equivocation')
  assert.ok(P.inputHash(ev.inputA) < P.inputHash(ev.inputB), 'evidence is canonically ordered')
})

test('engine: canonical rejects non-encodable values; validateState rejects hostile states', () => {
  for (const bad of [{ a: NaN }, { a: Infinity }, { a: -Infinity }, [undefined], { d: new Date() }, { f: () => {} }])
    assert.throws(() => E.canonical(bad), /canonical/)
  assert.equal(E.canonical({ b: 2, a: 1 }), '{"a":1,"b":2}', 'sane objects still encode')

  const world = makeWorld()
  const good = world.build()
  assert.equal(E.validateState(good), null)
  const cases = [
    [s => { s.players[alice.playerId].x = -1 }, /out of bounds/],
    [s => { s.players[alice.playerId].skills.woodcutting = -5 }, /xp out of bounds/],
    [s => { s.players[alice.playerId].skills.woodcutting = 2 ** 53 }, /xp out of bounds/],
    [s => { s.players[alice.playerId].inventory[0] = { item: 'x'.repeat(99), qty: 1 } }, /inventory slot/],
    [s => { s.players[alice.playerId].inventory[0] = { item: 'logs', qty: 0 } }, /inventory slot/],
    [s => { s.players[alice.playerId].inventory = s.players[alice.playerId].inventory.slice(0, 27) }, /inventory length/],
    [s => { s.players[alice.playerId].bank = { 'DROP TABLE': 3 } }, /bank item/],
    [s => { s.tick = 1.5 }, /bad tick/],
    [s => { s.mobs.evil = { type: 'goblin', x: 5, y: 5, hx: 5, hy: 5, hp: NaN, respawnAt: 0 } }, /mob hp/],
    [s => { s.mobs.evil = { type: 'rat', x: 5, y: 5, hx: 5, hy: 5, hp: 3, respawnAt: 0 } }, /unknown mob type/],
  ]
  for (const [mutate, want] of cases) {
    const s = world.build()
    mutate(s)
    assert.match(E.validateState(s) ?? '', want)
  }
})
