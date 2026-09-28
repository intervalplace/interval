#!/usr/bin/env node
// repair-import-callings.mjs — restore the `calling` on carried citizens.
//
// A founding record written before §5k carried imports WITHOUT their calling.
// When a world dies young (no checkpoint), serve.mjs passes those imports
// through unchanged, every citizen arrives unsworn (ceiling: level 50), and
// anyone carried past 50 makes validateGenesis refuse the founding:
//   "import carries woodcraft past the ceiling"
//
// This tool finds those imports, looks each one's calling up in the archived
// checkpoints (DATA/checkpoints/web-*.json), and writes it back.
//
// Usage:
//   INTERVAL_DATA=DATA node repair-import-callings.mjs                 # dry run
//   INTERVAL_DATA=DATA node repair-import-callings.mjs --write         # apply
//   ... --assign <pid-prefix>=<calling> [--assign ...]                 # by hand
import fs from 'fs'
import path from 'path'
import E from './engine.js'
// registers every generator with the engine, as serve.mjs does; without it
// validateGenesis refuses any non-default world as "not registered"
import './worldgen-any.mjs'
E.initCrypto()

const DATA = (process.env.INTERVAL_DATA || '.').replace(/\/$/, '')
const CPDIR = DATA + '/checkpoints'
const WORLD_FILE = CPDIR + '/world.json'
const args = process.argv.slice(2)
const WRITE = args.includes('--write')
const assign = {}
for (let i = 0; i < args.length; i++) if (args[i] === '--assign') {
  const [pfx, c] = String(args[++i] ?? '').split('=')
  if (!pfx || !c) { console.error('--assign wants <pid-prefix>=<calling>'); process.exit(2) }
  assign[pfx] = c
}

const saved = JSON.parse(fs.readFileSync(WORLD_FILE, 'utf8'))
const imports = saved?.genesis?.imported
if (!Array.isArray(imports) || !imports.length) { console.log('world.json carries no imports; nothing to repair'); process.exit(0) }

const over = (imp, calling) => Object.entries(imp.skills ?? {}).filter(([sk, xp]) => {
  const ceil = E.xpCeiling({ calling: calling ?? undefined, skills: imp.skills }, sk)
  return ceil !== Infinity && xp > ceil
})
const earned = (imp, c) => Object.prototype.hasOwnProperty.call(E.SWORN, c)
  && E.levelForXp(imp.skills?.[E.SWORN[c].skill] ?? 0) >= E.SWEAR_LEVEL
const who = (imp) => imp.pid.slice(0, 12) + (imp.name ? ' (' + imp.name + ')' : '')

// every archived living state, newest first; the one importedFrom names wins
const from = saved.genesis.importedFrom
const archives = fs.readdirSync(CPDIR)
  .filter((f) => /^web.*\.json$/.test(f))
  .map((f) => ({ f, t: fs.statSync(path.join(CPDIR, f)).mtimeMs }))
  .sort((a, b) => b.t - a.t)
  .map(({ f }) => { try { return { f, cp: JSON.parse(fs.readFileSync(path.join(CPDIR, f), 'utf8')) } } catch { return null } })
  .filter((a) => a?.cp?.state?.players)
archives.sort((a, b) => (b.cp.worldId === from?.worldId && b.cp.tick === from?.tick) - (a.cp.worldId === from?.worldId && a.cp.tick === from?.tick))
console.log(`${imports.length} import(s); ${archives.length} archived checkpoint(s) to search`)

let fixed = 0, stuck = 0
for (const imp of imports) {
  const bad = over(imp, imp.calling)
  if (!bad.length) continue
  const skills = bad.map(([sk, xp]) => `${sk} ${xp} (lvl ${E.levelForXp(xp)})`).join(', ')
  let calling = null, src = null
  const hand = Object.entries(assign).find(([pfx]) => imp.pid.startsWith(pfx))
  if (hand) { calling = hand[1]; src = 'by hand' }
  else for (const { f, cp } of archives) {
    const c = cp.state.players[imp.pid]?.calling
    if (c) { calling = c; src = f; break }
  }
  if (calling && earned(imp, calling) && !over(imp, calling).length) {
    console.log(`  fix   ${who(imp)}: ${skills} -> calling ${calling}  [${src}]`)
    imp.calling = calling; fixed++
  } else {
    const cands = Object.keys(E.SWORN).filter((c) => earned(imp, c) && !over(imp, c).length)
    console.log(`  STUCK ${who(imp)}: ${skills}` + (calling ? ` — found '${calling}' but it does not fit` : ' — no calling in any archive')
      + `\n        fits: ${cands.join(', ') || 'nothing (over the ceiling in two trades)'}`
      + `\n        --assign ${imp.pid.slice(0, 12)}=<one of those>`)
    stuck++
  }
}

const verdict = E.validateGenesis(saved.genesis)
console.log(`\n${fixed} fixed, ${stuck} stuck. validateGenesis: ${verdict ?? 'OK'}`)
if (!fixed && !stuck) process.exit(0)
if (!WRITE) { console.log('dry run — nothing written (add --write)'); process.exit(stuck ? 1 : 0) }
if (verdict) { console.error('not writing: the genesis would still be refused'); process.exit(1) }
const backup = WORLD_FILE + '.before-callings-' + Date.now()
fs.copyFileSync(WORLD_FILE, backup)
fs.writeFileSync(WORLD_FILE, JSON.stringify(saved))
console.log(`wrote ${WORLD_FILE} (backup: ${path.basename(backup)})`)
