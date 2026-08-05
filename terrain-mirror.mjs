// terrain-mirror.js — the window's copy of the world's own geography.
//
// This file used to exist THREE TIMES: once inside window-web.html, once
// inside window-3d.html, once inside window-photo.html, ~1,300 lines each,
// pasted. The copies had not yet disagreed about a single tile — 210,432
// were checked — but they had already drifted in two places that simply
// had not bitten yet:
//
//   * window-photo's copy had a RENDERING function (buildBridges, which
//     touches THREE and the scene graph) wedged inside the terrain block,
//     so the "pure functions" were not pure.
//   * window-3d's copy of the landmark registry was thirteen nouns behind,
//     and nothing noticed because nothing in that window ever read it.
//
// The reason this matters more here than in an ordinary codebase: geography
// is law. Two citizens whose windows disagree about where the Fens end
// cannot arrange to meet there. A copy that drifts is a window in breach of
// the constitution, and the previous arrangement had no way to find out.
// Now there is one file, and test/mirror.test.mjs checks it against the
// engine tile for tile.
//
// Everything here is a PURE FUNCTION of (generator, seed, size). No state,
// no tick, no player. Call configure() once when the world announces
// itself; call it again and every cache is dropped.

let W = 192, H = 96
let GEN = 'interval-classic-v1', GSEED = ''

export function configure(opts = {}) {
  W = opts.worldW ?? opts.W ?? W
  H = opts.worldH ?? opts.H ?? H
  GEN = opts.generator ?? opts.gen ?? GEN
  GSEED = opts.seed ?? opts.genesisSeed ?? GSEED
  // a new world means every memo is about the old one
  _wet4 = null; _wetFor = null; _sea4 = null; _riv4 = null; _seaFor = null
  _roadBmp = null; _roadBmpFor = null
  _seedNumC = null
  _ssE = null
  _roadSet = null
  _ss3 = null
  _roads3 = null
  _shore4 = null
  _bio4 = null
  _ss4 = null
  _cost4 = null
  _roads4 = null
  _wallSet = null
  _signs = null
  _wallTick = -1; _signTick = -1
  return { W, H, GEN, GSEED }
}
export const dims = () => ({ W, H, GEN, GSEED })

// V5 CHANGED THE FURNITURE, NOT THE LAND.
//
// worldgen-expanse5's own header says it: v4's land is right and stays exactly
// as it is, and nothing in v5 touches any of it. Every terrain function below
// is therefore correct for both -- but a check written `GEN === 'interval-
// expanse-v4'` silently falls through to the v3 branch for a v5 world, which
// is a whole island of wrong ground from one string comparison. window-web
// learned this and fixed it locally; this module did not, and since the module
// exists precisely so the windows cannot drift apart, the fix belongs here.
const IS_EXPANSE4 = () => GEN === 'interval-expanse-v4' || GEN === 'interval-expanse-v5'

export const tileHash = (x, y, salt) => {
  let h = (x * 374761393 + y * 668265263 + salt * 1442695041) >>> 0
  h = (h ^ (h >> 13)) >>> 0; h = (h * 1274126177) >>> 0
  return (h ^ (h >> 16)) >>> 0
}

