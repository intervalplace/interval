// §7dv: THE TIDE, AND THE STINT.
//
// The tide is the world's weather: windows computed from the interval count,
// the same for everyone, readable forward and backward forever. The stint is
// a citizen's promise made against it -- a length named in advance, settled
// into a record when it runs out.
//
// These tests cover the tide's arithmetic and its forecast, the swearing and
// settling of a stint, the two tallies that hold the gap between what was
// sworn and what was stood, the co-presence tally that is the whole point of
// the thing, the gates on the far channel and on the keeping of a name, and
// -- the one that must never break -- that two engines replaying the same
// inputs settle the identical record.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import E from '../engine.js'

import '../worldgen-expanse7.mjs'
import { makeExpanse7Genesis } from '../worldgen-expanse7.mjs'

const RULES = 'a'.repeat(64)

// Small, coprime, and unrelated to any clock -- the same property the real
// founding wants, at a size a test can walk through.
const PERIODS = [40, 63]
const OPENS = [12, 20]

function genesis({ tide = true, stint = true, cap = 60, sample = 5, remembers = 8, meets = 10 } = {}) {
  const g = makeExpanse7Genesis('stint-test', RULES, 0, 896, 512)
  // the real founding now carries both tables (§7dv), so a test of a world
  // WITHOUT them has to take them off rather than merely not add them
  if (tide) g.tide = { periods: [...PERIODS], opens: [...OPENS] }; else delete g.tide
  if (stint) g.stint = { cap, sample, remembers, meets }; else delete g.stint
  return g
}

const signer = (g, who) => (fields) =>
  E.signInput({ worldId: E.worldId(g), playerId: who.playerId, ...fields }, who.privateKey)
const step = (s, inputs = []) => E.nextState(s, inputs)

// A citizen's own key is their character; two of them standing together is
// the only interesting configuration this feature has.
function worldWith(g, people, { apart = false } = {}) {
  const s = E.newWorld(g)
  let i = 0
  for (const who of people) {
    // side by side, or a long way off -- past FOLLOW_LOSE either way when apart
    E.addPlayer(s, who.playerId, apart ? 40 + i * 200 : 40 + i, 40)
    i++
  }
  return s
}

// Walk the world forward n intervals, re-signing a cheap keep-alive input each
// interval for everyone named, so `isAwake` stays true and presence is real.
function run(s, g, people, n, { awake = true } = {}) {
  for (let k = 0; k < n; k++) {
    const inputs = []
    if (awake) {
      for (const who of people) {
        // `stop` is the cheapest legal input in the world: it asserts presence
        // and changes nothing else.
        inputs.push(signer(g, who)({ tick: s.tick, type: 'stop' }))
      }
    }
    s = step(s, inputs)
  }
  return s
}

// ---- the tide: pure arithmetic on the interval count ----

test('a tide is up for its open and shut for the rest of its period', () => {
  const g = genesis()
  assert.equal(E.tideUp(g, 0, 0), true, 'the count starts inside the window')
  assert.equal(E.tideUp(g, OPENS[0] - 1, 0), true, 'the last interval of the window is still in it')
  assert.equal(E.tideUp(g, OPENS[0], 0), false, 'and the next one is not')
  assert.equal(E.tideUp(g, PERIODS[0], 0), true, 'a full period later it is up again')
  assert.equal(E.tideUp(g, PERIODS[0] + OPENS[0], 0), false, 'and shut again on the same schedule')
})

test('the tide is a pure function of the interval count and nothing else', () => {
  const g = genesis()
  for (const t of [0, 1, 37, 500, 123456, 9999999]) {
    assert.equal(E.tideUp(g, t, 0), E.tideUp(g, t + PERIODS[0], 0), 'the same phase gives the same answer forever')
    assert.equal(E.tideUp(g, t, 1), E.tideUp(g, t + PERIODS[1], 1), 'and independently for each tide')
  }
})

test('the forecast says exactly when a tide next turns, in both directions', () => {
  const g = genesis()
  assert.equal(E.nextTideTurn(g, 0, 0), OPENS[0], 'from inside the window, the turn is the shutting')
  assert.equal(E.nextTideTurn(g, OPENS[0], 0), PERIODS[0], 'from outside it, the turn is the next opening')
  // and it is always in the future, and always lands on a real change
  for (const t of [0, 3, 11, 12, 39, 40, 41, 999]) {
    const at = E.nextTideTurn(g, t, 0)
    assert.ok(at > t, 'a forecast never points backwards')
    assert.notEqual(E.tideUp(g, at, 0), E.tideUp(g, t, 0), 'and it points at a change')
  }
})

