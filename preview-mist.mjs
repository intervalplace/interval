// preview-mist.mjs — look at the mist window without a browser.
//
// This loads window-mist.html for real (real three.js, real geometry, real
// materials, real textures) and then rasterises the scene IN SOFTWARE using
// exactly the arithmetic the window's own shaders use: the same vertex snap,
// the same affine UV trick, the same per-vertex fog, the same 4x4 dither and
// 5:5:5 truncation. It is not an impression of the window. It is the window's
// pipeline, run on a CPU, so the artifacts that come out are the real ones.
//
//   node preview-mist.mjs out.png [tick] [yaw]

import fs from 'fs'
import zlib from 'zlib'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let THREE
try { THREE = require('three') } catch {
  console.error('preview-mist needs three.js, which the node does not depend on:\n  npm i three@0.128.0')
  process.exit(2)
}

// ============================ a canvas, in software ==========================
function parseColor (s) {
  if (typeof s !== 'string') return [255, 0, 255, 255]
  if (s[0] === '#') {
    if (s.length === 4) return [parseInt(s[1] + s[1], 16), parseInt(s[2] + s[2], 16), parseInt(s[3] + s[3], 16), 255]
    return [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16), 255]
  }
  const m = s.match(/rgba?\(([^)]+)\)/)
  if (m) { const p = m[1].split(',').map(Number); return [p[0] | 0, p[1] | 0, p[2] | 0, Math.round((p[3] ?? 1) * 255)] }
  return [255, 0, 255, 255]
}
// a 5x7 bitmap face, because the preview needs letters and has no font engine
const FONT = {}
;(() => {
  const rows = {
    A: '01110|10001|10001|11111|10001|10001|10001', B: '11110|10001|11110|10001|10001|10001|11110',
    C: '01111|10000|10000|10000|10000|10000|01111', D: '11110|10001|10001|10001|10001|10001|11110',
    E: '11111|10000|11110|10000|10000|10000|11111', F: '11111|10000|11110|10000|10000|10000|10000',
    G: '01111|10000|10000|10111|10001|10001|01111', H: '10001|10001|11111|10001|10001|10001|10001',
    I: '11111|00100|00100|00100|00100|00100|11111', J: '00111|00010|00010|00010|00010|10010|01100',
    K: '10001|10010|11100|10100|10010|10010|10001', L: '10000|10000|10000|10000|10000|10000|11111',
    M: '10001|11011|10101|10101|10001|10001|10001', N: '10001|11001|10101|10011|10001|10001|10001',
    O: '01110|10001|10001|10001|10001|10001|01110', P: '11110|10001|10001|11110|10000|10000|10000',
    Q: '01110|10001|10001|10001|10101|10010|01101', R: '11110|10001|10001|11110|10100|10010|10001',
    S: '01111|10000|10000|01110|00001|00001|11110', T: '11111|00100|00100|00100|00100|00100|00100',
    U: '10001|10001|10001|10001|10001|10001|01110', V: '10001|10001|10001|10001|10001|01010|00100',
    W: '10001|10001|10001|10101|10101|11011|10001', X: '10001|10001|01010|00100|01010|10001|10001',
    Y: '10001|10001|01010|00100|00100|00100|00100', Z: '11111|00001|00010|00100|01000|10000|11111',
    0: '01110|10001|10011|10101|11001|10001|01110', 1: '00100|01100|00100|00100|00100|00100|01110',
    2: '01110|10001|00001|00110|01000|10000|11111', 3: '11111|00010|00100|00010|00001|10001|01110',
    4: '00010|00110|01010|10010|11111|00010|00010', 5: '11111|10000|11110|00001|00001|10001|01110',
    6: '00110|01000|10000|11110|10001|10001|01110', 7: '11111|00001|00010|00100|01000|01000|01000',
    8: '01110|10001|10001|01110|10001|10001|01110', 9: '01110|10001|10001|01111|00001|00010|01100',
    '-': '00000|00000|00000|11111|00000|00000|00000', '.': '00000|00000|00000|00000|00000|01100|01100',
    ',': '00000|00000|00000|00000|01100|01100|11000', ':': '00000|01100|01100|00000|01100|01100|00000',
    '[': '01110|01000|01000|01000|01000|01000|01110', ']': '01110|00010|00010|00010|00010|00010|01110',
    '(': '00110|01000|01000|01000|01000|01000|00110', ')': '01100|00010|00010|00010|00010|00010|01100',
    '+': '00000|00100|00100|11111|00100|00100|00000', '/': '00001|00010|00010|00100|01000|01000|10000',
    '\u00b7': '00000|00000|00000|01100|01100|00000|00000', '\u2026': '00000|00000|00000|00000|00000|10101|00000',
    '\u2191': '00100|01110|10101|00100|00100|00100|00100', '\u2193': '00100|00100|00100|00100|10101|01110|00100',
    '\u25b8': '01000|01100|01110|01111|01110|01100|01000', '\u2019': '01100|01100|11000|00000|00000|00000|00000',
    "'": '01100|01100|11000|00000|00000|00000|00000', '!': '00100|00100|00100|00100|00100|00000|00100',
    '?': '01110|10001|00010|00100|00100|00000|00100', '"': '01010|01010|00000|00000|00000|00000|00000'
  }
  for (const k in rows) FONT[k] = rows[k].split('|')
})()
class Ctx {
  constructor (cv) { this.cv = cv; this.fillStyle = '#000'; this.strokeStyle = '#000'
    this.globalAlpha = 1; this.lineWidth = 1; this.font = ''; this.textAlign = 'left'
    this.textBaseline = 'alphabetic'; this.imageSmoothingEnabled = false
    this.tx = 0; this.ty = 0; this.clipR = null; this.stack = [] }
  save () { this.stack.push([this.tx, this.ty, this.clipR, this.fillStyle, this.globalAlpha]) }
  restore () { const s = this.stack.pop(); if (s) [this.tx, this.ty, this.clipR, this.fillStyle, this.globalAlpha] = s }
  translate (x, y) { this.tx += x; this.ty += y }
  beginPath () { this.path = null }
  rect (x, y, w, h) { this.path = [x + this.tx, y + this.ty, w, h] }
  clip () { this.clipR = this.path }
  measureText (t) { return { width: t.length * 6 } }
  blend (x, y, c, a) {
    const cv = this.cv
    if (x < 0 || y < 0 || x >= cv.width || y >= cv.height) return
    if (this.clipR) { const [cx, cy, cw, ch] = this.clipR; if (x < cx || y < cy || x >= cx + cw || y >= cy + ch) return }
    const i = (y * cv.width + x) * 4, d = cv.data
    if (a >= 1) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; return }
    const na = a + (d[i + 3] / 255) * (1 - a)
    d[i] = c[0] * a + d[i] * (1 - a); d[i + 1] = c[1] * a + d[i + 1] * (1 - a)
    d[i + 2] = c[2] * a + d[i + 2] * (1 - a); d[i + 3] = na * 255
  }
  fillRect (x, y, w, h) {
    const c = parseColor(this.fillStyle), a = (c[3] / 255) * this.globalAlpha
    x = Math.round(x + this.tx); y = Math.round(y + this.ty); w = Math.round(w); h = Math.round(h)
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.blend(x + i, y + j, c, a)
  }
  strokeRect (x, y, w, h) { const f = this.fillStyle; this.fillStyle = this.strokeStyle
    this.fillRect(x, y, w, 1); this.fillRect(x, y + h - 1, w, 1)
    this.fillRect(x, y, 1, h); this.fillRect(x + w - 1, y, 1, h); this.fillStyle = f }
  clearRect (x, y, w, h) { const cv = this.cv
    x = Math.round(x + this.tx); y = Math.round(y + this.ty)
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const px = x + i, py = y + j
      if (px < 0 || py < 0 || px >= cv.width || py >= cv.height) continue
      const k = (py * cv.width + px) * 4; cv.data[k] = cv.data[k + 1] = cv.data[k + 2] = cv.data[k + 3] = 0 } }
  fillText (t, x, y) {
    t = String(t).toUpperCase()
    const w = t.length * 6
    let sx = x + this.tx
    if (this.textAlign === 'right') sx -= w
    else if (this.textAlign === 'center') sx -= w / 2
    const top = this.textBaseline === 'top' ? y + this.ty : y + this.ty - 7
    const c = parseColor(this.fillStyle), a = (c[3] / 255) * this.globalAlpha
    for (let n = 0; n < t.length; n++) {
      const g = FONT[t[n]]; if (!g) continue
      for (let r = 0; r < 7; r++) for (let q = 0; q < 5; q++)
        if (g[r][q] === '1') this.blend(Math.round(sx + n * 6 + q), Math.round(top + r), c, a)
    }
  }
}
function makeCanvas (w = 300, h = 150) {
  const cv = { width: w, height: h, style: {}, addEventListener: () => {}, requestPointerLock: () => {},
               toDataURL: () => 'data:' }
  let ctx = null
  Object.defineProperty(cv, 'data', { get () { if (!cv._d || cv._d.length !== cv.width * cv.height * 4)
    cv._d = new Uint8ClampedArray(cv.width * cv.height * 4); return cv._d }, configurable: true })
  cv.getContext = (k) => { if (k !== '2d') return null; if (!ctx) { ctx = new Ctx(cv) } return ctx }
  return cv
}

