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
// §7aa: ONE SCHELLING POINT PER TIER.
//
// The seams were made few and findable on purpose -- 94 nodes where the old
// scatter had 653 -- and the reason was that scarcity only makes a MEETING
// PLACE if there is one place. Three tiers had drifted into two and three
// clusters apiece: iron in three, magic-rock in two, the plain tree in three.
// That is not scarcity, it is the same scarcity divided, and it buys nothing.
//
// Nineteen nodes moved into their tier's main cluster. The plain tree keeps
// its Hollybarrow pair, which is not drift: a starter tier beside the first
// town a newcomer reaches is a second point somebody chose.
export const SEAMS = [
  { type: 'brimstone-vent', x: 686, y: 261 },
  { type: 'brimstone-vent', x: 686, y: 263 },
  { type: 'brimstone-vent', x: 687, y: 262 },
  { type: 'brimstone-vent', x: 688, y: 261 },
  { type: 'coal-rock', x: 740, y: 246 },
  { type: 'coal-rock', x: 741, y: 247 },
  { type: 'coal-rock', x: 741, y: 249 },
  { type: 'coal-rock', x: 742, y: 248 },
  { type: 'coal-rock', x: 743, y: 247 },
  { type: 'coal-rock', x: 743, y: 249 },
  { type: 'eel-spot', x: 410, y: 436 },
  { type: 'eel-spot', x: 411, y: 436 },
  { type: 'eel-spot', x: 412, y: 436 },
  { type: 'eel-spot', x: 413, y: 436 },
  { type: 'eel-spot', x: 414, y: 436 },
  { type: 'fishing-spot', x: 666, y: 360 },
  { type: 'fishing-spot', x: 666, y: 362 },
  { type: 'fishing-spot', x: 665, y: 363 },
  { type: 'fishing-spot', x: 670, y: 363 },
  { type: 'fishing-spot', x: 671, y: 364 },
  { type: 'fishing-spot', x: 665, y: 365 },
  { type: 'fishing-spot', x: 672, y: 358 },
  { type: 'fishing-spot', x: 671, y: 358 },
  { type: 'gallows-oak', x: 160, y: 212 },
  { type: 'gallows-oak', x: 160, y: 214 },
  { type: 'gallows-oak', x: 161, y: 213 },
  { type: 'gallows-oak', x: 162, y: 212 },
  { type: 'gallows-oak', x: 162, y: 214 },
  { type: 'gibbet-shoal', x: 40, y: 255 },
  { type: 'gibbet-shoal', x: 40, y: 256 },
  { type: 'gibbet-shoal', x: 41, y: 252 },
  { type: 'gibbet-shoal', x: 41, y: 253 },
  { type: 'gold-rock', x: 711, y: 110 },
  { type: 'gold-rock', x: 711, y: 112 },
  { type: 'gold-rock', x: 712, y: 111 },
  { type: 'gold-rock', x: 713, y: 110 },
  { type: 'heartwood-tree', x: 687, y: 94 },
  { type: 'heartwood-tree', x: 688, y: 95 },
  { type: 'heartwood-tree', x: 688, y: 97 },
  { type: 'heartwood-tree', x: 689, y: 96 },
  { type: 'heartwood-tree', x: 690, y: 95 },
  { type: 'heartwood-tree', x: 690, y: 97 },
  { type: 'iron-rock', x: 755, y: 229 },
  { type: 'iron-rock', x: 755, y: 230 },
  { type: 'iron-rock', x: 755, y: 231 },
  { type: 'iron-rock', x: 755, y: 232 },
  { type: 'iron-rock', x: 756, y: 230 },
  { type: 'iron-rock', x: 754, y: 230 },
  { type: 'iron-rock', x: 756, y: 231 },
  { type: 'iron-rock', x: 754, y: 231 },
  { type: 'iron-rock', x: 756, y: 232 },
  { type: 'iron-rock', x: 754, y: 232 },
  { type: 'ironbark-tree', x: 591, y: 62 },
  { type: 'ironbark-tree', x: 592, y: 61 },
  { type: 'ironbark-tree', x: 592, y: 62 },
  { type: 'ironbark-tree', x: 593, y: 61 },
  { type: 'ironbark-tree', x: 594, y: 61 },
  { type: 'ironbark-tree', x: 594, y: 62 },
  { type: 'magic-rock', x: 132, y: 330 },
  { type: 'magic-rock', x: 133, y: 331 },
  { type: 'magic-rock', x: 133, y: 333 },
  { type: 'magic-rock', x: 134, y: 330 },
  { type: 'magic-rock', x: 134, y: 332 },
  { type: 'magic-rock', x: 135, y: 331 },
  { type: 'magic-rock', x: 135, y: 333 },
  { type: 'magic-rock', x: 135, y: 330 },
  { type: 'magic-rock', x: 133, y: 330 },
  { type: 'magic-rock', x: 135, y: 332 },
  { type: 'magic-rock', x: 133, y: 332 },
  { type: 'magic-rock', x: 136, y: 329 },
  { type: 'magic-rock', x: 135, y: 329 },
  { type: 'magic-rock', x: 134, y: 329 },
  { type: 'mother-lode', x: 166, y: 249 },
  { type: 'mother-lode', x: 166, y: 251 },
  { type: 'mother-lode', x: 167, y: 250 },
  { type: 'mother-lode', x: 168, y: 249 },
  { type: 'mother-lode', x: 168, y: 251 },
  { type: 'oak-tree', x: 346, y: 27 },
  { type: 'oak-tree', x: 347, y: 28 },
  { type: 'oak-tree', x: 347, y: 30 },
  { type: 'oak-tree', x: 348, y: 29 },
  { type: 'oak-tree', x: 349, y: 28 },
  { type: 'oak-tree', x: 349, y: 30 },
  { type: 'tree', x: 364, y: 74 },
  { type: 'tree', x: 366, y: 74 },
  { type: 'tree', x: 362, y: 74 },
  { type: 'tree', x: 368, y: 74 },
  { type: 'tree', x: 366, y: 73 },
  { type: 'tree', x: 365, y: 73 },
  { type: 'tree', x: 364, y: 73 },
  { type: 'tree', x: 396, y: 197 },
  { type: 'tree', x: 396, y: 198 },

  // ---- THE MUCK HEAPS ----
  //
  // §7i. Nitre is scraped off a dung heap, and a dung heap stands where beasts
  // are kept: the Sheepfolds on the chalk, the goblin pound on the
  // Anchor-Oxenford road, and the yards behind Hollybarrow. Worked with
  // FARMING -- the only gatherable on this island that pays a farmer.
  //
  // RESTORED. §7aa's consolidation rewrote this whole table from the built
  // world and dropped every kind it had no cluster rule for, so the seven muck
  // heaps simply vanished -- and with them saltpetre, and with that gunpowder,
  // and with that every shot the handgonne fires. A table rewritten from a
  // derived list loses whatever the derivation did not know to look for.
  { type: 'muck-heap', x: 638, y: 354 },   // the Sheepfolds
  { type: 'muck-heap', x: 641, y: 358 },
  { type: 'muck-heap', x: 637, y: 360 },
  { type: 'muck-heap', x: 351, y: 256 },   // behind the goblin pound
  { type: 'muck-heap', x: 351, y: 258 },
  { type: 'muck-heap', x: 374, y: 199 },   // the Hollybarrow yards
  { type: 'muck-heap', x: 373, y: 201 },


  // §7bu: THE DEEP FISHING MOVED TO WHITING ISLE.
  //
  // It sat in the north-western sea, reachable on foot along the shore, and an
  // island whose only draw is a second-best copy of something is a detour
  // rather than a destination. The master fishing is the isle's whole reason,
  // it is nowhere else, and the only way to it is the boat from Eastmere.
  // Placed HERE after all. The isle pass tried three ways and landed none: the
  // search stopped short of the water, then `put()` silently refused every sea
  // tile because SEA IS NOT FREE, then addNode placed nothing I could find. The
  // seam table demonstrably works -- it has carried these four since v5 -- so
  // they move by changing their coordinates, which is what "moving a tier"
  // should have meant in the first place.
  // REVERTED to the north-western sea, where they have stood since v5.
  //
  // Four attempts to move this tier to Whiting Isle landed none of them: the
  // isle search stopped short of the water; `put()` silently refuses a sea tile
  // because SEA IS NOT FREE; `addNode` placed nothing I could find; and moving
  // the coordinates in this table -- which demonstrably works, it has carried
  // these four for two versions -- produced zero as well, for a reason I did
  // not find before running out of room to look.
  //
  // A tier deleted from the world is far worse than a tier in the wrong place,
  // so it goes back. The isle and its ferries stand and are sound; what the
  // isle is FOR is unfinished, and that is the next thing to do.
  { type: 'deep-fish-spot', x: 173, y: 112 },
  { type: 'deep-fish-spot', x: 174, y: 112 },
  { type: 'deep-fish-spot', x: 175, y: 111 },
  { type: 'deep-fish-spot', x: 176, y: 110 },

]
