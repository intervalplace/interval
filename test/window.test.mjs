// The web window is 15,000 lines of client that nothing checks. These are the
// faults that hide there: a skill name the engine retired (the verb silently
// disappears), a duplicate key in an object literal (the last one wins), and a
// threshold that drifted from the engine's.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
// §7eb: the one place the inland waters are written down. `terrain-mirror.mjs`
// imports them for the same reason; `site/map.html` cannot, and that is the
// gap the last test in this file exists to watch.
import { WATERS, BECKS } from '../worldgen-water-v7.mjs'

// Suites live beside engine.js in the repo. In this archive they are in
// test/, so root walks up one. Delete this line when you drop them in.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const win = fs.readFileSync(path.join(root, 'window-web.html'), 'utf8')
const eng = fs.readFileSync(path.join(root, 'engine.js'), 'utf8')
const TRADES = [...eng.match(/const SKILLS = \[([\s\S]*?)\];/)[1]
  .matchAll(/'([a-z]+)'/g)].map((m) => m[1])

test('the client reads no skill the engine retired', () => {
  // §5m merged eighteen skills into nine. A client reading `skills.mining`
  // gets undefined, falls to level one, and the gate it guards can never open
  // -- so a whole verb vanishes with no error anywhere.
  // Comments may name a retired skill to explain what was repealed; code may not.
  const code = win.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n')
  const read = new Set([...code.matchAll(/skills\??\.([a-z]+)/g)].map((m) => m[1]))
  const dead = [...read].filter((s) => !TRADES.includes(s))
  assert.deepEqual(dead, [], `retired skills still read by the client: ${dead}`)
})

test('every trade has its own cape colour', () => {
  const blk = win.match(/const CAPE_COLORS = \{([\s\S]*?)\n\}/)[1]
  const keys = [...blk.matchAll(/^\s*([a-z]+):/gm)].map((m) => m[1])
  assert.equal(keys.length, new Set(keys).size,
    'a duplicate key in an object literal is silently the last one')
  assert.deepEqual(keys.slice().sort(), TRADES.slice().sort())
  const cols = [...blk.matchAll(/'(#[0-9a-f]{6})'/g)].map((m) => m[1])
  assert.equal(cols.length, new Set(cols).size, 'two trades must not wear one colour')
})

test('the cape arrives at mastery, not a level early', () => {
  // §4b: mastery is one hundred. The last level alone is near a seventh of the
  // whole ascent, so a cape at ninety-nine is very early indeed.
  const capeOf = win.match(/function capeOf[\s\S]*?\n\}/)[0]
  assert.match(capeOf, /XP_TO_LVL\(xp\) >= 100/)
  assert.equal(/>= 99\b/.test(capeOf), false)
})

test('mounted means carrying and nothing else', () => {
  const fn = win.match(/function mountedNow[\s\S]*?\n\}/)[0]
  assert.match(fn, /return !!p\.consignment/, 'the consignment is the whole rule')
  assert.equal(/onRoadE/.test(fn), false, 'the road no longer puts anyone on a horse')
  // The linger existed only to smooth road tiles clipping on and off. A
  // consignment is a discrete state, so there is nothing left to smooth.
  assert.equal(/MOUNT_LINGER|_rodeAt/.test(fn), false)
  assert.match(fn, /_fellOffAt/, 'but a rider still gets down to fight')
})

test('tap and right-click offer one list', () => {
  // Two option builders would drift, and a citizen would be learning two
  // worlds. `chooseAction` is the only place a verb list is made.
  assert.equal([...win.matchAll(/function chooseAction/g)].length, 1)
  const fn = win.match(/function chooseAction[\s\S]*?\n\}/)[0]
  assert.match(fn, /floatMenu\(opts, where\)/, 'the pointer path takes the same opts')
  assert.match(win, /addEventListener\('contextmenu'/, 'right-click is wired')
  assert.match(win, /_menuAt = \{ x: e\.clientX, y: e\.clientY \}/)
  // and the tap path is untouched: the bar is still what a thumb gets
  assert.match(fn, /getElementById\('choosebar'\)/)
})

test('the pointer menu can always be dismissed', () => {
  // A menu that outlives its context covers the world it is about.
  for (const ev of ['pointerdown', 'keydown', 'wheel', 'blur']) {
    assert.match(win, new RegExp(`addEventListener\\('${ev}'`), `${ev} closes it`)
  }
})

