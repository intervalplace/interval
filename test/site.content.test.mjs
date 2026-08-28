// The site is prose about a world that keeps changing under it. Nothing here
// checks writing quality; it checks the FACTS, which is the part that goes
// silently wrong -- five pages said 600ms for a year after the interval became
// a second, and every one of them read fine.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Suites live beside engine.js in the repo. In this archive they are in
// test/, so root walks up one. Delete this line when you drop them in.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const eng = fs.readFileSync(path.join(root, 'engine.js'), 'utf8')
const num = (n) => +eng.match(new RegExp(`\\b${n}\\s*=\\s*(\\d+)`))[1]
const PAGES = ['index.html', 'quickstart.html', 'manual.html']
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
  assert.match(flat('manual.html'), /twelve slots/)
  assert.equal(/twenty-eight slots/.test(flat('manual.html')), false)
})

test('the stall cost in prose is the engine\'s', () => {
  const p = num('MARKET_PLANKS'), o = num('MARKET_ORE')
  assert.equal(p, 10); assert.equal(o, 2)
  assert.match(flat('manual.html'), /ten planks and two iron-ore/)
})

test('the frame in prose is the engine\'s', () => {
  assert.equal(num('HP_FLAT'), 64)
  assert.match(flat('manual.html'), /sixty-four/)
})

test('food is described as a rate, not a burst', () => {
  // The manual taught "eat it: it heals" for as long as that was true and for a
  // while after. A reader who learns the old rule loses fights over it.
  assert.match(flat('manual.html'), /Food is a <b>rate<\/b>/)
  assert.match(flat('quickstart.html'), /mends over several intervals/)
})

test('vaults are described as local', () => {
  for (const f of ['index.html', 'quickstart.html', 'manual.html']) {
    assert.match(flat(f), /own vault|stay where you left them|Crags is in the Crags/,
      `${f} must not imply one vault everywhere`)
  }
})

test('no page sells the world by comparison', () => {
  // The brief: it read as a clone of something else. It should read as itself.
  for (const [f, t] of all()) {
    for (const bad of ['Jagex', 'RuneScape', 'early-2000s', 'browser games']) {
      assert.equal(t.includes(bad), false, `${f} mentions ${bad}`)
    }
  }
})

test('the door is on the homepage and unmissable', () => {
  const i = read('index.html')
  assert.match(i, /class="playbtn"/)
  assert.match(i, /tallyholm\.png/, 'and the map stays')
  // The button must come before the long prose, not after two screens of it.
  assert.ok(i.indexOf('playbtn') < i.indexOf('The island'))
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
  const site = fs.readFileSync(path.join(root, 'site', 'manual.html'), 'utf8').replace(/\s+/g, ' ')
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
