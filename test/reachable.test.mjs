// EVERY VERB A PLACE AFFORDS MUST BE REACHABLE BY A MOUSE.
//
// The window draws its menus from tables it derives out of the engine, which
// is the right way round and is why a new verb appears in the menu without
// anybody editing the window. What it cannot derive is whether the row it
// draws can actually be FILLED: a deed names fields, each row of a menu knows
// some of them, and a verb whose fields no row covers is offered and then
// silently thrown away.
//
// WHAT THAT COST, found by hand after the furnace was reported missing.
// `stoke` and `brew` are the only two deeds in the world whose schema wants
// both a node and a slot. A node row knows the furnace and has no slot, so
// `CanFile` dropped it. A pack row knew the slot and filed the deed with no
// node at all, which the world types as required -- so the deed was malformed
// before it was judged, and a malformed deed never becomes an event. The coal
// in the pack grew a "stoke" line at the furnace, the line was clicked, and
// nothing happened: no smelting, and no refusal in the feed to say why. The
// rule had been in the engine the whole time, complete with its own
// experience, its fuel values and a cold furnace that will not smelt.
//
// So this test asks the question the window cannot ask itself: for every verb
// every node affords, is there a row that can file it. The rules below are
// read off the window's own source, and each one says where it came from, so
// a change on either side shows up here rather than as a dead menu line.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, rmSync } from 'node:fs'

// THE DERIVED TABLES, WHICH MEANS RUNNING THE DERIVATION.
//
// `affordances`, `verbTargets` and `itemAffordances` are not exported, and
// importing the bridge whole opens the door Unreal knocks on and then reaches
// for the world: a socket nothing closes, so a test runner would hang rather
// than fail. So the module is taken up to the door -- everything above it is
// declaration -- and imported from beside the original, where its own relative
// imports resolve.
const HERE = new URL('../', import.meta.url)
const SRC = readFileSync(new URL('unreal-bridge.mjs', HERE), 'utf8')
const CUT = SRC.indexOf('// ---------- the local door Unreal knocks on ----------')
assert.ok(CUT > 0, 'the bridge should still open its door under that heading')
const PROBE = new URL('.reachable-probe.mjs', HERE)
writeFileSync(PROBE, SRC.slice(0, CUT) + '\nexport { affordances, verbTargets, itemAffordances, fuelsByNode }\n')
let AFFORDS, SCHEMA, ITEMS, TAKES
try {
  const M = await import(PROBE.href)
  AFFORDS = M.affordances()
  SCHEMA = M.verbTargets()
  ITEMS = M.itemAffordances()
  TAKES = M.fuelsByNode()
} finally {
  rmSync(PROBE, { force: true })
}
const FIELDS = SCHEMA.fields ?? SCHEMA
const TARGET = SCHEMA.target ?? {}

const HAND = readFileSync(new URL(
  'Plugins/IntervalBridge/Source/IntervalBridge/Private/IntervalHand.cpp',
  new URL('../interval/', HERE)), 'utf8')

