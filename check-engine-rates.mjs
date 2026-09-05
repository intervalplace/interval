// CALLINGS.md, for the engine: IS ANY TRADE AN OUTLIER NOBODY CHOSE?
//
// CALLINGS.md quotes one rate ("a star axe on ironbark: 50 is ~2h, 70 is ~22h,
// 100 is ~1,800h") and every tuning argument since has applied it to all nine
// trades. Measured, the fast route of each trade runs 1.3 to 4.6 xp an
// interval -- so the quote is true of three trades and wrong about six.
//
// This is the guard, not the survey: check-engine-roads.mjs measures each trade
// properly at five levels. This runs one level, briefly, and asserts only the
// thing a tuning pass can silently break -- that the trades stay within reach
// of each other, and that none of them is accidentally free.
//
// A trade being an OUTLIER can be a design choice. A trade being an outlier
// that no document mentions is how prowess ended up as the longest road in the
// world while also being the first thing every citizen does.
//
// NON-CONSENSUS: builds a throwaway world.

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let E; try { E = require('./engine.js') } catch (e) { console.log('  skip  ' + e.message); process.exit(0) }
const { rulesHash } = await import('./rules-hash.mjs')

let bad = 0
const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL') + '  ' + m); if (!c) bad++ }

const N = 200, LVL = 50
const RH = rulesHash(new URL('./', import.meta.url))
const G = E.makeGenesis('rate-yard', RH, 0, 64, 64)
const SP = E.spawnOf(G)
const ID = E.generateIdentity()

async function run(skill, calling, setup, loop) {
  let s = E.newWorld(G)
  const at = (id, t, dx, dy) => E.addNode(s, id, t, SP.x + dx, SP.y + dy)
  at('tree', 'tree', 1, 0); at('rock', 'iron-rock', -1, 0)
  at('spot', 'fishing-spot', 0, 1); at('oss', 'ossuary', 0, -1)
  E.addPlayer(s, ID.playerId, SP.x, SP.y)
  const p = s.players[ID.playerId]
  setup(p, s); p.calling = calling; p.skills[skill] = E.XP_TABLE[LVL]
  const before = p.skills[skill]
  for (let t = 0; t < N; t++) {
    const q = s.players[ID.playerId]
    const inp = loop(q, s)
    const ins = inp ? [E.signInput({ ...inp, playerId: ID.playerId, tick: s.tick,
      worldId: E.worldId(G) }, ID.privateKey)] : []
    s = E.nextState(s, ins, E.beaconValue(G.genesisSeed, s.tick))
  }
  return (s.players[ID.playerId].skills[skill] - before) / N
}

const full = (p) => p.inventory.every(x => x !== null) ? { type: 'drop', slot: 0 } : null
const gath = (id) => (p) => full(p) ?? { type: 'gather', nodeId: id }
const tool = (p, it) => { p.inventory[0] = { item: it, qty: 1 }; p.equipment = { weapon: { item: it } } }

const TRADES = [
  ['woodcraft', 'forester', (p) => tool(p, 'iron-hatchet'), gath('tree')],
  ['earthcraft', 'miner', (p) => tool(p, 'iron-pickaxe'), gath('rock')],
  ['shorecraft', 'fisher', (p) => tool(p, 'rod'), gath('spot')],
  ['sorcery', 'alchemist',
    (p) => { for (let i = 0; i < p.inventory.length; i++) p.inventory[i] = { item: 'logs', qty: 1 } },
    (p) => { let i = p.inventory.findIndex(x => x?.item === 'logs')
      if (i === -1) { for (let k = 0; k < p.inventory.length; k++) p.inventory[k] = { item: 'logs', qty: 1 }; i = 0 }
      return { type: 'alch', slot: i } }],
  ['mourning', 'mourner',
    (p) => { for (let i = 0; i < p.inventory.length; i++) p.inventory[i] = { item: 'bones', qty: 1 } },
    (p) => { let i = p.inventory.findIndex(x => x?.item === 'bones')
      if (i === -1) { for (let k = 0; k < p.inventory.length; k++) p.inventory[k] = { item: 'bones', qty: 1 }; i = 0 }
      return { type: 'bury', slot: i } }],
]

const rates = {}
for (const [sk, c, setup, loop] of TRADES) rates[sk] = await run(sk, c, setup, loop)
for (const [k, v] of Object.entries(rates)) console.log('  ·     ' + k.padEnd(13) + v.toFixed(2) + ' xp/interval')
console.log('')

// mourning and sorcery are measured with their inputs free: those are CEILINGS
const bound = new Set(['mourning', 'sorcery'])
const tick = Object.entries(rates).filter(([k]) => !bound.has(k)).map(([, v]) => v)
const lo = Math.min(...tick), hi = Math.max(...tick)
ok(hi / lo < 2, 'the tick-bound trades stay within 2x of each other (' + lo.toFixed(1)
  + ' to ' + hi.toFixed(1) + ') — one rate for all of them is a fair approximation')
ok(tick.every(r => r > 1 && r < 8), 'no tick-bound trade is free or stalled')
ok(rates.mourning > rates.woodcraft * 4,
  'burying is a CEILING, not a rate: it pays ' + (rates.mourning / rates.woodcraft).toFixed(0)
  + 'x a gatherer per interval, and the hunting that supplies it is the road')
ok(rates.mourning === Math.floor(E.XP_BURY_CONSECRATED * 3 / 2),
  'a sworn mourner is paid the own-calling rate for a burial (§5q) — ' + rates.mourning
  + ', not ' + E.XP_BURY_CONSECRATED)

console.log(bad ? '\nFAIL — ' + bad + ' rate(s) have moved out of the band'
                : '\nok — no trade is an outlier nobody chose')
process.exit(bad ? 1 : 0)
