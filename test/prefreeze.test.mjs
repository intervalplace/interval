// Pre-freeze brief §13–§17 — the canonicality batteries.
// Freeze criterion under test: every semantic action, founding record,
// and persistent state has exactly ONE accepted representation.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import E from '../engine.js'
import { IntervalNode } from '../node.mjs'
import { IntervalClient } from '../sdk.mjs'
import { buildWorld } from '../worldgen.mjs'

const RULES = 'c'.repeat(64)
const w1 = E.generateIdentity()
const alice = E.generateIdentity(), bob = E.generateIdentity()

const mkGenesis = (seed, W = 64, H = 48) => {
  const g = E.makeGenesis(seed, RULES, 0, W, H)
  g.witnesses = [w1.playerId]; g.quorum = 1; g.byzantineTolerance = 0
  return g
}
const base = (genesis) => {
  const s = E.newWorld(genesis)
  E.addPlayer(s, alice.playerId, 5, 5)
  E.addPlayer(s, bob.playerId, 6, 5)
  return s
}

// the canonical representation of every action, in one table
const CANON = {
  spawn: {}, stop: {}, cancel_trade: {}, invoke: {},
  move: { dx: 1, dy: 0 },
  gather: { nodeId: 'tree-1' }, harvest: { nodeId: 'plot-1' },
  attack: { mobId: 'gob-1' }, attackp: { targetId: 'ab'.repeat(32) },
  recall: { to: 'ws-east' },
  offer_trade: { to: 'ab'.repeat(32), giveSlot: 0, wantItem: 'logs', wantGold: 0 },
  accept_trade: { from: 'ab'.repeat(32) },
  smith: { recipe: 'bronze-sword' },
  wield: { slot: 0 }, sell: { slot: 1 }, plant: { slot: 2 }, light: { slot: 3 },
  bury: { slot: 4 }, deposit: { slot: 5 }, drop: { slot: 6 }, eat: { slot: 7 }, cook: { slot: 8 },
  unwield: { gear: 'weapon' },
  buy: { item: 'logs' }, withdraw: { item: 'ore' },
  cast: { spell: 'anchor' },
  fletch: { slot: 0, make: 'bow' },
  pickup: { groundId: 'g-1' },
  claim_name: { name: 'ada' },
}
// one representative corruption of each kind, per action where applicable
const WRONG_TYPE = { dx: '1', nodeId: 7, mobId: {}, targetId: 123, to: 42, giveSlot: '0', wantItem: 9, wantGold: '5', from: null, recipe: 3, slot: 1.5, gear: 0, item: [], spell: true, make: 'bows', groundId: 9, name: 12, dy: null }
const BAD_ID = { nodeId: 'has spaces!', mobId: 'x'.repeat(80), targetId: 'AB'.repeat(32), to: 'has spaces!', from: 'not hex!', groundId: '"; drop', name: '-lead' }

test('§13 canonical action battery: exactly one accepted representation per action', () => {
  const worldId = E.worldId(mkGenesis('battery'))
  const sign = (fields) => E.signInput({ worldId, playerId: alice.playerId, tick: 3, ...fields }, alice.privateKey)
  for (const [type, fields] of Object.entries(CANON)) {
    // the canonical form is accepted
    assert.equal(E.validateInputShape(sign({ type, ...fields })), null, `${type}: canonical form accepted`)
    // a missing base field is rejected (drop worldId post-signing)
    const noBase = { ...sign({ type, ...fields }) }; delete noBase.worldId
    assert.match(E.validateInputShape(noBase), /missing base field worldId/, `${type}: base fields required`)
    // a malformed base format is rejected
    assert.match(E.validateInputShape({ ...sign({ type, ...fields }), tick: -1 }), /base field tick/, `${type}: tick format`)
    assert.match(E.validateInputShape({ ...sign({ type, ...fields }), sig: 'ab' }), /base field sig/, `${type}: sig format`)
    // an extra field is rejected
    assert.match(E.validateInputShape(sign({ type, ...fields, memo: 1 })), /unknown field memo/, `${type}: no extras`)
    // a missing action field is rejected
    for (const k of Object.keys(fields)) {
      const partial = { ...fields }; delete partial[k]
      assert.match(E.validateInputShape(sign({ type, ...partial })) ?? 'OK', new RegExp(`missing field ${k}|exactly one`), `${type}: ${k} required`)
    }
    // a wrong primitive type is rejected
    for (const k of Object.keys(fields)) {
      if (!(k in WRONG_TYPE)) continue
      assert.notEqual(E.validateInputShape(sign({ type, ...fields, [k]: WRONG_TYPE[k] })), null, `${type}: ${k} type checked`)
    }
    // a malformed identifier is rejected
    for (const k of Object.keys(fields)) {
      if (!(k in BAD_ID)) continue
      assert.notEqual(E.validateInputShape(sign({ type, ...fields, [k]: BAD_ID[k] })), null, `${type}: ${k} format checked`)
    }
  }
  // trade-specific equivalence killers (§1): the alternates are dead
  const tr = (extra) => E.validateInputShape(sign({ type: 'offer_trade', to: 'ab'.repeat(32), giveSlot: 0, ...extra }))
  assert.match(tr({ wantItem: 'logs' }), /missing field wantGold/)
  assert.match(tr({ wantGold: 5 }), /missing field wantItem/)
  assert.match(tr({ wantItem: 'logs', wantGold: 5 }), /exactly one/)
  assert.match(tr({ wantItem: null, wantGold: 0 }), /exactly one/)
  assert.equal(tr({ wantItem: null, wantGold: 5 }), null)
})

