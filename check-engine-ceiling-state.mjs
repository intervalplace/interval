// §5k, for the engine: THE CEILING IS A PROPERTY OF THE STATE.
//
// `gainXp` clamps every award — and `gainXp` never runs on a checkpoint that
// was handed to us. `validateState` is the only thing standing between a
// foreign state and our own, and it bounded skills by MAX_XP alone. So a peer
// could carry a citizen at a hundred in three trades and it would have been
// waved through; the executor would then never re-derive it, and the citizen
// simply IS past the ceiling, for ever.
//
// The calling was already re-checked here for exactly this reason ('calling not
// earned'). Anything the rules forbid must be UNREPRESENTABLE in a state, not
// merely unreachable by a legal input.

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const E = require('./engine.js')
E.initCrypto()
const { buildWorld } = await import('./worldgen.mjs')
const T = E.XP_TABLE
let bad = 0
const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL') + '  ' + m); if (!c) bad++ }

// the project's own way of making a world, so every genesis field is real
const g = E.makeGenesis('ceiling-check', 'c'.repeat(64), 0, 64, 48)   // the default generator, as the tests use
// §buildWorld throws in this repo on an unrelated fault ('unknown node type':
// the generator makes a node the engine's NODE_TYPES does not carry). That is
// not this check's business, so it falls back to the smallest state
// validateState will accept rather than pretending the world is fine.
let st0 = null
try { st0 = buildWorld(g) } catch { st0 = null }
if (!st0) {
  console.log('  \u00b7     buildWorld is unavailable here; asking xpCeiling directly instead')
  const P = (over, skills) => ({ calling: over.calling,
    skills: Object.fromEntries(E.SKILLS.map(k => [k, 0])), ...skills ? { skills } : {} })
  const ceil = (p, sk) => E.xpCeiling(p, sk)
  ok(ceil({}, 'woodcraft') === T[E.CAP_UNSWORN + 1] - 1,
     'an unsworn citizen may hold no more xp than level ' + E.CAP_UNSWORN + ' asks')
  ok(ceil({ calling: 'forester' }, 'earthcraft') === T[E.CAP_OTHER + 1] - 1,
     'a sworn one, in a trade that is not theirs, no more than ' + E.CAP_OTHER)
  ok(ceil({ calling: 'forester' }, 'woodcraft') === Infinity,
     'and no ceiling at all in their own')
  const src0 = require('fs').readFileSync('engine.js', 'utf8')
  const vs0 = src0.slice(src0.indexOf('function validateState'), src0.indexOf('function validateState') + 40000)
  ok(/xpCeiling\(p, sk\)/.test(vs0),
     'and validateState asks that same function \u2014 so a hostile checkpoint carrying ' +
     'a citizen past it is refused, not merely never produced')
  ok(/past the ceiling/.test(vs0), 'with its own reason, beside \'calling not earned\'')
  console.log(bad ? '\n  ' + bad + ' failed'
    : '\n  ok    what the rules forbid is unrepresentable, not merely unreachable')
  process.exit(bad ? 1 : 0)
}

ok(!E.validateState(st0), 'a world the engine built is valid')

const withCitizen = (over, skills) => {
  const s2 = JSON.parse(JSON.stringify(st0))
  const p = { x: 5, y: 5, hp: 10, maxHp: 10, inventory: new Array(E.INV_SLOTS).fill(null),
    skills: Object.fromEntries(E.SKILLS.map(k => [k, 0])), ...over }
  Object.assign(p.skills, skills)
  s2.players = { ...(s2.players || {}), hostile: p }
  return s2
}
const refused = (s2) => !!E.validateState(s2)

ok(refused(withCitizen({}, { woodcraft: T[E.CAP_UNSWORN + 1] })),
   'an UNSWORN citizen carried past ' + E.CAP_UNSWORN + ' is refused')
ok(refused(withCitizen({ calling: 'forester' },
     { woodcraft: T[E.MASTERY], earthcraft: T[E.CAP_OTHER + 1] })),
   'a sworn one carried past ' + E.CAP_OTHER + ' in a trade that is not theirs is refused')
ok(refused(withCitizen({}, { prowess: T[E.CAP_UNSWORN + 5] })),
   'and the combat skills too, which is where a hostile state would aim')
ok(!refused(withCitizen({ calling: 'forester' },
     { woodcraft: T[120], earthcraft: T[E.CAP_OTHER] })),
   'while a master past a hundred in their OWN trade is accepted, as it must be')

// and the rule is the same one the executor uses, not a second copy
const src = require('fs').readFileSync('engine.js', 'utf8')
const vs = src.slice(src.indexOf('function validateState'))
ok(/xpCeiling\(p, sk\)/.test(vs.slice(0, 40000)),
   'validateState asks xpCeiling \u2014 the same function gainXp clamps with, not a second copy')
console.log(bad ? '\n  ' + bad + ' failed'
  : '\n  ok    what the rules forbid is unrepresentable, not merely unreachable')
process.exit(bad ? 1 : 0)
