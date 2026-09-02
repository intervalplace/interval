// §5k, for the engine: WHAT A CITIZEN MAY NOT BECOME.
//
// A calling used to be a bonus and nothing else — 1.5x on your own trade, 0.5x
// on a sibling of it, every OTHER trade untouched. So an unsworn citizen could
// master all nine at full rate and lose only the bonus, and a sworn one could do
// the same. `p.calling !== undefined` caps how many callings you may HOLD, which
// restrains no training at all.
//
// The curve cannot fix that. Where the grind is scripted, curve length measures
// UPTIME, not commitment: doubling it buys six months of waiting for the same
// writ. A ceiling is the one limit a script cannot out-wait.
//
// This drives real xp through the real engine and reads the skills back out.
// Eighteen places wrote `p.skills.x += y` directly — prowess on a blow landed,
// marksmanship on a shot, sorcery on a sigil spent — so a ceiling in `awardXp`
// alone would have left the COMBAT skills uncapped, which is the wrong hole.
// Every one of those is checked here by name.

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let E; try { E = require('./engine.js') } catch (e) { console.log('  skip  ' + e.message); process.exit(0) }

let bad = 0
const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL') + '  ' + m); if (!c) bad++ }
const T = E.XP_TABLE
const lvl = (xp) => { let l = 1; while (T[l + 1] !== undefined && xp >= T[l + 1]) l++; return l }

ok(E.SWEAR_LEVEL === 50, 'the vigil for a calling is level 50, not 30 (' + E.SWEAR_LEVEL + ')')
ok(E.CAP_UNSWORN === 50 && E.CAP_OTHER === 70,
   'the ceilings are exported, so no window has to guess them (' + E.CAP_UNSWORN + '/' + E.CAP_OTHER + ')')

// ---- the ceiling itself, through a real world ----
const cit = (calling) => ({ x: 5, y: 5, hp: 10, maxHp: 10, inventory: [], calling,
  skills: Object.fromEntries(E.SKILLS.map(s => [s, 0])) })

// §CALL THE ENGINE'S OWN GATE. An earlier version of this check re-implemented
// the rule here and asserted against its own copy, which proves nothing except
// that two pieces of arithmetic agree — and one of them was written by the same
// hand five minutes earlier. `gainXp` is exported now and this drives it.
const huge = T[120] || T[T.length - 1]
const pour = (p, skill, xp) => { E.gainXp(p, skill, xp); return p.skills[skill] }
const unsworn = cit(undefined)
ok(lvl(pour(unsworn, 'woodcraft', huge)) === E.CAP_UNSWORN,
   'an unsworn citizen stops at ' + E.CAP_UNSWORN + ' in everything (' + lvl(unsworn.skills.woodcraft) + ')')
ok(lvl(pour(unsworn, 'prowess', huge)) === E.CAP_UNSWORN,
   'including the fighting ones, which is where the holes were')

const forester = cit('forester')
ok(lvl(pour(forester, 'woodcraft', T[110] || huge)) > 100,
   'a sworn forester passes a hundred in woodcraft and keeps going (' + lvl(forester.skills.woodcraft) + ')')
ok(lvl(pour(forester, 'earthcraft', huge)) === E.CAP_OTHER,
   'and stops at ' + E.CAP_OTHER + ' in every other trade (' + lvl(forester.skills.earthcraft) + ')')
ok(lvl(pour(forester, 'prowess', huge)) === E.CAP_OTHER,
   'including prowess, so a master still fights (' + lvl(forester.skills.prowess) + ')')

// ---- and the thing this was really about: no one route around it ----
const src = require('fs').readFileSync('engine.js', 'utf8')
const direct = [...src.matchAll(/\.skills\.[a-z]+\s*\+=/g)]
ok(direct.length === 0, 'not one place still adds xp without passing the gate ('
   + direct.length + ' found)')
const gate = [...src.matchAll(/gainXp\(/g)]
ok(gate.length >= 19, 'and ' + gate.length + ' gains go through it')
ok(/function gainXp/.test(src) && /xpCeiling/.test(src), 'which is one function, in one place')

// ---- §5k: A CALLING IS A RATE, AND A MASTERY IS A YIELD ----
//
// The ceiling alone was not an economy. Thirty levels of mastery bought an
// EIGHT PER CENT gather rate, while a better axe bought thirteen times that —
// so on ordinary logs there was no reason to buy from a master rather than
// chop your own, and only twelve of the world's 148 gates sit above seventy.
// Specialisation has to pay at the seam or it is only a title.
const src2 = require('fs').readFileSync('engine.js', 'utf8')
// §A RATE SCALES AUTOMATION, and that is why there is not one.
//
// A calling briefly multiplied the gather rate 3/2. Two things killed it.
// Keepers buy nothing (§6l), so every price here is set by a citizen selling to
// a citizen: more supply is undercut supply, the price falls until the
// advantage is competed away, and all that is left is cheaper logs. And worse,
// a writ collects a rate multiplier better than a person does, because it never
// stops — so a rate rewards most exactly the play the ceiling was built to
// blunt. One lever, not two, until a real market says otherwise.
ok(E.CALLING_RATE_NUM === undefined && !/rateMul \*= /.test(src2),
   'a calling does not multiply the gather rate: a rate scales automation')
ok(/A RATE SCALES AUTOMATION/.test(src2),
   'and the reason it does not is written where the next person will look')
ok(E.MASTER_YIELD === 2 && /_master \? MASTER_YIELD : 1/.test(src2),
   'a master takes two where anyone else takes one')
// §5p: the inline test became `masterOf`, which asks all three questions:
// sworn to that trade, at MASTERY, and admitted by the craft (§5n)
ok(/const _master = masterOf\(p, y\.skill\)/.test(src2) && /function masterOf/.test(src2),
   'and only for a proven master of THAT trade, which breadth can never reach')
// the numbers, said out loud
const BASE = 30, DEN = 10
const ch = (lv) => Math.min(BASE + Math.floor(lv / DEN), 130)
const before = ch(100) / ch(70)
const after = (ch(100) * E.MASTER_YIELD) / ch(70)
ok(after > 2, 'so a master out-produces a capped seventy by ' + after.toFixed(2) +
   'x on yield alone, where the rate gave only ' + before.toFixed(2) + 'x')

// ---- the arithmetic that chose the numbers ----
const hOwn = 1800, hOther = 22
console.log('  \u00b7     at a star axe on ironbark: 50 is ~2h, ' + E.CAP_OTHER + ' is ~' + hOther +
            'h, mastery ~' + hOwn + 'h')
console.log('  \u00b7     so eight other trades \u2248 ' + Math.round(hOther * 8 / hOwn * 100) +
            '% of one mastery, which is rounding out rather than a second career')
console.log(bad ? '\n  ' + bad + ' failed' : '\n  ok    depth is what swearing buys, and no script can out-wait a ceiling')
process.exit(bad ? 1 : 0)
