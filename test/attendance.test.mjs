// §7dw-iii: ATTENDANCE PAY REQUIRES SOMEBODY TO BE ATTENDING.
//
// A burning fire pays the citizen minding it, every interval, for standing
// there so the crowd never finds it cold. That is a good rule and it has
// leaked twice.
//
// The first leak was PLACE. It paid the owner wherever they were -- "anywhere
// in the world, asleep, in another country -- twelve thousand experience a
// cycle for having once lit something. It was ninety-four per cent of the
// skill and none of it was work." The fix required them to be beside it.
//
// The second leak was the PERSON, and it survived the first fix. A body stays
// standing where it stood: §7dw closes the window on a citizen without taking
// anything or moving them, and closing the client does not move them either.
// So the whole of the exploit was: feed the furnace, stand beside it, quit,
// and collect an experience an interval for the hour the fire holds. The
// ceiling charged nothing for it, because the ceiling counts inputs and there
// were none to count. Asked outright: "is there any action that gives xp that
// does not count as input that can be abused to bypass the allowance?"
//
// There were exactly two in the world, and they were the same rule twice: the
// furnace's and the watchfire's. These tests hold both shut.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import E from '../engine.js'

const RULES = 'b'.repeat(64)
const SAMPLE = 50

// A world small enough to walk through, with a promise clock to measure
// presence against and a ceiling to be bypassed, plus an alight fire beside
// the citizen and credited to them.
//
// ONE state, built once. The first version of this called the builder twice
// and seated the same citizen in two different worlds, which is a test that
// fails for its own reasons and says nothing about the rule.
function atAFire(type) {
  const g = E.makeGenesis('attend-test', RULES, 0, 40, 30)
  g.stint = { cap: 7200, sample: SAMPLE, remembers: 8, meets: SAMPLE * 3 }
  g.ceiling = { window: 2400, allow: 600, warn: 120, sample: 10 }
  const who = E.generateIdentity()
  const s = E.newWorld(g)
  E.addPlayer(s, who.playerId, 5, 5)
  const p = s.players[who.playerId]
  s.nodes = s.nodes ?? {}
  // Alight for a long while, and credited to this citizen: the furnace names
  // its last stoker, a watchfire names its owner.
  s.nodes.fire = { type, x: p.x + 1, y: p.y, fuelUntil: 3000 }
  if (type === 'furnace') { s.nodes.fire.stokedBy = who.playerId }
  else { s.nodes.fire.by = who.playerId }
  const sign = (f) => E.signInput(
    { worldId: E.worldId(g), playerId: who.playerId, ...f }, who.privateKey)
  return { g, s, who, sign }
}

const xpOf = (s, who, skill) => s.players[who.playerId].skills[skill] ?? 0

for (const [type, skill] of [['furnace', 'earthcraft'], ['watchfire', 'woodcraft']]) {
  test(`a ${type} pays the hand that is actually there`, () => {
    // The rule still has to WORK: a citizen who is acting beside their fire
    // earns for minding it, which is the whole point of the pay.
    let { s, who, sign } = atAFire(type)
    const before = xpOf(s, who, skill)
    for (let i = 0; i < 6; i++) {
      // a `sound` at nothing is refused and still stamps lastInput; a step is
      // simpler and certainly an input
      s = E.nextState(s, [sign({ tick: s.tick, type: 'move', dx: 0, dy: 1 })])
      s = E.nextState(s, [sign({ tick: s.tick, type: 'move', dx: 0, dy: -1 })])
    }
    assert.ok(xpOf(s, who, skill) > before,
      `minding a burning ${type} while present must still pay`)
  })

  test(`a ${type} pays nobody once they have stopped acting`, () => {
    // THE WHOLE OF THE BYPASS. No inputs at all: the body stands where it
    // stood, the fire burns on, and nothing may accrue to them.
    let { s, who } = atAFire(type)

    // Past the promise's sample, so the world can no longer tell them from
    // somebody who walked away.
    for (let i = 0; i < SAMPLE + 2; i++) s = E.nextState(s, [])
    const settled = xpOf(s, who, skill)

    // Now a long absence, far longer than the sample, with the fire alight the
    // whole time and not one experience of it.
    for (let i = 0; i < 150; i++) s = E.nextState(s, [])
    assert.equal(xpOf(s, who, skill), settled,
      `a ${type} must pay nothing to a citizen who has done nothing for `
      + 'longer than the sample: that is somebody who has gone to bed')
  })
}

test('the fire keeps burning for everybody else regardless', () => {
  // Not being paid is not the same as the fire going out. The island's
  // furnace must stay alight for whoever walks up to it next, which is the
  // reason a public fire exists.
  let { s } = atAFire('furnace')
  const until = s.nodes.fire.fuelUntil
  for (let i = 0; i < 150; i++) s = E.nextState(s, [])
  assert.equal(s.nodes.fire.fuelUntil, until,
    'an absent minder must not cost the fire its fuel')
  assert.ok(s.tick < until, 'and it should still be alight for this test to mean anything')
})
