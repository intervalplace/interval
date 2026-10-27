// The site is prose about a world that keeps changing under it. Nothing here
// checks writing quality; it checks the FACTS, which is the part that goes
// silently wrong -- five pages said 600ms for a year after the interval became
// a second, and every one of them read fine.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import E from '../engine.js'

// Suites live beside engine.js in the repo. In this archive they are in
// test/, so root walks up one. Delete this line when you drop them in.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const eng = fs.readFileSync(path.join(root, 'engine.js'), 'utf8')
const num = (n) => +eng.match(new RegExp(`\\b${n}\\s*=\\s*(\\d+)`))[1]
const PAGES = ['index.html', 'manual.html']
// WHERE THE RULES WENT. `site/manual.html` used to be the reference: a long
// page you could search for what a pack holds or what a stall costs. It is now
// a page ABOUT the printed handbook, and the rules themselves live in
// `handbook.mjs`, which generates the book from the engine's own constants.
//
// Six checks below were still reading manual.html and had been failing since
// that change, which is the exact failure this suite exists to catch, pointed
// at the wrong file. They read the handbook source now. The regions are a
// third case: they are STATE, not rules, so the book deliberately leaves them
// out and `site/map.html` is where the island is named.
const handbook = () => fs.readFileSync(path.join(root, 'handbook.mjs'), 'utf8').replace(/\s+/g, ' ')
const read = (f) => fs.readFileSync(path.join(root, 'site', f), 'utf8')
// Prose wraps. Every check below matches against a whitespace-flattened copy,
// or a rule broken across two lines reads as a rule that is not there.
const flat = (f) => read(f).replace(/\s+/g, ' ')
const all = () => PAGES.map((f) => [f, read(f)])

test('no page states a repealed interval length', () => {
  const ms = num('TICK_MS')
  for (const [f, t] of all()) {
    assert.equal(/600\s*(ms|milliseconds)/.test(t), false, `${f} still says 600ms (it is ${ms})`)
  }
})

test('no page states a repealed mastery or skill count', () => {
  for (const [f, t] of all()) {
    // A page may NAME a repealed rule to explain what replaced it -- the manual
    // says nine trades replaced eighteen skills, and should. What it may not do
    // is assert one: "all sixteen skills" is a claim, "replaced eighteen
    // skills" is history.
    const s = t.replace(/\s+/g, ' ').toLowerCase()
    for (const bad of ['sixteen skills', 'all sixteen', 'your 99', 'ninety-nine is mastery']) {
      assert.equal(s.includes(bad), false, `${f} says "${bad}"`)
    }
    const claimsEighteen = / (has|all|the) eighteen skills/.test(s)
    assert.equal(claimsEighteen, false, `${f} asserts eighteen skills as current`)
  }
})

test('the trade count in prose is the engine\'s', () => {
  const n = eng.match(/const SKILLS = \[([\s\S]*?)\];/)[1].match(/'[a-z]+'/g).length
  assert.equal(n, 9)
  for (const [f, t] of all()) {
    // A page need not enumerate the trades. But wherever one COUNTS them, the
    // count has to be the engine's -- the old manual said sixteen for a year.
    const s = t.replace(/\s+/g, ' ')
    const counted = [...s.matchAll(/(all |the )?([a-z-]+) trades/gi)].map((m) => m[2].toLowerCase())
    const NUMBERS = ['one','two','three','four','five','six','seven','eight','nine','ten',
      'eleven','twelve','sixteen','eighteen','twenty']
    const wrong = counted.filter((w) => NUMBERS.includes(w) && w !== 'nine')
    assert.deepEqual(wrong, [], `${f} counts the trades as: ${wrong}`)
  }
})

