// §7f-ix: THE PHOTO WINDOW, PHOTOGRAPHED, WHERE THE NEW ART STANDS.
//
// sweep.mjs does this for the flat window and could not do it for this one:
// window-photo is an ES module and imports ./terrain-mirror.mjs, and Chrome
// refuses module scripts over file://. So this serves the directory and points
// a real browser at it.
//
// It exists because fifty-five landmark kinds were just given art and the
// standing rule here is to test through the window's own interface. The build
// check proves the meshes are real; only a picture says whether a pine looks
// like a pine. It uses the window's OWN shutter path -- render the composer,
// then read the canvas in the same task -- because a WebGL drawing buffer is
// empty by the next one.
//
//   node sweep-photo.mjs                 a place for each family of new art
//   node sweep-photo.mjs --at 300,200    one place
//   node sweep-photo.mjs --kind pine     wherever the island grows one
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { spawn } from 'child_process'
import { createServer } from 'http'
import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'
const require = createRequire(import.meta.url)
// fileURLToPath, not .pathname: this project lives under "Unreal Projects"
// and a raw pathname keeps the %20
const HERE = path.dirname(fileURLToPath(import.meta.url)) + '/'
const WG = await import('./worldgen-expanse7.mjs')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT = HERE + 'sweep-photo-out'
const PROFILE = (process.env.TMPDIR ?? '/tmp') + 'interval-sweep-photo-profile'
const arg = (f) => { const i = process.argv.indexOf(f); return i > 0 ? process.argv[i + 1] : null }

// ---- the real island ----
const quiet = console.log
console.log = () => {}
const gen = WG.makeExpanse7Genesis('sweep', 'a'.repeat(64), 0, 896, 512)
const world = WG.buildWorld(gen)
console.log = quiet
delete world._composition

// ---- where to stand ----
//
// One place per family of the new art, found by asking the world where it put
// the thing rather than by remembering a coordinate. A coordinate goes stale
// the next time the generator moves; a search does not.
const shots = []
const whereIs = (kind, n = 1) => {
  const found = []
  for (const id in world.nodes) {
    const nd = world.nodes[id]
    if (nd.type === 'landmark' && nd.kind === kind) found.push(nd)
    if (found.length >= n * 7) break
  }
  return found.filter((_, i) => i % 7 === 0).slice(0, n)
}
const atArg = arg('--at')
const kindArg = arg('--kind')
if (atArg) {
  const [x, y] = atArg.split(',').map(Number)
  shots.push({ name: 'at-' + x + '-' + y, x, y })
} else if (kindArg) {
  for (const k of kindArg.split(',')) {
    for (const nd of whereIs(k, 2)) shots.push({ name: k + '-' + nd.x + '-' + nd.y, x: nd.x, y: nd.y })
  }
} else {
  // the families, in the order they matter: the vegetation is 1,455 of the
  // 1,821 props that were boats
  for (const k of ['pine', 'old-oak-lm', 'willow', 'dead-tree', 'wind-thorn',
                   'apple-tree', 'reeds', 'stone-heap', 'way-post', 'hay-wain',
                   'upturned-boat', 'sheep-hurdle', 'bridge-stone', 'rag-tree',
                   'turf-stack', 'wheel-rut', 'sheep-skull', 'half-wall']) {
    for (const nd of whereIs(k, 1)) shots.push({ name: k, x: nd.x, y: nd.y })
  }
}
if (!shots.length) { console.log('nothing to photograph'); process.exit(1) }
if (process.argv.includes('--list')) {
  for (const s of shots) console.log(s.name.padEnd(18) + s.x + ',' + s.y)
  process.exit(0)
}

// ---- the page: the window, unaltered, with a socket and a driver ----
const WIN = readFileSync(HERE + 'window-photo.html', 'utf8')
const ME = 'f'.repeat(64)
world.players[ME] = { x: shots[0].x, y: shots[0].y, hp: 64, gold: 0, name: 'sweep',
  inventory: Array(28).fill(null), skills: {}, equipment: {}, look: 7 }

const BEFORE = `<script>
  // THE SOCKET THE WINDOW EXPECTS, and nothing else faked. A sweep has no
  // pillar and wants none: the point is to photograph the world the generator
  // builds, with nothing in between.
  window.__socks = []
  window.WebSocket = class { constructor () { this.readyState = 1
    window.__socks.push(this); setTimeout(() => this.onopen && this.onopen(), 0) }
    send () {} close () {} addEventListener () {} }
  window.AudioContext = undefined; window.webkitAudioContext = undefined
  // the audio list and the peer list are somebody else's machine
  const _f = window.fetch
  window.fetch = (u, o) => (String(u).startsWith('http') || String(u).startsWith('/api')
    ? Promise.resolve({ ok: false, json: async () => null }) : _f(u, o))
</script>`

