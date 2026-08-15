// THE PLACES OF TALLYHOLM -- one of each, none of them necessary.
//
// The island had nineteen named localities and twelve of them were a signpost
// standing in an empty field. It also had six hundred and twenty-six built
// things out in the country, drawn from EIGHT rotating kinds: croft, cairn,
// shrine, orchard, gibbet, kennel, beehives, bouldercircle. That is more props
// than the map it was measured against and fewer PLACES, because the fifth
// croft is not a place -- it is wallpaper with a door.
//
// The comparison that settled it: RuneScape in 2002, an island of roughly this
// size, carries about sixty named places and perhaps eight of them are ever
// required. McGrubor's Wood. Keep LeFaye. Melzar's Maze. The Zoo. A park
// inside Falador. Two windmills. A jail. Every one appears exactly once, most
// are buildings with a door and something behind it, and nearly all of them
// sit BESIDE a road you were already walking rather than at the end of one.
// Nobody designed a landmark framework. Somebody built a zoo.
//
// So this file is a table, hand-written, one entry per place, in the same
// spirit as the town drawings in worldgen-shire-v6. Each place is seated at a
// locality that ALREADY HAS A NAME on the chart, so that a citizen who walks
// to Ninestone Moor finds nine stones there, which is the least a name owes
// anyone.
//
// THE LEGEND. Deliberately smaller than a town's -- these are ruins, camps and
// oddities, not settlements with an economy:
//
//   #  wall           a standing wall, timber or stone
//   %  rampart        heavy stone: towers, folds, old works
//   ,  floor          an interior with boards (registered in loneRooms)
//   .  open           reserved ground: no scatter, no floor
//   !  standing stone
//   o  well           a shaft, a windlass, a wellhead
//   *  campfire       something burning, or lately burnt
//   h  hearth         a cold hearth in a ruin, or a live one in a camp
//   e  table
//   d  bed
//   v  shelf          racks, drying frames, shelving
//   q  barrel
//   i  signpost       carries the place's own name
//   D  dedication     a stone somebody cut a name into
//   B  ossuary        bones, kept
//   T  tree           whatever tree the country grows
//   Y  gallows-oak    the one tree that is a warning
//   ^  hedge
//   f  fence
//   ~  (nothing)      a hole in the drawing: leave the ground alone
//
// A place is NOT required to be enclosed, connected, or useful. That is the
// entire point of it.

