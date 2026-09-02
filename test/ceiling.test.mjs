// §7dw: CLOSING TIME.
//
// A rolling ceiling on how much of the world one citizen may stand. Not a day
// — a day needs a wall clock, and every midnight anybody could pick is
// dinnertime for somebody else. A rolling window has no calendar, nothing to
// hoard, and nothing to race toward.
//
// These tests cover the ledger's arithmetic, the announcement, the stand-down
// at the single gate every input passes, that NOTHING IS TAKEN when it lands,
// that the window rolls a citizen back in, that presence is counted whether or
// not a stint is open — and that two engines replaying the same inputs agree
// on the interval a citizen stood down.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import E from '../engine.js'


const RULES = 'a'.repeat(64)

// Small enough to walk through: a 2400-interval window (100 per bin), 600 of
// standing allowed, 120 intervals of notice, sampled every 50.
const WINDOW = 2400, ALLOW = 600, WARN = 120, SAMPLE = 50

function genesis({ ceiling = true, window = WINDOW, allow = ALLOW, warn = WARN, sample = SAMPLE } = {}) {
  // the plain founding, not the expanse: a small walkable world is the right
  // instrument for a rule about time, and it runs in seconds rather than minutes
  const g = E.makeGenesis('ceiling-test', RULES, 0, 40, 30)
  g.stint = { cap: 7200, sample, remembers: 8, meets: sample * 3 }
  if (ceiling) g.ceiling = { window, allow, warn }; else delete g.ceiling
  return g
}

const signer = (g, who) => (fields) =>
  E.signInput({ worldId: E.worldId(g), playerId: who.playerId, ...fields }, who.privateKey)

function worldWith(g, people) {
  const s = E.newWorld(g)
  let i = 0
  for (const who of people) E.addPlayer(s, who.playerId, 5 + i++, 5)
  return s
}

// Find a direction this citizen can actually walk. Asserting on a move that
// the TERRAIN would have refused proves nothing about the ceiling.
function walkableDir(g, who) {
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    let s = worldWith(g, [who])
    const x0 = s.players[who.playerId].x, y0 = s.players[who.playerId].y
    s = E.nextState(s, [signer(g, who)({ tick: s.tick, type: 'move', dx, dy })])
    const p = s.players[who.playerId]
    if (p.x !== x0 || p.y !== y0) return [dx, dy]
  }
  throw new Error('this citizen is walled in; the test cannot judge a move')
}

// Walk forward, asserting presence each interval unless told otherwise.
function run(s, g, people, n, { awake = true } = {}) {
  for (let k = 0; k < n; k++) {
    const inputs = awake ? people.map((w) => signer(g, w)({ tick: s.tick, type: 'stop' })) : []
    s = E.nextState(s, inputs)
  }
  return s
}

// ---- the ledger ----

test('a citizen starts with the whole allowance', () => {
  const g = genesis()
  const alice = E.generateIdentity()
  const s = worldWith(g, [alice])
  assert.equal(E.ceilingLeft(s, alice.playerId), ALLOW, 'nothing stood yet')
  assert.equal(E.isStoodDown(s, alice.playerId), false)
})

test('presence spends the allowance, and only presence', () => {
  const g = genesis()
  const alice = E.generateIdentity()
  let s = worldWith(g, [alice])
  s = run(s, g, [alice], 200, { awake: true })
  const spent = ALLOW - E.ceilingLeft(s, alice.playerId)
  assert.ok(spent > 0, 'standing the world costs the allowance')

  const bob = E.generateIdentity()
  let t = worldWith(g, [bob])
  t = run(t, g, [bob], 200, { awake: false })
  // Arriving is itself an act: `addPlayer` stamps lastInput, so the first
  // sample after birth counts and no other does. One sample, and then silence.
  assert.equal(ALLOW - E.ceilingLeft(t, bob.playerId), SAMPLE,
    'absence past the moment of arrival costs nothing at all')
  assert.ok(spent >= 4 * SAMPLE, 'while standing the world costs a sample for every sample of it')
})

