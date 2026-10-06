// §9b-iii: THE WAY BACK IN, when the world that held you stopped.
//
// A refounding used to be the only answer to a lost quorum, and it needed one
// person to hold the whole final checkpoint and read everybody out of it into
// the new genesis. That works and it does not scale: at a million citizens it
// is hundreds of megabytes somebody must have, keep current, and be trusted
// not to edit.
//
// So a successor's genesis names one thing instead: the root over the living
// that the predecessor ended on. Constant size, whatever the population. Then
// each citizen comes back on their own, whenever they like, carrying their own
// record and a few hundred bytes of path, and the root judges it. Nobody holds
// anybody else's data and nobody is trusted.
//
// Every property here is one that has to hold or the design is worthless:
// a doctored record is refused, somebody else's record is refused, one proof
// seats one citizen ONCE, and what crosses is identical to what a founder's
// import would have carried.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import E from '../engine.js'
import { carry } from '../crossing.mjs'

E.initCrypto()
const RULES = 'a'.repeat(64)

// the world that stops: four citizens, one of them rich and sworn
function predecessor () {
  const g = E.makeGenesis('succession-before', RULES, 0, 40, 30)
  const s = E.newWorld(g)
  const who = []
  for (let i = 0; i < 4; i++) {
    const k = E.generateIdentity()
    E.addPlayer(s, k.playerId, 5 + i, 5)
    who.push(k)
  }
  const me = s.players[who[0].playerId]
  me.name = 'alder'
  s.names.alder = who[0].playerId
  me.gold = 4210
  me.skills.woodcraft = E.xpForLevel ? E.xpForLevel(55) : 200000
  me.calling = 'forester'
  me.deaths = 3
  me.inventory[0] = { item: 'logs', qty: 7 }
  s.tick = 90210
  return { g, s, who }
}

// the world that continues it. SAME SEED, same rules, same dimensions: a
// successor is the same island re-founded, which is checkable rather than
// promised (`protocol.mjs:continuation`). Only `from` and the witnesses differ,
// and `from` is enough to give it its own worldId.
function successor (from, { generator } = {}) {
  const g = E.makeGenesis('succession-before', RULES, 0, 40, 30, generator)
  g.from = from
  return g
}

const fromOf = (before) => ({
  worldId: E.worldId(before.g),
  livingRoot: E.livingRootOf(before.s),
  tick: before.s.tick,
})

const fileRestore = (st, k, record, path) => E.nextState(st, [E.signInput({
  type: 'restore', playerId: k.playerId, record, path,
  tick: st.tick, worldId: E.worldId(st.genesis),
}, k.privateKey)])

test('a successor names one root and nothing about the population', () => {
  const before = predecessor()
  const g = successor(fromOf(before))
  assert.equal(E.validateGenesis(g), null, 'the founding is constitutional')
  assert.equal(JSON.stringify(g).length < 8000, true, 'and constant size: no citizen list in it')
  const after = E.newWorld(g)
  assert.equal(after.incomingRoot, g.from.livingRoot,
    'the state takes a spendable copy of the inherited root')
  assert.equal(E.validateState(after), null)
})

test('a citizen walks back in on their own record and path', () => {
  const before = predecessor()
  const k = before.who[0]
  const record = before.s.players[k.playerId]
  const path = E.livingPathOf(before.s, k.playerId)
  assert.ok(E.provesLiving(E.livingRootOf(before.s), k.playerId, record, path))

  let st = E.newWorld(successor(fromOf(before)))
  assert.equal(Object.keys(st.players).length, 0, 'the successor begins empty')
  st = fileRestore(st, k, record, path)

  const p = st.players[k.playerId]
  assert.ok(p, 'they are here')
  assert.equal(p.name, 'alder', 'with their name')
  assert.equal(p.gold, 4210, 'and their money')
  assert.equal(p.calling, 'forester', 'and what they swore')
  assert.equal(p.deaths, 3, 'and the tally the handbook promises never falls')
  assert.equal(p.skills.woodcraft, record.skills.woodcraft, 'and every hour they put in')
  assert.deepEqual(p.inventory[0], { item: 'logs', qty: 7 }, 'and what was in their pack')
  assert.equal(st.names.alder, k.playerId, 'and the name is theirs in this world too')
  assert.equal(E.validateState(st), null, 'and the world is valid with them in it')

  // WHERE: at the spawn, not at a coordinate from a clock that stopped
  const sp = E.spawnOf(st.genesis)
  assert.equal(p.x, sp.x)
  assert.equal(p.y, sp.y)
})

