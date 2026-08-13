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
const LEGEND_BASE = {
  // TWO KINDS OF WALL, one node type. The engine is explicit that "only a
  // landmark bears a kind", so a rampart and a cottage wall are the same
  // node in the state -- and they must be, or the geography hash would care
  // about something purely visual. The DISTINCTION lives in the drawing:
  // '%' is a rampart (the town wall, a keep's curtain, a manor's), '#' is a
  // building wall. Windows carry the plans already, so they can look up
  // which is which and draw stone or timber accordingly. Without this a
  // town of twenty walk-in buildings looks like twenty castles inside a
  // castle.
  // THE DRAWINGS HAVE ALWAYS KNOWN THE DIFFERENCE.
  //
  // '%' is a town's outer work and '#' is a building, and every plan has used
  // them that way -- but this table mapped both to `wall`, so four hundred and
  // seventy-eight tiles of rampart across four towns drew as house masonry.
  //
  // `rampart` is a node type of its own now; it blocks exactly as a wall does
  // and carries no roof, because nothing lives behind a curtain wall.
  '%': 'rampart',        // rampart: massive, battlemented, a town's edge
  '#': 'wall',        // building: timber and plaster, domestic
  '"': 'hedge',       'f': 'fence',
  'B': 'bank',        'S': 'store',       'A': 'anvil',   's': 'smith',
  'k': 'keeper',      'G': 'guard',       'h': 'hearth',
  'o': 'well',        '*': 'campfire',    'i': 'signpost',
  'W': 'waystone',    '!': 'landmark',    'p': 'plot',
  'T': 'tree',        'n': 'rock',        'F': 'fishing-spot',
  // FURNITURE. Four nouns that only ever stand indoors -- the thing Dragon
  // Quest has that we did not, and the reason our rooms read as boxes with
  // a counter in them rather than places somebody lives.
  'e': 'landmark',    // a table
  'd': 'landmark',    // a bed
  'v': 'landmark',    // a shelf
  'q': 'landmark',    // a barrel
  'U': 'well',        // a FOUNTAIN. It is a WELL node -- the engine whitelists
                      // landmark kinds and a new one would move the rules
                      // hash for something purely visual. The windows carry
                      // the plans, so they look up the 'U' and draw a basin
                      // instead of a windlass. Same trick as the ramparts.
}
export const LEGEND = LEGEND_BASE
// ',' is INTERIOR FLOOR. Open ground like '.', reserved so nothing scatters
// on it, but it carries a different surface: boards, not dirt. Dragon Quest
// makes a shop read as INSIDE not with its walls but with its floor -- you
// are plainly not standing on the grass any more. Ours were the same dirt as
// the street, and that is most of why a room did not feel like a room.
export const OPEN = new Set(['.', '@', ','])
export const FLOOR = ','
// A COASTAL drawing declares its own shoreline. This is the general answer
// to the lesson Anchor's smithy taught -- that a drawing does not know
// where the water went. Instead of the author guessing a seat and the
// validator rejecting it, the plan states which of its tiles must be sea,
// and the loader SEARCHES the coast for a placement where the declared
// water and the real water agree. A port then finds its own harbour.
//   '~'  must be open water (places nothing)
//   '='  a quay: walkable decking over water, whatever the terrain says
// per-character landmark kinds. '!' is a standing stone unless the plan says
// otherwise; 'U' is always a fountain.
export const KIND_FOR = { 'e': 'table', 'd': 'bed', 'v': 'shelf', 'q': 'barrel' }
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
  // ANCHOR. Every building is a ROOM with a door. The rampart and the keep
  // curtain are % -- massive stone; the buildings are # -- timber. The bank
  // hall holds three booths behind one door, which is what a bank is.
  anchor: [
    '%%%%%%%%%%%%%%%%%%%%%%%%%  %%%%%%%%%%%%%%%%%%%%%%%%%',
    '%..................................................%',
    '%..................................................%',
    '%..############...########...##########...#######..%',
    '%..#qBBB,,,kv,#...#,,,,v,#...#,,,,,,v,#...#,,ed,#..%',
    '%..#,,,,,,,,,,#...#,,*k,,#...#,A,s,A,,#...#,h,k,#..%',
    '%..#,,,,,,,,,,#...#,!,,,,#...#,,,,,,*,#...#,,,,,#..%',
    '%..#,,,,,,,,*,#...#,,,,,,#...#,,,,,,,,#...###,###..%',
    '%..#,,,,,,,,,,#.T.####,###...#####,####............%',
    '%..######,#####....................................%',
    '%.........................................#######..%',
    '%..#########...########......#########....#,,,d,#..%',
    '%..#v,S,qk,#...#,,,ed,#......#v,S,qk,#....,,he,,#..%',
    '%..#,,,,,,,,...#,h,h,,#......#,,,,,,,#....#,,,,,#..%',
    '%..#,,,,,,,#...#,,,,,,#......#,,,,,,,#....#######..%',
    '%..#########...####,###......####,####.............%',
    '%..................................................%',
    ' ....................*............................. ',
    ' .................................................. ',
    '%......i....................G................T.....%',
    '%..................................................%',
    '%..............o..............%%%%%%%%%..%%%%%%%%%.%',
    '%.........U...................%..................%.%',
    '%.............................%.G.......*......G.%.%',
    '%................!............%..###############.%.%',
    '%.............................%..#,*h,#,GG,#,Bk#.%.%',
    '%...ff.ff.ff.ff...............%..#,,,,#,,,,#,,,#.%.%',
    '%.............................%..#,,,,#,,,,#,,,#.%.%',
    '%..###,###..###,###.###,##....%..#,,,,#,,,,#,,,#.%.%',
    '%..#e,,d,#..#e,,d,#.#de,,#....%..#,,,,#,,,,#,,,#.%.%',
    '%..#,h,k,#..#,h,,,#.#,h,,#....%..#,,,,,,,,,,,,,#.%.%',
    '%..#,,,,,#..#,,,,,#.#,,,,#....%..#######,#######.%.%',
    '%..#######..#######.######....%..................%.%',
    '%.............................%%%%%%%%%%%%%%%%%%%%.%',
    '%..................................................%',
    '%%%%%%%%%%%%%%%%%%%%%%%%%  %%%%%%%%%%%%%%%%%%%%%%%%%',
  ],
  // MILLBROOK: one street, four doors either side of it.
  millbrook: [
    '                                        ',
    ' ...................................... ',
    ' ..#######..########..#######..#######. ',
    ' ..#,,ed,#..#,,Sqv,#..#,,ed,#..#,,,v,#. ',
    ' ..#,h,k,#..#,,,,k,#..#,h,,,#..#,A,s,#. ',
    ' ..#,,,,,#..#,,,,,,#..#,,,,,#..#,,,,,#. ',
    ' ..###,###..####,###..###,###..###,###. ',
    ' ...................................... ',
    ' ...................................... ',
    ' ..............o.........*...........W. ',
    ' .T.................i.................. ',
    ' ...................................... ',
    ' ..###,###..####,###..###,###..###,###. ',
    ' ..#e,,d,#..#e,,,d,#..#vq,k,#..#e,,d,#. ',
    ' ..#,h,,,#..#,h,h,,#..#,,S,,#..#,h,,,#. ',
    ' ..#,,,,,#..#,,,,,,#..#,,,,,#..#,,,,,#. ',
    ' ..#######..########..#######..#######. ',
    '                                        ',
  ],
  // OXENFORD: the market square open to the sky, its rooms around the edge.
  oxenford: [
    '                                    ',
    ' .................................. ',
    ' ..##########.........#########.... ',
    ' ..#vBBB,qk,#.........#v,S,qk,#.... ',
    ' ..#,,,,,,,,#.........#,,,,,,,#.... ',
    ' ..#,,,,,,,,#.........#,,,,,,,#.... ',
    ' ..#,,,,,,,,#.........#,,,,,,,#.... ',
    ' ..#####,####.........####,####.... ',
    ' .................................. ',
    ' .................................. ',
    ' ...ff.ff.ff.ff......ff.ff.ff.ff... ',
    ' ............i..................... ',
    ' .................................. ',
    ' ...................o.....*........ ',
    ' .................................. ',
    ' .................................. ',
    ' .............!.................... ',
    ' ..####,###....!......####,###..... ',
    ' ..#,q,,v,#...........#e,,,d,#..... ',
    ' ..#,S,k,,#...........#,h,k,,#..... ',
    ' ..#,,,,,,#.U.........#,,,,,,#..... ',
    ' ..########...........########..... ',
    ' .................................. ',
    ' ..###,###............###,###...... ',
    ' ..#,e,d,#............#,e,d,#...... ',
    ' ..#,h,,,#............#,h,,,#...... ',
    ' ..#######............#######...... ',
    '                                    ',
  ],
  // THORNBURY: the manor behind a rampart, the village at its gate.
  thornbury: [
    '                                  ',
    ' ................................ ',
    ' ..%%%%%%%%%%%%%%%%%%%%%%%%%%%%.. ',
    ' ..%..#######################.%.. ',
    ' ..%..#,*k,,,#,,hh,,,#,,Sk,,#.%.. ',
    ' ..%.G#,,,,,,#,,,,,,,#,,,,,,#G%.. ',
    ' ..%..#,,,,,,#,,,,,,,#,,,,,,#.%.. ',
    ' ..%..#,,,,,,#,,,,,,,#,,,,,,#.%.. ',
    ' ..%..#,,,,,,#,,,,,,,#,,,,,,#.%.. ',
    ' ..%..#,,,,,,,,,,,,,,,,,,,,,#.%.. ',
    ' ..%..###########,###########.%.. ',
    ' ..%..........................%.. ',
    ' ..%!.........................o.. ',
    ' ..%..........................%.. ',
    ' ..%%%%%%%%%%%%%..%%%%%%%%%%%%%.. ',
    ' ................................ ',
    ' ................................ ',
    ' ..########..........#########... ',
    ' ..#,,,ed,#..........#,,,e,d,#... ',
    ' ..#,h,h,,,..........,,h,k,,,#... ',
    ' ..#,,,,,,#..o......*#,,,,,,,#.T. ',
    ' ..########..........#########... ',
    ' ................................ ',
    ' ..####,###..........####,###.... ',
    ' ..#,,,,v,#..........#e,,,d,#.... ',
    ' ..#,A,s,,#..........#,h,,,,#.... ',
    ' ..#,,,,,,#..i.......#,,,,,,#.... ',
    ' ..########..........########.... ',
    ' ................................ ',
    '                                  ',
  ],
  // EASTMERE: the quayside street, its rooms facing the water.
  eastmere: [
    '                               ~~~~~~~',
    ' ..........................    ~~~~~~~',
    ' ..#########.########......    ~~~~~~~',
    ' ..#,,,,qv,#.#,,,qv,#...!..    ~~~~~~~',
    ' ..#,B,k,B,#.#,S,k,,#......    ~~~~~~~',
    ' ..#,,,,,,,#.#,,,,,,#.....=======F~~~~',
    ' ..#,,,,,,,#.#,,,,,,#......    ~~~~~~~',
    ' ..####,####.####,###......    ~~~~~~~',
    ' ..........................    ~~~~~~~',
    ' ..........................    ~~~~~~~',
    ' ..........................    ~~~~~~~',
    ' ..........................    ~~~~~~~',
    ' ...................o.....=======F~~~~',
    ' ............G.............    ~~~~~~~',
    ' ..................i.......    ~~~~~~~',
    ' ..........................    ~~~~~~~',
    ' ..####,####..###,###......    ~~~~~~~',
    ' ..#e,,,,d,#..#,q,v,#...*..    ~~~~~~~',
    ' ..#,h,h,,,#..#,S,k,#......    ~~~~~~~',
    ' ..#,,,,,,,#..#,,,,,#.....=======F~~~~',
    ' ..#########..#######......    ~~~~~~~',
    ' ..........................    ~~~~~~~',
    ' ..........................    ~~~~~~~',
    '                               ~~~~~~~',
  ],
  // GREENHOLLOW: a clearing. Four doors and a wood for a wall.
  greenhollow: [
    '      T           T             ',
    ' T          T           T       ',
    '  .....T.................T....  ',
    '  ............................T ',
    '  .#########.......########...  ',
    '  T#,,,,qv,#.......#,,,qv,#...  ',
    '  .#,B,k,,,#.......#,S,k,,#...  ',
    '  .#,,,,,,,#.......#,,,,,,#...  ',
    '  .####,####.......####,###...  ',
    '  ............................ T',
    'T ............................  ',
    '  ..........o......*..........  ',
    '  ............................  ',
    '  .........i..................  ',
    '  .####,###........####,####..  ',
    '  .#e,,,d,#........#e,,,,d,#..  ',
    '  .#,h,h,,#........#,A,s,h,#..T ',
    ' T.#,,,,,,#........#,,,,,,,#..  ',
    '  .########........#########..  ',
    '  ............................  ',
    '            T           T       ',
    '      T           T             ',
  ],
  // CRAGFOOT: three shelves, six doors, one stair. The retaining walls are
  // ramparts because that is what they are: the hill held back.
  cragfoot: [
    '                            ',
    '                            ',
    '  ........................  ',
    '  .#########....#########.  ',
    '  .#,,,,,d,#....#,,,,,v,#.  ',
    '  .#,S,k,h,#....#,A,s,A,#.  ',
    '  .#,,,e,,,,....,,,,,,,,#.  ',
    '  .#,,,,,,,#....#,,,,,,,#.  ',
    '  .#########....#########.  ',
    '  ........................  ',
    '  %%%%%%%%%%%..%%%%%%%%%%%  ',
    '  ........................  ',
    '  .#########....#########.  ',
    '  .#,,,,qv,#....#,,,,,d,#.  ',
    '  .#,B,k,,,#....#,h,h,,,#.  ',
    '  .#,,,,,,,,....,,,,e,,,#.  ',
    '  .#,,,,,,,#....#,,,,,,,#.  ',
    '  .#########....#########.  ',
    '  ........................  ',
    '  %%%%%%%%%%%..%%%%%%%%%%%  ',
    '  ..........o.............  ',
    '  .####,###.....####,###..  ',
    '  .#e,,,d,#.....#e,,,d,#..  ',
    '  .#,h,,,,#.....#,h,k,,#..  ',
    '  .#,,,,,,#.....#,,,,,,#..  ',
    '  .########.....########..  ',
    '  ........................  ',
    '  %%%%%%%%%%%..%%%%%%%%%%%  ',
    '  ..........*....i........  ',
    '  .....G.............!....  ',
    '                            ',
    '                            ',
  ],
  // FENMARCH: the causey through, and every door opening onto decking.
  fenmarch: [
    '                ===                 ',
    '                ===                 ',
    '  .#########....===...#########...  ',
    '  .#vB,kqB,#....===...#,qS,kv,#...  ',
    '  .#,,,,,,,#....===...#,,,,,,,#...  ',
    '  .####,####....===...####,####...  ',
    '  .==============================.  ',
    '  ............o.===.*.............  ',
    '  .####,###.....===....####,###...  ',
    '  f#e,,,d,#.....===....#e,,,d,#...f ',
    '  f#,h,h,,#.....===....#,h,,,,#...f ',
    '  .#,,,,,,#.....===....#,,,,,,#...  ',
    '  .########.....===....########...  ',
    '  .==============================.  ',
    '  ............i.===.G.............  ',
    '  .####,####....===....####,###...  ',
    '  f#,,,,,v,#....===....#e,,,d,#...f ',
    '  f#,A,s,,,#....===....#,h,k,,#...f ',
    '  .#,,,,,,,#....===....#,,,,,,#...  ',
    '  .#########....===....########...  ',
    '                ===                 ',
    '                ===                 ',
  ],
  // NORWICK: the doubled west rampart, four barracks behind it.
  norwick: [
    '%%%%%%%%%%%%%%%%..%%%%%%%%%%%%%%%%',
    '%.%..............................%',
    '%.%......................!.......%',
    '%.%.##########......##########...%',
    '%.%.#,,,,,qv,#......#,,,,,,d,#...%',
    '%.%.#,,B,k,,,#......#,A,s,h,,#...%',
    '%.%.#,,,,,,,,#......#,e,,,,,,#...%',
    '%.%.#,,,,,,,,#......#,,,,,,,,#...%',
    '%.%.#####,####......#####,####...%',
    '%.%..............................%',
    '%.%.G.........G..............G...%',
    '.................................%',
    '..............o......*...........%',
    '%.%.G.W.......G..............G...%',
    '%.%...........i..................%',
    '%.%.####,####.......#####,####...%',
    '%.%.#e,,,,d,#.......#e,,,,,d,#...%',
    '%.%.#,h,h,,,#.......#,h,h,k,,#...%',
    '%.%.#,,,,,,,#.......#,,,,,,,,#...%',
    '%.%.#########.......##########...%',
    '%.%....G....G.......G............%',
    '%.%......G.............G..G......%',
    '%.%..............................%',
    '%%%%%%%%%%%%%%%%..%%%%%%%%%%%%%%%%',
  ],
  // HOLLYBARROW: a farm. The hedge encloses; the rooms are cottages.
  hollybarrow: [
    '                                    ',
    ' """""""""""""""".."""""""""""""""" ',
    ' "................................" ',
    ' ".#########......................" ',
    ' ".#,,,,qv,#........T.TTT.T.TTT..." ',
    ' ".#,,S,k,,#......................" ',
    ' ".#,,,,,,,#........T.TTT.T.TTT..." ',
    ' ".#,,,,,,,#......................" ',
    ' ".####,####..........T.T.T.T.T..." ',
    ' ".................p.p.p.p.p.p.p.." ',
    ' "...T.............p.p.p.p.p.p.p.." ',
    ' "................................" ',
    ' "............o.....*............." ',
    ' "................................" ',
    ' "............i..................." ',
    ' ".####,###...........####,###...." ',
    ' ".#e,,,d,#...........#e,,,d,#...." ',
    ' ".#,h,h,,#...........#,h,,,,#...." ',
    ' ".#,,,,,,#...........#,,,,,,#...." ',
    ' ".########...........########...." ',
    ' "................................" ',
    ' ".p.....p.p.p......p.p.p.p.p.p..." ',
    ' """""""""""""""".."""""""""""""""" ',
    '                                    ',
  ],
}

