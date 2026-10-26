// Rev7 brief: one canonical representation of every valid input, every
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

// §5c-ii: the XOR this test was written for is repealed with the one-sided
// offer. A side of a table has no demand field; it says what is ON it, which
// may be goods, or coin, or both, or nothing at all. What is still exact, and
// still consensus-critical because it is persisted and therefore hashed, is
// the shape: five keys, and the goods named one per slot.
test('a persisted side of a table is exactly five keys', () => {
  const genesis = mkGenesis('table-world')
  const t = (side) => {
    const s = base(genesis)
    s.players[alice.playerId].trade = side
    return E.validateState(s)
  }
  const whole = { with: bob.playerId, slots: [0], items: [{ item: 'logs', qty: 1 }], gold: 0, settled: false }
  assert.equal(t(whole), null, 'goods and no coin')
  assert.equal(t({ ...whole, slots: [], items: [], gold: 5 }), null, 'coin and no goods')
  assert.equal(t({ ...whole, gold: 5 }), null, 'both: a side is not a demand')
  assert.equal(t({ ...whole, slots: [], items: [] }), null, 'nothing at all, which is a gift')
  assert.match(t({ ...whole, extra: 1 }), /malformed trade shape/)
  const { gold, ...noGold } = whole
  assert.match(t(noGold), /malformed trade shape/)
  assert.match(t({ ...whole, items: [] }), /malformed trade goods/, 'one named good per named slot')
  // A STRANGER WHO IS NOT ANYBODY. This built one by changing alice's last
  // character to 'f', which is alice herself one run in sixteen, because the
  // identities are freshly generated and sometimes end in 'f' already. The
  // test then asserted that a table with a real partner was missing one, and
  // failed. Neither of these two can be all d's.
  const nobody = 'd'.repeat(64)
  assert.ok(nobody !== alice.playerId && nobody !== bob.playerId)
  assert.match(t({ ...whole, with: nobody }), /missing partner/)
  assert.match(t({ ...whole, settled: 'yes' }), /settled or it is not/)
  assert.match(t({ ...whole, slots: [1, 0], items: [{ item: 'logs', qty: 1 }, { item: 'logs', qty: 1 }] }),
    /ascending and unique/)
})

test('equipment slot correctness: the shared slotOf() rules every layer', () => {
  const genesis = mkGenesis('slot-world')
  assert.equal(E.slotOf('iron-helm'), 'head')
  assert.equal(E.slotOf('quick-plate'), 'body')
  assert.equal(E.slotOf('iron-sword'), 'weapon')
  const wearing = (eq, item) => {
    const s = base(genesis)
    s.players[alice.playerId].equipment[eq] = { item, qty: 1 }
    return E.validateState(s)
  }
  assert.match(wearing('weapon', 'iron-helm'), /wrong slot.*belongs in head/)
  assert.match(wearing('head', 'iron-sword'), /wrong slot.*belongs in weapon/)
  assert.match(wearing('weapon', 'quick-plate'), /wrong slot.*belongs in body/)
  assert.match(wearing('head', 'logs'), /not equippable/)
  assert.equal(wearing('head', 'iron-helm'), null)
  assert.equal(wearing('weapon', 'old-chain'), null)
  // imports obey the same rule
  assert.match(E.validateImports([{ pid: alice.playerId, weapon: { item: 'iron-helm', qty: 1 } }]), /different slot/)
  // and the ENGINE itself routes gear correctly: wield a helm → head slot
  const worldId = E.worldId(genesis)
  let s = base(genesis)
  s.players[alice.playerId].inventory[0] = { item: 'iron-helm', qty: 1 }
  s = E.nextState(s, [E.signInput({ worldId, playerId: alice.playerId, tick: 0, type: 'wield', slot: 0 }, alice.privateKey)])
  assert.equal(s.players[alice.playerId].equipment.head?.item, 'iron-helm')
  assert.equal(E.validateState(s), null)
})

