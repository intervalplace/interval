// §6dj, for the mist window: WHAT DOES A REAL WORLD COST IT.
//
// The other checks ask whether the window is truthful. This one asks whether it
// is playable, which is a different question and one that only a REAL world can
// answer: an invented state with four nodes in it will never find the fault
// this check exists for.
//
// It found one. `nodesNear` walked all ten thousand nodes, `options` called it a
// dozen times, and the HUD called `options` every frame — a hundred and forty
// thousand iterations and thirteen ten-thousand-entry arrays allocated sixty
// times a second, to answer a question that changes only when the citizen moves.
// The window cost 59ms a frame against a 33ms budget: seventeen frames a second,
// in a window whose whole argument is that it runs at thirty.
//
//   node check-window-cost.mjs [/tmp/live-world.json]
//
// Needs three.js, and a world dump from check-window-live.mjs.

import { readFileSync, existsSync } from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let THREE; try { THREE = require('three') } catch { console.log('  skip  no three.js'); process.exit(0) }
const DUMP = process.argv[2] || '/tmp/live-world.json'
const GROUND = '/tmp/live-ground.json'
if (!existsSync(DUMP)) { console.log('  skip  no world dump (run check-window-live.mjs first)'); process.exit(0) }

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
global.location = { protocol: 'http:', host: 'x', search: '' }
global.localStorage = { getItem: () => null, setItem: noop }
global.innerWidth = 960; global.innerHeight = 720
global.addEventListener = (t, f) => { (win[t] ||= []).push(f) }
global.prompt = () => ''; global.AudioContext = undefined
if (existsSync(GROUND)) {
  const gd = JSON.parse(readFileSync(GROUND, 'utf8')), gb = Buffer.from(gd.bin, 'base64')
  global.fetch = async (u) => String(u).endsWith('.bin')
    ? { ok: true, arrayBuffer: async () => gb.buffer.slice(gb.byteOffset, gb.byteOffset + gb.length) }
    : { ok: true, json: async () => gd.meta }
} else global.fetch = async () => ({ ok: false })
const def = (k, v) => Object.defineProperty(global, k, { value: v, configurable: true })
def('navigator', { getGamepads: () => [] }); def('crypto', { randomUUID: () => 'pf' })
def('performance', { now: () => CLOCK })
global.requestAnimationFrame = (fn) => raf.push(fn)
const socks = []
global.WebSocket = class { constructor () { this.readyState = 1; socks.push(this) } send () {} close () {} }
let meshes = 0
THREE.WebGLRenderer = class { constructor () { this.domElement = canvas() }
  setPixelRatio () {} setSize () {} setClearColor () {} clear () {} clearDepth () {} setRenderTarget () {}
  render (sc) { if (sc.children.length > 3) { meshes = 0; sc.traverse(o => { if (o.isMesh) meshes++ }) } } }
global.THREE = THREE
for (const b of [...readFileSync('window-mist.html', 'utf8')
  .matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])) (0, eval)(b)

const world = JSON.parse(readFileSync(DUMP, 'utf8'))
const nNodes = Object.keys(world.nodes).length, nMobs = Object.keys(world.mobs || {}).length
const send = (m) => { for (const s of socks) s.onmessage({ data: JSON.stringify(m) }) }
for (const s of socks) s.onopen && s.onopen()
send({ type: 'hello', playerId: 'me' })
world.players = { me: { x: 336, y: 208, hp: 10, maxHp: 10, gold: 0, inventory: [], skills: {} } }
await new Promise(r => setTimeout(r, 90))

let bad = 0
const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL') + '  ' + m); if (!c) bad++ }
const ms = (fn) => { const a = process.hrtime.bigint(); fn(); return Number(process.hrtime.bigint() - a) / 1e6 }

const boot = ms(() => { send({ type: 'state', state: world, worldId: 'w' })
  CLOCK += 40; for (const fn of raf.splice(0, raf.length)) fn(CLOCK) })
console.log('  a world of ' + nNodes + ' things and ' + nMobs + ' beasts\n')
ok(boot < 800, 'the first state lands in ' + boot.toFixed(0) + 'ms (a one-off; budget 800)')

let stateMs = 0, frameMs = 0
for (let k = 0; k < 8; k++) {
  world.tick += 1
  stateMs += ms(() => send({ type: 'state', state: world, worldId: 'w' }))
  for (let i = 0; i < 30; i++) { CLOCK += 34
    frameMs += ms(() => { for (const fn of raf.splice(0, raf.length)) fn(CLOCK) }) }
}
const perState = stateMs / 8, perFrame = frameMs / 240
ok(perState < 200, 'a state costs ' + perState.toFixed(1) + 'ms of the 1000ms interval')
ok(perFrame < 11, 'a frame costs ' + perFrame.toFixed(2) + 'ms of the 33ms budget')

let walkMs = 0
for (let k = 0; k < 10; k++) {
  world.players.me.x += 1; world.tick += 1
  send({ type: 'state', state: world, worldId: 'w' })
  walkMs += ms(() => { CLOCK += 34; for (const fn of raf.splice(0, raf.length)) fn(CLOCK) })
}
ok(walkMs / 10 < 33, 'a step across a tile rebuilds the ground in ' + (walkMs / 10).toFixed(1) + 'ms')
console.log('  \u00b7     ' + meshes + ' meshes in the scene at eleven tiles')

// ---- AND WHAT AN HOUR COSTS. Taking a thing out of the scene is not the same
// as letting it go: `remove` unhooks it from the graph and leaves the geometry
// alive on the GPU. This window builds a fresh one for every tree, rock and
// body that walks into the fog, so an hour of walking is an hour of buffers
// nobody will ever draw again.
let peakMesh = 0, peakChild = 0
const mark = []
for (let step = 0; step < 900; step++) {
  const a = step * 0.11
  world.players.me.x = 336 + Math.round(Math.cos(a) * 22)
  world.players.me.y = 208 + Math.round(Math.sin(a) * 22)
  world.tick += 1
  send({ type: 'state', state: world, worldId: 'w' })
  CLOCK += 34; for (const fn of raf.splice(0, raf.length)) fn(CLOCK)
  if (meshes > peakMesh) peakMesh = meshes
  if (step % 300 === 299) { if (global.gc) { global.gc(); global.gc() }
    mark.push(Math.round(process.memoryUsage().heapUsed / 1e6)) }
}
ok(peakMesh < 4000, 'nine hundred steps and the scene never exceeds ' + peakMesh + ' meshes')
if (global.gc) {
  const drift = mark[mark.length - 1] - mark[0]
  ok(drift < 40, 'the heap settles rather than climbing (' + mark.join(' \u2192 ') + ' MB)')
} else console.log('  \u00b7     run with --expose-gc to measure the heap as well')
console.log(bad ? '\n  ' + bad + ' failed' : '\n  ok    a real world fits inside the window\u2019s own frame budget')
process.exit(bad ? 1 : 0)
