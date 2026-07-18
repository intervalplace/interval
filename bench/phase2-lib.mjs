// phase2-lib.mjs — Phase 2A deterministic scenario construction.
//
// Adds to the Phase 1 harness (bench-lib.mjs):
//   - two world PROFILES: 'current' (the canonical 320x200 classic world)
//     and 'expanded' (a deterministic benchmark fixture approximating the
//     intended enlarged world: 640x400, ~4x the node count, ~4x the mobs,
//     more waystones/houses/plots/fires, standing brewpots, and a spread
//     of ground objects). The expanded fixture is BENCHMARK DATA, not a
//     protocol amendment: it is built with the frozen engine's own
//     addNode/addMob and passes validateState.
//   - three WORKLOADS per population: 'ordinary', 'active', 'adversarial'
//     (adversarial-VALID: correctly signed, correctly shaped, tick-current
//     inputs chosen to maximize spatial/inventory/scan work).
//
// NON-CONSENSUS. Nothing here runs inside a witness. Determinism contract:
// same (profile, population, workload) => same world, same keys, same
// input bytes, same final state hash on any correct engine.
import crypto from 'node:crypto'
import { benchIdentity } from './bench-lib.mjs'

const H = (...parts) => crypto.createHash('sha256').update(parts.join('|')).digest()

// ---------- expanded target world ----------
// Intended-world numbers are not yet fixed by any founding record; the
// fixture uses documented assumptions (see PHASE2-REPORT.md): 4x area,
// ~4x total nodes, ~4x mobs, 18 waystones, brewpots at ~0.15/citizen-cap,
// ground litter, realistic (seeded, spread) distribution.
export const EXPANDED = {
  w: 640, h: 400,
  addTrees: 900, addRocks: 420, addMagic: 40,
  addHouses: 60, addPlots: 60, addCampfires: 30, addBanks: 8, addStores: 8, addAnvils: 8,
  addWaystones: 12,
  addGoblins: 160, addWolves: 60, addBears: 30,
  brewpots: 150,          // standing player-built pots (owners = bench citizens)
  groundItems: 400,       // dropped litter with far-future expiry
}

function freeTileWalk(state, taken, seedTag, ok) {
  // deterministic seeded free-tile picker over the whole interior
  const g = state.genesis
  let i = 0
  return () => {
    for (; i < 1e7;) {
      const h = H(g.genesisSeed, seedTag, i++)
      const x = 1 + (h.readUInt32BE(0) % (g.worldW - 2))
      const y = 1 + (h.readUInt32BE(4) % (g.worldH - 2))
      const k = x + ',' + y
      if (taken.has(k)) continue
      if (ok && !ok(x, y)) continue
      taken.add(k)
      return { x, y }
    }
    throw new Error('freeTileWalk exhausted')
  }
}

export function buildProfileWorld(E, buildWorld, profile, pop = 50) {
  if (profile === 'current') {
    const genesis = E.makeGenesis('interval-bench-world-1', 'b'.repeat(64))
    return { genesis, state: buildWorld(genesis) }
  }
  if (profile !== 'expanded') throw new Error('unknown profile ' + profile)
  const X = EXPANDED
  const genesis = E.makeGenesis('interval-bench-world-2', 'b'.repeat(64), 0, X.w, X.h)
  const w = buildWorld(genesis)
  const taken = new Set(Object.values(w.nodes).map(n => n.x + ',' + n.y))
  for (const m of Object.values(w.mobs)) taken.add(m.x + ',' + m.y)
  const pick = freeTileWalk(w, taken, 'expand')
  const add = (prefix, count, fn) => {
    for (let i = 0; i < count; i++) { const t = pick(); fn('x2-' + prefix + '-' + i, t.x, t.y) }
  }
  add('tree', X.addTrees, (id, x, y) => E.addNode(w, id, 'tree', x, y))
  add('rock', X.addRocks, (id, x, y) => E.addNode(w, id, 'rock', x, y))
  add('magic', X.addMagic, (id, x, y) => E.addNode(w, id, 'magic-rock', x, y))
  add('house', X.addHouses, (id, x, y) => E.addNode(w, id, 'house', x, y))
  add('plot', X.addPlots, (id, x, y) => E.addNode(w, id, 'plot', x, y))
  add('fire', X.addCampfires, (id, x, y) => E.addNode(w, id, 'campfire', x, y))
  add('bank', X.addBanks, (id, x, y) => E.addNode(w, id, 'bank', x, y))
  add('store', X.addStores, (id, x, y) => E.addNode(w, id, 'store', x, y))
  add('anvil', X.addAnvils, (id, x, y) => E.addNode(w, id, 'anvil', x, y))
  add('waystone', X.addWaystones, (id, x, y) => E.addNode(w, id, 'waystone', x, y))
  add('goblin', X.addGoblins, (id, x, y) => E.addMob(w, id, 'goblin', x, y))
  add('wolf', X.addWolves, (id, x, y) => E.addMob(w, id, 'wolf', x, y))
  add('bear', X.addBears, (id, x, y) => E.addMob(w, id, 'bear', x, y))
  for (let i = 0; i < X.brewpots; i++) {
    const t = pick()
    const owner = benchIdentity(i % Math.max(1, Math.min(50, pop))).playerId // concentrated ownership: exercises the pot-cap count
    E.addNode(w, 'x2-brewpot-' + i, 'brewpot', t.x, t.y, { by: owner, lastUsed: 0 })
  }
  const items = ['logs', 'ore', 'bones', 'raw-fish']
  for (let i = 0; i < X.groundItems; i++) {
    const t = pick()
    w.ground['x2-g' + i] = { item: items[i % items.length], qty: 1, x: t.x, y: t.y, expiresAt: 1e9 }
  }
  return { genesis, state: w } // validated in buildScenario2, once owners exist
}

