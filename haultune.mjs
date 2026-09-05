// haultune.mjs — DERIVE `perTileSlot` FROM THIS WORLD'S GEOMETRY.
//
// 6bs names this file as what produced the constant: "DERIVED FROM THIS WORLD'S
// GEOMETRY by haultune.mjs, exactly as survey's constants are, and not a
// universal curve: a world half this size founds a different perTileSlot from
// its own simulation."
//
// It was not in the repository. That is why the note went stale: the hours it
// quotes (871 for plain cargo, 282 for dear) were computed against the curve as
// it stood before 6bj rescaled it, and nobody could re-run the derivation to
// notice. The engine now pays 6,546 and 2,182 for the same walk. The geometry
// half of the argument survived a whole world regeneration intact -- mean route
// 634 tiles on the seventh expanse against the 641 it was tuned to -- so the
// constant is not wrong. The sentence explaining it is.
//
// This exists so the sentence can be regenerated instead of remembered. Run it
// whenever the curve moves or the generator changes, and paste the result.
//
//   node haultune.mjs [target-hours]      target for PLAIN cargo to level 99
//
// NON-CONSENSUS: founds a throwaway world and computes; changes nothing.

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const E = require('./engine.js')
const { foundGenesis, buildWorld } = await import('./worldgen-any.mjs')
const { rulesHash } = await import('./rules-hash.mjs')

// MASTERY IS A HUNDRED. 6bs argues in "hours to ninety-nine", which is
// inherited vocabulary from a game that ended there; this world's own constant
// is E.MASTERY and it is 100. Targeting 99 understates the road by 16%, and
// quoting it invites the next reader to tune against the wrong end.
// AND THE TARGET IS A RATE, NOT A NUMBER OF HOURS. The first cut of this file
// took hours and defaulted to 6bs's own 871, which is how it produced
// perTileSlot: 90 -- a figure that would have made hauling the fastest road in
// the world by a factor of seven. Those hours were measured against a curve
// that has since moved twice. A RATE does not move: "beside every other trade"
// means 4.3 experience an interval whatever the curve is doing, because that is
// what the gathering trades actually pay (check-engine-roads.mjs). Give this
// tool hours and you tune against a fossil, which is the very fault it exists
// to prevent.
const TARGET_RATE = Number(process.argv[2]) || 4.3   // xp/interval, measured
const TOWN = 30                                    // intervals spent in town on a trip, per 6bs

const RH = rulesHash(new URL('./', import.meta.url))
const g = foundGenesis('interval-expanse-v7', 'haultune', RH, 0)
const w = buildWorld(g)
const H = g.haul ?? {}
const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))

// ---- the geometry: every route haulDrawRoute could draw ---------------------
const stores = Object.entries(w.nodes).filter(([, n]) => n.type === 'store').map(([id, n]) => ({ id, ...n }))
const routes = []
for (const from of stores) {
  const walk = (cur, rest, used, tot) => {
    if (used >= (H.legMin ?? 1)) routes.push(tot)
    if (used >= (H.legMax ?? 3)) return
    for (const n of rest) walk(n, rest.filter((x) => x.id !== n.id), used + 1, tot + cheb(cur, n))
  }
  walk(from, stores.filter((s) => s.id !== from.id), 0, 0)
}
routes.sort((a, b) => a - b)
const mean = routes.reduce((a, b) => a + b, 0) / routes.length

// ---- the curve, read rather than assumed ------------------------------------
const xpFor = (l) => { let a = 0, b = 1e12
  while (a < b) { const m = Math.floor((a + b) / 2); if (E.levelForXp(m) >= l) b = m; else a = m + 1 } return a }
const X99 = xpFor(99), X100 = xpFor(100)
const ALLOW = g.ceiling?.allow ?? 5400

const rate = (per, mult) => Math.floor(mean * per * mult / 10000) * E.INV_SLOTS / (mean + TOWN)
const hours = (per, mult) => X100 / rate(per, mult) / 3600
const TARGET = X100 / TARGET_RATE / 3600      // the hours that rate implies on THIS curve

// ---- solve for the integer that lands plain cargo on the target -------------
let best = null
for (let per = 1; per <= 400; per++) {
  const h = hours(per, 100)
  if (!Number.isFinite(h)) continue
  const err = Math.abs(h - TARGET)
  if (!best || err < best.err) best = { per, h, err }
}

const mult = H.mult ?? {}
const lo = Math.min(...Object.values(mult)), hi = Math.max(...Object.values(mult))

console.log('haultune — ' + stores.length + ' stores, ' + routes.length + ' drawable routes')
console.log('  mean ' + mean.toFixed(0) + ' tiles, median ' + routes[routes.length >> 1]
  + ', range ' + routes[0] + '–' + routes[routes.length - 1])
console.log('  legs ' + (H.legMin ?? 1) + '–' + (H.legMax ?? 3) + ', pack ' + E.INV_SLOTS
  + ' slots, ' + TOWN + ' intervals in town')
console.log('  mastery (level ' + E.MASTERY + ') is ' + X100.toLocaleString() + ' xp')
console.log('  the mult table runs ' + lo + ' to ' + hi + '\n')

console.log('SHIPPED  perTileSlot: ' + H.perTileSlot)
for (const [label, m] of [['plain (' + lo + ')', lo], ['dear (' + hi + ')', hi]])
  console.log('  ' + label.padEnd(12) + Math.round(hours(H.perTileSlot, m)) + ' hours to mastery, '
    + Math.round(X100 / rate(H.perTileSlot, m) / ALLOW) + ' days to mastery under the ceiling')

console.log('\nDERIVED  perTileSlot: ' + best.per + '   (plain cargo at ' + TARGET_RATE + ' xp/interval, = ' + Math.round(TARGET) + ' hours)')
for (const [label, m] of [['plain (' + lo + ')', lo], ['dear (' + hi + ')', hi]])
  console.log('  ' + label.padEnd(12) + Math.round(hours(best.per, m)) + ' hours to mastery, '
    + Math.round(X100 / rate(best.per, m) / ALLOW) + ' days to mastery under the ceiling')

console.log('\nThe spread is the mult table\'s own number and not this constant\'s: '
  + (rate(best.per, hi) / rate(best.per, lo)).toFixed(2) + 'x, against the '
  + (hi / lo).toFixed(2) + 'x the table declares.')
console.log('Paste both figures into the 6bs note, and re-run check-engine-haul.mjs.')