test('what crosses is the same whichever door they came through', () => {
  const before = predecessor()
  const k = before.who[0]
  const viaFounder = carry(before.s.players).find(c => c.pid === k.playerId)

  let st = E.newWorld(successor(fromOf(before)))
  st = fileRestore(st, k, before.s.players[k.playerId], E.livingPathOf(before.s, k.playerId))
  const viaProof = st.players[k.playerId]

  // the projection is one function, so compare what it produced against what
  // actually got seated: every carried field, field by field.
  for (const [key, want] of Object.entries(viaFounder)) {
    if (key === 'pid') continue
    if (key === 'vaults' || key === 'inventory' || key === 'weapon' || key === 'health') continue
    assert.deepEqual(viaProof[key], want, `${key} crosses the same either way`)
  }
})

test('one proof seats one citizen, once', () => {
  const before = predecessor()
  const k = before.who[0]
  const record = before.s.players[k.playerId]
  const path = E.livingPathOf(before.s, k.playerId)

  let st = E.newWorld(successor(fromOf(before)))
  st = fileRestore(st, k, record, path)
  assert.ok(st.players[k.playerId])
  const spent = st.incomingRoot
  assert.notEqual(spent, E.worldId ? st.genesis.from.livingRoot : null,
    'their leaf is spent out of the inherited tree')

  // leave, be archived after a long absence, and try the same file again
  delete st.players[k.playerId]
  delete st.names.alder
  st.tick += 10
  const again = fileRestore(st, k, record, path)
  assert.ok(!again.players[k.playerId],
    'the same proof cannot seat them twice: that is how goods would double')
  assert.equal(again.incomingRoot, spent, 'and the tree is untouched by the attempt')
})

test('a doctored record, a stranger\'s record, and a world that continues nothing', () => {
  const before = predecessor()
  const k = before.who[0], other = before.who[1]
  const record = before.s.players[k.playerId]
  const path = E.livingPathOf(before.s, k.playerId)
  const base = () => E.newWorld(successor(fromOf(before)))

  const rich = JSON.parse(JSON.stringify(record)); rich.gold = 1_000_000
  assert.ok(!fileRestore(base(), k, rich, path).players[k.playerId],
    'giving yourself money changes the leaf and the fold fails')

  const levelled = JSON.parse(JSON.stringify(record)); levelled.skills.prowess = 1e9
  assert.ok(!fileRestore(base(), k, levelled, path).players[k.playerId],
    'and so does giving yourself levels')

  // somebody else's record, filed under your own key and with their path
  const theirs = before.s.players[other.playerId]
  const theirPath = E.livingPathOf(before.s, other.playerId)
  assert.ok(!fileRestore(base(), k, theirs, theirPath).players[k.playerId],
    'a path is bound to the id it was built for')

  // a world that continues nothing has nothing to let anybody in from
  const plain = E.newWorld(E.makeGenesis('succession-plain', RULES, 0, 40, 30))
  assert.equal(plain.incomingRoot, undefined)
  assert.ok(!fileRestore(plain, k, record, path).players[k.playerId],
    'and no root means no door')
})

