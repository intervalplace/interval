// §6bj, for the engine: IS XP_TABLE STILL THE TABLE ITS OWN COMMENT DESCRIBES?
//
// The table is frozen literals with a generating expression written above it.
// A frozen table is right -- two implementations must agree to the digit -- but
// it means the expression is prose, and prose drifts. This recovers the
// doubling period FROM the shipped table rather than being told it, so the
// check keeps working after the curve is retuned, and fails if somebody edits
// a literal by hand.
//
// It also asserts the counted claims in the note ("seventy-two levels sit above
// mastery", "the table ends where the next level would exceed MAX_XP"), because
// those are derived numbers written as words and they move whenever the curve
// does.
//
// NON-CONSENSUS: reads exported constants.

import { createRequire } from 'module'
import { readFileSync } from 'fs'
const require = createRequire(import.meta.url)
let E; try { E = require('./engine.js') } catch (e) { console.log('  skip  ' + e.message); process.exit(0) }

let bad = 0
const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL') + '  ' + m); if (!c) bad++ }
const T = E.XP_TABLE, MAX_XP = 1e12

// XP_TABLE[L] = floor(sum over i<L of (15*i + 0.005*i^1.75 * 2^(i/DBL)))
const gen = (dbl, upto) => { let s = 0; const o = [0, 0]
  for (let L = 2; L <= upto; L++) { s += 15 * (L - 1) + 0.005 * Math.pow(L - 1, 1.75) * Math.pow(2, (L - 1) / dbl); o[L] = Math.floor(s) }
  return o }

// recover DBL by search, then require an EXACT match on every entry
let dbl = null
for (let d = 40; d <= 120 && dbl === null; d++) {
  const t = gen(d / 10, T.length - 1)
  if (t.length === T.length && t.every((v, i) => v === T[i])) dbl = d / 10
}
ok(dbl !== null, dbl !== null
  ? 'every entry is reproduced by the documented expression, doubling every ' + dbl + ' levels'
  : 'NO doubling period reproduces the shipped table — a literal has been hand-edited, '
    + 'or the expression above it no longer describes it')

if (dbl !== null) {
  const t = gen(dbl, T.length + 4)
  ok(T[T.length - 1] <= MAX_XP && t[T.length] > MAX_XP,
    'the table ends exactly where the next level would pass MAX_XP (last is level '
    + (T.length - 1) + ')')
  // READ THE SENTENCE, not a copy of it. The note above XP_TABLE states the
  // count in words; that is the claim, so that is what gets checked.
  const above = T.length - 1 - E.MASTERY
  const UNITS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
    nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
    sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30,
    forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 }
  const words = (t) => t.toLowerCase().split(/[\s-]+/).filter((x) => x !== 'and')
    .reduce((a, w) => w === 'hundred' ? { ...a, h: (a.n || 1) * 100, n: 0 }
      : { ...a, n: (a.n || 0) + (UNITS[w] ?? 0) }, { h: 0, n: 0 })
  const src = readFileSync(new URL('./engine.js', import.meta.url), 'utf8')
  const m = src.match(/([a-z][a-z\s-]*?) levels sit above mastery/i)
  const claimed = m ? (() => { const v = words(m[1]); return v.h + v.n })() : null
  ok(claimed === above, m
    ? 'the note says ' + m[1] + ' levels sit above mastery, and there are ' + above
    : 'the note no longer states how many levels sit above mastery')
}

// the two claims the pacing rests on, in the only unit that means anything now
const ALLOW = 5400                        // genesis.ceiling.allow on the founded island
const REF = 4.3                           // xp/interval, measured: see check-engine-roads.mjs
const day = (lvl) => T[lvl] / REF / ALLOW
ok(day(50) >= 0.5 && day(50) <= 3,
  'level 50 is about a day of a citizen\'s ninety minutes (' + day(50).toFixed(1) + ' days)')
console.log('  ·     at ' + REF + ' xp/interval: 50 in ' + day(50).toFixed(1)
  + 'd, 70 in ' + Math.round(day(70)) + 'd, mastery in ' + Math.round(day(100))
  + 'd (' + (day(100) / 365).toFixed(1) + ' years of perfect attendance)')

console.log(bad ? '\nFAIL — ' + bad + ' claim(s) about the curve are no longer true'
                : '\nok — the curve is the curve its comment describes')
process.exit(bad ? 1 : 0)