let _seedNumC = null, _ssE = null
function seedNumC() {
  if (_seedNumC !== null) return _seedNumC
  let h = 0
  for (let i = 0; i < GSEED.length; i++) h = Math.imul(h ^ GSEED.charCodeAt(i), 2654435761) | 0
  return (_seedNumC = h >>> 0)
}
function thashE(x, y, k) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(k | 0, 2246822519) + seedNumC()) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return (h ^ (h >>> 16)) >>> 0
}
function meander(tag, u, seg, amp) {
  const k = Math.floor(u / seg)
  const f = (u - k * seg) / seg
  const a = (thashE(k, 0, tag) % (2 * amp + 1)) - amp
  const b = (thashE(k + 1, 0, tag) % (2 * amp + 1)) - amp
  const sf = f * f * (3 - 2 * f)
  return a + (b - a) * sf
}
function riverXE(y) {
  const cx = Math.floor(W / 2)
  return cx + Math.round(meander(21, y, 46, 26) + meander(22, y, 14, 5))
}
function inSeaE(x, y) {
  const bx = W * 0.80, by = H * 0.74
  if (x < bx || y < by) return false
  return (x - bx) / (W - bx) + (y - by) / (H - by) > 0.55
}
function inPoolE(x, y) {
  if (y < H * 0.66) return false
  const bx = Math.floor(x / 7), by = Math.floor(y / 7)
  const h = thashE(bx, by, 7)
  if ((h & 255) > 34) return false
  const px = bx * 7 + ((h >>> 8) % 5), py = by * 7 + ((h >>> 16) % 5)
  return Math.abs(x - px) + Math.abs(y - py) <= 2
}
const isWaterE = (x, y) => inSeaE(x, y) || inPoolE(x, y) || Math.abs(x - riverXE(y)) <= 1
function settlementsE() {
  if (IS_EXPANSE4()) return settlementsE4()
  if (GEN === 'interval-expanse-v3') return settlementsE3()
  const cx = Math.floor(W / 2), cy = Math.floor(H / 2)
  if (GEN === 'interval-expanse-v2') {
    // v2: the water towns stand on their water. Millbrook and Fenmarch on
    // the river's east bank, Eastmere opening on the bay. Mirror of
    // worldgen-expanse2.mjs settlementsOf, tile for tile.
    const mby = Math.round(H * 0.24), fmy = Math.round(H * 0.84)
    return [
      { x: cx, y: cy, w: 24, h: 14 },
      { x: Math.round(W * 0.46), y: Math.round(H * 0.14), w: 14, h: 10 },
      { x: riverXE(mby) + 6, y: mby, w: 14, h: 10 },
      { x: Math.round(W * 0.86), y: Math.round(H * 0.50), w: 14, h: 10 },
      { x: Math.round(W * 0.85), y: Math.round(H * 0.80), w: 14, h: 10 },
      { x: riverXE(fmy) + 6, y: fmy, w: 14, h: 10 },
      { x: Math.round(W * 0.26), y: Math.round(H * 0.46), w: 16, h: 12 },
    ]
  }
  return [
    { x: cx, y: cy, w: 24, h: 14 },
    { x: Math.round(W * 0.46), y: Math.round(H * 0.14), w: 14, h: 10 },
    { x: Math.round(W * 0.72), y: Math.round(H * 0.24), w: 14, h: 10 },
    { x: Math.round(W * 0.86), y: Math.round(H * 0.50), w: 14, h: 10 },
    { x: Math.round(W * 0.74), y: Math.round(H * 0.70), w: 14, h: 10 },
    { x: Math.round(W * 0.44), y: Math.round(H * 0.84), w: 14, h: 10 },
    { x: Math.round(W * 0.26), y: Math.round(H * 0.46), w: 16, h: 12 },
  ]
}
const ssE = () => (_ssE ??= settlementsE())
let _roadSet = null
function roadTilesE() {
  if (_roadSet) return _roadSet
  const ss = ssE(), a = ss[0]
  const set = new Set()
  for (let i = 1; i < ss.length; i++) {
    const s = ss[i]
    const vx = s.x - a.x, vy = s.y - a.y
    const L = Math.sqrt(vx * vx + vy * vy)
    const nx = -vy / L, ny = vx / L
    const steps = Math.ceil(L * 2)
    for (let stp = 0; stp <= steps; stp++) {
      const t = stp / steps
      const taper = Math.min(1, Math.min(t, 1 - t) * 6)
      const o = meander(90 + i, t * L, 26, 9) * taper
      const px = Math.round(a.x + vx * t + nx * o)
      const py = Math.round(a.y + vy * t + ny * o)
      set.add(px + ',' + py); set.add((px + 1) + ',' + py)
    }
  }
  return (_roadSet = set)
}
const onRoadE = (x, y) => roadTilesE().has(x + ',' + y)
function biomeAtE(x, y) {
  if (x <= Math.round(W * 0.19)) return 'wilds'
  const cx = Math.floor(W / 2), cy = Math.floor(H / 2)
  const dx = (x - cx) / W, dy = (y - cy) / H
  if (dx * dx + dy * dy < 0.019) return 'meadow'
  if (y <= H * 0.32) return 'greenwood'
  if (x >= W * 0.70) return 'crags'
  if (y >= H * 0.70) return 'fens'
  return 'meadow'
}
function fordE(x, y) { // mirror of fordAt: the road crosses, and every main street crosses
  if (onRoadE(x, y)) return true
  for (const s of ssE()) {
    if (Math.abs(x - s.x) <= (s.w >> 1) && Math.abs(y - s.y) <= (s.h >> 1)
      && (x === s.x || y === s.y)) return true
  }
  return false
}
// ---- the third expanse (interval-expanse-v3): the island, mirrored ----
// An exact mirror of worldgen-expanse3.mjs: the coast by octant arithmetic
// (no atan2. ECMA-262 leaves it implementation-defined), the borders that
// are features, the road graph, and the fords painted as bridges.
function angleOf3(dx, dy) {
  const ax = dx < 0 ? -dx : dx, ay = dy < 0 ? -dy : dy
  if (ax === 0 && ay === 0) return 0
  if (dx > 0 && dy >= 0) return ax >= ay ? (ay / ax) * 45 : 90 - (ax / ay) * 45
  if (dx <= 0 && dy > 0) return ay > ax ? 90 + (ax / ay) * 45 : 180 - (ay / ax) * 45
  if (dx < 0 && dy <= 0) return ax >= ay ? 180 + (ay / ax) * 45 : 270 - (ax / ay) * 45
  return ay > ax ? 270 + (ax / ay) * 45 : 360 - (ay / ax) * 45
}
function coastR3(u0) {
  const u = ((u0 % 360) + 360) % 360
  let r = 0.80 + meander(301, u / 5, 10, 12) / 130 + meander(302, u / 5, 4, 6) / 160
  const bump = (c, w2, amt) => {
    const d1 = u - c < 0 ? c - u : u - c
    const d = d1 < 360 - d1 ? d1 : 360 - d1
    if (d < w2) r += amt * (1 - d / w2)
  }
  bump(180, 28, +0.18); bump(150, 12, -0.09); bump(210, 12, -0.09)
  bump(38, 22, -0.12); bump(78, 16, -0.07); bump(0, 14, +0.07); bump(305, 18, +0.06)
  return r
}
function inSeaBase3(x, y) {
  const dx = (x - W / 2) / (W / 2), dy = (y - H / 2) / (H / 2)
  const r = Math.sqrt(dx * dx + dy * dy)
  if (r <= 0.52) return false
  return r > coastR3(angleOf3(dx, dy))
}
const emY3 = () => Math.round(H * 0.75)
const _shore3 = new Map()
function bayShoreX3(y) {
  if (_shore3.has(y)) return _shore3.get(y)
  let sx = null
  for (let x = W - 4; x >= Math.floor(W / 2); x--) if (!inSeaBase3(x, y)) { sx = x; break }
  _shore3.set(y, sx); return sx
}
function isles3() {
  const ey = emY3(), sh = bayShoreX3(ey) ?? Math.round(W * 0.7)
  return [{ x: sh + 22, y: ey + 26, rx: 10, ry: 7 }, { x: Math.round(W * 0.185), y: Math.round(H * 0.10), rx: 8, ry: 5 }]
}
function onIsle3(x, y) {
  for (const i of isles3()) { const dx = (x - i.x) / i.rx, dy = (y - i.y) / i.ry; if (dx * dx + dy * dy < 1) return true }
  return false
}
const inSea3 = (x, y) => inSeaBase3(x, y) && !onIsle3(x, y)
const brandX3 = (y) => Math.round(W * 0.235 + meander(310, y, 34, 7))
const ridgeX3 = (y) => Math.round(W * 0.685 + meander(311, y, 30, 9))
const treeY3 = (x) => Math.round(H * 0.30 + meander(312, x, 44, 11))
const fenY3 = (x) => Math.round(H * 0.71 + meander(313, x, 44, 9))
const passes3 = () => [Math.round(H * 0.37), Math.round(H * 0.655)]
function onRidge3(x, y) {
  const rx = ridgeX3(y); const d = x - rx < 0 ? rx - x : x - rx
  if (d > 2) return false
  for (const p of passes3()) { const pd = y - p < 0 ? p - y : y - p; if (pd < 4) return false }
  if (y < treeY3(x) - 8) return false
  if (inSeaBase3(x, y)) return false
  return true
}
const riverX3 = (y) => Math.floor(W / 2) + Math.round(meander(21, y, 52, 30) + meander(22, y, 16, 6))
const confY3 = () => Math.round(H * 0.63)
function marchWY3(x) {
  const cyy = confY3(); const reach = riverX3(cyy) - 8 - x
  const t = reach < 0 ? 0 : reach > 70 ? 1 : reach / 70
  return cyy + Math.round(meander(25, x, 36, 12) * t)
}
function inRiver3(x, y) {
  const srcY = Math.round(H * 0.115)
  if (y >= srcY) {
    const rx = riverX3(y); const d = x - rx < 0 ? rx - x : x - rx
    if (d <= (y > H * 0.82 ? 2 : 1)) return true
    if (y > H * 0.84) {
      const dx2 = rx - 7 + Math.round(meander(27, y, 9, 3)); const d2 = x - dx2 < 0 ? dx2 - x : x - dx2
      if (d2 <= 1) return true
    }
  }
  if (x < riverX3(confY3()) - 1 && x > brandX3(y) - 16) {
    const my = marchWY3(x); const d3 = y - my < 0 ? my - y : y - my
    if (d3 <= 1) return true
  }
  return false
}
function inLake3(x, y) {
  const lx = Math.round(W * 0.73), ly = Math.round(H * 0.22)
  const dx = (x - lx) / 24, dy = (y - ly) / 13
  return dx * dx + dy * dy < 1
}
const isWater3 = (x, y) => inSea3(x, y) || inRiver3(x, y) || inLake3(x, y)
function biomeAtE3(x, y) {
  if (inSeaBase3(x, y) && !onIsle3(x, y)) return 'sea'
  if (x <= brandX3(y)) return 'wilds'
  if (x >= ridgeX3(y) && y >= treeY3(x) - 8) return 'crags'
  if (y <= treeY3(x)) return 'greenwood'
  if (y >= fenY3(x)) return 'fens'
  return 'heartlands' // the truth's own word for it (v3 vocabulary)
}
let _ss3 = null
function settlementsE3() {
  if (_ss3) return _ss3
  const cx3 = Math.floor(W / 2), cy3 = Math.floor(H / 2)
  const mby = Math.round(H * 0.305), fmy = Math.round(H * 0.825), ey = emY3()
  const shore = bayShoreX3(ey) ?? Math.round(W * 0.7)
  return (_ss3 = [
    { x: cx3, y: cy3, w: 24, h: 14, name: 'Anchor' },
    { x: Math.round(W * 0.40), y: Math.round(H * 0.16), w: 14, h: 10, name: 'Greenhollow' },
    { x: riverX3(mby) + 6, y: mby, w: 14, h: 10, name: 'Millbrook' },
    { x: Math.round(W * 0.87), y: Math.round(H * 0.49), w: 14, h: 10, name: 'Cragfoot' },
    { x: shore - 5, y: ey, w: 14, h: 10, name: 'Eastmere' },
    { x: riverX3(fmy) + 6, y: fmy, w: 14, h: 10, name: 'Fenmarch' },
    { x: Math.round(W * 0.235) + 20, y: Math.round(H * 0.49), w: 16, h: 12, name: 'Norwick' },
  ])
}
function junctions3() {
  const [p1, p2] = passes3(); const i = isles3()[0]
  return { watersmeet: { x: riverX3(confY3()) + 3, y: confY3() + 3 }, npass: { x: ridgeX3(p1), y: p1 },
    spass: { x: ridgeX3(p2), y: p2 }, shrine: { x: i.x, y: i.y } }
}
let _roads3 = null
function roadTiles3() {
  if (_roads3) return _roads3
  const s = settlementsE3(), j = junctions3()
  const segs = [[s[0], s[2], 91], [s[2], s[1], 92], [s[1], s[6], 93], [s[0], s[6], 94], [s[0], j.npass, 95], [j.npass, s[3], 96],
    [s[0], j.watersmeet, 97], [j.watersmeet, j.spass, 98], [j.spass, s[4], 99], [j.watersmeet, s[5], 100], [s[4], s[5], 101], [s[3], s[4], 102], [s[4], j.shrine, 103]]
  const set = new Set()
  for (const [a, b, tag] of segs) {
    const vx = b.x - a.x, vy = b.y - a.y, L = Math.sqrt(vx * vx + vy * vy), nx = -vy / L, ny = vx / L
    const steps = Math.ceil(L * 2)
    for (let stp = 0; stp <= steps; stp++) {
      const t = stp / steps, taper = Math.min(1, Math.min(t, 1 - t) * 6)
      const o = meander(tag, t * L, 26, 8) * taper
      const px = Math.round(a.x + vx * t + nx * o), py = Math.round(a.y + vy * t + ny * o)
      set.add(px + ',' + py); set.add((px + 1) + ',' + py)
    }
  }
  return (_roads3 = set)
}
const onRoad3 = (x, y) => roadTiles3().has(x + ',' + y)
function fordE3(x, y) {
  if (onRoad3(x, y)) return true
  for (const s of settlementsE3()) {
    if (Math.abs(x - s.x) <= (s.w >> 1) && Math.abs(y - s.y) <= (s.h >> 1)
      && (x === s.x || y === s.y)) return true
  }
  return false
}
function terrainOfE3(x, y) {
  if (inSea3(x, y)) return fordE3(x, y) ? 'bridge' : 'sea'
  if (inRiver3(x, y) || inLake3(x, y)) return fordE3(x, y) ? 'bridge' : 'river'
  for (const t2 of settlementsE3()) {
    if (Math.abs(x - t2.x) <= (t2.w >> 1) && Math.abs(y - t2.y) <= (t2.h >> 1))
      return onRoad3(x, y) ? 'cobble' : 'flag' // paved streets, flagstone yards
  }
  if (onRidge3(x, y)) return onRoad3(x, y) ? 'gravel' : 'mountain'
  if (onRoad3(x, y)) {
    // mirrored from worldgen groundKindAt (v0.79), the canon of surfaces:
    // civilization paves, the passes crunch, the open country is trail
    for (const t2 of settlementsE3()) if (Math.max(Math.abs(x - t2.x), Math.abs(y - t2.y)) <= 15) return 'cobble'
    if (onRidge3(x - 1, y) || onRidge3(x + 1, y) || onRidge3(x, y - 1) || onRidge3(x, y + 1)
      || biomeAtE3(x, y) === 'crags') return 'gravel'
    return 'trail'
  }
  {
    const w9 = (x2, y2) => inSea3(x2, y2) || inRiver3(x2, y2) || inLake3(x2, y2)
    if (w9(x + 1, y) || w9(x - 1, y) || w9(x, y + 1) || w9(x, y - 1)) return 'sand' // the shore
  }
  const b3 = biomeAtE3(x, y)
  return b3 === 'heartlands' ? 'meadow' : b3 // tile palette keeps its old key
}
// ---------------------------------------------------------------------
// An exact mirror of worldgen-expanse4.mjs. The window verifies the world
// rather than trusting it, so the fourth founding's geography has to exist
// on this side too: the countries as weighted-Voronoi LOBES, the capes, the
// Barrow, the scarce crossings, and -- the new one -- roads that are ROUTED
// rather than drawn. The router is ported whole, packed-integer heap and
// all, because a road drawn differently here than on the server is a
// window that quietly lies about where you can walk.
// ---------------------------------------------------------------------
const CAPES4 = [
  { tag: 'wildshead', name: 'the Wilds Head', u: 180, w: 24, amt: +0.30 },
  { tag: 'stonepoint', name: 'the Stonepoint', u: 3, w: 8, amt: +0.20 },
  { tag: 'nordhead', name: 'the Nordhead', u: 306, w: 13, amt: +0.15 },
  { tag: 'sawtooth', name: 'the Sawtooth', u: 258, w: 7, amt: +0.13 },
]
const BAYS4 = [[152,11,-0.17],[208,11,-0.17],[38,25,-0.22],[78,14,-0.12],[284,10,-0.11],[330,12,-0.09]]
function coastR4(u0) {
  const u = ((u0 % 360) + 360) % 360
  let r = 0.78 + meander(301, u / 5, 10, 12) / 130 + meander(302, u / 5, 4, 6) / 160
  const bump = (c, w2, amt) => {
    const d1 = u - c < 0 ? c - u : u - c
    const d = d1 < 360 - d1 ? d1 : 360 - d1
    if (d < w2) r += amt * (1 - d / w2)
  }
  for (const c of CAPES4) bump(c.u, c.w, c.amt)
  for (const b of BAYS4) bump(b[0], b[1], b[2])
  return r
}
function inSeaBase4(x, y) {
  const dx = (x - W / 2) / (W / 2), dy = (y - H / 2) / (H / 2)
  const r = Math.sqrt(dx * dx + dy * dy)
  if (r <= 0.50) return false
  return r > coastR4(angleOf3(dx, dy))
}
function emY4() { return Math.round(H * 0.74) }
let _shore4 = null
function bayShoreX4(y) {
  if (!_shore4) _shore4 = {}
  if (_shore4[y] !== undefined) return _shore4[y]
  let sx = null
  for (let x = W - 4; x >= Math.floor(W / 2); x--) if (!inSeaBase4(x, y)) { sx = x; break }
  return (_shore4[y] = sx)
}
function isles4() {
  const ey = emY4(), sh = bayShoreX4(ey) ?? Math.round(W * 0.7)
  return [{ x: sh + 20, y: ey + 24, rx: 10, ry: 7 },
          { x: Math.round(W * 0.175), y: Math.round(H * 0.09), rx: 8, ry: 5 }]
}
function onIsle4(x, y) {
  for (const i of isles4()) { const dx = (x - i.x) / i.rx, dy = (y - i.y) / i.ry; if (dx * dx + dy * dy < 1) return true }
  return false
}
// THE COAST AND THE RIVER, REMEMBERED TOO.
//
// Caching isWater4 alone took a tile from thirty-eight microseconds to
// fourteen, and the rest is these two being asked directly: a Voronoi coast
// and a meandering river, recomputed per call. One byte each, same lifetime as
// the water cache. The island goes from seventeen seconds to under two.
let _sea4 = null, _riv4 = null, _seaFor = null
const _wetKey = () => GSEED + ':' + W + 'x' + H
const inSea4 = (x, y) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return inSeaBase4(x, y) && !onIsle4(x, y)
  const k = _wetKey()
  if (_seaFor !== k) { _seaFor = k; _sea4 = new Uint8Array(W * H); _riv4 = new Uint8Array(W * H) }
  const i = y * W + x
  const hit = _sea4[i]
  if (hit) return hit === 2
  const v = inSeaBase4(x, y) && !onIsle4(x, y)
  _sea4[i] = v ? 2 : 1
  return v
}
// STRAIGHT, and exactly where the law is. Mirrors worldgen-expanse4.brandX:
// the stones and geo.wilds must be the same line, or a citizen stands past
// the Brand with the Wilds all round them and cannot attack anyone.
const brandX4 = (_y) => Math.round(W * 0.215)