test('the pack size in prose is the engine\'s', () => {
  assert.equal(num('INV_SLOTS'), 12)
  // THE CONSTANT, NOT THE SENTENCE. The book prints the figure the engine
  // holds rather than a word, so it cannot go stale -- that is the rule, and
  // it is all this is entitled to check. It used to pin the whole clause,
  // `Your pack holds <b>${NUM('INV_SLOTS')}</b> items`, which locks the
  // WORDING: moving the statement onto the Keeping page, beside the vault it
  // is about, broke the test while the book went on reading the number out of
  // the engine exactly as before.
  const book = handbook()
  assert.match(book, /pack holds[^`]{0,40}\$\{NUM\('INV_SLOTS'\)\}/)
  // and it is never typed out, as a numeral or as a word
  assert.equal(/pack holds\s+(?:a\s+)?(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|sixteen|twenty)\b/i.test(book), false)
  assert.equal(/twenty-eight slots/.test(book), false)
})

test('the stall cost in prose is the engine\'s', () => {
  const p = num('MARKET_PLANKS'), o = num('MARKET_ORE')
  assert.equal(p, 10); assert.equal(o, 2)
  assert.match(handbook(), /MARKET_PLANKS/)
  assert.match(handbook(), /MARKET_ORE/)
})

test('the frame in prose is the engine\'s', () => {
  assert.equal(num('HEALTH_FLAT'), 64)
  assert.match(handbook(), /sixty-four/)
})

test('food is described as a rate, not a burst', () => {
  // The manual taught "eat it: it heals" for as long as that was true and for a
  // while after. A reader who learns the old rule loses fights over it.
  assert.match(handbook(), /Food is a <b>rate<\/b>/)
  // The quickstart said it too and the quickstart is gone: it was the makers
  // walking a reader through their first hour, which is the one thing this
  // project says it will not do. The book is where a rule belongs anyway.
})

test('vaults are described as local', () => {
  // The homepage is an argument for the world, not an account of its rules,
  // and the restructure took the vault line off it. The rule lives in the book,
  // which is now the only place on the site that states rules at all.
  assert.match(handbook(), /a vault belongs to the/)
})

test('no page sells the world by comparison', () => {
  // The brief: it read as a clone of something else. It should read as itself.
  for (const [f, t] of all()) {
    for (const bad of ['Jagex', 'RuneScape', 'early-2000s', 'browser games']) {
      assert.equal(t.includes(bad), false, `${f} mentions ${bad}`)
    }
  }
})

test('the door is on the homepage, and it comes after the argument', () => {
  const i = read('index.html')
  assert.match(i, /class="playbtn"/)

  // THIS USED TO ASSERT THE OPPOSITE: that the button came BEFORE the prose,
  // on the reasoning that a door should be unmissable. It was tried and it did
  // not work, and the reason is worth keeping. A call to action at the very top
  // asks a reader to decide before they have been told what the thing is, so it
  // reads as a demand rather than an invitation; and the old one then argued
  // with itself three times underneath, about which window, and about neither
  // window being official. A confident button followed by three qualifications
  // reads less confident than no button at all.
  //
  // So the door is at the bottom now, after the comparison and after the list
  // of what this world is NOT. By then a reader has a reason to walk through
  // it. The page still opens with the world's own tick, which proves it is
  // running without asking anybody to click anything.
  assert.ok(i.indexOf('Every other world') < i.indexOf('playbtn'),
    'the argument comes first, then the door')

  // AND THE FIRST THING OFFERED IS THE ONE WITH NO COST. The download was on
  // top, which put the macOS-only, several-hundred-megabyte option in front of
  // somebody who had not been told what they would be downloading, and framed
  // the browser as the impatient choice: "In a hurry?".
  const btn = i.slice(i.indexOf('class="playbtn"'), i.indexOf('class="playbtn"') + 200)
  // A WINDOW, NOT THE LIST OF WINDOWS. This used to pin `/play` exactly, which
  // is the chooser -- so the button opened a page of six names while the line
  // under it promised the reader would be standing in Anchor in ten seconds.
  // `/play/<name>` is a window; `/play` is a decision to make first.
  assert.match(btn, /href="\/play\/[a-z]+"/,
    'the button must open a window, not the page that lists them')

  // LAST, because it is a separate open question and it was masking the two
  // checks above: assertions run in order, so a failure here meant the
  // ordering was never tested at all. The chart was dropped from the homepage
  // by the restructure and whether it comes back is a decision, not a bug.
  // THE CHART IS NOT ON THE HOMEPAGE ANY MORE, and that was a decision: the
  // restructure took it off, and the chart itself was later stripped to land
  // alone. What the fact actually requires is that the island stays PUBLIC and
  // one click away, not that a particular picture sits above the fold.
  assert.match(fs.readFileSync(path.join(root, 'site', 'nav.js'), 'utf8'), /\/map/,
    'the island is one click from every page')
})

test('every page is valid, self-closing markup with a nav', () => {
  for (const [f, t] of all()) {
    assert.match(t, /<script src="\/site\/nav\.js"><\/script>/, `${f} has the shared nav`)
    assert.match(t, /<\/main><\/div>/, `${f} closes its shell`)
    const open = (t.match(/<div/g) || []).length, close = (t.match(/<\/div>/g) || []).length
    assert.equal(open, close, `${f} has ${open} <div> and ${close} </div>`)
  }
})

// The README states the release tuple, the rules hash, and a dozen facts about
// the world. `run-tests.mjs` already checks the banner against package.json;
// these check the rest of it against the engine, because "seven towns and five
// countries" survived several releases of being wrong about both.
const readme = () => fs.readFileSync(path.join(root, 'README.md'), 'utf8').replace(/\s+/g, ' ')

test('the README counts the trades as the engine does', () => {
  const n = eng.match(/const SKILLS = \[([\s\S]*?)\];/)[1].match(/'[a-z]+'/g).length
  assert.equal(n, 9)
  assert.match(readme(), /nine trades/i)
  assert.equal(/sixteen skills|eighteen skills/.test(readme()), false)
})

test('the README names the same island the site does', () => {
  const r = readme()
  // the map, not the handbook: where anything IS is state, and the book
  // prints only rules
  const site = fs.readFileSync(path.join(root, 'site', 'map.html'), 'utf8').replace(/\s+/g, ' ')
  for (const c of ['Greenwood', 'Heartlands', 'Downs', 'Moor', 'Crags', 'Fens', 'Wilds']) {
    assert.ok(r.includes(c) && site.includes(c), `${c} must appear in both`)
  }
  assert.match(r, /ten towns and seven countries/i)
  assert.equal(/seven towns and five countries/i.test(r), false)
})

test('the README describes the constitution as three documents', () => {
  const r = readme()
  for (const f of ['SPEC.md', 'LIFTED.md', 'HISTORY.md']) assert.ok(r.includes(f), f)
  // and the hash module is the single definition, so the README must point at it
  assert.match(r, /rules-hash\.mjs/)
})

test('the README states the current interval length', () => {
  assert.equal(num('TICK_MS'), 1000)
  assert.match(readme(), /one \*\*interval\*\* a second|one interval a second/)
  assert.equal(/600\s*(ms|milliseconds)/.test(readme()), false)
})

test('the README states the frame and the pack as the engine does', () => {
  assert.match(readme(), /sixty-four/)
  assert.match(readme(), /twelve empty slots/)
})

test('the lineage section names names', () => {
  // The point of rewriting it. A project whose claim is that rules should be
  // legible should be legible about where its rules came from, and "the spirit
  // of an era" names influences without naming them.
  const r = readme()
  assert.equal(/spirit of/.test(r), false, 'no era-gesturing')
  for (const g of ['Ultima Online', 'RuneScape', 'MUD']) {
    assert.ok(r.includes(g), `lineage should name ${g}`)
  }
  assert.match(r, /not affiliated with any of their makers/)
})

// ---- AND HOW LONG THE BOOK IS, WHICH THE SITE SELLS ----
//
// `shop.html` said the handbook was twenty pages. It is forty-four. The number
// was right when it was written and the book kept growing, which is the exact
// failure this file exists to catch: a page of prose quietly describing a thing
// that has moved on without it. `manual.html` had the right figure the whole
// time, so the site was also contradicting itself, on two pages one click
// apart, about an object somebody is being asked to pay for.
//
// Read from the generator rather than from a constant. The book's length is not
// a number anybody chooses: it falls out of how much the world has in it once
// the pages are filled, so the only honest source is building it.
test('every page that states the handbook\'s length states the real one', () => {
  const out = execFileSync(process.execPath,
    [fileURLToPath(new URL('../handbook.mjs', import.meta.url))],
    { encoding: 'utf8', cwd: fileURLToPath(new URL('../', import.meta.url)) })
  const built = Number(out.match(/(\d+) pages/)?.[1])
  assert.ok(built > 0, 'the handbook generator did not report a page count: ' + out.slice(0, 200))

  const WORDS = { twenty: 20, 'twenty-four': 24, thirty: 30, 'thirty-two': 32,
    forty: 40, 'forty-four': 44, 'forty-eight': 48, fifty: 50, sixty: 60,
    'sixty-four': 64, eighty: 80 }
  for (const [f, t] of all()) {
    const s = t.replace(/\s+/g, ' ')
    for (const m of s.matchAll(/([A-Za-z-]+|\d+)\s+pages\b/g)) {
      const said = /^\d+$/.test(m[1]) ? Number(m[1]) : WORDS[m[1].toLowerCase()]
      if (said === undefined) continue          // "the pages that follow", and the like
      // The blank ledger is a different object with its own length, and it is
      // the only other thing on the site counted in pages.
      if (/ledger/i.test(s.slice(Math.max(0, m.index - 220), m.index))) continue
      assert.equal(said, built,
        `${f} says the handbook is ${said} pages; the generator builds ${built}`)
    }
  }
})

// ---- AND THE BOOK IS HELD TO THE SAME TOTAL-COVERAGE BAR AS THE WINDOW ----
//
// The handbook's claim is that it says what the world is made of. That was
// never measured, and the gap it hid is the kind nobody reports: a hundred and
// five PRICED things were all in the book, and nine things the world has but
// does not price were not -- because a keeper sets the price, so anything no
// keeper will take fell straight through a list built from what things cost.
//
// They were not odds and ends. The torch is the clock the Smother runs on, the
// four barrow masks are the only object a citizen may take exactly once in a
// life, and forage is the one thing on the ground that cannot be picked up,
// which a reader would otherwise discover by clicking it and watching it go.
//
// READ FROM THE BUILT BOOK, not from `handbook.mjs`. Its tables are generated
// from the engine at build time, so the words are in the output and not in the
// source -- searching the source reported eighty-two missing items that were
// all present, which is a measurement that would have sent somebody a day in
// the wrong direction.
test('the printed handbook names everything the world has', () => {
  const book = read('handbook-print.html')
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  // The book writes names the way a person says them, which is the window's
  // rule too: `old-chain` is "old chain". So both spellings count.
  const names = (w) => book.includes(w) || book.includes(w.replace(/-/g, ' '))

  // FROM THE ENGINE'S OWN TABLES, not from its source text. Counting the mob
  // rows with a regex found fifteen of twenty-four, because nine of them do not
  // write `maxHealth` first and some carry a comment before it. A list the
  // world hands out cannot be miscounted that way, and this check is worthless
  // if its idea of the bestiary is nine short.
  const priced = Object.keys(E.PRICES ?? {})
  assert.ok(priced.length > 80,
    `the engine should price a hundred-odd things; found ${priced.length}`)

  // THE FOUR MASKS ARE DESCRIBED AND NOT LISTED, on purpose: "a hart, a wolf,
  // a raven and a hare, on a shelf in the barrow" is the sentence a book
  // writes, and "hart-mask, wolf-mask" is the sentence a table writes. The
  // creature's own word is what this looks for in that one case.
  const SAID_ANOTHER_WAY = {
    'hart-mask': 'hart', 'wolf-mask': 'wolf',
    'raven-mask': 'raven', 'hare-mask': 'hare',
  }
  // And the two that are furniture rather than creatures: a training dummy and
  // an archery butt do not fight back and the book says so without naming them.
  const FURNITURE = new Set(['dummy', 'butt'])

  const missing = priced.filter((i) => !names(i) && !names(SAID_ANOTHER_WAY[i] ?? i))
  assert.deepEqual(missing, [],
    'the world prices these and the book never names them: ' + missing.join(', '))

  const mobs = Object.keys(E.MOB_STATS ?? {})
  assert.ok(mobs.length > 15, `the engine should have a bestiary; found ${mobs.length}`)
  const unnamed = mobs.filter((m) => !FURNITURE.has(m) && !names(m))
  assert.deepEqual(unnamed, [],
    'the world has these beasts and the book never names them: ' + unnamed.join(', '))
})

// ---- THE RACE IS TO MASTERY, AND MASTERY IS ONE HUNDRED ----
//
// §4b says it and the engine exports it: MASTERY = 100. The race board took
// XP_TABLE[99], so a citizen standing at ninety-nine was shown as 100% of the
// way with nothing left to go, when they are 89% of the way with 376,436
// still to climb. The comment beside the line said "mastery: 13,034,431",
// which is not XP_TABLE[99] either: it was wrong about the number it was
// already using, which is how it went unnoticed.
test('the race board measures the climb against mastery, not against 99', () => {
  const src = fs.readFileSync(path.join(root, 'serve.mjs'), 'utf8')
  const i = src.indexOf("if (path === '/api/races')")
  assert.ok(i > 0, 'the race board is gone or renamed')
  // comments stripped: the note explaining this fault names the old
  // expression, and the first run of this test duly failed on it
  const body = src.slice(i, src.indexOf('\n    if (path ===', i + 10))
    .split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n')
  assert.ok(!/XP_TABLE\[99\]/.test(body),
    'the board measures the last climb against level 99 again')
  assert.ok(/XP_TABLE\[E\.MASTERY\]|XP_TABLE\[MASTERY\]/.test(body),
    'the target must be asked of the engine, which is the only thing that knows it')
  assert.equal(E.MASTERY, 100, 'if mastery moves, this board and this test move with it')
})

// ---- AND SOMEBODY CAN ARRIVE ALREADY HOLDING IT ----
//
// §9b-iv now carries the race itself: a citizen who won one brings
// `firstToMaster` with them and the founding seats it back onto the new
// world's roll, so the usual case is a settled race with a name on it.
//
// This is the OTHER case, and it does not go away. An import that carries no
// race, because it was written before §9b-iv or because its citizen never won
// one, still arrives at mastery without crossing it, and the roll still names
// nobody. The world is right about that: nobody did it there. The board was
// not, and showed the race unclaimed with that citizen at 100% and nothing to
// go, which reads as a race that broke.
test('a master carried in without their race leaves the first unclaimed', () => {
  const xpAt = (lv) => { let x = 0; while (E.levelForXp(x) < lv) x++; return x }
  const g = E.makeGenesis('carried', 'a'.repeat(64), 0, 40, 30)
  g.imported = [{ pid: 'a'.repeat(64), name: 'alder', calling: 'forester',
    health: 64, skills: { woodcraft: xpAt(E.MASTERY) } }]
  assert.equal(E.validateImports(g.imported), null, 'the premise: such a citizen may cross')
  let s = E.newWorld(g)
  if (E.seatImport) E.seatImport(s, g.imported[0], 5, 5)
  for (let i = 0; i < 4; i++) s = E.nextState(s, [])
  assert.equal((s.firsts ?? {})['master:woodcraft'], undefined,
    'if the engine starts claiming this, the board no longer needs to explain it')

  // so the board must SAY that, rather than show an empty race at 100%
  const src = fs.readFileSync(path.join(root, 'serve.mjs'), 'utf8')
  const i = src.indexOf("if (path === '/api/races')")
  const body = src.slice(i, src.indexOf('\n    if (path ===', i + 10))
  assert.ok(/carried: true/.test(body),
    'the board does not tell a race nobody ran from a race nobody has won')
  const page = fs.readFileSync(path.join(root, 'site/hiscores.html'), 'utf8')
  assert.ok(/x\.carried/.test(page), 'and the page does not show it')
})

// ---- EVERY PAGE THE ROUTER OFFERS LOADS ONLY FILES THAT EXIST ----
//
// `site/items.js` was a hand-copied subset of window-web's drawing code that
// two pages loaded and no page used. Removing a dead script is exactly the
// move that leaves a page asking for a file that is no longer there, which a
// browser answers with silence.
// Checked over the pages the ROUTER names, because those are the ones anybody
// can open; the `*-before-*.html` snapshots are kept deliberately and are
// nobody's door.
test('every page the router offers loads only assets that are on disk', () => {
  const src = fs.readFileSync(path.join(root, 'serve.mjs'), 'utf8')
  const block = src.slice(src.indexOf('const PAGES = {'), src.indexOf('const MIME'))
  const pages = [...block.matchAll(/'([a-z-]+\.html)'/g)].map((m) => m[1])
  assert.ok(pages.length >= 8, `found ${pages.length} routed pages`)
  const missing = []
  for (const f of new Set(pages)) {
    const p = path.join(root, 'site', f)
    if (!fs.existsSync(p)) { missing.push(`${f} is routed and not on disk`); continue }
    const html = fs.readFileSync(p, 'utf8')
    for (const m of html.matchAll(/(?:src|href)="(\/site\/[^"]+)"/g)) {
      const asset = path.join(root, m[1].replace(/^\/site\//, 'site/'))
      if (!fs.existsSync(asset)) missing.push(`${f} asks for ${m[1]}, which is not there`)
    }
  }
  assert.deepEqual(missing, [], missing.join('\n'))
})

// ---- §5u: ONE CRUSHING FLOOR, AND THE LAW SAYS SO ----
//
// The section said "There are six: four in the highlands and two in the
// mountains". The generator has always laid ONE and that sentence was never
// true. One is also the right number and the number the rest of §5u argues
// for: a second floor halves the queue, and the queue is the point.
test('the law and the island agree how many crushing floors there are', async () => {
  const spec = fs.readFileSync(path.join(root, 'SPEC.md'), 'utf8')
  // the sections are not in numeric order in the file; take from this
  // heading to whatever heading comes next
  const at = spec.indexOf('## 5u.')
  const next = spec.indexOf('\n## ', at + 4)
  const sec = spec.slice(at, next === -1 ? spec.length : next)
  assert.ok(sec.length > 200, '§5u is gone or renamed')
  assert.match(sec, /There is ONE, at\s+Cragfoot/, '§5u no longer says how many floors there are')
  assert.equal(/There are six/.test(sec.replace(/~~[\s\S]*?~~/g, '')),
    false, 'the repealed count is being stated again as law')
})

// ---- ONE DROWNED BELL ----
//
// There were two: a `bellwork` that twelve pulls and three hands can raise,
// and a piece of scenery at Merewick carrying the same name and the line "on
// some mornings, the mud still rings" -- which is the false promise §7du was
// written to end when it took the OTHER bell out of the landmarks and made it
// something a town can actually haul out of the water.
test('only one thing on the island is the drowned bell', async () => {
  const WG = await import('../worldgen-expanse7.mjs')
  const quiet = console.log
  console.log = () => {}
  const g = WG.makeExpanse7Genesis('one-bell', 'a'.repeat(64), 0, 896, 512)
  const w = WG.buildWorld(g)
  console.log = quiet
  const bells = Object.values(w.nodes).filter((n) =>
    n.kind === 'drowned-bell' || n.type === 'bellwork' || n.type === 'bell')
  assert.equal(bells.length, 1, 'the island has more than one drowned bell: '
    + bells.map((n) => (n.kind ?? n.type) + ' at ' + n.x + ',' + n.y).join(', '))
  assert.equal(bells[0].type, 'bellwork', 'the one that is left cannot be raised')
  // and Merewick keeps a centre, which promises nothing
  assert.ok(Object.values(w.nodes).some((n) => n.kind === 'upturned-boat'),
    'the drowned village lost its centre rather than its claim')
})
