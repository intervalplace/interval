// §21c: the leak detector, as a standing gate.
//
// `INTERVAL_CLONE=dirty` hands the interval the ORIGINAL citizens and copies
// only the ones written to. A write that misses `ownPlayer` does not throw and
// does not fail any ordinary test: it lands in the caller's state -- the state
// a replay reads and another node has already hashed.
//
// The whole suite passed under `detect` while FOUR such writes were still
// present, because nothing in it made one citizen hurt another. The suite has
// plenty of combat; it had no PvP damage, no beast choosing a victim, no
// retaliation. Coverage that is broad but not adversarial will miss exactly the
// writes that matter here, which are the ones aimed at somebody ELSE.
//
// So this file exercises the paths where one citizen reaches into another, and
// fails loudly if any of them writes through to the original. Add a case here
// whenever a new verb can touch a citizen who did not act.

import { test } from 'node:test'
import assert from 'node:assert'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const E = require('../engine.js')
E.initCrypto()

const g = E.makeGenesis('leakcheck', 'a'.repeat(64), 0, 64, 48)
const wid = E.worldId(g)

function world(n = 4) {
  const ids = Array.from({ length: n }, () => E.generateIdentity())
  const s = E.newWorld(g)
  ids.forEach((id, i) => E.addPlayer(s, id.playerId, 10 + i, 10))
  for (const id of ids) {
    const p = s.players[id.playerId]
    p.skills.prowess = E.XP_TABLE[60]
    p.inventory[0] = { item: 'logs', qty: 3 }
  }
  return { s, ids }
}

// Run a scenario with every citizen wrapped in a throw-on-write proxy. Any
// write that reaches an original raises CowLeak, naming the property.
function underDetector(build, ticks = 20) {
  E._phase2Testing.setClone('detect')
  try {
    let { s, ids } = build()
    const inputs = build.inputs ? build.inputs(s, ids) : []
    s = E.nextState(s, inputs)
    for (let i = 0; i < ticks; i++) s = E.nextState(s, [])
    return null
  } catch (e) {
    if (e && e.constructor && e.constructor.name === 'CowLeak') return e.message
    throw e
  } finally {
    E._phase2Testing.setClone(null)
  }
}

const sign = (id, fields, s) =>
  E.signInput({ ...fields, tick: s.tick, worldId: wid, playerId: id.playerId }, id.privateKey)

test('no write reaches the caller\'s state: one citizen striking another', () => {
  const leak = underDetector(Object.assign(() => {
    const w = world()
    return w
  }, {
    inputs: (s, ids) => [sign(ids[0], { type: 'attackp', targetId: ids[1].playerId, style: 'even' }, s)],
  }))
  assert.equal(leak, null, leak ?? '')
})

test('no write reaches the caller\'s state: a beast choosing a victim', () => {
  const leak = underDetector(Object.assign(() => {
    const w = world()
    E.addMob(w.s, 'gob', 'goblin', 11, 10)
    return w
  }, {
    inputs: (s, ids) => [sign(ids[0], { type: 'attack', mobId: 'gob', style: 'force' }, s)],
  }))
  assert.equal(leak, null, leak ?? '')
})

test('no write reaches the caller\'s state: an offered trade', () => {
  const leak = underDetector(Object.assign(() => world(), {
    inputs: (s, ids) => [sign(ids[0], {
      type: 'offer_trade', to: ids[1].playerId, giveSlots: [0],
      giveItems: [{ item: 'logs', qty: 3 }], wantItem: 'ore', wantGold: 0,
    }, s)],
  }))
  assert.equal(leak, null, leak ?? '')
})

test('no write reaches the caller\'s state: following somebody', () => {
  const leak = underDetector(Object.assign(() => world(), {
    inputs: (s, ids) => [sign(ids[0], { type: 'follow', targetId: ids[1].playerId }, s)],
  }))
  assert.equal(leak, null, leak ?? '')
})

test('dirty and fast clones agree byte for byte through a fight', () => {
  const ids = Array.from({ length: 2 }, () => E.generateIdentity())
  const run = (mode) => {
    E._phase2Testing.setClone(mode)
    try {
      let s = E.newWorld(g)
      ids.forEach((id, i) => E.addPlayer(s, id.playerId, 10 + i, 10))
      for (const id of ids) s.players[id.playerId].skills.prowess = E.XP_TABLE[60]
      E.addMob(s, 'gob', 'goblin', 12, 10)
      s = E.nextState(s, [sign(ids[0], { type: 'attackp', targetId: ids[1].playerId, style: 'even' }, s)])
      for (let i = 0; i < 30; i++) s = E.nextState(s, [])
      return E.stateHash(s)
    } finally { E._phase2Testing.setClone(null) }
  }
  assert.equal(run('dirty'), run('fast'), 'clone mode must never change a hash')
})
