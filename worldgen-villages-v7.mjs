// THE VILLAGES OF TALLYHOLM -- the rung between a holding and a town.
//
// THE MEASUREMENT THAT PROMPTED THIS. Every settlement footprint on the
// island, in tiles:
//
//   Anchor 1872 | Thornbury 1020 | Oxenford 1008 | Eastmere 912 | Cragfoot 896
//   Hollybarrow 864 | Norwick 816 | Fenmarch 792 | Millbrook 720 | Greenhollow 704
//
// One capital, and then NINE TOWNS INSIDE A 1.45x SPREAD. A rank-size
// distribution off Anchor would put the tenth settlement near 190 tiles;
// Greenhollow is 704. The tail is four times too fat, and the shape of that
// error is not "the towns are too big" -- it is that there is nothing between
// a holding (one family, ~20 tiles, see worldgen-holdings-v7) and a town.
//
// The holdings file already fixed the bottom of this ladder and its note is
// the right one: a road that ends at somebody's door implies a person who is
// not on the map. What it could not fix is the MIDDLE, because a farmstead is
// not a place with a name on the chart and a town is not a place you pass
// through.
//
// WHAT A VILLAGE IS, AND WHAT IT IS NOT:
//
//   150-250 tiles          a tenth of the capital, a quarter of a town
//   NO BANK                the whole of the definition -- see below
//   one function           it does one thing and has no opinion on the rest
//   a name already on      every one of these is seated at a LOCALE that has
//     the chart              been named since v4 and had nothing in it
//   beside a road you      not at the end of one. Rimmington, Draynor and
//     were walking           Barbarian Village are all things you pass.
//
// THE BANK IS THE WHOLE DEFINITION, and it costs nothing to enforce. A drawn
// settlement is laid by layDrawnTown, which never runs the vaultFill in
// layTown; a drawn town's bank comes from a 'B' glyph in its own art. So a
// village has no bank by NOT DRAWING ONE, and that single omission is what
// makes distance from a bank a real cost for the first time -- which is what
// the toll in §14b has been quietly asking for since it was written. You
// cannot smoke an eel at Eelmarsh and dump it; you have to carry it out.
//
// WHY THESE FIVE PLACES. Each already had a PLACE drawn in it (the Eel Sheds,
// the Old Mill, the Ferryman's Rest, the Bothy) and each of those was a
// building standing alone with nobody in the country around it. A place is a
// thing you find; a village is somewhere people live. The four that overlap
// are ABSORBED -- the drawing here contains the shed, the mill, the rest and
// the bothy, and the corresponding entries come out of PLACES_V7. The
// King's Oak is the exception and stays exactly where it is: a tree nobody
// may fell, walled by somebody with no authority, is supposed to be alone in
// the wood.
//
// THE LEGEND is the shire's, plus one character. See VILLAGE_LEGEND.

import { LEGEND_V6 } from './worldgen-shire-v6.mjs'

// 'R' -- A SMOKERACK, and the one new node type on this page.
//
// NOT 'rack'. `eel-rack` is already a landmark KIND in the engine's fen group
// beside `sunken-wall` -- decorative plank racks over standing water. Two
// nouns one letter apart, one of them scenery and one of them holding your
// dinner, is a bug waiting for whoever reads this next.
//
// The shire legend already has 'v' for a shelf, and the Eel Sheds were drawn
// with four of them years before anything could be done with one. A shelf is
// a `landmark`: it is furniture, it is scenery, and nothing may be left on it.
// A rack is a rack: it holds one citizen's catch for a fixed number of
// intervals and hands it back changed. That is a different noun and it earns
// its own glyph, the way the fountain did in v6.
//
// FOUR OF THEM, WORLD-WIDE, and the number is not a balance figure -- it is
// what the drawing has said since the sheds were first put on the map.
export const VILLAGE_LEGEND = { ...LEGEND_V6, R: 'smokerack', O: 'landmark' }

