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
      '~%~~~g~~~%~',
      '~~~g~~~g~~~',
      '%~~~~D~~~~%',
      '~~~g~~~B~~~',
      '~%~~~g~~~%~',
      '~~%%~~~%%~~',
    ],
  },
  // A tower with no roof and no stair, four days' walk from anywhere, and
  // whoever built it is not on any list.
  // §7ab: THE MOORGRAVE. The one big place on Tallyholm.
  //
  // Everything a citizen walks into here is small: a cottage is three by four,
  // the training yard is nine by six, the largest drawn place before this was
  // the Barrow Crown. That is a world of rooms and no HALLS, and a landscape
  // wants somewhere that takes a while to cross.
  //
  // Twenty-nine by seventeen, on the open moor, on the road that runs up to the
  // Gibbet King -- so it is a thing you pass on the way to the worst fight in
  // the world, and a thing you pass again coming back with the bones. The
  // ossuary inside is the point: kill on the moor, bury on the way home,
  // consecrated. It closes a loop that had no middle.
  //
  // Not the Boneyard again. The Boneyard is bones lying in the open Wilds where
  // nobody put them. This is a graveyard: walled, gated, laid out in rows, with
  // a mort-house and a mourner and yews at the corners. Somebody dug these.
  moorgrave: {
    name: 'the Moorgrave', at: { x: 330, y: 118 }, locale: 'ninestone', floors: true,
    sign: 'the Moorgrave',
    rows: [
      '~~~RRRRRRRRRRRRRRRRRRRRRRR~~~',
      '~~RR,,,,,,,,,,,,,,,,,,,,,RR~~',
      '~RR,,W,,,,,,,,,,,,,,,,,W,,RR~',
      'RR,,,,,,g,g,g,,,,,g,g,g,,,,RR',
      'R,,,###########,,,,,,,,,,,,,R',
      'R,,,#,,,,,,,,#,,g,g,g,g,g,,,R',
      'R,,,#,,B,,,,,#,,,,,,,,,,,,,,R',
      'R,,,#,,,,,,k,#,,g,g,g,g,g,,,R',
      'R,,,#,,,,,,,,#,,,,,,,,,,,,,,R',
      'R,,,#####.####,,g,g,g,g,g,,,R',
      'R,,,,,,,,,,,,,,,,,,,,,,,,,,,R',
      'R,,,,,,,,,,,,,,,,,,,,,,,,,,,R',
      'R,,,,,,RRR,,,,,,g,g,g,g,g,,,R',
      'R,,,,,,RZR,,,,,,,,,,,,,,,,,,R',
      'R,,,,,,RRR,,,,,,g,g,g,g,g,,,R',
      'R,,,,,,,,,,,,,,,,,,,,,,,,,,,R',
      'RR,,g,g,g,,,,,,,,,,g,g,g,,,RR',
      '~RR,,,,,,,,,,,,,,,,,,,,,,,RR~',
      '~~RR,,W,,,,,,,,,,,,,,,W,,,RR~',
      '~~~RRRRRRRR,,,,,RRRRRRRRRRR~~',
      '~~~~~~~~~~~~,,,~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~,,,~~~~~~~~~~~~~~',
    ],
  },
  // §7dn: THE RUINED TOWER, redrawn so you can read what it was.
  //
  // It was an octagon of rampart with a hearth in the middle and one gap for a
  // door: a shape, but not a RUIN -- a ruin drawn as an unbroken ring is just a
  // small fort, and the only thing it said about its own history was that it
  // had none.
  //
  // What makes ruin legible is that it is BROKEN IN A SHAPE. The Wilderness
  // this island keeps being measured against does it exactly so: one wall
  // standing to its full height with a window still in it, a stump of tower
  // beside it, a course of stone at knee height where the rest went, and the
  // rubble lying where it fell. From that a citizen reads a building. From a
  // scatter of stones they read nothing.
  //
  // The north wall still stands ('%'), and its window ('w') is the thing you
  // see from four days away. The east wall is down to knee height ('j') and
  // you step over it, which is what turns the drawing into a FLOOR PLAN a
  // citizen paces rather than a silhouette they walk around. The south-west
  // corner fell outward and is lying there ('x', 'k'). The hearth is still in
  // the middle because a hearth is the last thing to go.
  //
  // No roof, no stair, four days' walk -- and now the drawing says so.
  deadreach: {
    name: "the Ruined Tower", locale: 'deadreach', floors: false,
    sign: "Deadman's Reach",
    rows: [
      '~~%%w%%~~',
      '~%%...%%~',
      '~%..h..j~',
      '~%.....j~',
      '~j%...%j~',
      '~~x%.%~~~',
      '~k~~.~x~~',
      '~~Y~~~~~~',
    ],
  },

  // ---- THE GREENWOOD -------------------------------------------------------
  // The sawyer's camp: a lean-to, a fire, a stack of what he cut. He is not
  // here today either.
  // §7bt: THE GREENWOOD HAD NO EXCUSE.
  //
  // Measured tiles-per-node by country: the heartlands 14, the downs 21, the
  // crags 27, the moor 28, the fens 37 -- and the GREENWOOD 68, second only to
  // the Wilds at 111. The Wilds is meant to be bare; that emptiness is what it
  // is for, and a world with nowhere empty reads as built rather than found.
  // The Greenwood is the timber country, the whole reason woodcutting exists,
  // and it was the emptiest place on the island that had a reason to be full.
  //
  // Three camps, the work of the wood: burning, felling, and the man who counts
  // what leaves it.
  charcoalcamp: {
    name: "the Burners' Camp", locale: 'kingswood', floors: false,
    sign: "the Burners' Camp",
    rows: [
      '~T~~~~~~~~T~',
      '~~~######~~~',
      '~T~#,,k,#~~~',
      '~~~#,h,,#~T~',
      '~~~##,###~~~',
      '~T~~,~~~~~T~',
      '~~~~,~~~~~~~',
      '~T~!~~~!~~T~',
      '~~~~~~~~~~~~',
      '~T~~~~T~~~T~',
    ],
  },
  woodward: {
    name: "the Woodward's Lodge", locale: 'hollychase', floors: true,
    sign: "the Woodward's Lodge",
    rows: [
      '~~T~~~~~~~~~',
      '~#########~~',
      '~#v,,e,,d#~T',
      '~#,,,,,,,#~~',
      '~#,h,k,,q#~~',
      '~####,####~~',
      '~~~~~,~~~~~~',
      'T~~~~,~~~T~~',
      '~~~~~~~~~~~~',
      '~~T~~~~T~~~~',
    ],
  },
  fellingstead: {
    name: 'the Felling Stead', locale: 'deadreach', floors: false,
    sign: 'the Felling Stead',
    rows: [
      '~~T~~~~~~T~~',
      '~~~~~~~~~~~~',
      '~T~#####~~~~',
      '~~~#,k,#~T~~',
      '~~~#,,h#~~~~',
      '~~~##,##~~~~',
      '~T~~,~~~~T~~',
      '~~~!,~!~~~~~',
      '~~~~~~~~~~~~',
      '~T~~~T~~~T~~',
    ],
  },
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
  // §7dq: THE SMOTHER -- a hole in the crags with things in it that steel does
  // not touch.
  //
  // A DEAD END, and that is deliberate: the same lesson the cleat cost a whole
  // build. A tunnel that is the short way somewhere competes with the long way
  // and wins for anybody carrying a torch, which quietly undoes whatever work
  // opened the long way. This goes nowhere. It has a bottom, and something at
  // the bottom, and the only reason to be in it is that you meant to be.
  //
  // THE MOUTH ASKS FOR FIRE. Not a level, not a tool tier -- something burning,
  // which anybody may bring at any level and nobody carries by accident. The
  // same axis the squeeze reads and the toll reads: forethought.
  //
  // Solid rock, one gap, exactly as the barrow had to be: '~' is nothing, the
  // country shows through, and a ring of corners is not a ring.
  smother: {
    name: 'the Smother', locale: 'cragscar', floors: false,
    // §7ds: A BOARD OUTSIDE, because a wall with no explanation is a puzzle
    // box and not a place.
    //
    // A citizen learned this cave wanted fire by walking to the mouth and
    // being refused, with nothing telling them why. That is the whole
    // quest-giver this world needs: a sentence on a post, and the citizen
    // works out the rest. It spoils nothing -- it does not say a torch, it
    // says what is true of the dark -- and it turns a refusal into an
    // invitation.
    sign: 'the Smother. What is in there does not take steel, and it does not like a light.',
    // §7dr: A CAVE-MOUTH INSIDE A CAVE IS A DOOR IN THE MIDDLE OF A ROOM.
    // The first draft put one at the centre, which said nothing except that
    // whoever drew it had not pictured standing in the place. You are already
    // in the cave. The mouth is the gap at the bottom and needs no marker: the
    // dark either side of it is the marker.
    //
    // AND IT HAD TO GET BIGGER. A fire deep inside is only a checkpoint if
    // there is a depth for it to be at the bottom of -- a hearth eight tiles
    // from daylight is a hearth beside the door. So: a mouth, an upper
    // chamber, a throat one tile wide, and a lower hall with the fire in it.
    // A citizen with a guttering torch has to decide whether to press on to
    // the fire or turn round, and that decision is the whole cave.
    //
    // Solid rock throughout, one gap, exactly as the barrow had to be: '~' is
    // nothing and the country shows through, so a ring of corners is not a
    // ring.
    rows: [
      '~~%%%%%%%%%~~',
      '~%%.......%%~',
      '%%.........%%',
      '%.....*.....%',
      '%...........%',
      '%%.........%%',
      '~%%.......%%~',
      '~~%%.....%%~~',
      '~~~%%...%%~~~',
      '~~~~%%.%%~~~~',
      '~~~~~%.%~~~~~',
      '~~~~~%.%~~~~~',
      '~~~~%%.%%~~~~',
      '~~~%%...%%~~~',
      '~~%%.....%%~~',
      '~%%.......%%~',
      '~~%%%%.%%%%~~',
      '~~~~~~.~~~~~~',
    ],
  },
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
  // §7dn: THE CHALK BARROW, and A RING WITH GAPS IN IT IS NOT A RING.
  //
  // This was drawn as a mound: '%' at the corners and '~' between them, which
  // LOOKS enclosed on a chart and is not. '~' is nothing -- the country shows
  // through and a citizen walks over it -- so the old drawing's chamber was
  // reachable from outside on all nineteen of its tiles, without ever going
  // near the door. Measured, not guessed: a flood-fill from outside the
  // drawing, refusing the door tile, reached every single one.
  //
  // AND IT WAS TRUE OF EVERY PLACE ON THE ISLAND. Not one of the eighteen
  // enclosed a tile. Every drawing was a silhouette you walk around rather
  // than a room you go into, which is why nothing has ever been INSIDE one.
  //
  // Movement is eight-way and the destination is the only tile the engine
  // checks, so a citizen may cut a corner between two walls. A ring therefore
  // has to be solid: every tile of it '%', with exactly one gap, and that gap
  // is the only way through. Then the door means something -- and the squeeze
  // on it means something, because there is now an inside for it to keep.
  whitechalk: {
    name: 'the Chalk Barrow', locale: 'whitechalk', floors: false,
    sign: 'Whitechalk',
    rows: [
      '~%%%%%%%~',
      '~%.....%~',
      '~%.H.g.%~',
      '~%.....%~',
      '~%.....%~',
      '~%%%.%%%~',
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
    name: 'the garrow Crown', locale: 'barrow', floors: false,
    sign: 'the garrow Crown',
    rows: [
      '~~!~!~!~~',
      '~!~~~~~!~',
      '!~~~~~~~!',
      '~~~~g~~~~',
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
  // §7dq: four of them, and steel does nothing at all to any of them
  // §7dr: eight, in eighty-one tiles across two chambers and a throat. Four
  // was a cave you walked through; eight is a cave you fight through, and the
  // fire at the bottom is worth reaching.
  smother:     [['quencher', 8]],
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
  charcoalcamp: { keeper: { kind: 'collier', name: 'Hesta the Burner' } },
  woodward:     { keeper: { kind: 'lumber', name: 'Beorn the Woodward' } },
  fellingstead: { keeper: { kind: 'lumber', name: 'Wulf at the Felling' } },
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
