// §7g: DOES THE WINDOW'S GROUND AGREE WITH THE WORLD'S.
//
// `terrain-mirror.mjs` is the window's copy of the island, because a browser
// cannot import the generator. The copy has never been compared to the thing
// it copies. `check-mirrors-seeds.mjs` was supposed to: it reads terrain
// blocks out of the window HTML files, which have not held one since the
// mirror was factored out; it tests `worldgen-expanse4`, three foundings ago;
// and it throws before it compares anything.
//
// So nothing has been holding them together, and they had come apart in the
// loudest possible way: the world lays FLOOR inside every building in every
// town, and the mirror's v7 path has no floor branch at all, so every house
// on the island was drawn standing on grass. 1,317 of them in one band.
//
// This walks the whole island and asks both. It reports the disagreements by
// KIND and by place, because a mirror that is wrong about one tile is a
// curiosity and a mirror that is wrong about nine hundred is a different
// island.
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const TM = await import('./terrain-mirror.mjs')
const WG = await import('./worldgen-expanse7.mjs')

const quiet = console.log
console.log = () => {}
const g = WG.makeExpanse7Genesis(process.argv[2] ?? 'mirror', 'a'.repeat(64), 0, 896, 512)
console.log = quiet
TM.configure({ generator: g.worldGenerator, seed: g.genesisSeed, worldW: g.worldW, worldH: g.worldH })
// TOLD, the way a window is: this is what a citizen connected to a pillar
// sees. The derived path is the offline fallback and is checked after.
if (!process.argv.includes('--derived')) {
  const rows = []
  for (let y = 0; y < g.worldH; y++) {
    const runs = []
    let cur = null, start = 0
    for (let x = 0; x <= g.worldW; x++) {
      const k = x < g.worldW ? WG.groundKindAt(g, x, y) : null
      if (k !== cur) { if (cur !== null) runs.push([start, x - start, cur]); cur = k; start = x }
    }
    if (runs.length) rows.push([y, runs])
  }
  if (!TM.tellGround({ w: g.worldW, h: g.worldH, rows }))
    { quiet('the mirror refused the ground it was told'); process.exit(1) }
}

// WHAT THE TWO ARE ALLOWED TO CALL DIFFERENTLY.
//
// The truth answers `null` for anything it has no opinion about: open country
// is the biome's business, not the ground table's. The mirror always answers
// with a name. So a `null` from the truth is not a disagreement, it is a
// question the truth declines to answer.
const SAME = new Map([
  // the mirror draws the sea as sea; the truth calls open water nothing
  ['sea', new Set([null])],
  ['river', new Set([null])],
])
// STRIDE. Walking all 458,752 tiles takes a minute, which is a long time to
// spend in a suite that runs on every change. Every fault this has ever found
// covered hundreds of tiles, so every other tile in each direction finds them
// all and costs a quarter as much. `--full` walks the lot.
const STRIDE = process.argv.includes('--full') ? 1 : 2
const seen = new Map()
let checked = 0, agree = 0
for (let y = 0; y < g.worldH; y += STRIDE) {
  for (let x = 0; x < g.worldW; x += STRIDE) {
    const truth = WG.groundKindAt(g, x, y)
    const mirror = TM.terrainOf(x, y)
    checked++
    if (truth === null) { agree++; continue }          // the truth declines
    if (truth === mirror) { agree++; continue }
    if (SAME.get(mirror)?.has(truth)) { agree++; continue }
    const k = truth + ' -> ' + mirror
    if (!seen.has(k)) seen.set(k, { n: 0, at: [x, y] })
    seen.get(k).n++
  }
}
const rows = [...seen].sort((a, b) => b[1].n - a[1].n)
const wrong = rows.reduce((a, r) => a + r[1].n, 0)
quiet(`${checked} tiles, ${wrong} where the window and the world disagree`)
quiet('')
quiet('the world says'.padEnd(16) + 'the window draws'.padEnd(18) + 'tiles'.padStart(7) + '   first at')
for (const [k, v] of rows.slice(0, 24)) {
  const [t, m] = k.split(' -> ')
  quiet(t.padEnd(16) + m.padEnd(18) + String(v.n).padStart(7) + '   ' + v.at.join(','))
}
if (wrong) {
  quiet('')
  quiet('A window that draws different ground from the one a citizen walks on is')
  quiet('showing them a different island.')
}
process.exit(wrong ? 1 : 0)
