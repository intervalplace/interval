// §9b-iii: THE INHERITED TREE, HELD OUTSIDE THE TICK.
//
// A successor carries one root over the citizens of the world it continues,
// and a citizen comes home by bringing their record and a path against it.
// Spending a leaf moves the root, so the first person home invalidates
// everybody else's kept path, and somebody has to be able to rebuild them.
//
// `incoming.mjs` is that somebody. It holds no key and no authority: a bad
// path costs a citizen nothing, because the root refuses it. What it must
// never do is hand out a path that does not work while looking like it does,
// so every property here is about that.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import E from '../engine.js'
import { IncomingTree, leavesOf } from '../incoming.mjs'

E.initCrypto()
const RULES = 'c'.repeat(64)

function predecessor (n) {
  const g = E.makeGenesis('incoming-before', RULES, 0, 40, 30)
  const s = E.newWorld(g)
  const who = []
  for (let i = 0; i < n; i++) {
    const k = E.generateIdentity()
    E.addPlayer(s, k.playerId, 5 + (i % 20), 5 + Math.floor(i / 20))
    s.players[k.playerId].gold = 10 + i
    who.push(k)
  }
  s.tick = 500000
  return { g, s, who }
}

const successorOf = (before) => {
  const g = E.makeGenesis('incoming-after', RULES, 0, 40, 30)
  g.from = { worldId: E.worldId(before.g), livingRoot: E.livingRootOf(before.s), tick: before.s.tick }
  return E.newWorld(g)
}

const fileRestore = (st, k, record, path) => E.nextState(st, [E.signInput({
  type: 'restore', playerId: k.playerId, record, path,
  tick: st.tick, worldId: E.worldId(st.genesis),
}, k.privateKey)])

test('the tree built from leaves is the root the engine built from players', () => {
  const before = predecessor(9)
  const tree = new IncomingTree(leavesOf(before.s))
  assert.equal(tree.root(), E.livingRootOf(before.s),
    'one builder, so a service and the tick cannot disagree about the tree')
  assert.equal(tree.size, 9)
})

test('a path from the tree is the path the engine would have given', () => {
  const before = predecessor(9)
  const tree = new IncomingTree(leavesOf(before.s))
  for (const k of before.who) {
    const mine = tree.path(k.playerId)
    assert.deepEqual(mine, E.livingPathOf(before.s, k.playerId), 'byte for byte')
    assert.ok(E.provesLiving(tree.root(), k.playerId, before.s.players[k.playerId], mine))
  }
  assert.equal(tree.path('f'.repeat(64)), null, 'and nothing for somebody who was never there')
})

test('the first citizen home invalidates everybody else, and the tree rebuilds them', () => {
  const before = predecessor(9)
  const tree = new IncomingTree(leavesOf(before.s))
  const [a, b] = before.who
  let st = successorOf(before)

  // both took a copy of their path on the day the world stopped
  const aPath = tree.path(a.playerId)
  const bStale = tree.path(b.playerId)

  st = fileRestore(st, a, before.s.players[a.playerId], aPath)
  assert.ok(st.players[a.playerId], 'the first one home walks in')

  // b's kept path is now worthless: a's leaf was spent and the root moved
  assert.ok(!fileRestore(st, b, before.s.players[b.playerId], bStale).players[b.playerId],
    'a path answers to the root as it now stands')

  // the service follows the world and hands b a fresh one
  assert.equal(tree.follow(st), true, 'the service is in step with the world')
  assert.equal(tree.root(), st.incomingRoot)
  const fresh = tree.path(b.playerId)
  assert.notDeepEqual(fresh, bStale, 'which is a different path')
  const out = fileRestore(st, b, before.s.players[b.playerId], fresh)
  assert.ok(out.players[b.playerId], 'and it works')
  assert.equal(out.players[b.playerId].gold, 11, 'with everything they had')
})

