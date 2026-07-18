// Freeze-final brief §4 — the official client held to the canonical
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
  c.offerTradeForItem(other, 0, 'logs'); c.offerTradeForGold(other, 0, 5)
  c.acceptTrade(other); c.cancelTrade(); c.cook(0); c.attack('gob-1'); c.eat(0)
  c.drop(0); c.pickup('g-1'); c.light(0); c.bury(0); c.fletch(0, 'bow'); c.attackp(other)
  c.plant(0); c.harvest('plot-1'); c.sell(0); c.invoke(); c.cast('anchor'); c.unequip('weapon')
  c.deposit(0); c.withdraw('logs'); c.smith('bronze-sword'); c.wield(0); c.buy('logs'); c.recall('ws-east')

  assert.equal(captured.length, 30)
  const types = new Set()
  for (const input of captured) {
    assert.equal(E.validateInputShape(input), null, `${input.type} is non-canonical: ${E.validateInputShape(input)}`)
    assert.equal(E.verifyInputSig(input), true, `${input.type} signature invalid`)
    types.add(input.type)
  }
  // the SDK covers every constitutional input type
  const SCHEMA_TYPES = ['spawn', 'stop', 'cancel_trade', 'invoke', 'move', 'gather',
    'harvest', 'attack', 'attackp', 'recall', 'offer_trade', 'accept_trade', 'smith',
    'wield', 'sell', 'plant', 'light', 'bury', 'deposit', 'drop', 'eat', 'cook',
    'unwield', 'buy', 'withdraw', 'cast', 'fletch', 'pickup', 'claim_name']
  for (const t of SCHEMA_TYPES) assert.ok(types.has(t), `no SDK helper emits ${t}`)
})

test('gold and item trade helpers each normalize to the canonical XOR form', () => {
  const { c, captured } = client()
  c.offerTradeForItem(other, 3, 'raw-fish')
  c.offerTradeForGold(other, 3, 12)
  const [item, gold] = captured
  // item form: explicit wantGold: 0
  assert.equal(item.wantItem, 'raw-fish'); assert.equal(item.wantGold, 0)
  assert.equal(E.validateInputShape(item), null)
  // gold form: explicit wantItem: null
  assert.equal(gold.wantItem, null); assert.equal(gold.wantGold, 12)
  assert.equal(E.validateInputShape(gold), null)
  // both are byte-canonical: an item helper called with the same args twice
  // produces identical signed bytes
  const { c: c2, captured: cap2 } = client()
  c2.offerTradeForItem(other, 3, 'raw-fish')
  const strip = ({ sig, ...rest }) => rest
  assert.equal(E.canonical(strip(item)), E.canonical(strip(cap2[0])))
})

test('malformed SDK calls are refused before signing, not turned into junk inputs', () => {
  const { c } = client()
  // unknown item, bad slot, unknown spell, non-constitutional name — each
  // must throw at normalizeInput rather than emit a signed non-canonical input
  assert.throws(() => c.offerTradeForItem(other, 0, 'sword-of-doom'), /item/)
  assert.throws(() => c.buy('sword-of-doom'), /item/)
  assert.throws(() => c.cast('fireball'), /spell/)
  assert.throws(() => c.fletch(0, 'catapult'), /bow or arrows/)
  assert.throws(() => c.claimName('-nope'), /name/)
  assert.throws(() => c.wield(99), /slot/)
  assert.throws(() => c.smith('adamant-sword'), /recipe/)
  assert.throws(() => c.unequip('boots'), /equipment slot/)
  // a gold trade for zero or negative is not a canonical demand
  assert.throws(() => c.offerTradeForGold(other, 0, 0), /exactly one of item or gold/)
  assert.throws(() => c.offerTradeForGold(other, 0, -5), /nonnegative|exactly one/)
})

test('the obsolete no-argument unwield() is gone; unequip(gear) is the canonical helper', () => {
  const { c, captured } = client()
  assert.equal(typeof c.unwield, 'undefined', 'the ambiguous no-arg unwield must not exist')
  c.unequip('head')
  assert.equal(captured[0].type, 'unwield')
  assert.equal(captured[0].gear, 'head')
  assert.equal(E.validateInputShape(captured[0]), null)
})
