// Interval worldgen: THE EXPANSE, fifth founding (interval-expanse-v5).
//
// v4's land is right and stays exactly as it is: the lobed countries, the
// capes, the Barrow the roads bend around, the four named crossings, the
// shire cluster against a frontier. Nothing here touches any of it.
//
// What v5 changes is HOW MUCH FURNITURE stands on that land, and where.
//
// v4 measured out at 911 landmarks over 214,344 land tiles and, having
// done so, could not put a single tile of the island further than 108 from
// one -- p99 was 48. The diagnosis it was written to cure ("you walk past
// nothing") was right; the cure overshot. A landmark is a landmark by
// CONTRAST, and at one per 235 tiles with nothing ever far, none of them is
// an event. Worse, the wayside system -- the one deliberately built so a
// journey has things in it -- was swamped: a landmark sat within five tiles
// of a road 19% of the time against 11% for open land generally, a whisper
// where there should have been a pull.
//
// Three changes, and no others:
//
//   1. THE FLOORS ARE HALVED. Every country's furniture floor is cut to
//      roughly half of v4's, and the spread between the richest and the
//      barest is widened rather than kept.
//   2. FURNITURE FOLLOWS THE ROADS. A clump may only seat itself where a
//      road is near; far from one it needs a hash to agree, and further
//      still it almost never does. Things are where people go.
//   3. THE QUIET QUARTERS. Six hashed tracts of backcountry, each seeded
//      only where no road comes within forty tiles, refuse furniture
//      outright. They are how the island gets somewhere genuinely bare --
//      not as an accident of the fill, but on purpose and by name.
//
// A fourth, smaller: v4's builders set a companion stone at a fixed offset
// beside a cairn, a bone pile and a charcoal clamp, which left 61 pairs at
// exactly (-1,-1) and 51 at (+1,+1) and made 47% of every nearest-neighbour
// step land on a perfect grid line. The companions are now optional and
// their offset is hashed.
//
// Determinism is v4's, unchanged: + - * / and sqrt, comparisons, hashed
// control points and smoothstep. No transcendentals anywhere.
//
// Per SPEC 9c this is a NEW GENERATOR ID. v4's world keeps its landmarks.
//
// v3's land is honest and its determinism is exemplary. What it is not is
// MEMORABLE, and the reason is structural, not decorative:
//
//   1. Its countries are BANDS. wilds = west of a line, crags = east of a
//      line, greenwood = north of a line, fens = south of a line, and the
//      leftover rectangle in the middle is the heartlands. Five countries
//      at 16/17/16/12/38 percent: a tic-tac-toe board. A band has no
//      SHAPE, so no citizen can draw one from memory.
//   2. Its settlements are EVENLY SPREAD. Nearest-neighbour 74 to 169
//      tiles, uniformly. A world you remember has a tight home cluster you
//      learn in a week and a frontier that stays a journey for a year.
//   3. Its towns are HAMLETS. The capital is 24x14 with 23 things in it,
//      six of which are single-tile "house". You cannot get lost in Anchor,
//      and a place you cannot get lost in once is never a place you know.
//   4. Its roads pass NOTHING. Mean distance from a land tile to any built
//      thing: 36 tiles. Half a minute of walking, repeatedly, past grass.
//
// So the fourth founding keeps every one of v3's laws (borders are
// features; landmarks must exist; nothing unreachable is placed; no
// transcendentals) and changes only the STRUCTURE:
//
//   * countries are LOBES, not bands: a weighted-Voronoi field over named
//     seeds, boundaries jittered by meander, meeting at three-way corners.
//     Two new countries (the Downs, the Moor) break the symmetry of "each
//     direction gets exactly one thing, equally sized".
//   * the SHIRE: five settlements inside a 260x180 box around Anchor, 55
//     to 85 tiles apart, and five more out on the frontier at 200-plus.
//     Density is a gradient now, not a constant.
//   * towns are LAID OUT: a wall, a gate with its guards, two street
//     lanes, a plaza, and multi-tile BUILDINGS with doors. The capital
//     has two banks, deliberately far apart, which invents two quarters
//     out of nothing (Varrock's trick, and it is the best one).
//   * the BARROW: a blocked upland in the middle of the heartlands that
//     the roads must go around. The straight line between two places is
//     wrong, which is what makes a route a route.
//   * the crossings are SCARCE and NAMED. v3 forded wherever a road felt
//     like it; here the Great River has four bridges and everyone who
//     ever crossed it crossed at one of them.
//   * one wayside thing every ~35 tiles of road: milestones that name
//     the next two towns, crofts, cairns, gibbets, shrines, orchards.
//
// Determinism is v3's, unchanged: + - * / and sqrt, comparisons, hashed
// control points and smoothstep. No transcendentals anywhere.
//
// Per SPEC 9c this is a NEW GENERATOR ID: v3's world keeps its land.
import E from './engine.js'
import { seedNum, meander, thash } from './worldgen-expanse.mjs'
import { angleOf } from './worldgen-expanse3.mjs'
import { PLANS, PLACES, layPlan, validatePlan, checkPlanConnected, isIndoor,
         seatCoastalPlan, quayTilesOfPlan } from './worldgen-shire.mjs'
export { seedNum, meander, thash, angleOf }

export const GENERATOR_ID = 'interval-expanse-v5'
export const WORLDGEN_MIN = { w: 448, h: 256 }

// ---------- the coast ----------
// A silhouette is a thing you should be able to draw badly and still be
// recognised. v3's island was a circle with a rumour of coastline; this
// one has four capes with names and three bays bitten between them, and
// every cape carries a mark on its tip so the shape is something you have
// STOOD on rather than something you have only seen on a chart.
//
// The table is the silhouette. Positive amt reaches out, negative bites in.
export const CAPES = [
  { tag: 'wildshead',  name: 'the Wilds Head', u: 180, w: 24, amt: +0.30, mark: 'broken-tower' },
  { tag: 'stonepoint', name: 'the Stonepoint', u: 3,   w: 8,  amt: +0.20, mark: 'sentinel' },
  { tag: 'nordhead',   name: 'the Nordhead',   u: 306, w: 13, amt: +0.15, mark: 'standing-stone' },
  { tag: 'sawtooth',   name: 'the Sawtooth',   u: 258, w: 7,  amt: +0.13, mark: 'standing-stone' },
]
const BAYS = [
  [152, 11, -0.17], [208, 11, -0.17], // the neck: the Wilds Head is nearly an island
  [38,  25, -0.22],                    // the Bay of Anchor, bitten deep
  [78,  14, -0.12],                    // the Fen Mouth
  [284, 10, -0.11],                    // Coldbight, between Sawtooth and Nordhead
  [330, 12, -0.09],                    // the Nordbight
]
export function coastR(g, u0) {
  const u = ((u0 % 360) + 360) % 360
  let r = 0.78 + meander(g, 301, u / 5, 10, 12) / 130 + meander(g, 302, u / 5, 4, 6) / 160
  const bump = (c, w, amt) => {
    const d1 = u - c < 0 ? c - u : u - c
    const d = d1 < 360 - d1 ? d1 : 360 - d1
    if (d < w) r += amt * (1 - d / w)
  }
  for (const c of CAPES) bump(c.u, c.w, c.amt)
  for (const [c, w, a] of BAYS) bump(c, w, a)
  return r
}
export function inSeaBase(g, x, y) {
  const dx = (x - g.worldW / 2) / (g.worldW / 2), dy = (y - g.worldH / 2) / (g.worldH / 2)
  const r = Math.sqrt(dx * dx + dy * dy)
  if (r <= 0.50) return false
  return r > coastR(g, angleOf(dx, dy))
}

// The tip of each cape: the outermost land tile inside the cape's angular
// window. Found by scan rather than by inverting angleOf, which has no
// inverse worth writing. Deterministic: a full raster in fixed order, ties
// broken by (y, x), so every engine picks the same stone.
const _tipMemo = new Map()
export function capeTipsOf(g) {
  const k = g.genesisSeed + ':' + g.worldW + 'x' + g.worldH
  const hit = _tipMemo.get(k)
  if (hit) return hit
  const W = g.worldW, H = g.worldH
  const best = {}
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    if (inSea(g, x, y)) continue
    const dx = (x - W / 2) / (W / 2), dy = (y - H / 2) / (H / 2)
    const r2 = dx * dx + dy * dy
    const u = angleOf(dx, dy)
    for (const c of CAPES) {
      const d1 = u - c.u < 0 ? c.u - u : u - c.u
      const d = d1 < 360 - d1 ? d1 : 360 - d1
      if (d > c.w) continue
      const cur = best[c.tag]
      if (!cur || r2 > cur.r2) best[c.tag] = { x, y, r2, name: c.name, mark: c.mark, tag: c.tag }
    }
  }
  const out = CAPES.map(c => best[c.tag]).filter(Boolean)
  _tipMemo.set(k, out)
  return out
}

export function emY(g) { return Math.round(g.worldH * 0.74) }
const _shoreMemo = new Map()
export function bayShoreX(g, y) {
  const k = g.genesisSeed + ':' + g.worldW + 'x' + g.worldH + ':' + y
  const hit = _shoreMemo.get(k)
  if (hit !== undefined) return hit
  let sx = null
  for (let x = g.worldW - 4; x >= Math.floor(g.worldW / 2); x--)
    if (!inSeaBase(g, x, y)) { sx = x; break }
  _shoreMemo.set(k, sx)
  return sx
}
export function islesOf(g) {
  const ey = emY(g), sh = bayShoreX(g, ey) ?? Math.round(g.worldW * 0.7)
  return [
    { x: sh + 20, y: ey + 24, rx: 10, ry: 7, tag: 'shrine' },
    { x: Math.round(g.worldW * 0.175), y: Math.round(g.worldH * 0.09), rx: 8, ry: 5, tag: 'farshore' },
  ]
}
export function onIsle(g, x, y) {
  for (const i of islesOf(g)) {
    const dx = (x - i.x) / i.rx, dy = (y - i.y) / i.ry
    if (dx * dx + dy * dy < 1) return true
  }
  return false
}
export const inSea = (g, x, y) => inSeaBase(g, x, y) && !onIsle(g, x, y)

// ---------- the Brandline ----------
// The one border that stays a LINE, because the Wilderness ditch is a line
// and that is exactly why everyone remembers stepping over it. A law's edge
// should be legible at a glance; a country's edge should not.
// STRAIGHT, and exactly where the law is.
//
// I wrote above that this is the one border that stays a line, because the
// Wilderness ditch is a line and that is why everyone remembers stepping
// over it -- and then gave it a nine-tile wobble, while the LAW stayed a
// rectangle. The two disagreed across 2,398 tiles: a citizen who had walked
// past the stones, with the Wilds all around them, could not attack and
// could not be attacked, and nothing on the ground explained why.
//
// A border you can stand beside has to be the border the law means. So the
// stones run dead straight down x = 0.215W, and geo.wilds ends on that same
// line. Cross the stones and the law changes, every time, everywhere.
export const BRAND_X = (g) => Math.round(g.worldW * 0.215)
export const brandX = (g, _y) => BRAND_X(g)

// ---------- the countries: lobes ----------
// A weighted-Voronoi field. Each country owns one or more SEEDS; a tile
// belongs to the nearest seed by squared distance over squared weight,
// with the distance metric squashed vertically (the canvas is 1.75:1, so
// an unsquashed field makes tall thin countries) and jittered by a meander
// so no boundary is ever an arc. Squared distances only: no sqrt, no
// transcendentals, exact in every engine.
// Weights and seed counts are a TUNED table, not a derivation. The first
// draft gave the Downs 5.7% of the land and the Moor 4.8%, which is not a
// country -- it is a smudge on a border, and a citizen would never say
// "I'll meet you on the Moor" about it. Both now get a second seed and a
// heavier weight, paid for out of the heartlands, which had 38% and did not
// need it. A dominant home country is correct (RuneScape's plains are the
// biggest thing on its map); six identical ones are not, and neither are
// two slivers.
//
// Note on the "evenness" metric: raising the small countries LOWERS the
// standard deviation of country sizes, which sounds like a regression and
// is not. v3's failure was never the variance -- it was that four of its
// five countries were similar in size AND identical in shape, because all
// of them were bands. Lobes carry their identity in their outline. What
// matters is that no country is too small to be somewhere.
const SEEDS = [
  ['heartlands', 0.42, 0.40, 0.90, 420],
  ['heartlands', 0.54, 0.52, 0.74, 421], // two seeds make a lobe, not a disc
  ['greenwood',  0.44, 0.10, 1.02, 422],
  ['greenwood',  0.66, 0.15, 0.86, 423],
  ['crags',      0.89, 0.28, 0.90, 424],
  ['crags',      0.83, 0.50, 0.70, 425],
  ['downs',      0.70, 0.68, 0.86, 426], // the chalk: sheep country, open
  ['downs',      0.79, 0.78, 0.62, 430],
  ['fens',       0.49, 0.90, 0.86, 427],
  ['fens',       0.33, 0.82, 0.60, 428],
  ['moor',       0.31, 0.16, 0.84, 429], // the heather, between wood and wilds
  ['moor',       0.38, 0.27, 0.58, 431],
]
const VSQUASH = 1.9 // the vertical metric: countries run wide, like real ones
export function regionAt(g, x, y) {
  let best = 'heartlands', bd = Infinity
  for (const [tag, fx, fy, wt, jt] of SEEDS) {
    const sx = fx * g.worldW, sy = fy * g.worldH
    const dx = x - sx, dy = (y - sy) * VSQUASH
    // the jitter is a function of position, so the BOUNDARY wobbles rather
    // than the seed moving: a country keeps its centre and loses its arc.
    // It must be LOW-frequency. A jitter whose gradient rivals the distance
    // field's does not bend a border, it dissolves it into speckle: the
    // first draft of this had greenwood and heartlands interleaving tile by
    // tile for forty tiles, which is not a treeline, it is television snow.
    // Two long octaves (wavelength 150 and 60 tiles) displace the boundary
    // by twenty or thirty tiles and leave it a LINE.
    const j = meander(g, jt, x + y * 0.6, 150, 26) + meander(g, jt + 40, x - y * 0.45, 60, 9)
    const d = (dx * dx + dy * dy) / (wt * wt) + j * 460
    if (d < bd) { bd = d; best = tag }
  }
  return best
}
export function biomeAt(g, x, y) {
  if (inSeaBase(g, x, y) && !onIsle(g, x, y)) return 'sea'
  if (x <= brandX(g, y)) return 'wilds'
  return regionAt(g, x, y)
}

// ---------- the locales: names smaller than a country ----------
// RuneScape has dozens of named places that are not towns -- Barbarian
// Village, Ice Mountain, the Monastery, the Digsite. They are what people
// actually navigate by, because "north of Anchor" is a bearing and "up on
// Bleakfell" is a place. Nineteen of them, in an ellipse each, keyed off
// features where a feature exists and off the canvas where none does.
//
// Cheap to add, and the thing that makes a chart worth reading.
export const LOCALES = [
  // heartlands
  { tag: 'anchorvale',  name: 'Anchor Vale',       fx: 0.50, fy: 0.50, rx: 46, ry: 30 },
  { tag: 'watersmeet',  name: 'Watersmeet',        anchor: 'watersmeet', rx: 30, ry: 20 },
  { tag: 'barrow',      name: 'the Barrow',        anchor: 'barrow',     rx: 34, ry: 21 },
  { tag: 'oxenlea',     name: 'Oxenlea',           fx: 0.37, fy: 0.58, rx: 32, ry: 22 },
  { tag: 'thornvale',   name: 'Thornvale',         fx: 0.62, fy: 0.42, rx: 30, ry: 20 },
  // greenwood
  { tag: 'deepwood',    name: 'the Deepwood',      fx: 0.52, fy: 0.07, rx: 54, ry: 22 },
  { tag: 'kingswood',   name: 'the Kingswood',     fx: 0.68, fy: 0.14, rx: 40, ry: 20 },
  { tag: 'hollychase',  name: 'Hollybarrow Chase', fx: 0.36, fy: 0.16, rx: 34, ry: 18 },
  // crags
  { tag: 'highdelving', name: 'the High Delving',  fx: 0.81, fy: 0.38, rx: 30, ry: 20 },
  { tag: 'sentinel',    name: 'the Sentinel Screes', fx: 0.86, fy: 0.55, rx: 30, ry: 20 },
  { tag: 'cragscar',    name: 'Cragfoot Scar',     fx: 0.90, fy: 0.28, rx: 28, ry: 18 },
  // downs
  { tag: 'sheepfolds',  name: 'the Sheepfolds',    fx: 0.72, fy: 0.71, rx: 30, ry: 18 },
  { tag: 'whitechalk',  name: 'Whitechalk',        fx: 0.80, fy: 0.78, rx: 32, ry: 18 },
  // fens
  { tag: 'eelmarsh',    name: 'Eelmarsh',          fx: 0.48, fy: 0.85, rx: 36, ry: 18 },
  { tag: 'fenmouth',    name: 'the Fen Mouth',     fx: 0.58, fy: 0.90, rx: 30, ry: 16 },
  // moor
  { tag: 'bleakfell',   name: 'Bleakfell',         fx: 0.29, fy: 0.15, rx: 34, ry: 20 },
  { tag: 'ninestone',   name: 'Ninestone Moor',    fx: 0.38, fy: 0.26, rx: 30, ry: 18 },
  // wilds
  { tag: 'deadreach',   name: "Deadman's Reach",   fx: 0.12, fy: 0.30, rx: 38, ry: 26 },
  { tag: 'boneyard',    name: 'the Boneyard',      fx: 0.09, fy: 0.62, rx: 34, ry: 24 },
]
// A locale placed by CANVAS FRACTION is one coastline away from being in the
// sea -- the same mistake that drowned Fenmarch, and it had quietly killed
// five of these. The Deepwood, the Kingswood, Cragfoot Scar, Whitechalk and
// the Fen Mouth all had ellipses centred over open water, so localeAt could
// never return them for any tile a citizen could stand on: five names that
// existed in a table and nowhere else. So a locale SEATS itself, nudging
// until its ellipse actually covers ground.
const _locMemo = new Map()
function localeCentre(g, L) {
  if (L.anchor === 'barrow') return barrowC(g)
  if (L.anchor === 'watersmeet') return junctionsOf(g).watersmeet
  const k = g.genesisSeed + ':' + g.worldW + 'x' + g.worldH + ':' + L.tag
  const hit = _locMemo.get(k)
  if (hit) return hit
  const nx = Math.round(L.fx * g.worldW), ny = Math.round(L.fy * g.worldH)
  // how much land does the ellipse cover from here? sampled coarse, fixed order
  const land = (cx, cy) => {
    let n = 0
    for (let dy = -L.ry; dy <= L.ry; dy += 3) for (let dx = -L.rx; dx <= L.rx; dx += 3) {
      const u = dx / L.rx, v = dy / L.ry
      if (u * u + v * v > 1) continue
      const x = cx + dx, y = cy + dy
      if (x < 1 || y < 1 || x >= g.worldW - 1 || y >= g.worldH - 1) continue
      if (!inSea(g, x, y)) n++
    }
    return n
  }
  let best = { x: nx, y: ny }, bestN = land(nx, ny)
  // walk outward until the ellipse is decently ashore; ties break by radius
  // then by the fixed dy/dx order, so every engine seats it identically
  for (let rad = 2; rad <= 70 && bestN < 40; rad += 2)
    for (let dy = -rad; dy <= rad; dy += 2) for (let dx = -rad; dx <= rad; dx += 2) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
      const n = land(nx + dx, ny + dy)
      if (n > bestN) { bestN = n; best = { x: nx + dx, y: ny + dy } }
    }
  _locMemo.set(k, best)
  return best
}
// Countries have display names too. The first draft had localeAt fall back
// to biomeAt's raw tag, so a citizen in a named place got "the Sheepfolds"
// and one twenty tiles away got "fens" -- the same function answering in
// two different registers. A nameplate should never make the reader do
// that translation.
export const COUNTRY_NAMES = {
  sea: 'the Sea', wilds: 'the Wilds', heartlands: 'the Heartlands',
  greenwood: 'the Greenwood', crags: 'the Crags', fens: 'the Fens',
  downs: 'the Downs', moor: 'the Moor',
}
// The name of the place you are standing in: the tightest locale that
// contains you, or failing that the country. Ties break by table order, so
// the answer is total and identical on every engine.
export function localeAt(g, x, y) {
  let best = null, bestArea = Infinity
  for (const L of LOCALES) {
    const c = localeCentre(g, L)
    const dx = (x - c.x) / L.rx, dy = (y - c.y) / L.ry
    if (dx * dx + dy * dy > 1) continue
    const a = L.rx * L.ry
    if (a < bestArea) { bestArea = a; best = L }
  }
  if (best) return best.name
  const b = biomeAt(g, x, y)
  return COUNTRY_NAMES[b] ?? b
}
export function localesOf(g) { return LOCALES.map(L => ({ ...L, ...localeCentre(g, L) })) }

// ---------- the Ridge and the Barrow ----------
// The Ridge still walls off the crags, crossed at two passes. The BARROW is
// new: a blocked upland sitting in the heartlands south-east of Anchor, so
// that the shortest line from the capital to the bay is not the road, and
// the road has a reason a traveller can see.
export const ridgeX = (g, y) => Math.round(g.worldW * 0.695 + meander(g, 311, y, 30, 11))
export const passesOf = (g) => [Math.round(g.worldH * 0.34), Math.round(g.worldH * 0.62)]
export function onRidge(g, x, y) {
  const rx = ridgeX(g, y)
  const d = x - rx < 0 ? rx - x : x - rx
  if (d > 2) return false
  for (const p of passesOf(g)) { const pd = y - p < 0 ? p - y : y - p; if (pd < 4) return false }
  if (biomeAt(g, x, y) === 'greenwood') return false // the ridge sinks beneath the wood
  // ...and dies away into the Downs before it reaches the bay. A ridge that
  // runs into the sea leaves the southeast with no shore a port could stand
  // on: Eastmere's first three seats put its piers into solid rock, and the
  // drawing was not the thing that was wrong. Hand-authoring the core forces
  // the terrain to make room for it, which is the right way round.
  if (y > g.worldH * 0.70) return false
  if (inSeaBase(g, x, y)) return false
  return true
}
export function barrowC(g) { return { x: Math.round(g.worldW * 0.575), y: Math.round(g.worldH * 0.585) } }
export function onBarrow(g, x, y) {
  const c = barrowC(g)
  const dx = (x - c.x) / 26, dy = (y - c.y) / 15
  const r2 = dx * dx + dy * dy
  const j = meander(g, 330, x + y, 18, 12) / 190
  // a solid crown of stone; roads go around. NOTE the missing `&& r2 > 0`:
  // an earlier draft had it, which excluded the exact centre tile and left
  // a single walkable hole in the middle of an impassable hill -- a tile no
  // route could ever reach, that a signpost duly landed on. Geometry with a
  // hole in the middle is a bug even when nothing is standing in it.
  return r2 < 1 + j
}

