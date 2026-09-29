// THE ISLAND'S OWN SHORE, traced from the generator rather than drawn.
//
// Not a map: no towns, no roads, no names. Just the line where the land stops,
// which is the one shape in this world that means nothing to anybody who has
// not walked it. Taken from `isWater` on the LIVE founding, so it is the shore
// the world actually has and not a likeness of it.
//   curl -s https://interval.place/api/genesis > genesis.json
//   node coastline.mjs genesis.json          # writes site/coastline.svg
//
// It reads a FOUNDING RECORD rather than a running world, so it needs no node
// and no key: the shore is a pure function of the genesis, which is why the
// geography hash can commit to it.
import fs from 'node:fs'
import { generatorFor } from './worldgen-any.mjs'

const src = process.argv[2] ?? 'genesis.json'
const raw = JSON.parse(fs.readFileSync(src, 'utf8'))
const g = raw.genesis ?? raw
const gen = generatorFor(g)
const W = g.worldW, H = g.worldH

// One pass over the grid. `land` is the truth the outline is traced from.
const land = new Uint8Array(W * H)
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++)
    land[y * W + x] = gen.isWater(g, x, y) ? 0 : 1

const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : land[y * W + x]

// Marching squares on the tile lattice: for every cell corner, emit the edges
// between a land tile and a water tile. Drawn as segments rather than chased
// into one path, because a coast with islands is not one path and pretending
// it is would join them with a line that is not there.
const seg = []
for (let y = 0; y <= H; y++) {
  for (let x = 0; x <= W; x++) {
    // the vertical edge between (x-1,y) and (x,y)
    if (at(x - 1, y) !== at(x, y)) seg.push([x, y, x, y + 1])
    // the horizontal edge between (x,y-1) and (x,y)
    if (at(x, y - 1) !== at(x, y)) seg.push([x, y, x + 1, y])
  }
}

// Join the segments into runs so the SVG is paths rather than 60,000 lines:
// same file, a fraction of the size, and it scales to a shirt without seams.
const key = (x, y) => x + ',' + y
const from = new Map()
for (const s of seg) {
  const a = key(s[0], s[1]), b = key(s[2], s[3])
  if (!from.has(a)) from.set(a, [])
  if (!from.has(b)) from.set(b, [])
  from.get(a).push(b); from.get(b).push(a)
}
const used = new Set()
const edge = (a, b) => a < b ? a + '|' + b : b + '|' + a
const paths = []
for (const [start] of from) {
  for (const next of from.get(start)) {
    if (used.has(edge(start, next))) continue
    const run = [start]
    let cur = start, nxt = next
    while (nxt && !used.has(edge(cur, nxt))) {
      used.add(edge(cur, nxt))
      run.push(nxt)
      const onward = (from.get(nxt) || []).find((c) => !used.has(edge(nxt, c)))
      cur = nxt; nxt = onward
    }
    if (run.length > 3) paths.push(run)
  }
}
paths.sort((a, b) => b.length - a.length)

// Keep the shore and the real islands; drop the specks, which at shirt size
// are dirt on the print rather than land.
const kept = paths.filter((p) => p.length >= 24)
const d = kept.map((p) => 'M' + p.map((k) => k.replace(',', ' ')).join('L') + 'Z').join('')

// CROPPED TO THE LAND, not to the world. The generator leaves open sea on
// every side (the island's bounds are x 5-884, y 7-457 of 896x512) and a print
// framed on the world would be a shape sitting in a box of empty water.
let x0 = W, y0 = H, x1 = 0, y1 = 0
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (land[y * W + x]) {
  if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y
}
const pad = 6
const vx = x0 - pad, vy = y0 - pad
const vw = (x1 - x0) + 1 + pad * 2, vh = (y1 - y0) + 1 + pad * 2

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${vw} ${vh}" width="${vw}" height="${vh}">
<title>The coastline of the island at interval.place</title>
<path d="${d}" fill="none" stroke="#2f2418" stroke-width="1.6"
      stroke-linejoin="round" stroke-linecap="round"/>
