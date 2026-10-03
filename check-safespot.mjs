#!/usr/bin/env node
// CAN AN ARCHER STAND WHERE A BEAST CANNOT ANSWER, AND HOW OFTEN?
//
// A beast closes on a citizen by greedy step and abandons a step that is
// terrainBlocked. There is no pathfinding, so a citizen across a beck or behind
// a node can be unreachable, and a bow reaches up to nine tiles. Safe-spotting
// is therefore not a feature anybody added: it falls out of the movement rule.
//
// The question is not whether it exists but how much of the world it covers,
// and §7dm is the reason to ask rather than to legislate: "There is no table of
// blessed challenges and there must not be ... a challenge the world has
// already named and rewarded is not self-imposed any more, it is a quest."
// Something a player works out is worth keeping. Something that trivialises a
// creature designed around a risk is worth knowing about.
//
//   node check-safespot.mjs [reach]     default 5, the horn-bow
//
// Reachability is a flood fill from the beast's seat over passable ground,
// bounded by the engine's own leash (aggro + 6). A tile is SAFE if nothing the
// beast can reach is adjacent to it.
import { createRequire } from 'module'
import fs from 'fs'
const require = createRequire(import.meta.url)
const E = require('./engine.js')
E.declareEngine(fs.readFileSync(new URL('./engine.js', import.meta.url), 'utf8'))
const WG = await import('./worldgen-any.mjs')

const g = WG.foundGenesis('interval-expanse-v7', 'solo-538',
  '6cde7f4e2631a1af4ff405cb51d1bf78f66ba3ec83531d18adee6599d8ca1cdd', 1789813895202, 896, 512)
const s = WG.buildWorld(g)
const blocked = (x, y) => E.terrainBlocked(g, x, y)
const nodeAt = new Set()
for (const n of Object.values(s.nodes ?? {})) nodeAt.add(n.x + ',' + n.y)

const REACH = Number(process.argv[2] ?? 5)      // horn-bow
const STATS = E.MOB_STATS ?? {}
const mobs = Object.values(s.mobs ?? {})
const byType = {}
for (const m of mobs) (byType[m.type] ??= []).push(m)

const rows = []
for (const [type, list] of Object.entries(byType)) {
  const st = STATS[type] ?? {}
  if (st.harmless || st.dummy || st.rooted || !st.aggro) continue   // only things that fight back
  const leash = (st.aggro ?? 4) + 6
  let safe = 0
  for (const m of list) {
    // where can this beast get to?
    const reach = new Set([m.x + ',' + m.y])
    const q = [[m.x, m.y]]
    while (q.length) {
      const [cx, cy] = q.pop()
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = cx + dx, ny = cy + dy, k = nx + ',' + ny
        if (reach.has(k)) continue
        if (Math.max(Math.abs(nx - m.x), Math.abs(ny - m.y)) > leash) continue
        if (blocked(nx, ny) || nodeAt.has(k)) continue
        reach.add(k); q.push([nx, ny])
      }
    }
    // a tile the citizen can stand on, in range of somewhere the beast stands,
    // that the beast can never get next to
    let found = false
    for (let y = m.y - REACH; y <= m.y + REACH && !found; y++) {
      for (let x = m.x - REACH; x <= m.x + REACH && !found; x++) {
        if (blocked(x, y) || nodeAt.has(x + ',' + y)) continue
        if (Math.max(Math.abs(x - m.x), Math.abs(y - m.y)) > REACH) continue
        let touchable = false
        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[0,0]])
          if (reach.has((x + dx) + ',' + (y + dy))) { touchable = true; break }
        if (!touchable) found = true
      }
    }
    if (found) safe++
  }
  rows.push([type, list.length, safe, st.maxHit ?? 0])
}
rows.sort((a, b) => b[2] / b[1] - a[2] / a[1])
console.log(`reach ${REACH}; "safe" = a tile in range the beast can never reach adjacent to\n`)
console.log('beast'.padEnd(18) + 'seated'.padStart(7) + 'safe-spottable'.padStart(16) + '  share   maxHit')
for (const [t, n, safe, hit] of rows)
  console.log(t.padEnd(18) + String(n).padStart(7) + String(safe).padStart(16)
    + (' ' + (safe / n * 100).toFixed(0) + '%').padStart(8) + String(hit).padStart(9))
const tot = rows.reduce((a, r) => a + r[1], 0), ts = rows.reduce((a, r) => a + r[2], 0)
console.log('\n' + ts + ' of ' + tot + ' aggressive beasts (' + (ts / tot * 100).toFixed(0) + '%) can be shot from somewhere they cannot answer')
