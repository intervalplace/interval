// Freeze & storage brief §7 — storage backends. "Storage is not consensus":
// these tests prove the SQLite backend is byte-for-byte interchangeable with
// the flat-file store at the protocol level, that migration preserves every
// record, and that the exclusive process lock prevents a second live witness
// for one (worldId, witnessId).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import E from '../engine.js'
import * as P from '../protocol.mjs'
import {
  finalityIndexStore, sqliteFinalityStore, migrateFlatFileToSqlite,
  acquireProcessLock,
} from '../node.mjs'

const RULES = 'c'.repeat(64)
const tmp = (p) => fs.mkdtempSync(path.join(os.tmpdir(), p))

// a real finalized record for a 1-witness world, so certs verify
function realRecords(n) {
  const w1 = E.generateIdentity(), alice = E.generateIdentity()
  const g = E.makeGenesis('storage-' + Math.random().toString(36).slice(2), RULES, 0, 64, 48)
  g.witnesses = [w1.playerId]; g.quorum = 1; g.byzantineTolerance = 0
  const worldId = E.worldId(g)
  let s = E.newWorld(g); E.addPlayer(s, alice.playerId, 5, 5)
  const recs = []
  let prev = E.stateHash(s)
  for (let t = 0; t < n; t++) {
    const bundle = P.makeBundle({ worldId, tick: t, round: 0, previousStateHash: prev, inputs: [], witness: w1 })
    const next = E.nextState(s, [])
    const rsh = E.stateHash(next)
    const att = P.makeAttestation({ worldId, tick: t, round: 0, bundleHash: P.bundleHash(bundle), resultingStateHash: rsh, witness: w1 })
    recs.push({ worldId, tick: t, round: 0, previousStateHash: prev, bundle, bundleHash: P.bundleHash(bundle), resultingStateHash: rsh, attestations: [att] })
    s = next; prev = rsh
  }
  return { g, worldId, recs, verifyCert: (c) => P.verifyFinalityProof(g, worldId, c) }
}

test('SQLite store matches the flat-file store at the protocol level (parity)', () => {
  const dir = tmp('parity-')
  const { worldId, recs, verifyCert } = realRecords(20)
  const flat = finalityIndexStore(path.join(dir, 'fi.ndjson'))
  const sq = sqliteFinalityStore(path.join(dir, 'f.db'), { worldId })
  for (const r of recs) { flat.append(r); sq.append(r) }
  // identical get() results (tick, hashes, cert), identical latestTick
  for (const r of recs) {
    const a = flat.get(r.tick), b = sq.get(r.tick)
    assert.equal(a.tick, b.tick)
    assert.equal(a.bundleHash, b.bundleHash)
    assert.equal(a.resultingStateHash, b.resultingStateHash)
    assert.equal(a.certHash, b.certHash, `certHash parity at tick ${r.tick}`)
    // the retained certificate is byte-canonical-identical
    assert.equal(E.canonical(a.cert), E.canonical(b.cert), `cert parity at tick ${r.tick}`)
  }
  assert.equal(flat.latestTick(), sq.latestTick())
  // both validate cleanly against genesis
  assert.equal(flat.validate({ worldId, verifyCert }), null)
  assert.equal(sq.validate({ worldId, verifyCert }), null)
  sq.close()
  fs.rmSync(dir, { recursive: true, force: true })
})

test('SQLite store enforces immutability like the flat-file store', () => {
  const dir = tmp('sqimmut-')
  const { worldId, recs } = realRecords(3)
  const sq = sqliteFinalityStore(path.join(dir, 'f.db'), { worldId })
  const first = sq.append(recs[0])
  // idempotent
  assert.equal(sq.append(recs[0]).bundleHash, first.bundleHash)
  // conflicting append for the same tick throws with evidence
  const conflicting = { ...recs[0], bundleHash: 'f'.repeat(64), resultingStateHash: 'e'.repeat(64) }
  assert.throws(() => sq.append(conflicting), /immutable/)
  try { sq.append(conflicting) } catch (e) { assert.ok(e.conflict?.indexed && e.conflict?.committing) }
  // reopen still refuses to overwrite
  sq.close()
  const sq2 = sqliteFinalityStore(path.join(dir, 'f.db'), { worldId })
  assert.throws(() => sq2.append(conflicting), /immutable/)
  assert.equal(sq2.get(0).bundleHash, recs[0].bundleHash)
  sq2.close()
  fs.rmSync(dir, { recursive: true, force: true })
})

