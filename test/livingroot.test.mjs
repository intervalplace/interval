// §5g-ii: THE ROOT OVER THE LIVING.
//
// The archive root exists so archived citizens cost the tick nothing: the
// engine never holds that tree, because whoever wants something out of it
// brings the path and the root judges it. The LIVING had no root at all, and
// that was the hole under every durability argument this project makes.
//
// A state is hashed whole by `stateHash`, which yields no inclusion proof. So
// a citizen could not demonstrate what they were without somebody producing
// the ENTIRE state, which puts a world's continuity back on whoever still
// holds a full checkpoint. That does not scale -- at a million citizens it is
// hundreds of megabytes everybody must keep and keep current -- and it is
// exactly the dependency the archive root was invented to remove.
//
// With a root over the living, every citizen at every interval has a proof of
// what they were: their own record, and a few hundred bytes of path. They keep
// it themselves. A world that dies suddenly costs nobody their life, and a
// citizen can walk into a successor years later carrying their own evidence
// with nobody holding anything on their behalf.
//
// THE TWO THINGS THESE TESTS HOLD. That a root BUILT from a state and a path
// FOLDED against it agree -- a root built one way and proved another proves
// nothing. And that a citizen cannot edit their own file, which is the whole
// question a per-citizen file raises.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import E from '../engine.js'

const RULES = 'f'.repeat(64)

function worldOf(n) {
  const g = E.makeGenesis('livingroot', RULES, 0, 40, 30)
  const s = E.newWorld(g)
  const who = []
  for (let i = 0; i < n; i++) {
    const w = E.generateIdentity()
    E.addPlayer(s, w.playerId, 5 + (i % 20), 5 + Math.floor(i / 20))
    who.push(w)
  }
  return { g, s, who }
}

test('an empty world has no living root at all', () => {
  const g = E.makeGenesis('livingroot-empty', RULES, 0, 40, 30)
  const s = E.newWorld(g)
  assert.equal(E.livingRootOf(s), E.EMPTY_ROOT,
    'no occupants is the empty root, not a hash of nothing in particular')
  const after = E.nextState(s, [])
  assert.equal(after.livingRoot, undefined,
    'and the empty root is not written into the state, as the archive does not')
})

test('every citizen can prove themselves against the root', () => {
  // The headline property. If this fails for even one of them the root is
  // useless, because the point is that nobody needs anybody else's help.
  for (const n of [1, 2, 3, 7, 40]) {
    const { s, who } = worldOf(n)
    const root = E.livingRootOf(s)
    for (const w of who) {
      const path = E.livingPathOf(s, w.playerId)
      assert.ok(path, `citizen should have a path in a world of ${n}`)
      assert.ok(E.provesLiving(root, w.playerId, s.players[w.playerId], path),
        `a citizen's own path must prove them, in a world of ${n}`)
    }
  }
})

test('a citizen cannot edit their own file', () => {
  // The question a per-citizen file always raises. The record hashes into the
  // leaf, the leaf folds up the path, and the fold has to arrive at a root the
  // world already certified.
  const { s, who } = worldOf(6)
  const root = E.livingRootOf(s)
  const me = who[0].playerId
  const path = E.livingPathOf(s, me)
  const real = s.players[me]
  assert.ok(E.provesLiving(root, me, real, path), 'the true record proves')

  for (const [what, edit] of [
    ['a level', (r) => { r.skills.woodcraft = 9_000_000 }],
    ['money', (r) => { r.gold = 999_999 }],
    ['a calling', (r) => { r.calling = 'forester' }],
    ['an item', (r) => { r.inventory[0] = { item: 'dragonbow', qty: 1 } }],
    ['a death tally', (r) => { r.deaths = 0 }],
  ]) {
    const forged = JSON.parse(JSON.stringify(real))
    edit(forged)
    assert.ok(!E.provesLiving(root, me, forged, path),
      `giving yourself ${what} must not prove against the root`)
  }
})

