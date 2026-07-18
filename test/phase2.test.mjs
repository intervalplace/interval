// Phase 2 engine-scaling correctness suite (scaling brief, Phase 2B/2C/2D/2E).
// These tests assert that Phase 2 changed COSTS, never ANSWERS: the clone is
// byte-equivalent to the JSON round trip, the indexes return exactly what the
// reference scans return, and whole transitions hash identically with every
// combination of clone mode and index mode — and against the frozen Phase 1
// binary (bench/phase1-engine.cjs).
import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const E = require('../engine.js')
const P1 = require('../bench/phase1-engine.cjs')
E.initCrypto(); P1.initCrypto()
const { buildWorld } = await import('../worldgen.mjs')
const { buildScenario2, inputsForTick } = await import('../bench/phase2-lib.mjs')

const T2 = E._phase2Testing
const canon = E.canonical

// ---------- fixtures ----------

// A small world (fast) decorated so that EVERY optional state field the
// engine can ever write is present somewhere — not just an ordinary new
// world (brief, "Clone Correctness Tests").
function richState() {
  const g = E.makeGenesis('phase2-rich', 'b'.repeat(64), 0, 64, 48)
  const s = buildWorld(g)
  const pids = ['a'.repeat(64), 'b'.repeat(64), 'c'.repeat(64), 'd'.repeat(64)]
  for (const pid of pids) E.addPlayer(s, pid, 20, 20)
  const [p1, p2, p3, p4] = pids.map(pid => s.players[pid])
  const wsId = Object.keys(s.nodes).find(id => s.nodes[id].type === 'waystone')
  const plotId = Object.keys(s.nodes).find(id => s.nodes[id].type === 'plot')
  const mobId = Object.keys(s.mobs)[0]
  // players: every optional field, plus item slots with and without qty
  p1.name = 'rich-one'; s.names['rich-one'] = pids[0]
  p1.gold = 123; p1.attuned = [wsId]
  p1.inventory[0] = { item: 'arrows', qty: 17 }
  p1.inventory[1] = { item: 'logs', qty: 3 }
  p1.inventory[3] = { item: 'chart:' + wsId, qty: 1 }
  p1.equipment.weapon = { item: 'bronze-sword', qty: 1 }
  p1.equipment.head = { item: 'bronze-helm', qty: 1 }
  p1.bank = { ore: 4, logs: 9 }
  p1.action = { type: 'gather', nodeId: Object.keys(s.nodes)[0] }
  p1.trade = { to: pids[1], giveSlot: 0, wantItem: 'logs', wantGold: 0 }
  p1.lightsTried = 7; p1.cooksTried = 3
  p2.action = { type: 'attack', mobId, since: 41 }
  p2.rootedUntil = 100; p2.rootImmuneUntil = 120; p2.rootCdUntil = 400
  p2.brandedUntil = 900; p2.lastInput = 40
  p3.action = { type: 'attackp', targetId: pids[1], since: 42 }
  p4.hp = 0; p4.deadUntil = 60
  // nodes: planted plot, brewing brewpot, burning fire
  s.nodes[plotId].plantedAt = 30; s.nodes[plotId].by = pids[0]
  s.nodes['bp-rich'] = { type: 'brewpot', x: 40, y: 40, by: pids[0], lastUsed: 44, readyAt: 999, brewKind: 'ale', depletedUntil: 0 }
  s.nodes['f-rich'] = { type: 'fire', x: 41, y: 40, depletedUntil: 0, expiresAt: 500 }
  // ground: with and without qty
  s.ground['g-rich-1'] = { item: 'bones', qty: 2, x: 20, y: 21, expiresAt: 700 }
  s.ground['g-rich-2'] = { item: 'ore', x: 20, y: 22, expiresAt: 700 }
  // markers: both kinds
  s.markers = [
    { x: 30, y: 30, kind: 'ord', bornAt: 10 },
    { x: 31, y: 30, kind: 'ws', ws: wsId, bornAt: 12 },
  ]
  s.announce = [{ tick: 40, text: 'rich fixture cries out' }]
  s.firsts = { surveyor: pids[0], 'master:mining': pids[1] }
  s.tick = 45
  s.beacon = 'e'.repeat(64)
  const err = E.validateState(s)
  assert.equal(err, null, 'rich fixture must be constitutionally valid: ' + err)
  return s
}

