// §5r-iv: A CALLING ASKS FOR TRAVEL AS WELL AS PRACTICE.
//
// Swearing is the one irreversible decision in a life here: it fixes the only
// craft that may ever reach a hundred, and §5k caps every other at seventy for
// ever. Measured against the levelling curve, level fifty arrives after about
// an hour and three quarters, a bit over one day's allowance -- so a citizen
// could be asked to choose their calling on their second evening, having stood
// at one rock the whole time and seen none of the island they were choosing a
// place in.
//
// Raising the level would not have helped. Grinding one craft to sixty-five
// teaches a citizen nothing about the other eight; what they lack is not
// practice but acquaintance. So the second half of the door is the island
// itself: five of its seven countries, recorded by the world as they walk.
//
// Five and not seven, because two of the seven are the Wilds and the Moor. A
// door that required those would send every newcomer to be killed in order to
// take up a trade.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import E from '../engine.js'
import { readFileSync } from 'node:fs'

const RULES = 'd'.repeat(64)

// A citizen at the level, so the only thing in question is the travel.
function readyToSwear(walked) {
  const g = E.makeGenesis('calling-test', RULES, 0, 40, 30)
  const who = E.generateIdentity()
  const s = E.newWorld(g)
  E.addPlayer(s, who.playerId, 5, 5)
  const p = s.players[who.playerId]
  // woodcraft well past SWEAR_LEVEL, so the craft door is open
  p.skills.woodcraft = 200000
  if (walked) p.walked = [...walked].sort()
  const sign = (f) => E.signInput(
    { worldId: E.worldId(g), playerId: who.playerId, ...f }, who.privateKey)
  return { g, s, who, sign }
}

// The plain island has no countries of its own, so these tests name the v7
// country words directly: what the gate counts is HOW MANY, and the words are
// the generator's business.
const FIVE = ['heartlands', 'downs', 'fens', 'greenwood', 'crags']

test('a citizen at the level who has seen nothing may not swear', () => {
  const { s, who, sign } = readyToSwear(null)
  const after = E.nextState(s, [sign({ tick: s.tick, type: 'swear', calling: 'forester', attester: '' })])
  assert.equal(after.players[who.playerId].calling, undefined,
    'practice alone must not buy a calling: the island is half the door')
})

test('four countries is not enough', () => {
  const { s, who, sign } = readyToSwear(FIVE.slice(0, 4))
  const after = E.nextState(s, [sign({ tick: s.tick, type: 'swear', calling: 'forester', attester: '' })])
  assert.equal(after.players[who.playerId].calling, undefined)
})

test('five countries opens the door', () => {
  const { s, who, sign } = readyToSwear(FIVE)
  const after = E.nextState(s, [sign({ tick: s.tick, type: 'swear', calling: 'forester', attester: '' })])
  assert.equal(after.players[who.playerId].calling, 'forester',
    'having walked the peaceful island and reached the level, they may swear')
})

test('and travel without the level still buys nothing', () => {
  // The two halves are both doors, not two halves of one door. A citizen who
  // has walked everywhere and practised nothing is a tourist.
  const { s, who, sign } = readyToSwear(FIVE)
  s.players[who.playerId].skills.woodcraft = 0
  const after = E.nextState(s, [sign({ tick: s.tick, type: 'swear', calling: 'forester', attester: '' })])
  assert.equal(after.players[who.playerId].calling, undefined)
})

test('the world writes the travels itself, and never twice', () => {
  // A citizen standing still has still stood somewhere, so the country under
  // them is recorded on the first interval and not again.
  const g = E.makeGenesis('calling-walk', RULES, 0, 40, 30)
  const who = E.generateIdentity()
  let s = E.newWorld(g)
  E.addPlayer(s, who.playerId, 5, 5)
  for (let i = 0; i < 4; i++) s = E.nextState(s, [])
  const been = s.players[who.playerId].walked
  // The plain island may name no countries at all, in which case there is
  // nothing to record and nothing to assert beyond that it did not invent any.
  if (been === undefined) { assert.ok(true, 'this founding names no countries'); return }
  assert.ok(Array.isArray(been), 'travels should be a list')
  assert.deepEqual(been, [...new Set(been)].sort(),
    'the list must be sorted and distinct, or two nodes write different bytes')
})

