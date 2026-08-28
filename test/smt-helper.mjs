// A reference sparse Merkle tree for the archive tests.
//
// This file was imported by `archive.test.mjs` and did not exist, so the whole
// suite failed to LOAD -- not one assertion in it had run for however long it
// has been missing. A test that cannot be imported is worse than a failing
// one: the runner reports a single error and the twelve things the file was
// guarding are simply unguarded.
//
// It is deliberately a SECOND implementation rather than a wrapper around the
// engine's. The engine's `_smtFold` and `_smtWith` are private, and a test that
// imported them would be asking the code whether it agrees with itself. This
// builds the tree the honest way -- hold every leaf, recompute the spine -- and
// the assertions in the test then compare that against what the engine derived
// incrementally. Two roads to the same root, which is the only comparison worth
// making.
//
// The three hashes below (node, leaf, and the bit that chooses a side) must
// match engine.js exactly; they are the constitution's, not this file's.
import E from '../engine.js'
import { createHash } from 'node:crypto'

const sha256 = (b) => createHash('sha256').update(b).digest()
const DEPTH = E.SMT_DEPTH

// the empty subtree hash at each height, bottom up
const EMPTY = (() => {
  const e = [sha256(Buffer.from('interval:smt:empty')).toString('hex')]
  for (let d = 1; d <= DEPTH; d++)
    e.push(sha256(Buffer.from('interval:smt:node' + e[d - 1] + e[d - 1])).toString('hex'))
  return e
})()

const node = (l, r) => sha256(Buffer.from('interval:smt:node' + l + r)).toString('hex')
const leafOf = (pid, digest) => sha256(Buffer.from('interval:smt:leaf' + pid + digest)).toString('hex')
// the slot a citizen occupies: the first bits of their id, which is a public
// key and therefore already uniform
const bitOf = (pid, d) => (parseInt(pid[Math.floor(d / 4)], 16) >> (3 - (d % 4))) & 1

export class Tree {
  constructor() { this.leaves = new Map() }   // pid -> leaf hash

  set(pid, digest) { this.leaves.set(pid, leafOf(pid, digest)); return this }
  del(pid) { this.leaves.delete(pid); return this }

  // The hash of the subtree rooted at `prefix`, computed from whatever leaves
  // fall under it. It descends only where a leaf actually lives: a sparse tree
  // is sixty-four levels deep, so walking both children unconditionally is
  // 2^64 nodes and never returns. An empty subtree is a constant, and a
  // subtree holding one leaf is that leaf folded up through empties.
  #sub(prefix, under) {
    const d = prefix.length
    if (under === undefined) under = [...this.leaves.keys()]
    if (under.length === 0) return EMPTY[DEPTH - d]
    if (d === DEPTH) return this.leaves.get(under[0])
    if (under.length === 1) {
      // one leaf: fold it to this height against empty siblings
      const pid = under[0]
      let h = this.leaves.get(pid)
      for (let k = DEPTH - 1; k >= d; k--)
        h = bitOf(pid, k) ? node(EMPTY[DEPTH - 1 - k], h) : node(h, EMPTY[DEPTH - 1 - k])
      return h
    }
    const left = [], right = []
    for (const pid of under) (bitOf(pid, d) ? right : left).push(pid)
    return node(this.#sub([...prefix, 0], left), this.#sub([...prefix, 1], right))
  }

  root() { return this.#sub([]) }

  // the compressed proof for `pid`: a bitmap of which levels have a non-empty
  // sibling, then only those siblings -- the same shape the engine folds.
  path(pid) {
    let bits = '', sibs = []
    for (let d = 0; d < DEPTH; d++) {
      const prefix = []
      for (let i = 0; i < d; i++) prefix.push(bitOf(pid, i))
      const under = [...this.leaves.keys()].filter(k =>
        prefix.every((b, i) => bitOf(k, i) === b) && bitOf(k, d) === (bitOf(pid, d) ^ 1))
      const sib = this.#sub([...prefix, bitOf(pid, d) ^ 1], under)
      if (sib === EMPTY[DEPTH - 1 - d]) bits += '0'
      else { bits += '1'; sibs.push(sib) }
    }
    // the engine folds leaf-to-root, so the siblings are given in that order
    return { bits, sibs: sibs.reverse() }
  }
}

export { EMPTY, DEPTH }
