// THE WORKING COUNTRY: the Fens, the Downs, and the shore of Stillwater.
//
// Measured, built things per thousand tiles, after the holdings and the
// hand-drawn fields went in:
//
//   heartlands  90.1     downs 49.9     greenwood 23.9     moor  7.3
//   crags       31.4     fens  16.8                        wilds 7.0
//
// The heartlands came out thirteen times more inhabited than the Wilds,
// because everything added went where the roads already were and the effect
// was to make the dense part denser.
//
// Two of those numbers are RIGHT. The Wilds carry no roads at all by design
// and the Moor is meant to be bare: a walk into nothing is the point of both,
// and neither wants a farmhouse.
//
// Two are wrong:
//
//   THE FENS: 51.6 tiles' mean walk to anything, the worst on the island and
//   half again the Wilds -- in a country with a port on it, a causeway across
//   it and an eel trade working it. A country with a road and a harbour should
//   not be emptier than the lawless west.
//
//   THE DOWNS: 49.9 looks healthy and is almost entirely the Sheepfolds and
//   the causeway itself. It is sheep country with one fold on it.
//
// So they are worked on their OWN terms rather than by copying the heartlands.
// A furlong of strip-fields would be wrong in both: you cannot plough a fen and
// the chalk is too thin. What a fen has is peat, eels and boardwalks. What a
// down has is sheep, folds, dew ponds and the drove road they are walked along.
//
//   #  wall     f  fence    ^  hedge    p  plot/peat cutting
//   ,  floor    h  hearth   d  bed      q  barrel   v  drying rack (shelf)
//   o  a pond   T  tree     .  open     ~  nothing

// ---- THE FENS -------------------------------------------------------------
const STILT_HUT = [          // a hut up on staddles, at the causeway's edge
  '~####~',
  '~#,h#~',
  '~#d,#~',
  '~##.#~',
  '~~q.~~',
]
const EEL_TRAPS = [          // traps and drying racks where the water runs
  '~v~~v~',
  '~~qq~~',
  'v~~~~v',
  '~~qq~~',
]
const PEAT_CUTTING = [       // turf cut and stacked to dry
  'p.p.~~',
  'p.p.~~',
  '~p.qq~',
  '~~qq~~',
]
const FOWLER = [             // a wildfowler's hide and his punt
  '~~ff~~',
  '~f..f~',
  '~f..f~',
  '~~q~~~',
]

// ---- THE DOWNS ------------------------------------------------------------
const FOLD = [               // a drystone sheepfold on the chalk
  '~^^^^^^~',
  '^......^',
  '^......^',
  '^......^',
  '~^^..^^~',
]
const DEW_POND = [           // the only water on a chalk down, and man-made
  '~~^^~~',
  '~^oo^~',
  '~^oo^~',
  '~~^^~~',
]
const SHEPHERD_HUT = [       // one room, a hearth, and a view of everything
  '~###~',
  '~#h#~',
  '~#,#~',
  '~##.~',
]

// ---- THE LAKE -------------------------------------------------------------
const FISH_CAMP = [          // the one piece of inland shore on the island
  '~###~~',
  '~#h,#~',
  '~##,#~',
  '~~v.q~',
  '~~~.~~',
]

export const COUNTRY_WORKS = {
  'stilt-hut': STILT_HUT, 'eel-traps': EEL_TRAPS, 'peat-cutting': PEAT_CUTTING,
  fowler: FOWLER, fold: FOLD, 'dew-pond': DEW_POND, 'shepherd-hut': SHEPHERD_HUT,
  'fish-camp': FISH_CAMP,
}

