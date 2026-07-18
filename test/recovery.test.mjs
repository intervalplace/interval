// Rev4 brief, Priority 6 — recovery-safety failure injection.
// A safety record that cannot be READ is trouble, not absence.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import E from '../engine.js'
import * as P from '../protocol.mjs'
import { IntervalAgreement, FRONTIER_FORMAT, LOCK_FORMAT, ephemeralFinalityIndex } from '../agreement.mjs'
import { IntervalNode, durableStore, fsyncDir } from '../node.mjs'
import { buildWorld } from '../worldgen.mjs'

const RULES = 'c'.repeat(64)
const w1 = E.generateIdentity()
const alice = E.generateIdentity()

function makeWorld() {
  const genesis = E.makeGenesis('recovery-seed', RULES, 0, 40, 30)
  genesis.witnesses = [w1.playerId]
  genesis.quorum = 1; genesis.byzantineTolerance = 0
  return { genesis, worldId: E.worldId(genesis) }
}
const build = (world) => { const s = E.newWorld(world.genesis); E.addPlayer(s, alice.playerId, 5, 5); return s }
const mk = (world, holder, extra = {}) => new IntervalAgreement({
  genesis: world.genesis, worldId: world.worldId, name: 't', witnessKey: w1,
  getState: () => holder.state, setState: (n) => { holder.state = n },
  publish: () => {}, now: () => holder.clock ?? 0, log: () => {},
  allowEphemeralStores: true, ...extra,
})

test('durableStore.load fails CLOSED: only a missing file is absence', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'interval-store-'))
  const f = (n) => path.join(dir, n)
  // missing → null (a fresh boot is not an error)
  assert.equal(durableStore(f('missing.json')).load(), null)
  // corrupt JSON → throw, file preserved
  fs.writeFileSync(f('corrupt.json'), '{"tick": 5, "wor')
  assert.throws(() => durableStore(f('corrupt.json')).load(), /corrupt.*preserve and inspect/s)
  assert.ok(fs.existsSync(f('corrupt.json')), 'the evidence is preserved')
  // empty file → throw (a truncated write is not "no record")
  fs.writeFileSync(f('empty.json'), '')
  assert.throws(() => durableStore(f('empty.json')).load(), /corrupt/)
  // truncated valid-prefix JSON → throw
  fs.writeFileSync(f('trunc.json'), JSON.stringify({ format: FRONTIER_FORMAT, tick: 9 }).slice(0, 20))
  assert.throws(() => durableStore(f('trunc.json')).load(), /corrupt/)
  // a directory where a file should be → throw, not null
  fs.mkdirSync(f('dirfile.json'))
  assert.throws(() => durableStore(f('dirfile.json')).load(), /unreadable/)
  // permission failure → throw (root ignores modes; skip if privileged)
  fs.writeFileSync(f('secret.json'), '{}', { mode: 0o000 })
  let denied = false
  try { fs.readFileSync(f('secret.json')) } catch { denied = true }
  if (denied) assert.throws(() => durableStore(f('secret.json')).load(), /unreadable/)
  // round-trip still works
  durableStore(f('good.json')).save({ format: FRONTIER_FORMAT, tick: 1 })
  assert.equal(durableStore(f('good.json')).load().tick, 1)
  fs.rmSync(dir, { recursive: true, force: true })
})

test('a witness with a corrupt lock or frontier file REFUSES startup, preserving the file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'interval-corrupt-'))
  const world = makeWorld()
  // corrupt lock file
  fs.writeFileSync(path.join(dir, 'w.lock'), 'not json at all')
  assert.throws(() => mk(world, { state: build(world) }, {
    lockStore: durableStore(path.join(dir, 'w.lock')),
    frontierStore: durableStore(path.join(dir, 'w.frontier')),
    finalityIndexStore: ephemeralFinalityIndex(),
    allowEphemeralStores: false,
  }), /w\.lock is corrupt/)
  assert.ok(fs.existsSync(path.join(dir, 'w.lock')))
  // corrupt frontier file (lock now absent)
  fs.rmSync(path.join(dir, 'w.lock'))
  fs.writeFileSync(path.join(dir, 'w.frontier'), '{broken')
  assert.throws(() => mk(world, { state: build(world) }, {
    lockStore: durableStore(path.join(dir, 'w.lock')),
    frontierStore: durableStore(path.join(dir, 'w.frontier')),
    finalityIndexStore: ephemeralFinalityIndex(),
    allowEphemeralStores: false,
  }), /w\.frontier is corrupt/)
  // unversioned (legacy/hand-made) records are malformed, not guessed at
  fs.writeFileSync(path.join(dir, 'w.frontier'), JSON.stringify({ worldId: world.worldId, tick: 3, resultingStateHash: 'a'.repeat(64) }))
  assert.throws(() => mk(world, { state: build(world) }, {
    lockStore: durableStore(path.join(dir, 'w.lock')),
    frontierStore: durableStore(path.join(dir, 'w.frontier')),
    finalityIndexStore: ephemeralFinalityIndex(),
    allowEphemeralStores: false,
  }), /stored frontier is malformed.*unknown format/)
  fs.rmSync(path.join(dir, 'w.frontier'))
  fs.writeFileSync(path.join(dir, 'w.lock'), JSON.stringify({ worldId: world.worldId, tick: 0, bundleHash: 'a'.repeat(64) }))
  assert.throws(() => mk(world, { state: build(world) }, {
    lockStore: durableStore(path.join(dir, 'w.lock')),
    frontierStore: durableStore(path.join(dir, 'w.frontier')),
    finalityIndexStore: ephemeralFinalityIndex(),
    allowEphemeralStores: false,
  }), /stored vote lock is malformed.*unknown format/)
  fs.rmSync(dir, { recursive: true, force: true })
})

