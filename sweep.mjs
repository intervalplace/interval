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
//
// IT WAS PHOTOGRAPHING NONE OF THEM. This read `Object.entries(WG.LOCALES)`
// and asked each value for a `.x`, and LOCALES is an ARRAY of records keyed
// `fx`/`fy` -- a fraction of the map, not a tile. So `typeof v.x === 'number'`
// was false twenty times out of twenty and the list came out empty, on a
// sweep whose own first line says it photographs "every place there is".
//
// It said so, too, in a way nobody read: `--only delving` returned nought
// pictures and reported "SWEEPDONE 0". A sweep that finds nothing to do and
// says it cheerfully is the same fault as a dead checker that reads as a live
// one.
//
// `localesOf` is the generator's own answer and gives tiles. The PLACES get
// their own shots from `placeSeatsOf`, because a locale's centre is a
// bearing and the place drawn in it may be thirty tiles off.
const loose = []
if (WG.SPAN_SITES) for (const s of WG.SPAN_SITES) loose.push(['span', s.name ?? s.tag ?? 'span', s.x, s.y])
for (const L of WG.localesOf(g)) loose.push(['locale', L.name, L.x, L.y])
for (const P of WG.placeSeatsOf(g)) loose.push(['place', P.name ?? P.tag, P.x, P.y])
for (const [kind, name, x, y] of loose) at(kind, name, x, y, '')

// §7ed: AND THE OPEN COUNTRY, which is most of the island and was the one
// thing this sweep never photographed. It covered towns, named locales, span
// sites and one-off works: everything somebody BUILT. But "does the world look
// generated" is a question about the ground between the towns, and the only
// pictures of it were whatever happened to fall in the corner of a town shot.
//
// Three places in each country, spread far apart, each one taken where that
// country actually is rather than at a guessed coordinate.
{
  const want = ['heartlands', 'greenwood', 'downs', 'moor', 'fens', 'crags', 'wilds']
  const found = Object.fromEntries(want.map((b) => [b, []]))
  const far = (list, x, y) => list.every((p) => Math.hypot(p[0] - x, p[1] - y) > 70)
  for (let y = 12; y < g.worldH - 12; y += 7) {
    for (let x = 12; x < g.worldW - 12; x += 7) {
      const b = WG.biomeAt ? WG.biomeAt(g, x, y) : null
      if (!b || !found[b] || found[b].length >= 3) continue
      if (WG.isWater(g, x, y)) continue
      if (!far(found[b], x, y)) continue
      found[b].push([x, y])
    }
  }
  for (const b of want) for (const [x, y] of found[b]) at('country', b, x, y, '')
}

// and the things the world stood up that are worth a look of their own
// §7eg: AND THE THINGS THE WINDOW ONLY LEARNED TO DRAW THIS WEEK. Six of
// these answered a click and drew nothing until two days ago, four of them
// the only one of themselves in the world, and the sweep had never stood in
// front of any of them. A window that has just been taught a word should be
// photographed saying it.
const ONE_OFF = ['anvil', 'furnace', 'market', 'stall', 'bell', 'span', 'hoard', 'eel-buck', 'grove-plot', 'stamp',
  'rockfall', 'tollgate', 'altar', 'sawpit', 'looking-glass', 'hearth', 'bellwork']
const byKind = {}
for (const n of Object.values(world.nodes)) (byKind[n.type] ??= []).push(n)
for (const kind of ONE_OFF) {
  const list = byKind[kind] ?? []
  // one of each, and all of them when the world is deliberately thin
  for (const n of list.slice(0, list.length <= 8 ? list.length : 3)) {
    at('thing', kind + ' at ' + n.x + ',' + n.y, n.x, n.y, '')
  }
}