// 'O' -- AN AVENUE OAK, and the reason it is not 'T'.
//
// 'T' in the shire legend is a `tree` node, and a tree node is GATHERABLE:
// logs, woodcutting, twenty experience, hardness one. Nine of them round a
// village is not scenery, it is nine seam-table entries that were never in
// the seam table -- the exact fault §7z names when it says A PLACE MAY NOT
// SEED A TIER, and the reason the Sawyer's Camp lost its two oaks.
//
// The engine already has trees no verb reaches: willow, dead-tree, pine,
// wind-thorn, yew, old-oak-lm, thorn, apple-tree, pear-tree, avenue-oak.
// They are `landmark` kinds, so nothing may be cut from them and a country
// can have trees the way a country does.
//
// AVENUE-OAK is the right one here and not merely a safe one. Its own note in
// the engine says it is the only tree on that list that says a person did it
// on purpose -- and a planted avenue standing outside the lodge of the officer
// who licenses felling is exactly the joke the Kingswood wants. Oaks nobody
// may cut, in front of the man who decides what may be.
//
// Laid with `landmarkKind: 'avenue-oak'` for this plan, the same way layPlan
// already resolves '!'. Kingswood carries no '!', so one kind per plan is
// enough and no engine change is needed.
export const VILLAGE_LANDMARK_KIND = { kingswood: 'avenue-oak' }

