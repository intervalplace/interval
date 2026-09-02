// §21e: A WORLD MUST SURVIVE ITS OWN SERIALIZATION.
//
// `canonicalNodes` memoises a node's bytes by object identity. Anything that
// edits a node IN PLACE after the world has been canonicalised leaves the memo
// holding what the node used to be — so the built world and its own
// round-trip hash differently, and a node that checkpoints and reloads computes
// a different world from one that stayed up.
//
// Three passes in worldgen-expanse7 did exactly that, all after
// `validateState(w)` had already populated the memo: the waystone conversion,
// the crier conversion, and the pass that turns real trees into scenery. That
// last one is the reason the island has schelling points for resources and
// decorative oaks everywhere else, so it is not going away — it just has to
// replace nodes instead of editing them.
//
// Nothing round-tripped a FRESHLY BUILT world before this, which is why the
// existing persistence and clone-equivalence suites never saw it: they test
// states the engine produced, and the memo is only populated during founding.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import E from '../engine.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// The full island costs ~80s to build. The invariant is about node REPLACEMENT
// discipline, which a source check catches instantly and on every generator —
// so this suite reads the code, and the expensive build is exercised by
// `npm run test:founding` (below) when the generators change.
test('no generator edits a node in place', () => {
  const bad = []
  for (const f of fs.readdirSync(root).filter((x) => /^worldgen.*\.mjs$/.test(x))) {
    const src = fs.readFileSync(path.join(root, f), 'utf8')
    src.split('\n').forEach((line, i) => {
      if (line.trim().startsWith('//')) return
      // `n.type = ...`, `n.kind = ...`, `delete n.kind` on a node reference
      if (/^\s*(delete\s+)?\bn\.(type|kind|text|name)\b\s*(=|;)/.test(line)) {
        bad.push(`${f}:${i + 1}: ${line.trim().slice(0, 64)}`)
      }
    })
  }
  assert.deepEqual(bad, [],
    'a node whose bytes are memoised must be REPLACED, not edited:\n' + bad.join('\n'))
})

test('the memo is the only thing the clone mode changes about a hash', () => {
  const src = fs.readFileSync(path.join(root, 'engine.js'), 'utf8')
  const fn = src.match(/function canonicalNodes[\s\S]*?\n\}/)[0]
  assert.match(fn, /_canonNodeCache\.get\(n\)/, 'the memo exists')
  assert.match(fn, /m !== 'cow' && m !== 'dirty'/,
    'and is only consulted in the modes where nodes survive an interval')
})

// The real thing, on a small world: build, serialize, compare. This is the
// check that would have caught it, and it is cheap at this size.
test('a built world hashes the same as its own round-trip', () => {
  const g = E.makeGenesis('founding-roundtrip', 'a'.repeat(64), 0, 60, 40)
  const w = E.newWorld(g)
  E.addNode(w, 'a-tree', 'tree', 5, 5)
  E.addNode(w, 'a-smith', 'smith', 7, 5)
  E.stateHash(w)                                 // populates the NODE memo
  // The shape of every worldgen late pass: change what a node IS. Replaced,
  // not edited. The STATE is a fresh object too, because `stateHash` memoises
  // by state identity as well — its own comment says any in-place change must
  // happen before the state is first hashed, and every engine call site
  // replaces rather than mutates.
  const w2 = { ...w, nodes: { ...w.nodes,
    'a-tree': { ...w.nodes['a-tree'], type: 'landmark', kind: 'old-oak' } } }
  const h2 = E.stateHash(w2)
  const rt = JSON.parse(JSON.stringify(w2))
  assert.equal(E.stateHash(rt), h2,
    'a world must hash the same after a round-trip as before it')
})

test('editing a node in place is what breaks it', () => {
  // Pinned as a DEMONSTRATION: if this ever stops being true the memo has
  // changed, and the replacement discipline above may no longer be needed.
  const g = E.makeGenesis('founding-inplace', 'a'.repeat(64), 0, 60, 40)
  const w = E.newWorld(g)
  E.addNode(w, 'a-tree', 'tree', 5, 5)
  E.stateHash(w)                                  // memoises the node's bytes
  w.nodes['a-tree'].type = 'landmark'             // the fault, in one line
  w.nodes['a-tree'].kind = 'old-oak'
  const w2 = { ...w, nodes: { ...w.nodes } }      // fresh STATE, same node object
  const built = E.stateHash(w2)
  const rt = E.stateHash(JSON.parse(JSON.stringify(w2)))
  const mode = process.env.INTERVAL_CLONE || 'cow'
  if (mode === 'cow' || mode === 'dirty') {
    assert.notEqual(built, rt,
      'in-place editing after hashing diverges — this is why generators replace')
  } else {
    assert.equal(built, rt, 'with the memo off, in-place editing is harmless')
  }
})
