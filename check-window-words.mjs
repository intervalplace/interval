// EVERY WORD THE WORLD STANDS UP, AGAINST EVERY WORD THE WINDOW NAMES.
//
// The Unreal window already does this for itself: it logs "the world says
// 'quick-rock' is standing here and this window has no mesh for it" once per
// word per rebuild, and CLAUDE.md says plainly that the list of undrawn words
// is a grep of that log rather than a reading of the tables. The browser
// window had no such log, so the only way to find a word it could not draw
// was to walk the island and notice.
//
// This is that log, computed. It builds the real island, counts every
// (type, kind) in it, and reports the ones the window names NOWHERE -- which
// means they reach the generic marker, whatever the tables appear to say.
//
// It found `landmark:bridge-stone`, eleven of them, one at the end of every
// span, drawn as a broken tower; and `keeper:toll`, which led to the larger
// finding that all 158 keepers carried their calling and the window read
// none of it.
//
// SLOW ON PURPOSE: it founds the whole world, which is a minute and a half,
// so it is a check you run rather than a test in the suite. `test/window.test.mjs`
// holds the cheap half -- that the gate and the drawings agree with each other.
//
//   node check-window-words.mjs                    the flat window
//   node check-window-words.mjs window-hill.html   any other
import { readFileSync } from 'node:fs'
import * as WG from './worldgen-expanse7.mjs'
const quiet = console.log; console.log = () => {}
const g = WG.makeExpanse7Genesis('sweep', 'a'.repeat(64), 0, 896, 512)
const w = WG.buildWorld(g)
console.log = quiet

const WHICH = process.argv[2] ?? 'window-web.html'
const win = readFileSync(new URL(WHICH, import.meta.url), 'utf8')
// strip comments: a word explained in a comment is not a word drawn
const code = win.replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n').map((l) => l.replace(/(^|[^:])\/\/.*$/, '$1')).join('\n')
const LM18 = new Set([...(code.match(/const LM18 = new Set\(\[([\s\S]*?)\]\)/) ?? [, ''])[1]
  .matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]))

const types = {}, kinds = {}
for (const n of Object.values(w.nodes)) {
  types[n.type] = (types[n.type] ?? 0) + 1
  if (n.kind) (kinds[n.type] ??= {})[n.kind] = ((kinds[n.type] ?? {})[n.kind] ?? 0) + 1
}
// quoted OR as a bare object key: half these tables are written `goblin: {...}`
const named = (word) => {
  const w = word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
  return new RegExp("'" + w + "'").test(code) || new RegExp('(^|[^\\w-])' + w + '\\s*:').test(code)
}

const out = []
for (const [t, n] of Object.entries(types).sort((a, b) => b[1] - a[1])) {
  if (!named(t)) out.push(['type', t, n])
}
for (const [t, ks] of Object.entries(kinds)) {
  for (const [k, n] of Object.entries(ks).sort((a, b) => b[1] - a[1])) {
    const ok = t === 'landmark' ? (LM18.has(k) || named(k)) : named(k)
    if (!ok) out.push(['kind', t + ':' + k, n])
  }
}
console.log('node types in the world:', Object.keys(types).length,
  ' landmark kinds:', Object.keys(kinds.landmark ?? {}).length)
if (!out.length) console.log('\nevery word this world stands up is a word the window names.')
else {
  console.log('\nNOT NAMED ANYWHERE IN window-web.html:')
  for (const [what, word, n] of out.sort((a, b) => b[2] - a[2])) {
    console.log('  ' + String(n).padStart(5) + '  ' + what.padEnd(5) + ' ' + word)
  }
}
// and the mobs
const mt = {}
for (const m of Object.values(w.mobs ?? {})) mt[m.type] = (mt[m.type] ?? 0) + 1
const badMobs = Object.entries(mt).filter(([t]) => !named(t))
console.log('\ncreature kinds:', Object.keys(mt).length,
  badMobs.length ? ' NOT NAMED: ' + badMobs.map(([t, n]) => t + ' x' + n).join(', ') : ' all named')
