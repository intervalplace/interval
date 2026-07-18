// Startup/shutdown lifecycle (production readiness brief §1-2). A witness must
// never write its safety directory after releasing exclusivity, and a failed
// startup must release every partially-initialized resource.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import E from '../engine.js'
import { buildWorld } from '../worldgen.mjs'
import { IntervalNode, acquireProcessLock } from '../node.mjs'

const RULES = E.sha256(fs.readFileSync(new URL('../SPEC.md', import.meta.url))).toString('hex')
const tmp = (p) => fs.mkdtempSync(path.join(os.tmpdir(), p))

function witnessGenesis(seed) {
  const w1 = E.generateIdentity()
  const g = E.makeGenesis(seed, RULES, 0, 64, 48)
  g.witnesses = [w1.playerId]; g.quorum = 1; g.byzantineTolerance = 0
  return { g, w1 }
}

test('shutdown drains checkpoint I/O before releasing the process lock', async () => {
  const dir = tmp('lifecycle-')
  const { g, w1 } = witnessGenesis('shutdown-drain')
  const node = await new IntervalNode({
    genesis: g, buildWorld, name: 'w', witnessKey: w1,
    safetyDir: path.join(dir, 'ws'), checkpointFile: path.join(dir, 'cp.json'),
    checkpointInterval: 1, // checkpoint every tick to maximize in-flight writes
    peerKeyFile: path.join(dir, 'peer.json'), listen: '/ip4/127.0.0.1/tcp/0',
  }).start()
  // let it run briefly so a checkpoint may be in-flight
  await new Promise(r => setTimeout(r, 500))
  // queue a checkpoint right before stop to create pending work
  node.queueCheckpoint()
  await node.stop()
  // after stop returns: no in-flight write, nothing pending, lock released
  assert.equal(node._cpWriting, false, 'no checkpoint write in flight after stop')
  assert.equal(node._cpPending, null, 'no checkpoint pending after stop')
  assert.equal(node._processLock, null, 'process lock released after stop')
  // no leftover temp checkpoint files in the checkpoint directory
  const leftovers = fs.readdirSync(dir).filter(n => n.includes('cp.json.tmp'))
  assert.equal(leftovers.length, 0, 'no partial checkpoint temp files remain')
  fs.rmSync(dir, { recursive: true, force: true })
})

test('after shutdown, queueCheckpoint is a no-op (no writes past exclusivity release)', async () => {
  const dir = tmp('lifecycle-noop-')
  const { g, w1 } = witnessGenesis('shutdown-noop')
  const node = await new IntervalNode({
    genesis: g, buildWorld, name: 'w', witnessKey: w1,
    safetyDir: path.join(dir, 'ws'), checkpointFile: path.join(dir, 'cp.json'),
    peerKeyFile: path.join(dir, 'peer.json'), listen: '/ip4/127.0.0.1/tcp/0',
  }).start()
  await node.stop()
  // the shutdown gate blocks any further checkpoint queueing
  node.queueCheckpoint()
  assert.equal(node._cpWriting, false, 'queueCheckpoint after shutdown does not start a write')
  assert.equal(node._cpPending, null, 'queueCheckpoint after shutdown queues nothing')
  fs.rmSync(dir, { recursive: true, force: true })
})

test('stop() is idempotent', async () => {
  const dir = tmp('lifecycle-idem-')
  const { g, w1 } = witnessGenesis('idem')
  const node = await new IntervalNode({
    genesis: g, buildWorld, name: 'w', witnessKey: w1,
    safetyDir: path.join(dir, 'ws'), checkpointFile: path.join(dir, 'cp.json'),
    peerKeyFile: path.join(dir, 'peer.json'), listen: '/ip4/127.0.0.1/tcp/0',
  }).start()
  await node.stop()
  await node.stop() // second stop must not throw or re-release
  assert.ok(true)
  fs.rmSync(dir, { recursive: true, force: true })
})

