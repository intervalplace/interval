// bench-lib.mjs — deterministic scenario construction for the Phase 1
// engine-scaling harness (perf brief 1A). Everything here is derived from
// fixed seeds: the same population always yields the same world, the same
// keys, the same input stream, and therefore the same final state hash.
//
// NON-CONSENSUS. Nothing in this file runs inside a witness. It exists so
// that two engine builds can be fed byte-identical histories and compared.
import crypto from 'node:crypto'

const PKCS8_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex')

// Deterministic ed25519 identities. Ed25519 signing is deterministic
// (RFC 8032), and Node's native signer produces byte-identical signatures
// to @noble for the same seed+message (asserted in test/perf.test.mjs), so
// the harness may sign natively for speed without changing the history.
export function benchIdentity(i) {
  const seed = crypto.createHash('sha256').update('interval-bench-citizen:' + i).digest()
  const priv = crypto.createPrivateKey({ key: Buffer.concat([PKCS8_PREFIX, seed]), format: 'der', type: 'pkcs8' })
  const spki = crypto.createPublicKey(priv).export({ format: 'der', type: 'spki' })
  const playerId = spki.subarray(spki.length - 32).toString('hex')
  return { playerId, priv }
}

// Deterministic free-tile placement: stride-walk the interior, skipping
// node tiles, until N standing spots are found.
export function placements(state, n) {
  const g = state.genesis
  const blocked = new Set(Object.values(state.nodes).map(nd => nd.x + ',' + nd.y))
  const out = []
  outer:
  for (let y = 10; y < g.worldH - 10; y += 3) {
    for (let x = 10; x < g.worldW - 10; x += 3) {
      if (blocked.has(x + ',' + y)) continue
      out.push({ x, y })
      if (out.length === n) break outer
    }
  }
  if (out.length < n) throw new Error(`world too small for ${n} bench citizens`)
  return out
}

// Build the deterministic population on top of a freshly generated world.
// Mutates `state` (pre-history setup, before any hashing).
export function populate(E, state, n) {
  const ids = []
  const spots = placements(state, n)
  for (let i = 0; i < n; i++) {
    const id = benchIdentity(i)
    E.addPlayer(state, id.playerId, spots[i].x, spots[i].y)
    ids.push(id)
  }
  return ids
}

// The deterministic input stream for one tick. Mix, per the brief:
//  - most citizens move (valid input, alternating direction);
//  - every 11th citizen is idle (exercises sleep/wake bookkeeping);
//  - every 37th citizen sends a corrupted signature on a 7-tick cycle
//    (invalid: exercises rejection + negative caching);
//  - every 53rd citizen re-sends its previous signed input on a 5-tick
//    cycle (stale tick: invalid at validInput, and byte-identical to a
//    previously seen message — exercises positive dedup paths).
export function inputsForTick(E, ids, worldId, tick, prevByPlayer) {
  const out = []
  for (let i = 0; i < ids.length; i++) {
    if (i % 11 === 0) continue // idle citizen
    const id = ids[i]
    if (i % 53 === 7 && tick % 5 === 4 && prevByPlayer.has(id.playerId)) {
      out.push(prevByPlayer.get(id.playerId)) // exact duplicate of an old input
      continue
    }
    const dx = (tick + i) % 2 === 0 ? 1 : -1
    const unsigned = { type: 'move', dx, dy: 0, tick, worldId, playerId: id.playerId }
    const payload = Buffer.from('INTERVAL_INPUT_V1|' + E.canonical(unsigned))
    let sig = crypto.sign(null, payload, id.priv).toString('hex')
    if (i % 37 === 3 && tick % 7 === 3) sig = '00' + sig.slice(2) // corrupt deterministically
    const input = { ...unsigned, sig }
    if (!(i % 37 === 3 && tick % 7 === 3)) prevByPlayer.set(id.playerId, input)
    out.push(input)
  }
  return out
}

export function buildScenario(E, buildWorld, n) {
  const genesis = E.makeGenesis('interval-bench-world-1', 'b'.repeat(64))
  const state = buildWorld(genesis)
  const ids = populate(E, state, n)
  const wid = E.worldId(genesis)
  return { genesis, state, ids, worldId: wid }
}

export function stats(arr) {
  const s = [...arr].sort((a, b) => a - b)
  const pick = (q) => s[Math.min(s.length - 1, Math.floor(q * s.length))]
  return { median: pick(0.5), p95: pick(0.95), max: s[s.length - 1] }
}

export const ms = (ns) => Number(ns) / 1e6
export const fmt = (x) => x.toFixed(1).padStart(8)