// ============================ the browser it expects =========================
const els = {}, raf = [], docHandlers = {}, winHandlers = {}
let CLOCK = 1000
global.window = global
global.document = {
  createElement: () => makeCanvas(),
  getElementById: (id) => (els[id] ||= makeCanvas()),
  addEventListener: (t, f) => { (docHandlers[t] ||= []).push(f) },
  exitPointerLock: () => {}, pointerLockElement: null
}
global.location = { protocol: 'http:', host: 'x',
  search: (process.env.FAR ? '?far=' + process.env.FAR : '?x=1') +
          (process.env.ERA ? '&era=' + process.env.ERA : '') }
global.localStorage = { getItem: () => 'preview', setItem: () => {} }
global.innerWidth = 960; global.innerHeight = 720           // a 4:3 320x240 frame
global.addEventListener = (t, f) => { (winHandlers[t] ||= []).push(f) }
global.prompt = () => ''
global.AudioContext = undefined
const def = (k, v) => Object.defineProperty(global, k, { value: v, configurable: true })
def('navigator', { getGamepads: () => [] })
def('crypto', { randomUUID: () => 'preview' })
def('performance', { now: () => CLOCK })
global.requestAnimationFrame = (fn) => raf.push(fn)
const socks = []
global.WebSocket = class { constructor () { this.readyState = 1; socks.push(this) } send () {} close () {} }

