// Interval protocol layer (fix brief Milestone 4, §1): schemas, canonical
// encodings, hashes, signature domains, and limits for certified interval
// bundles. Pure functions only: no networking, no clocks, no state.
//
// The objects on the wire:
//
//   IntervalBundle (proposed by the round's witness):
//     { v, worldId, tick, round, previousStateHash, proposer, inputs[], sig }
//   Attestation (signed by each verifying witness):
//     { v, worldId, tick, round, bundleHash, resultingStateHash, livingRoot,
//       witness, sig }
//   FinalityRecord (a bundle + a quorum of matching attestations):
//     { tick, round, previousStateHash, bundleHash, resultingStateHash, livingRoot,
//       bundle, attestations[] }
//
// The proposer cannot invent player actions (every input stays
// player-signed) and cannot forge outcomes (every witness recomputes the
// transition before signing). Finality is the quorum, not the clock.

import E from './engine.js'

// 3: §5g-ii put the root over the living into what a witness signs, so a
// citizen's own proof can be verified against a founding's witness list for
// ever, with no state and nobody's cooperation. The signed payload changed, so
// the version did.
export const PROTOCOL_VERSION = 3

export const BUNDLE_DOMAIN = 'INTERVAL_BUNDLE_V1|'
export const ATTESTATION_DOMAIN = 'INTERVAL_ATTESTATION_V1|'

export const HEX64 = /^[0-9a-f]{64}$/

export const AGREEMENT = {
  // §1c: ONE INTERVAL. This was 600 -- the same number as the tick, written out
  // a second time in a second file, so when the interval became a second the
  // consensus schedule stayed behind and every round window was six tenths of
  // a tick. Twenty-seven agreement tests failed on it: proposers were judged
  // vanished before the interval they were proposing for had finished.
  // A round is one interval, whatever an interval is.
  ROUND_TIMEOUT_MS: E.TICK_MS,    // a vanished proposer costs one round, not the world
  ROUND_BACKOFF_CAP: 6,           // exponential round windows, capped at 2^6
  MAX_SKEW_MS: 150,               // clock slack when judging round windows
  MAX_INPUTS_PER_PLAYER: 2,       // one action + at most one equivocation proof
  MAX_INPUTS_PER_BUNDLE: 65536,  // == engine MAX_APPLIED_INPUTS; a bundle may carry a full tick
  // Sized FROM the input cap, not chosen independently. A signed input measures
  // ~331 bytes on the wire, so a full 65536-input bundle is ~21.7 MB: at the
  // old 1 MiB a proposer could assemble a bundle lawful by count and illegal by
  // size, and would do so first under exactly the load that matters.
  //
  // 32 MiB is a CEILING, not an expectation. It is never approached at any
  // operating point: the working limit is CPU and admission bandwidth, both
  // tunable, both far below this. What it must not do is become a second,
  // invisible input cap -- which is precisely what 1 MiB was.
  MAX_BUNDLE_BYTES: 32 * 1024 * 1024,
  MAX_ATTESTATION_BYTES: 2 * 1024,
  MAX_FINALITY_BYTES: 2 * 1024 * 1024,
  MAX_FINALIZED_HISTORY: 512,     // in-memory certified-bundle log retention
  MAX_CATCHUP_RECORDS: 64,        // finality records per replay response
  MAX_PENDING_TICKS: 64,          // distinct future ticks accepting inputs
  MAX_PROPOSALS_PER_TICK: 16,     // verified bundles held per interval
}

// ---------- constitutional quorum safety (CONSENSUS.md §1) ----------
// Byzantine Safety Upgrade: quorum INTERSECTION (2q > n) is not enough, the
// intersection can be a single witness who, if Byzantine, double-signs into
// conflicting certificates. The constitutional fault model fixes a threshold
// f and requires n >= 3f+1, q >= 2f+1, and 2q-n > f, so every quorum
// intersection holds >= f+1 witnesses and thus at least one honest one.
// Checked at world construction AND inside every proof verification.
export function quorumSafe(genesis) {
  const n = Array.isArray(genesis.witnesses) ? genesis.witnesses.length : 0
  const q = genesis.quorum
  const f = genesis.byzantineTolerance
  return E.byzantineSafe(n, q, f)
}