// ---------------------------------------------------------------------
// THE FIFTH FOUNDING'S PLANS
//
// A SEPARATE OBJECT, and it has to be. This file is shared: v4 and v5 both
// lay their towns from it, and for several rounds of edits they laid them
// from the SAME object -- so every shop moved, every bank added and every
// quarter redrawn was silently rewriting the fourth founding as well. v4's
// geography hash had already drifted from ad3a1868 to eb020214 before the
// rampart change made it throw and the shared state came to light.
//
// SPEC 9c is not a style note. A frozen generator must build a frozen
// world: a citizen who walked v4's Anchor must be able to walk it again in
// thirty years and find the same doorways. PLANS above is now exactly what
// it was and is not to be edited again; everything the fifth founding
// wants to change, it changes here.
// ---------------------------------------------------------------------
export const PLANS5 = {
  // ANCHOR. Every building is a ROOM with a door. The rampart and the keep
  // curtain are % -- massive stone; the buildings are # -- timber. The bank
  // hall holds three booths behind one door, which is what a bank is.
  anchor: [
    '%%%%%%%%%%%%%%%%%%%%%%%%%  %%%%%%%%%%%%%%%%%%%%%%%%%',
    '%........................G.........................%',
    '%.################################################.%',
    '%.#qBBB,k,v,,,,,#,vv,,,,e,#,,,,,,,,,v,#,ed,,,v,,,#.%',
    '%.#,,,,,,,,,*,,,#,,,*k,,,,#,A,s,A,,,,,#,h,k,,,,,,#.%',
    '%.#,,,,,,,,,,,e,#,,,,,,,,,#,,,,,,,,*,,#,,,,,,,,h,#.%',
    '%.#,,,,,,,,,,,,,#,,,,,,d,,#,,q,,,,,,,,#,,,,,q,,,,#.%',
    '%.#,,,,,,,,,,,,,#,,,,,,,,,#,,,,,,,,,,,#,,,,,,,,,,#.%',
    '%.#######,###########,##########,###########,#####.%',
    '%..................................................%',
    '%..................................................%',
    '%.#####################......#####################.%',
    '%.#v,S,qk,,,,#,eedd,v,#......#v,qk,,,,,#,e,dd,,v,#.%',
    '%.#,,,,,,,,,,#,h,,,,,,#...U..#,,,,,,h,,#,,,,,,,,,#.%',
    '%.#,*,,,,,,,,#,,,,,,,q#......#,e,,,,,,,#,,,,,q,,h#.%',
    '%.#,,,,,,,,,,#,,,,,,,,#.i....#,,,,,,,,,#,,,,,,,,,#.%',
    '%.#####,##########,####......#####,#########,#####.%',
    ' .G................................................ ',
    ' ................................................G. ',
    '%.#########################...%%%%%%%%%  %%%%%%%%%.%',
    '%.#e,d,,,,#e,d,,,,#d,e,,,,#...%....G.........G...%.%',
    '%.#h,,,,,,#,,,,h,,#,,,,h,,#...%..!......*........%.%',
    '%.#,,,,q,,#,v,,,,,#,q,,,,,#...%.################.%.%',
    '%.#,,,,,,,#,,,,,,,#,,,,,,,#...%.#,h,,#GG,,#Bk,,#.%.%',
    '%.####,#######,#######,####...%.#,,,,#,,,,#,,,,#.%.%',
    '%..............o..............%.#,,,,#,,,,#,,,,#.%.%',
    '%.............................%.#,,,,#,,,,#,,,,#.%.%',
    '%.####,########,########,#####%.#,,,,#,,,,#,,,,#.%.%',
    '%.#,,,,,,,,#,,,,,,,,#,,,,,,,,#%.#,,,,#,,,,#,,,,#.%.%',
    '%.#e,d,,,,,#d,e,,,,,#e,d,,,,,#%.#,,,,#,,,,#,,,,#.%.%',
    '%.#h,,,,,,,#,,,,h,,,#,,,,h,,,#%.#,,,,#,,,,#,,,,#.%.%',
    '%.#,,,,,,q,#,v,,,,,,#,,,,,,q,#%.##,####,####,###.%.%',
    '%.############################%..................%.%',
    '%.............................%%%%%%%%%%%%%%%%%%%%.%',
    '%.........................G........................%',
    '%%%%%%%%%%%%%%%%%%%%%%%%%  %%%%%%%%%%%%%%%%%%%%%%%%%',
  ],
  // MILLBROOK: one street, four doors either side of it.
  millbrook: [
    '                                        ',
    ' ...................................... ',
    ' ..#######..########..#######..#######. ',
    ' ..#,,ed,#..#,,Bqv,#..#,,ed,#..#,,,v,#. ',
    ' ..#,h,k,#..#,,,,k,#..#,h,,,#..#,A,s,#. ',
    ' ..#,,,,,#..#,,,,,,#..#,,,,,#..#,,,,,#. ',
    ' ..###,###..####,###..###,###..###,###. ',
    ' ...................................... ',
    ' ...................................... ',
    ' ..............o.........*...........W. ',
    ' .T.................i.................. ',
    ' ...................................... ',
    ' ..###,###..####,###..###,###..###,###. ',
    ' ..#e,,d,#..#e,,,d,#..#vq,k,#..#e,,d,#. ',
    ' ..#,h,,,#..#,h,,,,#..#,,q,,#..#,h,,,#. ',
    ' ..#,,,,,#..#,,,,,,#..#,,,,,#..#,,,,,#. ',
    ' ..#######..########..#######..#######. ',
    '                                        ',
  ],
  // OXENFORD: the market square open to the sky, its rooms around the edge.
  oxenford: [
    '                                    ',
    ' .................................. ',
    ' .###############################.. ',
    ' .#vBBB,qk,,,#eedd,,,,#v,,,,,q,,#.. ',
    ' .#,,,,,,,,,,#,h,,,,,,#,,S,k,,,,#.. ',
    ' .#,,,,,,,,,,#,,,,,,q,#,,,,,,,,e#.. ',
    ' .#,,,,,,,,,,#,,,,,,,,#,,,,,,,,,#.. ',
    ' .#####,#########,#########,#####.. ',
    ' .................................. ',
    ' .................################. ',
    ' ..f.f.f.f.f.f....#e,d,,,#v,k,,,,#. ',
    ' ..f.f.f.f.f.f..U.#h,,,,,#,,,,h,,#. ',
    ' ..f.f.f.f.f.f....#,,,,q,#,,,,,,e#. ',
    ' .................#,,,,,,#,,,,,,,#. ',
    ' .................###,#######,####. ',
    ' .................................. ',
    ' ...............i...!.............. ',
    ' ........o..............*.......... ',
    ' .####,#######,#######,######,####. ',
    ' .#q,v,,,,#eed,,,,#d,e,,,,#e,,,,,#. ',
    ' .#k,,,,e,#,q,,h,,#,,,,v,,#,,h,q,#. ',
    ' .#,,,,,,,#,,,,,,,#,,,,,,,#,,,,,,#. ',
    ' .################################. ',
    ' .................................. ',
    ' .#####,###########,#########,####. ',
    ' .#,,,d,,,v,,##,d,e,,,q,##,e,,,v,#. ',
    ' .################################. ',
    '                                    ',
  ],
  // THORNBURY: the manor behind a rampart, the village at its gate.
  thornbury: [
    '                                  ',
    ' ................................ ',
    ' .%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%. ',
    ' .%..#######################...%. ',
    ' .%..#*k,,,,#,h,,,,,#,Bk,,,#...%. ',
    ' .%.G#,,,,,,#,,,,,,,#,,,,,,#.G.%. ',
    ' .%..#,,,,,e#,,,,,q,#,,,,,e#...%. ',
    ' .%..#,,,,,,#,,,,,,,#,,,,,,#...%. ',
    ' .%..#,,,,d,#,,v,,,,#d,,,,,#...%. ',
    ' .%..#,,,,,,#,,,,,,,#,,,,,,#...%. ',
    ' .%..###,#######,######,####...%. ',
    ' .%............................%. ',
    ' .%!.........................o.%. ',
    ' .%............................%. ',
    ' .%%%%%%%%%%%%%..%%%%%%%%%%%%%%%. ',
    ' ................................ ',
    ' .##############################. ',
    ' .#e,d,,,,,#d,e,,,,,#,A,s,,,,,,#. ',
    ' .#h,,,,,,,#,,,,h,,,#,,,,,,,e,,#. ',
    ' .#,,,,,,q,#,,,,,,v,#q,,,,,,,,d#. ',
    ' .#,,,,,,,,#,,,,,,,,#,,,,,,,,,,#. ',
    ' .####,########,#########,######. ',
    ' ................................ ',
    ' ......*........i..........T..... ',
    ' ................................ ',
    ' .#####,########,#########,#####. ',
    ' .#,e,d,,,,,#,d,e,,,,#,e,d,,,,,#. ',
    ' .#,,,,,,,h,#,,,,,,h,#,,,,,,,h,#. ',
    ' .##############################. ',
    '                                  ',
  ],
  // EASTMERE: the quayside street, its rooms facing the water.
  eastmere: [
    '                              ~~~~~~~ ',
    ' .............................~~~~~~~ ',
    ' .#######################.....~~~~~~~ ',
    ' .#vq,,,,e,,#q,,,,v,,#qq#..!..~~~~~~~ ',
    ' .#B,k,B,,,,#,S,k,,,,#,,#.....~~~~~~~ ',
    ' .#,,,,,,,,d#,,,,,,,e#,,#=======F~~~~ ',
    ' .#,,,,,,,,,#,,,,,,,,#,,#.....~~~~~~~ ',
    ' .#####,########,######,#.....~~~~~~~ ',
    ' ...........G.......o.........~~~~~~~ ',
    ' ..................i..........~~~~~~~ ',
    ' .#######################.....~~~~~~~ ',
    ' .#e,dd,,#,,ee,,#,,d,,v,#.....~~~~~~~ ',
    ' .#h,,,,,#,,,,h,#,,,,k,,#=======F~~~~ ',
    ' .#,,,,q,#,v,,,,#,,,,,,q#.....~~~~~~~ ',
    ' .#,,,,,,#,,,,,,#,,,,,,,#.....~~~~~~~ ',
    ' .###,######,#######,####.....~~~~~~~ ',
    ' .............................~~~~~~~ ',
    ' ..........................*..~~~~~~~ ',
    ' .####,#######,#####,####.....~~~~~~~ ',
    ' .#e,,,,,,#d,,,,,#,e,,,,#=======F~~~~ ',
    ' .#,,h,,,,#,,h,,,#,,,h,,#.....~~~~~~~ ',
    ' .#,,,,,q,#,,,,,v#,,,,q,#.....~~~~~~~ ',
    ' .#######################.....~~~~~~~ ',
    '                              ~~~~~~~ ',
  ],
  // GREENHOLLOW: a clearing. Four doors and a wood for a wall.
  greenhollow: [
    '      T           T             ',
    ' T          T           T       ',
    '  .....T.................T....  ',
    '  ............................T ',
    '  .#########.......########...  ',
    '  T#,,,,qv,#.......#,,,qv,#...  ',
    '  .#,B,k,,,#.......#,S,k,,#...  ',
    '  .#,,,,,,,#.......#,,,,,,#...  ',
    '  .####,####.......####,###...  ',
    '  ............................ T',
    'T ............................  ',
    '  ..........o......*..........  ',
    '  ............................  ',
    '  .........i..................  ',
    '  .####,###........####,####..  ',
    '  .#e,,,d,#........#e,,,,d,#..  ',
    '  .#,h,,,,#........#,A,s,h,#..T ',
    ' T.#,,,,,,#........#,,,,,,,#..  ',
    '  .########........#########..  ',
    '  ............................  ',
    '            T           T       ',
    '      T           T             ',
  ],
  // CRAGFOOT: three shelves, six doors, one stair. The retaining walls are
  // ramparts because that is what they are: the hill held back.
  cragfoot: [
    '                            ',
    '                            ',
    '  ........................  ',
    '  .#########....#########.  ',
    '  .#,,,,,d,#....#,,,,,v,#.  ',
    '  .#,S,k,h,#....#,A,s,A,#.  ',
    '  .#,,,e,,,,....,,,,,,,,#.  ',
    '  .#,,,,,,,#....#,,,,,,,#.  ',
    '  .#########....#########.  ',
    '  ........................  ',
    '  %%%%%%%%%%%..%%%%%%%%%%%  ',
    '  ........................  ',
    '  .#########....#########.  ',
    '  .#,,,,qv,#....#,,,,,d,#.  ',
    '  .#,B,k,,,#....#,h,,,,,#.  ',
    '  .#,,,,,,,,....,,,,e,,,#.  ',
    '  .#,,,,,,,#....#,,,,,,,#.  ',
    '  .#########....#########.  ',
    '  ........................  ',
    '  %%%%%%%%%%%..%%%%%%%%%%%  ',
    '  ..........o.............  ',
    '  .####,###.....####,###..  ',
    '  .#e,,,d,#.....#e,,,d,#..  ',
    '  .#,h,,,,#.....#,h,k,,#..  ',
    '  .#,,,,,,#.....#,,,,,,#..  ',
    '  .########.....########..  ',
    '  ........................  ',
    '  %%%%%%%%%%%..%%%%%%%%%%%  ',
    '  ..........*....i........  ',
    '  .....G.............!....  ',
    '                            ',
    '                            ',
  ],
  // FENMARCH: the causey through, and every door opening onto decking.
  fenmarch: [
    '                ===                 ',
    '                ===                 ',
    '  .#########....===...#########...  ',
    '  .#vB,kqB,#....===...#,qS,kv,#...  ',
    '  .#,,,,,,,#....===...#,,,,,,,#...  ',
    '  .####,####....===...####,####...  ',
    '  .==============================.  ',
    '  ............o.===.*.............  ',
    '  .####,###.....===....####,###...  ',
    '  f#e,,,d,#.....===....#e,,,d,#...f ',
    '  f#,h,,,,#.....===....#,h,,,,#...f ',
    '  .#,,,,,,#.....===....#,,,,,,#...  ',
    '  .########.....===....########...  ',
    '  .==============================.  ',
    '  ............i.===.G.............  ',
    '  .####,####....===....####,###...  ',
    '  f#,,,,,v,#....===....#e,,,d,#...f ',
    '  f#,A,s,,,#....===....#,h,k,,#...f ',
    '  .#,,,,,,,#....===....#,,,,,,#...  ',
    '  .#########....===....########...  ',
    '                ===                 ',
    '                ===                 ',
  ],
  // NORWICK: the doubled west rampart, four barracks behind it.
  norwick: [
    '%%%%%%%%%%%%%%%%..%%%%%%%%%%%%%%%%',
    '%.%..............................%',
    '%.%......................!.......%',
    '%.%.##########......##########...%',
    '%.%.#,,,,,qv,#......#,,,,,,d,#...%',
    '%.%.#,,B,k,,,#......#,A,s,h,,#...%',
    '%.%.#,,,,,,,,#......#,e,,,,,,#...%',
    '%.%.#,,,,,,,,#......#,,,,,,,,#...%',
    '%.%.#####,####......#####,####...%',
    '%.%..............................%',
    '%.%.G.........G..............G...%',
    '.................................%',
    '..............o......*...........%',
    '%.%.G.W.......G..............G...%',
    '%.%...........i..................%',
    '%.%.####,####.......#####,####...%',
    '%.%.#e,,,,d,#.......#e,,,,,d,#...%',
    '%.%.#,h,,,,,#.......#,h,,,k,,#...%',
    '%.%.#,,,,,,,#.......#,,,,,,,,#...%',
    '%.%.#########.......##########...%',
    '%.%....G....G.......G............%',
    '%.%......G.............G..G......%',
    '%.%..............................%',
    '%%%%%%%%%%%%%%%%..%%%%%%%%%%%%%%%%',
  ],
  // HOLLYBARROW: a farm. The hedge encloses; the rooms are cottages.
  hollybarrow: [
    '                                    ',
    ' """""""""""""""".."""""""""""""""" ',
    ' "................................" ',
    ' ".#########......................" ',
    ' ".#,,,,qv,#........T.TTT.T.TTT..." ',
    ' ".#,,B,k,,#......................" ',
    ' ".#,,,,,,,#........T.TTT.T.TTT..." ',
    ' ".#,,,,,,,#......................" ',
    ' ".####,####..........T.T.T.T.T..." ',
    ' ".................p.p.p.p.p.p.p.." ',
    ' "...T.............p.p.p.p.p.p.p.." ',
    ' "................................" ',
    ' "............o.....*............." ',
    ' "................................" ',
    ' "............i..................." ',
    ' ".####,###...........####,###...." ',
    ' ".#e,,,d,#...........#e,,,d,#...." ',
    ' ".#,h,,,,#...........#,h,,,,#...." ',
    ' ".#,,,,,,#...........#,,,,,,#...." ',
    ' ".########...........########...." ',
    ' "................................" ',
    ' ".p.....p.p.p......p.p.p.p.p.p..." ',
    ' """""""""""""""".."""""""""""""""" ',
    '                                    ',
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
    // A CART, not a ship. It borrowed 'shipwreck' because there was no word
    // for a cart when it was written, and the result was three shipwrecks
    // standing in the Downs, on a hill, miles from any water. There is a
    // word now.
    tag: 'drownedcart', name: 'the Drowned Cart', dx: 30, dy: 74, kind: 'cart',
    story: 'A cart in the shallows, up to its axles. Nobody came back for it.',
    art: ['.!.', '!!.'],
  },
]