function freshState() {
  const g = E.makeGenesis('phase2-fresh', 'b'.repeat(64), 0, 64, 48)
  return buildWorld(g) // no beacon, no announce, no firsts: absence must survive cloning
}

function deepFreeze(o) {
  if (o === null || typeof o !== 'object') return o
  for (const k of Object.keys(o)) deepFreeze(o[k])
  return Object.freeze(o)
}

const seededInt = (() => {
  let x = 0x9e3779b9 >>> 0
  return (n) => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x % n }
})()

// small deterministic signed histories via the Phase 2A library
function scenario(workload, pop = 40) {
  const sc = buildScenario2(E, buildWorld, { profile: 'current', pop, workload })
  const history = []
  for (let t = 0; t < 12; t++) history.push(inputsForTick(E, sc, sc.state.tick + t))
  return { sc, history }
}

function replayHashes(engine, state0, history, setup) {
  if (setup) setup()
  try {
    let s = JSON.parse(JSON.stringify(state0))
    const hashes = []
    for (const inputs of history) { s = engine.nextState(s, inputs); hashes.push(engine.stateHash(s)) }
    return { hashes, final: s }
  } finally { T2.setClone(null); T2.setIndexes(null) }
}

// ---------- Phase 2B: clone correctness ----------

test('clone equivalence: json / structuredClone / cloneStateForTick are canonically byte-identical', () => {
  for (const state of [freshState(), richState()]) {
    const ref = canon(state)
    const viaJson = JSON.parse(JSON.stringify(state))
    const viaStructured = structuredClone(state)
    const viaFast = T2.cloneStateForTick(state)
    assert.equal(canon(viaJson), ref)
    assert.equal(canon(viaStructured), ref)
    assert.equal(canon(viaFast), ref)
    assert.equal(E.stateHash(viaFast), E.stateHash(viaJson))
  }
})

test('clone preserves absence: absent optional fields stay absent; no undefined, no holes', () => {
  const fresh = freshState()
  assert.ok(!('beacon' in fresh) && !('announce' in fresh) && !('firsts' in fresh))
  const c = T2.cloneStateForTick(fresh)
  assert.ok(!('beacon' in c) && !('announce' in c) && !('firsts' in c))
  const rich = richState()
  const cr = T2.cloneStateForTick(rich)
  assert.ok(!('qty' in cr.ground['g-rich-2']), 'absent qty must remain absent')
  const walk = (v) => {
    if (v === null || typeof v !== 'object') { assert.notEqual(v, undefined); return }
    if (Array.isArray(v)) {
      for (let i = 0; i < v.length; i++) { assert.ok(i in v, 'array hole introduced'); walk(v[i]) }
      return
    }
    assert.equal(Object.getPrototypeOf(v), Object.prototype)
    for (const k of Object.keys(v)) { assert.notEqual(v[k], undefined, 'undefined introduced at ' + k); walk(v[k]) }
  }
  walk(cr)
})

