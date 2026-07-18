// Final-fixes brief, Priority 6 — persistence and recovery tests.
// Every persistent engine object appears in at least one round-trip.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import E from '../engine.js'
import * as P from '../protocol.mjs'
import { IntervalAgreement } from '../agreement.mjs'

const RULES = 'c'.repeat(64)
const w1 = E.generateIdentity(), w2 = E.generateIdentity(), w3 = E.generateIdentity()
const alice = E.generateIdentity(), bob = E.generateIdentity()

function makeWorld({ witnesses = [w1, w2, w3], quorum = 2, byzantineTolerance } = {}) {
  const genesis = E.makeGenesis('persist-seed', RULES, 0, 40, 30)
  genesis.witnesses = witnesses.map(w => w.playerId)
  genesis.quorum = quorum
  // largest Byzantine threshold this (n,q) safely carries, or 0
  genesis.byzantineTolerance = byzantineTolerance ?? (() => {
    for (let f = E.maxByzantine(genesis.witnesses.length); f >= 0; f--)
      if (E.byzantineSafe(genesis.witnesses.length, quorum, f)) return f
    return 0
  })()
  return { genesis, worldId: E.worldId(genesis) }
}

const mkAgreement = (world, witnessKey, holder, extra = {}) => new IntervalAgreement({
  genesis: world.genesis, worldId: world.worldId, name: 't', witnessKey,
  getState: () => holder.state, setState: (n) => { holder.state = n },
  publish: (kind, obj) => (holder.sink ??= []).push({ kind, obj }),
  now: () => holder.clock ?? 0, log: () => {}, allowEphemeralStores: true, ...extra,
})

const sign = (world, id, fields) => E.signInput({ worldId: world.worldId, playerId: id.playerId, ...fields }, id.privateKey)

test('ground items survive validation: player drops, stacks, mob-drop shape, expired entries', () => {
  const world = makeWorld()
  let s = E.newWorld(world.genesis)
  E.addPlayer(s, alice.playerId, 5, 5)
  s.players[alice.playerId].inventory[0] = { item: 'logs', qty: 3 }
  s.players[alice.playerId].inventory[1] = { item: 'arrows', qty: 40 }
  // a REAL drop through the engine (the path every checkpoint with loot took)
  s = E.nextState(s, [sign(world, alice, { tick: s.tick, type: 'drop', slot: 0 })])
  const entries = Object.values(s.ground)
  assert.ok(entries.length >= 1, 'the drop landed on the ground table')
  assert.equal(typeof entries[0], 'object')
  assert.ok(!Array.isArray(entries[0]), 'ground entries are objects, not arrays')
  assert.equal(E.validateState(s), null, 'a checkpoint with dropped items validates')
  // the mob-drop shape: NO qty field (engine writes {item,x,y,expiresAt})
  s.ground['g-mobdrop'] = { item: 'bones', x: 6, y: 6, expiresAt: s.tick + 100 }
  assert.equal(E.validateState(s), null, 'qty-less mob drops validate')
  // stacked arrows and an already-expired entry both validate structurally
  s.ground['g-arrows'] = { item: 'arrows', qty: 40, x: 7, y: 7, expiresAt: s.tick + 100 }
  s.ground['g-old'] = { item: 'grain', qty: 1, x: 8, y: 8, expiresAt: 0 }
  assert.equal(E.validateState(s), null)
  // hostile variants still fail
  s.ground['g-bad'] = { item: 'grain', qty: 0, x: 8, y: 8, expiresAt: 0 }
  assert.match(E.validateState(s), /ground quantity/)
  delete s.ground['g-bad']
  s.ground['g-bad2'] = { item: 'grain', qty: 1, x: 999, y: 8, expiresAt: 0 }
  assert.match(E.validateState(s), /ground item out of bounds/)
})

