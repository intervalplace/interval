// preview-island.mjs: what the bridge says the ground is, as a picture.
//
// Not a window: no key, no intents, no entities. It asks the local bridge for
// every chunk of the island and paints one pixel per tile, so that the Unreal
// window can be judged against the ground truth rather than against a memory
// of it. If this picture and a screenshot disagree about where the Fens end,
// the screenshot is wrong.
//
// The palette is keyed by NAME and every name it does not know paints magenta
// on purpose: a terrain the mirror learned and nobody drew should be loud,
// not plausible. That is the same contract the material has: an unknown code
// lands on a fallback and the ground is still there.
//
//   node preview-island.mjs [--port 7777] [--out island.png]

import { WebSocket } from 'ws'
import zlib from 'zlib'
import fs from 'fs'

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORT = +arg('port', 7777)
const OUT = arg('out', 'island-expanse7.png')
const CHUNK = 64

const PAL = {
  meadow: [124, 158, 86], heartlands: [132, 164, 90], downs: [158, 170, 108], moor: [110, 108, 78],
  wilds: [74, 104, 62], forest: [52, 86, 54], greenwood: [64, 104, 60], fens: [86, 100, 74],
  crags: [112, 108, 102], mountain: [128, 126, 124], scree: [138, 134, 128], cave: [48, 44, 44],
  sea: [38, 68, 100], river: [58, 102, 138], bridge: [124, 100, 72], sand: [214, 198, 150],
  chalk: [226, 224, 214], peat: [92, 74, 56], gravel: [150, 146, 132], trail: [150, 128, 92],
  causey: [138, 122, 96], cobble: [146, 142, 136], plaza: [174, 168, 158], floor: [100, 92, 84],
  flag: [190, 80, 70], shingle: [186, 176, 158], trodden: [140, 126, 96],
}

const crc32 = (buf) => { let c = ~0; for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)) } return ~c >>> 0 }
const png = (w, h, rgb) => {
  const raw = Buffer.alloc((w * 3 + 1) * h)
  for (let y = 0; y < h; y++) rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3)
  const ck = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length)
    const b = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(b))
    return Buffer.concat([l, b, c]) }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ck('IHDR', ihdr),
    ck('IDAT', zlib.deflateSync(raw, { level: 9 })), ck('IEND', Buffer.alloc(0))])
}

let W = 0, H = 0, names = [], tiles, road, want = 0, got = 0
const ws = new WebSocket('ws://127.0.0.1:' + PORT)
ws.on('error', (e) => { console.error('no bridge on ' + PORT + ': ' + e.message); process.exit(1) })
ws.on('message', (buf) => {
  const m = JSON.parse(buf)
  if (m.k === 'tiles') { names = m.tiles; return }
  if (m.k === 'hello') {
    names = m.tiles; W = m.genesis.worldW; H = m.genesis.worldH
    tiles = new Uint8Array(W * H).fill(255); road = new Uint8Array(W * H)
    console.log(m.genesis.worldGenerator + '  ' + W + 'x' + H + '  seed ' + (m.genesis.genesisSeed || '(none)'))
    for (let y0 = 0; y0 < H; y0 += CHUNK) for (let x0 = 0; x0 < W; x0 += CHUNK) {
      want++; ws.send(JSON.stringify({ k: 'terrain', x0, y0, w: Math.min(CHUNK, W - x0), h: Math.min(CHUNK, H - y0) }))
    }
    return
  }
  if (m.k !== 'terrain') return
  const t = Buffer.from(m.tiles, 'base64'), r = Buffer.from(m.road, 'base64')
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    tiles[(m.y0 + y) * W + m.x0 + x] = t[y * m.w + x]
    road[(m.y0 + y) * W + m.x0 + x] = r[y * m.w + x]
  }
  if (++got < want) return

  const hist = new Map()
  for (const c of tiles) hist.set(c, (hist.get(c) ?? 0) + 1)
  const unknown = []
  console.log('\nterrain, whole island:')
  for (const [c, n] of [...hist].sort((a, b) => b[1] - a[1])) {
    const name = names[c] ?? ('code ' + c)
    if (!PAL[name]) unknown.push(name)
    console.log('  ' + name.padEnd(12) + String(n).padStart(8) + '  ' + (100 * n / (W * H)).toFixed(2) + '%')
  }
  console.log('  made ways  ' + String(road.reduce((a, b) => a + b, 0)).padStart(8) + '  tiles')
  if (unknown.length) console.log('\n  NOT IN THE PALETTE (drawn magenta): ' + unknown.join(', '))

  const rgb = Buffer.alloc(W * H * 3)
  for (let i = 0; i < W * H; i++) {
    let c = PAL[names[tiles[i]]] ?? [255, 0, 255]
    if (road[i]) c = [c[0] * 0.5 + 172 * 0.5, c[1] * 0.5 + 150 * 0.5, c[2] * 0.5 + 112 * 0.5]
    rgb[i * 3] = c[0]; rgb[i * 3 + 1] = c[1]; rgb[i * 3 + 2] = c[2]
  }
  fs.writeFileSync(OUT, png(W, H, rgb))
  console.log('\nwrote ' + OUT)
  process.exit(0)
})
