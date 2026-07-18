// Final brief, Priority 1/2/5 — crash-safety failure injection.
// The frontier must fail CLOSED: if finality cannot be recorded durably,
// the witness halts with its vote lock intact, and a restart can only
// rebroadcast — never produce a second vote.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import E from '../engine.js'
import * as P from '../protocol.mjs'
import { IntervalAgreement } from '../agreement.mjs'
import { durableStore } from '../node.mjs'
import { buildWorld } from '../worldgen.mjs'

const RULES = 'c'.repeat(64)
const w1 = E.generateIdentity(), w2 = E.generateIdentity(), w3 = E.generateIdentity()
const alice = E.generateIdentity(), bob = E.generateIdentity()

function makeWorld({ witnesses = [w1], quorum = 1, byzantineTolerance } = {}) {
  const genesis = E.makeGenesis('crash-seed', RULES, 0, 40, 30)
  genesis.witnesses = witnesses.map(w => w.playerId)
  genesis.quorum = quorum
  genesis.byzantineTolerance = byzantineTolerance ?? (() => {
    for (let f = E.maxByzantine(genesis.witnesses.length); f >= 0; f--)
      if (E.byzantineSafe(genesis.witnesses.length, quorum, f)) return f
    return 0
  })()
  return { genesis, worldId: E.worldId(genesis) }
}
const build = (world) => { const s = E.newWorld(world.genesis); E.addPlayer(s, alice.playerId, 5, 5); return s }
const mk = (world, key, holder, extra = {}) => new IntervalAgreement({
  genesis: world.genesis, worldId: world.worldId, name: 't', witnessKey: key,
  getState: () => holder.state, setState: (n) => { holder.state = n },
  publish: (kind, obj) => (holder.sink ??= []).push({ kind, obj }),
  now: () => holder.clock ?? 0, log: (l) => (holder.logs ??= []).push(l), allowEphemeralStores: true, ...extra,
})

test('frontier persistence fails CLOSED: halt, lock intact, no advance; restart rebroadcasts only', () => {
  const world = makeWorld({ witnesses: [w1, w2, w3], quorum: 2 })
  let lockMem = null
  const lockStore = { save: (l) => { lockMem = JSON.parse(JSON.stringify(l)) }, load: () => lockMem }
  let frontierBroken = true, frontierMem = null
  const frontierStore = {
    save: (f) => { if (frontierBroken) throw new Error('disk full'); frontierMem = JSON.parse(JSON.stringify(f)) },
    load: () => frontierMem,
  }
  const h = { state: build(world), clock: 700 }
  const ag = mk(world, w2, h, { lockStore, frontierStore })
  const p0 = [w1, w2, w3].find(k => k.playerId === P.proposerFor(world.genesis, world.worldId, ag.prevHash, 0, 0))
  const A = P.makeBundle({ worldId: world.worldId, tick: 0, round: 0, previousStateHash: ag.prevHash, inputs: [], witness: p0 })
  ag.onBundle(A)
  const rsh = ag.proposals.get(P.bundleHash(A)).rsh
  // a second attestation completes quorum — finality is REACHED, but the
  // frontier cannot be recorded: the witness must halt, not proceed
  const otherKey = [w1, w3].find(k => k.playerId !== p0.playerId) ?? w1
  ag.onAttestation(P.makeAttestation({ worldId: world.worldId, tick: 0, round: 0, bundleHash: P.bundleHash(A), resultingStateHash: rsh, witness: otherKey }))
  assert.equal(ag.halted, true, 'halted on frontier persistence failure')
  assert.match(ag.haltReason, /frontier persist failed/)
  assert.equal(h.state.tick, 0, 'the state did NOT advance')
  assert.ok(ag.lock, 'the vote lock remains ACTIVE')
  assert.equal(lockMem.bundleHash, P.bundleHash(A), 'the durable lock is intact')

  // restart after the disk is fixed: the lock restores, a rival bundle is
  // refused, and the original vote can still finalize — no second vote ever
  frontierBroken = false
  const h2 = { state: build(world), clock: 1300 }
  const ag2 = mk(world, w2, h2, { lockStore, frontierStore })
  assert.equal(ag2.lock.bundleHash, P.bundleHash(A), 'lock restored and verified')
  const p1 = [w1, w2, w3].find(k => k.playerId === P.proposerFor(world.genesis, world.worldId, ag2.prevHash, 0, 1))
  const rival = P.makeBundle({ worldId: world.worldId, tick: 0, round: 1, previousStateHash: ag2.prevHash, inputs: [E.signInput({ worldId: world.worldId, playerId: alice.playerId, tick: 0, type: 'stop' }, alice.privateKey)], witness: p1 })
  ag2.onBundle(rival)
  assert.equal((h2.sink ?? []).filter(m => m.kind === 'attestation' && m.obj.bundleHash === P.bundleHash(rival)).length, 0, 'restart cannot produce another vote')
  ag2.onBundle(JSON.parse(JSON.stringify(A)))
  ag2.onAttestation(P.makeAttestation({ worldId: world.worldId, tick: 0, round: 0, bundleHash: P.bundleHash(A), resultingStateHash: rsh, witness: otherKey }))
  assert.equal(h2.state.tick, 1, 'the ORIGINAL vote finalizes once the disk works')
  assert.equal(frontierMem.tick, 0, 'and the frontier now records it')
})