test('a production witness REQUIRES all three durable stores; the testing flag is explicit', () => {
  const world = makeWorld()
  assert.throws(() => new IntervalAgreement({
    genesis: world.genesis, worldId: world.worldId, witnessKey: w1,
    getState: () => build(world), setState: () => {}, publish: () => {},
  }), /requires durable lockStore, frontierStore, AND finalityIndexStore/)
  // lock + frontier but no index is not enough: history is a safety record
  assert.throws(() => new IntervalAgreement({
    genesis: world.genesis, worldId: world.worldId, witnessKey: w1,
    lockStore: { save: () => {}, load: () => null },
    frontierStore: { save: () => {}, load: () => null },
    getState: () => build(world), setState: () => {}, publish: () => {},
  }), /finalityIndexStore/)
  // observers need none; the flag admits tests
  assert.ok(mk(world, { state: build(world) }, { witnessKey: null, allowEphemeralStores: false }))
  assert.ok(mk(world, { state: build(world) }))
})

test('directory fsync is strict for consensus records, best-effort otherwise', () => {
  assert.throws(() => fsyncDir('/definitely/not/a/dir', { strict: true }), /directory fsync failed/)
  assert.doesNotThrow(() => fsyncDir('/definitely/not/a/dir'))
})

test('a witness with an INVALID checkpoint refuses startup instead of recreating genesis', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'interval-cp-'))
  // this test goes through the real worldgen, which enforces its 64x48 floor
  const genesis = E.makeGenesis('recovery-cp-seed', RULES, 0, 64, 48)
  genesis.witnesses = [w1.playerId]; genesis.quorum = 1; genesis.byzantineTolerance = 0
  const world = { genesis, worldId: E.worldId(genesis) }
  const cpFile = path.join(dir, 'cp.json')
  fs.writeFileSync(cpFile, '{"formatVersion":3,"garbage":true')
  assert.throws(() => new IntervalNode({
    genesis: world.genesis, buildWorld, name: 'w', witnessKey: w1,
    checkpointFile: cpFile, lockFile: path.join(dir, 'w.lock'), 
  }), /witness checkpoint .* is invalid.*refusing to recreate/s)
  assert.ok(fs.existsSync(cpFile), 'the invalid checkpoint is preserved for inspection')
  // an OBSERVER with the same bad checkpoint founds fresh and will re-sync
  const obs = new IntervalNode({ genesis: world.genesis, buildWorld, name: 'o', checkpointFile: cpFile })
  assert.equal(obs.state.tick, 0)
  fs.rmSync(dir, { recursive: true, force: true })
})

test('recovery AHEAD of the frontier requires a certified proof', () => {
  const world = makeWorld()
  // run a solo witness forward, but freeze the durable frontier at tick 0
  let first = null
  const stickyFrontier = { save: (f) => { if (!first) first = JSON.parse(JSON.stringify(f)) }, load: () => first }
  const h = { state: build(world), clock: 700 }
  const ag = mk(world, h, { frontierStore: stickyFrontier })
  ag.drive()                       // tick 0 finalized; frontier recorded at 0
  h.clock = 1300; ag.drive()       // tick 1 finalized; frontier STAYS at 0
  h.clock = 1900; ag.drive()       // tick 2 finalized
  assert.equal(h.state.tick, 3)
  assert.equal(first.tick, 0)
  const proof = ag.finalizedLog.get(2)
  // restart at tick 3 with the frontier at 0: refused without a proof…
  assert.throws(() => mk(world, { state: h.state, clock: 2000 }, { frontierStore: stickyFrontier }),
    /ahead of the frontier.*without a valid certified recovery path/s)
  // …refused with the WRONG proof…
  assert.throws(() => mk(world, { state: h.state, clock: 2000 }, { frontierStore: stickyFrontier, recoveryProof: ag.finalizedLog.get(1) }),
    /ahead of the frontier/)
  // …and admitted with the proof that certifies exactly this state
  const ok = mk(world, { state: h.state, clock: 2000 }, { frontierStore: stickyFrontier, recoveryProof: proof })
  assert.equal(ok.frontier.tick, 0)
})

test('failure AFTER frontier persistence halts forward: the frontier is never rolled back', () => {
  const world = makeWorld()
  let frontierMem = null
  const frontierStore = { save: (f) => { frontierMem = JSON.parse(JSON.stringify(f)) }, load: () => frontierMem }
  // (a) setState itself fails
  const hA = { state: build(world), clock: 700 }
  const agA = mk(world, hA, {
    frontierStore,
    setState: () => { throw new Error('disk-backed state store exploded') },
  })
  agA.drive()
  assert.equal(agA.halted, true)
  assert.match(agA.haltReason, /state adoption failed after the frontier was persisted/)
  assert.equal(frontierMem.tick, 0, 'the frontier STANDS')
  assert.equal(frontierMem.format, FRONTIER_FORMAT)
  // (b) the post-finality callback fails: state stands, node halts forward
  frontierMem = null
  const hB = { state: build(world), clock: 700 }
  const agB = mk(world, hB, {
    frontierStore,
    onFinalized: () => { throw new Error('checkpoint writer exploded') },
  })
  agB.drive()
  assert.equal(agB.halted, true)
  assert.match(agB.haltReason, /post-finality callback failed/)
  assert.equal(hB.state.tick, 1, 'state adoption completed before the callback')
  assert.equal(frontierMem.tick, 0, 'frontier kept — recovery is a certified checkpoint, never a rollback')
})
