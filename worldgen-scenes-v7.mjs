// THE SCENES OF TALLYHOLM -- small groups of things that mean something
// together.
//
// WHAT THIS IS FOR, and why it is not more scatter.
//
// The island has 57 landmark kinds and nearly two thousand of them standing
// about. It is not short of nouns. What it was short of is SENTENCES: the
// props arrive one at a time, spread by a hash, so a citizen walks past a
// stump, and forty tiles later a log-pile, and neither of them says anything.
// A stump ALONE is texture. A stump, a second stump, a log-pile and a cold
// charcoal-ring within four tiles is somebody's afternoon.
//
// Measured against RuneScape in 2004, which is the comparison this island has
// invited from the start: their park is a fountain, two benches, a gravel
// path, a clipped hedge, a bed of blue flowers and a pillared gazebo that does
// nothing -- six props inside ten tiles, reading as one authored place. Nobody
// put one bench there and the other forty tiles away.
//
// THE FOUR HABITS worth stealing, in the order they matter here:
//
//   1. CLUSTER. Four to eight props, within a five-tile box, arranged.
//   2. MIX SPECIES. Five kinds of tree in one frame, one of them dominant.
//      A biome with one tree in it reads as a texture, not as ground.
//   3. SHOW LABOUR. Not the result -- the WORK. Cut stumps, a half-built
//      tower still in its scaffolding, chips where somebody split wood, a
//      daub of red paint on a ruined wall. These are the most valuable
//      nouns in the list because each one implies a person who is not on
//      the map.
//   4. RUIN IN A SHAPE. A rubble field says nothing. One wall standing to
//      full height with a window still in it says what the building was.
//
// The fourth habit belongs to the place drawings and not here. The first
// three are this file.
//
// AND THE FIFTH, WHICH IS THE ONE THAT COST A REWRITE: ONE OF EACH.
//
// The first cut of this file had 37 scenes seated 160 times -- five copies of
// the felling, four of the dew pond -- and it read as GENERATED, immediately
// and unmistakably, however well each one was drawn. A citizen who walks past
// the same charcoal camp twice has learned that neither of them was put there;
// they have caught the hash working, and after that no amount of care in the
// composition buys the illusion back.
//
// PLACES_V7 already knew this and says so in its first line: one of each, none
// of them necessary. Eighteen places, eighteen drawings, no repeats. That is
// why the island's places feel found and its scatter feels dealt.
//
// So a scene is a one-off, exactly as a place is. Density comes from AUTHORING
// MORE SCENES, never from stamping one twice, and the moment there are two of
// anything here it has stopped being a scene and become a texture.
//
// Every one has a NAME for the same reason. A named thing is a made thing.
//
// WHY LANDMARKS AND NOT NODE TYPES. No verb in the constitution reaches a
// landmark: it cannot be worked, fought, lit or consumed. So a kind adds
// texture to the world without adding a rule to the world, and the vocabulary
// can be as large as the authoring wants. §7o made this argument for the
// roadsides; this is the same argument for the countryside between them.
//
// AND WHY THIS IS IN THE STATE AND NOT IN A WINDOW. A window is not
// authoritative here. A citizen may arrive in the 2D window, the photographic
// one, or a 3D one nobody has written yet, and each will draw a scorched-ring
// however it likes. What must be true in all of them is that somebody PUT it
// there, beside the burnt trees, on purpose. Authoring that lives in a
// renderer is decoration; authoring that lives in the state is the world.

