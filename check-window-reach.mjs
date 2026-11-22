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
import { makeDocument, penSaid, penInk, penRect } from './window-dom.mjs'

if (E.initCrypto) await E.initCrypto()

const html = readFileSync('window-web.html', 'utf8')
// BOTH SCRIPT BLOCKS, not the first one. `comeHomeWeb` is declared in the
// second and called from `onState` in the first, which is fine in a browser
// -- a function declaration in a classic script is a global, and both blocks
// have run long before a state arrives -- and is a ReferenceError in a
// harness that lifts only one. It is swallowed by the guard around onState
// and reported as "the window hit an error", so a harness that loads half
// the window accuses it of a fault it does not have.
const body = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
  .map((m) => m[1]).join('\n;\n')
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

// ---- the document ----
//
// A REAL ONE, SMALL. This used to be a proxy that answered every question
// with another proxy, which is right for asking "does a frame throw" (which
// is what check-window-panel.mjs asks) and useless for asking "what happens
// when somebody presses this". Half of this window is panels built by setting
// innerHTML and then finding the pieces again, and nothing had ever pressed
// one. See window-dom.mjs.
const doc = makeDocument(html)

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
const winErrors = []
const sent = []
let CLOCK = 1000
const ctx = {
  document: doc,
  // the window swallows a throw in onState into `_noteFrameErr`, which writes
  // to a bar on the page and to console.error. A harness that discards both
  // cannot tell a window that refused a state from one that took it.
  console: { log: noop, warn: noop, error: (...a) => winErrors.push(a.map(String).join(' ')) },
  setTimeout: noop, setInterval: noop, clearTimeout: noop, requestAnimationFrame: noop,
  fetch: () => new Promise(noop),
  WebSocket: function () { this.readyState = 1
    this.send = (r) => { try { const m = JSON.parse(r); if (m.type === 'act') sent.push(m.action) } catch {} }
    this.close = noop; return this },
  localStorage: { getItem: () => null, setItem: noop }, location: { href: '', search: '' },
  navigator: { userAgent: 'node' }, crypto: globalThis.crypto,
  performance: { now: () => CLOCK },
  addEventListener: (t, f) => { (win[t] ||= []).push(f) },
  Image: function () { return el() },
  matchMedia: () => ({ matches: false, addEventListener: noop }),
  innerWidth: 960, innerHeight: 720, devicePixelRatio: 1,
  AudioContext: FakeAC,
  // the window's own connect() reaches for these the moment anything awaits
  // real time, and a missing one kills the whole script rather than the fetch
  AbortController, AbortSignal,
  URL, URLSearchParams, TextEncoder, TextDecoder,
}
ctx.window = ctx
vm.createContext(ctx)
// §6dj: a `let` at the top of a vm script is not on the context object, so the
// only way in is a setter compiled into the same lexical scope.
vm.runInContext(body + `
;globalThis.__said = []
;globalThis.__h = {
  set: (w, i) => { world = w; myId = i },
  // the menu, caught at the one door every menu goes through. floatMenu gets
  // the FINAL list -- heading and 'walk here' included -- which is the thing
  // being tested, so the spy goes here and not on chooseAction.
  spy: () => { let last = null
    floatMenu = (opts) => { last = opts
      for (const o of opts ?? []) {
        if (o && o.head) globalThis.__said.push(o.head)
        if (o && o.label) globalThis.__said.push(o.label)
      }
    }
    return () => { const l = last; last = null; return l } },
  press: (x, y, right) => {
    cam.x = 0; cam.y = 0
    const sx = (x + 0.5) * TILE * ZR, sy = (y + 0.5) * TILE * ZR
    worldPress({ type: right ? 'contextmenu' : 'click', clientX: sx, clientY: sy,
                 preventDefault () {}, target: {} })
  },
  inv: (i, asMenu) => invClick(i, asMenu),
  // the two doors a live pillar answers, and what the window did with them
  takeGround: (gd) => takeGroundTold(gd),
  wet: (x, y) => isWetAt(x, y),
  nearWet: (x, y) => nextToWater(x, y),
  setWH: (w, h) => { W = w; H = h },
  // the act ladder itself, so a captured action can be put through the door
  // the engine actually reads
  bridge: (a) => BRIDGE_TO_INPUT(a),
  held: () => (spellHeld ? spellHeld.v : null),
  hover: (x, y) => { hoverT = x === null ? null : { x, y } },
  // the leaders are worked out once when the pillar answers, so a test that
  // hands the window a seam list by hand has to clear them too, or the
  // chart draws the marks of the list before this one
  seams: (list) => { _seamsTold = list; _seamLeadTold = null },
  chart: (now) => drawSunMap(curState, now),
  // §7eo: and the little chart in the corner, which is baked once per world.
  // NO BACKTICKS IN THIS BLOCK.
  mini: () => { miniReady = false; buildMini() },
  ink: () => SEAM_INK,
  draw: () => drawScene(performance.now()),
  // §7er: draw ONE frame at a chosen instant. A stance is a motion and the
  // only way to see a motion through a fake canvas is to draw it twice at
  // different moments and compare the marks. NO BACKTICKS IN THIS BLOCK.
  drawAt: (t) => drawScene(t),
  bookNow: () => bookOf(world?.players?.[myId]),
  openBook: () => { bookOpen = true; drawBook() },
  // send() returns early unless the socket says it is open, and the window's
  // own socket is never opened here, so without this every press was
  // swallowed and the check reported nought inputs with a straight face.
  // NO BACKTICKS IN THIS BLOCK: it is a template literal.
  openSocket: (w) => { ws = w },
  intent: () => intent,
  // 20e: whether the arm is set, read off the window rather than inferred
  // from what it said. NO BACKTICKS IN THIS BLOCK.
  armed: () => gambitArmed,
  // the window's own front door, so an intent can be discharged the way a
  // tick discharges it rather than by reaching into the machinery
  msg: (m) => onMessage({ data: JSON.stringify(m) }),
  enter: () => { try { entered = true } catch (e) {} },
  clearIntent: () => { intent = null },
  tables: () => ({ marketPlanks: MARKET_PLANKS, marketOre: MARKET_ORE,
    grovePlantLevel: GROVE_PLANT_LEVEL, bucksAt: BUCKS_AT, gravable: [...GRAVABLE],
    nodeGate: NODE_GATE, swearCountries: SWEAR_COUNTRIES_W, prices: Object.keys(PRICES).length }),
  // §7ek: the told walls, and what the window does with them. walled is
  // the window's own reader, tile is its own drawing, and said is the feed it
  // actually wrote: all three asked through the window's doors rather than
  // reasoned about. NO BACKTICKS IN THIS BLOCK, it is a template literal.
  walled: (x, y) => groundWalled(x, y),
  tile: (x, y) => { const c9 = document.createElement('canvas')
    c9.width = 64; c9.height = 64; paintGroundTile(c9.getContext('2d'), x, y) },
  said: () => feedLines.slice(),
  // §0h: the kit, and the guard on it. NO BACKTICKS IN THIS BLOCK.
  kitRows: () => kitRows(),
  kitGive: (item, how) => kitGive(item, how),
  kitHtml: () => { const pan = document.getElementById('kitpanel')
    drawKit(); return pan ? pan.innerHTML : '' },
  inNought: () => !!nought,
  // §0h: STAND IN THE PRACTICE WORLD. The window routes every deed to
  // noughtDo while it is in Nought, so a check that presses from outside is
  // not pressing the path a resident presses. This builds the real thing:
  // the engine the harness already has, a signing key, and a queue the tick
  // drains. NO BACKTICKS IN THIS BLOCK.
  enterNought: (st, E2, key) => {
    nought = { E: E2, state: st, key, inputs: [], wid: E2.worldId(st.genesis) }
    inNought = true; world = st; curState = st
  },
  noughtQueue: () => (nought ? nought.inputs.map((i) => i.type) : []),
  noughtRun: () => { const n9 = nought.inputs.length
    noughtTick(); return n9 },
  noughtState: () => nought && nought.state,
  leaveNought: () => { nought = null; inNought = false },
  // POINT THE WORLD AT THE WINDOW'S OWN PREPARED STATE. set() hands the
  // window the raw object this file built, and onState works on a JSON COPY:
  // every index the state preparation computes -- the node list, the ground
  // stack, which seam in a cluster carries the label -- lives on the copy and
  // not on the original. So a check that set the world by hand was reading a
  // state the window had never prepared, and the cluster labels came back one
  // per tile because the leader set was simply absent.
  // NO BACKTICKS IN THIS BLOCK, it is a template literal.
  useCur: () => { if (curState) world = curState },
  gatherTools: () => GATHER_TOOLS,
  nodeSkill: () => NODE_SKILL,
  hush: () => { feedLines.length = 0; lastFeed = { text: '', at: -1e9 } },
  anims: () => ({ doing: DOING_ANIM, silent: [...ACTION_SILENT], voice: Object.keys(ACTION_VOICE),
    still: [...ACTION_STILL] }),
  sound: (verb) => actionSound(verb),
  wake: () => wakeAudio(),
  doing: () => doingNow(),
  seen: (v) => doingSeen(v),
  mobs: () => MOB_STATS,
  // §7eq: the one bow table, and the two sets that divide the ranged arms
  // between the three drawings. NO BACKTICKS IN THIS BLOCK.
  bows: () => ({ look: BOW_LOOK, ranged: [...RANGED_ITEMS],
    thrown: [...THROWN_ITEMS], shot: [...SHOT_WEAPONS] }),
  priced: () => Object.keys(PRICES),
  equippable: () => [...EQUIPPABLE],
  heals: () => Object.keys(HEALS),
}
`, ctx, { timeout: 30000 })

// a press menu only opens at the pointer when the window knows where the
// pointer was, which is what the global pointerdown is for
for (const f of win.pointerdown ?? []) f({ clientX: 100, clientY: 100, target: {} })
const takeMenu = ctx.__h.spy()
// a socket the window believes in, so `send` gets past its own door
const SOCK = { readyState: 1, close: noop,
  send: (r) => { try { const m = JSON.parse(r); if (m.type === 'act') sent.push(m.action) } catch {} } }
ctx.__h.openSocket(SOCK)
ctx.__h.enter()
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

// through the door, so the tick machinery runs rather than sitting behind a
// gate. The identity has to exist first, which is why this is not up with the
// socket.
ctx.__h.msg({ type: 'hello', playerId: ID })

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

console.log('\n--- 2b. and so does everything else you can press ---')
{
  // A NODE IS NOT THE ONLY THING UNDER A CURSOR. The same question has to be
  // asked of the creatures, the citizens and what is lying on the ground: a
  // beast standing on a pile hid the pile entirely, and a single pile was
  // lifted outright on either button with no menu and no name.
  const MOBS = Object.keys(ctx.__h.mobs ? ctx.__h.mobs() : E.MOB_STATS)
  const bad2 = []
  for (const type of MOBS) {
    const s = fresh()
    s.mobs.m1 = { type, x: 10, y: 11, health: 3, hp: 3 }
    ctx.__h.set(s, ID)
    let opts = null
    try { ctx.__h.press(10, 11, true); opts = takeMenu() }
    catch (e) { bad2.push(type + ' threw ' + e.message); continue }
    if (!opts) { bad2.push(type + ': no menu'); continue }
    if (!opts.some((o) => o && o.head)) bad2.push(type + ': unheaded')
    if (opts.filter((o) => o && !o.head).length < 2) bad2.push(type + ': one choice')
  }
  ok(bad2.length === 0, bad2.length ? bad2.slice(0, 8).join('; ')
    : 'all ' + MOBS.length + ' creatures open a headed menu with more than one thing on it')

  // a creature standing ON a pile: the fault that made a skeleton knight's
  // bones unreachable, because the creature is found first and returns
  {
    const s = fresh()
    s.mobs.m1 = { type: 'goblin', x: 10, y: 11, health: 3, hp: 3 }
    s.ground = { g1: { item: 'bones', qty: 1, x: 10, y: 11 } }
    ctx.__h.set(s, ID)
    ctx.__h.press(10, 11, true)
    const opts = takeMenu() ?? []
    const labels = opts.filter((o) => o && o.label).map((o) => o.label)
    ok(labels.some((l) => /take the bones/.test(l)),
      'a creature standing on a pile does not hide it: ' + labels.join(' / '))
  }
  // one pile on bare ground: offered, not lifted
  {
    const s = fresh()
    s.ground = { g1: { item: 'bones', qty: 1, x: 10, y: 11 } }
    ctx.__h.set(s, ID)
    ctx.__h.press(10, 11, true)
    const opts = takeMenu() ?? []
    ok(opts.some((o) => o && o.head && /bones/.test(o.head))
      && opts.filter((o) => o && !o.head).length >= 2,
      'a single pile is offered rather than lifted, and named: '
        + opts.map((o) => o.head ? '[' + o.head + ']' : o.label).join(' / '))
  }
  // another citizen
  {
    const s = fresh()
    const other = E.generateIdentity()
    E.addPlayer(s, other.playerId, 10, 11)
    s.players[other.playerId].name = 'alder'
    ctx.__h.set(s, ID)
    ctx.__h.press(10, 11, true)
    const opts = takeMenu() ?? []
    ok(opts.some((o) => o && o.head === 'alder') && opts.filter((o) => o && !o.head).length >= 2,
      'a citizen is named and offers more than one thing: '
        + opts.map((o) => o.head ? '[' + o.head + ']' : o.label).join(' / '))
  }
  // AND YOU CAN PRESS YOURSELF, which is where a word that lands on nobody
  // else is spoken. It used to have a button on the book, which gave one row
  // of a list a control the other five did not have.
  {
    const s = fresh()
    s.players[ID].skills.sorcery = E.XP_TABLE[99]
    s.players[ID].inventory[0] = { item: 'sigil', qty: 1 }
    ctx.__h.set(s, ID)
    ctx.__h.press(10, 10, true)
    const labels = (takeMenu() ?? []).filter((o) => o && o.label).map((o) => o.label)
    // §7ek: A SPELL IS CHOSEN IN THE BOOK, and a spell that lands on nobody
    // but you is cast there, because there is nothing to aim. What pressing
    // yourself is for is looking at yourself.
    ok(labels.some((l) => /look at yourself/.test(l)),
      'right-clicking where you stand offers a look at yourself: ' + labels.join(' / '))
  }
  // AND THE APPRENTICESHIP IS ON THAT LIST, which is the deed that could not
  // be begun from this window at all
  {
    const s = fresh()
    const other = E.generateIdentity()
    E.addPlayer(s, other.playerId, 10, 11)
    s.players[other.playerId].name = 'alder'
    ctx.__h.set(s, ID)
    ctx.__h.press(10, 11, true)
    const labels = (takeMenu() ?? []).filter((o) => o && o.label).map((o) => o.label)
    ok(labels.some((l) => /apprentice/.test(l)),
      'and taking somebody on is one of them: ' + labels.join(' / '))
  }
}

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

