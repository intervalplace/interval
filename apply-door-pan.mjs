#!/usr/bin/env node
// Two changes to window-web.html's door:
//   1. remove the appearance picker (there is a looking-glass in the world now)
//   2. drift a camera over the island behind the gate
//
//   node apply-door-pan.mjs [path/to/window-web.html]
//
// Idempotent: the second run reports "already patched" and changes nothing.

import fs from 'node:fs'

const path = process.argv[2] ?? 'window-web.html'
let src = fs.readFileSync(path, 'utf8')
const before = src.length
let done = 0, skipped = 0

const edit = (name, marker, find, repl) => {
  if (src.includes(marker)) { console.log('  ..  ' + name + ' (already patched)'); skipped++; return }
  const n = src.split(find).length - 1
  if (n !== 1) throw new Error(name + ': expected 1 match of the anchor, found ' + n)
  src = src.replace(find, repl); console.log('  ok  ' + name); done++
}

// ---------------------------------------------------------------- 1 of 2
// The picker goes. No JS needs touching: drawLookPreview() already bails with
// `if (!c) return`, and the button loop is guarded by `if (b)`.
//
// The gate still sends set_look on entry, and that is correct to leave alone.
// Per the comment at the reconciliation: once a citizen has a face, set_look
// is REFUSED anywhere but at a looking-glass. So an established citizen's
// appearance cannot be clobbered by this -- the send is simply refused. The
// only change is that a new citizen now starts as appearance 1 and picks
// their face at the glass, which is the point.
edit('remove the door appearance picker',
  '<!-- appearance is set at a looking-glass',
  `    <div id="gatelook" style="margin:8px 0;user-select:none">
      <button id="lookprev" type="button">&lsaquo;</button>
      <canvas id="lookcv" width="48" height="64" style="vertical-align:middle;image-rendering:pixelated"></canvas>
      <button id="looknext" type="button">&rsaquo;</button>
      <div style="font-size:10px;color:var(--dim);margin-top:2px" id="looknum">appearance 1 of 256</div>
    </div>
`,
  `    <!-- appearance is set at a looking-glass in the world, not here. The
         door asks for a name and nothing else. -->
`)

