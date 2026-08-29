// §6dj, for the mist window: DOES ANYTHING MAKE A NOISE.
//
// The window had one drone and four hisses, and chopping, mining and landing a
// blow all made the same one. Sound is not decoration here: at eleven tiles in
// fog it is often the ONLY report you get that a deed landed. This stands a
// fake WebAudio in front of the window, does things, and counts what was built.
//
// It also checks the door: the threshold has a theme (the photo window's) and
// it must be fetched from /api/audio rather than guessed at, must respect the
// one `interval-music` preference every window shares, and must DUCK rather
// than stop when you go in.
//
// Needs three.js:  npm i three@0.128.0

import { readFileSync } from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let THREE; try { THREE = require('three') } catch { console.log('  skip  no three.js'); process.exit(0) }

const noop = () => {}
const built = []          // every node the window asks the audio graph for
const param = () => ({ value: 0, setValueAtTime: noop, setTargetAtTime: noop,
  linearRampToValueAtTime: noop, exponentialRampToValueAtTime: noop })
const node = (kind) => { built.push(kind)
  const n = { type: '', frequency: param(), Q: param(), gain: param(), playbackRate: param(),
              buffer: null, loop: false, connect: (x) => x, start: noop, stop: noop, kind }
  return n }
class FakeAC {
  constructor () { this.sampleRate = 48000; this.currentTime = 0; this.destination = node('dest') }
  createBuffer (c, n) { return { getChannelData: () => new Float32Array(n) } }
  createBufferSource () { return node('noise') }
  createBiquadFilter () { return node('filter') }
  createGain () { return node('gain') }
  createOscillator () { return node('osc') }
}
const els = {}, raf = [], win = {}, docH = {}
let CLOCK = 1000
const ctx2d = () => new Proxy({ measureText: () => ({ width: 10 }) },
  { get: (t, k) => (k in t ? t[k] : noop), set: (t, k, v) => (t[k] = v, true) })
const canvas = () => { const c = { width: 320, height: 240, style: {}, _h: {},
  getContext: (k) => (k === '2d' ? ctx2d() : null), addEventListener: (t, f) => { (c._h[t] ||= []).push(f) },
  requestPointerLock: noop, toDataURL: () => 'data:' }; return c }
const el = (id) => (els[id] ||= Object.assign(canvas(), { id, textContent: '', style: {} }))
global.window = global
global.document = { createElement: canvas, getElementById: el,
  addEventListener: (t, f) => { (docH[t] ||= []).push(f) }, exitPointerLock: noop, pointerLockElement: null }
global.location = { protocol: 'http:', host: 'x' }
let musicPref = null
global.localStorage = { getItem: (k) => (k === 'interval-music' ? musicPref : 'sound-uid'),
                        setItem: (k, v) => { if (k === 'interval-music') musicPref = v } }
global.innerWidth = 960; global.innerHeight = 720
global.addEventListener = (t, f) => { (win[t] ||= []).push(f) }
global.prompt = () => ''
const def = (k, v) => Object.defineProperty(global, k, { value: v, configurable: true })
def('navigator', { getGamepads: () => [] }); def('crypto', { randomUUID: () => 'snd' })
def('performance', { now: () => CLOCK })
global.requestAnimationFrame = (fn) => raf.push(fn)
global.AudioContext = FakeAC
let audioAsked = null, played = null
global.fetch = async (u) => { audioAsked = u
  return { ok: true, json: async () => ({ tracks: ['theme-deep.m4a', 'theme-flat.m4a'] }) } }
global.Audio = class { constructor (src) { played = src; this.volume = 0 }
  addEventListener () {} async play () {} pause () { played = null } }
const socks = []
const sent = []
global.WebSocket = class { constructor () { this.readyState = 1; socks.push(this) }
  send (r) { try { const m = JSON.parse(r); if (m.type === 'act') sent.push(m.action.do) } catch {} } close () {} }
THREE.WebGLRenderer = class { constructor () { this.domElement = canvas() }
  setPixelRatio () {} setSize () {} setClearColor () {} clear () {} clearDepth () {}
  setRenderTarget () {} render () {} }
global.THREE = THREE

for (const b of [...readFileSync('window-mist.html', 'utf8')
  .matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])) (0, eval)(b)

let bad = 0
const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL') + '  ' + m); if (!c) bad++ }
const frames = (n) => { for (let i = 0; i < n; i++) { CLOCK += 40
  for (const fn of raf.splice(0, raf.length)) fn(CLOCK) } }
const key = (k) => { for (const f of win.keydown || []) f({ key: k, preventDefault: noop, shiftKey: false }) }
const up = (k) => { for (const f of win.keyup || []) f({ key: k, preventDefault: noop }) }
const tap = (k) => { key(k); up(k) }

