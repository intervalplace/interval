// THE EXPANSE, FROM TWELVE PLACES IN IT.
//
// The mist window is first person and stays that way: there is no drone shot of
// this country because no citizen has ever had one. So "what does the whole
// world look like in this style" is answered the only honest way — by standing
// in twelve places and looking, and putting the twelve frames side by side.
//
//   node montage.mjs out.png            (uses /tmp/live-world.json)
import fs from 'fs'
import zlib from 'zlib'
import { execFileSync } from 'child_process'

const WORLD = process.env.WORLD || '/tmp/live-world.json'
const w = JSON.parse(fs.readFileSync(WORLD, 'utf8'))
const W = w.genesis.worldW, H = w.genesis.worldH
// twelve places, chosen by where the world actually put things: the densest
// cells of a coarse grid, spread out so they are not all one town
const bins = new Map()
for (const n of Object.values(w.nodes)) {
  const k = ((n.x / 32) | 0) + ',' + ((n.y / 32) | 0)
  bins.set(k, (bins.get(k) || 0) + 1)
}
const ranked = [...bins].sort((a, b) => b[1] - a[1])
const spots = []
for (const [k, count] of ranked) {
  const [bx, by] = k.split(',').map(Number)
  const cx = bx * 32 + 16, cy = by * 32 + 16
  if (spots.some(s => Math.hypot(s.x - cx, s.y - cy) < 60)) continue   // spread them out
  spots.push({ x: cx, y: cy, count })
  if (spots.length === 12) break
}
console.log('standing in ' + spots.length + ' places across ' + W + '\u00d7' + H)

const COLS = 4, ROWS = Math.ceil(spots.length / COLS)
const tiles = []
let TW = 0, TH = 0
spots.forEach((s, i) => {
  const raw = '/tmp/mist-tile-' + i + '.raw'
  const yaw = (i * 1.37) % 6.28
  execFileSync(process.execPath, ['preview-mist.mjs', 'x.png', '700', String(yaw.toFixed(2))], {
    env: { ...process.env, RAW: raw, SLICE: WORLD, AT: s.x + ',' + s.y,
           FAR: process.env.FAR || '30', PITCH: process.env.PITCH || '-0.22', NOHUD: '1' }, stdio: 'ignore' })
  const b = fs.readFileSync(raw)
  TW = b.readUInt32BE(0); TH = b.readUInt32BE(4)
  tiles.push(b.subarray(8))
  console.log('  ' + (i + 1) + '/' + spots.length + '  ' + s.x + ',' + s.y + '  (' + s.count + ' things)')
})
const OW = TW * COLS, OH = TH * ROWS
const out = Buffer.alloc(OW * OH * 3)
tiles.forEach((t, i) => {
  const ox = (i % COLS) * TW, oy = ((i / COLS) | 0) * TH
  for (let y = 0; y < TH; y++)
    t.copy(out, ((oy + y) * OW + ox) * 3, y * TW * 3, (y + 1) * TW * 3)
})
// scale up whole-pixel, then encode
const S = +(process.env.MSCALE || 2)
const big = Buffer.alloc(OW * S * OH * S * 3)
for (let y = 0; y < OH; y++) for (let x = 0; x < OW; x++) {
  const i = (y * OW + x) * 3
  for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
    const o = ((y * S + sy) * OW * S + x * S + sx) * 3
    out.copy(big, o, i, i + 3)
  }
}
let CT = null
function crc32 (buf) {
  if (!CT) { CT = new Int32Array(256)
    for (let n = 0; n < 256; n++) { let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      CT[n] = c } }
  let c = -1
  for (let i = 0; i < buf.length; i++) c = CT[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return c ^ -1
}
const fw = OW * S, fh = OH * S
const raw = Buffer.alloc((fw * 3 + 1) * fh)
for (let y = 0; y < fh; y++) { raw[y * (fw * 3 + 1)] = 0
  big.copy(raw, y * (fw * 3 + 1) + 1, y * fw * 3, (y + 1) * fw * 3) }
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data]), crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td) >>> 0); return Buffer.concat([len, td, crc]) }
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(fw, 0); ihdr.writeUInt32BE(fh, 4)
ihdr[8] = 8; ihdr[9] = 2
fs.writeFileSync(process.argv[2] || 'expanse.png', Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]))
console.log('wrote ' + (process.argv[2] || 'expanse.png') + '  ' + fw + '\u00d7' + fh)
