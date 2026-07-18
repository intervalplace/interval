// The expanse (interval-expanse-v1) and the promise that any window can paint
// it. The mirror test is the important one: window-web.html re-implements the
// terrain in integer math so it can paint tiles synchronously, and a mirror
// nobody checks is a mirror that silently drifts until fishing spots float on
// dry land. This compares every tile of the founded world.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import E from '../engine.js'
import { buildWorld as buildClassic } from '../worldgen.mjs'
import * as X from '../worldgen-expanse.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const G = () => X.makeExpanseGenesis('expanse-test', 'ab'.repeat(32), 0, 640, 400)

test('the expanse founds a valid world', () => {
  const w = X.buildWorld(G())
  assert.equal(E.validateState(w), null)
  assert.equal(E.validateGenesis(G()), null)
})

test('two nodes grow the identical country', () => {
  assert.equal(E.stateHash(X.buildWorld(G())), E.stateHash(X.buildWorld(G())))
})

test('the founded world stays inside the measured performance envelope', () => {
  const w = X.buildWorld(G())
  const nodes = Object.keys(w.nodes).length, mobs = Object.keys(w.mobs).length
  // bench/PHASE2-REPORT.md measured 3,772 nodes / 331 mobs at 245 ms median
  // with 1,000 citizens. Growing past what was measured is not a founding.
  assert.ok(nodes <= 3772, `expanse has ${nodes} nodes, above the measured envelope of 3772`)
  assert.ok(mobs <= 331, `expanse has ${mobs} mobs, above the measured envelope of 331`)
  assert.ok(nodes > 2500, `expanse has only ${nodes} nodes — the country is too thin`)
})

test('every country is present and none swallows the map', () => {
  const g = G()
  const seen = {}
  for (let y = 1; y < g.worldH - 1; y += 3) for (let x = 1; x < g.worldW - 1; x += 3) {
    const b = X.biomeAt(g, x, y); seen[b] = (seen[b] ?? 0) + 1
  }
  const total = Object.values(seen).reduce((a, b) => a + b, 0)
  for (const b of ['wilds', 'greenwood', 'crags', 'fens', 'heartlands']) {
    const share = (seen[b] ?? 0) / total
    assert.ok(share > 0.08, `${b} is only ${(share * 100).toFixed(1)}% of the map`)
    assert.ok(share < 0.40, `${b} is ${(share * 100).toFixed(1)}% of the map — it has swallowed the world`)
  }
})

test('no node was founded on water', () => {
  const g = G(), w = X.buildWorld(g)
  for (const [id, n] of Object.entries(w.nodes)) {
    assert.ok(!X.isWater(g, n.x, n.y), `${id} (${n.type}) was founded in the water at ${n.x},${n.y}`)
  }
})

test('every fishing spot actually touches water', () => {
  const g = G(), w = X.buildWorld(g)
  for (const [id, n] of Object.entries(w.nodes)) {
    if (n.type !== 'fishing-spot') continue
    const wet = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => X.isWater(g, n.x + dx, n.y + dy))
    assert.ok(wet, `${id} sits on dry land at ${n.x},${n.y}`)
  }
})

test("window-web's terrain mirror matches the engine tile for tile", () => {
  const g = G()
  const html = fs.readFileSync(path.join(here, '..', 'window-web.html'), 'utf8')
  const start = html.indexOf('// ---- the expanse (interval-expanse-v1)')
  const end = html.indexOf('function tileHash(x, y, k)')
  assert.ok(start > 0 && end > start, 'the expanse mirror block is missing from window-web.html')
  const src = `let W=${g.worldW}, H=${g.worldH};\n`
    + html.slice(start, end).replace(
      "let GEN = 'interval-classic-v1', GSEED = ''",
      `let GEN='interval-expanse-v1', GSEED=${JSON.stringify(g.genesisSeed)}`)
    + '\n;({riverXE,isWaterE,biomeAtE,onRoadE})'
  const M = (0, eval)(src)
  let water = 0, biome = 0, road = 0, river = 0
  for (let y = 1; y < g.worldH - 1; y++) {
    if (M.riverXE(y) !== X.riverX(g, y)) river++
    for (let x = 1; x < g.worldW - 1; x++) {
      if (M.isWaterE(x, y) !== X.isWater(g, x, y)) water++
      const wb = X.biomeAt(g, x, y)
      if (M.biomeAtE(x, y) !== (wb === 'heartlands' ? 'meadow' : wb)) biome++
      if (M.onRoadE(x, y) !== X.onRoad(g, x, y)) road++
    }
  }
  assert.equal(river, 0, 'the window paints the river on different rows')
  assert.equal(water, 0, `${water} tiles of water disagree between engine and window`)
  assert.equal(biome, 0, `${biome} tiles of country disagree between engine and window`)
  assert.equal(road, 0, `${road} tiles of road disagree between engine and window`)
})

test('a genesis naming no geography still founds the classic world exactly', () => {
  // genesis.geo is optional (spec 9). Absent, the constitutional rectangles are
  // the ones the classic world was always founded with.
  const g = E.makeGenesis('x', 'ab'.repeat(32), 0, 320, 200)
  assert.equal(g.geo, undefined)
  const w = buildClassic(g)
  assert.equal(Object.keys(w.nodes).length, 1294)
  assert.equal(Object.keys(w.mobs).length, 90)
  assert.equal(E.validateState(w), null)
  assert.equal(E.inWilds(g, 6, 6), true)
  assert.equal(E.inWilds(g, 200, 150), false)
})

test('the expanse moves the Wilds and Anchor where the world can hold them', () => {
  const g = G()
  assert.equal(E.inWilds(g, 5, 200), true, 'the western marches should be Wilds')
  assert.equal(E.inWilds(g, 600, 200), false, 'the eastern crags should not be')
  const city = E.cityRectOf(g)
  assert.ok(city.y0 > 150 && city.y1 < 250, 'Anchor should stand in the middle of its world')
})
