// §6dj, for the mist window: DOES IT BOOT, AND DOES THE COUNTRY ARRIVE.
//
// check-window-boot.mjs proves the flat window's top level runs. This does the
// same for the mist window and then a little more, because a 3D window can boot
// perfectly and still build an empty scene: it feeds the thing a real state over
// its own socket handler, runs a hundred frames against a stubbed GPU, and then
// looks at the scene graph to see whether the citizen is standing where the
// protocol says they are and whether the country turned up around them.
//
// It needs three.js, which the window fetches from a CDN in a browser and which
// is NOT a dependency of the node. Without it this skips rather than fails:
//     npm i three@0.128.0 && node check-window-mist.mjs
//
// It cannot prove the window LOOKS right. Nothing short of a browser can. It
// proves the geometry is finite, the materials have the attributes the shader
// asks for, and the world lands in front of the eye.

import { readFileSync } from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

let THREE
try { THREE = require('three') } catch {
  console.log('  skip  three.js is not installed here (npm i three@0.128.0)')
  process.exit(0)
}

let bad = 0
const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL') + '  ' + m); if (!c) bad++ }

// ---------- a browser, more or less ----------
const noop = () => {}
const ctx2d = () => new Proxy({ measureText: () => ({ width: 10 }) },
  { get: (t, k) => (k in t ? t[k] : noop), set: (t, k, v) => (t[k] = v, true) })
const canvas = () => ({ width: 300, height: 150, style: {}, getContext: (k) => (k === '2d' ? ctx2d() : null),
                        addEventListener: noop, requestPointerLock: noop, toDataURL: () => 'data:' })
const els = {}
const raf = []
let CLOCK = 1000
global.window = global
global.document = { createElement: canvas, getElementById: (id) => (els[id] ||= canvas()),
                    addEventListener: noop, exitPointerLock: noop, pointerLockElement: null }
global.location = { protocol: 'http:', host: 'x' }
global.localStorage = { getItem: () => 'check-uid', setItem: noop }
global.innerWidth = 1280; global.innerHeight = 800
global.addEventListener = noop
global.prompt = () => ''
global.AudioContext = undefined
const def = (k, v) => Object.defineProperty(global, k, { value: v, configurable: true })
def('navigator', { getGamepads: () => [] })
def('crypto', { randomUUID: () => 'check-uid' })
def('performance', { now: () => CLOCK })
global.requestAnimationFrame = (fn) => raf.push(fn)
const socks = []
global.WebSocket = class { constructor () { this.readyState = 1; socks.push(this) } send () {} close () {} }

// ---------- a GPU that only checks its homework ----------
const seen = { frames: 0, main: null, cam: null }
THREE.WebGLRenderer = class {
  constructor () { this.domElement = canvas(); this.autoClear = true }
  setPixelRatio () {} setSize () {} setClearColor () {} clear () {} clearDepth () {} setRenderTarget () {}
  render (scene, cam) {
    seen.frames++
    if (scene.children.length > 3) { seen.main = scene; seen.cam = cam }
    scene.traverse((o) => {
      if (!o.isMesh) return
      const g = o.geometry, m = o.material
      if (!g.attributes.position) throw new Error('a mesh with no position')
      if (m.uniforms && /attribute vec3 color/.test(m.vertexShader || '') && !g.attributes.color)
        throw new Error('the shader wants a colour attribute and ' + g.type + ' has none')
      if (m.uniforms && /uv/.test(m.vertexShader || '') && !g.attributes.uv)
        throw new Error('no uv on ' + g.type)
      for (const [k, u] of Object.entries(m.uniforms || {}))
        if (u.value === undefined) throw new Error('uniform ' + k + ' was never given a value')
      const p = g.attributes.position.array
      for (let i = 0; i < Math.min(p.length, 600); i++)
        if (!Number.isFinite(p[i])) throw new Error('a corner of ' + g.type + ' is not a number')
    })
  }
}
global.THREE = THREE