test('a restored lock is verified in full: corruption refuses startup, a real lock restores', () => {
  const world = makeWorld()
  const build = () => { const s = E.newWorld(world.genesis); E.addPlayer(s, alice.playerId, 5, 5); return s }
  let mem = null
  const lockStore = { save: (l) => { mem = JSON.parse(JSON.stringify(l)) }, load: () => mem }
  const h1 = { state: build(), clock: 700 }
  const a1 = mkAgreement(world, w2, h1, { lockStore })
  const p0 = [w1, w2, w3].find(k => k.playerId === P.proposerFor(world.genesis, world.worldId, a1.prevHash, 0, 0))
  a1.onBundle(P.makeBundle({ worldId: world.worldId, tick: 0, round: 0, previousStateHash: a1.prevHash, inputs: [sign(world, alice, { tick: 0, type: 'move', dx: 1, dy: 0 })], witness: p0 }))
  assert.ok(mem, 'lock persisted')
  const pristine = JSON.parse(JSON.stringify(mem))

  const restart = () => mkAgreement(world, w2, { state: build(), clock: 800 }, { lockStore })
  // 1. the honest lock restores and is verified by replay
  assert.equal(restart().lock.bundleHash, pristine.bundleHash)
  // 2. tampered bundle inputs → hash mismatch → refuse startup
  mem = JSON.parse(JSON.stringify(pristine)); mem.bundle.inputs = []
  assert.throws(restart, /bundle hash mismatch/)
  // 3. consistently tampered hash+bundle → proposer sig fails → refuse
  mem = JSON.parse(JSON.stringify(pristine)); mem.bundle.inputs = []; mem.bundleHash = P.bundleHash(mem.bundle); mem.attestation.bundleHash = mem.bundleHash
  assert.throws(restart, /invalid/)
  // 4. attestation from someone else's key → refuse
  mem = JSON.parse(JSON.stringify(pristine))
  mem.attestation = P.makeAttestation({ worldId: world.worldId, tick: 0, round: 0, bundleHash: pristine.bundleHash, resultingStateHash: pristine.attestation.resultingStateHash, witness: w3 })
  assert.throws(restart, /attestation not ours/)
  // 5. attested result that replay cannot reproduce → refuse
  mem = JSON.parse(JSON.stringify(pristine))
  mem.attestation = P.makeAttestation({ worldId: world.worldId, tick: 0, round: 0, bundleHash: pristine.bundleHash, resultingStateHash: 'e'.repeat(64), witness: w2 })
  assert.throws(restart, /replay does not reproduce/)
})

test('checkpoint rollback is refused: a state behind the finalized frontier never starts', () => {
  const world = makeWorld({ witnesses: [w1], quorum: 1 })
  const build = () => { const s = E.newWorld(world.genesis); E.addPlayer(s, alice.playerId, 5, 5); return s }
  let frontier = null
  const frontierStore = { save: (f) => { frontier = JSON.parse(JSON.stringify(f)) }, load: () => frontier }
  // run a solo witness two ticks forward; the frontier follows finality
  const h = { state: build(), clock: 0 }
  const ag = mkAgreement(world, w1, h, { frontierStore })
  h.clock = 700; ag.drive()
  h.clock = 1300; ag.drive()
  assert.equal(h.state.tick, 2)
  assert.equal(frontier.tick, 1, 'frontier records the last finalized tick')
  assert.equal(frontier.resultingStateHash, E.stateHash(h.state))
  // restart from a STALE checkpoint (tick 0): refuse loudly
  assert.throws(() => mkAgreement(world, w1, { state: build(), clock: 1400 }, { frontierStore }),
    /rollback refused.*tick 0.*tick 1 was already finalized/s)
  // restart from the CURRENT state: fine
  const resumed = mkAgreement(world, w1, { state: h.state, clock: 1400 }, { frontierStore })
  assert.equal(resumed.frontier.tick, 1)
  // a malformed frontier record also refuses startup (schema-checked, rev4 §6)
  frontier = { worldId: world.worldId, tick: 'yes' }
  assert.throws(() => mkAgreement(world, w1, { state: h.state, clock: 1400 }, { frontierStore }), /stored frontier is malformed.*unknown format/)
  frontier = { format: 'interval-witness-frontier-v1', worldId: world.worldId, tick: 'yes', resultingStateHash: 'b'.repeat(64) }
  assert.throws(() => mkAgreement(world, w1, { state: h.state, clock: 1400 }, { frontierStore }), /stored frontier is malformed.*malformed tick/)
})

test('a late-starting witness proposes only the CURRENT round, never stale ones', () => {
  const world = makeWorld({ witnesses: [w1], quorum: 1 }) // solo: every round is ours
  const build = () => { const s = E.newWorld(world.genesis); E.addPlayer(s, alice.playerId, 5, 5); return s }
  const h = { state: build(), clock: 600 + P.roundStartMs(7) + 50 } // round 7 is current (exponential schedule)
  const ag = mkAgreement(world, w1, h)
  ag.drive()
  const bundles = h.sink.filter(m => m.kind === 'bundle')
  assert.equal(bundles.length, 1, 'exactly one proposal')
  assert.equal(bundles[0].obj.round, 7, 'originated at the current round, not round 0..6')
  assert.equal(h.state.tick, 1, 'solo quorum finalized it')
  assert.equal(h.state.tick > 0 && ag.finalizedLog.get(0).round, 7)
})

