// Interval regression tests: fix brief Milestones 1 & 2.
// Run with: node --test test/
import { test } from 'node:test'
import assert from 'node:assert/strict'
import E from '../engine.js'





const RULES = 'a'.repeat(64)
const GENESIS = E.makeGenesis('test-seed', RULES, 0, 40, 30) // big enough to hold the Wilds
const WID = E.worldId(GENESIS)

const alice = E.generateIdentity()
const bob = E.generateIdentity()

function world() {
  const w = E.newWorld(GENESIS)
  E.addPlayer(w, alice.playerId, 5, 5)
  E.addPlayer(w, bob.playerId, 6, 5)
  E.addNode(w, 'vault-1', 'vault', 5, 6)   // adjacent to alice
  return w
}
// pre-freeze §5: A CLIENT BUILDS WHAT IT SIGNS THROUGH THE NORMALIZER.
// These helpers hand-rolled the signed object, so canonical fills never ran --
// an omitted `style` stayed omitted, `validInput` refused the input, and the
// citizen's whole interval went on silence. Every combat assertion below was
// therefore asserting about a refusal, which is how two total-failure bugs
// (every special dealing zero, drawn bows crashing the tick) sat undetected.
const sign = ({ tick, ...action }, who = alice) =>
  E.signInput({ worldId: WID, tick, playerId: who.playerId, ...E.normalizeInput(action) }, who.privateKey)
const step = (s, inputs) => E.nextState(s, inputs)

// ---------- 7.1: self-targeting PvP ----------
test('attackp targeting the sender\'s own id is always invalid', () => {
  const s = world() // (5,5) and (6,5) are inside the Wilds (x 1-34, y 1-22)
  const selfAtk = sign({ tick: 0, type: 'attackp', targetId: alice.playerId })
  const s2 = step(s, [selfAtk])
  assert.equal(s2.players[alice.playerId].action, null, 'self-attack must not start an action')
  // sanity: attacking ANOTHER player in the Wilds still works
  const atk = sign({ tick: 1, type: 'attackp', targetId: bob.playerId })
  const s3 = step(s2, [atk])
  assert.equal(s3.players[alice.playerId].action?.type, 'attackp')
})

// ---------- 7.2: dropping a stack preserves quantity ----------
test('dropping 17 arrows grounds qty 17; picking them up restores 17', () => {
  let s = world()
  s.players[alice.playerId].inventory[0] = { item: 'arrows', qty: 17 }
  s = step(s, [sign({ tick: 0, type: 'drop', slot: 0 })])
  const gids = Object.keys(s.ground)
  assert.equal(gids.length, 1)
  assert.equal(s.ground[gids[0]].qty, 17, 'ground record must carry the stack quantity')
  s = step(s, [sign({ tick: 1, type: 'pickup', groundId: gids[0], confirm: false })])
  assert.equal(E.countItem(s.players[alice.playerId].inventory, 'arrows'), 17)
  assert.equal(Object.keys(s.ground).length, 0)
})

// ---------- 7.3: deposit takes exactly one unit ----------
// §7.3a: THE WHOLE SLOT. This asserted the old one-unit-an-interval rate --
// a stack of seventeen arrows was seventeen intervals at the counter -- which
// the constitution replaced with banking the slot entire.
test('depositing a 17-stack banks all seventeen and clears the slot', () => {
  let s = world()
  s.players[alice.playerId].inventory[0] = { item: 'arrows', qty: 17 }
  s = step(s, [sign({ tick: 0, type: 'deposit', slot: 0 })])
  const p = s.players[alice.playerId]
  assert.equal(p.vaults['vault-1'].arrows, 17)
  assert.equal(p.inventory[0], null)
  // and a single item clears the slot
  s.players[alice.playerId].inventory[1] = { item: 'logs', qty: 1 }
  s = step(s, [sign({ tick: 1, type: 'deposit', slot: 1 })])
  assert.equal(s.players[alice.playerId].vaults['vault-1'].logs, 1)
  assert.equal(s.players[alice.playerId].inventory[1], null)
})

