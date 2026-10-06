// §5g-ii: THE BROWSER'S FOLD MUST BE THE ENGINE'S FOLD.
//
// A browser player has no filesystem and cannot BUILD their own proof: the
// path is a walk over every living citizen and that window holds no such tree.
// So the node serves it at /api/proof, and the only thing that keeps that from
// being an act of trust is that the window checks the fold itself before it
// keeps anything.
//
// Which means the window's fold has to agree with `_smtFold` to the byte. If it
// drifts, the window quietly refuses every honest proof the node serves and a
// browser player is unarchived without being told. That is the worst shape a
// bug can take here, so the two are held against each other.
//
// The window's code is sliced out of the page and run against roots and paths
// the ENGINE built. Braces are counted rather than anchoring on a string from
// the last line, because that anchor has broken twice already in this suite.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import E from '../engine.js'

const RULES = 'g'.repeat(64)
const html = readFileSync(new URL('../window-web.html', import.meta.url), 'utf8')

function lift (name, kind) {
  const at = html.indexOf(kind + ' ' + name)
  assert.ok(at > 0, `window-web.html should still define ${name}`)
  let i = html.indexOf('{', at), d = 0, end = i
  for (; i < html.length; i++) {
    if (html[i] === '{') { d++ }
    else if (html[i] === '}') { d--; if (d === 0) { end = i; break } }
  }
  return html.slice(at, end + 1)
}

// ONE CONTIGUOUS BLOCK, plus the two helpers it leans on. Assembling it from
// half a dozen single-line slices duplicated a declaration the first time;
// taking the whole run from `SMT_DEPTH_W` to the end of the fold cannot.
const block = (() => {
  const from = html.indexOf('const SMT_DEPTH_W = 64')
  assert.ok(from > 0, 'window-web.html should still define the fold')
  const fn = html.indexOf('async function provesLivingWeb', from)
  let i = html.indexOf('{', fn), d = 0, end = i
  for (; i < html.length; i++) {
    if (html[i] === '{') { d++ }
    else if (html[i] === '}') { d--; if (d === 0) { end = i; break } }
  }
  return html.slice(from, end + 1)
})()
const src = [
  lift('canonicalJS', 'function'),
  html.slice(html.indexOf('const toHex ='), html.indexOf('\n', html.indexOf('const toHex ='))),
  block,
].join('\n')

const provesLivingWeb = (0, eval)(src + '\n;provesLivingWeb')

function worldOf (n) {
  const g = E.makeGenesis('proofweb', RULES, 0, 40, 30)
  const s = E.newWorld(g)
  const who = []
  for (let i = 0; i < n; i++) {
    const w = E.generateIdentity()
    E.addPlayer(s, w.playerId, 5 + (i % 15), 5 + Math.floor(i / 15))
    who.push(w)
  }
  return { s, who }
}

test('the window folds a real proof to the engine\'s own root', async () => {
  for (const n of [1, 2, 5, 23]) {
    const { s, who } = worldOf(n)
    const root = E.livingRootOf(s)
    for (const w of who) {
      const path = E.livingPathOf(s, w.playerId)
      const rec = JSON.parse(JSON.stringify(s.players[w.playerId]))   // as JSON would deliver it
      assert.equal(await provesLivingWeb(root, w.playerId, rec, path), true,
        `the window must accept an honest proof in a world of ${n}`)
    }
  }
})

test('and refuses a doctored one, exactly as the engine does', async () => {
  const { s, who } = worldOf(9)
  const root = E.livingRootOf(s)
  const me = who[0].playerId
  const path = E.livingPathOf(s, me)
  const rec = JSON.parse(JSON.stringify(s.players[me]))

  const forged = JSON.parse(JSON.stringify(rec))
  forged.gold = 1_000_000
  assert.equal(await provesLivingWeb(root, me, forged, path), false,
    'a node that served a flattering record must be caught by the window')

  assert.equal(await provesLivingWeb(root, who[1].playerId, s.players[who[1].playerId], path), false,
    'another citizen\'s path must not prove them')
  assert.equal(await provesLivingWeb('f'.repeat(64), me, rec, path), false,
    'nor may a made-up root be folded to')
  assert.equal(await provesLivingWeb(root, me, rec, { bits: path.bits, sibs: [] }), false,
    'a path missing its siblings proves nothing')
  assert.equal(await provesLivingWeb(root, me, rec, { bits: path.bits, sibs: [...path.sibs, 'a'.repeat(64)] }), false,
    'and a spare sibling is refused: one form only, as the engine insists')
})