test('clone independence: deep mutations of the clone never reach the source', () => {
  const src = richState()
  const before = canon(src)
  const c = T2.cloneStateForTick(src)
  const pid = Object.keys(c.players)[0]
  const p = c.players[pid]
  p.skills.mining += 999
  p.inventory[0].qty = 4444
  p.inventory[2] = { item: 'ore', qty: 1 }
  p.equipment.weapon.item = 'star-sword'
  p.action.nodeId = 'nope'
  p.trade.wantGold = 77
  p.attuned.push('phantom')
  p.bank.ore = 999
  p.x = 1; p.hp = 1
  const nid = Object.keys(c.nodes)[0]
  c.nodes[nid].x = 63
  c.nodes['bp-rich'].readyAt = 1
  delete c.nodes['f-rich']
  c.nodes['new-node'] = { type: 'tree', x: 5, y: 5, depletedUntil: 0 }
  Object.values(c.ground)[0].qty = 999
  c.ground['g-new'] = { item: 'logs', x: 9, y: 9, expiresAt: 1 }
  c.mobs[Object.keys(c.mobs)[0]].hp = -5
  c.markers[0].x = 2; c.markers[1].ws = 'gone'
  c.announce[0].text = 'tampered'
  c.announce.push({ tick: 1, text: 'extra' })
  c.names['rich-one'] = 'z'.repeat(64)
  c.firsts.surveyor = 'z'.repeat(64)
  c.beacon = 'f'.repeat(64)
  c.tick = 9999
  assert.equal(canon(src), before, 'source state was mutated through the clone')
})

test('nextState never mutates its input state (deep-frozen input, every clone mode)', () => {
  const { sc, history } = scenario('ordinary', 30)
  const base = JSON.parse(JSON.stringify(sc.state))
  for (const mode of ['fast', 'structured', 'json']) {
    const frozen = deepFreeze(JSON.parse(JSON.stringify(base)))
    const { hashes } = replayHashes(E, base, history.slice(0, 4), () => T2.setClone(mode))
    T2.setClone(mode)
    try {
      let s = frozen
      const got = []
      for (const inputs of history.slice(0, 4)) { s = E.nextState(s, inputs); got.push(E.stateHash(s)) }
      assert.deepEqual(got, hashes, 'frozen-input replay diverged under clone mode ' + mode)
    } finally { T2.setClone(null) }
  }
})

test('shared genesis is safe: a deep-frozen genesis survives a varied campaign untouched', () => {
  const { sc, history } = scenario('ordinary', 40)
  const plain = replayHashes(E, sc.state, history)
  const frozenStart = JSON.parse(JSON.stringify(sc.state))
  deepFreeze(frozenStart.genesis)
  T2.setClone('fast')
  try {
    let s = frozenStart
    const got = []
    for (const inputs of history) { s = E.nextState(s, inputs); got.push(E.stateHash(s)) }
    assert.deepEqual(got, plain.hashes)
    assert.equal(s.genesis, frozenStart.genesis, 'fast clone shares the founding record')
  } finally { T2.setClone(null) }
})

test('all clone modes produce identical transitions on every tick', () => {
  for (const workload of ['ordinary', 'adversarial']) {
    const { sc, history } = scenario(workload, 40)
    const j = replayHashes(E, sc.state, history, () => T2.setClone('json'))
    const st = replayHashes(E, sc.state, history, () => T2.setClone('structured'))
    const f = replayHashes(E, sc.state, history, () => T2.setClone('fast'))
    assert.deepEqual(f.hashes, j.hashes, workload + ': fast clone diverged from JSON reference')
    assert.deepEqual(st.hashes, j.hashes, workload + ': structuredClone diverged from JSON reference')
  }
})

// ---------- Phase 2C/2D: index correctness and ordering ----------

