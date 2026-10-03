#!/usr/bin/env node
// spec-conformance.mjs: does the constitution describe the engine that exists?
//
// SPEC.md is bound by the rules hash. An independent implementation is built
// from SPEC, not from engine.js. Anywhere the two disagree, that implementation
// computes a different state hash, fails to attest, and is silently excluded
// from the world, which is the one failure mode this protocol cannot tolerate.
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
  .filter(t => /^(bronze|iron|steel|quick|great|gold)-/.test(t) || t.endsWith('-ingot'))
  .filter(t => !E.MOB_STATS[t] && !iter(E.NODE_TYPES).includes(t))
  .map(t => `${t}  (SPEC.md:${lineOf('`' + t + '`')})`)
report('every equipment-like item named in SPEC exists in ITEMS', unknownItems,
  'SPEC names gear the engine does not implement, a reimplementer would build items that cannot exist.')

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
    if (!name.includes('-') && !/^(iron|steel|quick|great|gold|bronze)/.test(name)) continue
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
    if (!E.ITEMS.has(prod)) bad.push(`${prod}: recipe product is not in ITEMS`)
    for (const k of Object.keys(ingredients)) {
      if (!E.ITEMS.has(k)) bad.push(`${prod} requires \`${k}\`, which is not in ITEMS, permanently uncraftable`)
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
    if (slots > E.INV_SLOTS) bad.push(`${prod} needs ${slots} slots, pack holds ${E.INV_SLOTS}, cannot be held at all`)
    else if (slots === E.INV_SLOTS) bad.push(`${prod} needs ${slots} slots, exactly filling the pack, no free slot for the product`)
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
  .map(f => `${f}: required by engine.js validateState, absent from SPEC.md`)
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
    bad.push('engine does not export MAX_APPLIED_INPUTS: cannot cross-check the cap')
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

// ---- the words this world retired, and how to tell a rule from a scar ------
// Shared by checks 7 and 8: one is the drafted sections, the other is every
// comment in engine.js. Curated rather than derived, because most retired SKILL
// names are ordinary English here -- `mining`, `cooking`, `attack` and `dragon`
// all name real things in this world and only `p.skills.mining` would be wrong.
// A list built by diffing SKILLS against the dictionary flags four hundred
// sentences, nearly all of them correct prose.
const retired = {
  'bronze': 'the bronze tier was replaced by iron/steel/quick/great/gold',
  'hitpoints': 'hitpoints is not a skill (§5j)',
  'woodcutting': 'merged into woodcraft (§5m)',
  'firemaking': 'merged into woodcraft (§5m)',
  'fletching': 'merged into woodcraft (§5m)',
  'smithing': 'merged into earthcraft (§5m)',
  'brewing skill': 'merged into hearthcraft (§5m)',
  'steel-ingot': 'never existed; the smelter makes steel',
}
  // The past tense, and the words this project actually uses to mark a change.
  // Kept tight on purpose. The first cut of this list also held `never`, `old`,
  // `then`, `since` and `dead`, and `never` alone exempted "never below a
  // novice's frame" -- a sentence stating a rule that §5j had repealed, in the
  // word §5j retired. A marker that a present-tense rule can reach for is not
  // a marker.
  const PAST = /\b(was|were|had|used to|no longer|before|began|retired|merged|replaced|renamed|formerly|repealed|removed|deleted|never existed)\b/i

/** every sentence in a passage that is NOT marked as history */
//
// BACKTICKS ARE CODE, AND CODE KEEPS ITS OWN NAMES. `req.smithing` is a live
// field: RECIPES still carry a `smithing` key and §5m maps it to earthcraft at
// the gate, so a comment that names the field is describing what is there. The
// same goes for `p.skills.hitpoints` in a sentence about the bug it caused.
// Only the PROSE is held to the world's current words.
function presentTense(passage) {
  return passage.replace(/`[^`]*`/g, ' ')
    .split(/(?<=[.;:])\s+|\n\n+/).filter((t) => !PAST.test(t))
}

// ---- 7. drafted sections must not carry retired vocabulary ---------------
// Appendix D relocates engine comments into the constitution as drafts. A
// comment that had gone stale becomes, when drafted, a WRONG RULE carrying a
// citation -- which is worse than the gap it filled. This flags the ones that
// mention things this world no longer has, so they are ratified, edited or cut
// in the right order.
//
// IT WAS SLICING AT `# Part 20`, WHICH SPEC.md HAS NEVER HAD. `indexOf` returns
// -1 for a heading that is not there and `slice(-1)` is the last character of
// the file, so this check ran over one character, found nothing, and reported
// `ok` for as long as it has existed. The drafts live under Appendix D.
{
  const at = spec.indexOf('# Appendix D.')
  if (at < 0) throw new Error('SPEC.md has no Appendix D: this check has nothing to read')
  const drafts = spec.slice(at)
  const bad = []
  for (const sec of drafts.split(/^## /m).slice(1)) {
    const id = sec.split(/[.\s]/)[0]
    // THE GATE WAS `[LIFTED]`, A MARK NO SECTION IN THIS FILE CARRIES. One
    // section in SPEC.md has it, and it is not in Appendix D, so even after the
    // slice above was corrected this loop skipped every section it was given.
    // The drafts announce themselves with the DERIVED marker instead.
    if (!sec.includes('DERIVED, NOT YET RATIFIED') && !sec.includes('[LIFTED]')) continue
    // A section that carries a Vocabulary note has been READ and annotated:
    // the retired words in it are quoted by the note itself, and flagging them
    // forever would mean the check could never be satisfied by doing the work.
    if (sec.includes('**Vocabulary note.**')) continue
    // THE RULE IN FORCE AND THE SCAR IT LEFT ARE BOTH WORTH WRITING, and the
    // difference between them is the tense. "Hitpoints was a skill and §5j
    // made it a flat pool" is the history of this world and belongs here.
    // "Eight hitpoints a tick" states a rule in a word the world does not have
    // and will be read as law by somebody reimplementing it.
    //
    // So this is judged a SENTENCE at a time, not a section at a time: a
    // retired word is allowed where its own sentence is about the change, and
    // flagged where the sentence states a rule. Flagging the whole block was
    // why this check was unsatisfiable even in principle: the sections that
    // explain a rename necessarily name the old word.
    for (const sentence of presentTense(sec)) {
      for (const [word, why] of Object.entries(retired)) {
        if (new RegExp('\\b' + word + '\\b', 'i').test(sentence)) {
          bad.push(`§${id} states a rule in the word "${word}": ${why}`
            + `\n            ${sentence.replace(/\s+/g, ' ').trim().slice(0, 96)}`)
        }
      }
    }
  }
  report('no drafted section cites retired vocabulary', bad,
    'Review these first: a stale comment drafted into SPEC is a wrong rule with a citation.')
}

// ---- 8. and neither may a comment in the engine ---------------------------
// Check 7 reads the DRAFTS, which cover a hundred and forty-five of the two
// hundred and fifty-four sections engine.js cites, and nothing at all outside
// a citation. The stale sentences it caught were the ones that happened to
// fall in a drafted block; the rest of the file was never looked at.
//
// This reads every comment in engine.js. The comment above a rule is where a
// reimplementer looks when SPEC is thin, so a comment that states the rule in
// a word this world retired is the same failure as a stale section, one step
// earlier.
{
  const src = fs.readFileSync(path.resolve(here, 'engine.js'), 'utf8').split('\n')
  const bad = []
  let buf = [], at = 0
  const flush = () => {
    if (buf.length) {
      for (const sentence of presentTense(buf.join(' '))) {
        for (const [word, why] of Object.entries(retired)) {
          if (new RegExp('\\b' + word + '\\b', 'i').test(sentence)) {
            bad.push(`engine.js:${at + 1} states a rule in the word "${word}": ${why}`
              + `\n            ${sentence.replace(/\s+/g, ' ').trim().slice(0, 92)}`)
            break
          }
        }
      }
    }
    buf = []
  }
  for (let i = 0; i < src.length; i++) {
    if (/^\s*\/\//.test(src[i])) { if (!buf.length) at = i; buf.push(src[i].replace(/^\s*\/\/ ?/, '')) }
    else flush()
  }
  flush()
  report('no engine comment states a rule in retired vocabulary', bad,
    'The comment above a rule is what a reimplementer reads when SPEC is thin.')
}

// ---- 8b. and the generator cites it too ----------------------------------
// Check 8 reads engine.js. The worldgen files cite the constitution in exactly
// the same way and nothing had ever looked: forty-one sections pointed nowhere,
// §7bd from four files at once. Geography is law (§2q) and these files are
// where that law is implemented, so a citation here that resolves to nothing is
// the same defect one building over.
{
  const bad = new Set()
  const heads = new Set([...spec.matchAll(/^#{2,3}\s+([0-9]+[a-z.-]*?)\.\s/gm)].map((m) => m[1]))
  const CITE = /§(\d+[a-z]*(?:-(?:ii|iii|iv|v|vi|vii))?)\b/g
  for (const f of fs.readdirSync(here)) {
    if (!/^(worldgen|terrain-mirror)[a-z0-9-]*\.mjs$/.test(f)) continue
    const text = fs.readFileSync(path.resolve(here, f), 'utf8')
    for (const m of text.matchAll(CITE)) {
      if (!heads.has(m[1])) bad.add(`${f} cites §${m[1]}, which is not a section heading in SPEC.md`)
    }
  }
  report('every SPEC section the generator cites exists', [...bad].sort(),
    'Run `node spec-stubs.mjs --write`.')
}

// ---- 9. one section, one number ------------------------------------------
// A citation is only worth writing if it lands somewhere. Eighteen ids in this
// document named two sections and some named three, so a reimplementer reading
// "see §9b" got either "terrain must be exactly reproducible" or "catch-up by
// replay" depending on which they found first, and §7a named "survey markers"
// and "the Reading Rule" while thirty-four comments in the engine used it for
// the rockfall, which is written at §12c.
//
// It happened because the document is numbered by when a section was written
// and sections were added in blocks: exploration, brewing and the geography of
// the expanse each took §7, §8 and §9 again, on top of the v0.1 core that
// already had them. Nothing catches that by reading.
{
  const seen = new Map()
  spec.split('\n').forEach((l, i) => {
    const m = l.match(/^#{2,3}\s+([0-9]+[a-z.-]*?)\.\s+(.*)/)
    if (!m) return
    if (!seen.has(m[1])) seen.set(m[1], [])
    seen.get(m[1]).push(`${i + 1}: ${m[2].trim().slice(0, 48)}`)
  })
  const bad = []
  for (const [id, where] of seen) {
    if (where.length > 1) bad.push(`§${id} is ${where.length} different sections: ` + where.join(' | '))
  }
  report('no two sections share a number', bad,
    'A citation that resolves to two sections has no written basis in either.')
}

// ---- 10. a spell SPEC names is a spell `cast` will take -------------------
// §6k described `anchor` in the present tense for as long after its repeal as
// nobody looked: "the caster is returned instantly to the plaza beside the well
// of Anchor". The engine's validator takes one word. A reimplementer building
// from SPEC would have written a teleport the world refuses, and found out when
// their state hash stopped matching.
{
  const m = fs.readFileSync(path.resolve(here, 'engine.js'), 'utf8')
    .match(/spell:\s*\(v\)\s*=>\s*\[([^\]]*)\]/)
  const bad = []
  if (!m) bad.push('engine.js has no `spell:` validator to read the list from')
  else {
    const real = new Set([...m[1].matchAll(/'([a-z-]+)'/g)].map((x) => x[1]))
    // STRUCK-THROUGH TEXT IS A REPEALED RULE, which is how §4 marks the
    // hitpoints start and how §6k now marks the anchor. Quoting the old rule
    // in order to repeal it is the correct thing to do, so it is not read here.
    const live = spec.replace(/~~[\s\S]*?~~/g, ' ')
    // only where SPEC is plainly talking about casting one
    for (const c of live.matchAll(/`cast`? ?\{?spell\}?`?[^\n]*?`([a-z-]+)`|\bspell is `([a-z-]+)`/g)) {
      const name = c[1] ?? c[2]
      if (name && name !== 'spell' && !real.has(name)) {
        bad.push(`SPEC names \`${name}\` as a spell; \`cast\` takes only ${[...real].map((r) => '`' + r + '`').join(', ')}`)
      }
    }
  }
  report('every spell SPEC names is one the engine will cast', [...new Set(bad)],
    'A spell in the constitution that the validator refuses is a rule nobody can obey.')
}

// ---- 11. the index lists the sections that are actually there -------------
// A contents page that has drifted is worse than none: it sends a reader to a
// number and the number is not there. This regenerates it and compares, so the
// index cannot rot quietly between the day a section is added and the day
// somebody remembers to re-run the tool.
{
  const bad = []
  const B = '<!-- BEGIN GENERATED: index -->', E = '<!-- END GENERATED: index -->'
  if (!spec.includes(B)) bad.push('SPEC.md has no index block')
  else {
    const listed = new Set([...spec.slice(spec.indexOf(B), spec.indexOf(E))
      .matchAll(/^- \*\*§([0-9][a-z0-9.-]*)\*\*/gm)].map((m) => m[1]))
    const appendix = spec.indexOf('\n# Appendix D.')
    const body = spec.slice(0, appendix === -1 ? spec.length : appendix)
    const real = new Set([...body.matchAll(/^#{2,3}\s+([0-9]+[a-z.-]*?)\.\s+.+$/gm)].map((m) => m[1]))
    for (const id of real) if (!listed.has(id)) bad.push(`§${id} is a section and the index does not list it`)
    for (const id of listed) if (!real.has(id)) bad.push(`the index lists §${id}, which is not a section`)
  }
  report('the index lists every section and no others', bad,
    'Run `node spec-index.mjs --write`.')
}

// ---- 12. every retired word the law uses is declared in §0-i ---------------
// NOT "the law must not use a retired word". §0-i decides otherwise, and it is
// right: "Earlier sections were written when the old names were current and are
// left standing, because rewriting them would falsify the record of what was
// decided and when." A constitution that is also a record cannot rewrite its
// own past, and a pass that renamed `smithing` to `earthcraft` through the body
// destroyed the very table that tells a reader how to read it.
//
// So the rule is the one §0-i actually makes: a reader meeting an old word must
// be able to look it up. This checks that every retired word the law still uses
// appears in the translation table, so a word can never be left in the law with
// nothing to translate it.
{
  const appendix = spec.indexOf('\n# Appendix D.')
  const body = spec.slice(0, appendix === -1 ? spec.length : appendix)
  // THE WHOLE READING NOTE, not just the skills table. §0-i carries two: one
  // translating the skill names and one listing the repeals, and `bronze` is
  // declared in the second. Reading only the first reported a word that was
  // explained forty lines further down.
  const note = body.slice(body.indexOf('## 0-i.'), body.indexOf('## 0-ii.'))
  const declared = new Set([...note.matchAll(/\b([a-z-]{4,})\b/g)].map((m) => m[1]))
  const bad = []
  for (const word of Object.keys(retired)) {
    if (declared.has(word)) continue
    // only complain if the law actually uses it
    const used = new RegExp('\\b' + word + '\\b', 'i').test(body.replace(/~~[\s\S]*?~~/g, ' '))
    if (used) bad.push(`the law uses "${word}" and §0-i's table does not translate it`)
  }
  report("every retired word the law uses is translated in §0-i", bad,
    'A reader meeting an old name must have somewhere to look it up.')
}

// ---- 13. every verb the law names is one the engine will accept -----------
// §0-i promises this: a skill name may stand where it was written because the
// reader has a table, but a VERB is the `type` on a signed input and an
// implementation built from the wrong one sends something every node refuses.
// The burst was `special` in thirty-five places here and `gambit` in the
// engine, so a reimplementer following the constitution would have had every
// burst rejected and no way to tell why.
//
// Only the `verb {args}` form is read. This document writes a great many names
// in backticks, and a rule wide enough to catch a bare one would be turned off
// within a week.
{
  const appendix = spec.indexOf('\n# Appendix D.')
  const body = spec.slice(0, appendix === -1 ? spec.length : appendix)
    .replace(/~~[\s\S]*?~~/g, ' ')
  const base = {
    playerId: 'a'.repeat(64), worldId: 'b'.repeat(64), tick: 1, sig: 'c'.repeat(128),
  }
  // a verb SPEC itself says is repealed is a record, not an instruction
  const repealed = new Set([...body.matchAll(/`([a-z_]+)`[^.\n]{0,40}\brepealed\b/g)].map((m) => m[1]))
  const bad = new Set()
  for (const m of body.matchAll(/`([a-z_]{3,16}) ?\{/g)) {
    const v = m[1]
    if (repealed.has(v)) continue
    if (E.validateInputShape({ ...base, type: v }) === 'unknown input type') {
      bad.add(`SPEC writes \`${v} {...}\` as an input; the engine answers "unknown input type"`)
    }
  }
  report('every verb the law names is one the engine will accept', [...bad],
    'A verb in the constitution the engine refuses is a rule nobody can obey.')
}

console.log(`\n${failures === 0 ? 'PASS, constitution and engine agree' : `FAIL, ${failures} divergences`}`)
process.exit(failures === 0 ? 0 : 1)
