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

const SPEC_VERSION = '0.81';
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
  if (p.equipment && (p.equipment.weapon || p.equipment.head || p.equipment.body)) return true;
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
  'firemaking', 'prayer', 'ranged', 'magic', 'farming', 'fletching', 'attack', 'defence', 'hitpoints', 'exploration', 'brewing'];
const EQUIP_SLOTS = ['weapon', 'head', 'body'];
const NODE_TYPES = ['landmark', 'keeper', 'fence', 'hedge', 'tree', 'rock', 'magic-rock', 'fishing-spot', 'plot',
  'waystone', 'bank', 'anvil', 'campfire', 'fire', 'guard', 'house', 'signpost', 'smith', 'store', 'wall', 'well', 'brewpot', 'watchfire'];
// The constitutional NAME rule (spec §5a) as ONE shared validator (rev5
// §3): claim_name input validation, checkpoint validation, imports, and
// the registry all call this, never a private regex.
function isValidName(name) {
  return typeof name === 'string' && /^[a-z0-9-]{1,12}$/.test(name)
    && !name.startsWith('-') && !name.endsWith('-');
}
const DEPLETE_TICKS = 8;
const NODE_YIELD = {
  'tree':         { item: 'logs',        skill: 'woodcutting', xp: 25 },
  'rock':         { item: 'ore',         skill: 'mining',      xp: 35 },
  'fishing-spot': { item: 'raw-fish',    skill: 'fishing',     xp: 30 },
  'magic-rock':   { item: 'magic-stone', skill: 'mining',      xp: 30 },
};
// v0.40: the night gate is repealed. It was constitutional arithmetic
// (tick % 2400), not wall-clock authority: but its only effect was
// mandatory waiting, and waiting is the one cost this world rejects.
// The stones price the sigil; the sky is for the windows to paint.
// v0.41: strength must be earned before it is worn. Smithing gated the
// forge; nothing gated the arm. Bronze stays free: the door is open.
const WIELD_REQS = {
  'star-sword': { attack: 20 }, 'star-dagger': { attack: 20 }, 'old-chain': { attack: 30 },
  'star-spear': { attack: 20 }, 'star-maul': { attack: 25 }, 'horn-bow': { ranged: 20 },
  'dragonbow': { ranged: 40 },   // it will not be drawn by a beginner
  // §6x: these shipped with NO requirement at all, which made a starmetal
  // flail wieldable at level one while a star-maul asked for attack 25. A
  // crossbow is heavy to hold level and heavier to crank; a flail on a chain
  // is the least forgiving thing in the world to swing at anything.
  'crossbow': { ranged: 25 },
  'bronze-flail': { attack: 10 }, 'star-flail': { attack: 25 },
  // §6y: sigils bound to the limbs. The draw is half the arrows, and half of
  // nothing is still nothing, so it asks a real bow-arm first.
  'sigil-bow': { ranged: 30, magic: 20 },
  'heartwood-bow': { ranged: 40 },
  'star-helm': { defence: 15 }, 'star-plate': { defence: 30 },
};
const STORE_SELLS = { seeds: 15 }; // the keeper's OWN goods, made from nothing
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
const SHELF_CAP = 1000;        // per item, per store: consensus state is forever
const SHELF_DECAY_EVERY = 1500; // 15 minutes
const SHELF_DECAY_SHIFT = 4;    // a sixteenth rots away: goods nobody wanted // farming no longer waits on goblin luck
const MAGIC_ROCK_MINING = 10; // the vein refuses an unpracticed pick
const DEATH_TICKS = 5; // the world holds its breath; windows may grieve
const BRAND_TICKS = 1500; // strike first in the Wilds, wear it 15 minutes
// the star-dagger's root (v0.49): rare and expensive by design, a 3-tick
// freeze on a 120-tick leash, and a 10-tick immunity after so no one is
// chain-frozen. Landing it is a decision, not a rhythm.
const ROOT_TICKS = 3, ROOT_IMMUNE = 10, ROOT_CD = 120;
const XP_COOK = 30;
// v0.73: the gullet has its own rhythm, as the arm does (§6b, lastSwing).
// Without one, a citizen ate every interval while the fight held, and broth
// heals 5 against a skeleton-knight's 2 hp per interval at absolute maximum:
// nobody carrying brews could die, so death, the Wilds and the brand were all
// decoration. Eating mid-fight stays legal, as §6m intends. It simply has a
// rate now, and that rate is what makes a beast dangerous to the unready.
const EAT_EVERY = 8;
// the stilling (v0.80): magic's capstone. The stilled cannot act, and
// cannot be struck, a truce, enforced, cast to break off a fight and
// never to end one. Magic is the skill of refusing combat: anchor
// flees, mend endures, still denies.
const STILL_LEVEL = 85;
const STILL_SIGILS = 3;
const STILL_TICKS = 6;      // both parties walk one tile per interval: six tiles of head start
const STILL_IMMUNE = 15;    // after it lifts: nobody is chain-stilled
const STILL_CD = 150;       // the caster's word needs time to regain its weight
const STILL_RANGE = 6;      // a spell of sight, not touch: it outranges the bow
const STILL_XP = 150;
const HEAL_FISH = 3;
// §6ad: THE DEEP FISH. Ten, against a broth's five -- but a fish does not
// STACK and a broth does, so a pack of broth is still the greater total and
// this is the greater single bite. Burst against volume, which is a choice
// rather than a replacement.
const HEAL_DEEP_FISH = 10;
// every edible thing and what it restores, in ONE place. Anything that heals
// can be eaten; anything that cannot be eaten heals nothing. Two lists that
// must agree are one list.
// anything a fire can turn into food, asked once
const isRawFood = (item) => item === 'raw-fish' || item === 'deep-fish';
const healOf = (item) => item === 'cooked-fish' ? HEAL_FISH
  : item === 'cooked-deep-fish' ? HEAL_DEEP_FISH
  : item === 'broth' ? HEAL_BROTH
  : item === 'ale' ? HEAL_ALE : 0;
const COOK_DEEP_REQ = 80;       // a cook to match the fisher
const XP_COOK_DEEP = 90;
const HEAL_BROTH = 5, HEAL_ALE = 4; // brewed restoration (v0.51)
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
const WEAPONS = {
  'bronze-dagger': { hit: 0, every: 2, reach: 1, acc: 24 },
  'bronze-sword':  { hit: 2, every: 2, reach: 1, acc: 0 },
  'bronze-spear':  { hit: 1, every: 2, reach: 2, acc: 0 },
  'bronze-maul':   { hit: 4, every: 3, reach: 1, acc: -24 },
  'star-dagger':   { hit: 2, every: 2, reach: 1, acc: 24 },
  'star-sword':    { hit: 4, every: 2, reach: 1, acc: 0 },
  'star-spear':    { hit: 3, every: 2, reach: 2, acc: 0 },
  'star-maul':     { hit: 7, every: 3, reach: 1, acc: -24 },
  'old-chain':     { hit: 1, every: 1, reach: 1, acc: 0 },
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
  'bronze-flail':  { hit: 1, every: 2, reach: 1, acc: -12, pierces: true },
  'star-flail':    { hit: 3, every: 2, reach: 1, acc: -12, pierces: true },
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
  'crossbow':      { hit: 5, every: 3, reach: 4, acc: 32, ranged: true },
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
  'sigil-bow':     { hit: 2, every: 2, reach: 5, acc: 0, ranged: true, thrift: true },
  // §6ad: THE HEARTWOOD BOW, and the only good bow anybody can MAKE.
  //
  // Every other is found, imbued, forged or unique -- fletching topped out at
  // a beginner's stick. This one is crafted, and it is not a tier above the
  // horn-bow but a choice against it: MORE damage, LESS reach than any bow in
  // the world. Three puts you inside a goblin's senses and a troll's, so you
  // cannot stand beyond their perception and shoot freely. You trade the kite
  // for the damage. The archer's weapon for somebody who means to be in it.
  'heartwood-bow': { hit: 4, every: 2, reach: 3, acc: 6, ranged: true },
  'wooden-bow':    { hit: 0, every: 2, reach: 4, acc: 0, ranged: true },
  'horn-bow':      { hit: 2, every: 2, reach: 5, acc: 0, ranged: true },
  // THE DRAGONBOW (spec 6w). There is one, and there will only ever be one.
  // Reach 9 is the whole weapon: nothing else in the world touches past five,
  // so whoever draws it fights at a distance where almost nothing can answer.
  // Against a citizen in the Wilds that is not a duel, it is a decision made
  // before they knew it started.
  'dragonbow':     { hit: 6, every: 2, reach: 9, acc: 12, ranged: true },
};
const weaponOf = (p) => WEAPONS[p?.equipment?.weapon?.item] ?? null;
const reachOf = (p) => weaponOf(p)?.reach ?? 1;
const isRanged = (p) => weaponOf(p)?.ranged === true;
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

