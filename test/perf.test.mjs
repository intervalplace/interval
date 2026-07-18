// Phase 1 engine-scaling correctness suite (perf brief 1B/1C/1D).
// These tests assert that the optimizations changed COSTS, never ANSWERS:
// the accepted input set, the state hashes, and the transition results are
// byte-identical to the pre-optimization engine.
import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const E = require('../engine.js')
E.initCrypto()
const { buildWorld } = await import('../worldgen.mjs')

const T = E._perfTesting
const WID = 'a'.repeat(64)
const mkInput = (id, extra = {}) =>
  E.signInput({ type: 'move', dx: 1, dy: 0, tick: 0, worldId: WID, playerId: id.playerId, ...extra }, id.privateKey)

// ---------- 1B: backend selection and parity ----------

test('native backend is selected and cross-checked at startup', () => {
  const s = E.perfStats()
  // On Node >= 22 native Ed25519 exists; the KAT ran inside initCrypto and
  // did not throw, so selection must have landed on native+fallback.
  assert.equal(s.backend, 'native+fallback')
})

test('native signatures and noble signatures are byte-identical (harness precondition)', () => {
  const seed = crypto.createHash('sha256').update('parity-seed').digest()
  const priv = crypto.createPrivateKey({
    key: Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]),
    format: 'der', type: 'pkcs8',
  })
  const spki = crypto.createPublicKey(priv).export({ format: 'der', type: 'spki' })
  const rawPub = spki.subarray(spki.length - 32)
  const msg = Buffer.from('INTERVAL_PARITY_MSG')
  const nativeSig = crypto.sign(null, msg, priv)
  const id = { playerId: rawPub.toString('hex'), privateKey: new Uint8Array(seed) }
  const unsigned = { type: 'move', dx: 1, dy: 0, tick: 0, worldId: WID, playerId: id.playerId }
  const viaEngine = E.signInput(unsigned, id.privateKey) // noble signing path
  const payload = Buffer.from('INTERVAL_INPUT_V1|' + E.canonical(unsigned))
  const viaNative = crypto.sign(null, payload, priv).toString('hex')
  assert.equal(viaEngine.sig, viaNative) // RFC 8032 determinism, same bytes
  assert.equal(crypto.verify(null, msg, crypto.createPublicKey(priv), nativeSig), true)
})

test('verification verdicts: valid, wrong sig, altered payload, wrong key, malformed material', () => {
  const id = E.generateIdentity()
  const other = E.generateIdentity()
  const good = mkInput(id)
  assert.equal(E.verifyInputSig(good), true)

  const wrongSig = { ...good, sig: good.sig.slice(0, -2) + (good.sig.endsWith('00') ? '01' : '00') }
  assert.equal(E.verifyInputSig(wrongSig), false)

  const altered = { ...good, dx: -1 } // payload no longer matches sig
  assert.equal(E.verifyInputSig(altered), false)

  const wrongKey = { ...good, playerId: other.playerId }
  assert.equal(E.verifyInputSig(wrongKey), false)

  assert.equal(E.verifyInputSig({ ...good, sig: '' }), false)              // empty
  assert.equal(E.verifyInputSig({ ...good, sig: good.sig.slice(2) }), false)   // truncated
  assert.equal(E.verifyInputSig({ ...good, sig: good.sig + '00' }), false)     // oversized
  assert.equal(E.verifyInputSig({ ...good, sig: 'zz' + good.sig.slice(2) }), false) // malformed hex
  assert.equal(E.verifyInputSig({ ...good, playerId: 'nothex' }), false)       // malformed key
  assert.equal(E.verifyInputSig({ ...good, sig: 42 }), false)                  // non-string sig
})

test('chat domain still verifies under its own domain and never cross-verifies', () => {
  const id = E.generateIdentity()
  const msg = { type: 'chat', text: 'hello', tick: 3, worldId: WID, playerId: id.playerId }
  const chatSigned = E.signInput(msg, id.privateKey, E.SIG_DOMAINS.chat)
  assert.equal(E.verifyInputSig(chatSigned, E.SIG_DOMAINS.chat), true)
  assert.equal(E.verifyInputSig(chatSigned, E.SIG_DOMAINS.input), false) // domain separation intact
})

// ---------- 1C: signature-verification cache ----------

