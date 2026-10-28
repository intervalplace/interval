// §7ds: EVERY SIGN THE WORLD WRITES SHOULD BE READABLE, AND EVERY POST SHOULD
// HAVE SOMETHING ON IT.
//
// A hundred and eighty-eight nodes on the founded island carry a `text`: a
// hundred and seventy-five signposts, eight landmarks and three tollgates.
// That is a lot of authored writing -- "Bleakfell. The last roof. Past here
// the moor keeps its own hours." -- and none of it had ever been shown to
// anybody.
//
// It was two hundred and ten. Twenty locale posts went when the window began
// naming the locale you stand in (§7ed-iii): a post reading only "Bleakfell"
// said the strip's word in one tile of the few thousand the locale covers.
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

// §7ed-iii: AND NO POST SAYS ONLY WHERE YOU ARE.
//
// Twenty posts stood at the hearts of the locales reading "Bleakfell" and
// nothing else. The window now names the locale under your feet continuously,
// from the pillar's own answer, so the post said the strip's word in one tile
// out of the few thousand the locale covers.
//
// This is pinned because of HOW the removal went. The posts were seated in the
// middle of the generator; they were cut there; and the founded island still
// carried all twenty, because a second pass at the very end reseated every one
// of them and reported it as a repair. Counting the code found nothing and
// counting the island found it at once.
//
// THREE ARE ALLOWED and are named here. The Boneyard, the Sheepfolds and the
// High Delving are places whose own name IS the locale's name, because the
// locale was named after the place. There is no other name for those posts to
// say. The other four that read like this -- Cragfoot Scar, Deadman's Reach,
// Hollybarrow Chase, Whitechalk -- each had an authored name of its own that
// the post was throwing away, and say it now.
const NAMED_FOR_THEIR_PLACE = new Set(['the Boneyard', 'the Sheepfolds', 'the High Delving'])
test('no post says only the name of the locale it stands in', () => {
  const locales = WG.generatorFor(g).localesOf(g).map((L) => L.name)
  const bare = nodes.filter(([, n]) => n.type === 'signpost' && n.text
    && locales.includes(n.text.trim()) && !NAMED_FOR_THEIR_PLACE.has(n.text.trim()))
  assert.equal(bare.length, 0,
    `${bare.length} post(s) say only a locale's name, which the strip already `
    + 'says anywhere in the locale:\n  '
    + bare.map(([id, n]) => id + ': ' + n.text).join('\n  '))
  // and the names are still IN the world, which is the half that makes the
  // removal safe: the pillar serves them, so the window can say them
  assert.ok(locales.length > 10, `expected the island's locales; got ${locales.length}`)
})

// AND NO TWO POSTS ANYWHERE SAY THE SAME WORDS.
//
// This is the question that found the worst of it, and it is one line. Asked
// of the founded island it returned sixteen pairs of farms sharing a name
// (the name table was shorter than the seat table and the index wrapped),
// every bridge signed twice ten tiles apart, the Millbrook toll board posted
// twice eight tiles apart, and the High Delving and the Sheepfolds each
// standing TWICE as two separate built sites thirty tiles apart.
//
// Nothing could have caught any of it by reading the code: three different
// files, each correct on its own. §7ed-ii's milestone guard only ever compared
// stones on one road.
test('no two posts on the island say the same words', () => {
  const by = new Map()
  for (const [id, n] of nodes) {
    if (n.type !== 'signpost' || !n.text) continue
    const t = n.text.trim()
    if (!by.has(t)) by.set(t, [])
    by.get(t).push({ id, x: n.x, y: n.y })
  }
  const repeated = [...by.entries()].filter(([, ps]) => ps.length > 1)
  assert.deepEqual(repeated.map(([t]) => t), [],
    'these words are cut on more than one post:\n'
    + repeated.map(([t, ps]) => '  ' + JSON.stringify(t) + '\n'
        + ps.map((q) => '      ' + q.id + ' at ' + q.x + ',' + q.y).join('\n')).join('\n'))
})

// AND NO TWO FARMS SHARE A NAME, which is the same question asked of the
// thing the posts were naming. The generator's own guard throws at import, so
// this is the belt to that braces: it fails in the test run rather than in a
// founding somebody is watching.
test('no two holdings carry one name', () => {
  const H = WG.generatorFor(g).holdingsOf
    ? WG.generatorFor(g).holdingsOf(g)
    : []
  if (!H.length) return  // generator does not expose them; the import guard still holds
  const seen = new Map(), dup = []
  for (const h of H) {
    if (seen.has(h.name)) dup.push(h.name + ' at ' + h.x + ',' + h.y + ' and at ' + seen.get(h.name))
    else seen.set(h.name, h.x + ',' + h.y)
  }
  assert.deepEqual(dup, [], 'two farms cannot carry one name')
})

// §7ed-iv: AND THE PEOPLE HAVE NAMES, NOT INDICES.
//
// `keeperName` returned one of twenty-seven first names and nothing else, for
// a hundred and eleven of the island's hundred and fifty-seven keepers. The
// founded island carried three Zachariahs in Eastmere, three Delias in
// Anchor, two Tildas eight tiles apart, two Sims eight tiles apart, and Miles
// standing four tiles from Miles: fifteen pairs within a league, which is
// within sight.
//
// A real village does have four Johns. The difference is that they are John
// at the Mill and John Shorthand, and that is what the byname pools fix: the
// byname comes from the calling the world already decided for them, so it
// always fits the person.
//
// WITHIN A LEAGUE is the bar, not "never twice". Two Quill Skepwrights on
// opposite sides of the island is a world with two people of one name in it.
// Two in one street is a table being read with an index.
test('no two keepers within a league share a name', () => {
  const K = nodes.filter(([, n]) => n.type === 'keeper' && n.name)
  const by = new Map()
  for (const [id, n] of K) {
    if (!by.has(n.name)) by.set(n.name, [])
    by.get(n.name).push({ id, x: n.x, y: n.y })
  }
  const close = []
  for (const [nm, ps] of by)
    for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
      const d = Math.hypot(ps[i].x - ps[j].x, ps[i].y - ps[j].y)
      if (d <= 30) close.push(nm + ': ' + ps[i].id + ' and ' + ps[j].id
        + ', ' + Math.round(d) + ' tiles apart')
    }
  assert.deepEqual(close, [], 'these neighbours share a name')
})

// AND EVERY ONE OF THEM HAS A BYNAME. Oberon is the exception and is named
// here: he is the one person in the world who needs no second name.
test('every keeper is more than a first name', () => {
  const K = nodes.filter(([, n]) => n.type === 'keeper')
  const bare = K.filter(([, n]) => !n.name || (!n.name.includes(' ') && n.name !== 'Oberon'))
  assert.deepEqual(bare.map(([id, n]) => id + ': ' + (n.name ?? '(none)')), [],
    'these keepers carry a first name and nothing else, which is an index')
})