// ---------------------------------------------------------------------------
// THE DRAWINGS
//
// Same format as the shire: one character, one node. Validated by the shire's
// own validatePlan (a ragged row throws) and checkPlanConnected (a room you
// cannot walk into throws).
//
//   %  rampart      #  wall        "  hedge      f  fence
//   ,  floor        .  open street ' ' terrain wins
//   o  well         h  hearth      *  campfire   i  signpost
//   e  table        d  bed         v  shelf      q  barrel
//   R  rack         T  tree        n  rock       F  fishing-spot
//   k  keeper       S  store       ! landmark
//
// NO 'B'. NO 'A'. NO 'U'. NO 'G'. A village has no bank, no anvil, no
// fountain and no gate guard -- it is not walled and there is nothing to
// guard. Where a village has a keeper it is a person with a trade, not a
// counter.
// ---------------------------------------------------------------------------
export const VILLAGE_PLANS = {

  // -------------------------------------------------------------------------
  // EELMARSH, in the fens. THE CURING VILLAGE.
  //
  // Plank walks over standing water and four drying racks in two sheds, which
  // is what the place drawing already said: racks over standing water, and the
  // smell got into the wood a hundred years ago.
  //
  // The function is SMOKING, and it is the only place on the island that does
  // it. Salting is at Whiting, over the water; cooking is at any fire; smoking
  // is here, on four racks, and the racks are why there is no bank.
  //
  // Deliberately no store and no stall. Joan Eelwife keeps the sheds. Nobody
  // here sells anything, because a village that sold you something would be a
  // town.
  // -------------------------------------------------------------------------
  eelmarsh: [
    '     .......     ',
    '  ####.....####  ',
    '  #R,v#...#v,R#  ',
    '  #,,,#...#,,,#  ',
    '  #R,h#...#h,R#  ',
    '  ##,##...##,##  ',
    '  ..,.......,..  ',
    '  .....o.i.....  ',
    '  ##,####..##,#  ',
    '  #,,,,,#..#,,#  ',
    '  #q,e,d#..#k,#  ',
    '  ##,####..####  ',
    '   ..........    ',
    '     .....       ',
  ],

  // -------------------------------------------------------------------------
  // OXENLEA, on the road between Oxenford and the capital. THE MILL VILLAGE.
  //
  // The place drawing said: the wheel is gone; the tower is not. So the tower
  // stands here at the north end with a miller in it, and the wheel is the
  // first small raising -- planks, a manifest, names cut into the tower, and
  // it rots.
  //
  // The function is GRAIN TO FLOUR, which §7j already says happens at a mill
  // and nowhere else. Bread is two steps and a destination, and this is the
  // destination. A granary, three cottages and a yard where carts turn.
  // -------------------------------------------------------------------------
  oxenlea: [
    '      %%%%%      ',
    '     %%,,,%%     ',
    '     %,,,e,%     ',
    '     %%,,k%%     ',
    '      %%,%%      ',
    '  ......,......  ',
    '  ##,####..####  ',
    '  #q,,,,#..#,,#  ',
    '  #,,,v,#..#h,#  ',
    '  ######...#,##  ',
    '  ...o...i.....  ',
    '  ####..####..#  ',
    '  #,h#..#,d#..#  ',
    '  #,,,..,,,,..#  ',
    '  ####..####..#  ',
    '   ...........   ',
  ],

  // -------------------------------------------------------------------------
  // WATERSMEET, at the meeting of the waters. THE BOATYARD.
  //
  // Not a rival crossing -- the Watersmeet Bridge is four tiles away and free,
  // and §14a measured that shutting it lengthens two journeys in forty-five.
  // This is where a HULL IS BUILT, by the man a bridge already ruined once.
  //
  // The function is BOATBUILDING, and the thing it exists to build is the
  // Millbrook ferry: the boat that carries a citizen across the one crossing
  // on the island that is worth anything, with a full pack and no log for the
  // toll. A boat is planks and it rots, so the yard never finishes.
  //
  // The Ferryman's Rest is absorbed: two rooms and a fire, at the south end,
  // with Gilbert still in it.
  // -------------------------------------------------------------------------
  watersmeet: [
    '   ...........   ',
    '  ####...####..  ',
    '  #v,#...#,q#..  ',
    '  #,,,...,,,#..  ',
    '  ####...####..  ',
    '  ....o...i....  ',
    '  .............  ',
    '  ff.fff...ff.f  ',
    '  f....f...f..f  ',
    '  f....f...f..f  ',
    '  ffffff...ffff  ',
    '  .............  ',
    '  ####,#####     ',
    '  #h,,,,,e,#     ',
    '  #,d,#,k,,#     ',
    '  #####,####     ',
    '     .....       ',
  ],

  // -------------------------------------------------------------------------
  // THE KINGSWOOD, under the eaves. THE WOODWARD'S VILLAGE.
  //
  // A woodward is an officer who licenses felling, and Beorn the Woodward has
  // had a lodge in this country and no village around it. This is the village:
  // the lodge at the centre with its hearth, a hedge round the yard, and four
  // houses that answer to it.
  //
  // The function is the OFFICE, which is the point -- it is held by whoever
  // keeps the lodge fire lit and it lapses when the fire goes cold. The first
  // thing on Tallyholm that is held rather than earned, and can be taken.
  //
  // The King's Oak is NOT here. It stands where it stood, walled, alone,
  // ninety-nine tiles from the nearest road until §13 gave the country a
  // track. A tree nobody may fell does not want neighbours.
  // -------------------------------------------------------------------------
  kingswood: [
    '    O....O.O     ',
    '  """""".""""""  ',
    '  "...........O  ',
    '  ".####,####..  ',
    '  ".#v,,,h,e#..  ',
    '  ".#,,,,,,,#.O  ',
    '  ".#q,k,,,d#..  ',
    '  ".#####,###..  ',
    '  "......,.....  ',
    '  "..o...,...i.  ',
    '  ".##,##.##,##  ',
    '  O.#,,,#.#,,,#  ',
    '  ".#h,q#.#v,h#  ',
    '  ".#####.#####  ',
    '  """""".""""""  ',
    '   O..O....O     ',
  ],

  // -------------------------------------------------------------------------
  // BLEAKFELL, on the moor. THE LAST ROOF.
  //
  // On the road up to the Moorgrave and past it to the Gibbet King, which is
  // the worst fight in the world. Its function is being the LAST SHELTER
  // before that, and the first one you see coming back with the bones.
  //
  // That is the whole of it. There is nothing to buy here, nothing to make,
  // and no reason to come except that it is on the way and it is the only
  // roof. White Wolf Mountain was never a mechanic; it was that everybody
  // knew where the last warm room was and what it meant to walk past it.
  //
  // The bothy is absorbed: one room, a cold hearth, a bed somebody still uses,
  // and Elric, who has been up here since before anyone asked. Drystone, low,
  // and huddled -- '%' throughout, because on the moor you build with what is
  // lying on the moor.
  // -------------------------------------------------------------------------
  bleakfell: [
    '    ......    ',
    '  %%%%,%%%%%  ',
    '  %h,,,,,e,%  ',
    '  %,d,,,,,,%  ',
    '  %%,%%%%,%%  ',
    '  ..,....,..  ',
    '  ....o.....  ',
    '  %%,%%.%%,%  ',
    '  %,,,%.%,,%  ',
    '  %q,k%.%h,%  ',
    '  %%%%%.%%%%  ',
    '  ....i.....  ',
    '   .........  ',
    '    .....     ',
  ],
}

