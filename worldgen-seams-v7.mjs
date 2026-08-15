// THE SEAMS OF TALLYHOLM.
//
// Ninety-two gatherable nodes on an island of 458,752 tiles, and that ratio is
// the design rather than an oversight. A seam here is a SCHELLING POINT: a few
// remembered places a crowd converges on, so that "I am going to Cragfoot to
// mine" is a sentence with a destination in it. A wood with a tree on every
// third tile has no Greenhollow in it, and a citizen who can gather anywhere
// never goes anywhere.
//
// These were already placed that way. What changes here is that they are
// WRITTEN DOWN: six seeding routines that had to be re-derived to be
// understood are now a list somebody can read, move a line in, and re-found.
// The numbers are unchanged from the founding that produced them.
//
// A place's own seam is NOT in this table -- the coal at the High Delving and
// the heartwood at the King's Oak belong to those drawings and move with them.
export const SEAMS = [
  { type: 'brimstone-vent', x: 686, y: 261 },   // the Crags
  { type: 'brimstone-vent', x: 686, y: 263 },   // the Crags
  { type: 'brimstone-vent', x: 687, y: 262 },   // the Crags
  { type: 'brimstone-vent', x: 688, y: 261 },   // the Crags
  { type: 'coal-rock', x: 740, y: 246 },   // the Crags
  { type: 'coal-rock', x: 741, y: 247 },   // the Crags
  { type: 'coal-rock', x: 741, y: 249 },   // the Crags
  { type: 'coal-rock', x: 742, y: 248 },   // the Crags
  { type: 'coal-rock', x: 743, y: 247 },   // the Crags
  { type: 'coal-rock', x: 743, y: 249 },   // the Crags
  { type: 'deep-fish-spot', x: 173, y: 112 },   // the Sea
  { type: 'deep-fish-spot', x: 174, y: 112 },   // the Sea
  { type: 'deep-fish-spot', x: 175, y: 111 },   // the Sea
  { type: 'deep-fish-spot', x: 176, y: 110 },   // the Sea
  { type: 'eel-spot', x: 410, y: 436 },   // Eelmarsh
  { type: 'eel-spot', x: 411, y: 436 },   // Eelmarsh
  { type: 'eel-spot', x: 412, y: 436 },   // Eelmarsh
  { type: 'eel-spot', x: 413, y: 436 },   // Eelmarsh
  { type: 'eel-spot', x: 414, y: 436 },   // Eelmarsh
  // THE PORT'S FISH ARE OFF THE QUAY. Three of them stood on the shingle a
  // tile back from the water, which is what a fishing town looked like before
  // it had jetties. They are in the water beside the decking now: you walk out
  // on the North Quay or the Fish Quay and fish from the boards.
  //
  // IN THE WATER, BESIDE THE BOARDS. You do not stand on a fishing tile, you
  // stand next to it: the engine wants the node ADJACENT to the citizen, so
  // the spot is the water and the deck is where you put your feet. Six of
  // these were briefly moved onto the bank after four in the channel were
  // swept -- but the sweep was not telling me they were in the wrong element,
  // it was telling me the quays were floating (see QUAYS). Fixed at the quay,
  // the spots go back in the water where a fishing spot belongs.
  { type: 'fishing-spot', x: 666, y: 360 },   // off the North Quay
  { type: 'fishing-spot', x: 666, y: 362 },
  { type: 'fishing-spot', x: 665, y: 363 },
  { type: 'fishing-spot', x: 670, y: 363 },   // off the Fish Quay
  { type: 'fishing-spot', x: 671, y: 364 },
  // and Fenmarch's, in the fen: one bank, not three scattered marks
  { type: 'fishing-spot', x: 447, y: 434 },
  { type: 'fishing-spot', x: 449, y: 434 },
  { type: 'fishing-spot', x: 451, y: 435 },
  { type: 'gallows-oak', x: 160, y: 212 },   // the Wilds
  { type: 'gallows-oak', x: 160, y: 214 },   // the Wilds
  { type: 'gallows-oak', x: 161, y: 213 },   // the Wilds
  { type: 'gallows-oak', x: 162, y: 212 },   // the Wilds
  { type: 'gallows-oak', x: 162, y: 214 },   // the Wilds
  { type: 'gibbet-shoal', x: 40, y: 255 },   // the Sea
  { type: 'gibbet-shoal', x: 40, y: 256 },   // the Sea
  { type: 'gibbet-shoal', x: 41, y: 252 },   // the Sea
  { type: 'gibbet-shoal', x: 41, y: 253 },   // the Sea
  { type: 'gold-rock', x: 711, y: 110 },   // the Crags
  { type: 'gold-rock', x: 711, y: 112 },   // the Crags
  { type: 'gold-rock', x: 712, y: 111 },   // the Crags
  { type: 'gold-rock', x: 713, y: 110 },   // the Crags
  { type: 'heartwood-tree', x: 687, y: 94 },   // the Greenwood
  { type: 'heartwood-tree', x: 688, y: 95 },   // the Greenwood
  { type: 'heartwood-tree', x: 688, y: 97 },   // the Greenwood
  { type: 'heartwood-tree', x: 689, y: 96 },   // the Greenwood
  { type: 'heartwood-tree', x: 690, y: 95 },   // the Greenwood
  { type: 'heartwood-tree', x: 690, y: 97 },   // the Greenwood
  // THE IRON IS AT THE MINE. It sat seventy-seven tiles up the ridge from
  // Cragfoot -- a mining town with no ore at it, and the walk from the town to
  // the seam longer than the walk between two towns. A Schelling point is only
  // one if the name on the map and the thing you came for are in the same
  // place. Both faces of the town now, east and west, so a crowd has two.
  { type: 'iron-rock', x: 755, y: 229 },   // the west face
  { type: 'iron-rock', x: 755, y: 230 },
  { type: 'iron-rock', x: 755, y: 231 },
  { type: 'iron-rock', x: 755, y: 232 },
  { type: 'iron-rock', x: 789, y: 230 },   // the east face
  { type: 'iron-rock', x: 789, y: 231 },
  { type: 'iron-rock', x: 789, y: 232 },
  // AND TWO AT THE NEAR EDGE OF THE CRAGS, for the first hour.
  //
  // Measured from spawn: the nearest ore was 419 tiles, four minutes, and the
  // ladder had inverted -- brimstone (late) at 319 and the gallows oaks (the
  // Wilds) at 374 were both CLOSER than the beginner's iron. A newcomer's
  // opening move was a four-minute walk past two end-game seams to reach the
  // one they could actually work.
  //
  // The trade is bank distance, which is the number the choice is really made
  // on: Cragfoot's iron is SIX tiles from a vault, these are ninety. Come here
  // for a shorter walk out and a longer walk back, or go east and carry less
  // further. Both are legitimate for a whole career.
  { type: 'iron-rock', x: 620, y: 212 },   // the west face of the Crags
  { type: 'iron-rock', x: 620, y: 213 },
  { type: 'iron-rock', x: 621, y: 213 },
  { type: 'ironbark-tree', x: 591, y: 62 },   // the Kingswood
  { type: 'ironbark-tree', x: 592, y: 61 },   // the Kingswood
  { type: 'ironbark-tree', x: 592, y: 62 },   // the Kingswood
  { type: 'ironbark-tree', x: 593, y: 61 },   // the Kingswood
  { type: 'ironbark-tree', x: 594, y: 61 },   // the Kingswood
  { type: 'ironbark-tree', x: 594, y: 62 },   // the Kingswood
  { type: 'magic-rock', x: 132, y: 330 },   // the Wilds
  { type: 'magic-rock', x: 133, y: 331 },   // the Wilds
  { type: 'magic-rock', x: 133, y: 333 },   // the Wilds
  { type: 'magic-rock', x: 134, y: 330 },   // the Wilds
  { type: 'magic-rock', x: 134, y: 332 },   // the Wilds
  { type: 'magic-rock', x: 135, y: 190 },   // the Wilds
  { type: 'magic-rock', x: 135, y: 331 },   // the Wilds
  { type: 'magic-rock', x: 135, y: 333 },   // the Wilds
  { type: 'magic-rock', x: 136, y: 191 },   // the Wilds
  { type: 'magic-rock', x: 136, y: 193 },   // the Wilds
  { type: 'magic-rock', x: 137, y: 190 },   // the Wilds
  { type: 'magic-rock', x: 137, y: 192 },   // the Wilds
  { type: 'magic-rock', x: 138, y: 191 },   // the Wilds
  { type: 'magic-rock', x: 138, y: 193 },   // the Wilds
  { type: 'mother-lode', x: 166, y: 249 },   // the Wilds
  { type: 'mother-lode', x: 166, y: 251 },   // the Wilds
  { type: 'mother-lode', x: 167, y: 250 },   // the Wilds
  { type: 'mother-lode', x: 168, y: 249 },   // the Wilds
  { type: 'mother-lode', x: 168, y: 251 },   // the Wilds
  { type: 'oak-tree', x: 346, y: 27 },   // the Greenwood
  { type: 'oak-tree', x: 347, y: 28 },   // the Greenwood
  { type: 'oak-tree', x: 347, y: 30 },   // the Greenwood
  { type: 'oak-tree', x: 348, y: 29 },   // the Greenwood
  { type: 'oak-tree', x: 349, y: 28 },   // the Greenwood
  { type: 'oak-tree', x: 349, y: 30 },   // the Greenwood
  // AND THE TIMBER IS AT THE TIMBER TOWN. Same fault: the seven starter trees
  // stood seventy-three tiles west of Greenhollow, in the deep wood, so the
  // town whose whole reason to exist is chopping had nothing to chop. North
  // side and south side, either end of the clearing.
  { type: 'tree', x: 371, y: 47 },   // the north edge of the clearing
  { type: 'tree', x: 364, y: 74 },
  { type: 'tree', x: 377, y: 47 },
  { type: 'tree', x: 380, y: 47 },
  { type: 'tree', x: 366, y: 74 },   // and the south holt
  { type: 'tree', x: 362, y: 74 },
  // AND A COPSE IN THE HEARTLANDS, east of Hollybarrow. Same reasoning as the
  // near-edge iron, and the same trade made deliberately the other way:
  // Greenhollow's trees are THIRTEEN tiles from its bank, this copse is
  // fifty-five from any. It halves the walk from spawn and doubles the walk
  // home, so the timber town keeps its reason to exist -- which it would not
  // if a copse this close were also convenient.
  { type: 'tree', x: 396, y: 197 },
  { type: 'tree', x: 396, y: 198 },
  { type: 'tree', x: 368, y: 74 },
]
