// Interval serve v0.9 — the browser bridge.
// Runs a solo world node + a WebSocket bridge + serves the reference
// graphical window. The browser is a pure layer-3 window: it receives
// state each tick and sends intents; the bridge signs them with the
// local identity (browser-side keys arrive with the light-client
// milestone — for localhost this custody model is honest).
//   usage: node serve.mjs [name]   then open http://localhost:8787

import fs from 'fs'
import { makeBoard } from './board.mjs'
import http from 'http'
import { WebSocketServer } from 'ws'
import E from './engine.js'
import { IntervalNode } from './node.mjs'
import { DEFAULT_STARTUP_VERIFY_RECENT_N } from './errors.mjs'
import { IntervalClient } from './sdk.mjs'
import { buildWorld, foundGenesis, roadDataOf } from './worldgen-any.mjs'

const SEED = 'solo-' + (process.env.INTERVAL_SEED || 'world')
// which country the next founding raises: INTERVAL_GEN=interval-expanse-v1
// for the meandering trails, seven settlements, and the great river.
// Only consulted at FOUNDING — a running world keeps the generator in
// its genesis forever, because the genesis is the world.
// SPEC §2l/§9d: new foundings use the FIFTH expanse. v5 keeps every acre of
// v4's land and changes only how much furniture stands on it -- half the
// landmarks, pulled toward the roads, with six named tracts that refuse them
// outright, so that a landmark is a landmark by contrast again.
const WORLD_GEN = process.env.INTERVAL_GEN || 'interval-expanse-v7'
const RULES_HASH = E.sha256(fs.readFileSync(new URL('./SPEC.md', import.meta.url))).toString('hex')
// §2n: and the engine names itself. `rulesHash` binds the constitution, which
// is prose ABOUT the rules; this binds the rules. A node running a different
// engine is running a different world, and without this it would not find out
// until somebody happened to exercise the difference -- which is the worst
// possible moment, because by then both sides have a history they believe in.
const ENGINE_HASH = E.declareEngine(fs.readFileSync(new URL('./engine.js', import.meta.url), 'utf8'))
// founding dimensions: 0 means 'the generator's own calibrated scale'
// (expanse 640x400 per SPEC §2l, classic 320x200 per §2j) — override
// with INTERVAL_W / INTERVAL_H only when you know why
const WORLD_W = Number(process.env.INTERVAL_W) || 0
const WORLD_H = Number(process.env.INTERVAL_H) || 0
// ---- INTERVAL_DATA (v0.78): the world's MEMORY lives where deploys
// cannot reach it. Every wipe this world has suffered — the lost
// citizens, twice — traced to one cause: checkpoints and identities
// sat inside the deploy directory, and a fresh unpack starts soulless.
// Point INTERVAL_DATA at a persistent path (a volume, a home dir,
// anywhere the deploy does not touch) and the class of loss ends.
const DATA = (process.env.INTERVAL_DATA || '.').replace(/\/$/, '')
if (DATA === '.') console.warn('INTERVAL_DATA is unset: world memory lives INSIDE the deploy directory. A replaced deploy is a wiped world. Set INTERVAL_DATA to a persistent path.')
const WORLD_FILE = DATA + '/checkpoints/world.json'   // the founding record
const CP_FILE = DATA + '/checkpoints/web.json'        // the living state

fs.mkdirSync('identities', { recursive: true })
fs.mkdirSync(DATA + '/checkpoints', { recursive: true })
fs.mkdirSync(DATA + '/identities', { recursive: true })

const P2P_PORT = Number(process.env.INTERVAL_P2P_PORT || 4600)

// ---- persistence across restarts and updates ----
// Same rules → resume the same world from checkpoint.
// Changed rules → found a NEW world whose genesis imports the citizens.
const KNOWN_ITEMS = E.ITEMS // ONE constitutional item registry (rev5 §4) — engine, validator, and imports all share it
let AUDIO_WARNED = false
const announced = new Map() // peerId -> { addr, at }: the mesh directory
let GENESIS, migrated = 0
let _roadsCache = null   // /api/roads: the founded world's road tiles, computed once
let _settleCache = null  // /api/settlements: the towns as the founder seated them
const saved = fs.existsSync(WORLD_FILE) ? JSON.parse(fs.readFileSync(WORLD_FILE)) : null
let savedCp = null
try { if (fs.existsSync(CP_FILE)) savedCp = JSON.parse(fs.readFileSync(CP_FILE)) } catch {}

// ---- the founding witness (fix brief Milestone 4, Phase 9) ----
// The pillar is a witness, not an authority: it proposes and attests to
// interval bundles like any other witness. Its witness key is a founding
// fact — listed in genesis, immutable for this world. Extra witnesses
// and the quorum can be set at founding via env:
//   INTERVAL_WITNESSES=pub1,pub2   INTERVAL_QUORUM=2
const WITNESS = E.loadOrCreateIdentity(fs, DATA + '/identities/witness-pillar.json')
const EXTRA_WITNESSES = (process.env.INTERVAL_WITNESSES || '').split(',').map(s => s.trim()).filter(s => /^[0-9a-f]{64}$/.test(s))

// ---- founding vs resuming (fix brief §2.4) ----
// Genesis is consensus identity and is IMMUTABLE after founding. We resume
// the same world only if the rules, the seed, and the clock all still fit.
// A long sleep no longer rebases anchorMs (that mutated the world's
// identity in place); it founds a NEW world — new anchor, new worldId —
// whose genesis imports the citizens.
// How long this world may go unattended before it is abandoned and refounded.
//
// It was 3000 ticks (30 min), chosen because replaying empty ticks costs real
// time. Measured on the Expanse that cost is about 68ms per tick, so catching
// up takes roughly a NINTH of however long the world was left: half an hour
// away is three minutes of replay, a whole day is under three hours. And
// catch-up checkpoints as it goes (node.mjs afterFinalize), so a long replay
// can be interrupted and resumed rather than started over.
//
// Against that: a crash leaves the newest checkpoint up to one interval stale,
// so at the old numbers a founder had about twenty minutes to notice a crash,
// diagnose it and fix it before the world refounded itself. That is not a
// window a person can be expected to hit, especially asleep. A world that
// claims permanence should not be lost because nobody was awake.
//
// The default is now a full day. Refounding is the last resort, not the
// timeout: it should mean "this world was abandoned", never "the founder was
// slow to wake up".
const REFOUND_GAP = Math.max(1, Number(process.env.INTERVAL_REFOUND_GAP) || 144000) // ticks (~24 h)
const cpTick = Number.isInteger(savedCp?.tick) ? savedCp.tick : 0
const cpValidFor = (g) => savedCp && savedCp.worldId === E.worldId(g)
  && E.canonical(savedCp.state?.genesis) === E.canonical(g)
  && E.stateHash(savedCp.state) === savedCp.stateHash