const WALKN = (() => { const i = process.argv.indexOf('--walk'); return i > 0 ? Number(process.argv[i + 1]) || 40 : 0 })()
// §7em: --smoke, THE ONE TEST THAT RUNS THE WINDOW.
//
// Every test in test/window.test.mjs reads the SOURCE. Not one of them runs
// it, and that is how two frozen windows reached interval.place in a week: a
// const read above its own declaration, and a canvas state leaked on every
// one of twenty-three `return` paths. Both were runtime faults, both invisible
// to a grep, both shipped through a green suite.
//
// This stands the real window in a real browser, feeds it the real world, and
// asks three questions a reading cannot: did the window report a draw error,
// did it draw anything at all, and is it STILL drawing a moment later. The
// third is the one that catches a window which has quietly stopped: a frozen
// canvas is identical frame to frame, and a live one never is, because
// something is always flickering or breathing somewhere.
// §7en: --meter, WHAT A FRAME COSTS.
//
// The window has carried a frame meter in its status line for a long time --
// worst gap, jitter -- and nothing has ever recorded it or held it to
// anything. Nobody knows what this window costs on a phone, in a town, at
// night, in the rain, which is the first thing "professional grade" means.
//
// Timed INSIDE the page, because `performance.now()` measures real CPU even
// under Chrome's virtual clock: only idle time is virtualised, so a tight
// loop of draws reports honest milliseconds. Measured by hand first: a loop
// of forty million square roots came back as 229ms rather than 0.
const METER = process.argv.includes('--meter')
const SMOKE = process.argv.includes('--smoke')
const LIT = process.argv.includes('--lit')
// §7ek: --doing <verb>, WHICH POSTURE A DEED IS MIMED IN.
//
// Burying was reported as having no animation at all, and it was true: `bury`
// was filed under the posture for stirring a pot, which is a two pixel lean
// and an arm rocking with nothing in the hand. A table cannot say whether
// that reads as digging and neither can a count of canvas calls. So this
// stands the window up, files the deed, and photographs the citizen close
// enough to see, six frames across the posture's own length.
const DOING = arg('--doing')
// §7ek: --menu <x,y>, WHAT A RIGHT CLICK ACTUALLY LOOKS LIKE.
//
// The menu is DOM, not canvas, so toDataURL cannot see it and every check in
// this project that reads a menu reads the option list rather than the thing
// a person sees. A list that is correct and ugly is still a fault here. This
// opens one over the real world and lets Chrome photograph the page.
const MENU = arg('--menu')
// --pick <n>: press the nth option on the menu and photograph what it opened.
// A verb with several variants is ONE line that opens a second page (§7y), so
// a picture of the first page says nothing about the page that matters.
const PICK = arg('--pick')
// --caster: a citizen who can actually speak. The sweep's walker is a plain
// body on purpose, and every word in the book is dimmed for them, so a
// picture of the spell page taken by that body shows nine greyed rows.
const CASTER = process.argv.includes('--caster')
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
  const WALKN = ${JSON.stringify(WALKN)}
  const LIT = ${JSON.stringify(LIT)}
  const SMOKE = ${JSON.stringify(SMOKE)}
  const DOING = ${JSON.stringify(DOING)}
  const MENU = ${JSON.stringify(MENU)}
  const PICK = ${JSON.stringify(PICK)}
  const BOOK = ${JSON.stringify(process.argv.includes('--book'))}
  const METER = ${JSON.stringify(METER)}
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
      if (LIT) feedOne({ type: 'lit', lit: true })
      // through the door without typing a name: there is nobody here to type one
      try { entered = true } catch (e) {}
      for (const id of ['gate', 'gateinfo']) {
        const el = document.getElementById(id); if (el) el.style.display = 'none'
      }
      const cv = document.getElementById('world')
      if (!cv) { say('SWEEPFAIL no canvas called world'); return }
      const settle = (ms) => new Promise((r) => setTimeout(r, ms))
      const out = []
      if (METER) {
        // WHAT A FRAME COSTS, COUNTED RATHER THAN TIMED.
        //
        // Timing it here is not possible and pretending otherwise would be
        // worse than not measuring. Chrome's virtual clock pauses while a
        // task runs and advances between tasks, so performance.now() is
        // CONSTANT inside a task: sixty draws of a 2400x1714 scene came back
        // as 0.00ms each, and 0.00ms for twenty of them with the pixels
        // forced out. That is not a fast window, it is a stopped clock, and
        // a meter that reports it is the dead checker all over again.
        //
        // So: count the work. Every canvas call a frame makes, which is
        // immune to the clock, deterministic run to run, and the thing that
        // actually regresses -- somebody adds a pass over every tile and the
        // count doubles. A millisecond figure belongs in the packaged client
        // on real hardware (the Unreal window learned this the same way: see
        // "the editor is not the game").
        // STAND WHERE WE WERE ASKED TO. The first version never moved the
        // citizen, so --only anchor and --only Bleakfell both measured the
        // spawn and came back with the same number to the call: two readings
        // that agree because neither was taken where it said.
        if (SHOTS.length) { STATE.players[ME].x = SHOTS[0].x; STATE.players[ME].y = SHOTS[0].y }
        STATE.tick = 600
        feedOne({ type: 'state', state: STATE, worldId: 'sweep' })
        await settle(800)
        if (typeof drawScene !== 'function') { say('SWEEPFAIL no drawScene to time'); return }
        if (!curState || !groundReady) {
          say('SWEEPFAIL the meter had nothing to draw: curState=' + !!curState
            + ' groundReady=' + (typeof groundReady === 'undefined' ? 'undefined' : groundReady)); return
        }
        const COUNTED = ['fillRect', 'strokeRect', 'fill', 'stroke', 'drawImage',
          'fillText', 'strokeText', 'arc', 'ellipse', 'moveTo', 'lineTo', 'beginPath',
          'save', 'restore', 'createRadialGradient', 'getImageData', 'putImageData']
        let calls = 0
        const real = {}
        for (const k of COUNTED) {
          if (typeof cx[k] !== 'function') continue
          real[k] = cx[k].bind(cx)
          cx[k] = function (...a) { calls++; return real[k](...a) }
        }
        // SAVE AND RESTORE ARE COUNTED SEPARATELY TOO, because an unbalanced
        // pair is what froze this window once already: the stack grew by one
        // per creature per frame until the context stopped drawing.
        let saves = 0, restores = 0
        cx.save = function (...a) { calls++; saves++; return real.save(...a) }
        cx.restore = function (...a) { calls++; restores++; return real.restore(...a) }
        calls = 0
        drawScene(performance.now())
        const one = calls, s1 = saves, r1 = restores
        for (const k of COUNTED) if (real[k]) cx[k] = real[k]
        say('METER calls ' + one + ' saves ' + s1 + ' restores ' + r1
          + ' px ' + cv.width + 'x' + cv.height)
        return
      }
      if (MENU) {
        const [mx, my] = MENU.split(',').map(Number)
        const meM = STATE.players[ME]
        // stand beside it, so nothing is dimmed for distance
        meM.x = mx; meM.y = my - 1
        STATE.tick = 600
        feedOne({ type: 'state', state: STATE, worldId: 'sweep' })
        // long enough for the ground to arrive and be baked: the first go
        // photographed a flat green field with a correct menu floating over
        // it, which says nothing about how the menu sits on the world
        await settle(3000)
        STATE.tick = 601
        feedOne({ type: 'state', state: JSON.parse(JSON.stringify(STATE)), worldId: 'sweep' })
        await settle(800)
        // through the window's own listener, with the button the world reads
        const r = cv.getBoundingClientRect()
        const sx = r.left + ((mx - cam.x + 0.5) * TILE * ZR) * (r.width / cv.width)
        const sy = r.top + ((my - cam.y + 0.5) * TILE * ZR) * (r.height / cv.height)
        cv.dispatchEvent(new MouseEvent('pointerdown',
          { clientX: sx, clientY: sy, bubbles: true }))
        cv.dispatchEvent(new MouseEvent('contextmenu',
          { clientX: sx, clientY: sy, bubbles: true, cancelable: true }))
        // AND LIFT THE FINGER. A MouseEvent carries no pointerType, so the
        // window's long-press timer does not recognise it as a mouse and
        // starts counting: four hundred and fifty milliseconds later it
        // opened the world menu again, on top of whatever page the driver
        // had just opened, and every --pick picture came back showing the
        // first page. The window is right; the synthetic press was not a
        // press a mouse makes.
        cv.dispatchEvent(new MouseEvent('pointerup',
          { clientX: sx, clientY: sy, bubbles: true }))
        await settle(400)
        // AND WHAT THE CANVAS ITSELF HOLDS, beside what the page screenshot
        // shows. If the two disagree the fault is in the screenshot, not in
        // the window, and there is no way to tell them apart without both.
        {
          const b2 = document.createElement('div')
          b2.id = 'sweepout'; b2.textContent = cv.toDataURL('image/png')
          b2.style.cssText = 'display:none'   // in the DOM for --dump-dom, not on the page
          document.body.appendChild(b2)
        }
        if (PICK !== null && PICK !== undefined) {
          const first = document.getElementById('ctxmenu')
          const rows = first ? [...first.querySelectorAll('button')] : []
          const b = rows[Number(PICK)]
          if (!b) { say('SWEEPFAIL the menu has no option ' + PICK + ' (it has ' + rows.length + ')'); return }
          window.__picked = rows.length + ' options, picked "' + b.textContent + '"'
          try { b.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })) }
          catch (e) { window.__picked += ' THREW ' + e.message }
          await settle(300)
          const after = document.getElementById('ctxmenu')
          if (!after) { say('SWEEPFAIL option ' + PICK + ' opened nothing'); return }
        }
        if (BOOK) {
          const bb = document.getElementById('bookbtn')
          if (bb) { bb.click(); await settle(300) }
        }
        const m = document.getElementById('ctxmenu')
        const bp = document.getElementById('bookpanel')
        say(m ? ('MENUOK ' + (window.__picked ? '[' + window.__picked + '] ' : '')
                + m.textContent.replace(/\\s+/g, ' ').slice(0, 240))
              : (BOOK && bp ? 'MENUOK book ' + bp.textContent.replace(/\\s+/g, ' ').slice(0, 240)
                 : 'SWEEPFAIL no menu opened at ' + mx + ',' + my))
        // AND A GHOST ON THE LEFT, in --book pictures only: a right-aligned
        // copy of each row's cost, painted where the canvas is. The canvas
        // cannot draw those strings -- they exist only in the book's DOM --
        // so it is a stale composited layer that Chrome's page screenshot
        // does not refresh, not anything the window puts there. Ignore it
        // when reading one of these.
        //
        // AND THE WORLD UNDER IT. Chrome's page screenshot does not capture
        // what is in a canvas: the canvas comes back flat green while
        // toDataURL of the same canvas holds the whole town. So the canvas's
        // own picture is laid over the canvas before the shutter. Nothing is
        // drawn a second way; it is the window's own output, put where a
        // screenshot can see it.
        //
        // INSIDE #view, WHICH IS THE CANVAS'S OWN BOX. Three earlier goes put
        // it on the page at the canvas's rect and it lapped the side panel by
        // fifty pixels, because the canvas element is wider than the part of
        // it anybody sees and a fixed element makes its own stacking context.
        // At 100% of #view it is exactly the canvas, clipped exactly as the
        // canvas is clipped.
        {
          const img = document.createElement('img')
          img.src = cv.toDataURL('image/png')
          img.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;'
            + 'image-rendering:auto;pointer-events:none'
          ;(cv.parentNode ?? document.body).appendChild(img)
          await settle(400)
        }
        return
      }
      if (DOING) {
        // somewhere plain and lit, so nothing stands between the eye and the
        // body: the posture is the whole subject of the picture
        const meD = STATE.players[ME]
        STATE.tick = 600
        feedOne({ type: 'state', state: STATE, worldId: 'sweep' })
        await settle(500)
        if (typeof doingSeen !== 'function') { say('SWEEPFAIL no doingSeen'); return }
        // a close-up, cut out of the window's own canvas rather than drawn a
        // second way: what is photographed is exactly what a citizen sees
        const crop = document.createElement('canvas')
        const Z = 3, CW = 180, CH = 180
        crop.width = CW * Z; crop.height = CH * Z
        const cc = crop.getContext('2d')
        cc.imageSmoothingEnabled = false
        // A STATE PER FRAME, because under a virtual clock requestAnimationFrame
        // does not fire: the window draws when a state arrives and at no other
        // time. The first version fed one state and then only filed the deed,
        // so all seven pictures were the same pixels and the posture looked
        // like it was not being drawn when it was never being asked for.
        for (let f = 0; f < 6; f++) {
          doingSeen(DOING)
          STATE.tick = 600 + f
          feedOne({ type: 'state', state: JSON.parse(JSON.stringify(STATE)), worldId: 'sweep' })
          await settle(170)
          // WHERE THE WINDOW PUT THEM, asked of the window. Guessing the
          // middle of the canvas was wrong: the keyhole is fourteen tiles
          // over ten and the camera does not centre the citizen exactly, so
          // the first run photographed a patch of empty road. The camera,
          // the tile size and the zoom are what the drawing itself uses.
          const bx = (meD.x - cam.x) * TILE * ZR
          const by = (meD.y - cam.y) * TILE * ZR
          const sx = Math.max(0, Math.round(bx + TILE * ZR / 2 - (CW / 2)))
          const sy = Math.max(0, Math.round(by + TILE * ZR * 0.9 - (CH / 2)))
          cc.clearRect(0, 0, crop.width, crop.height)
          cc.drawImage(cv, sx, sy, CW, CH, 0, 0, crop.width, crop.height)
          out.push(crop.toDataURL('image/png'))
        }
        // AND ONE WITH NO POSTURE AT ALL, taken in the same run from the same
        // crop, so the pair can be compared. Two separate runs cannot be: the
        // canvas settles to a different size run to run and the crop lands
        // somewhere else, which made the first comparison meaningless.
        await settle(1600)                      // DOING_MS, and the posture lapses
        {
          STATE.tick = 620
          feedOne({ type: 'state', state: JSON.parse(JSON.stringify(STATE)), worldId: 'sweep' })
          await settle(200)
          const bx = (meD.x - cam.x) * TILE * ZR
          const by = (meD.y - cam.y) * TILE * ZR
          const sx = Math.max(0, Math.round(bx + TILE * ZR / 2 - (CW / 2)))
          const sy = Math.max(0, Math.round(by + TILE * ZR * 0.9 - (CH / 2)))
          cc.clearRect(0, 0, crop.width, crop.height)
          cc.drawImage(cv, sx, sy, CW, CH, 0, 0, crop.width, crop.height)
          out.push(crop.toDataURL('image/png'))
        }
        const errD = document.getElementById('frameerr')
        if (errD) { say('SWEEPFAIL ' + errD.textContent.replace(/\\s+/g, ' ').slice(0, 200)); return }
        const boxD = document.createElement('div')
        boxD.id = 'sweepout'; boxD.textContent = out.join('|')
        document.body.appendChild(boxD)
        say('DOINGDONE ' + DOING + ' posture ' + String(doingNow()) + ' frames ' + out.length
          + ' at ' + Math.round((meD.x - cam.x) * TILE * ZR) + ','
          + Math.round((meD.y - cam.y) * TILE * ZR) + ' of ' + cv.width + 'x' + cv.height)
        return
      }
      if (SMOKE) {
        // somewhere with creatures in it: a field of sheep is the cheapest
        // place in the world to put something in front of the drawing code
        const meK = STATE.players[ME]
        const mob = Object.values(STATE.mobs)[0]
        if (mob) { meK.x = mob.x + 2; meK.y = mob.y }
        STATE.tick = 600
        feedOne({ type: 'state', state: STATE, worldId: 'sweep' })
        await settle(500)
        const first = cv.toDataURL('image/png')
        // a tick later, so the world has moved and the window has had a
        // second state to draw from, as it would in play
        STATE.tick = 601
        feedOne({ type: 'state', state: JSON.parse(JSON.stringify(STATE)), worldId: 'sweep' })
        // WAIT FOR A DRAW, DO NOT TIME ONE. A single two and a half second
        // settle made this flaky under load: the smoke runs beside sixty
        // other test files, and a browser under a virtual clock that has not
        // got round to the frame yet is not a window that has stopped. It
        // asks the same question -- has the canvas changed -- and gives the
        // machine room to answer it. A window that has truly stopped still
        // fails, it just takes the whole wait to say so.
        let later = first
        for (let t = 0; t < 14 && later === first; t++) {
          await settle(400)
          later = cv.toDataURL('image/png')
        }
        const err = document.getElementById('frameerr')
        const why = []
        if (err) why.push('the window reported: ' + err.textContent.replace(/\\s+/g, ' ').slice(0, 200))
        if (first.length < 2000) why.push('the canvas drew nothing at all')
        if (first === later) why.push('the canvas is identical after two and a half seconds: '
          + 'the window has stopped drawing')
        say(why.length ? ('SWEEPFAIL ' + why.join(' | ')) : 'SMOKEOK ' + cv.width + 'x' + cv.height)
        return
      }
      // --walk N: a step a tick, the way a citizen actually moves, asking the
      // window after every one whether it could still draw. A sweep teleports
      // and a player walks, and the fault we are chasing only shows after a
      // few steps.
      if (WALKN) {
        const meW = STATE.players[ME]
        const x0 = meW.x, y0 = meW.y
        for (let i = 0; i < WALKN; i++) {
          meW.x = x0 + (i % 9) - 4
          meW.y = y0 + Math.floor(i / 9)
          STATE.tick = 600 + i
          feedOne({ type: 'state', state: JSON.parse(JSON.stringify(STATE)), worldId: 'sweep' })
          await settle(120)
          const eb = document.getElementById('frameerr')
          if (eb) { say('SWEEPFAIL step ' + i + ' at ' + meW.x + ',' + meW.y + ': '
            + eb.textContent.replace(/\\s+/g, ' ').slice(0, 240)); return }
        }
        out.push(cv.toDataURL('image/png'))
      }
      if (!WALKN) for (const sh of SHOTS) {
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
      // §7ej: AND IF THE WINDOW CAUGHT A DRAW ERROR, SAY SO.
      //
      // The window guards each frame: it reports the fault in a bar at the
      // bottom, says the world is fine and the frame was skipped, and carries
      // on. Both halves are true and the second one hides the first. A
      // temporal dead zone in the creature closure threw on every frame for a
      // day -- the door could not be entered, and the sweep went on returning
      // pictures and calling them a success, because the ground still drew.
      //
      // So the sweep reads the window's own report. It is not a new check: it
      // is the window's check, finally listened to.
      //
      // FOUR BACKSLASHES. This page is built as a template literal in
      // sweep.mjs, and a lone backslash-s is not an escape a template
      // recognises, so it arrives as the LETTER s: the first version reported
      // "The world i fine and till ticking" because its own regex had
      // eaten every s in the sentence.
      const errBar = document.getElementById('frameerr')
      if (errBar) { say('SWEEPFAIL the window could not draw: ' + errBar.textContent.replace(/\\s+/g, ' ').slice(0, 220)); return }
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
// §7ef: AND IN FULL HEALTH, FROM THE ENGINE'S OWN ANSWER.
//
// This said `hp: 10, maxHp: 10`, and the window does not take a citizen's
// word for their maximum: `maxHpOf` works it out, and a citizen of this world
// has sixty-four. So every sweep picture ever taken has shown the walker at
// ten of sixty-four with a red sliver over their head, and the window was
// right each time -- the fixture was handing it somebody nearly dead.
//
// It surfaced the day the health bar stopped being drawn unconditionally,
// because a bar that is always there says nothing and a bar that means
// "wounded" is read. `E.maxHealth` is the engine's own function; a number
// written here would drift from it by the end of the month.
const FULL_HP = E.maxHealth({})
world.players[myId] = { x: towns[0].x, y: towns[0].y, hp: FULL_HP, maxHp: FULL_HP, gold: 0,
  inventory: Array(28).fill(null), skills: {},
  equipment: { weapon: null, offhand: null, head: null, body: null, legs: null } }
if (CASTER) {
  const me9 = world.players[myId]
  me9.skills.sorcery = E.XP_TABLE[99]
  for (let i = 0; i < 4; i++) me9.inventory[i] = { item: 'sigil', qty: 1 }
  me9.equipment.weapon = { item: 'bone-staff', qty: 1 }
  me9.book = process.argv.includes('--barrow') ? 'barrow' : 'common'
  if (me9.book === 'common') me9.equipment.weapon = { item: 'wand', qty: 1 }
}

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
    ground: { w: g.worldW, h: g.worldH, rows, dark: WG.darkTilesOf ? WG.darkTilesOf(g) : [],
      // §7ek: and where the water is, run-length encoded by row, because the
      // window is told that too now and a sweep that withholds it photographs
      // a fallback rather than the world
      water: (() => {
        if (typeof WG.isWater !== 'function') return []
        const wr = []
        for (let y = 0; y < g.worldH; y++) {
          const runs = []
          let cur = false, start = 0
          for (let x = 0; x <= g.worldW; x++) {
            const k = x < g.worldW ? !!WG.isWater(g, x, y) : false
            if (k !== cur) { if (cur) runs.push([start, x - start]); cur = k; start = x }
          }
          if (runs.length) wr.push([y, runs])
        }
        return wr
      })() },
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
  '--virtual-time-budget=' + (DOING || MENU ? 40000 : plan.length * 600 + 30000), '--window-size=1200,900',
  ...(MENU ? ['--screenshot=' + OUT + '/menu.png'] : []),
  pathToFileURL(pagePath).href], { encoding: 'utf8', maxBuffer: 1024 * 1024 * 1024 })

