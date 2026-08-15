// THE FIELDS OF TALLYHOLM, drawn by hand.
//
// The procedural pass that came before this laid 2,074 plot tiles -- a quarter
// of everything on the island -- as random rectangles thrown at a ring round
// each town. It closed the measured gap against the map we compare ourselves
// to (0.06% ploughed, against their 2.3%) and it looked like exactly what it
// was: slabs. No amount of tuning a placer makes a field look like somebody
// ploughed it, because a field is not a rectangle of brown. It is STRIPS, in a
// furlong, with a headland to turn the plough on and a hedge round the whole
// thing, and a gate where the lane comes in.
//
// So they are drawn. One system per town, each different, each sized and
// shaped to what that town is:
//
//   Hollybarrow is a farm and has the most.  Greenhollow is a clearing in a
//   wood, so its fields are ASSARTS -- irregular patches hacked out, with the
//   stumps still in them. Cragfoot is a mine on thin stony soil and gets one
//   walled garth, because even a mining town eats. The two ports get nothing:
//   they fish.
//
// Offsets are from the town's SEAT, so a field system moves with its town.
// Tiles that fall on water, rock, road or anything already standing are simply
// not ploughed -- which is why these come out ragged at the edges, the way a
// real field goes ragged where it meets a stream.
//
//   p  ploughed strip     .  headland / baulk: open, unploughed
//   ^  hedge              f  fence            g  gate (left open)
//   T  a stump left standing in an assart
//   ~  not part of this field

const FURLONG = [                       // the standard open field: 8 strips
  '^^^^^^^^^^^^^^^^^^',
  '^pp.pp.pp.pp.pp.pp^',
  '^pp.pp.pp.pp.pp.pp^',
  '^pp.pp.pp.pp.pp.pp^',
  '^pp.pp.pp.pp.pp.pp^',
  '^pp.pp.pp.pp.pp.pp^',
  '^................^',
  '^pp.pp.pp.pp.pp.pp^',
  '^pp.pp.pp.pp.pp.pp^',
  '^pp.pp.pp.pp.pp.pp^',
  '^pp.pp.pp.pp.pp.pp^',
  '^^^^^^^^g^^^^^^^^^',
]
const HALF_FURLONG = [
  '^^^^^^^^^^^^',
  '^pp.pp.pp.pp^',
  '^pp.pp.pp.pp^',
  '^pp.pp.pp.pp^',
  '^pp.pp.pp.pp^',
  '^..........^',
  '^pp.pp.pp.pp^',
  '^pp.pp.pp.pp^',
  '^^^^^g^^^^^^',
]
const CLOSE = [                          // a small enclosed close by the walls
  'ffffffff',
  'f.pppp.f',
  'f.pppp.f',
  'f.pppp.f',
  'fffgffff',
]
const ASSART = [                         // hacked out of the wood, stumps left
  '~~TppT~~~',
  '~Tpppp T~',
  'Tpppppp~~',
  '~ppppppT~',
  '~T ppp~~~',
  '~~~T~~~T~',
]
const GARTH = [                          // a walled kitchen garden on thin soil
  '^^^^^^',
  '^pppp^',
  '^pppp^',
  '^^g^^^',
]

export const FIELDS_V7 = {
  // THE CAPITAL. Two furlongs west of the walls, between the town and the
  // river, and a close hard against the south gate.
  anchor: [
    { dx: -48, dy: -13, rows: FURLONG },
    { dx: -49, dy: 2, rows: FURLONG },
    { dx: -12, dy: 20, rows: CLOSE },
    { dx: 30, dy: -20, rows: HALF_FURLONG },
    { dx: 29, dy: -3, rows: FURLONG },
    { dx: -20, dy: 28, rows: HALF_FURLONG },
  ],
  // THE MARKET. It buys more than it grows, but the mill has to be fed.
  millbrook: [
    { dx: -8, dy: -23, rows: HALF_FURLONG },
    { dx: 22, dy: 14, rows: CLOSE },
    { dx: 30, dy: -22, rows: FURLONG },
    // NOT -30,+6: that is the Millbrook Bridge road and the river bank.
    // Millbrook's west side is river, road and bridge; its second furlong
    // goes east into the open ground behind the market instead.
    { dx: 28, dy: -7, rows: HALF_FURLONG },
  ],
  // THE CROSSING. Fields along the water, where the ground is good.
  oxenford: [
    // NOT -30,-6: the Oxenlea Mill and its lane take most of that ground.
    { dx: -29, dy: -31, rows: FURLONG },
    { dx: 25, dy: -2, rows: HALF_FURLONG },
    { dx: -5, dy: 19, rows: CLOSE },
    { dx: 16, dy: -27, rows: HALF_FURLONG },
  ],
  // THE FORGE. Scrub and charcoal country; two closes and no more.
  thornbury: [
    { dx: -28, dy: 2, rows: CLOSE },
    // NOT +24,-10: the Thornvale Maze stands there and refused all 85 tiles.
    { dx: -14, dy: -35, rows: HALF_FURLONG },
  ],
  // THE FARM. This is what Hollybarrow IS.
  hollybarrow: [
    { dx: -38, dy: -16, rows: FURLONG },
    { dx: -38, dy: 7, rows: FURLONG },
    { dx: 24, dy: -14, rows: FURLONG },
    { dx: 24, dy: 6, rows: HALF_FURLONG },
    { dx: -6, dy: 18, rows: CLOSE },
    { dx: 8, dy: -24, rows: CLOSE },
  ],
  // THE TIMBER TOWN. Assarts: ground taken from the wood a year at a time,
  // and the stumps are still in it because pulling them is a winter's work.
  greenhollow: [
    { dx: -25, dy: 5, rows: ASSART },
    { dx: 20, dy: 2, rows: ASSART },
    { dx: -2, dy: 14, rows: ASSART },
  ],
  // NORWICK HAS NO FIELDS, and that is the point of Norwick.
  //
  // It had two, and they were landing in the WILDS -- ploughed strips in the
  // lawless west, a hundred tiles past the Brandline, which is nonsense twice
  // over. A garrison on the edge of the Wilds does not farm. It is supplied,
  // which is why the road from Hollybarrow exists and why a hauler has a
  // reason to walk it. An empty margin round Norwick says that; a furlong
  // says the opposite.
  // CRAGFOOT HAS NO FIELDS EITHER. It was given one walled garth on the
  // reasoning that even a mining town eats -- and every tile of it scored
  // zero, because the ploughing rule refuses crags, moor, wilds and fen, and
  // Cragfoot stands in the crags. The rule was right and the garth was
  // sentiment. A mine on bare rock is VICTUALLED, the way the garrison is,
  // and the road from Thornbury is how.
  // the ports fish: eastmere and fenmarch are deliberately absent
}