// ---------- input identity ----------
// The hash covers the SIGNED input, so two different signatures over the
// same action are two distinct inputs, which is exactly what equivocation
// evidence needs (fix brief §4.2).
export function inputHash(input) {
  return E.sha256(Buffer.from(E.canonical(input))).toString('hex')
}

// Canonical bundle order (fix brief Stage D): by playerId, then inputHash.
export function sortInputs(inputs) {
  return [...inputs].sort((a, b) => {
    if (a.playerId !== b.playerId) return a.playerId < b.playerId ? -1 : 1
    const ha = inputHash(a), hb = inputHash(b)
    return ha < hb ? -1 : ha > hb ? 1 : 0
  })
}

// Bundle building by WHOLE player groups (CONSENSUS.md §3): players in
// ascending order, each player's (<=2) versions together or not at all.
// A detected equivocation pair is never split by the cap: including only
// one side would silently launder an equivocation into a normal action.
export function selectBundleInputs(byPlayer, cap = AGREEMENT.MAX_INPUTS_PER_BUNDLE) {
  const out = []
  for (const pid of [...byPlayer.keys()].sort()) {
    const group = sortInputs([...byPlayer.get(pid).values()])
    if (out.length + group.length > cap) break
    out.push(...group)
  }
  return out // globally canonical: players ascend, hashes ascend within
}

// ---------- equivocation evidence (CONSENSUS.md §2, §7) ----------
export function inputEquivocationEvidence(a, b) {
  if (!a || !b || a.playerId !== b.playerId || a.tick !== b.tick) return null
  const ha = inputHash(a), hb = inputHash(b)
  if (ha === hb) return null
  if (!E.verifyInputSig(a) || !E.verifyInputSig(b)) return null
  const [A, B] = ha < hb ? [a, b] : [b, a]
  return { type: 'input-equivocation', playerId: a.playerId, tick: a.tick, inputA: A, inputB: B }
}

export function proposerEquivocationEvidence(a, b) {
  if (!a || !b || a.proposer !== b.proposer || a.tick !== b.tick || a.round !== b.round || a.worldId !== b.worldId) return null
  if (bundleHash(a) === bundleHash(b)) return null
  if (!verifyBundleSig(a) || !verifyBundleSig(b)) return null
  const [A, B] = bundleHash(a) < bundleHash(b) ? [a, b] : [b, a]
  return { type: 'proposer-equivocation', tick: a.tick, round: a.round, proposer: a.proposer, bundleA: A, bundleB: B }
}

// ---------- bundles ----------
function bundleCore(b) {
  return {
    v: b.v, worldId: b.worldId, tick: b.tick, round: b.round,
    previousStateHash: b.previousStateHash, proposer: b.proposer, inputs: b.inputs,
  }
}

export function bundlePayload(b) {
  return Buffer.from(BUNDLE_DOMAIN + E.canonical(bundleCore(b)))
}

export function bundleHash(b) {
  return E.sha256(bundlePayload(b)).toString('hex')
}

export function makeBundle({ worldId, tick, round, previousStateHash, inputs, witness }) {
  const core = {
    v: PROTOCOL_VERSION, worldId, tick, round, previousStateHash,
    proposer: witness.playerId, inputs: sortInputs(inputs),
  }
  return { ...core, sig: E.signPayload(bundlePayload(core), witness.privateKey) }
}

export function verifyBundleSig(b) {
  if (typeof b?.sig !== 'string' || typeof b?.proposer !== 'string') return false
  return E.verifyPayload(b.sig, bundlePayload(b), b.proposer)
}

