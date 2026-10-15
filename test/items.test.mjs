// EVERYTHING THE WORLD CAN PUT IN A PACK MUST BE A THING THE WORLD CAN HOLD.
//
// `ITEMS` is not a manifest. It is the constitutional vocabulary, and it gates
// real behaviour: `carriedFrom` filters an inventory to it at a crossing, sets
// the weapon to null if the weapon is not in it, sums only its members out of
// the vaults, and `offer`, the shelves, the stalls, the hoards and every
// import check all refuse anything that is not in it.
//
// So a word that the engine PRICES, grants, drops or consumes, and that is not
// in `ITEMS`, is an item the world can mint and cannot keep. It survives
// ordinary play and vanishes at the first crossing, with nothing said.
//
// This has now happened three times:
//
//   `rod`         GATHER_TOOLS.fishing asked for one and it did not exist, so
//                 fishing was simply shut. See the long note at GATHER_TOOLS.
//   `sapling`     felling a grown grove hands one back so the grove can be
//                 replanted. Priced at 40, consumed by planting, not an item.
//   `hollow-bow`  a weapon with wield reqs, combat stats, a price and a place
//                 in two drop tables. Not an item.
//
// The last two were found by the HANDBOOK, which builds its vocabulary from
// PRICES, RECIPES, EQUIPPABLE and STACKABLE and so casts a wider net than
// ITEMS does. It printed a sapling with no picture, because the icon pipeline
// takes its list from ITEMS. A missing illustration is a poor alarm for
// silent permanent loss of a citizen's property, so this is the alarm.
import { test } from 'node:test'
import assert from 'node:assert/strict'
// THE DEFAULT IMPORT, NOT THE NAMESPACE. `engine.js` is CommonJS and the
// package is CommonJS, so `import * as E` gives only the named exports Node's
// lexer can pick out of it: 86 of the 173 there are, and PRICES, ITEMS and
// RECIPES are not among them. Every one of the checks below then ran over an
// empty list and passed, which is the shape of a test that cannot fail.
// `import E from` is `module.exports` itself, which is what handbook.mjs
// already does.
import E from '../engine.js'

// AND A TABLE THAT IS NOT THERE IS AN ERROR, never an empty list. See above:
// an absent table turned all four checks green over nothing.
const list = (name) => {
  const t = E[name]
  if (t == null) throw new Error(`engine.js exports no ${name}`)
  const out = t instanceof Set ? [...t] : Array.isArray(t) ? t : Object.keys(t)
  if (!out.length) throw new Error(`engine.js's ${name} is empty`)
  return out
}

test('everything the world prices is a thing the world can hold', () => {
  const stray = list('PRICES').filter((it) => !E.ITEMS.has(it)).sort()
  assert.deepEqual(stray, [],
    'priced but not constitutional, so a crossing destroys it: ' + stray.join(', '))
})

test('everything the world can equip is a thing the world can hold', () => {
  const stray = list('EQUIPPABLE').filter((it) => !E.ITEMS.has(it)).sort()
  assert.deepEqual(stray, [],
    'equippable but not constitutional, so carriedFrom nulls the weapon: '
    + stray.join(', '))
})

test('everything the world can stack is a thing the world can hold', () => {
  const stray = list('STACKABLE').filter((it) => !E.ITEMS.has(it)).sort()
  assert.deepEqual(stray, [], 'stackable but not constitutional: ' + stray.join(', '))
})

test('everything a recipe makes is a thing the world can hold', () => {
  const stray = list('RECIPES').filter((it) => !E.ITEMS.has(it)).sort()
  assert.deepEqual(stray, [], 'made but not constitutional: ' + stray.join(', '))
})

// AND THE SAME QUESTION ASKED OF THE SOURCE, not of the exported tables.
//
// A thing can be handed to a citizen by a line of the engine that no table
// names: the sapling arrives through `addItem(p.inventory, 'sapling', 1)` in
// the felling branch and nothing else in the world mentions it. The tables
// above would not have caught it on their own -- PRICES did, by luck.
//
// So the source is read for every literal the engine puts in a pack. This
// matches the call rather than guessing at names, and anything it finds that
// is not constitutional is the same bug.
test('every item the engine adds to a pack by name is constitutional', async () => {
  const { readFileSync } = await import('node:fs')
  const src = readFileSync(new URL('../engine.js', import.meta.url), 'utf8')
  const named = new Set()
  for (const m of src.matchAll(/\baddItem\s*\([^,]+,\s*'([a-z0-9-]+)'/g)) {
    named.add(m[1])
  }
  assert.ok(named.size > 0, 'no addItem call found: has the call been renamed?')
  const stray = [...named].filter((it) => !E.ITEMS.has(it)).sort()
  assert.deepEqual(stray, [],
    'the engine puts these in a pack and the world cannot hold them: '
    + stray.join(', '))
})