test('a service that has fallen behind says so rather than guessing', () => {
  const before = predecessor(6)
  const tree = new IncomingTree(leavesOf(before.s))
  const [a] = before.who
  let st = successorOf(before)
  st = fileRestore(st, a, before.s.players[a.playerId], tree.path(a.playerId))
  // it has not followed yet, so its root is the founding one and the world's is not
  assert.notEqual(tree.root(), st.incomingRoot)
  assert.equal(tree.follow(st), true, 'following catches it up')
  // and a tree told a lie about who came home knows it is wrong
  const wrong = new IncomingTree(leavesOf(before.s), [before.who[3].playerId])
  assert.equal(wrong.follow({ players: {}, incomingRoot: st.incomingRoot }), false,
    'a root that does not match the world is a service that must serve nothing')
})

test('a citizen who has come home is offered no second path', () => {
  const before = predecessor(5)
  const tree = new IncomingTree(leavesOf(before.s))
  const [a] = before.who
  assert.ok(tree.path(a.playerId))
  tree.spend(a.playerId)
  assert.equal(tree.path(a.playerId), null, 'one proof, one homecoming')
  assert.equal(tree.size, 4)
})

test('the last citizen home empties the tree, and the world stops carrying it', () => {
  const before = predecessor(2)
  const tree = new IncomingTree(leavesOf(before.s))
  let st = successorOf(before)
  for (const k of before.who) {
    assert.equal(tree.follow(st), true)
    st = fileRestore(st, k, before.s.players[k.playerId], tree.path(k.playerId))
    assert.ok(st.players[k.playerId])
  }
  assert.equal(st.incomingRoot, undefined,
    'an empty inherited root is dropped, exactly as the archive drops its own')
  assert.equal(E.validateState(st), null)
})

test('a citizen who spawned as a newcomer keeps their way home', () => {
  // THE BUG THIS EXISTS FOR: the obvious way to follow a world is to spend the
  // leaf of anybody who has appeared in it. That is wrong. A citizen may be a
  // player in the successor because they attended and SPAWNED under the same
  // key, having given up on coming home or simply chosen not to. Spending
  // their leaf on that evidence would lock them out of their own file for ever.
  const before = predecessor(5)
  const tree = new IncomingTree(leavesOf(before.s))
  const [a] = before.who
  const st = successorOf(before)
  // they are standing in the new world, and they have come home to nothing:
  // the inherited root is untouched, because no restore was ever filed.
  E.addPlayer(st, a.playerId, 7, 7)
  assert.equal(st.incomingRoot, E.livingRootOf(before.s), 'nobody has come home')
  assert.equal(tree.follow(st), true, 'and the service knows it')
  assert.ok(tree.path(a.playerId),
    'so their way home is still there, standing in the world or not')
})

test('a follower that missed several homecomings reads them off the citizens', () => {
  const before = predecessor(6)
  const tree = new IncomingTree(leavesOf(before.s))
  const live = new IncomingTree(leavesOf(before.s))
  let st = successorOf(before)
  // three come home while this follower is not watching
  for (const k of before.who.slice(0, 3)) {
    assert.equal(live.follow(st), true)
    st = fileRestore(st, k, before.s.players[k.playerId], live.path(k.playerId))
    assert.ok(st.players[k.playerId])
  }
  // Three unexplained spends are not one, so the single-step search cannot
  // close them. It does not have to: each of those citizens carries the
  // interval they came home at, which is exact.
  assert.equal(tree.follow(st), true)
  assert.equal(tree.root(), st.incomingRoot)
  assert.equal(tree.spentList().length, 3)
})