test('tides precess: coprime periods never lock to the same phase', () => {
  const g = genesis()
  // over one full lcm the two tides disagree constantly -- so no hour of any
  // clock is permanently the dead hour
  let both = 0, neither = 0, one = 0
  for (let t = 0; t < PERIODS[0] * PERIODS[1]; t++) {
    const a = E.tideUp(g, t, 0), b = E.tideUp(g, t, 1)
    if (a && b) both++; else if (!a && !b) neither++; else one++
  }
  assert.ok(both > 0 && one > 0 && neither > 0, 'all three states occur over a full cycle')
})

test('a world with no tide has no far channel and no gate', () => {
  const g = genesis({ tide: false })
  assert.equal(E.anyTideOpen(g, 0), false, 'no tide is ever up')
  assert.deepEqual(E.tidesOpen(g, 0), [], 'and none is listed')
})

// ---- the constitution refuses a tide that is not one ----

test('a tide that never closes is not constitutional', () => {
  const g = genesis()
  g.tide = { periods: [40], opens: [40] }
  const s = E.newWorld(g)
  assert.notEqual(E.validateState(s) ?? 'OK', 'OK', 'an always-open channel wearing the word is refused')
})

test('the tide wants its two lists the same length', () => {
  const g = genesis()
  g.tide = { periods: [40, 63], opens: [12] }
  const s = E.newWorld(g)
  assert.notEqual(E.validateState(s) ?? 'OK', 'OK', 'a period without an open is refused')
})

test('a stint sample longer than the cap is refused', () => {
  const g = genesis()
  g.stint = { cap: 10, sample: 50, remembers: 8 }
  const s = E.newWorld(g)
  assert.notEqual(E.validateState(s) ?? 'OK', 'OK', 'a promise shorter than its own measurement is refused')
})

// ---- swearing ----

test('a stint is sworn for a named length and opens at the interval it lands', () => {
  const g = genesis()
  const alice = E.generateIdentity()
  let s = worldWith(g, [alice])
  const sign = signer(g, alice)
  const at = s.tick
  s = step(s, [sign({ tick: at, type: 'stint', n: 20 })])
  const st = s.players[alice.playerId].stint
  assert.ok(st, 'a stint stands')
  assert.equal(st.to - st.from, 20, 'for exactly the length sworn')
  assert.equal(st.kept, 0, 'nothing stood yet')
  assert.deepEqual(st.met, {}, 'and nobody beside them yet')
  assert.equal(s.players[alice.playerId].sworn, 20, 'what was promised is tallied at once')
  assert.equal(E.validateState(s) ?? 'OK', 'OK', 'an open stint is constitutional')
})

test('a stint cannot be sworn over a running one', () => {
  const g = genesis()
  const alice = E.generateIdentity()
  let s = worldWith(g, [alice])
  const sign = signer(g, alice)
  s = step(s, [sign({ tick: s.tick, type: 'stint', n: 30 })])
  const first = { ...s.players[alice.playerId].stint }
  s = step(s, [sign({ tick: s.tick, type: 'stint', n: 60 })])
  assert.deepEqual(
    { from: s.players[alice.playerId].stint.from, to: s.players[alice.playerId].stint.to },
    { from: first.from, to: first.to },
    'the promise you are keeping is the promise you made')
  assert.equal(s.players[alice.playerId].sworn, 30, 'and a refused oath is not tallied')
})

test('a stint longer than the cap is refused whole', () => {
  const g = genesis({ cap: 25 })
  const alice = E.generateIdentity()
  let s = worldWith(g, [alice])
  s = step(s, [signer(g, alice)({ tick: s.tick, type: 'stint', n: 26 })])
  assert.equal(s.players[alice.playerId].stint, undefined, 'no stint at all, rather than a shortened one')
  assert.equal(s.players[alice.playerId].sworn, undefined, 'and nothing tallied')
})

test('a world with no stint config offers no stint verb', () => {
  const g = genesis({ stint: false })
  const alice = E.generateIdentity()
  let s = worldWith(g, [alice])
  s = step(s, [signer(g, alice)({ tick: s.tick, type: 'stint', n: 10 })])
  assert.equal(s.players[alice.playerId].stint, undefined, 'a founding that omits it has none')
})

