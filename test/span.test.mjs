// §7a: THE WILD SPAN. A bridge the citizens build together over the one beck in
// the Wilds -- founded plank by plank, contested by whoever would rather it
// never stood, and recorded as a monument once it opens. These tests cover the
// lifecycle (found -> lay -> open -> cross), the accumulate-only rule, the rate
// cap, the history record, and -- the one thing that must never break -- that
// two engines replaying the same inputs compute the identical pool.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import E from '../engine.js'
import '../worldgen-expanse7.mjs'   // registers the expanse-7 terrain + span sites
import { makeExpanse7Genesis, SPAN_SITES } from '../worldgen-expanse7.mjs'

const RULES = 'a'.repeat(64)
// A small pool so a test can finish a crossing in a handful of interventions,
// without changing anything about how the pool behaves.
function genesis(pool = 12, perLay = 5) {
  const g = makeExpanse7Genesis('span-test', RULES, 0, 896, 512)
  g.span = { pool, perLay, xpPerPlank: 6 }
  return g
}
const SITE = SPAN_SITES[0]

function worldWith(g, who, { onSite = true, planks = 28 } = {}) {
  const s = E.newWorld(g)
  E.addPlayer(s, who.playerId, SITE.x, onSite ? SITE.y : SITE.y - 1)
  if (planks) s.players[who.playerId].inventory[0] = { item: 'planks', qty: planks }
  return s
}
const signer = (g, who) => (fields) =>
  E.signInput({ worldId: E.worldId(g), playerId: who.playerId, ...fields }, who.privateKey)
const step = (s, inputs) => E.nextState(s, inputs)
const spanworkId = (s) => Object.keys(s.nodes).find((id) => s.nodes[id].type === 'spanwork')
const spanId = (s) => Object.keys(s.nodes).find((id) => s.nodes[id].type === 'span')

test('the site is water and blocked before anyone builds', () => {
  const g = genesis()
  assert.equal(E.terrainBlocked(g, SITE.x, SITE.y), true, 'a wild crossing is water until it is bridged')
})

test('found lays the first plank and opens the history', () => {
  const g = genesis()
  const alice = E.generateIdentity()
  let s = worldWith(g, alice)
  const sign = signer(g, alice)
  s = step(s, [sign({ tick: s.tick, type: 'found', x: SITE.x, y: SITE.y })])
  const id = spanworkId(s)
  assert.ok(id, 'a spanwork stands after found')
  const n = s.nodes[id]
  assert.equal(n.laid, 1, 'the first plank is banked')
  assert.equal(n.need, g.span.pool, 'the goal is carried on the node')
  assert.equal(n.foundBy, alice.playerId, 'the founder is recorded')
  assert.equal(typeof n.foundAt, 'number', 'the interval of the first plank is recorded')
  assert.equal(n.foundAt, s.tick, 'the first plank is dated to the interval it landed')
  assert.deepEqual(n.hands, [alice.playerId], 'the founder is the first hand')
  assert.equal(n.dead, 0, 'no one has died on it yet')
  assert.equal(E.countItem(s.players[alice.playerId].inventory, 'planks'), 27, 'the plank left the pack')
  assert.equal(E.validateState(s) ?? 'OK', 'OK', 'a founded spanwork is constitutional')
})

test('you must stand ON the crossing tile to found it', () => {
  const g = genesis()
  const alice = E.generateIdentity()
  let s = worldWith(g, alice, { onSite: false }) // one tile north, on the bank
  const sign = signer(g, alice)
  s = step(s, [sign({ tick: s.tick, type: 'found', x: SITE.x, y: SITE.y })])
  assert.equal(spanworkId(s), undefined, 'a founder off the tile founds nothing')
})

