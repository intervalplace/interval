// §5m: THE MOURNER'S GRACE READ A SKILL THAT DOES NOT EXIST.
//
// `prayerKeeps` decided what a dying citizen keeps from `p.skills.prayer`.
// §5m renamed that trade `mourning` and this one read did not follow, so the
// level was always `effLevel(undefined ?? 0)`, which is 1, which is below
// PRAYER_KEEP (70), so the function returned an empty list to everybody who
// ever died. The whole reward of the mourning trade had never once been paid.
//
// It is the ONE thing mourning buys: the guide promises "the dearest priced
// thing you carry survives your death" at seventy and "the two dearest do" at
// mastery, and the trade grants no other power by design. The only thing that
// worked was the king-shroud, which spares its wearer down a separate path, so
// the fault read as "the shroud is good" rather than as a bug.
//
// Through the real death site, because the grace is applied where the killing
// blow lands and a test that fakes `health = 0` skips it entirely.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import E from '../engine.js'

const RULES = 'a'.repeat(64)
const GENESIS = E.makeGenesis('mourn-seed', RULES, 0, 40, 30)
const WID = E.worldId(GENESIS)
const alice = E.generateIdentity()
const bob = E.generateIdentity()

const sign = (fields, who = alice) =>
  E.signInput({ worldId: WID, playerId: who.playerId, ...fields }, who.privateKey)

/** bob, at the given mourning level, carrying one dear thing and one cheap one */
function worldWith(level) {
  const w = E.newWorld(GENESIS)
  E.addPlayer(w, alice.playerId, 5, 5)
  E.addPlayer(w, bob.playerId, 6, 5)
  const b = w.players[bob.playerId]
  b.inventory[0] = { item: 'quick-sword', qty: 1 }
  b.inventory[1] = { item: 'logs', qty: 1 }
  if (level !== null) b.skills.mourning = E.XP_TABLE[level]
  return w
}

function killBob(s) {
  s = E.nextState(s, [])
  s = E.nextState(s, [sign({ tick: s.tick, type: 'attackp', targetId: bob.playerId, style: 'force' })])
  for (let i = 0; i < 400 && s.players[bob.playerId].deaths === undefined; i++) {
    s.players[bob.playerId].health = Math.min(s.players[bob.playerId].health, 2)
    s = E.nextState(s, [])
  }
  assert.equal(s.players[bob.playerId].deaths, 1, 'bob actually died at the engine path')
  return (s.players[bob.playerId].inventory ?? []).filter(Boolean).map((x) => x.item)
}

test('a mourner below the threshold keeps nothing, as the rule says', () => {
  assert.deepEqual(killBob(worldWith(50)), [], 'under seventy, death takes the pack')
})

test('at the threshold the dearest thing survives the death', () => {
  const kept = killBob(worldWith(70))
  assert.deepEqual(kept, ['quick-sword'],
    'the dearest PRICED thing, and only that one. This was [] for every citizen '
    + 'in every world until `skills.prayer` was corrected to `skills.mourning`.')
})

test('at mastery the two dearest do', () => {
  const kept = killBob(worldWith(100))
  assert.equal(kept.length, 2, 'mastery holds two')
  assert.ok(kept.includes('quick-sword') && kept.includes('logs'))
})