const gapOf = (g) => Math.floor((Date.now() - g.anchorMs) / E.TICK_MS) - cpTick

const canResume = saved
  && saved.genesis.rulesHash === RULES_HASH
  && saved.genesis.genesisSeed === SEED
  && (saved.genesis.worldGenerator ?? 'interval-classic-v1') === WORLD_GEN
  && Array.isArray(saved.genesis.witnesses)              // pre-witness worlds refound as witnessed ones
  && saved.genesis.witnesses.includes(WITNESS.playerId)  // our witness key must be a founding witness
  && (!savedCp || cpValidFor(saved.genesis))    // an alien/corrupt checkpoint is not this world
  && gapOf(saved.genesis) <= REFOUND_GAP

if (canResume) {
  GENESIS = saved.genesis
  const behind = gapOf(GENESIS)
  // v0.78: the idle-world replay must NEVER manufacture ticks the
  // witness already finalized — an empty replay across a finalized span
  // rewrites signed history with fabricated silence, and once it
  // checkpoints, the true ancestor is gone. If a frontier lies at or
  // ahead of the state, stand down: the agreement layer recovers those
  // ticks from certificates, and only the span PAST the frontier is
  // truly idle.
  let frontierAhead = false
  try {
    const wroot2 = DATA + '/witness-safety/' + E.worldId(GENESIS) + '/' + WITNESS.playerId
    const f2 = JSON.parse(fs.readFileSync(wroot2 + '/frontier.json', 'utf8'))
    const stTick = savedCp?.state?.tick ?? savedCp?.tick ?? -1
    if (Number.isInteger(f2?.tick) && f2.tick >= stTick && stTick >= 0) frontierAhead = true
  } catch { /* no frontier: nothing finalized, replay freely */ }
  if (behind > 600 && !frontierAhead) { // more than ~6 minutes of world time to make up
    const mins = Math.round(behind * E.TICK_MS / 60000)
    const eta = Math.round(behind * 68 / 1000) // ~68ms per empty tick, measured
    console.log('')
    console.log('This world was left for about ' + mins + ' minutes. Replaying those '
      + behind.toLocaleString() + ' intervals')
    console.log('will take roughly ' + (eta < 90 ? eta + ' seconds' : Math.round(eta / 60) + ' minutes')
      + '. Progress is checkpointed as it goes, so this')
    console.log('can be interrupted and resumed. The world is not stuck.')
    console.log('')
  }
} else {
  // Say WHY, here, before the founding record is overwritten by the new one.
  // A refound is not an error, but it ends a world's continuity, and the
  // evidence explaining it is destroyed by the very act of refounding. A node
  // that starts over in silence leaves nobody able to find out what happened.
  if (saved) {
    const why = []
    if (saved.genesis.engineHash !== undefined && saved.genesis.engineHash !== ENGINE_HASH)
      why.push('the engine changed (engine.js now hashes to ' + ENGINE_HASH.slice(0, 16)
        + '\u2026, the saved world was founded under ' + String(saved.genesis.engineHash).slice(0, 16) + '\u2026)')
    if (saved.genesis.rulesHash !== RULES_HASH)
      why.push('the constitution changed (SPEC.md now hashes to ' + RULES_HASH.slice(0, 16)
        + '\u2026, the saved world was founded under ' + String(saved.genesis.rulesHash).slice(0, 16) + '\u2026)')
    if (saved.genesis.genesisSeed !== SEED)
      why.push('the seed changed (' + saved.genesis.genesisSeed + ' -> ' + SEED
        + '; set INTERVAL_SEED to keep the old one)')
    if ((saved.genesis.worldGenerator ?? 'interval-classic-v1') !== WORLD_GEN)
      why.push('the generator changed (' + (saved.genesis.worldGenerator ?? 'interval-classic-v1')
        + ' -> ' + WORLD_GEN + '; set INTERVAL_GEN to keep the old one)')
    if (!Array.isArray(saved.genesis.witnesses))
      why.push('the saved world predates witnesses')
    else if (!saved.genesis.witnesses.includes(WITNESS.playerId))
      why.push('this node\u2019s witness key is not one the saved world named'
        + ' (identities/witness-pillar.json may have been lost or regenerated)')
    if (savedCp && !cpValidFor(saved.genesis))
      why.push('the checkpoint does not belong to the saved world, or is damaged')
    const g0 = gapOf(saved.genesis)
    if (g0 > REFOUND_GAP)
      why.push('nothing ran this world for ' + Math.round(g0 * E.TICK_MS / 60000)
        + ' minutes (the limit is ' + Math.round(REFOUND_GAP * E.TICK_MS / 60000) + ')')
    console.warn('')
    console.warn('REFOUNDING: the saved world ' + String(saved.worldId ?? '').slice(0, 12)
      + '\u2026 cannot be continued by this build.')
    for (const w of why) console.warn('  \u00b7 ' + w)
    console.warn('  Citizens are imported into the new world; the tick count starts again.')
    console.warn('  The old world is not lost. Run the release it was founded under to continue it.')
    console.warn('')
  }
  GENESIS = foundGenesis(WORLD_GEN, SEED, RULES_HASH, Date.now(), WORLD_W, WORLD_H)
  console.warn('FOUNDING with generator: ' + WORLD_GEN
    + (WORLD_GEN === 'interval-classic-v1' ? '  (set INTERVAL_GEN=interval-expanse-v7 for the expanse)' : ''))
  // the founding witness set (Milestone 4): immutable for this world; a
  // different witness configuration is a different world (Phase 9)
  GENESIS.witnesses = [WITNESS.playerId, ...EXTRA_WITNESSES.filter(w => w !== WITNESS.playerId)]
  const nWit = GENESIS.witnesses.length
  // Byzantine Safety Upgrade: the constitution fixes an explicit fault
  // threshold f. Default to the maximum this witness set can tolerate,
  // floor((n-1)/3); the quorum is then the safe minimum 2f+1 unless an
  // explicit (larger, still valid) quorum is requested.
  GENESIS.byzantineTolerance = Number.isInteger(Number(process.env.INTERVAL_FAULT_TOLERANCE))
    ? Number(process.env.INTERVAL_FAULT_TOLERANCE)
    : E.maxByzantine(nWit)
  const fWit = GENESIS.byzantineTolerance
  GENESIS.quorum = Math.max(E.minQuorumFor(nWit, fWit),
    Math.min(nWit, Number(process.env.INTERVAL_QUORUM) || 0))
  // The world is founded Byzantine-safe or not at all (n>=3f+1, q>=2f+1,
  // 2q-n>f): an unsafe configuration is refused at founding, not discovered
  // at forking.
  if (!E.byzantineSafe(nWit, GENESIS.quorum, fWit)) {
    console.error(`refusing to found a Byzantine-unsafe world: n=${nWit}, q=${GENESIS.quorum}, f=${fWit} — need n>=3f+1, q>=2f+1, 2q-n>f`)
    process.exit(1)
  }
  const old = savedCp?.state ?? (savedCp === null && saved && fs.existsSync(CP_FILE)
    ? (() => { try { return JSON.parse(fs.readFileSync(CP_FILE)).state } catch { return null } })() : null)
  if (old?.players) {
    // the founding carries everyone who LIVED: a name, any xp beyond
    // birth, anything owned. Pure ghosts (spawned once, did nothing,
    // never returned) rest in the old world's history.
    const lived = (p) => p.name
      || Object.entries(p.skills).some(([k, xp]) => k !== 'hitpoints' ? xp > 0 : xp > 1154)
      || (p.inventory ?? []).some(Boolean)
      || Object.keys(p.bank ?? {}).length > 0
      || p.equipment?.weapon
    // imports are FOUNDING data: they live inside the genesis, the worldId
    // commits to them, and worldgen applies them on every node identically
    GENESIS.imported = Object.entries(old.players).filter(([, p]) => lived(p)).map(([pid, p]) => ({
      pid, skills: p.skills, name: E.isValidName(p.name) ? p.name : null, // constitutional or nothing (rev5 §3)
      hp: p.hp, // (rescued again from the comment a bad merge swallowed it into)
      bank: Object.fromEntries(Object.entries(p.bank ?? {}).filter(([it]) => KNOWN_ITEMS.has(it))),
      inventory: (p.inventory ?? []).filter(sl => sl && KNOWN_ITEMS.has(sl.item)),
      weapon: p.equipment?.weapon && KNOWN_ITEMS.has(p.equipment.weapon.item) ? p.equipment.weapon : null,
    }))
    migrated = GENESIS.imported.length
    // provenance: the genesis commits to WHICH attested state carried them
    if (savedCp?.worldId && savedCp?.stateHash && Number.isInteger(savedCp?.tick))
      GENESIS.importedFrom = { worldId: savedCp.worldId, stateHash: savedCp.stateHash, tick: savedCp.tick }
  } else if (Array.isArray(saved?.genesis?.imported) && saved.genesis.imported.length) {
    // the last world died YOUNG: it never lived to its first checkpoint,
    // so there is no living state to carry — but its FOUNDING carried
    // citizens, and founding data does not expire with the world that
    // held it. They pass through to this founding unchanged. (This is
    // how a citizen survives two refounds in one evening.)
    GENESIS.imported = saved.genesis.imported
    migrated = GENESIS.imported.length
    // the chain of provenance passes through unchanged: these citizens'
    // attested source is wherever the PREVIOUS founding said it was
    if (saved.genesis.importedFrom) GENESIS.importedFrom = saved.genesis.importedFrom
    console.warn('  (no checkpoint survived; carrying the ' + migrated
      + ' citizen(s) from the previous FOUNDING record instead)')
  }
  // the operator's door: INTERVAL_IMPORT=path.json supplies a founding
  // import list by hand — for recovering citizens a lost checkpoint (or a
  // lost deploy) orphaned. Read only when nothing else carried anyone.
  if (!(GENESIS.imported?.length) && process.env.INTERVAL_IMPORT) {
    try {
      const hand = JSON.parse(fs.readFileSync(process.env.INTERVAL_IMPORT))
      if (Array.isArray(hand) && hand.length) {
        GENESIS.imported = hand
        migrated = hand.length
        console.warn('  (INTERVAL_IMPORT: carrying ' + migrated + ' citizen(s) by the operator\u2019s hand)')
      }
    } catch (e) { console.error('INTERVAL_IMPORT unreadable: ' + e.message); process.exit(1) }
  }
  // FORENSICS: the founding names its sources, so the next mystery
  // explains itself in one log line instead of costing a day
  console.warn('FOUNDING sources: world.json ' + (saved ? 'present' : 'ABSENT')
    + ' \u00b7 checkpoint ' + (savedCp ? 'present (tick ' + savedCp.tick + ')'
      : fs.existsSync(CP_FILE) ? 'present-but-unreadable' : 'ABSENT')
    + ' \u00b7 carrying ' + (GENESIS.imported?.length ?? 0) + ' citizen(s)')
  // the checkpoint is ARCHIVED, never merely deleted: it may be the
  // last copy of somebody's life
  try {
    if (fs.existsSync(CP_FILE)) {
      const oldId = savedCp?.worldId ? String(savedCp.worldId).slice(0, 12) : 'unknown'
      fs.copyFileSync(CP_FILE, DATA + '/checkpoints/web-' + oldId + '-t' + (savedCp?.tick ?? 0) + '.json')
    }
  } catch {}
  fs.rmSync(CP_FILE, { force: true })
  if (saved?.genesis) { // the old founding record is history, not debris
    try { fs.writeFileSync(DATA + '/checkpoints/world-' + String(E.worldId(saved.genesis)).slice(0, 12) + '.json',
      JSON.stringify({ genesis: saved.genesis })) } catch {}
  }
  fs.writeFileSync(WORLD_FILE, JSON.stringify({ genesis: GENESIS }))
}