</svg>
`
fs.writeFileSync('site/coastline.svg', svg)

// ---- AND THE TWO THINGS MADE OUT OF IT ----------------------------------
//
// Both are real artwork rather than pictures of artwork: they are the files a
// printer would be handed, which is why they are vector and why the coast in
// them is the same path as above rather than a traced copy of it.

// THE LEDGER'S ENDPAPER. The handbook refuses to say where anything is, so the
// ledger is where a citizen writes it down themselves. The coast sits under
// the ruling, faint enough to write over and clear enough to mark a place on.
const RULE_GAP = 11
const rules = []
for (let y = vy + 26; y < vy + vh - 12; y += RULE_GAP)
  rules.push(`M${vx + 16} ${y}H${vx + vw - 16}`)
const endpaper = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${vw} ${vh}" width="${vw}" height="${vh}">
<title>The ledger's endpaper: the island to write on</title>
<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="#f4ecda"/>
<path d="${rules.join('')}" stroke="#8a6a22" stroke-width="0.5" opacity="0.20" fill="none"/>
<path d="${d}" fill="none" stroke="#8a6a22" stroke-width="1.5" opacity="0.55"
      stroke-linejoin="round" stroke-linecap="round"/>
</svg>
`
fs.writeFileSync('site/ledger-endpaper.svg', endpaper)

// THE STICKER SHEET. Six up on A6, which is the cheapest sheet a print shop
// cuts, and the coast is the whole design: no name, no border, nothing that
// explains itself.
const COLS = 3, ROWS = 2, CELL = 58, GAP = 8
const sheetW = COLS * CELL + (COLS + 1) * GAP
const sheetH = ROWS * CELL + (ROWS + 1) * GAP
// A SILHOUETTE, NOT AN OUTLINE. At fifty millimetres the rivers and the lakes
// are narrower than the line drawing them, and an outlined coast collapses
// into a blob with freckles: the first sheet looked like a cartoon animal.
// Filled with the even-odd rule the same paths do the right thing on their
// own -- the mainland fills, the lakes inside it become holes, the rivers cut
// in from the shore as notches, and the offshore islands stay islands. It is
// the same geometry, read as area instead of as a line.
const scale = (CELL - 6) / Math.max(vw, vh)
const ups = []
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
  const ox = GAP + c * (CELL + GAP) + (CELL - vw * scale) / 2 - vx * scale
  const oy = GAP + r * (CELL + GAP) + (CELL - vh * scale) / 2 - vy * scale
  ups.push(`<g transform="translate(${ox.toFixed(2)} ${oy.toFixed(2)}) scale(${scale.toFixed(5)})">`
    + `<path d="${d}" fill="#2f2418" fill-rule="evenodd" stroke="none"/></g>`)
}
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sheetW} ${sheetH}" width="${sheetW}mm" height="${sheetH}mm">
<title>A sheet of coastline stickers, six up</title>
<rect width="${sheetW}" height="${sheetH}" fill="#f4ecda"/>
${ups.join('\n')}
</svg>
`
fs.writeFileSync('site/stickers.svg', sheet)
const waterTiles = land.reduce((a, v) => a + (v ? 0 : 1), 0)
console.log(`${W}x${H}  land ${(100 * (1 - waterTiles / (W * H))).toFixed(1)}%`)
console.log(`${seg.length} shore edges, ${paths.length} runs, ${kept.length} kept`)
console.log(`viewBox ${vx} ${vy} ${vw} ${vh}`)
console.log(`site/coastline.svg        ${(svg.length / 1024).toFixed(0)} KB`)
console.log(`site/ledger-endpaper.svg  ${(endpaper.length / 1024).toFixed(0)} KB  (${rules.length} rules)`)
console.log(`site/stickers.svg         ${(sheet.length / 1024).toFixed(0)} KB  (${COLS * ROWS} up, ${sheetW}x${sheetH}mm)`)
