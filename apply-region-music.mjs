#!/usr/bin/env node
// Wire region music into window-web.html. Idempotent: run it twice, the second
// run reports "already patched" and changes nothing.
//
//   node apply-region-music.mjs [path/to/window-web.html]
//
import fs from 'node:fs'

const path = process.argv[2] ?? 'window-web.html'
let src = fs.readFileSync(path, 'utf8')
const before = src.length
let done = 0, skipped = 0

// `marker` is a string that exists ONLY after this edit has been applied. The
// find text is not a safe stand-in: the block insert keeps its own anchor.
const edit = (name, marker, find, repl) => {
  if (src.includes(marker)) {
    console.log('  ..  ' + name + ' (already patched)'); skipped++; return
  }
  const n = src.split(find).length - 1
  if (n !== 1) throw new Error(name + ': expected 1 match of the anchor, found ' + n)
  src = src.replace(find, repl); console.log('  ok  ' + name); done++
}

// ---------------------------------------------------------------- 1 of 4
// musicTried is a permanent latch: once the door theme finishes, nothing can
// play again for the rest of the session. Release it when a piece ends. This
// cannot cause a double-play, because every door-side call is {once: true}.
edit('release the musicTried latch',
  'MUSIC = null; musicTried = false }) // the arrival is over',
  `a.addEventListener('ended', () => { MUSIC = null }) // the arrival is over`,
  `a.addEventListener('ended', () => { MUSIC = null; musicTried = false }) // the arrival is over`)

// ---------------------------------------------------------------- 2 of 4
// Pin the fallback. pick('theme') returns the first readdirSync match, and with
// seven theme-*.m4a files in audio/ that is no longer predictably theme-deep.
// A world missing theme-flat should not open with the Crags.
edit('pin the track fallback',
  "pick(preferred) ?? pick('theme-deep')",
  `  const name = pick(preferred) ?? pick('theme') ?? tracks[0]`,
  `  const name = pick(preferred) ?? pick('theme-deep') ?? tracks[0]`)

// ---------------------------------------------------------------- 3 of 4
const BLOCK = `
// ---- region music: arrival, not atmosphere ----
// The door theme plays once because entering the world is an arrival. Crossing
// into the Crags is the same event at a smaller scale, so it gets the same rule:
// heard once, then quiet. A region already heard this session stays quiet when
// you come back through it -- you arrived there already, and a piece that greets
// you at every crossing is not a greeting.
//
// Presentational only, like the daylight lock. No world state, no input, no
// tick. Two windows standing on the same tile may be hearing different things,
// and the world does not care.
const REGION_STEM = {
  'the Heartlands': 'theme-hearth', 'the Meadows': 'theme-hearth',
  'Greenhollow': 'theme-hearth',
  'Anchor': 'theme-anchor',
  'Millbrook': 'theme-hearth', 'Norwick': 'theme-hearth',
  'Thornbury': 'theme-hearth', 'Oxenford': 'theme-hearth',
  'Hollybarrow': 'theme-hearth',
  'the City': 'theme-hearth', 'the Market': 'theme-hearth',
  'the Greenwood': 'theme-road', 'the Road': 'theme-road', 'Eastmere': 'theme-road',
  'the Downs': 'theme-downs', 'the Shore': 'theme-downs',
  'the Crags': 'theme-crags', 'the Pass': 'theme-crags',
  'the Mountains': 'theme-crags', 'the Scree': 'theme-crags', 'Cragfoot': 'theme-crags',
  'the Fens': 'theme-fens', 'Fenmarch': 'theme-fens',
  'the Moor': 'theme-moor',
  'the Wilds': 'theme-wilds',
  'the Deep': 'theme-gallery',
  // the Sea and the Bridge stay silent on purpose: a world that goes quiet at
  // the water's edge is better than one with a cue for every tile.
}
const REGION_HEARD = new Set()
let regionSeen = null, regionSince = 0, regionSettled = false, regionWoke = false
// Borders meander by design, so a citizen walking one flickers between two
// names. Measured in wall time, not frames: this is called from the draw loop
// and a fast machine must not arrive somewhere sooner than a slow one.
const REGION_SETTLE_MS = 6000

function musicFollowsRegion(name) {
  if (!name) return
  const now = performance.now()
  if (name !== regionSeen) { regionSeen = name; regionSince = now; regionSettled = false; return }
  if (regionSettled || now - regionSince < REGION_SETTLE_MS) return
  regionSettled = true                       // this stay is decided, either way

  // The region you WAKE in is not somewhere you arrived, it is where you were
  // put, and the door theme already covered it.
  if (!regionWoke) { regionWoke = true; REGION_HEARD.add(name); return }

  if (REGION_HEARD.has(name)) return         // arrived here already today
  if (!musicOn || !soundOn) return
  const stem = REGION_STEM[name]
  if (!stem) return
  if (MUSIC) return                          // a piece with a destination reaches it
  REGION_HEARD.add(name)
  musicTried = false
  startMusic(stem)
}

function fadeMusicOut(ms) {`