// ---------- run it ----------
const html = readFileSync('window-mist.html', 'utf8')
const bodies = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1])
try { for (const b of bodies) (0, eval)(b) } catch (e) { ok(false, 'the top level runs: ' + e.message); process.exit(1) }
ok(true, 'the top level runs')

const frames = (n, t0) => { for (let i = 0; i < n; i++) { CLOCK = t0 + i * 40
  for (const fn of raf.splice(0, raf.length)) fn(CLOCK) } }
frames(4, 1000)
ok(seen.frames > 0, 'it draws before it has a world (' + seen.frames + ' passes)')

const state = {
  tick: 1200, genesis: { worldW: 128, worldH: 128, genesisSeed: 'check-seed' },
  players: { me: { x: 40, y: 40, hp: 7, maxHp: 10, gold: 42, name: 'ada',
                   inventory: [{ item: 'iron-hatchet' }, { item: 'logs' }] },
             pal: { x: 42, y: 41, hp: 9, maxHp: 10, name: 'bram', inventory: [] } },
  mobs: { m1: { type: 'goblin', hp: 4, x: 41, y: 40 }, m2: { type: 'wolf', hp: 8, x: 38, y: 43 },
          m3: { type: 'dragon', hp: 400, x: 44, y: 44 }, m4: { type: 'a-thing-with-no-name', hp: 3, x: 39, y: 39 } },
  nodes: Object.fromEntries(['tree', 'rock', 'campfire', 'bank', 'fishing-spot', 'plot', 'well', 'signpost',
    'brewpot', 'wall', 'watchfire', 'cart', 'guard', 'anvil', 'dummy', 'rockfall', 'a-thing-with-no-name']
    .map((t, i) => ['n' + i, { type: t, x: 36 + (i % 8), y: 38 + ((i / 8) | 0) }])),
  ground: { g1: { item: 'bones', x: 40, y: 41 } }
}
const send = (m) => { for (const s of socks) s.onmessage && s.onmessage({ data: JSON.stringify(m) }) }
for (const s of socks) s.onopen && s.onopen()
send({ type: 'hello', playerId: 'me' })
send({ type: 'state', state, worldId: 'abcdef0123' })
frames(40, 2000)
ok(!!seen.main, 'a world scene got built')

const ground = seen.main.children.find((c) => c.geometry && c.geometry.attributes.position &&
                                              c.geometry.attributes.position.count > 2000)
ok(!!ground, 'the ground is laid (' + (ground ? ground.geometry.attributes.position.count / 4 : 0) + ' tiles)')

// the citizen is on tile 40,40, so the eye is at 81,81 in metres, give or take a step
const cam = seen.cam
ok(cam && Math.abs(cam.position.x - 81) < 3.2 && Math.abs(cam.position.z - 81) < 3.2,
   'the eye is where the protocol says the citizen is (' +
   (cam ? cam.position.x.toFixed(1) + ', ' + cam.position.z.toFixed(1) : '?') + ')')

let meshes = 0, nan = 0
seen.main.traverse((o) => { if (o.isMesh) meshes++
  if (!Number.isFinite(o.position.x + o.position.y + o.position.z)) nan++ })
ok(meshes > 40, 'the country arrived (' + meshes + ' meshes)')
ok(nan === 0, 'nothing in the scene graph is at NaN')

const close = seen.main.children.filter((o) => o !== ground && o.position.distanceTo(cam.position) < 14)
ok(close.length >= 8, 'it is standing among things, not beside them (' + close.length + ' within seven tiles)')

// a tick later: a death, a demolition, and the middle of the night
state.tick = 2280; state.mobs.m1.hp = 0; delete state.nodes.n0; state.players.me.x = 41; state.players.me.hp = 3
send({ type: 'state', state, worldId: 'abcdef0123' })
try { frames(40, 4000); ok(true, 'it survives a death, a demolition and nightfall') }
catch (e) { ok(false, 'nightfall: ' + e.message) }

console.log(bad ? '\n  ' + bad + ' failed' : '\n  ok    the mist window boots and builds a country')
process.exit(bad ? 1 : 0)
