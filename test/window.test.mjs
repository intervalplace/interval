// The web window is 15,000 lines of client that nothing checks. These are the
// faults that hide there: a skill name the engine retired (the verb silently
// disappears), a duplicate key in an object literal (the last one wins), and a
// threshold that drifted from the engine's.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
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

// §5m: AND NOT ONLY THIS CLIENT. The test below has held window-web clean for
// months while `window-diablo` read five retired names and `window-3d` read a
// sixth, because it only ever looked at one file. In diablo every skill name
// in the file was a retired one, so `p.skills.woodcutting` was undefined
// everywhere, which reads as nought: standing was nought for everybody, the
// calling was always the first skill in the list, the cape could never appear
// at all, and `maxHpOf` gave every citizen a frame of one.
test('no window the router offers reads a skill the engine retired', () => {
  const served = [...fs.readFileSync(path.join(root, 'serve.mjs'), 'utf8')
    .matchAll(/sendFile\('\.\/(window-[a-z0-9-]+\.html)'/g)].map((m) => m[1])
  assert.ok(served.length >= 6, `found ${served.length} window routes`)
  const bad = []
  for (const f of new Set(served)) {
    const p2 = path.join(root, f)
    if (!fs.existsSync(p2)) continue
    // comments may name a retired skill to explain what was repealed
    const lines = fs.readFileSync(p2, 'utf8').split('\n').filter((l) => !l.trim().startsWith('//'))
    const read = new Set([...lines.join('\n').matchAll(/skills\??\.([a-z]+)/g)].map((m) => m[1]))
    for (const sk of read) if (!TRADES.includes(sk)) bad.push(`${f} reads skills.${sk}`)
  }
  assert.deepEqual(bad, [], bad.join('\n'))
})

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
  // whole ascent, so a cape at ninety-nine is very early indeed. §4c-ii then
  // moved the test from "any skill at a hundred" to "the SWORN calling at a
  // hundred", which is the only skill that can get there at all, so the shape
  // of the comparison changed and the rule did not.
  const capeOf = win.match(/function capeOf[\s\S]*?\n\}/)[0]
  assert.match(capeOf, /XP_TO_LVL\(p\.skills\?\.\[sworn\] \?\? 0\) < 100/)
  assert.equal(/>= 99\b|< 99\b/.test(capeOf), false)
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

// ---- A WALL IS THE SAME WALL WHICHEVER WAY IT RUNS ----
//
// A run across was seventeen thick and the same wall running down was
// twenty-eight, because the sideways measurement and the end-on one came
// from different numbers. Every building had a narrow band along the top and
// a broad slab down the side with a jog where they met. A run down also
// stopped seventeen short at its ends, where a run across stops six, so a
// column of wall tiles read as separate blocks.
//
// The geometry is four lines. This runs them, for every way the neighbours
// can be, instead of reading them.
test('a wall is the same thickness whichever way it runs', () => {
  const a = win.indexOf('const thick = ramp ? ')
  assert.ok(a > 0, 'the wall geometry is gone or renamed')
  const b = win.indexOf('const y1 =', a)
  const src = win.slice(a, win.indexOf('\n', b))
  const geom = new Function('ramp', 'wl', 'wr', 'wu', 'wd', 'X', 'Y',
    src + '\n    return { x0, x1, y0, y1, vert }')

  for (const ramp of [false, true]) {
    const T = ramp ? 22 : 17
    const across = geom(ramp, true, true, false, false, 0, 0)     // middle of a run across
    const down = geom(ramp, false, false, true, true, 0, 0)       // middle of a run down
    assert.equal(across.y1 - across.y0, T, (ramp ? 'palisade' : 'wall') + ' across')
    assert.equal(down.x1 - down.x0, T,
      (ramp ? 'palisade' : 'wall') + ' down is ' + (down.x1 - down.x0) + ' thick, across is ' + T)
    assert.equal(across.x1 - across.x0, 40, 'a middle tile reaches both its edges')
    assert.equal(down.y1 - down.y0, 40, 'and so does a middle tile of a run down')

    // the strip of a run down is centred, so it meets the next tile squarely
    assert.equal(down.x0 + down.x1, 40, 'a run down sits down the middle of its tiles')

    // and a run ends the same way whichever way it runs
    const capAcross = geom(ramp, false, true, false, false, 0, 0)
    const capDown = geom(ramp, false, false, false, true, 0, 0)
    assert.equal(capAcross.x0, capDown.y0,
      'a run across stops ' + capAcross.x0 + ' short at its end and a run down stops ' + capDown.y0)
  }

  // nothing ever draws itself inside out
  for (const wl of [0, 1]) for (const wr of [0, 1]) for (const wu of [0, 1]) for (const wd of [0, 1]) {
    const g = geom(false, !!wl, !!wr, !!wu, !!wd, 0, 0)
    assert.ok(g.x1 > g.x0 && g.y1 > g.y0, `a wall with neighbours ${wl}${wr}${wu}${wd} has no body`)
  }
})

