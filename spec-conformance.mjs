#!/usr/bin/env node
// spec-conformance.mjs — does the constitution describe the engine that exists?
//
// SPEC.md is bound by the rules hash. An independent implementation is built
// from SPEC, not from engine.js. Anywhere the two disagree, that implementation
// computes a different state hash, fails to attest, and is silently excluded
// from the world — which is the one failure mode this protocol cannot tolerate.
//
// NON-CONSENSUS: static analysis only. Reads SPEC.md and the engine's exported
// registries; touches no state.
//
// Usage: node spec-conformance.mjs [--quiet]

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const E = require(path.resolve(here, 'engine.js'))
const spec = fs.readFileSync(path.resolve(here, 'SPEC.md'), 'utf8')
const quiet = process.argv.includes('--quiet')

let failures = 0
const report = (label, bad, note) => {
  if (!bad.length) { if (!quiet) console.log(`  ok    ${label}`) ; return }
  failures += bad.length
  console.log(`  FAIL  ${label}  (${bad.length})`)
  if (note) console.log(`        ${note}`)
  for (const b of bad) console.log(`          ${b}`)
}

// Line number of the first occurrence of a token, for actionable output.
const lines = spec.split('\n')
const lineOf = (tok) => {
  const i = lines.findIndex(l => l.includes(tok))
  return i === -1 ? '?' : i + 1
}

console.log('SPEC.md vs engine.js conformance\n')

// ---- 1. item names ------------------------------------------------------
// Backticked hyphenated lowercase tokens in SPEC that look like item names.
// Filtered against known non-item vocabularies so this stays low-noise.
const iter = (v) => !v ? [] : (Array.isArray(v) || v instanceof Set) ? [...v] : Object.keys(v)
const NOT_ITEMS = new Set([
  ...iter(E.SKILLS), ...iter(E.NODE_TYPES), ...iter(E.EQUIP_SLOTS), ...iter(E.CALLINGS),
  ...iter(E.KEEPER_KINDS), ...iter(E.CALLING_NAMES),
])
const backticked = new Set()
for (const m of spec.matchAll(/`([a-z]+(?:-[a-z]+)+)`/g)) backticked.add(m[1])
const itemish = [...backticked].filter(t =>
  !NOT_ITEMS.has(t) && !t.includes('_') &&
  // exclude protocol/file/topic vocabulary
  !/^(interval|world|state|next|prev|max|min|spec|consensus|rules|genesis|round|tick|bundle|finality|attestation|witness|quorum|byzantine|protocol|offer|accept|cancel|player|node|mob|ground)-/.test(t))

// A retired name may be NAMED in the act of retiring it. A line that says
// "this listed a `bronze-flail` that exists in no table" is the constitution
// doing its job, not drifting: the test is whether the name is used as though
// the thing were real. Lines that retire it explicitly are exempt.
const retiringLine = (tok) => lines.some(l =>
  l.includes('`' + tok + '`') &&
  /(exists in no|no longer exists|does not exist|was retired|is retired|stood here|superseded|repealed)/i.test(l))
const unknownItems = itemish
  .filter(t => !E.ITEMS.has(t))
  .filter(t => !retiringLine(t))
  .filter(t => /^(bronze|iron|steel|star|great|gold)-/.test(t) || t.endsWith('-ingot'))
  .filter(t => !E.MOB_STATS[t] && !iter(E.NODE_TYPES).includes(t))
  .map(t => `${t}  (SPEC.md:${lineOf('`' + t + '`')})`)
report('every equipment-like item named in SPEC exists in ITEMS', unknownItems,
  'SPEC names gear the engine does not implement — a reimplementer would build items that cannot exist.')

// ---- 1b. stat and recipe TABLE ROWS name real items ---------------------
// The item scan above only sees backticked tokens. SPEC's weapon and recipe
// tables write bare names in aligned columns -- `bronze-flail  hit 1 · every 2`
// -- and a stale row there is worse than a stale sentence: it is a complete
// specification of a thing that does not exist, which an implementer would
// dutifully build.
{
  const bad = []
  const seen = new Set()
  const body = spec.slice(0, spec.indexOf('# Part 20') === -1 ? spec.length : spec.indexOf('# Part 20'))
  for (const line of body.split('\n')) {
    // a row is: <name> followed by two or more <key> <value> pairs or bullets
    const m = line.match(/^\s*([a-z][a-z-]{3,})\s{2,}(?:hit |ore |acc |\S+\s+\d)/)
    if (!m) continue
    const name = m[1]
    if (seen.has(name)) continue
    seen.add(name)
    // Not everything in an aligned column is an item: the bestiary, the
    // countries and the column headers all live in tables too.
    if (E.MOB_STATS[name] || iter(E.NODE_TYPES).includes(name)) continue
    if (['country','heartlands','downs','greenwood','fens','moor','crags','wilds',
         'name','arith','geom','common','barrow','level','item','recipe','weapon',
         'skill','node','tier','kind','style','calling'].includes(name)) continue
    // Only flag names that LOOK like gear or goods: hyphenated, or a known
    // metal tier. A bare English word in a column is prose, not a row.
    if (!name.includes('-') && !/^(iron|steel|star|great|gold|bronze)/.test(name)) continue
    if (!E.ITEMS.has(name) && !E.RECIPES[name] && !E.WEAPONS[name])
      bad.push(`a table row specifies "${name}", which is in no ITEMS, RECIPES or WEAPONS table`)
  }
  report('every stat or recipe table row names a real item', bad,
    'A stale table row is a complete specification of a thing that does not exist.')
}

