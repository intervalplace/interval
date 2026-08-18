// hold the window's copied tables to the engine's, for the javelin line
import { readFileSync } from 'fs'
const W = readFileSync('window-web.html','utf8'), E = readFileSync('engine.js','utf8')
const grab = (src, name, open='{', close='}') => {
  const i = src.indexOf(name); if (i < 0) return null
  const a = src.indexOf(open, i); let d = 0, j = a
  for (; j < src.length; j++) { if (src[j] === open) d++; else if (src[j] === close) { d--; if (!d) break } }
  return Function('return ' + src.slice(a, j + 1))()
}
const setOf = (src, name) => { const i = src.indexOf(name); const a = src.indexOf('[', i)
  let d = 0, j = a; for (; j < src.length; j++) { if (src[j]==='[') d++; else if (src[j]===']'){d--; if(!d) break} }
  return new Set(Function('return ' + src.slice(a, j+1))()) }
let bad = 0
const ok = (c,m) => { console.log((c?'  ok  ':'  FAIL')+'  '+m); if(!c) bad++ }
const JAV = ['iron-javelin','steel-javelin','star-javelin']
const eW = grab(E,'const WEAPONS = ')
const wEquip = setOf(W,'const EQUIPPABLE = new Set(')
const wRanged = setOf(W,'const RANGED_ITEMS = new Set(')
const wReach = grab(W,'const WEAPON_REACH = ')
const wPrice = grab(W,'const PRICES = ')
const ePrice = grab(E,'const PRICES = ')
console.log('\n--- the window agrees with the engine about javelins ---')
for (const j of JAV) {
  ok(wEquip.has(j), `${j} is wieldable in the window`)
  ok(wRanged.has(j), `${j} is drawn, not swung`)
  ok(wReach[j] === eW[j].reach, `${j} reach ${wReach[j]} matches engine ${eW[j].reach}`)
  ok(wPrice[j] === ePrice[j], `${j} priced ${wPrice[j]} matches engine ${ePrice[j]}`)
  ok(W.includes(`case '${j}'`), `${j} has an icon`)
}
console.log('\n--- and the handgonne, which was missing from RANGED_ITEMS ---')
ok(wRanged.has('handgonne'), 'handgonne is drawn, not swung')
ok(wReach['handgonne'] === eW['handgonne'].reach, `handgonne reach ${wReach['handgonne']} matches engine`)
console.log('\n--- every engine ranged weapon is known to the window ---')
for (const [k,v] of Object.entries(eW)) if (v.ranged) {
  if (!wRanged.has(k)) { console.log('  MISSING from RANGED_ITEMS: '+k); bad++ }
  if (wReach[k] !== v.reach) { console.log(`  reach drift: ${k} window ${wReach[k]} vs engine ${v.reach}`); bad++ }
}
if (!bad) console.log('  ok    all of them')


// ---------- the resync: the window's copied tables against the engine ----------
console.log('\n--- copied tables ---')
const blk = (src, name, o='{', c='}') => { const i = src.indexOf(name); const a = src.indexOf(o, i)
  let d = 0, j = a; for (; j < src.length; j++) { if (src[j]===o) d++; else if (src[j]===c) { d--; if(!d) break } }
  return src.slice(a, j+1) }
const strip = (t) => t.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n').replace(/\s+\/\/.*$/gm, '')
// the engine's tables name a few constants inline; bind them so a table can be
// read here exactly as the engine wrote it, rather than copied by hand again
const CONSTS = Object.fromEntries([...E.matchAll(/^const ([A-Z][A-Z_0-9]*) = (\d+)/gm)].map((m) => [m[1], +m[2]]))
const ev = (t) => Function(...Object.keys(CONSTS), 'return ' + strip(t))(...Object.values(CONSTS))
for (const [label, eName, wName] of [
  ['recipes', 'const RECIPES = ', 'const FORGE = '],
  ['smithing requirements', 'const SMITH_REQS = ', 'const FORGE_REQ = '],
  ['stall stock', 'const STALL_SELLS = ', 'const STALL_SELLS = '],
  ['prices', 'const PRICES = ', 'const PRICES = '],
]) {
  const e = ev(blk(E, eName)), w = ev(blk(W, wName))
  const ek = Object.keys(e).sort(), wk = Object.keys(w).sort()
  const miss = ek.filter(k => !(k in w)), ext = wk.filter(k => !(k in e))
  const diff = ek.filter(k => k in w && JSON.stringify(e[k]) !== JSON.stringify(w[k]))
  ok(!miss.length && !ext.length && !diff.length,
    `${label}: ${ek.length} entries` +
    (miss.length ? ` MISSING ${miss.join(',')}` : '') +
    (ext.length ? ` EXTRA ${ext.join(',')}` : '') +
    (diff.length ? ` DIFFERENT ${diff.join(',')}` : ''))
}
const eW2 = grab(E, 'const WEAPONS = ')
const wSpec = ev(blk(W, 'const SPEC_OF = '))
const eSpec = Object.fromEntries(Object.entries(eW2).filter(([, v]) => v.spec).map(([k, v]) => [k, v.spec]))
ok(JSON.stringify(eSpec) === JSON.stringify(wSpec), `specials: ${JSON.stringify(wSpec)}`)
const wSays = ev(blk(W, 'const SPEC_SAYS = '))
ok(Object.values(eSpec).every(sp => sp in wSays), 'every special shape has a caption')