// ---------- attestations ----------
// §5g-ii: AND THE ROOT OVER THE LIVING IS SIGNED TOO.
//
// A witness already commits to `resultingStateHash`, which covers the root
// transitively, because the root is a field of the state. That is not enough
// for the thing the root exists for: a citizen keeping their own record and
// path can only USE it if somebody can confirm that root was real at that
// interval, and a flat hash over the whole state yields no inclusion proof. So
// confirming it meant producing the entire state, which is the dependency the
// roots were invented to remove.
//
// Signed here, a kept proof becomes verifiable BY ANYONE, FOR EVER, against
// nothing but the founding's own witness list: these keys, named in the
// genesis, say root R stood at interval N of world W. No successor has to
// cooperate and no checkpoint has to survive.
//
// NULL IS A REAL VALUE and is signed as one. There are no optional fields
// here, so an attestation that does not vouch for a root says so explicitly.
// That keeps every existing caller -- the sims and nine test files -- honest
// without pretending they attested something they did not.
function attCore(a) {
  return {
    v: a.v, worldId: a.worldId, tick: a.tick, round: a.round,
    bundleHash: a.bundleHash, resultingStateHash: a.resultingStateHash,
    livingRoot: a.livingRoot ?? null, witness: a.witness,
  }
}

export function attestationPayload(a) {
  return Buffer.from(ATTESTATION_DOMAIN + E.canonical(attCore(a)))
}

export function makeAttestation({ worldId, tick, round, bundleHash: bh, resultingStateHash,
  livingRoot = null, witness }) {
  const core = {
    v: PROTOCOL_VERSION, worldId, tick, round,
    bundleHash: bh, resultingStateHash, livingRoot: livingRoot ?? null,
    witness: witness.playerId,
  }
  return { ...core, sig: E.signPayload(attestationPayload(core), witness.privateKey) }
}

export function verifyAttestationSig(a) {
  if (typeof a?.sig !== 'string' || typeof a?.witness !== 'string') return false
  return E.verifyPayload(a.sig, attestationPayload(a), a.witness)
}

// ---------- §5g-ii: the seal over the living ----------
//
// A SEAL is the smallest thing that can carry the sentence "root R stood over
// the living at interval N of world W, and these witnesses said so". It is a
// quorum of attestations stripped of the bundle: a few hundred bytes, kept
// beside a citizen's own record and path, and checkable for ever against
// nothing but the founding.
//
//   { worldId, tick, livingRoot, attestations[] }
//
// MIND THE OFF-BY-ONE. An attestation's own `tick` is the interval the bundle
// applied AT; the state it produced is the interval after. So a seal for the
// state at interval N is built from attestations whose tick is N-1, and
// `sealTickOf` is the only place that arithmetic is written down.
export function sealTickOf(a) { return a.tick + 1 }

export function makeSeal(worldId, record) {
  return {
    worldId,
    tick: record.tick + 1,
    livingRoot: record.livingRoot ?? null,
    attestations: record.attestations,
  }
}

// Returns null when the seal is good, or why it is not. It needs the genesis
// and nothing else: no state, no checkpoint, no node still running, and no
// cooperation from whoever took the world over.
export function verifyLivingSeal(genesis, worldId, seal) {
  if (!seal || typeof seal !== 'object') return 'malformed'
  if (!quorumSafe(genesis)) return 'Byzantine-unsafe quorum configuration (need n>=3f+1, q>=2f+1, 2q-n>f)'
  if (seal.worldId !== worldId) return 'seal is for another world'
  if (!Number.isInteger(seal.tick) || seal.tick < 1) return 'malformed tick'
  if (typeof seal.livingRoot !== 'string' || !HEX64.test(seal.livingRoot)) return 'malformed living root'
  if (!Array.isArray(seal.attestations) || seal.attestations.length < genesis.quorum) return 'short of a quorum'

  const allowed = new Set(genesis.witnesses ?? [])
  const seen = new Set()
  let round = null
  for (const a of seal.attestations) {
    if (!a || typeof a !== 'object') return 'malformed attestation'
    if (a.v !== PROTOCOL_VERSION) return 'attestation wrong protocol version'
    if (a.worldId !== worldId) return 'attestation for another world'
    if (!Number.isInteger(a.tick) || sealTickOf(a) !== seal.tick) return 'attestation for another interval'
    // certificate coherence, as everywhere else: a seal assembled from two
    // rounds is not a certificate, it is a collage. Where a quorum really did
    // sign two roots for one interval, that is equivocation and evidence of
    // it, not a thing a citizen should be able to pick between.
    if (round === null) round = a.round
    else if (a.round !== round) return 'seal mixes rounds'
    if (!allowed.has(a.witness)) return 'attestation from somebody who is not a witness of this world'
    if (seen.has(a.witness)) return 'the same witness counted twice'
    if (a.livingRoot !== seal.livingRoot) return 'attestation vouches for a different root'
    seen.add(a.witness)
    if (!verifyAttestationSig(a)) return 'bad attestation signature'
  }
  if (seen.size < genesis.quorum) return 'short of a quorum'
  return null
}

