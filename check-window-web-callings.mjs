// §5k/§5w, for window-web: THE FLAT WINDOW CAN SAY IT TOO.
//
// window-web has named the callings in its skill guide since the guide was
// written, from a hand copy of a table the engine owns — and had no line in its
// act ladder for `swear`, so no citizen could ever say one. It also knew
// nothing of the ceiling, so a citizen would have watched a bar stop at fifty
// and concluded the world was broken.
//
// This is a source check rather than a boot: window-web is 812 KB and boots
// against its own machinery. What it holds is the wiring, which is what was
// missing.

import { readFileSync } from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const E = require('./engine.js')
let bad = 0
const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL') + '  ' + m); if (!c) bad++ }
const src = readFileSync('window-web.html', 'utf8')

// ---- the three verbs reach the bridge ----
for (const v of ['swear', 'teach', 'part'])
  ok(new RegExp("a\\.do === '" + v + "'").test(src), "the act ladder carries `" + v + "`")
ok(/a\.attester === undefined/.test(src),
   'and an unattested swearing is still legal (\u00a75w): the first forester has nobody')

// ---- the tables come from the pillar ----
ok(/fetch\('\/api\/tables'/.test(src), 'it asks the pillar for the callings rather than trusting its copy')
ok(/for \(const k of Object\.keys\(CALLINGS_OF\)\) delete CALLINGS_OF\[k\]/.test(src),
   'and clears its own copy before taking them')
ok(/THIS IS A FALLBACK/.test(src),
   'the copy is labelled a fallback, so nobody edits it thinking it is the source')

// ---- and the ceiling and the grade are this world's, not the old one's ----
ok(/function capOfSkill/.test(src), 'it knows the ceiling on a trade')
ok(/no ceiling: yours/.test(src) && /until you swear/.test(src),
   'and says it where the bar is, so a citizen does not think the world broke')
ok(/function gradeOfCitizen/.test(src), 'and the grade')
ok(/deep && \(p\.raised \?\? 0\) >= 1 \? 'master' : 'journeyman'/.test(src),
   '\u00a75x: a hundred alone is a journeyman until the craft admits them')
ok(/return 'newcomer'/.test(src) && /return 'apprentice'/.test(src),
   '\u00a75w: and `apprentice` means taken on, not "below fifty"')

// ---- the copy, while it lasts, must agree with the engine ----
const copy = {}
for (const m of src.slice(src.indexOf('const CALLINGS_OF = {'), src.indexOf('}', src.indexOf('const CALLINGS_OF = {')) + 1)
  .matchAll(/(\w+): \[([^\]]+)\]/g)) copy[m[1]] = m[2].replace(/['\s]/g, '').split(',')
const real = {}
for (const [name, c] of Object.entries(E.SWORN)) (real[c.skill] ??= []).push(name)
// §ORDER IS NOT DRIFT. The engine lists prowess as berserker/warden/fighter and
// the window as fighter/berserker/warden — the same three callings, and the
// guide prints them as a set. Comparing sequence would have reported a drift
// that is not one, and a check that cries wolf gets ignored the day it is right.
const same = (a, b) => [...(a || [])].sort().join() === [...(b || [])].sort().join()
const wrong = Object.keys(real).filter(k => !same(copy[k], real[k]))
ok(wrong.length === 0, 'and the fallback still matches the engine today (' +
   (wrong.length ? 'DRIFTED: ' + wrong.join(' ') : Object.keys(real).length + ' trades') + ')')
console.log(bad ? '\n  ' + bad + ' failed'
  : '\n  ok    the flat window can swear, teach, part, and say what the ceiling is')
process.exit(bad ? 1 : 0)
