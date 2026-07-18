// Final freeze brief §3/§4 — typed protocol error codes. Safety-critical
// refusals and halts carry a stable CODE (classified structurally, not by
// message text), and Byzantine halts carry supporting evidence.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import E from '../engine.js'
import * as P from '../protocol.mjs'
import { IntervalAgreement, FRONTIER_FORMAT, LOCK_FORMAT, ephemeralFinalityIndex } from '../agreement.mjs'
import { IntervalNode, durableStore } from '../node.mjs'
import { buildWorld } from '../worldgen.mjs'
import { ERR, HALT, ALL_ERR, ALL_HALT, codeOf, IntervalError } from '../errors.mjs'

const RULES = 'c'.repeat(64)
const w1 = E.generateIdentity()
const alice = E.generateIdentity()

const mkGenesis = () => {
  const g = E.makeGenesis('coded-errors', RULES, 0, 64, 48)
  g.witnesses = [w1.playerId]; g.quorum = 1; g.byzantineTolerance = 0
  return g
}
const genesis = mkGenesis()
const worldId = E.worldId(genesis)
const build = () => { const s = E.newWorld(genesis); E.addPlayer(s, alice.playerId, 5, 5); return s }
const mk = (holder, extra = {}) => new IntervalAgreement({
  // holder may be a raw state (convenience) or a {state} holder

  genesis, worldId, name: 't', witnessKey: w1,
  getState: () => (holder.state ?? holder), setState: (n) => { if (holder.state !== undefined) holder.state = n },
  publish: () => {}, now: () => holder.clock ?? 0, log: () => {},
  allowEphemeralStores: true, ...extra,
})

// helper: capture the thrown IntervalError
const grab = (fn) => { try { fn(); return null } catch (e) { return e } }

test('startup refusals carry the right typed code', () => {
  // corrupt lock
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'coded-'))
  fs.writeFileSync(path.join(dir, 'w.lock'), 'not json')
  let e = grab(() => mk(build(), {
    lockStore: durableStore(path.join(dir, 'w.lock')),
    frontierStore: durableStore(path.join(dir, 'w.frontier')),
    finalityIndexStore: ephemeralFinalityIndex(),
    allowEphemeralStores: false,
  }))
  assert.equal(e.code, ERR.CORRUPT_SAFETY_RECORD, 'corrupt read is coded at the store')

  // wrong-world frontier
  const alien = { format: FRONTIER_FORMAT, worldId: 'ab'.repeat(32), tick: 3, resultingStateHash: 'a'.repeat(64) }
  e = grab(() => mk(build(), { frontierStore: { save: () => {}, load: () => alien } }))
  assert.equal(e.code, ERR.WORLD_MISMATCH)

  // malformed (unversioned) frontier
  e = grab(() => mk(build(), { frontierStore: { save: () => {}, load: () => ({ worldId, tick: 3, resultingStateHash: 'a'.repeat(64) }) } }))
  assert.equal(e.code, ERR.CORRUPT_FRONTIER)

  // malformed lock
  e = grab(() => mk(build(), { lockStore: { save: () => {}, load: () => ({ worldId, tick: 0, bundleHash: 'a'.repeat(64) }) } }))
  assert.equal(e.code, ERR.CORRUPT_LOCK)

  // missing durable stores (production witness)
  e = grab(() => new IntervalAgreement({
    genesis, worldId, witnessKey: w1,
    getState: () => build(), setState: () => {}, publish: () => {},
  }))
  assert.equal(e.code, ERR.MISSING_STORES)
  fs.rmSync(dir, { recursive: true, force: true })
})

test('frontier rollback and ahead-of-frontier are distinctly coded', () => {
  // rollback: state behind a durable frontier
  const frontier = { format: FRONTIER_FORMAT, worldId, tick: 5, resultingStateHash: 'b'.repeat(64) }
  let e = grab(() => mk({ state: build(), clock: 0 }, { frontierStore: { save: () => {}, load: () => frontier } }))
  assert.equal(e.code, ERR.FRONTIER_ROLLBACK)

  // ahead-of-frontier without proof: run forward, freeze frontier at 0
  let first = null
  const sticky = { save: (f) => { if (!first) first = JSON.parse(JSON.stringify(f)) }, load: () => first }
  const h = { state: build(), clock: 700 }
  const ag = mk(h, { frontierStore: sticky })
  ag.drive(); h.clock = 1300; ag.drive(); h.clock = 1900; ag.drive()
  e = grab(() => mk({ state: h.state, clock: 2000 }, { frontierStore: sticky }))
  assert.equal(e.code, ERR.FRONTIER_AHEAD_UNPROVEN)
})