// ---- 2. recipes ---------------------------------------------------------
const recipeNames = new Set(Object.keys(E.RECIPES))
const specRecipeRows = []
for (const l of lines) {
  const m = l.match(/^\|\s*`([a-z-]+)`\s*\|\s*[\d]+\s+\w/)
  if (m) specRecipeRows.push(m[1])
}
const badRecipes = specRecipeRows
  // A calling is not a recipe. The §5r table reads `| berserker | 56 | ... |`,
  // which is the same shape as a craft row and is not one.
  .filter(r => !Object.prototype.hasOwnProperty.call(E.SWORN, r))
  .filter(r => !recipeNames.has(r))
  .map(r => `${r}  (SPEC.md:${lineOf('`' + r + '`')})`)
report('every recipe tabulated in SPEC exists in RECIPES', badRecipes,
  'SPEC publishes craft recipes the engine will refuse.')

// ---- 2b. recipe graph reachability -------------------------------------
// A recipe naming an ingredient that is not a constitutional item can never
// be crafted by anyone, ever. Pre-founding this is a one-line fix; after
// founding the recipe table is constitutional and fixing it founds a new world.
{
  const bad = []
  for (const [prod, ingredients] of Object.entries(E.RECIPES)) {
    if (!E.ITEMS.has(prod)) bad.push(`${prod} — recipe product is not in ITEMS`)
    for (const k of Object.keys(ingredients)) {
      if (!E.ITEMS.has(k)) bad.push(`${prod} requires \`${k}\`, which is not in ITEMS — permanently uncraftable`)
    }
  }
  report('every recipe is craftable (products and ingredients are real items)', bad,
    'A recipe whose ingredient does not exist is dead content that cannot be fixed after founding.')
}

// ---- 2c. recipes must fit in a pack ------------------------------------
// A recipe is only real if a citizen can HOLD its ingredients. Nothing reads
// from the bank at an anvil, non-stackable ingredients cost a slot each, and
// the product needs a slot of its own -- so a recipe needing INV_SLOTS or more
// is dead content however correct its ingredient list looks.
//
// This is not hypothetical: the mastery tier shipped uncraftable.
{
  const bad = []
  for (const [prod, ingredients] of Object.entries(E.RECIPES)) {
    let slots = 0
    for (const [item, qty] of Object.entries(ingredients)) slots += E.STACKABLE.has(item) ? 1 : qty
    if (slots > E.INV_SLOTS) bad.push(`${prod} needs ${slots} slots, pack holds ${E.INV_SLOTS} — cannot be held at all`)
    else if (slots === E.INV_SLOTS) bad.push(`${prod} needs ${slots} slots, exactly filling the pack — no free slot for the product`)
  }
  report(`every recipe fits in a ${E.INV_SLOTS}-slot pack`, bad,
    'A recipe whose ingredients cannot be carried is uncraftable regardless of its ingredient list.')
}

// ---- 3. persisted trade shape ------------------------------------------
// The single most divergence-prone structure: it is persisted, therefore
// hashed, therefore consensus-critical. SPEC must name every field exactly.
const TRADE_FIELDS = ['to', 'giveSlots', 'giveItems', 'wantItem', 'wantGold']
const missingTradeFields = TRADE_FIELDS
  .filter(f => !spec.includes(f))
  .map(f => `${f}  — required by engine.js validateState, absent from SPEC.md`)
report('every persisted trade field is named in SPEC', missingTradeFields,
  'A trade offer built to SPEC is rejected by the engine; the shapes must match exactly.')

// ---- 4. skills, node types, equip slots --------------------------------
for (const [label, values] of [
  ['SKILLS', iter(E.SKILLS)], ['NODE_TYPES', iter(E.NODE_TYPES)], ['EQUIP_SLOTS', iter(E.EQUIP_SLOTS)],
]) {
  const specLower = spec.toLowerCase()
  const absent = [...values].filter(v => !specLower.includes(String(v).toLowerCase())).map(v => `${v} not mentioned in SPEC.md`)
  report(`every ${label} entry appears in SPEC`, absent)
}