// ---- 6. and the live pillar's own payload, read by the window's own reader --
//
// Every other section here feeds the window something this file made up. The
// class of fault that made `/api/tables` worth checking at all was a SHAPE
// one: `JSON.stringify(new Set())` is `{}`, so four tables went down the wire
// served, fetched and empty. A number this window now takes from the pillar
// is a number it will show a citizen, so the real payload has to go through
// the real reader at least once.
//
//   node check-window-reach.mjs --live https://interval.place
const live = (() => { const i = process.argv.indexOf('--live'); return i > 0 ? process.argv[i + 1] : null })()
if (live) {
  console.log('\n--- 6. the live pillar, read by the window\u2019s own reader (' + live + ') ---')
  const get = async (path) => {
    const r = await fetch(live + path)
    if (!r.ok) throw new Error(path + ' answered ' + r.status)
    return r.json()
  }
  try {
    const t = await get('/api/tables')
    // the numbers the window now takes rather than guesses
    const want = { marketPlanks: E.MARKET_PLANKS, marketOre: E.MARKET_ORE,
      grovePlantLevel: E.GROVE_PLANT_LEVEL, swearCountries: E.SWEAR_COUNTRIES }
    const wrong = Object.entries(want).filter(([k, v]) => t[k] !== v)
      .map(([k, v]) => k + ' served ' + JSON.stringify(t[k]) + ', engine says ' + v)
    ok(wrong.length === 0, wrong.length ? wrong.join('; ')
      : 'the pillar serves the engine\u2019s own numbers for the four a window used to guess')
    ok(Array.isArray(t.gravable) && t.gravable.length === [...E.GRAVABLE].length,
      'and the stones that take a name survive JSON as a list ('
        + (Array.isArray(t.gravable) ? t.gravable.length : typeof t.gravable) + ')')
    ok(Array.isArray(t.bucksAt) && t.bucksAt.length === E.BUCKS_AT.length,
      'and so does the buck ladder')
    ok(t.nodeGate && Object.keys(t.nodeGate).length === Object.keys(E.NODE_GATE).length,
      'and the seam gates arrive whole ('
        + Object.keys(t.nodeGate ?? {}).length + ' of ' + Object.keys(E.NODE_GATE).length + ')')

    const gd = await get('/api/ground')
    ctx.__h.setWH(gd.w, gd.h)
    const took = ctx.__h.takeGround(gd)
    ok(took !== false, 'the window accepts the ground the pillar serves')
    ok(Array.isArray(gd.water) && gd.water.length > 0,
      'the water is served (' + (gd.water ? gd.water.length : 0) + ' rows)')
    // and the window can answer the question the buck asks. A bitmap that
    // loaded but answers false everywhere is the same as no bitmap at all.
    let wetTiles = 0, shore = 0
    for (const [y, runs] of (gd.water ?? [])) {
      for (const [x0, len] of runs) {
        if (ctx.__h.wet(x0, y)) wetTiles++
        if (x0 > 0 && ctx.__h.nearWet(x0 - 1, y)) shore++
      }
    }
    ok(wetTiles > 0, 'and the window reads it back: ' + wetTiles + ' runs answer wet')
    ok(shore > 0, 'and can say which dry tiles are beside water: ' + shore + ' shores')
  } catch (e) {
    ok(false, 'the live pillar could not be read: ' + e.message)
  }
}

console.log('\n--- 7. and pressing an option builds an input the engine will read ---')
{
  // A MENU THAT OPENS IS NOT A MENU THAT WORKS. Everything above proves the
  // list is there and says the right words; none of it presses anything. The
  // engine answers a malformed input with "unknown field" or "missing field"
  // and the window is never told, so an option with one field named wrong
  // does nothing at all, for ever, in silence. That is the fault that put
  // `special` in this window when the engine had renamed it `gambit`, and the
  // check written for it reads the TYPE and ignores the fields.
  //
  // So: open every menu, press every option on it, catch what the socket was
  // handed, and put it through `validateInputShape` with its fields on.
  const base = { playerId: ID, worldId: WID, tick: 1, sig: 'c'.repeat(128) }
  const malformed = [], threw = []
  const seen = new Set()
  let stateNow = null
  const breathe = () => new Promise((r) => setImmediate(r))
  const pressAll = async (where, open) => {
    let opts = null
    try { open(); opts = takeMenu() } catch (e) { threw.push(where + ' (opening) ' + e.message); return }
    if (!opts) return
    for (const o of opts.filter((x) => x && !x.head && typeof x.act === 'function')) {
      sent.length = 0
      let nested = null
      try { ctx.__h.clearIntent(); o.act(); nested = takeMenu() }
      catch (e) { threw.push(where + ' > "' + o.label + '" ' + e.message); continue }
      // ONE LINE, THEN A LIST (§7y), so a check that stops at the first list
      // never reaches the words. "speak a word at the troll" is one row that
      // opens the book; the spells are on the second page.
      for (const o2 of (nested ?? []).filter((x) => x && !x.head && typeof x.act === 'function')) {
        try { o2.act() } catch (e) { threw.push(where + ' > "' + o.label + '" > "' + o2.label + '" ' + e.message) }
        takeMenu()
      }
      closeAny()
      // AN INTENT IS A DEED THAT HAS NOT GONE YET. Most options here do not
      // send: they set an intent and the next tick turns it into an input
      // once the citizen is standing in the right place. Pressing and
      // reading the socket therefore misses most of the window, so the
      // intent is discharged the way a tick discharges it: by handing the
      // window a state through its own front door.
      const pend = ctx.__h.intent()
      if (pend && !sent.length) {
        try {
          for (let t = 0; t < 3; t++) {
            const s2 = JSON.parse(JSON.stringify(stateNow))
            s2.tick = 100 + t
            ctx.__h.msg({ type: 'state', state: s2, worldId: WID })
            // onMessage finishes in a microtask, so a synchronous probe
            // right after it reads a window that has not taken the state:
            // the first version of this reported every intent as stuck with
            // curState still null.
            await breathe()
          }
        } catch (e) { threw.push(where + ' > "' + o.label + '" on the tick after: ' + e.message) }
        if (process.argv.includes('--why') && !sent.length)
          console.log('      intent ' + pend.kind + ' did not discharge: '
            + JSON.stringify(ctx.__h.probe2())
            + (winErrors.length ? ' | window said: ' + winErrors[winErrors.length - 1].slice(0, 200) : ''))
      }
      for (const a of sent) {
        const k = JSON.stringify(a)
        if (seen.has(k)) continue
        seen.add(k)
        let inp = null
        try { inp = ctx.__h.bridge(a) } catch (e) { malformed.push(where + ' > ' + a.do + ': the act ladder threw ' + e.message); continue }
        if (!inp) { malformed.push(where + ' > "' + o.label + '" sends `' + a.do + '`, which the act ladder has no line for'); continue }
        // validateInputShape answers NULL when the shape is good and a
        // sentence when it is not. The first run of this read null as a
        // complaint and reported forty-seven perfectly good inputs.
        const why = E.validateInputShape({ ...base, ...inp })
        if (typeof why === 'string') malformed.push(where + ' > "' + o.label
          + '" sends ' + JSON.stringify(inp) + ': ' + why)
      }
    }
  }
  // takeMenu only clears what floatMenu caught; a nested menu opened by an
  // option has to be drained too or it is read as the next thing's menu
  const closeAny = () => { takeMenu() }

  for (const type of NODE_TYPES) {
    const s = fresh()
    E.addNode(s, 'n1', type, 10, 11)
    const n = s.nodes.n1
    if (type === 'stall' || type === 'market') n.kind = 'arms'
    if (type === 'keeper' || type === 'guard' || type === 'crier') n.name = 'somebody'
    // enough in the pack that the options that need goods are live ones
    s.players[ID].inventory[0] = { item: 'planks', qty: 20 }
    s.players[ID].inventory[1] = { item: 'iron-ore', qty: 20 }
    s.players[ID].inventory[2] = { item: 'logs', qty: 20 }
    s.players[ID].inventory[3] = { item: 'eel', qty: 2 }
    s.players[ID].inventory[4] = { item: 'coal', qty: 5 }
    s.players[ID].inventory[5] = { item: 'graver', qty: 1 }
    s.players[ID].inventory[6] = { item: 'sapling', qty: 2 }
    s.players[ID].inventory[7] = { item: 'raw-fish', qty: 2 }
    ctx.__h.set(s, ID); stateNow = s
    await pressAll('node ' + type, () => ctx.__h.press(10, 11, true))
  }
  for (const type of Object.keys(ctx.__h.mobs())) {
    const s = fresh()
    s.mobs.m1 = { type, x: 10, y: 11, health: 3, hp: 3 }
    s.ground = { g1: { item: 'bones', qty: 1, x: 10, y: 11 } }
    // A CASTER, so the words on the beast's own page are live rather than
    // dimmed. A dimmed row sends nothing, so a check run by a citizen who
    // cannot cast proves nothing about the spells.
    s.players[ID].skills.sorcery = E.XP_TABLE[99]
    for (let k = 0; k < 4; k++) s.players[ID].inventory[k] = { item: 'sigil', qty: 1 }
    s.players[ID].equipment.weapon = { item: 'bone-staff', qty: 1 }
    s.players[ID].book = (Object.keys(ctx.__h.mobs()).indexOf(type) % 2) ? 'barrow' : 'common'
    ctx.__h.set(s, ID); stateNow = s
    await pressAll('beast ' + type, () => ctx.__h.press(10, 11, true))
  }
  {
    const s = fresh()
    const other = E.generateIdentity()
    E.addPlayer(s, other.playerId, 10, 11)
    s.players[other.playerId].name = 'alder'
    s.players[ID].calling = 'forester'
    s.players[ID].skills.sorcery = E.XP_TABLE[99]
    for (let k = 0; k < 4; k++) s.players[ID].inventory[k] = { item: 'sigil', qty: 1 }
    s.players[ID].equipment.weapon = { item: 'wand', qty: 1 }
    ctx.__h.set(s, ID); stateNow = s
    await pressAll('a citizen', () => ctx.__h.press(10, 11, true))
  }
  // AND YOURSELF, which answers with a look now that the book casts the one
  // spell that lands on nobody else.
  {
    const s = fresh()
    s.players[ID].skills.sorcery = E.XP_TABLE[99]
    s.players[ID].inventory[0] = { item: 'sigil', qty: 1 }
    s.players[ID].health = 10
    ctx.__h.set(s, ID); stateNow = s
    await pressAll('yourself', () => ctx.__h.press(10, 10, true))
  }
  for (const item of [...new Set([...ctx.__h.priced(), ...ctx.__h.equippable(), ...ctx.__h.heals(),
    'bones', 'dragon-bones', 'logs', 'sigil', 'quick-stone', 'chart', 'rubble', 'arrows',
    'fire-arrows', 'lamprey-spit'])]) {
    const s = fresh()
    s.players[ID].inventory[0] = { item, qty: 3 }
    s.players[ID].inventory[1] = { item: 'ironbark', qty: 3 }
    s.players[ID].inventory[2] = { item: 'steel', qty: 3 }
    ctx.__h.set(s, ID); stateNow = s
    await pressAll('holding ' + item, () => ctx.__h.inv('0', true))
  }
  ok(threw.length === 0, threw.length
    ? threw.length + ' options threw when pressed: ' + threw.slice(0, 6).join(' | ')
    : 'no option threw when it was actually pressed')
  ok(malformed.length === 0, malformed.length
    ? malformed.length + ' build an input the engine refuses at the door: ' + malformed.slice(0, 6).join(' | ')
    : 'all ' + seen.size + ' distinct inputs the menus build pass the engine\u2019s own shape check')

}

console.log('\n--- 8. and the panels, which nothing had ever pressed ---')
{
  // HALF THIS WINDOW IS NOT A MENU. The bank, the counter, the anvil, the
  // trade table, the spellbook, the worn slots and the skill guide are built
  // by writing HTML into a pane and finding the pieces again, and no check
  // had ever clicked one of them: the harness every other checker uses
  // answers `querySelectorAll` with an empty list on purpose.
  const base = { playerId: ID, worldId: WID, tick: 1, sig: 'c'.repeat(128) }
  const threw = [], malformed = [], pressed = []
  const press = (where, sel, prepare) => {
    let st = null
    try { st = prepare() } catch (e) { threw.push(where + ' (setting up) ' + e.message); return }
    ctx.__h.set(st, ID)
    try { ctx.panel(st) } catch (e) { threw.push(where + ' (drawing the panel) ' + e.message); return }
    const els = doc.querySelectorAll(sel)
    if (!els.length) { threw.push(where + ': the panel drew no ' + sel); return }
    for (const el of els) {
      sent.length = 0
      // TWICE. Two of these controls are deliberately double-tap: setting a
      // container down forfeits the route and asks again first, and a worn
      // slot names the gear on the first tap and takes it off on the second.
      // Pressing once reads both as dead.
      try { el.click(); el.click() }
      catch (e) { threw.push(where + ' ' + sel + '=' + el.getAttribute(sel.slice(1, -1)) + ': ' + e.message); continue }
      // A PANE CONTROL MAY ASK BEFORE IT ACTS. Releasing a consignment
      // forfeits the route, so it opens a menu rather than doing it, and a
      // check that reads the socket straight after the click sees nothing
      // and calls the control dead. Follow into whatever it opened.
      const asked = takeMenu()
      for (const o of (asked ?? []).filter((x) => x && !x.head && typeof x.act === 'function')) {
        try { o.act() } catch (e) { threw.push(where + ' > "' + o.label + '": ' + e.message) }
        takeMenu()
      }
      for (const a of sent) {
        pressed.push(a.do)
        let inp = null
        try { inp = ctx.__h.bridge(a) } catch (e) { malformed.push(where + ': the act ladder threw on ' + a.do); continue }
        if (!inp) { malformed.push(where + ' sends `' + a.do + '`, which the act ladder has no line for'); continue }
        const why = E.validateInputShape({ ...base, ...inp })
        if (typeof why === 'string') malformed.push(where + ' sends ' + JSON.stringify(inp) + ': ' + why)
      }
    }
  }
  const beside = (type, extra) => () => {
    const st = fresh()
    E.addNode(st, 'p1', type, 10, 11)
    if (extra) extra(st, st.nodes.p1)
    return st
  }

  press('the vault', '[data-wd]', beside('vault', (st) => {
    st.players[ID].vaults = { logs: 5, 'iron-ore': 3 }
  }))
  press('the vault, all of it', '[data-wdall]', beside('vault', (st) => {
    st.players[ID].vaults = { logs: 5 }
    st.players[ID].inventory[0] = { item: 'logs', qty: 1 }
  }))
  press('the counter', '[data-consign]', beside('store', (st) => {
    st.players[ID].inventory[0] = { item: 'logs', qty: 3 }
  }))
  press('the counter, mid route', '[data-release]', beside('store', (st) => {
    st.players[ID].consignment = { from: 'p1', route: ['p1'], leg: 0,
      items: [{ item: 'logs', qty: 3 }, ...Array(11).fill(null)] }
  }))
  press('the counter, at the end', '[data-deliver]', beside('store', (st) => {
    st.players[ID].consignment = { from: 'p1', route: ['p1'], leg: 1,
      items: [{ item: 'logs', qty: 3 }, ...Array(11).fill(null)] }
  }))
  press('the anvil', '[data-recipe]', beside('anvil', (st) => {
    st.players[ID].inventory[0] = { item: 'iron', qty: 9 }
    st.players[ID].inventory[1] = { item: 'logs', qty: 9 }
    st.players[ID].inventory[2] = { item: 'steel', qty: 9 }
  }))
  press('the table', '[data-tup]', () => {
    const st = fresh()
    const them = E.generateIdentity()
    E.addPlayer(st, them.playerId, 10, 11)
    st.players[them.playerId].name = 'alder'
    st.players[ID].inventory[0] = { item: 'logs', qty: 2 }
    // a good already ON the table: `data-tup` is drawn for what is up, so an
    // empty side draws no control and the pane looks unpressable
    st.players[ID].trade = { with: them.playerId, slots: [0], gold: 0, settled: false }
    st.players[them.playerId].trade = { with: ID, slots: [], gold: 0, settled: false }
    return st
  })
  press('the worn slots', '[data-worn]', () => {
    const st = fresh()
    st.players[ID].equipment.weapon = { item: 'iron-sword', qty: 1 }
    return st
  })
  // THE BOOK, which has to be opened first
  press('the spellbook', '[data-sp]', () => {
    const st = fresh()
    st.players[ID].skills.sorcery = E.XP_TABLE[99]
    for (let i = 0; i < 4; i++) st.players[ID].inventory[i] = { item: 'sigil', qty: 1 }
    st.players[ID].equipment.weapon = { item: 'wand', qty: 1 }
    ctx.__h.set(st, ID)
    try { ctx.drawBook() } catch (e) {}
    const b = doc.getElementById('bookbtn')
    try { b.click() } catch (e) {}
    return st
  })
  ok(threw.length === 0, threw.length
    ? threw.length + ' panel controls would not answer: ' + threw.slice(0, 8).join(' | ')
    : 'every pane drew its controls and every one of them answered a press')
  ok(malformed.length === 0, malformed.length
    ? malformed.length + ' build an input the engine refuses: ' + malformed.slice(0, 6).join(' | ')
    : 'and what they build passes the engine\u2019s shape check ('
      + [...new Set(pressed)].sort().join(', ') + ')')
  // AND THE BOOK CASTS. `cast` is built by nothing else now: the spell that
  // lands on nobody but you is spoken from the book, where it is chosen. If
  // the tiles ever stopped answering, mending would be unreachable and every
  // other check here would still be green.
  ok(pressed.includes('cast'), pressed.includes('cast')
    ? 'and pressing the book casts the spell that lands on you'
    : 'the book no longer casts anything: nothing built a `cast`')
}

