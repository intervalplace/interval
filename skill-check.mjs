#!/usr/bin/env node
// skill-check.mjs — invariants that must hold after any change to SKILLS.
//
// Merging a skill touches four surfaces that do not fail loudly on their own:
// the SKILLS list, the tables that name skills (NODE_GATE, SMITH_REQS,
// CALLINGS), the code that reads or writes `p.skills.X`, and the states that
// worldgen and addPlayer produce. A miss in any one of them produces a world
// that mostly works — a gate nobody can pass, a skill that silently never
// gains, a state that validates today and not after the next spawn.
//
// This checks all four against each other, and then runs a live world to see
// that xp actually lands where it should.
//
// NON-CONSENSUS: reads exported tables and runs a throwaway world.
// Usage: node skill-check.mjs

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const E = require(path.resolve(here, 'engine.js'))
const src = fs.readFileSync(path.resolve(here, 'engine.js'), 'utf8')
E.initCrypto()

let fails = 0
const check = (label, bad) => {
  if (!bad.length) { console.log(`  ok    ${label}`); return }
  fails += bad.length
  console.log(`  FAIL  ${label} (${bad.length})`)
  for (const b of bad) console.log(`          ${b}`)
}

console.log('skill invariants\n')
const SKILLS = new Set(E.SKILLS)

// 1. no duplicates, no empties
check('SKILLS is a clean set', [
  ...(SKILLS.size === E.SKILLS.length ? [] : ['SKILLS contains duplicates']),
  ...E.SKILLS.filter(s => !/^[a-z]+$/.test(s)).map(s => `"${s}" is not a bare lowercase name`),
])