test('and when the citizens cannot say, it says so instead of guessing', () => {
  // The remaining gap, stated honestly: a citizen who came home and has since
  // been archived is not in `players`, so the derivation is short by them. One
  // such is closed by the single-step search; several are not, and then the
  // service serves nothing rather than hand out paths that cannot work.
  const before = predecessor(6)
  const live = new IncomingTree(leavesOf(before.s))
  let st = successorOf(before)
  const home = []
  for (const k of before.who.slice(0, 3)) {
    assert.equal(live.follow(st), true)
    st = fileRestore(st, k, before.s.players[k.playerId], live.path(k.playerId))
    home.push(k.playerId)
  }
  // two of the three put away: their records are gone from the tick, and the
  // inherited root still counts their leaves as spent
  for (const pid of home.slice(0, 2)) delete st.players[pid]
  const blind = new IncomingTree(leavesOf(before.s))
  assert.equal(blind.follow(st), false, 'two it cannot work out, and it admits it')

  // one, and the single-step search closes it
  const st2 = JSON.parse(JSON.stringify(st))
  st2.players[home[0]] = { returned: 5, x: 5, y: 5, skills: {}, health: 64,
    equipment: {}, vaults: {}, lastInput: 5, gold: 0, inventory: [],
    consignment: null, action: null, name: null, trade: null }
  const nearly = new IncomingTree(leavesOf(before.s))
  assert.equal(nearly.follow(st2), true, 'one missing leaf is a step it can prove')
})

// ---------- a service that was not there from the start ----------
//
// `follow` closes one interval at a time, which is all a running node ever
// needs. A node that starts after several citizens have come home cannot work
// the spent set out at all: the root is explained only by a SET of spends, and
// choosing it would be a search over hashes with nothing to guide it.
//
// It does not have to work it out. Anybody already running a service can say,
// and what they say is CHECKABLE: rebuild the tree with it and the root either
// matches the world's own or it does not. So the list travels between
// strangers and nothing is trusted.
test('a spent list is adopted only when it rebuilds the world\'s own root', () => {
  const before = predecessor(7)
  const live = new IncomingTree(leavesOf(before.s))
  let st = successorOf(before)
  const home = []
  for (const k of before.who.slice(0, 4)) {
    assert.equal(live.follow(st), true)
    st = fileRestore(st, k, before.s.players[k.playerId], live.path(k.playerId))
    assert.ok(st.players[k.playerId])
    home.push(k.playerId)
  }
  // the loop follows BEFORE each restore, so the last one is still unseen
  assert.equal(live.follow(st), true)
  assert.equal(live.spentList().length, 4, 'four have come home')

  // a service starting now reads it off the citizens
  const fresh = new IncomingTree(leavesOf(before.s))
  assert.equal(fresh.follow(st), true)
  assert.equal(fresh.spentList().length, 4)

  // and a list handed over by another node is accepted too, which is the path
  // for a world whose citizens predate the field
  const told = new IncomingTree(leavesOf(before.s))
  assert.equal(told.adopt(live.spentList(), st), true)
  assert.equal(told.root(), st.incomingRoot)
  const next = before.who[4]
  const p = told.path(next.playerId)
  assert.ok(p, 'and it can hand the next citizen their way home')
  assert.ok(fileRestore(st, next, before.s.players[next.playerId], p).players[next.playerId])

  // every dishonest or stale answer, refused by one hash comparison, and the
  // tree left exactly as it was each time
  for (const [bad, what] of [
    [[], 'an empty list, as if nobody had come home'],
    [home.slice(0, 3), 'a list one short'],
    [[...home, before.who[5].playerId], 'a list naming somebody who has not'],
    [[...home.slice(1), before.who[6].playerId], 'the right length and the wrong people'],
    ['not a list', 'not a list at all'],
  ]) {
    const t2 = new IncomingTree(leavesOf(before.s))
    assert.equal(t2.adopt(bad, st), false, what + ' must be refused')
    assert.equal(t2.spentList().length, 0, 'and the tree is left as it was')
  }

  // A NAME THAT WAS NEVER IN THIS WORLD IS NOISE, NOT A LIE. It is filtered
  // out, and what remains is the honest list, so the root agrees and the answer
  // stands. Refusing it would make a service breakable by appending rubbish to
  // an otherwise correct reply.
  const noisy = new IncomingTree(leavesOf(before.s))
  assert.equal(noisy.adopt([...home, 'f'.repeat(64)], st), true)
  assert.deepEqual(noisy.spentList(), [...home].sort(), 'and the stranger is not in it')

  // the honest list from a DIFFERENT world's state is refused too
  const elsewhere = successorOf(predecessor(7))
  assert.equal(new IncomingTree(leavesOf(before.s)).adopt(live.spentList(), elsewhere), false)
})