console.log('\n--- 8b. hold a spell, then click what it lands on ---')
{
  // THE WHOLE INTERACTION, END TO END. A tile is pressed, a target is
  // pressed, and the input that goes out is read. Nothing above tests this:
  // section 8 presses the tiles and section 7 presses the targets, and the
  // thing being built here is what happens BETWEEN them.
  const base = { playerId: ID, worldId: WID, tick: 1, sig: 'c'.repeat(128) }
  const caster = (book, weapon) => {
    const st = fresh()
    st.players[ID].skills.sorcery = E.XP_TABLE[99]
    for (let k = 0; k < 4; k++) st.players[ID].inventory[k] = { item: 'sigil', qty: 1 }
    st.players[ID].equipment.weapon = { item: weapon, qty: 1 }
    st.players[ID].book = book
    return st
  }
  const holdAndPress = (where, book, weapon, name, aim) => {
    const st = caster(book, weapon)
    aim.set?.(st)
    ctx.__h.set(st, ID)
    // the panel's own open flag, not a guess at it: section 8 presses the
    // button too, so a local idea of whether it is open goes stale and the
    // tiles read back are whatever was drawn last
    try { ctx.__h.openBook() } catch (e) {}
    const tile = doc.querySelectorAll('[data-sp]').find((t) =>
      t.textContent.trim() === name)
    if (!tile) { ok(false, where + ': the book has no tile called ' + name
      + ' (the book is ' + ctx.__h.bookNow() + ' and has '
      + doc.querySelectorAll('[data-sp]').map((t) => t.textContent.trim()).join(', ') + ')'); return }
    sent.length = 0
    tile.click()
    // NOT "nothing was sent": a tile that refused the press sends nothing
    // too, and the first version of this read that as success.
    const held = ctx.__h.held()
    ok(held !== null && sent.length === 0,
      where + ': pressing ' + name + ' holds it rather than casting into the air'
      + (held === null ? ' (nothing is held; the window said: '
        + String(doc.getElementById('feed')?.innerHTML ?? '').replace(/<[^>]*>/g, ' ').slice(-140) + ')' : ''))
    aim.press()
    const a = sent[sent.length - 1]
    if (!a) { ok(false, where + ': clicking the target cast nothing. The window said: '
      + String(doc.getElementById('feed')?.innerHTML ?? '').replace(/<[^>]*>/g, ' ').slice(-180)); return }
    const inp = ctx.__h.bridge(a)
    const why = inp ? E.validateInputShape({ ...base, ...inp }) : 'the act ladder has no line for ' + a.do
    ok(typeof why !== 'string', where + ': it goes out as '
      + JSON.stringify(inp ?? a) + (typeof why === 'string' ? ' which the engine refuses: ' + why : ''))
  }
  let bookIsOpen = false
  // the panel has to be open for the tiles to exist; the button toggles it
  {
    const st = caster('common', 'wand')
    ctx.__h.set(st, ID)
    try { ctx.drawBook(); doc.getElementById('bookbtn').click(); ctx.drawBook() } catch (e) {}
    bookIsOpen = doc.querySelectorAll('[data-sp]').length > 0
    ok(bookIsOpen, 'the book opens on the button (' + doc.querySelectorAll('[data-sp]').length + ' tiles)')
  }
  // A TILE YOU CANNOT CAST FROM LOOKS DIFFERENT, and that is the only thing
  // carrying the information now that the cost and the reach are off the
  // face of it. If the dim ever stopped being applied, the book would say
  // every spell is yours and the refusals would arrive one press later.
  {
    const st = caster('common', 'iron-sword')   // no instrument in hand at all
    ctx.__h.set(st, ID)
    try { ctx.__h.openBook() } catch (e) {}
    const tiles = doc.querySelectorAll('[data-sp]')
    const look = (nm) => (tiles.find((t) => t.textContent.trim() === nm)
      ?.getAttribute('style') ?? '')
    const dim = (nm) => /var\(--dim\)/.test(look(nm))
    ok(dim('the sealing') && dim('the unmaking') && dim('transmute'),
      'a spell you cannot cast is drawn dim (sealing '
        + dim('the sealing') + ', unmaking ' + dim('the unmaking')
        + ', transmute ' + dim('transmute') + ')')
    ok(!dim('mend') && !dim('the stilling'),
      'and one you can is not')
  }
  holdAndPress('at a beast', 'barrow', 'bone-staff', 'the rot', {
    set: (st) => { st.mobs.m1 = { type: 'goblin', x: 10, y: 11, health: 5, hp: 5 } },
    press: () => ctx.__h.press(10, 11, false),
  })
  holdAndPress('at a citizen', 'common', 'wand', 'mend another', {
    set: (st) => { const o = E.generateIdentity(); E.addPlayer(st, o.playerId, 10, 11)
      st.players[o.playerId].name = 'alder' },
    press: () => ctx.__h.press(10, 11, false),
  })
  holdAndPress('on a pile', 'common', 'goo-staff', 'the sealing', {
    set: (st) => { st.ground = { g1: { item: 'logs', qty: 1, x: 10, y: 11, by: 'x'.repeat(64) } } },
    press: () => ctx.__h.press(10, 11, false),
  })
  holdAndPress('on a thing you carry', 'common', 'staff', 'transmute', {
    set: (st) => { st.players[ID].inventory[5] = { item: 'logs', qty: 1 } },
    press: () => ctx.__h.inv('5', false),
  })
}

console.log('\n--- 8g. the chart marks the seams ---')
{
  // THE ISLAND CARRIES ONE CLUSTER PER TIER ON PURPOSE and somebody walked
  // the Greenwood end to end without finding a single cuttable tree. Nine
  // plain trees stand on the whole island, in a copse seven tiles wide,
  // among two thousand decorative ones that look the same at a distance.
  //
  // The marks went into `drawMini` first, which is thirty-five lines that
  // nothing has ever called: the live chart is `drawSunMap`, its own canvas
  // over the view. Dead code that looks like the thing you are reading is
  // worse than no code. This reads back the INK the chart actually laid down.
  const st = fresh()
  ctx.__h.msg({ type: 'state', state: st, worldId: WID })
  await new Promise((r) => setImmediate(r))
  ctx.__h.set(st, ID)
  const INK = ctx.__h.ink()
  ctx.__h.seams([['tree', 11, 10], ['iron-rock', 12, 10], ['fishing-spot', 9, 10]])
  penInk.length = 0
  let threw = null
  try { ctx.__h.chart(CLOCK + 9999) } catch (e) { threw = e.message }
  ok(!threw, threw ? 'drawing the chart threw: ' + threw : 'the chart draws')
  const want = [INK.tree, INK.rock, INK['fishing-spot']]
  const got = want.filter((c) => penInk.includes(c))
  ok(got.length === want.length,
    got.length === want.length
      ? 'and a tree, a seam and a fishing spot are each marked on it in their own ink'
      : 'the chart laid down ' + got.length + ' of the 3 seam inks (it used: '
        + [...new Set(penInk)].slice(0, 10).join(' ') + ')')
  // and the window asks the pillar for them rather than working them out
  ok(/api\/seams/.test(html), 'and it asks the pillar where they are')
  ctx.__h.seams(null)
}

console.log('\n--- 8h. the chart marks what is worth being afraid of ---')
{
  // THE BOSS LIST IS ARITHMETIC, NOT A LIST SOMEBODY KEEPS. A creature the
  // world takes twenty minutes or more to put back is not one you meet twice
  // in an evening, and that is the whole definition. Held to the engine's own
  // numbers so a beast whose respawn is retuned joins or leaves the set on
  // the day it is retuned.
  const mobs = ctx.__h.mobs()
  const want = new Set(Object.entries(mobs)
    .filter(([, v]) => (v.respawn ?? 0) >= 1200).map(([k]) => k))
  const mine = (() => {
    const i = html.indexOf('const BOSSES = new Set(')
    const a = html.indexOf('[', i)
    return new Set(Function('return ' + html.slice(a, html.indexOf(']', a) + 1))())
  })()
  const off = [...want].filter((b) => !mine.has(b)).map((b) => b + ' is not marked')
    .concat([...mine].filter((b) => !want.has(b)).map((b) => b + ' is marked and comes back inside twenty minutes'))
  ok(off.length === 0, off.length ? off.join('; ')
    : 'the chart marks the ' + want.size + ' the world is slowest to put back: ' + [...want].join(', '))
  // and it marks one, in your own country, and not one across a border
  const st = fresh()
  const boss = [...want][0]
  st.mobs.b1 = { type: boss, x: 11, y: 10, health: 9, hp: 9 }
  ctx.__h.msg({ type: 'state', state: st, worldId: WID })
  await new Promise((r) => setImmediate(r))
  ctx.__h.set(st, ID)
  ctx.__h.seams(null)
  penInk.length = 0
  try { ctx.__h.chart(CLOCK + 31337) } catch (e) { ok(false, 'the chart threw: ' + e.message) }
  ok(penInk.includes('#e8452e'), penInk.includes('#e8452e')
    ? 'and a ' + boss + ' standing beside you is marked on it'
    : 'a ' + boss + ' beside you is not marked (the chart used: '
      + [...new Set(penInk)].slice(0, 8).join(' ') + ')')
}

console.log('\n--- 8f. the oath is where somebody would look for it ---')
{
  // ONE MASTERY TO A CITIZEN is the centre of this world, and swearing was
  // three presses inside a panel: open SKILLS, find the trade, read to the
  // bottom. It is the one deed whose target is who you are, so it belongs on
  // yourself.
  const st = fresh()
  for (const k of Object.keys(st.players[ID].skills)) st.players[ID].skills[k] = 0
  st.players[ID].skills.woodcraft = E.XP_TABLE[90]
  st.players[ID].walked = ['a', 'b', 'c', 'd', 'e', 'f']
  delete st.players[ID].calling
  ctx.__h.set(st, ID)
  ctx.__h.press(10, 10, true)
  const opts = takeMenu() ?? []
  const row = opts.find((o) => o && /swear a calling/.test(o.label ?? ''))
  ok(!!row && !row.dim, 'right-clicking where you stand offers the oath: '
    + opts.filter((o) => o && o.label).map((o) => o.label).join(' / '))
  if (row && !row.dim) {
    sent.length = 0
    row.act()
    const page = takeMenu() ?? []
    const one = page.find((o) => o && /^swear /.test(o.label ?? ''))
    ok(!!one, 'and it opens the callings that trade has earned: '
      + page.filter((o) => o && o.label).map((o) => o.label).join(' / '))
    if (one) {
      one.act()
      const ask = takeMenu() ?? []
      const yes = ask.find((o) => o && /^swear it/.test(o.label ?? ''))
      if (yes) yes.act()
      const a = sent[sent.length - 1]
      const inp = a ? ctx.__h.bridge(a) : null
      const why = inp ? E.validateInputShape({ playerId: ID, worldId: WID, tick: 1,
        sig: 'c'.repeat(128), ...inp }) : 'nothing was sent'
      ok(typeof why !== 'string', 'and swearing it goes out as ' + JSON.stringify(inp ?? a)
        + (typeof why === 'string' ? ' which the engine refuses: ' + why : ''))
    }
  }
}

console.log('\n--- 8e. somebody with a name is called by it ---')
{
  // THE HEAD SAID "KEEPER" TO EVERY KEEPER ON THE ISLAND. The window knew
  // their names -- it printed them in the feed the moment you talked to one
  // -- and threw them away one line earlier, because the head was built from
  // the node's TYPE. A hundred and fifty-seven people called "keeper".
  const named = []
  for (const [type, nm] of [['keeper', 'Sim Crossingman'], ['guard', 'Ebb Watchful'],
    ['crier', 'Wat Loudly']]) {
    const st = fresh()
    E.addNode(st, 'n1', type, 10, 11)
    st.nodes.n1.name = nm
    if (type === 'keeper') st.nodes.n1.kind = 'toll'
    ctx.__h.set(st, ID)
    ctx.__h.press(10, 11, true)
    const opts = takeMenu() ?? []
    const head = opts.find((o) => o && o.head)?.head
    const labels = opts.filter((o) => o && o.label).map((o) => o.label)
    if (head !== nm) named.push(type + ' is headed "' + head + '" and not "' + nm + '"')
    // and a name takes no article
    const art = labels.find((l) => l.includes('the ' + nm))
    if (art) named.push(type + ': "' + art + '"')
  }
  ok(named.length === 0, named.length ? named.join('; ')
    : 'a keeper, a guard and a crier are each headed with their own name, and no article')
}

console.log('\n--- 8c. every creature has a look, and no look is a stat line ---')
{
  // §6bv: A LOOK SAYS WHAT A THING IS, NOT WHAT IT HITS FOR. The first cut
  // read the numbers out of MOB_STATS, which is the one thing a look must not
  // do: how hard a thing hits and how close it has to be before it starts are
  // found out by meeting it. A creature with no line falls back on "it stands
  // there", which is the fallback-that-draws-a-real-thing trap, so the table
  // is held to the engine's own roster rather than to whatever the island
  // happened to grow.
  const look = (() => {
    const i = html.indexOf('const MOB_LOOK = {')
    const a = html.indexOf('{', i)
    let d = 0, j = a
    for (; j < html.length; j++) { if (html[j] === '{') d++; else if (html[j] === '}') { d--; if (!d) break } }
    return Function('return ' + html.slice(a, j + 1))()
  })()
  const beasts = Object.keys(ctx.__h.mobs())
  const missing = beasts.filter((b) => !look[b])
  const phantom = Object.keys(look).filter((b) => !beasts.includes(b))
  ok(missing.length === 0, missing.length
    ? missing.length + ' creatures have no look: ' + missing.join(', ')
    : 'all ' + beasts.length + ' creatures say what they are')
  ok(phantom.length === 0, phantom.length
    ? 'described but not in this world: ' + phantom.join(', ')
    : 'and nothing is described that this world does not have')
  // and not one of them recites a number
  const numeric = Object.entries(look).filter(([, t]) => /\b\d+\b/.test(String(t)))
  ok(numeric.length === 0, numeric.length
    ? numeric.length + ' looks recite a number: ' + numeric.map(([k]) => k).join(', ')
    : 'and not one of them recites a number')
}

console.log('\n--- 8d. what the window writes on a creature ---')
{
  // §6bv, THE LAST PLACE IT WAS STILL BEING SAID. The look stopped reciting a
  // creature's numbers and the spellbook stopped printing a reach, and the
  // HOVER PLATE went on saying "goblin 3/5 hp hits 1" to anybody who moved a
  // cursor over one. A rule kept in two places out of three is not a rule.
  //
  // Read off the pen rather than out of the source: this is every word the
  // window actually wrote while drawing a frame with a creature under the
  // cursor, which is the thing a citizen sees.
  const st = fresh()
  st.mobs.m1 = { type: 'skeleton-knight', x: 11, y: 10, health: 9, hp: 9 }
  // THROUGH THE FRONT DOOR. `drawScene` reads `curState`, which only a state
  // frame sets: setting `world` by hand leaves the scene drawing the last
  // thing it was told, and the first run of this read back a frame with no
  // creature in it at all and called that a pass.
  ctx.__h.msg({ type: 'state', state: st, worldId: WID })
  await new Promise((r) => setImmediate(r))
  ctx.__h.set(st, ID)
  ctx.__h.hover(11, 10)
  penSaid.length = 0
  let threw = null
  try { ctx.__h.draw() } catch (e) { threw = e.message }
  ok(!threw, threw ? 'drawing a frame with a creature hovered threw: ' + threw
    : 'a frame with a creature under the cursor draws')
  const said = [...new Set(penSaid)]
  ok(said.includes('skeleton knight'),
    'and it writes the creature\u2019s name, with spaces (' + said.join(' | ').slice(0, 90) + ')')
  // the two shapes a stat line takes: a fraction, and a "hits N"
  const stats = said.filter((t) => /\d+\s*\/\s*\d+/.test(t) || /\bhits?\s+\d/.test(t))
  ok(stats.length === 0, stats.length
    ? 'it also writes its numbers: ' + stats.join(' | ')
    : 'and not its hitpoints, and not what it hits for')
  // AND NOTHING THE WINDOW WRITES ON THE WORLD IS A SYMBOL EITHER. Section 10
  // reads the menus; this reads the canvas. The level-up banner was flanked
  // with a sparkle emoji in three places, inside a gold rule, beside the
  // skill's own mark: a glyph from somebody else's alphabet in the middle of
  // this one's.
  const KEEP8 = new Set(['\u2019', '\u2026'])
  const glyphs = said.filter((t) => [...t].some((c) => c.charCodeAt(0) > 126 && !KEEP8.has(c)))
  ok(glyphs.length === 0, glyphs.length
    ? glyphs.length + ' things the window writes on the world are symbols: ' + glyphs.join(' | ')
    : 'and nothing it writes on the world is a symbol')
  ctx.__h.hover(null)
}

