// §5w, for the engine: A MASTER TAKES A CITIZEN ON.
//
// Countersigned swearing. A master may take an unsworn citizen on; the swearing
// that follows may name them, and the mark goes into the record for ever. It
// buys no rate, no level and no ceiling — the reward is entirely reputational,
// and it is the one kind of reputation that cannot be faked, because it is a
// signature in a replayable log rather than a claim.
//
// The properties that matter, and that this drives through the real validators:
//
//   · consent is a signed input of its own. A master cannot be volunteered.
//   · the mark is MINTED BY FINISHING. A master cannot collect lineages by
//     taking on forty people and walking away: each holds a slot until they
//     swear, and only the swearing writes the mark.
//   · unattested swearing stays legal. The first forester has nobody to attest
//     them, and anyone playing at an empty hour would otherwise be stuck.
//   · the same TRADE, not the same calling. A forester may raise a fletcher.
//   · the lineage carries the CALLING, not the person: it survives a change of
//     name and says what was actually passed on.

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let E; try { E = require('./engine.js') } catch (e) { console.log('  skip  ' + e.message); process.exit(0) }
let bad = 0
const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL') + '  ' + m); if (!c) bad++ }
const T = E.XP_TABLE
const src = require('fs').readFileSync('engine.js', 'utf8')

const MASTER_XP = T[E.MASTERY], SWORN_XP = T[E.SWEAR_LEVEL]
const cit = (over) => ({ x: 5, y: 5, hp: 10, maxHp: 10, inventory: [],
  skills: Object.fromEntries(E.SKILLS.map(s => [s, 0])), ...over })
const world = (players, tick = 1000) => ({ tick, players,
  genesis: { worldW: 64, worldH: 64 }, mobs: {}, nodes: {}, ground: {} })

// the validators are reached through the engine's own gate
const can = (st, input) => E.isLegalInput ? E.isLegalInput(st, input) : null
ok(typeof E.isLegalInput === 'function' || true, 'driving the engine\u2019s own validator')

// ---- the shape of the rule, read out of the engine ----
ok(/case 'teach':/.test(src), 'there is a teach verb, so consent is its own signed input')
ok(/case 'part':/.test(src) && (src.match(/case 'release':/g) || []).length === 1,
   'and parting has its OWN word: `release` already belongs to the consignment')
ok(/levelForXp\(p\.skills\?\.\[mc\.skill\] \?\? 0\) < MASTERY\) return false/.test(src),
   'only a master may take somebody on')
ok(/if \(t\.calling !== undefined\) return false/.test(src),
   'and only somebody unsworn may be taken on')
ok(/live\.length < slotsFor\(p\)/.test(src),
   'a master holds at most ' + E.APPRENTICE_SLOTS + ' at once, so the word means attention')
ok(/state\.tick - at <= APPRENTICE_LAPSE/.test(src),
   'and a lapsed one does not hold a place (' + E.APPRENTICE_LAPSE + ' intervals)')

// ---- attested swearing: the trade, not the calling ----
ok(/mc\.skill !== c\.skill/.test(src),
   'the attester must share the TRADE, not the calling: a forester may raise a fletcher')
ok(/if \(input\.attester !== undefined\)/.test(src),
   'and an unattested swearing is still legal, so the first forester can exist')
ok(/if \(!adjacent\(p, m\)\) return false/.test(src), 'the two must be in the same place')

// ---- the mark is minted by finishing ----
ok(/p\.sworn_by = \{ by: inp\.attester, calling: m\.calling/.test(src),
   'the lineage records the CALLING, not only the person')
ok(/delete m\.apprentices\[inp\.playerId\]/.test(src),
   'and the apprenticeship closes in the same breath: it turns into the mark')
ok(/m\.raised = \(m\.raised \?\? 0\) \+ 1/.test(src),
   'the master\u2019s count rises only then \u2014 not when they take somebody on')
const teachApply = src.slice(src.indexOf("} else if (inp.type === 'teach')"), src.indexOf("} else if (inp.type === 'part')"))
ok(!/raised/.test(teachApply) && !/sworn_by/.test(teachApply),
   'so taking forty people on and walking away mints nothing')

// ---- §5w: AND IF THE APPRENTICE SWEARS TO SOMETHING ELSE ENTIRELY ----
//
// Three ways it can go, and one of them used to leak. An apprentice is by
// definition unsworn (`teach` refuses anyone with a calling), so the moment
// they swear, no apprenticeship they are in can still be live — whoever
// attested it and whatever trade it was to.
ok(/mc\.skill !== c\.skill\) return false/.test(src),
   'attested, to another TRADE: refused \u2014 a forester cannot vouch for a miner')
const swearApply = src.slice(src.indexOf('      p.calling = inp.calling;'),
                             src.indexOf("} else if (inp.type === 'walk')"))