// ---------- role assignment and placement ----------
// Roles that need adjacency draw from pools of free tiles beside real
// objects; everyone else is placed by the same stride walk Phase 1 used.
const ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]]

function adjacencyPool(state, taken, wanted, limitPerNode = 2) {
  const g = state.genesis, out = []
  for (const [nid, n] of Object.entries(state.nodes)) {
    if (!wanted(n)) continue
    let used = 0
    for (const [dx, dy] of ORTH) {
      if (used >= limitPerNode) break
      const x = n.x + dx, y = n.y + dy, k = x + ',' + y
      if (x < 1 || y < 1 || x >= g.worldW - 1 || y >= g.worldH - 1) continue
      if (taken.has(k)) continue
      taken.add(k); out.push({ x, y, nodeId: nid, node: n }); used++
    }
  }
  return out
}

function mobPool(state, taken, limitPerMob = 1) {
  const g = state.genesis, out = []
  for (const [mid, m] of Object.entries(state.mobs)) {
    let used = 0
    for (const [dx, dy] of ORTH) {
      if (used >= limitPerMob) break
      const x = m.x + dx, y = m.y + dy, k = x + ',' + y
      if (x < 1 || y < 1 || x >= g.worldW - 1 || y >= g.worldH - 1) continue
      if (taken.has(k)) continue
      taken.add(k); out.push({ x, y, mobId: mid }); used++
    }
  }
  return out
}

function seedInventory(p, spec) { // pre-history setup, before any hashing
  let i = 0
  for (const [item, qty, stack] of spec) {
    if (stack) { p.inventory[i++] = { item, qty } }
    else for (let q = 0; q < qty && i < p.inventory.length; q++) p.inventory[i++] = { item, qty: 1 }
  }
}

// Every citizen gets: role, position, per-tick input maker.
export function buildPopulation(E, state, n, workload) {
  const g = state.genesis
  const taken = new Set()
  for (const v of Object.values(state.nodes)) taken.add(v.x + ',' + v.y)
  for (const m of Object.values(state.mobs)) taken.add(m.x + ',' + m.y)

  const gatherables = adjacencyPool(state, taken, nd => nd.type === 'tree' || nd.type === 'rock')
  const banks = adjacencyPool(state, taken, nd => nd.type === 'bank', 4)
  const fires = adjacencyPool(state, taken, nd => nd.type === 'campfire', 4)
  const plots = adjacencyPool(state, taken, nd => nd.type === 'plot', 2)
  const mobs = mobPool(state, taken)

  // generic standing spots (stride walk, same spirit as Phase 1)
  const spots = []
  outer:
  for (let y = 10; y < g.worldH - 10; y += 3) {
    for (let x = 10; x < g.worldW - 10; x += 3) {
      const k = x + ',' + y
      if (taken.has(k)) continue
      taken.add(k); spots.push({ x, y })
      if (spots.length >= n * 2) break outer
    }
  }
  let spotI = 0
  const nextSpot = () => { if (spotI >= spots.length) throw new Error('world too small'); return spots[spotI++] }

  const citizens = []
  const roleCounts = {}
  for (let i = 0; i < n; i++) {
    const id = benchIdentity(i)
    let role, place, ref = null
    const want = workload === 'adversarial' ? 'adv'
      : i % 10 === 0 && workload === 'ordinary' ? 'idle'
      : i % 10 === 4 && gatherables.length ? 'gather'
      : i % 10 === 5 && banks.length ? 'bank'
      : i % 10 === 6 && mobs.length ? 'fight'
      : i % 10 === 7 && fires.length ? 'cook'
      : i % 10 === 8 && plots.length ? 'farm'
      : i % 10 === 9 ? 'trade'
      : 'move'
    if (want === 'gather') { ref = gatherables.pop(); role = 'gather'; place = ref }
    else if (want === 'bank') { ref = banks.pop(); role = 'bank'; place = ref }
    else if (want === 'fight') { ref = mobs.pop(); role = 'fight'; place = ref }
    else if (want === 'cook') { ref = fires.pop(); role = 'cook'; place = ref }
    else if (want === 'farm') { ref = plots.pop(); role = 'farm'; place = ref }
    else { role = want; place = nextSpot() }
    E.addPlayer(state, id.playerId, place.x, place.y)
    const p = state.players[id.playerId]
    if (role === 'bank') { seedInventory(p, [['ore', 8, false]]); p.bank = { logs: 30 } }
    if (role === 'cook') seedInventory(p, [['raw-fish', 28, false]])
    if (role === 'farm') seedInventory(p, [['seeds', 500, true]])
    if (role === 'trade') { seedInventory(p, [['ore', 6, false], ['logs', 6, false]]); p.gold = 500 }
    if (role === 'adv') { seedInventory(p, [['seeds', 500, true], ['logs', 10, false], ['ore', 4, false]]); p.gold = 5000 }
    citizens.push({ id, role, ref, x: place.x, y: place.y })
    roleCounts[role] = (roleCounts[role] || 0) + 1
  }
  // trade partners: pair consecutive traders and co-locate them
  const traders = citizens.filter(c => c.role === 'trade')
  for (let t = 0; t + 1 < traders.length; t += 2) {
    const a = traders[t], b = traders[t + 1]
    // move b beside a (b's spot was a stride tile; beside-a tile may collide
    // with another citizen's tile only if adjacent stride tiles were used —
    // stride step is 3, so a.x+1 is never another spot)
    const bx = a.x + 1, by = a.y
    if (bx < g.worldW - 1 && !Object.values(state.nodes).some(nd => nd.x === bx && nd.y === by)) {
      state.players[b.id.playerId].x = bx; state.players[b.id.playerId].y = by
      b.x = bx; b.y = by
    }
    a.partner = b; b.partner = a; a.tradeLead = true
  }
  return { citizens, roleCounts }
}