test('you cannot found a tile that is not a declared crossing', () => {
  const g = genesis()
  const alice = E.generateIdentity()
  const s0 = E.newWorld(g)
  // a random water tile that is not a span site
  E.addPlayer(s0, alice.playerId, SITE.x + 40, SITE.y + 40)
  s0.players[alice.playerId].inventory[0] = { item: 'planks', qty: 5 }
  const sign = signer(g, alice)
  const s = step(s0, [sign({ tick: s0.tick, type: 'found', x: SITE.x + 40, y: SITE.y + 40 })])
  assert.equal(spanworkId(s), undefined, 'only the declared sites may be bridged')
})

test('lay banks planks up to the rate cap, and no further', () => {
  const g = genesis(100, 5)
  const alice = E.generateIdentity()
  let s = worldWith(g, alice)
  const sign = signer(g, alice)
  s = step(s, [sign({ tick: s.tick, type: 'found', x: SITE.x, y: SITE.y })])
  const id = spanworkId(s)
  // ask for five, get five
  s = step(s, [sign({ tick: s.tick, type: 'lay', nodeId: id, n: 5 })])
  assert.equal(s.nodes[id].laid, 6, 'five more banked onto the founding plank')
  // ask for more than the rate: the input is refused by shape, nothing banks
  const before = s.nodes[id].laid
  s = step(s, [sign({ tick: s.tick, type: 'lay', nodeId: id, n: 999 })])
  assert.equal(s.nodes[id].laid, before, 'the rate cap holds; an over-ask banks nothing')
})

test('the pool only ever rises -- there is no verb that lowers it', () => {
  // The whole design: a plank banked is permanent. We drive many lays and
  // confirm monotonic growth, then confirm the validator enforces the
  // finished/unfinished boundary -- a spanwork at or past its pool is not a
  // legal state, because the last plank must have turned it into a span. There
  // is no input that lowers `laid`, so a pool can only climb.
  const g = genesis(100, 5)
  const alice = E.generateIdentity()
  let s = worldWith(g, alice)
  const sign = signer(g, alice)
  s = step(s, [sign({ tick: s.tick, type: 'found', x: SITE.x, y: SITE.y })])
  const id = spanworkId(s)
  let last = s.nodes[id].laid
  for (let i = 0; i < 4; i++) {
    s = step(s, [sign({ tick: s.tick, type: 'lay', nodeId: id, n: 5 })])
    assert.ok(s.nodes[id].laid >= last, 'laid never decreases')
    last = s.nodes[id].laid
  }
  // a spanwork whose pool is full is not a legal resting state: the last plank
  // opens it. Forcing laid to need without the type change is rejected, which
  // is what guarantees no half-open limbo can be forged.
  const bad = JSON.parse(JSON.stringify(s))
  bad.nodes[id].laid = bad.nodes[id].need
  assert.equal(E.validateState(bad), 'a spanwork that should have become a span',
    'a full spanwork that never became a span is rejected')
})

test('the last plank turns the spanwork into a walkable span, with the full monument', () => {
  const g = genesis(12, 5)
  const alice = E.generateIdentity()
  let s = worldWith(g, alice)
  const sign = signer(g, alice)
  s = step(s, [sign({ tick: s.tick, type: 'found', x: SITE.x, y: SITE.y })]) // laid 1
  const id = spanworkId(s)
  // 1 + 5 + 5 + 1 = 12
  s = step(s, [sign({ tick: s.tick, type: 'lay', nodeId: id, n: 5 })]) // 6
  s = step(s, [sign({ tick: s.tick, type: 'lay', nodeId: id, n: 5 })]) // 11
  s = step(s, [sign({ tick: s.tick, type: 'lay', nodeId: id, n: 5 })]) // capped to need -> 12, opens
  const n = s.nodes[id]
  assert.equal(n.type, 'span', 'the work became a crossing')
  assert.ok(n.laid >= n.need, 'a finished span is full')
  assert.equal(n.doneBy, alice.playerId, 'the last hand is recorded')
  assert.equal(n.foundBy, alice.playerId, 'the first hand is still recorded')
  assert.equal(typeof n.doneAt, 'number', 'the interval it opened is recorded')
  assert.equal(n.tookTicks, n.doneAt - n.foundAt, 'the duration is first-plank to last-plank')
  assert.equal(E.validateState(s) ?? 'OK', 'OK', 'a finished span is constitutional')
})

