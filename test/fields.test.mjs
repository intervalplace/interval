// A FIELD IS DRAWN BY HAND, SO IT CAN BE DRAWN IN THE WRONG PLACE.
//
// The furlongs round every town come out of `worldgen-fields-v7.mjs` as
// pictures: rows of characters, offset from the town's centre. That is the
// right way to draw a field -- strips, a headland, a hedge and a gate -- and
// it has one failure mode a placer does not have, which is that a picture can
// be put somewhere the ground will not take it. Tiles that fall on water, on
// a road or inside a town are simply not ploughed, so the field comes out
// with holes in it or barely comes out at all.
//
// WHAT THIS WAS WRITTEN AFTER. Millbrook's close laid FIVE of its thirty
// tiles, every founding, because it was drawn at +22,+14 and Millbrook's rect
// is 52 by 36 -- the close was inside the town's own market square. The
// generator warned about that one. It did NOT warn about Millbrook's largest
// field, which laid 25 of 67: the warning fires under 35% and that is 37%, so
// the biggest broken field on the island sat two points under the bar for as
// long as the island has existed. It was reported from the window instead,
// as "the crop fields look weird and unfinished, like just a couple of plots".
//
// So the bar moves out of the founding and into a test, where it can be a
// real bar rather than a last-ditch complaint. A field is still ALLOWED to go
// ragged -- that is the point of laying it tile by tile, and a furlong that
// meets a stream should lose the tiles in the stream -- so this asks only
// that most of a field survives.
//
// IT NEEDS NO WORLD BUILT. `settlementsOf`, `rectOf`, `isWater` and `onRoad`
// are all pure functions of the genesis, and a whole world is two minutes.
// This is milliseconds, which is why it can run on every commit.
import { test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { settlementsOf, rectOf, isWater, roadTilesOf } from '../worldgen-expanse7.mjs'
import { FIELDS_V7 } from '../worldgen-fields-v7.mjs'

const root = path.dirname(fileURLToPath(import.meta.url)).replace(/\/test$/, '')
const genesis = JSON.parse(
  fs.readFileSync(path.join(root, 'checkpoints', 'world.json'), 'utf8')).genesis

// THE ROADS ONCE, NOT ONCE PER TILE. `onRoad` is `roadTilesOf(g).has(...)`,
// and `roadTilesOf` walks every road on the island to build that set. Asked
// per tile across every field on the island it is most of this file's run
// time; asked once it is none of it.
const roads = roadTilesOf(genesis)
const onRoad = (g, x, y) => roads.has(x + ',' + y)

// A tile that is not ploughed for one of the three reasons a DRAWING can be
// wrong about. Scrub and stray props are cleared by the plough and anything
// standing is counted by the founding itself, so they are not asked about
// here: this is about the picture being in the wrong place, nothing else.
function laid(s, blk, inTown) {
  let want = 0, ok = 0
  for (let ry = 0; ry < blk.rows.length; ry++) {
    for (let rx = 0; rx < blk.rows[ry].length; rx++) {
      const ch = blk.rows[ry][rx]
      if (ch === '~' || ch === ' ' || ch === '.' || ch === 'g') continue
      want++
      const x = s.x + blk.dx + rx, y = s.y + blk.dy + ry
      if (!inTown(x, y) && !isWater(genesis, x, y) && !onRoad(genesis, x, y)) ok++
    }
  }
  return { want, ok }
}

// Three quarters. A field that loses a quarter of itself to a stream bend is
// a field; one that loses half is a drawing in the wrong place.
const ENOUGH = 0.75

test('every hand-drawn field block lies on ground that will take it', () => {
  const ss = settlementsOf(genesis)
  const rects = ss.map(rectOf)
  const inTown = (x, y) => rects.some(r =>
    x >= r.x0 - 2 && x <= r.x1 + 2 && y >= r.y0 - 2 && y <= r.y1 + 2)
  const bad = []
  for (const s of ss) {
    for (const blk of (FIELDS_V7[s.tag] || [])) {
      const { want, ok } = laid(s, blk, inTown)
      if (!want) continue
      if (ok / want < ENOUGH) {
        bad.push(`${s.tag} +${blk.dx},${blk.dy}: ${ok} of ${want}`
          + ` (${Math.round(100 * ok / want)}%)`)
      }
    }
  }
  assert.deepEqual(bad, [], 'field blocks drawn where the ground refuses them:\n  '
    + bad.join('\n  '))
})

test('no field block is drawn inside its own town', () => {
  const ss = settlementsOf(genesis)
  const rects = ss.map(rectOf)
  const inTown = (x, y) => rects.some(r =>
    x >= r.x0 - 2 && x <= r.x1 + 2 && y >= r.y0 - 2 && y <= r.y1 + 2)
  // A tile or two of overlap at a corner is a hedge meeting a wall. A third
  // of a furlong is the drawing being in the wrong place.
  const bad = []
  for (const s of ss) {
    for (const blk of (FIELDS_V7[s.tag] || [])) {
      let want = 0, town = 0
      for (let ry = 0; ry < blk.rows.length; ry++) {
        for (let rx = 0; rx < blk.rows[ry].length; rx++) {
          const ch = blk.rows[ry][rx]
          if (ch === '~' || ch === ' ' || ch === '.' || ch === 'g') continue
          want++
          if (inTown(s.x + blk.dx + rx, s.y + blk.dy + ry)) town++
        }
      }
      if (want && town / want > 0.2) {
        bad.push(`${s.tag} +${blk.dx},${blk.dy}: ${town} of ${want} tiles inside a town`)
      }
    }
  }
  assert.deepEqual(bad, [], 'field blocks overlapping a town:\n  ' + bad.join('\n  '))
})