// ---------- the waters ----------
export const SRC_YF = 0.105
export function riverX(g, y) {
  return Math.floor(g.worldW / 2) + Math.round(meander(g, 21, y, 52, 30) + meander(g, 22, y, 16, 6))
}
export const confY = (g) => Math.round(g.worldH * 0.63)
export function marchWY(g, x) {
  const cyy = confY(g)
  const reach = riverX(g, cyy) - 8 - x
  const t = reach < 0 ? 0 : reach > 70 ? 1 : reach / 70
  return cyy + Math.round(meander(g, 25, x, 36, 12) * t)
}
export function inRiver(g, x, y) {
  const srcY = Math.round(g.worldH * SRC_YF)
  if (y >= srcY) {
    const rx = riverX(g, y)
    const d = x - rx < 0 ? rx - x : x - rx
    if (d <= (y > g.worldH * 0.82 ? 2 : 1)) return true
    if (y > g.worldH * 0.84) {
      const dx2 = rx - 7 + Math.round(meander(g, 27, y, 9, 3))
      const d2 = x - dx2 < 0 ? dx2 - x : x - dx2
      if (d2 <= 1) return true
    }
  }
  if (x < riverX(g, confY(g)) - 1 && x > brandX(g, y) - 16) {
    const my = marchWY(g, x)
    const d3 = y - my < 0 ? my - y : y - my
    if (d3 <= 1) return true
  }
  return false
}
export function lakeC(g) { return { x: Math.round(g.worldW * 0.745), y: Math.round(g.worldH * 0.21) } }
export function inLake(g, x, y) {
  const c = lakeC(g), dx = (x - c.x) / 24, dy = (y - c.y) / 13
  return dx * dx + dy * dy < 1
}
export const isWater = (g, x, y) => inSea(g, x, y) || inRiver(g, x, y) || inLake(g, x, y)

// ---------- Eastmere finds its own harbour ----------
// A port cannot be seated at a fraction: the bay is procedural and the
// drawing is not. So the plan declares which of its tiles must be open
// water and this searches the coast for a placement where that holds.
// Only inSea/onIsle are consulted, never fordAt or blockedAt, so calling
// this from fordAt does not tie a knot.
const _emSeat = new Map()
export function eastmereSeat(g) {
  const k = g.genesisSeed + ':' + g.worldW + 'x' + g.worldH
  const hit = _emSeat.get(k)
  if (hit !== undefined) return hit
  const ey = emY(g)
  const nomX = (bayShoreX(g, ey) ?? Math.round(g.worldW * 0.7)) - 14
  const found = seatCoastalPlan('eastmere', PLANS.eastmere, nomX, ey, {
    g, isWater,
    inBounds: (x, y) => x >= 1 && y >= 1 && x < g.worldW - 1 && y < g.worldH - 1,
    blockedTerrain: (gg, x, y) => onRidge(gg, x, y) || onBarrow(gg, x, y),
  }, 90)
  // the bay refused every seat: fall back to the old fraction rather than
  // fail a founding. A port slightly wrong beats no port at all.
  const out = found ?? { x: nomX, y: ey }
  _emSeat.set(k, out)
  return out
}
const _quayMemo = new Map()
export function quayTilesOf(g) {
  const k = g.genesisSeed + ':' + g.worldW + 'x' + g.worldH
  const hit = _quayMemo.get(k)
  if (hit) return hit
  // EVERY drawn plan may lay decking, not just Eastmere. Fenmarch is built
  // on stilts over the delta and is nothing but decking; if only the port
  // could deck, the fen town would be a set of buildings in a river.
  const em = seatDrawnTown(g, 'eastmere', (bayShoreX(g, emY(g)) ?? Math.round(g.worldW*0.7)) - 14, emY(g))
  const fm = seatDrawnTown(g, 'fenmarch', riverX(g, Math.round(g.worldH*0.83)) + 9, Math.round(g.worldH*0.83))
  const out = new Set([
    ...quayTilesOfPlan('eastmere', PLANS.eastmere, em.x, em.y),
    ...quayTilesOfPlan('fenmarch', PLANS.fenmarch, fm.x, fm.y),
  ])
  _quayMemo.set(k, out)
  return out
}

// Fenmarch is the second coastal drawing: it declares four wet corners, so
// the seat search has to find it somewhere that genuinely is a delta rather
// than a dry field near a river.
const _fmSeat = new Map()
export function fenmarchSeat(g) {
  const k = g.genesisSeed + ':' + g.worldW + 'x' + g.worldH
  const hit = _fmSeat.get(k)
  if (hit) return hit
  const ny = Math.round(g.worldH * 0.83)
  const nx = riverX(g, ny) + 9
  const found = seatCoastalPlan('fenmarch', PLANS.fenmarch, nx, ny, {
    g, isWater,
    inBounds: (x, y) => x >= 1 && y >= 1 && x < g.worldW - 1 && y < g.worldH - 1,
    blockedTerrain: (gg, x, y) => onRidge(gg, x, y) || onBarrow(gg, x, y),
  }, 80)
  const out = found ?? seatTown(g, nx, ny, 34, 24)
  _fmSeat.set(k, out)
  return out
}

// SEAT A DRAWING. Not by arithmetic -- by asking the land.
//
// Anchor sat at `cx - 16` because that offset cleared the Great River on the
// seed I happened to develop against. On eight of the next ten seeds the
// river ran somewhere else and cut the capital in half. Millbrook at
// `riverX + 16`, Oxenford at `cx - 74`, Thornbury at `cx + 78`: every one of
// them was a bet that the water would be where it was last time.
//
// So a drawn town searches, in a fixed spiral, for a placement where the
// whole drawing is dry and standable AND its own connectivity check passes.
// Trying the check inside the search is the point: a seat that would throw
// is simply not a seat.
const _seatMemo = new Map()
export function seatDrawnTown(g, tag, nomX, nomY) {
  const k = g.genesisSeed + ':' + g.worldW + 'x' + g.worldH + ':' + tag
  const hit = _seatMemo.get(k)
  if (hit) return hit
  const rows = PLANS[tag], d = validatePlan(tag, rows)
  const pw = d.w, ph = d.h
  const dryOk = (cx, cy) => {
    const x0 = cx - (pw >> 1), y0 = cy - (ph >> 1)
    for (let ry = 0; ry < ph; ry++) for (let rx = 0; rx < pw; rx++) {
      const ch = rows[ry][rx]
      if (ch === ' ' || ch === '=') continue
      const x = x0 + rx, y = y0 + ry
      if (x < 3 || y < 3 || x >= g.worldW - 3 || y >= g.worldH - 3) return false
      const wet = isWater(g, x, y)
      if (ch === '~' || ch === 'F') { if (!wet) return false }
      else if (wet) return false
      else if (onRidge(g, x, y) || onBarrow(g, x, y)) return false
    }
    return true
  }
  const ok = (cx, cy) => {
    if (!dryOk(cx, cy)) return false
    try { checkPlanConnected(tag, rows, cx, cy, { g, isWater, blockedAt: null }); return true }
    catch { return false }
  }
  let out = null
  spiral: for (let rad = 0; rad < 110; rad++)
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
      if (ok(nomX + dx, nomY + dy)) { out = { x: nomX + dx, y: nomY + dy }; break spiral }
    }
  // the land refused every seat within reach: fall back to merely dry, and
  // let the connectivity check speak if that is not enough
  if (!out) {
    spiral2: for (let rad = 0; rad < 110; rad++)
      for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
        if (dryOk(nomX + dx, nomY + dy)) { out = { x: nomX + dx, y: nomY + dy }; break spiral2 }
      }
  }
  out = out ?? { x: nomX, y: nomY }
  _seatMemo.set(k, out)
  return out
}

// A frontier town seats itself on ground it can actually stand on. This is
// insurance against exactly what deepening the bays did on the first pass:
// the Fen Mouth grew, and Fenmarch's nominal centre -- a fraction of the
// canvas, as it had always been -- ended up two hundred tiles out to sea,
// with no warning louder than a router that could not find it. A town
// placed by fraction is a town one coastline tweak away from drowning.
export function seatTown(g, nomX, nomY, tw, th) {
  const half = { x: tw >> 1, y: th >> 1 }
  const dry = (cx, cy) => {
    for (let y = cy - half.y; y <= cy + half.y; y += 2)
      for (let x = cx - half.x; x <= cx + half.x; x += 2) {
        if (x < 3 || y < 3 || x >= g.worldW - 3 || y >= g.worldH - 3) return false
        if (inSea(g, x, y)) return false
        if (onRidge(g, x, y) || onBarrow(g, x, y)) return false
      }
    return true
  }
  for (let rad = 0; rad < 90; rad++)
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
      if (dry(nomX + dx, nomY + dy)) return { x: nomX + dx, y: nomY + dy }
    }
  return { x: nomX, y: nomY }
}

// ---------- the settlements: a shire, and a frontier ----------
// This is the change that matters most. Five towns inside a 260x180 box
// around the capital, 55 to 85 tiles apart: a citizen learns the shire in
// their first week and never unlearns it. Five more out at 200 to 380
// tiles: those stay journeys for a year. Density is a GRADIENT.
// MEMOISED, and it must be. Seating four frontier towns and searching the
// coast for a harbour costs ~50ms; fordAt calls this once per tile it is
// asked about, and blockedAt calls fordAt. Unmemoised, a founding does not
// finish. The table is built once per (seed, size) and shared thereafter.
const _ssMemo = new Map()
export function settlementsOf(g) {
  const _k = g.genesisSeed + ':' + g.worldW + 'x' + g.worldH
  const _hit = _ssMemo.get(_k)
  if (_hit) return _hit
  const W = g.worldW, H = g.worldH
  const cx = Math.floor(W / 2), cy = Math.floor(H / 2)
  const ey = emY(g)
  const shore = bayShoreX(g, ey) ?? Math.round(W * 0.7)
  const mby = cy - 62                       // Millbrook: one river-bend north
  const oxy = cy + 30
  // The shire towns take their footprint FROM THEIR DRAWING, so the
  // walls, the rect, and the art can never disagree about where the town
  // ends. Change the ascii, the rect follows.
  const P = (tag) => { const d = validatePlan(tag, PLANS[tag]); return { w: d.w, h: d.h } }
  const S = [
    // ---- THE SHIRE (hand-authored: see worldgen-shire.mjs) ----
    // Anchor stands WEST of the Great River, which runs x456-471 across its
    // latitudes: a drawing cannot know where the water went, so the author
    // places the town clear of it. Spawn (the world's exact centre) still
    // falls inside, by the east gate, with the river beyond.
    { tag: 'anchor',     name: 'Anchor',     ...seatDrawnTown(g, 'anchor', cx, cy),                              ...P('anchor'),      kind: 'capital', ring: 'shire' },
    // Millbrook stands with the river along its WEST wall, not through its
    // middle: the plan is 28 wide, so seating it at riverX+16 puts the whole
    // drawing east of the water and the mill still looks out on it.
    { tag: 'millbrook',  name: 'Millbrook',  ...seatDrawnTown(g, 'millbrook', riverX(g, mby) + 16, mby),          ...P('millbrook'),   kind: 'mill',    ring: 'shire' },
    { tag: 'oxenford',   name: 'Oxenford',   ...seatDrawnTown(g, 'oxenford', cx - 104, oxy + 10),                       ...P('oxenford'),    kind: 'market',  ring: 'shire' },
    { tag: 'thornbury',  name: 'Thornbury',  ...seatDrawnTown(g, 'thornbury', cx + 78, cy - 34),                  ...P('thornbury'),   kind: 'market',  ring: 'shire' },
    // Hollybarrow sits a full field west of the river, not in Millbrook's
    // lap: the shire's spacing band is 55 to 90 tiles (33 to 54 seconds),
    // which is RuneScape's Lumbridge-to-Draynor and Draynor-to-Port Sarim.
    // Closer than that and two towns read as one town with a gap in it.
    { tag: 'hollybarrow',name: 'Hollybarrow',...seatDrawnTown(g, 'hollybarrow', cx - 96, cy - 52),                ...P('hollybarrow'), kind: 'farm',    ring: 'shire' },
    // ---- THE FRONTIER ----
    // Every settlement on the island is DRAWN now. "Slightly generic is
    // correct for a frontier outpost" was a rationalisation for not doing
    // the work: a frontier town is the payoff at the end of a four-minute
    // walk, and a generic place you ARRIVED at is a broken promise.
    { tag: 'greenhollow',name: 'Greenhollow',...seatDrawnTown(g, 'greenhollow', Math.round(W*0.42), Math.round(H*0.12)), ...P('greenhollow'), kind: 'timber', ring: 'frontier', drawn: true },
    { tag: 'cragfoot',   name: 'Cragfoot',   ...seatDrawnTown(g, 'cragfoot', Math.round(W*0.87), Math.round(H*0.44)), ...P('cragfoot'), kind: 'forge', ring: 'frontier', drawn: true },
    // Eastmere is DRAWN (worldgen-shire.mjs) even though it is a frontier
    // town: a port is the most characterful thing on an island and a
    // generated one never will be. It seats itself against the real bay.
    { tag: 'eastmere',   name: 'Eastmere',   ...seatDrawnTown(g, 'eastmere', (bayShoreX(g, ey) ?? Math.round(W*0.7)) - 14, ey), ...P('eastmere'), kind: 'port', ring: 'frontier', drawn: true },
    { tag: 'fenmarch',   name: 'Fenmarch',   ...seatDrawnTown(g, 'fenmarch', riverX(g, Math.round(H*0.83)) + 9, Math.round(H*0.83)), ...P('fenmarch'), kind: 'port', ring: 'frontier', drawn: true },
    { tag: 'norwick',    name: 'Norwick',    ...seatDrawnTown(g, 'norwick', brandX(g, Math.round(H*0.47)) + 18, Math.round(H*0.47)), ...P('norwick'), kind: 'garrison', ring: 'frontier', drawn: true },
  ]
  _ssMemo.set(_k, S)
  return S
}
export const rectOf = (s) => ({
  x0: s.x - (s.w >> 1), x1: s.x + (s.w >> 1),
  y0: s.y - (s.h >> 1), y1: s.y + (s.h >> 1),
})

// ---------- the crossings: scarce, and named ----------
// v3 let a road ford the river anywhere it liked, so a crossing cost
// nothing and meant nothing. Four bridges on the Great River, one on the
// Marchwater, one causeway. Everyone who ever crossed, crossed here.
export function bridgesOf(g) {
  const H = g.worldH
  const ys = [Math.round(H * 0.20), Math.round(H * 0.395), confY(g) + 2, Math.round(H * 0.80)]
  const names = ['Highford', 'the Millbrook Bridge', 'the Watersmeet Bridge', 'Fenford']
  const out = ys.map((y, i) => ({ x: riverX(g, y), y, name: names[i], tag: 'br' + i }))
  const mx = Math.round(g.worldW * 0.30)
  out.push({ x: mx, y: marchWY(g, mx), name: 'the Oxenford', tag: 'brm' })
  return out
}
export function onBridge(g, x, y) {
  for (const b of bridgesOf(g)) {
    if (Math.abs(x - b.x) <= 4 && Math.abs(y - b.y) <= 2) return true
  }
  return false
}

// ---------- the roads: routed, not drawn ----------
// v3 drew roads as straight lines with a meander laid over the top, which
// is a surveyor's road: it acknowledges nothing. These are ROUTED. The
// river is impassable except at its five bridges and the Ridge except at
// its two passes, so a router asked to get from Thornbury to Cragfoot
// finds the North Pass by itself, and a road to Fenmarch finds Fenford
// because there is no other way over the water. Every waypoint v4 used to
// hand-place around the Barrow is gone; the rock does the work.
//
// DETERMINISM. This is the one part of the fourth founding that could fork
// a world silently, so it is worth being explicit about. Three rules:
//   1. All costs are INTEGERS. No floats enter the frontier, ever.
//   2. The heap pops by (dist, y, x), which is a TOTAL order -- every tile
//      has a unique (y, x), so two states can never compare equal and the
//      pop order cannot depend on insertion order or on a library's heap
//      being stable. A comparator that returns 0 for distinct states is
//      exactly the bug SPEC 9b exists to prevent.
//   3. Neighbours are visited in a fixed listed order.
// Nothing here calls blockedAt or fordAt: those consult onRoad, and asking
// them from inside the router would tie a knot.
const BIOME_COST = { heartlands: 10, downs: 11, greenwood: 15, moor: 15, wilds: 17, fens: 20, crags: 22 }
const IMPASSABLE = -1
export function routeCost(g, x, y) {
  if (x < 2 || y < 2 || x >= g.worldW - 2 || y >= g.worldH - 2) return IMPASSABLE
  const b = biomeAt(g, x, y)
  if (b === 'sea') return IMPASSABLE
  if (isWater(g, x, y)) return onBridge(g, x, y) ? 10 : IMPASSABLE
  if (onBarrow(g, x, y)) return IMPASSABLE
  if (onRidge(g, x, y)) return IMPASSABLE
  let c = BIOME_COST[b] ?? 14
  // a road would rather not run along the lip of the water
  if (isWater(g, x + 1, y) || isWater(g, x - 1, y) || isWater(g, x, y + 1) || isWater(g, x, y - 1)) c += 6
  return c
}
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]

// The cost field, rasterised ONCE. biomeAt is a twelve-seed weighted
// Voronoi with two meanders per seed; calling it eight times per popped
// tile, fifteen times over, is minutes of work. Calling it once per tile
// and reading the array back is seconds. Same numbers, same order.
const _costMemo = new Map()
export function costFieldOf(g) {
  const key = g.genesisSeed + ':' + g.worldW + 'x' + g.worldH
  const hit = _costMemo.get(key)
  if (hit) return hit
  const W = g.worldW, H = g.worldH
  const f = new Int16Array(W * H)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) f[y * W + x] = routeCost(g, x, y)
  _costMemo.set(key, f)
  return f
}

// A binary heap keyed on a single packed integer. The estimate occupies
// the high bits and the tile index the low, so ONE integer comparison is
// the total order (estimate, y, x) -- there is no comparator to get wrong,
// and no two states can ever compare equal, because no two tiles share an
// index. A heap that can return ties in insertion order is precisely the
// bug SPEC 9b exists to prevent: two engines, two roads, one silent fork.
function heapPush(h, v) {
  h.push(v); let i = h.length - 1
  while (i > 0) { const p = (i - 1) >> 1; if (h[p] <= h[i]) break; const t = h[p]; h[p] = h[i]; h[i] = t; i = p }
}
function heapPop(h) {
  const top = h[0], last = h.pop()
  if (h.length) {
    h[0] = last; let i = 0
    for (;;) {
      const l = i * 2 + 1, r = l + 1; let m = i
      if (l < h.length && h[l] < h[m]) m = l
      if (r < h.length && h[r] < h[m]) m = r
      if (m === i) break
      const t = h[m]; h[m] = h[i]; h[i] = t; i = m
    }
  }
  return top
}
const MINCOST = 10
export function routePath(g, ax, ay, bx, by) {
  const W = g.worldW, H = g.worldH, N = W * H
  const f = costFieldOf(g)
  const dist = new Int32Array(N).fill(0x7fffffff)
  const prev = new Int32Array(N).fill(-1)
  const done = new Uint8Array(N)
  const si = ay * W + ax, ti = by * W + bx
  if (f[si] < 0 || f[ti] < 0) return null
  // A* with an octile heuristic scaled by the cheapest tile on the island.
  // Admissible and consistent, so the path it returns is the same path
  // Dijkstra would have returned -- just with far less of the map opened.
  const hEst = (x, y) => {
    const dx = x > bx ? x - bx : bx - x, dy = y > by ? y - by : by - y
    const lo = dx < dy ? dx : dy, hi = dx < dy ? dy : dx
    return (hi - lo) * MINCOST + lo * 14
  }
  // a gentle pull toward the straight line, so a road on flat ground runs
  // straight instead of staircasing wherever the tie-break happens to lean.
  // It bends for terrain, and for nothing else.
  const vx = bx - ax, vy = by - ay
  const L = Math.sqrt(vx * vx + vy * vy)
  const offLine = (x, y) => {
    if (L < 1) return 0
    const cr = (x - ax) * vy - (y - ay) * vx
    const a = cr < 0 ? -cr : cr
    return Math.floor(a / (L * 5))
  }
  dist[si] = 0
  const pack = (d, i) => d * 1048576 + i
  const heap = [pack(hEst(ax, ay), si)]
  let found = false
  while (heap.length) {
    const i = heapPop(heap) % 1048576
    if (done[i]) continue
    done[i] = 1
    if (i === ti) { found = true; break }
    const x = i % W, y = (i - x) / W
    const d0 = dist[i]
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
      const ni = ny * W + nx
      if (done[ni]) continue
      const c = f[ni]
      if (c < 0) continue
      const step = (dx && dy) ? Math.round(c * 1.4) : c
      const nd = d0 + step + offLine(nx, ny)
      if (nd < dist[ni]) { dist[ni] = nd; prev[ni] = i; heapPush(heap, pack(nd + hEst(nx, ny), ni)) }
    }
  }
  if (!found) return null
  const out = []
  for (let i = ti; i !== -1; i = prev[i]) { const x = i % W; out.push([x, (i - x) / W]); if (i === si) break }
  out.reverse()
  return out
}