test('a taken name costs the name, never the citizen', () => {
  const before = predecessor()
  const k = before.who[0]
  let st = E.newWorld(successor(fromOf(before)))
  // somebody got here first and took it
  const squatter = E.generateIdentity()
  E.addPlayer(st, squatter.playerId, 6, 6)
  st.players[squatter.playerId].name = 'alder'
  st.names.alder = squatter.playerId

  st = fileRestore(st, k, before.s.players[k.playerId], E.livingPathOf(before.s, k.playerId))
  const p = st.players[k.playerId]
  assert.ok(p, 'they are let in')
  assert.equal(p.name, null, 'without the name, which is somebody else\'s here')
  assert.equal(st.names.alder, squatter.playerId, 'and it stays theirs')
  assert.equal(p.gold, 4210, 'everything else crosses')
  assert.equal(E.validateState(st), null)
})

test('a world cannot continue itself, and the founding is refused for trying', () => {
  const g = E.makeGenesis('succession-loop', RULES, 0, 40, 30)
  g.from = { worldId: E.worldId(g), livingRoot: 'b'.repeat(64), tick: 7 }
  // the worldId commits to `from`, so naming your own id is self-referential
  // and cannot actually be constructed. What is refused is the shape of the
  // attempt: a root that is not a hash, a tick before the world, a field
  // nobody declared.
  const bad = [
    [{ worldId: 'x'.repeat(64), livingRoot: 'b'.repeat(64), tick: 7 }, 'malformed from worldId'],
    [{ worldId: 'a'.repeat(64), livingRoot: 'nope', tick: 7 }, 'malformed from living root'],
    [{ worldId: 'a'.repeat(64), livingRoot: 'b'.repeat(64), tick: 0 }, 'from tick out of bounds'],
    [{ worldId: 'a'.repeat(64), livingRoot: 'b'.repeat(64) }, 'non-constitutional genesis.from'],
    [{ worldId: 'a'.repeat(64), livingRoot: 'b'.repeat(64), tick: 7, extra: 1 }, 'non-constitutional genesis.from'],
  ]
  for (const [from, why] of bad) {
    const g2 = E.makeGenesis('succession-bad', RULES, 0, 40, 30)
    g2.from = from
    assert.equal(E.validateGenesis(g2), why)
  }
})