// ---------------------------------------------------------------------
// THE LOADER
// ---------------------------------------------------------------------
// THE ROOMS EACH PLAN LAYS. Every interior rectangle, recorded by the
// drawing that made it. This is what tells the ground it is a floor -- not
// the character on the tile, which is a counter or a hearth or the clerk.
export const PLAN_ROOMS = {
  anchor: [[4, 4, 10, 5], [4, 12, 7, 3], [4, 29, 5, 3], [13, 29, 5, 3], [16, 12, 6, 3], [19, 4, 6, 4], [21, 29, 4, 3], [30, 4, 8, 4], [30, 12, 7, 3], [34, 25, 13, 6], [43, 4, 5, 3], [43, 11, 5, 3]],
  millbrook: [[4, 3, 5, 3], [4, 13, 5, 3], [13, 3, 6, 3], [13, 13, 6, 3], [23, 3, 5, 3], [23, 13, 5, 3], [32, 3, 5, 3], [32, 13, 5, 3]],
  oxenford: [[4, 3, 8, 4], [4, 18, 6, 3], [4, 24, 5, 2], [23, 3, 7, 4], [23, 18, 6, 3], [23, 24, 5, 2]],
  thornbury: [[4, 18, 6, 3], [4, 24, 6, 3], [7, 4, 21, 6], [22, 18, 7, 3], [22, 24, 6, 3]],
  hollybarrow: [[4, 4, 7, 4], [4, 16, 6, 3], [23, 16, 6, 3]],
  eastmere: [[4, 3, 7, 4], [4, 17, 7, 3], [14, 3, 6, 4], [15, 17, 5, 3]],
  greenhollow: [[4, 5, 7, 3], [4, 15, 6, 3], [20, 5, 6, 3], [20, 15, 7, 3]],
  cragfoot: [[4, 4, 7, 4], [4, 13, 7, 4], [4, 22, 6, 3], [17, 4, 7, 4], [17, 13, 7, 4], [17, 22, 6, 3]],
  fenmarch: [[4, 3, 7, 2], [4, 9, 6, 3], [4, 16, 7, 3], [23, 3, 7, 2], [24, 9, 6, 3], [24, 16, 6, 3]],
  norwick: [[5, 4, 8, 4], [5, 16, 7, 3], [21, 4, 8, 4], [21, 16, 8, 3]],
}

