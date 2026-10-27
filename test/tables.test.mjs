// A WINDOW THAT COPIES A TABLE COPIES IT AT A MOMENT IN TIME.
//
// window-web.html and window-photo.html cannot import engine.js: both are one
// file served to a browser with no build step, so every constitutional table
// they need is a COPY, held honest by a note in the margin asking whoever
// changes the engine to change the window too.
//
// That has now failed on four tables in a row, and each failure was invisible
// from the window:
//
//   PRICES      window-web held 103 of 105, window-photo 77 of 105 -- and ten
//               of its 77 were retired words (the whole `star-` line). PRICES
//               decides what may be consigned, what prayer keeps when you die
//               and what transmuting accepts, so a short copy gives the wrong
//               answer about a citizen's death.
//   MOB_STATS   window-web knew eleven of twenty-five creatures. A beast that
//               is missing draws a FULL health bar at every wound (mobMaxHp
//               falls back to 1) and nothing warns you it has noticed you
//               (huntsMe needs `aggro`). The fourteen missing from one or both
//               were most of what is dangerous: the barrow wight, the fen
//               adder, the boar, the gibbet dead, the gibbet king.
//   EQUIPPABLE  window-photo held seventeen words and FOURTEEN were retired,
//               so a citizen there could put on three of eighty things.
//   CALLING_NAMES  one calling missing, the bridge-keeper, who has a node and
//               a verb of his own and was drawn with no name.
//
// So this is the check, run against the engine's own exports rather than
// against a comment. It covers the two windows in service. The others
// (mist, hill, writ, holo, diablo, 3d) are stale and are not guarded, for the
// reason test/identity.test.mjs gives: a suite with a permanent red in it
// stops being read, which is how two total-failure combat bugs went unnoticed
// here. They are named below so the fact is written down rather than implied.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import E from '../engine.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(here, '..')
const IN_SERVICE = ['window-web.html', 'window-photo.html']
// routed by serve.mjs and known to have drifted. Not a pass; a record.
const NOT_IN_SERVICE = ['window-3d.html', 'window-mist.html', 'window-hill.html',
  'window-writ.html', 'window-holo.html', 'window-diablo.html']

// Read a table's literal straight out of the window by counting brackets, the
// same walk the bridge uses to read a verb's branch out of engine.js. Anchoring
// on a closing string has broken twice in this project.
function literalOf(src, name) {
  const m = new RegExp('const ' + name + '\\s*=\\s*(new Set\\(\\s*)?[\\{\\[]').exec(src)
  if (!m) return null
  const open = src[m.index + m[0].length - 1]
  const close = open === '{' ? '}' : ']'
  let depth = 0
  for (let k = m.index + m[0].length - 1; k < src.length; k++) {
    if (src[k] === open) depth++
    else if (src[k] === close) { depth--; if (!depth) return src.slice(m.index + m[0].length - 1, k + 1) }
  }
  return null
}

// DECLARED DIFFERENCES, each with the window's own reason.
//
// MOB_STATS: the windows call the engine's `maxHealth` `maxHp`, and none of
// them carries `drops` -- a window has no business saying what will fall
// before it falls. A window may also carry a SUBSET of the fields, so only the
// fields it does carry are compared.
// EQUIP_SLOTS: window-web's copy is the order the worn column is DRAWN in and
// says so in its margin, which is not the engine's order and does not have to
// be: nothing constitutional reads it.
const SUBSET_OK = new Set(['EQUIP_SLOTS'])
function normalise(name, mine, theirs) {
  if (name !== 'MOB_STATS') return [mine, theirs]
  const a = { ...mine }, b = { ...theirs }
  if ('maxHp' in a) { a.maxHealth = a.maxHp; delete a.maxHp }
  delete b.drops
  for (const f of Object.keys(b)) if (!(f in a)) delete b[f]
  for (const f of Object.keys(a)) if (!(f in b)) delete a[f]
  return [a, b]
}
const flat = (o) => (o && typeof o === 'object' && !Array.isArray(o)
  ? JSON.stringify(Object.keys(o).sort().map((k) => [k, o[k]])) : JSON.stringify(o))

const TABLES = Object.keys(E).filter((k) => /^[A-Z][A-Z_0-9]*$/.test(k))

for (const file of IN_SERVICE) {
  test(`every table ${file} copies from the engine still matches it`, () => {
    const src = fs.readFileSync(path.join(root, file), 'utf8')
    const faults = []
    let compared = 0
    for (const name of TABLES) {
      if (SUBSET_OK.has(name)) continue
      const lit = literalOf(src, name)
      if (lit === null) continue       // this window does not copy that one
      compared++
      let mine
      try { mine = eval('(' + lit + ')') } catch (e) { faults.push(`${name}: will not parse (${e.message})`); continue }
      const theirs = E[name]
      if (theirs instanceof Set) {
        const have = new Set(Array.isArray(mine) ? mine : Object.keys(mine))
        const retired = [...have].filter((x) => !theirs.has(x))
        const lost = [...theirs].filter((x) => !have.has(x))
        if (retired.length) faults.push(`${name}: words the engine does not have: ${retired.join(' ')}`)
        if (lost.length) faults.push(`${name}: ${lost.length} words the engine has and this window does not: ${lost.join(' ')}`)
      } else if (Array.isArray(theirs)) {
        if (flat(mine) !== flat(theirs)) faults.push(`${name}: the array differs`)
      } else if (theirs && typeof theirs === 'object') {
        const retired = Object.keys(mine).filter((k) => !(k in theirs))
        const lost = Object.keys(theirs).filter((k) => !(k in mine))
        const wrong = Object.keys(mine).filter((k) => {
          if (!(k in theirs)) return false
          const [a, b] = normalise(name, mine[k], theirs[k])
          return flat(a) !== flat(b)
        })
        if (retired.length) faults.push(`${name}: keys the engine does not have: ${retired.join(' ')}`)
        if (lost.length) faults.push(`${name}: ${lost.length} keys the engine has and this window does not: ${lost.join(' ')}`)
        if (wrong.length) faults.push(`${name}: wrong values for ${wrong.join(' ')}`)
      } else if (flat(mine) !== flat(theirs)) faults.push(`${name}: differs`)
    }
    assert.ok(compared >= 3, `only found ${compared} copied tables in ${file}, which cannot be right`)
    assert.deepEqual(faults, [], '\n  ' + faults.join('\n  '))
  })
}

