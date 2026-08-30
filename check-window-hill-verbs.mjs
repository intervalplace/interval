// §6dj, for the mist window: CAN YOU ACTUALLY DO EVERYTHING FROM IN THERE.
//
// A 3D window can look right and still be a cage: if the only verbs reachable
// are the ones the builder remembered, the window is a lie about the world it
// claims to show. serve.mjs accepts thirty-two deeds. This walks the window's
// own menus with synthetic keystrokes — the same keys a citizen presses — and
// records what actually goes out on the socket, then checks the two lists
// against each other.
//
// It does not check that the deeds are LEGAL. The pillar decides that, and
// refusing is its job. It checks that a citizen standing at a bank can find
// the verb 'deposit' without being told it exists.
//
// Needs three.js, as check-window-mist.mjs does:  npm i three@0.128.0

import { readFileSync } from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let THREE
try { THREE = require('three') } catch {
  console.log('  skip  three.js is not installed here (npm i three@0.128.0)')
  process.exit(0)
}

// WHAT THE PILLAR TAKES, READ OUT OF THE PILLAR. This was a hand-typed list of
// thirty-two and it went stale the moment the ladder grew: the check began
// reporting correctly-routed verbs as invented ones. A list of what another
// file accepts, kept by hand in this file, is a copy, and copies drift.
const LADDER = [...readFileSync('serve.mjs', 'utf8')
  .matchAll(/a\.do === '([a-z_]+)'/g)].map((m) => m[1])
const ACCEPTS = new Set(LADDER)

// The CORE: the deeds a citizen cannot play without, which this window must
// reach or it is not a window you can live in. The rest of the ladder is
// reported below but not required — some of it needs a state this check cannot
// stage (a span half-built, a furnace lit, a goo-staff in hand).
const VERBS = ['attend', 'spawn', 'move', 'gather', 'attack', 'cook', 'eat', 'smith', 'wield',
  'unwield', 'buy', 'drop', 'pickup', 'light', 'bury', 'plant', 'harvest', 'sell',
  'invoke', 'cast', 'fletch', 'unequip', 'deposit', 'withdraw', 'offer_trade', 'accept_trade',
  'cancel_trade', 'chat', 'attackp', 'name', 'stop', 'special', 'survey', 'drink', 'offer',
  'alch', 'grind', 'brew', 'collect', 'kindle', 'stoke', 'consign', 'deliver', 'release', 'pay']

// ---------- a browser, more or less ----------
const noop = () => {}
const ctx2d = () => new Proxy({ measureText: () => ({ width: 10 }) },
  { get: (t, k) => (k in t ? t[k] : noop), set: (t, k, v) => (t[k] = v, true) })
const canvas = () => { const c = { width: 320, height: 240, style: {}, _h: {},
  getContext: (k) => (k === '2d' ? ctx2d() : null),
  addEventListener: (t, f) => { (c._h[t] ||= []).push(f) },
  requestPointerLock: noop, toDataURL: () => 'data:' }; return c }
const els = {}, raf = [], win = {}
let CLOCK = 1000
global.window = global
global.document = { createElement: canvas, getElementById: (id) => (els[id] ||= canvas()),
                    addEventListener: noop, exitPointerLock: noop, pointerLockElement: null }
global.location = { protocol: 'http:', host: 'x' }
global.localStorage = { getItem: () => 'verbs-uid', setItem: noop }
global.innerWidth = 960; global.innerHeight = 720
global.addEventListener = (t, f) => { (win[t] ||= []).push(f) }
global.prompt = () => 'tester'
global.AudioContext = undefined
const def = (k, v) => Object.defineProperty(global, k, { value: v, configurable: true })
def('navigator', { getGamepads: () => [] })
def('crypto', { randomUUID: () => 'verbs-uid' })
def('performance', { now: () => CLOCK })
global.requestAnimationFrame = (fn) => raf.push(fn)

const sent = []
const socks = []
global.WebSocket = class {
  constructor () { this.readyState = 1; socks.push(this) }
  send (raw) { try { const m = JSON.parse(raw); if (m.type === 'act') sent.push(m.action) } catch {} }
  close () {}
}
THREE.WebGLRenderer = class {
  constructor () { this.domElement = canvas(); this.autoClear = true }
  setPixelRatio () {} setSize () {} setClearColor () {} clear () {} clearDepth () {}
  setRenderTarget () {} render () {}
}
global.THREE = THREE

const html = readFileSync('window-hill.html', 'utf8')
for (const b of [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])) (0, eval)(b)