test('index differential: thousands of random queries match the reference scans', () => {
  const s = richState()
  const ctx = T2.buildTickContext(s)
  const g = s.genesis
  const pids = Object.keys(s.players)
  for (let i = 0; i < 4000; i++) {
    const x = seededInt(g.worldW), y = seededInt(g.worldH)
    const p = { x, y }
    assert.equal(T2.nodeExistsAt(s, ctx, x, y), T2.nodeExistsAt(s, null, x, y))
    assert.equal(T2.blockingNodeAt(s, ctx, x, y), T2.blockingNodeAt(s, null, x, y))
    const type = ['bank', 'store', 'anvil', 'house', 'plot', 'waystone', 'tree', 'brewpot'][seededInt(8)]
    assert.equal(T2.hasAdjacentNode(s, ctx, p, type), T2.hasAdjacentNode(s, null, p, type))
    assert.equal(
      T2.findAdjacentNode(s, ctx, p, type),
      T2.findAdjacentNode(s, null, p, type),
      `findAdjacentNode(${x},${y},${type}) selected a different object`)
    assert.deepEqual(T2.adjacentNodeIdsInOrder(s, ctx, p, 'waystone'), T2.adjacentNodeIdsInOrder(s, null, p, 'waystone'))
  }
  assert.deepEqual(T2.waystoneIdsSorted(s, ctx), T2.waystoneIdsSorted(s, null))
  for (const pid of pids) assert.equal(T2.brewpotsOwnedBy(s, ctx, pid), T2.brewpotsOwnedBy(s, null, pid))
  assert.equal(T2.hasAdjacentNode(s, ctx, { x: 40, y: 41 }, new Set(['campfire', 'fire'])),
               T2.hasAdjacentNode(s, null, { x: 40, y: 41 }, new Set(['campfire', 'fire'])))
})

test('ordering (2D): with multiple matching adjacent nodes, the indexed path selects the SAME one', () => {
  const g = E.makeGenesis('phase2-order', 'b'.repeat(64), 0, 64, 48)
  const s = buildWorld(g)
  // two unplanted plots and two waystones around one player, inserted in an
  // order chosen to differ from tile order
  E.addNode(s, 'zz-plot-late', 'plot', 21, 20)  // east
  E.addNode(s, 'aa-plot-early', 'plot', 19, 20) // west — inserted AFTER the east one
  E.addNode(s, 'ws-late', 'waystone', 20, 19)
  E.addNode(s, 'ws-early', 'waystone', 20, 21)
  const p = { x: 20, y: 20 }
  const ctx = T2.buildTickContext(s)
  const ref = T2.findAdjacentNode(s, null, p, 'plot', n => !n.plantedAt)
  const idx = T2.findAdjacentNode(s, ctx, p, 'plot', n => !n.plantedAt)
  assert.equal(idx, ref)
  assert.equal(ref, s.nodes['zz-plot-late'], 'reference is enumeration order, not tile order')
  assert.deepEqual(
    T2.adjacentNodeIdsInOrder(s, ctx, p, 'waystone'),
    T2.adjacentNodeIdsInOrder(s, null, p, 'waystone'))
  // and after the first is planted, both paths move to the second
  s.nodes['zz-plot-late'].plantedAt = 5
  const ctx2 = T2.buildTickContext(s)
  assert.equal(T2.findAdjacentNode(s, ctx2, p, 'plot', n => !n.plantedAt),
               T2.findAdjacentNode(s, null, p, 'plot', n => !n.plantedAt))
})

test('index maintenance: add/delete helpers keep the context equal to a fresh rebuild', () => {
  const s = richState()
  const ctx = T2.buildTickContext(s)
  const pid = Object.keys(s.players)[0]
  T2.addIndexedNode(s, ctx, 'm-fire-1', { type: 'fire', x: 10, y: 10, depletedUntil: 0, expiresAt: 99 })
  T2.addIndexedNode(s, ctx, 'm-bp-1', { type: 'brewpot', x: 11, y: 10, by: pid, lastUsed: 1 })
  T2.addIndexedNode(s, ctx, 'm-bp-2', { type: 'brewpot', x: 12, y: 10, by: pid, lastUsed: 1 })
  T2.deleteIndexedNode(s, ctx, 'm-bp-1')
  T2.deleteIndexedNode(s, ctx, 'bp-rich')
  T2.deleteIndexedNode(s, ctx, 'f-rich')
  T2.deleteIndexedNode(s, ctx, 'absent-node') // no-op
  const fresh = T2.buildTickContext(s)
  for (const [k, arr] of fresh.byTile) assert.deepEqual(ctx.byTile.get(k), arr, 'byTile diverged at ' + k)
  for (const k of ctx.byTile.keys()) assert.ok(fresh.byTile.has(k), 'stale byTile entry ' + k)
  for (const [k, arr] of fresh.byType) assert.deepEqual(ctx.byType.get(k), arr, 'byType diverged at ' + k)
  for (const k of ctx.byType.keys()) assert.ok(fresh.byType.has(k), 'stale byType entry ' + k)
  assert.deepEqual([...ctx.brewBy.entries()].sort(), [...fresh.brewBy.entries()].sort())
  // relative seq order must match enumeration order even though absolute
  // numbers differ after deletions
  const ids = Object.keys(s.nodes)
  const bySeq = [...ctx.seq.entries()].sort((a, b) => a[1] - b[1]).map(e => e[0])
  assert.deepEqual(bySeq, ids, 'seq order diverged from enumeration order')
})

