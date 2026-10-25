// AN ANIMATED PNG, ASSEMBLED FROM FRAMES THAT ARE ALREADY PNGS.
//
// The film was delivered as a page that cycled the frames in script, and the
// thing that opened it did not run script: it stood there, one still, looking
// exactly like a working picture of a broken animation. A moving image has to
// move without being asked to.
//
// APNG is the format for that here. It needs no encoder: every frame is
// already a PNG of the same size and shape, so the pixels can be lifted out
// whole and re-framed. Nothing is recompressed and nothing is decoded, which
// is also why this is a hundred lines and not a library.
//
// The shape of the file: the ordinary PNG header, then `acTL` saying how many
// frames and how many times to play, then for each frame an `fcTL` saying
// where it goes and how long it stays. The first frame's pixels travel in the
// ordinary `IDAT` so that anything which does not know APNG still shows a
// sensible still; the rest travel in `fdAT`, which is `IDAT` with a sequence
// number in front.
import { readFileSync, writeFileSync } from 'node:fs'
import zlib from 'node:zlib'

const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

const CRC = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return (buf) => {
    let c = -1
    for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
    return (c ^ -1) >>> 0
  }
})()

function chunk (type, data) {
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0)
  out.write(type, 4, 'ascii')
  data.copy(out, 8)
  out.writeUInt32BE(CRC(out.subarray(4, 8 + data.length)), 8 + data.length)
  return out
}

// every chunk in a PNG, in order
function chunksOf (png) {
  if (!png.subarray(0, 8).equals(SIG)) throw new Error('not a PNG')
  const out = []
  let i = 8
  while (i < png.length) {
    const len = png.readUInt32BE(i)
    const type = png.toString('ascii', i + 4, i + 8)
    out.push({ type, data: png.subarray(i + 8, i + 8 + len) })
    i += 12 + len
  }
  return out
}

export function apng (pngs, { delayMs = 40, plays = 0, holdLast = 0 } = {}) {
  if (!pngs.length) throw new Error('no frames')
  const first = chunksOf(pngs[0])
  const ihdr = first.find((c) => c.type === 'IHDR')
  if (!ihdr) throw new Error('the first frame has no header')
  const w = ihdr.data.readUInt32BE(0), h = ihdr.data.readUInt32BE(4)

  // the frames, as the run of IDAT bytes each one carries
  const pix = pngs.map((p, n) => {
    const cs = chunksOf(p)
    const head = cs.find((c) => c.type === 'IHDR')
    if (head.data.readUInt32BE(0) !== w || head.data.readUInt32BE(4) !== h) {
      throw new Error(`frame ${n} is ${head.data.readUInt32BE(0)}x${head.data.readUInt32BE(4)}, the first is ${w}x${h}`)
    }
    // AND THE SAME KIND OF PIXELS. Depth, colour type, compression, filter and
    // interlace all live in the five bytes after the size, and an APNG frame
    // that disagrees with the header it is played under is a frame of noise.
    if (!head.data.subarray(8, 13).equals(ihdr.data.subarray(8, 13))) {
      throw new Error(`frame ${n} is not the same kind of image as the first`)
    }
    return Buffer.concat(cs.filter((c) => c.type === 'IDAT').map((c) => c.data))
  })

  // a held last frame is a pause before it starts again, which is most of
  // what makes a short loop readable
  const times = pix.map((_, i) => (i === pix.length - 1 ? delayMs + holdLast : delayMs))

  const acTL = Buffer.alloc(8)
  acTL.writeUInt32BE(pix.length, 0)
  acTL.writeUInt32BE(plays, 4)

  let seq = 0
  const fcTL = (ms) => {
    const d = Buffer.alloc(26)
    d.writeUInt32BE(seq++, 0)
    d.writeUInt32BE(w, 4); d.writeUInt32BE(h, 8)
    d.writeUInt32BE(0, 12); d.writeUInt32BE(0, 16)   // at the origin, full size
    d.writeUInt16BE(ms, 20); d.writeUInt16BE(1000, 22)
    d.writeUInt8(0, 24)   // dispose: leave it, since every frame is the whole picture
    d.writeUInt8(0, 25)   // blend: replace
    return chunk('fcTL', d)
  }

  const parts = [SIG, chunk('IHDR', ihdr.data)]
  // anything the first frame carries that the pixels depend on
  for (const c of first) if (['PLTE', 'tRNS', 'gAMA', 'sRGB'].includes(c.type)) parts.push(chunk(c.type, c.data))
  parts.push(chunk('acTL', acTL))
  parts.push(fcTL(times[0]))
  parts.push(chunk('IDAT', pix[0]))              // the first frame is the still
  for (let i = 1; i < pix.length; i++) {
    parts.push(fcTL(times[i]))
    const fd = Buffer.alloc(4 + pix[i].length)
    fd.writeUInt32BE(seq++, 0)
    pix[i].copy(fd, 4)
    parts.push(chunk('fdAT', fd))
  }
  parts.push(chunk('IEND', Buffer.alloc(0)))
  return Buffer.concat(parts)
}