// ---- standing, and settling ----

test('a stint settles into a record when it runs out, and the open one is gone', () => {
  const g = genesis({ sample: 5 })
  const alice = E.generateIdentity()
  let s = worldWith(g, [alice])
  s = step(s, [signer(g, alice)({ tick: s.tick, type: 'stint', n: 20 })])
  s = run(s, g, [alice], 25)
  const p = s.players[alice.playerId]
  assert.equal(p.stint, undefined, 'the open promise is closed')
  assert.equal(p.stints.length, 1, 'and one record settled')
  assert.equal(p.stints[0].to - p.stints[0].from, 20, 'for the length sworn')
  assert.ok(p.stints[0].kept > 0, 'and something was stood in it')
  assert.equal(E.validateState(s) ?? 'OK', 'OK', 'a settled record is constitutional')
})

test('what was stood is counted from presence, not asserted', () => {
  const g = genesis({ sample: 5 })
  const alice = E.generateIdentity()
  let s = worldWith(g, [alice])
  s = step(s, [signer(g, alice)({ tick: s.tick, type: 'stint', n: 40 })])
  // present for the first stretch, then silent -- no inputs at all
  s = run(s, g, [alice], 12, { awake: true })
  const partway = s.players[alice.playerId].stint.kept
  assert.ok(partway > 0, 'presence accrues while the citizen acts')
  s = run(s, g, [alice], 40, { awake: false })
  const rec = s.players[alice.playerId].stints[0]
  assert.ok(rec.kept < rec.to - rec.from, 'silence does not accrue, so the promise is not fully stood')
})

test('the world does not punish the gap between sworn and stood, it declines to forget it', () => {
  const g = genesis({ sample: 5 })
  const alice = E.generateIdentity()
  let s = worldWith(g, [alice])
  s = step(s, [signer(g, alice)({ tick: s.tick, type: 'stint', n: 40 })])
  s = run(s, g, [alice], 45, { awake: false })   // sworn forty, and then gone
  const p = s.players[alice.playerId]
  assert.equal(p.sworn, 40, 'the oath is on the record')
  // the swearing itself is an input, so the first sample after it counts --
  // they WERE there, for that much. Everything after is silence.
  assert.equal(p.stood, g.stint.sample, 'and so is the standing: one sample, and no more')
  assert.ok(p.stood < 40, 'far short of what was promised')
  assert.equal(p.hp > 0, true, 'and nothing was taken for the difference')
  assert.equal(E.validateState(s) ?? 'OK', 'OK')
})

test('a settled record keeps only what the founding remembers', () => {
  const g = genesis({ sample: 2, remembers: 3 })
  const alice = E.generateIdentity()
  let s = worldWith(g, [alice])
  const sign = signer(g, alice)
  for (let i = 0; i < 5; i++) {
    s = step(s, [sign({ tick: s.tick, type: 'stint', n: 6 })])
    s = run(s, g, [alice], 8)
  }
  assert.equal(s.players[alice.playerId].stints.length, 3, 'the oldest fall off the end')
  const [a, b, c] = s.players[alice.playerId].stints
  assert.ok(a.from > b.from && b.from > c.from, 'newest first')
})

// ---- the tally that is the whole point ----

test('two citizens in stints side by side tally each other', () => {
  const g = genesis({ sample: 5 })
  const alice = E.generateIdentity(), bob = E.generateIdentity()
  let s = worldWith(g, [alice, bob])
  s = step(s, [
    signer(g, alice)({ tick: s.tick, type: 'stint', n: 30 }),
    signer(g, bob)({ tick: s.tick, type: 'stint', n: 30 }),
  ])
  s = run(s, g, [alice, bob], 35)
  const ra = s.players[alice.playerId].stints[0]
  const rb = s.players[bob.playerId].stints[0]
  assert.ok(ra.met.length === 1 && ra.met[0][0] === bob.playerId, 'alice was not alone')
  assert.ok(rb.met.length === 1 && rb.met[0][0] === alice.playerId, 'and neither was bob')
  assert.equal(ra.met[0][1], rb.met[0][1], 'and they were together for the same count')
})