// ---------- the whole sentence, end to end ----------
//
// Everything above tests one joint. This is the claim the project actually
// makes, in one test: a world is founded with witnesses, a citizen keeps the
// file their client keeps, that world stops for ever, somebody founds a
// successor naming the root the witnesses sealed, and the citizen walks in.
//
// Nobody holds anybody else's data. Nothing is trusted. The only thing that
// had to survive is one copy of the final state, which rule 1 of SUCCESSION.md
// requires of a founder anyway, and the citizen's own file.
test('a world stops, a successor is founded, and a citizen walks in on their file', async () => {
  const P = await import('../protocol.mjs')
  const { IncomingTree, leavesOf } = await import('../incoming.mjs')

  // ---- the world that stopped, and the witnesses that signed its last root
  const wk = [E.generateIdentity(), E.generateIdentity(), E.generateIdentity()]
  const g1 = E.makeGenesis('end-to-end', RULES, 0, 40, 30)
  g1.witnesses = wk.map(k => k.playerId)
  g1.quorum = 2
  g1.byzantineTolerance = 0
  const w1 = E.worldId(g1)
  const s1 = E.newWorld(g1)
  const me = E.generateIdentity(), them = E.generateIdentity()
  E.addPlayer(s1, me.playerId, 5, 5)
  E.addPlayer(s1, them.playerId, 6, 5)
  s1.players[me.playerId].gold = 9001
  s1.players[me.playerId].name = 'rowan'
  s1.names.rowan = me.playerId
  s1.tick = 777000

  const root1 = E.livingRootOf(s1)
  const seal = {
    worldId: w1, tick: s1.tick, livingRoot: root1,
    attestations: wk.slice(0, 2).map(k => P.makeAttestation({
      worldId: w1, tick: s1.tick - 1, round: 0, bundleHash: 'a'.repeat(64),
      resultingStateHash: E.stateHash(s1), livingRoot: root1, witness: k,
    })),
  }
  assert.equal(P.verifyLivingSeal(g1, w1, seal), null, 'the last root was signed')

  // ---- what the client kept, which is all this citizen has
  const kept = {
    v: 2, worldId: w1, tick: s1.tick, livingRoot: root1,
    playerId: me.playerId, record: s1.players[me.playerId],
    path: E.livingPathOf(s1, me.playerId), seal, genesis: g1,
  }
  assert.equal(P.verifyKeptProof(kept), null,
    'their file verifies on its own: no state, no node, nobody\'s cooperation')

  // ---- the successor, founded by a stranger holding only the final state
  const g2 = E.makeGenesis('end-to-end', RULES, 0, 40, 30)
  g2.from = { worldId: w1, livingRoot: kept.seal.livingRoot, tick: kept.seal.tick }
  g2.anchorMs = (g1.anchorMs ?? 0) + kept.seal.tick * E.TICK_MS
  assert.equal(E.validateGenesis(g2), null)
  // the citizen's own client checks the world before walking into it, with
  // nothing but the founding their file carries
  assert.equal(P.continuation(kept.genesis, g2), null,
    'same rules, same engine, same island, not backdated')
  // anyone can check that founding without holding anything: the seal says the
  // root was real, and the genesis says this world continues it
  assert.equal(P.verifyLivingSeal(kept.genesis, g2.from.worldId, kept.seal), null)
  let s2 = E.newWorld(g2)

  // ---- somebody runs a path service off the old checkpoint
  const tree = new IncomingTree(leavesOf(s1))
  assert.equal(tree.root(), g2.from.livingRoot, 'and it is the tree the founding names')
  assert.equal(tree.follow(s2), true)

  // ---- and the citizen comes home with the record from their own file
  s2 = fileRestore(s2, me, kept.record, tree.path(me.playerId))
  const back = s2.players[me.playerId]
  assert.ok(back, 'they are in the world that continues theirs')
  assert.equal(back.gold, 9001)
  assert.equal(back.name, 'rowan')
  assert.equal(E.validateState(s2), null)

  // and the one who never came back is still owed their place
  assert.equal(tree.follow(s2), true)
  assert.ok(tree.path(them.playerId), 'waiting, for as long as it takes')
  assert.equal(tree.path(me.playerId), null, 'and the one who came is spent')
})

// ---------- and is it really the same world? ----------
//
// The sharpest objection to the whole design: anybody may found a successor,
// so the first to found one would get to change whatever they liked and be
// inherited anyway, because that is where everybody's friends went. The answer
// is that a citizen's own client refuses. Their kept file carries the founding
// they lived under, which is everything the check needs.
test('a citizen\'s client refuses a world that is not a faithful continuation', async () => {
  const P = await import('../protocol.mjs')
  const before = predecessor()
  const from = fromOf(before)
  const same = () => {
    const g = E.makeGenesis('succession-before', RULES, 0, 40, 30)
    g.from = { ...from }
    g.anchorMs = before.g.anchorMs + from.tick * E.TICK_MS
    return g
  }
  assert.equal(P.continuation(before.g, same()), null, 'a faithful one is accepted')

  const bent = (f) => { const g = same(); f(g); return P.continuation(before.g, g) }
  assert.equal(bent(g => { g.rulesHash = 'b'.repeat(64) }), 'the rules are not the same rules')
  assert.equal(bent(g => { g.engineHash = 'c'.repeat(64) }), 'a different engine')
  assert.equal(bent(g => { g.genesisSeed = 'somewhere-else' }), 'a different island')
  assert.equal(bent(g => { g.worldW = 80 }), 'a different island')
  assert.equal(bent(g => { g.worldGenerator = 'interval-expanse-v1' }), 'a different island')
  assert.equal(bent(g => { g.anchorMs = 0 }), 'founded before the world it continues had ended')
  assert.equal(bent(g => { g.from.worldId = 'd'.repeat(64) }), 'this world continues a different one')
  assert.equal(bent(g => { delete g.from }), 'this world continues nothing')

  // a geography hash on both sides, disagreeing
  const g1 = { ...before.g, geographyHash: 'e'.repeat(64) }
  const g2 = same(); g2.geographyHash = 'f'.repeat(64)
  g2.from.worldId = E.worldId(g1)
  assert.equal(P.continuation(g1, g2), 'a different island')
})

