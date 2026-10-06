// §7dq: THE SMOTHER HAS TO REPORT ITSELF AS A CAVE, ALL THE WAY OUT.
//
// The place is written around the dark. Its own note in the generator says the
// mouth needs no marker "because the dark either side of it is the marker", and
// the window darkens on one thing: the ground's name coming back as `cave`.
//
// That is a chain of four, and every link was broken until now. `floors: false`
// was the only thing a place could say about its ground and it means "let the
// country show through", so every tile in the Smother answered `crags` --
// exactly like the fellside outside the mouth. The bridge forwarded that
// faithfully. The window drew a hillside. Nobody could tell it was a cave, and
// the one creature in there that steel does nothing to was standing in
// daylight.
//
// So this holds the chain rather than the fix: the place names a ground, the
// generator returns it, it is the name the window already knows, and the mouth
// is part of it. A later redraw of the Smother that loses any of those puts the
// dark out again, silently, and the only symptom is that a cave looks like a
// hill.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as WG from '../worldgen-any.mjs'
import * as W7 from '../worldgen-expanse7.mjs'
import { PLACES_V7 } from '../worldgen-places-v7.mjs'
import { readFileSync } from 'node:fs'

const g = WG.foundGenesis('interval-expanse-v7', 'cave-test', 'a'.repeat(64),
  1789813895202, 896, 512)
const G = WG.generatorFor(g)

test('the Smother says what its ground is', () => {
  assert.equal(PLACES_V7.smother?.ground, 'cave',
    'the place names the surface; `floors` only says whether a room was BUILT')
})

test('the generator returns it, and the mouth is inside it', () => {
  const door = W7.smotherDoorOf(g)
  assert.ok(door, 'the Smother has a mouth, found from the drawing')
  assert.equal(G.groundKindAt(g, door.x, door.y), 'cave',
    'the tile a citizen steps through is cave, so the window is already dark '
    + 'by the time they are inside')
  assert.equal(W7.placeGroundAt(g, door.x, door.y), 'cave')
})

test('it is a chamber and not a handful of tiles', () => {
  let cave = 0
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 896; x++) if (G.groundKindAt(g, x, y) === 'cave') cave++
  }
  // a hundred and fifty-two on the founded island. The bar is loose on purpose:
  // the drawing may change and a cave is still a cave. What this catches is the
  // ground going back to `crags`, which is nought.
  assert.ok(cave > 60, `expected a cave; found ${cave} tiles of it`)
})

test('`cave` is a name the window already draws', () => {
  // The bridge sends a tile CODE, and the codes are seeded in order so every
  // window agrees on them. `cave` has been in that list, and in the ground
  // shader's palette, since both were written -- unused, because nothing ever
  // returned it. A rename here would mint a fresh code at whatever moment a
  // chunk first asked, which is the reproducibility fault the list exists to
  // prevent.
  const bridge = readFileSync(new URL('../unreal-bridge.mjs', import.meta.url), 'utf8')
  const list = bridge.slice(bridge.indexOf('const TILE_NAMES = ['))
  assert.match(list.slice(0, list.indexOf(']')), /'cave'/,
    "the bridge's seeded tile list must carry `cave`")
})

test('the country outside the mouth is NOT cave', () => {
  const door = W7.smotherDoorOf(g)
  // one tile below the mouth is the fellside a citizen walks up to it from
  const out = G.groundKindAt(g, door.x, door.y + 2)
  assert.notEqual(out, 'cave',
    'if the hill outside were cave too, the dark would start before the mouth '
    + 'and the mouth would stop meaning anything')
})

