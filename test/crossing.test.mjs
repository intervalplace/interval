// §9b-ii: A CROSSING CARRIES WHAT HAPPENED.
//
// Refounding is this world's answer to a lost quorum, not a disaster:
// CONSENSUS.md says so in as many words, and names a one-witness world "the
// friendly pillar bootstrap mode, not the destination". So a crossing is a
// path citizens are EXPECTED to take, and what it drops is what the world
// forgets about itself every time its clock is restarted.
//
// It used to carry eight things. Measured on a citizen with a life behind
// them, it destroyed: all their money -- on the person AND in the bank -- the
// death tally the handbook promises never falls, `raised` (so a master stopped
// being a master), the Lists charter somebody else's mastery paid for, their
// lineage, their travels, both promise tallies, and every name they knew.
//
// The money was the sharpest of them and the cause reads as deliberate when it
// was not: the vault filter keeps KNOWN_ITEMS, and gold is a NUMBER rather than
// an item, so a life's savings fell through a test written to strip unknown
// goods.
//
// The island itself is NOT at risk and never was: a successor founded with the
// same seed and generator has an identical `geographyHash`. It is the same
// island, re-founded. What these tests hold is that the people crossing it are
// the same people.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import E from '../engine.js'
import { carry } from '../crossing.mjs'

const RULES = 'e'.repeat(64)

// A citizen with a life behind them, in a world about to stop.
function aLifeLived() {
  const g = E.makeGenesis('crossing-test', RULES, 0, 40, 30)
  const s = E.newWorld(g)
  const who = E.generateIdentity()
  const master = E.generateIdentity()
  const friend = E.generateIdentity()
  E.addPlayer(s, who.playerId, 5, 5)
  const p = s.players[who.playerId]
  p.skills.woodcraft = E.XP_TABLE[E.MASTERY]      // mastered their own craft
  p.skills.earthcraft = E.XP_TABLE[40]            // and dabbled
  p.calling = 'forester'
  p.gold = 900
  p.vaults = { somewhere: { 'iron-ore': 5, gold: 123 } }
  p.deaths = 7
  p.raised = 3                                     // they made a master of somebody
  p.chartered = true
  p.sworn_by = { by: master.playerId, calling: 'forester', at: 27000 }
  p.walked = ['crags', 'downs', 'fens', 'greenwood', 'heartlands']
  p.sworn = 600
  p.stood = 1200
  p.friends = [friend.playerId]
  p.known = [friend.playerId]
  p.name = 'delia'
  s.names.delia = who.playerId
  return { g, s, who, master, friend, p }
}

test('the same seed and generator give the same island', () => {
  // The land was never what a crossing risked, and saying so here keeps the
  // other tests honest about what they are actually guarding.
  const a = E.makeGenesis('one-island', RULES, 1700000000000, 40, 30)
  const b = E.makeGenesis('one-island', RULES, 1900000000000, 40, 30)
  assert.equal(a.genesisSeed, b.genesisSeed)
  assert.notEqual(E.worldId(a), E.worldId(b), 'a successor is its own world')
})

test('money crosses, from the person and from the bank', () => {
  const { s } = aLifeLived()
  const out = carry(s.players)[0]
  assert.equal(out.gold, 1023, 'what they carried and what they banked, summed')
  assert.ok(!('gold' in (out.vaults ?? {})),
    'and not left in the vault, where the item filter would drop it again')
})

test('a crossing carries the whole record of a life', () => {
  const { s, who, master, friend } = aLifeLived()
  const out = carry(s.players)[0]
  assert.equal(out.deaths, 7, 'the tally the handbook says never falls')
  assert.equal(out.raised, 3, 'the one number measuring a thing done for somebody else')
  assert.equal(out.chartered, true, 'a charter cost somebody else their mastery')
  assert.equal(out.sworn, 600)
  assert.equal(out.stood, 1200)
  assert.deepEqual(out.walked, ['crags', 'downs', 'fens', 'greenwood', 'heartlands'])
  assert.deepEqual(out.friends, [friend.playerId])
  assert.deepEqual(out.known, [friend.playerId])
  assert.equal(out.sworn_by.by, master.playerId)
  assert.equal(out.sworn_by.calling, 'forester')
  // THE TICK IS NOT CARRIED. It belongs to a clock that has stopped, and
  // 27,000 in a world currently at five reads as the future.
  assert.equal(out.sworn_by.at, 0, 'a lineage crosses without its old clock')
  assert.equal(out.pid, who.playerId)
})

