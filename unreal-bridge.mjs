// unreal-bridge.mjs — the Unreal window's half that lives in JavaScript.
//
// WHY THIS FILE EXISTS AT ALL, rather than a C++ reimplementation inside the
// engine plugin: terrain-mirror.mjs opens by explaining that the geography
// used to exist three times, and that two of the copies had already drifted
// before anything noticed. check-window-*.mjs exists for the same reason on
// the table side. A fourth copy of the mirror written in C++ would be the
// worst one yet, because the harness that catches drift cannot read it.
//
// So Unreal is given NO gameplay knowledge whatsoever. It does not know what
// a trail costs, where the Fens end, what a quick-javelin's reach is, or how
// to sign anything. It receives tiles and entities and it draws them; it
// sends intents back as nouns. Every table it needs arrives at runtime from
// /api/tables, every tile from terrain-mirror.mjs, and every signature from
// engine.js. A window that cannot hold a stale copy cannot drift into breach.
//
// Layering, in the terms sdk.mjs already uses: this is layer 2.5. The pillar
// is layer 1, this process speaks its WS protocol as an adopted external key
// exactly as window-photo.html does, and Unreal is layer 3 — pixels only.
//
//   node unreal-bridge.mjs --pillar https://interval.place --port 7777
//
// The key is minted locally and written to --key (default ./unreal-key.json).
// It is the citizen. Copy it between machines and you are the same soul in
// another vessel; lose it and that citizen is gone, same as any other window.

import fs from 'node:fs'
// pbcopy and pbpaste, which are how a citizen crosses from the browser to
// here without the key ever passing through Unreal. See `carry-out` below.
import { execFileSync } from 'node:child_process'
import { nodeHost } from './host-node.mjs'
import * as TM from './terrain-mirror.mjs'
import { generatorFor } from './worldgen-any.mjs'
// THE RIDGE PREDICATE, softly. It belongs to expanse7; a bridge onto some
// other world should lose the ridge, not fall over. See `ridge` in the
// terrain chunk below.
let _onRidge = null
try { ({ onRidge: _onRidge } = await import('./worldgen-expanse7.mjs')) } catch { _onRidge = null }
import { applyTick, evictOutside, zonesAround } from './view.mjs'
// THE SKY IS ARITHMETIC ON THE INTERVAL COUNT, and it already exists. It is
// imported here rather than reimplemented for the same reason the terrain is:
// two transcriptions of one ladder is how window-3d's mirror fell thirteen
// nouns behind. A window that computed its own weather would be a window
// where it rains when nobody else is getting wet.
import { skyAt } from './sky.mjs'

// ---------- the machine underneath ----------
//
// EVERYTHING THIS FILE KNOWS ABOUT NODE IS NOW IN ONE OBJECT, and the list is
// six entries long: a setting, a file's text, the citizen's key, a socket out,
// a door in, a clock. Everything else here -- what a tile is made of, what a
// verb needs, which deeds may be offered, where the land lies -- is world
// knowledge and is about nothing but the world.
//
// That is not tidiness. On iOS there can be no Node process beside the app, so
// the bridge has to run inside it, in the JavaScript engine the phone already
// has; and this file is exactly as portable as that list is short. The rules
// and the whole landscape are already proven to run there -- see
// portable/README.md, where `expanse7`'s roads come out tile for tile the same
// in JavaScriptCore as on a node. A host that is not Node installs itself as
// `globalThis.__intervalHost` before this file is loaded.
const HOST = globalThis.__intervalHost ?? nodeHost()

// ---- THE RULES, ASKED OF THE HOST ----
//
// This was `createRequire(import.meta.url)('./engine.js')`, which is the last
// thing in the file that could only be Node: `createRequire` is a Node builtin
// and `import.meta.url` is a path on a disk, and a phone has neither. The host
// hands the engine over instead -- on a desktop by requiring it, in an app by
// evaluating the source out of the bundle, which is what `portable/boot.mjs`
// already does and what keeps the world's identity intact: the bytes are
// compiled as they are and their SHA is what a founding records.
const E = HOST.engine()

// ---------- arguments ----------
const arg = (name, dflt) => HOST.option(name, dflt)
const PILLAR = (arg('pillar', 'http://localhost:8080')).replace(/\/+$/, '')
const PORT = +arg('port', 7777)
const KEYFILE = arg('key', './unreal-key.json')

// ---------- the citizen ----------
// Held here, never sent anywhere, never given to Unreal. The engine plugin
// has no way to sign, which means a compromised .uproject cannot act as you.
function loadIdentity () {
  const j = HOST.readKey(KEYFILE)
  if (j) {
    return { playerId: j.playerId, privateKey: Uint8Array.from(Buffer.from(j.privateKey, 'hex')) }
  }
  const id = E.generateIdentity()
  HOST.writeKey(KEYFILE, {
    playerId: id.playerId,
    privateKey: Buffer.from(id.privateKey).toString('hex'),
    note: 'THIS FILE IS THE CITIZEN. Back it up; do not commit it.',
  })
  console.log('[bridge] minted a new citizen -> ' + KEYFILE)
  return id
}
const ID = loadIdentity()
console.log('[bridge] citizen ' + ID.playerId.slice(0, 12) + '…')

// ---------- what the world says about itself ----------
const getJson = async (p) => {
  const r = await fetch(PILLAR + p)
  if (!r.ok) throw new Error(p + ' -> ' + r.status)
  return r.json()
}

const boot = {}
async function announceWorld () {
  const [g, tables, settlements, roads, world] = await Promise.all([
    getJson('/api/genesis'), getJson('/api/tables'),
    getJson('/api/settlements').catch(() => ({ settlements: [] })),
    getJson('/api/roads').catch(() => ({ tiles: [] })),
    getJson('/api/world'),
  ])
  const G = g.genesis
  GG = G
  // Refuses loudly rather than growing a different island and calling it this
  // one -- the same refusal worldgen-any makes for a node that cannot build a
  // founding it has been handed.
  GEN = generatorFor(G)
  // The tiles the founder LAID, not a re-derivation of them. A window that
  // re-derives the road network draws a wheel with no rim (worldgen-any.mjs,
  // §roadDataOf), and this one has been told.
  ROADS = new Set((roads.tiles ?? []).map(String))
  // configure() drops every memo, so a bridge that is pointed at a second
  // world cannot show it the first one's roads (terrain-mirror.mjs, §configure)
  //
  // The mirror no longer answers for terrain here, but it still answers for
  // region names, and it was never being told where the towns actually are --
  // so it was guessing seats with its own simplified dry-spiral while the
  // pillar was serving the real ones. Seating is the ONE thing v7 changed.
  TM.configure({
    generator: G.worldGenerator ?? 'interval-classic-v1',
    seed: G.genesisSeed ?? '', worldW: G.worldW, worldH: G.worldH,
    settlements: settlements.settlements ?? [],
  })
  SCHEMA = verbTargets()
  Object.assign(boot, {
    worldId: world.worldId, genesis: G, tables,
    settlements: settlements.settlements ?? [], roads,
    tickMs: tables.tickMs, tiles: TILE_NAMES,
    // What each node type affords, so the window can offer it. Derived
    // from the engine at boot -- see `affordances` above.
    affords: (AFFORDS = affordances()),
    // ...and the same for what is in a citizen's pack.
    itemAffords: itemAffordances(),
    // ---- AND WHICH VERBS WANT A LEVEL BEFORE THEY ARE WORTH OFFERING ----
    //
    // A menu shows only what is possible. Most of that is settled by whether
    // the citizen is holding the thing or standing beside it; a few verbs add
    // a craft level on top, and the line is a lie for everybody below it.
    //
    // ONE TABLE, READ OUT OF THE ENGINE, because the number is the world's and
    // not the window's -- the same way the two spell ranges are read. A
    // founding that moves the bar moves the menu with it.
    verbNeeds: verbLevels(),
    // ---- AND WHICH ITEMS WANT A LEVEL BEFORE THEY CAN BE TAKEN UP ----
    //
    // The same rule as `verbNeeds`, asked per ITEM rather than per verb,
    // because that is how the world asks it: `WIELD_REQS` is a table of item
    // to skill to level, and `wield` itself has no bar at all. A citizen with
    // prowess 1 who finds the old chain -- which is the rarest drop in the
    // world -- was offered "wield old chain" and the world said nothing back.
    // Two of the three most valuable things a citizen can own are behind this
    // table, so the line it makes a lie of is exactly the line somebody would
    // most want to be true.
    //
    // READ OUT OF THE ENGINE, never copied: the engine exports WIELD_REQS and
    // a founding that moves the bar moves the menu with it.
    wieldNeeds: E.WIELD_REQS ?? {},
    // ...and, for the verbs that take a choice as well as a slot, what the
    // choices are. `fletch` is the only one today; `buy` and `smith` have
    // their own lists further down for the same reason.
    itemMakes: itemMakes(),
    // AND WHICH TARGET FIELD EACH VERB WILL ACCEPT.
    //
    // The window names its target in the field the world's schema asks for --
    // `nodeId` for a node, `mobId` for a beast, `targetId` for a citizen --
    // and for a long while it named one for EVERY verb. Most verbs take one,
    // so most worked. `drink` does not: a citizen drinks from whichever well
    // they are standing beside, and the world names no well in the deed. The
    // deed came back "unknown field nodeId on drink" and the well did nothing,
    // from a menu entry that had offered `drink well` a moment before.
    //
    // So the schema says. A verb absent from this map takes no target at all.
    verbTakes: SCHEMA.target,
    // Every field each verb's schema names, so the window can decline to
    // offer a deed it has no way to fill in. See the note in verbTargets.
    verbFields: SCHEMA.fields,
    // WHAT A CITIZEN MAY SWEAR THEMSELVES TO, and what it is sworn on.
    //
    // A calling is the one thing in this world a citizen chooses about
    // themselves that the world then remembers for ever, and `swear` names it
    // by word -- so the window has to offer the words, the same way a stall
    // has to offer its goods. The skill each one rests on travels with it,
    // because a window that listed all seventeen would be offering fifteen
    // rows that are refused: the oath asks for fifty in the craft.
    callings: Object.fromEntries(Object.entries(E.SWORN ?? {})
      .map(([name, c]) => [name, c.skill])),
    swearLevel: E.SWEAR_LEVEL ?? 50,
    // AND WHAT A NAME COSTS. §5a: names are scarce and permanent -- there is
    // one of each, for ever -- so the world asks for standing before it will
    // take one. A window that showed the line to everybody would be showing
    // most citizens a box that cannot work; one that knows the price can say
    // what to work toward instead.
    nameStanding: 50,
    // AND HOW LONG A STINT MAY BE SWORN FOR, from the founding rather than
    // from a number written here: a world without `stint` has no such oath at
    // all, and its window should offer none.
    stintCap: Number(G?.stint?.cap) || 0,
    // AND WHAT EACH KIND OF STALL SELLS, WITH ITS PRICE.
    //
    // `buy` takes the NAME of a thing, not the stall: a citizen says what
    // they want, and the world finds the counter they are standing at. So a
    // menu row reading just "buy" is a deed with no item in it, which the
    // world refuses -- the window has to offer the goods. This is the
    // engine's own table, so a founding that stocks a stall differently
    // needs no change here and no build.
    stallSells: E.STALL_SELLS ?? {},
    // §7cf: WHAT EACH BOOK HOLDS, read out of the engine's own table.
    //
    // The window carried a hand-written copy of both books so it could draw
    // the spell list, which is precisely the drift the engine warns about
    // where `speaks` is defined: the gate lives in ONE table so that six call
    // sites cannot disagree, and a seventh copy in another language across a
    // socket is the same mistake with more steps.
    //
    // It also lets the window gate the spells that take a target: `seal` and
    // `unmake` act on a thing lying on the ground, and offering them to a
    // citizen whose book does not hold them is a row that is refused.
    books: (BOOKS_HELD = (() => {
      try {
        const src = HOST.source('engine.js')
        const at = src.indexOf('const BOOKS = {')
        const end = src.indexOf('};', at)
        const out = {}
        for (const m of src.slice(at, end).matchAll(/(\w+):\s*new Set\(\[([^\]]*)\]/g)) {
          out[m[1]] = [...m[2].matchAll(/'([a-z_]+)'/g)].map((w) => w[1])
        }
        return out
      } catch { return {} }
    })()),
    // §6dj: THE HEIGHT OF THE LAND, as the generator itself computed it.
    //
    // The window drew the island as a plane with a hand's breadth of jitter,
    // and the honest answer to "do we have terrain" was no. It was the wrong
    // answer about the WORLD: this field exists, it is two octaves on a
    // thirty-two and an eight tile lattice, and it routed every road on the
    // island -- a road here was laid to follow a slope, charging six for each
    // unit a step climbs. Hills invented by the window would have been in
    // different places from the hills the roads bend around.
    //
    // Served on a four-tile lattice because the finest octave is eight tiles
    // wide, so interpolating between samples reproduces it exactly. Twenty-nine
    // thousand bytes for the whole island, sent once.
    //
    // It changes no tile's walkability and enters no geography hash. Whether a
    // step should COST what it climbs is a question for the spec; this is a
    // window being allowed to draw the land as it lies.
    elev: (() => {
      try {
        const t = E.TERRAINS?.[G.worldGenerator]
        return t?.elevGrid ? t.elevGrid(G) : null
      } catch { return null }
    })(),
    // AND WHAT CAN BE MADE, with what. `smith` names a RECIPE, the same way
    // `buy` names an item, so an anvil has to offer its work by name or the
    // deed it files is a forging of nothing. The cost travels with it so a
    // row can say what the work will take -- a player should not have to
    // learn the recipes somewhere else and come back.
    recipes: E.RECIPES ?? {},
  })
  console.log('[bridge] world ' + world.worldId.slice(0, 12) + '… '
    + G.worldW + 'x' + G.worldH + ' ' + (G.worldGenerator ?? 'classic')
    + ', tick ' + world.tick)
}

