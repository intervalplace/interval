// census.mjs — compute the entire world tile for tile, with every resource node.
import E from './engine.js'
import * as V6 from './worldgen-expanse6.mjs'

const SEED = process.env.INTERVAL_SEED_NAME || 'solo-42'
const RULES = 'f1b7060d09685d91'.padEnd(64, '0')
const g = V6.makeExpanse6Genesis(SEED, RULES, 0, 896, 512)
const g2 = V6.makeExpanse6Genesis(SEED, RULES, 0, 896, 512)
const W = g.worldW, H = g.worldH
const w = V6.buildWorld(g)

const valid = E.validateState(w)
const det = g.geographyHash === g2.geographyHash

console.log('='.repeat(64))
console.log('TALLYHOLM — FULL WORLD CENSUS')
console.log('  seed:', SEED, ' generator: interval-expanse-v6 ', W + '\u00d7' + H)
console.log('  geographyHash:', g.geographyHash)
console.log('  valid:', valid ? 'YES' : ('NO — ' + valid), ' | deterministic:', det)
console.log('  total nodes:', Object.keys(w.nodes).length)
console.log('='.repeat(64))

// ---- 1. TILE CENSUS: classify every one of the 458,752 tiles ----
const tileKind = {}
let land = 0, sea = 0, river = 0
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  let k
  if (V6.isWater(g, x, y)) { k = V6.inSea(g, x, y) ? 'sea' : 'river'; if (k === 'sea') sea++; else river++ }
  else { k = V6.biomeAt(g, x, y); land++ }
  tileKind[k] = (tileKind[k] || 0) + 1
}
console.log('\nTILES (' + (W * H).toLocaleString() + ' total):')
console.log('  land:', land.toLocaleString(), '| sea:', sea.toLocaleString(), '| river:', river.toLocaleString())
console.log('  by biome/water:')
for (const [k, n] of Object.entries(tileKind).sort((a, b) => b[1] - a[1]))
  console.log('    ' + k.padEnd(14) + String(n).padStart(8) + '  (' + (100 * n / (W * H)).toFixed(1) + '%)')

// ---- 2. NODE CENSUS: every node by type ----
const byType = {}
for (const n of Object.values(w.nodes)) byType[n.type] = (byType[n.type] || 0) + 1
console.log('\nNODES by type:')
for (const [t, n] of Object.entries(byType).sort((a, b) => b[1] - a[1]))
  console.log('    ' + t.padEnd(16) + String(n).padStart(6))

// ---- 3. RESOURCE / GATHERING NODES: the economy, by kind ----
const GATHER = new Set(['tree', 'rock', 'fishing-spot', 'magic-rock',
  'oak-tree', 'ironbark-tree', 'heartwood-tree', 'gallows-oak',
  'iron-rock', 'coal-rock', 'gold-rock', 'mother-lode', 'brimstone-vent',
  'eel-spot', 'deep-fish-spot', 'gibbet-shoal'])
// a node's gather-kind is its `kind` if set, else its `type`
const gatherKind = (n) => (n.kind && GATHER.has(n.kind)) ? n.kind
  : (GATHER.has(n.type) ? n.type : null)

const gather = {}          // kind -> { count, biomes: {biome: n} }
for (const n of Object.values(w.nodes)) {
  const k = gatherKind(n)
  if (!k) continue
  const rec = gather[k] || (gather[k] = { count: 0, biomes: {} })
  rec.count++
  const b = V6.isWater(g, n.x, n.y) ? 'water' : V6.biomeAt(g, n.x, n.y)
  rec.biomes[b] = (rec.biomes[b] || 0) + 1
}
console.log('\nRESOURCE NODES (the gathering economy):')
const totalGather = Object.values(gather).reduce((a, r) => a + r.count, 0)
console.log('  ' + totalGather + ' gatherable nodes across ' + Object.keys(gather).length + ' kinds\n')
// group by skill
const SKILL_OF = {
  tree: 'woodcutting', 'oak-tree': 'woodcutting', 'ironbark-tree': 'woodcutting',
  'heartwood-tree': 'woodcutting', 'gallows-oak': 'woodcutting',
  rock: 'mining', 'iron-rock': 'mining', 'coal-rock': 'mining', 'gold-rock': 'mining',
  'magic-rock': 'mining', 'mother-lode': 'mining', 'brimstone-vent': 'mining',
  'fishing-spot': 'fishing', 'eel-spot': 'fishing', 'deep-fish-spot': 'fishing', 'gibbet-shoal': 'fishing',
}
for (const skill of ['woodcutting', 'mining', 'fishing']) {
  const kinds = Object.entries(gather).filter(([k]) => SKILL_OF[k] === skill).sort((a, b) => b[1].count - a[1].count)
  if (!kinds.length) continue
  const sub = kinds.reduce((a, [, r]) => a + r.count, 0)
  console.log('  ' + skill.toUpperCase() + ' (' + sub + '):')
  for (const [k, rec] of kinds) {
    const where = Object.entries(rec.biomes).sort((a, b) => b[1] - a[1]).map(([b, n]) => b + ':' + n).join(', ')
    console.log('    ' + k.padEnd(16) + String(rec.count).padStart(4) + '   [' + where + ']')
  }
}

// ---- 4. SPECIAL / SCARCE SEAMS: the doubled Wilds seams + gold ----
console.log('\nSCARCE & DOUBLED SEAMS (the risk-priced masters):')
for (const k of ['gallows-oak', 'mother-lode', 'gibbet-shoal', 'gold-rock', 'deep-fish-spot']) {
  const rec = gather[k]
  console.log('    ' + k.padEnd(16) + (rec ? rec.count + ' placed' : '0 — NOT PLACED'))
}

// ---- 5. FACILITIES: where you sell/bank/craft ----
console.log('\nFACILITIES & PEOPLE:')
for (const t of ['bank', 'store', 'stall', 'anvil', 'smith', 'crier', 'keeper', 'well', 'hearth', 'brewpot', 'signpost']) {
  if (byType[t]) console.log('    ' + t.padEnd(14) + byType[t])
}

// ---- 6. SETTLEMENTS ----
const ss = V6.settlementsOf(g)
console.log('\nSETTLEMENTS (' + ss.length + '):')
for (const s of ss) {
  const stalls = Object.values(w.nodes).filter(n => n.type === 'stall' && Math.abs(n.x - s.x) < (s.w >> 1) + 3 && Math.abs(n.y - s.y) < (s.h >> 1) + 3)
  console.log('    ' + (s.name || s.tag).padEnd(14) + '@' + (s.x + ',' + s.y).padEnd(9) + s.w + '\u00d7' + s.h
    + (stalls.length ? '  stalls: ' + stalls.map(n => n.kind).join(',') : ''))
}

console.log('\n' + '='.repeat(64))
console.log('CENSUS COMPLETE')
