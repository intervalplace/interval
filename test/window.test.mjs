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

// ---- ONE PAIR OF HANDS, AND THE TWO TABLES THAT DECIDE IT ----
//
// The engine refuses a wield that would displace something the citizen did
// not ask to put down: a shield beside a two-handed weapon, or a weapon that
// takes both hands beside a raised shield. The window's job is to say the two
// inputs instead -- lower the shield, then wield -- and to say out loud when
// the pack has no room for what comes off.
//
// It can only do that if it agrees with the engine about WHICH weapons take
// both hands and WHICH slot a thing goes in. It did not. Its list of
// two-handed weapons had eleven words where the engine has twenty-one, and
// every spear, every mell, every staff, the quick flail, the old chain and
// the handgonne were missing from it. For those thirteen, clicking to wield
// with a shield up sent a wield the engine threw away, and nothing happened
// and nothing was said: exactly the silent refusal the window's own comment
// says it exists to prevent.
//
// Neither table can be imported into a browser file, so both are copied, and
// these two tests are what keeps the copies honest.
const setFrom = (src, name) => {
  const m = src.match(new RegExp('const ' + name + ' = new Set\\(\\[([\\s\\S]*?)\\]\\)'))
  assert.ok(m, `${name} not found`)
  return new Set([...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]))
}
const tableFrom = (src, name) => {
  const i = src.indexOf('const ' + name + ' = {')
  assert.ok(i >= 0, `${name} not found`)
  const body = src.slice(i, src.indexOf('\n}', i))
  const o = {}
  for (const m of body.matchAll(/'([^']+)':\s*'(\w+)'/g)) o[m[1]] = m[2]
  return o
}

test('the window knows the same weapons take both hands as the engine does', () => {
  const mine = setFrom(win, 'TWO_HANDED')
  const theirs = setFrom(eng, 'TWO_HANDED')
  assert.ok(theirs.size > 15, 'the engine list was not read: this test would pass on nothing')
  const missing = [...theirs].filter((w) => !mine.has(w))
  const extra = [...mine].filter((w) => !theirs.has(w))
  assert.deepEqual(missing, [],
    'the window would send a wield the engine refuses, and say nothing, for: ' + missing.join(', '))
  assert.deepEqual(extra, [],
    'the window would lower a shield that could have stayed up, for: ' + extra.join(', '))
})

test('the window puts every piece of gear in the slot the engine does', () => {
  const mine = tableFrom(win, 'EQUIP_SLOT')
  const theirs = tableFrom(eng, 'EQUIP_SLOT')
  assert.ok(Object.keys(theirs).length > 15, 'the engine table was not read')
  const wrong = Object.entries(theirs)
    .filter(([w, slot]) => (mine[w] ?? 'weapon') !== slot)
    .map(([w, slot]) => `${w} belongs in the ${slot}, the window says ${mine[w] ?? 'weapon'}`)
  assert.deepEqual(wrong, [], wrong.join('; '))
  const invented = Object.keys(mine).filter((w) => !theirs[w])
  assert.deepEqual(invented, [], 'the window slots gear the engine has never heard of: ' + invented.join(', '))
})