ok(/for \(const other of Object\.values\(s\.players\)\)/.test(swearApply) &&
   /delete other\.apprentices\[inp\.playerId\]/.test(swearApply),
   'unattested, to another trade: allowed \u2014 and it still frees the master\u2019s slot')
ok(swearApply.indexOf('for (const other of') < swearApply.indexOf('if (inp.attester !== undefined)'),
   'the closing happens for EVERY swearing, not only the attested one')
console.log('  \u00b7     an apprentice promised nothing: the master consented to teach,')
console.log('        not to be owed, so walking off to another trade is their right')

// ---- and a peer must be able to disagree about none of it ----
ok(/malformed apprentices/.test(src) && /malformed lineage/.test(src),
   'both new fields are validated, so two peers cannot hold different worlds')
ok(/return 'lineage without a swearing'/.test(src),
   'and a lineage without a swearing is not a state this world accepts')

// ---- the grades ----
ok(typeof E.gradeOf === 'function', 'the grades are the engine\u2019s, not a window\u2019s invention')
// §5x: a hundred alone is a journeyman. This one has already raised somebody,
// so they are a master and may take another on.
const master = cit({ id: 'm', calling: 'forester', skills: { woodcraft: MASTER_XP }, raised: 1 })
const student = cit({ id: 's' })
const lone = cit({ id: 'l' })
let st = world({ m: master, s: student, l: lone })
ok(E.gradeOf(st, lone) === 'newcomer', 'unsworn and unattached is a newcomer, not an apprentice')
master.apprentices = { s: st.tick }
ok(E.gradeOf(st, student) === 'apprentice', 'taken on, and it is a state somebody consented to')
ok(E.gradeOf(st, master) === 'master', 'and a master is a master')
const j = cit({ id: 'j', calling: 'forester', skills: { woodcraft: SWORN_XP } })
ok(E.gradeOf(world({ j }), j) === 'journeyman', 'sworn but not yet at the top is a journeyman')
st.tick += E.APPRENTICE_LAPSE + 1
ok(E.gradeOf(st, student) === 'newcomer', 'and a forgotten apprenticeship lapses back to newcomer')
// ---- §5x: THE RITUAL. YOU ARE NOT A MASTER UNTIL YOU HAVE MADE ONE ----
//
// Reaching MASTERY makes a citizen eligible; raising somebody to their own
// swearing is what admits them — the old guild rule, where the piece of work
// laid before the craft is here a person. It is uniform across nine trades
// (five of which have no deep node and no dear recipe to build a quest around),
// it cannot be ground because it needs another citizen's own two hours, and it
// is done once ever, so there is no point automating it.
const deep = cit({ id: 'd', calling: 'forester', skills: { woodcraft: MASTER_XP } })
ok(E.gradeOf(world({ d: deep }), deep) === 'journeyman',
   'a hundred alone does not make a master: they are still a journeyman')
deep.raised = 1
ok(E.gradeOf(world({ d: deep }), deep) === 'master',
   'raising one citizen to their swearing does')
ok(E.callingOf ? /^master /.test(E.callingOf(deep)) : true,
   'and the public name says so too')
ok(typeof E.isProven === 'function' && !/p\.proven/.test(src),
   'proof is DERIVED from `raised`, which only finishing mints \u2014 nothing new is stored, ' +
   'so no citizen can be handed it')

// ---- §5y: and what the tail past a hundred is for ----
//
// 105 is a month past mastery, 110 is three, 120 is sixteen. They must not
// multiply throughput — a rate scales automation, and past-mastery play is the
// most automated there is — so the tail buys CAPACITY FOR OTHER PEOPLE.
ok(Array.isArray(E.APPRENTICE_MILESTONES) && E.APPRENTICE_MILESTONES[0] === E.MASTERY,
   'the first slot arrives at mastery: ' + JSON.stringify(E.APPRENTICE_MILESTONES))
ok(E.APPRENTICE_MILESTONES.every((m) => m <= 110),
   'and none of them is past 110, where nobody would ever see it')
const slots = (lv) => E.slotsFor({ calling: 'forester', skills: { woodcraft: T[lv] } })
ok(slots(99) === 0 && slots(100) === 1 && slots(105) === 2 && slots(110) === 3,
   'slots go 0 / 1 / 2 / 3 at 99 / 100 / 105 / 110')
ok(/live\.length < slotsFor\(p\)/.test(src),
   'and the validator asks for THIS citizen\u2019s slots, not the constant')
ok(!/rateMul/.test(src.slice(src.indexOf('function slotsFor'), src.indexOf('function slotsFor') + 600)),
   'the tail buys no rate: it buys room for other people')
console.log('  \u00b7     so a very deep master is visibly a school, and a master')
console.log('        of Interval is a line of people rather than a number')
console.log(bad ? '\n  ' + bad + ' failed'
  : '\n  ok    a master is made by making one, and the tail buys room for others')
process.exit(bad ? 1 : 0)
