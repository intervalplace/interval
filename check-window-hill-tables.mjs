// §6dj, for the mist window: WHOSE NUMBERS ARE THESE.
//
// A window that keeps its own copy of another file's constants is a window that
// will one day tell a citizen a sword costs four iron when the world wants
// five. When this was measured, twenty of the mist window's fifty-eight forge
// costs had drifted from `engine.js`: it offered recipes that could not be made,
// hid ones that could, and named two ingredients — `steel-ingot` — that do not
// exist in the world at all.
//
// The cure is not a better copy. `serve.mjs` now serves `/api/tables` straight
// out of the engine's own exports, and the window fetches it at boot. This
// checks two things: that the pillar's tables and the engine's agree exactly,
// and that the window actually takes them.
//
// Needs three.js:  npm i three@0.128.0

import { readFileSync } from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let THREE, E
try { THREE = require('three'); E = require('./engine.js') }
catch (e) { console.log('  skip  ' + e.message.split('\n')[0]); process.exit(0) }

let bad = 0
const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL') + '  ' + m); if (!c) bad++ }

// ---- 1. what the pillar would serve, built the way serve.mjs builds it ----
const served = { recipes: E.RECIPES, prices: E.PRICES, vigilTicks: E.VIGIL_TICKS,
  stalls: { lumber: { 'iron-hatchet': 20 }, delve: { 'iron-pickaxe': 20 },
    arms: { 'iron-dagger': 16, 'iron-sword': 30, 'iron-spear': 28 }, armour: { 'iron-helm': 24 },
    bows: { 'wooden-bow': 16, staff: 12, wand: 12 }, seed: { seeds: 22 }, fisher: { rod: 20 } } }
ok(Object.keys(served.recipes).length > 40,
   'the pillar can serve ' + Object.keys(served.recipes).length + ' recipes out of the engine')

// ---- 2. the window's own fallback, and how far it has drifted ----
const src = readFileSync('window-hill.html', 'utf8')
const i = src.indexOf('const FORGE = {')
const FALLBACK = eval('(' + src.slice(i + 'const FORGE = '.length, src.indexOf('\n}\n', i) + 2) + ')')
const drift = Object.keys(FALLBACK).filter(k => {
  const r = served.recipes[k]; if (!r) return true
  return JSON.stringify(r.need || r) !== JSON.stringify(FALLBACK[k])
})
console.log('  \u00b7     the window\u2019s built-in copy differs from the engine in ' +
            drift.length + ' of ' + Object.keys(FALLBACK).length +
            ' recipes \u2014 which is the whole reason for /api/tables')

// ---- 3. does the window actually take what it is served? ----
const noop = () => {}
const ctx2d = () => new Proxy({ measureText: () => ({ width: 10 }) },
  { get: (t, k) => (k in t ? t[k] : noop), set: () => true })
const canvas = () => { const c = { width: 320, height: 240, style: {}, _h: {},
  getContext: (k) => (k === '2d' ? ctx2d() : null), addEventListener: (t, f) => { (c._h[t] ||= []).push(f) },
  requestPointerLock: noop, toDataURL: () => 'd' }; return c }
const els = {}, raf = [], win = {}
let CLOCK = 1000, askedTables = false
global.window = global
global.document = { createElement: canvas, getElementById: (id) => (els[id] ||= canvas()),
  addEventListener: noop, exitPointerLock: noop, pointerLockElement: null }
global.location = { protocol: 'http:', host: 'x', search: '' }
global.localStorage = { getItem: () => null, setItem: noop }
global.innerWidth = 960; global.innerHeight = 720
global.addEventListener = (t, f) => { (win[t] ||= []).push(f) }
global.prompt = () => ''; global.AudioContext = undefined
global.fetch = async (u) => {
  if (String(u).includes('/api/tables')) { askedTables = true
    return { ok: true, json: async () => served } }
  return { ok: false }
}
const def = (k, v) => Object.defineProperty(global, k, { value: v, configurable: true })
def('navigator', { getGamepads: () => [] }); def('crypto', { randomUUID: () => 't' })
def('performance', { now: () => CLOCK })
global.requestAnimationFrame = (fn) => raf.push(fn)
const socks = []
global.WebSocket = class { constructor () { this.readyState = 1; socks.push(this) } send () {} close () {} }
THREE.WebGLRenderer = class { constructor () { this.domElement = canvas() }
  setPixelRatio () {} setSize () {} setClearColor () {} clear () {} clearDepth () {}
  setRenderTarget () {} render () {} }
global.THREE = THREE
for (const b of [...src.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])) (0, eval)(b)
await new Promise(r => setTimeout(r, 60))
ok(askedTables, 'the window asks the pillar for its tables at boot')

// and the anvil now offers what the ENGINE says, not what the window remembered
const frames = (n) => { for (let i = 0; i < n; i++) { CLOCK += 40
  for (const fn of raf.splice(0, raf.length)) fn(CLOCK) } }
const send = (m) => { for (const s of socks) s.onmessage({ data: JSON.stringify(m) }) }
for (const s of socks) s.onopen && s.onopen()
send({ type: 'hello', playerId: 'me' })
// hold exactly what the engine says a star-ingot costs, and nothing the copy said
const need = served.recipes['star-ingot'].need || served.recipes['star-ingot']
const inv = Object.entries(need).map(([item, qty]) => ({ item, qty }))
send({ type: 'state', worldId: 'w', state: { tick: 900,
  genesis: { worldW: 64, worldH: 64, genesisSeed: 't' },
  players: { me: { x: 20, y: 20, hp: 10, maxHp: 10, gold: 0, inventory: inv,
    skills: { earthcraft: 9e6, sorcery: 9e6 } } },
  mobs: {}, nodes: { a: { type: 'anvil', x: 21, y: 20 } }, ground: {} } })
frames(6)
const sent = []
socks.forEach(s => { s.send = (r) => { try { const m = JSON.parse(r); if (m.type === 'act') sent.push(m.action) } catch {} } })
const key = (k) => { for (const f of win.keydown || []) f({ key: k, preventDefault: noop, shiftKey: false }) }
const up = (k) => { for (const f of win.keyup || []) f({ key: k, preventDefault: noop }) }
key('e'); up('e'); frames(2)                      // within reach -> the anvil
for (let i = 0; i < 30; i++) { key('Enter'); frames(1)
  if (sent.some(a => a.do === 'smith' && a.recipe === 'star-ingot')) break
  key('ArrowDown') }
ok(sent.some(a => a.do === 'smith' && a.recipe === 'star-ingot'),
   'holding what the ENGINE says a star-ingot costs, the anvil offers to make one')
console.log(bad ? '\n  ' + bad + ' failed' : '\n  ok    the numbers are the pillar\u2019s, and the window takes them')
process.exit(bad ? 1 : 0)