// the countries, as lobes. Same seeds, same squash, same low-frequency
// boundary jitter: a high-frequency jitter here would dissolve the borders
// into speckle exactly as it did on the server's first draft.
const SEEDS4 = [
  ['heartlands',0.42,0.40,0.90,420],['heartlands',0.54,0.52,0.74,421],
  ['greenwood',0.44,0.10,1.02,422],['greenwood',0.66,0.15,0.86,423],
  ['crags',0.89,0.28,0.90,424],['crags',0.83,0.50,0.70,425],
  ['downs',0.70,0.68,0.86,426],['downs',0.79,0.78,0.62,430],
  ['fens',0.49,0.90,0.86,427],['fens',0.33,0.82,0.60,428],
  ['moor',0.31,0.16,0.84,429],['moor',0.38,0.27,0.58,431],
]
const VSQUASH4 = 1.9
function regionAt4(x, y) {
  let best = 'heartlands', bd = Infinity
  for (const s of SEEDS4) {
    const sx = s[1] * W, sy = s[2] * H, wt = s[3], jt = s[4]
    const dx = x - sx, dy = (y - sy) * VSQUASH4
    const j = meander(jt, x + y * 0.6, 150, 26) + meander(jt + 40, x - y * 0.45, 60, 9)
    const d = (dx * dx + dy * dy) / (wt * wt) + j * 460
    if (d < bd) { bd = d; best = s[0] }
  }
  return best
}
// the biome field is queried for every tile drawn, every frame, and each
// query is twelve weighted seeds with two meanders apiece. Cached once.
let _bio4 = null
const BIO4 = ['sea','wilds','heartlands','greenwood','crags','fens','downs','moor']
function biomeAtE4(x, y) {
  if (x < 0 || y < 0 || x >= W || y >= H) return 'sea'
  if (!_bio4) _bio4 = new Uint8Array(W * H).fill(255)
  const i = y * W + x
  if (_bio4[i] !== 255) return BIO4[_bio4[i]]
  let b
  if (inSeaBase4(x, y) && !onIsle4(x, y)) b = 'sea'
  else if (x <= brandX4(y)) b = 'wilds'
  else b = regionAt4(x, y)
  _bio4[i] = BIO4.indexOf(b)
  return b
}
const ridgeX4 = (y) => Math.round(W * 0.695 + meander(311, y, 30, 11))
const passes4 = () => [Math.round(H * 0.34), Math.round(H * 0.62)]
function onRidge4(x, y) {
  const rx = ridgeX4(y), d = x - rx < 0 ? rx - x : x - rx
  if (d > 2) return false
  for (const p of passes4()) { const pd = y - p < 0 ? p - y : y - p; if (pd < 4) return false }
  if (biomeAtE4(x, y) === 'greenwood') return false
  if (y > H * 0.70) return false      // the ridge dies away before the bay
  if (inSeaBase4(x, y)) return false
  return true
}
const barrowC4 = () => ({ x: Math.round(W * 0.575), y: Math.round(H * 0.585) })
function onBarrow4(x, y) {
  const c = barrowC4(), dx = (x - c.x) / 26, dy = (y - c.y) / 15
  return dx * dx + dy * dy < 1 + meander(330, x + y, 18, 12) / 190
}
function riverX4(y) { return Math.floor(W / 2) + Math.round(meander(21, y, 52, 30) + meander(22, y, 16, 6)) }
const confY4 = () => Math.round(H * 0.63)
function marchWY4(x) {
  const cyy = confY4(), reach = riverX4(cyy) - 8 - x
  const t = reach < 0 ? 0 : reach > 70 ? 1 : reach / 70
  return cyy + Math.round(meander(25, x, 36, 12) * t)
}
// THE RIVER, REMEMBERED. Two meanders and a march branch, recomputed on every
// call and asked for every tile -- eleven microseconds each, and the last of
// the four costs that made painting the island take a quarter of a minute.
function inRiver4(x, y) {
  if (x < 0 || y < 0 || x >= W || y >= H) return _inRiver4raw(x, y)
  const k = _wetKey()
  if (_seaFor !== k) { _seaFor = k; _sea4 = new Uint8Array(W * H); _riv4 = new Uint8Array(W * H) }
  const i = y * W + x
  const hit = _riv4[i]
  if (hit) return hit === 2
  const v = _inRiver4raw(x, y)
  _riv4[i] = v ? 2 : 1
  return v
}
function _inRiver4raw(x, y) {
  const srcY = Math.round(H * 0.105)
  if (y >= srcY) {
    const rx = riverX4(y), d = x - rx < 0 ? rx - x : x - rx
    if (d <= (y > H * 0.82 ? 2 : 1)) return true
    if (y > H * 0.84) {
      const dx2 = rx - 7 + Math.round(meander(27, y, 9, 3))
      const d2 = x - dx2 < 0 ? dx2 - x : x - dx2
      if (d2 <= 1) return true
    }
  }
  if (x < riverX4(confY4()) - 1 && x > brandX4(y) - 16) {
    const my = marchWY4(x), d3 = y - my < 0 ? my - y : y - my
    if (d3 <= 1) return true
  }
  return false
}
function inLake4(x, y) {
  const cx = Math.round(W * 0.745), cy = Math.round(H * 0.21)
  const dx = (x - cx) / 24, dy = (y - cy) / 13
  return dx * dx + dy * dy < 1
}
// WATER IS ASKED ABOUT MORE THAN ANYTHING ELSE, so it is remembered.
//
// isWater4 costs about ten microseconds -- a Voronoi coast, a meandering river
// and two lakes, recomputed from scratch every time -- and the shoreline test
// alone asks it FOUR times for every tile. Painting the island cost the site's
// chart thirty-eight microseconds a tile, seventeen seconds for the land and
// twenty-nine more for the roads. It did load; nobody waits three quarters of
// a minute, so it read as broken.
//
// One byte a tile, thrown away whenever the world changes. Nothing about the
// answer changes -- only how often it is worked out.
let _wet4 = null, _wetFor = null
const isWater4 = (x, y) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return inSea4(x, y) || inRiver4(x, y) || inLake4(x, y)
  const k = GSEED + ':' + W + 'x' + H
  if (_wetFor !== k) { _wetFor = k; _wet4 = new Uint8Array(W * H) }
  const i = y * W + x
  const hit = _wet4[i]
  if (hit) return hit === 2
  const w = inSea4(x, y) || inRiver4(x, y) || inLake4(x, y)
  _wet4[i] = w ? 2 : 1
  return w
}
function bridges4() {
  const ys = [Math.round(H * 0.20), Math.round(H * 0.395), confY4() + 2, Math.round(H * 0.80)]
  const out = ys.map((y) => ({ x: riverX4(y), y }))
  const mx = Math.round(W * 0.30)
  out.push({ x: mx, y: marchWY4(mx) })
  return out
}
function onBridge4(x, y) {
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
  for (const b of bridges4()) {
    if (Math.abs(x - b.x) > 16 || Math.abs(y - b.y) > 16) continue
    if (b.tag !== 'brm') {
      if (y - b.y > 1 || b.y - y > 1) continue
      let w = b.x, e = b.x
      while (w > 3 && isWater4(w - 1, y)) w--
      while (e < W - 4 && isWater4(e + 1, y)) e++
      if (x >= w - 2 && x <= e + 2) return true
    } else {
      if (x - b.x > 1 || b.x - x > 1) continue
      let n = b.y, s2 = b.y
      while (n > 3 && isWater4(x, n - 1)) n--
      while (s2 < H - 4 && isWater4(x, s2 + 1)) s2++
      if (y >= n - 2 && y <= s2 + 2) return true
    }
  }
  return false
}
// The ten drawings, and the logic that seats them. The mirror carries the
// ART, not a table of coordinates: seats depend on the seed, so a table
// would be right for one world and wrong for every other. With the plans
// here the window runs the same spiral the generator does and lands on the
// same tile for any seed.
// THE DRAWINGS, COPIED FROM worldgen-shire.mjs.
//
// This copy had fallen a long way behind: Anchor differed in thirty-three of
// its thirty-six rows. It did not matter while the terrain paved every town
// rect wholesale -- the stale plan was never consulted for anything you could
// see. The moment paving began to FOLLOW the drawing, the mirror started
// laying grass inside buildings and running a road through a room, because it
// was reading a different Anchor from the one the world had built.
//
// Regenerate this whenever a plan changes. It is the same law as the terrain:
// a window that carries a different drawing is carrying a different town.
const PLANS4 = {
  anchor: [
    "%%%%%%%%%%%%%%%%%%%%%%%%%  %%%%%%%%%%%%%%%%%%%%%%%%%",
    "%........................G.........................%",
    "%.################################################.%",
    "%.#qBBB,k,v,,,,,#,vv,,,,e,#,,,,,,,,,v,#,ed,,,v,,,#.%",
    "%.#,,,,,,,,,*,,,#,,,*k,,,,#,A,s,A,,,,,#,h,k,,,,,,#.%",
    "%.#,,,,,,,,,,,e,#,,,,,,,,,#,,,,,,,,*,,#,,,,,,,,h,#.%",
    "%.#,,,,,,,,,,,,,#,,,,,,d,,#,,q,,,,,,,,#,,,,,q,,,,#.%",
    "%.#,,,,,,,,,,,,,#,,,,,,,,,#,,,,,,,,,,,#,,,,,,,,,,#.%",
    "%.#######,###########,##########,###########,#####.%",
    "%..................................................%",
    "%..................................................%",
    "%.#####################......#####################.%",
    "%.#v,S,qk,,,,#,eedd,v,#......#v,qk,,,,,#,e,dd,,v,#.%",
    "%.#,,,,,,,,,,#,h,,,,,,#...U..#,,,,,,h,,#,,,,,,,,,#.%",
    "%.#,*,,,,,,,,#,,,,,,,q#......#,e,,,,,,,#,,,,,q,,h#.%",
    "%.#,,,,,,,,,,#,,,,,,,,#.i....#,,,,,,,,,#,,,,,,,,,#.%",
    "%.#####,##########,####......#####,#########,#####.%",
    " .G................................................ ",
    " ................................................G. ",
    "%.#########################...%%%%%%%%%  %%%%%%%%%.%",
    "%.#e,d,,,,#e,d,,,,#d,e,,,,#...%....G.........G...%.%",
    "%.#h,,,,,,#,,,,h,,#,,,,h,,#...%..!......*........%.%",
    "%.#,,,,q,,#,v,,,,,#,q,,,,,#...%.################.%.%",
    "%.#,,,,,,,#,,,,,,,#,,,,,,,#...%.#,h,,#GG,,#Bk,,#.%.%",
    "%.####,#######,#######,####...%.#,,,,#,,,,#,,,,#.%.%",
    "%..............o..............%.#,,,,#,,,,#,,,,#.%.%",
    "%.............................%.#,,,,#,,,,#,,,,#.%.%",
    "%.####,########,########,#####%.#,,,,#,,,,#,,,,#.%.%",
    "%.#,,,,,,,,#,,,,,,,,#,,,,,,,,#%.#,,,,#,,,,#,,,,#.%.%",
    "%.#e,d,,,,,#d,e,,,,,#e,d,,,,,#%.#,,,,#,,,,#,,,,#.%.%",
    "%.#h,,,,,,,#,,,,h,,,#,,,,h,,,#%.#,,,,#,,,,#,,,,#.%.%",
    "%.#,,,,,,q,#,v,,,,,,#,,,,,,q,#%.##,####,####,###.%.%",
    "%.############################%..................%.%",
    "%.............................%%%%%%%%%%%%%%%%%%%%.%",
    "%.........................G........................%",
    "%%%%%%%%%%%%%%%%%%%%%%%%%  %%%%%%%%%%%%%%%%%%%%%%%%%",
  ],
  millbrook: [
    "                                        ",
    " ...................................... ",
    " ..#######..########..#######..#######. ",
    " ..#,,ed,#..#,,Bqv,#..#,,ed,#..#,,,v,#. ",
    " ..#,h,k,#..#,,,,k,#..#,h,,,#..#,A,s,#. ",
    " ..#,,,,,#..#,,,,,,#..#,,,,,#..#,,,,,#. ",
    " ..###,###..####,###..###,###..###,###. ",
    " ...................................... ",
    " ...................................... ",
    " ..............o.........*...........W. ",
    " .T.................i.................. ",
    " ...................................... ",
    " ..###,###..####,###..###,###..###,###. ",
    " ..#e,,d,#..#e,,,d,#..#vq,k,#..#e,,d,#. ",
    " ..#,h,,,#..#,h,,,,#..#,,q,,#..#,h,,,#. ",
    " ..#,,,,,#..#,,,,,,#..#,,,,,#..#,,,,,#. ",
    " ..#######..########..#######..#######. ",
    "                                        ",
  ],
  oxenford: [
    "                                    ",
    " .................................. ",
    " .###############################.. ",
    " .#vBBB,qk,,,#eedd,,,,#v,,,,,q,,#.. ",
    " .#,,,,,,,,,,#,h,,,,,,#,,S,k,,,,#.. ",
    " .#,,,,,,,,,,#,,,,,,q,#,,,,,,,,e#.. ",
    " .#,,,,,,,,,,#,,,,,,,,#,,,,,,,,,#.. ",
    " .#####,#########,#########,#####.. ",
    " .................................. ",
    " .................################. ",
    " ..f.f.f.f.f.f....#e,d,,,#v,k,,,,#. ",
    " ..f.f.f.f.f.f..U.#h,,,,,#,,,,h,,#. ",
    " ..f.f.f.f.f.f....#,,,,q,#,,,,,,e#. ",
    " .................#,,,,,,#,,,,,,,#. ",
    " .................###,#######,####. ",
    " .................................. ",
    " ...............i...!.............. ",
    " ........o..............*.......... ",
    " .####,#######,#######,######,####. ",
    " .#q,v,,,,#eed,,,,#d,e,,,,#e,,,,,#. ",
    " .#k,,,,e,#,q,,h,,#,,,,v,,#,,h,q,#. ",
    " .#,,,,,,,#,,,,,,,#,,,,,,,#,,,,,,#. ",
    " .################################. ",
    " .................................. ",
    " .#####,###########,#########,####. ",
    " .#,,,d,,,v,,##,d,e,,,q,##,e,,,v,#. ",
    " .################################. ",
    "                                    ",
  ],
  thornbury: [
    "                                  ",
    " ................................ ",
    " .%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%. ",
    " .%..#######################...%. ",
    " .%..#*k,,,,#,h,,,,,#,Bk,,,#...%. ",
    " .%.G#,,,,,,#,,,,,,,#,,,,,,#.G.%. ",
    " .%..#,,,,,e#,,,,,q,#,,,,,e#...%. ",
    " .%..#,,,,,,#,,,,,,,#,,,,,,#...%. ",
    " .%..#,,,,d,#,,v,,,,#d,,,,,#...%. ",
    " .%..#,,,,,,#,,,,,,,#,,,,,,#...%. ",
    " .%..###,#######,######,####...%. ",
    " .%............................%. ",
    " .%!.........................o.%. ",
    " .%............................%. ",
    " .%%%%%%%%%%%%%..%%%%%%%%%%%%%%%. ",
    " ................................ ",
    " .##############################. ",
    " .#e,d,,,,,#d,e,,,,,#,A,s,,,,,,#. ",
    " .#h,,,,,,,#,,,,h,,,#,,,,,,,e,,#. ",
    " .#,,,,,,q,#,,,,,,v,#q,,,,,,,,d#. ",
    " .#,,,,,,,,#,,,,,,,,#,,,,,,,,,,#. ",
    " .####,########,#########,######. ",
    " ................................ ",
    " ......*........i..........T..... ",
    " ................................ ",
    " .#####,########,#########,#####. ",
    " .#,e,d,,,,,#,d,e,,,,#,e,d,,,,,#. ",
    " .#,,,,,,,h,#,,,,,,h,#,,,,,,,h,#. ",
    " .##############################. ",
    "                                  ",
  ],
  eastmere: [
    "                              ~~~~~~~ ",
    " .............................~~~~~~~ ",
    " .#######################.....~~~~~~~ ",
    " .#vq,,,,e,,#q,,,,v,,#qq#..!..~~~~~~~ ",
    " .#B,k,B,,,,#,S,k,,,,#,,#.....~~~~~~~ ",
    " .#,,,,,,,,d#,,,,,,,e#,,#=======F~~~~ ",
    " .#,,,,,,,,,#,,,,,,,,#,,#.....~~~~~~~ ",
    " .#####,########,######,#.....~~~~~~~ ",
    " ...........G.......o.........~~~~~~~ ",
    " ..................i..........~~~~~~~ ",
    " .#######################.....~~~~~~~ ",
    " .#e,dd,,#,,ee,,#,,d,,v,#.....~~~~~~~ ",
    " .#h,,,,,#,,,,h,#,,,,k,,#=======F~~~~ ",
    " .#,,,,q,#,v,,,,#,,,,,,q#.....~~~~~~~ ",
    " .#,,,,,,#,,,,,,#,,,,,,,#.....~~~~~~~ ",
    " .###,######,#######,####.....~~~~~~~ ",
    " .............................~~~~~~~ ",
    " ..........................*..~~~~~~~ ",
    " .####,#######,#####,####.....~~~~~~~ ",
    " .#e,,,,,,#d,,,,,#,e,,,,#=======F~~~~ ",
    " .#,,h,,,,#,,h,,,#,,,h,,#.....~~~~~~~ ",
    " .#,,,,,q,#,,,,,v#,,,,q,#.....~~~~~~~ ",
    " .#######################.....~~~~~~~ ",
    "                              ~~~~~~~ ",
  ],
  greenhollow: [
    "      T           T             ",
    " T          T           T       ",
    "  .....T.................T....  ",
    "  ............................T ",
    "  .#########.......########...  ",
    "  T#,,,,qv,#.......#,,,qv,#...  ",
    "  .#,B,k,,,#.......#,S,k,,#...  ",
    "  .#,,,,,,,#.......#,,,,,,#...  ",
    "  .####,####.......####,###...  ",
    "  ............................ T",
    "T ............................  ",
    "  ..........o......*..........  ",
    "  ............................  ",
    "  .........i..................  ",
    "  .####,###........####,####..  ",
    "  .#e,,,d,#........#e,,,,d,#..  ",
    "  .#,h,,,,#........#,A,s,h,#..T ",
    " T.#,,,,,,#........#,,,,,,,#..  ",
    "  .########........#########..  ",
    "  ............................  ",
    "            T           T       ",
    "      T           T             ",
  ],
  cragfoot: [
    "                            ",
    "                            ",
    "  ........................  ",
    "  .#########....#########.  ",
    "  .#,,,,,d,#....#,,,,,v,#.  ",
    "  .#,S,k,h,#....#,A,s,A,#.  ",
    "  .#,,,e,,,,....,,,,,,,,#.  ",
    "  .#,,,,,,,#....#,,,,,,,#.  ",
    "  .#########....#########.  ",
    "  ........................  ",
    "  %%%%%%%%%%%..%%%%%%%%%%%  ",
    "  ........................  ",
    "  .#########....#########.  ",
    "  .#,,,,qv,#....#,,,,,d,#.  ",
    "  .#,B,k,,,#....#,h,,,,,#.  ",
    "  .#,,,,,,,,....,,,,e,,,#.  ",
    "  .#,,,,,,,#....#,,,,,,,#.  ",
    "  .#########....#########.  ",
    "  ........................  ",
    "  %%%%%%%%%%%..%%%%%%%%%%%  ",
    "  ..........o.............  ",
    "  .####,###.....####,###..  ",
    "  .#e,,,d,#.....#e,,,d,#..  ",
    "  .#,h,,,,#.....#,h,k,,#..  ",
    "  .#,,,,,,#.....#,,,,,,#..  ",
    "  .########.....########..  ",
    "  ........................  ",
    "  %%%%%%%%%%%..%%%%%%%%%%%  ",
    "  ..........*....i........  ",
    "  .....G.............!....  ",
    "                            ",
    "                            ",
  ],
  fenmarch: [
    "                ===                 ",
    "                ===                 ",
    "  .#########....===...#########...  ",
    "  .#vB,kqB,#....===...#,qS,kv,#...  ",
    "  .#,,,,,,,#....===...#,,,,,,,#...  ",
    "  .####,####....===...####,####...  ",
    "  .==============================.  ",
    "  ............o.===.*.............  ",
    "  .####,###.....===....####,###...  ",
    "  f#e,,,d,#.....===....#e,,,d,#...f ",
    "  f#,h,,,,#.....===....#,h,,,,#...f ",
    "  .#,,,,,,#.....===....#,,,,,,#...  ",
    "  .########.....===....########...  ",
    "  .==============================.  ",
    "  ............i.===.G.............  ",
    "  .####,####....===....####,###...  ",
    "  f#,,,,,v,#....===....#e,,,d,#...f ",
    "  f#,A,s,,,#....===....#,h,k,,#...f ",
    "  .#,,,,,,,#....===....#,,,,,,#...  ",
    "  .#########....===....########...  ",
    "                ===                 ",
    "                ===                 ",
  ],
  norwick: [
    "%%%%%%%%%%%%%%%%..%%%%%%%%%%%%%%%%",
    "%.%..............................%",
    "%.%......................!.......%",
    "%.%.##########......##########...%",
    "%.%.#,,,,,qv,#......#,,,,,,d,#...%",
    "%.%.#,,B,k,,,#......#,A,s,h,,#...%",
    "%.%.#,,,,,,,,#......#,e,,,,,,#...%",
    "%.%.#,,,,,,,,#......#,,,,,,,,#...%",
    "%.%.#####,####......#####,####...%",
    "%.%..............................%",
    "%.%.G.........G..............G...%",
    ".................................%",
    "..............o......*...........%",
    "%.%.G.W.......G..............G...%",
    "%.%...........i..................%",
    "%.%.####,####.......#####,####...%",
    "%.%.#e,,,,d,#.......#e,,,,,d,#...%",
    "%.%.#,h,,,,,#.......#,h,,,k,,#...%",
    "%.%.#,,,,,,,#.......#,,,,,,,,#...%",
    "%.%.#########.......##########...%",
    "%.%....G....G.......G............%",
    "%.%......G.............G..G......%",
    "%.%..............................%",
    "%%%%%%%%%%%%%%%%..%%%%%%%%%%%%%%%%",
  ],
  hollybarrow: [
    "                                    ",
    " \"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"..\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\" ",
    " \"................................\" ",
    " \".#########......................\" ",
    " \".#,,,,qv,#........T.TTT.T.TTT...\" ",
    " \".#,,B,k,,#......................\" ",
    " \".#,,,,,,,#........T.TTT.T.TTT...\" ",
    " \".#,,,,,,,#......................\" ",
    " \".####,####..........T.T.T.T.T...\" ",
    " \".................p.p.p.p.p.p.p..\" ",
    " \"...T.............p.p.p.p.p.p.p..\" ",
    " \"................................\" ",
    " \"............o.....*.............\" ",
    " \"................................\" ",
    " \"............i...................\" ",
    " \".####,###...........####,###....\" ",
    " \".#e,,,d,#...........#e,,,d,#....\" ",
    " \".#,h,,,,#...........#,h,,,,#....\" ",
    " \".#,,,,,,#...........#,,,,,,#....\" ",
    " \".########...........########....\" ",
    " \"................................\" ",
    " \".p.....p.p.p......p.p.p.p.p.p...\" ",
    " \"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"..\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\" ",
    "                                    ",
  ],
}
const PLAN_ROOMS4 = {"anchor":[[4,4,10,5],[4,12,7,3],[4,29,5,3],[13,29,5,3],[16,12,6,3],[19,4,6,4],[21,29,4,3],[30,4,8,4],[30,12,7,3],[34,25,13,6],[43,4,5,3],[43,11,5,3]],"millbrook":[[4,3,5,3],[4,13,5,3],[13,3,6,3],[13,13,6,3],[23,3,5,3],[23,13,5,3],[32,3,5,3],[32,13,5,3]],"oxenford":[[4,3,8,4],[4,18,6,3],[4,24,5,2],[23,3,7,4],[23,18,6,3],[23,24,5,2]],"thornbury":[[4,18,6,3],[4,24,6,3],[7,4,21,6],[22,18,7,3],[22,24,6,3]],"hollybarrow":[[4,4,7,4],[4,16,6,3],[23,16,6,3]],"eastmere":[[4,3,7,4],[4,17,7,3],[14,3,6,4],[15,17,5,3]],"greenhollow":[[4,5,7,3],[4,15,6,3],[20,5,6,3],[20,15,7,3]],"cragfoot":[[4,4,7,4],[4,13,7,4],[4,22,6,3],[17,4,7,4],[17,13,7,4],[17,22,6,3]],"fenmarch":[[4,3,7,2],[4,9,6,3],[4,16,7,3],[23,3,7,2],[24,9,6,3],[24,16,6,3]],"norwick":[[5,4,8,4],[5,16,7,3],[21,4,8,4],[21,16,8,3]]}
const OPEN4 = new Set(['.','@',','])
const LEG4 = {"%":"wall","#":"wall","\"":"hedge","f":"fence","B":"bank","S":"store","A":"anvil","s":"smith","k":"keeper","G":"guard","h":"hearth","o":"well","*":"campfire","i":"signpost","W":"waystone","!":"landmark","p":"plot","T":"tree","n":"rock","F":"fishing-spot"}