// ---------------------------------------------------------------- 2 of 2
const PAN = `
document.getElementById('gatebtn').addEventListener('click', () => fadeMusicOut(2000))

// ---- the door stands in the world ---------------------------------------
// Two wrong turns got here. First it drew miniCv scaled up -- but one pixel
// per tile is an ABSTRACTION of the world, so blown up it is coloured
// rectangles, because that is exactly what it is. Then it painted real ground
// with paintGroundTile, which looked like Tallyholm but was a still life:
// terrain and nothing living in it.
//
// The answer was already running. The frame loop calls drawScene from page
// load, not from entry, so the moment a state arrives the LIVE world is
// being drawn to #world every frame -- citizens, mobs, nodes, the day cycle,
// all of it. A canvas laid over the top was hiding it.
//
// So this steers the world's own camera and gets out of the way. What waits
// behind the gate is the world itself, at this tick, with whoever is in it.
// You enter what you were looking at.
const PAN_WAY = [
  [0.22, 0.52], [0.34, 0.42], [0.44, 0.38], [0.58, 0.46],
  [0.68, 0.62], [0.78, 0.44], [0.86, 0.32], [0.62, 0.20],
  [0.46, 0.14], [0.34, 0.20], [0.42, 0.72], [0.48, 0.84],
  [0.32, 0.74], [0.22, 0.52],
]
const PAN_SPEED = 1.25        // TILES per second. A drift, not a journey.

// Until the world answers, there is nothing for drawScene to draw, and
// 'waking the world...' over black is a poor welcome. This paints ground only
// in that gap and hides itself the moment the real thing is available.
const panCv = document.createElement('canvas')
panCv.id = 'gatepan'
panCv.style.cssText = 'position:fixed;inset:0;z-index:9;width:100%;height:100%;display:none'
document.body.insertBefore(panCv, document.getElementById('gate'))
const panCx = panCv.getContext('2d')
const panGround = document.createElement('canvas')
const panGx = panGround.getContext('2d')
let panKey = '', panT = 0, panLast = 0, panSig = ''

function panSpline(t) {
  const n = PAN_WAY.length
  const i = Math.floor(t) % n, f = t - Math.floor(t)
  const p = (k) => PAN_WAY[((i + k) % n + n) % n]
  const cr = (a, b, c, d) => {
    const t2 = f * f, t3 = t2 * f
    return 0.5 * ((2*b) + (-a + c)*f + (2*a - 5*b + 4*c - d)*t2 + (-a + 3*b - 3*c + d)*t3)
  }
  return [cr(p(-1)[0], p(0)[0], p(1)[0], p(2)[0]) * W,
          cr(p(-1)[1], p(0)[1], p(1)[1], p(2)[1]) * H]
}

function panFrame(now) {
  requestAnimationFrame(panFrame)
  const g = document.getElementById('gate')
  const atDoor = !!g && g.style.display !== 'none'
  // A login screen shows scenery, not somebody's inventory. #panel and #status
  // are DOM, not canvas, so the gate's blur never touched them and the skill
  // list has been reading through it all along.
  document.body.classList.toggle('at-door', atDoor)
  if (!atDoor) { panCv.style.display = 'none'; panLast = 0; return }

  const dt = panLast ? Math.min(0.05, (now - panLast) / 1000) : 0
  panLast = now
  // constant speed along the spline: step t, measure how far that moved in
  // tiles, and rescale, so the pace is even however far apart the scenes sit
  if (dt) {
    const [x0, y0] = panSpline(panT)
    const [x1, y1] = panSpline(panT + 0.001)
    const per = Math.max(1e-4, Math.hypot(x1 - x0, y1 - y0) / 0.001)
    panT += (PAN_SPEED * dt) / per
  }
  const [fx, fy] = panSpline(panT)

  // drawScene only moves the camera itself when it can find you in the state,
  // and before entering it cannot -- so cam is ours to steer, and the world
  // renders wherever we point it. Clamped exactly as drawScene clamps.
  cam.x = Math.max(0, Math.min(Math.max(0, W - VIEW_W), fx - VIEW_W / 2))
  cam.y = Math.max(0, Math.min(Math.max(0, H - VIEW_H), fy - VIEW_H / 2))

  if (curState && groundReady) { panCv.style.display = 'none'; return }

  // ---- the waking gap: our own ground, same tiles, no life in them yet ----
  panCv.style.display = 'block'
  const sig = W + 'x' + H + ':' + GEN
  if (sig !== panSig) { panSig = sig; panKey = '' }
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const w = Math.round(panCv.clientWidth * dpr), h = Math.round(panCv.clientHeight * dpr)
  if (panCv.width !== w || panCv.height !== h) { panCv.width = w; panCv.height = h; panKey = '' }

  const vwT = w / (TILE * dpr), vhT = h / (TILE * dpr), M = 6
  const ox = Math.max(0, Math.floor(fx - vwT / 2) - M)
  const oy = Math.max(0, Math.floor(fy - vhT / 2) - M)
  const cw = Math.ceil(vwT) + M * 2 + 2, ch = Math.ceil(vhT) + M * 2 + 2
  const key = ox + ':' + oy + ':' + cw + ':' + ch + ':' + panSig
  if (key !== panKey) {
    panKey = key
    if (panGround.width !== cw * TILE) { panGround.width = cw * TILE; panGround.height = ch * TILE }
    panGx.clearRect(0, 0, panGround.width, panGround.height)
    panGx.save(); panGx.translate(-ox * TILE, -oy * TILE)
    try {
      for (let y = oy; y < Math.min(H, oy + ch); y++)
        for (let x = ox; x < Math.min(W, ox + cw); x++) paintGroundTile(panGx, x, y)
    } catch { panKey = '' }
    panGx.restore()
  }
  panCx.setTransform(1, 0, 0, 1, 0, 0)
  panCx.fillStyle = '#1b2a1a'; panCx.fillRect(0, 0, w, h)
  panCx.setTransform(dpr, 0, 0, dpr, 0, 0)
  panCx.drawImage(panGround,
    (ox * TILE) - (fx * TILE - vwT * TILE / 2),
    (oy * TILE) - (fy * TILE - vhT * TILE / 2))
  panCx.setTransform(1, 0, 0, 1, 0, 0)
}
requestAnimationFrame(panFrame)
`

edit('add the door camera pan',
  "const panCv = document.createElement('canvas')",
  `document.getElementById('gatebtn').addEventListener('click', () => fadeMusicOut(2000))`,
  PAN.trim() + '\n')