// ---------- the road graph ----------
// A junction placed by a fixed OFFSET is a junction that lands in the river
// on some other seed. Watersmeet was `riverX(confY) + 4`, which clears the
// water on one seed and sits in it on the next -- and a router asked to
// reach a tile in a river returns null, which aborts the founding. So every
// junction is seated: nudged, in a fixed search order, onto ground a road
// could actually be built on.
//
// This is the same mistake as the towns placed by canvas fraction and the
// locales centred in the sea. Anything positioned by arithmetic rather than
// by asking the terrain will eventually be asked about a seed where the
// arithmetic is wrong.
export function seatPoint(g, x, y) {
  if (routeCost(g, x, y) > 0) return { x, y }
  for (let rad = 1; rad < 60; rad++)
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
      if (routeCost(g, x + dx, y + dy) > 0) return { x: x + dx, y: y + dy }
    }
  return { x, y }
}
const _juncMemo = new Map()
export function junctionsOf(g) {
  const _k = g.genesisSeed + ':' + g.worldW + 'x' + g.worldH
  const _hit = _juncMemo.get(_k)
  if (_hit) return _hit
  const [p1, p2] = passesOf(g)
  const br = bridgesOf(g)
  const b = {}; for (const x of br) b[x.tag] = { x: x.x, y: x.y }
  const out = {
    ...b,
    npass: { x: ridgeX(g, p1), y: p1 },
    spass: { x: ridgeX(g, p2), y: p2 },
    watersmeet: seatPoint(g, riverX(g, confY(g)) + 6, confY(g) + 7),
    shrine: (() => { const i = islesOf(g)[0]; return { x: i.x, y: i.y } })(),
  }
  _juncMemo.set(_k, out)
  return out
}
export function roadSegsOf(g) {
  const s = {}; for (const t of settlementsOf(g)) s[t.tag] = t
  const j = junctionsOf(g)
  // TOPOLOGY only. Where a road actually goes is the router's business now:
  // the passes, the bridges and the way around the Barrow are all found,
  // not specified. Watersmeet survives as a waypoint because it is a named
  // place with a waystone, not because the road needs the hint.
  return [
    // --- the shire ring: the loop a citizen walks a thousand times ---
    [s.anchor, s.millbrook, 91], [s.millbrook, s.hollybarrow, 92],
    [s.hollybarrow, s.oxenford, 93], [s.oxenford, s.anchor, 94],
    [s.anchor, s.thornbury, 95], [s.thornbury, s.millbrook, 96],
    // --- radials to the frontier ---
    [s.millbrook, s.greenhollow, 98],
    [s.thornbury, s.cragfoot, 100],   // finds the North Pass by itself
    [s.anchor, s.eastmere, 103],      // finds its way around the Barrow
    [s.oxenford, j.watersmeet, 104], [j.watersmeet, s.fenmarch, 107],
    [s.eastmere, s.fenmarch, 108],
    [s.cragfoot, s.eastmere, 109],
    [s.oxenford, s.norwick, 111],     // finds the Oxenford crossing
    [s.hollybarrow, s.norwick, 112],
    [s.eastmere, j.shrine, 113],      // the causeway: drawn, not routed
  ]
}
export const CAUSEWAY_TAG = 113
const _pathMemo = new Map()
// The cost field exists to route the roads and for nothing else. Holding a
// 917KB Int16Array for the life of the process to serve fifteen A* runs that
// happen once is scaffolding left standing after the building is up.
export function releaseCostField(g) {
  _costMemo.delete(g.genesisSeed + ':' + g.worldW + 'x' + g.worldH)
}
export function routedPathsOf(g) {
  const key = g.genesisSeed + ':' + g.worldW + 'x' + g.worldH
  const hit = _pathMemo.get(key)
  if (hit) return hit
  const out = []
  for (const [a, b, tag] of roadSegsOf(g)) {
    if (tag === CAUSEWAY_TAG) continue
    const p = routePath(g, a.x, a.y, b.x, b.y)
    // a route that cannot be found is a world that cannot be walked. Better
    // to fail the founding loudly than to publish an island with a town
    // nobody can reach.
    if (!p) throw new Error(`no route from (${a.x},${a.y}) to (${b.x},${b.y}) [seg ${tag}]: `
      + `the crossings or the passes have sealed a settlement off`)
    out.push({ tag, path: p })
  }
  _pathMemo.set(key, out)
  releaseCostField(g)   // the scaffolding comes down
  return out
}
const _roadMemo = new Map()
export function roadTilesOf(g) {
  const key = g.genesisSeed + ':' + g.worldW + 'x' + g.worldH
  const hit = _roadMemo.get(key)
  if (hit) return hit
  const set = new Set()
  for (const { path } of routedPathsOf(g))
    for (const [x, y] of path) { set.add(x + ',' + y); set.add((x + 1) + ',' + y) }
  // the causeway is still a drawn line: it crosses open sea, where no
  // router can go, on decking that exists because we say it does.
  for (const [a, b, tag] of roadSegsOf(g)) {
    if (tag !== CAUSEWAY_TAG) continue
    const vx = b.x - a.x, vy = b.y - a.y
    const L = Math.sqrt(vx * vx + vy * vy)
    if (L < 1) continue
    const steps = Math.ceil(L * 2)
    for (let stp = 0; stp <= steps; stp++) {
      const t = stp / steps
      const px = Math.round(a.x + vx * t), py = Math.round(a.y + vy * t)
      set.add(px + ',' + py); set.add((px + 1) + ',' + py)
    }
  }
  _roadMemo.set(key, set)
  return set
}
// Where a routed road actually TURNS. v3 guessed at bends from the meander
// it had drawn; these are real corners, and a corner is where a traveller
// looks up, so it is where the waymarks go.
export function roadBendsOf(g) {
  const out = []
  for (const { path } of routedPathsOf(g)) {
    if (path.length < 12) continue
    let lastDx = 0, lastDy = 0, sinceBend = 99
    for (let i = 4; i < path.length - 4; i++) {
      const dx = Math.sign(path[i + 3][0] - path[i - 3][0])
      const dy = Math.sign(path[i + 3][1] - path[i - 3][1])
      sinceBend++
      if ((dx !== lastDx || dy !== lastDy) && sinceBend > 14) {
        out.push({ x: path[i][0], y: path[i][1] })
        sinceBend = 0
      }
      lastDx = dx; lastDy = dy
    }
  }
  return out
}
export const onRoad = (g, x, y) => roadTilesOf(g).has(x + ',' + y)
// a road crosses water only at a bridge, at the causeway, or on a town's
// own main street. Making crossings scarce is the whole point -- but the
// first draft made them scarce enough to strand Shrine Isle, whose causeway
// IS a crossing and was being treated as ordinary road over open sea. A
// scarcity rule has to know its own exceptions.
const _cwMemo = new Map()
export function causewayTilesOf(g) {
  const k = g.genesisSeed + ':' + g.worldW + 'x' + g.worldH
  const hit = _cwMemo.get(k)
  if (hit) return hit
  const set = new Set()
  for (const [a, b, tag] of roadSegsOf(g)) {
    if (tag !== CAUSEWAY_TAG) continue
    const vx = b.x - a.x, vy = b.y - a.y
    const L = Math.sqrt(vx * vx + vy * vy)
    if (L < 1) continue
    const nx = -vy / L, ny = vx / L
    const steps = Math.ceil(L * 2)
    for (let stp = 0; stp <= steps; stp++) {
      const t = stp / steps
      const taper = Math.min(1, Math.min(t, 1 - t) * 6)
      const o = meander(g, tag, t * L, 26, 8) * taper
      const px = Math.round(a.x + vx * t + nx * o)
      const py = Math.round(a.y + vy * t + ny * o)
      // the causeway is two tiles wide and forgives a tile either side, so
      // a walker never falls off a rounding error into the sea
      for (let ex = -1; ex <= 2; ex++) for (let ey = -1; ey <= 1; ey++) set.add((px + ex) + ',' + (py + ey))
    }
  }
  _cwMemo.set(k, set)
  return set
}
// ---------- how far the nearest road is, from anywhere ----------
// A plain four-neighbour flood from every road tile. Furniture consults it
// so that the country fills from the routes outward rather than uniformly,
// and the quiet quarters consult it so they can only ever seat themselves
// somewhere no road goes.
const _roadDistMemo = new Map()
export function roadDistOf(g) {
  const memoKey = g.genesisSeed + ':' + g.worldW + 'x' + g.worldH
  const hit = _roadDistMemo.get(memoKey)
  if (hit) return hit
  const W = g.worldW, H = g.worldH
  const d = new Int32Array(W * H).fill(-1)
  const q = new Int32Array(W * H)
  let qh = 0, qt = 0
  for (const k of roadTilesOf(g)) {
    const c = k.indexOf(',')
    const x = +k.slice(0, c), y = +k.slice(c + 1)
    if (x < 0 || y < 0 || x >= W || y >= H) continue
    const i = y * W + x
    if (d[i] === -1) { d[i] = 0; q[qt++] = i }
  }
  while (qh < qt) {
    const i = q[qh++], x = i % W, y = (i / W) | 0, nd = d[i] + 1
    if (x > 0     && d[i - 1] === -1) { d[i - 1] = nd; q[qt++] = i - 1 }
    if (x < W - 1 && d[i + 1] === -1) { d[i + 1] = nd; q[qt++] = i + 1 }
    if (y > 0     && d[i - W] === -1) { d[i - W] = nd; q[qt++] = i - W }
    if (y < H - 1 && d[i + W] === -1) { d[i + W] = nd; q[qt++] = i + W }
  }
  _roadDistMemo.set(memoKey, d)
  return d
}
export const roadDistAt = (g, x, y) => {
  if (x < 0 || y < 0 || x >= g.worldW || y >= g.worldH) return 1 << 20
  const v = roadDistOf(g)[y * g.worldW + x]
  return v < 0 ? (1 << 20) : v
}

// ---------- the quiet quarters ----------
// Six tracts that hold no furniture at all. Each is seeded only where the
// nearest road is forty tiles away or more, so they land in backcountry by
// construction rather than by luck, and each is large enough to be crossed
// rather than skirted. This is the only thing in either founding that adds
// emptiness ON PURPOSE.
export const QUIET_N = 10
export const QUIET_MIN_ROAD = 45
export const QUIET_TOWN_CLEAR = 34   // no quarter may swallow a settlement
const _quietMemo = new Map()
export function quietQuartersOf(g) {
  const memoKey = g.genesisSeed + ':' + g.worldW + 'x' + g.worldH
  const hit = _quietMemo.get(memoKey)
  if (hit) return hit
  const W = g.worldW, H = g.worldH, out = []
  const towns = settlementsOf(g)
  for (let n = 0; n < QUIET_N; n++) {
    for (let att = 0; att < 6000; att++) {
      const h = thash(g, n * 7919 + 13, att, 7717)
      const x = 3 + (h % (W - 6)), y = 3 + (((h >>> 11) % (H - 6)))
      if (isWater(g, x, y) || biomeAt(g, x, y) === 'sea') continue
      if (roadDistAt(g, x, y) < QUIET_MIN_ROAD) continue
      const r = 30 + (thash(g, n, att, 331) % 29)      // 30 to 58 tiles across
      // A quarter that swallows a town is not a quiet quarter, it is a bug.
      // The first draft tested only its CENTRE against the road field, and
      // one 42-tile disc closed over Fenmarch: 143 built things inside
      // somewhere named for having none.
      let bad = false
      for (const t of towns) {
        const dx = t.x - x, dy = t.y - y
        if (Math.sqrt(dx * dx + dy * dy) < r + QUIET_TOWN_CLEAR) { bad = true; break }
      }
      if (bad) continue
      // and the whole disc has to be backcountry, not just its middle: eight
      // points on the rim, each of which must still be well off any road.
      for (const [dx, dy] of [[r,0],[-r,0],[0,r],[0,-r],
                              [Math.round(r*0.7),Math.round(r*0.7)],[Math.round(r*0.7),-Math.round(r*0.7)],
                              [-Math.round(r*0.7),Math.round(r*0.7)],[-Math.round(r*0.7),-Math.round(r*0.7)]]) {
        if (roadDistAt(g, x + dx, y + dy) < 12) { bad = true; break }
      }
      if (bad) continue
      let clash = false
      for (const o of out) {
        const dx = o.x - x, dy = o.y - y
        if (Math.sqrt(dx * dx + dy * dy) < o.r + r + 8) { clash = true; break }
      }
      if (clash) continue
      out.push({ tag: 'quiet-' + n, x, y, r, country: biomeAt(g, x, y) })
      break
    }
  }
  _quietMemo.set(memoKey, out)
  return out
}

// What a quiet quarter is NOT allowed to clear away. Everything in this list
// was placed on purpose by a hand rather than by a count, and a tract that
// happens to close over the Wreck should lose the argument.
export const QUIET_KEEPS = [
  'cape-', 'capesign-', 'place-', 'placesign-', 'wreck', 'tally-', 'oldoak',
  'eldertree', 'sentinel', 'barrowcrown', 'ring-', 'dragonsign-', 'milestone-',
  'drownedbell', 'drowned-bell', 'longbarrow', 'moorcairn', 'mill-', 'brmark-',
  'shrine-stone-', 'siege-', 'cave-', 'ruin-', 'plan-',
]
export function inQuietQuarter(g, x, y) {
  for (const q of quietQuartersOf(g)) {
    const dx = x - q.x, dy = y - q.y
    if (dx * dx + dy * dy < q.r * q.r) return true
  }
  return false
}

export function fordAt(g, x, y) {
  if (onBridge(g, x, y)) return true // the bridge deck itself is walkable
  if (causewayTilesOf(g).has(x + ',' + y)) return true
  if (quayTilesOf(g).has(x + ',' + y)) return true // the piers are decking
  for (const s of settlementsOf(g)) {
    const r = rectOf(s)
    if (x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1 && (x === s.x || y === s.y)) return true
  }
  return false
}
const _blockedCache = new Map()
export function blockedAt(g, x, y) {
  if (x < 0 || y < 0 || x >= g.worldW || y >= g.worldH) return true
  const ck = g.genesisSeed + ':' + g.worldW + 'x' + g.worldH
  let arr = _blockedCache.get(ck)
  if (!arr) { arr = new Uint8Array(g.worldW * g.worldH); _blockedCache.set(ck, arr) }
  const i = y * g.worldW + x
  const hit = arr[i]
  if (hit) return hit === 2
  let b = false
  if (isWater(g, x, y) && !fordAt(g, x, y)) b = true
  else if (onRidge(g, x, y) && !onRoad(g, x, y)) b = true
  else if (onBarrow(g, x, y) && !onRoad(g, x, y)) b = true
  arr[i] = b ? 2 : 1
  return b
}

const KEEPER_NAMES = ['Maud', 'Aldric', 'Bess', 'Corwin', 'Delia', 'Edmund', 'Ffion', 'Gareth',
  'Hild', 'Ivo', 'Joan', 'Kemp', 'Lettice', 'Miles', 'Nell', 'Osric', 'Peronel', 'Quill',
  'Rosamund', 'Sim', 'Tilda', 'Ulric', 'Verity', 'Wat', 'Ysolt', 'Zachary']
// Does a thing get a companion beside it, and where does the companion
// stand? v4 answered "always" and "(+1,+1)". Both answers are now hashed,
// which is the whole of the fix: a habit is only a fingerprint while it is
// invariant.
const COMPANION_OFFSETS = [
  [2, 0], [0, 2], [-2, 1], [1, -2], [3, 1], [-1, 3], [2, -2], [-3, -1], [1, 2], [-2, -2],
]
export function companion(g, x, y, salt) {
  const h = thash(g, x, y, salt)
  const want = (h % 100) < 55                       // a little over half
  const o = COMPANION_OFFSETS[(h >>> 9) % COMPANION_OFFSETS.length]
  return [o[0], o[1], want]
}

export function keeperName(tag, role) {
  if (role === 'wizard') return 'Oberon'
  const h = E.sha256('keeper|' + tag + '|' + role)
  return KEEPER_NAMES[h[0] % KEEPER_NAMES.length]
}

// THE INN NEEDS ITS WHOLE FOOTPRINT.
//
// The old seat checked five tiles and then a seven-by-five room was laid over
// whatever happened to be there, so walls were skipped wherever a tile was
// taken and the inn came out with holes in it. Ask for every tile the
// building will occupy, and one clear tile outside the door.
const _innSeatCache = new WeakMap()
export function innSeat(g) {
  if (_innSeatCache.has(g)) return _innSeatCache.get(g)
  const W2 = g.worldW, H2 = g.worldH
  let got = null
  const okTile = (x, y) => !blockedAt(g, x, y) && !isWater(g, x, y)
  seekI: for (let rad = 0; rad < 90 && !got; rad++)
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
      const x = Math.round(W2 * 0.55) + dx, y = Math.round(H2 * 0.44) + dy
      const b = biomeAt(g, x, y)
      if (b !== 'heartlands' && b !== 'downs') continue
      // A WAYSIDE INN IS NOT IN A TOWN.
      //
      // The seat asked only for 'beside a road', and Anchor is full of
      // roads -- so the Lantern was being built inside the capital, on top
      // of the plan, where every tile was already taken and not one wall
      // could be laid. An inn on the road between places is the entire
      // point of it: you stop there because there is nowhere else.
      let inTown = false
      for (const t of settlementsOf(g)) {
        const r = rectOf(t)
        if (x > r.x0 - 12 && x < r.x1 + 12 && y > r.y0 - 12 && y < r.y1 + 12) { inTown = true; break }
      }
      if (inTown) continue
      if (onRoad(g, x, y)) continue
      // the whole footprint must be clear AND clear of the road: a lane
      // running through the east wall leaves the room with a hole in it,
      // which is not a room, it is a ruin with a keeper in it
      let all = true
      for (let yy = -1; yy <= 3 && all; yy++) for (let xx = -3; xx <= 3; xx++) {
        const px = x + xx, py = y + yy
        if (!okTile(px, py) || onRoad(g, px, py)) { all = false; break }
      }
      if (!all || !okTile(x, y + 4)) continue
      // and a road must pass CLOSE BY, just outside the walls. Asking the
      // centre tile to be beside a road while demanding the footprint be
      // clear of roads is a contradiction -- the neighbour it wants IS in
      // the footprint -- and it found no seat at all.
      let onTheWay = false
      for (let yy = -3; yy <= 6 && !onTheWay; yy++) for (let xx = -6; xx <= 6; xx++) {
        if (yy >= -1 && yy <= 3 && xx >= -3 && xx <= 3) continue   // inside: must stay clear
        if (onRoad(g, x + xx, y + yy)) { onTheWay = true; break }
      }
      if (!onTheWay) continue
      got = { x, y }; break seekI
    }
  _innSeatCache.set(g, got)
  return got
}
export function loneRooms(g) {
  const s = innSeat(g)
  return s ? [[s.x - 2, s.y, 5, 3]] : []      // the Lantern's interior
}
export function groundKindAt(g, x, y) {
  for (const [rx, ry, rw, rh] of loneRooms(g))
    if (x >= rx && y >= ry && x < rx + rw && y < ry + rh) return 'floor'
  if (isWater(g, x, y)) return null
  const sts = settlementsOf(g)
  for (const st of sts) {
    const r = rectOf(st)
    if (x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1) {
      // INDOORS? The drawing knows. A ',' is a room's floor, and it should
      // not look like the street it opens onto.
      const rows = PLANS[st.tag]
      if (rows) {
        const pw = rows[0].length, ph = rows.length
        const rx = x - (st.x - (pw >> 1)), ry = y - (st.y - (ph >> 1))
        // enclosure, not the character: a booth, a hearth and the clerk all
        // stand on the same floor as the empty tile beside them
        if (isIndoor(st.tag, rows, rx, ry)) return 'floor'
      }
      // NOT EVERY TOWN IS PAVED. A farm is not a market: Hollybarrow works
      // the ground it stands on and Greenhollow is a clearing in a wood, so
      // outside their buildings the country simply carries on. Paving them
      // was most of why every town underfoot looked the same.
      if (st.tag === 'hollybarrow' || st.tag === 'greenhollow')
        return onRoad(g, x, y) ? 'trail' : null
      return onRoad(g, x, y) ? 'cobble' : 'flag'
    }
  }
  if (onRoad(g, x, y)) {
    for (const st of sts) if (Math.max(Math.abs(x - st.x), Math.abs(y - st.y)) <= 20) return 'cobble'
    if (onRidge(g, x - 1, y) || onRidge(g, x + 1, y) || onBarrow(g, x, y)) return 'gravel'
    // THE ROAD TAKES ITS COUNTRY'S COLOUR. The first draft knew only two
    // answers -- gravel in the Crags, trail everywhere else -- so four of
    // the seven countries were walked on identical ground and the Moor's
    // entire road network, forty-six tiles of it, was one texture. A road
    // is made of whatever is under it; that is why you can tell where you
    // are with your eyes down.
    //
    // Free to change, now and forever: groundKindAt is NOT in the
    // geography hash (only blockedAt and biomeAt are), so surfaces can be
    // retuned after the founding without forking the world. The one thing
    // that must not move is 'sand', which seats the Wreck.
    switch (biomeAt(g, x, y)) {
      case 'crags': return 'gravel'
      case 'downs': return 'chalk'   // white ruts cut through thin turf
      case 'moor':  return 'peat'    // dark, wet, and always a little sunken
      case 'fens':  return 'causey'  // a raised way of stone and timber
      default:      return 'trail'
    }
  }
  if (isWater(g, x + 1, y) || isWater(g, x - 1, y) || isWater(g, x, y + 1) || isWater(g, x, y - 1)) return 'sand'
  return null
}

// WHERE A SOUL ARRIVES.
//
// This used to be "the world's centre, or the nearest tile that is not water
// or rock". That was fine while Anchor sat at a fixed offset from the
// centre; now the capital seats itself against the terrain, and on
// solo-world the centre landed inside one of its walls. spawnDry only ever
// consulted the TERRAIN -- blockedAt and isWater -- and a wall is a node,
// not terrain, so nothing objected.
//
// A citizen should arrive on Anchor's own open ground. The plan already
// says which tiles those are: '.' and '@' are reserved lanes and plaza, and
// nothing is ever placed on them. So ask the drawing.
export function spawnDry(g) {
  const a = settlementsOf(g).find(s => s.tag === 'anchor')
  if (a && PLANS.anchor) {
    const rows = PLANS.anchor, pw = rows[0].length, ph = rows.length
    const x0 = a.x - (pw >> 1), y0 = a.y - (ph >> 1)
    const openHere = (x, y) => {
      const rx = x - x0, ry = y - y0
      if (rx < 0 || ry < 0 || rx >= pw || ry >= ph) return false
      const ch = rows[ry][rx]
      if (ch !== '.' && ch !== '@') return false
      return !isWater(g, x, y) && !onRidge(g, x, y) && !onBarrow(g, x, y)
    }
    for (let rad = 0; rad < Math.max(pw, ph); rad++)
      for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
        if (openHere(a.x + dx, a.y + dy)) return { x: a.x + dx, y: a.y + dy }
      }
  }
  // the capital refused every tile of its own plaza: fall back to the old
  // rule rather than fail a founding
  const cx = Math.floor(g.worldW / 2), cy = Math.floor(g.worldH / 2)
  if (!blockedAt(g, cx, cy) && !isWater(g, cx, cy)) return { x: cx, y: cy }
  for (let r = 1; r < 128; r++)
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue
      const x = cx + dx, y = cy + dy
      if (x < 2 || y < 2 || x >= g.worldW - 2 || y >= g.worldH - 2) continue
      if (!isWater(g, x, y) && !blockedAt(g, x, y)) return { x, y }
    }
  return { x: cx, y: cy }
}

let _probing = false
const _geoMemo = new Map()
function geographyHashE5(g0) {
  const memoKey = g0.genesisSeed + '|' + g0.worldW + 'x' + g0.worldH
  if (_geoMemo.has(memoKey)) return _geoMemo.get(memoKey)
  if (_probing) return '0'.repeat(64)
  _probing = true
  try {
    const w = buildWorld(g0)
    const nodeSig = Object.entries(w.nodes)
      .map(([id, n]) => id + ':' + n.type + ':' + (n.kind ?? '') + ':' + n.x + ',' + n.y)
      .sort().join('|')
    // EVERY TILE, and the ground it is made of.
    //
    // v3 sampled the terrain at stride 4 and this inherited it, which meant
    // 28,672 of 458,752 tiles were covered: SIX PER CENT. blockedAt is
    // consensus-critical -- validInput consults it on every single move --
    // so two nodes could disagree about walkability across 94% of the island
    // and still shake hands on an identical geography hash. Node positions
    // caught most of it by accident, because a node shifts when the ground
    // under it does; an empty field with no node near it caught nothing.
    // A world's identity should not be a spot check.
    //
    // groundKindAt is hashed too. It is cosmetic TODAY -- the engine does
    // not read it and no rule depends on it -- and I argued from that it
    // could stay out and stay editable forever. That was backwards. It is
    // part of what the generator DRAWS, §9c says a generator name means one
    // landscape forever, and "free to change" is indistinguishable from
    // "two nodes can quietly disagree". It also disarms a real trap: the day
    // some rule says a fire needs dry ground, or gravel slows a cart, an
    // unhashed surface becomes consensus-critical without anyone noticing.
    //
    // Costs about two seconds, once, at founding. Cheap for an identity.
    const terr = []
    for (let y = 0; y < g0.worldH; y++)
      for (let x = 0; x < g0.worldW; x++) {
        terr.push(blockedAt(g0, x, y) ? '#' : biomeAt(g0, x, y)[0])
        terr.push(groundKindAt(g0, x, y)?.[0] ?? '-')
      }
    const h = E.sha256(Buffer.from('EXPANSE5-GEO-V1\n' + nodeSig + '\n' + terr.join(''))).toString('hex')
    _geoMemo.set(memoKey, h)
    return h
  } finally { _probing = false }
}

