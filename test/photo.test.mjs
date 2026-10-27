// CAN A THUMB REACH THE WORLD FROM THE PHOTO WINDOW.
//
// Nothing covered window-photo.html. It is routed at /photo and /play/photo,
// and when it was measured against the engine it could BUILD 83 of the 88
// inputs a citizen may send and could REACH four: a beast to attack, a node to
// gather from, a pile to walk to, and ten verbs in a pack sheet. Tapping
// another citizen did nothing whatever -- the tap handler had no branch for
// `player`, so the press fell through to the ground behind them and walked you
// a step. Every node in the world answered "you make for the work" and sent a
// `gather` the engine threw away in silence.
//
// The whole of that is one section of the file, so this slices the section out
// and presses it, which is how identity.test.mjs reads a window and the only
// way to test a one-file window without a browser in the room. What it drives
// is what a thumb drives: openSheet on a pack slot, nodeSheet on a node,
// citizenSheet on a citizen, pileSheet on a heap.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import E from '../engine.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(here, '..')
const src = fs.readFileSync(path.join(root, 'window-photo.html'), 'utf8')

const START = '// §7f-v: WHAT THIS WINDOW COULD PUT ON WAS THREE THINGS.'
const END = 'function renderPack() {'
const a = src.indexOf(START), b = src.indexOf(END)
assert.ok(a > 0 && b > a, 'window-photo no longer has the sheet section')
const SECTION = src.slice(a, b)

// everything the section reaches outside itself, and nothing it does not: if
// the window starts using something new, this fails rather than passing on a
// silently-undefined global.
const PRELUDE = `
let world = null, ownKey = { pub: 'me' }
let walkGoal = null, huntTarget = null, workTarget = null
const said = [], SENT = []
const feed = (t) => said.push(String(t))
const send = (a) => SENT.push(a)
const sndX = () => {}
const stepToward = () => {}
const XP_LVL = (xp) => ${E.levelForXp.toString().includes('=>') ? '0' : '0'}
const PRICES = ${JSON.stringify(E.PRICES)}
const XP_TO_LVL = (xp) => { let l = 1; const T = ${JSON.stringify(E.XP_TABLE)}
  while (l < T.length - 1 && xp >= T[l + 1]) l++
  return l }
const callingOf = () => 'newcomer'
const standingOf = () => 0
let SHEET = null
const sheetEl = { style: {}, children: [],
  get innerHTML () { return '' }, set innerHTML (v) { this.children.length = 0 },
  appendChild (c) { this.children.push(c) } }
const document = { createElement: (tag) => ({ tagName: String(tag).toUpperCase(),
  style: {}, dataset: {}, className: '',
  textContent: '', set onclick (f) { this._f = f }, get onclick () { return this._f } }) }
let selSlot = -1, lastInvSig = ''
let packEl = { innerHTML: '', appendChild () {} }
`
const EPILOGUE = `
// the sheet, as a plain list of what a thumb can see and press
const rowsOf = () => sheetEl.children.map((c) => ({
  label: c.textContent, dim: c.className === 'dim', cancel: c.className === 'cancel',
  head: c.className === 'head' || c.tagName === 'H4', press: c._f }))
return { openSheet, nodeSheet, citizenSheet, pileSheet, openList, openForgeSheet,
    rowsOf, said, SENT, FORGE, HEALS, EQUIPPABLE, wieldFrom, tableSheet, openTable,
    setWorld: (w) => { world = w }, sheetEl }
`
// XP_LVL is the window's own name for XP_TO_LVL; keep the two in step here too
const WIN = (0, eval)('(() => {' + PRELUDE.replace('const XP_LVL = (xp) => 0',
  'const XP_LVL = (xp) => XP_TO_LVL(xp)') + '\n' + SECTION + '\n' + EPILOGUE + '})()')

