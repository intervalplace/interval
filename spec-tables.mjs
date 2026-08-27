#!/usr/bin/env node
// spec-tables.mjs — generate SPEC.md's mechanical tables FROM the engine.
//
// §2n makes the engine the law and SPEC.md prose ABOUT the law. Prose about
// the law that is maintained by hand beside the law will drift from it, and
// did: 145 divergences at the pre-founding audit, including a published recipe
// table for an equipment tier the engine had already replaced.
//
// The fix is structural, not editorial. Every table here is DERIVED. If the
// engine changes, the table changes with it or this script fails loudly.
//
// NON-CONSENSUS: reads exported registries, emits markdown, touches no state.
//
// Usage:
//   node spec-tables.mjs                 # print all blocks
//   node spec-tables.mjs --write         # splice into SPEC.md between markers
//   node spec-tables.mjs --check         # exit 1 if SPEC.md is out of date
//
// Marker convention in SPEC.md:
//   <!-- BEGIN GENERATED: recipes -->
//   ...
//   <!-- END GENERATED: recipes -->

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const E = require(path.resolve(here, 'engine.js'))
const SPEC = path.resolve(here, 'SPEC.md')

const mode = process.argv.includes('--write') ? 'write'
           : process.argv.includes('--check') ? 'check' : 'print'

const ing = (r) => Object.entries(r).map(([k, v]) => `${v} \`${k}\``).join(' + ')
const reqs = (n) => {
  const r = E.SMITH_REQS[n]
  return r ? Object.entries(r).map(([sk, lv]) => `${sk} ${lv}`).join(', ') : '—'
}

const blocks = {}

// ---- recipes ------------------------------------------------------------
// Split by door: SMELTED goes through a burning furnace, the rest through an
// anvil. The RECIPES table is shared; only SMELTED says which verb applies.
{
  const all = Object.keys(E.RECIPES).sort()
  const smelt = all.filter(n => E.SMELTED.has(n))
  const forge = all.filter(n => !E.SMELTED.has(n))
  const rows = (ns) => ns.map(n => `| \`${n}\` | ${ing(E.RECIPES[n])} | ${reqs(n)} |`).join('\n')
  blocks.recipes = [
    `**Smelted** (\`smelt\`, at a furnace whose \`fuelUntil\` exceeds the current`,
    `tick; \`charcoal\` substitutes for \`coal\`). ${smelt.length} recipes.`,
    ``,
    `| Product | Ingredients | Requires |`,
    `|---|---|---|`,
    rows(smelt),
    ``,
    `**Forged** (\`smith\`, at an anvil). ${forge.length} recipes.`,
    ``,
    `| Product | Ingredients | Requires |`,
    `|---|---|---|`,
    rows(forge),
  ].join('\n')
}

// ---- equipment ----------------------------------------------------------
{
  const bySlot = {}
  for (const it of [...E.EQUIPPABLE].sort()) {
    const s = E.slotOf(it)
    if (!s) continue
    ;(bySlot[s] ||= []).push(it)
  }
  blocks.equipment = [
    `The constitutional equipment slots are ${E.EQUIP_SLOTS.map(s => `\`${s}\``).join(', ')}.`,
    `Every slot is present on every player at all times; an empty slot is`,
    `\`null\`, never absent. \`slotOf()\` is the single shared rule deciding where`,
    `an item belongs: an item worn in the wrong slot is as malformed as an`,
    `unknown one.`,
    ``,
    `| Slot | Items |`,
    `|---|---|`,
    ...E.EQUIP_SLOTS.map(s => `| \`${s}\` | ${(bySlot[s] || []).map(i => `\`${i}\``).join(', ') || '—'} |`),
  ].join('\n')
}

// ---- node types ---------------------------------------------------------
{
  const ns = [...E.NODE_TYPES].sort()
  blocks.nodes = [
    `${ns.length} constitutional node types. A node of any other type is`,
    `contraband and the state carrying it is invalid.`,
    ``,
    ns.map(n => `\`${n}\``).join(', ') + '.',
  ].join('\n')
}

// ---- persisted trade shape ---------------------------------------------
// Exact, because it is persisted, therefore hashed, therefore consensus-critical.
{
  blocks.trade_shape = [
    `A persisted offer (\`player.trade\`) carries **exactly** these five keys,`,
    `no more and no fewer:`,
    ``,
    `| Field | Type | Rule |`,
    `|---|---|---|`,
    `| \`to\` | hex64 | an existing player, not the offerer |`,
    `| \`giveSlots\` | int[] | non-empty, ascending, distinct, each \`0..${E.INV_SLOTS - 1}\` |`,
    `| \`giveItems\` | {item,qty}[] | one per named slot, same order; the goods **as advertised** |`,
    `| \`wantItem\` | item or null | |`,
    `| \`wantGold\` | int ≥ 0 | |`,
    ``,
    `\`wantItem\` and \`wantGold\` are both written out always — \`wantItem: null\``,
    `or \`wantGold: 0\` — because omission is not a representation. Exactly one`,
    `of them is a live demand (item XOR positive gold).`,
    ``,
    `\`giveItems\` is not redundant with \`giveSlots\`. It is the record of what`,
    `was advertised, and \`tradeFits()\` re-checks the offerer's inventory`,
    `against it at accept time. Without it, emptiness is guarded but`,
    `**substitution is not**: the buyer agrees to a \`star-sword\` and receives`,
    `an \`iron-dagger\`. An offer whose goods no longer match what was`,
    `advertised does not partially apply — it does not apply at all.`,
  ].join('\n')
}