// The whole sentence a kept proof makes, checked end to end: these witnesses
// sealed this root at this interval, and this record folds to it under this
// identity. Everything a successor needs to seat somebody, and everything a
// citizen needs to know their file is still worth keeping.
export function verifyKeptProof(proof) {
  if (!proof || typeof proof !== 'object') return 'malformed'
  const g = proof.genesis
  if (!g || typeof g !== 'object') return 'the proof carries no founding'
  const wid = E.worldId(g)
  if (proof.worldId && proof.worldId !== wid) return 'the founding does not hash to the named world'
  if (!proof.seal) return 'unsealed: no witness vouched for this root'
  const serr = verifyLivingSeal(g, wid, proof.seal)
  if (serr) return 'seal: ' + serr
  if (proof.seal.livingRoot !== proof.livingRoot) return 'the seal is for a different root'
  if (Number.isInteger(proof.tick) && proof.tick !== proof.seal.tick) return 'the seal is for a different interval'
  if (!E.provesLiving(proof.livingRoot, proof.playerId, proof.record, proof.path))
    return 'the record does not fold to the sealed root'
  return null
}

// ---------- §9b-iii: IS THIS WORLD REALLY A CONTINUATION? ----------
//
// Anybody may found a world that claims to continue another, and the engine
// cannot judge the claim: it holds the successor's genesis and has never seen
// the predecessor's. A CITIZEN can, because their kept proof carries the
// founding they lived under. So this is the check their own client makes
// before it walks them into anything.
//
// It is the answer to the sharpest objection to the whole succession design:
// if a successor can be founded by anyone, the first to found one gets to
// change whatever they like, and everybody converges on it because that is
// where their friends went. The line is only worth inheriting if it is the
// SAME WORLD, and every clause below is checkable by a citizen holding one
// small file.
//
//   the rules      byte-identical, by hash. THE LINE IS THE RULES: a world
//                  under different rules does not inherit this one, however
//                  faithfully it carries the people.
//   the engine     identical where the predecessor named one (§2n).
//   the island     same generator, same seed, same dimensions, so the
//                  geography hash is identical and every place-name a citizen
//                  walked still means what it meant.
//   the moment     not backdated before the predecessor's last interval. A
//                  world cannot be founded into the past to win a tie.
//
// What a founder still chooses is the witness set and when. Nothing else.
export function continuation(oldG, newG) {
  if (!oldG || typeof oldG !== 'object') return 'no founding to compare against'
  if (!newG || typeof newG !== 'object') return 'malformed founding'
  const from = newG.from
  if (!from) return 'this world continues nothing'
  if (from.worldId !== E.worldId(oldG)) return 'this world continues a different one'
  if (newG.rulesHash !== oldG.rulesHash) return 'the rules are not the same rules'
  if ((oldG.engineHash ?? null) !== (newG.engineHash ?? null)) return 'a different engine'
  if (newG.worldGenerator !== oldG.worldGenerator) return 'a different island'
  if (newG.genesisSeed !== oldG.genesisSeed) return 'a different island'
  if (newG.worldW !== oldG.worldW || newG.worldH !== oldG.worldH) return 'a different island'
  if (oldG.geographyHash && newG.geographyHash && oldG.geographyHash !== newG.geographyHash)
    return 'a different island'
  // The predecessor ran until `from.tick`, so its last interval fell at
  // anchor + tick * TICK_MS. A successor anchored before that claims to have
  // begun before the world it continues had finished.
  const ended = (oldG.anchorMs ?? 0) + from.tick * E.TICK_MS
  if ((newG.anchorMs ?? 0) < ended) return 'founded before the world it continues had ended'
  return null
}