// AND NO ITEM THE ENGINE DOES NOT HAVE.
//
// The same fault as the retired skill, one table over, and it had been sitting
// in the client for as long as the `star-` to `quick-` rename. Sixteen gear ids
// the world no longer has: a badge for wearing `star-*`, keyed on a prefix
// nothing starts with, so nobody could ever earn it; a forge entry for
// `star-ingot` out of `magic-stone`; a `star-crossbow` in the two-handed set;
// and `steel-ingot`, which this world has NEVER had, counted in the pack as
// the barb's second ingredient. That last one made the barb unmakeable through
// this window for everyone, with the menu patiently explaining that they
// needed a thing no citizen can hold.
//
// None of it threw. A client that asks for an item that does not exist gets a
// count of nought and a menu entry that never lights, which is exactly the
// shape of bug that survives a year of play.
//
// ONLY GEAR IS CHECKED, by the suffix of the id. The window has plenty of
// hyphenated ids of its own that the engine rightly knows nothing about:
// landmark kinds (`standing-stone`), icon aliases (`gold-coin`), themes and
// storage keys. A rule wide enough to catch those would be turned off inside a
// week. A thing you WIELD or WEAR is the engine's to name.
const GEAR = /-(sword|mell|plate|helm|dagger|spear|javelin|flail|shield|ingot|alloy|grit|hatchet|pickaxe|legs|chain|clad)$/

test('the client names no gear the engine does not have', () => {
  const known = new Set()
  for (const m of eng.matchAll(/'([a-z][a-z0-9]*(?:-[a-z0-9]+)+)'/g)) known.add(m[1])
  const named = new Set([...win.matchAll(/'([a-z][a-z0-9]*(?:-[a-z0-9]+)+)'/g)].map((m) => m[1]))
  const dead = [...named].filter((i) => GEAR.test(i) && !known.has(i))
  assert.deepEqual(dead, [],
    `the window names gear engine.js never mentions: ${dead.join(', ')}`)
})

// AND NO INPUT TYPE THE ENGINE WILL NOT ACCEPT.
//
// The window built `{ type: 'special', ... }` for the burst. The engine renamed
// that verb `gambit` and the SDK, the bridge and the server all followed; this
// file did not. `validateInputShape` answers "unknown input type", so the burst
// was refused at the door in the browser window and worked everywhere else.
//
// The comment beside that line already records the SAME failure one layer up:
// "the window sent `special` from the ring menu and the bridge had no line for
// it, so it answered 'no wiring for special yet' and swallowed the only
// interesting decision in a fight." It was written, fixed, and then happened
// again underneath, because nothing checked.
//
// Read off the `{ type: '...' }` literals, which is how this window builds
// every input it sends.
import { createRequire } from 'node:module'
const E = createRequire(import.meta.url)(path.join(root, 'engine.js'))

test('every input a served window builds is one the engine will accept', () => {
  const base = {
    playerId: 'a'.repeat(64), worldId: 'b'.repeat(64), tick: 1, sig: 'c'.repeat(128),
  }
  // EVERY WINDOW THE ROUTER OFFERS, not just this one. Three of the others had
  // the same class of fault: `window-diablo.html` could not burst, sell or
  // transmute and `window-3d.html` still offered to attune to a waystone the
  // world has not had since v6.
  const served = [...fs.readFileSync(path.join(root, 'serve.mjs'), 'utf8')
    .matchAll(/sendFile\('\.\/(window-[a-z0-9-]+\.html)'/g)].map((m) => m[1])
  assert.ok(served.length >= 6, `expected the router's windows; found ${served.length}`)

  // Two shapes, because the windows do not agree on one: a conditional chain
  // (`a.do === 'x' ? { type: 'y' ... }`) and a run of early returns
  // (`if (d === 'x') return { type: 'y' ... }`). A transport frame is built
  // neither way, which is what keeps `auth` and `chat` out of this.
  const SHAPES = [
    /a\.do === '[a-z_]+'\s*\?\s*\{\s*type:\s*'([a-z_]+)'/g,
    /if \(d === '[a-z_]+'\) return \{ type: '([a-z_]+)'/g,
  ]
  const bad = []
  for (const f of new Set(served)) {
    const p = path.join(root, f)
    if (!fs.existsSync(p)) continue
    const t = fs.readFileSync(p, 'utf8')
    const sent = new Set()
    for (const re of SHAPES) for (const m of t.matchAll(re)) sent.add(m[1])
    for (const type of sent) {
      if (E.validateInputShape({ ...base, type }) === 'unknown input type') {
        bad.push(`${f} sends \`${type}\`, which the engine answers with "unknown input type"`)
      }
    }
  }
  assert.deepEqual(bad, [], bad.join('\n'))
})

// AND THE WINDOWS' OWN COPY OF THE WATER MUST MATCH THE MIRROR'S.
//
// `terrain-mirror.mjs` is held to the generator tile for tile by
// `mirror.test.mjs`. Two windows do not use it: they inline their own copy of
// the v7 water, which is the right call for a single file with no imports and
// the wrong one to leave unchecked. When `inlandSet` moved off `Math.sin` (§2s)
// the generator and the mirror moved together and both windows were left
// drawing the old shoreline, which nothing would have reported: a window that
// paints a pool where there is grass looks fine until somebody walks at it.
//
// Checked on the numbers rather than the text, because the three copies name
// their variables differently and always will. If the window agrees with the
// mirror and the mirror agrees with the world, the window agrees with the
// world.
test('the windows draw the same inland water as the tested mirror', () => {
  // ANCHORED ON THE LAKE'S OWN TAG. All three files also draw the ISLES with
  // `meander(..., u / 6, 6, 11)`, at different divisors, and a pattern that
  // merely looks for that shape finds the isles first and compares the wrong
  // coastline. The lake block is the one that opens `const tag = 9100`.
  const shape = (src, what) => {
    const at = src.indexOf('const tag = 9100')
    assert.ok(at !== -1, `${what} has no v7 inland-water block`)
    const blk = src.slice(at, at + 900)
    const tag = blk.match(/const tag = (\d+) \+ \w+ \* (\d+)/)
    const m = blk.match(/u \/ 6, 6, 11\) \/ (\d+)[\s\S]{0,160}?u \/ 6, 3, 5\) \/ (\d+)/)
    const rough = blk.match(/% 100\) \/ 100 - 0\.5\) \* (0\.\d+)/)
    assert.ok(m, `${what} has no meander-built shoreline`)
    assert.ok(rough, `${what} has no per-tile roughness`)
    return [m[1], m[2], tag[1], tag[2], rough[1]].join('/')
  }
  const mirror = shape(fs.readFileSync(path.join(root, 'terrain-mirror.mjs'), 'utf8'), 'terrain-mirror.mjs')
  for (const f of ['window-web.html', 'window-diablo.html']) {
    const src = fs.readFileSync(path.join(root, f), 'utf8')
    assert.equal(shape(src, f), mirror,
      `${f} draws a different shoreline from the one mirror.test.mjs holds to the world`)
  }
})

