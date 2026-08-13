// engine-browser.mjs -- run the ENGINE ITSELF in a window, unmodified.
//
// §0 needs this: Nought is the island under the real rules, and "the real
// rules" cannot mean a second implementation. A reimplementation would drift,
// and the first thing a resident would learn is a lie about how the world
// works. So the window runs `engine.js` -- the same bytes the pillar runs, the
// same bytes the rules hash covers -- and nothing here is allowed to change a
// line of it.
//
// engine.js is CommonJS and expects Node. It already has a browser path for
// hashing (it falls through to @noble/hashes when `require('crypto')` throws),
// so all that is missing is a `require`, a `module`, and a `Buffer`. This file
// supplies those three and nothing else.
//
// It is loaded by fetching engine.js as TEXT and evaluating it. That means the
// window never holds a copy that can fall out of step, and it can check what it
// was given: `verifyEngineSource` hashes the text against the rules the world
// is running under. A hostile pillar could serve a doctored engine, and it
// would matter exactly as much as Nought does -- which is to say not at all,
// since nothing computed here is ever sent anywhere.

// The engine's two dependencies, resolved by URL rather than by name.
//
// A browser has no node resolution and this project has no bundler, so a bare
// specifier here is unresolvable and the whole module fails to load -- taking
// Nought with it. The pillar serves these under /vendor/ with their relative
// imports intact, and this file is the only place that needs to know it.
//
// `ed25519` must be SYNCHRONOUS: the engine verifies signatures inside
// validInput, which is a pure function and cannot await. WebCrypto (which this
// window uses for its own signing) is async and cannot serve here.
// Under a pillar these resolve to /vendor/; under node (the test suite) there
// is no such directory and the package names resolve normally. Try the served
// path first, because that is the one that has to work where it matters.
const VENDOR = new URL('./vendor/', import.meta.url).href
async function dep (url, bare) {
  try { return await import(/* @vite-ignore */ VENDOR + url) }
  catch { return await import(/* @vite-ignore */ bare) }
}
const ed = await dep('noble-ed25519.js', '@noble/ed25519')
const nobleSha2 = await dep('sha2.js', '@noble/hashes/sha2.js')

// --- Buffer, in the four shapes engine.js actually asks for -----------------
// Measured, not guessed: from(bytes|string|hex), concat, alloc, subarray,
// toString('hex'). Anything else should throw loudly rather than quietly
// returning something plausible.
const HEXB = []
for (let i = 0; i < 256; i++) HEXB.push(i.toString(16).padStart(2, '0'))

class BufferShim extends Uint8Array {
  toString (enc) {
    if (enc === 'hex') {
      let out = ''
      for (let i = 0; i < this.length; i++) out += HEXB[this[i]]
      return out
    }
    if (enc === undefined || enc === 'utf8' || enc === 'utf-8') {
      return new TextDecoder().decode(this)
    }
    // latin1 is a BYTES-TO-STRING identity map, and the engine uses it that
    // way: signature cache keys are raw bytes stuffed into a string, never
    // text. Decoding them as utf8 would fold every invalid sequence onto
    // U+FFFD and quietly collide keys that differ.
    if (enc === 'latin1' || enc === 'binary') {
      let out = ''
      for (let i = 0; i < this.length; i += 4096) {
        out += String.fromCharCode.apply(null, this.subarray(i, Math.min(i + 4096, this.length)))
      }
      return out
    }
    throw new Error('engine-browser: unsupported encoding ' + enc)
  }
  subarray (a, b) { return new BufferShim(super.subarray(a, b)) }
  slice (a, b) { return new BufferShim(super.slice(a, b)) }
  // The engine draws survey markers out of hash bytes big-endian. Node's
  // Buffer is big-endian by method name; a DataView must be told, and getting
  // this backwards would put every marker in the world somewhere else while
  // still looking like it worked.
  readUInt32BE (off = 0) {
    return new DataView(this.buffer, this.byteOffset, this.byteLength).getUint32(off, false)
  }
  equals (o) {
    if (this.length !== o.length) return false
    for (let i = 0; i < this.length; i++) if (this[i] !== o[i]) return false
    return true
  }
}

const Buffer = {
  from (v, enc) {
    if (typeof v === 'string') {
      if (enc === 'hex') {
        if (v.length % 2) throw new Error('engine-browser: odd-length hex')
        const out = new BufferShim(v.length / 2)
        for (let i = 0; i < out.length; i++) out[i] = parseInt(v.substr(i * 2, 2), 16)
        return out
      }
      return new BufferShim(new TextEncoder().encode(v))
    }
    if (v instanceof Uint8Array) return new BufferShim(v)
    if (Array.isArray(v)) return new BufferShim(v)
    if (v && v.buffer instanceof ArrayBuffer) return new BufferShim(new Uint8Array(v.buffer, v.byteOffset, v.byteLength))
    throw new Error('engine-browser: cannot Buffer.from that')
  },
  concat (list, total) {
    let n = total
    if (n === undefined) { n = 0; for (const b of list) n += b.length }
    const out = new BufferShim(n)
    let o = 0
    for (const b of list) { if (o >= n) break; out.set(b.subarray(0, Math.min(b.length, n - o)), o); o += b.length }
    return out
  },
  alloc (n, fill) {
    const out = new BufferShim(n)
    if (fill !== undefined) out.fill(typeof fill === 'number' ? fill : 0)
    return out
  },
  isBuffer: (v) => v instanceof Uint8Array,
}

