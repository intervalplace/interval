// §6dj, for the mist window: DOES EVERY DEED THROW SOMETHING.
//
// `deed` is one word in the state, set on the interval an accepted input lands,
// and it is set for EVERY citizen. A window that reads it only for its own soul
// leaves everyone else working in perfect silence — standing at an anvil with
// nothing happening, drawing a bow with no arrow crossing the ground.
//
// This drives real state diffs past the window and counts what got ADDED TO THE
// SCENE: particles, rings, things in flight. Not what was sent — the verb check
// does that — but what a person standing there would see.
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
global.window = global
global.document = { createElement: canvas, getElementById: (id) => (els[id] ||= canvas()),
                    addEventListener: noop, exitPointerLock: noop, pointerLockElement: null }
global.location = { protocol: 'http:', host: 'x' }
global.localStorage = { getItem: () => null, setItem: noop }
global.innerWidth = 960; global.innerHeight = 720
global.addEventListener = (t, f) => { (win[t] ||= []).push(f) }
global.prompt = () => ''; global.AudioContext = undefined
global.fetch = async () => ({ ok: false })
const def = (k, v) => Object.defineProperty(global, k, { value: v, configurable: true })
def('navigator', { getGamepads: () => [] }); def('crypto', { randomUUID: () => 'mo' })
def('performance', { now: () => CLOCK })
global.requestAnimationFrame = (fn) => raf.push(fn)
const socks = []
global.WebSocket = class { constructor () { this.readyState = 1; socks.push(this) } send () {} close () {} }
let scene = null
THREE.WebGLRenderer = class { constructor () { this.domElement = canvas() }
  setPixelRatio () {} setSize () {} setClearColor () {} clear () {} clearDepth () {}
  setRenderTarget () {} render (sc) { if (sc.children.length > 3) scene = sc } }
global.THREE = THREE
for (const b of [...readFileSync('window-writ.html', 'utf8')
  .matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])) (0, eval)(b)

let bad = 0
const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL') + '  ' + m); if (!c) bad++ }
const frames = (n) => { for (let i = 0; i < n; i++) { CLOCK += 40
  for (const fn of raf.splice(0, raf.length)) fn(CLOCK) } }
const send = (m) => { for (const s of socks) s.onmessage({ data: JSON.stringify(m) }) }
const top = () => (scene ? scene.children.length : 0)

const base = (over) => ({ tick: 900, genesis: { worldW: 64, worldH: 64, genesisSeed: 'mo' },
  players: { me: { x: 20, y: 20, hp: 10, maxHp: 10, gold: 0, inventory: [], skills: {},
                   equipment: { weapon: { item: 'wooden-bow' } } },
             pal: { x: 22, y: 20, hp: 10, maxHp: 10, name: 'bram', inventory: [], skills: {},
                    equipment: { weapon: { item: 'iron-hatchet' } } } },
  mobs: { g1: { type: 'goblin', hp: 9, x: 26, y: 20 } },
  nodes: { t1: { type: 'tree', x: 19, y: 20, depletedUntil: 0 } }, ground: {}, ...over })

for (const s of socks) s.onopen && s.onopen()
send({ type: 'hello', playerId: 'me' })
send({ type: 'state', state: base(), worldId: 'w' }); frames(6)

// ---- a NEIGHBOUR works, and it must be visible ----
const before = top()
const w1 = base({ tick: 901 }); w1.players.pal.deed = 'smith'
send({ type: 'state', state: w1, worldId: 'w' }); frames(2)
ok(top() > before, 'a neighbour at an anvil throws sparks (' + before + ' \u2192 ' + top() + ')')

// ---- every deed word the engine has must throw SOMETHING ----
const DEEDS = ['alch', 'unmake', 'seal', 'char', 'unload', 'rifle', 'haul', 'dedicate', 'grave',
  'sound', 'drink', 'eat', 'bury', 'forage', 'mendp', 'invoke', 'fletch', 'smith', 'plant',
  'harvest', 'cook', 'light', 'kindle', 'still', 'found', 'lay', 'cast', 'recall', 'pickup',
  'drop', 'buy', 'deposit', 'withdraw']