// IS THIS TILE INDOORS? Not "is the character a floor" -- a counter, a
// hearth, a keeper all stand on a floor too, and asking the character got
// them painted as street. Ask ENCLOSURE instead: flood in from outside the
// drawing through everything except a building wall '#', and whatever the
// flood never reaches is inside a building.
//
// Ramparts '%' are deliberately passable to this flood. A town wall encloses
// a town, not a room; if it blocked, the whole of Anchor would be indoors.
export function isIndoor(name, rows, rx, ry) {
  const rs = PLAN_ROOMS[name]
  if (!rs) return false
  for (const [x, y, w, h] of rs)
    if (rx >= x && ry >= y && rx < x + w && ry < y + h) return true
  return false
}

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
  const { g, E, w, taken, key, inB, isWater, reserve, onRoad } = ctx
  const nameKeeper = opts.nameKeeper
  // §0e (v6): THE LEGEND IS A PARAMETER, defaulting to this file's own.
  //
  // The plans here are frozen -- v1 through v5 hash on them -- and so is what
  // their glyphs mean. v6 needed exactly one glyph to mean something else
  // ('U', the fountain, which stopped being decoration), and rewriting LEGEND
  // in place would have moved five foundings that have nothing to do with it.
  // A caller that passes no legend gets the frozen one and is bit-for-bit
  // unmoved, which is the same courtesy `onRoad` is given.
  const LEGEND = opts.legend ?? LEGEND_BASE
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
      // A RAMPART YIELDS TO A ROAD, the way a wall yields to water.
      //
      // A drawing does not know where the water went, and it does not know
      // where the roads came in either. The gates were drawn where the
      // author guessed the traffic would be -- Anchor's at cols 25-26 --
      // and the router, which answers to the terrain and not to the art,
      // brought its trails in at 20, 21 and 27 instead. A citizen walking
      // the north-east trail met unbroken wall and had to follow it round.
      //
      // So the gate is wherever the road actually arrives. This is the
      // rampart ONLY ('%'): a house's wall ('#') holds, because a road
      // clipping the corner of somebody's kitchen is not a doorway, it is
      // a hole. Both glyphs mean 'wall' to the engine; only the drawing
      // knows which is a town's edge and which is a room's.
      // OPT-IN, and it has to be. This file is shared: worldgen-expanse4
      // lays its towns through the same function, and v4's world is frozen
      // -- a fourth-founding citizen's map may not grow a gate because the
      // fifth founding wanted one. A caller that passes `onRoad` is asking
      // for this law; v4 does not pass it and is bit-for-bit unmoved.
      if (ch === '%' && onRoad && onRoad(g, x, y)) { reserve(x, y); continue }
      if (taken.has(key(x, y))) continue
      const type = LEGEND[ch]
      // NAME THE KEEPER. Which trade they follow is decided by what they
      // stand beside, exactly as the window works it out for the sprite --
      // so the name is stable, hashed, and the same in every window.
      let extra = type === 'plot' ? { plantedAt: 0 }
        : type === 'landmark' ? { kind: KIND_FOR[ch] ?? lk }
        : undefined
      if (type === 'keeper' && nameKeeper) {
        let trade = 'town'
        for (const [ddx, ddy] of [[1,0],[-1,0],[0,1],[0,-1],[2,0],[-2,0],[0,2],[0,-2]]) {
          const rr = ry + ddy, cc = rx + ddx
          if (rr < 0 || cc < 0 || rr >= rows.length || cc >= rows[0].length) continue
          const t2 = LEGEND[rows[rr][cc]]
          if (t2 === 'bank') { trade = 'clerk'; break }
          if (t2 === 'store') { trade = 'shop'; break }
          if (t2 === 'anvil') { trade = 'smith'; break }
          if (t2 === 'hearth') trade = 'town'
        }
        extra = { name: nameKeeper(name + '|' + trade + '|' + rx + ',' + ry) }
      }
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