export const PLACES_V7 = {
  // ---- THE MOOR ------------------------------------------------------------
  // The name promised nine stones. There were none. This is the whole thesis
  // of the file in one entry.
  ninestone: {
    name: 'the Nine Stones', locale: 'ninestone', floors: false,
    sign: 'the Nine Stones',
    rows: [
      '~~!~~!~~!~~',
      '~~~~~~~~~~~',
      '!~~~~~~~~~!',
      '~~~~~D~~~~~',
      '!~~~~~~~~~!',
      '~~~~~~~~~~~',
      '~~!~~!~~!~~',
    ],
  },
  // A shepherd's bothy alone on the moor: one room, a cold hearth, a bed
  // somebody still uses. Nobody is ever there.
  bleakfell: {
    name: 'the Bothy', locale: 'bleakfell', floors: true,
    sign: 'Bleakfell Bothy',
    rows: [
      '~#####~',
      '~#,h,#~',
      '~#,,,#~',
      '~#d,q#~',
      '~##.##~',
      '~~~.~~~',
    ],
  },

  // ---- THE WILDS -----------------------------------------------------------
  // Bones, kept. The name was already on the chart and there was one signpost.
  boneyard: {
    name: 'the Boneyard', locale: 'boneyard', floors: false,
    sign: 'the Boneyard',
    rows: [
      '~~%%~~~%%~~',
      '~%~~~B~~~%~',
      '~~~B~~~B~~~',
      '%~~~~D~~~~%',
      '~~~B~~~B~~~',
      '~%~~~B~~~%~',
      '~~%%~~~%%~~',
    ],
  },
  // A tower with no roof and no stair, four days' walk from anywhere, and
  // whoever built it is not on any list.
  deadreach: {
    name: "the Ruined Tower", locale: 'deadreach', floors: false,
    sign: "Deadman's Reach",
    rows: [
      '~~%%%%%~~',
      '~%%...%%~',
      '~%..h..%~',
      '~%.....%~',
      '~%%...%%~',
      '~~%%.%%~~',
      '~~~~.~~~~',
      '~~Y~~~~~~',
    ],
  },

  // ---- THE GREENWOOD -------------------------------------------------------
  // The sawyer's camp: a lean-to, a fire, a stack of what he cut. He is not
  // here today either.
  deepwood: {
    name: "the Sawyer's Camp", locale: 'deepwood', floors: false,
    sign: "the Sawyer's Camp",
    rows: [
      '~T~~~~~~T~',
      '~~###~~~~~',
      '~~#,,#~~T~',
      '~~#q,#~~~~',
      '~~##.##~~~',
      '~~~~*~~~~~',
      '~T~qq~~~T~',
      '~~~~~~~~~~',
    ],
  },
  // The King's Oak: a heartwood tree nobody may fell, walled round by somebody
  // who had no authority to wall it, with a stone giving a name and a date.
  kingswood: {
    name: "the King's Oak", locale: 'kingswood', floors: false,
    sign: "the King's Oak",
    rows: [
      '~~^^^^^~~',
      '~^~~~~~^~',
      '^~~~~~~~^',
      '^~~~T~~~^',
      '^~~~~~~~^',
      '~^~~D~~^~',
      '~~^^.^^~~',
    ],
  },
  // The Chase kennels. Long empty, the runs still fenced.
  hollychase: {
    name: 'the Chase Kennels', locale: 'hollychase', floors: true,
    sign: 'Hollybarrow Chase',
    rows: [
      '~fffffffff~',
      '~f~~~~~~~f~',
      '~f~#####~f~',
      '~f~#,,,#~f~',
      '~f~#h,,#~f~',
      '~f~##.##~f~',
      '~f~~~.~~~f~',
      '~ffff.ffff~',
    ],
  },

  // ---- THE CRAGS -----------------------------------------------------------
  // A mine head with the shaft still open and the windlass still standing.
  // Nothing is down there. There is no down there.
  highdelving: {
    name: 'the High Delving', locale: 'highdelving', floors: false,
    sign: 'the High Delving',
    rows: [
      '~~%%%%%~~',
      '~%~~~~~%~',
      '%~~~o~~~%',
      '%~~~~~~~%',
      '~%~q~q~%~',
      '~~%%.%%~~',
      '~~~~.~~~~',
    ],
  },
  // The Sentinel: one stone, twice the height of a man, and a smaller one at
  // its foot where people have been leaving names for a long time.
  sentinel: {
    name: 'the Sentinel', locale: 'sentinel', floors: false,
    sign: 'the Sentinel',
    rows: [
      '~~~~~~~',
      '~~~!~~~',
      '~~~~~~~',
      '~~~D~~~',
      '~~~~~~~',
    ],
  },
  // Cragfoot Scar: a slide came down on a watchtower and stopped halfway.
  cragscar: {
    name: 'the Buried Watchtower', locale: 'cragscar', floors: false,
    sign: 'Cragfoot Scar',
    rows: [
      '~~~%%~~~~',
      '~~%%.%~~~',
      '~%%..~~~~',
      '~%.~~~~~~',
      '%%~~~~~~~',
      '~~~~~~~~~',
    ],
  },

  // ---- THE DOWNS -----------------------------------------------------------
  // Drystone folds. You can get lost in them, briefly, which is the only thing
  // they do.
  sheepfolds: {
    name: 'the Sheepfolds', locale: 'sheepfolds', floors: false,
    sign: 'the Sheepfolds',
    rows: [
      '%%%%%%%%%%%%%',
      '%...%...%...%',
      '%...%...%...%',
      '%%.%%%.%%%.%%',
      '%...........%',
      '%%.%%%.%%%.%%',
      '%...%...%...%',
      '%...%...%...%',
      '%%%%%.%%%%%%%',
      '~~~~~.~~~~~~~',
    ],
  },
  // A barrow cut into white chalk, opened long ago, emptied by somebody who
  // did not write down what they took.
  whitechalk: {
    name: 'the Chalk Barrow', locale: 'whitechalk', floors: false,
    sign: 'Whitechalk',
    rows: [
      '~~%%%%%~~',
      '~%~~~~~%~',
      '%~~~B~~~%',
      '%~~~~~~~%',
      '~%~~.~~%~',
      '~~%%.%%~~',
      '~~!~.~!~~',
    ],
  },

  // ---- THE FENS ------------------------------------------------------------
  // The eel sheds: plank racks over standing water, and the smell got into
  // the wood a hundred years ago.
  eelmarsh: {
    name: 'the Eel Sheds', locale: 'eelmarsh', floors: true,
    sign: 'the Eel Sheds',
    rows: [
      '~~#####~~',
      '~~#v,v#~~',
      '~~#,,,#~~',
      '~~#v,v#~~',
      '~~##.##~~',
      '~~q~.~q~~',
      '~~~~.~~~~',
    ],
  },
  // The drowned bell: a chapel tower sunk to its shoulders in the fen. The
  // bell is still in it. Nobody has worked out how to get it out.
  fenmouth: {
    name: 'the Drowned Bell', locale: 'fenmouth', floors: false,
    sign: 'the Drowned Bell',
    // Solid: there is no way into it and that is the point -- the bell is in
    // there and nobody has worked out how to get it out. The stone stands on
    // the bank, where it can be read.
    rows: [
      '~~~~~~~',
      '~~%%%~~',
      '~%%%%%~',
      '~~%%%~~',
      '~~~D~~~',
    ],
  },

  // ---- THE HEARTLANDS ------------------------------------------------------
  // A hedge maze planted by somebody with time and no sense. There is nothing
  // in the middle. There was never going to be anything in the middle.
  thornvale: {
    name: 'the Thornvale Maze', locale: 'thornvale', floors: false,
    sign: 'the Maze',
    // A proper spiral: one winding path from the gate to the middle, and the
    // middle is a stone with nothing on it. The first cut had the gate one
    // column off the corridor, which made the whole thing a hedge with a door
    // into a hedge -- 66 of its 68 open cells unreachable.
    rows: [
      '^^^^^^^^^^^^^',
      '^...........^',
      '^.^^^^^^^^^.^',
      '^.^.........^',
      '^.^.^^^^^^^.^',
      '^.^.^.....^.^',
      '^.^.^.^^^.^.^',
      '^.^.^.D.^.^.^',
      '^.^.^...^.^.^',
      '^.^.^^^^^.^.^',
      '^.^.......^.^',
      '^.^^^^^^^^^.^',
      '^...........^',
      '^^^^^^.^^^^^^',
      '~~~~~~.~~~~~~',
    ],
  },
  // The Barrow Crown: the ring of stones on the crest, older than the road
  // that goes round it.
  barrow: {
    name: 'the Barrow Crown', locale: 'barrow', floors: false,
    sign: 'the Barrow Crown',
    rows: [
      '~~!~!~!~~',
      '~!~~~~~!~',
      '!~~~~~~~!',
      '~~~~B~~~~',
      '!~~~~~~~!',
      '~!~~~~~!~',
      '~~!~!~!~~',
    ],
  },
  // The ferryman's rest, at the meeting of the waters. Two rooms and a fire.
  // There has not been a ferry since the bridge.
  watersmeet: {
    name: "the Ferryman's Rest", locale: 'watersmeet', floors: true,
    sign: "the Ferryman's Rest",
    rows: [
      '~#######~',
      '~#,,#,,#~',
      '~#e,#h,#~',
      '~#,,~,,#~',
      '~##.###.#',
      '~~~.~~~.~',
    ],
  },
  // The Oxenlea mill. The wheel is gone; the tower is not.
  oxenlea: {
    name: 'the Oxenlea Mill', locale: 'oxenlea', floors: true,
    sign: 'the Old Mill',
    rows: [
      '~~%%%~~',
      '~%,,,%~',
      '%,,q,,%',
      '%,,,,,%',
      '~%,,,%~',
      '~~%.%~~',
      '~~~.~~~',
    ],
  },
}