// ---------- §9b-iii: WHEN MAY A SUCCESSOR BE FOUNDED? ----------
//
// `continuation` asks whether a world is the same world. This asks whether it
// was entitled to start. Both are a citizen's questions, answered by their own
// client, because nothing on a network can decide them.
//
// THE PROBLEM IS NOT A HOSTILE SUCCESSOR. It is an EAGER one. A world whose
// witnesses are merely offline for an afternoon has not ended, and a successor
// founded in that afternoon would split the people in it: some walk into the
// new world with their files while the old one comes back up, and then both
// exist, with the same citizens in each and no way to reconcile them. Nobody
// has to be malicious for that; being keen is enough.
//
// So there are two ways in and no others.
//
//   THE GAP. A month of silence after the predecessor's last certified
//   interval. Long enough that nobody mistakes a holiday for an ending, short
//   enough that a world is not held hostage by people who have stopped
//   caring. §7dw already calls a world abandoned after a day for the purposes
//   of the tick; this is a far longer silence for a far larger claim.
//
//   THE HANDOVER. A quorum of the predecessor's own witnesses sign the
//   successor's worldId. Then there is nothing to wait for: the people who
//   could have kept the old world going have said in signatures that they are
//   not going to. It is the graceful ending, and it is the one the founder of
//   this project can use for the world they already run.
//
// A handover names ONE successor. It cannot be reused, because the worldId it
// signs commits to the whole founding, and two rival successors have two
// worldIds. A witness who signs two handovers has equivocated, in public, with
// their own key, and anybody holding both can show it.
export const HANDOVER_DOMAIN = 'INTERVAL_HANDOVER_V1|'
export const ABANDON_GAP_MS = 30 * 24 * 60 * 60 * 1000   // a month of silence

function handoverCore(h) {
  return { v: h.v, worldId: h.worldId, successor: h.successor, witness: h.witness }
}
function handoverPayload(h) {
  return Buffer.from(HANDOVER_DOMAIN + E.canonical(handoverCore(h)))
}

// Signed by one witness of the world that is ending. A handover is a bundle of
// these, which is why each one stands alone and is verified alone.
export function makeHandover({ worldId, successor, witness }) {
  const core = { v: PROTOCOL_VERSION, worldId, successor, witness: witness.playerId }
  return { ...core, sig: E.signPayload(handoverPayload(core), witness.privateKey) }
}

export function verifyHandoverSig(h) {
  if (typeof h?.sig !== 'string' || typeof h?.witness !== 'string') return false
  return E.verifyPayload(h.sig, handoverPayload(h), h.witness)
}

// Returns null when a quorum of the OLD world's witnesses have handed this
// exact successor the line, or why they have not.
export function verifyHandover(oldG, successorWorldId, signatures) {
  if (!Array.isArray(signatures) || !signatures.length) return 'no handover'
  const quorum = oldG?.quorum | 0
  if (!quorum) return 'the world that ended had no witnesses to hand anything over'
  const allowed = new Set(oldG.witnesses ?? [])
  const oldId = E.worldId(oldG)
  const seen = new Set()
  for (const h of signatures) {
    if (!h || typeof h !== 'object') return 'malformed handover'
    if (h.v !== PROTOCOL_VERSION) return 'handover wrong protocol version'
    if (h.worldId !== oldId) return 'a handover from another world'
    if (h.successor !== successorWorldId) return 'a handover naming another successor'
    if (!allowed.has(h.witness)) return 'a handover from somebody who was not a witness'
    if (seen.has(h.witness)) return 'the same witness counted twice'
    seen.add(h.witness)
    if (!verifyHandoverSig(h)) return 'bad handover signature'
  }
  if (seen.size < quorum) return 'short of a quorum of the old world\'s witnesses'
  return null
}

