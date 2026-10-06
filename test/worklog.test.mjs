// §7cy: WHO HAS BEEN WORKING HERE, AND WHY THE FIRES WERE MISSING FROM IT.
//
// A work remembers its last five hands and forgets each after WORKED_FADE
// intervals. The engine's own note says what it is for: "a trace, then, and
// not a tracker... it says who works here; it does not say where they are.
// You still have to go to the furnace to learn who works the furnace."
//
// It was written at the three places something is MADE -- the anvil, the
// furnace and the sawpit -- and at none of the places something is KEPT. That
// is the wrong way round for coordination, which was the whole point of it:
// "I had a mechanism to show who the last few people who for example serviced
// a node, like stoke the furnace or a watchfire etc. To make it easier to see
// if someone is actively doing it etc for coordination."
//
// A smith who smelted an hour ago tells you nothing you need. Whoever has been
// feeding the fire tells you whether it will still be alight when you arrive,
// and whether to bring coal. `stokedBy` held the LAST hand only, and the next
// person to feed it overwrote them, so one name was all anybody could ever
// read and it was gone a minute later.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import E from '../engine.js'

const RULES = 'c'.repeat(64)

// A fire, a citizen beside it, and fuel in their pack. Placed by hand: this is
// about the rule, and seating a furnace is `worldgen`'s business.
function atAFire(type, fuel) {
  const g = E.makeGenesis('worklog-test', RULES, 0)
  const s = E.newWorld(g)
  const x = Math.floor(g.worldW / 2)
  const y = Math.floor(g.worldH / 2)
  s.nodes = s.nodes ?? {}
  // ALIGHT BUT NOT FULL. §7r caps a furnace at an hour of burn, so a fire
  // started at ten thousand intervals is over its own cap and feeding it
  // correctly pulls it DOWN to the cap -- which is the rule working and made
  // the first version of this test accuse it of losing fuel.
  s.nodes.fire = { type, x, y, fuelUntil: 200 }
  const who = E.generateIdentity()
  E.addPlayer(s, who.playerId, x + 1, y)
  s.players[who.playerId].inventory[0] = { item: fuel, qty: 5 }
  const feed = () => E.signInput({
    worldId: E.worldId(g), playerId: who.playerId,
    tick: s.tick, type: 'stoke', nodeId: 'fire', slot: 0,
  }, who.privateKey)
  return { g, s, who, feed }
}

test('feeding a furnace writes the hand that fed it', () => {
  const { s, who, feed } = atAFire('furnace', 'coal')
  assert.equal(s.nodes.fire.worked, undefined, 'nothing should be logged yet')
  // READ AS A NUMBER, NOT THROUGH THE OLD STATE. `nextState` may hand back a
  // state that shares this node, in which case comparing the two afterwards
  // compares the new value with itself and reports no change.
  const burnWas = s.nodes.fire.fuelUntil
  const after = E.nextState(s, [feed()])
  const log = after.nodes.fire.worked
  assert.ok(Array.isArray(log) && log.length === 1,
    'stoking a furnace should write exactly one hand; got ' + JSON.stringify(log))
  assert.equal(log[0].who, who.playerId)
  // AND THE FUEL ACTUALLY WENT IN, so this is not passing on a refused deed
  // that happened to leave a log behind.
  assert.ok(after.nodes.fire.fuelUntil > burnWas,
    `the fire should be burning longer than before; was ${burnWas}, `
    + `now ${after.nodes.fire.fuelUntil}`)
})

test('feeding a watchfire writes the hand too', () => {
  // The watchfire is the one public work in the world, so this is the case
  // where knowing who is tending it matters most.
  const { s, who, feed } = atAFire('watchfire', 'logs')
  const after = E.nextState(s, [feed()])
  const log = after.nodes.fire.worked
  assert.ok(Array.isArray(log) && log.length === 1,
    'stoking a watchfire should write a hand; got ' + JSON.stringify(log))
  assert.equal(log[0].who, who.playerId)
})

test('the log keeps the last few hands, newest first, and no duplicates', () => {
  // §7cy keeps WORKED_KEEP and drops a citizen's older entry when they work
  // again, so a fire fed by one person all morning does not fill with them.
  const g = E.makeGenesis('worklog-many', RULES, 0)
  const s = E.newWorld(g)
  const x = Math.floor(g.worldW / 2)
  const y = Math.floor(g.worldH / 2)
  s.nodes = { fire: { type: 'furnace', x, y, fuelUntil: 200 } }
  // Four citizens round the fire; a furnace is reached from any side.
  const folk = []
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const who = E.generateIdentity()
    E.addPlayer(s, who.playerId, x + dx, y + dy)
    s.players[who.playerId].inventory[0] = { item: 'coal', qty: 5 }
    folk.push(who)
  }
  let now = s
  for (const who of folk) {
    now = E.nextState(now, [E.signInput({
      worldId: E.worldId(g), playerId: who.playerId,
      tick: now.tick, type: 'stoke', nodeId: 'fire', slot: 0,
    }, who.privateKey)])
  }
  const log = now.nodes.fire.worked
  assert.equal(log.length, 4, 'four different hands, four entries')
  // NEWEST FIRST, because the window reads it in order and "who is on this
  // now" is the question being asked.
  assert.equal(log[0].who, folk[3].playerId)
  assert.equal(log[3].who, folk[0].playerId)

  // And the first of them feeding it again moves them to the front rather
  // than appearing twice.
  const again = E.nextState(now, [E.signInput({
    worldId: E.worldId(g), playerId: folk[0].playerId,
    tick: now.tick, type: 'stoke', nodeId: 'fire', slot: 0,
  }, folk[0].privateKey)])
  const second = again.nodes.fire.worked
  assert.equal(second.length, 4, 'still four: nobody is listed twice')
  assert.equal(second[0].who, folk[0].playerId, 'and they are now the newest')
})

test('a work log never grows past what the rules keep', () => {
  // The validator refuses a longer one, so an executor that forgot to trim
  // would halt the world rather than quietly grow it. Worth pinning.
  assert.ok(E.WORKED_KEEP === undefined || E.WORKED_KEEP > 0)
  const g = E.makeGenesis('worklog-cap', RULES, 0)
  const s = E.newWorld(g)
  s.nodes = { fire: { type: 'furnace', x: 4, y: 4, worked: [] } }
  for (let i = 0; i < 64; i++) {
    s.nodes.fire.worked.push({ who: 'a'.repeat(64), at: i })
  }
  assert.ok(E.validateState(s) !== null,
    'a work log longer than the rules keep must be refused')
})
