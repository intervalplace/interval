// Rev6 brief — closure between execution, validation, and genesis.
// The property under test: valid state + accepted inputs → nextState →
// validateState(next) === null. Execution may never mint a state its own
// validator rejects.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import E from '../engine.js'
import { IntervalAgreement } from '../agreement.mjs'
import { durableStore } from '../node.mjs'
import { buildWorld, WORLDGEN_MIN } from '../worldgen.mjs'

const RULES = 'c'.repeat(64)
const w1 = E.generateIdentity()
const players = [E.generateIdentity(), E.generateIdentity(), E.generateIdentity()]

const mkGenesis = (seed, W = 64, H = 48) => {
  const g = E.makeGenesis(seed, RULES, 0, W, H)
  g.witnesses = [w1.playerId]; g.quorum = 1; g.byzantineTolerance = 0
  return g
}

// deterministic PRNG for the property test
const mulberry = (a) => () => {
  a |= 0; a = (a + 0x6D2B79F5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

test('PROPERTY: hundreds of accepted transitions never produce a state the validator rejects', () => {
  const genesis = mkGenesis('property-world')
  const worldId = E.worldId(genesis)
  let s = buildWorld(genesis) // already self-validated at construction
  const rnd = mulberry(0xC0FFEE)
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
  const sign = (id, fields) => E.signInput({ worldId, playerId: id.playerId, tick: s.tick, ...fields }, id.privateKey)

  const gen = (id) => {
    const p = s.players[id.playerId]
    if (!p) return sign(id, { type: 'spawn' })
    const nodes = Object.entries(s.nodes)
    const mobs = Object.entries(s.mobs).filter(([, m]) => m.hp > 0)
    const near = ([, o]) => Math.abs(o.x - p.x) + Math.abs(o.y - p.y) <= 6
    const kind = Math.floor(rnd() * 12)
    switch (kind) {
      case 0: case 1: case 2: return sign(id, { type: 'move', dx: pick([-1, 0, 1]), dy: pick([-1, 0, 1]) })
      case 3: { const n = pick(nodes.filter(near)) ?? pick(nodes); return sign(id, { type: 'gather', nodeId: n[0] }) }
      case 4: { const m = pick(mobs.filter(near)) ?? (mobs.length ? pick(mobs) : null); return m ? sign(id, { type: 'attack', mobId: m[0] }) : sign(id, { type: 'stop' }) }
      case 5: { const slot = p.inventory.findIndex(Boolean); return slot === -1 ? sign(id, { type: 'stop' }) : sign(id, { type: 'drop', slot }) }
      case 6: { const g = Object.keys(s.ground)[0]; return g ? sign(id, { type: 'pickup', groundId: g }) : sign(id, { type: 'move', dx: 1, dy: 0 }) }
      case 7: { const other = pick(players.filter(o => o !== id && s.players[o.playerId])); const slot = p.inventory.findIndex(Boolean); return (other && slot !== -1) ? sign(id, { type: 'offer_trade', to: other.playerId, giveSlot: slot, ...(rnd() < 0.5 ? { wantItem: pick([...E.ITEMS]), wantGold: 0 } : { wantItem: null, wantGold: 1 + Math.floor(rnd() * 5) }) }) : sign(id, { type: 'stop' }) }
      case 8: { const from = pick(players.filter(o => o !== id)); return sign(id, { type: 'accept_trade', from: from.playerId }) }
      case 9: return sign(id, { type: 'claim_name', name: 'p' + id.playerId.slice(0, 6) })
      case 10: { const slot = p.inventory.findIndex(sl => sl && sl.item === 'cooked-fish'); return slot === -1 ? sign(id, { type: 'move', dx: 0, dy: 1 }) : sign(id, { type: 'eat', slot }) }
      default: return sign(id, { type: pick(['stop', 'bury', 'cancel_trade', 'unwield']) , ...(rnd() < 0.3 ? { slot: Math.floor(rnd() * 28) } : {}) })
    }
  }

  let transitions = 0
  for (let t = 0; t < 80; t++) {
    const inputs = players.filter(() => rnd() < 0.8).map(gen)
    s = E.nextState(s, inputs)
    transitions += inputs.length
    const err = E.validateState(s)
    assert.equal(err, null, `tick ${s.tick}: execution produced an invalid state (${err})`)
  }
  assert.ok(transitions > 150, `exercised ${transitions} inputs`)
  assert.ok(Object.keys(s.players).length === 3, 'everyone spawned')
})

test('trade closure: exactly one of constitutional item XOR positive gold', () => {
  const genesis = mkGenesis('trade-world')
  const worldId = E.worldId(genesis)
  const [a, b] = players
  const base = () => {
    const s = E.newWorld(genesis)
    E.addPlayer(s, a.playerId, 5, 5); E.addPlayer(s, b.playerId, 6, 5)
    s.players[a.playerId].inventory[0] = { item: 'logs', qty: 1 }
    return s
  }
  const offer = (extra) => E.signInput({ worldId, playerId: a.playerId, tick: 0, type: 'offer_trade', to: b.playerId, giveSlot: 0, ...extra }, a.privateKey)
  const applied = (extra) => E.nextState(base(), [offer(extra)]).players[a.playerId].trade

  assert.equal(applied({ wantItem: 'sword-of-doom', wantGold: 0 }), null, 'unknown item refused')
  assert.equal(applied({ wantItem: 'logs', wantGold: 5 }), null, 'both refused')
  assert.equal(applied({ wantItem: null, wantGold: 0 }), null, 'neither refused')
  assert.equal(applied({ wantItem: null, wantGold: -3 }), null, 'negative gold refused')
  assert.equal(applied({ wantItem: null, wantGold: 2.5 }), null, 'fractional gold refused')
  // pre-freeze §1: OMISSION is not a representation — both demand fields, always
  assert.equal(applied({ wantGold: 5 }), null, 'omitted wantItem refused')
  assert.equal(applied({ wantItem: 'logs' }), null, 'omitted wantGold refused')
  assert.ok(applied({ wantItem: null, wantGold: 5 }), 'canonical gold trade accepted')
  // EVERY constitutional item is tradeable in canonical form, and every
  // accepted trade produces a state the validator accepts
  for (const it of E.ITEMS) {
    const s = E.nextState(base(), [offer({ wantItem: it, wantGold: 0 })])
    assert.equal(s.players[a.playerId].trade?.wantItem, it, `${it} accepted`)
    assert.equal(E.validateState(s), null, `state with ${it} trade validates`)
  }
})

test('imported citizens: complete validation before world construction', () => {
  const pidA = players[0].playerId, pidB = players[1].playerId
  const cases = [
    [[{ pid: 'zz' }], /malformed player id/],
    [[{ pid: pidA }, { pid: pidA }], /duplicate imported player id/],
    [[{ pid: pidA, name: 'dave' }, { pid: pidB, name: 'dave' }], /duplicate imported name/],
    [[{ pid: pidA, bank: { logs: -5 } }], /quantity out of bounds/],
    [[{ pid: pidA, skills: { woodcutting: -1 } }], /xp out of bounds/],
    [[{ pid: pidA, skills: { juggling: 5 } }], /unknown skill/],
    [[{ pid: pidA, inventory: [{ item: 'logs', qty: 0 }] }], /inventory slot/],
    [[{ pid: pidA, weapon: { item: 'logs', qty: 1 } }], /not equippable/],
    [[{ pid: pidA, hp: -2 }], /hp out of bounds/],
    [[{ pid: pidA, favouriteColour: 'red' }], /unknown field/],
  ]
  for (const [imported, want] of cases)
    assert.match(E.validateImports(imported) ?? 'VALID', want)
  // a RICH valid import passes the full chain: validateGenesis → buildWorld
  // (self-validating) → citizen present with all their goods
  const g = mkGenesis('imports-world')
  g.imported = [{
    pid: pidA, name: 'old-hand', hp: 30,
    skills: { woodcutting: 5000, hitpoints: 5000 },
    inventory: [{ item: 'logs', qty: 7 }, null, { item: 'bronze-sword', qty: 1 }],
    bank: { ore: 100, arrows: 250 },
    weapon: { item: 'old-chain', qty: 1 },
  }]
  assert.equal(E.validateGenesis(g), null)
  const w = buildWorld(g)
  assert.equal(E.validateState(w), null)
  const p = w.players[pidA]
  assert.equal(p.name, 'old-hand')
  assert.equal(w.names['old-hand'], pidA)
  assert.equal(p.bank.ore, 100)
  assert.equal(p.equipment.weapon.item, 'old-chain')
})

test('worldgen floors: the minimum builds, below-minimum and invalid genesis refuse', () => {
  assert.ok(E.validateState(buildWorld(mkGenesis('min', WORLDGEN_MIN.w, WORLDGEN_MIN.h))) === null)
  assert.throws(() => buildWorld(mkGenesis('w-1', WORLDGEN_MIN.w - 1, WORLDGEN_MIN.h)), /worldgen requires at least/)
  assert.throws(() => buildWorld(mkGenesis('h-1', WORLDGEN_MIN.w, WORLDGEN_MIN.h - 1)), /worldgen requires at least/)
  const bad = mkGenesis('bad-rules'); bad.rulesHash = 'nope'
  assert.throws(() => buildWorld(bad), /invalid genesis: bad rulesHash/)
})

test('node type rules: ownership, expiry, and text belong to exactly their kinds', () => {
  const genesis = mkGenesis('node-world')
  const worldId = E.worldId(genesis)
  const a = players[0]
  const base = () => {
    const s = E.newWorld(genesis)
    E.addPlayer(s, a.playerId, 5, 5)
    E.addNode(s, 'tree-1', 'tree', 4, 5)
    E.addNode(s, 'plot-1', 'plot', 6, 5)
    return s
  }
  const cases = [
    [s => { s.nodes.f1 = { type: 'fire', x: 1, y: 1, depletedUntil: 0 } }, /fire without expiry/],
    [s => { s.nodes['tree-1'].expiresAt = 99 }, /only fires expire/],
    [s => { s.nodes['tree-1'].by = a.playerId }, /ownership metadata on a non-plot/],
    [s => { s.nodes['plot-1'].plantedAt = 3 }, /planted plot without an owner/],
    [s => { s.nodes['plot-1'].plantedAt = 3; s.nodes['plot-1'].by = 'ab'.repeat(32) }, /plot owner does not exist/],
    [s => { s.nodes['plot-1'].plantedAt = 0; s.nodes['plot-1'].by = a.playerId }, /unplanted plot carries an owner/],
    [s => { s.nodes['tree-1'].text = 'hello' }, /text on a non-signpost/],
  ]
  for (const [mutate, want] of cases) {
    const s = base(); mutate(s)
    assert.match(E.validateState(s) ?? 'VALID', want)
  }
  // POSITIVE round-trips through the REAL engine: light a fire, plant a plot
  let s = base()
  s.players[a.playerId].inventory[0] = { item: 'logs', qty: 1 }
  s.players[a.playerId].inventory[1] = { item: 'seeds', qty: 1 }
  s = E.nextState(s, [E.signInput({ worldId, playerId: a.playerId, tick: s.tick, type: 'light', slot: 0 }, a.privateKey)])
  s = E.nextState(s, [E.signInput({ worldId, playerId: a.playerId, tick: s.tick, type: 'plant', slot: 1 }, a.privateKey)])
  assert.equal(E.validateState(s), null, 'engine-made fires and plantings validate')
  const planted = Object.values(s.nodes).find(n => n.type === 'plot' && n.plantedAt > 0)
  if (planted) assert.equal(planted.by, a.playerId)
})

test('archive durability failures SURFACE in the log; consensus is unaffected', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'interval-arch-'))
  const lockFile = path.join(dir, 'w.lock')
  fs.writeFileSync(lockFile + '.history', 'a FILE squatting where the journal dir must go')
  const genesis = mkGenesis('arch-world')
  const holder = { state: (() => { const s = E.newWorld(genesis); E.addPlayer(s, players[0].playerId, 5, 5); return s })(), clock: 700, logs: [] }
  const ag = new IntervalAgreement({
    genesis, worldId: E.worldId(genesis), name: 't', witnessKey: w1,
    getState: () => holder.state, setState: (n) => { holder.state = n },
    publish: () => {}, now: () => holder.clock, log: (l) => holder.logs.push(l),
    lockStore: durableStore(lockFile), allowEphemeralStores: true,
  })
  ag.drive()
  assert.equal(holder.state.tick, 1, 'finality committed despite the journal failure')
  assert.equal(ag.halted, false)
  assert.ok(holder.logs.some(l => /lock archive failed.*safety unaffected/s.test(l)), 'the failure surfaced in the log')
  fs.rmSync(dir, { recursive: true, force: true })
})

test('identity recovery: missing creates, corrupt refuses, valid loads, forged refuses', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'interval-id-'))
  const f = path.join(dir, 'id.json')
  // missing → create
  const made = E.loadOrCreateIdentity(fs, f)
  assert.ok(/^[0-9a-f]{64}$/.test(made.playerId))
  // valid → loads the SAME identity
  assert.equal(E.loadOrCreateIdentity(fs, f).playerId, made.playerId)
  // corrupt JSON → refuse, file preserved
  fs.writeFileSync(f, '{"playerId": "ab')
  assert.throws(() => E.loadOrCreateIdentity(fs, f), /corrupt.*refusing to regenerate/s)
  assert.ok(fs.existsSync(f))
  // valid JSON, forged pairing → refuse
  fs.writeFileSync(f, JSON.stringify({ playerId: 'ab'.repeat(32), privateKey: 'cd'.repeat(32) }))
  assert.throws(() => E.loadOrCreateIdentity(fs, f), /not a usable identity.*does not match/s)
  fs.rmSync(dir, { recursive: true, force: true })
})
