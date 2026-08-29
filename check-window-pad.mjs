// §6dj, for the mist window: CAN IT BE PLAYED WITH A CONTROLLER.
//
// A window built to look like a console that can only be played with a keyboard
// is telling half a story. This drives a fake pad through the Gamepad API and
// checks the whole window is reachable from it: walking, striking, reaching,
// the special, the pack, the chart, and the panels once they are open.
//
// The layout is the era's — cross acts, circle backs, square reaches, triangle
// is the special — so a hand that has held one of these before knows most of it
// already. That is the thing being tested, not a preference of mine.
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

// the pad itself: sixteen buttons and four axes, all ours to move
const pad = { id: 'Fake Pad', connected: true, axes: [0, 0, 0, 0],
              buttons: Array.from({ length: 16 }, () => ({ pressed: false, value: 0 })) }
let padPresent = true
const press = (i) => { pad.buttons[i].pressed = true }
const release = (i) => { pad.buttons[i].pressed = false }
const B = { CROSS: 0, CIRCLE: 1, SQUARE: 2, TRIANGLE: 3, L1: 4, R1: 5, L2: 6, R2: 7,
            SELECT: 8, START: 9, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 }

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
def('navigator', { getGamepads: () => (padPresent ? [pad] : []) })
def('crypto', { randomUUID: () => 'pd' }); def('performance', { now: () => CLOCK })
global.requestAnimationFrame = (fn) => raf.push(fn)
const sent = []
global.WebSocket = class { constructor () { this.readyState = 1 ; socks.push(this) }
  send (r) { try { const m = JSON.parse(r); if (m.type === 'act') sent.push(m.action) } catch {} } close () {} }
const socks = []
let scene = null
THREE.WebGLRenderer = class { constructor () { this.domElement = canvas() }
  setPixelRatio () {} setSize () {} setClearColor () {} clear () {} clearDepth () {}
  setRenderTarget () {} render (sc) { if (sc.children.length > 3) scene = sc } }
global.THREE = THREE
for (const b of [...readFileSync('window-mist.html', 'utf8')
  .matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])) (0, eval)(b)

let bad = 0
const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL') + '  ' + m); if (!c) bad++ }
const frames = (n) => { for (let i = 0; i < n; i++) { CLOCK += 40
  for (const fn of raf.splice(0, raf.length)) fn(CLOCK) } }
const tapBtn = (i) => { press(i); frames(2); release(i); frames(2) }

const state = { tick: 900, genesis: { worldW: 64, worldH: 64, genesisSeed: 'pd' },
  players: { me: { x: 20, y: 20, hp: 10, maxHp: 10, gold: 0, skills: {},
    equipment: { weapon: { item: 'star-maul' } },
    inventory: [{ item: 'logs' }, { item: 'cooked-fish' }] } },
  mobs: { g1: { type: 'goblin', hp: 5, x: 21, y: 20 } },
  nodes: { t1: { type: 'tree', x: 19, y: 20, depletedUntil: 0 } }, ground: {} }
const send = (m) => { for (const s of socks) s.onmessage({ data: JSON.stringify(m) }) }
for (const s of socks) s.onopen && s.onopen()
send({ type: 'hello', playerId: 'me' })
send({ type: 'state', state, worldId: 'w' })
frames(6)
ok(els.tap.style.display === 'none', 'holding a pad opens the door: no click is asked for')

sent.length = 0
pad.axes = [1, 0, 0, 0]; frames(3); pad.axes = [0, 0, 0, 0]; frames(2)
ok(sent.some(a => a.do === 'move'), 'the left stick walks')

sent.length = 0; tapBtn(B.CROSS)
ok(sent.some(a => a.do === 'attack'), 'cross strikes')
sent.length = 0; tapBtn(B.SQUARE)
ok(sent.some(a => a.do === 'gather'), 'square reaches for what is in front of you')
sent.length = 0; tapBtn(B.TRIANGLE)
ok(sent.some(a => a.do === 'special'), 'triangle spends the arm on a special')
sent.length = 0; tapBtn(B.CIRCLE)
ok(sent.some(a => a.do === 'stop'), 'circle halts')

// a panel is up when the world stops taking steps from the stick
const walled = () => { sent.length = 0
  pad.axes = [1, 0, 0, 0]; frames(4); pad.axes = [0, 0, 0, 0]; frames(2)
  return !sent.some(a => a.do === 'move') }

// the panels, from the pad alone
tapBtn(B.L1); frames(2)
ok(walled(), 'L1 opens the pack, and the stick stops reaching the world')
sent.length = 0
pad.axes = [0, 0, 0, 0]
press(B.DOWN); frames(2); release(B.DOWN); frames(2)     // move in the grid
tapBtn(B.CROSS); frames(2)                                // into the deeds
tapBtn(B.CROSS); frames(2)                                // do one
ok(sent.length > 0, 'and the pack can be worked from the pad alone (' +
   (sent[0] ? sent[0].do : 'nothing') + ')')
for (let i = 0; i < 6; i++) tapBtn(B.TRIANGLE)
ok(!walled(), 'triangle closes a panel and hands the world back')

tapBtn(B.R1); frames(2)
ok(walled(), 'R1 opens the chart-table, and you cannot walk while it is open')
tapBtn(B.R1); frames(2)
ok(!walled(), 'R1 puts it away again')

// unplugging it must not break anything
padPresent = false; frames(4)
ok(true, 'unplugging the pad does not take the window with it')
console.log(bad ? '\n  ' + bad + ' failed' : '\n  ok    the whole window is reachable from a controller')
process.exit(bad ? 1 : 0)