test('a citizen alone in a perfect stint tallies nobody', () => {
  const g = genesis({ sample: 5 })
  const alice = E.generateIdentity()
  let s = worldWith(g, [alice])
  s = step(s, [signer(g, alice)({ tick: s.tick, type: 'stint', n: 30 })])
  s = run(s, g, [alice], 35)
  const rec = s.players[alice.playerId].stints[0]
  assert.equal(rec.kept, 30, 'the promise was stood to the interval')
  assert.deepEqual(rec.met, [], 'AND IT COUNTS FOR NOBODY: what a script cannot do is make anyone else show up')
})

test('two citizens in stints far apart tally nothing', () => {
  const g = genesis({ sample: 5 })
  const alice = E.generateIdentity(), bob = E.generateIdentity()
  let s = worldWith(g, [alice, bob], { apart: true })
  s = step(s, [
    signer(g, alice)({ tick: s.tick, type: 'stint', n: 30 }),
    signer(g, bob)({ tick: s.tick, type: 'stint', n: 30 }),
  ])
  s = run(s, g, [alice, bob], 35)
  assert.deepEqual(s.players[alice.playerId].stints[0].met, [], 'distance is real here')
})

test('a citizen beside somebody who swore nothing tallies nothing', () => {
  const g = genesis({ sample: 5 })
  const alice = E.generateIdentity(), bob = E.generateIdentity()
  let s = worldWith(g, [alice, bob])
  s = step(s, [signer(g, alice)({ tick: s.tick, type: 'stint', n: 30 })])
  s = run(s, g, [alice, bob], 35)
  assert.deepEqual(s.players[alice.playerId].stints[0].met, [],
    'an overlap needs two promises, or it is a coincidence')
})

// ---- the far channel, and the name ----

test('the far channel needs both a tide up and an open stint', () => {
  const g = genesis()
  const alice = E.generateIdentity()
  let s = worldWith(g, [alice])
  // no stint yet, tide up at interval zero
  assert.equal(E.anyTideOpen(g, s.tick), true, 'the tide is up to begin with')
  assert.equal(E.maySpeakFar(s, alice.playerId), false, 'but an unsworn citizen has no licence')
  s = step(s, [signer(g, alice)({ tick: s.tick, type: 'stint', n: 50 })])
  assert.equal(E.maySpeakFar(s, alice.playerId), true, 'sworn, and the band up: heard')
})

test('when the tide shuts the far channel shuts with it, stint or no stint', () => {
  const g = genesis()
  const alice = E.generateIdentity()
  let s = worldWith(g, [alice])
  s = step(s, [signer(g, alice)({ tick: s.tick, type: 'stint', n: 60 })])
  // walk to an interval where no tide is up
  let t = s.tick
  while (E.anyTideOpen(g, t) && t < 5000) t++
  s = run(s, g, [alice], t - s.tick)
  assert.equal(E.anyTideOpen(g, s.tick), false, 'the band has closed')
  assert.equal(E.stintOpen(s.players[alice.playerId], s.tick), true, 'the promise is still open')
  assert.equal(E.maySpeakFar(s, alice.playerId), false, 'and still nobody can be reached')
})

test('a voice near is never gated, by anything', () => {
  const g = genesis()
  const alice = E.generateIdentity(), bob = E.generateIdentity()
  const s = worldWith(g, [alice, bob])
  assert.equal(E.withinEarshot(s, alice.playerId, bob.playerId), true,
    'standing beside somebody is not the network, it is being somewhere')
})

test('earshot ends where this world already says two people are no longer together', () => {
  const g = genesis()
  const alice = E.generateIdentity(), bob = E.generateIdentity()
  const s = worldWith(g, [alice, bob], { apart: true })
  assert.equal(E.withinEarshot(s, alice.playerId, bob.playerId), false)
})

test('a name is kept only inside a tide, and by two citizens who both swore', () => {
  const g = genesis()
  const alice = E.generateIdentity(), bob = E.generateIdentity()
  let s = worldWith(g, [alice, bob])
  const signA = signer(g, alice)
  // neither has sworn: the tide is up, and it is still not enough
  s = step(s, [signA({ tick: s.tick, type: 'befriend', targetId: bob.playerId })])
  assert.equal(s.players[alice.playerId].friends, undefined, 'a name needs two promises')
  // alice swears, bob does not
  s = step(s, [signA({ tick: s.tick, type: 'stint', n: 50 })])
  s = step(s, [signA({ tick: s.tick, type: 'befriend', targetId: bob.playerId })])
  assert.equal(s.players[alice.playerId].friends, undefined, 'one promise is still one')
  // and now both
  s = step(s, [signer(g, bob)({ tick: s.tick, type: 'stint', n: 50 })])
  s = step(s, [signA({ tick: s.tick, type: 'befriend', targetId: bob.playerId })])
  assert.deepEqual(s.players[alice.playerId].friends, [bob.playerId], 'both present, both sworn: the name is kept')
})

