// Composition and budget report for interval-expanse-v1, measured against the
// Phase 2 envelope (bench/PHASE2-REPORT.md): 3,772 nodes / 331 mobs held
// 245 ms median at 1,000 citizens.
import E from '../engine.js'
import { makeExpanseGenesis, buildWorld, biomeAt } from '../worldgen-expanse.mjs'
const G = makeExpanseGenesis(process.argv[2] ?? 'expanse-1', 'ab'.repeat(32), 0, 640, 400)
const t0 = Date.now(); const w = buildWorld(G); const ms = Date.now() - t0
const t = {}; for (const n of Object.values(w.nodes)) t[n.type] = (t[n.type] ?? 0) + 1
const m = {}; for (const q of Object.values(w.mobs)) m[q.type] = (m[q.type] ?? 0) + 1
const bio = {}; for (let y = 1; y < G.worldH - 1; y += 2) for (let x = 1; x < G.worldW - 1; x += 2) { const b = biomeAt(G, x, y); bio[b] = (bio[b] ?? 0) + 1 }
const tot = Object.values(bio).reduce((a, b) => a + b, 0)
console.log(`interval-expanse-v1 — ${G.worldW}x${G.worldH}, built in ${ms} ms`)
console.log(`nodes ${Object.keys(w.nodes).length} / envelope 3772   mobs ${Object.keys(w.mobs).length} / envelope 331`)
console.log('\nnodes by type:'); for (const [k, v] of Object.entries(t).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(14)} ${v}`)
console.log('\nmobs by type:'); for (const [k, v] of Object.entries(m).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(18)} ${v}`)
console.log('\nland by country:'); for (const [k, v] of Object.entries(bio).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(12)} ${(100 * v / tot).toFixed(1)}%`)
console.log('\nvalidateState:', E.validateState(w) === null ? 'VALID' : E.validateState(w))
console.log('worldId:', E.worldId(G).slice(0, 16))