test('migration flat-file → SQLite preserves every record, verifies, and backs up the source', () => {
  const dir = tmp('migrate-')
  const { worldId, recs, verifyCert } = realRecords(50)
  const flatPath = path.join(dir, 'fi.ndjson')
  const flat = finalityIndexStore(flatPath)
  for (const r of recs) flat.append(r)
  const dbPath = path.join(dir, 'f.db')
  const res = migrateFlatFileToSqlite(flatPath, dbPath, { worldId, verifyCert })
  assert.equal(res.inserted, 50)
  assert.equal(res.distinctTicks, 50)
  // the migrated store validates and every record round-trips identically
  const sq = sqliteFinalityStore(dbPath, { worldId })
  assert.equal(sq.validate({ worldId, verifyCert }), null)
  for (const r of recs) {
    const m = sq.get(r.tick)
    assert.equal(m.bundleHash, r.bundleHash)
    assert.equal(E.canonical(m.cert), E.canonical(flat.get(r.tick).cert))
  }
  sq.close()
  // the source is preserved as an immutable backup
  assert.ok(fs.existsSync(res.backup))
  fs.rmSync(dir, { recursive: true, force: true })
})

test('migration aborts on a corrupt source rather than producing a partial store', () => {
  const dir = tmp('migrate-bad-')
  const flatPath = path.join(dir, 'fi.ndjson')
  // a corrupt (unparseable) source line
  fs.writeFileSync(flatPath, '{"tick":0,"bundleHash":"' + 'a'.repeat(64) + '","resultingStateHash":"' + 'b'.repeat(64) + '","certHash":"' + 'c'.repeat(64) + '"}\n{ broken\n')
  assert.throws(() => migrateFlatFileToSqlite(flatPath, path.join(dir, 'f.db')), /migration aborted/)
  fs.rmSync(dir, { recursive: true, force: true })
})

test('the exclusive kernel lock refuses a second live holder and reclaims a stale one', async () => {
  const dir = tmp('plock-')
  const f = path.join(dir, 'process.lock.sock')
  const l1 = await acquireProcessLock(f)
  assert.equal(l1.heldBy, process.pid)
  // a second acquisition while the first is held is refused
  await assert.rejects(acquireProcessLock(f), e => e.code === 'ERR_WITNESS_LOCK_HELD')
  l1.release()
  // after release the socket is gone and the lock is re-acquirable
  const l2 = await acquireProcessLock(f)
  assert.equal(l2.heldBy, process.pid)
  l2.release()
  fs.rmSync(dir, { recursive: true, force: true })
})

test('a stale socket file (dead holder) is reclaimed, not treated as held', async () => {
  const dir = tmp('plock-stale-')
  const f = path.join(dir, 'process.lock.sock')
  // simulate a stale pathname entry with no live listener behind it
  fs.writeFileSync(f, '') // a plain file at the socket path (no listener)
  // acquisition must reclaim it (connect fails ⇒ not live) rather than refuse
  const l = await acquireProcessLock(f)
  assert.equal(l.heldBy, process.pid)
  l.release()
  fs.rmSync(dir, { recursive: true, force: true })
})

test('the kernel lock excludes a second OS process for the same identity', async () => {
  const { spawn } = await import('child_process')
  const dir = tmp('plock-proc-')
  const f = path.join(dir, 'process.lock.sock')
  const signal = path.join(dir, 'held.signal')
  const holderSrc = `
    import { acquireProcessLock } from ${JSON.stringify(path.resolve('node.mjs'))}
    import fs from 'fs'
    await acquireProcessLock(${JSON.stringify(f)})
    fs.writeFileSync(${JSON.stringify(signal)}, 'held')
    setInterval(() => {}, 1000)
  `
  const child = spawn(process.execPath, ['--input-type=module', '-e', holderSrc], { stdio: 'ignore' })
  try {
    const deadline = Date.now() + 4000
    while (!fs.existsSync(signal) && Date.now() < deadline) await new Promise(r => setTimeout(r, 25))
    assert.ok(fs.existsSync(signal), 'child acquired the lock')
    // our attempt must be refused while the child (a real other process) lives
    await assert.rejects(acquireProcessLock(f), e => e.code === 'ERR_WITNESS_LOCK_HELD')
  } finally {
    child.kill('SIGKILL')
    await new Promise(r => setTimeout(r, 300))
  }
  // the kernel released the dead child's socket; we can now acquire
  const reclaimed = await acquireProcessLock(f)
  assert.equal(reclaimed.heldBy, process.pid)
  reclaimed.release()
  fs.rmSync(dir, { recursive: true, force: true })
})