test('a world with no ceiling has none', () => {
  const g = genesis({ ceiling: false })
  const alice = E.generateIdentity()
  let s = worldWith(g, [alice])
  s = run(s, g, [alice], 300)
  assert.equal(E.ceilingLeft(s, alice.playerId), Infinity, 'a founding may omit it')
  assert.equal(E.isStoodDown(s, alice.playerId), false)
})

test('the ledger stays the same twenty-four integers however long a citizen stands', () => {
  const g = genesis()
  const alice = E.generateIdentity()
  let s = worldWith(g, [alice])
  s = run(s, g, [alice], 3000)
  const led = s.players[alice.playerId].ledger
  assert.equal(led.bins.length, E.CEIL_BINS, 'bounded by construction, not by how long you played')
  assert.equal(E.validateState(s) ?? 'OK', 'OK')
})

// ---- the constitution refuses a ceiling that is not one ----

test('a ceiling at or above its own window never binds and is refused', () => {
  const g = genesis()
  g.ceiling = { window: 2400, allow: 2400, warn: 100 }
  assert.notEqual(E.validateState(E.newWorld(g)) ?? 'OK', 'OK')
})

test('a notice as long as the allowance is refused', () => {
  const g = genesis()
  g.ceiling = { window: 2400, allow: 600, warn: 600 }
  assert.notEqual(E.validateState(E.newWorld(g)) ?? 'OK', 'OK')
})

test('a window that does not divide into bins is refused', () => {
  const g = genesis()
  g.ceiling = { window: 2401, allow: 600, warn: 120 }
  assert.notEqual(E.validateState(E.newWorld(g)) ?? 'OK', 'OK')
})

test('a ceiling without a stint has no clock and is refused', () => {
  const g = genesis()
  delete g.stint
  assert.notEqual(E.validateState(E.newWorld(g)) ?? 'OK', 'OK')
})

// ---- closing time ----

test('the allowance runs out, and the citizen stands down', () => {
  const g = genesis()
  const alice = E.generateIdentity()
  let s = worldWith(g, [alice])
  s = run(s, g, [alice], ALLOW + 3 * SAMPLE)
  assert.equal(E.ceilingLeft(s, alice.playerId), 0, 'the allowance is spent')
  assert.equal(E.isStoodDown(s, alice.playerId), true, 'and closing time has come')
})

test('closing time is announced before it lands, not at it', () => {
  const g = genesis()
  const alice = E.generateIdentity()
  let s = worldWith(g, [alice])
  let warned = null, downAt = null
  for (let k = 0; k < ALLOW + 5 * SAMPLE; k++) {
    s = E.nextState(s, [signer(g, alice)({ tick: s.tick, type: 'stop' })])
    const left = E.ceilingLeft(s, alice.playerId)
    if (warned === null && left <= WARN && left > 0) warned = s.tick
    if (downAt === null && left <= 0) downAt = s.tick
  }
  assert.ok(warned !== null, 'the world says so first')
  assert.ok(downAt !== null && downAt > warned, 'and only then stops')
  assert.ok(downAt - warned >= WARN - SAMPLE,
    'the notice is roughly the notice: a bounded session works because you knew it was coming')
})

test('the stood down act on nothing — at the one gate every input passes', () => {
  const g = genesis()
  const alice = E.generateIdentity()
  let s = worldWith(g, [alice])
  s = run(s, g, [alice], ALLOW + 3 * SAMPLE)
  assert.equal(E.isStoodDown(s, alice.playerId), true)
  const before = { x: s.players[alice.playerId].x, y: s.players[alice.playerId].y }
  const [dx, dy] = walkableDir(g, alice)   // a move that WOULD have worked
  s = E.nextState(s, [signer(g, alice)({ tick: s.tick, type: 'move', dx, dy })])
  assert.deepEqual({ x: s.players[alice.playerId].x, y: s.players[alice.playerId].y }, before,
    'no verb slips under it')
  // and a stint cannot be sworn to escape it either
  s = E.nextState(s, [signer(g, alice)({ tick: s.tick, type: 'stint', n: 600 })])
  assert.equal(s.players[alice.playerId].stint, undefined, 'nor sworn around')
})

