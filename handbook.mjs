// THE HANDBOOK, MADE OUT OF THE WORLD IT DESCRIBES.
//
// A printed manual is a promise that the thing it describes will not change.
// That promise was always a little false: a patch shipped and the book on the
// shelf quietly became wrong. Here it can be kept, because the rules were
// fixed at the founding and the hash of `engine.js` is the world's name. A
// copy of this book records a world that cannot move under it.
//
// So every fact in it is READ FROM `engine.js` rather than written out beside
// it. Nobody has to remember to update a page when a number changes, because
// there is no page to update: there is a query. The prose is written by hand
// and the tables are not, which is the only division that survives contact
// with a world of seventeen thousand lines.
//
// AND IT IS ILLUSTRATED BY THE WORLD TOO. The first cut of this came out
// looking like a thesis: black type on a white page, no pictures anywhere.
// The manuals it is modelled on were not like that, and the difference is not
// nostalgia, it is that somebody drew them. This one needs no illustrator.
// The window already renders every item in the world as a sprite, from the
// actual mesh a citizen carries, so the book is illustrated with the things
// it describes. A reader who sees a hatchet on a page has seen the hatchet,
// not a drawing of one.
//
// WHAT GOES IN, AND WHAT MUST NOT. `engine.js` is rules; the island is state.
// The rules belong to everybody and are published here in full: what a calling
// is, what a shield costs, why nothing outside your own trade passes seventy.
// The island's contents are not rules and are not here: where the iron
// actually is, what is in which town, who settled where. That is what the
// world has become rather than what it is, and finding it out is the whole of
// playing. Publish the rules, never the answers.
//
// HOW IT IS LAID OUT. A5 pages, imposed two to a sheet of A4 landscape for
// saddle stitching: print double sided, fold the stack in half, staple twice
// in the crease. Imposition is why the pages come out of order on screen, and
// that is not a trick to stop anybody reading it there. It is simply what a
// booklet is, and the awkwardness on screen is the same awkwardness a printer
// has always handed back.
//
//   node handbook.mjs            writes site/handbook-print.html and a proof
//   node handbook.mjs --pdf      and asks Chrome to print it
import E from './engine.js'
import * as WG from './worldgen-expanse7.mjs'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

// The path, not the URL's pathname: a directory with a space in it arrives
// percent-encoded and `readFileSync` takes it literally, so the world could
// not be weighed from a folder called "Unreal Projects".
const HERE = fileURLToPath(new URL('.', import.meta.url))
const ART = HERE + '../interval/Art/Icons/'
const WORLD = createHash('sha256').update(readFileSync(HERE + 'engine.js')).digest('hex')

// ---------------------------------------------------------------------------
// THE WORLD'S OWN WORDS, ASKED FOR RATHER THAN REMEMBERED
const T = (k, fallback = {}) => E[k] ?? fallback
// A NUMBER THE WORLD DOES NOT HAVE STOPS THE PRESS.
//
// This book's whole claim is that every figure in it is the figure the world
// uses. A fallback quietly breaks that: the off-trade ceiling was read from
// `CAP_OFFTRADE`, which does not exist, and printed the 70 written beside it
// as a default. The number happened to be right and the book was lying about
// where it came from, which is worse than being wrong loudly. The real name
// is CAP_OTHER. Nothing here defaults any more.
// A NUMBER THE ENGINE KEEPS TO ITSELF.
//
// Not everything the book needs is exported. `DEATH_TICKS` and `PRAYER_KEEP`
// are plain constants inside `engine.js` and nothing hands them out, but they
// are rules and a reader needs them. Read out of the source, which this file
// already holds every byte of in order to weigh it, and with the same refusal
// as `NUM`: if the constant is not there under that name, the book does not
// print rather than printing a remembered value.
let _src = null
const CONST = (name) => {
  _src ??= readFileSync(HERE + 'engine.js', 'utf8')
  const m = _src.match(new RegExp('\\bconst ' + name + '\\s*=\\s*(-?\\d+)\\s*;'))
  if (!m) throw new Error(`engine.js has no const ${name}: the handbook must not invent one`)
  return Number(m[1])
}

const NUM = (k) => {
  const v = E[k]
  if (typeof v !== 'number') {
    throw new Error(`the world has no ${k}: the handbook must not invent one`)
  }
  return v
}
const keys = (k) => Object.keys(T(k))
const say = (s) => String(s).replace(/-/g, ' ')          // `old-chain` is an id, not a name
const title = (s) => say(s).replace(/^./, (c) => c.toUpperCase())
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))

// ---- THE PICTURES, CARRIED INSIDE THE FILE ----
//
// Embedded rather than linked, because the PDF has to survive being emailed,
// put on a memory stick and printed at somebody else's work. A book that
// loses its illustrations the moment it leaves this folder is not a book.
const seen = new Map()
const art = (name) => {
  if (!name) return null
  if (seen.has(name)) return seen.get(name)
  const f = ART + name + '.png'
  const uri = existsSync(f)
    ? 'data:image/png;base64,' + readFileSync(f).toString('base64')
    : null
  seen.set(name, uri)
  return uri
}
// Several names in, the first that has a picture. The vocabulary is being
// renamed around this book and a page that silently loses its illustration
// because a word moved is worse than a page that never had one.
const pic = (names, cls = 'ico') => {
  for (const n of [].concat(names)) {
    const u = art(n)
    if (u) return `<img class="${cls}" src="${u}" alt="">`
  }
  return `<span class="${cls}"></span>`
}

const bySkill = () => {
  const out = {}
  for (const [trade, row] of Object.entries(T('SWORN'))) (out[row.skill] ??= []).push(trade)
  return out
}

// One object to stand for each craft, picked because a reader knows it on
// sight. The world has no such table and should not have one: this is the
// BOOK's opinion about what a craft looks like, which is a book's job.
const EMBLEM = {
  woodcraft: 'iron-hatchet', earthcraft: 'iron-pickaxe', shorecraft: 'raw-fish',
  mourning: 'bones', marksmanship: 'wooden-bow', sorcery: 'staff',
  hearthcraft: 'bread', prowess: 'iron-sword', wayfaring: 'chart',
}

const kindOf = (item) => {
  const slot = T('EQUIP_SLOT')[item]
  if (T('WEAPONS')[item] || slot === 'weapon') return 'arms'
  if (T('ARMOUR')[item] || slot) return 'armour'
  if (T('RECIPES')[item] || T('SMITH_REQS')[item]) return 'made'
  return 'goods'
}
const priced = (i) => (T('PRICES')[i] != null ? `${T('PRICES')[i]}` : '')