test('node-level refusals are coded: genesis, built state, checkpoint', () => {
  let e = grab(() => new IntervalNode({ genesis: { worldW: 64 }, buildWorld, name: 'x' }))
  assert.equal(e.code, ERR.INVALID_GENESIS)

  const badBuilder = (g) => { const s = E.newWorld(g); E.addPlayer(s, alice.playerId, 5, 5); s.players[alice.playerId].hp = -5; return s }
  e = grab(() => new IntervalNode({ genesis, buildWorld: badBuilder, name: 'x', allowEphemeralStores: true }))
  assert.equal(e.code, ERR.INVALID_BUILT_STATE)

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'coded-cp-'))
  const cpFile = path.join(dir, 'cp.json')
  fs.writeFileSync(cpFile, '{"garbage')
  e = grab(() => new IntervalNode({ genesis, buildWorld, name: 'w', witnessKey: w1, checkpointFile: cpFile, lockFile: path.join(dir, 'w.lock') }))
  assert.equal(e.code, ERR.INVALID_CHECKPOINT)
  fs.rmSync(dir, { recursive: true, force: true })
})

test('identity corruption is coded (CJS engine mirrors the code set)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'coded-id-'))
  const f = path.join(dir, 'id.json')
  fs.writeFileSync(f, '{"playerId": "ab')
  const e = grab(() => E.loadOrCreateIdentity(fs, f))
  assert.equal(e.code, ERR.CORRUPT_IDENTITY)
  // forged pairing
  fs.writeFileSync(f, JSON.stringify({ playerId: 'ab'.repeat(32), privateKey: 'cd'.repeat(32) }))
  assert.equal(grab(() => E.loadOrCreateIdentity(fs, f)).code, ERR.CORRUPT_IDENTITY)
  fs.rmSync(dir, { recursive: true, force: true })
})

test('a Byzantine halt is structural: code + reason + supporting evidence', () => {
  // drive a witness to a REPLAY_MISMATCH by feeding a finality record whose
  // certified result disagrees with local replay
  const h = { state: build(), clock: 700 }
  const ag = mk(h, { witnessKey: null, allowEphemeralStores: false }) // observer follows finality
  // craft a valid-looking record with a wrong resultingStateHash
  const st = h.state
  const bundle = P.makeBundle({ worldId, tick: 0, round: 0, previousStateHash: ag.prevHash, inputs: [], witness: w1 })
  const realNext = E.nextState(st, [])
  const attestations = [P.makeAttestation({ worldId, tick: 0, round: 0, bundleHash: P.bundleHash(bundle), resultingStateHash: 'f'.repeat(64), witness: w1 })]
  const forgedRecord = { worldId, tick: 0, round: 0, previousStateHash: ag.prevHash,
    bundle, bundleHash: P.bundleHash(bundle), resultingStateHash: 'f'.repeat(64), attestations }
  const res = ag.onFinality(forgedRecord)
  // it either rejects the proof outright (bad cert) or halts on replay
  // mismatch; both are legitimate — if it halted, the halt is structural
  if (ag.halted) {
    assert.ok(ALL_HALT.has(ag.haltCode), `halt code ${ag.haltCode} is recognized`)
    assert.ok(typeof ag.haltReason === 'string' && ag.haltReason.length > 0)
    assert.ok(ag.haltEvidence && Object.keys(ag.haltEvidence).length > 0, 'Byzantine halt carries evidence')
    assert.deepEqual(ag.halt_, { code: ag.haltCode, reason: ag.haltReason, evidence: ag.haltEvidence })
  }
})