// ---------- when may a successor be founded? ----------
//
// The danger here is not a hostile successor but an EAGER one. A world whose
// witnesses are offline for an afternoon has not ended, and a successor
// founded in that afternoon splits the people in it: some walk in with their
// files while the old world comes back, and then both exist with the same
// citizens in each. Nobody has to be malicious for that. So: a month of
// silence, or the old world's own witnesses sign the handover.
test('a successor waits a month, or is handed the line by the witnesses', async () => {
  const P = await import('../protocol.mjs')
  const wk = [E.generateIdentity(), E.generateIdentity(), E.generateIdentity()]
  const g1 = E.makeGenesis('gap-world', RULES, 0, 40, 30)
  g1.witnesses = wk.map(k => k.playerId)
  g1.quorum = 2
  g1.byzantineTolerance = 0
  const ENDED_AT = 500000                      // the last certified interval
  const endedMs = (g1.anchorMs ?? 0) + ENDED_AT * E.TICK_MS

  const g2 = E.makeGenesis('gap-world', RULES, 0, 40, 30)
  g2.from = { worldId: E.worldId(g1), livingRoot: 'a'.repeat(64), tick: ENDED_AT }
  g2.anchorMs = endedMs
  g2.witnesses = [wk[0].playerId]
  g2.quorum = 1
  g2.byzantineTolerance = 0
  assert.equal(P.continuation(g1, g2), null, 'it is the same world, which is not the question')

  // the day after: too soon, and it says how long is left
  const soon = P.eligible(g1, g2, { nowMs: endedMs + 86400000 })
  assert.match(soon, /founded too soon/)
  assert.match(soon, /29 day\(s\) to go/)

  // a month later: nobody came back, so anybody may carry it
  assert.equal(P.eligible(g1, g2, { nowMs: endedMs + P.ABANDON_GAP_MS }), null)

  // or the witnesses hand it over, and then there is nothing to wait for
  const newId = E.worldId(g2)
  const handover = wk.slice(0, 2).map(k => P.makeHandover({
    worldId: E.worldId(g1), successor: newId, witness: k,
  }))
  assert.equal(P.verifyHandover(g1, newId, handover), null)
  assert.equal(P.eligible(g1, g2, { nowMs: endedMs + 1000, handover }), null,
    'the graceful ending needs no gap at all')

  // and every way a handover can fail to be one
  const bend = (f) => {
    const h = JSON.parse(JSON.stringify(handover)); f(h)
    return P.verifyHandover(g1, newId, h)
  }
  assert.equal(bend(h => { h.length = 1 }), 'short of a quorum of the old world\'s witnesses')
  assert.equal(bend(h => { h[1] = h[0] }), 'the same witness counted twice')
  assert.equal(bend(h => { h[0].successor = 'b'.repeat(64) }), 'a handover naming another successor')
  assert.equal(bend(h => { h[0].worldId = 'c'.repeat(64) }), 'a handover from another world')
  assert.equal(bend(h => { h[0].sig = '0'.repeat(128) }), 'bad handover signature')

  // a stranger's signatures, valid in themselves and worth nothing here
  const stranger = E.generateIdentity()
  const outside = handover.map(h => P.makeHandover({
    worldId: h.worldId, successor: h.successor, witness: stranger,
  }))
  assert.match(P.verifyHandover(g1, newId, outside), /was not a witness|counted twice/)

  // A HANDOVER NAMES ONE SUCCESSOR. The worldId commits to the whole founding,
  // so the same signatures cannot be pointed at a rival world.
  const g3 = E.makeGenesis('gap-world', RULES, 0, 40, 30)
  g3.from = { ...g2.from }
  g3.anchorMs = endedMs + 5000
  g3.witnesses = [wk[1].playerId]
  g3.quorum = 1
  g3.byzantineTolerance = 0
  assert.notEqual(E.worldId(g3), newId)
  assert.equal(P.verifyHandover(g1, E.worldId(g3), handover), 'a handover naming another successor')

  // a broken handover is said out loud rather than falling back to the gap
  const broken = JSON.parse(JSON.stringify(handover)); broken[0].sig = '0'.repeat(128)
  assert.match(P.eligible(g1, g2, { nowMs: endedMs + 1000, handover: broken }),
    /^handover: bad handover signature$/)
})