test('same-height impostor state is refused at restart (frontier hash check)', () => {
  const world = makeWorld()
  let frontierMem = null
  const frontierStore = { save: (f) => { frontierMem = JSON.parse(JSON.stringify(f)) }, load: () => frontierMem }
  const h = { state: build(world), clock: 700 }
  const ag = mk(world, w1, h, { frontierStore })
  ag.drive() // solo quorum finalizes tick 0
  assert.equal(h.state.tick, 1)
  // an impostor at the SAME height: right tick, wrong bytes
  const impostor = JSON.parse(JSON.stringify(h.state))
  impostor.players[alice.playerId].hp = 1
  assert.throws(() => mk(world, w1, { state: impostor, clock: 800 }, { frontierStore }),
    /frontier mismatch.*same-height impostor/s)
  // the REAL state resumes fine
  const ok = mk(world, w1, { state: h.state, clock: 800 }, { frontierStore })
  assert.equal(ok.frontier.tick, 0)
})

test('archive failure is tolerated (hygiene, not safety): finality still commits', () => {
  const world = makeWorld()
  const lockStore = {
    save: () => {}, load: () => null,
    archive: () => { throw new Error('archive dir is read-only') },
  }
  const h = { state: build(world), clock: 700 }
  const ag = mk(world, w1, h, { lockStore })
  ag.drive()
  assert.equal(h.state.tick, 1, 'the world advances even when archiving fails')
  assert.equal(ag.halted, false)
})

test('spent locks retire into a unique-name history journal on real disk', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'interval-journal-'))
  const lockFile = path.join(dir, 'w.lock')
  const world = makeWorld()
  const h = { state: build(world), clock: 700 }
  const ag = mk(world, w1, h, { lockStore: durableStore(lockFile) })
  ag.drive()                    // finalize tick 0
  h.clock = 1300; ag.drive()    // finalize tick 1
  assert.equal(h.state.tick, 2)
  assert.ok(!fs.existsSync(lockFile), 'no stale active lock after finality')
  const journal = fs.readdirSync(path.join(dir, 'w.lock.history')).sort()
  assert.equal(journal.length, 2, 'one journal entry per finalized vote')
  assert.match(journal[0], /^0-[0-9a-f]{16}\.json$/, 'entries are <tick>-<bundleHash>.json')
  assert.match(journal[1], /^1-[0-9a-f]{16}\.json$/)
  const entry = JSON.parse(fs.readFileSync(path.join(dir, 'w.lock.history', journal[0])))
  assert.equal(entry.tick, 0, 'journal entries are the full retired locks')
  fs.rmSync(dir, { recursive: true, force: true })
})