const AFTER = `<script type="module">
  const SHOTS = ${JSON.stringify(shots)}
  const STATE = ${JSON.stringify(world)}
  const ME = ${JSON.stringify(ME)}
  const say = (t) => { document.title = t }
  const settle = (ms) => new Promise((r) => setTimeout(r, ms))
  // the first thing it says, so a sweep that never ran is told apart from one
  // that ran and found nothing
  say('SWEEPSTART')
  try {
    // the window hangs its own handles on the global for exactly this reason
    const W = window
    const sock = () => W.__socks[0]
    for (let i = 0; i < 200 && !sock()?.onmessage; i++) await settle(50)
    if (!sock()?.onmessage) { say('SWEEPFAIL the window never opened a socket'); throw 0 }
    // through the door: there is nobody here to press the button
    W.__sweepEnter && W.__sweepEnter(ME)
    const feedOne = (m) => sock().onmessage({ data: JSON.stringify(m) })
    feedOne({ type: 'hello', playerId: ME })
    const out = [], where = []
    for (const sh of SHOTS) {
      // STAND BESIDE IT, NOT ON IT. The citizen standing on the tile hides
      // the very thing the picture is of: the first boat was underfoot and
      // what the picture showed was the landing stage next door.
      STATE.players[ME].x = sh.x
      STATE.players[ME].y = sh.y + 2
      // NOON ON A CLEAR DAY. Two things the first sweep got wrong at once: a
      // world starts at tick 1, which the window correctly draws as before
      // dawn, and the weather is hashed off the day, so tick 600 fell on a
      // wet one and eighteen pictures came back in the rain. Day six is clear
      // and so is the day after it, so the dusk blend does not drag a storm in.
      STATE.tick = 15000 + out.length
      W.__sweepBe && W.__sweepBe(ME)
      feedOne({ type: 'state', state: STATE, worldId: 'sweep' })
      // WAIT ON THE WORLD, ON TIMERS, NOT ON FRAMES.
      //
      // requestAnimationFrame NEVER FIRES under --dump-dom: there is no
      // compositor driving frames, so a sweep that waited on rAF waited for
      // ever. setTimeout does advance, because that is what the virtual clock
      // is for. It also means the window's own frame loop is not running, so
      // nothing animates and nothing draws until the shutter asks it to --
      // which is exactly what __sweepShot does, and why it works.
      // DRIVE IT WITH PACKETS, not with patience.
      //
      // The window builds node bodies on a BUDGET PER PACKET and drains the
      // rest in its frame loop, and the frame loop does not run here. So a
      // sweep that waited photographed bare ground: 413 nodes in the state and
      // a dozen of them standing. Feeding the same world again, tick after
      // tick, is what a pillar does anyway, and it is the only thing that
      // moves the queue.
      let ready = false
      for (let i = 0; i < 300 && !ready; i++) {
        // the clock stays near noon: three hundred packets at one tick each
        // walked the day round to dusk, and the stand of pines that proved
        // the whole exercise came back in the dark
        STATE.tick = 15000 + (i % 40)
        W.__sweepBe && W.__sweepBe(ME)
        feedOne({ type: 'state', state: STATE, worldId: 'sweep' })
        await settle(40)
        // the first place pays for the whole near world; the rest only have
        // to catch up, so they settle in a few dozen packets
        ready = i > (out.length ? 12 : 30) && !!(W.__sweepReady && W.__sweepReady())
      }
      await settle(200)
      const seen = W.__sweepWhere && W.__sweepWhere()
      where.push(sh.name + ' asked ' + sh.x + ',' + sh.y + ' got ' + seen
        + ' ground ' + (W.__sweepGround ? W.__sweepGround() : '?') + (ready ? '' : ' NOT READY'))
      const png = W.__sweepShot && W.__sweepShot()
      if (!png) { say('SWEEPFAIL the window would not photograph itself'); throw 0 }
      out.push(png)
      say('SWEEPAT ' + out.length + '/' + SHOTS.length + ' asked ' + sh.x + ',' + sh.y + ' got ' + seen)
    }
    const box = document.createElement('div')
    box.id = 'sweepout'; box.textContent = out.join('|')
    document.body.appendChild(box)
    const wb = document.createElement('div')
    wb.id = 'sweepwhere'; wb.textContent = where.join('|')
    document.body.appendChild(wb)
    say('SWEEPDONE ' + out.length)
  } catch (e) {
    if (e) say('SWEEPFAIL ' + (e && e.message ? e.message : String(e)))
  }
</script>`