// checkPlanConnected + seatDrawnTown, mirrored exactly.
function planConnected4(rows, cx, cy) {
  const pw = rows[0].length, ph = rows.length
  const x0 = cx - (pw >> 1), y0 = cy - (ph >> 1)
  const at = (x, y) => { const rx = x - x0, ry = y - y0
    return (rx < 0 || ry < 0 || rx >= pw || ry >= ph) ? null : rows[ry][rx] }
  const openAt = (x, y) => { const ch = at(x, y)
    if (ch === null) return false
    if (ch === '=') return true            // decking is footing
    if (isWater4(x, y)) return false
    return OPEN4.has(ch) || ch === ' ' }
  let sx = cx, sy = cy
  if (!openAt(sx, sy)) {
    outer: for (let r = 1; r < Math.max(pw, ph); r++)
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue
        if (openAt(cx + dx, cy + dy)) { sx = cx + dx; sy = cy + dy; break outer } }
  }
  const seen = new Set([sx + ',' + sy]); const q = [[sx, sy]]; let h = 0
  while (h < q.length) { const [x, y] = q[h++]
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = x + dx, ny = y + dy, k = nx + ',' + ny
      if (seen.has(k) || !openAt(nx, ny)) continue
      seen.add(k); q.push([nx, ny]) } }
  const ESS = new Set(['bank','store','anvil','smith','keeper','well','waystone'])
  for (let ry = 0; ry < ph; ry++) for (let rx = 0; rx < pw; rx++) {
    const ch = rows[ry][rx]
    if (OPEN4.has(ch) || ch === ' ' || ch === '=' || ch === '~' || !(ch in LEG4)) continue
    if (!ESS.has(LEG4[ch])) continue
    const x = x0 + rx, y = y0 + ry
    if (isWater4(x, y)) continue
    if (![[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => seen.has((x+dx)+','+(y+dy)))) return false }
  return true
}
const _seat4 = {}
function seatDrawnTown4(tag, nomX, nomY) {
  if (_seat4[tag]) return _seat4[tag]
  const rows = PLANS4[tag], pw = rows[0].length, ph = rows.length
  const dryOk = (cx, cy) => {
    const x0 = cx - (pw >> 1), y0 = cy - (ph >> 1)
    for (let ry = 0; ry < ph; ry++) for (let rx = 0; rx < pw; rx++) {
      const ch = rows[ry][rx]
      if (ch === ' ' || ch === '=') continue
      const x = x0 + rx, y = y0 + ry
      if (x < 3 || y < 3 || x >= W - 3 || y >= H - 3) return false
      const wet = isWater4(x, y)
      if (ch === '~' || ch === 'F') { if (!wet) return false }
      else if (wet) return false
      else if (onRidge4(x, y) || onBarrow4(x, y)) return false }
    return true }
  let out = null
  spiral: for (let rad = 0; rad < 110; rad++)
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
      const cx = nomX + dx, cy = nomY + dy
      if (dryOk(cx, cy) && planConnected4(rows, cx, cy)) { out = { x: cx, y: cy }; break spiral } }
  if (!out) spiral2: for (let rad = 0; rad < 110; rad++)
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
      if (dryOk(nomX + dx, nomY + dy)) { out = { x: nomX + dx, y: nomY + dy }; break spiral2 } }
  return (_seat4[tag] = out ?? { x: nomX, y: nomY })
}