test('a finished span carries everyone across; an unfinished one carries no one', () => {
  const g = genesis(12, 5)
  const alice = E.generateIdentity()  // builder, on the tile
  const bob = E.generateIdentity()    // crosser, on the west bank (the dry side)
  let s = E.newWorld(g)
  E.addPlayer(s, alice.playerId, SITE.x, SITE.y)
  s.players[alice.playerId].inventory[0] = { item: 'planks', qty: 28 }
  E.addPlayer(s, bob.playerId, SITE.x - 1, SITE.y)   // west bank is dry
  const signA = signer(g, alice), signB = signer(g, bob)
  const bobEast = () => signB({ tick: s.tick, type: 'move', dx: 1, dy: 0 })

  // before any span: bob cannot step east onto the water tile
  const t = step(s, [bobEast()])
  assert.equal(t.players[bob.playerId].x, SITE.x - 1, 'no one crosses open water')

  // build it to completion
  s = step(s, [signA({ tick: s.tick, type: 'found', x: SITE.x, y: SITE.y })])
  const id = spanworkId(s)
  while (s.nodes[id].type === 'spanwork') {
    s = step(s, [signA({ tick: s.tick, type: 'lay', nodeId: id, n: 5 })])
  }
  // alice steps east off the deck onto the far (east) bank, clearing the tile
  s = step(s, [signA({ tick: s.tick, type: 'move', dx: 1, dy: 0 })])
  assert.equal(s.players[alice.playerId].x, SITE.x + 1, 'alice walks off the finished span onto the east bank')

  // now bob crosses the finished span onto the (now empty) deck tile
  s = step(s, [bobEast()])
  assert.equal(s.players[bob.playerId].x, SITE.x, 'a finished span carries bob across')
})

test('two engines replaying the same inputs compute the identical pool (determinism)', () => {
  const alice = E.generateIdentity()
  function run() {
    const g = genesis(50, 5)
    let s = worldWith(g, alice)
    const sign = signer(g, alice)
    s = step(s, [sign({ tick: s.tick, type: 'found', x: SITE.x, y: SITE.y })])
    const id = spanworkId(s)
    for (let i = 0; i < 4; i++) s = step(s, [sign({ tick: s.tick, type: 'lay', nodeId: id, n: 5 })])
    return s
  }
  const a = run(), b = run()
  assert.equal(E.stateHash(a), E.stateHash(b), 'the same inputs compute the same world, to the plank')
})

test('the deaths-on-tile toll validates as a monotonic count and rejects nonsense', () => {
  const g = genesis()
  const alice = E.generateIdentity()
  let s = worldWith(g, alice)
  const sign = signer(g, alice)
  s = step(s, [sign({ tick: s.tick, type: 'found', x: SITE.x, y: SITE.y })])
  const id = spanworkId(s)
  s.nodes[id].dead = 40000
  assert.equal(E.validateState(s) ?? 'OK', 'OK', 'a heavy toll is constitutional')
  s.nodes[id].dead = -1
  assert.notEqual(E.validateState(s), null, 'a negative toll is rejected')
})

test('the span sites are on water in the Wilds, and there are few of them', () => {
  const g = genesis()
  const sites = E.TERRAINS[g.worldGenerator].spanSites(g)
  assert.ok(sites.length >= 1 && sites.length <= 4, 'crossings are scarce by design')
  for (const site of sites) {
    assert.equal(E.terrainBlocked(g, site.x, site.y), true, 'every site is water before it is bridged')
    assert.equal(E.inWilds(g, site.x, site.y), true, 'every site is in the Wilds')
  }
})
