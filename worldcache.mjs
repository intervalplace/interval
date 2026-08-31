// Interval: the founding cache.
// ===========================================================================
// `foundGenesis` and `buildWorld` are pure functions of a seed, and on this
// island they cost about three minutes between them to produce eight hundred
// kilobytes that parse back in seven milliseconds. Every node pays it on every
// start -- a pillar rebooting, and a door somebody opens out of curiosity, who
// waits three minutes at a blank page and concludes it does not work.
//
// Nothing here weakens what a node verifies. The cache is not a shortcut around
// computing the world: it is the SAME computation, remembered. A node that
// wants to redo it deletes the file, or sets INTERVAL_NO_CACHE=1.
//
// THE KEY IS THE WHOLE PROBLEM. A cache keyed on the seed alone is a fork
// waiting to happen: change one line in a generator and every cached node
// happily loads a world the code would no longer produce, disagrees with the
// network, and halts -- or worse, agrees with other stale nodes and splits the
// world in two. So the key covers everything that decides the answer:
//
//   * the genesis record, canonically encoded (seed, generator, size, rules
//     hash, imported citizens, anchor time)
//   * the bytes of every generator source file
//   * the engine's own version, since buildWorld returns engine structures
//
// Any of those moving is a cache miss, which is a slow start -- never a wrong
// world.
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'

const HERE = new URL('./', import.meta.url)

// Hashed once per process. Reading 1.4 MB of generator source is ~10ms against
// the three minutes it protects.
let _codeHash = null
function generatorHash () {
  if (_codeHash) return _codeHash
  const h = createHash('sha256')
  const dir = fs.readdirSync(new URL('.', HERE))
  for (const f of dir.filter((x) => /^worldgen.*\.mjs$/.test(x)).sort()) {
    h.update(f).update(fs.readFileSync(new URL(f, HERE)))
  }
  // engine.js defines the shapes buildWorld fills in; a change there can change
  // what a valid world looks like even when no generator moved.
  h.update(fs.readFileSync(new URL('engine.js', HERE)))
  _codeHash = h.digest('hex')
  return _codeHash
}

export function foundingKey (genesis, canonical) {
  return createHash('sha256')
    .update('interval-founding-v1\0')
    .update(generatorHash()).update('\0')
    .update(canonical(genesis))
    .digest('hex')
}

const cacheDir = (dataDir) => path.join(dataDir || '.', 'founding-cache')

// THE CACHE VERIFIES ITSELF, and this is not belt-and-braces.
//
// A world serialized and read back does NOT always hash the same as the world
// that was built: `buildWorld` emits nodes carrying a `kind` and a type that
// `canonical` normalizes, and on this island a cold build hashed bba084e4 while
// its own round-trip hashed 6e5cd94e. Whatever the cause -- it is under
// investigation and is a live divergence risk for checkpoints too, not just for
// this file -- a cache MUST NOT be the thing that discovers it in production.
//
// So the hash the state had when it was built is stored beside it, and a cached
// state that does not reproduce that hash is discarded and rebuilt. The cost of
// being wrong is three minutes; the cost of being wrong SILENTLY is a node that
// computes a different world from everybody else.
export function readFounding (genesis, { canonical, stateHash, dataDir, log = () => {} }) {
  if (process.env.INTERVAL_NO_CACHE) return null
  const key = foundingKey(genesis, canonical)
  const file = path.join(cacheDir(dataDir), key + '.json')
  try {
    const t0 = Date.now()
    const wrapped = JSON.parse(fs.readFileSync(file, 'utf8'))
    if (!wrapped || wrapped.v !== 1 || typeof wrapped.hash !== 'string') return null
    const state = wrapped.state
    if (stateHash) {
      const got = stateHash(state)
      if (got !== wrapped.hash) {
        log('founding cache REJECTED: it hashes ' + got.slice(0, 16)
          + ' but was written as ' + wrapped.hash.slice(0, 16) + '. Rebuilding.')
        try { fs.unlinkSync(file) } catch {}
        return null
      }
    }
    log('founding read from cache in ' + (Date.now() - t0) + 'ms'
      + ' (INTERVAL_NO_CACHE=1 to rebuild)')
    return state
  } catch { return null }
}

export function writeFounding (genesis, state, { canonical, stateHash, dataDir, log = () => {} }) {
  if (process.env.INTERVAL_NO_CACHE) return
  try {
    const key = foundingKey(genesis, canonical)
    const dir = cacheDir(dataDir)
    fs.mkdirSync(dir, { recursive: true })
    // Written to a temporary name and renamed, because a half-written cache
    // that happens to parse is the one failure mode worse than no cache.
    const file = path.join(dir, key + '.json')
    const tmp = file + '.' + process.pid + '.tmp'
    // The hash is taken from the state AS BUILT, so a read can prove the bytes
    // on disk still mean the same world.
    fs.writeFileSync(tmp, JSON.stringify({ v: 1, hash: stateHash ? stateHash(state) : null, state }))
    fs.renameSync(tmp, file)
    log('founding cached (' + (fs.statSync(file).size / 1024 / 1024).toFixed(1) + ' MB)')
  } catch (e) {
    // Never fatal. A node that cannot write a cache is a node that starts
    // slowly, which is what it did before this file existed.
    log('could not cache the founding: ' + e.message)
  }
}
