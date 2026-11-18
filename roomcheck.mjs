#!/usr/bin/env node
// roomcheck.mjs: which drawn rooms are missing from PLAN_ROOMS.
//
// §7bd fixed this once and the fix was incomplete. That table has two readers:
// the stall seater wants "rooms a stall may stand in", and `isIndoor` wants "is
// this tile inside a building", and isIndoor is what the paving consults. A
// room left off the table is a room the world believes is outdoors: its floor
// is flagged as street, no roof is laid over it, and whatever the drawing put
// inside it -- a hearth, a bed, somebody's whole living -- stands in a walled
// box open to the sky.
//
// The tool that found them the first time (roomfind.mjs) was never committed
// and is gone, and it had left SLIVERS behind: Norwick declared [28,6,2,1] for
// a room that is [28,4,2,4], so three quarters of that room was outdoors and
// one quarter had a roof. This looks for the whole room.
//
// A room here is the maximal wall-bounded rectangle around an indoor thing,
// kept only if at least 70% of the ring around it is wall. That last test is
// what keeps a street out: a twenty-tile-wide strip of floor with a barrel on
// it is not a room, and Oxenford has one.
//
//   node roomcheck.mjs
import { PLANS5_V6, PLAN_ROOMS } from './worldgen-shire-v6.mjs'
import { VILLAGE_PLANS, VILLAGE_ROOMS } from './worldgen-villages-v7.mjs'
import { PLACES_V7 } from './worldgen-places-v7.mjs'
import { floorTilesOfDrawing } from './worldgen-expanse7.mjs'

const PLANS = { ...PLANS5_V6, ...VILLAGE_PLANS }
const ROOMS = { ...PLAN_ROOMS, ...VILLAGE_ROOMS }
// what only makes sense under a roof
const INDOOR = new Set(['h', 'd', 'e', 'v', 'q', 'k'])
const WALLED = 0.70

export function missingRooms (tag) {
  const rows = PLANS[tag]
  if (!rows) return []
  const rects = ROOMS[tag] || []
  const at = (c, r) => (rows[r] || '')[c] ?? ' '
  const declared = (c, r) => rects.some(([x, y, w, h]) =>
    c >= x && r >= y && c < x + w && r < y + h)
  const seen = new Set(), found = []
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      if (!INDOOR.has(at(c, r)) || declared(c, r) || seen.has(c + ',' + r)) continue
      let x0 = c; while (at(x0 - 1, r) !== '#' && at(x0 - 1, r) !== ' ') x0--
      let x1 = c; while (at(x1 + 1, r) !== '#' && at(x1 + 1, r) !== ' ') x1++
      const spanOk = (rr) => {
        for (let x = x0; x <= x1; x++) { const g = at(x, rr); if (g === '#' || g === ' ') return false }
        return true
      }
      let y0 = r; while (spanOk(y0 - 1)) y0--
      let y1 = r; while (spanOk(y1 + 1)) y1++
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) seen.add(x + ',' + y)
      let ring = 0, wall = 0
      for (let x = x0 - 1; x <= x1 + 1; x++) for (const y of [y0 - 1, y1 + 1]) { ring++; if (at(x, y) === '#') wall++ }
      for (let y = y0; y <= y1; y++) for (const x of [x0 - 1, x1 + 1]) { ring++; if (at(x, y) === '#') wall++ }
      if (wall / ring >= WALLED) found.push([x0, y0, x1 - x0 + 1, y1 - y0 + 1])
    }
  }
  return found
}

