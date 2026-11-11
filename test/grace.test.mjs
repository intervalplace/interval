// §6bw-ii: A CITIZEN WHO WAS WHOLE WHEN THE INTERVAL BEGAN IS NOT DEAD WHEN
// IT ENDS.
//
// Written from the case that caused it: three horn-bow archers standing in
// the Wilds with their arms set, opening on one target together. A flurry is
// three blows of eight, flesh is a flat sixty-four, and all nine arrows land
// in the SAME interval. Before this rule the target went from whole to
// nothing inside one tick, having had no interval in which to eat, to cast
// the stilling, or to take a step, and §6bq repealed the one escape the world
// used to have.
//
// The rule is not a telegraph and these checks are not about visibility. A
// warning only helps somebody who has an interval to act in, and the whole of
// the fault was that they had none.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import E from '../engine.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const enginePath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)), '..', 'engine.js')

const world = () => {
  const g = E.makeGenesis('grace', 'a'.repeat(64), 0, 40, 30)
  const s = E.newWorld(g)
  s.tick = 100
  const k = E.generateIdentity()
  E.addPlayer(s, k.playerId, 10, 10)
  return { s, q: s.players[k.playerId], max: E.maxHealth(s.players[k.playerId]) }
}

test('three flurries in one interval leave a whole citizen standing', () => {
  const { s, q, max } = world()
  assert.equal(q.health, max, 'the victim starts whole')
  // a horn-bow flurry at full roll: three blows of eight
  let held = 0
  for (let i = 0; i < 3; i++) held += E.woundCitizen(s, q, 24) ? 1 : 0
  assert.ok(24 * 3 > max, 'the volley really would have killed them')
  assert.equal(q.health, 1, 'they are left with nothing to spare, not dead')
  assert.equal(held, 1, 'and the rule fires once, on the blow that would have done it')
})

test('and the next interval kills them, so it cannot chain', () => {
  const { s, q } = world()
  for (let i = 0; i < 3; i++) E.woundCitizen(s, q, 24)
  assert.equal(q.health, 1)
  s.tick += 1
  E.woundCitizen(s, q, 24)
  assert.ok(q.health <= 0, 'at one a citizen is far below half and is not held')
})

test('a citizen who began the interval below half is not held', () => {
  const { s, q, max } = world()
  q.health = Math.floor(max / 2)          // exactly half is not ABOVE half
  E.woundCitizen(s, q, 99)
  assert.ok(q.health <= 0, 'half is not above half')
  const b = world()
  b.q.health = Math.floor(b.max / 2) + 1  // a point above it is
  E.woundCitizen(b.s, b.q, 99)
  assert.equal(b.q.health, 1)
})

test('the health it asks about is the health at the top of the interval', () => {
  // THE FIRST DRAFT FAILED EXACTLY HERE. "A blow cannot take a citizen from
  // above half to nothing" sounds the same and is not: the first arrow takes
  // you to forty, the second to sixteen, and the third lands on somebody who
  // is below half. Every blow after the first is a blow against a wounded
  // citizen, so the question has to be asked of the interval.
  const { s, q, max } = world()
  E.woundCitizen(s, q, Math.floor(max * 0.75))   // one blow, now well below half
  assert.ok(q.health * 2 < max, 'they are below half when the next blow lands')
  const held = E.woundCitizen(s, q, 999)
  assert.ok(held, 'and they are still held, because they began the interval whole')
  assert.equal(q.health, 1)
})

test('it does not spend the great-plate on a death it would have held', () => {
  // §6bw gives the plate a save at ANY health, once, and shatters it. This
  // rule is strictly weaker -- it only holds somebody who began the interval
  // above half -- so the plate keeps its own job as the insurance for when
  // you are already hurt, and must not be consumed first.
  const { s, q } = world()
  q.equipment = { ...(q.equipment ?? {}), body: { item: 'great-plate', qty: 1 } }
  E.woundCitizen(s, q, 999)
  assert.equal(q.health, 1, 'the rule held them')
  assert.equal(q.equipment.body?.item, 'great-plate', 'and the plate is still on their back')
})

test('a team of menders cannot make anyone proof against a volley', () => {
  // THE HOLE THIS CLOSES, and it is not the obvious one. The worry was that
  // enough menders out-heal the damage. The arithmetic is worse than that:
  // WITHOUT a leash on the grace, putting somebody back above half costs the
  // same thirty-two whether one arrow is coming or forty, so the cost of
  // defending stops scaling with the attack and TWO menders hold a tank
  // against any number of archers for ever.
  const { s, q, max } = world()
  const volley = () => { for (let i = 0; i < 3; i++) E.woundCitizen(s, q, 24) }
  volley()
  assert.equal(q.health, 1, 'the first volley gives them their turn')
  // their menders put them back above half, which is all the old rule asked
  s.tick += 1
  q.health = Math.floor(max / 2) + 9
  volley()
  assert.ok(q.health <= 0,
    'and the next volley kills them: a cell that cannot be killed does not '
    + 'have to care who is being shot at')
})

test('the grace comes back, but not within the same engagement', () => {
  const { s, q, max } = world()
  E.woundCitizen(s, q, 999)
  assert.equal(q.health, 1, 'held')
  const EVERY = +/const GRACE_EVERY = (\d+)/.exec(
    fs.readFileSync(enginePath, 'utf8'))[1]
  // a long while later, whole again, it holds again
  s.tick += EVERY
  q.health = max
  assert.ok(E.woundCitizen(s, q, 999), 'held again once the flesh has settled')
  // but a moment before that, it does not
  const b = world()
  E.woundCitizen(b.s, b.q, 999)
  b.s.tick += EVERY - 1
  b.q.health = b.max
  assert.ok(!E.woundCitizen(b.s, b.q, 999), 'and not a moment before')
  assert.ok(b.q.health <= 0)
})

test('nobody can be healed back above half between volleys', () => {
  // the rule cannot be used to live for ever, and the arithmetic is the
  // reason rather than a special case
  const { max } = world()
  const MEND = +/MEND[_A-Z]*\s*=\s*(\d+)/.exec(
    String(E.MEND_HEAL ?? '20'))?.[1] || 20
  assert.ok(1 + MEND <= Math.floor(max / 2),
    'a mend from one must not reach half, or a pocket mender makes a tank unkillable')
})
