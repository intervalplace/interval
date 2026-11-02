// §7ek: IS EVERY DEED THE WORLD OFFERS REACHABLE IN THE WINDOW.
//
// window-web is the window almost everybody will ever use, so a verb the
// engine accepts and the window has no button for is, for practical purposes,
// a rule that does not exist. Three faults found by playing in one evening
// were all of this shape: a farm row did nothing on the right button, a
// hearth offered only "look at it" when it is a fire you can cook at, and a
// pile of bones under a skeleton could not be reached at all.
//
// Reading the source cannot answer it. The question is what a PRESS produces,
// so this stands the real window up in a vm with a fake document, presses
// every kind of thing the island carries, and reads the menu that comes back.
//
// The four things it asks:
//
//   1. every input type the engine has a schema for is either sent by this
//      window or named here as something a citizen has no button for, with
//      the reason
//   2. every one of the sixty-six node types answers a right-click with a
//      menu that SAYS WHAT IT IS and offers more than one thing
//   3. every item a citizen can hold answers both buttons: a left click does
//      the first thing on the list, a right click shows the list
//   4. every verb that goes out has a noise and a posture, or is named as
//      deliberately silent or deliberately still
//
// Run: node check-window-reach.mjs

import { readFileSync } from 'fs'
import vm from 'vm'
import E from './engine.js'

if (E.initCrypto) await E.initCrypto()

const html = readFileSync('window-web.html', 'utf8')
const body = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)][0][1]
const eng = readFileSync('engine.js', 'utf8')

let bad = 0
const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL') + '  ' + m); if (!c) bad++ }
const noop = () => {}

// ---- the engine's own lists, read out of the engine ----
const litArray = (src, name) => {
  const i = src.indexOf(name); const a = src.indexOf('[', i)
  let d = 0, j = a; for (; j < src.length; j++) { if (src[j] === '[') d++; else if (src[j] === ']') { d--; if (!d) break } }
  return Function('return ' + src.slice(a, j + 1))()
}
const NODE_TYPES = litArray(eng, 'const NODE_TYPES')
const INPUTS = (() => {
  const i = eng.indexOf('const INPUT_SCHEMAS'); const o = eng.indexOf('{', i)
  let d = 0, j = o; for (; j < eng.length; j++) { if (eng[j] === '{') d++; else if (eng[j] === '}') { d--; if (!d) break } }
  const blk = eng.slice(o + 1, j).split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n')
  const keys = []; let dd = 0, buf = ''
  for (const ch of blk) {
    if (ch === '{' || ch === '(') { dd++; buf = ''; continue }
    if (ch === '}' || ch === ')') { dd--; buf = ''; continue }
    if (dd !== 0) continue
    if (ch === ',' || ch === '\n') buf = ''
    else if (ch === ':') { const m = buf.match(/([A-Za-z_]{3,})\s*$/); if (m) keys.push(m[1]); buf = '' }
    else buf += ch
  }
  return [...new Set(keys)]
})()

// ---- the fake document, lifted from check-window-panel.mjs ----
const bars = {}
const el = (id) => new Proxy(function () {}, {
  get (t, k) {
    if (k === '__id') return id
    if (k === 'style') return new Proxy({}, { get: () => '', set: () => true })
    if (k === 'dataset') return {}
    if (k === 'classList') return { add: noop, remove: noop, contains: () => false }
    if (k === 'children' || k === 'childNodes') return []
    if (k === 'parentNode' || k === 'parentElement') return el(null)
    if (k === 'innerHTML' || k === 'textContent' || k === 'value' || k === 'id') return ''
    if (k === 'width' || k === 'height' || k === 'offsetWidth') return 800
    // the rect must match what the element reports for width/height, or the
    // window scales the press and lands on the wrong tile: the first run of
    // this check pressed y=11 and worldPress read y=15
    if (k === 'getBoundingClientRect') return () => ({ left: 0, top: 0, width: 800, height: 800 })
    if (k === 'closest') return () => null
    if (k === 'toDataURL') return () => 'data:,'
    if (k === Symbol.toPrimitive) return () => ''
    return el(null)
  },
  set (t, k, v) { if (k === 'innerHTML' && id) bars[id] = String(v); return true },
  apply: () => el(),
})
// ---- a fake audio graph that counts what it was asked to build ----
const built = []
const aparam = () => ({ value: 0, setValueAtTime: noop, setTargetAtTime: noop,
  linearRampToValueAtTime: noop, exponentialRampToValueAtTime: noop })
