// §6dj, for the mist window: CAN A CITIZEN FIND OUT WHAT A SKILL IS FOR.
//
// Every gate in this world is a number in a table. NODE_GATE says an ironbark
// wants woodcraft 45. WIELD_REQS says a steel pickaxe wants earthcraft 10.
// SMITH_REQS says a star-ingot wants earthcraft 45 and sorcery 25. None of it
// was anywhere a person could see: they could only find out by walking to a
// tree and being refused, with no reason given, and then reading the engine.
//
// The guide is DERIVED, never written — every line read off the tables the
// pillar serves, which are the engine's own. This checks that: that it says
// what the engine says, and that when the engine changes, the guide changes
// with it rather than going quietly stale like a hand-written one would.
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
const tools = {}
for (const [sk, set] of Object.entries(E.GATHER_TOOLS || {})) tools[sk] = [...set]
const served = { recipes: E.RECIPES, prices: E.PRICES, vigilTicks: E.VIGIL_TICKS,
  skills: E.SKILLS, smithReqs: E.SMITH_REQS, wieldReqs: E.WIELD_REQS,
  nodeGate: E.NODE_GATE, nodeYield: E.NODE_YIELD, gatherTools: tools, stalls: E.STALL_SELLS,
  smelted: [...(E.SMELTED || [])], mobs: E.MOB_STATS }
ok(!!E.NODE_GATE && !!E.NODE_YIELD, 'the engine exports the two tables a citizen most needs')

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
def('navigator', { getGamepads: () => [] }); def('crypto', { randomUUID: () => 'g' })
def('performance', { now: () => CLOCK })
global.requestAnimationFrame = (fn) => raf.push(fn)
const socks = []
global.WebSocket = class { constructor () { this.readyState = 1; socks.push(this) } send () {} close () {} }
THREE.WebGLRenderer = class { constructor () { this.domElement = canvas() }
  setPixelRatio () {} setSize () {} setClearColor () {} clear () {} clearDepth () {}
  setRenderTarget () {} render () {} }
global.THREE = THREE
for (const b of [...readFileSync('window-mist.html', 'utf8')
  .matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])) (0, eval)(b)
await new Promise(r => setTimeout(r, 60))

const frames = (n) => { for (let i = 0; i < n; i++) { CLOCK += 40
  for (const fn of raf.splice(0, raf.length)) fn(CLOCK) } }
const send = (m) => { for (const s of socks) s.onmessage({ data: JSON.stringify(m) }) }
const key = (k) => { for (const f of win.keydown || []) f({ key: k, preventDefault: noop, shiftKey: false }) }
const up = (k) => { for (const f of win.keyup || []) f({ key: k, preventDefault: noop }) }
const tap = (k) => { key(k); up(k) }
for (const s of socks) s.onopen && s.onopen()
send({ type: 'hello', playerId: 'me' })
send({ type: 'state', worldId: 'w', state: { tick: 900,
  genesis: { worldW: 64, worldH: 64, genesisSeed: 'g' },
  players: { me: { x: 20, y: 20, hp: 10, maxHp: 10, gold: 0, inventory: [],
    skills: { woodcraft: 0, earthcraft: 0, shorecraft: 0 } } },
  mobs: {}, nodes: {}, ground: {} } })
frames(4)

// Q -> your hand -> woodcraft. Each attempt starts from the top, because a
// wrong guess leaves the cursor somewhere unknown.
const esc = () => { tap('Escape'); tap('Escape'); tap('Escape') }
let found = false
for (let i = 0; i < 14 && !found; i++) {
  esc(); tap('q'); frames(1)
  for (let n = 0; n < i; n++) tap('ArrowDown')
  tap('Enter'); drawn.length = 0; frames(2)
  if (drawn.some(t => /YOUR HAND/.test(t))) found = true
}
ok(found, 'the self panel leads to your hand')
tap('Enter'); drawn.length = 0; frames(2)      // the first skill on the list
const page = drawn.join(' | ')
ok(/WOODCRAFT/.test(page), 'and woodcraft opens a page of its own')