// ---- AND A CHECK, BECAUSE THIS WRITES A BINARY FORMAT BY HAND ----
//
// A malformed APNG does not complain: it shows its first frame and stands
// there, which is indistinguishable from a working picture of a still. The
// only honest test is to read the bytes back and ask the four questions the
// spec asks: is `acTL` before the pixels, is every sequence number there
// exactly once in order, does each frame carry a whole picture, and does the
// header say as many frames as the file contains.
export function readBackCheck (buf) {
  const cs = []
  let i = 8
  if (!buf.subarray(0, 8).equals(SIG)) return 'not a PNG'
  while (i < buf.length) {
    const len = buf.readUInt32BE(i)
    cs.push({ type: buf.toString('ascii', i + 4, i + 8), data: buf.subarray(i + 8, i + 8 + len) })
    i += 12 + len
  }
  const ihdr = cs.find((c) => c.type === 'IHDR'), actl = cs.find((c) => c.type === 'acTL')
  if (!ihdr) return 'no header'
  if (!actl) return 'no acTL: nothing will know this moves'
  if (cs.findIndex((c) => c.type === 'acTL') > cs.findIndex((c) => c.type === 'IDAT')) {
    return 'acTL comes after the pixels, which is too late to say the file moves'
  }
  const fctl = cs.filter((c) => c.type === 'fcTL'), fdat = cs.filter((c) => c.type === 'fdAT')
  if (actl.data.readUInt32BE(0) !== fctl.length) {
    return `acTL says ${actl.data.readUInt32BE(0)} frames and there are ${fctl.length}`
  }
  const seqs = [...fctl, ...fdat].map((c) => c.data.readUInt32BE(0)).sort((a, b) => a - b)
  for (let k = 0; k < seqs.length; k++) if (seqs[k] !== k) return `sequence numbers jump at ${k}`
  const w = ihdr.data.readUInt32BE(0), h = ihdr.data.readUInt32BE(4), colour = ihdr.data[9]
  const per = colour === 6 ? 4 : colour === 2 ? 3 : colour === 4 ? 2 : 1
  const want = h * (1 + w * per)
  const streams = [Buffer.concat(cs.filter((c) => c.type === 'IDAT').map((c) => c.data)),
    ...fdat.map((c) => c.data.subarray(4))]
  for (let n = 0; n < streams.length; n++) {
    let got
    try { got = zlib.inflateSync(streams[n]).length } catch (e) { return `frame ${n} will not decompress: ${e.message}` }
    if (got !== want) return `frame ${n} decodes to ${got} bytes and a full picture is ${want}`
  }
  return null
}

// node apng.mjs out.png 40 600 frame1.png frame2.png ...
// node apng.mjs --selftest
if (process.argv[1] && process.argv[1].endsWith('apng.mjs')) {
  if (process.argv[2] === '--selftest') {
    // two tiny pictures, made here rather than read, so the check needs nothing
    const tiny = (r, g, b) => {
      const W = 2, H = 2
      const raw = Buffer.alloc(H * (1 + W * 4))
      for (let y = 0; y < H; y++) {
        raw[y * (1 + W * 4)] = 0
        for (let x = 0; x < W; x++) {
          const o = y * (1 + W * 4) + 1 + x * 4
          raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = 255
        }
      }
      const ihdr = Buffer.alloc(13)
      ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4)
      ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
      return Buffer.concat([SIG, chunk('IHDR', ihdr),
        chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
    }
    const made = apng([tiny(200, 30, 30), tiny(30, 200, 30), tiny(30, 30, 200)],
      { delayMs: 50, holdLast: 300 })
    const why = readBackCheck(made)
    console.log(why ? '  FAIL  ' + why : '  ok    three frames in, three frames out, and every one whole')
    // and it must refuse a frame that is not the same picture twice
    let refused = null
    try { apng([tiny(1, 1, 1), Buffer.concat([SIG, chunk('IHDR', (() => {
      const d = Buffer.alloc(13); d.writeUInt32BE(4, 0); d.writeUInt32BE(4, 4)
      d[8] = 8; d[9] = 6; return d })()), chunk('IEND', Buffer.alloc(0))])]) }
    catch (e) { refused = e.message }
    console.log(refused ? '  ok    a frame of the wrong size is refused: ' + refused
      : '  FAIL  a frame of the wrong size was accepted, and would play as noise')
    process.exit(why || !refused ? 1 : 0)
  }
  const [out, delay, hold, ...files] = process.argv.slice(2)
  if (!out || !files.length) { console.log('apng.mjs OUT.png DELAYMS HOLDMS frames...'); process.exit(1) }
  const buf = apng(files.map((f) => readFileSync(f)), { delayMs: +delay || 40, holdLast: +hold || 0 })
  const why = readBackCheck(buf)
  if (why) { console.error('refusing to write a broken animation: ' + why); process.exit(1) }
  writeFileSync(out, buf)
  console.log(out + '  ' + files.length + ' frames, ' + Math.round(buf.length / 1024) + ' KB')
}