// Seats, hand-placed on the frozen island. The fen works follow the causeway
// (x 653-690) and the low ground west of Fenmarch; the downs works are spread
// across the chalk between the Barrow and the sea; the camp sits on the one
// walkable shore Stillwater has.
// Seats, hand-placed on the frozen island and then machine-checked: I chose
// where each work belongs, and a pass over the drawings moved fifteen of them
// to the nearest ground that would actually hold one. Ten of my first guesses
// were in the sea, on the Barrow, or standing in the causeway itself -- which
// is the argument for baking rather than typing, in miniature.
//
// The fen works follow the causeway and the low ground west of Fenmarch; a
// stilt hut and an eel trap are allowed to stand IN the water, because that is
// what they are for. The downs works are spread across the chalk between the
// Barrow and the sea. The camps sit on the only inland shore the island has.
export const COUNTRY_SEATS = [
  { kind: 'stilt-hut', x: 642, y: 361, name: 'the Causeway Hut' },
  { kind: 'eel-traps', x: 652, y: 396, name: null },
  { kind: 'peat-cutting', x: 661, y: 396, name: 'the Turf Pits' },
  { kind: 'eel-traps', x: 682, y: 403, name: null },
  { kind: 'fowler', x: 691, y: 399, name: 'the Fowler\'s Hide' },
  { kind: 'stilt-hut', x: 472, y: 403, name: 'Reedhouse' },
  { kind: 'peat-cutting', x: 440, y: 400, name: 'the Fen Turbary' },
  { kind: 'eel-traps', x: 449, y: 405, name: null },
  { kind: 'fowler', x: 420, y: 392, name: null },
  { kind: 'stilt-hut', x: 396, y: 386, name: 'Sallowstead' },
  { kind: 'peat-cutting', x: 366, y: 380, name: null },
  { kind: 'fowler', x: 330, y: 372, name: null },
  { kind: 'stilt-hut', x: 300, y: 366, name: 'Lowhithe' },
  { kind: 'eel-traps', x: 262, y: 362, name: null },
  { kind: 'peat-cutting', x: 234, y: 358, name: 'the West Turbary' },
  { kind: 'fowler', x: 499, y: 419, name: null },
  { kind: 'peat-cutting', x: 520, y: 408, name: null },
  { kind: 'fold', x: 600, y: 330, name: null },
  { kind: 'dew-pond', x: 610, y: 337, name: 'the Upper Dew Pond' },
  { kind: 'shepherd-hut', x: 592, y: 322, name: 'Highfold' },
  { kind: 'fold', x: 659, y: 319, name: null },
  { kind: 'dew-pond', x: 672, y: 326, name: null },
  { kind: 'fold', x: 702, y: 337, name: null },
  { kind: 'shepherd-hut', x: 688, y: 334, name: 'Whitelease' },
  { kind: 'fold', x: 720, y: 300, name: null },
  { kind: 'dew-pond', x: 732, y: 306, name: null },
  { kind: 'fold', x: 559, y: 349, name: null },
  { kind: 'shepherd-hut', x: 548, y: 344, name: 'Barrowlease' },
  { kind: 'fold', x: 620, y: 380, name: null },
  { kind: 'dew-pond', x: 624, y: 388, name: 'the Long Dew Pond' },
  // NO FOLD at 692,406: that corner of the chalk is the Sheep Beck's mouth
  // and four of its sixteen hedge tiles stood in the water. The seat tool
  // could not move it -- its neighbours had already claimed the dry ground
  // round it -- and a ninth fold is not worth a drowned one.
  { kind: 'shepherd-hut', x: 668, y: 352, name: 'Sheepwalk' },
  { kind: 'fold', x: 721, y: 341, name: null },
  { kind: 'dew-pond', x: 731, y: 335, name: null },
  { kind: 'fold', x: 534, y: 314, name: null },
  { kind: 'shepherd-hut', x: 499, y: 315, name: 'Barrowfoot' },
  { kind: 'fish-camp', x: 657, y: 92, name: 'the Stillwater Camp' },
  // Stillwater's traps, on the south-west shore. Four earlier seats for these
  // laid nothing at all -- in open water they were built and then swept (a node
  // with no walkable tile beside it is unreachable and the founding is right to
  // remove it), and on two stretches of shore the ground was spoken for. This
  // one lays all eight. The lesson is not about eels: it is that "the tile
  // looks empty" and "a drawing may stand here" are different questions, and
  // only the founding can answer the second.
  { kind: 'eel-traps', x: 648, y: 122, name: null },
  { kind: 'fish-camp', x: 662, y: 124, name: 'the South Landing' },
]

// THE DROVE ROAD. Sheep are walked to market, and the track they are walked
// along is the oldest thing on a chalk down. It runs from the Sheepfolds along
// the ridge of the chalk to the causeway head, and it is a lane rather than a
// road: nobody built it, it wore in.
// THE TRACKS. Hand-drawn polylines added to the lanes, for the same reason
// the drove road is one: nobody built these, they wore in.
//
// Stillwater is the biggest water on the island and the only inland shore, and
// its two camps stood FIFTY TILES from the nearest road with nothing joining
// them to it -- which is why the lake read as empty however much was on it. A
// camp nobody can walk to from a road is a camp nobody finds.
// THE QUAYS OF EASTMERE.
//
// The port's three fishing spots stood on the bare shingle at 664,362-364 with
// nothing built at them: a fishing town whose whole reason to exist was three
// marks on a beach. A port has JETTIES -- decking out over the water, which is
// what you stand on to work the deep.
//
// A quay is decking, so it is laid as PLANKS (see BECK_PLANKS): tiles that are
// water and walkable, which `onBridge` already knows how to say. It is not
// built out of `wall`, because a wall in the sea is a wall.
//
// Two of them, because a port with one jetty is a jetty.
// A JETTY THAT DOES NOT TOUCH THE SHORE IS A RAFT.
//
// The first pair of these started one tile out in the water and both were
// FLOATING: 665,361 had water on three sides and decking on the fourth, and
// 668,366 the same. Nothing on the island could reach either, so the fishing
// spots laid beside them were swept as unreachable and the quays themselves
// were sixteen tiles of boards nobody could stand on. Every path begins on
// land -- the first tile of each is dry ground.
export const QUAYS = [
  // the north jetty: out of the shingle at 664,362, past the fishing marks
  { name: 'the North Quay', path: [[664, 362], [665, 361], [665, 360], [665, 359], [666, 358], [667, 357]] },
  // and the working quay, off the bank below the town
  { name: 'the Fish Quay', path: [[666, 368], [667, 367], [668, 366], [669, 365], [670, 364], [671, 363]] },
]

export const TRACKS = [
  // from the Greenhollow-Kingswood road, north-east to the Stillwater camp
  [[610, 72], [620, 76], [630, 80], [638, 85], [645, 89], [652, 92], [657, 96]],
  // and down the western shore to the south landing
  [[657, 100], [654, 106], [652, 113], [654, 119], [659, 124]],
  // the road below the lake up to the south landing, so the shore is a THROUGH
  // route rather than a dead end -- a shore you pass is a shore you notice
  [[660, 172], [661, 162], [660, 152], [662, 142], [661, 132], [660, 126]],
]

export const DROVE = [
  [560, 352], [580, 344], [600, 334], [620, 330], [640, 326], [660, 322],
  [680, 328], [700, 342], [710, 356], [712, 372], [706, 388], [694, 396],
]