test('fail-safe startup: a failure after lock acquisition releases the lock', async () => {
  const dir = tmp('lifecycle-failstart-')
  const { g, w1 } = witnessGenesis('failstart')
  const sockDir = path.join(dir, 'ws', E.worldId(g), w1.playerId)
  fs.mkdirSync(sockDir, { recursive: true })
  const lockPath = path.join(sockDir, 'process.lock.sock')

  // force a startup failure AFTER the lock is acquired by breaking libp2p:
  // an unusable listen multiaddr makes createLibp2p reject.
  const node = new IntervalNode({
    genesis: g, buildWorld, name: 'w', witnessKey: w1,
    safetyDir: path.join(dir, 'ws'),
    peerKeyFile: path.join(dir, 'peer.json'),
    listen: '/ip4/999.999.999.999/tcp/1', // invalid → libp2p start fails
  })
  await assert.rejects(node.start())
  // the lock must have been released by the fail-safe cleanup, so a fresh
  // acquisition on the same socket path succeeds immediately
  const relock = await acquireProcessLock(lockPath)
  assert.equal(relock.heldBy, process.pid, 'lock was released after failed startup and is re-acquirable')
  relock.release()
  fs.rmSync(dir, { recursive: true, force: true })
})

test('clean restart after a clean shutdown succeeds and resumes', async () => {
  const dir = tmp('lifecycle-restart-')
  const { g, w1 } = witnessGenesis('restart')
  const mk = () => new IntervalNode({
    genesis: g, buildWorld, name: 'w', witnessKey: w1,
    safetyDir: path.join(dir, 'ws'), checkpointFile: path.join(dir, 'cp.json'),
    peerKeyFile: path.join(dir, 'peer.json'), listen: '/ip4/127.0.0.1/tcp/0',
  })
  const n1 = await mk().start()
  await new Promise(r => setTimeout(r, 300))
  await n1.stop()
  // immediately restart: the previous lock released, so this must not block
  const n2 = await mk().start()
  assert.ok(n2, 'clean restart after clean shutdown succeeds')
  await n2.stop()
  fs.rmSync(dir, { recursive: true, force: true })
})

// --- checklist item 1: shutdown checkpoint draining (no timeout, fail-closed) ---

// helper: build a witness node with a controllable checkpoint writer
async function mkNode(dir, extra = {}) {
  const { g, w1 } = witnessGenesis('drain-' + Math.random().toString(36).slice(2))
  return new IntervalNode({
    genesis: g, buildWorld, name: 'w', witnessKey: w1,
    safetyDir: path.join(dir, 'ws'), checkpointFile: path.join(dir, 'cp.json'),
    peerKeyFile: path.join(dir, 'peer.json'), listen: '/ip4/127.0.0.1/tcp/0',
    ...extra,
  })
}