E.registerTerrain(GENERATOR_ID, {
  blocked: (g, x, y) => blockedAt(g, x, y),
  spawn: (g) => spawnDry(g),
  country: (g, x, y) => biomeAt(g, x, y),
  geographyHash: (g) => geographyHashE5(g),
  _isProbing: () => _probing,
})

const FOUNDER_KEY = '9e18ba7bc57d23737fefd36223acf7c173bbd26ffc3355d177f0a5fedfb220af'

export function makeExpanse5Genesis(genesisSeed, rulesHash, anchorMs = 0, W = 896, H = 512) {
  const g = E.makeGenesis(genesisSeed, rulesHash, anchorMs, W, H)
  g.worldGenerator = GENERATOR_ID
  const cx = Math.floor(W / 2), cy = Math.floor(H / 2)
  const nw = settlementsOf(g).find(s => s.tag === 'norwick')
  g.geo = {
    // Anchor's OWN rect. This was cx +/- 22 -- the canvas centre -- which
    // stopped being the capital the moment the capital started seating
    // itself. The city's laws would have applied to a patch of field beside
    // it, and not to half the city.
    city:    (() => { const a = settlementsOf(g).find(s => s.tag === 'anchor')
               return { x0: a.x - (a.w >> 1), x1: a.x + (a.w >> 1),
                        y0: a.y - (a.h >> 1), y1: a.y + (a.h >> 1) } })(),
    wilds:   { x0: 1, x1: BRAND_X(g), y0: 1, y1: H - 2 },
    norwick: { x0: nw.x - 12, x1: nw.x + 12, y0: nw.y - 9, y1: nw.y + 9 },
  }
  g.watch = { level: 60, kindleLogs: 10, perLog: 420, cap: 12600, xpPerLog: 200, burnXp: 1, maxOwned: 4, decayTicks: 432000 }
  if (g.founderKey === undefined) g.founderKey = FOUNDER_KEY
  g.geographyHash = '0'.repeat(64)
  if (!_probing) g.geographyHash = geographyHashE5(g)
  g.survey = { k: 16, base: 40, perTile: 4, max: 1600 }
  return g
}

