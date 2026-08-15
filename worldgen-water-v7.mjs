// THE INLAND WATERS OF TALLYHOLM, drawn by hand.
//
// The island had exactly one piece of water that was not the sea or the Great
// River: Stillwater, a single ellipse in the north-east. Everything else was
// coast, and all of the coast was on the outer edge of the map where nobody
// walks. Compare the map this island is measured against, where an enormous
// share of the interest comes from water INSIDE the landmass -- a central sea
// with three islands in it, the lakes at Hemenster and Baxtorian, the swamp
// south of Lumbridge. Coast is where things happen. A country whose only
// shoreline faces outward has hidden all of it behind a two-minute walk to the
// edge of the world.
//
// So: MERES, TARNS, POOLS and BECKS, each placed by hand on the frozen island
// and each answering to its own country.
//
// A tarn is not a lake with a smaller number. A tarn is high, cold, round and
// steep-sided and sits in a corrie in the Crags. A mere is low, wide, shallow
// and reed-fringed and sits in the Fens. A moss pool is peat-black and lies in
// a hollow on the Moor. The shapes below say which is which.
//
// TWO RULES, both learned the hard way elsewhere in this founding:
//
//   Water must not cut the island in half. Every one of these is STANDING
//   water -- a closed shape -- except the becks, which are short and run into
//   water that already exists. A beck that crosses a road leaves a FORD, which
//   is drawn as a gap in the beck rather than as a new mechanism.
//
//   And the founding checks. `frozen.mjs` and the connectivity audits run
//   after these are laid, because a lake in the wrong place does not look
//   wrong, it just quietly makes a town unreachable.

// A water is { x, y, rx, ry, kind, name }, and it is NOT an ellipse.
//
// The first cut was: perfect ellipses with a per-tile hash jitter on the edge.
// Two things were wrong with it and both are visible from across the room. A
// lake is not round -- a real one has lobes, a bay, a headland, an outflow
// corner -- and per-TILE noise does not fix that, because it varies at the
// wrong frequency: it makes a fuzzy, speckled rim on a shape that is still
// obviously a circle. Compare the water on the map this island is measured
// against: every piece of it is irregular at a scale of tens of tiles.
//
// So the radius varies with the ANGLE, smoothly, from three harmonics whose
// phases are hashed off the water's own name. That gives lobes at the scale a
// lake has lobes, and a shoreline that is still smooth tile to tile.
//
// `k` scales how strongly a water is deformed. A tarn sits in a rock basin and
// is nearly round; a fen mere is shapeless and sprawls. The number is the
// geology, not a style setting.
export const SHAPE_K = { tarn: 0.10, pond: 0.20, moss: 0.26, mere: 0.34 }
export const WATERS = [
  // ---- THE HEARTLANDS: old flooded workings and a millpond ----
  // NOT 496,300: that put 245 of its 323 tiles ON THE BARROW -- a lake on top
  // of a burial mound, which is exactly the kind of thing that looks fine in a
  // table and absurd on a chart. It sits below the mound's southern flank now,
  // which is where water off a hill would actually gather.
  { x: 476, y: 324, rx: 13, ry: 8, kind: 'mere', name: 'the Barrow Mere' },
  { x: 430, y: 246, rx: 7, ry: 5, kind: 'pond', name: 'the Millpond' },
  { x: 372, y: 262, rx: 9, ry: 6, kind: 'mere', name: 'Oxenmere' },
  { x: 540, y: 268, rx: 3, ry: 2, kind: 'pond', name: null },

  // ---- THE GREENWOOD: dark water under the trees ----
  { x: 476, y: 92, rx: 19, ry: 10, kind: 'mere', name: 'the Blackwater' },
  { x: 566, y: 130, rx: 4, ry: 3, kind: 'pond', name: null },
  { x: 588, y: 88, rx: 7, ry: 5, kind: 'pond', name: "the Sawyer's Pool" },   // clear of ridge and oak

  // ---- THE CRAGS: tarns, high and cold ----
  { x: 700, y: 176, rx: 8, ry: 7, kind: 'tarn', name: 'the Black Tarn' },
  { x: 748, y: 214, rx: 6, ry: 5, kind: 'tarn', name: 'Sentinel Tarn' },
  { x: 664, y: 236, rx: 3, ry: 3, kind: 'tarn', name: null },

  // ---- THE MOOR: peat-black hollows ----
  { x: 300, y: 108, rx: 9, ry: 6, kind: 'moss', name: 'the Bleak Water' },
  { x: 250, y: 142, rx: 3, ry: 3, kind: 'moss', name: null },
  { x: 340, y: 88, rx: 3, ry: 2, kind: 'moss', name: null },

  // ---- THE FENS: broad shallow meres, which is what a fen IS ----
  // THE GREAT MERE, and it is now great. Nineteen waters that were all much
  // the same size (a 9:1 spread, nothing under sixty tiles) read as a scatter
  // of blobs however good each outline is -- variety of SCALE is doing most of
  // the work on the map this island is compared with, where one enormous body
  // with islands in it sits among a dozen little ones.
  { x: 352, y: 396, rx: 34, ry: 14, kind: 'mere', name: 'the Great Mere' },
  { x: 268, y: 376, rx: 17, ry: 8, kind: 'mere', name: 'the West Mere' },
  { x: 534, y: 392, rx: 12, ry: 6, kind: 'mere', name: 'Eelmere' },
  { x: 424, y: 420, rx: 5, ry: 3, kind: 'pond', name: null },       // a fen pool

  // ---- THE DOWNS: chalk holds no water, so there is almost none ----
  // (the dew ponds in worldgen-country-v7 are man-made, and that is the point)
  { x: 690, y: 300, rx: 4, ry: 3, kind: 'pond', name: 'the Sheep Wash' },

  // ---- THE WILDS: one, and it is not a nice one ----
  { x: 150, y: 268, rx: 14, ry: 9, kind: 'moss', name: 'the Drowning Pool' },
]