test('§14 builder boundaries: every builder result is validated, whatever its tick', () => {
  const genesis = mkGenesis('boundary')
  // an invalid NONZERO-tick state can no longer sneak past a tick-0 proxy
  const laterBad = (g) => { const s = base(g); s.tick = 7; s.players[alice.playerId].x = -4; return s }
  assert.throws(() => new IntervalNode({ genesis, buildWorld: laterBad, name: 'x', allowEphemeralStores: true }),
    /buildWorld produced an invalid state.*out of bounds/s)
  // an unknown genesis field is refused at the node boundary
  assert.throws(() => new IntervalNode({ genesis: { ...genesis, memo: 'anything' }, buildWorld: base, name: 'x' }),
    /invalid genesis: unknown genesis field memo/)
  // a valid custom nonzero-tick state constructs (its genesis matches)
  const laterGood = (g) => { const s = base(g); s.tick = 7; return s }
  const n = new IntervalNode({ genesis, buildWorld: laterGood, name: 'x', witnessKey: w1, allowEphemeralStores: true })
  assert.equal(n.state.tick, 7)
})

test('§15 genesis canonicality matrix', () => {
  const g = mkGenesis('gmatrix')
  assert.equal(E.validateGenesis(g), null, 'the canonical representation is accepted')
  const variants = [
    [{ ...g, memo: 'anything' }, /unknown genesis field memo/],
    [(() => { const x = { ...g }; delete x.witnesses; return x })(), /must be supplied together/],
    [(() => { const x = { ...g }; delete x.quorum; return x })(), /must be supplied together/],
    [(() => { const x = { ...g }; delete x.byzantineTolerance; return x })(), /must be supplied together/],
    [{ ...g, worldGenerator: 'interval-hexcrawl-v9' }, /unknown world generator/],
    [{ ...g, witnesses: [w1.playerId, w1.playerId], quorum: 2, byzantineTolerance: 0 }, /duplicate witness/],
    [{ ...g, quorum: 0 }, /quorum out of range|Byzantine-unsafe/],
    // n=4, q=2, f=0: 2q-n=0, not > f — Byzantine-unsafe (also fails 2q>n)
    [{ ...g, witnesses: [w1.playerId, alice.playerId, bob.playerId, 'ab'.repeat(32)], quorum: 2, byzantineTolerance: 0 }, /Byzantine-unsafe/],
    [(() => { const x = { ...g }; delete x.rulesHash; return x })(), /genesis missing rulesHash/],
  ]
  for (const [bad, want] of variants)
    assert.match(E.validateGenesis(bad) ?? 'VALID', want)
  // a NON-witnessed genesis (the whole triple absent) remains valid
  const open = { ...g }; delete open.witnesses; delete open.quorum; delete open.byzantineTolerance
  assert.equal(E.validateGenesis(open), null)
})

test('§16 SDK normalization: equivalent requests → byte-identical signed objects', () => {
  // shared-normalizer identity, straight from the engine
  const a = E.normalizeInput({ type: 'offer_trade', to: 'ab'.repeat(32), giveSlot: 0, wantItem: 'logs' })
  const b = E.normalizeInput({ type: 'offer_trade', to: 'ab'.repeat(32), giveSlot: 0, wantItem: 'logs', wantGold: 0 })
  assert.equal(E.canonical(a), E.canonical(b), 'omitted zero and explicit zero are the same bytes')
  assert.equal(a.wantGold, 0)
  const c = E.normalizeInput({ type: 'offer_trade', to: 'ab'.repeat(32), giveSlot: 0, wantGold: 5 })
  assert.equal(c.wantItem, null)
  assert.throws(() => E.normalizeInput({ type: 'offer_trade', to: 'ab'.repeat(32), giveSlot: 0, wantItem: 'logs', wantGold: 5 }), /exactly one/)
  assert.throws(() => E.normalizeInput({ type: 'move', dx: 1, dy: 0, memo: 'x' }), /unknown field memo/)
  // …and through the SDK itself: the object actually SIGNED is canonical
  const genesis = mkGenesis('sdk-world')
  const captured = []
  const stubNode = { worldId: E.worldId(genesis), state: { tick: 4 }, submitInput: (i) => { captured.push(i); return Promise.resolve() } }
  const client = new IntervalClient({ node: stubNode, identity: alice })
  client.offerTradeForItem(bob.playerId, 0, 'logs')
  assert.equal(captured[0].wantGold, 0, 'the SDK signed the canonical zero')
  assert.equal(E.validateInputShape(captured[0]), null, 'the SDK output passes the shape gate verbatim')
  assert.equal(E.verifyInputSig(captured[0]), true)
})