// ---------- a world with something to do in every direction ----------
const me = {
  x: 40, y: 40, hp: 6, maxHp: 10, gold: 250, name: '',
  // a star-maul, because the special is only offered by a weapon that HAS one
  equipment: { weapon: { item: 'star-maul' }, head: { item: 'iron-helm' }, body: null },
  bank: { logs: 12, bones: 4 },
  trade: { to: 'pal', giveSlot: 0, wantGold: 5 },
  inventory: [{ item: 'logs', qty: 3 }, { item: 'bones' }, { item: 'seeds' }, { item: 'raw-fish' },
              { item: 'cooked-fish' }, { item: 'iron-sword' }, { item: 'feathers' },
              { item: 'magic-stone' }, { item: 'sigil' }, { item: 'iron-ore', qty: 9 }, { item: 'iron', qty: 4 }]
}
const state = {
  tick: 900, genesis: { worldW: 128, worldH: 128, genesisSeed: 'verb-seed' },
  players: { me, pal: { x: 41, y: 40, hp: 9, maxHp: 10, name: 'bram', inventory: [{ item: 'rope' }],
                        trade: { to: 'me', giveSlot: 0, wantGold: 3 } } },
  mobs: { m1: { type: 'goblin', hp: 4, x: 39, y: 40 } },
  // everything a citizen could be standing beside, all at once. Contrived, but
  // the point is to reach every deed, and every one of these is gated on place.
  nodes: { n1: { type: 'tree', x: 40, y: 39 }, n2: { type: 'bank', x: 41, y: 41 },
           n3: { type: 'stall', kind: 'arms', x: 39, y: 41 }, n4: { type: 'anvil', x: 39, y: 39 },
           n5: { type: 'waystone', x: 41, y: 39 }, n6: { type: 'plot', x: 40, y: 41 },
           n7: { type: 'campfire', x: 40, y: 40 }, n8: { type: 'looking-glass', x: 41, y: 41 },
           n9: { type: 'well', x: 39, y: 40 }, n10: { type: 'mill', x: 41, y: 40 },
           n11: { type: 'ossuary', x: 40, y: 41 }, n12: { type: 'brewpot', x: 39, y: 39 },
           n13: { type: 'furnace', x: 41, y: 41 }, n14: { type: 'watchfire', x: 39, y: 41 },
           n15: { type: 'smokerack', x: 40, y: 39 }, n16: { type: 'ferry', x: 41, y: 39 },
           n17: { type: 'rampart', x: 39, y: 40 } },
  markers: [{ x: 40, y: 40 }],          // §survey: you stand ON one, not beside it
  ground: { g1: { item: 'bones', x: 40, y: 40 } }
}
const frames = (n) => { for (let i = 0; i < n; i++) { CLOCK += 40
  for (const fn of raf.splice(0, raf.length)) fn(CLOCK) } }
frames(2)
for (const s of socks) s.onopen && s.onopen()
for (const s of socks) s.onmessage({ data: JSON.stringify({ type: 'hello', playerId: 'me' }) })
for (const s of socks) s.onmessage({ data: JSON.stringify({ type: 'state', state, worldId: 'verbtest01' }) })
frames(4)

// ---------- press keys, the way a citizen would ----------
const key = (k) => { for (const f of win.keydown || []) f({ key: k, preventDefault: noop, shiftKey: false }) }
const up = (k) => { for (const f of win.keyup || []) f({ key: k, preventDefault: noop }) }
const tap = (k) => { key(k); up(k) }
const esc = () => { key('Escape'); key('Escape'); key('Escape') }

// the plain keys first
for (const k of ['w', 'a', 's', 'd', 'x', 'n', 'c', ' ']) { tap(k); esc() }
document.pointerLockElement = els.gl
for (const f of els.gl._h.mousedown || []) { f({ button: 0, shiftKey: false, preventDefault: noop })
                                             f({ button: 2, shiftKey: false, preventDefault: noop }) }
// speaking
key('t'); for (const c of 'hello the fog') key(c); key('Enter')
// then walk every panel to the bottom: open it, step down, press enter, and
// do the same again inside whatever that opened. Three deep reaches the offer.
const down = (n) => { for (let i = 0; i < n; i++) key('ArrowDown') }
const WIDTH = [20, 10, 6]
function explore (open, path) {
  const w = WIDTH[path.length] ?? 0
  for (let i = 0; i < w; i++) {
    esc(); open()
    for (const step of path) { down(step); key('Enter') }
    down(i)
    key('ArrowRight')                               // nudge anything adjustable
    key('Enter')
    if (path.length + 1 < WIDTH.length) explore(open, [...path, i])
  }
  esc()
}
// the pack is a grid: step across it with Right, then Enter into the deeds
for (let i = 0; i < 12; i++) {
  esc(); tap('Tab')
  for (let n = 0; n < i; n++) key('ArrowRight')
  key('Enter')
  for (let j = 0; j < 12; j++) {
    for (let n = 0; n < j; n++) key('ArrowDown')
    key('Enter')
    esc(); tap('Tab')
    for (let n = 0; n < i; n++) key('ArrowRight')
    key('Enter')
    // one level deeper, for the offer panel
    for (let n = 0; n < j; n++) key('ArrowDown')
    key('Enter'); key('ArrowRight'); key('Enter')
    esc(); tap('Tab')
    for (let n = 0; n < i; n++) key('ArrowRight')
    key('Enter')
  }
  esc()
}
explore(() => tap('z'), [])        // yourself
explore(() => tap('r'), [])        // trade -> give what -> offer
explore(() => tap('e'), [])        // within reach -> bank / counter / anvil / waystone

