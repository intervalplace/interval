// §6dj, for the mist window: A STEP IS A STEP.
//
// This window spent its first month hiding the tick. The camera chased the
// citizen's tile with a per-frame lerp, the head-bob ran on a free sine, and
// the footfalls came off a timer that had nothing to do with where the feet
// were. That is a continuous glide over a world that does not move
// continuously — and a glide over a one-second interval does not read as
// smooth, it reads as LAG.
//
// A grid crawler snaps: the step is short and hard and finished long before the
// next one is allowed, so the stillness between steps is stillness rather than
// waiting. This checks the arithmetic of that — the step completes well inside
// the interval, it ARRIVES rather than easing forever, and between steps the
// camera is actually still.
//
// Needs three.js:  npm i three@0.128.0

import { readFileSync } from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let THREE; try { THREE = require('three') } catch { console.log('  skip  no three.js'); process.exit(0) }

const noop = () => {}
const ctx2d = () => new Proxy({ measureText: () => ({ width: 10 }) },
  { get: (t, k) => (k in t ? t[k] : noop), set: () => true })
const canvas = () => { const c = { width: 320, height: 240, style: {}, _h: {},
  getContext: (k) => (k === '2d' ? ctx2d() : null), addEventListener: (t, f) => { (c._h[t] ||= []).push(f) },
  requestPointerLock: noop, toDataURL: () => 'd' }; return c }
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
global.fetch = async () => ({ ok: false })
const def = (k, v) => Object.defineProperty(global, k, { value: v, configurable: true })
def('navigator', { getGamepads: () => [] }); def('crypto', { randomUUID: () => 's' })
def('performance', { now: () => CLOCK })
global.requestAnimationFrame = (fn) => raf.push(fn)
const socks = []
global.WebSocket = class { constructor () { this.readyState = 1; socks.push(this) } send () {} close () {} }
let cam = null
THREE.WebGLRenderer = class { constructor () { this.domElement = canvas() }
  setPixelRatio () {} setSize () {} setClearColor () {} clear () {} clearDepth () {}
  setRenderTarget () {} render (sc, c) { if (c && (c.isPerspectiveCamera || c.isOrthographicCamera) && sc.children.length > 2) cam = c } }
global.THREE = THREE
for (const b of [...readFileSync('window-hill.html', 'utf8')
  .matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])) (0, eval)(b)

let bad = 0
const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL') + '  ' + m); if (!c) bad++ }
const FRAME = 34
const frames = (n) => { for (let i = 0; i < n; i++) { CLOCK += FRAME
  for (const fn of raf.splice(0, raf.length)) fn(CLOCK) } }
const send = (m) => { for (const s of socks) s.onmessage({ data: JSON.stringify(m) }) }
const at = (x) => ({ tick: 900 + x, genesis: { worldW: 64, worldH: 64, genesisSeed: 's' },
  players: { me: { x, y: 20, hp: 10, maxHp: 10, gold: 0, inventory: [], skills: {} } },
  mobs: {}, nodes: {}, ground: {} })

for (const s of socks) s.onopen && s.onopen()
send({ type: 'hello', playerId: 'me' })
send({ type: 'state', state: at(20), worldId: 'w' })
frames(60)                                        // let the first placement settle
const home = cam.position.x

// ---- one step, and how long it takes ----
send({ type: 'state', state: at(21), worldId: 'w' })
const dest = home + 2                             // one tile is TILE = 2 metres
let arrivedMs = null
for (let i = 0; i < 40; i++) { frames(1)
  if (arrivedMs === null && Math.abs(cam.position.x - dest) < 0.02) arrivedMs = (i + 1) * FRAME }
ok(arrivedMs !== null, 'a step actually arrives (' + (arrivedMs ?? '\u2014') + 'ms)')
ok(arrivedMs !== null && arrivedMs < 400,
   'and it lands well inside the one-second interval, not across it')

// ---- and then it is STILL. A glide would still be creeping here. ----
const a = cam.position.clone()
frames(12)
const drift = a.distanceTo(cam.position)
ok(drift < 0.05, 'between steps the eye is still, not creeping (' + drift.toFixed(3) + 'm)')

// ---- A JOURNEY IS NOT TWO HUNDRED STOPS. A lone step should snap; steps
// arriving back to back are WALKING and should flow, or crossing the fens is a
// strobe: moving a quarter of the time and frozen for the rest.
let maxGap = 0, stillFrames = 0, movedFrames = 0
for (let t = 22; t < 32; t++) {
  send({ type: 'state', state: at(t), worldId: 'w' })
  for (let i = 0; i < 30; i++) {                  // one interval at 34ms a frame
    const was = cam.position.x
    frames(1)
    if (Math.abs(cam.position.x - was) > 0.004) movedFrames++; else stillFrames++
  }
  maxGap = Math.max(maxGap, Math.abs(cam.position.x - (home + (t - 20) * 2)))
}
ok(maxGap < 0.05, 'ten steps later the eye is exactly where the citizen is (' + maxGap.toFixed(3) + 'm)')
const duty = movedFrames / (movedFrames + stillFrames)
ok(duty > 0.6, 'and while walking it is MOVING most of the interval, not strobing ('
   + Math.round(duty * 100) + '% of frames)')

// ---- but a lone step, taken after a pause, is still hard ----
frames(60)                                        // stand about a while
send({ type: 'state', state: at(33), worldId: 'w' })
let lone = null
for (let i = 0; i < 40; i++) { frames(1)
  if (lone === null && Math.abs(cam.position.x - (home + 13 * 2)) < 0.02) lone = (i + 1) * FRAME }
ok(lone !== null && lone < 420, 'a step taken on its own still snaps (' + lone + 'ms)')

// ---- the two strides have different SHAPES, which is the whole point ----
// a lone step leaves hard: you asked for it, and it happens.
frames(60)
const s0 = cam.position.x
send({ type: 'state', state: at(34), worldId: 'w' })
frames(2)
const loneEarly = (cam.position.x - s0) / 2
// a stride that continues a walk eases in, so one runs into the next instead
// of stopping dead and starting again.
send({ type: 'state', state: at(35), worldId: 'w' })
frames(1)
const w0 = cam.position.x
frames(2)
const walkEarly = (cam.position.x - w0) / 2
ok(loneEarly > 0.18, 'a lone step leaves hard (' + (loneEarly * 100).toFixed(0) + '% in two frames)')
ok(walkEarly < loneEarly, 'and a stride that continues a walk eases in instead ('
   + (walkEarly * 100).toFixed(0) + '%), so one runs into the next')
console.log(bad ? '\n  ' + bad + ' failed' : '\n  ok    a step snaps, a journey flows, and both of them arrive')
process.exit(bad ? 1 : 0)