const seen = {}
THREE.WebGLRenderer = class {
  constructor () { this.domElement = makeCanvas(); this.autoClear = true }
  setPixelRatio () {} setSize () {} setClearColor (c) { seen.clear = c.clone() }
  clear () {} clearDepth () {} setRenderTarget () {}
  render (scene, cam) {
    // THE REAL RENDERER UPDATES THESE BEFORE IT DRAWS, and the HUD projects
    // hitsplats through them AFTER the render returns. A stub that skips it
    // leaves the camera matrices at identity, every number in the world lands
    // eight hundred units away and off the far plane, and the picture quietly
    // loses the thing it was taken to show.
    scene.updateMatrixWorld(true)
    if (cam) { cam.updateMatrixWorld(true)
               cam.matrixWorldInverse.copy(cam.matrixWorld).invert() }
    if (scene.children.length > 3) { seen.scene = scene; seen.cam = cam }
    else if (cam && cam.isPerspectiveCamera) { seen.vmScene = scene; seen.vmCam = cam }
  }
}
global.THREE = THREE

// the chart-table asks the pillar for the ground; hand it a real one
if (process.env.MAPDATA) {
  const md = JSON.parse(fs.readFileSync(process.env.MAPDATA, 'utf8'))
  const MW = md.w, MH = md.h, bits = Math.ceil((MW * MH) / 8)
  const bin = Buffer.from(md.bin, 'base64')
  global.fetch = async (u) => {
    if (String(u).endsWith('.bin')) return { ok: true, arrayBuffer: async () =>
      bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.length) }
    if (String(u).includes('terrain.json')) return { ok: true, json: async () => md.meta }
    if (String(u).includes('/api/tables') && process.env.TABLES)
      return { ok: true, json: async () => JSON.parse(fs.readFileSync(process.env.TABLES, 'utf8')) }
    return { ok: false }
  }
}


const html = fs.readFileSync(process.argv[5] || 'window-mist.html', 'utf8')
for (const b of [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])) (0, eval)(b)

// a real slice of a real world, if one has been saved beside us
const SLICE = process.env.SLICE ? JSON.parse(fs.readFileSync(process.env.SLICE, 'utf8')) : null
// stand where you are told, and look where you are told
const AT = process.env.AT ? process.env.AT.split(',').map(Number) : null
const PITCH = process.env.PITCH ? +process.env.PITCH : -0.06
const SCALE_OUT = +(process.env.SCALE || 3)

// ============================ point it somewhere =============================
const TICK = +(process.argv[3] ?? 700)
const YAW = +(process.argv[4] ?? 0.6)
const state = {
  tick: TICK, genesis: { worldW: 128, worldH: 128, genesisSeed: 'interval-preview' },
  players: { me: { x: 40, y: 40, hp: 7, maxHp: 10, gold: 128, name: 'ada',
                   inventory: [{ item: 'iron-hatchet' }, { item: 'logs' }, { item: 'cooked-fish' }] },
             pal: { x: 43, y: 37, hp: 9, maxHp: 10, name: 'bram', inventory: [] } },
  mobs: { m1: { type: 'goblin', hp: 4, x: 37, y: 37 }, m2: { type: 'wolf', hp: 8, x: 44, y: 34 },
          m3: { type: 'dragon', hp: 400, x: 42, y: 34 } },
  nodes: {}, ground: { g1: { item: 'bones', x: 41, y: 39 } }
}
// a stand of trees, a fire, a hut, a waystone: a country worth looking into
let ni = 0
const N = (type, x, y) => { state.nodes['n' + ni++] = { type, x, y } }
for (let i = 0; i < 46; i++) {
  const a = i * 2.39, r = 3 + (i % 9)
  const x = 40 + Math.round(Math.cos(a) * r), y = 40 + Math.round(Math.sin(a) * r * 0.9) - 4
  if (Math.abs(x - 40) < 2 && Math.abs(y - 40) < 2) continue
  N(i % 11 === 0 ? 'elder-tree' : i % 7 === 0 ? 'rock' : 'tree', x, y)
}
N('campfire', 41, 36); N('house', 37, 33); N('waystone', 42, 38); N('signpost', 39, 38)
N('well', 44, 36); N('fishing-spot', 36, 38); N('fishing-spot', 35, 37); N('vault', 44, 31)