const anode = (kind) => { built.push(kind)
  return { type: '', frequency: aparam(), Q: aparam(), gain: aparam(), playbackRate: aparam(),
           buffer: null, loop: false, connect: (x) => x, start: noop, stop: noop } }
class FakeAC {
  constructor () { this.sampleRate = 8000; this.currentTime = 0; this.destination = anode('dest') }
  createBuffer (c, n) { return { getChannelData: () => new Float32Array(n) } }
  createBufferSource () { return anode('noise') }
  createBiquadFilter () { return anode('filter') }
  createGain () { return anode('gain') }
  createOscillator () { return anode('osc') }
}
const win = {}
const sent = []
let CLOCK = 1000
const ctx = {
  document: new Proxy({}, { get (t, k) {
    if (k === 'getElementById') return (id) => el(id)
    if (k === 'querySelector' || k === 'createElement') return () => el('new')
    if (k === 'querySelectorAll') return () => []
    if (k === 'addEventListener') return noop
    if (k === 'body' || k === 'head') return el(null)
    return el(null)
  } }),
  console: { log: noop, warn: noop, error: noop },
  setTimeout: noop, setInterval: noop, clearTimeout: noop, requestAnimationFrame: noop,
  fetch: () => new Promise(noop),
  WebSocket: function () { this.readyState = 1
    this.send = (r) => { try { const m = JSON.parse(r); if (m.type === 'act') sent.push(m.action.do) } catch {} }
    this.close = noop; return this },
  localStorage: { getItem: () => null, setItem: noop }, location: { href: '', search: '' },
  navigator: { userAgent: 'node' }, crypto: globalThis.crypto,
  performance: { now: () => CLOCK },
  addEventListener: (t, f) => { (win[t] ||= []).push(f) },
  Image: function () { return el() },
  matchMedia: () => ({ matches: false, addEventListener: noop }),
  innerWidth: 960, innerHeight: 720, devicePixelRatio: 1,
  AudioContext: FakeAC,
  URL, URLSearchParams, TextEncoder, TextDecoder,
}
ctx.window = ctx
vm.createContext(ctx)
// §6dj: a `let` at the top of a vm script is not on the context object, so the
// only way in is a setter compiled into the same lexical scope.
vm.runInContext(body + `
;globalThis.__h = {
  set: (w, i) => { world = w; myId = i },
  // the menu, caught at the one door every menu goes through. floatMenu gets
  // the FINAL list -- heading and 'walk here' included -- which is the thing
  // being tested, so the spy goes here and not on chooseAction.
  spy: () => { let last = null
    floatMenu = (opts) => { last = opts }
    return () => { const l = last; last = null; return l } },
  press: (x, y, right) => {
    cam.x = 0; cam.y = 0
    const sx = (x + 0.5) * TILE * ZR, sy = (y + 0.5) * TILE * ZR
    worldPress({ type: right ? 'contextmenu' : 'click', clientX: sx, clientY: sy,
                 preventDefault () {}, target: {} })
  },
  inv: (i, asMenu) => invClick(i, asMenu),
  probe: () => ({ pressAt: _pressAt, menuAt: _menuAt, pressTile: _pressTile, pressName: _pressName, mini: miniRect }),
  anims: () => ({ doing: DOING_ANIM, silent: [...ACTION_SILENT], voice: Object.keys(ACTION_VOICE),
    still: [...ACTION_STILL] }),
  sound: (verb) => actionSound(verb),
  wake: () => wakeAudio(),
  doing: () => doingNow(),
  seen: (v) => doingSeen(v),
  priced: () => Object.keys(PRICES),
  equippable: () => [...EQUIPPABLE],
  heals: () => Object.keys(HEALS),
}
`, ctx, { timeout: 30000 })

// a press menu only opens at the pointer when the window knows where the
// pointer was, which is what the global pointerdown is for
for (const f of win.pointerdown ?? []) f({ clientX: 100, clientY: 100, target: {} })
const takeMenu = ctx.__h.spy()
ctx.__h.wake()

// ---- a world to press things in ----
const RULES = 'a'.repeat(64)
const G = E.makeGenesis('reach-harness', RULES, 0, 40, 30)
const WID = E.worldId(G)
const me = E.generateIdentity()
const ID = me.playerId
function fresh () {
  const s = E.newWorld(G)
  E.addPlayer(s, ID, 10, 10)
  const p = s.players[ID]
  for (const k of Object.keys(p.skills)) p.skills[k] = E.XP_TABLE[90]
  p.hp = E.maxHealth(p); p.gold = 5000
  return s
}