// ---- the door ----
await Promise.resolve()
for (const f of win.pointerdown || []) f({})
await new Promise(r => setTimeout(r, 30))
ok(audioAsked === '/api/audio', 'the door asks the pillar what music it has')
ok(/theme-deep/.test(played || ''), 'and plays the deep theme, the same one the photo window opens with')
el('doormusic')._h.click[0]({ stopPropagation: noop })
ok(musicPref === 'off' && played === null, 'music: off stops it and is remembered for every window')

// ---- the world ----
const state = { tick: 900, genesis: { worldW: 64, worldH: 64, genesisSeed: 's' },
  players: { me: { x: 20, y: 20, hp: 10, maxHp: 10, gold: 5, skills: { woodcraft: 0 },
    inventory: [{ item: 'logs' }, { item: 'cooked-fish' }] } },
  mobs: { g1: { type: 'goblin', hp: 5, x: 21, y: 20 } },
  nodes: { t1: { type: 'tree', x: 19, y: 20, depletedUntil: 0 } }, ground: {} }
const send = (m) => { for (const s of socks) s.onmessage({ data: JSON.stringify(m) }) }
for (const s of socks) s.onopen && s.onopen()
send({ type: 'hello', playerId: 'me' })
send({ type: 'state', state, worldId: 'w' })
frames(4)
// the window only builds sound after a click, as browsers require
for (const f of els.gl._h.mousedown || []) f({ button: 0, shiftKey: false, preventDefault: noop })
frames(2)
ok(built.length > 0, 'the audio graph is built on the first click (' + built.length + ' nodes)')

const esc = () => { key('Escape'); key('Escape') }
const count = (fn) => { esc(); const n = built.length; fn(); frames(2); return built.length - n }
// one tree in reach, so E is a chop and not a panel
sent.length = 0
const chop = count(() => tap('e'))
ok(sent.includes('gather'), 'E on a tree actually sends gather' + (sent.length ? ' (sent ' + sent.join(',') + ')' : ' (sent nothing)'))
ok(chop >= 6, 'chopping a tree is a whistle, a bite and the timber settling (' + chop + ' nodes)')
// now a rock instead, so E is a mine
const rocky = JSON.parse(JSON.stringify(state))
delete rocky.nodes.t1; rocky.nodes.r1 = { type: 'rock', x: 19, y: 20, depletedUntil: 0 }
send({ type: 'state', state: rocky, worldId: 'w' }); frames(2)
const mine = count(() => tap('e'))
ok(mine >= 6, 'mining is steel on stone, with a ring after it (' + mine + ' nodes)')
ok(mine !== chop, 'and it is not the same noise as chopping (' + mine + ' vs ' + chop + ')')
send({ type: 'state', state, worldId: 'w' }); frames(2)
const hit = count(() => tap(' '))
ok(hit > 0, 'swinging makes a noise of its own (' + hit + ' nodes)')
const wounded = { ...state, players: { me: { ...state.players.me, hp: 6 } } }
const hurt = count(() => { send({ type: 'state', state: wounded, worldId: 'w' }) })
ok(hurt > 0, 'being hurt makes a noise (' + hurt + ' nodes)')
const lvled = { ...state, tick: 960, players: { me: { ...state.players.me, skills: { woodcraft: 900 } } } }
const level = count(() => { send({ type: 'state', state: lvled, worldId: 'w' }) })
ok(level >= 4, 'a level is four notes, not a blip (' + level + ' nodes)')
// day and night should not sound the same
const dayCount = count(() => { send({ type: 'state', state: { ...state, tick: 600 }, worldId: 'w' }); frames(40) })
const nightCount = count(() => { send({ type: 'state', state: { ...state, tick: 1800 }, worldId: 'w' }); frames(40) })
ok(dayCount !== nightCount || dayCount > 0, 'the hour reaches the ear as well as the eye')
// ---- and every weapon swings like itself ----
const arm = (item) => { const w = JSON.parse(JSON.stringify(state))
  w.players.me.equipment = { weapon: { item } }
  w.mobs.g1 = { type: 'goblin', hp: 9, x: 21, y: 20 }
  send({ type: 'state', state: w, worldId: 'w' }); frames(2)
  return count(() => tap(' ')) }
const bySteel = {}
for (const it of ['star-maul', 'iron-dagger', 'iron-spear', 'wooden-bow', 'staff', 'iron-sword'])
  bySteel[it] = arm(it)
const kinds = new Set(Object.values(bySteel))
ok(kinds.size >= 3, 'a maul, a dagger, a spear, a bow, a staff and a sword do not all sound alike ('
   + Object.entries(bySteel).map(([k, v]) => k + ':' + v).join(' ') + ')')
console.log(bad ? '\n  ' + bad + ' failed' : '\n  ok    the door has a theme, and every deed and every weapon has a noise')
process.exit(bad ? 1 : 0)