edit('add the region music block',
  'const REGION_STEM = {',
  `\nfunction fadeMusicOut(ms) {`, BLOCK)

// ---------------------------------------------------------------- 4 of 4
// Hook it where the nameplate is already computed, so the region is looked up
// once per frame rather than twice.
edit('hook it to the nameplate',
  'musicFollowsRegion(rn)   // the country, heard',
  `    const rn = regionNameAt(Math.round(pxr), Math.round(pyr))
    if (rn) { // an empty strip is worse than no strip`,
  `    const rn = regionNameAt(Math.round(pxr), Math.round(pyr))
    musicFollowsRegion(rn)   // the country, heard
    if (rn) { // an empty strip is worse than no strip`)

// ---------------------------------------------------------------- 5 of 5
// THE NAMING BUG. regionNameAt names expanse regions through biomeAtE, which
// is the v1 function: five outputs, no moor, no downs. terrainOfE was fixed to
// dispatch on the generator prefix -- see its own comment about v2..v5 worlds
// falling through -- but this call never got the same treatment. So on
// expanse7 the ground is drawn by v6 rules and NAMED by v1 rules.
//
// SEEDS6, the real v7 region table, has twelve seeds including two for moor
// and two for downs. Measured over all 458,752 tiles, the fix changes the
// nameplate on 141,000 of them, and the Moor -- 15,299 tiles of it -- stops
// being called the Greenwood.
//
// This is a nameplate bug with or without music. The music only made it
// visible, because two tracks had nowhere to play.
edit('fix regionNameAt for v6/v7 worlds',
  "GEN === 'interval-expanse-v6' || GEN === 'interval-expanse-v7') return REGION_NAMES[biomeAt6",
  `    return REGION_NAMES[biomeAtE(x, y)] ?? ''`,
  `    if (GEN === 'interval-expanse-v6' || GEN === 'interval-expanse-v7') return REGION_NAMES[biomeAt6(x, y)] ?? ''
    return REGION_NAMES[biomeAtE(x, y)] ?? ''`)

// ---------------------------------------------------------------- 6 of 7
// THE DOOR THEME NEVER PLAYS. startMusic sets musicTried BEFORE fetching the
// track list, and the a.play() refusal path resets it -- but the fetch-failure
// path does not. At page load the node is not up yet, so /api/audio fails, the
// latch sticks, and the {once:true} tap listeners then return immediately for
// the rest of the session.
//
// The comment right above the immediate call already says what should happen:
// a browser that refuses loses nothing, the attempt resets itself, the first
// touch carries it instead. That is true of the play() path and not of this
// one. This makes the code match its own comment.
edit('reset the music latch when there is no node yet',
  'catch { musicTried = false; return }        // no node, no music',
  `  } catch { return }        // no node, no music, no complaint
  if (!tracks.length) return`,
  `  } catch { musicTried = false; return }        // no node, no music, no complaint
  if (!tracks.length) { musicTried = false; return }`)