let node
let noughtWorldJson = null   // §0: the founding state, built once, never changing
let noughtTerrain = null     // §0: the ground, packed once, never changing
// Evaluate the registered generator over the whole grid and pack it. Costs one
// pass at first request and nothing ever again, because a changed island is a
// different world (§9d).
function packTerrain (g) {
  // Ask the ENGINE, not the generator module: `terrainBlocked`/`onRoadAt` route
  // through the same registration the tick uses, so the table cannot disagree
  // with the world this node is actually running.
  const t = E.TERRAINS[g.worldGenerator]
  if (!t) throw new Error('this node has no generator registered for ' + g.worldGenerator)
  const w = g.worldW, h = g.worldH, n = w * h, bits = Math.ceil(n / 8)
  const blocked = Buffer.alloc(bits), road = Buffer.alloc(bits), country = Buffer.alloc(n)
  const names = []
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x
    if (t.blocked && t.blocked(g, x, y)) blocked[i >> 3] |= (1 << (i & 7))
    if (t.road && t.road(g, x, y)) road[i >> 3] |= (1 << (i & 7))
    const c = t.country ? t.country(g, x, y) : ''
    let k = names.indexOf(c); if (k < 0) { k = names.length; names.push(c) }
    country[i] = k
  }
  return {
    bin: Buffer.concat([blocked, road, country]),
    meta: { generator: g.worldGenerator, w, h, biomes: names,
            spawn: t.spawn ? t.spawn(g) : { x: w >> 1, y: h >> 1 },
            // the towns as the founder seated them, not as a window guesses
            settlements: t.settlements ? t.settlements(g) : null,
            geographyHash: t.geographyHash ? t.geographyHash(g) : null },
  }
}
try {
  node = await new IntervalNode({ peerKeyFile: DATA + '/identities/peer-pillar.json',
    genesis: GENESIS, buildWorld, name: 'web', checkpointFile: CP_FILE,
    witnessKey: WITNESS,                      // the pillar proposes and attests
    safetyDir: DATA + '/witness-safety',              // world-namespaced vote lock + frontier (rev5 §1)
    finalityBackend: process.env.INTERVAL_FINALITY_BACKEND || 'sqlite', // SQLite is the production default (final review §3); set 'flatfile' for the dev/compat backend
    // Every 200 ticks (2 min) rather than 1000 (10 min). A crash skips the
    // final write, so the newest checkpoint is up to one interval stale, and
    // that staleness is subtracted from however long the world may then be
    // left. Writing five times as often costs almost nothing (an atomic
    // rename of one JSON file) and narrows the loss to two minutes.
    checkpointInterval: Number(process.env.INTERVAL_CHECKPOINT_INTERVAL) || 200, // §1: checkpoints accelerate recovery; finality certs record every tick
    startupVerifyRecentN: process.env.INTERVAL_STARTUP_VERIFY_RECENT ? Number(process.env.INTERVAL_STARTUP_VERIFY_RECENT) : DEFAULT_STARTUP_VERIFY_RECENT_N, // §2: shared bounded default; env can override (Infinity = full audit)
    listen: `/ip4/0.0.0.0/tcp/${P2P_PORT}`,   // the pillar accepts peers
  }).start()
} catch (e) {
  if (e.code === 'ERR_WITNESS_LOCK_HELD') {
    console.error(`\n${e.message}\n\nAnother witness process is already operating this identity for this world. Stop it first, or run a different witness identity.`)
    process.exit(1)
  }
  throw e
}