// ---------------------------------------------------------------------------
// THE NEW NOUNS.
//
// Added to LANDMARK_KINDS in the engine. Each one earns its place by being a
// thing the scenes below actually need and the existing 57 cannot say.
// ---------------------------------------------------------------------------
export const SCENE_KINDS = [
  // ---- labour, caught in the middle ----
  'scaffold',      // a building still going up, and it always will be
  'chopping-block',// a block with the axe-marks in it
  'wood-chips',    // where somebody split wood, and the ground remembers
  'sawhorse',
  'trestle',       // planks over two legs: a bench, a bier, a workbench
  'wheel-rut',     // a cart came this way often enough to cut the ground
  'daub-mark',     // paint on stone. Somebody wrote it and nobody has read it
  'tally-post',    // notches cut in a post: a count of something, unlabelled
  // ---- the fen and the water's edge ----
  'reeds',
  'upturned-boat',
  'fish-trap',
  'staithe',       // a plank landing where a boat is tied
  // ---- the down and the fold ----
  'dew-pond',
  'sheep-hurdle',  // a hurdle set as a fold, not stacked as stock
  'wool-snag',     // fleece caught on a thorn: nothing, and unmistakable
  'salt-lick',
  // ---- the moor ----
  'peat-cut',      // the trench the stacks came out of
  'turf-stack',
  'bog-pool',
  // ---- the crag ----
  'ore-heap',
  'shot-hole',     // a drilled hole in the face, unfired
  'ladder',
  // ---- a garden, and the things nobody needs ----
  'bench',
  'flowerbed',
  'topiary',
  'birdbath',
  'gazebo-post',   // the pillars of a folly. It does nothing. That is the point
  // ---- §7dj: AND FOUR THAT EXIST ONLY BECAUSE THE OBVIOUS WORD HAS A JOB ----
  //
  // Each of these replaces a noun the scenes wanted and could not have,
  // because the engine already reaches it with a verb. The rule for this file
  // is that scenery is COSMETIC AND NOTHING ELSE, and "it looks right" is not
  // a reason to spend a working object on decoration.
  'stone-heap',   // field-clearance stones dumped at a headland. NOT a cairn:
                  // a cairn is a monument somebody built and a graver may cut
                  // a name into. This is a farmer's rubbish and always was.
  'way-post',     // a wooden post at a track. NOT a milestone or a boundary
                  // stone -- both of those are cut stone, and both are gravable.
  'slag-lump',    // furnace waste. NOT a glass-stone, which is gravable and is
                  // supposed to be the strange thing you find once.
  'hay-wain',     // a farm wagon standing in a field. NOT a `cart`, which is a
                  // NODE TYPE: the thing a hauler drops when they die, with a
                  // shelf on it that anybody may unload. A cosmetic object that
                  // looks exactly like a lootable one is a lie told in pictures.
  // ---- what is left after people ----
  'ash-heap',
  'broken-cart',
  'fallen-stone',  // a standing stone that is not standing any more
  'rag-tree',      // cloth tied to a thorn, for a reason nobody living has
]

// ---------------------------------------------------------------------------
// THE LEGEND.
//
// One character, one landmark kind. Deliberately its own alphabet and not the
// shire's: a scene has no walls, no floors and no doors, so nothing here means
// what it means in a town drawing.
//
//   '~'  nothing: leave the ground exactly as it was
//
// Every other glyph is a landmark, and a scene may place nothing else. That
// restriction is the safety: a scene cannot seed a resource, block a road, or
// grow a bank, because the only thing it knows how to make is scenery.
// ---------------------------------------------------------------------------
export const SCENE_LEGEND = {
  // trees and growth
  T: 'old-oak-lm', P: 'pine', W: 'willow', D: 'dead-tree', B: 'burnt-tree',
  H: 'thorn', N: 'wind-thorn', A: 'apple-tree', R: 'pear-tree', Y: 'yew',
  V: 'avenue-oak', E: 'old-oak-lm',
  // the wood, worked
  s: 'stump', l: 'log-pile', c: 'charcoal-clamp', r: 'charcoal-ring',
  k: 'chopping-block', w: 'wood-chips', z: 'sawhorse', f: 'windfall',
  // ground and stone
  // §7dj: NONE OF THESE IS GRAVABLE. GRAVABLE is a closed set of ten kinds --
  // standing-stone, milestone, boundary-stone, cairn, sentinel, broken-tower,
  // drowned-bell, shipwreck, elder-tree, glass-stone -- and the engine counts
  // 247 of them on a full island, deliberately: "when the last is cut there is
  // nothing left for a graver to do, and the world says so."
  //
  // The first cut of this file added THIRTY-FOUR more across twenty-one
  // scenes: sixteen cairns, nine boundary stones, three glass-stones. That is
  // a fourteen per cent inflation of a supply whose EXHAUSTION is the whole
  // life of the item, done silently, by scenery.
  n: 'stone-heap', o: 'way-post', m: 'way-post', g: 'fallen-stone',
  G: 'fallen-stone', p: 'spoil-heap', u: 'cut-face', q: 'ore-heap',
  '!': 'shot-hole', L: 'ladder', C: 'cave-mouth',
  // fire and its leavings
  h: 'crude-hearth', a: 'ash-heap', S: 'scorched-ring', j: 'slag-lump',
  // the farm
  y: 'haystack', d: 'hurdle', x: 'hay-wain', X: 'broken-cart', K: 'scarecrow',
  b: 'skep', t: 'trestle', v: 'wheel-rut',
  // the fen
  e: 'eel-rack', i: 'reeds', U: 'upturned-boat', F: 'fish-trap',
  Q: 'staithe', J: 'withy-stack', Z: 'sunken-wall',
  // the down and the moor
  '#': 'sheep-skull', ',': 'dew-mark', O: 'dew-pond', ';': 'sheep-hurdle',
  '"': 'wool-snag', '+': 'salt-lick', '%': 'peat-stack', '-': 'peat-cut',
  '=': 'turf-stack', ':': 'bog-pool',
  // the dead, and the marks people leave
  '&': 'bone-pile', '*': 'skull-pile', '^': 'grave', '$': 'gibbet',
  '@': 'web', '?': 'daub-mark', '|': 'tally-post', '/': 'rag-tree',
  '\\': 'barricade', M: 'scaffold',
  // the garden
  '<': 'bench', '>': 'flowerbed', '(': 'topiary', ')': 'birdbath',
  '[': 'gazebo-post',
}