test('and a successor seats all of it, and validates', () => {
  const { s } = aLifeLived()
  const imported = carry(s.players)
  assert.equal(E.validateImports(imported), null,
    'the record must pass the one door no signed input ever came through')

  // found the successor and seat them, the way worldgen does
  const g2 = E.makeGenesis('crossing-test', RULES, 1700000000000, 40, 30)
  const s2 = E.newWorld(g2)
  assert.ok(E.seatImport(s2, imported[0], 6, 6), 'the citizen should seat')
  assert.equal(E.validateState(s2), null, 'and the successor must be a legal world')

  const q = s2.players[imported[0].pid]
  assert.equal(q.gold, 1023, 'their money is on them')
  assert.equal(q.deaths, 7)
  assert.equal(q.raised, 3)
  assert.equal(q.chartered, true)
  assert.equal(q.sworn, 600)
  assert.equal(q.stood, 1200)
  assert.deepEqual(q.walked, ['crags', 'downs', 'fens', 'greenwood', 'heartlands'])
  assert.equal(q.calling, 'forester')
  assert.equal(q.name, 'delia')
  // AND THEY ARE STILL A MASTER. `raised` is what the word is made of, so
  // dropping it quietly demoted every master who ever crossed.
  assert.equal(E.callingOf(q), 'master forester',
    'a master who crosses is still a master')
})

test('a forged record is refused at the door', () => {
  const { s } = aLifeLived()
  const base = carry(s.players)
  const bad = (patch) => {
    const one = { ...base[0], ...patch }
    return E.validateImports([one]) !== null
  }
  assert.ok(bad({ gold: -1 }), 'negative money')
  assert.ok(bad({ deaths: 1.5 }), 'a fractional death')
  assert.ok(bad({ chartered: false }), 'a charter mark that is not the mark')
  assert.ok(bad({ walked: ['fens', 'fens'] }), 'the same country twice')
  assert.ok(bad({ walked: ['greenwood', 'crags'] }), 'travels out of order')
  assert.ok(bad({ known: ['b'.repeat(64), 'a'.repeat(64)] }), 'an unsorted known list')
  assert.ok(bad({ sworn_by: { by: 'nope', calling: 'forester', at: 0 } }), 'a lineage with no master')
  assert.ok(bad({ sworn_by: { by: 'a'.repeat(64), calling: 'forester', at: 0 }, calling: undefined }),
    'a lineage without a swearing')
  assert.ok(bad({ raised: -2 }), 'negative teaching')
})

test('a citizen with nothing to their name crosses cleanly', () => {
  // The common case: a newcomer who has done none of this. None of the new
  // fields should appear at all, because an absent record is not a zero one.
  const g = E.makeGenesis('crossing-bare', RULES, 0, 40, 30)
  const s = E.newWorld(g)
  const who = E.generateIdentity()
  E.addPlayer(s, who.playerId, 5, 5)
  // Something, because `lived` refuses an empty key on purpose: a keypair that
  // never did anything is not a life and does not cross.
  s.players[who.playerId].skills.woodcraft = 40
  const out = carry(s.players)[0]
  assert.ok(out, 'a citizen who has done one thing should cross')
  for (const k of ['chartered', 'sworn_by', 'walked', 'friends', 'known']) {
    assert.equal(out[k], undefined, `${k} should be absent, not empty`)
  }
  assert.equal(E.validateImports([out]), null)
})

