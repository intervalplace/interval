// §6am (v6): THE V6 TOWN DRAWINGS.
//
// v6 keeps every hand-drawn plan exactly as the shire has them, with ONE
// change: the anvil ('A') is removed from every town but Thornbury, so the
// island has a single forge and ore must be carried to it. The shared plans in
// worldgen-shire.mjs are FROZEN (v1-v5 draw from them and their hashes depend
// on them); this module re-exports everything else from there unchanged and
// overrides only PLANS5, under the name PLANS5_V6, so no earlier world moves a
// tile.
import { LEGEND as LEGEND_BASE_FOR_V6 } from './worldgen-shire.mjs'
export {
  LEGEND, OPEN, FLOOR, KIND_FOR, SEA, QUAY, PLANS, PLACES,
  isIndoor, validatePlan, checkPlanConnected, layPlan, seatCoastalPlan,
  quayTilesOfPlan, shireBoundsOf,
} from './worldgen-shire.mjs'
import { PLAN_ROOMS as PLAN_ROOMS_BASE } from './worldgen-shire.mjs'

// §6cz (v6): MILLBROOK'S ROOMS MOVED WHEN ITS DRAWING GREW. PLAN_ROOMS tells the
// stall-seater which interiors are shop-rooms; the frozen file's Millbrook rooms
// belong to the old four-a-side plan. v6 redraws Millbrook bigger (above), so it
// carries its own room list -- the six clean shop-fronts along the market street
// -- and re-exports every other town's rooms unchanged.
export const PLAN_ROOMS = {
  ...PLAN_ROOMS_BASE,
  // §7bd: EVERY ROOM, NOT JUST THE SHOPS.
  //
  // This table has two readers and they want different things from it. The
  // stall seater treats it as "rooms a rostered stall may stand in", so the
  // redrawn towns listed only the ones left unkept. But `isIndoor` reads the
  // SAME table to answer "is this tile inside a building" -- and it is
  // consulted by the paving, so every room NOT listed was outdoors as far as
  // the world was concerned, and its floor was flagged as street.
  //
  // Listing every room satisfies both: isIndoor gets the truth, and the stall
  // seater filters the list by what is already occupied, which is what its
  // `busy` test was always for.
  //
  // Found by roomfind.mjs -- flood the interior, stop at the door -- rather
  // than typed by hand, so a redrawn town's list cannot drift from its drawing.
  eastmere: [[23,2,1,2],[8,4,3,4],[14,4,4,4],[22,7,3,3],[8,11,3,3],[14,11,4,3],[12,12,1,2],[22,14,3,3],[8,18,3,3],[14,18,4,3]],
  fenmarch: [[5,3,1,2],[13,3,1,2],[25,3,1,2],[21,8,8,4],[4,9,6,3],[6,15,1,2],[25,15,6,3]],
  norwick: [[4,4,6,5],[19,4,6,3],[28,6,2,1],[4,14,4,3],[19,14,7,4]],
  greenhollow: [[3,6,6,3],[13,6,6,3],[23,6,5,3],[5,10,2,1],[3,12,4,4],[13,12,7,4],[23,12,4,3]],
  hollybarrow: [[5,3,1,2],[13,3,1,2],[24,3,1,2],[4,8,3,5],[11,8,4,4],[20,8,11,5],[4,16,6,3],[29,16,3,3]],
  oxenford: [[5,3,9,5],[26,3,3,3],[4,13,5,3],[30,13,4,3],[15,16,1,2],[7,22,2,2],[31,22,1,2]],
  millbrook: [[19,3,7,4],[4,4,5,3],[12,4,4,3],[29,4,6,3],[38,4,5,4],[4,12,4,3],[44,12,4,3],[4,19,5,3],[43,19,5,3],[4,26,4,4],[44,26,4,4],[7,31,6,3],[24,31,4,3],[18,32,1,2],[33,32,1,2]],
  anchor: [[19,3,14,6],[4,4,5,3],[12,4,4,3],[37,4,5,4],[4,11,4,3],[12,11,3,3],[37,12,4,3],[45,12,3,3],[4,19,5,3],[45,19,3,3],[33,23,4,8],[38,23,4,8],[43,23,5,8],[4,26,4,4],[7,31,6,3],[24,31,4,3],[18,32,1,2]],
  thornbury: [[5,4,9,6],[19,4,5,3],[27,4,3,3],[20,11,1,2],[22,11,1,2],[28,11,1,2],[3,17,6,3],[13,17,4,3],[22,17,5,4],[3,25,5,3],[19,25,4,3],[13,26,1,2],[28,26,1,2]],
  cragfoot: [[3,4,7,4],[15,5,4,3],[23,6,1,2],[6,9,3,1],[15,13,4,4],[3,14,5,3],[22,14,3,3],[3,21,4,3],[13,21,3,3],[22,21,3,3]],
}