let _ss4 = null
function settlementsE4() {
  if (_ss4) return _ss4
  const cx = Math.floor(W / 2), cy = Math.floor(H / 2)
  const mby = cy - 62, ey = emY4()
  const P = (t) => ({ w: PLANS4[t][0].length, h: PLANS4[t].length })
  const S = (t, x, y) => seatDrawnTown4(t, x, y)
  _ss4 = [
    { tag:'anchor',      name:'Anchor',      ...S('anchor', cx, cy),                                        ...P('anchor'),      ring:'shire' },
    { tag:'millbrook',   name:'Millbrook',   ...S('millbrook', riverX4(mby) + 16, mby),                     ...P('millbrook'),   ring:'shire' },
    { tag:'oxenford',    name:'Oxenford',    ...S('oxenford', cx - 104, cy + 40),                            ...P('oxenford'),    ring:'shire' },
    { tag:'thornbury',   name:'Thornbury',   ...S('thornbury', cx + 78, cy - 34),                           ...P('thornbury'),   ring:'shire' },
    { tag:'hollybarrow', name:'Hollybarrow', ...S('hollybarrow', cx - 96, cy - 52),                         ...P('hollybarrow'), ring:'shire' },
    { tag:'greenhollow', name:'Greenhollow', ...S('greenhollow', Math.round(W*0.42), Math.round(H*0.12)),   ...P('greenhollow'), ring:'frontier' },
    { tag:'cragfoot',    name:'Cragfoot',    ...S('cragfoot', Math.round(W*0.87), Math.round(H*0.44)),      ...P('cragfoot'),    ring:'frontier' },
    { tag:'eastmere',    name:'Eastmere',    ...S('eastmere', (bayShoreX4(ey) ?? Math.round(W*0.7)) - 14, ey), ...P('eastmere'),  ring:'frontier' },
    { tag:'fenmarch',    name:'Fenmarch',    ...S('fenmarch', riverX4(Math.round(H*0.83)) + 9, Math.round(H*0.83)), ...P('fenmarch'), ring:'frontier' },
    { tag:'norwick',     name:'Norwick',     ...S('norwick', brandX4(Math.round(H*0.47)) + 18, Math.round(H*0.47)), ...P('norwick'), ring:'frontier' },
  ]
  return _ss4
}
// ---- the router, ported whole ----
const BIOME_COST4 = { heartlands:10, downs:11, greenwood:15, moor:15, wilds:17, fens:20, crags:22 }

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
function routeCost4(x, y) {
  if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) return -1
  const b = biomeAtE4(x, y)
  if (b === 'sea') return -1
  if (isWater4(x, y)) return onBridge4(x, y) ? 10 : -1
  if (onBarrow4(x, y) || onRidge4(x, y)) return -1
  let c = BIOME_COST4[b] ?? 14
  const hm = handmadeAt(x, y)                       // and the things somebody put here
  if (hm) c += HANDMADE_COST[hm.kind] ?? 40
  c += goingAt(goingSalt(GSEED), x, y)              // the going, patch by patch
  if (isWater4(x+1,y) || isWater4(x-1,y) || isWater4(x,y+1) || isWater4(x,y-1)) c += 6
  return c
}
let _cost4 = null
function costField4() {
  if (_cost4) return _cost4
  const f = new Int16Array(W * H)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) f[y * W + x] = routeCost4(x, y)
  return (_cost4 = f)
}
const DIRS4 = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]
function hPush4(h, v) { h.push(v); let i = h.length - 1
  while (i > 0) { const p = (i-1)>>1; if (h[p] <= h[i]) break; const t = h[p]; h[p] = h[i]; h[i] = t; i = p } }