console.log(`witnessed world ${node.worldId.slice(0, 12)}… · ${GENESIS.witnesses.length} witness(es), quorum ${GENESIS.quorum} · this witness ${WITNESS.playerId.slice(0, 12)}…`)
if (migrated) console.log(`world refounded (rules changed, clock lapsed, or checkpoint invalid): ${migrated} citizen(s) crossed into world ${node.worldId.slice(0, 12)}…`)
{
  const gap = node.scheduledTick - node.state.tick
  if (gap > 0) console.log(`catching up ${gap} ticks by certified proposal…`)
}
// every visitor is their own citizen: one identity per browser, keyed by a
// local ID the browser stores. The node custodies these keys (a friendly
// pillar); browser-held keys are the v1.0 light-client milestone.
function identityFor(uid) {
  const safe = String(uid).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40)
  if (!safe) return null
  return E.loadOrCreateIdentity(fs, DATA + '/identities/web-' + safe + '.json')
}

// ---- the readable world: JSON API (hiscores sites are just windows) ----
const lvl = E.levelForXp
// The board reads standing from the world and nothing else. It is given a
// lookup rather than the state itself, so it can be tested without a world and
// can never reach into one.
const board = makeBoard({
  // Keepers are citizen keys, named here and nowhere else. There is no
  // password: a keeper's instruction carries their signature exactly as their
  // words would, so this server holds no secret that could be stolen from it.
  moderators: (process.env.INTERVAL_BOARD_KEEPERS ?? '').split(',')
    .map(k => k.trim().toLowerCase()).filter(k => /^[0-9a-f]{64}$/.test(k)),
  lookup: (key) => {
    const p = node.state.players[key]
    if (!p) return null
    return { name: p.name ?? null, standing: E.standingOf(p), calling: E.callingOf(p) }
  },
})

function hiscores() {
  return Object.entries(node.state.players).map(([pid, p]) => {
    const levels = Object.fromEntries(Object.entries(p.skills).map(([k, xp]) => [k, lvl(xp)]))
    // standing and calling come from the ENGINE, never recomputed on the page:
    // there is one definition of who a citizen is and it lives in the rules
    return { playerId: pid, name: p.name ?? pid.slice(0, 8) + '…',
             levels, skillXp: { ...p.skills },
             calling: E.callingOf(p),
             total: E.standingOf(p),
             xp: Object.values(p.skills).reduce((a, b) => a + b, 0) }
  }).sort((a, b) => b.total - a.total || b.xp - a.xp)
}

const PAGES = { '/': 'index.html', '/quickstart': 'quickstart.html',
                '/manual': 'manual.html', '/hiscores': 'hiscores.html',
                '/board': 'board.html',
                '/play': 'windows.html', '/windows': 'windows.html',
                '/map': 'map.html', '/marks': 'marks.html' }
const MIME = { html: 'text/html', css: 'text/css', js: 'text/javascript',
               png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp',
               svg: 'image/svg+xml', ico: 'image/x-icon' }