test('repeated valid verification invokes the backend only once', () => {
  const id = E.generateIdentity()
  const inp = mkInput(id, { tick: 100 })
  T.clearSigCache(); T.resetCounters()
  assert.equal(E.verifyInputSig(inp), true)
  const afterFirst = E.perfStats()
  for (let i = 0; i < 5; i++) assert.equal(E.verifyInputSig(inp), true)
  const s = E.perfStats()
  assert.equal(s.sigCacheMisses, afterFirst.sigCacheMisses) // no new curve math
  assert.equal(s.nativeCalls, afterFirst.nativeCalls)
  assert.equal(s.fallbackCalls, afterFirst.fallbackCalls)
  assert.equal(s.sigCacheHits, afterFirst.sigCacheHits + 5)
})

test('repeated INVALID verification invokes the backend only once (cached false ≠ absent)', () => {
  const id = E.generateIdentity()
  const bad = { ...mkInput(id, { tick: 101 }), sig: 'ab'.repeat(64) }
  T.clearSigCache(); T.resetCounters()
  assert.equal(E.verifyInputSig(bad), false)
  const afterFirst = E.perfStats()
  for (let i = 0; i < 5; i++) assert.equal(E.verifyInputSig(bad), false)
  const s = E.perfStats()
  assert.equal(s.sigCacheMisses, afterFirst.sigCacheMisses)
  assert.equal(s.sigCacheHits, afterFirst.sigCacheHits + 5)
})

test('distinct payloads, keys, and signatures never collide in the cache', () => {
  const a = E.generateIdentity(), b = E.generateIdentity()
  T.clearSigCache(); T.resetCounters()
  const i1 = mkInput(a, { tick: 1 })
  const i2 = mkInput(a, { tick: 2 })          // different payload
  const i3 = mkInput(b, { tick: 1 })          // different key
  const i4 = { ...i1, sig: 'cd'.repeat(64) }  // different signature
  for (const [inp, want] of [[i1, true], [i2, true], [i3, true], [i4, false]])
    assert.equal(E.verifyInputSig(inp), want)
  assert.equal(E.perfStats().sigCacheMisses, 4) // four distinct entries, no collisions
  // and each verdict is individually stable on re-query
  for (const [inp, want] of [[i1, true], [i2, true], [i3, true], [i4, false]])
    assert.equal(E.verifyInputSig(inp), want)
})

test('eviction is correctness-neutral: an evicted entry re-verifies to the same verdict', () => {
  const id = E.generateIdentity()
  T.clearSigCache(); T.resetCounters(); T.setSigCacheMax(4)
  try {
    const first = mkInput(id, { tick: 500 })
    assert.equal(E.verifyInputSig(first), true)
    for (let t = 501; t <= 508; t++) E.verifyInputSig(mkInput(id, { tick: t })) // overflow the tiny cache
    assert.ok(E.perfStats().sigCacheEvictions > 0)
    const before = E.perfStats().sigCacheMisses
    assert.equal(E.verifyInputSig(first), true) // evicted → re-verified → same answer
    assert.equal(E.perfStats().sigCacheMisses, before + 1)
  } finally {
    T.setSigCacheMax(16384)
  }
})

test('cold cache and warm cache produce identical transition hashes', () => {
  const g = E.makeGenesis('perf-cache-world', 'c'.repeat(64))
  const w = buildWorld(g)
  const id = E.generateIdentity()
  E.addPlayer(w, id.playerId, 30, 30)
  const inp = E.signInput({ type: 'move', dx: 1, dy: 0, tick: w.tick, worldId: E.worldId(g), playerId: id.playerId }, id.privateKey)
  T.clearSigCache()
  const cold = E.stateHash(E.nextState(w, [inp]))   // cache empty: full curve math
  const warm = E.stateHash(E.nextState(w, [inp]))   // cache warm: memoized verdicts
  assert.equal(cold, warm)
  T.clearSigCache()
  assert.equal(E.stateHash(E.nextState(w, [inp])), cold) // and cold again
})