const MOB_STATS = {
  // §6aa: `aggro` is how many tiles away a beast will notice you and come.
  // A goblin sees three -- close enough to matter on a road, far enough short
  // of the eighteen a citizen can see that nothing charges out of the dark.
  goblin: { maxHp: 5, atk: 1, def: 1, maxHit: 1, respawn: 16, aggro: 3,
            drops: [{ item: 'bones' }, { item: 'ore', chance: 16384 }, { item: 'seeds', chance: 16384 }] },
  wolf:   { maxHp: 8, atk: 2, def: 2, maxHit: 2, respawn: 150, aggro: 5,   // a wolf hunts
            drops: [{ item: 'bones' }, { item: 'bones', chance: 24576 }] },
  // v0.75: the old-chain falls at 2/65536, one troll in 32,768, which is some
  // nine days of an executor farming trolls without pause. It is the only item
  // in the world with no price at any store, so it can never be sold to a
  // keeper and only ever passes between citizens. The best weapon here is the
  // one thing gold cannot be turned into except by asking someone who has one.
  troll:  { maxHp: 20, atk: 4, def: 4, maxHit: 3, respawn: 300, aggro: 4,
            drops: [{ item: 'bones' }, { item: 'ore' }, { item: 'bronze-plate', chance: 6144 },
                    { item: 'old-chain', chance: 2 }] },
  bear:   { maxHp: 14, atk: 3, def: 3, maxHit: 2, respawn: 220, aggro: 3,  // territorial, not a hunter
            drops: [{ item: 'bones' }, { item: 'bones', chance: 32768 }, { item: 'bronze-hatchet', chance: 4096 },
                    { item: 'horn-bow', chance: 66 }] },
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
  'great-spider': { maxHp: 300, atk: 26, def: 18, maxHit: 9, every: 3,
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
            respawn: 36000,          // six hours: killing it is an event, not a round
            drops: [{ item: 'bones' }, { item: 'bones' }, { item: 'ore' }] },
  'skeleton-knight': { maxHp: 18, atk: 5, def: 6, maxHit: 4, respawn: 120, aggro: 5,   // the Wilds is dangerous in itself now
            drops: [{ item: 'bones' }, { item: 'bones' },   // double bones, the warrior's due
                    { item: 'ore', chance: 12288 },            // scavenged metal
                    { item: 'star-helm', chance: 328 }] },    // rare: the horned helm itself
};
// the store's ledger (spec 6l)
const GROW_TICKS_RIPE = 1200; // spec 6o: twelve minutes, seed to harvest
const PRICES = {
  'bronze-dagger': 8, 'bronze-spear': 14, 'bronze-maul': 22,
  'star-spear': 100, 'star-maul': 160, 'horn-bow': 90, 'crab-shell': 12,
  'logs': 2, 'ore': 5, 'raw-fish': 3, 'cooked-fish': 6, 'bones': 2, 'arrows': 1,
  // heartwood is worth more than logs, and a deep fish more than a shallow
  // one: a master's hour should be worth more than a beginner's
  'heartwood': 9, 'deep-fish': 11, 'cooked-deep-fish': 22, 'burnt-deep-fish': 1,
  'heartwood-bow': 120,
  'magic-stone': 20, 'bronze-sword': 15, 'bronze-hatchet': 10, 'bronze-pickaxe': 10,
  'bronze-helm': 12, 'bronze-plate': 30, 'wooden-bow': 8, 'grain': 4,
  'star-sword': 120, 'star-helm': 60, 'star-plate': 200,
};
const storeAsk = (item) => PRICES[item] + Math.max(1, Math.floor(PRICES[item] / 10));
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
  'bronze-dagger': { ore: 1 },
  'bronze-spear': { ore: 1, logs: 1 },
  'bronze-maul': { ore: 2, logs: 1 },
  'bronze-flail': { ore: 2, logs: 1 },          // a head, a chain, a haft
  'sigil-bow': { 'horn-bow': 1, sigil: 3 },     // imbued, not made
  'heartwood-bow': { heartwood: 3 },            // §6ad: fletched, not forged
  'crossbow': { ore: 2, logs: 2 },              // a steel prod and a wooden stock
  'star-flail': { 'magic-stone': 3, ore: 2, logs: 1 },
  'star-spear': { 'magic-stone': 2, ore: 1, logs: 1 },
  'star-maul': { 'magic-stone': 3, ore: 2, logs: 1 },
  'bronze-sword':   { ore: 2, logs: 1 },
  'bronze-hatchet': { ore: 1, logs: 1 },
  'bronze-pickaxe': { ore: 1, logs: 1 },
  'bronze-helm':    { ore: 1, logs: 1 },
  'bronze-plate':   { ore: 3, logs: 1 },
  'star-sword':     { 'magic-stone': 3, ore: 2 },
  'star-helm':      { 'magic-stone': 2, ore: 1 },
  'star-plate':     { 'magic-stone': 4, ore: 3 },
  'star-dagger':    { 'magic-stone': 2, ore: 1 },
};
const EQUIPPABLE = new Set([...Object.keys(RECIPES), 'wooden-bow', 'horn-bow', 'old-chain', 'dragonbow']);
// The constitutional ITEM vocabulary (rev5 §4): every item the engine can
// mint, derived from protocol constants plus the base gather/drop set. A
// syntactically pretty identifier that is not in this set is contraband:
// validation rejects it in inventories, banks, equipment, ground, trades,
// and imports alike.
const ITEMS = new Set([
  'seeds', 'grain', 'logs', 'ore', 'raw-fish', 'cooked-fish', 'burnt-fish',
  // §6ad: what a master brings back from the same tree and the same water
  'heartwood', 'deep-fish', 'cooked-deep-fish', 'burnt-deep-fish', 'heartwood-bow',
  'bones', 'arrows', 'wooden-bow', 'horn-bow', 'magic-stone', 'sigil', 'old-chain', 'ale', 'broth',
  'dragonbow',   // §6w: there is one. No keeper prices it, so it is never bought.
  'crab-shell',  // §6z: what a shore-crab gives up
  'sigil-bow',
  ...Object.keys(RECIPES),
]);
const EQUIP_SLOT = { 'bronze-helm': 'head', 'bronze-plate': 'body', 'star-helm': 'head', 'star-plate': 'body' }; // default: weapon
// the first level requirements (spec 6q): an unearned hammer strikes nothing
const SMITH_REQS = { 'star-sword': { smithing: 20, magic: 10 },
  'star-helm': { smithing: 15, magic: 5 }, 'star-plate': { smithing: 30, magic: 15 },
  'star-dagger': { smithing: 20, magic: 15 },
  'star-spear': { smithing: 22, magic: 12 }, 'star-maul': { smithing: 28, magic: 15 },
  // §6x: a crossbow is a steel prod under tension and a lock that must not
  // slip. The flail is easier iron and harder geometry.
  'crossbow': { smithing: 18 }, 'bronze-flail': { smithing: 8 },
  'star-flail': { smithing: 26, magic: 14 },
  // §6y: THE SIGIL-BOW. Not made -- IMBUED. You bring a horn-bow that already
  // works and three sigils, and you bind them to the limbs, which is why the
  // magic asked for is higher than the smithing.
  'sigil-bow': { smithing: 12, magic: 25 },
  'heartwood-bow': { fletching: 90 } };