test('and cannot borrow somebody else\'s path or identity', () => {
  const { s, who } = worldOf(8)
  const root = E.livingRootOf(s)
  const a = who[0].playerId, b = who[1].playerId
  const pathA = E.livingPathOf(s, a)
  assert.ok(!E.provesLiving(root, b, s.players[b], pathA),
    'another citizen\'s path must not prove you')
  assert.ok(!E.provesLiving(root, a, s.players[b], pathA),
    'nor may you claim their record under your own id')
})

test('the tick writes the root, and the state validates', () => {
  const { s } = worldOf(5)
  const after = E.nextState(s, [])
  assert.ok(typeof after.livingRoot === 'string' && /^[0-9a-f]{64}$/.test(after.livingRoot),
    'a tick with citizens in it should leave a root')
  assert.equal(E.validateState(after), null)
  // and it is the root of what the interval actually left behind
  assert.equal(after.livingRoot, E.livingRootOf(after),
    'the written root must be the root of the settled state')
})

test('the root moves when a citizen does, and not otherwise', () => {
  const { g, s, who } = worldOf(4)
  const a = E.nextState(s, [])
  const before = a.livingRoot
  // nothing happens: the ledger and the sweeps may still touch people, so this
  // asserts only that the root is a FUNCTION of the state, not that it is
  // frozen.
  assert.equal(E.livingRootOf(a), before)
  // somebody gains a level and the root must move
  const b = JSON.parse(JSON.stringify(a))
  b.players[who[0].playerId].skills.woodcraft += 500
  assert.notEqual(E.livingRootOf(b), before,
    'a changed citizen must change the root, or the root proves nothing')
})

test('a path stays small as the world grows', () => {
  // The reason this scales: almost every level of a sparse tree is empty, so a
  // proof is a few hundred bytes whatever the population. This is the answer to
  // "everybody has to carry the same file and it gets big".
  const sizes = []
  for (const n of [2, 40, 400]) {
    const { s, who } = worldOf(n)
    const path = E.livingPathOf(s, who[0].playerId)
    sizes.push([n, JSON.stringify(path).length, path.sibs.length])
  }
  for (const [n, bytes, levels] of sizes) {
    assert.ok(bytes < 3000,
      `a path in a world of ${n} should be a few hundred bytes, not ${bytes}`)
    assert.ok(levels <= 64)
  }
  // and it grows with the LOG of the population, not the population
  assert.ok(sizes[2][2] < sizes[0][2] + 20,
    'a two-hundred-fold larger world must not need a proportionally larger proof')
})

// §5g-ii: THE BUNDLE A CLIENT KEEPS ON DISK.
//
// A player's client used to keep exactly one thing: the key. So every copy of
// the game was a client and none was an archive, and a world's survival rested
// on somebody's server. `keepProof` in the bridge now writes the citizen's own
// record, their path, the root it folds to and the genesis, beside the key.
//
// This holds the SHAPE of that bundle: that it verifies on its own, that it is
// small, and that a doctored one does not.
test('the bundle a client keeps is self-sufficient and verifies', () => {
  const { g, s, who } = worldOf(12)
  const after = E.nextState(s, [])
  const me = who[0].playerId
  // exactly the fields `keepProof` writes
  const bundle = {
    v: 1,
    worldId: E.worldId(g),
    tick: after.tick,
    livingRoot: after.livingRoot,
    playerId: me,
    record: after.players[me],
    path: E.livingPathOf(after, me),
    genesis: g,
  }
  // A STRANGER CAN CHECK IT with nothing else in hand.
  const round = JSON.parse(JSON.stringify(bundle))
  assert.ok(E.provesLiving(round.livingRoot, round.playerId, round.record, round.path),
    'the bundle must verify after a round trip through JSON, by itself')
  // and it carries enough to identify the line it came from
  assert.equal(round.worldId, E.worldId(round.genesis))
  assert.ok(round.genesis.rulesHash && round.genesis.genesisSeed && round.genesis.worldGenerator,
    'the genesis must name the rules, the seed and the generator, or a successor '
    + 'cannot be founded from this file alone')

  // SMALL ENOUGH TO KEEP, AND TO HAND TO SOMEBODY.
  const bytes = JSON.stringify(round).length
  assert.ok(bytes < 60_000, 'a citizen\'s whole proved life should be kilobytes, not ' + bytes)

  // AND A DOCTORED ONE DOES NOT PASS. The point of handing a player their own
  // data is that the root means they cannot be trusted with it and it does not
  // matter.
  const forged = JSON.parse(JSON.stringify(round))
  forged.record.gold = (forged.record.gold ?? 0) + 1_000_000
  assert.ok(!E.provesLiving(forged.livingRoot, forged.playerId, forged.record, forged.path),
    'a citizen who edits their own bundle must fail against the root')
})