// THE WHOLE QUESTION A CITIZEN ASKS BEFORE WALKING IN: is it the same world,
// and was it entitled to begin? `lastCertifiedMs` is when the predecessor's
// last certified interval fell, which `from.tick` and the old anchor give.
export function eligible(oldG, newG, { nowMs = Date.now(), handover = null } = {}) {
  const same = continuation(oldG, newG)
  if (same) return same
  if (handover) {
    const bad = verifyHandover(oldG, E.worldId(newG), handover)
    if (!bad) return null
    // A BROKEN HANDOVER IS NOT A SILENT FALLBACK TO THE GAP. Somebody produced
    // signatures and they do not hold, which is worth saying rather than
    // quietly waiting a month instead.
    return 'handover: ' + bad
  }
  const ended = (oldG.anchorMs ?? 0) + newG.from.tick * E.TICK_MS
  const waited = nowMs - ended
  if (waited < ABANDON_GAP_MS) {
    const left = Math.ceil((ABANDON_GAP_MS - waited) / 86400000)
    return `founded too soon: the world it continues fell silent less than a month ago (${left} day(s) to go, or a handover from its witnesses)`
  }
  return null
}

// ---------- §9b-iii: AN OFFER OF A SUCCESSOR, FROM A STRANGER ----------
//
// A citizen whose world has stopped asks every node they have ever heard of
// where it went. What comes back is an OFFER: a founding, and the id it claims
// to be, and a handover if there was one. It arrives from somebody with no
// standing to say anything, which is fine, because none of it is believed.
//
// Two things have to hold and both are arithmetic:
//
//   the id is the hash of the FOUNDING OFFERED, so a liar cannot pair a world
//   everybody trusts with the address of a world they control, and
//
//   the founding is eligible: the same rules, the same engine, the same
//   island, no backdating, and either a month of silence or a quorum of the
//   old world's own witnesses.
//
// Returns null when the offer may be followed, or why it may not. The caller
// supplies `keptGenesis` from the citizen's own proof file, which is the only
// thing in this exchange that was never handed to them by a stranger.
export function acceptSuccessor(keptGenesis, offer, { nowMs = Date.now() } = {}) {
  if (!offer || typeof offer !== 'object') return 'malformed offer'
  if (!offer.genesis || typeof offer.genesis !== 'object') return 'the offer carries no founding'
  const wid = E.worldId(offer.genesis)
  if (offer.worldId !== undefined && offer.worldId !== wid)
    return 'the offer names an id that is not the hash of the founding it carries'
  const handover = Array.isArray(offer.handover) ? offer.handover
    : offer.handover?.signatures ?? null
  return eligible(keptGenesis, offer.genesis, { nowMs, handover })
}

// ---------- round schedule (adversarial-sim finding) ----------
// Rounds open with EXPONENTIAL backoff: round r starts at
//   due(tick) + ROUND_TIMEOUT_MS * (2^min(r, CAP) - 1)
// Under heavy loss/delay, flat rounds spawn a fresh competing bundle
// every 600 ms, and honest lock splits (H2) stall ticks within seconds.
// Geometric windows give lock REBROADCAST time to converge the earliest
// bundle before a new proposer authors a rival: a pure liveness change:
// the locking rule, and therefore safety, is untouched.
export function roundStartMs(round) {
  // round r's window is RT·2^min(r,CAP): backoff caps the WINDOW LENGTH;
  // the schedule keeps advancing linearly at the capped width beyond it
  const RT = AGREEMENT.ROUND_TIMEOUT_MS, C = AGREEMENT.ROUND_BACKOFF_CAP
  if (round <= C) return RT * (Math.pow(2, round) - 1)
  return RT * ((Math.pow(2, C) - 1) + (round - C) * Math.pow(2, C))
}
export function roundAt(elapsedMs) {
  if (elapsedMs < 0) return -1
  let r = 0
  while (roundStartMs(r + 1) <= elapsedMs) r++
  return r
}