const LINEUP = (process.env.BESTIARY || '').split(',').filter(Boolean)
if (LINEUP.length) {
  state.nodes = {}; state.ground = {}; state.mobs = {}
  delete state.players.pal
  let i = 0
  for (let a = 0; a < 90; a++) {           // a thin wood behind them, for scale
    const x = 40 + Math.round(Math.cos(a * 2.39) * (4 + a % 9))
    const y = 40 + Math.round(Math.sin(a * 2.39) * (4 + a % 9)) - 5
    if (y > 33) continue
    state.nodes['t' + a] = { type: a % 9 === 0 ? 'elder-tree' : 'tree', x, y }
  }
  for (const t of LINEUP) {
    state.mobs['b' + i] = { type: t, hp: 50, x: 41 + (i - Math.floor((LINEUP.length - 1) / 2)) * 2, y: +(process.env.DIST || 34) }
    state.players.me.inventory = []            // no axe in the way of the rank
    i++
  }
}
if (SLICE) {
  // stand in the middle of what the pillar actually generated, and show that
  // §the hour is the SHUTTER's, not the slice's: a dump carries whatever tick
  // it was taken at, and overriding the argument here made every night render
  // come out at the world's real hour instead of the one that was asked for
  state.genesis = SLICE.genesis
  state.nodes = SLICE.nodes
  state.mobs = SLICE.mobs
  state.ground = SLICE.ground
  const at = AT || [SLICE.at.x, SLICE.at.y]
  state.players = { me: { x: at[0], y: at[1], hp: 8, maxHp: 10, gold: 0, name: 'ada',
                          inventory: process.env.NOHUD ? [] : [{ item: 'iron-hatchet' }], skills: {} } }
}
for (const s of socks) s.onopen && s.onopen()
const send = (m) => { for (const s of socks) s.onmessage({ data: JSON.stringify(m) }) }
send({ type: 'hello', playerId: 'me' })
send({ type: 'state', state, worldId: 'a1b2c3d4e5' })
global.document.pointerLockElement = els.gl
for (const f of docHandlers.mousemove || []) f({ movementX: -YAW / 0.0032, movementY: PITCH / 0.0028 })
// the ground is fetched, so it arrives on a microtask, not in the same breath.
// The window rebuilds itself when it lands; this shutter has to wait for it.
await new Promise((r) => setTimeout(r, 80))
for (let i = 0; i < 60; i++) { CLOCK = 1000 + i * 40; for (const fn of raf.splice(0, raf.length)) fn(CLOCK) }
// walk the beasts a tile so they take a facing, then let them settle
if (process.env.WALK || LINEUP.length) {
  for (const k in state.mobs) { state.mobs[k].x -= LINEUP.length ? 1 : 2; if (LINEUP.length) state.mobs[k].y += 1 }
  send({ type: 'state', state, worldId: 'a1b2c3d4e5' })
  for (let i = 0; i < 26; i++) { CLOCK = 4000 + i * 40; for (const fn of raf.splice(0, raf.length)) fn(CLOCK) }
}

// standing at a thing and feeding it
if (process.env.AT_NODE) {
  const [kind, gap] = process.env.AT_NODE.split(',')
  const px = state.players.me.x, py = state.players.me.y
  state.nodes.here = { type: kind, x: px, y: py - (+gap || 1), depletedUntil: 0 }
  state.players.me.inventory = [{ item: 'logs', qty: 6 }, { item: 'coal', qty: 4 },
                                { item: 'iron-ore', qty: 9 }]
  send({ type: 'state', state, worldId: 'a1b2c3d4e5' })
  for (let i = 0; i < 6; i++) { CLOCK += 34; for (const fn of raf.splice(0, raf.length)) fn(CLOCK) }
}

// mid-swing, for the shutter: a citizen already at work on something
if (process.env.TOIL) {
  const [kind, tx, ty] = process.env.TOIL.split(',')
  state.nodes.toil = { type: kind, x: +tx, y: +ty, depletedUntil: 0 }
  state.players.me.action = { type: 'gather', nodeId: 'toil' }
  state.players.me.inventory = [{ item: process.env.TOOL || 'iron-hatchet' }]
  send({ type: 'state', state, worldId: 'a1b2c3d4e5' })
  for (let i = 0; i < 14; i++) { CLOCK += 40; for (const fn of raf.splice(0, raf.length)) fn(CLOCK) }
}

if (process.env.DEAD) {
  state.players.me.hp = 0
  state.players.me.deadUntil = state.tick + 4
  state.players.me.deaths = 3
  send({ type: 'state', state, worldId: 'a1b2c3d4e5' })
  for (let i = 0; i < 26; i++) { CLOCK += 40; for (const fn of raf.splice(0, raf.length)) fn(CLOCK) }
}

// turning on a neighbour: the other kind of violence
if (process.env.PVP) {
  const [tool, dmg] = process.env.PVP.split(',')
  const px = state.players.me.x, py = state.players.me.y
  state.players.me.equipment = { weapon: { item: tool } }
  state.players.me.inventory = [{ item: tool }]
  state.players.me.action = { type: 'attackp', targetId: 'foe' }
  state.players.foe = { x: px, y: py - (+process.env.GAP || 2), hp: 10, maxHp: 10, name: 'bram',
    inventory: [], skills: {}, equipment: { weapon: { item: 'iron-sword' } },
    action: { type: 'attackp', targetId: 'me' } }
  send({ type: 'state', state, worldId: 'a1b2c3d4e5' })
  for (let i = 0; i < 6; i++) { CLOCK += 34; for (const fn of raf.splice(0, raf.length)) fn(CLOCK) }
  state.tick++
  state.players.foe.hp = 10 - (+dmg || 4)
  if (process.env.HURT) state.players.me.hp = 5
  send({ type: 'state', state, worldId: 'a1b2c3d4e5' })
  for (let i = 0; i < 5; i++) { CLOCK += 34; for (const fn of raf.splice(0, raf.length)) fn(CLOCK) }
}

// a fight, mid-blow: a beast in reach, a blow landing, numbers in the air
if (process.env.FIGHT) {
  const [mob, tool, dmg] = process.env.FIGHT.split(',')
  const px = state.players.me.x, py = state.players.me.y
  const gap = +(process.env.GAP || 3)
  state.mobs = { foe: { type: mob, hp: 22, x: px, y: py - gap } }
  state.players.me.equipment = { weapon: { item: tool } }
  state.players.me.inventory = [{ item: tool }]
  state.players.me.action = { type: 'attack', mobId: 'foe' }
  send({ type: 'state', state, worldId: 'a1b2c3d4e5' })
  for (let i = 0; i < 6; i++) { CLOCK += 34; for (const fn of raf.splice(0, raf.length)) fn(CLOCK) }
  // the blow lands: hp drops, the beast flinches, the number rises
  state.tick++
  state.mobs.foe.hp = 22 - (+dmg || 7)
  if (process.env.HURT) state.players.me.hp = 6
  send({ type: 'state', state, worldId: 'a1b2c3d4e5' })
  for (let i = 0; i < (+process.env.AFTER || 5); i++) { CLOCK += 34; for (const fn of raf.splice(0, raf.length)) fn(CLOCK) }
}