// THE TWO HANDLES. The window is not written to be driven, so rather than
// reaching into its scope (which a module does not have) it is given two
// named exits: one that opens the door and one that takes the picture the way
// the shutter button does. Both are three lines and both are inside the
// window's own module, so they use the window's own renderer and composer.
const HANDLES = `
// §7f-ix: two handles for sweep-photo.mjs, which photographs this window to
// check its art. They are the window's own door and the window's own shutter,
// named so a driver can reach them: a module has no scope anybody outside can
// see, and reaching for the internals from a script tag is how a sweep comes
// to be testing something other than the window.
window.__sweepEnter = (pub) => {
  // THE CAMERA HANGS FROM ITS CITIZEN, and the citizen is ownKey.pub, not
  // the id in the hello. Without this the camera focused on a body that did
  // not exist, sat at the world origin, and every picture of the sweep was
  // the same corner of the same town however far the citizen was moved.
  //
  // And it is re-asserted before every shot, because the window's own
  // ws.onopen does ownKey = await ownIdentity() and that resolves AFTER this
  // runs: set once, it was quietly replaced by a key this world has no body
  // for, and the sweep went back to photographing the origin.
  entered = true
  const sp = document.getElementById('splash'); if (sp) sp.remove()
  // STAND WHERE A CITIZEN STANDS. The default camera is an overhead orbit,
  // which is the right thing to play in and the wrong thing to judge a bush
  // from: the first sweep came back eighteen pictures of roofs. Close in,
  // nearly level, over the shoulder.
  povMode = false
  camDist = 5.5
  camPitch = 0.42
  camYaw = -0.9
}
// where the window thinks the citizen is, so a sweep that photographs the
// same place eighteen times says so rather than looking like bad art
window.__sweepWhere = () => {
  const me = world?.players?.[ownKey?.pub]
  const vm = me && vis.player.get(ownKey.pub)
  return me ? (me.x + ',' + me.y + (vm ? ' mesh ' + vm.position.x.toFixed(0) + ',' + vm.position.z.toFixed(0) : ' NO MESH')) : 'NO CITIZEN'
}
// IS THERE A WORLD TO PHOTOGRAPH YET. The window raises the ground in slices
// and builds the nodes around the citizen as it goes, so a sweep that waits on
// a TIMER photographs whatever had been built when the timer fired. Under
// Chrome's virtual time a timer fires at once, which is how the first run came
// back a page of blank grey. Waiting on the world itself is the only honest
// wait: the height field must exist, and there must be something standing in
// the three tiles around the citizen.
window.__sweepBe = (pub) => {
  ownKey = { pub: pub, priv: null }
  // the camera, re-set every shot for the same reason the key is: the window
  // owns these and will move them
  povMode = false
  // CLOSE AND LOW. Seven units back and half a radian up is a map of the
  // field; the thing being judged is two metres across. A citizen's own view
  // is the one that matters and this is as near to it as a third-person
  // camera gets.
  camDist = 4.2
  camPitch = 0.34
  camYaw = 0.1
}
window.__sweepReady = () => {
  if (!groundBuilt || !groundHGrid) return false
  const me = world?.players?.[ownKey?.pub]
  if (!me || !vis.player.get(ownKey.pub)) return false
  // THE GROUND UNDER THE CITIZEN, not merely 'some ground exists'. The height
  // field is raised in slices and groundBuilt goes true on the first of
  // them, so a sweep that trusted it photographed a citizen standing in the
  // sea on a tile the generator had put trees on: the chunk they were on had
  // not been raised yet, and unraised ground reads as water.
  const yh = groundYAt(me.x, me.y)
  if (!isFinite(yh) || yh <= 0.02) return false
  let near = 0
  for (const [, gr] of vis.node) if (gr.visible && ++near > 6) break
  return near > 6
}
window.__sweepGround = () => {
  const me = world?.players?.[ownKey?.pub]
  return me ? groundYAt(me.x, me.y).toFixed(2) + ' nodes ' + vis.node.size : '?'
}
window.__sweepShot = () => {
  // the shutter's own path: render, then read in the SAME task, because a
  // WebGL drawing buffer is empty by the next one
  composer.render()
  return renderer.domElement.toDataURL('image/png')
}
`
let page = WIN.replace('<head>', '<head>' + BEFORE)
// THE HANDLES GO AT THE END OF THE WINDOW'S OWN MODULE, where its scope is.
// The last </script> in the file is not it: there is a classic script after
// the module, and handles put there cannot see composer or renderer --
// which is exactly what the first run said, and it said it correctly.
const modAt = page.indexOf('<script type="module">')
if (modAt < 0) { console.log('window-photo has no module block'); process.exit(1) }
const modEnd = page.indexOf('</script>', modAt)
page = page.slice(0, modEnd) + HANDLES + page.slice(modEnd)
page = page.replace('</body>', AFTER + '</body>')
if (!page.includes('__sweepShot')) { console.log('could not inject the handles'); process.exit(1) }

