// A reference sparse merkle tree, for test/archive.test.mjs (spec §5g).
//
// WHY THIS FILE EXISTS SEPARATELY FROM engine.js
//
// The engine never builds a tree. It only ever VERIFIES a path somebody else
// supplies (`_smtProves`) and computes the root that would result from
// writing at that path (`_smtWith`); it holds `archiveRoot` and nothing more,
// because storing 2^64 slots is not a thing a node does. So a test that wants
// to say "the root the node computes is the root the world holds" needs an
// independent implementation to compute the other side of that sentence, and
// it must be an INDEPENDENT one. If this file imported the engine's folding,
// every archive test would be checking the engine against itself.
//
// It is therefore written from the constitution's description rather than
// from engine.js: the same four domain-separated hashes, the same bit order,
// the same compressed path encoding, arrived at from the spec.
//
// (This module was missing from the tree entirely -- archive.test.mjs could
// not load, so §5g had no coverage at all. Reconstructed from the engine's
// verifier contract: whatever this produces, `_smtProves` must accept.)
import crypto from 'node:crypto'

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex')

export const DEPTH = 64

// the empty subtree hash at each level: EMPTY[0] is an empty leaf, EMPTY[d]
// is a node with two empty children at d-1
const EMPTY = [sha('interval:smt:empty')]
for (let d = 1; d <= DEPTH; d++) EMPTY.push(sha('interval:smt:node' + EMPTY[d - 1] + EMPTY[d - 1]))

export const EMPTY_ROOT = EMPTY[DEPTH]

const node = (l, r) => sha('interval:smt:node' + l + r)
const leaf = (pid, digest) => sha('interval:smt:leaf' + pid + digest)

// bit d of the key, most-significant first: hex nibble d/4, bit 3-(d%4).
// A playerId is a public key and already uniform, so it is used unhashed.
const bit = (pid, d) => (parseInt(pid[Math.floor(d / 4)], 16) >> (3 - (d % 4))) & 1

export class Tree {
  #leaves = new Map()   // pid -> digest

  set(pid, digest) { this.#leaves.set(pid, digest); return this }
  del(pid) { this.#leaves.delete(pid); return this }
  has(pid) { return this.#leaves.has(pid) }
  get size() { return this.#leaves.size }

  // The hash of the subtree rooted at `level` whose path from the root is
  // `prefix` (an array of bits). Sparse: a subtree holding no leaf is the
  // precomputed empty hash for its level, which is what keeps this O(n·depth)
  // instead of O(2^64).
  #subtree(members, depth, level) {
    if (members.length === 0) return EMPTY[level]
    if (level === 0) {
      const pid = members[0]
      return leaf(pid, this.#leaves.get(pid))
    }
    const d = DEPTH - level          // the level index this split is on
    const left = [], right = []
    for (const pid of members) (bit(pid, d) ? right : left).push(pid)
    return node(this.#subtree(left, depth, level - 1), this.#subtree(right, depth, level - 1))
  }

  root() { return this.#subtree([...this.#leaves.keys()], 0, DEPTH) }

  // A proof for `pid`, in the engine's compressed encoding: a DEPTH-character
  // bitmap saying which levels have a non-empty sibling, followed by only
  // those siblings. `bits` is indexed by the same `d` the folder walks, so
  // bits[d] describes the sibling at depth d.
  //
  // Works for an ABSENT pid too, which is the point of a sparse tree: the
  // same path proves emptiness, and that is what `restore` verifies against.
  path(pid) {
    const members = [...this.#leaves.keys()]
    const bitsArr = new Array(DEPTH).fill('0')
    const sibs = []
    let live = members
    for (let d = 0; d < DEPTH; d++) {
      const mine = [], theirs = []
      for (const p of live) (bit(p, d) === bit(pid, d) ? mine : theirs).push(p)
      const sibHash = this.#subtree(theirs, 0, DEPTH - 1 - d)
      if (sibHash !== EMPTY[DEPTH - 1 - d]) { bitsArr[d] = '1'; sibs.push(sibHash) }
      live = mine
    }
    // the folder consumes siblings from the deepest level upward, so the
    // list is ordered leaf-first — the reverse of the walk above
    return { bits: bitsArr.join(''), sibs: sibs.reverse() }
  }
}