// which chars are floorboards -- used to register interiors with loneRooms
export const PLACE_FLOOR = ','

// WHO IS THERE.
//
// An empty building is a diorama. What made the Black Knights' Fortress worth
// remembering is that walking into it at level three killed you, and what made
// the dark wizards on the Varrock road worth remembering is that they did not.
// Both are the same lesson: a place needs an inhabitant before it is a place.
//
// Deliberately small numbers, and deliberately no rewards. Nothing here drops
// anything worth farming, so none of these becomes a destination -- they stay
// what they are, which is something you meet on the way to somewhere else.
export const PLACE_MOBS = {
  boneyard:    [['skeleton-knight', 3]],   // bones, kept, and not entirely still
  deadreach:   [['skeleton-knight', 2], ['wolf', 1]],
  bleakfell:   [['sheep', 4]],             // somebody's, presumably
  deepwood:    [['bear', 1]],              // which is why the sawyer is not here
  kingswood:   [['wolf', 2]],
  hollychase:  [['wolf', 3]],              // the kennels did not stay empty
  highdelving: [['goblin', 3]],
  cragscar:    [['scree-imp', 2]],
  sentinel:    [],                         // nothing. It is a stone.
  sheepfolds:  [['sheep', 6]],
  whitechalk:  [['skeleton-knight', 1]],
  eelmarsh:    [['goblin', 2]],
  fenmouth:    [],
  thornvale:   [['goblin', 2]],            // living in a hedge maze, as one does
  barrow:      [['skeleton-knight', 2]],
  watersmeet:  [],
  oxenlea:     [],
  ninestone:   [],
}