// WHICH VERBS GET A SECOND PAGE, read off `ChoicesFor` rather than listed.
const PAGED = new Set([...HAND.matchAll(/Verb == TEXT\("([a-z_]+)"\)/g)].map((m) => m[1]))
// AND WHICH OPEN A BOX FOR A FIGURE, read off the `Figures` table.
// The table is column-aligned, so the gap between the verb and its field is
// whatever lines the braces up: matching a single space quietly found none of
// them and reported three verbs as unreachable that are not.
const FIGURES = new Set([...HAND.matchAll(
  /\{ TEXT\("[a-z_]+"\),\s*\{ TEXT\("([a-z]+)"\),\s*TEXT\("[^"]*\?"\)/g)].map((m) => m[1]))
assert.ok(FIGURES.size >= 3,
  'the Figures table should still name the numbers the window asks for; found '
  + JSON.stringify([...FIGURES]))

// A VERB THAT NAMES BOTH A PLACE AND A SLOT, which is the shape that broke.
// Such a verb belongs on the PLACE, with a page that names the thing out of
// the pack -- so the node's row supplies the slot after all, through the page.
// Read off the window rather than assumed: the branch is keyed on the SHAPE of
// the verb and not on its name, so a third such deed is handled the day it is
// written, and a window that loses the branch fails here.
const PAGES_PLACE_AND_SLOT = HAND.includes('Bridge->NamesPlaceAndSlot(Verb)')
const PLACE_AND_SLOT = new Set(Object.entries(SCHEMA.fields ?? SCHEMA)
  .filter(([, f]) => Array.isArray(f) && f.includes('slot') && f.includes('nodeId'))
  .map(([v]) => v))

// WHAT EACH KIND OF ROW CAN FILL IN BY ITSELF. From `CanFile` in
// IntervalBridgeSubsystem.h, which is the window's own answer to this
// question. `style` rides along on a blow; the figures open a box.
const ALWAYS = new Set(['style', ...FIGURES])
const ROWS = {
  // A row aimed at a thing in the world puts that thing's id in, whichever
  // word the schema spells it with. See `TargetFieldFor`.
  node: { has: new Set([...ALWAYS]), aims: true },
  pack: { has: new Set([...ALWAYS, 'slot', 'gear']), aims: false },
  drop: { has: new Set([...ALWAYS, 'groundId', 'confirm']), aims: false },
  vault: { has: new Set([...ALWAYS, 'item', 'qty']), aims: false },
}

// Whether a verb gets a second page, which is what lets a row hand over a word
// or a slot it does not otherwise know.
const pages = (verb) => PAGED.has(verb)
  || (PAGES_PLACE_AND_SLOT && PLACE_AND_SLOT.has(verb))
// AND THE WORDS A MENU LINE CARRIES, for a verb that has a second page.
// `consign` is the one that names a LIST rather than a word, and its page
// offers the whole pack as one line. See `Consign`.
const CHOSEN = ['item', 'recipe', 'make', 'look', 'target', 'slots', 'slot']

function reachable (verb) {
  const need = FIELDS[verb]
  if (!Array.isArray(need)) return true          // no schema known: the world decides
  const points = TARGET[verb]
  const aim = Array.isArray(points) ? points : (points ? [points] : [])
  for (const [row, R] of Object.entries(ROWS)) {
    // A pack row is only drawn for a verb about a thing in the pack.
    if (row === 'pack' && !need.includes('slot')) continue
    const ok = need.every((f) => R.has.has(f)
      || (R.aims && aim.includes(f))
      || (pages(verb) && CHOSEN.includes(f)))
    if (ok) return true
  }
  return false
}

test('every verb a node affords can be filed from some row', () => {
  const lost = []
  for (const [place, verbs] of Object.entries(AFFORDS)) {
    for (const v of verbs) {
      if (!reachable(v)) {
        lost.push(`${v} at ${place} wants ${JSON.stringify(FIELDS[v])}`)
      }
    }
  }
  assert.deepEqual(lost, [],
    'these verbs are offered and cannot be filed:\n  ' + lost.join('\n  '))
})

// AND THE TWO THAT BROKE, BY NAME.
//
// A count can be satisfied by the rules above drifting as easily as by the
// window being right, so the pair that actually failed is named. If a third
// deed ever wants both a place and a slot it joins them here, and the window
// handles it already: both the page and the routing are keyed on the shape of
// the verb rather than on its name.
test('a deed that names both a place and a slot is drawn on the place', () => {
  assert.deepEqual([...PLACE_AND_SLOT].sort(), ['brew', 'stoke'])

  // 1. THE PAGE IS ON THE PLACE. `ChoicesFor` must answer for a node row, or
  //    the verb has no way to name which fuel.
  assert.ok(PAGES_PLACE_AND_SLOT,
    'ChoicesFor must offer a page for a verb that names a place and a slot, '
    + 'or there is no way to choose the fuel at the fire')
  const page = HAND.slice(HAND.indexOf('// WHICH FUEL, AT THE FIRE THAT WAS POINTED AT.'))
  assert.match(page.slice(0, 2600), /TakenAt\(Verb, Target\.Type, Target\.Sub\)/,
    'the page must list only what THIS kind of place takes, asked by the finer '
    + 'word first')

  // 2. AND IT IS KEPT OFF THE PACK'S ROWS, which is the whole of the user's
  //    point: the fire is the thing clicked, so the wrong fire cannot be fed.
  const packrow = HAND.slice(HAND.indexOf('// AND WHAT THE GROUND UNDERFOOT ALLOWS'))
  assert.match(packrow.slice(0, 2000), /NamesPlaceAndSlot\(Allowed\)/,
    'a ground verb that also names a place must not be drawn on the pack, or '
    + 'a citizen between two fires can feed the one they did not mean')

  // 3. AND THE SLOT IS SENT AS A NUMBER. The world types it as an integer, so
  //    a slot sent as a word is malformed before it is judged -- which is the
  //    original fault, in a different place.
  const tail = HAND.slice(HAND.indexOf('// ---- A SLOT IS A NUMBER, NOT A WORD ----'))
  assert.match(tail.slice(0, 1400), /Figures\.Add\(TEXT\("slot"\), FCString::Atoi/,
    'the slot chosen on the page must be filed as a number')
})

// AND WHAT EACH FIRE TAKES IS DERIVED, not written down anywhere.
test('what each place takes is read off the engine, and nothing else is offered', () => {
  // §7r: the furnace burns coal and charcoal. §7dd: a log or a coal banks the
  // watchfire. Read against the engine so a fifth wood is not missed.
  const ENGINE = readFileSync(new URL('engine.js', HERE), 'utf8')
  const logs = [...(ENGINE.match(/const LOG_KINDS = \[([^\]]*)\]/)[1])
    .matchAll(/'([a-z-]+)'/g)].map((m) => m[1])
  assert.ok(logs.length >= 4, 'the engine should still name its log kinds')

  assert.deepEqual(TAKES.stoke?.furnace?.slice().sort(), ['charcoal', 'coal'])
  assert.deepEqual(TAKES.stoke?.watchfire?.slice().sort(),
    ['coal', ...logs].sort())
  assert.deepEqual(TAKES.brew?.smokerack, ['eel'])
  for (const into of ['grain', 'saltpetre', 'raw-fish', 'deep-fish', 'eel']) {
    assert.ok(TAKES.brew?.brewpot?.includes(into),
      `a brewpot should take ${into}`)
  }

  // AND NOTHING THAT IS NOT FUEL, anywhere. This is what keeps "stoke" off a
  // loaf of bread, and it is checked across the whole table rather than at the
  // one place somebody thought of.
  const everything = Object.values(TAKES)
    .flatMap((places) => Object.values(places).flat())
  for (const not of ['bread', 'iron-sword', 'sigil', 'gold-bar']) {
    assert.ok(!everything.includes(not),
      `${not} is not fuel or an ingredient and must not be offered as one`)
  }

  // AND THE FUELS ARE NOT ON THE ITEM'S OWN ROW EITHER, because that is the
  // arrangement that let the wrong fire be fed.
  const affords = (item) => {
    const v = ITEMS[item]
    return v ? (v.has ? [...v] : v) : []
  }
  for (const fuel of ['coal', 'charcoal', ...logs]) {
    assert.ok(!affords(fuel).includes('stoke'),
      `${fuel} must not afford stoke from the pack: stoking belongs to the fire`)
  }
})