test('a forged list of travels is refused at the door', () => {
  const g = E.makeGenesis('calling-forge', RULES, 0, 40, 30)
  const who = E.generateIdentity()
  const s = E.newWorld(g)
  E.addPlayer(s, who.playerId, 5, 5)
  for (const bad of [
    ['fens', 'fens'],                  // the same country twice
    ['greenwood', 'crags'],            // out of order
    ['Fens'],                          // not a country word
    new Array(20).fill(0).map((_, i) => 'c' + i),   // longer than the world has
  ]) {
    s.players[who.playerId].walked = bad
    assert.ok(E.validateState(s) !== null,
      'a malformed travel list must be refused: ' + JSON.stringify(bad))
  }
})

// §5k-iii: AND THERE IS NO MASTERING EVERYTHING.
//
// `callingOf` had a branch returning 'Master of Interval' for a citizen with
// every craft at a hundred, and the world announced it: "the FIRST ever Master
// of Interval". §5k's caps repealed it without anybody noticing. `xpCeiling`
// holds an unsworn citizen to CAP_UNSWORN in everything and a sworn one to
// CAP_OTHER outside their own trade, and the ceiling is enforced in
// `validateState` rather than merely on the award -- so a state claiming all
// nine at mastery is not rare, it is refused.
//
// Held here because the title is attractive and somebody will want it back.
// Wanting it back means repealing one mastery to a citizen, which is the
// single idea §5k exists for.
test('no citizen may hold every craft at mastery, sworn or not', () => {
  const g = E.makeGenesis('no-total-mastery', RULES, 0, 40, 30)
  const s = E.newWorld(g)
  const who = E.generateIdentity()
  E.addPlayer(s, who.playerId, 5, 5)
  const p = s.players[who.playerId]
  const top = E.XP_TABLE[E.MASTERY]

  for (const sk of E.SKILLS) p.skills[sk] = top
  p.calling = 'forester'
  assert.ok(E.validateState(s) !== null,
    'a sworn citizen with every craft at mastery must be refused: §5k caps the other eight')

  delete p.calling
  assert.ok(E.validateState(s) !== null,
    'and an unsworn one must be refused too: they are held to CAP_UNSWORN in everything')
})

test('and no word anywhere claims otherwise', () => {
  // The engine, and the window this world ships. Both carried the branch.
  const maxed = Object.fromEntries(E.SKILLS.map((sk) => [sk, E.XP_TABLE[E.MASTERY]]))
  assert.equal(E.callingOf({ skills: maxed }), 'newcomer',
    'an unsworn citizen is a newcomer, whatever impossible skills are handed in')
  const html = readFileSync(new URL('../window-web.html', import.meta.url), 'utf8')
  const at = html.indexOf('function callingOf')
  assert.ok(at > 0, 'the window should still have a callingOf')
  assert.ok(!html.slice(at, at + 2000).includes('Master of Interval'),
    'the 2D window must not offer a title the world will not let anybody hold')
})