// ---------- the seal: witnesses sign the root ----------
//
// Everything above proves the root is CORRECT. None of it proves it was ever
// AGREED, and a correct root nobody vouched for is worth nothing to a citizen
// holding a proof after the world has stopped: they can show that their record
// folds to R, and not that R was real.
//
// `resultingStateHash` covers the root transitively, since the root is a field
// of the state, but a flat hash over a whole state yields no inclusion proof,
// so confirming it meant producing the state. That is the dependency the root
// removes. So the root is signed on its own, and these tests hold that line.

import * as P from '../protocol.mjs'
import { IntervalAgreement } from '../agreement.mjs'

const s1 = E.generateIdentity(), s2 = E.generateIdentity(), s3 = E.generateIdentity()
const resident = E.generateIdentity()

function sealWorld() {
  const genesis = E.makeGenesis('seal-seed', RULES, 0, 40, 30)
  genesis.witnesses = [s1, s2, s3].map(w => w.playerId)
  genesis.quorum = 2
  genesis.byzantineTolerance = 0
  const worldId = E.worldId(genesis)
  const build = () => {
    const s = E.newWorld(genesis)
    E.addPlayer(s, resident.playerId, 5, 5)
    return s
  }
  return { genesis, worldId, build }
}

function sealWitness(world, witnessKey) {
  const holder = { state: world.build(), finalized: [] }
  const sink = []
  const clock = { t: 0 }
  const ag = new IntervalAgreement({
    genesis: world.genesis, worldId: world.worldId, name: 'seal', witnessKey,
    getState: () => holder.state,
    setState: (n) => { holder.state = n },
    publish: (kind, obj) => sink.push({ kind, obj }),
    onFinalized: () => {},
    now: () => clock.t, allowEphemeralStores: true,
    log: () => {},
  })
  ag._holder = holder; ag._sink = sink; ag._clock = clock
  return ag
}

// one tick, two honest co-witnesses, and the certificate that comes out
function oneSealedTick() {
  const world = sealWorld()
  const w = sealWitness(world, s1)
  w._clock.t = E.TICK_MS + 100
  const prev = w.prevHash
  const proposer = [s1, s2, s3].find(k => k.playerId === P.proposerFor(world.genesis, world.worldId, prev, 0, 0))
  const bundle = P.makeBundle({ worldId: world.worldId, tick: 0, round: 0, previousStateHash: prev, inputs: [], witness: proposer })
  w.onBundle(bundle)
  const bh = P.bundleHash(bundle)
  const after = E.nextState(world.build(), [])
  const root = after.livingRoot ?? null
  const others = [s2, s3].filter(k => k.playerId !== s1.playerId).map(k => P.makeAttestation({
    worldId: world.worldId, tick: 0, round: 0, bundleHash: bh,
    resultingStateHash: E.stateHash(after), livingRoot: root, witness: k,
  }))
  for (const a of others) w.onAttestation(a)
  const cert = w._sink.filter(m => m.kind === 'finality').pop()?.obj
  return { world, w, bh, root, cert, after, others }
}