// §7bd-ii: AND THE SIXTY PLACES THAT ARE NOT TOWNS.
//
// Everything above asks the question of a DRAWN SETTLEMENT, which is eleven
// towns and five villages, and answers "every drawn room is declared". It was
// telling the truth about a sixth of the buildings on this island.
//
// A place carries its own drawing and its own floors, so it declares a room a
// different way: the floor is the comma in the drawing, registered as a lone
// room, and a `floors: false` place has none at all. So a hearth drawn inside
// four walls on a place whose floor is open ground is a fire in a walled box
// open to the sky, and that is the same fault this file was written for, in
// the half of the world it never looked at.
//
// The rule is the one above, unchanged: the maximal wall-bounded rectangle
// around an indoor thing, kept if seven tenths of its ring is wall. What is
// asked of it is different -- not "is it in a list" but "is its floor drawn".
const PLACE_WALL = new Set(['#', '%'])
export function rooflessPlaces (tag) {
  const P = PLACES_V7[tag]
  if (!P || !P.rows) return []
  const rows = P.rows
  const at = (c, r) => (rows[r] || '')[c] ?? ' '
  const seen = new Set(), found = []
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      if (!INDOOR.has(at(c, r)) || seen.has(c + ',' + r)) continue
      const open = (g) => !PLACE_WALL.has(g) && g !== ' '
      let x0 = c; while (open(at(x0 - 1, r))) x0--
      let x1 = c; while (open(at(x1 + 1, r))) x1++
      const spanOk = (rr) => {
        for (let x = x0; x <= x1; x++) if (!open(at(x, rr))) return false
        return true
      }
      let y0 = r; while (spanOk(y0 - 1)) y0--
      let y1 = r; while (spanOk(y1 + 1)) y1++
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) seen.add(x + ',' + y)
      let ring = 0, wall = 0
      for (let x = x0 - 1; x <= x1 + 1; x++) for (const y of [y0 - 1, y1 + 1]) {
        ring++; if (PLACE_WALL.has(at(x, y))) wall++ }
      for (let y = y0; y <= y1; y++) for (const x of [x0 - 1, x1 + 1]) {
        ring++; if (PLACE_WALL.has(at(x, y))) wall++ }
      if (wall / ring < WALLED) continue
      // it IS a room. Does the GENERATOR give every tile of it a floor?
      //
      // Asked of the generator's own answer and not of the characters. The
      // first cut of this read the drawing and called every fitting bare,
      // because a hearth replaces the floor character it stands on: it
      // reported ten roofless rooms of which seven were simply furnished. The
      // thing to ask is what the world lays, which is floorTilesOfDrawing.
      const laid = new Set(floorTilesOfDrawing(rows).map(([x, y]) => x + ',' + y))
      const bare = []
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        if (!laid.has(x + ',' + y)) bare.push(at(x, y) + ' at ' + x + ',' + y)
      }
      if (bare.length) {
        found.push({ rect: [x0, y0, x1 - x0 + 1, y1 - y0 + 1],
          floors: P.floors === true, bare: bare.length, why: bare.slice(0, 4) })
      }
    }
  }
  return found
}

// Printed only when this file is the one being RUN, so a test can import
// `missingRooms` and ask the same question in silence. Comparing basenames
// rather than the whole URL, because `node roomcheck.mjs` puts a relative
// path in argv and the strict form never matches.
if ((process.argv[1] ?? '').split('/').pop() === 'roomcheck.mjs') {
  let total = 0
  console.log('--- the drawn settlements: rooms missing from PLAN_ROOMS ---')
  for (const tag of Object.keys(PLANS)) {
    const miss = missingRooms(tag)
    if (!miss.length) continue
    total += miss.length
    console.log(tag.padEnd(15) + JSON.stringify(miss))
  }
  console.log(total === 0 ? '  (none)' : '')
  let open = 0
  console.log('--- the places: rooms whose floor is not drawn ---')
  for (const tag of Object.keys(PLACES_V7)) {
    const bad = rooflessPlaces(tag)
    if (!bad.length) continue
    open += bad.length
    for (const b of bad) {
      console.log('  ' + tag.padEnd(16) + JSON.stringify(b.rect).padEnd(16)
        + (b.floors ? 'lays floors' : 'floors: false').padEnd(14)
        + (b.bare ? b.bare + ' tile(s) not boards: ' + b.why.join(', ') : 'none drawn'))
    }
  }
  console.log(open === 0 ? '  (none)' : '')
  console.log('')
  console.log(total + open === 0
    ? 'every drawn room is declared; nothing stands outdoors that should not'
    : (total + open) + ' room(s) stand open to the sky')
  process.exit(total + open === 0 ? 0 : 1)
}