// ---------- 7.4: full inventory still merges arrows ----------
test('full inventory: arrow pickup merges into the quiver; non-stackable is refused', () => {
  let s = world()
  const p = s.players[alice.playerId]
  for (let i = 0; i < p.inventory.length; i++) p.inventory[i] = { item: 'logs', qty: 1 }
  p.inventory[3] = { item: 'arrows', qty: 5 }
  s.ground['ga'] = { item: 'arrows', qty: 7, x: 5, y: 5, expiresAt: 100 }
  s.ground['gb'] = { item: 'bones', qty: 1, x: 5, y: 5, expiresAt: 100 }
  s = step(s, [sign({ tick: 0, type: 'pickup', groundId: 'ga', confirm: false })])
  assert.equal(E.countItem(s.players[alice.playerId].inventory, 'arrows'), 12, 'arrows pool into the quiver')
  assert.equal('ga' in s.ground, false)
  s = step(s, [sign({ tick: 1, type: 'pickup', groundId: 'gb', confirm: false })])
  assert.equal('gb' in s.ground, true, 'non-stackable pickup with a full pack is refused')
})

// ---------- 7.5: shared inventory helpers ----------
test('inventory helpers: add / remove / count / canAdd behave and never go negative', () => {
  const inv = Array(4).fill(null)
  assert.equal(E.addItem(inv, 'arrows', 5), true)
  assert.equal(E.addItem(inv, 'arrows', 3), true)
  assert.equal(E.countItem(inv, 'arrows'), 8)
  assert.equal(inv.filter(Boolean).length, 1, 'stackables merge into one slot')
  assert.equal(E.removeItem(inv, 0, 3), true)
  assert.equal(E.countItem(inv, 'arrows'), 5)
  assert.equal(E.removeItem(inv, 0, 99), false, 'cannot remove more than the slot holds')
  assert.equal(E.countItem(inv, 'arrows'), 5)
  assert.equal(E.removeItem(inv, 0, 5), true)
  assert.equal(inv[0], null, 'emptied slot clears')
  inv.fill({ item: 'logs', qty: 1 })
  assert.equal(E.canAddItem(inv, 'ore'), false)
  inv[0] = { item: 'arrows', qty: 1 }
  assert.equal(E.canAddItem(inv, 'arrows'), true, 'a full pack still has room in the quiver')
})

// ---------- §2: world identity ----------
test('an input signed for World A is rejected by World B', () => {
  const genesisB = E.makeGenesis('other-seed', RULES, 0, 40, 30)
  const wB = E.newWorld(genesisB)
  E.addPlayer(wB, alice.playerId, 5, 5)
  const forA = sign({ tick: 0, type: 'move', dx: 1, dy: 0 }) // worldId = WID (world A)
  const s2 = E.nextState(wB, [forA])
  assert.equal(s2.players[alice.playerId].x, 5, 'cross-world input must not move the player')
  // and an input missing worldId entirely is also dead
  const bare = E.signInput({ tick: 0, playerId: alice.playerId, type: 'move', dx: 1, dy: 0 }, alice.privateKey)
  const s3 = E.nextState(E.newWorld(GENESIS), [bare])
  assert.equal(Object.keys(s3.players).length, 0)
})

test('worldId commits to every founding field, never truncated', () => {
  const a = E.worldId(E.makeGenesis('s', RULES, 0, 40, 30))
  assert.equal(a.length, 64)
  assert.notEqual(a, E.worldId(E.makeGenesis('s', RULES, 1, 40, 30)), 'anchor changes the world')
  assert.notEqual(a, E.worldId(E.makeGenesis('s', RULES, 0, 41, 30)), 'dimensions change the world')
  assert.notEqual(a, E.worldId(E.makeGenesis('s2', RULES, 0, 40, 30)), 'seed changes the world')
})

// ---------- §2.3: signature domains ----------
test('a chat-domain signature can never pass as a game input', () => {
  const msg = { worldId: WID, tick: 0, playerId: alice.playerId, type: 'move', dx: 1, dy: 0 }
  const asChat = E.signInput(msg, alice.privateKey, E.SIG_DOMAINS.chat)
  assert.equal(E.verifyInputSig(asChat, E.SIG_DOMAINS.chat), true)
  assert.equal(E.verifyInputSig(asChat), false, 'input-domain verification must reject it')
  const s2 = step(world(), [asChat])
  assert.equal(s2.players[alice.playerId].x, 5)
})

