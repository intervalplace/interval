// THE SHIRE, authored by hand.
//
// Lumbridge was not procedural. Varrock was not procedural. The reason
// RuneScape's core feels worn-in is that somebody wore it in: the chicken
// pen is beside the farm because fighting chickens beside a farm is funny,
// and no distance metric on earth produces that.
//
// So the Expanse's core -- the ~300x200 box every citizen will cross a
// thousand times -- stops being generated and becomes DATA. The frontier
// stays procedural, where variety and surprise are the point.
//
// A town is an ASCII drawing. That is the whole format. You edit it in a
// text editor with a monospace font, you can see what you are making while
// you make it, and taste is expressible in a way that tuning constants
// never are. The loader validates the drawing and throws loudly on a
// ragged row, so a typo is a build error and not a silent hole in a wall.
//
// Determinism is free here: a drawing is the same drawing in every engine.
// This is, if anything, MORE deterministic than the procedural placement
// it replaces -- no ring searches, no hash draws, no float comparisons.

// ---------------------------------------------------------------------
// The legend. One character, one node type.
//   ' '  not part of the plan -- terrain wins, scatter may use it
//   '.'  open ground, RESERVED -- a street, a yard, a plaza. Nothing
//        scatters here, ever, so a lane cannot be sealed by a tree.
//   '@'  the plan's origin (open, reserved). Optional: absent, the plan
//        centres on the settlement's anchor.
// ---------------------------------------------------------------------
export const LEGEND = {
  '#': 'wall',        '"': 'hedge',       'f': 'fence',
  'B': 'bank',        'S': 'store',       'A': 'anvil',   's': 'smith',
  'k': 'keeper',      'G': 'guard',       'h': 'house',
  'o': 'well',        '*': 'campfire',    'i': 'signpost',
  'W': 'waystone',    '!': 'landmark',    'p': 'plot',
  'T': 'tree',        'n': 'rock',        'F': 'fishing-spot',
}
export const OPEN = new Set(['.', '@'])
// A COASTAL drawing declares its own shoreline. This is the general answer
// to the lesson Anchor's smithy taught -- that a drawing does not know
// where the water went. Instead of the author guessing a seat and the
// validator rejecting it, the plan states which of its tiles must be sea,
// and the loader SEARCHES the coast for a placement where the declared
// water and the real water agree. A port then finds its own harbour.
//   '~'  must be open water (places nothing)
//   '='  a quay: walkable decking over water, whatever the terrain says
export const SEA = '~'
export const QUAY = '='