// ---------- proposer rotation (fix brief, Option 2) ----------
// proposerIndex = (H(worldId || previousStateHash || tick) + round) mod n
// Round 0's proposer is unpredictable-but-deterministic; each fallback
// round walks to the next witness in canonical (genesis) order.
export function proposerIndex(worldId, previousStateHash, tick, round, witnessCount) {
  const h = E.sha256(Buffer.from(worldId + '|' + previousStateHash + '|' + tick))
  const base = h.readUInt32BE(0) % witnessCount
  return (base + round) % witnessCount
}

export function proposerFor(genesis, worldId, previousStateHash, tick, round) {
  const ws = genesis.witnesses
  return ws[proposerIndex(worldId, previousStateHash, tick, round, ws.length)]
}

// ---------- bundle validation (what a witness checks before attesting) ----------
// Returns an error string, or null when the bundle is well-formed for
// `state`. Game-rule validity of each input is NOT judged here: the
// engine ignores rule-invalid inputs deterministically, but signature,
// world, tick, ordering, and equivocation-cap rules are structural and
// every witness must enforce them identically.
export function validateBundle(state, worldId, bundle, expectedProposer) {
  if (!bundle || typeof bundle !== 'object') return 'malformed'
  if (bundle.v !== PROTOCOL_VERSION) return 'wrong protocol version'
  if (bundle.worldId !== worldId) return 'wrong world'
  if (!Number.isInteger(bundle.tick) || bundle.tick !== state.tick) return 'wrong tick'
  if (!Number.isInteger(bundle.round) || bundle.round < 0) return 'bad round'
  if (typeof bundle.previousStateHash !== 'string' || !HEX64.test(bundle.previousStateHash)) return 'malformed lineage hash'
  if (typeof bundle.proposer !== 'string' || !HEX64.test(bundle.proposer)) return 'malformed proposer'
  if (bundle.previousStateHash !== E.stateHash(state)) return 'wrong lineage'
  if (expectedProposer && bundle.proposer !== expectedProposer) return 'wrong proposer for round'
  if (!verifyBundleSig(bundle)) return 'bad proposer signature'
  if (!Array.isArray(bundle.inputs)) return 'malformed inputs'
  if (bundle.inputs.length > AGREEMENT.MAX_INPUTS_PER_BUNDLE) return 'too many inputs'
  const perPlayer = new Map()
  let prevKey = ''
  for (const inp of bundle.inputs) {
    if (!inp || typeof inp !== 'object') return 'malformed input'
    if (inp.worldId !== worldId) return 'input for wrong world'
    if (inp.tick !== bundle.tick) return 'input for wrong tick'
    if (typeof inp.playerId !== 'string' || !/^[0-9a-f]{64}$/.test(inp.playerId)) return 'malformed player id'
    if (E.validateInputShape(inp) !== null) return 'non-canonical input shape' // one form per action (rev7 §4)
    if (!E.verifyInputSig(inp)) return 'invalid input signature'
    const key = inp.playerId + '|' + inputHash(inp)
    if (key <= prevKey) return 'inputs not in canonical order' // also catches duplicates
    prevKey = key
    const n = (perPlayer.get(inp.playerId) ?? 0) + 1
    if (n > AGREEMENT.MAX_INPUTS_PER_PLAYER) return 'equivocation cap exceeded'
    perPlayer.set(inp.playerId, n)
  }
  return null
}