test('the bond outlives the tide that made it', () => {
  const g = genesis()
  const alice = E.generateIdentity(), bob = E.generateIdentity()
  let s = worldWith(g, [alice, bob])
  s = step(s, [
    signer(g, alice)({ tick: s.tick, type: 'stint', n: 60 }),
    signer(g, bob)({ tick: s.tick, type: 'stint', n: 60 }),
  ])
  s = step(s, [signer(g, alice)({ tick: s.tick, type: 'befriend', targetId: bob.playerId })])
  s = run(s, g, [alice, bob], 200)   // well past the stint AND past the tide
  assert.deepEqual(s.players[alice.playerId].friends, [bob.playerId],
    'the contact is bounded; the record of it is not')
})

test('a world without a tide leaves befriending exactly as it was', () => {
  const g = genesis({ tide: false, stint: false })
  const alice = E.generateIdentity(), bob = E.generateIdentity()
  let s = worldWith(g, [alice, bob])
  s = step(s, [signer(g, alice)({ tick: s.tick, type: 'befriend', targetId: bob.playerId })])
  assert.deepEqual(s.players[alice.playerId].friends, [bob.playerId], 'no tide, no gate')
})

// ---- and the one that must never break ----

test('two engines replaying the same inputs settle the identical record', () => {
  const g = genesis({ sample: 5 })
  const alice = E.generateIdentity(), bob = E.generateIdentity()
  const script = []
  let a = worldWith(g, [alice, bob])
  let b = worldWith(g, [alice, bob])

  const open = [
    signer(g, alice)({ tick: a.tick, type: 'stint', n: 40 }),
    signer(g, bob)({ tick: a.tick, type: 'stint', n: 40 }),
  ]
  script.push(open)
  for (let k = 0; k < 45; k++) {
    // the same signed bytes fed to both engines, so nothing differs but the run
    const tick = a.tick + k + 1
    script.push([
      signer(g, alice)({ tick, type: 'stop' }),
      signer(g, bob)({ tick, type: 'stop' }),
    ])
  }
  for (const inputs of script) { a = E.nextState(a, inputs) }
  for (const inputs of script) { b = E.nextState(b, inputs) }

  assert.equal(E.stateHash(a), E.stateHash(b), 'the same inputs give the same world, to the byte')
  assert.deepEqual(a.players[alice.playerId].stints, b.players[alice.playerId].stints,
    'and the identical settled record')
  assert.ok(a.players[alice.playerId].stints[0].met.length === 1, 'which is not an empty one')
})

test('the tally is sorted deterministically, longest first then by id', () => {
  const g = genesis({ sample: 5 })
  const alice = E.generateIdentity(), bob = E.generateIdentity(), carol = E.generateIdentity()
  let s = worldWith(g, [alice, bob, carol])
  s = step(s, [
    signer(g, alice)({ tick: s.tick, type: 'stint', n: 30 }),
    signer(g, bob)({ tick: s.tick, type: 'stint', n: 30 }),
    signer(g, carol)({ tick: s.tick, type: 'stint', n: 30 }),
  ])
  s = run(s, g, [alice, bob, carol], 35)
  const met = s.players[alice.playerId].stints[0].met
  assert.equal(met.length, 2, 'both of the others')
  for (let i = 1; i < met.length; i++) {
    const [pid0, n0] = met[i - 1], [pid1, n1] = met[i]
    assert.ok(n0 > n1 || (n0 === n1 && pid0 < pid1), 'longest first, ties broken by id')
  }
})

// ---- §7dv: THE MEASURE IS DISTINCT PEOPLE, NOT HOURS OF OVERLAP ----
//
// A script standing alone tallies nobody, and that was always true. A FARM is
// the case that broke it: one operator running two citizens stands them side
// by side, both sworn, both present, and overlap measured in intervals is
// inflated by simply leaving them there. What accumulates instead is the count
// of DISTINCT citizens ever met.

