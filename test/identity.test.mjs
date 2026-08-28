// Standing and calling (spec 10) must be the same number and the same word in
// every window. They were not, once: the 2D window averaged three combat
// skills, the 3D window averaged five and subtracted two, and the 3D window
// computed skill levels from a different XP curve entirely. This test extracts
// both windows' implementations and compares them against the engine.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import E from '../engine.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const read = (f) => fs.readFileSync(path.join(here, '..', f), 'utf8')

// a spread of citizens: fresh, lopsided, mastered, and past mastery
function citizens() {
  const mk = (over = {}) => {
    const skills = {}
    for (const sk of E.SKILLS) skills[sk] = 0
    // §5j: hitpoints is not a skill and no skill starts above zero
    return { skills: { ...skills, ...over } }
  }
  // §5j: the nine. This named attack, defence, mining, prayer, exploration and
  // brewing -- six skills the collapse removed -- so most of these citizens
  // were identical blanks and the comparison proved nothing.
  return [
    mk(),
    mk({ hearthcraft: E.XP_TABLE[42], woodcraft: E.XP_TABLE[30] }),
    mk({ wayfaring: E.XP_TABLE[60], sorcery: E.XP_TABLE[59] }),
    mk({ prowess: E.XP_TABLE[70], marksmanship: E.XP_TABLE[70] }),
    mk(Object.fromEntries(E.SKILLS.map(s => [s, E.XP_TABLE[100]]))),
    mk({ earthcraft: E.XP_TABLE[99] * 40 }),       // far past mastery: no ceiling
    mk({ mourning: E.XP_TABLE[25] }),
  ]
}

function windowImpl(file, lvlName) {
  const html = read(file)
  const start = html.indexOf('// ---- who a citizen is (spec 10)')
  assert.ok(start > 0, `${file} is missing the identity block`)
  // the block ends at the calling's last return; the old anchor
  // ('return best === null') no longer appears in the window at all, so the
  // slice came back empty and every assertion died on 'not defined'.
  const end = html.indexOf('\n', html.indexOf('+ CALLINGS[best]', start))
  const block = html.slice(start, html.indexOf('}', end) + 1)
  // The window's own XP curve comes along, so a wrong curve fails here too.
  // This looked for `const XP_TABLE = (() =>` -- a generated form the window
  // does not use; it carries a literal array. indexOf returned -1, the slice
  // began at the end of the file, and the curve never came with the block.
  // start at MASTERY, which the curve and the calling both read: slicing from
  // XP_TABLE alone left it out and the block would not evaluate.
  const tStart = Math.min(...['const MASTERY =', 'const XP_TABLE =']
    .map(k => html.indexOf(k)).filter(i => i > 0))
  assert.ok(tStart > 0, `${file} is missing its XP curve`)
  const tableSrc = html.slice(tStart, html.indexOf('// ---- who a citizen is (spec 10)'))
  return (0, eval)(tableSrc + '\n' + block + `\n;({standingOf, callingOf, lvl: ${lvlName}})`)
}

test('the 2D window agrees with the engine about standing and calling', () => {
  const M = windowImpl('window-web.html', 'XP_TO_LVL')
  for (const p of citizens()) {
    assert.equal(M.standingOf(p), E.standingOf(p), 'standing disagrees')
    assert.equal(M.callingOf(p), E.callingOf(p), 'calling disagrees')
  }
})

// window-3d is not in service; window-web is the window this world ships. A
// test that guards an unused file fails for reasons nobody will act on, and a
// suite with a permanent red in it stops being read at all -- which is how two
// total-failure combat bugs went unnoticed here.

test('every window computes the constitutional XP curve, past mastery included', () => {
  for (const [file, name] of [['window-web.html', 'XP_TO_LVL']]) {   // window-3d is not in service
    const M = windowImpl(file, name)
    for (const xp of [0, 82, 83, E.XP_TABLE[50], E.XP_TABLE[98], E.XP_TABLE[99],
                      E.XP_TABLE[99] * 2, E.XP_TABLE[99] * 40]) {
      assert.equal(M.lvl(xp), E.levelForXp(xp), `${file} disagrees about the level at ${xp} xp`)
    }
  }
})

test('standing has no ceiling and a fresh citizen has no calling', () => {
  const all99 = { skills: Object.fromEntries(E.SKILLS.map(s => [s, E.XP_TABLE[99]])) }
  assert.equal(E.standingOf(all99), 99 * E.SKILLS.length)
  const beyond = { skills: { ...all99.skills, earthcraft: E.XP_TABLE[99] * 40 } }
  assert.ok(E.standingOf(beyond) > E.standingOf(all99), 'mastery must not be a ceiling')
  // §5j: every skill starts at zero, so a fresh citizen has no highest one
  const fresh = { skills: Object.fromEntries(E.SKILLS.map(s => [s, 0])) }
  assert.equal(E.callingOf(fresh), 'newcomer')
})