// ---------- finality proof verification (CONSENSUS.md §6.2) ----------
// THE one verifier: live finality, checkpoints, and catch-up replay all
// trust a record only through this function. A record proves finality iff
// a safe quorum of DISTINCT genesis witnesses signed the same
// (bundleHash, resultingStateHash) at the bundle's own round, for a
// bundle that is hash-bound to the record, signed by the CONSTITUTIONAL
// proposer for (previousStateHash, tick, round). Proposer verification is
// never bypassed just because a quorum exists (remaining-fixes brief §6).
export function verifyFinalityProof(genesis, worldId, record) {
  if (!record || typeof record !== 'object') return 'malformed'
  if (!quorumSafe(genesis)) return 'Byzantine-unsafe quorum configuration (need n>=3f+1, q>=2f+1, 2q-n>f)'
  if (!Number.isInteger(record.tick) || record.tick < 0) return 'malformed tick'
  if (!Number.isInteger(record.round) || record.round < 0) return 'malformed round'
  if (typeof record.previousStateHash !== 'string' || !HEX64.test(record.previousStateHash)) return 'malformed lineage'
  if (typeof record.bundleHash !== 'string' || !HEX64.test(record.bundleHash)) return 'malformed hashes'
  if (typeof record.resultingStateHash !== 'string' || !HEX64.test(record.resultingStateHash)) return 'malformed hashes'
  if (record.livingRoot !== undefined && record.livingRoot !== null && !HEX64.test(record.livingRoot))
    return 'malformed living root'

  // the bundle is mandatory and hash-bound: a proof floats free of nothing
  const b = record.bundle
  if (!b || typeof b !== 'object') return 'record carries no bundle'
  if (bundleHash(b) !== record.bundleHash) return 'bundle does not match proof'
  if (b.v !== PROTOCOL_VERSION) return 'bundle wrong protocol version'
  if (b.worldId !== worldId) return 'bundle for wrong world'
  if (b.tick !== record.tick) return 'bundle tick does not match record'
  if (b.round !== record.round) return 'bundle round does not match record'
  if (b.previousStateHash !== record.previousStateHash) return 'bundle lineage does not match record'
  if (b.proposer !== proposerFor(genesis, worldId, record.previousStateHash, record.tick, record.round))
    return 'bundle proposer is not the constitutional proposer'
  if (!verifyBundleSig(b)) return 'bad proposer signature'

  // canonical proof form (final-fixes brief §8): EXACTLY quorum
  // attestations, strictly ascending by witness key. One certificate has
  // one byte representation; oversized or shuffled proof sets are refused
  // before any signature is checked.
  if (!Array.isArray(record.attestations)) return 'no attestations'
  if (record.attestations.length !== genesis.quorum) return 'non-canonical proof: need exactly quorum attestations'
  const wset = new Set(genesis.witnesses)
  const seen = new Set()
  let prevW = ''
  for (const a of record.attestations) {
    if (typeof a?.witness !== 'string' || !HEX64.test(a.witness)) return 'malformed witness'
    if (a.witness <= prevW) return 'non-canonical proof: attestations not in witness order'
    prevW = a.witness
    if (!a || a.v !== PROTOCOL_VERSION || a.worldId !== worldId) return 'attestation for wrong world'
    if (a.tick !== record.tick) return 'attestation for wrong tick'
    if (a.round !== record.round) return 'attestation for different round'
    if (a.bundleHash !== record.bundleHash) return 'attestation for different bundle'
    if (a.resultingStateHash !== record.resultingStateHash) return 'attestation for different result'
    if (!wset.has(a.witness)) return 'attestation from non-witness'
    if (seen.has(a.witness)) return 'duplicate witness'
    // §5g-ii: and they must agree about the root, for the same reason they must
    // agree about the result. A quorum that signed two different roots for one
    // interval would make a citizen's proof depend on which signature they
    // happened to be shown.
    if ((a.livingRoot ?? null) !== (record.livingRoot ?? null)) return 'attestation for a different living root'
    if (a.livingRoot !== undefined && a.livingRoot !== null && !HEX64.test(a.livingRoot))
      return 'malformed living root in an attestation'
    if (!verifyAttestationSig(a)) return 'bad attestation signature'
    seen.add(a.witness)
  }
  if (seen.size < genesis.quorum) return 'below quorum'
  return null
}
