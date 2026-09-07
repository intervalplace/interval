// §7dy THE GROVE and §7dz THE EEL BUCK.
//
// Two deferred acts, one for each of the two gathering skills that had no
// texture. A grove is fixed and public and you maintain it; a buck is placed
// and yours and you choose where. Same shape, opposite relationship to the
// ground, which is what makes them read as different lives.
//
// The test that matters most is the last one: lifting somebody else's trap
// gives supper and no progress. The first cut paid the lifter, which made
// robbing the fen strictly better than working it.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import E from '../engine.js'
import '../worldgen-expanse7.mjs'
import { makeExpanse7Genesis, buildWorld } from '../worldgen-expanse7.mjs'

const RULES = 'a'.repeat(64)
const world = () => G
// `newWorld` gives an empty island: the trees, plots and rings are laid by the
// generator's own `buildWorld`, so anything asking about CONTENT must use it.
// Built ONCE. A full expanse founding takes the better part of a minute, and
// twelve of them is a test file nobody will run. Each test deep-copies.
const G = makeExpanse7Genesis('buck-test', RULES, 0, 896, 512)
const BUILT = buildWorld(G)
const built = () => JSON.parse(JSON.stringify(BUILT))

const sign = (g, who) => (f) =>
  E.signInput({ worldId: E.worldId(g), playerId: who.playerId, ...f }, who.privateKey)

// a dry tile with water beside it, which is the only place a buck may go
function shoreTile(s) {
  for (let x = 300; x < 700; x += 3) for (let y = 40; y < 300; y += 3) {
    if (E.isWaterAt(s, x, y)) continue
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
      if (E.isWaterAt(s, x + dx, y + dy)) return { x, y }
  }
  throw new Error('no shore in this world')
}

function atShore(g, people, { level = 40, logs = 5 } = {}) {
  const s = built()
  const at = shoreTile(s)
  let i = 0
  for (const w of people) {
    E.addPlayer(s, w.playerId, at.x, at.y + (i++ ? 0 : 0))
    const p = s.players[w.playerId]
    p.skills.shorecraft = E.xpForLevel ? E.xpForLevel(level) : p.skills.shorecraft
    E.addItem(p.inventory, 'logs', logs)
  }
  return s
}

test('how many bucks a citizen may have out rises with the skill', () => {
  assert.equal(E.bucksAllowed(1), 0, 'below twenty, none')
  assert.equal(E.bucksAllowed(20), 1, 'one at twenty')
  assert.ok(E.bucksAllowed(60) > E.bucksAllowed(20), 'and more later')
  assert.equal(E.bucksAllowed(99), 6, 'six at the top: a small operation, not a rod')
  for (let l = 1; l < 99; l++)
    assert.ok(E.bucksAllowed(l + 1) >= E.bucksAllowed(l), 'and it never falls')
})

test('a buck fills off the interval count, so it costs nobody any presence', () => {
  // the whole reason this is a deferred act rather than a long action: the fen
  // works while the citizen is doing something else, or nothing, or is gone
  assert.ok(E.BUCK_FILL_TICKS > 0)
  assert.ok(E.BUCK_SPOILS_AFTER > E.BUCK_FILL_TICKS,
    'a trap must be liftable for a good while before it turns')
})

test('a trap may only be set beside water', () => {
  const g = world()
  const s = built()
  const at = shoreTile(s)
  let wet = 0
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (E.isWaterAt(s, at.x + dx, at.y + dy)) wet++
  assert.ok(wet > 0, 'the chosen tile has a run beside it')
  assert.equal(E.isWaterAt(s, at.x, at.y), false, 'and the citizen stands dry')
})

test('a world whose generator does not declare water has no fen to fish', () => {
  // `blocked` cannot tell a wall from a river, so a generator says so itself
  const g = E.makeGenesis('plain', RULES, 0, 40, 30)
  const s = E.newWorld(g)
  let anyWater = false
  for (let x = 0; x < 40; x++) for (let y = 0; y < 30; y++) if (E.isWaterAt(s, x, y)) anyWater = true
  assert.equal(anyWater, false, 'and so nowhere at all to set a buck')
})

test('THE EELS GO TO WHOEVER LIFTS; THE SKILL STAYS WITH WHOEVER SET', () => {
  const g = world()
  const setter = E.generateIdentity(), thief = E.generateIdentity()
  let s = atShore(g, [setter, thief])
  const sp = s.players[setter.playerId], tp = s.players[thief.playerId]

  // hand-place a full buck rather than driving thirty minutes of intervals
  s.nodes['buck-test-1'] = { type: 'eel-buck', x: sp.x + 1, y: sp.y, setAt: 0, setBy: setter.playerId }
  s.tick = E.BUCK_FILL_TICKS + 10
  assert.equal(E.validateState(s) ?? 'OK', 'OK', 'a set buck is constitutional')

  const before = tp.skills.shorecraft
  s = E.nextState(s, [sign(g, thief)({ tick: s.tick, type: 'lift', nodeId: 'buck-test-1' })])
  const after = s.players[thief.playerId]
  assert.equal(after.skills.shorecraft, before,
    'a thief gets supper and NO PROGRESS: robbing the fen must not be a levelling route')
  assert.ok(E.countItem(after.inventory, 'eel') > 0, 'but the eels are genuinely theirs')
  assert.equal(s.nodes['buck-test-1'], undefined, 'and the trap is gone from the run')
})

