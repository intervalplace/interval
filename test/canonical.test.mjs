// Rev7 brief — one canonical representation of every valid input, every
// valid persistent state, and every valid founding record.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import E from '../engine.js'
import * as P from '../protocol.mjs'
import { IntervalNode } from '../node.mjs'
import { buildWorld, GENERATOR_ID, WORLDGEN_MIN } from '../worldgen.mjs'

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

test('trade XOR is enforced in PERSISTED state, exactly as at the input', () => {
  const genesis = mkGenesis('xor-world')
  const t = (wantItem, wantGold) => {
    const s = base(genesis)
    s.players[alice.playerId].trade = { to: bob.playerId, giveSlot: 0, wantItem, wantGold }
    return E.validateState(s)
  }
  assert.match(t('logs', 5), /exactly one of item or gold/)
  assert.match(t(null, 0), /exactly one of item or gold/)
  assert.equal(t('logs', 0), null, 'item-only trade accepted')
  assert.equal(t(null, 5), null, 'gold-only trade accepted')
})

test('equipment slot correctness: the shared slotOf() rules every layer', () => {
  const genesis = mkGenesis('slot-world')
  assert.equal(E.slotOf('bronze-helm'), 'head')
  assert.equal(E.slotOf('star-plate'), 'body')
  assert.equal(E.slotOf('bronze-sword'), 'weapon')
  const wearing = (eq, item) => {
    const s = base(genesis)
    s.players[alice.playerId].equipment[eq] = { item, qty: 1 }
    return E.validateState(s)
  }
  assert.match(wearing('weapon', 'bronze-helm'), /wrong slot.*belongs in head/)
  assert.match(wearing('head', 'bronze-sword'), /wrong slot.*belongs in weapon/)
  assert.match(wearing('weapon', 'star-plate'), /wrong slot.*belongs in body/)
  assert.match(wearing('head', 'logs'), /not equippable/)
  assert.equal(wearing('head', 'bronze-helm'), null)
  assert.equal(wearing('weapon', 'old-chain'), null)
  // imports obey the same rule
  assert.match(E.validateImports([{ pid: alice.playerId, weapon: { item: 'bronze-helm', qty: 1 } }]), /different slot/)
  // and the ENGINE itself routes gear correctly: wield a helm → head slot
  const worldId = E.worldId(genesis)
  let s = base(genesis)
  s.players[alice.playerId].inventory[0] = { item: 'bronze-helm', qty: 1 }
  s = E.nextState(s, [E.signInput({ worldId, playerId: alice.playerId, tick: 0, type: 'wield', slot: 0 }, alice.privateKey)])
  assert.equal(s.players[alice.playerId].equipment.head?.item, 'bronze-helm')
  assert.equal(E.validateState(s), null)
})

test('IntervalNode enforces its own boundaries: genesis, built state, and genesis embedding', () => {
  // an invalid genesis never runs, whatever the caller believed
  assert.throws(() => new IntervalNode({ genesis: { worldW: 64 }, buildWorld, name: 'x' }),
    /refusing to run on an invalid genesis/)
  const genesis = mkGenesis('boundary-world')
  // a builder that returns an INVALID state is caught at the node boundary
  const badBuilder = (g) => { const s = E.newWorld(g); E.addPlayer(s, alice.playerId, 5, 5); s.players[alice.playerId].hp = -5; return s }
  assert.throws(() => new IntervalNode({ genesis, buildWorld: badBuilder, name: 'x', allowEphemeralStores: true }),
    /buildWorld produced an invalid state.*hp out of bounds/s)
  // a builder that embeds a DIFFERENT genesis is refused as ambiguous
  const swapBuilder = () => base(mkGenesis('some-other-world'))
  assert.throws(() => new IntervalNode({ genesis, buildWorld: swapBuilder, name: 'x', allowEphemeralStores: true }),
    /embedded a DIFFERENT genesis/)
  // the honest path still constructs
  const n = new IntervalNode({ genesis, buildWorld: (g) => base(g), name: 'x', witnessKey: w1, allowEphemeralStores: true })
  assert.equal(n.state.tick, 0)
})

