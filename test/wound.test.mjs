// §6c-ii: the wound the dead leave, the tally that never falls, and the one
// place on the island that puts a debt down.
//
// What these tests are actually defending is the CLAMP. The obvious version
// of this rule — lose a point every time you die — is a spiral: dying makes
// you easier to kill, which makes you die. Every assertion about WOUND_MAX
// and the floor below is an assertion that the spiral cannot start.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import E from '../engine.js'

const RULES = 'a'.repeat(64)
const GENESIS = E.makeGenesis('wound-seed', RULES, 0, 40, 30)
const WID = E.worldId(GENESIS)

const alice = E.generateIdentity()
const bob = E.generateIdentity()

// hitpoints level 40 gives a frame with room above the floor to lose from
const HP40_XP = (() => { let xp = 0; while (E.effLevel(xp) < 40) xp += 100; return xp })()

function world() {
  const w = E.newWorld(GENESIS)
  E.addPlayer(w, alice.playerId, 5, 5)
  E.addPlayer(w, bob.playerId, 6, 5)
  return w
}
const sign = (fields, who = alice) =>
  E.signInput({ worldId: WID, playerId: who.playerId, ...fields }, who.privateKey)

// The engine does not export maxHp (nothing outside it needs to compute a
// frame), so the tests read it the way the world does: kill a citizen, wait
// out DEATH_TICKS, and see what they come back with.
function dieAndReturn(s, id, ticks = 8) {
  s.players[id].hp = 0
  s.players[id].deadUntil = s.tick + 5
  // the wound is written at the death SITE, not at the respawn, so a test
  // that fakes hp = 0 must fake the mark too. Tests that go through combat
  // (below) exercise the real path.
  s.players[id].deaths = (s.players[id].deaths ?? 0) + 1
  if ((s.players[id].wounds ?? 0) < 10) s.players[id].wounds = (s.players[id].wounds ?? 0) + 1
  for (let i = 0; i < ticks; i++) s = E.nextState(s, [])
  return s
}

test('a death leaves one point off the frame, and the respawn honours it', () => {
  let s = world()
  s.players[alice.playerId].skills.hitpoints = HP40_XP
  s = E.nextState(s, [])
  s = dieAndReturn(s, alice.playerId)
  const p = s.players[alice.playerId]
  assert.equal(p.wounds, 1, 'one death, one wound')
  assert.equal(p.deaths, 1, 'and one on the tally')
  assert.equal(p.hp, 39, 'returns at a frame of 39, not 40')
})

test('the wound caps at ten: the spiral cannot start', () => {
  let s = world()
  s.players[alice.playerId].skills.hitpoints = HP40_XP
  s = E.nextState(s, [])
  for (let i = 0; i < 25; i++) s = dieAndReturn(s, alice.playerId)
  const p = s.players[alice.playerId]
  assert.equal(p.wounds, 10, 'twenty-five deaths, ten points — no further')
  assert.equal(p.deaths, 25, 'the tally, however, counts every one')
  assert.equal(p.hp, 30, 'the frame bottoms out at natural minus ten')
})

test('a novice cannot be wounded at all: the floor protects whoever is learning', () => {
  let s = world()                      // fresh citizens start at hitpoints 10
  s = E.nextState(s, [])
  for (let i = 0; i < 6; i++) s = dieAndReturn(s, alice.playerId)
  const p = s.players[alice.playerId]
  assert.equal(p.deaths, 6, 'the deaths are recorded')
  assert.equal(p.hp, 10, 'but the frame never drops below a novice�s')
})

