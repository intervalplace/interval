// A FLY-OVER OF THE WHOLE ISLAND, THROUGH THE WINDOW'S OWN EYES.
//
// Not a map and not a render of my own: this stands the real browser window
// up in a real browser, hands it the real world the generator builds, and
// walks a citizen to every place there is, photographing what they see.
//
// Everything the window draws is drawn by the window. The only things faked
// are the socket it expects to be fed by and the door it expects to be let
// through, because a sweep has nobody to type a name at the gate.
//
// WHY NOT POINT THE CAMERA DIRECTLY: because the camera follows the citizen,
// clamped to the world's edges, and nothing else. Moving the body is what a
// player does and it is the only way to be sure the picture is the one a
// player would actually get, edge clamping and all.
//
//   node sweep.mjs                 every settlement, tiled, and every place between
//   node sweep.mjs --only anchor   one settlement
//   node sweep.mjs --list          what it would photograph, without doing it
import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import E from './engine.js'
import * as WG from './worldgen-expanse7.mjs'

const HERE = fileURLToPath(new URL('.', import.meta.url))
const OUT = process.env.SWEEP_OUT || (HERE + 'sweep-out')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const arg = (f) => { const i = process.argv.indexOf(f); return i > 0 ? process.argv[i + 1] : null }

// ---------------------------------------------------------------- the world
// The real island, built by the real generator. 10,630 nodes and 706
// creatures: this is not a test fixture, it is the place.
const quiet = console.log
console.log = () => {}
const g = WG.makeExpanse7Genesis('sweep', 'a'.repeat(64), 0, 896, 512)
const world = WG.buildWorld(g)
console.log = quiet
delete world._composition          // the generator's own notes, not world state

// ------------------------------------------------------------- where to look
//
// THE VIEW IS A KEYHOLE ON PURPOSE: fourteen tiles over ten, whatever the
// screen. So a town is not one picture. Each settlement is tiled at a stride
// a little under the view, so every tile of it is seen and the seams overlap
// rather than meet.
const VIEW_W = 18, VIEW_H = 13
const STRIDE_X = 14, STRIDE_Y = 10

const shots = []
const at = (place, name, x, y, note) => shots.push({ place, name, x: Math.round(x), y: Math.round(y), note })

const towns = WG.settlementsOf(g)
for (const t of towns) {
  const w = t.w ?? VIEW_W, h = t.h ?? VIEW_H
  const cols = Math.max(1, Math.ceil(w / STRIDE_X)), rows = Math.max(1, Math.ceil(h / STRIDE_Y))
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // the centre of each patch, so the citizen stands in what is photographed
      const x = t.x + (w * (c + 0.5)) / cols
      const y = t.y + (h * (r + 0.5)) / rows
      at(t.tag, t.name ?? t.tag, x, y, cols * rows > 1 ? `${r + 1}/${rows} down, ${c + 1}/${cols} across` : '')
    }
  }
}

// the places that are not settlements, named by the generator itself
const loose = []
if (WG.SPAN_SITES) for (const s of WG.SPAN_SITES) loose.push(['span', s.name ?? s.tag ?? 'span', s.x, s.y])
if (WG.LOCALES) for (const [k, v] of Object.entries(WG.LOCALES)) {
  if (typeof v?.x === 'number') loose.push(['locale', v.name ?? k, v.x, v.y])
}
for (const [kind, name, x, y] of loose) at(kind, name, x, y, '')

// and the things the world stood up that are worth a look of their own
const ONE_OFF = ['anvil', 'furnace', 'market', 'stall', 'bell', 'span', 'hoard', 'eel-buck', 'grove-plot', 'stamp']
const byKind = {}
for (const n of Object.values(world.nodes)) (byKind[n.type] ??= []).push(n)
for (const kind of ONE_OFF) {
  const list = byKind[kind] ?? []
  // one of each, and all of them when the world is deliberately thin
  for (const n of list.slice(0, list.length <= 8 ? list.length : 3)) {
    at('thing', kind + ' at ' + n.x + ',' + n.y, n.x, n.y, '')
  }
}

const only = arg('--only')
const plan = only ? shots.filter((s) => s.place === only || s.name.toLowerCase().includes(only.toLowerCase())) : shots

if (process.argv.includes('--list')) {
  for (const s of plan) console.log(`${s.place.padEnd(14)} ${s.name.padEnd(26)} ${s.x},${s.y}  ${s.note}`)
  console.log(`\n${plan.length} pictures, ${towns.length} settlements`)
  process.exit(0)
}

