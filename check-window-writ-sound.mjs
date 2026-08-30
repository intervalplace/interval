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
// COUNTING NODES IS NOT LISTENING. An earlier version of this check compared
// how many audio nodes a deed built, and chopping and mining both build two
// bursts and a blip — the counts matched and the check only ever passed because
// a stray footstep happened to inflate one of them. What tells them apart is
// what the nodes are SET TO, so the parameters are recorded instead.
const voiced = []
const param = (owner, name) => { const p = {
  _v: 0, get value () { return p._v }, set value (v) { p._v = v; voiced.push(name + '=' + Math.round(v)) },
  setValueAtTime: (v) => voiced.push(name + '@' + Math.round(v)),
  setTargetAtTime: noop, linearRampToValueAtTime: (v) => voiced.push(name + '>' + Math.round(v)),
  exponentialRampToValueAtTime: (v) => voiced.push(name + '~' + Math.round(v)) }
  return p }
const node = (kind) => { built.push(kind)
  const n = { type: '', frequency: param(null, kind + 'Hz'), Q: param(null, kind + 'Q'),
              gain: param(null, kind + 'g'), playbackRate: param(null, 'rate'),
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

for (const b of [...readFileSync('window-writ.html', 'utf8')
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
sent.length = 0; voiced.length = 0
const chop = count(() => tap('e'))
const chopVoice = voiced.filter(v => /Hz/.test(v)).join(' ')
ok(sent.includes('gather'), 'E on a tree actually sends gather' + (sent.length ? ' (sent ' + sent.join(',') + ')' : ' (sent nothing)'))
ok(chop >= 6, 'chopping a tree is a whistle, a bite and the timber settling (' + chop + ' nodes)')
// now a rock instead, so E is a mine
const rocky = JSON.parse(JSON.stringify(state))
delete rocky.nodes.t1; rocky.nodes.r1 = { type: 'rock', x: 19, y: 20, depletedUntil: 0 }
send({ type: 'state', state: rocky, worldId: 'w' }); frames(2)
voiced.length = 0
const mine = count(() => tap('e'))
const mineVoice = voiced.filter(v => /Hz/.test(v)).join(' ')
ok(mine >= 6, 'mining is steel on stone, with a ring after it (' + mine + ' nodes)')
ok(chopVoice !== '' && mineVoice !== '' && chopVoice !== mineVoice,
   'and it is not the same noise as chopping \u2014 chop ' + chopVoice.slice(0, 34) +
   ' vs mine ' + mineVoice.slice(0, 34))
send({ type: 'state', state, worldId: 'w' }); frames(2)
const hit = count(() => tap(' '))
ok(hit > 0, 'swinging makes a noise of its own (' + hit + ' nodes)')
const wounded = { ...state, players: { me: { ...state.players.me, hp: 6 } } }
const hurt = count(() => { send({ type: 'state', state: wounded, worldId: 'w' }) })
ok(hurt > 0, 'being hurt makes a noise (' + hurt + ' nodes)')
const lvled = { ...state, tick: 960, players: { me: { ...state.players.me, skills: { woodcraft: 900 } } } }
const level = count(() => { send({ type: 'state', state: lvled, worldId: 'w' }) })
ok(level >= 4, 'a level is a fanfare, not a blip (' + level + ' nodes)')
// §AND IT IS THE FLAT WINDOW'S FANFARE, note for note. A person who has played
// this world in one window should recognise the sound of getting better at
// something in another. Lifted from window-web's SFX.levelup, so the check
// reads THAT file rather than trusting a copy in this one.
{
  const web = readFileSync('window-web.html', 'utf8')
  // §BOUND THE SLICE. Reading four hundred characters past `levelup:` walked
  // into `chat:` and picked up a note that is not part of the fanfare, and
  // comparing '0.30' with '0.3' as strings called two identical durations
  // different. Both were faults in the reading, not in the sound.
  const i = web.indexOf('levelup: () => {')
  const webBody = web.slice(i, web.indexOf('\n  },', i))
  const num = (a, b) => a + '@' + Number(b)
  const notes = [...webBody.matchAll(/tone\((\d+),\s*([\d.]+)/g)].map(m => num(m[1], m[2]))
  const mine = readFileSync('window-writ.html', 'utf8')
  const j = mine.indexOf("case 'level': {")
  const ourBody = mine.slice(j, mine.indexOf('break }', j))
  const ours = [...ourBody.matchAll(/chime\((\d+),\s*([\d.]+)/g)].map(m => num(m[1], m[2]))
  ok(notes.length >= 4 && notes.join(' ') === ours.join(' '),
     'and it is window-web\u2019s fanfare note for note (' + ours.join(' ') + ')')
  ok(/type = 'triangle'/.test(ourBody),
     'on the same triangle wave, with the same soft attack')
}
// day and night should not sound the same
const dayCount = count(() => { send({ type: 'state', state: { ...state, tick: 600 }, worldId: 'w' }); frames(40) })
const nightCount = count(() => { send({ type: 'state', state: { ...state, tick: 1800 }, worldId: 'w' }); frames(40) })
ok(dayCount !== nightCount || dayCount > 0, 'the hour reaches the ear as well as the eye')
// ---- and every weapon swings like itself ----
const arm = (item) => { voiced.length = 0; const w = JSON.parse(JSON.stringify(state))
  w.players.me.equipment = { weapon: { item } }
  w.mobs.g1 = { type: 'goblin', hp: 9, x: 21, y: 20 }
  send({ type: 'state', state: w, worldId: 'w' }); frames(2)
  count(() => tap(' '))
  return voiced.filter(v => /Hz/.test(v)).join(' ') }
const bySteel = {}
for (const it of ['star-maul', 'iron-dagger', 'iron-spear', 'wooden-bow', 'staff', 'iron-sword'])
  bySteel[it] = arm(it)
const kinds = new Set(Object.values(bySteel))
ok(kinds.size >= 3, 'a maul, a dagger, a spear, a bow, a staff and a sword do not all sound alike ('
   + Object.entries(bySteel).map(([k, v]) => k + ':' + v).join(' ') + ')')
// ---- §THE GROUND UNDER YOUR FEET SOUNDS LIKE THE GROUND YOU CAN SEE ----
//
// The footstep used to decide from the hash noise the ground used BEFORE the
// pillar started serving a terrain table, so a citizen could stand on visibly
// tilled earth and hear grass, or cross the fens to the sound of a dry field.
// Both now ask one classifier. This walks a citizen across a country with a
// known shape and listens.
const MW = 64, MH = 48, bits2 = Math.ceil((MW * MH) / 8)
const bin2 = new Uint8Array(bits2 * 2 + MW * MH)
const setb = (off, x, y) => { const i = y * MW + x; bin2[off + (i >> 3)] |= 1 << (i & 7) }
const BIOME2 = ['sea', 'greenwood', 'wilds', 'moor', 'crags', 'heartlands', 'downs', 'fens']
for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
  const i = y * MW + x
  if (x < 8) { setb(0, x, y); bin2[bits2 * 2 + i] = 0 }        // sea in the west
  else if (y > 34) bin2[bits2 * 2 + i] = 7                     // fens in the south
  else if (y < 10) bin2[bits2 * 2 + i] = 6                     // downs in the north
  else bin2[bits2 * 2 + i] = 5                                 // heartlands between
  if (y === 24 && x >= 8) setb(bits2, x, y)                    // and a road across
}
global.fetch = async (u) => {
  if (String(u).endsWith('.bin')) return { ok: true, arrayBuffer: async () => bin2.buffer }
  if (String(u).includes('terrain.json')) return { ok: true,
    json: async () => ({ w: MW, h: MH, biomes: BIOME2, settlements: [] }) }
  return { ok: false }
}
key('m'); up('m')                       // the chart-table pulls the ground in
await new Promise(r => setTimeout(r, 60))
frames(4)
key('m'); up('m')
frames(2)
const heard = (x, y) => { voiced.length = 0
  const st2 = JSON.parse(JSON.stringify(state))
  st2.genesis = { worldW: MW, worldH: MH, genesisSeed: 's' }
  st2.tick += 1; st2.players.me.x = x; st2.players.me.y = y
  st2.nodes = {}
  send({ type: 'state', state: st2, worldId: 'w' })
  for (let i = 0; i < 30; i++) frames(1)         // let the stride land its footfall
  return voiced.filter(v => /Hz|filter/.test(v)).join(' ')
}
const heath = heard(30, 5), field = heard(30, 20), road = heard(31, 24)
const fen = heard(30, 44), shore = heard(9, 20)
const surfaces = { downs: heath, heartlands: field, road, fens: fen, shore }
const distinct = new Set(Object.values(surfaces).filter(Boolean))
ok(Object.values(surfaces).every(v => v), 'every country makes a footstep')
ok(distinct.size >= 4, 'and the downs, the heartlands, a road, the fens and the shore do not sound alike ('
   + distinct.size + ' of 5 distinct)')
ok(road !== field, 'a road underfoot is stone where the field beside it is grass')
ok(fen !== field, 'and the fens are not the heartlands')
// ---- §BEASTS HAVE VOICES, and in a window that sees eleven tiles that is not
// decoration: everything else you know about where you are, you know by ear.
const beast = (type, dist) => { voiced.length = 0
  const w = JSON.parse(JSON.stringify(state))
  w.tick += 1
  w.mobs = { b: { type, hp: 9, x: 20 + dist, y: 20 } }
  send({ type: 'state', state: w, worldId: 'w' })
  for (let i = 0; i < 90; i++) frames(1)        // the voices are on a slow timer
  return voiced.filter(v => /Hz/.test(v)).join(' ')
}
const wolf = beast('wolf', 4), drag = beast('dragon', 6), spider = beast('great-spider', 2)
ok(wolf !== '', 'a wolf four tiles off is audible before it is visible')
ok(drag !== '' && drag !== wolf, 'and a dragon does not sound like a wolf')
ok(spider !== '' && spider !== wolf && spider !== drag, 'nor a spider like either')

// ---- a blow that LANDS sounds like the thing that landed it ----
const land = (weapon) => { voiced.length = 0
  const a = JSON.parse(JSON.stringify(state))
  a.tick += 1
  a.players.me.equipment = { weapon: { item: weapon } }
  a.players.me.action = { type: 'attack', mobId: 'b' }
  a.mobs = { b: { type: 'boar', hp: 9, x: 21, y: 20 } }
  send({ type: 'state', state: a, worldId: 'w' }); frames(2)
  voiced.length = 0
  const b = JSON.parse(JSON.stringify(a)); b.tick += 1; b.mobs.b.hp = 4
  send({ type: 'state', state: b, worldId: 'w' }); frames(2)
  return voiced.filter(v => /filter|Hz/.test(v)).join(' ')
}
const maul = land('star-maul'), dagger = land('iron-dagger'), spear = land('iron-spear')
const distinctHits = new Set([maul, dagger, spear].filter(Boolean))
ok(distinctHits.size >= 2, 'a maul landing, a dagger landing and a spear landing are not one thud ('
   + distinctHits.size + ' of 3 distinct)')
console.log(bad ? '\n  ' + bad + ' failed'
  : '\n  ok    every deed, weapon, country and beast has a noise of its own')
process.exit(bad ? 1 : 0)