// ---------- determinism still holds after the fixes ----------
test('two replays of the same signed log agree on every state hash', () => {
  const build = () => {
    const w = world()
    E.addNode(w, 'tree-1', 'tree', 4, 5)
    return w
  }
  const log = []
  let s = build()
  for (let t = 0; t < 25; t++) {
    const inputs = s.players[alice.playerId].action ? [] :
      [sign({ tick: s.tick, type: 'gather', nodeId: 'tree-1' })]
    log.push(inputs)
    s = step(s, inputs)
  }
  const replay = () => {
    let st = build(); const hs = []
    for (const inputs of log) { st = step(st, inputs); hs.push(E.stateHash(st)) }
    return hs
  }
  assert.deepEqual(replay(), replay())
})

// ---------- §5c-ii: THE TABLE ----------
//
// What this replaces was a one-sided posted offer: one citizen named what they
// gave and the single thing they wanted, and the other took it or did not. The
// citizen being offered to could not put anything up, could not ask for
// something else, could not see what they were getting laid out, and could not
// be given anything, because the demand field had to name an item or positive
// coin.
//
// A table is two sides. Each citizen holds their own, each names the other, and
// nothing moves until both have said yes to it as it stands.
function table() {
  const s = world()
  const a = s.players[alice.playerId], b = s.players[bob.playerId]
  a.inventory[0] = { item: 'logs', qty: 1 }
  a.inventory[1] = { item: 'iron-hatchet', qty: 1 }
  a.gold = 50
  b.inventory[0] = { item: 'iron-ore', qty: 1 }
  b.inventory[1] = { item: 'arrows', qty: 30 }
  b.gold = 300
  return s
}
const sit = (who, withWhom, slots, gold, tick) =>
  sign({ tick, type: 'trade', with: withWhom, slots, gold }, who)

test('a table is open only when both citizens are sitting at it', () => {
  let s = table()
  s = step(s, [sit(alice, bob.playerId, [0], 0, 0)])
  const t = s.players[alice.playerId].trade
  assert.equal(t.with, bob.playerId)
  assert.deepEqual(t.items, [{ item: 'logs', qty: 1 }], 'a side names what it puts up')
  assert.equal(t.settled, false)
  assert.equal(s.players[bob.playerId].trade, null, 'nobody is seated on their behalf')
  // and settling against a table nobody else is at moves nothing
  s = step(s, [sign({ tick: 1, type: 'settle' }, bob)])
  assert.equal(s.players[bob.playerId].trade, null)
  assert.equal(s.players[alice.playerId].trade.settled, false)
})

test('both sides settled is the exchange, whole, in one tick', () => {
  let s = table()
  s = step(s, [sit(alice, bob.playerId, [0, 1], 0, 0)])
  s = step(s, [sit(bob, alice.playerId, [0, 1], 120, 1)])
  s = step(s, [sign({ tick: 2, type: 'settle' }, alice)])
  assert.equal(s.players[alice.playerId].trade.settled, true, 'said once')
  assert.ok(s.players[alice.playerId].inventory[0], 'and nothing has moved yet')
  s = step(s, [sign({ tick: 3, type: 'settle' }, bob)])
  const a = s.players[alice.playerId], b = s.players[bob.playerId]
  assert.equal(a.trade, null, 'the table clears on both sides')
  assert.equal(b.trade, null)
  const held = (p) => p.inventory.filter(Boolean).map((sl) => sl.item + 'x' + (sl.qty ?? 1)).sort()
  assert.deepEqual(held(a), ['arrowsx30', 'iron-orex1'])
  assert.deepEqual(held(b), ['iron-hatchetx1', 'logsx1'])
  assert.equal(a.gold, 170, 'fifty of their own and a hundred and twenty of theirs')
  assert.equal(b.gold, 180)
  assert.equal(E.validateState(s), null)
})