// --------------------------------------------------------------- the page
//
// window-web.html, unaltered, with a script before it that gives it a socket
// and a script after it that walks the citizen.
const WIN = readFileSync(HERE + 'window-web.html', 'utf8')
const BEFORE_TPL = `<script>
  // THE SOCKET THE WINDOW EXPECTS. It is handed the same frames the pillar
  // sends and in the same order, so nothing downstream can tell the
  // difference. A sweep has no pillar and wants none: the point is to
  // photograph the world the GENERATOR builds, with nothing between.
  window.__socks = []
  window.WebSocket = class { constructor () { this.readyState = 1; this.binaryType = ''
    window.__socks.push(this); setTimeout(() => this.onopen && this.onopen(), 0) }
    send () {} close () {} addEventListener () {} }
  // §7ec: THE SWEEP IS THE PILLAR, for the three things a window is TOLD.
  //
  // Refusing every fetch meant the sweep photographed the window's fallback:
  // derived town seats (which drift, and did, by four tiles at Millbrook),
  // the straight-line placeholder roads, and the window's own guess at every
  // surface on the island. So the pictures showed houses standing on grass
  // and no road network, and both were artefacts of the sweep rather than
  // faults in the world.
  //
  // A sweep has no pillar, but it HAS the world: it built it. So it answers
  // the three endpoints out of the same generator the pillar would use, and
  // the pictures are what a citizen actually sees.
  const SERVED = __SERVED__
  window.fetch = (u) => {
    const k = String(u)
    for (const name of ['settlements', 'roads', 'ground'])
      if (k.includes('/api/' + name))
        return Promise.resolve({ ok: true, json: async () => SERVED[name] })
    return Promise.resolve({ ok: false, json: async () => null, arrayBuffer: async () => new ArrayBuffer(0) })
  }
  window.AudioContext = undefined; window.webkitAudioContext = undefined
</script>`
const AFTER = (plan, state, myId) => `<script>
  // THE SWEEP DRIVES ITSELF, IN THE SAME PAGE AS THE WINDOW.
  //
  // The first go put the window in an iframe and drove it from the parent.
  // The parent's load handler never fired: under a virtual clock the frame had
  // already loaded by the time the handler was attached, so the sweep sat at
  // "starting" for ever and reported no pictures without reporting a fault.
  // One page, no frame, nothing to race.
  const SHOTS = ${JSON.stringify(plan)}
  const STATE = ${JSON.stringify(state)}
  const ME = ${JSON.stringify(myId)}
  ;(async () => {
    const say = (t) => { document.title = t }
    try {
      // STRAIGHT INTO THE WINDOW'S OWN HANDLER, rather than through a socket
      // it never opens. connect() picks a node by asking two HTTP endpoints
      // first, and a sweep has no node: with nothing answering, the window
      // correctly says so and retries for ever, and never reaches the socket.
      // onMessage is what the socket would have called anyway.
      if (typeof onMessage !== 'function') { say('SWEEPFAIL the window has no onMessage'); return }
      const feedOne = (m) => onMessage({ data: JSON.stringify(m) })
      feedOne({ type: 'hello', playerId: ME })
      // through the door without typing a name: there is nobody here to type one
      try { entered = true } catch (e) {}
      for (const id of ['gate', 'gateinfo']) {
        const el = document.getElementById(id); if (el) el.style.display = 'none'
      }
      const cv = document.getElementById('world')
      if (!cv) { say('SWEEPFAIL no canvas called world'); return }
      const settle = (ms) => new Promise((r) => setTimeout(r, ms))
      const out = []
      for (const sh of SHOTS) {
        STATE.players[ME].x = sh.x
        STATE.players[ME].y = sh.y
        // NOON, AND NOT THE TICK THE WORLD WAS BORN ON. A world starts at
        // tick 1, which the window correctly draws as before dawn: the first
        // sweep came back a page of purple dark. The day is 2400 ticks and
        // noon is a quarter of the way through it.
        STATE.tick = 600 + out.length
        feedOne({ type: 'state', state: STATE, worldId: 'sweep' })
        // long enough for the ground patch to be re-baked and for the
        // interpolation to land ON the new tile rather than between two
        await settle(300)
        out.push(cv.toDataURL('image/png'))
        say('SWEEPAT ' + out.length + '/' + SHOTS.length)
      }
      const box = document.createElement('div')
      box.id = 'sweepout'
      box.textContent = out.join('|')
      document.body.appendChild(box)
      say('SWEEPDONE ' + out.length + ' ' + cv.width + 'x' + cv.height)
    } catch (e) {
      say('SWEEPFAIL ' + (e && e.message ? e.message : String(e)))
    }
  })()
</script>`

// the citizen doing the walking: a plain body, so nothing is hidden behind gear
const myId = 'f'.repeat(64)
world.players[myId] = { x: towns[0].x, y: towns[0].y, hp: 10, maxHp: 10, gold: 0,
  inventory: Array(28).fill(null), skills: {},
  equipment: { weapon: null, offhand: null, head: null, body: null, legs: null } }