test('NOTHING IS TAKEN when closing time lands', () => {
  const g = genesis()
  const alice = E.generateIdentity()
  let s = worldWith(g, [alice])
  const before = s.players[alice.playerId]
  const snap = { hp: before.hp, gold: before.gold, inv: JSON.stringify(before.inventory), skills: JSON.stringify(before.skills), x: before.x, y: before.y }
  s = run(s, g, [alice], ALLOW + 3 * SAMPLE)
  const after = s.players[alice.playerId]
  assert.equal(after.hp, snap.hp, 'no health')
  assert.equal(after.gold, snap.gold, 'no coin')
  assert.equal(JSON.stringify(after.inventory), snap.inv, 'no pack')
  assert.equal(JSON.stringify(after.skills), snap.skills, 'no skill')
  assert.deepEqual({ x: after.x, y: after.y }, { x: snap.x, y: snap.y },
    'and the body stands where it stood: this is a stand down, not a freeze')
  assert.equal(E.validateState(s) ?? 'OK', 'OK')
})

test('the window rolls, and the citizen may act again', () => {
  const g = genesis()
  const alice = E.generateIdentity()
  let s = worldWith(g, [alice])
  s = run(s, g, [alice], ALLOW + 3 * SAMPLE)
  assert.equal(E.isStoodDown(s, alice.playerId), true, 'shut out')
  s = run(s, g, [alice], WINDOW + 200, { awake: false })   // wait the window out
  assert.equal(E.isStoodDown(s, alice.playerId), false, 'and let back in, by arithmetic')
  assert.equal(E.ceilingLeft(s, alice.playerId), ALLOW, 'with the whole allowance restored')
  const bx = s.players[alice.playerId].x, by = s.players[alice.playerId].y
  const [dx, dy] = walkableDir(g, alice)
  s = E.nextState(s, [signer(g, alice)({ tick: s.tick, type: 'move', dx, dy })])
  const now = s.players[alice.playerId]
  assert.ok(now.x !== bx || now.y !== by, 'and acting works again')
})

test('a ceiling cannot be escaped by never swearing a stint', () => {
  const g = genesis()
  const alice = E.generateIdentity()
  let s = worldWith(g, [alice])
  assert.equal(s.players[alice.playerId].stint, undefined, 'no promise at any point')
  s = run(s, g, [alice], ALLOW + 3 * SAMPLE)
  assert.equal(E.isStoodDown(s, alice.playerId), true,
    'presence is counted whether or not anybody was told about it')
})

// ---- and the one that must never break ----

test('two engines agree on the interval a citizen stands down', () => {
  const g = genesis()
  const alice = E.generateIdentity()
  const script = []
  let a = worldWith(g, [alice]), b = worldWith(g, [alice])
  for (let k = 0; k < ALLOW + 4 * SAMPLE; k++)
    script.push([signer(g, alice)({ tick: a.tick + k, type: 'stop' })])

  let downA = null, downB = null
  for (const inputs of script) { a = E.nextState(a, inputs); if (downA === null && E.isStoodDown(a, alice.playerId)) downA = a.tick }
  for (const inputs of script) { b = E.nextState(b, inputs); if (downB === null && E.isStoodDown(b, alice.playerId)) downB = b.tick }

  assert.equal(downA, downB, 'to the interval')
  assert.equal(E.stateHash(a), E.stateHash(b), 'and to the byte')
  assert.deepEqual(a.players[alice.playerId].ledger, b.players[alice.playerId].ledger)
})
