// §7dq: WHAT COUNTS AS CARRYING A LIGHT.
//
// The Smother's mouth refuses anybody who is not `lit`, and the quenchers
// inside take nothing from a weapon that does not burn. So this one predicate
// decides both whether a citizen may go in and whether going in is any use,
// which makes it the most load-bearing boolean in the Crags.
//
// IT HAD BEEN WRONG TWICE, THE SAME WAY. A torch is meant to be a clock: you
// light it, it burns for a while, it goes out, and the cave asks you to keep
// one going. The first version compared `torchUntil > 0`, so a torch lit once
// was lit for ever, and the note in the engine records the fix. The fix did
// not work, because a torch is in WEAPONS with `burns: true` -- correctly, it
// IS a burning weapon when swung -- and the clause that reads `burns` answered
// before the clock was consulted. A citizen who had ever held a torch could
// walk into the Smother for the rest of their life.
//
// Neither failure could be seen by reading either line on its own, which is
// why this is a table rather than a sentence.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import E from '../engine.js'

const GENESIS = E.makeGenesis('light-seed', 'a'.repeat(64), 0, 40, 30)
const me = E.generateIdentity()

/** a citizen holding and carrying exactly what is asked */
function citizen({ weapon = null, pack = [], torchUntil } = {}) {
  const w = E.newWorld(GENESIS)
  E.addPlayer(w, me.playerId, 5, 5)
  const p = w.players[me.playerId]
  p.equipment = weapon ? { weapon: { item: weapon } } : {}
  pack.forEach((it, i) => { p.inventory[i] = { item: it, qty: 1 } })
  if (torchUntil !== undefined) p.torchUntil = torchUntil
  return p
}

test('a torch is a clock, in the hand and in the pack', () => {
  assert.equal(E.carriesLight(citizen({ weapon: 'torch' }), 0), false,
    'a torch nobody ever lit is not a light')
  assert.equal(E.carriesLight(citizen({ weapon: 'torch', torchUntil: 100 }), 0), true,
    'lit, and still burning')
  assert.equal(E.carriesLight(citizen({ weapon: 'torch', torchUntil: 100 }), 200), false,
    'burnt out. This was TRUE for as long as the item existed.')
  assert.equal(E.carriesLight(citizen({ pack: ['torch'], torchUntil: 100 }), 50), true,
    'and it need not be in the hand: a citizen may carry one and fight with a sword')
  assert.equal(E.carriesLight(citizen({ pack: ['torch'], torchUntil: 100 }), 200), false,
    'the pack does not keep it alight either')
})

test('what burns because of what it is', () => {
  assert.equal(E.carriesLight(citizen({ weapon: 'great-sword' }), 0), true,
    'quenched in brimstone, and stays quenched')
  assert.equal(E.carriesLight(citizen({ weapon: 'great-crossbow' }), 0), true)
  assert.equal(E.carriesLight(citizen({ pack: ['fire-arrows'] }), 0), true,
    'a quiver of fire arrows is as much a light as a torch (§7dt)')
  assert.equal(E.carriesLight(citizen(), 0), false, 'and bare hands are not')
  assert.equal(E.carriesLight(citizen({ weapon: 'quick-sword' }), 0), false,
    'the best steel in the world is not a light')
})

test('the siphon asks for its fuel, which is the whole reason brimstone matters', () => {
  assert.equal(E.carriesLight(citizen({ weapon: 'fire-siphon' }), 0), false,
    'empty, it is a pipe')
  assert.equal(E.carriesLight(citizen({ weapon: 'fire-siphon', pack: ['brimstone'] }), 0), true)
})