if (process.env.LEVEL) {
  const [sk, xp] = process.env.LEVEL.split(',')
  state.players.me.skills = { [sk]: 0 }
  send({ type: 'state', state, worldId: 'a1b2c3d4e5' })
  for (let i = 0; i < 3; i++) { CLOCK += 34; for (const fn of raf.splice(0, raf.length)) fn(CLOCK) }
  state.tick++
  state.players.me.skills = { [sk]: +xp }
  send({ type: 'state', state, worldId: 'a1b2c3d4e5' })
  for (let i = 0; i < 12; i++) { CLOCK += 34; for (const fn of raf.splice(0, raf.length)) fn(CLOCK) }
}

if (process.env.SKILLS_XP) {
  state.players.me.skills = JSON.parse(process.env.SKILLS_XP)
  if (process.env.CALLING) state.players.me.calling = process.env.CALLING
  send({ type: 'state', state, worldId: 'a1b2c3d4e5' })
  for (let i = 0; i < 4; i++) { CLOCK += 34; for (const fn of raf.splice(0, raf.length)) fn(CLOCK) }
}

// press keys before the shutter, so the panels can be photographed
if (process.env.MENU) {
  if (!process.env.BARE) {
    state.nodes.mb = { type: 'vault', x: 41, y: 41 }
    state.nodes.ms = { type: 'stall', kind: 'arms', x: 39, y: 41 }
    state.nodes.ma = { type: 'anvil', x: 41, y: 39 }
  }
  state.players.me.inventory = [{ item: 'logs', qty: 3 }, { item: 'bones' }, { item: 'raw-fish' },
    { item: 'cooked-fish' }, { item: 'iron-sword' }, { item: 'seeds' }, { item: 'iron', qty: 4 },
    { item: 'magic-stone' }]
  send({ type: 'state', state, worldId: 'a1b2c3d4e5' })
  for (let i = 0; i < 4; i++) { CLOCK += 40; for (const fn of raf.splice(0, raf.length)) fn(CLOCK) }
  const press = (k) => { for (const f of winHandlers.keydown || []) f({ key: k, preventDefault: () => {}, shiftKey: false }) }
  for (const k of process.env.MENU.split(',')) press(k)
  await new Promise(r => setTimeout(r, 60))
  for (let i = 0; i < 6; i++) { CLOCK += 40; for (const fn of raf.splice(0, raf.length)) fn(CLOCK) }
}

// a neighbour at work, and something in the air, for the shutter
if (process.env.FX) {
  state.players.pal = { x: 40, y: 37, hp: 10, maxHp: 10, name: 'bram', inventory: [], skills: {},
                        equipment: { weapon: { item: 'iron-hatchet' } }, deed: null }
  state.mobs.mm = { type: 'goblin', hp: 9, x: 42, y: 34 }
  state.players.me.equipment = { weapon: { item: 'wooden-bow' } }
  state.players.me.action = { type: 'attack', mobId: 'mm' }
  send({ type: 'state', state, worldId: 'a1b2c3d4e5' })
  for (let i = 0; i < 4; i++) { CLOCK += 40; for (const fn of raf.splice(0, raf.length)) fn(CLOCK) }
  state.tick++; state.players.pal.deed = process.env.FX
  state.mobs.mm.hp = 5
  send({ type: 'state', state, worldId: 'a1b2c3d4e5' })
  for (let i = 0; i < 3; i++) { CLOCK += 40; for (const fn of raf.splice(0, raf.length)) fn(CLOCK) }
}

// ============================ the rasteriser =================================
const RW = els.gl.width, RH = els.gl.height
const color = new Float32Array(RW * RH * 3), depth = new Float32Array(RW * RH)
function clearBuf (c) { for (let i = 0; i < RW * RH; i++) {
  color[i * 3] = c.r; color[i * 3 + 1] = c.g; color[i * 3 + 2] = c.b; depth[i] = Infinity } }

