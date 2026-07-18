// Node-layer regression tests — checkpoint envelope validation (§2.5, §6.4)
// and message bounds (§5). Constructs IntervalNode without starting libp2p.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import E from '../engine.js'
import { IntervalNode, LIMITS } from '../node.mjs'

const RULES = 'b'.repeat(64)
const GENESIS = E.makeGenesis('cp-seed', RULES, 0, 20, 20)
const buildWorld = (g) => E.newWorld(g)
const mk = () => new IntervalNode({ genesis: GENESIS, buildWorld, name: 't' })

test('checkpoint envelope: valid passes, forgeries are named and refused', () => {
  const n = mk()
  const good = n.checkpointEnvelope()
  assert.equal(n.validateCheckpoint(good), null)

  assert.equal(n.validateCheckpoint({ ...good, worldId: 'f'.repeat(64) }), 'wrong world')
  assert.equal(n.validateCheckpoint({ ...good, tick: good.tick + 5 }), 'tick inconsistent')

  const tampered = JSON.parse(JSON.stringify(good))
  tampered.state.players['x'.repeat(64)] = { hp: 1 }
  assert.equal(n.validateCheckpoint(tampered), 'state hash mismatch')

  const otherWorld = new IntervalNode({
    genesis: E.makeGenesis('other', RULES, 0, 20, 20), buildWorld, name: 'o',
  }).checkpointEnvelope()
  assert.equal(n.validateCheckpoint(otherWorld), 'wrong world')
  assert.equal(n.validateCheckpoint({ tick: 0 }), 'malformed')
})

test('gossip bounds: oversized, far-future, wrong-world inputs never allocate', () => {
  const n = mk()
  const deliver = (topic, obj, rawLen) => n.onMessage({
    detail: { topic, data: Buffer.alloc(rawLen ?? 0, 0x20).length && rawLen
      ? Buffer.alloc(rawLen, 0x7b) : Buffer.from(JSON.stringify(obj)) },
  })
  const pid = 'c'.repeat(64)
  const base = { worldId: n.worldId, playerId: pid, type: 'stop' }

  deliver(n.topics.inputs, { ...base, tick: 0 })
  assert.equal(n.inputBuffer.get(0)?.size, 1, 'a well-formed input buffers')

  deliver(n.topics.inputs, { ...base, tick: n.state.tick + LIMITS.MAX_FUTURE_TICKS + 1 })
  assert.equal(n.inputBuffer.size, 1, 'far-future input is dropped')

  deliver(n.topics.inputs, { ...base, worldId: 'd'.repeat(64), tick: 1 })
  assert.equal(n.inputBuffer.size, 1, 'wrong-world input is dropped')

  deliver(n.topics.inputs, { ...base, playerId: 'not-a-key', tick: 1 })
  assert.equal(n.inputBuffer.size, 1, 'malformed playerId is dropped')

  // oversized frame: rejected before JSON.parse ever runs
  n.onMessage({ detail: { topic: n.topics.inputs, data: Buffer.alloc(LIMITS.MAX_GOSSIP_BYTES + 1) } })
  assert.equal(n.inputBuffer.size, 1)

  // hash gossip outside the retention window is dropped
  n.onMessage({ detail: { topic: n.topics.hashes, data: Buffer.from(JSON.stringify({ tick: 10 ** 9, hash: 'aa', peer: 'p' })) } })
  assert.equal(n.peerHashes.size, 0)
})

test('network surfaces are namespaced by the complete world id', () => {
  const n = mk()
  assert.ok(n.topics.inputs.includes(n.worldId))
  assert.ok(n.checkpointProto.includes(n.worldId))
  assert.equal(n.worldId.length, 64)
  const other = new IntervalNode({ genesis: E.makeGenesis('other', RULES, 0, 20, 20), buildWorld, name: 'o' })
  assert.notEqual(n.topics.inputs, other.topics.inputs, 'same rules, different seed: different network')
})