// ---------------------------------------------------------------------------
// THE COAST, DRAWN FROM THE GENERATOR AND NOT FROM A PICTURE OF IT.
//
// The first version of this traced `site/tallyholm.png`, the survey map, and
// that was wrong twice over. A survey carries every town, road and place name,
// all of which is STATE and must never be printed; and a picture is a picture,
// taken on a day, which went stale the moment the world gained the dragon's
// isle. It was missing from the cover and there was no way for anybody to
// know except by noticing.
//
// The island's SHAPE is not state. It falls out of `worldgen-expanse7.mjs` at
// the founding, exactly the way a recipe falls out of engine.js, so the book
// can ASK for it. `inSea` is the world's own predicate, isles and all, so a
// coast drawn this way cannot be out of date: add an isle to the generator and
// the next print has it.
//
// THE SIZE IS NOT IN THE GENERATOR, which takes it from the founding record.
// Established rather than guessed: at 896 by 512 the land comes out at 50.5%,
// which matches the survey to a tenth of a percent, and the Lists isle is
// written into the generator at y=452, so anything shorter puts it off the
// edge of the world. WORLDGEN_MIN is 448 by 256, exactly half of each.
const WORLD_W = 896, WORLD_H = 512

// As runs of land per row rather than as a raster: it is vector, so it is
// crisp at any size on paper, and a row of open sea costs nothing at all.
const coast = () => {
  const g = { genesisSeed: WG.TALLYHOLM_SEED, worldW: WORLD_W, worldH: WORLD_H }
  const out = []
  for (let y = 0; y < WORLD_H; y++) {
    let x = 0
    while (x < WORLD_W) {
      if (WG.inSea(g, x, y)) { x++; continue }
      const from = x
      while (x < WORLD_W && !WG.inSea(g, x, y)) x++
      // A HAIR OVER ONE TALL, so the rows overlap. At exactly one the
      // renderer antialiases each row's edge against the next and the island
      // comes out striped like corrugated iron.
      out.push(`<rect x="${from}" y="${y}" width="${x - from}" height="1.04"/>`)
    }
  }
  return `<svg class="coast" viewBox="0 0 ${WORLD_W} ${WORLD_H}"
     xmlns="http://www.w3.org/2000/svg"><g fill="#2e2418">${out.join('')}</g></svg>`
}

// ---------------------------------------------------------------------------
// PAGES
const P = []
const page = (cls, html) => P.push({ cls, html })

// An ornament rather than a line. A rule across a page is a document; a rule
// with something set into the middle of it is a book.
const orn = '<div class="orn"><span></span><b>&#9670;</b><span></span></div>'
const h = (t) => `<h2>${esc(t)}</h2>`
const p = (t) => `<p>${t}</p>`
// The opening letter of a chapter, set large. Every manual worth keeping did
// it, and it costs nothing but a rule in the stylesheet.
const pd = (t) => `<p class="drop">${t}</p>`

// ---- 1. the cover
// THE COVER IS THE COAST, which is the one picture a manual always had and
// the only map this book is allowed: the shape without anything on it.
page('cover', `
  <div class="crest">${coast()}</div>
  <h1>INTERVAL</h1>
  <div class="sub">A HANDBOOK</div>
  ${orn}
  <div class="worldline">world ${WORLD.slice(0, 12)}</div>
  <div class="foot">One interval a second since the founding</div>`)

// WHICH INTERVAL THIS COPY WAS PRINTED AT.
//
// The line used to say "founded at interval", which is a number every copy
// would carry and every copy would share: the founding is interval zero and
// always will be. What is worth recording is when THIS COPY was made, because
// the world has been running since zero and a book is a thing somebody printed
// on a particular day of it.
//
// Blank by default, for the owner to fill in. `--printed N` stamps it instead,
// which is what a proper print run wants: one number, set once, the same on
// every copy in the run.
const _stamp = process.argv.indexOf('--printed')
const PRINTED = _stamp > 0 && process.argv[_stamp + 1] !== undefined
  ? String(process.argv[_stamp + 1]).replace(/[^0-9]/g, '') || '0'
  : null

// ---- 2. inside the cover: whose copy this is
page('plate', `
  ${h('This copy belongs to')}
  <div class="fill"><span class="lbl">Citizen</span><span class="line"></span></div>
  <div class="fill"><span class="lbl">Printed at interval</span>${
    PRINTED === null ? '<span class="line"></span>'
                     : `<span class="line stamped">${PRINTED}</span>`}</div>
  <div class="fill"><span class="lbl">Sworn to</span><span class="line"></span></div>
  ${orn}
  ${p(`This book describes world <b>${WORLD.slice(0, 12)}</b>. That is not a
      version number: it is a checksum of the rules. Change one character of
      them and you get a different world with a different name. Nothing in this
      book can go out of date, because nothing in the rules can change.`)}`)

// ---- 3. what this is
page('', `
  ${h('About interval')}
  ${pd(`Interval is an online world run by the computers of the people playing
      it. There is no company behind it and no server that owns it. There is no
      account either. You have a key, and the key is your citizen.`)}
  ${p(`The rules were set when the world was founded and cannot be changed by
      anyone, including the people who wrote them. That is why nobody can ban
      you, patch you or shut it down, and why this book can be printed at
      all.`)}
  ${p(`This book lists the rules: the crafts, the items, the recipes, the
      spells and the levels. It does not tell you what to do, where anything
      is, or how to make money. Those are not rules, and you work them out by
      playing.`)}
  ${orn}
  ${p(`How the world is drawn is not part of the rules. The window you are
      using is one way of showing it and there is no official one. You can
      write your own and it counts the same.`)}`)

// ---- 4. the interval
page('', `
  ${h('The interval')}
  ${pd(`The world advances one interval every second, whether or not anyone is
      playing. Everything happens on an interval: a step, an attack, a log cut,
      a line of chat.`)}
  ${p(`Nothing speeds this up. There is nothing to buy, and the world does not
      pause when you log off.`)}
  ${orn}
  ${h('Ninety minutes')}
  ${p(`You can play one citizen for ninety minutes a day. This is in the
      rules, so every window enforces it.`)}
  ${p(`When the ninety minutes are used up, you are done for the day.`)}`)

