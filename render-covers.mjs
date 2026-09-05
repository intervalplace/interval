#!/usr/bin/env node
// Render one cover per track: the island, with that track's region lit and
// everything else dimmed.
//
// The terrain is not reimplemented here. It is SLICED OUT of window-web.html
// and run as-is, so this cannot drift from what the window draws. If the
// generator changes, re-run and the covers change with it.
//
//   node render-covers.mjs [path/to/window-web.html] [outdir]

import fs from 'node:fs'
import vm from 'node:vm'
import zlib from 'node:zlib'

const SRC = process.argv[2] ?? 'window-web.html'
const OUT = process.argv[3] ?? 'covers'
const html = fs.readFileSync(SRC, 'utf8')

// ---- slice: from `let W = 192` up to just before the DOM work starts -------
// from the world dimensions down to the end of terrainOf, which sits after
// regionNameAt in the file. ICON_CV is the first thing past it that needs a
// canvas, so it is the stopping point.
const a = html.indexOf('let W = 192, H = 96')
const b = html.indexOf('const ICON_CV = {}')
if (a < 0 || b < 0) throw new Error('anchors not found; has window-web.html moved?')
let code = html.slice(a, b)

// ---- the naming bug -------------------------------------------------------
// regionNameAt names expanse regions with biomeAtE, which is the v1 function:
// five outputs, no moor, no downs. terrainOfE dispatches to v6/v7 correctly;
// this never got the same fix, so on expanse7 the ground is drawn by one
// generator and named by another. Patch it here so the covers are true, and
// see apply-region-music.mjs edit 5 for the same fix in the window itself.
const BAD = "    return REGION_NAMES[biomeAtE(x, y)] ?? ''"
if (!code.includes(BAD)) throw new Error('regionNameAt has changed; re-check the fix')
code = code.replace(BAD,
  "    if (GEN === 'interval-expanse-v6' || GEN === 'interval-expanse-v7') return REGION_NAMES[biomeAt6(x, y)] ?? ''\n" + BAD)

// a few browser names the pure terrain code brushes against
// enough of a 2d context that top-level canvas setup does not throw. Nothing
// here is drawn into -- the terrain functions are pure, and the covers are
// rasterised by hand further down.
const stubCtx = () => new Proxy({}, { get: () => () => stubCtx() })

const sandbox = {
  console,
  performance: { now: () => Date.now() },
  localStorage: { getItem: () => null, setItem: () => {} },
  document: {
    createElement: () => ({ getContext: () => stubCtx(), width: 0, height: 0 }),
    getElementById: () => ({ getContext: () => stubCtx(), width: 0, height: 0,
                             style: {}, addEventListener() {}, classList: { add(){}, remove(){} } }),
    addEventListener() {}, body: { appendChild() {} },
  },
  window: { addEventListener() {}, devicePixelRatio: 1, innerWidth: 1280, innerHeight: 720,
            matchMedia: () => ({ matches: false, addEventListener() {} }) },
  navigator: { userAgent: 'node' },
  addEventListener() {}, requestAnimationFrame: () => 0, devicePixelRatio: 1,
  innerWidth: 1280, innerHeight: 720, matchMedia: () => ({ matches: false, addEventListener() {} }),
  TextEncoder, Math, Date, JSON,
}
sandbox.globalThis = sandbox
vm.createContext(sandbox)
vm.runInContext(code + '\n;globalThis.__api = { configure, terrainOf, regionNameAt, dims }', sandbox)

const { configure, terrainOf, regionNameAt } = sandbox.__api

// ---- the world that was actually founded ---------------------------------
// SPEC 21e: expanse7, 896x512. v7 pins its own seed (V7_SEED), so the island
// is a function of the generator and the dimensions alone.
const W = 896, H = 512
console.log(configure({ worldW: W, worldH: H, generator: 'interval-expanse-v7' }))

// ---- palette lifted verbatim from buildMini() ----------------------------
const COLS = {
  meadow:'#3d5a23', trail:'#8a7449', cobble:'#7a756b', plaza:'#6e5f3e',
  flag:'#847b66', gravel:'#8d8578', sand:'#c9b98a', scree:'#5d5a52',
  cave:'#2e2c33', wilds:'#4a3d2e', sea:'#2a5f7d', mountain:'#6e6a60',
  bridge:'#8a6a3a', river:'#2f6a86', greenwood:'#26401b', crags:'#6a6358',
  fens:'#43512f', heartlands:'#3d5a23', downs:'#8d9058', moor:'#4e4352',
  chalk:'#c4bd98', peat:'#4a3f3a', causey:'#7d7a63', floor:'#6b5335',
}
const hex = (h) => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)]