// ---------------------------------------------------------------------
// THE PLANS
//
// Anchor. A capital with two banks -- one in the north quarter, one in
// the south -- deliberately far apart, because that single decision is
// what invents "north Anchor" and "south Anchor" as places people say out
// loud. The Chapel and the Smithy face each other across the north road;
// the Keep holds the southeast; the Market Hall and the Granary sit on
// the west where the country road comes in. The plaza in the middle is
// where souls arrive.
// ---------------------------------------------------------------------
export const PLANS = {
  anchor: [
    '#####################..#####################',
    '#..........................................#',
    '#.#######...####.........########..#######.#',
    '#.#.....#...#h.#.........#......#..#.....#.#',
    '#.#.Bk..#...#..#.........#..*k..#..#As.A.#.#',
    '#.#.....#...#.##.........#......#..#.....#.#',
    '#.###.###................####.###..###.###.#',
    '#..........................................#',
    '#.######.....#.##..........................#',
    '#.#......#...#..#..................####....#',
    '#.#.Sk.S.#...#h.#..................#h.#....#',
    '#.########...####........!.........#..#....#',
    '#..................................####....#',
    '..................o.......*.................',
    '............................................',
    '#..................i.......................#',
    '#.###.###...#.##.........#####.####..##.##.#',
    '#.#.....#...#..#.........#...#....#..#...#.#',
    '#.#.Sk..#...#h.#.........#.G.*.G..#..#Bk.#.#',
    '#.#.....#...####.........#........#..#...#.#',
    '#.#######................#........#..#####.#',
    '#........................#........#........#',
    '#........................##########........#',
    '#.#.##.#.##.#.##...........................#',
    '#.#..#.#..#.#..#..........#.##.#.##.#.##...#',
    '#.#h.#.#h.#.#h.#..........#h.#.#h.#.#h.#...#',
    '#.####.####.####..........####.####.####...#',
    '#####################..#####################',
  ],
  // Millbrook. The mill town. Its west wall opens on the river, and the
  // plan simply leaves that side thin: walls yield to water, so the
  // river writes the town's western edge itself.
  millbrook: [
    '#############..#############',
    '#..........................#',
    '#.#######.####...######....#',
    '#.#.....#.#h.#...#....#....#',
    '#.#.Bk..#.#..#...#As..#....#',
    '#.#.....#.#.##...#....#....#',
    '#.###.###........###.##....#',
    '#..........................#',
    '#..........................#',
    '............o...*...........',
    '.................G..........',
    '#...........i..............#',
    '#..........................#',
    '#.###.##.........#.##.#.##.#',
    '#.#....#.........#..#.#..#.#',
    '#.#Sk..#.........#h.#.#h.#.#',
    '#.######.........####.####.#',
    '#..........................#',
    '#..........................#',
    '#############..#############',
  ],
  // Oxenford. The market at the crossing. Two store rows, because a ford
  // town is where the carts stop.
  oxenford: [
    '#############..#############',
    '#..........................#',
    '#.#######.####....#######..#',
    '#.#.....#.#h.#....#.....#..#',
    '#.#.Bk..#.#..#....#Sk.S.#..#',
    '#.#.....#.#.##....#.....#..#',
    '#.###.###.........###.###..#',
    '#..........................#',
    '#..........................#',
    '...........o.....*..........',
    '............................',
    '#..........i....G..........#',
    '#..........................#',
    '#.###.###........#.##.#.##.#',
    '#.#.....#........#..#.#..#.#',
    '#.#.Sk..#........#h.#.#h.#.#',
    '#.#.....#........####.####.#',
    '#.#######..................#',
    '#..........................#',
    '#############..#############',
  ],
  thornbury: [
    '############..############',
    '#........................#',
    '#.#######........#######.#',
    '#.#.....#........#.....#.#',
    '#.#.Bk..#........#Sk.S.#.#',
    '#.#.....#........#.....#.#',
    '#.###.###........###.###.#',
    '#........................#',
    '..........o....*..........',
    '..........................',
    '#.........i....G.........#',
    '#........................#',
    '#.##.##.#.##......##.##..#',
    '#.#...#.#..#......#...#..#',
    '#.#h..#.#h.#......#h..#..#',
    '#.#####.####......#####..#',
    '#........................#',
    '############..############',
  ],
  // Eastmere. A PORT, which means the one town that does not wall itself
  // off from the thing it exists for: three sides of wall, and the east
  // side simply open onto the quay. Three piers reach into the bay, each
  // ending in water you fish from the decking. The harbour master keeps
  // the north quay, the warehouses the middle, the Anchor & Chain the
  // south. The '~' tiles are a CLAIM: they must be open water, and the
  // loader hunts the coast for a seat where that claim holds.
  eastmere: [
    '                                    ',
    ' #########..##########..            ',
    ' #....................!.            ',
    ' #.#######.####.######..            ',
    ' #.#.....#.#h.#.#....#..            ',
    ' #.#.Bk..#.#..#...k.*#..=====F~~~   ',
    ' #.#.....#.#.##.#....#..            ',
    ' #.###.###......######..            ',
    ' #..............######..            ',
    ' #.........ffff...S..#..            ',
    ' #..............#....#..            ',
    ' #......o.......######..            ',
    ' .......................=====F~~~   ',
    ' ....................G..            ',
    ' #......i.....*.........            ',
    ' #.###.###......######..            ',
    ' #.#.....#........Sk.#..            ',
    ' #.#h.*k.#......#....#..            ',
    ' #.#.....#......######..            ',
    ' #.#######..............=====F~~~   ',
    ' #.#.##.#.##............            ',
    ' #.#..#.#..#ffff........            ',
    ' #.#h.#.#h.#............            ',
    ' #.####.####............            ',
    ' #########..##########..            ',
    '                                    ',
  ],
  // Greenhollow. A CLEARING, not a town: no wall anywhere, because the
  // greenwood is the wall. Buildings sit among the stumps, the sawpit is
  // the centre, and the log road runs north to south because that is the
  // way the timber leaves. If it reads as temporary, that is correct.
  greenhollow: [  // 32x24
    '                                ',
    '     T       T       T          ',
    '  T    T T       T       T      ',
    '   .........................T   ',
    '   .#######.........#######..   ',
    '  T.#.....#.........#.....#..   ',
    '   .#.Bk..#.........#.Sk..#..   ',
    '   .#.....#.........#.....#..T  ',
    ' T .###.###.........###.###..   ',
    '   .......ffff...fff......... T ',
    '   .......f.*k...T.f.........   ',
    '   .......................... T ',
    'T  ..........................   ',
    '   .......fi......of.........   ',
    '   .......f.T....T.f.........   ',
    '   .###.##ffff...fff###.###..T  ',
    ' T .#....#..........#.....#..   ',
    '   .#h.*.#..........#As...#..   ',
    ' T .#....#..........#.....#..   ',
    '   .######..........#######.T   ',
    '  T..........................   ',
    '         T       T       T      ',
    '     T       T     T T          ',
    '                                ',
  ],
  // Cragfoot. Built INTO the rock: three terraces cut across the slope
  // with one stair straight down them, everything stone, no gardens and no
  // room for any. The forge is the largest building on the island. It
  // should feel cramped and vertical, which is why the plan is taller than
  // it is wide -- the only one that is.
  cragfoot: [  // 22x30
    '                      ',
    '  ##################  ',
    ' #########..#######.# ',
    ' ##......#..#.....#.# ',
    ' ##.As.A.#..#.Sk..#.# ',
    ' ##.A.*A..........#.# ',
    ' ##......#..#.....#.# ',
    ' #########..#######.# ',
    ' #########..######### ',
    ' #..................# ',
    ' #########..#######.# ',
    ' ##......#..#.....#.# ',
    ' ##.Bk...#..#.h.*.#.# ',
    ' ##...............#.# ',
    ' ##......#..#.....#.# ',
    ' #########..#######.# ',
    ' #########..######### ',
    ' #..................# ',
    ' ###.####.##.##.##..# ',
    ' ##...##...#.#...#..# ',
    ' ##h..##h..#.#h..#..# ',
    ' ##...##...#.#...#..# ',
    ' ###########.#####..# ',
    ' #..................# ',
    ' #########..######### ',
    ' #...G......o.......# ',
    ' #......i......*....# ',
    ' #..................# ',
    '  ########  ########  ',
    '                      ',
  ],
  // Fenmarch. On STILTS. Its walkways are '=' DECKING, not '.' ground:
  // the first build seated it correctly in the delta and then sealed off
  // five essentials, because a boardwalk drawn as open ground is just a
  // tile with a river running through it. A town on stilts has to say so.
  // (was: Fenmarch. On STILTS.) The causey runs straight through and everything
  // else hangs off boardwalks fenced on both sides -- there is almost no
  // ground here, and what there is belongs to the eel racks out over the
  // water. Four sparing '~' claims at the corners, well clear of the
  // walkways: enough to insist the town really is in the marsh, few enough
  // that the seat search can still find a marsh to put it in.
  fenmarch: [  // 34x24
    '               ===                ',
    '    #######    ===    #######     ',
    '~   #.Bk..#    ===    #.Sk..#    ~',
    '    #.....#    ===    #.....#     ',
    '   f###.###ffff===ffff###.###fff  ',
    '   ==========*==================  ',
    '   ffff.fffffff===ffffffff.fffff  ',
    '    ###.##     ===     ###.##     ',
    '  f #h.*.#     ===     #h...#   f ',
    '  f #....#     ===     #....#   f ',
    '   f######fffff===fffff######fff  ',
    '   ==========o=====i============  ',
    '   ffff.fffffff===fffffff.ffffff  ',
    '    ###.###    ===    ###.###     ',
    '  f #As...#    ===    #.h.*.#   f ',
    '  f #.....#    ===    #.....#   f ',
    '   f#######ffff===ffff#######fff  ',
    '   ================G============  ',
    '   ffffffffffff===ffffffffffffff  ',
    '               ===                ',
    '               ===                ',
    '~              ===               ~',
    '               ===                ',
    '               ===                ',
  ],
  // Norwick. The only truly fortified place, and the west face is DOUBLE
  // walled with a corridor between, because the Brand lies that way and
  // nothing else on the island needs a second wall. A sally port, not a
  // gate. A muster yard watched from four corners. A garrison, not a
  // village. (The north stores were first drawn two tiles tall, which is a
  // rectangle made entirely of edge -- no inside, and a shopkeeper standing
  // in the wall. Three is the minimum height of a room.)
  norwick: [  // 30x22
    '##############..##############',
    '#.#           ..  #########  #',
    '#.#.########........S.....#. #',
    '#.#.#.As.A.#......#########. #',
    '#.#.#......#......#########. #',
    '#.#.###.####......#.......#. #',
    '#.#...............#.Gk*.G.#. #',
    '#.#.......................#. #',
    '#.#..G....G.......#.......#. #',
    '#.#...............#########. #',
    '.......*....o................#',
    '........W........i...........#',
    '#.#......................... #',
    '#.#..G....G.......####.####. #',
    '#.#...............#.......#. #',
    '#.#...............#.Bk....#. #',
    '#.#.##.##.##.##...#.......#. #',
    '#.#.#...#.#...#...#.......#. #',
    '#.#.#h..#.#h..#...#########. #',
    '#.#.#####.#####............. #',
    '#.#           ..             #',
    '##############..##############',
  ],
  // Hollybarrow. A farm village, so its boundary is a HEDGE, not a wall:
  // the shire should not look like six copies of one fortification. The
  // fold inside holds real plots, and there is an old tree by the gate.
  hollybarrow: [
    '""""""""""""..""""""""""""',
    '"........................"',
    '".#######........######.."',
    '".#.....#........#....#.."',
    '".#.Bk..#........#Sk..#.."',
    '".#.....#........###.##.."',
    '".###.###................"',
    '"...T............fffffff."',
    '..........o...*.fpp..ppf..',
    '................f......f..',
    '".........i.....fpp..ppf."',
    '"...............fff.fff.."',
    '".##.##.#.##.....##.##..."',
    '".#...#.#..#.....#...#..."',
    '".#h..#.#h.#.....#h..#..."',
    '".#####.####.....#####..."',
    '"........................"',
    '""""""""""""..""""""""""""',
  ],
}

