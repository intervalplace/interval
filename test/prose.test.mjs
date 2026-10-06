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
      if (l.includes(DASH) || l.includes(ESCAPED)) {
        bad.push(`${path.relative(root, p)}:${i + 1}: ${l.trim().slice(0, 80)}`)
      }
    })
  }
  assert.deepEqual(bad.slice(0, 20), [],
    `${bad.length} of them; a break in a sentence takes a colon, a comma or a full stop`)
})
