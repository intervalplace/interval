// AN ANIMATED GIF, WRITTEN FROM SCRATCH, BECAUSE NOTHING ELSE PLAYED.
//
// The film was sent twice and stood still twice: once as a page that cycled
// its frames in script, where no script ran, and once as an APNG, which was
// correct by the spec and shown as its first frame anyway. A moving picture
// is only moving in the thing that opens it, and the only format every
// previewer on earth animates is GIF.
//
// So: PNG frames in, GIF89a out. Nothing is installed to do it. That means
// three pieces of real work, in order:
//
//   the PNG frames are DECODED by hand (inflate, then undo the per-row
//   filters), because a GIF needs pixels and a PNG is compressed rows
//   a palette is chosen, because a GIF holds 256 colours and the frames
//   hold thousands
//   the indices are LZW-compressed, which is the format's own scheme and
//   the one part where a bug is silent: a wrong code table decodes to
//   plausible-looking noise rather than to an error
//
// The last of those is why `--selftest` below decodes its own output back
// and compares it to what went in.
import zlib from 'node:zlib'
import { readFileSync, writeFileSync } from 'node:fs'

// ---------------------------------------------------------- PNG, decoded
const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

export function decodePng (buf) {
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error('not a PNG')
  let i = 8, ihdr = null
  const idat = []
  while (i < buf.length) {
    const len = buf.readUInt32BE(i), type = buf.toString('ascii', i + 4, i + 8)
    const data = buf.subarray(i + 8, i + 8 + len)
    if (type === 'IHDR') ihdr = data
    else if (type === 'IDAT') idat.push(data)
    i += 12 + len
  }
  if (!ihdr) throw new Error('no header')
  const w = ihdr.readUInt32BE(0), h = ihdr.readUInt32BE(4)
  const depth = ihdr[8], colour = ihdr[9], interlace = ihdr[12]
  if (depth !== 8) throw new Error('only eight bits a channel: this one is ' + depth)
  if (interlace) throw new Error('interlaced PNGs are not read here')
  const ch = colour === 6 ? 4 : colour === 2 ? 3 : colour === 0 ? 1 : colour === 4 ? 2 : 0
  if (!ch) throw new Error('colour type ' + colour + ' is not read here')
  const raw = zlib.inflateSync(Buffer.concat(idat))
  const stride = w * ch
  const out = Buffer.alloc(h * stride)
  // the five filters, undone a row at a time against the row above
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)]
    const src = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride)
    const cur = out.subarray(y * stride, y * stride + stride)
    const up = y ? out.subarray((y - 1) * stride, y * stride) : null
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? cur[x - ch] : 0
      const b = up ? up[x] : 0
      const c = up && x >= ch ? up[x - ch] : 0
      let v = src[x]
      if (f === 1) v += a
      else if (f === 2) v += b
      else if (f === 3) v += (a + b) >> 1
      else if (f === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c)
      } else if (f !== 0) throw new Error('row ' + y + ' uses filter ' + f)
      cur[x] = v & 255
    }
  }
  return { w, h, ch, pix: out }
}

// ------------------------------------------------- 256 colours, chosen well
//
// The art is flat colour over a noise texture, so the picture has thousands
// of near-identical shades and no smooth gradients worth protecting. A
// histogram at five bits a channel, the commonest 256 kept, and everything
// else sent to its nearest neighbour: cheap, and on this material it is
// indistinguishable from the original at the sizes it will be looked at.
export function palettise (frames, w, h, ch) {
  const hist = new Uint32Array(32768)
  const key = (r, g, b) => ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)
  for (const pix of frames) {
    for (let p = 0; p < w * h; p++) {
      const o = p * ch
      hist[key(pix[o], pix[o + 1], pix[o + 2])]++
    }
  }
  const used = []
  for (let k = 0; k < 32768; k++) if (hist[k]) used.push(k)
  used.sort((a, b) => hist[b] - hist[a])
  const take = used.slice(0, 256)
  const pal = take.map((k) => [((k >> 10) & 31) << 3, ((k >> 5) & 31) << 3, (k & 31) << 3])
  while (pal.length < 2) pal.push([0, 0, 0])
  // nearest neighbour, memoised on the five-bit key: thirty-two thousand
  // answers at most, and the picture asks for millions
  const near = new Int16Array(32768).fill(-1)
  const lookup = (k) => {
    if (near[k] >= 0) return near[k]
    const r = ((k >> 10) & 31) << 3, g = ((k >> 5) & 31) << 3, b = (k & 31) << 3
    let best = 0, bd = Infinity
    for (let n = 0; n < pal.length; n++) {
      const dr = r - pal[n][0], dg = g - pal[n][1], db = b - pal[n][2]
      const d = dr * dr * 3 + dg * dg * 6 + db * db       // the eye's own weighting
      if (d < bd) { bd = d; best = n }
    }
    near[k] = best
    return best
  }
  const indexed = frames.map((pix) => {
    const ix = Buffer.alloc(w * h)
    for (let p = 0; p < w * h; p++) {
      const o = p * ch
      ix[p] = lookup(key(pix[o], pix[o + 1], pix[o + 2]))
    }
    return ix
  })
  return { pal, indexed }
}

