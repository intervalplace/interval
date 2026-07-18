// Rev5 brief, Priority 4 — constitutional strictness and recovery
// namespacing. One name rule, one item registry, no dangling references,
// and safety records that refuse to serve the wrong world.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import E from '../engine.js'
import * as P from '../protocol.mjs'
import { IntervalAgreement, LOCK_FORMAT, FRONTIER_FORMAT } from '../agreement.mjs'
import { buildWorld } from '../worldgen.mjs'

const RULES = 'c'.repeat(64)
const w1 = E.generateIdentity()
const alice = E.generateIdentity(), bob = E.generateIdentity()

function makeWorld(seed = 'rev5-seed') {
  const genesis = E.makeGenesis(seed, RULES, 0, 40, 30)
  genesis.witnesses = [w1.playerId]
  genesis.quorum = 1; genesis.byzantineTolerance = 0
  return { genesis, worldId: E.worldId(genesis) }
}
const build = (world) => {
  const s = E.newWorld(world.genesis)
  E.addPlayer(s, alice.playerId, 5, 5)
  E.addNode(s, 'ws-east', 'waystone', 3, 3)
  E.addNode(s, 'tree-1', 'tree', 4, 5)
  E.addMob(s, 'gob-1', 'goblin', 7, 5)
  return s
}
const mk = (world, holder, extra = {}) => new IntervalAgreement({
  genesis: world.genesis, worldId: world.worldId, name: 't', witnessKey: w1,
  getState: () => holder.state, setState: (n) => { holder.state = n },
  publish: () => {}, now: () => holder.clock ?? 0,
  log: (l) => (holder.logs ??= []).push(l), allowEphemeralStores: true, ...extra,
})

test('safety records for ANOTHER world refuse startup — never silently ignored', () => {
  const worldA = makeWorld('world-a')
  const worldB = makeWorld('world-b')
  assert.notEqual(worldA.worldId, worldB.worldId)
  // a schema-valid frontier from world B at world A's location
  const alien = { format: FRONTIER_FORMAT, worldId: worldB.worldId, tick: 3, resultingStateHash: 'a'.repeat(64) }
  assert.throws(() => mk(worldA, { state: build(worldA) }, {
    frontierStore: { save: () => {}, load: () => alien },
  }), /frontier belongs to a different world.*move or remove the record explicitly/s)
  // a schema-valid lock from world B likewise
  const st = build(worldB)
  const prevB = E.stateHash(st)
  const bundle = P.makeBundle({ worldId: worldB.worldId, tick: 0, round: 0, previousStateHash: prevB, inputs: [], witness: w1 })
  const att = P.makeAttestation({ worldId: worldB.worldId, tick: 0, round: 0, bundleHash: P.bundleHash(bundle), resultingStateHash: 'b'.repeat(64), witness: w1 })
  const alienLock = { format: LOCK_FORMAT, worldId: worldB.worldId, tick: 0, bundleHash: P.bundleHash(bundle), bundle, attestation: att }
  assert.throws(() => mk(worldA, { state: build(worldA) }, {
    lockStore: { save: () => {}, load: () => alienLock },
  }), /vote lock belongs to a different world/)
})

test('ONE constitutional name rule everywhere: inputs, state, registry, imports', () => {
  // the shared validator itself
  assert.ok(E.isValidName('alice-brave') && E.isValidName('x') && E.isValidName('a2-b3'))
  for (const bad of ['', 'thirteen-char', 'UPPER', '-lead', 'trail-', 'has space', 'a'.repeat(13), null, 7])
    assert.equal(E.isValidName(bad), false, `rejects ${JSON.stringify(bad)}`)
  // claim_name input validation uses it
  const world = makeWorld()
  let s = build(world)
  const claim = (name) => E.nextState(s, [E.signInput({ worldId: world.worldId, playerId: alice.playerId, tick: s.tick, type: 'claim_name', name }, alice.privateKey)])
  assert.equal(claim('-sneaky').players[alice.playerId].name, null, 'leading hyphen refused at input')
  assert.equal(claim('waytoolongname').players[alice.playerId].name, null, 'overlong refused at input')
  assert.equal(claim('alice-brave').players[alice.playerId].name, 'alice-brave')
  // checkpoint validation uses it
  const s2 = build(world)
  s2.players[alice.playerId].name = 'UPPER'
  assert.equal(E.validateState(s2), 'non-constitutional player name')
  const s3 = build(world)
  s3.names['trail-'] = alice.playerId
  assert.match(E.validateState(s3), /non-constitutional registered name/)
  // genesis imports use it
  const g = { ...world.genesis, imported: [{ pid: alice.playerId, name: '-lead' }] }
  assert.match(E.validateGenesis(g), /non-constitutional name/)
  // and worldgen now REFUSES the whole founding (rev6 §3): an invalid
  // genesis never reaches world construction at all
  const g2 = JSON.parse(JSON.stringify(world.genesis))
  g2.worldW = 320; g2.worldH = 200
  g2.imported = [{ pid: alice.playerId, name: 'Invalid Name', skills: {}, bank: {}, inventory: [] }]
  assert.throws(() => buildWorld(g2), /invalid genesis.*non-constitutional name/s)
})