function makeWorld(over = {}) {
  return {
    tick: 5000,
    genesis: { worldW: 320, worldH: 320, brew: { potCap: 2, buildPlanks: 8, buildOre: 2 },
      watch: { charWood: 5, charLevel: 40, kindleLogs: 5, level: 20, maxOwned: 1 },
      dedication: { floor: 100, stepDen: 4 } },
    players: {
      me: { x: 10, y: 10, hp: 64, gold: 50, name: 'me', skills: {}, inventory: [],
        equipment: {}, crops: {} },
      you: { x: 11, y: 10, hp: 64, gold: 0, name: 'you', skills: {}, inventory: [], equipment: {} },
    },
    mobs: {}, nodes: {}, ground: {},
    ...over,
  }
}
const pack = (...items) => items.map((it) => (typeof it === 'string' ? { item: it, qty: 1 } : it))

test('the pack sheet offers a food every food, not three of them', () => {
  const faults = []
  for (const food of Object.keys(E.HEALS)) {
    const w = makeWorld(); w.players.me.inventory = pack(food)
    WIN.setWorld(w)
    WIN.said.length = 0; WIN.SENT.length = 0
    WIN.openSheet(0)
    const rows = WIN.rowsOf()
    const eat = rows.find((r) => /^eat it/.test(r.label))
    if (!eat) { faults.push(`${food}: no way to eat it`); continue }
    eat.press()
    if (!WIN.SENT.some((s) => s.do === 'eat' && s.slot === 0)) faults.push(`${food}: pressing eat sent nothing`)
  }
  assert.deepEqual(faults, [], faults.join('; '))
})

test('every equippable thing can be wielded from the pack', () => {
  const faults = []
  for (const item of E.EQUIPPABLE) {
    const w = makeWorld(); w.players.me.inventory = pack(item)
    WIN.setWorld(w)
    WIN.SENT.length = 0
    WIN.openSheet(0)
    const row = WIN.rowsOf().find((r) => r.label === 'wield it')
    if (!row) { faults.push(`${item}: no wield`); continue }
    row.press()
    if (!WIN.SENT.some((s) => s.do === 'wield' || s.do === 'unwield')) faults.push(`${item}: pressing wield sent nothing`)
  }
  assert.deepEqual(faults, [], faults.slice(0, 8).join('; '))
})

test('a two-handed weapon lowers the shield first, and in two inputs', () => {
  const w = makeWorld()
  w.players.me.inventory = pack('wooden-bow', null)
  w.players.me.equipment = { offhand: { item: 'iron-shield' } }
  WIN.setWorld(w)
  WIN.SENT.length = 0
  WIN.wieldFrom(0, 'wooden-bow')
  assert.deepEqual(WIN.SENT, [{ do: 'unwield', gear: 'offhand' }],
    'the shield must come off first, and the wield must wait for the next interval')
})

test('tapping a citizen offers the things two citizens do', () => {
  WIN.setWorld(makeWorld())
  WIN.citizenSheet('you')
  const labels = WIN.rowsOf().map((r) => r.label).join(' | ')
  for (const want of ['trade with you', 'attack you', 'remember you', 'fall in behind you'])
    assert.ok(labels.includes(want), `the citizen sheet has no "${want}": ${labels}`)
})

test('a node with more than one verb opens a list, and the verbs are the engine’s', () => {
  const cases = [
    ['furnace', { fuelUntil: 9e9 }, /smelt/],
    ['sawpit', {}, /saw/],
    ['ossuary', {}, /barrow-work/],
    ['ferry', {}, /sail/],
    ['bellwork', {}, /haul/],
    ['spanwork', {}, /plank/],
    ['well', {}, /drink/],
    ['tollgate', {}, /keeper/],
    ['altar', {}, /sigil/],
    ['stamp', {}, /(crush|quick-stone)/],
    ['eel-buck', {}, /buck/],
    ['grove-plot', {}, /sapling/],
  ]
  const faults = []
  for (const [type, extra, want] of cases) {
    const w = makeWorld()
    w.nodes.n1 = { type, x: 11, y: 10, ...extra }
    w.players.me.inventory = pack('logs', 'planks', 'quick-stone', 'grain', 'iron-ore', 'coal')
    WIN.setWorld(w)
    WIN.said.length = 0
    WIN.nodeSheet('n1', w.nodes.n1)
    const text = WIN.rowsOf().map((r) => r.label).join(' | ') + ' || ' + WIN.said.join(' ')
    if (!want.test(text)) faults.push(`${type}: ${text}`)
  }
  assert.deepEqual(faults, [], faults.join('\n  '))
})