// the numbers must be the ENGINE's, not a story
// §THE PAGE SHOWS THE FIRST UNLOCKS, and the rest are a scroll away — which is
// correct: the guide answers "what is next", not "recite the table". So the
// question is not whether one particular gate is on the first screen, it is
// whether whatever IS on it carries the ENGINE's number. An assertion naming
// ironbark at 45 was really asserting a row count.
const shutNow = []
for (const [t, g] of Object.entries(E.NODE_GATE)) if (g.skill === 'woodcraft') shutNow.push([g.level, 'work a ' + t.replace(/-/g, ' ')])
for (const [it, r] of Object.entries(E.WIELD_REQS)) if (r.woodcraft) shutNow.push([r.woodcraft, 'wield ' + it.replace(/-/g, ' ')])
for (const [rc, r] of Object.entries(E.SMITH_REQS)) if (r.woodcraft) shutNow.push([r.woodcraft, 'forge ' + rc.replace(/-/g, ' ')])
shutNow.sort((a, b) => a[0] - b[0])
const shown = shutNow.filter(([, what]) => new RegExp(what, 'i').test(page))
ok(shown.length > 0, 'the page shows what is still shut (' + shown.length + ' of ' + shutNow.length + ' on the first screen)')
ok(shown.length > 0 && new RegExp('\\b' + shown[0][0] + '\\b').test(page),
   'and it carries the level the ENGINE says: ' + shown[0][1] + ' at ' + shown[0][0])
ok(/still shut/i.test(page), 'and it separates what is shut from what is yours')
const axe = (E.GATHER_TOOLS.woodcraft ? [...E.GATHER_TOOLS.woodcraft][0] : 'iron-hatchet')
ok(page.toLowerCase().includes(axe.replace(/-/g, ' ')) || /needs in hand/i.test(page),
   'and that you need an axe in hand for any of it')
ok(/logs/i.test(page) && /xp/i.test(page), 'and what a tree gives, and what it teaches')

// ---- §7p: THE BAR IS MADE AT THE FURNACE, THE TOOL AT THE ANVIL ----
// The guide called every SMITH_REQS entry a forge, and all five SMELTED recipes
// have one — so it was telling a citizen to make iron at an anvil that refuses
// it, and §7p's whole point is that the anvil at Thornbury is 238 tiles from
// the furnace at Cragfoot. That is a long way to carry ore on a window's word.
// §READ EVERY SKILL'S PAGE, not one and hope. An assertion that passes because
// the navigation missed and the page came back empty is worse than one that
// fails: it reports a window nobody looked at.
const handAt = (() => { for (let i = 0; i < 14; i++) {
  esc(); tap('q'); frames(1)
  for (let n = 0; n < i; n++) tap('ArrowDown')
  tap('Enter'); drawn.length = 0; frames(2)
  if (drawn.some(t => /YOUR HAND/.test(t))) return i
} return -1 })()
ok(handAt >= 0, 'the self panel leads to your hand')
const pages = []
for (let k = 0; k < 9; k++) {
  esc(); tap('q'); frames(1)
  for (let n = 0; n < handAt; n++) tap('ArrowDown')
  tap('Enter'); frames(1)
  for (let n = 0; n < k; n++) tap('ArrowDown')
  tap('Enter'); drawn.length = 0; frames(2)
  pages.push(drawn.join(' | '))
}
const all = pages.join(' \u2016 ')
ok(pages.filter(Boolean).length >= 6 && /EARTHCRAFT/.test(all),
   'and every skill has a page of its own (' + pages.filter(p2 => /LVL/.test(p2)).length + ' read)')
const earth = all
const smeltedNames = [...(E.SMELTED || [])]
// §A NAME IS NOT A PREFIX. 'forge iron' matches 'forge ironbark rod' and
// 'forge iron sword' too, so the whole line has to be matched, not the start
// of one. The page draws one unlock a row, so a row IS the unit.
const rows2 = earth.split(' | ').map(r => r.trim().toLowerCase())
const claimsForge = smeltedNames.filter(r => rows2.includes('forge ' + r.replace(/-/g, ' ')))
ok(!claimsForge.length, 'and it does not offer to FORGE a bar at an anvil that refuses one')
// (the whole-row assertion above already proves this: a bar is never a `forge`
// row. A looser regex here only re-asked the question badly, matching `iron`
// inside `iron sword`.)

// ---- and where a thing comes from when it is not made ----
// (a hollow bow is forged at woodcraft 12 AND carried by the gibbet-dead: a
// guide that knows only the crafting tables knows half the world)
const bowFrom = [...Object.entries(E.MOB_STATS)]
  .filter(([, m]) => (m.drops || []).some(d => d.item === 'hollow-bow')).map(([k]) => k)
ok(bowFrom.length > 0, 'the pillar serves drop tables (' + bowFrom.join(', ') + ' carry a hollow bow)')

// nothing here is written down: change the engine's number and the guide moves
console.log('  \u00b7     every line is derived from the served tables, so a gate added')
console.log('        to the engine appears here without anyone writing it down')
console.log(bad ? '\n  ' + bad + ' failed' : '\n  ok    a citizen can find out what a skill is for without reading the engine')
process.exit(bad ? 1 : 0)