test('validInput still performs signature verification (no structural bypass)', () => {
  const g = E.makeGenesis('perf-validinput-world', 'c'.repeat(64))
  const w = buildWorld(g)
  const id = E.generateIdentity()
  E.addPlayer(w, id.playerId, 30, 30)
  const good = E.signInput({ type: 'move', dx: 1, dy: 0, tick: w.tick, worldId: E.worldId(g), playerId: id.playerId }, id.privateKey)
  const forged = { ...good, dx: -1 } // resigned nowhere: the state machine itself must reject
  const h0 = E.stateHash(w)
  const next = E.nextState(w, [forged])
  const p = next.players[id.playerId]
  assert.equal(p.x, 30) // forged move did not execute
  assert.equal(E.stateHash(w), h0) // caller state untouched
})

// ---------- 1D: state-hash memoization ----------

test('hashing the same state object twice serializes it only once', () => {
  const g = E.makeGenesis('perf-hash-world', 'c'.repeat(64))
  const w = buildWorld(g)
  T.resetCounters()
  const h1 = E.stateHash(w)
  const h2 = E.stateHash(w)
  assert.equal(h1, h2)
  const s = E.perfStats()
  assert.equal(s.stateHashMisses, 1)
  assert.equal(s.stateHashHits, 1)
})

test('equivalent but distinct state objects each hash independently to the same value', () => {
  const g = E.makeGenesis('perf-hash-world-2', 'c'.repeat(64))
  const a = buildWorld(g)
  const b = JSON.parse(JSON.stringify(a)) // equal content, different identity
  T.resetCounters()
  const ha = E.stateHash(a), hb = E.stateHash(b)
  assert.equal(ha, hb)
  assert.equal(E.perfStats().stateHashMisses, 2) // no cross-object cache sharing
})

test('cache is identity-keyed: mutating a COPY never disturbs the original entry', () => {
  const g = E.makeGenesis('perf-hash-world-3', 'c'.repeat(64))
  const a = buildWorld(g)
  const ha = E.stateHash(a)
  const b = JSON.parse(JSON.stringify(a))
  b.tick = 999
  assert.notEqual(E.stateHash(b), ha)
  assert.equal(E.stateHash(a), ha) // original verdict untouched
})

test('memoized hashes match a from-scratch canonical hash for every fixture', () => {
  const g = E.makeGenesis('perf-hash-world-4', 'c'.repeat(64))
  let s = buildWorld(g)
  const id = E.generateIdentity()
  E.addPlayer(s, id.playerId, 40, 40)
  for (let t = 0; t < 5; t++) {
    const inp = E.signInput({ type: 'move', dx: t % 2 ? 1 : -1, dy: 0, tick: s.tick, worldId: E.worldId(g), playerId: id.playerId }, id.privateKey)
    s = E.nextState(s, [inp])
    const memo = E.stateHash(s)
    const raw = E.sha256(Buffer.from(E.canonical(s))).toString('hex')
    assert.equal(memo, raw) // the memo IS the flat hash, never a substitute for it
  }
})

test('cache contents never enter canonical state', () => {
  const g = E.makeGenesis('perf-hash-world-5', 'c'.repeat(64))
  const w = buildWorld(g)
  const before = E.canonical(w)
  E.stateHash(w) // populate the memo
  E.stateHash(w)
  assert.equal(E.canonical(w), before) // serialization byte-identical after caching
  assert.equal(E.validateState(w), null)
})

// ---------- purity discipline the memo relies on ----------

test('nextState never mutates its caller: per-entity spot checks', () => {
  const g = E.makeGenesis('perf-purity-world', 'c'.repeat(64))
  const w = buildWorld(g)
  const id = E.generateIdentity()
  E.addPlayer(w, id.playerId, 50, 50)
  const snapshot = E.canonical(w)
  const hw = E.stateHash(w)
  const inp = E.signInput({ type: 'move', dx: 1, dy: 0, tick: w.tick, worldId: E.worldId(g), playerId: id.playerId }, id.privateKey)
  const next = E.nextState(w, [inp])
  assert.notEqual(next, w)
  assert.notEqual(next.players[id.playerId], w.players[id.playerId]) // fresh entities
  assert.equal(E.canonical(w), snapshot)  // caller state byte-identical
  assert.equal(E.stateHash(w), hw)
  // and mutating the RESULT cannot reach back into the caller
  next.players[id.playerId].hp = 1
  assert.equal(E.canonical(w), snapshot)
})