// ---- 5. the crafts
const SK = bySkill()
page('', `
  ${h('The nine crafts')}
  ${p(`Every citizen has the same nine and can train all of them. The right
      column lists the trades you can swear to in that craft.`)}
  <table class="crafts">
    ${(T('SKILLS').length ? T('SKILLS') : keys('SKILLS')).map((s) => `
      <tr><td class="em">${pic(EMBLEM[s])}</td>
          <td class="k">${esc(title(s))}</td>
          <td class="t">${esc((SK[s] ?? []).map(say).join(', ') || 'none')}</td></tr>`).join('')}
  </table>`)

// ---- 6. mastery
page('', `
  ${h('Swearing to a trade')}
  ${p(`You can swear to one trade once you reach <b>${NUM('SWEAR_LEVEL')}</b> in
      its craft. It is the only craft you can master.`)}
  <table class="tight">
    <tr><td class="k">Unsworn</td><td>nothing passes ${NUM('CAP_UNSWORN')}</td></tr>
    <tr><td class="k">Outside your trade</td><td>nothing passes ${NUM('CAP_OTHER')}</td></tr>
    <tr><td class="k">Your own craft</td><td>mastery at ${NUM('MASTERY')}</td></tr>
  </table>
  ${p(`Nothing stacks up across crafts. Each citizen masters one craft and
      stays middling at the other eight, so most of what you need you will get
      from other players.`)}
`)

page('', `
  ${h('The titles')}
  ${p(`What a master of each craft is called.`)}
  <table class="tight">
    ${Object.entries(T('CALLINGS')).map(([skill, name]) =>
      `<tr><td class="k">${esc(title(skill))}</td><td>${esc(say(name))}</td></tr>`).join('')}
  </table>
  ${orn}
  ${h('Past mastery')}
  ${p(`Mastery is a power cap, not a level cap. Everything in the world uses
      your level or ${NUM('MASTERY')}, whichever is lower, so nothing you do
      gets stronger past it. Levels carry on to
      <b>${T('XP_TABLE', []).length - 1}</b> and count for nothing but
      showing how long you have played.`)}
  ${p(`They do give you apprentice slots, one at each of
      ${T('APPRENTICE_MILESTONES', []).join(', ') || String(NUM('MASTERY'))},
      so a high-level master can teach more people.`)}`)

// ---- 7. what you can carry
page('', `
  ${h('Carrying')}
  ${p(`Your pack holds <b>${NUM('INV_SLOTS')}</b> items. Crafting only uses
      what is in your pack, never what is in the bank, so you have to decide
      what to take before you leave town.`)}
  <div class="pack">${Array.from({ length: NUM('INV_SLOTS') }, () => '<i></i>').join('')}</div>
  ${orn}
  ${h('Worn')}
  <table class="tight">
    ${(T('EQUIP_SLOTS').length ? T('EQUIP_SLOTS') : keys('EQUIP_SLOTS'))
      .map((s) => `<tr><td class="k">${esc(title(s))}</td><td></td></tr>`).join('')}
  </table>`)

// ---- 8 onward: the vocabulary, with every word's picture beside it
//
// GROUPED BY FAMILY AND ORDERED BY TIER, not listed alphabetically. The first
// cut sorted the whole vocabulary by name, which scattered `iron-sword`,
// `steel-sword` and the rest of the line across three pages and told a reader
// nothing. There WAS no structure in it, and there is structure in the world:
// the vocabulary names itself `<tier>-<family>`, so `sword` has four members
// and `helm` has six. A manual's job is to put the line in front of you at
// once, so a family with more than one member gets its name and its members in
// order of grade. What is one of a thing goes at the end, where a list is all
// it ever needed to be.
const TIER_ORDER = ['bare', 'iron', 'steel', 'quick', 'quick', 'great', 'gold',
  'shell', 'bone', 'horn', 'hollow', 'sigil', 'dragon', 'heartwood', 'ironbark',
  'oak', 'old', 'king', 'crab', 'raw', 'cooked', 'smoked', 'salt', 'burnt',
  'deep', 'fire', 'holy', 'grave']
const TIER_RANK = Object.fromEntries(TIER_ORDER.map((t, i) => [t, i]))
const parts = (id) => {
  const bits = id.split('-')
  return bits.length > 1 && TIER_RANK[bits[0]] != null
    ? { tier: bits[0], family: bits.slice(1).join('-') }
    : { tier: '', family: id }
}

const ALL = [...new Set([
  ...keys('PRICES'), ...keys('RECIPES'), ...keys('EQUIPPABLE'), ...keys('STACKABLE'),
])].sort()

// A page is a run of UNITS: a family's name, or one word of the vocabulary.
// Packed by height rather than by count, because a heading and a word are not
// the same size and counting rows is how three pages ran off the bottom.
const LABEL_MM = 8.0, CELL_MM = 5.4, ROOM_MM = 148
// The closing note and its ornament only appear on the LAST page of a section,
// so that page has less room than the others. Packing every page the same and
// then adding four lines of italic to the end of one is how page twelve ran
// off the bottom by twenty pixels.
const NOTE_MM = 26
// ---- WHICH FIGURE A PAGE SHOWS ----
//
// Not the same one everywhere, because the useful fact is not the same
// everywhere. For something you hold, the number that matters is the level
// you need to hold it: a stall's price for a quick sword tells a reader
// nothing they can act on, and "prowess 50" tells them why they cannot pick
// it up. For goods and made things there is no such gate, so the price is the
// fact worth printing.
const wieldOf = (it) => Object.entries(T('WIELD_REQS')[it] ?? {})[0] ?? null
const figure = (it) => {
  const w = wieldOf(it)
  return w ? String(w[1]) : priced(it)
}
// A TWO-HANDED WEAPON MEANS NO SHIELD, which is the single most consequential
// thing about a weapon after what it hits for, and nothing in this book said
// it. Marked rather than columned: there are twenty-one of them and a whole
// column of blanks would be worse than a mark.
const TWO = T('TWO_HANDED') instanceof Set ? T('TWO_HANDED')
  : new Set(Object.keys(T('TWO_HANDED')))
const cell = (it) => ({ mm: CELL_MM, html: `<div class="cell">${pic(it)}<span class="nm">${
  esc(say(it))}${TWO.has(it) ? '<b class="two">+</b>' : ''}</span><span class="n">${
  figure(it)}</span></div>` })
// AND THE CRAFT GOES ON THE FAMILY, not in every cell. Six different crafts
// gate wielding, so a bare number would be ambiguous; but a family is all one
// weapon in five grades, so every member of it answers to the same craft and
// saying it once is enough.
const label = (t, craft) => ({ mm: LABEL_MM,
  html: `<div class="fam">${esc(t)}${craft ? `<i>${esc(craft)}</i>` : ''}</div>` })