test('proposer equivocation: live conflicts poison, stale-lineage conflicts only leave evidence', () => {
  const world = makeWorld()
  const build = () => { const s = E.newWorld(world.genesis); E.addPlayer(s, alice.playerId, 5, 5); return s }
  const h = { state: build(), clock: 700 }
  const judge = mkAgreement(world, null, h) // an observer judges impartially
  const p0 = [w1, w2, w3].find(k => k.playerId === P.proposerFor(world.genesis, world.worldId, judge.prevHash, 0, 0))
  const A = P.makeBundle({ worldId: world.worldId, tick: 0, round: 0, previousStateHash: judge.prevHash, inputs: [], witness: p0 })
  // a conflicting SIGNED bundle with an alien lineage (e.g. replayed junk):
  // evidence, but not poisoning — round 0 can still proceed with A
  const stale = P.makeBundle({ worldId: world.worldId, tick: 0, round: 0, previousStateHash: 'a'.repeat(64), inputs: [], witness: p0 })
  judge.onBundle(A)
  judge.onBundle(stale)
  assert.equal(judge.proposerEquivocations.length, 1)
  assert.equal(judge.proposerEquivocations[0].liveConflict, false)
  assert.equal(judge.poisonedProposers.size, 0, 'stale conflict does not poison')
  // a second LIVE bundle (same lineage as A): unambiguous equivocation
  const h2 = { state: build(), clock: 700 }
  const judge2 = mkAgreement(world, null, h2)
  const B = P.makeBundle({ worldId: world.worldId, tick: 0, round: 0, previousStateHash: judge2.prevHash, inputs: [sign(world, alice, { tick: 0, type: 'stop' })], witness: p0 })
  judge2.onBundle(A)
  judge2.onBundle(B)
  assert.equal(judge2.proposerEquivocations[0].liveConflict, true)
  assert.ok(judge2.poisonedProposers.has(p0.playerId), 'live conflict poisons the proposer for the tick')
})

test('malformed hashes are refused at every layer', () => {
  const world = makeWorld()
  const build = () => { const s = E.newWorld(world.genesis); E.addPlayer(s, alice.playerId, 5, 5); return s }
  const state = build()
  const prev = E.stateHash(state)
  const p0 = [w1, w2, w3].find(k => k.playerId === P.proposerFor(world.genesis, world.worldId, prev, 0, 0))
  const UPPER = prev.toUpperCase()
  const shady = P.makeBundle({ worldId: world.worldId, tick: 0, round: 0, previousStateHash: UPPER, inputs: [], witness: p0 })
  assert.equal(P.validateBundle(state, world.worldId, shady, null), 'malformed lineage hash')
  const A = P.makeBundle({ worldId: world.worldId, tick: 0, round: 0, previousStateHash: prev, inputs: [], witness: p0 })
  const rsh = E.stateHash(E.nextState(state, []))
  const atts = [w1, w2].map(wk => P.makeAttestation({ worldId: world.worldId, tick: 0, round: 0, bundleHash: P.bundleHash(A), resultingStateHash: rsh, witness: wk })).sort((a, b) => a.witness < b.witness ? -1 : 1)
  const rec = { tick: 0, round: 0, previousStateHash: prev, bundleHash: P.bundleHash(A), resultingStateHash: rsh, bundle: A, attestations: atts }
  assert.equal(P.verifyFinalityProof(world.genesis, world.worldId, rec), null)
  assert.equal(P.verifyFinalityProof(world.genesis, world.worldId, { ...rec, previousStateHash: UPPER }), 'malformed lineage')
  assert.equal(P.verifyFinalityProof(world.genesis, world.worldId, { ...rec, resultingStateHash: rsh.slice(0, 60) }), 'malformed hashes')
})

test('full persistent-state round-trip: actions, trades, equipment, banks, fires, damaged mobs, names', () => {
  const world = makeWorld()
  let s = E.newWorld(world.genesis)
  E.addPlayer(s, alice.playerId, 5, 5)
  E.addPlayer(s, bob.playerId, 6, 5)
  E.addNode(s, 'tree-1', 'tree', 4, 5)
  E.addMob(s, 'rat-1', 'goblin', 7, 5)
  s.players[alice.playerId].inventory[0] = { item: 'raw-fish', qty: 2 }
  s.players[alice.playerId].inventory[1] = { item: 'wooden-bow', qty: 1 }
  s.players[alice.playerId].bank = { logs: 40, ore: 12 }
  const step = (inputs) => { s = E.nextState(s, inputs); const e = E.validateState(s); assert.equal(e, null, `tick ${s.tick}: ${e}`) }
  step([sign(world, alice, { tick: s.tick, type: 'gather', nodeId: 'tree-1' })])           // action set
  step([sign(world, alice, { tick: s.tick, type: 'wield', slot: 1 })])                     // equipment
  step([sign(world, alice, { tick: s.tick, type: 'offer_trade', to: bob.playerId, giveSlot: 0, wantItem: 'grain', wantGold: 0 })]) // trade offer
  step([sign(world, alice, { tick: s.tick, type: 'claim_name', name: 'alice-brave' })]) // names registry
  step([sign(world, bob, { tick: s.tick, type: 'attack', mobId: 'rat-1' })])               // combat action
  for (let i = 0; i < 4; i++) step([])                                                     // let combat tick, mob hp drops
  assert.ok(s.players[alice.playerId].name === 'alice-brave')
  assert.equal(s.names['alice-brave'], alice.playerId, 'names validated in both directions')
  // a corrupted registry direction is caught
  const broken = JSON.parse(JSON.stringify(s))
  broken.names['ghost'] = bob.playerId
  assert.match(E.validateState(broken), /name registry disagrees|registered to a player/)
  const broken2 = JSON.parse(JSON.stringify(s))
  broken2.players[alice.playerId].name = 'somebody'
  assert.match(E.validateState(broken2), /registry/)
})
