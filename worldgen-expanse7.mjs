// Interval worldgen: TALLYHOLM, seventh founding (interval-expanse-v7).
//
// v6's LAND is v6's land: the coast, the countries, the river, the ridge, the
// barrow, the lake and every plan are byte-for-byte what they were. Two things
// change, and both are the same bug wearing different clothes -- a placement
// that asked the ground where it could stand and never asked what was already
// standing there.
//
//   1. TOWNS NO LONGER SEAT THEMSELVES INTO EACH OTHER. seatDrawnTown spiralled
//      outward for the first seat the LAND allowed and had no idea another town
//      was already sitting on it. Measured over 150 foundings of v6: 9.3% put
//      two towns' walls through each other and 48% broke the shire's own stated
//      55-tile spacing band. Millbrook was in every collision, because its
//      nominal seat is `riverX + 16` -- a number chosen when its drawing was 28
//      tiles wide. The v6 market square made it 52, so its west third sat in
//      the Great River and the dry-spiral shoved it fifteen to twenty tiles
//      east into Anchor's approaches at EVERY seed.
//
//      Now: the nominal seat is derived from the drawing's own width, the towns
//      are seated in a fixed order, and each one must clear every town already
//      seated by CLEAR_GAP tiles of open ground. Still a pure function of
//      (seed, size) -- no clock, no randomness, same answer on every machine --
//      but a function that cannot produce two towns in one place.
//
//   2. NO STALL STANDS OUTSIDE ITS OWN TOWN. When a market's drawing had no
//      spare house, the seater walked a ring OUTSIDE the walls and put the
//      trader on the verge -- Millbrook's delver ended up a tile north of the
//      rampart, in a field. A market square is reserved open ground INSIDE the
//      walls and is exactly where a stall belongs; it is now searched before
//      anyone is sent outdoors, and the outdoor ring survives only as a last
//      resort that no seed in the sweep reaches.
//
// Per PRELAUNCH-AUDIT 6 this ships as a NEW GENERATOR ID. A v6 world keeps its
// country to the tile; a founding that wants these fixes crosses into v7, and
// citizens cross with it whole.
//
// --- what follows is v6's own header, unchanged ---
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
//      six of which are single-tile "hearth". You cannot get lost in Anchor,
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
import { seedNum, meander as _meander, thash as _thash } from './worldgen-expanse.mjs'

// ---------------------------------------------------------------------------
// THE ISLAND IS FROZEN
// ---------------------------------------------------------------------------
// Tallyholm is not a generator any more. It is a DESCRIPTION.
//
// Everything about the land -- the coast, the countries, the Great River, the
// Ridge, the Barrow, the lake, where every town seats itself, where every
// place and holding stands, where the last tree in the Greenwood grows -- is
// computed from ONE founding seed, whatever seed a pillar is actually founded
// with. Two consequences, both wanted:
//
//   A world founded tomorrow with a different INTERVAL_SEED is a DIFFERENT
//   WORLD -- its own ledger, its own worldId, its own history -- standing on
//   THE SAME ISLAND. Which is how the game this one is measured against always
//   worked: many worlds, one map.
//
//   And therefore a chart drawn by one citizen is true for every citizen in
//   every world, forever. "Meet me at the Nine Stones" means something across
//   servers. Directions survive. A procedural island fragments that knowledge
//   into as many maps as there are seeds, and no one of them is ever worth
//   learning by heart.
//
// It also ends, by construction, the entire class of fault this founding spent
// its life on: a seater that collides with what is already there cannot
// surprise anybody twice, because there is only one arrangement and a person
// has looked at it.
//
// The seed below is the one this island was computed from and must never
// change: changing it is not a tuning, it is a different country, and it wants
// a new generator id.
export const TALLYHOLM_SEED = 'solo-50'
const ISLE = (g) => (g && g.genesisSeed === TALLYHOLM_SEED ? g
  : { ...g, genesisSeed: TALLYHOLM_SEED })
const thash = (g, x, y, k) => _thash(ISLE(g), x, y, k)
const meander = (g, tag, u, seg, amp) => _meander(ISLE(g), tag, u, seg, amp)
import { angleOf } from './worldgen-expanse3.mjs'
import { PLACES_V7, PLACE_MOBS, PLACE_INSIDE } from './worldgen-places-v7.mjs'
import { HOLDINGS, HOLDING_NAMES, HOLDING_SEATS } from './worldgen-holdings-v7.mjs'
import { FIELDS_V7 } from './worldgen-fields-v7.mjs'
import { COUNTRY_WORKS, COUNTRY_SEATS, DROVE, TRACKS, QUAYS } from './worldgen-country-v7.mjs'
import { WATERS, BECKS, BECK_FORDS, BECK_PLANKS, SHAPE_K } from './worldgen-water-v7.mjs'
import { CAMPS } from './worldgen-camps-v7.mjs'
import { RESIDENTS } from './worldgen-residents-v7.mjs'
import { SEAMS } from './worldgen-seams-v7.mjs'
import { PLANS5_V6 as PLANS, PLACES, layPlan, validatePlan, checkPlanConnected, isIndoor,
         seatCoastalPlan, quayTilesOfPlan, PLAN_ROOMS, LEGEND_V6 } from './worldgen-shire-v6.mjs'
export { seedNum, meander, thash, angleOf }