const GROUPS = [['arms', 'Arms'], ['armour', 'Armour'], ['made', 'Made things'], ['goods', 'Goods']]
for (const [kind, heading] of GROUPS) {
  const mine = ALL.filter((i) => kindOf(i) === kind)
  const fams = new Map()
  for (const it of mine) {
    const { family } = parts(it)
    ;(fams.get(family) ?? fams.set(family, []).get(family)).push(it)
  }
  const units = []
  const singly = []
  for (const [family, members] of [...fams].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (members.length < 2) { singly.push(members[0]); continue }
    members.sort((a, b) => (TIER_RANK[parts(a).tier] ?? 99) - (TIER_RANK[parts(b).tier] ?? 99)
      || a.localeCompare(b))
    const crafts = new Set(members.map((m) => wieldOf(m)?.[0]).filter(Boolean))
    units.push(label(title(family), crafts.size === 1 ? [...crafts][0] : ''),
               ...members.map(cell))
  }
  if (singly.length) units.push(label('Other'), ...singly.sort().map(cell))

  // AND SPLIT WHERE IT FITS, never leaving a family's name at the foot of a
  // page with its members overleaf.
  const pages = [[]]
  const tall = [0]
  let used = 0
  for (let i = 0; i < units.length; i++) {
    const u = units[i]
    const orphan = u.mm === LABEL_MM && used + u.mm + CELL_MM * 2 > ROOM_MM
    if (used + u.mm > ROOM_MM || orphan) { pages.push([]); tall.push(0); used = 0 }
    pages[pages.length - 1].push(u)
    used += u.mm
    tall[tall.length - 1] = used
  }
  // AND THE LAST PAGE MAKES ROOM FOR THE NOTE. Whatever will not fit beside it
  // goes over the leaf, taking its family's name with it rather than stranding
  // the name on one page and its members on the next.
  while (tall[tall.length - 1] > ROOM_MM - NOTE_MM && pages[pages.length - 1].length > 1) {
    const moved = [pages[pages.length - 1].pop()]
    while (pages[pages.length - 1].length &&
           pages[pages.length - 1][pages[pages.length - 1].length - 1].mm === LABEL_MM) {
      moved.unshift(pages[pages.length - 1].pop())
    }
    tall[tall.length - 1] -= moved.reduce((a, u) => a + u.mm, 0)
    if (pages[pages.length - 1].length === 0) { pages.pop(); tall.pop() }
    pages.push(moved)
    tall.push(moved.reduce((a, u) => a + u.mm, 0))
    if (tall[tall.length - 1] <= ROOM_MM - NOTE_MM) break
  }
  pages.forEach((units_, n) => {
    page('', `
      ${h(n ? `${heading} (continued)` : heading)}
      <div class="grid">${units_.map((u) => u.html).join('')}</div>
      ${n === pages.length - 1
        ? `${orn}${p(`<i>Where a craft is named beside the family, the number is
            the level you need to hold the thing. Everywhere else it is what a
            stall pays for one, and blank means stalls do not buy it. A + means
            it takes both hands, so no shield.</i>`)}`
        : ''}`)
  })
}

// ---- THE SPELLS, WHICH WERE MISSING ALTOGETHER ----
//
// A whole calling was absent from this book, and then the first attempt at it
// printed SEVEN, because it read the level ladder and the ladder names only
// the milestones. There are eleven, in two books, and `engine.js` says so
// plainly in `BOOKS`.
//
// READ OUT OF THE SOURCE, because `BOOKS` is not exported: the engine keeps
// it private and `speaks()` is the only way in. The handbook already holds
// every byte of engine.js in order to weigh it, so the two sets are lifted
// from that text rather than from a memory of it, and if either one cannot be
// found the book refuses to print. A handbook that quietly drops a spellbook
// is worse than no handbook.
const bookOf = (which) => {
  const src = readFileSync(HERE + 'engine.js', 'utf8')
  const m = src.match(new RegExp(which + ":\\s*new Set\\(\\[([^\\]]*)\\]"))
  if (!m) throw new Error(`engine.js no longer has a ${which} spellbook where this book looks`)
  const spells = [...m[1].matchAll(/'([a-z]+)'/g)].map((x) => x[1])
  if (!spells.length) throw new Error(`the ${which} spellbook read as empty`)
  return spells
}
const COMMON = bookOf('common'), BARROW = bookOf('barrow')

// What each one is FOR, in the world's own words where it has them. The levels
// come from the ladder; a spell the ladder does not name has none of its own.
const SPELL_IS = {
  transmute: 'turn a thing into money', unmake: 'take a thing apart',
  mend: 'close your own wounds', mendp: "close somebody else's, with a wand",
  still: 'hold a fight still',
  // NOT "shut a way", which is what the engine's own summary comment still
  // says. §6bn changed this spell and the list at the top of BOOKS was never
  // brought along: what it does is lock a dead citizen's dropped pack so only
  // they can pick it up, and hold off the rot while it lasts. Read from the
  // handler, not from the note above it.
  seal: "hold a dropped pack for whoever lost it",
  anchor: 'the recall to Anchor',
  waking: '', rot: '', taking: '', withering: '',
}
const UNLOCKS = typeof E.skillUnlocks === 'function' ? E.skillUnlocks() : {}
const RUNG = {}
for (const r of UNLOCKS.sorcery ?? []) {
  const w = String(r.text).replace(/^the /, '').split('\u2014')[0].trim()
  if (RUNG[w] == null) RUNG[w] = r.level
}
// THE LADDER NAMES THE RITE AND THE BOOK NAMES THE VERB, and they are not
// always the same word: the ladder says `transmute` where the book says
// `transmute`, and `stilling` where the book says `still`. Where a verb has no rung
// of its own the column is simply empty, which is true: not every spell is a
// milestone.
const RITE_OF = { transmute: 'transmute', still: 'stilling', mendp: 'mend' }
const rungOf = (v) => RUNG[v] ?? RUNG[RITE_OF[v] ?? ''] ?? ''

const spellRows = (list) => list.map((v) => `<tr>
    <td class="lv">${rungOf(v)}</td>
    <td class="k">${esc(say(v))}</td>
    <td>${esc(SPELL_IS[v] ?? '')}</td></tr>`).join('')