// ---------------------------------------------------------------------
// THE NAMED PLACES
//
// Offsets in tiles from Anchor's centre. This is where the taste actually
// lives: not one of these is derivable from a rule, and that is the point.
// Every one is within a two-minute walk of the capital, so a citizen's
// first week is spent finding things rather than crossing grass.
//
// `art` is a small ascii block laid the same way a town plan is.
// `on` optionally constrains the seat (e.g. 'road' -> must touch a road).
// ---------------------------------------------------------------------
export const PLACES = [
  {
    tag: 'chickenpen', name: 'the Hollybarrow chicken pen', dx: -84, dy: -44,
    story: 'A chicken pen. The chickens are unbothered by you.',
    art: ['ffffff', 'f....f', 'f....f', 'ff.fff'],
  },
  {
    tag: 'darkcircle', name: 'the Ninestones', dx: -34, dy: 62, kind: 'standing-stone',
    story: 'Nine stones in a ring, and a fire nobody admits to lighting.',
    art: ['.!.!.', '!...!', '..*..', '!...!', '.!.!.'],
  },
  {
    tag: 'gallowsoak', name: "the Hanging Oak", dx: 46, dy: 30, kind: 'old-oak',
    story: 'An oak by the road. It has been used for one purpose and everyone knows which.',
    art: ['.T.', 'T!T', '.i.'],
  },
  {
    tag: 'shepherdhut', name: "the shepherd's hut", dx: 96, dy: 8,
    story: 'A one-room hut. Somebody still lives here.',
    art: ['####', '#h.#', '##.#', '.*..'],
  },
  {
    tag: 'millpond', name: 'the Mill Pond', dx: 18, dy: -74,
    story: 'The mill pond. Deeper than it looks, colder than you expect.',
    art: ['""""""', '"...."', '"...."', '""."""'],
  },
  {
    tag: 'wayfarerscross', name: "the Wayfarer's Cross", dx: -50, dy: -8, kind: 'standing-stone',
    story: 'A stone cross at the crossroads. Travellers leave things at its foot.',
    on: 'road',
    art: ['.!.', '!!!', '.i.'],
  },
  {
    tag: 'beggarsbridge', name: "Beggar's Rest", dx: -12, dy: 46,
    story: 'A bench, a fire, and a roof of sorts. Somebody keeps it swept.',
    on: 'road',
    art: ['###', '#.*', '.i.'],
  },
  {
    tag: 'oldkiln', name: 'the Old Kiln', dx: 62, dy: -52,
    story: 'A lime kiln, long cold. The stone around it is still white.',
    art: ['.###.', '#...#', '#.*.#', '.#.#.'],
  },
  {
    tag: 'apiary', name: 'the Apiary', dx: -70, dy: 22, kind: 'standing-stone',
    story: 'Twelve hives in a row. The keeper does not look up.',
    art: ['"""""""', '"!.!.!"', '".k..."', '"""."""'],
  },
  {
    tag: 'drownedcart', name: 'the Drowned Cart', dx: 30, dy: 74, kind: 'shipwreck',
    story: 'A cart in the shallows, up to its axles. Nobody came back for it.',
    art: ['.!.', '!!.'],
  },
]