// and again with a consignment on your back, because a road you are already
// walking offers different deeds from a road you are not
esc()
me.consignment = { items: [{ item: 'wool' }], leg: 1, route: ['n3'] }
for (const s of socks) s.onmessage({ data: JSON.stringify({ type: 'state', state, worldId: 'verbtest01' }) })
frames(2)
explore(() => tap('e'), [])
delete me.consignment
for (const s of socks) s.onmessage({ data: JSON.stringify({ type: 'state', state, worldId: 'verbtest01' }) })
frames(2)

// and again as a soul who is NOT IN THE WORLD, because that — not death — is
// what `spawn` is for. §6c stands a dead citizen up without being asked, so a
// window that offers a corpse a `wake` is offering a deed the world refuses.
esc()
const absent = JSON.parse(JSON.stringify(state))
delete absent.players.me
absent.attend = [[absent.tick - 400, 'me'.slice(0, 16)]]     // knocked, and long ripe
for (const s of socks) s.onmessage({ data: JSON.stringify({ type: 'state', state: absent, worldId: 'verbtest01' }) })
frames(2)
explore(() => tap('z'), [])
tap('e'); tap(' ')
for (const s of socks) s.onmessage({ data: JSON.stringify({ type: 'state', state, worldId: 'verbtest01' }) })
frames(2)

const reach = sent.slice()
// ---------- and now the other half: a field with nothing in it ----------
//
// A window that offers 'deposit' beside a fish in the middle of a wood is
// showing a possibility the world does not contain. Stand the same citizen in
// an empty field with the same pack and walk every panel again: the deeds that
// need a PLACE must be absent, not greyed.
esc()
sent.length = 0
state.nodes = { far: { type: 'tree', x: 20, y: 20 } }
state.ground = {}
delete state.players.pal
delete me.trade
me.x = 40; me.y = 40
for (const s of socks) s.onmessage({ data: JSON.stringify({ type: 'state', state, worldId: 'verbtest01' }) })
frames(4)
for (let i = 0; i < 12; i++) {
  esc(); tap('Tab')
  for (let n = 0; n < i; n++) key('ArrowRight')
  key('Enter')
  for (let j = 0; j < 12; j++) {
    for (let n = 0; n < j; n++) key('ArrowDown')
    key('Enter')
    esc(); tap('Tab')
    for (let n = 0; n < i; n++) key('ArrowRight')
    key('Enter')
  }
}
esc(); explore(() => tap('z'), []); esc(); explore(() => tap('e'), []); esc(); explore(() => tap('r'), [])
const PLACED = { deposit: 'a bank', withdraw: 'a bank', sell: 'a counter', buy: 'a counter',
                 smith: 'an anvil', cook: 'a fire', plant: 'tilled ground',
                 offer_trade: 'a neighbour', recall: 'a waystone' }
console.log('\n  in an empty field, ' + sent.length + ' deeds were still offered\n')
let leaked = 0
for (const [v, needs] of Object.entries(PLACED)) {
  const n = sent.filter(a => a.do === v).length
  console.log((n ? '  FAIL' : '  ok  ') + '  ' + v.padEnd(14) +
              (n ? 'offered ' + n + '\u00d7 with no ' + needs + ' in reach' : 'absent without ' + needs))
  if (n) leaked++
}
sent.length = 0

// ---------- what came out of it ----------
const seen = new Set(reach.map(a => a.do))
let bad = 0
console.log('  ' + reach.length + ' deeds went out over the socket\n')
for (const v of VERBS) {
  const n = reach.filter(a => a.do === v).length
  console.log((n ? '  ok  ' : '  FAIL') + '  ' + v.padEnd(14) + (n ? n + '\u00d7' : 'NOT REACHABLE'))
  if (!n) bad++
}
// a verb the LADDER does not carry is a verb that cannot happen: sending one
// is the same fault as offering `deposit` in a wood
const invented = [...seen].filter((v) => !ACCEPTS.has(v))
if (invented.length) { console.log('\n  FAIL  the window sends deeds the pillar does not take: ' + invented.join(', ')); bad++ }
else console.log('\n  ok    every deed it sends is one the pillar carries (' + ACCEPTS.size + ' in the ladder)')
const unused = [...ACCEPTS].filter((v) => !seen.has(v)).sort()
if (unused.length) console.log('  \u00b7     ' + unused.length + ' words the ladder carries that this window does not send:\n        ' + unused.join(' '))
bad += leaked
console.log(bad ? '\n  ' + bad + ' failed' : '\n  ok    all ' + VERBS.length + ' core verbs reachable, and none offered where they cannot happen')
process.exit(bad ? 1 : 0)