page('', `
  ${h('The spells')}
  ${p(`There are <b>${COMMON.length + BARROW.length}</b> spells, split between
      two spellbooks. A citizen has one book or the other, never both. Casting
      a spell uses up a sigil.`)}
  ${orn}
  ${h('The common book')}
  <table class="tight rites">${spellRows(COMMON)}</table>
  ${p(`<i>None of these damage anyone. They block, heal or break things
      down.</i>`)}`)

page('', `
  ${h('The barrow book')}
  ${p(`The other spellbook. These are the ones that harm.`)}
  <table class="tight rites">${spellRows(BARROW)}</table>
  ${orn}
  ${p(`<i>What each spell does, and what it costs, is not listed here.</i>`)}
  ${p(`No spell from either book works on the Lists.`)}`)

// ---- DYING ----
//
// THE BIGGEST HOLE IN THIS BOOK. Nothing in it said what happens when you are
// killed, which is the one rule a reader most needs before it happens to them.
page('', `
  ${h('Dying')}
  ${pd(`When you are killed you drop everything you were carrying. It lies on
      the ground where you fell, for anyone to pick up, and it rots after a
      while like anything else left out.`)}
  ${p(`The world pauses over you for ${CONST('DEATH_TICKS')} intervals and then
      you are up again. Nothing is taken from your crafts: levels do not fall
      here, and there is no penalty beyond the loss of what you had on you.`)}
`)

page('', `
  ${h('What is counted')}
  ${p(`Your deaths are counted, forever, and the number never falls. It is not
      a punishment and nothing in the world reads it except the boards. You are
      free to farm it if you want to, at the price of everything you are
      carrying each time.`)}
  ${p(`Kills are <b>not</b> counted, and that is deliberate. A kill count would
      be worth something, and the cheapest way to earn it would be to make new
      citizens and cut them down. A death count is a joke you paid for.`)}
  ${orn}
  ${h('What can be saved')}
  ${p(`At mourning ${CONST('PRAYER_KEEP')} the most valuable priced thing
      you are carrying survives your death. Only priced things: the ore, the
      blades, the plate. What this world is really worth keeping is not on any
      price list, and a sigil, a chart or an old chain is exactly as losable as
      it always was.`)}
  ${p(`Somebody with a goo-staff can also seal your dropped pack where it
      lies, which holds it for you and stops it rotting. See the spells.`)}`)

// ---- WHERE THE RULES CHANGE ----
page('', `
  ${h('The Wilds')}
  ${pd(`Most of the island is ordinary ground, where nobody may strike you
      without answering for it. The Wilds are not. Anybody may hunt anybody
      there, and nobody is coming.`)}
  ${p(`Everything worth the most is there, which is the trade: the quick rock,
      the mother lode, the deep water, the gallows-oaks. You cannot reach the
      end of any craft without going, and every trip back is carrying
      something worth taking.`)}
  ${p(`Magic will not carry you out of it either. The recall is the one spell
      that works there and it goes to Anchor, and you may be cut down in the
      middle of casting it.`)}
  ${orn}
  ${h('The Lists')}
  ${p(`An isle off Fenmarch, reached by boat. Anybody may strike anybody, and
      no spell from either book works at all.`)}
  ${p(`It is for a fight that is only about the fight. With the magic gone and
      nothing else in the way, a mell and a bare blade can be compared
      honestly.`)}`)

// ---- GAMBITS ----
//
// A gambit is a weapon's own move, and seven weapons have one. It belongs in
// this book for the same reason the spells do: it is a rule, it is not
// discoverable by looking at the weapon, and a player who never learns it is
// simply playing without a mechanic.
//
// WHAT IT COSTS IS THE POINT, and it is not a bar that fills. Using one spends
// your arm for a number of intervals afterwards, and the engine says so: "it
// is deliberately NOT confined to PvP, the cost confines it". So the recovery
// is the most useful number on the page and it is printed beside each one.
const gambits = Object.entries(T('WEAPONS'))
  .filter(([, w]) => w && w.gambit)
  .sort((a, b) => String(a[1].gambit).localeCompare(String(b[1].gambit))
    || a[0].localeCompare(b[0]))
if (!gambits.length) {
  throw new Error('no weapon in this world has a gambit; the book names a mechanic that is gone')
}

// What each kind actually does, read out of the resolver rather than guessed
// at. The first draft said a whole-body blow was "one blow with everything in
// it", which is a feeling rather than a rule and told a reader nothing they
// could act on.
const GAMBIT_IS = {
  flurry: 'several blows in one go, each rolled to hit as usual',
  whole: "one blow at the weapon's hardest, and harder to land",
  now: 'does not wait for your arm after an ordinary swing',
  far: 'the damage comes from the range, not the weapon',
}
page('', `
  ${h('Gambits')}
  ${p(`Seven weapons have a move of their own. Blows is how many it lands.
      Recovery is how many intervals your arm is spent for afterwards. Costs
      is that recovery measured against the weapon's ordinary swing: how many
      normal blows you gave up to make this one.`)}
  <table class="tight gambits">
    <tr class="head"><td></td><td></td><td></td>
        <td class="lv">blows</td><td class="lv">recovery</td>
        <td class="lv">costs</td></tr>
    ${gambits.map(([w, g]) => {
      // WORKED OUT, NOT QUOTED. The engine's own note says a gambit "costs TWO
      // ordinary blows", which is the DEFAULT recovery, twice a weapon's
      // cadence. Every weapon that has a gambit states its own recovery
      // instead, so the default never applies and the real figure runs from
      // three quarters of a blow to four.
      const every = g.every ?? 2
      const rec = g.rec ?? every * 2
      const cost = rec / every
      return `<tr>
      <td class="em">${pic(w)}</td>
      <td class="k">${esc(say(w))}</td>
      <td>${esc(String(g.gambit))}</td>
      <td class="lv">${g.blows ?? 1}</td>
      <td class="lv">${rec}</td>
      <td class="lv">${cost % 1 ? cost.toFixed(2).replace(/0$/, '') : cost}</td></tr>`
    }).join('')}
  </table>
`)

page('', `
  ${h('The four kinds')}
  <table class="tight kinds">
    ${Object.entries(GAMBIT_IS).map(([k, t]) =>
      `<tr><td class="k">${esc(k)}</td><td>${esc(t)}</td></tr>`).join('')}
  </table>
  ${orn}
  ${p(`A far shot is weaker than a dagger at touching range and the hardest
      blow in the world at the end of its nine tiles. The range is the whole
      of its damage, not an addition to it.`)}
  ${p(`A report is the handgonne alone. Its burst was scaled down when a
      citizen's flesh became a flat sixty-four, and all of the damage went into
      the single shot: the hardest blow in the world, and the least accurate.
      It is the only gambit more likely to miss than to land.`)}
  ${p(`What a gambit costs is not the same for every weapon. The recovery is
      measured against that weapon's own swing, so the cost column on the
      previous page is how many ordinary blows you gave up for it: four for a
      quick dagger, two for a mell, less than one for a handgonne.`)}
  ${p(`Each kind is meant to pay that cost back in its own coin. A flurry pays
      in blows, a whole in size, a now in timing, a far in distance.`)}
  ${p(`Master your own craft and the arm comes back a quarter sooner, which is
      what prowess gives instead of hitting harder.`)}`)