test('canonical input schemas: one serialized form per action, at every gate', () => {
  const genesis = mkGenesis('schema-world')
  const worldId = E.worldId(genesis)
  const s = base(genesis)
  const sign = (fields) => E.signInput({ worldId, playerId: alice.playerId, tick: 0, ...fields }, alice.privateKey)

  // a junk-padded twin of a legitimate move is invalid EVERYWHERE
  const padded = sign({ type: 'move', dx: 1, dy: 0, memo: 'gm' })
  assert.match(E.validateInputShape(padded), /unknown field memo/)
  assert.equal(E.nextState(s, [padded]).players[alice.playerId].x, 5, 'engine ignores it')
  const prev = E.stateHash(s)
  const bundle = P.makeBundle({ worldId, tick: 0, round: 0, previousStateHash: prev, inputs: [padded], witness: w1 })
  assert.equal(P.validateBundle(s, worldId, bundle, null), 'non-canonical input shape')
  // missing required fields are equally invalid
  assert.match(E.validateInputShape(sign({ type: 'move', dx: 1 })), /missing field dy/)
  assert.match(E.validateInputShape(sign({ type: 'gather' })), /missing field nodeId/)
  assert.match(E.validateInputShape(sign({ type: 'teleport' })), /unknown input type/)
  // every canonical form is accepted by the shape gate
  const canon = {
    spawn: {}, stop: {}, cancel_trade: {}, invoke: {},
    move: { dx: 1, dy: 0 }, gather: { nodeId: 'n' }, harvest: { nodeId: 'n' },
    attack: { mobId: 'm' }, attackp: { targetId: bob.playerId }, recall: { to: 'ws' },
    offer_trade: { to: bob.playerId, giveSlot: 0, wantItem: null, wantGold: 1 },
    accept_trade: { from: bob.playerId }, smith: { recipe: 'bronze-sword' },
    wield: { slot: 0 }, sell: { slot: 0 }, plant: { slot: 0 }, light: { slot: 0 },
    bury: { slot: 0 }, deposit: { slot: 0 }, drop: { slot: 0 }, eat: { slot: 0 },
    cook: { slot: 0 }, unwield: { gear: 'weapon' }, buy: { item: 'logs' },
    withdraw: { item: 'logs' }, cast: { spell: 'anchor' },
    fletch: { slot: 0, make: 'bow' }, pickup: { groundId: 'g' }, claim_name: { name: 'ada' },
  }
  for (const [type, fields] of Object.entries(canon))
    assert.equal(E.validateInputShape(sign({ type, ...fields })), null, `${type} canonical form accepted`)
  // the item-form of a trade is canonical too — with its explicit zero
  assert.equal(E.validateInputShape(sign({ type: 'offer_trade', to: bob.playerId, giveSlot: 0, wantItem: 'logs', wantGold: 0 })), null)
})

test('banks are sparse: zero is absence in execution, validation, and imports', () => {
  const genesis = mkGenesis('bank-world')
  const worldId = E.worldId(genesis)
  // execution: withdrawing the last unit DELETES the key
  let s = base(genesis)
  E.addNode(s, 'bank-1', 'bank', 5, 6)
  s.players[alice.playerId].bank = { logs: 1 }
  s = E.nextState(s, [E.signInput({ worldId, playerId: alice.playerId, tick: 0, type: 'withdraw', item: 'logs' }, alice.privateKey)])
  assert.equal(s.players[alice.playerId].inventory.find(Boolean)?.item, 'logs')
  assert.ok(!('logs' in s.players[alice.playerId].bank), 'zero entry deleted')
  assert.equal(E.validateState(s), null)
  // validation: a zero entry is malformed
  const z = base(genesis)
  z.players[alice.playerId].bank = { ore: 0 }
  assert.match(E.validateState(z), /bank quantity out of bounds/)
  assert.match(E.validateImports([{ pid: alice.playerId, bank: { ore: 0 } }]), /quantity out of bounds/)
})

test('canonical founding: defaults match the classic generator, which is NAMED in genesis', () => {
  const g = E.makeGenesis('canon-world', RULES)
  assert.equal(g.worldW, 320); assert.equal(g.worldH, 200)
  assert.equal(g.worldGenerator, GENERATOR_ID)
  assert.ok(g.worldW >= WORLDGEN_MIN.w && g.worldH >= WORLDGEN_MIN.h, 'defaults clear the generator floor')
  // an unnamed or unknown generator is not a valid founding record
  const noGen = { ...mkGenesis('x') }; delete noGen.worldGenerator
  assert.match(E.validateGenesis(noGen), /genesis missing worldGenerator/)
  assert.match(E.validateGenesis({ ...mkGenesis('x'), worldGenerator: 'interval-hexcrawl-v9' }), /unknown world generator/)
  // and this node refuses to guess at another generator's world
  const foreign = mkGenesis('y')
  foreign.worldGenerator = 'interval-classic-v1'
  const w = buildWorld(foreign) // sanity: the real one builds
  assert.equal(E.validateState(w), null)
})