console.log('\n--- 8i. the ground a citizen cannot walk on says so ---')
{
  // "I arrive at the Crags and then I just am unable to walk basically, it
  // looks like just rocky ground. Actually I am just stuck and it is really
  // bad there, I am even walking on the grass next to the biome now and still
  // am getting stuck for seemingly no reason."
  //
  // Three thousand and forty-nine tiles of the island are dry land nobody can
  // stand on, and the window knew about NONE of them: its `blockedAt` read
  // the node list and nothing else. The world says so plainly -- `blockedAt`
  // is in the geography hash and `groundKindAt` answers null on 3,039 of them
  // because a cliff is not a surface -- and the window drew its fallback,
  // which is grass. The Barrow is a solid ellipse 52 tiles by 30 with no way
  // into it, and it was painted as a meadow.
  //
  // Three things have to hold, and each is asked of the window rather than
  // reasoned about: it is TOLD, it DRAWS it, and it SAYS SO when pressed.
  const st = fresh()
  ctx.__h.msg({ type: 'state', state: st, worldId: WID })
  await new Promise((r) => setImmediate(r))
  ctx.__h.set(st, ID)
  // a ridge two tiles wide down the middle of the little harness island
  const took = ctx.__h.takeGround({ w: 40, h: 30, rows: [],
    biomes: [[10, [[0, 40, 'crags']]], [11, [[0, 40, 'crags']]]],
    blocked: [[10, [[18, 2]]], [11, [[18, 2]]]] })
  ok(took, took ? 'the window takes the walls the pillar serves'
    : 'the window refused a ground payload carrying walls')
  ok(ctx.__h.walled(18, 10) && !ctx.__h.walled(17, 10),
    ctx.__h.walled(18, 10) && !ctx.__h.walled(17, 10)
      ? 'and it knows the ridge is a ridge and the ground beside it is not'
      : 'the window reads the walls back wrong: 18,10 walled='
        + ctx.__h.walled(18, 10) + ' 17,10 walled=' + ctx.__h.walled(17, 10))
  // AND IT DRAWS IT. The first draft of the step painted into `cx`, the live
  // world canvas, while every other line of paintGroundTile paints into the
  // bake: the lip went onto the frame and the baked patch covered it on the
  // same tick, so the window reported 138 walls under the citizen and the
  // photograph showed plain grass. Ink laid on a wall tile, against ink laid
  // on the ground beside it.
  penInk.length = 0
  ctx.__h.tile(17, 10)
  const plain = [...new Set(penInk)]
  penInk.length = 0
  ctx.__h.tile(18, 10)
  const wall = [...new Set(penInk)]
  const extra = wall.filter((c) => !plain.includes(c))
  ok(extra.length > 0, extra.length
    ? 'and it draws the wall in ' + extra.length + ' inks it never uses on open ground'
    : 'a wall tile is drawn in exactly the inks of the ground beside it, so it is invisible')
  // the lip is the part a player learns once, so it has to be there
  ok(wall.includes('rgba(10,9,7,0.78)') || wall.includes('rgba(10,9,7,.78)'),
    wall.some((c) => /10, ?9, ?7/.test(c))
      ? 'and the step has its lip where it meets ground somebody can stand on'
      : 'the step has no lip (it drew: ' + wall.slice(0, 8).join(' ') + ')')
  // AND IT SAYS SO. A press that returns in silence is indistinguishable
  // from a window that has stopped listening.
  ctx.__h.hush()
  sent.length = 0
  ctx.__h.press(18, 10, false)
  const said = ctx.__h.said().join(' ')
  ok(/too steep/.test(said), /too steep/.test(said)
    ? 'and a press on it answers: ' + ctx.__h.said()[0]
    : 'a press on a wall did not say why (feed: ' + (said || 'empty') + ')')
  ok(!sent.some((a) => a && a.do === 'walk'),
    !sent.some((a) => a && a.do === 'walk')
      ? 'and it files no walk into a place the engine will refuse'
      : 'the window filed a walk into a wall')
  // §7eo: AND THE CHART SHOWS IT TOO. "The barrow's mound was not visible on
  // the minimap."
  //
  // The same fault as the one above, one layer out and three thousand tiles
  // wide. The chart was baked from `terrainOf` alone and a wall is NOT a
  // surface: the mound is 1,225 tiles, every one blocked, every one answering
  // null, so the chart painted a hill nobody can climb as a field. The Ridge,
  // every cliff and every town wall were missing from it for the same reason.
  //
  // Asked of the ink the chart actually lays on the ridge tile against the
  // ink it lays on the ground beside it, because that is the whole question:
  // can you tell them apart by looking.
  {
    ctx.__h.setWH(40, 30)
    penInk.length = 0
    let threw2 = null
    try { ctx.__h.mini() } catch (e) { threw2 = e.message }
    ok(!threw2, threw2 ? 'baking the chart threw: ' + threw2 : 'the chart bakes')
    // The surface pass lays one fill per tile in row order, then the wall pass
    // lays one more on each walled tile. So the chart's answer about a wall is
    // whatever came AFTER the first w*h fills, and reading the grid by index
    // alone asks the surface pass what it thinks of a wall, which is nothing.
    const SURF = 40 * 30
    const beside = penInk[10 * 40 + 17]
    const extra = penInk.slice(SURF)
    ok(extra.length === 4,
      extra.length === 4
        ? 'and it goes back over the 4 tiles of the ridge'
        : 'the chart laid ' + extra.length + ' marks on walls where 4 tiles are walled')
    const same = extra.filter((c) => c === beside)
    ok(extra.length > 0 && same.length === 0,
      extra.length && !same.length
        ? 'and paints them (' + [...new Set(extra)].join(', ') + ') unlike the ground '
          + 'beside them (' + beside + ')'
        : 'the chart paints a wall exactly as it paints the field next to it ('
          + beside + '), so nothing impassable is on it')
  }
  ctx.__h.takeGround({ w: 40, h: 30, rows: [], biomes: [], blocked: [] })
}

console.log('\n--- 8j. a citizen can stop following ---')
{
  // "I clicked fall in behind another citizen and I cannot interrupt it. I
  // try clicking elsewhere but I just keep following, and then suddenly
  // teleporting a little and it is just really bugged."
  //
  // The engine moves a follower one step a tick toward whoever they are
  // behind AND CLEARS THEIR ACTION doing it, so a following citizen cannot
  // walk anywhere: every step they file is undone before it lands, and the
  // catch-up step reads as a teleport. Nothing in the window ever sent
  // `unfollow` except one row of a menu on the other citizen, who by then is
  // walking away. Pressing the ground is somebody saying they want to go
  // somewhere themselves, so it ends the follow.
  const st = fresh()
  const them = E.generateIdentity()
  E.addPlayer(st, them.playerId, 12, 10)
  st.players[ID].following = them.playerId
  ctx.__h.msg({ type: 'state', state: st, worldId: WID })
  await new Promise((r) => setImmediate(r))
  ctx.__h.set(st, ID)
  ctx.__h.hush()
  sent.length = 0
  ctx.__h.press(15, 15, false)
  ok(sent.some((a) => a && a.do === 'unfollow'),
    sent.some((a) => a && a.do === 'unfollow')
      ? 'pressing the ground while following sends unfollow'
      : 'pressing the ground while following sent ' + JSON.stringify(sent.map((a) => a && a.do)))
  ok(/stop following/.test(ctx.__h.said().join(' ')),
    /stop following/.test(ctx.__h.said().join(' '))
      ? 'and says so: ' + ctx.__h.said().find((l) => /stop following/.test(l))
      : 'and said nothing about it')
  // and it is on your own menu too, because somebody who wants to stop may
  // not be able to reach the citizen they are behind
  const st2 = fresh()
  st2.players[ID].following = them.playerId
  E.addPlayer(st2, them.playerId, 30, 20)
  ctx.__h.msg({ type: 'state', state: st2, worldId: WID })
  await new Promise((r) => setImmediate(r))
  ctx.__h.set(st2, ID)
  const grab = ctx.__h.spy()
  ctx.__h.press(10, 10, true)
  const mine = grab() ?? []
  const row = mine.find((o) => o && /stop following/i.test(o.label ?? ''))
  ok(!!row, row ? 'and your own menu offers to stop'
    : 'your own menu does not offer to stop following (it offered: '
      + mine.map((o) => o && (o.head ?? o.label)).filter(Boolean).join(', ') + ')')
}

console.log('\n--- 8l. a ground that wants a tool says so ---')
{
  // "When trying to mine rocks, cut tree, fish fishing spot etc. and you do
  // not have the tool, it should say you need it instead of just silent
  // failure. I tried now to mine rockfall and it said in the log that I swing
  // my pickaxe at it, but I am not wielding one."
  //
  // This founding is tool-gated. The engine refuses a gather unless the right
  // tool is WIELDED (§6bd settled "in the hand, not in the pack", because a
  // gate counting the pack and a bonus counting the hand are two rules about
  // one axe disagreeing), and it refuses in SILENCE. The window went on
  // saying "you swing your axe at the tree" to somebody holding nothing,
  // every press, while the world did not move.
  //
  // The level gate had the same hole and worse: it was written here once, for
  // quick-rock alone, against a hand-typed 70 while the served table asks 78.
  // One of thirteen gated grounds checked, and that one quoting the wrong
  // number.
  const toolFor = ctx.__h.gatherTools()
  const skillOf = ctx.__h.nodeSkill()
  ok(Object.keys(skillOf).length >= Object.keys(E.NODE_YIELD).filter((t) => E.NODE_YIELD[t].skill).length,
    'the window knows which trade each of the ' + Object.keys(skillOf).length + ' worked grounds pays')
  for (const [sk, list] of Object.entries(toolFor)) {
    const want = [...(E.GATHER_TOOLS[sk] ?? [])]
    ok(want.length === list.length && want.every((w) => list.includes(w)),
      want.length === list.length && want.every((w) => list.includes(w))
        ? 'and ' + sk + ' wants the engine’s own ' + list.length + ' tools'
        : sk + ': the window wants ' + list.join(',') + ', the engine ' + want.join(','))
  }
  // bare-handed at a tree: it says so and files nothing
  const bare = fresh()
  bare.nodes.t1 = { type: 'tree', x: 10, y: 11 }
  ctx.__h.msg({ type: 'state', state: bare, worldId: WID })
  await new Promise((r) => setImmediate(r))
  ctx.__h.set(bare, ID)
  ctx.__h.hush(); sent.length = 0
  ctx.__h.press(10, 11, false)
  ok(/need an axe/.test(ctx.__h.said().join(' ')),
    /need an axe/.test(ctx.__h.said().join(' '))
      ? 'bare-handed at a tree: "' + ctx.__h.said()[0] + '"'
      : 'bare-handed at a tree the window said: ' + (ctx.__h.said().join(' / ') || 'nothing'))
  ok(!sent.some((a) => a && a.do === 'gather'),
    !sent.some((a) => a && a.do === 'gather')
      ? 'and files no gather the engine will refuse'
      : 'and filed a gather anyway')
  // the axe in the pack is not the axe in the hand, and that is the one that
  // catches people out, so the refusal says which
  const packed = fresh()
  packed.nodes.t1 = { type: 'tree', x: 10, y: 11 }
  packed.players[ID].inventory[0] = { item: 'iron-hatchet', qty: 1 }
  ctx.__h.msg({ type: 'state', state: packed, worldId: WID })
  await new Promise((r) => setImmediate(r))
  ctx.__h.set(packed, ID)
  ctx.__h.hush(); sent.length = 0
  ctx.__h.press(10, 11, false)
  ok(/not holding it|wield/i.test(ctx.__h.said().join(' ')),
    /not holding it|wield/i.test(ctx.__h.said().join(' '))
      ? 'axe in the pack: "' + ctx.__h.said()[0] + '"'
      : 'an axe in the pack got: ' + (ctx.__h.said().join(' / ') || 'nothing'))
  // wielded: it goes, and the window names what is actually in the hand
  const armed = fresh()
  armed.nodes.t1 = { type: 'tree', x: 10, y: 11 }
  armed.players[ID].equipment = { weapon: { item: 'steel-hatchet' } }
  ctx.__h.msg({ type: 'state', state: armed, worldId: WID })
  await new Promise((r) => setImmediate(r))
  ctx.__h.set(armed, ID)
  ctx.__h.hush(); sent.length = 0
  ctx.__h.press(10, 11, false)
  ok(sent.some((a) => a && a.do === 'gather'),
    sent.some((a) => a && a.do === 'gather') ? 'axe in hand: the gather goes'
      : 'an axe in hand still filed nothing')
  ok(/steel hatchet/.test(ctx.__h.said().join(' ')),
    /steel hatchet/.test(ctx.__h.said().join(' '))
      ? 'and the window names what is in the hand: "' + ctx.__h.said().pop() + '"'
      : 'the window did not name the tool: ' + ctx.__h.said().join(' / '))
  // and the one barehanded rung in the whole economy is not gated
  const eel = fresh()
  eel.nodes.e1 = { type: 'eel-spot', x: 10, y: 11 }
  ctx.__h.msg({ type: 'state', state: eel, worldId: WID })
  await new Promise((r) => setImmediate(r))
  ctx.__h.set(eel, ID)
  ctx.__h.hush(); sent.length = 0
  ctx.__h.press(10, 11, false)
  ok(sent.some((a) => a && a.do === 'gather'),
    sent.some((a) => a && a.do === 'gather')
      ? 'and an eel run still takes hands and no rod'
      : 'the window now refuses the one thing a citizen with nothing can work')
  // the level gate, for every ground that has one
  const low = fresh()
  for (const k of Object.keys(low.players[ID].skills)) low.players[ID].skills[k] = 0
  low.players[ID].equipment = { weapon: { item: 'steel-pickaxe' } }
  low.nodes.q1 = { type: 'quick-rock', x: 10, y: 11 }
  ctx.__h.msg({ type: 'state', state: low, worldId: WID })
  await new Promise((r) => setImmediate(r))
  ctx.__h.set(low, ID)
  ctx.__h.hush(); sent.length = 0
  ctx.__h.press(10, 11, false)
  const g9 = E.NODE_GATE['quick-rock']
  ok(ctx.__h.said().some((l) => l.includes(String(g9.level)) && l.includes(g9.skill)),
    ctx.__h.said().some((l) => l.includes(String(g9.level)) && l.includes(g9.skill))
      ? 'and a gated seam quotes the engine’s own level: "' + ctx.__h.said()[0] + '"'
      : 'a magic stone at level 0 said: ' + (ctx.__h.said().join(' / ') || 'nothing'))
}

