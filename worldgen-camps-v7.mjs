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
export const CAMPS = [
  { kind: 'bear', x: 310, y: 43, n: 4, r: 6 },   // the Greenwood
  { kind: 'bear', x: 369, y: 76, n: 2, r: 2 },   // the Greenwood
  { kind: 'bear', x: 370, y: 46, n: 4, r: 7 },   // the Greenwood
  { kind: 'bear', x: 403, y: 93, n: 4, r: 7 },   // the Greenwood
  { kind: 'bear', x: 446, y: 101, n: 4, r: 7 },   // the Greenwood
  { kind: 'bear', x: 580, y: 82, n: 4, r: 7 },   // the Kingswood
  { kind: 'bear', x: 590, y: 182, n: 2, r: 2 },   // the Greenwood
  { kind: 'goblin', x: 203, y: 375, n: 2, r: 7 },   // the Fens
  { kind: 'goblin', x: 217, y: 344, n: 8, r: 7 },   // the Fens
  { kind: 'goblin', x: 227, y: 389, n: 8, r: 7 },   // the Fens
  { kind: 'goblin', x: 256, y: 361, n: 8, r: 7 },   // the Fens
  { kind: 'goblin', x: 268, y: 406, n: 8, r: 7 },   // the Fens
  { kind: 'goblin', x: 269, y: 340, n: 5, r: 7 },   // the Fens
  { kind: 'goblin', x: 282, y: 388, n: 3, r: 4 },   // the Fens
  { kind: 'goblin', x: 293, y: 361, n: 2, r: 2 },   // the Fens
  { kind: 'goblin', x: 296, y: 421, n: 4, r: 7 },   // the Fens
  { kind: 'goblin', x: 315, y: 385, n: 8, r: 7 },   // the Fens
  { kind: 'goblin', x: 316, y: 345, n: 1, r: 2 },   // the Fens
  { kind: 'goblin', x: 341, y: 359, n: 8, r: 7 },   // the Fens
  { kind: 'goblin', x: 350, y: 421, n: 4, r: 7 },   // the Fens
  { kind: 'goblin', x: 381, y: 419, n: 5, r: 7 },   // the Fens
  { kind: 'goblin', x: 383, y: 372, n: 8, r: 7 },   // the Fens
  { kind: 'goblin', x: 392, y: 282, n: 4, r: 7 },   // the Heartlands
  { kind: 'goblin', x: 396, y: 238, n: 4, r: 7 },   // the Heartlands
  { kind: 'goblin', x: 399, y: 394, n: 1, r: 2 },   // the Fens
  { kind: 'goblin', x: 404, y: 222, n: 1, r: 2 },   // the Heartlands
  { kind: 'goblin', x: 407, y: 259, n: 1, r: 2 },   // Anchor Vale
  { kind: 'goblin', x: 415, y: 416, n: 8, r: 7 },   // the Fens
  { kind: 'goblin', x: 419, y: 196, n: 1, r: 2 },   // the Heartlands
  { kind: 'goblin', x: 422, y: 359, n: 4, r: 7 },   // the Fens
  { kind: 'goblin', x: 425, y: 310, n: 5, r: 7 },   // the Heartlands
  { kind: 'goblin', x: 435, y: 380, n: 5, r: 7 },   // the Fens
  { kind: 'goblin', x: 450, y: 326, n: 1, r: 2 },   // Watersmeet
  { kind: 'goblin', x: 453, y: 218, n: 4, r: 7 },   // the Heartlands
  { kind: 'goblin', x: 456, y: 293, n: 2, r: 7 },   // the Heartlands
  { kind: 'goblin', x: 471, y: 316, n: 7, r: 7 },   // the Heartlands
  { kind: 'goblin', x: 473, y: 386, n: 6, r: 7 },   // the Fens
  { kind: 'goblin', x: 480, y: 227, n: 2, r: 4 },   // the Heartlands
  { kind: 'goblin', x: 500, y: 199, n: 2, r: 2 },   // the Heartlands
  { kind: 'goblin', x: 515, y: 407, n: 8, r: 7 },   // the Fens
  { kind: 'goblin', x: 523, y: 266, n: 2, r: 7 },   // the Heartlands
  { kind: 'goblin', x: 537, y: 411, n: 1, r: 2 },   // the Fens
  { kind: 'sheep', x: 528, y: 355, n: 6, r: 3 },   // the Downs
  { kind: 'sheep', x: 567, y: 342, n: 6, r: 3 },   // the Downs
  { kind: 'sheep', x: 589, y: 380, n: 6, r: 3 },   // the Downs
  { kind: 'sheep', x: 648, y: 362, n: 8, r: 7 },   // the Sheepfolds
  { kind: 'sheep', x: 651, y: 309, n: 8, r: 4 },   // the Downs
  { kind: 'shore-crab', x: 657, y: 418, n: 5, r: 7 },   // the Downs
  { kind: 'shore-crab', x: 674, y: 357, n: 5, r: 7 },   // the Downs
  { kind: 'shore-crab', x: 686, y: 399, n: 4, r: 7 },   // Whitechalk
  { kind: 'skeleton-knight', x: 50, y: 241, n: 2, r: 2 },   // the Wilds
  { kind: 'skeleton-knight', x: 65, y: 225, n: 6, r: 7 },   // the Wilds
  { kind: 'skeleton-knight', x: 73, y: 288, n: 5, r: 4 },   // the Wilds
  { kind: 'skeleton-knight', x: 102, y: 227, n: 6, r: 7 },   // the Wilds
  { kind: 'skeleton-knight', x: 113, y: 266, n: 5, r: 4 },   // the Wilds
  { kind: 'skeleton-knight', x: 138, y: 241, n: 5, r: 4 },   // the Wilds
  { kind: 'skeleton-knight', x: 152, y: 290, n: 4, r: 4 },   // the Wilds
  { kind: 'skeleton-knight', x: 154, y: 243, n: 6, r: 7 },   // the Wilds
  { kind: 'skeleton-knight', x: 173, y: 259, n: 6, r: 7 },   // the Wilds
  { kind: 'skeleton-knight', x: 488, y: 298, n: 6, r: 7 },   // the Barrow
  { kind: 'skeleton-knight', x: 512, y: 283, n: 3, r: 7 },   // the Barrow
  { kind: 'skeleton-knight', x: 518, y: 317, n: 2, r: 2 },   // the Barrow
  { kind: 'skeleton-knight', x: 540, y: 297, n: 6, r: 7 },   // the Barrow
  { kind: 'troll', x: 92, y: 217, n: 5, r: 3 },   // the Wilds
  { kind: 'troll', x: 104, y: 305, n: 5, r: 3 },   // the Boneyard
  { kind: 'troll', x: 105, y: 260, n: 2, r: 2 },   // the Wilds
  { kind: 'troll', x: 636, y: 168, n: 5, r: 7 },   // the Crags
  { kind: 'troll', x: 646, y: 144, n: 5, r: 3 },   // the Crags
  { kind: 'troll', x: 653, y: 249, n: 5, r: 7 },   // the Crags
  { kind: 'troll', x: 677, y: 173, n: 5, r: 3 },   // the Crags
  { kind: 'troll', x: 694, y: 133, n: 5, r: 3 },   // the Crags
  { kind: 'troll', x: 698, y: 268, n: 5, r: 3 },   // the Crags
  { kind: 'troll', x: 712, y: 193, n: 5, r: 3 },   // the High Delving
  { kind: 'troll', x: 717, y: 164, n: 5, r: 3 },   // the Crags
  { kind: 'troll', x: 718, y: 102, n: 5, r: 3 },   // the Crags
  { kind: 'troll', x: 758, y: 303, n: 5, r: 3 },   // the Crags
  { kind: 'wolf', x: 205, y: 336, n: 1, r: 2 },   // the Fens
  { kind: 'wolf', x: 222, y: 385, n: 3, r: 7 },   // the Fens
  { kind: 'wolf', x: 224, y: 357, n: 2, r: 2 },   // the Fens
  { kind: 'wolf', x: 261, y: 349, n: 4, r: 7 },   // the Fens
  { kind: 'wolf', x: 280, y: 410, n: 4, r: 7 },   // the Fens
  { kind: 'wolf', x: 289, y: 356, n: 1, r: 2 },   // the Fens
  { kind: 'wolf', x: 313, y: 382, n: 2, r: 6 },   // the Fens
  { kind: 'wolf', x: 316, y: 423, n: 1, r: 2 },   // the Fens
  { kind: 'wolf', x: 323, y: 23, n: 2, r: 5 },   // the Greenwood
  { kind: 'wolf', x: 346, y: 382, n: 1, r: 2 },   // the Fens
  { kind: 'wolf', x: 353, y: 53, n: 1, r: 2 },   // the Greenwood
  { kind: 'wolf', x: 363, y: 26, n: 2, r: 7 },   // the Greenwood
  { kind: 'wolf', x: 365, y: 77, n: 1, r: 2 },   // the Greenwood
  { kind: 'wolf', x: 378, y: 411, n: 2, r: 4 },   // the Fens
  { kind: 'wolf', x: 394, y: 388, n: 3, r: 7 },   // the Fens
  { kind: 'wolf', x: 396, y: 41, n: 3, r: 7 },   // the Greenwood
  { kind: 'wolf', x: 398, y: 84, n: 3, r: 7 },   // the Greenwood
  { kind: 'wolf', x: 401, y: 362, n: 2, r: 7 },   // the Fens
  { kind: 'wolf', x: 416, y: 407, n: 2, r: 4 },   // the Fens
  { kind: 'wolf', x: 420, y: 99, n: 6, r: 7 },   // the Greenwood
  { kind: 'wolf', x: 421, y: 65, n: 4, r: 7 },   // the Greenwood
  { kind: 'wolf', x: 447, y: 131, n: 1, r: 2 },   // the Greenwood
  { kind: 'wolf', x: 454, y: 376, n: 2, r: 7 },   // the Fens
  { kind: 'wolf', x: 454, y: 79, n: 3, r: 6 },   // the Greenwood
  { kind: 'wolf', x: 454, y: 104, n: 1, r: 2 },   // the Greenwood
  { kind: 'wolf', x: 457, y: 51, n: 1, r: 2 },   // the Deepwood
  { kind: 'wolf', x: 471, y: 112, n: 3, r: 7 },   // the Greenwood
  { kind: 'wolf', x: 479, y: 66, n: 3, r: 7 },   // the Greenwood
  { kind: 'wolf', x: 488, y: 399, n: 6, r: 7 },   // the Fens
  { kind: 'wolf', x: 510, y: 405, n: 1, r: 2 },   // the Fens
  { kind: 'wolf', x: 515, y: 115, n: 1, r: 2 },   // the Greenwood
  { kind: 'wolf', x: 533, y: 73, n: 1, r: 2 },   // the Greenwood
  { kind: 'wolf', x: 549, y: 156, n: 2, r: 5 },   // the Greenwood
  { kind: 'wolf', x: 554, y: 88, n: 4, r: 7 },   // the Greenwood
  { kind: 'wolf', x: 584, y: 171, n: 6, r: 7 },   // the Greenwood
  { kind: 'wolf', x: 585, y: 101, n: 1, r: 2 },   // the Greenwood
  { kind: 'wolf', x: 596, y: 127, n: 3, r: 7 },   // the Greenwood
  { kind: 'wolf', x: 599, y: 71, n: 3, r: 7 },   // the Kingswood
  { kind: 'wolf', x: 629, y: 100, n: 5, r: 7 },   // the Greenwood
  { kind: 'wolf', x: 632, y: 148, n: 2, r: 7 },   // the Greenwood
  { kind: 'wolf', x: 657, y: 77, n: 3, r: 7 },   // the Greenwood
  { kind: 'wolf', x: 715, y: 76, n: 3, r: 7 },   // the Greenwood
  { kind: 'wolf', x: 725, y: 52, n: 2, r: 7 },   // the Greenwood
]