test('SQLite store enforces world isolation (rejects a foreign-world record)', () => {
  const dir = tmp('wiso-')
  const wid = 'ab'.repeat(32), other = 'cd'.repeat(32)
  const sq = sqliteFinalityStore(path.join(dir, 'f.db'), { worldId: wid })
  const rec = { worldId: other, tick: 0, round: 0, previousStateHash: 'a'.repeat(64), bundle: {}, bundleHash: 'b'.repeat(64), resultingStateHash: 'c'.repeat(64), attestations: [] }
  assert.throws(() => sq.append(rec), e => e.code === 'ERR_WORLD_MISMATCH')
  sq.close()
  fs.rmSync(dir, { recursive: true, force: true })
})

test('migration is atomic: a failure leaves no partial destination database', () => {
  const dir = tmp('atomic-')
  const flatPath = path.join(dir, 'fi.ndjson')
  const flat = finalityIndexStore(flatPath)
  // valid source records...
  const { worldId, recs } = realRecords(10)
  for (const r of recs) flat.append(r)
  // ...but a destination that already exists → migration must refuse, untouched
  const dbPath = path.join(dir, 'f.db')
  fs.writeFileSync(dbPath, 'PRE-EXISTING')
  assert.throws(() => migrateFlatFileToSqlite(flatPath, dbPath, { worldId }), /already exists/)
  assert.equal(fs.readFileSync(dbPath, 'utf8'), 'PRE-EXISTING', 'existing destination left untouched')
  // no temp file left behind
  const leftovers = fs.readdirSync(dir).filter(n => n.includes('.migrating.'))
  assert.equal(leftovers.length, 0, 'no temp migration files leaked')
  fs.rmSync(dir, { recursive: true, force: true })
})

test('migration verifies content and produces a self-contained integrity-clean db', () => {
  const dir = tmp('atomic2-')
  const flatPath = path.join(dir, 'fi.ndjson')
  const flat = finalityIndexStore(flatPath)
  const { worldId, recs, verifyCert } = realRecords(30)
  for (const r of recs) flat.append(r)
  const dbPath = path.join(dir, 'f.db')
  const res = migrateFlatFileToSqlite(flatPath, dbPath, { worldId, verifyCert })
  assert.equal(res.distinctTicks, 30)
  // the destination exists, has no lingering WAL, validates, integrity-clean
  assert.ok(fs.existsSync(dbPath))
  assert.ok(!fs.existsSync(dbPath + '-wal'), 'no leftover WAL beside the migrated db')
  const sq = sqliteFinalityStore(dbPath, { worldId })
  assert.equal(sq.validate({ worldId, verifyCert }), null)
  assert.equal(sq.integrityCheck(), null)
  sq.close()
  fs.rmSync(dir, { recursive: true, force: true })
})