// §9b-ii, one level up: MONEY COUNTS TOWARD HAVING LIVED.
//
// The crossing used to drop everybody's gold, because the vault filter kept
// known items and gold is a number. That was fixed. This is the same fault
// above it: `lived` decides WHO crosses and never looked at money either, so a
// citizen who had sold everything and was standing on a fortune with no name,
// no levels and an empty pack was a ghost, and the crossing left them behind
// entirely.
test('a citizen whose only asset is money still crosses', () => {
  // A founding without `newcomerGold` wakes its newcomers penniless, which is
  // the exact purse rather than an unknown one.
  const g = E.makeGenesis('money-crosses', 'd'.repeat(64), 0, 40, 30)
  const purse = g.newcomerGold ?? 0
  assert.equal(purse, 0, 'this founding gives newcomers nothing')
  const rich = 'a'.repeat(64), poor = 'b'.repeat(64)
  const bare = () => ({ skills: {}, inventory: [], vaults: {}, equipment: {}, name: null })
  const players = {
    [rich]: { ...bare(), gold: purse + 4000 },   // sold everything they owned
    [poor]: { ...bare(), gold: purse },          // woke up, did nothing, never came back
  }

  const crossed = carry(players, g)
  assert.deepEqual(crossed.map(c => c.pid), [rich],
    'the one with money crosses and the pure ghost does not')
  assert.equal(crossed[0].gold, purse + 4000, 'with all of it')

  // AND THE PURSE IS WHY GOLD WAS NOT SIMPLY ADDED TO THE LIST. A world that
  // hands newcomers a tool's worth of coin (§6ao) would otherwise carry every
  // ghost that ever spawned, so the threshold is what they woke with.
  const rich2 = { ...bare(), gold: 310 }, ghost2 = { ...bare(), gold: 300 }
  const withPurse = { ...g, newcomerGold: 300 }
  assert.deepEqual(carry({ x: rich2, y: ghost2 }, withPurse).map(c => c.gold), [310],
    'a newcomer who never spent their purse is still a ghost')

  assert.equal(carry(players).length, 0,
    'and with no founding to read the purse from, gold is ignored exactly as before')
})

// ---- §9b-iv: AND THE RACES THEY WON ----
//
// The nine races are the nine entries in a world's honours roll that name a
// citizen who climbed a skill to mastery before anybody else alive. The roll
// died with the world, and `master:<skill>` fires only on CROSSING mastery,
// so after a refounding: the person who actually ran the race lost their
// name, and the next citizen to cross in the new world was announced as the
// FIRST EVER to do a thing somebody standing beside them had already done.
//
// Measured before the fix, in exactly these two steps, and both were true.
//
// A refounding is not a new world. It is this one continuing on new ground,
// which the successor's genesis says in its own identity, and a change of
// island must not take a name off a board.

// Someone who crossed mastery the hard way, in a world about to stop.
function aRaceWon(skill = 'woodcraft') {
  const g = E.makeGenesis('race-test', RULES, 0, 40, 30)
  const s = E.newWorld(g)
  const won = E.generateIdentity()
  E.addPlayer(s, won.playerId, 5, 5)
  const p = s.players[won.playerId]
  p.skills[skill] = E.XP_TABLE[E.MASTERY]
  p.calling = 'forester'
  p.name = 'alder'
  s.names.alder = won.playerId
  // what the engine writes when the race is claimed, which `claimFirst` and
  // the mastery block do together
  p.firstToMaster = [skill]
  s.firsts = { ['master:' + skill]: won.playerId }
  return { g, s, won, p }
}

test('a race crosses with the citizen who won it', () => {
  const { s, won } = aRaceWon()
  const out = carry(s.players)[0]
  assert.deepEqual(out.firstToMaster, ['woodcraft'],
    'the one honour that is about the climb rather than about the island')
  assert.equal(E.validateImports([out]), null)
})

test('and the successor world seats it back onto its own roll', () => {
  const { s } = aRaceWon()
  const g2 = E.makeGenesis('race-successor', RULES, 0, 40, 30)
  g2.imported = carry(s.players)
  const s2 = E.newWorld(g2)
  for (const c of g2.imported) assert.ok(E.seatImport(s2, c, 5, 5))
  assert.equal((s2.firsts ?? {})['master:woodcraft'], g2.imported[0].pid,
    'the new world knows who was first, because the person who was is standing in it')
  assert.deepEqual(s2.players[g2.imported[0].pid].firstToMaster, ['woodcraft'])
  assert.equal(E.validateState(s2), null)
})

