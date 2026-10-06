// §6ab-ii: THE WEB KNITS FASTER WHILE NOBODY IS TANGLED IN IT.
//
// The great-spider is the second thing in this world that cannot be done
// alone, and it is the only one whose seat can be shot from ground it can
// never reach. `check-safespot.mjs` puts it at 100%: one spider, one seat, and
// a tile in bow range the beast can never answer from.
//
// WHAT THAT DID AND DID NOT BREAK. It did not break §6ab's hard promise. A
// lone archer's best sustained output is the dragonbow's 3.70 against a web of
// six, so one citizen on a safe rock shoots for ever and nothing happens. What
// it broke is the sentence beside it: "somebody must hold it, but the fight is
// a sum, not a gauntlet". Two or three bows at range made it a pure sum, and
// the holder -- the whole social shape of the fight -- stopped being needed.
//
// So the web answers, rather than the arrows being refused. Full rate while
// nobody stands in it, the old six the moment somebody does.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import E from '../engine.js'

const RULES = 'c'.repeat(64)

// A world with the spider in it, placed by hand rather than hunted for in a
// founding: this is about the rule, and seating it is `worldgen`'s business.
function withSpider(citizensAt = []) {
  const g = E.makeGenesis('web-test', RULES, 0)
  const s = E.newWorld(g)
  const mx = Math.floor(g.worldW / 2)
  const my = Math.floor(g.worldH / 2)
  s.mobs = s.mobs ?? {}
  s.mobs.sp = { type: 'great-spider', x: mx, y: my, health: 100,
                spawnX: mx, spawnY: my }
  const who = []
  for (const [dx, dy] of citizensAt) {
    const id = E.generateIdentity()
    E.addPlayer(s, id.playerId, mx + dx, my + dy)
    who.push(id)
  }
  return { g, s, who, mx, my }
}

const spiderAfterATick = (s) => E.nextState(s, []).mobs.sp.health

test('untouched, the web knits past what any bow can undo', () => {
  const { s } = withSpider()
  const before = s.mobs.sp.health
  const after = spiderAfterATick(s)
  const knit = after - before
  assert.ok(knit > 6,
    `with nobody in reach the web should knit faster than its held rate; it knit ${knit}`)
  // The number that matters is whether archery can out-shoot it. The engine's
  // own measured figures are chain 5.74, dragonbow 3.70, horn-bow 2.75: at
  // this rate a safe spot wants more dragonbows than the world contains.
  assert.ok(knit / 3.70 > 6,
    `${knit} a interval is only ${(knit / 3.70).toFixed(1)} dragonbows deep; `
    + 'the world has exactly one, so this must be far out of reach')
})

test('with somebody beside it, the web is the six it always was', () => {
  // §6ab's arithmetic is load-bearing: six against a best sustained melee of
  // 5.74 is what makes soloing impossible by a margin of 0.26. If holding it
  // changed that number in either direction, the promise would move with it.
  const { s } = withSpider([[1, 0]])
  const before = s.mobs.sp.health
  assert.equal(spiderAfterATick(s) - before, 6,
    'held, it must knit exactly six: the whole solo promise is that margin')
})

test('a fallen citizen is not holding anything', () => {
  // Otherwise a body left lying beside the spider would hold the web open for
  // archers indefinitely, which is a safe spot with an extra step.
  const { s, who } = withSpider([[1, 0]])
  s.players[who[0].playerId].health = 0
  const before = s.mobs.sp.health
  assert.ok(spiderAfterATick(s) - before > 6,
    'the dead do not tear a web')
})

test('an archer at bow range is not holding it either', () => {
  // THE FAULT THIS EXISTS TO CATCH. `inReach` is the CITIZEN's weapon reach
  // and the dragonbow reaches nine, so written with that helper an archer
  // safe-spotting would have counted as holding the thing they were avoiding
  // and the whole rule would have done nothing. It is the SPIDER's reach that
  // decides, which is the four tiles beside it.
  for (const d of [2, 3, 5, 9]) {
    const { s } = withSpider([[d, 0]])
    const before = s.mobs.sp.health
    assert.ok(spiderAfterATick(s) - before > 6,
      `a citizen ${d} tiles off is not in the web and must not hold it open`)
  }
})

test('it is the `mends` property that is gated, not the spider by name', () => {
  // The burn rule beside it makes the same point, and for the same reason: a
  // beast a later founding gives a web must be covered by the same sentence
  // without this engine having been told about it.
  //
  // Read from the source, because that is where the fault would be. A rule
  // that worked today by testing `m.type === 'great-spider'` would pass every
  // other test in this file and silently do nothing for the second webbed
  // beast anybody adds.
  const src = readFileSync(new URL('../engine.js', import.meta.url), 'utf8')
  const at = src.indexOf('§6ab-ii: AND IT KNITS FASTER')
  assert.ok(at > 0, 'the rule should be where its section number says it is')
  const block = src.slice(at, src.indexOf('\n    }', at))
  assert.equal(/great-spider/.test(block), false,
    'the web rule names the spider; it must read the `mends` property instead')
  assert.ok(/st\.mends/.test(block), 'and it must read that property')
})
