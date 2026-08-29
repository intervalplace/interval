// §6dj, for the mist window: IS IT ACTUALLY WIRED TO THE WORLD.
//
// Every other check for this window feeds it a state I made up. This one boots
// the real pillar on the real generator, asks for the routes the window asks
// for, opens a real socket, and drives the real window code against whatever
// expanse-v7 actually is today. It cannot prove the window LOOKS right — only a
// browser can do that — but it proves the wiring: the route is served, the
// founding is served, the socket says hello, the state arrives, and the scene
// gets built out of it.
//
//   node check-window-live.mjs            (boots its own pillar, kills it after)
//   node check-window-live.mjs 8787       (uses a pillar you already have up)
//
// Needs three.js and the node's own dependencies:  npm i three@0.128.0 ws

import { readFileSync } from 'fs'
import { spawn } from 'child_process'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let THREE, WS
try { THREE = require('three'); WS = require('ws') } catch {
  console.log('  skip  needs three.js and ws (npm i three@0.128.0 ws)'); process.exit(0)
}

const PORT = Number(process.argv[2]) || 8787
const OWN = !process.argv[2]
let bad = 0
const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL') + '  ' + m); if (!c) bad++ }
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const base = 'http://127.0.0.1:' + PORT

let child = null
if (OWN) {
  console.log('  ..    founding a world (expanse-v7 takes a few minutes cold)')
  child = spawn(process.execPath, ['serve.mjs'],
    { env: { ...process.env, INTERVAL_HTTP_PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe'] })
  child.stdout.on('data', (b) => { const s = String(b)
    if (/live:|practice island ready|FOUNDING with/.test(s)) process.stdout.write('  ..    ' + s.trim().split('\n').pop() + '\n') })
}
const die = () => { if (child) try { child.kill('SIGKILL') } catch {} }
process.on('exit', die)

// ---------- wait for the door to open ----------
let up = false
for (let i = 0; i < 400 && !up; i++) {
  await sleep(1500)
  try { const r = await fetch(base + '/play/mist', { method: 'HEAD' }); up = r.ok || r.status === 200 } catch {}
}
ok(up, 'the pillar answers on ' + PORT)
if (!up) { die(); process.exit(1) }

// ---------- the routes this window cannot live without ----------
const routes = ['/play/mist', '/mist', '/engine.js', '/engine-browser.mjs',
                '/nought/world.json', '/nought/terrain.json', '/nought/terrain.bin']
const got = {}
for (const u of routes) {
  try {
    const r = await fetch(base + u)
    const body = await r.arrayBuffer()
    got[u] = { status: r.status, n: body.byteLength, buf: body }
    ok(r.ok && body.byteLength > 0, u.padEnd(24) + r.status + '  ' + body.byteLength + ' bytes')
  } catch (e) { ok(false, u + ' — ' + e.message) }
}
ok(/window-mist|THE MIST WINDOW/.test(Buffer.from(got['/play/mist'].buf).toString('utf8', 0, 4000)),
   '/play/mist really is the mist window')

// ---------- §0: does the founding it serves check out ----------
{
  const mod = await import('./engine-browser.mjs')
  const E2 = await mod.loadEngine(base + '/engine.js')
  mod.registerTerrainTable(E2, mod.parseTerrainTable(
    got['/nought/terrain.bin'].buf, JSON.parse(Buffer.from(got['/nought/terrain.json'].buf).toString())))
  const st = JSON.parse(Buffer.from(got['/nought/world.json'].buf).toString())
  ok(E2.isNought(st), 'the practice island is a practice, not the world itself')
  E2.markNoughtWorld(st)
  const key = E2.generateIdentity()
  const sp = E2.spawnOf(st.genesis)
  E2.addPlayer(st, key.playerId, sp.x, sp.y)
  E2.nameNoughtBody(st, key.playerId)
  ok(!!st.players[key.playerId], 'a body stands on it at ' + sp.x + ',' + sp.y)
  // walk one step, locally, on the browser engine — the thing Nought does
  let s2 = st
  const wid = E2.worldId(st.genesis)
  const inp = E2.signInput({ worldId: wid, playerId: key.playerId, tick: s2.tick, type: 'move', dx: 1, dy: 0 },
                           key.privateKey)
  for (let i = 0; i < 3; i++) { delete s2._grid; delete s2._waterTiles; delete s2._nodeTiles
    s2 = E2.nextState(s2, i === 0 ? [inp] : []) }
  const moved = s2.players[key.playerId]
  ok(moved && (moved.x !== sp.x || moved.y !== sp.y), 'and it can take a step there (now ' + moved.x + ',' + moved.y + ')')
  ok(Object.keys(st.nodes || {}).length > 0, 'the island has ' + Object.keys(st.nodes || {}).length + ' things standing on it')
}

// ---------- now drive the actual window against the actual socket ----------
const noop = () => {}
const ctx2d = () => new Proxy({ measureText: () => ({ width: 10 }) },
  { get: (t, k) => (k in t ? t[k] : noop), set: (t, k, v) => (t[k] = v, true) })
const canvas = () => { const c = { width: 320, height: 240, style: {}, _h: {},
  getContext: (k) => (k === '2d' ? ctx2d() : null), addEventListener: (t, f) => { (c._h[t] ||= []).push(f) },
  requestPointerLock: noop, toDataURL: () => 'data:' }; return c }
const els = {}, raf = [], win = {}
let CLOCK = 1000
global.window = global
global.document = { createElement: canvas, getElementById: (id) => (els[id] ||= canvas()),
                    addEventListener: noop, exitPointerLock: noop, pointerLockElement: null }
global.location = { protocol: 'http:', host: '127.0.0.1:' + PORT }
global.localStorage = { getItem: () => null, setItem: noop }
global.innerWidth = 960; global.innerHeight = 720
global.addEventListener = (t, f) => { (win[t] ||= []).push(f) }
global.prompt = () => ''
global.AudioContext = undefined
const def = (k, v) => Object.defineProperty(global, k, { value: v, configurable: true })
def('navigator', { getGamepads: () => [] })
def('performance', { now: () => CLOCK })
global.requestAnimationFrame = (fn) => raf.push(fn)
// the window's WebSocket is the real one, pointed at the real pillar
global.WebSocket = class extends WS {
  constructor () { super('ws://127.0.0.1:' + PORT) }
}
const seen = { frames: 0, scene: null, cam: null }
THREE.WebGLRenderer = class {
  constructor () { this.domElement = canvas(); this.autoClear = true }
  setPixelRatio () {} setSize () {} setClearColor () {} clear () {} clearDepth () {} setRenderTarget () {}
  render (sc, cam) { seen.frames++; if (sc.children.length > 3) { seen.scene = sc; seen.cam = cam } }
}
global.THREE = THREE

// the window reads its own state through the same closure we cannot reach, so
// listen on the wire beside it and compare notes
let live = null, hello = null
const spy = new WS('ws://127.0.0.1:' + PORT)
await new Promise(r => spy.on('open', r))
spy.send(JSON.stringify({ type: 'auth', uid: 'live-check-spy' }))
spy.on('message', (d) => { const m = JSON.parse(d)
  if (m.type === 'hello') hello = m
  if (m.type === 'state') live = m })

for (const b of [...readFileSync('window-mist.html', 'utf8')
  .matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])) (0, eval)(b)

const frames = (n) => { for (let i = 0; i < n; i++) { CLOCK += 40
  for (const fn of raf.splice(0, raf.length)) fn(CLOCK) } }
for (let i = 0; i < 60 && !live; i++) { frames(2); await sleep(400) }
ok(!!hello, 'the pillar issued a key over the socket')
ok(!!live, 'a real state arrived' + (live ? ' (tick ' + live.state.tick + ')' : ''))
if (!live) { die(); process.exit(1) }

const s = live.state
const g = s.genesis || {}
console.log('\n  the world it is showing:')
console.log('    world       ' + String(live.worldId).slice(0, 16) + '\u2026')
console.log('    generator   ' + (g.worldGenerator || '?'))
console.log('    size        ' + g.worldW + ' \u00d7 ' + g.worldH + ' tiles')
console.log('    tick        ' + s.tick)
console.log('    citizens    ' + Object.keys(s.players || {}).length)
console.log('    beasts      ' + Object.keys(s.mobs || {}).length)
console.log('    things      ' + Object.keys(s.nodes || {}).length)
const kinds = {}
for (const n of Object.values(s.nodes || {})) kinds[n.type] = (kinds[n.type] || 0) + 1
const top = Object.entries(kinds).sort((a, b) => b[1] - a[1]).slice(0, 8)
console.log('    mostly      ' + top.map(([k, v]) => k + ' \u00d7' + v).join(', '))
const mobKinds = new Set(Object.values(s.mobs || {}).map(m => m.type))
console.log('    living      ' + [...mobKinds].slice(0, 12).join(', '))

// keep a slice of the real world so a picture can be made of it offline
{
  const near = (e, cx, cy, r) => Math.abs(e.x - cx) <= r && Math.abs(e.y - cy) <= r
  // stand where the country is busiest: the tile with the most things around it
  let best = null
  const bins = new Map()
  for (const n of Object.values(s.nodes || {})) {
    const k = ((n.x / 12) | 0) + ',' + ((n.y / 12) | 0)
    bins.set(k, (bins.get(k) || 0) + 1)
  }
  for (const [k, v] of bins) if (!best || v > best.v) best = { k, v }
  const [bx, by] = best.k.split(',').map(Number)
  const cx = bx * 12 + 6, cy = by * 12 + 6
  const cut = { tick: s.tick, genesis: g, players: {}, mobs: {}, nodes: {}, ground: {} }
  for (const [id, n] of Object.entries(s.nodes || {})) if (near(n, cx, cy, 18)) cut.nodes[id] = n
  for (const [id, m] of Object.entries(s.mobs || {})) if (near(m, cx, cy, 18)) cut.mobs[id] = m
  for (const [id, o] of Object.entries(s.ground || {})) if (near(o, cx, cy, 18)) cut.ground[id] = o
  cut.at = { x: cx, y: cy }
  const fs2 = await import('fs')
  fs2.writeFileSync('/tmp/live-slice.json', JSON.stringify(cut))
  // and the WHOLE country, for anyone who wants to photograph it
  fs2.writeFileSync('/tmp/live-world.json', JSON.stringify(
    { tick: s.tick, genesis: g, players: {}, mobs: s.mobs, nodes: s.nodes, ground: s.ground }))
  console.log('  the whole country saved too: ' + Object.keys(s.nodes).length + ' things')
  // and the ground itself, so the chart-table can be photographed offline
  fs2.writeFileSync('/tmp/live-ground.json', JSON.stringify({
    w: got['/nought/terrain.json'] ? JSON.parse(Buffer.from(got['/nought/terrain.json'].buf).toString()).w : 0,
    h: JSON.parse(Buffer.from(got['/nought/terrain.json'].buf).toString()).h,
    meta: JSON.parse(Buffer.from(got['/nought/terrain.json'].buf).toString()),
    bin: Buffer.from(got['/nought/terrain.bin'].buf).toString('base64') }))
  console.log('  and the ground, for the chart-table')
  console.log('\n  a slice of the busiest country, saved: ' + cx + ',' + cy + '  ' +
              Object.keys(cut.nodes).length + ' things, ' + Object.keys(cut.mobs).length + ' beasts')
  const shapes = {}
  for (const n of Object.values(cut.nodes)) if (!shapes[n.type]) shapes[n.type] = JSON.stringify(n)
  console.log('  what the common things actually look like on the wire:')
  for (const t of Object.keys(shapes).slice(0, 14)) console.log('    ' + shapes[t])
}

// let the window chew on it
for (let i = 0; i < 12; i++) { frames(6); await sleep(120) }
ok(seen.frames > 0, 'the window drew ' + seen.frames + ' passes off the live state')
ok(!!seen.scene, 'it built a scene')
if (seen.scene) {
  let meshes = 0, nan = 0
  seen.scene.traverse((o) => { if (o.isMesh) meshes++
    if (!Number.isFinite(o.position.x + o.position.y + o.position.z)) nan++ })
  ok(meshes > 40, 'out of the real world it built ' + meshes + ' meshes')
  ok(nan === 0, 'none of them are at NaN')
  const c = seen.cam
  ok(c && Number.isFinite(c.position.x + c.position.y + c.position.z),
     'the eye is somewhere real (' + c.position.x.toFixed(1) + ', ' + c.position.z.toFixed(1) + ')')
}
// the window should be knocking, since this soul has never been here
await sleep(1200); frames(4)
console.log('\n  ' + (bad ? bad + ' failed' : 'ok    the mist window is wired to the live world'))
spy.close(); die()
process.exit(bad ? 1 : 0)
