// WHO LIVES HERE.
//
// Thirty-nine of the island's eighty-one rooms held a bed, a hearth and nobody
// -- a door, a floor, and no answer to "why is this room here". The answer is
// not a verb. §13k gave three rooms the only place in the world where
// something can be done, and that is the right number of those: eight
// brewhouses would be wallpaper for the reason nine shrines were.
//
// The answer is that somebody lives here. Lumbridge's houses are empty too;
// the difference is that people are standing in them.
//
// No new vocabulary. Every calling below is already in the engine's
// KEEPER_KINDS and most of them stood exactly once on the whole island --
// collier, quarrier, beekeeper, drover, mourner, watchman were each a single
// person in a world of a thousand. A country has more than one shepherd.
//
// The names are English of no particular century, and they are chosen to suit
// the town: fen names at Fenmarch, stone names at Cragfoot. A citizen who
// meets Aldith the Drover at the Oxenford and Wat of the Folds on the Downs
// should be able to believe they are the same island's people.
//
//   x, y   the tile the resident stands on -- an interior floor tile of the
//          room, chosen so it is not the doorway and not a cut vertex
//   kind   their calling, from KEEPER_KINDS
//   name   what the window says when you look at them
export const RESIDENTS = [
  { x: 480, y: 259, kind: 'merchant', name: 'Odo Twelvepence' },   // Anchor Cottage 4
  { x: 443, y: 267, kind: 'watchman', name: 'Hild the Watch' },   // Anchor Cottage 5
  { x: 451, y: 267, kind: 'brewer', name: 'Sabina Ale-wife' },   // Anchor Cottage 6
  { x: 460, y: 267, kind: 'drover', name: 'Cuthbert Drover' },   // Anchor Cottage 7
  { x: 443, y: 275, kind: 'mourner', name: 'Old Ædelin' },   // Anchor Cottage 8
  { x: 452, y: 275, kind: 'innkeeper', name: 'Peronel of the Vale' },   // Anchor Cottage 9
  { x: 461, y: 275, kind: 'banker', name: 'Thurstan Reckoner' },   // Anchor Cottage 10
  { x: 462, y: 186, kind: 'shepherd', name: 'Godiva Longwalk' },   // Millbrook Cottage 1
  { x: 481, y: 186, kind: 'miller', name: 'Symond at the Mill' },   // Millbrook Cottage 2
  { x: 487, y: 186, kind: 'merchant', name: 'Avice Cheapstow' },   // Millbrook Cottage 3
  { x: 445, y: 192, kind: 'drover', name: 'Ranulf Drover' },   // Millbrook Room 1
  { x: 452, y: 192, kind: 'drover', name: 'Aldith the Drover' },   // Millbrook Room 2
  { x: 340, y: 285, kind: 'miller', name: 'Bartholomew Grist' },   // Oxenford Cottage 1
  { x: 345, y: 292, kind: 'brewer', name: 'Emma Barleycorn' },   // Oxenford Cottage 2
  { x: 337, y: 301, kind: 'shepherd', name: 'Simon Ashfold' },   // Oxenford Cottage 3
  { x: 346, y: 301, kind: 'watchman', name: 'the Ford Watch' },   // Oxenford Cottage 4
  { x: 353, y: 301, kind: 'beekeeper', name: 'Juliana Skepwright' },   // Oxenford Hall 2
  { x: 333, y: 307, kind: 'merchant', name: 'Hamo Crossing' },   // Oxenford Cottage 5
  { x: 345, y: 307, kind: 'mourner', name: 'Sister Ymain' },   // Oxenford Cottage 6
  { x: 355, y: 307, kind: 'collier', name: 'Wulfric Char' },   // Oxenford Room
  { x: 522, y: 224, kind: 'quarrier', name: 'Osbert Stonecutter' },   // Thornbury Cottage 2
  { x: 512, y: 233, kind: 'collier', name: 'Alditha Coalwife' },   // Thornbury Cottage 3
  { x: 522, y: 233, kind: 'merchant', name: 'Rand of the Forge' },   // Thornbury Cottage 4
  { x: 531, y: 233, kind: 'watchman', name: 'Ivo Nightbell' },   // Thornbury Cottage 5
  { x: 657, y: 370, kind: 'brewer', name: 'Cecily Quench' },   // Eastmere Room
  { x: 638, y: 378, kind: 'beekeeper', name: 'Milburga of the Hives' },   // Eastmere Cottage 1
  { x: 645, y: 378, kind: 'sawyer', name: 'Leofric Two-Saw' },   // Eastmere Hall 1
  { x: 647, y: 386, kind: 'quarrier', name: 'Maerwynn Hardhand' },   // Eastmere Cottage 2
  { x: 653, y: 386, kind: 'delver', name: 'Gamel Deepshaft' },   // Eastmere Hall 2

  // ---- and the last ten, once the first pass had shown which rooms were
  // furnished to capacity and which had a free corner all along ----
  { x: 454, y: 259, kind: 'merchant', name: 'Wymond Sackmaker' },   // Anchor Cottage 3
  { x: 522, y: 211, kind: 'watchman', name: 'the Forge Watch' },   // Thornbury Hall
  { x: 513, y: 224, kind: 'collier', name: 'Editha Emberhand' },   // Thornbury Cottage 1
  { x: 358, y: 208, kind: 'shepherd', name: 'Torold Lambwright' },   // Hollybarrow Cottage
  { x: 365, y: 65, kind: 'sawyer', name: 'Aefa Splitwood' },   // Greenhollow Cottage 1
  { x: 775, y: 228, kind: 'delver', name: 'Hrothgar Pickstock' },   // Cragfoot Cottage 1
  { x: 763, y: 237, kind: 'quarrier', name: 'the Delving Warden' },   // Cragfoot Hall
  { x: 445, y: 419, kind: 'fisher', name: 'Osgyth Reedcutter' },   // Fenmarch Cottage 1
  { x: 465, y: 419, kind: 'collier', name: 'Bota Turfwife' },   // Fenmarch Cottage 2
  { x: 200, y: 245, kind: 'watchman', name: 'Ealdgyth of the Wall' },   // Norwick Cottage 2
]