// ---------------------------------------------------------------------
// THE LOADER
// ---------------------------------------------------------------------
export function validatePlan(name, rows) {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error(`plan ${name}: empty`)
  const w = rows[0].length
  rows.forEach((r, i) => {
    if (r.length !== w)
      throw new Error(`plan ${name}: row ${i} is ${r.length} wide, row 0 is ${w}. `
        + `A ragged drawing is a hole in a wall; fix the art, not the loader.`)
    for (const ch of r)
      if (!OPEN.has(ch) && ch !== ' ' && ch !== SEA && ch !== QUAY && !(ch in LEGEND))
        throw new Error(`plan ${name}: row ${i} uses '${ch}', which is not in the legend`)
  })
  return { w, h: rows.length }
}

// After a drawing is laid, check that every piece of furniture in it can
// actually be REACHED from the plan's open ground. A drawing does not know
// where the river went, and the standing law (walls yield to water) means
// water can cut a plan in half and leave a smithy sealed behind its own
// walls -- which is precisely what the Great River did to Anchor's forge on
// the first run. A ragged row throws; so should this. The author then moves
// the town or redraws the quarter, which is the correct place for the
// decision to be made.
export function checkPlanConnected(name, rows, cx, cy, ctx) {
  const { g, isWater, blockedAt } = ctx
  const { w: pw, h: ph } = validatePlan(name, rows)
  const x0 = cx - (pw >> 1), y0 = cy - (ph >> 1)
  const at = (x, y) => {
    const rx = x - x0, ry = y - y0
    if (rx < 0 || ry < 0 || rx >= pw || ry >= ph) return null
    return rows[ry][rx]
  }
  // flood over the plan's open ground plus any tile the terrain leaves walkable
  const openAt = (x, y) => {
    const ch = at(x, y)
    if (ch === null) return false
    // DECKING IS FOOTING. A quay tile is walkable whatever the water beneath
    // it says -- that is the entire point of the character. The first pass
    // omitted this and so judged Fenmarch, a town that is nothing but
    // boardwalk, to have sealed off every building it had.
    if (ch === QUAY) return true
    if (isWater(g, x, y)) return false
    if (blockedAt && blockedAt(g, x, y)) return false
    return OPEN.has(ch) || ch === ' '
  }
  let sx = cx, sy = cy
  if (!openAt(sx, sy)) {
    outer: for (let r = 1; r < Math.max(pw, ph); r++)
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue
        if (openAt(cx + dx, cy + dy)) { sx = cx + dx; sy = cy + dy; break outer }
      }
  }
  const seen = new Set([sx + ',' + sy]); const q = [[sx, sy]]; let h = 0
  while (h < q.length) {
    const [x, y] = q[h++]
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = nx + ',' + ny
      if (seen.has(k) || !openAt(nx, ny)) continue
      seen.add(k); q.push([nx, ny])
    }
  }
  const ESSENTIAL = new Set(['bank', 'store', 'anvil', 'smith', 'keeper', 'well', 'waystone'])
  const stranded = []
  for (let ry = 0; ry < ph; ry++) for (let rx = 0; rx < pw; rx++) {
    const ch = rows[ry][rx]
    if (OPEN.has(ch) || ch === ' ' || !(ch in LEGEND)) continue
    if (!ESSENTIAL.has(LEGEND[ch])) continue
    const x = x0 + rx, y = y0 + ry
    if (isWater(g, x, y)) continue
    const touches = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has((x + dx) + ',' + (y + dy)))
    if (!touches) stranded.push(`${LEGEND[ch]} at plan(${rx},${ry}) world(${x},${y})`)
  }
  if (stranded.length)
    throw new Error(`plan ${name} at (${cx},${cy}): terrain has sealed off `
      + `${stranded.length} essential(s) -- ${stranded.slice(0, 4).join('; ')}. `
      + `Water or blocked ground cuts this drawing. Move the town, or redraw `
      + `that quarter to leave the water a corridor.`)
  return true
}