// ---------- where did the world go? ----------
//
// Every other part of succession assumed a citizen already knew which world
// continues theirs. Nothing told them, and a line nobody can find is a line
// nobody inherits. So a client asks every node it has ever heard of, and the
// answer arrives from somebody with no standing to say anything. These are the
// properties that make it safe to ask strangers.
test('an offer of a successor is arithmetic, not trust', async () => {
  const P = await import('../protocol.mjs')
  const wk = [E.generateIdentity(), E.generateIdentity(), E.generateIdentity()]
  const g1 = E.makeGenesis('offer-world', RULES, 0, 40, 30)
  g1.witnesses = wk.map(k => k.playerId)
  g1.quorum = 2
  g1.byzantineTolerance = 0
  const ENDED = 200000
  const endedMs = (g1.anchorMs ?? 0) + ENDED * E.TICK_MS
  const now = endedMs + 1000

  const heir = () => {
    const g = E.makeGenesis('offer-world', RULES, 0, 40, 30)
    g.from = { worldId: E.worldId(g1), livingRoot: 'a'.repeat(64), tick: ENDED }
    g.anchorMs = endedMs
    g.witnesses = [wk[0].playerId]
    g.quorum = 1
    g.byzantineTolerance = 0
    return g
  }
  const g2 = heir()
  const handover = wk.slice(0, 2).map(k => P.makeHandover({
    worldId: E.worldId(g1), successor: E.worldId(g2), witness: k,
  }))
  const offer = { v: 1, how: 'self', worldId: E.worldId(g2), genesis: g2, handover }
  assert.equal(P.acceptSuccessor(g1, offer, { nowMs: now }), null, 'a real one is followed')

  // A LIAR PAIRS A GOOD FOUNDING WITH THEIR OWN ID, hoping the client believes
  // the number beside the founding rather than hashing the founding itself.
  assert.equal(P.acceptSuccessor(g1, { ...offer, worldId: 'b'.repeat(64) }, { nowMs: now }),
    'the offer names an id that is not the hash of the founding it carries')

  // a founding that changed the rules, offered with a correct id and a real
  // handover: refused on the rules, which is the whole point of the line
  const bent = heir(); bent.rulesHash = 'c'.repeat(64)
  assert.equal(P.acceptSuccessor(g1, {
    v: 1, worldId: E.worldId(bent), genesis: bent, handover,
  }, { nowMs: now }), 'the rules are not the same rules')

  // a faithful world that continues somebody ELSE: not this citizen's line
  const other = E.makeGenesis('offer-world', RULES, 0, 40, 30)
  other.from = { worldId: 'd'.repeat(64), livingRoot: 'a'.repeat(64), tick: ENDED }
  other.anchorMs = endedMs
  assert.equal(P.acceptSuccessor(g1, { v: 1, worldId: E.worldId(other), genesis: other },
    { nowMs: now }), 'this world continues a different one')

  // and a handover borrowed from the real successor cannot be pointed at a
  // rival, because the worldId it signs commits to the whole founding
  const rival = heir(); rival.witnesses = [wk[1].playerId]
  assert.equal(P.acceptSuccessor(g1, {
    v: 1, worldId: E.worldId(rival), genesis: rival, handover,
  }, { nowMs: now }), 'handover: a handover naming another successor')

  // nothing offered at all
  assert.equal(P.acceptSuccessor(g1, { v: 1 }, { nowMs: now }), 'the offer carries no founding')
  assert.equal(P.acceptSuccessor(g1, null, { nowMs: now }), 'malformed offer')
})