// ---- GATHERING ----
//
// The KINDS, never the places. What a rock is, what comes out of it and what
// it asks of you are rules and belong to everybody. Where the rocks are is
// state, and finding that out is the game.
const YIELD = T('NODE_YIELD'), GATE = T('NODE_GATE')
const ground = Object.entries(YIELD).sort((a, b) =>
  (a[1].skill ?? '').localeCompare(b[1].skill ?? '') ||
  ((GATE[a[0]]?.level ?? 1) - (GATE[b[0]]?.level ?? 1)))
// Fourteen rows to a page, for the same reason the recipes take fourteen: the
// illustration sets the height and eighteen ran off the bottom by sixty
// millimetres. `--check` is what says so.
const GROUND_PER = 11
for (let gi = 0; gi < ground.length; gi += GROUND_PER) {
const groundPart = ground.slice(gi, gi + GROUND_PER)
page('', `
  ${h(gi ? 'Gathering (continued)' : 'Gathering')}
  ${gi ? '' : p(`Everything you can gather from, what it gives, and the level you
      need to use it.`)}
  <table class="tight ground">
    ${groundPart.map(([n, y]) => `<tr>
      <td class="em">${pic(y.item)}</td>
      <td class="k">${esc(say(n))}</td>
      <td>${esc(say(y.item))}${y.qty > 1 ? ` &times;${y.qty}` : ''}</td>
      <td class="lv">${GATE[n]?.level ?? 1}</td></tr>`).join('')}
  </table>
  ${gi + GROUND_PER >= ground.length
    ? `${orn}${p('<i>This book does not say where any of it is on the island.</i>')}`
    : ''}`)
}

// ---- THE KEEPERS ----
//
// Twenty-three kinds of them, and the world names each one itself in
// `CALLING_NAMES`: the axe man, the delver, the bridge-keeper. Nothing in the
// book said they existed, which left a reader with no idea who in a town will
// take a thing off them or sell them one.
//
// WHAT they deal in is a rule; WHERE any of them stands is not, and is not
// here.
const KEEPERS = Object.entries(T('CALLING_NAMES'))
if (!KEEPERS.length) throw new Error('this world has no keepers; the book names a thing that is gone')
for (let i = 0; i < KEEPERS.length; i += 16) {
  const part = KEEPERS.slice(i, i + 16)
  page('', `
    ${h(i ? 'The keepers (continued)' : 'The keepers')}
    ${i ? '' : p(`Every town has some. They buy and sell, and each one deals in
        one thing only.`)}
    <table class="tight keepers">
      ${part.map(([kind, name]) => `<tr>
        <td class="k">${esc(say(name))}</td>
        <td>${esc(say(kind))}</td></tr>`).join('')}
    </table>
    ${i + 16 >= KEEPERS.length
      ? `${orn}${p('<i>Which town has which, and where they stand in it, this book does not say.</i>')}`
      : ''}`)
}

// ---- recipes
const RE = Object.entries(T('RECIPES'))
// FOURTEEN, AND THE NUMBER WAS MEASURED. Twenty was a guess and three of
// these pages ran off the bottom by about forty millimetres each, which the
// box silently clipped: the last rows were simply not there. The illustration
// sets the row height here, not the type, so a recipe row is about ten
// millimetres and fourteen of them is what fits under a heading.
// `node handbook.mjs --check` is what says so.
const MADE_PER = 14
for (let i = 0; i < RE.length; i += MADE_PER) {
  const part = RE.slice(i, i + MADE_PER)
  page('', `
    ${h(i ? 'Recipes (continued)' : 'Recipes')}
    <table class="made">
      ${part.map(([out, ins]) => `<tr>
        <td class="em">${pic(out)}</td>
        <td class="k">${esc(say(out))}</td>
        <td>${esc(Object.entries(ins).map(([k, n]) => `${n} ${say(k)}`).join(', '))}</td></tr>`).join('')}
    </table>`)
}

// ---- creatures
const MOBS = Object.entries(T('MOB_STATS'))
for (let i = 0; i < MOBS.length; i += 24) {
  page('', `
    ${h(i ? 'Creatures (continued)' : 'Creatures')}
    <div class="beasts">
      ${MOBS.slice(i, i + 24).map(([m]) => `<span>${esc(say(m))}</span>`).join('')}
    </div>
    ${i + 24 >= MOBS.length
      ? `${orn}${p('<i>This book does not say where they live.</i>')}`
      : ''}`)
}

// ---- the last page
page('last', `
  ${h('The founding')}
  ${p('This book describes the world with the following id, and no other.')}
  <div class="hash">${WORLD.replace(/(.{32})/, '$1<br>')}</div>
  ${orn}
  ${p(`Take a SHA-256 checksum of the rules yourself and you should get this.
      If you get something else, you are playing a different world.`)}
  <div class="plateart">${pic('cinder-crown', 'big')}</div>
  <div class="foot">interval.place</div>`)

// ---------------------------------------------------------------------------
// IMPOSITION. Saddle stitch: the sheet count rounds the page count up to a
// multiple of four, and the sheets are numbered from the outside in, so the
// first sheet carries the last page beside the first.
while (P.length % 4) page('blank', '')
const N = P.length
const sheets = []
for (let i = 0; i < N / 2; i += 2) {
  sheets.push([P[N - 1 - i], P[i]])
  sheets.push([P[i + 1], P[N - 2 - i]])
}

