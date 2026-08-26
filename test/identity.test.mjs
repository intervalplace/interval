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
    skills.hitpoints = E.XP_TABLE[10]
    return { skills: { ...skills, ...over } }
  }
  return [
    mk(),
    mk({ brewing: E.XP_TABLE[42], woodcutting: E.XP_TABLE[30] }),
    mk({ exploration: E.XP_TABLE[60], brewing: E.XP_TABLE[59] }),
    mk({ attack: E.XP_TABLE[70], defence: E.XP_TABLE[70] }),
    mk(Object.fromEntries(E.SKILLS.map(s => [s, E.XP_TABLE[99]]))),
    mk({ mining: E.XP_TABLE[99] * 40 }),           // far past mastery: no ceiling
    mk({ prayer: E.XP_TABLE[25] }),
  ]
}

// Extraction, by NAME rather than by position.
//
// This used to slice the file between two literal strings: an opening
// comment marker and `const XP_TABLE = (() =>`. Both moved. The marker was
// renamed and the XP table became a literal array, so the slice came back
// empty and every assertion below died on `standingOf is not defined` --
// which reads exactly like a broken test and is why nobody chased it. For
// four spec revisions the two windows were free to disagree with the engine
// about who a citizen is, and they did: the 3D window omitted `strength` and
// `hauling` from its standing, and BOTH windows called an alchemist a
// sigilist and had no word at all for a berserker or a runner.
//
// Pulling each declaration out by name costs a little more code and cannot
// silently match nothing: a missing piece throws with the name of the piece.
function grab(html, label, opener, closer) {
  const i = html.indexOf(opener)
  if (i < 0) throw new Error(`${label}: '${opener}' not found — the window has been restructured`)
  const j = html.indexOf(closer, i)
  if (j < 0) throw new Error(`${label}: no closing '${closer}' after it`)
  return html.slice(i, j + closer.length)
}

function windowImpl(file, lvlName) {
  const html = read(file)
  const parts = [
    grab(html, 'XP_TABLE', 'const XP_TABLE = [', '];'),
    grab(html, 'POW2_SEVENTHS', 'const POW2_SEVENTHS = [', ']'),
    grab(html, 'xpStepAt', 'function xpStepAt(lvl)', '\n}'),
    grab(html, lvlName, `const ${lvlName} = (xp) => {`, '\n}'),
    grab(html, 'CALLINGS', 'const CALLINGS = {', '\n}'),
    grab(html, 'SKILL_ORDER', 'const SKILL_ORDER = [', ']'),
    grab(html, 'standingOf', 'function standingOf(p)', '\n}'),
    grab(html, 'callingOf', 'function callingOf(p)', '\n}'),
  ]
  return (0, eval)(parts.join('\n') + `\n;({standingOf, callingOf, lvl: ${lvlName}})`)
}

test('the 2D window agrees with the engine about standing and calling', () => {
  const M = windowImpl('window-web.html', 'XP_TO_LVL')
  for (const p of citizens()) {
    assert.equal(M.standingOf(p), E.standingOf(p), 'standing disagrees')
    assert.equal(M.callingOf(p), E.callingOf(p), 'calling disagrees')
  }
})

test('the 3D window agrees with the engine about standing and calling', () => {
  const M = windowImpl('window-3d.html', 'XP_LVL')
  for (const p of citizens()) {
    assert.equal(M.standingOf(p), E.standingOf(p), 'standing disagrees')
    assert.equal(M.callingOf(p), E.callingOf(p), 'calling disagrees')
  }
})

test('every window computes the constitutional XP curve, past mastery included', () => {
  for (const [file, name] of [['window-web.html', 'XP_TO_LVL'], ['window-3d.html', 'XP_LVL']]) {
    const M = windowImpl(file, name)
    for (const xp of [0, 82, 83, E.XP_TABLE[50], E.XP_TABLE[98], E.XP_TABLE[99],
                      E.XP_TABLE[99] * 2, E.XP_TABLE[99] * 40]) {
      assert.equal(M.lvl(xp), E.levelForXp(xp), `${file} disagrees about the level at ${xp} xp`)
    }
  }
})

test('standing has no ceiling and calling ignores hitpoints', () => {
  const all99 = { skills: Object.fromEntries(E.SKILLS.map(s => [s, E.XP_TABLE[99]])) }
  assert.equal(E.standingOf(all99), 99 * E.SKILLS.length)
  const beyond = { skills: { ...all99.skills, mining: E.XP_TABLE[99] * 40 } }
  assert.ok(E.standingOf(beyond) > E.standingOf(all99), 'mastery must not be a ceiling')
  // a fresh citizen starts at hitpoints 10 and must not therefore be a fighter
  const fresh = { skills: Object.fromEntries(E.SKILLS.map(s => [s, s === 'hitpoints' ? E.XP_TABLE[10] : 0])) }
  assert.equal(E.callingOf(fresh), 'newcomer')
})