const TRACKS = [
  ['theme-hearth',  'The Long Table',              ['the Heartlands','the Meadows','Greenhollow','Millbrook','Norwick','Thornbury','Oxenford','Hollybarrow','the City','the Market']],
  ['theme-anchor',  'Nowhere Else to Be',          ['Anchor']],
  ['theme-road',    'Between Anvils',              ['the Greenwood','the Road','Eastmere']],
  ['theme-downs',   'You Can See It All From Here', ['the Downs','the Shore']],
  ['theme-crags',   'Uphill All Day',              ['the Crags','the Pass','the Mountains','the Scree','Cragfoot']],
  ['theme-fens',    'Fifty-One Tiles',             ['the Fens','Fenmarch']],
  ['theme-moor',    'What the Barrows Keep',       ['the Moor']],
  ['theme-wilds',   'Priced in Blood',             ['the Wilds']],
  ['theme-gallery', 'Someone Is Still Down There', ['the Deep']],
  // the door shows the island entire: nothing dimmed, because standing at the
  // threshold you have not chosen a country yet.
  ['theme-deep',    'One Island Under Every Seed', null],
  // the flat window is the one with counters and criers in it, so its door
  // shows the ten towns rather than the whole country.
  ['theme-flat',    'Mine Here, the Anvil Is at Thornbury',
    ['Anchor','Thornbury','Oxenford','Eastmere','Cragfoot',
     'Hollybarrow','Norwick','Fenmarch','Millbrook','Greenhollow']],
]

// ---- one pass over the island, cached -------------------------------------
console.log('walking ' + (W*H).toLocaleString() + ' tiles...')
const terr = new Array(W*H), regn = new Array(W*H)
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = y*W + x
    try { terr[i] = terrainOf(x, y) } catch { terr[i] = 'meadow' }
    try { regn[i] = regionNameAt(x, y) || '' } catch { regn[i] = '' }
  }
}
const seen = {}
for (const r of regn) if (r) seen[r] = (seen[r] || 0) + 1
console.log('regions found:', Object.entries(seen).sort((p,q)=>q[1]-p[1])
  .map(([k,v]) => k + ' ' + v).join(', '))

// ---- minimal PNG writer (no deps) ----------------------------------------
function png(w, h, rgb) {
  const raw = Buffer.alloc((w*3 + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y*(w*3+1)] = 0
    rgb.copy(raw, y*(w*3+1)+1, y*w*3, (y+1)*w*3)
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
    const td = Buffer.concat([Buffer.from(type), data])
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td) >>> 0)
    return Buffer.concat([len, td, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  return Buffer.concat([
    Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, {level:9})),
    chunk('IEND', Buffer.alloc(0)),
  ])
}
let TBL = null
function crc32(buf) {
  if (!TBL) { TBL = new Int32Array(256)
    for (let n = 0; n < 256; n++) { let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      TBL[n] = c } }
  let c = -1
  for (let i = 0; i < buf.length; i++) c = TBL[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return c ^ -1
}

// ---- draw ----------------------------------------------------------------
fs.mkdirSync(OUT, { recursive: true })
const S = 2                      // 896x512 -> 1792x1024
for (const [stem, title, regions] of TRACKS) {
  const set = regions ? new Set(regions) : null
  const px = Buffer.alloc(W*S * H*S * 3)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y*W + x
    let [r,g,bl] = hex(COLS[terr[i]] ?? '#3d5a23')
    // water is never lit. Regions are bands over the whole plane, so the sea
    // falls inside one -- but nobody walks there, and a bright rectangle of
    // sea reads as a bug rather than a country.
    const wet = terr[i] === 'sea' || terr[i] === 'river' || terr[i] === 'bridge'
    const lit = set ? set.has(regn[i]) : !wet     // null set == the whole island
    if (wet || !lit) {                            // dim everything else
      r = (r*0.34 + 6)|0; g = (g*0.34 + 7)|0; bl = (bl*0.34 + 10)|0
    } else {                                      // lift the one that is lit
      r = Math.min(255, (r*1.55 + 26)|0); g = Math.min(255, (g*1.55 + 26)|0); bl = Math.min(255, (bl*1.45 + 20)|0)
    }
    for (let dy = 0; dy < S; dy++) for (let dx = 0; dx < S; dx++) {
      const o = ((y*S+dy) * W*S + (x*S+dx)) * 3
      px[o] = r; px[o+1] = g; px[o+2] = bl
    }
  }
  const lit = regn.filter((r, i) => (set ? set.has(r) : true) &&
    terr[i] !== 'sea' && terr[i] !== 'river' && terr[i] !== 'bridge').length
  fs.writeFileSync(OUT + '/' + stem + '.png', png(W*S, H*S, px))
  console.log('  ' + stem.padEnd(14) + ' ' + String(lit).padStart(7) + ' tiles lit   ' + title)
}
console.log('\nwrote ' + TRACKS.length + ' covers to ' + OUT + '/')
