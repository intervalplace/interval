// Freeze-final brief §4: the official client held to the canonical
// standard: every public SDK action emits an input the canonical validator
// accepts, the gold-trade path works, and malformed calls are refused
// before signing rather than producing a junk input.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import E from '../engine.js'
import { IntervalClient } from '../sdk.mjs'

const worldId = 'ab'.repeat(32)
const other = 'cd'.repeat(32)
const id = E.generateIdentity()

function client() {
  const captured = []
  const node = { worldId, state: { tick: 5, players: {} }, submitInput: (i) => { captured.push(i); return Promise.resolve() } }
  return { c: new IntervalClient({ node, identity: id }), captured }
}

test('every public SDK action emits a canonical signed input', () => {
  const { c, captured } = client()
  // one call per public action helper
  c.move(1, 0); c.gather('tree-1'); c.stop(); c.claimName('ada'); c.spawn()
  c.trade(other, 0, 5); c.settle(); c.untrade()
  c.cook(0); c.attack('gob-1'); c.eat(0)
  c.drop(0); c.pickup('g-1'); c.light(0); c.bury(0); c.fletch(0, 'bow'); c.attackp(other)
  // §6l: `sell` is repealed -- a keeper buys nothing; a citizen raises a
  // stall (§6al) and sells from it. The helper went with the verb.
  c.plant(0); c.harvest('plot-1'); c.invoke(); c.cast('mend'); c.unequip('weapon')
  // §6cj: `recall` and `read_chart` stay in the engine's schemas so an old
  // client is REFUSED rather than desynced, but both always fail now -- the
  // waystones are gone (§6ch). The SDK offers no method that can only ever
  // return a rejection, so this asks for none.
  c.deposit(0); c.withdraw('logs'); c.smith('iron-sword'); c.wield(0); c.buy('logs')

  assert.equal(captured.length, 27)
  const types = new Set()
  for (const input of captured) {
    assert.equal(E.validateInputShape(input), null, `${input.type} is non-canonical: ${E.validateInputShape(input)}`)
    assert.equal(E.verifyInputSig(input), true, `${input.type} signature invalid`)
    types.add(input.type)
  }
  // the SDK covers every constitutional input type
  const SCHEMA_TYPES = ['spawn', 'stop', 'untrade', 'invoke', 'move', 'gather',
    'harvest', 'attack', 'attackp', 'trade', 'settle', 'smith',
    'wield', 'plant', 'light', 'bury', 'deposit', 'drop', 'eat', 'cook',
    'unwield', 'buy', 'withdraw', 'cast', 'fletch', 'pickup', 'claim_name']
  for (const t of SCHEMA_TYPES) assert.ok(types.has(t), `no SDK helper emits ${t}`)
})

// §5c-ii: the XOR these helpers normalized to is repealed with the one-sided
// offer. A side of a table carries goods, coin, both, or neither, and what
// still has to hold is that the SDK writes one serialized form for it.
test('a side of a table normalizes to one canonical form', () => {
  const { c, captured } = client()
  c.trade(other, 3, 12)
  c.trade(other, [5, 1, 5], 0)      // out of order and repeated
  c.trade(other)                    // nothing at all, which is a gift
  const [one, two, bare] = captured
  assert.deepEqual(one.slots, [3]); assert.equal(one.gold, 12)
  assert.deepEqual(two.slots, [1, 5], 'ascending and distinct, whatever the caller said')
  assert.deepEqual(bare.slots, []); assert.equal(bare.gold, 0)
  for (const inp of [one, two, bare]) assert.equal(E.validateInputShape(inp), null)
  // byte-canonical: the same call twice signs the same bytes
  const { c: c2, captured: cap2 } = client()
  c2.trade(other, 3, 12)
  const strip = ({ sig, ...rest }) => rest
  assert.equal(E.canonical(strip(one)), E.canonical(strip(cap2[0])))
})

test('malformed SDK calls are refused before signing, not turned into junk inputs', () => {
  const { c } = client()
  // unknown item, bad slot, unknown spell, non-constitutional name: each
  // must throw at normalizeInput rather than emit a signed non-canonical input
  assert.throws(() => c.buy('sword-of-doom'), /item/)
  assert.throws(() => c.cast('fireball'), /spell/)
  // the message names every make the constitution allows, and there are more
  // of them now than 'bow or arrows'
  assert.throws(() => c.fletch(0, 'catapult'), /must be bow, arrows/)
  assert.throws(() => c.claimName('-nope'), /name/)
  assert.throws(() => c.wield(99), /slot/)
  assert.throws(() => c.smith('adamant-sword'), /recipe/)
  assert.throws(() => c.unequip('boots'), /equipment slot/)
  // §5c-ii: coin on a table is a count, and a negative count is not one
  assert.throws(() => c.trade(other, 0, -5), /nonnegative/)
  assert.throws(() => c.trade(other, 99, 0), /inventory slot/)
})

test('the obsolete no-argument unwield() is gone; unequip(gear) is the canonical helper', () => {
  const { c, captured } = client()
  assert.equal(typeof c.unwield, 'undefined', 'the ambiguous no-arg unwield must not exist')
  c.unequip('head')
  assert.equal(captured[0].type, 'unwield')
  assert.equal(captured[0].gear, 'head')
  assert.equal(E.validateInputShape(captured[0]), null)
})
