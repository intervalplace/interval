// THE CHECKS THAT EXISTED AND NOBODY RAN.
//
// `spec-conformance.mjs` reported fifteen divergences between the constitution
// and the engine, accurately, for as long as anybody can tell. Nothing ran it:
// it is not in `package.json`, not in `run-tests.mjs`, and no suite imported
// it. A checker that is never executed is a document, and this project already
// has enough of those. Two of its own checks were also vacuous, reading a
// heading SPEC.md has never had, and reported `ok` after reading one character.
//
// So it runs here, with the suite, and a divergence fails CI like anything
// else. The checker prints what is wrong and why, so this asserts the exit
// code and hands the output over rather than restating it.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

test('the constitution and the engine agree (spec-conformance.mjs)', () => {
  const r = spawnSync(process.execPath, [path.join(root, 'spec-conformance.mjs')],
    { cwd: root, encoding: 'utf8' })
  assert.equal(r.status, 0, '\n' + r.stdout + r.stderr)
})

// AND THE SKILL INVARIANTS, FOR THE SAME REASON.
//
// `skill-check.mjs` is the third checker found this way: written, correct, in
// no npm script and imported by nothing. It was reporting three faults to an
// empty room, and one of them was that `prayerKeeps` read `p.skills.prayer`,
// so the mourner's grace had never once been paid to anybody. A checker nobody
// runs is a document.
test('the skill invariants hold (skill-check.mjs)', () => {
  const r = spawnSync(process.execPath, [path.join(root, 'skill-check.mjs')],
    { cwd: root, encoding: 'utf8' })
  assert.equal(r.status, 0, '\n' + r.stdout + r.stderr)
})

// NO LONG DASH, ANYWHERE THIS PROJECT WRITES.
//
// It is a house rule and it is absolute: interface strings, the handbook, the
// site, the constitution, commit messages and the comments in the engine. The
// character reads as a tell, so a sentence that wants a break takes a colon, a
// semicolon, a comma, brackets, or becomes two sentences.
//
// Checked rather than remembered, because it came back twice: once through a
// generator that wrote `DERIVED, NOT YET RATIFIED` with one into a hundred and
// forty-five drafted sections at a stroke, and once through four spell names
// the engine handed to every window as a JavaScript escape, which no search
// for the character itself will ever find. A rule about prose enforced only by
// reading prose does not survive a tool that writes prose.
//
// THE CHECK MUST NOT CONTAIN WHAT IT LOOKS FOR. Both forms are built from
// their code points below rather than typed, so this file does not fail
// itself, which the first cut of it did.
const DASH = String.fromCharCode(0x2014)
const ESCAPED = String.fromCharCode(92) + 'u2014'
// AND THE HTML ENTITY, which is a third way to write the same thing and was
// not checked. It got four of them into window-photo and one into
// window-grim3d, past the one test whose whole job is this rule, and they were
// found by looking: which is not how a rule stays kept. Built from char codes
// like the two above, so this file does not fail itself.
const ENTITY = '&' + 'mdash' + String.fromCharCode(59)

// `downloads/` holds a packaged client: a build artifact carrying a copy of
// the engine and the bridge from whenever it was last cut. It is rebuilt from
// these sources, so holding it to this rule means failing CI over the contents
// of an old zip.
const SKIP = /node_modules|\.git[/\\]|downloads[/\\]|\.before-|\.bak$|freeze-evidence-stale|bench[/\\]|\.(png|jpg|jpeg|pdf|zip|ipa|log|woff2?|ttf|mp3|wav|ogg)$/
const EXT = new Set(['.md', '.mjs', '.js', '.cjs', '.html', '.css', '.json', '.sh', '.py', '.svg'])

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (SKIP.test(p)) continue
    if (e.isDirectory()) walk(p, out)
    else if (EXT.has(path.extname(e.name))) out.push(p)
  }
  return out
}

test('nothing this project writes contains a long dash', () => {
  const bad = []
  for (const p of walk(root)) {
    let t
    try { t = fs.readFileSync(p, 'utf8') } catch { continue }
    t.split('\n').forEach((l, i) => {
      if (l.includes(DASH) || l.includes(ESCAPED) || l.includes(ENTITY)) {
        bad.push(`${path.relative(root, p)}:${i + 1}: ${l.trim().slice(0, 80)}`)
      }
    })
  }
  assert.deepEqual(bad.slice(0, 20), [],
    `${bad.length} of them; a break in a sentence takes a colon, a comma or a full stop`)
})

// §7em: AND THE PRINTED BOOK KEEPS THE SAME LINE AS THE WINDOW.
//
// "Let's strip the handbook too." The window had been cleared of yields,
// durations, distances and tallies, and the manual was still printing them:
// the barrow spells gave their damage and how many intervals the rot and the
// withering last, a far shot ended "at the end of its nine tiles", and the
// gibbet dead were "fought at four tiles or not at all".
//
// The handbook's job is what a player CANNOT discover by playing, and that
// job is untouched by this. The clock is still one interval a second, food is
// still a rate rather than a burst, a smoked eel still ends the rot, and
// nothing still mends a withering. What went is what a single cast or a
// single shot teaches you anyway.
//
// A duration that is a rule of the world's own clock is not a yield. Those
// are listed here with a reason each, the way check-window-reach names a deed
// that is not a button.
test('the handbook states rules, not yields (§7em)', () => {
  const src = fs.readFileSync(path.join(root, 'handbook.mjs'), 'utf8')
  const NUM = '(?:\\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven'
    + '|twelve|sixteen|twenty|twenty-four|thirty|forty|fifty)'
  const TELL = new RegExp('(?:' + NUM + '[- ](?:second|minute|interval|tick|tile|pace|step)s?\\b'
    + '|\\bgives back\\b|\\bper cent\\b|\\breach(?:es)? ' + NUM + '\\b'
    + '|\\bheals? ' + NUM + '\\b|\\b' + NUM + ' back\\b)', 'i')
  const ALLOWED = [
    ['One interval a second since the founding',
      'the running foot: the clock itself, which is the first rule of the world'],
    ['The world advances one interval every second',
      'the same rule, stated: nobody discovers the tick rate by watching'],
    ['A spell is cast in one interval and is over',
      'what a cast IS, not what one gives'],
    ['Two turns are twenty minutes',
      'the moon slips against the day, which takes weeks and a notebook to derive'],
    ['longer than a day, so it slips twenty minutes later each day',
      'the same sentence, wrapped'],
    ['your key, every ten minutes',
      'how often the file beside your key is written: a fact about the software, '
      + 'in the chapter that says nothing in it can be worked out by playing'],
  ]
  const told = []
  for (const line of src.split('\n')) {
    const t = line.trim()
    if (t.startsWith('//')) continue
    if (!TELL.test(line)) continue
    if (ALLOWED.some(([a]) => line.includes(a))) continue
    told.push(t.slice(0, 120))
  }
  assert.deepEqual(told, [],
    'the handbook spells out a yield, a duration or a distance:\n  ' + told.join('\n  '))
})