console.log('\n--- the keeper is out of the goods trade ---')
ok(!/do: 'sell'/.test(W), 'the window never sends `sell`')
ok(!/data-sell=/.test(W), 'and offers no button for it')
ok(/do: 'consign'/.test(W) && /do: 'deliver'/.test(W) && /do: 'release'/.test(W),
  'the counter sends consign, deliver and release')
for (const v of ['consign', 'release', 'deliver'])
  ok(new RegExp(`a\\.do === '${v}'`).test(W), `\`${v}\` has a line in the action mapper`)


console.log('\n--- every node type answers a click ---')
{
  const nt = (() => { const i = E.indexOf('NODE_TYPES'); const a = E.indexOf('[', i); let d = 0, j = a
    for (; j < E.length; j++) { if (E[j]==='[') d++; else if (E[j]===']') { d--; if (!d) break } }
    return [...E.slice(a, j+1).matchAll(/'([a-z-]+)'/g)].map((m) => m[1]) })()
  const k = W.indexOf('if (blockedAt(world, x, y)) return')
  const seen = new Set([...W.slice(0, k).matchAll(/n\.type === '([a-z-]+)'/g)].map((m) => m[1]))
  // gatherables fall through to the gather path on purpose; everything else
  // that falls through says "You begin gathering." and sends a refused input
  const GATHERABLE = new Set(['tree','oak-tree','ironbark-tree','heartwood-tree','gallows-oak','rock',
    'iron-rock','coal-rock','magic-rock','mother-lode','brimstone-vent','gold-rock','fishing-spot',
    'eel-spot','deep-fish-spot','gibbet-shoal','muck-heap','rockfall','plot'])
  const mute = nt.filter((t) => !seen.has(t) && !GATHERABLE.has(t))
  ok(!mute.length, `types with no click branch: ${mute.join(', ') || 'none'}`)
  for (const t of ['stall', 'store', 'bank', 'market', 'anvil'])
    ok(seen.has(t), `\`${t}\` answers a click`)
}



console.log('\n--- the skill guide ---')
{
  const eng = await import('./engine.js')
  const u = eng.default.skillUnlocks()
  const w = ev(blk(W, 'const SKILL_UNLOCKS = '))
  const ek = Object.keys(u).sort(), wk = Object.keys(w).sort()
  ok(ek.join() === wk.join(), `${ek.length} skills carry gates`)
  let drift = []
  for (const k of ek) {
    const a = (u[k] ?? []).map((e) => e.level + '|' + e.text).join(';')
    const b = (w[k] ?? []).map(([l, t]) => l + '|' + t).join(';')
    if (a !== b) drift.push(k)
  }
  ok(!drift.length, `every gate matches the engine${drift.length ? ' — DRIFT in ' + drift.join(',') : ''}`)
  ok(/data-skill="/.test(W), 'skill rows are clickable')
  ok(/function openSkillGuide/.test(W), 'the guide panel exists')
  const ORDER = ev(blk(W, 'const SKILL_ORDER = ', '[', ']'))
  const noGate = ORDER.filter((k) => !(k in w))
  const noted = ev(blk(W, 'const SKILL_NOTE = '))
  const unexplained = noGate.filter((k) => !(k in noted))
  ok(!unexplained.length,
    `skills that gate nothing say so: ${noGate.join(', ')}${unexplained.length ? ' — UNEXPLAINED ' + unexplained.join(',') : ''}`)
}

process.exit(bad ? 1 : 0)
