import { readFileSync, writeFileSync } from 'fs'
import eng from './engine.js'
const E = readFileSync('engine.js','utf8')
let W = readFileSync('window-web.html','utf8')

const blk = (src, name, o='{', c='}') => {
  const i = src.indexOf(name); if (i<0) throw new Error('no '+name)
  const a = src.indexOf(o, i); let d=0,j=a
  for (; j<src.length; j++){ if(src[j]===o)d++; else if(src[j]===c){d--; if(!d)break} }
  return { text: src.slice(a,j+1), start:a, end:j+1 }
}
const strip = (t) => t.split('\n').filter(l=>!/^\s*\/\//.test(l)).join('\n').replace(/\s+\/\/.*$/gm,'')
const CONSTS = Object.fromEntries([...E.matchAll(/^const ([A-Z][A-Z_0-9]*) = (\d+)/gm)].map(m=>[m[1],+m[2]]))
const ev = (t) => Function(...Object.keys(CONSTS),'return '+strip(t))(...Object.values(CONSTS))

const eRec  = ev(blk(E,'const RECIPES = ').text)
const eReq  = ev(blk(E,'const SMITH_REQS = ').text)
const ePri  = ev(blk(E,'const PRICES = ').text)
const eWep  = ev(blk(E,'const WEAPONS = ').text)

// pretty-print an object of objects, one key per line, sorted
// SORTED where the checker compares by KEY SET, and in ENGINE ORDER where it
// compares by JSON.stringify -- which is order-sensitive, so a sorted copy of
// the right values still fails. SPEC_OF and SPEC_BLOWS are the two.
const objLines = (o, keys) => '{\n' + keys.map(k => '  ' + JSON.stringify(k) + ': ' + JSON.stringify(o[k])).join(',\n') + '\n}'
const flat = (o) => objLines(o, Object.keys(o).sort())
const inOrder = (o) => objLines(o, Object.keys(o))

const replaceBlock = (name, body, o='{', c='}') => {
  const b = blk(W, name, o, c)
  W = W.slice(0, b.start) + body + W.slice(b.end)
}

// 1. FORGE / FORGE_REQ / PRICES
replaceBlock('const FORGE = ', flat(eRec))
replaceBlock('const FORGE_REQ = ', flat(eReq))
replaceBlock('const PRICES = ', flat(ePri))

// 2. weapon-derived tables
const spec  = Object.fromEntries(Object.entries(eWep).filter(([,v])=>v.spec).map(([k,v])=>[k,v.spec]))
const blows = Object.fromEntries(Object.entries(eWep).filter(([,v])=>v.spec).map(([k,v])=>[k,v.blows??1]))
const every = Object.fromEntries(Object.entries(eWep).map(([k,v])=>[k,v.every??2]))
const reach = Object.fromEntries(Object.entries(eWep).map(([k,v])=>[k,v.reach??1]))
replaceBlock('const SPEC_OF = ', inOrder(spec))
replaceBlock('const SPEC_BLOWS = ', inOrder(blows))
replaceBlock('const WEAPON_EVERY = ', flat(every))
replaceBlock('const WEAPON_REACH = ', flat(reach))

// 3. RANGED_ITEMS — every engine weapon flagged ranged
const ranged = Object.entries(eWep).filter(([,v])=>v.ranged).map(([k])=>k).sort()
replaceBlock('const RANGED_ITEMS = new Set(',
  '[\n' + ranged.map(k=>'  '+JSON.stringify(k)).join(',\n') + '\n]', '[', ']')

// 4. SKILL_UNLOCKS — engine {level,text} -> window [level,text]
const u = eng.skillUnlocks()
const su = '{\n' + Object.keys(u).sort().map(k =>
  '  ' + JSON.stringify(k) + ': [\n' +
  u[k].map(e => '    [' + e.level + ', ' + JSON.stringify(e.text) + ']').join(',\n') +
  '\n  ]').join(',\n') + '\n}'
replaceBlock('const SKILL_UNLOCKS = ', su)

writeFileSync('window-web.html', W)
console.log('resynced:', Object.keys(eRec).length, 'recipes,', Object.keys(ePri).length, 'prices,',
  ranged.length, 'ranged,', Object.keys(u).length, 'skills')