// AND THE WINDOWS THAT ARE NOT GUARDED ARE NAMED.
//
// If one of these is ever brought back into service, move it into IN_SERVICE
// and fix what this test then says about it. The point of the list is that
// nobody can believe a passing suite means every window agrees with the engine.
test('the windows outside this check are the ones outside service', () => {
  const serve = fs.readFileSync(path.join(root, 'serve.mjs'), 'utf8')
  const routed = [...serve.matchAll(/sendFile\('\.\/(window-[a-z0-9-]+\.html)'/g)]
    .map((m) => m[1])
  const known = new Set([...IN_SERVICE, ...NOT_IN_SERVICE])
  const unaccounted = [...new Set(routed)].filter((f) => !known.has(f))
  assert.deepEqual(unaccounted, [],
    `serve.mjs routes these and this test has never heard of them: ${unaccounted.join(' ')}`)
  for (const f of NOT_IN_SERVICE)
    assert.ok(fs.existsSync(path.join(root, f)), `${f} is listed as stale and does not exist`)
})

// AND THE WIRE THEY COME OVER, which is the other way this can be wrong.
//
// `JSON.stringify(new Set(['a']))` is `{}`. /api/tables served `items`,
// `equippable`, `stackable` and `twoHanded` straight out of the engine, where
// all four are Sets, so all four arrived as empty objects: a window that
// trusted them would have learned that nothing in the world can be worn.
// `smelted` was correct only because it appeared twice in that object literal
// and the second spelling, a list, overwrote the first.
test('every table /api/tables serves survives JSON', () => {
  const serve = fs.readFileSync(path.join(root, 'serve.mjs'), 'utf8')
  const open = serve.indexOf("if (path === '/api/tables')")
  assert.ok(open > 0, 'serve.mjs no longer has an /api/tables handler')
  const body = serve.slice(open, serve.indexOf('\n    }', open))
  const faults = []
  for (const [name, value] of Object.entries(E)) {
    if (!(value instanceof Set)) continue
    // does the handler name this export, and does it spread it?
    const re = new RegExp('([A-Za-z]+):\\s*(\\.\\.\\.)?\\s*\\[?\\.?\\.?\\.?\\(?E\\.' + name + '\\b')
    const m = re.exec(body)
    if (!m) continue                       // not served at all, which is fine
    const whole = body.slice(m.index, body.indexOf(',', m.index) + 1)
    if (!whole.includes('[...')) faults.push(`${m[1]}: E.${name} is a Set and goes down whole`)
  }
  assert.deepEqual(faults, [], faults.join('; '))
})

// AND THE WINDOW HAS TO TAKE THEM.
//
// Serving the right numbers is half of it. window-web fetched /api/tables for
// years and read the callings out of it and nothing else, so the anvil went on
// quoting its own stale copy: twenty recipes wrong, a quick-ingot at twenty
// quick-stone when the world wants eight quick-grit.
for (const file of IN_SERVICE) {
  test(`${file} takes the pillar ledgers, not only its own copies`, () => {
    const src = fs.readFileSync(path.join(root, file), 'utf8')
    assert.ok(src.includes('/api/tables'), `${file} no longer fetches /api/tables`)
    // anchored on the swap, not on the first mention: window-web names
    // /api/tables in a comment a thousand lines above the code that reads it,
    // and `indexOf` landed on the comment.
    const at = src.indexOf('const swap = (into, from)')
    assert.ok(at > 0, `${file} does not swap the pillar tables in`)
    const after = src.slice(at, at + 2000)
    for (const field of ['t.recipes', 't.prices', 't.mobs', 't.equippable', 't.smithReqs'])
      assert.ok(after.includes(field), `${file} fetches the tables and ignores ${field}`)
  })
}

// AND AN OLDER PILLAR MUST NOT EMPTY A WINDOW.
//
// A pillar built before the Sets were spread serves `equippable: {}`. A window
// that cleared its own table and then filled it from that would leave a
// citizen in a world where nothing can be worn and nothing can be made, and
// the error would be swallowed with the damage already done.
for (const file of IN_SERVICE) {
  test(`a pillar that serves nothing leaves ${file}’s tables alone`, () => {
  const src = fs.readFileSync(path.join(root, file), 'utf8')
  const at = src.indexOf('const swap = (into, from)')
  assert.ok(at > 0, `${file} no longer swaps the pillar tables in`)
  const swaps = src.slice(at, at + 700)
  assert.ok(/Object\.keys\(from\)\.length/.test(swaps),
    'swap clears before it checks the replacement has anything in it')
  assert.ok(/Array\.isArray\(from\)\s*\|\|\s*!from\.length/.test(swaps),
    'swapSet clears before it checks the replacement is a non-empty list')
  })
}