test('a stall sells what the engine says it sells, at the engine’s price', () => {
  const faults = []
  for (const [kind, stock] of Object.entries(E.STALL_SELLS)) {
    const w = makeWorld()
    w.players.me.gold = 10000
    w.nodes.s = { type: 'stall', kind, x: 11, y: 10 }
    WIN.setWorld(w)
    WIN.nodeSheet('s', w.nodes.s)
    const labels = WIN.rowsOf().map((r) => r.label)
    for (const [item, price] of Object.entries(stock)) {
      const row = labels.find((l) => l.startsWith(item.replace(/-/g, ' ')))
      if (!row) { faults.push(`${kind}: no ${item}`); continue }
      if (!row.includes(price + 'g')) faults.push(`${kind}/${item}: ${row} is not ${price}g`)
    }
  }
  assert.deepEqual(faults, [], faults.join('; '))
})

test('a heap of several things lets a citizen reach any of them', () => {
  const w = makeWorld()
  w.ground = { g1: { x: 10, y: 10, item: 'logs', qty: 1 },
               g2: { x: 10, y: 10, item: 'gold-bar', qty: 1 },
               g3: { x: 10, y: 10, item: 'iron-ore', qty: 3 } }
  w.players.me.inventory = [null, null]
  WIN.setWorld(w)
  WIN.pileSheet(10, 10)
  const labels = WIN.rowsOf().map((r) => r.label).join(' | ')
  for (const want of ['logs', 'gold bar', 'iron ore'])
    assert.ok(labels.includes(want), `the heap hides the ${want}: ${labels}`)
})