// NEAREST OR BILINEAR, AS THE TEXTURE ASKS. Sampling nearest whatever the
// material says would show a 2000 machine's geometry with a 1994 machine's
// filtering, which is not a comparison, it is a composite of two.
const texel = (d, w, h, x, y, rep) => {
  if (rep) { x = ((x % w) + w) % w; y = ((y % h) + h) % h }
  else { x = Math.max(0, Math.min(w - 1, x)); y = Math.max(0, Math.min(h - 1, y)) }
  const i = (y * w + x) * 4
  return [d[i] / 255, d[i + 1] / 255, d[i + 2] / 255, d[i + 3] / 255]
}
function sample (tex, u, v) {
  const img = tex.image, w = img.width, h = img.height, d = img.data
  const rep = tex.wrapS === THREE.RepeatWrapping
  if (tex.magFilter === THREE.LinearFilter) {
    const fx = u * w - 0.5, fy = (1 - v) * h - 0.5
    const x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0
    const a = texel(d, w, h, x0, y0, rep), b = texel(d, w, h, x0 + 1, y0, rep)
    const c = texel(d, w, h, x0, y0 + 1, rep), e = texel(d, w, h, x0 + 1, y0 + 1, rep)
    const out = [0, 0, 0, 0]
    for (let k = 0; k < 4; k++)
      out[k] = (a[k] * (1 - ax) + b[k] * ax) * (1 - ay) + (c[k] * (1 - ax) + e[k] * ax) * ay
    return out
  }
  return texel(d, w, h, Math.floor(u * w), Math.floor((1 - v) * h), rep)
}
const mv = new THREE.Matrix4(), tmpN = new THREE.Matrix3(), _wp = new THREE.Vector3()
function drawMesh (o, cam) {
  const g = o.geometry, m = o.material, un = m.uniforms
  if (!un || !g.attributes.position) return
  const pos = g.attributes.position, uvA = g.attributes.uv, colA = g.attributes.color, norA = g.attributes.normal
  const idx = g.index ? g.index.array : null
  const n = idx ? idx.length : pos.count
  mv.multiplyMatrices(cam.matrixWorldInverse, o.matrixWorld)
  tmpN.setFromMatrix4(o.matrixWorld)
  const P = cam.projectionMatrix.elements
  const L = un.uLightDir.value, amb = un.uAmb.value, dif = un.uDif.value
  const fogN = un.uFogNear.value, fogF = un.uFogFar.value, fog = un.uFogColor.value
  const FIRES = un.uFires.value, GAIN = un.uFireGain.value
  const MT = un.uMistTop.value, MD = un.uMistDense.value
  const M = o.matrixWorld.elements
  const opacity = un.uOpacity ? un.uOpacity.value : 1
  const blend = !!m.transparent
  const jit = un.uJitter.value, resX = un.uRes.value.x, resY = un.uRes.value.y
  const map = un.uHasMap.value > 0.5 ? un.uMap.value : null
  const at = un.uAlphaTest.value, unlit = un.uUnlit.value, off = un.uUvOff.value, tint = un.uTint.value
  const two = m.side === THREE.DoubleSide
  const V = []
  const vert = (vi) => {
    const x = pos.getX(vi), y = pos.getY(vi), z = pos.getZ(vi)
    const e = mv.elements
    const ex = e[0] * x + e[4] * y + e[8] * z + e[12]
    const ey = e[1] * x + e[5] * y + e[9] * z + e[13]
    const ez = e[2] * x + e[6] * y + e[10] * z + e[14]
    let cx = P[0] * ex + P[4] * ey + P[8] * ez + P[12]
    let cy = P[1] * ex + P[5] * ey + P[9] * ez + P[13]
    const cz = P[2] * ex + P[6] * ey + P[10] * ez + P[14]
    const cw = P[3] * ex + P[7] * ey + P[11] * ez + P[15]
    // the window's vertex snap, to the pixel
    const safe = cw >= 0.02 ? 1 : 0, gx = resX * 0.5, gy = resY * 0.5, sw = Math.max(cw, 0.02)
    const sx = Math.floor(cx / sw * gx + 0.5) / gx * cw, sy = Math.floor(cy / sw * gy + 0.5) / gy * cw
    cx = cx + (sx - cx) * jit * safe; cy = cy + (sy - cy) * jit * safe
    // per-vertex light and fog, exactly as the vertex shader has it
    const ne = tmpN.elements
    let nx = 0, ny = 1, nz = 0
    if (norA) { const a = norA.getX(vi), b = norA.getY(vi), c = norA.getZ(vi)
      nx = ne[0] * a + ne[3] * b + ne[6] * c; ny = ne[1] * a + ne[4] * b + ne[7] * c
      nz = ne[2] * a + ne[5] * b + ne[8] * c
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l }
    const d = Math.max(nx * L.x + ny * L.y + nz * L.z, 0)
    const bk = Math.max(-(nx * L.x + ny * L.y + nz * L.z), 0) * 0.10
    const cr = colA ? colA.getX(vi) : 1, cg = colA ? colA.getY(vi) : 1, cb = colA ? colA.getZ(vi) : 1
    const lit = amb + dif * d + bk
    // §the normal itself goes across, for the newest machine's per-pixel light
    // world position, for the fires and for how low in the mist this corner sits
    const wx = M[0] * x + M[4] * y + M[8] * z + M[12]
    const wy = M[1] * x + M[5] * y + M[9] * z + M[13]
    const wz = M[2] * x + M[6] * y + M[10] * z + M[14]
    let fR = 0, fG = 0, fB = 0
    for (let k = 0; k < 4; k++) {
      const F = FIRES[k], rr = Math.max(F.w, 0.001)
      const dx = F.x - wx, dy = F.y - wy, dz = F.z - wz
      const len = Math.hypot(dx, dy, dz)
      let at = Math.max(0, 1 - len / rr); at *= at
      if (at <= 0) continue
      const l2 = Math.hypot(dx, dy + 0.02, dz) || 1
      const nd = 0.34 + 0.66 * Math.max(nx * dx / l2 + ny * (dy + 0.02) / l2 + nz * dz / l2, 0)
      fR += 1.0 * at * nd * GAIN; fG += 0.50 * at * nd * GAIN; fB += 0.19 * at * nd * GAIN
    }
    const dist = Math.hypot(ex, ey, ez)
    const df = Math.max(0, Math.min(1, (dist - fogN) / (fogF - fogN)))
    const low = Math.max(0, Math.min(1, (MT - wy) / Math.max(MT, 0.001)))
    const f = Math.max(0, Math.min(1, df + low * low * MD * Math.min(1, dist / fogF)))
    const u = uvA ? uvA.getX(vi) : 0, v = uvA ? uvA.getY(vi) : 0
    return { x: cx, y: cy, z: cz, w: cw, u: u * cw, v: v * cw,
             r: cr * lit + cr * fR, g: cg * lit + cg * fG, b: cb * lit + cb * fB, f,
             // §the normal itself, for the newest machine's per-pixel light
             nx: nx * cw, ny: ny * cw, nz: nz * cw }
  }
  for (let t = 0; t < n; t += 3) {
    const a = vert(idx ? idx[t] : t), b = vert(idx ? idx[t + 1] : t + 1), c = vert(idx ? idx[t + 2] : t + 2)
    for (const tri of clipNear([a, b, c])) raster(tri, map, at, unlit, off, tint, fog, two, blend, opacity, L)
  }
}
// near-plane clipping, so a tile under your feet does not smear the screen
function clipNear (tri) {
  const EPS = 0.05
  const inside = tri.filter(v => v.w > EPS)
  if (inside.length === 3) return [tri]
  if (inside.length === 0) return []
  const lerpV = (p, q, t) => { const o = {}; for (const k in p) o[k] = p[k] + (q[k] - p[k]) * t; return o }
  const cut = (p, q) => lerpV(p, q, (EPS - p.w) / (q.w - p.w))
  const out = []
  for (let i = 0; i < 3; i++) {
    const cur = tri[i], nxt = tri[(i + 1) % 3]
    if (cur.w > EPS) out.push(cur)
    if ((cur.w > EPS) !== (nxt.w > EPS)) out.push(cut(cur, nxt))
  }
  const tris = []
  for (let i = 1; i + 1 < out.length; i++) tris.push([out[0], out[i], out[i + 1]])
  return tris
}
function raster (tri, map, at, unlit, off, tint, fog, two, blend, opacity, L) {
  const S = tri.map(v => ({ ...v, sx: (v.x / v.w * 0.5 + 0.5) * RW, sy: (1 - (v.y / v.w * 0.5 + 0.5)) * RH,
                            sz: v.z / v.w, iw: 1 / v.w }))
  const [A, B, C] = S
  const area = (B.sx - A.sx) * (C.sy - A.sy) - (C.sx - A.sx) * (B.sy - A.sy)
  if (area === 0) return
  if (!two && area > 0) return                                   // three culls CCW-in-NDC backfaces
  const x0 = Math.max(0, Math.floor(Math.min(A.sx, B.sx, C.sx))), x1 = Math.min(RW - 1, Math.ceil(Math.max(A.sx, B.sx, C.sx)))
  const y0 = Math.max(0, Math.floor(Math.min(A.sy, B.sy, C.sy))), y1 = Math.min(RH - 1, Math.ceil(Math.max(A.sy, B.sy, C.sy)))
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const px = x + 0.5, py = y + 0.5
    let w0 = ((B.sx - A.sx) * (py - A.sy) - (px - A.sx) * (B.sy - A.sy)) / area
    let w1 = ((px - A.sx) * (C.sy - A.sy) - (C.sx - A.sx) * (py - A.sy)) / area
    const w2 = 1 - w0 - w1
    if (w0 < 0 || w1 < 0 || w2 < 0) continue
    const la = w2, lb = w1, lc = w0                              // barycentrics for A,B,C
    const z = la * A.sz + lb * B.sz + lc * C.sz
    if (z < -1 || z > 1) continue
    const di = y * RW + x
    if (z >= depth[di]) continue
    // perspective-correct interpolation, which is what makes the AFFINE trick work
    const iw = la * A.iw + lb * B.iw + lc * C.iw
    const gi = (k) => (la * A[k] * A.iw + lb * B[k] * B.iw + lc * C[k] * C.iw) / iw
    const vw = gi('w'), uu = gi('u') / vw + off.x, vv = gi('v') / vw + off.y
    let r = 1, g = 1, b = 1, ta = 1
    if (map) { const t = sample(map, uu, vv); if (t[3] < at) continue; r = t[0]; g = t[1]; b = t[2]; ta = t[3] }
    let lr = unlit ? 1 : gi('r'), lg = unlit ? 1 : gi('g'), lb2 = unlit ? 1 : gi('b')
    if (PIXEL && map && !unlit) {
      // the normal, bent by the slope of the page's own luminance, and the
      // lambert done HERE rather than at the corners
      const tw = map.image.width, th = map.image.height
      const h0 = LUM([r, g, b])
      const hX = LUM(sample(map, uu + 1 / tw, vv)), hY = LUM(sample(map, uu, vv + 1 / th))
      let nx = gi('nx') / vw, ny = gi('ny') / vw, nz = gi('nz') / vw
      const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl
      const ux = Math.abs(ny) > 0.9 ? 1 : 0, uy = Math.abs(ny) > 0.9 ? 0 : 1
      let tx = uy * nz - 0 * ny, tyy = 0 * nx - ux * nz, tz = ux * ny - uy * nx
      const tl = Math.hypot(tx, tyy, tz) || 1; tx /= tl; tyy /= tl; tz /= tl
      const bx = ny * tz - nz * tyy, by = nz * tx - nx * tz, bz = nx * tyy - ny * tx
      const kx = (h0 - hX) * BUMP, ky = (h0 - hY) * BUMP
      nx += tx * kx + bx * ky; ny += tyy * kx + by * ky; nz += tz * kx + bz * ky
      const n2 = Math.hypot(nx, ny, nz) || 1; nx /= n2; ny /= n2; nz /= n2
      const dd = L ? Math.max(nx * L.x + ny * L.y + nz * L.z, 0) : 0.7
      const k = 0.55 + dd * 0.62
      lr *= k; lg *= k; lb2 *= k
    }
    r *= lr * tint.r; g *= lg * tint.g; b *= lb2 * tint.b
    const f = gi('f')
    r = r + (fog.r - r) * f; g = g + (fog.g - g) * f; b = b + (fog.b - b) * f
    if (blend) {                                   // the half-and-half mode, and no depth written
      const a = ta * opacity
      if (a <= 0.002) continue
      color[di * 3] = color[di * 3] * (1 - a) + r * a
      color[di * 3 + 1] = color[di * 3 + 1] * (1 - a) + g * a
      color[di * 3 + 2] = color[di * 3 + 2] * (1 - a) + b * a
      continue
    }
    depth[di] = z
    color[di * 3] = r; color[di * 3 + 1] = g; color[di * 3 + 2] = b
  }
}
function drawScene (sc, cam) {
  sc.updateMatrixWorld(true); cam.updateMatrixWorld(true)
  cam.matrixWorldInverse.copy(cam.matrixWorld).invert()
  const solid = [], clear = []
  sc.traverse(o => { if (o.isMesh && o.visible) (o.material.transparent ? clear : solid).push(o) })
  for (const o of solid) drawMesh(o, cam)
  // the see-through things go last, furthest first, exactly as three orders them
  const dof = (o) => { o.getWorldPosition(_wp); return _wp.distanceToSquared(cam.position) }
  clear.sort((a, b) => dof(b) - dof(a))
  for (const o of clear) drawMesh(o, cam)
}

