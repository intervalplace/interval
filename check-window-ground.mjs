// §6dj, for the mist window: DOES THE GROUND AGREE WITH THE PILLAR.
//
// The chart-table fetched `blocked`, `road` and `country` and drew a map from
// them — and then the 3D ground ignored all three and picked its texture out of
// hash noise. So a lake looked like grass and you walked at it and were blocked
// with no warning; a road with two hundred signposts along it looked like a
// field; and the fens, the moor and the heartlands were the same sage-green.
// The map knew the world. The world you were standing in did not.
//
// This serves a small country with a known shape and checks the GROUND MESH
// changes when the table says it should.
//
// Needs three.js:  npm i three@0.128.0

import { readFileSync } from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let THREE; try { THREE = require('three') } catch { console.log('  skip  no three.js'); process.exit(0) }

const noop = () => {}
const ctx2d = () => new Proxy({ measureText: () => ({ width: 10 }) },
  { get: (t, k) => (k in t ? t[k] : noop), set: (t, k, v) => (t[k] = v, true) })
const canvas = () => { const c = { width: 320, height: 240, style: {}, _h: {},
  getContext: (k) => (k === '2d' ? ctx2d() : null), addEventListener: (t, f) => { (c._h[t] ||= []).push(f) },
  requestPointerLock: noop, toDataURL: () => 'data:' }; return c }
const els = {}, raf = [], win = {}
let CLOCK = 1000

// a country 64x48: sea in the west, a road along y=24, fens in the south
const MW = 64, MH = 48, bits = Math.ceil((MW * MH) / 8)
const bin = new Uint8Array(bits * 2 + MW * MH)
const set = (off, x, y) => { const i = y * MW + x; bin[off + (i >> 3)] |= 1 << (i & 7) }
const BIOME = ['sea', 'greenwood', 'wilds', 'moor', 'crags', 'heartlands', 'downs', 'fens']
for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
  const i = y * MW + x
  if (x < 10) { set(0, x, y); bin[bits * 2 + i] = 0 }        // the sea, and blocked
  else if (y > 34) bin[bits * 2 + i] = 7                     // the fens
  else bin[bits * 2 + i] = 5                                 // the heartlands
  if (y === 24 && x >= 10) set(bits, x, y)                   // a road east from the shore
}
global.window = global
global.document = { createElement: canvas, getElementById: (id) => (els[id] ||= canvas()),
                    addEventListener: noop, exitPointerLock: noop, pointerLockElement: null }
global.location = { protocol: 'http:', host: 'x', search: '' }
global.localStorage = { getItem: () => null, setItem: noop }
global.innerWidth = 960; global.innerHeight = 720
global.addEventListener = (t, f) => { (win[t] ||= []).push(f) }
global.prompt = () => ''; global.AudioContext = undefined
global.fetch = async (u) => {
  if (String(u).endsWith('.bin')) return { ok: true, arrayBuffer: async () => bin.buffer }
  if (String(u).includes('terrain.json')) return { ok: true,
    json: async () => ({ w: MW, h: MH, biomes: BIOME, settlements: [] }) }
  return { ok: false } }
const def = (k, v) => Object.defineProperty(global, k, { value: v, configurable: true })
def('navigator', { getGamepads: () => [] }); def('crypto', { randomUUID: () => 'gr' })
def('performance', { now: () => CLOCK })
global.requestAnimationFrame = (fn) => raf.push(fn)
const socks = []
global.WebSocket = class { constructor () { this.readyState = 1; socks.push(this) } send () {} close () {} }
let scene = null
THREE.WebGLRenderer = class { constructor () { this.domElement = canvas() }
  setPixelRatio () {} setSize () {} setClearColor () {} clear () {} clearDepth () {}
  setRenderTarget () {} render (sc) { if (sc.children.length > 2) scene = sc } }
global.THREE = THREE
for (const b of [...readFileSync('window-mist.html', 'utf8')
  .matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])) (0, eval)(b)

let bad = 0
const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL') + '  ' + m); if (!c) bad++ }
const frames = (n) => { for (let i = 0; i < n; i++) { CLOCK += 40
  for (const fn of raf.splice(0, raf.length)) fn(CLOCK) } }
const send = (m) => { for (const s of socks) s.onmessage({ data: JSON.stringify(m) }) }
const at = (x, y) => ({ tick: 900, genesis: { worldW: MW, worldH: MH, genesisSeed: 'gr' },
  players: { me: { x, y, hp: 10, maxHp: 10, gold: 0, inventory: [], skills: {} } },
  mobs: {}, nodes: {}, ground: {} })

for (const s of socks) s.onopen && s.onopen()
send({ type: 'hello', playerId: 'me' })
send({ type: 'state', state: at(30, 10), worldId: 'w' })
frames(2)
await new Promise(r => setTimeout(r, 60))          // the ground is fetched, so it lands late
frames(8)
const ground = scene.children.find(c => c.geometry && c.geometry.attributes.position &&
                                        c.geometry.attributes.position.count > 2000)
ok(!!ground, 'the ground is laid')
const uvOf = () => { const a = ground.geometry.attributes.uv, out = new Set()
  for (let i = 0; i < a.count; i += 4) out.add(a.getX(i).toFixed(2) + ',' + a.getY(i).toFixed(2))
  return out }
const heart = uvOf()
ok(heart.size > 1, 'and it is drawn from more than one cell of the page (' + heart.size + ')')

// walk south into the fens: the ground must change under you
send({ type: 'state', state: at(30, 44), worldId: 'w' }); frames(8)
const fen = uvOf()
const same = [...fen].filter(k => heart.has(k)).length
ok(fen.size !== heart.size || same < fen.size,
   'the fens do not look like the heartlands (' + heart.size + ' cells \u2192 ' + fen.size + ')')

// and the sea is somewhere you can see, not somewhere that looks like grass
send({ type: 'state', state: at(14, 20), worldId: 'w' }); frames(8)
const pos = ground.geometry.attributes.position
let low = 0
for (let i = 1; i < pos.array.length; i += 3) if (pos.array[i] < -0.5) low++
ok(low > 100, 'the sea lies lower than the land it meets (' + low + ' corners below it)')
const shore = uvOf()
ok([...shore].some(k => !heart.has(k)), 'and it is not drawn with the same cell as a field')

// a road is a road
send({ type: 'state', state: at(30, 24), worldId: 'w' }); frames(8)
ok([...uvOf()].some(k => !heart.has(k) && !fen.has(k)), 'a road under your feet looks like a road')
console.log(bad ? '\n  ' + bad + ' failed' : '\n  ok    the ground agrees with the table the pillar serves')
process.exit(bad ? 1 : 0)