// WHERE THEY SIT. Each at the centre of a locale that has carried its name
// since v4, found the same way junctionsOf finds the two tracks in §13 --
// localeCentre, then seatPoint. No hand-typed coordinates: redraw the coast
// tomorrow and these follow it.
//
// `kind` is 'village' for all five, and that value appears in exactly one
// place in the seater: it is NOT in the list that seats a store, so a village
// gets no counter, and it is not 'capital', so it gets no bank. Everything
// else about a village comes from its own drawing.
export const VILLAGES = [
  { tag: 'eelmarsh',   name: 'Eelmarsh',      locale: 'eelmarsh',   kind: 'village', ring: 'frontier' },
  { tag: 'oxenlea',    name: 'Oxenlea',       locale: 'oxenlea',    kind: 'village', ring: 'shire'    },
  { tag: 'watersmeet', name: 'Watersmeet',    locale: 'watersmeet', kind: 'village', ring: 'shire'    },
  { tag: 'kingswood',  name: 'Woodwardstead', locale: 'kingswood',  kind: 'village', ring: 'frontier' },
  { tag: 'bleakfell',  name: 'Bleakfell',     locale: 'ninestone',  kind: 'village', ring: 'frontier' },
]

// WHAT THE SIGN SAYS. Same law as SIGN_TEXT in the generator: the text is on
// the node, in the hashed state, so every window reads the same words and will
// still read them in a year. A village's sign says what the village is FOR,
// because that is the one thing a citizen cannot guess from four cottages.
export const VILLAGE_SIGNS = {
  eelmarsh: 'Eelmarsh. Four racks and no bank \u2014 what you smoke here you carry out yourself.',
  oxenlea: 'Oxenlea. Grain to flour, and the wheel is still off the tower.',
  watersmeet: 'Watersmeet. Boats, and a ferryman with no ferry. Ask Gilbert what he is building.',
  kingswood: 'Woodwardstead. Beorn keeps the wood and the lodge fire. Fell nothing without asking.',
  bleakfell: 'Bleakfell. The last roof. Past here the moor keeps its own hours.',
}

// THE ROADS. A village must be BESIDE a road you were already walking, which
// means these are not new spurs to new leaves -- four of the five sit on
// segments that already exist, and the fifth (Eelmarsh) gets the one link the
// fens never had. Tags continue the generator's numbering from 123.
//
// Two of these REPLACE a segment rather than adding one: the road that ran
// through the Watersmeet junction and the track that ran to the Ninestone
// junction now run to the village standing there, because a junction with a
// village on it is not a junction any more.
// THE ROOMS, found by flooding each interior and taking its bounding box --
// the same method roomfind.mjs uses on the towns, and for the same reason: a
// hand-typed list drifts from the drawing the first time somebody moves a
// wall. PLAN_ROOMS has two readers: the stall seater (which a village never
// calls) and isIndoor, which the PAVING consults. A room left off this list
// is a room the world believes is outdoors, and its floor gets flagged as
// street -- the fault §7bd was written to fix.
export const VILLAGE_ROOMS = {
  eelmarsh:   [[3,2,3,5],[11,2,3,5],[3,8,5,4],[12,8,2,3]],
  oxenlea:    [[6,1,4,5],[3,6,5,3],[12,7,2,2],[3,12,3,2],[8,12,4,2]],
  watersmeet: [[3,2,3,2],[9,2,3,2],[4,12,5,4],[9,13,2,2]],
  kingswood:  [[5,3,7,7],[5,10,3,3],[11,10,3,3]],
  bleakfell:  [[4,1,7,5],[3,7,3,3],[9,7,2,3]],
}

// THE PLACES THESE SUPERSEDE. Four of the five absorb a place that was
// standing alone in an empty country; the drawing above contains it. Remove
// these four keys from PLACES_V7, PLACE_MOBS and PLACE_INSIDE, and keep their
// keepers -- Joan Eelwife, Gilbert the Ferryman, Elric of the Bothy -- who are
// drawn into the villages as 'k'.
//
// kingswood is NOT on this list. The King's Oak stays where it stands.
export const SUPERSEDED_PLACES = ['eelmarsh', 'watersmeet', 'oxenlea', 'bleakfell']

export const VILLAGE_ROAD_NOTE = `
  [j.watersmeet -> s.watersmeet]  segs 104, 107, 121 now terminate at the village
  [j.ninestone  -> s.bleakfell ]  seg 114 now terminates at the village
  [s.oxenford,  s.oxenlea,  124]  the mill sits on the Oxenford-Anchor road
  [s.oxenlea,   s.anchor,   125]
  [s.greenhollow, s.kingswood, 115] retargeted from j.kingswood to the village
  [s.fenmarch,  s.eelmarsh, 126]  the fens finally reach the sheds
  [s.eelmarsh,  s.anchor,   127]
  [s.bleakfell, j.moorgrave, 128] the last roof, and then the road goes on
`
