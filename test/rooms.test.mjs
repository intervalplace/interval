// EVERY DRAWN ROOM IS A DECLARED ROOM.
//
// PLAN_ROOMS has two readers. The stall seater wants "rooms a rostered stall
// may stand in"; `isIndoor` wants "is this tile inside a building", and the
// paving consults isIndoor. So a room left off the table is a room the world
// believes is outdoors: its floor is flagged as street, no roof is laid, and
// whatever the drawing put in it stands in a walled box open to the sky.
//
// This has now gone wrong twice. §7bd fixed it once and the fix was partial:
// the tool that found the rooms left SLIVERS, so Norwick declared [28,6,2,1]
// for a room that is [28,4,2,4] and three quarters of it stayed outdoors.
// Thirty-one rooms across nine towns were in that state, with fifteen hearths,
// twenty-seven keepers and a bed standing out in the weather, and a settlement
// sweep kept reading them as half-built buildings.
//
// A fix that has come back once comes back twice, so it is a test now rather
// than a note. The three it still allows are open-sided on purpose: a shop
// front onto Oxenford's market, and two village shelters with one wall out.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { missingRooms } from '../roomcheck.mjs'
import { PLANS5_V6 } from '../worldgen-shire-v6.mjs'
import { VILLAGE_PLANS } from '../worldgen-villages-v7.mjs'

test('no drawn room is missing from PLAN_ROOMS', () => {
  const guilty = []
  for (const tag of Object.keys({ ...PLANS5_V6, ...VILLAGE_PLANS })) {
    const miss = missingRooms(tag)
    if (miss.length) guilty.push(tag + ' ' + JSON.stringify(miss))
  }
  assert.deepEqual(guilty, [],
    'these rooms are drawn but not declared, so they get no floor and no '
    + 'roof and whatever stands in them stands outdoors: ' + guilty.join('; '))
})