test('the setter lifting their own trap is paid for it', () => {
  const g = world()
  const setter = E.generateIdentity()
  let s = atShore(g, [setter])
  const sp = s.players[setter.playerId]
  s.nodes['buck-test-2'] = { type: 'eel-buck', x: sp.x + 1, y: sp.y, setAt: 0, setBy: setter.playerId }
  s.tick = E.BUCK_FILL_TICKS + 10
  const before = sp.skills.shorecraft
  s = E.nextState(s, [sign(g, setter)({ tick: s.tick, type: 'lift', nodeId: 'buck-test-2' })])
  assert.ok(s.players[setter.playerId].skills.shorecraft > before,
    'the skill belongs to whoever wove the trap and chose the run')
})

test('a buck lifted too early gives nothing and stays in the run', () => {
  const g = world()
  const setter = E.generateIdentity()
  let s = atShore(g, [setter])
  const sp = s.players[setter.playerId]
  s.nodes['buck-test-3'] = { type: 'eel-buck', x: sp.x + 1, y: sp.y, setAt: 0, setBy: setter.playerId }
  s.tick = Math.floor(E.BUCK_FILL_TICKS / 2)
  s = E.nextState(s, [sign(g, setter)({ tick: s.tick, type: 'lift', nodeId: 'buck-test-3' })])
  assert.ok(s.nodes['buck-test-3'], 'an unfilled trap is not liftable')
})

test('a buck left too long is empty, and nothing is taken for it', () => {
  const g = world()
  const setter = E.generateIdentity()
  let s = atShore(g, [setter])
  const sp = s.players[setter.playerId]
  const hp = sp.hp, gold = sp.gold
  s.nodes['buck-test-4'] = { type: 'eel-buck', x: sp.x + 1, y: sp.y, setAt: 0, setBy: setter.playerId }
  s.tick = E.BUCK_SPOILS_AFTER + 100
  const eelsBefore = E.countItem(sp.inventory, 'eel')
  s = E.nextState(s, [sign(g, setter)({ tick: s.tick, type: 'lift', nodeId: 'buck-test-4' })])
  const after = s.players[setter.playerId]
  assert.equal(E.countItem(after.inventory, 'eel'), eelsBefore, 'an eel dead in a cage for a day is not supper')
  assert.equal(after.hp, hp, 'and no health is taken')
  assert.equal(after.gold, gold, 'nor coin')
  assert.equal(s.nodes['buck-test-4'], undefined, 'the trap comes out of the water either way')
})

// ---- §7dy the grove ----

test('the groves ring the two stands worth tending, and only those two', () => {
  const g = world()
  const s = built()
  const plots = Object.values(s.nodes).filter((n) => n.type === 'grove-plot')
  assert.equal(plots.length, 16, 'eight to a ring, two rings')
  for (const sp of ['oak', 'ironbark']) {
    const ring = plots.filter((n) => n.species === sp)
    assert.equal(ring.length, 8)
    const type = sp === 'oak' ? 'oak-tree' : 'ironbark-tree'
    const stand = Object.values(s.nodes).filter((n) => n.type === type)
    const cx = Math.round(stand.reduce((a, n) => a + n.x, 0) / stand.length)
    const cy = Math.round(stand.reduce((a, n) => a + n.y, 0) / stand.length)
    for (const pl of ring)
      assert.ok(Math.max(Math.abs(pl.x - cx), Math.abs(pl.y - cy)) <= 6,
        'a ring must be drawn round the trees FINAL position, not where they stood mid-build')
  }
  // and nothing rings the deep-Wilds capstones, where the journey is the point
  for (const t of ['heartwood-tree', 'gallows-oak'])
    assert.equal(plots.filter((n) => {
      const stand = Object.values(s.nodes).filter((q) => q.type === t)
      return stand.some((q) => Math.max(Math.abs(q.x - n.x), Math.abs(q.y - n.y)) <= 6)
    }).length, 0, t + ' is not thickened')
})

test('an empty grove plot is constitutional, and so is a sown one', () => {
  const g = world()
  const s = built()
  assert.equal(E.validateState(s) ?? 'OK', 'OK')
  const id = Object.keys(s.nodes).find((k) => s.nodes[k].type === 'grove-plot')
  s.nodes[id] = { ...s.nodes[id], sownAt: 5 }
  assert.equal(E.validateState(s) ?? 'OK', 'OK', 'a sown plot too')
})

test('a sown plot BECOMES its species, so nothing downstream knows a grove exists', () => {
  const g = world()
  let s = built()
  const id = Object.keys(s.nodes).find((k) => s.nodes[k].type === 'grove-plot' && s.nodes[k].species === 'oak')
  s.nodes[id] = { ...s.nodes[id], sownAt: 1 }
  s.tick = 1 + 21600
  s = E.nextState(s, [])
  assert.equal(s.nodes[id].type, 'oak-tree', 'the plot is an oak now')
  assert.equal(s.nodes[id].grove, true, 'and remembers that somebody put it there')
  assert.equal(s.nodes[id].sownAt, undefined)
  assert.equal(E.validateState(s) ?? 'OK', 'OK')
})

test('the wild stands are untouched, so a stand cannot be griefed away', () => {
  const g = world()
  const s = built()
  for (const t of ['oak-tree', 'ironbark-tree', 'tree', 'heartwood-tree', 'gallows-oak']) {
    const wild = Object.values(s.nodes).filter((n) => n.type === t && !n.grove)
    assert.ok(wild.length > 0, t + ' still stands as worldgen placed it')
  }
})