// Lay a drawing into the world, centred on (cx, cy).
//   ctx = { g, w, E, put, taken, key, inB, isWater, reserve }
// Returns the count of nodes placed. Walls yield to water (the standing
// law): a plan tile on water is simply skipped, so a river writes the
// town's edge for us and a drawing never has to know where the water went.
export function layPlan(ctx, name, rows, cx, cy, idPrefix, opts = {}) {
  const { g, E, w, taken, key, inB, isWater, reserve } = ctx
  const { w: pw, h: ph } = validatePlan(name, rows)
  const x0 = cx - (pw >> 1), y0 = cy - (ph >> 1)
  // '!' is a landmark, and the engine requires every landmark to name its
  // kind. A drawing says "something stands here"; the plan says what.
  const lk = opts.landmarkKind ?? 'standing-stone'
  let n = 0, i = 0
  for (let ry = 0; ry < ph; ry++) {
    for (let rx = 0; rx < pw; rx++) {
      const ch = rows[ry][rx]
      if (ch === ' ') continue
      const x = x0 + rx, y = y0 + ry
      if (!inB(x, y)) continue
      if (ch === SEA) continue                       // a claim, not a thing
      if (ch === QUAY) { reserve(x, y); continue }    // decking: kept clear
      if (OPEN.has(ch)) { reserve(x, y); continue }  // a lane, protected
      // walls yield to water -- but a fishing spot is SUPPOSED to be wet.
      // A pier ends in the bay; that is what a pier is for. Its tile is
      // decking (see quayTilesOfPlan), so the ground under it is lawful
      // and the sweep will not carry it off as unreachable.
      if (isWater(g, x, y) && LEGEND[ch] !== 'fishing-spot') continue
      if (taken.has(key(x, y))) continue
      const type = LEGEND[ch]
      const extra = type === 'plot' ? { plantedAt: 0 }
        : type === 'landmark' ? { kind: lk }
        : undefined
      E.addNode(w, idPrefix + '-' + (i++), type, x, y, extra)
      taken.add(key(x, y))
      n++
    }
  }
  return n
}

