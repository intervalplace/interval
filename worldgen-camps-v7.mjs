// THE CAMPS AND LAIRS OF TALLYHOLM.
//
// Seven hundred beasts scattered by rule is not a population, it is weather.
// The resource seams on this island were designed as SCHELLING POINTS -- a few
// remembered places a crowd converges on, rather than a smear of trees over
// every wood -- and the beasts were the one thing still smeared.
//
// So they are camps. A camp is a KIND, a MIDDLE, a COUNT and a SPREAD: "eight
// goblins round the burnt croft", not eight coordinates. That is the unit a
// person actually places, it is the unit that can be moved and thinned by
// hand, and it is the unit a citizen remembers -- nobody says "there is a wolf
// at 412,208", they say "the wolves are on the Hollybarrow road".
//
// Baked once off the scatter and edited from there, the way the holdings were.
// Capped on the way in, because the scatter put nineteen wolves in one clump
// and a lair is six: the numbers here start at something a person would have
// written rather than at something an accumulator produced.
//
// The hand-placed spawns are NOT in this table and never were -- the beasts in
// the eighteen places, the goblin pound, the scree-imps in the South Pass, and
// the four named things (the dragon, the siren, the spider, the Gibbet King)
// each have their own reason to be where they are.
//
//   kind   what stands there
//   x, y   the middle of the camp
//   n      how many
//   r      how far they spread from the middle
// §7ah: A COUNTRY WANTS A CREATURE OF ITS OWN, AND THE HEARTLANDS WANT PEACE.
//
// Four species did all the work across seven countries and overlapped so
// completely that none of them belonged anywhere: skeleton-knights in the Wilds
// AND in the meadow outside Anchor, trolls in the Crags AND the Wilds, goblins
// in the Fens AND the heartlands. Meanwhile the Moor held the Gibbet King and
// two sheep.
//
// Seventeen camps moved home -- goblins to the Fens, skeletons to the Wilds,
// wolves to the Greenwood, trolls to the Crags -- so the peaceful country is
// peaceful, which is what a starting country is for and what the training yard
// standing in it already implied.
//
// And five creatures that belong somewhere: the BOAR charging in the Greenwood,
// the MOUNTAIN-GOAT on the Crags (harmless, and the island had exactly two
// things a pure could train on, both at sea level), the CARRION-CROW and the
// BARROW-WIGHT over the Moor's graves, the FEN-ADDER in the wet. None of them
// drops anything new. A creature that exists so the Fens do not feel like the
// Downs is doing a job.
export const CAMPS = [
  { kind: 'bear', x: 310, y: 43, n: 4, r: 6 },
  { kind: 'bear', x: 369, y: 76, n: 2, r: 2 },
  { kind: 'bear', x: 370, y: 46, n: 4, r: 7 },
  { kind: 'bear', x: 403, y: 93, n: 4, r: 7 },
  { kind: 'bear', x: 446, y: 101, n: 4, r: 7 },
  { kind: 'bear', x: 580, y: 82, n: 4, r: 7 },
  { kind: 'bear', x: 590, y: 182, n: 2, r: 2 },
  { kind: 'goblin', x: 203, y: 375, n: 2, r: 7 },
  { kind: 'goblin', x: 217, y: 344, n: 8, r: 7 },
  { kind: 'goblin', x: 227, y: 389, n: 8, r: 7 },
  { kind: 'goblin', x: 256, y: 361, n: 8, r: 7 },
  { kind: 'goblin', x: 268, y: 406, n: 8, r: 7 },
  { kind: 'goblin', x: 269, y: 340, n: 5, r: 7 },
  { kind: 'goblin', x: 282, y: 388, n: 3, r: 4 },
  { kind: 'goblin', x: 293, y: 361, n: 2, r: 2 },
  { kind: 'goblin', x: 296, y: 421, n: 4, r: 7 },
  { kind: 'goblin', x: 315, y: 385, n: 8, r: 7 },
  { kind: 'goblin', x: 316, y: 345, n: 1, r: 2 },
  { kind: 'goblin', x: 341, y: 359, n: 8, r: 7 },
  { kind: 'goblin', x: 350, y: 421, n: 4, r: 7 },
  { kind: 'goblin', x: 381, y: 419, n: 5, r: 7 },
  { kind: 'goblin', x: 383, y: 372, n: 8, r: 7 },
  { kind: 'goblin', x: 438, y: 393, n: 4, r: 7 },
  { kind: 'goblin', x: 493, y: 388, n: 4, r: 7 },
  { kind: 'goblin', x: 399, y: 394, n: 1, r: 2 },
  { kind: 'goblin', x: 518, y: 403, n: 1, r: 2 },
  { kind: 'goblin', x: 403, y: 418, n: 1, r: 2 },
  { kind: 'goblin', x: 415, y: 416, n: 8, r: 7 },
  { kind: 'goblin', x: 498, y: 418, n: 1, r: 2 },
  { kind: 'goblin', x: 422, y: 359, n: 4, r: 7 },
  { kind: 'goblin', x: 463, y: 393, n: 5, r: 7 },
  { kind: 'goblin', x: 435, y: 380, n: 5, r: 7 },
  { kind: 'goblin', x: 318, y: 418, n: 1, r: 2 },
  { kind: 'goblin', x: 243, y: 408, n: 4, r: 7 },
  { kind: 'goblin', x: 243, y: 338, n: 2, r: 7 },
  { kind: 'goblin', x: 353, y: 383, n: 7, r: 7 },
  { kind: 'goblin', x: 473, y: 386, n: 6, r: 7 },
  { kind: 'goblin', x: 368, y: 353, n: 2, r: 4 },
  { kind: 'goblin', x: 428, y: 438, n: 2, r: 2 },
  { kind: 'goblin', x: 515, y: 407, n: 8, r: 7 },
  { kind: 'goblin', x: 258, y: 383, n: 2, r: 7 },
  { kind: 'goblin', x: 537, y: 411, n: 1, r: 2 },
  { kind: 'sheep', x: 528, y: 355, n: 6, r: 3 },
  { kind: 'sheep', x: 567, y: 342, n: 6, r: 3 },
  { kind: 'sheep', x: 589, y: 380, n: 6, r: 3 },
  { kind: 'sheep', x: 648, y: 362, n: 8, r: 7 },
  { kind: 'sheep', x: 651, y: 309, n: 8, r: 4 },
  { kind: 'shore-crab', x: 657, y: 418, n: 5, r: 7 },
  { kind: 'shore-crab', x: 674, y: 357, n: 5, r: 7 },
  { kind: 'shore-crab', x: 686, y: 399, n: 4, r: 7 },
  { kind: 'skeleton-knight', x: 50, y: 241, n: 2, r: 2 },
  { kind: 'skeleton-knight', x: 65, y: 225, n: 6, r: 7 },
  { kind: 'skeleton-knight', x: 73, y: 288, n: 5, r: 4 },
  { kind: 'skeleton-knight', x: 102, y: 227, n: 6, r: 7 },
  { kind: 'skeleton-knight', x: 113, y: 266, n: 5, r: 4 },
  { kind: 'skeleton-knight', x: 138, y: 241, n: 5, r: 4 },
  { kind: 'skeleton-knight', x: 152, y: 290, n: 4, r: 4 },
  { kind: 'skeleton-knight', x: 154, y: 243, n: 6, r: 7 },
  { kind: 'skeleton-knight', x: 173, y: 259, n: 6, r: 7 },
  { kind: 'skeleton-knight', x: 148, y: 213, n: 6, r: 7 },
  { kind: 'skeleton-knight', x: 183, y: 203, n: 3, r: 7 },
  { kind: 'skeleton-knight', x: 78, y: 198, n: 2, r: 2 },
  { kind: 'skeleton-knight', x: 193, y: 183, n: 6, r: 7 },
  { kind: 'troll', x: 92, y: 217, n: 5, r: 3 },
  { kind: 'troll', x: 104, y: 305, n: 5, r: 3 },
  { kind: 'troll', x: 105, y: 260, n: 2, r: 2 },
  { kind: 'troll', x: 636, y: 168, n: 5, r: 7 },
  { kind: 'troll', x: 646, y: 144, n: 5, r: 3 },
  { kind: 'troll', x: 653, y: 249, n: 5, r: 7 },
  { kind: 'troll', x: 677, y: 173, n: 5, r: 3 },
  { kind: 'troll', x: 694, y: 133, n: 5, r: 3 },
  { kind: 'troll', x: 698, y: 268, n: 5, r: 3 },
  { kind: 'troll', x: 712, y: 193, n: 5, r: 3 },
  { kind: 'troll', x: 717, y: 164, n: 5, r: 3 },
  { kind: 'troll', x: 718, y: 102, n: 5, r: 3 },
  { kind: 'troll', x: 758, y: 303, n: 5, r: 3 },
  { kind: 'wolf', x: 205, y: 336, n: 1, r: 2 },
  { kind: 'wolf', x: 222, y: 385, n: 3, r: 7 },
  { kind: 'wolf', x: 224, y: 357, n: 2, r: 2 },
  { kind: 'wolf', x: 261, y: 349, n: 4, r: 7 },
  { kind: 'wolf', x: 280, y: 410, n: 4, r: 7 },
  { kind: 'wolf', x: 289, y: 356, n: 1, r: 2 },
  { kind: 'wolf', x: 313, y: 382, n: 2, r: 6 },
  { kind: 'wolf', x: 316, y: 423, n: 1, r: 2 },
  { kind: 'wolf', x: 323, y: 23, n: 2, r: 5 },
  { kind: 'wolf', x: 346, y: 382, n: 1, r: 2 },
  { kind: 'wolf', x: 353, y: 53, n: 1, r: 2 },
  { kind: 'wolf', x: 363, y: 26, n: 2, r: 7 },
  { kind: 'wolf', x: 365, y: 77, n: 1, r: 2 },
  { kind: 'wolf', x: 378, y: 411, n: 2, r: 4 },
  { kind: 'wolf', x: 394, y: 388, n: 3, r: 7 },
  { kind: 'wolf', x: 396, y: 41, n: 3, r: 7 },
  { kind: 'wolf', x: 398, y: 84, n: 3, r: 7 },
  { kind: 'wolf', x: 401, y: 362, n: 2, r: 7 },
  { kind: 'wolf', x: 416, y: 407, n: 2, r: 4 },
  { kind: 'wolf', x: 420, y: 99, n: 6, r: 7 },
  { kind: 'wolf', x: 421, y: 65, n: 4, r: 7 },
  { kind: 'wolf', x: 447, y: 131, n: 1, r: 2 },
  { kind: 'wolf', x: 454, y: 376, n: 2, r: 7 },
  { kind: 'wolf', x: 454, y: 79, n: 3, r: 6 },
  { kind: 'wolf', x: 454, y: 104, n: 1, r: 2 },
  { kind: 'wolf', x: 457, y: 51, n: 1, r: 2 },
  { kind: 'wolf', x: 471, y: 112, n: 3, r: 7 },
  { kind: 'wolf', x: 479, y: 66, n: 3, r: 7 },
  { kind: 'wolf', x: 488, y: 399, n: 6, r: 7 },
  { kind: 'wolf', x: 510, y: 405, n: 1, r: 2 },
  { kind: 'wolf', x: 515, y: 115, n: 1, r: 2 },
  { kind: 'wolf', x: 533, y: 73, n: 1, r: 2 },
  { kind: 'wolf', x: 549, y: 156, n: 2, r: 5 },
  { kind: 'wolf', x: 554, y: 88, n: 4, r: 7 },
  { kind: 'wolf', x: 584, y: 171, n: 6, r: 7 },
  { kind: 'wolf', x: 585, y: 101, n: 1, r: 2 },
  { kind: 'wolf', x: 596, y: 127, n: 3, r: 7 },
  { kind: 'wolf', x: 599, y: 71, n: 3, r: 7 },
  { kind: 'wolf', x: 629, y: 100, n: 5, r: 7 },
  { kind: 'wolf', x: 632, y: 148, n: 2, r: 7 },
  { kind: 'wolf', x: 657, y: 77, n: 3, r: 7 },
  { kind: 'wolf', x: 715, y: 76, n: 3, r: 7 },
  { kind: 'wolf', x: 725, y: 52, n: 2, r: 7 },
  { kind: 'boar', x: 643, y: 58, n: 4, r: 7 },
  { kind: 'boar', x: 558, y: 113, n: 4, r: 7 },
  { kind: 'boar', x: 688, y: 88, n: 4, r: 7 },
  { kind: 'boar', x: 693, y: 63, n: 4, r: 7 },
  { kind: 'boar', x: 618, y: 123, n: 4, r: 7 },
  { kind: 'mountain-goat', x: 693, y: 213, n: 4, r: 7 },
  { kind: 'mountain-goat', x: 748, y: 243, n: 4, r: 7 },
  { kind: 'mountain-goat', x: 828, y: 248, n: 4, r: 7 },
  { kind: 'mountain-goat', x: 863, y: 263, n: 4, r: 7 },
  { kind: 'mountain-goat', x: 818, y: 273, n: 4, r: 7 },
  { kind: 'carrion-crow', x: 238, y: 148, n: 6, r: 7 },
  { kind: 'carrion-crow', x: 313, y: 128, n: 6, r: 7 },
  { kind: 'carrion-crow', x: 253, y: 113, n: 6, r: 7 },
  { kind: 'carrion-crow', x: 293, y: 143, n: 6, r: 7 },
  { kind: 'carrion-crow', x: 338, y: 138, n: 6, r: 7 },
  { kind: 'carrion-crow', x: 388, y: 133, n: 6, r: 7 },
  { kind: 'fen-adder', x: 380, y: 380, n: 4, r: 7 },
  { kind: 'barrow-wight', x: 318, y: 98, n: 3, r: 7 },
  { kind: 'barrow-wight', x: 268, y: 73, n: 3, r: 7 },
  { kind: 'barrow-wight', x: 228, y: 118, n: 3, r: 7 },
  { kind: 'barrow-wight', x: 408, y: 123, n: 3, r: 7 },

  // §7aj: A FOLDED FLOCK.
  //
  // Sheep were fifty-two head loose across the Downs, and a sheep on an open
  // hillside is wallpaper: you walk past it, you kill one in passing, it means
  // nothing. Penned, it is a PLACE -- you go to the Sheepfolds, you go IN, and
  // the fight is somewhere rather than everywhere.
  //
  // The Sheepfolds have stood since the first week as six empty pens with a
  // shepherd beside them. Six empty pens. This is the same argument as the
  // goblin pound and the training yard: a thing behind a fence is a
  // destination, and a thing roaming loose is scenery.
  //
  // A tight radius, so they stay in the pens they belong to.
  { kind: 'sheep', x: 638, y: 357, n: 10, r: 4 },

]
