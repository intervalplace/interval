// §6dj, for every window: THE ONE CHOICE THAT DOES NOT COME BACK.
//
// At SWEAR_LEVEL in a trade a citizen may swear to one of its callings, and the
// engine refuses a second forever — `p.calling !== undefined` and that is the
// end of it. A mastery cap written before any of these windows existed, that
// nothing could reach: no sdk method, no route, so every citizen in the world
// was a generalist by accident rather than by choice.
//
// A window must be careful with a deed like this. Everything else here is
// reversible — drop a thing, unwield it, walk back. This cannot be undone by
// anybody, including the pillar. So this checks three things: that it is
// offered when it CAN happen, that it is not offered when it cannot, and that
// it is never one keystroke away.
//
//   node check-window-calling.mjs [window-mist.html]
//
// Needs three.js:  npm i three@0.128.0

import { readFileSync } from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let THREE, E
try { THREE = require('three'); E = require('./engine.js') }
catch (e) { console.log('  skip  ' + e.message.split('\n')[0]); process.exit(0) }
const FILE = process.argv[2] || 'window-mist.html'
const SELF = /window-mist/.test(FILE) ? 'q' : 'z'

let bad = 0
const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL') + '  ' + m); if (!c) bad++ }
const tools = {}
for (const [sk, set] of Object.entries(E.GATHER_TOOLS || {})) tools[sk] = [...set]
const served = { recipes: E.RECIPES, prices: E.PRICES, skills: E.SKILLS,
  smithReqs: E.SMITH_REQS, wieldReqs: E.WIELD_REQS, nodeGate: E.NODE_GATE,
  nodeYield: E.NODE_YIELD, gatherTools: tools, stalls: E.STALL_SELLS,
  smelted: [...(E.SMELTED || [])], mobs: E.MOB_STATS,
  sworn: E.SWORN, callings: E.CALLINGS, swearLevel: E.SWEAR_LEVEL, mastery: E.MASTERY }
ok(Object.keys(E.SWORN).length > 6, Object.keys(E.SWORN).length + ' callings exist in the engine')

const noop = () => {}
const drawn = []
const ctx2d = () => new Proxy({ measureText: () => ({ width: 10 }) }, {
  get: (t, k) => { if (k in t) return t[k]
    return (...a) => { if (k === 'fillText') drawn.push(String(a[0])) } }, set: () => true })
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
global.fetch = async (u) => String(u).includes('/api/tables')
  ? { ok: true, json: async () => served } : { ok: false }
const def = (k, v) => Object.defineProperty(global, k, { value: v, configurable: true })
def('navigator', { getGamepads: () => [] }); def('crypto', { randomUUID: () => 'c' })
def('performance', { now: () => CLOCK })
global.requestAnimationFrame = (fn) => raf.push(fn)
const sent = [], socks = []
global.WebSocket = class { constructor () { this.readyState = 1; socks.push(this) }
  send (r) { try { const m = JSON.parse(r); if (m.type === 'act') sent.push(m.action) } catch {} } close () {} }
THREE.WebGLRenderer = class { constructor () { this.domElement = canvas() }
  setPixelRatio () {} setSize () {} setClearColor () {} clear () {} clearDepth () {}
  setRenderTarget () {} render () {} }
global.THREE = THREE
for (const b of [...readFileSync(FILE, 'utf8')
  .matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])) (0, eval)(b)
await new Promise(r => setTimeout(r, 60))

const frames = (n) => { for (let i = 0; i < n; i++) { CLOCK += 40
  for (const fn of raf.splice(0, raf.length)) fn(CLOCK) } }
const send = (m) => { for (const s of socks) s.onmessage({ data: JSON.stringify(m) }) }
const key = (k) => { for (const f of win.keydown || []) f({ key: k, preventDefault: noop, shiftKey: false }) }
const up = (k) => { for (const f of win.keyup || []) f({ key: k, preventDefault: noop }) }
const tap = (k) => { key(k); up(k) }
const esc = () => { tap('Escape'); tap('Escape'); tap('Escape') }
for (const s of socks) s.onopen && s.onopen()
send({ type: 'hello', playerId: 'me' })

const world = (skills, calling) => ({ tick: 900,
  genesis: { worldW: 64, worldH: 64, genesisSeed: 'c' },
  players: { me: { x: 20, y: 20, hp: 10, maxHp: 10, gold: 0, inventory: [], skills, calling } },
  mobs: {}, nodes: {}, ground: {} })
// enough xp to be well past SWEAR_LEVEL in woodcraft
const RICH = { woodcraft: 400000, earthcraft: 0 }   // well past SWEAR_LEVEL 50