function hPop4(h) { const top = h[0], last = h.pop()
  if (h.length) { h[0] = last; let i = 0
    for (;;) { const l=i*2+1, r=l+1; let m=i
      if (l < h.length && h[l] < h[m]) m = l
      if (r < h.length && h[r] < h[m]) m = r
      if (m === i) break
      const t = h[m]; h[m] = h[i]; h[i] = t; i = m } }
  return top }
function routePath4(ax, ay, bx, by, laid) {
  const N = W * H, f = costField4()
  const dist = new Int32Array(N).fill(0x7fffffff), prev = new Int32Array(N).fill(-1), done = new Uint8Array(N)
  const si = ay * W + ax, ti = by * W + bx
  if (f[si] < 0 || f[ti] < 0) return null
  const hEst = (x, y) => { const dx = x>bx?x-bx:bx-x, dy = y>by?y-by:by-y
    const lo = dx<dy?dx:dy, hi = dx<dy?dy:dx; return (hi-lo)*10 + lo*14 }
  const vx = bx-ax, vy = by-ay, L = Math.sqrt(vx*vx+vy*vy)
  const esalt = goingSalt(GSEED) ^ 0x9e37
  const offLine = (x, y) => { if (L < 1) return 0
    const cr = (x-ax)*vy - (y-ay)*vx; const a = cr<0?-cr:cr; return Math.floor(a/(L*14)) }
  dist[si] = 0
  const heap = [hEst(ax,ay) * 1048576 + si]
  let found = false
  while (heap.length) {
    const i = hPop4(heap) % 1048576
    if (done[i]) continue
    done[i] = 1
    if (i === ti) { found = true; break }
    const x = i % W, y = (i - x) / W, d0 = dist[i]
    for (const d of DIRS4) {
      const nx = x + d[0], ny = y + d[1]
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
      const ni = ny * W + nx
      if (done[ni]) continue
      const c = f[ni]; if (c < 0) continue
      // A ROAD WOULD RATHER GO ROUND THAN UP. Six per unit climbed, nothing
      // for level or downhill. Identical to the generator's rule: if these two
      // ever differ the windows draw roads the engine does not have.
      let step = (d[0] && d[1]) ? Math.round(c * 1.4) : c
      const up = elevAt(esalt, nx, ny) - elevAt(esalt, x, y)
      const climb = up > 0 ? up * 6 : 0
      // ROADS BRAID: two fifths of the cost on ground already road. Identical
      // to the generator, including the order the segments are laid in.
      if (laid && laid.has(nx + ',' + ny)) step = Math.round(step * 0.68)
      const nd = d0 + step + climb + offLine(nx, ny)
      if (nd < dist[ni]) { dist[ni] = nd; prev[ni] = i; hPush4(heap, (nd + hEst(nx,ny)) * 1048576 + ni) }
    }
  }
  if (!found) return null
  const out = []
  for (let i = ti; i !== -1; i = prev[i]) { const x = i % W; out.push([x, (i-x)/W]); if (i === si) break }
  return out.reverse()
}
// A junction placed by fixed offset lands in the river on some other seed.
// Mirrors worldgen-expanse4.seatPoint exactly.
function seatPoint4(x, y) {
  if (routeCost4(x, y) > 0) return { x, y }
  for (let rad = 1; rad < 60; rad++)
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
      if (routeCost4(x + dx, y + dy) > 0) return { x: x + dx, y: y + dy }
    }
  return { x, y }
}
let _roads4 = null

// A LANE THAT GOES NOWHERE. Identical to the generator's, including the salt
// and the order: the lanes are laid last, after the whole network, so they
// hang off it rather than becoming part of anyone's route.
function laneSeatsOf4(towns, salt) {
  const out = []
  for (let i = 0; i < towns.length; i++) {
    const t = towns[i]
    let h = (Math.imul(i + 1, 2654435761) + salt) | 0
    h = Math.imul(h ^ (h >>> 15), 2246822519) | 0
    h = (h ^ (h >>> 13)) >>> 0
    const n = (h & 1) + 1
    for (let k = 0; k < n; k++) {
      const hk = (Math.imul(h + k * 40503, 1597334677)) >>> 0
      const ang = (hk % 3600) / 3600 * Math.PI * 2
      const len = 16 + (hk >>> 12) % 26
      out.push({ from: t, x: Math.round(t.x + Math.cos(ang) * len), y: Math.round(t.y + Math.sin(ang) * len) })
    }
  }
  return out
}
function roadSet4() {
  if (_roads4) return _roads4
  const s = {}; for (const t of settlementsE4()) s[t.tag] = t
  const wm = seatPoint4(riverX4(confY4()) + 6, confY4() + 7)
  // bridges4 returns the crossings untagged, but in the generator's own order:
  // Highford, the Millbrook Bridge, the Watersmeet Bridge, Fenford, the
  // Oxenford. Index is the tag here, and a comment is the only thing keeping
  // them in step -- if bridgesOf ever reorders, this reorders with it.
  const bs = bridges4()
  const br0 = bs[0], br2 = bs[2]
  const [pa, pb] = passes4()
  const npass = { x: ridgeX4(pa), y: pa }, spass = { x: ridgeX4(pb), y: pb }
  const shrine = isles4()[0]
  const segs = [
    [s.anchor,s.millbrook],[s.millbrook,s.hollybarrow],[s.hollybarrow,s.oxenford],
    [s.oxenford,s.anchor],[s.anchor,s.thornbury],[s.thornbury,s.millbrook],
    // THROUGH THE PASS, NOT PAST IT -- and in exactly the generator's order,
    // because the braid discount makes the order part of the answer.
    // EACH ROAD CROSSES AT ITS OWN CROSSING -- Highford for Greenhollow, the
    // Watersmeet Bridge for Watersmeet. Same order as the generator, because
    // the braid discount makes the order part of the answer.
    [s.millbrook,br0],[br0,s.greenhollow],
    [s.thornbury,npass],[npass,s.cragfoot],
    [s.anchor,spass],[spass,s.eastmere],
    [s.oxenford,br2],[br2,wm],[wm,s.fenmarch],
    [s.eastmere,s.fenmarch],[s.cragfoot,s.eastmere],
    [s.oxenford,s.norwick],[s.hollybarrow,s.norwick],
  ]
  const set = new Set()
  for (const [a, b] of segs) {
    const p = routePath4(a.x, a.y, b.x, b.y, set)
    if (!p) continue
    for (const t of p) { set.add(t[0] + ',' + t[1]); set.add((t[0]+1) + ',' + t[1]) }
  }
  // and the lanes that join nothing
  for (const L2 of laneSeatsOf4(settlementsE4(), goingSalt(GSEED) ^ 0x5a17)) {
    const seat = seatPoint4(L2.x, L2.y)
    if (!seat) continue
    const p = routePath4(L2.from.x, L2.from.y, seat.x, seat.y, set)
    // A LANE IS SHORT BY DEFINITION. seatPoint snaps a destination to the
    // nearest walkable ground, and if the chosen point lands in water or on
    // the Ridge that snap can be a long way off -- one lane came out at a
    // hundred and sixty-two tiles, which is not a lane, it is a road to
    // somewhere with nothing at the end. Twice the intended length or it is
    // not laid at all.
    const want = Math.round(Math.hypot(L2.x - L2.from.x, L2.y - L2.from.y))
    if (!p || p.length < 8 || p.length > want * 2 + 10) continue
    for (const t of p) { set.add(t[0] + ',' + t[1]); set.add((t[0]+1) + ',' + t[1]) }
  }
  // the causeway is drawn, not routed: no router crosses open sea
  const a = s.eastmere, b = shrine
  const vx = b.x - a.x, vy = b.y - a.y, L = Math.sqrt(vx*vx + vy*vy)
  const steps = Math.ceil(L * 2)
  for (let k = 0; k <= steps; k++) {
    const t = k / steps
    const px = Math.round(a.x + vx*t), py = Math.round(a.y + vy*t)
    set.add(px + ',' + py); set.add((px+1) + ',' + py)
  }
  return (_roads4 = set)
}
// THE ROADS, AS A BITMAP.
//
// roadSet4 is a Set of "x,y" strings, so every road test built a string and
// hashed it -- and terrainOfE4 asks four times a tile. Twenty-five
// microseconds a tile, eleven seconds to lay the roads over the island.
//
// The Set stays: it is what the router fills and what everything else reads.
// This is only a second view of it, one byte a tile, built once the first time
// anyone asks and thrown away with the world.
let _roadBmp = null, _roadBmpFor = null
const onRoad4 = (x, y) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return roadSet4().has(x + ',' + y)
  const k = GSEED + ':' + W + 'x' + H
  if (_roadBmpFor !== k) {
    const set = roadSet4()
    _roadBmp = new Uint8Array(W * H)
    for (const key of set) {
      const c = key.indexOf(',')
      const rx = +key.slice(0, c), ry = +key.slice(c + 1)
      if (rx >= 0 && ry >= 0 && rx < W && ry < H) _roadBmp[ry * W + rx] = 1
    }
    _roadBmpFor = k
  }
  return _roadBmp[y * W + x] === 1
}
function fordE4(x, y) {
  if (onBridge4(x, y)) return true
  for (const s of settlementsE4())
    if (Math.abs(x - s.x) <= (s.w >> 1) && Math.abs(y - s.y) <= (s.h >> 1) && (x === s.x || y === s.y)) return true
  // the causeway and the quays are decking: if a road is drawn over water,
  // it is because something was built there
  if (isWater4(x, y) && onRoad4(x, y)) return true
  return false
}
// Anchor's plaza, mirroring worldgen-expanse4.spawnDry. The window draws
// the arrival point, so it has to agree about where it is.
function spawnDry4() {
  const a = settlementsE4().find(s => s.tag === 'anchor')
  const rows = PLANS4.anchor, pw = rows[0].length, ph = rows.length
  const x0 = a.x - (pw >> 1), y0 = a.y - (ph >> 1)
  const openHere = (x, y) => {
    const rx = x - x0, ry = y - y0
    if (rx < 0 || ry < 0 || rx >= pw || ry >= ph) return false
    const ch = rows[ry][rx]
    if (ch !== '.' && ch !== '@') return false
    return !isWater4(x, y) && !onRidge4(x, y) && !onBarrow4(x, y)
  }
  for (let rad = 0; rad < Math.max(pw, ph); rad++)
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
      if (openHere(a.x + dx, a.y + dy)) return { x: a.x + dx, y: a.y + dy }
    }
  return { x: a.x, y: a.y }
}