// THE SWITCH, which is the attack a two-sided trade exists to make impossible:
// change your side the instant the other has agreed.
test('any change to either side clears BOTH acceptances', () => {
  let s = table()
  s = step(s, [sit(alice, bob.playerId, [0, 1], 0, 0)])
  s = step(s, [sit(bob, alice.playerId, [0], 0, 1)])
  s = step(s, [sign({ tick: 2, type: 'settle' }, bob)])
  assert.equal(s.players[bob.playerId].trade.settled, true)
  // alice quietly takes the hatchet off the table
  s = step(s, [sit(alice, bob.playerId, [0], 0, 3)])
  assert.equal(s.players[bob.playerId].trade.settled, false,
    'touching the table un-agrees everybody, which is why there is no second screen')
  assert.equal(s.players[alice.playerId].trade.settled, false)
  // so bob's old yes cannot complete the smaller trade
  s = step(s, [sign({ tick: 4, type: 'settle' }, alice)])
  assert.ok(s.players[alice.playerId].trade, 'still a table, not an exchange')
  assert.ok(s.players[bob.playerId].inventory[0], 'and bob has given up nothing')
})

// §6q: the other half of the same attack. Inputs apply in canonical playerId
// order, so a citizen whose id sorts first could wield an advertised slot in
// the settling tick, keep the sword, and hand over whatever was on their hip.
test('a side whose goods have changed does not stand', () => {
  let s = table()
  s = step(s, [sit(alice, bob.playerId, [0], 0, 0)])
  s = step(s, [sit(bob, alice.playerId, [0], 0, 1)])
  s = step(s, [sign({ tick: 2, type: 'settle' }, alice)])
  // the logs leave the slot and something else takes their place
  s.players[alice.playerId].inventory[0] = { item: 'iron-hatchet', qty: 1 }
  s = step(s, [sign({ tick: 3, type: 'settle' }, bob)])
  assert.ok(s.players[alice.playerId].trade, 'the exchange is refused, not partly applied')
  assert.equal(s.players[alice.playerId].inventory[0].item, 'iron-hatchet')
  assert.equal(s.players[bob.playerId].inventory[0].item, 'iron-ore')
})

test('a gift is a side with nothing on the other one', () => {
  let s = table()
  s = step(s, [sit(alice, bob.playerId, [0], 0, 0)])
  s = step(s, [sit(bob, alice.playerId, [], 0, 1)])
  s = step(s, [sign({ tick: 2, type: 'settle' }, alice)])
  s = step(s, [sign({ tick: 3, type: 'settle' }, bob)])
  const a = s.players[alice.playerId], b = s.players[bob.playerId]
  assert.ok(b.inventory.some((sl) => sl?.item === 'logs'), 'they have it')
  assert.ok(!a.inventory.some((sl) => sl?.item === 'logs'), 'and the giver does not')
  // §7dk: aid is a thing you went and GOT. Taking is aid; giving is not.
  assert.equal(b.aided, true, 'they took a thing from another soul')
  assert.equal(a.aided, undefined, 'and the one who gave took nothing')
})

test('a table needs both of them standing there, and keeps needing it', () => {
  let s = table()
  s = step(s, [sit(alice, bob.playerId, [0], 0, 0)])
  s = step(s, [sit(bob, alice.playerId, [0], 0, 1)])
  s = step(s, [sign({ tick: 2, type: 'settle' }, alice)])
  s.players[bob.playerId].x = 20              // they walk off
  s = step(s, [sign({ tick: 3, type: 'settle' }, bob)])
  assert.ok(s.players[alice.playerId].trade, 'nothing settles across the island')
  assert.ok(s.players[alice.playerId].inventory[0])
})

test('standing up clears your own side and nobody else’s', () => {
  let s = table()
  s = step(s, [sit(alice, bob.playerId, [0], 0, 0)])
  s = step(s, [sit(bob, alice.playerId, [0], 0, 1)])
  s = step(s, [sign({ tick: 2, type: 'untrade' }, alice)])
  assert.equal(s.players[alice.playerId].trade, null)
  assert.ok(s.players[bob.playerId].trade,
    'nobody reaches across a table to edit somebody else’s record')
  assert.equal(E.validateState(s), null)
})

test('a table will not take coin a citizen does not hold', () => {
  let s = table()
  s = step(s, [sit(alice, bob.playerId, [], 9999, 0)])
  assert.equal(s.players[alice.playerId].trade, null, 'refused at the gate')
  s = step(s, [sit(alice, bob.playerId, [], 50, 1)])
  assert.equal(s.players[alice.playerId].trade.gold, 50, 'all of it is allowed')
})
