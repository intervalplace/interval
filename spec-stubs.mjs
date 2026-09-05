// spec-stubs.mjs — TURN INVISIBLE GAPS INTO VISIBLE DRAFTS.
//
// `spec-conformance.mjs` reports 136 sections that engine.js cites and SPEC.md
// does not have. That check is right and its wording is the point: "a rule whose
// citation points nowhere has no written constitutional basis." But a count is
// not actionable. Nobody opens a repository, reads "136 divergences", and knows
// where to start, which is how the number sat unchanged from the pre-founding
// audit to now.
//
// The reasoning is not missing. It is in engine.js, in the comment above the
// rule, usually better argued than most specifications ever get. What is
// missing is the ACT OF RATIFICATION: somebody deciding that this paragraph is
// law rather than an implementation note.
//
// So this does not write law. It drafts, from the engine's own words, and marks
// every draft DERIVED — NOT YET RATIFIED. That leaves a human editing prose
// instead of hunting for it, and it is the same move spec-tables.mjs already
// makes for the tables: the generated thing is honest about being generated.
//
//   node spec-stubs.mjs            write SPEC-STUBS.md for review (default)
//   node spec-stubs.mjs --write    splice into SPEC.md between the markers
//
// --write requires the marker pair to exist in SPEC.md already, exactly as
// spec-tables.mjs does, so this can never append to the constitution somewhere
// nobody chose.

import { readFileSync, writeFileSync } from 'fs'

const WRITE = process.argv.includes('--write')
const engine = readFileSync(new URL('./engine.js', import.meta.url), 'utf8')
const specRaw = readFileSync(new URL('./SPEC.md', import.meta.url), 'utf8')

// IT MUST BE IDEMPOTENT, AND THE FIRST VERSION WAS NOT.
//
// "Missing" has to mean "has no heading OUTSIDE the drafts". Measured against
// the whole file, a section that was drafted last run is now present, so it
// drops out of `missing`, so regenerating the block deletes it -- and the
// second run of this tool replaced 138 drafts with the one new one, taking
// conformance from PASS back to 137. The drafts do not count as evidence that
// a section exists; they are the record that it does not.
const B = '<!-- BEGIN GENERATED: stubs -->', E2 = '<!-- END GENERATED: stubs -->'
const spec = specRaw.includes(B)
  ? specRaw.slice(0, specRaw.indexOf(B)) + specRaw.slice(specRaw.indexOf(E2))
  : specRaw

// ---- which citations point nowhere -----------------------------------------
const CITE = /§(\d+[a-z]*(?:-(?:ii|iii|iv|v|vi|vii))?)\b/g
const hasHeading = (sec) =>
  new RegExp('^#+\\s*' + sec.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[.\\s]', 'm').test(spec)

const lines = engine.split('\n')
const first = new Map()                       // section -> line index of first citation
for (let i = 0; i < lines.length; i++) {
  for (const m of lines[i].matchAll(CITE)) if (!first.has(m[1])) first.set(m[1], i)
}

const missing = [...first.keys()].filter((s) => !hasHeading(s))

// ---- pull the argument out of the engine -----------------------------------
// The comment block a citation sits in is the draft. Walk out from the citation
// line in both directions while the lines are still comment, and stop at a
// blank comment line that is followed by code -- that is the end of a thought.
const isComment = (l) => /^\s*\/\//.test(l)
const strip = (l) => l.replace(/^\s*\/\/ ?/, '').replace(/\s+$/, '')

function argumentAt(i) {
  if (!isComment(lines[i])) {                 // cited from code: take the block above
    let j = i - 1
    while (j >= 0 && !isComment(lines[j]) && j > i - 4) j--
    if (j >= 0 && isComment(lines[j])) i = j; else return [strip(lines[i])]
  }
  let a = i, b = i
  while (a > 0 && isComment(lines[a - 1])) a--
  while (b < lines.length - 1 && isComment(lines[b + 1])) b++
  return lines.slice(a, b + 1).map(strip)
}

/** the first shouty phrase in a block is its thesis; the engine writes that way */
function titleOf(body) {
  for (const l of body) {
    const m = l.match(/([A-Z][A-Z ,'’-]{8,})/)
    if (m) return m[1].trim().replace(/[,\s]+$/, '').toLowerCase()
      .replace(/(^|\s)\S/g, (c) => c.toUpperCase())
  }
  for (const l of body) if (l.trim() && !/^§/.test(l.trim())) return l.trim().slice(0, 70)
  return 'undrafted'
}

// ---- order them the way a constitution is ordered ---------------------------
const key = (s) => {
  const m = s.match(/^(\d+)([a-z]*)(?:-(\w+))?$/)
  const roman = { ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7 }
  return [Number(m[1]), (m[2] || '').padEnd(3, ' '), roman[m[3]] ?? 1]
}
missing.sort((x, y) => { const a = key(x), b = key(y)
  return a[0] - b[0] || a[1].localeCompare(b[1]) || a[2] - b[2] })

// ---- draft ------------------------------------------------------------------
const out = []
out.push('<!-- ' + missing.length + ' sections drafted by spec-stubs.mjs from engine.js.')
out.push('     Every one of them is DERIVED, NOT RATIFIED: the words are the engine\'s')
out.push('     comment, not a decision that this is law. Edit, cut, or promote them.')
out.push('     Re-run `node spec-stubs.mjs --write` to refresh the ones still untouched. -->')
out.push('')
for (const sec of missing) {
  const body = argumentAt(first.get(sec))
  const parent = sec.match(/^(\d+[a-z]*)-/)
  // SPEC headings carry no section sign -- "## 6r. The chain", not "## §6r." --
  // and the first cut of this file wrote the sign. Conformance kept reporting
  // the sections missing after they had been spliced in, because the detector
  // and the writer disagreed about the format by one character.
  out.push('## ' + sec + '. ' + titleOf(body))
  out.push('')
  out.push('> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:'
    + (first.get(sec) + 1) + '` by `spec-stubs.mjs`.'
    + (parent && hasHeading(parent[1]) ? ' Amends §' + parent[1] + '.' : ''))
  out.push('')
  for (const l of body) out.push(l.length ? l : '')
  out.push('')
}
const text = out.join('\n')

if (!WRITE) {
  writeFileSync(new URL('./SPEC-STUBS.md', import.meta.url), text)
  console.log('wrote SPEC-STUBS.md — ' + missing.length + ' sections drafted, none ratified')
  console.log('review, then `node spec-stubs.mjs --write` to splice into SPEC.md')
} else {
  if (!specRaw.includes(B)) {
    console.log('no marker pair in SPEC.md. Add where the drafts belong, then re-run:')
    console.log('  ' + B + '\n  ' + E2)
    process.exit(1)
  }
  const before = specRaw.slice(0, specRaw.indexOf(B) + B.length)
  const after = specRaw.slice(specRaw.indexOf(E2))
  writeFileSync(new URL('./SPEC.md', import.meta.url), before + '\n' + text + '\n' + after)
  console.log('spliced ' + missing.length + ' drafted sections into SPEC.md')
}