test('ONE constitutional item registry: unknown items are contraband everywhere', () => {
  const world = makeWorld()
  const forged = 'sword-of-doom' // syntactically fine, constitutionally absent
  assert.ok(!E.ITEMS.has(forged))
  const cases = [
    [s => { s.players[alice.playerId].inventory[0] = { item: forged, qty: 1 } }, /inventory slot/],
    [s => { s.players[alice.playerId].bank[forged] = 5 }, /bank item/],
    [s => { s.players[alice.playerId].equipment.weapon = { item: forged, qty: 1 } }, /equipment slot/],
    [s => { s.ground.g1 = { item: forged, qty: 1, x: 1, y: 1, expiresAt: 9 } }, /ground item/],
    [s => { E.addPlayer(s, bob.playerId, 6, 5); s.players[alice.playerId].trade = { to: bob.playerId, giveSlot: 0, wantItem: forged, wantGold: 0 } }, /trade item/],
  ]
  for (const [mutate, want] of cases) {
    const s = build(world)
    mutate(s)
    assert.match(E.validateState(s) ?? 'VALID', want)
  }
  // POSITIVE: every constitutional item is bankable and validates
  const s = build(world)
  for (const it of E.ITEMS) s.players[alice.playerId].bank[it] = 1
  assert.equal(E.validateState(s), null, 'the full constitutional vocabulary round-trips')
  // imports are filtered through the same registry
  const g = { ...world.genesis, imported: [{ pid: alice.playerId, bank: { [forged]: 3 } }] }
  assert.match(E.validateGenesis(g), /unknown item/)
})

test('relational validation: no dangling references are constitutionally permitted', () => {
  const world = makeWorld()
  const cases = [
    [s => { s.players[alice.playerId].action = { type: 'attack', mobId: 'ghost-mob', since: 0 } }, /references a missing mob/],
    [s => { s.players[alice.playerId].action = { type: 'gather', nodeId: 'ghost-node' } }, /references a missing node/],
    [s => { s.players[alice.playerId].action = { type: 'attackp', targetId: bob.playerId, since: 0 } }, /references a missing player/],
    [s => { s.players[alice.playerId].trade = { to: bob.playerId, giveSlot: 0, wantItem: null, wantGold: 1 } }, /missing partner/],
    [s => { s.players[alice.playerId].attuned = ['ghost-stone'] }, /missing waystone/],
    [s => { s.players[alice.playerId].attuned = ['tree-1'] }, /missing waystone/], // exists, but is no waystone
  ]
  for (const [mutate, want] of cases) {
    const s = build(world)
    mutate(s)
    assert.match(E.validateState(s) ?? 'VALID', want)
  }
  // POSITIVE: resolved references validate — a live fight, a live trade, a real attunement
  const s = build(world)
  E.addPlayer(s, bob.playerId, 6, 5)
  s.players[alice.playerId].action = { type: 'attack', mobId: 'gob-1', since: 0 }
  s.players[alice.playerId].attuned = ['ws-east']
  s.players[bob.playerId].trade = { to: alice.playerId, giveSlot: 0, wantItem: 'logs', wantGold: 0 }
  assert.equal(E.validateState(s), null)
})

test('lock archive failures are LOGGED, never silently swallowed', () => {
  const world = makeWorld()
  const holder = { state: build(world), clock: 700 }
  const ag = mk(world, holder, {
    lockStore: { save: () => {}, load: () => null, archive: () => { throw new Error('EROFS: read-only journal') } },
  })
  ag.drive()
  assert.equal(holder.state.tick, 1, 'finality still commits')
  assert.ok(holder.logs.some(l => /lock archive failed.*EROFS.*safety unaffected/s.test(l)), 'the failure is on the record')
})