console.log('\n--- 8m. one word to a cluster, not one to a tile ---')
{
  // "I think it is kind of noisy with the name above the resource nodes, like
  // with so many rockfall rocks, it looks weird."
  //
  // Forty-one rockfalls stand on this island and they come in scatters: one
  // field of them put FORTY captions reading ROCKFALL on the screen at once.
  // Taking the names away was the other answer and it is the wrong one, since
  // somebody walked the whole Greenwood without finding a tree and the labels
  // exist so an iron seam can be told from a coal seam at a glance. The noise
  // was the repetition. So the word belongs to the group.
  //
  // Read off the pen: this is what the window actually wrote.
  const st = fresh()
  for (let k = 0; k < 10; k++)
    st.nodes['rf' + k] = { type: 'rockfall', x: 9 + (k % 4), y: 9 + ((k / 4) | 0) }
  ctx.__h.msg({ type: 'state', state: st, worldId: WID })
  await new Promise((r) => setImmediate(r))
  ctx.__h.set(st, ID)
  ctx.__h.useCur()
  ctx.__h.hover(null)
  penSaid.length = 0
  let threw = null
  try { ctx.__h.draw() } catch (e) { threw = e.message }
  ok(!threw, threw ? 'drawing a frame full of rockfalls threw: ' + threw
    : 'a frame with ten rockfalls in four tiles draws')
  const words = penSaid.filter((t) => t === 'rockfall')
  ok(words.length === 1, words.length === 1
    ? 'and writes the word once over the ten of them'
    : 'it wrote "rockfall" ' + words.length + ' times for ten rocks in one scatter')
  // and the one under the pointer is still named, so nothing is unnameable
  ctx.__h.hover(11, 10)
  penSaid.length = 0
  try { ctx.__h.draw() } catch (e) { ok(false, 'hovering a rock threw: ' + e.message) }
  ok(penSaid.filter((t) => t === 'rockfall').length === 2,
    penSaid.filter((t) => t === 'rockfall').length === 2
      ? 'and the one under the pointer is named as well as the cluster'
      : 'hovering a rock in the scatter wrote the word '
        + penSaid.filter((t) => t === 'rockfall').length + ' time(s)')
  // two KINDS beside each other each keep their own word: the cluster is per
  // kind, or a coal seam beside an iron one would go unnamed
  const two = fresh()
  two.nodes.a1 = { type: 'iron-rock', x: 10, y: 11 }
  two.nodes.a2 = { type: 'coal-rock', x: 11, y: 11 }
  ctx.__h.msg({ type: 'state', state: two, worldId: WID })
  await new Promise((r) => setImmediate(r))
  ctx.__h.set(two, ID)
  ctx.__h.useCur()
  ctx.__h.hover(null)
  penSaid.length = 0
  try { ctx.__h.draw() } catch (e) { ok(false, 'two seams threw: ' + e.message) }
  ok(penSaid.includes('iron') && penSaid.includes('coal'),
    penSaid.includes('iron') && penSaid.includes('coal')
      ? 'and an iron seam beside a coal seam is still two words'
      : 'two kinds side by side wrote: ' + [...new Set(penSaid)].join(' | ').slice(0, 80))
}

console.log('\n--- 8n. the toll bar lies across the way ---')
{
  // "The toll on the bridge does not look like a toll, it is rotated
  // sideways." It was. The sprite drew one gate per tile, always east to
  // west, and the Millbrook bar is TWO tiles stacked north to south across a
  // road that runs east to west: a pair of gates lying flat along the
  // direction of travel. The way is read off the world now, and a run of
  // tiles is one bar with a post at each END rather than a gate per tile.
  //
  // Four states, because each is a branch and a branch that throws takes the
  // whole frame with it: a run of two either way, a gate standing alone, and
  // the bar lifted.
  const lay = async (tiles, paid) => {
    const st = fresh()
    for (let i = 0; i < tiles.length; i++)
      st.nodes['tg' + i] = { type: 'tollgate', x: tiles[i][0], y: tiles[i][1] }
    if (paid) st.players[ID].paidUntil = (st.tick ?? 0) + 120
    ctx.__h.msg({ type: 'state', state: st, worldId: WID })
    await new Promise((r) => setImmediate(r))
    ctx.__h.set(st, ID); ctx.__h.useCur(); ctx.__h.hover(null)
    let threw = null
    try { ctx.__h.draw() } catch (e) { threw = e.message }
    return threw
  }
  for (const [what, tiles, paid] of [
    ['a bar two tiles north to south', [[11, 9], [11, 10]], false],
    ['a bar two tiles east to west', [[10, 11], [11, 11]], false],
    ['a bar standing alone', [[11, 10]], false],
    ['a bar that has been paid and lifted', [[11, 9], [11, 10]], true],
  ]) {
    const threw = await lay(tiles, paid)
    ok(!threw, threw ? what + ' threw: ' + threw : what + ' draws')
  }
  // and the window decides it from the world rather than carrying one answer
  ok(/_gateAt/.test(html) && /gAt\(n\.x, n\.y - 1\)/.test(html),
    'and it takes the direction from the gates the world put beside it')
}