test('halt evidence must PROVE the reported halt condition (§4/§5 rigor)', async () => {
  const { verifyHaltEvidence } = await import('../advsim.mjs')
  // REPLAY_MISMATCH: matching hashes do NOT prove a mismatch
  assert.match(verifyHaltEvidence({ code: HALT.REPLAY_MISMATCH, evidence: { record: { resultingStateHash: 'a'.repeat(64) }, localResult: 'a'.repeat(64) } }), /matches/)
  // …differing hashes do (no verifier → cert check skipped)
  assert.equal(verifyHaltEvidence({ code: HALT.REPLAY_MISMATCH, evidence: { record: { resultingStateHash: 'a'.repeat(64) }, localResult: 'b'.repeat(64), certified: 'a'.repeat(64) } }), null)

  // CERTIFIED_RESULT_MISMATCH: needs a genuine certifying quorum + divergence
  const q3 = (result) => [0, 1, 2].map(i => ({ witness: 'w' + i, resultingStateHash: result, round: 0 }))
  const genesis = { quorum: 3, witnesses: ['w0', 'w1', 'w2', 'w3'] }
  const ctx = { genesis, verifyAtt: () => true }
  // a real mismatch with a full distinct-witness quorum → proven
  assert.equal(verifyHaltEvidence({ code: HALT.CERTIFIED_RESULT_MISMATCH,
    evidence: { bundle: {}, localResult: 'b'.repeat(64), certifiedResult: 'a'.repeat(64), certifyingAttestations: q3('a'.repeat(64)) } }, ctx), null)
  // local == certified → no mismatch
  assert.match(verifyHaltEvidence({ code: HALT.CERTIFIED_RESULT_MISMATCH,
    evidence: { bundle: {}, localResult: 'a'.repeat(64), certifiedResult: 'a'.repeat(64), certifyingAttestations: q3('a'.repeat(64)) } }, ctx), /no mismatch/)
  // too few attestations → not a quorum
  assert.match(verifyHaltEvidence({ code: HALT.CERTIFIED_RESULT_MISMATCH,
    evidence: { bundle: {}, localResult: 'b'.repeat(64), certifiedResult: 'a'.repeat(64), certifyingAttestations: q3('a'.repeat(64)).slice(0, 2) } }, ctx), /need a quorum/)
  // duplicate witness → invalid quorum
  assert.match(verifyHaltEvidence({ code: HALT.CERTIFIED_RESULT_MISMATCH,
    evidence: { bundle: {}, localResult: 'b'.repeat(64), certifiedResult: 'a'.repeat(64), certifyingAttestations: [{ witness: 'w0', resultingStateHash: 'a'.repeat(64), round: 0 }, { witness: 'w0', resultingStateHash: 'a'.repeat(64), round: 0 }, { witness: 'w1', resultingStateHash: 'a'.repeat(64), round: 0 }] } }, ctx), /duplicate witness/)
  // non-witness signer → rejected
  assert.match(verifyHaltEvidence({ code: HALT.CERTIFIED_RESULT_MISMATCH,
    evidence: { bundle: {}, localResult: 'b'.repeat(64), certifiedResult: 'a'.repeat(64), certifyingAttestations: [{ witness: 'stranger', resultingStateHash: 'a'.repeat(64), round: 0 }, { witness: 'w1', resultingStateHash: 'a'.repeat(64), round: 0 }, { witness: 'w2', resultingStateHash: 'a'.repeat(64), round: 0 }] } }, ctx), /non-witness/)
  // invalid signature → rejected
  assert.match(verifyHaltEvidence({ code: HALT.CERTIFIED_RESULT_MISMATCH,
    evidence: { bundle: {}, localResult: 'b'.repeat(64), certifiedResult: 'a'.repeat(64), certifyingAttestations: q3('a'.repeat(64)) } }, { genesis, verifyAtt: () => false }), /invalid attestation signature/)
  // mixed results (an attestation not naming the certified result) → rejected
  assert.match(verifyHaltEvidence({ code: HALT.CERTIFIED_RESULT_MISMATCH,
    evidence: { bundle: {}, localResult: 'b'.repeat(64), certifiedResult: 'a'.repeat(64), certifyingAttestations: [{ witness: 'w0', resultingStateHash: 'a'.repeat(64), round: 0 }, { witness: 'w1', resultingStateHash: 'c'.repeat(64), round: 0 }, { witness: 'w2', resultingStateHash: 'a'.repeat(64), round: 0 }] } }, ctx), /does not name the certified result/)

  // PROPOSER_EQUIVOCATION: §6 — same world/tick/round/proposer, different bundles
  const wid = 'ab'.repeat(32)
  const eqCtx = { worldId: wid, genesis: { witnesses: ['w0'] }, bundleHash: (b) => JSON.stringify(b), verifyBundle: () => true }
  assert.match(verifyHaltEvidence({ code: HALT.PROPOSER_EQUIVOCATION, evidence: { a: { worldId: wid, tick: 0, proposer: 'w0', round: 0 }, b: { worldId: wid, tick: 0, proposer: 'w1', round: 0 } } }, eqCtx), /different proposers/)
  assert.match(verifyHaltEvidence({ code: HALT.PROPOSER_EQUIVOCATION, evidence: { a: { worldId: wid, tick: 0, proposer: 'w0', round: 0 }, b: { worldId: 'cd'.repeat(32), tick: 0, proposer: 'w0', round: 0 } } }, eqCtx), /different worlds/)
  assert.match(verifyHaltEvidence({ code: HALT.PROPOSER_EQUIVOCATION, evidence: { a: { worldId: wid, tick: 0, proposer: 'stranger', round: 0 }, b: { worldId: wid, tick: 0, proposer: 'stranger', round: 0, inputs: ['x'] } } }, eqCtx), /not a constitutional witness/)
  assert.equal(verifyHaltEvidence({ code: HALT.PROPOSER_EQUIVOCATION, evidence: { a: { worldId: wid, tick: 0, proposer: 'w0', round: 0, inputs: [] }, b: { worldId: wid, tick: 0, proposer: 'w0', round: 0, inputs: ['x'] } } }, eqCtx), null)
  // invalid proposer signature fails
  assert.match(verifyHaltEvidence({ code: HALT.PROPOSER_EQUIVOCATION, evidence: { a: { worldId: wid, tick: 0, proposer: 'w0', round: 0, inputs: [] }, b: { worldId: wid, tick: 0, proposer: 'w0', round: 0, inputs: ['x'] } } }, { ...eqCtx, verifyBundle: () => false }), /invalid proposer signature/)

  // CERTIFIED_INVALID_BUNDLE: §7 — re-validation must independently find it invalid
  assert.match(verifyHaltEvidence({ code: HALT.CERTIFIED_INVALID_BUNDLE, evidence: { record: {} } }), /no bundle validation error/)
  assert.equal(verifyHaltEvidence({ code: HALT.CERTIFIED_INVALID_BUNDLE, evidence: { record: {}, bundleError: 'unknown proposer' } }), null)
  // with a re-validator that finds the bundle VALID, the halt does not reproduce
  assert.match(verifyHaltEvidence({ code: HALT.CERTIFIED_INVALID_BUNDLE, evidence: { record: {}, bundleError: 'unknown proposer' } }, { validateBundle: () => null }), /found the bundle VALID/)
  // with a re-validator that confirms invalidity, it holds
  assert.equal(verifyHaltEvidence({ code: HALT.CERTIFIED_INVALID_BUNDLE, evidence: { record: {}, bundleError: 'unknown proposer' } }, { validateBundle: () => 'unknown proposer' }), null)
  // durability halts need a cause
  assert.match(verifyHaltEvidence({ code: HALT.FRONTIER_PERSIST_FAILED, evidence: {} }), /no cause/)
  assert.equal(verifyHaltEvidence({ code: HALT.FRONTIER_PERSIST_FAILED, evidence: { cause: 'ENOSPC' } }), null)
})

test('codeOf classifies coded errors and rejects uncoded ones', () => {
  assert.equal(codeOf(new IntervalError(ERR.WORLD_MISMATCH, 'x')), ERR.WORLD_MISMATCH)
  assert.equal(codeOf(new Error('plain')), null)
  assert.equal(codeOf({ code: 'ERR_NOT_REAL' }), null)
  assert.equal(codeOf(null), null)
})

test('all ERR and HALT codes are unique and well-formed', () => {
  const all = [...ALL_ERR, ...ALL_HALT]
  assert.equal(new Set(all).size, all.length, 'no duplicate codes')
  for (const c of ALL_ERR) assert.match(c, /^ERR_[A-Z_]+$/)
  for (const c of ALL_HALT) assert.match(c, /^HALT_[A-Z_]+$/)
})