// ---------- WHAT CAN BE DONE WITH A THING, DERIVED FROM THE ENGINE ----------
//
// The window can file sixty-six of the world's sixty-nine verbs and a PLAYER
// can reach exactly one of them, because there is no way to point at anything.
// Pointing needs an answer to "what can I do with this?", and that answer is
// WORLD KNOWLEDGE -- which lives here, not in Unreal. The window is pixels.
//
// IT IS DERIVED, NOT WRITTEN DOWN. A hand-kept table of "a well affords drink"
// is exactly the kind of copy this project refuses: it is right the day it is
// typed and wrong the day the engine changes. Two sources, both read at boot
// from the engine itself:
//
//   NODE_YIELD and NODE_GATE name every node type that yields something to
//   `gather`, with the skill and the level it wants.
//
//   `hasAdjacentNode(state, ctx, p, 'X')` is how every other verb says which
//   node it must be standing beside -- thirty-one of them. Scanning back from
//   each call to the enclosing `inp.type === '...'` says WHICH verb it was.
//
// A verb that needs no node at all is not in here; those are the ones a player
// reaches from their own pack or from a screen, not by pointing at the world.
// WHICH TARGET FIELD EACH VERB TAKES, read off the engine's own schemas.
//
// `INPUT_SCHEMAS` is not exported, so it is read from the source the same way
// the affordances are -- the alternative is a table kept by hand, which is
// right the day it is typed and wrong the day the engine changes.
let SCHEMA = { target: {}, fields: {} }
// The affordance table, kept after it is announced: the frame needs it every
// interval to say what the ground a citizen is standing on can be used for.
let AFFORDS = {}
// The spellbooks, kept after they are announced: the frame needs them to say
// which spells may be cast at a body.
let BOOKS_HELD = {}