console.log('\n--- 8o. everything that comes in a run is drawn along it ---')
{
  // "Look at the fences though. Same issue as the toll gate, has to be
  // rotated. I have seen many cases across the world of hedges and fences
  // not facing correctly."
  //
  // The wall was taught this once and the fence was taught it once, each
  // after somebody saw it, and the three kinds nobody had been back to were
  // still drawing one east-west sprite whichever way their line went: 1,212
  // hedges with 429 of them in north-south runs, 98 railings, and 1,227
  // seedbeds whose furrows ran ACROSS the bed on the 1,026 that stand in a
  // north-south strip.
  //
  // AND THE FENCE WAS WRONG AGAIN FOR A SECOND REASON. At the farm plots a
  // north-south fence line has a north-south HEDGE line one tile east of it,
  // and the window asked `fenceAt`, which answers for the whole joining
  // family. So every fence there believed it had an east-west neighbour and
  // drew broadside. A fence standing beside a hedge is not a fence running
  // east-west: the direction is its own kind's question and the wider family
  // only says where a tile should reach its edge.
  //
  // Asked of the drawing rather than of the source, because the source has
  // said "a fence knows which way it runs" in a comment for months while the
  // fences at the farm did not. Draw a run each way and measure the shape.
  const shapeOf = async (type, vertical) => {
    const st = fresh()
    for (let i = 0; i < 3; i++)
      st.nodes['r' + i] = { type, x: vertical ? 11 : 10 + i, y: vertical ? 9 + i : 11 }
    ctx.__h.msg({ type: 'state', state: st, worldId: WID })
    await new Promise((r) => setImmediate(r))
    ctx.__h.set(st, ID); ctx.__h.useCur(); ctx.__h.hover(null)
    penRect.length = 0
    let threw = null
    try { ctx.__h.draw() } catch (e) { threw = e.message }
    if (threw) return { threw }
    // MEASURED AGAINST ITSELF, NOT AGAINST A TILE ORIGIN. The first version
    // worked out where the middle tile ought to be on screen and looked
    // there, and the camera follows the citizen, so it was reading a box
    // three tiles from the sprite and reporting every kind as unturned.
    // A run three long draws something long: the question is simply whether
    // the longest thing the window drew lies down the screen or across it.
    // COUNTED, AND THE TWO CASES SUBTRACTED. A ratio breaks on a stroked
    // line, which has one side of zero and comes out as the same infinity
    // whichever way it points, and the frame carries long marks of its own
    // that have nothing to do with the run. The only thing that differs
    // between these two states is which way three nodes lie, so counting
    // long marks in each direction and comparing the two is the measurement:
    // the background is in both and cancels.
    // THE SIZES, AS A BAG. The frame carries long marks of its own and the
    // two cases differ only in which way three nodes lie, so subtracting one
    // bag of sizes from the other leaves the run and nothing else.
    const bag = new Map()
    for (const [, , w, h] of penRect) {
      if (!(w >= 0) || !(h >= 0)) continue
      if (Math.max(w, h) < 12 || Math.max(w, h) > 130) continue
      const k = w.toFixed(1) + 'x' + h.toFixed(1)
      bag.set(k, (bag.get(k) ?? 0) + 1)
    }
    return { bag }
  }
  // what one case drew that the other did not, longest first: the run's own
  // marks, with everything the frame draws either way cancelled out
  const ownMarks = (mine, other) => {
    const out = []
    for (const [k, n9] of mine.bag) {
      const spare = n9 - (other.bag.get(k) ?? 0)
      if (spare <= 0) continue
      const [w, h] = k.split('x').map(Number)
      out.push([w, h, spare])
    }
    return out.sort((p9, q9) => Math.max(q9[0], q9[1]) - Math.max(p9[0], p9[1]))
  }
  for (const type of ['fence', 'hedge', 'railing', 'wall', 'palisade']) {
    const V = await shapeOf(type, true), H = await shapeOf(type, false)
    if (V.threw || H.threw) { ok(false, type + ' threw: ' + (V.threw ?? H.threw)); continue }
    const vm = ownMarks(V, H), hm = ownMarks(H, V)
    if (!vm.length || !hm.length) { ok(false, type + ' drew the same marks either way'); continue }
    // the longest thing a run adds is the thing that runs ALONG it: the rail,
    // the course, the body of the hedge. An iron railing has more uprights
    // than rails, so counting marks says the wrong thing and the longest one
    // says the right one.
    const vDown = vm[0][1] > vm[0][0], hAcross = hm[0][0] > hm[0][1]
    ok(vDown && hAcross, vDown && hAcross
      ? 'a ' + type + ' turns with its run (down it, the longest mark is '
        + vm[0][0] + 'x' + vm[0][1] + '; across it, ' + hm[0][0] + 'x' + hm[0][1] + ')'
      : 'a ' + type + ' does not turn with its run (down it, the longest mark is '
        + vm[0][0] + 'x' + vm[0][1] + '; across it, ' + hm[0][0] + 'x' + hm[0][1] + ')')
  }
  // AND A CORNER CARRIES BOTH ARMS. A tile where a run turns has neighbours
  // on both axes, so every one of them fell to the across drawing and put
  // down no mark at all toward the arm coming up from below: 1,074 corner and
  // junction tiles on this island, each of them two runs ending in mid air a
  // tile apart. A corner that turns adds marks BOTH ways, which an isolated
  // tile of the same kind does not.
  const cornerOf = async (type) => {
    const st = fresh()
    st.nodes.c0 = { type, x: 11, y: 11 }   // the corner
    st.nodes.c1 = { type, x: 10, y: 11 }   // its west arm
    st.nodes.c2 = { type, x: 11, y: 12 }   // its south arm
    ctx.__h.msg({ type: 'state', state: st, worldId: WID })
    await new Promise((r) => setImmediate(r))
    ctx.__h.set(st, ID); ctx.__h.useCur(); ctx.__h.hover(null)
    penRect.length = 0
    try { ctx.__h.draw() } catch (e) { return { threw: e.message } }
    let down = 0, across = 0
    for (const [, , w, h] of penRect) {
      if (!(w >= 0) || !(h >= 0)) continue
      if (Math.max(w, h) < 12 || Math.max(w, h) > 130) continue
      if (h > w) down++; else if (w > h) across++
    }
    return { down, across }
  }
  for (const type of ['fence', 'hedge', 'railing']) {
    const C = await cornerOf(type)
    if (C.threw) { ok(false, 'a ' + type + ' corner threw: ' + C.threw); continue }
    ok(C.down > 0 && C.across > 0, C.down > 0 && C.across > 0
      ? 'a ' + type + ' corner carries both arms (' + C.down + ' down, ' + C.across + ' across)'
      : 'a ' + type + ' corner has only one arm (' + C.down + ' down, ' + C.across + ' across)')
  }
  // and an arm is its OWN kind's, or a hedge sprouts into the house beside it
  ok(/toL: l, toR: r, toU: u, toD: d/.test(html),
    'and a run butting against something heavier reaches it without growing an arm into it')
  // a bed is a whole tile either way, so its SHAPE cannot answer: its furrows
  // are strokes, and the question is which way they lie
  ok(/runWays\(s, 'plot'/.test(html) && /pw\.down/.test(html),
    'and a seedbed asks which way its strip runs before it rules a furrow')
  // AND THE DIRECTION IS ITS OWN KIND'S QUESTION. The fence at the farm was
  // wrong for months because a hedge counted as a fence neighbour.
  ok(/FENCE_OWN/.test(html) && /runWays\(s, 'fence', FENCE_OWN/.test(html),
    'and a fence decides its direction by fences, not by whatever stands beside it')
}

console.log('\n--- 8p. what you are standing on can be picked up ---')
{
  // "When I kill a skeleton knight and take the bones, I cannot take the
  // other pile of bones. When I am already standing at the dropped item and
  // click, I only click myself, so I cannot pick up anything else after the
  // first. I have to walk off the spot and then on it again."
  //
  // The same fault as a beast standing over what it dropped, which §7ei found
  // and fixed for creatures, in the one place nobody thought to check: your
  // own feet. Every press finds YOU first and returns, so the second pile of
  // a kill was unreachable without stepping off the tile.
  const st = fresh()
  const me9 = st.players[ID]
  st.ground = {
    g1: { item: 'bones', qty: 1, x: me9.x, y: me9.y, by: 'x'.repeat(64) },
    g2: { item: 'iron-ore', qty: 1, x: me9.x, y: me9.y, by: 'x'.repeat(64) },
  }
  ctx.__h.msg({ type: 'state', state: st, worldId: WID })
  await new Promise((r) => setImmediate(r))
  ctx.__h.set(st, ID)
  // the left button takes the next thing up, because that is plainly what a
  // citizen standing on a heap of loot means by clicking it
  ctx.__h.hush(); sent.length = 0
  ctx.__h.press(me9.x, me9.y, false)
  const took = sent.filter((a) => a && a.do === 'pickup')
  ok(took.length === 1, took.length === 1
    ? 'standing on a pile, a left press takes it: ' + ctx.__h.said()[0]
    : 'standing on a pile, a left press sent ' + JSON.stringify(sent.map((a) => a && a.do)))
  // and the right button says everything that is here, yours included
  const grab = ctx.__h.spy()
  ctx.__h.press(me9.x, me9.y, true)
  const opts = (grab() ?? []).map((o) => o && (o.label ?? o.head)).filter(Boolean)
  const takes = opts.filter((l) => /^take the /.test(l))
  ok(takes.length === 2, takes.length === 2
    ? 'and the right press lists both of them: ' + takes.join(', ')
    : 'the right press listed ' + takes.length + ' of the 2 piles (' + opts.join(' | ') + ')')
  // with the bare ground, pressing yourself is still looking at yourself
  const bare = fresh()
  ctx.__h.msg({ type: 'state', state: bare, worldId: WID })
  await new Promise((r) => setImmediate(r))
  ctx.__h.set(bare, ID)
  ctx.__h.hush(); sent.length = 0
  ctx.__h.press(bare.players[ID].x, bare.players[ID].y, false)
  ok(!sent.some((a) => a && a.do === 'pickup') && ctx.__h.said().length > 0,
    !sent.some((a) => a && a.do === 'pickup') && ctx.__h.said().length > 0
      ? 'and on bare ground a press on yourself is still a look at yourself'
      : 'pressing yourself on bare ground did the wrong thing')
}

console.log('\n--- 8q. a window never guesses a constitutional number ---')
{
  // §7ek said this once: the stall option counted sixteen `logs` and eight
  // `ore` against an engine asking ten PLANKS and two IRON-ORE, and printed a
  // THIRD pair of numbers on the button. Three copies and no two agreeing.
  //
  // THERE WERE TWO OF THEM AND ONLY ONE WAS FIXED. The second was word for
  // word the same, in the pack's own menu rather than the ground's, and it
  // counted a word -- plain `ore` -- that this founding does not mine at all.
  // A rule kept in one place out of two is not a rule, so this reads back
  // every number the window puts on that button and holds all of them to the
  // pillar's.
  const nums = [...html.matchAll(/raise a stall[^']*?(\d+)\s*planks[^']*?(\d+)\s*iron-ore/g)]
  ok(nums.length === 0, nums.length === 0
    ? 'no stall button carries a number of its own; they all read the pillar’s'
    : nums.length + ' stall button(s) print their own cost: '
      + nums.map((m) => m[1] + ' planks, ' + m[2] + ' iron-ore').join('; '))
  // and nothing counts the retired word
  const stallBits = html.split('raise a stall')
  const bad = stallBits.slice(1).filter((b) => /item === 'ore'/.test(b.slice(-700)))
  ok(bad.length === 0, bad.length === 0
    ? 'and none of them counts plain ore, which this founding does not mine'
    : bad.length + ' still count plain ore')
}

console.log('\n--- 8r. the kit is in Nought and nowhere else ---')
{
  // "I think we need a way I can try every item without having to grind
  // everything myself: to test all the weapons and their gambits and how it
  // looks when worn."
  //
  // The obvious wrong answer is a cheat in the real window. Tallyholm is
  // permanent and everything in it was earned by somebody; a door that puts a
  // dragonbow in your hand there is a hole in the whole of it, and a hole
  // that exists only for testing is still a hole, because the window that
  // ships is the window that tests.
  //
  // Nought already is the answer: a private copy of the island where nothing
  // is saved and nothing can be lost, which hands you every gated tool and
  // ten thousand gold and whose own card says "so use it, fight something far
  // too big for you". A wardrobe of every weapon is that sentence finished.
  //
  // THE GUARD IS THE WHOLE TEST. This harness never enters Nought, so the
  // kit must refuse it here, and refuse it out loud rather than silently.
  ok(!ctx.__h.inNought(), 'this window is not in the practice world')
  const st = fresh()
  ctx.__h.msg({ type: 'state', state: st, worldId: WID })
  await new Promise((r) => setImmediate(r))
  ctx.__h.set(st, ID)
  ctx.__h.hush()
  const before = JSON.stringify(st.players[ID].equipment)
  ctx.__h.kitGive('dragonbow', 'wear')
  ok(JSON.stringify(st.players[ID].equipment) === before,
    JSON.stringify(st.players[ID].equipment) === before
      ? 'and the kit puts nothing in a citizen’s hand outside it'
      : 'THE KIT ARMED A CITIZEN IN THE REAL WORLD')
  ok(/no kit in the world itself/.test(ctx.__h.said().join(' ')),
    /no kit in the world itself/.test(ctx.__h.said().join(' '))
      ? 'and says why: ' + ctx.__h.said()[0]
      : 'and refused in silence (' + (ctx.__h.said().join(' / ') || 'nothing') + ')')
  // and the button is not on the page either
  ok(/id="kitbtn"[^>]*display:none/.test(html),
    'and the button it hangs on starts hidden')
  // WHAT IT HOLDS is read off the window's own tables, so a weapon added to
  // the world next year is in the kit the day it is added
  const rows = ctx.__h.kitRows()
  // §6bv: AND THE HORN GOES IN THE OTHER HAND. It is the one thing in the
  // off-hand slot that is not a shield, so it is the one most likely to be
  // filed as a weapon by anything that guesses.
  for (const [thing, want] of [['horn', 'offhand'], ['iron-shield', 'offhand'],
                               ['spade', 'weapon'], ['hollow-bow', 'weapon']]) {
    const where = Object.entries(rows.worn).find(([, l]) => l.includes(thing))?.[0] ?? 'nowhere'
    const engine = E.slotOf(thing)
    ok(where === engine && engine === want,
      where === engine && engine === want
        ? 'the kit puts a ' + thing.replace('-', ' ') + ' where the engine does: ' + want
        : 'the kit files a ' + thing + ' under ' + where + ', the engine says ' + engine)
  }
  const listed = new Set([...Object.values(rows.worn).flat(), ...rows.rest])
  const missing = [...E.EQUIPPABLE].filter((i) => !listed.has(i))
  ok(missing.length === 0, missing.length === 0
    ? 'it holds every one of the ' + [...E.EQUIPPABLE].length + ' things a citizen can wear'
    : missing.length + ' wearable things are not in the kit: ' + missing.slice(0, 8).join(', '))
  // every weapon that HAS a gambit is in it, which is the thing asked for
  const gambits = Object.keys(JSON.parse('{' + (html.match(/const GAMBIT_OF = \{([\s\S]*?)\}/) ?? [, ''])[1]
    .replace(/,\s*$/, '') + '}'))
  const noGambit = gambits.filter((w) => !listed.has(w))
  ok(noGambit.length === 0, noGambit.length === 0
    ? 'and all ' + gambits.length + ' weapons that carry a gambit: ' + gambits.join(', ')
    : 'these carry a gambit and are not in the kit: ' + noGambit.join(', '))
  // and the food, because how a thing looks is only half of trying it
  const food = Object.keys(E.HEALS ?? {}).filter((i) => !listed.has(i))
  ok(food.length === 0, food.length === 0
    ? 'and the whole larder'
    : food.length + ' foods are not in the kit: ' + food.join(', '))
  // the panel draws, and says where you are before it says anything else
  const h9 = ctx.__h.kitHtml()
  ok(h9 === '', h9 === ''
    ? 'and the panel itself draws nothing outside the practice world'
    : 'the kit panel drew ' + h9.length + ' characters in the real world')
}

console.log('\n--- 8s. a deed pressed in Nought actually lands ---')
{
  // "When I right click bury on dragon bones, nothing happens. It says I bury
  // them in the log but nothing happens. I tried to eat a cooked deep fish
  // and nothing happened. When I right click items to drop them, nothing
  // happens either."
  //
  // Three deeds, one symptom: the window SAYS it did the thing and the world
  // does not move. The feed line is written by the window on the way out, so
  // a line in the log is proof that a button was pressed and proof of nothing
  // else. Everything a resident does goes through `noughtDo` into a queue the
  // local tick drains, and nothing anywhere was reading back whether the
  // queue emptied into anything.
  //
  // This presses them where a resident presses them.
  const st = fresh()
  const p9 = st.players[ID]
  p9.inventory[0] = { item: 'dragon-bones', qty: 1 }
  p9.inventory[1] = { item: 'cooked-deep-fish', qty: 1 }
  p9.inventory[2] = { item: 'logs', qty: 1 }
  p9.hp = 10
  ctx.__h.enterNought(st, E, me)
  const before = () => JSON.stringify(ctx.__h.noughtState().players[ID].inventory)
  // the window reads the citizen out of `world`, which the tick has replaced
  const world9hurt = () => ctx.__h.set(ctx.__h.noughtState(), ID)
  // pressed through the MENU ROW a citizen presses, not through whatever the
  // left button happens to do: dragon bones put a look first, deliberately,
  // because a left click must not spend a thing on a guess (§7ek)
  const row9 = (slot, re) => () => { const g = ctx.__h.spy(); ctx.__h.inv(slot, true)
    const r = (g() ?? []).find((o) => o && re.test(o.label ?? ''))
    if (!r) throw new Error('no row matching ' + re)
    r.act() }
  // each deed sets up its own precondition, because the tick between them
  // moves the world: the first version wounded the citizen once at the top
  // and the bury tick had healed them whole again by the time the eat was
  // pressed, so the eat was refused for a reason that had nothing to do with
  // what was being measured
  for (const [what, press] of [
    ['bury the dragon bones', row9('0', /^bury/)],
    ['eat the cooked deep fish', () => {
      ctx.__h.noughtState().players[ID].hp = 1
      world9hurt(); row9('1', /^eat/)() }],
    ['drop the logs', row9('2', /^drop/)],
  ]) {
    const was = before()
    ctx.__h.hush()
    let threw = null
    try { press() } catch (e) { threw = e.message }
    const queued = ctx.__h.noughtRun()
    const now = before()
    ok(!threw && queued > 0 && now !== was,
      !threw && queued > 0 && now !== was
        ? 'in Nought, ' + what + ' lands: the pack changes'
        : 'in Nought, ' + what + ' did nothing'
          + (threw ? ' (it threw: ' + threw + ')' : '')
          + ' [queued ' + queued + ' input(s), hp '
          + ctx.__h.noughtState().players[ID].hp + '/'
          + E.maxHealth(ctx.__h.noughtState().players[ID]) + ', feed said: '
          + (ctx.__h.said().join(' / ') || 'nothing') + ']')
  }
  // AND AT FULL HEALTH, which is where this was reported from. The engine
  // refuses an `eat` that would mend nothing, so the fish stays in the pack
  // and the window has already said you ate it.
  {
    const full = fresh()
    full.players[ID].inventory[0] = { item: 'cooked-deep-fish', qty: 1 }
    full.players[ID].hp = E.maxHealth(full.players[ID])
    ctx.__h.enterNought(full, E, me)
    ctx.__h.hush()
    row9('0', /^eat/)()
    ctx.__h.noughtRun()
    const gone = !ctx.__h.noughtState().players[ID].inventory[0]
    const said = ctx.__h.said().join(' ')
    ok(gone || !/You eat the/.test(said),
      gone ? 'eating at full health spends the food'
        : /You eat the/.test(said)
          ? 'at full health the window SAYS "you eat it" and the food stays in the pack'
          : 'at full health it says: ' + said)
  }
  // AND THROUGH THE KIT, which is where these came from. A thing the kit put
  // in the pack must be exactly as real as a thing a citizen picked up.
  {
    const k9 = fresh()
    ctx.__h.enterNought(k9, E, me)
    ctx.__h.kitGive('dragon-bones', 'take')
    ctx.__h.kitGive('logs', 'take')
    // WALK IT AND NAME THE OFFENDER. "the offending value is at state
    // <Object>" says only that something is not a plain object; this says
    // which key, which is the difference between a fix and a guess.
    const bad9 = []
    const walk9 = (o, path, seen) => {
      if (!o || typeof o !== 'object' || seen.has(o) || bad9.length > 6) return
      seen.add(o)
      // REALM-TOLERANT. The window runs in a vm, so an object it creates has
      // the VM's Object.prototype and can never be identical to this file's.
      // What `canonical` is really asking is whether the thing is a PLAIN
      // object, and a plain object is one whose prototype has no prototype,
      // in any realm. Comparing identity here reported every item the kit put
      // in a pack as unencodable, which is a fault in the measurement.
      if (!Array.isArray(o)) {
        const pr = Object.getPrototypeOf(o)
        if (pr !== null && Object.getPrototypeOf(pr) !== null) {
          bad9.push(path + ' is a ' + (o.constructor?.name ?? '?')); return }
      }
      for (const k of Object.keys(o)) walk9(o[k], path + '.' + k, seen)
    }
    // THE PRACTICE WORLD ITSELF, not a copy of it. This is the invariant the
    // kit broke: the renderer hangs Maps and Sets on whatever state it is
    // handed, `withPeers` copies the state before the renderer sees it for
    // exactly that reason, and the kit handed over `nought.state` directly.
    // The next tick met a Set where `canonical` allows only plain objects,
    // threw, dropped the queue, and the world stood still for ever.
    ctx.__h.draw()
    walk9(ctx.__h.noughtState(), 'state', new Set())
    ok(bad9.length === 0, bad9.length === 0
      ? 'and the practice world it leaves behind is still encodable'
      : 'the kit poisons the practice world: ' + bad9.join(', '))
    const packed = ctx.__h.noughtState().players[ID].inventory
    ok(packed[0] && packed[0].item === 'dragon-bones',
      packed[0] ? 'the kit puts a thing in the pack: ' + packed[0].item + ' x' + packed[0].qty
        : 'the kit put nothing in the pack')
    // and the deeds themselves are pressed above, on a state built out here,
    // because the local tick runs THIS file's engine against the vm's objects
    // and no amount of care about prototypes can make those the same thing.
    // What is asked of the kit here is the thing that broke: the state it
    // leaves behind must still be something the tick can encode.
  }
  // AND IT KEEPS RUNNING. "In Nought I get stuck and just stand still a few
  // seconds after entering, I cannot walk anywhere." A stumble stops the
  // clock: `nextState` throws, the queue is dropped, and the world never
  // advances again, so the citizen is frozen where they stand. One tick
  // cannot see that. This walks and runs a stretch of them.
  {
    const run = fresh()
    // THE WORLD HAS TO CONTAIN THE THINGS THAT BUILD THE CACHES, or this
    // measures nothing. The first cut of this passed against the broken code
    // as happily as against the fixed one, because the index that poisoned
    // the tick is only built when there is a seam to label or a toll bar to
    // stand on, and a bare harness world has neither. Checked by putting the
    // old line back and watching it still pass, which is the only way to know
    // a check is a check.
    run.nodes.t9 = { type: 'tree', x: 12, y: 10 }
    run.nodes.t8 = { type: 'tree', x: 13, y: 10 }
    run.nodes.g9 = { type: 'tollgate', x: 10, y: 13 }
    run.nodes.g8 = { type: 'tollgate', x: 10, y: 14 }
    ctx.__h.enterNought(run, E, me)
    // the renderer runs over this state the way the tick runs it
    ctx.__h.set(run, ID); ctx.__h.useCur(); ctx.__h.draw()
    ctx.__h.hush()
    const from = { x: run.players[ID].x, y: run.players[ID].y }
    let stumbled = 0, moved = false
    for (let t = 0; t < 12; t++) {
      if (t === 0) ctx.__h.press(from.x + 3, from.y, false)   // walk away
      ctx.__h.set(ctx.__h.noughtState(), ID)
      ctx.__h.noughtRun()
      if (ctx.__h.said().some((l) => /stumbled/.test(l))) stumbled++
      const p8 = ctx.__h.noughtState().players[ID]
      if (p8.x !== from.x || p8.y !== from.y) moved = true
    }
    ok(stumbled === 0, stumbled === 0 ? 'Nought runs a stretch of intervals without stumbling'
      : 'Nought stumbled on ' + stumbled + ' of 12 intervals: '
        + ctx.__h.said().filter((l) => /stumbl|offending/.test(l)).join(' / '))
    ok(moved, moved ? 'and a citizen who presses the ground actually goes there'
      : 'a citizen pressed the ground and never moved (still at ' + from.x + ',' + from.y + ')')
  }
  ctx.__h.leaveNought()
}

console.log('\n--- 8t. a gambit can be spent in the training yard ---')
{
  // "The gambit does not work on the butt in the training area with butts and
  // dummies. Maybe since we changed spec to gambit? But it used to work
  // before I think, or at least it should."
  //
  // 20e grants it: a dummy and a butt carry 64-hex ids so that `targetId`
  // takes one without a second verb, and the rule, the input shape and the
  // apply path have all accepted a mob since then. The WINDOW read the armed
  // gambit on the citizen branch alone, so the one press this was built for
  // fell through to an ordinary blow, and the yard was the only place in the
  // world where a gambit could not be spent.
  //
  // Pressed in Nought, which is where it was reported from and where the real
  // engine resolves the deed under a real signature.
  const yard = () => {
    const st = fresh()
    // THE LANE IS KEPT CLEAR, because a mob blocks a tile. A pell set between
    // the citizen and the butt stops the walk dead and the engine refuses the
    // step without a word: the first cut of this check put one at 10,11 and
    // read twelve intervals of standing still as a window fault.
    E.addMob(st, 'b'.repeat(64), 'butt', 10, 13)       // three tiles off: bow range
    E.addMob(st, 'd'.repeat(64), 'dummy', 11, 10)      // next door: any arm reaches
    E.addMob(st, 'g'.repeat(64), 'goblin', 12, 12)
    for (const m of Object.values(st.mobs)) m.hp = m.health
    const p9 = st.players[ID]
    p9.equipment.weapon = { item: 'horn-bow', qty: 1 }
    // THE WORD IS `arrows`. The engine's PRICES has no `arrow` at all, so the
    // first cut of this armed a bow with nothing in the quiver and the check
    // passed anyway: a gambit at a DUMMY is the one path that does not count
    // the ammunition. It was measuring the right thing for the wrong reason.
    p9.inventory[0] = { item: 'arrows', qty: 200 }
    p9.lastSwing = -64
    return st
  }
  // SET it, never toggle it. `gambitArmed` is one flag for the whole window
  // and it outlives a block, so a test that toggles arms what the block
  // before it left armed, and the yard press read as a stand-down. Three of
  // these checks failed on that and not on the window.
  const armTo = (want) => { const b = doc.getElementById('gambitbtn')
    if (ctx.__h.armed() !== want) b.click()
    return ctx.__h.armed() === want }
  const arm = () => armTo(true)
  // THE BUTT, FROM BOW RANGE. A horn-bow gambit is the flurry, and the thing
  // it is spent on is four tiles away: the whole point of a yard butt.
  {
    const st = yard()
    ctx.__h.enterNought(st, E, me)
    ctx.__h.hush(); sent.length = 0
    const armed = arm()
    const was = ctx.__h.noughtState().mobs['b'.repeat(64)].health
    ctx.__h.press(10, 13, false)
    // READ THE QUEUE BEFORE THE TICK DRAINS IT. Asked after `noughtRun` it is
    // always empty, which reported "filed nothing" about a deed that had
    // plainly landed: the butt was seven light and the log said so.
    const q9 = ctx.__h.noughtQueue()
    const queued = ctx.__h.noughtRun()
    const now = ctx.__h.noughtState().mobs['b'.repeat(64)].health
    // IN NOUGHT NOTHING REACHES `send`. Every deed a resident files goes into
    // the practice world's own queue, so the thing to read is the queue.
    ok(armed, armed ? 'the button arms the gambit'
      : 'the gambit button did not arm (nothing to measure)')
    ok(q9.includes('gambit'),
      q9.includes('gambit') ? 'pressing the butt files a gambit at it'
        : 'pressing the butt filed ' + (q9.join(', ') || 'nothing') + ', not a gambit')
    ok(queued > 0 && now < was,
      queued > 0 && now < was
        ? 'and the butt takes it: ' + (was - now) + ' off a hundred thousand'
        : 'the butt took nothing [queued ' + queued + ', health ' + was + ' then ' + now
          + ', feed said: ' + (ctx.__h.said().join(' / ') || 'nothing') + ']')
    ok(!ctx.__h.armed(), ctx.__h.armed()
      ? 'the gambit stayed armed after it was spent' : 'and the arm is stood down after')
    ctx.__h.leaveNought()
  }
  // AND FROM ACROSS THE YARD WITH A SHORT ARM. A dagger's gambit reaches one
  // tile, so pressing a pell four tiles off has to walk in and spend it on
  // arrival, the way a hunt closes. A press that merely refuses would be the
  // window asking somebody to stand in the right square first, which is not a
  // command anybody should have to compose.
  {
    const st = yard()
    st.players[ID].equipment.weapon = { item: 'quick-dagger', qty: 1 }
    ctx.__h.enterNought(st, E, me)
    ctx.__h.hush(); ctx.__h.clearIntent()
    armTo(true)
    const was = ctx.__h.noughtState().mobs['b'.repeat(64)].health
    ctx.__h.press(10, 13, false)
    const walking = ctx.__h.intent()
    // ONE MORE INTERVAL AFTER THE WALK ENDS. The tick that arrives files the
    // gambit and clears the intent in the same breath, so a loop that stops
    // when the intent clears stops before the deed has been drained: it read
    // "walked and never spent it" about a gambit sitting in the queue.
    for (let i = 0; i < 14; i++) { ctx.__h.noughtRun(); if (!ctx.__h.intent() && i > 1) break }
    ctx.__h.noughtRun()
    const now = ctx.__h.noughtState().mobs['b'.repeat(64)].health
    ok(walking && walking.kind === 'gambitmob',
      walking ? 'a gambit out of reach walks in (' + walking.kind + ')'
        : 'a gambit pressed out of reach set no walk at all')
    ok(now < was, now < was
      ? 'and is spent on arrival: ' + (was - now) + ' off the butt'
      : 'the citizen walked and never spent it [at '
        + ctx.__h.noughtState().players[ID].x + ',' + ctx.__h.noughtState().players[ID].y
        + ', armed ' + ctx.__h.armed() + ']')
    ctx.__h.leaveNought()
  }
  // THE PELL, which the world's own log used to call a butt.
  {
    const st = yard()
    ctx.__h.enterNought(st, E, me)
    ctx.__h.hush(); sent.length = 0
    arm()
    ctx.__h.press(11, 10, false)
    ctx.__h.noughtRun()
    const log = (ctx.__h.noughtState().announce ?? []).map((a) => a.text).join(' / ')
    ok(/strikes the dummy/.test(log),
      /strikes the dummy/.test(log) ? 'and a gambit on a pell says so in the world log'
        : 'the log of a gambit on a pell reads: ' + (log || 'nothing'))
    ctx.__h.leaveNought()
  }
  // A GOBLIN IS NOT A YARD TARGET. 20e grants the dummy and nothing else, so
  // the window must say that rather than send a deed the pillar throws away
  // without a word, and must not spend the arm saying it.
  {
    const st = yard()
    ctx.__h.enterNought(st, E, me)
    ctx.__h.hush(); sent.length = 0
    arm()
    ctx.__h.press(12, 12, false)
    const act = sent.find((a) => a && a.do === 'gambit')
    const said = ctx.__h.said().join(' ')
    ok(!act && /gambit/i.test(said) && ctx.__h.armed(),
      !act && /gambit/i.test(said) && ctx.__h.armed()
        ? 'a gambit aimed at a goblin is refused in words, and stays armed'
        : 'pressing a goblin with a gambit armed: sent '
          + (act ? 'a gambit anyway' : 'nothing') + ', said "' + said
          + '", armed ' + ctx.__h.armed())
    ctx.__h.leaveNought()
  }
  // AND THE RIGHT BUTTON OFFERS IT BY NAME without doing the left one's work,
  // which is 7ek: a menu lists what is available and presses nothing itself.
  {
    const st = yard()
    ctx.__h.set(st, ID)
    ctx.__h.hush(); sent.length = 0
    arm()
    const g9 = ctx.__h.spy()
    ctx.__h.press(10, 13, true)
    const opts = g9() ?? []
    const row = opts.find((o) => o && /gambit/.test(o.label ?? ''))
    ok(!!row && !sent.some((a) => a && a.do === 'gambit'),
      row ? 'the right button offers the gambit by name and sends nothing on its own'
        : 'a right press on the butt with a gambit armed offered: '
          + opts.map((o) => o && (o.label ?? o.head)).join(', '))
    // and it is NOT offered when there is nothing to offer
    const g8 = ctx.__h.spy()
    armTo(false)                                          // stand down
    ctx.__h.press(10, 13, true)
    const bare = (g8() ?? []).find((o) => o && /gambit/.test(o.label ?? ''))
    ok(!bare, bare ? 'the gambit is offered on the butt with nothing armed'
      : 'and it is absent from the menu when no gambit is armed')
  }
}

console.log('\n--- 8k. the world does not spell itself out ---')
{
  // "I do not think it should say that it takes two minutes to go around.
  // Discovery, you know. Things should not be spelled out like that, it
  // should be discovered by the player."
  //
  // The window already had the rule for a LOOK and had been keeping it since
  // the skill guide was written: names and levels, never yields, odds or
  // tactics. What it did not have was the rest of the sentence. A duration, a
  // distance and a count of how many of a thing exist are the same kind of
  // telling, and they were everywhere: the toll keeper priced the detour at
  // two minutes, the well said how many seconds it wanted, the eel rack and
  // the willow buck both counted minutes at you, four spells printed how much
  // they take and how long it lasts, and six looks gave away a yield or a
  // tally ("two to a cast", "worth a quarter more", "there are seven on the
  // island").
  //
  // THE LINE. A gate may be shown, because a gate is a door a player would
  // otherwise rattle in the dark: the level, the cost, the tool, the number
  // of bucks you may have out, what a thing is FOR. A yield may not: how much
  // it gives, how long it takes, how far it reaches, how many there are. An
  // item's look still carries damage, accuracy and armour, because those are
  // the stats a player compares two swords with, and it no longer carries
  // reach or what a food mends, which are discovery.
  //
  // This reads the window's own prose rather than any list of what was
  // changed, so a line added next year is caught the same day.
  const NUM = '(?:\\d+|one|two|three|four|five|six|seven|eight|nine|ten|twelve|sixteen|twenty|thirty|forty)'
  const TELL = new RegExp('(?:' + NUM + '[- ](?:second|minute|interval|tick|tile|pace|step)s?\\b'
    + '|\\b' + NUM + ' (?:second|minute|interval|tick|tile|pace|step)s?\\b'
    + '|\\bgives back\\b|\\bto a cast\\b|\\ba quarter more\\b|\\bthirds the time\\b'
    + '|\\bon the island\\b|\\breaches \\d|\\bthere (?:is|are) ' + NUM + '\\b'
    + '|\\bin about \\b|\\bper cent\\b)', 'i')
  // what is deliberately excepted, and why, in the manner of section 1
  const ALLOWED = [
    ['There are two worlds here.', 'the login page, telling you which world you are about to enter'],
    ['In about ten minutes you can cross.', 'the vigil before a new citizen may enter the real world: nobody could discover it by waiting, they would only think the window had hung'],
    ['Take one step, or any deed, and the leg counts.', 'a rule about the walk, not a quantity'],
    ['It is on the island for as long as the island is.', 'a dedication saying it is permanent'],
    ['The best timber on the island.', 'what a heartwood IS'],
    ['the stone gives back flour', 'the mill saying what it does'],
  ]
  const told = []
  for (const line of html.split('\n')) {
    const t = line.trim()
    if (t.startsWith('//') || t.startsWith('*')) continue
    for (const m of line.matchAll(/'((?:[^'\\]|\\.){8,240})'/g)) {
      const v = m[1]
      if (!/[a-z] [a-z]/.test(v)) continue
      if (!TELL.test(v)) continue
      if (ALLOWED.some(([a]) => v.includes(a))) continue
      if (!told.includes(v)) told.push(v)
    }
  }
  ok(told.length === 0, told.length === 0
    ? 'nothing the window says gives away a yield, a duration, a distance or a tally, '
      + 'past the ' + ALLOWED.length + ' named exceptions'
    : told.length + ' line(s) spell the world out: ' + told.map((v) => '"' + v.slice(0, 90) + '"').join('; '))
  // and the two tables a look comes out of hold no numbers at all
  const looks = (name) => { const i = html.indexOf('const ' + name + ' = {')
    return html.slice(i, html.indexOf('\n}', i)) }
  for (const tbl of ['NODE_LOOK', 'MOB_LOOK']) {
    const bad = looks(tbl).split('\n').filter((l) => !l.trim().startsWith('//') && /\b\d+\b/.test(l))
    ok(bad.length === 0, bad.length === 0
      ? 'and ' + tbl + ' carries no number at all'
      : tbl + ' still counts at the player: ' + bad.map((l) => l.trim().slice(0, 70)).join(' | '))
  }
}