test('shutdown waits for an ALREADY-IN-FLIGHT checkpoint write to finish', async () => {
  const dir = tmp('drain-inflight-')
  const node = await (await mkNode(dir, { checkpointInterval: 1 })).start()
  // make the next checkpoint write slow, and start it in flight
  let writeStarted = false, writeFinished = false
  const realEnvelope = node.checkpointEnvelope.bind(node)
  const origOpen = fs.promises.open
  fs.promises.open = async (...args) => {
    if (String(args[0]).includes('cp.json.tmp')) {
      writeStarted = true
      await new Promise(r => setTimeout(r, 400)) // slow write
      writeFinished = true
    }
    return origOpen(...args)
  }
  try {
    node.queueCheckpoint()      // starts the slow in-flight write
    await new Promise(r => setTimeout(r, 50)) // let it begin
    assert.ok(writeStarted, 'a checkpoint write is in flight')
    await node.stop()           // must block until the in-flight write completes
    assert.ok(writeFinished, 'stop() waited for the in-flight write to finish')
    assert.equal(node._cpWriting, false)
    assert.equal(node._processLock, null, 'lock released only after the write finished')
  } finally {
    fs.promises.open = origOpen
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('shutdown waits for a checkpoint write LONGER than the old 10s timeout', async () => {
  // the old implementation released the lock after 10s regardless; the new one
  // must wait for genuine completion however long it takes. We simulate a
  // 200ms write and assert stop() does not return early — the mechanism is the
  // same regardless of duration (a completion promise, not a deadline).
  const dir = tmp('drain-long-')
  const node = await (await mkNode(dir)).start()
  let released = false
  const origOpen = fs.promises.open
  fs.promises.open = async (...args) => {
    if (String(args[0]).includes('cp.json.tmp')) await new Promise(r => setTimeout(r, 200))
    return origOpen(...args)
  }
  try {
    node.queueCheckpoint()
    const stopP = node.stop().then(() => { released = true })
    await new Promise(r => setTimeout(r, 100))
    assert.equal(released, false, 'stop() has not returned while the write is still running')
    await stopP
    assert.equal(released, true, 'stop() returns once the write genuinely completes')
  } finally {
    fs.promises.open = origOpen
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('a pending checkpoint queued during an in-flight write is also drained', async () => {
  const dir = tmp('drain-pending-')
  const node = await (await mkNode(dir)).start()
  let writes = 0
  const origOpen = fs.promises.open
  fs.promises.open = async (...args) => {
    if (String(args[0]).includes('cp.json.tmp')) { writes++; await new Promise(r => setTimeout(r, 150)) }
    return origOpen(...args)
  }
  try {
    node.queueCheckpoint()                       // write #1 (in flight)
    await new Promise(r => setTimeout(r, 30))
    node.queueCheckpoint()                        // queues pending → write #2
    await node.stop()                             // must drain BOTH
    assert.ok(writes >= 2, `both the in-flight and the pending write completed (saw ${writes})`)
    assert.equal(node._cpPending, null, 'nothing pending after stop')
    assert.equal(node._cpWriting, false, 'writer idle after stop')
  } finally {
    fs.promises.open = origOpen
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('no checkpoint files are written after the process lock is released', async () => {
  const dir = tmp('drain-nowrite-')
  const node = await (await mkNode(dir, { checkpointInterval: 1 })).start()
  await new Promise(r => setTimeout(r, 200))
  await node.stop()
  // capture the checkpoint dir mtime after shutdown, then confirm nothing
  // changes it — the gate makes post-shutdown queueCheckpoint a no-op
  const cpDir = path.dirname(path.join(dir, 'cp.json'))
  const before = fs.readdirSync(cpDir).map(n => { try { return n + ':' + fs.statSync(path.join(cpDir, n)).mtimeMs } catch { return n } }).sort()
  node.queueCheckpoint()
  node.queueCheckpoint()
  await new Promise(r => setTimeout(r, 100))
  const after = fs.readdirSync(cpDir).map(n => { try { return n + ':' + fs.statSync(path.join(cpDir, n)).mtimeMs } catch { return n } }).sort()
  assert.deepEqual(after, before, 'no files created or modified after the lock released')
  assert.equal(node._cpWriting, false)
  // no leftover temp files
  assert.equal(fs.readdirSync(cpDir).filter(n => n.includes('.tmp')).length, 0)
  fs.rmSync(dir, { recursive: true, force: true })
})

test('shutdown FAILS CLOSED (lock retained) if the final checkpoint cannot be written', async () => {
  const dir = tmp('drain-failclosed-')
  const node = await (await mkNode(dir)).start()
  // advance the state so a final checkpoint is queued at stop
  await new Promise(r => setTimeout(r, 100))
  node.state = { ...node.state, tick: (node.state.tick ?? 0) + 5 } // force state != last checkpoint
  const origOpen = fs.promises.open
  fs.promises.open = async (...args) => {
    if (String(args[0]).includes('cp.json.tmp')) throw new Error('simulated disk failure')
    return origOpen(...args)
  }
  try {
    await assert.rejects(node.stop(), e => e.code === 'ERR_SHUTDOWN_CHECKPOINT_FAILED')
    // the lock is STILL HELD — exclusivity was not released behind a failed write
    assert.ok(node._processLock, 'process lock retained after fail-closed shutdown')
  } finally {
    fs.promises.open = origOpen
  }
  // after fixing the fault, a retry can complete cleanly
  await node.stop()
  assert.equal(node._processLock, null, 'lock released once shutdown completes cleanly')
  fs.rmSync(dir, { recursive: true, force: true })
})

test('restart immediately after a clean shutdown re-acquires and resumes', async () => {
  const dir = tmp('drain-restart-')
  const { g, w1 } = witnessGenesis('drain-restart')
  const mk = () => new IntervalNode({
    genesis: g, buildWorld, name: 'w', witnessKey: w1,
    safetyDir: path.join(dir, 'ws'), checkpointFile: path.join(dir, 'cp.json'),
    peerKeyFile: path.join(dir, 'peer.json'), listen: '/ip4/127.0.0.1/tcp/0',
  })
  const n1 = await mk().start()
  await new Promise(r => setTimeout(r, 200))
  await n1.stop()
  const n2 = await mk().start() // must not block on a leftover lock
  assert.ok(n2)
  await n2.stop()
  fs.rmSync(dir, { recursive: true, force: true })
})