// ---- THE WORLD SAYS `health` AND THE WINDOW SAYS `hp` ----
//
// The engine renamed the field and said so in its own code: `health: p.health
// ?? p.hp`, noting that every checkpoint written before the rename says `hp`.
// Nothing on the wire translates, and this window reads `.hp` in sixty-eight
// places and `.health` in none. So every creature's plate read "goblin
// undefined/5 hp", every health bar was a rectangle of NaN width and painted
// nothing, and `me.hp <= 0` was false for ever, which is the window never
// noticing you had died.
//
// Nothing caught it because every fixture in this folder hands the window a
// player written `{ hp: 10, maxHp: 10 }`. The test below refuses to do that:
// it builds a player and a creature with the ENGINE, and puts the window's own
// door function in front of them.
test('the window turns the world\'s health into its own hp, at the door', async () => {
  const E = (await import('../engine.js')).default
  const g = E.makeGenesis('words', 'a'.repeat(64), 0, 40, 30)
  const st = E.newWorld(g)
  const who = E.generateIdentity()
  E.addPlayer(st, who.playerId, 5, 5)
  const p = st.players[who.playerId]
  // the premise: if this ever stops being true the translation is the bug
  assert.equal(p.hp, undefined, 'the engine does not write hp; if it does again, drop the translation')
  assert.equal(typeof p.health, 'number', 'the engine writes health')
  st.mobs = { m1: { type: 'goblin', x: 6, y: 5, health: 3 } }

  // the window's door, lifted and run: not a regular expression about it
  const src = win.slice(win.indexOf('function intervalOwnWords'))
  const body = src.slice(0, src.indexOf('\n}') + 2)
  assert.ok(body.includes('health'), 'the door must read the world\'s word')
  const door = new Function('maxHpOf', 'MOB_STATS', body + '\n    return intervalOwnWords')(
    () => 64, { goblin: { maxHp: 5 } })
  door(st)

  assert.equal(st.players[who.playerId].hp, p.health, 'a citizen\'s health reaches the window')
  assert.equal(st.mobs.m1.hp, 3, 'and a creature\'s does too')
  assert.equal(st.mobs.m1.maxHp, 5, 'with the most it could have, for the bar to be a fraction of')
  assert.ok(Number.isFinite(20 * (st.mobs.m1.hp / st.mobs.m1.maxHp)),
    'the health bar must have a width that is a number: NaN paints nothing at all')
})

test('every state the window draws comes through that door', () => {
  // A full state and a patched one are two paths, and both end at onState.
  // If a third ever appears it must translate too, so this counts them.
  const doors = [...win.matchAll(/onState\(/g)].length
  assert.ok(doors >= 2, 'onState is the door')
  const call = win.indexOf('function onState(')
  const first = win.slice(call, call + 400)
  assert.ok(first.includes('intervalOwnWords'),
    'onState must translate before anything downstream reads a health')
})

// ---- A DRAWING BEHIND A GATE THAT DOES NOT NAME IT IS NOT A DRAWING ----
//
// The landmark art is a chain of eighty-seven branches behind one door:
// `if (n.type === 'landmark' && LM18.has(n.kind))`. The door named
// thirty-two of them. The other fifty-five were written, correct, and
// unreachable, and the kinds they drew fell past to the end of the next
// chain, whose final else is a broken tower.
//
// Seventy-one per cent of every landmark on the island was ruined masonry:
// 464 pines, 304 oaks, 247 wind-thorns, 199 willows, 150 dead trees. An
// orchard outside Anchor was three blocks of rubble in a row.
//
// This is the same shape of fault as an item alias shadowing a sprite, and
// the same shape as a window table that drifted from the engine's: something
// written, something that decides whether it is reached, and nothing holding
// the two together. This holds them together.
test('every landmark drawing is behind a gate that names it', () => {
  const i = win.indexOf('const LM18 = new Set([')
  assert.ok(i > 0, 'the landmark gate is gone or renamed')
  const gate = new Set([...win.slice(i, win.indexOf('])', i)).matchAll(/'([^']+)'/g)].map((m) => m[1]))
  const a = win.indexOf("if (n.type === 'landmark' && LM18.has(n.kind)) {")
  const b = win.indexOf("if (n.type === 'landmark') {", a)
  assert.ok(a > 0 && b > a, 'the landmark chain is gone or renamed')
  const drawn = [...new Set([...win.slice(a, b).matchAll(/K === '([^']+)'/g)].map((m) => m[1]))]
  assert.ok(drawn.length > 50, 'the chain was not read: this test would pass on nothing')

  const shutOut = drawn.filter((k) => !gate.has(k))
  assert.deepEqual(shutOut, [],
    shutOut.length + ' landmark kinds have a drawing the gate does not name, so they are '
    + 'painted as a broken tower instead: ' + shutOut.join(', '))

  // and the other way: a name in the gate with no drawing behind it enters
  // the chain, matches no branch, and comes out the far side drawn as
  // nothing at all, which is worse than the tower.
  const namedNotDrawn = [...gate].filter((k) => !drawn.includes(k))
  assert.deepEqual(namedNotDrawn, [],
    'the gate lets these in and the chain has nothing for them: ' + namedNotDrawn.join(', '))
})