// ---- A SIGNPOST SAYS WHERE IT IS ----
//
// All 216 of them read "ANCHOR / EAST / WEST", painted into the drawing, in
// fourteen countries. The world has carried the right words the whole time:
// 207 signpost nodes hold `text` naming 144 distinct places.
test('a signpost reads the world, not three words painted into the drawing', () => {
  const a = win.indexOf("if (n.type === 'signpost') {")
  assert.ok(a > 0, 'the signpost drawing is gone or renamed')
  const body = win.slice(a, win.indexOf('\n      }\n', a))
  assert.ok(body.includes('n.text'), 'the signpost must read the words the world put on it')
  const painted = [...body.matchAll(/fillText\(\s*'([^']+)'/g)].map((m) => m[1])
  assert.deepEqual(painted, [],
    'a signpost paints these words on every post in the world: ' + painted.join(', '))
})

// ---- THE STYLESHEET HAS TO PARSE, AND :root IS WHERE IT STARTS ----
//
// Reported as "pack slots are not showing up on mobile". They were all in
// the document. The stylesheet opened `<style>:` with `root {` on the next
// line, which is the selector `: root`, and a pseudo-class may not have
// whitespace after its colon: the browser threw the block away and every one
// of the ninety-one `var(--x)` uses in this window resolved to nothing. A
// second one, eight lines down, had lost its colon outright and held the
// width of the frame and the panel.
//
// A rule that does not parse fails silently and looks like a design choice,
// so this checks the thing itself: every custom property the file USES must
// be defined by a selector that actually selects the root.
test('every colour and width the window asks for is actually defined', () => {
  // comments stripped first: a property NAMED in a note about this very
  // fault is not a property the page asks for, and the first run of this
  // test duly failed on its own explanation
  const css = win.slice(win.indexOf('<style>'), win.indexOf('</style>'))
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
  const used = new Set([...css.matchAll(/var\((--[a-z0-9-]+)\)/g)].map((m) => m[1]))
  assert.ok(used.size > 10, 'read ' + used.size + ' custom properties; the stylesheet was not found')

  // defined ONLY by a well-formed :root, which is what the browser requires
  const defined = new Set()
  for (const m of css.matchAll(/:root\s*\{([^}]*)\}/g)) {
    for (const d of m[1].matchAll(/(--[a-z0-9-]+)\s*:/g)) defined.add(d[1])
  }
  const orphans = [...used].filter((v) => !defined.has(v))
  assert.deepEqual(orphans, [],
    orphans.length + ' properties are used and never defined by a :root that parses: ' + orphans.join(', '))

  // and the near miss that caused it: a declaration block for the root that
  // is not spelled `:root`
  assert.doesNotMatch(css, /<style>\s*:\s*\n/, 'the colon belongs to :root, not to the <style> tag')
  assert.doesNotMatch(css, /\n\s*root\s*\{/, 'a block selecting `root` is not a block selecting `:root`')
})

// ---- AND THE PACK MUST HAVE A FLOOR ----
//
// `#inv { flex: 0 1 auto; min-height: 0 }` in a flex column that runs out of
// room lets the pack give up ALL of its height: measured on a phone it was
// 442 wide and ZERO high. The log below it already keeps a floor of its own
// and that is why it survived.
//
// The phone column override was also written EIGHTEEN LINES ABOVE the base
// rule it overrides. Two rules of equal weight, and the later one wins, so a
// phone got four columns of hundred-and-eight-pixel slots.
test('the pack keeps a floor, and its phone columns win the cascade', () => {
  const css = win.slice(win.indexOf('<style>'), win.indexOf('</style>'))
  const floor = /#inv\s*\{[^}]*min-height:\s*(\d+)px/.exec(css)
  assert.ok(floor && +floor[1] > 0,
    '#inv must keep a floor, or the pack is crushed to nothing before the log is')

  // the last rule to set the pack's columns must be the phone one
  const sets = [...css.matchAll(/#inv\s*\{[^}]*grid-template-columns:\s*repeat\((\d+)/g)]
  assert.ok(sets.length >= 2, 'expected a base rule and a phone override')
  const last = sets[sets.length - 1]
  assert.equal(last[1], '7', 'the phone override must come last, or the base rule wins on a phone')
  const before = css.slice(0, last.index)
  assert.ok(/@media[^{]*max-width[^{]*\{[^@]*$/.test(before.slice(-200)) || css.slice(last.index - 120, last.index).includes('max-width'),
    'and it must be inside the phone media query')
})

// ---- TURNING THE SOUND ON IS NOT ARRIVING AT THE DOOR ----
//
// Both switches played `theme-flat`, the piece that greets you on the way in,
// so a citizen in Millbrook who toggled the sound heard the opening theme
// hours after entering. The window already knows what belongs where.
test('the sound switch plays the region you are in, not the door theme', () => {
  const a = win.indexOf('function startMusicHere')
  assert.ok(a > 0, 'the switch no longer asks where you are')
  const body = win.slice(a, win.indexOf('\n}', a))
  assert.ok(body.includes('REGION_STEM'), 'it must read the region table')
  assert.ok(body.includes('entered'), 'except at the door, where there is only the one piece')

  // and neither switch may go straight to the door's theme any more
  for (const sw of ['function setMusic', "sndEl.addEventListener('click'"]) {
    const i = win.indexOf(sw)
    assert.ok(i > 0, sw + ' is gone or renamed')
    const b = win.slice(i, i + 420)
    assert.ok(!/startMusic\('theme-flat'\)/.test(b),
      sw + ' still reaches for the door theme when the sound comes back on')
  }
})

// ---- THE GAMBITS, AND THE THREE TABLES THAT DESCRIBE THEM ----
//
// The window keeps copies of the engine's gambit data because a browser file
// cannot import engine.js: which weapons have one, how many blows it is, and
// what to call it on the button. All three said they were generated from
// WEAPONS and none of them had been regenerated:
//
//   the quick-mell and the great-mell are `whole` and the window said `now`
//   the handgonne is `report` and the window said `flurry`
//   a quick-dagger flurry is four blows and the window drew six
//   a horn-bow flurry is three and the window drew six, with six thwips
//
// The blow count is not decoration: it is the number of arrows drawn flying
// and the number of sounds played, so a horn-bow gambit threw six shafts for
// three that were rolled.
test('the window knows the same gambits as the engine, and how many blows each is', () => {
  const table = (name) => {
    const i = win.indexOf(`const ${name} = {`)
    assert.ok(i > 0, name + ' is gone or renamed')
    const body = win.slice(i, win.indexOf('\n}', i))
    const o = {}
    for (const m of body.matchAll(/"([^"]+)":\s*("?[\w-]+"?)/g)) o[m[1]] = JSON.parse(m[2].replace(/^(\w)/, '"$1').replace(/(\w)$/, '$1"').replace(/^""(.*)""$/, '"$1"'))
    return o
  }
  const jsonTable = (name) => {
    const i = win.indexOf(`const ${name} = {`)
    const body = win.slice(i + `const ${name} = `.length, win.indexOf('\n}', i) + 2)
    return JSON.parse(body)
  }
  const blows = jsonTable('GAMBIT_BLOWS')
  const of = jsonTable('GAMBIT_OF')

  const theirs = Object.entries(E.WEAPONS).filter(([, w]) => w && w.gambit)
  assert.ok(theirs.length >= 5, 'the engine list was not read: this would pass on nothing')

  for (const [item, w] of theirs) {
    assert.equal(of[item], w.gambit,
      `${item} is a ${w.gambit} gambit and the window calls it ${of[item]}`)
    const n = w.blows ?? (w.gambit === 'flurry' ? 2 : 1)
    assert.equal(blows[item], n,
      `${item} strikes ${n} time(s) and the window draws ${blows[item]}`)
  }
  const invented = Object.keys(of).filter((k) => !E.WEAPONS[k]?.gambit)
  assert.deepEqual(invented, [], 'the window gives a gambit to weapons that have none: ' + invented.join(', '))
  const missed = theirs.map(([k]) => k).filter((k) => !of[k])
  assert.deepEqual(missed, [], 'these have a gambit the window has never heard of: ' + missed.join(', '))
})

test('every gambit the engine has is a gambit the window can describe', () => {
  const i = win.indexOf('const GAMBIT_SAYS = {')
  assert.ok(i > 0, 'the button has nothing to say')
  const said = new Set([...win.slice(i, win.indexOf('\n}', i)).matchAll(/^\s*(\w+):/gm)].map((m) => m[1]))
  const kinds = new Set(Object.values(E.WEAPONS).filter((w) => w && w.gambit).map((w) => w.gambit))
  const undescribed = [...kinds].filter((k) => !said.has(k))
  assert.deepEqual(undescribed, [],
    'the button would read "GAMBIT, undefined" for: ' + undescribed.join(', '))
  const stale = [...said].filter((k) => !kinds.has(k))
  assert.deepEqual(stale, [], 'these shapes no longer exist in the engine: ' + stale.join(', '))
})

test('the window says gambit, which is the word this world uses', () => {
  // SPEC.md: the burst is `gambit` everywhere. The old word survived on the
  // button itself, which is the one place a player reads it.
  const shown = [...win.matchAll(/['"]([A-Z]{4,})[,:]? ['"+]/g)].map((m) => m[1])
  assert.ok(!shown.includes('SPECIAL'), 'the button still shows the retired word')
  assert.ok(!/\bSPEC_(BLOWS|OF|SAYS)\b/.test(win), 'a gambit table is still named for the retired word')
  assert.ok(/GAMBIT, /.test(win), 'the button must name the thing it fires')
})

// ---- WHAT A WEAPON LOOKS LIKE, AND WHAT IT LOOSES ----
//
// Three faults in one place, all of them one shape standing in for many.
//
// A fight drew a blade and a crossguard for EVERY weapon in the world. A
// mell, a spear, a flail, a bow, a hand cannon: all of them swung a sword,
// and the only thing that varied was whether the metal was iron or quick.
// The window already had a drawing for each, used when the weapon is merely
// carried, and threw it away at the moment it mattered most.
//
// Everything ranged was given the archer's stance, string and all, so the
// handgonne drew a bowstring. And the volley drew one projectile for all of
// them, so the handgonne then loosed a feathered arrow out of that bow.
test('what a ranged weapon looses is what the engine says it loads', () => {
  const setOf = (name) => {
    const i = win.indexOf(`const ${name} = new Set([`)
    assert.ok(i > 0, name + ' is gone or renamed')
    // both quote styles: RANGED_ITEMS is written with double quotes and the
    // two beside it with single, and reading only one kind returned an empty
    // set that then agreed with everything asked of it
    return new Set([...win.slice(i, win.indexOf('])', i))
      .matchAll(/'([^']+)'|"([^"]+)"/g)].map((m) => m[1] ?? m[2]))
  }
  const shot = setOf('SHOT_WEAPONS'), thrown = setOf('THROWN_ITEMS'), ranged = setOf('RANGED_ITEMS')

  const theirs = Object.entries(E.WEAPONS).filter(([, w]) => w && w.ranged)
  assert.ok(theirs.length > 5, 'the engine list was not read')
  const powder = theirs.filter(([, w]) => w.powder).map(([k]) => k)
  assert.ok(powder.length, 'the engine has no powder weapon: this test is testing nothing')
  assert.deepEqual([...shot].sort(), powder.sort(),
    'the window fires shot from a different set of weapons than the engine loads powder into')
  for (const k of [...shot, ...thrown]) {
    assert.ok(ranged.has(k), k + ' looses something but the window does not count it as ranged')
  }
  // and nothing that fires shot may also be drawn drawing a bowstring
  const i = win.indexOf('if (o.shooting && SHOT_WEAPONS.has(o.wepItem))')
  assert.ok(i > 0, 'a gun is drawn as a bow again')
})

test('a fight is fought with the weapon in hand, not with a sword every time', () => {
  const i = win.indexOf("} else if (o.anim === 'fight') {")
  assert.ok(i > 0, 'the fight pose is gone or renamed')
  const body = win.slice(i, win.indexOf('\n  }', i))

  // It drew a blade and a crossguard for every weapon in the world. The cure
  // is NOT a second set of drawings here, which was the first attempt and
  // made the weapon change shape the moment it was raised: it is the one
  // drawing, translated to the hand.
  assert.ok(/heldWeapon\(cx,/.test(body),
    'the fight pose must use the same drawing as the hip, or the weapon changes when you raise it')
  assert.ok(!/fillRect\(-[\d.]+, [\d.]+, [\d.]+, 1[0-9]/.test(body),
    'the fight pose is drawing weapon-sized shapes of its own again')

  // and a bow is not swung at all: the archer's stance already holds it
  assert.ok(body.includes('RANGED_ITEMS'),
    'an archer swings a second weapon under their bow unless the pose knows better')

  // AND THERE IS AN ARM TO HOLD IT WITH. The arm was three pixels of skin
  // against a tunic of its own darkness, invisible at the size a citizen is
  // drawn, so the weapon read as a stick floating in front of a man standing
  // with his arms down: the swing worked and nothing connected it to him.
  const arm = win.indexOf('AN ARM, SO THE WEAPON IS HELD')
  assert.ok(arm > 0, 'the arm is back to being a bare sliver of skin')
  const limb = win.slice(arm, arm + 1400)
  assert.ok(/tunicDk/.test(limb), 'the sleeve must read against the body, so it is the tunic\u2019s own dark')
  assert.ok(/arc\(0, 7\.4/.test(limb), 'there must be a hand where the weapon begins')
})

// ---- `prowess` IS A SKILL, AND THE WORLD NEVER PUTS IT IN `action.type` ----
//
// The engine sets four ongoing actions and only four: attack, attackp,
// gather, raise. `prowess` is this window's own outgoing word for swinging
// at a creature, translated to `attack` before it leaves. A line that tests
// `action.type === 'prowess'` is therefore never true, and fails silently.
//
// This was found once, fixed in the animation chooser, and documented in a
// comment. NINE other lines went on asking it, and each is a thing that did
// not happen when you fought a beast:
//
//   nobody was drawn swinging at one, because `exchange` asked it
//   no archer was drawn holding their bow at one, because `shooting` did
//   the skill panel did not know you were training prowess
//   no arrow was drawn when marksmanship went up
//   nothing was said when your foe fell, or when your quiver ran dry
//   eating mid-fight did not put you back on what you were fighting
//
// All of it worked against another CITIZEN, because `attackp` sits beside
// the dead word in every one of those tests. Fighting a person was drawn.
// Fighting a beast was not, and nearly everything anybody fights is a beast.
test('no live line asks whether an action is `prowess`, which it never is', () => {
  const engineSets = new Set([...fs.readFileSync(path.join(root, 'engine.js'), 'utf8')
    .matchAll(/\.action = \{ type: '([^']+)'/g)].map((m) => m[1]))
  assert.ok(engineSets.size >= 3, 'the engine was not read')
  assert.ok(!engineSets.has('prowess'),
    'the engine now sets prowess as an action: if so, every line below was right all along')

  const live = win.split('\n')
    .map((l, n) => [n + 1, l])
    .filter(([, l]) => /action\??\.type === 'prowess'/.test(l))
    .filter(([, l]) => !/^\s*(\/\/|\*)/.test(l))     // the notes about this fault may say it
  assert.deepEqual(live.map(([n]) => n), [],
    live.length + ' live lines test an action type the world never sets: '
      + live.map(([n, l]) => n + ': ' + l.trim().slice(0, 60)).join(' | '))

  // and the two that decide whether a fight is DRAWN must accept both kinds
  for (const name of ['exchange:', 'shooting:']) {
    const i = win.indexOf(name)
    assert.ok(i > 0, name + ' is gone or renamed')
    const seg = win.slice(i, i + 260)
    assert.ok(/inAFight\(/.test(seg),
      name + ' does not ask whether this is a fight, so fighting a creature draws nothing')
  }
})

// ---- EVERY WEAPON IS DRAWN, AND IT IS THE SAME ONE IN BOTH HANDS ----
//
// The fight pose used to draw a sword for everything. The first repair gave
// it a SECOND set of drawings of its own, which is the same fault wearing
// better clothes: a citizen carried one mell and swung a different one, so
// the thing in his hand changed shape the moment he raised it. There is one
// drawing now and both poses call it.
//
// Which then showed what that one drawing was missing. Twenty weapons were
// named in it and the world has thirty-seven, so fourteen were drawn as
// NOTHING, in the hand and at the hip alike: every steel arm, the great
// sword, the great mell, the bare blade, the bone spear, the bone staff, the
// spade, the torch, the barb, the gold chain, the fire-siphon.
//
// This runs the drawing rather than reading it: a context that counts what it
// is asked to paint, once per weapon the world has.
test('every weapon the world has is drawn by the one drawing', async () => {
  const a = win.indexOf('function heldWeapon (cx, it, F, now) {')
  assert.ok(a > 0, 'the one weapon drawing is gone or renamed')
  const fn = win.slice(a, win.indexOf('\n}\n', a) + 2)
  const r = win.indexOf('const RANGED_ITEMS = new Set([')
  const ranged = win.slice(r, win.indexOf('])', r) + 2)
  // the drawing leans on one helper of the window's own, so it is lifted too
  // rather than stubbed: a stub that draws nothing would make every weapon
  // look silent and this test would then report the opposite of the truth
  const ph = win.indexOf('const poly9 = ')
  assert.ok(ph > 0, 'poly9 is gone or renamed')
  const poly9 = win.slice(ph, win.indexOf('\n', win.indexOf('cx.fill()', ph)))
  const draw = new Function(ranged + '\n' + poly9 + '\n' + fn + '\nreturn heldWeapon')()

  // a context that paints nothing and remembers being asked
  const pen = () => {
    let n = 0
    const noop = () => { n++ }
    const cx = new Proxy({ get strokes () { return n } }, {
      get: (t, k) => (k === 'strokes' ? n : noop),
      set: () => true,
    })
    return cx
  }

  const silent = []
  for (const it of Object.keys(E.WEAPONS)) {
    const cx = pen()
    draw(cx, it, 1, 1000)
    if (cx.strokes < 2) silent.push(it)
  }
  assert.deepEqual(silent, [],
    silent.length + ' weapons are drawn as nothing at all, in the hand and at the hip: '
      + silent.join(', '))

  // and both poses must reach it, or they will drift apart again
  assert.equal((win.match(/heldWeapon\(cx,/g) || []).length, 2,
    'the carried pose and the fight pose must both call the one drawing')
})

// ---- AND EVERY BOW WAS THE SAME BOW ----
//
// The archer's stance drew one brown limb and one pale string whatever was
// being shot, so the horn-bow, the dragonbow, the sigil-bow and the plain
// wooden bow were one picture: the rarest arm in the world looked like the
// first one anybody is handed. The CARRIED drawing has told them apart for a
// long time. The drawn one never did.
test('the bow a citizen draws is the bow they are holding', () => {
  const i = win.indexOf("} else if (o.shooting) {")
  assert.ok(i > 0, 'the archer stance is gone or renamed')
  const stance = win.slice(i, win.indexOf('\n  } else if (o.bow)', i))
  assert.ok(stance.includes('o.wepItem'),
    'the stance does not look at which bow it is, so every bow is the same bow')

  // the ones the world makes a point of: each must be told from the others
  for (const [name, re] of [
    ['dragonbow', /dragonbow/], ['sigil-bow', /sigil-bow/], ['a crossbow', /crossbow\$\/|crossbow/],
  ]) {
    assert.ok(re.test(stance), name + ' is drawn as a plain wooden bow again')
  }
  // and the limb colour must actually vary, not be one constant
  const limbs = [...stance.matchAll(/'#[0-9a-f]{6}'/g)].map((m) => m[0])
  assert.ok(new Set(limbs).size >= 4,
    'the stance paints ' + new Set(limbs).size + ' colours: every bow still looks alike')
})

// ---- A WEAPON MOVES THE WAY ITS KIND MOVES, AND A GAMBIT IS NOT A JAB ----
//
// Every arm swung the same arc: rest a little back, come through about sixty
// degrees, return. A dagger, a two-handed maul and a spear were one motion,
// and a GAMBIT was that same motion again, so the only thing saying anything
// unusual had happened was a ring thrown over the citizen's head.
//
// And an archer had no motion tied to the shot at all. The string's pull was
// `sin(now / 300)`, a wall clock running whether or not anything was being
// shot, so the bow breathed in and out for ever and the arrow never left.
test('each family of weapon swings its own arc, and a gambit swings further', () => {
  const i = win.indexOf('const SWING_OF = (it) =>')
  assert.ok(i > 0, 'every weapon swings the same arc again')
  const table = win.slice(i, win.indexOf('\n  const striking', i))
  const arcs = [...table.matchAll(/\[\s*(-?[\d.]+),\s*([\d.]+),\s*(\d+)\]/g)]
    .map((m) => [+m[1], +m[2], +m[3]])
  assert.ok(arcs.length >= 4, 'read ' + arcs.length + ' arcs; expected one per family')
  assert.equal(new Set(arcs.map((a) => a.join())).size, arcs.length,
    'two families are given the same arc, so they move identically')

  // a thrust goes FORWARD rather than round: whichever family lunges most
  // must turn least, or a spear is just a short sword
  const mostLunge = arcs.reduce((a, b) => (b[2] > a[2] ? b : a))
  const mostTurn = arcs.reduce((a, b) => (b[1] > a[1] ? b : a))
  assert.notDeepEqual(mostLunge, mostTurn,
    'the weapon that reaches furthest also turns furthest: nothing here is a thrust')

  // and a gambit is the same motion taken further, not a second animation
  const body = win.slice(win.indexOf('const gam9 = striking'), win.indexOf('const lean', i))
  assert.ok(/gam9/.test(body), 'a gambit is drawn exactly like an ordinary blow again')
  assert.ok(/gam9 \? 1\.[0-9]/.test(win.slice(i, i + 4000)),
    'a gambit must take the arc further, or it cannot be told from a jab')
})

test('a bow is drawn and loosed on the beat, not wobbled at by a wall clock', () => {
  const i = win.indexOf('const shotT =')
  assert.ok(i > 0, 'the bow is back on a clock of its own')
  const seg = win.slice(i, i + 700)
  assert.ok(/renderT\(/.test(seg), 'the draw must follow the interval the shot lands on')
  assert.ok(/o\.exchange|o\.gambit/.test(seg), 'and only when there is a shot to loose')
  assert.ok(/loosed/.test(seg), 'the arrow must actually leave the string')

  // the old wall clock must be gone from the stance
  const a = win.indexOf("} else if (o.shooting) {")
  const stance = win.slice(a, win.indexOf('\n  } else if (o.bow)', a))
  assert.ok(!/const pull = \(Math\.sin\(o\.now/.test(stance),
    'the pull is a wall clock again, so the string breathes and nothing is ever loosed')
})

// ---- A FLURRY IS FOUR BLOWS, SO IT IS FOUR SWINGS ----
//
// A quick-dagger gambit rolls four and a horn-bow three, and the arm made
// ONE movement for either: four marks landed on a target over a citizen who
// had swung once.
test('a flurry swings as many times as it has blows', () => {
  const i = win.indexOf('const blows9 =')
  assert.ok(i > 0, 'the arm does not count the blows again')
  const seg = win.slice(i, i + 420)
  assert.ok(/GAMBIT_BLOWS/.test(seg),
    'the count must be the engine’s own, the same one the arrows are drawn by')
  assert.ok(/% 1/.test(seg), 'the interval must be divided by the blows, or it is still one swing')
  // and the bow counts the same way
  const b = win.indexOf('const nShot8 =')
  assert.ok(b > 0, 'a flurry of arrows is still one draw')
  assert.ok(/GAMBIT_BLOWS/.test(win.slice(b, b + 260)), 'and off the same count')
})

// ---- AND NOBODY HOLDS A WEAPON BY ITS HEAD ----
//
// Every weapon in the one drawing grips at the origin and reaches DOWN the
// +y axis. The mell alone put its head at -6, above the hand, with the haft
// sticking out past it. Worn at the hip, rotated, that read as a maul on a
// belt and nobody looked twice; in the fist it is a man holding the heavy
// end. This runs the drawing and asks where the weight ended up.
test('a weapon reaches away from the hand, not back through it', async () => {
  const a = win.indexOf('function heldWeapon (cx, it, F, now) {')
  const fn = win.slice(a, win.indexOf('\n}\n', a) + 2)
  const r = win.indexOf('const RANGED_ITEMS = new Set([')
  const ranged = win.slice(r, win.indexOf('])', r) + 2)
  const ph = win.indexOf('const poly9 = ')
  const poly9 = win.slice(ph, win.indexOf('\n', win.indexOf('cx.fill()', ph)))
  const draw = new Function(ranged + '\n' + poly9 + '\n' + fn + '\nreturn heldWeapon')()

  // a context that remembers where it was asked to paint
  const spans = (it) => {
    const ys = []
    const cx = new Proxy({}, {
      get: (t, k) => {
        if (k === 'fillRect') return (x, y, w, h) => ys.push(y, y + h)
        if (k === 'arc') return (x, y) => ys.push(y)
        if (k === 'ellipse') return (x, y) => ys.push(y)
        if (k === 'moveTo' || k === 'lineTo') return (x, y) => ys.push(y)
        return () => {}
      },
      set: () => true,
    })
    draw(cx, it, 1, 1000)
    return ys
  }

  // a stave is gripped in the middle and a bow across its belly, so those are
  // not held by one end at all. Everything else hangs from the hand.
  const twoEnded = (it) => /staff$|^wand$|^handgonne$|bow$|crossbow$/.test(it)
  // The drawing is the CARRY orientation. A weapon whose weight sits above
  // the grip is one that is carried over the shoulder, and the fight pose
  // must then TURN it: a spear stands upright on a road and leads with its
  // point in a fight, and that is one spear held two ways, not two spears.
  const fi = win.indexOf("} else if (o.anim === 'fight') {")
  const fight = win.slice(fi, win.indexOf('\n  }', fi))
  const turned = (it) => {
    const m = /if \((\/[^/]+\/)\.test\(o\.wepItem\)\) \{ cx\.rotate\(Math\.PI\)/.exec(fight)
    if (!m) return false
    // eslint-disable-next-line no-new-func
    return new Function('it', 'return (' + m[1] + ').test(it)')(it)
  }
  const wrong = []
  for (const it of Object.keys(E.WEAPONS)) {
    if (twoEnded(it)) continue
    const ys = spans(it)
    if (!ys.length) continue
    const below = Math.max(...ys), above = -Math.min(...ys)
    if (above > below && !turned(it)) {
      wrong.push(it + ' (reaches ' + above.toFixed(1) + ' back and ' + below.toFixed(1)
        + ' forward, and the fight pose does not turn it)')
    }
  }
  assert.deepEqual(wrong, [], 'held by the wrong end: ' + wrong.join(', '))
})

// ---- WHAT YOU ARE AIMING IS IN FRONT OF YOU ----
//
// The aiming stance was drawn before the body, so the tunic was painted over
// it. A bow is a thin arc reaching past the citizen and survived that; a hand
// cannon is a solid thing held across the chest, and all that showed was the
// few pixels of barrel sticking out past his shoulder.
test('a weapon being aimed is drawn in front of the body holding it', () => {
  const aimed = win.indexOf('the weapon being AIMED, in front of the body')
  assert.ok(aimed > 0, 'the aiming stance is gone or renamed')
  const tunic = win.indexOf('// tunic (trapezoid, slight lean while working)')
  assert.ok(tunic > 0, 'the body is gone or renamed')
  assert.ok(aimed > tunic,
    'the aimed weapon is painted before the body again, so the body covers it')

  // and the head still goes over everything, which is what makes it a head
  const head = win.indexOf('// head: skin, hair cap, eye toward facing')
  assert.ok(head > aimed, 'the head must be drawn after the weapon, not behind it')
})

// ---- A VERB THE TABLE CANNOT TRANSLATE IS A VERB NOBODY CAN DO ----
//
// `BRIDGE_TO_INPUT` turns the window's own word for a deed into the engine's
// input. `send()` consults it twice: once to remember what was done, and once
// to decide whether a citizen holding their own key can SIGN the deed. If the
// table has no line for the word, an own-key citizen falls through to the
// unsigned path, and serve.mjs drops unsigned acts from an external without a
// word, because externals speak in signatures alone.
//
// Trade had been in exactly that state. The table said 'offer', 'accept' and
// 'cancel'; the trade panel and the offers list send 'offer_trade',
// 'accept_trade' and 'cancel_trade'. A node-held citizen traded fine, since
// the node's ladder reads the raw action, so the fault was invisible to
// anybody testing with a hosted citizen, and total for everybody else.
test('every word a window sends is one its own table can translate', () => {
  const served = [...fs.readFileSync(path.join(root, 'serve.mjs'), 'utf8')
    .matchAll(/sendFile\('\.\/(window-[a-z0-9-]+\.html)'/g)].map((m) => m[1])
  const lost = []
  for (const f of new Set(served)) {
    const p = path.join(root, f)
    if (!fs.existsSync(p)) continue
    // comments explain what the table used to say, so neither a line in it nor
    // a word being sent may be read out of one
    const code = fs.readFileSync(p, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n').map((l) => l.replace(/(^|[^:])\/\/.*$/, '$1')).join('\n')
    const table = new Set([...code.matchAll(/a\.do === '([a-z_]+)'/g)].map((m) => m[1]))
    if (!table.size) continue                 // a window with no table of its own
    // only what goes through `send`. A window that builds its own act frame for
    // the relay is deliberately not signing it and is not this test's business.
    const sent = new Set([...code.matchAll(/send\(\{\s*do:\s*'([a-z_]+)'/g)].map((m) => m[1]))
    for (const d of [...sent].sort()) if (!table.has(d)) lost.push(`${f} sends \`${d}\``)
  }
  assert.deepEqual(lost, [], `sent but untranslatable, so unsignable: ${lost.join(', ')}`)
})

// ---- AND THE TRADE VERBS, RUN RATHER THAN READ ----
//
// The test above compares names. This one evaluates the window's own table
// with the arguments its trade panel actually passes, and hands the result to
// the engine's shape gate. It is the only check here that would catch the
// other half of the same fault: a line that translated the word and forwarded
// the wrong field would still be refused at the node, where nobody in the
// window can see it.
import vm from 'node:vm'

test('the trade panel builds a table the engine will take', () => {
  const src = win.match(/const BRIDGE_TO_INPUT = \(a\) =>[\s\S]*?\n {2}null\n/)
  assert.ok(src, 'the translation table is gone or renamed')
  const ctx = vm.createContext({ combatStyle: 'even' })
  vm.runInContext(src[0] + '\n; globalThis.T = BRIDGE_TO_INPUT;', ctx)

  const base = {
    playerId: 'a'.repeat(64), worldId: 'b'.repeat(64), tick: 7, sig: 'c'.repeat(128),
  }
  const them = 'd'.repeat(64)
  // §5c-ii: exactly what the panel, the pack tap and the coin stepper send
  const said = [
    { do: 'trade', with: them, slots: [], gold: 0 },        // sitting down
    { do: 'trade', with: them, slots: [0, 3], gold: 0 },    // two things up
    { do: 'trade', with: them, slots: [], gold: 120 },      // coin and no goods
    { do: 'settle' },
    { do: 'untrade' },
  ]
  for (const a of said) {
    const inp = ctx.T(a)
    assert.ok(inp, `the table has no line for ${a.do}, so it cannot be signed`)
    // the gate answers null when it is content and a sentence when it is not
    const why = E.validateInputShape({ ...base, ...inp })
    assert.equal(why ?? null, null, `${a.do} builds an input the engine refuses: ${why}`)
  }
  // a side is a LIST of slots and an amount of coin, and both may be empty.
  // Copied out of the table's own realm first: an array built in there has a
  // different Array.prototype, and strict deepEqual holds that against it.
  assert.deepEqual([...ctx.T(said[1]).slots], [0, 3])
  assert.equal(ctx.T(said[2]).gold, 120)
  assert.deepEqual([...ctx.T(said[0]).slots], [])
})

// ---- AND THE PANEL DRAWS BOTH SIDES OF IT ----
//
// The old panel was two dropdowns and a sentence: you could not see what you
// were getting, put anything up yourself, ask for two things, or give. Reading
// the window as text cannot prove the drawing is good, but it can prove the
// panel reads the OTHER citizen's side at all, which is the thing that was
// structurally missing rather than merely ugly.
test('the trade panel reads both sides of the table', () => {
  const code = win.replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map((l) => l.replace(/(^|[^:])\/\/.*$/, '$1')).join('\n')
  const draw = code.slice(code.indexOf('function drawTable('))
  assert.ok(draw.startsWith('function drawTable('), 'the table panel is gone or renamed')
  const body = draw.slice(0, draw.indexOf('\nfunction ', 10))
  assert.match(body, /them\.trade/, 'the panel must draw the other side, not only mine')
  assert.match(body, /settled/, 'and whether they have accepted')
  assert.match(body, /tableSide\(me[\s\S]*tableSide\(them/,
    'mine first, then theirs, so the two are read in the same order every time')
  // and the pack is what puts things on it, rather than a second pack drawn
  // inside the panel on a phone that has no room for one
  assert.match(code, /if \(meNow\.trade && tableToggle\(i\)\) return/,
    'a pack tap while a table is open must put the thing up')
})

// ---- WHAT THE ISLAND SWEEP FOUND ----
//
// `sweep.mjs` stands the real window up in a real browser, hands it the real
// island and photographs 136 places. These are the faults that came back, and
// a check for each, so the next sweep does not find them again.

test('a palisade joins a palisade', () => {
  // The neighbour index was built from `type === 'wall'` alone, while the
  // branch that reads it serves walls AND palisades. So no palisade ever saw
  // a neighbour: every tile of a town's curtain wall drew as a capped,
  // outlined block, and a run of forty read as forty posts in a row.
  const code = win.replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map((l) => l.replace(/(^|[^:])\/\/.*$/, '$1')).join('\n')
  const idx = code.match(/function wallAt\(st, x, y\) \{[\s\S]*?\n\}/)
  assert.ok(idx, 'the wall neighbour index is gone or renamed')
  assert.ok(!/q\.type === 'wall'/.test(idx[0]),
    'the index tests one type again, so palisades have stopped joining up')
  const joins = code.match(/const JOINS = new Set\(\[([^\]]*)\]\)/)
  assert.ok(joins, 'the set of types that join a wall is gone')
  for (const t of ['wall', 'palisade']) {
    assert.ok(joins[1].includes(`'${t}'`), `${t} must join a wall`)
  }
})

test('a fence knows which way it runs', () => {
  const code = win.replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map((l) => l.replace(/(^|[^:])\/\/.*$/, '$1')).join('\n')
  const at = code.indexOf("if (n.type === 'fence') {")
  assert.ok(at > 0, 'the fence drawing is gone or renamed')
  const body = code.slice(at, code.indexOf("if (n.type === ", at + 30))
  // it asks about all four neighbours, and draws a different shape downwards
  for (const side of ['n.x - 1, n.y', 'n.x + 1, n.y', 'n.x, n.y - 1', 'n.x, n.y + 1']) {
    assert.ok(body.includes(`fenceAt(s, ${side})`), `the fence never asks about ${side}`)
  }
  assert.match(body, /const down = \(fu \|\| fd\) && !\(fl \|\| fr\)/,
    'a run with neighbours above and below must be drawn down the tile')
})

test('every landmark the window gates is one it can draw', () => {
  // §7f: the gate on the landmark art shut fifty-five drawings out once
  // already. The sweep found an eleventh thing it was shutting out:
  // `bridge-stone`, which stands at the end of every span.
  const gate = win.match(/const LM18 = new Set\(\[([\s\S]*?)\]\)/)
  assert.ok(gate, 'the landmark gate is gone or renamed')
  const gated = [...gate[1].matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1])
  assert.equal(gated.length, new Set(gated).size, 'a kind is gated twice')
  assert.ok(gated.includes('bridge-stone'), 'bridge-stone is gated out again')
  // and every gated kind has a branch that names it in the drawing chain
  const chain = win.slice(win.indexOf("n.type === 'landmark' && LM18.has(n.kind)"))
  const missing = gated.filter((k) => !new RegExp(`K === '${k}'`).test(chain)
    && !new RegExp(`'${k}'`).test(chain))
  assert.deepEqual(missing, [], `gated but never drawn: ${missing.join(', ')}`)
})

test('a keeper is what the world says they are', () => {
  // All 158 keepers on the island carry their calling. The window read none
  // of it: the role came from scraps of the node id and from whatever stood
  // within two tiles, so the collier at his charcoal ring and the beekeeper
  // among the skeps both came out as the same anonymous brown figure.
  const code = win.replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map((l) => l.replace(/(^|[^:])\/\/.*$/, '$1')).join('\n')
  const fn = code.slice(code.indexOf('function keeperRole4('))
  const body = fn.slice(0, fn.indexOf('\nfunction ', 10))
  assert.match(body, /n\.kind/, 'the keeper drawing asks the world nothing again')
  const table = code.match(/const KEEPER_ROLE = \{([\s\S]*?)\n\}/)
  assert.ok(table, 'the table from calling to look is gone')
  const callings = [...table[1].matchAll(/([a-z]+):\s*'([a-z]+)'/g)]
  assert.ok(callings.length >= 20, `only ${callings.length} callings have a look`)
  // every look the table names is one the drawing actually has a palette for
  const palette = code.match(/const T = \{([\s\S]*?)\}\[role\]/)
  assert.ok(palette, 'the keeper palette is gone')
  const looks = new Set([...palette[1].matchAll(/^\s*([a-z]+):/gm)].map((m) => m[1]))
  const orphans = [...new Set(callings.map((m) => m[2]))]
    .filter((r) => !looks.has(r) && r !== 'wizard')
  assert.deepEqual(orphans, [], `a calling points at a look with no palette: ${orphans.join(', ')}`)
})

test('a coast wears sand whichever way it faces', () => {
  const code = win.replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map((l) => l.replace(/(^|[^:])\/\/.*$/, '$1')).join('\n')
  const at = code.indexOf('const wt = curState?._waterTiles')
  assert.ok(at > 0, 'the shoreline is gone or renamed')
  const body = code.slice(at, at + 700)
  // one question, asked four times. Two of the four used to leave out the sea.
  assert.match(body, /const wet = \(qx, qy\) =>/, 'the four sides ask different questions again')
  const asked = (body.match(/if \(wet\(/g) ?? []).length
  assert.equal(asked, 4, `a side of the coast is unasked: ${asked} of 4`)
})

// ---- EVERYTHING THE ENGINE LETS YOU WEAR, THIS WINDOW LETS YOU WEAR ----
//
// `EQUIPPABLE` in window-web is a written-out copy of a set the engine
// DERIVES (every smithing recipe, plus the handful that are fletched or
// found), so it goes stale the moment anybody adds a recipe, and this world
// adds recipes. Its own margin records it going stale twice -- seven words
// the first time, twenty-five the second -- and both times the fix was a note
// saying the list is "worth a check that runs rather than a comment that
// asks", naming `check-equip.mjs`. That file has never existed. It had gone
// stale a third time by thirteen more words when this test was written: all
// four barrow masks, the torch, the great mell, the fire-siphon, the gold
// chain, the bone staff and the four raw metals.
//
// A word that is not in that set cannot be worn from this window AT ALL: the
// pack offers unmake, vault and drop instead, so a citizen holding a
// hart-mask had no way to put it on.
test('every word the engine lets you take up, this window lets you take up', () => {
  const src = win.match(/const EQUIPPABLE = new Set\(\[([\s\S]*?)\]\)/)
  assert.ok(src, 'the window’s equippable set is gone or renamed')
  const held = new Set([...src[1].matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]))
  const engine = [...E.EQUIPPABLE].sort()
  const lost = engine.filter((it) => !held.has(it))
  assert.deepEqual(lost, [], `the engine lets you wear these and the window does not: ${lost.join(', ')}`)
  const extra = [...held].filter((it) => !E.EQUIPPABLE.has(it)).sort()
  assert.deepEqual(extra, [], `the window offers these and the engine refuses them: ${extra.join(', ')}`)
})

// ---- AND THE LIVING ARE DRAWN IN WHAT THEY ARE WEARING ----
//
// There are two `drawCitizen` calls: one for a citizen who is FALLING and one
// for everybody else. `headItem` and `bodyItem` went onto the falling one and
// not onto the other, and every drawing that reads them is on the head and
// the body: the great helm, the shell helm, the king's shroud, the shell
// plate, the great plate and the four barrow masks. So a citizen wearing any
// of those was drawn as plain iron for as long as they were alive, and turned
// into what they had been wearing the moment they began to die.
//
// The margin beside those two calls already records this exact mistake with
// two OTHER fields, which is why it is a test now rather than a third note.
test('a living citizen is drawn in the gear they are actually wearing', () => {
  const code = win.replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map((l) => l.replace(/(^|[^:])\/\/.*$/, '$1')).join('\n')
  // every field the figure drawing reads off its options about worn gear
  const draw = code.slice(code.indexOf('function drawCitizen'))
  const reads = new Set([...draw.matchAll(/\bo\.(headItem|bodyItem|shield|legs|helm|plate|crown|cape)\b/g)]
    .map((m) => m[1]))
  assert.ok(reads.has('headItem') && reads.has('bodyItem'),
    'the drawing has stopped asking what is actually worn')
  // and both call sites must hand them over
  // the CALLS, not the declaration: `function drawCitizen(X, Y, o)` matches
  // the same text and hands over nothing, which is not a fault in it
  const calls = [...code.matchAll(/(?<!function )drawCitizen\(/g)].map((m) => m.index)
  assert.equal(calls.length, 2, `expected two drawCitizen calls, found ${calls.length}`)
  for (const at of calls) {
    const opts = code.slice(at, at + 3600)
    for (const field of ['headItem', 'bodyItem', 'cape']) {
      assert.ok(opts.includes(field + ':'),
        `a drawCitizen call never passes ${field}, so that gear is invisible on whoever it draws`)
    }
  }
})

// ---- THE CAPE IS THE GRADE ----
//
// §4c-ii. The cape had three steps and two of them could never happen: §5k
// caps every skill outside a citizen's sworn calling at CAP_OTHER, so exactly
// one skill can ever reach a hundred, and the gold trim wanted a second
// mastery while the radiant cape wanted nine. It also arrived at level one
// hundred, which §5x says makes a citizen ELIGIBLE and not a master: you are
// not a master until you have made one.
test('exactly one skill can ever reach mastery', () => {
  // the premise the whole section rests on, asked of the engine rather than
  // believed: a sworn citizen's other eight crafts stop below a hundred
  const p = { calling: 'forester', skills: Object.fromEntries(E.SKILLS.map((s) => [s, 0])) }
  const own = E.SWORN.forester.skill
  for (const sk of E.SKILLS) {
    const ceil = E.xpCeiling(p, sk)
    if (sk === own) { assert.equal(ceil, Infinity, 'the sworn calling must have no ceiling'); continue }
    assert.ok(E.levelForXp(ceil) < E.MASTERY,
      `${sk} can reach ${E.levelForXp(ceil)}, so a second mastery is possible after all`)
  }
})

test('a cape for every craft, and it says which grade', () => {
  const blk = win.match(/const CAPE_COLORS = \{([\s\S]*?)\n\}/)[1]
  const keys = [...blk.matchAll(/^\s*([a-z]+):/gm)].map((m) => m[1])
  assert.deepEqual(keys.slice().sort(), [...E.SKILLS].sort(), 'a craft with no cape')
  const code = win.replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map((l) => l.replace(/(^|[^:])\/\/.*$/, '$1')).join('\n')
  const fn = code.slice(code.indexOf('function capeOf('))
  const body = fn.slice(0, fn.indexOf('\n}') + 2)
  // the sworn calling's own skill, at mastery
  assert.match(body, /SWORN_SKILL/, 'the cape no longer asks what the citizen swore to')
  assert.match(body, new RegExp('< ' + E.MASTERY), 'the cape has drifted off mastery')
  // and the two upper steps count what the world can actually count
  assert.match(body, /p\.raised/, 'the trim is back on a second mastery, which cannot happen')
  assert.match(body, /trim: raised >= CAPE_RAISED_MASTER/)
  assert.match(body, /radiant: raised >= CAPE_RAISED_RADIANT/)
  // §5x: one raised makes a master. Three is every apprentice slot this world
  // gives, which APPRENTICE_MILESTONES sets at three.
  const nums = win.match(/const CAPE_RAISED_MASTER = (\d+), CAPE_RAISED_RADIANT = (\d+)/)
  assert.ok(nums, 'the two thresholds are gone or renamed')
  assert.equal(Number(nums[1]), 1, 'one raised is what §5x says makes a master')
  assert.equal(Number(nums[2]), E.APPRENTICE_MILESTONES.length,
    'the radiant cape wants every apprentice slot the world gives')
  // and it hangs, so it sways: nothing loose in this window stands rigid
  const draw = code.slice(code.indexOf('if (o.cape) {'), code.indexOf('if (o.cape) {') + 700)
  assert.match(draw, /sway/, 'the cape has stopped moving')
})

test('the window and the engine agree which craft a calling masters', () => {
  const blk = win.match(/const CALLINGS_OF = \{([\s\S]*?)\n\}/)[1]
  const winOf = {}
  for (const m of blk.matchAll(/([a-z]+): \[([^\]]*)\]/g))
    for (const c of m[2].matchAll(/'([a-z]+)'/g)) winOf[c[1]] = m[1]
  const bad = []
  for (const [calling, v] of Object.entries(E.SWORN)) {
    if (winOf[calling] !== v.skill) bad.push(`${calling}: engine ${v.skill}, window ${winOf[calling] ?? 'MISSING'}`)
  }
  for (const c of Object.keys(winOf)) if (!E.SWORN[c]) bad.push(`${c}: the window has it and the engine does not`)
  assert.deepEqual(bad, [], bad.join('; '))
})

// ---- EVERY DEED A CITIZEN CAN DO, THE WINDOW CAN SEND ----
//
// Counted against the engine's own schemas: of the inputs it validates, eight
// were things a CITIZEN does and no window the router offers could build one.
// Not window-web, not hill, mist, writ, 3d, photo, diablo or holo. The serve
// ladder carried three of them, so the plumbing was half laid and nothing
// ever asked.
//
// Three are exempt and say so in the engine's own margin: `archive` and
// `restore` are a node's business rather than a citizen's, and `recall` can
// only ever fail now that the waystones are gone (§6ch) -- its schema is kept
// so an old client is REFUSED rather than desynced.
test('the flat window can build every input a citizen may send', () => {
  const eng = fs.readFileSync(path.join(root, 'engine.js'), 'utf8')
  // THE KEYS, BY COUNTING BRACES, NOT BY INDENT.
  //
  // This read `^ {2}([a-z_]+):` out of the schema table, which finds a key only
  // when it begins a line -- and twenty-two of them share a line with another
  // (`drop: { slot: T.slot }, eat: { slot: T.slot }, cook: ...`). So it found
  // 69 of the 91 and the `assert.ok(types.length > 60)` guard waved it
  // through. Everything it missed went unchecked, and `read_chart` was among
  // them.
  const i0 = eng.indexOf('const INPUT_SCHEMAS = {')
  let depth = 0, close = -1
  for (let i = eng.indexOf('{', i0); i < eng.length; i++) {
    if (eng[i] === '{') depth++
    else if (eng[i] === '}') { depth--; if (!depth) { close = i; break } }
  }
  assert.ok(close > i0, 'engine.js INPUT_SCHEMAS does not close')
  // the keys at depth one: strip the nested shapes, then read what is left
  const inner = eng.slice(eng.indexOf('{', i0) + 1, close)
    .replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
  let flat = '', d2 = 0
  for (const ch of inner) {
    if (ch === '{' || ch === '[' || ch === '(') d2++
    else if (ch === '}' || ch === ']' || ch === ')') d2--
    else if (!d2) flat += ch
  }
  const types = [...new Set([...flat.matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*:/g)].map((m) => m[1]))]
    .filter((t) => !['sig', 'tick'].includes(t))
  assert.ok(types.length > 85, `found ${types.length} input types, which cannot be right`)
  const NODES_BUSINESS = new Set(['archive', 'restore'])
  // §6ch: `recall` can only ever fail now that the waystones are gone, and its
  // schema is kept so an old client is REFUSED rather than desynced.
  // §6ci: and `read_chart` applies nothing at all -- the engine's own margin
  // says "a chart is read by a buyer, not by its holder. Nothing to apply." A
  // citizen may send two deeds an interval, so a button for an input that does
  // nothing would spend one of them on nothing.
  const ALWAYS_REFUSED = new Set(['recall', 'read_chart'])
  const code = win.replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map((l) => l.replace(/(^|[^:])\/\/.*$/, '$1')).join('\n')
  const built = new Set([...code.matchAll(/\{ type: '([a-z_]+)'/g)].map((m) => m[1]))
  const lost = types.filter((t) => !built.has(t) && !NODES_BUSINESS.has(t) && !ALWAYS_REFUSED.has(t))
  assert.deepEqual(lost, [], `the engine takes these from a citizen and this window cannot say them: ${lost.join(', ')}`)
})

// AND EACH OF THEM HAS SOMEWHERE TO BE PRESSED.
//
// A line in the translation table is not a button. These eight were wired to
// the places they are done: the crushing floor, the bellwork, the hoard, the
// quay, the spanwork, the crossing site itself, the ossuary, and the citizen's
// own column for the promise.
test('the eight new deeds are reachable from somewhere in the window', () => {
  const code = win.replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map((l) => l.replace(/(^|[^:])\/\/.*$/, '$1')).join('\n')
  const WHERE = {
    stamp: "n.type === 'stamp'",
    haul: "n.type === 'bellwork'",
    rifle: "n.type === 'hoard'",
    sail: "n.type === 'ferry'",
    lay: "n.type === 'spanwork'",
    found: 'spanSiteAt4',
    offer: "do: 'offer'",
    stint: "do: 'stint'",
  }
  const missing = []
  for (const [verb, mark] of Object.entries(WHERE)) {
    if (!code.includes(mark)) missing.push(`${verb}: no ${mark}`)
    if (!new RegExp(`do: '${verb}'`).test(code)) missing.push(`${verb}: nothing sends it`)
  }
  assert.deepEqual(missing, [], missing.join('; '))
})

test('the window knows the same crossing sites the generator lays', async () => {
  // the window inlines these for the same reason it inlines the v7 water: one
  // file, no imports. Held to the generator so the two cannot drift.
  const WG = await import('../worldgen-expanse7.mjs')
  const blk = win.match(/const SPAN_SITES = \[([\s\S]*?)\n\]/)
  assert.ok(blk, 'the window’s crossing sites are gone or renamed')
  const mine = [...blk[1].matchAll(/x: (\d+), y: (\d+)/g)].map((m) => m[1] + ',' + m[2]).sort()
  const theirs = WG.SPAN_SITES.map((s) => s.x + ',' + s.y).sort()
  assert.deepEqual(mine, theirs, 'the window offers a crossing the generator does not lay, or misses one')
  // and the rate, which the window offers as a choice
  const per = Number(win.match(/const PER_LAY = (\d+)/)[1])
  const g = WG.makeExpanse7Genesis('rate', 'a'.repeat(64), 0, 896, 512)
  assert.equal(per, g.span.perLay, 'the window offers a different number of planks than the founding allows')
})

test('the drowned bell comes up as the town pulls', () => {
  const code = win.replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map((l) => l.replace(/(^|[^:])\/\/.*$/, '$1')).join('\n')
  const at = code.indexOf("n.type === 'bellwork' || n.type === 'bell'")
  assert.ok(at > 0, 'the bellwork drawing is gone or renamed')
  const body = code.slice(at, at + 4200)
  // the bell's own height IS the progress: it was a bar under a bell that
  // hung in the same place from the first pull to the last.
  assert.match(body, /const deep = \d+(\.\d+)? \* \(1 - part\)/,
    'the bell no longer rises as the work goes on')
  assert.match(body, /translate\(X \+ 20, Y \+ \d+ \+ deep/, 'the rise is computed and not used')
  assert.match(body, /const water = Y/, 'the marsh is gone, so there is nothing for it to come out of')
  // and the hands, which is what a citizen standing at the rope needs to know
  assert.match(body, /BELL_HANDS/, 'the window no longer says how many hands a pull wants')
  // held to the engine, like the pulls beside it
  const eng = fs.readFileSync(path.join(root, 'engine.js'), 'utf8')
  const m = eng.match(/const BELL_HANDS = (\d+), BELL_HOLD = (\d+), BELL_PULLS = (\d+)/)
  assert.equal(Number(win.match(/const BELL_HANDS = (\d+)/)[1]), Number(m[1]))
  assert.equal(Number(win.match(/const BELL_PULLS = (\d+)/)[1]), Number(m[3]))
})

// ---- A MENU OPENS WHERE YOU PRESSED ----
//
// `chooseAction` opened at the pointer only when `_menuAt` was set, and the
// one thing that set it was the RIGHT-click handler. Every left-click menu
// came out as a row of buttons above the pack, a long way from the tree or
// the citizen you had just touched, and on a phone there is no right button
// to get the better behaviour with.
test('a menu opens under the thing that was pressed', () => {
  const code = win.replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map((l) => l.replace(/(^|[^:])\/\/.*$/, '$1')).join('\n')
  assert.match(code, /_pressAt = \{ x: e\.clientX, y: e\.clientY \}/,
    'the window has stopped remembering where the press landed')
  assert.match(code, /const where = at \?\? _menuAt \?\? _pressAt/,
    'chooseAction no longer falls back to the press position')
  // and floatMenu still folds back over the pointer near an edge
  const fm = code.slice(code.indexOf('function floatMenu('))
  assert.match(fm.slice(0, 1400), /Math\.min\(at\.x, innerWidth - r\.width/,
    'a menu near the edge hangs off the window again')
})

// ---- A SHOP IS AT THE SHOP ----
//
// Clicking a stall printed its wares into the log and said "Buy from the bar
// below": a row of buttons above the pack, at the other end of the screen
// from the stall you had just touched. Clicking your OWN stall called
// `openMyStall`, which does not exist anywhere in this file and never has, so
// it threw and the error went into the log.
test('a stall is bought from at the stall', () => {
  const code = win.replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map((l) => l.replace(/(^|[^:])\/\/.*$/, '$1')).join('\n')
  assert.equal(/openMyStall/.test(code), false, 'the stall still calls a function that does not exist')
  // the SECOND occurrence: the first is the stall's drawing, which names the
  // same type and sells nothing
  const at = code.lastIndexOf("if (n.type === 'stall') {")
  assert.ok(at > 0, 'the stall click is gone or renamed')
  const body = code.slice(at, at + 2400)
  assert.match(body, /chooseAction\(/, 'the stall no longer opens anything')
  assert.match(body, /do: 'buy', item: it/, 'the stall menu does not buy')
  assert.equal(/bar below/.test(body), false, 'the stall points at a bar again')
  // every ware is offered, and what you cannot afford is dimmed rather than
  // hidden: the price is the thing a citizen came to find out
  assert.match(body, /dim: branded \|\| purse < pr/)
  // and the citizen's own stall is tended where it stands
  const mk = code.indexOf("if (n.by === myId) {")
  assert.ok(mk > 0, 'the own-stall branch is gone')
  const mine = code.slice(mk, mk + 2600)
  for (const verb of ['stock_market', 'price_market', 'take_market', 'dismantle_market']) {
    assert.ok(mine.includes(verb), `your own stall cannot ${verb} from the stall`)
  }
})

test('every stall the engine stocks, the window stocks the same', () => {
  const blk = win.match(/const STALL_SELLS = \{([\s\S]*?)\n\}/)
  assert.ok(blk, 'the window’s stall table is gone')
  const mine = {}
  for (const m of blk[1].matchAll(/([a-z]+):\s*\{([^}]*)\}/g)) {
    // a key is quoted only when it has to be: `seeds: 22` and `'iron-helm': 24`
    mine[m[1]] = Object.fromEntries(
      [...m[2].matchAll(/'?([a-z-]+)'?:\s*(\d+)/g)].map((x) => [x[1], Number(x[2])]))
  }
  assert.deepEqual(Object.keys(mine).sort(), Object.keys(E.STALL_SELLS).sort(), 'a stall kind differs')
  for (const [kind, stock] of Object.entries(E.STALL_SELLS)) {
    assert.deepEqual(mine[kind], stock, `the ${kind} stall sells something different in the window`)
  }
})

// ---- WHAT IS FIXED IN HEIGHT MUST SAY SO ----
//
// `#panel` is a flex column, so every child defaults to shrinkable, and when
// the column overflows -- which on a phone it always does -- a child with a
// fixed height is squeezed to nothing. Measured: the health bar was fourteen
// pixels in the stylesheet and NOUGHT on the screen, and the number still
// showed because `#hptext` is positioned absolutely and overflows the box. So
// the one readout a citizen must take in at a glance mid-fight had been a
// bare line of text on every phone since the panel started scrolling.
test('the health bar has a height the panel cannot squeeze', () => {
  const css = win.slice(0, win.indexOf('</style>'))
  const bar = css.match(/#hpbar \{([^}]*)\}/)
  assert.ok(bar, 'the health bar is gone or renamed')
  assert.match(bar[1], /height: \d+px/, 'the bar has no height of its own')
  assert.match(bar[1], /flex: none/, 'the bar can be squeezed to nothing again')
  // the table learned the same lesson first
  const tr = css.match(/#trade \{([^}]*)\}/)
  assert.ok(tr && /flex: none/.test(tr[1]), 'the trade table can be squeezed again')
})

test('the nine fold away, and the pack does not', () => {
  const code = win.replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map((l) => l.replace(/(^|[^:])\/\/.*$/, '$1')).join('\n')
  assert.match(win, /id="skillsbtn"/, 'the skills bar is gone')
  assert.match(code, /localStorage\.setItem\('iv\.skills'/, 'the fold is not remembered')
  assert.match(code, /let open2 = innerWidth > 900/, 'the fold no longer depends on the room there is')
  // the pack is never folded: it is the thing a citizen touches every few seconds
  assert.equal(/id="invbtn"/.test(win), false, 'the pack has been given a fold, which it must not have')
})

// §7d-iv, THE OTHER WAY ROUND: NO DRAWING IN THE CLICK HANDLER.
//
// This has now happened twice and in both directions. First five interaction
// branches -- the furnace, the altar, the rockfall, the mill and the sawpit --
// were written into `drawScene`, so every one of them ran its logic on every
// animation frame and a citizen crashed the window by WALKING PAST a thing.
// Then a DRAWING of a citizen's stall was pasted into the click handler, above
// the branch that tends and buys from one: it filled rectangles with `cx` on a
// click, matched first, and RETURNED, so every click on a stall painted
// trestles into the frame and the whole menu below it was unreachable code.
// A citizen could not buy from a stall and could not price their own.
//
// The two are one mistake with one tell: a canvas call in the click handler.
test('the click handler draws nothing, and nothing it does is unreachable', () => {
  // §7ei: the handler is a NAMED FUNCTION now, because the right button needs
  // to reach it too and a listener body cannot be called twice. Anchoring on
  // the listener finds a line BELOW the whole handler and every search from
  // it comes up empty.
  const at = win.indexOf('function worldPress(')
  assert.ok(at > 0, 'window-web no longer has a world press handler')
  // to the end of that listener, by counting braces from its opening
  let depth = 0, end = at
  for (let i = win.indexOf('{', at); i < win.length; i++) {
    if (win[i] === '{') depth++
    else if (win[i] === '}') { depth--; if (!depth) { end = i; break } }
  }
  const body = win.slice(at, end)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map((l) => l.replace(/(^|[^:])\/\/.*$/, '$1')).join('\n')
  const paints = [...body.matchAll(/\b(cx\.fill|cx\.stroke|cx\.drawImage|shadow\(|poly\()/g)]
    .map((m) => m[1])
  assert.deepEqual([...new Set(paints)], [],
    `the click handler paints: ${[...new Set(paints)].join(', ')}. A drawing in here `
    + 'matches first and returns, so every branch below it is unreachable.')
  // and the same branch may not be OPENED twice: `if (n.type === 'market') {`
  // appearing twice is exactly how the stall menu became unreachable, and a
  // type may legitimately be tested many times in guards and compound
  // conditions, so this matches the branch opening and nothing else.
  const opens = [...body.matchAll(/if \(n\.type === '([a-z-]+)'\) \{/g)].map((m) => m[1])
  const twice = [...new Set(opens.filter((t, i) => opens.indexOf(t) !== i))]
  assert.deepEqual(twice, [],
    `two branches open on the same node type, so the second is dead: ${twice.join(', ')}`)
})

// §7f-ix: EVERY LANDMARK KIND HAS ART OF ITS OWN, AND THE FALLBACK IS A MARKER.
//
// This chain used to END in the broken tower, so every landmark kind the
// window did not know was painted as ruined masonry. The wellspring's own
// comment in this file records how close that came to mattering: "without
// these lines the one place on the island that takes a wound off would have
// been painted as ruined masonry -- a citizen could stand on it and see
// something else."
//
// A fallback that draws a REAL thing cannot be noticed, which is the same
// fault window-photo had in the other direction (its fallback was a
// shipwreck, and 1,821 props on the island were beached boats). So: every kind
// the engine will accept has a branch of its own, and whatever reaches the
// fallback says the word out loud.
test('every landmark kind the engine accepts has art of its own', () => {
  const code = win.replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map((l) => l.replace(/(^|[^:])\/\/.*$/, '$1')).join('\n')
  const arms = new Set([...code.matchAll(/(?:K|n\.kind) === '([a-z0-9-]+)'/g)].map((m) => m[1]))
  assert.ok(E.LANDMARK_KINDS, 'engine.js no longer exports LANDMARK_KINDS')
  const bare = [...E.LANDMARK_KINDS].filter((k) => !arms.has(k))
  assert.deepEqual(bare, [],
    `these stand on the island and this window has no branch for them: ${bare.join(' ')}`)
})

test('the landmark fallback names what it could not draw', () => {
  assert.ok(/function undrawnKind/.test(win),
    'window-web has no way to report a word it cannot draw')
  // and the fallback uses it: the arm with no condition on it
  const at = win.lastIndexOf('undrawnKind(')
  assert.ok(at > 0, 'nothing calls undrawnKind')
  const before = win.slice(Math.max(0, at - 400), at)
  assert.ok(/\} else \{/.test(before),
    'undrawnKind is not called from the fallback arm of the landmark chain')
})

// §7ec: THE WINDOW'S GROUND IS THE WORLD'S GROUND.
//
// Every window carries a copy of the island's surfaces, because a browser
// cannot import a nine-thousand-line generator that imports the engine. The
// copies had never been compared to the thing they copy, and they had come
// apart badly: measured tile by tile, the flat window drew different ground
// from the one a citizen walks on in FIFTEEN THOUSAND places. Not one floor
// tile was drawn anywhere on the island, so every house in every town stood on
// grass; the chalk ways of the Downs, the peat ways of the Moor, the causey
// over the fen and every beach were drawn as the bare country.
//
// `check-mirrors-seeds.mjs` was supposed to hold them together. It reads
// terrain blocks out of the window HTML files, which have not held one since
// the mirror was factored out; it tests expanse4, three foundings ago; and it
// throws before it compares anything.
//
// The cure is not a better copy, it is not copying: `/api/ground` serves every
// tile the world names (13KB gzipped for the island) and the window is told,
// exactly as it is already told the town seats and the road network.
test('the window draws the ground the world lays (check-mirror-ground.mjs)', () => {
  const r = spawnSync(process.execPath, [path.join(root, 'check-mirror-ground.mjs')],
    { cwd: root, encoding: 'utf8' })
  assert.equal(r.status, 0, '\n' + r.stdout + r.stderr)
})

// AND THE PILLAR CAN STILL ANSWER.
test('the pillar serves the ground it founded', () => {
  const serve = fs.readFileSync(path.join(root, 'serve.mjs'), 'utf8')
  assert.ok(serve.includes("path === '/api/ground'"), 'serve.mjs no longer serves the ground')
  assert.ok(/groundKindOf/.test(serve), 'serve.mjs does not ask the generator for it')
  const win = fs.readFileSync(path.join(root, 'window-web.html'), 'utf8')
  assert.ok(/api\('\/api\/ground'\)/.test(win), 'window-web no longer fetches the ground')
  assert.ok(/function groundToldAt/.test(win), 'window-web has nowhere to put it')
})

// §7ee: THE BANK AND THE COUNTER SHOW WHAT THEY HOLD.
//
// Both answered with a single sentence and no way to act on it. The bank said
// "tap items to deposit, tap the vault to withdraw" and tapping the vault
// printed that same sentence again, so the one thing a bank is FOR -- knowing
// what you have in it -- could not be done at the bank. The counter said
// "discharge what you carried, or set the container down" and offered neither,
// at the only place in the world where a consignment can be taken up or set
// down.
//
// The stall had already been given the right shape: a heading, the goods, and
// the acts that are actually available. These are the same kind of moment.
test('the bank and the counter open a list, like the stall does', () => {
  const code = win.replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map((l) => l.replace(/(^|[^:])\/\/.*$/, '$1')).join('\n')
  // SEARCH INSIDE THE CLICK HANDLER, not from the top of the file. Both of
  // these types have a branch in `drawScene` under the identical condition,
  // and the drawing comes first, so a plain indexOf tests the art and reports
  // that the bank answers with a sentence. The same shape as the fault that
  // made the stall menu unreachable: two branches, one condition.
  const clicks = code.indexOf('function worldPress(')
  assert.ok(clicks > 0, 'window-web has no world press handler')
  const branch = (type) => {
    const at = code.indexOf(`if (n.type === '${type}') {`, clicks)
    assert.ok(at > 0, `no click branch for ${type}`)
    // to the end of that branch, by counting braces
    let d = 0
    for (let i = code.indexOf('{', at); i < code.length; i++) {
      if (code[i] === '{') d++
      else if (code[i] === '}') { d--; if (!d) return code.slice(at, i + 1) }
    }
    return ''
  }
  const vault = branch('vault')
  assert.ok(/chooseAction\(/.test(vault), 'the bank still answers with a sentence')
  assert.ok(/do: 'withdraw'/.test(vault), 'nothing in the bank branch withdraws')
  assert.ok(/do: 'deposit_all'/.test(vault), 'the bank cannot take the pack')
  assert.ok(/vaults\?\.\[id\]|vaults\[id\]/.test(vault), 'the bank does not read what is in it')

  const store = branch('store')
  assert.ok(/chooseAction\(/.test(store), 'the counter still answers with a sentence')
  assert.ok(/do: 'consign'/.test(store), 'nothing at the counter seals a consignment')
  assert.ok(/do: 'deliver'/.test(store), 'nothing at the counter discharges one')
})

// §7ec: A FLOOR DOES NOT FRAY.
//
// Fraying is for ground that WEARS into its neighbour: grass creeping over a
// yard, a beach eating a bank. A floor ends at a wall, which is a built edge
// and a straight one, and boards crumbling into the street look like a ruin
// rather than a room.
test('a floor does not fray into the street', () => {
  const at = win.indexOf('const seamAt = (qx, qy, side)')
  assert.ok(at > 0, 'window-web no longer frays its seams')
  const fn = win.slice(at, at + 1200)
  assert.ok(/=== 'floor'/.test(fn), 'the fray does not exempt a floor')
})

// §7ef: A SHEEP STANDING IN A FIELD IS NOT OFFERING YOU A NUMBER.
//
// Every creature carried "sheep 40/40 hp hits 1" over its head at all times.
// Nine sheep at the Sheepfolds overlapped into "sheep 40/40 hp hitsheep 40/40
// hp hits 1" and covered more of the field than the sheep did. It is the one
// thing that made the window read as a debug view of a world rather than as
// the world, and it is the same rule the menus already follow: say what is
// wanted at the moment it is wanted.
//
// The plate is drawn only when the creature is POINTED AT, FIGHTING, or
// WOUNDED. This holds the gate rather than the art, because a gate is what a
// later edit removes without noticing.
test('a creature only says what it is when asked, or when it is in a fight', () => {
  const at = win.indexOf("const _hov = hoverT")
  assert.ok(at > 0, 'the creature plate no longer asks whether it is hovered')
  const seg = win.slice(at, at + 3200)   // the comments between the two grew
  // the gate itself
  assert.match(seg, /if \(_hov \|\| engaged \|\| _hurt\) \{/,
    'the plate must be gated on pointed-at, fighting or wounded')
  // and the text may only be painted INSIDE it: find the gate's braces and
  // check every fillText between here and the end of the creature falls in
  const gate = seg.indexOf('if (_hov || engaged || _hurt) {')
  let depth = 0, end = gate
  for (let i = seg.indexOf('{', gate); i < seg.length; i++) {
    if (seg[i] === '{') depth++
    else if (seg[i] === '}') { depth--; if (!depth) { end = i; break } }
  }
  const before = seg.slice(0, gate)
  assert.ok(!/fillText\(plate/.test(before),
    'the plate is painted before the gate, so the gate does nothing')
  assert.match(seg.slice(gate, end), /fillText\(plate/,
    'the gate should be what the plate is painted inside')
})

// AND THE WINDOW HAS TO KNOW WHERE THE CURSOR IS. Nothing tracked the pointer
// at all before this: the only thing the window knew about the mouse was
// where it was CLICKED, which is why everything labelled itself.
test('the window tracks what is under the cursor', () => {
  assert.match(win, /cv\.addEventListener\('pointermove'/,
    'no pointermove listener, so nothing can ever be hovered')
  assert.match(win, /cv\.addEventListener\('pointerleave'/,
    'nothing clears the hover when the cursor leaves the canvas')
  // and the global is declared before drawScene reads it: a `let` beside its
  // listener sits in the dead zone for the three thousand lines above it
  const decl = win.indexOf('\nlet hoverT = null')
  const use = win.indexOf('const _hov = hoverT')
  assert.ok(decl > 0 && decl < use,
    'hoverT must be declared above the draw that reads it')
})

// §7eg: EVERY WORD THE WORLD STANDS UP, THE WINDOW DRAWS.
//
// This is the flat window's version of the Unreal window's
// `bReportUndrawnKinds`, and it exists because of what it found on the day it
// was written. The founded island stood up a hundred and fifty-six HEARTHS --
// eighty-nine of them the fire in a town cottage -- and `drawScene` had no
// branch for the word. Every one of them answered a click and drew nothing:
// a citizen could walk up to bare ground, click it, and be told there was a
// fire there.
//
// Worse, the art for it already existed, written for a node type called
// `house`, of which the world has stood up ZERO since v7. Dead art and an
// invisible thing are the same fault seen from two ends and neither end
// shows: there is no wrong picture to notice and no error to read.
//
// Four more went the same way, each of them the ONLY one of itself in the
// world: the furnace, the altar, the sawpit, the looking-glass. Plus the toll
// gate. All five answered a click and drew nothing.
//
// Reading the draw code is how that was missed for a year. Asking the WORLD
// what it stands up, and the window whether it has a branch for each word, is
// one page and finds it in a second.
test('every node type the island stands up, drawScene has a branch for', async () => {
  const WG = await import('../worldgen-any.mjs')
  const g = WG.foundGenesis('interval-expanse-v7', 'undrawn-check',
    '6cde7f4e2631a1af4ff405cb51d1bf78f66ba3ec83531d18adee6599d8ca1cdd',
    1789813895202, 896, 512)
  const _quiet = console.warn; console.warn = () => {}
  const world = WG.buildWorld(g)
  console.warn = _quiet
  // the family map: a type drawn by its family counts as drawn
  const fam = {}
  {
    const m = win.match(/const NODE_FAMILY = \{[\s\S]*?\n\}/)
    assert.ok(m, 'window-web no longer declares NODE_FAMILY')
    for (const [, k, v] of m[0].matchAll(/'([a-z-]+)':\s*'([a-z-]+)'/g)) fam[k] = v
  }
  // drawScene, by its own braces
  const at = win.indexOf('function drawScene(')
  assert.ok(at > 0, 'window-web no longer has drawScene')
  let depth = 0, end = at
  for (let i = win.indexOf('{', at); i < win.length; i++) {
    if (win[i] === '{') depth++
    else if (win[i] === '}') { depth--; if (!depth) { end = i; break } }
  }
  const draw = win.slice(at, end)
  const drawn = new Set()
  for (const [, t] of draw.matchAll(/n\.type === '([a-z-]+)'/g)) drawn.add(t)
  for (const [, t] of draw.matchAll(/famOf\(n\.type\) === '([a-z-]+)'/g)) drawn.add(t)
  for (const [, t] of draw.matchAll(/KIND_FOR\[[^\]]+\] === '([a-z-]+)'/g)) drawn.add(t)

  const types = new Set(Object.values(world.nodes ?? {}).map((n) => n.type))
  const missing = [...types].filter((t) => !drawn.has(t) && !drawn.has(fam[t] ?? t)).sort()
  assert.deepEqual(missing, [],
    'the world stands these up and drawScene has no branch for them, so a '
    + 'citizen walks to bare ground and is told something is there:\n  '
    + missing.map((t) => t + ' ('
        + Object.values(world.nodes).filter((n) => n.type === t).length + ' on the island)')
      .join('\n  '))
})

// §7ef: AND THE HEALTH BARS ON THE SAME TERMS.
//
// A sheep at full health standing in a field is not in a fight and has
// nothing to report. The bar is drawn in fourteen places, one per creature,
// so the decision is made once (`_showHp`) and every one of them reads it --
// and this holds that, because the next creature somebody draws will copy a
// neighbour and the neighbour has to be right.
test('no creature draws a health bar outside the one gate', () => {
  const at = win.indexOf('const _showHp = _hov || engaged || _hurt')
  assert.ok(at > 0, 'the creature health bars no longer share one decision')
  // every bar: a fillRect scaled by m.hp. Each must sit inside an if (_showHp)
  const lines = win.split('\n')
  const bad = []
  for (let i = 0; i < lines.length; i++) {
    if (!/m\.hp \/|m\.hp \//.test(lines[i])) continue
    if (!/fillRect\(/.test(lines[i])) continue
    // walk back a few lines for the gate
    let ok = false
    for (let k = i; k >= 0 && k > i - 5; k--) if (lines[k].includes('if (_showHp) {')) { ok = true; break }
    if (!ok) bad.push((i + 1) + ': ' + lines[i].trim().slice(0, 80))
  }
  assert.deepEqual(bad, [],
    'these health bars are drawn whatever is happening:\n  ' + bad.join('\n  '))
})

// §7ei: THE RIGHT BUTTON BELONGS TO THE WORLD, NOT TO CHROME.
//
// The world had exactly one pointer listener, `click`, which is the left
// button. Nothing called `preventDefault` on a `contextmenu` over the canvas,
// so right-clicking anything in the world raised the browser's own menu --
// Back, Reload, Save As, Inspect -- over the game, and the window's own menu
// was unreachable with the button the whole interaction model is built on.
// The only place the right button worked was the pack, which suppresses it
// on `#inv`.
//
// This holds the three parts: the handler is reachable by name, the right
// button is wired to it, and the browser's menu is refused.
test('right-clicking the world opens the world’s menu, not the browser’s', () => {
  assert.match(win, /function worldPress\(/,
    'the press handler must be a named function, or only one button can reach it')
  assert.match(win, /cv\.addEventListener\('click', \(e\) => \{[\s\S]{0,1400}?worldPress\(e\)/,
    'the left button must still reach the handler')
  // §7ei: and a phone, which has no right button, reaches the same door
  assert.match(win, /const LONG_PRESS_MS = \d+/,
    'no long press, so there is no way to open a menu on a phone')
  assert.match(win, /if \(_lpFired\) \{ _lpFired = false; return \}/,
    'the click that ends a long press must not also do the thing')
  const at = win.indexOf("cv.addEventListener('contextmenu'")
  assert.ok(at > 0, 'the canvas has no contextmenu listener, so the browser keeps the right button')
  const seg = win.slice(at, at + 900)
  assert.match(seg, /e\.preventDefault\(\)/,
    'the browser menu is not refused, so it opens over the game')
  assert.match(seg, /worldPress\(e\)/,
    'the right button is swallowed but never reaches the world')
  // and it opens UNDER THE POINTER: `_menuAt` is what `chooseAction` reads
  assert.match(seg, /_menuAt = \{ x: e\.clientX, y: e\.clientY \}/,
    'a menu opened by the right button must appear where the pointer is')
})

// §7ei: AND EVERY THING THE RIGHT BUTTON LANDS ON OFFERS SOMETHING.
//
// Thirty-one kinds of thing answer a press. Thirteen build a list through
// `chooseAction`; the other eighteen have exactly one action, so they did it
// and the right button had nothing to say over any of them. They offer that
// one action now, and `chooseAction` adds `walk here` to it -- the option the
// left button can never give you, because the left button's job is to do the
// thing.
//
// This fails when somebody adds a nineteenth single-action type and forgets
// the word for it, which is the only way this can rot.
test('every thing the press handler answers can be right-clicked for a menu', () => {
  const at = win.indexOf('function worldPress(')
  let d = 0, end = at
  for (let i = win.indexOf('{', at); i < win.length; i++) {
    if (win[i] === '{') d++
    else if (win[i] === '}') { d--; if (!d) { end = i; break } }
  }
  const body = win.slice(at, end)
  const verbs = new Set()
  {
    const m = win.match(/const ONE_ACTION = \{[\s\S]*?\n\}/)
    assert.ok(m, 'ONE_ACTION is gone, so the single-action things offer nothing')
    for (const [, k] of m[0].matchAll(/(?:^|[\s{,])'?([a-z-]+)'?:\s*'/g)) verbs.add(k)
  }
  // every type the handler branches on, and whether that branch builds a list
  const lines = body.split('\n')
  const missing = []
  for (let i = 0; i < lines.length; i++) {
    const m = /if \(n\.type === '([a-z-]+)'(?: \|\| n\.type === '([a-z-]+)')?\)? ?\{/.exec(lines[i])
    if (!m) continue
    for (const t of [m[1], m[2]].filter(Boolean)) {
      if (verbs.has(t)) continue
      // does its branch build a list of its own? COUNT BRACES, because a
      // one-line branch closes on its own line and a search for a lone `}`
      // runs past it to the end of the handler, picking up somebody else's
      // chooseAction and reporting the type as answered.
      const from = lines.slice(i).join('\n')
      let d2 = 0, stop = from.length
      for (let k = from.indexOf('{'); k < from.length; k++) {
        if (from[k] === '{') d2++
        else if (from[k] === '}') { d2--; if (!d2) { stop = k; break } }
      }
      if (!from.slice(0, stop).includes('chooseAction(')) missing.push(t)
    }
  }
  assert.deepEqual([...new Set(missing)], [],
    'the right button lands on these and the window offers nothing: they neither '
    + 'build a list nor have a word in ONE_ACTION:\n  ' + [...new Set(missing)].join('\n  '))
})

// §7ej: NOTHING IN THE WORLD REACTED TO BEING HIT.
//
// A struck citizen recoils -- `drawCitizen` throws the body back along its
// facing over 320ms and has done for a long time. Nothing else did, because
// the comparison that notices a blow was only ever made over `s.players`.
// You could hit a wolf and the wolf did not move; the health bar was the one
// thing that said the blow landed, and until this week that bar was always
// on, so a fight read as two figures standing in a field while an arithmetic
// went on somewhere else.
//
// The same two lines over `s.mobs`, and the recoil applied ONCE around the
// creature chain rather than in twenty-two drawings, because anything written
// per-creature is forgotten on the twenty-third.
test('a creature shows it when it is struck', () => {
  assert.match(win, /const mobHit = \{\}/, 'nothing records when a creature was hit')
  assert.match(win, /if \(o && s\.mobs\[mid\]\.hp < o\.hp\) mobHit\[mid\] = performance\.now\(\)/,
    'the hp drop that marks a blow is not watched for creatures')
  // and the draw reads it, with the citizen's own 320ms
  assert.match(win, /const _mhurt = Math\.max\(0, 1 - \(now - \(mobHit\[id\] \?\? -9999\)\) \/ 320\)/,
    'the creature draw no longer reads the blow')
  assert.match(win, /cx\.translate\(-MF \* _mhurt \* 7/,
    'a struck creature must be thrown back, the way a struck citizen is')
  // AND THE OTHER HALF: one that flinches but never strikes is being beaten
  // rather than fought, with all the motion on the citizen's side.
  assert.match(win, /const mobStruck = \{\}/, 'nothing records a blow a creature LANDS')
  assert.match(win, /if \(s\.mobs\[mid\]\.mad === pid\) mobStruck\[mid\] = performance\.now\(\)/,
    'a lunge must belong to the beast that is coming for THAT citizen, not to '
    + 'every beast standing near somebody who took a wound')
  assert.match(win, /MF \* _lunge/, 'the lunge goes toward what it is fighting')
})

// §7ej: AND EVERY CREATURE MOVES BETWEEN TICKS, which is this window's job.
//
// Four of them animated off `world.tick` -- a crow flapping once a second is
// not flight, it is a shrug; a hanged body twitching once a second is not a
// sway. Three more had no motion written at all: a boar, a goat and an adder
// standing perfectly still in the open country.
//
// The DUMMY is the one exception and is named here. It is a pell on a post:
// standing still is what it does, and it flinches when struck like everything
// else now.
test('every creature moves between ticks', () => {
  const at = win.indexOf('const hop = engaged ?')
  assert.ok(at > 0, 'the creature chain no longer starts where this expects')
  const lines = win.slice(at).split('\n')
  const still = []
  for (let i = 0; i < lines.length && i < 1700; i++) {
    const m = /if \(m\.type === '([a-z-]+)'\) \{/.exec(lines[i])
    if (!m) continue
    const ind = lines[i].search(/\S/)
    let j = i + 1
    while (j < lines.length && !(lines[j].trim() === '}' && lines[j].search(/\S/) === ind)) j++
    const body = lines.slice(i, j).join('\n')
    // `now` is the frame clock; `hop` is the shared bob built from it
    if (!/now \/|\bhop\b/.test(body)) still.push(m[1])
    i = j
  }
  assert.deepEqual(still, ['dummy'],
    'these creatures stand perfectly still, for ever:\n  ' + still.join('\n  '))
})

// §35: THE GOLD CHAIN IS THE OLD CHAIN, DIPPED.
//
// It was drawn as a necklace: a draped S-curve with round beads on it. It is
// a WEAPON -- `slotOf` says weapon, it wants prowess 90 like its parent, and
// its combat line is identical to the old chain's to the number. The recipe
// is the whole argument in one line of the engine: ten gold bars and the
// chain you already own. Nothing about it is made new.
//
// The same fault was found and fixed in the Unreal window a while ago, where
// the note calls it "a reading of the word rather than of the world". The
// flat window kept it, which is what happens when two windows draw the same
// object from two files.
//
// This holds the GEOMETRY rather than the colour: the two must be built from
// the same link positions, so they cannot drift back into being different
// objects. A cosmetic flex has to be visibly the thing it flatters.
test('the gold chain is drawn as the old chain, not as jewellery', () => {
  const at = win.indexOf("case 'gold-chain':")
  assert.ok(at > 0, 'the gold chain has no sprite')
  const gold = win.slice(at, win.indexOf('break }', at))
  const ot = win.indexOf("case 'old-chain':")
  const old = win.slice(ot, win.indexOf('break }', ot))
  // ONE link run, walked by both. Not "the same numbers written twice":
  // the same array, so the sag can be retuned and the two cannot part.
  assert.match(win, /const CHAIN_LINKS = \(\(\) => \{/,
    'the chains no longer share one set of links')
  for (const [name, body] of [['old', old], ['gold', gold]])
    assert.match(body, /for \(const L of CHAIN_LINKS\)/,
      `the ${name} chain does not walk the shared links, so the two are free `
      + 'to become different objects again')
  // and it is not a draped cord with beads on it
  assert.ok(!/quadraticCurveTo/.test(gold),
    'the gold chain is drawn as a draped curve, which is a necklace')
  // §35: A CHAIN HANGS. Every link turned by the tangent where it sits,
  // rather than all of them at one fixed angle, which is a chain drawn as a
  // line. Spaced by ARC LENGTH, or a sagging run bunches them at one end.
  assert.match(win, /a: Math\.atan2\(a1\.y - a0\.y, a1\.x - a0\.x\)/,
    'the links no longer lie along the curve they sit on')
  assert.match(win, /const want = \(i \/ \(N - 1\)\) \* total/,
    'the links are not spaced by arc length, so a sag bunches them')
})