// BECKS. Short watercourses that run from somewhere to somewhere -- out of a
// tarn, down off the chalk, into the river or the sea. Each is a polyline,
// joined tile to tile, one tile wide. `fords` names the points where a road
// crosses and the water is left out, so a beck never severs a route.
export const BECKS = [
  // A BECK THAT STOPS IN A FIELD IS A CANAL SOMEBODY ABANDONED.
  //
  // The first five rose properly out of a mere and then simply ENDED -- four
  // of the five in open grass, measured. Water does not stop; it reaches other
  // water or it reaches the sea. And they ran on two or three bends across
  // sixty tiles, which reads as surveyed: a straight watercourse looks dug.
  //
  // Each of these now runs from a named body to the Great River, the sea or
  // another water, in eight to twelve reaches, and each was checked against
  // every town, place and holding on the island. The first cut of THESE ran
  // straight through Eastmere and through Oxenford.
  { name: 'the Black Beck', path: [
    [700, 183], [697, 191], [692, 197], [688, 205], [683, 210],
    [677, 214], [672, 221], [668, 228], [665, 233]] },          // into the tarn below

  // off the chalk, round the east of Eastmere, to the sea
  { name: 'the Sheep Beck', path: [
    [690, 304], [696, 308], [705, 310], [712, 316], [715, 326], [714, 337], [713, 347],
    [714, 358], [714, 369], [711, 381], [706, 391], [700, 399],
    [692, 406], [683, 412]] },                                   // to the southern sea

  // out of Oxenmere, EAST of Oxenford, down to the march at Watersmeet
  { name: 'the Oxenbeck', path: [
    [376, 268], [381, 277], [383, 287], [386, 297], [388, 307],
    [391, 316], [396, 322], [404, 325], [413, 326], [423, 325],
    [430, 324], [434, 322]] },      // into the Great River (it runs x430-435 here)

  // out of the Blackwater, threading the Greenwood, into the Great River
  { name: 'the Blackbeck', path: [
    [478, 103], [477, 113], [474, 122], [470, 131], [468, 140],
    [468, 148], [469, 156], [468, 163], [464, 168], [459, 171]] },  // the river runs x458-459 here

  // off the Moor, south-east, into the Great River above Millbrook
  { name: 'the Bleak Beck', path: [
    [302, 116], [307, 126], [313, 136], [319, 146], [326, 154],
    [335, 160], [346, 166], [358, 171], [370, 175], [383, 179],
    [396, 178], [409, 178], [421, 177], [432, 177], [441, 177],
    [449, 178]] },   // the river above Millbrook, x448-450 -- NOT down onto the town
]


// THE FORDS. Where a routed road crosses a beck or the shallow edge of a mere,
// the water is left out and the crossing is a splash rather than a wall.
//
// These are BAKED, not computed, and the reason is the same cycle that
// stopped the first attempt: roads are routed by a router that consults the
// water, so the water cannot consult the roads. So the founding was run once,
// the tiles where a road stood in a beck were written down, and they are a
// literal now -- readable, editable, and unable to recurse.
// WHERE A BECK CROSSES A ROAD, THE ROAD IS PLANKED.
//
// The becks were rerouted to run somewhere and to wander getting there, and a
// wandering beck meets the King's roads: the Bleak Beck alone crosses six
// times on its way off the Moor. A road that walks into a stream and stops is
// the same fault as a toll you can side-step -- so each crossing carries a
// plank, and `onBridge` knows about them, which means blockedAt does.
//
// Baked, for the reason given over BECK_FORDS: the water cannot ask about the
// roads without the router asking about the water.
export const BECK_PLANKS = [
[301,115], [301,116], [301,117], [301,119], [301,120], [301,121], [301,122], [302,115], [302,116], [302,117], [302,119], [302,120], [302,121], [302,122], [303,115], [303,116], [303,117], [303,119], [303,120], [303,121], [303,122], [306,129], [306,130], [306,131], [307,129], [307,130], [307,131], [307,132], [308,129], [308,130], [308,131], [308,132], [308,133], [309,130], [309,131], [309,132], [309,133], [309,134], [310,131], [310,132], [310,133], [310,134], [310,135], [311,131], [311,132], [311,133], [311,134], [311,135], [311,136], [312,132], [312,133], [312,134], [312,135], [312,136], [313,133], [313,134], [313,135], [313,136], [314,134], [314,135], [314,136]
]

export const BECK_FORDS = [
  // EMPTY, AND THAT IS THE ANSWER. The founding was run and the crossings
  // counted: the router avoids every beck on its own, exactly as it avoids the
  // Barrow and finds the passes. Nothing needed a plank. The list stays
  // because the next beck somebody draws may not be so lucky, and because an
  // empty list that was MEASURED is worth more than a rule nobody checked.
]