// --------------------------------------------------------------- LZW, GIF's
function lzw (indices, minCode) {
  const CLEAR = 1 << minCode, END = CLEAR + 1
  const out = []
  let cur = 0, bits = 0
  let width = minCode + 1
  const put = (code) => {
    cur |= code << bits
    bits += width
    while (bits >= 8) { out.push(cur & 255); cur >>= 8; bits -= 8 }
  }
  let dict = new Map()
  let next = END + 1
  const reset = () => { dict = new Map(); next = END + 1; width = minCode + 1 }
  put(CLEAR)
  let prefix = indices[0]
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i]
    const probe = prefix * 4096 + k
    const found = dict.get(probe)
    if (found !== undefined) { prefix = found; continue }
    put(prefix)
    if (next < 4096) {
      dict.set(probe, next++)
      // the width grows the moment the next code would not fit
      if (next > (1 << width) && width < 12) width++
    } else {
      put(CLEAR); reset()
    }
    prefix = k
  }
  put(prefix)
  put(END)
  if (bits > 0) out.push(cur & 255)
  return Buffer.from(out)
}

// and the same table read backwards, which is the only honest check on it
export function unlzw (buf, minCode) {
  const CLEAR = 1 << minCode, END = CLEAR + 1
  let width = minCode + 1, pos = 0, bit = 0
  const read = () => {
    let v = 0
    for (let n = 0; n < width; n++) {
      if (pos >= buf.length) return END
      v |= ((buf[pos] >> bit) & 1) << n
      if (++bit === 8) { bit = 0; pos++ }
    }
    return v
  }
  let table = [], out = []
  const reset = () => { table = []; for (let n = 0; n <= END; n++) table[n] = [n]; width = minCode + 1 }
  reset()
  let prev = null
  for (;;) {
    const code = read()
    if (code === CLEAR) { reset(); prev = null; continue }
    if (code === END) break
    let entry
    if (table[code]) entry = table[code]
    else if (prev) entry = [...prev, prev[0]]
    else throw new Error('a code arrived before anything could define it')
    out.push(...entry)
    if (prev) {
      table.push([...prev, entry[0]])
      if (table.length >= (1 << width) && width < 12) width++
    }
    prev = entry
  }
  return out
}

const blocks = (data) => {
  const out = []
  for (let i = 0; i < data.length; i += 255) {
    const n = Math.min(255, data.length - i)
    out.push(Buffer.from([n]), data.subarray(i, i + n))
  }
  out.push(Buffer.from([0]))
  return Buffer.concat(out)
}