console.log('\n--- 1. every input the engine has a schema for ---')
// What the window can send: every literal `do:` that reaches `send`, plus the
// engine's own name for it where BRIDGE_TO_INPUT renames one.
// A VERB SENT THROUGH A VARIABLE IS STILL SENT. The barrow spells go out as
// `send({ do: sp.v })`, so a scan for `do: '<word>'` misses every one of them
// and reports four live spells as unreachable. The spell table's own `v`
// fields are the other half of the list.
const windowSends = new Set([
  ...[...html.matchAll(/\bdo:\s*'([a-z_]+)'/g)].map((m) => m[1]),
  ...[...html.matchAll(/\{\s*v:\s*'([a-z_]+)'/g)].map((m) => m[1]),
])
// WHAT THE ENGINE CALLS EACH ONE, read out of BRIDGE_TO_INPUT, which is the one
// place that knows. A guess here would be a copy, and this check exists
// because copies drift. The whole table is sliced by brace matching: a fixed
// slice of nine thousand characters cut it off two thirds of the way through
// and reported `plant` -- which has been wired the whole time -- as missing.
const bridge = (() => {
  const i = html.indexOf('const BRIDGE_TO_INPUT')
  const a = html.indexOf('=>', i)
  let end = html.indexOf('\nconst ', a)
  const seg = html.slice(a, end < 0 ? a + 20000 : end)
  const out = {}
  for (const m of seg.matchAll(/a\.do === '([a-z_]+)'\s*\?[\s\S]{0,120}?\btype:\s*'([a-z_]+)'/g))
    out[m[1]] = m[2]
  return out
})()
const engineReach = new Set()
for (const v of windowSends) engineReach.add(bridge[v] ?? v)
// and the window's own harness names, which the engine never sees
// §7ek: THE DEEDS NO CITIZEN PRESSES, and why each one is not a button.
const NOT_A_BUTTON = {
  restore: 'the archive answers it; a citizen never files one',
  archive: 'anybody may file it, and the pillar does, with the proof',
  attend: 'the door files it, before there is a window to press',
  spawn: 'the door files it, when the attendance is ripe',
  move: 'one step; the window sends walks and the engine steps them',
  walk: 'the window sends this on every journey, from the intent and not a button',
  recall: 'the engine files it when a citizen is pulled home',
  gather: 'the window sends it on a press of the thing being gathered',
  attack: 'sent as `prowess`, which is this window’s outgoing name for it',
  transmute: 'sent as `alch` from the pack',
  claim_name: 'sent as `name` from the naming field',
  lift: 'sent as `pickup` from a pile',
  stop: 'the window sends it when an order replaces the last one',
  read_chart: 'repealed: `case \'read_chart\': return false` -- the engine '
    + 'refuses it outright and only the schema is left',
}
const unreachable = INPUTS.filter((t) => !engineReach.has(t) && !NOT_A_BUTTON[t])
ok(unreachable.length === 0, unreachable.length
  ? INPUTS.length + ' inputs, ' + unreachable.length + ' with no way to reach them: ' + unreachable.join(', ')
  : 'all ' + INPUTS.length + ' input types are either sent by the window or named as not a citizen’s button')
// and the other way round: a name here that the engine does not have is a
// window sending something that will be refused
const phantom = Object.keys(NOT_A_BUTTON).filter((t) => !INPUTS.includes(t))
ok(phantom.length === 0, phantom.length
  ? 'named as unreachable but not an input at all: ' + phantom.join(', ')
  : 'and nothing is excused that the engine has never heard of')

console.log('\n--- 2. every node type says what it is and offers more than one thing ---')
const NAMES_ITSELF = []
const SILENT = []
const ONE_ONLY = []
for (const type of NODE_TYPES) {
  const s = fresh()
  // beside the citizen, so adjacency is never the reason a menu is thin
  E.addNode(s, 'n1', type, 10, 11)
  const n = s.nodes.n1
  if (type === 'stall' || type === 'market') n.kind = 'arms'
  if (type === 'keeper' || type === 'guard' || type === 'crier') n.name = 'somebody'
  ctx.__h.set(s, ID)
  let opts = null
  try { ctx.__h.press(10, 11, true); opts = takeMenu() }
  catch (e) { ok(false, type + ': the press threw ' + e.name + ': ' + e.message); continue }
  if (!opts) { SILENT.push(type); continue }
  const head = opts.find((o) => o && o.head)
  const choices = opts.filter((o) => o && !o.head)
  if (!head) NAMES_ITSELF.push(type)
  if (choices.length < 2) ONE_ONLY.push(type + '(' + choices.map((o) => o.label).join('/') + ')')
}
if (process.argv.includes('--why')) {
  console.log('      opens a menu: ' + NODE_TYPES.filter((t) => !SILENT.includes(t)).join(' '))
  console.log('      silent:       ' + SILENT.join(' '))
}
ok(SILENT.length === 0, SILENT.length
  ? SILENT.length + ' node types answer the right button with no menu at all: ' + SILENT.join(', ')
  : 'all ' + NODE_TYPES.length + ' node types open a menu on the right button')
ok(NAMES_ITSELF.length === 0, NAMES_ITSELF.length
  ? NAMES_ITSELF.length + ' open a menu that does not say what it is about: ' + NAMES_ITSELF.join(', ')
  : 'and every one of them is headed with the thing’s own name')
ok(ONE_ONLY.length === 0, ONE_ONLY.length
  ? ONE_ONLY.length + ' offer one choice, so the right button is the left button: ' + ONE_ONLY.join(', ')
  : 'and every one offers at least two things')

console.log('\n--- 3. the pack: left does the first thing, right shows the list ---')
{
  const ITEMS = [...new Set([...ctx.__h.priced(), ...ctx.__h.equippable(), ...ctx.__h.heals(),
    'bones', 'dragon-bones', 'logs', 'sigil', 'quick-stone', 'chart', 'rubble', 'arrows',
    'fire-arrows', 'lamprey-spit'])]
  const noMenu = [], noHead = [], threw = []
  for (const item of ITEMS) {
    const s = fresh()
    s.players[ID].inventory[0] = { item, qty: 3 }
    ctx.__h.set(s, ID)
    let opts = null
    try { ctx.__h.inv('0', true); opts = takeMenu() }
    catch (e) { threw.push(item + ' (' + e.message + ')'); continue }
    if (!opts || !opts.filter((o) => o && !o.head).length) { noMenu.push(item); continue }
    if (!opts.some((o) => o && o.head)) noHead.push(item)
  }
  ok(threw.length === 0, threw.length ? 'a right click threw on: ' + threw.join(', ')
    : 'a right click on all ' + ITEMS.length + ' things a citizen can hold builds a list')
  ok(noMenu.length === 0, noMenu.length ? noMenu.length + ' things offer nothing: ' + noMenu.join(', ')
    : 'and none of them comes back empty')
  ok(noHead.length === 0, noHead.length ? noHead.length + ' lists do not name what you are holding: ' + noHead.join(', ')
    : 'and every list is headed with the thing’s own name')
  // AND THE LEFT BUTTON MUST NOT OPEN IT. This is the fault being fixed: a
  // left click in the pack used to build a menu, which is the right button's
  // job everywhere else in the window.
  const leftOpens = []
  for (const item of ITEMS) {
    const s = fresh()
    s.players[ID].inventory[0] = { item, qty: 3 }
    ctx.__h.set(s, ID)
    try { ctx.__h.inv('0', false) } catch (e) { leftOpens.push(item + ' threw: ' + e.message); continue }
    if (takeMenu()) leftOpens.push(item)
  }
  ok(leftOpens.length === 0, leftOpens.length
    ? leftOpens.length + ' things open a menu on the LEFT button: ' + leftOpens.join(', ')
    : 'and a left click does the first thing on the list rather than opening it')
}

console.log('\n--- 4. every deed has a noise and a posture ---')
{
  const { doing, silent, voice, still } = ctx.__h.anims()
  // the postures the body actually draws, read out of the drawing and not out
  // of a list beside it
  const drawn = new Set([...html.matchAll(/o\.anim === '([a-z]+)'/g)].map((m) => m[1]))
  for (const m of html.matchAll(/const (?:STOOP|WORK) = \{([^}]*)\}/g))
    for (const k of m[1].matchAll(/([a-z]+)\s*:/g)) drawn.add(k[1])
  const mimed = [...new Set(Object.values(doing))].filter((a) => !drawn.has(a))
  ok(mimed.length === 0, mimed.length
    ? 'postures named in DOING_ANIM that nothing draws: ' + mimed.join(', ')
    : 'all ' + new Set(Object.values(doing)).size + ' postures in DOING_ANIM are drawn by the body')
  // every verb that goes out is either heard or named as silent
  const outgoing = [...new Set([...html.matchAll(/\bdo:\s*'([a-z_]+)'/g)].map((m) => m[1]))]
  const mute = outgoing.filter((v) => !voice.includes(v) && !silent.includes(v))
  ok(mute.length === 0, mute.length
    ? mute.length + ' of ' + outgoing.length + ' verbs make no noise and are not named as silent: ' + mute.join(', ')
    : 'all ' + outgoing.length + ' verbs the window sends are either heard or named as deliberately silent')
  // and the noise is real: count what the graph was asked to build
  const quiet = []
  for (const v of voice) { const n = built.length; ctx.__h.sound(v); if (built.length === n) quiet.push(v) }
  ok(quiet.length === 0, quiet.length ? 'named in ACTION_VOICE but builds nothing: ' + quiet.join(', ')
    : 'and every one of the ' + voice.length + ' voices actually builds an audio graph')
  // AND A POSTURE, by the same argument. DOING_ANIM was a list of what IS
  // drawn, so a verb wired this session was mimed as standing still and
  // nothing noticed. ACTION_STILL is the other half.
  const frozen = outgoing.filter((v) => !doing[v] && !still.includes(v))
  ok(frozen.length === 0, frozen.length
    ? frozen.length + ' of ' + outgoing.length + ' verbs are mimed as standing still and are not '
      + 'named as instant: ' + frozen.join(', ')
    : 'all ' + outgoing.length + ' verbs are either drawn or named as deliberately instant')
  // the deed that was reported as silent and still, by name
  {
    const n = built.length
    ctx.__h.sound('bury')
    const heard = built.length - n
    ctx.__h.seen('bury')
    ok(heard > 0, 'burying makes a noise (' + heard + ' audio nodes)')
    ok(ctx.__h.doing() === 'dig', 'and it is drawn digging, not standing still (posture: '
      + ctx.__h.doing() + ')')
  }
}