// Seat a COASTAL drawing: find the placement where the plan's declared
// water and the world's real water agree. Searched in a deterministic
// spiral out from a nominal point, testing the cheapest predicate first.
// Only terrain is consulted -- never nodes, never blockedAt -- so this is
// safe to call from fordAt without tying a knot.
export function seatCoastalPlan(name, rows, nomX, nomY, ctx, maxRad = 60) {
  // `blockedTerrain` must be a TERRAIN-ONLY predicate (ridge, upland) and
  // must not consult fords -- a quay's ford is derived from this very
  // seat, so asking blockedAt here would tie a knot. Without it the search
  // is happy to seat a port on impassable rock, which is how Eastmere
  // first came to have its harbour master walled inside the Ridge.
  const { g, isWater, inBounds, blockedTerrain } = ctx
  const { w: pw, h: ph } = validatePlan(name, rows)
  const fits = (cx, cy) => {
    const x0 = cx - (pw >> 1), y0 = cy - (ph >> 1)
    for (let ry = 0; ry < ph; ry++) for (let rx = 0; rx < pw; rx++) {
      const ch = rows[ry][rx]
      if (ch === ' ' || ch === QUAY) continue      // no claim either way
      const x = x0 + rx, y = y0 + ry
      if (!inBounds(x, y)) return false
      const wet = isWater(g, x, y)
      // A fishing spot at a pier's end is a WET claim, not a dry one. The
      // first draft left it unconstrained, and the seat search happily put
      // Eastmere where its three piers reached out into the Ridge -- dry
      // rock, technically satisfying every claim the drawing had made.
      // If a tile is meant to be over water, it has to say so.
      if (ch === SEA || ch === 'F') { if (!wet) return false }
      else if (wet) return false                   // and the town must be dry
      else if (blockedTerrain && blockedTerrain(g, x, y)) return false // ...and standable
    }
    return true
  }
  for (let rad = 0; rad < maxRad; rad++)
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue
      if (fits(nomX + dx, nomY + dy)) return { x: nomX + dx, y: nomY + dy }
    }
  return null
}

// Every QUAY tile of a plan seated at (cx, cy): decking that must be
// walkable whatever the water beneath it says.
export function quayTilesOfPlan(name, rows, cx, cy) {
  const { w: pw, h: ph } = validatePlan(name, rows)
  const x0 = cx - (pw >> 1), y0 = cy - (ph >> 1)
  const out = new Set()
  for (let ry = 0; ry < ph; ry++) for (let rx = 0; rx < pw; rx++) {
    const ch = rows[ry][rx]
    if (ch !== QUAY && !(ch === 'F' && rows[ry][rx - 1] === QUAY)) continue
    out.add((x0 + rx) + ',' + (y0 + ry))
  }
  return out
}

// The shire's own bounds, for anything that needs to ask "am I home?"
export function shireBoundsOf(g) {
  const cx = Math.floor(g.worldW / 2), cy = Math.floor(g.worldH / 2)
  return { x0: cx - 150, x1: cx + 150, y0: cy - 100, y1: cy + 100 }
}
