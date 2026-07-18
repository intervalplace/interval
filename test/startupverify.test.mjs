// Phase-1 freeze §2: bounded startup verification is the GENERIC default.
// An omitted `startupVerifyRecentN` must resolve to the shared bounded
// constant everywhere — direct IntervalNode construction included — never to
// full-history (Infinity) verification. Infinity is an explicit audit opt-in.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import E from '../engine.js'
import { buildWorld } from '../worldgen.mjs'
import { IntervalNode, sqliteFinalityStore, finalityIndexStore } from '../node.mjs'
import { DEFAULT_STARTUP_VERIFY_RECENT_N } from '../errors.mjs'

const RULES = E.sha256(fs.readFileSync(new URL('../SPEC.md', import.meta.url))).toString('hex')
const tmp = (p) => fs.mkdtempSync(path.join(os.tmpdir(), p))

function witnessGenesis(seed) {
  const w1 = E.generateIdentity()
  const g = E.makeGenesis(seed, RULES, 0, 64, 48)
  g.witnesses = [w1.playerId]; g.quorum = 1; g.byzantineTolerance = 0
  return { g, w1 }
}

test('the shared default constant is a bounded finite value', () => {
  assert.ok(Number.isFinite(DEFAULT_STARTUP_VERIFY_RECENT_N), 'default is finite (bounded), not Infinity')
  assert.ok(DEFAULT_STARTUP_VERIFY_RECENT_N > 0, 'default verifies a non-empty recent tail')
  assert.equal(DEFAULT_STARTUP_VERIFY_RECENT_N, 10000)
})

test('generic IntervalNode construction with NO override resolves to the bounded default', async () => {
  const dir = tmp('sv-generic-')
  const { g, w1 } = witnessGenesis('generic')
  // no startupVerifyRecentN supplied
  const node = new IntervalNode({
    genesis: g, buildWorld, name: 'w', witnessKey: w1,
    safetyDir: path.join(dir, 'ws'), peerKeyFile: path.join(dir, 'peer.json'),
    listen: '/ip4/127.0.0.1/tcp/0',
  })
  assert.equal(node.startupVerifyRecentN, DEFAULT_STARTUP_VERIFY_RECENT_N,
    'omitted config resolves to the bounded default, not Infinity')
  assert.notEqual(node.startupVerifyRecentN, Infinity)
  fs.rmSync(dir, { recursive: true, force: true })
})

test('an explicit bounded value is honored', () => {
  const dir = tmp('sv-explicit-')
  const { g, w1 } = witnessGenesis('explicit')
  const node = new IntervalNode({
    genesis: g, buildWorld, name: 'w', witnessKey: w1,
    safetyDir: path.join(dir, 'ws'), peerKeyFile: path.join(dir, 'peer.json'),
    listen: '/ip4/127.0.0.1/tcp/0', startupVerifyRecentN: 250,
  })
  assert.equal(node.startupVerifyRecentN, 250)
  fs.rmSync(dir, { recursive: true, force: true })
})

test('explicit Infinity selects full-history audit mode', () => {
  const dir = tmp('sv-inf-')
  const { g, w1 } = witnessGenesis('inf')
  const node = new IntervalNode({
    genesis: g, buildWorld, name: 'w', witnessKey: w1,
    safetyDir: path.join(dir, 'ws'), peerKeyFile: path.join(dir, 'peer.json'),
    listen: '/ip4/127.0.0.1/tcp/0', startupVerifyRecentN: Infinity,
  })
  assert.equal(node.startupVerifyRecentN, Infinity)
  fs.rmSync(dir, { recursive: true, force: true })
})

test('explicit zero is honored (not coerced back to the default)', () => {
  const dir = tmp('sv-zero-')
  const { g, w1 } = witnessGenesis('zero')
  const node = new IntervalNode({
    genesis: g, buildWorld, name: 'w', witnessKey: w1,
    safetyDir: path.join(dir, 'ws'), peerKeyFile: path.join(dir, 'peer.json'),
    listen: '/ip4/127.0.0.1/tcp/0', startupVerifyRecentN: 0,
  })
  assert.equal(node.startupVerifyRecentN, 0, 'explicit 0 survives (?? not ||)')
  fs.rmSync(dir, { recursive: true, force: true })
})

test('bounded verifyRecentN bounds cert verification but structure is checked on ALL rows', () => {
  const dir = tmp('sv-behavior-')
  const wid = 'cd'.repeat(32)
  for (const mk of [
    () => sqliteFinalityStore(path.join(dir, 's.db'), { worldId: wid }),
    () => finalityIndexStore(path.join(dir, 'f.ndjson')),
  ]) {
    const store = mk()
    for (let t = 0; t < 50; t++) store.append({ worldId: wid, tick: t, round: 0, previousStateHash: 'a'.repeat(64), bundle: { worldId: wid }, bundleHash: t.toString(16).padStart(64, '0'), resultingStateHash: 'b'.repeat(64), attestations: [] })
    let calls = 0
    const r = store.validate({ worldId: wid, verifyCert: () => { calls++; return null }, verifyRecentN: 10 })
    assert.equal(r, null, 'structural validation passes')
    assert.equal(calls, 10, 'only the recent 10 certs are cryptographically verified')
    // zero bound → no cert verification, structure still checked
    calls = 0
    assert.equal(store.validate({ worldId: wid, verifyCert: () => { calls++; return null }, verifyRecentN: 0 }), null)
    assert.equal(calls, 0, 'verifyRecentN=0 does no cert verification')
    store.close?.()
  }
  fs.rmSync(dir, { recursive: true, force: true })
})

test('direct construction and the launcher default resolve to the SAME bounded value', async () => {
  // the launchers (serve/join) pass DEFAULT_STARTUP_VERIFY_RECENT_N; a direct
  // IntervalNode with no override must resolve to exactly the same value, so
  // startup behavior is identical whether launched or constructed directly.
  const dir = tmp('sv-parity-')
  const { g, w1 } = witnessGenesis('parity')
  const direct = new IntervalNode({
    genesis: g, buildWorld, name: 'direct', witnessKey: w1,
    safetyDir: path.join(dir, 'ws1'), peerKeyFile: path.join(dir, 'p1.json'),
    listen: '/ip4/127.0.0.1/tcp/0',
  })
  const launcherStyle = new IntervalNode({
    genesis: g, buildWorld, name: 'launcher', witnessKey: w1,
    safetyDir: path.join(dir, 'ws2'), peerKeyFile: path.join(dir, 'p2.json'),
    listen: '/ip4/127.0.0.1/tcp/0', startupVerifyRecentN: DEFAULT_STARTUP_VERIFY_RECENT_N,
  })
  assert.equal(direct.startupVerifyRecentN, launcherStyle.startupVerifyRecentN,
    'direct construction matches the launcher default')
  fs.rmSync(dir, { recursive: true, force: true })
})