test('a witness signs the root over the living, and the signature covers it', () => {
  const { root, cert } = oneSealedTick()
  assert.ok(root && /^[0-9a-f]{64}$/.test(root), 'a world with a citizen in it has a root')
  assert.ok(cert, 'the tick finalized')
  assert.equal(cert.livingRoot, root, 'the certificate carries the root')
  for (const a of cert.attestations) {
    assert.equal(a.livingRoot, root, 'every signature in the quorum vouches for it')
    assert.ok(P.verifyAttestationSig(a))
    // the whole point: move the root and the signature dies. So a citizen's
    // proof can be checked against the founding's witness keys alone, for
    // ever, with no state and nobody's cooperation.
    const moved = { ...a, livingRoot: 'a'.repeat(64) }
    assert.ok(!P.verifyAttestationSig(moved), 'the root is inside what was signed')
    const dropped = { ...a }; delete dropped.livingRoot
    assert.ok(!P.verifyAttestationSig(dropped), 'and it cannot be dropped either')
  }
})

test('a relay cannot swap the root on a certificate it passes along', () => {
  const { world, cert } = oneSealedTick()
  assert.equal(P.verifyFinalityProof(world.genesis, world.worldId, cert), null, 'the real certificate verifies')
  const forged = JSON.parse(JSON.stringify(cert))
  forged.livingRoot = 'b'.repeat(64)
  assert.equal(P.verifyFinalityProof(world.genesis, world.worldId, forged),
    'attestation for a different living root',
    'the record is checked against what the witnesses actually signed')
  const stripped = JSON.parse(JSON.stringify(cert))
  delete stripped.livingRoot
  assert.equal(P.verifyFinalityProof(world.genesis, world.worldId, stripped),
    'attestation for a different living root',
    'and the field cannot simply be deleted')
  const junk = JSON.parse(JSON.stringify(cert))
  junk.livingRoot = 'not a hash'
  assert.equal(P.verifyFinalityProof(world.genesis, world.worldId, junk), 'malformed living root')
})

test('an attestation that vouches for a different root is not counted into the quorum', () => {
  const world = sealWorld()
  const w = sealWitness(world, s1)
  w._clock.t = E.TICK_MS + 100
  const prev = w.prevHash
  const proposer = [s1, s2, s3].find(k => k.playerId === P.proposerFor(world.genesis, world.worldId, prev, 0, 0))
  const bundle = P.makeBundle({ worldId: world.worldId, tick: 0, round: 0, previousStateHash: prev, inputs: [], witness: proposer })
  w.onBundle(bundle)
  const after = E.nextState(world.build(), [])
  // right result, wrong root: an old build, or a node whose engine computes a
  // different tree. It is not evidence of a fork (the result hash agrees), so
  // it must not halt the world -- it simply does not count.
  for (const k of [s2, s3]) w.onAttestation(P.makeAttestation({
    worldId: world.worldId, tick: 0, round: 0, bundleHash: P.bundleHash(bundle),
    resultingStateHash: E.stateHash(after), livingRoot: 'c'.repeat(64), witness: k,
  }))
  assert.equal(w.halted, false, 'no halt: the result hashes agree')
  assert.equal(w._holder.state.tick, 0, 'and no certificate either')
  assert.equal(w._sink.filter(m => m.kind === 'finality').length, 0)
})

test('a world with nobody in it signs a null root rather than inventing one', () => {
  const genesis = E.makeGenesis('seal-empty', RULES, 0, 40, 30)
  genesis.witnesses = [s1, s2, s3].map(w => w.playerId)
  genesis.quorum = 2
  genesis.byzantineTolerance = 0
  const s = E.nextState(E.newWorld(genesis), [])
  assert.equal(s.livingRoot, undefined, 'no citizens, no root')
  const a = P.makeAttestation({
    worldId: E.worldId(genesis), tick: 0, round: 0, bundleHash: 'd'.repeat(64),
    resultingStateHash: E.stateHash(s), witness: s1,
  })
  assert.equal(a.livingRoot, null, 'null is a real value and is signed as one')
  assert.ok(P.verifyAttestationSig(a))
})

