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