// ---------------------------------------------------------------------------
// THE SCENES.
//
// `country` is the biome this scene belongs in, and the seater will not put it
// anywhere else. `near` is optional: 'road' seats it where a citizen walking
// will actually pass it, 'water' at a shore, 'off' deliberately away from
// both, because a country needs places you only find by leaving the road.
//
// Sizes are small on purpose -- five by four is the largest here. A scene is
// something you take in from where you are standing.
// ---------------------------------------------------------------------------
export const SCENES = [
  // ======================= THE GREENWOOD: 12, each one of a kind =======================
  { tag: 'the-felling', name: 'The Felling', country: 'greenwood', near: 'off',
    rows: ['~s~w~', 'w~k~s', '~l~~~'] },
  { tag: 'blackmans-clamp', name: 'Blackman’s Clamp', country: 'greenwood', near: 'off',
    rows: ['~c~~', 'r~~l', '~~h~', 's~~~'] },
  { tag: 'the-sawpit-trestle', name: 'The Sawpit Trestle', country: 'greenwood', near: 'road',
    rows: ['z~z~', '~t~l', 'w~~~'] },
  { tag: 'the-windthrow', name: 'The Windthrow', country: 'greenwood', near: 'off',
    rows: ['f~~D', '~~f~', 'D~~s', '~f~~'] },
  { tag: 'the-rag-thorn', name: 'The Rag Thorn', country: 'greenwood', near: 'off',
    rows: ['~/~', 'H~n', '~~~'] },
  { tag: 'hollychase-stand', name: 'The Hollychase Stand', country: 'greenwood', near: 'off',
    rows: ['T~P~E', '~T~T~', 'D~T~P'] },
  { tag: 'the-splitting-yard', name: 'The Splitting Yard', country: 'greenwood', near: 'off',
    rows: ['k~w~', 'w~~z', '~l~~'] },
  { tag: 'the-old-coppice', name: 'The Old Coppice', country: 'greenwood', near: 'off',
    rows: ['s~s~', '~T~s', 'l~~~'] },
  { tag: 'the-charcoal-road', name: 'The Charcoal Road', country: 'greenwood', near: 'road',
    rows: ['r~~v', '~l~~', '~r~v'] },
  { tag: 'the-lost-boundary', name: 'The Lost Boundary', country: 'greenwood', near: 'off',
    rows: ['o~G~', '~E~~', '~~T~'] },
  { tag: 'the-bee-clearing', name: 'The Bee Clearing', country: 'greenwood', near: 'off',
    rows: ['b~b~', '~A~d', '~~~~'] },
  { tag: 'the-deer-leap', name: 'The Deer Leap', country: 'greenwood', near: 'off',
    rows: ['H~N~', '~~~H', 'n~~~'] },
  // ======================= THE HEARTLANDS: 12, each one of a kind =======================
  { tag: 'harvest-corner', name: 'Harvest Corner', country: 'heartlands', near: 'road',
    rows: ['y~y~', '~x~K', 'v~v~'] },
  { tag: 'the-apiary', name: 'The Apiary', country: 'heartlands', near: 'off',
    rows: ['d~d~d', '~b~b~', '~~R~~'] },
  { tag: 'the-orchard-corner', name: 'The Orchard Corner', country: 'heartlands', near: 'off',
    rows: ['A~R~', '~f~A', 'R~~~'] },
  { tag: 'the-wayside', name: 'The Wayside', country: 'heartlands', near: 'road',
    rows: ['~V~', 'm~n', '~v~'] },
  { tag: 'lanes-end', name: 'Lane’s End', country: 'heartlands', near: 'road',
    rows: ['~X~', 'v~d', '~~~'] },
  { tag: 'the-half-built', name: 'The Half-Built', country: 'heartlands', near: 'road',
    rows: ['~M~M~', 'M~~~M', '~t~w~', '~z~~~'] },
  { tag: 'the-garden', name: 'The Garden', country: 'heartlands', near: 'road',
    rows: ['(~>~(', '~)~[~', '<~~~<', '~(~(~'] },
  { tag: 'the-tithe-trestle', name: 'The Tithe Trestle', country: 'heartlands', near: 'road',
    rows: ['t~t~', '~y~x', '~~v~'] },
  { tag: 'the-crows-field', name: 'The Crow’s Field', country: 'heartlands', near: 'off',
    rows: ['K~~y', '~v~~', 'y~~K'] },
  { tag: 'the-cart-willows', name: 'The Cart Willows', country: 'heartlands', near: 'road',
    rows: ['W~x~', '~v~W', '~~~~'] },
  { tag: 'the-milestone-oaks', name: 'The Milestone Oaks', country: 'heartlands', near: 'road',
    rows: ['V~~V', '~m~~', '~~n~'] },
  { tag: 'the-haywards-post', name: 'The Hayward’s Post', country: 'heartlands', near: 'road',
    rows: ['~|~', 'd~y', '~~~'] },
  // ======================= THE DOWNS: 12, each one of a kind =======================
  { tag: 'the-dew-pond', name: 'The Dew Pond', country: 'downs', near: 'off',
    rows: ['~;;~', ';OO+', '~;;~', '~#~~'] },
  { tag: 'the-shepherds-mark', name: 'The Shepherd’s Mark', country: 'downs', near: 'off',
    rows: ['~n~', 'o~"', '~#~'] },
  { tag: 'the-chalk-digging', name: 'The Chalk Digging', country: 'downs', near: 'off',
    rows: ['u~p~', '~p~n', '~~v~'] },
  { tag: 'the-drove-halt', name: 'The Drove Halt', country: 'downs', near: 'road',
    rows: [';~;~;', '~+~h~', '~~"~~'] },
  { tag: 'the-lambing-pens', name: 'The Lambing Pens', country: 'downs', near: 'off',
    rows: [';;~;', ';~;;', '~#~~'] },
  { tag: 'the-wool-thorn', name: 'The Wool Thorn', country: 'downs', near: 'off',
    rows: ['~H~', '"~"', '~n~'] },
  { tag: 'the-lost-flock', name: 'The Lost Flock', country: 'downs', near: 'off',
    rows: ['#~#~', '~~#~', '"~~#'] },
  { tag: 'the-white-cut', name: 'The White Cut', country: 'downs', near: 'off',
    rows: ['u~u~', '~p~~', '~~v~'] },
  { tag: 'the-salt-track', name: 'The Salt Track', country: 'downs', near: 'road',
    rows: ['+~~', '~v~', '~~o'] },
  { tag: 'the-hurdle-store', name: 'The Hurdle Store', country: 'downs', near: 'off',
    rows: ['d~d~', '~z~d', '~~~~'] },
  { tag: 'the-watchers-cairn', name: 'The Watcher’s Cairn', country: 'downs', near: 'off',
    rows: ['n~n', '~o~', '~~~'] },
  { tag: 'the-dry-valley', name: 'The Dry Valley', country: 'downs', near: 'off',
    rows: [',~,~', '~#~,', 'H~~~'] },
  // ======================= THE MOOR: 12, each one of a kind =======================
  { tag: 'the-peat-cutting', name: 'The Peat Cutting', country: 'moor', near: 'off',
    rows: ['-%-%', '~=~=', '-~-~'] },
  { tag: 'the-gibbet-road', name: 'The Gibbet Road', country: 'moor', near: 'road',
    rows: ['~$~', 'N~o', '~n~'] },
  { tag: 'the-shieling', name: 'The Shieling', country: 'moor', near: 'off',
    rows: ['~h~d', 'd~~~', '~#~~'] },
  { tag: 'the-bog-pools', name: 'The Bog Pools', country: 'moor', near: 'off',
    rows: ['~:~N', ':~:~', 'N~~:'] },
  { tag: 'the-fallen-circle', name: 'The Fallen Circle', country: 'moor', near: 'off',
    rows: ['g~G~', '~~~G', 'G~g~'] },
  { tag: 'the-turf-stacks', name: 'The Turf Stacks', country: 'moor', near: 'off',
    rows: ['=~=~', '~-~=', '~~-~'] },
  { tag: 'the-peat-road', name: 'The Peat Road', country: 'moor', near: 'road',
    rows: ['%~v~', '~-~o', '~~~~'] },
  { tag: 'the-moor-cross', name: 'The Moor Cross', country: 'moor', near: 'road',
    rows: ['~o~', 'n~N', '~~~'] },
  { tag: 'the-drowned-thorn', name: 'The Drowned Thorn', country: 'moor', near: 'off',
    rows: ['~N~', ':~/', ':~~'] },
  { tag: 'the-black-cut', name: 'The Black Cut', country: 'moor', near: 'off',
    rows: ['-~-~', '~a~-', '~~~~'] },
  { tag: 'the-nine-that-fell', name: 'The Nine That Fell', country: 'moor', near: 'off',
    rows: ['G~G~G', '~~~~~', 'G~G~~'] },
  { tag: 'the-lost-ewe', name: 'The Lost Ewe', country: 'moor', near: 'off',
    rows: ['#~N', '~:~', '~~#'] },
  // ======================= THE FENS: 12, each one of a kind =======================
  { tag: 'the-eel-stand', name: 'The Eel Stand', country: 'fens', near: 'water',
    rows: ['~e~e', 'Q~~~', 'i~F~'] },
  { tag: 'the-withy-cutting', name: 'The Withy Cutting', country: 'fens', near: 'water',
    rows: ['J~J~', '~i~J', 'i~~i'] },
  { tag: 'the-drowned-wall', name: 'The Drowned Wall', country: 'fens', near: 'water',
    rows: ['Z~Z~', '~i~D', 'Z~~i'] },
  { tag: 'the-boat-out', name: 'The Boat Out', country: 'fens', near: 'water',
    rows: ['~U~', 'Q~F', 'i~i'] },
  { tag: 'the-fen-hearth', name: 'The Fen Hearth', country: 'fens', near: 'off',
    rows: ['~h~', 'a~J', '~i~'] },
  { tag: 'the-staithe', name: 'The Staithe', country: 'fens', near: 'water',
    rows: ['Q~Q~', '~U~F', 'i~~~'] },
  { tag: 'the-reed-beds', name: 'The Reed Beds', country: 'fens', near: 'water',
    rows: ['i~i~', '~i~i', 'J~~i'] },
  { tag: 'the-trap-line', name: 'The Trap Line', country: 'fens', near: 'water',
    rows: ['F~F~', '~i~F', '~~i~'] },
  { tag: 'the-sunken-fold', name: 'The Sunken Fold', country: 'fens', near: 'water',
    rows: ['Z~Z', '~i~', 'Z~i'] },
  { tag: 'the-fen-thorn', name: 'The Fen Thorn', country: 'fens', near: 'off',
    rows: ['~H~', '/~:', 'i~~'] },
  { tag: 'the-cut-and-stack', name: 'The Cut and Stack', country: 'fens', near: 'off',
    rows: ['J~J~', '~t~J', 'i~~~'] },
  { tag: 'the-old-landing', name: 'The Old Landing', country: 'fens', near: 'water',
    rows: ['Q~U~', '~Z~i', '~~~~'] },
  // ======================= THE CRAGS: 12, each one of a kind =======================
  { tag: 'the-old-working', name: 'The Old Working', country: 'crags', near: 'off',
    rows: ['u!u~', '~p~q', 'L~p~'] },
  { tag: 'the-adit', name: 'The Adit', country: 'crags', near: 'off',
    rows: ['~C~', 'p~L', '~v~'] },
  { tag: 'the-scree-cairns', name: 'The Scree Cairns', country: 'crags', near: 'road',
    rows: ['n~~', '~~n', 'o~~'] },
  { tag: 'the-crag-camp', name: 'The Crag Camp', country: 'crags', near: 'off',
    rows: ['~h~', 'a~t', '~|~'] },
  { tag: 'the-shot-face', name: 'The Shot Face', country: 'crags', near: 'off',
    rows: ['!~!~', 'u~~p', '~~~~'] },
  { tag: 'the-ore-heaps', name: 'The Ore Heaps', country: 'crags', near: 'off',
    rows: ['q~q~', '~p~~', '~~q~'] },
  { tag: 'the-ladder-pitch', name: 'The Ladder Pitch', country: 'crags', near: 'off',
    rows: ['L~L', '~u~', 'p~~'] },
  { tag: 'the-quarry-road', name: 'The Quarry Road', country: 'crags', near: 'road',
    rows: ['x~v~', '~p~q', '~~~~'] },
  { tag: 'the-glass-stone', name: 'The Glass Stone', country: 'crags', near: 'off',
    rows: ['~j~', 'n~u', '~~~'] },
  { tag: 'the-cave-mouth', name: 'The Cave Mouth', country: 'crags', near: 'off',
    rows: ['~C~', 'p~n', '~~~'] },
  { tag: 'the-broken-winch', name: 'The Broken Winch', country: 'crags', near: 'off',
    rows: ['X~L~', '~p~~', '~~~~'] },
  { tag: 'the-counting-post', name: 'The Counting Post', country: 'crags', near: 'road',
    rows: ['~|~', 'n~o', '~~~'] },
  // ======================= THE WILDS: 12, each one of a kind =======================
  { tag: 'somebody-camped', name: 'Somebody Camped Here', country: 'wilds', near: 'off',
    rows: ['\\~\\~', '~h~&', '~a~~', '*~~~'] },
  { tag: 'the-burnt-stand', name: 'The Burnt Stand', country: 'wilds', near: 'off',
    rows: ['B~B~', '~S~B', 'B~~j'] },
  { tag: 'the-web', name: 'The Web', country: 'wilds', near: 'off',
    rows: ['@~@', 'D~&', '~@~'] },
  { tag: 'the-grave-row', name: 'The Grave Row', country: 'wilds', near: 'off',
    rows: ['^~^~^', '~~~~~', '^~^~~'] },
  { tag: 'the-daubs', name: 'The Daubs', country: 'wilds', near: 'off',
    rows: ['?~G', '~?~', 'G~?'] },
  { tag: 'the-bone-field', name: 'The Bone Field', country: 'wilds', near: 'off',
    rows: ['&~*~', '~&~&', '*~~&'] },
  { tag: 'the-barricade', name: 'The Barricade', country: 'wilds', near: 'off',
    rows: ['\\~\\', '~\\~', '&~~'] },
  { tag: 'the-ash-pit', name: 'The Ash Pit', country: 'wilds', near: 'off',
    rows: ['a~a~', '~S~*', '~~~~'] },
  { tag: 'the-last-fire', name: 'The Last Fire', country: 'wilds', near: 'off',
    rows: ['~h~', 'a~&', '~\\~'] },
  { tag: 'the-hanging-tree', name: 'The Hanging Tree', country: 'wilds', near: 'off',
    rows: ['~$~', 'D~*', '~&~'] },
  { tag: 'the-broken-stones', name: 'The Broken Stones', country: 'wilds', near: 'off',
    rows: ['G~G~', '~?~G', '~~~~'] },
  { tag: 'the-scorch', name: 'The Scorch', country: 'wilds', near: 'off',
    rows: ['~S~', 'B~j', '~B~'] },
]