// §6ad: A LOG IS A LOG.
//
// At woodcutting 90 a tree gives heartwood instead of logs, which would strand
// a master woodcutter if anything asked for `logs` by name -- and seventeen
// places do: kindling a campfire, feeding a watchfire, seven smithing
// recipes, the wooden-bow. Written out seventeen times that is seventeen
// chances to miss one, and the one you miss is a skill somebody can no longer
// train. So it is asked once, here.
const isLog = (item) => item === 'logs' || item === 'heartwood';
const consumeLogs = (inv, n) => {           // spends ordinary logs first, heartwood after
  let left = n;
  for (const kind of ['logs', 'heartwood'])
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
const SOAK = (item) => item?.startsWith('star-') ? 2 : 1; // starmetal turns aside more
const slotOf = (item) => EQUIP_SLOT[item] ?? 'weapon';
const TOOL_FOR = { tree: 'bronze-hatchet', rock: 'bronze-pickaxe' };

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
  make: (v) => ['bow', 'arrows'].includes(v) || 'must be bow or arrows',
  name: (v) => isValidName(v) || 'must be a constitutional name',
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
  attack: { mobId: T.id },
  attackp: { targetId: T.hex64 },
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
  fletch: { slot: T.slot, make: T.make },
  pickup: { groundId: T.id },
  claim_name: { name: T.name },
  survey: {}, read_chart: { slot: T.slot },
  build_brewpot: {}, brew: { nodeId: T.id, slot: T.slot }, collect: { nodeId: T.id }, dismantle: { nodeId: T.id },
  kindle: {}, stoke: { nodeId: T.id, slot: T.slot },
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
const XP_SMITH_PER_ORE = 30;
// what a recipe teaches when it is not made of ore. A bow bound at the forge
// is bench work rather than smelting, so it pays less than the metal would.
const XP_SMITH_FLAT = { 'sigil-bow': 40, 'heartwood-bow': 40 };
function XP_SMITH_FOR(recipe, r) {
  const flat = XP_SMITH_FLAT[recipe];
  if (flat !== undefined) return flat;
  const ore = r && Number.isFinite(r.ore) ? r.ore : 0;
  return XP_SMITH_PER_ORE * ore;
}
const XP_FIREMAKING = 40;
const XP_BURY = 25;
const FIRE_TICKS = 100;
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
function standingOf(p) {
  let n = 0;
  for (const sk of SKILLS) n += levelForXp(p?.skills?.[sk] ?? 0);
  return n;
}
// CALLING is the profession a citizen is best at, as a word. Hitpoints is
// excluded: it is a consequence of fighting rather than a trade, and it starts
// at 10, so without this every citizen would be born a fighter. Ties fall to
// the constitutional skill order, so the answer is the same on every node.
const CALLINGS = {
  woodcutting: 'forester', mining: 'miner', fishing: 'fisher', cooking: 'cook',
  smithing: 'smith', firemaking: 'firekeeper', prayer: 'mourner', ranged: 'archer',
  magic: 'sigilist', farming: 'farmer', fletching: 'fletcher', attack: 'fighter',
  defence: 'warden', exploration: 'cartographer', brewing: 'brewer',
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
  // all sixteen: the same condition the world announces as Master of Interval.
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

// ---------- genesis & world (spec §9) ----------
// Two peers are in the same world iff their genesis objects match.

// The canonical generator registry (rev7 §8): a founding record names its
// generator EXPLICITLY, so two deterministic generators can never be
// confused about which world a genesis founds.
const WORLD_GENERATORS = new Set(['interval-classic-v1', 'interval-expanse-v1', 'interval-expanse-v2', 'interval-expanse-v3', 'interval-expanse-v4', 'interval-expanse-v5']);

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
           survey: { k: 8, base: 40, perTile: 10, max: 1800 },
           // brewing (v0.51): a profession rate-limited by fermentation; constants
           // are THIS world's, in the founding record, a larger world tunes its own.
           brew: { ferment: 4500, potCap: 4, xpPerBatch: 13500, buildLogs: 4, buildOre: 2, decayTicks: 432000 },
           // watchfires (v0.53): high-tier Firemaking as public infrastructure.
           watch: { level: 60, kindleLogs: 10, perLog: 300, cap: 6000, xpPerLog: 200, burnXp: 1, maxOwned: 2, decayTicks: 432000 } };
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
const isItemName = (v) => typeof v === 'string' && (ITEMS.has(v) || isChart(v)); // membership, not just shape (rev5 §4)
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
const GENESIS_OPTIONAL = new Set(['engineHash', 'witnesses', 'quorum', 'byzantineTolerance', 'imported', 'importedFrom', 'survey', 'brew', 'watch', 'geo', 'geographyHash', 'founderKey']);

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
      if (!EQUIPPABLE.has(imp.weapon.item)) return 'imported weapon is not equippable';
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
  const PLAYER_OPTIONAL = new Set(['attuned', 'brandedUntil', 'cooksTried', 'deadUntil', 'lightsTried', 'rootedUntil', 'rootImmuneUntil', 'rootCdUntil', 'stilledUntil', 'stillImmuneUntil', 'stillCdUntil', 'slain', 'lastSwing', 'lastAte']);
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
      if (keys.join(',') !== 'mobId,since,type' || !isId(a.mobId) || !isInt(a.since, 0, MAX_TIME)) return 'malformed attack action';
      if (!s2.mobs[a.mobId]) return 'attack action references a missing mob';
    } else if (a.type === 'attackp') {
      if (keys.join(',') !== 'since,targetId,type' || !HEX64.test(a.targetId ?? '') || !isInt(a.since, 0, MAX_TIME)) return 'malformed attackp action';
      if (!s2.players[a.targetId]) return 'attackp action references a missing player';
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
        if (!EQUIPPABLE.has(worn.item)) return 'equipped item is not equippable';
        if (slotOf(worn.item) !== eq) return `equipped item in the wrong slot (${worn.item} belongs in ${slotOf(worn.item)})`;
      }
    }
    if (p.name !== null && !isValidName(p.name)) return 'non-constitutional player name';
    if (!isInt(p.gold, 0, MAX_QTY)) return 'gold out of bounds';
    if (!isInt(p.lastInput, 0, MAX_TIME)) return 'lastInput out of bounds';
    const aerr = validAction(p.action, state); if (aerr) return aerr;
    const terr = validTrade(p.trade, state); if (terr) return terr;
    if (p.attuned !== undefined) {
      if (!Array.isArray(p.attuned) || p.attuned.length > 64) return 'malformed attunements';
      for (const w of p.attuned) {
        if (!isId(w)) return 'malformed attunement';
        if (state.nodes[w]?.type !== 'waystone') return 'attunement references a missing waystone';
      }
    }
    for (const tk of ['brandedUntil', 'deadUntil', 'rootedUntil', 'rootImmuneUntil', 'rootCdUntil', 'stilledUntil', 'stillImmuneUntil', 'stillCdUntil', 'lastSwing', 'lastAte']) if (p[tk] !== undefined && !isInt(p[tk], 0, MAX_TIME)) return `${tk} out of bounds`;
    for (const ck of ['cooksTried', 'lightsTried']) if (p[ck] !== undefined && !isInt(p[ck], 0, MAX_TIME)) return `${ck} out of bounds`;
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
    for (const mk of Object.keys(m)) if (!['hp', 'hx', 'hy', 'respawnAt', 'type', 'x', 'y', 'rootedUntil', 'rootImmuneUntil', 'stilledUntil', 'stillImmuneUntil', 'lastSwing', 'mad', 'bound', 'quiver'].includes(mk)) return 'non-constitutional mob field ' + mk;
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
    if (state.markers.length > (state.genesis.survey?.k ?? 0) + 2) return 'too many markers';
    for (const m of state.markers) {
      if (!m || typeof m !== 'object') return 'malformed marker';
      if (!isInt(m.x, 0, W - 1) || !isInt(m.y, 0, H - 1)) return 'marker out of bounds';
      if (!MARKER_KINDS.has(m.kind)) return 'bad marker kind';
      if (m.bornAt !== undefined && !isInt(m.bornAt, 0, MAX_TIME)) return 'marker bornAt out of bounds';
      if (m.kind === 'ws' && (typeof m.ws !== 'string' || state.nodes[m.ws]?.type !== 'waystone')) return 'marker names no waystone';
      const allowed = m.kind === 'ws' ? 'bornAt,kind,ws,x,y' : 'bornAt,kind,x,y';
      if (Object.keys(m).sort().join(',') !== allowed) return 'non-constitutional marker fields';
    }
  }

  // nodes: constitutional type table, closed field set
  const NODE_FIELDS = new Set(['type', 'x', 'y', 'depletedUntil', 'expiresAt', 'plantedAt', 'by', 'text', 'readyAt', 'brewKind', 'lastUsed', 'fuelUntil', 'shelf', 'kind', 'founderKey', 'name']);
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
      if (n.type !== 'landmark') return 'only a landmark bears a kind';
      if (!LANDMARK_KINDS.has(n.kind)) return `unknown landmark kind ${n.kind}`;
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
      if (n.type !== 'store') return 'only a store keeps a shelf';
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
      if (n.brewKind !== undefined && n.brewKind !== 'ale' && n.brewKind !== 'broth') return 'bad brewKind';
      if (n.lastUsed !== undefined && !isInt(n.lastUsed, 0, MAX_TIME)) return 'brewpot lastUsed out of bounds';
      if (n.plantedAt !== undefined) return 'brewpot carries plot metadata';
    } else if (n.type === 'watchfire') { // owned public light, fed by logs (v0.53)
      if (typeof n.by !== 'string' || !HEX64.test(n.by)) return 'watchfire without a keeper';
      if (!state.players[n.by]) return 'watchfire keeper does not exist';
      if (!isInt(n.fuelUntil ?? 0, 0, MAX_TIME)) return 'watchfire fuelUntil out of bounds';
      if (n.plantedAt !== undefined || n.readyAt !== undefined || n.brewKind !== undefined) return 'watchfire carries foreign metadata';
    } else if (n.fuelUntil !== undefined) {
      return 'fuel on a non-watchfire node';
    } else if (n.readyAt !== undefined || n.brewKind !== undefined) {
      return 'brew metadata on a non-brewpot node';
    } else if (n.plantedAt !== undefined || n.by !== undefined) {
      if (n.type !== 'plot') return 'ownership metadata on a non-plot node';
      if (n.plantedAt !== undefined && !isInt(n.plantedAt, 0, MAX_TIME)) return 'node planting out of bounds';
      if (n.plantedAt > 0) {
        if (typeof n.by !== 'string' || !HEX64.test(n.by)) return 'planted plot without an owner';
        if (!state.players[n.by]) return 'plot owner does not exist';
      } else if (n.by !== undefined) return 'unplanted plot carries an owner';
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
    equipment: { weapon: null, head: null, body: null },
    bank: {},
    lastInput: state.tick,
    gold: 0,
    inventory: Array(INV_SLOTS).fill(null),
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
const STACKABLE = new Set(['arrows', 'grain', 'seeds', 'ale', 'broth']);

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
    // switch: the buyer paid for a star-sword and received a bronze-dagger.
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
      if (n.type === 'magic-rock' && effLevel(p.skills.mining) < MAGIC_ROCK_MINING) return false;
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
    case 'recall': {
      // spec 2k: recall to any waystone you have walked to. Never from the Wilds ,
      // magic will not carry you out of danger you chose to enter.
      if (p.hp <= 0 || inWilds(state.genesis, p.x, p.y)) return false;
      const ws = state.nodes[input.to];
      if (!ws || ws.type !== 'waystone') return false;
      return (p.attuned ?? []).includes(input.to);
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
      // v0.74: two things are for sale at a store. The keeper's own goods,
      // conjured from nothing (STORE_SELLS), and whatever citizens have sold
      // to THIS store and nobody has yet carried off.
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
        && p.inventory.some(sl => sl?.item === 'arrows');
    }
    case 'attackp': {
      if ((state.players[input.targetId]?.stilledUntil ?? 0) > state.tick) return false; // the truce shields (v0.80)
      // 7.1: player state has no playerId field; compare against the input's
      // own id or self-attack slips through as (undefined === target) === false
      const q = state.players[input.targetId];
      if (!q || q.hp <= 0 || input.targetId === input.playerId) return false;
      if (!inWilds(state.genesis, p.x, p.y) || !inWilds(state.genesis, q.x, q.y)) return false;
      if (inReach(p, q)) return true;
      const cheb = Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y));
      return cheb <= reachOf(p) && isRanged(p)
        && p.inventory.some(sl => sl?.item === 'arrows');
    }
    case 'plant': {
      const sl = p.inventory[input.slot];
      if (!Number.isInteger(input.slot) || sl?.item !== 'seeds') return false;
      return hasAdjacentNode(state, ctx, p, 'plot', n => !n.plantedAt);
    }
    case 'harvest': {
      const n = state.nodes[input.nodeId];
      return !!n && n.type === 'plot' && n.plantedAt > 0 && n.by === input.playerId
        && (state.tick - n.plantedAt) >= GROW_TICKS_RIPE && adjacent(p, n)
        && firstFreeSlot(p.inventory) !== -1;
    }
    case 'sell': {
      const sl = p.inventory[input.slot];
      if (!Number.isInteger(input.slot) || !sl || !(sl.item in PRICES)) return false;
      return hasAdjacentNode(state, ctx, p, 'store');
    }
    case 'invoke': {
      // three stones, any hour (v0.40): the cost is the mining, not the wait
      return p.inventory.filter(sl => sl?.item === 'magic-stone').length >= 3;
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
        if (p.hp <= 0 || inWilds(state.genesis, p.x, p.y)) return false;
        if ((p.rootedUntil ?? 0) > state.tick) return false;   // §6v: they cannot move
        return p.inventory.some((sl) => sl?.item === 'sigil');
      }
      if (input.spell === 'mend') // v0.41: the same sigil, a deeper use
        return effLevel(p.skills.magic) >= 20 && p.inventory.some(sl => sl?.item === 'sigil');
      return false;
    }
    case 'survey': { // stand on a marker to survey it (v0.50)
      if (p.hp <= 0) return false;
      return (state.markers ?? []).some(m => m.x === p.x && m.y === p.y);
    }
    case 'read_chart': {
      const sl = p.inventory[input.slot];
      return !!sl && isChart(sl.item);
    }
    case 'build_brewpot': {
      if (p.hp <= 0 || !state.genesis.brew) return false;
      const bc = state.genesis.brew;
      if (nodeExistsAt(state, ctx, p.x, p.y)) return false;
      if (!hasAdjacentNode(state, ctx, p, 'house')) return false;
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
      return !!sl && isLog(sl.item) && (wf.fuelUntil ?? 0) < state.tick + state.genesis.watch.cap;
    }
    case 'fletch': {
      const sl = p.inventory[input.slot];
      if (!Number.isInteger(input.slot) || !sl) return false;
      return (input.make === 'bow' && isLog(sl.item))
        || (input.make === 'arrows' && sl.item === 'bones');
    }
    case 'smith': {
      const r = RECIPES[input.recipe];
      if (!r) return false;
      if (!hasAdjacentNode(state, ctx, p, 'anvil')) return false;
      const req = SMITH_REQS[input.recipe];
      if (req && !Object.entries(req).every(([sk, lv]) => effLevel(p.skills[sk]) >= lv)) return false;
      const have = (item) => p.inventory.filter(sl => sl && sl.item === item).length;
      return Object.entries(r).every(([item, qty]) => have(item) >= qty);
    }
    case 'wield': {
      const sl = p.inventory[input.slot];
      if (!Number.isInteger(input.slot) || !sl || !EQUIPPABLE.has(sl.item)) return false;
      const req = WIELD_REQS[sl.item];
      if (req) for (const [sk, lv] of Object.entries(req))
        if (effLevel(p.skills[sk]) < lv) return false; // earned, then worn (v0.41)
      return true;
    }
    case 'unwield': {
      const g = ['weapon', 'head', 'body'].includes(input.gear) ? input.gear : 'weapon';
      return p.equipment[g] !== null && firstFreeSlot(p.inventory) !== -1;
    }
    case 'light': {
      const sl = p.inventory[input.slot];
      if (!Number.isInteger(input.slot) || !sl || !isLog(sl.item)) return false;
      return !nodeExistsAt(state, ctx, p.x, p.y);
    }
    case 'bury': {
      const sl = p.inventory[input.slot];
      return Number.isInteger(input.slot) && !!sl && sl.item === 'bones';
    }
    case 'deposit': {
      if (!Number.isInteger(input.slot) || !p.inventory[input.slot]) return false;
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
      if (firstFreeSlot(p.inventory) === -1) return false;
      return hasAdjacentNode(state, ctx, p, 'bank');
    }
    case 'drop': {
      return Number.isInteger(input.slot) && !!p.inventory[input.slot];
    }
    case 'pickup': {
      const g2 = state.ground[input.groundId];
      if (!g2 || g2.x !== p.x || g2.y !== p.y) return false;
      // 7.4: execution merges arrows into an existing quiver, so validation
      // must accept that path too, a full pack still has room in the quiver
      if (g2.item === 'arrows' && p.inventory.some(sl => sl?.item === 'arrows')) return true;
      return firstFreeSlot(p.inventory) !== -1;
    }
    case 'eat': {
      const slot = p.inventory[input.slot];
      if (state.tick - (p.lastAte ?? -EAT_EVERY) < EAT_EVERY) return false; // §6m: the gullet has a rhythm
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
const _WALKABLE_BUILT = new Set(['brewpot', 'watchfire', 'fire']); // what citizens build never blocks a door (v0.52, v0.53, v0.80)
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
const _FIRE_TYPES = new Set(['campfire', 'fire']);
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
function waystoneIdsSorted(state, ctx) {
  // reference: Object.keys(...).filter(waystone).sort() sorted, so order-safe
  if (!ctx) { if (_p2on) _p2c.fullNodeScans++; return Object.keys(state.nodes).filter(id => state.nodes[id].type === 'waystone').sort(); }
  if (_p2on) _p2c.typeLookups++;
  return [...(ctx.byType.get('waystone') ?? [])].sort();
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
  const wsIds = waystoneIdsSorted(s, ctx);
  const rr = sha256(Buffer.from(s.beacon + '|rumor|' + s.tick + '|' + index + '|' + salt)).readUInt32BE(0) / 0xffffffff;
  if (wsIds.length && rr < 0.15) { // a rumor: sits beside a waystone, charts it when surveyed
    const wid = wsIds[Math.min(wsIds.length - 1, Math.floor((rr / 0.15) * wsIds.length))];
    const ws = s.nodes[wid];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = ws.x + dx, y = ws.y + dy;
      if (x >= 1 && y >= 1 && x < g.worldW - 1 && y < g.worldH - 1 && !occupied(x, y) && !inCity(g, x, y)
        && !terrainBlocked(g, x, y)) // v0.79: a rumor must be standable too
        return { x, y, kind: 'ws', ws: wid, bornAt: s.tick };
    }
  }
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
  // the beacon rides IN the state now (v0.38). A pre-0.38 state migrates
  // itself: seeded once from the old formula, then history takes over.
  if (!s.beacon) s.beacon = beaconValue(state.genesis.genesisSeed, state.tick).toString('hex');
  const beacon = Buffer.from(s.beacon, 'hex');

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
  const _K = s.genesis.survey?.k ?? 0;
  for (let _i = 0; _i < s.markers.length; _i++)
    if (s.tick - (s.markers[_i].bornAt ?? s.tick) > MARKER_LIFE) s.markers[_i] = surveyMarker(s, _ctx, _i, 'life');
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
    if (s.tick < (_n.fuelUntil ?? 0)) { const _k = s.players[_n.by]; if (_k && _k.hp > 0) _k.skills.firemaking += _wt.burnXp; }
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
  for (const m of Object.values(s.mobs)) {
    if (m.hp <= 0 && m.respawnAt <= s.tick) {
      m.hp = MOB_STATS[m.type].maxHp;
      m.x = m.hx; m.y = m.hy; // the dead come back where they belong
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
          const senses = st.aggro ?? 0;
          // §6ac: she answers her own opponent and nobody else
          if (st.mirrors) { if (m.bound !== pid) continue; }
          const wants = (m.mad === pid && d <= senses)
            || (st.aggro && d <= st.aggro && HUNTS_HERE(m.x, m.y));
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

      // IN REACH? Claws are adjacent. A breath carries.
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
        const every = canBreathe ? (st.breathEvery ?? st.every ?? 2) : (st.every ?? 2);
        if (s.tick - (m.lastSwing ?? -64) < every) continue;
        m.lastSwing = s.tick;
        // §6z: a harmless creature swings and never lands, and teaches no
        // defence for it. Risk is the only thing that trains that skill.
        if (st.harmless) continue;
        const defLvl = effLevel(target.skills.defence);
        // mirrored: her accuracy is the citizen's own attack against their own
        // defence, which is what makes it a coin flip decided by supplies
        const useAtk = st.mirrors ? effLevel(target.skills.attack) : st.atk;
        const Tm = clamp(128 + 4 * (useAtk - defLvl), 16, 240);
        if (st.mirrors && mirrorReach > 1 && best > 1 && m.quiver !== undefined) m.quiver -= 1;
        if (roll(beacon, mid, 'mobatk') < Tm) {
          // §6x: armour turns a blow aside, and a breath goes round it. Fire
          // does not care how much steel is between it and you.
          const soak = canBreathe ? 0
            : (target.equipment.head ? SOAK(target.equipment.head.item) : 0)
            + (target.equipment.body ? SOAK(target.equipment.body.item) : 0);
          const hit = canBreathe ? (st.breathHit ?? st.maxHit)
                    : (mirrorHit !== null ? mirrorHit : st.maxHit);
          target.hp -= Math.max(1, 1 + (roll(beacon, mid, 'mobdmg') % hit) - soak);
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
            target.inventory = Array(INV_SLOTS).fill(null);
            target.equipment = { weapon: null, head: null, body: null };
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
          target.skills.defence += 4;
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
        if (Math.max(Math.abs(nx - m.hx), Math.abs(ny - m.hy)) > range + 6) continue;
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
      // §6w: an archived citizen takes their pack with them, so the bow goes
      // home rather than out of the world for as long as they stay away
      if (_carriesBow(subj)) { s.bowOut = false; announce(s, 'The DRAGONBOW has gone back to the Wilds.'); }
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
    if (p) { // spec 2k: attune to a waystone you stand beside, the road remembers who walked it
      for (const nid of adjacentNodeIdsInOrder(s, _ctx, p, 'waystone')) {
        if (!p.attuned) p.attuned = [];
        if (!p.attuned.includes(nid)) p.attuned.push(nid);
      }
    }
    if (inp.type === 'move') {
      if ((p.rootedUntil ?? 0) <= s.tick) { p.x += inp.dx; p.y += inp.dy; } // rooted: held in place by the star-dagger
      p.action = null;
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
      p.action = (p.action?.type === 'attack' && p.action.mobId === inp.mobId)
        ? p.action
        : { type: 'attack', mobId: inp.mobId, since: s.tick };
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
        const slot = firstFreeSlot(p.inventory);
        if (slot !== -1) p.inventory[slot] = { item: inp.recipe, qty: 1 };
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
      if (sl && EQUIPPABLE.has(sl.item)) {
        const g = slotOf(sl.item);
        const cur = p.equipment[g];
        p.equipment[g] = sl;
        p.inventory[inp.slot] = cur;
      }
    } else if (inp.type === 'buy') {
      // v0.74: the keeper's own goods are made from nothing and priced by the
      // constitution. Everything else on the shelf was put there by a citizen,
      // and costs the ask: what its seller was paid, plus the keeper's cut.
      const st = findAdjacentNode(s, _ctx, p, 'store');
      const own = inp.item in STORE_SELLS;
      const onShelf = (st?.shelf?.[inp.item] ?? 0) > 0;
      const price = own ? STORE_SELLS[inp.item] : onShelf ? storeAsk(inp.item) : 0;
      if (st && price && (own || onShelf) && (p.gold ?? 0) >= price) {
        if (addItem(p.inventory, inp.item, 1)) {
          p.gold -= price;
          // goods from the shelf LEAVE the shelf. The keeper's own do not:
          // seeds are made, not stocked.
          if (!own && st.shelf) {
            st.shelf[inp.item] -= 1;
            if (st.shelf[inp.item] <= 0) delete st.shelf[inp.item];
            if (Object.keys(st.shelf).length === 0) delete st.shelf;
          }
        }
      }
    } else if (inp.type === 'attackp') {
      const q = s.players[inp.targetId];
      if (q && q.hp > 0 && inWilds(s.genesis, p.x, p.y) && inWilds(s.genesis, q.x, q.y)) {
        // repeating an order you are already carrying out changes nothing:
        // the rhythm belongs to the fight, not to how often you ask for it
        p.action = (p.action?.type === 'attackp' && p.action.targetId === inp.targetId)
          ? p.action
          : { type: 'attackp', targetId: inp.targetId, since: s.tick };
        // the Brand (v0.41): striking one who was not striking you is
        // worn openly. Windows paint it as they wish; the state is law.
        const q3 = s.players[inp.targetId];
        if (q3 && !(q3.action?.type === 'attackp' && q3.action.targetId === pid))
          p.brandedUntil = s.tick + BRAND_TICKS;
      }
    } else if (inp.type === 'plant') {
      const sl = p.inventory[inp.slot];
      const plot = findAdjacentNode(s, _ctx, p, 'plot', n => !n.plantedAt);
      if (sl?.item === 'seeds' && plot) {
        sl.qty = (sl.qty ?? 1) - 1;
        if (sl.qty <= 0) p.inventory[inp.slot] = null;
        plot.plantedAt = s.tick;
        plot.by = pid;
        p.skills.farming += 10;
      }
    } else if (inp.type === 'harvest') {
      const n = s.nodes[inp.nodeId];
      if (n?.type === 'plot' && n.plantedAt > 0 && n.by === pid
        && (s.tick - n.plantedAt) >= GROW_TICKS_RIPE && adjacent(p, n)) {
        const ex = p.inventory.findIndex(s2 => s2?.item === 'grain');
        const slot = firstFreeSlot(p.inventory);
        if (ex !== -1) p.inventory[ex].qty += 2;
        else if (slot !== -1) p.inventory[slot] = { item: 'grain', qty: 2 };
        else { continue; }
        n.plantedAt = 0;
        delete n.by;
        p.skills.farming += 40;
      }
    } else if (inp.type === 'sell') {
      const sl = p.inventory[inp.slot];
      const nearStore = hasAdjacentNode(s, _ctx, p, 'store');
      if (sl && PRICES[sl.item] && nearStore) {
        p.gold = (p.gold ?? 0) + PRICES[sl.item] * (sl.qty ?? 1);
        // v0.74: onto THIS store's shelf, not into nothing. Beyond the cap the
        // keeper still pays but the goods are lost: a shelf is finite, and
        // consensus state is held by every node forever.
        const st = findAdjacentNode(s, _ctx, p, 'store');
        if (st) {
          if (!st.shelf) st.shelf = {};
          const have = st.shelf[sl.item] ?? 0;
          st.shelf[sl.item] = Math.min(SHELF_CAP, have + (sl.qty ?? 1));
        }
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
        p.skills.magic += 60; // v0.80 parity retune: the chain now pays like a trade
        if (claimFirst(s, 'sigil', pid)) announce(s, (p.name ?? pid.slice(0, 6)) + ' is the FIRST to press three stones into a sigil.');
      }
    } else if (inp.type === 'still') {
      // consume three sigils; the truce binds all parties, its speaker first
      let burned = 0;
      for (let i2 = 0; i2 < p.inventory.length && burned < 3; i2++)
        if (p.inventory[i2]?.item === 'sigil') { p.inventory[i2] = null; burned++; }
      const t9 = s.mobs[inp.target] ?? s.players[inp.target];
      if (t9) {
        t9.stilledUntil = s.tick + 6;
        t9.stillImmuneUntil = s.tick + 6 + 15;
        if (t9.action !== undefined) t9.action = null; // a player mid-swing is stilled mid-swing
      }
      p.stillCdUntil = s.tick + 150;
      p.action = null; // the speaker is bound first
      p.skills.magic += 150;
      if (claimFirst(s, 'still', pid)) announce(s, (p.name ?? pid.slice(0, 6)) + ' speaks the FIRST stilling. The fight simply stops.');
    } else if (inp.type === 'cast') {
      const si = p.inventory.findIndex(sl => sl?.item === 'sigil');
      if (inp.spell === 'mend' && si !== -1) {
        p.inventory[si] = null;
        p.hp = Math.min(effLevel(p.skills.hitpoints), p.hp + 20); // v0.41: a strong heal (+20), not a full reset, keeps mend premium without making sigil-stackers unkillable
        p.skills.magic += 55; // v0.80 parity retune
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
        p.skills.magic += 35; // v0.80 parity retune
      }
    } else if (inp.type === 'survey') {
      const mi = (s.markers ?? []).findIndex(m => m.x === p.x && m.y === p.y);
      if (mi !== -1) {
        const m = s.markers[mi], anchor = spawnOf(s.genesis), sv = s.genesis.survey;
        const d = Math.max(Math.abs(m.x - anchor.x), Math.abs(m.y - anchor.y));
        p.skills.exploration += Math.min(sv.max, sv.base + sv.perTile * d); // paid in distance
        if (m.kind === 'ws' && m.ws && s.nodes[m.ws]?.type === 'waystone') { // a rumor: hand over the chart
          const chart = CHART_PREFIX + m.ws, free = p.inventory.findIndex(x => x === null);
          if (free !== -1 && !(p.attuned ?? []).includes(m.ws) && !p.inventory.some(x => x?.item === chart))
            p.inventory[free] = { item: chart, qty: 1 };
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
      const sl = p.inventory[inp.slot];
      if (sl && isChart(sl.item)) {
        const wid = sl.item.slice(CHART_PREFIX.length);
        if (s.nodes[wid]?.type === 'waystone') { // the chart's knowledge becomes YOUR attunement
          if (!p.attuned) p.attuned = [];
          if (!p.attuned.includes(wid)) p.attuned.push(wid);
        }
        p.inventory[inp.slot] = null; // spent
      }
    } else if (inp.type === 'build_brewpot') {
      const bc = s.genesis.brew;
      const free = !nodeExistsAt(s, _ctx, p.x, p.y);
      const nearHouse = hasAdjacentNode(s, _ctx, p, 'house');
      const owned = brewpotsOwnedBy(s, _ctx, pid);
      if (bc && free && nearHouse && owned < bc.potCap && countLogs(p.inventory) >= bc.buildLogs && countItem(p.inventory, 'ore') >= bc.buildOre) {
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
        bp.brewKind = sl.item === 'grain' ? 'ale' : 'broth';
        bp.readyAt = s.tick + s.genesis.brew.ferment; bp.lastUsed = s.tick; // the world does the waiting (spec 8)
      }
    } else if (inp.type === 'collect') {
      const bp = s.nodes[inp.nodeId];
      if (bp && bp.type === 'brewpot' && bp.by === pid && atOrBeside(p, bp) && bp.readyAt !== undefined && s.tick >= bp.readyAt && canAddItem(p.inventory, bp.brewKind)) {
        addItem(p.inventory, bp.brewKind, 1);
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
      if (wf && wf.type === 'watchfire' && atOrBeside(p, wf) && sl && isLog(sl.item) && wt
          && (wf.fuelUntil ?? 0) < s.tick + wt.cap) {
        removeItem(p.inventory, inp.slot, 1);
        // fuel banks forward from whichever is later: now, or the fire's remaining burn
        wf.fuelUntil = Math.min(Math.max(wf.fuelUntil ?? 0, s.tick) + wt.perLog, s.tick + wt.cap);
        p.skills.firemaking += wt.xpPerLog; // the feeder earns, even at another's fire
      }
    } else if (inp.type === 'fletch') {
      const sl = p.inventory[inp.slot];
      if (sl && inp.make === 'bow' && isLog(sl.item)) {
        p.inventory[inp.slot] = { item: 'wooden-bow', qty: 1 };
        p.skills.fletching += 15;
      } else if (sl && inp.make === 'arrows' && sl.item === 'bones') {
        const ex = p.inventory.findIndex((s2, i2) => s2?.item === 'arrows' && i2 !== inp.slot);
        p.inventory[inp.slot] = null;
        if (ex !== -1) p.inventory[ex].qty += 5;                    // the quiver (6n)
        else p.inventory[inp.slot] = { item: 'arrows', qty: 5 };
        p.skills.fletching += 5;
      }
    } else if (inp.type === 'unwield') {
      const g = ['weapon', 'head', 'body'].includes(inp.gear) ? inp.gear : 'weapon';
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
        p.lightsTried = (p.lightsTried ?? 0) + 1; // the tally, not the dice
        if (countedSuccess(p.lightsTried, Math.min(64 + 2 * lvl, 240))) {
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
      if (sl && sl.item === 'bones') {
        p.inventory[inp.slot] = null;
        p.skills.prayer += XP_BURY;
      }
    } else if (inp.type === 'deposit') {
      const sl = p.inventory[inp.slot];
      const nearBank = hasAdjacentNode(s, _ctx, p, 'bank');
      if (sl && nearBank) {
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
      if (onTile && ex !== -1) {                       // the quiver (6n): arrows pool
        p.inventory[ex].qty += g2.qty ?? 1;
        delete s.ground[inp.groundId];
      } else if (onTile && slot !== -1) {
        p.inventory[slot] = { item: g2.item, qty: g2.qty ?? 1 }; // the whole stack, not one of it
        delete s.ground[inp.groundId];
      }
    } else if (inp.type === 'eat') {
      const slot = p.inventory[inp.slot];
      const heal = !slot ? 0 : healOf(slot.item);
      if (heal > 0 && s.tick - (p.lastAte ?? -EAT_EVERY) >= EAT_EVERY) {
        p.lastAte = s.tick;
        removeItem(p.inventory, inp.slot, 1); // stackable brews draw from the stack; a fish clears its slot
        p.hp = Math.min(p.hp + heal, effLevel(p.skills.hitpoints));
        // v0.32 (spec 6m): eating does not lower your guard; the fight holds
      }
    } else if (inp.type === 'cook') {
      // re-check against new state; instant, same-tick resolution (§6a)
      const slot = p.inventory[inp.slot];
      const nearFire = hasAdjacentNode(s, _ctx, p, _FIRE_TYPES) || fireOnTile(s, _ctx, p.x, p.y); // v0.80: the tile underfoot counts, exactly as the validator says
      if (slot && isRawFood(slot.item) && nearFire) {
        // §6ad: a deep fish asks for a cook to match the fisher who caught it.
        // Below eighty it burns every time -- not a gamble, a refusal.
        const deep = slot.item === 'deep-fish';
        const lvl = effLevel(p.skills.cooking);
        p.cooksTried = (p.cooksTried ?? 0) + 1; // the pan counts; it does not gamble
        const able = !deep || lvl >= COOK_DEEP_REQ;
        if (able && countedSuccess(p.cooksTried, Math.min(64 + 2 * lvl, 240))) {
          p.inventory[inp.slot] = { item: deep ? 'cooked-deep-fish' : 'cooked-fish', qty: 1 };
          p.skills.cooking += deep ? XP_COOK_DEEP : XP_COOK;
        } else {
          p.inventory[inp.slot] = { item: deep ? 'burnt-deep-fish' : 'burnt-fish', qty: 1 };
        }
      }
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
  // resolve ongoing actions (spec §6, §6b), canonical order
  for (const pid of Object.keys(s.players).sort()) {
    const p = s.players[pid];
    if (!p.action) continue;

    if (p.action.type === 'attackp') {
      const q = s.players[p.action.targetId];
      if (q && ((q.stilledUntil ?? 0) > s.tick || (p.stilledUntil ?? 0) > s.tick)) { p.action = null; continue; } // the truce ends the fight (v0.80)
      const both = q && q.hp > 0 && inWilds(s.genesis, p.x, p.y) && inWilds(s.genesis, q.x, q.y);
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
        && p.inventory.some((sl) => sl?.item === 'arrows');
      const near = both && (inReach(p, q) || bowHeld);
      if (!near) { p.action = null; }
      else if (s.tick - (p.lastSwing ?? -64) < (weaponOf(p)?.every ?? 2)) {
        /* combat breathes (6m, 2b-iii): the arm has not recovered, and turning
           to a different foe does not give it back. The chain never rests (6r). */ }
      else {
        p.lastSwing = s.tick; // the arm is spent, whoever it was spent on
        const bowDrawn2 = drawnAt(p, q);
        let lvl2, tag2;
        if (bowDrawn2) {
          const aSlot = p.inventory.findIndex(sl => sl?.item === 'arrows');
          if (aSlot === -1) { p.action = null; continue; }
          // alternate per DRAW, not per tick. `s.tick % 2` was in lockstep with the
        // bow's own `every: 2` cadence -- it only ever loosed on ticks of one
        // parity, so the test either always spared the arrow or never did. It
        // spent NOTHING over a hundred ticks of shooting. The swing ordinal is
        // what alternates.
        if (!(weaponOf(p)?.thrift === true
              && Math.floor(s.tick / (weaponOf(p)?.every ?? 2)) % 2 === 1)) {   // §6y
            p.inventory[aSlot].qty -= 1;
            if (p.inventory[aSlot].qty <= 0) p.inventory[aSlot] = null;
          }
          lvl2 = effLevel(p.skills.ranged); tag2 = 'ranged';
        } else { lvl2 = effLevel(p.skills.attack); tag2 = 'attack'; }
        const defL = effLevel(q.skills.defence);
        const Tp = clamp(128 + 4 * (lvl2 - defL) + (weaponOf(p)?.acc ?? 0), 16, 240);
        if (roll(beacon, pid, 'atk') < Tp) {
          const maxHit = 1 + Math.floor(lvl2 / (bowDrawn2 ? 12 : 10))
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
          const pierces = weaponOf(p)?.pierces === true;
          const soak = pierces ? 0
            : (q.equipment.head ? SOAK(q.equipment.head.item) : 0)
            + (q.equipment.body ? SOAK(q.equipment.body.item) : 0);
          const dmg = Math.max(0, 1 + (roll(beacon, pid, 'dmg') % maxHit) - soak);
          q.hp -= dmg;
          p.skills[tag2] += 4 * dmg;
          p.skills.hitpoints += dmg;
          if (q.hp > 0 && p.equipment.weapon?.item === 'star-dagger'
              && (p.rootCdUntil ?? 0) <= s.tick && (q.rootedUntil ?? 0) <= s.tick && (q.rootImmuneUntil ?? 0) <= s.tick) {
            q.rootedUntil = s.tick + ROOT_TICKS;                 // held fast
            q.rootImmuneUntil = s.tick + ROOT_TICKS + ROOT_IMMUNE; // then briefly unfreezable
            p.rootCdUntil = s.tick + ROOT_CD;                    // the dagger sleeps a long while
          }
          if (q.hp > 0 && q.action?.type !== 'attackp' && q.action?.type !== 'attack') {
            q.action = { type: 'attackp', targetId: pid, since: s.tick + 1 }; // struck: strikes back
          }
          if (q.hp <= 0) {
            q.hp = 0; // a killing blow that overshoots still leaves a body at nought (v0.53)
            // slain in the Wilds (spec 2g): the pack spills where they fall,
            // and the body lies beside it awhile (v0.41)
            for (const sl of q.inventory) if (sl) {
              s.ground['g' + s.tick + '-' + Object.keys(s.ground).length] =
                { item: sl.item, qty: sl.qty ?? 1, x: q.x, y: q.y, expiresAt: s.tick + 100 };
            }
            q.inventory = q.inventory.map(() => null);
            q.equipment = { weapon: null, head: null, body: null };
            q.action = null; q.trade = null;
            q.deadUntil = s.tick + DEATH_TICKS;
          }
        }
      }
      continue;
    }
    if (p.action.type === 'attack') {
      const m = s.mobs[p.action.mobId];
      const stats = m && MOB_STATS[m.type];
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
      const every = weaponOf(p)?.every ?? 2;
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
        const aSlot = p.inventory.findIndex(sl => sl?.item === 'arrows');
        if (aSlot === -1) { p.action = null; continue; }
        // alternate per DRAW, not per tick. `s.tick % 2` was in lockstep with the
        // bow's own `every: 2` cadence -- it only ever loosed on ticks of one
        // parity, so the test either always spared the arrow or never did. It
        // spent NOTHING over a hundred ticks of shooting. The swing ordinal is
        // what alternates.
        if (!(weaponOf(p)?.thrift === true
              && Math.floor(s.tick / (weaponOf(p)?.every ?? 2)) % 2 === 1)) {
          p.inventory[aSlot].qty -= 1;
          if (p.inventory[aSlot].qty <= 0) p.inventory[aSlot] = null;
        }
        const rLvl = effLevel(p.skills.ranged);
        const Tr = clamp(128 + 4 * (rLvl - stats.def) + (weaponOf(p)?.acc ?? 0), 16, 240);
        if (roll(beacon, pid, 'atk') < Tr) {
          const maxHit = 1 + Math.floor(rLvl / 12) + (weaponOf(p)?.hit ?? 0);
          const dmg = 1 + (roll(beacon, pid, 'dmg') % maxHit);
          m.hp -= dmg;
          p.skills.ranged += 4 * dmg;
          p.skills.hitpoints += dmg;
        }
      } else {
      const atkLvl = effLevel(p.skills.attack);
      const T = clamp(128 + 4 * (atkLvl - stats.def) + (weaponOf(p)?.acc ?? 0), 16, 240);
      if (roll(beacon, pid, 'atk') < T) {
        const maxHit = 1 + Math.floor(atkLvl / 10) + (weaponOf(p)?.hit ?? 0);
        const dmg = 1 + (roll(beacon, pid, 'dmg') % maxHit);
        m.hp -= dmg;
        p.skills.attack += 4 * dmg;
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
          s.ground[gid] = { item: d.item, x: m.x, y: m.y, expiresAt: s.tick + 100 };
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
          announce(s, (p.name ?? pid.slice(0, 6)) + ' has taken the DRAGONBOW. There is only one.');
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
    const toolBonus = p.equipment.weapon?.item === TOOL_FOR[n.type] ? 24 : 0;
    const threshold = Math.min(64 + 2 * lvl + toolBonus, 240);
    const r = roll(beacon, pid, 'gather');

    if (r < threshold) {
      // §6ad: THE SAME TREE, THE SAME WATER, A DIFFERENT CATCH.
      //
      // At ninety a master takes heartwood from the trees and the deep fish
      // from the shallows, INSTEAD of the ordinary yield rather than as well
      // as it. Replacement rather than addition, which costs no new node and
      // no new spot -- and it leaves the cheap end of both markets to the
      // people who still need it, because a master can no longer supply it.
      let got = y.item;
      if (y.item === 'logs' && lvl >= 90) got = 'heartwood';
      else if (y.item === 'raw-fish' && lvl >= 90) got = 'deep-fish';
      p.inventory[slot] = { item: got, qty: 1 };
      p.skills[y.skill] += y.xp;
      n.depletedUntil = s.tick + DEPLETE_TICKS;
    }
  }

  _p2mark('beacon');
  // tomorrow's lots, drawn from today's deeds (spec 7, v0.38)
  s.beacon = delayChain(beacon, inputsDigest(inputs)).toString('hex');
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
    nodeExistsAt, blockingNodeAt, hasAdjacentNode, findAdjacentNode,
    adjacentNodeIdsInOrder, waystoneIdsSorted, brewpotsOwnedBy,
    validInput,
  },
  signPayload, verifyPayload,
  exportIdentity, importIdentity, loadOrCreateIdentity,
  canonical, EMPTY_ROOT, SMT_DEPTH,
  normaliseSource, engineHashOf, declareEngine, engineHash,
  SLEEP_AFTER, isAwake, effLevel, standingOf, callingOf, CALLINGS, countedSuccess, validateState, validateGenesis, validateImports, validateInputShape, normalizeInput, slotOf, supportsWorldGenerator, minQuorumFor, maxByzantine, byzantineSafe, initCrypto, SKILLS, EQUIP_SLOTS, NODE_TYPES, INV_SLOTS, ITEMS, isValidName, cityRectOf, norwickRectOf, wildsRectOf, inCity, PRICES, inWilds, spawnOf, makeGenesis, newWorld, sameWorld, addPlayer, addNode, addMob, nextState, MOB_STATS, RECIPES, EQUIPPABLE,
};