// ------------------------------------------------------------------- the GIF
export function gif (pngs, { delayMs = 40, holdLast = 0 } = {}) {
  if (!pngs.length) throw new Error('no frames')
  const dec = pngs.map(decodePng)
  const { w, h, ch } = dec[0]
  for (const [n, d] of dec.entries()) {
    if (d.w !== w || d.h !== h) throw new Error(`frame ${n} is ${d.w}x${d.h}, the first is ${w}x${h}`)
  }
  const { pal, indexed } = palettise(dec.map((d) => d.pix), w, h, ch)

  const bits = Math.max(2, Math.ceil(Math.log2(Math.max(2, pal.length))))
  const table = Buffer.alloc(3 * (1 << bits))
  pal.forEach((c, n) => { table[n * 3] = c[0]; table[n * 3 + 1] = c[1]; table[n * 3 + 2] = c[2] })

  const head = Buffer.alloc(13)
  head.write('GIF89a', 0, 'ascii')
  head.writeUInt16LE(w, 6); head.writeUInt16LE(h, 8)
  head[10] = 0x80 | ((bits - 1) & 7)     // a global table, this many bits deep
  head[11] = 0; head[12] = 0
  const loop = Buffer.from([0x21, 0xff, 0x0b, ...Buffer.from('NETSCAPE2.0', 'ascii'),
    0x03, 0x01, 0x00, 0x00, 0x00])       // and it plays for ever

  const parts = [head, table, loop]
  for (let n = 0; n < indexed.length; n++) {
    // ONLY WHAT CHANGED. Most of a grid of seven fights is the same picture
    // from one frame to the next, and a GIF can carry a sub-rectangle and
    // leave the rest standing. On this material it is the difference between
    // a file that arrives and one that does not.
    let x0 = 0, y0 = 0, x1 = w - 1, y1 = h - 1
    if (n > 0) {
      const prev = indexed[n - 1], cur = indexed[n]
      x0 = w; y0 = h; x1 = -1; y1 = -1
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (prev[y * w + x] !== cur[y * w + x]) {
            if (x < x0) x0 = x
            if (x > x1) x1 = x
            if (y < y0) y0 = y
            if (y > y1) y1 = y
          }
        }
      }
      if (x1 < 0) { x0 = 0; y0 = 0; x1 = 0; y1 = 0 }   // nothing moved: one pixel
    }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1
    const sub = Buffer.alloc(bw * bh)
    for (let y = 0; y < bh; y++) {
      indexed[n].copy(sub, y * bw, (y0 + y) * w + x0, (y0 + y) * w + x0 + bw)
    }
    const cs = Math.round((delayMs + (n === indexed.length - 1 ? holdLast : 0)) / 10)
    const gce = Buffer.from([0x21, 0xf9, 0x04, 0x04, cs & 255, (cs >> 8) & 255, 0x00, 0x00])
    const desc = Buffer.alloc(10)
    desc[0] = 0x2c
    desc.writeUInt16LE(x0, 1); desc.writeUInt16LE(y0, 3)
    desc.writeUInt16LE(bw, 5); desc.writeUInt16LE(bh, 7)
    desc[9] = 0
    parts.push(gce, desc, Buffer.from([bits]), blocks(lzw(sub, bits)))
  }
  parts.push(Buffer.from([0x3b]))
  return Buffer.concat(parts)
}

// ------------------------------------------------------------------ the check
if (process.argv[1] && process.argv[1].endsWith('gif.mjs')) {
  if (process.argv[2] === '--selftest') {
    let bad = 0
    const say = (ok, m) => { console.log((ok ? '  ok    ' : '  FAIL  ') + m); if (!ok) bad++ }
    // the compressor, read back by the decompressor: the one part of this
    // where a mistake is silent, because wrong codes make plausible noise
    for (const [name, data] of [
      ['a run of one colour', Array(5000).fill(7)],
      ['a sweep of many', Array.from({ length: 5000 }, (_, i) => i % 256)],
      ['noise', Array.from({ length: 20000 }, (_, i) => (i * 2654435761) % 256)],
      ['long enough to fill the table twice', Array.from({ length: 200000 }, (_, i) => (i * 97) % 256)],
    ]) {
      const back = unlzw(lzw(data, 8), 8)
      say(back.length === data.length && back.every((v, i) => v === data[i]),
        name + ' survives the round trip (' + data.length + ' pixels)')
    }
    process.exit(bad ? 1 : 0)
  }
  const [out, delay, hold, ...files] = process.argv.slice(2)
  if (!out || !files.length) { console.log('gif.mjs OUT.gif DELAYMS HOLDMS frames...'); process.exit(1) }
  const buf = gif(files.map((f) => readFileSync(f)), { delayMs: +delay || 40, holdLast: +hold || 0 })
  writeFileSync(out, buf)
  console.log(out + '  ' + files.length + ' frames, ' + Math.round(buf.length / 1024) + ' KB')
}
