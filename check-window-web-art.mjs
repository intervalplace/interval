// DOES THE BROWSER WINDOW PARSE, AND CAN IT DRAW THE WHOLE WORLD?
//
// Two questions, and the first one is the one that matters.
//
// IT DID NOT PARSE. For eighteen days window-web.html shipped with ELEVEN
// ternary colons commented out -- `a.do === 'move' ? {...}` and then, on the
// next line, a comment ending in `:`. That is not a wrong colour or a slow
// path: it is a SyntaxError, the whole script block fails, and the page is
// blank. Nothing in this world could be reached through it at all.
//
// Nothing caught it because nothing ever parsed the file. Every other check
// in this directory reads it as TEXT -- readFileSync and a regular expression
// -- so they all went on passing, comparing tables inside a document no
// browser could execute. This parses it first, and everything else here is
// secondary to that.
//
// The rest holds the window's ART to the engine's vocabulary, the same
// standing bar the Unreal window is held to: every word the world uses,
// drawn. Not remembered -- counted.
//
//   node check-window-web-art.mjs
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import E from './engine.js'

const W = fs.readFileSync('window-web.html', 'utf8')
let bad = 0
const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL') + '  ' + m); if (!c) bad++ }
const list = (v) => v instanceof Set ? [...v] : Array.isArray(v) ? v : Object.keys(v || {})

// ---- IT HAS TO PARSE ----
const blocks = [...W.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1])
blocks.sort((a, b) => a.length - b.length)
const js = blocks[blocks.length - 1]
fs.writeFileSync('/tmp/_win_check.js', js)
let parses = true, why = ''
try { execFileSync('node', ['--check', '/tmp/_win_check.js'], { stdio: 'pipe' }) }
catch (e) { parses = false; why = String(e.stderr).split('\n').slice(0, 3).join(' ') }
ok(parses, 'the window parses' + (parses ? '' : ' -- ' + why))
if (!parses) { console.log('\nnothing else was checked: a window that does not parse draws nothing'); process.exit(1) }

// ---- EVERY ITEM HAS A SPRITE ----
const spriteSrc = (() => {
  const a = W.indexOf('function itemSprite(')
  const b = W.indexOf('\nfunction ', a + 10)
  return W.slice(a, b > 0 ? b : a + 90000)
})()
const cased = new Set([...spriteSrc.matchAll(/case\s+'([^']+)'/g)].map((m) => m[1]))
const tableOf = (name) => {
  const i = W.indexOf(`const ${name} = {`)
  if (i < 0) return {}
  const t = W.slice(i, W.indexOf('\n}', i))
  const o = {}
  for (const m of t.matchAll(/'?([A-Za-z0-9_.-]+)'?\s*:\s*'([^']*)'/g)) o[m[1]] = m[2]
  return o
}
const alias = tableOf('ICON_ALIAS')
const items = list(E.ITEMS)
const noSprite = items.filter((w) => !cased.has(w) && !alias[w]
  && !cased.has(w.split('-').slice(1).join('-')) && !cased.has(w.split('-')[0]))
ok(!noSprite.length, `all ${items.length} items have a sprite` +
   (noSprite.length ? `, MISSING ${noSprite.join(',')}` : ''))

// ---- EVERY CREATURE HAS A BODY ----
// The goblin is the fallback at the end of the chain, deliberately, so it is
// the one word allowed to have no test of its own.
const mobDrawn = new Set([...W.matchAll(/m\.type === '([^']+)'/g)].map((m) => m[1]))
const mobs = list(E.MOB_STATS).filter((w) => w !== 'goblin')
const noBody = mobs.filter((w) => !mobDrawn.has(w))
ok(!noBody.length, `all ${mobs.length} creatures beside the goblin have a body` +
   (noBody.length ? `, MISSING ${noBody.join(',')}` : ''))

// ---- EVERY THING THAT STANDS IN THE WORLD IS KNOWN ----
const nodeDrawn = new Set([...W.matchAll(/n\.type === '([^']+)'/g)].map((m) => m[1]))
for (const t of ['NODE_FAMILY', 'NODE_TINT', 'NODE_NAME']) {
  const i = W.indexOf(`const ${t} = {`)
  if (i < 0) continue
  for (const m of W.slice(i, W.indexOf('\n}', i)).matchAll(/'([^']+)'\s*:/g)) nodeDrawn.add(m[1])
}
const nodes = list(E.NODE_TYPES)
const unknown = nodes.filter((w) => !nodeDrawn.has(w))
ok(!unknown.length, `all ${nodes.length} node kinds are known` +
   (unknown.length ? `, UNKNOWN ${unknown.join(',')}` : ''))

// ---- AND THE NUMBERS IT COPIED FROM THE ENGINE ----
const bellW = /const BELL_PULLS = (\d+)/.exec(W)
const bellE = /BELL_PULLS = (\d+)/.exec(fs.readFileSync('engine.js', 'utf8'))
ok(bellW && bellE && bellW[1] === bellE[1],
   `BELL_PULLS ${bellW?.[1]} matches the engine's ${bellE?.[1]}`)

console.log(bad ? `\n${bad} FAILED` : '\nall good')
process.exit(bad ? 1 : 0)