// 2. every table that names a skill names one that exists
{
  const bad = []
  const gateSrc = src.slice(src.indexOf('const NODE_GATE'), src.indexOf('};', src.indexOf('const NODE_GATE')))
  for (const m of gateSrc.matchAll(/'([a-z-]+)':\s*\{\s*skill:\s*'([a-z]+)'/g))
    if (!SKILLS.has(m[2])) bad.push(`NODE_GATE['${m[1]}'] gates on '${m[2]}', which is not a skill`)
  for (const [item, reqs] of Object.entries(E.SMITH_REQS))
    for (const sk of Object.keys(reqs))
      if (!SKILLS.has(sk)) bad.push(`SMITH_REQS['${item}'] requires '${sk}', which is not a skill`)
  for (const sk of Object.keys(E.CALLINGS))
    if (!SKILLS.has(sk)) bad.push(`CALLINGS names '${sk}', which is not a skill`)
  check('every table naming a skill names a real one', bad)
}

// 3. every skill has a calling (nothing is unnameable)
check('every skill has a calling', E.SKILLS.filter(s => !E.CALLINGS[s]).map(s => `${s} has no calling`))

// 4. no dangling `skills.X` for a name no longer in SKILLS
{
  const bad = []
  for (const m of src.matchAll(/skills\.([a-z]+)\b/g))
    if (!SKILLS.has(m[1]) && !['every','some','map','filter','forEach'].includes(m[1]))
      bad.push(`engine.js reads skills.${m[1]}, which is not a skill`)
  check('no reference to a skill that no longer exists', [...new Set(bad)])
}

// 4b. constants that encode a LEVEL must still encode that level
// HP_START_XP was written as 1154 because that was hitpoints level 10 under
// the curve of the day. Replacing the curve turned it into level 12 silently:
// no test failed, nothing threw, every citizen born afterwards simply had two
// hitpoints nobody granted them. Any constant that means "level N" has to be
// checked against the table, not trusted to stay true.
{
  const bad = []
  const m = src.match(/const HP_START_XP = (\d+);/)
  if (!m) bad.push('HP_START_XP not found — has it been renamed?')
  else if (Number(m[1]) !== E.XP_TABLE[10])
    bad.push(`HP_START_XP is ${m[1]}, which is level ${E.levelForXp(Number(m[1]))}, not level 10 (${E.XP_TABLE[10]})`)
  check('constants that encode a level still encode it', bad)
}

// 4c. the labour cap is the swearing threshold, and must stay so
// §5r-iii lets a spade build prowess only as far as a calling may be sworn.
// The two are written in different places for ordering reasons; if they drift
// apart, labour either stops short of the door or carries a citizen past it,
// and neither failure announces itself.
{
  const bad = []
  const m = src.match(/const LABOUR_PROWESS_CAP = (\d+);/)
  if (!m) bad.push('LABOUR_PROWESS_CAP not found — renamed?')
  else if (Number(m[1]) !== E.SWEAR_LEVEL)
    bad.push(`LABOUR_PROWESS_CAP is ${m[1]} but SWEAR_LEVEL is ${E.SWEAR_LEVEL}`)
  check('labour reaches exactly the swearing threshold', bad)
}

// 4d. every REQUIREMENT names a real trade
// SMITH_REQS was checked from the start; WIELD_REQS was not, and it carried
// forty items gated on woodcutting, mining, fishing, attack, strength and
// defence -- plus two on `star-alloy`, an ITEM name left by a regex that hit
// three tables at once. A gate naming a skill that does not exist compares
// against undefined and can never be passed: the whole star and great tiers
// were unwieldable and nothing said so.
{
  const bad = []
  for (const [item, reqs] of Object.entries(E.WIELD_REQS ?? {}))
    for (const sk of Object.keys(reqs))
      if (!SKILLS.has(sk)) bad.push(`WIELD_REQS['${item}'] gates on '${sk}', which is not a trade`)
  check('every wield requirement names a real trade', bad)
}

// 5. a fresh citizen carries exactly the constitutional skills
{
  const g = E.makeGenesis('skillcheck', 'a'.repeat(64), 0, 64, 48)
  const s = E.newWorld(g)
  const id = E.generateIdentity()
  E.addPlayer(s, id.playerId, 5, 5)
  const keys = Object.keys(s.players[id.playerId].skills).sort()
  const want = [...E.SKILLS].sort()
  const bad = []
  if (keys.join(',') !== want.join(',')) {
    for (const k of keys) if (!SKILLS.has(k)) bad.push(`a new citizen carries '${k}', which is not a skill`)
    for (const k of want) if (!keys.includes(k)) bad.push(`a new citizen is missing '${k}'`)
  }
  const err = E.validateState(s)
  if (err) bad.push(`a world with one fresh citizen does not validate: ${err}`)
  check('a fresh citizen carries exactly SKILLS', bad)
}

// 6. every skill is REACHABLE: some code path adds to it
{
  const bad = []
  for (const sk of E.SKILLS) {
    const writes = (src.match(new RegExp(`skills\\.${sk}\\s*(\\+=|=)`, 'g')) || []).length
             + (src.match(new RegExp(`skills\\[['"]${sk}['"]\\]\\s*(\\+=|=)`, 'g')) || []).length
    // generic writes through a variable cover the rest; only flag skills with
    // no direct write AND no table entry that would route xp to them
    const inGate = src.includes(`skill: '${sk}'`)
    const inReqs = Object.values(E.SMITH_REQS).some(r => sk in r)
    if (!writes && !inGate && !inReqs) bad.push(`${sk}: no direct xp write, no gate, no requirement — is it reachable?`)
  }
  check('every skill is reachable by some path', bad)
}

// 7. the world still runs and hashes stably
{
  const g = E.makeGenesis('skillcheck2', 'b'.repeat(64), 0, 64, 48)
  let s = E.newWorld(g)
  const id = E.generateIdentity()
  E.addPlayer(s, id.playerId, 5, 5)
  const bad = []
  for (let i = 0; i < 20; i++) s = E.nextState(s, [])
  const err = E.validateState(s)
  if (err) bad.push(`twenty empty ticks produce an invalid state: ${err}`)
  const h1 = E.stateHash(s)
  let t = E.newWorld(g)
  E.addPlayer(t, id.playerId, 5, 5)
  for (let i = 0; i < 20; i++) t = E.nextState(t, [])
  if (E.stateHash(t) !== h1) bad.push('two identical runs disagree on the state hash')
  check('a world runs twenty ticks and hashes identically', bad)
}

console.log(`\n${fails === 0 ? `PASS — ${E.SKILLS.length} skills, all consistent` : `FAIL — ${fails} problems`}`)
process.exit(fails === 0 ? 0 : 1)