console.log('\n--- 5. no table says the same thing twice ---')
{
  // A DUPLICATE KEY IN AN OBJECT LITERAL IS SILENT and the later one wins, so
  // the table and the behaviour disagree and the source reads as though it
  // does not. `mendp` was in DOING_ANIM twice, filed as a bench craft and as
  // sorcery; the drawing had been the second one all along.
  const dupes = []
  for (const name of ['DOING_ANIM', 'ACTION_VOICE', 'ONE_ACTION', 'NODE_LOOK',
    'SCENERY', 'NODE_NAME', 'NODE_GATE', 'MOB_STATS', 'WORN_STATS']) {
    const i = html.indexOf('const ' + name)
    if (i < 0) { dupes.push(name + ' is gone'); continue }
    const a = html.indexOf('{', i)
    let d = 0, j = a
    for (; j < html.length; j++) { if (html[j] === '{') d++; else if (html[j] === '}') { d--; if (!d) break } }
    // ONLY THE TOP LEVEL. A flat scan counted `maxHp` once per creature and
    // reported MOB_STATS as two hundred duplicates of itself; the nesting is
    // the whole difference between a repeated key and a repeated field.
    const blk = html.slice(a + 1, j).split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n')
    const seen = new Set()
    let depth = 0, buf = ''
    for (const ch of blk) {
      if (ch === '{' || ch === '[' || ch === '(') { depth++; buf = ''; continue }
      if (ch === '}' || ch === ']' || ch === ')') { depth--; buf = ''; continue }
      if (depth !== 0) continue
      if (ch === ',' || ch === '\n') { buf = '' }
      else if (ch === ':') {
        const m = buf.match(/'?([A-Za-z_][A-Za-z0-9_-]*)'?\s*$/)
        if (m) { if (seen.has(m[1])) dupes.push(name + '.' + m[1]); seen.add(m[1]) }
        buf = ''
      } else buf += ch
    }
  }
  ok(dupes.length === 0, dupes.length ? 'a key is written twice: ' + dupes.join(', ')
    : 'no key is written twice in any of the nine tables the window keys by word')
}

console.log(bad ? `\n${bad} failure(s).` : '\nevery deed the world offers is reachable.')
process.exit(bad ? 1 : 0)