test('the anvil offers what the engine smiths, and not what the furnace smelts', () => {
  const w = makeWorld()
  w.nodes.a = { type: 'anvil', x: 11, y: 10 }
  WIN.setWorld(w)
  WIN.openForgeSheet()
  const tiers = WIN.rowsOf().filter((r) => !r.cancel && !r.head)
  assert.ok(tiers.length >= 5, 'the anvil shows no tiers: ' + tiers.map((r) => r.label).join(', '))
  // open every tier and collect what it offers
  const offered = new Set()
  for (const t of tiers) {
    t.press()
    for (const r of WIN.rowsOf()) {
      if (r.cancel || r.head) continue
      offered.add(r.label.split(/[:(]/)[0].trim().replace(/ /g, '-'))
    }
  }
  const shouldNot = [...E.SMELTED, 'quick-grit'].filter((k) => offered.has(k))
  assert.deepEqual(shouldNot, [], `the anvil offers what it cannot make: ${shouldNot.join(' ')}`)
  const anvil = Object.keys(E.RECIPES).filter((k) => !E.SMELTED.has(k) && k !== 'quick-grit')
  const missing = anvil.filter((k) => !offered.has(k))
  assert.deepEqual(missing, [], `the anvil cannot make these and the engine can: ${missing.join(' ')}`)
})

test('the table says both sides and the two words that end it', () => {
  const w = makeWorld()
  w.players.me.trade = { with: 'you', slots: [0], gold: 5, settled: false }
  w.players.me.inventory = pack('logs')
  w.players.you.trade = { with: 'me', slots: [], gold: 0, settled: false }
  WIN.setWorld(w)
  WIN.tableSheet()
  const labels = WIN.rowsOf().map((r) => r.label).join(' | ')
  assert.ok(/you offer: logs/.test(labels), labels)
  assert.ok(labels.includes('settle'), labels)
  assert.ok(labels.includes('stand up from the table'), labels)
})

// EVERY NODE THE WORLD STANDS UP ANSWERS A TAP.
//
// The failure this replaces was silent and total: a node with no branch fell
// through to the gather path, so tapping a stall, a hearth, a store, a cart, a
// dedication stone or a waystone said "you make for the work" and sent a
// `gather` the engine threw away. The citizen saw their figure walk over and
// stand there. Nothing said why.
test('every node type in the world says something when it is tapped', () => {
  const silent = []
  for (const type of E.NODE_TYPES) {
    const w = makeWorld()
    w.nodes.n = { type, x: 11, y: 10, kind: 'mill', shelf: { logs: 2 }, ask: 3 }
    w.players.me.inventory = pack('logs', 'planks', 'seeds', 'grain', 'bones', 'quick-stone')
    WIN.setWorld(w)
    WIN.said.length = 0
    WIN.sheetEl.children.length = 0
    try { WIN.nodeSheet('n', w.nodes.n) }
    catch (e) { silent.push(`${type}: threw ${e.message}`); continue }
    const rows = WIN.rowsOf().filter((r) => !r.cancel)
    if (!rows.length && !WIN.said.length) silent.push(`${type}: nothing said and nothing offered`)
  }
  assert.deepEqual(silent, [], silent.join('\n  '))
})

// AND THE DEEDS THAT HAVE A PLACE HAVE A BUTTON IN IT.
//
// A line in the bridge table is not a button. These are the verbs that were
// reachable from no window at all, wired to the places they are done.
test('the deeds that happen at a place are reachable from that place', () => {
  const WHERE = [
    ['stamp', { type: 'stamp' }, ['quick-stone'], 'stamp'],
    ['bellwork', { type: 'bellwork' }, [], 'haul'],
    ['bell', { type: 'bell' }, [], 'sound'],
    ['hoard', { type: 'hoard', shelf: { 'gold-bar': 1 } }, [], 'rifle'],
    ['ferry', { type: 'ferry' }, [], 'sail'],
    ['spanwork', { type: 'spanwork' }, ['planks'], 'lay'],
    ['ossuary', { type: 'ossuary' }, ['logs'], 'offer'],
    ['sawpit', { type: 'sawpit' }, ['logs'], 'saw'],
    ['furnace', { type: 'furnace', fuelUntil: 9e9 }, ['iron-ore', 'iron-ore'], 'smelt'],
    ['eel-buck', { type: 'eel-buck' }, [], 'setbuck'],
    ['eel-buck lift', { type: 'eel-buck' }, [], 'lift'],
    ['grove-plot', { type: 'grove-plot' }, ['sapling'], 'sapling'],
    ['tollgate', { type: 'tollgate' }, ['logs'], 'pay'],
    ['well', { type: 'well' }, [], 'drink'],
    ['altar', { type: 'altar' }, ['quick-stone', 'quick-stone', 'quick-stone'], 'invoke'],
    ['looking-glass', { type: 'looking-glass' }, [], 'set_look'],
    ['cart', { type: 'cart', shelf: { logs: 2 } }, [], 'unload'],
    ['dedication', { type: 'dedication', count: 0 }, [], 'dedicate'],
    ['market', { type: 'market', by: 'me', shelf: { logs: 3 }, ask: 4, coin: 9 }, [], 'price_market'],
    ['market take', { type: 'market', by: 'me', shelf: { logs: 3 }, ask: 4, coin: 9 }, [], 'take_market'],
    ['market down', { type: 'market', by: 'me', shelf: { logs: 3 }, ask: 4, coin: 9 }, [], 'dismantle_market'],
    ['house', { type: 'house' }, Array(10).fill('planks').concat(Array(3).fill('iron-ore')), 'build_brewpot'],
    ['anvil', { type: 'anvil' }, ['iron', 'iron'], 'smith'],
  ]
  const faults = []
  for (const [what, node, carrying, verb] of WHERE) {
    const w = makeWorld()
    w.nodes.n = { x: 11, y: 10, ...node }
    w.players.me.inventory = pack(...carrying, null, null)
    w.players.me.gold = 9999
    w.players.me.name = 'me'
    w.players.me.skills = Object.fromEntries(E.SKILLS.map((s) => [s, E.XP_TABLE[99]]))
    WIN.setWorld(w)
    WIN.SENT.length = 0
    WIN.nodeSheet('n', w.nodes.n)
    // press everything the sheet offers, and everything a press opens, to the
    // depth a thumb would go: the anvil is three (tap, tier, recipe).
    const reopen = () => { WIN.setWorld(w); WIN.nodeSheet('n', w.nodes.n) }
    const walk = (depth, trail) => {
      if (WIN.SENT.some((s) => s.do === verb)) return true
      if (depth > 3) return false
      const n = WIN.rowsOf().filter((r) => !r.cancel && !r.head && r.press).length
      for (let i = 0; i < n; i++) {
        // replay the trail, because a press empties the sheet it was read from
        reopen()
        let rows = WIN.rowsOf().filter((r) => !r.cancel && !r.head && r.press)
        let okTrail = true
        for (const step of trail) {
          if (!rows[step]) { okTrail = false; break }
          try { rows[step].press() } catch { okTrail = false; break }
          rows = WIN.rowsOf().filter((r) => !r.cancel && !r.head && r.press)
        }
        if (!okTrail || !rows[i]) continue
        try { rows[i].press() } catch { continue }
        if (WIN.SENT.some((s) => s.do === verb)) return true
        if (walk(depth + 1, [...trail, i])) return true
      }
      return false
    }
    walk(1, [])
    if (!WIN.SENT.some((s) => s.do === verb)) faults.push(`${what}: no row sends ${verb}`)
  }
  assert.deepEqual(faults, [], faults.join('\n  '))
})

// §7f-ix: NO MESH IS BUILT WITH A MATERIAL THAT DOES NOT EXIST.
//
// `mats.trunk` was used fourteen times in window-photo and defined nowhere.
// `new THREE.Mesh(geo, undefined)` neither fails nor warns: three.js hands the
// mesh a default `MeshBasicMaterial`, which is UNLIT WHITE. So fourteen shapes
// drew as glowing white with no shading on them, and one of the fourteen was
// the landmark fallback, which the island reaches 1,821 times.
//
// This is the "pale slabs lying in a meadow" signature the project has chased
// before. A typo in a material name is silent by design in three.js, so it has
// to be caught here.
test('every material window-photo asks for is one it defines', () => {
  const i = src.indexOf('const mats = {')
  assert.ok(i > 0, 'window-photo no longer has a shared material table')
  let depth = 0, close = -1
  for (let k = src.indexOf('{', i); k < src.length; k++) {
    if (src[k] === '{') depth++
    else if (src[k] === '}') { depth--; if (!depth) { close = k; break } }
  }
  const body = src.slice(src.indexOf('{', i) + 1, close)
  const defined = new Set([...body.matchAll(/^ {2}([A-Za-z_][A-Za-z0-9_]*)\s*:/gm)].map((m) => m[1]))
  // and anything hung on the table afterwards, which is how the detail maps go on
  for (const m of src.matchAll(/\bmats\.([A-Za-z_][A-Za-z0-9_]*)\s*=/g)) defined.add(m[1])
  const used = new Map()
  for (const m of src.matchAll(/\bmats\.([A-Za-z_][A-Za-z0-9_]*)/g))
    used.set(m[1], (used.get(m[1]) ?? 0) + 1)
  const missing = [...used].filter(([k]) => !defined.has(k))
    .map(([k, n]) => `mats.${k}, asked for ${n} time${n === 1 ? '' : 's'}`)
  assert.deepEqual(missing, [], missing.join('; '))
})

// AND EVERY LANDMARK BUILDS, WHICH ONLY BUILDING IT WILL TELL YOU.
//
// `check-window-photo-landmarks.mjs` runs this window's landmark block against
// the real three.js for all ninety-seven kinds the engine will accept, and
// asks three things of each: does it build, did it make anything, and is every
// material a material. It is a checker rather than a test because it needs
// three.js on disk; it is wrapped here because a checker nobody runs is a
// document, which this project has now learned four times.
//
// It is also the only thing that could have found the last two: `wellspring`
// and `grave` are in LANDMARK_KINDS, the island does not currently grow either
// of them so no sweep of the world sees them, and both words appear elsewhere
// in the file as text so the word check called them named. Neither had a
// drawing at all.
test('every landmark kind the engine accepts builds in the photo window', () => {
  const r = spawnSync(process.execPath, [path.join(root, 'check-window-photo-landmarks.mjs')],
    { cwd: root, encoding: 'utf8' })
  assert.equal(r.status, 0, '\n' + r.stdout + r.stderr)
})
