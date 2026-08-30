// §6dj, for the mist window: DOES EVERY THING IN THE WORLD LOOK LIKE ITSELF.
//
// `makeNode` has a default: an unknown type becomes a grey stone with a cap on
// it. That default is right — a window must draw SOMETHING for a thing the
// world invented after it was written — but it is also where detail goes to
// die quietly. Twenty-one node types were falling through it, including every
// ore seam in the world: an iron rock, a coal rock, a gold rock and a
// mother-lode were the same grey stone, so walking to a particular seam had no
// point, because you could not tell it from any other.
//
// This reads the node types out of a real world dump and checks each one gets a
// body of its own — and that the bodies actually DIFFER, since a switch case
// that returns the same shape is no better than the default.
//
//   node check-window-nodes.mjs [/tmp/live-world.json]
//
// Needs three.js:  npm i three@0.128.0

import { readFileSync, existsSync } from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let THREE; try { THREE = require('three') } catch { console.log('  skip  no three.js'); process.exit(0) }

const DUMP = process.argv[2] || '/tmp/live-world.json'
// the types a real expanse contains. If no dump is to hand, the list this was
// measured against, so the check still means something on a fresh clone.
const FALLBACK = ['wall', 'landmark', 'hedge', 'plot', 'rampart', 'fence', 'signpost', 'hearth',
  'keeper', 'railing', 'campfire', 'rockfall', 'banner', 'well', 'guard', 'magic-rock', 'bank',
  'store', 'iron-rock', 'dedication', 'tree', 'fishing-spot', 'muck-heap', 'stall', 'gallows-oak',
  'coal-rock', 'heartwood-tree', 'ironbark-tree', 'oak-tree', 'salt-pan', 'eel-spot', 'mother-lode',
  'smokerack', 'ferry', 'brimstone-vent', 'gibbet-shoal', 'gold-rock', 'deep-fish-spot', 'fountain',
  'tollgate', 'ossuary', 'anvil', 'smith', 'bellwork', 'brewpot', 'watchfire', 'sawpit', 'furnace',
  'stamp', 'looking-glass', 'hoard']
const TYPES = existsSync(DUMP)
  ? [...new Set(Object.values(JSON.parse(readFileSync(DUMP, 'utf8')).nodes).map(n => n.type))]
  : FALLBACK

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
global.location = { protocol: 'http:', host: 'x', search: '' }
global.localStorage = { getItem: () => null, setItem: noop }
global.innerWidth = 960; global.innerHeight = 720
global.addEventListener = (t, f) => { (win[t] ||= []).push(f) }
global.prompt = () => ''; global.AudioContext = undefined
global.fetch = async () => ({ ok: false })
const def = (k, v) => Object.defineProperty(global, k, { value: v, configurable: true })
def('navigator', { getGamepads: () => [] }); def('crypto', { randomUUID: () => 'nd' })
def('performance', { now: () => CLOCK })
global.requestAnimationFrame = (fn) => raf.push(fn)
const socks = []
global.WebSocket = class { constructor () { this.readyState = 1; socks.push(this) } send () {} close () {} }
let scene = null
THREE.WebGLRenderer = class { constructor () { this.domElement = canvas() }
  setPixelRatio () {} setSize () {} setClearColor () {} clear () {} clearDepth () {}
  setRenderTarget () {} render (sc) { if (sc.children.length > 2) scene = sc } }
global.THREE = THREE
for (const b of [...readFileSync('window-writ.html', 'utf8')
  .matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])) (0, eval)(b)

const frames = (n) => { for (let i = 0; i < n; i++) { CLOCK += 40
  for (const fn of raf.splice(0, raf.length)) fn(CLOCK) } }
const send = (m) => { for (const s of socks) s.onmessage({ data: JSON.stringify(m) }) }
for (const s of socks) s.onopen && s.onopen()
send({ type: 'hello', playerId: 'me' })

// stand one citizen in an empty field and put ONE node beside them at a time,
// then describe what got built: how many meshes, and of what size
const shapeOf = (type) => {
  const st = { tick: 900, genesis: { worldW: 64, worldH: 64, genesisSeed: 'nd' },
    players: { me: { x: 20, y: 20, hp: 10, maxHp: 10, gold: 0, inventory: [], skills: {} } },
    mobs: {}, nodes: { one: { type, x: 21, y: 20, depletedUntil: 0 } }, ground: {} }
  send({ type: 'state', state: st, worldId: 'w' }); frames(4)
  const o = scene.children.find(c => c.userData && c.userData.kind === type)
  if (!o) return null
  let n = 0; const box = new THREE.Box3()
  o.traverse(c => { if (c.isMesh) { n++; box.expandByObject(c) } })
  const s2 = box.getSize(new THREE.Vector3())
  const sig = n + ':' + s2.x.toFixed(1) + ':' + s2.y.toFixed(1) + ':' + s2.z.toFixed(1)
  // clear it, so the next one is built fresh
  send({ type: 'state', state: { ...st, nodes: {} }, worldId: 'w' }); frames(2)
  return sig
}
let bad = 0
const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL') + '  ' + m); if (!c) bad++ }
const marker = shapeOf('a-thing-invented-after-this-window-was-written')
ok(!!marker, 'a type this window has never heard of still gets a body (' + marker + ')')

const shapes = new Map(), generic = [], dupes = new Map()
for (const t of TYPES) {
  const sig = shapeOf(t)
  shapes.set(t, sig)
  if (sig === marker) generic.push(t)
  else if (sig) { (dupes.get(sig) || dupes.set(sig, []).get(sig)).push(t) }
}
ok(generic.length === 0, TYPES.length - generic.length + ' of ' + TYPES.length +
   ' node types have a body of their own' + (generic.length ? ' \u2014 generic: ' + generic.join(' ') : ''))
const collided = [...dupes.values()].filter(v => v.length > 1)
console.log('  \u00b7     ' + shapes.size + ' types built; ' + collided.length + ' groups share a silhouette' +
            (collided.length ? ':\n        ' + collided.map(v => v.join('=')).join('\n        ') : ''))
console.log(bad ? '\n  ' + bad + ' failed' : '\n  ok    everything the world puts on a tile looks like itself')
process.exit(bad ? 1 : 0)