// ============================ the last pass ==================================
const bayer2 = (x, y) => { const f = x / 2 + y * y * 0.75; return f - Math.floor(f) }
const BITS = true    // one machine, and it dithers
// §PER-PIXEL LIGHT IN THE SHUTTER TOO. A rasteriser that only interpolates the
// vertex colour cannot show a machine whose whole signature is that it stopped
// doing that. The normal comes across as a varying and the lambert is done
// here, against a normal bent by the slope of the texture's own luminance.
const PIXEL = false  // the light is finished at the corners, as it was
const LUM = (c) => c[0] * 0.299 + c[1] * 0.587 + c[2] * 0.114
const BUMP = 2.6
function present (scale) {
  const hud = els.hud
  const out = Buffer.alloc(RW * scale * RH * scale * 3)
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
    const i = y * RW + x
    let c = [color[i * 3], color[i * 3 + 1], color[i * 3 + 2]]
    // §and the last pass is the era's too: dither and truncate, or keep the low
    // bits and spend them on a bloom
    if (BITS) {
      const d = bayer2(Math.floor(0.5 * x), Math.floor(0.5 * y)) * 0.25 + bayer2(x, y)
      c = c.map(v => Math.max(0, Math.min(1, v + (d - 0.5) / 32)))
      c = c.map(v => Math.floor(v * 31 + 0.5) / 31 * 255)        // 5:5:5, and no more
    } else {
      c = c.map(v => { const lift = Math.max(v - 0.72, 0); return Math.max(0, Math.min(1, v + lift * 0.55)) * 255 })
    }
    const h = process.env.NOHUD ? null : hud.data, k = (y * hud.width + x) * 4
    if (h && h[k + 3] > 8) { const a = h[k + 3] / 255
      c = [c[0] * (1 - a) + h[k] * a, c[1] * (1 - a) + h[k + 1] * a, c[2] * (1 - a) + h[k + 2] * a] }
    for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) {
      const o = ((y * scale + sy) * RW * scale + x * scale + sx) * 3
      out[o] = c[0]; out[o + 1] = c[1]; out[o + 2] = c[2]
    }
  }
  return out
}
function png (rgb, w, h, file) {
  const raw = Buffer.alloc((w * 3 + 1) * h)
  for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0
    rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3) }
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
    const td = Buffer.concat([Buffer.from(type), data]), crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(td) >>> 0); return Buffer.concat([len, td, crc]) }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]))
}
let CT = null
function crc32 (buf) {
  if (!CT) { CT = new Int32Array(256)
    for (let n = 0; n < 256; n++) { let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      CT[n] = c } }
  let c = -1
  for (let i = 0; i < buf.length; i++) c = CT[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return c ^ -1
}

clearBuf(seen.clear || new THREE.Color(0x8a9a86))
drawScene(seen.scene, seen.cam)
if (!process.env.NOHUD) {                       // the hands get their own depth
  for (let i = 0; i < RW * RH; i++) depth[i] = Infinity
  drawScene(seen.vmScene, seen.vmCam)
}
const SCALE = SCALE_OUT
if (process.env.RAW) {                        // for the stitcher: no encoding, just pixels
  const buf = present(1)
  const head = Buffer.alloc(8); head.writeUInt32BE(RW, 0); head.writeUInt32BE(RH, 4)
  fs.writeFileSync(process.env.RAW, Buffer.concat([head, buf]))
} else {
  png(present(SCALE), RW * SCALE, RH * SCALE, process.argv[2] || 'mist.png')
}
let mc=0; seen.scene.traverse(o=>{if(o.isMesh)mc++}); console.log('meshes',mc,'cam',seen.cam.position.toArray().map(v=>v.toFixed(1)).join(','))
console.log('wrote', process.argv[2], RW + 'x' + RH, '(x' + SCALE + ')', 'tick', TICK)
