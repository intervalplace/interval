// §11e / 6bs, for the engine: DOES THE HAUL NOTE STILL DESCRIBE THIS WORLD?
//
// `perTileSlot` is the most carefully argued constant in the founding, and it
// is argued from two things: the GEOMETRY (how far a drawn route runs on this
// island) and the CURVE (how many hours that adds up to). Geometry it can
// check. The curve moved underneath it at 6bj and nobody re-ran the argument,
// so the note claims 871 hours for plain cargo where the engine now pays 6,546.
//
// The note also cites `haultune.mjs` by name as the thing that derived the
// number. That file is not in the repository, which is the deeper reason this
// went unnoticed: the one constant that documents its own derivation tool
// cannot be re-derived.
//
// Slow: it founds a world. Run it when the curve or the generator changes.
//
// NON-CONSENSUS: builds a throwaway world.

import { createRequire } from 'module'
import { readFileSync, existsSync } from 'fs'
const require = createRequire(import.meta.url)
let E; try { E = require('./engine.js') } catch (e) { console.log('  skip  ' + e.message); process.exit(0) }
const { foundGenesis, buildWorld } = await import('./worldgen-any.mjs')
const { rulesHash } = await import('./rules-hash.mjs')

let bad = 0
const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL') + '  ' + m); if (!c) bad++ }

const RH = rulesHash(new URL('./', import.meta.url))
const g = foundGenesis('interval-expanse-v7', 'haul-check', RH, 0)
const w = buildWorld(g)
const H = g.haul ?? {}
const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))
const stores = Object.entries(w.nodes).filter(([, n]) => n.type === 'store').map(([id, n]) => ({ id, ...n }))

// every route haulDrawRoute could draw: ordered subsets of legMin..legMax
const all = []
for (const from of stores) {
  const walk = (cur, rest, used, tot) => {
    if (used >= (H.legMin ?? 1)) all.push(tot)
    if (used >= (H.legMax ?? 3)) return
    for (const n of rest) walk(n, rest.filter(x => x.id !== n.id), used + 1, tot + cheb(cur, n))
  }
  walk(from, stores.filter(s => s.id !== from.id), 0, 0)
}
const mean = all.reduce((a, b) => a + b, 0) / all.length
console.log('  ·     ' + stores.length + ' stores, ' + all.length + ' drawable routes, mean '
  + mean.toFixed(0) + ' tiles\n')

// ---- geometry: the constant was tuned against ~641 tiles -------------------
ok(Math.abs(mean - 641) / 641 < 0.25,
  'the island still has the geometry perTileSlot was tuned for (mean ' + mean.toFixed(0)
  + ' tiles against the 641 in the note)')

// ---- the mult table's own declared spread ----------------------------------
const mult = H.mult ?? {}
const lo = Math.min(...Object.values(mult)), hi = Math.max(...Object.values(mult))
ok(lo === 100 && hi === 300,
  'the mult table still runs 100 to 300, which is the spread the note argues for ('
  + lo + ' to ' + hi + ')')

const rate = (m) => Math.floor(mean * (H.perTileSlot ?? 0) * m / 10000) * E.INV_SLOTS / (mean + 30)
const plain = rate(100), dear = rate(300)
ok(Math.abs(dear / plain - 3) < 0.4,
  'dear cargo pays about three times plain, as the table declares (' + (dear / plain).toFixed(2) + 'x)')

// ---- and the hours, which is where it broke --------------------------------
const xpFor = (l) => { let a = 0, b = 1e12
  while (a < b) { const m = Math.floor((a + b) / 2); if (E.levelForXp(m) >= l) b = m; else a = m + 1 } return a }
const H99 = xpFor(99)
const hoursPlain = H99 / plain / 3600, hoursDear = H99 / dear / 3600
const src = readFileSync(new URL('./engine.js', import.meta.url), 'utf8')
const claim = src.match(/plain cargo ([\d,]+) hours to\s*\/\/\s*mastery, dear cargo ([\d,]+)/)
const cp = claim ? Number(claim[1].replace(/,/g, '')) : null
const cd = claim ? Number(claim[2].replace(/,/g, '')) : null
ok(cp !== null && Math.abs(hoursPlain - cp) / cp < 0.2,
  claim ? 'the note claims ' + cp + ' hours for plain cargo to 99; the engine pays '
    + Math.round(hoursPlain) + ' (6bj moved the curve and this argument stayed put)'
    : 'the note no longer states the hours it was tuned to')
ok(cd !== null && Math.abs(hoursDear - cd) / cd < 0.2,
  claim ? 'the note claims ' + cd + ' for dear cargo; the engine pays ' + Math.round(hoursDear)
    : 'the note no longer states the dear-cargo hours')

// ---- the tool it cites has to exist ----------------------------------------
ok(existsSync(new URL('./haultune.mjs', import.meta.url)),
  'haultune.mjs exists — the note names it as what derived perTileSlot, and a '
  + 'derivation nobody can re-run is how the hours above went stale')

console.log(bad ? '\nFAIL — ' + bad + ' claim(s) the haul note makes are no longer true'
                : '\nok — the haul note still describes the engine')
process.exit(bad ? 1 : 0)
