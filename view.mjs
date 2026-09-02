// view.mjs — zone-sharded state deltas for thin windows.
//
// THE PROBLEM. serve.mjs sends the whole state to every socket every interval.
// The payload is ~838 KB empty and grows with population (~497 B per citizen),
// so at 20,000 present it is 10.3 MB per client per second. Compression alone
// does not save this: the payload scales with the very thing being scaled.
//
// THE SHAPE OF THE FIX. Two independent observations:
//
//   1. Almost nothing changes between intervals. Nodes are 92% of the payload
//      and their type/x/y are immutable — only `depletedUntil` moves, on at
//      most a few dozen of the 144 gatherables. A delta is 5-40x smaller.
//
//   2. A window only renders what is near its citizen. It does not need the
//      4,479 citizens who moved on the far side of the island.
//
// Doing (1) alone still costs the pillar O(clients x delta). Doing (2) naively
// costs O(clients x view) of SERIALIZATION, which is worse. So we do both, and
// we shard by ZONE: the world is cut into fixed tiles, one delta message is
// built per zone per interval, and every client is sent the 9 zone messages
// covering its view. Serialization is O(zones) — a constant, 112 for Tallyholm
// — and per-socket cost falls to a memcpy of an already-built buffer.
//
// Zones are FIXED and world-anchored, never per-player, which is what keeps
// the message count constant as population grows.

export const ZONED = ['players', 'mobs', 'ground']  // nodes are world-scope
export const ZONE = 32                     // tiles per zone edge; 3x3 = 96x96,
                                           // comfortably wider than the widest
                                           // window viewport (VIEW_W 14/ZOOM)
export const VIEW_ZONES = 1                // rings of neighbouring zones to send

export function zoneOf(x, y, zone = ZONE) {
  return ((y / zone) | 0) * 100000 + ((x / zone) | 0)
}
export function zonesAround(x, y, zone = ZONE, rings = VIEW_ZONES) {
  const zx = (x / zone) | 0, zy = (y / zone) | 0, out = []
  for (let dy = -rings; dy <= rings; dy++)
    for (let dx = -rings; dx <= rings; dx++) {
      const nx = zx + dx, ny = zy + dy
      if (nx < 0 || ny < 0) continue
      out.push(ny * 100000 + nx)
    }
  return out
}

// DIFFING AGAINST THE PREVIOUS STATE DOES NOT WORK, and it fails silently.
// nextState is copy-on-write: entities it did not touch are carried through BY
// REFERENCE, so `prev.players[pid] === next.players[pid]` is routinely true --
// and for entities it DID touch, prev and next can still alias. A reference or
// field compare against `prev` therefore reports "unchanged" for things that
// changed, the delta omits them, and the window silently freezes that citizen
// mid-stride while the world walks on without them. It is invisible in testing
// unless you compare a held client world against truth, entity by entity.
//
// So we do not diff against prev at all. We keep a FINGERPRINT of what was
// last sent for each entity and compare against that. The serialization is not
// waste: the string we compare is the string we ship.
export function makeTracker() { return { seen: new Map() } }

// FIELD-LEVEL, not entity-level. A citizen is ~500 bytes -- skills, equipment,
// a twelve-slot inventory, vaults, trade -- and almost every interval the only
// thing that moved is x, y and action, a few dozen bytes. Shipping the whole
// object on every step was 129 KB per client per interval at 20,000 present.
//
// A field is fingerprinted by its value when scalar and by its JSON when not,
// because the previous state cannot be trusted as a reference (see above).
// Nested objects are shipped whole when they change, which is right: skills
// and inventories change rarely and wholesale.
function fieldPrint(v) {
  return (v !== null && typeof v === 'object') ? JSON.stringify(v) : v
}

// Build one delta per zone. Returns Map<zoneKey, object>.
// An entity that MOVED between zones appears as `changed` in its new zone and
// in `gone` for its old one, so a client watching either sees the truth.
export function zoneDeltas(tracker, next, opts = {}) {
  const zone = opts.zone ?? ZONE
  const seen = tracker.seen
  const out = new Map()
  const alive = new Set()
  const bucket = (z) => {
    let b = out.get(z)
    if (!b) { b = { tick: next.tick }; out.set(z, b) }
    return b
  }
  for (const key of ZONED) {
    const nx = next[key]; if (!nx) continue
    for (const id in nx) {
      const b = nx[id]
      const k = key + ':' + id
      alive.add(k)
      const was = seen.get(k)
      const zNew = zoneOf(b.x, b.y, zone)

      if (was === undefined) {                    // never sent: it goes whole
        const f = new Map()
        for (const fld in b) f.set(fld, fieldPrint(b[fld]))
        seen.set(k, { f, z: zNew })
        const nb = bucket(zNew); (nb[key] ??= {})[id] = b
        continue
      }

      // which fields actually moved
      let patch = null
      for (const fld in b) {
        const p = fieldPrint(b[fld])
        if (was.f.get(fld) === p) continue
        was.f.set(fld, p)
        ;(patch ??= {})[fld] = b[fld]
      }
      for (const fld of was.f.keys()) {
        if (fld in b) continue
        was.f.delete(fld)
        ;(patch ??= {}).__gone = [...((patch.__gone) || []), fld]
      }

      if (was.z !== zNew) {
        // crossing a boundary: gone from the old zone, WHOLE into the new one,
        // because a client entering this zone has never held this entity
        const ob = bucket(was.z); (ob[key + 'Gone'] ??= []).push(id)
        was.z = zNew
        const nb = bucket(zNew); (nb[key] ??= {})[id] = b
        continue
      }
      if (!patch) continue
      const nb = bucket(zNew); (nb[key] ??= {})[id] = patch
    }
  }
  for (const [k, was] of seen) {
    if (alive.has(k)) continue
    const i = k.indexOf(':')
    const ob = bucket(was.z); (ob[k.slice(0, i) + 'Gone'] ??= []).push(k.slice(i + 1))
    seen.delete(k)
  }
  return out
}