// WHAT IS BEHIND THE DOOR.
//
// Eighteen buildings with doors and nothing on the other side is eighteen
// dioramas. §13c gave the ruins their dead and the kennels their dogs, which
// answered "is anything here"; it did not answer "is there any reason to go
// in", and a place you look at from outside is scenery however well drawn.
//
// So each one gets an INHABITANT or a THING, and neither is a reward. Nothing
// here drops loot, sells anything, or gates a skill. What they give is an
// answer to the question the building already asked -- who lived here, what
// were they doing, why did they stop -- and in a few cases a seam or a shoal
// that exists in exactly one place on the island, so that a citizen who works
// it is somewhere rather than anywhere.
//
//   keeper   a person, with a calling from the engine's own list
//   node     a resource or fixture, placed on a named tile of the drawing
//
// The callings are chosen from KEEPER_KINDS as it already stands: mourner,
// watchman, wizard, fisher, shepherd, collier, delver, beekeeper, drover.
// No new vocabulary -- the world already had words for all of these people
// and had simply never put any of them anywhere.
export const PLACE_INSIDE = {
  // a shepherd who has been up here since before anyone asked
  bleakfell:   { keeper: { kind: 'shepherd', name: 'Elric of the Bothy' } },
  // the sawyer, finally, at his own camp
  deepwood:    { keeper: { kind: 'sawyer', name: 'Osmund the Sawyer' },
                 nodes: [['oak-tree', 2], ['heartwood-tree', 1]] },
  // whoever keeps the Chase keeps the dogs
  hollychase:  { keeper: { kind: 'drover', name: 'Maud of the Chase' } },
  // a delver who never left the workings
  highdelving: { keeper: { kind: 'delver', name: 'Corwin Underhill' },
                 nodes: [['coal-rock', 3], ['iron-rock', 2]] },
  // the eel sheds work: somebody works them
  eelmarsh:    { keeper: { kind: 'fisher', name: 'Joan Eelwife' },
                 nodes: [['eel-spot', 3]] },
  // the ferryman, with no ferry since the bridge
  watersmeet:  { keeper: { kind: 'innkeeper', name: 'Gilbert the Ferryman' } },
  // the mill has no wheel and the miller has not noticed
  oxenlea:     { keeper: { kind: 'miller', name: 'Alys at the Mill' } },
  // somebody has to tend the bones
  boneyard:    { keeper: { kind: 'mourner', name: 'the Boneyard Warden' } },
  whitechalk:  { keeper: { kind: 'mourner', name: 'the Barrow Warden' } },
  // the King's Oak is watched, by a man with no authority to watch it
  kingswood:   { keeper: { kind: 'watchman', name: 'the Oak Warden' },
                 nodes: [['heartwood-tree', 1]] },
  // the Nine Stones have a reader, as stone circles do
  ninestone:   { keeper: { kind: 'wizard', name: 'Nona of the Stones' } },
  // and the Sentinel has nobody, deliberately. It is a stone.
  sentinel:    {},
  fenmouth:    {},
  // the maze has a keeper who will not tell you the way
  thornvale:   { keeper: { kind: 'watchman', name: 'the Maze Warden' } },
  // the folds are worked
  sheepfolds:  { keeper: { kind: 'shepherd', name: 'Wat of the Folds' } },
  // the tower is not empty, but nobody in it is talking
  deadreach:   {},
  cragscar:    { nodes: [['coal-rock', 2]] },
  barrow:      {},
}