// ---------- and the browser's SEAL must be the protocol's seal ----------
//
// The same argument one layer up. The window now checks the witnesses'
// signatures over the root before it keeps a proof, which means it rebuilds
// the signed payload itself: the domain string, the protocol version, and the
// exact field set of `attCore` in canonical order. Any drift in any of those
// and the window refuses every honest seal and quietly keeps nothing, which
// is the same silent failure the fold test exists to prevent.
//
// So the window's verifier is run against seals the PROTOCOL made.
const sealSrc = [
  lift('canonicalJS', 'function'),
  html.slice(html.indexOf('const IK_hex ='), html.indexOf('\n', html.indexOf('const IK_hex ='))),
  html.slice(html.indexOf("const ATT_DOMAIN_W ="), html.indexOf('\n', html.indexOf('const ATT_V_W ='))),
  lift('attOkW', 'async function'),
  lift('sealOkW', 'async function'),
].join('\n')
const sealOkW = (0, eval)(sealSrc + '\n;sealOkW')

test('the window verifies a seal the protocol signed', async () => {
  const P = await import('../protocol.mjs')
  const wk = [E.generateIdentity(), E.generateIdentity(), E.generateIdentity()]
  const g = E.makeGenesis('proofweb-seal', RULES, 0, 40, 30)
  g.witnesses = wk.map(k => k.playerId)
  g.quorum = 2
  g.byzantineTolerance = 0
  const worldId = E.worldId(g)
  const s = E.newWorld(g)
  const me = E.generateIdentity()
  E.addPlayer(s, me.playerId, 5, 5)
  const next = E.nextState(s, [])
  const root = next.livingRoot
  assert.ok(root, 'the world has a root to seal')

  const atts = wk.slice(0, 2).map(k => P.makeAttestation({
    worldId, tick: 0, round: 0, bundleHash: 'a'.repeat(64),
    resultingStateHash: E.stateHash(next), livingRoot: root, witness: k,
  }))
  const seal = { worldId, tick: 1, livingRoot: root, attestations: atts }
  assert.equal(P.verifyLivingSeal(g, worldId, seal), null, 'the protocol accepts it')
  assert.equal(await sealOkW(g, worldId, seal, root, 1), true, 'and so does the window')

  const bend = async (f) => { const x = JSON.parse(JSON.stringify(seal)); f(x); return await sealOkW(g, worldId, x, root, 1) }
  assert.equal(await bend(x => { x.attestations[0].livingRoot = 'b'.repeat(64) }), false, 'a bent root fails')
  assert.equal(await bend(x => { x.attestations[0].tick = 1 }), false, 'the off-by-one is the protocol\'s')
  assert.equal(await bend(x => { x.attestations = [x.attestations[0]] }), false, 'short of a quorum fails')
  assert.equal(await bend(x => { x.attestations[1] = x.attestations[0] }), false, 'one witness twice is not two')
  assert.equal(await bend(x => { x.attestations[0].round = 1 }), false, 'mixed rounds fail')
  assert.equal(await sealOkW(g, worldId, seal, 'c'.repeat(64), 1), false, 'a seal for another root fails')
  assert.equal(await sealOkW(g, worldId, seal, root, 2), false, 'a seal for another interval fails')

  // a stranger's signatures, perfectly valid in themselves
  const stranger = E.generateIdentity()
  const outside = {
    worldId, tick: 1, livingRoot: root,
    attestations: atts.map(a => P.makeAttestation({
      worldId: a.worldId, tick: a.tick, round: a.round, bundleHash: a.bundleHash,
      resultingStateHash: a.resultingStateHash, livingRoot: a.livingRoot, witness: stranger,
    })),
  }
  assert.equal(await sealOkW(g, worldId, outside, root, 1), false, 'somebody who is not a witness here')
})