test('IntervalNode enforces its own boundaries: genesis, built state, and genesis embedding', () => {
  // an invalid genesis never runs, whatever the caller believed
  assert.throws(() => new IntervalNode({ genesis: { worldW: 64 }, buildWorld, name: 'x' }),
    /refusing to run on an invalid genesis/)
  const genesis = mkGenesis('boundary-world')
  // a builder that returns an INVALID state is caught at the node boundary
  const badBuilder = (g) => { const s = E.newWorld(g); E.addPlayer(s, alice.playerId, 5, 5); s.players[alice.playerId].health = -5; return s }
  assert.throws(() => new IntervalNode({ genesis, buildWorld: badBuilder, name: 'x', allowEphemeralStores: true }),
    /buildWorld produced an invalid state.*health out of bounds/s)
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
  // pre-freeze §5: built THROUGH the normalizer, as any client must be --
  // EXCEPT where this test DELIBERATELY malforms an input to prove the gate
  // refuses it. Normalizing those throws before the assertion runs, so `raw`
  // signs exactly what it is handed.
  const sign = (fields) => E.signInput({ worldId, playerId: alice.playerId, tick: 0, ...E.normalizeInput(fields) }, alice.privateKey)
  const raw = (fields) => E.signInput({ worldId, playerId: alice.playerId, tick: 0, ...fields }, alice.privateKey)

  // a junk-padded twin of a legitimate move is invalid EVERYWHERE
  const padded = raw({ type: 'move', dx: 1, dy: 0, memo: 'gm' })
  assert.match(E.validateInputShape(padded), /unknown field memo/)
  assert.equal(E.nextState(s, [padded]).players[alice.playerId].x, 5, 'engine ignores it')
  const prev = E.stateHash(s)
  const bundle = P.makeBundle({ worldId, tick: 0, round: 0, previousStateHash: prev, inputs: [padded], witness: w1 })
  assert.equal(P.validateBundle(s, worldId, bundle, null), 'non-canonical input shape')
  // missing required fields are equally invalid
  assert.match(E.validateInputShape(raw({ type: 'move', dx: 1 })), /missing field dy/)
  assert.match(E.validateInputShape(raw({ type: 'gather' })), /missing field nodeId/)
  assert.match(E.validateInputShape(raw({ type: 'teleport' })), /unknown input type/)
  // every canonical form is accepted by the shape gate
  const canon = {
    spawn: {}, stop: {}, invoke: {}, settle: {}, untrade: {},
    move: { dx: 1, dy: 0 }, walk: { dx: 1, dy: 0, steps: 12 },
    gather: { nodeId: 'n' }, harvest: { nodeId: 'n' },
    attack: { mobId: 'm' }, attackp: { targetId: bob.playerId }, recall: { to: 'ws' },
    trade: { with: bob.playerId, slots: [0], gold: 1 }, smith: { recipe: 'iron-sword' },
    // §6l: `sell` is repealed -- a keeper buys nothing; a citizen raises a
    // stall and sells from it. §6ch: the waystones are gone, so `recall` only
    // ever fails, but its schema stays so an old client is refused rather than
    // desynced -- which is why it is still listed above.
    wield: { slot: 0 }, plant: { slot: 0 }, light: { slot: 0 },
    bury: { slot: 0 }, deposit: { slot: 0 }, drop: { slot: 0 }, eat: { slot: 0 },
    cook: { slot: 0 }, unwield: { gear: 'weapon' }, buy: { item: 'logs' },
    withdraw: { item: 'logs', qty: 1 }, cast: { spell: 'mend' },
    fletch: { slot: 0, make: 'bow' }, pickup: { groundId: 'g', confirm: false }, claim_name: { name: 'ada' },
  }
  for (const [type, fields] of Object.entries(canon))
    assert.equal(E.validateInputShape(sign({ type, ...fields })), null, `${type} canonical form accepted`)
  // §5c-ii: and a side with NOTHING on it is canonical too, which is how a
  // citizen sits down before deciding, and how a citizen gives something away
  assert.equal(E.validateInputShape(sign({ type: 'trade', with: bob.playerId, slots: [], gold: 0 })), null)
})

test('banks are sparse: zero is absence in execution, validation, and imports', () => {
  const genesis = mkGenesis('bank-world')
  const worldId = E.worldId(genesis)
  // execution: withdrawing the last unit DELETES the key
  let s = base(genesis)
  E.addNode(s, 'vault-1', 'vault', 5, 6)
  s.players[alice.playerId].vaults = { 'vault-1': { logs: 1 } }
  // a withdrawal names its quantity now, so this signed an input the gate
  // refused: nothing came out of the bank and the key was never deleted
  s = E.nextState(s, [E.signInput({ worldId, playerId: alice.playerId, tick: 0,
    ...E.normalizeInput({ type: 'withdraw', item: 'logs', qty: 1 }) }, alice.privateKey)])
  assert.equal(s.players[alice.playerId].inventory.find(Boolean)?.item, 'logs')
  // §6g: sparse twice over. The last log leaves the shelf, and the empty shelf
  // leaves the citizen -- nobody carries a permanent record of having once
  // stood at a counter.
  assert.ok(!('logs' in (s.players[alice.playerId].vaults['vault-1'] ?? {})), 'zero entry deleted')
  assert.ok(!('vault-1' in s.players[alice.playerId].vaults), 'and the emptied vault with it')
  assert.equal(E.validateState(s), null)
  // validation: a zero entry is malformed
  const z = base(genesis)
  z.players[alice.playerId].vaults = { 'vault-1': { ore: 0 } }
  assert.match(E.validateState(z), /vault quantity out of bounds/)
  assert.match(E.validateImports([{ pid: alice.playerId, vaults: { ore: 0 } }]), /quantity out of bounds/)
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