// ---- skills -------------------------------------------------------------
{
  blocks.skills = [
    `${E.SKILLS.length} skills: ${E.SKILLS.map(s => `\`${s}\``).join(', ')}.`,
    ``,
    `XP is a non-negative integer. Levels come from the constitutional curve`,
    `(\`levelForXp\`), which is shared by the engine and every window.`,
  ].join('\n')
}

// ---- armour -------------------------------------------------------------
// Armour points enter the hit ROLL, not the damage. Soak is zero in this world.
{
  const rows = Object.entries(E.ARMOUR).sort(([a], [b]) => a < b ? -1 : 1)
    .map(([it, v]) => `| \`${it}\` | ${E.slotOf(it)} | ${v} |`).join('\n')
  blocks.armour = [
    `\`armourOf()\` sums **head and body only**. A shield, legs, a mask or a`,
    `hood is not in this table, so it reads as zero armour however it is worn.`,
    ``,
    `| Item | Slot | Armour |`,
    `|---|---|---|`,
    rows,
    ``,
    `Armour does not reduce damage. It reduces the chance of being hit:`,
    ``,
    `    A = (attack + 8) × (weaponAcc + 64)`,
    `    D = (defence + 8) × (armour + 64)`,
    `    hit256 = A > D ? 256 − floor(128(D+2) / (A+1))`,
    `                   : floor(128A / (D+1))`,
    `    clamped to [8, 250] out of 256`,
    ``,
    `Two-handed weapons occupy the off hand: ${[...E.TWO_HANDED].sort().map(w => `\`${w}\``).join(', ')}.`,
    `A hand may not hold a shield while both are on the haft.`,
  ].join('\n')
}

// ---- weapons -------------------------------------------------------------
// Hand-written stat tables are how §6x came to specify a `bronze-flail` that
// exists nowhere, beside a `star-flail` whose numbers were three releases old.
// A table that describes a thing completely and describes it wrongly is worse
// than a gap: an implementer builds exactly what it says.
{
  const rows = Object.entries(E.WEAPONS).sort(([a],[b]) => a < b ? -1 : 1).map(([w, v]) => {
    const req = E.WIELD_REQS[w]
    const bits = []
    if (v.hit !== undefined) bits.push(`hit ${v.hit}`)
    if (v.every !== undefined) bits.push(`every ${v.every}`)
    if (v.reach !== undefined) bits.push(`reach ${v.reach}`)
    if (v.acc !== undefined) bits.push(`acc ${v.acc}`)
    for (const flag of ['pierces','bare','desperate','breaks','burns','drawnAt'])
      if (v[flag] !== undefined && v[flag] !== false) bits.push(v[flag] === true ? flag : `${flag} ${v[flag]}`)
    const r = req ? Object.entries(req).map(([sk, lv]) => `${sk} ${lv}`).join(', ') : '—'
    return `| \`${w}\` | ${bits.join(' · ')} | ${r} |`
  }).join('\n')
  blocks.weapons = [
    `${Object.keys(E.WEAPONS).length} weapons. \`acc\` and \`hit\` enter the roll and the`,
    `blow as described in §5r; \`pierces\` means the guard is ignored in the ROLL,`,
    `since soak is zero everywhere (§6ap).`,
    ``,
    `| Weapon | Stats | Wield requires |`,
    `|---|---|---|`,
    rows,
  ].join('\n')
}

// ---- emit ---------------------------------------------------------------
if (mode === 'print') {
  for (const [name, body] of Object.entries(blocks)) {
    console.log(`<!-- BEGIN GENERATED: ${name} -->`)
    console.log(body)
    console.log(`<!-- END GENERATED: ${name} -->\n`)
  }
  process.exit(0)
}

let spec = fs.readFileSync(SPEC, 'utf8')
let missing = [], stale = []
for (const [name, body] of Object.entries(blocks)) {
  const begin = `<!-- BEGIN GENERATED: ${name} -->`
  const end = `<!-- END GENERATED: ${name} -->`
  const re = new RegExp(`${begin}[\\s\\S]*?${end}`)
  if (!re.test(spec)) { missing.push(name); continue }
  const want = `${begin}\n${body}\n${end}`
  if (!spec.includes(want)) stale.push(name)
  spec = spec.replace(re, want)
}

if (mode === 'check') {
  if (missing.length) console.log(`missing generated blocks in SPEC.md: ${missing.join(', ')}`)
  if (stale.length) console.log(`stale generated blocks in SPEC.md: ${stale.join(', ')}`)
  if (!missing.length && !stale.length) { console.log('SPEC.md generated tables are current'); process.exit(0) }
  console.log('\nrun: node spec-tables.mjs --write')
  process.exit(1)
}

fs.writeFileSync(SPEC, spec)
console.log(`wrote ${Object.keys(blocks).length - missing.length} generated blocks into SPEC.md`)
if (missing.length) {
  console.log(`\nNOT written (no markers in SPEC.md yet): ${missing.join(', ')}`)
  console.log('Add the marker pair where each table belongs, then re-run.')
}