const silent = []
for (const d of DEEDS) {
  frames(30)                                    // let the last lot expire
  const n0 = top()
  const w = base({ tick: 902 }); w.players.pal.deed = d
  send({ type: 'state', state: w, worldId: 'w' }); frames(1)
  if (top() <= n0) silent.push(d)
  const w2 = base({ tick: 903 }); w2.players.pal.deed = null
  send({ type: 'state', state: w2, worldId: 'w' }); frames(1)
}
ok(silent.length === 0, 'all ' + DEEDS.length + ' engine deeds throw something' +
   (silent.length ? ' \u2014 silent: ' + silent.join(' ') : ''))

// ---- a shot crosses the ground ----
frames(30)
const n1 = top()
const shoot = base({ tick: 910 })
shoot.players.me.action = { type: 'attack', mobId: 'g1' }
send({ type: 'state', state: shoot, worldId: 'w' }); frames(2)
const shoot2 = base({ tick: 911 })
shoot2.players.me.action = { type: 'attack', mobId: 'g1' }
shoot2.mobs.g1.hp = 5                            // it landed, from six tiles off
send({ type: 'state', state: shoot2, worldId: 'w' }); frames(2)
ok(top() > n1, 'a bow at six tiles puts an arrow in the air (' + n1 + ' \u2192 ' + top() + ')')
const flying = top()
frames(30)
ok(top() < flying, 'and it arrives, rather than hanging there')

// ---- §6af: a special is not an ordinary swing ----
frames(40)
const n2 = top()
const sp1 = base({ tick: 920 })
sp1.players.pal.equipment = { weapon: { item: 'star-maul' } }
sp1.players.pal.lastSwing = 930                 // an arm spent PAST this tick
sp1.players.pal.action = { type: 'attack', mobId: 'g1' }
send({ type: 'state', state: sp1, worldId: 'w' }); frames(2)
ok(top() > n2, "a neighbour's special is visible from across the field (" + n2 + ' \u2192 ' + top() + ')')
frames(60)
// and yours: C with a weapon that has one
const mine2 = base({ tick: 940 })
mine2.players.me.equipment = { weapon: { item: 'star-maul' } }
mine2.mobs.g1 = { type: 'goblin', hp: 9, x: 21, y: 20 }
send({ type: 'state', state: mine2, worldId: 'w' }); frames(2)
const n3 = top()
for (const f of win.keydown || []) f({ key: 'c', preventDefault: noop, shiftKey: false })
frames(2)
ok(top() > n3, 'your own special throws its own shape (' + n3 + ' \u2192 ' + top() + ')')

// ---- §6am: WORK THAT RUNS ON. A gather is an action, not a deed: it keeps
// going by itself. The window must keep working, not freeze mid-swing.
frames(60)
const toil = base({ tick: 950 })
toil.players.me.action = { type: 'gather', nodeId: 't1' }
toil.players.me.equipment = { weapon: { item: 'iron-hatchet' } }
send({ type: 'state', state: toil, worldId: 'w' })
let swings = 0
for (let i = 0; i < 90; i++) { const n0 = top(); frames(1); if (top() > n0) swings++ }
ok(swings >= 2, 'an axe already in the wood keeps swinging (' + swings + ' bursts of chips)')
// and it stops when the action does
frames(50)
const done = base({ tick: 1010 })
send({ type: 'state', state: done, worldId: 'w' })
frames(30)
let after = 0
for (let i = 0; i < 60; i++) { const n0 = top(); frames(1); if (top() > n0) after++ }
ok(after === 0, 'and it stops the moment the seam is spent')

// a neighbour at a seam moves their arm, rather than standing in a field
const wk = base({ tick: 1020 })
wk.players.pal.action = { type: 'gather', nodeId: 't1' }
send({ type: 'state', state: wk, worldId: 'w' }); frames(4)
let armed = null
for (const o of scene.children) {
  if (!o.userData || !o.userData.limbs) continue
  armed = o.userData.limbs.ra.rotation.x
}
frames(8)
let armed2 = null
for (const o of scene.children) { if (o.userData && o.userData.limbs) armed2 = o.userData.limbs.ra.rotation.x }
ok(armed !== null && armed !== armed2, 'a neighbour at a seam is visibly working (' +
   (armed === null ? 'no arm found' : armed.toFixed(2) + ' \u2192 ' + armed2.toFixed(2)) + ')')

// ---- nothing leaks ----
frames(120)
const settled = top()
frames(120)
ok(Math.abs(top() - settled) <= 2, 'the scene settles back down (' + settled + ' \u2192 ' + top() + ')')
console.log(bad ? '\n  ' + bad + ' failed' : '\n  ok    every deed in the world throws something, and it clears up after itself')
process.exit(bad ? 1 : 0)
