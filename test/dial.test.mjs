// THE DIAL MUST NOT LIE.
//
// `dial.mjs` duplicates the tide and ceiling arithmetic so a window can draw
// the face without pulling the engine in. Duplication is a promise, and this
// is the test that keeps it: over a long run of intervals and a ledger driven
// to closing time, the two must agree exactly.
//
// If this fails, the ENGINE is right and `dial.mjs` is wrong.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import E from '../engine.js'
import * as D from '../dial.mjs'

const RULES = 'a'.repeat(64)
const SAMPLE = 50

function genesis() {
  const g = E.makeGenesis('dial-test', RULES, 0, 40, 30)
  g.tide = { periods: [40, 63, 97], opens: [12, 20, 31] }
  g.stint = { cap: 7200, sample: SAMPLE, remembers: 8, meets: SAMPLE * 3 }
  g.ceiling = { window: 2400, allow: 600, warn: 120 }
  return g
}

test('the dial reads the tide exactly as the engine computes it', () => {
  const g = genesis()
  for (let t = 0; t < 200000; t++) {
    for (let i = 0; i < g.tide.periods.length; i++) {
      if (D.tideUp(g, t, i) !== E.tideUp(g, t, i)) assert.fail(`tide ${i} disagrees at ${t}`)
    }
    if (D.anyTideOpen(g, t) !== E.anyTideOpen(g, t)) assert.fail(`open disagrees at ${t}`)
  }
})

test('the dial forecasts the next turn exactly as the engine does', () => {
  const g = genesis()
  for (let t = 0; t < 50000; t++)
    for (let i = 0; i < g.tide.periods.length; i++)
      assert.equal(D.nextTideTurn(g, t, i), E.nextTideTurn(g, t, i), `forecast ${i} at ${t}`)
})

test('the dial reads the allowance exactly as the engine does, all the way to closing time', () => {
  const g = genesis()
  const alice = E.generateIdentity()
  let s = E.newWorld(g)
  E.addPlayer(s, alice.playerId, 5, 5)
  const sign = (f) => E.signInput({ worldId: E.worldId(g), playerId: alice.playerId, ...f }, alice.privateKey)

  let sawWarn = false, sawDown = false
  for (let k = 0; k < 900; k++) {
    s = E.nextState(s, [sign({ tick: s.tick, type: 'stop' })])
    const eng = E.ceilingLeft(s, alice.playerId)
    assert.equal(D.ceilingLeft(s, alice.playerId), eng, `allowance disagrees at ${s.tick}`)
    if (eng > 0 && eng <= g.ceiling.warn) sawWarn = true
    if (eng <= 0) sawDown = true
  }
  assert.ok(sawWarn, 'the run passed through the notice')
  assert.ok(sawDown, 'and reached closing time, so the agreement was tested there too')
})

test('the dial agrees while the window rolls a citizen back in', () => {
  const g = genesis()
  const alice = E.generateIdentity()
  let s = E.newWorld(g)
  E.addPlayer(s, alice.playerId, 5, 5)
  const sign = (f) => E.signInput({ worldId: E.worldId(g), playerId: alice.playerId, ...f }, alice.privateKey)
  for (let k = 0; k < 800; k++) s = E.nextState(s, [sign({ tick: s.tick, type: 'stop' })])
  assert.equal(E.ceilingLeft(s, alice.playerId), 0, 'shut out first')
  for (let k = 0; k < 2800; k++) {
    s = E.nextState(s, [])
    assert.equal(D.ceilingLeft(s, alice.playerId), E.ceilingLeft(s, alice.playerId), `disagrees while rolling at ${s.tick}`)
  }
  assert.ok(E.ceilingLeft(s, alice.playerId) > 0, 'and let back in')
})

test('a world with neither tide nor ceiling reads as unbounded, not as zero', () => {
  const g = E.makeGenesis('dial-plain', RULES, 0, 40, 30)
  const alice = E.generateIdentity()
  const s = E.newWorld(g)
  E.addPlayer(s, alice.playerId, 5, 5)
  assert.equal(D.ceilingLeft(s, alice.playerId), Infinity)
  assert.equal(D.anyTideOpen(g, 0), false)
  assert.equal(D.ceilingLeft(s, alice.playerId), E.ceilingLeft(s, alice.playerId))
})