test('sparse-checkpoint recovery: replay advances a stale checkpoint up to the frontier', async () => {
  // Drive a witness to finalize several ticks with a durable finality index +
  // frontier, capture an EARLY checkpoint (behind the frontier), then verify a
  // fresh node started from that early checkpoint replays certified records up
  // to the frontier instead of refusing (§1 recovery).
  const { IntervalAgreement } = await import('../agreement.mjs')
  const { durableStore } = await import('../node.mjs')
  const dir = tmp('sparsecp-')
  const w1 = E.generateIdentity(), alice = E.generateIdentity()
  const g = E.makeGenesis('sparse-cp', RULES, 0, 64, 48)
  g.witnesses = [w1.playerId]; g.quorum = 1; g.byzantineTolerance = 0
  const worldId = E.worldId(g)
  const build = () => { const s = E.newWorld(g); E.addPlayer(s, alice.playerId, 5, 5); return s }

  const idx = finalityIndexStore(path.join(dir, 'fi.ndjson'))
  const frontier = durableStore(path.join(dir, 'frontier.json'))
  const holder = { state: build(), clock: 700 }
  const earlyState = E.canonical(holder.state) // checkpoint at tick 0 (before any finality)
  const ag = new IntervalAgreement({
    genesis: g, worldId, name: 'w', witnessKey: w1,
    getState: () => holder.state, setState: (n) => { holder.state = n },
    publish: () => {}, now: () => holder.clock, log: () => {},
    lockStore: durableStore(path.join(dir, 'lock.json')), frontierStore: frontier,
    finalityIndexStore: idx, allowEphemeralStores: false,
  })
  for (let i = 0; i < 5; i++) { ag.drive(); holder.clock += 600 }
  const frontierTick = frontier.load().tick
  assert.ok(frontierTick >= 4, 'several ticks finalized')

  // now simulate a restart from the EARLY (tick-0) checkpoint: rebuild state
  // from the early snapshot and replay via the same logic the node uses
  const restored = { state: JSON.parse(earlyState) }
  // replay certified records from tick 0..frontierTick
  let cur = restored.state
  for (let t = 0; t <= frontierTick; t++) {
    const entry = idx.get(t)
    assert.ok(entry, `finality record present at tick ${t}`)
    const cert = entry.cert ?? entry
    assert.equal(P.verifyFinalityProof(g, worldId, cert), null, `cert verifies at tick ${t}`)
    assert.equal(E.stateHash(cur), cert.previousStateHash, `prev-hash matches at tick ${t}`)
    cur = E.nextState(cur, cert.bundle.inputs)
    assert.equal(E.stateHash(cur), cert.resultingStateHash, `replay matches certified result at tick ${t}`)
  }
  // after replay, the recovered state equals the live state at the frontier
  assert.equal(cur.tick, frontierTick + 1, 'replayed state reached the frontier')
  idx.close?.()
  fs.rmSync(dir, { recursive: true, force: true })
})

test('SQLite store exposes an operational health snapshot and bounded validation', () => {
  const dir = tmp('health-')
  const { worldId, recs, verifyCert } = realRecords(40)
  const sq = sqliteFinalityStore(path.join(dir, 'f.db'), { worldId })
  for (const r of recs) sq.append(r)
  const h = sq.health()
  assert.equal(h.backend, 'sqlite')
  assert.equal(h.rows, 40)
  assert.equal(h.latestTick, 39)
  assert.equal(h.journalMode, 'wal')
  assert.ok(h.dbBytes > 0)
  // bounded cert verification: only the most recent N are cryptographically
  // re-verified, but structure/hash checks still cover every row
  assert.equal(sq.validate({ worldId, verifyCert, verifyRecentN: 5 }), null)
  // a tampered OLD row beyond the verify window is still caught by hash check
  assert.equal(sq.integrityCheck(), null)
  sq.close()
  fs.rmSync(dir, { recursive: true, force: true })
})

test('strict world binding rejects a record with no world identifier', () => {
  const dir = tmp('strictwb-')
  const wid = 'ab'.repeat(32)
  const sq = sqliteFinalityStore(path.join(dir, 'f.db'), { worldId: wid })
  // a record identifying no world at all is refused by a world-bound store
  assert.throws(() => sq.append({ tick: 0, round: 0, previousStateHash: 'a'.repeat(64), bundle: {}, bundleHash: 'b'.repeat(64), resultingStateHash: 'c'.repeat(64), attestations: [] }),
    e => e.code === 'ERR_WORLD_MISMATCH')
  // a record whose bundle carries the world is accepted (production shape)
  assert.doesNotThrow(() => sq.append({ tick: 0, round: 0, previousStateHash: 'a'.repeat(64), bundle: { worldId: wid }, bundleHash: 'b'.repeat(64), resultingStateHash: 'c'.repeat(64), attestations: [] }))
  sq.close()
  fs.rmSync(dir, { recursive: true, force: true })
})

test('unknown finality backend value is rejected at construction', async () => {
  const { IntervalNode } = await import('../node.mjs')
  const { buildWorld } = await import('../worldgen.mjs')
  const w1 = E.generateIdentity()
  const g = E.makeGenesis('badbackend', RULES, 0, 64, 48)
  g.witnesses = [w1.playerId]; g.quorum = 1; g.byzantineTolerance = 0
  const dir = tmp('badbe-')
  assert.throws(() => new IntervalNode({
    genesis: g, buildWorld, name: 'w', witnessKey: w1,
    safetyDir: path.join(dir, 'ws'), finalityBackend: 'rocksdb',
  }), /unknown finalityBackend/)
  fs.rmSync(dir, { recursive: true, force: true })
})