// --- the require the engine gets --------------------------------------------
// `crypto` is REFUSED on purpose. engine.js prefers Node's native crypto and
// falls through to noble when it is absent; throwing here is how we take that
// fall deliberately rather than by accident. The same choice makes the ed25519
// backend probe pick the pure-JS path.
function makeRequire () {
  return (name) => {
    if (name === '@noble/ed25519') return ed
    if (name === '@noble/hashes/sha2.js' || name === '@noble/hashes/sha2') return nobleSha2
    if (name === 'crypto' || name === 'node:crypto') {
      throw new Error('engine-browser: no node crypto here, and that is the point')
    }
    throw new Error('engine-browser: engine.js asked for an unexpected module: ' + name)
  }
}

let _engine = null
let _sourceHash = null

/**
 * Fetch engine.js as text and evaluate it against the shims above.
 * Returns the engine's module.exports -- the same object `require('./engine.js')`
 * yields in Node.
 */
export async function loadEngine (url = './engine.js') {
  if (_engine) return _engine
  // `document?.baseURI` is NOT enough: optional chaining guards a declared but
  // nullish value, not an undeclared identifier, and threw ReferenceError under
  // node before it could reach the fetch.
  const base = (typeof document !== 'undefined' && document.baseURI) || import.meta.url
  const res = await fetch(new URL(url, base).href, { cache: 'no-cache' })
  if (!res.ok) throw new Error('engine-browser: could not fetch ' + url + ' (' + res.status + ')')
  const src = await res.text()
  _sourceHash = await sha256Hex(new TextEncoder().encode(src))

  const module = { exports: {} }
  // A named function rather than eval so stack traces still say where they are,
  // and so `this` is undefined inside the engine exactly as it is under CJS.
  // eslint-disable-next-line no-new-func
  const factory = new Function('module', 'exports', 'require', 'Buffer', 'globalThis',
    '"use strict";\n' + src + '\n;return module.exports;')
  _engine = factory(module, module.exports, makeRequire(), Buffer, globalThis)
  if (typeof _engine.nextState !== 'function') {
    throw new Error('engine-browser: that did not look like the engine')
  }
  _engine.initCrypto?.()
  return _engine
}

/** sha256 of the engine text this window was actually given. */
export function engineSourceHash () { return _sourceHash }

/**
 * The rules hash covers SPEC.md, not engine.js, so this cannot prove the engine
 * matches the constitution -- nothing can, from in here. What it CAN do is let
 * a resident compare what one pillar served against what another did, which is
 * the only check that is worth anything and is worth exactly what Nought is.
 */
export async function sha256Hex (bytes) {
  const h = nobleSha2.sha256(bytes)
  let out = ''
  for (let i = 0; i < h.length; i++) out += HEXB[h[i]]
  return out
}

/**
 * §0: GIVE THE ENGINE ITS GEOGRAPHY.
 *
 * The engine FAILS CLOSED on an unregistered generator -- every tile reads as
 * blocked -- and it is right to, because a node that cannot compute the ground
 * is guessing about it. A window cannot import the worldgen (it is ESM
 * importing CommonJS, and bundling it would be a second copy that can drift),
 * so instead the pillar serves the ANSWERS: the same five pure functions,
 * evaluated once at the founding and packed into a table.
 *
 * This is not an approximation. `blocked`, `road` and `country` are total
 * functions of (g,x,y) over a fixed grid, so a table of their values IS the
 * function. The engine cannot tell the difference and there is none to tell.
 */
export function registerTerrainTable (E, table) {
  const { generator, w, h, spawn, geographyHash, biomes } = table
  const blocked = table.blocked, road = table.road, country = table.country
  const bit = (arr, x, y) => {
    const i = y * w + x
    return (arr[i >> 3] >> (i & 7)) & 1
  }
  const inB = (x, y) => x >= 0 && y >= 0 && x < w && y < h
  E.registerTerrain(generator, {
    // Out of bounds is blocked, which is what every generator says and what the
    // engine's own bounds checks assume.
    blocked: (g, x, y) => (inB(x, y) ? !!bit(blocked, x, y) : true),
    road: (g, x, y) => (inB(x, y) ? !!bit(road, x, y) : false),
    country: (g, x, y) => (inB(x, y) ? biomes[country[y * w + x]] : biomes[0]),
    spawn: () => ({ x: spawn.x, y: spawn.y }),
    geographyHash: () => geographyHash,
    // The engine reads this when deciding whether to check a founding's
    // committed geography against what this node draws. A table cannot draw
    // anything -- it repeats the hash it was handed -- so the check would
    // compare a number with itself and always pass. Saying so is honest;
    // leaving it undefined would have been the same behaviour by accident.
    _isProbing: () => true,
  })
}

/** Unpack the binary table the pillar serves. */
export function parseTerrainTable (buf, meta) {
  const w = meta.w, h = meta.h, bytes = new Uint8Array(buf)
  const bits = Math.ceil((w * h) / 8)
  return {
    generator: meta.generator, w, h, spawn: meta.spawn,
    geographyHash: meta.geographyHash, biomes: meta.biomes,
    blocked: bytes.subarray(0, bits),
    road: bytes.subarray(bits, bits * 2),
    country: bytes.subarray(bits * 2, bits * 2 + w * h),
  }
}

export { Buffer as BufferShim }