// §0e (v6): THE FOUNTAIN BECOMES ITS OWN NODE.
//
// 'U' has always been drawn as a fountain and has always BEEN a well, because
// the comment in the frozen legend is right: a node type is a rules-hash change
// and a basin is not worth one. That argument held for exactly as long as the
// fountain did nothing.
//
// It does something now. The crossing out of Nought is offered at the fountain
// in Anchor, and it cannot be offered at a well: `drink` restores a citizen to
// full with no cooldown, so in a place where death is free and fighting is the
// point, the well is the most-touched object a resident has. An irreversible
// act does not share furniture with a habit.
//
// So 'U' is a `fountain` in v6 and a `well` everywhere before it. The frozen
// legend is untouched and v1-v5 do not move a tile.
export const LEGEND_V6 = { ...LEGEND_BASE_FOR_V6, U: 'fountain' }

// §0e (v6): OXENFORD'S FOUNTAIN IS A WELL. There is ONE fountain in the world
// and it stands in Anchor. A second one would be a second door that does not
// open, and every window would have to explain why.
export const PLANS5_V6 = {
  // ANCHOR. Every building is a ROOM with a door. The rampart and the keep
  // curtain are % -- massive stone; the buildings are # -- timber. The bank
  // hall holds three booths behind one door, which is what a bank is.
  anchor: [
    // §7ay: THE CAPITAL, REBUILT.
    //
    // Four terrace bands and a walled compound: seventeen near-identical rooms
    // in ruled rows, every door on the same line. The starkest statement of the
    // fault Oxenford and Millbrook were redrawn to fix, and the biggest town on
    // the island wearing it.
    //
    // A capital needs something that DOMINATES and Anchor had nothing -- its
    // largest room was a 13x6 in a row of 13x6s. THE KEEP is 16x8 and holds the
    // whole north: the three banks, the vault clerk, and a hall behind them.
    // Everything else defers to it, which is what a capital is.
    //
    // The GAOL is kept as it was drawn: a curtain wall of its own, three cell
    // blocks, two guards and the second bank. It is the one thing in this town
    // that should read as a compound rather than a street.
    //
    // THE FOUNTAIN STAYS. The crossing out of Nought is offered at Anchor's
    // fountain and nowhere else in the world; a redrawing that lost it would
    // have closed the only door into this island.
    //
    // Drawn against planlint.mjs and roomfind.mjs: no essential cut off, and
    // nine rooms left unkept for the roster's stalls.
    '%%%%%%%%%%%%%%%%%%%%%%%%%  %%%%%%%%%%%%%%%%%%%%%%%%%',
    '%........................G,........................%',
    '%.................################.................%',
    '%..#######.######.#,,,,,,,,,,,,,,#..#######........%',
    '%..#q,k,e#.#v,h,#.#,,B,k,,,v,,eq,#..#v,q,k#..####..%',
    '%..#,,,,,#.#,,,,#.#,,,,,,,,,,,,,,#..#,,,,,#..#kh#..%',
    '%..#,h,,,#.#,,,k#.#,,,,,,,,,,,,,,#..#,,,,,#..#,,#..%',
    '%..###,###.##,###.#,h,,,e,,,d,,q,#..#,h,e,#..#q,#..%',
    '%.................#,,,,,,,,,,,,,,#..###,###..##,#..%',
    '%.................#######,,#######.....,.......,...%',
    '%.,######,,#####,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.%',
    '%..#S,k,#.,#h,k#.........,,.........######.,#####..%',
    '%..#,,,,#.,#,,,#.........,,.........#k,v,#.,#h,k#..%',
    '%..#,,,,#.,#,,,#.....i...,,.........#,,,,#.,#,,,#..%',
    '%..##,###.,##,##.........,,...*.....#,,,,#.,#,,,#..%',
    '%....,....,..,...........,,.........##,###.,##,##..%',
    '%....,....,..,...........,,...........,....,..,....%',
    ' .,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,. ',
    ' ,,#######,..............,,................,#####.. ',
    '%..#h,k,d#,..............,,................,#k,q#..%',
    '%..#,,,,,#,..........U...,,................,,,,,#..%',
    '%..#,e,,,#,...G..........,,................,#,,h#..%',
    '%..###,###,..............,,.....%%%%%%%%%%%%%%%%%..%',
    '%.........,..............,,.....%,h,,#GG,,#,ek,,%..%',
    '%.........,..............,,.....%,,,,#,,,,#,,,,,%..%',
    '%..######.,..............,,.....%,,,,#,,,,#,,,,,%..%',
    '%..#B,k,#.,..............,,.....%,,,,#,,,,#,,,,,%..%',
    '%..#,,,,#.,.........o....,,.....%,,,,#,,,,#,,,,,%..%',
    '%..#,,,,#.,..............,,.....%,,,,#,,,,#,,,,,%..%',
    '%.,#,,,q#,,,,,,,,,,,,,,,,,,,,,,,%,,,,#,,,,#,,,,,%..%',
    '%..##,####,###.........###,##...%,,,,#,,,,#,,,,,%..%',
    '%.....#k,e,,h#..##,##..#k,,,#...%%%,%%%%,%%%%,%%%..%',
    '%.....#,,,,,,#..#h,k#..#,,,,#......,...............%',
    '%.....#,d,,,,#..#,,,#..#,h,,#......,...............%',
    '%.....########..#####..###G##......,...............%',
    '%%%%%%%%%%%%%%%%%%%%%%%%%  %%%%%%%%%%%%%%%%%%%%%%%%%',
  ],






  // MILLBROOK: THE MARKET. Bank with banker and the store with its keeper on the
  // top row, six clean shop-fronts below for the specialist stalls, homes, and
  // an open eastern plaza the roads cross -- a dense paved market on the WEST,
  // clear of the roads. Redrawn bigger in v6.
  millbrook: [
    // §7at: THE MARKET TOWN, THIRD DRAWING.
    //
    // Five terrace bands first. Then thirteen buildings scattered evenly over a
    // 52x36 rect, which came out as ISLANDS IN A CAR PARK -- five to ten tiles
    // of pavement between every pair, so nothing read as a street because there
    // was no ground for a street to be a street AGAINST.
    //
    // A town is DENSE. Varrock's houses nearly touch; the gap between them IS
    // the street, one tile, and the open ground is one square everything faces.
    // Seventeen buildings here, shoulder to shoulder in four ranges, from a 9x6
    // store down to a 4x4 cot, with a one-tile gap between neighbours, a spur
    // from every door to the nearest lane, and the middle left clear.
    //
    // THE MIDDLE IS EMPTY ON PURPOSE. 7k lays plaza where the centre is open
    // and no wall stands within a tile, and that plaza is the only ground on
    // Tallyholm a citizen may raise a stall on.
    //
    // §7bo: THREE MORE ROOMS UNKEPT. The lumber stall walked back out into the
    // square every time the room list changed -- the seater takes rooms in
    // index order, so growing the list moves which house each stall gets, and
    // a stall whose house is now occupied falls back to open ground. Slack is
    // the answer: more unkept rooms than stalls, so the order cannot matter.
    '%%%%%%%%%%%%%%%%%%%%%%%%%  %%%%%%%%%%%%%%%%%%%%%%%%%',
    '%........................,,........................%',
    '%.................#########........................%',
    '%..#######.######.#S,,,,q,#.########.#######.......%',
    '%..#q,,,e#.#v,,,#.#,,,,,,,#.#,,e,,v#.#d,h,,#.####..%',
    '%..#,,,,,#,#,,,,#.#,,,,,,,#.#,,,,,,#.#,,,,,#.#,h#..%',
    '%..#,h,,,#,#,,,d#.#,h,,e,v#.#,h,,q,#.#,,,,,#.#,,#..%',
    '%..###,###,##,###.####,####.####,###.#,e,q,#.#q,#..%',
    '%.....,...,..,........,..,,.....,....###,###.##,#..%',
    '%.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.%',
    '%.........,..............,,..............,.........%',
    '%..######.,..............,,..............,.######..%',
    '%..#B,k,#.,..............,,..............,.#k,v,#..%',
    '%..#,,,,#.,..........i...,,..............,.#,,,,#..%',
    '%..#,,,q#.,..............,,..............,.#,,,,#..%',
    '%..##,###.,..............,,..............,.##,###..%',
    '%....,....,..............,,...U..........,.........%',
    ' ,,,,,,,,,,..............,,..............,......... ',
    ' ..#######,..............,,..............,#######,, ',
    '%..#h,,,d#,..............,,..............,#q,,,h#..%',
    '%..#,,,,,#,..............,,..............,#,,,,,#..%',
    '%..#,e,,,#,.........*....,,..............,#,e,,,#..%',
    '%..###,###,..............,,..............,###,###..%',
    '%.........,..............,,..............,.........%',
    '%.........,..............,,......o.......,.........%',
    '%..######.,..............,,..............,.######..%',
    '%..#e,,,#.,......!.......,,..............,.#d,h,#..%',
    '%..#,,,,#.,..............,,..............,.#,,,,#..%',
    '%..#,,,,#.,..............,,..............,.#,,,,#..%',
    '%.,#,,,q#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#,,,,#,.%',
    '%..##,####,###.........###,##.........##,#.##,###..%',
    '%.....#,,e,,h#..##,##..#,,,,#..##,##..#k,#.........%',
    '%.....#,,,,,,#..#h,k#..#,,,,#..#e,k#..#,,#.........%',
    '%.....#,d,,,,#..#,,,#..#,h,,#..#,,,#..#,h#.........%',
    '%.....########..#####..######..#####..####.........%',
    '%%%%%%%%%%%%%%%%%%%%%%%%%  %%%%%%%%%%%%%%%%%%%%%%%%%',
  ],










  // OXENFORD: the market square open to the sky, its rooms around the edge.
  oxenford: [
    // §7aq: A TOWN, NOT THREE TERRACES -- SECOND DRAWING.
    //
    // The first attempt got the principle right and the execution wrong: the
    // lanes came out four and five tiles across, which reads as a courtyard
    // rather than a street, and nothing in it dominated -- 7x6 beside 6x4
    // beside 5x4 is one register, not a town.
    //
    // Six rules, off a map of Varrock:
    //
    //   LANES ONE TILE WIDE. A street is a gap you walk down, not a plaza you
    //   cross. The buildings crowd it on both sides.
    //
    //   SOMETHING DOMINATES. The hall is 13x7 and holds the whole north end;
    //   the smallest building on the plan is 3x3. That is the range a town has
    //   -- a manor and a shed -- and it is what the first drawing lacked.
    //
    //   SEPARATE FOOTPRINTS. Nothing shares a wall with anything.
    //
    //   BROKEN ALIGNMENT. No two doors on a line, no two frontages flush.
    //
    //   LANES THAT FORK AND DEAD-END. Three run north-south, one runs the
    //   width of the town, and the smithy's lane stops at the smithy.
    //
    //   A KEEPER IN EVERY HOUSE. Nine buildings, nine people. A room nobody
    //   lives in is the fault of 16 all over again, and the first drawing
    //   left four of them.
    //
    // §7as: AND NO ANVIL. The first pass of this drawing gave Oxenford a
    // smithy -- 's' and 'A' -- which put a SECOND anvil on an island whose own
    // crier says, at Cragfoot, "Mine here; the anvil is at Thornbury." One
    // anvil is a rule this world states out loud and builds a two-hundred-mile
    // errand around; a drawing does not get to quietly add another.
    //
    // A ford town gets the trade a ford town has: a wheelwright's shop, which
    // is a hearth, a bench and a man, and no forge.
    //
    // Nothing stands below plan row 24: that band is water and blocked ground
    // at this seat, which the validator refused three times before the first
    // drawing was accepted. The lane runs down through it to the ford.
    //
    // §7bf: AND ROOM TO STAND IN. Two of these were drawn so small that their
    // furniture filled every tile of the floor -- a 3x1 interior with three
    // things in it, a 2x2 with four. Nobody could enter, and the audit that
    // found it only ran because PLAN_ROOMS finally listed every room rather
    // than the shops (7bd). A room needs a tile with nothing on it.
    //
    // §7bi: a panel or two opened by planopen.mjs. The linter found floor here
    // that no citizen could reach -- rooms with nobody in them, which every
    // check before it was blind to -- and this cuts one wall between each and
    // the nearest ground the town can walk. A repair, not a design: the
    // drawing was wrong, and a door nobody chose still beats a sealed room.
    '                                    ',
    ' .................................. ',
    ' ...###########..........##,##..... ',
    ' ...#d,,,h,,,v#..........,q,e#..... ',
    ' ...#,,,,,,,,,#....,,,,,,#,,,#..... ',
    ' ...#,e,,k,,q,#....,.....#,h,#.###. ',
    ' ...#,,,,,,,,,#....,.....##,##.#q#. ',
    ' ...#h,,,,,,,e#....,......,....#,,. ',
    ' ...####,######....,......,....#k#. ',
    ' ......,...........,......,....###. ',
    ' ......,,,,,,,,,,,,,,,,,,,,,,,,,,,. ',
    ' ......,...........,......,........ ',
    ' ..#######,........,......,..#,#### ',
    ' ..#B,,k,#,........,......,..#,d,h# ',
    ' ..#,,,,,#,........,......,..#,q,,# ',
    ' ..#,e,q,#,..#####.,......,..#k,,e# ',
    ' ..###,###,..#h,v#.,......,..###,## ',
    ' ....,....,..#k,,#.,......,....,... ',
    ' ....,,,,,,,.##,##.,,,,,,,,,,,,,... ',
    ' ....,........,....,......,........ ',
    ' ....,........,....,......,........ ',
    ' ..####,####..,....,......,..##,#.. ',
    ' ..#S,,,,,q#..,....,......,..,v,#.. ',
    ' ..#,,k,,,,#..,....,......,..,,k#.. ',
    ' ..#####,###..,....,......,..##,##. ',
    ' .......,.....,....,......,....,... ',
    ' .......i,,,,,,,,,,,,,,,,,,,,,,.... ',
    ' ..................,..U...,...!.... ',
    '                                    ',
  ],


  // THORNBURY: the manor behind a rampart, the village at its gate.
  thornbury: [
    // §7bb: THE FORGE TOWN.
    //
    // Three terrace bands and a walled quarter, with the island's only anvil
    // sitting in the middle band between a bed and a barrel -- the single most
    // important object on Tallyholm, drawn as a piece of furniture in a row of
    // cottages.
    //
    // THE FORGE IS THE TOWN. It is 11x8, alone in its own yard inside the
    // wall, the largest building here by a long way, and everything else
    // stands outside looking at it. Cragfoot's crier says "Mine here; the
    // anvil is at Thornbury" and a citizen who walks two hundred tiles on the
    // strength of that should arrive somewhere that looks like the reason.
    //
    // The wall is kept: this is where the metal of the island is worked, and a
    // town like that is guarded.
    //
    // §7bi: a panel or two opened by planopen.mjs. The linter found floor here
    // that no citizen could reach -- rooms with nobody in them, which every
    // check before it was blind to -- and this cuts one wall between each and
    // the nearest ground the town can walk. A repair, not a design: the
    // drawing was wrong, and a door nobody chose still beats a sealed room.
    '                                  ',
    ' ................................ ',
    ' %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% ',
    ' %..###########.,.#######.#####.% ',
    ' %..#,,,,,,,,,#.,.#B,k,,#.#k,h#.% ',
    ' %G.#,A,s,,k,v#.,.#,,,,,#.#,,,#G% ',
    ' %..#,,,,,,,,,#.,.#,e,q,#.#,,,#.% ',
    ' %..#,,,,,,,,,#.,.###,###.##,##.% ',
    ' %..#,h,,q,,e,#.,...........,...% ',
    ' %..#,,,,,,,,,#.,...........,...% ',
    ' %..#####,#####,,.##,#,#..##,##.% ',
    ' %.......,.....,,.#h,k,#..#k,q#.% ',
    ' %!,,,,,,,,,,,,,,,,,e,,#,,#,,o#.% ',
    ' %.............,,.######..#####.% ',
    ' %%%%%%%%%%%%%%,,%%%%%%%%%%%%%%%% ',
    ' ...............,................ ',
    ' .########..######...#######..... ',
    ' .#e,k,,d#..#h,k,#...#S,k,q#.#### ',
    ' .#,,,,,,#..#,,,,#...#,,,,,#.#kh# ',
    ' .#,h,,,,#..#,,,,#...#,,,,,#.#,,# ',
    ' .####,###..##,###...#,h,e,#.#,,# ',
    ' .....,..,....,.,....###,###.#,## ',
    ' .,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,. ',
    ' .....*........i,................ ',
    ' .###,###,......,.###,##.,....... ',
    ' .#k,,,h#,.##,##,.#k,,,#.,##,###. ',
    ' .#,,,,,#,.#h,k#,.#,,,,#.,#e,k,#. ',
    ' .#,d,,,#,.#,,,#..#,h,,#.,#,,,,#. ',
    ' .#######,.#####..######.,######. ',
    '                                  ',
  ],

  // EASTMERE: the quayside street, its rooms facing the water.
  eastmere: [
    // §7be: THE PORT.
    //
    // Three terrace bands with the sea to the east and three jetties reaching
    // out of them -- the same ruled rows as everywhere else, and a town whose
    // whole reason is the water arranged so that almost nothing faced it.
    //
    // A port is a ROAD ALONG THE WATER with the town pressed against it. The
    // quayside street runs the length of the shore, three ways lead down to the
    // jetties, and the warehouses stand on the quay with the houses behind
    // them and the cots behind those.
    //
    // The jetties are kept exactly: 21 deck tiles and three fishing marks off
    // their ends. The first draft laid its warehouses straight ACROSS them and
    // took six of the twenty-one -- a later stroke over an earlier one, and
    // this time over the thing the whole town is for. They stand between the
    // jetties now.
    //
    // §7bg: AND A SHOP FOR THE FISHMONGER. Eastmere's rostered stall stood in
    // the open because every room in the town had a keeper in it -- the same
    // fault as Millbrook (7aw), committed again one town later, because "leave
    // rooms unkept" was learned as a fact about Millbrook rather than as a rule
    // about towns that hold a stall. Two quayside rooms are empty on purpose.
    //
    // §7bi: a panel or two opened by planopen.mjs. The linter found floor here
    // that no citizen could reach -- rooms with nobody in them, which every
    // check before it was blind to -- and this cuts one wall between each and
    // the nearest ground the town can walk. A repair, not a design: the
    // drawing was wrong, and a door nobody chose still beats a sealed room.
    '                             ~~~~~~~~~',
    ' ....................#####...~~~~~~~~~',
    ' .,,,,,,,,,,,,,,,,,,,#,,q#,,.~~~~~~~~~',
    ' .....,#####,######.,#,,,#,..~~~~~~~~~',
    ' .####,#k,e#,#B,k,#.,##,##,..~~~~~~~~~',
    ' .#k,#,#,,h#,#e,h,#.,,,,=======F~~~~~~',
    ' .#,,,,,,,d#,#q,,,#.,#####,..~~~~~~~~~',
    ' .####,#,,,#,#,,,,#.,#,S,#,..~~~~~~~~~',
    ' .....,#####,###,##o,,,,,#,G.~~~~~~~~~',
    ' .,,,,,,,,,,,,,,,,,,,#,q,#,,.~~~~~~~~~',
    ' .....,##,##,###,##.,#####,..~~~~~~~~~',
    ' .####,#,,,#,#k,,,#.,.....,..~~~~~~~~~',
    ' .#k,#,#h,k#,,,h,d#.,,,,=======F~~~~~~',
    ' .#,,,,,,v,,,#,e,,#.,###,#,..~~~~~~~~~',
    ' .####,#####,######.,#,k,#,..~~~~~~~~~',
    ' ...*.,.....,.......,,,v,#,..~~~~~~~~~',
    ' .,,,,,,,,,,,,,,,,,,,#,h,#,,.~~~~~~~~~',
    ' .##,#,##,##,######.,#####,..~~~~~~~~~',
    ' .#,,#,#k,q#,#h,k,#.,.....,..~~~~~~~~~',
    ' .#k,#,#,h,#,#e,,,#.,,,,=======F~~~~~~',
    ' .####,#,,,#,#,,,,#.,.....,..~~~~~~~~~',
    ' .....,##,##,###,##.,.....,..~~~~~~~~~',
    ' .,,,,,,,,,,,,,,,,,,,,,,,,,,.~~~~~~~~~',
    '                             ~~~~~~~~~',
  ],

  // GREENHOLLOW: a clearing. Four doors and a wood for a wall.
  greenhollow: [
    // §7bm: THE CLEARING.
    //
    // Four blocks in a two-by-two with a neat border of trees round them, and a
    // SMITH in the south-east range that 7as forbids. A clearing is not a
    // rectangle with a hedge of trees: the wood closes in raggedly, and the
    // town is what the wood has not taken back.
    //
    // One crooked street through the middle, forking at the timber end. THE LOG
    // HALL is 9x6 and holds the centre -- where the Greenwood's timber is
    // graded and stacked, which is the whole reason anyone lives here.
    '                                ',
    ' ..T.....T...T........T...T.... ',
    ' .....T.........T...........T.. ',
    ' ..........,.........,......... ',
    ' T..,,,,,,,,,,,,,,,,,,....,.... ',
    ' .########.,########.,#######.T ',
    ' .#B,k,e,#.,#k,h,d,#.,#k,q,h#.. ',
    ' .#h,,,,,#.,#e,,,,,#.,#,,,,,#.. ',
    ' .#,,,,,,#.,#,,,,,,#.,#,,,,,#.. ',
    ' T####,###.,####,###.,###,###.. ',
    ' .,,,,,,,,,,,,,,,,,,,,,,,,,,,,T ',
    ' .###,##...,#########,###,##... ',
    ' .#k,,,#...,#S,k,e,h#,#k,,,#!.. ',
    ' .#,h,,#...,#,,,,,,,#,#,e,h#... ',
    ' .#,,,,#...,#,,,,,,,#,#,,,,#... ',
    ' T#,,,,#...,#,,,,,,,#,######... ',
    ' .######...,####,####,........T ',
    ' .....,,,,,,,,,,,,,,,,,,,,,.... ',
    ' ......###,##..*.....,##,##.... ',
    ' ......#,,,,#.........#,,,#..T. ',
    ' ..T...######....T....#####.... ',
    '                                ',
  ],

  // CRAGFOOT: three shelves, six doors, one stair. The retaining walls are
  // ramparts because that is what they are: the hill held back.
  cragfoot: [
    // §7bc: THE MINING TOWN, CUT INTO THE CRAG.
    //
    // Six identical blocks in a two-by-three grid, with retaining walls between
    // them and every stair in a line. The banded structure was RIGHT -- a town
    // on a hillside is terraced, and those walls are what hold it up -- and
    // everything inside them was the same fault as everywhere else.
    //
    // Same terraces, stairs off-centre on each, and eleven buildings of
    // different sizes crowding the lanes: the store holding the top level,
    // where a delver spends what the seam pays, and the cots stepping down
    // below it.
    //
    // Nothing stands below the last wall. That band is three rows deep -- a
    // house needs three for itself and a fourth for the street it faces -- so
    // it is the town's approach: open ground, a fire, and the road to the seam.
    //
    // Drawn with townkit: lanes first, then each house chooses the wall that
    // faces one. Four towns were drawn houses-first and every one cost several
    // passes to the same three faults -- a door a later stroke overwrote,
    // furniture on the threshold, a door opening on ground no lane reached.
    // The kit cannot make any of them, and it refuses a house no street
    // touches, by name, before the world is built.
    //
    // §7bi: a panel or two opened by planopen.mjs. The linter found floor here
    // that no citizen could reach -- rooms with nobody in them, which every
    // check before it was blind to -- and this cuts one wall between each and
    // the nearest ground the town can walk. A repair, not a design: the
    // drawing was wrong, and a door nobody chose still beats a sealed room.
    '                            ',
    '                            ',
    '  ........................  ',
    '  ##,#,####,.,.......,....  ',
    '  #S,k,q,h#,.,######.,....  ',
    '  #,e,v,,,#,.,#k,h,#.#####  ',
    '  #,,,,,,,#,.,#d,,,#.#e,k#  ',
    '  #,,,,,,,#,.,#,,,,#.#,,,#  ',
    '  ####,####,.,###,##.##,##  ',
    '  ,,,,,,,,,,,,,,,,,,,,,,,,  ',
    '  %%%%%,,%%%%%%%%%%%%%%%%%  ',
    '  .....,,.,...............  ',
    '  ........,...######,.....  ',
    '  ##,#,##.,...#d,h,#,#####  ',
    '  #B,k,q#.,...#k,e,#,#k,q#  ',
    '  #,h,e,#.,...#v,,,#,#,,,#  ',
    '  #,,,,,#.,...#,,,,#,#,,,#  ',
    '  ###,###.,...###,##,##,##  ',
    '  ,,,,,,,,,,,,,,,,,,,,,,,,  ',
    '  %%%%%%%%%%%%%%,,%%%%%%%%  ',
    '  ######,,..#####,.,,#####  ',
    '  #e,k,#,,..#h,,#..,,#k,,#  ',
    '  #h,,,#,,..#,k,#..,,#,h,#  ',
    '  #,,,,#,,..#,,,#..,,#,,,#  ',
    '  ###,##,,..##,##..,,##,##  ',
    '  ,,,,,,,,,,,,,,,,,,,,,,,,  ',
    '  %%%%%%%%%,,%%%%%%%%%%%%%  ',
    '  .........,,.............  ',
    '  ....*....,,...i.........  ',
    '  .......G................  ',
    '                            ',
    '                            ',
  ],

  // FENMARCH: the causey through, and every door opening onto decking.
  fenmarch: [
    // §7bj: THE FEN TOWN, AND THE MIRROR IT WAS.
    //
    // A pier down the middle with the SAME blocks either side of it, twice
    // over: four identical 9x4s, then four more, in perfect bilateral symmetry.
    // A town does not grow symmetrically; a fen town least of all, because it
    // grows where the reed lets it.
    //
    // The pier stays -- it is the one dry line through the marsh -- and the
    // walks branch off it at different lengths on each side. THE EEL HOUSE is
    // 10x6 and holds the east, where the fen's catch is smoked and packed; a
    // 3x5 cot hangs off a walk on the other side.
    //
    // (It also held a SMITH, which the anvil rule of 7as forbids and nobody
    // had noticed, because the rule lived in a comment rather than in the
    // tool. townkit refuses it now.)
    //
    // A BOARDWALK IS A STREET. The kit counted only ',' as a lane, so in a town
    // that is nothing but decking no house could find a frontage and the whole
    // drawing was refused. Decking is footing: it is what a fen town walks on.
    '                 ===                ',
    ' ................===............... ',
    ' .######..######.===.########...... ',
    ' .#B,k,#=.#k,h,#.===.#k,q,e,#...... ',
    ' .#e,,,#=.#,,,,#.===.#,,,,,,#...... ',
    ' .###,##=.###,##.===.####,###...... ',
    ' .f============================f... ',
    ' ...........=.o..===##########,,,,. ',
    ' ..########.=###.===#S,k,q,v,#,.... ',
    ' f.#k,h,d,#.=#,#.===,e,h,d,,,#,...f ',
    ' ..#e,,,,,#.=,,#.===,,,,,,,,,#,.... ',
    ' ..#,,,,,,#.=#,#.===#,,,,,,,,#,.... ',
    ' ..####,###.=###.===#####,####,.... ',
    ' ....=============================. ',
    ' .####,##.=..####===...=####,###... ',
    ' .#h,,,,#.=..#h,#===...=#k,,,,e#... ',
    ' f#k,e,,#.=..#,,#===...=#,h,d,,#..f ',
    ' .#######.=..##,#===...=#,,,,,,#... ',
    ' ........===========...=########... ',
    ' ..........##,##.===............... ',
    ' ..........#,,,#.===G.............. ',
    '           ##### ===                ',
  ],

  // NORWICK: the doubled west rampart, four barracks behind it.
  norwick: [
    // §7bl: THE GARRISON AND THE MONASTERY.
    //
    // Four blocks in a two-by-two, guards scattered between them, and a SMITH
    // in the north-east range -- which 7as forbids, and which nobody had seen
    // because the rule lived in a comment until townkit was taught to refuse it.
    //
    // The curtain wall stays: a place that holds both a garrison and the only
    // ossuary outside the Boneyard is walled. THE MONASTERY HALL holds the
    // north-west, and the ossuary is the reason a citizen walks to Norwick at
    // all. The garrison ranges sit below the cross of the gates.
    //
    // §7bo: AND NO WAYSTONE. The first drawing put a 'W' in the hall and the
    // comment called it a waystone -- and THERE ARE NO WAYSTONES IN V7. They
    // were taken out deliberately: this world has no recall, and a stone that
    // moves a citizen across it would undo the tolls, the roads, the two
    // hundred tiles between the seam and the anvil, and the flight rule.
    //
    // Nothing was placed, because the engine no longer knows the type -- which
    // is worse, not better: a character the loader silently drops is a landmine
    // that arms itself the day somebody makes the type valid again.
    '%%%%%%%%%%%%%%%%..%%%%%%%%%%%%%%%%',
    '%...............,,...............%',
    '%.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.%',
    '%.,####,#####,#.,,####,###.####,.%',
    '%.,#v,,,,k##,,#.,,#B,,,,k#.#k,#,.%',
    '%.,#,h,e,,##k,#.,,#,h,,,,#.#h,#,.%',
    '%.,#,,,,,,##h,#.,,#,,,,,,#.#,,,,.%',
    '%.,#,,,,,,#####.,,########.#d,#,.%',
    '%.,#,,,,,,#.....,,......,..####,.%',
    '%.,########.....,,......,......,.%',
    '%.,......,......,,......,......,.%',
    '.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.',
    '.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.',
    '%.,###,##,.##,#.,,####,####.###,.%',
    '%.,#k,,,#,.#,,#.,,#S,,,,k,#.#,#,.%',
    '%.,#,h,e#,.#k,#.,,#e,h,,,,#.#,,,.%',
    '%.,#,,,,#,.#q,#.,,#,,,,,,,#.#,#,.%',
    '%.,######,.####.,,#,,,,,,,#.###,.%',
    '%.,#####.,......,,#########....,.%',
    '%.,#,,,#.,......,,......,......,.%',
    '%.,##,##.,......,,......,......,.%',
    '%.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.%',
    '%...............,,...............%',
    '%%%%%%%%%%%%%%%%..%%%%%%%%%%%%%%%%',
  ],

  // HOLLYBARROW: a farm. The hedge encloses; the rooms are cottages.
  hollybarrow: [
    // §7bn: THE FARM TOWN.
    //
    // Four blocks in a two-by-two inside a hedge, with the orchard and the
    // crofts laid out in rows as regular as the houses. A farm is the least
    // regular place there is: it is a yard with buildings round it, and the
    // buildings are of every size because they do different work.
    //
    // THE GREAT BARN is 13x7 and holds the east -- a farm's biggest building is
    // not a house -- with the farmhouse, the byres and the cots round the yard,
    // and the ploughed strips where the hedge lets them run.
    //
    // The hedge stays, gates north and south where the drove road runs through.
    //
    // §7bo: AND TWO ROOMS LEFT UNKEPT. Hollybarrow's seed stall stood in the
    // open yard -- the fourth town to make this mistake, after Millbrook,
    // Eastmere and the rest. A stall brings its own keeper. townkit refuses a
    // drawing that leaves no room for one now, and this drawing predated the
    // check being applied to it.
    '                                    ',
    ' """""""""""""""".."""""""""""""""" ',
    ' ".#####,.######.,,.########......" ',
    ' ".#B,k#,.#k,h,#.,,.#k,e,h,#......" ',
    ' ".#,,,#,.#,,,,#.,,.#,,,,,,#T.T.T." ',
    ' ".##,##,.###,##.,,.####,###p.p.p." ',
    ' ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,," ',
    ' ".#####,.###,##.,,#############.." ',
    ' ".#k,h#,.#k,,,#.,,#S,k,e,h,,,,#.." ',
    ' ".#,,,#,.#,h,,#.,,#,,,,,,,,,,,#.." ',
    ' ".#,,,,,.#,,,,#.,,#,,,,,,,,,,,#.!" ',
    ' ".#,,,#,.#,,,,#.,,#,,,,,,,,,,,#.." ',
    ' ".#,,,#,.######.,,#,,,,,,,,,,,#.." ',
    ' ".#####,........,,######,######.." ',
    ' ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,," ',
    ' ".########.####.,,........,##,##." ',
    ' ".#,,e,h,#.#,,#.,,........,#,,,#." ',
    ' ".#,,,,,,#.#q,#.,,........,#h,k#." ',
    ' ".#,,,,,,#.#,,#.,,........,#,,,#." ',
    ' ".####,###.##,#.,,........,#####." ',
    ' ".,,,,,,,,,,,,,,,,,,,,,,,,,,,,..." ',
    ' "..p..p..p..p...,,.p..p..p,......" ',
    ' """""""""""""""".."""""""""""""""" ',
    '                                    ',
  ],

}