export const GENERATOR_ID = 'interval-expanse-v7'
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
  // §6ao (v6): the Wilds Head was `amt: +0.30`, which pushed the due-west
  // coastline past x=0 -- the peninsula ran off the edge of the world and was
  // cut by the frame, a hard vertical "hedge and fence" line where an island
  // should taper into sea. At +0.12 the Head is still a long, dramatic frontier
  // cape (the endgame direction, where the dragon and the magic-stone are) but
  // it now ENDS IN WATER, ~9 tiles inside the western margin, on every row.
  // An island ends in the sea on every side; now the Wilds do too.
  { tag: 'wildshead',  name: 'the Wilds Head', u: 180, w: 24, amt: +0.12, mark: 'broken-tower' },
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
    // §7bu: WHITING ISLE, east of the shrine and reachable only by boat.
    //
    // The sea was a border and not a place. An island you can WALK to is a
    // peninsula, so this one has no bridge, no ford and no shallows: a ferry at
    // Eastmere's quay and a ferry on the isle, and nothing else touches it.
    { x: sh + 58, y: ey + 8, rx: 12, ry: 8, tag: 'whiting' },
    // §7cs: THE LISTS, off Fenmarch. A second CROSSING and not a second
    // destination from the same quay -- Eastmere with two boats would be a hub
    // and the ferry would become a coach service.
    //
    // What it is for is a fight that is only about the fight: no armour, no
    // magic, no prayer, and anybody may strike anybody. Every other variable
    // gone, so a maul and a bare blade can be compared honestly.
    { x: 300, y: 452, rx: 9, ry: 6, tag: 'lists' },
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
  // v7: A WALL WITH BOTH ENDS OPEN IS NOT A WALL.
  //
  // Two rules used to stand here, each deliberate and each with a good reason:
  // the ridge "sinks beneath the wood" in the north (the greenwood test) and
  // "dies away into the Downs before it reaches the bay" in the south (y >
  // 0.70H), so that Eastmere had a shore to put piers on. Between them they
  // left the ridge absent on 241 of the island's 433 land rows -- the WHOLE
  // north end and the WHOLE south end -- and the consequence, which nobody
  // chose, was that the two named passes gated nothing at all. Measured: shut
  // the South Pass and it changed ZERO of the forty-five journeys between
  // towns. North Pass, South Pass, and the crags beyond them were scenery.
  //
  // Both reasons are answered better elsewhere now. Eastmere does not need a
  // hole in a mountain to find a shore: the ridge line runs x613-628 at the
  // port's latitudes and the town seats itself at 635-673, so the wall misses
  // it by seven tiles and covers NONE of its 144 quay tiles -- and if a future
  // seed puts them together, seatDrawnTown moves the town, which is the right
  // way round, exactly as this file's own comment argued. The wood keeps its
  // character without swallowing a mountain range.
  //
  // What it costs: ten road tiles that used to cross the line away from a
  // pass. The router walks them round to the gaps, which is what a road does
  // when it meets a mountain.
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
// THE INLAND WATERS. Stillwater, and the hand-drawn meres, tarns, pools and
// becks of worldgen-water-v7.mjs. Memoised as a tile set because this is asked
// once per tile per render and the ellipses are not free.
let _waterSet = null
function inlandSet(g) {
  if (_waterSet) return _waterSet
  const set = new Set()
  // STILLWATER GETS THE SAME TREATMENT. It is the island's oldest water and was
  // still a perfect ellipse, conspicuous now that every mere and tarn round it
  // has a shoreline. It joins the table rather than keeping its own rule --
  // which is also one fewer place for the two to disagree, and the first
  // attempt at this DELETED THE LAKE by leaving `inLake` reading a set the
  // lake had not been added to.
  const ALL = [...WATERS,
    { x: lakeC(g).x, y: lakeC(g).y, rx: 24, ry: 13, kind: 'mere', name: 'Stillwater' }]
  for (let wi = 0; wi < ALL.length; wi++) {
    const w2 = ALL[wi]
    const k = SHAPE_K[w2.kind] ?? 0.24
    // FIVE harmonics, not three, and a tile of roughness on top. Three gave a
    // smooth lobed blob -- better than a circle, still plainly drawn with a
    // compass. The high terms (7, 11) are what put an inlet and a spit on a
    // shoreline, and the last term breaks the rim so it is crenellated tile to
    // tile rather than swept.
    const M = [2, 3, 5, 7, 11], A = [0.55, 0.30, 0.20, 0.12, 0.07]
    const ph = M.map((m) => ((thash(g, wi, m, 907) % 1000) / 1000) * Math.PI * 2)
    const rAt = (a, x, y) => {
      let r = 1
      for (let i = 0; i < M.length; i++) r += k * A[i] * Math.sin(M[i] * a + ph[i])
      return r + ((thash(g, x, y, 911) % 100) / 100 - 0.5) * 0.05
    }
    const pad = Math.ceil(Math.max(w2.rx, w2.ry) * (1 + k)) + 2
    for (let y = w2.y - pad; y <= w2.y + pad; y++)
      for (let x = w2.x - pad; x <= w2.x + pad; x++) {
        const dx = (x - w2.x) / w2.rx, dy = (y - w2.y) / w2.ry
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d === 0) { set.add(x + ',' + y); continue }
        if (d < rAt(Math.atan2(dy, dx), x, y)) set.add(x + ',' + y)
      }
  }
  // the becks, joined tile to tile. A beck leaves a FORD wherever a road
  // crosses it: water that severs a route is a bug wearing a landscape.
  for (const b of BECKS) {
    for (let i = 0; i < b.path.length - 1; i++) {
      let [x, y] = b.path[i]; const [tx, ty] = b.path[i + 1]
      let guard = 0
      while ((x !== tx || y !== ty) && guard++ < 400) {
        set.add(x + ',' + y)
        if (Math.abs(tx - x) >= Math.abs(ty - y)) x += Math.sign(tx - x)
        else y += Math.sign(ty - y)
      }
    }
    const last = b.path[b.path.length - 1]; set.add(last[0] + ',' + last[1])
  }
  for (const [x, y] of BECK_FORDS) set.delete(x + ',' + y)
  _waterSet = set
  return set
}
export function inLake(g, x, y) {
  // Stillwater is in the table now (see inlandSet): one rule for every water.
  // NO ROAD EXCEPTION HERE, and the reason is worth writing down: asking
  // `onRoad` from inside `inLake` is a cycle. Roads are routed by a router
  // that consults isWater, isWater consults inLake, and the whole founding
  // disappears down its own throat -- which it did, first try, with a stack
  // overflow eleven frames deep.
  //
  // So the water is laid FIRST and the router routes around it, finding its
  // own way as it already does round the Barrow and through the passes. Where
  // a beck genuinely severs something the answer is to move the beck by hand,
  // not to teach the water about roads.
  return inlandSet(g).has(x + ',' + y)
}
export function waterNameAt(g, x, y) {
  for (const w2 of WATERS) {
    const dx = (x - w2.x) / (w2.rx + 1), dy = (y - w2.y) / (w2.ry + 1)
    if (dx * dx + dy * dy < 1) return w2.name
  }
  return null
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
// HOW MUCH OPEN GROUND BETWEEN TWO TOWNS. Wall to wall, not centre to centre:
// twelve tiles is a field, and it is the smallest gap at which two settlements
// read as two settlements rather than one town with a seam in it.
export const CLEAR_GAP = 12

// v7: `avoid` is the list of rects already claimed by towns seated before this
// one. A seat that would put this drawing within CLEAR_GAP of any of them is
// not a seat, however dry the ground is.
export function seatDrawnTown(g, tag, nomX, nomY, avoid = []) {
  const k = g.genesisSeed + ':' + g.worldW + 'x' + g.worldH + ':' + tag
    + (avoid.length ? ':' + avoid.map(r => r.x0 + '.' + r.y0 + '.' + r.x1 + '.' + r.y1).join('|') : '')
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
  // v7: does this seat leave every town already standing its own ground?
  const clearOf = (cx, cy) => {
    const x0 = cx - (pw >> 1) - CLEAR_GAP, x1 = cx + (pw >> 1) + CLEAR_GAP
    const y0 = cy - (ph >> 1) - CLEAR_GAP, y1 = cy + (ph >> 1) + CLEAR_GAP
    for (const r of avoid)
      if (x0 <= r.x1 && x1 >= r.x0 && y0 <= r.y1 && y1 >= r.y0) return false
    return true
  }
  const ok = (cx, cy) => {
    if (!clearOf(cx, cy)) return false
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
  // the land refused every seat that was both dry and clear: keep the clearance
  // (two towns in one place is the failure this founding exists to end) and let
  // the connectivity check speak about the ground.
  if (!out) {
    spiral2: for (let rad = 0; rad < 110; rad++)
      for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
        if (clearOf(nomX + dx, nomY + dy) && dryOk(nomX + dx, nomY + dy)) {
          out = { x: nomX + dx, y: nomY + dy }; break spiral2
        }
      }
  }
  // and if even that is impossible, take clear ground over dry ground: a town
  // in a marsh is a bad town, a town inside another town is not a town.
  if (!out) {
    spiral3: for (let rad = 0; rad < 160; rad++)
      for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
        if (clearOf(nomX + dx, nomY + dy)) { out = { x: nomX + dx, y: nomY + dy }; break spiral3 }
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

  // v7: A NOMINAL SEAT DERIVED FROM THE DRAWING, NOT FROM A REMEMBERED WIDTH.
  //
  // Millbrook's seat was `riverX + 16`, and the comment beside it said "the
  // plan is 28 wide". The v6 market square made it 52, and nobody moved the
  // 16: the drawing's west third stood in the Great River at every seed, the
  // dry-spiral shoved the town fifteen to twenty tiles east, and Millbrook
  // arrived on Anchor's doorstep. Ask the drawing how wide it is and put its
  // west wall a few tiles clear of the water, and the number can never go
  // stale again -- redraw the market tomorrow and the seat follows it.
  const RIVER_HALF = 10                     // the Great River's widest half-width
  const westOfRiver = (tag, y, pad = 4) => riverX(g, y) + RIVER_HALF + pad + (P(tag).w >> 1)

  // v7: SEATED IN ORDER, EACH CLEAR OF THE LAST. The capital first (it holds
  // the centre and everything else is described relative to it), then the rest
  // of the shire, then the frontier. Every seat must leave CLEAR_GAP tiles of
  // open ground round every town already standing.
  const S = []
  const claimed = []
  const seat = (spec) => {
    const { tag, nomX, nomY } = spec
    const p = P(tag)
    const at = seatDrawnTown(g, tag, nomX, nomY, claimed.slice())
    const s = { tag: spec.tag, name: spec.name, ...at, ...p, kind: spec.kind, ring: spec.ring }
    if (spec.drawn) s.drawn = true
    claimed.push({ x0: s.x - (s.w >> 1), x1: s.x + (s.w >> 1), y0: s.y - (s.h >> 1), y1: s.y + (s.h >> 1) })
    S.push(s)
    return s
  }

  // ---- THE SHIRE (hand-authored: see worldgen-shire.mjs) ----
  // Anchor stands WEST of the Great River, which runs x456-471 across its
  // latitudes: a drawing cannot know where the water went, so the author
  // places the town clear of it. Spawn (the world's exact centre) still
  // falls inside, by the east gate, with the river beyond.
  seat({ tag: 'anchor', name: 'Anchor', nomX: cx, nomY: cy, kind: 'capital', ring: 'shire' })
  // Millbrook stands with the river along its WEST wall, not through its
  // middle -- and now says so in terms of its own drawing.
  seat({ tag: 'millbrook', name: 'Millbrook', nomX: westOfRiver('millbrook', mby), nomY: mby,
         kind: 'market', ring: 'shire' })
  seat({ tag: 'oxenford', name: 'Oxenford', nomX: cx - 104, nomY: oxy + 10, kind: 'crossing', ring: 'shire' })
  seat({ tag: 'thornbury', name: 'Thornbury', nomX: cx + 78, nomY: cy - 34, kind: 'forge', ring: 'shire' })
  // Hollybarrow sits a full field west of the river, not in Millbrook's
  // lap: the shire's spacing band is 55 to 90 tiles (33 to 54 seconds),
  // which is RuneScape's Lumbridge-to-Draynor and Draynor-to-Port Sarim.
  // Closer than that and two towns read as one town with a gap in it.
  seat({ tag: 'hollybarrow', name: 'Hollybarrow', nomX: cx - 96, nomY: cy - 52, kind: 'farm', ring: 'shire' })
  // ---- THE FRONTIER ----
  // Every settlement on the island is DRAWN now. "Slightly generic is
  // correct for a frontier outpost" was a rationalisation for not doing
  // the work: a frontier town is the payoff at the end of a four-minute
  // walk, and a generic place you ARRIVED at is a broken promise.
  seat({ tag: 'greenhollow', name: 'Greenhollow', nomX: Math.round(W * 0.42), nomY: Math.round(H * 0.12),
         kind: 'timber', ring: 'frontier', drawn: true })
  seat({ tag: 'cragfoot', name: 'Cragfoot', nomX: Math.round(W * 0.87), nomY: Math.round(H * 0.44),
         kind: 'mine', ring: 'frontier', drawn: true })
  // Eastmere is DRAWN (worldgen-shire.mjs) even though it is a frontier
  // town: a port is the most characterful thing on an island and a
  // generated one never will be. It seats itself against the real bay.
  seat({ tag: 'eastmere', name: 'Eastmere', nomX: shore - 14, nomY: ey, kind: 'port', ring: 'frontier', drawn: true })
  seat({ tag: 'fenmarch', name: 'Fenmarch', nomX: westOfRiver('fenmarch', Math.round(H * 0.83), -3),
         nomY: Math.round(H * 0.83), kind: 'port', ring: 'frontier', drawn: true })
  seat({ tag: 'norwick', name: 'Norwick', nomX: brandX(g, Math.round(H * 0.47)) + 18, nomY: Math.round(H * 0.47),
         kind: 'garrison', ring: 'frontier', drawn: true })

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
// the planks over the becks, and the quays at Eastmere: both are decking, and
// decking is water you can walk on
const _plankSet = new Set(BECK_PLANKS.map(([x, y]) => x + ',' + y))
for (const q of QUAYS) {
  for (let i = 0; i < q.path.length - 1; i++) {
    let [x, y] = q.path[i]; const [tx, ty] = q.path[i + 1]
    let guard = 0
    while ((x !== tx || y !== ty) && guard++ < 60) {
      _plankSet.add(x + ',' + y)
      if (Math.abs(tx - x) >= Math.abs(ty - y)) x += Math.sign(tx - x)
      else y += Math.sign(ty - y)
    }
  }
  const last = q.path[q.path.length - 1]; _plankSet.add(last[0] + ',' + last[1])
}
export function onBridge(g, x, y) {
  // §13f: the planks over the becks. Cheap, first, and it makes blockedAt and
  // groundKindAt both agree that a crossing is decking.
  if (_plankSet.has(x + ',' + y)) return true
  // A BRIDGE IS A SPAN, NOT A RECTANGLE.
  //
  // This stamped a nine-by-five block of deck at each crossing, so wherever a
  // diagonal river passed through that block the walkable water came out as a
  // ragged diagonal patch. It read as neither a bridge nor a ford -- just an
  // oddly-shaped hole in the river -- and no amount of plank texture in a
  // window could fix a shape that was wrong in the world.
  //
  // A bridge crosses the water and stops: two tiles wide, spanning exactly as
  // far as the water runs on that line, with two tiles of abutment on each
  // bank. The four river crossings span east-west; the Oxenford crosses the
  // march, which itself runs east-west, so that one is spanned north-south.
  for (const b of bridgesOf(g)) {
    if (Math.abs(x - b.x) > 16 || Math.abs(y - b.y) > 16) continue
    if (b.tag !== 'brm') {
      if (y - b.y > 1 || b.y - y > 1) continue
      // §7v: A DECK IS A RECTANGLE.
      //
      // Each row used to span exactly as far as the water ran ON THAT ROW,
      // which is right for a straight channel and wrong where two waters meet.
      // At the Watersmeet the march joins the river, the water runs diagonally
      // across the crossing, and the deck came out ragged: continuous on one
      // row and leaving open water beside it on the next two. You could cross,
      // on one row of three, and it read as a blob rather than a bridge --
      // which is verbatim the fault this function's own note describes from an
      // earlier version, fixed for straight channels and never checked at the
      // one crossing where two waters meet.
      //
      // So the span is measured across ALL the deck's rows and the widest run
      // wins. A bridge is one shape.
      let w = b.x, e = b.x
      for (let ry = b.y - 1; ry <= b.y + 1; ry++) {
        let w2 = b.x, e2 = b.x
        while (w2 > 3 && isWater(g, w2 - 1, ry)) w2--
        while (e2 < g.worldW - 4 && isWater(g, e2 + 1, ry)) e2++
        if (w2 < w) w = w2
        if (e2 > e) e = e2
      }
      if (x >= w - 2 && x <= e + 2) return true
    } else {
      if (x - b.x > 1 || b.x - x > 1) continue
      let n = b.y, s2 = b.y
      while (n > 3 && isWater(g, x, n - 1)) n--
      while (s2 < g.worldH - 4 && isWater(g, x, s2 + 1)) s2++
      if (y >= n - 2 && y <= s2 + 2) return true
    }
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

// ---------------------------------------------------------------------------
// THE GOING
// ---------------------------------------------------------------------------
// A road runs dead straight because there is nothing for it to bend around.
// Cost is uniform WITHIN a biome, so across the Heartlands or the Downs every
// tile is worth the same and the cheapest path is the shortest one -- and the
// straight-line pull below then finishes the job. The result is a ruler line
// across a country, which is a surveyor's road, and this generator's own
// comment says it does not want one.
//
// So the ground gets texture at a scale smaller than a country: patches of
// easier and harder going, eight tiles across, the way real ground is boggy
// here and firm there. A road that costs a little more through a soft patch
// goes round it, and the bends come from the land rather than from a wobble
// laid over the top.
//
// INTEGERS ONLY, and no Math.sin. This value feeds the router's frontier, and
// the router's contract (spec 9b) is that two nodes computing the same world
// get the same road to the tile. Trigonometry is not bit-identical across
// engines; a 32-bit integer hash is.

// ---------------------------------------------------------------------------
// THE LIE OF THE LAND
// ---------------------------------------------------------------------------
// The going alone was not enough, and the render says so: several roads came
// out exactly as long as the straight line between their ends. Patches of soft
// ground eight tiles across average out over two hundred tiles, so the router
// walked through them and stayed on its ruler.
//
// What makes a real road wander is not soft ground, it is HEIGHT. A road would
// rather go a long way round than climb, which is why they follow valleys and
// contour along hillsides and arrive at a pass rather than at a summit. So the
// land is given a height, and a step is charged for what it climbs.
//
// The field is smooth -- bilinear between lattice points thirty-two tiles
// apart -- because a road follows a slope, and a slope needs somewhere to run
// downhill TO. A blocky field gives cliffs and cliffs give staircases.
//
// Integers throughout, and no trigonometry: this decides where the roads are,
// and spec 9b says two nodes computing the same world must get the same road.
const ELEV_SHIFT = 5;                                    // 32 tiles per lattice step
function elevHash(salt, gx, gy) {
  let h = (Math.imul(gx, 1597334677) + Math.imul(gy, 3812015801) + salt) | 0;
  h = Math.imul(h ^ (h >>> 15), 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 3266489917) | 0;
  return (h ^ (h >>> 16)) & 255;
}
function elevAt(salt, x, y) {
  // TWO OCTAVES. One lattice at thirty-two tiles gives a landscape of broad
  // hills -- and between them, flats, where a road has nothing to respond to
  // and runs dead straight for sixty tiles. Sixty tiles is nearly forty
  // seconds of walking with the world unchanging, which is the exact stretch
  // that feels drawn rather than travelled.
  //
  // So a finer octave over the top: eight-tile undulations at a third of the
  // weight. Not hills -- rises and dips, the scale of a field. A road answers
  // them with small corrections all the way along, and a road that is always
  // correcting is a road that was walked.
  return Math.floor((octave(salt, x, y, 5) * 5 + octave(salt ^ 0x51ed, x, y, 3) * 3) / 8);
}
function octave(salt, x, y, shift) {
  const S = 1 << shift, MASK = S - 1;
  const gx = x >> shift, gy = y >> shift;
  const fx = x & MASK, fy = y & MASK;
  const a = elevHash(salt, gx, gy), b = elevHash(salt, gx + 1, gy);
  const c = elevHash(salt, gx, gy + 1), d = elevHash(salt, gx + 1, gy + 1);
  const sm = (f) => Math.floor((3 * f * f * S - 2 * f * f * f) / (S * S));
  const u = sm(fx), v = sm(fy);
  const top = a * (S - u) + b * u;
  const bot = c * (S - u) + d * u;
  return Math.floor((top * (S - v) + bot * v) / (S * S));
}

// ---------------------------------------------------------------------------
// THE PLACED THINGS
// ---------------------------------------------------------------------------
// Everything else on this island is computed. These are CHOSEN.
//
// A generator can make a plausible country but it cannot make a memorable one,
// because memory attaches to particulars: the copse you always skirt, the mire
// the road bends around, the scree fan below the pass. Those are the things a
// citizen still knows the shape of years later, and they exist here because
// somebody put them there and wrote down why.
//
// Each was placed at the middle of a measured dead-straight run -- the longest
// stretches on the island, where a citizen walked twenty or thirty seconds
// with nothing changing. A road that meets one of these has to choose a side,
// and choosing a side is what makes a road look walked.
//
// This table is LAW in the same way the coastline is: identical in the
// generator and in every window, forever. Add to it thoughtfully. Nothing here
// may ever be removed once a world is founded on it -- the roads bend around
// these, so deleting one moves every road that answers it.
const HANDMADE = [
  // --- the long north-south run beside the river, above Anchor ---
  { name: 'the Vale Copse',      x: 484, y: 259, rx: 8,  ry: 6,  kind: 'copse' },
  { name: 'the Sallows',         x: 486, y: 291, rx: 7,  ry: 8,  kind: 'mire' },
  // --- the run east of Anchor, on the way up to the North Pass ---
  { name: 'the Thornvale Spinney', x: 571, y: 197, rx: 9, ry: 6, kind: 'copse' },
  // --- the long straight through the Crags below the pass ---
  { name: 'the Fallen Scree',    x: 666, y: 180, rx: 10, ry: 5,  kind: 'scree' },
  { name: 'the Sentinel Slip',   x: 717, y: 287, rx: 7,  ry: 6,  kind: 'scree' },
  // --- the Hollybarrow-Norwick road, west of the crossing ---
  { name: 'the Oxen Copse',      x: 335, y: 214, rx: 8,  ry: 5,  kind: 'copse' },
  { name: 'the Long Holt',       x: 255, y: 221, rx: 7,  ry: 5,  kind: 'copse' },
  // --- Watersmeet, where the road runs down the river meadow ---
  { name: 'the Meadow Mire',     x: 476, y: 342, rx: 6,  ry: 8,  kind: 'mire' },
  // --- the Downs road out of Eastmere ---
  { name: 'the Sheepfold Thorns', x: 520, y: 381, rx: 8, ry: 5,  kind: 'copse' },
  // --- the Fens, where the road runs dead south ---
  { name: 'the Drowned Holt',    x: 485, y: 378, rx: 6,  ry: 7,  kind: 'mire' },
  // --- second pass: the straights that surfaced once the first ten were in ---
  //
  // Placing a thing moves the road that answers it, and a moved road finds new
  // level ground to run straight across. That is not a fault in the method, it
  // is the method: each pass measures, places, and measures again. Sixteen long
  // runs became nine; these are aimed at those nine.
  { name: 'the Hollybarrow Hedge', x: 316, y: 204, rx: 9,  ry: 5,  kind: 'copse' },
  { name: 'the Anchor Withies',    x: 394, y: 340, rx: 7,  ry: 6,  kind: 'mire' },
  { name: 'the Oxenlea Copse',     x: 320, y: 300, rx: 8,  ry: 6,  kind: 'copse' },
  { name: 'the Lea Marsh',         x: 305, y: 332, rx: 6,  ry: 7,  kind: 'mire' },
  { name: 'the Barrow Thorns',     x: 347, y: 229, rx: 6,  ry: 6,  kind: 'copse' },
  // --- third pass: nine became four, and these are the four ---
  { name: 'the Vale Alders',    x: 432, y: 237, rx: 7,  ry: 5,  kind: 'copse' },
  { name: 'the Millbrook Osiers', x: 497, y: 212, rx: 6, ry: 5,  kind: 'mire' },
  { name: 'the Thornvale Holt', x: 523, y: 249, rx: 6,  ry: 6,  kind: 'copse' },
  { name: 'the High Delving Scree', x: 711, y: 206, rx: 8, ry: 5, kind: 'scree' },
  { name: 'the Nordhead Slip',  x: 704, y: 212, rx: 7,  ry: 5,  kind: 'scree' },
];
// which placed thing is here, if any. An ellipse, because nothing in a
// landscape has corners.
function handmadeAt(x, y) {
  for (const f of HANDMADE) {
    const dx = (x - f.x) / f.rx, dy = (y - f.y) / f.ry;
    if (dx * dx + dy * dy <= 1) return f;
  }
  return null;
}
// what it costs a road to go through one rather than round it. Passable --
// a citizen may always walk in -- but dear enough that a road will not.
const HANDMADE_COST = { copse: 46, mire: 58, scree: 40 };
const GOING_SCALE = 3;                 // 1 << 3 = eight tiles to a patch
function goingSalt(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function goingAt(salt, x, y) {
  const gx = x >> GOING_SCALE, gy = y >> GOING_SCALE;
  let h = (Math.imul(gx, 374761393) + Math.imul(gy, 668265263) + salt) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) | 0;
  h = (h ^ (h >>> 16)) >>> 0;
  // 0..6 of extra effort, and a quarter of the ground is as easy as it was
  return h % 7;
}
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
  const hm = handmadeAt(x, y)                      // and the things somebody put here
  if (hm) c += HANDMADE_COST[hm.kind] ?? 40
  c += goingAt(goingSalt(TALLYHOLM_SEED), x, y)     // the going, patch by patch
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
export function routePath(g, ax, ay, bx, by, laid) {
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
  // A pull toward the straight line, so a road on even going runs straight
  // instead of staircasing wherever the tie-break happens to lean. It was
  // divided by five, which on a two-hundred-tile road is a pull no terrain can
  // argue with -- the reason every long road came out as a ruled diagonal. At
  // fourteen it still settles the ties and the going decides the route.
  const esalt = goingSalt(TALLYHOLM_SEED) ^ 0x9e37
  const vx = bx - ax, vy = by - ay
  const L = Math.sqrt(vx * vx + vy * vy)
  const offLine = (x, y) => {
    if (L < 1) return 0
    const cr = (x - ax) * vy - (y - ay) * vx
    const a = cr < 0 ? -cr : cr
    return Math.floor(a / (L * 14))
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
      // A ROAD WOULD RATHER GO ROUND THAN UP.
      //
      // Six for every unit climbed, and nothing for going down or along. That
      // one term is what turns a shortest path into a route: it makes the
      // router prefer a contour to a gradient, so roads arrive at passes,
      // follow valley floors and swing wide of high ground -- which is what
      // every real road does and why none of them are straight.
      let step = (dx && dy) ? Math.round(c * 1.4) : c
      const up = elevAt(esalt, nx, ny) - elevAt(esalt, x, y)
      const climb = up > 0 ? up * 6 : 0
      // ROADS BRAID. A road already exists: use it.
      //
      // Every route was found on virgin ground, ignoring the fourteen roads
      // already laid, so the network came out as fourteen independent lines
      // that happened to share endpoints. Real road networks are not like
      // that -- they have TRUNKS, because the second road to be built joins
      // the first rather than running parallel to it a mile away, and the
      // tenth is mostly other people's roads with a spur at the end.
      //
      // TWO THIRDS of the cost on ground that is already road -- not two
      // fifths, which was the first number and was far too generous. A
      // discount of 0.4 means a road will travel two and a half times as far
      // to stay on somebody else's, and it showed: Oxenford to the Watersmeet
      // Bridge went three hundred and nine tiles round by Millbrook rather
      // than a hundred and thirty straight across, because 309 x 0.4 is less
      // than 130. At 0.68 a road will go about half again as far for company,
      // which is roughly what a real one does and no more.
      if (laid && laid.has(nx + ',' + ny)) step = Math.round(step * 0.68)
      const nd = d0 + step + climb + offLine(nx, ny)
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
    // §13: the two localities the roads never reached. Aimed at the locality's
    // own centre, not at the place: the track goes to the Moor, and the Nine
    // Stones happen to be standing on it.
    ninestone: seatPoint(g, ...(() => { const L = LOCALES.find(l => l.tag === 'ninestone'); const c = localeCentre(g, L); return [c.x, c.y] })()),
    kingswood: seatPoint(g, ...(() => { const L = LOCALES.find(l => l.tag === 'kingswood'); const c = localeCentre(g, L); return [c.x, c.y] })()),
  }
  _juncMemo.set(_k, out)
  return out
}

// A LANE THAT GOES NOWHERE.
//
// Every road in this world joins two places, which is efficient and is not how
// a country looks. Real ones are full of lanes that stop: a track to a quarry
// that closed, a way up to a lookout, a farm road ending at a gate. Walking one
// to its end and finding nothing is not wasted time -- it is the thing that
// makes a map worth having, because it means the map was not a menu.
//
// The destinations are computed from the SETTLEMENTS and a hash, so a window
// derives exactly the ones the generator laid. Each lane runs out from a town
// in a fixed direction for a fixed distance and stops whereever it stops.
function laneSeatsOf(towns, salt) {
  const out = []
  for (let i = 0; i < towns.length; i++) {
    const t = towns[i]
    let h = (Math.imul(i + 1, 2654435761) + salt) | 0
    h = Math.imul(h ^ (h >>> 15), 2246822519) | 0
    h = (h ^ (h >>> 13)) >>> 0
    const n = (h & 1) + 1                                // one lane, sometimes two
    for (let k = 0; k < n; k++) {
      const hk = (Math.imul(h + k * 40503, 1597334677)) >>> 0
      const ang = (hk % 3600) / 3600 * Math.PI * 2
      const len = 16 + (hk >>> 12) % 26                  // sixteen to forty-two tiles
      out.push({
        from: t,
        x: Math.round(t.x + Math.cos(ang) * len),
        y: Math.round(t.y + Math.sin(ang) * len),
      })
    }
  }
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
    // EACH ROAD CROSSES AT ITS OWN CROSSING.
    //
    // Left to itself the router picked whichever crossing the braid discount
    // had made cheapest, and that is not how a country works. The road to
    // Greenhollow went south to the Millbrook Bridge and back north again; the
    // road to WATERSMEET -- a place named for its bridge -- ran three hundred
    // and thirteen tiles to cross at Millbrook, when the Watersmeet Bridge is
    // a few tiles from its far end.
    //
    // A crossing is the most fixed thing in a landscape. Naming which one a
    // road uses is not steering the router; it is stating the fact the router
    // was getting wrong because a cheap road elsewhere outvoted the geography.
    [s.millbrook, j.br0, 97], [j.br0, s.greenhollow, 98],   // by Highford
    // THROUGH THE PASS, NOT PAST IT.
    //
    // The router finds the North Pass unaided -- that was v4's lesson and it
    // still holds. But finding it and going THROUGH it as a named place are
    // different things: routed end to end, the road treats the pass as an
    // inconvenience on a line from Thornbury to Cragfoot, and comes out of it
    // straightened. Split at the gap and it becomes two shorter roads, each
    // free to answer its own country, meeting where a road really would.
    //
    // This is a waypoint, and v4 was right to delete the ones it deleted --
    // those were hints compensating for a router that could not find the way.
    // This one is a statement about the world: the road to the Crags goes
    // through the North Pass, because there is nowhere else it could go.
    [s.thornbury, j.npass, 100], [j.npass, s.cragfoot, 101],
    [s.anchor, j.spass, 103], [j.spass, s.eastmere, 106],
    [s.oxenford, j.br2, 102], [j.br2, j.watersmeet, 104],   // by the Watersmeet Bridge
    [j.watersmeet, s.fenmarch, 107],
    [s.eastmere, s.fenmarch, 108],
    [s.cragfoot, s.eastmere, 109],
    [s.oxenford, s.norwick, 111],     // finds the Oxenford crossing
    [s.hollybarrow, s.norwick, 112],
    [s.eastmere, j.shrine, 113],      // the causeway: drawn, not routed
    // §13: TWO TRACKS TO TWO PLACES NOBODY WOULD OTHERWISE SEE.
    //
    // Measured after the places were laid: ten of the eighteen sit within
    // sight of a road, and the other eight are in countries that have no roads
    // at all. For the Boneyard and the Ruined Tower that is correct -- the
    // Wilds should be a walk into nothing, and a place out there is supposed
    // to cost you something to reach.
    //
    // But Ninestone Moor stood 59 tiles from the nearest road and the King's
    // Oak 99, and those are not remote, they are invisible. A seater cannot
    // fix that: you cannot bias a place towards a road in a country that has
    // none. So the country gets the road. Two tracks, from the nearest town to
    // the locality, and the router does the rest.
    [s.hollybarrow, j.ninestone, 114],
    [s.greenhollow, j.kingswood, 115],
    // ---- THE MESH ----
    // Measured against the map this island is compared with: 11.6% of their
    // land is road against 1.9% of ours, and it is not because their roads are
    // wider. It is TOPOLOGY. Every road here ran town to town and the whole
    // network was a spanning tree with ten leaves -- no loops, no alternatives,
    // one way to get anywhere. A country's roads are not a spanning tree. They
    // are what is left after everybody has walked to everybody for a century,
    // and that has cycles in it.
    //
    // These are the links a person would actually have worn in: the ones
    // between neighbours who currently have to go via the capital.
    [s.thornbury, s.eastmere, 116],     // the forge sells to the port direct
    [s.greenhollow, s.hollybarrow, 117], // over the top, not down through Millbrook
    [s.oxenford, s.fenmarch, 118],      // the crossing to the fen port
    [s.norwick, s.hollybarrow, 119],    // the garrison's own way east
    [s.cragfoot, j.spass, 120],         // the Crags reach the South Pass road
    [s.millbrook, j.watersmeet, 121],   // market to the meeting of the waters
    [s.thornbury, j.br2, 122],          // and to the Watersmeet Bridge
    [s.anchor, j.br0, 123],             // the capital's own road north to Highford
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
  // THE ORDER MATTERS NOW, so it is fixed and shared with the mirror: the
  // shire ring first, then the radials outward. That is also the order they
  // would have been built in.
  const laid = new Set()
  for (const [a, b, tag] of roadSegsOf(g)) {
    if (tag === CAUSEWAY_TAG) continue
    const p = routePath(g, a.x, a.y, b.x, b.y, laid)
    // a route that cannot be found is a world that cannot be walked. Better
    // to fail the founding loudly than to publish an island with a town
    // nobody can reach.
    if (!p) throw new Error(`no route from (${a.x},${a.y}) to (${b.x},${b.y}) [seg ${tag}]: `
      + `the crossings or the passes have sealed a settlement off`)
    out.push({ tag, path: p })
    for (const [px, py] of p) { laid.add(px + ',' + py); laid.add((px + 1) + ',' + py) }
  }
  // and then the lanes, which join nothing. They are laid LAST so they hang
  // off the finished network rather than becoming part of anyone's route.
  const lanes = laneSeatsOf(settlementsOf(g), goingSalt(TALLYHOLM_SEED) ^ 0x5a17)
  let li = 0
  for (const L2 of lanes) {
    const seat = seatPoint(g, L2.x, L2.y)
    if (!seat) continue
    const p = routePath(g, L2.from.x, L2.from.y, seat.x, seat.y, laid)
    // A LANE IS SHORT BY DEFINITION. seatPoint snaps a destination to the
    // nearest walkable ground, and if the chosen point lands in water or on
    // the Ridge that snap can be a long way off -- one lane came out at a
    // hundred and sixty-two tiles, which is not a lane, it is a road to
    // somewhere with nothing at the end. Twice the intended length or it is
    // not laid at all.
    const want = Math.round(Math.hypot(L2.x - L2.from.x, L2.y - L2.from.y))
    if (!p || p.length < 8 || p.length > want * 2 + 10) continue
    out.push({ tag: 200 + (li++), path: p, lane: true })
    for (const [px, py] of p) { laid.add(px + ',' + py); laid.add((px + 1) + ',' + py) }
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
// ---------------------------------------------------------------------------
// THE HOLDINGS: WHERE THE LANES LEAVE THE ROAD
// ---------------------------------------------------------------------------
// See worldgen-holdings-v7.mjs for the measurement that motivates these and
// for why a farmhouse may repeat where a shrine may not.
//
// Pure in (seed, size) and memoised, like every other seat here: this is asked
// for by groundKindAt, which is asked for by every tile of every render.
const _hMemo = new Map()
export function holdingsOf(g) {
  const k = g.genesisSeed + ':' + g.worldW + 'x' + g.worldH
  const hit = _hMemo.get(k); if (hit) return hit
  // READ, NOT SEARCHED. The seats are a table now (HOLDING_SEATS), baked once
  // off the placer that used to run here and edited by hand since. What is
  // still computed is only the arithmetic of laying a drawing down: which
  // tiles its corner falls on.
  const out = []
  for (const seat of HOLDING_SEATS) {
    const pick = HOLDINGS.find(h => h.tag === seat.kind)
    if (!pick) { console.warn('WORLDGEN: no drawing called ' + seat.kind + ' for ' + seat.name); continue }
    const pw = pick.rows[0].length, ph = pick.rows.length
    out.push({ ...pick, id: 'hold' + out.length, name: seat.name,
      x: seat.x, y: seat.y, x0: seat.x - (pw >> 1), y0: seat.y - (ph >> 1),
      w: pw, h: ph, rows: pick.rows, lane: seat.lane })
  }
  _hMemo.set(k, out)
  return out
}

// THE DROVE ROAD, walked in rather than built. A hand-drawn polyline across
// the chalk, joined tile to tile, added to the lanes -- so it reads as trodden
// ground and, like every lane, is deliberately not a King's road.
export function droveTilesOf(g) {
  const out = []
  for (const t of TRACKS) {
    for (let i = 0; i < t.length - 1; i++) {
      let [x, y] = t[i]; const [tx, ty] = t[i + 1]
      let guard = 0
      while ((x !== tx || y !== ty) && guard++ < 200) {
        out.push([x, y])
        if (Math.abs(tx - x) >= Math.abs(ty - y)) x += Math.sign(tx - x)
        else y += Math.sign(ty - y)
      }
    }
    out.push(t[t.length - 1])
  }
  for (let i = 0; i < DROVE.length - 1; i++) {
    let [x, y] = DROVE[i]; const [tx, ty] = DROVE[i + 1]
    let guard = 0
    while ((x !== tx || y !== ty) && guard++ < 200) {
      out.push([x, y])
      if (Math.abs(tx - x) >= Math.abs(ty - y)) x += Math.sign(tx - x)
      else y += Math.sign(ty - y)
    }
  }
  out.push(DROVE[DROVE.length - 1])
  return out.filter(([x, y]) => !isWater(g, x, y) && !blockedAt(g, x, y))
}

const _laneMemo = new Map()
export function laneTilesOf(g) {
  const k = g.genesisSeed + ':' + g.worldW + 'x' + g.worldH
  const hit = _laneMemo.get(k); if (hit) return hit
  const set = new Set()
  for (const h of holdingsOf(g)) for (const [x, y] of h.lane) set.add(x + ',' + y)
  for (const [x, y] of droveTilesOf(g)) set.add(x + ',' + y)
  _laneMemo.set(k, set)
  return set
}
export const onLane = (g, x, y) => laneTilesOf(g).has(x + ',' + y)

// ---------------------------------------------------------------------------
// THE PLACES: WHERE EACH ONE STANDS
// ---------------------------------------------------------------------------
// A hand-drawn one-off, seated at the locality whose name is already on the
// chart. Pure in (seed, size) like every other seat here, and memoised,
// because groundKindAt asks for it on every tile of the island.
const _plMemo = new Map()
export function placeSeatsOf(g) {
  const k = g.genesisSeed + ':' + g.worldW + 'x' + g.worldH
  const hit = _plMemo.get(k); if (hit) return hit
  const out = []
  const claimed = []
  for (const tag of Object.keys(PLACES_V7).sort()) {
    const P = PLACES_V7[tag]
    // §7ab: A PLACE MAY NAME ITS OWN GROUND. Every place until now was seated
    // at a named locale, and there are only eighteen locales -- so the
    // nineteenth place had nowhere to stand, even with half a moor empty. A
    // drawing that says `at` is seated there.
    const L = P.at ? null : LOCALES.find(l => l.tag === P.locale)
    if (!P.at && !L) continue
    const c = P.at ? { x: P.at.x, y: P.at.y } : localeCentre(g, L)
    const pw = P.rows[0].length, ph = P.rows.length
    // the ground a place needs: every drawn tile dry, unblocked, out of every
    // town, off every road, and clear of any place already seated.
    const ok = (cx, cy) => {
      const x0 = cx - (pw >> 1), y0 = cy - (ph >> 1)
      for (const q of claimed)
        if (x0 - 6 <= q.x1 && x0 + pw + 6 >= q.x0 && y0 - 6 <= q.y1 && y0 + ph + 6 >= q.y0) return false
      for (const s2 of settlementsOf(g)) {
        const r = rectOf(s2)
        if (x0 - 4 <= r.x1 && x0 + pw + 4 >= r.x0 && y0 - 4 <= r.y1 && y0 + ph + 4 >= r.y0) return false
      }
      for (let ry = 0; ry < ph; ry++) for (let rx = 0; rx < pw; rx++) {
        if (P.rows[ry][rx] === '~') continue
        const x = x0 + rx, y = y0 + ry
        if (x < 3 || y < 3 || x >= g.worldW - 3 || y >= g.worldH - 3) return false
        if (isWater(g, x, y) || onRidge(g, x, y) || onBarrow(g, x, y)) return false
        if (onRoad(g, x, y) || fordAt(g, x, y)) return false
      }
      return true
    }
    // WITHIN SIGHT OF A ROAD.
    //
    // The first cut spiralled out from the locality centre and took the first
    // dry seat it found, which is how the Bothy ended up at 260,77 and the
    // Sawyer's Camp at 466,36 -- both a long way off any road, in country
    // nobody crosses. A place nobody walks past is not texture, it is a
    // screenshot. What makes Draynor Manor work is that it is BESIDE the road
    // from Draynor to Varrock: you do not go to it, you pass it, and one day
    // you go in.
    //
    // So the search is scored rather than first-hit. Every candidate seat that
    // the land allows is rated by how far it stands from the nearest road, and
    // the best is one that is NEAR but not ON: close enough to see from the
    // verge, far enough that the place is not roadside furniture. Ties break
    // on distance from the locality's own centre, so a place still belongs to
    // the name it was given.
    const NEAR = 4, FAR = 14           // tiles from the road: the good band
    const roadDist = (x, y) => {
      for (let r = 0; r <= FAR + 4; r++)
        for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue
          if (onRoad(g, x + dx, y + dy)) return r
        }
      return 99
    }
    let seat = null, bestScore = Infinity
    for (let rad = 0; rad < 60 && bestScore === Infinity ? true : rad < 60; rad++) {
      let anyThisRing = false
      for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
        const x = c.x + dx, y = c.y + dy
        if (!ok(x, y)) continue
        anyThisRing = true
        const rd = roadDist(x, y)
        // how badly does this seat miss the band, in tiles
        const miss = rd < NEAR ? (NEAR - rd) * 3 : rd > FAR ? (rd - FAR) : 0
        const score = miss * 10 + rad
        if (score < bestScore) { bestScore = score; seat = { x, y } }
      }
      // once a seat inside the band has been found, stop widening: a place
      // belongs to its locality, not to the best road on the island.
      if (seat && bestScore < 10 && anyThisRing) break
      if (rad > 24 && seat) break
    }
    if (!seat) continue                       // the country would not hold it
    const x0 = seat.x - (pw >> 1), y0 = seat.y - (ph >> 1)
    claimed.push({ x0, y0, x1: x0 + pw - 1, y1: y0 + ph - 1 })
    out.push({ tag, ...P, x: seat.x, y: seat.y, x0, y0, w: pw, h: ph })
  }
  _plMemo.set(k, out)
  return out
}

const _loneMemo = new Map()
// §7bv: MEMOISED, AND THEN INDEXED.
//
// This walked every holding and every roofed place and pushed a 1x1 rect for
// each interior tile -- thousands of them -- and `groundKindAt` calls it ONCE
// PER TILE. 458,752 tiles times a few thousand rects is the reason a founding
// took two minutes and forty seconds, and the reason the last four fixes were
// guesses rather than measurements: I could not look at the world without a
// five-minute round trip.
//
// The list is a pure function of the genesis, so it is built once. And since
// every entry is a single tile, the lookup is a Set of 'x,y' rather than a scan.
export function loneRoomTiles(g) {
  const k = g.genesisSeed + ':' + g.worldW + 'x' + g.worldH
  let hit = _loneMemo.get(k)
  if (!hit) {
    hit = new Set()
    for (const [x, y] of loneRooms(g)) hit.add(x + ',' + y)
    _loneMemo.set(k, hit)
  }
  return hit
}
const _loneListMemo = new Map()
export function loneRooms(g) {
  const _k = g.genesisSeed + ':' + g.worldW + 'x' + g.worldH
  const _hit = _loneListMemo.get(_k); if (_hit) return _hit
  const s = innSeat(g)
  const out = s ? [[s.x - 2, s.y, 5, 3]] : [] // the Lantern's interior
  // ...and the hand-drawn places that have a roof. A ruin does not: the
  // Boneyard and the Nine Stones are meant to have the moor underfoot.
  for (const h of holdingsOf(g)) {
    for (let ry = 0; ry < h.h; ry++) for (let rx = 0; rx < h.w; rx++)
      if (h.rows[ry][rx] === ',') out.push([h.x0 + rx, h.y0 + ry, 1, 1])
  }
  for (const P of placeSeatsOf(g)) {
    if (!P.floors) continue
    for (let ry = 0; ry < P.h; ry++) for (let rx = 0; rx < P.w; rx++)
      if (P.rows[ry][rx] === ',') out.push([P.x0 + rx, P.y0 + ry, 1, 1])
  }
  _loneListMemo.set(_k, out)
  return out
}

// ---------------------------------------------------------------------------
// A TOWN IS ITS DRAWING, NOT ITS PLOT
// ---------------------------------------------------------------------------
// Ground inside a settlement's rect was paved wholesale, so every town was a
// perfect rectangle of flagstone whatever it had been drawn as. Measured: only
// TWO of the ten are actually drawn as closed rings -- Anchor, a capital, and
// Norwick, a garrison, both 95% enclosed and both of which should read as a
// hard edge. The other eight are 0% closed. They are loose clusters of
// buildings in open country, and the terrain was putting a paved box round
// each of them.
//
// So paving follows the BUILT FORM: a tile is town ground if the drawing puts
// something there or something stands beside it. Between the buildings the
// country simply carries on, which is what a village looks like from above and
// what these eight were drawn as in the first place.
const _TOWN_OPEN = new Set([' ', '.']);
// §7ar: A STREET IS DRAWN, NOT INFERRED.
//
// This paved any tile within ONE of anything built -- which was fine for a
// town of three long terraces with wide bands between them, and is wrong for a
// town of scattered buildings: every gap is within one of a wall, so the whole
// interior comes out as a single sheet of flagstone. Oxenford was rebuilt with
// separate houses and lanes bending between them, and the lanes vanished --
// not because they were not drawn, but because the ground around them was
// paved too.
//
// A town is roads with GROUND either side of them. So the pavement follows
// what the drawing says is a lane: ',' outside a building is a street; '.' is
// the grass between the houses, and stays grass.
function townPaved(rows, rx, ry, tag) {
  // §7ar: ONLY WHAT WAS DRAWN AS A LANE.
  //
  // Two rules widened every street here in turn. First this paved anything
  // within one of anything BUILT, which made a town of scattered houses into
  // one sheet of flagstone. Then it paved every ',' and its four neighbours --
  // but a room's floor is ',' too, so the ring around every building paved as
  // well, and a lane drawn ONE tile wide came out THREE.
  //
  // A lane is a ',' that is not indoors. Nothing else. The grass comes right
  // up to the wall, which is what it does in a town.
  const c = rows[ry]?.[rx];
  return c === ',' && !isIndoor(tag, rows, rx, ry);
}
export function groundKindAt(g, x, y) {
  // DECKING IS DECKING. A window asks the ground what it is; over a bridge,
  // a beck plank or a quay the answer is boards, not "nothing, it is water".
  // Every window mirrored this from the generator and painted the sea, so the
  // jetties at Eastmere came out as three fishing marks on an empty tide.
  if (onBridge(g, x, y)) return 'bridge'
  // §7bv: a Set lookup, not a scan of thousands of one-tile rects
  if (loneRoomTiles(g).has(x + ',' + y)) return 'floor'
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
        // §6cz: MILLBROOK IS A MARKET, AND A MARKET IS PAVED. The market's
        // drawing is spacious -- shops with a plaza between them -- and
        // townPaved only pays the tiles beside a building, so the open market
        // came out as grass with shops standing in a field. A market square is
        // cobbled end to end; pave the whole of its rect.
        // §7k: AND THE SQUARE ITSELF IS PLAZA. `plaza` is a ground kind this
        // constitution has always declared and NEVER LAID -- not one tile of
        // it existed anywhere on the island, while 5,334 tiles of flagstone
        // did. The market town's market square was flagstone like its side
        // streets, which is why it read as a wide street rather than a place.
        //
        // The middle of Millbrook's rect, clear of its buildings, is plaza
        // now: the ground a citizen may raise a stall on (§7k in engine.js),
        // and the only such ground on Tallyholm.
        if (st.tag === 'millbrook') {
          // ...and CLEAR OF THE HOUSES. `isIndoor` reads the plan's interior
          // marks, and the market's shops are drawn with chars it does not
          // count, so three stall-houses had their floors painted as market
          // square. A square is open ground: no wall within one tile of it in
          // any direction, which is a thing the drawing can answer.
          const nearWall = (() => {
            for (let dy2 = -1; dy2 <= 1; dy2++) for (let dx2 = -1; dx2 <= 1; dx2++) {
              const c = rows[ry + dy2]?.[rx + dx2]
              if (c === '#' || c === '%') return true
            }
            return false
          })()
          if (!onRoad(g, x, y) && !isIndoor(st.tag, rows, rx, ry) && !nearWall
              && Math.abs(rx - (rows[0].length >> 1)) <= 9
              && Math.abs(ry - (rows.length >> 1)) <= 4) return 'plaza'
          // §7au: AND ONLY THE LANES ARE FLAGGED. This returned 'flag' for
          // EVERY remaining tile in Millbrook's rect -- fifty-two by
          // thirty-six of unbroken pavement -- so when the town was redrawn as
          // separate buildings they came out as islands standing in a car
          // park. There were no streets because there was no ground for a
          // street to be a street AGAINST.
          //
          // A market town is paved where people walk and where they trade.
          // Between the backs of two houses it is grass, exactly as it is
          // everywhere else on the island.
          if (townPaved(rows, rx, ry, st.tag)) return onRoad(g, x, y) ? 'cobble' : 'flag'
          return onRoad(g, x, y) ? 'trail' : null
        }
        // and the paving reaches only as far as the town does
        if (!townPaved(rows, rx, ry, st.tag)) return onRoad(g, x, y) ? 'trail' : null
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
  // A LANE IS TRODDEN GROUND, NOT A ROAD. It is deliberately NOT in onRoad:
  // every rule that cares about roads -- where a citizen may raise a stall,
  // what the founding sweeps off a street, where the wayside goes -- should go
  // on meaning the King's roads. A lane is just where the grass has worn off
  // between somebody's door and the way to town.
  if (onLane(g, x, y)) return 'trail'
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
  // §7cu: AN ISLE IS GROUND, AND HAD NONE.
  //
  // This fell through to null on every isle tile, and a window paints null as
  // SEA -- so Whiting and the Lists were drawn as open water on the chart, an
  // island you can walk on and cannot see. The shrine isle only ever looked
  // right because it is small enough to be entirely beach: every tile of it was
  // caught by the `sand` line above.
  //
  // Their ground follows what they ARE: Whiting is a salt shore of shingle and
  // pan, the Lists is bare trodden ground with nothing growing on it, because
  // nothing on it is allowed to grow.
  if (onIsle(g, x, y)) {
    for (const i of islesOf(g)) {
      if (((x - i.x) / i.rx) ** 2 + ((y - i.y) / i.ry) ** 2 > 1) continue
      if (i.tag === 'whiting') return 'shingle'
      if (i.tag === 'lists') return 'trodden'
      return 'chalk'
    }
  }
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
function geographyHashE6(g0) {
  const memoKey = g0.genesisSeed + '|' + g0.worldW + 'x' + g0.worldH
  if (_geoMemo.has(memoKey)) return _geoMemo.get(memoKey)
  if (_probing) return '0'.repeat(64)
  _probing = true
  try {
    const w = buildWorld(g0)
    const nodeSig = Object.entries(w.nodes)
      .map(([id, n]) => id + ':' + n.type + ':' + (n.kind ?? '') + ':' + n.x + ',' + n.y)
      .sort().join('|')
    // ...AND THE BEASTS.
    //
    // This signature was built from `w.nodes` alone, and while every mob on
    // the island came out of scatter functions living in this same file that
    // was harmless: you could not change where the wolves were without
    // changing the generator, and the generator's own identity covers that.
    //
    // v7 moved them into a TABLE (worldgen-camps-v7.mjs, 119 camps seating
    // 614 beasts) so a person could move a lair by editing two numbers -- and
    // that is exactly what makes it consensus-critical. Two nodes carrying
    // different camp tables would shake hands on an identical geography hash
    // and then diverge on the state root: caught, but a great deal later and
    // far more confusingly than at founding, which is the moment a mismatch is
    // cheap to read.
    //
    // The same argument the note below makes for groundKindAt: "free to edit"
    // and "two nodes can quietly disagree" are the same sentence.
    const mobSig = Object.entries(w.mobs)
      .map(([id, m]) => id + ':' + m.type + ':' + m.x + ',' + m.y)
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
    // the tag moves with the shape of what is hashed: a signature that has
    // grown a section is not the same signature, and saying so is free.
    const h = E.sha256(Buffer.from('EXPANSE7-GEO-V2\n' + nodeSig + '\n' + mobSig + '\n' + terr.join(''))).toString('hex')
    _geoMemo.set(memoKey, h)
    return h
  } finally { _probing = false }
}

E.registerTerrain(GENERATOR_ID, {
  blocked: (g, x, y) => blockedAt(g, x, y),
  spawn: (g) => spawnDry(g),
  country: (g, x, y) => biomeAt(g, x, y),
  road: (g, x, y) => onRoad(g, x, y),   // §6ao (v6): so the engine can require citizen stalls to line the roads
  // §7k: and the ground, so the engine can tell a market square from a verge.
  // stallGroundOk asks this; without it the square is just more flagstone.
  ground: (g, x, y) => groundKindAt(g, x, y),
  // WHERE THE TOWNS STAND, AS DATA. Every window used to re-derive this for
  // itself from a hand-copied table, and the copy went stale. The node that
  // founded the world is the one place that ran the real seater; it ships what
  // it seated, and a window draws exactly that. Same cure as roadDataOf.
  settlements: (g) => settlementsOf(g).map((s) => ({
    tag: s.tag, name: s.name, x: s.x, y: s.y, w: s.w, h: s.h, kind: s.kind, ring: s.ring,
  })),
  // WHERE THE TOWNS STAND, AS DATA. Every window used to re-derive this for
  // itself from a hand-copied table of nominal seats and footprints, and the
  // copy went stale: terrain-mirror still believed Millbrook was 40x18 after
  // the market square made it 52x22, so windows tinted cobble and laid bridge
  // decks on the wrong tiles. The node that founded the world is the one place
  // that ran the real seater; it ships what it seated, and a window draws
  // exactly that. Same cure as roadDataOf.
  settlements: (g) => settlementsOf(g).map((s) => ({
    tag: s.tag, name: s.name, x: s.x, y: s.y, w: s.w, h: s.h, kind: s.kind, ring: s.ring,
  })),
  geographyHash: (g) => geographyHashE6(g),
  _isProbing: () => _probing,
})

const FOUNDER_KEY = '9e18ba7bc57d23737fefd36223acf7c173bbd26ffc3355d177f0a5fedfb220af'

export function makeExpanse7Genesis(genesisSeed, rulesHash, anchorMs = 0, W = 896, H = 512) {
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
  // §6am (v6): STAR IS THE ENDGAME NOW. With a mid tier filling the middle of
  // the road (mid-ore and mid-wood at thirty-five), star rises to where it was
  // always meant to be -- the ninety-tier gear, forged from the magic-stone a
  // citizen carries out of the Wilds, so that reaching mastery finally buys
  // something to WEAR. The shape is the constitution's; these numbers are this
  // world's, and a v5 world (no gearReqs) keeps the old ladder to the byte.
  g.gearReqs = {
    wield: {
      'star-helm': { defence: 80 }, 'star-plate': { defence: 90 },
      'star-sword': { attack: 80 }, 'star-dagger': { attack: 80 }, 'star-spear': { attack: 80 },
      'star-maul': { attack: 85 }, 'star-flail': { attack: 85 },
      'star-hatchet': { woodcutting: 85 }, 'star-pickaxe': { mining: 85 },
    },
    smith: {
      'star-helm': { smithing: 80, magic: 40 }, 'star-plate': { smithing: 90, magic: 50 },
      'star-sword': { smithing: 85, magic: 45 }, 'star-dagger': { smithing: 85, magic: 48 },
      'star-spear': { smithing: 86, magic: 46 }, 'star-maul': { smithing: 88, magic: 50 },
      'star-hatchet': { smithing: 82, magic: 42 }, 'star-pickaxe': { smithing: 82, magic: 42 },
    },
  }
  // §6ao (v6): DURABLE NODES, so a FIXED small cluster holds any crowd. In one
  // shared world the Schelling point cannot grow to meet demand -- a founding
  // is frozen -- so instead the nodes are durable: rarer depletion (1-in-12,
  // not 1-in-4) and shorter downtime (4 ticks, not 8), which raises a node's
  // availability ~2.25x. To keep that a purely SOCIAL change -- more citizens
  // sharing one node, with NO effect on the economy or on progression -- the
  // gather success RATE is scaled by 0.84 (calibrated empirically so a v6
  // gatherer's resources-per-hour and XP-per-hour match a v5 world within a few
  // percent), so durability's higher availability nets NO economic or
  // progression change. Durability governs sharing; the rate governs speed;
  // they are separate layers and stay that way.
  // 6bc: rateMul 0.25, not 0.84. Under the flat-experience curve (base 60,
  // two fifths of a level, four tools worth 12-36) this is the only value that
  // puts a mastery at 879 hours -- thirty-seven days of an executor that never
  // stops, which is what "a long time" has to mean in a world where nobody
  // sleeps. At 0.84 the same road is 290 hours.
  g.gather = { depleteOneIn: 12, depleteTicks: 4, rateMul: 0.31, magicDepleteTicks: 40 }
  // §6ao (v6): citizen stalls must line the roads; alchemy is a town-and-Wilds
  // deed (never at the spawn) done with a staff in hand. Both are founding
  // choices; a world may omit either.
  g.stallsLineRoads = true
  g.alchWhere = 'towns-and-wilds'
  // §6ao (v6): gathering needs a tool, and a newcomer wakes with just enough
  // coin (22 gold) for ONE bronze tool at the market -- a hatchet, a pickaxe,
  // or a rod (each ~20). Not two. So the first act is a walk to Millbrook, a
  // choice of trade, and the first gather; the second tool is bought with what
  // the first one earns.
  g.toolGated = true
  g.newcomerGold = 22
  // §6ao (v6): waystones are earned by standing (frontier stones ask a great
  // deal), and the anchor-recall is now the Wilds escape -- the one thing magic
  // was first for -- castable only from the danger it answers. `true` uses the
  // engine's default standing tiers; a founding may pass its own table instead.
  // 6ch: the anchor is no longer a way OUT of the Wilds. The flag is gone
  // from this founding rather than set false, because a founding should say
  // what the world IS, not carry the ghost of a rule it no longer keeps.
  // §6ao (v6): THE EVENTS. The four tuning dials named in the design, as this
  // world's founding numbers. The SHAPE (a population-scaled incursion, a
  // time-scaled bloom, both deterministic from the beacon) is constitutional;
  // these numbers are Tallyholm's, and a founding may tune its own. A world
  // that omits `events` (every v1-v5 world) runs the event step as a no-op.
  g.events = {
    // incursion cadence: one per this many CITIZEN-ticks (larger is rarer). At
    // 200000 and, say, 20 present citizens, an incursion lands about every
    // 10000 ticks (~100 minutes) somewhere -- witnessed often, starred-in rarely.
    oneInPerCitizen: 200000,
    maxAtOnce: 2,                 // never a swarm; the island holds at most two at once
    lifetimeTicks: 600,          // ~6 minutes: longer than a solo kill, short enough to be now-or-never
    leashTiles: 40,              // it can be led a country's width toward help, then it is lost
    hpPerCombat: 6,              // HP scales with the target's combat so time-to-kill stays ~constant
    defPerCombat: 0.4,           // and a little harder to hit the tougher its quarry
    // bloom cadence: a rich spot every `bloomPeriod`, live for `bloomWindow`.
    bloomPeriod: 3600,           // a new bloom cycle every ~36 minutes
    bloomWindow: 1200,           // rich for ~12 of those minutes, then it moves
    bloomXpPerTick: 4,           // continuous bonus XP each tick you WORK the bloom (watchfire-style)
  }
  if (g.founderKey === undefined) g.founderKey = FOUNDER_KEY
  g.geographyHash = '0'.repeat(64)
  if (!_probing) g.geographyHash = geographyHashE6(g)
  // 6bo: base 20, perTile 1, cap derived from the world's own half-span.
  //
  // Measured on this island: sixteen markers alive sit a median of 44 tiles
  // apart (mean 60), so a marker costs about sixty intervals of walking and
  // one to survey. At base 40 / perTile 4 the median marker paid 616 -- ten
  // experience an interval, 215 hours to ninety-nine, the second-fastest
  // mastery in the world. At 20/1 the median pays 164 and the road is 808
  // hours, beside every other trade.
  //
  // The SHAPE is untouched and it is the good part: exploration is the one
  // skill whose balance lever is the map itself, and it still pays for how far
  // OUT a rumour lies, so the frontier is worth more than the doorstep.
  g.survey = { k: 16, base: 20, perTile: 1, max: 20 + 1 * Math.ceil(Math.max(896, 512) / 2) }
  return g
}

// ---------- the founding ----------
// What each town has to say for itself, beyond its own name.
const SIGN_TEXT = {
  anchor: 'Anchor, on Tallyholm',
  greenhollow: 'Greenhollow. We fell timber and post no guard. '
    + 'The wood was here first and keeps its own hours \u2014 go armed or go home.',
  norwick: 'Norwick, the garrison. West of here the road ends and the law with it.',
  hollybarrow: 'Hollybarrow. Plots, a well, and nothing worth stealing.',
  cragfoot: 'Cragfoot. The seam and a hard country. Mine here; the anvil is at Thornbury.',
  eastmere: 'Eastmere, on the water. Listen along the strand before you walk it.',
  fenmarch: 'Fenmarch. The ground is not where it looks.',
  oxenford: 'Oxenford, on the ford. The road west runs from here; keep the peace yourself.',
  millbrook: 'Millbrook, the market. The arms, the armour, the bows and the axe \u2014 near everything keeps here. For a rod ask the port; for seed, the farm.',
  thornbury: 'Thornbury, the forge. The one anvil on Tallyholm; bring ore and bring patience.',
}

export function buildWorld(genesis) {
  // stalls are seated at the end, once every town's counters exist
  const _stallWork = []
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
  const H32 = (tag, i) => E.sha256(Buffer.from(TALLYHOLM_SEED + ':' + tag + ':' + i))

  // ================= TOWNS THAT ARE LAID OUT =================
  // A town is: a wall with a named gate, two street lanes crossing at a
  // plaza, and BUILDINGS -- rectangles of wall with a door -- rather than
  // single-tile "hearth" pixels. You can stand in a doorway. You can walk a
  // back lane. That is the whole difference between a settlement and a
  // place, and it costs no new node type and no engine change.
  let bldN = 0
  // the loader's view of the world, so a drawing can place nodes without
  // knowing anything about how this generator keeps its books
  const planCtx = {
    g, E, w, taken, key, inB, isWater, onRoad,
    reserve: (x, y) => { if (inB(x, y)) taken.add(key(x, y)) },
  }
  // A SHIRE town is a drawing (worldgen-shire.mjs). The frontier is
  // generated. That split is the whole thesis: hand-work where every
  // citizen walks a thousand times, procedure where variety is the point.
  const signPlaced = (tag) => !!w.nodes['sign-' + tag]
  const layDrawnTown = (s) => {
    checkPlanConnected(s.tag, PLANS[s.tag], s.x, s.y, { g, isWater, blockedAt })
    layPlan(planCtx, s.tag, PLANS[s.tag], s.x, s.y, 'plan-' + s.tag,
      { nameKeeper: (k) => keeperName(k, 'plan'), legend: LEGEND_V6 })
    // the sign is the one thing the drawing cannot carry: its text
    const r = rectOf(s)
    for (let rad = 1; rad <= 6 && true; rad++) {
      let done = false
      for (let dy = -rad; dy <= rad && !done; dy++) for (let dx = -rad; dx <= rad; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
        const x = s.x + dx, y = s.y + 3 + dy
        if (!inB(x, y) || taken.has(key(x, y)) || isWater(g, x, y)) continue
        if (x <= r.x0 || x >= r.x1 || y <= r.y0 || y >= r.y1) continue
        // A TOWN THAT SAYS SOMETHING ABOUT ITSELF.
        //
        // Every sign read only the town's own name, which is the one fact the
        // banner and the paving have already given you. A signpost is the
        // world's own voice -- the text is on the node, in the hashed state,
        // so every window reads the same words and will still read them in a
        // year -- and the thing worth saying is whatever a citizen would
        // otherwise have to guess at.
        //
        // Greenhollow is the case that prompted this: twenty beasts within
        // forty-five tiles and not one guard, on the edge of the wood the
        // great spider lives in. Left silent that reads as an oversight.
        // Said out loud it is a choice the town has made, which is a
        // different place entirely.
        put('sign-' + s.tag, 'signpost', x, y, { text: SIGN_TEXT[s.tag] ?? s.name })
        done = true; break
      }
      if (done) break
    }
    // A DRAWING USUALLY HAS NO ROOM FOR ONE MORE POST.
    //
    // The loop above only succeeds where the plan happens to have left a gap,
    // which is three towns in ten -- the other seven had no sign at all, and
    // nobody had noticed because a town with no sign looks exactly like a town
    // whose sign says its name. But the drawings DO place signposts of their
    // own; they simply carry no words. So if there was no room, give the words
    // to the post that is already standing nearest the middle.
    if (!signPlaced(s.tag)) {
      let best = null, bd = 1e9
      for (const [id, n] of Object.entries(w.nodes)) {
        if (n.type !== 'signpost' || n.text !== undefined) continue
        if (n.x <= r.x0 || n.x >= r.x1 || n.y <= r.y0 || n.y >= r.y1) continue
        const d = Math.hypot(n.x - s.x, n.y - s.y)
        if (d < bd) { bd = d; best = n }
      }
      if (best) best.text = SIGN_TEXT[s.tag] ?? s.name
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
      // §6am (v6): THE CAPITAL NO LONGER SMITHS. Anchor is where you spawn and
      // return, not where you work metal -- the one anvil is Thornbury's. What
      // stood here was a smithy with two anvils; it is now a plain hall, so the
      // capital is presence, and the forge is a journey. (Lumbridge, not Varrock.)
      seatBuilding(4, -9, 6, 5, 's', [[0, 0, 'store'], [1, 0, 'keeper']])
      seatBuilding(-16, 4, 6, 5, 'n', [[0, 0, 'store'], [1, 0, 'keeper']])
      // the keep: the biggest room on the island
      seatBuilding(-4, 6, 9, 7, 'n', [[1, 1, 'campfire'], [3, 1, 'guard'], [5, 1, 'guard']])
      for (let k = 0; k < 5; k++) seatBuilding(-18 + k * 8, 10, 4, 4, 'n', [[0, 0, 'hearth']])
      for (let k = 0; k < 4; k++) seatBuilding(-18 + k * 9, -12, 4, 4, 's', [[0, 0, 'hearth']])
    } else {
      seatBuilding(-7, -5, 6, 5, 's', bankFill())
      // §6am (v6): THE SOLE ANVIL. Only the forge town (Thornbury, the central
      // hub) seats an anvil now. Ore is mined at Cragfoot and CARRIED here to
      // be worked -- the walk between the seam and the anvil is the gameplay,
      // and the one anvil on the island is where every smith converges.
      if (s.kind === 'forge')
        seatBuilding(4, -5, 6, 5, 's', [[0, 0, 'anvil'], [1, 0, 'smith']])
      if (s.kind === 'port' || s.kind === 'timber' || s.kind === 'market' || s.kind === 'crossing' || s.kind === 'farm' || s.kind === 'mine')
        seatBuilding(4, 4, 6, 5, 'n', [[0, 0, 'store'], [1, 0, 'keeper']])
      if (s.kind === 'garrison') seatBuilding(-8, 4, 7, 6, 'n', [[1, 1, 'guard'], [3, 1, 'guard'], [2, 2, 'campfire']])
      for (let k = 0; k < 3; k++) seatBuilding(-9 + k * 7, 6, 4, 4, 'n', [[0, 0, 'hearth']])
      for (let k = 0; k < 2; k++) seatBuilding(-5 + k * 8, -8, 4, 4, 's', [[0, 0, 'hearth']])
    }
    // the streets are RESERVED: no later scatter may seal a lane
    for (const k of street) taken.add(k)
  }
  for (const s of ss) {
    if ((s.ring === 'shire' || s.drawn) && PLANS[s.tag]) layDrawnTown(s)
    else layTown(s)
    // -- THE STALLS: one trade per town, matching what the town IS --
    //
    // Not scattered evenly. A timber town has the axe man; the forge town has
    // the armourer and the arms-master; the port that watches the wood has the
    // fletcher. A citizen who knows what a town is for can guess what it
    // sells, and being right about that is the small pleasure this is for.
    //
    // Placed just outside the wall like the gate guards, because the drawings
    // have no room left inside and a stall wants to be on the street anyway.
    {
      const STALLS = {
        // §6am (v6): THE MARKET IS ONE PLACE. Every specialist stall now stands
        // at Millbrook, the market town on the river-road -- so "where do I buy
        // arms, armour, bows, an axe" has ONE answer, and that answer is a
        // journey to the market where the buyers and sellers meet. A town that
        // sold you everything at your door was a town you never left; the market
        // is a destination because it is the ONLY one.
        millbrook:   ['arms', 'armour', 'lumber', 'bows', 'delve'],
        // TWO DELIBERATE EXCEPTIONS, both monopolies AT THE SOURCE:
        // the Seedsman is the only one in the world, and he belongs where every
        // crop starts -- Hollybarrow, the farm. (Buying seed is farming's door.)
        hollybarrow: ['seed'],
        // 6cf: THE FISHER STANDS AT A PORT, NOT AT THE MARKET.
        //
        // The engine has had a fisher's shelf since 6be and this list decided
        // no town wanted one, so the rod stayed unbuyable and a tool-gated
        // founding still could not put a rod in a newcomer's hand. A shelf in
        // the rules with no counter in the world is a shop that does not exist.
        //
        // Eastmere and not Millbrook, against the rule above and on purpose:
        // Eastmere is the port, its dock is the fishery every newcomer in the
        // east walks to, and a rod bought two hundred tiles inland is a rod
        // carried two hundred tiles. The market keeps everything a citizen
        // CHOOSES between; the water keeps the one thing you cannot fish
        // without.
        eastmere:    ['fisher'],
        // Anchor keeps no specialist stall: only the plain general store the
        // capital already seats, so a newcomer can bootstrap and no more.
      }
      // A SHOP IS A BUILDING, NOT A TABLE IN THE ROAD.
      //
      // The first version stood every stall outside the wall, which is honest
      // enough -- markets really did set up at gates -- but it left the towns
      // exactly as they were: three buildings that do something and a dozen
      // that are scenery. A citizen learns the bank, the store and the anvil
      // and stops looking at the rest.
      //
      // So a stall takes a HOUSE. The drawings mark their rooms, and a room
      // with nothing in it but a bed and a hearth is a room doing nothing that
      // a shop cannot do better. The building keeps its walls, its door and
      // its eaves; what changes is that there is now a reason to walk through
      // the door. Nothing is demolished -- the hearth stays, because somebody
      // still lives above the shop, which is how every trade in a town like
      // this actually worked.
      const roomsOf = PLAN_ROOMS[s.tag] ?? []
      const plan = PLANS[s.tag]
      const shopRoom = (() => {
        if (!plan) return null
        const pw = plan[0].length, ph = plan.length
        const ox = s.x - (pw >> 1), oy = s.y - (ph >> 1)
        // a room is a HOUSE if it holds no fixture a citizen already walks to
        const busy = new Set(['B', 'S', 'A', 's', 'k', 'W', 'o', 'U'])
        const houses = []
        for (const [rx, ry, rw, rh] of roomsOf) {
          let has = false
          for (let yy = ry; yy < ry + rh; yy++) for (let xx = rx; xx < rx + rw; xx++)
            if (busy.has(plan[yy]?.[xx])) has = true
          if (!has) houses.push([rx, ry, rw, rh])
        }
        return houses.length ? houses : null
      })()
      // A RING ROUND THE WALL, kept as the fallback for a town whose drawing
      // has no spare house -- better a stall in the road than no stall.
      //
      // Six hand-picked offsets found nowhere to stand in three towns and only
      // one of Anchor's two -- a drawing that fills its own plot leaves those
      // exact tiles taken. So the search walks outward from the town edge and
      // takes the first free ground it finds, which is what a trader would do.
      const rr2 = rectOf(s)
      let si = 0
      let hi = 0
      // DEFERRED. See the pass at the end of the founding: seating a stall
      // here meant checking it against a world only half built, so a counter
      // laid by a LATER town -- or later in this one -- was invisible to the
      // test and the stall sat down beside it anyway. Anchor's arms-master
      // ended up five tiles from an anvil that did not exist yet.
      _stallWork.push({ s, shopRoom, rr2, taken, plan, kinds: STALLS[s.tag] ?? [] })

    }
    // -- THE ARMS, ON THE APPROACHES --
    //
    // A world in which towns simply BEGIN is a world of rooms. You should be
    // able to tell one is coming, and WHICH one, before the paving starts --
    // so a banner stands beside every road where it crosses the bound, bearing
    // the town's tag and nothing else. (The arms are derived from the tag by
    // each window; spec 2g.)
    //
    // Beside the road, never on it: a banner is impassable, and a gate you
    // cannot walk through is a wall with a flag on it.
    //
    // This sits OUTSIDE both town-laying paths on purpose. Every settlement in
    // this founding turns out to be hand-drawn, so anything placed inside
    // layTown is dead code -- which is exactly where I put it the first time.
    {
      const rr = rectOf(s)
      let bi = 0
      const ROADY = new Set(['trail', 'causey', 'cobble', 'plaza', 'flag', 'bridge'])
      const edges = []
      for (let x = rr.x0 - 1; x <= rr.x1 + 1; x++) edges.push([x, rr.y0 - 1], [x, rr.y1 + 1])
      for (let y = rr.y0 - 1; y <= rr.y1 + 1; y++) edges.push([rr.x0 - 1, y], [rr.x1 + 1, y])
      // ONE PER APPROACH, not four along one wall.
      //
      // Spacing them ten tiles apart was not enough: Oxenford came out with
      // three of its four banners in a row along the north edge and none at
      // its other gates, because the north side simply had the most road on
      // it. A banner answers the question "which way did I come in", so there
      // should be at most one per side and it should stand where that side's
      // road actually crosses.
      const sides = new Set()
      const sideOf = (x, y) => y <= rr.y0 ? 'N' : y >= rr.y1 ? 'S' : x <= rr.x0 ? 'W' : 'E'
      const seated = []
      for (const [ex, ey] of edges) {
        if (bi >= 4) break
        if (!ROADY.has(groundKindAt(g, ex, ey))) continue
        if (seated.some(([px, py]) => Math.hypot(px - ex, py - ey) < 10)) continue
        for (const [ox, oy] of [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, 1], [-1, 1], [1, -1]]) {
          const bx = ex + ox, by = ey + oy
          if (!inB(bx, by) || isWater(g, bx, by)) continue
          if (ROADY.has(groundKindAt(g, bx, by))) continue      // keep the way open
          if (taken.has(key(bx, by)) || blockedAt(g, bx, by)) continue
          // classify the SEAT, not the road tile it answers: the seat is one
          // tile off, and at a corner that is enough to land on another side
          const side = sideOf(bx, by)
          if (sides.has(side)) continue
          E.addNode(w, 'banner-' + s.tag + (bi++), 'banner', bx, by, { tag: s.tag })
          taken.add(key(bx, by))
          sides.add(side)
          seated.push([ex, ey])
          break
        }
      }
    }
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
        { landmarkKind: pl.kind, nameKeeper: (k) => keeperName(k, 'place'), legend: LEGEND_V6 })
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
    // §6bp: THE FIRST DEDICATION STONE, at the middle of the Ring.
    //
    // Three of these exist on the island and no more. Scarcity is the whole
    // mechanism: a stone nobody else wants is a donation box, and a stone
    // four hundred citizens want is a running argument that costs a fortune.
    // Three is few enough to be contested and enough that the contest is not
    // one clan's private property.
    //
    // It goes HERE because the Ring is where Oberon teaches, which is to say
    // the one place on this island people already come to read words cut into
    // rock. A stone bearing a citizen's name belongs among stones bearing the
    // world's.
    if (free(rx0, ry0)) put('ded-ring', 'dedication', rx0, ry0, { tag: 'ring' })
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
          // THE WIZARD LEARNS ALCHEMY.
          //
          // His five sayings were all sigils -- anchor, mend, still, the price
          // of a name. Every one of them is about magic a citizen cannot reach
          // until they have crossed the Wilds. Then alchemy arrived and became
          // the FIRST magic anybody meets and the whole of how the skill is
          // trained, and the wizard of the Ring had nothing to say about it.
          //
          // Three stones stood empty, which is exactly enough.
          '\u201cUnmaking is the first magic and the last one you will still be doing. Everything else here is an emergency.\u201d',
          '\u201cA keeper will always pay you more than the air will. The air is always closer.\u201d',
          '\u201cThe log teaches what the crown teaches. What differs is what you are left holding.\u201d',
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
    seat('tally-isle', 'landmark', -2, -2, { kind: 'tally-half', founderKey: g.founderKey })
    seat('shrine-hearth', 'campfire', 3, 0)
    // §6bp: the third, on Shrine Isle -- across water, which means the dearest
    // name in the world is also the least convenient one to go and read.
    seat('ded-shrine', 'dedication', 0, 2, { tag: 'shrine' })
    for (let k = 0; k < 4; k++) seat('shrine-stone-' + k, 'landmark', [-4, 4, 0, 0][k], [0, 2, -4, 4][k], { kind: 'standing-stone' })
  }

  // ================= THE SOUTH PASS, SHUT =================
  //
  // The Crags are crossed at two gaps in a five-tile wall of rock. One of them
  // is full of boulders, and has been since before anyone arrived.
  //
  // Why nine stones and not a wall: they are NODES. A node blocks its tile
  // (nothing here is in the engine's _WALKABLE_BUILT) and a node can be taken
  // away, so the South Pass is the one thing on this island that CITIZENS can
  // change and no re-founding will restore. It costs the constitution nothing
  // to allow, because geographyHash covers blockedAt -- the land -- and these
  // are not the land. The chart and the world stay in agreement about a pass
  // whose stones the chart does not claim to know.
  //
  // The road still runs to it. That is deliberate: the sweep that clears
  // blocked streets spares 'rockfall' precisely so this road survives, arrives
  // at rock, and stops. A route that plainly used to work and does not is
  // worth more than a route that was never drawn.
  //
  // A PLUG, NOT A FENCE. The first cut of this stood one stone on each row of
  // the throat, in a single file -- and a single file is opened by ONE stone,
  // because movement is cardinal and a one-tile gap is a road. Measured: break
  // any one of the seven and the walk east falls from 397 tiles to 217. Six of
  // them were decoration.
  //
  // So the fall is DEEP: the full height of the gap and ROCKFALL_DEPTH tiles
  // thick, and what citizens do to it is not knock down a fence but drive a
  // TUNNEL. The least work that opens the pass is one line straight through --
  // five stones, not one and not thirty-five -- and every other stone is
  // somebody widening the hole after the fact, which is exactly what people do
  // to a hole.
  {
    const [, southPass] = passesOf(g)
    // find the line across the gap that takes the fewest stones to shut
    let bestX = ridgeX(g, southPass), bestN = Infinity
    for (let x = ridgeX(g, southPass) - 3; x <= ridgeX(g, southPass) + 3; x++) {
      let n = 0, ok = true
      for (let y = southPass - 5; y <= southPass + 5; y++) {
        if (blockedAt(g, x, y)) continue            // the wall already holds here
        if (isWater(g, x, y)) { ok = false; break }
        n++
      }
      if (ok && n < bestN) { bestN = n; bestX = x }
    }
    const DEPTH = 5
    let laid = 0
    for (let dx = -(DEPTH >> 1); dx <= (DEPTH >> 1); dx++) {
      const x = bestX + dx
      for (let y = southPass - 5; y <= southPass + 5; y++) {
        if (blockedAt(g, x, y) || isWater(g, x, y)) continue
        if (inAnySettlement(x, y)) continue
        // NOT `free()`: that refuses the road, and the road is the point.
        if (taken.has(key(x, y))) continue
        put('rockfall-south-' + x + '-' + y, 'rockfall', x, y, {})
        laid++
      }
    }
    // and a sign at the near end, because a road that stops needs to say why
    for (const dx of [-6, 6]) {
      const x = bestX + dx
      if (free(x, southPass)) { put('rockfall-sign' + dx, 'signpost', x, southPass, { text: 'the South Pass \u2014 shut' }); break }
    }
    // §7b: and something lives in it. Two scree-imps, which hit for one and
    // cannot follow you out of the throat: the pass should have a NOISE in it,
    // not a danger. Whoever is digging has company and nothing worse.
    for (const [k, dy] of [[0, -3], [1, 3]]) {
      const y = southPass + dy
      for (let dx = -4; dx <= 4; dx++) {
        const x = bestX + dx
        if (!inB(x, y) || isWater(g, x, y) || blockedAt(g, x, y) || taken.has(key(x, y))) continue
        E.addMob(w, 'screeimp-' + k, 'scree-imp', x, y); break
      }
    }
    if (!laid) console.warn('WORLDGEN: the South Pass took no rockfall -- the gap is not where it was')
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

  let _holdCount = 0, _fieldCount = 0, _workCount = 0, _skepCount = 0, _lockupCount = 0, _residentCount = 0
  // ================= THE HOLDINGS, AND THE FIELDS =================
  // Somebody lives between the towns. See worldgen-holdings-v7.mjs for the
  // measurement: this island had 73 built clumps against the 272 on the map it
  // is always compared with, and -- the number that actually names the fault --
  // a MEDIAN clump of twenty tiles against their one cottage. A few big towns
  // and then nothing is what an unpopulated country looks like.
  {
    const HOLD_NODE = {
      '#': ['wall'], 'f': ['fence'], '^': ['hedge'], 'p': ['plot'],
      'h': ['hearth'], 'd': ['landmark', { kind: 'bed' }], 'e': ['landmark', { kind: 'table' }],
      'q': ['landmark', { kind: 'barrel' }], 'v': ['landmark', { kind: 'shelf' }], 'T': ['tree'],
    }
    let built = 0, fields = 0
    for (const hd of holdingsOf(g)) {
      // the drawing owns its ground, as a place does
      for (let ry = 0; ry < hd.h; ry++) for (let rx = 0; rx < hd.w; rx++) {
        if (hd.rows[ry][rx] === '~') continue
        const x = hd.x0 + rx, y = hd.y0 + ry
        // §7y: A HOLDING CLEARS SCENERY, NOT A PLACE.
        //
        // This deleted EVERY node in its footprint, unconditionally, and it
        // runs after the eighteen hand-drawn places -- so a croft laid its
        // vegetable patch straight through the apiary and took the pen's fence
        // out from under the bees. The apiary reserves its ground in `taken`
        // and this never asked.
        //
        // The whole reason for hand-placing is that each thing has its own
        // place. A holding may sweep a stump or a standing stone off its yard;
        // it may not sweep away a building somebody drew.
        if (taken.has(key(x, y))) continue
        for (const [id, q] of Object.entries(w.nodes)) {
          if (q.x !== x || q.y !== y) continue
          if (id.startsWith('place-')) continue
          delete w.nodes[id]
        }
      }
      for (let ry = 0; ry < hd.h; ry++) for (let rx = 0; rx < hd.w; rx++) {
        const ch = hd.rows[ry][rx]
        const spec = HOLD_NODE[ch]
        if (!spec) continue                       // '~', '.', ',', '@' build nothing
        const x = hd.x0 + rx, y = hd.y0 + ry
        if (!inB(x, y) || isWater(g, x, y) || blockedAt(g, x, y)) continue
        put(hd.id + '-' + rx + '-' + ry, spec[0], x, y, spec[1] ?? {})
        if (ch === 'p') fields++
        built++
      }
      // reserve the yard and the lane so nothing else moves in
      for (let ry = -1; ry <= hd.h; ry++) for (let rx = -1; rx <= hd.w; rx++)
        taken.add(key(hd.x0 + rx, hd.y0 + ry))
      for (const [x, y] of hd.lane) taken.add(key(x, y))
      // a board where the lane leaves the road, so the farm has a name
      const far = hd.lane[hd.lane.length - 1]
      if (far) {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const x = far[0] + dx, y = far[1] + dy
          if (free(x, y)) { put(hd.id + '-sign', 'signpost', x, y, { text: hd.name }); break }
        }
      }
    }

    // ---- AND THE FIELDS ROUND EVERY TOWN ----
    // Hand-drawn now (worldgen-fields-v7.mjs). The placer that came before
    // threw rectangles at a ring round each town and laid a quarter of the
    // island's nodes as slabs of brown; a field is strips in a furlong with a
    // headland to turn the plough on, a hedge round it and a gate where the
    // lane comes in, and no amount of tuning a placer produces that.
    //
    // Tiles that fall on water, rock, road or anything already standing are
    // simply not ploughed, so a field goes ragged where it meets a stream --
    // which is what a real one does.
    const FIELD_NODE = { p: ['plot'], '^': ['hedge'], f: ['fence'] }
    for (const st of ss) {
      const sys = FIELDS_V7[st.tag]
      if (!sys) continue                                   // the ports fish
      let k = 0
      for (const blk of sys) {
        const x0 = st.x + blk.dx, y0 = st.y + blk.dy
        let laid = 0, want = 0
        for (let ry = 0; ry < blk.rows.length; ry++) {
          const row = blk.rows[ry]
          for (let rx = 0; rx < row.length; rx++) {
            const ch = row[rx]
            if (ch === '~' || ch === ' ' || ch === '.' || ch === 'g') continue
            want++
            const x = x0 + rx, y = y0 + ry
            if (blockedAt(g, x, y) || isWater(g, x, y) || onLane(g, x, y) || onRoad(g, x, y)) continue
            if (inAnySettlement(x, y)) continue
            // PLOUGHING CLEARS THE GROUND. `free` refuses any tile that already
            // holds anything, so a furlong laid over the country's own scatter
            // came out moth-eaten -- and Greenhollow's assarts, which are by
            // definition wood being turned into field, laid 7 tiles of 30.
            // Scrub gives way to the plough; walls, buildings and seams do not.
            const CLEARABLE = new Set(['tree', 'oak-tree', 'landmark'])
            let occupied = false
            for (const [oid, q] of Object.entries(w.nodes)) {
              if (q.x !== x || q.y !== y) continue
              if (CLEARABLE.has(q.type) && q.kind !== 'standing-stone') { delete w.nodes[oid]; continue }
              occupied = true
            }
            if (occupied) continue
            const spec = ch === 'T' ? ['landmark', { kind: 'stump' }] : FIELD_NODE[ch]
            if (!spec) continue
            put('field-' + st.tag + '-' + (k++), spec[0], x, y, spec[1] ?? {})
            if (ch === 'p') fields++
            laid++
          }
        }
        // a field that lands almost nowhere is a drawing in the wrong place,
        // and the founding should say so rather than quietly ploughing a pond
        if (want && laid / want < 0.35)
          console.warn('WORLDGEN: ' + st.name + ' field at +' + blk.dx + ',' + blk.dy
            + ' only laid ' + laid + ' of ' + want + ' tiles')
      }
    }
    _holdCount = built; _fieldCount = fields
  }

  // ================= THE WORKING COUNTRY =================
  // The Fens and the Downs, on their own terms. See worldgen-country-v7.mjs
  // for the measurement: the Fens came out with the longest walk-to-anything
  // on the island despite carrying a port, a causeway and an eel trade, and
  // the Downs were sheep country with one fold on them.
  {
    const WORK_NODE = {
      '#': ['wall'], 'f': ['fence'], '^': ['hedge'], 'p': ['plot'],
      'h': ['hearth'], 'd': ['landmark', { kind: 'bed' }], 'q': ['landmark', { kind: 'barrel' }],
      'v': ['landmark', { kind: 'shelf' }], 'T': ['tree'], 'o': ['well'],
    }
    let works = 0, laid = 0
    for (let i = 0; i < COUNTRY_SEATS.length; i++) {
      const seat = COUNTRY_SEATS[i]
      const rows = COUNTRY_WORKS[seat.kind]
      if (!rows) { console.warn('WORLDGEN: no drawing called ' + seat.kind); continue }
      const pw = rows[0].length, ph = rows.length
      const x0 = seat.x - (pw >> 1), y0 = seat.y - (ph >> 1)
      let got = 0, want = 0
      for (let ry = 0; ry < ph; ry++) for (let rx = 0; rx < pw; rx++) {
        const ch = rows[ry][rx]
        if (ch === '~' || ch === '.' || ch === ',') continue
        want++
        const x = x0 + rx, y = y0 + ry
        // WHAT MAY STAND IN WATER, AND WHY IT IS NOT A HUT.
        //
        // The first rule here let a stilt hut stand in the wet, on the grounds
        // that a fen hut is built on staddles. That is true of fen huts and
        // false of THIS world: a window may draw a hut on posts, but the tile
        // underneath is water, water is blocked, and a building whose floor is
        // blocked is a building nobody can go inside. The picture cannot grant
        // reachability -- the same reason the constitution insists a town is
        // its drawing and not its plot, read backwards.
        //
        // So a BUILDING goes on the bank. What may stand in water is what
        // already does: FURNITURE you work from the shore -- trap racks and a
        // fowler's hide -- and only where a citizen can stand beside it, which
        // is exactly the rule a fishing spot lives by. A node with no walkable
        // tile next to it is unreachable, the founding sweeps it, and it is
        // right to.
        const wet = ['eel-traps', 'fowler'].includes(seat.kind)
        const standing = isWater(g, x, y) && !inSea(g, x, y)   // a mere or a beck, not the ocean
        const wadeable = [[1, 0], [-1, 0], [0, 1], [0, -1]]
          .some(([dx2, dy2]) => !blockedAt(g, x + dx2, y + dy2))
        if (!inB(x, y) || onRoad(g, x, y) || inAnySettlement(x, y)) continue
        if (blockedAt(g, x, y) && !(wet && standing && wadeable)) continue
        // NOT `taken` -- FOR THE THIRD TIME IN THIS FOUNDING.
        //
        // `taken` reserves ground that nothing stands on. The scatter marks
        // tiles for POROSITY so a wood never closes up, layPlan reserves every
        // lane and plaza of a drawing, and both of those are reservations
        // against future scatter rather than statements that a tile is
        // occupied. Testing it has now silently emptied three different things:
        // the market stalls, the town fields, and these traps -- which laid
        // ZERO of eight nodes on a shoreline where five tiles passed every
        // other gate. Ask whether a NODE stands here, which is the question.
        if (Object.values(w.nodes).some((q) => q.x === x && q.y === y)) continue
        const spec = WORK_NODE[ch]
        if (!spec) continue
        put('work-' + i + '-' + rx + '-' + ry, spec[0], x, y, spec[1] ?? {})
        got++; laid++
      }
      for (let ry = -1; ry <= ph; ry++) for (let rx = -1; rx <= pw; rx++)
        taken.add(key(x0 + rx, y0 + ry))
      if (seat.name) {
        for (const [dx, dy] of [[pw >> 1, ph + 1], [-2, ph >> 1], [pw + 1, ph >> 1], [pw >> 1, -2]]) {
          const x = x0 + dx, y = y0 + dy
          if (free(x, y)) { put('work-sign-' + i, 'signpost', x, y, { text: seat.name }); break }
        }
      }
      if (want && got / want < 0.4)
        console.warn('WORLDGEN: ' + seat.kind + ' at ' + seat.x + ',' + seat.y
          + ' only laid ' + got + ' of ' + want)
      works++
    }
    _workCount = laid
  }

  // ================= ONE THING YOU CAN ONLY DO THERE =================
  //
  // §7e. Thirty-nine of this island's eighty-one buildings hold nothing but a
  // bed, a hearth and a table -- a door, a floor, and no reason to open it.
  // The answer is not to furnish them. It is to give a FEW of them the only
  // place in the world where something can be done, the way the looking glass
  // has the only face-changing in Tallyholm.
  //
  // Scarce on purpose. Eight brewhouses would be wallpaper for exactly the
  // reason nine shrines were.
  {
    // ---- THE INN'S POT ----
    // A brewpot a citizen raises is theirs and works for them alone, which is
    // right for a thing somebody built. This one is the inn's: no owner, and
    // the brew rides on the citizen the way a crop does, so one pot serves
    // everybody and nobody can sit on it. At the Lantern rather than in a
    // room in Anchor -- a public house is where a public pot belongs, and it
    // stands a good walk further from any vault, which is the price.
    const inn = loneRooms(g)[0]
    if (inn) {
      const [ix, iy] = [inn[0] + 1, inn[1] + 1]
      for (const [id, q] of Object.entries(w.nodes)) if (q.x === ix && q.y === iy) delete w.nodes[id]
      put('inn-brewpot', 'brewpot', ix, iy, {})
      for (const [dx, dy] of [[1, 2], [2, 2], [-2, 1], [4, 1]]) {
        const x = inn[0] + dx, y = inn[1] + dy
        if (free(x, y)) { put('inn-sign', 'signpost', x, y, { text: 'the Lantern \u2014 the pot is the house\u2019s' }); break }
      }
    } else console.warn('WORLDGEN: no inn to put the public pot in')

    // ---- THE CHARCOAL CLAMP AT GREENHOLLOW ----
    // §6bo gives the rule for charcoal -- ten ironbark into a BURNING
    // watchfire, one charcoal out -- and this island had no watchfire on it.
    // A recipe in the constitution with nowhere to perform it. The timber town
    // gets the clamp, the wood keeps it lit, and charcoal becomes a thing that
    // exists.
    const gh = ss.find((t) => t.tag === 'greenhollow')
    if (gh) {
      const r = rectOf(gh)
      let seated = false
      for (let rad = 3; rad <= 14 && !seated; rad++)
        for (let dy = -rad; dy <= rad && !seated; dy++) for (let dx = -rad; dx <= rad; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
          const x = gh.x + dx, y = r.y1 + 2 + dy
          if (!free(x, y) || blockedAt(g, x, y) || inAnySettlement(x, y)) continue
          put('greenhollow-clamp', 'watchfire', x, y, {})
          for (const [ax, ay] of [[x + 1, y], [x - 1, y], [x, y + 1]])
            if (free(ax, ay)) { put('clamp-collier', 'keeper', ax, ay,
              { kind: 'collier', name: 'Hal the Collier' }); break }
          for (const [ax, ay] of [[x, y - 2], [x + 2, y], [x - 2, y]])
            if (free(ax, ay)) { put('clamp-sign', 'signpost', ax, ay,
              { text: 'the charcoal clamp \u2014 feed it ironbark' }); break }
          seated = true; break
        }
      if (!seated) console.warn('WORLDGEN: no ground for the charcoal clamp')
    }

    // ---- WHO LIVES HERE ----
    // §7h. Thirty-nine rooms held a bed, a hearth and nobody. The answer is
    // not another verb -- three rooms with the only place in the world where
    // something can be done is the right number of those -- it is that
    // somebody lives here. See worldgen-residents-v7.mjs.
    //
    // A resident blocks their tile like any keeper, so each seat was chosen
    // off the room census: interior floor, never the doorway, never the cell
    // whose removal seals the room. The founding checks all three anyway,
    // because a person standing in a door is how this island has corked a
    // building three separate times.
    {
      const wallAt4 = (x, y) => Object.values(w.nodes).some((q) =>
        q.x === x && q.y === y && (q.type === 'wall' || q.type === 'rampart'))
      let seated = 0, refused = 0
      for (let i = 0; i < RESIDENTS.length; i++) {
        const r = RESIDENTS[i]
        if (!inB(r.x, r.y) || blockedAt(g, r.x, r.y)) { refused++; continue }
        // NOT a groundKindAt test. A town cottage's interior does not report
        // as 'floor' -- that kind belongs to the lone rooms out in the country
        // -- so requiring it refused 27 of 37 residents from rooms that
        // plainly have floorboards. The seats come from the room census and
        // are inside a room by construction.
        // A PERSON BEATS A TABLE. Most of these cottages are furnished to
        // capacity -- a three-by-two interior with a bed, a hearth and a table
        // has no free tile at all -- so a resident may take the tile a table,
        // shelf or barrel stands on, and never the bed or the hearth. A room
        // with a bed, a fire and somebody in it is better furnished than a
        // room with one more table and nobody. The seat finder allowed this
        // and the builder did not, which is why seven of eight refusals were
        // a person standing politely outside their own house.
        const sitting = Object.entries(w.nodes).find(([, q]) => q.x === r.x && q.y === r.y)
        if (sitting) {
          const [sid, sn] = sitting
          const movable = sn.type === 'landmark' && ['table', 'shelf', 'barrel'].includes(sn.kind)
          if (!movable) { refused++; continue }
          delete w.nodes[sid]
        }
        if ((wallAt4(r.x - 1, r.y) && wallAt4(r.x + 1, r.y))
         || (wallAt4(r.x, r.y - 1) && wallAt4(r.x, r.y + 1))) { refused++; continue }
        put('resident-' + i, 'keeper', r.x, r.y, { kind: r.kind, name: r.name })
        seated++
      }
      if (refused) console.warn('WORLDGEN: ' + refused + ' of ' + RESIDENTS.length
        + ' residents had nowhere to stand')
      _residentCount = seated
    }

    // ---- MILLBROOK'S TWO LOCK-UPS ----
    // The market's drawing gives six houses and the roster fills four. The
    // other two stood on the chart with LITERALLY nothing in them -- the only
    // rooms on the island in that state -- because the plan reserved them for
    // trades nobody rostered. A market has lock-ups: cold rooms where the
    // crates wait for market day.
    //
    // Placed by coordinate rather than by scanning for empty floor. The scan
    // found six tiles and put the furniture in none of the two rooms it was
    // written for, which is the whole argument of this founding in one line:
    // "find me somewhere that looks empty" is not the same question as "put
    // this in that room".
    {
      // Two of these six landed on tiles that already held something -- the
      // rooms are four by three and the plan puts a little in them -- so the
      // list is the tiles that are actually free.
      // AND NOT IN THE DOOR. The third piece of each set sat at y194 -- which
      // is the gap in the south wall of its own lock-up -- so furnishing the
      // two rooms SEALED them, and `towndoors.mjs` caught it the moment a
      // resident moved in and there was nothing left to walk on. Four pieces
      // to a room, all on the back wall.
      const LOCKUPS = [
        [446, 193, 'barrel'], [447, 193, 'shelf'], [448, 193, 'barrel'],
        [453, 193, 'barrel'], [454, 193, 'shelf'], [455, 193, 'barrel'],
      ]
      let n3 = 0
      for (const [x, y, kind] of LOCKUPS) {
        if (!inB(x, y) || blockedAt(g, x, y)) continue
        if (Object.values(w.nodes).some((q) => q.x === x && q.y === y)) continue
        put('lockup-' + n3, 'landmark', x, y, { kind }); n3++
      }
      if (n3 < LOCKUPS.length)
        console.warn('WORLDGEN: only ' + n3 + ' of ' + LOCKUPS.length + ' lock-up pieces stood')
      _lockupCount = n3
    }

    // ---- WHITING ISLE, AND THE BOAT TO IT ----
    //
    // §7bu. A ferry at Eastmere's quay and a ferry on the isle. Two named
    // points and nothing between them: you walk to the quay, you cross, and you
    // walk at the other end. That is a crossing, and it is the opposite of a
    // waystone, which dissolves distance everywhere at once.
    //
    // What is on the isle has to be worth the crossing, and it must not be
    // anywhere else -- an island with a second-best copy of something is a
    // detour, not a destination. So the DEEP FISHING moves here entire.
    {
      const isle = islesOf(g).find((i) => i.tag === 'whiting')
      const em = ss.find((t) => t.tag === 'eastmere')
      if (isle && em) {
        // the isle's quay, on its western shore facing home
        let put2 = null
        for (let dx = -isle.rx; dx <= 0 && !put2; dx++)
          for (let dy = -3; dy <= 3; dy++) {
            const x = isle.x + dx, y = isle.y + dy
            if (!inB(x, y) || isWater(g, x, y) || blockedAt(g, x, y) || !free(x, y)) continue
            put2 = [x, y]; break
          }
        if (put2) {
          put('ferry-whiting', 'ferry', put2[0], put2[1], {})
          put('whiting-sign', 'signpost', put2[0], put2[1] + 1,
            { text: 'Whiting Isle \u2014 the boat home' })
          // (the deep water itself is in the seam table, at the isle's own
          // coordinates -- see worldgen-seams-v7)
          for (const [dx, dy, k] of [[2, -3, 'withy-stack'], [3, 2, 'eel-rack'], [-2, 3, 'log-pile']])
            if (free(isle.x + dx, isle.y + dy) && !isWater(g, isle.x + dx, isle.y + dy))
              put('whiting-' + k, 'landmark', isle.x + dx, isle.y + dy, { kind: k })
          // §7bw: THE SALTERN. Shallow pans cut in the rock, the sea let in and
          // the wind taking the water. It is the isle's reason: master fishing
          // is a tier and could stand anywhere, but salt needs a windy shore
          // with nothing behind it, and there is one such place.
          let sp = 0
          for (let dx = -4; dx <= 4 && sp < 5; dx++) for (let dy = -3; dy <= 3 && sp < 5; dy++) {
            const x = put2[0] + dx, y = put2[1] + dy
            if (!inB(x, y) || isWater(g, x, y) || blockedAt(g, x, y) || !free(x, y)) continue
            if (Math.abs(dx) + Math.abs(dy) < 2) continue
            put('saltpan-' + sp, 'salt-pan', x, y, {}); sp++
          }
          put('whiting-keeper', 'keeper', put2[0] + 1, put2[1],
            { kind: 'fisher', name: 'Cuthred the Ferryman' })
        }
        // and the quay at Eastmere: on the shore, beside the town
        let put1 = null
        // a dry tile with the sea within two, searched wide -- the first cut
        // asked for water ORTHOGONALLY adjacent inside fourteen tiles of the
        // town's centre and found none, so the boat had one end and not the
        // other: an island reachable only from the island.
        for (let r = 3; r <= 30 && !put1; r++)
          for (let dy = -r; dy <= r && !put1; dy++) for (let dx = -r; dx <= r; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue
            const x = em.x + dx, y = em.y + dy
            if (!inB(x, y) || isWater(g, x, y) || blockedAt(g, x, y) || !free(x, y)) continue
            if (onRoad(g, x, y) || inAnySettlement(x, y)) continue
            let nearSea = false
            for (let ax = -2; ax <= 2 && !nearSea; ax++) for (let ay = -2; ay <= 2; ay++)
              if (isWater(g, x + ax, y + ay)) { nearSea = true; break }
            if (!nearSea) continue
            put1 = [x, y]; break
          }
        if (put1) {
          put('ferry-eastmere', 'ferry', put1[0], put1[1], {})
          put('ferry-sign', 'signpost', put1[0], put1[1] + 1,
            { text: 'the boat to Whiting Isle' })
        }
      }
    }

    // ---- THE LISTS, AND THE BOAT OFF FENMARCH ----
    //
    // §7cs. A second crossing from a different quay: Fenmarch to the Lists.
    // Nothing is on the isle but ground and the boat -- there is nothing to
    // gather, nothing to build, nothing to take home. What it has is a rule.
    {
      const li = islesOf(g).find((i) => i.tag === 'lists')
      const fm = ss.find((t) => t.tag === 'fenmarch')
      if (li && fm) {
        let lq = null
        for (let dx = -li.rx; dx <= 0 && !lq; dx++)
          for (let dy = -3; dy <= 3; dy++) {
            const x = li.x + dx, y = li.y + dy
            if (!inB(x, y) || isWater(g, x, y) || blockedAt(g, x, y) || !free(x, y)) continue
            lq = [x, y]; break
          }
        if (lq) {
          put('ferry-lists', 'ferry', lq[0], lq[1], {})
          put('lists-sign', 'signpost', lq[0], lq[1] + 1,
            { text: 'The Lists \u2014 no plate, no book, no grace. The boat home.' })
          // a ring of standing stones: the ground says what it is
          for (let a = 0; a < 8; a++) {
            const x = Math.round(li.x + Math.cos(a * 0.785) * 5)
            const y = Math.round(li.y + Math.sin(a * 0.785) * 4)
            if (inB(x, y) && free(x, y) && !isWater(g, x, y))
              put('lists-stone-' + a, 'landmark', x, y, { kind: 'standing-stone' })
          }
        }
        let fq = null
        for (let r = 3; r <= 30 && !fq; r++)
          for (let dy = -r; dy <= r && !fq; dy++) for (let dx = -r; dx <= r; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue
            const x = fm.x + dx, y = fm.y + dy
            if (!inB(x, y) || isWater(g, x, y) || blockedAt(g, x, y) || !free(x, y)) continue
            if (onRoad(g, x, y) || inAnySettlement(x, y)) continue
            let nearSea = false
            for (let ax = -2; ax <= 2 && !nearSea; ax++) for (let ay = -2; ay <= 2; ay++)
              if (isWater(g, x + ax, y + ay)) { nearSea = true; break }
            if (!nearSea) continue
            fq = [x, y]; break
          }
        if (fq) {
          put('ferry-fenmarch', 'ferry', fq[0], fq[1], {})
          put('lists-quay-sign', 'signpost', fq[0], fq[1] + 1,
            { text: 'the boat to the Lists \u2014 it will not take you in armour' })
        }
      }
    }

    // ---- THE TREES THAT ARE NOT TIMBER ----
    // §7u. Landmark trees: nothing gathers them, so they can stand where the
    // country wants trees rather than where the world wants woodcutting.
    {
      let tN = 0
      const _fieldish = new Set()
      const _worky = new Set()
      const WORKS = new Set(['furnace', 'sawpit', 'anvil', 'brewpot', 'watchfire', 'well',
        'altar', 'looking-glass', 'rockfall', 'tollgate', 'ossuary', 'stall', 'bank', 'store',
        'iron-rock', 'coal-rock', 'gold-rock', 'magic-rock', 'mother-lode', 'brimstone-vent',
        'muck-heap', 'fishing-spot', 'eel-spot', 'deep-fish-spot', 'gibbet-shoal', 'tree',
        'oak-tree', 'ironbark-tree', 'heartwood-tree', 'gallows-oak', 'rock'])
      for (const n of Object.values(w.nodes)) {
        if (n.type === 'plot' || n.type === 'hedge' || n.type === 'fence')
          _fieldish.add(n.x + ',' + n.y)
        if (WORKS.has(n.type)) _worky.add(n.x + ',' + n.y)
      }
      const tree = (x, y, kind) => {
        if (!inB(x, y) || blockedAt(g, x, y) || isWater(g, x, y) || onRoad(g, x, y)
            || onLane(g, x, y) || inAnySettlement(x, y) || !free(x, y)) return false
        // §7u: AND NOT AGAINST A FIELD. A landmark tree blocks its tile, so a
        // tree planted against a hedge is another panel of hedge -- and these
        // are laid AFTER the sealed-enclosure sweep, so they can shut a field
        // the sweep has just opened. Measured: the first pass of these took the
        // island's unreachable plots from 36 back up to 180.
        //
        // Two tiles' clearance from anything a field is made of. It also stops
        // trees crowding the furlongs, which no farmer would have allowed.
        // ...and the lookup is a SET, built once. The first version of this
        // scanned every node in the world inside a five-by-five loop for every
        // candidate tile on the island, which is quadratic and took the
        // founding from a minute to past ten.
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++)
          if (_fieldish.has((x + dx) + ',' + (y + dy))) return false
        // §7u: nor on a gatherable, nor against a work. A tree standing on a
        // seam takes a rock out of the world, and one against the sawpit takes
        // an approach off the only sawpit there is.
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++)
          if (_worky.has((x + dx) + ',' + (y + dy))) return false
        put('tree7-' + (tN++), 'landmark', x, y, { kind })
        return true
      }
      // WILLOWS take the water: Stillwater's shore and the becks that feed it.
      for (const W of WATERS) {
        if (W.kind !== 'mere' && W.kind !== 'tarn') continue
        for (let a = 0; a < 14; a++) {
          const th = (a / 14) * Math.PI * 2
          const x = Math.round(W.x + Math.cos(th) * (W.rx + 2))
          const y = Math.round(W.y + Math.sin(th) * (W.ry + 2))
          if ((thash(g, x, y, 131) % 3) === 0) tree(x, y, 'willow')
        }
      }
      // DEAD TREES where the land turned: the Wilds and the Moor.
      for (let y = 6; y < g.worldH - 6; y += 3) for (let x = 6; x < g.worldW - 6; x += 3) {
        const b = biomeAt(g, x, y)
        if (b !== 'wilds' && b !== 'moor') continue
        if ((thash(g, x, y, 137) % 13) !== 0) continue
        tree(x, y, 'dead-tree')
      }
      // PINES on the high ground, and WIND-THORN on the open Downs.
      for (let y = 6; y < g.worldH - 6; y += 2) for (let x = 6; x < g.worldW - 6; x += 2) {
        const b = biomeAt(g, x, y)
        if (b === 'crags' && (thash(g, x, y, 139) % 11) === 0) tree(x, y, 'pine')
        else if (b === 'downs' && (thash(g, x, y, 149) % 19) === 0) tree(x, y, 'wind-thorn')
      }
      // §7af: AND THE COUNTRIES THE FURNITURE USED TO FILL. The heartlands and
      // the fens had no landmark trees at all -- their texture was carts and
      // haystacks and hurdles, and that is exactly what came out looking
      // generated. Hedgerow oaks and fen willows instead: a farmed country is
      // full of trees nobody planted deliberately, in ones and twos along a
      // boundary, and it never reads as a machine's work.
      for (let y = 6; y < g.worldH - 6; y += 2) for (let x = 6; x < g.worldW - 6; x += 2) {
        const b = biomeAt(g, x, y)
        if (b === 'heartlands' && (thash(g, x, y, 151) % 37) === 0) tree(x, y, 'old-oak-lm')
        else if (b === 'fens' && (thash(g, x, y, 157) % 23) === 0) tree(x, y, 'willow')
        else if (b === 'moor' && (thash(g, x, y, 163) % 31) === 0) tree(x, y, 'thorn')
      }

      // AND THE AVENUE TO HOLLYBARROW. Two lines of oaks either side of the
      // road for forty tiles up to the town -- the one thing on this island
      // that can only mean somebody planted it, for show, on purpose.
      const hb = ss.find((t) => t.tag === 'hollybarrow')
      if (hb) {
        // FOLLOW THE ROAD, DO NOT ASSUME IT. The first cut planted at hb.x-3
        // and hb.x+3 straight down from the town and got THREE oaks, because
        // the road out of Hollybarrow does not run due south -- roads here are
        // ROUTED, not drawn, and the whole point of that is that they bend.
        //
        // So: find the road tiles near the town, work out which way each one
        // runs, and plant a pair either side of it. An avenue that follows a
        // bending lane is a better avenue anyway.
        // WALK THE LANE, DO NOT SCAN A BOX.
        //
        // Three tries at this and the first two both scanned a rectangle of
        // road tiles and planted a pair beside each. That gives a ragged line:
        // a road here is TWO TILES WIDE, so both of its columns qualify and
        // plant their own pair, and on a diagonal stretch the pairs land at
        // different offsets and the avenue comes out in clumps and gaps. It
        // read worst exactly where the road was straightest, which is where an
        // avenue is most obviously meant to be regular.
        //
        // An avenue is planted by somebody walking the lane. So: step ALONG the
        // road from the town, one tile at a time, and every fourth step set one
        // oak either side at a fixed offset from the centre of the way. Even
        // spacing, even offset, and it follows the bends because the walk does.
        let laid = 0
        const roadAt = (x, y) => inB(x, y) && onRoad(g, x, y)
        // find the lane leaving the town
        let cx2 = hb.x, cy2 = hb.y, dirx = 0, diry = 1
        for (let k = 1; k < 30 && !roadAt(cx2, cy2); k++) { cy2 = hb.y + k }
        const been = new Set()
        for (let step = 0; step < 90 && laid < 44; step++) {
          been.add(cx2 + ',' + cy2)
          // the next road tile that continues the way, preferring straight on
          const cand = [[dirx, diry], [diry, dirx], [-diry, -dirx], [-dirx, -diry]]
          let moved = false
          for (const [mx, my] of cand) {
            const nx2 = cx2 + mx, ny2 = cy2 + my
            if (!roadAt(nx2, ny2) || been.has(nx2 + ',' + ny2)) continue
            dirx = mx; diry = my; cx2 = nx2; cy2 = ny2; moved = true; break
          }
          if (!moved) break
          if (step % 4 !== 0) continue
          if (Math.hypot(cx2 - hb.x, cy2 - hb.y) < 6) continue
          // perpendicular to the way, three tiles out, clear of the carriageway
          const px2 = -diry, py2 = -dirx === 0 ? dirx : dirx
          for (const side of [1, -1]) {
            const tx = cx2 + (diry === 0 ? 0 : side * 3) , ty = cy2 + (dirx === 0 ? 0 : side * 3)
            const ax = diry !== 0 ? cx2 + side * 3 : cx2
            const ay = dirx !== 0 ? cy2 + side * 3 : cy2
            if (roadAt(ax, ay)) continue
            if (tree(ax, ay, 'avenue-oak')) laid++
          }
        }
        console.warn('WORLDGEN: the Hollybarrow avenue, ' + laid + ' oaks')
      }
      console.warn('WORLDGEN: ' + tN + ' landmark trees')
    }

    // ---- THE TRAINING YARD ----
    // §7t. Dummies for the melee, butts for the bow, in ONE walled ground on
    // the heartlands road -- the peaceful country, before you venture out,
    // which is where a person ought to find out what they are carrying.
    //
    // One yard and not two. Separate grounds for archers and for swordsmen
    // would split a small population into two smaller ones, which is the same
    // mistake three furnaces would have been. And it is where a newcomer meets
    // somebody who is not a newcomer, which no other building on this island
    // reliably does.
    {
      const an = ss.find((t) => t.tag === 'anchor')
      if (an) {
        const YARD = [
          '#########',
          '#d.d.d..#',
          '#.......#',
          '#.......#',
          '#b.b.b..#',
          '####.####',
        ]
        let placed = false
        for (let rad = 10; rad <= 30 && !placed; rad++)
          for (let dy = -rad; dy <= rad && !placed; dy++) for (let dx = -rad; dx <= rad; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
            const ox = an.x + dx, oy = an.y + dy
            if (biomeAt(g, ox, oy) !== 'heartlands') continue
            let clear = true
            for (let ry = 0; ry < YARD.length && clear; ry++)
              for (let rx = 0; rx < YARD[0].length; rx++) {
                const x = ox + rx, y = oy + ry
                // §7w: AND CLEAR OF THE ROAD'S EDGE, not merely off its tiles.
                // The first seating tested `onRoad` per tile and put the yard's
                // west wall hard against the lane -- a wall standing on the
                // verge, which is the same fault as a stall in a doorway.
                let byRoad = false
                for (let ax = -1; ax <= 1 && !byRoad; ax++) for (let ay = -1; ay <= 1; ay++)
                  if (onRoad(g, x + ax, y + ay) || onLane(g, x + ax, y + ay)) { byRoad = true; break }
                if (!inB(x, y) || blockedAt(g, x, y) || isWater(g, x, y) || byRoad
                    || inAnySettlement(x, y) || !free(x, y)) { clear = false; break }
              }
            if (!clear) continue
            for (let ry = 0; ry < YARD.length; ry++)
              for (let rx = 0; rx < YARD[0].length; rx++) {
                const ch = YARD[ry][rx], x = ox + rx, y = oy + ry
                if (ch === '#') put('yard-w-' + rx + '-' + ry, 'wall', x, y, {})
                // §7t: 64-HEX IDS, so `special` can name one. Its shape asks
                // for hex64 -- the PvP target -- and a yard mob with an
                // ordinary id could not be named by it without a new field or
                // a new verb. Giving the straw men hex names costs nothing and
                // the shape already fits.
                else if (ch === 'd' || ch === 'b') {
                  const seed = (ch === 'd' ? 'dummy' : 'butt') + ':' + x + ':' + y
                  const hid = E.sha256(Buffer.from(seed)).toString('hex')
                  E.addMob(w, hid, ch === 'd' ? 'dummy' : 'butt', x, y)
                }
              }
            put('yard-sign', 'signpost', ox + 4, oy + 6, { text: 'the training yard' })
            put('yard-keeper', 'keeper', ox + 7, oy + 2,
              { kind: 'arms', name: 'Wystan Yardmaster, iron flail' })
            placed = true; break
          }
        if (!placed) console.warn('WORLDGEN: no ground in the heartlands for the training yard')
      }
    }

    // ---- THE SAWPIT AT THE SAWYER'S CAMP ----
    // §7q. Logs become planks here and nowhere else. It goes in the yard of
    // the Sawyer's Camp -- a place drawn in the first week of v7 with a sawyer
    // standing in it, an oak or two behind, and nothing whatever to saw. The
    // same argument as the mill and the altar: a room that has been miming a
    // trade gets the trade.
    //
    // Deep in the Greenwood, which is where you saw: at the wood, a long way
    // from anywhere you would build with the boards.
    {
      const sc = placeSeatsOf(g).find((P) => P.tag === 'deepwood')
      if (sc) {
        let set3 = false
        for (let rad = 2; rad <= 8 && !set3; rad++)
          for (let dy = -rad; dy <= rad && !set3; dy++) for (let dx = -rad; dx <= rad; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
            const x = sc.x + dx, y = sc.y + dy
            if (x >= sc.x0 && x < sc.x0 + sc.w && y >= sc.y0 && y < sc.y0 + sc.h) continue
            if (!free(x, y) || blockedAt(g, x, y) || isWater(g, x, y) || onRoad(g, x, y)) continue
            // §7w: AND A YARD ROUND IT. The first seating asked only that the
            // sawpit's own tile be free, and it landed with two oaks and a
            // heartwood across its whole southern side -- three of the four
            // approaches to the only sawpit on the island, held by trees that
            // were there first. Test the SHED and the yard, not the tile.
            {
              // ...and `free()` is not the same question. It asks whether the
              // founding has RESERVED a tile, not whether something stands on
              // it -- the two oaks and the heartwood across the sawpit's south
              // side were never reserved by anybody, they simply grew there,
              // and every `free()` test in the world says yes to them.
              let room = true
              const occupied = new Set()
              for (const q of Object.values(w.nodes)) occupied.add(q.x + ',' + q.y)
              for (let ry = -2; ry <= 2 && room; ry++) for (let rx = -2; rx <= 2; rx++) {
                const mx = x + rx, my = y + ry
                if (!inB(mx, my) || blockedAt(g, mx, my) || isWater(g, mx, my)
                    || onRoad(g, mx, my) || !free(mx, my)
                    || occupied.has(mx + ',' + my)) { room = false; break }
              }
              if (!room) continue
            }
            // §7w: the same again -- a sawpit is a trestle under a roof, and
            // its log piles belong in the yard, not in the doorway.
            // §7w: the same -- in the open, with its log piles in the yard
            // rather than in the doorway.
            put('deepwood-sawpit', 'sawpit', x, y, {})
            // §7w: AND CLAIM THE APPROACHES. Testing what stands here is not
            // enough, because the Greenwood's oaks are sown AFTER this and were
            // never in the set -- the fourth time this founding a pass has been
            // caught depending on something laid later. Per §19e the answer is
            // not to reorder: it is to RESERVE. Four tiles marked taken, and
            // every later pass in the world respects taken.
            for (const [ax, ay] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]])
              taken.add(key(ax, ay))
            for (const [ax, ay, k] of [[x + 4, y, 'log-pile'], [x - 4, y, 'log-pile'],
                                       [x + 4, y + 2, 'stump']])
              if (free(ax, ay) && !blockedAt(g, ax, ay) && !isWater(g, ax, ay))
                put('sawpit-' + k + '-' + ax, 'landmark', ax, ay, { kind: k })
            for (const [ax, ay] of [[x, y - 2], [x + 2, y], [x - 2, y]])
              if (free(ax, ay)) { put('sawpit-sign', 'signpost', ax, ay,
                { text: 'the sawpit \u2014 logs to planks' }); break }
            set3 = true; break
          }
        if (!set3) console.warn('WORLDGEN: no ground at the Sawyer\u2019s Camp for the sawpit')
      }
    }

    // ---- THE FURNACE AT CRAGFOOT ----
    // §7p. One furnace on the island, beside the seam and a long way from the
    // anvil. Three would have split the island into three small crowds; one
    // makes a place -- and Cragfoot's own crier has been saying the shape of
    // this out loud since v6: "Mine here; the anvil is at Thornbury."
    //
    // On the OUTSKIRTS, not in the square. A bloomery is built where the ore
    // and the fuel are, in the smoke and the spoil, and nobody puts one next
    // to their market.
    const cf = ss.find((t) => t.tag === 'cragfoot')
    if (cf) {
      const r = rectOf(cf)
      let set2 = false
      for (let rad = 4; rad <= 16 && !set2; rad++)
        for (let dy = -rad; dy <= rad && !set2; dy++) for (let dx = -rad; dx <= rad; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
          const x = cf.x + dx, y = r.y1 + 3 + dy
          if (!free(x, y) || blockedAt(g, x, y) || isWater(g, x, y)) continue
          if (inAnySettlement(x, y) || onRoad(g, x, y) || onLane(g, x, y)) continue
          // §7w: TEST THE WHOLE FOOTPRINT FIRST. A shed was drawn here once and
          // came out in pieces, because every wall tile was guarded on its own
          // and the founding had already taken some of them. A building is not
          // a set of independent tiles: either all of it fits or none of it
          // does, and the seating loop is where that is decided.
          {
            let room = true
            for (let ry = -3; ry <= 3 && room; ry++) for (let rx = -4; rx <= 4; rx++) {
              const mx = x + rx, my = y + ry
              if (!inB(mx, my) || blockedAt(g, mx, my) || isWater(g, mx, my)
                  || onRoad(g, mx, my) || onLane(g, mx, my) || inAnySettlement(mx, my)
                  || !free(mx, my)) { room = false; break }
            }
            if (!room) continue
          }
          // §7w: A SHED ROUND THE FIRE, AND THE APPROACHES LEFT CLEAR.
          //
          // Two faults in the first cut and the second is the bad one. The
          // furnace was ONE TILE in an open grey waste -- smaller than a
          // barrel, for the only furnace on the island, when the mill was given
          // a five-tile round-house precisely so it would not read as a
          // trinket. And its spoil heap, log pile and cut face went at x+1,
          // x-1 and y+1: THREE OF THE FOUR WAYS IN, leaving a single approach
          // tile to a place a crowd is meant to gather at.
          //
          // A bloomery shed now, with a wide door, and the yard goods set well
          // outside it. Nothing that blocks stands beside the furnace.
          // §7w: THE BLOOMERY SHED. Walls, a wide south door, the fire in the
          // middle where the crowd can reach it from three sides at once.
          const SHED = ['#########', '#.......#', '#.......#', '#...F...#',
                        '#.......#', '#.......#', '###.#.###']
          for (let ry = 0; ry < SHED.length; ry++) for (let rx = 0; rx < 9; rx++)
            if (SHED[ry][rx] === '#') put('shed-f-' + rx + '-' + ry, 'wall', x + rx - 4, y + ry - 3, {})
          // §7w: IN THE OPEN, AND THE APPROACHES CLEAR.
          //
          // A shed was drawn round the fire here and came out in pieces: every
          // wall tile is guarded by `free()`, the founding has already used
          // some of them, and what stood was a broken L rather than a room. A
          // half-built shed reads worse than no shed, so the bloomery is a
          // plain open hearth in its yard -- which is what a bloomery is.
          //
          // What the first cut really got wrong was not the shed, it was that
          // the spoil heap, log pile and cut face went at x+1, x-1 and y+1 --
          // THREE OF THE FOUR WAYS IN, leaving one approach tile to a place a
          // crowd is meant to gather at. The yard goods stand well off it now
          // and nothing that blocks is beside the furnace at all.
          put('cragfoot-furnace', 'furnace', x, y, {})
          for (const [ax, ay] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]])
            taken.add(key(ax, ay))
          for (const [ax, ay, k] of [[x - 5, y - 1, 'spoil-heap'], [x + 5, y, 'log-pile'],
                                     [x - 5, y + 2, 'cut-face'], [x + 5, y + 2, 'charcoal-ring']])
            if (free(ax, ay) && !blockedAt(g, ax, ay) && !isWater(g, ax, ay))
              put('furn-' + k, 'landmark', ax, ay, { kind: k })
          for (const [ax, ay] of [[x, y + 4], [x + 4, y + 3], [x - 4, y + 3]])
            if (free(ax, ay) && !blockedAt(g, ax, ay)) { put('furnace-sign', 'signpost', ax, ay,
              { text: 'the bloomery \u2014 ore and coal to iron' }); break }
          for (const [ax, ay] of [[x + 2, y + 1], [x - 2, y + 1], [x + 2, y - 1]])
            if (free(ax, ay) && !blockedAt(g, ax, ay)) { put('furnace-keeper', 'keeper', ax, ay,
              { kind: 'collier', name: 'Ulf at the Bloomery' }); break }
          set2 = true; break
        }
      if (!set2) console.warn('WORLDGEN: no ground at Cragfoot for the furnace')
    }

    // ---- THE ALTAR AT NORWICK ----
    // §7g. Three magic-stones become a sigil, and until now that happened
    // wherever the citizen was standing -- which in practice meant beside the
    // magic seam they had just mined, out in the Wilds, because that is the
    // one place the walk home is worth not making.
    //
    // Norwick is the garrison on the edge of the Wilds and the last roof
    // before the Brandline. An altar in its hall makes the westward trip end
    // somewhere: you mine out there and you invoke on the way back, which is
    // the shape the journey should have had all along.
    const nw = ss.find((t) => t.tag === 'norwick')
    if (nw) {
      const r = rectOf(nw)
      let set = false
      for (let dy = -6; dy <= 6 && !set; dy++) for (let dx = -6; dx <= 6; dx++) {
        const x = nw.x + dx, y = nw.y + dy
        if (groundKindAt(g, x, y) !== 'floor') continue      // indoors only
        if (blockedAt(g, x, y)) continue
        if (Object.values(w.nodes).some((q) => q.x === x && q.y === y)) continue
        // not in a doorway, and not where it seals the room
        const wallAt2 = (ax, ay) => Object.values(w.nodes).some((q) =>
          q.x === ax && q.y === ay && (q.type === 'wall' || q.type === 'rampart'))
        if ((wallAt2(x - 1, y) && wallAt2(x + 1, y)) || (wallAt2(x, y - 1) && wallAt2(x, y + 1))) continue
        put('norwick-altar', 'altar', x, y, {})
        set = true; break
      }
      if (!set) console.warn('WORLDGEN: no room in Norwick for the altar')
    }

    // ---- THE BEE GARDEN AT HOLLYBARROW ----
    // No new verb here and none pretended: skeps and a keeper, on the farm
    // town's own ground. Texture, honestly labelled as texture.
    const hb = ss.find((t) => t.tag === 'hollybarrow')
    if (hb) {
      const r = rectOf(hb)
      let n2 = 0
      for (let dy = 0; dy < 4 && n2 < 6; dy++) for (let dx = 0; dx < 6 && n2 < 6; dx++) {
        const x = r.x1 + 4 + dx * 2, y = r.y0 + 4 + dy * 2
        if (!free(x, y) || blockedAt(g, x, y)) continue
        put('hb-skep-' + n2, 'landmark', x, y, { kind: 'skep' }); n2++
      }
      for (const [dx, dy] of [[r.x1 + 3, r.y0 + 5], [r.x1 + 3, r.y0 + 7]]) {
        if (free(dx, dy)) { put('hb-beekeeper', 'keeper', dx, dy,
          { kind: 'beekeeper', name: 'Wenna of the Skeps' }); break }
      }
      _skepCount = n2
    }
  }

  // ================= THE LOOKING GLASS =================
  //
  // §7d. A citizen's first face is free, at the door. Changing it afterwards
  // is a walk to the one place on the island you can see yourself.
  //
  // Two things are wrong with a face you edit in a menu. It costs nothing, so
  // it means nothing -- and every window wired the verb to its own door, so
  // the world had no idea the choice existed. Meanwhile Anchor's Hall 2 is a
  // four-by-nine room containing one hearth, and the same is true of most of
  // the eighty-one buildings on this island: a door, a floor, and no reason.
  //
  // One glass, in one hall, in the capital. Scarce on purpose: it is a
  // Schelling point like the seams, and the walk is the whole point of it.
  {
    // Anchor's Hall 2 (4x9 at 473,270) -- the hearth room off the south lane
    const gx = 475, gy = 274
    if (inB(gx, gy) && !blockedAt(g, gx, gy)) {
      for (const [id, q] of Object.entries(w.nodes)) if (q.x === gx && q.y === gy) delete w.nodes[id]
      put('looking-glass', 'looking-glass', gx, gy, {})
      // and a board outside, because a room you cannot know the use of is a
      // room nobody enters
      for (const [dx, dy] of [[0, 6], [0, 7], [-4, 0], [4, 0], [0, -6], [0, -7], [-4, 4], [4, 4]]) {
        const x = gx + dx, y = gy + dy
        if (free(x, y)) { put('glass-sign', 'signpost', x, y, { text: 'the glass \u2014 look at yourself' }); break }
      }
    } else console.warn('WORLDGEN: no room for the looking glass at ' + gx + ',' + gy)
  }

  // ================= THE TOLL, ON THE MILLBROOK BRIDGE =================
  //
  // Which crossing, decided by measurement rather than taste. Shut each of the
  // island's five crossings in turn and ask how much longer every journey
  // between towns becomes: Fenford costs six tiles, Highford sixteen, the
  // Watersmeet fifty-four, the Oxenford sixty-eight -- and the MILLBROOK
  // BRIDGE costs two hundred and eight, lengthening sixteen of the forty-five
  // journeys on the island. It is the only crossing on Tallyholm that is worth
  // anything, and the walk round it (Anchor to Hollybarrow, 177 tiles becoming
  // 385) is long enough to hurt and short enough to take when you have arrived
  // without a log.
  //
  // The bar stands on the deck; the keeper stands on the bank beside it. See
  // TOLL_TICKS in engine.js for why the toll is a log and not a coin.
  {
    const br = bridgesOf(g).find(b => b.tag === 'br1')     // the Millbrook Bridge
    if (br) {
      // the middle of the span: a gate on the abutment is a gate you walk round
      let gx = br.x, gy = br.y
      let w0 = br.x, e0 = br.x
      while (w0 > 3 && isWater(g, w0 - 1, gy)) w0--
      while (e0 < W - 4 && isWater(g, e0 + 1, gy)) e0++
      gx = (w0 + e0) >> 1
      // A BAR ACROSS THE WHOLE DECK. The first cut skipped any tile that was
      // already `taken` and so gated two of the span's three rows -- leaving
      // the third open, and a toll you can side-step is scenery. Measured:
      // Anchor to Hollybarrow was 177 tiles with the bar up and 177 with it
      // down. Every deck tile on the line is gated, and whatever was standing
      // on one is cleared, the way a place clears its footprint.
      const bar = []
      for (let y = gy - 3; y <= gy + 3; y++) {
        if (!inB(gx, y) || !onBridge(g, gx, y)) continue
        for (const [id, q] of Object.entries(w.nodes))
          if (q.x === gx && q.y === y) delete w.nodes[id]
        bar.push([gx, y])
      }
      for (const [x, y] of bar) put('toll-millbrook-' + y, 'tollgate', x, y, { text: 'the Millbrook Bridge \u2014 one log' })
      // the keeper, on the first dry ground east of the bar
      let seated = false
      for (let dx = 1; dx <= 8 && !seated; dx++) for (const dy of [0, -1, 1]) {
        const x = gx + dx, y = gy + dy
        if (!inB(x, y) || isWater(g, x, y) || blockedAt(g, x, y) || taken.has(key(x, y))) continue
        put('toll-keeper-millbrook', 'keeper', x, y, { kind: 'toll', name: 'the bridge-keeper' })
        seated = true; break
      }
      for (const dx of [-4, 4]) {
        const x = gx + dx, y = gy
        if (inB(x, y) && !taken.has(key(x, y)) && !isWater(g, x, y) && !blockedAt(g, x, y)) {
          put('toll-sign' + dx, 'signpost', x, y, { text: 'the bridge is kept \u2014 a log to cross' })
        }
      }
      if (!bar.length) console.warn('WORLDGEN: the Millbrook Bridge took no toll gate')
    }
  }

  // ================= THE PLACES =================
  // Eighteen one-off things, hand-drawn in worldgen-places-v7.mjs, each seated
  // at a locality that already had a name on the chart and nothing under it.
  // None of them is required, none of them repeats, and most of them have a
  // door. See the note at the top of that file for why that is the shape.
  {
    const PLACE_NODE = {
      '#': ['wall'], '%': ['rampart'], 'R': ['railing'],
      // §7cb: 'Z' seats the caged dead rather than a node -- see below
      '!': ['landmark', { kind: 'standing-stone' }],
      // §7ab: the Moorgrave's furniture. A grave and a yew are LANDMARKS --
      // nothing gathers them, so a graveyard can be full of them without being
      // a tier (§20d).
      'g': ['landmark', { kind: 'grave' }], 'W': ['landmark', { kind: 'yew' }],
      'o': ['well'], '*': ['campfire'], 'h': ['hearth'], 'e': ['landmark', { kind: 'table' }],
      'd': ['landmark', { kind: 'bed' }], 'v': ['landmark', { kind: 'shelf' }],
      'q': ['landmark', { kind: 'barrel' }], 'D': ['dedication'], 'B': ['ossuary'],
      'T': ['tree'], 'Y': ['gallows-oak'], '^': ['hedge'], 'f': ['fence'],
    }
    let placed = 0, nodes0 = putCount
    for (const P of placeSeatsOf(g)) {
      // A PLACE OWNS ITS FOOTPRINT. Every locality already carried a signpost
      // at its exact centre, seated long before this pass -- and a place is
      // seated at that same centre, so the board landed on whatever the
      // drawing put in the middle. The Nine Stones' dedication, the Maze's
      // centre stone and the Drowned Bell's were all quietly replaced by a
      // signpost, and the Bothy's doorway was corked by one. Anything already
      // standing inside the drawing is cleared: the place brings its own name
      // on its own board, at its edge, where a board belongs.
      for (let ry = 0; ry < P.h; ry++) for (let rx = 0; rx < P.w; rx++) {
        if (P.rows[ry][rx] === '~') continue
        const x = P.x0 + rx, y = P.y0 + ry
        for (const [id, q] of Object.entries(w.nodes))
          if (q.x === x && q.y === y) delete w.nodes[id]
      }
      // §7y: A PLACE OUTRANKS A FIELD IT WAS DRAWN THROUGH.
      //
      // The towns' furlongs are laid earlier and sprawl a long way -- Oxenford's
      // reach from x315 to x380 -- and the hand-drawn places are set down
      // afterwards, so the apiary's fence came down INTERLEAVED with ploughed
      // rows: `..p.p.###` on one line, a pen and a field sharing tiles. It is
      // the ordering fault of §19e once more, and the answer is the one that
      // rule already gives: the later pass corrects what it finds.
      //
      // A place is eighteen hand-drawn buildings; a furlong is a pattern
      // stamped over half a shire. The plough gives way.
      for (let ry = -1; ry <= P.h; ry++) for (let rx = -1; rx <= P.w; rx++) {
        const x = P.x0 + rx, y = P.y0 + ry
        for (const [nid, nn] of Object.entries(w.nodes))
          // ...and not only `field-`. The first cut of this cleared field ids
          // alone and left the apiary's fence drawn straight through hold5's
          // vegetable patch: a croft's garden is ploughed ground too, and it
          // was laid by a different pass with a different prefix. Match on what
          // a thing IS, not on what it happens to be called.
          if (nn.x === x && nn.y === y
              && (nn.type === 'plot' || nn.type === 'hedge' || nn.type === 'fence')
              && !nid.startsWith('place-')) delete w.nodes[nid]
      }
      for (let ry = 0; ry < P.h; ry++) for (let rx = 0; rx < P.w; rx++) {
        const ch = P.rows[ry][rx]
        if (ch === '~' || ch === '.' || ch === ',') continue
        // §7cb: 'Z' IS NOT A NODE. It seats the caged dead -- a mob, in a place
        // drawing, which nothing else here does. It belongs in the drawing
        // because WHERE it stands is the whole design: inside a ring of iron
        // railing, where no blade reaches it and it reaches no one.
        if (ch === 'Z') {
          const zx = P.x0 + rx, zy = P.y0 + ry
          if (inB(zx, zy)) E.addMob(w, 'caged-' + P.tag, 'gibbet-dead', zx, zy)
          continue
        }
        const spec = PLACE_NODE[ch]
        if (!spec) continue
        const x = P.x0 + rx, y = P.y0 + ry
        if (!inB(x, y) || taken.has(key(x, y))) continue
        put('place-' + P.tag + '-' + rx + '-' + ry, spec[0], x, y, spec[1] ?? {})
      }
      // reserve the whole footprint so no later pass drops a cairn in the maze
      for (let ry = -1; ry <= P.h; ry++) for (let rx = -1; rx <= P.w; rx++)
        taken.add(key(P.x0 + rx, P.y0 + ry))
      // a board at the near edge, because a place with no name is scenery
      for (const [dx, dy] of [[P.w >> 1, P.h + 1], [P.w >> 1, -2], [-2, P.h >> 1], [P.w + 1, P.h >> 1]]) {
        const x = P.x0 + dx, y = P.y0 + dy
        if (inB(x, y) && !taken.has(key(x, y)) && !isWater(g, x, y) && !blockedAt(g, x, y)) {
          put('place-sign-' + P.tag, 'signpost', x, y, { text: P.sign ?? P.name }); break
        }
      }
      // ...and WHAT IS BEHIND THE DOOR. A keeper stands on the place's own
      // floor where it has one and in its yard where it does not; the seams
      // and shoals go on the open ground just outside, because a coal seam in
      // somebody's parlour is a joke rather than a place.
      const inside = PLACE_INSIDE[P.tag]
      if (inside) {
        const floors = [], yards = []
        for (let ry = 0; ry < P.h; ry++) for (let rx = 0; rx < P.w; rx++) {
          const ch = P.rows[ry][rx]
          const x = P.x0 + rx, y = P.y0 + ry
          if (ch === ',') floors.push([x, y])
          else if (ch === '.') yards.push([x, y])
        }
        // A KEEPER BLOCKS THE TILE THEY STAND ON, so where they stand is a
        // graph question and nothing else. Two wrong answers first:
        //
        //   `list[1]` -- an arbitrary cell -- sealed ELEVEN of the eighteen
        //   places, every one of which this founding had already proved you
        //   could walk into.
        //
        //   "the cell with the most floor around it" sealed the maze WORSE
        //   (38 cells lost), because in a one-tile corridor the most connected
        //   cell is the middle of the corridor, and every cell in a corridor
        //   is a cut vertex.
        //
        // So: ask. A keeper may stand anywhere whose removal does not
        // disconnect the rest of the room. Places drawn with no such cell --
        // the King's Oak has two open tiles in a line -- get their warden
        // outside the ring, which is where a warden stands anyway.
        const standable = (list) => {
          const inSet = new Set(list.map(([x, y]) => x + ',' + y))
          const conn = (skip) => {
            const start2 = list.find(([x, y]) => (x + ',' + y) !== skip)
            if (!start2) return true
            const seen = new Set([start2.join(',')]); const q2 = [start2]
            let h2 = 0
            while (h2 < q2.length) {
              const [x, y] = q2[h2++]
              for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const kk = (x + dx) + ',' + (y + dy)
                if (kk === skip || !inSet.has(kk) || seen.has(kk)) continue
                seen.add(kk); q2.push([x + dx, y + dy])
              }
            }
            return seen.size === list.length - 1
          }
          for (const c of list) if (conn(c.join(','))) return c
          return null
        }

        if (inside.keeper) {
          // A RING OF STONES HAS NO FLOOR. The Boneyard and the Nine Stones
          // draw nothing but stones and open country, so `floors` and `yards`
          // were both empty and their wardens were quietly never seated -- the
          // same silent-nothing this founding has caught four times now. If
          // the drawing offers no ground, stand them just outside it.
          if (!floors.length && !yards.length) {
            outer: for (let r = 1; r <= 4; r++)
              for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue
                const x = P.x0 + (P.w >> 1) + dx, y = P.y0 + (P.h >> 1) + dy
                if (free(x, y) && !blockedAt(g, x, y)) { yards.push([x, y]); break outer }
              }
          }
          let at = standable(floors) || standable(yards)
          if (!at) {   // no cell of the drawing may be blocked: stand outside
            outer2: for (let r = 1; r <= 5; r++)
              for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue
                const x = P.x0 + (P.w >> 1) + dx, y = P.y0 + (P.h >> 1) + dy
                if (x >= P.x0 && x < P.x0 + P.w && y >= P.y0 && y < P.y0 + P.h) continue
                if (free(x, y) && !blockedAt(g, x, y)) { at = [x, y]; break outer2 }
              }
          }
          if (at && !isWater(g, at[0], at[1]) && !blockedAt(g, at[0], at[1])) {
            for (const [id, q] of Object.entries(w.nodes))
              if (q.x === at[0] && q.y === at[1]) delete w.nodes[id]
            put('place-keeper-' + P.tag, 'keeper', at[0], at[1],
              { kind: inside.keeper.kind, ...(inside.keeper.name ? { name: inside.keeper.name } : {}) })
          }
        }
        // §7z: A PLACE MAY NOT SEED A TIER.
        //
        // The Sawyer's Camp asked for two oaks and a heartwood, Deadreach for a
        // gallows-oak, the Kingswood for a heartwood -- five gatherable trees
        // standing outside the seam table, in clusters of two and three. The
        // seam table's own tree clusters are THREE, FOUR and TWO nodes, so
        // these were not decoration beside a tier, they were extra tiers: a
        // fourth and fifth place a woodcutter could stand that nothing
        // sanctioned.
        //
        // This island already carries two or three clusters per tier rather
        // than the one a Schelling point wants. It cannot afford five. A
        // forester walks to the seam and carries the logs to the sawpit, which
        // is what a sawpit is for.
        const TIERED = new Set(['tree', 'oak-tree', 'ironbark-tree', 'heartwood-tree',
          'gallows-oak', 'rock', 'iron-rock', 'coal-rock', 'gold-rock', 'magic-rock',
          'mother-lode', 'brimstone-vent'])
        let ni = 0
        for (const [type, count] of (inside.nodes ?? [])) {
          if (TIERED.has(type)) continue
          for (let c = 0; c < count; c++) {
            let placed = false
            for (let r = 2; r <= 16 && !placed; r++)
              for (let dy = -r; dy <= r && !placed; dy++) for (let dx = -r; dx <= r; dx++) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue
                const x = P.x0 + (P.w >> 1) + dx, y = P.y0 + (P.h >> 1) + dy
                const wet = type === 'eel-spot' || type === 'fishing-spot'
                // WATER IS BLOCKED GROUND, which is exactly where a shoal
                // goes. Testing blockedAt for a wet node refuses every tile it
                // could ever stand on -- the Eel Sheds asked for three eel
                // spots and got none, five radii running.
                // ...and OUTSIDE the drawing. A coal seam laid on the gate
                // cell of the King's Oak sealed the King's Oak.
                if (x >= P.x0 && x < P.x0 + P.w && y >= P.y0 && y < P.y0 + P.h) continue
                if (!inB(x, y) || taken.has(key(x, y))) continue
                if (wet !== isWater(g, x, y)) continue
                if (!wet && blockedAt(g, x, y)) continue
                if (onRoad(g, x, y)) continue
                put('place-' + P.tag + '-' + type + '-' + (ni++), type, x, y, {})
                taken.add(key(x, y)); placed = true; break
              }
            if (!placed) console.warn('WORLDGEN: no room for a ' + type + ' at ' + P.name)
          }
        }
      }

      // ...and whoever lives there. Seated on the place's own open ground where
      // there is any, on the country just outside where there is not, so that
      // the Sentinel keeps its emptiness and the kennels get their dogs.
      const spots = []
      for (let ry = 0; ry < P.h; ry++) for (let rx = 0; rx < P.w; rx++) {
        const ch = P.rows[ry][rx]
        if (ch !== '.' && ch !== ',') continue
        spots.push([P.x0 + rx, P.y0 + ry])
      }
      for (let r = 1; r <= 3 && spots.length < 12; r++)
        for (let rx = -r; rx < P.w + r; rx++) for (let ry = -r; ry < P.h + r; ry++) {
          if (rx > -r && rx < P.w + r - 1 && ry > -r && ry < P.h + r - 1) continue
          const x = P.x0 + rx, y = P.y0 + ry
          if (inB(x, y) && !isWater(g, x, y) && !blockedAt(g, x, y) && !onRoad(g, x, y)) spots.push([x, y])
        }
      let mi = 0
      for (const [kind, n] of (PLACE_MOBS[P.tag] ?? [])) {
        for (let k = 0; k < n; k++) {
          const at = spots[(mi * 5 + k * 3 + 1) % Math.max(1, spots.length)]
          if (!at) break
          E.addMob(w, 'place-' + P.tag + '-' + kind + '-' + k, kind, at[0], at[1])
        }
        mi++
      }
      placed++
    }
    if (placed < Object.keys(PLACES_V7).length)
      console.warn('WORLDGEN: only ' + placed + ' of ' + Object.keys(PLACES_V7).length + ' places found ground')
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
  // v7: THREE KINDS, NOT EIGHT, AND FEWER OF THEM.
  //
  // A croft, a shrine, a gibbet, a kennel and a stone circle are PLACES: each
  // one reads like somewhere, and the moment there are nine of them scattered
  // at random none of them is anywhere. Eight kinds on rotation, one every
  // thirty-five tiles, produced 626 built things in the country and not a
  // single landmark -- more props than the map this was measured against, and
  // fewer places. They are hand-drawn one-offs now (worldgen-places-v7.mjs),
  // exactly once each, at the localities that already carried their names.
  //
  // What is left here is what SHOULD repeat, because repetition is what it is:
  // a cairn is a pile of stones somebody made, an orchard is a farmer's, bees
  // are kept in numbers. Nobody looks at the fourth cairn and wonders about it,
  // which is precisely why a fourth cairn is fine and a fourth shrine was not.
  const waysideKinds = ['cairn', 'orchard', 'beehives']
  const buildWayside = (x, y, kind, tag) => {
    const ok = (ax, ay) => free(ax, ay) && !onRoad(g, ax, ay)  // §6cz: never build decor on the road
    switch (kind) {
      case 'croft': { // an abandoned smallholding: four walls, a door, a dead plot
        if (![[0,0],[1,0],[2,0],[0,1],[2,1],[0,2],[1,2],[2,2]].every(([a,b]) => ok(x+a, y+b))) return false
        let i = 0
        for (const [a, b] of [[0,0],[1,0],[2,0],[0,1],[2,1],[0,2],[2,2]]) put('croft-' + tag + (i++), 'wall', x+a, y+b)
        // The walls were checked and the PLOT AND SIGN WERE NOT. They sit
        // outside the three-by-three the test covers -- (x+4,y+1) and
        // (x+1,y+3) -- so a croft raised beside a skull pile or a peat
        // marker dropped its plot straight on top of one, and two nodes
        // held the same tile. Nothing complained: addNode does not ask, and
        // validateState does not either. Check the ground you actually
        // build on; a croft with no sign is still a croft.
        if (ok(x + 4, y + 1)) put('croft-' + tag + '-p', 'plot', x + 4, y + 1, { plantedAt: 0 })
        if (ok(x + 1, y + 3)) put('croft-' + tag + '-s', 'signpost', x + 1, y + 3, { text: 'an empty croft' })
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
        // §6ao (v6): an orchard is TEXTURE -- fruit trees you walk past, not a
        // gathering grove. It was eight gatherable trees, a little rival to the
        // timber town; now they are landmark trees (no logs), so chopping stays
        // at Greenhollow and the orchard is only a place you recognise.
        // §7o: AN ORCHARD IS TREES, NOT ONE TREE EIGHT TIMES. Eight identical
        // old-oaks packed into a five-tile square was the single worst clump on
        // the island -- measured at up to sixteen of one kind inside two tiles
        // where two orchards met. Five trees, spread wider, with a bee skep and
        // a windfall among them: the same acre, read as an orchard rather than
        // as a stamp.
        const _fruit = ['old-oak', 'apple-tree', 'pear-tree']
        for (const [a, b, kk] of [[0, 0, 0], [3, 0, 1], [6, 0, 0], [1, 3, 2], [5, 3, 1]])
          if (ok(x + a, y + b)) put('orch-' + tag + (n++), 'landmark', x + a, y + b,
            { kind: _fruit[(thash(g, x + a, y + b, 71) + kk) % _fruit.length] })
        if (ok(x + 3, y + 2)) put('orchs-' + tag, 'landmark', x + 3, y + 2, { kind: 'skep' })
        if (ok(x + 6, y + 3)) put('orchw-' + tag, 'landmark', x + 6, y + 3, { kind: 'windfall' })
        for (let a = -1; a <= 7; a++) if (ok(x + a, y + 5) && a !== 3) put('orchh-' + tag + a, 'hedge', x + a, y + 5)
        return n >= 3 }
      case 'gibbet':
        if (!ok(x, y)) return false
        put('gib-' + tag, 'landmark', x, y, { kind: 'broken-tower' })
        if (ok(x + 1, y)) put('gib-' + tag + 's', 'signpost', x + 1, y, { text: 'the crossroads gibbet' })
        return true
      case 'kennel': {
        if (!ok(x, y) || !ok(x + 1, y)) return false
        put('ken-' + tag, 'hearth', x, y); put('ken-' + tag + 'k', 'keeper', x + 1, y, { name: keeperName(tag, 'kennel') })
        for (let a = -1; a <= 3; a++) if (ok(x + a, y + 2)) put('kenf-' + tag + a, 'fence', x + a, y + 2)
        return true }
      case 'beehives': {
        let n = 0
        for (const [a, b] of [[0,0],[1,1],[2,0],[3,1]]) if (ok(x+a, y+b)) { put('bee-' + tag + (n++), 'landmark', x+a, y+b, { kind: 'skep' }) }
        return n > 2 }
      default: { // bouldercircle
        let n = 0
        // §6ao (v6): the stone rings are LANDMARKS, not a mining spot -- they
        // were gatherable rock (fifty-odd of them, scattered mining that pulled
        // miners off Cragfoot). Now they are standing stones: the same ring you
        // steer by, but you mine at the seam.
        for (const [a, b] of [[0,-2],[2,-1],[2,1],[0,2],[-2,1],[-2,-1]]) if (ok(x+a, y+b)) { put('bcirc-' + tag + (n++), 'landmark', x+a, y+b, { kind: 'standing-stone' }) }
        return n > 3 }
    }
  }
  // Spacing is measured along the ROAD now, not along the straight line
  // between its ends, so a route that swings twenty tiles wide to get round
  // the Barrow earns milestones for the walking it actually costs.
  for (const { tag, path } of routedPathsOf(g)) {
    const PL = path.length
    if (PL < 24) continue
    // ...and one every SIXTY tiles rather than every thirty-five. The milestones
    // (every other stop) still fall about every two minutes' walk, which is the
    // job they do; the sights between them are now something you come across
    // rather than something you pass continuously.
    const stops = Math.max(1, Math.round(PL / 60))
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
    const ok = (ax, ay) => free(ax, ay) && !onRoad(g, ax, ay)  // §6cz: never build decor on the road
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
    // §7af: THE COUNTRY FURNITURE IS OFF.
    //
    // This scattered a floor of "things" across every country to stop the land
    // reading as empty, and it is the last scatter left on an island where the
    // seams, camps, holdings, fields, works and residents are all hand-placed
    // tables. It shows: three carts abreast, four wells fenced into a two-by-
    // two, a standing stone every few paces of nothing.
    //
    // A tree can stand anywhere and read as landscape. A CART CANNOT -- a cart
    // is evidence of a person, and evidence of a person in a nonsensical
    // arrangement reads worse than bare ground. So the generic furniture goes,
    // the hand-drawn things stay (the spider's web, the dragon's burnt ring,
    // the Drowned Bell, the capes, the mills, the clamp), and what the country
    // gets instead is MORE TREES, which is the one kind that never looks
    // placed by a machine.
    const COUNTRY_FURNITURE_OFF = true
    for (const [country, floor] of Object.entries(COUNTRY_FURNITURE_OFF ? {} : FURNITURE_FLOOR)) {
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
  // §7ag: A WAYMARK IS FOR A JUNCTION, NOT FOR EVERY WIGGLE.
  //
  // This put one at every road BEND, and a routed road bends constantly -- so
  // a winding stretch collected a mark every few tiles. Measured: 133 of them,
  // median nearest-neighbour distance FIVE tiles, minimum one, and seventy of
  // the hundred and thirty-three with another inside six. Whatever that is, it
  // is not "one thing every thirty-five tiles of road", and it is exactly why
  // the roadsides read as generated.
  //
  // A mark means SOMETHING HAPPENS HERE: a fork, a ford, a county boundary, a
  // pass. So a bend qualifies only if nothing else has been marked within
  // twenty-five tiles -- which cuts a winding lane to one mark and leaves the
  // junctions, because a junction is a place a road actually turns toward
  // somewhere.
  let wm = 0
  const _wmAt = []
  const WAYMARK_APART = 25
  for (const b of roadBendsOf(g)) {
    if (_wmAt.some((q) => Math.hypot(q[0] - b.x, q[1] - b.y) < WAYMARK_APART)) continue
    for (const [dx, dy] of [[0,0],[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,-1]]) {
      const x = b.x + dx, y = b.y + dy
      if (!free(x, y)) continue
      const bi = biomeAt(g, x, y)
      if (bi === 'sea') continue
      // §6ao (v6): a waymark is TEXTURE at a road bend, not a gatherable node.
      // It used to drop a tree or a rock at every bend -- eighty scattered
      // little gathering spots along the roads, exactly the scatter that keeps
      // citizens apart. Now it is a landmark (a standing stone or a stump): the
      // same silhouette to steer by, but you gather at the Schelling points.
      // §7o: AND THE COUNTRY SPEAKS ITS OWN VOCABULARY.
      //
      // One hundred and thirty-five waymarks drawn from TWO kinds -- a stump or
      // a standing stone -- is why the roadsides read as generated. It is the
      // wallpaper fault again (see the note in worldgen-places-v7 about eight
      // rotating kinds), and the cure is not fewer marks, it is more words: a
      // node kind costs nothing, and a country that repeats itself twice a mile
      // has no landmarks at all, only furniture.
      //
      // So each country marks its roads with what that country has. The Crags
      // put up stones and cairns; the Greenwood leaves stumps and log-piles;
      // the Moor has cairns and lone thorns; the Fens have hurdles and eel
      // racks; the Downs have sheep hurdles and dew-marks; the Wilds have
      // whatever was left standing. Same silhouette to steer by, twelve words
      // instead of two.
      const WAYKINDS = {
        crags:      ['standing-stone', 'cairn', 'spoil-heap', 'cut-face'],
        wilds:      ['standing-stone', 'cairn', 'burnt-tree', 'sunken-wall'],
        moor:       ['cairn', 'standing-stone', 'thorn', 'peat-stack'],
        downs:      ['hurdle', 'standing-stone', 'dew-mark', 'sheep-skull'],
        fens:       ['hurdle', 'eel-rack', 'withy-stack', 'stump'],
        greenwood:  ['stump', 'log-pile', 'old-oak', 'charcoal-ring'],
        heartlands: ['stump', 'milestone', 'hurdle', 'crude-hearth'],
      }
      const _wk = WAYKINDS[bi] ?? WAYKINDS.heartlands
      taken.add(key(x, y))
      _wmAt.push([x, y])
      E.addNode(w, 'waymark-' + (wm++), 'landmark', x, y,
        { kind: _wk[thash(g, x, y, 61) % _wk.length] })
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
  // 6ch: putWaystoneEarly is gone with the stones.
  { // the Sawyer's Camp
    const c = siteSeek(0.50, 0.15, 'greenwood', 4)
    sput('camp-house', 'hearth', c.x, c.y); sput('camp-hearth', 'campfire', c.x + 2, c.y)
    sput('kpr-camp-sawyer', 'keeper', c.x + 1, c.y + 1, { name: keeperName('camp', 'sawyer', { name: keeperName('camp', 'sawyer') }) })
    for (const [i, [dx, dy]] of [[-3,-2],[3,-2],[-4,1],[4,1],[-2,3],[2,3],[0,-4],[0,4]].entries()) sput('camp-t-' + i, 'landmark', c.x + dx, c.y + dy, { kind: 'stump' })  // §6ao (v6): camp texture, not a grove
  }
  { // the High Delving: now a WALLED quarry with one entrance -- a room
    const c = siteSeek(0.81, 0.38, 'crags', 7)
    let i = 0
    for (let a = -6; a <= 6; a++) {
      if (a !== 0) { sput('dlvw-' + (i++), 'wall', c.x + a, c.y - 5); sput('dlvw-' + (i++), 'wall', c.x + a, c.y + 5) }
    }
    for (let b2 = -4; b2 <= 4; b2++) { sput('dlvw-' + (i++), 'wall', c.x - 6, c.y + b2); sput('dlvw-' + (i++), 'wall', c.x + 6, c.y + b2) }
    sput('delve-house', 'hearth', c.x - 4, c.y - 3); sput('delve-shelter', 'hearth', c.x + 4, c.y - 3)  // §6am (v6): was an anvil -- removed, so the only anvil is Thornbury's and ore leaves the Crags to be worked
    sput('delve-hearth', 'campfire', c.x + 3, c.y - 3); sput('kpr-delve-high', 'keeper', c.x - 3, c.y - 3, { name: keeperName('delve', 'high', { name: keeperName('delve', 'high') }) })
    for (const [i2, [dx, dy]] of [[-3,0],[3,0],[-2,2],[2,2],[0,3],[-4,1],[4,1],[-1,3],[1,-1]].entries()) sput('delve-r-' + i2, 'landmark', c.x + dx, c.y + dy, { kind: 'cairn' })  // §6ao (v6): quarry texture, not a seam
    sput('delve-sign', 'signpost', c.x, c.y - 6, { text: 'the High Delving' })
  }
  { // the Eel Sheds
    const c = siteSeek(0.48, 0.85, 'fens', 3)
    sput('sheds-house', 'hearth', c.x, c.y); sput('sheds-hearth', 'campfire', c.x + 2, c.y)
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
  { // THE MONASTERY. Prayer was the only skill in this world with nowhere to
    // go, so it is given a place rather than a power.
    //
    // On the Downs and WELL AWAY FROM A BANK, deliberately. Bones do not
    // stack, so a bank beside the ossuary would make the walk a one-time cost
    // and the bonus a flat multiplier -- the decision would vanish and every
    // citizen would simply always come here. Out in the country the walk pays
    // for itself out to about fifty tiles, so hunting the Downs makes it worth
    // carrying your bones in and hunting the Wilds does not.
    //
    // It is a place and not a room in a town, because every other destination
    // here announces itself: the Ring, the Barrow, the Wreck, the standing
    // stones. A monastery folded into a street would be another door.
    const c = siteSeek(0.66, 0.79, 'downs', 10)
    // a small precinct: a wall about it, a door south, and quiet inside
    let i2 = 0
    for (let a = -5; a <= 5; a++) {
      sput('mon-w-' + (i2++), 'wall', c.x + a, c.y - 4)
      if (a !== 0) sput('mon-w-' + (i2++), 'wall', c.x + a, c.y + 4)
    }
    for (let b = -3; b <= 3; b++) {
      sput('mon-w-' + (i2++), 'wall', c.x - 5, c.y + b)
      sput('mon-w-' + (i2++), 'wall', c.x + 5, c.y + b)
    }
    sput('mon-ossuary', 'ossuary', c.x, c.y)
    sput('mon-hearth', 'hearth', c.x - 3, c.y - 3)
    sput('kpr-mon-mourner', 'keeper', c.x + 2, c.y - 1,
      { name: keeperName('monastery', 'mourner'), kind: 'mourner' })
    sput('mon-well', 'well', c.x - 7, c.y + 1)
    // NOT ON THE CENTRE LINE. The door of this precinct is the gap in the
    // middle of the south wall, and the board was put at c.x -- the same
    // column -- so the sign announcing the monastery stood in the only way
    // into it. Third time this founding: the fishmonger corked its own shop
    // and a keeper corked eleven rooms. A board goes BESIDE a door.
    sput('mon-sign', 'signpost', c.x + 2, c.y + 6)
    // §6bp: the second stone, in the monastery precinct. The other place on
    // the island whose entire business is remembering people.
    sput('ded-monastery', 'dedication', c.x + 3, c.y + 2, { tag: 'monastery' })
    // and the stones outside it, because a burying-place has them
    for (let a = -3; a <= 3; a += 3) sput('mon-stone-' + (i2++), 'landmark', c.x + a, c.y + 6, { kind: 'standing-stone' })
  }

  { // The Sheepfolds. The Downs get a BANK, and a tight ring of ordinary
    // stone around it -- not a new tier, not a better rock, the same rock
    // the Crags have. What the Downs sell is LOGISTICS: the only place on
    // the island you can cut stone and bank it without a walk. That is
    // precisely Al Kharid, whose mine holds nothing unique and is the most
    // worked in the game, and it needs no new item to exist.
    const c = siteSeek(0.72, 0.71, 'downs', 8)
    sput('fold-house', 'hearth', c.x, c.y - 4); sput('kpr-fold-shep', 'keeper', c.x + 1, c.y - 4, { name: keeperName('fold', 'shep') })
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
    // §6ao (v6): the Sheepfolds' stones are TEXTURE, not a mining town. This
    // laid up to forty-eight gatherable rocks with a bank beside them -- a
    // second Cragfoot in the Downs that would have split the miners in two. A
    // handful of boulder landmarks now mark the folds; the one seam is Cragfoot.
    let rn = 0
    for (let rad = 3; rad <= 14 && rn < 8; rad++)
      for (let dy = -rad; dy <= rad && rn < 8; dy++) for (let dx = -rad; dx <= rad; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
        const x = c.x + dx, y = c.y + dy
        if (!free(x, y) || biomeAt(g, x, y) !== 'downs') continue
        if ((thash(g, x, y, 71) % 3) !== 0) continue
        E.addNode(w, 'foldrock-' + (rn++), 'landmark', x, y, { kind: 'cairn' }); taken.add(key(x, y))
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
      put('moorwatch-house', 'hearth', px - 2, py - 2)
      sput('moorwatch-sign', 'signpost', px, py + 4, { text: 'the Moorwatch \u00b7 the Brand lies west' })
      // §6ao (v6): the Moorwatch marks the way but no longer speeds it -- a
      // standing stone, not a waystone, so the moor is still crossed on foot.
      put('waystone-moorwatch', 'landmark', px + 6, py, { kind: 'standing-stone' })
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
    put('inn-house', 'hearth', rx0 + 2, ry0 + 1)
    put('kpr-inn-lantern', 'keeper', rx0 + 4, ry0 + 1,
      { name: keeperName('inn', 'lantern'), kind: 'innkeeper' })
    // NO BREWPOT HERE, AND THAT IS THE RULE RATHER THAN AN OVERSIGHT.
    //
    // A brewpot looked like the one building this world had designed and
    // forgotten to build: a node type, a skill, a calling and a section of the
    // manual, and not one standing anywhere. Putting one in the Lantern failed
    // the founding outright -- "brewpot without an owner" -- because §2 says a
    // brewpot carries `by`, the citizen who raised it.
    //
    // Which means brewing is not world furniture at all. It is the one trade
    // whose premises a CITIZEN builds, in a house they have made their own,
    // and the world is right to hold none. The Lantern has a hearth and an
    // innkeeper; whether it ever has a pot is somebody's business, not the
    // generator's.
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
  // §6ao (v6): a PORT'S SHOAL is small and shared -- Karamja had a lobster spot
  // or two on one dock, not a wall of them. Four tight spots at each port, and
  // the coves and the scattered shore-spots that used to smear fishing across
  // the whole coastline are gone. Durable nodes mean four hold any crowd, and
  // the port is a destination because the fish are ONLY there.
  for (const st of ss) {
    if (st.kind !== 'port') continue
    const nearsh = shores.filter(sh => Math.abs(sh.x - st.x) + Math.abs(sh.y - st.y) <= 34)
      .sort((a, b) => (Math.abs(a.x - st.x) + Math.abs(a.y - st.y)) - (Math.abs(b.x - st.x) + Math.abs(b.y - st.y)))
    // 6cb: ONE DOCK, AND MORE OF IT.
    //
    // A revision of this note spread these eight tiles apart, reading the blob
    // as an accident. It is not: the nearest shore tiles to a port are four in
    // a row on purpose, and a fishery everyone can see from a fishery is where
    // people MEET. Six durable spots on one dock hold the same crowd as six
    // strung along a coast -- a node's capacity is its own darkness, not its
    // elbow room -- so scattering them bought nothing and cost the only
    // gathering place in the east where two citizens are certain to see each
    // other.
    //
    // What DID need fixing was everything else that had been drawn to the same
    // beach because it was the only marked shore in the world. The siren has
    // been moved off it (see her seat rule below); the dock stays.
    //
    // Four became six only because starter fishing was SEVEN SPOTS in the whole
    // world across two ports -- the tightest rung on any ladder here, and the
    // one every newcomer begins on with no tier to fall back to.
    let laid = 0
    for (const sh of nearsh) {
      if (laid >= 6) break
      const k = sh.x + ',' + sh.y
      if (usedShore.has(k) || taken.has(k)) continue
      usedShore.add(k); put('fish-' + st.tag + '-' + (fs++), 'fishing-spot', sh.x, sh.y); laid++
    }  }

  // ---- the country's resources ----
  const counts = { waymarks: wm, wayrests: wr, brandstones: br, waysides: wayN, milestones: mileN, buildings: bldN, shirePlaces: placeN, capes: capeN, locales: locN, countryFurniture: furnN }
  const A = (n) => Math.max(1, Math.round(n * (W * H) / (896 * 512)))
  const B = (x, y) => biomeAt(g, x, y)
  const tree = (id, x, y) => E.addNode(w, id, 'tree', x, y)
  const rock = (id, x, y) => E.addNode(w, id, 'iron-rock', x, y)  // §6ao (v6): baseline mining is IRON
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
  // §6ao (v6): SPARSE, SHARED, TIGHT. The gathering resources are cut hard and
  // packed tight -- Draynor had five or six willows, Karamja a lobster spot or
  // two on one dock, and this is ONE shared world, not a hundred servers each
  // needing their own. Every node is durable (see g.gather) and gives a stream,
  // so a handful serves any crowd; scattering them only keeps citizens APART.
  // Each baseline resource is now a SINGLE tight cluster at its specialist town,
  // and the wide biome-scatter that smeared trees and rocks across every country
  // (the "a copse in everyone's backyard" problem) is gone. The world does not
  // go empty: the 4000+ walls, hedges, plots, landmarks and facilities stay --
  // only the redundant gatherables are removed. Sparse WORK, dense WORLD.
  const gh = ss.find(s => s.tag === 'greenhollow')
  const cf = ss.find(s => s.tag === 'cragfoot')
  const nearS = (s, rad) => (x, y) => Math.hypot(x - s.x, y - s.y) <= rad
  // §6ao (v6): GREENHOLLOW'S STAND IS A WALK FROM THE BANK. The trees used to
  // sit beside the bank -- efficient, but no ritual; the Draynor-willow, not
  // the Varrock-mine. Now the seam is set ~40 seconds' walk (about 67 tiles)
  // from Greenhollow's bank, out into the greenwood, so a chopper fills up,
  // carries the logs back past the town, banks, and returns -- the walk every
  // woodcutter shares a thousand times, which is how a place becomes home.
  // Greenhollow's counting house, found from the world already built (banks are
  // seated with the towns, before resources), so the walk ring is correct on
  // every seed rather than pinned to one.
  let ghBank = { x: gh.x, y: gh.y }
  { let bd = Infinity
    for (const n of Object.values(w.nodes)) {
      if (n.type !== 'bank') continue
      const d = Math.hypot(n.x - gh.x, n.y - gh.y)
      if (d < bd) { bd = d; ghBank = { x: n.x, y: n.y } }
    } }
  const inWalkRing = (x, y) => { const d = Math.hypot(x - ghBank.x, y - ghBank.y); return d >= 58 && d <= 74 }
  // §6ao (v6): place the walk-ring seam by ENUMERATING the ring (a narrow
  // predicate the random cluster-search would miss), then clumping tight around
  // one chosen tile so it is a single stand a 40s walk out from the bank.
  {
    const ring = []
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++)
      if (B(x, y) === 'greenwood' && inWalkRing(x, y) && free(x, y) && porous(x, y) && reachableToGather(x, y))
        ring.push((y << 12) | x)
    let placed = 0
    if (ring.length) {
      const hc = H32('gwtree|center', 0)
      const c0 = ring[hc.readUInt32BE(0) % ring.length]
      const cx = c0 & 0xfff, cy = c0 >> 12
      for (let r = 0; r <= 8 && placed < 7; r++)
        for (let dy = -r; dy <= r && placed < 7; dy++) for (let dx = -r; dx <= r && placed < 7; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue
          const x = cx + dx, y = cy + dy
          if (B(x, y) !== 'greenwood' || !free(x, y) || !porous(x, y) || !reachableToGather(x, y)) continue
          tree('gwtree-' + placed, x, y); taken.add(key(x, y)); placed++
        }
    }
    counts.greenwoodTrees = placed
  }
  // §6ao (v6): CRAGFOOT'S SEAM IS A WALK FROM THE BANK TOO. Mining gets the same
  // ritual as woodcutting -- ore mined ~40s out in the Crags and carried back to
  // bank (and, further, all the way to Thornbury to smith). The walk is the
  // work. Enumerate the ring (narrow predicate), clump tight around one tile.
  let cfBank = { x: cf.x, y: cf.y }
  { let bd = Infinity
    for (const n of Object.values(w.nodes)) {
      if (n.type !== 'bank') continue
      const d = Math.hypot(n.x - cf.x, n.y - cf.y)
      if (d < bd) { bd = d; cfBank = { x: n.x, y: n.y } }
    } }
  {
    const ring = []
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const d = Math.hypot(x - cfBank.x, y - cfBank.y)
      if (d >= 58 && d <= 74 && B(x, y) === 'crags' && free(x, y) && porous(x, y) && reachableToGather(x, y))
        ring.push((y << 12) | x)
    }
    let placed = 0
    if (ring.length) {
      const hc = H32('cgrock|center', 0)
      const c0 = ring[hc.readUInt32BE(0) % ring.length]
      const cx = c0 & 0xfff, cy = c0 >> 12
      for (let r = 0; r <= 8 && placed < 7; r++)
        for (let dy = -r; dy <= r && placed < 7; dy++) for (let dx = -r; dx <= r && placed < 7; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue
          const x = cx + dx, y = cy + dy
          if (B(x, y) !== 'crags' || !free(x, y) || !porous(x, y) || !reachableToGather(x, y)) continue
          rock('cgrock-' + placed, x, y); taken.add(key(x, y)); placed++
        }
    }
    // fallback: if the ring was too thin (a town wedged against the coast), keep
    // a doorstep seam rather than none, so mining always exists.
    if (placed === 0) placed = clusterScatter('cgrock', 7, (x, y) => B(x, y) === 'crags' && Math.hypot(x - cf.x, y - cf.y) <= 40, rock, 1, 7)
    counts.cragRocks = placed
  }
  // (baseline fishing is placed by the coastal system above; §6ao cuts it there)
  const deepWilds = (x, y) => {
    if (B(x, y) !== 'wilds') return false
    const edge = brandX(g, y)
    return x < edge - Math.round(edge * 0.28)
  }
  // magic-stone: the risk-gated endgame. Risk is the gate, not scarcity, so a
  // little more spread is fine -- but still cut hard, ~88 -> ~14.
  counts.magicWilds = clusterScatter('wdmagic', 14, deepWilds, mrock, 2, 20)

  // §6am (v6): THE THREE MID SEAMS. One tight clump each -- Draynor-willow scale
  // (~6 nodes), set DEEPER in its country than the baseline, so the middle of
  // the game is a place a citizen walks out to and stands in with the others
  // who have come as far. Durable, so six nodes hold any crowd.
  const midtree = (id, x, y) => E.addNode(w, id, 'oak-tree', x, y)
  const midrock = (id, x, y) => E.addNode(w, id, 'coal-rock', x, y)
  const midfish = (id, x, y) => E.addNode(w, id, 'eel-spot', x, y)
  const deepCrags = (x, y) => {
    if (B(x, y) !== 'crags') return false
    const midx = W >> 1; return x > midx + Math.round((W - midx) * 0.62)
  }
  counts.midCrags = clusterScatter('cgmid', 6, deepCrags, midrock, 1, 8)
  const deepGreenwood = (x, y) => {
    if (B(x, y) !== 'greenwood') return false
    const midx = W >> 1; return x < midx - Math.round(midx * 0.18)
  }
  counts.midGreen = clusterScatter('gwmid', 6, deepGreenwood, midtree, 1, 8)
  const fmk = ss.find(s => s.tag === 'fenmarch')
  const fenShore = (x, y) => {
    if (B(x, y) !== 'fens') return false
    if (Math.hypot(x - fmk.x, y - fmk.y) > 70) return false
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]])
      if (isWater(g, x + dx, y + dy)) return true
    return false
  }
  counts.midFens = clusterScatter('fnmid', 5, fenShore, midfish, 1, 7)

  // §6ao (v6): THE TWO MASTERY SEAMS, each its own remembered place -- the third
  // rung woodcutting and fishing were missing (mining already had magic-stone in
  // the Wilds). Heartwood grows in the DEEP EASTERN GREENWOOD, remote and safe:
  // few need it (it makes a bow, a staff), so danger would only leave it empty;
  // its pull is the long walk to the old heart of the wood. Deep-fish is caught
  // in the WILDS WATER at the gibbet seam, ~15 tiles into the Wilderness: fish
  // are FOOD, everyone in a fight needs them, so the risk is met by a crowd, and
  // the drowned reach below the gibbet becomes a place people brave together.
  const hwtree = (id, x, y) => E.addNode(w, id, 'heartwood-tree', x, y)
  const dfish  = (id, x, y) => E.addNode(w, id, 'deep-fish-spot', x, y)
  // heartwood: the far EASTERN greenwood (past the mid seam in the west), the
  // Kingswood/Nordhead end -- the deep old-growth, a long haul from Greenhollow.
  const deepEastGreenwood = (x, y) => {
    if (B(x, y) !== 'greenwood') return false
    return x > W * 0.60
  }
  counts.heartGrove = clusterScatter('hwtree', 6, deepEastGreenwood, hwtree, 1, 8)
  // 6bc/6bd: THE THIRD RUNG AND THE WILDS RUNG.
  //
  // Ironbark stands in the northern greenwood, well clear of both the mid oaks
  // (west) and the heartwood (far east), so the three woods are three journeys
  // and not three names for one walk.
  // (measured: greenwood runs x 279-690, y 31-187; the starter grove sits near
  // 435,75 and the oaks near 356,56, so the ironbark goes north-EAST of both
  // and well short of the heartwood at 628,145 -- three woods, three journeys.)
  const ironbarkStand = (x, y) => {
    if (B(x, y) !== 'greenwood') return false
    return y < 110 && x > 500 && x < 605
  }
  counts.ironbark = clusterScatter('ibtree', 6, ironbarkStand, (id, x, y) => E.addNode(w, id, 'ironbark-tree', x, y), 1, 8)
  // The gallows-oaks and the mother lode are the same stand and the same seam
  // as the deep Greenwood and the magic-rocks -- only in the Wilds, and paying
  // two to a strike. They are not a better rate; they are a wager.
  const deepWildsSeams = (x, y) => {
    if (B(x, y) !== 'wilds') return false
    const wr = g.geo.wilds
    return x > wr.x0 + (wr.x1 - wr.x0) * 0.45 && x < wr.x1 - 4
  }
  counts.gallows = clusterScatter('gallow', 5, deepWildsSeams, (id, x, y) => E.addNode(w, id, 'gallows-oak', x, y), 1, 8)
  counts.motherLode = clusterScatter('mlode', 5, deepWildsSeams, (id, x, y) => E.addNode(w, id, 'mother-lode', x, y), 1, 8)
  // 6bb: THE GOLD SEAM. Remote but SAFE, and deliberately not the Wilds: the
  // magic-rocks are dangerous wealth and gold is patient wealth, and a world
  // with two of the first and none of the second only has one kind of rich
  // person in it. Far south in the crags, a long walk from anywhere, where the
  // only thing it costs you is the mastery you are not earning while you wait.
  // (measured: the crags run y 105-316 and NOTHING lies below y 320, so the
  // first draft's `y > 0.68H` seated no gold at all. The iron and the coal sit
  // in the southern crags near 785,291 and 751,270; the gold goes to the HIGH
  // crags in the north, which is the emptiest quarter of that country and the
  // longest walk to it from anywhere anyone lives.)
  const goldCountry = (x, y) => {
    if (B(x, y) !== 'crags') return false
    return y < 168 && x > 600
  }
  counts.goldSeam = clusterScatter('gseam', 4, goldCountry, (id, x, y) => E.addNode(w, id, 'gold-rock', x, y), 1, 8)
  // §6bs: THE BRIMSTONE VENTS. The southern crags, where the iron and the coal
  // already are -- brimstone belongs with the working seams and not with the
  // patient wealth in the north, because it is a REAGENT and a master smith
  // will be coming back for it, load after load, for as long as they forge.
  //
  // Safe country, deliberately. The great arms already cost fourteen star
  // ingots, and starmetal is Wilds work: asking the Wilds for the brimstone
  // too would be two dangers for one weapon, which is the mistake §6av names
  // about the handgonne's powder.
  const ventCountry = (x, y) => {
    if (B(x, y) !== 'crags') return false
    return y > 200
  }
  counts.brimstone = clusterScatter('bvent', 4, ventCountry, (id, x, y) => E.addNode(w, id, 'brimstone-vent', x, y), 1, 6)
  // deep-fish: the Wilds-shore water at the DEEP end (12-20 tiles into the
  // Wilds) so fishing there is a real commitment, not a step-out. §6cz FIX: the
  // first version scanned a hardcoded pocket [x170-195, y108-140] that assumed a
  // coastline v6 does not have -- 825 sea tiles there, none with a Wilds-land
  // neighbour, so ZERO deep-fish placed and the Moor's Wilds had no fishing at
  // all. Scan the whole Wilds coast by DEPTH, exactly as the shoal below does,
  // and let the geography say where the deep band is.
  {
    const pocket = []
    for (let y = 42; y <= 389; y++) for (let x = 29; x < 195; x++) {
      if (!isWater(g, x, y)) continue
      // the fisher stands on the LAND beside the water; that land must be Wilds
      // (the water itself is sea-biome). Require a wilds-land neighbour.
      let land = false
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]])
        if (!isWater(g, x + dx, y + dy) && !blockedAt(g, x + dx, y + dy) && B(x + dx, y + dy) === 'wilds') land = true
      if (!land) continue
      const depth = Math.round(W * 0.215) - x   // tiles into the Wilds
      if (depth >= 12 && depth <= 20) pocket.push({ x, y, depth })
    }
    // take a tight cluster of the deep-band fishable tiles (sorted deepest-first,
    // then grouped by proximity so they read as one spot)
    pocket.sort((a, b) => b.depth - a.depth)
    let placed = 0
    if (pocket.length) {
      const anchor = pocket[0]
      const near = pocket.filter(p => Math.abs(p.x - anchor.x) + Math.abs(p.y - anchor.y) <= 6)
      for (const p of near) {
        if (placed >= 4) break
        if (!taken.has(key(p.x, p.y))) { dfish('dfish-' + placed, p.x, p.y); taken.add(key(p.x, p.y)); placed++ }
      }
    }
    counts.deepFish = placed
    // 6be: THE DROWNED SHOAL, deeper again. The same water, the same walk and
    // then some, giving two deep fish to a cast -- fishing's gallows-oak. It
    // sits beyond the deep-fish band (>20 tiles in) so a fisher who wants it
    // has to pass the ordinary deep water and keep going.
    const shoal = []
    for (let y = 42; y <= 389; y++) for (let x = 29; x < 195; x++) {   // the whole Wilds coast, not one pocket
      if (!isWater(g, x, y)) continue
      let land = false
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]])
        if (!isWater(g, x + dx, y + dy) && !blockedAt(g, x + dx, y + dy) && B(x + dx, y + dy) === 'wilds') land = true
      if (!land) continue
      const depth = Math.round(W * 0.215) - x
      if (depth >= 24) shoal.push({ x, y, depth })   // measured: 20 tiles at 20-27, 347 beyond
    }
    shoal.sort((a, b) => b.depth - a.depth)
    let sPlaced = 0
    if (shoal.length) {
      const anchor = shoal[0]
      const near = shoal.filter(p => Math.abs(p.x - anchor.x) + Math.abs(p.y - anchor.y) <= 6)
      for (const p of near) {
        if (sPlaced >= 4) break
        if (!taken.has(key(p.x, p.y))) { E.addNode(w, 'shoal-' + sPlaced, 'gibbet-shoal', p.x, p.y); taken.add(key(p.x, p.y)); sPlaced++ }
      }
    }
    counts.drownedShoal = sPlaced
  }

  // §6ao (v6): the doorstep copses are GONE -- the low-level Draynor in every
  // town's backyard that scattered the starting population and undid the
  // Schelling point before it formed. A newcomer walks to Greenhollow to chop,
  // the way they walk to Cragfoot to mine. Landmark copses (the Vale Copse, the
  // Long Holt) remain as texture, but they grow no gatherable tree.
  counts.copseTrees = 0

  const mob = (kind) => (id, x, y) => E.addMob(w, id, kind, x, y)
  const ccx = Math.floor(W / 2), ccy = Math.floor(H / 2)

  // ---- THE CAMPS AND LAIRS (see worldgen-camps-v7.mjs) ----
  //
  // The beasts were the last thing on this island still scattered by rule. The
  // seams were designed as Schelling points -- a few remembered places rather
  // than a smear -- and seven hundred goblins and wolves spread evenly over
  // two countries is the opposite of that: nowhere to go, because everywhere
  // is the same.
  //
  // So they are camps now, out of a table: a kind, a middle, a count and a
  // spread. Not a coordinate each -- "the wolves on the Hollybarrow road" is
  // what a citizen remembers, and it is what a person places.
  //
  // Nothing here replaces the hand-placed beasts: the eighteen places keep
  // theirs, the pound keeps its goblins, the South Pass keeps its imps, and
  // the four named things keep their own reasons.
  {
    let seated = 0, empty = 0
    for (let ci = 0; ci < CAMPS.length; ci++) {
      const c = CAMPS[ci]
      const spots = []
      for (let dy = -c.r; dy <= c.r; dy++) for (let dx = -c.r; dx <= c.r; dx++) {
        if (dx * dx + dy * dy > c.r * c.r) continue
        const x = c.x + dx, y = c.y + dy
        if (!inB(x, y) || blockedAt(g, x, y) || isWater(g, x, y)) continue
        if (inAnySettlement(x, y) || onRoad(g, x, y)) continue
        // §7bv: THIS LINE IS SEVENTY PER CENT OF THE FOUNDING.
        //
        // It asks "is anything standing here" by walking all 9,582 nodes, for
        // every candidate tile of every camp's ring. The profiler puts it at
        // 3.5 billion ticks against the next line's 1.0 billion -- most of a
        // two-minute world, on one `some`.
        //
        // The fix is an occupancy Set built once. It is NOT APPLIED: two
        // attempts to splice it in put it between a `for` head and its body
        // (rebuilding it sixty thousand times, so the founding stopped
        // finishing) and then above the line where `w` exists at all. A fix
        // that is slower than the bug, then a fix that does not run, so the
        // scan stands and the measurement is written down instead.
        if (Object.values(w.nodes).some((q) => q.x === x && q.y === y)) continue
        spots.push([x, y])
      }
      // deterministic and spread out: take every k'th tile of the ring rather
      // than the first n, so a camp is a camp and not a queue
      const step = Math.max(1, Math.floor(spots.length / Math.max(1, c.n)))
      let placed = 0
      for (let k = 0; k < spots.length && placed < c.n; k += step) {
        const [x, y] = spots[k]
        E.addMob(w, 'camp-' + ci + '-' + placed, c.kind, x, y)
        placed++; seated++
      }
      if (!placed) { empty++
        console.warn('WORLDGEN: the ' + c.kind + ' camp at ' + c.x + ',' + c.y + ' found no ground') }
    }
    counts.camps = CAMPS.length
    counts.campBeasts = seated
    if (empty) console.warn('WORLDGEN: ' + empty + ' camps of ' + CAMPS.length + ' found no ground')
  }
  counts.goblins = 0
  counts.wolves = 0
  // §6ao (v6): THE GIBBET KING holds the Moor. One of him, at the gibbet crossing
  // -- placed like the dragon, a thing that IS there. The Moor is quiet undead
  // ground until a citizen comes near and he raises the dead against them. His
  // risen are summoned in play, not seeded, so the map shows only the King.
  {
    // seat him near the middle of the Moor, on dry standable ground
    let kingSeated = false
    const moorTiles = []
    for (let y = 2; y < H - 2 && moorTiles.length < 4000; y++)
      for (let x = 2; x < W - 2; x++)
        if (B(x, y) === 'moor' && !isWater(g, x, y) && !blockedAt(g, x, y) && free(x, y)) moorTiles.push((y << 12) | x)
    if (moorTiles.length) {
      // pick a deterministic central-ish tile
      moorTiles.sort((a, b) => a - b)
      const pick = moorTiles[Math.floor(moorTiles.length * 0.5)]
      const kx = pick & 0xfff, ky = pick >> 12
      E.addMob(w, 'gibbet-king', 'gibbet-king', kx, ky)
      kingSeated = true
    }
    counts.gibbetKing = kingSeated ? 1 : 0
  }
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
  // §6ao (v6): count the FOREST, not just the gatherable trees. When the wood
  // was cut to a single seam and the rest of its trees became landmark old-oaks
  // (commit-to-scarce), this canopy -- which counted only `tree` nodes -- fell
  // to zero and every bear starved, orphaning the horn-bow they drop. The forest
  // is still there as texture; count the old-oaks and copse trees too, so bear
  // country still follows the blotchy canopy the way it always did.
  const canopy = (() => {
    const sat = new Int32Array((W + 1) * (H + 1))
    for (const n of Object.values(w.nodes)) {
      const isForest = n.type === 'tree'
        || (n.type === 'landmark' && (n.kind === 'old-oak' || n.kind === 'elder-tree'))
      if (isForest) sat[(n.y + 1) * (W + 1) + (n.x + 1)] = 1
    }
    for (let y = 1; y <= H; y++) for (let x = 1; x <= W; x++)
      sat[y * (W + 1) + x] += sat[(y - 1) * (W + 1) + x] + sat[y * (W + 1) + x - 1] - sat[(y - 1) * (W + 1) + x - 1]
    return (x, y, r) => {
      const x0 = Math.max(0, x - r), y0 = Math.max(0, y - r)
      const x1 = Math.min(W - 1, x + r), y1 = Math.min(H - 1, y + r)
      return sat[(y1 + 1) * (W + 1) + x1 + 1] - sat[y0 * (W + 1) + x1 + 1]
           - sat[(y1 + 1) * (W + 1) + x0] + sat[y0 * (W + 1) + x0]
    }
  })()
  // ask for a looser canopy (>=4) since the forest is now landmark-oaks spread
  // thinner than the old dense clusters; still follows the wood's blotchy shape.
  // §13g: SCATTER OFF. This kind is seated from the camp table now; leaving
  // the scatter on simply doubled the population (measured: 870 beasts where
  // 700 stood before, bears and trolls and crabs each counted twice).
  counts.bears  = 0
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
  // TROLLS BELONG TO THE MIDDLE DISTANCE, AND ACROSS IT.
  //
  // The old rule was `wilds && x < W * 0.10` -- longitude again -- which put
  // every troll in one narrow strip and produced a single spike at a hundred
  // and twenty-five tiles out with nothing either side of it. A troll is what
  // you meet on the way in; it should line the whole approach, not stand in a
  // ring at one radius. So the predicate asks how far from a town the tile is
  // rather than how far west, and takes the whole belt from ninety out.
  const depthOf = (x, y) => {
    let d = 1e9
    for (const t of settlementsOf(g)) { const q = Math.hypot(t.x - x, t.y - y); if (q < d) d = q }
    return d
  }
  // §13g: seated from the camp table now -- see the note over `counts.bears`.
  counts.trolls = 0
  // ---- THE PLACED COPSES GET THEIR TREES ----
  //
  // The table makes a copse expensive to route through and paints the ground
  // as woodland. Without this it would be woodland with nothing growing in it:
  // a road bending around a colour. These are real trees -- they can be felled
  // and they come back on the engine's own timer -- so a citizen who walks in
  // finds a reason to have come.
  {
    // §6ao (v6): the named copses (the Vale Copse, the Long Holt...) stay on the
    // map as TEXTURE -- a silhouette you skirt, a landmark you steer by -- but
    // they are no longer gatherable groves. A couple of trees each for the
    // shape, not the dozens that made every copse a little rival Draynor and
    // scattered the woodcutters away from Greenhollow. Chopping is at the timber
    // town; these are scenery.
    let ct = 0
    for (const f of HANDMADE) {
      if (f.kind !== 'copse') continue
      let placed = 0
      for (let i = 0; i < 40 && placed < 2; i++) {
        const hh = H32('copse|' + f.name, i)
        const a = (hh.readUInt16BE(0) / 65536) * Math.PI * 2
        const r = Math.sqrt(hh[2] / 255)
        const x = Math.round(f.x + Math.cos(a) * f.rx * r)
        const y = Math.round(f.y + Math.sin(a) * f.ry * r)
        if (!inB(x, y) || !free(x, y) || isWater(g, x, y) || blockedAt(g, x, y)) continue
        if (onRoad(g, x, y)) continue                 // the road came first
        taken.add(key(x, y)); E.addNode(w, 'copse-' + ct, 'tree', x, y); ct++; placed++
      }
    }
    counts.copseTrees = ct
  }

  // ---- THE FLOCKS ----
  //
  // The Downs measured out at twenty-two thousand tiles carrying twenty-eight
  // living things -- twelve per ten thousand, against the Fens' sixty-one --
  // and it is the country this world named THE SHEEPFOLDS. Downland is sheep
  // country in the plainest sense; the map said so from the fourth founding
  // and there were never any sheep on it.
  //
  // In flocks, because that is how sheep stand, and because the same
  // clusterScatter that musters the knights and the trolls already does it.
  // Forty takes the Downs to about thirty per ten thousand: below the Crags
  // at thirty-five, well below the Fens. The emptiest country stops being
  // empty without becoming busy.
  // §13g: seated from the camp table now.
  counts.sheep = 0
  // AND A FLOCK IN THE FOLDS THEMSELVES.
  //
  // A named place should hold the thing it is named for, rather than hoping
  // the hashed clumps happen to land on it -- the same reason a port seats
  // its own coves above instead of waiting for one of the twelve to arrive.
  {
    const fold = localesOf(g).find((L) => L.tag === 'sheepfolds')
    let f = 0
    if (fold) for (let i = 0; i < 400 && f < A(12); i++) {
      const hh = H32('sheepfold', i)
      const rad = 2 + (hh[0] % 16)
      const ang = (hh.readUInt16BE(1) / 65536) * Math.PI * 2
      const x = Math.round(fold.x + Math.cos(ang) * rad)
      const y = Math.round(fold.y + Math.sin(ang) * rad * 0.7)
      if (!free(x, y) || blockedAt(g, x, y) || isWater(g, x, y)) continue
      if (biomeAt(g, x, y) !== 'downs') continue
      taken.add(key(x, y)); E.addMob(w, 'fold-' + i, 'sheep', x, y); f++
    }
    counts.foldSheep = f
  }

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
    // DEPTH, NOT LONGITUDE.
    //
    // This picked a seat uniformly across the western fifth of the map, which
    // says nothing about how far anyone has actually walked. Measured, the
    // result was a gradient that rose tenfold from the boundary to a hundred
    // and fifty tiles out -- and then COLLAPSED: the deepest country, the most
    // committing walk in the world, was emptier than the middle of the Wilds
    // and emptier than the ground near Cragfoot.
    //
    // That is backwards, and it is the one thing this world was missing that
    // an ARPG has by construction: a reason to decide how far in to go. Each
    // warband is now given a DEPTH to aim for, spread evenly from the boundary
    // to the far edge. Because there is less land the deeper you go, evenly
    // spread warbands make a density that rises the whole way out -- the
    // gradient comes out of the geography rather than being imposed on it.
    const bands = Math.max(1, A(13))
    const wantDepth = 35 + (band / bands) * 155
    let best = null, bestErr = 1e9
    for (let t = 0; t < 260; t++) {
      const hb = H32('warband', band * 97 + t)
      const x = 2 + (hb.readUInt16BE(0) % Math.max(1, Math.round(W * 0.30)))
      const y = 2 + (hb.readUInt16BE(2) % (H - 4))
      if (biomeAt(g, x, y) !== 'wilds' || inSea(g, x, y)) continue
      let near = 1e9
      for (const t2 of settlementsOf(g)) {
        const d = Math.hypot(t2.x - x, t2.y - y); if (d < near) near = d
      }
      const err = Math.abs(near - wantDepth)
      if (err < bestErr) { bestErr = err; best = { x, y } }
      if (err < 8) return { x, y }        // close enough; take it and stop
    }
    return best
  }
  let sk = 0, placed = 0
  for (let band = 0; band < A(13); band++) {
    const seat = wildsSeat(band)
    if (!seat) continue
    const bx = seat.x, by = seat.y
    for (let k = 0; k < 5; k++) {
      const hh = H32('skel', sk)
      const x = bx + (hh[0] % 7) - 3, y = by + (hh[1] % 7) - 3
      const seat = sk++
      if (!free(x, y) || B(x, y) !== 'wilds') continue
      // counts.knights must report what was PLACED, not what was attempted:
      // `sk` is the seat counter (it must advance on rejection so the hash
      // stream stays aligned), `placed` is the census. The old line reported
      // sk and so overstated the muster by every knight that fell on bad
      // ground -- the same silence that once dropped 53 of 65 into the water.
      placed++
      taken.add(key(x, y)); E.addMob(w, 'skel-' + seat, 'skeleton-knight', x, y)
    }
  }
  counts.knights = placed

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
    // §7ak: A FEW, NOT A RING. Forty-six were raised around the mound's edge
    // and they came out shoulder to shoulder -- a fence of skeletons, which
    // reads as a spawner rather than as a haunting. The Barrow is the one
    // dangerous thing in the safe country and it works by being UNEXPECTED,
    // not by being crowded: three or four standing among the stones is more
    // frightening than forty, because forty is obviously a farm.
    for (let i = 0; i < A(12); i++) {
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
      // §13g: seated from the camp table now -- the shore crabs of Eastmere
      // are three camps rather than thirty-four dots round a compass.
      for (let i = 0; i < 0; i++) {
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
    // THE STRAND BELOW EASTMERE.
    //
    // She used to be seated at the shore FURTHEST from any town, which sounds
    // lonely and was in fact a collision: the spider is placed at the furthest
    // walkable ground from any town outside the Wilds, and on this island shape
    // the same north-eastern corner wins both. Measured across five seeds they
    // came out 17, 14, 3, 2 and 20 tiles apart -- on the seed named `tallyholm`
    // the solo duel and the party fight were three tiles from each other, which
    // makes nonsense of both. "She takes one at a time" means nothing if a war
    // band is standing on the next dune.
    //
    // So she is given a home instead of an extremity: the shore nearest
    // Eastmere, far enough out of the town that the walk is still a walk. A
    // named place a citizen can be told to go to, and half an island from the
    // Greenwood.
    let seat = null, bestScore = -1
    const towns = settlementsOf(g)
    const eastmere = towns.find(t => t.tag === 'eastmere') || towns[towns.length - 1] || null
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
      if (near < 24) continue                             // 6cb: not on anybody's doorstep
      // 6cb: NOR ON ANYBODY'S FISHING BEACH.
      //
      // She was scored purely by nearness to Eastmere, so she sat SEVEN TILES
      // from that port's fishery -- the one mirroring thing in the world, which
      // fights with the attack level of whoever it faces, parked beside the
      // water every newcomer in the east is standing in. Her own signpost says
      // she takes one at a time; it should not be one at a time from a queue of
      // people who came to fish.
      //
      // Thirty tiles of empty strand between her and any rod. She still wants
      // Eastmere's coast -- that is her stretch of the world and the sign is
      // written for it -- but she wants the lonely end of it.
      let rod = 1e9
      for (const n2 of Object.values(w.nodes))
        if (n2.type === 'fishing-spot') rod = Math.min(rod, Math.hypot(n2.x - x, n2.y - y))
      if (rod < 30) continue
      // nearest Eastmere wins; without an Eastmere, fall back to the old rule
      const score = eastmere ? -Math.hypot(eastmere.x - x, eastmere.y - y) : near
      if (score > bestScore || bestScore === -1) { bestScore = score; seat = { x, y } }
    }
    if (seat) {
      E.addMob(w, 'the-siren', 'siren', seat.x, seat.y)
      taken.add(key(seat.x, seat.y))
      const sy = seat.y + 2
      if (free(seat.x, sy) && !blockedAt(g, seat.x, sy) && !isWater(g, seat.x, sy)) {
        taken.add(key(seat.x, sy))
        put('siren-sign', 'signpost', seat.x, sy, { text: 'the strand sings \u00b7 she takes one at a time' })
      }
      counts.siren = Math.round(Math.abs(bestScore))
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
    // AND NOT WHEREVER SHE IS. Both of these maximise distance from towns, so
    // without this they converge on the same corner of the island -- which is
    // exactly what happened, on every seed measured. A hundred and twenty tiles
    // of separation is belt and braces now that she has a home of her own.
    const sirenSeat = Object.values(w.mobs).find(m => m.type === 'siren')
    for (let y = 8; y < H - 8; y += 4) for (let x = 8; x < W - 8; x += 4) {
      if (biomeAt(g, x, y) !== 'greenwood') continue
      if (blockedAt(g, x, y) || isWater(g, x, y) || !free(x, y)) continue
      // v7: NOT IN A QUIET QUARTER, and this is why she had no web.
      //
      // Both this search and the quiet quarters maximise distance from towns,
      // so she landed inside quiet-6 on every measured seed -- a tract the
      // founding deliberately keeps empty. Nothing may be built there, so all
      // 260 attempts at a strand and all 90 at a husk were refused, and the
      // great spider stood in bare grass with a signpost: 169 of the 169 tiles
      // around her held nothing at all. The comment above says "you see the
      // wood change before you see what changed it", and there was no change
      // to see.
      //
      // A quiet quarter is somewhere nothing happens. A boss is something
      // happening. She keeps the far Greenwood; she gives up the empty acre.
      if (inQuietQuarter(g, x, y)) continue
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
      // A WEB THAT DID NOT BUILD IS A BUG, NOT A VARIATION. It failed silently
      // for as long as she has existed because nothing ever asked.
      if (strands < 8) console.warn('WORLDGEN: the great spider has only ' + strands
        + ' strands of web at ' + seat.x + ',' + seat.y + ' -- she is standing in bare wood')
      counts.spiderWeb = strands
    }
  }

  // ---- THE LAMPREYS (§7cn) ----
  //
  // Seven, in the Fens, each on dry ground with standing water beside it. They
  // are hand-placed like the other named things and for the same reason: a
  // creature the island can only kill four hundred and forty-eight times in
  // the whole history of the world does not belong to a scatter table.
  //
  // THE WATER IS NOT DECORATION. §2b-ii gave the Fens meres and reed-water for
  // hydrological reasons years before anything wanted them -- and a beast that
  // stands at the edge of water is standing where §2b-i's promise is worth
  // least, because the ground you would back away over is the ground you
  // cannot cross. The lampreys were not put in the wet to look right.
  //
  // SPREAD APART, hard. Fifty tiles between any two, so the island cannot burn
  // through the whole population in one lair over one weekend: each is its own
  // errand, and "there are three left" has to be learned in three places.
  {
    // SEVEN OR NOTHING, and the spacing yields before the count does.
    //
    // The first cut fixed the separation at fifty tiles and seated SIX -- the
    // Fens simply do not hold seven bank tiles that far apart -- which would
    // have shipped a world with 384 spit instead of 448 and 192 barbs instead
    // of 224, silently, under the same version number. The permanent supply of
    // an item may not depend on how lucky a coastline was.
    //
    // So the spread is a preference and the population is a rule. Try fifty;
    // if the country will not hold seven at fifty, try forty-two, and so on
    // down. Deterministic, seed-stable, and it degrades in the direction that
    // keeps the constitution true.
    const seatsAt = (minGap) => {
      const out = []
      for (let i = 0; i < 24000 && out.length < 7; i++) {
        const hh = H32('lamprey', i)
        const x = 2 + (hh.readUInt16BE(0) % (W - 4))
        const y = 2 + (hh.readUInt16BE(2) % (H - 4))
        if (biomeAt(g, x, y) !== 'fens') continue
        if (!free(x, y) || blockedAt(g, x, y) || isWater(g, x, y)) continue
        // WATER IN ONE OF THE FOUR FACED TILES, and nowhere else will do. §2b-i
        // promises nobody can be run down; a beast at the edge of standing
        // water is standing where that promise is worth least, because the
        // ground you would back away over is the ground you cannot cross.
        let wet = false
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
          if (isWater(g, x + dx, y + dy)) wet = true
        if (!wet) continue
        let clash = false
        for (const st of out) if (Math.hypot(st.x - x, st.y - y) < minGap) clash = true
        if (clash) continue
        out.push({ x, y })
      }
      return out
    }
    let seats = []
    for (const gap of [50, 42, 34, 26, 18, 10]) {
      seats = seatsAt(gap)
      if (seats.length === 7) { counts.lampreyGap = gap; break }
    }
    seats.forEach((st, i) => {
      E.addMob(w, 'lamprey-' + (i + 1), 'mere-lamprey', st.x, st.y)
      taken.add(key(st.x, st.y))
    })
    if (seats.length) {
      const st = seats[0]
      const sy = st.y + 2
      if (free(st.x, sy) && !blockedAt(g, st.x, sy) && !isWater(g, st.x, sy)) {
        taken.add(key(st.x, sy))
        put('lamprey-sign', 'signpost', st.x, sy,
          { text: 'seven mouths in the meres \u00b7 there will not be more' })
      }
    }
    // SEVEN OR THE WORLD IS WRONG. The supply of every barb that will ever
    // exist is decided here, so a founding that quietly seats six must say so
    // rather than ship a different world with the same version number.
    if (seats.length < 7) console.warn('WORLDGEN: only ' + seats.length
      + ' lampreys found a mere even at ten tiles apart -- this world has a smaller permanent '
      + 'supply of spit than the spec states')
    counts.lampreys = seats.length
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

  // ---- THE SEAMS ARE A TABLE (worldgen-seams-v7.mjs) ----
  //
  // The seeding routines above put the seams where the design wanted them, and
  // the design is right: ninety-two gatherable nodes on the whole island, so
  // that going to mine is going SOMEWHERE. What was wrong is that the only way
  // to know where a seam was, was to run the founding and look.
  //
  // So the table is the truth now. Everything the routines seeded is cleared
  // and re-laid from the list -- the same coordinates, since the list was baked
  // off them -- and from here a seam is moved by editing one line. A place's
  // own seam (the coal at the High Delving, the heartwood at the King's Oak)
  // is not in the table and is left exactly where its drawing put it.
  {
    const GATHERABLE = new Set(['tree', 'oak-tree', 'ironbark-tree', 'heartwood-tree', 'gallows-oak',
      'rock', 'iron-rock', 'coal-rock', 'gold-rock', 'magic-rock', 'mother-lode', 'brimstone-vent',
      'fishing-spot', 'eel-spot', 'deep-fish-spot', 'gibbet-shoal', 'muck-heap'])
    let cleared = 0
    for (const [id, n] of Object.entries(w.nodes)) {
      if (!GATHERABLE.has(n.type) || id.startsWith('place-')) continue
      delete w.nodes[id]; cleared++
    }
    let laid = 0, refused = 0
    for (let si = 0; si < SEAMS.length; si++) {
      const sm = SEAMS[si]
      // §7u: A SEAM OUTRANKS A TREE. The landmark trees are laid in an earlier
      // pass and knew nothing of the seam table, so a dead tree came to stand
      // on the mother-lode at 168,249 -- and this refused the seam and reported
      // it as a warning nobody would have read. Ninety-six seams are the whole
      // economy of this island; eight hundred trees are scenery. If a piece of
      // scenery is in the way, the scenery moves.
      const _onSpot = Object.entries(w.nodes).find(([, q]) => q.x === sm.x && q.y === sm.y)
      if (_onSpot) {
        const [oid, on] = _onSpot
        const isScenery = on.type === 'landmark'
        if (!isScenery) { refused++; continue }
        delete w.nodes[oid]
      }
      E.addNode(w, 'seam-' + si, sm.type, sm.x, sm.y, {})
      taken.add(key(sm.x, sm.y)); laid++
    }
    if (refused) console.warn('WORLDGEN: ' + refused + ' seams of ' + SEAMS.length + ' had something on them')
    counts.seamsCleared = cleared
    counts.seamsLaid = laid
  }

  // ---- THE GOBLIN PEN ----
  //
  // The Heartlands is the safe country and safety is dull to walk through.
  // So: a hedged pound on the Anchor-Oxenford road with goblins in it and four
  // guards outside, taken off the Brand and kept for whatever the city does
  // with them. It is somewhere to stop, it explains why the guards exist, and
  // it is the only place in the home country where you can look a goblin in
  // the eye through a fence.
  //
  // §7ah: AND IT MEANS MORE NOW, NOT LESS. When wild goblins were seated in
  // the meadow as well, a penned goblin was just a goblin with a hedge round
  // it. The heartlands hold no hostile camp any more -- so these are the only
  // goblins in the home country, and the fence is the whole story: somebody
  // caught them and somebody is guarding them.
  //
  // It is also the safest fight on the island, which is exactly what a
  // newcomer wants and what the training yard down the road cannot give: a
  // real beast, cornered, with four guards standing over it. The same
  // argument as folding the sheep -- a penned thing is a PLACE, and a thing
  // roaming loose is scenery.
  {
    // HAND-SEATED, and clear of the furlongs.
    //
    // It was placed at the midpoint of the Anchor-Oxenford road and the pen
    // runs LATE -- after the fields, the holdings and the works -- so `free()`
    // simply skipped every tile a furlong had already taken and what got built
    // was a pound with holes in it and a scatter of goblins standing in
    // somebody's barley. Measured at the old seat: 31 plot tiles, 25 hedge and
    // 24 fence within twelve tiles of the densest goblin cluster on the island.
    //
    // This seat was chosen by scoring every tile within ten of that road for
    // conflicts against everything already standing: 0 of 143.
    const seat = { x: 354, y: 259 }
    let gp = 0
    const PW = 11, PH = 8
    for (let dy = 0; dy < PH; dy++) for (let dx = 0; dx < PW; dx++) {
      const x = seat.x + dx - (PW >> 1), y = seat.y + dy - (PH >> 1)
      if (!free(x, y) || blockedAt(g, x, y) || isWater(g, x, y)) continue
      const edge = dx === 0 || dy === 0 || dx === PW - 1 || dy === PH - 1
      const gate = dy === PH - 1 && dx === (PW >> 1)
      if (edge && !gate) { taken.add(key(x, y)); put('pen-' + gp, 'fence', x, y); gp++ }
      // FEWER OF THEM. One in three interior tiles was a goblin -- fifteen of
      // them shoulder to shoulder, which reads as a warehouse rather than a
      // pound. One in five is eight or nine: enough to be a crowd, few enough
      // that you can see the ground they are standing on.
      else if (!edge && ((dx * 2 + dy) % 5 === 0)) {
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
        // §7j: A MILL IS A BUILDING, NOT A TRINKET.
        //
        // The mill was one tile of landmark standing in a field, which read as
        // miniature next to a town whose smallest cottage is six by four --
        // and now that grain is ground here it is somewhere a citizen goes,
        // which makes the scale worse. So the sails get a mill-house under
        // them: a stone round-house, its door to the south, with the grinding
        // stone (the `mill` node) standing in the middle where the shaft comes
        // down. You work it from the doorway or from inside.
        //
        // Not a room with a windmill in it -- a windmill with a room in it,
        // which is what a tower mill actually is.
        const MILLHOUSE = [
          '~###~',
          '#,,,#',
          '#,M,#',
          '#,,,#',
          '~#.#~',
        ]
        for (let ry = 0; ry < MILLHOUSE.length; ry++) for (let rx = 0; rx < 5; rx++) {
          const ch = MILLHOUSE[ry][rx]
          const mx = x + rx - 2, my = y + ry - 2
          if (ch === '~' || ch === '.' || ch === ',') continue
          if (!inB(mx, my) || blockedAt(g, mx, my) || isWater(g, mx, my) || onRoad(g, mx, my)) continue
          if (Object.values(w.nodes).some((q) => q.x === mx && q.y === my)) continue
          if (ch === '#') put('millhouse-' + tag + '-' + rx + '-' + ry, 'wall', mx, my, {})
        }
        for (let ry = 0; ry < MILLHOUSE.length; ry++) for (let rx = 0; rx < 5; rx++)
          if (MILLHOUSE[ry][rx] === ',') taken.add(key(x + rx - 2, y + ry - 2))
        taken.add(key(x, y)); put('mill-' + tag, 'landmark', x, y, { kind: 'mill' })
        const kx = x + 1, ky = y
        if (free(kx, ky) && !blockedAt(g, kx, ky)) {
          taken.add(key(kx, ky)); put('mill-' + tag + '-k', 'keeper', kx, ky, { name: keeperName(tag, 'miller') })
        }
        mills++; break
      }
    }
    // ---- AND THE MILLS AT MILLBROOK ----
    //
    // The town has been called Millbrook since the fourth founding and has
    // never had a mill. Both of the world's stood elsewhere -- mill-heart
    // forty-three tiles from Hollybarrow, mill-downs sixty-five from
    // Eastmere -- so the one settlement whose name is a mill and a brook had
    // the brook and not the mill. Same fault as the Sheepfolds with no
    // sheep, and the same cure: put the named thing where it is named.
    //
    // THREE, not one. A single mill is a landmark; a race of them is an
    // industry, and milling is this town's whole reason for standing. The
    // brook runs down its western wall for nineteen tiles, which is exactly
    // what a mill race looks like -- so they are strung along the water in
    // the order the water reaches them, upstream to down, the way a real
    // one would be built.
    {
      const mb = ss.find((st) => st.tag === 'millbrook')
      let n = 0
      if (mb) {
        const r = rectOf(mb)
        const wants = []
        for (let y = r.y0; y <= r.y1; y++) {
          for (let x = r.x0 - 9; x < r.x0; x++) {
            if (isWater(g, x, y) || blockedAt(g, x, y) || !free(x, y)) continue
            // it must stand ON the bank: water within two tiles, or it is
            // not a watermill, it is a shed
            let wet = false
            for (let dy = -2; dy <= 2 && !wet; dy++) for (let dx = -2; dx <= 2; dx++)
              if (isWater(g, x + dx, y + dy)) { wet = true; break }
            if (!wet) continue
            wants.push([y, x])
          }
        }
        wants.sort((a, b) => a[0] - b[0] || a[1] - b[1])   // upstream first
        let lastY = -99
        for (const [y, x] of wants) {
          if (n >= 3) break
          if (y - lastY < 6) continue                       // a race, not a row of sheds
          taken.add(key(x, y))
          put('mill-brook-' + n, 'landmark', x, y, { kind: 'mill' })
          const kx = x - 1
          if (free(kx, y) && !blockedAt(g, kx, y) && !isWater(g, kx, y)) {
            taken.add(key(kx, y))
            put('mill-brook-' + n + '-k', 'keeper', kx, y, { name: keeperName('brook' + n, 'miller') })
          }
          lastY = y; n++
        }
      }
      counts.brookMills = n
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
    // §7af: THE GENERIC SCATTER IS OFF.
    //
    // This is the last scatter on an island whose seams, camps, holdings,
    // fields, works, residents and places are all hand-placed tables -- and it
    // shows. Three carts abreast. Four wells fenced into a two-by-two. A
    // standing stone every few paces of nothing.
    //
    // The distinction that matters: A TREE CAN STAND ANYWHERE and read as
    // landscape, because nobody put it there. A cart cannot. A cart is
    // EVIDENCE OF A PERSON, and evidence of a person in a nonsensical
    // arrangement reads worse than bare ground -- it says the world was
    // generated, which is the one thing this island is trying not to say.
    //
    // So all of it goes, and the country gets more trees instead (§7u), which
    // is the one kind that never looks placed by a machine. What remains is
    // hand-drawn or unique: the spider's web, the dragon's burnt ring, the
    // Drowned Bell, the capes, the mills, the clamp, the orchards, the works
    // and everything inside a drawing.
    const SCATTER_OFF = true
    if (!SCATTER_OFF) {
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
  }

  // ---- waystones: NONE ----
  //
  // 6ch: The §6ao note that used to stand here argued this world "is built on
  // the walk -- the ore hauled to the anvil, the market visited, the seam
  // reached -- and a dense fast-travel net would dissolve all of it", and then
  // seated a stone at every town anyway, plus two on the frontier. It was
  // right the first time. There is no travel network now: the ore is carried,
  // the market is walked to, and the Wilds is a decision made twice.
  //
  // Nothing replaces them. The road IS the content -- hauling is an entire
  // trade built on the length of it, and a hauler who could skip the road
  // would be paid for a journey nobody took.

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


  // ---- THE STALLS, once every town exists --------------------------------
  //
  // A stall must not sit in another trade's room, and that cannot be decided
  // while the towns are still going up: the check only sees what has been
  // placed so far. So each town leaves its work here and the seating happens
  // when the island is finished, exactly as the callings do.
  for (const job of _stallWork) {
    const { s: st, shopRoom, rr2, taken, plan, kinds } = job
    // a counter needs a side for the keeper and a side for the customer
    const freeSides = (x, y) => {
      let n2 = 0
      for (const [ddx, ddy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ax = x + ddx, ay = y + ddy
        if (!inB(ax, ay) || blockedAt(g, ax, ay)) continue
        if (Object.values(w.nodes).some((q) => q.x === ax && q.y === ay)) continue
        n2++
      }
      return n2
    }
    let hi = 0, si = 0
    for (const kind of kinds) {
      let seated = false
      // indoors first: a spare house, if the drawing left one
      // indoors first: try EVERY spare house the drawing left, not just one.
      // The old code picked shopRoom[hi % len] -- a single house per stall -- so
      // once a market had more stalls than clean rooms, the extra stall landed
      // on a house already taken, failed, and was exiled to the ring outside the
      // town (Millbrook's delver ended up alone on the verge). Walking all the
      // houses seats it wherever there is genuinely room before giving up.
      for (let hh = 0; hh < (shopRoom ? shopRoom.length : 0) && !seated; hh++) {
        const house = shopRoom[(hi + hh) % shopRoom.length]
        const pw = plan[0].length, ph = plan.length
        const ox = st.x - (pw >> 1), oy = st.y - (ph >> 1)
        const [rx, ry, rw, rh] = house
        // §7ax: AND A HOUSE SOMEBODY ALREADY LIVES IN IS NOT A SHOP.
        //
        // The `busy` test that chose these rooms reads the DRAWING, and the
        // residents pass puts people into empty rooms at a different point in
        // the founding -- so a room the drawing left bare could have a citizen
        // in it by the time the roster arrived, and the stall sat down beside
        // them. Millbrook came out with two keepers in one building and a
        // stall alone in the next, which is a shop with a lodger and a lodging
        // with a shop.
        //
        // The world is built by now. Ask IT, not the plan.
        {
          let occupied = false, lodger = null
          for (const [n3id, n3] of Object.entries(w.nodes)) {
            if (n3.type !== 'keeper' && n3.type !== 'stall') continue
            if (n3.x < ox + rx || n3.x >= ox + rx + rw
                || n3.y < oy + ry || n3.y >= oy + ry + rh) continue
            if (n3.type === 'stall') { occupied = true; break }
            lodger = n3id
          }
          // §7bo: AND A STALL OUTRANKS A LODGER, at the last house.
          //
          // Rooms were left unkept for the roster and the RESIDENTS pass -- which
          // runs first -- moved people into them, so the seater arrived to a
          // full town and put its stall in the open. Stripping more keepers
          // only gave the residents more homes; the two passes were competing
          // for the same rooms and the roster always lost.
          //
          // A rostered stall is a world institution: the arms of Millbrook, the
          // fishmonger of Eastmere. A lodger is a name in a table. If the last
          // candidate house has somebody in it and the stall would otherwise
          // stand in the square, the lodger moves out.
          if (occupied) continue
          // ...and the last house is not the last CHANCE: with several stalls
          // sharing one list, the one that comes last finds every house tried
          // and skipped. A stall evicts as soon as no empty house remains,
          // which is a thing this loop can only know by looking.
          if (lodger !== null) {
            const anyEmpty = shopRoom.some(([qx, qy, qw, qh]) =>
              !Object.values(w.nodes).some((n4) =>
                (n4.type === 'keeper' || n4.type === 'stall')
                && n4.x >= ox + qx && n4.x < ox + qx + qw
                && n4.y >= oy + qy && n4.y < oy + qy + qh))
            if (anyEmpty) continue
            delete w.nodes[lodger]
          }
        }
        // A COUNTER NEEDS A SIDE TO BE SERVED FROM.
        //
        // The first version took the first bare floor tile in the room and
        // put the keeper next to it, and never asked whether anything was
        // left for a CUSTOMER. Six of twelve stalls came out with no free
        // orthogonal tile at all: a shop sealed inside its own building,
        // which a citizen finds by walking to it and being told it cannot be
        // reached. So a seat needs two free sides -- one for the keeper to
        // stand behind and one for whoever came to buy.
        const freeSides = (x, y) => {
          let n2 = 0
          for (const [ddx, ddy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const ax = x + ddx, ay = y + ddy
            if (!inB(ax, ay) || blockedAt(g, ax, ay)) continue
            if (Object.values(w.nodes).some((q) => q.x === ax && q.y === ay)) continue
            n2++
          }
          return n2
        }
        // §7f: ONE TRADE TO A HOUSE, AND NEVER IN THE DOORWAY.
        //
        // Two faults, both visible the moment every room on the island was
        // drawn on one sheet. Millbrook's bowyer and delver were seated THREE
        // TILES APART -- the same 4x3 market house -- so one house held two
        // trades and the house next door held none, and the chart read as
        // though the bowyer had gone missing. And Eastmere's fishmonger stood
        // in the gap in its own wall: a stall blocks its tile, so the trade
        // was corking the only way into the building it trades from.
        //
        // A doorway is a gap in a run of wall, so it has wall on two OPPOSITE
        // sides. `freeSides >= 2` cannot see that -- a doorway has exactly two
        // free sides, in and out, which is why it passed.
        const wallAt = (x, y) => Object.values(w.nodes)
          .some((q) => q.x === x && q.y === y && (q.type === 'wall' || q.type === 'rampart'))
        const isDoorway = (x, y) => (wallAt(x - 1, y) && wallAt(x + 1, y))
                                 || (wallAt(x, y - 1) && wallAt(x, y + 1))
        const stallNear = (x, y) => Object.values(w.nodes).some((q) =>
          q.type === 'stall' && Math.max(Math.abs(q.x - x), Math.abs(q.y - y)) <= 5)
        // §7k: A ROSTERED TRADE HAS A ROOF. The one-trade-to-a-house rule
        // pushed the delver out of the house it was sharing and it came to
        // rest in the open -- on what is now the market SQUARE, which is worse
        // than untidy: the square is where CITIZENS raise stalls, and a shop
        // the town founded standing among them is unreadable. A roster stall
        // is a shop; a shop has walls. The square is for the citizens.
        const indoors = (x, y) => {
          let n2 = 0
          for (const [dx2, dy2] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]])
            if (Object.values(w.nodes).some((q) => (q.type === 'wall' || q.type === 'rampart')
              && q.x === x + dx2 && q.y === y + dy2)) n2++
          return n2 >= 2
        }
        for (let yy = ry; yy < ry + rh && !seated; yy++) {
          for (let xx = rx; xx < rx + rw; xx++) {
            if (plan[yy]?.[xx] !== ',') continue        // bare floor only
            const x = ox + xx, y = oy + yy
            // `taken` covers the WHOLE building -- layPlan reserves every
            // tile of a drawing so no later pass drops a tree in somebody's
            // parlour. That is right, and it is exactly the floor this wants,
            // so the test here is whether a NODE already stands on the tile.
            if (!inB(x, y) || blockedAt(g, x, y)) continue
            // v7: NOT IN THE ROADWAY, EVEN INDOORS.
            //
            // The router lays roads through towns, and at some seeds a road
            // runs straight through a market house. The indoor seater never
            // asked -- so a stall went up on the road tile, and the road sweep
            // at the end of the founding removed it as loose decor. The trade
            // then simply did not exist: at solo-42 the armourer and the bowyer
            // were both seated and both deleted, and nothing said a word.
            if (onRoad(g, x, y)) continue
            if (isDoorway(x, y)) continue               // never cork the door
            if (stallNear(x, y)) continue               // one trade to a house
            if (!indoors(x, y)) continue                // and a house is walls
            if (Object.values(w.nodes).some((q) => q.x === x && q.y === y)) continue
            if (freeSides(x, y) < 2) continue           // room for a keeper AND a customer
            // AND NOT IN SOMEBODY ELSE'S SHOP.
            //
            // The room test read the DRAWING -- was there a B or an S inside
            // this rect -- and Anchor's bank sits a tile outside the rect the
            // arms-master was seated in, so the arms stall went up inside the
            // bank. The drawing is the wrong thing to ask. Ask the WORLD:
            // is there a counter of any kind near this tile?
            // Eight tiles, not three. Anchor's nearest bank counter stands
            // FOUR tiles from where the arms stall was seated -- just outside
            // a radius of three -- with a banker at two, so the two trades
            // shared a hall and a citizen saw an arms stall inside the bank.
            // A room in these drawings is bigger than three tiles.
            // A market is stalls SIDE BY SIDE -- that is what makes it a market
            // -- so the eight-tile rule applies only to the trades a stall must
            // not sit inside (bank, store, anvil). Another stall's keeper only
            // needs a tile of its own; two shopfronts a few tiles apart is a
            // market row, not a conflict.
            if (Object.values(w.nodes).some((q) =>
              (q.type === 'bank' || q.type === 'store' || q.type === 'anvil')
              && Math.max(Math.abs(q.x - x), Math.abs(q.y - y)) <= 8)) continue
            if (Object.values(w.nodes).some((q) =>
              q.type === 'keeper' && q.kind && q.kind !== kind
              && Math.max(Math.abs(q.x - x), Math.abs(q.y - y)) <= 2)) continue
            E.addNode(w, 'stall-' + st.tag + '-' + kind, 'stall', x, y, { kind })
            taken.add(key(x, y))
            // and whoever keeps it, stood behind the counter
            for (const [dx2, dy2] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) {
              const kx = x + dx2, ky = y + dy2
              if (!inB(kx, ky) || blockedAt(g, kx, ky)) continue
              if (onRoad(g, kx, ky)) continue
              if (plan[yy + dy2]?.[xx + dx2] !== ',') continue
              if (Object.values(w.nodes).some((q) => q.x === kx && q.y === ky)) continue
              // and the keeper does not take the last side: after they are
              // stood there the counter must still have somewhere to serve from
              if (freeSides(x, y) < 2) continue
              // AND A NAME, from the world's own stock. These were placed
              // without one, so a citizen walked into a shop and met "?" --
              // every other person on the island has been named since the
              // fourth founding and the twelve I added were not.
              E.addNode(w, 'keeper-' + st.tag + '-' + kind, 'keeper', kx, ky,
                { kind, name: keeperName(st.tag, kind) })
              taken.add(key(kx, ky))
              break
            }
            seated = true; hi = (hi + hh + 1); break
          }
        }
      }
      // v7: THE MARKET SQUARE IS INSIDE THE WALL.
      //
      // When the drawing had no spare house left, v6 went straight out to a
      // ring OUTSIDE the town and stood the trader on the verge -- Millbrook's
      // delver ended up a tile north of the rampart, in a field, in a town
      // whose whole eastern half is a reserved, paved, empty market square.
      // A stall belongs on that square. Walk the town's own open ground first,
      // nearest the centre outward, and only leave by the gate if the town
      // genuinely has nowhere to put a table.
      if (!seated && plan) {
        const pw3 = plan[0].length, ph3 = plan.length
        const ox3 = st.x - (pw3 >> 1), oy3 = st.y - (ph3 >> 1)
        const square = []
        for (let yy = 0; yy < ph3; yy++) for (let xx = 0; xx < pw3; xx++) {
          const ch3 = plan[yy]?.[xx]
          if (ch3 !== '.' && ch3 !== '@') continue      // reserved open ground only
          square.push([ox3 + xx, oy3 + yy])
        }
        // deterministic, and it reads as a market: the pitches nearest the
        // middle of the square go first, ties broken west-to-east then
        // north-to-south so the row fills in one direction.
        square.sort((a, b) => (Math.abs(a[0] - st.x) + Math.abs(a[1] - st.y))
                            - (Math.abs(b[0] - st.x) + Math.abs(b[1] - st.y))
                            || (a[0] - b[0]) || (a[1] - b[1]))
        // §7k: THE SQUARE IS THE CITIZENS'. This fallback seats a rostered
        // trade on Millbrook's market square when no house will take it -- and
        // since the square became plaza, that is precisely the ground a
        // CITIZEN raises a stall on. A shop the town founded standing among
        // them is unreadable: you cannot tell the world's delver from
        // somebody's pitch. A rostered trade is a shop and a shop has walls.
        //
        // Kept as the last resort it always was, because a trade nobody can
        // find is worse than a trade in the open -- but it now says so aloud
        // instead of quietly putting a shop in the marketplace.
        for (const [x, y] of square) {
          // NOT `taken`. layPlan reserves every tile of a drawing -- lanes and
          // plaza included -- so that no later pass drops a tree in somebody's
          // parlour or seals a street. That reservation is exactly the ground a
          // market stands on, and testing it here is what sent the delver out
          // of the gate: ask whether a NODE stands on the tile, as the indoor
          // path already does.
          if (!inB(x, y) || isWater(g, x, y) || blockedAt(g, x, y)) continue
          if (onRoad(g, x, y)) continue
          if (Object.values(w.nodes).some((q) => q.x === x && q.y === y)) continue
          if (freeSides(x, y) < 2) continue
          if (Object.values(w.nodes).some((q) =>
            (q.type === 'bank' || q.type === 'store' || q.type === 'anvil')
            && Math.max(Math.abs(q.x - x), Math.abs(q.y - y)) <= 8)) continue
          if (Object.values(w.nodes).some((q) =>
            q.type === 'keeper' && q.kind && q.kind !== kind
            && Math.max(Math.abs(q.x - x), Math.abs(q.y - y)) <= 2)) continue
          if (groundKindAt(g, x, y) === 'plaza') continue   // the square is not a shop
          E.addNode(w, 'stall-' + st.tag + '-' + kind, 'stall', x, y, { kind })
          taken.add(key(x, y)); seated = true
          for (const [dx2, dy2] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) {
            const kx = x + dx2, ky = y + dy2
            if (!inB(kx, ky) || isWater(g, kx, ky) || blockedAt(g, kx, ky)) continue
            if (onRoad(g, kx, ky)) continue
            if (Object.values(w.nodes).some((q) => q.x === kx && q.y === ky)) continue
            if (freeSides(x, y) < 2) continue
            E.addNode(w, 'keeper-' + st.tag + '-' + kind, 'keeper', kx, ky,
              { kind, name: keeperName(st.tag, kind) })
            taken.add(key(kx, ky))
            break
          }
          break
        }
      }
      for (let rad = 1; rad <= 5 && !seated; rad++) {
        // south face first (the road side), then east, west, north
        const ring = []
        for (let x = rr2.x0; x <= rr2.x1; x++) ring.push([x, rr2.y1 + rad], [x, rr2.y0 - rad])
        for (let y = rr2.y0; y <= rr2.y1; y++) ring.push([rr2.x1 + rad, y], [rr2.x0 - rad, y])
        // deterministic order: nearest the town's own centre line first
        ring.sort((a, b) => (Math.abs(a[0] - st.x) + Math.abs(a[1] - st.y))
                          - (Math.abs(b[0] - st.x) + Math.abs(b[1] - st.y)))
        for (const [x, y] of ring) {
          if (!inB(x, y) || taken.has(key(x, y)) || isWater(g, x, y) || blockedAt(g, x, y)) continue
          if (onRoad(g, x, y)) continue                 // never in the roadway
          // AND THE SAME RULE AS INDOORS: keep clear of a bank, store or anvil,
          // but a fellow stall's keeper only owns its own tile -- a market is a
          // row of neighbours.
          if (Object.values(w.nodes).some((q) =>
            (q.type === 'bank' || q.type === 'store' || q.type === 'anvil')
            && Math.max(Math.abs(q.x - x), Math.abs(q.y - y)) <= 8)) continue
          if (Object.values(w.nodes).some((q) =>
            q.type === 'keeper' && q.kind && q.kind !== kind
            && Math.max(Math.abs(q.x - x), Math.abs(q.y - y)) <= 2)) continue
          // BESIDE A STREET, NOT ON A MOOR. The first version took the first
          // free ground on the ring, which put the axe man at Greenhollow
          // out on open moorland and the delver at Fenmarch in the fens. A
          // stall is somebody's pitch on a thoroughfare; if there is no
          // thoroughfare it is a man standing in a bog with a table.
          let byRoad = false
          for (let ddy = -2; ddy <= 2 && !byRoad; ddy++)
            for (let ddx = -2; ddx <= 2; ddx++)
              if (onRoad(g, x + ddx, y + ddy)) { byRoad = true; break }
          if (!byRoad && rad < 5) continue
          E.addNode(w, 'stall-' + st.tag + '-' + kind, 'stall', x, y, { kind })
          taken.add(key(x, y)); si++; seated = true
          // A STALL WITHOUT A KEEPER IS AN ABANDONED TABLE. The indoor path
          // stands a keeper behind the counter; this fallback used to place the
          // stall alone, so a market that overflowed its houses left a shop out
          // on the verge with nobody tending it. Stand a keeper on the first free
          // tile beside it, the same as indoors.
          for (const [dx2, dy2] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
            const kx = x + dx2, ky = y + dy2
            if (!inB(kx, ky) || taken.has(key(kx, ky)) || isWater(g, kx, ky) || blockedAt(g, kx, ky)) continue
            if (onRoad(g, kx, ky)) continue
            if (Object.values(w.nodes).some((q) => q.x === kx && q.y === ky)) continue
            E.addNode(w, 'keeper-' + st.tag + '-' + kind, 'keeper', kx, ky,
              { kind, name: keeperName(st.tag, kind) })
            taken.add(key(kx, ky))
            break
          }
          break
        }
      }
      // v7: A TRADE THAT COULD NOT BE SEATED IS A TRADE THE WORLD DOES NOT
      // HAVE, and v6 lost two of them at solo-42 without a word. If a roster
      // entry finds nowhere to stand, say so at the founding rather than
      // letting a citizen discover it by walking to a market that has no bowyer.
      if (!seated) console.warn('WORLDGEN: no seat for the ' + kind
        + ' stall at ' + st.name + ' -- this founding has no ' + kind + ' trade')
      }
  }

  // §6cz (v6): NO STALL MAY BE SEALED OFF. Walking the founded world showed
  // keepers stood in the one gap of a shop's wall -- the doorway -- so a buyer
  // reached the counter, was told "you can't reach that", and left. The seating
  // heuristics try to leave a customer side, but a keeper taking the only tile
  // that joins the counter to the street defeats them. So, once every stall and
  // keeper exists, prove each stall is reachable from open ground; where it is
  // not, the keeper standing in the way steps aside (is removed). A shop with no
  // visible keeper still trades; a shop no one can reach does not.
  {
    const BLOCK = new Set(['wall', 'fence', 'hedge', 'tree', 'rock', 'iron-rock', 'coal-rock',
      'magic-rock', 'gold-rock', 'oak-tree', 'heartwood-tree', 'stall', 'anvil', 'bank', 'store',
      'well', 'fountain', 'hearth', 'plot', 'keeper', 'guard', 'signpost', 'banner', 'campfire'])
    const nodeAt = new Map()
    for (const n of Object.values(w.nodes)) nodeAt.set(n.x + ',' + n.y, n)
    const walkable = (x, y) => {
      if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return false
      if (isWater(g, x, y) || blockedAt(g, x, y)) return false
      const n = nodeAt.get(x + ',' + y)
      return !n || !BLOCK.has(n.type)
    }
    // an "open" tile a buyer can come from: a road/plaza tile, or plain ground
    const openStart = (x, y) => walkable(x, y) && (onRoad(g, x, y) || !nodeAt.get(x + ',' + y))
    const reachableFromOpen = (sx, sy) => {
      // BFS from the stall's free neighbours outward; success = we touch a road
      // tile (the street) within a bounded radius.
      const seen = new Set(); const q = []
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ax = sx + dx, ay = sy + dy
        if (walkable(ax, ay)) { q.push([ax, ay]); seen.add(ax + ',' + ay) }
      }
      let steps = 0
      while (q.length && steps < 4000) {
        steps++
        const [x, y] = q.shift()
        if (onRoad(g, x, y)) return true            // reached the street
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const ax = x + dx, ay = y + dy, k = ax + ',' + ay
          if (seen.has(k)) continue
          if (Math.abs(ax - sx) > 18 || Math.abs(ay - sy) > 18) continue
          if (walkable(ax, ay)) { seen.add(k); q.push([ax, ay]) }
        }
      }
      return false
    }
    let freed = 0
    for (const n of Object.values(w.nodes)) {
      if (n.type !== 'stall') continue
      if (reachableFromOpen(n.x, n.y)) continue
      // sealed: remove the nearest keeper (the one blocking) and re-test
      let removed = false
      for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) {
        const k = nodeAt.get((n.x + dx) + ',' + (n.y + dy))
        if (k && k.type === 'keeper') {
          const kid = Object.keys(w.nodes).find((id) => w.nodes[id] === k)
          if (kid) { delete w.nodes[kid]; nodeAt.delete((n.x + dx) + ',' + (n.y + dy)); removed = true; freed++; break }
        }
      }
      // if still unreachable after freeing the keeper, leave it -- the wall, not
      // a person, is the obstacle, and that is a drawing fix, not this pass's.
    }
    counts.stallsFreed = freed
  }

  // ---- WHAT EACH OF THEM ACTUALLY DOES -----------------------------------
  //
  // Fifty-nine people stood about this island called "keeper", which is not a
  // thing anybody does. Nobody is invented here: a calling is read off what a
  // person already stands beside and off what their own id already called
  // them, which in most cases was a real word somebody chose years ago and
  // then threw away at the door.
  //
  // It runs LAST, after every hand-placed person exists. Run earlier it saw
  // only the town drawings, and matched `mill` against Millbrook.
  //
  // A keeper with no calling keeps none, deliberately: they live in a house,
  // and a house is not a job. A window gives them a name instead.
  {
    const BY_ID = [
      // 'bank' is tested BEFORE 'fold': kpr-bank-folds is the counter at the
      // Sheepfolds, not a shepherd, and read the other way round it came out
      // as one
      ['bank', 'banker'],
      ['wizard', 'wizard'], ['sawyer', 'sawyer'], ['shep', 'shepherd'],
      ['fold', 'shepherd'], ['eel', 'fisher'], ['sheds', 'fisher'],
      ['delve', 'delver'], ['quarry', 'quarrier'], ['mill', 'miller'],
      ['moorwatch', 'watchman'], ['brew', 'brewer'], ['inn', 'innkeeper'],
      ['coalcamp', 'collier'], ['drive', 'drover'], ['apiary', 'beekeeper'],
    ]
    const near = new Map()
    for (const n of Object.values(w.nodes)) {
      if (n.type === 'keeper') continue
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const k = (n.x + dx) + ',' + (n.y + dy)
        if (!near.has(k)) near.set(k, new Set())
        near.get(k).add(n.type)
      }
    }
    for (const id of Object.keys(w.nodes).sort()) {
      const n = w.nodes[id]
      if (n.type !== 'keeper' || n.kind !== undefined) continue
      let call = null
      // the id speaks only for people placed BY HAND; a town drawing's ids are
      // its own name repeated, and 'plan-millbrook-104' is not a miller
      if (!id.startsWith('plan-')) {
        for (const [frag, role] of BY_ID) if (id.includes(frag)) { call = role; break }
      }
      if (!call) {
        const around = near.get(n.x + ',' + n.y) ?? new Set()
        if (around.has('bank')) call = 'banker'
        else if (around.has('store')) call = 'merchant'
      }
      if (call) n.kind = call
    }
  }

  // 6ch (v6): waystones are GONE as a type -- the travel network was removed so
  // the road stays content and hauling has a job. But the town drawings still
  // carry a 'W' glyph here and there (the shared shire art is frozen), which
  // seats a waystone node. Convert any that slipped through into the standing
  // stones they now are, so no dead type reaches validation.
  for (const id of Object.keys(w.nodes)) {
    const n = w.nodes[id]
    if (n.type === 'waystone') { n.type = 'landmark'; n.kind = 'standing-stone' }
  }

  // §6cz (v6): ONE SMITH ON THE ISLAND. The anvil was pulled to Thornbury, but
  // every town drawing still seats a smith at a forge that is no longer there --
  // so six smiths stand at nothing, telling a newcomer they can smith where they
  // cannot. Thornbury keeps its smith: he works the one real anvil and has
  // earned the title. The rest become CRIERS: the same person, still in the
  // building, but now they say what the town is FOR -- the town's own SIGN_TEXT
  // line, carried in state so every window speaks it the same. A dead trade
  // becomes the world's own voice at the door.
  {
    const ss3 = settlementsOf(g)
    const townOfNode = (n) => {
      let best = null, bd = Infinity
      for (const s of ss3) { const d = Math.abs(n.x - s.x) + Math.abs(n.y - s.y); if (d < bd) { bd = d; best = s } }
      return best
    }
    let criers = 0
    for (const id of Object.keys(w.nodes)) {
      const n = w.nodes[id]
      if (n.type !== 'smith') continue
      const town = townOfNode(n)
      if (town && town.tag === 'thornbury') continue   // the one true smith stays
      const line = (town && SIGN_TEXT[town.tag]) || (town ? town.name : 'a town on Tallyholm')
      n.type = 'crier'
      n.text = line
      n.name = town ? ('the ' + town.name + ' crier') : 'the town crier'
      delete n.kind
      criers++
    }
    counts.criers = criers
  }

  // §6cz (v6): THE ROAD PASSES THROUGH A GATE, NOT THROUGH A HOUSE. The router
  // lays its paths from town centre to town centre BEFORE the walls are drawn,
  // so a boundary can come down across the road. Where that boundary is a town's
  // RAMPART -- the fortified curtain of a walled town -- a road meeting it is a
  // gate, so open it. A garden HEDGE or FENCE the same. But a plain house WALL
  // is a building, and a road clipping a house does NOT license tearing the
  // house open: the first version opened every wall a road touched and left the
  // market towns looking like ruins, their houses gutted where a lane passed.
  // So houses are LEFT WHOLE -- the road runs up to the wall and around it, the
  // way a lane meets a building in any real town -- and only true boundaries
  // (rampart, hedge, fence) are opened into the gates they are meant to have.
  // Loose decor that strayed onto the open road (a croft, a peat-stack, a
  // landmark) is still simply removed.
  {
    const WALKABLE = new Set(['brewpot', 'watchfire', 'fire', 'market'])
    const OPENABLE = new Set(['rampart', 'hedge', 'fence'])           // a boundary: a road here is a gate
    // §0e: the FOUNTAIN is a fixture, not decor. It stands in Anchor's street
    // by design and the road sweep would otherwise clear it as loose ornament
    // -- which it was, until it became the one door out of Nought.
    const KEEP = new Set(['wall', 'well', 'fountain', 'hearth', 'bank', 'store', 'anvil', // buildings & fixtures: leave whole
      'keeper', 'guard', 'signpost', 'crier', 'smith', 'banner', 'campfire',
      // v7: THE ROCKFALL STAYS WHERE IT FELL, road or no road. This sweep
      // exists to stop the founding sealing its own streets, and a boulder in
      // the South Pass is the one node in the world whose entire purpose is to
      // seal a road. The road to the South Pass is still drawn, still leaves
      // Anchor, and still arrives at a wall of rock -- which is the whole
      // point: a route that plainly used to work, and does not.
      'rockfall',
      // §14: ...and the toll gate, for exactly the same reason. This sweep
      // exists to stop a founding sealing its own streets, and the one gate on
      // the Millbrook Bridge is a thing whose entire job is to stand in a road.
      // It swept the gate off the single deck tile the road actually crosses
      // and left the two either side of it, which is a toll you walk round.
      'tollgate'])
    let gated = 0, cleared = 0, kept = 0
    for (const id of Object.keys(w.nodes)) {
      const n = w.nodes[id]
      if (WALKABLE.has(n.type)) continue
      if (!onRoad(g, n.x, n.y)) continue
      if (OPENABLE.has(n.type)) { delete w.nodes[id]; gated++ }       // open the boundary: a gate
      else if (KEEP.has(n.type)) { kept++ }                          // a house/fixture: leave it whole
      else { delete w.nodes[id]; cleared++ }                          // loose decor: gone
    }
    counts.roadGatesOpened = gated
    counts.roadDecorCleared = cleared
    counts.roadFixturesKept = kept
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
    const ESSENTIAL = new Set(['bank','store','anvil','smith','well','fountain','keeper','signpost','landmark'])
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

  // §6ao (v6): COMMIT TO SCARCE. The town drawings seat trees, rocks and
  // fishing spots as scenery (a T, an n, an F in the plan), and a few copses
  // and old oaks stand about the shire -- all of them GATHERABLE, which made
  // rival groves at Hollybarrow and elsewhere that undercut the one nursery at
  // Greenhollow. RuneScape had four thousand normal trees and congregation
  // happened anyway, at its scarce willows; the abundance did nothing. We do
  // deliberately what it did by accident: the ONLY places to gather are the
  // seams we placed. Every other tree/rock/fishing-spot becomes a look-alike
  // LANDMARK -- it still stands there, you just can't work it. The intended
  // seams (gwtree, cgrock/iron, the coal/oak/eel seams, port fish, magic-rock)
  // are exempt by their id.
  {
    // §13g: AND THE SEAM TABLE. This exempted the intended seams BY ID PREFIX,
    // which was fine while the ids were minted by the seeding routines and
    // became a trap the moment the seams became a table: everything from
    // worldgen-seams-v7 is called `seam-N`, no prefix matched, and this pass
    // silently demoted the island's ENTIRE baseline tier -- all seven starter
    // trees, all seven iron seams and all nine fishing spots -- into scenery
    // that looks identical and cannot be worked. A newcomer would have found
    // nothing on the whole island to chop, mine or fish.
    //
    // Matching on a NAME is matching on a spelling. The table is the register
    // of what is real; ask it.
    const KEEP = (id) => /^(seam-|gwtree|cgrock|cgmid|gwmid|fnmid|wdmagic|fish-|hwtree|dfish-)/.test(id)
    const DECOR = { tree: 'old-oak', 'iron-rock': 'cairn', 'fishing-spot': 'standing-stone' }
    let neutralised = 0
    for (const id of Object.keys(w.nodes)) {
      const n = w.nodes[id]
      const kind = DECOR[n.type]
      if (!kind) continue
      if (KEEP(id)) continue
      n.type = 'landmark'; n.kind = kind
      neutralised++
    }
    counts.neutralisedDecor = neutralised
  }
  // ================= ONE THING TO A TILE =================
  //
  // §7y. Two nodes may share a tile: they are keyed by id, not by position, so
  // nothing in the engine forbids it and nothing was checking. The apiary's
  // hedge and hold5's vegetable patch both stood on 376,280 -- a croft's garden
  // growing through a bee-garden's fence, invisible to every audit we had.
  //
  // The rule is the one hand-placing exists to express: the drawn thing wins.
  // A place is eighteen buildings somebody sat and drew; a holding is a stamp
  // repeated fifty-two times; a field is a pattern over half a shire. When two
  // occupy one tile, the more deliberate one stays.
  //
  // Done LAST and by rank, not by pass order -- there are two separate
  // place-drawing paths in this founding and patching one of them fixed
  // nothing. Ranking is order-independent, which is the whole lesson of §19e.
  {
    const RANK = (id) => id.startsWith('place-') ? 4
      : id.startsWith('yard-') || id.startsWith('shed-') || id.startsWith('cragfoot-')
        || id.startsWith('deepwood-') ? 3
      : id.startsWith('hold') ? 2 : id.startsWith('field-') ? 1 : 0
    const seen3 = new Map()
    let evicted = 0
    for (const [id, n] of Object.entries(w.nodes)) {
      const k = n.x + ',' + n.y
      const prev = seen3.get(k)
      if (prev === undefined) { seen3.set(k, id); continue }
      const loser = RANK(id) > RANK(prev) ? prev : id
      const winner = loser === id ? prev : id
      delete w.nodes[loser]; seen3.set(k, winner); evicted++
    }
    if (evicted) console.warn('WORLDGEN: ' + evicted + ' node(s) shared a tile; the drawn thing kept it')
  }

  // ================= NO ENCLOSURE MAY BE SEALED =================
  //
  // LAST. This ran in the middle of the founding and therefore only ever saw
  // what had been placed before it -- holdings and works. The towns' own
  // fields are drawn afterwards, so 144 plots inside Anchor's furlongs stayed
  // shut in while the sweep reported 154 successful openings and looked like
  // it was working. A sweep that runs before the thing it checks is not a
  // check. It goes at the end, where everything exists.
  //
  // §7n. A hedge with no way in is not a field, it is a decoration of a field,
  // and nothing in the founding was checking. Two separate passes each place
  // correctly and seal each other: the furlong draws its ring with one gate,
  // and a holding -- placed later, knowing nothing about fields -- puts its
  // wall across that gate. Measured on the seventh founding: 128 plots inside
  // rings a citizen could not enter, in Anchor and Millbrook.
  //
  // The answer is the same shape as the road sweep. Walk the island from
  // spawn; anything ploughed that the walk cannot reach has its ring OPENED --
  // one hedge or fence tile, chosen where it touches ground that is reachable,
  // which is exactly where a gate would have been put if anyone had noticed.
  // A field that has lost a panel of hedge is a field. A field nobody can
  // enter is nothing.
  {
    const WALKABLE = new Set(['brewpot', 'watchfire', 'fire', 'market', 'cart', 'dedication', 'plot'])
    let opened = 0
    for (let pass = 0; pass < 24; pass++) {
      const solid = new Set()
      for (const n of Object.values(w.nodes)) if (!WALKABLE.has(n.type)) solid.add(n.y * 4096 + n.x)
      const ok = (x, y) => inB(x, y) && !blockedAt(g, x, y) && !solid.has(y * 4096 + x)
      const seen = new Uint8Array(W * H)
      const q2 = new Int32Array(W * H); let h2 = 0, t2 = 0
      const sp2 = spawnDry(g); seen[sp2.y * W + sp2.x] = 1; q2[t2++] = sp2.y * W + sp2.x
      while (h2 < t2) {
        const i = q2[h2++], x = i % W, y = (i - x) / W
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
          const j = ny * W + nx
          if (seen[j] || !ok(nx, ny)) continue
          seen[j] = 1; q2[t2++] = j
        }
      }
      // a ploughed tile nobody can stand beside
      const stranded = Object.values(w.nodes).filter((n) => n.type === 'plot'
        && ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen[(n.y + dy) * W + n.x + dx]))
      if (!stranded.length) break
      // open the ring: the hedge, fence OR TREE nearest a stranded plot that
      // has reachable ground on its far side.
      //
      // A tree, because the landmark trees of §7u are solid and are laid in a
      // pass of their own -- so a willow can shut a field this sweep has
      // already opened, and no amount of ordering fixes that permanently. A
      // sweep that can remove whatever is actually in the way does not care
      // what order anything was placed in, which is the only version of this
      // that stays true as the founding grows.
      // OPEN EVERY WAY THIS PASS, not one and then flood again. The first
      // version cut a single panel per pass against a cap of twelve passes, so
      // it could never open more than twelve ways in total -- and when the
      // landmark trees arrived and 180 plots were shut in, it opened its
      // twelve and reported success. A sweep with a ceiling below the size of
      // the problem is a sweep that lies.
      let cut = false
      const near = new Set()
      for (const pz of stranded)
        for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++)
          near.add((pz.x + dx) + ',' + (pz.y + dy))
      for (const [id, n] of Object.entries(w.nodes)) {
        const isTree = n.type === 'landmark' && ['willow', 'dead-tree', 'pine',
          'avenue-oak', 'apple-tree', 'pear-tree', 'wind-thorn', 'thorn'].includes(n.kind)
        if (n.type !== 'hedge' && n.type !== 'fence' && !isTree) continue
        if (!near.has(n.x + ',' + n.y)) continue
        if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen[(n.y + dy) * W + n.x + dx])) continue
        delete w.nodes[id]; opened++; cut = true
      }
      if (!cut) { console.warn('WORLDGEN: ' + stranded.length + ' ploughed tiles are shut in and no hedge will open them'); break }
    }
    if (opened) console.warn('WORLDGEN: opened ' + opened + ' way(s) into sealed fields')
  }

  return w
}