console.log('\n--- 8w. a blow lands when the weapon gets there ---')
{
  // §7ep: "Combat animations should be more smooth, not so hacky. I know there
  // is an interval every second but animations still do not have to look
  // hacky."
  //
  // Two separate faults wore the same face. The swing was sin(beat * PI), a
  // symmetric curve over the whole interval at one speed throughout, which is
  // the floaty look; and every OTHER part of a blow -- the number, the beast's
  // flinch, the clang, the citizen's recoil -- fired the instant the state
  // arrived, four hundred milliseconds before the arm reached the target.
  // Effect, then cause, on every hit in the game.
  //
  // The curve is a pure function and is lifted and run here. The timing is
  // asked of the window: feed a state in which something has just been hit,
  // and see when the number appears.
  // NOTE: the source is `html` here. `win` is the fake window object this
  // file builds, and asking IT for indexOf throws rather than failing.
  const bl9 = html.indexOf('const blowAt = (b,')
  ok(bl9 > 0, bl9 > 0 ? 'the blow has a shape of its own'
    : 'blowAt is gone or renamed, so nothing below measures anything')
  const consts = html.slice(html.indexOf('const BLOW_BACK'), bl9)
  const curve = html.slice(bl9, html.indexOf('\nconst splats', bl9))
  const blowAt = new Function(consts + '\n' + curve + '\nreturn blowAt')()
  const K = new Function(consts + '\nreturn { BLOW_BACK, BLOW_THROUGH, BLOW_LANDS, '
    + 'BLOW_GUARD, BLOW_ANSWER }')()
  // IT BEGINS AND ENDS AT THE GUARD. The old one began at zero while the arm
  // between blows sat at a quarter, so every exchange tick opened with a jump.
  const at0 = blowAt(0), at1 = blowAt(0.999)
  ok(Math.abs(at0 - K.BLOW_GUARD) < 0.02 && Math.abs(at1 - K.BLOW_GUARD) < 0.03,
    Math.abs(at0 - K.BLOW_GUARD) < 0.02 && Math.abs(at1 - K.BLOW_GUARD) < 0.03
      ? 'the blow begins and ends at the guard, so no interval opens with a jump'
      : 'the arm jumps across the interval boundary: ' + at0.toFixed(3)
        + ' at the start and ' + at1.toFixed(3) + ' at the end, against a guard of '
        + K.BLOW_GUARD)
  // IT WINDS UP. Anticipation is the difference between a strike and an arm
  // sliding forward, and a sine has none: it leaves from rest going forward.
  let low = 1
  for (let b = 0; b < K.BLOW_BACK; b += 0.005) low = Math.min(low, blowAt(b))
  ok(low < -0.2, low < -0.2
    ? 'and draws back to ' + low.toFixed(2) + ' before it comes through'
    : 'the arm never draws back (lowest ' + low.toFixed(2) + '), so there is no wind-up')
  // AND IT ARRIVES WHERE IT SAYS IT DOES, which is the constant everything
  // else in a blow is timed against.
  let peak = -9, peakAt = 0
  for (let b = 0; b < 1; b += 0.002) { const v = blowAt(b); if (v > peak) { peak = v; peakAt = b } }
  ok(Math.abs(peakAt - K.BLOW_LANDS) < 0.06,
    Math.abs(peakAt - K.BLOW_LANDS) < 0.06
      ? 'and is furthest out at ' + peakAt.toFixed(2) + ', which is where BLOW_LANDS says'
      : 'the arm is furthest out at ' + peakAt.toFixed(2) + ' and the number is timed '
        + 'to ' + K.BLOW_LANDS + ': they do not agree')
  // AND THE BLOW IS FASTER THAN THE RECOVERY. This is the whole of "not so
  // hacky": a symmetric sine passes every test above and still looks wrong,
  // because it travels out at the same speed it comes back.
  const speed = (a, b) => Math.abs(blowAt(b) - blowAt(a)) / (b - a)
  const through = speed(K.BLOW_BACK, K.BLOW_BACK + K.BLOW_THROUGH * 0.5)
  const back = speed(0.8, 0.95)
  ok(through > back * 3, through > back * 3
    ? 'and comes through ' + (through / back).toFixed(1) + ' times faster than it recovers'
    : 'the blow goes out at the speed it comes back (' + through.toFixed(1) + ' against '
      + back.toFixed(1) + '), which is the floaty swing again')
  // THE ANSWERING BLOW IS LATER. An exchange is two blows, and both used to
  // happen at the top of the interval, together.
  ok(K.BLOW_ANSWER > K.BLOW_LANDS + 0.1 && K.BLOW_ANSWER < 0.95,
    K.BLOW_ANSWER > K.BLOW_LANDS + 0.1 && K.BLOW_ANSWER < 0.95
      ? 'and what hits back lands later in the same interval, at ' + K.BLOW_ANSWER.toFixed(2)
      : 'the answering blow lands at ' + K.BLOW_ANSWER + ', which is not an exchange')
  // AND THE NUMBER WAITS. Asked of the window: hit a creature and watch.
  {
    const st = fresh()
    st.mobs.foe = { type: 'goblin', x: 11, y: 10, health: 40, hp: 40 }
    ctx.__h.msg({ type: 'state', state: JSON.parse(JSON.stringify(st)), worldId: WID })
    const st2 = JSON.parse(JSON.stringify(st))
    st2.tick = st.tick + 1; st2.mobs.foe.hp = 33; st2.mobs.foe.health = 33
    CLOCK = 500000
    ctx.__h.msg({ type: 'state', state: st2, worldId: WID })
    const numbersAt = (t) => { CLOCK = t; penSaid.length = 0
      try { ctx.__h.drawAt(t) } catch (e) { return 'THREW ' + e.message }
      return penSaid.filter((x) => x === '7' || x === 7).length }
    const early = numbersAt(500000 + 60)
    const late = numbersAt(500000 + K.BLOW_LANDS * 1000 + 80)
    ok(early === 0, early === 0
      ? 'and the number is not on the screen before the weapon is'
      : 'the damage is shown ' + Math.round(K.BLOW_LANDS * 1000) + 'ms before the blow '
        + 'lands (' + early + ' drawn at the top of the interval)')
    ok(late > 0, late > 0
      ? 'and it is there once the blow has landed'
      : 'the number never appears at all, so this measures nothing')
  }
}