test('§17 transition closure across EVERY input type on one living world', () => {
  const genesis = mkGenesis('closure-all')
  const worldId = E.worldId(genesis)
  let s = E.newWorld(genesis)
  // a compact world where every action has something to act on
  E.addNode(s, 'tree-1', 'tree', 4, 5)
  E.addNode(s, 'bank-1', 'bank', 5, 6)
  E.addNode(s, 'store-1', 'store', 6, 6)
  E.addNode(s, 'anvil-1', 'anvil', 4, 6)
  E.addNode(s, 'plot-1', 'plot', 7, 5)
  E.addNode(s, 'ws-east', 'waystone', 5, 4)
  E.addMob(s, 'gob-1', 'goblin', 7, 6)
  const step = (id, fields) => {
    s = E.nextState(s, [E.signInput({ worldId, playerId: id.playerId, tick: s.tick, ...E.normalizeInput(fields) }, id.privateKey)])
    const err = E.validateState(s)
    assert.equal(err, null, `after ${fields.type} at tick ${s.tick}: ${err}`)
  }
  step(alice, { type: 'spawn' }); step(bob, { type: 'spawn' })
  // teleport the fixtures to the players (spawn point is genesis-defined)
  const p = s.players[alice.playerId]
  for (const n of Object.values(s.nodes)) { n.x = p.x + (n.x - 4); n.y = p.y + (n.y - 5) }
  s.mobs['gob-1'].x = p.x + 1; s.mobs['gob-1'].y = p.y + 1
  s.players[bob.playerId].x = p.x + 1; s.players[bob.playerId].y = p.y
  const inv = s.players[alice.playerId].inventory
  inv[0] = { item: 'logs', qty: 3 }; inv[1] = { item: 'seeds', qty: 1 }
  inv[2] = { item: 'raw-fish', qty: 1 }; inv[3] = { item: 'bones', qty: 2 }
  inv[4] = { item: 'ore', qty: 5 }; inv[5] = { item: 'bronze-helm', qty: 1 }
  inv[6] = { item: 'cooked-fish', qty: 1 }; inv[7] = { item: 'magic-stone', qty: 3 }
  inv[8] = { item: 'sigil', qty: 1 }
  s.players[alice.playerId].gold = 50
  assert.equal(E.validateState(s), null)

  step(alice, { type: 'move', dx: 0, dy: 0 })
  step(alice, { type: 'gather', nodeId: 'tree-1' })
  step(alice, { type: 'stop' })
  step(alice, { type: 'attack', mobId: 'gob-1' })
  step(alice, { type: 'stop' })
  step(alice, { type: 'attackp', targetId: bob.playerId })
  step(alice, { type: 'stop' })
  step(alice, { type: 'claim_name', name: 'ada' })
  step(alice, { type: 'offer_trade', to: bob.playerId, giveSlot: 0, wantGold: 3 })
  step(bob, { type: 'accept_trade', from: alice.playerId })
  step(alice, { type: 'offer_trade', to: bob.playerId, giveSlot: 3, wantItem: 'grain' })
  step(alice, { type: 'cancel_trade' })
  step(alice, { type: 'wield', slot: 5 })      // helm → head
  step(alice, { type: 'unwield', gear: 'head' })
  step(alice, { type: 'deposit', slot: 4 })    // one ore to the bank
  step(alice, { type: 'withdraw', item: 'ore' })
  step(alice, { type: 'buy', item: 'logs' })
  step(alice, { type: 'sell', slot: 6 })
  step(alice, { type: 'smith', recipe: 'bronze-sword' })
  step(alice, { type: 'plant', slot: 1 })
  step(alice, { type: 'harvest', nodeId: 'plot-1' }) // unripe: a lawful no-op
  step(alice, { type: 'light', slot: 0 })
  step(alice, { type: 'cook', slot: 2 })
  step(alice, { type: 'eat', slot: 2 })
  step(alice, { type: 'fletch', slot: 0, make: 'bow' })
  step(alice, { type: 'bury', slot: 3 })
  step(alice, { type: 'invoke' })
  step(alice, { type: 'cast', spell: 'anchor' })
  step(alice, { type: 'recall', to: 'ws-east' }) // dead-or-unattuned: a lawful no-op
  step(alice, { type: 'drop', slot: 0 })
  step(alice, { type: 'pickup', groundId: Object.keys(s.ground)[0] ?? 'g-none' })
  // every one of the 29 input types crossed nextState; the state never
  // left the constitution
  assert.ok(s.players[alice.playerId].name === 'ada')
})