const server = http.createServer((req, res) => {
  const path = req.url.split('?')[0]
  const json = (obj) => { res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); res.end(JSON.stringify(obj)) }
  try {
    if (path === '/api/genesis') return json({
      genesis: node.genesis, peerId: node.peerId(), p2pPort: P2P_PORT,
      note: 'run join.mjs against this URL to enter this world with your own node and keys',
    })
    // THE ROADS THIS WORLD ACTUALLY HAS. Computed once here, from the founded
    // genesis, by the same router that laid them -- so every window draws the
    // real network (ring, passes, bridges) instead of guessing. Cached: roads
    // never change for a given founding.
    // THE TOWNS, AS THE FOUNDER SEATED THEM. A window cannot import a
    // generator, so it has always re-derived the town seats from a simplified
    // copy of the seater -- and a copy drifts. It drifted by up to ten tiles
    // under v6, and under v7 by twenty-seven, which is a whole town: a citizen
    // stood in Anchor's market square on grass, because the window had paved
    // somewhere else.
    //
    // The pillar already computes this for the practice world's terrain
    // packet. Serve it to the living one too. Told beats derived.
    if (path === '/api/settlements') {
      if (!_settleCache) {
        try { _settleCache = { settlements: packTerrain(node.state.genesis).meta.settlements ?? [] } }
        catch (e) { _settleCache = { settlements: [], error: e.message } }
      }
      return json(_settleCache)
    }
    if (path === '/api/roads') {
      if (!_roadsCache) { try { _roadsCache = roadDataOf(node.genesis) } catch (e) { _roadsCache = { tiles: [], bridges: [], bends: [], error: e.message } } }
      return json(_roadsCache)
    }
    if (path === '/api/world') return json({
      tick: node.state.tick, finalizedTick: node.finalizedTick, scheduledTick: node.scheduledTick,
      worldId: node.worldId, witnesses: GENESIS.witnesses.length, quorum: GENESIS.quorum,
      halted: node.agreement?.halted ?? false,
      awake: Object.values(node.state.players).filter(p => E.isAwake(p, node.state.tick)).length,
      players: Object.keys(node.state.players).length,
      mobs: Object.values(node.state.mobs).filter(m => m.hp > 0).length })
    if (path === '/api/announce' && req.method === 'POST') {
      // a peer announces its LISTENING port; we pair it with the address
      // we OBSERVED it calling from. Self-reported IPs lie; sockets do not.
      let body = ''
      req.on('data', (c) => { body += c })
      req.on('end', () => {
        try {
          const { peerId, port } = JSON.parse(body)
          if (!/^12D3Koo[1-9A-HJ-NP-Za-km-z]+$/.test(peerId ?? '') || !Number.isInteger(port)) { res.writeHead(400); res.end(); return }
          // behind nginx the socket says 127.0.0.1 about everyone: honor the
          // forwarded header first, or the directory fills with loopback ghosts
          const fwd = (req.headers['x-forwarded-for'] ?? '').split(',')[0].trim()
          const ip = (fwd || req.socket.remoteAddress || '').replace(/^::ffff:/, '')
          const fam = ip.includes(':') ? 'ip6' : 'ip4'
          announced.set(peerId, { addr: '/' + fam + '/' + ip + '/tcp/' + port + '/p2p/' + peerId, at: Date.now() })
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true, recorded: announced.get(peerId).addr }))
        } catch { res.writeHead(400); res.end() }
      })
      return
    }
    if (path === '/api/peers') {
      // the mesh directory (v2): ANNOUNCED addresses only. Connection
      // remoteAddrs were ephemeral outbound ports: dialing one is knocking
      // on the hole someone drilled outward. Announcements are doors.
      const fresh = Date.now() - 5 * 60 * 1000
      for (const [id2, e2] of announced) if (e2.at < fresh) announced.delete(id2)
      return json({ peers: [...announced.values()].map(e2 => e2.addr), count: announced.size })
    }
    // ---- the board: coordination that does not belong inside the world ----
    // Public chat is for what is happening now, where you are standing. This
    // is for what is happening later, to someone who is not here. It has no
    // accounts because the world already gave everyone an identity: a post is
    // signed with the same key that swings an axe, and the node checks the
    // signature against the same public key the hiscores rank.
    //
    // Spam is answered by the only thing this world has that cannot be forged
    // in bulk: TIME. Posting requires a standing, which is minutes of real
    // work per identity, and there is a flat daily allowance above it. Flat,
    // not scaled: a newcomer with a question needs the board more than a
    // master does, and rationing speech by rank is how a forum becomes a
    // hierarchy.
    if (path === '/api/board') {
      if (req.method === 'GET') {
        return json({ posts: board.latest(),
                      minStanding: board.config.minStanding, perDay: board.config.perDay,
                      keepers: board.config.moderators })
      }
      if (req.method === 'POST') {
        let body = ''
        req.on('data', (c) => { body += c; if (body.length > 65536) req.destroy() })
        req.on('end', async () => {
          try {
            const post = JSON.parse(body)
            const verdict = await board.accept(post)
            if (verdict.ok) { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true })) }
            else { res.writeHead(verdict.code ?? 400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: verdict.why })) }
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'that was not a post' }))
          }
        })
        return
      }
    }
    if (path === '/api/board/moderate' && req.method === 'POST') {
      let body = ''
      req.on('data', (c) => { body += c; if (body.length > 8192) req.destroy() })
      req.on('end', async () => {
        try {
          const verdict = await board.moderate(JSON.parse(body))
          if (verdict.ok) { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true })) }
          else { res.writeHead(verdict.code ?? 400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: verdict.why })) }
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'that was not an instruction' }))
        }
      })
      return
    }
    if (path === '/api/races') {
      // One row per skill: a race that is over names its winner forever, and a
      // race still running names whoever is closest and how far they have come.
      const firsts = node.state.firsts ?? {}
      const nameOf = (pid) => node.state.players[pid]?.name ?? pid.slice(0, 12) + '\u2026'
      const races = E.SKILLS.map((sk) => {
        const wonBy = firsts['master:' + sk]
        if (wonBy) return { skill: sk, settled: true, name: nameOf(wonBy), playerId: wonBy }
        let bestPid = null, bestXp = -1
        for (const [pid, p] of Object.entries(node.state.players)) {
          const xp = p.skills[sk] ?? 0
          if (xp > bestXp) { bestXp = xp; bestPid = pid }
        }
        if (!bestPid || bestXp <= 0) return { skill: sk, settled: false, name: null }
        const level = lvl(bestXp)
        // how far along the LAST step, which is the one worth watching
        const at99 = E.XP_TABLE[99] // mastery: 13,034,431
        const toGo = Math.max(0, at99 - bestXp)
        return { skill: sk, settled: false, name: nameOf(bestPid), playerId: bestPid,
                 level, xp: bestXp, toGo,
                 pct: Math.max(0, Math.min(100, Math.round((bestXp / at99) * 100))) }
      })
      return json({ tick: node.state.tick, worldId: node.worldId, races })
    }
    if (path === '/api/firsts') {
      // The world already remembers these forever (engine claimFirst): they are
      // hashed into state like everything else. They were simply never shown.
      const names = {}
      for (const [pid, p] of Object.entries(node.state.players)) names[pid] = p.name ?? null
      return json({
        tick: node.state.tick,
        worldId: node.worldId,
        firsts: Object.entries(node.state.firsts ?? {}).map(([key, pid]) => ({
          key, playerId: pid, name: names[pid] ?? null,
        })),
      })
    }
    if (path === '/api/hiscores') return json({ tick: node.state.tick, players: hiscores() })
    if (path.startsWith('/api/player/')) {
      const q = decodeURIComponent(path.slice(12)).toLowerCase()
      const hit = Object.entries(node.state.players).find(([pid, p]) => p.name === q || pid === q)
      if (!hit) { res.writeHead(404, { 'Content-Type': 'application/json' }); return res.end('{"error":"no such citizen"}') }
      return json({ playerId: hit[0], ...hit[1] })
    }
    const NC = { 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache' } // stale windows caused ghost bugs; iOS honors no-cache loosely, so we say it THREE ways
    // Read the file BEFORE the headers go out. It used to be the other way
    // round: writeHead(200), then readFileSync, so one missing file threw with
    // the response already begun, and the catch below then died trying to send
    // a 500 that could no longer be sent. A single absent asset took the whole
    // node down and the log named the error handler instead of the cause.
    const sendFile = (rel, type) => {
      let buf
      try { buf = fs.readFileSync(new URL(rel, import.meta.url)) }
      catch {
        console.warn('[web] missing file for ' + path + ': ' + rel)
        res.writeHead(404, { 'Content-Type': 'text/plain' })
        return res.end('nothing here')
      }
      res.writeHead(200, { 'Content-Type': type, ...NC })
      return res.end(buf)
    }
    // §0: NOUGHT. A window that wants to run the island itself needs two
    // things and no more: the engine's own source, and the world as the
    // founding made it.
    //
    // Both are pure functions of the genesis this node already holds, so
    // neither is a secret, neither can be personalised, and both are the same
    // bytes from every honest pillar -- which is what makes them checkable.
    // Nothing served here is ever sent back: a resident's Nought is computed
    // in their window and dies there.
    if (path === '/engine.js') return sendFile('./engine.js', 'text/javascript')
    // §0: THE ENGINE'S OWN DEPENDENCIES, served so a window can resolve them.
    //
    // engine.js requires '@noble/ed25519' and '@noble/hashes/sha2.js'. A browser
    // has no node resolution and this project has no bundler, so a bare
    // specifier is simply unresolvable there -- which is exactly how the first
    // run failed: "Importing a module script failed."
    //
    // These are served under one path so their RELATIVE imports keep working
    // (sha2.js reaches for ./_md.js, ./_u64.js and ./utils.js), and the shim
    // maps the bare names onto these URLs. Nothing is rewritten and nothing is
    // bundled: they are the same files this node runs.
    if (path.startsWith('/vendor/')) {
      const leaf = path.slice('/vendor/'.length)
      if (!/^[a-z0-9_.-]+\.js$/i.test(leaf)) { res.writeHead(404, NC); return res.end('no') }
      const VENDOR = {
        'noble-ed25519.js': './node_modules/@noble/ed25519/index.js',
        'sha2.js': './node_modules/@noble/hashes/sha2.js',
        '_md.js': './node_modules/@noble/hashes/_md.js',
        '_u64.js': './node_modules/@noble/hashes/_u64.js',
        'utils.js': './node_modules/@noble/hashes/utils.js',
      }
      if (!VENDOR[leaf]) { res.writeHead(404, NC); return res.end('no') }
      return sendFile(VENDOR[leaf], 'text/javascript')
    }
    if (path === '/engine-browser.mjs') return sendFile('./engine-browser.mjs', 'text/javascript')
    // The windows stopped carrying their own copy of the geography: the deep
    // and photo windows IMPORT the one mirror, so the pillar must serve it as
    // JavaScript. A module served as anything else is refused silently, which
    // is a window that does not start and a world that looks like it will not
    // answer. sky.mjs rides along for the same reason.
    if (path === '/terrain-mirror.mjs') return sendFile('./terrain-mirror.mjs', 'text/javascript')
    if (path === '/sky.mjs') return sendFile('./sky.mjs', 'text/javascript')
    // §0: THE GROUND ITSELF, packed. The engine fails closed without a
    // registered generator, and a window cannot import one, so it is served
    // the generator's ANSWERS instead: blocked and road as bitmaps, country as
    // a byte, evaluated once over a grid that can never change.
    if (path === '/nought/terrain.bin' || path === '/nought/terrain.json') {
      if (!noughtTerrain) {
        try { noughtTerrain = packTerrain(node.state.genesis) }
        catch (e) { res.writeHead(503, NC); return res.end('cannot pack the ground: ' + e.message) }
      }
      const immutable = { 'Cache-Control': 'public, max-age=31536000, immutable' }
      if (path.endsWith('.json')) {
        res.writeHead(200, { 'Content-Type': 'application/json', ...immutable })
        return res.end(JSON.stringify(noughtTerrain.meta))
      }
      res.writeHead(200, { 'Content-Type': 'application/octet-stream', ...immutable })
      return res.end(noughtTerrain.bin)
    }
    if (path === '/nought/world.json') {
      // Computed once and cached: it cannot change, because a changed world is
      // a different world (§9d).
      if (!noughtWorldJson) {
        // §0: the practice world is a DIFFERENT WORLD that draws the same
        // island. Serving it under its own id is what makes "nothing crosses"
        // arithmetic: an input signed here is refused there, by §1's binding,
        // with no window involved and nobody's word taken for it.
        // SERVED ALREADY MARKED, so that the LAZY window is the safe one.
        //
        // The window marks it too (§0a), which defends against a pillar that
        // did not. But a window author who never read §0 and simply renders
        // what arrives must still end up showing a resident where they are --
        // otherwise the default outcome of carelessness is a person deceived,
        // and carelessness is the only adversary here worth designing against.
        // Nobody gains anything by faking Nought: there is nothing in it to
        // steal and the key never leaves the machine.
        try { noughtWorldJson = Buffer.from(JSON.stringify(
          E.markNoughtWorld(buildWorld(E.noughtGenesisOf(node.state.genesis))))) }
        catch (e) { res.writeHead(503, NC); return res.end('cannot build the founding state: ' + e.message) }
      }
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=31536000, immutable' })
      return res.end(noughtWorldJson)
    }
    // /play is the doorway: a window is a choice, and the choice is shown.
    // The old paths keep working, since links live longer than layouts.
    if (path === '/play/flat' || path === '/window-web') return sendFile('./window-web.html', 'text/html')
    if (path === '/play/deep' || path === '/deluxe') return sendFile('./window-3d.html', 'text/html')
    if (path === '/play/photo' || path === '/photo') return sendFile('./window-photo.html', 'text/html')
    if (path === '/play/holo' || path === '/holo') return sendFile('./window-holo.html', 'text/html')
    if (path === '/play/lantern' || path === '/lantern' || path === '/diablo')
      return sendFile('./window-diablo.html', 'text/html')
    // Music, if the world has any. Nothing here ships with a tune: a node with
    // an empty audio/ directory simply plays nothing, and the windows fall
    // silent without complaint. Drop files in and they are found.
    if (path.startsWith('/audio/')) {
      const f = path.slice(7).replace(/[^A-Za-z0-9._-]/g, '')
      const AUDIO_MIME = { mp3: 'audio/mpeg', ogg: 'audio/ogg', m4a: 'audio/mp4',
                           wav: 'audio/wav', opus: 'audio/opus', flac: 'audio/flac' }
      const ext = f.split('.').pop().toLowerCase()
      if (!AUDIO_MIME[ext]) { res.writeHead(404); return res.end('nothing here') }
      let buf
      try { buf = fs.readFileSync(new URL('./audio/' + f, import.meta.url)) }
      catch { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('no such piece') }
      // music is large and never changes: let it cache, unlike the windows.
      // And it must speak RANGE: iOS Safari's media stack probes with
      // byte-ranges and refuses players that answer a whole file to a
      // partial question — which is a door with music behind it and
      // silence in front.
      const range = req.headers.range
      const base = { 'Content-Type': AUDIO_MIME[ext], 'Cache-Control': 'public, max-age=86400',
        'Accept-Ranges': 'bytes' }
      if (range) {
        const m2 = /bytes=(\d*)-(\d*)/.exec(range)
        let a2 = m2 && m2[1] !== '' ? parseInt(m2[1], 10) : 0
        let b2 = m2 && m2[2] !== '' ? Math.min(parseInt(m2[2], 10), buf.length - 1) : buf.length - 1
        if (a2 > b2 || a2 >= buf.length) {
          res.writeHead(416, { 'Content-Range': 'bytes */' + buf.length }); return res.end()
        }
        res.writeHead(206, { ...base, 'Content-Range': 'bytes ' + a2 + '-' + b2 + '/' + buf.length,
          'Content-Length': b2 - a2 + 1 })
        return res.end(buf.subarray(a2, b2 + 1))
      }
      res.writeHead(200, { ...base, 'Content-Length': buf.length })
      return res.end(buf)
    }
    // what music this node actually has, so a window need not guess at names
    if (path === '/api/audio') {
      let names = []
      try { names = fs.readdirSync(new URL('./audio/', import.meta.url))
        .filter(n => /\.(mp3|ogg|m4a|wav|opus|flac)$/i.test(n)) } catch {}
      // A large uncompressed file is a minute of silence at the door on mobile
      // data, for music whose whole purpose is to be playing already. Say so
      // once, at startup, rather than letting visitors discover it.
      if (!AUDIO_WARNED) {
        AUDIO_WARNED = true
        for (const n of names) {
          try {
            const mb = fs.statSync(new URL('./audio/' + n, import.meta.url)).size / 1048576
            if (mb > 6) console.warn('[web] audio/' + n + ' is ' + mb.toFixed(0)
              + 'MB. Visitors download it before they hear anything: see audio/convert.sh')
          } catch {}
        }
      }
      return json({ tracks: names })
    }
    if (path.startsWith('/site/')) {
      const f = path.slice(6).replace(/[^a-z0-9.-]/g, '')
      const ext = f.split('.').pop()
      return sendFile('./site/' + f, MIME[ext] ?? 'text/plain')
    }
    if (PAGES[path]) return sendFile('./site/' + PAGES[path], 'text/html')
    { // root assets: the chart of Tallyholm and its kin live in ./site
      const am = /^\/([a-z0-9_-]+)\.(png|jpg|webp|svg|ico|css|js)$/.exec(path)
      if (am) return sendFile('./site/' + am[1] + '.' + am[2], MIME[am[2]])
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('nothing here')
  } catch (e) {
    // A handler that has already begun its response cannot be given a 500, and
    // trying was itself the crash. Report, close what is open, stay alive: a
    // world should not fall over because one request went wrong.
    console.error('[web] request failed: ' + (e?.stack ?? e))
    if (res.headersSent) { try { res.end() } catch {} return }
    try { res.writeHead(500, { 'Content-Type': 'text/plain' }); res.end('error') } catch {}
  }
})
const wss = new WebSocketServer({ server })
const sockets = new Map() // ws -> IntervalClient (per-visitor identity)

