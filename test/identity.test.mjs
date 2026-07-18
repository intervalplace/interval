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

function windowImpl(file, lvlName) {
  const html = read(file)
  const start = html.indexOf('// ---- who a citizen is (spec 10)')
  assert.ok(start > 0, `${file} is missing the identity block`)
  const end = html.indexOf('\n', html.indexOf('return best === null', start))
  const block = html.slice(start, html.indexOf('}', end) + 1)
  // the window's own XP curve comes along, so a wrong curve fails here too
  const tableSrc = html.slice(html.indexOf('const XP_TABLE = (() =>'), html.indexOf('const SKILL_OF_NODE') > 0 && file.includes('web')
    ? html.indexOf('// ---- who a citizen is (spec 10)')
    : html.indexOf('// ---- who a citizen is (spec 10)'))
  return (0, eval)(tableSrc + '\n' + block + `\n;({standingOf, callingOf, lvl: ${lvlName}})`)
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