// THE MOVING-VIEW GAP. Deltas only ever carry what CHANGED. A citizen who
// walks brings new zones into view, and anything sitting still in those zones
// was never sent -- so the window shows an empty field where a stationary
// crowd is standing. Whenever a client ENTERS a zone it must be given that
// zone whole, once; retained zones then continue on deltas.
//
// Built lazily and cached per interval: only zones somebody actually entered
// are ever serialized, which is a handful, not all 160.
export function zoneFull(state, z, zone = ZONE) {
  const out = { tick: state.tick }
  for (const key of ZONED) {
    const m = state[key]; if (!m) continue
    for (const id in m) {
      const e = m[id]
      if (zoneOf(e.x, e.y, zone) !== z) continue
      ;(out[key] ??= {})[id] = e
    }
  }
  return out
}

// World-scope fields that are not entity maps (tick, weather, events…).
// Small, and every client needs them, so they ride in their own message.
export function worldDelta(tracker, next) {
  const d = { type: 'world', tick: next.tick }
  tracker.nodes ??= new Map(); tracker.world ??= new Map()
  // NODES ARE NOT ZONED. The chart and map windows draw the whole island, so a
  // window that only ever heard about nodes near its citizen would render an
  // island with holes in it. Nodes are also the cheapest thing to send whole:
  // type/x/y are immutable, only `depletedUntil` moves, and it moves on at most
  // a few dozen of the 144 gatherables per interval. So they ride world-scope,
  // full fidelity, for a fraction of a kilobyte.
  if (next.nodes) {
    const changed = {}, gone = [], alive = new Set()
    for (const id in next.nodes) {
      alive.add(id)
      const j = JSON.stringify(next.nodes[id])
      if (tracker.nodes.get(id) === j) continue
      tracker.nodes.set(id, j); changed[id] = next.nodes[id]
    }
    for (const id of tracker.nodes.keys()) if (!alive.has(id)) { gone.push(id); tracker.nodes.delete(id) }
    if (Object.keys(changed).length) d.nodes = changed
    if (gone.length) d.nodesGone = gone
  }
  for (const k of Object.keys(next)) {
    if (['players', 'mobs', 'nodes', 'ground', 'genesis'].includes(k)) continue
    const b = JSON.stringify(next[k])
    if (tracker.world.get(k) === b) continue
    tracker.world.set(k, b); d[k] = next[k]
  }
  return d
}

// ---- client side: apply one interval's messages onto a locally held world ----
//
// ORDER MATTERS, and getting it wrong is silent. An entity that crosses a zone
// boundary is `changed` in its new zone and listed in `...Gone` for its old
// one. A client watching BOTH zones (the common case — they are neighbours)
// that applied messages in arrival order would add the entity from the new
// zone and then delete it from the old one, and the citizen would vanish from
// the window while still standing there in the world.
//
// So removals for the whole interval are applied FIRST, then upserts. Takes
// the full set of messages for one tick, never a single message.
export function applyTick(state, deltas) {
  for (const d of deltas)
    for (const key of ['players', 'mobs', 'nodes', 'ground']) {  // nodes only ever arrive world-scope
      const gone = d[key + 'Gone']
      if (gone && state[key]) for (const id of gone) delete state[key][id]
    }
  for (const d of deltas)
    for (const key of ['players', 'mobs', 'nodes', 'ground']) {
      if (!d[key]) continue
      state[key] ??= {}
      for (const id in d[key]) {
        const patch = d[key][id], held = state[key][id]
        if (!held) { state[key][id] = patch; continue }   // whole entity
        for (const f in patch) { if (f !== '__gone') held[f] = patch[f] }
        if (patch.__gone) for (const f of patch.__gone) delete held[f]
      }
    }
  for (const d of deltas)
    for (const k of Object.keys(d)) {
      if (k === 'type' || k.endsWith('Gone') || ['players', 'mobs', 'nodes', 'ground'].includes(k)) continue
      state[k] = d[k]
    }
  return state
}

// A citizen who walks far enough leaves zones behind without any message
// telling the client so. Sweep anything outside the watched set.
export function evictOutside(state, watched, zone = ZONE) {
  for (const key of ZONED) {   // never nodes: the map needs the whole island
    const m = state[key]; if (!m) continue
    for (const id in m) {
      const e = m[id]
      if (!watched.has(((e.y / zone) | 0) * 100000 + ((e.x / zone) | 0))) delete m[id]
    }
  }
  return state
}