test('exact engine invariants: actions, trades, equipment, skills, mob/node tables', () => {
  const world = makeWorld()
  const cases = [
    [s => { s.players[alice.playerId].action = { type: 'dance' } }, /unknown action type/],
    [s => { s.players[alice.playerId].action = { type: 'gather', nodeId: 'tree-1', extra: 1 } }, /malformed gather action/],
    [s => { s.players[alice.playerId].action = { type: 'attack', mobId: 'm1' } }, /malformed attack action/],
    [s => { s.players[alice.playerId].trade = { to: 'zz', giveSlot: 0, wantItem: null, wantGold: 0 } }, /malformed trade partner/],
    [s => { s.players[alice.playerId].trade = { to: bob.playerId, giveSlot: 0, wantItem: null, wantGold: 0, bonus: 1 } }, /malformed trade shape/],
    [s => { s.players[alice.playerId].equipment.ring = null }, /non-constitutional equipment/],
    [s => { delete s.players[alice.playerId].equipment.head }, /non-constitutional equipment/],
    [s => { delete s.players[alice.playerId].skills.magic }, /missing skill/],
    [s => { s.players[alice.playerId].skills.juggling = 0 }, /unknown or duplicated skill/],
    [s => { s.players[alice.playerId].sneaky = 'field' }, /unknown player field/],
    [s => { s.players[alice.playerId].attuned = [{}] }, /malformed attunement/],
    [s => { s.nodes['n1'] = { type: 'volcano', x: 1, y: 1, depletedUntil: 0 } }, /unknown node type/],
    [s => { s.nodes['n1'] = { type: 'tree', x: 1, y: 1, depletedUntil: 0, magic: true } }, /unknown node field/],
    [s => { s.ground['g1'] = { item: 'logs', x: 1, y: 1, expiresAt: 5, owner: 'me' } }, /unknown ground field/],
  ]
  for (const [mutate, want] of cases) {
    const s = build(world)
    mutate(s)
    assert.match(E.validateState(s) ?? 'VALID', want)
  }
  // and the untouched engine output remains valid
  assert.equal(E.validateState(build(world)), null)
})

test('the FULL worldgen world validates: every node type and extra the generator writes', () => {
  // the validator must be proven against real generator output, not toy
  // states — this exact gap once made a live pillar refuse its own
  // checkpoint (signpost text was an "unknown node field")
  const g = E.makeGenesis('full-map', RULES, 0, 320, 200)
  g.witnesses = [w1.playerId]; g.quorum = 1; g.byzantineTolerance = 0
  const s = buildWorld(g)
  assert.equal(E.validateState(s), null)
  assert.ok(Object.values(s.nodes).some(n => n.type === 'signpost' && typeof n.text === 'string'), 'signposts with text are present and accepted')
  assert.ok(Object.keys(s.mobs).length > 0 && Object.keys(s.nodes).length > 50, 'a real map, not a toy')
})

test('gold-only trade offers no longer crash the state hash (undefined never enters state)', () => {
  const world = makeWorld()
  let s = build(world)
  E.addPlayer(s, bob.playerId, 6, 5)
  s.players[alice.playerId].inventory[0] = { item: 'logs', qty: 1 }
  const offer = E.signInput({ worldId: world.worldId, playerId: alice.playerId, tick: 0, type: 'offer_trade', to: bob.playerId, giveSlot: 0, wantItem: null, wantGold: 5 }, alice.privateKey)
  s = E.nextState(s, [offer])
  assert.equal(s.players[alice.playerId].trade.wantItem, null, 'absent wantItem becomes null, not undefined')
  assert.doesNotThrow(() => E.stateHash(s))
  assert.equal(E.validateState(s), null)
})
