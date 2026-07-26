// FOUND MANY WORLDS, NOT ONE.
//
// Everything else in this repo validates a single seed, and a single seed
// proves a single world. The generator is seed-parameterised: every fixed
// offset, every canvas fraction, every "+4 to clear the river" is a bet that
// the terrain looks the same next time. It does not. This founds a whole
// spread of worlds and reports the first thing that breaks in each.
//
//   node check-seeds.mjs [count] [W] [H]
import E from './engine.js'
import * as X from './worldgen-expanse4.mjs'

const N = +(process.argv[2] ?? 24)
const W = +(process.argv[3] ?? 896), H = +(process.argv[4] ?? 512)
const RULES = 'f1b7060d09685d91'.padEnd(64, '0')
const SEEDS = ['solo-world', 'tallyholm', 'solo-tallyholm-veterans', 'interval', 'a', 'zz',
  ...Array.from({ length: Math.max(0, N - 6) }, (_, i) => 'seed-' + i)]

let bad = 0
for (const seed of SEEDS.slice(0, N)) {
  const t0 = Date.now()
  let line = '  ' + seed.padEnd(26)
  try {
    const g = X.makeExpanse4Genesis(seed, RULES, 0, W, H)
    const w = X.buildWorld(g)
    // every settlement reachable from spawn, walking the engine's own rule
    const WALKABLE_BUILT = new Set(['brewpot', 'watchfire', 'fire'])
    const solid = new Set()
    for (const n of Object.values(w.nodes)) if (!WALKABLE_BUILT.has(n.type)) solid.add(n.x + ',' + n.y)
    const sp = X.spawnDry(g)
    const seen = new Set([sp.x + ',' + sp.y]); const q = [[sp.x, sp.y]]; let h = 0
    while (h < q.length) {
      const [x, y] = q[h++]
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
        const nx = x + dx, ny = y + dy, k = nx + ',' + ny
        if (seen.has(k) || nx < 1 || ny < 1 || nx >= g.worldW - 1 || ny >= g.worldH - 1) continue
        if (X.blockedAt(g, nx, ny) || solid.has(k)) continue
        seen.add(k); q.push([nx, ny])
      }
    }
    const near = (n) => [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => seen.has((n.x+dx)+','+(n.y+dy)))
    const ESS = new Set(['bank','store','anvil','smith','well','waystone','keeper'])
    const stranded = Object.values(w.nodes).filter(n => ESS.has(n.type) && !near(n))
    const unreachedTowns = X.settlementsOf(g).filter(s => {
      for (let r = 0; r < 24; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++)
        if (seen.has((s.x+dx)+','+(s.y+dy))) return false
      return true
    })
    const banks = Object.values(w.nodes).filter(n => n.type === 'bank').length
    const probs = []
    if (stranded.length) probs.push(stranded.length + ' stranded')
    if (unreachedTowns.length) probs.push('unreachable: ' + unreachedTowns.map(s => s.tag).join('/'))
    if (banks < 10) probs.push('only ' + banks + ' banks')
    line += (probs.length ? 'FAIL  ' + probs.join('; ') : 'ok   ' + Object.keys(w.nodes).length + ' nodes')
    if (probs.length) bad++
  } catch (e) {
    bad++
    line += 'THREW  ' + e.message.slice(0, 110)
  }
  console.log(line + '   (' + ((Date.now() - t0) / 1000).toFixed(1) + 's)')
}
console.log('\n' + (bad ? bad + ' of ' + Math.min(N, SEEDS.length) + ' seeds FAILED' : 'all ' + Math.min(N, SEEDS.length) + ' seeds founded cleanly'))
process.exit(bad ? 1 : 0)