// ---------------------------------------------------------------------------
// THE PAPER.
//
// Not white. The first cut of this was black type on a white page and it read
// as a report rather than as a book, which was the whole of what was wrong
// with it. So: a warm stock with some age in it, brown ink rather than black,
// an ochre a home printer can actually lay down, a ruled frame on every page,
// and an ornament wherever a plain line would otherwise have gone.
const CSS = `
@page { size: A4 landscape; margin: 0; }
* { box-sizing: border-box; margin: 0; }
html, body { background: #fff; }
body { font: 10.5pt/1.52 "Iowan Old Style", Palatino, "Palatino Linotype", Georgia, serif;
  color: #2f2418; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.sheet { width: 297mm; height: 210mm; display: flex; page-break-after: always; }
.half { width: 148.5mm; height: 210mm; padding: 17mm 15mm; position: relative;
  overflow: hidden; background: #f4ecda;
  background-image:
    radial-gradient(60mm 46mm at 18% 12%, rgba(176,150,102,.14), transparent 70%),
    radial-gradient(52mm 40mm at 86% 78%, rgba(176,150,102,.12), transparent 70%),
    radial-gradient(40mm 34mm at 60% 42%, rgba(150,122,78,.07), transparent 70%); }
/* THE FRAME, which is what says "book" before a word of it is read. Two rules,
   the inner one a hairline. */
.half::before { content: ""; position: absolute; inset: 7mm;
  border: 1.1pt solid #8a6a22; pointer-events: none; }
.half::after { content: ""; position: absolute; inset: 8.4mm;
  border: .4pt solid rgba(138,106,34,.55); pointer-events: none; }
.blank::before, .blank::after { display: none; }
/* THE CONTENT SITS IN A BOX OF A KNOWN HEIGHT, which is what makes overflow a
   measurement rather than an opinion. 210mm of page less 17mm of padding top
   and bottom, less a little room above the folio. */
.body { height: 172mm; overflow: hidden; }

h1 { font-size: 33pt; letter-spacing: 6pt; text-align: center; font-weight: 400;
  margin-top: 4mm; color: #2a2015; }
h2 { font-size: 12.5pt; letter-spacing: 1.6pt; text-transform: uppercase;
  font-weight: 600; margin-bottom: 5mm; color: #6b4f16;
  border-bottom: .5pt solid rgba(138,106,34,.5); padding-bottom: 2mm; }
p { margin-bottom: 3.6mm; text-align: justify; hyphens: auto; }
p.drop::first-letter { float: left; font-size: 30pt; line-height: 25pt;
  padding: 1mm 2mm 0 0; color: #8a6a22; font-weight: 600; }
table + p, table + .orn, .grid + .orn, .beasts + .orn { margin-top: 5mm; }

.orn { display: flex; align-items: center; gap: 3mm; margin: 6mm 0; }
.orn span { flex: 1; height: 0; border-top: .6pt solid rgba(138,106,34,.65); }
.orn b { color: #8a6a22; font-size: 7pt; line-height: 1; }

.sub { text-align: center; letter-spacing: 4.5pt; font-size: 10.5pt;
  margin-top: 3mm; color: #6b4f16; }
.crest { text-align: center; margin-top: 8mm; height: 44mm;
  display: flex; align-items: center; justify-content: center; }
.crest svg.coast { width: 104mm; height: 44mm; opacity: .9; }
.worldline, .foot { text-align: center; font-size: 8.5pt; color: #7b6544;
  letter-spacing: .6pt; }
.foot { position: absolute; bottom: 15mm; left: 0; right: 0; }

table { width: 100%; border-collapse: collapse; }
td { padding: 1.2mm 0; vertical-align: middle; }
.tight td.k { width: 44%; font-weight: 600; padding-right: 3mm; }
.crafts td.em { width: 11mm; }
.crafts td.k { width: 30mm; font-weight: 600; }
.crafts td.t { color: #4a3a26; }
.made td.em { width: 9mm; }
.made td.k { width: 30mm; font-weight: 600; padding-right: 2mm; }
.made td { font-size: 9.5pt; }
.rites td.lv, .ground td.lv { width: 11mm; color: #8a6a22; text-align: right;
  padding-right: 3mm; font-size: 9.5pt; }
.rites td.k { width: 34mm; }
.ground td.em { width: 9mm; }
.ground td.k { width: 32mm; font-weight: 600; }
.ground td { font-size: 9.5pt; }
.ground td.lv { text-align: right; padding-right: 0; }
.gambits td.em { width: 9mm; }
.gambits td.k { width: 30mm; font-weight: 600; }
.gambits td { font-size: 9.5pt; }
.keepers td.k { width: 42mm; font-weight: 600; }
.keepers td { font-size: 9.5pt; }
.gambits td.lv { width: 15mm; text-align: right; padding-left: 2mm; }
.gambits td.k { width: 26mm; }
/* The headings sit over the figures rather than in a note at the foot, so a
   reader knows what the numbers are before reading them and not after. */
.kinds td.k { width: 26mm; }
.gambits tr.head td { font-size: 7.5pt; letter-spacing: .1em; text-transform: uppercase;
  color: #8a6a22; padding-bottom: 1.6mm; border-bottom: .4pt solid rgba(138,106,34,.35); }
/* ON PAPER A SPRITE NEEDS WEIGHT. These were drawn to sit in a dark inventory
   slot at thirty-two pixels; on cream at seven millimetres they washed out to
   nothing. Contrast, a little more colour, and a shadow under them so they sit
   ON the page rather than float above it. */
img.ico, span.ico { width: 7.6mm; height: 7.6mm; display: inline-block;
  object-fit: contain; vertical-align: middle;
  filter: contrast(1.18) saturate(1.05) brightness(.94)
          drop-shadow(.25mm .35mm .3mm rgba(70,52,28,.45)); }
.crafts img.ico { width: 10mm; height: 10mm; }
img.big { width: 36mm; height: 36mm; object-fit: contain;
  filter: contrast(1.14) saturate(1.02)
          drop-shadow(.4mm .5mm .5mm rgba(70,52,28,.4)); }
.plateart { text-align: center; margin-top: 7mm; }

/* The vocabulary: a picture, a name and a price, two to a row. */
.grid { display: flex; flex-wrap: wrap; }
.cell { width: 50%; display: flex; align-items: center; gap: 2mm;
  padding: .9mm 2mm .9mm 0; break-inside: avoid; }
.cell .nm { flex: 1; font-size: 9.5pt; }
.cell .n { color: #8a6a22; font-size: 8.5pt; }
/* A family's name, across both columns, so the line beneath it reads as a
   line and not as a coincidence of alphabet. */
.fam i { float: right; font-style: normal; text-transform: none;
  letter-spacing: 0; color: #9a8158; font-size: 8pt; }
.cell .two { color: #8a6a22; font-weight: 400; padding-left: .6mm; }
.fam { width: 100%; font-size: 8.5pt; letter-spacing: 1.2pt; text-transform: uppercase;
  color: #8a6a22; margin: 3mm 0 1mm; padding-bottom: .8mm;
  border-bottom: .4pt solid rgba(138,106,34,.35); }
.grid > .fam:first-child { margin-top: 0; }

.beasts { column-count: 2; column-gap: 8mm; }
.beasts span { display: block; padding: 1.1mm 0; break-inside: avoid; }

.pack { display: grid; grid-template-columns: repeat(6, 1fr); gap: 2mm;
  margin: 5mm 0 2mm; }
.pack i { display: block; height: 11mm; border: .7pt solid rgba(138,106,34,.55);
  background: rgba(176,150,102,.10); border-radius: .8mm; }

.fill { margin-bottom: 7mm; }
.fill .lbl { display: block; font-size: 8.5pt; letter-spacing: 1pt;
  text-transform: uppercase; color: #7b6544; margin-bottom: 2mm; }
.fill .line { display: block; border-bottom: .6pt solid rgba(138,106,34,.6); height: 6mm; }
/* A stamped run carries its number on the rule rather than leaving it blank. */
.fill .stamped { font: 13pt/6mm "Iowan Old Style", Palatino, Georgia, serif;
  color: #2f2418; }
.hash { font: 10.5pt/1.7 "SF Mono", Menlo, monospace; text-align: center;
  letter-spacing: 1pt; margin: 7mm 0; word-break: break-all; color: #4a3a26; }
.num { position: absolute; bottom: 10.5mm; left: 0; right: 0; text-align: center;
  font-size: 8pt; color: #9a8158; }
.cover .num, .blank .num, .last .num { display: none; }
`