function verbTargets () {
  const src = HOST.source('engine.js')
  const head = src.indexOf('const INPUT_SCHEMAS = {')
  if (head < 0) return {}
  const out = {}
  const fields = {}
  // THE FIELD THAT NAMES THE THING THE DEED IS ABOUT, under every word the
  // schemas use for it. `nodeId` for a node, `mobId` for a beast, `targetId`
  // for a citizen -- and also `to` (teach), `who` (part) and `target`
  // (mendp, still), which are the same idea spelled differently by whoever
  // wrote that line. Leaving them out meant the window could not fill in the
  // deed and so was never offered the verb at all.
  //
  // `target` is deliberately ambiguous -- `still` means a node and `mendp`
  // means a citizen -- and that is fine: which KIND a verb is offered on is
  // decided by the affordance tables, and this only says which word the deed
  // carries once it is.
  const WANTED = ['nodeId', 'mobId', 'targetId', 'subject', 'to', 'who', 'target']
  // A NEW LINE **OR** A COMMA: the table puts two verbs on one line where
  // they take the same thing -- `gather: { nodeId: T.id }, harvest: { nodeId:
  // T.id },` -- and a line-anchored pattern silently sees only the first of
  // each such pair. `harvest` was missing its target that way, which is the
  // sort of hole that shows up as one menu entry in ten doing nothing.
  const re = /(?:\n {2}|,\s*)([A-Za-z_][A-Za-z0-9_]*):\s*\{/g
  re.lastIndex = head
  let m
  while ((m = re.exec(src))) {
    // Balanced braces from the opening one, so an arrow function inside a
    // field's validator does not end the verb early.
    let i = re.lastIndex - 1
    let depth = 0
    let end = i
    for (; i < src.length; i++) {
      if (src[i] === '{') depth++
      else if (src[i] === '}') { depth--; if (depth === 0) { end = i; break } }
    }
    const body = src.slice(re.lastIndex, end)
    // Stop at the end of the whole table: the next top-level const.
    if (/\n(const|function|module\.exports)\b/.test(src.slice(head, m.index))) break
    const takes = WANTED.filter((w) => new RegExp('(^|[^A-Za-z])' + w + '\\s*:').test(body))
    // EVERY field the schema names, not only the target. The window must know
    // what it CANNOT fill: `grave` wants the name to cut, `dedicate` wants who
    // to, `lay` wants what to lay. Offered anyway, those became menu rows that
    // were refused the moment they were clicked -- and, being the only thing a
    // way-post afforded, the DEFAULT one, so an ordinary left click on the
    // ground near a way-post filed a grave instead of a walk. Crossing the
    // island by clicking became a stream of refusals.
    // THE FIRST FIELD IS STILL A FIELD.
    //
    // This anchored each name to a `{` or a `,` before it, or to the very
    // start of the body -- and the body begins with the SPACE after the
    // brace, so position zero never matched a name and the first field of
    // every single schema was dropped. `withdraw { item, qty }` came out as
    // `[qty]`; `claim_name { name }` and `swear { calling }` came out as
    // having no fields at all.
    //
    // Which is worse than a gap in a table, because `CanFile` reads this to
    // decide whether the window can fill a deed in: a verb whose only field
    // was lost looks like a verb that needs nothing, so it is offered bare
    // and refused the instant it is clicked -- "missing field name on
    // claim_name" -- from a menu row that promised otherwise.
    const all = [...body.matchAll(/(?:^\s*|[,{]\s*)([a-z][A-Za-z0-9_]*)\s*:/g)].map((f) => f[1])
    if (takes.length) out[m[1]] = takes
    if (all.length) fields[m[1]] = [...new Set(all)]
  }
  return { target: out, fields }
}

function affordances () {
  const src = HOST.source('engine.js')
  const out = {}
  const add = (type, verb) => { (out[type] ||= new Set()).add(verb) }
  const types = new Set(E.NODE_TYPES)

  // 1. GATHER, from the engine's own yield and gate tables.
  for (const table of [E.NODE_YIELD, E.NODE_GATE]) {
    for (const type of Object.keys(table || {})) add(type, 'gather')
  }

  // 2. EVERY OTHER VERB, by reading its own branch. Each executor branch opens
  //    with `inp.type === 'x'`, so the source cuts cleanly into one block per
  //    verb, and inside a block a node requirement is written one of three
  //    ways -- `hasAdjacentNode(.., 'well')`, `findAdjacentNode(.., 'market')`
  //    or `n.type === 'cart'`. All three are read; anything that is not a real
  //    node type is discarded, which throws away the odd false positive
  //    without needing a list of exceptions.
  // 2a. THE HELPERS THAT HIDE A NODE TYPE INSIDE THEMSELVES.
  //
  // Not every node requirement is written where it can be read. `sail` asks
  // `adjacentFerry(state, ctx, p)` and `deposit` asks `adjacentVaultId(...)`
  // -- one-line functions whose whole body is "the node of type X beside you"
  // -- so the type is a word in a function nobody was reading, and the verb
  // came out affording nothing. A ferry could not be sailed and a vault could
  // not be banked at, from a window that drew both.
  //
  // So the one-type helpers are resolved first: any `function nameOf(...)`
  // whose body names exactly ONE node type becomes a stand-in for that type.
  // Exactly one, because a helper that mentions several is doing something
  // this cannot safely guess at.
  const viaHelper = {}
  for (const m of src.matchAll(/function ([A-Za-z_][A-Za-z0-9_]*)\s*\([^)]*\)\s*\{/g)) {
    let i = m.index + m[0].length - 1
    let depth = 0
    let end = i
    for (; i < src.length; i++) {
      if (src[i] === '{') depth++
      else if (src[i] === '}') { depth--; if (depth === 0) { end = i; break } }
    }
    const body = src.slice(m.index, end)
    if (body.length > 1200) continue
    const named = new Set([...body.matchAll(/\w+\??\.type === '([a-z-]+)'/g)]
      .map((t) => t[1]).filter((t) => types.has(t)))
    if (named.size === 1) viaHelper[m[1]] = [...named][0]
  }

  // THE EXECUTOR'S BRANCHES **AND** THE GATE'S CASES.
  //
  // A verb is written in two places: the branch that carries it out, opening
  // `inp.type === 'x'`, and the case in the validator that decides whether it
  // may be, opening `case 'x':`. Only the first was read -- and for a whole
  // family of verbs the node requirement lives ONLY in the second, because
  // the executor has already been told it may proceed.
  //
  // `pay` is the plain example: its gate is `hasAdjacentNode(.., 'tollgate')`
  // and its branch mentions no node at all, so a tollgate afforded nothing and
  // the toll could not be paid from a window standing in front of the gate.
  const marks = [
    ...[...src.matchAll(/inp\.type === '([a-z_0-9]+)'/g)].map((m) => [m[1], m.index, true]),
    ...[...src.matchAll(/\n    case '([a-z_0-9]+)':/g)].map((m) => [m[1], m.index, false]),
  ].sort((a, b) => a[1] - b[1])
  for (let i = 0; i < marks.length; i++) {
    const verb = marks[i][0]
    const from = marks[i][1]
    // WHETHER THIS BLOCK IS THE DEED OR THE PERMISSION TO DO IT.
    //
    // In the EXECUTOR, a bare `n.type === 'x'` is the node being worked on.
    // In the GATE it is very often not: `transmute` walks every node within
    // sixteen tiles asking `nn.type === 'vault'` to decide whether it is
    // standing in a town, and reading that as a requirement made every bank
    // counter on the island afford alchemy -- a row that is refused the
    // moment it is clicked, on the one node that had just been given a panel.
    //
    // So a gate case is read for ADJACENCY only: the explicit calls, and the
    // one-type helpers that are those calls under another name. Proximity is
    // not adjacency and a scan is not a requirement.
    const isDeed = marks[i][2]
    const to = i + 1 < marks.length ? marks[i + 1][1] : src.length
    const body = src.slice(from, Math.min(to, from + 4000))
    // A ONE-TYPE HELPER COUNTS AS NAMING ITS TYPE. See `viaHelper`.
    for (const call of body.matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\s*\(\s*state\s*,\s*ctx\s*,\s*p\s*[,)]/g)) {
      const type = viaHelper[call[1]]
      if (type) add(type, verb)
    }
    // AND THE KIND, WHEN THE CALL NAMES ONE.
    //
    // Several of these are written `hasAdjacentNode(.., 'landmark', (n) =>
    // n.kind === 'wellspring')` -- the TYPE is landmark and the KIND is what
    // the verb actually wants. Reading only the type filed `drink` against
    // every landmark on the island: tables, standing stones, cairns, apple
    // trees. And since it was their only affordance it became their DEFAULT,
    // so an ordinary click on the ground anywhere near one of them tried to
    // drink it instead of walking there. The chat filled up with "could not
    // get to standing-stone -- drink dropped" on a walk across open country.
    //
    // The kind is recorded as `type.kind`, which is the same spelling the
    // window asks by -- it tries the finer word first and the plain one after
    // -- so a wellspring affords drinking and a table affords nothing.
    const adj = /(?:has|find)AdjacentNode\(\s*\w+\s*,\s*\w+\s*,\s*p\s*,\s*'([a-z-]+)'/g
    let hit
    while ((hit = adj.exec(body))) {
      if (!types.has(hit[1])) continue
      // The predicate that follows is a whole arrow function, brackets and
      // all, so it cannot be matched by "everything up to the next `)`".
      // The line after the type is read instead, which is where these are
      // always written.
      const tail = body.slice(adj.lastIndex, adj.lastIndex + 160)
      const kind = tail.startsWith(',')
        ? tail.match(/^[^\n]*?\.kind\s*===\s*'([a-z-]+)'/) : null
      add(kind ? hit[1] + '.' + kind[1] : hit[1], verb)
    }
    // `n?.type` as well as `n.type`. Optional chaining is how a good half
    // of these are written -- `n?.type === 'plot'` is the harvest branch --
    // and the first pass matched none of them, which is why a plot afforded
    // nothing but walking to.
    if (isDeed) {
      for (const m of body.matchAll(/\w+\??\.type === '([a-z-]+)'/g)) {
        if (types.has(m[1])) add(m[1], verb)
      }
    }
    // 3. AND THE NAMED SETS. A fire is `_FIRE_TYPES`, not a literal, so the
    //    set is resolved out of the source rather than being listed here --
    //    which is the difference between deriving the table and copying it.
    for (const m of body.matchAll(
        /(?:has|find)AdjacentNode\(\s*\w+\s*,\s*\w+\s*,\s*p\s*,\s*(_[A-Z_]+)/g)) {
      const decl = new RegExp('const ' + m[1] + "\\s*=\\s*new Set\\(\\[([^\\]]*)\\]")
      const found = decl.exec(src)
      if (!found) continue
      for (const q of found[1].match(/'([a-z-]+)'/g) || []) {
        const word = q.replace(/'/g, '')
        if (types.has(word)) add(word, verb)
      }
    }
  }
  const flat = {}
  for (const [type, verbs] of Object.entries(out)) flat[type] = [...verbs].sort()
  return flat
}

// ---------- AND WHAT CAN BE DONE WITH A THING IN THE PACK ----------
//
// The same question as `affordances`, asked of items instead of nodes, and
// answered the same way: out of the engine, never out of a list kept here.
//
//   WIELD comes from `EQUIPPABLE`, which the engine exports, and `slotOf`
//   says which slot it would take -- so a mask goes to the head and a sword
//   to the hand without this knowing what either is.
//
//   EAT comes from `healOf`, which the engine does NOT export. It is a chain
//   of `item === 'bread' ? HEAL_BREAD : ...`, so the items are read out of the
//   chain itself. Ten foods, and a pack full of ore should not offer to be
//   eaten.
//
//   DROP is offered for everything, because everything can be.
//
// What is NOT here: consign, stock, price, deposit. Every one of those needs
// somewhere to do it -- a store, a stall, a vault -- and offering them from a
// pack in an empty field would be offering a deed that is refused before it is
// sent. They belong to the screens those places open, which is the next piece.
// WHAT A VERB ASKS OF A CITIZEN BEFORE IT IS WORTH A MENU LINE.
//
// Only craft levels: everything else about whether a deed is possible is
// already answered by where the citizen is standing and what is in their pack,
// and those are decided per frame. A level is decided once and changes slowly,
// so the window can be told the bar and check it itself.
//
// The numbers come out of engine.js by name. A verb whose constant cannot be
// found is simply not listed, which leaves it offered -- the old behaviour,
// and the safe direction to fail in: a line the world refuses is a nuisance,
// a line that never appears is a verb nobody can reach.
function verbLevels () {
  const src = HOST.source('engine.js')
  const num = (name) => {
    const m = src.match(new RegExp('\\b' + name + '\\s*=\\s*(\\d+)'))
    return m ? Number(m[1]) : null
  }
  const out = {}
  // §7cv: a chart becomes a charter only for a master wayfarer.
  const charter = num('CHARTER_LEVEL')
  if (charter !== null) out.charter = { skill: 'wayfaring', level: charter }
  return out
}

function itemAffordances () {
  const src = HOST.source('engine.js')
  const out = {}
  const add = (item, verb) => { (out[item] ||= new Set()).add(verb) }

  for (const item of E.ITEMS) add(item, 'drop')

  for (const item of E.EQUIPPABLE || []) {
    add(item, 'wield')
    add(item, 'unwield')
  }

  // The foods, out of `healOf`'s own chain.
  const at = src.indexOf('const healOf =')
  if (at >= 0) {
    const body = src.slice(at, src.indexOf('\n//', at))
    for (const m of body.matchAll(/item === '([a-z-]+)'/g)) {
      if (E.ITEMS.has ? E.ITEMS.has(m[1]) : true) add(m[1], 'eat')
    }
  }

  // ---- THE OTHER VERBS THAT TAKE A PACK SLOT ----
  //
  // Five more that were filable from the first day with nowhere to be
  // clicked. Each one's rule is read off its own branch in engine.js rather
  // than guessed, because a menu line that the world always refuses is worse
  // than no line at all:
  //
  //   light   any log            -- sets a fire where you stand
  //   nock    arrows             -- puts a shaft on the string
  //   grind   grain              -- at a quern
  //   bury    bones              -- both kinds; the engine's own branch tested
  //                                 one and asked about the other
  //   transmute    anything PRICED    -- the world's own list, 105 items long, and
  //                                 the reason a whole trade exists
  for (const log of ['logs', 'oak-logs', 'ironbark', 'heartwood']) add(log, 'light')
  for (const shaft of ['arrows', 'fire-arrows']) add(shaft, 'nock')
  add('grain', 'grind')
  for (const bone of ['bones', 'dragon-bones']) add(bone, 'bury')
  for (const item of Object.keys(E.PRICES || {})) add(item, 'transmute')

  // ---- AND THE CHART, WHICH HAD NO ROW AT ALL ----
  //
  // `charter` takes a pack SLOT and nothing else -- §7cv, draw a crossing up
  // from a chart you are holding -- so it belongs on the chart's own row
  // exactly the way `grind` belongs on grain's. It was in neither this table
  // nor any other, so the one verb that turns a chart into a ferry licence
  // could not be reached by a mouse at all, and a citizen who had walked a
  // whole island to master wayfaring had nothing to click.
  //
  // The level is NOT tested here. A menu that shows only what is possible is
  // the rule, and the window is told a citizen's levels in the frame, so the
  // test belongs where every other one does: beside the row, with the number
  // read out of the engine rather than guessed.
  add('chart', 'charter')

  // ---- AND WHAT A THING CAN BE MADE INTO ----
  //
  // `fletch` is one verb for seven different makes and the engine decides
  // which by looking at BOTH the make and the item under the slot -- a log
  // becomes a bow, a torch, a wand or a staff; heartwood becomes a staff;
  // BONES become arrows, which is the one everybody guesses wrong. Read off
  // the branches at `inp.type === 'fletch'` in engine.js.
  //
  // It is listed rather than derived because those branches are seven
  // hand-written conditions, not a table, and a regex over them would be a
  // guess wearing the clothes of a derivation. Named here, in the bridge,
  // because it is world knowledge and the window must never hold its own copy.
  for (const log of ['logs', 'oak-logs', 'ironbark', 'heartwood']) {
    if (E.ITEMS.has ? E.ITEMS.has(log) : true) add(log, 'fletch')
  }
  if (E.ITEMS.has ? E.ITEMS.has('bones') : true) add('bones', 'fletch')

  const flat = {}
  for (const [item, verbs] of Object.entries(out)) flat[item] = [...verbs].sort()
  return flat
}

/** What each item may be fletched INTO. See itemAffordances. */
function itemMakes () {
  return {
    'logs': ['bow', 'torch', 'wand', 'staff'],
    'oak-logs': ['bow'],
    'ironbark': ['bow'],
    'heartwood': ['bow', 'heartwood-staff'],
    'bones': ['arrows'],
  }
}

// ---------- terrain, served as codes Unreal was TOLD about ----------
//
// The list is sent in `hello` and Unreal indexes into what it was told. It
// must never carry its own copy of these names: a data asset keyed by string
// is a hand copy, and a hand copy goes stale the day the generator adds a
// biome. Add a terrain here and the window renders it as unknown-but-present
// rather than as a hole in the island.
const TILE_NAMES = [
  'meadow', 'trail', 'cobble', 'plaza', 'gravel', 'sand', 'scree', 'chalk',
  'peat', 'cave', 'wilds', 'sea', 'river', 'mountain', 'bridge', 'causey',
  'forest', 'greenwood', 'crags', 'fens', 'floor', 'flag',
  // Appended after watching a v7 founding: the mirror returned all three and
  // codeFor invented codes for them at whatever moment a chunk first asked.
  // That works -- the editor is told -- but a code minted by discovery order
  // is a DIFFERENT code if the chunks are requested in a different order, and
  // a window whose layer 23 depends on which way it walked is not reproducible.
  // Seeding them here pins them: every Unreal window agrees on 22, 23 and 24
  // for the life of this list, and codeFor still catches the next surprise.
  'moor', 'heartlands', 'downs',
  // and the kinds only the generator ever knew: the worn surface a lane
  // takes in each country, and the ground of the isles.
  'shingle', 'trodden',
]
const TILE_CODE = new Map(TILE_NAMES.map((n, i) => [n, i]))
const UNKNOWN = 255

// ---------- THE GROUND, ASKED OF THE GENERATOR ITSELF ----------
//
// terrain-mirror.mjs exists because a BROWSER cannot import worldgen-*.mjs:
// it is megabytes of founding logic and the window is a page. This process is
// not a page. It is node, in the repo, with the generator sitting in the next
// file, and every reason the mirror exists evaporates here.
//
// It matters because the mirror was, in fact, behind. Pointed at v7 it drew:
//   * two isles, not three -- Whiting Isle (§7bu) does not exist in the v6
//     block the v7 world was falling through to;
//   * the Great River beginning at SRC_YF 0.105, in the middle of the
//     Greenwood on dry land, when v7 pulled its head to 0.06 so that it meets
//     the sea and becomes the estuary it is;
//   * no inland water whatsoever -- worldgen-water-v7.mjs is an entire
//     hand-drawn system of meres, tarns, moss pools and becks, and the mirror
//     has never heard of any of it.
//
// Mirroring all of that by hand would be a NEW hand copy, of the largest and
// most hand-drawn part of the founding, written by the one person who already
// knows it is a copy. That is the drift this project exists to refuse. So the
// bridge asks the generator, which cannot be behind itself.
//
// The mirror is still imported and still used -- for tileHash, the scatter
// plane, which is a pure hash every other window shares and which must stay
// byte-identical across all of them.
let GEN = null      // the generator module this founding names
let GG = null       // the genesis, as the pillar served it
let ROADS = null    // the tiles the founder actually LAID, from /api/roads

function terrainAt (x, y) {
  // groundKindAt is a SURFACE, not a classification of every tile: it answers
  // for decking over a bridge, a room's floor indoors, flagstone and cobble in
  // a street, plaza in the market square, the worn kind a lane takes in each
  // country, the sand at a water's edge, the shingle on Whiting Isle -- and it
  // returns null both for water AND for plain open country. Reading that null
  // as water paints the whole landmass as river; ask the two questions in
  // order and it is right.
  const k = GEN.groundKindAt(GG, x, y)
  if (k) return k
  if (GEN.isWater(GG, x, y)) {
    // The open sea is sea; everything wet and not decked -- the Great River,
    // Stillwater, every mere, tarn, moss pool and beck of worldgen-water-v7 --
    // is river, which is the convention every other window already draws.
    return GEN.inSea(GG, x, y) ? 'sea' : 'river'
  }
  return GEN.biomeAt(GG, x, y)
}

// AND THE LIST GROWS BY ITSELF. The order above is only the one Unreal gets
// to warm its material instances against; the day the generator returns a
// terrain nobody here has heard of, it is appended and every connected
// editor is told. The alternative — a hand-maintained enum on the C++ side —
// is how the settlement tables drifted twenty-seven tiles under v7.
// Whether this tile is on the island's spine. The generator wants the world's
// size and nothing else about it.
function onRidgeAt (x, y) {
  if (!_onRidge) return false
  const W = boot.genesis?.worldW ?? 0, H = boot.genesis?.worldH ?? 0
  if (!W || !H) return false
  return !!_onRidge({ worldW: W, worldH: H, geo: boot.genesis?.geo }, x, y)
}

function codeFor (name) {
  let c = TILE_CODE.get(name)
  if (c === undefined) {
    c = TILE_NAMES.length
    TILE_NAMES.push(name); TILE_CODE.set(name, c)
    console.warn('[bridge] new terrain from the mirror: ' + name + ' -> ' + c)
    sendUE({ k: 'tiles', tiles: TILE_NAMES })
  }
  return c
}

const chunkCache = new Map()
// THE SKIRT. A window asks for the rectangle it means to DRAW and gets that
// rectangle plus a border of `skirt` tiles all the way round.
//
// It exists because a chunk that can only see its own tiles cannot agree with
// its neighbour about anything computed from a neighbourhood. Two of those
// have bitten already: vertex relief, where the chunk on the left averaged the
// last tile it had and the chunk on the right averaged the first tile IT had,
// so the ground split along every chunk boundary; and roof eaves, where a
// building spanning two chunks lost the far row.
//
// terrainChunk is a pure function of coordinates, so the border costs bytes
// and nothing else -- 64x64 with a one-tile skirt is 4356 bytes a plane rather
// than 4096. Tiles outside the world come back UNKNOWN rather than as a
// guess, because past the edge of the map there is no ground to be right or
// wrong about.
function terrainChunk (x0, y0, w, h, skirt = 0) {
  const key = x0 + ',' + y0 + ',' + w + ',' + h + ',' + skirt
  const hit = chunkCache.get(key); if (hit) return hit
  const sw = w + skirt * 2, sh = h + skirt * 2
  const tiles = new Uint8Array(sw * sh)
  const road = new Uint8Array(sw * sh)
  // THE SPINE, WHICH IS NOT A GROUND.
  //
  // The island's ridge is a PREDICATE in the generator, not a terrain code: the
  // tiles along it come back as ordinary `crags`, the same as the whole eastern
  // third of the world. So the most important piece of geography there is --
  // two named passes cross it and the generator shuts one of them -- was
  // indistinguishable from open country, and the window drew rough ground where
  // the wall stands.
  //
  // It travels beside `road` because it is the same KIND of fact: something
  // true of a tile that its ground does not say. The window is told WHERE the
  // ridge is and never what a ridge means, which is the whole arrangement --
  // the bridge holds the world knowledge and Unreal holds the pixels.
  const ridge = new Uint8Array(sw * sh)
  // THE SCATTER PLANE. Decoration has to agree between citizens too. Not
  // because the constitution says so — a fern is not consensus — but because
  // "meet me by the crooked oak" is a sentence people say, and a window that
  // rolled its own dice for placement makes it a lie. tileHash is the same
  // pure function the generator uses, so every Unreal window scatters the
  // same oak on the same tile forever.
  const hash = new Uint8Array(sw * sh)
  // WHETHER THERE IS WATER UNDER IT, which the ground kind hides.
  //
  // `groundKindAt` answers a decked crossing with `bridge` and stops there, so
  // a bridge tile says nothing about what it spans -- and on this island a
  // hundred and thirty-five of the two hundred and thirty-four of them are
  // over dry land, because a crossing's paved approach is drawn as bridge too.
  // The window used that word to dig a river channel under the deck so the
  // water could be seen running beneath it, and dug it through the banks as
  // well: a three-metre trench gouged along the road for sixty tiles.
  //
  // Told, not derived, for the reason every other plane here is: the window
  // guessing at it from the tiles around would disagree with the generator the
  // first time a crossing was two tiles from a pond.
  const wet = new Uint8Array(sw * sh)
  const W = boot.genesis?.worldW ?? 0, H = boot.genesis?.worldH ?? 0
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
    const wx = x0 - skirt + x, wy = y0 - skirt + y, i = y * sw + x
    if (W > 0 && (wx < 0 || wy < 0 || wx >= W || wy >= H)) { tiles[i] = UNKNOWN; continue }
    let t
    try { t = terrainAt(wx, wy) } catch { t = null }
    tiles[i] = (t == null || t === '') ? UNKNOWN : codeFor(t)
    road[i] = ROADS.has(wx + ',' + wy) ? 1 : 0
    try { ridge[i] = onRidgeAt(wx, wy) ? 1 : 0 } catch { ridge[i] = 0 }
    try { hash[i] = TM.tileHash(wx, wy, 97) & 255 } catch { hash[i] = 0 }
    try { wet[i] = GEN.isWater(GG, wx, wy) ? 1 : 0 } catch { wet[i] = 0 }
  }
  const out = {
    // x0, y0, w, h are the INTERIOR -- the rectangle that was asked for and
    // that the window will draw. The planes are (w + 2*skirt) wide.
    k: 'terrain', x0, y0, w, h, skirt,
    tiles: Buffer.from(tiles).toString('base64'),
    road: Buffer.from(road).toString('base64'),
    ridge: Buffer.from(ridge).toString('base64'),
    hash: Buffer.from(hash).toString('base64'),
    wet: Buffer.from(wet).toString('base64'),
  }
  if (chunkCache.size > 512) chunkCache.clear()
  chunkCache.set(key, out)
  return out
}

// ---------- the world we hold ----------
// Snapshot then deltas, applied with view.mjs's own applyTick — the same
// function the pillar's fan-out was written against, not a shim copied out
// of a window. Removals before upserts, or a citizen crossing a zone
// boundary vanishes while still standing there (view.mjs, §applyTick).
let held = null
// THE REAL WORLD, EVEN WHILE A PRACTICE OF IT IS RUNNING.
//
// `held` is what the WINDOW is shown, which during the vigil is Nought. The
// two must not be the same variable: the birth wait and the day's allowance
// are facts about the country, and reading them off the practice island would
// have the window announce that a resident is already in the world -- because
// in their own private copy of it, they are.
let live = null
let watched = { has: () => true }
let lastTick = -1

const ueClients = new Set()
const sendUE = (obj) => {
  const s = JSON.stringify(obj)
  for (const c of ueClients) if (c.readyState === 1) c.send(s)
}

// ---- A WINDOW IS NEVER SHOWN A STALE FRAME ----
//
// The world ticks once a second and a frame went out every tick, whether or
// not the window had finished with the last one. An Unreal editor streaming a
// new region of the island drops to a frame every three seconds, so it drains
// the socket three times slower than the bridge fills it -- and the backlog
// never clears, because there is nothing in the arrangement that ever skips.
//
// Left alone for a quarter of an hour, the window was EIGHT HUNDRED AND FIFTY
// TICKS BEHIND: fourteen minutes of the world's history queued up in a socket.
// What that looks like from inside is not lag, it is the world refusing. The
// citizen files a walk, the world applies it at once, and the window is still
// watching a quarter of an hour ago -- so it sees no movement, decides the
// deed was not taken, says "the world would not take that", and re-plans a
// route it has already walked. Hours went into pathfinding that was never
// wrong.
//
// So a frame is skipped when the last one has not been read. `bufferedAmount`
// is what the socket has written and the client has not taken; anything above
// zero means the window is behind, and the right thing to send a window that
// is behind is nothing at all -- the next frame will be newer.
let skipped = 0
const sendFrameUE = (obj) => {
  const s = JSON.stringify(obj)
  for (const c of ueClients) {
    if (c.readyState !== 1) continue
    // ONE FRAME IN FLIGHT AT A TIME.
    //
    // The first attempt at this compared the window's last seen tick against
    // the WORLD's, and stopped sending to any window more than a couple
    // behind. That deadlocks on the spot: a window that is behind gets
    // nothing, so its seen tick never advances, so it is behind for ever. It
    // went from a window a quarter of an hour late to a window that never
    // moved again.
    //
    // Stop-and-wait cannot do that. The next frame goes out when the window
    // has acknowledged the LAST ONE SENT -- so a slow window is sent fewer
    // frames and always the newest, and a window that catches up is sent
    // every tick again. A window that has not spoken yet is sent one, which
    // is how the conversation starts.
    if (c.bufferedAmount > 0
      || (c.sentTick !== undefined && (c.seenTick ?? -1) < c.sentTick)) {
      skipped++
      continue
    }
    c.sentTick = held.tick
    c.send(s)
  }
  if (skipped && skipped % 60 === 0) {
    console.log('[bridge] ' + skipped + ' frames skipped so far -- the window '
      + 'is reading slower than the world ticks, which is how it should be')
  }
}

function meNow () { return held?.players?.[ID.playerId] ?? null }

// One frame per interval. Unreal interpolates between them and that
// interpolation is COSMETIC: it never feeds back into an input. The world
// advances once a second and nothing Unreal draws may pretend otherwise.
// §0b: BIRTH IS TWO-PHASE, AND THE WINDOW HAS TO BE ABLE TO SAY SO.
//
// A citizen is not in the world because they asked. They ATTEND, they wait the
// same ten minutes a person waits, and then they cross. A bare `spawn` is an
// input that will be refused forever because no wait stands behind it -- and
// it is refused at APPLICATION time, inside the state machine, which means no
// `refused` comes back down the socket. Silence.
//
// That is precisely the failure §6 exists to prevent: a window that clicks and
// nothing happens and nothing is said. So the wait is measured here, out of the
// state the pillar already sends, and handed to the window every interval. The
// window does not need to know what a birth IS; it needs to be able to tell a
// citizen why they are not standing anywhere yet.
// §7: THE DOOR'S NUMBERS, AND THE ONE THING THAT NEVER COMES THROUGH IT.
//
// A door shows a citizen where they are and whether the world agrees with
// itself: the world's id, the interval it is on, the last interval that is
// FINALIZED -- settled, not just computed -- and how many witnesses stand
// behind that. A tick that keeps climbing while the finalized tick does not is
// a world that is running but not agreeing, and a citizen is entitled to see
// the difference.
//
// THE KEY IS NOT IN THIS LIST, and never will be. The door reports the PATH to
// the file that is the citizen, so a person can copy it, back it up, or carry
// it to another vessel with their own hands. It does not send the bytes. The
// engine plugin cannot sign, and it also cannot leak what it was never given:
// an exported key that transited this socket would be sitting in the editor's
// memory, in its crash dumps, and in whatever the editor writes to disk.
let door = { finalizedTick: null, witnesses: null, quorum: null, halted: null }
async function refreshDoor () {
  try {
    const w = await getJson('/api/world')
    door = {
      finalizedTick: w.finalizedTick ?? null,
      scheduledTick: w.scheduledTick ?? null,
      witnesses: w.witnesses ?? null,
      quorum: w.quorum ?? null,
      ready: w.ready ?? null,
      halted: w.halted ?? null,
      awake: w.awake ?? null,
    }
  } catch { /* a door that cannot be read is drawn stale, not wrong */ }
}

// HOW LONG A BIRTH WAITS -- ASKED, NOT REMEMBERED.
//
// This was a hand copy of 1000, and the hand copy went stale. The engine's
// wait is VIGIL_TICKS, which is 300 and says so in as many words: "five
// minutes at a second an interval. FIVE, NOT TEN, AND NOT SEVENTEEN." It was
// a thousand when an interval was 600ms; the interval became a second, the
// engine was corrected, and this copy was not.
//
// So every citizen born through this window sat out SEVENTEEN minutes at a
// door the world had opened after five -- not because the world refused, but
// because the bridge never asked. The number is in the `hello` tables as
// `vigilTicks`, which is exactly the reason those tables are sent.
//
// The floor is the world's. If a founding moves it, this moves with it.
// Read LAZILY: `boot` is filled when the pillar answers, which is after this
// file is evaluated, so a constant here would always take the fallback and the
// asking would be for show.
const birthRipe = () => Number(boot?.tables?.vigilTicks) || 300
// THE SPAN IN WHICH A RIPE WAIT MAY STILL BE SPENT before it ages out and has
// to be renewed. The engine's ATTEND_WINDOW is an HOUR -- `attendRipe` refuses
// a crossing past it -- and this was 600, on the reasoning that it "only has
// to be comfortably longer than the vigil, and twice it always has been".
//
// Twice the vigil is ten minutes, and the vigil is five. So a resident who
// knocked and then went and did something for a quarter of an hour, which is
// precisely what the practice island is FOR, came back to a window announcing
// that their wait had lapsed -- and the window's answer to a lapsed wait is to
// knock again, which threw away a ripe vigil and started the five minutes over.
// The world had been ready for them for ten minutes by then.
//
// The engine does not export the constant and it is not in the tables, so it
// is written here with its name on it rather than derived from something it
// has no relationship to. The floor keeps it sane if a founding lengthens the
// vigil past an hour, which nothing has ever done.
const ATTEND_WINDOW = 3600
const birthStale = () => Math.max(ATTEND_WINDOW, birthRipe() * 2)
function birthOf () {
  if (!live) return null
  if (live.players?.[ID.playerId]) return { state: 'in' }
  const key = ID.playerId.slice(0, 16)
  const row = Array.isArray(live.attend) ? live.attend.find((x) => x[1] === key) : null
  if (!row) return { state: 'unknown', waited: 0, ripeAt: birthRipe() }
  const age = live.tick - row[0]
  if (age < 0 || age > birthStale()) return { state: 'lapsed', waited: age, ripeAt: birthRipe() }
  if (age < birthRipe()) return { state: 'waiting', waited: age, ripeAt: birthRipe() }
  return { state: 'ripe', waited: age, ripeAt: birthRipe() }
}

// §7dw: CLOSING TIME, MEASURED HERE FOR THE SAME REASON THE BIRTH WAIT IS.
//
// A citizen may stand 5400 intervals -- ninety minutes -- in any rolling
// 86400-interval window. Spend them and the world does not log you out, freeze
// you or take anything: you are STOOD DOWN, present and not acting, standing
// where you stood and holding what you held until the window rolls enough to
// let you act again.
//
// Which is, from the window's side, indistinguishable from a broken bridge.
// The deeds simply stop landing and nothing anywhere says why -- the exact
// silence §6 exists to prevent, and worse than a refusal because there is not
// even a failed click to point at. So it is computed out of the ledger the
// pillar already sends and handed over every interval.
//
// It is NOT a day and there is no midnight: the window rolls continuously, so
// the allowance refills as it goes and there is nothing to race toward or
// hoard. And it counts PRESENCE, not deeds -- standing idle in a meadow costs
// the same as fighting, which is why a window that only watched for refused
// intents would never see it coming.
//
// The arithmetic is the engine's, bin for bin (engine.js §7dw). The ledger is
// binned rather than exact, so this is accurate to within one bin; that is the
// world's own trade, not an approximation introduced here.
const CEIL_BINS = 24
function ceilingOf () {
  const c = GG?.ceiling ?? boot.genesis?.ceiling
  // THE COUNTRY'S LEDGER, NOT THE PRACTICE ISLAND'S. §7dw: a ceiling is a
  // claim on a citizen's real day and nothing in Nought is real, so a
  // resident's allowance is untouched by however long they practise.
  const me = live?.players?.[ID.playerId] ?? null
  if (!c || !me) return null
  // A CITIZEN BORN A MINUTE AGO HAS NO LEDGER AT ALL, and returning nothing
  // for them showed no allowance on the one citizen who still has all of it.
  // No ledger means nothing has been spent, which is not an absence of an
  // answer -- it is the answer.
  const led = me.ledger
  if (!led || !Array.isArray(led.bins)) {
    return { left: c.allow, allow: c.allow, warn: c.warn ?? 0, stoodDown: false }
  }
  const b = Math.floor(live.tick / (c.window / CEIL_BINS))
  const gap = b - led.at
  let stood = 0
  if (gap < CEIL_BINS)
    for (let k = 0; k < CEIL_BINS - gap; k++)
      stood += led.bins[(led.at - k + CEIL_BINS * 2) % CEIL_BINS] || 0
  const left = Math.max(0, c.allow - stood)
  return { left, allow: c.allow, warn: c.warn ?? 0, stoodDown: left <= 0 }
}

// §6g: THE COUNTER THIS CITIZEN IS STANDING AT, AND WHAT IS IN IT.
//
// A vault is LOCAL -- `p.vaults` is one map per bank node, so what is at
// Anchor is not at Thornbury -- and the engine resolves which one by standing
// beside it, orthogonally. The window is not told the whole of `p.vaults` and
// left to work out which counter it is at; it is told the one it can reach and
// nothing else, because deciding that is world knowledge and this is where
// world knowledge lives.
//
// Null means not at a counter, which the window reads as "no bank screen".
// An EMPTY map means at a counter with nothing in it, which is a different
// thing and has to look different: a citizen standing at their own empty vault
// should see an empty vault, not be told there is no bank here.
function vaultHere () {
  const me = meNow()
  if (!me || !held) return null
  for (const [id, n] of Object.entries(held.nodes ?? {})) {
    // The engine's own rule (§5): orthogonal, because you face what you work.
    if (n.type !== 'vault') continue
    if (Math.abs(me.x - n.x) + Math.abs(me.y - n.y) !== 1) continue
    return { id, items: { ...(me.vaults?.[id] ?? {}) } }
  }
  return null
}

// §5c: THE TRADE STANDING BETWEEN TWO PEOPLE, FROM BOTH SIDES.
//
// `accept_trade` names WHO offered, and the offer lives on the OTHER
// citizen's record -- `o.trade`, not yours -- so a window has no way to know
// it exists by looking at the citizen it is drawing. It is the one deed in
// this world whose precondition is written entirely on somebody else.
//
// Which is why it was unreachable: not for want of a button, but because
// nothing on this side of the socket knew there was anything to press. So the
// bridge looks, because looking at everybody is world knowledge and this is
// where world knowledge lives.
//
// Only from somebody ADJACENT, because that is the engine's own condition for
// accepting one (§5c) -- an offer from across the island is not a thing a
// citizen can take, and showing it would be a button that cannot work.
function tradeNow () {
  const me = meNow()
  if (!me || !held) return null
  const words = (slots, from) => (slots ?? [])
    .map((sl) => from.inventory?.[sl]?.item)
    .filter(Boolean)
  const mine = me.trade
    ? { to: me.trade.to,
        toName: held.players?.[me.trade.to]?.name ?? String(me.trade.to).slice(0, 8),
        give: words(me.trade.giveSlots, me),
        wantItem: me.trade.wantItem ?? null,
        wantGold: me.trade.wantGold ?? 0 }
    : null
  let offered = null
  for (const [id, other] of Object.entries(held.players ?? {})) {
    if (id === ID.playerId || !other.trade) continue
    if (other.trade.to !== ID.playerId) continue
    if (Math.abs(me.x - other.x) + Math.abs(me.y - other.y) !== 1) continue
    offered = { from: id,
      name: other.name ?? id.slice(0, 8),
      give: words(other.trade.giveSlots, other),
      wantItem: other.trade.wantItem ?? null,
      wantGold: other.trade.wantGold ?? 0 }
    break
  }
  return (mine || offered) ? { mine, offered } : null
}

// WHAT THE PLACE YOU ARE STANDING IN CAN BE USED FOR.
//
// A whole family of this world's verbs is "do this thing out of your pack, AT
// that place": cook a loaf at a hearth, brew at a smokerack, grind at a mill,
// bury a bone at an ossuary, stoke a furnace, put something away at a vault.
// Every one of them is afforded by the NODE and takes a `slot`, which is a
// thing only the pack knows -- so offered on the node they are rows with a
// hole where the slot should be, and the world refuses them.
//
// The window drew them on the hearth for months and cooking has never once
// worked from it. They belong on the pack's own rows, offered exactly when the
// place that allows them is in reach, which is what this is: the verbs the
// nodes beside this citizen afford, recomputed every interval because walking
// one tile changes the answer.
//
// The ADJACENCY is the engine's (§5, orthogonal). The window is told the
// answer and never the rule.
function verbsBeside () {
  const me = meNow()
  if (!me || !held) return []
  const out = new Set()
  // §7cz: SOWING, which is a pack verb with a place attached.
  //
  // `plant` names a SLOT -- the seeds -- and the world finds the plot, so it
  // is not something a plot affords and not something seeds afford: it is
  // both, and neither table names it. It goes in with the other verbs the
  // ground allows, which the window already knows to draw on the pack's rows
  // when their schema wants a slot.
  //
  // Only a plot this citizen has not already sown, which is the engine's own
  // condition (`freePlotFor`) and the difference between a row that works and
  // a row that is refused on ground you are standing on.
  for (const [id, n] of Object.entries(held.nodes ?? {})) {
    if (n.type !== 'plot') continue
    if (Math.abs(me.x - n.x) + Math.abs(me.y - n.y) !== 1) continue
    if ((me.crops?.[id] ?? 0) > 0) continue
    out.add('plant')
    break
  }
  for (const n of Object.values(held.nodes ?? {})) {
    if (Math.abs(me.x - n.x) + Math.abs(me.y - n.y) !== 1) continue
    // The finer word first and the plain one after, the same way the window
    // asks: a mill is `landmark.mill` and a landmark that is not a mill
    // grinds nothing.
    for (const key of [n.kind ? n.type + '.' + n.kind : null, n.type]) {
      for (const v of (key && AFFORDS[key]) || []) out.add(v)
    }
  }
  return [...out].sort()
}

// WHAT CANNOT BE DONE AT ALL RIGHT NOW, whatever it is pointed at.
//
// `atHand` answers what the GROUND allows and `itemAffords` what a THING
// allows, and both are the wrong shape for a verb whose conditions are about
// the citizen: where they are standing and what is in their hand. Alchemy is
// the one today. It is an affordance of every PRICED item -- a hundred and
// five of them -- so a newcomer standing in Anchor with a hatchet was offered
// "transmute" under every single thing in their pack, and the world declines all of
// it at the validator, where a refusal never becomes an event and so never
// reaches the feed. Twelve dead lines and no way to find out why.
//
// The window subtracts this set from every menu. It is computed HERE, where
// the whole state is, for the same reason the social conditions are: a window
// that decided this for itself would be a second copy of the rules.
function verbsBarred () {
  const me = meNow()
  if (!me || !held) return []
  const out = []
  // §6ao: ALCHEMY WANTS AN INSTRUMENT AND A PLACE. Mirrors `case 'transmute'`.
  //
  //   WHERE: in the wilds, or in a town (a vault within sixteen tiles), and
  //          never at the spawn, so a newcomer has to step out into the world.
  //   WITH:  a staff or a wand in the weapon hand. §6bn, a goo staff counts.
  //
  // A founding that omits `transmuteWhere` transmutes anywhere and staffless, as v1-v5
  // do, and then this drops away exactly as the engine's own rule does.
  if (held.genesis?.transmuteWhere) {
    const c = E.cityRectOf(held.genesis)
    const atSpawn = me.x >= c.x0 && me.x <= c.x1 && me.y >= c.y0 && me.y <= c.y1
    let inTown = false
    if (!atSpawn) {
      for (const n of Object.values(held.nodes ?? {})) {
        if (n.type === 'vault' && Math.abs(n.x - me.x) <= 16
            && Math.abs(n.y - me.y) <= 16) { inTown = true; break }
      }
    }
    const inWild = E.inWilds(held.genesis, me.x, me.y)
    const arm = me.equipment?.weapon?.item
    const instrument = arm === 'staff' || arm === 'wand'
      || arm === 'heartwood-staff' || arm === 'goo-staff'
    if (!((inWild || inTown) && instrument)) out.push('transmute')
  }
  return out
}

// WHAT MAY ACTUALLY BE DONE TO THIS PERSON, RIGHT NOW.
//
// The window offered every social verb on every citizen and let the world
// refuse what was not allowed -- on the reasoning that a window which decides
// for itself is keeping a second copy of the rules. The user overruled that
// on sight: "it should only show actually available options. Not attack
// unless it's in wild or if both have consignment. And what's part from? Is
// that stopping following? If so then that shouldn't be visible unless
// following."
//
// They are right, and the objection is not really about rules -- it is that a
// menu of eight lines, six of which do nothing, is not a menu. So the
// conditions are answered HERE, where the whole state is, rather than in the
// window, which would be the second copy. The engine's own gate is not
// exported and engine.js must not be touched (its hash is the world's id), so
// each of these mirrors one `case` of `validInput`, named in the comment so
// the two can be read side by side.
// §7cf: THE NUMBERS THE TWO TARGETED SPELLS ASK FOR, read out of the engine's
// source like every other constant this bridge needs and does not get given.
// A spell offered without them is a row that is refused, and both of these are
// expensive to be refused at: three sigils is a real cost to have wasted a
// click on.
const SPELL = (() => {
  const want = { stillLevel: 85, stillSigils: 3, stillRange: 6,
                 mendLevel: 50, mendRange: 4 }
  try {
    const src = HOST.source('engine.js')
    const num = (re, fallback) => { const m = re.exec(src); return m ? +m[1] : fallback }
    want.stillLevel  = num(/const STILL_LEVEL = (\d+)/, want.stillLevel)
    want.stillSigils = num(/const STILL_SIGILS = (\d+)/, want.stillSigils)
    want.stillRange  = num(/const STILL_RANGE = (\d+)/, want.stillRange)
    want.mendLevel   = num(/const MEND_REQ = (\d+)/, want.mendLevel)
    want.mendRange   = num(/const MENDP_RANGE = (\d+)/, want.mendRange)
  } catch { /* the fallbacks are the values as of this founding */ }
  return want
})()

/** Whether this citizen's book holds that word, and they are not in the Lists. */
function saying (me, word) {
  const book = (BOOKS_HELD[me.book ?? 'common'] ?? [])
  return book.includes(word)
}

/** How many of a thing is in the pack. */
function carrying (me, word) {
  return (me.inventory ?? [])
    .reduce((n, sl) => n + (sl?.item === word ? (sl.qty ?? 1) : 0), 0)
}

/**
 * §7cf: WHAT MAY BE CAST AT A BODY, whosever it is.
 *
 * `still` and `mendp` name a `target` and reach further than an arm: six tiles
 * and four. Both were unreachable because a spell with a target has nowhere to
 * be clicked -- the spellbook casts by word and knows nothing about who -- so
 * they go on the menu of the thing they are aimed at, beasts included.
 */
function spellsAt (me, other, id, bIsMob) {
  const out = []
  const near = Math.max(Math.abs(me.x - other.x), Math.abs(me.y - other.y))
  const sigils = carrying(me, 'sigil')
  const sorcery = E.levelForXp(me.skills?.sorcery ?? 0)
  if (saying(me, 'still') && sorcery >= SPELL.stillLevel
      && sigils >= SPELL.stillSigils
      && (me.stillCdUntil ?? 0) <= (held?.tick ?? 0)
      && other.health > 0 && (other.stillImmuneUntil ?? 0) <= (held?.tick ?? 0)
      && near <= SPELL.stillRange) {
    out.push('still')
  }
  // Mending is for people. A beast that could be healed is a beast somebody
  // is about to be very annoyed with.
  if (!bIsMob && saying(me, 'mendp')
      && me.equipment?.weapon?.item === 'wand'
      && sorcery >= SPELL.mendLevel && sigils >= 1
      && other.health > 0 && (other.witheredUntil ?? 0) <= (held?.tick ?? 0)
      && (other.deadUntil ?? 0) <= (held?.tick ?? 0)
      && id !== ID.playerId && near <= SPELL.mendRange) {
    out.push('mendp')
  }
  return out
}

function mayDoTo (me, other, id) {
  const out = []
  if (!me || !other || other.health <= 0) return out
  // §5c: an offer may be made to anybody; taking one needs adjacency, and
  // that is answered by `tradeNow`, not here.
  out.push('offer_trade')
  const near = Math.max(Math.abs(me.x - other.x), Math.abs(me.y - other.y))
  const friends = me.friends ?? []
  // §7cm/§7cn: a name you keep, and only of somebody you have been WITH --
  // twelve tiles, which is the distance at which this world stops calling two
  // people together.
  if (!friends.includes(id) && near <= 12) out.push('befriend')
  // §7cm: and you may only forget somebody you know.
  if (friends.includes(id)) out.push('unfriend')
  // §7cd: fall in. Pointless on somebody you are already behind.
  if (me.following !== id) out.push('follow')
  // §5w: a master takes a citizen on -- sworn, at mastery in their own craft,
  // standing beside them, and the student not sworn already.
  const mine = typeof me.calling === 'string' ? (E.SWORN ?? {})[me.calling] : null
  if (mine && other.calling === undefined
      && Math.abs(me.x - other.x) + Math.abs(me.y - other.y) === 1
      && E.levelForXp(me.skills?.[mine.skill] ?? 0) >= 100
      && !Object.prototype.hasOwnProperty.call(me.apprentices ?? {}, id)) {
    out.push('teach')
  }
  // §5w: PART IS ENDING AN APPRENTICESHIP, either end of it -- not, as the
  // window's wording suggested, stopping following somebody. It has no
  // meaning at all between two people who are not master and student.
  const asMaster = Object.prototype.hasOwnProperty.call(me.apprentices ?? {}, id)
  const asStudent = Object.prototype.hasOwnProperty.call(other.apprentices ?? {}, ID.playerId)
  if (asMaster || asStudent) out.push('part')
  // §11d: THE WILDS, OR TWO CONSIGNMENTS. `mayStrike`, which is not exported.
  const bothHauling = !!me.consignment && !!other.consignment
  const bothWild = (() => {
    try {
      return E.inWilds(held.genesis, me.x, me.y) && E.inWilds(held.genesis, other.x, other.y)
    } catch { return false }
  })()
  for (const word of spellsAt(me, other, id, false)) out.push(word)
  if (bothHauling || bothWild) {
    out.push('attackp')
    // §6af: everything `attackp` asks, plus a weapon that HAS a gambit.
    // Bare hands have none, so the row was on every citizen in the world.
    const held_ = me.equipment?.weapon?.item
    if ((E.WEAPONS ?? {})[held_]?.gambit) out.push('gambit')
  }
  return out
}

// THE EXPERIENCE AT WHICH EACH LEVEL BEGINS, walked once at startup.
//
// `levelForXp` goes one way and the window wants the other: how far into this
// level a citizen is, and how much is left. Inverting a formula by hand is how
// two copies of a rule start disagreeing, so this simply asks the engine for
// every answer and records where the value changed. Seventy-five rungs over
// about a hundred and ninety thousand points, which is a tenth of a second
// once and never again.
const RUNGS = (() => {
  const out = [0, 0]
  let last = 1
  for (let xp = 0; xp < 200000; xp++) {
    const l = E.levelForXp(xp)
    if (l > last) { out[l] = xp; last = l }
  }
  return out
})()

// WHAT MAY BE DONE WHERE THIS CITIZEN IS STANDING.
//
// A handful of deeds name no target at all: they happen at your feet. You
// kindle a watchfire on the tile you are on, you raise a stall on the tile you
// are on, you survey the marker you are standing upon. Nothing in the world
// can be pointed at for any of them, so none had a gesture and all three have
// been unreachable since the window was written.
//
// Their conditions are read here rather than guessed at in the window, because
// they are the world's: a level in a craft, ten logs, a tile with nothing on
// it already, a founding that has watchfires at all. A row offered without
// them is a row that is refused, which is the thing the menus are not to do.
//
// The two numbers the engine does not export are read out of its source, the
// same way the affordances and the input schemas are: a constant copied by
// hand is right the day it is typed.
const MARKET_NEEDS = (() => {
  try {
    const src = HOST.source('engine.js')
    const p = /const MARKET_PLANKS = (\d+), MARKET_ORE = (\d+)/.exec(src)
    const o = /const MARKET_OWNED = (\d+)/.exec(src)
    return { planks: p ? +p[1] : 10, ore: p ? +p[2] : 2, owned: o ? +o[1] : 1 }
  } catch { return { planks: 10, ore: 2, owned: 1 } }
})()

function underfoot () {
  const me = meNow()
  if (!me || !held) return []
  const out = []
  const at = (x, y) => Object.values(held.nodes ?? {})
    .some((n) => n.x === x && n.y === y)
  const mine = (type) => Object.values(held.nodes ?? {})
    .filter((n) => n.type === type && n.by === ID.playerId).length
  const carrying = (word) => (me.inventory ?? [])
    .reduce((n, sl) => n + (sl?.item === word ? (sl.qty ?? 1) : 0), 0)
  const bare = !at(me.x, me.y)

  // §0.53: A GREAT FIRE, raised out of ten logs by somebody who knows how.
  const watch = GG?.watch
  if (watch && bare
      && E.levelForXp(me.skills?.woodcraft ?? 0) >= watch.level
      && carrying('logs') >= watch.kindleLogs
      && mine('watchfire') < watch.maxOwned) {
    out.push('kindle')
  }

  // §6al: A STALL LINES THE ROAD. Beside one and not on it, where a founding
  // says so, which is a question only the generator can answer.
  let besideRoad = true
  try {
    if (GG?.stallsLineRoads) {
      const on = (x, y) => GEN?.onRoad ? GEN.onRoad(GG, x, y) : false
      besideRoad = !on(me.x, me.y)
        && (on(me.x + 1, me.y) || on(me.x - 1, me.y)
         || on(me.x, me.y + 1) || on(me.x, me.y - 1))
    }
  } catch { besideRoad = false }
  if (bare && besideRoad
      && mine('market') < MARKET_NEEDS.owned
      && carrying('planks') >= MARKET_NEEDS.planks
      && carrying('iron-ore') >= MARKET_NEEDS.ore) {
    out.push('raise_market')
  }

  // §0.50: STAND ON A MARKER TO SURVEY IT.
  if ((held.markers ?? []).some((m) => m.x === me.x && m.y === me.y)) {
    out.push('survey')
  }

  // §7a: THE FIRST PLANK OF A WILD SPAN.
  //
  // `found` reads like the grandest verb in the world and is nothing of the
  // kind: it is laying the first plank of a bridge, and it names an x and a y
  // that the engine then INSISTS are the citizen's own -- "the founder stands
  // on the crossing itself", which is the design, because the builder is
  // exposed in the water on the one tile a saboteur most wants to deny them.
  //
  // So it is an underfoot verb like kindling a watchfire, and it was the last
  // verb in the world no mouse could reach. The window had been reading it as
  // something that wanted a map and a pointed-at tile.
  //
  // Four conditions, each the engine's own: a founding that has spans at all,
  // a declared crossing under your feet, nothing standing there yet, and a
  // plank to lay.
  try {
    if (GG?.span && GEN?.spanSites && bare && carrying('planks') >= 1
        && GEN.spanSites(GG).some((sp) => sp.x === me.x && sp.y === me.y)) {
      out.push('found')
    }
  } catch { /* a generator that declares no crossings simply has none */ }
  return out
}

function pushFrame () {
  if (!held || held.tick === lastTick) return
  lastTick = held.tick
  const me = meNow()
  sendFrameUE({
    k: 'frame',
    tick: held.tick,
    me,
    // ---- AND WHAT THIS GROUND IS CALLED ----
    //
    // The generator names every region and every settlement on the island,
    // and until now the only thing that ever asked was a chat line. A window
    // that can say "Millbrook" under its map is a window a citizen can
    // navigate by -- and on an island where "meet me by the crooked oak" is
    // the sentence the whole design is built around, a map that shows a
    // picture of the ground and not its NAME is half a map.
    //
    // Derived here with the generator's own naming, like everything else the
    // world knows, so the name under the map is the name in the chat line and
    // the name on everybody else's screen.
    place: (() => {
      try { return me ? (TM.regionNameAt(me.x | 0, me.y | 0) ?? '') : '' }
      catch { return '' }
    })(),
    birth: birthOf(),
    // §6g: the bank counter within reach, and its contents. See `vaultHere`.
    vault: vaultHere(),
    // §5c: the offer you have out and the one standing to you. See `tradeNow`.
    trade: tradeNow(),
    // What the ground underfoot can be used for. See `verbsBeside`.
    atHand: verbsBeside(),
    // ...and what cannot be done at all from here, which is a different
    // question and not answerable from either affordance table. See
    // verbsBarred.
    barred: verbsBarred(),
    // And what may be done ON the tile itself. See `underfoot`.
    underfoot: underfoot(),
    // WHAT EACH CRAFT IS AT, AS A LEVEL.
    //
    // The frame already carries the raw experience and the window has been
    // printing it -- so a citizen who had chopped forty logs read "woodcraft
    // 720", which is a number about bookkeeping and not about them. The ladder
    // from experience to level is the engine's (`levelForXp`) and belongs on
    // this side of the socket with every other rule.
    //
    // It is also what makes a level-up an EVENT rather than a number ticking:
    // the window can only announce a crossing if somebody tells it where the
    // rungs are.
    levels: (() => {
      const me = meNow()
      if (!me?.skills) return {}
      const out = {}
      for (const [craft, xp] of Object.entries(me.skills)) {
        const held = xp ?? 0
        const level = E.levelForXp(held)
        // AND WHERE THE RUNGS EITHER SIDE ARE.
        //
        // "When hovering the skill I think it should show current xp and
        // maybe xp to next level. Maybe even a progress bar." All three want
        // the same two numbers, and both are answers about the engine's own
        // ladder -- so the window is told them rather than being handed a
        // formula to keep a copy of.
        out[craft] = {
          level,
          xp: held,
          from: RUNGS[level] ?? 0,
          next: RUNGS[level + 1] ?? 0,   // 0 at the top of the ladder
        }
      }
      return out
    })(),
    // §0: WHICH WORLD THIS FRAME IS OF, on every single frame.
    //
    // A practice island that draws the same towns, the same beasts and the
    // same weather is indistinguishable from the country at a glance, and
    // being unable to tell is the one failure Nought must not have. So this
    // rides on every frame rather than being announced once and remembered,
    // and the window is expected to say it somewhere that never scrolls away.
    nought: inNought() ? true : false,
    ceiling: ceilingOf(),
    door: { ...door, worldId: boot.worldId, playerId: ID.playerId, keyFile: KEYFILE },
    // EVERY CITIZEN, WITH WHAT THEY ARE AS WELL AS WHO.
    //
    // A nameplate over somebody's head said their name and nothing else, and
    // a name on its own is the least interesting thing about a citizen in a
    // world with callings in it. What they ARE -- a smith, a mourner, an
    // archer -- and how far they have come are the two things a stranger
    // wants to know before they speak.
    //
    // Both are DERIVED, not stored: `callingOf` reads the calling they swore
    // to and `standingOf` sums the levels of every skill. The engine does the
    // deriving, here, so no window has to know the rule -- and a founding that
    // changes how standing is counted changes it in one place.
    players: Object.fromEntries(Object.entries(held.players ?? {}).map(
      ([id, p]) => [id, { ...p,
        calling: E.callingOf(p) ?? '',
        standing: E.standingOf(p) ?? 0,
        // ---- AND WHETHER THEY HAVE MASTERED IT ----
        //
        // Derived here for the same reason `calling` and `standing` are: the
        // engine owns the arithmetic and a window that worked it out again
        // would agree until one of the two was edited.
        //
        // WHICH SKILL, NOT WHETHER. The window paints a sworn sash cut from
        // what that trade handles -- iron for the smith, shell for the fisher,
        // bone for the mourner -- so a boolean would leave it with nothing to
        // choose by. Empty means no mastery, which is nearly everybody.
        //
        // And there can only ever be ONE. §5k: nothing unsworn passes fifty
        // and nothing outside your own trade passes seventy, so a citizen
        // reaches a hundred in their own calling or in nothing.
        mastered: (() => {
          const c = E.callingOf(p)
          const sk = c ? (E.SWORN ?? {})[c]?.skill : null
          if (!sk) return ''
          return E.levelForXp(p.skills?.[sk] ?? 0) >= (E.MASTERY ?? 100) ? sk : ''
        })(),
        // ---- AND WHAT A SPELL HAS LEFT ON THEM ----
        //
        // Sorcery was invisible in this window, and not because the window was
        // lazy: NO SPELL SETS AN `action`. A citizen casting has no `action.type`
        // at all, so there was literally nothing for the window to key a motion
        // or an effect on, and all eleven spells across the two books looked
        // like nothing happening. Only `gather`, `raise` and the attacks ever
        // set one.
        //
        // What a spell DOES leave is a mark on whoever it landed on, and those
        // are ordinary world facts that anybody standing there can see. They
        // are forwarded as the intervals REMAINING rather than as the tick they
        // expire on, because the window has no business doing arithmetic with
        // the world's clock: zero means it is over.
        //
        // These are conditions, not actions. They say what somebody IS, not
        // what they are doing, which is why they sit beside `health` rather than
        // beside `action`.
        ...(() => {
          const now = held?.tick ?? 0
          const left = (k) => Math.max(0, (p[k] ?? 0) - now)
          const marks = {}
          for (const [field, word] of [['stilledUntil', 'stilled'],
                                       ['witheredUntil', 'withered'],
                                       ['rottingUntil', 'rotting'],
                                       ['rootedUntil', 'rooted'],
                                       ['brandedUntil', 'branded'],
                                       ['burnUntil', 'burning']]) {
            const n = left(field)
            if (n > 0) marks[word] = n
          }
          return Object.keys(marks).length ? { marks } : {}
        })(),
        // AND WHAT MAY BE DONE TO THEM, from here, by this citizen. See
        // `mayDoTo`. Only worked out for people near enough to be pointed
        // at -- the answer for somebody three hundred tiles away is a list
        // nobody will read and a rectangle test nobody asked for.
        may: (id !== ID.playerId
              && Math.abs((meNow()?.x ?? 0) - p.x) <= 24
              && Math.abs((meNow()?.y ?? 0) - p.y) <= 24)
          // AS ONE LINE OF WORDS, not a list. The window flattens a nested
          // OBJECT into dotted keys and leaves an array as its JSON text, so
          // a list would arrive as a string to be parsed anyway -- and this
          // is the shape every other field it reads already has.
          ? mayDoTo(meNow(), p, id).join(' ') : undefined }])),
    // AND WHAT MAY BE CAST AT A BEAST. Only `still` reaches one, and only
    // within sight of it; see `spellsAt`.
    mobs: Object.fromEntries(Object.entries(held.mobs ?? {}).map(
      ([id, m]) => [id, { ...m,
        may: (meNow() && Math.abs((meNow()?.x ?? 0) - m.x) <= 24
              && Math.abs((meNow()?.y ?? 0) - m.y) <= 24)
          ? spellsAt(meNow(), m, id, true).join(' ') : undefined }])),
    ground: held.ground ?? {},
    nodes: held.nodes ?? {},
    weather: held.weather ?? null,
    // What the light is doing, from the shared ladder. Flat numbers, so a
    // window can point a sun at them without knowing what a season is.
    sky: skyAt(held.tick),
  })
}

// ---------- §0: NOUGHT, THE PRACTICE OF THE WORLD ----------
//
// A key the world has never heard of is in Nought, and Nought is the same
// island: the same seed, the same towns, the same coastline, computed by the
// same pure functions. What it lacks is marks. Nothing done there is recorded,
// nothing crosses over, and no node but this one ever computes it.
//
// The window had none of it. A fresh citizen crossed the title card and then
// stood at a gate for five minutes with nothing to look at, which is the
// window telling somebody that the first thing this world asks of them is to
// wait. The spec asks for the opposite: the wait is real, so do not spend it
// staring.
//
// IT RUNS HERE, not in Unreal, for the same reason everything else does. The
// engine is already in this process, the terrain generator is already
// registered, and the frames Unreal reads are already the shape a state makes.
// So a practice island is a second state ticked on a timer and pushed down the
// same socket, and the window cannot tell the difference -- which is the
// point, because every panel, menu, beast and deed then works there for free.
//
// What tells the PERSON is a flag on every frame that never goes away.
let nought = null
let noughtLoading = false
// WHAT A RESIDENT IS GIVEN. Nothing here is scarce and nothing is recorded, so
// there is no argument for making somebody walk to Millbrook for a hatchet
// before they can find out what chopping feels like. Practising is the whole
// purpose; the tools are the practice.
const NOUGHT_WORN = { weapon: 'iron-hatchet', head: 'iron-helm',
  body: 'iron-plate', offhand: 'iron-shield' }
const NOUGHT_KIT = [['iron-pickaxe', 1], ['rod', 1], ['iron-sword', 1],
  ['wooden-bow', 1], ['arrows', 500], ['seeds', 25]]

async function ensureNought () {
  if (nought || noughtLoading) return
  noughtLoading = true
  try {
    const st = await getJson('/nought/world.json')
    // §0a: A PRACTICE WORLD IS A DIFFERENT WORLD BY ID. A pillar that served
    // the real founding here would have this bridge quietly running a private
    // copy of the country and calling it practice. Refuse it, do not run it.
    if (!E.isNought(st)) {
      throw new Error('that pillar served the world itself, not a practice of it')
    }
    E.markNoughtWorld(st)     // every signpost and crier says where you are
    const sp = E.spawnOf(st.genesis)
    E.addPlayer(st, ID.playerId, sp.x, sp.y)
    const p = st.players[ID.playerId]
    if (p) {
      let slot = 0
      for (const [item, qty] of NOUGHT_KIT) {
        if (slot < p.inventory.length) p.inventory[slot++] = { item, qty }
      }
      p.gold = 10000
      for (const [where, item] of Object.entries(NOUGHT_WORN)) {
        if (where in p.equipment) p.equipment[where] = { item, qty: 1 }
      }
    }
    E.nameNoughtBody(st, ID.playerId)
    // THE RESIDENT IS THE CITIZEN THEMSELVES, under their own id and signing
    // with their own key. The browser mints a throwaway because it may not
    // have the key to hand; this process does, and using it means the
    // nameplate, the door and the chat all say the same name on both sides of
    // the crossing. Nothing is risked: a Nought signature is checked by this
    // process alone and refused by the country by construction (§0a).
    nought = { state: st, inputs: [], wid: E.worldId(st.genesis) }
    nought.timer = HOST.every(E.TICK_MS ?? 1000, noughtTick)
    console.log('[bridge] nought: a practice of the world. nothing here is real.')
    held = st
    watched = { has: () => true }
    lastTick = -1
    pushFrame()
  } catch (e) {
    console.warn('[bridge] no practice island (' + (e.message ?? e) + ')')
    nought = 'failed'         // do not thrash the pillar retrying
  } finally {
    noughtLoading = false
  }
}

function endNought () {
  if (nought && nought.timer) HOST.stop(nought.timer)
  nought = null
  console.log('[bridge] you are in the world.')
  if (live) { held = live; lastTick = -1; pushFrame() }
}

function inNought () { return nought && nought !== 'failed' }

// WHICH OF THE TWO WORLDS THIS CITIZEN IS IN, decided once per interval off
// the country's own roll rather than off anything the window claims.
//
// Nought is not a room you enter. It is the set of keys the world does not
// hold, so a resident is in it from the moment their key exists and leaves it
// at the instant `spawn` lands -- and there is no returning, because after
// spawning the world holds you. This is that sentence, in code.
function minding () {
  const b = birthOf()
  if (!b) return
  if (b.state === 'in') { if (nought) endNought(); return }
  ensureNought()
}

function noughtTick () {
  if (!inNought()) return
  const ins = nought.inputs
  nought.inputs = []
  try {
    // The engine caches derived tables on the state object and they do not
    // survive being advanced; the browser's practice island clears the same
    // three, for the same reason.
    delete nought.state._grid
    delete nought.state._waterTiles
    delete nought.state._nodeTiles
    nought.state = E.nextState(nought.state, ins)
    held = nought.state
    pushFrame()
  } catch (e) {
    console.warn('[bridge] nought stumbled: ' + (e.message ?? e))
  }
}

// ---------- the pillar ----------
let up = null
function connectPillar () {
  const wsUrl = PILLAR.replace(/^http/, 'ws')
  up = HOST.dial(wsUrl)
  up.on('open', () => {
    console.log('[bridge] pillar open')
    // browser-held keys (v1.0): the pillar holds NOTHING for this citizen,
    // it merely relays what we signed. serve.mjs, §adopt.
    up.send(JSON.stringify({ type: 'adopt', pub: ID.playerId }))
    up.send(JSON.stringify({ type: 'resync' }))
  })
  up.on('message', (buf) => {
    let m; try { m = JSON.parse(buf) } catch { return }
    if (m.type === 'state') {
      live = m.state
      minding()
      if (inNought()) return          // the window is on the practice island
      held = live
      watched = { has: () => true }   // a snapshot holds the whole island
      pushFrame()
      return
    }
    if (m.type === 'patch') {
      if (!live) { up.send(JSON.stringify({ type: 'resync' })); return }
      applyTick(live, m.d)
      minding()
      if (inNought()) return
      held = live
      const me = meNow()
      if (me) { watched = new Set(zonesAround(me.x, me.y)); evictOutside(held, watched) }
      pushFrame()
      return
    }
    if (m.type === 'hello') { console.log('[bridge] adopted as ' + String(m.playerId).slice(0, 12) + '…'); return }
    // §refusals are out of band and non-consensus: the window gets to see its
    // own errors. Unreal shows them; it does not reason about them.
    if (m.type === 'refused') { sendUE({ k: 'refused', of: m.of, tick: m.tick, why: m.why }); return }
    if (m.type === 'chat') {
      // ---- WHO SAID IT, WHAT THEY ARE, AND WHERE THEY WERE STANDING ----
      //
      // The pillar relays a name and a line. A name on its own is the least
      // interesting thing about a speaker in a world with callings in it --
      // the same argument that put the calling on the nameplate -- and a world
      // where "meet me by the crooked oak" is a sentence people say needs the
      // PLACE as well, or half the island's conversation is unanswerable.
      //
      // All three are derived here, because this is where the world knowledge
      // lives. `regionNameAt` is the generator's own naming, so the place in
      // the chat is the place on everybody else's screen.
      const who = (live ?? held)?.players?.[m.playerId] ?? null
      let place = ''
      try { if (who) place = TM.regionNameAt(who.x | 0, who.y | 0) ?? '' } catch {}
      // WHICH CHANNEL. The pillar's relay does not carry `scope`, so when it
      // is absent it is inferred from the one fact that distinguishes the two
      // channels at this end: `near` reaches you only if the world already
      // says you are together. A line from somebody out of earshot cannot
      // have been a near one. A line from somebody beside you is called near
      // whichever it was, which is the truth a reader cares about -- they can
      // see the speaker.
      let scope = m.scope === 'far' || m.scope === 'near' ? m.scope : null
      if (!scope) {
        let together = false
        try { together = m.playerId === ID.playerId
          || (live && E.withinEarshot(live, m.playerId, ID.playerId)) } catch {}
        scope = together ? 'near' : 'far'
      }
      sendUE({ k: 'chat', playerId: m.playerId, name: m.name, text: m.text,
        scope, place,
        calling: who ? (E.callingOf(who) ?? '') : '',
        standing: who ? (E.standingOf(who) ?? 0) : 0,
        x: who ? (who.x | 0) : 0, y: who ? (who.y | 0) : 0 })
      return
    }
  })
  up.on('close', () => { console.warn('[bridge] pillar closed, retrying in 2s'); held = null; HOST.after(2000, connectPillar) })
  up.on('error', (e) => console.warn('[bridge] pillar error: ' + e.message))
}

// ---------- intents in, signatures out ----------
//
// THE ONLY PLACE A SIGNATURE IS MADE. Unreal sends a noun and a couple of
// integers; this builds the canonical input through the engine's own
// normalizer and signs it. Nothing here invents a field, renames one, or
// supplies a default — normalizeInput does that, so equivalent requests from
// this window and from /play produce byte-identical canonical bytes.
// IS THIS DEED EVEN THE RIGHT SHAPE? Asked with the world's own function.
//
// `validateInputShape` is exported by the engine and nothing on the way out
// had ever called it. `normalizeInput` already throws on a field that is
// missing or one it does not know -- tested: a bare `{type:'unwield'}` comes
// back as "normalizeInput: missing field gear on unwield" -- so this is not
// the only guard and was never the missing one. What it adds is the case
// normalisation lets through and the world will not: a field that is present,
// and normalises, and is the wrong TYPE for what the schema demands.
//
// It is here because a malformed intent is the WINDOW'S bug and the window is
// where it should be loud. Naming it exactly, on the refusal channel, is the
// difference between "nothing happened" and a sentence somebody can act on;
// and the deed is not sent, because a signature spent on a deed that cannot
// be judged is worse than a refusal for exactly that reason.
function wrongShape (input) {
  try {
    return E.validateInputShape ? E.validateInputShape(input) : null
  } catch (e) {
    return String(e.message ?? e)
  }
}

function act (fields) {
  if (!held) return { ok: false, why: 'no world yet' }
  // §0: NOTHING DONE IN NOUGHT REACHES THE WORLD. A resident's deeds go to
  // their own engine and are signed against their own world id, which the
  // country refuses by construction. The two exceptions are the knock and the
  // crossing, which are the only things a resident says to the world at all.
  if (inNought() && fields.type !== 'attend' && fields.type !== 'spawn') {
    try {
      const practice = E.signInput({
        worldId: nought.wid, tick: nought.state.tick, playerId: ID.playerId,
        ...E.normalizeInput(fields),
      }, ID.privateKey)
      const bad = wrongShape(practice)
      if (bad) {
        console.warn('[bridge] the window sent a deed the world cannot read: ' + bad)
        sendUE({ k: 'refused', of: fields.type, why: bad })
        return { ok: false, why: bad }
      }
      nought.inputs.push(practice)
      return { ok: true }
    } catch (e) {
      return { ok: false, why: String(e.message ?? e) }
    }
  }
  try {
    const canon = E.normalizeInput(fields)
    const input = E.signInput({
      worldId: boot.worldId, tick: (live ?? held).tick, playerId: ID.playerId, ...canon,
    }, ID.privateKey)
    // A DEED DROPPED HERE USED TO REPORT SUCCESS. If the pillar socket was
    // shut or still reconnecting, the send was skipped and `ok` came back
    // anyway -- so the window filed, heard nothing, and the world never saw
    // it. That is indistinguishable from a refusal with no reason, which is
    // the one failure this bridge exists to make impossible.
    const bad = wrongShape(input)
    if (bad) {
      console.warn('[bridge] the window sent a deed the world cannot read: ' + bad)
      sendUE({ k: 'refused', of: fields.type, why: bad })
      return { ok: false, why: bad }
    }
    if (up?.readyState !== 1) return { ok: false, why: 'the pillar is not listening' }
    up.send(JSON.stringify({ type: 'raw', input }))
    return { ok: true }
  } catch (e) {
    // a malformed intent is Unreal's bug, and it should be loud in Unreal
    return { ok: false, why: String(e.message ?? e) }
  }
}

// ---------- the local door Unreal knocks on ----------
HOST.door(PORT, (ws) => {
  ueClients.add(ws)
  ws.on('close', () => ueClients.delete(ws))
  ws.send(JSON.stringify({ k: 'hello', playerId: ID.playerId, ...boot }))
  if (held) { lastTick = -1; pushFrame() }
  ws.on('message', (buf) => {
    let m; try { m = JSON.parse(buf) } catch { return }
    if (m.k === 'terrain') {
      const skirt = Math.max(0, Math.min(4, m.skirt | 0))
      ws.send(JSON.stringify(terrainChunk(m.x0 | 0, m.y0 | 0, m.w | 0, m.h | 0, skirt)))
      return
    }
    // HOW FAR BEHIND THIS WINDOW IS, in its own words. See the note where
    // the window sends it: nothing on this side can tell, because the socket
    // has long since handed the bytes over.
    if (m.k === 'seen') {
      if (ws.seenTick === undefined) console.log('[bridge] the window reports what it has seen')
      ws.seenTick = m.tick | 0
      return
    }
    if (m.k === 'resync') { up?.send(JSON.stringify({ type: 'resync' })); return }
    // ---- CHAT, WHICH IS THE POINT OF THE WORLD ----
    //
    // Chat came DOWN this socket from the first day and there was never a way
    // to send any back up, so the window could hear the island and not answer
    // it. In a world built around people arranging to meet -- where the whole
    // rhythm of a tick a second and a walk that takes minutes exists to leave
    // room for talking -- that is not a missing feature, it is the feature.
    //
    // It is NOT a deed. Chat is out of band, like a refusal: it is not in
    // INPUT_SCHEMAS, it is not signed, it does not advance the world and it
    // cannot be refused by consensus. So it is relayed straight up, exactly as
    // it is relayed straight down, and nothing here reads it.
    if (m.k === 'chat') {
      // ---- AND IT HAS TO BE SIGNED, LIKE EVERYTHING ELSE THIS KEY SAYS ----
      //
      // This sent `{type:'chat', text}` up the socket, and the pillar has no
      // such message: it reads `adopt`, `nought`, `rawsay`, `raw` and `auth`,
      // and anything else falls off the end of the chain in silence. So every
      // line a citizen typed into this window went nowhere, with no refusal,
      // for as long as the chat box has existed -- which is exactly how it
      // looked from the chair: "when I try to talk by writing on the chat box,
      // nothing happens."
      //
      // A pillar holds nothing for an adopted key. It will not sign on this
      // citizen's behalf and it is right not to, so the frame is signed HERE,
      // in the one place the key lives, under the chat domain -- which is a
      // different domain from a deed's on purpose, so that a line of talk can
      // never be replayed as an act.
      //
      // Eighty characters, because that is what the world accepts; a longer
      // line is refused whole, and a citizen who typed one would watch it
      // vanish rather than see it cut.
      const text = String(m.text ?? '').slice(0, 80).trim()
      if (!text) return
      if (!held) { sendUE({ k: 'refused', of: 'chat', why: 'no world yet' }); return }
      if (up?.readyState !== 1) {
        sendUE({ k: 'refused', of: 'chat', why: 'the pillar is not listening' })
        return
      }
      // NEAR OR FAR, AND THE WINDOW CHOOSES. They are genuinely different
      // things to say -- the people around you, or the whole island -- and
      // the engine keeps them as two channels rather than as a permission.
      const scope = m.scope === 'far' ? 'far' : 'near'
      try {
        const msg = E.signInput({
          type: 'chat', worldId: boot.worldId, playerId: ID.playerId,
          tick: held.tick, text, scope,
        }, ID.privateKey, E.SIG_DOMAINS.chat)
        up.send(JSON.stringify({ type: 'rawsay', msg }))
      } catch (e) {
        sendUE({ k: 'refused', of: 'chat', why: String(e.message ?? e) })
      }
      return
    }
    // §0c: GET ME INTO THE WORLD, WHATEVER THAT CURRENTLY TAKES.
    //
    // Unreal says one word. It does not know that birth is two-phase, how long
    // the wait is, or that a bare spawn is refused forever with no wait behind
    // it -- the same reason sdk.mjs puts this in one place rather than in every
    // executor. The bridge knows the protocol; the window knows it wants in.
    //
    // Safe to send every interval: it knocks when there is nothing to wait on,
    // says so while the wait ripens, and crosses the moment it may.
    if (m.k === 'enter') {
      // WHETHER THIS IS AN ANSWER OR A REFUSAL, said in the message.
      //
      // All four of these went out on the refusal channel, so a knock that
      // WORKED was announced to the citizen as "refused: enter — knocking:
      // the wait starts now". Every word of that is true except the first,
      // and the first is the one a reader believes.
      const answer = (why, ok) => ws.send(JSON.stringify({
        k: 'refused', of: 'enter', why, ok: ok === true }))
      const b = birthOf()
      if (!b) { answer('no world yet', false); return }
      if (b.state === 'in') return
      if (b.state === 'unknown' || b.state === 'lapsed') {
        const r = act({ type: 'attend' })
        answer(r.ok ? 'knocking: the wait starts now' : r.why, r.ok)
        return
      }
      if (b.state === 'waiting') {
        answer('the wait is not ripe (' + b.waited + '/' + b.ripeAt + ')', true)
        return
      }
      const r = act({ type: 'spawn' })
      answer(r.ok ? 'crossing into the world' : r.why, r.ok)
      return
    }
    // ---- CARRYING A CITIZEN BETWEEN WINDOWS ----
    //
    // Somebody starts in the browser because it costs nothing, gets a few
    // levels, and then downloads this window. Without these they are a
    // stranger here: the bridge mints a fresh key on first run and their
    // browser citizen stays in the browser.
    //
    // THE KEY DOES NOT CROSS THIS SOCKET, IN EITHER DIRECTION. That is the one
    // rule this whole file exists to keep: Unreal is given no way to sign, so
    // a compromised .uproject cannot act as you. Handing the window the key so
    // it could show it to somebody would throw that away for a convenience.
    //
    // So the clipboard is the courier and the bridge is the only thing that
    // touches the key. The window sends a verb and is told what happened. It
    // never sees a byte of the secret, and it does not need to: the person
    // pastes into the browser themselves.
    //
    // The two formats are one key in two coats, which window-web.html's own
    // importer already says: PKCS8 for Ed25519 is the raw 32-byte seed behind
    // a fixed 16-byte prefix, so `interval-key-v1.<pkcs8>.<pub>` and this
    // bridge's `{playerId, privateKey}` convert without either side deciding
    // anything.
    if (m.k === 'carry-out' || m.k === 'carry-in') {
      const said = (ok, why, who) => ws.send(JSON.stringify(
        { k: 'carry', of: m.k === 'carry-out' ? 'out' : 'in', ok, why, who }))
      const PK8 = '302e020100300506032b657004220420'
      if (m.k === 'carry-out') {
        const str = 'interval-key-v1.' + PK8
          + Buffer.from(ID.privateKey).toString('hex') + '.' + ID.playerId
        // A FILE ALWAYS, THE CLIPBOARD WHERE THERE IS ONE. The clipboard is
        // the whole convenience, but a person whose pbcopy is missing should
        // not be told their citizen cannot leave: the file is the answer that
        // always works, and it says where it is.
        const beside = KEYFILE.replace(/\.json$/, '') + '-carry.txt'
        let wrote = false
        try { fs.writeFileSync(beside, str + '\n'); wrote = true }
        catch { /* reported below: the clipboard may still have carried it */ }
        let clipped = false
        try {
          if (process.platform === 'darwin') {
            execFileSync('pbcopy', { input: str })
            clipped = true
          }
        } catch { /* the file is still there */ }
        if (!wrote && !clipped) { said(false, 'could not write the key anywhere', null); return }
        said(true, clipped
          ? 'this citizen is on your clipboard. Paste it into the browser window\u2019s "import key".'
          : 'written to ' + beside + '. Open it and paste the line into the browser window\u2019s "import key".',
          ID.playerId)
        return
      }
      // CARRYING ONE IN. Read the clipboard here rather than being handed a
      // string: a string the window could send is a string the window has.
      let raw = ''
      try {
        if (process.platform !== 'darwin') throw new Error('no clipboard on this platform yet')
        raw = String(execFileSync('pbpaste')).trim()
      } catch (e) {
        said(false, 'cannot read the clipboard here (' + (e.message ?? e) + ')', null); return
      }
      // THE SECRET MUST BE EXACTLY THIRTY-TWO BYTES, and that is checked HERE.
      //
      // `importIdentity` derives the public key and compares it, but only
      // `if (privateKey.length === 32)` -- which is right for the engine,
      // because it also has to admit the legacy formats `loadOrCreateIdentity`
      // migrates. It means a SHORT key skips the proof entirely, and this
      // accepted one: a paste truncated to four bytes was written over a
      // living citizen and reported as success, because nothing between the
      // clipboard and the file ever asked how long it was.
      //
      // A key that cannot sign is worse than no key. The door is strict here
      // rather than the engine being made strict everywhere, because the
      // engine's looseness is load-bearing and this door's is not.
      let record = null
      const v1 = /^interval-key-v1\.([0-9a-f]+)\.([0-9a-f]{64})$/.exec(raw)
      if (v1 && v1[1].length === PK8.length + 64 && v1[1].startsWith(PK8)) {
        record = { playerId: v1[2], privateKey: v1[1].slice(PK8.length) }
      } else if (raw.startsWith('{')) {
        try {
          const j = JSON.parse(raw)
          if (/^[0-9a-f]{64}$/.test(j.privateKey ?? '') && /^[0-9a-f]{64}$/.test(j.playerId ?? ''))
            record = { playerId: j.playerId, privateKey: j.privateKey }
        } catch {}
      }
      if (record && !/^[0-9a-f]{64}$/.test(record.privateKey)) record = null
      if (!record) { said(false, 'that is not an interval key. Copy it from the browser window first.', null); return }
      // AND IT MUST PROVE ITSELF. `importIdentity` derives the public key from
      // the secret and refuses a pair that does not match, so a mistyped or
      // truncated paste cannot quietly overwrite a citizen with a dead one.
      try { E.importIdentity(record) }
      catch (e) { said(false, 'that key does not prove itself: ' + (e.message ?? e), null); return }
      if (record.playerId === ID.playerId) { said(true, 'that is already who you are', ID.playerId); return }
      // THE ONE THIS REPLACES IS KEPT. Overwriting a key file is deleting a
      // citizen, and doing it silently because somebody had the wrong thing on
      // their clipboard is the one mistake here that cannot be undone.
      try {
        const aside = KEYFILE.replace(/\.json$/, '') + '-' + ID.playerId.slice(0, 8) + '.json'
        if (!fs.existsSync(aside)) fs.copyFileSync(KEYFILE, aside)
      } catch { /* best effort: the write below is the important one */ }
      try {
        HOST.writeKey(KEYFILE, { playerId: record.playerId, privateKey: record.privateKey,
          note: 'THIS FILE IS THE CITIZEN. Back it up; do not commit it.' })
      } catch (e) { said(false, 'could not write ' + KEYFILE + ': ' + (e.message ?? e), null); return }
      console.log('[bridge] carried in ' + record.playerId.slice(0, 12) + '\u2026 (was '
        + ID.playerId.slice(0, 12) + '\u2026); restart to become them')
      // NOT A LIVE SWAP. `ID` is read once at startup and every signature,
      // every subscription and the pillar's own idea of who is connected hang
      // off it. Changing it under a running session would mean reconnecting as
      // somebody else halfway through a tick, and a half-swapped identity is a
      // worse bug than an extra restart.
      said(true, 'this citizen is yours now. Close interval and open it again to become them.',
        record.playerId)
      return
    }
    if (m.k === 'do') {
      const { k, ...fields } = m
      // WHAT THE WINDOW ACTUALLY SENT, verbatim. A deed that works when typed
      // here and fails when clicked there is a difference nobody can reason
      // about from either side; printing the bytes ends the argument.
      console.log('[deed] ' + JSON.stringify(fields.input ?? fields))
      const r = act(fields.input ?? fields)
      if (!r.ok) ws.send(JSON.stringify({ k: 'refused', of: (fields.input ?? fields).type ?? '?', why: r.why }))
      return
    }
  })
})
console.log('[bridge] unreal door on ws://127.0.0.1:' + PORT)

await announceWorld()
await refreshDoor()
// The finalized tick moves on the pillar's own schedule, not ours; five
// seconds is often enough to see it fall behind and never often enough to
// matter to anyone.
HOST.every(5000, refreshDoor)?.unref?.()
connectPillar()
