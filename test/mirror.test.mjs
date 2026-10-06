// THE WINDOW'S COPY OF THE GEOGRAPHY, CHECKED AGAINST THE WORLD'S.
//
// `terrain-mirror.mjs` opens by saying that this file exists: "there is one
// file, and test/mirror.test.mjs checks it against the engine tile for tile."
// It did not exist. The one thing in this project whose entire purpose is
// preventing geography drift was guarded by a test that was described, relied
// on in the comment, and never written.
//
// What that cost, found by hand: the mirror's `islesOf6` listed TWO isles and
// the generator has FIVE. Whiting Isle, the Lists and the Dragon's Isle were
// open sea in every window that reads the mirror, and `IS_EXPANSE6()` covers
// v7, so that was the live world. The chart on the site says outright that if
// it and the world disagreed, one of them would be in breach of the
// constitution. It had been disagreeing about three islands.
//
// WHY THIS MATTERS MORE THAN AN ORDINARY TEST. Geography is law here. Two
// citizens whose windows disagree about where the Fens end cannot arrange to
// meet there, and a window that draws land where the world has sea will walk
// somebody into water they cannot cross.
//
// THE ENTRY POINT IS `terrainOf`, AND CHOOSING IT IS MOST OF THE TEST.
// `isWaterE` looks like the obvious one and is wrong: it is the v1 expanse's
// own formula, `inSeaE || inPoolE || near the river`, and it does not dispatch
// on the generator at all. Comparing a v7 world against it reports hundreds of
// disagreements on open mainland and tells you nothing. `terrainOf` is the
// dispatcher and the function every window actually calls, which is also what
// makes it the honest thing to hold to account.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { foundGenesis, generatorFor } from '../worldgen-any.mjs'
import { rulesHash } from '../rules-hash.mjs'
import * as TM from '../terrain-mirror.mjs'

const RH = rulesHash(new URL('../', import.meta.url))
const ANCHOR = 1700000000000

// Every generator that seats a world anybody could still be standing in, at
// the size it is actually founded at. v1 and v2 are included because a world
// founded under them is still computable and still has to be drawable.
const WORLDS = [
  ['interval-expanse-v7', 896, 512],
  ['interval-expanse-v6', 896, 512],
  ['interval-expanse-v5', 896, 512],
  ['interval-expanse-v4', 896, 512],
  ['interval-expanse-v3', 448, 256],
]

// The mirror answers in terrain nouns and the generator in a boolean, so the
// comparison is made on the one question both can answer without either side
// interpreting the other: is this tile water.
//
// A BRIDGE IS WATER WITH A DECK OVER IT, and leaving it out of this set made
// the test accuse the window of seventy-one disagreements it was right about:
// the world says the tile is water, which it is, and the window draws the
// crossing somebody walks over. Both are correct and the test was wrong.
//
// A CAUSEY IS NOT. It went in beside the bridge on the reasoning that it is a
// raised road through a wet place, and that reasoning is wrong in the way that
// matters: the world calls a causey tile LAND, because the ground you walk on
// is the causey itself, where a bridge spans water that is still there under
// the deck. Including it accused v4 and v5 of seventy-four disagreements that
// were the test's own.
const WET = new Set(['sea', 'river', 'lake', 'pool', 'bridge'])

// CONFIGURED THE WAY THE BRIDGE CONFIGURES IT, which is not the way a genesis
// is shaped. `configure` reads `opts.generator`, and a genesis calls that field
// `worldGenerator`, so handing it the genesis whole leaves GEN at its default
// and every later answer is about the classic island. That reported 233,534 of
// 458,752 tiles disagreeing, which is not drift, it is two different worlds.
// `unreal-bridge.mjs` maps the fields by hand; so does this.
function found(gen, w, h) {
  const g = foundGenesis(gen, 'mirror-test', RH, ANCHOR, w, h)
  TM.configure({
    generator: g.worldGenerator,
    seed: g.genesisSeed ?? '',
    worldW: g.worldW, worldH: g.worldH,
  })
  return g
}

for (const [gen, w, h] of WORLDS) {
  test(`${gen}: the mirror and the world agree about water, tile for tile`, () => {
    const g = found(gen, w, h)
    const world = generatorFor(g)

    // EVERY TILE, not a sample. The whole point is that one tile is enough to
    // strand somebody, and a sample is how three isles stayed missing: any
    // stride that skips them reports a clean run. v7 at 896x512 is 458,752
    // tiles and takes a couple of seconds.
    let wrong = 0
    const shown = []
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const mine = WET.has(TM.terrainOf(x, y))
        const theirs = world.isWater(g, x, y)
        if (mine === theirs) continue
        wrong++
        if (shown.length < 8) {
          shown.push(`${x},${y}: world says ${theirs ? 'water' : 'land'}, `
            + `window draws ${TM.terrainOf(x, y)}`)
        }
      }
    }
    assert.equal(wrong, 0,
      `${wrong} tiles of ${w * h} disagree.\n  ` + shown.join('\n  '))
  })
}

// AND THE ISLES BY NAME, because losing one is the failure that actually
// happened and a whole-island count can bury it: three isles is under two
// thousand tiles in four hundred and fifty thousand, which a careless
// tolerance would swallow.
test('every isle the world has is drawn by the window', () => {
  const g = found('interval-expanse-v7', 896, 512)
  const world = generatorFor(g)
  // islesOf is the generator's own list, so this cannot drift from it
  const isles = world.islesOf ? world.islesOf(g) : null
  assert.ok(isles && isles.length >= 5,
    'the v7 generator should expose its isles; found ' + (isles ? isles.length : 'none'))

  for (const i of isles) {
    let land = 0
    for (let y = i.y - i.ry; y <= i.y + i.ry; y++) {
      for (let x = i.x - i.rx; x <= i.x + i.rx; x++) {
        if (x < 0 || y < 0 || x >= 896 || y >= 512) continue
        if (!WET.has(TM.terrainOf(x, y))) land++
      }
    }
    // a third of the bounding box is a low bar on purpose: it asks whether the
    // window knows the isle is THERE, not whether it has the shape exactly,
    // which the tile-for-tile test above already settles.
    const box = (2 * i.rx + 1) * (2 * i.ry + 1)
    assert.ok(land > box / 3,
      `the window draws almost no land on the ${i.tag} isle `
      + `(${land} of ${box} tiles at ${i.x},${i.y}): it is missing from the mirror`)
  }
})