console.log('\n--- 8u. every ranged arm is drawn as the thing it is ---')
{
  // §7eq: "The horn bow is identical to a normal bow when held and walking.
  // Only in combat does it change into the appearance it actually has."
  //
  // The carried drawing told two of the eight bows apart and painted the other
  // six in one brown, and it was reached by asking RANGED_ITEMS, which also
  // holds a hand cannon and three javelins: both of those were slung on their
  // owners' backs as bows.
  //
  // Two things to ask, and neither needs a photograph. Does every ranged arm
  // belong to exactly one of the three drawings, and does every bow look
  // different from every other bow. A table that paints six bows one colour
  // passes any check that only asks whether the word is in the file.
  const B = ctx.__h.bows()
  const bowOf = (it) => B.look[it]
  const homeless = B.ranged.filter((it) =>
    !bowOf(it) && !B.thrown.includes(it) && !B.shot.includes(it))
  ok(homeless.length === 0, homeless.length === 0
    ? 'all ' + B.ranged.length + ' ranged arms are a bow, a javelin or a gonne'
    : 'drawn as nothing in particular: ' + homeless.join(', '))
  const double = B.ranged.filter((it) =>
    [!!bowOf(it), B.thrown.includes(it), B.shot.includes(it)].filter(Boolean).length > 1)
  ok(double.length === 0, double.length === 0
    ? 'and none of them is drawn two ways at once'
    : 'drawn two ways: ' + double.join(', '))
  // AND NO TWO BOWS ARE THE SAME PICTURE. This is the fault itself: six rows
  // with one limb colour between them would have been six bows a citizen
  // cannot tell apart, which is what was reported.
  const seen = new Map(), same = []
  for (const [it, b] of Object.entries(B.look)) {
    const k = [b.limb, b.string, b.span, b.thick, !!b.glow, !!b.sigils, b.stock ?? 0].join('|')
    if (seen.has(k)) same.push(seen.get(k) + ' and ' + it); else seen.set(k, it)
  }
  ok(same.length === 0, same.length === 0
    ? 'and all ' + Object.keys(B.look).length + ' bows are told apart by their own drawing'
    : 'these bows are drawn identically: ' + same.join(', '))
  // and every bow the ENGINE has is in the table, which is the copied-table
  // trap: a bow added to WEAPONS and not here draws as a wooden one.
  const engineBows = Object.keys(E.WEAPONS).filter((w) => /bow$/.test(w))
  const missing = engineBows.filter((w) => !bowOf(w))
  ok(missing.length === 0, missing.length === 0
    ? 'and the engine has no bow this window has never heard of'
    : 'the engine has bows with no drawing: ' + missing.join(', '))
}

console.log('\n--- 8v. the body shoots, rather than standing still ---')
{
  // §7er: "When shooting with the bow the string goes backwards and the
  // arrow goes flying, that is good, but the citizen is standing completely
  // still. It looks weird."
  //
  // THE FIRST VERSION OF THIS CHECK WAS WORTHLESS and said so only when it was
  // run against the fault. It drew the whole scene twice and compared every
  // mark, which passes whether or not the body moves: a frame holds the water,
  // the leaves, the day and the BOW, all of which were animating before any of
  // this was written. A check that cannot fail is worse than no check.
  //
  // So it asks the legs, which is where a stance actually lives. They are
  // drawn 3.4 wide and `7 - Math.abs(step)` tall, and `step` is zero for
  // anybody standing: a leg exactly 7 tall is a man standing about, and a
  // shorter one is a man braced. Nothing else in this window draws a leg.
  // A STRUCK BODY DOES NOT SHOOT, which is right, and it made the first
  // reading nonsense: `hurt` is 320ms from the last time this citizen was hit
  // and an earlier section had hit them, so a frame drawn at t=1000 was a
  // frame of somebody flinching. Every frame here is taken well clear of it.
  const T0 = 400000
  const archerState = (wep) => {
    const st = fresh()
    const p9 = st.players[ID]
    p9.equipment.weapon = { item: wep, qty: 1 }
    p9.inventory[0] = { item: wep === 'handgonne' ? 'shot' : 'arrows', qty: 99 }
    p9.action = { type: 'attack', mobId: 'foe', since: 0 }
    // THE TARGET IS OFF THE EDGE OF THE VIEW, so the only body in the frame is
    // the archer's. `shooting` asks only that the mob exists and is more than
    // one tile off; the drawing culls what nobody can see. With a goblin four
    // tiles away this measured the GOBLIN'S legs as well, and passed happily
    // against an archer who was not moving at all.
    st.mobs.foe = { type: 'goblin', x: 90, y: 10, health: 5, hp: 5 }
    st.tick = 600                             // even, so the exchange is on
    return st
  }
  // THROUGH THE WINDOW'S OWN DOOR. `set()` puts the state in `world` and the
  // drawing works off the PREPARED state, so a frame drawn after a bare set is
  // a frame of whatever was there before: an earlier cut of this compared two
  // frames of the state section 8s had left behind and reported that an archer
  // and a man standing about are drawn identically. They were, because neither
  // of them was in the picture.
  const marksAt = (st, t) => {
    // AND THE CLOCK GOES WITH IT. The window works out how far through an
    // interval it is from `performance.now()` against the moment the state
    // arrived, and this harness's clock does not move on its own: with the
    // state landing at 1000 and the frame drawn at 400000, every frame was
    // 399 seconds into a one-second interval and clamped to the very end of
    // it. Two frames taken that way are the same frame, and the check read
    // that as a stance that never changes.
    CLOCK = T0 - 1
    ctx.__h.msg({ type: 'state', state: JSON.parse(JSON.stringify(st)), worldId: WID })
    CLOCK = t
    penRect.length = 0
    try { ctx.__h.drawAt(t) } catch (e) { return { threw: e.message } }
    // 3.4 wide and between five and seven and a half tall. The width alone
    // also catches a 1.2-tall mark elsewhere in the frame, which is not a leg
    // and dragged the measurement with it.
    const legs = penRect.filter((r) =>
      Math.abs(r[2] - 3.4) < 0.001 && r[3] > 5 && r[3] <= 7.5)
    // THE SPREAD, which is the stance. The two legs are drawn at
    // X + 16 + step * 1.5 and X + 21 - step * 1.5 on the same row, so the gap
    // between them is 5 - 3 * step: five for anybody standing, and wider for
    // anybody braced. Their HEIGHT is 7 - |step| for both, which is a tenth of
    // a pixel of difference and shares its value with the rear arm, so three
    // goes at reading the heights could not tell a braced archer from a man
    // standing about. The gap can.
    const rows = new Map()
    for (const r of legs) { const k = Math.round(r[1] * 10)
      ;(rows.get(k) ?? rows.set(k, []).get(k)).push(r[0]) }
    let gap = null
    for (const xs of rows.values()) if (xs.length === 2)
      gap = Math.round(Math.abs(xs[0] - xs[1]) * 100) / 100
    return { threw: null, gap, legs: legs.map((r) => Math.round(r[3] * 100) / 100),
      // the javelin's shaft, drawn 16 by 1.3 in the throwing hand and by
      // nothing else in this window
      shaft: penRect.some((r) => Math.abs(r[2] - 16) < 0.001 && Math.abs(r[3] - 1.3) < 0.001) }
  }
  const braced = (m) => m.gap !== null && m.gap > 5.01
  {
    const m = marksAt(archerState('horn-bow'), T0)
    ok(!m.threw, m.threw ? 'the archer drawing throws: ' + m.threw
      : 'an archer in a fight draws without throwing')
    ok(!m.threw && m.legs.length > 0,
      m.legs.length ? 'and the body is in the picture (' + m.legs.length + ' legs drawn)'
        : 'nothing with legs was drawn at all, so this measures nothing')
    ok(braced(m), braced(m)
      ? 'and his feet are planted while he shoots, ' + m.gap + ' apart against five'
      : 'an archer stands about while he shoots: his feet are ' + m.gap + ' apart')
  }
  // AND A MAN NOT SHOOTING IS NOT BRACED, or the test above is measuring
  // something every citizen does.
  {
    const st = archerState('horn-bow')
    delete st.players[ID].action; delete st.mobs.foe
    const m = marksAt(st, T0)
    ok(!braced(m), !braced(m)
      ? 'and somebody standing about is drawn standing about (' + m.gap + ' apart)'
      : 'everybody is braced all the time: feet ' + m.gap + ' apart')
  }
  // AND THE BRACE DEEPENS AS THE STRING COMES BACK. A stance that is merely
  // a different fixed pose is a photograph; this is the motion.
  {
    const st = archerState('horn-bow')
    const early = marksAt(st, T0), late = marksAt(st, T0 + 400)
    const a9 = early.gap, b9 = late.gap
    ok(a9 !== b9, a9 !== b9
      ? 'and the brace changes through the draw (' + a9 + ' then ' + b9 + ')'
      : 'the stance is one fixed pose: both frames are ' + a9)
  }
  // AND A THROWER IS NOT AN ARCHER. All three javelins are in RANGED_ITEMS, so
  // a thrower was given the bowstring, the nocked arrow and the loose. The
  // shaft in his hand is the thing an archer never has.
  {
    const j = marksAt(archerState('iron-javelin'), T0)
    const b9 = marksAt(archerState('horn-bow'), T0)
    ok(j.shaft, j.shaft ? 'a javelin thrower has a javelin in his hand'
      : 'a thrower holds no javelin while he throws it')
    ok(!b9.shaft, !b9.shaft ? 'and an archer does not' : 'an archer is holding a javelin')
  }
}

console.log('\n--- 9. the spellbook says what the engine asks ---')
{
  // THE BOOK IS A TABLE OF CONSTITUTIONAL NUMBERS and it had drifted twice.
  // It said mending another wants sorcery 50 where the engine asks 75, and
  // the sigil in the pack offered mend at 20 where the engine asks 50. A
  // citizen reads those numbers to decide what to train. They are not served
  // (that would want an engine change and a refounding), so they are held to
  // the engine's SOURCE here.
  const num = (name) => {
    const m = new RegExp('\\b' + name + '\\s*=\\s*(\\d+)').exec(eng)
    return m ? Number(m[1]) : null
  }
  const book = (() => {
    const i = html.indexOf('const SPELLBOOK = {')
    const a = html.indexOf('{', i)
    let d = 0, j = a
    for (; j < html.length; j++) { if (html[j] === '{') d++; else if (html[j] === '}') { d--; if (!d) break } }
    return Function('return ' + html.slice(a, j + 1))()
  })()
  const WANT = {
    mend: { lvl: num('MEND_REQ'), every: num('MEND_EVERY') },
    mendp: { lvl: num('MENDP_REQ'), reach: num('MENDP_RANGE') },
    still: { lvl: num('STILL_LEVEL'), sigils: num('STILL_SIGILS'), reach: num('STILL_RANGE') },
    seal: { reach: num('SEAL_RANGE') },
    unmake: { reach: num('UNMAKE_RANGE') },
    rot: { lvl: num('ROT_LEVEL'), sigils: num('ROT_SIGILS'), reach: num('ROT_REACH') },
    taking: { lvl: num('TAKING_LEVEL'), sigils: num('TAKING_SIGILS'), reach: num('TAKING_REACH'),
      every: num('TAKING_EVERY') },
    waking: { lvl: num('WAKING_LEVEL'), sigils: num('WAKING_SIGILS'), reach: num('WAKING_REACH'),
      every: num('WAKING_EVERY') },
    withering: { lvl: num('WITHER_LEVEL'), sigils: num('WITHER_SIGILS'), reach: num('WITHER_REACH') },
  }
  const all = [...(book.common ?? []), ...(book.barrow ?? [])]
  const wrong = []
  for (const [v, want] of Object.entries(WANT)) {
    const sp = all.find((x) => x.v === v)
    if (!sp) { wrong.push('the book has no ' + v); continue }
    for (const [k, n] of Object.entries(want)) {
      if (n === null) { wrong.push('engine.js no longer names the number for ' + v + '.' + k); continue }
      if (sp[k] !== n) wrong.push(v + '.' + k + ' says ' + sp[k] + ', the engine asks ' + n)
    }
  }
  ok(wrong.length === 0, wrong.length ? wrong.join('; ')
    : 'all ' + Object.keys(WANT).length + ' spells carry the engine\u2019s own level, cost and reach')
  // TRANSMUTE IS THE ONE THAT SPENDS NO SIGIL, and the book charged one for
  // it, so a caster carrying none was told they could not do the thing they
  // could. The engine says it in as many words beside the case; this holds
  // the book to the case itself.
  {
    const i = eng.indexOf("case 'transmute': {")
    const blk = eng.slice(i, eng.indexOf("case 'cast': {", i))
    const tm = all.find((x) => x.v === 'transmute')
    const bad2 = []
    if (!tm) bad2.push('the book has no transmute')
    else {
      if (/countItem\(p\.inventory, 'sigil'\)|item === 'sigil'/.test(blk))
        bad2.push('the engine now asks transmute for a sigil and the book does not')
      else if (tm.sigils !== 0) bad2.push('the book charges transmute ' + tm.sigils
        + ' sigils and the engine spends the thing itself')
      // the instruments, taken from the clause that refuses a bare hand
      const hands = [...blk.matchAll(/held !== '([a-z-]+)'/g)].map((m) => m[1]).sort()
      const mine = [...(tm.hands ?? [])].sort()
      if (hands.length && mine.join(' ') !== hands.join(' '))
        bad2.push('transmute wants one of [' + hands.join(', ') + '] in hand; the book says ['
          + mine.join(', ') + ']')
    }
    ok(bad2.length === 0, bad2.length ? bad2.join('; ')
      : 'and transmute spends the thing itself, with any of the four instruments in hand')
  }
  // and the two books hold what the engine says they hold
  const BOOKS = (() => {
    const i = eng.indexOf('const BOOKS = {')
    const a = eng.indexOf('{', i)
    let d = 0, j = a
    for (; j < eng.length; j++) { if (eng[j] === '{') d++; else if (eng[j] === '}') { d--; if (!d) break } }
    const out = {}
    for (const m of eng.slice(a, j + 1).matchAll(/(\w+):\s*new Set\(\[([^\]]*)\]\)/g))
      out[m[1]] = m[2].split(',').map((t) => t.trim().replace(/['"]/g, '')).filter(Boolean)
    return out
  })()
  const off = []
  for (const [name, words] of Object.entries(BOOKS)) {
    const mine = (book[name] ?? []).map((sp) => sp.v).sort().join(' ')
    const theirs = [...words].sort().join(' ')
    if (mine !== theirs) off.push(name + ': the window has [' + mine + '], the engine has [' + theirs + ']')
  }
  ok(off.length === 0, off.length ? off.join('; ')
    : 'and each book holds exactly the words the engine puts in it')
  // the Lists span, which the window copies so it can stop offering words
  // where none may be spoken
  const span = num('LISTS_SPAN')
  const mineSpan = /const LISTS_SPAN_W = (\d+)/.exec(html)
  ok(span !== null && mineSpan && Number(mineSpan[1]) === span,
    'and the window keeps the engine\u2019s span for the Lists (' + (mineSpan ? mineSpan[1] : '?')
      + ' vs ' + span + ')')
}

console.log('\n--- 10. nothing a menu says is a symbol ---')
{
  // A MENU IS A SENTENCE, NOT A DIAGRAM. The spell rows carried a diamond for
  // the sigil, and the headings were held together with middots: typography
  // standing in for words, in a window whose whole register is plain English.
  // Quantities were a times sign, which reads as arithmetic where a count and
  // a noun would do.
  //
  // Every label and heading this check has raised, in all nine sections
  // above, is read back here. That is the real text a citizen sees, not a
  // guess at it from the source.
  const said = [...new Set(ctx.__said ?? [])]
  // the apostrophe and the ellipsis are punctuation and stay; everything
  // outside plain ASCII otherwise is a symbol and does not belong
  const KEEP = new Set(['\u2019', '\u2026'])
  const bad10 = said.filter((t) => [...String(t)].some((c) => c.charCodeAt(0) > 126 && !KEEP.has(c)))
  ok(bad10.length === 0, bad10.length
    ? bad10.length + ' carry a symbol: ' + bad10.slice(0, 6).join(' | ')
    : 'all ' + said.length + ' labels and headings are words, with no glyph standing in for one')
  const dotted = said.filter((t) => / \u00b7 |&middot;/.test(String(t)))
  ok(dotted.length === 0, dotted.length
    ? dotted.length + ' are held together with a separator dot: ' + dotted.slice(0, 4).join(' | ')
    : 'and none of them is held together with a separator dot')
}

console.log(bad ? `\n${bad} failure(s).` : '\nevery deed the world offers is reachable.')
process.exit(bad ? 1 : 0)