// ---------- the founding ----------
export function buildWorld(genesis) {
  const gerr = E.validateGenesis(genesis)
  if (gerr) throw new Error('refusing to build a world from an invalid genesis: ' + gerr)
  if (genesis.worldGenerator !== GENERATOR_ID)
    throw new Error(`this genesis names generator ${JSON.stringify(genesis.worldGenerator)}; this node implements ${GENERATOR_ID}`)
  if (genesis.worldW < WORLDGEN_MIN.w || genesis.worldH < WORLDGEN_MIN.h)
    throw new Error(`the fourth expanse requires at least ${WORLDGEN_MIN.w}x${WORLDGEN_MIN.h}`)

  const g = genesis, W = g.worldW, H = g.worldH
  const w = E.newWorld(g)
  const taken = new Set()
  const key = (x, y) => x + ',' + y
  let putCount = 0
  const put = (id, type, x, y, extra) => { taken.add(key(x, y)); putCount++; E.addNode(w, id, type, x, y, extra) }
  const inB = (x, y) => x >= 1 && y >= 1 && x < W - 1 && y < H - 1
  const ss = settlementsOf(g)
  const inAnySettlement = (x, y) => ss.some(s => {
    const r = rectOf(s)
    return x >= r.x0 - 2 && x <= r.x1 + 2 && y >= r.y0 - 2 && y <= r.y1 + 2
  })
  const free = (x, y) => inB(x, y) && !taken.has(key(x, y)) && !isWater(g, x, y)
    && !onRidge(g, x, y) && !onBarrow(g, x, y) && !onRoad(g, x, y) && !fordAt(g, x, y) && !inAnySettlement(x, y)

  const _spawn0 = spawnDry(g)
  const _main = new Set([_spawn0.x + ',' + _spawn0.y])
  {
    const walk = (x, y) => x >= 0 && y >= 0 && x < W && y < H && !blockedAt(g, x, y)
    const mq = [[_spawn0.x, _spawn0.y]]; let mh = 0
    while (mh < mq.length) { const [x, y] = mq[mh++]; for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx=x+dx, ny=y+dy, kk=nx+','+ny; if (!_main.has(kk) && walk(nx, ny)) { _main.add(kk); mq.push([nx, ny]) } } }
  }
  const reachableToGather = (x, y) => {
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) if (_main.has((x+dx)+','+(y+dy))) return true
    return false
  }
  const H32 = (tag, i) => E.sha256(Buffer.from(g.genesisSeed + ':' + tag + ':' + i))

  // ================= TOWNS THAT ARE LAID OUT =================
  // A town is: a wall with a named gate, two street lanes crossing at a
  // plaza, and BUILDINGS -- rectangles of wall with a door -- rather than
  // single-tile "house" pixels. You can stand in a doorway. You can walk a
  // back lane. That is the whole difference between a settlement and a
  // place, and it costs no new node type and no engine change.
  let bldN = 0
  // the loader's view of the world, so a drawing can place nodes without
  // knowing anything about how this generator keeps its books
  const planCtx = {
    g, E, w, taken, key, inB, isWater,
    reserve: (x, y) => { if (inB(x, y)) taken.add(key(x, y)) },
  }
  // A SHIRE town is a drawing (worldgen-shire.mjs). The frontier is
  // generated. That split is the whole thesis: hand-work where every
  // citizen walks a thousand times, procedure where variety is the point.
  const layDrawnTown = (s) => {
    checkPlanConnected(s.tag, PLANS[s.tag], s.x, s.y, { g, isWater, blockedAt })
    layPlan(planCtx, s.tag, PLANS[s.tag], s.x, s.y, 'plan-' + s.tag,
      { nameKeeper: (k) => keeperName(k, 'plan') })
    // the sign is the one thing the drawing cannot carry: its text
    const r = rectOf(s)
    for (let rad = 1; rad <= 6 && true; rad++) {
      let done = false
      for (let dy = -rad; dy <= rad && !done; dy++) for (let dx = -rad; dx <= rad; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
        const x = s.x + dx, y = s.y + 3 + dy
        if (!inB(x, y) || taken.has(key(x, y)) || isWater(g, x, y)) continue
        if (x <= r.x0 || x >= r.x1 || y <= r.y0 || y >= r.y1) continue
        put('sign-' + s.tag, 'signpost', x, y,
          { text: s.kind === 'capital' ? 'Anchor, on Tallyholm' : s.name })
        done = true; break
      }
      if (done) break
    }
  }
  const layTown = (s) => {
    const r = rectOf(s)
    const openTile = (x, y) => isWater(g, x, y) || onRoad(g, x, y)
    // -- the wall, with gates on each axis at the town's spine --
    let wi = 0
    const gate = (x, y) => (Math.abs(x - s.x) <= 1 || Math.abs(y - s.y) <= 1)
    for (let x = r.x0; x <= r.x1; x++) for (const y of [r.y0, r.y1]) {
      if (gate(x, y)) continue
      if (inB(x, y) && !openTile(x, y)) put('wall-' + s.tag + '-' + (wi++), 'wall', x, y)
    }
    for (let y = r.y0 + 1; y < r.y1; y++) for (const x of [r.x0, r.x1]) {
      if (gate(x, y)) continue
      if (inB(x, y) && !openTile(x, y)) put('wall-' + s.tag + '-' + (wi++), 'wall', x, y)
    }
    // -- the streets: the spine cross stays clear, forever --
    const street = new Set()
    for (let x = r.x0; x <= r.x1; x++) { street.add(key(x, s.y)); street.add(key(x, s.y - 1)) }
    for (let y = r.y0; y <= r.y1; y++) { street.add(key(s.x, y)); street.add(key(s.x + 1, y)) }
    // -- the plaza: a clear block at the crossing --
    for (let dy = -2; dy <= 2; dy++) for (let dx = -3; dx <= 3; dx++) street.add(key(s.x + dx, s.y + dy))
    const sp0 = spawnDry(g)
    const clear = (x, y) => inB(x, y) && !taken.has(key(x, y)) && !isWater(g, x, y)
      && !(x === sp0.x && y === sp0.y) && x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1
    // -- a BUILDING: a wall rect with one door, furniture inside --
    const building = (bx, by, bw, bh, doorSide, fill) => {
      for (let y = by; y < by + bh; y++) for (let x = bx; x < bx + bw; x++)
        if (!clear(x, y) || street.has(key(x, y))) return false
      const id = 'b' + (bldN++)
      let di = 0
      for (let y = by; y < by + bh; y++) for (let x = bx; x < bx + bw; x++) {
        const edge = x === bx || x === bx + bw - 1 || y === by || y === by + bh - 1
        if (!edge) continue
        const isDoor =
          (doorSide === 's' && y === by + bh - 1 && x === bx + (bw >> 1)) ||
          (doorSide === 'n' && y === by && x === bx + (bw >> 1)) ||
          (doorSide === 'w' && x === bx && y === by + (bh >> 1)) ||
          (doorSide === 'e' && x === bx + bw - 1 && y === by + (bh >> 1))
        if (isDoor) continue
        put(id + '-w' + (di++), 'wall', x, y)
      }
      // the room inside
      let fi = 0
      for (const [ox, oy, type, extra] of (fill ?? [])) {
        const x = bx + 1 + ox, y = by + 1 + oy
        if (x < bx + bw - 1 && y < by + bh - 1 && !taken.has(key(x, y)))
          put(id + '-f' + (fi++) + '-' + type, type, x, y, extra)
      }
      return true
    }
    // seat a building by ring search from a nominal offset
    const seatBuilding = (dx, dy, bw, bh, doorSide, fill) => {
      for (let rad = 0; rad <= 10; rad++)
        for (let ody = -rad; ody <= rad; ody++) for (let odx = -rad; odx <= rad; odx++) {
          if (Math.max(Math.abs(odx), Math.abs(ody)) !== rad) continue
          if (building(s.x + dx + odx, s.y + dy + ody, bw, bh, doorSide, fill)) return true
        }
      return false
    }
    const placeNear = (id, type, dx, dy, extra) => {
      for (let rad = 0; rad <= 8; rad++) for (let ody = -rad; ody <= rad; ody++) for (let odx = -rad; odx <= rad; odx++) {
        if (Math.max(Math.abs(odx), Math.abs(ody)) !== rad) continue
        const x = s.x + dx + odx, y = s.y + dy + ody
        if (!clear(x, y)) continue
        let waterSides = 0
        for (const [wx, wy] of [[1,0],[-1,0],[0,1],[0,-1]]) if (isWater(g, x + wx, y + wy)) waterSides++
        if (waterSides >= 2) continue
        put(id, type, x, y, extra); return true
      }
      return false
    }
    // -- the plaza furniture: the well, the sign, the hearth --
    placeNear('well-' + s.tag, 'well', -2, 1)
    placeNear('hearth-' + s.tag, 'campfire', 2, 1)
    placeNear('sign-' + s.tag, 'signpost', 0, 3,
      { text: s.kind === 'capital' ? 'Anchor, on Tallyholm' : s.name })
    // -- the gate guards: a gate you pass THROUGH, watched --
    let gi = 0
    for (const [dx, dy] of [[-1, r.y0 - s.y + 1], [2, r.y1 - s.y - 1]]) {
      placeNear('gateguard-' + s.tag + (gi++), 'guard', dx, dy)
    }
    // -- the banks. The capital gets TWO, deliberately far apart: that one
    //    decision invents a north quarter and a south quarter for free.
    const bankFill = (t) => [[0, 0, 'bank'], [1, 0, 'keeper']]
    if (s.kind === 'capital') {
      seatBuilding(-14, -8, 6, 5, 's', bankFill())
      seatBuilding(9, 5, 6, 5, 'n', bankFill())
      seatBuilding(-6, -9, 7, 5, 's', [[0, 0, 'store'], [1, 0, 'keeper'], [3, 0, 'store']])
      seatBuilding(4, -9, 6, 5, 's', [[0, 0, 'anvil'], [1, 0, 'smith'], [2, 0, 'anvil']])
      seatBuilding(-16, 4, 6, 5, 'n', [[0, 0, 'store'], [1, 0, 'keeper']])
      // the keep: the biggest room on the island
      seatBuilding(-4, 6, 9, 7, 'n', [[1, 1, 'campfire'], [3, 1, 'guard'], [5, 1, 'guard']])
      for (let k = 0; k < 5; k++) seatBuilding(-18 + k * 8, 10, 4, 4, 'n', [[0, 0, 'house']])
      for (let k = 0; k < 4; k++) seatBuilding(-18 + k * 9, -12, 4, 4, 's', [[0, 0, 'house']])
    } else {
      seatBuilding(-7, -5, 6, 5, 's', bankFill())
      if (s.kind === 'forge' || s.kind === 'garrison' || s.kind === 'mill')
        seatBuilding(4, -5, 6, 5, 's', [[0, 0, 'anvil'], [1, 0, 'smith']])
      if (s.kind === 'port' || s.kind === 'timber' || s.kind === 'market' || s.kind === 'mill' || s.kind === 'farm')
        seatBuilding(4, 4, 6, 5, 'n', [[0, 0, 'store'], [1, 0, 'keeper']])
      if (s.kind === 'garrison') seatBuilding(-8, 4, 7, 6, 'n', [[1, 1, 'guard'], [3, 1, 'guard'], [2, 2, 'campfire']])
      for (let k = 0; k < 3; k++) seatBuilding(-9 + k * 7, 6, 4, 4, 'n', [[0, 0, 'house']])
      for (let k = 0; k < 2; k++) seatBuilding(-5 + k * 8, -8, 4, 4, 's', [[0, 0, 'house']])
    }
    // the streets are RESERVED: no later scatter may seal a lane
    for (const k of street) taken.add(k)
  }
  for (const s of ss) {
    if ((s.ring === 'shire' || s.drawn) && PLANS[s.tag]) layDrawnTown(s)
    else layTown(s)
  }

  // ---- the shire's named places: authored, not derived ----
  // Ten small sights inside a two-minute walk of the capital. Not one of
  // them falls out of a rule, which is exactly why a citizen's first week
  // is spent finding things instead of crossing grass.
  let placeN = 0
  {
    const acx = Math.floor(W / 2), acy = Math.floor(H / 2)
    for (const pl of PLACES) {
      const d = validatePlan(pl.tag, pl.art)
      const nx0 = acx + pl.dx, ny0 = acy + pl.dy
      const fits = (x, y) => {
        for (let ry = 0; ry < d.h; ry++) for (let rx = 0; rx < d.w; rx++) {
          const ch = pl.art[ry][rx]
          if (ch === ' ') continue
          const tx = x - (d.w >> 1) + rx, ty = y - (d.h >> 1) + ry
          if (!free(tx, ty)) return false
        }
        if (pl.on === 'road') {
          let touches = false
          for (let rr = -3; rr <= 3 && !touches; rr++) for (let cc = -3; cc <= 3; cc++)
            if (onRoad(g, x + cc, y + rr)) { touches = true; break }
          if (!touches) return false
        }
        return true
      }
      let sx = -1, sy = -1
      seekPl: for (let rad = 0; rad < 26; rad++)
        for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
          if (fits(nx0 + dx, ny0 + dy)) { sx = nx0 + dx; sy = ny0 + dy; break seekPl }
        }
      if (sx < 0) continue // the land refused it; a place may fail, quietly
      layPlan(planCtx, pl.tag, pl.art, sx, sy, 'place-' + pl.tag,
        { landmarkKind: pl.kind, nameKeeper: (k) => keeperName(k, 'place') })
      // every named place carries its name, so the chart can print it and
      // a traveller can read where they are
      for (const [dx, dy] of [[0, (d.h >> 1) + 1], [(d.w >> 1) + 1, 0], [0, -(d.h >> 1) - 1], [-(d.w >> 1) - 1, 0]]) {
        const x = sx + dx, y = sy + dy
        if (free(x, y)) { put('placesign-' + pl.tag, 'signpost', x, y, { text: pl.name }); break }
      }
      placeN++
    }
  }

  // ---- the capes, marked ----
  // Every cape carries a mark on its tip and a sign beside it, so the
  // island's outline is something a citizen has stood on rather than only
  // seen drawn. A shape you have walked to the end of is a shape you keep.
  let capeN = 0
  for (const t of capeTipsOf(g)) {
    let seated = false
    for (let rad = 0; rad < 14 && !seated; rad++)
      for (let dy = -rad; dy <= rad && !seated; dy++) for (let dx = -rad; dx <= rad; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
        if (!free(t.x + dx, t.y + dy)) continue
        put('cape-' + t.tag, 'landmark', t.x + dx, t.y + dy, { kind: t.mark })
        for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1], [0, 2], [2, 0]]) {
          const px = t.x + dx + sx, py = t.y + dy + sy
          if (free(px, py)) { put('capesign-' + t.tag, 'signpost', px, py, { text: t.name }); break }
        }
        seated = true; capeN++; break
      }
  }

  // ---- the locales, signed ----
  // A name nobody can read is not a name. Each locale gets a marker post
  // near its heart, so "up on Bleakfell" is something a traveller can
  // learn by walking rather than by being told.
  let locN = 0
  for (const L of localesOf(g)) {
    let seated = false
    for (let rad = 0; rad < 44 && !seated; rad++)
      for (let dy = -rad; dy <= rad && !seated; dy++) for (let dx = -rad; dx <= rad; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
        const x = L.x + dx, y = L.y + dy
        if (!free(x, y)) continue
        put('locale-' + L.tag, 'signpost', x, y, { text: L.name })
        seated = true; locN++; break
      }
  }

  // ---- the Brandline stones ----
  let br = 0
  for (let y = 4; y < H - 4; y += 14) {
    const x = brandX(g, y)
    if (free(x, y) && biomeAt(g, x, y) !== 'sea') { taken.add(key(x, y)); E.addNode(w, 'brandstone-' + (br++), 'wall', x, y) }
  }

  const seatLandmark = (nomX, nomY, biome, maxRad = 60) => {
    for (let rad = 0; rad < maxRad; rad++) for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
      if (free(nomX + dx, nomY + dy) && (!biome || biomeAt(g, nomX + dx, nomY + dy) === biome)) return { x: nomX + dx, y: nomY + dy }
    }
    let best = null, bd = Infinity
    for (let yy = 2; yy < H - 2; yy += 3) for (let xx = 2; xx < W - 2; xx += 3) {
      if (!free(xx, yy) || (biome && biomeAt(g, xx, yy) !== biome)) continue
      const d2 = (xx - nomX) * (xx - nomX) + (yy - nomY) * (yy - nomY)
      if (d2 < bd) { bd = d2; best = { x: xx, y: yy } }
    }
    return best ?? { x: nomX, y: nomY }
  }

  // ---- the named monuments (v3's, kept, plus the Barrow's own) ----
  {
    const p = seatLandmark(Math.round(W * 0.60), Math.round(H * 0.10), 'greenwood')
    put('oldoak', 'landmark', p.x, p.y, { kind: 'old-oak' })
    for (const [dx, dy] of [[-3, 1], [3, 1], [0, 3], [-2, -2], [2, -2]])
      if (free(p.x + dx, p.y + dy)) put('oldoak-child-' + dx + '-' + dy, 'tree', p.x + dx, p.y + dy)
  }
  { const p = seatLandmark(Math.round(W * 0.53), Math.round(H * 0.38), 'heartlands'); put('eldertree', 'landmark', p.x, p.y, { kind: 'elder-tree' }) }
  { const p = seatLandmark(Math.round(W * 0.84), Math.round(H * 0.55), 'crags');      put('sentinel', 'landmark', p.x, p.y, { kind: 'sentinel' }) }
  // A BELL THAT DROWNED BELONGS IN THE WATER. seatLandmark only asks which
  // country a thing is in, so this stood on dry fen -- a drowned bell on a
  // meadow, which says nothing at all. Walk out from the seat until the
  // water is within two tiles, and put it there.
  { let p = seatLandmark(Math.round(W * 0.56), Math.round(H * 0.86), 'fens')
    const nearWet = (x, y) => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++)
      if (isWater(g, x + dx, y + dy)) return true; return false }
    if (!nearWet(p.x, p.y)) {
      seekBell: for (let rad = 1; rad < 60; rad++)
        for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
          const x = p.x + dx, y = p.y + dy
          if (isWater(g, x, y) || blockedAt(g, x, y) || !free(x, y)) continue
          if (nearWet(x, y)) { p = { x, y }; break seekBell }
        }
    }
    put('drownedbell', 'landmark', p.x, p.y, { kind: 'drowned-bell' }) }
  { const p = seatLandmark(Math.round(W * 0.74), Math.round(H * 0.72), 'downs');      put('longbarrow', 'landmark', p.x, p.y, { kind: 'standing-stone' }) }
  { const p = seatLandmark(Math.round(W * 0.28), Math.round(H * 0.16), 'moor');       put('moorcairn', 'landmark', p.x, p.y, { kind: 'standing-stone' }) }
  {
    let wx = Math.round(W * 0.40), wy = Math.round(H * 0.90)
    seekW: for (let rad = 0; rad < 60; rad++) for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
      // SAND IS NOT THE SEA. This asked only for sand and found it inland:
      // three shipwrecks sat in the Downs, on a hill, miles from any water.
      // A wreck needs a shore -- sand AND the sea within two tiles of it.
      const cx2 = wx + dx, cy2 = wy + dy
      if (!free(cx2, cy2) || groundKindAt(g, cx2, cy2) !== 'sand') continue
      let sea = false
      for (let ay = -2; ay <= 2 && !sea; ay++) for (let ax = -2; ax <= 2; ax++)
        if (isWater(g, cx2 + ax, cy2 + ay)) { sea = true; break }
      if (sea) { wx = cx2; wy = cy2; break seekW }
    }
    put('wreck', 'landmark', wx, wy, { kind: 'shipwreck' })
  }
  { // the crown of the Barrow: the thing the roads bend around, made visible
    const c = barrowC(g)
    const p = seatLandmark(c.x, c.y - 18, null, 30)
    put('barrowcrown', 'landmark', p.x, p.y, { kind: 'sentinel' })
  }
  { // the first tally, in Anchor's plaza
    //
    // This never placed. Not once, in v4 or in the copy of v4 this file
    // began as: the world shipped with one half of a tally and nothing said
    // so. The search asked `taken.has(...)`, and `taken` is the RESERVATION
    // set -- layPlan puts every lane and every plaza tile of the capital's
    // drawing into it so no later scatter can seal a street. So all 548
    // physically empty tiles within thirteen of spawn were spoken for, the
    // loop ran to exhaustion, and there was no else-branch to notice.
    //
    // Ask the right question. A tally needs a tile with no NODE on it; a
    // reserved lane is exactly where a tally belongs, since the whole point
    // of the thing is that it stands where everyone walks. Occupancy, not
    // reservation -- and if it still fails, say so instead of shipping half
    // a pair in silence.
    const sp8 = spawnDry(g)
    const onNode = new Set()
    for (const n of Object.values(w.nodes)) onNode.add(n.x + ',' + n.y)
    const occupied = (x, y) => onNode.has(x + ',' + y)
    let seated = false
    seekT: for (let rad = 2; rad < 14; rad++) for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
      const x = sp8.x + dx, y = sp8.y + dy
      if ((x === sp8.x && y === sp8.y) || !inB(x, y) || isWater(g, x, y)) continue
      if (blockedAt(g, x, y) || occupied(x, y)) continue
      taken.add(key(x, y))
      put('tally-anchor', 'landmark', x, y, { kind: 'tally-half' })
      seated = true; break seekT
    }
    if (!seated) throw new Error('the capital refused the first tally: a founding may not ship half a pair')
  }
  { // the Ring, and Oberon
    const rx0 = Math.round(W * 0.36), ry0 = Math.round(H * 0.68)
    const ring = [[4, 0], [3, 3], [0, 4], [-3, 3], [-4, 0], [-3, -3], [0, -4], [3, -3]]
    let n = 0
    for (const [dx, dy] of ring) if (free(rx0 + dx, ry0 + dy)) put('ring-' + (n++), 'landmark', rx0 + dx, ry0 + dy, { kind: 'standing-stone' })
    seekO: for (let rad = 1; rad < 12; rad++) for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
      if (free(rx0 + dx, ry0 + dy) && free(rx0 + dx + 1, ry0 + dy)) {
        put('kpr-wizard-oberon', 'keeper', rx0 + dx, ry0 + dy, { name: 'Oberon' })
        put('oberon-hearth', 'campfire', rx0 + dx + 1, ry0 + dy)
        // WHAT HE TEACHES, CUT INTO THE STONES THEMSELVES.
        //
        // These five lines lived in window-web.html and nowhere else: one
        // HTML file's JavaScript, cycling on click. A window can be replaced;
        // the world cannot. Words that only one window knows were never part
        // of the founding at all -- and the last of them is about exactly
        // that, which made leaving it there worse than an oversight.
        //
        // They were briefly five signposts set around the Ring, which is a
        // plaque beside a megalith. The stones were here before him and he
        // intends to return the favour; a wooden board is not how that gets
        // said. So the teaching is CARVED, and the ring is the teaching.
        const TEACH = [
          '\u201cThree stones make a sigil. Three sigils make a silence.\u201d',
          '\u201cThe stones were here before me. I intend to return the favour.\u201d',
          '\u201cAnchor flees, mend endures, still denies. You cannot be made to fight.\u201d',
          '\u201cThe stilled cannot act, and cannot be struck. I said that long before your constitution did.\u201d',
          '\u201cEvery keeper on this island is named by a hash. I am not. Think about what that costs.\u201d',
        ]
        // the ring was laid above as ring-0..n; carve the first five that
        // exist, in the order they were set, so every node carves the same
        for (let tn = 0, cut = 0; tn < ring.length && cut < TEACH.length; tn++) {
          const st2 = w.nodes['ring-' + tn]
          if (!st2) continue
          st2.text = TEACH[cut++]
        }
        break seekO
      }
    }
  }
  { // the Ruined Tower, in the wilds
    let tx = Math.round(W * 0.11), ty = Math.round(H * 0.33)
    seek3: for (let rad = 0; rad < 40; rad++) for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
      if (free(tx + dx, ty + dy) && free(tx + dx + 2, ty + dy + 2) && biomeAt(g, tx + dx, ty + dy) === 'wilds') { tx += dx; ty += dy; break seek3 }
    }
    let n = 0
    for (const [dx, dy] of [[0,0],[1,0],[2,0],[0,1],[2,1],[0,2],[1,2]])
      if (free(tx + dx, ty + dy)) put('ruin-' + (n++), 'landmark', tx + dx, ty + dy, { kind: 'broken-tower' })
  }
  { // Shrine Isle
    const isle = islesOf(g)[0]
    const seat = (id, type, dx, dy, extra) => {
      for (let rad = 0; rad <= 3; rad++) for (const [ox, oy] of [[0,0],[1,0],[0,1],[-1,0],[0,-1],[rad,rad],[-rad,-rad]]) {
        const x = isle.x + dx + ox, y = isle.y + dy + oy
        if (inB(x, y) && !taken.has(key(x, y)) && !isWater(g, x, y) && onIsle(g, x, y)) { put(id, type, x, y, extra); return }
      }
    }
    seat('waystone-shrine', 'waystone', 0, 0)
    seat('tally-isle', 'landmark', -2, -2, { kind: 'tally-half', founderKey: g.founderKey })
    seat('shrine-hearth', 'campfire', 3, 0)
    for (let k = 0; k < 4; k++) seat('shrine-stone-' + k, 'landmark', [-4, 4, 0, 0][k], [0, 2, -4, 4][k], { kind: 'standing-stone' })
  }

  // ================= THE BRIDGES, NAMED =================
  for (const b of bridgesOf(g)) {
    for (const [dx, dy] of [[-4, -2], [4, -2], [-4, 2], [4, 2]]) {
      const x = b.x + dx, y = b.y + dy
      if (free(x, y)) { put('brmark-' + b.tag + dx + dy, 'landmark', x, y, { kind: 'standing-stone' }) }
    }
    for (const [dx, dy] of [[-5, 0], [5, 0]]) {
      const x = b.x + dx, y = b.y + dy
      if (free(x, y)) put('brsign-' + b.tag + dx, 'signpost', x, y, { text: b.name })
    }
  }

  // ================= THE WAYSIDE: ONE THING EVERY ~35 TILES =================
  // What a route is made of. Milestones that name the next two towns (so a
  // citizen navigates by reading, not by counting), and a rotating table of
  // small sights so no leg of any journey is thirty seconds of grass.
  const townsByTag = {}; for (const s of ss) townsByTag[s.tag] = s
  const nearestTowns = (x, y) => ss.map(s => ({ s, d: Math.round(Math.sqrt((s.x - x) * (s.x - x) + (s.y - y) * (s.y - y))) }))
    .sort((a, b) => a.d - b.d || (a.s.tag < b.s.tag ? -1 : 1)).slice(0, 2)
  const LEAGUE = 40 // tiles to a league: 24 seconds' walk
  let wayN = 0, mileN = 0
  const waysideKinds = ['croft', 'cairn', 'shrine', 'orchard', 'gibbet', 'kennel', 'beehives', 'bouldercircle']
  const buildWayside = (x, y, kind, tag) => {
    const ok = (ax, ay) => free(ax, ay)
    switch (kind) {
      case 'croft': { // an abandoned smallholding: four walls, a door, a dead plot
        if (![[0,0],[1,0],[2,0],[0,1],[2,1],[0,2],[1,2],[2,2]].every(([a,b]) => ok(x+a, y+b))) return false
        let i = 0
        for (const [a, b] of [[0,0],[1,0],[2,0],[0,1],[2,1],[0,2],[2,2]]) put('croft-' + tag + (i++), 'wall', x+a, y+b)
        put('croft-' + tag + '-p', 'plot', x + 4, y + 1, { plantedAt: 0 })
        put('croft-' + tag + '-s', 'signpost', x + 1, y + 3, { text: 'an empty croft' })
        return true }
      case 'cairn': {
        if (!ok(x, y)) return false
        put('cairn-' + tag, 'landmark', x, y, { kind: 'cairn' })
        // v4 set a second stone at exactly (+1,+1) EVERY time, which put 51
        // pairs on one offset and 61 on its mirror. A companion now needs a
        // hash to agree, and stands where the hash says.
        const [cx2, cy2, want] = companion(g, x, y, 91)
        if (want && ok(x + cx2, y + cy2))
          put('cairn-' + tag + 'b', 'landmark', x + cx2, y + cy2, { kind: 'standing-stone' })
        return true }
      case 'shrine':
        if (!ok(x, y) || !ok(x + 1, y)) return false
        put('wshrine-' + tag, 'landmark', x, y, { kind: 'standing-stone' })
        put('wshrine-' + tag + 'f', 'campfire', x + 1, y)
        return true
      case 'orchard': {
        let n = 0
        for (const [a, b] of [[0,0],[2,0],[4,0],[0,2],[2,2],[4,2],[1,1],[3,1]]) if (ok(x+a, y+b)) { put('orch-' + tag + (n++), 'tree', x+a, y+b) }
        for (let a = -1; a <= 5; a++) if (ok(x + a, y + 3) && a !== 2) put('orchh-' + tag + a, 'hedge', x + a, y + 3)
        return n > 4 }
      case 'gibbet':
        if (!ok(x, y)) return false
        put('gib-' + tag, 'landmark', x, y, { kind: 'broken-tower' })
        if (ok(x + 1, y)) put('gib-' + tag + 's', 'signpost', x + 1, y, { text: 'the crossroads gibbet' })
        return true
      case 'kennel': {
        if (!ok(x, y) || !ok(x + 1, y)) return false
        put('ken-' + tag, 'house', x, y); put('ken-' + tag + 'k', 'keeper', x + 1, y, { name: keeperName(tag, 'kennel') })
        for (let a = -1; a <= 3; a++) if (ok(x + a, y + 2)) put('kenf-' + tag + a, 'fence', x + a, y + 2)
        return true }
      case 'beehives': {
        let n = 0
        for (const [a, b] of [[0,0],[1,1],[2,0],[3,1]]) if (ok(x+a, y+b)) { put('bee-' + tag + (n++), 'landmark', x+a, y+b, { kind: 'skep' }) }
        return n > 2 }
      default: { // bouldercircle
        let n = 0
        for (const [a, b] of [[0,-2],[2,-1],[2,1],[0,2],[-2,1],[-2,-1]]) if (ok(x+a, y+b)) { put('bcirc-' + tag + (n++), 'rock', x+a, y+b) }
        return n > 3 }
    }
  }
  // Spacing is measured along the ROAD now, not along the straight line
  // between its ends, so a route that swings twenty tiles wide to get round
  // the Barrow earns milestones for the walking it actually costs.
  for (const { tag, path } of routedPathsOf(g)) {
    const PL = path.length
    if (PL < 24) continue
    const stops = Math.max(1, Math.round(PL / 35))
    for (let k = 1; k <= stops; k++) {
      const ix = Math.min(PL - 2, Math.max(1, Math.round((k - 0.5) / stops * PL)))
      const bx = path[ix][0], by = path[ix][1]
      const pA = path[Math.max(0, ix - 3)], pB = path[Math.min(PL - 1, ix + 3)]
      let hx = pB[0] - pA[0], hy = pB[1] - pA[1]
      const hl = Math.sqrt(hx * hx + hy * hy) || 1
      const nx = -hy / hl, ny = hx / hl
      const h = H32('wayside|' + tag, k)
      if (k % 2 === 1) {
        const nt = nearestTowns(bx, by)
        const txt = nt.map(({ s, d }) => s.name + ' ' + Math.max(1, Math.round(d / LEAGUE))).join(' \u00b7 ')
        let placed = false
        for (const side of [2, -2, 3, -3, 4, -4]) {
          const x = Math.round(bx + nx * side), y = Math.round(by + ny * side)
          if (free(x, y)) { put('mile-' + (mileN++), 'signpost', x, y, { text: txt }); placed = true; break }
        }
        if (placed) continue
      }
      const kind = waysideKinds[h[0] % waysideKinds.length]
      let done = false
      for (const side of [4, -4, 6, -6, 3, -3, 8, -8]) {
        const x = Math.round(bx + nx * side), y = Math.round(by + ny * side)
        if (biomeAt(g, x, y) === 'sea') continue
        if (buildWayside(x, y, kind, wayN)) { wayN++; done = true; break }
      }
      if (!done) for (const side of [5, -5, 7, -7]) {
        const x = Math.round(bx + nx * side), y = Math.round(by + ny * side)
        if (buildWayside(x, y, 'cairn', wayN)) { wayN++; break }
      }
    }
  }

  // ================= THE COUNTRY FURNITURE =================
  // Waysides are placed along ROADS, which means a country the roads mostly
  // skirt stays bare no matter how large it grows. Measured after lever #5:
  // the heartlands carried 35 built things per thousand tiles and the Moor
  // carried 0.4 -- eight objects in seventeen thousand tiles. That is not
  // an economy problem and it does not want new resource tiers to fix it.
  // It wants what the fields between Falador and Varrock have: fences,
  // cairns, old walls, somebody's abandoned attempt at something. None of
  // it is worth gathering. All of it is worth walking past.
  //
  // So this pass tops each country up to a FLOOR measured per thousand
  // tiles, using furniture that belongs to that country, and it counts what
  // is already there so the heartlands (full of towns) gets nothing.
  // NODES per thousand tiles, not THINGS: a peat cutting is seven nodes, and
  // the first draft counted it as one, so every floor overshot by three or
  // four times. Read alongside the resource density each country already
  // carries (greenwood 88 per thousand, crags 45, moor 5) these leave a
  // gradient rather than a flat fill: the timber country stays the densest
  // place on the island and the Wilds stay the emptiest.
  // HALVED, and the spread widened rather than preserved. v4 ran
  // 3.0 to 13.0 -- a 4.3x band. This runs 1.2 to 7.0, a 5.8x band, so the
  // difference between walking the Downs and walking the Wilds is a thing
  // you feel rather than a thing you could measure.
  const FURNITURE_FLOOR = {
    moor: 5.0,        // was 12.0. The great hole is allowed to stay a hole.
    fens: 4.0,        // was 8.0
    greenwood: 6.0,   // was 10.0. Still the densest country; it has the trees.
    crags: 4.5,       // was 10.0
    downs: 7.0,       // was 13.0. Still the best-furnished frontier.
    wilds: 1.2,       // was 3.0. Sparse on purpose, and now sparse enough
                      // that the Wilds read as somewhere you have gone OUT to.
  }
  const COUNTRY_KINDS = {
    moor:      ['cairn', 'peatcutting', 'boundarystone', 'sheepskull', 'croft', 'bouldercircle'],
    fens:      ['duckboards', 'eeltrap', 'cairn', 'croft', 'boundarystone'],
    greenwood: ['charcoal', 'cairn', 'croft', 'beehives', 'boundarystone'],
    crags:     ['cairn', 'bouldercircle', 'boundarystone', 'sheepskull'],
    downs:     ['boundarystone', 'sheepskull', 'cairn', 'orchard'],
    wilds:     ['bonepile', 'ruinwall', 'cairn'],
  }
  const buildCountryThing = (x, y, kind, tag) => {
    const ok = (ax, ay) => free(ax, ay)
    switch (kind) {
      case 'peatcutting': { // a worked peat bank: turves lifted, water beneath
        let n = 0
        for (const [a, b] of [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]])
          if (ok(x+a, y+b)) { put('peat-' + tag + (n++), 'plot', x+a, y+b, { plantedAt: 0 }) }
        if (ok(x - 1, y)) put('peat-' + tag + 's', 'signpost', x - 1, y, { text: 'a peat cutting' })
        return n > 3 }
      case 'boundarystone':
        if (!ok(x, y)) return false
        put('bound-' + tag, 'landmark', x, y, { kind: 'boundary-stone' })
        if (ok(x + 1, y)) put('bound-' + tag + 's', 'signpost', x + 1, y, { text: 'a boundary stone' })
        return true
      case 'sheepskull':
        if (!ok(x, y)) return false
        put('skull-' + tag, 'landmark', x, y, { kind: 'skull-pile' })
        return true
      case 'duckboards': { // a plank walk laid over the fen, going nowhere now
        let n = 0
        for (let a = 0; a < 7; a++) if (ok(x + a, y + (a >> 2))) { put('duck-' + tag + (n++), 'fence', x + a, y + (a >> 2)) }
        return n > 4 }
      case 'eeltrap': {
        if (!ok(x, y)) return false
        put('eel-' + tag, 'landmark', x, y, { kind: 'eel-rack' })
        if (ok(x + 1, y + 1)) put('eel-' + tag + 'b', 'fence', x + 1, y + 1)
        return true }
      case 'charcoal': { // a burner's clamp and the ring of stumps around it
        if (!ok(x, y) || !ok(x + 1, y)) return false
        put('char-' + tag, 'campfire', x, y)
        // the clamp itself, not a standing stone standing in for one
        put('char-' + tag + 'k', 'landmark', x + 1, y, { kind: 'charcoal-clamp' })
        let n = 0
        for (const [a, b] of [[-2,-1],[2,-1],[-2,2],[2,2]]) if (ok(x+a, y+b)) { put('charst-' + tag + (n++), 'fence', x+a, y+b) }
        return true }
      case 'bonepile': {
        if (!ok(x, y)) return false
        put('bone-' + tag, 'landmark', x, y, { kind: 'bone-pile' })
        // and when the Wilds do leave a second thing beside the first, it is
        // more bone. A standing stone out here was only ever filler.
        const [bx2, by2, want] = companion(g, x, y, 92)
        if (want && ok(x + bx2, y + by2))
          put('bone-' + tag + 'b', 'landmark', x + bx2, y + by2, { kind: 'skull-pile' })
        return true }
      case 'ruinwall': { // a wall with nothing left on either side of it
        let n = 0
        for (let a = 0; a < 5; a++) if (a !== 2 && ok(x + a, y)) { put('rw-' + tag + (n++), 'wall', x + a, y) }
        for (let b = 1; b < 3; b++) if (ok(x, y + b)) { put('rw-' + tag + (n++), 'wall', x, y + b) }
        return n > 3 }
      default:
        return buildWayside(x, y, kind, 'c' + tag)
    }
  }
  let furnN = 0
  {
    // count what each country already has, so this only fills gaps
    const have = {}, area = {}
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const b = biomeAt(g, x, y)
      if (b !== 'sea') area[b] = (area[b] || 0) + 1
    }
    const RESOURCE = new Set(['tree', 'rock', 'magic-rock', 'fishing-spot'])
    for (const n of Object.values(w.nodes)) {
      if (RESOURCE.has(n.type)) continue
      const b = biomeAt(g, n.x, n.y)
      have[b] = (have[b] || 0) + 1
    }
    for (const [country, floor] of Object.entries(FURNITURE_FLOOR)) {
      const a = area[country] ?? 0
      const want = Math.max(0, Math.round(a * floor / 1000) - (have[country] ?? 0))
      if (want <= 0) continue
      const kinds = COUNTRY_KINDS[country]
      // Placed in loose CLUMPS rather than evenly. Evenly-spread furniture
      // reads as wallpaper; a cairn near a boundary stone near an old croft
      // reads as somebody having once been here.
      const clumps = Math.max(3, Math.round(want / 7))
      let made = 0
      for (let c = 0; c < clumps && made < want; c++) {
        let cx = -1, cy = -1
        for (let att = 0; att < 900; att++) {
          const hh = H32('furn|' + country, c * 900 + att)
          const x = 2 + (hh.readUInt16BE(0) % (W - 4)), y = 2 + (hh.readUInt16BE(2) % (H - 4))
          if (biomeAt(g, x, y) !== country || !free(x, y) || !reachableToGather(x, y)) continue
          // nothing is ever built in a quiet quarter
          if (inQuietQuarter(g, x, y)) continue
          // and the country fills from its ROUTES outward. v4 seeded clumps
          // uniformly, which is why its landmarks sat within five tiles of a
          // road only 19% of the time against 11% for open land -- a system
          // built to furnish journeys, drowned by one that furnished acreage.
          const rd = roadDistAt(g, x, y)
          if (rd > 20) {
            const gate = hh.readUInt16BE(4)
            if (rd <= 50) { if (gate % 3 !== 0) continue }
            else          { if (gate % 9 !== 0) continue }
          }
          cx = x; cy = y; break
        }
        if (cx < 0) continue
        const per = Math.ceil(want / clumps)
        for (let k = 0; k < per * 4 && made < want; k++) {
          const hk = H32('furn|' + country + '|' + c, k)
          const ox = (hk[0] % 27) - 13, oy = (hk[1] % 19) - 9
          const kind = kinds[hk[2] % kinds.length]
          const before = putCount
          if (inQuietQuarter(g, cx + ox, cy + oy)) continue
          if (buildCountryThing(cx + ox, cy + oy, kind, country + '-' + (furnN))) {
            furnN++; made += (putCount - before)   // NODES placed, not things
          }
        }
      }
    }
  }

  // ---- what the trails go around ----
  let wm = 0
  for (const b of roadBendsOf(g)) {
    for (const [dx, dy] of [[0,0],[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,-1]]) {
      const x = b.x + dx, y = b.y + dy
      if (!free(x, y)) continue
      const bi = biomeAt(g, x, y)
      if (bi === 'sea') continue
      const stone = bi === 'crags' || bi === 'wilds' || bi === 'downs' || (thash(g, x, y, 61) % 3) === 0
      taken.add(key(x, y))
      E.addNode(w, 'waymark-' + (wm++), stone ? 'rock' : 'tree', x, y)
      break
    }
  }

  // ---- wayside hearths at every route's midpoint ----
  let wr = 0
  for (const { path } of routedPathsOf(g)) {
    if (path.length < 30) continue
    const m = path[path.length >> 1]
    let placed = false
    for (let rad = 2; rad <= 7 && !placed; rad++)
      for (let dy = -rad; dy <= rad && !placed; dy++) for (let dx = -rad; dx <= rad; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
        if (free(m[0] + dx, m[1] + dy)) { put('wayrest-' + (wr++), 'campfire', m[0] + dx, m[1] + dy); placed = true; break }
      }
  }

  // ---- the worksites ----
  const siteSeek = (fx, fy, biome, need) => {
    let x = Math.round(W * fx), y = Math.round(H * fy)
    seekQ: for (let rad = 0; rad < 50; rad++) for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
      let ok = biomeAt(g, x + dx, y + dy) === biome
      for (let yy = -need; yy <= need && ok; yy++) for (let xx = -need; xx <= need; xx++)
        if (!free(x + dx + xx, y + dy + yy)) { ok = false; break }
      if (ok) { x += dx; y += dy; break seekQ }
    }
    return { x, y }
  }
  const sput = (id, type, x, y, extra) => { if (free(x, y)) put(id, type, x, y, extra) }
  const putWaystoneEarly = (id, x, y) => {
    for (let rad = 0; rad < 12; rad++) for (const [dx, dy] of [[0,rad],[rad,0],[0,-rad],[-rad,0],[rad,rad],[-rad,-rad]])
      if (free(x + dx, y + dy)) { put(id, 'waystone', x + dx, y + dy); return true }
    return false
  }
  { // the Sawyer's Camp
    const c = siteSeek(0.50, 0.15, 'greenwood', 4)
    sput('camp-house', 'house', c.x, c.y); sput('camp-hearth', 'campfire', c.x + 2, c.y)
    sput('kpr-camp-sawyer', 'keeper', c.x + 1, c.y + 1, { name: keeperName('camp', 'sawyer', { name: keeperName('camp', 'sawyer') }) })
    for (const [i, [dx, dy]] of [[-3,-2],[3,-2],[-4,1],[4,1],[-2,3],[2,3],[0,-4],[0,4]].entries()) sput('camp-t-' + i, 'tree', c.x + dx, c.y + dy)
  }
  { // the High Delving: now a WALLED quarry with one entrance -- a room
    const c = siteSeek(0.81, 0.38, 'crags', 7)
    let i = 0
    for (let a = -6; a <= 6; a++) {
      if (a !== 0) { sput('dlvw-' + (i++), 'wall', c.x + a, c.y - 5); sput('dlvw-' + (i++), 'wall', c.x + a, c.y + 5) }
    }
    for (let b2 = -4; b2 <= 4; b2++) { sput('dlvw-' + (i++), 'wall', c.x - 6, c.y + b2); sput('dlvw-' + (i++), 'wall', c.x + 6, c.y + b2) }
    sput('delve-house', 'house', c.x - 4, c.y - 3); sput('delve-anvil', 'anvil', c.x + 4, c.y - 3)
    sput('delve-hearth', 'campfire', c.x + 3, c.y - 3); sput('kpr-delve-high', 'keeper', c.x - 3, c.y - 3, { name: keeperName('delve', 'high', { name: keeperName('delve', 'high') }) })
    for (const [i2, [dx, dy]] of [[-3,0],[3,0],[-2,2],[2,2],[0,3],[-4,1],[4,1],[-1,3],[1,-1]].entries()) sput('delve-r-' + i2, 'rock', c.x + dx, c.y + dy)
    sput('delve-sign', 'signpost', c.x, c.y - 6, { text: 'the High Delving' })
  }
  { // the Eel Sheds
    const c = siteSeek(0.48, 0.85, 'fens', 3)
    sput('sheds-house', 'house', c.x, c.y); sput('sheds-hearth', 'campfire', c.x + 2, c.y)
    sput('kpr-sheds-eel', 'keeper', c.x + 1, c.y + 1, { name: keeperName('sheds', 'eel') })
    let fs2 = 0
    seekF: for (let rad = 1; rad < 16 && fs2 < 4; rad++) for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
      const x = c.x + dx, y = c.y + dy
      if (!isWater(g, x, y) && !taken.has(key(x, y)) && inB(x, y)
        && (isWater(g, x+1, y) || isWater(g, x-1, y) || isWater(g, x, y+1) || isWater(g, x, y-1))) {
        put('sheds-f-' + (fs2++), 'fishing-spot', x, y); if (fs2 >= 4) break seekF
      }
    }
  }
  { // The Sheepfolds. The Downs get a BANK, and a tight ring of ordinary
    // stone around it -- not a new tier, not a better rock, the same rock
    // the Crags have. What the Downs sell is LOGISTICS: the only place on
    // the island you can cut stone and bank it without a walk. That is
    // precisely Al Kharid, whose mine holds nothing unique and is the most
    // worked in the game, and it needs no new item to exist.
    const c = siteSeek(0.72, 0.71, 'downs', 8)
    sput('fold-house', 'house', c.x, c.y - 4); sput('kpr-fold-shep', 'keeper', c.x + 1, c.y - 4, { name: keeperName('fold', 'shep') })
    sput('fold-hearth', 'campfire', c.x - 1, c.y - 4)
    let i = 0
    for (let a = -5; a <= 5; a++) { sput('foldf-' + (i++), 'fence', c.x + a, c.y - 2); if (a !== 0) sput('foldf-' + (i++), 'fence', c.x + a, c.y + 4) }
    for (let b2 = -1; b2 <= 3; b2++) { sput('foldf-' + (i++), 'fence', c.x - 5, c.y + b2); sput('foldf-' + (i++), 'fence', c.x + 5, c.y + b2) }
    sput('fold-sign', 'signpost', c.x, c.y - 5, { text: 'the Sheepfolds' })
    // the counting house: a small walled room with a door, and a bank in it
    const bx = c.x + 8, by = c.y - 6
    let ok = true
    for (let yy = by; yy < by + 5 && ok; yy++) for (let xx = bx; xx < bx + 6; xx++) if (!free(xx, yy)) { ok = false; break }
    if (ok) {
      let bi = 0
      for (let yy = by; yy < by + 5; yy++) for (let xx = bx; xx < bx + 6; xx++) {
        const edge = xx === bx || xx === bx + 5 || yy === by || yy === by + 4
        if (!edge) continue
        if (yy === by + 4 && xx === bx + 3) continue // the door
        put('foldbank-w' + (bi++), 'wall', xx, yy)
      }
      put('foldbank', 'bank', bx + 2, by + 2)
      put('kpr-bank-folds', 'keeper', bx + 3, by + 2, { name: keeperName('bank', 'folds') })
      sput('foldbank-sign', 'signpost', bx + 3, by + 5, { text: 'the Sheepfolds counting house' })
    }
    // and the stone: ordinary crag rock, close enough to carry
    let rn = 0
    for (let rad = 3; rad <= 14 && rn < 48; rad++)
      for (let dy = -rad; dy <= rad && rn < 48; dy++) for (let dx = -rad; dx <= rad; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
        const x = c.x + dx, y = c.y + dy
        if (!free(x, y) || biomeAt(g, x, y) !== 'downs') continue
        if ((thash(g, x, y, 71) % 3) !== 0) continue
        E.addNode(w, 'foldrock-' + (rn++), 'rock', x, y); taken.add(key(x, y))
      }
  }
  { // The Moorwatch. The Moor's job is not to be farmed, it is to be the
    // APPROACH: the last country before the Brandline, where the ground
    // stops being safe. Barbarian Village earns its place by being on the
    // way to somewhere, not by what is in it. So: a watchpost, a fire kept
    // burning, and the last waystone before the stones.
    let px = brandX(g, Math.round(H * 0.21)) + 14, py = Math.round(H * 0.21)
    let seated = false
    seekWP: for (let rad = 0; rad < 70; rad++)
      for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
        const x = px + dx, y = py + dy
        if (biomeAt(g, x, y) !== 'moor') continue
        let clear = true
        for (let yy = -4; yy <= 4 && clear; yy++) for (let xx = -5; xx <= 5; xx++) if (!free(x + xx, y + yy)) { clear = false; break }
        if (clear) { px = x; py = y; seated = true; break seekWP }
      }
    if (seated) {
      let i = 0
      for (let a = -4; a <= 4; a++) { put('mw-' + (i++), 'wall', px + a, py - 3); if (a !== 0) put('mw-' + (i++), 'wall', px + a, py + 3) }
      for (let b2 = -2; b2 <= 2; b2++) { put('mw-' + (i++), 'wall', px - 4, py + b2); put('mw-' + (i++), 'wall', px + 4, py + b2) }
      put('moorwatch-fire', 'campfire', px, py)
      put('moorwatch-g1', 'guard', px - 2, py); put('moorwatch-g2', 'guard', px + 2, py)
      put('kpr-camp-moorwatch', 'keeper', px, py - 1, { name: keeperName('camp', 'moorwatch') })
      put('moorwatch-house', 'house', px - 2, py - 2)
      sput('moorwatch-sign', 'signpost', px, py + 4, { text: 'the Moorwatch \u00b7 the Brand lies west' })
      putWaystoneEarly('waystone-moorwatch', px + 6, py)
    }
  }
  { // the Lantern: the wayside inn
    const seat = innSeat(g)
    if (!seat) { /* no ground for it on this seed */ } else {
    const ix = seat.x, iy = seat.y
    // THE LANTERN LOST ITS WALLS.
    //
    // It was a `house` node and a campfire, which was a building and a fire
    // beside it -- until v5 made `house` mean the HEARTH rather than the
    // cottage, because a building is now the walled room you walk into. Every
    // town was rebuilt to that rule and this one inn, standing alone out on
    // the road, was not. The Lantern has been a fireplace in a field with a
    // well and a man called Ulric next to it ever since, and nothing noticed
    // because nothing checks that a named place still has a shape.
    //
    // So it gets what every other building here has: four walls, one door,
    // boards underfoot, and its hearth inside where a hearth belongs.
    const RW = 7, RH = 5                       // outer, so the room inside is 5x3
    const rx0 = ix - 3, ry0 = iy - 1
    const door = rx0 + 3                        // the middle of the south wall
    let laid = 0
    for (let yy = 0; yy < RH; yy++) for (let xx = 0; xx < RW; xx++) {
      const x = rx0 + xx, y = ry0 + yy
      const edge = xx === 0 || yy === 0 || xx === RW - 1 || yy === RH - 1
      if (!edge) continue
      if (yy === RH - 1 && x === door) continue          // the way in
      if (!free(x, y) || blockedAt(g, x, y) || isWater(g, x, y)) continue
      taken.add(key(x, y)); put('inn-w' + (laid++), 'wall', x, y)
    }
    // THE DOORWAY IS RESERVED, and so is the step outside it.
    //
    // The walls skip the door, which leaves the tile free -- and free means
    // the next pass along is welcome to put something in it. On one seed
    // something did, and Ulric was sealed inside his own inn with no way out
    // that any citizen could walk. `check-seeds` caught it: one stranded.
    taken.add(key(door, ry0 + RH - 1))
    taken.add(key(door, ry0 + RH))
    // the hearth against the back wall, the keeper beside it, both indoors
    put('inn-house', 'house', rx0 + 2, ry0 + 1)
    put('kpr-inn-lantern', 'keeper', rx0 + 4, ry0 + 1, { name: keeperName('inn', 'lantern') })
    // and the things that belong OUTSIDE an inn: the well, the fire in the
    // yard, and the sign where a traveler on the road can read it
    put('inn-well', 'well', rx0 - 2, ry0 + 2)
    put('inn-hearth', 'campfire', rx0 + RW + 1, ry0 + 2)
    put('inn-sign', 'signpost', door, ry0 + RH + 1, { text: 'the Lantern \u00b7 rest, traveler' })
    }
  }

  // ---- the paddocks, outside the shire towns ----
  for (const st of ss) {
    if (st.ring !== 'shire') continue
    // ONE paddock per town, not three. The engine clones the entire state
    // every tick, so every node is copied a hundred times a minute; 823
    // nodes of decorative fencing was the single largest thing in v4 that
    // nobody would miss. A town with one field beside it reads the same as a
    // town with three.
    for (let pk = 0; pk < 1; pk++) {
      const hp = H32('paddock|' + st.tag, pk)
      const pw = 9 + (hp.readUInt16BE(0) % 3), ph = 6 + (hp.readUInt16BE(2) % 2)
      const side = hp.readUInt16BE(4) % 4
      const r = rectOf(st)
      const ax0 = side === 0 ? r.x0 - pw - 5 : side === 1 ? r.x1 + 5 : st.x - (pw >> 1)
      const ay0 = side === 2 ? r.y0 - ph - 5 : side === 3 ? r.y1 + 5 : st.y - (ph >> 1)
      const fits = (ax, ay) => {
        if (ax < 2 || ay < 2 || ax + pw >= W - 2 || ay + ph >= H - 2) return false
        for (let yy = ay - 1; yy <= ay + ph + 1; yy++) for (let xx = ax - 1; xx <= ax + pw + 1; xx++) if (!free(xx, yy)) return false
        return true
      }
      let ax = ax0, ay = ay0, placed = false
      seekPad: for (let rad = 0; rad < 20; rad++) for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
        if (fits(ax0 + dx * 2, ay0 + dy * 2)) { ax = ax0 + dx * 2; ay = ay0 + dy * 2; placed = true; break seekPad }
      }
      if (!placed) continue
      const mat = hp.readUInt16BE(6) % 2 ? 'hedge' : 'fence'
      const gate = pw >> 1
      let fi = 0
      for (let xx = ax; xx <= ax + pw; xx++) {
        put('pdk-' + st.tag + pk + '-' + (fi++), mat, xx, ay)
        if (xx - ax !== gate) put('pdk-' + st.tag + pk + '-' + (fi++), mat, xx, ay + ph)
      }
      for (let yy = ay + 1; yy < ay + ph; yy++) {
        put('pdk-' + st.tag + pk + '-' + (fi++), mat, ax, yy)
        put('pdk-' + st.tag + pk + '-' + (fi++), mat, ax + pw, yy)
      }
      const spine = ax + (pw >> 1)
      let pin = 0
      for (let ry = 1; ry < ph; ry += 2) for (let xx = ax + 1; xx < ax + pw; xx++) {
        if (xx === spine) continue
        if (free(xx, ay + ry)) put('pdkp-' + st.tag + pk + '-' + (pin++), 'plot', xx, ay + ry, { plantedAt: 0 })
      }
      for (let yy = ay; yy <= ay + ph + 1; yy++) for (let xx = ax; xx <= ax + pw; xx++) taken.add(key(xx, yy))
    }
  }

  // ---- fishing coves ----
  let fs = 0
  const shoreOf = (x, y) => {
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) if (isWater(g, x + dx, y + dy)) return true
    return false
  }
  const shores = []
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    if (!free(x, y) || !shoreOf(x, y) || !reachableToGather(x, y)) continue
    const b = biomeAt(g, x, y)
    const coastal = b === 'fens' || (() => {
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) if (isWater(g, x+dx, y+dy) && inSea(g, x+dx, y+dy)) return true
      return false
    })()
    shores.push({ x, y, coastal })
  }
  const usedShore = new Set()
  // A PORT GETS FISH. The twelve coves are drawn by hash from every coastal
  // tile on the island, and Eastmere's stretch of the Downs shore simply
  // never won one: three spots inside thirty tiles against Fenmarch's
  // twenty-one, in a town whose entire reason for standing there is the
  // water. It also drew six trees and seven rocks, so nothing else was
  // going to carry it either. A port is not a place the coves MIGHT land;
  // it is the one place they must, and seating it deliberately is the same
  // move this generator already makes for the towns themselves.
  for (const st of ss) {
    if (st.kind !== 'port') continue
    const near = shores.filter(sh => Math.abs(sh.x - st.x) + Math.abs(sh.y - st.y) <= 40)
    let laid = 0
    for (const sh of near) {
      if (laid >= 30) break
      const k = sh.x + ',' + sh.y
      if (usedShore.has(k) || taken.has(k)) continue
      // not a solid wall of them: a fifth of the quayside stays open
      if (thash(g, sh.x, sh.y, 17) % 5 === 0) continue
      usedShore.add(k); put('fish-' + st.tag + '-' + (fs++), 'fishing-spot', sh.x, sh.y); laid++
    }
  }
  const primeShore = shores.filter(sh => sh.coastal)
  for (let c = 0; c < 12; c++) {
    const pool = primeShore.length > 20 ? primeShore : shores
    if (!pool.length) break
    const hc = H32('cove|center', c)
    let center = null
    for (let a = 0; a < 300 && !center; a++) {
      const cand = pool[(hc.readUInt32BE(0) ^ (a * 2654435761)) % pool.length]
      if (cand && !usedShore.has(cand.x + ',' + cand.y)) center = cand
    }
    if (!center) continue
    for (const sh of shores) {
      if (Math.abs(sh.x - center.x) + Math.abs(sh.y - center.y) > 9) continue
      const k = sh.x + ',' + sh.y
      if (usedShore.has(k) || taken.has(k)) continue
      usedShore.add(k); put('fish-' + (fs++), 'fishing-spot', sh.x, sh.y)
    }
  }
  for (const sh of shores) {
    const k = sh.x + ',' + sh.y
    if (usedShore.has(k) || taken.has(k)) continue
    if (thash(g, sh.x, sh.y, 5) % 40 !== 0) continue
    usedShore.add(k); put('fish-' + (fs++), 'fishing-spot', sh.x, sh.y)
  }

  // ---- the country's resources ----
  const counts = { waymarks: wm, wayrests: wr, brandstones: br, waysides: wayN, milestones: mileN, buildings: bldN, shirePlaces: placeN, capes: capeN, locales: locN, countryFurniture: furnN }
  const A = (n) => Math.max(1, Math.round(n * (W * H) / (896 * 512)))
  const B = (x, y) => biomeAt(g, x, y)
  const tree = (id, x, y) => E.addNode(w, id, 'tree', x, y)
  const rock = (id, x, y) => E.addNode(w, id, 'rock', x, y)
  const mrock = (id, x, y) => E.addNode(w, id, 'magic-rock', x, y)
  // POROSITY. A tree ringed on all four sides by other trees can never be
  // reached -- you can only ever stand beside one -- so a dense clump has a
  // dead core. The first honest reachability pass swept 2,454 such nodes,
  // most of the greenwood's interior, which is the sweep correctly deleting
  // what the scatter should never have made. So the scatter keeps the woods
  // POROUS instead: no resource may take a tile that already has two
  // orthogonal neighbours occupied. Clumps stay clumps and lanes run through
  // them, which is also just what a wood looks like.
  // The rule has to be SYMMETRIC or it does not hold. Checking only the new
  // tile's neighbour count lets a tree with one neighbour acquire three more
  // later, and the core dies anyway -- the first attempt still swept 2,014.
  // So placing here must also not push any neighbour past the limit. Every
  // resource then keeps at least two open orthogonal sides, permanently.
  const orthTaken = (x, y) => {
    let n = 0
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) if (taken.has(key(x + dx, y + dy))) n++
    return n
  }
  const porous = (x, y) => {
    if (orthTaken(x, y) >= 2) return false
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = x + dx, ny = y + dy
      if (!taken.has(key(nx, ny))) continue
      if (orthTaken(nx, ny) >= 2) return false  // this would make it 3
    }
    return true
  }
  const scatter = (tag, want, pred, place) => {
    let n = 0
    for (let i = 0; i < want * 60 && n < want; i++) {
      const h = H32(tag, i)
      const x = 1 + (h.readUInt16BE(0) % (W - 2)), y = 1 + (h.readUInt16BE(2) % (H - 2))
      if (!free(x, y) || !porous(x, y) || !pred(x, y, h) || !reachableToGather(x, y)) continue
      place(tag + '-' + n, x, y); taken.add(key(x, y)); n++
    }
    return n
  }
  // SAMPLE FROM THE PLACES THAT QUALIFY, not from the whole island.
  //
  // `scatter` draws uniformly over 458,752 tiles and uses the predicate as a
  // filter, so a NARROW target starves: twenty-two eel-racks asked for at the
  // fen's waterline, seven placed, because the band is a few thousand tiles
  // and sixty tries each is not enough to find them. Ask for something rare
  // and you quietly get a fraction of it.
  //
  // This walks the map once, keeps every tile that qualifies, and draws from
  // that. Exact counts, and a predicate can be as narrow as the world is.
  const scatterIn = (tag, want, pred, place, step = 1) => {
    const cand = []
    for (let y = 1; y < H - 1; y += step) for (let x = 1; x < W - 1; x += step) {
      if (!free(x, y) || !porous(x, y) || !pred(x, y)) continue
      cand.push((y << 12) | x)
    }
    if (!cand.length) return 0
    let n = 0
    for (let i = 0; i < want * 24 && n < want; i++) {
      const h = H32(tag + '|in', i)
      const c = cand[h.readUInt32BE(0) % cand.length]
      const x = c & 0xfff, y = c >> 12
      if (!free(x, y) || !reachableToGather(x, y)) continue
      place(tag + '-' + n, x, y); taken.add(key(x, y)); n++
    }
    return n
  }
  const clusterScatter = (tag, want, pred, place, clumps, spread) => {
    let n = 0
    const perClump = Math.ceil(want / clumps)
    const rad = Math.max(spread, Math.ceil(Math.sqrt(perClump) * 1.4))
    for (let c = 0; c < clumps && n < want; c++) {
      let cx = -1, cy = -1
      for (let a = 0; a < 1500; a++) {
        const hc = H32(tag + '|center', c * 1500 + a)
        const x = 1 + (hc.readUInt16BE(0) % (W - 2)), y = 1 + (hc.readUInt16BE(2) % (H - 2))
        if (free(x, y) && porous(x, y) && pred(x, y, hc) && reachableToGather(x, y)) { cx = x; cy = y; break }
      }
      if (cx < 0) continue
      const target = Math.min(want, n + perClump)
      for (let r = 0; r <= rad && n < target; r++)
        for (let dy = -r; dy <= r && n < target; dy++) for (let dx = -r; dx <= r && n < target; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue
          const x = cx + dx, y = cy + dy
          if (!free(x, y) || !porous(x, y) || !pred(x, y) || !reachableToGather(x, y)) continue
          place(tag + '-' + n, x, y); taken.add(key(x, y)); n++
        }
    }
    if (n < want) n += scatter(tag + 'x', want - n, pred, place)
    return n
  }
  counts.greenwoodTrees = clusterScatter('gwtree', A(980), (x, y) => B(x, y) === 'greenwood', tree, 12, 30)
  counts.heartTrees     = scatter('httree', A(150), (x, y) => B(x, y) === 'heartlands', tree)
  counts.moorTrees      = scatter('mrtree', A(90),  (x, y) => B(x, y) === 'moor', tree)
  counts.fenTrees       = scatter('fntree', A(150), (x, y) => B(x, y) === 'fens', tree)
  counts.wildTrees      = scatter('wdtree', A(130), (x, y) => B(x, y) === 'wilds', tree)
  counts.cragRocks      = clusterScatter('cgrock', A(600), (x, y) => B(x, y) === 'crags', rock, 10, 26)
  counts.downRocks      = scatter('dwrock', A(160), (x, y) => B(x, y) === 'downs', rock)
  counts.wildRocks      = scatter('wdrock', A(110), (x, y) => B(x, y) === 'wilds', rock)
  counts.heartRocks     = scatter('htrock', A(130), (x, y) => B(x, y) === 'heartlands', rock)
  const deepWilds = (x, y) => {
    if (B(x, y) !== 'wilds') return false
    const edge = brandX(g, y)
    return x < edge - Math.round(edge * 0.28)
  }
  counts.magicWilds = clusterScatter('wdmagic', A(88), deepWilds, mrock, 7, 16)

  let copse = 0
  for (const st of ss) {
    const r = rectOf(st)
    let placed = 0
    for (let att = 0; att < 160 && placed < 6; att++) {
      const hb = H32('copse:' + st.name, att)
      const x = r.x0 - 11 + (hb.readUInt16BE(0) % (r.x1 - r.x0 + 23))
      const y = r.y0 - 11 + (hb.readUInt16BE(2) % (r.y1 - r.y0 + 23))
      if (x >= r.x0 - 3 && x <= r.x1 + 3 && y >= r.y0 - 3 && y <= r.y1 + 3) continue
      if (!free(x, y) || onRoad(g, x, y)) continue
      tree('copse-' + st.name + '-' + placed, x, y); taken.add(key(x, y)); placed++; copse++
    }
  }
  counts.copseTrees = copse

  const mob = (kind) => (id, x, y) => E.addMob(w, id, kind, x, y)
  const ccx = Math.floor(W / 2), ccy = Math.floor(H / 2)
  counts.goblins = scatter('gob', A(180), (x, y, h) => {
    const b = B(x, y)
    if (b === 'fens' || b === 'moor') return true
    if (b !== 'heartlands' && b !== 'downs') return false
    const dx = x - ccx, dy = y - ccy, d2 = dx * dx + dy * dy
    return d2 >= 900 && d2 <= 6400 && (!h || h.readUInt16BE(4) % 3 === 0)
  }, mob('goblin'))
  counts.wolves = scatter('wolf', A(108), (x, y) => { const b = B(x, y); return b === 'greenwood' || b === 'fens' || b === 'moor' }, mob('wolf'))
  // BEARS LIVE IN THE THICK OF IT, not above a latitude.
  //
  // The old rule was `greenwood && y < H*0.22`, which drew a straight line
  // across the wood: fifty-nine bears above it, none below, and the edge of
  // bear country was a horizontal you could see on a chart. This file's own
  // header calls that failure out in v3's COUNTRIES -- "a band has no SHAPE,
  // so no citizen can draw one from memory" -- and then reproduced it in a
  // population.
  //
  // So ask the wood instead. The greenwood's trees are laid in clumps of
  // twelve to thirty by clusterScatter, which means the canopy is already
  // blotchy in a way no constant can imitate; counting it gives bears a
  // range with edges that follow the forest. A summed-area table over the
  // trees already standing makes the count O(1), so this costs nothing.
  const canopy = (() => {
    const sat = new Int32Array((W + 1) * (H + 1))
    for (const n of Object.values(w.nodes)) if (n.type === 'tree') sat[(n.y + 1) * (W + 1) + (n.x + 1)] = 1
    for (let y = 1; y <= H; y++) for (let x = 1; x <= W; x++)
      sat[y * (W + 1) + x] += sat[(y - 1) * (W + 1) + x] + sat[y * (W + 1) + x - 1] - sat[(y - 1) * (W + 1) + x - 1]
    return (x, y, r) => {
      const x0 = Math.max(0, x - r), y0 = Math.max(0, y - r)
      const x1 = Math.min(W - 1, x + r), y1 = Math.min(H - 1, y + r)
      return sat[(y1 + 1) * (W + 1) + x1 + 1] - sat[y0 * (W + 1) + x1 + 1]
           - sat[(y1 + 1) * (W + 1) + x0] + sat[y0 * (W + 1) + x0]
    }
  })()
  // scatterIn, not scatter: the canopy rule qualifies about a fifth of the
  // wood, which is under one per cent of the island, and a uniform draw over
  // 458,752 tiles finds it fourteen times in sixty tries per bear. That is
  // the exact starvation scatterIn was written for -- ask for something
  // narrow and you quietly get a fraction of it.
  counts.bears  = scatterIn('bear', A(62), (x, y) => B(x, y) === 'greenwood' && canopy(x, y, 7) >= 12, mob('bear'))
  // MORE TROLLS, AND NOT ALONE.
  //
  // Seventy-two trolls averaged 1.2 of their own kind within fifteen tiles
  // -- scattered singles on a three-minute respawn -- and they are the only
  // source of the old-chain at 2/65536, the one item in the world that gold
  // cannot buy. So the rarest prize on the island sat behind the worst walk
  // in it: kill one, walk, wait. Meanwhile the skeleton-knights muster at
  // 6.6 apiece and their star-helm is 1/200. The scarcity should live in the
  // drop table, where it was put on purpose, and not also in the geography,
  // where it arrived by accident.
  //
  // Doubled, and clustered the way the knights are: a troll is a thing you
  // find several of under one crag.
  counts.trolls = clusterScatter('troll', A(150),
    (x, y) => { const b = B(x, y); return b === 'crags' || (b === 'wilds' && x < W * 0.10) },
    mob('troll'), 10, 10)
  // WARBANDS THAT LAND IN THE WILDS.
  //
  // The centre of each band used to be drawn from the rectangle x < 0.21W --
  // but the Wilds is a western CAPE, not a rectangle, and most of that strip
  // is open sea. Fifty-three of sixty-five knights fell in the water and were
  // dropped without a word, leaving TWELVE in the most dangerous country on
  // the island. Nothing measured it, so nothing said so.
  //
  // Draw the centre from Wilds land instead: reject and redraw until the
  // ground agrees, deterministically, on a fixed number of tries.
  const wildsSeat = (band) => {
    for (let t = 0; t < 60; t++) {
      const hb = H32('warband', band * 97 + t)
      const x = 2 + (hb.readUInt16BE(0) % Math.max(1, Math.round(W * 0.22)))
      const y = 2 + (hb.readUInt16BE(2) % (H - 4))
      if (biomeAt(g, x, y) === 'wilds' && !inSea(g, x, y)) return { x, y }
    }
    return null
  }
  let sk = 0
  for (let band = 0; band < A(13); band++) {
    const seat = wildsSeat(band)
    if (!seat) continue
    const bx = seat.x, by = seat.y
    for (let k = 0; k < 5; k++) {
      const hh = H32('skel', sk)
      const x = bx + (hh[0] % 7) - 3, y = by + (hh[1] % 7) - 3
      sk++
      if (!free(x, y) || B(x, y) !== 'wilds') continue
      taken.add(key(x, y)); E.addMob(w, 'skel-' + sk, 'skeleton-knight', x, y)
    }
  }
  counts.knights = sk

  // ---- THE BARROW GIVES UP ITS DEAD ----
  //
  // The Barrow is a burial mound in the middle of the Heartlands and until
  // now it did nothing but make the road bend. Scattered bones were the
  // obvious answer and the wrong one: ground items expire a hundred ticks
  // after they are dropped, so a founding-time scatter would be gone inside
  // a minute.
  //
  // So the mound gives up its dead instead. Skeletons walk the ring of open
  // ground around it -- they drop double bones, the warrior's due -- and
  // because they respawn on the engine's own timer rather than lying about
  // waiting to be collected, the prayer that comes off this hill is EARNED.
  // It is the one place in the safe country where something will fight you.
  {
    const c = barrowC(g), rx = 26, ry = 15   // the mound's own radii, from onBarrow
    let bs = 0
    for (let i = 0; i < A(46); i++) {
      const hh = H32('barrowdead', i)
      const ang = (hh.readUInt16BE(0) / 65536) * Math.PI * 2
      const rad = 1.04 + (hh[2] / 255) * 0.28              // just outside the mound
      const x = Math.round(c.x + Math.cos(ang) * rx * rad)
      const y = Math.round(c.y + Math.sin(ang) * ry * rad)
      if (!free(x, y) || blockedAt(g, x, y) || isWater(g, x, y)) continue
      taken.add(key(x, y)); E.addMob(w, 'barrowdead-' + i, 'skeleton-knight', x, y); bs++
    }
    counts.barrowDead = bs
  }

  // ---- THE SHORE-CRABS ----
  //
  // Eastmere had nothing alive within forty-five tiles: the emptiest named
  // place on the island, and a PORT, which is where people arrive. Crabs on
  // the rocks around it, thickest near the town and thinning along the coast,
  // because that is where the shallows are and because a citizen who has just
  // stepped off the quay should find something to do.
  //
  // They must be ON the shore. A crab inland is a crab somebody carried.
  {
    const em = settlementsOf(g).find((t) => t.tag === 'eastmere')
    let cr = 0
    if (em) {
      const wet = (x, y) => {
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++)
          if (isWater(g, x + dx, y + dy)) return true
        return false
      }
      for (let i = 0; i < A(700) && cr < A(34); i++) {
        const hh = H32('shorecrab', i)
        const rad = 6 + (hh[0] % 52)                      // thinning outward
        const ang = (hh.readUInt16BE(1) / 65536) * Math.PI * 2
        const x = Math.round(em.x + Math.cos(ang) * rad)
        const y = Math.round(em.y + Math.sin(ang) * rad)
        if (!free(x, y) || blockedAt(g, x, y) || isWater(g, x, y)) continue
        if (!wet(x, y)) continue                          // the shore, or nowhere
        taken.add(key(x, y)); E.addMob(w, 'crab-' + i, 'shore-crab', x, y); cr++
      }
    }
    counts.crabs = cr
  }

  // ---- THE SIREN ON THE STRAND ----
  //
  // A long shore, far from anywhere, where a citizen arrives alone because
  // the walk itself is long. She is common rather than rare -- a solo fight
  // gates ONE person per spawn where a party fight serves three or four, so
  // six hours would mean four citizens a day could ever attempt her. Twenty
  // minutes, and anybody who goes finds her.
  {
    let seat = null, bestScore = -1
    const towns = settlementsOf(g)
    for (let y = 6; y < H - 6; y += 3) for (let x = 6; x < W - 6; x += 3) {
      if (blockedAt(g, x, y) || isWater(g, x, y) || !free(x, y)) continue
      if (biomeAt(g, x, y) === 'wilds') continue          // she is not a Wilds thing
      // it must be SHORE: sand under foot and the sea within three
      if (groundKindAt(g, x, y) !== 'sand') continue
      let sea = false
      for (let dy = -3; dy <= 3 && !sea; dy++) for (let dx = -3; dx <= 3; dx++)
        if (inSea(g, x + dx, y + dy)) { sea = true; break }
      if (!sea) continue
      let near = 1e9
      for (const t of towns) { const d = Math.hypot(t.x - x, t.y - y); if (d < near) near = d }
      if (near > bestScore) { bestScore = near; seat = { x, y } }
    }
    if (seat) {
      E.addMob(w, 'the-siren', 'siren', seat.x, seat.y)
      taken.add(key(seat.x, seat.y))
      const sy = seat.y + 2
      if (free(seat.x, sy) && !blockedAt(g, seat.x, sy) && !isWater(g, seat.x, sy)) {
        taken.add(key(seat.x, sy))
        put('siren-sign', 'signpost', seat.x, sy, { text: 'the strand sings \u00b7 she takes one at a time' })
      }
      counts.siren = Math.round(bestScore)
    }
  }

  // ---- THE SPIDER, AND ITS WEB ----
  //
  // The far north of the Greenwood, which measured out as the furthest
  // walkable ground from any town outside the Wilds: two hundred and fifteen
  // tiles from help, against the dragon's hundred and sixty-six. A longer
  // journey than the dragon's and a different KIND of journey -- long, but
  // not lawless. The Greenwood's far end had no reason to be visited at all.
  //
  // The web is built as landmarks, because it should be a place you arrive at
  // rather than a monster standing in a clearing. You see the wood change
  // before you see what changed it.
  {
    let seat = null, bestD = -1
    const towns = settlementsOf(g)
    for (let y = 8; y < H - 8; y += 4) for (let x = 8; x < W - 8; x += 4) {
      if (biomeAt(g, x, y) !== 'greenwood') continue
      if (blockedAt(g, x, y) || isWater(g, x, y) || !free(x, y)) continue
      let near = 1e9
      for (const t of towns) { const d = Math.hypot(t.x - x, t.y - y); if (d < near) near = d }
      if (near > bestD) { bestD = near; seat = { x, y } }
    }
    if (seat) {
      E.addMob(w, 'the-spider', 'great-spider', seat.x, seat.y)
      taken.add(key(seat.x, seat.y))
      // the web: thick at the middle, thinning outward, on the trees
      let strands = 0
      for (let i = 0; i < 260 && strands < A(30); i++) {
        const hh = H32('spiderweb', i)
        const rad = 2 + (hh[0] % 11)
        const ang = (hh.readUInt16BE(1) / 65536) * Math.PI * 2
        const x = Math.round(seat.x + Math.cos(ang) * rad)
        const y = Math.round(seat.y + Math.sin(ang) * rad * 0.8)
        if (!free(x, y) || blockedAt(g, x, y) || isWater(g, x, y)) continue
        taken.add(key(x, y)); put('web-' + i, 'landmark', x, y, { kind: 'web' }); strands++
      }
      // and the things caught in it, which is how you know what this is
      let husks = 0
      for (let i = 0; i < 90 && husks < A(6); i++) {
        const hh = H32('spiderhusk', i)
        const rad = 3 + (hh[0] % 8)
        const ang = (hh.readUInt16BE(1) / 65536) * Math.PI * 2
        const x = Math.round(seat.x + Math.cos(ang) * rad)
        const y = Math.round(seat.y + Math.sin(ang) * rad * 0.8)
        if (!free(x, y) || blockedAt(g, x, y) || isWater(g, x, y)) continue
        taken.add(key(x, y)); put('husk-' + i, 'landmark', x, y, { kind: 'bone-pile' }); husks++
      }
      const sx = seat.x, sy = seat.y + 12
      if (free(sx, sy) && !blockedAt(g, sx, sy) && !isWater(g, sx, sy)) {
        taken.add(key(sx, sy))
        put('spider-sign', 'signpost', sx, sy, { text: 'the wood ends here \u00b7 go back or go together' })
      }
      counts.spiderWeb = strands
    }
  }

  // ---- THE DRAGON ----
  //
  // One. Not a kind of thing that spawns in the Wilds -- a thing that is
  // there, like the Barrow and the Ring and the Brandline.
  //
  // It sits deep in the west, as far past the Brand as there is land to put
  // it on, because the walk is meant to be a decision. Nobody arrives at the
  // dragon by accident, and nobody who arrives is safe from the people they
  // brought.
  {
    let best = null
    for (let i = 0; i < 4000; i++) {
      const hh = H32('thedragon', i)
      const x = 4 + (hh.readUInt16BE(0) % Math.max(1, Math.round(W * 0.16)))
      const y = 4 + (hh.readUInt16BE(2) % (H - 8))
      if (biomeAt(g, x, y) !== 'wilds') continue
      if (!free(x, y) || blockedAt(g, x, y) || isWater(g, x, y)) continue
      // room to fight it: a clear ring, or several citizens cannot stand
      let room = 0
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++)
        if (!blockedAt(g, x + dx, y + dy) && !isWater(g, x + dx, y + dy)) room++
      if (room < 22) continue
      // deep, but not against the wall: the world's edge is not a place, and
      // a dragon backed into the border cannot be surrounded. Aim for the
      // western reaches and take the candidate nearest that mark.
      const want = Math.round(W * 0.055)
      if (!best || Math.abs(x - want) < Math.abs(best.x - want)) best = { x, y }
    }
    if (best) {
      taken.add(key(best.x, best.y))
      E.addMob(w, 'the-dragon', 'dragon', best.x, best.y)
      counts.dragon = 1
      // a warning at the edge of the country, for anyone who can read
      for (let r = 6; r < 30; r++) {
        const sx = best.x + r, sy = best.y
        if (free(sx, sy) && !blockedAt(g, sx, sy) && !isWater(g, sx, sy)) {
          taken.add(key(sx, sy))
          put('dragon-warning', 'signpost', sx, sy,
            { text: 'no further \u00b7 the scales turn arrows \u00b7 come with company or not at all' })
          break
        }
      }
    }
  }

  // ---- THE GOBLIN PEN ----
  //
  // The Heartlands is the safe country and safety is dull to walk through.
  // So: a hedged pound on the Anchor-Oxenford road with a dozen goblins in
  // it and four guards outside, taken off the Brand and kept for whatever
  // the city does with them. It is somewhere to stop, it explains why the
  // guards exist, and it is the only place in the home country where you can
  // look a goblin in the eye through a fence.
  {
    const j = junctionsOf(g)
    const cx0 = Math.round((settlementsOf(g).find(t => t.tag === 'anchor').x
                          + settlementsOf(g).find(t => t.tag === 'oxenford').x) / 2)
    const cy0 = Math.round((settlementsOf(g).find(t => t.tag === 'anchor').y
                          + settlementsOf(g).find(t => t.tag === 'oxenford').y) / 2) - 14
    const seat = seatPoint(g, cx0, cy0)
    let gp = 0
    const PW = 11, PH = 8
    for (let dy = 0; dy < PH; dy++) for (let dx = 0; dx < PW; dx++) {
      const x = seat.x + dx - (PW >> 1), y = seat.y + dy - (PH >> 1)
      if (!free(x, y) || blockedAt(g, x, y) || isWater(g, x, y)) continue
      const edge = dx === 0 || dy === 0 || dx === PW - 1 || dy === PH - 1
      const gate = dy === PH - 1 && dx === (PW >> 1)
      if (edge && !gate) { taken.add(key(x, y)); put('pen-' + gp, 'fence', x, y); gp++ }
      else if (!edge && ((dx + dy) % 3 === 0)) {
        taken.add(key(x, y)); E.addMob(w, 'pengob-' + gp, 'goblin', x, y); gp++
      }
    }
    for (const [gx, gy] of [[-(PW >> 1) - 2, 0], [(PW >> 1) + 2, 0], [0, (PH >> 1) + 2], [-2, (PH >> 1) + 2]]) {
      const x = seat.x + gx, y = seat.y + gy
      if (!free(x, y) || blockedAt(g, x, y) || isWater(g, x, y)) continue
      taken.add(key(x, y)); put('penguard-' + gp, 'guard', x, y); gp++
    }
    const sx = seat.x, sy = seat.y + (PH >> 1) + 3
    if (free(sx, sy) && !blockedAt(g, sx, sy)) {
      taken.add(key(sx, sy))
      put('pensign', 'signpost', sx, sy, { text: 'the Goblin Pound  \u00b7  do not feed them' })
    }
    counts.goblinPound = gp
  }

  // ---- PLACES, NOT SCATTER ----
  //
  // A citizen walking this island met a wall, a tree or a rock seven times in
  // ten, and four to six DIFFERENT things within twenty tiles anywhere they
  // stood. Dense and monotonous: something every five paces and always the
  // same something.
  //
  // The answer is not more trees. It is places -- forty tiles of arrangement
  // that read as somewhere rather than something, the way the Goblin Pound
  // does. One or two per country, each built from the nouns that country
  // actually works.
  {
    const L = (id, x, y, kind) => {
      if (!free(x, y) || blockedAt(g, x, y) || isWater(g, x, y)) return false
      taken.add(key(x, y)); put(id, 'landmark', x, y, { kind }); return true
    }
    const N = (id, x, y, type, extra) => {
      if (!free(x, y) || blockedAt(g, x, y) || isWater(g, x, y)) return false
      taken.add(key(x, y)); put(id, type, x, y, extra); return true
    }
    let pl = 0
    // like site(), but it will not settle anywhere the water cannot be seen
    const siteWet = (tag, nomX, nomY, want, build) => site(tag, nomX, nomY, want, build, true)
    const site = (tag, nomX, nomY, want, build, needWater) => {
      // only build where the country agrees -- a charcoal camp in a field is
      // not a charcoal camp -- but search for that country rather than
      // demanding it be exactly where I guessed. The quarry was aimed at
      // 0.90W and the Crags are nowhere near it, so it simply never built
      // and nothing said so.
      let p0 = seatPoint(g, nomX, nomY)
      if (want && biomeAt(g, p0.x, p0.y) !== want) {
        let found = null
        for (let rad = 6; rad <= 150 && !found; rad += 6)
          for (let a2 = 0; a2 < 360 && !found; a2 += 15) {
            const x = Math.round(nomX + Math.cos(a2 * Math.PI / 180) * rad)
            const y = Math.round(nomY + Math.sin(a2 * Math.PI / 180) * rad)
            if (x < 8 || y < 8 || x >= g.worldW - 8 || y >= g.worldH - 8) continue
            if (biomeAt(g, x, y) === want && !blockedAt(g, x, y) && !isWater(g, x, y)) found = { x, y }
          }
        if (!found) return
        p0 = seatPoint(g, found.x, found.y)
        if (biomeAt(g, p0.x, p0.y) !== want) return
      }
      if (needWater) {
        const wetAt = (x, y) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++)
          if (isWater(g, x + dx, y + dy)) return true; return false }
        if (!wetAt(p0.x, p0.y)) {
          let got = null
          for (let rad = 2; rad <= 70 && !got; rad += 2)
            for (let a2 = 0; a2 < 360 && !got; a2 += 12) {
              const x = Math.round(p0.x + Math.cos(a2 * Math.PI / 180) * rad)
              const y = Math.round(p0.y + Math.sin(a2 * Math.PI / 180) * rad)
              if (x < 6 || y < 6 || x >= W - 6 || y >= H - 6) continue
              if (biomeAt(g, x, y) === want && !blockedAt(g, x, y) && !isWater(g, x, y) && wetAt(x, y)) got = { x, y }
            }
          if (!got) return
          p0 = got
        }
      }
      build(p0.x, p0.y, tag)
      pl++
    }

    // THE CHARCOAL CAMP -- the Greenwood, worked
    site('coalcamp', Math.round(W * 0.59), Math.round(H * 0.18), 'greenwood', (cx, cy, t) => {
      for (const [dx, dy] of [[-3,-1],[0,-2],[3,-1],[-2,2],[2,2]]) L(t+'-cl'+dx+dy, cx+dx, cy+dy, 'charcoal-clamp')
      for (const [dx, dy] of [[-5,1],[5,0],[-4,-3],[4,-3],[1,3]]) L(t+'-st'+dx+dy, cx+dx, cy+dy, 'stump')
      L(t+'-lp', cx - 1, cy - 4, 'log-pile'); L(t+'-lp2', cx + 2, cy - 4, 'log-pile')
      N(t+'-fire', cx, cy, 'campfire'); N(t+'-k', cx + 1, cy + 1, 'keeper', { name: keeperName(t, 'burner') })
      N(t+'-sign', cx, cy + 4, 'signpost', { text: 'the charcoal camp \u00b7 burnt slow since the founding' })
    })

    // THE DROWNED VILLAGE -- the Fens took it back
    // Merewick DROWNED: it belongs where the water took it, not on dry fen
    // Merewick DROWNED: seat it where the water actually is, or it is just a
    // village with an odd name.
    siteWet('drowned', Math.round(W * 0.39), Math.round(H * 0.77), 'fens', (cx, cy, t) => {
      for (let i = 0; i < 14; i++) {
        const h2 = H32('drownw', i)
        L(t+'-w'+i, cx + (h2[0] % 13) - 6, cy + (h2[1] % 9) - 4, 'sunken-wall')
      }
      for (const [dx, dy] of [[-5,3],[4,3],[0,4]]) L(t+'-er'+dx, cx+dx, cy+dy, 'eel-rack')
      L(t+'-bell', cx, cy, 'drowned-bell')
      N(t+'-sign', cx + 1, cy + 5, 'signpost', { text: 'they called it Merewick \u00b7 the fen calls it nothing' })
    })

    // THE QUARRY FACE -- the Crags, cut
    site('quarry', Math.round(W * 0.77), Math.round(H * 0.43), 'crags', (cx, cy, t) => {
      for (let i = 0; i < 7; i++) L(t+'-cf'+i, cx - 4 + i, cy - 3, 'cut-face')
      for (const [dx, dy] of [[-4,1],[-1,2],[2,1],[4,2],[0,3]]) L(t+'-sp'+dx+dy, cx+dx, cy+dy, 'spoil-heap')
      L(t+'-cart', cx + 3, cy + 3, 'cart')
      N(t+'-k', cx, cy + 1, 'keeper', { name: keeperName(t, 'quarryman') })
      N(t+'-sign', cx - 1, cy + 4, 'signpost', { text: 'the quarry \u00b7 mind the face' })
    })

    // THE GIBBET CROSSROADS -- the Moor, and a fire kept against it
    site('gibbetx', Math.round(W * 0.35), Math.round(H * 0.23), 'moor', (cx, cy, t) => {
      L(t+'-g1', cx, cy - 2, 'gibbet'); L(t+'-g2', cx + 2, cy - 1, 'gibbet')
      for (const [dx, dy] of [[-3,1],[3,2]]) L(t+'-bp'+dx, cx+dx, cy+dy, 'bone-pile')
      N(t+'-fire', cx, cy + 1, 'campfire'); N(t+'-guard', cx + 1, cy + 2, 'guard')
      N(t+'-sign', cx - 1, cy + 3, 'signpost', { text: 'the gibbet crossing \u00b7 the Brand is west' })
    })

    // THE SHEEP DRIVE -- the Downs
    site('drive', Math.round(W * 0.65), Math.round(H * 0.67), 'downs', (cx, cy, t) => {
      for (let i = 0; i < 9; i++) L(t+'-h'+i, cx - 6 + i, cy - 2, 'hurdle')
      for (let i = 0; i < 7; i++) L(t+'-h2'+i, cx - 5 + i, cy + 3, 'hurdle')
      L(t+'-hay', cx + 4, cy, 'haystack'); L(t+'-hay2', cx + 5, cy + 1, 'haystack')
      L(t+'-cart', cx - 6, cy + 1, 'cart')
      N(t+'-k', cx, cy, 'keeper', { name: keeperName(t, 'drover') })
      N(t+'-sign', cx - 1, cy + 5, 'signpost', { text: 'the drove road \u00b7 shut the hurdles behind you' })
    })

    // THE TROLL CAMP -- the Wilds, and nobody keeping it
    site('trollcamp', Math.round(W * 0.12), Math.round(H * 0.51), 'wilds', (cx, cy, t) => {
      for (const [dx, dy] of [[-3,-1],[2,-2],[3,1],[-2,3],[0,-3]]) L(t+'-bp'+dx+dy, cx+dx, cy+dy, 'bone-pile')
      L(t+'-hearth', cx, cy, 'crude-hearth')
      for (const [dx, dy] of [[-4,2],[4,-1]]) L(t+'-cr'+dx, cx+dx, cy+dy, 'crate')
      for (let i = 0; i < 3; i++) {
        const h2 = H32('trollc', i)
        const x = cx + (h2[0] % 9) - 4, y = cy + (h2[1] % 7) - 3
        if (free(x, y) && !blockedAt(g, x, y)) { taken.add(key(x, y)); E.addMob(w, 'trollcamp-' + i, 'troll', x, y) }
      }
    })
    counts.places = pl
  }

  // ---- WHERE THE DRAGON HAS BEEN ----
  //
  // It respawns every six hours, so most of the time it is not there. Its
  // EVIDENCE can be. A blackened ring, a tree cracked and carbonised, stone
  // gone glassy -- so the rarest thing in the world is present even when it
  // is absent, and the warning is something you read while walking rather
  // than something that arrives when it is already far too late.
  //
  // These are also the only landmarks in this world PLACED BY SOMETHING
  // rather than founded. Everything else was here at the beginning; this was
  // done by a living creature, and it is meant to feel different for it.
  {
    const d = Object.values(w.mobs).find((m) => m.type === 'dragon')
    let sc = 0
    if (d) {
      for (let i = 0; i < A(26); i++) {
        const hh = H32('dragonsign', i)
        // thickest near the dragon, thinning outward: it has been ranging
        const rad = 6 + (hh[0] % 46)
        const ang = (hh.readUInt16BE(1) / 65536) * Math.PI * 2
        const x = Math.round(d.x + Math.cos(ang) * rad)
        const y = Math.round(d.y + Math.sin(ang) * rad * 0.7)
        if (!free(x, y) || blockedAt(g, x, y) || isWater(g, x, y)) continue
        const kind = ['scorched-ring', 'burnt-tree', 'glass-stone', 'burnt-tree'][hh[3] % 4]
        taken.add(key(x, y)); put('dragonsign-' + i, 'landmark', x, y, { kind }); sc++
      }
    }
    counts.dragonSign = sc
  }

  // ---- THE MILL ----
  //
  // Grain has been in the ledger since the first founding and the economy
  // has had no face. A mill is that face, and it is TALL: the first thing in
  // this world genuinely useful for navigation, the way you orient by a
  // church spire across fields. Two of them, on the corn country.
  {
    let mills = 0
    for (const [tag, fx, fy] of [['downs', 0.65, 0.67], ['heart', 0.44, 0.47]]) {
      for (let i = 0; i < 600 && mills < 2; i++) {
        const hh = H32('mill' + tag, i)
        const x = Math.round(W * fx) + (hh.readUInt16BE(0) % 90) - 45
        const y = Math.round(H * fy) + (hh.readUInt16BE(2) % 70) - 35
        const b2 = biomeAt(g, x, y)
        if (b2 !== 'downs' && b2 !== 'heartlands') continue
        if (!free(x, y) || blockedAt(g, x, y) || isWater(g, x, y)) continue
        // it must be SEEN: open ground around it, not tucked in a wood
        let open = 0
        for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++)
          if (!blockedAt(g, x + dx, y + dy) && !isWater(g, x + dx, y + dy)) open++
        if (open < 44) continue
        taken.add(key(x, y)); put('mill-' + tag, 'landmark', x, y, { kind: 'mill' })
        const kx = x + 1, ky = y
        if (free(kx, ky) && !blockedAt(g, kx, ky)) {
          taken.add(key(kx, ky)); put('mill-' + tag + '-k', 'keeper', kx, ky, { name: keeperName(tag, 'miller') })
        }
        mills++; break
      }
    }
    counts.mills = mills
  }

  // ---- MILESTONES ----
  //
  // The roads are ROUTED -- deliberately, around the Barrow and over the
  // fords -- and nothing in the world ever showed it. A stone every so often
  // makes the routing visible, and turns a road from a texture into
  // something somebody built.
  //
  // Sampled from the roadside itself: drawn uniformly over the island it
  // found three of twenty-two, because roads are a thin thing on a wide map.
  {
    const roadside = []
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
      if (onRoad(g, x, y) || !free(x, y) || blockedAt(g, x, y) || isWater(g, x, y)) continue
      if (onRoad(g, x - 1, y) || onRoad(g, x + 1, y) || onRoad(g, x, y - 1) || onRoad(g, x, y + 1))
        roadside.push((y << 12) | x)
    }
    let ms = 0
    // spaced along the way rather than clustered: a milestone every so often
    for (let i = 0; i < A(24) && roadside.length; i++) {
      const hh = H32('milestone', i)
      const c = roadside[hh.readUInt32BE(0) % roadside.length]
      const x = c & 0xfff, y = c >> 12
      if (!free(x, y)) continue
      let tooNear = false
      for (const [ox, oy] of (counts._msAt ?? []))
        if (Math.abs(ox - x) + Math.abs(oy - y) < 26) { tooNear = true; break }
      if (tooNear) continue
      taken.add(key(x, y)); put('milestone-' + ms, 'landmark', x, y, { kind: 'milestone' })
      ;(counts._msAt ??= []).push([x, y]); ms++
    }
    delete counts._msAt
    counts.milestones = ms
  }

  // ---- SCARECROWS ----
  //
  // A plot on its own is a texture. A plot with something standing over it is
  // a FARM, and somebody's.
  {
    let sc = 0
    const plots = Object.values(w.nodes).filter((n) => n.type === 'plot')
    for (let i = 0; i < plots.length && sc < A(12); i++) {
      const pl = plots[(i * 7) % plots.length]
      for (const [dx, dy] of [[0, -2], [2, 0], [0, 2], [-2, 0]]) {
        const x = pl.x + dx, y = pl.y + dy
        if (!free(x, y) || blockedAt(g, x, y) || isWater(g, x, y)) continue
        taken.add(key(x, y)); put('scarecrow-' + sc, 'landmark', x, y, { kind: 'scarecrow' }); sc++
        break
      }
    }
    counts.scarecrows = sc
  }

  // ---- THE CRAGS: CUT, WORKED, AND DEFENDED ----
  //
  // Trolls live here and somebody has clearly tried to do something about
  // it. Barricades where the ground narrows, a siege engine or two left
  // where it was dragged, and the mouths of workings going into the rock --
  // the crags should read as a place with a history of being fought over,
  // not as a field of identical spoil heaps.
  {
    const inCrags = (x, y) => B(x, y) === 'crags'
    counts.cragBarricades = scatterIn('cragbar', A(14), inCrags, (id, x, y) =>
      put(id, 'landmark', x, y, { kind: 'barricade' }), 2)
    counts.siege = scatterIn('siege', A(3), (x, y) => {
      if (!inCrags(x, y)) return false
      let open = 0                       // it had to be dragged here
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++)
        if (!blockedAt(g, x + dx, y + dy) && !isWater(g, x + dx, y + dy)) open++
      return open >= 20
    }, (id, x, y) => put(id, 'landmark', x, y, { kind: 'siege-engine' }), 2)
    // a working goes INTO the rock: the tile must sit against blocked ground
    counts.caves = scatterIn('cave', A(5), (x, y) => {
      if (!inCrags(x, y)) return false
      return blockedAt(g, x + 1, y) || blockedAt(g, x - 1, y)
          || blockedAt(g, x, y + 1) || blockedAt(g, x, y - 1)
    }, (id, x, y) => put(id, 'landmark', x, y, { kind: 'cave-mouth' }), 2)
  }

  // ---- CAIRNS FOR THE ONES WHO DID NOT COME BACK ----
  //
  // A cairn is raised by a SURVIVOR. That single fact decides where they can
  // be: they thin as you go west, because the deeper somebody fell, the less
  // likely anyone was left to stack stones over them.
  //
  // So they crowd the first miles past the Brand -- where a party still had
  // somebody standing when it went wrong -- and they stop well short of the
  // dragon, because nothing that dies out there gets buried. Walking west
  // you watch them thin out, and that is the whole warning: it is not that
  // the danger rises, it is that the witnesses run out.
  {
    const brand = brandX(g, Math.round(H / 2))
    const dragon = Object.values(w.mobs).find((m) => m.type === 'dragon')
    let cn = 0
    for (let i = 0; i < A(320) && cn < A(26); i++) {
      const hh = H32('lostcairn', i)
      const x = 3 + (hh.readUInt16BE(0) % Math.max(1, brand - 6))
      const y = 3 + (hh.readUInt16BE(2) % (H - 6))
      if (biomeAt(g, x, y) !== 'wilds') continue
      if (!free(x, y) || blockedAt(g, x, y) || isWater(g, x, y)) continue
      // thinning westward: near the Brand almost always, deep in almost never
      const depth = (brand - x) / Math.max(1, brand)          // 0 at the stones, 1 at the far shore
      if ((hh[3] / 255) > (1 - depth * depth * 1.15)) continue
      // and never in the dragon's reach: nobody came back from there to build
      if (dragon && Math.hypot(x - dragon.x, y - dragon.y) < 34) continue
      taken.add(key(x, y)); put('lostcairn-' + cn, 'landmark', x, y, { kind: 'cairn' }); cn++
    }
    counts.lostCairns = cn
  }

  // ---- THE LINE BEFORE THE WILDS ----
  //
  // Norwick is the garrison and the Brandline is the law, and until now
  // nothing on the ground said anyone had ever tried to hold it. Barricades
  // along the approach -- scattered, never a wall, because the Brand is a
  // line you cross and not a door anyone can shut.
  {
    const brand = brandX(g, Math.round(H / 2))
    counts.brandBarricades = scatterIn('brandbar', A(18), (x, y) => {
      if (x < brand + 2 || x > brand + 26) return false      // east of the stones, in the approach
      return B(x, y) !== 'sea' && !onRoad(g, x, y)           // never blocking the road itself
    }, (id, x, y) => put(id, 'landmark', x, y, { kind: 'barricade' }), 2)
  }

  // ---- THE COUNTRY'S OWN TEXTURE ----
  //
  // The first pass of this scattered eighteen nouns and did too well: a
  // hundred and fifty-five stumps, a hundred and eighty-two bone-piles, a
  // hundred and forty-two haystacks. That is not a rich world, it is the
  // same object over and over, and repetition is exactly what makes a place
  // read as GENERATED rather than found.
  //
  // The tick pays per node and nothing for how many kinds there are. So:
  // FEWER OF EACH, and the surplus spent on more kinds and on places.
  //
  // And the water things go in the water. Seventy of seventy-three eel-racks
  // stood on dry land, three of four shipwrecks were in the DOWNS, and a
  // wall called sunken sat on a hill. A rack for drying eels needs a river
  // more than the fens need seventy racks.
  {
    const lm = (kind) => (id, x, y) => put(id, 'landmark', x, y, { kind })
    const inC = (c) => (x, y) => B(x, y) === c
    const wet = (r) => (x, y) => {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++)
        if (isWater(g, x + dx, y + dy)) return true
      return false
    }
    const both = (a2, b2) => (x, y) => a2(x, y) && b2(x, y)
    // HALVED. This block is the island's wallpaper: sixteen scatters that
    // between them laid 370 landmarks over open country, which is most of
    // why v4 could not put a tile further than 108 from one. Every count
    // here is v4's, taken at one half. The authored things -- the capes,
    // the Ring, the Wreck, the dragon's signs, the milestones that name the
    // next two towns, everything a town's drawing carries -- are NOT in
    // this block and are not touched. Half the wallpaper, all the pictures.
    const AH = (n) => Math.max(1, Math.round(A(n) / 2.6))
    // and no scatter may fall in a quiet quarter. A resource still may: a
    // bare tract is somewhere with nothing worth STOPPING for, not a place
    // stripped of its trees.
    const q0 = (pred) => (x, y, h) => !inQuietQuarter(g, x, y) && pred(x, y, h)
    const t0 = counts
    // the wood, worked
    t0.stumps   = scatter('stump',   AH(46), q0(inC('greenwood')), lm('stump'))
    t0.logpiles = scatter('logpile', AH(18), q0(inC('greenwood')), lm('log-pile'))
    t0.clamps   = scatter('clamp',   AH(11), q0(inC('greenwood')), lm('charcoal-clamp'))
    // the quarry
    t0.spoil    = scatter('spoil',   AH(38), q0(inC('crags')),     lm('spoil-heap'))
    t0.cutface  = scatter('cutface', AH(16), q0(inC('crags')),     lm('cut-face'))
    // what the Wilds leaves
    t0.bones    = scatter('bonep',   AH(44), q0(inC('wilds')),     lm('bone-pile'))
    t0.hearths  = scatter('crudeh',  AH(12), q0(inC('wilds')),     lm('crude-hearth'))
    // the farm country
    t0.hay      = scatter('hay',     AH(26), q0(inC('downs')),     lm('haystack'))
    t0.hurdles  = scatter('hurdle',  AH(30), q0(inC('downs')),     lm('hurdle'))
    t0.hayhome  = scatter('hayh',    AH(18), q0(inC('heartlands')), lm('haystack'))
    t0.carts    = scatter('cart',    AH(16), q0((x, y) => {
      const b2 = B(x, y); return (b2 === 'heartlands' || b2 === 'downs') && !onRoad(g, x, y) }), lm('cart'))
    // the moor
    t0.gibbets  = scatter('gibb',    AH(9),  q0(inC('moor')),      lm('gibbet'))
    t0.moorbone = scatter('mbone',   AH(14), q0(inC('moor')),      lm('bone-pile'))
    // THE FEN, AT THE WATER'S EDGE and nowhere else
    t0.eelracks = scatterIn('eelr',  AH(22), both(q0(inC('fens')), wet(2)), lm('eel-rack'))
    t0.sunken   = scatterIn('sunkw', AH(20), both(q0(inC('fens')), wet(2)), lm('sunken-wall'))
    // CRATES ON THE SHORE, wherever cargo is landed
    t0.crates   = scatterIn('crate', AH(30), both(q0(() => true), wet(2)), lm('crate'))
  }

  // ---- waystones ----
  const putWaystone = (id, x, y) => {
    for (let rad = 0; rad < 10; rad++) for (const [dx, dy] of [[0,rad],[rad,0],[0,-rad],[-rad,0],[rad,rad],[-rad,-rad]]) {
      const nx = x + dx, ny = y + dy
      if (inB(nx, ny) && !taken.has(key(nx, ny)) && !isWater(g, nx, ny) && !onRidge(g, nx, ny)
        && !onBarrow(g, nx, ny) && biomeAt(g, nx, ny) !== 'sea') { put(id, 'waystone', nx, ny); return true }
    }
    return false
  }
  for (const s of ss) putWaystone('waystone-' + s.tag, s.x, rectOf(s).y1 + 4)
  const j = junctionsOf(g)
  putWaystone('waystone-watersmeet', j.watersmeet.x + 4, j.watersmeet.y + 4)
  putWaystone('waystone-npass', j.npass.x + 5, j.npass.y)
  putWaystone('waystone-spass', j.spass.x + 5, j.spass.y)
  for (const [tag, x, y] of [
    ['wildsnorth', Math.round(W*0.11), Math.round(H*0.20)],
    ['wildssouth', Math.round(W*0.11), Math.round(H*0.72)],
    ['wildsdeep',  Math.round(W*0.05), Math.round(H*0.48)],
    ['cragshigh',  Math.round(W*0.90), Math.round(H*0.30)],
    ['greendeep',  Math.round(W*0.58), Math.round(H*0.07)],
    ['stillwater', Math.round(W*0.75), Math.round(H*0.26)],
    ['fensdeep',   Math.round(W*0.54), Math.round(H*0.90)],
    ['downsedge',  Math.round(W*0.74), Math.round(H*0.72)],
    ['moorhigh',   Math.round(W*0.29), Math.round(H*0.16)],
    ['thering',    Math.round(W*0.36), Math.round(H*0.69)],
  ]) putWaystone('waystone-' + tag, x, y)

  // ---- the quiet quarters, enforced ----
  // Gating every pass individually was tried and leaked: waysides clipped a
  // rim, a lost cairn fell inside, a barricade. One sweep at the end is
  // total and easy to reason about. It removes LANDMARKS only -- resources,
  // mobs and terrain are untouched, because a bare tract is somewhere with
  // nothing worth stopping for, not a place stripped of its trees -- and it
  // never removes anything a hand placed (QUIET_KEEPS).
  {
    const quarters = quietQuartersOf(g)
    let swept = 0
    for (const id of Object.keys(w.nodes).sort()) {
      const n = w.nodes[id]
      if (n.type !== 'landmark') continue
      if (QUIET_KEEPS.some(k => id.startsWith(k))) continue
      let inside = false
      for (const q of quarters) {
        const dx = n.x - q.x, dy = n.y - q.y
        if (dx * dx + dy * dy < q.r * q.r) { inside = true; break }
      }
      if (!inside) continue
      delete w.nodes[id]; swept++
    }
    counts.quietQuarters = quarters.length
    counts.quietSwept = swept
  }

  const serr = E.validateState(w)
  if (serr) throw new Error('worldgen produced an invalid state (' + serr + ') founding aborted')
  w._composition = counts

  for (const c9 of (g.imported ?? [])) {
    if (!/^[0-9a-f]{64}$/.test(c9.pid ?? '')) continue
    const sp9 = spawnDry(g)
    E.addPlayer(w, c9.pid, sp9.x, sp9.y)
    const p9 = w.players[c9.pid]
    for (const k9 of Object.keys(p9.skills)) if (c9.skills?.[k9] !== undefined) p9.skills[k9] = c9.skills[k9]
    p9.hp = Math.min(c9.hp ?? p9.hp, E.levelForXp(p9.skills.hitpoints))
    ;(c9.inventory ?? []).forEach((sl9, i9) => { if (i9 < p9.inventory.length) p9.inventory[i9] = sl9 ?? null })
    p9.equipment.weapon = c9.weapon ?? null
    for (const [it9, q9] of Object.entries(c9.bank ?? {})) p9.bank[it9] = q9
    if (c9.name != null) { w.names[c9.name] = c9.pid; p9.name = c9.name }
  }

  // ---- final sweep: nothing gatherable where nobody can ever stand ----
  {
    const GATHER = new Set(['rock', 'tree', 'fishing-spot', 'magic-rock'])
    // A TREE BLOCKS MOVEMENT. This set is the engine's _WALKABLE_BUILT and
    // nothing else. The first version of this sweep also skipped gatherables
    // -- reasoning, wrongly, that you only ever need to stand BESIDE a tree
    // -- and so flood-filled straight through woodland. It therefore judged
    // everything reachable, including three things the greenwood had sealed
    // in a ring of its own trees. The two questions are different: "can I
    // stand next to it" is what the forward sweep asks about a resource;
    // "can I get there at all" is this, and a tree answers no.
    const WALKABLE_BUILT = new Set(['brewpot', 'watchfire', 'fire'])
    const solidTile = new Set()
    for (const n of Object.values(w.nodes)) if (!WALKABLE_BUILT.has(n.type)) solidTile.add(n.x + ',' + n.y)
    const sp5 = spawnDry(g)
    const walkThru = (x, y) => x >= 0 && y >= 0 && x < W && y < H && !blockedAt(g, x, y) && !solidTile.has(x + ',' + y)
    // EIGHT directions, because the engine's move rule takes dx,dy in
    // {-1,0,1} -- diagonals included. A four-way flood models a game nobody
    // is playing: it cannot squeeze through a diagonal gap that a citizen
    // walks through without noticing, so it judges huge parts of any wood
    // unreachable and the sweep dutifully deletes them. Two thousand trees
    // died to that mismatch before anyone walked the world to notice.
    const D8 = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]
    const canReach = new Set([sp5.x + ',' + sp5.y]); const q5 = [[sp5.x, sp5.y]]; let h5 = 0
    while (h5 < q5.length) { const [x, y] = q5[h5++]; for (const [dx, dy] of D8) { const nx=x+dx, ny=y+dy, kk=nx+','+ny; if (!canReach.has(kk) && walkThru(nx, ny)) { canReach.add(kk); q5.push([nx, ny]) } } }
    // a resource is fine if you can stand BESIDE it; it is its own blocker,
    // so its own tile will never be in canReach now that trees are solid
    let swept = 0
    for (const [id, n] of Object.entries(w.nodes)) {
      if (!GATHER.has(n.type)) continue
      const beside = [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => canReach.has((n.x+dx) + ',' + (n.y+dy)))
      if (!beside) { delete w.nodes[id]; swept++ }
    }
    counts.sweptUnreachable = swept

    // ---- and the reverse sweep: open a way IN ----
    // The greenwood scatters 1900 trees in clumps, and it runs after the
    // signs and the keepers are placed. free() stops a tree landing ON a
    // signpost; nothing stopped eight of them landing in a ring AROUND
    // one. Three things were walled in on the first honest measurement --
    // a cape sign, a locale post, and the Sawyer's Camp KEEPER, a
    // shopkeeper nobody could reach.
    //
    // Deleting the keeper would be the wrong repair. The forest is the
    // thing that arrived late, so the forest yields: this walks out from
    // each sealed essential through gatherable-only blockers and fells
    // whatever stands between it and open ground. Deterministic -- fixed
    // neighbour order, and it takes the shortest way out, ties broken by
    // the order tiles are reached.
    const ESSENTIAL = new Set(['bank','store','anvil','smith','well','waystone','keeper','signpost','landmark'])
    const nodeAt = new Map()
    for (const [id, n] of Object.entries(w.nodes)) nodeAt.set(n.x + ',' + n.y, id)
    let felled = 0, opened = 0
    for (const [id, n] of Object.entries(w.nodes)) {
      if (!ESSENTIAL.has(n.type)) continue
      const touches = [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => canReach.has((n.x+dx) + ',' + (n.y+dy)))
      if (touches) continue
      // BFS outward, allowed to pass only through tiles whose only obstacle
      // is something that can be cut down or mined out
      const from = new Map([[n.x + ',' + n.y, null]])
      const q6 = [[n.x, n.y]]; let h6 = 0, exit = null
      while (h6 < q6.length && !exit) {
        const [x, y] = q6[h6++]
        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const nx = x + dx, ny = y + dy, kk = nx + ',' + ny
          if (from.has(kk) || nx < 1 || ny < 1 || nx >= W - 1 || ny >= H - 1) continue
          if (blockedAt(g, nx, ny)) continue
          if (canReach.has(kk)) { from.set(kk, x + ',' + y); exit = kk; break }
          const oid = nodeAt.get(kk)
          if (oid && !GATHER.has(w.nodes[oid]?.type)) continue   // a wall stays a wall
          from.set(kk, x + ',' + y); q6.push([nx, ny])
        }
      }
      if (!exit) continue
      for (let k = exit; k; k = from.get(k)) {
        const oid = nodeAt.get(k)
        if (oid && w.nodes[oid] && GATHER.has(w.nodes[oid].type)) { delete w.nodes[oid]; nodeAt.delete(k); felled++ }
        canReach.add(k)
      }
      opened++
    }
    counts.pathsOpened = opened
    counts.felledToOpen = felled
  }
  return w
}
