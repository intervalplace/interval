#!/usr/bin/env node
// spec-lift.mjs — write the missing SPEC sections FROM the engine's comments.
//
// engine.js cites 115 sections that SPEC.md never had. That is not a
// documentation gap, it is a SOVEREIGNTY gap: the claim that anyone may verify
// this world against genesis alone is false while an independent implementation
// would have to reverse-engineer a hundred rules out of a reference engine.
//
// The rules are not missing. They are argued, at length and well, in the
// comments beside the code that enforces them — 28,000 words of it. So this
// does not INVENT constitutional text, which would be the exact defect being
// repaired. It RELOCATES text that already exists, and records where each
// paragraph came from so any reader can check it against the code.
//
// What it cannot do is notice that a comment has gone stale. Two were found
// this way earlier (`target.skills.defence += ...` in a file with no defence
// skill), and a stale comment lifted into SPEC is a wrong rule with a citation.
// Every lifted section is therefore marked, and the mark should be removed by a
// human who has read the section against the code it cites.
//
// NON-CONSENSUS: reads engine.js and SPEC.md, writes SPEC.md.
//
// Usage:
//   node spec-lift.mjs            # report what would be written
//   node spec-lift.mjs --write    # write them into SPEC.md

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const ENGINE = path.resolve(here, 'engine.js')
const SPEC = path.resolve(here, 'SPEC.md')
const write = process.argv.includes('--write')

const lines = fs.readFileSync(ENGINE, 'utf8').split('\n')
let spec = fs.readFileSync(SPEC, 'utf8')

const headings = new Set()
for (const m of spec.matchAll(/^#{1,4}\s+(\d+[a-z]{0,3}(?:-[iv]+)?)[.\s]/gm)) headings.add(m[1])

// ---- collect citations -> line indexes ---------------------------------
const hits = new Map()
lines.forEach((line, i) => {
  for (const m of line.matchAll(/§\s?(\d+[a-z]{0,3}(?:-[iv]+)?)\b/g)) {
    const sec = m[1]
    if (Number(sec) >= 1000 || headings.has(sec)) continue
    if (!hits.has(sec)) hits.set(sec, [])
    hits.get(sec).push(i)
  }
})

// ---- pull the comment block around a line ------------------------------
const isComment = (l) => /^\s*(\/\/|\/\*|\*)/.test(l)
function block(i) {
  let a = i, b = i
  if (!isComment(lines[i])) {
    let j = i - 1
    while (j >= 0 && !isComment(lines[j]) && lines[j].trim() !== '') j--
    if (j < 0 || !isComment(lines[j])) return null
    a = b = j
  }
  while (a > 0 && isComment(lines[a - 1])) a--
  while (b < lines.length - 1 && isComment(lines[b + 1])) b++
  return { start: a, end: b, text: lines.slice(a, b + 1).join('\n') }
}

const strip = (t) => t
  .replace(/^\s*(\/\/ ?|\/\*+ ?|\*+\/?\s?)/gm, '')
  .replace(/[ \t]+$/gm, '')
  .trim()

// A title: the engine writes "§6am: THE THING IN CAPS." at the head of most
// blocks. Use it where it exists; fall back to the first clause.
function titleFor(sec, body) {
  const caps = body.match(new RegExp(`§\\s?${sec}[^:]*:\\s*([A-Z][A-Z ,'\\-]{4,70}?)[.,]`))
  if (caps) return caps[1].trim().toLowerCase().replace(/^./, c => c.toUpperCase())
  const first = body.split('\n').find(l => l.trim() && !/^§/.test(l.trim()))
  if (!first) return 'Rule ' + sec
  const clause = first.replace(/^§\s?\w+[:.]\s*/, '').split(/[.;,]/)[0].trim()
  // a truncated sentence makes a bad heading; fall back to the bare number
  return clause.length > 3 && clause.length <= 58 ? clause : 'Rule ' + sec
}

const sortKey = (s) => [parseInt(s, 10), s.replace(/^\d+/, '')]
const sections = [...hits.keys()].sort((x, y) => {
  const [a1, a2] = sortKey(x), [b1, b2] = sortKey(y)
  return a1 - b1 || (a2 < b2 ? -1 : a2 > b2 ? 1 : 0)
})

const drafted = []
for (const sec of sections) {
  const seen = new Set()
  const parts = []
  for (const i of hits.get(sec)) {
    const blk = block(i)
    if (!blk || seen.has(blk.start)) continue
    seen.add(blk.start)
    const body = strip(blk.text)
    if (body.length < 40) continue
    parts.push({ body, from: blk.start + 1, to: blk.end + 1 })
    if (parts.length >= 3) break
  }
  if (!parts.length) continue
  drafted.push({ sec, title: titleFor(sec, parts[0].body), parts, sites: hits.get(sec).length })
}

console.log(`${sections.length} cited sections missing from SPEC.md`)
console.log(`${drafted.length} have engine reasoning that can be lifted`)
console.log(`${sections.length - drafted.length} have none and must be written by hand`)

if (!write) {
  console.log('\nfirst five, as they would be written:\n')
  for (const d of drafted.slice(0, 5)) console.log(`  §${d.sec}. ${d.title}   (${d.sites} citation sites)`)
  console.log('\nrun with --write to insert them')
  process.exit(0)
}

const out = []
out.push('# Part 20 — Rules lifted from the engine\n')
out.push('Every section here was cited by `engine.js` and had no text in this')
out.push('constitution. The rules were never missing: they are argued beside the')
out.push('code that enforces them. This part relocates that reasoning so an')
out.push('independent implementation can be built from SPEC.md alone, which is')
out.push('the whole of the claim this world makes about itself.\n')
out.push('Each section records the engine lines it came from. **Sections marked')
out.push('`[LIFTED]` have not yet been read back against the code.** A comment')
out.push('that has gone stale becomes, when lifted, a wrong rule carrying a')
out.push('citation — so the mark comes off one section at a time, by someone who')
out.push('has checked it. Generated by `node spec-lift.mjs --write`.\n')
out.push('---\n')

for (const d of drafted) {
  out.push(`## ${d.sec}. ${d.title}  [LIFTED]\n`)
  out.push(`*Cited from ${d.sites} place${d.sites > 1 ? 's' : ''} in the engine.*\n`)
  for (const p of d.parts) {
    out.push(`> from engine.js:${p.from}-${p.to}\n`)
    out.push(p.body + '\n')
  }
}

spec = spec.replace(/\n## 20\. Generated registries/, '\n' + out.join('\n') + '\n## 20. Generated registries')
fs.writeFileSync(SPEC, spec)
console.log(`\nwrote ${drafted.length} sections into SPEC.md`)
