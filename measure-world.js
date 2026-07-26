// Measure a world's STRUCTURE. Run against any expanse generator:
//   node measure-world.mjs ./worldgen-expanse3.mjs makeExpanse3Genesis
//   node measure-world.mjs ./worldgen-expanse4.mjs makeExpanse4Genesis
// Reports the numbers that decide whether a country is memorable: how the
// settlements are spaced, how the countries are shaped, how big a town is,
// and how far you walk past nothing.
const [, , modPath, factory, seed = 'tallyholm'] = process.argv
const X = await import(modPath)
const RULES = 'f1b7060d09685d91'.padEnd(64, '0')
const g = X[factory](seed, RULES, 0, 896, 512)
const w = X.buildWorld(g)
const W = g.worldW, H = g.worldH
const ss = X.settlementsOf(g)
const TICK = 0.6
const mins = (t) => (t * TICK / 60).toFixed(1) + ' min'

function bfs(sx, sy) {
  const d = new Int32Array(W * H).fill(-1)
  d[sy * W + sx] = 0; const q = [[sx, sy]]; let h = 0
  while (h < q.length) {
    const [x, y] = q[h++]
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
      const nx = x + dx, ny = y + dy
      if (nx < 1 || ny < 1 || nx >= W - 1 || ny >= H - 1) continue
      if (d[ny * W + nx] !== -1 || X.blockedAt(g, nx, ny)) continue
      d[ny * W + nx] = d[y * W + x] + 1; q.push([nx, ny])
    }
  }
  return d
}

console.log('\n=== ' + X.GENERATOR_ID + ' @ ' + W + 'x' + H + ' ===')
console.log('nodes', Object.keys(w.nodes).length, ' mobs', Object.keys(w.mobs || {}).length)

// --- 1. country SHAPE: equal-sized bands are the failure mode ---
const area = {}
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const b = X.biomeAt(g, x, y); area[b] = (area[b] || 0) + 1 }
const land = Object.entries(area).filter(([k]) => k !== 'sea').reduce((a, [, v]) => a + v, 0)
console.log('\n-- countries (land ' + land + ' tiles) --')
const shares = []
for (const [k, v] of Object.entries(area)) {
  if (k === 'sea') continue
  const pct = 100 * v / land; shares.push(pct)
  console.log('  ' + k.padEnd(12) + String(v).padStart(7) + '  ' + pct.toFixed(1) + '%')
}
const mean = shares.reduce((a, b) => a + b, 0) / shares.length
const sd = Math.sqrt(shares.reduce((a, b) => a + (b - mean) * (b - mean), 0) / shares.length)
console.log('  spread of country sizes (sd): ' + sd.toFixed(1) + ' pts  (low = suspiciously even)')

// --- 2. SPACING: a memorable world has a gradient, not a constant ---
const D = {}; for (const s of ss) D[s.tag] = bfs(s.x, s.y)
console.log('\n-- nearest neighbour --')
const nn = []
for (const a of ss) {
  let best = null, bd = Infinity
  for (const b of ss) { if (b.tag === a.tag) continue; const d = D[a.tag][b.y * W + b.x]; if (d > 0 && d < bd) { bd = d; best = b } }
  nn.push(bd)
  console.log('  ' + a.name.padEnd(13) + '-> ' + best.name.padEnd(13) + String(bd).padStart(4) + ' tiles  ' + mins(bd))
}
const nmin = Math.min(...nn), nmax = Math.max(...nn)
console.log('  spacing band: ' + nmin + '-' + nmax + ' tiles   ratio ' + (nmax / nmin).toFixed(1)
  + 'x   (RuneScape\u2019s core-to-frontier ratio is roughly 3-5x)')

// --- 3. TOWN SIZE: can you get lost in it? ---
console.log('\n-- towns --')
for (const st of ss) {
  const r = X.rectOf(st)
  const inside = Object.values(w.nodes).filter(n => n.x >= r.x0 && n.x <= r.x1 && n.y >= r.y0 && n.y <= r.y1)
  console.log('  ' + st.name.padEnd(13) + String(st.w * st.h).padStart(5) + ' tiles  '
    + String(inside.length).padStart(4) + ' nodes  '
    + String(inside.filter(n => n.type !== 'wall').length).padStart(3) + ' non-wall')
}