// RAMPART OR BUILDING? The state cannot say -- the engine allows a kind only
// on a landmark, and rightly, since the difference is purely visual and the
// geography hash should not care about it. But the window carries the plans
// and the seats, so it can look the answer up: '%' in a town's drawing is a
// rampart, '#' is a building wall. Everything outside a plan -- brandstones,
// the Delving's quarry, a ruin on the moor -- is bare stone.
// A 'U' in a plan is a well node the window paints as a fountain. Same
// lookup as the ramparts, same reason: the difference is visual, so it must
// not touch the state.
const _fountCache = new Map()
function isFountain4(x, y) {
  const k = x + ',' + y
  const hit = _fountCache.get(k)
  if (hit !== undefined) return hit
  let out = false
  for (const t of settlementsE4()) {
    const rows = PLANS4[t.tag]; if (!rows) continue
    const pw = rows[0].length, ph = rows.length
    const rx = x - (t.x - (pw >> 1)), ry = y - (t.y - (ph >> 1))
    if (rx < 0 || ry < 0 || rx >= pw || ry >= ph) continue
    out = rows[ry][rx] === 'U'
    break
  }
  _fountCache.set(k, out)
  return out
}
// Where are the walls? Rebuilt only when the tick changes, because the draw
// loop asks four times per wall and a full node scan per query would be
// thousands of scans a frame.
let _wallSet = null, _wallTick = -1
function wallAt(st, x, y) {
  if (!st || !st.nodes) return false
  if (_wallTick !== st.tick || _wallSet === null) {
    _wallSet = new Set()
    for (const k in st.nodes) { const q = st.nodes[k]; if (q.type === 'wall') _wallSet.add(q.x + ',' + q.y) }
    _wallTick = st.tick
  }
  return _wallSet.has(x + ',' + y)
}
// WHICH DOOR IS THE BANK'S? From outside, a bank and a cottage are both a
// brown room -- you only learn which is which by standing on the booth. Real
// shops hang a sign, so: for every room a plan lays, if a bank or a counter
// stands inside it, find the doorway and mark it.
//
// The door is the one tile of the room's wall ring that is not a wall.
// Built ONCE per tick as a map from the shop tile to its door, rather than
// scanning every node for every room of every town -- that first version was
// 367ms a call, which is most of a tick spent deciding where to hang a sign.
let _signs = null, _signTick = -1
function shopDoors4(st) {
  if (!st || !st.nodes) return _signs ?? new Map()
  if (_signTick === st.tick && _signs) return _signs
  const out = new Map()
  // one pass over the nodes, bucketed by town
  const shops = []
  for (const k in st.nodes) {
    const q = st.nodes[k]
    if (q.type === 'bank' || q.type === 'store') shops.push(q)
  }
  for (const t of settlementsE4()) {
    const rows = PLANS4[t.tag], rects = PLAN_ROOMS4[t.tag]
    if (!rows || !rects) continue
    const pw = rows[0].length, ph = rows.length
    const ox = t.x - (pw >> 1), oy = t.y - (ph >> 1)
    const mine = shops.filter(q => Math.abs(q.x - t.x) <= (pw >> 1) && Math.abs(q.y - t.y) <= (ph >> 1))
    if (!mine.length) continue
    for (const [rx, ry, rw, rh] of rects) {
      const inside = mine.filter(q => {
        const px = q.x - ox, py = q.y - oy
        return px >= rx && py >= ry && px < rx + rw && py < ry + rh
      })
      if (!inside.length) continue
      const kind = inside[0].type
      // walk the wall ring; the gap is the way in
      const ring = []
      for (let x = rx - 1; x <= rx + rw; x++) { ring.push([x, ry - 1]); ring.push([x, ry + rh]) }
      for (let y = ry; y < ry + rh; y++) { ring.push([rx - 1, y]); ring.push([rx + rw, y]) }
      let door = null
      for (const [px, py] of ring) {
        if (px < 0 || py < 0 || px >= pw || py >= ph) continue
        if (rows[py][px] === '#') continue
        door = { x: ox + px, y: oy + py, kind }
        break
      }
      if (door) for (const q of inside) out.set(q.x + ',' + q.y, door)
    }
  }
  _signTick = st.tick; _signs = out
  return out
}
// A keeper's trade. The id carries it where the generator wrote one; where
// the plans placed the keeper it has none, so read the room: whatever this
// person is standing beside is what they do.
const _roleCache = new Map()
function keeperRole4(st, id, n) {
  if (id === 'kpr-wizard-oberon') return 'wizard'
  if (id.includes('lantern')) return 'inn'
  if (id.includes('shep') || id.includes('fold')) return 'shep'
  if (id.includes('sawyer') || id.includes('camp')) return 'forest'
  if (id.includes('eel') || id.includes('sheds')) return 'fisher'
  if (id.includes('delve') || id.includes('high')) return 'smith'
  if (id.includes('bank')) return 'clerk'
  const ck = _roleCache.get(id)
  if (ck) return ck
  let role = 'town'
  if (st && st.nodes) {
    const near = {}
    for (const k in st.nodes) {
      const q = st.nodes[k]
      if (Math.abs(q.x - n.x) > 2 || Math.abs(q.y - n.y) > 2) continue
      near[q.type] = true
    }
    role = near.bank ? 'clerk' : near.store ? 'shop' : near.anvil ? 'smith'
         : near.hearth ? 'town' : 'town'
  }
  _roleCache.set(id, role)
  return role
}
// the eighteen nouns added at the fourth founding, which have their own art
const LM18 = new Set(['table','bed','shelf','barrel','crate','stump',
  'charcoal-clamp','log-pile','spoil-heap','cut-face','bone-pile',
  'crude-hearth','gibbet','cart','haystack','hurdle','eel-rack','sunken-wall',
  // the thirteen added when the world stopped repeating itself: four that
  // were always here wearing 'standing-stone' because nothing else had a
  // name for them, and nine new places
  'skep','cairn','boundary-stone','skull-pile',
  'scorched-ring','glass-stone','burnt-tree',
  'mill','milestone','scarecrow','barricade','siege-engine','cave-mouth'])
const _rampCache = new Map()
function isRampart4(x, y) {
  const k = x + ',' + y
  const hit = _rampCache.get(k)
  if (hit !== undefined) return hit
  let out = false
  for (const t of settlementsE4()) {
    const rows = PLANS4[t.tag]; if (!rows) continue
    const pw = rows[0].length, ph = rows.length
    const rx = x - (t.x - (pw >> 1)), ry = y - (t.y - (ph >> 1))
    if (rx < 0 || ry < 0 || rx >= pw || ry >= ph) continue
    out = rows[ry][rx] === '%'
    break
  }
  _rampCache.set(k, out)
  return out
}

// A TOWN IS ITS DRAWING, NOT ITS PLOT -- identical to groundKindAt's rule.
// Only Anchor and Norwick are drawn as closed rings; the other eight are
// clusters, and paving their whole rect put a flagstone box round each.
const _TOWN_OPEN4 = new Set([' ', '.'])
function townPaved4(rows, rx, ry) {
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const c = rows[ry + dy]?.[rx + dx]
    if (c !== undefined && !_TOWN_OPEN4.has(c)) return true
  }
  return false
}
function terrainOfE4(x, y) {
  if (inSea4(x, y)) return fordE4(x, y) ? 'bridge' : 'sea'
  if (inRiver4(x, y) || inLake4(x, y)) return fordE4(x, y) ? 'bridge' : 'river'
  // A ROAD MUST NOT BEND AROUND NOTHING. The placed things are ground you can
  // see and stand in -- a copse, a mire, a scree fan -- and not an invisible
  // cost that makes a road look drunk. Water and town paving still win: a
  // copse does not grow in the river, and nobody planted one in a market.
  {
    const hm = handmadeAt(x, y)
    if (hm && !onRoad4(x, y)) {
      const inTown = settlementsE4().some((t) =>
        Math.abs(x - t.x) < (t.w >> 1) && Math.abs(y - t.y) < (t.h >> 1))
      if (!inTown) return hm.kind === 'copse' ? 'forest'
                        : hm.kind === 'mire' ? 'fens' : 'scree'
    }
  }
  for (const t of settlementsE4()) {
    // STRICTLY inside, matching groundKindAt's `x > r.x0 && x < r.x1`. The
    // inclusive test claimed the rampart line itself as town ground and
    // painted seven tiles of trail as cobble.
    if (Math.abs(x - t.x) >= (t.w >> 1) || Math.abs(y - t.y) >= (t.h >> 1)) continue
    // INDOORS? Ask the drawing, exactly as groundKindAt does. ',' is a room's
    // floor and must not be painted as the street it opens onto.
    const rows = PLANS4[t.tag]
    if (rows) {
      const pw = rows[0].length, ph = rows.length
      const rx = x - (t.x - (pw >> 1)), ry = y - (t.y - (ph >> 1))
      // ENCLOSURE, not the character: a counter, a hearth and the clerk all
      // stand on the same floor as the empty tile beside them
      for (const [rxx, ryy, rww, rhh] of (PLAN_ROOMS4[t.tag] ?? []))
        if (rx >= rxx && ry >= ryy && rx < rxx + rww && ry < ryy + rhh) return 'floor'
      // and the paving reaches only as far as the town does
      if (!townPaved4(rows, rx, ry)) return onRoad4(x, y) ? 'trail' : biomeAtE4(x, y)
    }
    // NOT EVERY TOWN IS PAVED: a farm and a clearing keep their own ground
    if (t.tag === 'hollybarrow' || t.tag === 'greenhollow')
      return onRoad4(x, y) ? 'trail' : biomeAtE4(x, y)
    return onRoad4(x, y) ? 'cobble' : 'flag'
  }
  if (onRidge4(x, y)) return onRoad4(x, y) ? 'gravel' : 'mountain'
  if (onBarrow4(x, y)) return onRoad4(x, y) ? 'gravel' : 'mountain'
  if (onRoad4(x, y)) {
    for (const t of settlementsE4()) if (Math.max(Math.abs(x - t.x), Math.abs(y - t.y)) <= 20) return 'cobble'
    if (onRidge4(x-1,y) || onRidge4(x+1,y) || onBarrow4(x,y)) return 'gravel'
    // the road takes its country's colour (mirrors groundKindAt)
    const rb = biomeAtE4(x, y)
    if (rb === 'crags') return 'gravel'
    if (rb === 'downs') return 'chalk'
    if (rb === 'moor')  return 'peat'
    if (rb === 'fens')  return 'causey'
    return 'trail'
  }
  if (isWater4(x+1,y) || isWater4(x-1,y) || isWater4(x,y+1) || isWater4(x,y-1)) return 'sand'
  return biomeAtE4(x, y)
}
// ---- the locales: names smaller than a country ----
const LOCALES4 = [
  ['Anchor Vale',0.50,0.50,46,30],['Watersmeet',null,null,30,20,'watersmeet'],
  ['the Barrow',null,null,34,21,'barrow'],['Oxenlea',0.37,0.58,32,22],
  ['Thornvale',0.62,0.42,30,20],['the Deepwood',0.52,0.07,54,22],
  ['the Kingswood',0.68,0.14,40,20],['Hollybarrow Chase',0.36,0.16,34,18],
  ['the High Delving',0.81,0.38,30,20],['the Sentinel Screes',0.86,0.55,30,20],
  ['Cragfoot Scar',0.90,0.28,28,18],['the Sheepfolds',0.72,0.71,30,18],
  ['Whitechalk',0.80,0.78,32,18],['Eelmarsh',0.48,0.85,36,18],
  ['the Fen Mouth',0.58,0.90,30,16],['Bleakfell',0.29,0.15,34,20],
  ['Ninestone Moor',0.38,0.26,30,18],["Deadman's Reach",0.12,0.30,38,26],
  ['the Boneyard',0.09,0.62,34,24],
]
const COUNTRY_NAMES4 = { sea:'the Sea', wilds:'the Wilds', heartlands:'the Heartlands',
  greenwood:'the Greenwood', crags:'the Crags', fens:'the Fens', downs:'the Downs', moor:'the Moor' }