mkdirSync(OUT, { recursive: true })
const pagePath = OUT + '/sweep-page.html'
// what the pillar would serve, out of the same generator it would use
const served = (() => {
  const rows = []
  for (let y = 0; y < g.worldH; y++) {
    const runs = []
    let cur = null, start = 0
    for (let x = 0; x <= g.worldW; x++) {
      const k = x < g.worldW ? WG.groundKindAt(g, x, y) : null
      if (k !== cur) { if (cur !== null) runs.push([start, x - start, cur]); cur = k; start = x }
    }
    if (runs.length) rows.push([y, runs])
  }
  return {
    settlements: { settlements: WG.settlementsOf(g).map((t) => ({ tag: t.tag, name: t.name, x: t.x, y: t.y, w: t.w, h: t.h })) },
    roads: { tiles: [...WG.roadTilesOf(g)], bridges: [], bends: [] },
    ground: { w: g.worldW, h: g.worldH, rows },
  }
})()
const BEFORE = BEFORE_TPL.replace('__SERVED__', JSON.stringify(served))
const page = WIN.replace('<head>', '<head>' + BEFORE).replace('</body>', AFTER(plan, world, myId) + '</body>')
if (!page.includes('__socks')) { console.log('could not inject the socket: window-web.html has no <head>'); process.exit(1) }
if (!page.includes('SWEEPDONE')) { console.log('could not inject the driver: window-web.html has no </body>'); process.exit(1) }
writeFileSync(pagePath, page)

console.log(`${plan.length} pictures to take, ${towns.length} settlements`)
console.log('driving the window...')
const dom = execFileSync(CHROME, ['--headless', '--disable-gpu', '--dump-dom', '--hide-scrollbars',
  // The view is fourteen tiles over ten whatever the screen, so a bigger
  // window buys nothing. A bigger device ratio buys everything: RES absorbs
  // it, the canvas doubles, and the same keyhole arrives twice as sharp.
  '--force-device-scale-factor=2',
  '--virtual-time-budget=' + (plan.length * 600 + 30000), '--window-size=1200,900',
  pathToFileURL(pagePath).href], { encoding: 'utf8', maxBuffer: 1024 * 1024 * 1024 })

// THE TITLE, NOT A STRING IN THE PAGE. A first version looked for its own
// marker anywhere in the dumped document and found it in the source of the
// script that would have written it, so a sweep that did nothing reported
// success.
const title = (/<title>([^<]*)<\/title>/.exec(dom) || [, ''])[1]
console.log('the window says: ' + title)
if (!title.startsWith('SWEEPDONE')) {
  console.log('the sweep did not finish.')
  const err = dom.match(/Uncaught[^<\n]{0,200}/)
  if (err) console.log('  ' + err[0])
  process.exit(1)
}

const uris = (dom.match(/data:image\/png;base64,[A-Za-z0-9+/=]+/g) || [])
console.log(`${uris.length} pictures came back`)
const shotDir = OUT + '/shots'
if (existsSync(shotDir)) rmSync(shotDir, { recursive: true })
mkdirSync(shotDir, { recursive: true })
const named = []
uris.forEach((u, i) => {
  const s = plan[i]
  if (!s) return
  const file = String(i).padStart(3, '0') + '-' + s.place + '-' + s.x + '_' + s.y + '.png'
  writeFileSync(shotDir + '/' + file, Buffer.from(u.split(',')[1], 'base64'))
  named.push({ ...s, file })
})

// ---- AND A SHEET TO LOOK AT THEM ON, which is the whole point ----
const bySettlement = {}
for (const s of named) (bySettlement[s.place] ??= []).push(s)
const sheet = `<!doctype html><meta charset="utf-8"><title>interval: the island, swept</title>
<style>
  body { font: 13px/1.5 Verdana, sans-serif; background: #211d18; color: #e8e0cc; margin: 0; padding: 18px 20px }
  h1 { font-size: 20px; letter-spacing: .06em; margin: 0 0 4px }
  p.note { color: #a79c86; margin: 0 0 22px; max-width: 70em }
  h2 { font-size: 15px; letter-spacing: .08em; color: #d9b45e; margin: 26px 0 8px;
       border-bottom: 1px solid #4a4237; padding-bottom: 4px }
  .row { display: flex; flex-wrap: wrap; gap: 10px }
  .s { background: #2b261f; border: 1px solid #443d32; padding: 5px }
  .s img { display: block; width: 420px; height: auto; image-rendering: auto }
  .s div { font-size: 11px; color: #a79c86; padding-top: 4px }
</style>
<h1>THE ISLAND, SWEPT</h1>
<p class="note">${named.length} pictures, taken by walking a citizen to every place there is and
photographing what the browser window drew. Everything here is the window's own drawing of the
world the generator builds: ${Object.keys(world.nodes).length} things standing and
${Object.keys(world.mobs).length} creatures. The view is the keyhole the game gives you,
fourteen tiles over ten, so a town is several pictures.</p>
${Object.entries(bySettlement).map(([place, list]) => `
<h2>${place}: ${list.length} ${list.length === 1 ? 'picture' : 'pictures'}</h2>
<div class="row">${list.map((s) => `<div class="s"><img src="shots/${s.file}" loading="lazy">
  <div>${s.name}${s.note ? ' &middot; ' + s.note : ''} &middot; ${s.x},${s.y}</div></div>`).join('')}</div>`).join('')}
`
writeFileSync(OUT + '/sweep.html', sheet)
console.log('wrote ' + named.length + ' pictures and ' + OUT + '/sweep.html')