test('and nobody in the new world can be announced as first after them', () => {
  // the whole point: the title is not re-won by whoever next crosses
  const { s } = aRaceWon()
  const g2 = E.makeGenesis('race-successor-2', RULES, 0, 40, 30)
  g2.imported = carry(s.players)
  const s2 = E.newWorld(g2)
  for (const c of g2.imported) E.seatImport(s2, c, 5, 5)
  const latecomer = E.generateIdentity()
  E.addPlayer(s2, latecomer.playerId, 9, 5)
  assert.equal((s2.firsts ?? {})['master:woodcraft'], g2.imported[0].pid,
    'still the citizen who ran it, whoever else arrives')
})

test('a race has one winner, and a founding that says otherwise is refused', () => {
  const a = aRaceWon(), b = aRaceWon()
  const twice = [carry(a.s.players)[0], carry(b.s.players)[0]]
  twice[1].pid = 'c'.repeat(64)      // two different citizens, one race
  twice[1].name = 'brann'
  assert.equal(E.validateImports(twice), 'two imports claim the same race',
    'a tie is not broken quietly at seating time; the founding is refused')
})

test('and a claimed race must be a mastered one', () => {
  const { s } = aRaceWon()
  const out = carry(s.players)[0]
  out.skills = { ...out.skills, woodcraft: E.XP_TABLE[E.MASTERY] - 1 }
  assert.equal(E.validateImports([out]), 'import claims a race it has not mastered',
    'an import that won a race it never finished describes somebody who never existed')
})

test('the citizen’s copy and the world’s roll must agree', () => {
  const { s, won } = aRaceWon()
  // a state where the roll names somebody else
  s.firsts = { 'master:woodcraft': 'd'.repeat(64) }
  assert.equal(E.validateState(s), 'firstToMaster disagrees with the honours roll',
    'two answers to who was first is not a state this world will run')
})

test('the island’s own firsts stay behind', () => {
  // `wilds` and `quickgear` are facts about a particular island and a
  // particular forge. A refounding can move both, and a new island's Wilds
  // really have never been walked.
  const { s, won } = aRaceWon()
  s.firsts.wilds = won.playerId
  s.firsts.quickgear = won.playerId
  const out = carry(s.players)[0]
  assert.deepEqual(out.firstToMaster, ['woodcraft'])
  assert.ok(!('firsts' in out), 'a crossing carries no honours roll of its own')
})

// AND THE ENGINE REALLY WRITES IT, through the deed rather than beside it.
//
// Every test above seats `firstToMaster` by hand, which proves the crossing
// carries it and proves nothing about whether anybody is ever given one. The
// mark is written in the mastery block, which runs on the pre-write snapshot
// `ownPlayer` takes, so it can only be reached by a citizen who gains the
// experience INSIDE a tick. Burying bones is the cheapest such deed: it needs
// one item and no geography.
test('crossing mastery in play writes the mark on the citizen', async () => {
  await E.initCrypto?.()
  const g = E.makeGenesis('race-live', RULES, 0, 40, 30)
  const wid = E.worldId(g)
  let s = E.newWorld(g)
  const first = await E.generateIdentity()
  const second = await E.generateIdentity()
  for (const [who, nm, x] of [[first, 'alder', 5], [second, 'brann', 7]]) {
    E.addPlayer(s, who.playerId, x, 5)
    const p = s.players[who.playerId]
    p.name = nm; s.names[nm] = who.playerId
    p.calling = 'mourner'
    p.skills.mourning = E.XP_TABLE[E.MASTERY] - 1    // one deed short
    p.inventory[0] = { item: 'bones', qty: 1 }
  }
  const bury = (who) => E.signInput(
    { worldId: wid, playerId: who.playerId, tick: s.tick, type: 'bury', slot: 0 }, who.privateKey)

  s = E.nextState(s, [bury(first)])
  for (let i = 0; i < 2; i++) s = E.nextState(s, [])
  assert.equal(s.firsts['master:mourning'], first.playerId, 'the roll names who crossed')
  assert.deepEqual(s.players[first.playerId].firstToMaster, ['mourning'],
    'and so does the citizen, which is the copy that travels')
  assert.equal(E.validateState(s), null)

  s = E.nextState(s, [bury(second)])
  for (let i = 0; i < 2; i++) s = E.nextState(s, [])
  assert.equal(s.firsts['master:mourning'], first.playerId, 'a first is claimed once')
  assert.equal(s.players[second.playerId].firstToMaster, undefined,
    'the second to master a skill was not the first to master it')
  assert.equal(E.validateState(s), null)
})