// ---------------------------------------------------------------------------
// WHERE EACH ONE STANDS -- eighty-four scenes, eighty-four seats.
//
// Frozen coordinates, in the spirit of HOLDING_SEATS and for the reason
// PLACES_V7 gives: proposed once by a placer run against the real island,
// checked, and then written down. NOT scattered at run time. A hash that
// places scenery places it differently the day somebody changes an unrelated
// constant, and every one of these was looked at on a map before it was kept.
//
// SCENERY DOES NOT WIN. Three kinds of ground have a better claim than a
// vignette does, and the answer to each is to seat the scene elsewhere -- not
// to let it survive a pass that would rightly clear it:
//
//   1. THE SEAMS, with a one-tile ring. Ninety-six of them are the entire
//      economy of this island. §7u already says a seam outranks a tree, and a
//      scene is not more than a tree.
//   2. THE QUIET QUARTERS. Ten tracts, thirty to fifty-eight tiles across,
//      kept deliberately empty far from any road -- "somewhere with nothing
//      worth stopping for". That is authored emptiness, and it outranks
//      authored clutter. It is also where the first cut of this file lost 270
//      props without a word: 'off' scenes sit at least six tiles from a road,
//      which is exactly where a quiet quarter lives.
//   3. THE PLOUGH. A furlong laid across a scene takes half of it and leaves
//      the rest, which is worse than either -- not a charcoal camp, not a
//      field, three objects in a row.
//
// AND TWENTY-EIGHT TILES BETWEEN ANY TWO. Two vignettes in one field read as a
// single cluttered one, and the point of a one-off is that you come upon it
// alone.
// ---------------------------------------------------------------------------
export const SCENE_SEATS = [
  // ---- THE GREENWOOD: 12 ----
  { tag: 'the-splitting-yard', x: 322, y: 22 },   // The Splitting Yard
  { tag: 'the-felling', x: 362, y: 34 },   // The Felling
  { tag: 'the-charcoal-road', x: 434, y: 50 },   // The Charcoal Road
  { tag: 'the-sawpit-trestle', x: 462, y: 58 },   // The Sawpit Trestle
  { tag: 'the-windthrow', x: 410, y: 62 },   // The Windthrow
  { tag: 'hollychase-stand', x: 426, y: 86 },   // The Hollychase Stand
  { tag: 'the-old-coppice', x: 586, y: 98 },   // The Old Coppice
  { tag: 'the-bee-clearing', x: 374, y: 102 },   // The Bee Clearing
  { tag: 'the-deer-leap', x: 502, y: 110 },   // The Deer Leap
  { tag: 'the-rag-thorn', x: 414, y: 114 },   // The Rag Thorn
  { tag: 'the-lost-boundary', x: 602, y: 122 },   // The Lost Boundary
  { tag: 'blackmans-clamp', x: 598, y: 158 },   // Blackman’s Clamp
  // ---- THE HEARTLANDS: 12 ----
  { tag: 'the-crows-field', x: 242, y: 182 },   // The Crow’s Field
  { tag: 'lanes-end', x: 566, y: 198 },   // Lane’s End
  { tag: 'the-wayside', x: 410, y: 202 },   // The Wayside
  { tag: 'the-milestone-oaks', x: 430, y: 218 },   // The Milestone Oaks
  { tag: 'the-tithe-trestle', x: 374, y: 234 },   // The Tithe Trestle
  { tag: 'the-garden', x: 294, y: 246 },   // The Garden
  { tag: 'harvest-corner', x: 334, y: 258 },   // Harvest Corner
  { tag: 'the-cart-willows', x: 390, y: 258 },   // The Cart Willows
  { tag: 'the-orchard-corner', x: 514, y: 266 },   // The Orchard Corner
  { tag: 'the-apiary', x: 242, y: 270 },   // The Apiary
  { tag: 'the-half-built', x: 550, y: 290 },   // The Half-Built
  { tag: 'the-haywards-post', x: 446, y: 346 },   // The Hayward’s Post
  // ---- THE DOWNS: 12 ----
  { tag: 'the-dew-pond', x: 650, y: 290 },   // The Dew Pond
  { tag: 'the-salt-track', x: 626, y: 302 },   // The Salt Track
  { tag: 'the-hurdle-store', x: 754, y: 310 },   // The Hurdle Store
  { tag: 'the-dry-valley', x: 530, y: 342 },   // The Dry Valley
  { tag: 'the-shepherds-mark', x: 510, y: 354 },   // The Shepherd’s Mark
  { tag: 'the-chalk-digging', x: 542, y: 358 },   // The Chalk Digging
  { tag: 'the-drove-halt', x: 458, y: 362 },   // The Drove Halt
  { tag: 'the-lambing-pens', x: 490, y: 366 },   // The Lambing Pens
  { tag: 'the-white-cut', x: 586, y: 378 },   // The White Cut
  { tag: 'the-wool-thorn', x: 542, y: 402 },   // The Wool Thorn
  { tag: 'the-lost-flock', x: 574, y: 406 },   // The Lost Flock
  { tag: 'the-watchers-cairn', x: 634, y: 406 },   // The Watcher’s Cairn
  // ---- THE MOOR: 12 ----
  { tag: 'the-black-cut', x: 266, y: 82 },   // The Black Cut
  { tag: 'the-lost-ewe', x: 334, y: 82 },   // The Lost Ewe
  { tag: 'the-drowned-thorn', x: 310, y: 86 },   // The Drowned Thorn
  { tag: 'the-bog-pools', x: 278, y: 106 },   // The Bog Pools
  { tag: 'the-peat-road', x: 318, y: 110 },   // The Peat Road
  { tag: 'the-turf-stacks', x: 398, y: 126 },   // The Turf Stacks
  { tag: 'the-peat-cutting', x: 298, y: 130 },   // The Peat Cutting
  { tag: 'the-nine-that-fell', x: 270, y: 138 },   // The Nine That Fell
  { tag: 'the-shieling', x: 362, y: 138 },   // The Shieling
  { tag: 'the-moor-cross', x: 338, y: 150 },   // The Moor Cross
  { tag: 'the-gibbet-road', x: 314, y: 154 },   // The Gibbet Road
  { tag: 'the-fallen-circle', x: 282, y: 158 },   // The Fallen Circle
  // ---- THE FENS: 12 ----
  { tag: 'the-cut-and-stack', x: 310, y: 338 },   // The Cut and Stack
  { tag: 'the-fen-thorn', x: 346, y: 350 },   // The Fen Thorn
  { tag: 'the-reed-beds', x: 278, y: 366 },   // The Reed Beds
  { tag: 'the-trap-line', x: 250, y: 382 },   // The Trap Line
  { tag: 'the-sunken-fold', x: 334, y: 382 },   // The Sunken Fold
  { tag: 'the-boat-out', x: 434, y: 382 },   // The Boat Out
  { tag: 'the-withy-cutting', x: 206, y: 390 },   // The Withy Cutting
  { tag: 'the-drowned-wall', x: 230, y: 402 },   // The Drowned Wall
  { tag: 'the-fen-hearth', x: 390, y: 414 },   // The Fen Hearth
  { tag: 'the-old-landing', x: 426, y: 414 },   // The Old Landing
  { tag: 'the-staithe', x: 514, y: 414 },   // The Staithe
  { tag: 'the-eel-stand', x: 290, y: 422 },   // The Eel Stand
  // ---- THE CRAGS: 12 ----
  { tag: 'the-scree-cairns', x: 626, y: 170 },   // The Scree Cairns
  { tag: 'the-counting-post', x: 682, y: 170 },   // The Counting Post
  { tag: 'the-quarry-road', x: 718, y: 174 },   // The Quarry Road
  { tag: 'the-ladder-pitch', x: 754, y: 186 },   // The Ladder Pitch
  { tag: 'the-crag-camp', x: 678, y: 206 },   // The Crag Camp
  { tag: 'the-old-working', x: 650, y: 210 },   // The Old Working
  { tag: 'the-broken-winch', x: 690, y: 230 },   // The Broken Winch
  { tag: 'the-shot-face', x: 730, y: 242 },   // The Shot Face
  { tag: 'the-adit', x: 702, y: 246 },   // The Adit
  { tag: 'the-ore-heaps', x: 714, y: 262 },   // The Ore Heaps
  { tag: 'the-cave-mouth', x: 774, y: 262 },   // The Cave Mouth
  { tag: 'the-glass-stone', x: 762, y: 290 },   // The Glass Stone
  // ---- THE WILDS: 12 ----
  { tag: 'the-scorch', x: 170, y: 182 },   // The Scorch
  { tag: 'the-ash-pit', x: 82, y: 194 },   // The Ash Pit
  { tag: 'the-daubs', x: 150, y: 202 },   // The Daubs
  { tag: 'the-bone-field', x: 182, y: 206 },   // The Bone Field
  { tag: 'the-last-fire', x: 66, y: 214 },   // The Last Fire
  { tag: 'the-burnt-stand', x: 170, y: 226 },   // The Burnt Stand
  { tag: 'the-hanging-tree', x: 50, y: 270 },   // The Hanging Tree
  { tag: 'somebody-camped', x: 178, y: 286 },   // Somebody Camped Here
  { tag: 'the-web', x: 98, y: 306 },   // The Web
  { tag: 'the-grave-row', x: 130, y: 310 },   // The Grave Row
  { tag: 'the-barricade', x: 110, y: 322 },   // The Barricade
  { tag: 'the-broken-stones', x: 150, y: 326 },   // The Broken Stones
]