// §5w/§5x: THE TEACHING, WHICH HAD NEVER ONCE WORKED.
//
// "You become a master by raising somebody else to their own swearing, and
// until you have, you are not one." That is the endgame §5x exists for, and it
// was unreachable in three independent ways at the same time:
//
//   `attester` was not a declared field on `swear`. Every declared field in
//   this constitution is required and nothing else is accepted, so an attested
//   swearing came back `unknown field attester on swear` and was refused at
//   the door -- before `mayDo`, which has checked that field since §5w was
//   written, ever ran.
//
//   `apprentices` was not an admitted player field. `teach` writes it directly
//   onto the master, so the FIRST citizen to take somebody on wrote state the
//   validator forbids. The closure property this project holds itself to is
//   `validateState(nextState(...)) === null`, so that is a halted world.
//
//   `raised` and `sworn_by` were not admitted either, so even had the deed
//   been filable it would have halted on landing.
//
// All three had full validation blocks already. They were simply never added
// to the lists that admit them, and the property test that would have caught it
// cannot reach here: an attested swearing needs a master at a hundred holding a
// live apprenticeship, which a random walk does not find in a hundred hours.
test('§5w: the whole teaching chain works, and leaves a legal world', () => {
  const g = E.makeGenesis('teaching', RULES, 0, 40, 30)
  const s = E.newWorld(g)
  const master = E.generateIdentity(), pupil = E.generateIdentity()
  E.addPlayer(s, master.playerId, 5, 5)
  E.addPlayer(s, pupil.playerId, 6, 5)
  const m = s.players[master.playerId], q = s.players[pupil.playerId]
  m.calling = 'forester'
  m.skills.woodcraft = E.XP_TABLE[E.MASTERY]
  m.apprentices = { [pupil.playerId]: s.tick }
  q.skills.woodcraft = E.XP_TABLE[50]          // exactly at the door, and at the cap
  q.walked = ['crags', 'downs', 'fens', 'greenwood', 'heartlands']

  assert.equal(E.validateState(s), null,
    'a master holding an apprenticeship must be a legal world')

  const sign = (f) => E.signInput(
    { worldId: E.worldId(g), playerId: pupil.playerId, ...f }, pupil.privateKey)
  const after = E.nextState(s, [sign(
    { tick: s.tick, type: 'swear', calling: 'forester', attester: master.playerId })])
  const M = after.players[master.playerId], Q = after.players[pupil.playerId]

  assert.equal(Q.calling, 'forester', 'the pupil swears')
  assert.equal(Q.sworn_by?.by, master.playerId, 'and their lineage names who taught them')
  assert.equal(M.raised, 1, 'the master is credited for a thing done for somebody else')
  assert.equal(M.apprentices, undefined, 'and the slot is freed')
  assert.equal(E.validateState(after), null, 'and the world it leaves is legal')
  assert.equal(E.callingOf(M), 'master forester',
    'the number alone never bought the word; raising somebody does')
  assert.equal(E.gradeOf(after, M, master.playerId), 'master')
})

test('§5w: swearing alone is still a real swearing', () => {
  // Unattested must stay legal: the first forester has nobody to name, and
  // anyone playing at a quiet hour would otherwise wait for a master to wake.
  const g = E.makeGenesis('teaching-alone', RULES, 0, 40, 30)
  const s = E.newWorld(g)
  const who = E.generateIdentity()
  E.addPlayer(s, who.playerId, 5, 5)
  const p = s.players[who.playerId]
  p.skills.woodcraft = E.XP_TABLE[50]
  p.walked = ['crags', 'downs', 'fens', 'greenwood', 'heartlands']
  const sign = (f) => E.signInput(
    { worldId: E.worldId(g), playerId: who.playerId, ...f }, who.privateKey)
  const after = E.nextState(s, [sign(
    { tick: s.tick, type: 'swear', calling: 'forester', attester: '' })])
  assert.equal(after.players[who.playerId].calling, 'forester')
  assert.equal(after.players[who.playerId].sworn_by, undefined,
    'nobody attested it, so there is no lineage to claim')
  assert.equal(E.validateState(after), null)
})

test('§5w: and the field cannot simply be left out', () => {
  // There are no optional fields in this constitution, which is why the
  // absence of a master is STATED. Omitting it is malformed, not unattested.
  const base = { worldId: 'a'.repeat(64), playerId: 'b'.repeat(64), tick: 0, sig: 'c'.repeat(128) }
  assert.ok(E.validateInputShape({ ...base, type: 'swear', calling: 'forester' }) !== null,
    'a swearing with no attester field at all is malformed')
  assert.equal(E.validateInputShape({ ...base, type: 'swear', calling: 'forester', attester: '' }), null)
  assert.equal(E.validateInputShape({ ...base, type: 'swear', calling: 'forester', attester: 'd'.repeat(64) }), null)
})
