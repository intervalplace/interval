// §6dj: DRIVE THE PANEL. A boot check proves the top level runs; it does not
// prove a frame survives. `panel()` is called on every state change and is NOT
// inside the try/catch that guards the state diff above it, so anything it
// throws kills whatever called it -- and the window sits there looking frozen.
//
// This builds a state by hand, hands it to the real `panel()`, and reports what
// throws. Every case here is one somebody actually hit.

import { readFileSync } from 'fs'
import vm from 'vm'
import E from './engine.js'

if (E.initCrypto) await E.initCrypto()

const html = readFileSync('window-web.html', 'utf8')
const body = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)][0][1]

const noop = () => {}
const el = () => new Proxy(function () {}, {
  get(t, k) {
    if (k === 'style') return new Proxy({}, { get: () => '', set: () => true })
    if (k === 'dataset') return {}
    if (k === 'classList') return { add: noop, remove: noop, contains: () => false }
    if (k === 'children' || k === 'childNodes') return []
    if (k === 'parentNode' || k === 'parentElement') return el()
    if (k === 'innerHTML' || k === 'textContent' || k === 'value' || k === 'id') return ''
    if (k === 'width' || k === 'height' || k === 'offsetWidth') return 800
    if (k === Symbol.toPrimitive) return () => ''
    return el()
  },
  set: () => true, apply: () => el(),
})
const ctx = {
  document: new Proxy({}, { get(t, k) {
    if (k === 'getElementById' || k === 'querySelector' || k === 'createElement') return () => el()
    if (k === 'querySelectorAll') return () => []
    if (k === 'addEventListener') return noop
    if (k === 'body' || k === 'head') return el()
    return el()
  } }),
  console: { log: noop, warn: noop, error: noop },
  setTimeout: noop, setInterval: noop, clearTimeout: noop, requestAnimationFrame: noop,
  fetch: () => new Promise(noop), WebSocket: function () { return el() },
  localStorage: { getItem: () => null, setItem: noop }, location: { href: '', search: '' },
  navigator: { userAgent: 'node' }, crypto: globalThis.crypto, performance: { now: () => 0 },
  addEventListener: noop, Image: function () { return el() },
  matchMedia: () => ({ matches: false, addEventListener: noop }),
  URL, TextEncoder, TextDecoder,
}
ctx.window = ctx
vm.createContext(ctx)
vm.runInContext(body, ctx, { timeout: 20000 })

// a real state from the real engine, so the shapes are never a guess
const RULES = 'a'.repeat(64)
const G = E.makeGenesis('panel-harness', RULES, 0, 40, 30)
const WID = E.worldId(G)
const me = E.generateIdentity()
function fresh(place) {
  const s = E.newWorld(G)
  E.addPlayer(s, me.playerId, 5, 5)
  E.addNode(s, 'well-1', 'well', 5, 6)
  E.addNode(s, 'store-1', 'store', 6, 5)
  E.addNode(s, 'stall-1', 'stall', 4, 5)
  s.nodes['stall-1'].kind = 'armour'
  const p = s.players[me.playerId]
  p.skills.hitpoints = E.XP_TABLE[40]
  p.hp = 3
  p.inventory[0] = { item: 'logs', qty: 1 }
  return s
}
const sign = (f) => E.signInput({ worldId: WID, playerId: me.playerId, ...f }, me.privateKey)

let bad = 0
const drive = (label, s) => {
  ctx.world = s
  ctx.myId = me.playerId
  try { ctx.panel(s); console.log(`  ok    ${label}`) }
  catch (e) { console.log(`  FAIL  ${label}\n          ${e.name}: ${e.message}`); bad++ }
}

console.log('\n--- panel() survives a frame ---')
drive('a plain state', fresh())

let s2 = fresh()
s2 = E.nextState(s2, [sign({ tick: 0, type: 'drink' })])
drive(`after drinking (well depletedUntil ${s2.nodes['well-1'].depletedUntil})`, s2)

let s3 = fresh()
s3.players[me.playerId].consignment = { from: 'store-1', route: ['store-1'], leg: 0,
  items: [{ item: 'logs', qty: 3 }, ...Array(27).fill(null)] }
drive('carrying a consignment at the counter', s3)

let s4 = fresh()
s4.players[me.playerId].consignment = { from: 'store-1', route: ['store-1'], leg: 1,
  items: [{ item: 'logs', qty: 3 }, ...Array(27).fill(null)] }
drive('at the end of the route', s4)

let s5 = fresh()
s5.players[me.playerId].brandedUntil = s5.tick + 900
s5.players[me.playerId].consignment = { from: 'store-1', route: ['store-1'], leg: 1,
  items: [{ item: 'logs', qty: 3 }, ...Array(27).fill(null)] }
drive('branded, at the end of the route', s5)

let s6 = fresh()
s6.players[me.playerId].equipment.weapon = { item: 'star-javelin', qty: 1 }
s6.players[me.playerId].inventory[1] = { item: 'star-javelin', qty: 9 }
drive('holding a javelin', s6)

console.log('\n--- drawScene() survives a frame ---')
// the canvas loop runs sixty times a second and is not inside anything's
// try/catch either. If it throws, the picture stops and the window is frozen.
const paint = (label, s) => {
  ctx.world = s; ctx.myId = me.playerId
  try { ctx.drawScene(s, 0); console.log(`  ok    ${label}`) }
  catch (e) { console.log(`  FAIL  ${label}\n          ${e.name}: ${e.message}`); bad++ }
}
paint('a plain state', fresh())
paint('after drinking (the well is depleted)', s2)
paint('holding a javelin', s6)

console.log('\n--- the skill guide opens for every skill ---')
ctx.world = fresh(); ctx.myId = me.playerId
const SKILLS = ['woodcutting', 'mining', 'fishing', 'cooking', 'smithing', 'firemaking',
  'prayer', 'ranged', 'magic', 'farming', 'fletching', 'attack', 'strength', 'defence',
  'hitpoints', 'exploration', 'brewing', 'hauling']
for (const sk of SKILLS) {
  try { ctx.openSkillGuide(sk) }
  catch (e) { console.log(`  FAIL  ${sk}: ${e.name}: ${e.message}`); bad++ }
}
if (!bad) console.log(`  ok    all ${SKILLS.length}`)

console.log(bad ? `\n${bad} failure(s).` : '\nevery frame survives.')
process.exit(bad ? 1 : 0)