// ---------- and the browser's eligibility must be the protocol's ----------
//
// The window decides on its own whether to walk a citizen into a world that
// claims to continue theirs. That decision is mirrored code, and mirrored code
// drifts: if the window's copy were looser, a citizen would be carried into a
// world with different rules; if tighter, they would be locked out of their
// own. So the two are held against each other on the same inputs.
const elgSrc = [
  lift('canonicalJS', 'function'),
  html.slice(html.indexOf('const toHex ='), html.indexOf('\n', html.indexOf('const toHex ='))),
  html.slice(html.indexOf('const IK_hex ='), html.indexOf('\n', html.indexOf('const IK_hex ='))),
  html.slice(html.indexOf("const ATT_DOMAIN_W ="), html.indexOf('\n', html.indexOf('const ATT_V_W ='))),
  // NOT `lift`: `sha256hex` is a two-line arrow with no braces of its own, so
  // brace-matching runs on into the next declaration and swallows it. It did,
  // and the eval then redefined `emptyTableW` globally without the closure it
  // needs, which broke the fold tests above rather than this one. Sliced to
  // the start of the next declaration instead.
  html.slice(html.indexOf('const sha256hex ='), html.indexOf('async function emptyTableW')),
  html.slice(html.indexOf('const TICK_MS_W ='), html.indexOf('\n', html.indexOf('const ABANDON_GAP_MS_W ='))),
  lift('handoverOkW', 'async function'),
  lift('eligibleW', 'async function'),
  lift('acceptSuccessorW', 'async function'),
  lift('continuationW', 'async function'),
].join('\n')
const [eligibleW, acceptSuccessorW] = (0, eval)(elgSrc + '\n;[eligibleW, acceptSuccessorW]')

test('the window and the protocol agree about who may continue a world', async () => {
  const P = await import('../protocol.mjs')
  const wk = [E.generateIdentity(), E.generateIdentity(), E.generateIdentity()]
  const g1 = E.makeGenesis('web-eligible', RULES, 0, 40, 30)
  g1.witnesses = wk.map(k => k.playerId)
  g1.quorum = 2
  g1.byzantineTolerance = 0
  const ENDED = 400000
  const endedMs = (g1.anchorMs ?? 0) + ENDED * E.TICK_MS

  const mk = () => {
    const g = E.makeGenesis('web-eligible', RULES, 0, 40, 30)
    g.from = { worldId: E.worldId(g1), livingRoot: 'a'.repeat(64), tick: ENDED }
    g.anchorMs = endedMs
    g.witnesses = [wk[0].playerId]
    g.quorum = 1
    g.byzantineTolerance = 0
    return g
  }

  // the window cannot be handed a clock, so compare on the cases where the gap
  // is not what decides: a handover, and the ways a world is not the same one.
  const g2 = mk()
  const handover = wk.slice(0, 2).map(k => P.makeHandover({
    worldId: E.worldId(g1), successor: E.worldId(g2), witness: k,
  }))
  assert.equal(P.eligible(g1, g2, { nowMs: endedMs + 1000, handover }), null)
  assert.equal(await eligibleW(g1, g2, handover), null, 'the window accepts the handover too')

  for (const [bend, why] of [
    [(g) => { g.rulesHash = 'b'.repeat(64) }, 'the rules are not the same rules'],
    [(g) => { g.engineHash = 'c'.repeat(64) }, 'a different engine'],
    [(g) => { g.genesisSeed = 'elsewhere' }, 'a different island'],
    [(g) => { g.worldH = 90 }, 'a different island'],
    [(g) => { delete g.from }, 'this world continues nothing'],
  ]) {
    const g = mk(); bend(g)
    assert.equal(P.eligible(g1, g, { nowMs: endedMs + 1000, handover }), why)
    assert.equal(await eligibleW(g1, g, handover), why, 'and the window says the same words')
  }

  // and every way a handover fails, said identically on both sides
  for (const [bend, why] of [
    [(h) => { h.length = 1 }, 'handover: short of a quorum of the old world’s witnesses'],
    [(h) => { h[1] = h[0] }, 'handover: the same witness counted twice'],
    [(h) => { h[0].successor = 'd'.repeat(64) }, 'handover: a handover naming another successor'],
    [(h) => { h[0].worldId = 'e'.repeat(64) }, 'handover: a handover from another world'],
    [(h) => { h[0].sig = '0'.repeat(128) }, 'handover: bad handover signature'],
  ]) {
    const h = JSON.parse(JSON.stringify(handover)); bend(h)
    const mine = P.eligible(g1, g2, { nowMs: endedMs + 1000, handover: h })
      .replace('old world\'s', 'old world’s')
    assert.equal(mine, why)
    assert.equal(await eligibleW(g1, g2, h), why, 'and the window refuses it the same way')
  }
})

