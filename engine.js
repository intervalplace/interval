// Interval reference engine v0.2
// Pure deterministic state machine: nextState(state, inputs, beacon)
// No I/O, no Date, no Math.random, no floats in game logic.
// v0.2: ed25519-signed inputs verified in the state machine,
//       hardcoded XP table (spec constants), genesis object with rules hash.
// v0.4: names as in-world objects (claim_name, spec §5a).
// v0.6: spawning (§5b) and adjacent atomic trade (§5c).

'use strict';
// Universal crypto: @noble libraries are pure, audited, deterministic JS,
// the same engine bytes run in Node, browsers, and anywhere else.
//
// Node interop (final pre-freeze brief §7): @noble/hashes@2 is a pure-ESM
// package. engine.js is CommonJS, and require()-ing an ESM module at CJS
// load time RACES when engine.js is dynamically import()-ed concurrently
// (Node 22.x throws "module is not yet fully loaded"). To be
// order-independent AND portable, resolve SHA lazily:
//   - in Node, use the built-in `crypto` (no ESM require, no race);
//   - elsewhere (browsers/bundlers), fall back to @noble/hashes.
// ed25519 is fed sha512 from the same resolved source. Accessor names are
// unambiguous (nobleSha256/nobleSha512) and never shadow an import.
const ed = require('@noble/ed25519');

let _hashImpl = null;
function hashImpl() {
  if (_hashImpl) return _hashImpl;
  // prefer Node's native crypto: synchronous, always loaded, race-free
  try {
    const nc = require('crypto');
    if (nc && typeof nc.createHash === 'function') {
      _hashImpl = {
        sha256: (buf) => new Uint8Array(nc.createHash('sha256').update(Buffer.from(buf)).digest()),
        sha512: (buf) => new Uint8Array(nc.createHash('sha512').update(Buffer.from(buf)).digest()),
      };
      return _hashImpl;
    }
  } catch { /* not Node, fall through to noble */ }
  // browser/bundler path: pure-JS noble hashes
  const noble = require('@noble/hashes/sha2.js');
  _hashImpl = { sha256: noble.sha256, sha512: noble.sha512 };
  return _hashImpl;
}
function nobleSha256(buf) { return hashImpl().sha256(buf); }
function nobleSha512(buf) { return hashImpl().sha512(buf); }
let _sha512wired = false;
function ensureEdHash() {
  if (!_sha512wired) { ed.hashes.sha512 = nobleSha512; _sha512wired = true; }
}
// public: any code using @noble/ed25519 directly (e.g. a simulator minting
// keys) must call this once so ed25519 has its sha512, the engine wires it
// lazily now, rather than at import time, to stay race-free across Node
// versions (§7).
function initCrypto() { ensureEdHash(); _selectEdBackend(); }
const hex = (u8) => Buffer.from(u8).toString('hex');

const SPEC_VERSION = '0.87';
const TICK_MS = 600;
const INV_SLOTS = 28;
// v0.70: a name is claimed once and held forever (§5a), with no release and no
// transfer, so an unclaimed name is a commons that can be taken permanently.
// Free identities made that a land grab: mint keys, claim every short word, and
// nobody can ever have them back. Standing is the toll, because standing is
// time and time is the one thing an attacker cannot parallelize away.
const NAME_STANDING = 50;
// The most inputs one tick may apply. A protocol limit, not a node's memory
// setting: it decides which deeds happen, so it decides state, so it belongs
// to the constitution.
const MAX_APPLIED_INPUTS = 4096;

// ---------- THE WORLD FORGETS WHAT NOBODY EVER WAS (spec 5f) ----------
//
// Spawn costs one signed input: no gold, no standing, no time. And until now
// nothing ever removed a player. So a laptop could mint four thousand
// citizens a tick and fill the world's entire population budget in under
// five seconds -- permanently, because the constitution is frozen and there
// is no prune. Every one of those keys would be cloned sixty times a minute
// for as long as the world lasted, and nobody could ever undo it.
//
// The fix is not to make spawning expensive: you cannot charge a newcomer
// who does not exist yet, and PoW was measured and prices the attacker more
// cheaply than the visitor (see BRIEF-standing-tiers).
//
// So the world forgets, but it forgets carefully. Two conditions, and BOTH
// must hold:
//
//   1. absent a long time -- FORGET_AFTER ticks with no input at all
//   2. EMPTY-HANDED -- nothing was ever accumulated: no name, no gold, no
//      bank, no equipment, every skill still at its floor, and nothing in
//      the pack but the quiver every soul wakes with
//
// A citizen who earned one level, banked one coin, or took one name is kept
// forever, however long they stay away. The founder can leave for a decade
// and come home. What is forgotten is precisely a key that was created and
// never used -- which is the only thing an attacker mints in bulk, because
// giving each bot something to hold costs what giving a real citizen
// something costs. That is the brief's own insight -- standing is time --
// applied to permanence rather than to priority.
//
// A world that never forgets its citizens is a good promise. A world that
// must remember every key ever generated is a different promise, and nobody
// made it deliberately.
// SIX HOURS, not seventy-two.
//
// The emptiness test does the work here: anything at all -- one level, one
// coin, one name, one item -- and the world keeps you forever. So the timer
// only ever governs keys that did literally nothing, and nobody needs three
// days to decide they are not going to play. Six hours is long enough that
// "I spawned, then dinner happened" survives, and short enough that a flood
// is gone the same day rather than the same week.
//
// And forgetting an empty key costs its owner nothing: they had nothing.
// They spawn again and are exactly where they were.
const FORGET_AFTER = 36000;           // 6 hours of ticks at 600ms

// ---------- THE ARCHIVE (spec 5g) ----------
//
// Every citizen who ever earned a single xp was kept in `state.players`
// forever, and the tick clones that map sixty times a minute. At thirty
// thousand lifetime citizens the tick is 709ms of a 600ms budget: the world
// stops, not because anyone is playing but because everyone once did. That
// is not a capacity, it is a countdown.
//
// So the ABSENT leave the tick without leaving the world. A citizen who has
// not acted in ARCHIVE_AFTER ticks is moved out of `players` and into
// `archived`, which holds not their record but a DIGEST of it:
//
//     archived[playerId] = sha256(canonical(record))
//
// The record itself is kept by every node on disk -- they all archived the
// same citizen on the same tick from the same state, so they all have it,
// and none of them has to be trusted for it. When that citizen returns, the
// node supplies the record with a `restore` input and the engine rehashes
// it against the digest. A forged record does not match and is refused.
// Nothing is lost, nothing is trusted, and the citizen does nothing: their
// own node hands it back for them.
//
// Measured: thirty thousand citizens as full records is 709ms a tick; as
// digests it is 60ms. Nearly twelve times cheaper, which moves the ceiling
// from about thirty thousand lifetime citizens to about three hundred and
// fifty thousand.
//
// This is the difference between a world with room for a town and a world
// with room for a city, and it costs the absent nothing at all.
const ARCHIVE_AFTER = 1008000;        // 7 days of ticks at 600ms

// ---------- THE ARCHIVE IS A ROOT, NOT A LIST (spec 5g) ----------
//
// A map of playerId -> digest is twelve times lighter than the records it
// replaced, and still LINEAR: three hundred thousand archived souls is
// 39 MB of state and 315 ms of every tick. Which made filling it an attack
// -- not because anyone would ever reach that many honestly, but because a
// patient flood could, and afterwards the world is permanently slower and
// the constitution is frozen.
//
// So the archive becomes ONE HASH. A sparse merkle tree over the whole
// keyspace, of which almost every leaf is empty; the state carries its root
// and nothing else. Ten million archived citizens cost the tick exactly what
// none do. Filling it stops being an attack, because there is nothing to
// fill.
//
// The tree is never held by the engine -- it cannot be, it is a pure
// function of a state that contains only the root. Whoever wants a citizen
// archived or restored brings the PATH, and the root judges it. A wrong
// path proves nothing and does nothing.
const SMT_DEPTH = 64;                 // 2^64 slots: collision-safe past any world
const _EMPTY = (() => {               // the hash of an empty subtree at each depth
  const e = [sha256(Buffer.from('interval:smt:empty')).toString('hex')];
  for (let d = 1; d <= SMT_DEPTH; d++)
    e.push(sha256(Buffer.from('interval:smt:node' + e[d - 1] + e[d - 1])).toString('hex'));
  return e;
})();
const EMPTY_ROOT = _EMPTY[SMT_DEPTH];
const _smtNode = (l, r) => sha256(Buffer.from('interval:smt:node' + l + r)).toString('hex');
const _smtLeaf = (pid, digest) => sha256(Buffer.from('interval:smt:leaf' + pid + digest)).toString('hex');
// the slot a citizen occupies: the first 64 bits of their id, which is a
// public key and therefore already uniform
const _smtBit = (pid, d) => (parseInt(pid[Math.floor(d / 4)], 16) >> (3 - (d % 4))) & 1;

// Walk from the leaf to the root, folding in one sibling per level. A path
// is given compressed: a bitmap of which levels have a non-empty sibling,
// then only those siblings. Almost every level of a sparse tree is empty,
// so a real proof is a few hundred bytes rather than four kilobytes.
function _smtFold(pid, leafHash, path) {
  if (!path || typeof path.bits !== 'string' || !Array.isArray(path.sibs)) return null;
  if (path.bits.length !== SMT_DEPTH) return null;
  let h = leafHash, used = 0;
  for (let d = SMT_DEPTH - 1; d >= 0; d--) {
    let sib;
    if (path.bits[d] === '1') {
      if (used >= path.sibs.length) return null;
      sib = path.sibs[used++];
      if (typeof sib !== 'string' || !HEX64.test(sib)) return null;
    } else {
      sib = _EMPTY[SMT_DEPTH - 1 - d];
    }
    h = _smtBit(pid, d) ? _smtNode(sib, h) : _smtNode(h, sib);
  }
  if (used !== path.sibs.length) return null;   // no unused siblings: one form only
  return h;
}
// does this path prove that `pid` holds exactly `digest` (or is empty) under `root`?
function _smtProves(root, pid, digest, path) {
  const leaf = digest === null ? _EMPTY[0] : _smtLeaf(pid, digest);
  const got = _smtFold(pid, leaf, path);
  return got !== null && got === root;
}
// the root that results from putting `digest` (or emptiness) at `pid`
function _smtWith(pid, digest, path) {
  return _smtFold(pid, digest === null ? _EMPTY[0] : _smtLeaf(pid, digest), path);
}

// does this citizen carry the one bow, in pack or in hand?
function _carriesBow(p) {
  if (p?.equipment?.weapon?.item === 'dragonbow') return true;
  return (p?.inventory ?? []).some(sl => sl && sl.item === 'dragonbow');
}
function everWasSomebody(p) {
  if (p.name !== null && p.name !== undefined) return true;
  if ((p.gold ?? 0) > 0) return true;
  if (p.bank && Object.keys(p.bank).length > 0) return true;
  if (p.equipment && EQUIP_SLOTS.some((k) => p.equipment[k])) return true;   // 6bz: not three hard-coded names
  if (p.action !== null && p.action !== undefined) return true;
  if (p.trade !== null && p.trade !== undefined) return true;
  for (const sk of SKILLS) {
    const floor = sk === 'hitpoints' ? HP_START_XP : 0;
    if ((p.skills?.[sk] ?? floor) !== floor) return true;
  }
  // the newcomer's quiver is what everyone wakes with; anything else is a deed
  let slots = 0;
  for (const it of (p.inventory ?? [])) {
    if (!it) continue;
    slots++;
    if (it.item !== 'arrows' || it.qty > 25) return true;
  }
  return slots > 1;
}
// v0.76: and a part of that is always kept for people this world has never
// seen. Serving known citizens first (v0.70) stopped a flood of fresh keys
// from pushing established citizens out of the tick, but it handed whoever
// arrived first a permanent claim: spawning is free, so an attacker present on
// day one can mint citizens by the thousand and thereafter occupy the whole
// applied cap as KNOWN, with every honest newcomer behind them forever. A
// world that cannot be entered is a world that ends with the people already
// in it. This share is not a courtesy; it is the door.
const STRANGER_SHARE = 256;

// ---------- SPAWNING IS NOT AN ACTION (spec 5h) ----------
//
// A spawn used to compete for the same 4,096 slots as a footstep, which
// meant four thousand souls could be born in six hundred milliseconds. That
// is not a rate any real world has: even a launch day is a handful a
// second, and a crowd all arriving at once can wait a tick.
//
// It is also what made the world killable. A permanent citizen costs one
// spawn, ten steps and one gather -- twelve inputs -- so at four thousand
// spawns a tick an attacker fills three hundred thousand archive slots in
// NINE MINUTES, and nothing caps the archive.
//
// So spawning gets its own budget, small and separate. At one a tick the
// world still admits a hundred and forty-four THOUSAND new citizens a day,
// which no world needs, and the same attack now takes fifty hours of
// uninterrupted flooding instead of nine minutes -- slow, loud, and
// expensive to sustain.
//
// It costs an honest newcomer nothing but a tick or two of waiting on the
// busiest day this world will ever have.
const MAX_SPAWNS_PER_TICK = 1;
// Typed error codes for the CJS engine (mirrors errors.mjs; kept in sync by
// test/version.test.mjs). Identity corruption is the one safety-critical
// engine throw that operators classify.
const ENGINE_ERR = { CORRUPT_IDENTITY: 'ERR_CORRUPT_IDENTITY', BACKEND_DISAGREEMENT: 'ERR_ED25519_BACKEND_DISAGREEMENT' };
function engineThrow(code, message) { const e = new Error(message); e.code = code; e.name = 'IntervalError'; throw e; }
// Constitutional tables (rev4 brief §11): ONE shared source, execution,
// validation, and tests all reference these. A validator with its own
// copy of the constitution eventually disagrees with the engine (it
// happened: signpost text), so neither may define these locally.
const SKILLS = ['woodcutting', 'mining', 'fishing', 'cooking', 'smithing',
  'firemaking', 'prayer', 'ranged', 'magic', 'farming', 'fletching', 'attack', 'strength', 'defence', 'hitpoints', 'exploration', 'brewing', 'hauling'];
// §11: HAULING IS THE EIGHTEENTH SKILL (v0.87).
//
// It grants no power -- like prayer, exploration and brewing, the level IS the
// achievement. What it adds is a REASON to be on the road carrying something
// worth taking, and a rule saying who may take it. See §11.
// §6as: STRENGTH IS ITS OWN SKILL (v0.86).
//
// One skill drove both how often you land and how hard, so there was no build
// space at all: every fighter in this world was the same fighter, further
// along. A separate strength is what makes ninety-nine strength at
// seventy-five attack a genuinely different citizen from the reverse, and it
// is the thing that lets somebody choose what kind of fighter to be.
//
// It is a constitutional change -- a new skill, a new rules hash, a new
// founding -- which is why it comes last of the combat work and not first.
//
// ATTACK decides the roll. STRENGTH decides the blow. Ranged keeps both, for
// itself, because a bow's draw is the same muscle as its aim; splitting it
// would need a second ranged skill nobody asked for.
// 6bz/6ca: FIVE SLOTS. `offhand` for a shield, `legs` for gold and nothing
// else. Every layer reads this one list -- the wield validator, the state shape
// check at 4242 which demands the keys match EXACTLY, and the hood sweep -- so
// adding a slot anywhere but here would make a state that runs and will not
// import. A citizen founded before this rule has three keys and must gain two
// empty ones; see the migration below.
const EQUIP_SLOTS = ['weapon', 'head', 'body', 'offhand', 'legs'];
const NODE_TYPES = ['landmark', 'keeper', 'fence', 'hedge', 'tree', 'rock', 'magic-rock', 'fishing-spot', 'plot',
  // 6ch: THE WAYSTONES ARE GONE, AND WITH THEM EVERY TELEPORT IN THIS WORLD.
  //
  // A world whose whole shape is DISTANCE -- a gold seam an hour into the high
  // crags, a fishery a port is built around, a hauler who may be struck on any
  // road because the road IS the job, a Wilds you decide to enter and decide
  // again to leave -- cannot also have a network of doors. Every hour of that
  // geography was answered by an attunement and a keystroke.
  //
  // Gone with them: `recall`, attunement, and the waystone rumour. What STAYS
  // is the chart, as a GOOD rather than a key (6ci): 6ag was right that a
  // master surveyor should come home with something to sell. It had simply
  // spent that idea on a door.
  'bank', 'anvil', 'campfire', 'fire', 'guard', 'hearth', 'signpost', 'smith', 'store', 'wall', 'well', 'brewpot', 'watchfire', 'banner', 'stall', 'market',
  // §2g: A RAMPART IS NOT A HOUSE WALL.
  //
  // The town drawings have always distinguished them -- '%' is a town's outer
  // work, '#' is a building -- and the legend flattened both to `wall`, so
  // five hundred tiles of curtain across four fortified towns drew as domestic
  // masonry. Anchor's wall looked like a very long shed.
  //
  // It blocks exactly as a wall does and is not walkable-built, so nothing
  // about movement changes. What changes is that a citizen can tell a wall
  // they live behind from a wall they shelter behind.
  // §2g: THE OSSUARY. The bone-house of the monastery, and the one place on
  // the island where burying is worth more than burying in a field.
  //
  // Prayer was the only skill with nowhere to go. A woodcutter has the
  // Greenwood, a miner the Wilds, a fisher the water; a mourner had a verb and
  // no destination, and buried wherever their feet happened to be.
  'rampart', 'ossuary', 'house',
  // §6am (v6): THE MIDDLE OF THE ROAD GETS A GROUND OF ITS OWN.
  //
  // Two tiers only -- bronze at one, star and the master yields at the far end
  // -- left the whole middle of every gathering skill as featureless slope: a
  // place a citizen passed through in an afternoon and never stood in. The
  // fix is not a better log from the same trunk (that has no PLACE); it is a
  // new stand of trees, a new seam, a new shoal, set deeper in each country
  // than the baseline, so the middle of the game is somewhere you WALK TO.
  //
  // These are the exact sibling of `magic-rock`: their own node, their own
  // item, gated by a level and rewarded by a tool -- only the level is the
  // middle (thirty-five) where the magic-rock's is the end (seventy). A world
  // that founds itself on a generator which never seats them is unchanged: no
  // v1-v5 world contains one, so the yield, the gate and the tool below are
  // never reached in it.
  'oak-tree', 'coal-rock', 'eel-spot', 'iron-rock', 'heartwood-tree', 'deep-fish-spot',
  // 6bb: THE GOLD SEAM. Not a tier of mining -- a lottery inside it.
  'gold-rock',
  // 6bc: the woodcutting ladder. Ironbark is a wood; the gallows-oak is a
  // PLACE -- the same heartwood, twice a strike, in the country that kills.
  'ironbark-tree', 'gallows-oak',
  // 6bd: mining's own gallows-oak -- the same stone, twice a strike, deeper in
  'mother-lode',
  // 6be: fishing's Wilds rung -- the drowned shoal below the gibbet
  'gibbet-shoal'];
// The constitutional NAME rule (spec §5a) as ONE shared validator (rev5
// §3): claim_name input validation, checkpoint validation, imports, and
// the registry all call this, never a private regex.
function isValidName(name) {
  return typeof name === 'string' && /^[a-z0-9-]{1,12}$/.test(name)
    && !name.startsWith('-') && !name.endsWith('-');
}
const DEPLETE_TICKS = 8;
// §6ak: A TREE DOES NOT END AT ONE LOG.
//
// A node gave one thing and slept, so two citizens at one tree was a RACE:
// the first took the log and the second found it asleep. A resource nobody can
// share is a resource that pushes people apart, in a world whose best moments
// are the ones where they meet.
//
// And it made gathering mostly walking. The nearest other tree is 2.8 tiles
// off, so at woodcutting 57 with a bronze axe a log was 2.3 intervals of
// cutting and 2.8 of shuffling to the next trunk -- fifty-five per cent of the
// work was travel between things that are identical.
//
// So a node yields until a roll retires it: one success in four. No new field
// on the node, nothing to migrate, and the same beacon that decides every
// other chance in this world decides this one. A tree gives four logs on
// average, sometimes one, sometimes nine -- which is how a tree behaves.
const DEPLETE_ONE_IN = 4;
const NODE_YIELD = {
  // 6bx: A GRADIENT OF ONE, WHICH IS ALL SOFTWARE NEEDS.
  //
  // Flat experience cured the tier-as-shortcut fault and introduced a quieter
  // one: with every rung paying the same, an executor has NO REASON TO WALK.
  // It stands in the starter grove for eight hundred and eighty hours and the
  // whole ladder -- five places, four tools, three countries -- is content it
  // will never see. A citizen who wants goods still climbs; a citizen who
  // wants levels never does, and most of them are programs that want levels.
  //
  // One experience a rung. Five per cent, which is nothing to a person and
  // decisive to a bot: software moves for any positive gradient at all. The
  // CROWDING then does the sorting, because a rung with four citizens on it
  // has already lost more than five per cent to darkness -- so they spread
  // themselves across the tiers instead of stacking on the best one.
  //
  // It costs 14% off the road (879 hours to 754), which rateMul takes back.
  // The old shape was 25/45/65 and a 13.8x shortcut; this is 1.2x.
  'tree':         { item: 'logs',        skill: 'woodcutting', xp: 20 },
  'rock':         { item: 'ore',         skill: 'mining',      xp: 35 },
  'fishing-spot': { item: 'raw-fish',    skill: 'fishing',     xp: 20 },
  'magic-rock':   { item: 'magic-stone', skill: 'mining',      xp: 23 },
  // 6bd: THE MOTHER LODE, the exact sibling of the gallows-oak. Two stones to a
  // strike, deeper in the Wilds, and not one point more experience for it.
  'mother-lode':  { item: 'magic-stone', skill: 'mining',      xp: 24, qty: 2 },
  // §6am (v6): the middle tier. Higher xp than baseline, lower than the
  // capstones, and the item is its own thing -- oak-logs, coal, eel --
  // that the mid gear (steel) is forged and fletched from.
  'oak-tree':  { item: 'oak-logs', skill: 'woodcutting', xp: 21 },
  // 6bc: ironbark, the long-burning wood. Its job is the watchfire, which is
  // the one public work in this world, and the haft of the last axe.
  'ironbark-tree': { item: 'ironbark', skill: 'woodcutting', xp: 22 },
  'coal-rock': { item: 'coal',     skill: 'mining',      xp: 21 },
  'eel-spot':  { item: 'eel',      skill: 'fishing',     xp: 21 },
  // §6ao (v6): the clean mining chain -- iron (baseline) -> coal (mid) -> steel.
  // v6 mines IRON where v5 mined generic 'ore'; the baseline gear is bronze
  // still (bronze is iron worked simply here), and STEEL is iron quenched with
  // coal. v6 places iron-rock, never the old rock, so v5's ore is untouched.
  'iron-rock': { item: 'iron',     skill: 'mining',      xp: 20 },
  // §6ao (v6): the mastery seams, each its own place. Heartwood from the deep
  // Greenwood grove, deep-fish from the Wilds water at the gibbet. Gated to the
  // mastery level (MASTER_YIELD, 90) the way magic-rock gates mining.
  'heartwood-tree': { item: 'heartwood', skill: 'woodcutting', xp: 23 },
  // 6bc: THE GALLOWS-OAK. Not a new wood -- a new PLACE for the same one, in
  // the Wilds, giving two heartwood to a strike instead of one. This is the
  // lever that replaced price (a keeper's purse is 2 gold a tick and caps
  // everything): yield per action is uncapped, costs the experience curve
  // nothing, and the price of it is that anybody may kill you while you work.
  'gallows-oak':    { item: 'heartwood', skill: 'woodcutting', xp: 24, qty: 2 },
  'deep-fish-spot': { item: 'deep-fish', skill: 'fishing',     xp: 23 },
  // 6be: THE DROWNED SHOAL. Two deep fish to a cast, under the gibbet, in the
  // water only the Wilds touches -- fishing's gallows-oak, and the third of
  // the three. Every trade now has one place where the good is doubled and
  // the price of standing there is that somebody may kill you for it.
  'gibbet-shoal':   { item: 'deep-fish', skill: 'fishing',     xp: 24, qty: 2 },
  // 6bb: the gold seam yields like any other seam and pays like any other
  // seam. What differs is only how often, and that is decided by roll16.
  'gold-rock':      { item: 'gold-ore',  skill: 'mining',      xp: 23 },
};
// v0.40: the night gate is repealed. It was constitutional arithmetic
// (tick % 2400), not wall-clock authority: but its only effect was
// mandatory waiting, and waiting is the one cost this world rejects.
// The stones price the sigil; the sky is for the windows to paint.
// v0.41: strength must be earned before it is worn. Smithing gated the
// forge; nothing gated the arm. Bronze stays free: the door is open.
const WIELD_REQS = {
  // §6ae: STARMETAL IS A LATE THING, not a slightly better shirt.
  //
  // It was wieldable at attack 20 and defence 15-30 -- a fifth of the way up
  // a ninety-nine scale -- so bronze was what newcomers wore for an hour and
  // star was what everybody wore forever. With only two tiers in the world,
  // the second one has to mean something.
  //
  // Fifty. Past the point where a citizen has decided what they are, and
  // reachable on common beasts, which teach defence at any level (the flat
  // four-per-miss of 6aa-ii).
  // A STAR TOOL ASKS FOR THE TRADE, NOT FOR A SWORD ARM. Sixty in the skill it
  // serves: past the middle of the road, so it is something to work toward,
  // and well short of the ninety that buys heartwood and the deep fish.
  // §6am (v6): a mid tool asks for the middle of its trade, the way a star
  // tool asks for sixty. Thirty-five: the gate of the seam it is made to work.
  // 6bc: THE AXE LADDER, on the HUMAN clock. Because experience is flat and
  // exponential, level 20 is half an hour in, 40 is three and a half, 70 is
  // fifty. So the whole tool ladder is earned in the first days -- which is the
  // only part of this skill a person will ever cut by hand before handing it to
  // an executor. A tool nobody living ever forges is a tool for nobody.
  'steel-hatchet': { woodcutting: 10 }, 'steel-pickaxe': { mining: 10 }, 'oak-rod': { fishing: 10 }, 'ironbark-rod': { fishing: 30 }, 'heartwood-rod': { fishing: 70 },
  'star-hatchet': { woodcutting: 30 }, 'star-pickaxe': { mining: 30 },
  // 6bc: the felling axe -- a starmetal head on an ironbark haft, and the last
  // thing woodcutting asks for. It needs the Wilds (the head) and the deep
  // Greenwood (the haft), so the peaceful half of the trade and the dangerous
  // half have to meet, exactly as the heartwood bow makes them.
  'great-hatchet': { woodcutting: 70 }, 'great-pickaxe': { mining: 70 },
  'star-sword': { attack: 50 }, 'star-dagger': { attack: 50 }, 'old-chain': { attack: 30 },
  'star-spear': { attack: 50 }, 'star-maul': { attack: 55 }, 'horn-bow': { ranged: 20 },
  'dragonbow': { ranged: 40 },   // it will not be drawn by a beginner
  // §6x: these shipped with NO requirement at all, which made a starmetal
  // flail wieldable at level one while a star-maul asked for attack 25. A
  // crossbow is heavy to hold level and heavier to crank; a flail on a chain
  // is the least forgiving thing in the world to swing at anything.
  'crossbow': { ranged: 25 },
  // §6x: THE FLAIL IS STARMETAL ONLY. `pierces` ignores an entire defensive
  // system, and on a starter weapon that meant a level-ten citizen with two
  // ore beat a star-clad one more efficiently than a star-sword does. It is
  // the answer to armour, and it belongs to people who have earned armour.
  'star-flail': { attack: 55 },
  // §6y: sigils bound to the limbs. The draw is half the arrows, and half of
  // nothing is still nothing, so it asks a real bow-arm first.
  'sigil-bow': { ranged: 30, magic: 20 },
  'heartwood-bow': { ranged: 40 },
  // §6ae AGAIN, AND IT WAS MISSED. The heartwood bow is fletched at ninety and
  // drawn at ranged forty; the heartwood staff was fletched at ninety and held
  // by ANYBODY. It halves the cadence of a transmuting, so handing one to a
  // citizen of magic one halved their whole road from the first interval --
  // three hundred and forty-eight hours to a hundred and seventy-four.
  //
  // Seventy -- and the number is a SIGNAL, not a pacing lever, which is worth
  // saying plainly so nobody later mistakes it for balance and tunes it.
  //
  // Experience is exponential, so a gate low down covers almost none of the
  // road: at forty the staff opens after 0.29% of the way to ninety-nine and
  // the total is 174 hours, exactly what no gate at all gives. Seventy is
  // 5.66% and costs ten hours in 184. Only eighty-five would truly pace it,
  // and eighty-five is where the stilling lives; a second thing there would
  // dilute the one capstone magic has.
  //
  // What actually keeps this staff rare is that somebody must reach fletching
  // ninety and spend two heartwood on it. The level only has to say what kind
  // of thing it is, and seventy says "a serious tool" where forty said "not
  // quite a beginner".
  'heartwood-staff': { magic: 70 },
  'star-helm': { defence: 45 }, 'star-plate': { defence: 50 }, 'king-shroud': { defence: 40 },
  // 6bb: it defends exactly as starmetal does. NOT better -- better would make
  // it mandatory, and a thing everybody must own says nothing about anybody.
  // Equal means wearing it is a statement rather than a build.
  'gold-helm': { defence: 45 }, 'gold-plate': { defence: 50 }, 'gold-legs': { defence: 45 },
  'iron-shield': { defence: 1 }, 'steel-shield': { defence: 30 }, 'star-shield': { defence: 48 },
  // §6am (v6): the mid arms and armour, worn at the middle of the fighting
  // road -- past a beginner, short of the fifty that straps on starmetal.
  'steel-sword': { attack: 35 }, 'steel-dagger': { attack: 35 }, 'steel-spear': { attack: 35 },
  'steel-helm': { defence: 32 }, 'steel-plate': { defence: 38 },
  'handgonne': { ranged: 90 },   // §6av
};
// THE STORE MAKES NOTHING. It was `{ seeds: 15 }` -- the one good in the world
// conjured by an institution rather than by a person -- and with the stalls in
// place that is the odd one out. A general store is now purely a MARKET: every
// item on its shelf was carried in by a citizen and priced by what another
// citizen was paid for it. Nothing appears there from nowhere.
//
// Seeds moved to the seedsman at Hollybarrow, which is the farm town, and that
// is the point of the change: farming now BEGINS somewhere. A citizen who
// wants to grow anything makes the walk to Hollybarrow first, and afterwards
// knows where Hollybarrow is for the rest of their life.
const STORE_SELLS = {};

// ---------------------------------------------------------------------------
// THE STALLS
// ---------------------------------------------------------------------------
// A town has a bank, a store and an anvil, and everything else is a house. The
// houses are not a failure -- a town needs to be somewhere people live -- but
// it does mean a citizen learns three buildings and stops looking.
//
// A stall is a building worth knowing. It sells ONE trade's basic gear, from
// nothing, at roughly twice what the same thing costs anywhere else. That is
// not a mistake in the pricing. A stall is not competing with the market; it
// is competing with WALKING, and it wins because it is always there and it is
// always the same. "The axe man in Greenhollow" becomes a fact a citizen
// knows, and a fact you know is worth more than the coin it costs.
//
// Deliberately narrow, and deliberately humble. Bronze only -- no star gear,
// nothing rare, nothing a citizen will still be buying in a month. The point
// is not to be useful forever. The point is to be somewhere.
//
// And they do NOT buy. A stall is where a thing comes FROM. Selling stays the
// general store's business, which keeps the store the heart of a town's
// economy and the stall a place with one job.
// WHAT A PERSON IN THIS WORLD MAY BE. The six trades a stall keeps, plus every
// other calling somebody was already doing under the name "keeper".
const KEEPER_KINDS = ['lumber', 'delve', 'arms', 'armour', 'bows', 'seed',
  'banker', 'merchant', 'sawyer', 'shepherd', 'delver', 'miller', 'quarrier',
  'watchman', 'wizard', 'fisher', 'brewer', 'mourner',
  'innkeeper', 'collier', 'drover', 'beekeeper'];
// AND WHAT EACH IS CALLED. A display string in a rules file looks out of
// place until you remember what happened without one: the calling lived in a
// single window's own table, so that window said "Rosamund, the banker" and
// every other window said "Keeper". A citizen's name for a thing should not
// depend on which door they came in by.
//
// The engine does not draw anything. It says what the words ARE, once, and a
// window that renders different ones is wrong in the same way a window that
// draws the Fens in the wrong place is wrong.
// ---------------------------------------------------------------------------
// WHAT A LEVEL BUYS
// ---------------------------------------------------------------------------
// Every threshold in this file, gathered into one place a citizen can read.
//
// It is DERIVED, never typed out: each entry names the constant it came from,
// so the guide cannot say mining seventy while the vein asks for something
// else. The forge ladder and the wielding requirements are read straight out
// of SMITH_REQS and WIELD_REQS, so a new recipe appears in the guide the day
// it appears in the world and nobody has to remember.
//
// The engine draws nothing. It says WHAT IS TRUE, once, and a window that
// shows a citizen something different is wrong on the same terms as one that
// draws the Fens in the wrong place.
// MEMOISED AND LAZY, because it reads constants declared further down this
// file. Called at load it threw on the first line: "Cannot access
// MASTER_YIELD before initialization". Nothing about a derived table should
// depend on where in a file it happens to sit.
let _unlocksMemo = null;
function skillUnlocks() {
  if (_unlocksMemo) return _unlocksMemo;
  const out = {};
  const add = (skill, level, text) => {
    (out[skill] ??= []).push({ level, text });
  };
  // the gathering masteries
  // 6bc: every gathering gate reads from NODE_GATE, so a new seam appears in
  // the guide the interval it appears in the world.
  // 6bv: THE GUIDE SAYS WHAT OPENS. IT DOES NOT SAY WHAT IT IS WORTH.
  //
  // Every rule of this world is public and every state is readable, so the one
  // asymmetry a citizen can still earn is UNDERSTANDING. That a gallows-oak
  // gives two heartwood to a strike, that the gold seam answers about once in
  // sixteen thousand three hundred and eighty-four intervals, that ironbark
  // feeds a watchfire three times as long -- these are discoveries. They are
  // findable by anybody willing to stand at a tree and count, or to read the
  // engine, which is public. Printing them in a menu costs nothing to reach
  // and so is worth nothing to know.
  //
  // A gate is different. A citizen has to be able to AIM: to know that the
  // heartwood wants seventy-eight and to decide whether to walk that road.
  // Hiding the gate does not create discovery, it creates wandering.
  //
  // So: names and levels, never yields, odds, multipliers or tactics. The
  // numbers withheld here are all in the file for whoever maintains it --
  // NODE_YIELD carries the qty, GOLD_ONE_IN the odds, BURN_MULT the fuel.
  // Reading nine thousand lines to find them is the game working as intended.
  const _gateWords = {
    'oak-tree': 'the oak groves open to your axe', 'ironbark-tree': 'the ironbark stands',
    'heartwood-tree': 'the heartwood of the deep Greenwood', 'gallows-oak': 'the gallows-oaks of the Wilds',
    'coal-rock': 'the coal seams open to your pick', 'magic-rock': 'the magic-rocks of the Wilds open to your pick',
    'gold-rock': 'the gold seam will answer you',
    'mother-lode': 'the mother lode, deep in the Wilds',
    'eel-spot': 'the eel runs', 'deep-fish-spot': 'the deep fish of the Wilds water',
    'gibbet-shoal': 'the drowned shoal under the gibbet',
  };
  for (const [nt, g] of Object.entries(NODE_GATE)) if (_gateWords[nt]) add(g.skill, g.level, _gateWords[nt]);
  add('farming', FARM_MASTER, 'a fuller sheaf from every row');            // 6bv: how much fuller is GRAIN_MASTER
  add('cooking', COOK_DEEP_REQ, 'you may cook the deep fish');
  add('fletching', ARROW_MASTER, 'more arrows from the same bone');         // 6bv: how many more is ARROWS_MASTER
  add('fletching', HEARTWOOD_FLETCH, 'the heartwood bow and the heartwood staff');
  for (const [rd, lv] of Object.entries(ROD_FLETCH_REQ)) add('fletching', lv, 'shape the ' + rd.replace(/-/g, ' '));
  // magic, from its first spell to its last
  add('magic', ALCH_REQ, 'transmute');                                      // 6bv: what a thing is worth unmade is ALCH_PAYS
  add('magic', MEND_REQ, 'mend');                                           // 6bv: that a wand sends it is for a wand-bearer to find
  add('magic', STILL_LEVEL, 'the stilling');                                // 6bv: what it does, and what it costs, are the caster's to learn
  // prayer, which does one thing and then does it twice
  add('prayer', PRAYER_KEEP, 'the dearest priced thing you carry survives your death');
  add('prayer', PRAYER_KEEP_TWO, 'the two dearest do');
  // and the tables, so a new recipe needs no new line here
  for (const [item, req] of Object.entries(SMITH_REQS)) {
    const words = Object.entries(req).filter(([k]) => k !== 'smithing')
      .map(([k, v]) => k + ' ' + v);
    add('smithing', req.smithing ?? 1,
      'forge the ' + item.replace(/-/g, ' ') + (words.length ? ' (' + words.join(', ') + ')' : ''));
    for (const [k, v] of Object.entries(req)) if (k !== 'smithing') add(k, v, 'forge the ' + item.replace(/-/g, ' '));
  }
  // firemaking's one threshold lives in the genesis rather than a constant,
  // because a founding chooses it; the default is the one every world so far
  // has used, and a window with a genesis to hand may say the real number.
  add('firemaking', 80, 'kindle a watchfire');                              // 6bv: that the country sees it is the point of raising one
  add('brewing', BREW_MASTER, 'a pot gives up more than it used to');       // 6bv: DRAUGHTS_MASTER
  add('brewing', DEEP_BROTH_BREW, 'a deep fish makes a DEEP BROTH');        // 6bv: heals HEAL_DEEP_BROTH, and stacks
  add('exploration', EXPLORE_MASTER, 'any rumour yields a chart');          // 6bv: what a chart is FOR is the finder's business
  for (const [item, req] of Object.entries(WIELD_REQS))
    for (const [skill, lv] of Object.entries(req))
      add(skill, lv, 'take up the ' + item.replace(/-/g, ' '));
  for (const k of Object.keys(out))
    out[k].sort((a, b) => a.level - b.level || (a.text < b.text ? -1 : 1));
  return (_unlocksMemo = out);
}

// WHAT A THING IS WORTH, FOR PUTTING A PILE IN ORDER.
//
// The engine does not choose what a citizen picks up -- `pickup` names a
// groundId, and it should, because taking the ore instead of the plate is a
// decision somebody may want to make. But every window needs a DEFAULT for a
// plain click on a heap, and a default is not neutral: in a race for a spilled
// pack the window that reaches for the plate beats the window that reaches for
// whatever fell first. That is the same unfairness as two windows disagreeing
// about where the Fens are, so the ORDER is the world's even though the choice
// is the citizen's.
//
// Unpriced does not mean worthless. The dragonbow, the old chain, a sigil and
// a chart are the four rarest objects here and no keeper will price any of
// them -- ranking them by PRICES alone put them BELOW a handful of bones.
// Forage is the one unpriced thing that really is worth nothing: it rots in
// fifty intervals and cannot be carried.
const WORTH_UNPRICED = 100000;
function worthRank(item) {
  if (item === 'forage') return -1;
  return PRICES[item] ?? WORTH_UNPRICED;
}

const CALLING_NAMES = {
  lumber: 'the axe man', delve: 'the delver', arms: 'the arms-master',
  armour: 'the armourer', bows: 'the fletcher', seed: 'the seedsman',
  banker: 'the banker', merchant: 'the merchant', sawyer: 'the sawyer',
  shepherd: 'the shepherd', delver: 'the delver', miller: 'the miller',
  quarrier: 'the quarrier', watchman: 'the watchman', wizard: 'the wizard',
  fisher: 'the fisher', brewer: 'the brewer', mourner: 'the mourner',
  innkeeper: 'the innkeeper', collier: 'the collier', drover: 'the drover',
  beekeeper: 'the beekeeper',
};
// 6cf: THE FISHER IS A KIND, NOT JUST A SHELF.
//
// 6be added `fisher: { rod: 20 }` to STALL_SELLS and stopped there, and a
// stall is only ever SEATED if its kind is in this list -- so no fisher stall
// was ever built, the rod stayed unbuyable, and the deadlock that note claims
// to have fixed was still shut. A table of goods with nobody standing behind
// it is a shop that does not exist.
//
// Two lists for one fact was the fault. They are checked against each other in
// the founding sweep now, so a shelf without a keeper cannot ship again.
const STALL_KINDS = ['lumber', 'delve', 'arms', 'armour', 'bows', 'seed', 'fisher'];
const STALL_SELLS = {
  lumber: { 'iron-hatchet': 20 },
  delve:  { 'iron-pickaxe': 20 },
  arms:   { 'iron-dagger': 16, 'iron-sword': 30, 'iron-spear': 28 },
  armour: { 'iron-helm': 24 },
  // A BOW AND NO ARROWS, on purpose. Arrows are meant to be hard to come by,
  // and a stall selling them from nothing at any price undoes that in an
  // afternoon: there is no stock to run out and no cooldown that would not be
  // one more field in every hash forever. So the fletcher sells the bow and a
  // citizen makes their own shafts, which is what fletching is for.
  // the fletcher sells the stave as well as the bow. Both are shaped wood, and
  // a citizen who has not yet trained fletching should still be able to buy the
  // tool of a trade they HAVE trained -- that is what a stall is for.
  bows:   { 'wooden-bow': 16, 'staff': 12, 'wand': 12 },
  // THE ONLY SOURCE OF SEED IN THE WORLD, and deliberately one place. Dearer
  // than the store ever charged, because everything at a stall is -- and
  // because a thing you had to travel for should cost something.
  seed:   { seeds: 22 },
  // 6be: and the fisher, who was the one trade with a keeper's NAME in
  // KEEPER_KINDS and no stall to stand in. A rod for the price of an axe.
  fisher: { rod: 20 },
};
// 6cf: the two lists must name the same trades, or a shop exists on paper only.
for (const k of STALL_KINDS) if (!STALL_SELLS[k]) throw new Error('stall kind with nothing to sell: ' + k);
for (const k of Object.keys(STALL_SELLS)) if (!STALL_KINDS.includes(k)) throw new Error('stall shelf nobody stands behind: ' + k);
 // the keeper's OWN goods, made from nothing
// v0.74: the keeper's shelf. What a citizen sells is no longer annihilated: it
// sits in that store until somebody buys it. Two stores keep two shelves, so
// Anchor and Milbrook develop separate strengths and carrying goods between
// them is a trade in itself.
//
// The keeper takes a cut. A citizen sells at PRICES and the next buyer pays
// PRICES + max(1, PRICES/10), and the difference is destroyed. That spread is
// the world's only gold sink: before it, selling minted coin from nothing and
// nothing ever unmade it. A flat tenth would have rounded to zero on the nine
// cheapest goods, which are the ones that actually move, so the cut is never
// less than a single coin.
// ---------------------------------------------------------------------------
// THE KEEPER'S PURSE
// ---------------------------------------------------------------------------
// A store conjured the coin it paid you. Gold entered this world at whatever
// rate a citizen could gather -- seventeen hundred an hour for a beginner,
// twenty-eight thousand for a master with a star pick -- and left it only
// through a tenth on resale. With executors running without pause that is a
// money supply with a source and no ceiling, in a world meant to run for
// decades and never be amended.
//
// So a keeper has a PURSE. Selling spends it, buying refills it, and gold
// circulates instead of appearing. The purse accrues a little each interval up
// to a cap, so the island's whole money supply grows at a rate this document
// fixes once: ten towns times two coin an interval, and no more, forever.
//
// What it costs a citizen is a walk. A keeper who has been bought out cannot
// pay, so you carry your logs to the next town -- which is the first reason
// this world has ever had for its ten towns to differ economically, and the
// first reason its roads have mattered for trade rather than travel.
// ---------------------------------------------------------------------------
// FORAGE
// ---------------------------------------------------------------------------
// Everything a citizen has ever touched in this world is INVENTORY: a number
// that moves between a pack, a vault, a shelf and the ground. Forage is not.
// It falls where a beast falls, it cannot be picked up, and taking it eats it.
//
// Which makes it the first thing here that exists only on a tile and only
// right now. A fight acquires geography: the ground behind you is worth
// something and the ground in front of you is not, and a citizen at four
// hitpoints has a reason to look at where they are standing rather than what
// they are carrying.
//
// It is deliberately NOT better food. A fixed six -- the same as a cooked fish
// now that the gullet is repealed -- and it
// rots in fifty intervals -- half of what anything else on the ground lasts --
// so its worth is TIMING and never throughput. Nobody farms it; there is
// nothing to farm.
// WHO LEAVES IT, AND WHO DOES NOT.
//
// Goblin, wolf and bear: the beasts of the settled country, the ones a citizen
// meets in the Heartlands and the fens and the Greenwood. A third of the time,
// give or take. It is what a living thing was carrying or grubbing among when
// it fell, so a goblin's satchel and a bear's berry thicket both count.
//
// Troll, skeleton-knight and the dragon leave NOTHING, and that is the rule
// rather than an oversight. A skeleton was never carrying fruit. More to the
// point, those three are the Wilds, and everything about the Wilds is that it
// does not help you: no recall out, no keeper, no well, and now nothing
// growing where a thing dies. The hunting country feeds a citizen at four
// hitpoints. The Wilds do not, and never will.
const FORAGE_HEAL = 6;
const FORAGE_ROTS = 50;

// ---------------------------------------------------------------------------
// A CITIZEN'S STALL
// ---------------------------------------------------------------------------
// Every economic rule in this constitution ends the same way: the only
// sensible buyer is another citizen. Magic-stone at twenty when a plate wants
// seven. Dragon-bones at five hundred when they are worth six thousand. A
// keeper's purse holding twelve hundred against a master smith's thirty-five
// million. The world is built to force citizens to trade with each other --
// and until now that required both of them awake at the same moment.
//
// A stall a citizen raises sells while they sleep.
//
// STOCK IS ONE-WAY, and that single rule is what keeps it a shop. You may put
// things in; the only ways out are a SALE or a SPILL. Never a withdrawal.
// Without it a stall in the Wilds is a bank in the Wilds -- mine twenty-eight
// stones, walk five tiles, empty the pack, mine twenty-eight more -- and the
// six thousand trips out of the Wilds that the whole star economy rests on
// would simply evaporate.
//
// THE PRICE IS NOT THE WORLD'S BUSINESS. There is no cap on the ask. What a
// thing is worth between two citizens is the one number in this world that no
// rule should touch; a ceiling would be the constitution having an opinion
// about a market it exists to make possible.
//
// It never blocks a tile, so no run of stalls can wall anybody in or out.
const MARKET_LOGS = 16, MARKET_ORE = 8;   // twenty-four of a pack of twenty-eight
const MARKET_RAISE = 20;                  // intervals of standing still
const MARKET_STOCK = 200;                 // one good, this many of it
const MARKET_OWNED = 1;                   // one each, like the seedsman
const MARKET_DECAY = 432000;              // three days untouched, then it falls
// 6bn: THE PURSE IS FLOAT. IT IS NOT A MINT.
//
// It was capped at 1200 and refilled at 2 a tick from NOTHING -- twelve gold
// an interval across six stores, 72,000 an hour, which was the entire money
// supply of this world and every coin of it conjured by the clock rather than
// earned by anybody. That contradicted the rule written over STORE_SELLS in
// this same file: "every item on its shelf was carried in by a citizen.
// Nothing appears there from nowhere." The GOODS obeyed it. The COIN never did.
//
// And the cap made it worse once the shelf loop existed. `Math.min(PURSE_CAP,
// ...)` DESTROYS the coin a buyer pays once a keeper is full, so a store
// punished itself for being busy: a sink that fires exactly when the market is
// working. Anything priced over forty-two gold could not sell a full pack at
// all, which is why price could never be a tier lever.
//
// Both are gone. A purse now only rises when somebody BUYS off the shelf and
// only falls when somebody SELLS to it, and the keeper's spread (storeAsk) is
// still destroyed on every round trip -- so the float shrinks about a tenth
// each time it turns over, and the sink outlives the source. Zero is allowed
// and it MEANS something: this store has bought more than it has sold, and is
// out of money. That is a market signal, and the answer to it is to trade with
// a person instead, which is the economy this world actually wants.
const PURSE_SEED = 1200;        // 6bn: what a founding puts in a keeper's till, once
const PURSE_MAX = 1e12;         // 6bn: a bound for the validator, not a rule about trade
const SHELF_CAP = 8000;        // per item, per store.
// v0.83: was 1000, when there were thirteen stores. The two numbers were
// always independent and got confused for one: state cost is the number of
// (store, item) PAIRS -- twenty-five items times however many shops -- and
// NOT the integer in each. A shelf holding eight thousand is the same few
// bytes as one holding a thousand. So cutting to six markets and raising the
// cap gives forty-eight thousand units of shelf against the old thirteen
// thousand: fewer, deeper markets AND more headroom, not a trade between
// them. The decay sink is unharmed, being proportional -- a deep shelf still
// sheds a sixteenth a cycle. What stops happening is the max(1) floor eating
// small piles alive, which is what fragmentation actually cost.
const SHELF_DECAY_EVERY = 1500; // 15 minutes
const SHELF_DECAY_SHIFT = 4;    // a sixteenth rots away: goods nobody wanted // farming no longer waits on goblin luck
// SEVENTY. THE VEIN REFUSES ANYONE BUT A MASTER.
//
// This was ten -- a beginner's gate wearing a master's clothes. Mining had a
// second ore and no reason to reach ninety-nine, because everything mining
// could ever give you was open in the first hour.
//
// It is not raised to make star gear late; the market does that badly anyway,
// since magic-stone is priced at twenty and any citizen may buy it. It is
// raised so that MINING has a country at the end of its road, the way
// woodcutting has heartwood and fishing has the deep water.
const MAGIC_ROCK_MINING = 78;  // 6bd: the heartwood's number, for the heartwood's place in the road
// §6am (v6): the mid seams open at the middle of the road -- past the point a
// citizen has decided what they are, well short of the ninety that takes
// heartwood and the deep fish and the magic-rock. One number for all three
// skills: the middle is the middle. A founding tunes its own; this is the
// default the first v6 world uses.
// 6bb: THE GOLD SEAM, AND WHY EIGHTY-FIVE AND NOT NINETY-NINE.
//
// Gold pays the SAME experience a successful strike anywhere pays, and it pays
// it one time in sixteen thousand three hundred and eighty-four -- about two
// and three quarter hours. So an hour at the seam is not an hour spent, it is
// an hour of MASTERY FORGONE, and that is the entire price of gold: the only
// currency in this world nobody can inflate.
//
// Which is exactly why the gate cannot be ninety-nine. A master has nothing
// left to forgo, so at ninety-nine the price is ZERO and gold becomes a
// post-mastery errand -- the one shape this world has avoided everywhere else.
// At eighty-five a miner is a hundred and ninety hours in with six hundred and
// ninety-five still ahead, and a full set of plate costs them thirty-nine per
// cent of the road they have left. That is a decision. Ninety-nine is a queue.
//
// It also keeps gold BUYABLE. A gate at the top would mean only masters could
// ever produce it, and the interesting thing about a gold plate is not that
// one person was patient -- it is that they could command the patience of
// twenty others.
const GOLD_MINING = 85;
const GOLD_ONE_IN = 16384;      // one strike in this many intervals: 2h44m
// and the lot itself, out of roll16's 65,536. 65536/16384 = 4.
const GOLD_THRESHOLD = 65536 / GOLD_ONE_IN;
const GOLD_DEPLETE_TICKS = 0;   // a seam that yields this seldom never sleeps
const GOLD_ORE_PER_BAR = 5;     // and what the anvil makes of them
// 6bc: THE GATHERING CURVE, AND WHY IT IS NEARLY FLAT.
//
// It was `min(32 + lvl + tool, 176)`: a master with a star axe struck seven
// times as often as a newcomer, and on top of that the higher trees paid two
// and a half times the experience. Thirteen and a half times, newcomer to
// master, which made a TIER A SHORTCUT -- the exact opposite of the rule this
// world states everywhere else, that mastery buys more from an hour and never
// a shorter road. Cutting the whole way on starter trees took two hundred and
// fifty-one hours; the ladder took eighty-five.
//
// So: the experience is FLAT at every tier (see NODE_YIELD), and the curve is
// shallow. Base sixty, two fifths of a level, four axes worth twelve to
// thirty-six. A log is 8.7 seconds at level one and 4.7 at ninety-nine -- a
// master is twice as fast, and forty times as rich, and that is the whole
// difference. What a level buys is ACCESS, and what access buys is a better
// good, not a faster road.
//
// Integer arithmetic only (2m): floor(2*lvl/5), never a fraction.
// 6bi: THE RATE LIVES IN THE TOOL. THE LEVEL BUYS ACCESS.
//
// The first cut of this curve put the throughput in the LEVEL and left the
// axes worth about nine per cent each -- a reward nobody can feel, for work
// that costs the Wilds. The cause was arithmetic, not judgement: a threshold
// is an integer out of 256 and the useful band was 18 to 36, so a citizen's
// WHOLE progression had sixteen integer steps to share, and a tool step
// rounded down to two of them.
//
// Two changes. The threshold is drawn against roll16 -- the same two bytes the
// gold seam reads -- so there are sixteen thousand steps where there were
// sixteen, and a bonus is never eaten by rounding. And the weight moves off
// the level onto the tool: base thirty, a tenth of a level, four tools worth
// twenty-four to fifty-four.
//
// The identity that forced it, because it is not obvious: A NEWCOMER'S SPEED
// IS THE MASTER'S SPEED TIMES THE SPAN. Hours-to-ninety-nine fixes what a
// master's interval is worth (about five seconds a log); every other rate in
// the skill is that number times how much better a master is. So "a fast
// newcomer", "tools that matter" and "mastery takes a month" are three
// constraints on two numbers -- unless the span is bought with tools, which a
// newcomer can go and HOLD, rather than levels, which they cannot.
//
// A citizen of ten with a steel axe now out-cuts a citizen of sixty with an
// iron one, and that is the right answer: they went and got the better axe.
const GATHER_BASE = 30, GATHER_SLOPE_DEN = 10, GATHER_CAP = 130;
// 6bc: ONE TABLE FOR EVERY GATE, so a skill can be tuned without touching its
// neighbours. This replaced three separate mechanisms -- a shared MID_TIER
// constant, a shared MASTER_YIELD, and two hand-written ifs -- which is how
// woodcutting's middle and fishing's middle came to be the same number for no
// reason anybody chose.
const NODE_GATE = {
  'oak-tree':        { skill: 'woodcutting', level: 20 },
  'ironbark-tree':   { skill: 'woodcutting', level: 45 },
  'heartwood-tree':  { skill: 'woodcutting', level: 78 },
  'gallows-oak':     { skill: 'woodcutting', level: 92 },
  // 6bd: mining, matched rung for rung to woodcutting. Coal is the SAFE middle
  // and holds the road from thirty to seventy-eight, because a skill whose only
  // way up ran through the Wilds would be a fighting skill wearing a pick.
  'coal-rock':       { skill: 'mining',      level: 20 },
  'magic-rock':      { skill: 'mining',      level: MAGIC_ROCK_MINING },
  'mother-lode':     { skill: 'mining',      level: 92 },
  'gold-rock':       { skill: 'mining',      level: GOLD_MINING },
  'eel-spot':        { skill: 'fishing',     level: 20 },
  'deep-fish-spot':  { skill: 'fishing',     level: 78 },
  'gibbet-shoal':    { skill: 'fishing',     level: 92 },
};
const MID_TIER_GATE = 35;
const MID_TIER_GATE_SKILL = { 'oak-tree': 'woodcutting', 'coal-rock': 'mining', 'eel-spot': 'fishing' };
// ---------------------------------------------------------------------------
// A DEED IS DONE WHERE PEOPLE CAN SEE IT
// ---------------------------------------------------------------------------
// An `action` is something a citizen is IN THE MIDDLE OF -- gathering,
// fighting -- and it sits in the state for as long as it lasts, so every
// window can draw it. A deed that finishes inside one interval left no trace
// at all: eating, drinking, burying, transmuting, pressing a sigil. They were
// invisible to everyone but the doer.
//
// That is not a small thing. Watching somebody eat mid-fight is how you know
// they are in trouble; watching somebody stand at the Brandline and unmake
// their haul is a thing people gather to see. A world where deeds are private
// is a world of people standing still and quietly getting richer.
//
// One optional word on a citizen, set on the interval the deed lands and
// cleared at the top of the next. Fourteen bytes, on the interval they act,
// against a citizen record of six hundred. Every window reads it; no window
// has to be clever enough to infer it from a skill going up.
const DEEDS = ['alch', 'unmake', 'drink', 'eat', 'bury', 'forage', 'mendp', 'invoke',
  'fletch', 'smith', 'plant', 'harvest', 'cook', 'light', 'kindle', 'still',
  'cast', 'recall', 'pickup', 'drop', 'buy', 'sell', 'deposit', 'withdraw'];
const DEED_SET = new Set(DEEDS);

// §6am: YOU CANNOT BE PAID TWICE FOR ONE INTERVAL.
//
// A gather is an ACTION: it runs on by itself, interval after interval, and
// costs no input once given. An instant deed costs the input. So a citizen who
// set a pickaxe going and then transmuted, fletched, smithed, cooked, buried,
// or pressed a sigil was earning TWO skills at full rate from one interval,
// for as long as the rock lasted -- and every one of these left the action
// running. Only drinking, mending and the stilling stopped it, and those three
// are the ones that teach nothing.
//
// The line is what a deed TEACHES. A deed that pays experience ends whatever
// else the citizen had going; eating, drinking, picking a thing up, banking
// and trading do not, because they pay nothing and a citizen should be able to
// eat without losing their tree.
// §2b-iv: THE MARK AND THE ANSWER, IN ONE PLACE.
//
// `brandedUntil` was assigned in exactly one line of this engine, inside
// `attackp`. The `special` handler deals damage, kills, spills packs and ends
// fights -- and never branded, and carried no copy of the retaliation that
// makes a struck citizen strike back. Measured: identical kill speed, no mark,
// and no damage taken, because the victim never answered.
//
// Every §2b enforcement hung off that one line, so a band that only ever sent
// `special` was invisible to the law: no keeper refused them, no stone was
// closed, prayer still covered them, and nobody was licensed to hunt them.
// "A raiding party marks itself in public and cannot deny having been one" was
// true of one verb out of two.
//
// So the mark and the answer live here, and BOTH paths call it. A future third
// way of hurting somebody will call it too, or it will be obvious in review
// that it did not.
function strikeConsequences(s, pid, p, target, targetId) {
  if (!target) return;
  const already = (target.brandedUntil ?? 0) > s.tick;
  const swingingBack = target.action?.type === 'attackp' && target.action.targetId === pid;
  if (!swingingBack && !already) p.brandedUntil = s.tick + BRAND_TICKS;
  if (target.hp > 0 && target.action?.type !== 'attackp' && target.action?.type !== 'attack')
    target.action = { type: 'attackp', targetId: pid, since: s.tick + 1, style: 'even' };
}

const TEACHES = new Set(['alch', 'unmake', 'bury', 'fletch', 'smith', 'cook',
  'invoke', 'stoke', 'plant', 'harvest', 'light', 'kindle', 'brew', 'collect',
  'survey', 'build_brewpot', 'raise_market']);

const DEATH_TICKS = 5; // the world holds its breath; windows may grieve

// ---------------------------------------------------------------------------
// WHAT PRAYER IS FOR
// ---------------------------------------------------------------------------
// Prayer did nothing. `effLevel(p.skills.prayer)` appeared nowhere in this
// file: a citizen buried bones, the number went up, and the number changed
// nothing that ever happened to them. It fed a calling and a cape and that
// was all.
//
// It gets one effect, and only one: at seventy, the most valuable PRICED
// thing a citizen carries survives their death.
//
// Priced is the whole of the design. A store's price list is the set of
// ordinary goods -- ore, a bronze sword, a cooked fish, a plate. The things
// that make this world worth a decade are NOT on it: the old chain, the
// dragonbow, a sigil, a chart. Those are traded between citizens and priced
// by nobody, and they stay exactly as losable as they have always been.
//
// So a mourner's reward is that their working gear comes home, and the Wilds
// keep every tooth that matters. A citizen carrying the old chain into the
// dark is taking the same risk at prayer ninety-nine as at prayer one.
const PRAYER_KEEP = 70;
// AND AT NINETY-NINE, TWO. The same rule deeper rather than a new power: a
// mourner who has made their peace with dying packs accordingly. It is still
// only PRICED things, so the old chain, a dragonbow, a sigil and a chart are
// exactly as losable at ninety-nine as at one.
const PRAYER_KEEP_TWO = 99;
const BRAND_TICKS = 1500; // strike first in the Wilds, wear it 15 minutes
// the star-dagger's root (v0.49): rare and expensive by design, a 3-tick
// freeze on a 120-tick leash, and a 10-tick immunity after so no one is
// chain-frozen. Landing it is a decision, not a rhythm.
const ROOT_TICKS = 3, ROOT_IMMUNE = 10, ROOT_CD = 120;
// 6bf: TWENTY, LIKE EVERY OTHER ACT IN THIS WORLD.
//
// A cook was thirty and a deep fish ninety, so cooking a master's catch taught
// three times what cooking a beginner's did -- the tier-as-shortcut fault the
// gathering skills have just been cured of, alive in the skill that eats their
// output. It is flat now, at every rung.
//
// Which makes the pairing exact, and it is worth writing down because it was
// not designed, it fell out: gathering is an ACTION and cooking is an INPUT,
// so a fisher beside a fire does both in the same intervals for free. Over the
// 886 hours that take fishing to ninety-nine, a fisher who cooks everything
// they land arrives at about ninety-eight cooking. The two trades are one
// trade for anybody who wants them to be, and neither is a tax on the other.
const XP_COOK = 20;
// v0.73: the gullet has its own rhythm, as the arm does (§6b, lastSwing).
// Without one, a citizen ate every interval while the fight held, and broth
// heals 5 against a skeleton-knight's 2 hp per interval at absolute maximum:
// nobody carrying brews could die, so death, the Wilds and the brand were all
// decoration. Eating mid-fight stays legal, as §6m intends. It simply has a
// rate now, and that rate is what makes a beast dangerous to the unready.
// §6m-iii: THE GULLET RHYTHM IS REPEALED.
//
// It was written in v0.41 because nothing in this world could kill anybody,
// and a citizen with brews ate every interval and was immortal. That reason is
// long gone. What it was defended with afterwards -- that food would otherwise
// out-heal damage -- does not survive arithmetic: the old chain lands up to
// eleven EVERY interval, a maul special seventeen, the long shot thirty, and a
// fish heals six. Nothing about eating has ever made a citizen unkillable
// against anything that could really hurt them.
//
// What is left is the cost that actually bites, and it arrived tonight: a meal
// SPENDS THE ARM. Eat every interval if you like -- you will heal six and deal
// nothing, and anybody serious will kill you anyway or simply walk off. The
// brake is that eating is not fighting, which needs no constant at all.
//
// The value stays for old states, which carry `lastAte`, and for nothing else.
const EAT_EVERY = 8;
// §6m-v: A RICHER MEAL IS A LONGER ONE.
//
// A flat rhythm made the heal value a RATE, and the rate is what decides a
// fight. A deep broth restored one hitpoint an interval for ever -- against the
// 1.11 a star-sword lands through starmetal and the 0.62 a maul does -- so the
// citizen with the stack could not be killed. Measured 0:12, and the burst
// could not close it either: a finisher that removes half a health bar is no
// answer to somebody who never falls below three quarters.
//
// So the gullet asks in proportion to what it was given. Every food now
// restores the SAME half-hitpoint an interval over time, and the heal value
// buys something better than throughput: it buys the SIZE of one swallow, which
// is how a wounded citizen leaves an execute window in a single interval.
// A deep fish is still the best food in the world -- it lifts you ten in one
// breath, out of reach of any burst -- it simply cannot also be a wall.
//
// Below the weakest weapon in the world by a clear margin, so food lengthens a
// fight and never decides one.
// Tenths of an interval of gullet per hitpoint restored. At 25 every food
// sustains 0.40 a tick, comfortably under the 1.11 a star-sword lands through
// starmetal. Measured with both citizens fed and star-clad: at the old flat
// rhythm a pair with stacked broth STALLED -- sixteen fights of three thousand
// intervals, nobody ever fell. At 25 the same fight resolves in about two
// hundred and forty and is decided by the burst (11:5 for the citizen who uses
// it), which is the shape this world wants: food lengthens a fight, timing ends
// one.
// §6m-vi: A PACK RUNS OUT; A STACK DOES NOT.
//
// One rate for everything left food as decoration. Measured at 25: a survivor
// finished an old-chain duel holding 18 of 20 fish, having eaten THREE, while
// spending 78% of the fight wanting to eat and being refused. The pack was not
// a decision, and four fish played the same as twenty.
//
// Dropping the rate fixes that for fish and breaks it for brews, because a
// faster clock helps an ENDLESS source proportionally more: at 12 a stacked
// deep-broth went to 0:20, which is the v0.86 regression wearing a new hat.
//
// So they are clocked apart. Fish are bounded by the pack and may be eaten
// briskly; brews pool to a million in one slot and may not. Measured at 12/25:
// a long armoured fight runs a citizen dry a third of the time, a short one is
// still decided by damage, and an endless brew stays where it was at 4:16.
const EAT_PER_HEAL_FOOD = 12;    // bounded by twenty-eight slots
const EAT_PER_HEAL_BREW = 25;    // bounded by nothing
const eatRhythm = (item) => Math.max(EAT_EVERY,
  Math.ceil(healOf(item) * (STACKABLE.has(item) ? EAT_PER_HEAL_BREW : EAT_PER_HEAL_FOOD) / 10));
// the stilling (v0.80): magic's capstone. The stilled cannot act, and
// cannot be struck, a truce, enforced, cast to break off a fight and
// never to end one. Magic is the skill of refusing combat: anchor
// flees, mend endures, still denies.
const STILL_LEVEL = 85;
const STILL_SIGILS = 3;
const STILL_TICKS = 6;
// THE WAND: A SPELL THAT LANDS LATER AND HOLDS LONGER.
//
// A still cast bare takes hold at once and lasts six. With a wand it takes
// three intervals to arrive and then holds ten -- so you cannot panic-still,
// you have to cast BEFORE you need it, and you keep acting while it travels.
//
// That is the whole of it, and it is what a tick-based world is for: the
// interval is the unit of skill, so a spell that lands on a chosen future
// interval is a decision no other kind of world can offer. Three ticks is
// three deeds -- swing, step, swing -- and the freeze arrives on top of them.
//
// It costs one optional field on whoever it is travelling toward.
const STILL_WAND_DELAY = 3;
const STILL_WAND_TICKS = 10;      // both parties walk one tile per interval: six tiles of head start
const STILL_IMMUNE = 15;    // after it lifts: nobody is chain-stilled
const STILL_CD = 150;       // the caster's word needs time to regain its weight
const STILL_RANGE = 6;      // a spell of sight, not touch: it outranges the bow
// 6br: a beast swings on the same 2.4-second beat a citizen does unless its
// own stats say otherwise, and a blow turned aside teaches three times its weight.
// 6bt: MOB_EVERY IS TWO AGAIN, AND SO IS EVERY WEAPON.
//
// A previous revision doubled every cadence to make a swing 2.4 seconds, and
// took the combat experience cut half from that and half from teachMelee. The
// arithmetic worked and the design did not: EVERYTHING ELSE IN A FIGHT IS
// MEASURED IN TICKS AGAINST THAT BEAT, and none of it moved.
//
//   `rec` on every special (star-dagger 12, star-maul 8, horn-bow 13) --
//        recovery that cost four swings began costing two.
//   EAT_EVERY 8 and eatRhythm -- a gullet that opened once in four swings
//        opened once in two, and the note above EAT_PER_HEAL_BREW about a
//        fight running a citizen dry a third of the time stopped being true.
//   MEND_EVERY 25 -- twenty hitpoints every twelve swings became every six.
//   ROOT_TICKS 3 and STILL_TICKS 6 -- a hold measured in swings halved.
//
// Halving the beat doubled the strength of every special, every meal, every
// mend, and halved every hold. That is not a rebalance, it is a different
// game. The cut belongs entirely in what a wound TEACHES, which touches no
// timing at all -- so teachMelee carries all of it and the beat is left alone.
const MOB_EVERY = 2, DEFENCE_PER_MAXHIT = 3;
const MIN_MAX_HIT = 3;   // 6bu: the smallest blow anybody can be capable of
const STILL_XP = STILL_SIGILS * 20;   // 6bp: three sigils spent, twenty apiece -- and the branch READS this now
// 6be: SIX, WHICH IS WHAT THE LADDER ALWAYS SAID IT WAS.
//
// This was THREE, while the 6an note four lines below states the rungs as
// "ale four, broth five, a cooked fish six, a deep broth eight, a cooked deep
// fish ten -- with no gap wide enough to make the rungs beneath it pointless."
// At three a cooked fish was the WORST food in the world: under ale, and under
// the broth brewed from the very same raw fish. Cooking a fish destroyed value
// against brewing it, and the one rung the argument was written about was the
// pointless one.
const HEAL_FISH = 6;
// §6ad: THE DEEP FISH. Ten, against a broth's five -- but a fish does not
// STACK and a broth does, so a pack of broth is still the greater total and
// this is the greater single bite. Burst against volume, which is a choice
// rather than a replacement.
const HEAL_DEEP_FISH = 10;
// every edible thing and what it restores, in ONE place. Anything that heals
// can be eaten; anything that cannot be eaten heals nothing. Two lists that
// must agree are one list.
// anything a fire can turn into food, asked once
const HEAL_MID_FISH = 7; // 6be: SEVEN now that a cooked fish is six. At six the
                         // eel healed exactly what the shallow catch does, so the
                         // whole middle tier of fishing fed nobody anything new.
                         // The ladder is 4, 5, 6, 7, 8, 10 -- no rung a tie, none skippable.
const isRawFood = (item) => item === 'raw-fish' || item === 'deep-fish' || item === 'eel';
const healOf = (item) => item === 'cooked-fish' ? HEAL_FISH
  : item === 'cooked-eel' ? HEAL_MID_FISH
  : item === 'cooked-deep-fish' ? HEAL_DEEP_FISH
  : item === 'deep-broth' ? HEAL_DEEP_BROTH
  : item === 'broth' ? HEAL_BROTH
  : item === 'ale' ? HEAL_ALE : 0;
const COOK_DEEP_REQ = 78;       // 6be: a cook to match the fisher -- the same number the deep water asks
// 6bf: THE BURN CURVE, FLATTENED, AND A REASON TO COOK SOMEWHERE.
//
// It was `min(64 + 2*lvl, 240)`: a newcomer burnt SEVENTY-FOUR PER CENT of
// everything they touched. Not a cost -- a wall, and one paid in the fish
// somebody had to catch. At 150 + lvl a beginner wastes two in five and a
// master one in sixteen, so the master still plainly wastes less (which is the
// only reward this world gives for a level) without the first hour being an
// exercise in destroying food.
//
// AND A HEARTH IS BETTER THAN A CAMPFIRE. Cooking had no equipment and no
// geography: a fire scratched in a field did exactly what a town's hearth did.
// Sixteen is worth about six levels, so it is a reason to carry the catch home
// without being a reason you must.
const COOK_BASE = 150, COOK_CAP = 240, COOK_HEARTH_BONUS = 16;
const ARROWS_PER_BONE = 5, ARROWS_MASTER = 8, ARROW_MASTER = 80;
const SHOT_PER_ORE = 5;   // §6av
const GRAIN_PER_PLOT = 2, GRAIN_MASTER = 3, FARM_MASTER = 90;
// 6bl: HOW MANY ROWS A CITIZEN MAY HAVE IN THE GROUND AT ONCE.
//
// It was thirty-two, written as a bare number in the plant branch. It is the
// ONLY thing that sets farming's pace -- a row is two intervals of work and
// twelve minutes of waiting, so the rate is rows-in-the-ground over ripening
// time and nothing else. At thirty-two that was 1,629 hours to ninety-nine
// while every other trade sat near nine hundred, and the number was invisible.
const CROP_CAP = 48;
// 6bl: AND THE HARVEST RETURNS THE SEED, which is the change that makes
// farming a trade rather than a purchase.
//
// A row costs one seed and the only seed in the world is the seedsman's, at
// twenty-two gold. Two hundred and seventeen thousand rows stand between a
// farmer and ninety-nine, which is four MILLION gold -- sixty-six hours of
// every keeper's income in the world, spent by one person, on seed. Farming
// was not slow; it was unfundable, and no amount of experience would have
// fixed that.
//
// A farmer keeps seed back from the harvest. Everyone always has. The seedsman
// stays exactly what a stall is for -- somewhere to BEGIN -- and after the
// first row the ground pays for itself.
const SEED_FROM_HARVEST = 1;
// the two mastery yields that had no name of their own: heartwood from a tree
// and the deep fish from the shallows, both at ninety, and the two heartwood
// things a fletcher of ninety may make
// 6be: MASTER_YIELD IS GONE. It gated heartwood and the deep fish at one
// number, which is exactly how woodcutting's mastery and fishing's mastery
// came to be the same level for no reason anybody chose. NODE_GATE took both
// jobs; the constant survived, naming nothing, which is how a reader two
// months from now comes to believe the deep water asks for ninety.
const HEARTWOOD_FLETCH = 90;
const XP_COOK_DEEP = 20;   // 6bf: flat. A deep fish is worth more; it does not TEACH more.
const HEAL_BROTH = 5, HEAL_ALE = 4; // brewed restoration (v0.51)
// §6an: THE DEEP BROTH, and why it is eight rather than ten.
//
// A deep fish already brewed -- into ordinary broth, five, the same as any
// fish out of the shallows, so a master fisher's catch was worth no more in a
// pot than a beginner's. This is the same shape as woodcutting ninety giving
// heartwood where a lesser axe gives logs.
//
// EIGHT, and not ten, because the cooked deep fish must stay worth cooking:
// ten in one slot against eight that stacks is a real choice, and ten against
// ten is not. The ladder stays evenly spaced -- ale four, broth five, a cooked
// fish six, a deep broth eight, a cooked deep fish ten -- with no gap wide
// enough to make the rungs beneath it pointless.
//
// AND IT IS NOT DOUBLED. A brewer of ninety draws two draughts from a pot, and
// two eights would be sixteen against the cooked fish's ten, which would end
// cooking as a trade. A deep fish makes ONE draught; there is no second in it.
const HEAL_DEEP_BROTH = 8, DEEP_BROTH_BREW = 78;  // 6be: likewise, the brewer meets the fisher
// AND WHAT A MASTER BREWER GETS, which was nothing at all.
//
// Brewing was the one skill in the world whose levels bought NOTHING: no gate
// on raising a pot, none on brewing, none on collecting. It rose and the world
// never changed.
//
// Two draughts from a pot at ninety, which is the shape every other mastery
// here takes -- eight arrows from a bone instead of five, three sheaves from a
// row instead of two, heartwood from a tree instead of logs. Not a faster
// ferment: the world does the waiting, and a master should get MORE from the
// wait rather than a shorter one.
//
// It suits what brewing is FOR. A cooked fish is six healing and does not
// stack; ale is four and does, so a brewer's whole advantage is what a pack
// slot can carry. Doubling the pot doubles exactly that.
const BREW_MASTER = 90, DRAUGHTS_MASTER = 2, DRAUGHTS_PER_POT = 1;
// AND WHAT A MASTER SURVEYOR GETS.
//
// NOT the lifted cap. That was first written as a mastery and it was the wrong
// shape: the cap had simply gone stale when the world grew, so selling it back
// at ninety would have left every ordinary surveyor paying for an oversight.
// A bug is fixed for everybody; a mastery has to be something new.
//
// A surveyor of ninety brings back a CHART -- the way to a waystone they have
// not yet learned -- from any rumour, not only from the rare rumour that is
// about a waystone. It gives the one skill with no output an output, and one
// that is already tradeable: a chart is worth something to somebody who would
// rather not walk. Nothing is inflated; a master simply comes home with
// something in their hands.
const EXPLORE_MASTER = 90;
// 6bq: one more rumour for every this-many citizens awake, and a ceiling.
const SURVEY_PER_MARKER = 4, SURVEY_K_MAX = 256;
const HP_START_XP = 1154; // hitpoints level 10
// ---- weapons (v0.65): the metal is the tier, the shape is the choice ----
// No new materials. The same ore and star-stone, worked into different answers
// to the same question, so that how a citizen fights is something they chose
// rather than something the tier chose for them.
//   hit   added to the maximum blow
//   every ticks between swings (combat breathes; the chain does not)
//   reach how far the weapon touches (1 is arm's length)
//   acc   added to the odds of landing at all
// A dagger lands often for little; a maul lands seldom for a lot; a spear
// keeps its distance; a sword asks no questions. The chain is the chain.
// §6af: THE SPECIAL BLOW.
//
// Three of them, and each is ONE legible thing you could describe in a
// sentence — not a number tuned for a burst meta:
//
//   'flurry' star-dagger, horn-bow, handgonne -- several blows land in one
//            tick. Was 'twice' until it stopped being two, and the horn-bow
//            briefly had 'volley', which was the same mechanic under a second
//            name. One behaviour, one word.
//   'now'    star-maul -- gated on a SPENT arm, so it interrupts
//   'far'    dragonbow -- the blow grows with the range it crossed
//   'now'    star-maul    it swings whatever your arm says
//   'true'   horn-bow     the shot cannot miss
//
// THE COST IS THE ARM. A special spends the next cycle as well as this one,
// which is what makes it a decision rather than a button. And the arithmetic
// of that cost is the whole design: a special that hits twice and costs two
// cycles is EXACTLY damage-neutral over the exchange --
//
//     weapon        normal/tick   after a special
//     star-maul          3.00          3.00
//     star-sword         3.75          3.75
//
// -- so against four hundred and twenty points of dragon it buys nothing at
// all, and against a citizen at fifteen hitpoints it ends the fight, because
// they do not get a later. It needs no rule confining it to PvP: the cost
// confines it, and a mechanic that selects its own domain is worth more than
// an exception clause that says the same thing arbitrarily.
const WEAPONS = {
  'iron-dagger': { hit: 0, every: 2, reach: 1, acc: 14 },
  'iron-sword':  { hit: 2, every: 2, reach: 1, acc: 0 },
  'iron-spear':  { hit: 7, every: 2, reach: 2, acc: 0 },
  // §6au: A MAUL SWINGS AT THE SAME SPEED AS EVERYTHING ELSE.
  //
  // `every: 3` was flavour the arithmetic could not pay for. A blow is
  // 1 + level/10 + hit, and the level term is shared, so a slower weapon can
  // only buy back its lost interval through `hit` -- which is FLAT, and
  // therefore distorts low levels far more than high ones. At ninety-nine the
  // maul landed 3.62 a swing against a dagger's 3.83 and took half again as
  // long to do it: 1.21 a tick against 1.92. Measured over sixty duels with
  // neither citizen using a special, that is 5:55. Not situational -- broken.
  //
  // At `every: 2` with the same hit and the same poor accuracy it is 30:30
  // against the dagger, and it keeps every bit of its character: the largest
  // ordinary blow in the world at seventeen against the dagger's twelve, the
  // worst chance of landing it at forty per cent against fifty-nine, and the
  // only special that can drop on top of an ordinary swing. It is the swingy
  // weapon, not the slow one. The alternative -- `hit: 16` to make `every: 3`
  // pay -- was measured too, and it hands a level-forty citizen 1.69 a tick
  // where the honest build gets 1.22. A flat number is a low-level number.
  'iron-maul':   { hit: 10, every: 2, reach: 1, acc: -12 },
  // §6am (v6): the mid weapons, one notch of `hit` above bronze and one below
  // star, no special -- the special is a starmetal thing, earned with the
  // metal. A citizen who has reached the middle swings a touch harder than a
  // beginner and a touch softer than a master, which is exactly the middle.
  'steel-dagger':    { hit: 1, every: 2, reach: 1, acc: 14 },
  'steel-sword':     { hit: 3, every: 2, reach: 1, acc: 0 },
  'steel-spear':     { hit: 8, every: 2, reach: 2, acc: 0 },
  'star-dagger':   { spec: 'flurry', blows: 6, rec: 12, hit: 2, every: 2, reach: 1, acc: 14 },
  'star-sword':    { hit: 4, every: 2, reach: 1, acc: 0 },
  'star-spear':    { hit: 9, every: 2, reach: 2, acc: 0 },
  'star-maul':     { spec: 'now', blows: 2, bite: 2, rec: 8, hit: 13, every: 2, reach: 1, acc: -12 },
  // 6bz: THE CHAIN KEEPS ITS OLD BLOW. Two-handed arms gained six to pay for
  // the shield, but a weapon that swings EVERY interval banks that six twice
  // as often as anything else: at hit 7 it killed a shielded swordsman in 46
  // intervals against their 87. It is two-handed -- no shield beside it -- and
  // that, with its rarity, is the whole of what it pays for being fast.
  'old-chain':     { hit: 1, every: 1, reach: 1, acc: 0 },
  // A WAND IS A BAD WEAPON ON PURPOSE. Magic is the anti-combat skill, so the
  // fullest expression of it is a thing you hold INSTEAD of a weapon: you have
  // given up fighting to be better at not fighting.
  'wand':          { hit: 0, every: 3, reach: 1, acc: -20 },
  // THE FLAIL (spec 6x): it goes ROUND the armour, not through it.
  //
  // Armour turns aside one point a piece, two for starmetal, and in a fight
  // between citizens that subtraction can floor a blow at nothing: a full
  // suit of star soaks four, and a sword that rolls low does literally no
  // harm. Which is correct, and it left the Wilds with one answer to a
  // star-clad citizen -- hit them more times than their armour can absorb.
  //
  // A flail has a head on a chain. It does not meet the plate square, it
  // comes round the edge of it, and `pierces` says so: SOAK does not apply.
  // The price is that it is a poor weapon against anything unarmoured, which
  // is most of the world -- its base damage is the lowest of any steel.
  //
  // So it is not an upgrade, it is an ANSWER, and only to one thing.
  'star-flail':    { hit: 9, every: 2, reach: 1, acc: -6, pierces: true },
  // THE CROSSBOW (spec 6x): the maul of the ranged line.
  //
  // Ranged had one feel repeated three times -- wooden, horn and dragon all
  // loose every two ticks and differ only in how far and how hard. Melee has
  // four feels: a dagger lands often for little, a maul seldom for a lot, a
  // spear keeps its distance, a sword asks no questions. Ranged deserved the
  // same choice.
  //
  // A crossbow is slow to crank and it does not miss: every three ticks,
  // heavy, and the most accurate thing in the world. It reaches less far
  // than a horn-bow, because a bow's arc is a bow's arc.
  'crossbow':      { hit: 11, every: 3, reach: 4, acc: 21, ranged: true },
  // THE SIGIL-BOW (spec 6y): the bow that does not eat.
  //
  // Arrows are the whole cost of shooting -- one per draw, hit or miss -- and
  // running out ends the action where you stand. That is ranged's only real
  // price, and every bow so far paid it identically. This one pays HALF.
  //
  // Which makes it the third feel in the line rather than a fourth set of
  // numbers: a horn-bow is balanced, a crossbow is slow and heavy, and this
  // is the one you carry when you are going somewhere you cannot restock. In
  // the Wilds that is the difference between a trip and a raid.
  //
  // Its damage sits between horn and dragon, and deliberately no higher: it
  // buys ENDURANCE, not force.
  // Identical to the horn-bow it was made from -- hit, speed, reach, accuracy
  // all the same -- and it spends half the arrows. Imbuing does not make a bow
  // hit harder; it makes it thrifty. The first numbers here were hit 3, reach
  // 6, acc +8, which made it strictly better than the bow it consumed: more
  // damage, further, more accurate AND cheaper to feed. That is not a choice,
  // it is just the next tier, and the ranged line already had three of those.
  'sigil-bow':     { hit: 8, every: 2, reach: 5, acc: 0, ranged: true, thrift: true },
  // §6ad: THE HEARTWOOD BOW, and the only good bow anybody can MAKE.
  //
  // Every other is found, imbued, forged or unique -- fletching topped out at
  // a beginner's stick. This one is crafted, and it is not a tier above the
  // horn-bow but a choice against it: MORE damage, LESS reach than any bow in
  // the world. Three puts you inside a goblin's senses and a troll's, so you
  // cannot stand beyond their perception and shoot freely. You trade the kite
  // for the damage. The archer's weapon for somebody who means to be in it.
  'heartwood-bow': { hit: 10, every: 2, reach: 3, acc: 3, ranged: true },
  'wooden-bow':    { hit: 6, every: 2, reach: 4, acc: 0, ranged: true },
  'horn-bow':      { spec: 'flurry', blows: 6, rec: 13, hit: 8, every: 2, reach: 5, acc: 0, ranged: true },
  // THE DRAGONBOW (spec 6w). There is one, and there will only ever be one.
  // Reach 9 is the whole weapon: nothing else in the world touches past five,
  // so whoever draws it fights at a distance where almost nothing can answer.
  // Against a citizen in the Wilds that is not a duel, it is a decision made
  // before they knew it started.
  // §6w: THE LONG SHOT. The dragonbow reaches nine, further than anything
  // else in the world by four tiles, and had no special at all -- so its one
  // distinction was a number in a table.
  //
  // It is not another 'flurry'. This world already has three specials and they
  // are three different KINDS: two blows, off the rhythm, cannot miss. A
  // fourth should be a fourth kind, and the obvious one for this weapon is the
  // thing it alone can do.
  //
  // 'far' scales the blow with the distance it crossed. At arm's length it is
  // feeble -- worse than a dagger -- and at nine tiles it is the hardest blow
  // in the world. The bow's reach stops being a number and becomes the skill:
  // the shot you should not have been able to make is the one that kills.
  // §6av: THE HANDGONNE. Slow, short, wildly inaccurate, and it hits like
  // nothing else in the world -- a maximum blow of thirty-nine where the next
  // largest is fifteen. Measured at 1.54 a tick it sits mid-table among the
  // bows (heartwood 1.78, crossbow 1.57, sigil 1.51), and it loses to the two
  // best weapons in the game: 9:31 against an old-chain, 11:29 against a
  // dragonbow. Its `twice` is both barrels -- neutral like every other special,
  // with a ceiling near eighty on the roughly one load in nine where both land.
  //
  // Four prototypes went into this and three were cleverer. A wind-up that
  // could be walked away from landed nothing in sixty fights; a wind that
  // survived walking killed a fleeing citizen thirty-three times in sixty and
  // repealed §2b-i doing it. The mechanism was never the interesting part. It
  // was `hit: 30`.
  'handgonne':     { spec: 'flurry', blows: 2, rec: 8, hit: 36, every: 4, reach: 4,
                     acc: -20, ranged: true, powder: true },
  'dragonbow':     { spec: 'far', blows: 1, rec: 4, hit: 12, every: 2, reach: 9, acc: 6, ranged: true },
};
const weaponOf = (p) => WEAPONS[p?.equipment?.weapon?.item] ?? null;
const reachOf = (p) => weaponOf(p)?.reach ?? 1;
// §6as-iv: STYLE SHAPES THE BLOW, NOT ITS SIZE.
//
// A symmetric inset on the damage range: the MEAN is untouched, so no style is
// stronger and none is a trap, and the SPREAD moves, so they are differently
// USEFUL. Measured on a star-sword: aim lands for 4-11 with a spread of 2.3,
// force for 1-14 with 4.1, and damage per swing is 3.74 against 3.61 -- the
// same, within noise.
//
// It deliberately does NOT trade against the accuracy roll, which was the first
// attempt: accuracy is clamped at 250/256, so against a low-defence target
// extra accuracy buys nothing while lost damage costs everything. Measured,
// that version had force beating even by 25% against defence 1 and losing to
// it against plate. A trade against a ceiling is lopsided at one end and dead
// at the other.
//
// Variance only survives where there are few rolls to average it, so this is a
// dial for BURSTS, not for attrition -- see §6af-v.
const styleInset = (M, st) => {
  const i = st === 'aim' ? Math.floor(M / 4) : st === 'force' ? 0 : Math.floor(M / 8);
  return (M - 2 * i) >= 2 ? i : 0;
};
const styleRoll = (r, M, st) => { const i = styleInset(M, st); return (1 + i) + (r % (M - 2 * i)); };
const isRanged = (p) => weaponOf(p)?.ranged === true;
// §6av: a gonne draws powder and shot, not arrows. Asked ONCE, for the reason
// `isLog` is asked once: four places spend ammunition by name, and the one you
// miss is a weapon that fires for free.
const ammoOf = (p) => weaponOf(p)?.powder ? 'shot' : 'arrows';
// §6av: A GONNE IS LOUD, AND THE WILDS ARE LISTENING.
//
// The shot is paid for in the world rather than in the arithmetic: every beast
// within earshot is maddened at whoever fired, and comes. It needs no new
// concept -- `mad` has meant "this beast wants THIS citizen" since the siren --
// and it prices the weapon where it is USED rather than where it is bought. It
// also pushes a gonne toward open ground and away from the wooded places worth
// ambushing somebody in, so the ambush is answered without a rule about ambush.
const GUN_NOISE = 8;
// §6av: AND IT BURSTS, one shot in twenty-four, COUNTED.
//
// The first version rolled the tick's beacon, which breaks the Reading Rule
// (v0.39) as squarely as anything in this engine ever has. Firing is an INSTANT
// DEED a citizen chooses the moment of, the beacon for tick T is public during
// T, and `every: 4` leaves three intervals of slack -- so a gonneman reads the
// lot, sees that this interval would burst the barrel, and waits one. The gonne
// would have been permanent, and the whole reason it exists -- a smithing
// capstone with demand that does not end -- would have gone with it.
//
// So it is counted, exactly as cooking, firemaking and loot are: a per-citizen
// tally that grants the burst at the constitutional rate in a fixed order no
// timing can bend. Same rate, no dice, nothing to read ahead.
const BURST_ONE_IN = 24;
function gunshotHeard(s, pid, p) {
  for (const m of Object.values(s.mobs)) {
    if (m.hp <= 0) continue;
    if (Math.max(Math.abs(m.x - p.x), Math.abs(m.y - p.y)) <= GUN_NOISE) m.mad = pid;
  }
}
function gonneFired(s, beacon, pid, p) {
  if (!weaponOf(p)?.powder) return;
  gunshotHeard(s, pid, p);
  p.shotsFired = (p.shotsFired ?? 0) + 1;
  if (countedSuccess(p.shotsFired, Math.round(DROP_DEN / BURST_ONE_IN), DROP_DEN))
    p.equipment.weapon = null;   // §6av: the barrel is finished
}
// a ranged weapon is drawn only at distance; in your face it is a club
const drawnAt = (p, t) => isRanged(p) && !adjacent(p, t);
const inReach = (p, t) => {
  // melee geometry (v0.79): movement is cardinal, so a reach-1 weapon
  // strikes only along lines you can step, the four faced tiles, the
  // same law §5 gives the axe and the pick. A long haft (reach 2+) may
  // thrust past a corner. NOTHING strikes the tile it stands on: two
  // bodies in one square is not a fight, it is an accident.
  const r = reachOf(p);
  const cheb = Math.max(Math.abs(p.x - t.x), Math.abs(p.y - t.y));
  if (cheb < 1) return false;
  if (r <= 1) return Math.abs(p.x - t.x) + Math.abs(p.y - t.y) === 1;
  return cheb <= r;
};

// 6by: WHAT THE WORLD CAN STILL DO TO A MASTER.
//
// Mob attack was written when twelve was a large number and never grew with
// the ceiling a citizen can reach. A defender's chance of being hit is
// hitChance256(mob.atk, defence, 0, armour), and against attack values in the
// single digits a citizen in star plate reaches the 8/256 FLOOR by about level
// fifty. Everything after that -- thirty more levels, better armour, any
// shield anybody ever forges -- buys precisely nothing in the field.
//
// So the Gibbet King, a two-hundred-hitpoint boss on a ninety-minute respawn
// guarding the only king-shroud in the world, dealt 0.027 damage an interval.
// It needed SIXTY-ONE MINUTES to kill anybody, and could not have killed a
// citizen who walked away to make tea. The great-spider was little better at
// six minutes. Only the dragon, at attack 115, was ever a fight -- it kills a
// master in seventy-eight intervals, and it is the number the rest are now
// measured against.
//
// The ordinary beasts are LEFT ALONE deliberately. Goblins, wolves, bears,
// trolls and skeleton-knights are a RESOURCE -- bones, ore, hides, a road to
// prayer -- and a resource that can kill you is a tax on gathering, not a
// fight. What changed is the four things that were supposed to be dangerous
// and were not: the King, the spider, the risen the King calls up, and an
// incursion. They now kill a master in two to seven minutes, which is long
// enough to eat, mend or run, and short enough to mean it.
//
// This is also why defence keeps mattering past fifty, and why a shield would
// be worth carrying: there is finally something in the world whose blows land.
const MOB_STATS = {
  // §6aa: `aggro` is how many tiles away a beast will notice you and come.
  // A goblin sees three -- close enough to matter on a road, far enough short
  // of the eighteen a citizen can see that nothing charges out of the dark.
  goblin: { maxHp: 5, atk: 1, def: 1, maxHit: 1, respawn: 16, aggro: 3,
            drops: [{ item: 'bones' }, { item: 'ore', chance: 16384 }, { item: 'seeds', chance: 16384 },
                    { item: 'forage', chance: 20480 }] },
  wolf:   { maxHp: 8, atk: 2, def: 2, maxHit: 2, respawn: 150, aggro: 5,   // a wolf hunts
            drops: [{ item: 'bones' }, { item: 'bones', chance: 24576 }, { item: 'forage', chance: 16384 }] },
  // v0.75: the old-chain falls at 2/65536, one troll in 32,768, which is some
  // nine days of an executor farming trolls without pause. It is the only item
  // in the world with no price at any store, so it can never be sold to a
  // keeper and only ever passes between citizens. The best weapon here is the
  // one thing gold cannot be turned into except by asking someone who has one.
  troll:  { maxHp: 20, atk: 4, def: 4, maxHit: 3, respawn: 300, aggro: 4,
            drops: [{ item: 'bones' }, { item: 'ore' }, { item: 'iron-plate', chance: 6144 },
                    { item: 'old-chain', chance: 2 }] },
  bear:   { maxHp: 14, atk: 3, def: 3, maxHit: 2, respawn: 220, aggro: 3,  // territorial, not a hunter
            drops: [{ item: 'bones' }, { item: 'bones', chance: 32768 }, { item: 'iron-hatchet', chance: 4096 },
                    { item: 'horn-bow', chance: 66 }, { item: 'forage', chance: 22938 }] },
  // the skeleton-knight (v0.42): a horned, shield-bearing warrior of the frontier.
  // Seldom alone, they muster in warbands in and around the Wilds. The round
  // shield makes them hard to strike (high def); the longsword bites back. And
  // their bones are rich: a fallen knight gives up twice what a lesser thing does.
  // THE SHORE-CRAB (spec 6z). Eastmere had NOTHING living within forty-five
  // tiles of it -- the emptiest named place on the island, and a port, which
  // is where people actually arrive.
  //
  // A crab rather than anything more exotic because Eastmere is a cold
  // harbour on downland, and the animal should belong to the place rather
  // than be imported into it. What it is FOR is training: a great deal of
  // shell and very little malice. It hits for two and it takes a long time
  // to open, which is the shape of a good hour's work and a poor threat.
  //
  // It gives up its shell, and a shell is worth something to a smith.
  // §6z: THE SHORE-CRAB CANNOT HURT ANYBODY.
  //
  // The world got dangerous, so one thing in it should not be. A crab has a
  // great deal of shell, a slow temper and claws that cannot find a way past
  // a citizen's guard -- it swings, and it never lands. Which makes Eastmere
  // the place you go to learn to fight without gambling an hour's gathering
  // on it, and gives the emptiest named port a reason to exist.
  //
  // It KEEPS its aggro, so they come to you and you can gather three at once.
  //
  // And it gives NO DEFENCE, which is the same rule that governs the archer:
  // defence is paid for in risk and only in risk. Something that cannot hurt
  // you cannot teach you to be hurt. Attack and hitpoints, honestly earned;
  // defence, not at all.
  'shore-crab': { maxHp: 90, atk: 8, def: 14, maxHit: 2, every: 3, respawn: 90, aggro: 4, harmless: true,
                  drops: [{ item: 'crab-shell' }, { item: 'raw-fish', chance: 8192 }] },
  // THE SHEEP (spec 6ag). The Downs is downland: twenty-two thousand tiles
  // of it, twenty-eight living things on it, and a locale in the middle
  // called the Sheepfolds. The map has been promising sheep since the fourth
  // founding and the world never delivered any.
  //
  // NO `aggro` AT ALL, which is the difference between this and the crab. A
  // crab keeps its aggro on purpose -- it walks at you so you can gather
  // three at once. A sheep that walked at you would not be a sheep. With no
  // aggro it never starts anything, and `harmless` means that if you start
  // it, it swings and never lands and teaches no defence for it.
  //
  // The hitpoints are the whole balance and they are not decoration. Safe
  // country plus a quick kill is a training dummy, and this world's position
  // is that standing is paid for in time: a five-hitpoint sheep in the
  // safest country on the island would be the cheapest attack experience in
  // the world. Forty, at defence eight, makes a sheep about a minute's work
  // -- livestock, not a dummy -- which is the same reason the crab is ninety.
  sheep: { maxHp: 40, atk: 2, def: 8, maxHit: 1, every: 4, respawn: 120, harmless: true,
           drops: [{ item: 'wool' }, { item: 'wool', chance: 16384 }] },
  // THE SIREN (spec 6ac). The third thing, and the only one that FORBIDS a
  // party. The dragon needs one because you die alone; the spider needs one
  // because the arithmetic does not close; she will not have one at all.
  //
  // She MIRRORS whoever engages her -- their combat levels, their weapon, and
  // their quiver as it stood at the moment she took their shape. So the fight
  // is exactly even, at any level, forever: it never trivialises and it never
  // gates. What breaks the tie is the one thing she cannot copy, which is
  // that you brought food and she did not.
  //
  // `maxHp` and `atk` here are only a floor for an unarmed opponent; almost
  // everything about her is read from the citizen at `bound` time.
  //
  // `aggro` is what a beast can PERCEIVE, and she needs one or she perceives
  // nothing: senses default to zero, `d <= 0` is never true at any distance,
  // and she stood on her strand and never once swung back. Ten, because she
  // is looking out to sea and sees you coming a long way off -- and because a
  // mirrored archer must be answerable at their own reach, which can be nine.
  'siren': { maxHp: 60, atk: 20, def: 20, maxHit: 6, every: 2, respawn: 1200,
             aggro: 10, mirrors: true },
  // THE SPIDER (spec 6ab). The second thing that cannot be done alone, and
  // it cannot be done alone for a different reason than the dragon.
  //
  // The dragon asks CAN YOU SURVIVE. This asks ARE THERE ENOUGH OF YOU, and
  // it asks with arithmetic rather than with danger: the web it sits in mends
  // it faster than one citizen can cut. No level, no gear and no patience
  // substitutes for another person. The dragon can in principle be soloed by
  // somebody good enough with enough broth. This cannot be soloed by anybody,
  // ever, which is a stronger thing for a world to say.
  //
  // `mends` is hitpoints the web returns each tick while the spider lives.
  // Measured, one maxed citizen in star gear puts out: chain 5.74, sword
  // 3.40, dragonbow 3.70, maul 2.98, horn-bow 2.75, crossbow 2.31. At SIX a
  // lone citizen cannot win with anything, two struggle, three manage.
  //
  // It is not very dangerous and that is deliberate. Somebody must hold it,
  // but the fight is a sum, not a gauntlet.
  'great-spider': { maxHp: 300, atk: 48, def: 18, maxHit: 18, every: 3,
                    respawn: 36000, aggro: 6, mends: 6 },
  // THE DRAGON (spec 6w). One of them. Not a kind of thing that spawns in the
  // Wilds -- a thing that is there, like the Barrow and the Ring.
  //
  // It strikes EVERY tick for eight rather than rarely for a great deal,
  // because that is what defeats mend: a sigil-stacker heals twenty in a
  // burst and food gives 0.625 a tick, so sustained pressure beats them and
  // a big slow swing does not. One citizen cannot outlast it. Several can,
  // and several in the Wilds is its own problem.
  //
  // It can only be struck FROM A TILE BESIDE IT. Scales turn arrows, and a
  // spear thrust from two tiles finds nothing either. Which means the bow
  // made from the dragon cannot kill the dragon, and whoever wants it must
  // come with steel and company and stand where it can reach them.
  // atk 115 is the whole design. Every other beast here is atk 1-5, and the
  // accuracy rule is Tm = clamp(128 + 4*(atk - defence), 16, 240): against a
  // citizen at defence 99 an atk-5 wolf is clamped to sixteen in two hundred
  // and fifty-six -- it lands one blow in sixteen and a star-clad citizen is
  // immortal. That is not an oversight, it is what a world where combat is
  // not the point looks like.
  //
  // The dragon is the exception, and it is an exception on the CITIZEN'S
  // scale: at 115 it out-reaches maxed defence and lands three swings in
  // four. Measured against maxed citizens in full star gear with broth:
  //
  //     one citizen  : dies, every time
  //     two          : win, and it is a real fight
  //     four         : win comfortably
  //
  // Which is the thing asked for: you cannot do this alone, and the people
  // you bring are in the Wilds with you.
  // §6w: IT BREATHES BEFORE YOU ARRIVE.
  //
  // It could only be struck from a tile beside it and it was PASSIVE, so the
  // fight began when somebody walked up to the largest creature in the world
  // and hit it, and it did nothing until then. That is not a dragon, it is a
  // rock with four hundred and twenty hitpoints.
  //
  // Now the approach costs. It notices at nine tiles and breathes from six,
  // so a party arrives already hurt and somebody has to survive the walk --
  // which is what 'come with company' should mean, rather than a threshold in
  // a stat table. Fire goes ROUND armour the way a flail does: no soak. And
  // it still cannot be answered from out there, because the scales turn
  // arrows -- you may only cross the fire, never trade with it.
  // `every: 1` was chosen when retaliation only fired while a citizen was
  // ACTING on it -- so it meant "every tick of the fight". Now a beast acts
  // on its own and it means every tick, full stop, which is twice the old
  // rate and why a pair could not finish it: they spent the fight eating.
  // Two was not enough either, and the reason is worth writing down: the
  // binding constraint is not damage. A pair lost identically at maxHit 28,
  // 22 and 18. It is TIME -- one citizen tanks while the other swings, and a
  // lone swinger cannot take 420 points down before the tank runs out of
  // broth. The lever is how OFTEN it strikes.
  //
  // Four. Big slow blows, which is what a dragon should throw, and it lines
  // up with a breath that comes every five. Measured, walking in from ten
  // tiles in full star with sixteen broth: one falls, two win at 113 ticks
  // -- sixty-eight seconds, and hard -- three win at 64.
  dragon: { maxHp: 420, atk: 115, def: 24, maxHit: 28, every: 4, meleeOnly: true,
            aggro: 9, breath: 5, breathHit: 14, breathEvery: 5,
            // TWELVE HOURS, because the bow now lives exactly as long as the
            // dragon is dead. At six it changed hands fourteen hundred times a
            // year, which is a great deal of turnover for a thing whose rule
            // is that there is one. At twelve a tenure is long enough to plan
            // something with and short enough that two citizens a day get the
            // chance -- and the clock runs from the KILL, not a fixed hour, so
            // tenures drift across the day by themselves and no timezone ends
            // up owning the dragon.
            respawn: 72000,
            // §6ai: WHAT A DRAGON IS WORTH TO THE PEOPLE WHO KILLED IT.
            //
            // Four hundred and twenty hitpoints, twenty-eight a blow, and it
            // dropped two bones and an ore -- less than a skeleton knight. It
            // is not a fight one citizen wins, and everything it gave was a
            // bow that ONE of them could carry and that goes home in twelve
            // hours. There was nothing for the others to divide.
            //
            // Six magic-stone and a set of dragon-bones. The stones are the
            // Wilds' own currency, so a party splits something every trade in
            // the world wants; the bones are the only ones worth more than a
            // goblin's, which gives the longest road in the world -- prayer,
            // fourteen hundred hours -- a reason to come here.
            drops: [{ item: 'bones' }, { item: 'bones' },
                    // three sets, so a party has something to DIVIDE. One set
                    // among four citizens is an argument, not a reward.
                    { item: 'dragon-bones' }, { item: 'dragon-bones' }, { item: 'dragon-bones' },
                    { item: 'magic-stone' }, { item: 'magic-stone' }, { item: 'magic-stone' },
                    { item: 'magic-stone' }, { item: 'magic-stone' }, { item: 'magic-stone' },
                    { item: 'ore' }] },
  'skeleton-knight': { maxHp: 18, atk: 5, def: 6, maxHit: 4, respawn: 120, aggro: 5,   // the Wilds is dangerous in itself now
            drops: [{ item: 'bones' }, { item: 'bones' },   // double bones, the warrior's due
                    { item: 'ore', chance: 12288 },            // scavenged metal
                    { item: 'star-helm', chance: 328 }] },    // rare: the horned helm itself
  // §6ao (v6): THE INCURSION. A thing that walks out of the dark, fixes on ONE
  // citizen, and takes a while to put down -- long enough that the neighbours
  // notice and come, which is the whole point. It hits SOFTLY (maxHit stays
  // low even scaled) so that anyone may safely turn and help; the danger was
  // never the point, the gathering is. High HP so the fight LASTS; a leash so
  // it can be led toward help or lost; and it despawns on a timer so an
  // unanswered one is a story ("it came, none came, it left") and never a
  // permanent fixture. Its maxHp and def are SCALED to the target at spawn by
  // the event step; these are the floor a level-one target would face.
  'incursion': { maxHp: 120, atk: 30, def: 8, maxHit: 8, respawn: 0, aggro: 6,
            drops: [{ item: 'bones' }] },
  // §6ao (v6): THE RISEN, and THE GIBBET KING. The Moor was dead space -- goblins
  // and wolves already found in three other countries, and nothing of its own.
  // Now it is his: the bleak crossing to the master fishing, where the dead walk
  // because someone raises them. The RISEN are what he calls up -- weak alone,
  // dangerous as a wave, and they exist ONLY while he does. They are not placed;
  // he makes them (see the mob step), aggro'd at whoever came, so a citizen
  // fights THROUGH them to reach him. When he falls or the citizen leaves, the
  // risen he called crumble back into the moor.
  'risen': { maxHp: 12, atk: 22, def: 3, maxHit: 5, respawn: 0, aggro: 6, summoned: true,
             drops: [{ item: 'bones' }] },
  // THE GIBBET KING (spec 6ao). One of him, like the dragon -- a thing that IS
  // in the Moor, not a kind that spawns. He does not chase and he barely strikes;
  // his threat is the dead he raises and sends. To kill him you must cut through
  // the wave faster than he renews it (capped, so it is a hard solo, not a wall).
  // He is stationary at his gibbet. Defeating him quiets the Moor until he rises
  // again. His drop is worth the crossing: the shroud, a rare ranged-magic piece,
  // and always the bones of a king.
  'gibbet-king': { maxHp: 200, atk: 55, def: 16, maxHit: 22, every: 4, respawn: 9000,
             aggro: 8, raises: true, raiseEvery: 5, raiseCap: 4, meleeOnly: true,
             drops: [{ item: 'bones' }, { item: 'bones' }, { item: 'magic-stone', chance: 8192 },
                     { item: 'king-shroud', chance: 400 }] },
};
// the store's ledger (spec 6l)
// §6v: mend heals twenty in a burst, which is four cooked deep fish and the
// single largest restoration in the world. At magic 20 it arrived before most
// of what it saves you from. Fifty, alongside the starmetal it is worn with.
// 6bo: WHAT SPENDING A SIGIL TEACHES, and why it is one lesson and not three.
//
// A sigil is three magic-stone, and pressing it already paid for all three
// (invoke, sixty). Casting it is a second act on ONE object, so it pays for
// one -- otherwise the same three stones would teach twice over, and the
// chain would out-earn mining the stones in the first place.
//
// Mend, mendp and anchor were 55, 55 and 35 for no stated reason. They spend
// the same sigil; they teach the same thing.
const XP_SPEND_SIGIL = 20;
const MEND_REQ = 50;
// §6ao: A MENDING HAS A RHYTHM.
//
// It healed twenty, cost a sigil, and had no rate at all -- one cast an
// interval, for as many sigils as the pack held. Twenty-seven sigils is five
// hundred and forty extra hitpoints; measured against the best weapon in the
// world, survival went from thirty intervals to a hundred and eighty-four.
//
// A mender cannot WIN, because casting spends the arm. But two prepared
// citizens could not resolve a fight at all, and that -- rather than any
// damage number -- was the binding constraint on the top of this world.
//
// Twenty-five intervals: fifteen seconds. Slower than the gullet ever was,
// because a mending is four times a fish and made of three magic-stone out of
// the Wilds. It is the emergency, not the diet.
const MEND_EVERY = 25;
const MENDP_RANGE = 4;
// §6aj: UNMAKING AT RANGE, which is denial and not theft.
//
// A citizen falls and their pack spills; the one who felled them walks over to
// take it. Five tiles away, an alchemist with a heartwood stave burns a sigil
// and the pile is simply GONE -- the plate, the sword, the stones. Nobody gets
// them. The caster least of all: no coin comes of it, because the thing was
// unmade rather than sold, and unmaking somebody else's spoil should never be
// a living.
//
// A sigil is three magic-stone out of the Wilds, sixty gold of materials that
// no keeper will sell, against the seven gold a beginner's goblin drops. It
// costs nine times what it would deny them, so it cannot be used to torment
// newcomers -- and against a star-plate on the ground it is very much worth
// doing, which is the fight where it belongs.
//
// The stave is the instrument because the stave is what alchemy is done with,
// and it is already the rarest thing a fletcher makes.
const UNMAKE_RANGE = 5;      // near enough to see who you are helping

// ---------------------------------------------------------------------------
// ALCHEMY
// ---------------------------------------------------------------------------
// Magic in this world has been entirely REACTIVE: anchor, mend, still --
// escape, heal, freeze. Three spells that all belong to a moment of danger,
// and nothing a citizen would ever cast on an ordinary afternoon. Alchemy is
// the first magic that belongs to the working day, and it puts the skill into
// the ECONOMY rather than into a fight, which is where it does more good: the
// economy is the part of this world that will still be interesting in ten
// years.
//
// IT PAYS LESS THAN A STORE, and this is the whole of the design.
//
// In the game this borrows from, alchemy beat the shops, and so it displaced
// them. Here it pays three quarters, floor of one coin, and a store is always
// the better price. What a citizen buys with that quarter is not having to
// walk -- and since the walk is most of what this world IS, alchemy that beat
// the store would make every road on the island pointless.
//
// It is also SAFE for the economy in a way a better rate would not be. The
// store's spread is this world's only gold sink; alchemy is a gold source. At
// three quarters, every coin alchemy mints is a coin the store would have
// minted anyway and a quarter besides, so the source can never outrun the
// sink. A world meant to run for decades cannot be given an unbounded one.
// NO GATE, AND THE REASON MATTERS.
//
// This was thirty, copied from the game it borrows from without checking that
// anything in THIS world could get a citizen there. Measured: every other
// source of magic experience -- pressing a sigil, still, mend, anchor --
// needs magic-stone, and magic-stone exists only in the Wilds, seventy-four
// to a hundred and sixty-four tiles out among trolls and skeleton-knights.
// Reaching magic 30 by the only route open below 30 costs 669 magic-stone.
//
// So magic had no beginning. A citizen could not cast their first spell until
// they had survived the most dangerous country in the world several hundred
// times over, which is not a gate, it is a wall.
//
// Alchemy is now where magic STARTS: open to anyone, on the first log they
// pick up, and the way the skill is trained. The sigil spells stay where they
// are -- anchor, mend and still are what magic becomes, and they are worth
// walking to the Wilds for. This is the working-day half.
const ALCH_REQ = 1;
// TWENTY-FIVE, which is what a log is worth to a woodcutter.
//
// Twelve was a number I liked the sound of, and measured against the rest of
// the world it was half of everything: 1,086,203 casts to ninety-nine, where
// chopping is 521,378 and mining is 372,413. Alchemy would have been the
// slowest skill on the island by a factor of two, for no reason anyone chose.
//
// At twenty-five it sits exactly where woodcutting and burying do. An hour of
// alching is worth an hour of chopping, which is the only defensible answer
// when there is nothing about the act that says it should be worth more.
// 6bo: TWENTY, whatever the item -- and the flatness was already right.
//
// The note below this line is the best argument in the file and it is kept
// whole: experience that followed an item's PRICE would make the efficient way
// to learn magic "acquire and destroy the most valuable thing in the world",
// which is a fighter's road, and magic here is the anti-combat trade. What
// changes is only the number, from twenty-five to the twenty every other act
// in this world pays: one thing unmade, one lesson.
//
// The economic question the note wants a citizen to ask now genuinely exists,
// because ALCH_PAYS moved from four to twenty (6bn) -- a log transmutes for a
// coin and a magic-stone for nineteen, while both teach the same twenty. What
// is worth burning and what is worth learning from are finally two questions.
const XP_ALCH = 20;             // per cast, whatever the item
// A CADENCE, NOT A KEYPRESS.
//
// One cast per interval is as fast as a citizen can submit anything, so
// alchemy ran at the absolute speed limit of the world -- and a rite that
// unmakes a thing into gold should not be the fastest act available. Three
// intervals: a second and three quarters, room for a real gesture, and it
// triples the road to ninety-nine without touching the experience.
//
// This costs a field, which is not free and was refused for the well because
// geography already priced that one. Nothing prices this: alchemy works
// anywhere, needs nothing, and sets an experience rate directly. `lastAlch`
// is the same shape as `lastAte`, which has guarded the gullet since v0.41.
// A STAFF IS A TOOL, AND MAGIC WAS THE TRADE WITHOUT ONE.
//
// Woodcutting has a hatchet, mining a pickaxe, and alchemy -- the working-day
// half of magic -- had nothing in the hand. A staff is not a decoration
// looking for a purpose; it is the missing member of that set, and it earns
// its place the same way the others do: more work in an hour, never more
// experience for the work.
//
// Two intervals instead of three, which is a third more alchemy in a day.
//
// AND IT COSTS THE WEAPON HAND. That is the whole of the balance and it needed
// no new rule: a staff is wielded, so a citizen carrying one is carrying no
// sword. An alchemist walking the Wilds with a full pack is choosing between
// converting faster and being able to fight, which is exactly the choice the
// pickaxe already asks of a miner.
// THREE CADENCES, BECAUSE TWO STAVES THAT DO THE SAME THING ARE ONE STAFF.
//
// The first version gave both staves two intervals, so a heartwood stave --
// two heartwood and fletching ninety -- did exactly what a stave cut from one
// log does. That is not a mastery reward, it is an expensive duplicate.
//
// Four bare-handed, three with a stave, two with a heartwood one. Every step
// is a real reason to take the next, and the whole of it is throughput: the
// experience per cast never moves, so a staff earns you MORE PER HOUR and
// never a shorter road, which is the same bargain a hatchet strikes.
const ALCH_EVERY_BARE = 4;
const ALCH_EVERY_STAFF = 3;
const ALCH_EVERY_HEART = 2;
const alchEveryFor = (p) => {
  const w = p?.equipment?.weapon?.item;
  if (w === 'heartwood-staff') return ALCH_EVERY_HEART;
  if (w === 'staff') return ALCH_EVERY_STAFF;
  return ALCH_EVERY_BARE;
};
const ALCH_SHARE = 3, ALCH_OF = 4;   // three quarters, in integers
// WHAT ALCHEMY PAYS, AND WHY IT IS A PITTANCE.
//
// It paid three quarters of the price, which was defensible while a store paid
// the other quarter from an infinite purse. Once keepers had a bounded float,
// alchemy became the one uncapped mint left in the world -- and worse, one
// that scales with what you feed it. Measured against the island's whole money
// supply of twenty coin an interval: an alchemist unmaking heartwood makes
// five and a half, and an alchemist unmaking star plates makes THREE HUNDRED
// AND THIRTY-EIGHT. One citizen would have out-minted every keeper on the
// island seventeen times over.
//
// So the payment is flat and small: four coins, whatever came apart. That is
// less than a keeper pays for almost anything, which was always the rule --
// what a citizen buys with the difference is not having to walk -- and it is
// now true of a star plate as well as a log. Valuable things deserve the walk.
//
// The consequence I like: nobody will ever alch their good gear again. They
// will carry it home through the Wilds, which is exactly the risk that made
// the Wilds worth having.
// 6bn: TWENTY, NOT FOUR.
//
// `min(4, price - 1)` meant EVERY good worth five gold or more transmuted for
// exactly the same four: oak-logs, coal, heartwood, magic-stone and a
// nine-hundred-gold star plate, indistinguishable. The note beneath this line
// says "what is worth alching is an economic question about price and
// distance" -- and with the cap at four there was no economic question left,
// because there was no slope to reason about.
//
// The safety rule, which is why it is twenty and not a hundred: THE CAP MUST
// SIT BELOW WHAT A RECIPE'S PARTS ALCH FOR, or crafting becomes a mint. A star
// plate's four magic-stone transmute for seventy-six; the plate itself now
// transmutes for twenty. There is no profit in forging to burn, which is the
// only thing this number has to guarantee.
const ALCH_PAYS = 20;
// NEVER MORE THAN A KEEPER, WHICH A FLAT FOUR WAS NOT.
//
// Four coins is a pittance beside a star plate and a windfall beside a log.
// Measured: arrows sell for one and burnt fish for one, logs and bones for
// two, raw fish for three -- so alchemy paid two to four times what a keeper
// paid for the six commonest goods in the world, needing no keeper, no purse
// and no walk. The whole design is that a store is ALWAYS the better price,
// and for the things a beginner actually gathers it was the worse one.
//
// The lesser of four coins and a coin under the keeper's price. A star plate
// still pays four; a log pays one; an arrow pays nothing at all and is
// unmade for the practice, which is the honest value of unmaking an arrow.
const alchValue = (item) => {
  const p = PRICES[item] ?? 0;
  if (!p) return 0;
  return Math.min(ALCH_PAYS, Math.max(0, p - 1));
};
// §6o: A CROP LEFT IN THE GROUND GOES TO SEED.
//
// A plot was released in exactly one place -- the harvest branch -- so a
// citizen who planted and never came back held that ground FOREVER. One
// person with a hundred and ninety seeds could end farming for the world,
// permanently, and nothing in the engine would notice.
//
// The world's own idiom answers it: ground items rot, fires burn out, stores
// restock, the ledger forgets. A crop is no different. Twice its ripening
// again and it has gone over -- long enough that nobody loses a harvest they
// meant to collect, short enough that the ground comes back.
const CROP_ROTS_AFTER = 3600;
const GROW_TICKS_RIPE = 1200; // spec 6o: twelve minutes, seed to harvest
const PRICES = {
  'iron-dagger': 8, 'iron-spear': 14, 'iron-maul': 22,
  'horn-bow': 400, 'crab-shell': 12,
  'wool': 9,   // under the shell: downland is safer than a cold harbour
  'logs': 2, 'ore': 5, 'raw-fish': 3, 'cooked-fish': 6, 'bones': 2, 'arrows': 1, 'shot': 2,
  // 6bb: a keeper values a nugget at what a keeper can value anything -- badly.
  // Gold is not sold to shops; it is worn, or it is sold to a person.
  'chart': 180, 'iron-shield': 34, 'steel-shield': 120, 'star-shield': 640, 'gold-legs': 3400, 'star-ingot': 420, 'gold-ore': 60, 'gold-bar': 320, 'gold-helm': 2800, 'gold-plate': 4200,
  'ironbark': 9, 'great-hatchet': 520, 'great-pickaxe': 520,
  'rod': 10, 'ironbark-rod': 120, 'heartwood-rod': 300,   // §6av: five to the ore, so a double
  // heartwood is worth more than logs, and a deep fish more than a shallow
  // one: a master's hour should be worth more than a beginner's
  // HEARTWOOD AT FIFTEEN, not nine.
  //
  // Every other trade downstream of a mastery takes about a double: a cook of
  // eighty turns an eleven-gold deep fish into twenty-two, a smith of fifty
  // turns ninety-five in materials into two hundred. The fletcher took FOUR
  // AND A HALF -- three heartwood at nine became a bow worth a hundred and
  // twenty -- so the value of woodcutting ninety, the longest road in the
  // world, was being collected by somebody else's trade.
  //
  // At fifteen the bow is 120 against 45 of timber, which is a fletcher's
  // margin rather than a fletcher's windfall, and the woodcutter who spent
  // five hundred thousand logs getting there is paid for it.
  'heartwood': 15, 'deep-fish': 11, 'cooked-deep-fish': 22, 'burnt-deep-fish': 1,
  // §6am (v6): the mid goods, priced between the baseline and the mastery --
  // a mid seam's hour worth more than a doorstep's, less than a master's.
  'oak-logs': 6, 'coal': 12, 'eel': 7, 'cooked-eel': 13, 'burnt-eel': 1, 'iron': 5,
  'steel-sword': 60, 'steel-helm': 45, 'steel-plate': 110, 'steel-dagger': 40, 'steel-spear': 48,
  'steel-hatchet': 44, 'steel-pickaxe': 44, 'oak-rod': 40,
  'deep-broth': 24,   // dearer than a cooked deep fish: it keeps, and it stacks
  'heartwood-bow': 540,
  'magic-stone': 20, 'iron-sword': 15, 'iron-hatchet': 10, 'iron-pickaxe': 10,
  'iron-helm': 12, 'iron-plate': 30, 'wooden-bow': 8, 'grain': 4,
  // THE TOP OF THE WORLD COSTS WHAT IT IS WORTH.
  //
  // A star plate was two hundred, which is seven minutes of a beginner's
  // chopping -- the best armour on the island, needing smithing fifty, magic
  // thirty and four stones carried out of the Wilds, priced at seven minutes.
  // The purse fixes what a coin is worth; it does nothing about what a plate
  // is worth in LOGS, and two hundred was a hundred logs.
  //
  // Four and a half times, on everything a master makes. A star plate is now
  // most of an hour of ordinary work rather than a coffee break, and the
  // ratios between the star goods are untouched -- they were already sound.
  'star-sword': 540, 'star-helm': 270, 'star-plate': 900, 'king-shroud': 800,
  'star-spear': 450, 'star-maul': 720,
  'star-hatchet': 315, 'star-pickaxe': 315, 'staff': 6, 'heartwood-staff': 495, 'wand': 6,
  // THE THREE THAT HAD NO PRICE, and so could be neither sold nor alched
  // though every one of them is made by a citizen's work. Seeds at ten so the
  // seedsman's twenty-two is the usual double; ale and broth by what they
  // mend, at about two coins a hitpoint, which is where the cooked fish sit.
  'seeds': 10, 'ale': 8, 'broth': 10,
  // a keeper will take dragon-bones and pays what a curiosity is worth to
  // somebody who will never see the beast. THREE thousand ordinary bones fetch
  // six thousand, so five hundred is far under what the thing does: a keeper is
  // the worst buyer in the world for it and a mourner the best, which is how
  // every Wilds good in this table is priced.
  'dragon-bones': 500,
};
const storeAsk = (item) => PRICES[item] + Math.max(1, Math.floor(PRICES[item] / 10));
// 6bn: WHAT A KEEPER PAYS FALLS AS THE SHELF FILLS, which is the mechanism the
// purse was standing in for and doing badly.
//
// With no cap and no regeneration a store would otherwise pay full price for
// the ten-thousandth log, so the honest limit is the one every general store
// has always had: a shopkeeper with a hundred logs does not want your log. It
// self-enforces (nobody has to guess a "terrible price" constant), it makes
// WHERE you sell a real decision across six stores and twenty-five shelves,
// and SHELF_DECAY already refills the well if you leave it alone.
//
// Integer division only, and a floor of one coin: a keeper will always take a
// thing off your hands for something.
const STOCK_SOFTNESS = 40;      // the shelf depth at which a keeper pays half
const storeBid = (item, onShelf) => {
  const base = PRICES[item] ?? 0;
  if (!base) return 0;
  return Math.max(1, Math.floor((base * STOCK_SOFTNESS) / (STOCK_SOFTNESS + Math.max(0, onShelf | 0))));
};
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
// the Wilds (spec 2g): where citizens may hunt citizens
// ---- a world's own geography lives in its founding record (v0.54) ----
// The classic world's rectangles were written as constants when there was
// only one world. They are now defaults: a genesis that names `geo` supplies
// its own, and a genesis that does not gets exactly the classic numbers, so
// the founded world is unchanged to the byte.
function wildsRectOf(g) { return g?.geo?.wilds ?? { x0: 1, x1: 34, y0: 1, y1: 22 }; } // spec 2h
const inWilds = (g, x, y) => {
  const r = wildsRectOf(g);
  return x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
};
// the city of Anchor (spec 2d): mob-forbidden bounds
function cityRectOf(g) {
  if (g?.geo?.city) return g.geo.city;
  const cx = Math.floor(g.worldW / 2);
  return { x0: cx - 8, x1: cx + 8, y0: 2, y1: 10 };
}
// Norwick (spec 2i): the garrison town, a second safe settlement on the Wilds frontier
function norwickRectOf(g) {
  return g?.geo?.norwick ?? { x0: 36, x1: 50, y0: 24, y1: 36 };
}
const inCity = (g, x, y) => {
  const c = cityRectOf(g), n = norwickRectOf(g);
  return (x >= c.x0 && x <= c.x1 && y >= c.y0 && y <= c.y1)
      || (x >= n.x0 && x <= n.x1 && y >= n.y0 && y <= n.y1);
};
const RECIPES = {
  'iron-dagger': { iron: 1 },
  'iron-spear': { iron: 1, logs: 1 },
  'iron-maul': { iron: 2, logs: 1 },
  'sigil-bow': { 'horn-bow': 1, sigil: 3 },     // imbued, not made
  // §6ad: the heartwood bow is NOT here. It is fletched at the bench, by the
  // fletch input, because a bow made by a fletcher belongs to fletching.
  'crossbow': { 'iron': 2, logs: 2 },              // a steel prod and a wooden stock
  'star-flail': { 'star-ingot': 15, 'ironbark': 1 },
  // §6av: starmetal, because that is where the scarcity already lives -- a
  // magic-stone is mined in the WILDS, so every one has survived a trip
  // somebody could have died on. Against citizens who automate, effort is not
  // a limit and risk is: a level gate is paid overnight and a failed roll is
  // only a throughput multiplier, but a pack dropped in the Wilds is gone.
  'handgonne': { 'magic-stone': 4, 'iron': 3, logs: 1 },
  // §6av: ORE ALONE, AND FIVE AT A TIME. A magic-stone apiece put twenty-five
  // gold of materials in every shot -- six hundred over a gonne's life against
  // ninety-five for the gonne itself, so the ammunition cost six times the
  // weapon. The scarcity belongs to the BARREL, which is starmetal and dies;
  // asking the Wilds for the powder too is two bottlenecks for one weapon.
  //
  // Five to the ore, exactly as a bone gives five arrows, and it hands ore a
  // sink it did not have: a master smith makes gonnes, and the mid-level smiths
  // who cannot yet make one keep them fed.
  'shot': { 'iron': 1 },
  'star-spear': { 'star-ingot': 12, 'ironbark': 1 },
  'star-maul': { 'star-ingot': 18, 'ironbark': 1 },
  // WOOD WHERE THE WOOD IS STRUCTURAL, and nowhere else.
  //
  // A hatchet is a head and a HAFT; a spear is a point and a SHAFT; a maul is
  // weight on a handle; a crossbow has a stock. Take the wood away and there
  // is nothing to hold. But a helm and a plate are beaten out of sheet and a
  // sword is a blade with a tang -- there is no timber in any of them, and
  // asking for a log to make a breastplate was carpentry.
  //
  // It also settles a disagreement between the metals that had no reason to
  // exist: a star sword needed no wood while a bronze one did.
  'iron-sword':   { iron: 2 },
  'iron-hatchet': { iron: 1, logs: 1 },
  'iron-pickaxe': { iron: 1, logs: 1 },
  'iron-helm':    { iron: 1 },
  'iron-plate':   { iron: 3 },
  // 6bw: STARMETAL IS SMELTED NOW, AND A SET IS AN HOUR OF THE WILDS.
  //
  // A full set was FIFTY-NINE SECONDS of mining -- six magic-stone and four
  // iron. The eighteen seams on this island hold about twenty-nine miners and
  // turn out ten thousand stone an hour, so the world could make FORTY-TWO
  // THOUSAND SETS A DAY of its own best armour. One smith supplied every
  // fighter alive twice over. The levels gated WHO could make it and nothing
  // at all gated HOW MUCH, which is why a star plate was worth nothing.
  //
  // The stone stays cheap, deliberately: magic is trained on it and the road
  // to ninety-nine eats near half a million, so a rarer seam would delete a
  // skill. What changes is the GEAR. Twenty stone and four coal to an ingot,
  // and the smith works ingots.
  //
  // TWENTY-EIGHT IS THE CEILING ON EVERY LINE BELOW. A recipe is checked by
  // SLOTS -- `have()` counts slots, not quantities -- and neither magic-stone
  // nor coal stacks, so no recipe may ever name more than a pack. (Nor may a
  // future one lean on stacking: a stack of fifty arrows would count as ONE.)
  // 20 + 4 for the ingot and 20 ingots for the plate both sit under it.
  //
  // A set is 600 stone, about an hour of dedicated mining, and the island now
  // turns out roughly a hundred and forty sets a day instead of forty-two
  // thousand. The hafted arms take ironbark rather than plain logs -- a haft
  // for a starmetal head should not be the cheapest wood in the world.
  'iron-shield':    { 'iron': 4, 'oak-logs': 1 },
  'steel-shield':   { 'iron': 3, 'coal': 3, 'ironbark': 1 },
  'star-shield':    { 'star-ingot': 14, 'ironbark': 1 },
  // 6ca: six, eight, sixteen -- thirty bars for the set, priced by how much
  // of a citizen each piece covers. The helm is the least and the way in;
  // the plate is the most of it and the capstone. Somebody buys legs first
  // because every other set looks unfinished without them, and then wants
  // the rest -- so the cheapest piece should not be the one they came for.
  'gold-legs':      { 'gold-bar': 8 },
  'star-ingot':     { 'magic-stone': 20, 'coal': 4 },
  'star-sword':     { 'star-ingot': 12 },
  'star-helm':      { 'star-ingot': 10 },
  'star-plate':     { 'star-ingot': 20 },
  'star-dagger':    { 'star-ingot': 8 },
  'star-hatchet':   { 'magic-stone': 2, 'iron': 1, logs: 1 },
  'star-pickaxe':   { 'magic-stone': 2, 'iron': 1, logs: 1 },
  // §6am (v6): THE MIDDLE TIER, forged and fletched from what the mid seams
  // give. It stands to star exactly as bronze stands to it: the same shapes,
  // a rung down, made of mid-ore and mid-wood instead of magic-stone and
  // starmetal. Wood only where wood is structural, the same rule as above --
  // a haft, a shaft, a handle, a stock; never a breastplate. The tools take
  // mid-wood for their hafts; the fishing-rod is a shaft of it and a line.
  // §6ao (v6): THE STEEL LADDER, quenched from IRON and COAL together -- so a
  // mid smith must work BOTH seams, the baseline iron at Cragfoot and the coal
  // deeper in the Crags, keeping the baseline mine alive into the mid-game and
  // making two mining Schelling points that need each other. Oak hafts the
  // tools; the rod is an oak shaft and a line.
  'steel-hatchet':  { 'iron': 1, 'coal': 1, 'oak-logs': 1 },
  'steel-pickaxe':  { 'iron': 1, 'coal': 1, 'oak-logs': 1 },
  'steel-sword':    { 'iron': 1, 'coal': 1 },
  'steel-helm':     { 'iron': 1, 'coal': 1 },
  'steel-plate':    { 'iron': 2, 'coal': 1 },
  'steel-dagger':   { 'iron': 1, 'coal': 1 },
  'steel-spear':    { 'iron': 1, 'coal': 1, 'oak-logs': 1 },
  // 6bb: THE GOLD LADDER. Five nuggets to a bar because thirty-five loose
  // nuggets will not fit in a pack of twenty-eight -- the bar is compression,
  // not currency, and there is no mint anywhere in it. Eight bars to a helm
  // and twelve to a plate: forty nuggets and sixty, a hundred for the set,
  // which is two hundred and seventy-three hours of seam.
  'great-hatchet':  { 'magic-stone': 2, 'ironbark': 2 },
  'great-pickaxe':  { 'magic-stone': 2, 'ironbark': 1, 'coal': 2 },
  'gold-bar':       { 'gold-ore': GOLD_ORE_PER_BAR },
  'gold-helm':      { 'gold-bar': 6 },
  'gold-plate':     { 'gold-bar': 16 },
};
// §6ad:  is listed here BY NAME because it is no longer in
// RECIPES -- it is fletched, not forged. EQUIPPABLE was built from the recipe
// keys plus the four things nobody makes, so moving a weapon between crafts
// silently made it unwieldable.
const EQUIPPABLE = new Set([...Object.keys(RECIPES), 'wooden-bow', 'horn-bow', 'old-chain', 'dragonbow',
  'rod', 'oak-rod', 'ironbark-rod', 'heartwood-rod',   // 6bk: fletched, not forged
  'heartwood-bow', 'king-shroud',
  // a staff is held, and being held is the whole of what it costs: a citizen
  // carrying one is carrying no sword
  'staff', 'heartwood-staff', 'wand']);
// The constitutional ITEM vocabulary (rev5 §4): every item the engine can
// mint, derived from protocol constants plus the base gather/drop set. A
// syntactically pretty identifier that is not in this set is contraband:
// validation rejects it in inventories, banks, equipment, ground, trades,
// and imports alike.
const ITEMS = new Set([
  'seeds', 'grain', 'logs', 'ore', 'raw-fish', 'cooked-fish', 'burnt-fish',
  // §6am (v6): the mid-tier raw goods, gathered from the mid seams. Like logs
  // and ore they are not made, so they are named here rather than by a recipe.
  'oak-logs', 'coal', 'eel', 'cooked-eel', 'burnt-eel', 'iron', 'steel',
  // 6bb: dug one strike in 16,384, smelted five to a bar, worn where it shows
  'gold-ore',
  // 6bc: the third wood. Burns long; hafts the last axe.
  'ironbark',
  // 6bk: the rods are FLETCHED, not forged, so they are named here rather than
  // arriving free as keys of RECIPES.
  'rod', 'oak-rod', 'ironbark-rod', 'heartwood-rod',
  // 6ci: what a master surveyor brings home. Worth money; opens nothing.
  'chart',
  // §6ad: what a master brings back from the same tree and the same water
  'heartwood', 'deep-fish', 'cooked-deep-fish', 'burnt-deep-fish', 'deep-broth', 'heartwood-bow',
  'bones', 'dragon-bones', 'arrows', 'shot', 'handgonne', 'wooden-bow', 'horn-bow', 'magic-stone', 'sigil', 'old-chain', 'ale', 'broth',
  // §2g: the tool of the one working skill that had none
  'staff', 'heartwood-staff', 'wand',
  // §2g: FORAGE. It exists only on the ground and only for a little while.
  // No pack ever holds it, no keeper prices it, no vault will take it.
  'forage',
  'dragonbow',   // §6w: there is one. No keeper prices it, so it is never bought.
  'crab-shell',  // §6z: what a shore-crab gives up
  'king-shroud', // §6ao (v6): the Gibbet King's mantle -- drop-only, worn on the body
  'wool',        // §6ag: what a sheep gives up. Worth money and nothing else,
                 // which is exactly what crab-shell is: this world does not
                 // need every drop to be an input to something.
  'sigil-bow',
  ...Object.keys(RECIPES),
]);
const EQUIP_SLOT = { 'iron-helm': 'head', 'iron-plate': 'body', 'star-helm': 'head', 'star-plate': 'body', 'king-shroud': 'body',
                     'steel-helm': 'head', 'steel-plate': 'body',
                     'gold-helm': 'head', 'gold-plate': 'body',
                     'iron-shield': 'offhand', 'steel-shield': 'offhand', 'star-shield': 'offhand',
                     // 6ca: GOLD LEGS DEFEND NOTHING, and that is the point. A
                     // slot no other thing in the world can fill, holding a
                     // thing with no stat on it. The hood taught this already:
                     // a status item must COST to be worth seeing, and gold's
                     // cost was paid at the seam -- two hundred and seventy-
                     // three hours for a set that fights no better than
                     // starmetal. Legs finish the silhouette and add nothing,
                     // so a gold-clad citizen is exactly as killable as anyone
                     // and simply more obviously worth killing.
                     'gold-legs': 'legs' }; // default: weapon  (§6am v6: the mid armour)
// §6ax: a hood is worn on the HEAD and defends nothing. That is the cost and
// it is the whole cost: to be seen wearing one is to walk the country in no
// helmet. Nothing else in this world asks a citizen to choose between being
// legible and being protected, and a mark that costs nothing says nothing.
// (the single reader is `slotOf`, below)
// the first level requirements (spec 6q): an unearned hammer strikes nothing
// §6ae: THE FORGE AGREES WITH THE ARM.
//
// These disagreed with themselves: star-plate was forgeable at smithing 30
// and wearable at defence 50, so a citizen could fill a bank with gear they
// could not put on. A tier should be one wall, not two at different heights.
const SMITH_REQS = {
  // THE BRONZE LADDER, which this table did not have.
  //
  // Star has one -- helm 40, tools 42, sword 45, spear 46, plate 50, maul 52 --
  // and bronze had nothing at all, so a citizen of smithing 1 could beat out a
  // bronze plate on their first afternoon. Worse, a window had quietly invented
  // a ladder of its own and been greying out work the world would have done.
  //
  // Built on what star is built on: the material it eats and the shaping it
  // needs. A dagger is one ore and the simplest thing that cuts; a hatchet is a
  // head and an eye; a spear is a socket and a shaft; a helm is raised from
  // sheet, which is real work; a sword wants an edge and a fuller; a maul is a
  // heavy head to haft true; a plate is the most metal and the most shaping in
  // the range.
  //
  // The orders differ between the metals and that is right: in each, the entry
  // is whatever is CHEAPEST to make, and in star that is the helm while in
  // bronze it is the dagger.
  'iron-dagger': { smithing: 1 }, 'iron-hatchet': { smithing: 1 },
  'iron-pickaxe': { smithing: 1 }, 'iron-spear': { smithing: 5 },
  'iron-helm': { smithing: 7 }, 'iron-sword': { smithing: 10 },
  'iron-maul': { smithing: 14 }, 'iron-plate': { smithing: 20 },
  // THE TOOLS A CITIZEN ACTUALLY USES, in the metal everything else comes in.
  //
  // Every other star thing exists and the two a working citizen holds all day
  // do not, which is a gap rather than a tier. They ask a little less of the
  // smith than a sword does -- a head and an eye is simpler geometry than an
  // edge and a fuller -- and they give star bars a use that is not fighting,
  // which suits a world where most citizens are not fighters.
  'star-hatchet': { smithing: 42, magic: 22 }, 'star-pickaxe': { smithing: 42, magic: 22 },
  'star-sword': { smithing: 45, magic: 25 },
  'star-helm': { smithing: 40, magic: 20 }, 'star-plate': { smithing: 50, magic: 30 },
  'star-dagger': { smithing: 45, magic: 28 },
  'star-spear': { smithing: 46, magic: 26 }, 'star-maul': { smithing: 52, magic: 30 },
  // §6am (v6): THE MIDDLE LADDER, between the bronze ladder and the star one,
  // and needing no magic -- mid-ore is worked cold by any smith who has come
  // far enough, where starmetal wants a transmuter's hand. Same order of entry
  // as bronze: the dagger and the tools are cheapest, the plate the most work.
  'steel-dagger': { smithing: 25 }, 'steel-hatchet': { smithing: 26 }, 'steel-pickaxe': { smithing: 26 },
  'steel-spear': { smithing: 28 },
  'steel-helm': { smithing: 30 }, 'steel-sword': { smithing: 32 }, 'steel-plate': { smithing: 38 },
  // §6av: smithing reached 52 and stopped, so forty-seven levels bought
  // nothing. The gonne is the capstone, and because it BURSTS the demand does
  // not end with the first one.
  'handgonne': { smithing: 90, magic: 40 }, 'shot': { smithing: 50 },
  // §6x: a crossbow is a steel prod under tension and a lock that must not
  // slip. The flail is easier iron and harder geometry.
  // 6bb: gold is soft and the work is fine, so the bar asks little and the
  // finished piece asks a great deal. The plate is the last thing a smith
  // learns that is not a weapon.
  'great-hatchet': { smithing: 55 }, 'great-pickaxe': { smithing: 55 }, 'iron-shield': { smithing: 12 }, 'steel-shield': { smithing: 34 }, 'star-shield': { smithing: 48 },
  'gold-legs': { smithing: 80 }, 'star-ingot': { smithing: 45 }, 'gold-bar': { smithing: 40 }, 'gold-helm': { smithing: 75 }, 'gold-plate': { smithing: 85 },
  'crossbow': { smithing: 18 },
  'star-flail': { smithing: 50, magic: 29 },
  // §6y: THE SIGIL-BOW. Not made -- IMBUED. You bring a horn-bow that already
  // works and three sigils, and you bind them to the limbs, which is why the
  // magic asked for is higher than the smithing.
  'sigil-bow': { smithing: 12, magic: 25 },
  };
// §6ad: A LOG IS A LOG.
//
// At woodcutting 90 a tree gives heartwood instead of logs, which would strand
// a master woodcutter if anything asked for `logs` by name -- and seventeen
// places do: kindling a campfire, feeding a watchfire, seven smithing
// recipes, the wooden-bow. Written out seventeen times that is seventeen
// chances to miss one, and the one you miss is a skill somebody can no longer
// train. So it is asked once, here.
// 6bc: A WOOD IS A WOOD. This read `logs || heartwood`, so oak-logs -- gathered
// since v6 -- could not light a fire, feed a watchfire, raise a brewpot or a
// stall. A whole tier of the trade produced something the world had no verb
// for. Order matters: the cheapest is spent first, so nobody burns their
// heartwood by accident.
const LOG_KINDS = ['logs', 'oak-logs', 'ironbark', 'heartwood'];
const BURN_MULT = { 'ironbark': 3 };   // 6bc: three logs' worth of night, from one
const isLog = (item) => LOG_KINDS.includes(item);
const consumeLogs = (inv, n) => {           // spends ordinary logs first, heartwood after
  let left = n;
  for (const kind of LOG_KINDS)
    for (let i = 0; i < inv.length && left > 0; i++) {
      const sl = inv[i];
      if (sl?.item !== kind) continue;
      const take = Math.min(left, sl.qty ?? 1);
      sl.qty -= take; left -= take;
      if (sl.qty <= 0) inv[i] = null;
    }
  return left === 0;
};
const countLogs = (inv) => (inv ?? []).reduce((a, sl) => a + (isLog(sl?.item) ? (sl.qty ?? 0) : 0), 0);
// §6ap: ARMOUR IS NOT A SUBTRACTION.
//
// SOAK took a flat two a piece off every blow, against a maxHit that never
// passes about fourteen. That halved damage at ninety-nine and approached
// immunity below it, and it made a star-clad duel a minute of uninterrupted
// swinging for single-digit hits: "2, 2, 2". A miss is dramatic; a two is not.
//
// Armour now makes you HARDER TO HIT rather than harder to hurt. The same
// duel lasts about as long -- sixty seconds against the sixty-six it took
// before -- but it reads as "miss, miss, THIRTEEN", which is a fight.
//
// It also repairs the maul without touching the maul: its whole problem was
// that low accuracy was punished twice, once in the roll and again by a soak
// its slow cadence could not out-pace.
const ARMOUR = { 'iron-helm': 8, 'iron-plate': 12, 'steel-helm': 12, 'steel-plate': 18, 'star-helm': 16, 'star-plate': 24, 'king-shroud': 22,
                 'gold-helm': 16, 'gold-plate': 24 };   // 6bz/6ca: no shield and no legs here  // 6bb: starmetal's equal, at two hundred times the labour  // §6ao (v6): the Gibbet King's mantle, drop-only  // §6am (v6): mid between bronze and star
// 6bz: TWO HANDS OR ONE, AND WHAT THE OFF HAND HOLDS.
//
// The star-sword and the star-maul sit in the same wield band, and measured
// against an ARMOURED citizen they were already 87 intervals against 89 -- the
// maul's -12 accuracy costing exactly what its +5 damage buys. That balance
// was not designed and it is remarkably tight, so anything added here has to
// preserve it.
//
// A shield alone does not: any shield at all tips a coin-flip duel decisively
// to the one-handed line. So the two arrive together. Two-handed arms gain six
// to their blow; one-handed arms may carry a shield, which DIVIDES what lands.
// At a star shield's three-quarters the duel returns to 87 against 86.
//
// A DIVISOR, NOT A BLOCK AND NOT MORE ARMOUR. More armour feeds the same
// hitChance curve that already saturates, so a shield would be a number nobody
// could feel. A block would need its own roll and would raise the question of
// whether a blocked blow is a MISS -- which is what teaches defence, so it
// would quietly retune a skill. A divisor touches neither the roll nor the
// miss: what a defender learns and what an attacker learns are exactly what
// they were, and the shield only changes what arrives.
const TWO_HANDED = new Set(['iron-spear', 'steel-spear', 'star-spear', 'iron-maul', 'star-maul',
  'star-flail', 'old-chain', 'wooden-bow', 'horn-bow', 'sigil-bow', 'heartwood-bow', 'dragonbow',
  'crossbow', 'handgonne', 'staff', 'heartwood-staff']);
const SHIELD_DIV = { 'iron-shield': [7, 8], 'steel-shield': [4, 5], 'star-shield': [3, 4] };
// what a blow becomes once it has met an off-hand shield. Integers only, and a
// blow never falls below one: a shield turns a blow aside, it does not erase it.
function afterShield(q, dmg) {
  const d = SHIELD_DIV[q?.equipment?.offhand?.item];
  return d ? Math.max(1, Math.ceil((dmg * d[0]) / d[1])) : dmg;
}
const armourOf = (q) => (ARMOUR[q?.equipment?.head?.item] ?? 0)
                      + (ARMOUR[q?.equipment?.body?.item] ?? 0);

// §6aq (REPEALED, v0.87): STEEL IS NOT TAXED, AND NEVER NEEDED TO BE.
//
// Armour carried a price for three revisions: first an interval added to every
// swing, then a step every other interval, then that narrowed to the Wilds. The
// argument was always that armour which only helps is a checklist rather than a
// choice -- everybody wears the best they own and going without is a handicap.
//
// The argument was answered by a rule this world already had. THE FLIGHT RULE
// (§2b-i): everyone walks at the same speed and no reach-1 weapon lands on
// somebody who is leaving, so a clad citizen CANNOT MAKE ANYBODY FIGHT THEM.
// Armour only ever decides fights that were agreed to. It was never able to
// dominate, so there was nothing to tax, and each version of the tax was a
// second bolt on a door the first one already held.
//
// The measurements say the same. With the tax and without it, the standing duel
// orders identically -- star full 73/96 against 78/96, and every loadout in the
// same place -- so three rules, a state field and two off-by-one bugs bought a
// difference that does not appear in the numbers. What they did buy was a
// citizen who could be run down for wearing a helmet.
//
// The armour VALUES stay. They belong to the roll (§6ap), where a suit makes
// you harder to hit rather than harder to hurt, and that fix stands on its own.
const cadenceOf = (_q, every) => every;   // kept as a seam; the weight is gone

// §6ap: AND THE ACCURACY IS A RATIO, NOT A CLAMP.
//
// `clamp(128 + 4*(atk - def) + acc, 16, 240)` saturated at a twenty-eight
// level gap, so against a ninety-nine attacker DEFENCE 1 THROUGH 71 WERE
// LITERALLY IDENTICAL: seventy levels bought nothing. It was symmetric --
// attack 50, 60 and 71 all sat at 6.3% against a defence-99 target -- and
// against a low-defence target everything clamped to the ceiling, so weapon
// accuracy stopped existing and the whole table collapsed to maxHit/every.
//
// Ratios asymptote instead of clamping, so every level keeps buying
// something and no two builds are the same character. Integer arithmetic
// throughout: this decides fights, and every node must agree to the bit.
// §6x-ii: AND `pierces` NOW MEANS THE ARMOUR IS NOT THERE.
//
// The flail's whole identity was that it ignored SOAK -- "the only weapon in
// the world that ignores this subtraction", paid for with the lowest base
// damage of any steel. Moving armour out of the damage and into the roll
// deleted that identity in one line: `pierces` had nothing left to ignore, and
// the flail became simply a weak sword.
//
// The translation is exact rather than approximate. Armour used to subtract
// from the blow and the flail went round it; armour now subtracts from the
// CHANCE, and the flail goes round that. A citizen in a full star suit is as
// easy to hit with a flail as a naked one -- which is what the weapon has
// always meant, expressed in the new currency.
function hitChance256(atkLvl, defLvl, weaponAcc, armour) {
  const A = (atkLvl + 8) * (weaponAcc + 64);
  const D = (defLvl + 8) * (armour + 64);
  if (A <= 0 || D <= 0) return 16;
  const raw = A > D ? 256 - Math.floor((128 * (D + 2)) / (A + 1))
                    : Math.floor((128 * A) / (D + 1));
  return Math.max(8, Math.min(250, raw));
}
// §6am (v6): a founding may LIFT a tier. The shape -- what is forged, worn, and
// in what order -- is constitutional; the LEVELS a world guards them behind are
// that world's own, exactly as firemaking's watchfire threshold and brewing's
// ferment already are. `genesis.gearReqs = { wield:{item:{skill:lv}}, smith:{...} }`
// overrides the static ladder for the named items only. A genesis that names none
// (every world v1-v5) gets the static tables to the byte.
function reqOverride(genesis, kind, item) {
  const g = genesis && genesis.gearReqs;
  if (!g || !g[kind]) return undefined;
  return g[kind][item];
}
const isEquippable = (item) => EQUIPPABLE.has(item) || isHood(item);
const slotOf = (item) => isHood(item) ? 'head' : (EQUIP_SLOT[item] ?? 'weapon');
// 6bz: and a hand may not hold a shield while both are on the haft.
const twoHandedOn = (q) => TWO_HANDED.has(q?.equipment?.weapon?.item);
// 6bz: the two rules that make the choice a choice. They are stated once and
// read by both the validator and the executor, because a wield that one accepts
// and the other refuses is a fork.
const shieldRefused = (q, item) => slotOf(item) === 'offhand' && twoHandedOn(q);
const haftRefused   = (q, item) => TWO_HANDED.has(item) && !!q?.equipment?.offhand;
// WHAT COUNTS AS THE RIGHT TOOL, and what it is worth.
//
// One tool per node, in one metal, and a flat bonus -- so a pickaxe was a
// thing you carried because the tooltip said so. With the ceiling lowered the
// bonus decides real minutes, and with two metals in the world it is worth
// carrying the better one.
const AXES = ['iron-hatchet', 'steel-hatchet', 'star-hatchet', 'great-hatchet'];
const PICKS = ['iron-pickaxe', 'steel-pickaxe', 'star-pickaxe', 'great-pickaxe'];
// 6be: THE RODS, AND THE DEADLOCK THEY FIX.
//
// `GATHER_TOOLS.fishing` asked for a `rod`, and `rod` was not in ITEMS. It did
// not exist, could not exist, and no keeper sold it. The only real rod was the
// oak-rod, which asks fishing 35 to hold and smithing 24 to forge -- so in a
// tool-gated founding a newcomer could never take their FIRST FISH, and every
// road out of that was blocked by the skill it was blocking. Fishing was
// simply shut.
//
// Four rods, all of them wood, because a rod is a shaft and a line and always
// was. They give ironbark and heartwood a second trade to feed, and the plain
// one is sold at a stall for the price of an axe.
const RODS = ['rod', 'oak-rod', 'ironbark-rod', 'heartwood-rod'];
const TOOL_FOR = { tree: AXES, rock: PICKS,
                   'magic-rock': PICKS,
                   // §6am (v6): the mid nodes take the same three tools their
                   // baseline kin do -- a better tool is always welcome at a
                   // richer seam. Fishing was ever barehanded; the mid-rod is
                   // a bonus at both shoals, never a toll on either.
                   'oak-tree': AXES, 'ironbark-tree': AXES, 'gallows-oak': AXES,
                   'coal-rock': PICKS,
                   'iron-rock': PICKS,
                   'gold-rock': PICKS, 'mother-lode': PICKS,  // §6ao (v6): baseline iron
                   'heartwood-tree': AXES,
                   'deep-fish-spot': RODS, 'gibbet-shoal': RODS,
                   'fishing-spot': RODS, 'eel-spot': RODS };
// §6ao (v6): which tools satisfy the tool-gate for each gathering skill. Any
// tier of the right tool opens the door; a better one only works faster. The
// baseline fishing tool is the plain `rod` (shaped from logs, sold at market);
// woodcutting and mining take the bronze tool a newcomer buys with their coin.
const GATHER_TOOLS = {
  woodcutting: new Set(AXES),
  mining: new Set(PICKS),
  fishing: new Set(RODS),
};
const TOOL_BONUS = { 'iron-hatchet': 24, 'iron-pickaxe': 24,
                     // §6am (v6): the mid tool sits between the two it stands
                     // between -- better than bronze, short of star -- so a
                     // citizen who has reached the middle has a tool to reach
                     // for, and star is still the thing worth the whole road.
                     'steel-hatchet': 34, 'steel-pickaxe': 34, 'rod': 24, 'oak-rod': 34, 'ironbark-rod': 44, 'heartwood-rod': 54,
                     'star-hatchet': 44, 'star-pickaxe': 44,
                     'great-hatchet': 54, 'great-pickaxe': 54 };  // 6bi: 24 / 34 / 44 / 54, in every trade

// Canonical signed-input schemas (pre-freeze §1–§4): every semantic
// action has EXACTLY one accepted signed representation. The shape
// validator has one responsibility, accept only structurally canonical
// protocol inputs: exact base fields with exact formats, exact per-action
// fields with exact primitive types, constitutional vocabularies, and
// canonical null/zero conventions. State-dependent questions (does the
// target exist, is the slot occupied, is the node adjacent) belong to
// validInput's per-case code, never here.
const T = {
  unit: (v) => [-1, 0, 1].includes(v) || 'must be -1, 0, or 1',
  slot: (v) => (Number.isInteger(v) && v >= 0 && v < INV_SLOTS) || 'must be an inventory slot index',
  // v0.69: a trade names one or more of the offerer's slots. Ordered, unique,
  // never empty, never longer than the pack: canonical so two nodes reading
  // the same offer always read the same offer.
  slotList: (v) => {
    if (!Array.isArray(v) || v.length === 0 || v.length > INV_SLOTS) return 'must be 1..' + INV_SLOTS + ' inventory slots';
    for (let i = 0; i < v.length; i++) {
      if (!Number.isInteger(v[i]) || v[i] < 0 || v[i] >= INV_SLOTS) return 'must be inventory slot indexes';
      if (i > 0 && v[i] <= v[i - 1]) return 'slots must be ascending and unique';
    }
    return true;
  },
  nonnegInt: (v) => (Number.isSafeInteger(v) && v >= 0 && v <= 1e12) || 'must be a nonnegative integer',
  id: (v) => (typeof v === 'string' && /^[a-z0-9_-]{1,96}$/i.test(v)) || 'must be an identifier', // v0.80: 96 to fit full-64-hex pids in durable node/ground ids
  hex64: (v) => (typeof v === 'string' && /^[0-9a-f]{64}$/.test(v)) || 'must be lowercase 64-hex',
  item: (v) => ITEMS.has(v) || 'must be a constitutional item',
  // §6t: a chart is a thing a citizen can hold, so it is a thing they can
  // take back out of a bank. `deposit` takes a SLOT and `isItemName` accepts
  // charts, so one banked fine and `withdraw` -- which takes a name and
  // checked ITEMS only -- could never return it. Silent, permanent loss of a
  // survey reward, from two gates disagreeing about what an item is.
  bankable: (v) => isItemName(v) || 'must be a constitutional item or a chart',
  itemOrNull: (v) => v === null || ITEMS.has(v) || 'must be a constitutional item or null',
  recipe: (v) => (typeof v === 'string' && v in RECIPES) || 'must be a constitutional recipe',
  gear: (v) => EQUIP_SLOTS.includes(v) || 'must be an equipment slot name',
  spell: (v) => ['anchor', 'mend'].includes(v) || 'must be a constitutional spell',
  make: (v) => ['bow', 'arrows', 'heartwood-bow', 'staff', 'heartwood-staff', 'wand',
                'rod', 'oak-rod', 'ironbark-rod', 'heartwood-rod'].includes(v)   // 6bk: a rod is shaped wood
    
    || 'must be bow, arrows, staff, wand or a heartwood one',
  name: (v) => isValidName(v) || 'must be a constitutional name',
  // §6as-iii: WHERE THE LESSON GOES IS THE CITIZEN'S CHOICE, NOT THE WEAPON'S.
  //
  // Splitting a blow evenly is a sane default and a poor ceiling: measured at a
  // matched experience budget, roughly sixty attack to ninety strength is the
  // best melee anybody can bring against a lightly-armoured citizen (3.42 a
  // tick against 3.07 for an even build), while about eighty to seventy is what
  // beats a star-clad one (1.36 against 1.27). Two different characters, and
  // the even split reaches neither.
  //
  // Routing by WEAPON was the obvious alternative and it is a trap: the natural
  // strength weapon is the maul, second-worst damage in the world, so a citizen
  // would grind hundreds of hours with a weapon they do not want in order to
  // fight with one they do. It also binds two questions that are not the same
  // question -- what I swing, and what I am becoming -- and it has no honest
  // answer for the flail, the chain or the wand.
  style: (v) => ['even', 'aim', 'force'].includes(v) || 'must be even, aim or force',
};
const INPUT_SCHEMAS = {
  // §5g: the way back from the archive. It carries the record the world put
  // away; the digest in the state decides whether it is the true one.
  // §5g: the way back from the archive. Carries the record the world put
  // away and the path that proves the root holds it.
  restore: {
    record: (v) => (v !== null && typeof v === 'object' && !Array.isArray(v)) || 'must be a record',
    path: (v) => (v !== null && typeof v === 'object' && typeof v.bits === 'string' && Array.isArray(v.sibs)) || 'must be a path',
  },
  // §5g: the way in. Anyone may archive a citizen the world has not seen in
  // ARCHIVE_AFTER ticks, by bringing the path to their empty slot. It is a
  // deed anyone can do and nobody owns, like closing a gate behind you.
  archive: {
    subject: T.id,
    path: (v) => (v !== null && typeof v === 'object' && typeof v.bits === 'string' && Array.isArray(v.sibs)) || 'must be a path',
  },
  spawn: {}, stop: {}, cancel_trade: {}, invoke: {},
  still: { target: T.id },
  move: { dx: T.unit, dy: T.unit },
  gather: { nodeId: T.id }, harvest: { nodeId: T.id },
  attack: { mobId: T.id, style: T.style },
  attackp: { targetId: T.hex64, style: T.style },
  special: { targetId: T.hex64, style: T.style },   // §6af: the same reach, a different blow
  recall: { to: T.id },
  // pre-freeze §1: BOTH demand fields, always, explicitly, the canonical
  // item trade carries wantGold: 0; the canonical gold trade carries
  // wantItem: null. Omission is not a representation.
  offer_trade: { to: T.hex64, giveSlots: T.slotList, wantItem: T.itemOrNull, wantGold: T.nonnegInt },
  accept_trade: { from: T.hex64 },
  smith: { recipe: T.recipe },
  wield: { slot: T.slot }, sell: { slot: T.slot }, plant: { slot: T.slot },
  light: { slot: T.slot }, bury: { slot: T.slot }, deposit: { slot: T.slot },
  drop: { slot: T.slot }, eat: { slot: T.slot }, cook: { slot: T.slot },
  unwield: { gear: T.gear },
  buy: { item: T.item }, withdraw: { item: T.bankable },
  cast: { spell: T.spell },
  // A MENDING, SENT. Its own verb rather than a target on `cast`, because
  // every field in a schema here is required and anchor has nobody to aim at
  // -- and because the constitution already does exactly this: `attack` and
  // `attackp` are two verbs for one act against two kinds of thing.
  mendp: { target: T.hex64 },
  fletch: { slot: T.slot, make: T.make },
  pickup: { groundId: T.id },
  claim_name: { name: T.name },
  survey: {}, read_chart: { slot: T.slot },
  build_brewpot: {}, brew: { nodeId: T.id, slot: T.slot }, collect: { nodeId: T.id }, dismantle: { nodeId: T.id },
  kindle: {}, stoke: { nodeId: T.id, slot: T.slot },
  unmake: { groundId: T.id },
  raise_market: {}, dismantle_market: {},
  stock_market: { slot: T.slot }, price_market: { ask: T.nonnegInt }, take_market: {},
  // EVERY VERB MUST BE DECLARED HERE, AND TWICE I FORGOT.
  //
  // A verb needs three things to exist: a shape in this table, a rule in
  // validate(), and an effect in apply(). `drink` and `set_look` were given
  // the last two and not the first, so normalizeInput rejected them before
  // any rule was ever consulted -- with an error about an unknown TYPE, which
  // is precisely the message you get from a world too old to have the verb.
  // I read that symptom and diagnosed the wrong thing twice.
  drink: {},
  // §11b: the container. `consign` names the slots that go into it, `release`
  // gives them back, `deliver` sells one of them at the route's end.
  consign: { slots: (v) => (Array.isArray(v) && v.length >= 1 && v.length <= INV_SLOTS
    && v.every((n) => Number.isInteger(n) && n >= 0 && n < INV_SLOTS)
    && new Set(v).size === v.length) || 'must be 1-28 distinct slot indices' },
  release: {},
  deliver: { slot: T.slot },
  alch: { slot: T.slot },
  set_look: { look: (v) => (Number.isInteger(v) && v >= 0 && v <= 255) || 'must be 0-255' },
};
const INPUT_BASE = { worldId: T.hex64, playerId: T.hex64,
  tick: (v) => (Number.isSafeInteger(v) && v >= 0) || 'must be a nonnegative tick',
  sig: (v) => (typeof v === 'string' && /^[0-9a-f]{128}$/.test(v)) || 'must be a 128-hex signature',
};

function validateInputShape(input) {
  if (!input || typeof input !== 'object') return 'malformed input';
  const schema = INPUT_SCHEMAS[input.type];
  if (schema === undefined) return 'unknown input type';
  // pre-freeze §2: EVERY base field required, with its exact format
  for (const [k, check] of Object.entries(INPUT_BASE)) {
    if (!(k in input)) return `missing base field ${k}`;
    const r = check(input[k]);
    if (r !== true) return `base field ${k} ${r}`;
  }
  for (const k of Object.keys(input)) {
    if (k === 'type' || k in INPUT_BASE) continue;
    if (!(k in schema)) return `unknown field ${k} on ${input.type}`;
  }
  for (const [k, check] of Object.entries(schema)) {
    if (!(k in input)) return `missing field ${k} on ${input.type}`;
    const r = check(input[k]);
    if (r !== true) return `field ${k} on ${input.type} ${r}`;
  }
  // canonical demand convention (pre-freeze §1): exactly one of a
  // constitutional item XOR positive gold, structural, because it is
  // about REPRESENTATION, not about the world
  if (input.type === 'offer_trade'
    && (input.wantItem !== null) === (input.wantGold > 0)) return 'trade must want exactly one of item or gold';
  return null;
}

// One shared normalizer (pre-freeze §5): every client builds the object it
// signs THROUGH this, so equivalent user-facing requests always produce
// byte-identical canonical objects. Fills canonical null/zero values,
// normalizes numbers (-0 becomes 0), and refuses anything the schema
// refuses. `sig` is a shape-gate concern; normalization runs BEFORE signing.
function normalizeInput(fields) {
  if (!fields || typeof fields !== 'object') throw new Error('normalizeInput: malformed fields');
  const schema = INPUT_SCHEMAS[fields.type];
  if (schema === undefined) throw new Error('normalizeInput: unknown input type ' + JSON.stringify(fields.type));
  const out = { type: fields.type };
  for (const k of Object.keys(fields)) {
    if (k === 'type') continue;
    if (!(k in schema)) throw new Error(`normalizeInput: unknown field ${k} on ${fields.type}`);
  }
  for (const k of Object.keys(schema)) {
    let v = fields[k];
    if (v === undefined || v === null) { // canonical null/zero fills
      if (fields.type === 'offer_trade' && k === 'wantItem') v = null;
      else if (fields.type === 'offer_trade' && k === 'wantGold') v = 0;
      else if (k === 'style') v = 'even';   // §6as-iii: the default is the split
      else if (v === undefined) throw new Error(`normalizeInput: missing field ${k} on ${fields.type}`);
    }
    if (typeof v === 'number' && Object.is(v, -0)) v = 0;
    const r = schema[k](v);
    if (r !== true) throw new Error(`normalizeInput: field ${k} on ${fields.type} ${r}`);
    out[k] = v;
  }
  if (fields.type === 'offer_trade' && (out.wantItem !== null) === (out.wantGold > 0))
    throw new Error('normalizeInput: trade must want exactly one of item or gold');
  return out;
}
// 6bh: TWENTY A UNIT, AND NO TABLE AT ALL.
//
// What was here counted `ore` and `magic-stone` and nothing else -- and the
// bronze and steel ladders were WRITTEN IN `iron` AND `coal`, which the table
// had never heard of. So in the world as shipped, an iron plate, a steel
// plate, a steel sword, every tool a citizen actually uses and the whole
// middle of the trade taught NOTHING. Thirty levels of recipes paying zero,
// and the only way to learn smithing at all was starmetal out of the Wilds.
// Renaming ore to iron (so that v6's star ladder could be forged from metal
// v6 actually mines) extended the same silence to star.
//
// The fix is to stop naming materials. EVERY unit consumed teaches twenty --
// the same twenty a strike at a seam teaches, the same twenty a fish in a pan
// teaches. It cannot go stale, because a recipe invented tomorrow is counted
// by the same line, and it needs no maintenance when a material is added.
//
// And it balances ITSELF, which is the part worth noticing. Nearly every
// material in this world costs about eight intervals to gather, so twenty a
// unit puts every honest route within a hundred hours of every other: an iron
// dagger 962 hours, a star plate 1,054, a rod 909. Nobody is punished for
// working in the metal they happen to have. The uniform cost of gathering is
// what makes uniform teaching correct -- and the two exceptions prove it, since
// a magic-stone costs eleven intervals (so star is a little slower, as the
// Wilds should be) and a gold nugget costs sixteen thousand (so nobody will
// ever learn this trade at the gold seam, which is right: gold is for wearing).
// 6br: ONE LESSON A WOUND, AND THE SPLIT KEPT HONEST.
//
// (This function was lost for a revision when the smithing table above it was
// rewritten -- it sat between two constants that were replaced together, and
// nothing caught it, because not one test in the suite lands a melee blow.
// Every swing in the world would have thrown. It is restored here, rescaled.)
//
// Four experience a point of damage made attack and strength the two fastest
// masteries on the island by a factor of nine -- ninety-six hours each against
// eight hundred and eighty everywhere else -- while hitpoints, at one a point,
// rode along at exactly a quarter for no reason anybody chose.
//
// One a point now, and the cadence of every weapon has doubled beside it: a
// swing is 2.4 seconds, which is what this world's 600ms interval was always
// sized for and what every player already has in their hands from elsewhere.
// Together that is a fourfold cut, and it puts combat where every trade is.
//
// THE EVEN SPLIT ALTERNATES BY TICK PARITY rather than paying half to each,
// because experience is an integer (3.1) and half of one damage is not.
// `floor(dmg/2)` would pay a beginner NOTHING for every one-point blow they
// ever land. Alternating gives exactly half of each over any run of intervals,
// which is what the split always meant, and never a rounded-down zero.
function teachMelee(p, dmg, style, tick) {
  if (style === 'aim') p.skills.attack += dmg;
  else if (style === 'force') p.skills.strength += dmg;
  else if ((tick & 1) === 0) p.skills.attack += dmg;
  else p.skills.strength += dmg;
}
const XP_SMITH_PER_UNIT = 20;
// 6bk: AND THE SAME TWENTY AT THE BENCH. Fletching had its own private scale --
// five for arrows, twelve for a wand, fifteen for a bow, a hundred and twenty
// for the heartwood pair -- so the same skill paid its worst route a
// twenty-fourth of its best. Arrows at five were the slowest experience
// anywhere in this world by an order of magnitude, and nothing told anybody.
// One unit of wood or bone, twenty, wherever it is worked.
const XP_FLETCH_PER_UNIT = 20;
// 6bk: which wood each rod is drawn from, and what a fletcher must be to draw
// it. The gates match the rod's own wielding gate in fishing, so the fisher who
// can hold it is the fletcher who can make it.
const ROD_OF = { 'rod': 'logs', 'oak-rod': 'oak-logs', 'ironbark-rod': 'ironbark', 'heartwood-rod': 'heartwood' };
const ROD_FLETCH_REQ = { 'rod': 1, 'oak-rod': 10, 'ironbark-rod': 30, 'heartwood-rod': 70 };
function XP_SMITH_FOR(recipe, r) {
  if (!r || typeof r !== 'object') return 0;
  let units = 0;
  for (const n of Object.values(r)) if (Number.isFinite(n)) units += n;
  return XP_SMITH_PER_UNIT * units;
}
// 6bg: TWENTY. A log is a log, and lighting one is one act.
//
// At forty, and with the watchfire's 60-a-log on top of 300 ticks of burn, a
// log fed to a beacon was worth THREE HUNDRED AND SIXTY experience against a
// field fire's forty -- nine times, for the same wood. The nerf from 200 to 60
// fixed a tenth of it, because the money was never in the stoke: it was in the
// burn, which pays a xp an interval for six thousand intervals and asks
// nothing of anybody.
const XP_FIREMAKING = 20;
// 6bj: TWENTY, like a strike at a seam and a fish in a pan.
//
// Prayer is the free rider on fighting, exactly as cooking is on fishing, and
// that is the correct shape rather than a leak: a bone is a byproduct, and a
// citizen who kills for eight hundred hours should come out of it a mourner as
// well as a fighter. What it must NOT be is a shortcut -- at twenty-five it
// was, because a bone costs two intervals (take it up, put it down) where a
// log costs eight.
const XP_BURY = 20;
// AND WHAT A DRAGON'S BONES TEACH.
//
// A hundred times a goblin's, and that is safe to say because THE SUPPLY IS
// CAPPED BY THE RESPAWN. Twelve hours means at most two dragons a day and
// seven hundred and thirty sets a year for the whole world, however many
// people hunt it -- so no number here can be a shortcut. What the number
// decides is only whether anybody would PAY for a set.
//
// A THOUSAND times a goblin's, and the reason is that BONES DO NOT STACK.
//
// Prayer is 521,377 ordinary bones to ninety-nine, and a pack holds
// twenty-four, so buying the road is twenty-one thousand separate trades:
// impossible, not expensive. A rich citizen could not spend their way to
// ninety-nine however much gold they had, which makes gold worth less and
// makes the longest road in the world unbuyable rather than dear.
//
// Dragon-bones are the compressed form -- what noted items would have been,
// without inventing notes.
//
// The number is set from the DRAGON'S CLOCK rather than from the bones. One
// dragon should be worth a little under two per cent of the longest road in
// the world, which puts a whole ninety-nine at fifty-eight dragons: twenty-nine
// days if every one of them falls on time and every set goes to one buyer,
// and nobody's world works like that -- call it a season of outbidding every
// other mourner on the island.
//
// At twenty-five thousand it was a hundred and seventy-four dragons, three
// months of PERFECT supply, which is another way of saying not actually
// purchasable. A route nobody can complete is not a market; it is scenery.
// A full pack is now 1.8 million prayer, about a seventh of a ninety-nine,
// and it costs a fortune and the world's whole attention to assemble.
const XP_BURY_DRAGON = 60000;     // 6bj: rescaled with the rest -- still 3,000 ordinary bones, still not a road anybody walks
// AND WHAT CONSECRATED GROUND PAYS. A quarter more, and the number is chosen
// so that the monastery stays a DECISION.
//
// Prayer is bone-bound, not tick-bound: burying is one input an interval, so
// what limits it is that bones only exist where beasts die -- perhaps sixteen
// intervals of hunting for each. Against that the walk to a monastery is
// small, twenty-four bones to a pack and two walks a trip. Which means a
// generous bonus would be worth making from anywhere on the island, and the
// monastery would stop being a choice and become a chore everybody performs.
//
// At thirty-one the walk pays for itself out to about fifty tiles. Hunt the
// Downs and it is worth carrying your bones in; hunt the Wilds and it is not.
// Where you hunt stays the question, which is the kind of question this world
// is good at.
const XP_BURY_CONSECRATED = 25;   // 6bj: a quarter again, the hearth's premium, for the one place built to receive them
const FIRE_TICKS = 100;
const WATCH_TEND_RANGE = 8;   // 6bg: near enough to be warmed by it, and to be seen at it
const SLEEP_AFTER = 500;
function isAwake(p, tick) {
  return p.action !== null || tick - (p.lastInput ?? 0) <= SLEEP_AFTER;
}

// ---- the terrain registry (v0.77): a generator TEACHES the engine to
// walk its country. The engine stays generator-agnostic (worldgen
// imports engine, never the reverse); loading a generator's module IS
// implementing its country, and registering its walkability is part of
// implementing it. Unregistered generators keep the old law (nothing
// but the hedge and the nodes bars the way) which is what every
// world founded before this shipped replays under.
const TERRAINS = Object.create(null);
function registerTerrain(id, t) { TERRAINS[id] = t; }
// the geography hash the REGISTERED generator computes for its island
// (v0.80). A generator that draws a different island returns a different
// hash; a generator that only refactors returns the same one. Absent a
// declaration (the classic generators predate this), geography stays
// name-committed as before, so old worlds are unaffected.
function geographyHashOf(genesis) {
  const t = TERRAINS[genesis.worldGenerator];
  return t && t.geographyHash ? t.geographyHash(genesis) : null;
}
// FAILS CLOSED. This used to return `false` -- WALKABLE -- for every tile of
// any world whose generator was not registered on this node. Measured on a v5
// world with only v3 loaded: 0 blocked, 40,000 walkable, and 7,911 tiles of
// sea, river, ridge and wall reading as open ground.
//
// A validation path that fails open is almost never intended, and this one
// failed SILENTLY: the node believed it had a map and did not. Bots froze on
// routes the server rejected and there was nothing to read.
//
// The distinction that matters: a generator REGISTERED but supplying no
// `blocked` is legitimate -- interval-classic-v1 has no impassable terrain at
// all -- while a generator that is not registered means this node cannot
// compute this world, and every answer it gives about the ground is a guess.
// So: absent function, trust it. Absent GENERATOR, block everything.
//
// Blocking everything makes the world instantly, obviously unplayable, which
// is the point. The sibling path already refuses outright on a geography-hash
// mismatch -- but that check can only fire once the right generator is loaded,
// so this was the hole underneath the working safety net.
// The one generator that legitimately registers nothing: classic-v1 has no
// impassable terrain, so it needs no `blocked` and no module. Naming it once
// here rather than twice is the whole point -- the first version of this fix
// put the exception in validateGenesis and forgot it here, which blocked every
// tile of every classic world, froze the mobs, and hung the benchmark suite.
const TERRAINLESS = new Set(['interval-classic-v1']);
const _unregWarned = new Set();
function terrainBlocked(g, x, y) {
  const t = TERRAINS[g.worldGenerator];
  if (t === undefined) {
    if (TERRAINLESS.has(g.worldGenerator)) return false;   // nothing to block
    if (!_unregWarned.has(g.worldGenerator)) {
      _unregWarned.add(g.worldGenerator);
      const m = 'worldgen ' + g.worldGenerator + ' is not registered on this node: '
        + 'ALL terrain reads as blocked. Import its module before building this world.';
      if (typeof console !== 'undefined' && console.error) console.error('[interval] ' + m);
    }
    return true;
  }
  return t.blocked ? !!t.blocked(g, x, y) : false;
}
const spawnOf = (g) => (TERRAINS[g.worldGenerator] && TERRAINS[g.worldGenerator].spawn
  ? TERRAINS[g.worldGenerator].spawn(g)
  : { x: Math.floor(g.worldW / 2), y: Math.floor(g.worldH / 2) });

// ---------- XP table: spec constants (Appendix A). Index = level. ----------
const XP_TABLE = [0,0,83,174,276,388,512,650,801,969,1154,1358,1584,1833,2107,2411,2746,3115,3523,3973,4470,5018,5624,6291,7028,7842,8740,9730,10824,12031,13363,14833,16456,18247,20224,22406,24815,27473,30408,33648,37224,41171,45529,50339,55649,61512,67983,75127,83014,91721,101333,111945,123660,136594,150872,166636,184040,203254,224466,247886,273742,302288,333804,368599,407015,449428,496254,547953,605032,668051,737627,814445,899257,992895,1096278,1210421,1336443,1475581,1629200,1798808,1986068,2192818,2421087,2673114,2951373,3258594,3597792,3972294,4385776,4842295,5346332,5902831,6517253,7195629,7944614,8771558,9684577,10692629,11805606,13034431];

// 2^(r/7) scaled by 2^96, as exact integers. ECMA-262 does not require
// Math.pow to be correctly rounded, so the curve past mastery is computed from
// these rather than from a float power: two engines that disagreed in the last
// place would report different standings for the same citizen. (Verified: this
// reproduces every one of the 98 constitutional thresholds exactly, and V8's
// own Math.pow already differs from the true value at 15 levels past 267.)
const POW2_SEVENTHS = [
  79228162514264337593543950336n, 87474983419643881438334899625n,
  96580211902419410754522887331n, 106633199189855989094361944303n,
  117732597035010858756489598210n, 129987325803940059419872279709n,
  143517643330631577550838571505n];
function xpStepAt(lvl) { // floor(lvl + 300 * 2^(lvl/7)), exactly
  const q = BigInt(Math.floor(lvl / 7)), r = lvl % 7;
  return lvl + Number((300n * (1n << q) * POW2_SEVENTHS[r]) >> 96n);
}
function levelForXp(xp) {
  let lvl = 1;
  while (lvl < 99 && xp >= XP_TABLE[lvl + 1]) lvl++;
  if (lvl < 99 || xp < XP_TABLE[99]) return lvl;
  // beyond mastery (spec 4b): the same recurrence, continued without bound
  let points = XP_TABLE[99] * 4;
  while (true) {
    points += xpStepAt(lvl);
    if (xp < Math.floor(points / 4)) return lvl;
    lvl++;
  }
}
// mechanics read capped mastery (spec 4b)
const effLevel = (xp) => Math.min(levelForXp(xp), 99);

// ---------- who a citizen is (spec 10, v0.55) ----------
// Two windows once each invented their own idea of a citizen's "level" and
// disagreed about the same public state, which meant level was a property of
// the software rather than of the person. It is derived here instead, so every
// window agrees forever.
//
// STANDING is the sum of every skill's TRUE level, levelForXp, not effLevel,
// because mastery at 99 is a milestone and not a ceiling. A citizen who keeps
// going past mastery keeps rising, and standing has no maximum to hardcode.
// §6ax: HOOD_STANDING, and why it is this number and not a rounder one.
//
// A mastery is 13,034,431 experience. Because the curve is exponential,
// BREADTH is far cheaper than DEPTH -- standing 1200 spread across all
// seventeen trades is 13,469,999, within a few percent of a single ninety-
// nine, where reaching it by ten masteries would cost 130 million. So a
// hood costs what a cape costs, spent wide instead of deep. The cape says
// you went far in one thing; the hood says you went everywhere. They are
// peers, not a ladder, and neither of us chose that -- the curve did.
//
// It is not a filter. In a world that expects executors, every citizen who
// is maintained long enough crosses any line drawn here; the threshold buys
// a sybil toll and a pace, nothing more. That is sufficient, because the
// hood's scarcity was never meant to come from the threshold. It comes from
// each one being a different object.
const HOOD_STANDING = 1200;

// Once, at the interval a citizen's standing first reaches the mark, and
// never again -- `hooded` records the tick so the id can be recomputed by
// anyone from state alone. It goes to the pack if there is room and to the
// ground at their feet if there is not, because a founding gift that
// silently evaporates against a full pack is a founding gift nobody can
// rely on.
function grantHoods(s) {
  for (const [pid, p] of Object.entries(s.players)) {
    if (p.hooded !== undefined || standingOf(p) < HOOD_STANDING) continue;
    p.hooded = s.tick;
    const item = hoodFor(pid, s.tick);
    const slot = firstFreeSlot(p.inventory);
    if (slot !== -1) p.inventory[slot] = { item, qty: 1 };
    else s.ground['g' + s.tick + '-' + pid + '-hood'] =
      { item, qty: 1, x: p.x, y: p.y, expiresAt: MAX_TIME };
    // The citizen is the actor, not the recipient: nothing GIVES this, because
    // the authority that would give it dissolved at the founding. And it says
    // WALKED rather than mastered -- 1200 is seventy-odd in all seventeen, a
    // long way into every trade and the end of none. The tick is carried here
    // as well as in the id, so the number enters the record at the moment it
    // is minted, where a reader years later would go looking for it.
    announce(s, (p.name ?? pid.slice(0, 6))
      + ' has walked every trade, and wears a wayfarer\u2019s hood (' + s.tick + ').');
  }
}

// §6ax: A HOOD OUTLIVES ITS BEARER.
//
// Death is the deepest sink in this world and stays so: every death still
// annihilates a pack, or spills one that rots in a hundred ticks. A hood is
// the single exception, and it is an exception because it is the only object
// whose worth is a fact about the past. Burning one deletes a piece of the
// world's record, permanently, with no rule anywhere able to mint another --
// and it would be deleted most often by an ordinary accident on an ordinary
// evening, which is the worst possible way to lose a thing like that.
//
// So it falls where its bearer fell, and it does NOT expire (§2b-v gives
// ground a hundred ticks; MAX_TIME is that rule declining to apply). What
// this buys is not preservation but a GRAVE MARKER: a hood lying in the deep
// Wilds years later says whose it was and how far they got, and nobody wrote
// it there. It is the only record in the world placed by history rather than
// by a generator.
//
// Anyone may take it. That is deliberate: a hood is never destroyed, only
// TRANSFERRED, and since a citizen crosses the mark once they can never have
// another. Your name walks away on somebody else's head. The whole penalty
// sits in the register the object was made for, and costs no power at all.
function spillHoods(s, q, qid) {
  let n = 0;
  const put = (item) => {
    s.ground['g' + s.tick + '-' + qid + '-hood' + (n++)] =
      { item, qty: 1, x: q.x, y: q.y, expiresAt: MAX_TIME };
  };
  for (const sl of q.inventory) if (sl && isHood(sl.item)) put(sl.item);
  for (const k of EQUIP_SLOTS) { const w = q.equipment?.[k]; if (w && isHood(w.item)) put(w.item); }
}

function standingOf(p) {
  let n = 0;
  for (const sk of SKILLS) n += levelForXp(p?.skills?.[sk] ?? 0);
  return n;
}
// §6ao (v6): what standing a waystone asks before a citizen may attune to it.
// Standing is the sum of true skill levels -- a newcomer is ~24, a settled
// citizen a few hundred, a veteran past a thousand. The home cluster opens to
// anyone who has found their feet; the specialist towns ask more; the garrison
// and the two frontier stones ask a great deal, so quick passage to the deep
// Wilds and high Crags is the mark of a citizen who has truly arrived. A
// founding tunes the tiers; this is the default the first v6 world uses.
const WAYSTONE_TIER = {
  // home cluster -- the road a known face already walks
  anchor: 60, millbrook: 60, oxenford: 80, hollybarrow: 80,
  // the specialist towns, further out
  greenhollow: 160, thornbury: 160, eastmere: 200, fenmarch: 220,
  // the frontier
  cragfoot: 300, norwick: 360,
  // the two deep stones -- earned, not given
  wildsdeep: 700, cragshigh: 600,
};
// 6ch: waystoneStandingFor removed with the stones.
// CALLING is the profession a citizen is best at, as a word. Hitpoints is
// excluded: it is a consequence of fighting rather than a trade, and it starts
// at 10, so without this every citizen would be born a fighter. Ties fall to
// the constitutional skill order, so the answer is the same on every node.
const CALLINGS = {
  woodcutting: 'forester', mining: 'miner', fishing: 'fisher', cooking: 'cook',
  smithing: 'smith', firemaking: 'firekeeper', prayer: 'mourner', ranged: 'archer',
  // ALCHEMIST, not sigilist.
  //
  // 'sigilist' was true when every use of magic needed a sigil, and three
  // stones from the Wilds bought one. Alchemy is now where magic begins and
  // how it is trained, so most citizens who hold this calling will have
  // reached it without ever pressing a sigil in their lives. A calling names
  // what somebody DOES; this one had come to name a thing they had not done.
  magic: 'alchemist', farming: 'farmer', fletching: 'fletcher', attack: 'fighter',
  // §6as (v0.86) split strength from attack and left it wordless: a citizen
  // whose highest xp was strength rendered as the string "undefined" in every
  // window and on the hiscores. 'force' style trains strength alone, so this
  // was reachable by design, not by accident. BERSERKER names the arm the way
  // FIGHTER names the aim and WARDEN the guard -- a style, not a trade.
  strength: 'berserker',
  defence: 'warden', exploration: 'cartographer', brewing: 'brewer',
  // 6cd: RUNNER, and the same hole the note above describes, still open.
  //
  // §6as caught that strength had no word and rendered as the string
  // "undefined" wherever a calling was shown. Hauling has had none SINCE IT WAS
  // WRITTEN: it is the twelfth skill in the constitution and never reached this
  // table, so any citizen whose deepest trade is the road has been nameless in
  // every window and on the hiscores from the day the skill existed.
  //
  // RUNNER, not carter or porter. A carter has a cart and a porter works a
  // quay; this citizen walks the roads with what somebody paid them to walk it
  // with, under the one law in the world that lets anybody strike them for it
  // (§11d). The word should say the running, not the load.
  hauling: 'runner',
};
// Chosen by EXPERIENCE, not by level. Levels are a step function of xp, so the
// skill with the most experience always holds the highest level too: comparing
// xp settles ties between equal levels the way a citizen expects, and gives the
// identical answer everywhere else. Ties in raw xp fall to the constitutional
// skill order, so every node still answers the same.
function callingOf(p) {
  let best = null, bestXp = -1;
  for (const sk of SKILLS) {
    if (sk === 'hitpoints') continue;
    const xp = p?.skills?.[sk] ?? 0;
    if (xp > bestXp) { bestXp = xp; best = sk; }
  }
  if (best === null || levelForXp(bestXp) <= 1) return 'newcomer';
  // 6cg: ALL EIGHTEEN -- this said 'all sixteen', written when it was true and
  // never touched again as strength and hauling joined the constitution. The
  // CODE was always right (it reads SKILLS, so the race has always counted
  // every skill there is); only the sentence beside it was two behind, which
  // is the more dangerous of the two states -- a wrong comment is believed.
  // The same condition the world announces as Master of Interval.
  // Written now, while nobody is near it, because every rule change is a fork
  // and the day someone approaches this is the worst possible day to need one.
  if (SKILLS.every(sk => (p?.skills?.[sk] ?? 0) >= XP_TABLE[99])) return 'Master of Interval';
  // Mastery is the one milestone this world already stops to announce, so the
  // calling says it. Note what needs no extra rule: since the calling is the
  // MOST-experienced trade, a citizen who has mastered anything has at least
  // that much experience in their calling, so the word turns to master exactly
  // when they have mastered something. Past mastery it does not change again;
  // standing carries the rest.
  return (bestXp >= XP_TABLE[99] ? 'master ' : '') + CALLINGS[best];
}

// ---------- canonical encoding & hashing ----------

// Canonical encoding (CONSENSUS.md §2): recursively key-sorted JSON over
// null, booleans, FINITE numbers, strings, arrays, and plain objects.
// Anything else is rejected loudly, a hash over silently-coerced data is
// a consensus bug waiting for its tick.
function canonical(obj) {
  if (obj === undefined) throw new Error('canonical: undefined is not encodable');
  if (obj === null) return 'null';
  const t = typeof obj;
  if (t === 'number') {
    if (!Number.isFinite(obj)) throw new Error('canonical: non-finite number (NaN/Infinity) is not encodable');
    return JSON.stringify(obj);
  }
  if (t === 'boolean' || t === 'string') return JSON.stringify(obj);
  if (t !== 'object') throw new Error('canonical: unsupported type ' + t);
  if (Array.isArray(obj)) return '[' + obj.map(canonical).join(',') + ']';
  const proto = Object.getPrototypeOf(obj);
  if (proto !== Object.prototype && proto !== null) throw new Error('canonical: unsupported object type');
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonical(obj[k])).join(',') + '}';
}

function sha256(buf) {
  return Buffer.from(nobleSha256(buf));
}

// ---------- state-hash memoization (perf brief 1D) ----------
// nextState returns a fresh object and never mutates its caller's state,
// so a state object's canonical hash is stable for that object's lifetime.
// The same object is legitimately hashed several times per tick (prev-hash
// binding, resulting hash, attestation checks, checkpointing); memoize by
// OBJECT IDENTITY in a WeakMap. Never by tick number, never by a
// state-carried field, never across distinct objects. A WeakMap attaches no
// protocol-visible metadata, needs no invalidation, and retains nothing
// once a state is unreferenced.
//
// Discipline this relies on (enforced by test/perf.test.mjs): any code that
// mutates a state object in place (e.g. a tamper/rule-breaker hook) must
// do so BEFORE the object is first hashed. Every current call site
// replaces state objects rather than mutating them.
const _stateHashCache = new WeakMap();
function stateHash(state) {
  const memoizable = state !== null && typeof state === 'object';
  if (memoizable) {
    const cached = _stateHashCache.get(state);
    if (cached !== undefined) { _perf.stateHashHits++; return cached; }
  }
  _perf.stateHashMisses++;
  const h = sha256(Buffer.from(canonical(state))).toString('hex');
  if (memoizable) _stateHashCache.set(state, h);
  return h;
}

// ---------- identity: ed25519 keypairs (noble, universal) ----------
// playerId = hex of the raw 32-byte public key.
// privateKey = raw 32-byte secret (Uint8Array). Guard it: it IS the character.

function generateIdentity() {
  const privateKey = ed.utils.randomSecretKey();
  ensureEdHash(); return { playerId: hex(ed.getPublicKey(privateKey)), privateKey };
}

// ---------- signature domains (fix brief §2.3) ----------
// Every signature is bound to a purpose: a chat signature can never be
// replayed as a game input, and vice versa. The domain string prefixes
// the signed bytes; the payload itself carries the exact worldId.
const SIG_DOMAINS = {
  input: 'INTERVAL_INPUT_V1|',
  chat:  'INTERVAL_CHAT_V1|',
};

// The signed payload is the domain prefix + canonical input without its sig field.
function inputPayload(input, domain = SIG_DOMAINS.input) {
  const { sig, ...rest } = input;
  return Buffer.from(domain + canonical(rest));
}

function signInput(input, privateKey, domain = SIG_DOMAINS.input) {
  ensureEdHash(); return { ...input, sig: hex(ed.sign(inputPayload(input, domain), privateKey)) };
}

// ---------- ed25519 verification backend (perf brief 1B) ----------
// The protocol requires signature verification; it does not require a
// particular library. Node's OpenSSL-backed Ed25519 verifies ~20x faster
// than the pure-JS fallback. The accepted set must not change, so the
// backend is structured as native-accept fast path, fallback-authoritative:
//
//   OpenSSL enforces strict RFC 8032 (canonical encodings, S < L,
//   cofactorless equation). @noble's default acceptance is a mathematical
//   superset of that: its cofactored check with liberal point decoding
//   accepts every strictly-valid signature (R + hA = sB implies
//   8(R + hA - sB) = 0, and canonical encodings decode identically).
//   Therefore native-accept ⇒ noble-accept, and acceptance may be
//   fast-pathed. Any native REJECTION is re-judged by the fallback, which
//   remains the sole authority on the constitutional accepted set. A
//   crafted edge-case signature costs one extra cheap native call; an
//   honest valid signature costs ~0.1 ms instead of ~2.6 ms.
//
// Backend selection happens once (initCrypto or first verification) and
// runs a known-answer cross-check; a disagreement between backends on a
// strict vector is a startup failure, never a silent fallback.
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');
const PUBKEY_OBJECTS_MAX = 8192; // KeyObject construction cache (implementation constant)
let _edBackendName = null; // 'native+fallback' | 'fallback'
let _nativeCrypto = null;
const _pubKeyObjects = new Map(); // raw pubkey hex -> KeyObject (bounded LRU)

const _perf = {
  sigCacheHits: 0, sigCacheMisses: 0, sigCacheEvictions: 0,
  nativeCalls: 0, fallbackCalls: 0,
  stateHashHits: 0, stateHashMisses: 0,
};
// Non-consensus observability (perf brief 1C): logs/benchmarks only.
// These counters never influence engine behavior or enter canonical state.
function perfStats() { return { backend: _edBackendName ?? 'unselected', ..._perf }; }

function _fallbackVerify(pubBytes, payloadBuf, sigBytes) {
  try { ensureEdHash(); return ed.verify(sigBytes, payloadBuf, pubBytes); } catch { return false; }
}

function _nativeKeyObject(pubBytes) {
  const k = Buffer.from(pubBytes).toString('hex');
  const hit = _pubKeyObjects.get(k);
  if (hit !== undefined) { _pubKeyObjects.delete(k); _pubKeyObjects.set(k, hit); return hit; }
  const obj = _nativeCrypto.createPublicKey({
    key: Buffer.concat([ED25519_SPKI_PREFIX, pubBytes]), format: 'der', type: 'spki',
  });
  _pubKeyObjects.set(k, obj);
  if (_pubKeyObjects.size > PUBKEY_OBJECTS_MAX) _pubKeyObjects.delete(_pubKeyObjects.keys().next().value);
  return obj;
}

function _nativeVerify(pubBytes, payloadBuf, sigBytes) {
  // Lengths native would reject with a throw are rejected up front; both
  // implementations reject them, so this changes no answer.
  if (pubBytes.length !== 32 || sigBytes.length !== 64) return false;
  try { return _nativeCrypto.verify(null, payloadBuf, _nativeKeyObject(pubBytes), Buffer.from(sigBytes)); }
  catch { return false; }
}

function _selectEdBackend() {
  if (_edBackendName !== null) return;
  let nc = null;
  try {
    nc = require('crypto');
    if (!nc || typeof nc.verify !== 'function' || typeof nc.createPublicKey !== 'function') nc = null;
  } catch { nc = null; }
  if (nc) {
    // Probe for Ed25519 capability before trusting it.
    try { nc.createPublicKey({ key: Buffer.concat([ED25519_SPKI_PREFIX, Buffer.alloc(32, 9)]), format: 'der', type: 'spki' }); }
    catch { nc = null; }
  }
  if (!nc) { _edBackendName = 'fallback'; return; } // capability absent: conservative fallback is acceptable
  _nativeCrypto = nc;
  // Known-answer cross-check: every vector is strict, so the backends must
  // agree exactly. Disagreement here means one implementation is broken,
  // and that is a startup failure, never a quiet fallback.
  ensureEdHash();
  const seed = new Uint8Array(32).fill(0x42);
  const katPub = ed.getPublicKey(seed);
  const katMsg = Buffer.from('INTERVAL_ED25519_BACKEND_KAT_V1');
  const katSig = ed.sign(katMsg, seed);
  const flipped = Buffer.from(katSig); flipped[0] ^= 0xff;
  const vectors = [
    [Buffer.from(katPub), katMsg, Buffer.from(katSig), true],                 // valid
    [Buffer.from(katPub), Buffer.concat([katMsg, Buffer.from('!')]), Buffer.from(katSig), false], // altered message
    [Buffer.from(katPub), katMsg, flipped, false],                            // altered signature
    [Buffer.from(katPub).subarray(1), katMsg, Buffer.from(katSig), false],    // malformed key (31 bytes)
    [Buffer.from(katPub), katMsg, Buffer.from(katSig).subarray(1), false],    // truncated signature
    [Buffer.from(katPub), katMsg, Buffer.concat([katSig, Buffer.from([0])]), false], // oversized signature
  ];
  for (const [p, m, s, expect] of vectors) {
    if (_fallbackVerify(p, m, s) !== expect)
      engineThrow(ENGINE_ERR.BACKEND_DISAGREEMENT, 'ed25519 fallback failed its own known-answer test');
    if (_nativeVerify(p, m, s) !== expect)
      engineThrow(ENGINE_ERR.BACKEND_DISAGREEMENT, 'native and fallback ed25519 disagree on a strict known-answer vector, refusing to start with an untrustworthy backend');
  }
  _edBackendName = 'native+fallback';
}

function _backendVerify(pubBytes, payloadBuf, sigBytes) {
  _selectEdBackend();
  if (_edBackendName === 'native+fallback') {
    _perf.nativeCalls++;
    if (_nativeVerify(pubBytes, payloadBuf, sigBytes)) return true; // native-accept ⇒ accept (see superset note)
  }
  _perf.fallbackCalls++;
  return _fallbackVerify(pubBytes, payloadBuf, sigBytes); // authoritative on every rejection
}

// ---------- signature-verification cache (perf brief 1C) ----------
// Verification is a pure function of (public key, signed payload,
// signature). For identical bytes the answer cannot change within a
// process lifetime, so repeated curve math is waste: the same input is
// legitimately verified at proposal admission, bundle validation, inside
// the state machine, and again during attestation and catch-up replay.
// The cache is process-local, bounded, disposable, never persisted, never
// transmitted, and never part of canonical state: a node restarting with
// an empty cache produces the same history.
let _sigCacheMax = 16384; // implementation constant; test hook may shrink it
const _sigCache = new Map(); // insertion-ordered => cheap LRU

function _sigCacheKey(pubBytes, payloadBuf, sigBytes) {
  // Commits to all three components, length-prefixed so variable-length
  // malformed material cannot collide across field boundaries. The payload
  // itself carries the domain prefix, so the domain is committed too.
  const lens = Buffer.from([
    pubBytes.length & 0xff, (pubBytes.length >> 8) & 0xff,
    sigBytes.length & 0xff, (sigBytes.length >> 8) & 0xff,
  ]);
  return sha256(Buffer.concat([lens, pubBytes, sigBytes, payloadBuf])).toString('latin1');
}

function verifyInputSig(input, domain = SIG_DOMAINS.input) {
  if (typeof input.sig !== 'string' || typeof input.playerId !== 'string') return false;
  let payloadBuf, pubBytes, sigBytes;
  try {
    payloadBuf = inputPayload(input, domain);
    pubBytes = Buffer.from(input.playerId, 'hex');
    sigBytes = Buffer.from(input.sig, 'hex');
  } catch {
    return false; // non-encodable input: identical to the pre-cache catch-all
  }
  const key = _sigCacheKey(pubBytes, payloadBuf, sigBytes);
  if (_sigCache.has(key)) { // has(): a cached `false` must not read as absent
    const v = _sigCache.get(key);
    _sigCache.delete(key); _sigCache.set(key, v); // LRU touch
    _perf.sigCacheHits++;
    return v;
  }
  _perf.sigCacheMisses++;
  const valid = _backendVerify(pubBytes, payloadBuf, sigBytes);
  _sigCache.set(key, valid); // negative results cached too: forged floods repeat
  if (_sigCache.size > _sigCacheMax) {
    _sigCache.delete(_sigCache.keys().next().value);
    _perf.sigCacheEvictions++;
  }
  return valid;
}

// Low-level signatures for the protocol layer (bundles, attestations):
// the engine is the single home of the ed25519 wiring, so higher layers
// never re-import or re-configure the curve.
function signPayload(payloadBuf, privateKey) {
  ensureEdHash(); return hex(ed.sign(payloadBuf, privateKey));
}
function verifyPayload(sigHex, payloadBuf, pubHex) {
  // Same accept-set-preserving backend as input signatures (perf brief 1B):
  // native fast path on acceptance, fallback authoritative on rejection.
  let pubBytes, sigBytes;
  try {
    pubBytes = Buffer.from(pubHex, 'hex');
    sigBytes = Buffer.from(sigHex, 'hex');
  } catch {
    return false;
  }
  return _backendVerify(pubBytes, payloadBuf, sigBytes);
}

// ---------- verifiable randomness (spec §7) ----------

function beaconValue(genesisSeed, tick) {
  return sha256(Buffer.concat([
    Buffer.from('beacon'),
    Buffer.from(genesisSeed),
    Buffer.from(String(tick)),
  ]));
}

// v0.38: the lots are drawn from the citizens' own deeds. The old beacon
// was a pure function of public constants: every roll for all eternity
// was computable at genesis. The lots were face-up. Now each tick's
// beacon folds in the digest of the inputs actually applied, then walks
// a sequential hash chain too long to outrun inside a tick. Predicting
// tomorrow's roll requires knowing today's deeds first, and your own
// deed reshuffles the very lots you were trying to read. Verification
// is recomputation, which is what a witness already does all day.
const LOTS_N = 20000; // sequential hashes per tick: the delay
function inputsDigest(inputs) {
  const sigs = inputs.map((i) => i.sig ?? '').sort();
  return sha256(Buffer.from('deeds' + JSON.stringify(sigs)));
}
function delayChain(prevBeacon, digest) {
  // PURE in (prevBeacon, digest): a bounded memo changes no output ever.
  // Every witness computes the SAME chain for the same proposed bundle ,
  // once when attesting, again when replaying a finality record, and an
  // in-process multi-node simulation computes it once per node. Cache it.
  const key = prevBeacon.toString('hex') + '|' + digest.toString('hex');
  const hit = delayChain._memo.get(key);
  if (hit) return hit;
  let h = sha256(Buffer.concat([prevBeacon, digest]));
  for (let i = 1; i < LOTS_N; i++) h = sha256(h);
  if (delayChain._memo.size >= 128) delayChain._memo.delete(delayChain._memo.keys().next().value);
  delayChain._memo.set(key, h);
  return h;
}
delayChain._memo = new Map();

// v0.39, the Reading Rule: chance may only judge deeds whose lots are
// not yet drawn. The beacon for tick T is public DURING T (drawn at
// T-1's close), so any instant deed judged by it can be pre-read and
// timed: perfect cooking from level 1 by waiting for kind ticks.
// Instant deeds are therefore judged by COUNTING: a Bresenham
// accumulator that grants successes at exactly the constitutional
// rate, in a fixed order no timing can bend. Same curve, no dice.
// countedSuccess(n, q256): true iff attempt n (1-based) crosses a new
// multiple of the rate q/256. Over any window the success count is
// floor(n*q/256): the promised rate, exactly, with zero variance.
// The tally's denominator. It was 256, an eight-bit rate, whose rarest
// expressible drop was one in 256: too common for a best-in-world thing, and
// there was no way to say "one in a thousand" at all. Widened to 65536 (v0.64)
// so rarity has room. Rates given out of 256 are scaled by DROP_DEN/256.
const DROP_DEN = 65536;
function countedSuccess(n, q, den = 256) {
  return Math.floor((n * q) / den) > Math.floor(((n - 1) * q) / den);
}

function roll(beacon, playerId, tag) {
  return sha256(Buffer.concat([
    beacon,
    Buffer.from(playerId),
    Buffer.from(tag),
  ]))[0]; // uniform integer in [0, 255]
}

// §6bb: A WIDER LOT, BECAUSE ONE BYTE CANNOT SAY 'RARE'.
//
// `roll` reads a single byte, so the rarest a per-interval event can be is one
// in two hundred and fifty-six -- about two and a half minutes. Everything in
// this world that is genuinely scarce is scarce by DROP CHANCE out of 65,536
// (the old-chain is two), and a gathered thing had no way to be.
//
// Two bytes of the same hash, BIG-ENDIAN, which is written here in words as
// well as in code because it is the whole of the compatibility surface: a
// second implementation that reads them the other way round agrees with this
// one on nothing. High byte first, low byte second, no arithmetic but a shift
// and an or -- integers only, per 2m, and nothing a floating point unit could
// disagree about.
//
// `roll` is untouched. Every existing lot in this world draws the same byte it
// has always drawn, from the same hash; this reads one more byte of it under a
// different tag.
function roll16(beacon, playerId, tag) {
  const h = sha256(Buffer.concat([
    beacon,
    Buffer.from(playerId),
    Buffer.from(tag),
  ]));
  return (h[0] << 8) | h[1]; // uniform integer in [0, 65535]
}

// ---------- genesis & world (spec §9) ----------
// Two peers are in the same world iff their genesis objects match.

// The canonical generator registry (rev7 §8): a founding record names its
// generator EXPLICITLY, so two deterministic generators can never be
// confused about which world a genesis founds.
const WORLD_GENERATORS = new Set(['interval-classic-v1', 'interval-expanse-v1', 'interval-expanse-v2', 'interval-expanse-v3', 'interval-expanse-v4', 'interval-expanse-v5', 'interval-expanse-v6']);

function makeGenesis(genesisSeed, rulesHash, anchorMs = 0, worldW = 320, worldH = 200,
                     worldGenerator = 'interval-classic-v1') {
  // the generator is a FOUNDING choice, not a fate: pass
  // 'interval-expanse-v1' here and the new world gets meandering
  // trails, seven settlements, and the great river. An existing world
  // cannot change (the genesis IS its identity) but the next one can.
  if (!WORLD_GENERATORS.has(worldGenerator))
    throw new Error('unknown worldGenerator: ' + worldGenerator)
  // rev7 §7: defaults are the CANONICAL world dimensions, the old 14x8
  // default predated the classic generator and misled (it is below the
  // generator's floor). Every field defaulted: a genesis with an
  // undefined member is not canonically encodable (see canonical()).
  // §2n: a founding names the engine that made it, if this node has declared
  // one. `declareEngine` is called by whoever loads the engine's own source.
  const _eh = engineHash();
  return { specVersion: SPEC_VERSION, rulesHash, genesisSeed, anchorMs, worldW, worldH,
    ...(_eh ? { engineHash: _eh } : {}),
           worldGenerator,
           // exploration (v0.50): calibrated for THIS world's geometry by its own
           // survey-sim. NOT a universal curve. A larger world founds its own.
           // DERIVED FROM THE WORLD, so it cannot go stale again. The note
           // above was right and was not followed: 1800 was calibrated for a
           // world of 320 x 200, whose far corner sat 189 tiles from spawn --
           // and the cap bit at 176, which just covered it. Tallyholm is
           // 896 x 512 and its furthest walkable tile is 447 tiles out, so
           // for four foundings more than half the island paid what a
           // middling walk paid, and nobody noticed because nothing said so.
           //
           // Souls arrive at the middle, so the furthest anywhere can be is
           // half the longer side. The cap is now exactly what that walk is
           // worth, whatever size the next world is.
           survey: { k: 8, base: 40, perTile: 10,
                     max: 40 + 10 * Math.ceil(Math.max(worldW, worldH) / 2) },
           // brewing (v0.51): a profession rate-limited by fermentation; constants
           // are THIS world's, in the founding record, a larger world tunes its own.
           // 6bm: THIRTEEN AND A HALF THOUSAND AN URN WAS A HUNDRED AND
           // EIGHTY HOURS TO NINETY-NINE -- the fastest mastery in the world by
           // a factor of five, and it cost TWO TENTHS OF ONE PER CENT of a
           // citizen's intervals. Brewing is meant to be rate-limited by
           // fermentation, and it was: the limit was simply set so high that
           // owning four urns was worth more than any trade anybody worked.
           //
           // Nine hundred an urn, eight urns, half an hour to ferment. The wait
           // is shorter and there is more of it going at once, so a brewer must
           // actually come back to their fire twice an hour instead of once --
           // and the rate lands at nine hundred hours, beside everything else.
           brew: { ferment: 3000, potCap: 8, xpPerBatch: 900, buildLogs: 4, buildOre: 2, decayTicks: 432000 },
           // hauling (v0.87 §11): weight over distance. DERIVED FROM THIS
           // WORLD'S GEOMETRY by haultune.mjs, exactly as survey's constants
           // are, and not a universal curve: a world half this size founds a
           // different `perTileSlot` from its own simulation.
           //
           // On the fifth expanse six stores make 510 drawn routes of one to
           // three legs, mean 641 tiles chebyshev, and a trip is that plus
           // about thirty intervals in town. 23 puts the FASTEST possible
           // line -- a full pack at the 3.00 cap -- at 118 hours, in line with
           // exploration and brewing, and leaves a hauler of logs at 354.
           //
           // THE MULTIPLIER IS A TABLE OF INTEGERS IN HUNDREDTHS, and it is a
           // table because §2m binds this world to + - * / and sqrt. The
           // shape it approximates is logarithmic in price, so the middle of
           // the ladder is alive rather than a choice between grain and
           // plates -- but a logarithm cannot be computed identically by two
           // implementations, and XP is an integer (§3.1). A table can.
           //
           // The CAP is the whole argument. Linear in price puts grain at
           // 0.01x and deletes bulk hauling; uncapped, it becomes the trap
           // §6k already names, where the efficient path to a skill is to
           // acquire the most valuable thing in the world. Three is enough to
           // make a plate caravan worth running and not enough to make it the
           // only thing worth running -- and production very nearly cancels
           // it anyway, since a pack of plates is a thousand intervals of
           // mining before it is a step of walking.
           // 6bs: TWELVE, not twenty-three -- the premium kept, its size cut.
           //
           // The multiplier is right (it pays for exposure; see haulMultFor).
           // The RATE it multiplied was not: at twenty-three a pack of star
           // plate over the median leg reached ninety-nine in 146 hours, the
           // fastest mastery in the world by a factor of six, while the same
           // walk carrying logs took 446. Risk should pay MORE than safety,
           // not more than everything.
           //
           // At twelve the plain cargo sits at 871 hours -- beside every other
           // trade -- and the dear cargo at 282, three times faster, which is
           // exactly the spread the mult table itself declares (100 to 300).
           // The premium is now the table's own number rather than the table's
           // number multiplied by a rate that was already too generous.
           haul: { perTileSlot: 12, legMin: 1, legMax: 3,
                   mult: { logs: 100, 'raw-fish': 100, bones: 100, arrows: 100, seeds: 100,
                           grain: 123, ore: 130, 'cooked-fish': 130, ale: 140, broth: 145,
                           'iron-hatchet': 155, 'iron-pickaxe': 155, 'wooden-bow': 150,
                           'iron-sword': 165, 'iron-helm': 160, 'iron-plate': 180,
                           'magic-stone': 175, 'deep-broth': 150, heartwood: 210,
                           'heartwood-bow': 250, 'horn-bow': 245, 'dragon-bones': 285,
                           'star-helm': 261, 'star-dagger': 250, 'star-spear': 270,
                           'star-sword': 283, 'star-maul': 290, 'star-plate': 300 } },
           // watchfires (v0.53): high-tier Firemaking as public infrastructure.
           // A BEACON IS A PUBLIC WORK, NOT A LADDER.
           //
           // At two hundred a log the watchfire paid EIGHT TIMES what the very
           // logs it eats pay in woodcutting, and five times an ordinary fire:
           // thirty-seven hours to ninety-nine against two hundred and
           // ninety-five for the axe that fed it. It was not a way of doing
           // firemaking, it was the only way, and it broke the rule the rest of
           // this world keeps -- a master gets MORE from an hour, never a
           // shorter road.
           //
           // Sixty a log: half again an ordinary fire, which is a fair premium
           // for tending a thing the whole country can see and which costs ten
           // logs to raise. About a hundred and twenty hours to ninety-nine,
           // in line with everything else here.
           //
           // And the gate moves to eighty. At sixty it opened after four hours
           // of ordinary fires, so almost the whole skill was watchfire. At
           // eighty it takes about twenty-eight, and the beacon is what a
           // practised firekeeper graduates to rather than what everyone does.
           // 6bg: xpPerLog 20, the same twenty a log pays anywhere. The beacon
           // is a PLACE, not a rate -- what it gives that a field fire cannot
           // is that the whole country can see it, and that somebody has to be
           // standing there.
           watch: { level: 80, kindleLogs: 10, perLog: 300, cap: 6000, xpPerLog: 20, burnXp: 1, maxOwned: 2, decayTicks: 432000 } };
}

// Fix brief §2.1: the world identifier is the hash of the COMPLETE
// canonical genesis, seed, anchor, dimensions, imports, everything
// consensus-relevant. A constitution prefix identifies rules; this
// identifies one exact founded world. Never truncated for protocol use;
// a short prefix is display-only.
function worldId(genesis) {
  return sha256(Buffer.from(canonical(genesis))).toString('hex');
}

// ---------- identity persistence: your key IS your character ----------

function exportIdentity(identity) {
  return { playerId: identity.playerId, privateKey: hex(identity.privateKey) };
}

function importIdentity(obj) {
  if (!obj || typeof obj !== 'object') throw new Error('not an identity object');
  if (typeof obj.playerId !== 'string' || !/^[0-9a-f]{64}$/.test(obj.playerId)) throw new Error('malformed playerId');
  if (typeof obj.privateKey !== 'string' || !/^[0-9a-f]+$/.test(obj.privateKey)) throw new Error('malformed privateKey');
  const privateKey = Buffer.from(obj.privateKey, 'hex');
  const id = { playerId: obj.playerId, privateKey };
  // a 32-byte secret must actually produce the claimed public key
  if (privateKey.length === 32 && (ensureEdHash(), hex(ed.getPublicKey(privateKey))) !== obj.playerId)
    throw new Error('private key does not match playerId');
  return id;
}

function loadOrCreateIdentity(fs, file) {
  // rev6 §8: three cases, never blurred. MISSING → create. A SUPPORTED
  // legacy format → migrate (preserved aside). CORRUPT → refuse startup:
  // silently regenerating a key silently loses the identity it named ,
  // for a witness key, that is losing a founding role forever.
  if (fs.existsSync(file)) {
    let parsed;
    try { parsed = JSON.parse(fs.readFileSync(file)) } catch (e) {
      engineThrow(ENGINE_ERR.CORRUPT_IDENTITY, `identity file ${file} is corrupt (${e.message}) refusing to regenerate over it; restore it from backup or remove it EXPLICITLY to mint a new identity`);
    }
    let id;
    try { id = importIdentity(parsed) } catch (e) {
      engineThrow(ENGINE_ERR.CORRUPT_IDENTITY, `identity file ${file} is not a usable identity (${e.message}) refusing to regenerate over it; restore or remove it explicitly`);
    }
    if (id.privateKey.length === 32) return id; // raw ed25519 secret
    // pre-noble pkcs8 format: a SUPPORTED migration, preserve and re-mint
    fs.renameSync(file, file + '.old-format');
  }
  const id = generateIdentity();
  fs.writeFileSync(file, JSON.stringify(exportIdentity(id)));
  return id;
}

function newWorld(genesis) {
  return {
    genesis,
    tick: 0,
    players: {},
    nodes: {},
    names: {},
    mobs: {},
    ground: {},
    markers: [],
  };
}

function sameWorld(a, b) {
  return canonical(a.genesis) === canonical(b.genesis);
}

// ---------- state validation (final-fixes brief, Priority 1/4) ----------
// A checkpoint is untrusted bytes until proven otherwise. Two layers:
// consensus-critical structures (coordinates, hp, skills, inventory, bank,
// equipment, ground, mobs, nodes, names, genesis) are validated strictly,
// field by field, against the shapes the engine actually writes; every
// remaining gameplay field passes a bounded-value walk (safe integers,
// short strings, shallow objects) so no field (present or future) can
// smuggle in NaN, giant blobs, or unencodable types. Returns error|null.
const MAX_ENTITIES = 100000;
const MAX_XP = 1e12;
const MAX_QTY = 1e12;
const MAX_TIME = 1e15;             // ticks/ms fields
const MAX_STATE_BYTES = 16 * 1024 * 1024;
const HEX64 = /^[0-9a-f]{64}$/;
const isInt = (v, lo, hi) => Number.isSafeInteger(v) && v >= lo && v <= hi;
const CHART_PREFIX = 'chart:';
const isChart = (v) => typeof v === 'string' && /^chart:[a-z0-9_-]{1,64}$/i.test(v); // a portable waystone attunement
// §6ax: THE WAYFARER'S HOOD, and why it is a family rather than an item.
//
// Every other object in this world is fungible: one log is any log. A hood is
// not. It carries the id of the citizen it was given to and the tick it was
// given on, forever, through every trade and every death, and that is the
// whole of what it is worth -- it has no defence, no keeper price, and no use.
//
// This is the answer to a problem the architecture cannot otherwise solve.
// There is no operator to end a supply and no forgetting to thin one, so any
// fungible rare accumulates without bound and is hoarded from the day its
// rule is read. A thing that is not fungible does not care: there is no market
// in "a hood", only N markets of one, and nobody can corner what nobody can
// substitute. Value is decided years after issue, by whose name is on it,
// which is a fact about history and cannot be front-run.
//
// The id stores the KEY, never the name. Names are claimed later and windows
// resolve them at read time (§5a keeps a name forever, even for the archived),
// so a citizen who takes a name in year three is retroactively legible on
// every hood they ever earned -- including the ones they traded away.
const isHood = (v) => typeof v === 'string' && /^hood:[0-9a-f]{64}:[0-9]{1,15}$/.test(v);
const hoodOf = (v) => { const m = /^hood:([0-9a-f]{64}):([0-9]{1,15})$/.exec(v || ''); return m ? { pid: m[1], tick: +m[2] } : null; };
const hoodFor = (pid, tick) => 'hood:' + pid + ':' + tick;
const isItemName = (v) => typeof v === 'string' && (ITEMS.has(v) || isChart(v) || isHood(v)); // membership, not just shape (rev5 §4)
const isSlot = (s) => s === null || (s && typeof s === 'object'
  && isItemName(s.item) && isInt(s.qty, 1, MAX_QTY));

// generic sanity for gameplay fields not strictly enumerated:
// bounded numbers, bounded strings, shallow bounded containers
function boundedValue(v, depth = 0) {
  if (v === null || typeof v === 'boolean') return null;
  if (typeof v === 'number') return Number.isSafeInteger(v) && Math.abs(v) <= MAX_TIME ? null : 'unbounded number';
  if (typeof v === 'string') return v.length <= 256 ? null : 'oversized string';
  if (depth >= 6) return 'over-deep value';
  if (Array.isArray(v)) {
    if (v.length > 4096) return 'oversized array';
    for (const x of v) { const e = boundedValue(x, depth + 1); if (e) return e; }
    return null;
  }
  if (typeof v === 'object') {
    const keys = Object.keys(v);
    if (keys.length > 256) return 'oversized object';
    for (const k of keys) {
      if (k.length > 64) return 'oversized key';
      const e = boundedValue(v[k], depth + 1); if (e) return e;
    }
    return null;
  }
  return 'unsupported type';
}

// Genesis validated independently (brief §9): it is consensus identity.
// ---- §2n: THE ENGINE IS PART OF THE CONSTITUTION ----
//
// `rulesHash` binds SPEC.md, which is prose ABOUT the rules. This binds the
// rules. Two nodes running different engines are running different worlds
// whatever any other hash says, and refusing to check it does not prevent
// that fork -- it only delays the discovery from the handshake to whenever
// somebody happens to exercise the difference. Measured: the same signed
// input, one tick, produced smithing xp 40 on one build and NaN on another,
// with both agreeing on every other hash they check.
//
// NORMALISATION. Hashing the raw file would mean a typo fixed in a COMMENT
// forks the world, which is absurd enough that people work around it, and a
// worked-around rule is worse than no rule. So comments and runs of
// whitespace are removed first.
//
// It strips from `//` to end of line WHEREVER it appears, including inside
// string literals. That is wrong as a parser and correct as a hash: the only
// property required is that every node computing it over the same bytes gets
// the same answer.
//
// This does not need to preserve meaning -- it is never executed, only
// hashed. It needs only to be DETERMINISTIC, so that every node computing it
// over the same bytes gets the same answer. A `//` inside a string literal
// being treated as a comment is harmless: it is treated that way everywhere.
// set once at startup by whoever loads the engine's own source; null until
// then, so a node that never declares its build simply is not checked
let _ENGINE_HASH = null;
function declareEngine(src) { _ENGINE_HASH = engineHashOf(src); return _ENGINE_HASH; }
function engineHash() { return _ENGINE_HASH; }
function normaliseSource(src) {
  return String(src)
    .replace(/\/\*[\s\S]*?\*\//g, ' ')      // block comments
    .replace(/\/\/[^\n]*/g, ' ')              // line comments, wherever they start
    .replace(/\s+/g, ' ')                    // every run of space is one space
    .trim();
}
function engineHashOf(src) { return sha256(Buffer.from(normaliseSource(src), 'utf8')).toString('hex'); }

const GENESIS_REQUIRED = ['specVersion', 'rulesHash', 'genesisSeed', 'anchorMs', 'worldGenerator', 'worldW', 'worldH'];
const GENESIS_OPTIONAL = new Set(['engineHash', 'witnesses', 'quorum', 'byzantineTolerance', 'imported', 'importedFrom', 'survey', 'brew', 'watch', 'geo', 'geographyHash', 'founderKey', 'gearReqs', 'events', 'gather', 'stallsLineRoads', 'alchWhere', 'haul', 'toolGated', 'newcomerGold', 'waystoneStandingReq', 'anchorIsWildsEscape']);

// Does THIS implementation support the named generator? (pre-freeze §9:
// a separate question from structural validity, the seam matters once
// alternate deterministic generators exist.)
function supportsWorldGenerator(name) { return WORLD_GENERATORS.has(name); }

// The constitutional quorum mathematics (Byzantine Safety Upgrade), in one
// place. Given a witness count n and a Byzantine threshold f, the minimum
// safe quorum is 2f+1, and n must be at least 3f+1. `maxByzantine(n)` is the
// largest f a set of n witnesses can tolerate: floor((n-1)/3).
// The minimum Byzantine-safe quorum for n witnesses tolerating f faults.
// Two constraints bind: q >= 2f+1 (a quorum must outnumber the Byzantine
// witnesses it might contain by a majority), AND 2q-n > f, i.e.
// q > (n+f)/2 (any two quorums intersect in > f witnesses). The second
// dominates once n > 3f+1, so 2f+1 alone is unsafe for non-minimal witness
// sets, take the max of both floors.
function minQuorumFor(n, f) {
  return Math.max(2 * f + 1, Math.floor((n + f) / 2) + 1);
}
function maxByzantine(n) { return Math.floor((n - 1) / 3); }
function byzantineSafe(n, q, f) {
  return Number.isInteger(n) && Number.isInteger(q) && Number.isInteger(f)
    && f >= 0 && q >= 1 && q <= n && n >= 3 * f + 1 && q >= 2 * f + 1 && (2 * q - n) > f;
}

function validateGenesis(g) {
  if (!g || typeof g !== 'object') return 'genesis not an object';
  // pre-freeze §7: an EXACT schema, a key execution ignores still changes
  // the worldId, minting a distinct founding identity with identical
  // behavior. One founding record, one representation.
  for (const k of GENESIS_REQUIRED) if (!(k in g)) return `genesis missing ${k}`;
  for (const k of Object.keys(g)) if (!GENESIS_REQUIRED.includes(k) && !GENESIS_OPTIONAL.has(k)) return `unknown genesis field ${k}`;
  if (g.geographyHash !== undefined && (typeof g.geographyHash !== 'string' || !/^[0-9a-f]{64}$/.test(g.geographyHash))) return 'genesis.geographyHash must be a 64-hex digest';
  {
    // constitutional geography (v0.80): a generator that declares a
    // geography hash makes its island part of the world's identity. If we
    // implement that generator, the founding record MUST carry the hash and
    // it MUST match the island we draw. A stranger running different geology
    // under the same name is a different world by worldId, refused here at
    // the door rather than discovered at tick 1. Generators that declare no
    // hash (the classic family) stay name-committed, and old worlds are
    // untouched.
    const _t = TERRAINS[g.worldGenerator];
    if (!(_t && _t._isProbing && _t._isProbing())) { // not mid, self-build
      const ours = geographyHashOf(g);
      if (ours !== null) {
        if (g.geographyHash === undefined) return `genesis for ${g.worldGenerator} must commit its geography hash`;
        if (ours !== g.geographyHash) return `geography mismatch: this node draws ${ours.slice(0, 16)} but the founding committed ${g.geographyHash.slice(0, 16)}`;
      }
    }
  }
  if (g.survey !== undefined) {
    const sv = g.survey;
    if (!sv || typeof sv !== 'object' || Object.keys(sv).sort().join(',') !== 'base,k,max,perTile') return 'non-constitutional genesis.survey';
    for (const sk of ['k', 'base', 'perTile', 'max']) if (!isInt(sv[sk], 0, 1e9)) return `genesis.survey.${sk} out of bounds`;
  }
  if (g.founderKey !== undefined) {
    // the founder's public-key prefix, cut into the First Tally. A committed
    // fact of the world, so every client shows the same mark and it cannot
    // drift. A lowercase hex string, 8 to 64 chars (a prefix or a whole key).
    if (typeof g.founderKey !== 'string' || !/^[0-9a-f]{64}$/.test(g.founderKey)) return 'non-constitutional genesis.founderKey'; // the FULL public key: 64 hex, not a grindable prefix
  }
  if (g.brew !== undefined) {
    const bw = g.brew;
    if (!bw || typeof bw !== 'object' || Object.keys(bw).sort().join(',') !== 'buildLogs,buildOre,decayTicks,ferment,potCap,xpPerBatch') return 'non-constitutional genesis.brew';
    for (const bk of ['ferment', 'potCap', 'xpPerBatch', 'buildLogs', 'buildOre', 'decayTicks']) if (!isInt(bw[bk], 0, 1e12)) return `genesis.brew.${bk} out of bounds`;
  }
  if (g.geo !== undefined) {
    const ge = g.geo;
    if (!ge || typeof ge !== 'object') return 'non-constitutional genesis.geo';
    for (const gk of Object.keys(ge)) if (!['city', 'wilds', 'norwick'].includes(gk)) return `unknown genesis.geo region ${gk}`;
    for (const gk of Object.keys(ge)) {
      const r = ge[gk];
      if (!r || typeof r !== 'object' || Object.keys(r).sort().join(',') !== 'x0,x1,y0,y1') return `non-constitutional genesis.geo.${gk}`;
      if (!isInt(r.x0, 0, g.worldW - 1) || !isInt(r.x1, 0, g.worldW - 1) || !isInt(r.y0, 0, g.worldH - 1) || !isInt(r.y1, 0, g.worldH - 1))
        return `genesis.geo.${gk} out of bounds`;
      if (r.x1 < r.x0 || r.y1 < r.y0) return `genesis.geo.${gk} is inside out`;
    }
  }
  if (g.watch !== undefined) {
    const wt = g.watch;
    if (!wt || typeof wt !== 'object' || Object.keys(wt).sort().join(',') !== 'burnXp,cap,decayTicks,kindleLogs,level,maxOwned,perLog,xpPerLog') return 'non-constitutional genesis.watch';
    for (const wk of ['level', 'kindleLogs', 'perLog', 'cap', 'xpPerLog', 'burnXp', 'maxOwned', 'decayTicks']) if (!isInt(wt[wk], 0, 1e12)) return `genesis.watch.${wk} out of bounds`;
  }
  // pre-freeze §8 + Byzantine upgrade: the witnessed-world triple ,
  // witnesses, quorum, byzantineTolerance, comes together or not at all.
  const witnessedKeys = ['witnesses', 'quorum', 'byzantineTolerance'].filter(k => k in g);
  if (witnessedKeys.length !== 0 && witnessedKeys.length !== 3)
    return 'witnesses, quorum, and byzantineTolerance must be supplied together';
  if (typeof g.specVersion !== 'string' || g.specVersion.length > 16) return 'bad specVersion';
  if (typeof g.rulesHash !== 'string' || !HEX64.test(g.rulesHash)) return 'bad rulesHash';
  // §2n: if the founding named an engine, this must BE that engine. A world
  // founded under one implementation cannot be continued under another --
  // that is not the same world, it only looks like one until somebody
  // exercises the difference.
  if (g.engineHash !== undefined) {
    if (typeof g.engineHash !== 'string' || !HEX64.test(g.engineHash)) return 'bad engineHash';
    if (_ENGINE_HASH !== null && g.engineHash !== _ENGINE_HASH)
      return 'engine mismatch: this world was founded under ' + g.engineHash.slice(0, 16)
        + '\u2026 and this node runs ' + _ENGINE_HASH.slice(0, 16) + '\u2026';
  }
  if (typeof g.genesisSeed !== 'string' || g.genesisSeed.length < 1 || g.genesisSeed.length > 128) return 'bad genesisSeed';
  if (!isInt(g.anchorMs, 0, MAX_TIME)) return 'bad anchorMs';
  if (typeof g.worldGenerator !== 'string' || g.worldGenerator.length > 64) return 'malformed world generator';
  if (!supportsWorldGenerator(g.worldGenerator)) return 'unknown world generator';
  // RECOGNISING a generator is not being able to COMPUTE one. WORLD_GENERATORS
  // is a static list of names this engine has heard of; TERRAINS is what has
  // actually been imported. A node with only v3 loaded passed this check for a
  // v4 world, then answered every terrain question with 'walkable'.
  //
  // classic-v1 registers nothing and needs nothing -- it has no impassable
  // terrain -- so it is the one name allowed through unregistered.
  if (!TERRAINLESS.has(g.worldGenerator) && TERRAINS[g.worldGenerator] === undefined)
    return 'worldgen ' + g.worldGenerator + ' is not registered on this node';
  if (!isInt(g.worldW, 1, 100000) || !isInt(g.worldH, 1, 100000)) return 'bad world dimensions';
  if (g.witnesses !== undefined) {
    if (!Array.isArray(g.witnesses) || g.witnesses.length < 1 || g.witnesses.length > 1024) return 'bad witness set';
    const seen = new Set();
    for (const w of g.witnesses) {
      if (typeof w !== 'string' || !HEX64.test(w)) return 'malformed witness key';
      if (seen.has(w)) return 'duplicate witness';
      seen.add(w);
    }
    const n = g.witnesses.length;
    const q = g.quorum;
    const f = g.byzantineTolerance;
    // Byzantine Safety Upgrade: 2q > n only guarantees quorums INTERSECT;
    // the intersection can be a single witness, and if that witness is
    // Byzantine and double-signs, conflicting certificates are possible.
    // The constitutional fault model fixes an explicit threshold f and
    // requires n >= 3f+1 AND q >= 2f+1. Then any two quorums intersect in
    //   |A| + |B| - n >= q + q - n = 2q - n >= (2(2f+1)) - (3f+1) ... 
    // more directly: 2q - n >= 2(2f+1) - n, and with n <= ... we require
    // 2q - n > f, so every intersection holds >= f+1 witnesses; since at
    // most f are Byzantine, at least one is honest. Combined with permanent
    // vote locks, conflicting certificates become impossible in-model.
    if (!Number.isInteger(f) || f < 0) return 'byzantineTolerance must be a nonnegative integer';
    if (!Number.isInteger(q) || q < 1 || q > n) return 'quorum out of range';
    if (n < 3 * f + 1) return `Byzantine-unsafe: need n >= 3f+1 (n=${n}, f=${f} requires n >= ${3 * f + 1})`;
    if (q < 2 * f + 1) return `Byzantine-unsafe: need q >= 2f+1 (q=${q}, f=${f} requires q >= ${2 * f + 1})`;
    if (2 * q - n <= f) return `Byzantine-unsafe: need 2q-n > f (2q-n=${2 * q - n}, f=${f})`;
  }
  if (g.importedFrom !== undefined) {
    // provenance for the import list: WHICH world, at WHICH attested
    // state, these citizens were carried from. The worldId commits to
    // it, so a founder cannot later claim a different source; anyone
    // holding the named world's certified state can recompute the
    // lived-citizen list and check it matches. An import WITHOUT this
    // field is unattested by construction, the founder's bare word ,
    // and wears that openly.
    const f = g.importedFrom;
    if (!f || typeof f !== 'object' || Object.keys(f).sort().join(',') !== 'stateHash,tick,worldId')
      return 'non-constitutional genesis.importedFrom';
    if (!/^[0-9a-f]{64}$/.test(f.worldId) || !/^[0-9a-f]{64}$/.test(f.stateHash)) return 'malformed importedFrom hashes';
    if (!isInt(f.tick, 0, MAX_TIME)) return 'importedFrom tick out of bounds';
    if (g.imported === undefined) return 'importedFrom without imported';
  }
  if (g.imported !== undefined) {
    const e = validateImports(g.imported);
    if (e) return e;
  }
  return null;
}

// Imported citizens are FOUNDING data: they enter the world before any
// input is ever validated, so they get a dedicated, complete validator
// (rev6 §2) IDs, names, skills, XP, HP, inventory, bank, equipment,
// quantities, item vocabulary, and cross-entry uniqueness.
const IMPORT_FIELDS = new Set(['pid', 'skills', 'name', 'hp', 'bank', 'inventory', 'weapon']);
function validateImports(imported) {
  if (!Array.isArray(imported) || imported.length > MAX_ENTITIES) return 'bad imports';
  const pids = new Set(), names = new Set();
  for (const imp of imported) {
    if (!imp || typeof imp !== 'object') return 'malformed import';
    for (const k of Object.keys(imp)) if (!IMPORT_FIELDS.has(k)) return `import carries unknown field ${k}`;
    if (typeof imp.pid !== 'string' || !HEX64.test(imp.pid)) return 'import carries a malformed player id';
    if (pids.has(imp.pid)) return 'duplicate imported player id';
    pids.add(imp.pid);
    if (imp.name != null) {
      if (!isValidName(imp.name)) return 'import carries a non-constitutional name';
      if (names.has(imp.name)) return 'duplicate imported name';
      names.add(imp.name);
    }
    if (imp.hp !== undefined && !isInt(imp.hp, 0, 100000)) return 'import hp out of bounds';
    if (imp.skills !== undefined) {
      if (!imp.skills || typeof imp.skills !== 'object') return 'malformed imported skills';
      for (const [sk, xp] of Object.entries(imp.skills)) {
        if (!SKILLS.includes(sk)) return 'import carries an unknown skill';
        if (!isInt(xp, 0, MAX_XP)) return 'import xp out of bounds';
      }
    }
    if (imp.inventory !== undefined) {
      if (!Array.isArray(imp.inventory) || imp.inventory.length > INV_SLOTS) return 'malformed imported inventory';
      for (const sl of imp.inventory) if (!isSlot(sl)) return 'malformed imported inventory slot';
    }
    if (imp.bank !== undefined) {
      if (!imp.bank || typeof imp.bank !== 'object') return 'malformed imported bank';
      if (Object.keys(imp.bank).length > 512) return 'imported bank exceeds bounds';
      for (const [it, q] of Object.entries(imp.bank)) {
        if (!ITEMS.has(it)) return 'import carries an unknown item';
        if (!isInt(q, 1, MAX_QTY)) return 'import quantity out of bounds'; // sparse banks (rev7 §5)
      }
    }
    if (imp.weapon !== undefined && imp.weapon !== null) {
      if (!isSlot(imp.weapon)) return 'malformed imported weapon';
      if (!isEquippable(imp.weapon.item)) return 'imported weapon is not equippable';
      if (slotOf(imp.weapon.item) !== 'weapon') return 'imported weapon belongs in a different slot';
    }
  }
  return null;
}

function validateState(state) {
  if (!state || typeof state !== 'object') return 'not an object';
  const gerr = validateGenesis(state.genesis);
  if (gerr) return gerr;
  const W = state.genesis.worldW, H = state.genesis.worldH;
  if (!isInt(state.tick, 0, Number.MAX_SAFE_INTEGER)) return 'bad tick';
  let totalEntities = 0;
  for (const key of ['players', 'nodes', 'mobs', 'ground', 'names']) {
    if (!state[key] || typeof state[key] !== 'object' || Array.isArray(state[key])) return `bad ${key} table`;
    const n = Object.keys(state[key]).length;
    if (n > MAX_ENTITIES) return `${key} count exceeds bounds`;
    totalEntities += n;
  }
  if (totalEntities > MAX_ENTITIES) return 'aggregate entity count exceeds bounds'; // rev5 §8

  // ---- constitutional tables (final brief §7): the validator accepts
  // exactly what THIS engine writes, nothing missing, nothing extra ----
  const SKILL_SET = SKILLS;                 // shared constitutional tables
  const NODE_TYPE_SET = new Set(NODE_TYPES);
const LANDMARK_KINDS = new Set([
  // the eight of the first founding
  'elder-tree', 'old-oak', 'standing-stone', 'broken-tower', 'sentinel',
  'drowned-bell', 'shipwreck', 'tally-half',
  // ---- and the nouns the world was short of ----
  //
  // Seventy per cent of everything a citizen walked past was a wall, a tree
  // or a rock: the island was DENSE and MONOTONOUS, four to six different
  // things within twenty tiles anywhere you stood. The answer is not more
  // trees; it is more KINDS.
  //
  // A landmark is the right vehicle and the safe one. No verb in the
  // constitution reaches it -- it cannot be worked, fought, lit or consumed
  // -- so a new kind can add texture to the world without adding a rule to
  // the world. That is why these are kinds and not node types: the verb set
  // is complete, the vocabulary was not.
  'table', 'bed', 'shelf', 'barrel', 'crate',      // things inside a room
  'stump', 'charcoal-clamp', 'log-pile',            // the wood, worked
  'spoil-heap', 'cut-face',                         // the quarry
  'bone-pile', 'crude-hearth',                      // what the Wilds leaves
  'gibbet', 'cart', 'haystack', 'hurdle',           // the road and the farm
  'eel-rack', 'sunken-wall',                        // the fen
  // ---- and the things that make a place a PLACE ----
  //
  // Seventy per cent of what a citizen passed was a wall, a tree or a rock,
  // so we added eighteen nouns and scattered them -- and made the same
  // mistake one layer up: a hundred and fifty-five stumps is not richness,
  // it is the same object a hundred and fifty-five times. A world reads as
  // GENERATED when it repeats, and as FOUND when it does not.
  //
  // The tick pays per NODE and nothing at all for how many kinds there are:
  // two thousand nodes across fifty kinds costs what two thousand of one
  // kind costs, measured. So the budget is better spent on more kinds and
  // fewer of each, and these are that.
  'scorched-ring', 'glass-stone', 'burnt-tree',     // where the dragon has been
  'mill',                                           // grain gets a face, and a landmark you steer by
  'milestone',                                      // the roads were routed; nothing showed it
  'scarecrow',                                      // a plot becomes a farm
  'barricade', 'siege-engine', 'cave-mouth',        // the crags, and the line before the Wilds
  // ---- things that were standing stones because nothing else existed ----
  //
  // Two hundred and seventy-four "standing stones" turned out to be EIGHT
  // DIFFERENT THINGS wearing one kind: beehives, cairns, boundary markers,
  // skull piles. They were drawn as stones because when they were placed
  // there was no other word for them, and the result was a world that looked
  // like it had one idea repeated to the horizon.
  //
  // Nothing about them changes except that they are now themselves.
  'skep', 'cairn', 'boundary-stone', 'skull-pile',
  'web',   // §6ab: what mends the spider
]); // (rev4 §11): defined ONCE, above
  const PLAYER_REQUIRED = ['x', 'y', 'skills', 'hp', 'equipment', 'bank', 'lastInput', 'gold', 'inventory', 'action', 'name', 'trade'];
  const PLAYER_OPTIONAL = new Set(['hooded', 'crops', 'attuned', 'brandedUntil', 'cooksTried', 'deadUntil', 'lightsTried', 'rootedUntil', 'rootImmuneUntil', 'rootCdUntil', 'stilledUntil', 'stillImmuneUntil', 'stillCdUntil', 'slain', 'lastSwing', 'lastAte', 'look', 'lastAlch', 'stillAt', 'deed', 'lastMend', 'shotsFired', 'consignment']);
  const isId = (v) => typeof v === 'string' && /^[a-z0-9_-]{1,96}$/i.test(v);

  // Relational rule (rev5 §5), decided explicitly: NO stale references are
  // constitutionally permitted. Mobs and players are permanent entries and
  // gather targets/waystones never expire (only fires do, and nothing holds
  // a persistent reference to a fire), so every reference must resolve.
  const validAction = (a, s2) => {
    if (a === null) return null;
    if (!a || typeof a !== 'object') return 'malformed action';
    const keys = Object.keys(a).sort();
    if (a.type === 'gather') {
      if (keys.join(',') !== 'nodeId,type' || !isId(a.nodeId)) return 'malformed gather action';
      if (!s2.nodes[a.nodeId]) return 'gather action references a missing node';
    } else if (a.type === 'attack') {
      if (keys.join(',') !== 'mobId,since,style,type' || !['even','aim','force'].includes(a.style) || !isId(a.mobId) || !isInt(a.since, 0, MAX_TIME)) return 'malformed attack action';
      if (!s2.mobs[a.mobId]) return 'attack action references a missing mob';
    } else if (a.type === 'attackp') {
      if (keys.join(',') !== 'since,style,targetId,type' || !['even','aim','force'].includes(a.style) || !HEX64.test(a.targetId ?? '') || !isInt(a.since, 0, MAX_TIME)) return 'malformed attackp action';
      if (!s2.players[a.targetId]) return 'attackp action references a missing player';
    } else if (a.type === 'raise') {
      // §6al: RAISING A STALL IS WORK, NOT A CLICK. It is an action so that
      // moving, swinging or being made to move cancels it -- which gives
      // "you cannot build one mid-fight" for free, and makes raising one in
      // the Wilds twenty intervals of standing still with two dozen items on
      // you, where anybody may arrive.
      if (keys.join(',') !== 'since,type' || !isInt(a.since, 0, MAX_TIME)) return 'malformed raise action';
    } else return 'unknown action type';
    return null;
  };

  const validTrade = (t, s2) => {
    if (t === null) return null;
    if (!t || typeof t !== 'object') return 'malformed trade';
    if (Object.keys(t).sort().join(',') !== 'giveItems,giveSlots,to,wantGold,wantItem') return 'malformed trade shape';
    if (typeof t.to !== 'string' || !HEX64.test(t.to)) return 'malformed trade partner';
    if (!s2.players[t.to]) return 'trade references a missing partner';
    // v0.69: a stored offer names one or more slots, ascending and unique, so
    // the same offer is the same bytes on every node
    if (!Array.isArray(t.giveSlots) || t.giveSlots.length === 0 || t.giveSlots.length > INV_SLOTS)
      return 'malformed trade slots';
    for (let i = 0; i < t.giveSlots.length; i++) {
      if (!isInt(t.giveSlots[i], 0, INV_SLOTS - 1)) return 'malformed trade slot';
      if (i > 0 && t.giveSlots[i] <= t.giveSlots[i - 1]) return 'trade slots must be ascending and unique';
    }
    // the advertised goods, one per named slot, in the same order
    if (!Array.isArray(t.giveItems) || t.giveItems.length !== t.giveSlots.length)
      return 'malformed trade goods';
    for (const gi of t.giveItems) {
      if (!gi || typeof gi !== 'object' || Array.isArray(gi)) return 'malformed trade good';
      if (Object.keys(gi).sort().join(',') !== 'item,qty') return 'malformed trade good shape';
      if (!isItemName(gi.item)) return 'malformed trade good item';
      if (!isInt(gi.qty, 1, MAX_QTY)) return 'malformed trade good qty';
    }
    if (t.wantItem !== null && !isItemName(t.wantItem)) return 'malformed trade item';
    if (!isInt(t.wantGold, 0, MAX_QTY)) return 'malformed trade gold';
    // rev7 §1: the SAME XOR invariant as validInput, a persisted trade
    // wants exactly one of an item or positive gold
    if ((t.wantItem !== null) === (t.wantGold > 0)) return 'trade must want exactly one of item or gold';
    return null;
  };

  for (const [pid, p] of Object.entries(state.players)) {
    if (!HEX64.test(pid)) return 'malformed player id';
    if (!p || typeof p !== 'object') return 'malformed player';
    for (const req of PLAYER_REQUIRED) if (!(req in p)) return `player missing ${req}`;
    for (const k of Object.keys(p))
      if (!PLAYER_REQUIRED.includes(k) && !PLAYER_OPTIONAL.has(k)) return `unknown player field ${k}`;
    if (!isInt(p.x, 0, W - 1) || !isInt(p.y, 0, H - 1)) return 'player out of bounds';
    // A LOOK IS A SEED, NOT A DESCRIPTION.
    //
    // One integer, and deliberately not a set of named features. A window that
    // had to be told "hair: brown" would be told in the lantern window's own
    // vocabulary -- and the holo window has no hair, the flat window has twelve
    // pixels, a terminal has a letter. So the world carries only WHICH person
    // this is, and every window says it in its own language. The engine never
    // reads it and nothing in the rules depends on it; it is here for the same
    // reason a name is: so that everyone looking at a citizen sees the same
    // citizen (spec 5a's own argument, applied to a face).
    // §11a: THE CONSIGNMENT IS STATE, so the validator must know its shape as
    // exactly as it knows a pack's. A container of twenty-eight slots per
    // citizen is real bytes in every checkpoint and every hash.
    if (p.consignment !== undefined && p.consignment !== null) {
      const c = p.consignment;
      if (!c || typeof c !== 'object') return 'malformed consignment';
      if (Object.keys(c).sort().join(',') !== 'from,items,leg,route') return 'malformed consignment';
      if (!isId(c.from)) return 'malformed consignment origin';
      if (!Array.isArray(c.route) || c.route.length < 1 || c.route.length > 8
        || !c.route.every(isId) || new Set(c.route).size !== c.route.length)
        return 'malformed consignment route';
      if (!isInt(c.leg, 0, c.route.length)) return 'consignment leg out of bounds';
      if (!Array.isArray(c.items) || c.items.length !== INV_SLOTS) return 'malformed consignment items';
      let filled = 0;
      for (const sl of c.items) {
        if (sl === null) continue;
        if (!sl || typeof sl !== 'object') return 'malformed consignment slot';
        if (Object.keys(sl).sort().join(',') !== 'item,qty') return 'malformed consignment slot';
        if (!isItemName(sl.item)) return 'contraband in a consignment';
        if (!isInt(sl.qty, 1, MAX_QTY)) return 'consignment qty out of bounds';
        filled++;
      }
      // §11b: an empty one cannot persist -- it would be attack-capability at
      // no cost, and §11d rests on that being impossible.
      if (filled === 0) return 'an empty consignment cannot stand';
    }
    if (p.look !== undefined && !isInt(p.look, 0, 255)) return 'look out of bounds';
    if (!isInt(p.hp, 0, 100000)) return 'player hp out of bounds';
    // skills: the COMPLETE constitutional set, exactly, a missing skill is
    // as hostile as an unknown one (both change transition behavior)
    if (!p.skills || typeof p.skills !== 'object') return 'player has no skills';
    const skeys = Object.keys(p.skills).sort();
    if (skeys.join(',') !== [...SKILL_SET].sort().join(','))
      return skeys.length < SKILL_SET.length ? 'missing skill' : 'unknown or duplicated skill';
    for (const sk of SKILL_SET) if (!isInt(p.skills[sk], 0, MAX_XP)) return 'xp out of bounds';
    // inventory: the exact constitutional slot count (28), always
    if (!Array.isArray(p.inventory) || p.inventory.length !== INV_SLOTS) return 'inventory length is not constitutional';
    for (const sl of p.inventory) if (!isSlot(sl)) return 'malformed inventory slot';
    if (!p.bank || typeof p.bank !== 'object') return 'malformed bank';
    if (Object.keys(p.bank).length > 512) return 'bank exceeds bounds';
    for (const [it, q] of Object.entries(p.bank)) {
      if (!isItemName(it)) return 'malformed bank item';
      if (!isInt(q, 1, MAX_QTY)) return 'bank quantity out of bounds'; // sparse: zero means the key is gone (rev7 §5)
    }
    // equipment: only the constitutional slots, all present
    if (!p.equipment || typeof p.equipment !== 'object') return 'malformed equipment';
    if (Object.keys(p.equipment).sort().join(',') !== [...EQUIP_SLOTS].sort().join(',')) return 'non-constitutional equipment slots';
    for (const eq of EQUIP_SLOTS) {
      const worn = p.equipment[eq];
      if (!isSlot(worn)) return 'malformed equipment slot';
      if (worn !== null) {
        // rev7 §2: the SHARED slotOf() decides where an item belongs ,
        // a helm in the weapon slot is as malformed as an unknown item
        if (!isEquippable(worn.item)) return 'equipped item is not equippable';
        if (slotOf(worn.item) !== eq) return `equipped item in the wrong slot (${worn.item} belongs in ${slotOf(worn.item)})`;
      }
    }
    if (p.name !== null && !isValidName(p.name)) return 'non-constitutional player name';
    if (!isInt(p.gold, 0, MAX_QTY)) return 'gold out of bounds';
    if (!isInt(p.lastInput, 0, MAX_TIME)) return 'lastInput out of bounds';
    const aerr = validAction(p.action, state); if (aerr) return aerr;
    const terr = validTrade(p.trade, state); if (terr) return terr;
    if (p.attuned !== undefined) {
      // 6ch: kept as a SHAPE so a citizen carried in from a world that had
      // stones still validates. It names nothing now and nothing reads it.
      if (!Array.isArray(p.attuned) || p.attuned.length > 64) return 'malformed attunements';
      for (const w of p.attuned) {
        if (!isId(w)) return 'malformed attunement';
      }
    }
    for (const tk of ['brandedUntil', 'deadUntil', 'rootedUntil', 'rootImmuneUntil', 'rootCdUntil', 'stilledUntil', 'stillImmuneUntil', 'stillCdUntil', 'lastSwing', 'lastAte', 'shotsFired']) if (p[tk] !== undefined && !isInt(p[tk], 0, MAX_TIME)) return `${tk} out of bounds`;
    // 6bg: these are now a tally PER ITEM (see the pan and the hearth), so the
    // validator has to know that too. A shape rule that lags the executor by
    // one revision is exactly how a state that runs becomes a state that will
    // not import -- and the keys are item names, checked, because a tally
    // against contraband is contraband.
    for (const ck of ['cooksTried', 'lightsTried']) {
      const tally = p[ck];
      if (tally === undefined) continue;
      if (typeof tally !== 'object' || tally === null || Array.isArray(tally)
        || Object.getPrototypeOf(tally) !== Object.prototype) return `${ck} must be a tally per item`;
      for (const [it, n] of Object.entries(tally)) {
        if (!ITEMS.has(it)) return `${ck} counts a non-constitutional item`;
        if (!isInt(n, 0, MAX_TIME)) return `${ck} out of bounds`;
      }
    }
    // §6o: A CROP BELONGS TO THE CITIZEN, NOT TO THE GROUND.
    //
    // What is sown was recorded on the PLOT — one `plantedAt`, one `by` — so
    // a plot was a thing exactly one person could use, and a citizen who
    // planted and never returned held that ground until it went over. With a
    // hundred and ninety plots and any number of citizens, farming was a
    // queue.
    //
    // It is recorded on the citizen now, in the same shape `attuned` already
    // uses: a bounded map from node id to the tick it was sown. Everyone can
    // work the same plot at the same time, each tending their own row, and
    // nobody can hold ground against anybody.
    if (p.crops !== undefined) {
      if (typeof p.crops !== 'object' || p.crops === null || Array.isArray(p.crops)) return 'malformed crops';
      const ck = Object.keys(p.crops);
      if (ck.length > CROP_CAP) return 'too many crops';     // 6bl: CROP_CAP, not a third copy of 32
      for (const k of ck) {
        if (!isId(k)) return 'malformed crop plot';
        if (!isInt(p.crops[k], 0, MAX_TIME)) return `crop ${k} out of bounds`;
      }
    }
    if (p.slain !== undefined) { // the loot tally: bounded by the roster, not by time
      if (typeof p.slain !== 'object' || p.slain === null || Array.isArray(p.slain)) return 'malformed slain tally';
      const keys = Object.keys(p.slain);
      if (keys.length > 64) return 'slain tally too large';
      for (const k of keys) if (!isInt(p.slain[k], 0, MAX_TIME)) return `slain.${k} out of bounds`;
    }
  }

  // mobs: constitutional type table, exact field set
  for (const [mid, m] of Object.entries(state.mobs)) {
    if (!/^[a-z0-9_-]{1,96}$/i.test(mid)) return 'malformed mob id';
    if (!m || typeof m !== 'object') return 'malformed mob';
    if (typeof m.type !== 'string' || !(m.type in MOB_STATS)) return 'unknown mob type';
    for (const rk of ['hp', 'hx', 'hy', 'respawnAt', 'type', 'x', 'y']) if (!(rk in m)) return 'mob missing ' + rk;
    // §6aa: a beast that acts on its own needs two things it never needed
    // while it only ever answered a blow -- a clock of its own, so its swing
    // rate is its own and not the citizen's, and a memory of who hit it, so a
    // passive creature still fights back.
    for (const mk of Object.keys(m)) if (!['hp', 'hx', 'hy', 'respawnAt', 'type', 'x', 'y', 'rootedUntil', 'rootImmuneUntil', 'stilledUntil', 'stillImmuneUntil', 'stillAt', 'lastSwing', 'mad', 'bound', 'quiver',
      // §6ao (v6): the incursion carries a scaled body and its bounds -- a
      // maxHp and def scaled to its target, the tick it must be gone by, its
      // leash and the tile it came from. Only an 'incursion' may bear them.
      'maxHp', 'def', 'goneBy', 'leash', 'spawnX', 'spawnY', 'face',
      // §6ao (v6): the Gibbet King's clock (lastRaise) and the mark a risen
      // carries back to the King who called it (raisedBy).
      'lastRaise', 'raisedBy'].includes(mk)) return 'non-constitutional mob field ' + mk;
    for (const ik of ['maxHp', 'def', 'goneBy', 'leash', 'spawnX', 'spawnY', 'face']) if (m[ik] !== undefined && m.type !== 'incursion') return 'only an incursion bears ' + ik;
    if (m.lastRaise !== undefined && m.type !== 'gibbet-king') return 'only the Gibbet King raises';
    if (m.raisedBy !== undefined && m.type !== 'risen') return 'only a risen is raised';
    for (const ik of ['goneBy']) if (m[ik] !== undefined && !isInt(m[ik], 0, MAX_TIME)) return 'incursion ' + ik + ' out of bounds';
    for (const ik of ['maxHp', 'def', 'leash', 'spawnX', 'spawnY']) if (m[ik] !== undefined && !isInt(m[ik], 0, 200000)) return 'incursion ' + ik + ' out of bounds';
    for (const tk of ['rootedUntil', 'rootImmuneUntil', 'stilledUntil', 'stillImmuneUntil', 'lastSwing']) if (m[tk] !== undefined && !isInt(m[tk], 0, MAX_TIME)) return 'mob ' + tk + ' out of bounds';
    if (m.mad !== undefined && (typeof m.mad !== 'string' || !/^[0-9a-f]{64}$/.test(m.mad))) return 'malformed mob grudge';
    // §6ac: whom she has taken, and the arrows she took with them
    if (m.bound !== undefined && (typeof m.bound !== 'string' || !/^[0-9a-f]{64}$/.test(m.bound))) return 'malformed siren binding';
    if (m.quiver !== undefined && !isInt(m.quiver, 0, 100000)) return 'siren quiver out of bounds';
    if (!isInt(m.x, 0, W - 1) || !isInt(m.y, 0, H - 1)) return 'mob out of bounds';
    if (!isInt(m.hx, 0, W - 1) || !isInt(m.hy, 0, H - 1)) return 'mob home out of bounds';
    if (!Number.isSafeInteger(m.hp) || m.hp < -1000 || m.hp > 100000) return 'mob hp out of bounds';
    if (!isInt(m.respawnAt, 0, MAX_TIME)) return 'mob respawn out of bounds';
  }

  // markers: bounded to the world's survey.k, each a well-formed point (v0.50)
  if (state.markers !== undefined) {
    if (!Array.isArray(state.markers)) return 'malformed markers';
    if (state.markers.length > SURVEY_K_MAX + 2) return 'too many markers';   // 6bq: k is derived per tick; the hard ceiling is what bounds the state
    for (const m of state.markers) {
      if (!m || typeof m !== 'object') return 'malformed marker';
      if (!isInt(m.x, 0, W - 1) || !isInt(m.y, 0, H - 1)) return 'marker out of bounds';
      if (!MARKER_KINDS.has(m.kind)) return 'bad marker kind';
      if (m.bornAt !== undefined && !isInt(m.bornAt, 0, MAX_TIME)) return 'marker bornAt out of bounds';
      if (m.kind === 'ws') return 'waystone rumours no longer exist';   // 6ch
      const allowed = 'bornAt,kind,x,y';
      if (Object.keys(m).sort().join(',') !== allowed) return 'non-constitutional marker fields';
    }
  }

  // nodes: constitutional type table, closed field set
  const NODE_FIELDS = new Set(['type', 'x', 'y', 'depletedUntil', 'expiresAt', 'plantedAt', 'by', 'text', 'readyAt', 'brewKind', 'lastUsed', 'fuelUntil', 'shelf', 'kind', 'founderKey', 'name', 'tag', 'coin', 'ask']);
  for (const [nid, n] of Object.entries(state.nodes)) {
    if (!/^[a-z0-9_-]{1,96}$/i.test(nid)) return 'malformed node id';
    if (!n || typeof n !== 'object') return 'malformed node';
    if (typeof n.type !== 'string' || !NODE_TYPE_SET.has(n.type)) return 'unknown node type';
    for (const k of Object.keys(n)) if (!NODE_FIELDS.has(k)) return `unknown node field ${k}`;
    if (n.kind !== undefined) {
      // a LANDMARK is a place, not a resource (v0.79): it cannot be
      // worked, fought, lit, or consumed, no verb in the constitution
      // reaches it. It blocks its tile like any node, and it exists so
      // that the map tells the truth. The kind names what stands there.
      // A STALL BEARS ONE TOO, and means something different by it: a
      // landmark's kind is what stands there, a stall's is what it sells.
      if (n.type === 'stall') {
        if (!STALL_KINDS.includes(n.kind)) return 'unknown trade';
      } else if (n.type === 'keeper') {
        // A KEEPER'S KIND IS WHAT THEY DO, and "keeper" is not a thing anybody
        // does. Fifty-nine of them stood about this island under one word --
        // beside the bank, beside the counter, in the delving, at the sheepfolds
        // -- and a window could say nothing better than "Keeper." Which is how
        // a hand-drawn world comes to read as a generated one.
        //
        // The roles are not invented here: they are read off what each already
        // stands next to and what their own id already called them.
        if (!KEEPER_KINDS.includes(n.kind)) return 'unknown calling';
      } else {
        if (n.type !== 'landmark') return 'only a landmark or a stall bears a kind';
        if (!LANDMARK_KINDS.has(n.kind)) return `unknown landmark kind ${n.kind}`;
      }
    }
    if (n.type === 'landmark' && n.kind === undefined) return 'a landmark must name its kind';
    if (n.founderKey !== undefined) {
      // the founder's mark rides only on a tally-half, and must equal the
      // key committed in the genesis: the monument cannot say a different
      // thing than the world was founded with (v0.80).
      if (n.type !== 'landmark' || n.kind !== 'tally-half') return 'only the First Tally bears the founder mark';
      if (n.founderKey !== state.genesis.founderKey) return 'tally founder mark disagrees with the genesis';
    }
    if (n.shelf !== undefined) {
      // §6al: and a stall a citizen raised, which keeps ONE good
      if (n.type !== 'store' && n.type !== 'market') return 'only a store or a stall keeps a shelf';
      if (typeof n.shelf !== 'object' || n.shelf === null || Array.isArray(n.shelf)) return 'shelf malformed';
      for (const [it, q] of Object.entries(n.shelf)) {
        if (!ITEMS.has(it)) return `shelf holds a thing that is not an item: ${it}`;
        if (!isInt(q, 1, SHELF_CAP)) return `shelf count out of bounds for ${it}`;
      }
    }
    if (!isInt(n.x, 0, W - 1) || !isInt(n.y, 0, H - 1)) return 'node out of bounds';
    if (!isInt(n.depletedUntil ?? 0, 0, MAX_TIME)) return 'node depletion out of bounds';
    // type-specific rules (rev6 §6): each field belongs to exactly the
    // node kinds the engine gives it to, ownership metadata on a static
    // resource node is as malformed as a fire that never expires
    if (n.expiresAt !== undefined) {
      if (n.type !== 'fire') return 'only fires expire';
      if (!isInt(n.expiresAt, 0, MAX_TIME)) return 'node expiry out of bounds';
    }
    if (n.type === 'fire' && n.expiresAt === undefined) return 'fire without expiry';
    if (n.type === 'brewpot') { // a brewpot is owned; it may be idle or fermenting (v0.51)
      if (typeof n.by !== 'string' || !HEX64.test(n.by)) return 'brewpot without an owner';
      if (!state.players[n.by]) return 'brewpot owner does not exist';
      if ((n.readyAt !== undefined) !== (n.brewKind !== undefined)) return 'brewpot half-fermenting';
      if (n.readyAt !== undefined && !isInt(n.readyAt, 0, MAX_TIME)) return 'brewpot readyAt out of bounds';
      // §6an: and the deep broth. A pot may hold any of the three; leaving it
      // out here would have let a master brew one and then found the world
      // unconstitutional the moment it did.
      if (n.brewKind !== undefined && n.brewKind !== 'ale' && n.brewKind !== 'broth'
          && n.brewKind !== 'deep-broth') return 'bad brewKind';
      if (n.lastUsed !== undefined && !isInt(n.lastUsed, 0, MAX_TIME)) return 'brewpot lastUsed out of bounds';
      if (n.plantedAt !== undefined) return 'brewpot carries plot metadata';
    } else if (n.type === 'watchfire') { // owned public light, fed by logs (v0.53)
      if (typeof n.by !== 'string' || !HEX64.test(n.by)) return 'watchfire without a keeper';
      if (!state.players[n.by]) return 'watchfire keeper does not exist';
      if (!isInt(n.fuelUntil ?? 0, 0, MAX_TIME)) return 'watchfire fuelUntil out of bounds';
      if (n.plantedAt !== undefined || n.readyAt !== undefined || n.brewKind !== undefined) return 'watchfire carries foreign metadata';
    } else if (n.type === 'market') { // §6al: a stall a citizen raised
      if (typeof n.by !== 'string' || !HEX64.test(n.by)) return 'a stall without a keeper';
      if (!state.players[n.by]) return 'stall keeper does not exist';
      if (!isInt(n.ask ?? 0, 0, 1e12)) return 'stall ask out of bounds';
      if (!isInt(n.coin ?? 0, 0, 1e12)) return 'stall takings out of bounds';
      if (n.shelf !== undefined) {
        if (Object.keys(n.shelf).length > 1) return 'a stall sells one good';
        for (const [it, q] of Object.entries(n.shelf)) {
          if (!ITEMS.has(it)) return 'unknown good on a stall';
          if (!isInt(q, 1, MARKET_STOCK)) return 'stall stock out of bounds';
        }
      }
      if (n.plantedAt !== undefined || n.readyAt !== undefined
          || n.brewKind !== undefined || n.fuelUntil !== undefined)
        return 'a stall carries foreign metadata';
    } else if (n.fuelUntil !== undefined) {
      return 'fuel on a non-watchfire node';
    } else if (n.readyAt !== undefined || n.brewKind !== undefined) {
      return 'brew metadata on a non-brewpot node';
    } else if (n.ask !== undefined) {
      return 'an ask on a node that is not a stall';
    } else if (n.plantedAt !== undefined || n.by !== undefined) {
      if (n.type !== 'plot') return 'ownership metadata on a non-plot node';
      if (n.plantedAt !== undefined && !isInt(n.plantedAt, 0, MAX_TIME)) return 'node planting out of bounds';
      if (n.plantedAt > 0) {
        if (typeof n.by !== 'string' || !HEX64.test(n.by)) return 'planted plot without an owner';
        if (!state.players[n.by]) return 'plot owner does not exist';
      } else if (n.by !== undefined) return 'unplanted plot carries an owner';
    }
    if (n.type === 'stall' && typeof n.kind !== 'string') return 'a stall must say what it sells';
    if (n.coin !== undefined) {
      if (n.type !== 'store' && n.type !== 'market') return 'only a keeper carries a purse';
      if (!isInt(n.coin, 0, PURSE_MAX)) return 'malformed purse';   // 6bn: float, not a capped tank
    }
    if (n.tag !== undefined) {
      // A BANNER BEARS A TOWN, AND NOTHING ELSE DOES.
      //
      // It carries which town it speaks for, and NOT what it looks like. The
      // arms are derived from the tag -- field, tincture, charge -- by whatever
      // rule each window keeps, exactly as an appearance is derived from a
      // look. Putting heraldry in the state would be writing one window's
      // vocabulary into the constitution, and a terminal has no tincture.
      //
      // What matters is that every window derives the SAME arms from the same
      // tag, so a citizen who learns Anchor's colours in one window still
      // knows them in another.
      if (n.type !== 'banner') return 'a tag on a node that bears none';
      if (typeof n.tag !== 'string' || !/^[a-z0-9-]{1,24}$/.test(n.tag)) return 'malformed banner tag';
    }
    if (n.text !== undefined) {
      // A SIGNPOST BEARS WORDS, AND SO DOES A STANDING STONE.
      //
      // Oberon's teaching stood on five signposts set around the Ring, which
      // is a plaque beside a megalith: the stones were there before him and
      // he intends to return the favour, and a wooden board is not how that
      // gets said. A stone is a thing you CARVE. So the words go into the
      // stones, and the ring is the teaching rather than a place with
      // notices in it.
      //
      // Only a standing stone: a cut-face or a spoil-heap bearing prose
      // would be somebody's graffiti, not the world's own voice.
      const carvable = n.type === 'signpost'
        || (n.type === 'landmark' && n.kind === 'standing-stone');
      if (!carvable) return 'text on a node that bears none';
      if (typeof n.text !== 'string' || n.text.length > 256) return 'malformed node text';
    }
    // A KEEPER BEARS A NAME.
    //
    // It bore one already -- keeperName() has hashed a name out of every
    // keeper's place and trade since the first founding -- but the name lived
    // in a FUNCTION the windows each called for themselves, and never in the
    // state. So a window that did not know the trick showed "the keeper", and
    // once the towns were hand-drawn the ids stopped matching the trick at
    // all: forty-five keepers on the island and not one of them named.
    //
    // A name is part of who stands there. It belongs in the world, where the
    // hash covers it and every window reads the same person.
    if (n.name !== undefined) {
      if (n.type !== 'keeper') return 'a name belongs to a keeper';
      if (typeof n.name !== 'string' || n.name.length < 1 || n.name.length > 32) return 'malformed keeper name';
    }
  }

  // §5g: the archive is ONE HASH. Not a list of who is in it -- the root
  // says nothing about who, only that whoever brings a path is telling the
  // truth. That is the whole reason it costs the tick nothing.
  // §6w: the world remembers whether the one bow is loose
  if (state.bowOut !== undefined && typeof state.bowOut !== 'boolean') return 'malformed bowOut';
  if (state.archiveRoot !== undefined) {
    if (typeof state.archiveRoot !== 'string' || !HEX64.test(state.archiveRoot))
      return 'malformed archive root';
  }

  // ground entries: OBJECTS with a closed field set, { item, qty?, x, y,
  // expiresAt }; qty is absent on mob drops
  for (const [gid, g] of Object.entries(state.ground)) {
    if (typeof gid !== 'string' || gid.length > 80) return 'malformed ground id';
    if (!g || typeof g !== 'object' || Array.isArray(g)) return 'malformed ground entry';
    for (const k of Object.keys(g)) if (!['item', 'qty', 'x', 'y', 'expiresAt'].includes(k)) return `unknown ground field ${k}`;
    if (!isItemName(g.item)) return 'malformed ground item';
    if (g.qty !== undefined && !isInt(g.qty, 1, MAX_QTY)) return 'ground quantity out of bounds';
    if (!isInt(g.x, 0, W - 1) || !isInt(g.y, 0, H - 1)) return 'ground item out of bounds';
    if (!isInt(g.expiresAt, 0, MAX_TIME)) return 'ground expiry out of bounds';
  }

  // names: validated in BOTH directions (brief §9) every registry entry
  // points at a player wearing that exact name, and every named player is
  // registered under it
  for (const [name, pid] of Object.entries(state.names)) {
    if (!isValidName(name)) return 'non-constitutional registered name';
    if (typeof pid !== 'string' || !HEX64.test(pid)) return 'name registry points at malformed id';
    const p = state.players[pid];
    if (!p) {
      // §5g: an ARCHIVED citizen keeps their name. They are absent, not
      // gone, and a name paid for with the toll in §5a does not fall vacant
      // because somebody took a fortnight off. The archive is a root and
      // cannot be enumerated, so the registry simply holds the name for
      // whoever proves they own it when they return.
      continue;
    }
    if (p.name !== name) return 'name registry disagrees with player';
  }
  for (const [pid, p] of Object.entries(state.players)) {
    if (p.name != null && state.names[p.name] !== pid) return 'named player missing from registry';
  }

  let enc;
  try { enc = canonical(state) } catch (e) { return 'not canonically encodable: ' + e.message }
  if (enc.length > MAX_STATE_BYTES) return 'serialized state exceeds bounds';
  return null;
}

function addPlayer(state, playerId, x, y) {
  state.players[playerId] = {
    x, y,
    skills: Object.fromEntries(SKILLS.map(sk => [sk, sk === 'hitpoints' ? HP_START_XP : 0])),
    hp: 10,
    equipment: Object.fromEntries(EQUIP_SLOTS.map((k) => [k, null])),   // 6bz: from the one list
    bank: {},
    lastInput: state.tick,
    // §6ao (v6): a newcomer wakes with just enough coin for ONE tool at the
    // market -- a bronze axe, a rod, or a pickaxe -- and nothing over. So the
    // first thing a citizen does is walk to Millbrook, CHOOSE a trade, buy the
    // tool, and start; and to buy the second tool they must gather and SELL the
    // first. It turns the empty-handed tree-hug outside the spawn into an
    // errand with a choice at the end of it. A world that omits this wakes
    // them penniless, as v1-v5 do.
    gold: state.genesis?.newcomerGold ?? 0,
    inventory: Array(INV_SLOTS).fill(null),
    consignment: null,   // §11a: the second container, which the bank cannot reach
    action: null,
    name: null,
    trade: null,
  };
}

function addMob(state, mobId, type, x, y) {
  state.mobs[mobId] = { type, x, y, hx: x, hy: y, hp: MOB_STATS[type].maxHp, respawnAt: 0 };
}

function addNode(state, nodeId, type, x, y, extra) {
  state.nodes[nodeId] = { type, x, y, depletedUntil: 0, ...(extra || {}) };
}

function firstFreeSlot(inv) {
  for (let i = 0; i < inv.length; i++) if (inv[i] === null) return i;
  return -1;
}

// ---------- shared inventory helpers (fix brief 7.5) ----------
// One vocabulary for every stack mutation. All deterministic; all mutate
// only through explicit calls. STACKABLE names the items that pool.
const STACKABLE = new Set(['shot', 'arrows', 'grain', 'seeds', 'ale', 'broth', 'deep-broth']);

function countItem(inv, item) {
  let n = 0;
  for (const sl of inv) if (sl?.item === item) n += sl.qty ?? 1;
  return n;
}

// Can this trade land whole? Counts the room the ACCEPTOR will have at the
// moment of the swap: the slot their own payment leaves behind is free by
// then, and a stackable item needs no slot at all if they already hold some.
// A trade that cannot land whole must not begin (§5c).
function tradeFits(offerer, acceptor, trade) {
  const slots = Array.isArray(trade.giveSlots) ? trade.giveSlots : [];
  if (!slots.length) return false;
  const incoming = [];
  const advertised = Array.isArray(trade.giveItems) ? trade.giveItems : null;
  if (!advertised || advertised.length !== slots.length) return false;
  for (let i = 0; i < slots.length; i++) {
    const it = offerer.inventory[slots[i]];
    if (!it) return false;                 // the offer no longer holds
    // §6q: and it must still be WHAT WAS ADVERTISED. Emptiness was already
    // guarded; substitution was not, which is the whole of the bait-and-
    // switch: the buyer paid for a star-sword and received a iron-dagger.
    if (it.item !== advertised[i].item || (it.qty ?? 1) !== advertised[i].qty) return false;
    incoming.push(it);
  }
  // a copy of what the acceptor's pack looks like once their payment leaves
  const inv = acceptor.inventory.slice();
  if (!trade.wantGold) {
    const j = inv.findIndex(sl => sl && sl.item === trade.wantItem);
    if (j === -1) return false;
    // v0.80: only ONE unit leaves. A stack of more than one keeps its slot
    // (and its remainder), so the slot frees only when the payment was the
    // last unit. tradeFits must see exactly the room the swap will make.
    if ((inv[j].qty ?? 1) > 1) inv[j] = { item: inv[j].item, qty: (inv[j].qty ?? 1) - 1 };
    else inv[j] = null;
  }
  let free = 0;
  for (const sl of inv) if (!sl) free++;
  const held = new Set(inv.filter(Boolean).map(sl => sl.item));
  for (const it of incoming) {
    if (STACKABLE.has(it.item) && held.has(it.item)) continue; // pools, no slot
    if (free === 0) return false;
    free--;
    held.add(it.item);
  }
  return true;
}

function canAddItem(inv, item) {
  if (STACKABLE.has(item) && inv.some(sl => sl?.item === item)) return true;
  return firstFreeSlot(inv) !== -1;
}

// Adds qty of item, merging into an existing stack for stackables.
// Returns true if fully added, false if nothing was added (never partial).
function addItem(inv, item, qty = 1) {
  if (STACKABLE.has(item)) {
    const i = inv.findIndex(sl => sl?.item === item);
    if (i !== -1) { inv[i].qty = (inv[i].qty ?? 1) + qty; return true; }
  }
  const slot = firstFreeSlot(inv);
  if (slot === -1) return false;
  inv[slot] = { item, qty };
  return true;
}

// Removes qty units of `item` across slots (stackable or not). Returns true if it took all qty.
function consumeItem(inv, item, qty) {
  let left = qty;
  for (let i = 0; i < inv.length && left > 0; i++) {
    if (inv[i]?.item === item) { const take = Math.min(left, inv[i].qty ?? 1); removeItem(inv, i, take); left -= take; }
  }
  return left === 0;
}

// Removes qty units from a slot; clears the slot when it empties.
// Returns true if the slot held at least qty units.
function removeItem(inv, slot, qty = 1) {
  const sl = inv[slot];
  if (!sl || (sl.qty ?? 1) < qty) return false;
  if ((sl.qty ?? 1) > qty) sl.qty -= qty;
  else inv[slot] = null;
  return true;
}

const atOrBeside = (p, n) => (p.x === n.x && p.y === n.y) || (Math.abs(p.x - n.x) + Math.abs(p.y - n.y) === 1); // on it, or orthogonally beside
function adjacent(p, n) { // orthogonal (§5): you face what you work
  return Math.abs(p.x - n.x) + Math.abs(p.y - n.y) === 1;
}

// ---------- input validation (spec §5) ----------
// v0.2: the state machine itself verifies signatures. An input with a
// bad or missing signature is invalid regardless of content.

function validInput(state, input, ctx) {
  if (validateInputShape(input) !== null) return false; // one canonical form per action (rev7 §4)
  if (!input || typeof input !== 'object') return false;
  if (input.tick !== state.tick) return false;
  // fix brief §2.3: an input signed for World A is meaningless in World B.
  // The worldId is inside the signed payload, so this check is enforced
  // by the signature itself, forging it invalidates the sig.
  if (input.worldId !== worldId(state.genesis)) return false;
  if (!verifyInputSig(input)) return false;
  const p = state.players[input.playerId];
  if (input.type === 'spawn') return !p; // §5b: the only input for unknown ids
  // §5g: a `restore` is the other input an unknown id may send -- unknown
  // because they were archived, which is the whole point. It carries the
  // record the world put away, and it is checked against the digest the
  // world kept. A forged record does not match and does nothing.
  if (input.type === 'restore') {
    if (p) return false;                                  // already present
    // NOTE: the path is NOT checked here. validInput judges every input
    // against the state as it stood when the tick opened -- which is right
    // for fairness everywhere else, and wrong for a merkle path, because
    // paths CHAIN: two archives in one tick each move the root, and the
    // second must answer to the root the first left behind.
    //
    // Checking it here let three citizens be archived in one tick into a
    // root that could prove none of them. They were not lost loudly; they
    // were lost silently, which is how merkle bugs are lost. The path is
    // verified at application time, against the live root, below.
    try { canonical(input.record); } catch { return false; }
    return true;
  }
  // §5g: archiving is a deed, not an event. Anyone may do it for a citizen
  // long absent, and the path they bring is what makes it verifiable by a
  // node that holds nothing but a root.
  if (input.type === 'archive') {
    const subj = state.players[input.subject];
    if (!subj) return false;                              // not here to archive
    if (state.tick - (subj.lastInput ?? 0) <= ARCHIVE_AFTER) return false;  // not absent enough
    if (!everWasSomebody(subj)) return false;             // the sweep forgets these instead
    return true;   // the path is checked against the LIVE root at application
  }
  if (!p) return false;
  if (p.hp <= 0) return false; // the dead act on nothing (v0.41)
  if ((p.stilledUntil ?? 0) > state.tick) return false; // the stilled cannot act (v0.80)
  const playerId = input.playerId; // the still case needs to refuse self-casts
  switch (input.type) {
    case 'move': {
      const { dx, dy } = input;
      if (![ -1, 0, 1 ].includes(dx) || ![ -1, 0, 1 ].includes(dy)) return false;
      const nx = p.x + dx, ny = p.y + dy;
      // the hedge is law (spec 2c): the outer ring is impassable
      if (nx < 1 || nx >= state.genesis.worldW - 1 || ny < 1 || ny >= state.genesis.worldH - 1) return false;
      // the water is law where the generator says so (terrain registry):
      // rivers and the sea bar the way, and their fords are law too
      if (terrainBlocked(state.genesis, nx, ny)) return false;
      // a living beast holds its tile (v0.79): you do not walk THROUGH a
      // troll, you deal with it, the troll bars the way. (Two bodies in
      // one square was how a fisher came to fight from inside a troll.)
      for (const m of Object.values(state.mobs)) if (m.hp > 0 && m.x === nx && m.y === ny) return false;
      // nodes are impassable (§5): you fish beside the water, not in it
      return !blockingNodeAt(state, ctx, nx, ny); // brewpots are walkable, no wall-ins (v0.52)
    }
    case 'gather': {
      const n = state.nodes[input.nodeId];
      if (!n || !(n.type in NODE_YIELD) || n.depletedUntil > state.tick || !adjacent(p, n)) return false;
      // 6bc: every gate, from ONE table. See NODE_GATE.
      const _g = NODE_GATE[n.type];
      if (_g && effLevel(p.skills[_g.skill]) < _g.level) return false;
      // §6ao (v6): A TOOL IN HAND. A founding may require the right tool to work
      // a node -- an axe for wood, a pickaxe for stone, a rod for fish -- so no
      // one gathers bare-handed and a newcomer's first act is to go buy one.
      // The tool may be HELD in the pack (not necessarily wielded); fishing has
      // always been possible barehanded elsewhere, but a tool-gated founding
      // asks for the rod too. A world that omits `toolGated` gathers as v1-v5 do.
      if (state.genesis.toolGated) {
        const y = NODE_YIELD[n.type];
        // 6bd: IN THE HAND, NOT IN THE PACK. The gate asked only that the axe
        // be CARRIED while the bonus asked that it be WIELDED, so a tool-gated
        // citizen could satisfy the law with an axe in the bottom of their bag
        // and cut at the bare-handed rate forever. Two rules about one tool
        // disagreeing about what holding it means.
        //
        // Wielded settles it, and it costs what a pickaxe already costs an
        // alchemist: a citizen working a seam is carrying no sword.
        const need = GATHER_TOOLS[y.skill];
        if (need && !need.has(p.equipment?.weapon?.item)) return false;
      }
      return true;
    }
    case 'cook': {
      const slot = p.inventory[input.slot];
      // §6ad: RAW IS RAW. This asked for 'raw-fish' by name, so every attempt
      // to cook a deep fish was refused at the door -- the apply path had been
      // taught about it and the validator had not. Two places that must agree
      // and only one of them was told, which is the same fault as the eat list
      // that could not hold `cooked-deep-fish`.
      if (!Number.isInteger(input.slot) || !slot || !isRawFood(slot.item)) return false;
      // beside the flame, or standing in it: walkable fires made the second
      // possible, and a citizen in a fire they cannot cook on is a trap
      return hasAdjacentNode(state, ctx, p, _FIRE_TYPES) || fireOnTile(state, ctx, p.x, p.y);
    }
    case 'stop':
      return true;
    // 6ch: THERE IS NO RECALL. The stones are gone; see the note over
    // NODE_TYPES. The case survives so an old client that still sends the
    // input is REFUSED rather than desynced -- a removed action must answer,
    // not vanish.
    case 'recall': return false;
    case 'drink': {
      // THE WELL. Every settlement has one and none of them did anything: it
      // was in NODE_TYPES and nowhere else in this file, decorative furniture
      // like `guard` and `smith`.
      //
      // It restores a citizen to full, and it has NO COOLDOWN, deliberately.
      // The cost is already in the world: a well stands in a town, a town is
      // tens of tiles from anywhere worth hunting, and movement is one tile per
      // interval. Walking home mid-fight is a minute of travel against food
      // that heals three to ten while you stand still. Nobody will ever choose
      // the walk. Guarding a behaviour nobody will exhibit costs a field in
      // every hash forever, and buys nothing.
      //
      // What it changes is not combat. It is that a town becomes somewhere you
      // RETURN to -- drink, restock, go out again -- instead of the place the
      // bank happens to be.
      return hasAdjacentNode(state, ctx, p, 'well');
    }
    case 'set_look': {
      // free, and changeable: a look is not a claim on anything. A name costs
      // fifty standing because names are scarce and permanent; there is only
      // one of each. Faces are not scarce.
      return isInt(input.look, 0, 255);
    }
    case 'claim_name': {
      // spec §5a: lowercase a-z0-9- (no leading/trailing -), 1-12 chars,
      // name unclaimed, claimant nameless, claimant has stood in the world
      const { name } = input;
      if (!isValidName(name)) return false; // ONE shared validator (rev5 §3)
      if (standingOf(p) < NAME_STANDING) return false; // v0.70: a name costs time
      return !(name in state.names) && p.name === null;
    }
    case 'offer_trade': {
      const t = state.players[input.to];
      if (!t || input.to === input.playerId) return false;
      // every named slot must actually hold something. An offer that promises
      // an empty slot is not a smaller offer, it is a malformed one.
      if (!Array.isArray(input.giveSlots) || input.giveSlots.length === 0) return false;
      for (const sl of input.giveSlots) if (!p.inventory[sl]) return false;
      // structural canonicality (both demand fields explicit, item XOR
      // positive gold) already passed the shape gate; this case is purely
      // state-dependent now (pre-freeze §4)
      return true;
    }
    case 'accept_trade': {
      const o = state.players[input.from];
      if (!o || !o.trade || o.trade.to !== input.playerId) return false;
      if (!adjacent(p, o)) return false;
      // a trade is whole or it does not happen (§5c), so the room must be
      // there BEFORE anything moves
      if (!tradeFits(o, p, o.trade)) return false;
      if (o.trade.wantGold) return (p.gold ?? 0) >= o.trade.wantGold;
      return p.inventory.some(s => s && s.item === o.trade.wantItem);
    }
    case 'cancel_trade':
      return p.trade !== null;
    case 'buy': {
      // §6al: A CITIZEN'S STALL FIRST, if you are stood at one and it has the
      // thing. It sells at whatever its owner asked -- no cap, because what a
      // thing is worth between two citizens is not the constitution's business
      // -- and the coin goes into the stall for the owner to collect.
      {
        const mk = findAdjacentNode(state, ctx, p, 'market');
        if (mk && (mk.shelf?.[input.item] ?? 0) > 0) {
          if (mk.by === input.playerId) return false;   // no buying from yourself
          // AN UNPRICED STALL SELLS NOTHING. `ask ?? 0` meant a stall raised
          // and stocked but never priced handed its stock out for free, which
          // is the opposite of what a citizen who spent a pack on it intended.
          if (!((mk.ask ?? 0) > 0)) return false;
          return (p.gold ?? 0) >= mk.ask && canAddItem(p.inventory, input.item);
        }
      }
      // §2b: A KEEPER WILL NOT DEAL WITH THE BRANDED.
      //
      // The Brand was evidence and nothing else -- fifteen minutes of a mark
      // that only existed if a window chose to paint one, and for four
      // foundings not one of them did. A rule that a window may quietly
      // decline to enforce is not a rule; it is a suggestion the engine makes
      // about art.
      //
      // So it costs exactly the thing a raider wants: an honest keeper in a
      // safe town knows what you did on the other side of the Brandline, and
      // will not take your money or your goods until the mark cools. You may
      // still bank, still walk, still fight. You simply cannot turn what you
      // took into anything, for fifteen minutes, in the daylight where
      // everybody can see you being refused.
      if ((p.brandedUntil ?? 0) > state.tick) return false;
      // v0.74: two things are for sale at a store. The keeper's own goods,
      // conjured from nothing (STORE_SELLS), and whatever citizens have sold
      // to THIS store and nobody has yet carried off.
      // A STALL FIRST, if you are stood at one AND it stocks the thing.
      //
      // The first version returned false when the stall did not stock it,
      // which meant a citizen standing between the seedsman and the store
      // could buy nothing from the store at all: the stall answered for both.
      // A trader who does not sell what you asked for does not stop you asking
      // the man next door.
      const sl = findAdjacentNode(state, ctx, p, 'stall');
      const stock = sl ? (STALL_SELLS[sl.kind] ?? {}) : null;
      if (sl && (input.item in stock)) {
        if ((p.gold ?? 0) < stock[input.item]) return false;
        if (!STACKABLE.has(input.item) && firstFreeSlot(p.inventory) === -1) return false;
        return true;
      }
      const st = findAdjacentNode(state, ctx, p, 'store');
      if (!st) return false;
      const onShelf = (st.shelf?.[input.item] ?? 0) > 0;
      if (!(input.item in STORE_SELLS) && !onShelf) return false;
      const price = onShelf && !(input.item in STORE_SELLS) ? storeAsk(input.item)
        : (input.item in STORE_SELLS) ? STORE_SELLS[input.item] : storeAsk(input.item);
      if ((p.gold ?? 0) < price) return false;
      if (!STACKABLE.has(input.item) && firstFreeSlot(p.inventory) === -1) return false;
      if (STACKABLE.has(input.item) && countItem(p.inventory, input.item) === 0
          && firstFreeSlot(p.inventory) === -1) return false;
      return true;
    }
    case 'attack': {
      const m = state.mobs[input.mobId];
      if (m && (m.stilledUntil ?? 0) > state.tick) return false; // the stilled cannot be struck (v0.80)
      if (!m || m.hp <= 0) return false;
      // §6ac: SHE TAKES ONE AT A TIME.
      //
      // Refused at the door rather than merely ignored, so a citizen learns
      // it from the world instead of from a health bar that will not move.
      // The binding releases when its citizen falls, leaves, or stops coming
      // -- see the mob phase -- so nobody can lock her by logging off.
      if (MOB_STATS[m.type]?.mirrors && m.bound !== undefined && m.bound !== input.playerId) return false;
      // §6w: SCALES TURN ARROWS -- and this has to be asked FIRST.
      //
      // It used to sit after `if (inReach(p, m)) return true`, and inReach
      // measures the WEAPON's reach: a dragonbow reaches nine, so an archer
      // nine tiles out was already "in reach", returned true, and never met
      // the immunity at all. The one creature that arrows cannot touch could
      // be shot to death from outside its own stride.
      // §6w: it can only be struck from a tile beside it, by anything.
      //
      // This read `&& drawnAt(p, m)`, which asks whether a BOW is drawn --
      // so a spear at reach 2 could still touch it. A spear is no exploit in
      // general (the beast retaliates at two tiles as hard as at one, tested)
      // but a dragon that can be poked from outside its own stride is not
      // what 'come with steel and company' means. Adjacent, or nothing.
      if (MOB_STATS[m.type]?.meleeOnly && !adjacent(p, m)) return false;
      if (inReach(p, m)) return true;
      // ranged (spec 6j): a drawn bow and a carried arrow reach further
      const cheb = Math.max(Math.abs(p.x - m.x), Math.abs(p.y - m.y));
      return cheb <= reachOf(p) && isRanged(p)
        && p.inventory.some(sl => sl?.item === ammoOf(p));
    }
    case 'special': {
      // §6af: everything `attackp` asks, plus a weapon that has a special and
      // an arm that has recovered. It is deliberately NOT confined to PvP --
      // see the note on WEAPONS: the cost confines it.
      const w9 = WEAPONS[p.equipment?.weapon?.item];
      if (!w9?.spec) return false;

      // §6af: 'now' interrupts your own rhythm ONCE — it does not exempt you
      // from the cost. This read `spec !== 'now'`, which skipped the arm check
      // entirely and let the maul special EVERY TICK forever: seven to
      // seventeen a tick against a normal three, and the damage-neutrality
      // the whole design rests on simply did not hold for it.
      //
      // So: 'now' may be used while the arm is merely recovering from an
      // ordinary swing, but never while it is already spent INTO THE FUTURE
      // by a special. One interruption, then the full price.
      if (w9.spec === 'now') {
        if ((p.lastSwing ?? -64) > state.tick) return false;
      } else if (state.tick - (p.lastSwing ?? -64) < cadenceOf(p, w9.every ?? 2)) return false; // §6aq
      const q9 = state.players[input.targetId];
      if (!q9 || q9.hp <= 0 || input.targetId === input.playerId) return false;
      if ((q9.stilledUntil ?? 0) > state.tick || (p.stilledUntil ?? 0) > state.tick) return false;
      if (!mayStrike(state, p, q9)) return false;   // §11d: the Wilds, or two consignments
      if (inReach(p, q9)) return true;
      return isRanged(p)
        && Math.max(Math.abs(p.x - q9.x), Math.abs(p.y - q9.y)) <= reachOf(p)
        && p.inventory.some((sl) => sl?.item === ammoOf(p));
    }
    case 'attackp': {
      if ((state.players[input.targetId]?.stilledUntil ?? 0) > state.tick) return false; // the truce shields (v0.80)
      // 7.1: player state has no playerId field; compare against the input's
      // own id or self-attack slips through as (undefined === target) === false
      const q = state.players[input.targetId];
      if (!q || q.hp <= 0 || input.targetId === input.playerId) return false;
      // §11d: THE WILDS, OR TWO CONSIGNMENTS. The Wilds is a rectangle where
      // the law thins (§2g); a consignment is that same thinning carried on a
      // body, by consent, and it reaches wherever that body goes. BOTH must
      // bear one -- which is what makes a thief a hauler with different
      // intentions, and why there is no thieving skill.
      if (!mayStrike(state, p, q)) return false;
      if (inReach(p, q)) return true;
      const cheb = Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y));
      return cheb <= reachOf(p) && isRanged(p)
        && p.inventory.some(sl => sl?.item === ammoOf(p));
    }
    case 'plant': {
      const sl = p.inventory[input.slot];
      if (!Number.isInteger(input.slot) || sl?.item !== 'seeds') return false;
      // §6o: a plot is free to YOU unless you have already sown it. Whether
      // anybody else has is not your business.
      if (Object.keys(p.crops ?? {}).length >= CROP_CAP) return false;   // 6bl: the executor's rule, not a second copy
      return freePlotFor(state, ctx, p) !== null;
    }
    case 'harvest': {
      const n = state.nodes[input.nodeId];
      const sown = p.crops?.[input.nodeId] ?? 0;
      return !!n && n.type === 'plot' && sown > 0
        && (state.tick - sown) >= GROW_TICKS_RIPE && adjacent(p, n)
        && firstFreeSlot(p.inventory) !== -1;
    }
    case 'sell': {
      // §2b: A KEEPER WILL NOT DEAL WITH THE BRANDED.
      //
      // The Brand was evidence and nothing else -- fifteen minutes of a mark
      // that only existed if a window chose to paint one, and for four
      // foundings not one of them did. A rule that a window may quietly
      // decline to enforce is not a rule; it is a suggestion the engine makes
      // about art.
      //
      // So it costs exactly the thing a raider wants: an honest keeper in a
      // safe town knows what you did on the other side of the Brandline, and
      // will not take your money or your goods until the mark cools. You may
      // still bank, still walk, still fight. You simply cannot turn what you
      // took into anything, for fifteen minutes, in the daylight where
      // everybody can see you being refused.
      if ((p.brandedUntil ?? 0) > state.tick) return false;
      const sl = p.inventory[input.slot];
      if (!Number.isInteger(input.slot) || !sl || !(sl.item in PRICES)) return false;
      const st = findAdjacentNode(state, ctx, p, 'store');
      if (!st) return false;
      // refused rather than half-paid, and refused HERE so a citizen is told
      // why instead of watching a click do nothing
      return (st.coin ?? PURSE_SEED) >= storeBid(sl.item, st.shelf?.[sl.item] ?? 0) * (sl.qty ?? 1);
    }
    case 'invoke': {
      // three stones, any hour (v0.40): the cost is the mining, not the wait
      return p.inventory.filter(sl => sl?.item === 'magic-stone').length >= 3;
    }
    case 'mendp': {
      // A WAND SENDS WHAT A BARE HAND KEEPS.
      //
      // That is the whole of the wand, and it is one rule wearing two coats: a
      // stilling sent at an enemy, and a mending sent to somebody else. It is
      // also what stops the wand being an item nobody can use until magic 85 --
      // still is a late spell, mend is not, so the wand has a job from fifty.
      //
      // And it gives this world something it has never had: a citizen whose
      // whole part in a fight is keeping somebody else standing. Which is the
      // most anti-combat thing magic could possibly do.
      if (p.equipment?.weapon?.item !== 'wand') return false;
      if (effLevel(p.skills.magic) < MEND_REQ) return false;
      if (!p.inventory.some((sl) => sl?.item === 'sigil')) return false;
      const t = state.players[input.target];
      if (!t || input.target === playerId) return false;
      if (t.hp <= 0 || (t.deadUntil ?? 0) > state.tick) return false;
      return Math.max(Math.abs(p.x - t.x), Math.abs(p.y - t.y)) <= MENDP_RANGE;
    }
    case 'still': {
      if (effLevel(p.skills.magic) < STILL_LEVEL) return false;
      if (p.inventory.filter(sl => sl?.item === 'sigil').length < STILL_SIGILS) return false;
      if ((p.stillCdUntil ?? 0) > state.tick) return false;
      const tm = state.mobs[input.target];
      if (tm) return tm.hp > 0 && (tm.stillImmuneUntil ?? 0) <= state.tick
        && Math.max(Math.abs(p.x - tm.x), Math.abs(p.y - tm.y)) <= STILL_RANGE;
      const tp = state.players[input.target];
      if (tp) return input.target !== playerId && isAwake(tp, state.tick) && (tp.deadUntil ?? 0) <= state.tick
        && (tp.stillImmuneUntil ?? 0) <= state.tick
        && Math.max(Math.abs(p.x - tp.x), Math.abs(p.y - tp.y)) <= STILL_RANGE;
      return false;
    }
    case 'raise_market': {
      if (p.hp <= 0) return false;
      if (nodeExistsAt(state, ctx, p.x, p.y)) return false;
      if (marketsOwnedBy(state, ctx, input.playerId) >= MARKET_OWNED) return false;
      // §6ao (v6): A STALL LINES THE ROAD -- and it must be REFUSED here, not
      // silently at completion. The check lived only in the resolver, so a
      // citizen stood twenty intervals in the wrong place and got nothing,
      // with no refusal to read. Two gates that must agree.
      if (!stallGroundOk(state, p.x, p.y)) return false;
      return countLogs(p.inventory) >= MARKET_LOGS
          && countItem(p.inventory, 'ore') >= MARKET_ORE;
    }
    case 'stock_market': {
      const mk = myMarketBeside(state, ctx, p, input.playerId);
      const sl = p.inventory[input.slot];
      if (!mk || !sl) return false;
      // §6w: NOT THE BOW, for exactly the reason a bank will not take it.
      // "You cannot opt out of being hunted without giving the bow up" -- and
      // a stall is somewhere safe. It is also somewhere the DRAGON cannot
      // reach: the reclaim at its rising scans citizens and the ground, not
      // shelves, so a stalled bow would outlive the dragon that dropped it and
      // clear the flag besides. There would be two.
      //
      // Everything else unpriced may be stalled -- the old chain, a sigil, a
      // chart. A keeper refusing to price a thing is not the world forbidding
      // its sale; it is the world declining to have an opinion about it, which
      // is the whole reason a citizen's stall exists.
      if (sl.item === 'dragonbow') return false;
      // one good to a stall: the first thing stocked decides what it sells
      const kinds = Object.keys(mk.shelf ?? {});
      if (kinds.length && kinds[0] !== sl.item) return false;
      return ((mk.shelf?.[sl.item] ?? 0) + (sl.qty ?? 1)) <= MARKET_STOCK;
    }
    case 'price_market': {
      return !!myMarketBeside(state, ctx, p, input.playerId);
    }
    case 'take_market': {
      const mk = myMarketBeside(state, ctx, p, input.playerId);
      return !!mk && (mk.coin ?? 0) > 0;
    }
    case 'dismantle_market': {
      return !!myMarketBeside(state, ctx, p, input.playerId);
    }
    case 'unmake': {
      // §6aj: a heartwood stave in the hand, a sigil to spend, and a pile of
      // somebody's spoil within five tiles.
      if (p.hp <= 0) return false;
      if (p.equipment?.weapon?.item !== 'heartwood-staff') return false;
      if (!p.inventory.some((sl) => sl?.item === 'sigil')) return false;
      const gr = state.ground?.[input.groundId];
      if (!gr) return false;
      return Math.max(Math.abs(gr.x - p.x), Math.abs(gr.y - p.y)) <= UNMAKE_RANGE;
    }
    case 'consign': {
      // §11b: BESIDE A STORE, WHICH IS THE ENTIRE DISCIPLINE. Stores stand
      // inside walled towns, so a consignment may be taken up or put down only
      // somewhere safe. On the road the choice has already been made.
      if (p.hp <= 0 || p.consignment) return false;
      if (!haulTownIdAt(state, ctx, p)) return false;
      return input.slots.every((i) => !!p.inventory[i]);
    }
    case 'release': {
      if (p.hp <= 0 || !p.consignment) return false;
      return !!haulTownIdAt(state, ctx, p);
    }
    case 'deliver': {
      // sells ONE slot of the container, at the last town of the drawn route.
      if (p.hp <= 0 || !p.consignment) return false;
      if ((p.brandedUntil ?? 0) > state.tick) return false;   // §2b: nor for a hauler
      if (!haulAtEnd(p.consignment)) return false;
      const sl = p.consignment.items[input.slot];
      if (!Number.isInteger(input.slot) || !sl || !(sl.item in PRICES)) return false;
      const st = findAdjacentNode(state, ctx, p, 'store');
      if (!st) return false;
      return (st.coin ?? PURSE_SEED) >= storeBid(sl.item, st.shelf?.[sl.item] ?? 0) * (sl.qty ?? 1);
    }
    case 'alch': {
      // THE ITEM IS THE COST. Not a sigil -- a sigil is three magic-stones and
      // nobody spends that on a log -- so what alchemy consumes is the thing
      // itself, which also makes it this world's first real ITEM sink.
      //
      // It works IN THE WILDS, deliberately, and that is the most interesting
      // thing about it. Gold is the one thing death does not take, so out
      // there alchemy converts what you could lose into what you cannot. That
      // would erase the Wilds entirely if it were instant -- but a citizen may
      // submit one input per interval, so a full pack is twenty-odd intervals
      // of standing still in the open. Nothing new is needed to price it: the
      // tick does it. The choice is carry it out or stand and convert, and
      // standing still in dangerous country is a real thing to choose.
      if (p.hp <= 0) return false;
      if (effLevel(p.skills.magic) < ALCH_REQ) return false;
      // §6ao (v6): WHERE, AND WITH WHAT. A founding may say alchemy is a thing
      // done in TOWNS (but not at the spawn, so a newcomer must step out into
      // the world to do it) and in the WILDS (low-effort work to do while you
      // watch a fight and stand at risk) -- and only with a STAFF IN HAND, the
      // instrument alchemy is done with. A world that omits `alchWhere` alchs
      // anywhere, staffless, as v1-v5 do.
      if (state.genesis.alchWhere) {
        const c = cityRectOf(state.genesis);
        const inAnchor = p.x >= c.x0 && p.x <= c.x1 && p.y >= c.y0 && p.y <= c.y1;
        const inWild = inWilds(state.genesis, p.x, p.y);
        // "in a town" = a bank stands within 16 tiles (every town has its
        // counting house); Anchor is excluded even though it has one.
        let inTown = false;
        if (!inAnchor) {
          for (const nid in state.nodes) {
            const nn = state.nodes[nid];
            if (nn.type === 'bank' && Math.abs(nn.x - p.x) <= 16 && Math.abs(nn.y - p.y) <= 16) { inTown = true; break; }
          }
        }
        if (!inWild && !inTown) return false;
        const held = p.equipment?.weapon?.item;
        if (held !== 'staff' && held !== 'wand' && held !== 'heartwood-staff') return false;
      }
      const slot = p.inventory?.[input.slot];
      // A PRICED GOOD, NOT A PAYING ONE.
      //
      // This asked `alchValue(...)` and took nought for no -- so the two goods
      // that pay nothing, an arrow and a burnt fish, could not be transmuted at
      // all. The constitution says the opposite in as many words: an arrow "is
      // unmade for the practice, which is the honest worth of unmaking an
      // arrow". Whether a thing has a price is the question; what that price
      // comes to is the answer.
      if (!slot || !(slot.item in PRICES)) return false;
      if (state.tick - (p.lastAlch ?? -99) < alchEveryFor(p)) return false;
      return true;
    }
    case 'cast': {
      if (input.spell === 'anchor') {
        // §2k and §6v: ANCHOR IS A RECALL, and answers to both rules.
        //
        // It checked only that the caster held a sigil, so for three
        // magic-stones you got the escape `recall` explicitly forbids -- out
        // of the Wilds, mid-fight -- and it cancelled a star-dagger root,
        // which is that weapon's only advantage over the star-sword and sits
        // behind a 120-tick cooldown.
        //
        // §2k names `recall`, but the sentence gives the reason: magic will
        // not carry you out of danger you chose to enter. Anchor is magic and
        // the Wilds is that danger.
        // §6ao (v6): ANCHOR IS THE WILDS ESCAPE. With waystones carrying normal
        // town-to-town travel, the anchor-recall has one purpose left, and it is
        // the one magic was first for -- getting OUT of a fight you have chosen
        // to enter. So a v6 founding REVERSES the old rule: anchor may be cast
        // ONLY in the Wilds, to flee to the capital, at the risk of being cut
        // down mid-cast. Elsewhere it is redundant with the waystones and
        // refused. (A world without `alchWhere`/v6 flags keeps the old §2k rule:
        // no recall out of the Wilds.)
        if (p.hp <= 0) return false;
        if ((p.rootedUntil ?? 0) > state.tick) return false;   // §6v: they cannot move, even to flee
        // 6ch: NOT OUT OF THE WILDS. EVER.
        //
        // `anchorIsWildsEscape` INVERTED this rule: with it set the anchor
        // worked ONLY from the Wilds, so the one country where anybody may
        // strike you was also the one country you could leave instantly, for
        // the price of a sigil you were already carrying in order to fight.
        // Every consequence the Wilds exists to impose -- the walk in, the
        // walk out, the decision whether to keep going with a full pack --
        // was answered by a keystroke.
        //
        // The flag is still accepted from an older founding so such a genesis
        // still parses; it now decides nothing. The rule underneath was always
        // the right one.
        if (inWilds(state.genesis, p.x, p.y)) return false;
        return p.inventory.some((sl) => sl?.item === 'sigil');
      }
      if (input.spell === 'mend') // v0.41: the same sigil, a deeper use
        // §6ao: the rhythm is checked HERE too. Accepting the input and then
        // doing nothing spends the citizen's whole interval on silence -- the
        // validator/executor drift this file has been bitten by five times.
        return effLevel(p.skills.magic) >= MEND_REQ
          && p.inventory.some(sl => sl?.item === 'sigil')
          && state.tick - (p.lastMend ?? -MEND_EVERY) >= MEND_EVERY;
      return false;
    }
    case 'survey': { // stand on a marker to survey it (v0.50)
      if (p.hp <= 0) return false;
      return (state.markers ?? []).some(m => m.x === p.x && m.y === p.y);
    }
    // 6ci: a chart opens nothing; it is sold, not spent.
    case 'read_chart': return false;
    case 'build_brewpot': {
      if (p.hp <= 0 || !state.genesis.brew) return false;
      const bc = state.genesis.brew;
      if (nodeExistsAt(state, ctx, p.x, p.y)) return false;
      if (!hasAdjacentNode(state, ctx, p, 'hearth')) return false;
      if (brewpotsOwnedBy(state, ctx, input.playerId) >= bc.potCap) return false;
      return countLogs(p.inventory) >= bc.buildLogs && countItem(p.inventory, 'ore') >= bc.buildOre;
    }
    case 'brew': {
      const bp = state.nodes[input.nodeId];
      if (!bp || bp.type !== 'brewpot' || bp.by !== input.playerId || bp.readyAt !== undefined || !atOrBeside(p, bp)) return false;
      const sl = p.inventory[input.slot];
      return !!sl && (sl.item === 'grain' || isRawFood(sl.item));
    }
    case 'collect': {
      const bp = state.nodes[input.nodeId];
      if (!bp || bp.type !== 'brewpot' || bp.by !== input.playerId || !atOrBeside(p, bp)) return false;
      return bp.readyAt !== undefined && state.tick >= bp.readyAt && canAddItem(p.inventory, bp.brewKind);
    }
    case 'dismantle': {
      const bp = state.nodes[input.nodeId];
      return !!bp && bp.type === 'brewpot' && bp.by === input.playerId && atOrBeside(p, bp);
    }
    case 'kindle': { // raise a great fire: high-tier Firemaking (v0.53)
      const wt = state.genesis.watch;
      if (!wt || p.hp <= 0) return false;
      if (effLevel(p.skills.firemaking) < wt.level) return false;
      if (countLogs(p.inventory) < wt.kindleLogs) return false;
      if (nodeExistsAt(state, ctx, p.x, p.y)) return false;
      return countOwnedNodes(state, ctx, 'watchfire', input.playerId) < wt.maxOwned;
    }
    case 'stoke': { // anyone may feed anyone's fire: the light is common
      const wf = state.nodes[input.nodeId];
      if (!wf || wf.type !== 'watchfire' || !atOrBeside(p, wf) || !state.genesis.watch) return false;
      const sl = p.inventory[input.slot];
      // AND THE VALIDATOR MUST AGREE. Relaxing only the executor would have
      // left the input refused at the gate and the change invisible: the same
      // validator/executor drift this file has been bitten by three times.
      // A full fire still takes the log; it simply gains no burn from it.
      return !!sl && isLog(sl.item);
    }
    case 'fletch': {
      const sl = p.inventory[input.slot];
      if (!Number.isInteger(input.slot) || !sl) return false;
      // §6ad: THE HEARTWOOD BOW IS FLETCHED, NOT FORGED.
      //
      // It was in RECIPES with a `fletching: 90` gate, which made it a bow
      // you MAKE AT AN ANVIL while fletching heartwood by hand still gave a
      // beginner's wooden bow. The one crafted bow in the world, forged. Its
      // whole point is that fletching finally has a summit, so it belongs at
      // the bench with the rest of the fletcher's work.
      if (input.make === 'heartwood-bow') {
        if (effLevel(p.skills.fletching) < 90) return false;
        // §6ah: and a sigil in the binding. Relaxing the executor alone
        // would leave the fletch refused here and the change invisible --
        // the validator/executor pairing this file has been bitten by before.
        return countItem(p.inventory, 'heartwood') >= 3
            && countItem(p.inventory, 'sigil') >= 1;
      }
      return (input.make === 'bow' && isLog(sl.item))
        || (input.make === 'arrows' && sl.item === 'bones')
        || (input.make === 'staff' && sl.item === 'logs')
        || (input.make === 'wand' && sl.item === 'logs')
        || (input.make === 'heartwood-staff' && sl.item === 'heartwood'
            && effLevel(p.skills.fletching) >= HEARTWOOD_FLETCH
            && countItem(p.inventory, 'heartwood') >= 2
            && countItem(p.inventory, 'sigil') >= 1);
    }
    case 'smith': {
      const r = RECIPES[input.recipe];
      if (!r) return false;
      if (!hasAdjacentNode(state, ctx, p, 'anvil')) return false;
      const req = reqOverride(state.genesis, 'smith', input.recipe) ?? SMITH_REQS[input.recipe];
      if (req && !Object.entries(req).every(([sk, lv]) => effLevel(p.skills[sk]) >= lv)) return false;
      const have = (item) => p.inventory.filter(sl => sl && sl.item === item).length;
      return Object.entries(r).every(([item, qty]) => have(item) >= qty);
    }
    case 'wield': {
      const sl = p.inventory[input.slot];
      if (!Number.isInteger(input.slot) || !sl || !isEquippable(sl.item)) return false;
      const req = reqOverride(state.genesis, 'wield', sl.item) ?? WIELD_REQS[sl.item];
      if (req) for (const [sk, lv] of Object.entries(req))
        if (effLevel(p.skills[sk]) < lv) return false; // earned, then worn (v0.41)
      // 6bz: one pair of hands. A shield cannot be raised beside a haft, and a
      // haft cannot be taken up beside a shield. Refusing rather than silently
      // displacing: a citizen who meant to swap should say so in two inputs,
      // and an executor that guessed wrong should be told, not quietly disarmed.
      if (shieldRefused(p, sl.item) || haftRefused(p, sl.item)) return false;
      return true;
    }
    case 'unwield': {
      const g = EQUIP_SLOTS.includes(input.gear) ? input.gear : 'weapon';   // 6bz: the one list, again
      return p.equipment[g] !== null && firstFreeSlot(p.inventory) !== -1;
    }
    case 'light': {
      const sl = p.inventory[input.slot];
      if (!Number.isInteger(input.slot) || !sl || !isLog(sl.item)) return false;
      return !nodeExistsAt(state, ctx, p.x, p.y);
    }
    case 'bury': {
      const sl = p.inventory[input.slot];
      // §6ai: a dragon's bones are bones. The validator named the item
      // directly, so the new ones could be carried and never laid down --
      // the validator/executor pairing, a fifth time.
      return Number.isInteger(input.slot) && !!sl
        && (sl.item === 'bones' || sl.item === 'dragon-bones');
    }
    case 'deposit': {
      if (!Number.isInteger(input.slot) || !p.inventory[input.slot]) return false;
      // §11d: THE BANK IS CLOSED TO A HAULER, both ways. `player.bank` is one
      // map per citizen reachable at any bank node (§6g), which makes it a
      // teleport for GOODS exactly as recall is one for the body. Banning
      // deposit alone leaves the route open: consign at Cragfoot, walk to
      // Anchor carrying nothing, draw the plates out of the vault THERE and
      // sell them, having risked nothing at all.
      if (p.consignment) return false;
      // §6w: THE BOW CANNOT BE PUT AWAY.
      //
      // This world is against hidden power. Names are public, standing is
      // public, the hiscores are public -- and a unique weapon locked in a
      // strongroom would be the one thing in it that nobody could see and
      // nobody could reach. Its holder would carry the status and none of
      // the risk.
      //
      // So the bow lives in a pack or it lies on the ground. Whoever has it
      // carries it everywhere, into every fight and past the Brand, and can
      // never set it down somewhere safe and go about their day. That is
      // what makes being hunted TRUE rather than merely said: you cannot opt
      // out of it without giving the bow up.
      if (p.inventory[input.slot].item === 'dragonbow') return false;
      return hasAdjacentNode(state, ctx, p, 'bank');
    }
    case 'withdraw': {
      // a CHART banks fine (isItemName accepts it) and could never be taken
      // out again, because withdraw's shape check is ITEMS-only. Silent,
      // permanent loss of a survey reward. Two gates that must agree.
      if (typeof input.item !== 'string' || !(p.bank[input.item] > 0)) return false;
      if (p.consignment) return false;   // §11d, and see `deposit` for why both
      if (firstFreeSlot(p.inventory) === -1) return false;
      return hasAdjacentNode(state, ctx, p, 'bank');
    }
    case 'drop': {
      return Number.isInteger(input.slot) && !!p.inventory[input.slot];
    }
    case 'pickup': {
      const g2 = state.ground[input.groundId];
      if (!g2 || g2.x !== p.x || g2.y !== p.y) return false;
      // FORAGE IS EATEN WHERE IT LIES. No slot is needed because it never
      // enters a pack, and a full pack is no reason to be unable to eat.
      if (g2.item === 'forage') return p.hp > 0;
      // 7.4: execution merges arrows into an existing quiver, so validation
      // must accept that path too, a full pack still has room in the quiver
      if (g2.item === 'arrows' && p.inventory.some(sl => sl?.item === 'arrows')) return true;
      return firstFreeSlot(p.inventory) !== -1;
    }
    case 'eat': {
      const slot = p.inventory[input.slot];
      // §6m-iii: THE GULLET RHYTHM STAYS, AND THE SWING IS ON TOP OF IT.
      //
      // Removing the rate and keeping only the arm cost looked equivalent -- a
      // meal costs a swing, so an eater cannot also be fighting. It is not
      // equivalent, because a citizen can EAT AND SWING ALTERNATELY. Brews
      // stack to a million in one slot, so the pack never empties.
      //
      // Measured, mirror duel at ninety-nine in full starmetal: even without
      // food it is 5:3, a coin flip. With a stack of ALE -- four hitpoints, the
      // cheapest thing anybody can brew -- it is 0:8. Whoever brought the stack
      // simply won, which is exactly the failure §6m-ii predicted in its own
      // comment while the code deleted the rule that prevented it.
      if (state.tick - (p.lastAte ?? -1024) < eatRhythm(slot?.item)) return false;
      // §6ad: FOOD IS ASKED ONCE. This was a hardcoded list of three, so
      // `cooked-deep-fish` -- the best food in the world, gated behind
      // fishing 90 and cooking 80 -- simply could not be eaten. The same
      // shape as eleven weapons that drew as empty hands and a `RANGED_ITEMS`
      // that held one bow: a list that did not grow when the world did.
      return Number.isInteger(input.slot) && !!slot && healOf(slot.item) > 0;
    }
    default:
      return false;
  }
}

// ---------- Phase 2: cheap deterministic clone + derived tick indexes ----------
// (perf brief, Phase 2B/2C). Everything in this block is an IMPLEMENTATION
// DETAIL: process-local, absent from canonical state, checkpoints, and
// hashes, and rebuilt from canonical state whenever needed. The unindexed
// scan remains the reference behavior (every helper below falls back to it
// when no context is supplied, the test-only reference mode).

// -- instrumentation (non-consensus; off unless a benchmark enables it) --
let _p2on = false;
const _p2c = { fullNodeScans: 0, fullPlayerScans: 0, fullMobScans: 0, fullGroundScans: 0,
  posLookups: 0, typeLookups: 0, adjLookups: 0, indexBuilds: 0, indexUpdates: 0 };
let _p2sections = {}; let _p2cur = null; let _p2t0 = 0n;
function _p2mark(name) {
  if (!_p2on) return;
  const now = process.hrtime.bigint();
  if (_p2cur) _p2sections[_p2cur] = (_p2sections[_p2cur] || 0) + Number(now - _p2t0) / 1e6;
  _p2cur = name; _p2t0 = now;
}

// -- Phase 2B: protocol-aware state clone --
// Domain: canonically encodable states (canonical() rejects undefined,
// NaN/Infinity, and non-plain objects, and validateState walks every field),
// so mirroring JSON.parse(JSON.stringify(...)) semantics exactly means:
// objects lose undefined-valued keys, arrays map undefined to null, and
// everything else copies structurally.
function _deepCloneJson(v) {
  if (v === null || typeof v !== 'object') return v;
  if (Array.isArray(v)) {
    const n = v.length, a = new Array(n);
    for (let i = 0; i < n; i++) { const e = v[i]; a[i] = e === undefined ? null : _deepCloneJson(e); }
    return a;
  }
  const o = {};
  for (const k of Object.keys(v)) { const e = v[k]; if (e === undefined) continue; o[k] = _deepCloneJson(e); }
  return o;
}
function _cloneFlat(rec) { // record whose values are scalars (nested handled generically)
  const o = {};
  for (const k of Object.keys(rec)) {
    const e = rec[k];
    if (e === undefined) continue;
    o[k] = (e !== null && typeof e === 'object') ? _deepCloneJson(e) : e;
  }
  return o;
}
function _cloneEntityMap(m) { // nodes / mobs / ground: id -> flat record
  const o = {};
  for (const k of Object.keys(m)) {
    const e = m[k];
    if (e === undefined) continue;
    o[k] = (e !== null && typeof e === 'object' && !Array.isArray(e)) ? _cloneFlat(e) : _deepCloneJson(e);
  }
  return o;
}
function _clonePlayer(p) {
  if (p === null || typeof p !== 'object' || Array.isArray(p)) return _deepCloneJson(p);
  const o = {};
  for (const k of Object.keys(p)) {
    const v = p[k];
    if (v === undefined) continue;
    switch (k) {
      case 'skills': case 'bank': o[k] = _cloneFlat(v); break;
      case 'inventory': {
        const a = new Array(v.length);
        for (let i = 0; i < v.length; i++) { const sl = v[i]; a[i] = (sl === null || sl === undefined) ? null : _cloneFlat(sl); }
        o[k] = a; break;
      }
      case 'equipment': {
        const e = {};
        for (const g of Object.keys(v)) { const sl = v[g]; if (sl === undefined) continue; e[g] = sl === null ? null : _cloneFlat(sl); }
        o[k] = e; break;
      }
      case 'action': case 'trade': o[k] = v === null ? null : _cloneFlat(v); break;
      default: o[k] = (v !== null && typeof v === 'object') ? _deepCloneJson(v) : v;
    }
  }
  return o;
}
function cloneStateForTick(state) {
  const out = {};
  for (const k of Object.keys(state)) {
    const v = state[k];
    if (v === undefined) continue;
    switch (k) {
      case 'genesis':
        // immutable-and-safe-to-share: the founding record is never written
        // after construction (proven by the frozen-genesis campaign in
        // test/phase2.test.mjs; a mutation would throw there).
        out.genesis = v; break;
      case 'players': {
        if (v === null || typeof v !== 'object' || Array.isArray(v)) { out.players = _deepCloneJson(v); break; }
        const o = {};
        for (const id of Object.keys(v)) { const p = v[id]; if (p === undefined) continue; o[id] = _clonePlayer(p); }
        out.players = o; break;
      }
      case 'nodes': case 'mobs': case 'ground':
        out[k] = (v === null || typeof v !== 'object' || Array.isArray(v)) ? _deepCloneJson(v) : _cloneEntityMap(v);
        break;
      case 'names': case 'firsts':
        out[k] = (v === null || typeof v !== 'object' || Array.isArray(v)) ? _deepCloneJson(v) : _cloneFlat(v);
        break;
      default: // tick, beacon, markers, announce, spec fields, unknown fields
        out[k] = (v !== null && typeof v === 'object') ? _deepCloneJson(v) : v;
    }
  }
  return out;
}
let _cloneOverride = null;   // test hook; null = env/default
function _cloneModeName() { return _cloneOverride ?? process.env.INTERVAL_CLONE ?? 'fast'; }
function _cloneForTick(state) {
  const m = _cloneModeName();
  if (m === 'json') return JSON.parse(JSON.stringify(state));
  if (m === 'structured') return structuredClone(state);
  return cloneStateForTick(state);
}

// -- Phase 2C: minimal per-tick node indexes --
// One context per state object per tick. `seq` records the enumeration
// order of s.nodes (string keys: insertion order), so "first matching node
// in Object.values(...)" is reproducible as "matching node with least seq".
let _indexOverride = null;   // test hook; null = env/default
function _indexesOn() { return _indexOverride ?? (process.env.INTERVAL_INDEXES !== 'off'); }
const _tileKey = (x, y) => x + ',' + y;
function buildTickContext(state) {
  if (!_indexesOn()) return null;
  if (_p2on) _p2c.indexBuilds++;
  const byTile = new Map(), byType = new Map(), seq = new Map(), brewBy = new Map();
  let i = 0;
  for (const id of Object.keys(state.nodes)) {
    const n = state.nodes[id];
    seq.set(id, i++);
    const tk = _tileKey(n.x, n.y);
    let ta = byTile.get(tk); if (!ta) byTile.set(tk, ta = []); ta.push(id);
    let ty = byType.get(n.type); if (!ty) byType.set(n.type, ty = []); ty.push(id);
    if (n.type === 'brewpot') brewBy.set(n.by, (brewBy.get(n.by) || 0) + 1);
  }
  return { byTile, byType, seq, brewBy, nextSeq: i };
}
// centralized node mutation (Phase 2C): EVERY node created or deleted inside
// nextState goes through these, so s.nodes and the indexes cannot diverge.
function addIndexedNode(s, ctx, nodeId, node) {
  if (Object.prototype.hasOwnProperty.call(s.nodes, nodeId)) deleteIndexedNode(s, ctx, nodeId);
  s.nodes[nodeId] = node;
  if (!ctx) return;
  if (_p2on) _p2c.indexUpdates++;
  ctx.seq.set(nodeId, ctx.nextSeq++);
  const tk = _tileKey(node.x, node.y);
  let ta = ctx.byTile.get(tk); if (!ta) ctx.byTile.set(tk, ta = []); ta.push(nodeId);
  let ty = ctx.byType.get(node.type); if (!ty) ctx.byType.set(node.type, ty = []); ty.push(nodeId);
  if (node.type === 'brewpot') ctx.brewBy.set(node.by, (ctx.brewBy.get(node.by) || 0) + 1);
}
function deleteIndexedNode(s, ctx, nodeId) {
  const n = s.nodes[nodeId];
  if (n === undefined) return;
  delete s.nodes[nodeId];
  if (!ctx) return;
  if (_p2on) _p2c.indexUpdates++;
  ctx.seq.delete(nodeId);
  const ta = ctx.byTile.get(_tileKey(n.x, n.y));
  if (ta) { const i = ta.indexOf(nodeId); if (i !== -1) ta.splice(i, 1); if (!ta.length) ctx.byTile.delete(_tileKey(n.x, n.y)); }
  const ty = ctx.byType.get(n.type);
  if (ty) { const i = ty.indexOf(nodeId); if (i !== -1) ty.splice(i, 1); if (!ty.length) ctx.byType.delete(n.type); }
  if (n.type === 'brewpot') {
    const c = (ctx.brewBy.get(n.by) || 0) - 1;
    if (c > 0) ctx.brewBy.set(n.by, c); else ctx.brewBy.delete(n.by);
  }
}
// query helpers. Reference behavior (ctx === null) is the exact scan the
// engine ran before Phase 2; the indexed path must return identical answers
// (differentially tested in test/phase2.test.mjs).
function nodeExistsAt(state, ctx, x, y) { // any node occupies the tile
  if (!ctx) { if (_p2on) _p2c.fullNodeScans++; return Object.values(state.nodes).some(n => n.x === x && n.y === y); }
  if (_p2on) _p2c.posLookups++;
  const ta = ctx.byTile.get(_tileKey(x, y));
  return !!ta && ta.length > 0;
}
const _WALKABLE_BUILT = new Set(['brewpot', 'watchfire', 'fire', 'market']); // what citizens build never blocks a door (v0.52, v0.53, v0.80)
// v0.80: the citizen's fire joins them. A fire is the only blocking node a
// citizen could CREATE, and movement is cardinal, so four logs boxed a
// stranger in and one log closed a ford for as long as it burned. The
// hearths the world was founded with (campfire) still block: they are
// furniture, not weather. Fires you can walk through are also fires you
// can cook on, so the cook rule below counts the tile underfoot.
function countOwnedNodes(state, ctx, type, owner) { // how many of `type` this citizen keeps
  if (_p2on) _p2c.fullNodeScans++;
  let n = 0;
  for (const nd of Object.values(state.nodes)) if (nd.type === type && nd.by === owner) n++;
  return n;
}
// The one thing a mourner of seventy carries through: the dearest PRICED item
// they held, in the pack or in their hands. Unpriced things -- the old chain,
// a dragonbow, a sigil, a chart -- are never kept, at any level.
function prayerKeeps(p, tick) {
  // §2b: AND PRAYER DOES NOT COVER THE MARKED.
  //
  // Here was the real fault. A citizen who struck first walked away with the
  // two dearest things in their pack -- often the very things they had just
  // taken off the person they struck. The victim lost everything and the
  // raider was insured, by a skill about making peace with dying.
  //
  // The keeper's refusal was an errand and the closed stones were a walk. This
  // is the danger: for fifteen minutes you carry what you took with nothing
  // held back, and anybody may take it from you at no cost to themselves. The
  // Brand does not punish. It withdraws a protection, and lets the world do
  // the rest.
  const lv = effLevel(p?.skills?.prayer ?? 0);
  if (!p || lv < PRAYER_KEEP) return [];
  if (Number.isInteger(tick) && (p.brandedUntil ?? 0) > tick) return [];
  const want = lv >= PRAYER_KEEP_TWO ? 2 : 1;
  const all = [];
  const consider = (sl) => {
    if (!sl) return;
    const v = PRICES[sl.item] ?? 0;
    if (v > 0) all.push({ v, item: sl.item, qty: sl.qty ?? 1 });
  };
  for (const sl of p.inventory ?? []) consider(sl);
  for (const g of EQUIP_SLOTS) consider(p.equipment?.[g]);   // 6bz: prayer weighs the shield and the legs too
  // dearest first, and ties broken by name so every node keeps the same things
  all.sort((a, b) => b.v - a.v || (a.item < b.item ? -1 : a.item > b.item ? 1 : 0));
  return all.slice(0, want).map(({ item, qty }) => ({ item, qty }));
}
function blockingNodeAt(state, ctx, x, y) { // movement rule: player-built nodes are walkable
  if (!ctx) { if (_p2on) _p2c.fullNodeScans++; return Object.values(state.nodes).some(n => n.x === x && n.y === y && !_WALKABLE_BUILT.has(n.type)); }
  if (_p2on) _p2c.posLookups++;
  const ta = ctx.byTile.get(_tileKey(x, y));
  if (!ta) return false;
  for (const id of ta) if (!_WALKABLE_BUILT.has(state.nodes[id].type)) return true;
  return false;
}
const _ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]]; // adjacent(): Manhattan distance exactly 1
function fireOnTile(state, ctx, x, y) { // a fire you are standing IN is a fire you are at
  if (!ctx) return Object.values(state.nodes).some(n => _FIRE_TYPES.has(n.type) && n.x === x && n.y === y);
  const ta = ctx.byTile.get(_tileKey(x, y));
  if (!ta) return false;
  for (const id of ta) if (_FIRE_TYPES.has(state.nodes[id].type)) return true;
  return false;
}
// 6bf: A HEARTH IS A FIRE. It was not in this set, so the one permanent
// fireplace in every town -- the thing a hearth IS -- could not cook a fish,
// while a stick lit in a field could. Its only job in the whole engine was
// standing next to brewpots. Now a town is somewhere a cook goes.
const _FIRE_TYPES = new Set(['campfire', 'fire', 'hearth']);
// ---------------------------------------------------------------------------
// §11: HAULING. The consignment, the drawn route, and what weight over distance
// is worth. Every value here is a pure function of the state and the beacon.

// The towns that can END a route are the towns that hold a store: a keeper with
// a purse is what a consignment is sold into. Sorted by nodeId so two nodes
// enumerate them in the same order, always.
function haulTownsSorted(s2, ctx2) {
  const out = [];
  for (const nid of Object.keys(s2.nodes).sort()) {
    const n = s2.nodes[nid];
    if (n && n.type === 'store') out.push({ id: nid, x: n.x, y: n.y });
  }
  return out;
}
function haulTownIdAt(s2, ctx2, p2) {
  const st2 = findAdjacentNode(s2, ctx2, p2, 'store');
  if (!st2) return null;
  for (const nid of Object.keys(s2.nodes).sort()) {
    const n = s2.nodes[nid];
    if (n && n.type === 'store' && n.x === st2.x && n.y === st2.y) return nid;
  }
  return null;
}
// §11c: THE ROUTE IS DRAWN, NOT CHOSEN. A citizen who picks their own
// destination picks the nearest one forever, which collapses the whole
// profession into a forty-second shuttle. Drawn by the same lots that place a
// survey marker (§7 v0.38).
function haulDrawRoute(s2, ctx2, pid, from) {
  const towns = haulTownsSorted(s2, ctx2).filter((t) => t.id !== from);
  if (!towns.length) return [];
  const g2 = s2.genesis;
  const lo = g2.haul?.legMin ?? 1, hi = g2.haul?.legMax ?? 3;
  const h0 = sha256(Buffer.from(s2.beacon + '|haul|' + s2.tick + '|' + pid + '|legs'));
  const legs = Math.min(towns.length, lo + (h0.readUInt32BE(0) % Math.max(1, hi - lo + 1)));
  const pool = towns.slice(), route = [];
  for (let i = 0; i < legs && pool.length; i++) {
    const h = sha256(Buffer.from(s2.beacon + '|haul|' + s2.tick + '|' + pid + '|' + i));
    route.push(pool.splice(h.readUInt32BE(0) % pool.length, 1)[0].id);
  }
  return route;
}
// §11e: TILES. Chebyshev between store tiles, exactly as survey XP is paid by
// chebyshev to the anchor (§7c). A walk graph would be truer and cannot be
// computed every interval by every node; this can.
function haulRouteTiles(s2, from, route) {
  let cur = s2.nodes[from], tot = 0;
  if (!cur) return 0;
  for (const tid of route) {
    const n = s2.nodes[tid];
    if (!n) continue;
    tot += Math.max(Math.abs(n.x - cur.x), Math.abs(n.y - cur.y));
    cur = n;
  }
  return tot;
}
function haulSlotsFilled(c) {
  let n = 0;
  for (const sl of (c?.items ?? [])) if (sl) n++;
  return n;
}
// §11e: the multiplier is a TABLE OF INTEGERS in hundredths, not a logarithm.
// §2m binds this world to + - * / and sqrt; a log cannot be computed
// identically by two implementations, and XP is an integer (§3.1).
// 6bs: THE CARGO MULTIPLIER IS A RISK PREMIUM, AND IT STAYS.
//
// A previous revision of this note took it out, reading it as the
// tier-as-shortcut fault the other seventeen trades were cured of -- a dearer
// good paying faster experience for the same act. That was wrong, and it was
// wrong because NOTHING IN THIS FILE SAID WHY THE TABLE EXISTED. So it is said
// here, where the next reader will find it.
//
// Hauling is the one trade whose whole substance is exposure. §11d thins the
// law for anybody bearing a consignment: two haulers may strike each other
// ANYWHERE, not only in the Wilds. A consignment is consensus state, so a
// robber reads exactly what you are carrying before choosing whom to follow.
// And on death it spills to the ground where you fell -- the cargo is not
// destroyed, it is TAKEN.
//
// So the multiplier is not paying for the walk. It is paying for having made
// yourself worth ambushing. A citizen carrying twenty-eight star plates is a
// different proposition on the road from one carrying logs, and the table is
// what compensates them for it. Distance alone would pay the coward and the
// mark the same, which is the one thing this skill must not do.
//
// It is read in TWO places -- the executor's `deliver` branch and `haulXpFor`,
// which is what a client quotes before a citizen sets out. Both must agree, or
// the world promises a number it does not pay.
function haulMultFor(g2, item) {
  const t = g2.haul?.mult;
  if (t && Number.isInteger(t[item])) return t[item];
  return 100;
}
function haulXpFor(s2, c) {
  const g2 = s2.genesis;
  const per = g2.haul?.perTileSlot ?? 0;
  if (!per) return 0;
  const tiles = haulRouteTiles(s2, c.from, c.route);
  let xp = 0;
  for (const sl of (c.items ?? [])) {
    if (!sl) continue;
    xp += Math.floor((tiles * per * haulMultFor(g2, sl.item)) / 10000);
  }
  return xp;
}
function haulAtEnd(c) { return !!c && c.leg >= c.route.length; }
// §11d: WHERE ONE CITIZEN MAY STRIKE ANOTHER. Two ways, and only two: both
// stand in the Wilds (§2g), or both bear a consignment (§11d) -- the same
// thinning of the law, carried on a body instead of drawn on the map.
//
// This is ONE function because the rule lives in four places: validate(), the
// attackp resolver, the special blow, and the swing itself. It was written out
// longhand in each, and adding the consignment to validate() alone let a blow
// be accepted and then silently dropped by the resolver -- valid to the gate,
// invisible to the world. A rule spelled out four times is four rules.
function mayStrike(s2, p2, q2) {
  if (!p2 || !q2) return false;
  if (!!p2.consignment && !!q2.consignment) return true;
  return inWilds(s2.genesis, p2.x, p2.y) && inWilds(s2.genesis, q2.x, q2.y);
}
// §11b: AN EMPTY CONSIGNMENT LIFTS ITSELF. Not tidiness: a citizen bearing an
// empty one would be attack-capable at no cost at all, and the honesty of §11d
// rests on nobody becoming dangerous without becoming worth robbing.
function haulSweep(p2) {
  if (p2.consignment && haulSlotsFilled(p2.consignment) === 0) p2.consignment = null;
}

// §6ao (v6): A STALL LINES THE ROAD -- raised on ground ORTHOGONALLY ADJACENT
// to a road, beside it and not on it, so every stall sits where wanderers pass
// and none is pitched in an empty corner. A world that omits the flag (v1-v5)
// lets a stall stand anywhere. One predicate, so validate() and the resolver
// can never disagree about it.
function stallGroundOk(s2, x, y) {
  if (!s2.genesis.stallsLineRoads) return true;
  const tt = TERRAINS[s2.genesis.worldGenerator];
  if (!tt || !tt.road) return false;
  const isRoad = (a, b) => tt.road(s2.genesis, a, b);
  return !isRoad(x, y) && (isRoad(x + 1, y) || isRoad(x - 1, y) || isRoad(x, y + 1) || isRoad(x, y - 1));
}

function hasAdjacentNode(state, ctx, p, typeOrSet, pred) {
  const match = typeof typeOrSet === 'string' ? (t) => t === typeOrSet : (t) => typeOrSet.has(t);
  if (!ctx) {
    if (_p2on) _p2c.fullNodeScans++;
    return Object.values(state.nodes).some(n => match(n.type) && (!pred || pred(n)) && adjacent(p, n));
  }
  if (_p2on) _p2c.adjLookups++;
  for (const [dx, dy] of _ORTH) {
    const ta = ctx.byTile.get(_tileKey(p.x + dx, p.y + dy));
    if (!ta) continue;
    for (const id of ta) { const n = state.nodes[id]; if (match(n.type) && (!pred || pred(n))) return true; }
  }
  return false;
}
// §6o: the adjacent plot this citizen has NOT already sown, by canonical
// node id. Its own function because the shared finder's predicate never sees
// the id, and per-citizen crops are keyed by it. Min-id order, exactly as
// findAdjacentNode does, so every node picks the same plot.
function freePlotFor(state, ctx, p) {
  let bestId = null;
  for (const [id, n] of Object.entries(state.nodes)) {
    if (n.type !== 'plot' || !adjacent(p, n)) continue;
    if ((p.crops?.[id] ?? 0) > 0) continue;
    if (bestId === null || id < bestId) bestId = id;
  }
  return bestId;
}
function findAdjacentNode(state, ctx, p, type, pred) {
  // reference: the min-nodeId match (canonical, matching the indexed path)
  if (!ctx) {
    if (_p2on) _p2c.fullNodeScans++;
    let best, bestId = null;
    for (const [id, n] of Object.entries(state.nodes))
      if (n.type === type && (!pred || pred(n)) && adjacent(p, n) && (bestId === null || id < bestId)) { bestId = id; best = n; }
    return best;
  }
  if (_p2on) _p2c.adjLookups++;
  let best, bestId = null;
  for (const [dx, dy] of _ORTH) {
    const ta = ctx.byTile.get(_tileKey(p.x + dx, p.y + dy));
    if (!ta) continue;
    for (const id of ta) {
      const n = state.nodes[id];
      if (n.type !== type || (pred && !pred(n))) continue;
      // v0.80: tie-break on nodeId, not enumeration seq. seq mirrors
      // s.nodes insertion order, which a checkpoint restore can reorder;
      // nodeId is canonical, so every node picks the SAME adjacent node.
      if (bestId === null || id < bestId) { bestId = id; best = n; }
    }
  }
  return best;
}
function adjacentNodeIdsInOrder(state, ctx, p, type) {
  // reference: every matching node, in Object.entries enumeration order
  if (!ctx) {
    if (_p2on) _p2c.fullNodeScans++;
    const out = [];
    for (const [nid, n] of Object.entries(state.nodes))
      if (n.type === type && Math.abs(n.x - p.x) + Math.abs(n.y - p.y) === 1) out.push(nid);
    return out;
  }
  if (_p2on) _p2c.adjLookups++;
  const found = [];
  for (const [dx, dy] of _ORTH) {
    const ta = ctx.byTile.get(_tileKey(p.x + dx, p.y + dy));
    if (!ta) continue;
    for (const id of ta) if (state.nodes[id].type === type) found.push(id);
  }
  // v0.81: by nodeId, not by enumeration order. `seq` mirrors s.nodes
  // insertion order, which a checkpoint restore reorders -- and this
  // function's only caller APPENDS to `p.attuned`, an ordered array in
  // canonical state. Two nodes disagreeing about the order of two adjacent
  // waystones is a state-hash fork. `findAdjacentNode` was given this fix in
  // v0.80 and this sibling was missed.
  found.sort();
  return found;
}
// 6ch: waystoneIdsSorted removed with the stones.
// how many stalls this citizen has standing, and the one at their elbow
// WHAT A SHELF DOES WHEN THE STALL GOES. It spills where it stood, on the
// ordinary hundred-interval clock -- so two citizens standing over it for the
// whole minute could save two hundred, and one could save half. A stall
// abandoned with a fortune in it is mostly a fortune destroyed, in public,
// with everyone able to read the clock.
function spillShelf(s2, mk) {
  const shelf = mk.shelf ?? {};
  let n = 0;
  for (const it of Object.keys(shelf).sort()) {
    for (let k = 0; k < shelf[it]; k++) {
      s2.ground['m' + s2.tick + '-' + (n++)] =
        { item: it, qty: 1, x: mk.x, y: mk.y, expiresAt: s2.tick + 100 };
    }
  }
  delete mk.shelf;
}
function marketsOwnedBy(state, ctx, pid) {
  let n = 0;
  for (const k of Object.keys(state.nodes)) {
    const q = state.nodes[k];
    if (q.type === 'market' && q.by === pid) n++;
  }
  return n;
}
function myMarketBeside(state, ctx, p, pid) {
  for (const k of Object.keys(state.nodes).sort()) {
    const q = state.nodes[k];
    if (q.type === 'market' && q.by === pid && atOrBeside(p, q)) return q;
  }
  return null;
}
function myMarketIdBeside(s2, p, pid) {
  for (const k of Object.keys(s2.nodes).sort()) {
    const q = s2.nodes[k];
    if (q.type === 'market' && q.by === pid && atOrBeside(p, q)) return k;
  }
  return null;
}
function brewpotsOwnedBy(state, ctx, pid) {
  if (!ctx) { if (_p2on) _p2c.fullNodeScans++; return Object.values(state.nodes).filter(n => n.type === 'brewpot' && n.by === pid).length; }
  if (_p2on) _p2c.typeLookups++;
  return ctx.brewBy.get(pid) || 0;
}

// ---------- the transition function ----------

// ---- exploration (v0.50): survey markers, placed by the beacon ----
const MARKER_LIFE = 3000; // an unclaimed marker relocates after this many ticks
// survey findings (v0.77): a minority of markers are the TRACES of
// those who came before, classed at birth from the same digest that
// placed them, weighted by the country they lie in (the generator
// registered what its countries are; an unregistered one keeps flat,
// modest odds). The class never changes and the finding is the class:
// no randomness survives to the claim.
const MARKER_FINDS = { burial: 'bones', working: 'ore', camp: 'logs', cache: 'seeds' };
const MARKER_KINDS = new Set(['ord', 'ws', 'burial', 'working', 'camp', 'cache']);
function classifyMarker(g, x, y, h) {
  const r = h.readUInt32BE(12) / 0xffffffff;
  const country = TERRAINS[g.worldGenerator]?.country?.(g, x, y) ?? null;
  const wts = country === 'wilds' ? [0.30, 0.08, 0.06, 0.06]        // the dead outnumber the living out west
    : country === 'crags' ? [0.06, 0.30, 0.04, 0.05]                 // old workings in the stone
    : country === 'greenwood' ? [0.06, 0.05, 0.30, 0.05]             // cold camps under the trees
    : country === 'fens' ? [0.18, 0.05, 0.10, 0.06]                  // the marsh keeps what it takes
    : country === 'heartlands' ? [0.05, 0.04, 0.05, 0.04]            // the settled middle is mostly just ground
    : [0.10, 0.08, 0.08, 0.05];
  let acc = 0;
  const kinds = ['burial', 'working', 'camp', 'cache'];
  for (let i = 0; i < 4; i++) { acc += wts[i]; if (r < acc) return kinds[i]; }
  return 'ord';
}
function surveyMarker(s, ctx, index, salt) {
  const g = s.genesis, anchor = spawnOf(g);
  const maxD = Math.max(anchor.x, g.worldW - anchor.x, anchor.y, g.worldH - anchor.y) || 1;
  const occupied = (x, y) => nodeExistsAt(s, ctx, x, y);
  // 6ch: the waystone rumour is gone with the stones; every marker is ordinary.
  for (let att = 0; att < 200; att++) { // ordinary: near-biased, avoid city, nodes, and barred ground
    const h = sha256(Buffer.from(s.beacon + '|survey|' + s.tick + '|' + index + '|' + salt + '|' + att));
    const x = 1 + (h.readUInt32BE(0) % (g.worldW - 2)), y = 1 + (h.readUInt32BE(4) % (g.worldH - 2));
    // v0.79: a marker is a place a citizen can STAND. The generator's terrain
    // (sea, ridge, river off the fords) rejects a candidate exactly as a node
    // does; a world with no registered terrain replays bit-identically, since
    // terrainBlocked is constant-false there.
    if (inCity(g, x, y) || occupied(x, y) || terrainBlocked(g, x, y)) continue;
    const d = Math.max(Math.abs(x - anchor.x), Math.abs(y - anchor.y));
    if ((h.readUInt32BE(8) / 0xffffffff) > 1 - 0.6 * (d / maxD)) continue;
    return { x, y, kind: classifyMarker(g, x, y, h), bornAt: s.tick };
  }
  // fallback (v0.79): the old anchor+5 could itself be barred ground on a
  // terrain world. Ring-scan outward from the anchor, deterministic, exact,
  // and the anchor's own walkability is the spawn's guarantee.
  for (let r = 1; r < Math.max(g.worldW, g.worldH); r++)
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const x = anchor.x + dx, y = anchor.y + dy;
      if (x < 1 || y < 1 || x >= g.worldW - 1 || y >= g.worldH - 1) continue;
      if (inCity(g, x, y) || occupied(x, y) || terrainBlocked(g, x, y)) continue;
      return { x, y, kind: 'ord', bornAt: s.tick };
    }
  return { x: Math.min(anchor.x + 5, g.worldW - 2), y: anchor.y, kind: 'ord', bornAt: s.tick };
}

// ---- world announcements (v0.48): milestones every citizen sees ----
const TICKS_PER_YEAR = Math.round(365.25 * 24 * 3600 * 1000 / TICK_MS); // world-age, in ticks
const ANNOUNCE_KEEP = 24; // the herald remembers only the last few cries
function announce(s, text) {
  if (!s.announce) s.announce = [];
  s.announce.push({ tick: s.tick, text });
  while (s.announce.length > ANNOUNCE_KEEP) s.announce.shift();
}
function claimFirst(s, key, pid) { // true the first time `key` is ever achieved; records it forever
  if (!s.firsts) s.firsts = {};
  if (s.firsts[key] === undefined) { s.firsts[key] = pid; return true; }
  return false;
}

// NO NON-FINITE NUMBER MAY ENTER THE STATE.
//
// The smithing NaN was one arithmetic slip away from killing a world, and it
// got all the way to consensus because nothing looked. `canonical()` throwing
// mid-attestation is a terrible failure mode whatever caused it: the world
// keeps running and stops being able to describe itself. This turns that
// class of fault into a skill that stopped rising, which is a bug report
// rather than an ending.
function scrubSkills(s) {
  for (const pid of Object.keys(s.players)) {
    const p = s.players[pid];
    if (!p || !p.skills) continue;
    for (const sk of SKILLS) {
      const v = p.skills[sk];
      if (!Number.isFinite(v)) p.skills[sk] = sk === 'hitpoints' ? HP_START_XP : 0;
      else if (v < 0) p.skills[sk] = 0;
      else if (v > MAX_XP) p.skills[sk] = MAX_XP;
      else if (!Number.isInteger(v)) p.skills[sk] = Math.floor(v);
    }
  }
}
// §6ao (v6): THE EVENT STEP. Two deterministic functions of the beacon and the
// tick, run once per interval, that turn a fixed world into one where history
// happens: the BLOOM (a roaming rich spot, an opportunity) and the INCURSION
// (a roaming shared fight, a threat). Both are gated on genesis.events, so a
// world that founds without it (every v1-v5 world) runs this as a no-op and is
// byte-identical. The shape is the constitution's; the numbers are the world's.
function eventRoll(beacon, tag) {
  return sha256(Buffer.from(beacon.toString('hex') + '|event|' + tag)).readUInt32BE(0);
}
function stepEvents(s, beacon) {
  const ev = s.genesis && s.genesis.events;
  if (!ev) return;   // a world that did not found events runs no events

  // ---- 1. despawn expired incursions (bounded in TIME) ------------------
  for (const mid of Object.keys(s.mobs).sort()) {
    const m = s.mobs[mid];
    if (m.type !== 'incursion') continue;
    if (m.hp <= 0 || (m.goneBy !== undefined && s.tick >= m.goneBy)) delete s.mobs[mid];
  }

  // ---- 2. the incursion (a shared fight) --------------------------------
  const present = Object.keys(s.players).sort().filter(pid => {
    const p = s.players[pid];
    return p && p.hp > 0 && !p.deadUntil && isAwake(p, s.tick);
  });
  const liveIncursions = Object.values(s.mobs).filter(m => m.type === 'incursion' && m.hp > 0).length;
  if (present.length > 0 && liveIncursions < (ev.maxAtOnce ?? 1)) {
    const denom = Math.max(1, ev.oneInPerCitizen ?? 200000);
    const chance = Math.min(0xffffffff, Math.floor((0xffffffff / denom) * present.length));
    if (eventRoll(beacon, 'incursion-spawn') < chance) {
      const pick = eventRoll(beacon, 'incursion-target') % present.length;
      const tid = present[pick];
      const t = s.players[tid];
      const base = MOB_STATS['incursion'];
      const combat = Math.max(1, effLevel(t.skills.attack) + effLevel(t.skills.defence)
        + effLevel(t.skills.ranged) + effLevel(t.skills.magic));
      const scaleHp = Math.round(base.maxHp + combat * (ev.hpPerCombat ?? 6));
      const scaleDef = Math.round(base.def + combat * (ev.defPerCombat ?? 0.4));
      let sx = t.x, sy = t.y, seated = false;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1],[2,0],[-2,0],[0,2],[0,-2]]) {
        const nx = t.x + dx, ny = t.y + dy;
        if (nx < 1 || ny < 1 || nx >= s.genesis.worldW - 1 || ny >= s.genesis.worldH - 1) continue;
        if (terrainBlocked(s.genesis, nx, ny)) continue;
        if (Object.values(s.mobs).some(m => m.hp > 0 && m.x === nx && m.y === ny)) continue;
        sx = nx; sy = ny; seated = true; break;
      }
      if (seated) {
        const iid = 'incursion-' + s.tick;
        addMob(s, iid, 'incursion', sx, sy);
        const m = s.mobs[iid];
        m.maxHp = scaleHp; m.hp = scaleHp; m.def = scaleDef;
        m.mad = tid;
        // §6ao (v6): THE LIFETIME MUST OUTLAST A SOLO KILL. The despawn is for
        // the ABANDONED case (nobody came), never to end a fight in progress. A
        // committed lone citizen should finish it before it leaves, so the
        // window is set against the scaled HP with a wide margin; a crowd only
        // makes it faster.
        const soloKillTicks = Math.ceil(scaleHp / 2) + 60;
        m.goneBy = s.tick + Math.max(ev.lifetimeTicks ?? 600, soloKillTicks);
        m.leash = ev.leashTiles ?? 40;
        m.spawnX = sx; m.spawnY = sy;
        // §6ao (v6): CONTEXTUAL. The incursion wears a face chosen by what the
        // target was DOING -- a fen-thing when you fish, a woodwraith when you
        // chop, a rock-thing when you mine -- so the world feels like it noticed
        // you, the way the old random events did. No active gathering? the BIOME
        // decides. (The face is flavour; the body is one scaled incursion.)
        let face = null;
        const act = t.action;
        if (act && act.type === 'gather') {
          const gn = s.nodes[act.nodeId];
          const sk = gn && NODE_YIELD[gn.type] && NODE_YIELD[gn.type].skill;
          face = sk === 'woodcutting' ? 'woodwraith'
            : sk === 'mining' ? 'rock-thing'
            : sk === 'fishing' ? 'fen-thing' : null;
        }
        if (!face) {
          const _tt = TERRAINS[s.genesis.worldGenerator];
          const b = _tt && _tt.country ? _tt.country(s.genesis, sx, sy) : null;
          face = b === 'fens' ? 'fen-thing' : b === 'greenwood' ? 'woodwraith'
            : b === 'crags' ? 'rock-thing' : b === 'wilds' ? 'wilds-shade' : 'incursion';
        }
        m.face = face;
        announce(s, 'A ' + face.replace('-', ' ') + ' has come for ' + (t.name ?? tid.slice(0, 6)) + '.');
      }
    }
  }

  // ---- 3. the bloom (a shared opportunity) ------------------------------
  const period = Math.max(1, ev.bloomPeriod ?? 3600);
  const window = Math.max(1, ev.bloomWindow ?? 1200);
  const phase = s.tick % period;
  if (phase < window) {
    if (!s.bloom || s.bloom.until <= s.tick) {
      const gatherables = Object.keys(s.nodes).sort().filter(nid => {
        const n = s.nodes[nid];
        return n && (n.type === 'tree' || n.type === 'rock' || n.type === 'fishing-spot'
          || n.type === 'oak-tree' || n.type === 'coal-rock' || n.type === 'eel-spot');
      });
      if (gatherables.length) {
        const pickB = eventRoll(beacon, 'bloom-where|' + Math.floor(s.tick / period)) % gatherables.length;
        const nid = gatherables[pickB];
        const n = s.nodes[nid];
        s.bloom = { nodeId: nid, x: n.x, y: n.y, until: s.tick - phase + window };
      }
    }
  } else if (s.bloom) {
    delete s.bloom;
  }
}

function nextState(state, inputs, _legacyBeacon) {
  if (_p2on) { _p2sections = {}; _p2cur = null; }
  _p2mark('clone');
  const s = _cloneForTick(state); // pure: never mutate caller's state (Phase 2B)
  _p2mark('index_build');
  // derived, process-local, per-transition (Phase 2C): one context over the
  // pre-state (validInput reads state, which this tick never mutates) and
  // one over the working clone (maintained by the centralized helpers).
  const _ctxPre = buildTickContext(state);
  const _ctx = buildTickContext(s);
  _p2mark('pre_tick');
  s.tick = state.tick + 1;
  // LAST INTERVAL'S DEEDS ARE OVER. A deed is a thing that happened on ONE
  // interval, so it is cleared at the top of the next -- in id order, because
  // this writes canonical state.
  for (const pid of Object.keys(s.players).sort()) {
    if (s.players[pid].deed !== undefined) delete s.players[pid].deed;
  }
  // the beacon rides IN the state now (v0.38). A pre-0.38 state migrates
  // itself: seeded once from the old formula, then history takes over.
  if (!s.beacon) s.beacon = beaconValue(state.genesis.genesisSeed, state.tick).toString('hex');
  // §6ba: THE LOTS ARE DRAWN FROM THIS TICK'S DEEDS, NOT THE LAST ONE'S.
  //
  // v0.38 folded the input digest into the beacon and left it in the state for
  // the NEXT tick. That closed long-range prediction and left a one-tick hole
  // open: a citizen who has applied tick T-1 holds `s.beacon` before signing
  // for tick T, so `roll(beacon, pid, tag)` for tick T is knowable at the
  // moment the input is chosen.
  //
  // An executor -- and this world expects executors -- reads that byte and
  // acts only on the ticks that win. It skips the gathers that would deplete
  // its node, so a tree never sleeps; and with a gold seam it would stand
  // between two rocks and strike the gold one on precisely the ticks the gold
  // one pays, keeping full ordinary mining experience AND every nugget. The
  // entire cost of gold -- an hour forgone -- would evaporate.
  //
  // So the chain advances at the TOP of the tick and everything resolves
  // against the new value. The digest covers every input applied this tick,
  // including other citizens', so the lots a citizen is trying to read are
  // reshuffled by the very deed they are reading them for -- which is exactly
  // what the v0.38 note claimed and the ordering quietly did not deliver.
  //
  // Nothing is stored that was not stored before and no message changes: the
  // same value that used to be written at the end of tick T-1 is now written
  // at the start of tick T. It is the same chain, advanced in a different
  // place, and only a founding may change where.
  const beacon = delayChain(Buffer.from(s.beacon, 'hex'), inputsDigest(inputs));
  s.beacon = beacon.toString('hex');

  // snapshot who has already mastered what, so the end-of-tick pass can tell who
  // CROSSED a threshold this tick, regardless of which of the 18 XP sites paid it
  const _preMaster = {};
  for (const _pid of Object.keys(s.players).sort()) { // canonical, matching the mastery pass below
    const _done = new Set();
    for (const _sk of SKILLS) if (s.players[_pid].skills[_sk] >= XP_TABLE[99]) _done.add(_sk);
    _preMaster[_pid] = _done;
  }
  // the world marks its own years (deterministic: a pure function of the tick)
  if (s.tick > 0 && s.tick % TICKS_PER_YEAR === 0) {
    const _yr = s.tick / TICKS_PER_YEAR;
    announce(s, 'Interval is ' + _yr + ' year' + (_yr === 1 ? '' : 's') + ' old.');
  }
  // exploration: keep K survey markers alive; relocate any gone stale (v0.50)
  if (!s.markers) s.markers = [];
  // 6bq: HOW MANY RUMOURS A WORLD KEEPS ALIVE, AND WHY IT IS NOT A CONSTANT.
  //
  // A marker is consumed by whoever reaches it first and immediately relocates,
  // so k does not limit total surveying -- it sets the WALK, which is the whole
  // cost of the trade. Sixteen rumours on this island sit a median forty-four
  // tiles apart; with a thousand citizens hunting them the nearest is gone
  // before anybody arrives, the walk lengthens without bound, and exploration
  // silently gets slower the better the world does. Every new surveyor makes
  // every other surveyor poorer.
  //
  // That congestion buys nothing. A busy TREE is a Schelling point -- people
  // meet there, and §6ao founds durable nodes precisely so a crowd can share
  // six tiles. A busy RUMOUR is not a place anybody meets; you walk to it
  // alone and it is gone. So this one scales: rumours per citizen stay roughly
  // fixed, the walk stays what it was measured at, and the payout tuned
  // against that walk keeps meaning what it meant on the first day.
  //
  // Bounded at both ends -- a quiet world still has sixteen, and a very loud
  // one stops at two hundred and fifty-six, because every marker is consensus
  // state every node holds forever.
  const _awake = Object.values(s.players).filter((q) => isAwake(q, s.tick)).length;
  const _K = Math.max(s.genesis.survey?.k ?? 0,
    Math.min(SURVEY_K_MAX, (s.genesis.survey?.k ?? 0) + Math.floor(_awake / SURVEY_PER_MARKER)));
  for (let _i = 0; _i < s.markers.length; _i++)
    if (s.tick - (s.markers[_i].bornAt ?? s.tick) > MARKER_LIFE) s.markers[_i] = surveyMarker(s, _ctx, _i, 'life');
  // §6al: A STALL NOBODY TENDS FALLS DOWN, and its shelf spills where it
  // stood. Three days. The state is public, so everybody can read the clock
  // on somebody else's stall -- an abandoned one with a fortune in it becomes
  // an appointment, and if it stands in the Wilds, an appointment where the
  // other guests may kill you.
  for (const mid of Object.keys(s.nodes).sort()) {
    const mk = s.nodes[mid];
    if (mk.type !== 'market') continue;
    if (s.tick - (mk.lastUsed ?? 0) < MARKET_DECAY) continue;
    spillShelf(s, mk);
    announce(s, 'A stall has fallen, and what was on it lies in the grass.');
    deleteIndexedNode(s, _ctx, mid);
  }
  while (s.markers.length < _K) s.markers.push(surveyMarker(s, _ctx, s.markers.length, 'fill'));
  // brewpots abandoned past the decay window crumble, returning their tile to the
  // commons, the world stays open to newcomers; active pots reset the clock (v0.52)
  const _decay = s.genesis.brew?.decayTicks ?? 0;
  if (_decay > 0) for (const [_nid, _n] of Object.entries(s.nodes))
    if (_n.type === 'brewpot' && s.tick - (_n.lastUsed ?? 0) > _decay) deleteIndexedNode(s, _ctx, _nid);
  // watchfires (v0.53): while a fire burns it pays its keeper a slow trickle, the
  // light is public, the vigil is theirs. A fire long cold crumbles to ash.
  const _wt = s.genesis.watch;
  if (_wt) for (const [_nid, _n] of Object.entries(s.nodes)) {
    if (_n.type !== 'watchfire') continue;
    // 6bg: THE KEEPER MUST BE AT THE FIRE.
    //
    // This paid the owner every interval the beacon burned, anywhere in the
    // world, asleep, in another country -- twelve thousand experience a cycle
    // for having once lit something. It was ninety-four per cent of the skill
    // and none of it was work.
    //
    // Presence turns it into what the note always claimed it was: pay for
    // ATTENDANCE, like the bloom. A watchfire becomes somewhere a firekeeper
    // SITS, which is the only version of this that puts a person in a place.
    // Owning two is still allowed; nobody can sit at both.
    if (s.tick < (_n.fuelUntil ?? 0)) {
      const _k = s.players[_n.by];
      if (_k && _k.hp > 0 && Math.max(Math.abs(_k.x - _n.x), Math.abs(_k.y - _n.y)) <= WATCH_TEND_RANGE)
        _k.skills.firemaking += _wt.burnXp;
    }
    else if (s.tick - (_n.fuelUntil ?? 0) > _wt.decayTicks) deleteIndexedNode(s, _ctx, _nid);
  }

  // the dead return (spec §6c, v0.41): processed at tick start
  for (const pl2 of Object.values(s.players)) {
    if (pl2.hp <= 0 && pl2.deadUntil !== undefined && s.tick >= pl2.deadUntil) {
      const sp2 = spawnOf(s.genesis);
      pl2.x = sp2.x; pl2.y = sp2.y;
      pl2.hp = effLevel(pl2.skills.hitpoints);
      delete pl2.deadUntil;
    }
  }
  // mob respawns (spec §3.3): processed at tick start
  // §6ao (v6): THE RISEN CRUMBLE WITH THEIR KING. A risen exists only while the
  // one who raised it lives and is present. If the King is dead (or somehow gone),
  // his dead fall still -- so killing him clears the Moor, and the world never
  // fills with permanent summoned dead. Their bones do not drop from crumbling;
  // only a risen you actually put down leaves anything.
  for (const rid of Object.keys(s.mobs)) {
    const r = s.mobs[rid];
    if (!r || r.type !== 'risen') continue;
    if (r.hp <= 0) { delete s.mobs[rid]; continue; }   // a risen put down is gone
    const king = r.raisedBy ? s.mobs[r.raisedBy] : null;
    if (!king || king.hp <= 0) { delete s.mobs[rid]; }
  }
  for (const m of Object.values(s.mobs)) {
    if (m.hp <= 0 && m.respawnAt <= s.tick) {
      // §6ao (v6): a summoned risen does not come back on its own -- only the
      // King raises more. (It is cleaned up by the crumble pass / stays dead.)
      if (MOB_STATS[m.type]?.summoned) continue;
      m.hp = MOB_STATS[m.type].maxHp;
      m.x = m.hx; m.y = m.hy; // the dead come back where they belong
      // §6w: A DRAGON COMES BACK WITH ITS BOW.
      //
      // The bow used to be kept for as long as its bearer kept logging in, and
      // taken away only if they were absent six hours. Two things were wrong
      // with that. It punished sleep -- a citizen went to bed holding the
      // finest thing in the world and woke without it, which reads as a bug
      // however correct it is. And it was a clock anyway, just a clock that
      // only some people were on.
      //
      // Now the bow lives exactly as long as the dragon is dead. It falls when
      // the dragon falls and goes home when the dragon rises, six hours later,
      // wherever it is and whoever holds it.
      //
      // This answers the objection the old rule was written against -- "if it
      // rots on a clock, nobody needs to hunt the holder, they just wait."
      // Waiting does not get you the bow. It gets you a four-hundred-and-
      // twenty hitpoint dragon that hits for twenty-eight, standing between
      // you and the bow exactly as it did the first time. The clock hands it
      // back to the DRAGON, never to the patient.
      //
      // And it makes the six hours a possession rather than a punishment: it
      // is yours, it is running out, use it.
      if (m.type === 'dragon' && s.bowOut) {
        s.bowOut = false;
        let taken = false;
        for (const pid2 of Object.keys(s.players).sort()) {
          const q = s.players[pid2];
          if (q.equipment?.weapon?.item === 'dragonbow') { q.equipment.weapon = null; taken = true; }
          for (let i = 0; i < (q.inventory?.length ?? 0); i++)
            if (q.inventory[i]?.item === 'dragonbow') { q.inventory[i] = null; taken = true; }
        }
        for (const gid2 of Object.keys(s.ground).sort())
          if (s.ground[gid2].item === 'dragonbow') { delete s.ground[gid2]; taken = true; }
        if (taken) announce(s, 'The DRAGON has risen, and taken back its BOW.');
      }
    }
  }
  // wandering (spec §3.3): the beacon paces the goblins, identically everywhere
  const pinned = new Set();
  for (const p of Object.values(s.players)) if (p.action?.mobId) pinned.add(p.action.mobId);
  for (const mid of Object.keys(s.mobs).sort()) {
    // §6ac: SHE DOES NOT WANDER. A siren sits on her strand and sings.
    //
    // Every other beast drifts a tile or two about its home, which is fine
    // for something you hunt and fatal for something you DUEL: she stepped
    // aside between the validation and the swing, `inReach` went from true to
    // false in the same tick, and the citizen's action was cleared before it
    // ever landed. Every attempt was refused and nothing said why.
    if (MOB_STATS[s.mobs[mid]?.type]?.mirrors) continue;

    const m = s.mobs[mid];
    if (m.hp <= 0 || pinned.has(mid) || (m.rootedUntil ?? 0) > s.tick || (m.stilledUntil ?? 0) > s.tick) continue;
    if (roll(beacon, mid, 'wander') >= 48) continue;
    const [dx, dy] = [[0, -1], [1, 0], [0, 1], [-1, 0]][roll(beacon, mid, 'dir') % 4];
    const nx = m.x + dx, ny = m.y + dy;
    if (nx < 1 || nx >= s.genesis.worldW - 1 || ny < 1 || ny >= s.genesis.worldH - 1) continue;
    if (inCity(s.genesis, nx, ny)) continue; // no mob enters Anchor (spec 2d)
    if (Math.max(Math.abs(nx - m.hx), Math.abs(ny - m.hy)) > 2) continue;
    if (nodeExistsAt(s, _ctx, nx, ny)) continue;
    if (terrainBlocked(s.genesis, nx, ny)) continue; // v0.78: beasts respect the water like everyone else, a goblin was seen STANDING IN THE RIVER
    m.x = nx; m.y = ny;
  }
  // ---- §6aa: THE BEASTS ACT ----
  //
  // Everything a mob does to a citizen happens here, in one phase, on the
  // mob's own clock. Before this, retaliation lived inside the ATTACKING
  // CITIZEN'S action -- so a beast could only act while being acted upon,
  // nothing could ever gang up, and a slow weapon made you harder to hit.
  //
  // A beast picks a target for one of two reasons:
  //   it is ANGRY  -- somebody hit it, and it remembers who (m.mad)
  //   it is HUNTING -- a citizen came within `aggro` and it hunts by nature
  // A creature with no `aggro` never starts anything. A shore-crab is a
  // shore-crab; it answers a blow and otherwise minds its own business.
  //
  // Determinism: mobs in sorted id order, citizens in sorted id order,
  // nearest wins with ties broken by id, every roll from the beacon.
  {
    // one pass to bucket the citizens, so a mob asks about its own
    // neighbourhood rather than about everybody. Without this the cost is
    // mobs x citizens every tick, which is fine at twenty and ruinous at two
    // thousand.
    const CB = 16;
    const buckets = new Map();
    const liveIds = [];
    for (const pid of Object.keys(s.players).sort()) {
      const p = s.players[pid];
      if (!p || p.hp <= 0 || p.deadUntil) continue;
      if (!isAwake(p, s.tick)) continue;   // the world does not hunt the absent
      liveIds.push(pid);
      const k = ((p.y / CB) | 0) * 4096 + ((p.x / CB) | 0);
      let b = buckets.get(k); if (!b) { b = []; buckets.set(k, b); }
      b.push(pid);
    }
    // HOW MANY CAN SET ABOUT ONE PERSON.
    //
    // Density decides this if nothing else does, and density is not evenly
    // spread: measured, one tile in the Crags had FIFTEEN beasts able to
    // reach it, against one in the Heartlands. Fifteen is not a fight, it is
    // a wall, and a wall is not what makes a country dangerous -- it is what
    // makes it closed.
    //
    // So three. Enough that a second and third arriving changes the sum, few
    // enough that the arithmetic stays survivable and a citizen can decide to
    // back out. The rest hang about and will take a turn as others fall away,
    // which is also what a pack does.
    const MAX_ON_ONE = 3;
    // WHERE A BEAST WILL START SOMETHING.
    //
    // This is the whole decision and it deserves to be one line you can read.
    // Aggression everywhere makes death possible while merely walking, and
    // death drops everything -- an hour of gathering lost to a wolf you did
    // not see. Aggression nowhere is the world as it was: sixty skeleton
    // knights that threaten nobody who does not walk up and swing first.
    //
    // So it is a property of COUNTRY, not of creature. A goblin in the
    // Heartlands is the same goblin as one in the Wilds; what differs is
    // whether anybody has made the ground safe. That is what a settled
    // country IS, and now the map says so.
    //
    // Measured worst case, beasts able to reach one tile:
    //   heartlands 1 · moor 2 · wilds 7 · crags 15
    // NOTHING SETS ABOUT A SLEEPING CITIZEN.
    //
    // Death drops everything. A citizen whose client has dropped, or who put
    // the phone down for a minute, is still standing in the world -- and a
    // world where you lose an hour's gathering because your train went into a
    // tunnel is not one anybody should have to play carefully.
    //
    // So a beast will not set about somebody the world already considers
    // asleep. It is not immunity: the moment they act they are awake and fair
    // game again. It only means the world does not hunt the absent.
    //
    // This uses `isAwake`, which the engine already had -- a citizen is awake
    // while an action is running OR they have acted within SLEEP_AFTER. That
    // second clause is generous (500 ticks, five minutes) and generous is
    // right: the cost of being wrong is somebody losing everything they
    // carried because their train went into a tunnel.
    const HUNTS_HERE = (x, y) => {
      const tt = TERRAINS[s.genesis.worldGenerator];
      const c = tt && tt.country ? tt.country(s.genesis, x, y) : null;
      return c === 'wilds' || c === 'crags' || c === 'moor';
    };
    const setAbout = new Map();
    // §6ab: THE WEB MENDS WHAT SITS IN IT.
    //
    // Before anything else, because a citizen should watch their damage being
    // undone rather than discover afterwards that it was. This is the whole
    // fight: cut faster than the web knits.
    for (const mid of Object.keys(s.mobs).sort()) {
      const m = s.mobs[mid];
      if (!m || m.hp <= 0) continue;
      const st = MOB_STATS[m.type];
      if (!st?.mends) continue;
      if (m.hp < st.maxHp) m.hp = Math.min(st.maxHp, m.hp + st.mends);
    }
    if (liveIds.length) for (const mid of Object.keys(s.mobs).sort()) {
      const m = s.mobs[mid];
      if (!m || m.hp <= 0) continue;
      if ((m.stilledUntil ?? 0) > s.tick) continue;   // the truce holds beasts too
      const st = MOB_STATS[m.type];
      const range = Math.max(st.aggro ?? 0, 1) + 2;
      // candidates: this bucket and its neighbours
      let target = null, tid = null, best = 1e9;
      const bx = (m.x / CB) | 0, by = (m.y / CB) | 0;
      const reach2 = Math.max(st.aggro ?? 0, st.breath ?? 0, 1);
      const span = 1 + ((reach2 / CB) | 0);
      for (let oy = -span; oy <= span; oy++) for (let ox = -span; ox <= span; ox++) {
        const b = buckets.get((by + oy) * 4096 + (bx + ox));
        if (!b) continue;
        for (const pid of b) {
          const p = s.players[pid];
          const d = Math.max(Math.abs(p.x - m.x), Math.abs(p.y - m.y));
          // it comes for whoever hit it at any distance it can still see, and
          // for a stranger only within its own nature
          // A BEAST COMES FOR WHAT IT CAN PERCEIVE.
          //
          // This said `d <= reach2 + 6`, which was a number I picked out of
          // the air, and it quietly destroyed the archer. A struck troll would
          // walk ten tiles to find whoever had shot it, so a bow bought no
          // safety at all: measured, a horn-bow at four tiles took 369 damage
          // against a sword's 414, and trained the SAME defence. The whole
          // ranged/melee trade -- safety bought with fragility -- collapsed
          // into "melee that opens further out".
          //
          // A creature's `aggro` is how far it perceives. It should be able to
          // come for its attacker within that, plus a couple of tiles of
          // casting about, and no further. Which means an archer who stays
          // beyond a beast's senses is genuinely safe, and has to KNOW what
          // those senses are: a troll perceives four, a wolf five. Outranging
          // a wolf takes a better bow than outranging a troll.
          //
          // The bargain is restored and improved: it is no longer "hold a bow
          // and be safe" but "hold enough bow, and hold your distance".
          // NO MARGIN. `aggro + 2` sounded like generosity and was a wall: a
          // goblin perceiving five outranges every bow in the world except the
          // one there is one of. What a creature perceives is exactly its
          // `aggro`, which makes a readable ladder out of numbers already in
          // the table --
          //
          //   goblin  3   a wooden bow keeps you clear
          //   troll   4   a horn-bow does
          //   wolf    5   you need the best bow, or you accept the risk
          //   skeleton 5  likewise
          //
          // An archer is safe again, and it is a skill rather than a property
          // of holding a bow: you have to know what is looking at you.
          const senses = m.type === 'incursion' && m.mad === pid
            ? (m.leash ?? st.aggro ?? 0)   // §6ao (v6): an incursion never loses the scent of the one it came for, out to its leash
            : (st.aggro ?? 0);
          // §6ac: she answers her own opponent and nobody else
          if (st.mirrors) { if (m.bound !== pid) continue; }
          // HUNTS_HERE KEEPS THE SETTLED COUNTRY SAFE, and a harmless thing is
          // not a danger to be kept from anybody. A shore-crab has aggro 4 and
          // stands on the tideline, which is downland -- so its aggro could
          // never fire, and the one creature in this world written to bustle
          // at a citizen and swing and never land stood as still as a sheep.
          //
          // Harmless beasts hunt wherever they live. Nothing can come of it:
          // §6z already says a harmless creature swings and never lands, and
          // teaches no combat for the trouble. What it costs a citizen is
          // being followed about by a crab, which is the entire point of it.
          const mayStart = st.harmless || HUNTS_HERE(m.x, m.y);
          // §6av: a beast maddened by a gunshot comes from further off than it
          // could have SEEN you -- that is what the noise is for.
          const wants = (m.mad === pid && d <= Math.max(senses, GUN_NOISE))
            || (st.aggro && d <= st.aggro && mayStart);
          if (!wants) continue;
          if (d < best) { best = d; target = p; tid = pid; }
        }
      }
      if (!target) {
        if (m.mad !== undefined) delete m.mad;
        // §6ac: she lets go of anybody who has fallen, left, or stopped
        // coming, so nobody can hold her by logging off
        if (st.mirrors && m.bound !== undefined) {
          const b = s.players[m.bound];
          if (!b || b.hp <= 0 || b.deadUntil || !isAwake(b, s.tick)
              || Math.max(Math.abs(b.x - m.x), Math.abs(b.y - m.y)) > 24) {
            delete m.bound; delete m.quiver;
          }
        }
        continue;
      }
      const already = setAbout.get(tid) ?? 0;
      if (already >= MAX_ON_ONE) continue;   // the rest wait their turn

      // §6ao (v6): THE GIBBET KING RAISES THE DEAD. Instead of hunting, he calls
      // up risen and sends them at whoever came. He does it on his own clock
      // (raiseEvery), up to a cap of living risen he has raised (raiseCap) -- so
      // the fight is cutting through the wave faster than he renews it, not a
      // DPS check on him directly. The risen are his: tagged with m.raisedBy so
      // they crumble when he falls. He still stands his ground and claws anyone
      // who reaches him (the melee below), but the dead are the real threat.
      if (st.raises && target) {
        const alive = [];
        for (const oid of Object.keys(s.mobs)) {
          const o = s.mobs[oid];
          if (o && o.hp > 0 && o.type === 'risen' && o.raisedBy === mid) alive.push(oid);
        }
        if (alive.length < (st.raiseCap ?? 4) && (s.tick - (m.lastRaise ?? -999)) >= (st.raiseEvery ?? 5)) {
          // seat a risen on a free tile beside the King, aggro'd at the target
          for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]) {
            const rx = m.x + dx, ry = m.y + dy;
            if (rx < 1 || ry < 1 || rx >= s.genesis.worldW - 1 || ry >= s.genesis.worldH - 1) continue;
            if (terrainBlocked(s.genesis, rx, ry) || nodeExistsAt(s, _ctx, rx, ry)) continue;
            if (Object.values(s.mobs).some(o => o.hp > 0 && o.x === rx && o.y === ry)) continue;
            const rid = 'risen-' + mid + '-' + s.tick;
            addMob(s, rid, 'risen', rx, ry);
            s.mobs[rid].raisedBy = mid;
            s.mobs[rid].mad = tid;            // it comes for whoever the King saw
            s.mobs[rid].hx = rx; s.mobs[rid].hy = ry;
            m.lastRaise = s.tick;
            break;
          }
        }
      }

      // §6ac: THE MIRROR. Her reach, her damage and her ammunition are the
      // citizen's, read fresh each swing, because the fight is meant to be
      // exactly even and stay that way if they change weapons mid-fight.
      let mirrorHit = null, mirrorReach = 1;
      if (st.mirrors && target) {
        const tw = weaponOf(target);
        mirrorReach = tw?.reach ?? 1;
        mirrorHit = 1 + Math.floor(effLevel(target.skills.attack) / 10) + (tw?.hit ?? 0);
        if (tw?.ranged === true && best > 1) {
          if ((m.quiver ?? 0) <= 0) mirrorReach = 1;   // she is out, as you would be
        }
      }
      const canBreathe = (st.breath ?? 0) > 0 && best > 1 && best <= st.breath;
      const canClaw = st.mirrors ? best <= mirrorReach : best === 1;
      if (canClaw || canBreathe) {
        setAbout.set(tid, already + 1);
        // A BREATH IS NOT A SWING.
        //
        // The dragon claws every tick, which is what makes it lethal in
        // close, and it was breathing every tick too -- so the approach did
        // as much damage as the fight and a party spent every tick eating
        // instead of swinging. Two citizens could not finish it at any
        // breath strength I tried, because the problem was never the
        // strength. It was the RATE.
        //
        // Fire is a big, slow thing. It comes every `breathEvery` ticks and
        // it hurts when it lands; claws come constantly and are soaked by
        // armour. The approach is now a gauntlet you can run rather than a
        // wall you stand in.
        const every = canBreathe ? (st.breathEvery ?? st.every ?? MOB_EVERY) : (st.every ?? MOB_EVERY);
        if (s.tick - (m.lastSwing ?? -64) < every) continue;
        m.lastSwing = s.tick;
        // §6z: a harmless creature swings and never lands, and teaches no
        // defence for it. Risk is the only thing that trains that skill.
        if (st.harmless) continue;
        const defLvl = effLevel(target.skills.defence);
        // mirrored: her accuracy is the citizen's own attack against their own
        // defence, which is what makes it a coin flip decided by supplies
        const useAtk = st.mirrors ? effLevel(target.skills.attack) : st.atk;
        // §6ap: the beasts roll on the same ratio as everybody else, and
        // armour enters HERE for them too. Leaving them on the old clamp with
        // a subtraction would have made steel work one way against a citizen
        // and another way against a wolf, which is the sort of split nobody
        // can hold in their head.
        const Tm = hitChance256(useAtk, defLvl, 0, armourOf(target));
        if (st.mirrors && mirrorReach > 1 && best > 1 && m.quiver !== undefined) m.quiver -= 1;
        if (canBreathe || roll(beacon, mid, 'mobatk') < Tm) {   // §6x: a breath cannot be dodged
          // §6x: armour turns a blow aside, and a breath goes round it. Fire
          // does not care how much steel is between it and you.
          // §6ae: STARMETAL TURNS FIRE. Bronze does not.
          //
          // Fire ignores armour the way a flail does -- except starmetal,
          // which is why it is worth reaching fifty for. This is the property
          // that makes the second tier a TIER rather than a slightly better
          // shirt: a full star suit is the thing you wear to the one fight
          // that matters, and bronze is simply not admitted to it.
          //
          // Half soak against fire, not full: it turns the flame, it does not
          // pretend the flame is not there.
          // §6ap: and nothing is subtracted -- except that FIRE STILL GOES
          // ROUND STEEL. A breath ignores the armour in the roll above by
          // being unmissable; that is now the whole of its privilege, and it
          // is a bigger one than the half-soak it replaces.
          const soak = 0;
          const hit = canBreathe ? (st.breathHit ?? st.maxHit)
                    : (mirrorHit !== null ? mirrorHit : st.maxHit);
          target.hp -= afterShield(target, Math.max(1, 1 + (roll(beacon, mid, 'mobdmg') % hit) - soak));   // 6bz
          // §2g EXTENDED TO THE BEASTS: A STRUCK CITIZEN STRIKES BACK.
          //
          // The constitution has said this since v0.36, and said it only of
          // citizens: "when a citizen with no combat action of their own is
          // hit by another citizen, they automatically engage their
          // attacker. Flight remains possible: any move breaks the
          // engagement." Every word of that is as true of a goblin, and it
          // was left out for no reason anyone recorded -- so a citizen with
          // four wolves on them stood and took it unless they clicked, while
          // the same citizen fought back on reflex against a person.
          //
          // A window can imitate this, and one of them did. That was wrong:
          // it made a citizen's reflexes depend on which window they were
          // looking through, which is the one thing this world does not let a
          // window decide. It belongs here, where it applies to everyone.
          //
          // The two conditions are the same as the PvP rule's, and both
          // matter. NO COMBAT ACTION OF THEIR OWN, so a deliberate fight with
          // something else is never hijacked. And flight still works: moving
          // clears the action, exactly as it does above.
          if (target.hp > 0 && target.action?.type !== 'attack'
              && target.action?.type !== 'attackp') {
            target.action = { type: 'attack', mobId: mid, since: s.tick + 1, style: 'even' };
          }
          if (target.hp <= 0) {
            // §6w: THE BOW SURVIVES ITS BEARER.
            //
            // Every other route by which the bow leaves a citizen resets
            // `bowOut` -- it rots off the ground, it goes home when they are
            // swept or archived, it spills to the ground when they fall in
            // PvP. Only this one, death to a beast, annihilated the pack
            // WITHOUT resetting the flag: the one unique object in the world
            // ceased to exist and the world still believed one was loose, so
            // the dragon would never drop another.
            //
            // And this is the LIKELY death, not the edge case: taking the bow
            // means standing next to a maxHit 28 dragon. The bow was one bad
            // fight from being gone forever, silently.
            if (_carriesBow(target)) {
              s.bowOut = false;
              announce(s, 'The DRAGONBOW has gone back to the Wilds; its bearer fell.');
            }
            target.hp = 0;
            spillHoods(s, target, tid ?? 'v');   // §6ax: before the pack goes
            const kept9 = prayerKeeps(target, s.tick);
            target.inventory = Array(INV_SLOTS).fill(null);
            target.equipment = { weapon: null, head: null, body: null };
            kept9.forEach((k, i) => { target.inventory[i] = k; });
            // §11d: THE CONSIGNMENT SPILLS EVEN WHEN THE PACK BURNS. A beast
            // kills like any other death here -- the pack is annihilated -- but
            // what was consigned lies where it fell, on the ordinary hundred-
            // interval clock. The rule says WHERE THEY FALL, not "where a
            // citizen felled them": a caravan lost to wolves is still a
            // caravan on the ground, and whoever comes down the road next may
            // have it.
            if (target.consignment) {
              let sc = -1;
              for (const cs of target.consignment.items) { sc++; if (!cs) continue;
                s.ground['g' + s.tick + '-' + (tid ?? 'v') + '-c' + sc] =
                  { item: cs.item, qty: cs.qty ?? 1, x: target.x, y: target.y, expiresAt: s.tick + 100 };
              }
              target.consignment = null;
            }
            target.action = null;
            target.trade = null;
            target.deadUntil = s.tick + DEATH_TICKS;
            delete m.mad;
          }
        } else {
          // §6aa: A SWING THAT COULD NEVER HAVE LANDED TEACHES NOTHING.
          //
          // Defence is paid for in RISK and only in risk. `Tm` is clamped to
          // a floor of 16, and a beast sitting on that floor is not missing
          // you -- it is incapable of touching you, and standing in a crowd
          // of them was free experience:
          //
          //   defence  armour   xp    damage   xp per point of damage
          //         1  none    540      447                      1.2
          //        50  star   1136       23                     49.4
          //
          // Forty times better for the citizen in no danger, which is exactly
          // backwards. At the floor there is no lesson, so there is no
          // experience. The moment something can actually reach you it
          // teaches again, and a beginner in a goblin pile still learns.
          //
          // §6aa: YOU LEARN TO DEFEND WHILE YOU ARE FIGHTING.
          //
          // Aggression is new, and it broke an assumption nothing had needed
          // to state: before it, a beast only swung when you were swinging at
          // it, so being attacked and fighting were the same thing. Now they
          // are not, and a citizen could stand in a crowd of goblins with
          // their hands in their pockets and earn what a real fight earns --
          // measured, 1136 experience for 23 damage at defence 50, against
          // 540 for 447 at defence 1. Forty times better for being in no
          // danger at all.
          //
          // Two attempts to fix this were worse than the fault. Scaling by
          // accuracy walled defence off at about thirty-two, which no living
          // citizen had passed. Gating on `action` was right in principle and
          // useless in practice, because an action CLEARS the moment a beast
          // steps out of reach -- it would have flickered off through every
          // legitimate fight.
          //
          // `lastSwing` is the steady signal, and it already exists: the tick
          // a citizen last swung at anything. It survives a beast wandering,
          // it cannot be held by standing still, and it needs no new field.
          // Twenty ticks is twelve seconds -- longer than any weapon's
          // cadence, so an honest fight never lapses.
          if (s.tick - (target.lastSwing ?? -999) > 20) continue;
          // Restored flat: four for a miss, which is the rule every existing
          // citizen was built under. The gate above is what closed the farm,
          // and it did so without touching the arithmetic anybody has already
          // trained against.
          // 6br: WHAT A MISS TEACHES IS WHAT IT WOULD HAVE COST.
          //
          // A flat four meant a goblin -- one point of damage, the weakest
          // thing alive -- taught a defender exactly what the Gibbet King did.
          // At ninety-nine defence everything misses about ninety-seven per
          // cent of the time, so there was never any reason to stand in front
          // of anything dangerous: the safest camp was also the best.
          //
          // Three times the blow's own maximum. A goblin teaches three, a
          // troll nine, a knight and the King twelve. Tanking becomes a
          // decision about what you are willing to be hit by.
          target.skills.defence += DEFENCE_PER_MAXHIT * (st.maxHit ?? 1);
        }
        continue;
      }

      // NOT IN REACH: close the distance. A beast on a leash from its home,
      // so an angry goblin does not follow you across the island -- but a
      // longer leash than the two tiles it wanders, or it could never catch
      // anybody at all.
      if ((m.rootedUntil ?? 0) > s.tick) continue;
      const dx = Math.sign(target.x - m.x), dy = Math.sign(target.y - m.y);
      for (const [sx, sy] of [[dx, dy], [dx, 0], [0, dy]]) {
        if (!sx && !sy) continue;
        const nx = m.x + sx, ny = m.y + sy;
        if (nx < 1 || nx >= s.genesis.worldW - 1 || ny < 1 || ny >= s.genesis.worldH - 1) continue;
        if (inCity(s.genesis, nx, ny)) continue;                 // §2d: not into Anchor
        // §6ao (v6): the incursion carries its OWN leash (set at spawn), longer
        // than an ordinary beast's, so it can be LED toward help across a
        // country before it gives up -- but still bounded, so it is lost if you
        // outrun it. Ordinary beasts keep the home-range leash unchanged.
        const leashLimit = m.leash !== undefined ? m.leash : range + 6;
        if (Math.max(Math.abs(nx - m.hx), Math.abs(ny - m.hy)) > leashLimit) continue;
        if (nodeExistsAt(s, _ctx, nx, ny)) continue;
        if (terrainBlocked(s.genesis, nx, ny)) continue;
        m.x = nx; m.y = ny; break;
      }
    }
  }

  // v0.74: the shelves rot. Every SHELF_DECAY_EVERY intervals a sixteenth of
  // each stock is lost, rounded up so nothing lingers forever at a count of
  // one. Goods still on a shelf are goods nobody wanted at that price, and a
  // world where every log ever cut waits in a shop is a world whose economy
  // only ever grows. This is the item sink that selling used to be.
  if (s.tick % SHELF_DECAY_EVERY === 0) {
    for (const nid of Object.keys(s.nodes).sort()) {
      const n2 = s.nodes[nid];
      if (n2.type !== 'store' || !n2.shelf) continue;
      for (const item of Object.keys(n2.shelf).sort()) {
        const q = n2.shelf[item];
        const gone = Math.max(1, q >> SHELF_DECAY_SHIFT);
        if (q - gone <= 0) delete n2.shelf[item];
        else n2.shelf[item] = q - gone;
      }
      if (Object.keys(n2.shelf).length === 0) delete n2.shelf;
    }
  }

  // player-made fires burn out (spec §6f)
  for (const [nid, n2] of Object.entries(s.nodes)) {
    if (n2.expiresAt && n2.expiresAt <= s.tick) deleteIndexedNode(s, _ctx, nid);
  }
  // §6o: a crop left too long goes over. It no longer blocks anybody -- a row
  // is the citizen's own -- but it must still clear, or a citizen who plants
  // and forgets fills their own thirty-two and can never sow again.
  for (const pid2 of Object.keys(s.players)) {
    const p2 = s.players[pid2];
    if (!p2?.crops) continue;
    for (const k of Object.keys(p2.crops))
      if (s.tick - p2.crops[k] > CROP_ROTS_AFTER) delete p2.crops[k];
    if (Object.keys(p2.crops).length === 0) delete p2.crops;
  }
  // ground decay (spec §3.4): the ground forgets
  for (const [gid, g2] of Object.entries(s.ground)) {
    if (g2.expiresAt <= s.tick) {
      // §6w: THE GROUND DOES NOT FORGET THE BOW -- it goes home instead.
      //
      // Ground items rot in a hundred ticks. Kill the dragon and die before
      // you can stoop for it, or drop it and walk away, and the one unique
      // object in the world would simply stop existing -- with `bowOut` still
      // saying it was loose, so the dragon would never yield another. The
      // finest thing here, gone in sixty seconds, and nothing in the world
      // would know.
      //
      // Everywhere else the rule is the same: whoever stops holding the bow
      // gives it back to the dragon. The ground is no different.
      if (g2.item === 'dragonbow' && s.bowOut) {
        s.bowOut = false;
        announce(s, 'The DRAGONBOW lay unclaimed, and has gone back to the Wilds.');
      }
      delete s.ground[gid];
    }
  }

  _p2mark('input_prep');
  // discard duplicate-input bundles (spec §5)
  const seen = new Map();
  for (const inp of inputs) {
    seen.set(inp.playerId, seen.has(inp.playerId) ? 'DUP' : inp);
  }

  // v0.70 (§5.4): a tick applies at most MAX_APPLIED_INPUTS inputs, and WHICH
  // ones is decided here rather than by whichever arrived first. Arrival order
  // differs between nodes, so a cap applied at the door meant two nodes could
  // hold different inputs for the same tick, compute different states, and
  // reach no quorum: a flood of worthless keys could stop the world outright.
  //
  // The rule is: citizens who already exist in this world are served before
  // unknown keys, and within each group the order is the canonical playerId
  // order used everywhere else. So an attacker minting identities can crowd
  // out other NEW arrivals, but can never displace a citizen already standing
  // in the world, and every node discards exactly the same inputs.
  let order = [...seen.keys()].sort();
  // §5h: spawns are budgeted APART from actions, and the budget is tiny.
  // Taken in canonical playerId order so every node admits the same souls;
  // the rest are simply not applied and may try again next tick.
  {
    let born = 0;
    order = order.filter((pid) => {
      const inp = seen.get(pid);
      if (inp === 'DUP' || inp?.type !== 'spawn') return true;
      if (s.players[pid]) return true;          // not actually a birth
      return ++born <= MAX_SPAWNS_PER_TICK;
    });
  }
  if (order.length > MAX_APPLIED_INPUTS) {
    const known = [], strangers = [];
    for (const pid of order) (s.players[pid] ? known : strangers).push(pid);
    // Strangers are guaranteed a share of the tick; known citizens take the
    // rest. Whichever group is short leaves its remainder to the other, so
    // nothing is wasted when nobody is knocking.
    const forStrangers = Math.min(strangers.length, STRANGER_SHARE);
    const forKnown = Math.min(known.length, MAX_APPLIED_INPUTS - forStrangers);
    order = known.slice(0, forKnown)
      .concat(strangers.slice(0, Math.min(strangers.length, MAX_APPLIED_INPUTS - forKnown)));
    order.sort(); // apply in canonical order, as always
  }
  _p2mark('input_apply');
  for (const pid of order) {
    const inp = seen.get(pid);
    if (inp === 'DUP' || !validInput(state, inp, _ctxPre)) continue;
    // AND THE WORLD SEES IT. Set before the deed is carried out, in ONE place,
    // so no branch can quietly forget: validInput has already accepted it, so
    // the citizen is doing this thing on this interval whatever comes of it.
    // A deed that takes longer than an interval sets `action` instead, and
    // always did.
    if (DEED_SET.has(inp.type) && s.players[pid]) s.players[pid].deed = inp.type;
    // §6am: and a deed that teaches ends whatever else was running, in ONE
    // place so no future verb can quietly forget. Set BEFORE the branch, so a
    // branch that starts its own action (raising a stall) overwrites it.
    if (TEACHES.has(inp.type) && s.players[pid]) s.players[pid].action = null;
    if (inp.type === 'restore') {
      // Back exactly as they left, and present, so the sweep does not turn
      // round and archive them again on the same tick. The slot they came
      // from is EMPTIED -- which is what stops the same record being
      // restored twice.
      // the path must answer to the root AS IT NOW STANDS, after whatever
      // else this tick has already done to it
      const live = s.archiveRoot ?? EMPTY_ROOT;
      const digest = sha256(Buffer.from(canonical(inp.record))).toString('hex');
      if (!_smtProves(live, inp.playerId, digest, inp.path)) continue;
      const nr = _smtWith(inp.playerId, null, inp.path);
      if (nr === null) continue;
      const rec = _deepCloneJson(inp.record);
      rec.lastInput = s.tick;
      s.players[inp.playerId] = rec;
      s.archiveRoot = nr;
      if (s.archiveRoot === EMPTY_ROOT) delete s.archiveRoot;
      continue;
    }
    if (inp.type === 'archive') {
      // out of the tick, into the root. The record itself is kept by every
      // node on disk; the world keeps only the proof that it was so.
      const subj = s.players[inp.subject];
      if (!subj) continue;
      // §6w: THE BOW DOES NOT GO ON THE SHELF WITH THEM.
      //
      // This cleared `bowOut` and archived the citizen UNCHANGED, so their
      // stored record still held the bow. The dragon was then free to drop
      // another, somebody took it -- and when the first citizen restored, they
      // came back carrying theirs. Two dragonbows, in a world whose whole
      // rule about the thing is that there is one.
      //
      // It is the same fault the sweep already fixed for absence and the same
      // fix: take it off the record before the record is sealed. The
      // announcement was always true; the code simply did not do it.
      if (_carriesBow(subj)) {
        s.bowOut = false;
        if (subj.equipment?.weapon?.item === 'dragonbow') subj.equipment.weapon = null;
        for (let i = 0; i < subj.inventory.length; i++)
          if (subj.inventory[i]?.item === 'dragonbow') subj.inventory[i] = null;
        announce(s, 'The DRAGONBOW has gone back to the Wilds.');
      }
      // the slot must be empty under the LIVE root, not the opening one
      const live = s.archiveRoot ?? EMPTY_ROOT;
      if (!_smtProves(live, inp.subject, null, inp.path)) continue;
      const digest = sha256(Buffer.from(canonical(subj))).toString('hex');
      const nr = _smtWith(inp.subject, digest, inp.path);
      if (nr === null) continue;
      s.archiveRoot = nr;
      delete s.players[inp.subject];
      continue;
    }
    if (inp.type === 'spawn') {
      const sp = spawnOf(s.genesis); addPlayer(s, pid, sp.x, sp.y);
      // the newcomer's quiver (v0.78): every soul wakes with twenty-five
      // arrows. At ranged 1 with a wooden bow an arrow lands half the
      // time for 1, so a 5hp goblin costs ~10 expected: the quiver is
      // two goblins with slack, the ARCHER need not first be a
      // brawler (§7f's own principle, in combat's house). Spawn is
      // creation-only (§5b: the only input for unknown ids), so death
      // never re-fills it, and imported citizens arrive with their own
      // packs untouched.
      s.players[pid].inventory[0] = { item: 'arrows', qty: 25 };
      continue;
    }
    const p = s.players[pid];
    if (p) p.lastInput = s.tick; // presence (spec 5e)
    // 6ch: attunement is gone with the stones; standing beside one taught
    // the road nothing, because there is no road to teach.
    if (p && p.consignment) { // §11c: a leg is reached by STANDING beside its store
      const c = p.consignment;
      if (c.leg < c.route.length) {
        const want = s.nodes[c.route[c.leg]];
        if (want && adjacent(p, want)) c.leg++;
      }
    }
    if (inp.type === 'move') {
      if ((p.rootedUntil ?? 0) <= s.tick) { p.x += inp.dx; p.y += inp.dy; } // rooted: held in place by the star-dagger
      p.action = null;
    } else if (inp.type === 'raise_market') {
      // the work begins; the world will finish it if nobody interrupts
      p.action = { type: 'raise', since: s.tick };
    } else if (inp.type === 'stock_market') {
      const mid = myMarketIdBeside(s, p, pid);
      const sl = p.inventory[inp.slot];
      const mk = mid ? s.nodes[mid] : null;
      if (mk && sl && sl.item !== 'dragonbow' && !isHood(sl.item)) {   // §6ax: nor will a shelf hold one
        const kinds = Object.keys(mk.shelf ?? {});
        if ((!kinds.length || kinds[0] === sl.item)
            && ((mk.shelf?.[sl.item] ?? 0) + (sl.qty ?? 1)) <= MARKET_STOCK) {
          mk.shelf = mk.shelf ?? {};
          mk.shelf[sl.item] = (mk.shelf[sl.item] ?? 0) + (sl.qty ?? 1);
          p.inventory[inp.slot] = null;
          mk.lastUsed = s.tick;
        }
      }
    } else if (inp.type === 'price_market') {
      const mid = myMarketIdBeside(s, p, pid);
      if (mid) { s.nodes[mid].ask = inp.ask; s.nodes[mid].lastUsed = s.tick; }
    } else if (inp.type === 'take_market') {
      const mid = myMarketIdBeside(s, p, pid);
      const mk = mid ? s.nodes[mid] : null;
      if (mk && (mk.coin ?? 0) > 0) {
        p.gold = (p.gold ?? 0) + mk.coin;
        delete mk.coin;
        mk.lastUsed = s.tick;
      }
    } else if (inp.type === 'dismantle_market') {
      // the timber comes back; WHATEVER IS ON THE SHELF SPILLS, which is what
      // stops a stall being storage that can be closed at leisure
      const mid = myMarketIdBeside(s, p, pid);
      const mk = mid ? s.nodes[mid] : null;
      if (mk) {
        spillShelf(s, mk);
        if ((mk.coin ?? 0) > 0) p.gold = (p.gold ?? 0) + mk.coin;
        for (let i2 = 0; i2 < MARKET_LOGS; i2++) addItem(p.inventory, 'logs', 1);
        for (let i2 = 0; i2 < MARKET_ORE; i2++) addItem(p.inventory, 'ore', 1);
        deleteIndexedNode(s, _ctx, mid);
      }
    } else if (inp.type === 'unmake') {
      const gr = s.ground?.[inp.groundId];
      const si = p.inventory.findIndex((sl) => sl?.item === 'sigil');
      if (gr && si !== -1 && p.equipment?.weapon?.item === 'heartwood-staff'
          && Math.max(Math.abs(gr.x - p.x), Math.abs(gr.y - p.y)) <= UNMAKE_RANGE) {
        p.inventory[si] = null;                 // the sigil goes with it
        // §6w: BUT THE BOW CANNOT BE UNMADE. There is one, and there will only
        // ever be one, so deleting the pile would have taken it out of the
        // world for good AND left `bowOut` true, meaning the dragon would never
        // drop another. The sixth road home, and it nearly was not one: every
        // other route sets the flag and removes the item together.
        //
        // It goes back to the Wilds, and THAT is worth announcing -- somebody
        // spent three magic-stone to deny a dragonbow, which the whole island
        // should hear about.
        if (gr.item === 'dragonbow' && s.bowOut) {
          s.bowOut = false;
          announce(s, (p.name ?? pid.slice(0, 6))
            + ' unmade the DRAGONBOW where it lay. It has gone back to the Wilds.');
        }
        // and no announcement for anything else: a spell cast on every spilled
        // pack would be a drumbeat nobody could read past
        delete s.ground[inp.groundId];          // and so does the pile
        p.skills.magic += XP_ALCH;              // the practice, and nothing else
      }
    } else if (inp.type === 'alch') {
      const slot = p.inventory?.[inp.slot];
      const worth = slot ? alchValue(slot.item) : 0;
      const priced = slot ? (slot.item in PRICES) : false;
      if (priced && (s.tick - (p.lastAlch ?? -99) >= alchEveryFor(p))) {
        // ONE FROM THE STACK, NEVER THE STACK.
        //
        // This melted the whole slot: a citizen with twenty ale clicked once
        // and watched twenty ale become a hundred and twenty gold, at three
        // quarters, with no way back. That is a trap, not a decision, and
        // trading already knows better -- an offer of arrows moves one arrow.
        //
        // It also makes the stackables worth carrying rather than dangerous:
        // a stack is many casts, so a brewer can walk out with an afternoon of
        // alchemy in one slot instead of one cast in one slot.
        p.lastAlch = s.tick;
        p.gold = (p.gold ?? 0) + worth;
        const left = (slot.qty ?? 1) - 1;
        p.inventory[inp.slot] = left > 0 ? { item: slot.item, qty: left } : null;
        // THE EXPERIENCE IS FLAT, AND THIS IS THE POINT.
        //
        // It followed the item's value at first, which sounds generous and is
        // a trap: a star-plate trained magic seventy-five times faster per
        // cast than a log, so the efficient way to learn magic became
        // acquiring and destroying the most valuable gear in the world. That
        // is a fighter's path and a Wilds-runner's path, and magic in this
        // world is the ANTI-combat skill -- teleport, heal, still. It would
        // have been trained by exactly the citizens it was not for.
        //
        // Flat experience separates the two decisions cleanly. What is worth
        // alching is an economic question about price and distance; what is
        // worth alching for PRACTICE is whatever you can gather most of. A
        // woodcutter can learn magic from logs. Nobody burns a star-plate to
        // learn a spell.
        p.skills.magic += XP_ALCH;
      }
    } else if (inp.type === 'mendp') {
      const si = p.inventory.findIndex((sl) => sl?.item === 'sigil');
      const t = s.players[inp.target];
      if (si !== -1 && t && t.hp > 0) {
        p.inventory[si] = null;
        t.hp = Math.min(effLevel(t.skills.hitpoints), t.hp + 20);
        p.skills.magic += XP_SPEND_SIGIL;
        if (claimFirst(s, 'mendp', pid)) announce(s, (p.name ?? pid.slice(0, 6)) + ' is the FIRST to mend somebody who was not themselves.');
      }
    } else if (inp.type === 'recall') {
      // spec 2k: step out of the world beside one waystone and in beside another
      const ws = s.nodes[inp.to];
      if (ws && !inWilds(s.genesis, p.x, p.y) && (p.attuned ?? []).includes(inp.to)) {
        const spot = [[1, 0], [-1, 0], [0, 1], [0, -1]]
          .map(([dx, dy]) => ({ x: ws.x + dx, y: ws.y + dy }))
          .find(t => t.x >= 1 && t.x < s.genesis.worldW - 1 && t.y >= 1 && t.y < s.genesis.worldH - 1
            && !nodeExistsAt(s, _ctx, t.x, t.y));
        if (spot) { p.x = spot.x; p.y = spot.y; }
        p.action = null; p.trade = null;
      }
    } else if (inp.type === 'gather') {
      p.action = { type: 'gather', nodeId: inp.nodeId };
    } else if (inp.type === 'stop') {
      p.action = null;
    } else if (inp.type === 'offer_trade') {
      // the shape gate guarantees both demand fields, canonically, the
      // persisted trade is the signed trade, verbatim (pre-freeze §12)
      // §6q: AN OFFER NAMES WHAT IT GIVES, not merely where it sits.
      //
      // A stored offer was {to, giveSlots, wantItem, wantGold} -- addresses
      // with no commitment to their contents. Inputs apply in canonical
      // playerId order, so an offerer whose id sorts first could WIELD the
      // advertised slot in the settling tick: `wield` swaps the equipped item
      // into that slot, so they keep the sword, take the gold, and hand over
      // whatever was on their hip. The acceptance guard checked only that the
      // slot was not empty.
      //
      // That is not a gamble either. Ordering is fixed and public per pair,
      // so an attacker knows before they start which victims are exploitable,
      // and can mint keys until they sort low.
      p.trade = { to: inp.to, giveSlots: inp.giveSlots.slice(),
                  giveItems: inp.giveSlots.map((sl) => {
                    const it = p.inventory[sl];
                    return { item: it.item, qty: it.qty ?? 1 };
                  }),
                  wantItem: inp.wantItem, wantGold: inp.wantGold };
    } else if (inp.type === 'cancel_trade') {
      p.trade = null;
    } else if (inp.type === 'accept_trade') {
      // re-validate against the NEW state (§5c): all-or-nothing. Everything is
      // checked before anything moves, so a trade that cannot complete leaves
      // both packs exactly as they were.
      const o = s.players[inp.from];
      if (o && o.trade && o.trade.to === pid && adjacent(p, o) && tradeFits(o, p, o.trade)) {
        const slots = o.trade.giveSlots;
        const goods = slots.map(sl => o.inventory[sl]);
        if (o.trade.wantGold) { // v0.41: coin settles like any item
          if ((p.gold ?? 0) >= o.trade.wantGold) {
            p.gold -= o.trade.wantGold;
            o.gold = (o.gold ?? 0) + o.trade.wantGold;
            for (const sl of slots) o.inventory[sl] = null;
            for (const g of goods) addItem(p.inventory, g.item, g.qty ?? 1);
            o.trade = null;
          }
        } else {
          const j = p.inventory.findIndex(sl => sl && sl.item === o.trade.wantItem);
          if (j !== -1) {
            // v0.80: pay ONE unit, never the whole stack. The offer names an
            // item, not a quantity, so one unit is the only price the
            // acceptor can see; taking their entire stack of arrows or food
            // was theft-by-deception. A stackable keeps its remainder.
            const src = p.inventory[j];
            const payment = { item: src.item, qty: 1 };
            if ((src.qty ?? 1) > 1) src.qty -= 1; else p.inventory[j] = null;
            for (const sl of slots) o.inventory[sl] = null;
            // the payment lands in the first slot the goods vacated (or pools
            // if the offerer already holds that stackable), so a trade never
            // needs room the offerer did not just make
            if (STACKABLE.has(payment.item)) { addItem(o.inventory, payment.item, 1); }
            else { o.inventory[slots[0]] = payment; }
            for (const g of goods) addItem(p.inventory, g.item, g.qty ?? 1);
            o.trade = null;
          }
        }
      }
    } else if (inp.type === 'attack') {
      p.action = (p.action?.type === 'attack' && p.action.mobId === inp.mobId
                  && p.action.style === (inp.style ?? 'even'))
        ? p.action
        : { type: 'attack', mobId: inp.mobId, since: s.tick, style: inp.style ?? 'even' };
    } else if (inp.type === 'smith') {
      const r = RECIPES[inp.recipe];
      const nearAnvil = hasAdjacentNode(s, _ctx, p, 'anvil');
      const have = (item) => p.inventory.filter(sl => sl && sl.item === item).length;
      if (r && nearAnvil && Object.entries(r).every(([item, qty]) => have(item) >= qty)) {
        for (const [item, qty] of Object.entries(r)) {
          let left = qty;
          for (let i = 0; i < p.inventory.length && left > 0; i++) {
            if (p.inventory[i]?.item === item) { p.inventory[i] = null; left--; }
          }
        }
        // §6av: shot comes five to the ore, as a bone gives five arrows, and it
        // pools into a quiver already held rather than demanding a fresh slot.
        const made = inp.recipe === 'shot' ? SHOT_PER_ORE : 1;
        const ex = STACKABLE.has(inp.recipe)
          ? p.inventory.findIndex(sl => sl?.item === inp.recipe) : -1;
        if (ex !== -1) p.inventory[ex].qty += made;
        else { const slot = firstFreeSlot(p.inventory);
               if (slot !== -1) p.inventory[slot] = { item: inp.recipe, qty: made }; }
        // §6ad: A RECIPE WITHOUT ORE STILL TEACHES SOMETHING.
        //
        // This read `XP_SMITH_PER_ORE * r.ore`, and two recipes have no ore
        // at all -- `sigil-bow` (a horn-bow and three sigils) and
        // `heartwood-bow` (three heartwood), both added after this line was
        // written. `30 * undefined` is NaN.
        //
        // NaN is not merely wrong, it is FATAL: nextState succeeds, so the
        // poisoned skill is committed to consensus state, and `canonical()`
        // refuses non-finite numbers -- so from that tick on no node can
        // compute a stateHash. No attestation, no checkpoint, no quorum, and
        // no re-import either, because validateState rejects it too. One
        // citizen, one ordinary input, and the world can never again prove
        // anything about itself while continuing to tick.
        p.skills.smithing += XP_SMITH_FOR(inp.recipe, r);
      }
    } else if (inp.type === 'wield') {
      const sl = p.inventory[inp.slot];
      if (sl && isEquippable(sl.item)) {
        const g = slotOf(sl.item);
        const cur = p.equipment[g];
        p.equipment[g] = sl;
        p.inventory[inp.slot] = cur;
      }
    } else if (inp.type === 'buy'
               && (() => { const mk = findAdjacentNode(s, _ctx, p, 'market');
                           return mk && (mk.shelf?.[inp.item] ?? 0) > 0 && mk.by !== pid; })()) {
      // §6al: bought from a citizen, at their price, while they sleep
      const mk = findAdjacentNode(s, _ctx, p, 'market');
      const ask = mk.ask ?? 0;
      if (ask > 0 && (p.gold ?? 0) >= ask && canAddItem(p.inventory, inp.item)) {
        p.gold -= ask;
        mk.coin = (mk.coin ?? 0) + ask;
        mk.shelf[inp.item] -= 1;
        if (mk.shelf[inp.item] <= 0) delete mk.shelf[inp.item];
        if (Object.keys(mk.shelf).length === 0) {
          // THE ASK DOES NOT OUTLIVE THE STOCK.
          //
          // An empty stall stands -- it falls on its OWNER's clock, three days
          // from their last attention, not on the shelf's -- and it is free to
          // be restocked with anything. But the price must be set again. Sell
          // two hundred logs at two, restock with magic-stone, forget, and the
          // stones go for two apiece in silence. Clearing it means the owner
          // always names the price for the thing actually on the shelf.
          delete mk.shelf;
          delete mk.ask;
        }
        addItem(p.inventory, inp.item, 1);
        // NOT lastUsed: a sale is the customer's doing, not the owner's, and
        // a stall must not stay up for ever because strangers keep buying
        // from a shelf its keeper abandoned.
      }
    } else if (inp.type === 'buy') {
      // v0.74: the keeper's own goods are made from nothing and priced by the
      // constitution. Everything else on the shelf was put there by a citizen,
      // and costs the ask: what its seller was paid, plus the keeper's cut.
      // A STALL SELLS ITS OWN NARROW STOCK, made from nothing like the
      // keeper's seeds, and takes no shelf and keeps no change.
      const sl = findAdjacentNode(s, _ctx, p, 'stall');
      const stallPrice = sl ? ((STALL_SELLS[sl.kind] ?? {})[inp.item] ?? 0) : 0;
      if (stallPrice) {
        if ((p.gold ?? 0) >= stallPrice && addItem(p.inventory, inp.item, 1)) p.gold -= stallPrice;
      } else {
      const st = findAdjacentNode(s, _ctx, p, 'store');
      const own = inp.item in STORE_SELLS;
      const onShelf = (st?.shelf?.[inp.item] ?? 0) > 0;
      const price = own ? STORE_SELLS[inp.item] : onShelf ? storeAsk(inp.item) : 0;
      if (st && price && (own || onShelf) && (p.gold ?? 0) >= price) {
        if (addItem(p.inventory, inp.item, 1)) {
          p.gold -= price;
          // AND THE COIN GOES INTO THE PURSE, which is the whole point: gold
          // now circulates between citizens and keepers instead of being
          // conjured at one end and shaved at the other. The keeper's cut --
          // the spread between what a seller was paid and what a buyer pays --
          // is still destroyed, so the float shrinks a little on every round
          // trip and the sink outlives the source.
          // 6bn: uncapped. A busy keeper accumulates float, which is correct:
          // a store people buy from can afford to buy from people.
          st.coin = (st.coin ?? PURSE_SEED) + (PRICES[inp.item] ?? 0);
          // goods from the shelf LEAVE the shelf. The keeper's own do not:
          // seeds are made, not stocked.
          if (!own && st.shelf) {
            st.shelf[inp.item] -= 1;
            if (st.shelf[inp.item] <= 0) delete st.shelf[inp.item];
            if (Object.keys(st.shelf).length === 0) delete st.shelf;
          }
        }
      }
      }
    } else if (inp.type === 'special') {
      // §6af: THE SPECIAL BLOW. Resolved here and now rather than becoming an
      // action, because its whole nature is that it happens off the rhythm.
      const q = s.players[inp.targetId];
      const w9 = WEAPONS[p.equipment?.weapon?.item];
      if (q && q.hp > 0 && w9?.spec && mayStrike(s, p, q)) {   // §11d
        // §2b-iv: the mark and the answer, BEFORE the blow -- so a special that
        // kills outright still brands, and the victim's own answer is set even
        // if they do not live to swing it. Hitting somebody is hitting somebody
        // whichever verb carried it.
        strikeConsequences(s, pid, p, q, inp.targetId);
        const drawn9 = drawnAt(p, q);
        if (drawn9) {                       // a drawn shot still costs its arrow
          const aS = p.inventory.findIndex((sl) => sl?.item === ammoOf(p));
          if (aS === -1) { p.action = null; continue; }
          p.inventory[aS].qty -= 1;
          if (p.inventory[aS].qty <= 0) p.inventory[aS] = null;
        }
        const lvl9 = effLevel(drawn9 ? p.skills.ranged : p.skills.attack);
        const defL9 = effLevel(q.skills.defence);
        // 'far' pays for the distance it crossed: nothing at touching range,
        // and its whole weight at the end of its reach
        // 'far' takes the DISTANCE INSTEAD OF the weapon's weight, not as well
        // as it: at touching range the shot is worse than a dagger, and at the
        // end of nine tiles it is the hardest blow in the world. Adding the
        // bow's own hit on top made it strong everywhere, which is the
        // opposite of the point.
        const far9 = w9.spec === 'far'
          ? Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y)) : 0;
        // AND IT MUST BE DAMAGE-NEUTRAL AT ITS BEST, which is the rule every
        // other special in this world obeys. A special spends the arm for this
        // cycle AND the next, so it costs TWO ordinary blows; 'flurry' pays two
        // blows back, 'true' pays certainty, 'now' pays timing. At three
        // halves the first draft paid twenty where two ordinary shots pay
        // twenty-eight, so the shot was strictly worse than not using it.
        //
        // Five halves: at nine tiles it is worth exactly the two shots it cost,
        // delivered as ONE blow, and at every distance closer it is a loss.
        // What an archer buys is not more damage. It is all of it at once, from
        // further away than anyone can answer.
        // NEUTRAL AT EVERY LEVEL, not only at ninety-nine.
        //
        // This added a FLAT distance bonus to a base of lvl/10, and a drawn bow
        // is scored on lvl/12 -- so the special quietly ignored the bow's own
        // divisor and the flat twenty swamped the level term. Measured against
        // the two ordinary shots it costs: at ranged 40 it paid 25 where two
        // shots paid 20, at 70 it paid 28 against 24, and only at ninety-nine
        // did it come out even. Below the cap the answer was always "special",
        // which is the one thing this weapon must not be -- the whole of it is
        // choosing the moment, and a blow that is simply better has no moment.
        //
        // So the special is a MULTIPLE of the ordinary blow at the same level:
        // one of it at touching range, two of it at the end of nine tiles.
        // Neutral at full stretch whatever your ranged is, a loss everywhere
        // nearer, and it scales with the skill the way the ordinary shot does.
        // §6as: a special's blow is strength's too, and its roll is attack's
        const pow9 = drawn9 ? lvl9 : effLevel(p.skills.strength);
        const ord9 = 1 + Math.floor(pow9 / (drawn9 ? 12 : 10)) + (w9.hit ?? 0);
        // §6af-v: AND BLOW COUNT IS THE VARIANCE OF A BURST.
        //
        // Every special's blows were set for its CEILING, and nobody noticed
        // that the same number sets its RELIABILITY. Six blows of twelve and
        // two of thirty-six carry the same burst and are not the same weapon:
        // the first reliably takes a chunk, the second either ends the fight or
        // wastes the recovery. Measured, style is worth twenty points of
        // execute threshold at two blows and nothing at all at six -- six rolls
        // average their own spread away.
        //
        // So the maul, whose whole identity is the largest single blow in the
        // world, becomes a HAYMAKER: two blows at two and a half times, which
        // is the same expected burst on the same recovery of ten. The dagger
        // stays a flurry. A citizen now picks a shape as well as a weapon.
        const bite9 = w9.bite ?? 1;
        const maxHit9 = w9.spec === 'far'
          ? Math.max(1, Math.floor(ord9 * (8 + Math.max(0, far9 - 1)) / 8))
          : Math.round((1 + Math.floor(pow9 / 10) + (w9.hit ?? 0)) * bite9);
        const acc9 = hitChance256(lvl9, defL9, w9.acc ?? 0,
          w9.pierces === true ? 0 : armourOf(q)); // §6x-ii: a flail ignores steel
        // §6af-iii: A BURST IS A COMPRESSION, AND THE PAUSE IS ITS PRICE.
        //
        // `twice` gave two blows for two intervals of arm: neutral, but a burst
        // of twelve per cent of a health bar, which is a rounding error and not
        // a moment. Blow COUNT and RECOVERY are now both read from the table and
        // move together, so a bigger burst buys a longer hole and the damage
        // over time never changes.
        //
        // Measured: burst-per-recovery-interval lands on each weapon's own
        // ordinary damage rate, which is what neutrality MEANS. No special can
        // be stronger than another; the ordering only mirrors the weapon table,
        // so balance stays in one place.
        // §6af-iv: AND THE HEAVY WEAPON COMMITS HARDER.
        //
        // At a shared recovery the burst is dps x recovery, so the DAGGER --
        // best damage rate of anything carrying a special -- owned the biggest
        // burst, while the maul, whose single blow is the largest in the world
        // at seventeen, had the smallest. Backwards. The maul now buys a rarer,
        // heavier commitment instead: eight blows for twenty-four intervals of
        // arm, the largest burst anybody can throw and the longest hole to
        // stand in afterwards. Neutral all the same.
        //
        // AND THE COUNT IS SET AGAINST THE COMBO, NOT THE SPECIAL ALONE. `now`
        // is the one special that can INTERRUPT -- it is gated on a spent arm
        // rather than a recovered one -- so an ordinary blow lands and the
        // special drops on top of it the very next interval. Measuring the
        // special by itself misses the whole point of the weapon. Measured as
        // the pair: eight blows put 89% of a health bar into two intervals,
        // which is a one-shot wearing a gamble's clothing. Five puts 70% there,
        // so there is a line to hold above and a real fight below it. A dagger
        // cannot do this at all -- `twice` waits for the arm, so its ordinary
        // blow and its special can never share a moment.
        const blows = w9.blows ?? (w9.spec === 'flurry' ? 2 : 1);
        for (let b9 = 0; b9 < blows; b9++) {
          // 'true' cannot miss; the others roll as any blow does
          // Every blow is rolled. This once read `spec !== 'true'`, sparing the
          // roll for a horn-bow's certainty -- but certainty cannot be priced
          // (its worth scales inversely with the target's hit rate, so no fixed
          // recovery is neutral across armour), and 'true' was retired. The
          // clause outlived the name and was a trap: anything later called
          // 'true' would have quietly become unmissable.
          if (roll(beacon, pid, 'spec' + b9) >= acc9) continue;
          // ARMOUR SOAKS AN ARROW, on a special exactly as on any other shot.
          //
          // This read `drawn9 ? 0`, so a drawn bow ignored armour entirely --
          // but only on the special. A star-clad citizen soaked four off every
          // arrow all day and nothing off the one that hit for thirty, which
          // made the special strictly better again and undid the timing the
          // weapon exists for. It also quietly took the flail's one privilege:
          // §6x says it is "the only weapon in the world that ignores this
          // subtraction", and pays for it with the lowest base damage of any
          // steel. Two weapons cannot both be the only one.
          // §6ap: armour is in the ROLL now, not in the damage. It subtracts
          // nothing, so a blow that lands lands whole.
          const soak9 = 0;
          const dmg9 = Math.max(0, styleRoll(roll(beacon, pid, 'specd' + b9), maxHit9, inp.style ?? 'even') - soak9);
          q.hp -= afterShield(q, dmg9);   // 6bz
          // §6as-ii: split exactly as an ordinary melee blow splits. A special
          // taught attack alone, so a fighter who favoured it never raised the
          // number their own special scores from.
          if (drawn9) p.skills.ranged += dmg9;   // 6br
          else teachMelee(p, dmg9, inp.style ?? 'even', s.tick);   // §6as-iii
          p.skills.hitpoints += dmg9;
          if (q.hp <= 0) {
            q.hp = 0;
            // what a mourner carries through, decided BEFORE the pack spills
            const keptQ = prayerKeeps(q, s.tick);
            // §2g: the pack spills where they fall, exactly as any PvP death --
            // except whatever a mourner carries through, which is taken out of
            // the spill exactly once each
            const held = keptQ.map((k) => ({ ...k, taken: false }));
            const qid9 = inp?.targetId ?? q.id ?? 'v';
            let sl9 = -1;
            for (const sl of q.inventory) { sl9++; if (!sl) continue; {
              const m9 = held.find((k) => !k.taken && k.item === sl.item && k.qty === (sl.qty ?? 1));
              if (m9) { m9.taken = true; continue; }
              // §2b-v: CONTENT-ADDRESSED, like every other ground key here.
              //
              // This was `g{tick}-{ground.length}` -- the only positional key
              // in the engine, where `drop` uses g{tick}-{pid}-{slot} and mob
              // drops use g{tick}-{mobId}-{i}-{item}. If the ground SHRANK
              // between two spills in one interval, the second reused the
              // first's key and destroyed it. Reproducible: a special kills
              // one citizen, somebody picks up an unrelated pile, an attackp
              // kills a second in the action phase, and the first citizen's
              // pack is simply gone.
              //
              // Griefable, not merely wrong: inputs apply in sorted playerId
              // order, so a patient griefer can grind a key that sorts after a
              // killer's and delete other people's kills on purpose.
              s.ground['g' + s.tick + '-' + qid9 + '-' + sl9] =
                { item: sl.item, qty: sl.qty ?? 1, x: q.x, y: q.y, expiresAt: s.tick + 100 };
            } }
            // §11d: AND THE CONSIGNMENT SPILLS WITH IT, wherever they fell --
            // not only in the Wilds. Without this, killing a hauler destroys
            // the cargo and there is nothing to steal, only somebody to ruin.
            // A mourner's prayer does not reach it: what is consigned was
            // committed to the road.
            if (q.consignment) {
              let sc = -1;
              for (const cs of q.consignment.items) { sc++; if (!cs) continue;
                s.ground['g' + s.tick + '-' + qid9 + '-c' + sc] =
                  { item: cs.item, qty: cs.qty ?? 1, x: q.x, y: q.y, expiresAt: s.tick + 100 };
              }
              q.consignment = null;
            }
            spillHoods(s, q, qid9);   // §6ax: worn or packed, a hood never burns
            q.inventory = q.inventory.map(() => null);
            q.equipment = { weapon: null, head: null, body: null };
            keptQ.forEach((k, i) => { q.inventory[i] = k; });
            q.action = null; q.trade = null; q.deadUntil = s.tick + DEATH_TICKS;
            break;
          }
        }
        // THE COST: the arm is spent for this cycle AND the next
        // §6af-ii: THE COST, and it must be the cost the VALIDATOR quoted.
        //
        // The validator checks the arm against `state.tick`; this runs after
        // `s.tick = state.tick + 1`, so writing `s.tick + every` charged
        // every + 1. A special quietly cost an interval more than the rule
        // said, and the extra interval refused a legitimate second blow in a
        // way indistinguishable from lag -- exactly the failure §6b names for
        // the old hardcoded bow reach.
        // §6af: THE COST -- this cycle and the next, which is what makes the
        // special exactly neutral over time and a burst in the moment. Written
        // against the validator's tick, not the advanced one (defect 1.3).
        //
        // It is also what stops `now` chaining: the arm is spent INTO THE
        // FUTURE, so a second special cannot follow. One interruption, then
        // the full price -- which is what §6af always said and what the pool
        // quietly undid.
        // `now` is gated on `lastSwing <= tick`, not on the full cadence, so
        // its recovery must be written ABSOLUTELY. Netting the cadence out of
        // it -- as every other special requires -- let the maul fire twice as
        // often as its own rule allowed: 208% of neutral, measured.
        const _ev9 = w9.every ?? 2;
        const _rec9 = w9.rec ?? (2 * _ev9);
        gonneFired(s, beacon, pid, p);   // §6av: both barrels are one report, and no louder
        p.lastSwing = (s.tick - 1) + (w9.spec === 'now' ? _rec9 : Math.max(1, _rec9 - _ev9));
        p.action = null;
      }
    } else if (inp.type === 'attackp') {
      const q = s.players[inp.targetId];
      if (q && q.hp > 0 && mayStrike(s, p, q)) {   // §11d
        // repeating an order you are already carrying out changes nothing:
        // the rhythm belongs to the fight, not to how often you ask for it
        p.action = (p.action?.type === 'attackp' && p.action.targetId === inp.targetId
                    && p.action.style === (inp.style ?? 'even'))
          ? p.action
          : { type: 'attackp', targetId: inp.targetId, since: s.tick, style: inp.style ?? 'even' };
        // the Brand (v0.41): striking one who was not striking you is worn
        // openly, and the state enforces it -- no keeper deals with you and no
        // stone carries you while it burns.
        //
        // §2b: BUT A MARKED CITIZEN IS ALREADY PROVOCATION.
        //
        // This branded you unless the target was ALREADY swinging at you by
        // name, so chasing a raider marked the posse exactly as it marked the
        // raider: the law punished justice and crime alike, and the only safe
        // response to being robbed was to let it go. That is the opposite of
        // what the mark is for.
        //
        // Strike somebody who is wearing it and you wear nothing. For fifteen
        // minutes a raider may be hunted, in the Wilds, by anybody, at no cost
        // -- which is the danger the mark never had, and it costs the world
        // nothing outside the one country where blood is already legal.
        // §2b-iv: one helper, called from here AND from `special`
        strikeConsequences(s, pid, p, s.players[inp.targetId], inp.targetId);
      }
    } else if (inp.type === 'plant') {
      const sl = p.inventory[inp.slot];
      const plotId = freePlotFor(s, _ctx, p);
      if (sl?.item === 'seeds' && plotId !== null && Object.keys(p.crops ?? {}).length < CROP_CAP) {
        sl.qty = (sl.qty ?? 1) - 1;
        if (sl.qty <= 0) p.inventory[inp.slot] = null;
        // §6o: the row is the CITIZEN'S. The ground is nobody's.
        if (!p.crops) p.crops = {};
        p.crops[plotId] = s.tick;
        p.skills.farming += 20;   // 6bl: the sowing is an act like any other
      }
    } else if (inp.type === 'harvest') {
      const n = s.nodes[inp.nodeId];
      const sown9 = p.crops?.[inp.nodeId] ?? 0;
      if (n?.type === 'plot' && sown9 > 0
        && (s.tick - sown9) >= GROW_TICKS_RIPE && adjacent(p, n)) {
        // §6ad: A MASTER GETS MORE FROM THE SAME ROW.
        //
        // Two sheaves from a plot at every level from one to ninety-nine, so
        // a lifetime at the plots bought a farmer nothing at all. Three at
        // ninety -- the same forty experience, the same growing time, the same
        // walk. What changes is what the row is worth, which is the only
        // reward that does not shorten the road for the people behind you.
        const yieldN = effLevel(p.skills.farming) >= FARM_MASTER ? GRAIN_MASTER : GRAIN_PER_PLOT;
        const ex = p.inventory.findIndex(s2 => s2?.item === 'grain');
        const slot = firstFreeSlot(p.inventory);
        if (ex !== -1) p.inventory[ex].qty += yieldN;
        else if (slot !== -1) p.inventory[slot] = { item: 'grain', qty: yieldN };
        else { continue; }
        // 6bl: and the seed comes back, if there is room for it. If there is
        // not, it is lost with the rest of what a full pack cannot hold -- the
        // grain is what the farmer came for.
        if (canAddItem(p.inventory, 'seeds')) addItem(p.inventory, 'seeds', SEED_FROM_HARVEST);
        delete p.crops[inp.nodeId];      // §6o: your row, cleared
        p.skills.farming += 40;
      }
    } else if (inp.type === 'consign') {
      // §11a: the named slots leave the pack and enter a container the bank
      // cannot reach. Then the route is drawn, once, and never redrawn.
      const from = haulTownIdAt(s, _ctx, p);
      if (from && !p.consignment) {
        const items = Array(INV_SLOTS).fill(null);
        let k = 0;
        for (const i2 of inp.slots.slice().sort((a, b) => a - b)) {
          if (p.inventory[i2]) { items[k++] = p.inventory[i2]; p.inventory[i2] = null; }
        }
        if (k > 0) {
          p.consignment = { from, route: haulDrawRoute(s, _ctx, pid, from), leg: 0, items };
          if (!p.consignment.route.length) {   // a world with one store: nothing to draw
            for (let i2 = 0; i2 < INV_SLOTS; i2++) {
              if (!items[i2]) continue;
              const f2 = firstFreeSlot(p.inventory);
              if (f2 !== -1) p.inventory[f2] = items[i2];
            }
            p.consignment = null;
          }
        }
      }
    } else if (inp.type === 'release') {
      // as many slots as will fit come home; what does not fit stays, and the
      // consignment stands. A citizen is never made to destroy their own cargo.
      if (p.consignment && haulTownIdAt(s, _ctx, p)) {
        const c = p.consignment;
        for (let i2 = 0; i2 < c.items.length; i2++) {
          if (!c.items[i2]) continue;
          const f2 = firstFreeSlot(p.inventory);
          if (f2 === -1) break;
          p.inventory[f2] = c.items[i2]; c.items[i2] = null;
        }
        haulSweep(p);
      }
    } else if (inp.type === 'deliver') {
      const c = p.consignment;
      const sl = c ? c.items[inp.slot] : null;
      const st0 = findAdjacentNode(s, _ctx, p, 'store');
      // 6bn: the keeper's bid, softened by what is already on the shelf
      const owed = sl ? storeBid(sl.item, st0?.shelf?.[sl.item] ?? 0) * (sl.qty ?? 1) : 0;
      if (c && haulAtEnd(c) && sl && owed && st0 && (st0.coin ?? PURSE_SEED) >= owed) {
        st0.coin = (st0.coin ?? PURSE_SEED) - owed;
        p.gold = (p.gold ?? 0) + owed;
        if (!st0.shelf) st0.shelf = {};
        st0.shelf[sl.item] = Math.min(SHELF_CAP, (st0.shelf[sl.item] ?? 0) + (sl.qty ?? 1));
        // §11e: WEIGHT OVER DISTANCE. Paid per slot as it lands, so a partial
        // delivery pays for exactly what arrived.
        const per = s.genesis.haul?.perTileSlot ?? 0;
        if (per) {
          const tiles = haulRouteTiles(s, c.from, c.route);
          // 6bs: distance, slots, and what the cargo makes you worth killing
          // for. See haulMultFor above for why the last of those is there.
          p.skills.hauling += Math.floor((tiles * per * haulMultFor(s.genesis, sl.item)) / 10000);
        }
        c.items[inp.slot] = null;
        haulSweep(p);
      }
    } else if (inp.type === 'sell') {
      const sl = p.inventory[inp.slot];
      const st0 = findAdjacentNode(s, _ctx, p, 'store');
      // 6bn: the keeper's bid, softened by what is already on the shelf
      const owed = sl ? storeBid(sl.item, st0?.shelf?.[sl.item] ?? 0) * (sl.qty ?? 1) : 0;
      // A KEEPER CANNOT PAY WHAT A KEEPER HAS NOT GOT. All or nothing: a
      // half-paid sale is a worse surprise than a refused one, and the citizen
      // still has the goods and the next town's road.
      if (sl && owed && st0 && (st0.coin ?? PURSE_SEED) >= owed) {
        st0.coin = (st0.coin ?? PURSE_SEED) - owed;
        p.gold = (p.gold ?? 0) + owed;
        // v0.74: onto THIS store's shelf, not into nothing. Beyond the cap the
        // keeper still pays but the goods are lost: a shelf is finite, and
        // consensus state is held by every node forever.
        if (!st0.shelf) st0.shelf = {};
        const have = st0.shelf[sl.item] ?? 0;
        st0.shelf[sl.item] = Math.min(SHELF_CAP, have + (sl.qty ?? 1));
        p.inventory[inp.slot] = null;
      }
    } else if (inp.type === 'invoke') {
      const slots = [];
      for (let i2 = 0; i2 < p.inventory.length && slots.length < 3; i2++) {
        if (p.inventory[i2]?.item === 'magic-stone') slots.push(i2);
      }
      if (slots.length === 3) {
        for (const i2 of slots) p.inventory[i2] = null;
        p.inventory[slots[0]] = { item: 'sigil', qty: 1 };
        p.skills.magic += XP_ALCH * 3;   // 6bo: three stones pressed, three lessons
        if (claimFirst(s, 'sigil', pid)) announce(s, (p.name ?? pid.slice(0, 6)) + ' is the FIRST to press three stones into a sigil.');
      }
    } else if (inp.type === 'still') {
      // consume three sigils; the truce binds all parties, its speaker first
      let burned = 0;
      for (let i2 = 0; i2 < p.inventory.length && burned < STILL_SIGILS; i2++)   // 6bp: the constant, not a fourth copy of 3
        if (p.inventory[i2]?.item === 'sigil') { p.inventory[i2] = null; burned++; }
      const t9 = s.mobs[inp.target] ?? s.players[inp.target];
      if (t9) {
        // WITH A WAND IT IS SENT, NOT STRUCK. It arrives three intervals from
        // now and holds ten; bare-handed it takes hold at once and holds six.
        if (p.equipment?.weapon?.item === 'wand') {
          t9.stillAt = s.tick + STILL_WAND_DELAY;
          t9.stillImmuneUntil = s.tick + STILL_WAND_DELAY + STILL_WAND_TICKS + 15;
        } else {
          t9.stilledUntil = s.tick + STILL_TICKS;
          t9.stillImmuneUntil = s.tick + STILL_TICKS + 15;
          if (t9.action !== undefined) t9.action = null; // a player mid-swing is stilled mid-swing
        }
      }
      p.stillCdUntil = s.tick + 150;
      p.action = null; // the speaker is bound first
      // 6bp: SIXTY, and it was wrong twice over.
      //
      // A stilling burns THREE SIGILS -- nine magic-stone out of the Wilds --
      // and the wand version, which sends it three intervals ahead instead of
      // striking at once, comes out of this same branch and pays the same
      // nine. There is no cheap stilling anywhere. It paid 150 as though it
      // cost nothing, and a constant named STILL_XP sat unused two thousand
      // lines away while the branch used a bare number.
      //
      // Three sigils spent, three lessons: the same twenty a mend pays for the
      // one it spends. The nine stones were already taught at the press.
      p.skills.magic += STILL_XP;
      if (claimFirst(s, 'still', pid)) announce(s, (p.name ?? pid.slice(0, 6)) + ' speaks the FIRST stilling. The fight simply stops.');
    } else if (inp.type === 'cast') {
      const si = p.inventory.findIndex(sl => sl?.item === 'sigil');
      if (inp.spell === 'mend' && si !== -1 && s.tick - (p.lastMend ?? -MEND_EVERY) >= MEND_EVERY) {
        p.lastMend = s.tick;
        p.inventory[si] = null;
        p.hp = Math.min(effLevel(p.skills.hitpoints), p.hp + 20); // v0.41: a strong heal (+20), not a full reset, keeps mend premium without making sigil-stackers unkillable
        // §6m-iv: AND IT SPENDS THE ARM, as a meal does.
        //
        // A cooked fish restores six and costs a swing. A mending restored
        // TWENTY and cost nothing at all -- the `p.action = null` above belongs
        // to the stilling, not to this. So the best heal in the world was also
        // the only free one, which is backwards.
        //
        // One rule covers both: whatever restores YOUR OWN hitpoints spends
        // your arm. Being mended by somebody else stays free to the wounded,
        // and that asymmetry is the whole reason to fight in a pair.
        p.lastSwing = Math.max(p.lastSwing ?? 0, s.tick);
        p.skills.magic += XP_SPEND_SIGIL;   // 6bo
      } else if (inp.spell === 'anchor' && si !== -1) {
        p.inventory[si] = null;
        // v0.80: anchor comes HOME. The old target (cx, 7) was the classic
        // generator's plaza, on Tallyholm, y=7 is open sea off the north
        // coast, and every cast stranded the caster on the waves. The fixed
        // point is the REGISTERED spawn: whatever world this is, anchor
        // returns you to where souls arrive.
        const sp9 = spawnOf(s.genesis);
        p.x = sp9.x; p.y = sp9.y;
        p.action = null;
        p.trade = null;
        p.skills.magic += XP_SPEND_SIGIL;   // 6bo: an anchor spends the same sigil a mend does
      }
    } else if (inp.type === 'survey') {
      const mi = (s.markers ?? []).findIndex(m => m.x === p.x && m.y === p.y);
      if (mi !== -1) {
        const m = s.markers[mi], anchor = spawnOf(s.genesis), sv = s.genesis.survey;
        const d = Math.max(Math.abs(m.x - anchor.x), Math.abs(m.y - anchor.y));
        p.skills.exploration += Math.min(sv.max, sv.base + sv.perTile * d); // paid in distance
        // §6ag: A MASTER COMES HOME WITH SOMETHING. From ninety, ANY rumour
        // yields the way to a waystone this citizen has not yet learned --
        // the nearest such, in id order so every node agrees -- where an
        // ordinary surveyor gets one only from the rare waystone rumour.
        // 6ci: THE CHART IS A GOOD NOW, NOT A KEY.
        //
        // 6ag gave a master surveyor the way to a waystone they had not yet
        // learned, and its own note says the point was that it be something
        // they can SELL -- reaching ninety is some two thousand markers, and a
        // reward you had already earned by walking there is no reward. The
        // stones are gone (6ch) and the argument survives them intact: from
        // ninety, any marker yields a CHART, one item, worth what a keeper will
        // pay for knowing where somewhere is.
        //
        // It opens no doors. Nobody travels by it. It is the export of a trade
        // whose whole product was previously experience, and the only thing in
        // this world a citizen makes by walking.
        if (effLevel(p.skills.exploration) >= EXPLORE_MASTER) {
          const free2 = p.inventory.findIndex((x) => x === null);
          if (free2 !== -1) p.inventory[free2] = { item: 'chart', qty: 1 };
        }
        const find = MARKER_FINDS[m.kind]; // the traces of those who came before
        if (find) {
          const free2 = p.inventory.findIndex(x => x === null);
          if (free2 !== -1) p.inventory[free2] = { item: find, qty: 1 }; // a full pack forfeits; the claim stands
        }
        if (claimFirst(s, 'surveyor', pid)) announce(s, (p.name ?? pid.slice(0, 6)) + ' is the FIRST to survey the frontier.');
        s.markers[mi] = surveyMarker(s, _ctx, mi, 'claim:' + pid); // the point relocates
      }
    } else if (inp.type === 'read_chart') {
      // 6ci: a chart is read by a buyer, not by its holder. Nothing to apply.

    } else if (inp.type === 'build_brewpot') {
      const bc = s.genesis.brew;
      const free = !nodeExistsAt(s, _ctx, p.x, p.y);
      const nearHearth = hasAdjacentNode(s, _ctx, p, 'hearth');
      const owned = brewpotsOwnedBy(s, _ctx, pid);
      if (bc && free && nearHearth && owned < bc.potCap && countLogs(p.inventory) >= bc.buildLogs && countItem(p.inventory, 'ore') >= bc.buildOre) {
        consumeLogs(p.inventory, bc.buildLogs); consumeItem(p.inventory, 'ore', bc.buildOre);
        addIndexedNode(s, _ctx, 'brewpot-' + pid + '-' + s.tick, { type: 'brewpot', x: p.x, y: p.y, by: pid, lastUsed: s.tick });
      }
    } else if (inp.type === 'brew') {
      const bp = s.nodes[inp.nodeId], sl = p.inventory[inp.slot];
      // §6ad: `isRawFood`, matching the validator. This read `raw-fish` by
      // name while the validator said yes to a deep fish too, so brewing with
      // one was ACCEPTED and then did nothing -- the citizen's whole input for
      // that tick spent on silence. The same validator/executor drift as the
      // cook gate and the eat list, and the third time from one predicate not
      // being carried to every site.
      if (bp && bp.type === 'brewpot' && bp.by === pid && bp.readyAt === undefined
          && atOrBeside(p, bp) && sl && (sl.item === 'grain' || isRawFood(sl.item))) {
        removeItem(p.inventory, inp.slot, 1);
        // §6an: a deep fish in the hands of a master brewer is a deep broth
        bp.brewKind = sl.item === 'grain' ? 'ale'
          : (sl.item === 'deep-fish' && effLevel(p.skills.brewing) >= DEEP_BROTH_BREW)
            ? 'deep-broth' : 'broth';
        bp.readyAt = s.tick + s.genesis.brew.ferment; bp.lastUsed = s.tick; // the world does the waiting (spec 8)
      }
    } else if (inp.type === 'collect') {
      const bp = s.nodes[inp.nodeId];
      if (bp && bp.type === 'brewpot' && bp.by === pid && atOrBeside(p, bp) && bp.readyAt !== undefined && s.tick >= bp.readyAt && canAddItem(p.inventory, bp.brewKind)) {
        // §6an: the deep broth is never doubled -- one fish, one draught
        const draughts = (bp.brewKind !== 'deep-broth'
          && effLevel(p.skills.brewing) >= BREW_MASTER)
          ? DRAUGHTS_MASTER : DRAUGHTS_PER_POT;
        addItem(p.inventory, bp.brewKind, draughts);
        p.skills.brewing += s.genesis.brew.xpPerBatch; // XP lands on the completed batch
        if (claimFirst(s, 'brewer', pid)) announce(s, (p.name ?? pid.slice(0, 6)) + ' is the FIRST to draw a finished brew.');
        delete bp.readyAt; delete bp.brewKind; bp.lastUsed = s.tick;
      }
    } else if (inp.type === 'dismantle') {
      const bp = s.nodes[inp.nodeId];
      if (bp && bp.type === 'brewpot' && bp.by === pid && atOrBeside(p, bp)) {
        const bc = s.genesis.brew; // half the build returned, if there is room; any brew within is lost
        for (let _r = 0; _r < Math.floor((bc?.buildLogs ?? 0) / 2); _r++) if (canAddItem(p.inventory, 'logs')) addItem(p.inventory, 'logs', 1);
        for (let _r = 0; _r < Math.floor((bc?.buildOre ?? 0) / 2); _r++) if (canAddItem(p.inventory, 'ore')) addItem(p.inventory, 'ore', 1);
        deleteIndexedNode(s, _ctx, inp.nodeId);
      }
    } else if (inp.type === 'kindle') {
      const wt = s.genesis.watch;
      if (wt && effLevel(p.skills.firemaking) >= wt.level && countLogs(p.inventory) >= wt.kindleLogs
          && !nodeExistsAt(s, _ctx, p.x, p.y) && countOwnedNodes(s, _ctx, 'watchfire', pid) < wt.maxOwned) {
        consumeLogs(p.inventory, wt.kindleLogs);
        p.skills.firemaking += wt.xpPerLog * wt.kindleLogs; // every log pays, here as at the hearth
        addIndexedNode(s, _ctx, 'wf' + s.tick + '-' + pid,
          { type: 'watchfire', x: p.x, y: p.y, by: pid, fuelUntil: s.tick + wt.perLog * wt.kindleLogs });
        if (claimFirst(s, 'watchfire', pid)) announce(s, (p.name ?? pid.slice(0, 6)) + ' is the FIRST to raise a watchfire.');
      }
    } else if (inp.type === 'stoke') {
      const wf = s.nodes[inp.nodeId], sl = p.inventory[inp.slot], wt = s.genesis.watch;
      // A LOG FED TO A FULL FIRE IS STILL FED.
      //
      // This refused the stoke outright once the fire was at its cap, which
      // spent the citizen's whole interval on silence -- the same fault as the
      // cook gate and the brew gate, a third time. The work was done and the
      // log was cut; the fire simply cannot hold more burn. So the log goes on
      // it and the firekeeper earns, and the fuel stays where it was.
      if (wf && wf.type === 'watchfire' && atOrBeside(p, wf) && sl && isLog(sl.item) && wt) {
        removeItem(p.inventory, inp.slot, 1);
        // fuel banks forward from whichever is later: now, or the fire's remaining burn
        // 6bc: AND IRONBARK BURNS LONGER. This is ironbark's whole job -- the
        // watchfire is the one public work in the world, and a wood whose only
        // virtue is that it feeds it is a wood people fetch FOR somebody else.
        // The experience is unchanged (a log pays a log); what changes is how
        // long the country can see the fire.
        wf.fuelUntil = Math.min(Math.max(wf.fuelUntil ?? 0, s.tick) + wt.perLog * (BURN_MULT[sl.item] ?? 1), s.tick + wt.cap);
        p.skills.firemaking += wt.xpPerLog; // the feeder earns, even at another's fire
      }
    } else if (inp.type === 'fletch') {
      const sl = p.inventory[inp.slot];
      if (inp.make === 'heartwood-bow' && effLevel(p.skills.fletching) >= HEARTWOOD_FLETCH
          && countItem(p.inventory, 'heartwood') >= 3
          && countItem(p.inventory, 'sigil') >= 1) {   // §6ah: a sigil in the binding
        consumeItem(p.inventory, 'heartwood', 3);
        consumeItem(p.inventory, 'sigil', 1);
        const sl2 = firstFreeSlot(p.inventory);
        if (sl2 !== -1) p.inventory[sl2] = { item: 'heartwood-bow', qty: 1 };
        p.skills.fletching += XP_FLETCH_PER_UNIT * 4;   // 6bk: 3 heartwood + a sigil
      } else if (sl && inp.make === 'bow' && isLog(sl.item)) {
        p.inventory[inp.slot] = { item: 'wooden-bow', qty: 1 };
        p.skills.fletching += XP_FLETCH_PER_UNIT;
      } else if (sl && inp.make === 'wand' && sl.item === 'logs') {
        p.inventory[inp.slot] = { item: 'wand', qty: 1 };
        p.skills.fletching += XP_FLETCH_PER_UNIT;
      } else if (sl && inp.make === 'staff' && sl.item === 'logs') {
        // A stave, shaped and bound. Ordinary logs only -- heartwood makes the
        // other one, and a fletcher who has heartwood should not waste it here.
        p.inventory[inp.slot] = { item: 'staff', qty: 1 };
        p.skills.fletching += XP_FLETCH_PER_UNIT;

      // §6ah: AND A SIGIL IN THE BINDING.
      //
      // Fletching's endgame -- the finest bow and the finest stave in the world
      // -- was made from two logs by somebody who never left the safe country.
      // Every other thing of that rank costs the Wilds: star gear eats stones,
      // and every spell eats sigils, which ARE stones. The heartwood line ate
      // nothing, so the peaceful trades and the dangerous ones never had to
      // meet.
      //
      // One sigil is three magic-stone, mined at seventy in the one place that
      // kills people. A fletcher who wants to sell staves must now buy from
      // somebody who goes in -- which is the whole point.
      } else if (sl && inp.make === 'heartwood-staff' && sl.item === 'heartwood'
                 && effLevel(p.skills.fletching) >= HEARTWOOD_FLETCH
                 && countItem(p.inventory, 'heartwood') >= 2
                 && countItem(p.inventory, 'sigil') >= 1) {
        consumeItem(p.inventory, 'sigil', 1);
        // §6ad: the master's stave, the same ninety the heartwood bow asks.
        // It is not faster than the plain one -- there is no third cadence --
        // it is simply worth a great deal more, which is what mastery buys.
        let took = 0;
        for (let i2 = 0; i2 < p.inventory.length && took < 2; i2++)
          if (p.inventory[i2]?.item === 'heartwood') { p.inventory[i2] = null; took++; }
        const sl2 = firstFreeSlot(p.inventory);
        if (sl2 !== -1) p.inventory[sl2] = { item: 'heartwood-staff', qty: 1 };
        p.skills.fletching += XP_FLETCH_PER_UNIT * 3;   // 6bk: 2 heartwood + a sigil
      } else if (sl && inp.make === 'arrows' && sl.item === 'bones') {
        // §6ad, EXTENDED TO THE SHAFT. Mastery in this world buys VALUE PER
        // ACTION, never speed: a woodcutter of ninety takes heartwood instead
        // of logs, a fisher of ninety takes the deep fish. A fletcher of
        // eighty gets more out of the same bone.
        //
        // Not more experience -- the same five, so the road to ninety-nine is
        // the same length it was. What changes is what an hour is WORTH, which
        // is the only kind of reward that does not make the grind shorter and
        // therefore does not make it cheaper.
        //
        // And unlike heartwood it is not a replacement, because there is no
        // second kind of arrow to replace it with. Eight from a bone rather
        // than five is the same good, made better use of, which leaves the
        // arrow market where it was and simply means a master wastes less.
        const per = effLevel(p.skills.fletching) >= ARROW_MASTER ? ARROWS_MASTER : ARROWS_PER_BONE;
        const ex = p.inventory.findIndex((s2, i2) => s2?.item === 'arrows' && i2 !== inp.slot);
        p.inventory[inp.slot] = null;
        if (ex !== -1) p.inventory[ex].qty += per;                  // the quiver (6n)
        else p.inventory[inp.slot] = { item: 'arrows', qty: per };
        p.skills.fletching += XP_FLETCH_PER_UNIT;   // 6bk: one bone in, one lesson
      } else if (sl && ROD_OF[inp.make] && isLog(sl.item) && sl.item === ROD_OF[inp.make]
                 && effLevel(p.skills.fletching) >= ROD_FLETCH_REQ[inp.make]
                 && countItem(p.inventory, sl.item) >= 2) {
        // 6bk: THE RODS COME TO THE BENCH.
        //
        // They were forged at an ANVIL, which is carpentry done by a smith: a
        // rod is a shaft and a line and has no metal in it anywhere. It also
        // left fletching -- the wood trade -- with four things to make while
        // the metal trade had thirty, and made the one tool a fisher needs
        // wait on a skill they have no other reason to train.
        consumeItem(p.inventory, sl.item, 2);
        const rs = firstFreeSlot(p.inventory);
        if (rs !== -1) p.inventory[rs] = { item: inp.make, qty: 1 };
        p.skills.fletching += XP_FLETCH_PER_UNIT * 2;
      }
    } else if (inp.type === 'unwield') {
      const g = EQUIP_SLOTS.includes(inp.gear) ? inp.gear : 'weapon';   // 6bz
      const slot = firstFreeSlot(p.inventory);
      if (p.equipment[g] && slot !== -1) {
        p.inventory[slot] = p.equipment[g];
        p.equipment[g] = null;
      }
    } else if (inp.type === 'light') {
      const sl = p.inventory[inp.slot];
      const clear = !nodeExistsAt(s, _ctx, p.x, p.y);
      if (sl && isLog(sl.item) && clear) {
        const lvl = effLevel(p.skills.firemaking);
        // 6bg: per wood, for the reason at the pan -- ironbark and heartwood
        // are not logs any more, and one tally would let a firekeeper spend
        // the failures on the cheap stuff.
        if (!p.lightsTried || typeof p.lightsTried !== 'object') p.lightsTried = {};
        p.lightsTried[sl.item] = (p.lightsTried[sl.item] ?? 0) + 1;
        if (countedSuccess(p.lightsTried[sl.item], Math.min(COOK_BASE + lvl, COOK_CAP))) {  // 6bg: the pan's curve, for the same reason
          p.inventory[inp.slot] = null;
          p.skills.firemaking += XP_FIREMAKING;
          addIndexedNode(s, _ctx, 'f' + s.tick + '-' + pid,
            { type: 'fire', x: p.x, y: p.y, depletedUntil: 0, expiresAt: s.tick + FIRE_TICKS });
          // step aside (§6f): west, east, south, north: first free tile
          for (const [mx, my] of [[-1, 0], [1, 0], [0, 1], [0, -1]]) {
            const nx = p.x + mx, ny = p.y + my;
            if (nx < 1 || nx >= s.genesis.worldW - 1 || ny < 1 || ny >= s.genesis.worldH - 1) continue;
            // v0.80: the step aside now obeys the same law as a step. It
            // carried a MOB rule ("no mob enters Anchor"), spliced in at
            // the wrong indentation, which skipped every tile inside a
            // town: citizens lighting fires in Anchor never stepped back
            // and stood in their own flame. It also obeyed neither the
            // water nor the beast that holds its tile, so a fire on the
            // bank could shove its maker into the river.
            if (terrainBlocked(s.genesis, nx, ny)) continue;
            if (Object.values(s.mobs).some(m2 => m2.hp > 0 && m2.x === nx && m2.y === ny)) continue;
            if (nodeExistsAt(s, _ctx, nx, ny)) continue;
            p.x = nx; p.y = ny;
            break;
          }
        }
      }
    } else if (inp.type === 'bury') {
      const sl = p.inventory[inp.slot];
      // BOTH KINDS. The line below tested `=== 'bones'` and the line after it
      // asked whether the item was dragon-bones -- which could never be true.
      // Written in the same minute, contradicting each other.
      if (sl && (sl.item === 'bones' || sl.item === 'dragon-bones')) {
        p.inventory[inp.slot] = null;
        const holy = sl.item === 'dragon-bones' ? XP_BURY_DRAGON : XP_BURY;
        p.skills.prayer += hasAdjacentNode(s, _ctx, p, 'ossuary')
          ? Math.round(holy * XP_BURY_CONSECRATED / XP_BURY) : holy;
      }
    } else if (inp.type === 'deposit') {
      const sl = p.inventory[inp.slot];
      const nearBank = hasAdjacentNode(s, _ctx, p, 'bank');
      // §6ax: A VAULT WILL NOT TAKE A HOOD.
      //
      // Not to stop hoarding -- it cannot; a sleeping citizen in a town is a
      // twenty-eight slot vault that costs nothing. It is to force the CHOICE.
      // A hood that can be banked is a hood nobody ever risks, and one that is
      // never worn is one nobody ever sees, which is the entire point of it.
      // Owning one has to be a decision renewed every time you leave a town.
      // This is the dragonbow's rule, and its reason inverted: the bow is
      // refused so its bearer cannot opt out of being hunted; the hood is
      // refused so its bearer cannot opt out of being seen.
      if (sl && nearBank && !isHood(sl.item)) {
        // 7.3: one item per interval (spec) means ONE unit leaves the slot;
        // the old path banked 1 and vaporized the rest of the stack
        p.bank[sl.item] = (p.bank[sl.item] ?? 0) + 1;
        if ((sl.qty ?? 1) > 1) sl.qty -= 1;
        else p.inventory[inp.slot] = null;
      }
    } else if (inp.type === 'withdraw') {
      const slot = firstFreeSlot(p.inventory);
      const nearBank = hasAdjacentNode(s, _ctx, p, 'bank');
      if (p.bank[inp.item] > 0 && slot !== -1 && nearBank) {
        p.bank[inp.item]--;
        if (p.bank[inp.item] === 0) delete p.bank[inp.item];
        p.inventory[slot] = { item: inp.item, qty: 1 };
      }
    } else if (inp.type === 'drop') {
      const it = p.inventory[inp.slot];
      if (it) {
        p.inventory[inp.slot] = null;
        const gid = 'g' + s.tick + '-' + pid + '-' + inp.slot;
        // 7.2: the whole slot falls, quantity intact, 17 arrows dropped
        // are 17 arrows on the ground, matching death drops and pickup
        s.ground[gid] = { item: it.item, qty: it.qty ?? 1, x: p.x, y: p.y, expiresAt: s.tick + 100 };
      }
    } else if (inp.type === 'pickup') {
      const g2 = s.ground[inp.groundId];
      const onTile = g2 && g2.x === p.x && g2.y === p.y;
      const ex = onTile && g2.item === 'arrows' ? p.inventory.findIndex(s2 => s2?.item === 'arrows') : -1;
      const slot = firstFreeSlot(p.inventory);
      if (onTile && g2.item === 'forage') {
        // eaten where it lies. No slot, no gullet cooldown -- its worth is the
        // moment it is taken, and it is gone either way.
        p.hp = Math.min(effLevel(p.skills.hitpoints), p.hp + FORAGE_HEAL);
        delete s.ground[inp.groundId];
      } else if (onTile && ex !== -1) {                // the quiver (6n): arrows pool
        p.inventory[ex].qty += g2.qty ?? 1;
        delete s.ground[inp.groundId];
      } else if (onTile && slot !== -1) {
        p.inventory[slot] = { item: g2.item, qty: g2.qty ?? 1 }; // the whole stack, not one of it
        delete s.ground[inp.groundId];
        // §6w: AND THE WORLD IS TOLD, every time, not only the first.
        //
        // The one announcement about the bow fired when the DRAGON fell, which
        // named the killer while the bow was still lying in the grass. Anyone
        // else who walked over and took it, and anyone who took it off a body
        // in the Wilds, changed the world's most important object in silence.
        if (g2.item === 'dragonbow')
          announce(s, (p.name ?? pid.slice(0, 6)) + ' has taken up the DRAGONBOW. There is only one.');
      }
    } else if (inp.type === 'eat') {
      const slot = p.inventory[inp.slot];
      const heal = !slot ? 0 : healOf(slot.item);
      if (heal > 0 && s.tick - (p.lastAte ?? -1024) >= eatRhythm(slot.item)) {   // §6m-iii, §6m-v
        p.lastAte = s.tick;
        removeItem(p.inventory, inp.slot, 1); // stackable brews draw from the stack; a fish clears its slot
        p.hp = Math.min(p.hp + heal, effLevel(p.skills.hitpoints));
        // §6m-ii: AND IT COSTS A SWING.
        //
        // v0.32 said eating does not lower your guard, and the fight still
        // holds -- the ACTION is untouched, so nobody has to give an order
        // again. But swallowing something cost nothing at all: full healing
        // and a blow in the same interval, so a fight was decided by who
        // brought more food and never by when they ate it.
        //
        // The arm is spent, exactly as a special spends it, so the next blow
        // comes a cycle later. One swing in eight -- the gullet allows no more
        // than that -- so it is a tempo cost and not a survivability one.
        //
        // The RATE stays, and its reason has changed. It was written when
        // nothing in this world could kill anybody; now it is the only thing
        // stopping food from out-healing damage. Without it a citizen eating
        // every other interval restores three a tick against the two a sword
        // at ninety-nine lands, and fights become a question of who empties
        // their pack first.
        //
        // A MENDING FROM SOMEBODY ELSE COSTS THE WOUNDED NOTHING, and that is
        // deliberate: twenty hitpoints and they never break rhythm. Fighting
        // in a pair should be worth something that fighting alone is not.
        p.lastSwing = Math.max(p.lastSwing ?? -EAT_EVERY, s.tick);
      }
    } else if (inp.type === 'cook') {
      // re-check against new state; instant, same-tick resolution (§6a)
      const slot = p.inventory[inp.slot];
      const nearFire = hasAdjacentNode(s, _ctx, p, _FIRE_TYPES) || fireOnTile(s, _ctx, p.x, p.y); // v0.80: the tile underfoot counts, exactly as the validator says
      if (slot && isRawFood(slot.item) && nearFire) {
        // §6ad: a deep fish asks for a cook to match the fisher who caught it.
        // Below eighty it burns every time -- not a gamble, a refusal.
        const deep = slot.item === 'deep-fish';
        const mid = slot.item === 'eel';   // §6am (v6): the middle catch
        const lvl = effLevel(p.skills.cooking);
        // 6bg: A COUNTER FOR EACH THING, because ONE counter is a menu.
        //
        // countedSuccess is Bresenham and therefore PERFECTLY PREDICTABLE --
        // which is the point (the pan counts; it does not gamble) and was
        // harmless while every fish was a fish. It is not harmless now: with
        // one shared tally a cook reads which attempt is the doomed one, feeds
        // it a two-gold raw fish, and puts the deep fish only on the tallies
        // that cannot fail. Nothing valuable ever burns again.
        //
        // Per item, the tally cannot be advanced with something cheaper: each
        // kind burns its own even share and the determinism stays a promise
        // rather than a schedule. Same fault, same fix, at the hearth below.
        if (!p.cooksTried || typeof p.cooksTried !== 'object') p.cooksTried = {};
        p.cooksTried[slot.item] = (p.cooksTried[slot.item] ?? 0) + 1;
        const able = !deep || lvl >= COOK_DEEP_REQ;
        // 6bf: a proper hearth forgives a cook what a field fire does not
        const atHearth = hasAdjacentNode(s, _ctx, p, 'hearth');
        const cooked = deep ? 'cooked-deep-fish' : mid ? 'cooked-eel' : 'cooked-fish';
        const burnt  = deep ? 'burnt-deep-fish'  : mid ? 'burnt-eel'  : 'burnt-fish';
        if (able && countedSuccess(p.cooksTried[slot.item], Math.min(COOK_BASE + lvl + (atHearth ? COOK_HEARTH_BONUS : 0), COOK_CAP))) {
          p.inventory[inp.slot] = { item: cooked, qty: 1 };
          p.skills.cooking += deep ? XP_COOK_DEEP : XP_COOK;
        } else {
          p.inventory[inp.slot] = { item: burnt, qty: 1 };
        }
      }
    } else if (inp.type === 'drink') {
      p.hp = effLevel(p.skills.hitpoints);
    } else if (inp.type === 'set_look') {
      p.look = inp.look;
    } else if (inp.type === 'claim_name') {
      // re-check against the NEW state: two claims for the same name in
      // one tick resolve by canonical playerId order (first applier wins)
      if (!(inp.name in s.names)) {
        s.names[inp.name] = pid;
        p.name = inp.name;
      }
    }
  }

  _p2mark('actions');
  // resolve ongoing actions (spec §6, §6b), canonical order.
  //
  // The order is the sorted playerId, and a target already at zero is skipped
  // below -- so where two citizens would fall on the SAME interval, the lower
  // identity wins. Measured over six hundred mirror duels the effect is 51.8%
  // (z = 0.90), because simultaneous kills essentially never happen: none
  // occurred in a hundred and twenty. It is recorded here so it is not
  // rediscovered as a defect. Any fix costs a deterministic ordering, which is
  // worth more than two points of a coin flip.
  for (const pid of Object.keys(s.players).sort()) {
    const p = s.players[pid];
    if (!p.action) continue;

    if (p.action.type === 'attackp') {
      const q = s.players[p.action.targetId];
      if (q && ((q.stilledUntil ?? 0) > s.tick || (p.stilledUntil ?? 0) > s.tick)) { p.action = null; continue; } // the truce ends the fight (v0.80)
      const both = q && q.hp > 0 && mayStrike(s, p, q);   // §11d
      // §6b: PVP USES THE SAME GEOMETRY AS EVERYTHING ELSE.
      //
      // This was hardcoded to `wooden-bow` and a literal reach of 4, so every
      // other ranged weapon and every reach-2 spear was accepted by the
      // validator and then CANCELLED in the same tick -- silently, with no
      // arrow spent and no error, indistinguishable from lag. The dragonbow's
      // entire stated design did nothing against a citizen, which is the one
      // place §6w says it matters most.
      //
      // The mob path eighty lines below already had the right form. This is
      // that, against a citizen: a weapon reaches as far as it reaches.
      const bowHeld = isRanged(p)
        && Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y)) <= reachOf(p)
        && p.inventory.some((sl) => sl?.item === ammoOf(p));
      const near = both && (inReach(p, q) || bowHeld);
      if (!near) { p.action = null; }
      else if (s.tick - (p.lastSwing ?? -64) < cadenceOf(p, weaponOf(p)?.every ?? 2)) { // §6aq
        /* combat breathes (6m, 2b-iii): the arm has not recovered, and turning
           to a different foe does not give it back. The chain never rests (6r). */ }
      else {
        p.lastSwing = s.tick; // the arm is spent, whoever it was spent on
        const bowDrawn2 = drawnAt(p, q);
        let lvl2, tag2;
        if (bowDrawn2) {
          const aSlot = p.inventory.findIndex(sl => sl?.item === ammoOf(p));
          gonneFired(s, beacon, pid, p);   // §6av: loud, and it may burst
          if (aSlot === -1) { p.action = null; continue; }
          // alternate per DRAW, not per tick. `s.tick % 2` was in lockstep with the
        // bow's own `every: 2` cadence -- it only ever loosed on ticks of one
        // parity, so the test either always spared the arrow or never did. It
        // spent NOTHING over a hundred ticks of shooting. The swing ordinal is
        // what alternates.
        if (!(weaponOf(p)?.thrift === true
              && Math.floor(s.tick / cadenceOf(p, weaponOf(p)?.every ?? 2)) % 2 === 1)) {   // §6y, §6aq
            p.inventory[aSlot].qty -= 1;
            if (p.inventory[aSlot].qty <= 0) p.inventory[aSlot] = null;
          }
          lvl2 = effLevel(p.skills.ranged); tag2 = 'ranged';
        } else { lvl2 = effLevel(p.skills.attack); tag2 = 'attack'; }
        const defL = effLevel(q.skills.defence);
        const Tp = hitChance256(lvl2, defL, weaponOf(p)?.acc ?? 0,
          weaponOf(p)?.pierces === true ? 0 : armourOf(q)); // §6x-ii
        if (roll(beacon, pid, 'atk') < Tp) {
          // §6as: the BLOW is strength's, the roll is attack's -- except for a
          // bow, where the same draw does both and lvl2 is ranged.
          const powLvl = bowDrawn2 ? lvl2 : effLevel(p.skills.strength);
          const maxHit = 1 + Math.floor(powLvl / (bowDrawn2 ? 12 : 10))
            + (weaponOf(p)?.hit ?? 0);
          // §6x: A FLAIL GOES ROUND THE PLATE, not through it.
          //
          // A full suit of starmetal soaks four, and against `max(0, ...)`
          // that can floor a blow at nothing at all -- which left one answer
          // to a star-clad citizen in the Wilds: land more blows than the
          // armour can absorb. The flail is the other answer, and the only
          // weapon in the world that ignores this subtraction.
          //
          // It pays for it everywhere else: its base damage is the lowest of
          // any steel, so against an unarmoured citizen it is simply worse.
          // An answer to one thing, not an upgrade to everything.
          // §6ap: armour is in the roll, not the damage
          const soak = 0;
          const dmg = Math.max(0, styleRoll(roll(beacon, pid, 'dmg'), maxHit, p.action.style) - soak);
          q.hp -= afterShield(q, dmg);   // 6bz
          // §6as: a landed blow teaches BOTH -- the aim that found them and the
          // arm that hurt them -- split evenly, so a fighter's two numbers rise
          // together unless they deliberately train one alone.
          if (bowDrawn2) p.skills[tag2] += dmg;   // 6br
          else teachMelee(p, dmg, p.action.style, s.tick);   // §6as-iii
          p.skills.hitpoints += dmg;
          if (q.hp > 0 && p.equipment.weapon?.item === 'star-dagger'
              && (p.rootCdUntil ?? 0) <= s.tick && (q.rootedUntil ?? 0) <= s.tick && (q.rootImmuneUntil ?? 0) <= s.tick) {
            q.rootedUntil = s.tick + ROOT_TICKS;                 // held fast
            q.rootImmuneUntil = s.tick + ROOT_TICKS + ROOT_IMMUNE; // then briefly unfreezable
            p.rootCdUntil = s.tick + ROOT_CD;                    // the dagger sleeps a long while
          }
          if (q.hp > 0 && q.action?.type !== 'attackp' && q.action?.type !== 'attack') {
            q.action = { type: 'attackp', targetId: pid, since: s.tick + 1, style: 'even' }; // struck: strikes back
          }
          if (q.hp <= 0) {
            q.hp = 0; // a killing blow that overshoots still leaves a body at nought (v0.53)
            // slain in the Wilds (spec 2g): the pack spills where they fall,
            // and the body lies beside it awhile (v0.41)
            // what a mourner carries through, decided BEFORE the pack spills
            const keptQ = prayerKeeps(q, s.tick);
            const held = keptQ.map((k) => ({ ...k, taken: false }));
            const qid9 = p.action.targetId;   // the victim, named
            let sl9 = -1;
            for (const sl of q.inventory) { sl9++; if (!sl) continue; {
              const m9 = held.find((k) => !k.taken && k.item === sl.item && k.qty === (sl.qty ?? 1));
              if (m9) { m9.taken = true; continue; }
              // §2b-v: CONTENT-ADDRESSED, like every other ground key here.
              //
              // This was `g{tick}-{ground.length}` -- the only positional key
              // in the engine, where `drop` uses g{tick}-{pid}-{slot} and mob
              // drops use g{tick}-{mobId}-{i}-{item}. If the ground SHRANK
              // between two spills in one interval, the second reused the
              // first's key and destroyed it. Reproducible: a special kills
              // one citizen, somebody picks up an unrelated pile, an attackp
              // kills a second in the action phase, and the first citizen's
              // pack is simply gone.
              //
              // Griefable, not merely wrong: inputs apply in sorted playerId
              // order, so a patient griefer can grind a key that sorts after a
              // killer's and delete other people's kills on purpose.
              s.ground['g' + s.tick + '-' + qid9 + '-' + sl9] =
                { item: sl.item, qty: sl.qty ?? 1, x: q.x, y: q.y, expiresAt: s.tick + 100 };
            } }
            // §11d: AND THE CONSIGNMENT SPILLS WITH IT, wherever they fell --
            // not only in the Wilds. Without this, killing a hauler destroys
            // the cargo and there is nothing to steal, only somebody to ruin.
            // A mourner's prayer does not reach it: what is consigned was
            // committed to the road.
            if (q.consignment) {
              let sc = -1;
              for (const cs of q.consignment.items) { sc++; if (!cs) continue;
                s.ground['g' + s.tick + '-' + qid9 + '-c' + sc] =
                  { item: cs.item, qty: cs.qty ?? 1, x: q.x, y: q.y, expiresAt: s.tick + 100 };
              }
              q.consignment = null;
            }
            spillHoods(s, q, qid9);   // §6ax: worn or packed, a hood never burns
            q.inventory = q.inventory.map(() => null);
            q.equipment = { weapon: null, head: null, body: null };
            keptQ.forEach((k, i) => { q.inventory[i] = k; });
            q.action = null; q.trade = null;
            q.deadUntil = s.tick + DEATH_TICKS;
          }
        }
      }
      continue;
    }
    if (p.action.type === 'attack') {
      const m = s.mobs[p.action.mobId];
      const stats0 = m && MOB_STATS[m.type];
      const stats = (stats0 && m.def !== undefined) ? { ...stats0, def: m.def } : stats0;   // §6ao (v6): incursion carries a scaled def
      if (!m || m.hp <= 0) { p.action = null; continue; }
      if ((m.stilledUntil ?? 0) > s.tick || (p.stilledUntil ?? 0) > s.tick) { p.action = null; continue; } // the truce ends the fight, it does not pause it (v0.80)
      const bowHeld = isRanged(p)
        && Math.max(Math.abs(p.x - m.x), Math.abs(p.y - m.y)) <= reachOf(p);
      if (!inReach(p, m) && !bowHeld) { p.action = null; continue; }
      // THE BEAST KEEPS ITS OWN TIME (spec 6b.4).
      //
      // Two faults lived in these four lines.
      //
      // The `continue` skipped the WHOLE block when the citizen's arm was not
      // ready -- including the retaliation at the bottom. So the beast only
      // swung on ticks the citizen also swung, and a slow weapon made you
      // HARDER TO HIT: pick up a maul (every 3) and a troll attacked a third
      // less often than it would have if you were barehanded. Defence by
      // choosing a heavy weapon, which is not a rule anybody wrote.
      //
      // And `% 2` was hardcoded, so `every: 1` on the dragon did nothing at
      // all. It struck on alternate ticks like a goblin, which is most of why
      // the fight was survivable by one.
      //
      // The citizen's arm and the beast's are now separate clocks. The beast
      // swings on its own cadence whether or not you are ready to swing back.
      const every = cadenceOf(p, weaponOf(p)?.every ?? 2); // §6aq: steel is heavy
      const armReady = s.tick - (p.lastSwing ?? -64) >= every;
      if (armReady) p.lastSwing = s.tick; // the arm is spent, whoever it was spent on

      const bowDrawn = drawnAt(p, m);
      // §6ac: SHE TAKES YOUR SHAPE. The first blow binds her, and she copies
      // the citizen as they stand at that moment -- levels, weapon, and the
      // arrows in their pack. The quiver matters more than it looks: without
      // it a mirrored archer fights a siren who never runs out, and loses to
      // arithmetic rather than to the fight.
      if (stats?.mirrors && m.bound === undefined) {
        m.bound = pid;
        m.quiver = p.inventory.reduce((a, sl) => a + (sl?.item === 'arrows' ? sl.qty : 0), 0);
      }
      // §6aa: whoever swings at a beast is remembered by it. This is how a
      // shore-crab -- which hunts nobody -- still answers a blow, and how a
      // goblin that has taken an arrow starts walking toward the archer.
      m.mad = pid;
      // the citizen only strikes when their own arm has recovered. This was
      // a `continue` above, which also skipped the beast's turn -- see the
      // note there.
      if (armReady) {
      if (bowDrawn) { // ranged (spec 6j): every draw costs an arrow, hit or miss
        // §6y: THE SIGIL-BOW SPENDS HALF THE ARROWS.
        //
        // A quiver must still be in the pack -- you cannot shoot from an
        // empty one -- but on alternate draws nothing leaves it. The tick
        // decides which, not the citizen, so it cannot be timed: the Reading
        // Rule reaches arrows too.
        const aSlot = p.inventory.findIndex(sl => sl?.item === ammoOf(p));
        gonneFired(s, beacon, pid, p);   // §6av
        if (aSlot === -1) { p.action = null; continue; }
        // alternate per DRAW, not per tick. `s.tick % 2` was in lockstep with the
        // bow's own `every: 2` cadence -- it only ever loosed on ticks of one
        // parity, so the test either always spared the arrow or never did. It
        // spent NOTHING over a hundred ticks of shooting. The swing ordinal is
        // what alternates.
        if (!(weaponOf(p)?.thrift === true
              && Math.floor(s.tick / cadenceOf(p, weaponOf(p)?.every ?? 2)) % 2 === 1)) {
          p.inventory[aSlot].qty -= 1;
          if (p.inventory[aSlot].qty <= 0) p.inventory[aSlot] = null;
        }
        const rLvl = effLevel(p.skills.ranged);
        const Tr = hitChance256(rLvl, stats.def, weaponOf(p)?.acc ?? 0, 0); // §6ap-ii
        if (roll(beacon, pid, 'atk') < Tr) {
          const maxHit = 1 + Math.floor(rLvl / 12) + (weaponOf(p)?.hit ?? 0);
          const dmg = 1 + (roll(beacon, pid, 'dmg') % maxHit);
          m.hp -= dmg;
          p.skills.ranged += dmg;   // 6br
          p.skills.hitpoints += dmg;
        }
      } else {
      // §6ap-ii: AND THE BEASTS ARE ROLLED FOR THE SAME WAY.
      //
      // Only the mob-strikes-citizen half was moved to the ratio. This half was
      // left on `clamp(128 + 4*(atk - def) + acc)`, so the twenty-eight level
      // plateau still existed against everything with teeth, and a weapon's acc
      // was read on the additive scale here and the multiplicative one in the
      // Wilds. The same steel cannot mean two things.
      const atkLvl = effLevel(p.skills.attack);
      const T = hitChance256(atkLvl, stats.def, weaponOf(p)?.acc ?? 0, 0);
      if (roll(beacon, pid, 'atk') < T) {
        // §6as-ii: and the blow is STRENGTH's here too, or the only place to
        // raise a max hit would be on other citizens.
        // 6bu: A FLOOR OF THREE, which touches the bottom and nothing else.
        //
        // A newcomer holds 22 gold. The arms stall sells the iron-dagger at 16,
        // the spear at 28, the sword at 30 -- so the ONLY weapon they can buy
        // has hit 0, and `1 + floor(1/10) + 0` is one. `dmg = 1 + (roll % 1)`
        // is then ALWAYS EXACTLY ONE: never a two, never a lucky blow, for the
        // first several hours. Attack was 27 minutes to level five where every
        // other trade in this world takes three, and a beginner who never sees
        // a different number is not playing a combat system, they are watching
        // a subtraction.
        //
        // A FLOOR rather than a larger base, deliberately. `3 + floor(str/10)`
        // would have added two to every max hit in the world, including a
        // master's star-maul at ninety-nine -- eleven per cent more damage in
        // every duel, and a retune of a system that is correct at the top. The
        // floor binds only while `floor(str/10) + weapon.hit < 2`: a dagger or
        // bare hands under strength twenty, which is a newcomer and nobody
        // else. Buy a sword and it has never applied to you.
        const maxHit = Math.max(MIN_MAX_HIT,
          1 + Math.floor(effLevel(p.skills.strength) / 10) + (weaponOf(p)?.hit ?? 0));
        const dmg = 1 + (roll(beacon, pid, 'dmg') % maxHit);
        m.hp -= dmg;
        // §6as-ii: split as a citizen's blow is split. Beasts taught ATTACK
        // alone, so strength -- which every melee blow now scores from -- could
        // not be raised except by fighting people, which asks a citizen to be
        // dangerous before they are allowed to become dangerous. Measured: three
        // hundred intervals on a wolf gave attack +2924 and strength +0, and the
        // resulting citizen dealt 0.73 a tick where a trained one deals 1.79.
        teachMelee(p, dmg, p.action.style, s.tick);   // §6as-iii
        p.skills.hitpoints += dmg;
        if (m.hp > 0 && p.equipment.weapon?.item === 'star-dagger'
            && (p.rootCdUntil ?? 0) <= s.tick && (m.rootedUntil ?? 0) <= s.tick && (m.rootImmuneUntil ?? 0) <= s.tick) {
          m.rootedUntil = s.tick + ROOT_TICKS;
          m.rootImmuneUntil = s.tick + ROOT_TICKS + ROOT_IMMUNE;
          p.rootCdUntil = s.tick + ROOT_CD;
        }
      }
      }
      }   // armReady

      if (m.hp <= 0) {
        if (m.type === 'skeleton-knight' && claimFirst(s, 'knightslayer', pid))
          announce(s, (p.name ?? pid.slice(0, 6)) + ' is the FIRST to fell a skeleton-knight.');
        // §6ac: THE STRAND KEEPS SCORE QUIETLY.
        //
        // She gives nothing. A creature that does not want to fight, farmed
        // for parts, would be the one outcome that undoes her -- so the only
        // reward is that it happened, and the world marks it the way it marks
        // any first: once, ever, for whoever managed it before anybody else.
        //
        // After that it is private. `slain` is a tally the citizen already
        // carries, so each keeps their own count and nothing is broadcast.
        // At a twenty-minute respawn an announcement per kill would be a
        // hundred and twenty a day, and noise devalues exactly the thing the
        // announcement was for.
        if (m.type === 'siren') {
          if (claimFirst(s, 'strandwalker', pid))
            announce(s, (p.name ?? pid.slice(0, 6)) + ' is the FIRST to walk away from the strand.');
          if (!p.slain) p.slain = {};
          p.slain.siren = (p.slain.siren ?? 0) + 1;
          delete m.bound; delete m.quiver;
        }
        // drops lie where they fall (spec §6e): loot belongs to whoever takes it
        // The Reading Rule (v0.39) reaches loot too (v0.64). A drop judged by
        // the tick's beacon could be TIMED: fight the beast to its last point
        // of life, read the public beacon, and withhold the killing blow until
        // a kind tick comes round. That turns a one-in-thirty-two drop into a
        // certainty for anyone willing to wait twenty seconds, which is not a
        // rare drop at all. Loot is therefore COUNTED, exactly as cooking and
        // firemaking are: the tally is per citizen and per drop, so the rate is
        // the promised rate and no timing can bend it.
        if (!p.slain) p.slain = {};
        for (let di = 0; di < stats.drops.length; di++) {
          const d = stats.drops[di];
          if (d.chance !== undefined) {
            const tally = m.type + ':' + di;
            p.slain[tally] = (p.slain[tally] ?? 0) + 1;
            if (!countedSuccess(p.slain[tally], d.chance, DROP_DEN)) continue;
          }
          const gid = 'g' + s.tick + '-' + p.action.mobId + '-' + di + '-' + d.item; // di keeps twin drops distinct
          // forage rots in half the time: it is a decision inside the fight,
          // not a pile to sweep up afterwards
          s.ground[gid] = { item: d.item, x: m.x, y: m.y,
            expiresAt: s.tick + (d.item === 'forage' ? FORAGE_ROTS : 100) };
        }
        // §6w: THE BOW GOES WITH WHOEVER TAKES THE DRAGON, IF THE DRAGON
        // STILL HAS IT.
        //
        // There is one dragonbow and there will only ever be one. It is not a
        // drop that accumulates: it is a THING THE DRAGON HAS, and it changes
        // hands rather than multiplying. Kill the dragon while it holds the
        // bow and the bow is yours. Kill it afterwards and you get scales and
        // bones, because somebody already has it.
        //
        // `bowOut` is the world remembering that the bow is loose. Nothing
        // else needs to track WHO holds it: the item is in somebody's pack
        // and packs are already the world's record of who has what.
        if (m.type === 'dragon' && !s.bowOut) {
          const bid = 'g' + s.tick + '-dragonbow';
          s.ground[bid] = { item: 'dragonbow', x: m.x, y: m.y, expiresAt: s.tick + 100 };
          s.bowOut = true;
          announce(s, (p.name ?? pid.slice(0, 6)) + ' has felled the DRAGON. Its bow lies loose.');
        }
        m.respawnAt = s.tick + stats.respawn;
        p.action = null;
      } else {
        // §6aa: THE BEAST SWINGS IN ITS OWN PHASE NOW, not inside this one.
        //
        // Retaliation used to happen here, inside the attacking citizen's
        // action, against the single mob they had targeted. That is why
        // nothing in this world could ever gang up: a beast had no way to act
        // unless somebody was acting on it. It is also why a slow weapon made
        // you harder to hit, and why an archer at four tiles trained defence
        // in perfect safety until v0.71 patched around the symptom.
        //
        // All of it now lives in the mob phase below, where a beast has its
        // own clock, its own reach, and its own reasons.
        if (bowDrawn) { /* nothing here: the beast answers in its own time */ }
      }
      continue;
    }

    if (p.action.type === 'raise') {
      // §6al: twenty intervals of standing at it. The action clears if they
      // move or swing, so nothing else needs to know about fighting.
      if (s.tick - p.action.since < MARKET_RAISE) continue;
      const enough = countLogs(p.inventory) >= MARKET_LOGS
        && countItem(p.inventory, 'ore') >= MARKET_ORE;
      const room = !nodeExistsAt(s, _ctx, p.x, p.y);
      const spare = marketsOwnedBy(s, _ctx, pid) < MARKET_OWNED;
      // §6ao (v6): A STALL LINES THE ROAD. A founding may require citizen stalls
      // to be raised on ground ORTHOGONALLY ADJACENT to a road -- beside it, not
      // on it -- so every stall sits where wanderers pass and none is pitched off
      // in an empty corner where no one will ever see it. The road is the market's
      // street. A world that omits this (v1-v5) lets a stall stand anywhere.
      const byRoad = stallGroundOk(s, p.x, p.y);
      if (enough && room && spare && byRoad) {
        consumeLogs(p.inventory, MARKET_LOGS);
        consumeItem(p.inventory, 'ore', MARKET_ORE);
        addIndexedNode(s, _ctx, 'market-' + pid + '-' + s.tick,
          { type: 'market', x: p.x, y: p.y, by: pid, lastUsed: s.tick, ask: 1 });
        announce(s, (p.name ?? pid.slice(0, 6)) + ' has raised a stall.');
      }
      p.action = null;
      continue;
    }
    if (p.action.type !== 'gather') continue;
    const n = s.nodes[p.action.nodeId];

    if (!n || n.depletedUntil > s.tick || !adjacent(p, n)) {
      p.action = null;
      continue;
    }
    const slot = firstFreeSlot(p.inventory);
    if (slot === -1) { p.action = null; continue; }

    const y = NODE_YIELD[n.type];
    const lvl = effLevel(p.skills[y.skill]);
    const held9 = p.equipment.weapon?.item;
    const toolBonus = (TOOL_FOR[n.type] ?? []).includes(held9) ? (TOOL_BONUS[held9] ?? 24) : 0;
    // §6ad: THE CEILING, AND WHY IT CAME DOWN.
    //
    // It was `min(64 + 2*lvl + tool, 240)`: ninety-four per cent at the top,
    // which is a log every one and a bit intervals and a mastery reached in
    // under four days of running without pause. This world expects executors
    // -- a bot is a citizen here and runs a full node -- so four days is the
    // real number, not a theoretical one.
    //
    // It also made tools cosmetic. Against a ceiling of 240 a bonus of 24 is
    // noise; against 128 it is a fifth of everything, and carrying the right
    // pick is a decision rather than a tooltip.
    //
    // Halved: a shallower slope, a lower cap, and the tool bonus left alone so
    // that it matters twice as much as it did.
    // A CAP THAT DOES NOT SWALLOW THE TOOL.
    //
    // The first attempt at this was `min(32 + lvl + tool, 128)`, which halved
    // the pace correctly and made the star hatchet worthless: at ninety a bare
    // hand already hit the cap, so the better tool bought one per cent. A
    // reward that only works while you cannot afford it is not a reward.
    //
    // At 176 the cap binds only for a master WITH the good tool, which is the
    // right place for it: bare-handed 7.8 days to ninety-nine, bronze 6.5,
    // star 5.4 -- so the tool is worth sixteen per cent of a week's work, and
    // worth smithing.
    // §6ao (v6): THE BLOOM pays for ATTENDANCE, like a watchfire. Every tick a
    // citizen is working the bloomed node -- whether or not this tick's gather
    // lands -- they earn a little bonus XP in that skill. It is a reason to
    // COMPUTE where the bloom is and go stand there with whoever else has, and
    // rewarding presence (not the gather-roll) is what makes it a place people
    // gather rather than a jackpot they chase. Continuous, steady, shared.
    if (s.bloom && s.bloom.nodeId === p.action.nodeId) {
      const bxp = (s.genesis.events && s.genesis.events.bloomXpPerTick) || 4;
      p.skills[y.skill] += bxp;
    }
    // §6ao (v6): DURABILITY IS A SOCIAL KNOB ONLY. A durable node is AVAILABLE
    // far more of the time, which would triple a citizen's real gathers-per-hour
    // if nothing else changed -- flooding the economy and speeding mastery. So
    // the success RATE is scaled down by the same factor the availability rose:
    // a citizen at a durable node succeeds LESS often per tick, netting the SAME
    // resources-per-hour and the SAME XP-per-hour as a v5 world. Durability then
    // changes ONLY how many can share the node (congregation), with zero economic
    // or progression footprint. Gather speed and durability, cleanly separate.
    const rateMul = (s.genesis.gather && s.genesis.gather.rateMul) ?? 1;
    // 6bb: THE SEAM THAT PAYS ONCE IN SIXTEEN THOUSAND.
    //
    // Gold does not read the level, the tool or the founding's rate at all. A
    // master with a starmetal pick strikes it exactly as often as the citizen
    // who has just crossed eighty-five, because the point of gold is that it
    // CANNOT be optimised -- no level shortens it, no tool sharpens it, no
    // founding tunes it. It is the same lot for everybody, and the only thing
    // that buys more of it is more hours of not becoming a master.
    //
    // Its own tag, and this matters: sharing 'gather' would mean gold and ore
    // read the same byte, so a gold strike would imply an ordinary one and the
    // two lotteries would be the same lottery.
    const isGold = n.type === 'gold-rock';
    // 6bi: both lots are drawn out of 65,536 now -- gold at a fixed four, and
    // everything else at a threshold with room in it for a tool to matter.
    const threshold = isGold ? GOLD_THRESHOLD
      : Math.round(Math.min(GATHER_BASE
          + Math.floor(lvl / GATHER_SLOPE_DEN) + toolBonus, GATHER_CAP) * rateMul * 256);
    const r = roll16(beacon, pid, isGold ? 'gold' : 'gather');

    if (r < threshold) {
      // §6ad: THE SAME TREE, THE SAME WATER, A DIFFERENT CATCH.
      //
      // At ninety a master takes heartwood from the trees and the deep fish
      // from the shallows, INSTEAD of the ordinary yield rather than as well
      // as it. Replacement rather than addition, which costs no new node and
      // no new spot -- and it leaves the cheap end of both markets to the
      // people who still need it, because a master can no longer supply it.
      // §6ao (v6): MASTERY HAS ITS OWN PLACE. The old rule upgraded the item in
      // the hand at the BASELINE node -- a master chopping the starter grove got
      // heartwood from the same tree a newcomer got logs from, so the master
      // tier had no destination of its own. Now heartwood comes from a heartwood
      // tree (the deep Greenwood) and deep-fish from a deep-fish spot (the Wilds
      // water at the gibbet), each its own remembered place, the way mining's
      // mastery (magic-stone) always had the Wilds. The node yields what it
      // yields; no upgrade sleight-of-hand.
      let got = y.item;
      // 6bc: A RICHER PLACE GIVES MORE PER STRIKE, not more experience for it.
      // Yield is the one lever a keeper's purse cannot cap and the experience
      // curve does not feel: the gallows-oak pays two heartwood where the deep
      // Greenwood pays one, and charges the Wilds for the difference. Whatever
      // will not fit is simply not taken -- a pack is a pack.
      p.inventory[slot] = { item: got, qty: 1 };
      for (let _extra = 1; _extra < (y.qty ?? 1); _extra++) {
        if (STACKABLE.has(got)) { p.inventory[slot].qty += 1; continue; }
        const _s2 = firstFreeSlot(p.inventory);
        if (_s2 === -1) break;
        p.inventory[_s2] = { item: got, qty: 1 };
      }
      // §6ao (v6): full XP per successful gather (v5's value). Under Option A the
      // success RATE already compensates for durability, so XP-per-gather need
      // not change -- progression matches v5 exactly.
      p.skills[y.skill] += y.xp;
      // and the node stands until the roll retires it.
      // §6ao (v6): DURABILITY IS A FOUNDING'S CHOICE. In one shared world a
      // Schelling point must hold any crowd from a FIXED few nodes, so v6
      // founds durable nodes (rarer depletion, shorter downtime) -- the same
      // six tiles serve ten citizens or ten thousand, busier but never barren.
      // A world that omits these keeps the constitutional 1-in-4 / 8 ticks.
      const depOneIn = (s.genesis.gather && s.genesis.gather.depleteOneIn) || DEPLETE_ONE_IN;
      let depTicks = (s.genesis.gather && s.genesis.gather.depleteTicks) || DEPLETE_TICKS;
      // §6ao (v6): MAGIC-ROCK IS RUNE ORE. The endgame stone of the Wilds keeps
      // a long dark once struck -- the way runite ore did -- so it stays scarce,
      // its few nodes are genuinely contested, and the risk of the Wilds is met
      // by a reward you sometimes have to wait and fight for. A founding sets
      // the length; the shape (this one node depletes longer) is the rule.
      if ((n.type === 'magic-rock' || n.type === 'mother-lode') && s.genesis.gather && s.genesis.gather.magicDepleteTicks)
        depTicks = s.genesis.gather.magicDepleteTicks;
      // 6bb: and a seam that yields once in two and three quarter hours does
      // not then go dark. Depletion exists to move a crowd off a tree; there
      // is no crowd on a thing that pays this seldom, and a dark seam would
      // only add variance to a wait that is already all variance.
      if (isGold) depTicks = GOLD_DEPLETE_TICKS;
      if (depTicks > 0 && roll(beacon, pid, 'deplete') % depOneIn === 0)
        n.depletedUntil = s.tick + depTicks;
    }
  }

  // ---- and what was sent arrives ----------------------------------------
  //
  // A stilling cast with a wand travels. It lands here, on its own interval,
  // in id order like everything else that writes canonical state -- and it
  // lands whether or not the caster is still alive, still holding the wand, or
  // still in the world. A thing let go of is let go of.
  for (const pid of Object.keys(s.players).sort()) {
    const q = s.players[pid];
    if (q.stillAt === undefined) continue;
    if (s.tick < q.stillAt) continue;
    delete q.stillAt;
    if ((q.deadUntil ?? 0) > s.tick) continue;
    q.stilledUntil = s.tick + STILL_WAND_TICKS;
    if (q.action !== undefined) q.action = null;
  }
  for (const mid of Object.keys(s.mobs).sort()) {
    const m2 = s.mobs[mid];
    if (m2.stillAt === undefined) continue;
    if (s.tick < m2.stillAt) continue;
    delete m2.stillAt;
    if (m2.hp <= 0) continue;
    m2.stilledUntil = s.tick + STILL_WAND_TICKS;
  }

  // ---- the keepers count their takings ----------------------------------
  //
  // Every store recovers a little each interval, up to its cap. Iterated in
  // NODE ID ORDER because this writes canonical state, and a node replaying
  // from genesis must reach the same purses as one bootstrapped from a
  // checkpoint -- insertion order differs between the two, sorted order does
  // not.
  // 6bn: nothing recovers. A keeper has what citizens have spent there, and a
  // store founded before this rule simply starts with its seed float.
  for (const nid of Object.keys(s.nodes).sort()) {
    const n = s.nodes[nid];
    if (n.type === 'store' && n.coin === undefined) n.coin = PURSE_SEED;
  }

  _p2mark('beacon');
  // §6ba: the chain now advances at the TOP of the tick (see above). Nothing
  // to do here; the value in the state is already this tick's.
  _p2mark('mastery');
  // ---- mastery announcements (v0.48): who crossed 99 this tick ----
  const _M = XP_TABLE[99];
  // v0.80: this loop writes canonical state (s.firsts, s.announce), so it
  // MUST iterate in playerId order, not insertion order. Insertion order
  // differs between a genesis-replayed node and a checkpoint-bootstrapped
  // one, so two citizens crossing 99 on the same tick could be recorded in
  // a different order on different nodes: a stateHash fork and a
  // mis-attributed permanent 'first'. Sorting makes the record canonical.
  for (const _pid of Object.keys(s.players).sort()) {
    const _p = s.players[_pid], _pre = _preMaster[_pid] ?? new Set();
    const _nm = _p.name ?? _pid.slice(0, 6);
    let _newMastery = false;
    for (const _sk of SKILLS) {
      if (_p.skills[_sk] >= _M && !_pre.has(_sk)) {
        _newMastery = true;
        if (claimFirst(s, 'master:' + _sk, _pid)) announce(s, _nm + ' is the FIRST citizen ever to master ' + _sk + '.');
        else announce(s, _nm + ' has mastered ' + _sk + '.');
      }
    }
    // total mastery: newly crossed the last of all 14 skills this tick
    if (_newMastery && _pre.size < SKILLS.length && SKILLS.every(_sk => _p.skills[_sk] >= _M)) {
      if (claimFirst(s, 'totalmaster', _pid)) announce(s, _nm + ' is the FIRST ever Master of Interval.');
      else announce(s, _nm + ' has become a Master of Interval.');
    }
    // firsts derivable from the state itself (v0.48)
    if (inWilds(s.genesis, _p.x, _p.y) && claimFirst(s, 'wilds', _pid))
      announce(s, _nm + ' is the FIRST to set foot in the Wilds.');
    const _isStar = (it) => it === 'star-sword' || it === 'star-helm' || it === 'star-plate' || it === 'star-dagger';
    const _star = _p.inventory.some(_sl => _sl && _isStar(_sl.item))
      || Object.values(_p.equipment ?? {}).some(_e => _e && _isStar(_e.item));
    if (_star && claimFirst(s, 'stargear', _pid))
      announce(s, _nm + ' is the FIRST to bear star-forged gear.');
  }
  _p2mark(null);

  // ---- the sweep (spec 5f) ----
  //
  // Runs once at the end of every tick, over the working state, in canonical
  // playerId order so that every node removes exactly the same souls at
  // exactly the same tick. It is a pure function of the state, so it is part
  // of the hash like everything else.
  //
  // It only ever removes a key that was created and never used. See
  // everWasSomebody: one level, one coin, one name, one item beyond the
  // starting quiver, and the world keeps you for good.
  {
    let swept = 0;
    for (const pid of Object.keys(s.players).sort()) {
      const p = s.players[pid];
      if (!p) continue;
      const away = s.tick - (p.lastInput ?? 0);
      if (away <= FORGET_AFTER) continue;
      // §6w: THE BOW COMES HOME WHEN ITS HOLDER STOPS COMING.
      //
      // Forgetting requires being empty-handed, and somebody holding the bow
      // is by definition not — so a citizen could lock the finest thing in
      // the world forever by simply never logging in again. Measured: a
      // hundred thousand ticks absent, still holding it, `bowOut` still true.
      //
      // The alternative was to make it decay on a timer, and that would have
      // been worse. The bow's whole power is that WHO HAS IT changes by
      // blood: if it rots on a clock, nobody needs to hunt the holder, they
      // just wait. This keeps the question social and answers only the case
      // that has no answer — an active holder keeps it as long as they can
      // defend it, and an absent one loses it on the same six hours
      // everything else in this world is measured by.
      //
      // The citizen is NOT forgotten here. They may be somebody, with a name
      // and a bank and a life; they simply do not get to hold the world's one
      // unique object while away from it.
      // §6w: KEPT, though the dragon's own clock now does most of this work.
      //
      // The bow goes home when the dragon rises, six hours after it fell, so
      // nobody can hold it longer than that whether they are here or not. This
      // remains for the narrower case the dragon cannot cover: a citizen who
      // stops coming while the dragon is still down. Without it the bow would
      // sit in an absent pack for the rest of the window.
      if (_carriesBow(p) && everWasSomebody(p)) {
        s.bowOut = false;
        if (p.equipment?.weapon?.item === 'dragonbow') p.equipment.weapon = null;
        for (let i = 0; i < p.inventory.length; i++)
          if (p.inventory[i]?.item === 'dragonbow') p.inventory[i] = null;
        announce(s, 'The DRAGONBOW has gone back to the Wilds; its bearer did not come back.');
      }
      if (!everWasSomebody(p)) {           // a key that was never anybody
        // §6w: THE BOW GOES HOME. A unique thing held by somebody who never
        // comes back is a unique thing lost, and the best object in the world
        // sitting in a dead pack forever is worse than no unique object at
        // all. So if the departing citizen carries it, the dragon has it
        // again, and the dragon is worth killing again.
        if (_carriesBow(p)) { s.bowOut = false; announce(s, 'The DRAGONBOW has gone back to the Wilds.'); }
        delete s.players[pid];
        swept++;
      }
      // Somebody real and long absent is NOT archived here. The engine holds
      // only a root and cannot derive a path from it, so it cannot put
      // anyone into the tree unaided. Archiving is an `archive` input,
      // carrying the path -- see §5g. The citizen simply stays present,
      // costing the tick, until someone closes the gate behind them.
    }
    if (swept > 0) s.swept = (s.swept ?? 0) + swept;
  }

  scrubSkills(s);   // nothing non-finite leaves a tick
  grantHoods(s);    // §6ax: whoever crossed this interval
  stepEvents(s, beacon);   // §6ao (v6): the bloom and the incursion, if this world founds them
  return s;
}

module.exports = {
  registerTerrain, terrainBlocked, geographyHashOf,
  SPEC_VERSION, TICK_MS, INV_SLOTS,
  XP_TABLE, levelForXp,
  canonical, stateHash, sha256, beaconValue, roll,
  worldId, SIG_DOMAINS,
  countItem, canAddItem, addItem, removeItem,
  generateIdentity, signInput, verifyInputSig,
  perfStats, ENGINE_ERR,
  // test-only hook (non-API): lets the perf suite exercise cache eviction
  // without minting 16k signatures. Never used by protocol code.
  _perfTesting: {
    setSigCacheMax(n) { _sigCacheMax = n; },
    resetCounters() { for (const k of Object.keys(_perf)) _perf[k] = 0; },
    clearSigCache() { _sigCache.clear(); },
  },
  // Phase 2 benchmark instrumentation (non-consensus; off unless enabled)
  _phase2Perf: {
    enable() { _p2on = true; },
    disable() { _p2on = false; },
    reset() { for (const k of Object.keys(_p2c)) _p2c[k] = 0; _p2sections = {}; _p2cur = null; },
    tickStart() { _p2sections = {}; _p2cur = null; },
    tickSections() { return { ..._p2sections }; },
    counters() { return { ..._p2c }; },
    cloneMode() { return _cloneModeName(); },
    indexesEnabled() { return _indexesOn(); },
  },
  // Phase 2 test hooks (non-API): clone/index selection for differential
  // campaigns, plus direct access to the helpers under test.
  _phase2Testing: {
    setClone(m) { _cloneOverride = m; },
    setIndexes(b) { _indexOverride = b; },
    cloneStateForTick, buildTickContext,
    addIndexedNode, deleteIndexedNode,
    nodeExistsAt, blockingNodeAt, hasAdjacentNode, findAdjacentNode, prayerKeeps,
    adjacentNodeIdsInOrder, brewpotsOwnedBy,
    validInput,
  },
  signPayload, verifyPayload,
  exportIdentity, importIdentity, loadOrCreateIdentity,
  canonical, EMPTY_ROOT, SMT_DEPTH,
  CALLING_NAMES, KEEPER_KINDS, skillUnlocks, worthRank,
  normaliseSource, engineHashOf, declareEngine, engineHash,
  SLEEP_AFTER, isAwake, effLevel, standingOf, callingOf, CALLINGS, countedSuccess, validateState, validateGenesis, validateImports, validateInputShape, normalizeInput, slotOf, supportsWorldGenerator, minQuorumFor, maxByzantine, byzantineSafe, initCrypto, SKILLS, EQUIP_SLOTS, NODE_TYPES, INV_SLOTS, ITEMS, isValidName, cityRectOf, norwickRectOf, wildsRectOf, inCity, PRICES, inWilds, spawnOf, makeGenesis, newWorld, sameWorld, addPlayer, addNode, addMob, nextState, MOB_STATS, RECIPES, EQUIPPABLE,
};
