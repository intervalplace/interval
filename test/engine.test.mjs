// Interval regression tests — fix brief Milestones 1 & 2.
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
  E.addNode(w, 'bank-1', 'bank', 5, 6)   // adjacent to alice
  return w
}
const sign = (fields, who = alice) =>
  E.signInput({ worldId: WID, playerId: who.playerId, ...fields }, who.privateKey)
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
  s = step(s, [sign({ tick: 1, type: 'pickup', groundId: gids[0] })])
  assert.equal(E.countItem(s.players[alice.playerId].inventory, 'arrows'), 17)
  assert.equal(Object.keys(s.ground).length, 0)
})

// ---------- 7.3: deposit takes exactly one unit ----------
test('depositing from a 17-stack banks 1 and leaves 16', () => {
  let s = world()
  s.players[alice.playerId].inventory[0] = { item: 'arrows', qty: 17 }
  s = step(s, [sign({ tick: 0, type: 'deposit', slot: 0 })])
  const p = s.players[alice.playerId]
  assert.equal(p.bank.arrows, 1)
  assert.equal(p.inventory[0].qty, 16)
  // and a single item clears the slot
  s.players[alice.playerId].inventory[1] = { item: 'logs', qty: 1 }
  s = step(s, [sign({ tick: 1, type: 'deposit', slot: 1 })])
  assert.equal(s.players[alice.playerId].bank.logs, 1)
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
  s = step(s, [sign({ tick: 0, type: 'pickup', groundId: 'ga' })])
  assert.equal(E.countItem(s.players[alice.playerId].inventory, 'arrows'), 12, 'arrows pool into the quiver')
  assert.equal('ga' in s.ground, false)
  s = step(s, [sign({ tick: 1, type: 'pickup', groundId: 'gb' })])
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