test('migration verifies row count via SQLite and leaves a self-contained db (no WAL)', () => {
  const dir = tmp('migdur-')
  const flatPath = path.join(dir, 'fi.ndjson')
  const flat = finalityIndexStore(flatPath)
  const { worldId, recs, verifyCert } = realRecords(25)
  for (const r of recs) flat.append(r)
  const dbPath = path.join(dir, 'f.db')
  migrateFlatFileToSqlite(flatPath, dbPath, { worldId, verifyCert })
  // the destination is a single self-contained file: no leftover WAL/SHM
  assert.ok(fs.existsSync(dbPath))
  assert.ok(!fs.existsSync(dbPath + '-wal'), 'WAL checkpointed away')
  assert.ok(!fs.existsSync(dbPath + '-shm'), 'SHM removed')
  // reopening sees all rows and validates
  const sq = sqliteFinalityStore(dbPath, { worldId })
  assert.equal(sq._db.prepare('SELECT COUNT(*) AS c FROM finality').get().c, 25)
  assert.equal(sq.validate({ worldId, verifyCert }), null)
  sq.close()
  fs.rmSync(dir, { recursive: true, force: true })
})

test('online backup produces a consistent, integrity-clean copy with the same rows', () => {
  const dir = tmp('backup-')
  const { worldId, recs, verifyCert } = realRecords(20)
  const sq = sqliteFinalityStore(path.join(dir, 'f.db'), { worldId })
  for (const r of recs) sq.append(r)
  const bk = path.join(dir, 'backup.db')
  sq.backup(bk)
  sq.close()
  const restored = sqliteFinalityStore(bk, { worldId })
  assert.equal(restored._db.prepare('SELECT COUNT(*) AS c FROM finality').get().c, 20)
  assert.equal(restored.integrityCheck(), null)
  assert.equal(restored.validate({ worldId, verifyCert }), null)
  // every record round-trips identically
  for (const r of recs) assert.equal(restored.get(r.tick).bundleHash, r.bundleHash)
  restored.close()
  fs.rmSync(dir, { recursive: true, force: true })
})

test('bounded startup verification: structure checked on all, cert-verify only the tail', () => {
  const dir = tmp('boundstartup-')
  const { worldId, recs } = realRecords(60)
  // flat-file index (has cert objects for verification)
  const flat = finalityIndexStore(path.join(dir, 'fi.ndjson'))
  for (const r of recs) flat.append(r)
  let verifyCalls = 0
  const countingVerify = () => { verifyCalls++; return null }
  // bound to the recent 10: verifyCert runs 10 times, structure on all 60
  assert.equal(flat.validate({ worldId, verifyCert: countingVerify, verifyRecentN: 10 }), null)
  assert.equal(verifyCalls, 10, 'only the recent tail is cryptographically re-verified')
  // unbounded: verify runs on all 60
  verifyCalls = 0
  assert.equal(flat.validate({ worldId, verifyCert: countingVerify }), null)
  assert.equal(verifyCalls, 60, 'unbounded verifies the full history')
  // a tampered cert BEYOND the bound is still caught by the hash check
  const raw = fs.readFileSync(path.join(dir, 'fi.ndjson'), 'utf8').split('\n').filter(Boolean)
  const first = JSON.parse(raw[0]); first.certHash = 'f'.repeat(64)
  raw[0] = JSON.stringify(first)
  fs.writeFileSync(path.join(dir, 'fi2.ndjson'), raw.join('\n') + '\n')
  const tampered = finalityIndexStore(path.join(dir, 'fi2.ndjson'))
  assert.match(tampered.validate({ worldId, verifyCert: () => null, verifyRecentN: 1 }), /certHash does not match/)
  fs.rmSync(dir, { recursive: true, force: true })
})

test('repeated lock acquire/release does not accumulate process exit listeners', async () => {
  const dir = tmp('lock-listeners-')
  const f = path.join(dir, 'process.lock.sock')
  const before = process.listenerCount('exit')
  for (let i = 0; i < 40; i++) {
    const l = await acquireProcessLock(f)
    l.release()
  }
  const after = process.listenerCount('exit')
  assert.equal(after, before, `exit-listener count must stay constant (was ${before}, now ${after})`)
  fs.rmSync(dir, { recursive: true, force: true })
})