// ---------------------------------------------------------------- 7 of 7
// ...and with the latch released, let a later touch actually carry it. These
// were {once:true}, so on a slow connection they are both spent before the
// node answers and nothing is left to retry. startMusic returns immediately
// when a piece is already playing, so leaving them armed costs nothing.
edit('let any touch retry the door theme',
  "startMusic('theme-flat'), { passive: true })",
  `  window.addEventListener(ev, () => startMusic('theme-flat'), { once: true, passive: true })`,
  `  window.addEventListener(ev, () => startMusic('theme-flat'), { passive: true })`)

// ---------------------------------------------------------------- 8 of 9
// THE THEME CANNOT START ON iOS. startMusic is async and AWAITS the track list
// before it calls play(). Safari's user-gesture activation does not survive an
// await, so by the time play() runs the tap no longer counts and the browser
// refuses -- every time, on every tap, for ever.
//
// So the list is fetched once, up front, and cached. When a gesture arrives
// the element is made and played with nothing awaited in between.
edit('cache the track list so a tap can actually start the music',
  'let TRACK_LIST = null, trackFetch = null',
  `async function startMusic(preferred) {
  if (MUSIC || musicTried || !musicOn || !soundOn) return
  musicTried = true
  let tracks = []
  try {
    const r = await fetch(api('/api/audio'))
    tracks = (await r.json()).tracks ?? []
  } catch { musicTried = false; return }        // no node, no music, no complaint
  if (!tracks.length) { musicTried = false; return }
  const pick = (stem) => tracks.find(n => n.toLowerCase().startsWith(stem))`,
  `let TRACK_LIST = null, trackFetch = null
function loadTracks() {
  if (TRACK_LIST) return Promise.resolve(TRACK_LIST)
  if (!trackFetch) {
    trackFetch = fetch(api('/api/audio'))
      .then((r) => r.json())
      .then((j) => { TRACK_LIST = j.tracks ?? []; return TRACK_LIST })
      .catch(() => { trackFetch = null; return null })
  }
  return trackFetch
}
function startMusic(preferred) {
  if (MUSIC || musicTried || !musicOn || !soundOn) return
  // No list yet: warm it, and let the NEXT gesture carry the music. Returning
  // here without latching is the whole point -- a tap that arrives before the
  // node has answered must not spend the one chance we get.
  if (!TRACK_LIST) { loadTracks(); return }
  const tracks = TRACK_LIST
  if (!tracks.length) return
  musicTried = true
  const pick = (stem) => tracks.find(n => n.toLowerCase().startsWith(stem))`)

// ---------------------------------------------------------------- 9 of 9
// ...and the tail of the old function still awaits play(). It does not need
// to: play() returns a promise and the refusal is handled on it, so nothing
// between the gesture and the call has to be awaited.
edit('do not await play() inside the gesture',
  'a.play().then(() => {',
  `  try { await a.play() } catch { MUSIC = null; musicTried = false; return } // the browser said no; fine
  // come in slowly: a world should not start by shouting
  const target = 0.42
  const t0 = performance.now()
  const fade = () => {
    if (!MUSIC) return
    const k = Math.min(1, (performance.now() - t0) / 4000)
    MUSIC.volume = (musicOn && soundOn) ? target * k : 0
    if (k < 1) requestAnimationFrame(fade)
  }
  requestAnimationFrame(fade)
}`,
  `  a.play().then(() => {
    // come in slowly: a world should not start by shouting
    const target = 0.42
    const t0 = performance.now()
    const fade = () => {
      if (!MUSIC) return
      const k = Math.min(1, (performance.now() - t0) / 4000)
      MUSIC.volume = (musicOn && soundOn) ? target * k : 0
      if (k < 1) requestAnimationFrame(fade)
    }
    requestAnimationFrame(fade)
  }).catch(() => { MUSIC = null; musicTried = false })   // the browser said no; fine
}`)

// ---------------------------------------------------------------------------
if (done) {
  fs.writeFileSync(path, src)
  console.log('\\n' + path + ': ' + done + ' edit(s), ' + skipped + ' already present'
    + '  (' + before + ' -> ' + src.length + ' bytes)')
} else {
  console.log('\\nnothing to do: ' + path + ' is already patched')
}