wss.on('connection', (ws) => {
  sockets.set(ws, null)
  ws.on('close', () => sockets.delete(ws))
  ws.on('message', (buf) => {
    try { handle(ws, buf) } catch (err) { console.error('ws action error:', err.message) }
  })
})

function handle(ws, buf) {
    let m; try { m = JSON.parse(buf) } catch { return }
    if (m.type === 'adopt') {
      // browser-held keys (v1.0): the pillar holds NOTHING for this citizen.
      // It merely relays inputs the browser signed; the engine judges them.
      if (!/^[0-9a-f]{64}$/.test(m.pub ?? '')) return
      sockets.set(ws, { external: true, playerId: m.pub })
      ws.send(JSON.stringify({ type: 'hello', playerId: m.pub, external: true }))
      return
    }
    // §0: NOUGHT PRESENCE. Residents each compute their own private island, so
    // nothing about them is consensus and nothing here is judged: this relays
    // a position to whoever else is standing on the same geography, and that
    // is all it does.
    //
    // It exists because a practice world nobody else is ever in is a lonelier
    // thing than the one it is practice for, and because the point of Nought
    // was never solitude -- it was the island, with the people who are also
    // about to arrive on it.
    //
    // A resident may lie about where they are standing. This is permitted and
    // uninteresting: nothing in Nought is scarce, contested or recorded, so
    // there is no claim a liar could profit from.
    if (m.type === 'nought') {
      const p = m.at
      if (!p || !/^[0-9a-f]{64}$/.test(p.id ?? '') ) return
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return
      const out = JSON.stringify({ type: 'nought', at: { id: p.id, x: p.x | 0, y: p.y | 0, look: p.look | 0 } })
      for (const other of sockets.keys()) {
        if (other !== ws && other.readyState === 1) { try { other.send(out) } catch {} }
      }
      return
    }
    if (m.type === 'rawsay') {
      const ext = sockets.get(ws)
      if (!ext?.external || m.msg?.playerId !== ext.playerId) return
      node.publishSignedChat(m.msg).catch(() => {})
      return
    }
    if (m.type === 'raw') {
      const ext = sockets.get(ws)
      if (!ext?.external) return
      const inp = m.input
      if (!inp || inp.playerId !== ext.playerId || typeof inp.sig !== 'string') return
      // TELL THE CLIENT WHY.
      //
      // A refusal used to be observable only as `p.lastInput` failing to
      // advance -- which is indistinguishable from the client never having
      // sent anything. Diagnosing a refused move meant inferring it, and the
      // wrong inference is available and tempting: a client that cannot tell
      // a transient collision from real terrain will conclude the map is
      // wrong and stop trusting its own routing.
      //
      // That matters more than it sounds because of the tick window. An input
      // is stamped for the tick AFTER the frame it was planned from, and mobs
      // wander every tick, so a legitimate move can be refused through
      // nobody's fault -- measured at 671 such windows in 600 ticks with 49
      // goblins in an open field. Those are transient and a client should
      // simply try again. Terrain is permanent and it should not.
      //
      // This is out of band and non-consensus, like chat (§9c): the world
      // does not record that anyone was refused, and no state hash moves.
      // Honest clients get to see their own errors; a hostile one learns
      // nothing it could not learn by trying.
      node.submitInput(inp).catch((e) => {
        const why = String(e?.message ?? e).slice(0, 120)
        console.error('input refused (' + (inp.type ?? '?') + ' from '
          + String(inp.playerId).slice(0, 8) + '): ' + why)
        try {
          if (ws.readyState === 1 && (ws.bufferedAmount ?? 0) < 2 * 1024 * 1024)
            ws.send(JSON.stringify({ type: 'refused', of: inp.type ?? '?', tick: inp.tick ?? null, why }))
        } catch {}
      })
      return
    }
    if (m.type === 'auth') {
      const id = identityFor(m.uid)
      if (!id) return
      sockets.set(ws, new IntervalClient({ node, identity: id }))
      ws.send(JSON.stringify({ type: 'hello', playerId: id.playerId }))
      return
    }
    if (m.type !== 'act') return
    const client = sockets.get(ws)
    if (!client || client.external) return // externals speak only in signatures
    const a = m.action
    // one input per tick, exactly as the constitution demands
    if (a.do === 'attend') client.attend()          // §0b: a soul knocks
    else if (a.do === 'spawn') client.spawn()
    else if (a.do === 'move') client.move(Math.sign(a.dx | 0), Math.sign(a.dy | 0))
    else if (a.do === 'gather') client.gather(String(a.nodeId))
    else if (a.do === 'attack') client.attack(String(a.mobId))
    else if (a.do === 'cook') client.cook(a.slot | 0)
    else if (a.do === 'eat') client.eat(a.slot | 0)
    else if (a.do === 'smith') client.smith(String(a.recipe))
    else if (a.do === 'wield') client.wield(a.slot | 0)
    else if (a.do === 'unwield') client.unequip(String(a.gear ?? 'weapon'))
    else if (a.do === 'buy') client.buy(String(a.item))
    else if (a.do === 'recall') client.recall(String(a.to))
    else if (a.do === 'drop') client.drop(a.slot | 0)
    else if (a.do === 'pickup') client.pickup(String(a.groundId))
    else if (a.do === 'light') client.light(a.slot | 0)
    else if (a.do === 'bury') client.bury(a.slot | 0)
    else if (a.do === 'plant') client.plant(a.slot | 0)
    else if (a.do === 'harvest') client.harvest(String(a.nodeId))
    else if (a.do === 'sell') client.sell(a.slot | 0)
    else if (a.do === 'invoke') client.invoke()
    else if (a.do === 'cast') client.cast('anchor')
    else if (a.do === 'fletch') client.fletch(a.slot | 0, a.make === 'arrows' ? 'arrows' : 'bow')
    else if (a.do === 'unequip') client.unequip(['weapon','head','body'].includes(a.gear) ? a.gear : 'weapon')
    else if (a.do === 'deposit') client.deposit(a.slot | 0)
    else if (a.do === 'withdraw') client.withdraw(String(a.item))
    else if (a.do === 'offer_trade') {
      // canonical demand: an item OR positive gold, never both (pre-freeze §1)
      if (a.wantGold != null && (a.wantItem == null || a.wantItem === '')) client.offerTradeForGold(String(a.to), a.giveSlot | 0, a.wantGold | 0)
      else client.offerTradeForItem(String(a.to), a.giveSlot | 0, String(a.wantItem))
    }
    else if (a.do === 'accept_trade') client.acceptTrade(String(a.from))
    else if (a.do === 'cancel_trade') client.cancelTrade()
    else if (a.do === 'chat') { if (client.chat) client.chat(String(a.text)) }
    else if (a.do === 'attackp') { if (client.attackp) client.attackp(String(a.targetId)) }
    else if (a.do === 'name') client.claimName(String(a.name))
    else if (a.do === 'stop') client.stop()
}

