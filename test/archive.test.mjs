// The merkle archive (spec 5g), driven adversarially.
//
// Every property here is one somebody tried to break. The batching test in
// particular exists because the first implementation archived three citizens
// in one tick into a root that could prove NONE of them -- they were not
// lost loudly, they were lost silently, which is how merkle bugs are lost.
import test from 'node:test'
import assert from 'node:assert'
import crypto from 'node:crypto'
import E from '../engine.js'
import * as X from '../worldgen-expanse4.mjs'
import { Tree } from './smt-helper.mjs'

E.initCrypto()
const sha = (x) => crypto.createHash('sha256').update(x).digest('hex')
const g = X.makeExpanse4Genesis('solo-world', 'f1b7060d09685d91'.padEnd(64, '0'), 0, 896, 512)
const WORLD = E.worldId(g)
const IDS = []; for (let i = 0; i < 10; i++) IDS.push(E.generateIdentity())
const build = () => {
  const st = X.buildWorld(g)
  IDS.forEach((I, i) => { E.addPlayer(st, I.playerId, 450 + i, 250); st.players[I.playerId].gold = 10 })
  st.tick += 1008001
  for (const pid of Object.keys(st.players)) st.players[pid].lastInput = 0
  return st
}
const sign = (o, k) => E.signInput(o, k)
const arch = (st, tree, A, T) => E.nextState(st, [sign({ type: 'archive', playerId: A.playerId,
  subject: T.playerId, path: tree.path(T.playerId), tick: st.tick, worldId: WORLD }, A.privateKey)])
const rest = (st, tree, T, rec, path) => E.nextState(st, [sign({ type: 'restore', playerId: T.playerId,
  record: rec, path: path ?? tree.path(T.playerId), tick: st.tick, worldId: WORLD }, T.privateKey)])

test('a citizen archives, and the root is true', () => {
  let st = build(); const tree = new Tree()
  const rec = JSON.parse(JSON.stringify(st.players[IDS[1].playerId]))
  st = arch(st, tree, IDS[0], IDS[1])
  tree.set(IDS[1].playerId, sha(E.canonical(rec)))
  assert.ok(!st.players[IDS[1].playerId], 'left the tick')
  assert.equal(st.archiveRoot, tree.root(), 'the root the node computes is the root the world holds')
})

test('a citizen comes back whole', () => {
  let st = build(); const tree = new Tree()
  const rec = JSON.parse(JSON.stringify(st.players[IDS[1].playerId]))
  st = arch(st, tree, IDS[0], IDS[1]); tree.set(IDS[1].playerId, sha(E.canonical(rec)))
  st = rest(st, tree, IDS[1], rec); tree.del(IDS[1].playerId)
  const p = st.players[IDS[1].playerId]
  assert.ok(p, 'present again')
  assert.equal(p.gold, rec.gold)
  assert.equal(st.archiveRoot ?? E.EMPTY_ROOT, tree.root())
})

test('a forged record proves nothing', () => {
  let st = build(); const tree = new Tree()
  const rec = JSON.parse(JSON.stringify(st.players[IDS[1].playerId]))
  st = arch(st, tree, IDS[0], IDS[1]); tree.set(IDS[1].playerId, sha(E.canonical(rec)))
  const out = rest(st, tree, IDS[1], { ...rec, gold: 9e6 })
  assert.ok(!out.players[IDS[1].playerId], 'one altered field and the digest does not match')
})

test('a stale path proves nothing', () => {
  let st = build(); const tree = new Tree()
  const r1 = JSON.parse(JSON.stringify(st.players[IDS[1].playerId]))
  const r2 = JSON.parse(JSON.stringify(st.players[IDS[2].playerId]))
  st = arch(st, tree, IDS[0], IDS[1]); tree.set(IDS[1].playerId, sha(E.canonical(r1)))
  const stale = tree.path(IDS[1].playerId)              // valid right now
  st = arch(st, tree, IDS[0], IDS[2]); tree.set(IDS[2].playerId, sha(E.canonical(r2)))
  const out = rest(st, tree, IDS[1], r1, stale)         // the tree moved beneath it
  assert.ok(!out.players[IDS[1].playerId], 'a path answers to the root as it IS')
})

test('a restore cannot be replayed', () => {
  let st = build(); const tree = new Tree()
  const rec = JSON.parse(JSON.stringify(st.players[IDS[1].playerId]))
  st = arch(st, tree, IDS[0], IDS[1]); tree.set(IDS[1].playerId, sha(E.canonical(rec)))
  st = rest(st, tree, IDS[1], rec); tree.del(IDS[1].playerId)
  const snap = JSON.stringify(st.players[IDS[1].playerId])
  const out = rest(st, tree, IDS[1], rec)
  assert.equal(JSON.stringify(out.players[IDS[1].playerId]), snap, 'the slot was vacated')
})

test('a present citizen cannot be archived', () => {
  let st = build(); const tree = new Tree()
  st.players[IDS[1].playerId].lastInput = st.tick       // seen just now
  const out = arch(st, tree, IDS[0], IDS[1])
  assert.ok(out.players[IDS[1].playerId], 'absence is required')
})

test('BATCHING: paths chain within a tick, and nobody is lost', () => {
  // Three archives in one tick, from three submitters, every path built
  // against the root at the START. Only the first can be valid -- the others
  // answer to a root that has already moved. What must NEVER happen is all
  // three succeeding into a root that proves none of them.
  let st = build(); const tree = new Tree()
  const targets = IDS.slice(3, 6)
  const recs = targets.map(I => JSON.parse(JSON.stringify(st.players[I.playerId])))
  const ins = IDS.slice(0, 3).map((A, i) => sign({ type: 'archive', playerId: A.playerId,
    subject: targets[i].playerId, path: tree.path(targets[i].playerId),
    tick: st.tick, worldId: WORLD }, A.privateKey))
  st = E.nextState(st, ins)
  const gone = targets.filter(I => !st.players[I.playerId])
  assert.equal(gone.length, 1, 'exactly one: the rest saw a root that moved')
  for (const I of gone) tree.set(I.playerId, sha(E.canonical(recs[targets.indexOf(I)])))
  assert.equal(st.archiveRoot ?? E.EMPTY_ROOT, tree.root(), 'the root is true for whoever went')
  // and the one who went can come back
  const i = targets.indexOf(gone[0])
  const out = rest(st, tree, gone[0], recs[i])
  assert.ok(out.players[gone[0].playerId], 'everyone archived can be proven')
})

test('two nodes reach the same root', () => {
  const run = () => { let a = build(); const t = new Tree()
    a = arch(a, t, IDS[0], IDS[1])
    return (a.archiveRoot ?? '-') + '|' + Object.keys(a.players).sort().join(',') }
  assert.equal(run(), run())
})
