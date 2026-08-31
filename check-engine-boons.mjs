// §5z, for the engine: WHAT A MASTERY IS WORTH, IN EVERY TRADE.
//
// §5k gave the four gathering trades a double yield and left the other five
// with nothing to double: mourning has no seam, prowess has no recipe,
// marksmanship, sorcery and wayfaring produce no stack of things. A mastery
// that pays in four trades and pays a word in five is not a mastery.
//
// Every boon here passes the same test, and it is the test that killed the
// calling rate: NO MULTIPLIERS ON THROUGHPUT, and nothing that merely rewards
// uptime. Where a trade has an output, a master gets two of it; where it does
// not, the boon is rhythm or protection.
//
// And every one of them goes through `masterOf`, which asks all three
// questions: sworn to that trade, at MASTERY, and admitted by §5x. A boon
// nobody was admitted for is a number rewarding itself.

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let E; try { E = require('./engine.js') } catch (e) { console.log('  skip  ' + e.message); process.exit(0) }
let bad = 0
const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL') + '  ' + m); if (!c) bad++ }
const src = require('fs').readFileSync('engine.js', 'utf8')
const T = E.XP_TABLE

// ---- one gate, asked the same way at every site ----
const cit = (calling, skill, lv, raised) => ({ calling, raised, skills: { [skill]: T[lv] } })
ok(typeof E.masterOf === 'function', 'there is one question, and it is a function')
ok(E.masterOf(cit('fighter', 'prowess', 100, 1), 'prowess'), 'a proven master of the trade: yes')
ok(!E.masterOf(cit('fighter', 'prowess', 100, 0), 'prowess'),
   'a hundred but never admitted (\u00a75n): NO \u2014 a boon nobody was admitted for is a number rewarding itself')
ok(!E.masterOf(cit('fighter', 'prowess', 99, 1), 'prowess'), 'admitted but not yet at a hundred: no')
ok(!E.masterOf(cit('fighter', 'prowess', 100, 1), 'woodcraft'), 'and never in a trade they did not swear to')

// ---- every trade is paid, and paid in its own coin ----
const site = (re) => re.test(src)
ok(site(/const _master = masterOf\(p, y\.skill\)/), 'gathering \u2014 two where others take one')
ok(site(/if \(!masterOf\(p, 'marksmanship'\)\) consumeItem/),
   'marksmanship \u2014 an arrow that hits is an arrow you keep')
ok(site(/masterOf\(p, 'sorcery'\) \? MASTER_YIELD : 1/),
   'sorcery \u2014 three stones press two sigils')
ok(site(/masterOf\(p, 'mourning'\) \? MASTER_YIELD : 1/),
   'mourning \u2014 an offering counts double')
ok(site(/if \(masterOf\(q, 'wayfaring'\)\) return;/),
   'wayfaring \u2014 a master runner does not spill')
ok(site(/masterOf\(p, 'prowess'\) \? MASTER_REC_NUM : MASTER_REC_DEN/),
   'prowess \u2014 the arm comes back a quarter sooner')
const paid = new Set()
for (const m of src.matchAll(/masterOf\((?:p|q), '([a-z]+)'\)/g)) paid.add(m[1])
paid.add('woodcraft'); paid.add('earthcraft'); paid.add('shorecraft'); paid.add('hearthcraft')
ok(E.SKILLS.every((s) => paid.has(s)),
   'all ' + E.SKILLS.length + ' trades are paid: ' + E.SKILLS.filter((s) => !paid.has(s)).join(' ') || 'none missing')

// ---- and not one of them is a throughput multiplier ----
ok(!/rateMul \*=/.test(src), 'no boon touches the gather rate: a rate scales automation')
const spec = src.slice(src.indexOf('const _rec9'), src.indexOf('const _rec9') + 900)
ok(!/blows|dmg \*|hit \*/.test(spec),
   'prowess pays in RHYTHM, not damage: dual wielding and a second blow are ' +
   'multipliers, and a multiplier in a fight is a balance problem before it is a reward')
ok(E.MASTER_REC_NUM < E.MASTER_REC_DEN, 'the special recovers in ' +
   E.MASTER_REC_NUM + '/' + E.MASTER_REC_DEN + ' of the time, and the ordinary cadence is untouched')
// the sorcery trap, written down where the next person will find it
ok(/experience COMES FROM spending sigils/.test(src),
   'and the sorcery trap is recorded: a master who stopped spending would stop earning')
console.log(bad ? '\n  ' + bad + ' failed'
  : '\n  ok    nine trades, nine boons, and not a throughput multiplier among them')
process.exit(bad ? 1 : 0)