test('a farm standing two of its own keys together forever counts as one acquaintance each', () => {
  const g = genesis({ sample: 5, meets: 10 })
  const a = E.generateIdentity(), b = E.generateIdentity()
  let s = worldWith(g, [a, b])
  // eight full stints side by side -- an operator leaving the machines running
  for (let i = 0; i < 8; i++) {
    s = step(s, [
      signer(g, a)({ tick: s.tick, type: 'stint', n: 40 }),
      signer(g, b)({ tick: s.tick, type: 'stint', n: 40 }),
    ])
    s = run(s, g, [a, b], 45)
  }
  assert.deepEqual(s.players[a.playerId].known, [b.playerId], 'once is once, however long they stood there')
  assert.deepEqual(s.players[b.playerId].known, [a.playerId])
  // and the overlap intervals DID pile up -- which is exactly why they are not
  // the thing that gets counted
  const total = s.players[a.playerId].stints.reduce((n, r) => n + (r.met[0]?.[1] ?? 0), 0)
  assert.ok(total > 40 * 4, 'hours of overlap accumulate freely')
  assert.equal(s.players[a.playerId].known.length, 1, 'and buy exactly one acquaintance')
})

test('meeting new people is what raises the number', () => {
  const g = genesis({ sample: 5, meets: 10 })
  const a = E.generateIdentity(), b = E.generateIdentity(), c = E.generateIdentity()
  let s = worldWith(g, [a, b, c])
  s = step(s, [
    signer(g, a)({ tick: s.tick, type: 'stint', n: 40 }),
    signer(g, b)({ tick: s.tick, type: 'stint', n: 40 }),
    signer(g, c)({ tick: s.tick, type: 'stint', n: 40 }),
  ])
  s = run(s, g, [a, b, c], 45)
  assert.equal(s.players[a.playerId].known.length, 2, 'two distinct people, two entries')
  assert.deepEqual(s.players[a.playerId].known, [b.playerId, c.playerId].sort(), 'sorted and distinct')
})

test('a passing is not a meeting', () => {
  const g = genesis({ sample: 5, meets: 30 })   // half a minute of the test world
  const a = E.generateIdentity(), b = E.generateIdentity()
  let s = worldWith(g, [a, b])
  s = step(s, [
    signer(g, a)({ tick: s.tick, type: 'stint', n: 15 }),   // shorter than `meets`
    signer(g, b)({ tick: s.tick, type: 'stint', n: 15 }),
  ])
  s = run(s, g, [a, b], 20)
  assert.equal(s.players[a.playerId].known, undefined, 'brief company is not acquaintance')
  assert.ok(s.players[a.playerId].stints[0].met.length === 1, 'though the overlap itself was recorded')
})

test('a script alone knows nobody, however perfectly it stands', () => {
  const g = genesis({ sample: 5, meets: 10 })
  const a = E.generateIdentity()
  let s = worldWith(g, [a])
  for (let i = 0; i < 6; i++) {
    s = step(s, [signer(g, a)({ tick: s.tick, type: 'stint', n: 40 })])
    s = run(s, g, [a], 45)
  }
  assert.equal(s.players[a.playerId].known, undefined, 'flawless, and known to nobody')
  assert.equal(E.validateState(s) ?? 'OK', 'OK')
})

test('the known list stays sorted and distinct, and validates', () => {
  const g = genesis({ sample: 5, meets: 10 })
  const people = [E.generateIdentity(), E.generateIdentity(), E.generateIdentity(), E.generateIdentity()]
  let s = worldWith(g, people)
  s = step(s, people.map((w) => signer(g, w)({ tick: s.tick, type: 'stint', n: 40 })))
  s = run(s, g, people, 45)
  const k = s.players[people[0].playerId].known
  assert.equal(k.length, 3)
  assert.deepEqual(k, [...k].sort(), 'sorted')
  assert.equal(new Set(k).size, k.length, 'distinct')
  assert.equal(E.validateState(s) ?? 'OK', 'OK')
})

test('a stint config with meets finer than the sample is refused', () => {
  const g = genesis()
  g.stint = { cap: 60, sample: 10, remembers: 8, meets: 5 }
  assert.notEqual(E.validateState(E.newWorld(g)) ?? 'OK', 'OK')
})