node.onChat = (msg) => {
  const name = node.state.players[msg.playerId]?.name ?? msg.playerId.slice(0, 6)
  const out = JSON.stringify({ type: 'chat', playerId: msg.playerId, name, text: msg.text })
  for (const ws of sockets.keys())
    if (ws.readyState === 1 && (ws.bufferedAmount ?? 0) < 2 * 1024 * 1024) ws.send(out)
}

const worldId = node.worldId // the COMPLETE id: windows sign with it and display a prefix
let lastTickAt = 0
node.onTick = (state) => {
  const nowT = Date.now()
  if (lastTickAt && nowT - lastTickAt > 1500) {
    console.warn('[tick-gap] ' + (nowT - lastTickAt) + 'ms between broadcasts at tick ' + state.tick + ': the event loop or host stalled')
  }
  lastTickAt = nowT
  const msg = JSON.stringify({ type: 'state', state, worldId })
  // ---- NEVER QUEUE BEHIND A SOCKET THAT IS NOT DRAINING ----
  //
  // This was `if (ws.readyState === 1) ws.send(msg)`, and it ran the node out
  // of memory after three and a half hours: 2 GB of heap, dead.
  //
  // readyState 1 means OPEN. It does not mean the far end is reading. A phone
  // that went into a tunnel, a laptop that slept, a tab that was backgrounded
  // — all stay OPEN for minutes while `send()` quietly queues into the
  // socket's buffer. At six hundred kilobytes a tick, ten times a minute, one
  // stalled client is a third of a gigabyte an hour.
  //
  // And the queued frames are worthless anyway. A state broadcast is a
  // SNAPSHOT, not a stream: if a client has not drained tick 1000 there is no
  // value in also sending it tick 1001, because 1002 supersedes both. So a
  // backed-up socket is skipped, and it catches up on the next tick it can
  // actually receive.
  //
  // Past a hard ceiling the client is not slow, it is gone: closed, so the
  // buffer is released rather than held for a reader that will never come.
  // A SKIPPED STATE MUTES THE CITIZEN, so this threshold must never fire for
  // anyone who is merely busy.
  //
  // An input must carry the EXACT current tick (engine §5, `input.tick !==
  // state.tick`), and the window learns the tick only from the states it
  // receives. So a client that is skipped goes stale, stamps every input with
  // a tick that has passed, and has all of them refused -- it walks one step
  // and stops, and clicking harder does nothing because every click is
  // stamped with the same dead tick.
  //
  // At 2MB against a 0.6MB state that was three messages of headroom: a
  // browser pausing to render could cross it and fall silent. Twelve is
  // twenty states behind, which no healthy client reaches and no hiccup
  // produces. The DROP is what actually bounds memory, and it is unchanged.
  const SKIP_ABOVE = 12 * 1024 * 1024  // ~20 states behind: genuinely stalled
  const DROP_ABOVE = 32 * 1024 * 1024  // ~50 states behind: it is not coming back
  let skipped = 0, dropped = 0, worst = 0
  for (const ws of sockets.keys()) {
    if (ws.readyState !== 1) continue
    const backlog = ws.bufferedAmount ?? 0
    if (backlog > worst) worst = backlog
    if (backlog > DROP_ABOVE) { dropped++; try { ws.terminate ? ws.terminate() : ws.close() } catch {} ; continue }
    if (backlog > SKIP_ABOVE) { skipped++; continue }
    ws.send(msg)
  }
  // say HOW FAR behind, not just that somebody is. A socket 2MB back is a
  // client that hiccuped and will catch up on the next tick; one at 15MB is
  // about to be closed. The old line could not tell you which you had, and
  // the difference is the difference between fine and losing a citizen.
  if (dropped) console.warn('[backpressure] closed ' + dropped + ' socket(s) past '
    + (DROP_ABOVE / 1048576) + 'MB at tick ' + state.tick)
  else if (skipped && state.tick % 100 === 0) console.warn('[backpressure] '
    + skipped + ' behind at tick ' + state.tick + ', worst ' + (worst / 1048576).toFixed(1)
    + 'MB of ' + (DROP_ABOVE / 1048576) + 'MB — skipping until they drain')
}

node.startTicking()
const HTTP_PORT = Number(process.env.INTERVAL_HTTP_PORT) || 8787
server.listen(HTTP_PORT, () => {
  console.log('Interval is live: http://localhost:' + HTTP_PORT + '  (site, game, hiscores, API)')
  console.log('peers may join via join.mjs — p2p port ' + P2P_PORT + ', peer ' + node.peerId())
})