// A locale seats itself ashore, exactly as the generator does: an ellipse
// centred on a canvas fraction can sit in open water, and five of them did.
// The mirror has to run the same search or it names places the server does
// not have -- and a nameplate that disagrees is a window telling a citizen
// they are somewhere they are not.
const _loc4 = {}
function localeCentre4(L) {
  if (L[5] === 'barrow') return barrowC4()
  // the Watersmeet locale hangs off the JUNCTION, which now seats itself;
  // leaving the old raw offset here put the name a few tiles from where the
  // server puts it, and a locale boundary a few tiles out renames a strip
  // of country
  if (L[5] === 'watersmeet') return seatPoint4(riverX4(confY4()) + 6, confY4() + 7)
  if (_loc4[L[0]]) return _loc4[L[0]]
  const nx = Math.round(L[1] * W), ny = Math.round(L[2] * H), rx = L[3], ry = L[4]
  const land = (cx, cy) => {
    let n = 0
    for (let dy = -ry; dy <= ry; dy += 3) for (let dx = -rx; dx <= rx; dx += 3) {
      const u = dx / rx, v = dy / ry
      if (u * u + v * v > 1) continue
      const x = cx + dx, y = cy + dy
      if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) continue
      if (!inSea4(x, y)) n++
    }
    return n
  }
  let best = { x: nx, y: ny }, bestN = land(nx, ny)
  for (let rad = 2; rad <= 70 && bestN < 40; rad += 2)
    for (let dy = -rad; dy <= rad; dy += 2) for (let dx = -rad; dx <= rad; dx += 2) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
      const n = land(nx + dx, ny + dy)
      if (n > bestN) { bestN = n; best = { x: nx + dx, y: ny + dy } }
    }
  return (_loc4[L[0]] = best)
}
function localeAt4(x, y) {
  let best = null, bestArea = Infinity
  for (const L of LOCALES4) {
    const c = localeCentre4(L)
    const cx = c.x, cy = c.y
    const dx = (x - cx) / L[3], dy = (y - cy) / L[4]
    if (dx * dx + dy * dy > 1) continue
    const a = L[3] * L[4]
    if (a < bestArea) { bestArea = a; best = L[0] }
  }
  return best ?? (COUNTRY_NAMES4[biomeAtE4(x, y)] ?? null)
}





























function terrainOfE(x, y) {
  if (IS_EXPANSE4()) return terrainOfE4(x, y)
  if (GEN === 'interval-expanse-v3') return terrainOfE3(x, y)
  if (inSeaE(x, y)) return fordE(x, y) ? 'bridge' : 'sea'
  // the fords, mirrored from the truth: the road pays for its
  // crossings, and every town's main street crosses on pilings. These
  // return 'bridge', so buildBridges erects a real deck over each.
  if (isWaterE(x, y)) {
    if (onRoadE(x, y)) return 'bridge'
    for (const st of ssE()) {
      const x0 = st.x - (st.w >> 1), x1 = st.x + (st.w >> 1)
      const y0 = st.y - (st.h >> 1), y1 = st.y + (st.h >> 1)
      if (x >= x0 && x <= x1 && y >= y0 && y <= y1 && (x === st.x || y === st.y)) return 'bridge'
    }
  }
  if (inPoolE(x, y) || Math.abs(x - riverXE(y)) <= 1) return 'river'
  for (const t2 of ssE()) if (Math.abs(x - t2.x) <= (t2.w >> 1) && Math.abs(y - t2.y) <= (t2.h >> 1)) return 'cobble'
  if (onRoadE(x, y)) return 'trail'
  return biomeAtE(x, y)
}
// ---- the countries by their names, mirrored from /play (spec 9d): a
// region is a pure function of the world, identical in every window, so
// "meet me at the fens edge" means one place to everyone. ----

// ---- the keepers' names (v0.79): mirrored from worldgen keeperName ,
// same SHA-256, same list, precomputed once at boot, identical in every
// window. Maud is Maud everywhere, and no byte of state stores her. ----
const KEEPER_NAMES = ['Maud', 'Aldric', 'Bess', 'Corwin', 'Delia', 'Edmund', 'Ffion', 'Gareth',
  'Hild', 'Ivo', 'Joan', 'Kemp', 'Lettice', 'Miles', 'Nell', 'Osric', 'Peronel', 'Quill',
  'Rosamund', 'Sim', 'Tilda', 'Ulric', 'Verity', 'Wat', 'Ysolt', 'Zachary']
const KN = {}
;(async () => {
  try {
    const tags = settlementsE3().map(t => t.tag ?? t.name?.toLowerCase())
    for (const [tag2, role2] of [['hollybarrow', 'farm'], ['sawyer', 'camp'], ['high', 'delve'], ['eel', 'sheds'], ['lantern', 'inn']]) {
      const d2 = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('keeper|' + tag2 + '|' + role2))
      KN[role2 + '|' + tag2] = KEEPER_NAMES[new Uint8Array(d2)[0] % KEEPER_NAMES.length]
    }
    for (const tag of tags) for (const role of ['bank', 'store', 'store2']) {
      const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('keeper|' + tag + '|' + role))
      KN[tag + '|' + role] = KEEPER_NAMES[new Uint8Array(d)[0] % KEEPER_NAMES.length]
    }
  } catch {}
})()
const kName = (tag, role) => role === 'wizard' ? 'Oberon' : (KN[tag + '|' + role] ?? 'the keeper')
// THE WORLD NAMES THEM NOW. This table mirrored worldgen's keeperName() and
// stopped matching the moment the towns were hand-drawn -- forty-five
// keepers, every one of them "the keeper". A name is part of who stands
// there, so it lives on the node and the window only reads it. kFromId
// remains as the fallback for a world founded before names existed.
const kFromId = (id) => { // 'kpr-store2-anchor' / 'store-anchor' / 'bank-anchor'
  const m = /^(?:kpr-)?(bank|store2|store|farm|camp|delve|sheds|inn|wizard)-(.+)$/.exec(id ?? '')
  return m ? kName(m[2], m[1]) : 'the keeper'
}
const REGION_NAMES = { sea: 'the Sea', greenwood: 'the Greenwood', crags: 'the Crags', fens: 'the Fens',
  wilds: 'the Wilds', meadow: 'the Heartlands', heartlands: 'the Heartlands',
  downs: 'the Downs', moor: 'the Moor' }
const SETTLEMENT_NAMES = ['Anchor', 'Greenhollow', 'Millbrook', 'Cragfoot', 'Eastmere', 'Fenmarch', 'Norwick']
const CLASSIC_NAMES = { wilds: 'the Wilds', cave: 'the Deep', scree: 'the Scree',
  mountain: 'the Mountains', sea: 'the Sea', bridge: 'the Bridge',
  cobble: 'the City', plaza: 'the Market', flag: 'the Market', gravel: 'the Pass',
  sand: 'the Shore', trail: 'the Road', meadow: 'the Meadows' }
function regionNameAt(x, y) {
  try {
    if (!GEN.startsWith('interval-expanse-')) return CLASSIC_NAMES[terrainOf(x, y)] ?? ''
    const ss = ssE()
    for (let i = 0; i < ss.length; i++) {
      const t = ss[i]
      if (Math.abs(x - t.x) <= (t.w >> 1) && Math.abs(y - t.y) <= (t.h >> 1))
        return t.name ?? SETTLEMENT_NAMES[i] ?? 'a settlement'
    }
    if (IS_EXPANSE4()) return localeAt4(x, y) ?? REGION_NAMES[biomeAtE4(x, y)] ?? ''
    return REGION_NAMES[biomeAtE(x, y)] ?? ''
  } catch { return '' } // a nameplate must never stop the world drawing
}
// <<< EXPANSE TERRAIN MIRROR
const inWildsC = (x, y) => x >= 1 && x <= 34 && y >= 1 && y <= 22
function riverXC(y) { const cx2 = Math.floor(W / 2)
  return cx2 + 22 + Math.round(Math.sin(y / 9) * 7) + (tileHash(0, y, 11) % 3) - 1 }
function terrainOf(x, y) {
  // EVERY expanse founding goes to the expanse, not just the first one.
  // This read `GEN === 'interval-expanse-v1'`, so a v2, v3, v4 or v5 world --
  // which is every world founded since -- fell through to the classic
  // generator below and got a completely different island. terrainOfE is
  // itself a dispatcher over the four later foundings, so one prefix test is
  // the whole of the correct answer.
  if (GEN.startsWith('interval-expanse-')) return terrainOfE(x, y)
  const ty = Math.floor(H / 2), cx2 = Math.floor(W / 2), cy0 = 2, cy1 = 10
  if (x >= W - 4) return 'sea'
  if (inWildsC(x, y)) return 'wilds'
  if (x >= W - 30 && x <= W - 10 && y >= 5 && y <= 16) return 'cave'
  if (x >= W - 46 && y <= 26) return 'scree'
  if (y <= 8 && (x < cx2 - 10 || x > cx2 + 10)) return 'mountain'
  if (x >= cx2 - 8 && x <= cx2 + 8 && y >= cy0 && y <= cy1) return 'cobble'
  const lakeX = cx2 - 10, lakeY = H - 16, mbX = W - 22, mbY = H - 14
  if (x >= lakeX + 5 && x <= lakeX + 14 && y >= lakeY - 9 && y <= lakeY - 2) return 'plaza'
  if (Math.abs(x - mbX) <= 6 && Math.abs(y - mbY) <= 6) return 'plaza'
  const road = (Math.abs(x - cx2) <= (tileHash(0, y, 3) % 2) && y > cy1 && y < ty)
    || (Math.abs(x - cx2) <= (tileHash(0, y, 4) % 2) && y > ty && y < lakeY - 4)
    || Math.abs(y - ty) <= (tileHash(x, 0, 3) % 2)
  if (road) {
    if (Math.abs(x - riverXC(y)) <= 2 && y >= 6 && y <= lakeY - 4) return 'bridge'
    return 'trail'
  }
  if ((x <= 14 || x >= W - 16) && Math.abs(y - ty) <= 4) return 'plaza'
  return 'meadow'
}

// The surface every window is allowed to ask about. Anything not here is
// this file's own business and may change without a window noticing.
export {
  terrainOf,          // the one every window actually calls
  terrainOfE, terrainOfE3, terrainOfE4,
  isWaterE, inSeaE, inPoolE, riverXE,
  biomeAtE, onRoadE, fordE,
  settlementsE, regionNameAt, localeAt4,
  LM18,               // the landmarks with bespoke art (31 nouns, and counting)
}