const numberOf = (pg) => P.indexOf(pg) + 1
const html = `<!doctype html><meta charset="utf-8">
<title>Interval Handbook</title><style>${CSS}</style>
${sheets.map((s) => `<div class="sheet">${s.map((pg) => `
  <div class="half ${pg.cls}"><div class="body">${pg.html}</div><div class="num">${numberOf(pg)}</div></div>`).join('')}
</div>`).join('\n')}
`

const out = HERE + 'site/handbook-print.html'
writeFileSync(out, html)

// ---- AND A FILE FOR A PRINT SHOP, WHICH WANTS THE OPPOSITE ----
//
// `handbook-print.html` is imposed: two A5 pages laid on a sheet of A4 in the
// order a home printer needs to fold and staple them. Send THAT to a printer
// and you get a mess, because a print shop imposes the job itself, on its own
// press, for its own paper and binding. What they ask for is single pages in
// reading order at the finished size, and they will refuse or silently ruin
// anything else.
//
// So this is the same pages, one to a sheet of A5, numbered 1 to N in order,
// with no imposition at all. It is what to send if a run is ever printed
// properly.
//
//   node handbook.mjs --shop            single A5 pages, reading order
//   node handbook.mjs --shop --printed 0  ...with the run's interval stamped
if (process.argv.includes('--shop')) {
  const shop = `<!doctype html><meta charset="utf-8">
<title>Interval Handbook, for print</title><style>${CSS}
@page { size: A5; margin: 0; }
body { background: #fff; }
.sheet { width: 148.5mm; height: 210mm; display: block; page-break-after: always; }
.half { box-shadow: none; }
</style>
${P.map((pg, i) => `<div class="sheet"><div class="half ${pg.cls}">${pg.html}<div class="num">${
  i + 1}</div></div></div>`).join('\n')}
`
  const at = HERE + 'site/handbook-shop.html'
  writeFileSync(at, shop)
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  const pdf = HERE + 'site/handbook-shop.pdf'
  execFileSync(chrome, ['--headless', '--disable-gpu', '--no-pdf-header-footer',
    `--print-to-pdf=${pdf}`, pathToFileURL(at).href], { stdio: 'inherit' })
  console.log(`${P.length} single A5 pages in reading order -> ${pdf}`)
}

// A PROOF, IN READING ORDER, WHICH IS NOT THE THING ANYBODY PRINTS.
//
// The printed file is imposed, so on screen it is a pile of mismatched
// spreads and impossible to check a page against the page it follows. This is
// the same pages laid out one after another, purely so the words can be read
// while they are being written. It is never published.
const proof = `<!doctype html><meta charset="utf-8">
<title>Interval Handbook, proof</title><style>${CSS}
@page { size: A5; margin: 0; }
body { background: #4b4234; padding: 8mm; }
.sheet { width: auto; height: auto; display: flex; flex-wrap: wrap; gap: 6mm;
  page-break-after: auto; }
.half { box-shadow: 0 3px 14px rgba(0,0,0,.45); }
</style>
<div class="sheet">${P.map((pg, i) => `
  <div class="half ${pg.cls}"><div class="body">${pg.html}</div><div class="num">${i + 1}</div></div>`).join('')}
</div>`
writeFileSync(HERE + 'site/handbook-proof.html', proof)
console.log(`${P.length} pages, ${sheets.length} sheets, ${
  [...seen.values()].filter(Boolean).length} illustrations`)

// ---- DOES ANY PAGE RUN OFF THE BOTTOM ----
//
// Asked of a browser rather than counted by hand. Rows per page used to be a
// guess and the guess was wrong: some vocabulary pages ran past the frame and
// the words at the foot simply vanished, because the box clips. This loads the
// proof, measures every page's content against its box, and names the ones
// that do not fit.
if (process.argv.includes('--check')) {
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  const probe = HERE + 'site/handbook-check.html'
  writeFileSync(probe, proof + `
<script>
  const over = []
  document.querySelectorAll('.body').forEach((b, i) => {
    if (b.scrollHeight > b.clientHeight + 2) {
      over.push((i + 1) + ' by ' + (b.scrollHeight - b.clientHeight) + 'px')
    }
  })
  document.title = 'OVERFLOW ' + (over.length ? over.join(' | ') : 'none')
</script>`)
  const dom = execFileSync(chrome, ['--headless', '--disable-gpu', '--dump-dom',
    '--virtual-time-budget=4000', pathToFileURL(probe).href], { encoding: 'utf8' })
  const m = dom.match(/OVERFLOW ([^<]*)/)
  console.log('pages that do not fit: ' + (m ? m[1] : 'could not measure'))
}

if (process.argv.includes('--pdf')) {
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  const pdf = HERE + 'site/handbook.pdf'
  execFileSync(chrome, ['--headless', '--disable-gpu', '--no-pdf-header-footer',
    `--print-to-pdf=${pdf}`, pathToFileURL(out).href], { stdio: 'inherit' })
  console.log('printed ' + pdf)
}