// --- 4. EMPTINESS: how long do you walk past nothing? ---
const BUILT = new Set(['landmark','waystone','signpost','bank','well','anvil','store','smith','house','campfire','guard','keeper','plot','fence','hedge'])
const marks = Object.values(w.nodes).filter(n => BUILT.has(n.type))
const dm = new Int32Array(W * H).fill(-1); const q2 = []
for (const n of marks) if (dm[n.y * W + n.x] === -1) { dm[n.y * W + n.x] = 0; q2.push([n.x, n.y]) }
let h2 = 0
while (h2 < q2.length) {
  const [x, y] = q2[h2++]
  for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
    const nx = x + dx, ny = y + dy
    if (nx < 1 || ny < 1 || nx >= W - 1 || ny >= H - 1) continue
    if (dm[ny * W + nx] !== -1 || X.inSea(g, nx, ny)) continue
    dm[ny * W + nx] = dm[y * W + x] + 1; q2.push([nx, ny])
  }
}
let s1 = 0, c1 = 0, far = 0
let s2 = 0, c2 = 0, far2 = 0
for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
  if (X.inSea(g, x, y)) continue
  const d = dm[y * W + x]; if (d >= 0) { s1 += d; c1++; if (d > 60) far++ }
  let m = Infinity
  for (const a of ss) { const dd = D[a.tag][y * W + x]; if (dd >= 0 && dd < m) m = dd }
  if (m < Infinity) { s2 += m; c2++; if (m > 150) far2++ }
}
console.log('\n-- emptiness --')
console.log('  built things:                        ' + marks.length)
console.log('  mean walk to any built thing:        ' + (s1 / c1).toFixed(1) + ' tiles  ' + mins(s1 / c1))
console.log('  land >60 tiles from anything built:  ' + (100 * far / c1).toFixed(1) + '%')
console.log('  mean walk to nearest town:           ' + (s2 / c2).toFixed(1) + ' tiles  ' + mins(s2 / c2))
console.log('  land >150 tiles (>1.5min) from town: ' + (100 * far2 / c2).toFixed(1) + '%')

// --- 5. REACHABILITY: nothing essential stranded ---
// A tree BLOCKS movement. An earlier version of this harness excluded
// gatherables from the solid set -- copied from the generator's sweep,
// which asks a different question (can you stand beside it?) -- and so
// measured reachability through woodland. Every "0 stranded" result it
// produced before this line was fixed was measured through trees.
const WALKABLE_BUILT = new Set(['brewpot','watchfire','fire'])  // exactly engine._WALKABLE_BUILT
const solid = new Set()
for (const n of Object.values(w.nodes)) if (!WALKABLE_BUILT.has(n.type)) solid.add(n.x + ',' + n.y)
const sp = X.spawnDry(g)
const seen = new Set([sp.x + ',' + sp.y]); const q3 = [[sp.x, sp.y]]; let h3 = 0
while (h3 < q3.length) {
  const [x, y] = q3[h3++]
  for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
    const nx = x + dx, ny = y + dy, k = nx + ',' + ny
    if (seen.has(k) || nx < 1 || ny < 1 || nx >= W - 1 || ny >= H - 1) continue
    if (X.blockedAt(g, nx, ny) || solid.has(k)) continue
    seen.add(k); q3.push([nx, ny])
  }
}
const ESS = new Set(['bank','store','anvil','smith','well','waystone','keeper','signpost'])
const stranded = Object.entries(w.nodes).filter(([, n]) => ESS.has(n.type)
  && ![[1,0],[-1,0],[0,1],[0,-1]].some(([dx, dy]) => seen.has((n.x + dx) + ',' + (n.y + dy))))
console.log('\n-- reachability --')
console.log('  walkable tiles from spawn: ' + seen.size)
console.log('  STRANDED essentials:       ' + stranded.length)
for (const [id, n] of stranded.slice(0, 10)) console.log('    ' + id + ' (' + n.type + ' @' + n.x + ',' + n.y + ')')
console.log('')