test('the window and the protocol agree about an offer from a stranger', async () => {
  const P = await import('../protocol.mjs')
  const wk = [E.generateIdentity(), E.generateIdentity(), E.generateIdentity()]
  const g1 = E.makeGenesis('web-offer', RULES, 0, 40, 30)
  g1.witnesses = wk.map(k => k.playerId)
  g1.quorum = 2
  g1.byzantineTolerance = 0
  const ENDED = 300000
  const endedMs = (g1.anchorMs ?? 0) + ENDED * E.TICK_MS

  const g2 = E.makeGenesis('web-offer', RULES, 0, 40, 30)
  g2.from = { worldId: E.worldId(g1), livingRoot: 'a'.repeat(64), tick: ENDED }
  g2.anchorMs = endedMs
  g2.witnesses = [wk[0].playerId]
  g2.quorum = 1
  g2.byzantineTolerance = 0
  const handover = wk.slice(0, 2).map(k => P.makeHandover({
    worldId: E.worldId(g1), successor: E.worldId(g2), witness: k,
  }))

  const good = { v: 1, how: 'self', worldId: E.worldId(g2), genesis: g2, handover }
  assert.equal(P.acceptSuccessor(g1, good, { nowMs: endedMs + 1000 }), null)
  assert.equal(await acceptSuccessorW(g1, good), null, 'the window follows it too')

  // THE ATTACK THIS CLOSES: a liar pairs a founding everybody would accept
  // with the id of a world they control, hoping the client believes the number
  // beside the founding rather than hashing the founding itself.
  const swapped = { ...good, worldId: 'f'.repeat(64) }
  const why = 'the offer names an id that is not the hash of the founding it carries'
  assert.equal(P.acceptSuccessor(g1, swapped, { nowMs: endedMs + 1000 }), why)
  assert.equal(await acceptSuccessorW(g1, swapped), why, 'and the window hashes it as well')

  for (const [offer, want] of [
    [{ v: 1 }, 'the offer carries no founding'],
    [null, 'malformed offer'],
  ]) {
    assert.equal(P.acceptSuccessor(g1, offer, { nowMs: endedMs + 1000 }), want)
    assert.equal(await acceptSuccessorW(g1, offer), want)
  }

  // An offer with no handover falls back to the gap. Only the protocol side is
  // compared here: the window reads the real clock and cannot be handed one, so
  // for a founding anchored in 1970 the month has long since passed and it is
  // right to accept. The gap arithmetic itself is held in
  // `test/succession.test.mjs`, where a clock can be supplied.
  const noHandover = { ...good, handover: null }
  assert.match(P.acceptSuccessor(g1, noHandover, { nowMs: endedMs + 86400000 }), /founded too soon/)
  assert.equal(await acceptSuccessorW(g1, noHandover), null,
    'and the window, reading today\'s clock, finds the silence long over')
})