// ---------- a service that starts from nothing but the state ----------
//
// Replaying the world's certificates was the obvious way to recover who has
// come home, and it is the wrong one: it needs the index for that world back
// to its genesis, which a node starting cold does not have, and a node that
// does have it already kept the list.
//
// So the citizens carry it. A homecoming writes the interval on the citizen
// (§9b-iii `returned`), which makes the spent set a pure function of the state
// every node holds. No file, no peer, no history.
test('a service starts cold from the state alone, with nothing kept', () => {
  const before = predecessor(8)
  const live = new IncomingTree(leavesOf(before.s))
  let st = successorOf(before)
  for (const k of before.who.slice(0, 5)) {
    assert.equal(live.follow(st), true)
    st = fileRestore(st, k, before.s.players[k.playerId], live.path(k.playerId))
    assert.ok(st.players[k.playerId])
    assert.equal(st.players[k.playerId].returned, st.tick, 'the citizen carries when they came home')
  }
  assert.equal(E.validateState(st), null, 'and the world is valid holding it')

  // a brand new service: no spent file, no peer, no certificates
  const cold = new IncomingTree(leavesOf(before.s))
  assert.equal(cold.fromState(st), true, 'it reads it off the citizens')
  assert.equal(cold.root(), st.incomingRoot)
  assert.equal(cold.spentList().length, 5)

  // and it works: the sixth citizen gets a path that the world accepts
  const next = before.who[5]
  const out = fileRestore(st, next, before.s.players[next.playerId], cold.path(next.playerId))
  assert.ok(out.players[next.playerId], 'the next one home walks in')

  // `follow` reaches for the state by itself, so a cold service needs no
  // special handling by whoever runs it
  const cold2 = new IncomingTree(leavesOf(before.s))
  assert.equal(cold2.follow(st), true)
  assert.equal(cold2.root(), st.incomingRoot)
})

test('a citizen who spawned as a newcomer is not counted as having come home', () => {
  // The same trap as before, one layer down: presence in the world is not
  // evidence of a homecoming. Only the field the restore wrote is.
  const before = predecessor(5)
  const st = successorOf(before)
  const [a] = before.who
  E.addPlayer(st, a.playerId, 7, 7)
  assert.equal(st.players[a.playerId].returned, undefined)
  const t = new IncomingTree(leavesOf(before.s))
  assert.equal(t.fromState(st), true, 'nobody has come home, and that is the answer')
  assert.equal(t.spentList().length, 0)
  assert.ok(t.path(a.playerId), 'so their way home is still there')
})

test('the field survives being archived and does not cross a crossing', async () => {
  const { carry } = await import('../crossing.mjs')
  const before = predecessor(4)
  const live = new IncomingTree(leavesOf(before.s))
  let st = successorOf(before)
  const [a] = before.who
  st = fileRestore(st, a, before.s.players[a.playerId], live.path(a.playerId))
  const p = st.players[a.playerId]
  assert.equal(p.returned, st.tick)

  // A CROSSING DOES NOT CARRY IT. It is a fact about this world's inherited
  // tree, not about the citizen's life, so it must not follow them into a
  // third world and be counted there.
  p.name = 'rowan'                      // so they count as having lived
  const [crossed] = carry({ [a.playerId]: p })
  assert.equal(crossed.returned, undefined)
  assert.ok(!Object.keys(crossed).includes('returned'))
})