// ---------- per-tick signed input streams ----------
function sign(E, id, unsigned) {
  const payload = Buffer.from('INTERVAL_INPUT_V1|' + E.canonical(unsigned))
  return { ...unsigned, sig: crypto.sign(null, payload, id.priv).toString('hex') }
}

export function inputsForTick(E, scenario, tick) {
  const { citizens, worldId, workload } = scenario
  const out = []
  for (let i = 0; i < citizens.length; i++) {
    const c = citizens[i]
    const base = { tick, worldId, playerId: c.id.playerId }
    const mk = (extra) => out.push(sign(E, c.id, { ...extra, ...base }))
    switch (c.role) {
      case 'idle': break
      case 'move': mk({ type: 'move', dx: (tick + i) % 2 === 0 ? 1 : -1, dy: 0 }); break
      case 'gather': mk({ type: 'gather', nodeId: c.ref.nodeId }); break
      case 'bank': (tick + i) % 2 === 0 ? mk({ type: 'deposit', slot: 0 }) : mk({ type: 'withdraw', item: 'logs' }); break
      case 'fight': mk({ type: 'attack', mobId: c.ref.mobId }); break
      case 'cook': mk({ type: 'cook', slot: tick % 28 }); break
      case 'farm': mk({ type: 'plant', slot: 0 }); break
      case 'trade':
        if (c.tradeLead && c.partner) {
          (tick + i) % 2 === 0
            ? mk({ type: 'offer_trade', to: c.partner.id.playerId, giveSlot: tick % 6, wantItem: 'logs', wantGold: 0 })
            : mk({ type: 'cancel_trade' })
        } else if (c.partner) {
          mk({ type: 'accept_trade', from: c.partner.id.playerId })
        } else mk({ type: 'move', dx: 1, dy: 0 })
        break
      case 'adv': { // adversarial-valid: signed, shaped, tick-current, scan-maximizing
        const pick = (tick + i) % 6
        if (pick === 0) mk({ type: 'plant', slot: 0 })                       // full plot scan (validInput) each tick
        else if (pick === 1) mk({ type: 'sell', slot: 1 })                  // full store scan
        else if (pick === 2) mk({ type: 'buy', item: 'seeds' })              // full store scan
        else if (pick === 3) mk({ type: 'build_brewpot' })                   // occupied + house scans (+ pot filter)
        else if (pick === 4) mk({ type: 'move', dx: (tick % 2) * 2 - 1, dy: 0 }) // full blocking-node scan
        else mk({ type: 'light', slot: 10 })                                 // fire creation + step-aside scans
        break
      }
      default: throw new Error('role ' + c.role)
    }
  }
  return out
}

export function buildScenario2(E, buildWorld, { profile, pop, workload }) {
  const { genesis, state } = buildProfileWorld(E, buildWorld, profile, pop)
  const { citizens, roleCounts } = buildPopulation(E, state, pop, workload)
  const err = E.validateState(state)
  if (err) throw new Error('scenario fixture invalid: ' + err)
  return { genesis, state, citizens, roleCounts, worldId: E.worldId(genesis), workload, profile, pop }
}