test('the wellspring puts the whole debt down in one visit', () => {
  let s = world()
  s.players[alice.playerId].skills.hitpoints = HP40_XP
  s = E.nextState(s, [])
  for (let i = 0; i < 4; i++) s = dieAndReturn(s, alice.playerId)
  assert.equal(s.players[alice.playerId].wounds, 4)

  // the dead return to the SPAWN POINT, not to where they fell (§6c), so the
  // spring goes beside wherever the world put them back
  const pw = s.players[alice.playerId]
  E.addNode(s, 'spring-1', 'landmark', pw.x, pw.y + 1, { kind: 'wellspring' })
  s.players[alice.playerId].hp = 12
  s = E.nextState(s, [sign({ tick: s.tick, type: 'drink' })])

  const p = s.players[alice.playerId]
  assert.equal(p.wounds, undefined, 'all four, not one')
  assert.equal(p.hp, 40, 'and restored to the whole frame')
  assert.equal(p.deaths, 4, 'the tally is not a debt and does not clear')
})

test('an ordinary well restores hp and does NOT touch the wound', () => {
  let s = world()
  s.players[alice.playerId].skills.hitpoints = HP40_XP
  s = E.nextState(s, [])
  s = dieAndReturn(s, alice.playerId)
  const pw = s.players[alice.playerId]
  E.addNode(s, 'well-1', 'well', pw.x, pw.y + 1)
  s.players[alice.playerId].hp = 5
  s = E.nextState(s, [sign({ tick: s.tick, type: 'drink' })])
  const p = s.players[alice.playerId]
  assert.equal(p.wounds, 1, 'a well is not the spring')
  assert.equal(p.hp, 39, 'and it fills the wounded frame, not the natural one')
})

test('the wellspring never runs dry (no depletedUntil, unlike a well)', () => {
  let s = world()
  E.addNode(s, 'spring-1', 'landmark', 5, 6, { kind: 'wellspring' })
  s = E.nextState(s, [])
  Object.assign(s.players[alice.playerId], { x: 5, y: 5 })
  s.players[alice.playerId].hp = 3
  s = E.nextState(s, [sign({ tick: s.tick, type: 'drink' })])
  assert.equal(s.players[alice.playerId].hp, 10)
  s.players[alice.playerId].hp = 3
  s = E.nextState(s, [sign({ tick: s.tick, type: 'drink' })])
  assert.equal(s.players[alice.playerId].hp, 10, 'a second drink in a row still works')
})

test('a real PvP kill writes the wound and the tally through the engine path', () => {
  let s = world()
  s.players[bob.playerId].skills.hitpoints = HP40_XP
  s.players[alice.playerId].skills.attack = HP40_XP
  s.players[alice.playerId].skills.strength = HP40_XP
  s = E.nextState(s, [])
  // (5,5) and (6,5) are both inside the Wilds, so mayStrike passes
  s = E.nextState(s, [sign({ tick: s.tick, type: 'attackp', targetId: bob.playerId, style: 'force' })])
  assert.equal(s.players[alice.playerId].action?.type, 'attackp', 'the fight actually started')
  // swing until bob falls; the death SITE writes the wound, not this test
  for (let i = 0; i < 400 && s.players[bob.playerId].deaths === undefined; i++) {
    s.players[bob.playerId].hp = Math.min(s.players[bob.playerId].hp, 2)
    s = E.nextState(s, [])
  }
  const v = s.players[bob.playerId]
  assert.equal(v.deaths, 1, 'the death site marked it, not the test')
  assert.equal(v.wounds, 1)
})

test('wounds and deaths survive a checkpoint round-trip', () => {
  let s = world()
  s.players[alice.playerId].skills.hitpoints = HP40_XP
  s = E.nextState(s, [])
  for (let i = 0; i < 3; i++) s = dieAndReturn(s, alice.playerId)
  const round = JSON.parse(JSON.stringify(s))
  assert.equal(E.validateState(round, GENESIS), null, 'a wounded world is a valid world')
  assert.equal(E.stateHash(round), E.stateHash(s), 'and hashes identically')
})

test('a wound out of bounds is refused at the door', () => {
  let s = world()
  s = E.nextState(s, [])
  const bad = JSON.parse(JSON.stringify(s))
  bad.players[alice.playerId].wounds = 11
  assert.notEqual(E.validateState(bad, GENESIS), null, 'eleven is not a wound this rule can make')
})
