// §7ds: EVERY SIGN THE WORLD WRITES SHOULD BE READABLE, AND EVERY POST SHOULD
// HAVE SOMETHING ON IT.
//
// Two hundred and ten nodes on the founded island carry a `text`: a hundred and
// ninety-nine signposts, eight landmarks and three tollgates. That is a lot of
// authored writing -- "Bleakfell. The last roof. Past here the moor keeps its
// own hours." -- and none of it had ever been shown to anybody.
//
// It was invisible structurally rather than by oversight. A node's options in
// the window come from the engine's affordance table, which lists what a VERB
// can do to a thing, and nothing in the engine reads a sign: there is no `read`
// input and there should not be, because reading changes nothing, costs no
// interval and files nothing. So a window waiting to be told about it waits for
// ever. It is answered window-side now, like `walk`.
//
// What this holds is the DATA, which is the half that can go wrong silently:
// the words have to be on the nodes, and a post with nothing on it is a post.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as WG from '../worldgen-any.mjs'

const g = WG.foundGenesis('interval-expanse-v7', 'solo-538',
  '6cde7f4e2631a1af4ff405cb51d1bf78f66ba3ec83531d18adee6599d8ca1cdd',
  1789813895202, 896, 512)
const world = WG.buildWorld(g)
const nodes = Object.entries(world.nodes ?? {})

test('the island is signposted, and not thinly', () => {
  const spoken = nodes.filter(([, n]) => typeof n.text === 'string' && n.text.length > 0)
  assert.ok(spoken.length > 150,
    `expected the island's writing; found ${spoken.length} nodes carrying words`)
  // and it is not all one type: the landmarks and the tollgates talk too
  const kinds = new Set(spoken.map(([, n]) => n.type))
  assert.ok(kinds.has('signpost') && kinds.has('tollgate'),
    `expected signposts and tollgates to speak; got ${[...kinds].join(', ')}`)
})

test('every settlement names itself on a post', () => {
  const G = WG.generatorFor(g)
  const said = nodes.filter(([, n]) => typeof n.text === 'string').map(([, n]) => n.text)
  for (const s of G.settlementsOf(g)) {
    const name = s.name ?? s.tag
    assert.ok(said.some((t) => t.toLowerCase().includes(String(name).toLowerCase())),
      `nothing on the island names ${name}, so a citizen who walks into it `
      + 'cannot find out where they are')
  }
})

// A POST WITH NOTHING ON IT, PINNED AT NINE.
//
// Nine signposts are seated with no words: five that a village drawing places
// after the hamlet's own sign has already gone up, and four at named places --
// the Gallows Oak, Wayfarer's Cross, Beggar's Bridge and the monument. Reading
// one says "Nothing is written on it", which is honest and is still a citizen
// walking to a named place and being told nothing.
//
// It is pinned rather than fixed because the words are the world's voice and
// not this test's to invent. What the number must not do is GROW: a new village
// drawing that seats a wordless post would otherwise add one silently, and the
// only symptom is a player reading a blank.
test('no more blank posts than the nine already known', () => {
  const blank = nodes.filter(([, n]) => n.type === 'signpost' && !n.text).map(([id]) => id)
  assert.ok(blank.length <= 9,
    `${blank.length} signposts have nothing written on them:\n  ` + blank.join('\n  '))
})

// §6bp-ii: A TALLY STICK IS SPLIT AND BOTH HALVES ARE KEPT.
//
// That is the whole of what the monument means: one half at Anchor, one across
// the water on Shrine Isle, and the founder's own key cut into the isle's half
// so the world's name is carved in the world. The island carried ONE half from
// the day v7 was written.
//
// It was seated and then swept. A landmark is clearable by several later
// passes -- the plough clears scrub, a holding sweeps its yard, a place
// corrects what it finds -- and not one of them can tell a tally from a tree
// stump. It is seated last now, after everything that clears ground.
//
// The symptom was nothing at all: a unique monument quietly absent looks
// exactly like a unique monument nobody has walked to, which is why this is a
// test and not a warning.
test('the First Tally has both its halves, and the isle bears the mark', () => {
  const halves = Object.entries(world.nodes ?? {})
    .filter(([, n]) => n.kind === 'tally-half')
  assert.equal(halves.length, 2,
    `a tally is split in two; found ${halves.length}: ${halves.map(([i]) => i).join(', ')}`)
  const isle = halves.find(([id]) => id === 'tally-isle')
  assert.ok(isle, 'the half on Shrine Isle')
  assert.equal(isle[1].founderKey, g.founderKey,
    "and it carries the founder's key, which is what makes it the FIRST tally")
  const anchor = halves.find(([id]) => id === 'tally-anchor')
  assert.ok(anchor, 'and the half at Anchor')
  // across water, which is the point: the two halves cannot be read together
  // without a boat
  assert.ok(Math.abs(isle[1].x - anchor[1].x) > 100,
    'the halves are meant to be far apart')
})
