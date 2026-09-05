// §7ai / §5v, for the engine: DOES THE BURY PROSE STILL DESCRIBE THE BURY CODE?
//
// The notes above XP_BURY_DRAGON and XP_BURY_CONSECRATED are not decoration.
// They set both constants by ARGUMENT -- a dragon set should be about two per
// cent of the longest road, a pack of bones should be too many trades to buy,
// the walk to a monastery should pay out to about fifty tiles -- and each
// argument is a ratio between a literal and the xp curve.
//
// 6bj moved the curve and left the arguments standing. A dragon set fell from
// the intended two per cent of a mastery to 0.16%, which is the exact
// condition the constant was raised from 25,000 to escape: "a route nobody can
// complete is not a market; it is scenery." Nothing failed, because nothing
// was checking. The prose was still persuasive; it was just no longer true.
//
// spec-tables.mjs already solved this for SPEC.md by DERIVING the tables. It
// cannot reach inline comments in engine.js, which is where the reasoning
// actually lives. This is the same idea aimed at the comments: assert the
// ratios the prose claims, so the next rescale fails loudly instead of quietly
// invalidating the argument that justified the number.
//
// NON-CONSENSUS: reads exported constants, computes nothing the engine uses.

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let E; try { E = require('./engine.js') } catch (e) { console.log('  skip  ' + e.message); process.exit(0) }

let bad = 0
const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL') + '  ' + m); if (!c) bad++ }
const T = E.XP_TABLE
const road = T[E.MASTERY]                       // the longest road: xp to mastery
const own = (x) => Math.floor(x * 3 / 2)        // §5q, the own-calling rate

console.log('the road to mastery is ' + road.toLocaleString() + ' xp\n')

// ---- the claim: a dragon set is a little under two per cent of the road ----
const setShare = E.XP_BURY_DRAGON / road
ok(setShare > 0.012 && setShare < 0.02,
   'a dragon set is ~2% of the road (' + (setShare * 100).toFixed(2) + '%, '
   + Math.ceil(road / E.XP_BURY_DRAGON) + ' sets to a mastery; the note argues for ~58)')

// ---- the claim: the supply cap makes any number here safe ----
ok(Math.ceil(road / E.XP_BURY_DRAGON) < 730,
   'a mastery is buyable inside a year of PERFECT supply, so the market is a market and not scenery')

// ---- the claim: ordinary bones are unbuyable, being too many trades ----
const bones = Math.ceil(road / E.XP_BURY)
ok(bones / E.INV_SLOTS > 5000,
   'ordinary bones are unbuyable: ' + bones.toLocaleString() + ' bones is '
   + Math.ceil(bones / E.INV_SLOTS).toLocaleString() + ' packs, and they do not stack')

// ---- the claim: consecrated ground is a premium, not a different road ----
ok(E.XP_BURY_CONSECRATED > E.XP_BURY && E.XP_BURY_CONSECRATED <= E.XP_BURY * 1.5,
   'consecrated ground is a quarter again, not a shortcut ('
   + E.XP_BURY + ' -> ' + E.XP_BURY_CONSECRATED + ')')

// ---- §5q: bury must go through awardXp, or a mourner's calling pays only on
// the road their own arithmetic tells them not to walk ----
const cit = () => ({ x: 0, y: 0, calling: 'mourner',
  skills: Object.fromEntries(E.SKILLS.map(s => [s, 0])) })
if (typeof E.awardXp === 'function') {
  const p = cit()
  E.awardXp(p, 'mourning', E.XP_BURY_CONSECRATED, 'mourner')
  ok(p.skills.mourning === own(E.XP_BURY_CONSECRATED),
     'a sworn mourner is paid the own-calling rate for a consecrated burial ('
     + p.skills.mourning + ', expected ' + own(E.XP_BURY_CONSECRATED) + ')')
} else {
  console.log('  skip  awardXp is not exported, so the bury path cannot be checked from here')
}

console.log(bad ? '\nFAIL — ' + bad + ' claim(s) the prose makes are no longer true'
                : '\nok — the bury notes still describe the engine')
process.exit(bad ? 1 : 0)