// ---- AND THE CHART'S COPY OF THE INLAND WATERS ----
//
// The test above covers `window-web.html` and `window-diablo.html` and stops
// there. `site/map.html` is a FOURTH copy of the geography and was covered by
// nothing, which is how it came to be missing a river.
//
// WHAT WAS WRONG. `worldgen-water-v7.mjs` holds nineteen named waters and six
// becks, and `terrain-mirror.mjs` imports them rather than copying them, for
// the reason written at the top of that file. The chart cannot import: it is a
// single page served to a browser with a plain `<script>`, so it inlines the
// tables as `W7` and `B7`. The world gained a sixth beck and the inlined copy
// kept five -- and the missing one, the Drowning Beck, runs down the far west
// of the island, so the chart drew the Wilds with no water running through
// them. The page's own prose said "five becks" too, because it was written
// from the copy rather than from the world.
//
// Nothing could have caught it. The shoreline check above is about the lake's
// meander constants and would pass with every beck deleted.
test('the chart draws the same inland waters as the world', () => {
  const map = fs.readFileSync(path.join(root, 'site', 'map.html'), 'utf8')
  // FOUND BY HAND RATHER THAN BY A PATTERN. A regular expression built from a
  // string needs its backslashes doubled twice over and the first attempt here
  // silently matched nothing, which reported the table as absent when it was
  // sitting in the file. The declaration is one line and ends at the newline.
  const table = (name) => {
    const at = map.indexOf('const ' + name + ' = [')
    assert.ok(at !== -1, `site/map.html has no ${name} table`)
    const from = map.indexOf('[', at)
    const line = map.slice(from, map.indexOf('\n', from))
    // the chart writes its tables as JS, with single quotes on the kinds
    return JSON.parse(line.replace(/'/g, '"'))
  }
  const B7 = table('B7')
  const W7 = table('W7')

  assert.equal(JSON.stringify(B7), JSON.stringify(BECKS.map((b) => b.path)),
    'the chart\'s becks must be the world\'s becks, in order and tile for tile')
  assert.equal(W7.length, WATERS.length,
    `the chart draws ${W7.length} inland waters and the world has ${WATERS.length}`)

  // AND THE PROSE BESIDE IT, which was counting the copy. A page that draws the
  // right thing and describes a different one is still wrong, and this is the
  // page whose first paragraph says that if it and the world ever disagreed,
  // one of them would be in breach of the constitution.
  const WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
    'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
    'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']
  const flat = map.replace(/\s+/g, ' ')
  for (const m of flat.matchAll(/([A-Za-z]+) becks\b/g)) {
    const said = WORDS.indexOf(m[1].toLowerCase()) + 1
    if (said === 0) continue
    assert.equal(said, BECKS.length,
      `site/map.html says "${m[1]} becks" and the world has ${BECKS.length}`)
  }
})