// ---------- the seal on its own, and the whole sentence ----------

test('a seal verifies against the founding and nothing else', () => {
  const { world, cert, root } = oneSealedTick()
  const seal = P.makeSeal(world.worldId, cert)
  assert.equal(seal.tick, cert.tick + 1, 'a seal names the interval of the STATE, not of the bundle')
  assert.equal(seal.livingRoot, root)
  assert.equal(P.verifyLivingSeal(world.genesis, world.worldId, seal), null)

  const bend = (f) => { const x = JSON.parse(JSON.stringify(seal)); f(x); return P.verifyLivingSeal(world.genesis, world.worldId, x) }
  assert.equal(bend(x => { x.worldId = 'z'.repeat(64) }), 'seal is for another world')
  assert.equal(bend(x => { x.livingRoot = 'e'.repeat(64) }), 'attestation vouches for a different root')
  assert.equal(bend(x => { x.tick += 1 }), 'attestation for another interval')
  assert.equal(bend(x => { x.attestations = [x.attestations[0]] }), 'short of a quorum')
  assert.equal(bend(x => { x.attestations = [x.attestations[0], x.attestations[0]] }), 'the same witness counted twice')
  assert.equal(bend(x => { x.attestations[1].round += 1 }), 'seal mixes rounds')
  assert.equal(bend(x => { x.attestations[1].v = 2 }), 'attestation wrong protocol version')
  assert.equal(bend(x => { x.attestations[1].sig = '0'.repeat(128) }), 'bad attestation signature')

  // a quorum of strangers is not a quorum
  const stranger = E.generateIdentity()
  const forged = {
    worldId: world.worldId, tick: seal.tick, livingRoot: seal.livingRoot,
    attestations: seal.attestations.map(a => P.makeAttestation({
      worldId: a.worldId, tick: a.tick, round: a.round, bundleHash: a.bundleHash,
      resultingStateHash: a.resultingStateHash, livingRoot: a.livingRoot, witness: stranger,
    })),
  }
  assert.ok(/not a witness|counted twice/.test(P.verifyLivingSeal(world.genesis, world.worldId, forged)))
})

test('a kept proof is one sentence, checked end to end', () => {
  const { world, cert, root, after } = oneSealedTick()
  const path = E.livingPathOf(after, resident.playerId)
  const proof = {
    v: 2,
    worldId: world.worldId,
    tick: cert.tick + 1,
    livingRoot: root,
    playerId: resident.playerId,
    record: after.players[resident.playerId],
    path,
    seal: P.makeSeal(world.worldId, cert),
    genesis: world.genesis,
  }
  assert.equal(P.verifyKeptProof(proof), null, 'the real thing verifies with no state in hand')

  const bend = (f) => { const x = JSON.parse(JSON.stringify(proof)); f(x); return P.verifyKeptProof(x) }
  assert.equal(bend(x => { x.seal = null }), 'unsealed: no witness vouched for this root')
  assert.equal(bend(x => { x.record.gold = (x.record.gold ?? 0) + 1_000_000 }),
    'the record does not fold to the sealed root', 'giving yourself money breaks the fold')
  assert.equal(bend(x => { x.livingRoot = 'f'.repeat(64) }), 'the seal is for a different root')
  assert.equal(bend(x => { x.genesis.quorum = 1 }), 'the founding does not hash to the named world',
    'and the founding cannot be loosened, because the worldId commits to it')
  assert.equal(bend(x => { x.tick += 1 }), 'the seal is for a different interval')
})
