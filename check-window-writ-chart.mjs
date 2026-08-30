// §6dj, for the mist window: THE CHART-TABLE.
//
// Not a corner minimap: the whole argument of this window is that you can see
// eleven tiles, and a panel showing forty hands back exactly what the fog took.
// So the map takes the screen and you cannot walk while it is open. This checks
// that it does, that it draws the ground the PILLAR serves rather than anything
// the window invented, and — the part that matters — that it does not pretend
// to be the `chart` item. The engine is flat about what a chart is: "It opens
// no doors. Nobody travels by it."
//
// Needs three.js:  npm i three@0.128.0

import { readFileSync } from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let THREE; try { THREE = require('three') } catch { console.log('  skip  no three.js'); process.exit(0) }

const noop = () => {}
const painted = []
const ctx2d = () => new Proxy({ measureText: () => ({ width: 10 }) }, {
  get: (t, k) => { if (k in t) return t[k]
    return (...a) => { if (k === 'fillRect' || k === 'fillText') painted.push(k + ':' + a.join(',')) } },
  set: (t, k, v) => { if (k === 'fillStyle') painted.push('c:' + v); return true } })
const canvas = () => { const c = { width: 320, height: 240, style: {}, _h: {},
  getContext: (k) => (k === '2d' ? ctx2d() : null), addEventListener: (t, f) => { (c._h[t] ||= []).push(f) },
  requestPointerLock: noop, toDataURL: () => 'data:' }; return c }
const els = {}, raf = [], win = {}
let CLOCK = 1000, store = {}
global.window = global
global.document = { createElement: canvas, getElementById: (id) => (els[id] ||= canvas()),
                    addEventListener: noop, exitPointerLock: noop, pointerLockElement: null }
global.location = { protocol: 'http:', host: 'x', search: '' }
global.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v } }
global.innerWidth = 960; global.innerHeight = 720
global.addEventListener = (t, f) => { (win[t] ||= []).push(f) }
global.prompt = () => ''; global.AudioContext = undefined
const def = (k, v) => Object.defineProperty(global, k, { value: v, configurable: true })
def('navigator', { getGamepads: () => [] }); def('crypto', { randomUUID: () => 'ch' })
def('performance', { now: () => CLOCK })
global.requestAnimationFrame = (fn) => raf.push(fn)

// a pillar that serves a small square country with one road and two towns
const MW = 64, MH = 48, bits = Math.ceil((MW * MH) / 8)
const bin = new Uint8Array(bits * 2 + MW * MH)
const set = (arr, off, x, y) => { const i = y * MW + x; arr[off + (i >> 3)] |= 1 << (i & 7) }
for (let x = 0; x < MW; x++) set(bin, bits, x, 24)               // a road across the middle
for (let y = 0; y < MH; y++) for (let x = 0; x < 8; x++) set(bin, 0, x, y)   // sea to the west
let asked = []
global.fetch = async (u) => { asked.push(u)
  if (u.endsWith('.bin')) return { ok: true, arrayBuffer: async () => bin.buffer }
  if (u.endsWith('terrain.json')) return { ok: true, json: async () => ({ w: MW, h: MH, biomes: ['shire', 'fen'],
    settlements: [{ tag: 'anchor', name: 'Anchor', x: 30, y: 24, w: 10, h: 8 },
                  { tag: 'far', name: 'Coldmere', x: 55, y: 10, w: 8, h: 6 }] }) }
  return { ok: false } }
const socks = []
global.WebSocket = class { constructor () { this.readyState = 1; socks.push(this) } send () {} close () {} }
THREE.WebGLRenderer = class { constructor () { this.domElement = canvas() }
  setPixelRatio () {} setSize () {} setClearColor () {} clear () {} clearDepth () {}
  setRenderTarget () {} render () {} }
global.THREE = THREE
for (const b of [...readFileSync('window-writ.html', 'utf8')
  .matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])) (0, eval)(b)

let bad = 0
const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL') + '  ' + m); if (!c) bad++ }
const frames = (n) => { for (let i = 0; i < n; i++) { CLOCK += 40
  for (const fn of raf.splice(0, raf.length)) fn(CLOCK) } }
const key = (k) => { for (const f of win.keydown || []) f({ key: k, preventDefault: noop, shiftKey: false }) }
const up = (k) => { for (const f of win.keyup || []) f({ key: k, preventDefault: noop }) }
const sent = []
socks.forEach(s => { s.send = (r) => { try { const m = JSON.parse(r); if (m.type === 'act') sent.push(m.action.do) } catch {} } })

const state = (over) => ({ tick: 900, genesis: { worldW: MW, worldH: MH, genesisSeed: 'ch' },
  players: { me: { x: 20, y: 30, hp: 10, maxHp: 10, gold: 0, inventory: [], skills: {} } },
  mobs: {}, nodes: { sp: { type: 'signpost', x: 21, y: 30, text: 'the Old Kiln' } }, ground: {}, ...over })
const send = (m) => { for (const s of socks) s.onmessage({ data: JSON.stringify(m) }) }
for (const s of socks) s.onopen && s.onopen()
send({ type: 'hello', playerId: 'me' })
send({ type: 'state', state: state(), worldId: 'w' }); frames(4)

// a signpost you walk past writes itself down
ok(/the Old Kiln/.test(store['interval-mist-marks'] || ''), 'a signpost you pass inks itself onto the map')
// and a town names itself when you stand in it, not when you look at it
ok(!/Anchor/.test(store['interval-mist-marks'] || ''), 'a town twelve tiles off is not named yet')

key('m'); up('m')
await new Promise(r => setTimeout(r, 40))
frames(4)
ok(asked.some(u => u.includes('terrain.bin')) && asked.some(u => u.includes('terrain.json')),
   'it draws the ground the PILLAR serves, not a table of its own')

// it takes the screen, and it stops you where you stand
painted.length = 0
frames(2)
ok(painted.some(p => p === 'c:#d9cfa8'), 'the plate is vellum, and it takes the whole screen')
sent.length = 0
for (const k of ['w', 'a', 's', 'd']) { key(k); up(k) }
frames(4)
ok(!sent.includes('move'), 'you cannot walk while it is open')

// nothing here pretends to be the chart item
const src = readFileSync('window-writ.html', 'utf8')
const usesChart = /'chart'[^\n]*map|map[^\n]*'chart'/i.test(src)
ok(!usesChart, "and it does not pretend to be the `chart` item, which opens no doors")

key('m'); up('m'); frames(2)
sent.length = 0
key('w'); up('w'); frames(4)
ok(sent.includes('move'), 'put it away and you can walk again')

// standing in the town names it
send({ type: 'state', state: state({ players: { me: { x: 30, y: 24, hp: 10, maxHp: 10, gold: 0,
  inventory: [], skills: {} } } }), worldId: 'w' }); frames(4)
ok(/Anchor/.test(store['interval-mist-marks'] || ''), 'and a town names itself once you are standing in it')
console.log(bad ? '\n  ' + bad + ' failed' : '\n  ok    the chart-table draws the served ground, and costs you standing still')
process.exit(bad ? 1 : 0)