// THE TITLE, NOT A STRING IN THE PAGE. A first version looked for its own
// marker anywhere in the dumped document and found it in the source of the
// script that would have written it, so a sweep that did nothing reported
// success.
const title = (/<title>([^<]*)<\/title>/.exec(dom) || [, ''])[1]
console.log('the window says: ' + title)
if (METER) {
  console.log(title.startsWith('METER') ? title : ('METER FAILED: ' + title))
  process.exit(title.startsWith('METER') ? 0 : 1)
}
if (SMOKE) {
  if (title.startsWith('SMOKEOK')) { console.log('the window drew, and kept drawing: ' + title); process.exit(0) }
  console.log('SMOKE FAILED: ' + title)
  process.exit(1)
}
if (MENU) {
  const u2 = (dom.match(/data:image\/png;base64,[A-Za-z0-9+/=]+/g) || [])
  if (u2.length) {
    writeFileSync(OUT + '/menu-canvas.png', Buffer.from(u2[u2.length - 1].split(',')[1], 'base64'))
    console.log('wrote ' + OUT + '/menu-canvas.png (the canvas as the window drew it)')
  }
  console.log(title.startsWith('MENUOK') ? title : ('MENU FAILED: ' + title))
  process.exit(title.startsWith('MENUOK') ? 0 : 1)
}
if (DOING) {
  if (!title.startsWith('DOINGDONE')) { console.log('DOING FAILED: ' + title); process.exit(1) }
  const us = (dom.match(/data:image\/png;base64,[A-Za-z0-9+/=]+/g) || [])
  const dir = OUT + '/doing'
  mkdirSync(dir, { recursive: true })
  us.forEach((u, i) => writeFileSync(dir + '/' + DOING
    + (i === us.length - 1 ? '-still' : '-' + i) + '.png',
    Buffer.from(u.split(',')[1], 'base64')))
  console.log(title)
  console.log('wrote ' + us.length + ' frames to ' + dir)
  process.exit(us.length ? 0 : 1)
}
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