test('indexed and unindexed transitions hash identically on every tick (all workloads)', () => {
  for (const workload of ['ordinary', 'active', 'adversarial']) {
    const { sc, history } = scenario(workload, 40)
    const off = replayHashes(E, sc.state, history, () => T2.setIndexes(false))
    const on = replayHashes(E, sc.state, history, () => T2.setIndexes(true))
    assert.deepEqual(on.hashes, off.hashes, workload + ': indexed run diverged from scan reference')
  }
})

test('brewpot decay and fire expiry through the centralized helpers, indexes on and off', () => {
  const s = richState()
  s.nodes['bp-rich'].lastUsed = -1e9  // long past the decay window
  s.nodes['f-rich'].expiresAt = s.tick + 1
  const inputs = []
  const runs = {}
  for (const on of [true, false]) {
    T2.setIndexes(on)
    try { runs[on] = E.nextState(JSON.parse(JSON.stringify(s)), inputs) } finally { T2.setIndexes(null) }
    assert.ok(!('bp-rich' in runs[on].nodes), 'decayed brewpot survived (indexes ' + on + ')')
    assert.ok(!('f-rich' in runs[on].nodes), 'expired fire survived (indexes ' + on + ')')
  }
  assert.equal(E.stateHash(runs[true]), E.stateHash(runs[false]))
})

// ---------- Phase 2E: cross-binary equivalence (in-suite smoke; the full
// campaign lives in bench/compare-phase2.mjs) ----------

// The frozen Phase 1 binary implements spec 0.52. This equivalence claim is
// about the Phase 2 *optimizations* being behaviour-neutral, and it is only
// meaningful while the live engine implements the same ruleset. Once the
// constitution deliberately moves on, a divergence here is the rules changing,
// not the optimization breaking — so the claim is pinned to the ruleset it was
// made about rather than quietly re-based against a moving reference.
const P1_SPEC = '0.52'
const p1Comparable = E.SPEC_VERSION === P1_SPEC
test('Phase 1 binary and Phase 2 binary agree tick-for-tick on a mixed workload',
     { skip: p1Comparable ? false : `frozen Phase 1 binary implements spec ${P1_SPEC}; live engine is ${E.SPEC_VERSION} (equivalence proven at ${P1_SPEC}, see bench/PHASE2-REPORT.md)` },
     () => {
  const { sc, history } = scenario('ordinary', 30)
  let sOld = JSON.parse(JSON.stringify(sc.state))
  let sNew = JSON.parse(JSON.stringify(sc.state))
  assert.equal(P1.stateHash(sOld), E.stateHash(sNew))
  for (const inputs of history) {
    for (const inp of inputs) assert.equal(P1.verifyInputSig(inp), E.verifyInputSig(inp))
    sOld = P1.nextState(sOld, inputs)
    sNew = E.nextState(sNew, inputs)
    assert.equal(E.stateHash(sNew), P1.stateHash(sOld), 'tick ' + sNew.tick + ' diverged from Phase 1')
  }
  assert.equal(E.validateState(sNew), null)
})