// ---------------------------------------------------------------- 3 of 3
// #gate was painted to sit over a black page, so it carried the whole mood
// itself: a radial gradient to 92% black at the edges plus a backdrop blur.
// With something worth seeing behind it that is far too much. The pan draws
// its own vignette now, so the gate only has to soften.
edit('let the gate show what is behind it',
  'rgba(10,8,5,.10) 0%, rgba(8,6,4,.62)',
  `    background: radial-gradient(ellipse at center, rgba(22,18,12,.55) 0%, rgba(12,10,6,.92) 78%);
    backdrop-filter: blur(2.5px) saturate(.8);`,
  `    background: radial-gradient(ellipse at center, rgba(10,8,5,.10) 0%, rgba(8,6,4,.62) 80%);
    backdrop-filter: blur(1.2px) saturate(.92);`)

// ---------------------------------------------------------------- 4 of 4
// The card goes translucent. NOT via .stone -- that class is also #panel and
// half the furniture inside the world, and those want to stay solid. #gatebox
// only. It keeps its own small backdrop blur so the text stays readable while
// country moves underneath it.
edit('let light through the gate card',
  '#gatebox { position: relative; background-color: rgba(41, 31, 18, .82)',
  `  #gatebox { position: relative; box-shadow: 0 0 60px rgba(0,0,0,.8), 0 0 24px rgba(230,126,34,.06); }`,
  `  #gatebox { position: relative; background-color: rgba(41, 31, 18, .82);
    backdrop-filter: blur(3px) saturate(.85);
    box-shadow: 0 0 60px rgba(0,0,0,.55), 0 0 24px rgba(230,126,34,.06); }`)

// ---------------------------------------------------------------- 5 of 5
edit('hide the HUD while the gate is up',
  'body.at-door #panel',
  `  #gatebox { position: relative; background-color: rgba(41, 31, 18, .82);`,
  `  /* A login screen shows scenery and nothing else. These are DOM, not
     canvas, so the gate's blur never touched them. */
  body.at-door #panel, body.at-door #status, body.at-door #feed,
  body.at-door #topnav { display: none !important; }
  body.at-door #frame { border-color: transparent !important; background: transparent !important; }

  /* FULL BLEED, WITHOUT WIDENING THE VIEW.
     fitCanvas keeps cv.width / (TILE * ZR) constant on purpose -- the keyhole
     is the design, and a citizen on a big screen must not see half the
     country. So the canvas is not asked to render more; it is DISPLAYED
     larger and cropped. The bitmap stays 560x400, object-fit does the rest.
     !important is needed because fitCanvas writes cv.style.height inline. */
  body.at-door #world {
    position: fixed !important; inset: 0 !important; z-index: 1 !important;
    width: 100vw !important; height: 100vh !important; height: 100dvh !important;
    max-width: none !important; object-fit: cover !important;
  }
  #gatebox { position: relative; background-color: rgba(41, 31, 18, .82);`)

// ---------------------------------------------------------------- 6 of 6
// THE DOOR SHOWS TALLYHOLM, NOT THE PRACTICE OF IT.
//
// noughtTick pushes the practice island through onLocalState every 600ms, into
// the same curState the renderer reads -- so while Nought runs, its island IS
// what drawScene draws, and the live world is overwritten twenty times a
// second. Standing at the door you were shown the waiting room while the real
// place, the one with people in it, was the thing you could not see.
//
// Building it is deferred to after the gate closes. Nothing else changes:
// onState still stashes the live state in lastLive and still draws it, so the
// door now watches Tallyholm at this tick, with whoever is in it. Crossing is
// then walking into the place you were looking at.
//
// The cost is that 'Enter as nought' builds the island on the way in rather
// than in advance. Warm that is 35ms from cache; cold it is minutes -- which
// is a loading screen, once, with the door theme still playing over it.
edit('build the practice island after the gate, not before it',
  'if (entered) ensureNought(s)   // the door watches Tallyholm',
  `    ensureNought(s)`,
  `    if (entered) ensureNought(s)   // the door watches Tallyholm; see below`)

// ---------------------------------------------------------------------------
if (done) {
  fs.writeFileSync(path, src)
  console.log('\n' + path + ': ' + done + ' edit(s), ' + skipped + ' already present'
    + '  (' + before + ' -> ' + src.length + ' bytes)')
} else {
  console.log('\nnothing to do: ' + path + ' is already patched')
}