// ---- 5. dangling internal citations ------------------------------------
// engine.js cites SPEC sections by number. A citation pointing at an unrelated
// section is how a rule loses its constitutional basis without anyone noticing.
const engineSrc = fs.readFileSync(path.resolve(here, 'engine.js'), 'utf8')
const cited = new Set()
for (const m of engineSrc.matchAll(/§\s?(\d+[a-z]{0,3}(?:-[iv]+)?)\b/g)) {
  if (Number(m[1]) >= 1000) continue // a line number, not a section
  cited.add(m[1])
}
const headings = new Set()
for (const m of spec.matchAll(/^#{1,4}\s+(\d+[a-z]{0,3}(?:-[iv]+)?)[.\s]/gm)) headings.add(m[1])
const dangling = [...cited].filter(c => !headings.has(c)).sort()
  .map(c => `engine.js cites §${c}, which is not a section heading in SPEC.md`)
report('every SPEC section cited by engine.js exists', dangling,
  'A rule whose citation points nowhere has no written constitutional basis.')

// ---- 6. constitutional constants agree across layers -------------------
// The applied cap lives in engine.js, is restated in SPEC.md, and is mirrored
// by the bundle cap in protocol.mjs. Three copies of one number is how the
// bundle byte cap silently contradicted the input cap for an entire release.
{
  const bad = []
  const P = await import('./protocol.mjs')
  const applied = E.MAX_APPLIED_INPUTS
  if (applied === undefined) {
    bad.push('engine does not export MAX_APPLIED_INPUTS — cannot cross-check the cap')
  } else {
    if (!spec.includes(`at most **${applied}** inputs`))
      bad.push(`SPEC does not state the applied cap of ${applied}`)
    if (P.AGREEMENT.MAX_INPUTS_PER_BUNDLE !== applied)
      bad.push(`protocol MAX_INPUTS_PER_BUNDLE ${P.AGREEMENT.MAX_INPUTS_PER_BUNDLE} != engine MAX_APPLIED_INPUTS ${applied}`)
    const worstCaseBytes = applied * 400
    if (P.AGREEMENT.MAX_BUNDLE_BYTES < worstCaseBytes)
      bad.push(`MAX_BUNDLE_BYTES ${P.AGREEMENT.MAX_BUNDLE_BYTES} cannot hold ${applied} inputs (~${worstCaseBytes} B): the count cap is unreachable`)
    if (E.STRANGER_SHARE !== undefined && E.STRANGER_SHARE * 16 !== applied)
      bad.push(`STRANGER_SHARE ${E.STRANGER_SHARE} is not one sixteenth of ${applied}`)
  }
  report('the applied input cap agrees across engine, SPEC, and protocol', bad,
    'A cap that is lawful by count and illegal by size fails first under the load that matters.')
}

// ---- 7. lifted sections must not carry retired vocabulary ---------------
// Part 20 relocates engine comments into the constitution. A comment that had
// gone stale becomes, when lifted, a WRONG RULE carrying a citation -- which is
// worse than the gap it filled. This flags the ones that mention things this
// world no longer has, so the [LIFTED] marks come off in the right order.
{
  const retired = {
    'bronze': 'the bronze tier was replaced by iron/steel/star/great/gold',
    'hitpoints': 'hitpoints is not a skill (§5j)',
    'woodcutting': 'merged into woodcraft (§5m)',
    'firemaking': 'merged into woodcraft (§5m)',
    'fletching': 'merged into woodcraft (§5m)',
    'smithing': 'merged into earthcraft (§5m)',
    'brewing skill': 'merged into hearthcraft (§5m)',
    'steel-ingot': 'never existed; the smelter makes steel',
  }
  const part20 = spec.slice(spec.indexOf('# Part 20'))
  const bad = []
  for (const sec of part20.split(/^## /m).slice(1)) {
    const id = sec.split(/[.\s]/)[0]
    if (!sec.includes('[LIFTED]')) continue
    // A section that carries a Vocabulary note has been READ and annotated:
    // the retired words in it are quoted by the note itself, and flagging them
    // forever would mean the check could never be satisfied by doing the work.
    if (sec.includes('**Vocabulary note.**')) continue
    for (const [word, why] of Object.entries(retired)) {
      if (new RegExp('\\b' + word + '\\b', 'i').test(sec)) bad.push(`§${id} mentions "${word}" — ${why}`)
    }
  }
  report('no lifted section cites retired vocabulary', bad,
    'Review these first: a stale comment lifted into SPEC is a wrong rule with a citation.')
}

console.log(`\n${failures === 0 ? 'PASS — constitution and engine agree' : `FAIL — ${failures} divergences`}`)
process.exit(failures === 0 ? 0 : 1)