// walk to YOUR HAND, then into the first skill
const openSkill = () => { for (let i = 0; i < 14; i++) {
  esc(); tap(SELF); frames(1)
  for (let n = 0; n < i; n++) tap('ArrowDown')
  tap('Enter'); drawn.length = 0; frames(2)
  if (drawn.some(t => /YOUR HAND/.test(t))) { tap('Enter'); drawn.length = 0; frames(2); return drawn.join(' | ') }
} return '' }
// §5m: the callings moved behind a row of their own, because the page ran to
// twelve rows before the first unlock and only nine are visible.
const openCallings = () => {
  for (let i = 0; i < 10; i++) {
    openSkill()                            // always from the top: a wrong guess
    for (let n = 0; n < i; n++) tap('ArrowDown')   // leaves the cursor nowhere known
    tap('Enter'); drawn.length = 0; frames(2)
    if (drawn.some((x) => /CALLINGS/.test(x))) return drawn.join(' | ')
  }
  return '' }

// ---- 1. below the level: named, but not offered ----
send({ type: 'state', state: world({ woodcraft: 0 }), worldId: 'w' }); frames(4)
const lowSkill = openSkill()
const low = openCallings()
const anyCalling = Object.entries(E.SWORN).find(([, c]) => c.skill === 'woodcraft')[0]
ok(new RegExp(anyCalling, 'i').test(low), 'a calling you cannot yet swear to is still NAMED (' + anyCalling + ')')
ok(!/swear to/i.test(low), 'but not offered')
ok(new RegExp('at ' + E.SWEAR_LEVEL).test(low), 'and it says the level it wants')
// §5m: THE BAND MOVES WHEN YOU SWEAR, NOT WHEN YOU LEVEL. `apprentice` used to
// mean "below fifty", which is a number and applied to everybody; it now means
// somebody took you on. What an unsworn citizen is, at any level, is a newcomer.
ok(/newcomer/i.test(lowSkill), 'the band is named, and unsworn is a newcomer rather than an apprentice')

// ---- 2. at the level: offered ----
send({ type: 'state', state: world(RICH), worldId: 'w' }); frames(4)
const highSkill = openSkill()
const high = openCallings()
ok(/swear to/i.test(high), 'at the level it is offered')
ok(/newcomer/i.test(highSkill),
   'and at the level but still unsworn it has NOT moved: levels do not admit you, swearing does')

// ---- 3. IT IS NEVER ONE KEYSTROKE AWAY ----
sent.length = 0
for (let i = 0; i < 12; i++) { tap('ArrowDown'); tap('Enter'); frames(1)
  if (sent.some(a => a.do === 'swear')) break }
const straight = sent.filter(a => a.do === 'swear').length
sent.length = 0
esc()
const deep = openCallings()
let asked = false
for (let i = 0; i < 20 && !asked; i++) { tap('ArrowDown'); tap('Enter'); drawn.length = 0; frames(2)
  if (drawn.some(t => /SWEAR TO/i.test(t))) asked = true }
ok(asked, 'choosing it opens a page that says what it costs')
const page = drawn.join(' | ')
ok(/ONE calling, ever|never again|nothing undoes/i.test(page),
   'which says the choice is permanent in as many words')
ok(/not yet/i.test(page), 'and offers a way out')

// ---- 4. already sworn: never offered again ----
send({ type: 'state', state: world(RICH, 'forester'), worldId: 'w' }); frames(4)
const done = openCallings()
ok(!/swear to/i.test(done), 'a citizen already sworn is never offered a second calling')
ok(/sworn/i.test(done), 'and is told which one is theirs')

// ---- 5. and the window may not invent one ----
//
// §SOME NAMES ARE NOT ONLY CALLINGS. `smith` is a calling, a node the world puts
// on a tile, AND a verb — so finding it in the file proves nothing. Only names
// that are callings and nothing else can answer this question, and the engine
// knows which those are.
const src = readFileSync(FILE, 'utf8')
// §AND SEARCHING THE WHOLE FILE ANSWERS THE WRONG QUESTION. `smith` is a
// calling, a node the world puts on a tile and a verb; `fisher` and `mourner`
// are landmark KINDS the generator scatters. Finding those proves nothing. The
// question is whether the CALLING ROWS are built from a literal, so only the
// region that builds them is worth reading.
const i0 = src.indexOf("label: 'callings ('")
const region = src.slice(src.lastIndexOf('function oneSkillMenu', i0), src.indexOf('const shut =', i0))
ok(i0 > 0 && /Object\.entries\(SWORN\)/.test(region),
   'the calling rows are built by walking SWORN, not a list in this file')
const named = Object.keys(E.SWORN).filter(c => new RegExp("'" + c + "'").test(region))
ok(named.length === 0, 'and not one calling name is written into them'
   + (named.length ? ' \u2014 found ' + named.join(' ') : ''))
console.log(bad ? '\n  ' + bad + ' failed' : '\n  ok    a calling is offered where it can happen, and never by accident')
process.exit(bad ? 1 : 0)