mkdirSync(OUT, { recursive: true })
writeFileSync(HERE + 'sweep-photo-page.html', page)

// ---- a server, because Chrome will not import a module over file:// ----
const TYPES = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' }
const srv = createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0])
  const file = p === '/' ? 'sweep-photo-page.html' : p.replace(/^\/+/, '')
  try {
    const body = readFileSync(HERE + file)
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' })
    res.end(body)
  } catch { res.writeHead(404); res.end('no') }
})
await new Promise((r) => srv.listen(0, '127.0.0.1', r))
const port = srv.address().port
console.log(`${shots.length} pictures to take, serving on ${port}`)
// the server answers before Chrome is asked to trust it: a sweep that hangs
// because one module 404s looks exactly like a window that will not draw
for (const probe of ['/', '/terrain-mirror.mjs', '/worldgen-expanse7.mjs']) {
  const r = await fetch('http://127.0.0.1:' + port + probe)
  if (!r.ok) { console.log('the server will not serve ' + probe); process.exit(1) }
  const n = (await r.arrayBuffer()).byteLength
  if (process.argv.includes('--show-cmd')) console.log('  ' + probe + ' ' + n + ' bytes')
}

// each shot is up to three hundred packets at forty milliseconds of virtual
// time, and the first one builds the whole near world, so the budget is per
// SHOT rather than a flat number: eighteen places overran a 114-second budget
// and the sweep came back empty with nothing said.
const budget = shots.length * 16000 + 60000
let dom = ''
// THROUGH A SHELL, WITH A REDIRECT, rather than reading Chrome's stdout.
// Reading the pipe directly came back EMPTY every time while the identical
// command run by hand came back with the whole document: Chrome on this
// platform spawns helpers that touch stdout, and what reached the parent was
// nothing at all. A sweep that photographs eighteen places and reports no
// pictures, with no error, is worse than one that fails.
const domFile = OUT + '/dom.html'
const cmd = [JSON.stringify(CHROME), '--headless=new', '--dump-dom', '--no-sandbox',
  // NO --window-size. With --headless=new on this Chrome it silences
  // --dump-dom outright: the browser runs, the page finishes, and nothing
  // comes back. Found by bisecting the flags one at a time, which is the only
  // way to find a flag that fails by being quiet.
  '--hide-scrollbars',
  '--user-data-dir=' + JSON.stringify(PROFILE),
  '--virtual-time-budget=' + budget,
  JSON.stringify('http://127.0.0.1:' + port + '/'),
  '2>/dev/null', '>', JSON.stringify(domFile)].join(' ')
if (process.argv.includes('--show-cmd')) console.log(cmd)
// SPAWN, NOT execFileSync. The synchronous call blocks node's event loop, and
// the server that Chrome is fetching the page FROM is in this process: so
// Chrome asked, nothing answered, and it waited until the timeout killed it.
// A sweep that hangs looks exactly like a window that will not draw, and it
// cost a long hunt through Chrome's flags before the fault turned out to be
// on this side of the socket.
await new Promise((done) => {
  const ch = spawn('/bin/sh', ['-c', cmd], { stdio: 'ignore' })
  const bell = setTimeout(() => ch.kill('SIGKILL'), budget + 120000)
  ch.on('exit', () => { clearTimeout(bell); done() })
  ch.on('error', (e) => { clearTimeout(bell); console.log('chrome: ' + e.message); done() })
})
try { dom = readFileSync(domFile, 'utf8') } catch {}
srv.close()

const title = (/<title>([^<]*)<\/title>/.exec(dom) || [, ''])[1]
console.log('the window says: ' + title)
if (!title.startsWith('SWEEPDONE')) {
  console.log('no pictures. The window did not get there.')
  process.exit(1)
}
const whereSaid = (/<div id="sweepwhere">([^<]*)<\/div>/.exec(dom) || [, ''])[1]
for (const w of whereSaid.split('|').filter(Boolean)) console.log('  ' + w)
const body = (/<div id="sweepout">([^<]*)<\/div>/.exec(dom) || [, ''])[1]
const urls = body.split('|').filter(Boolean)
let n = 0
for (const u of urls) {
  const sh = shots[n]
  const b64 = u.slice(u.indexOf(',') + 1)
  writeFileSync(OUT + '/' + String(n).padStart(2, '0') + '-' + sh.name + '.png', Buffer.from(b64, 'base64'))
  n++
}
console.log('wrote ' + n + ' pictures to ' + OUT)
