// ONE PAIR OF HANDS, DRIVEN RATHER THAN READ.
//
// `shieldRefused` and `haftRefused` are two lines near the top of the engine
// and they are easy to agree with by reading. What they actually do to a
// citizen standing there with a sword and a shield, trying to take up a
// spear, is a different question, and it is the one a player meets.
//
// So this plays it: a real world, a real signed input, and the pack and the
// hands inspected afterwards. Every case the hands can be in.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import E from '../engine.js'

const RULES = 'd'.repeat(64)

// A citizen who can hold anything, so nothing here is refused for want of a
// level and every refusal is the hands rule.
function armed(hands = {}, pack = []) {
  const g = E.makeGenesis('hands-test', RULES, 0, 40, 30)
  const who = E.generateIdentity()
  const s = E.newWorld(g)
  E.addPlayer(s, who.playerId, 5, 5)
  const p = s.players[who.playerId]
  for (const sk of Object.keys(p.skills)) p.skills[sk] = 2000000
  p.equipment.weapon = hands.weapon ? { item: hands.weapon } : null
  p.equipment.offhand = hands.offhand ? { item: hands.offhand } : null
  for (let i = 0; i < pack.length; i++) p.inventory[i] = pack[i] ? { item: pack[i] } : null
  const sign = (f) => E.signInput(
    { worldId: E.worldId(g), playerId: who.playerId, ...f }, who.privateKey)
  // THE STATE MOVES FORWARD. A first draft ran every input against the
  // starting world, so "put the shield down, then take up the spear" was two
  // separate first moves and the second never saw the first.
  let cur = s
  const go = (input) => {
    cur = E.nextState(cur, [sign({ tick: cur.tick, ...input })])
    const q = cur.players[who.playerId]
    return {
      weapon: q.equipment.weapon?.item ?? null,
      offhand: q.equipment.offhand?.item ?? null,
      pack: q.inventory.map((sl) => sl?.item ?? null),
    }
  }
  return { s, who, go, p }
}

const SWORD = 'iron-sword', SHIELD = 'iron-shield', HAFT = 'iron-spear'

test('the words this test is built on still mean what it thinks', () => {
  // If TWO_HANDED were renamed or emptied, every assertion below would pass
  // by testing nothing at all.
  assert.ok(E.TWO_HANDED.has(HAFT), `${HAFT} must be two-handed for this test to mean anything`)
  assert.ok(!E.TWO_HANDED.has(SWORD), `${SWORD} must be one-handed`)
  // And the shield's slot is asked of the world rather than of a table: the
  // table is not exported, and a first draft read `undefined` off it, fell
  // through to the default, and cheerfully asserted that a shield is a
  // weapon. Wield one with both hands empty and see where it lands.
  const { go } = armed({}, [SHIELD])
  const r = go({ type: 'wield', slot: 0 })
  assert.equal(r.offhand, SHIELD, 'a shield goes in the offhand')
  assert.equal(r.weapon, null, 'and not in the weapon hand')
})

test('a haft is refused while a shield is up, and nothing moves', () => {
  const { go } = armed({ weapon: SWORD, offhand: SHIELD }, [HAFT])
  const r = go({ type: 'wield', slot: 0 })
  assert.equal(r.weapon, SWORD, 'the sword stays in hand')
  assert.equal(r.offhand, SHIELD, 'the shield stays up')
  assert.equal(r.pack[0], HAFT, 'and the spear stays in the pack')
})

test('a shield is refused while a haft is up, and nothing moves', () => {
  const { go } = armed({ weapon: HAFT, offhand: null }, [SHIELD])
  const r = go({ type: 'wield', slot: 0 })
  assert.equal(r.weapon, HAFT)
  assert.equal(r.offhand, null, 'no shield goes up beside a spear')
  assert.equal(r.pack[0], SHIELD)
})

test('with no shield up, a haft is taken and the sword goes to its slot', () => {
  const { go } = armed({ weapon: SWORD, offhand: null }, [HAFT])
  const r = go({ type: 'wield', slot: 0 })
  assert.equal(r.weapon, HAFT, 'the spear is up')
  assert.equal(r.pack[0], SWORD, 'and the sword took the spear"s place in the pack')
})

test('a haft swaps for a haft, which needs no free slot', () => {
  const { go } = armed({ weapon: HAFT, offhand: null }, ['steel-spear'])
  const r = go({ type: 'wield', slot: 0 })
  assert.equal(r.weapon, 'steel-spear')
  assert.equal(r.pack[0], HAFT)
})

// ---- THE TWO-INPUT SWAP, WHICH IS WHAT A PLAYER ACTUALLY DOES ----
//
// The engine refuses to disarm a citizen who did not ask to be disarmed, so
// taking up a spear while holding sword and shield is two deliberate acts.
// What matters is that the two acts GET THERE, and that they fail honestly
// when the pack has no room for what comes off.

test('shield down, then haft up: the full swap, in two inputs', () => {
  const { go } = armed({ weapon: SWORD, offhand: SHIELD }, [HAFT, null])
  const r1 = go({ type: 'unwield', gear: 'offhand' })
  assert.equal(r1.offhand, null, 'the shield comes down')
  assert.ok(r1.pack.includes(SHIELD), 'and lands in the pack')
  const r2 = go({ type: 'wield', slot: 0 })
  assert.equal(r2.weapon, HAFT, 'and now the spear goes up')
  assert.equal(r2.offhand, null)
  assert.ok(r2.pack.includes(SWORD), 'with the sword where the spear was')
  assert.ok(r2.pack.includes(SHIELD), 'and the shield still carried')
})

test('a full pack cannot put the shield down, so the haft stays in the pack', () => {
  // Every slot taken, so `unwield` has nowhere to put the shield. This is the
  // honest refusal: the citizen is not disarmed and nothing is destroyed.
  const { p, go } = armed({ weapon: SWORD, offhand: SHIELD })
  for (let i = 0; i < p.inventory.length; i++) p.inventory[i] = { item: 'logs' }
  p.inventory[0] = { item: HAFT }
  const r = go({ type: 'unwield', gear: 'offhand' })
  assert.equal(r.offhand, SHIELD, 'with no room in the pack the shield stays up')
  const r2 = go({ type: 'wield', slot: 0 })
  assert.equal(r2.weapon, SWORD, 'and the spear still cannot be taken up')
  assert.equal(r2.offhand, SHIELD)
})

test('nothing is ever destroyed by a refused wield', () => {
  const { go } = armed({ weapon: SWORD, offhand: SHIELD }, [HAFT])
  const r = go({ type: 'wield', slot: 0 })
  const held = [r.weapon, r.offhand, ...r.pack].filter(Boolean)
  for (const w of [SWORD, SHIELD, HAFT]) {
    assert.ok(held.includes(w), `${w} must still exist somewhere after a refusal`)
  }
})

// ---- AND THE WINDOW'S PLAN, AGAINST EVERY STATE THE HANDS CAN BE IN ----
//
// The tests above ask what the engine does. This asks whether the window's
// answer to it is right, for every equippable word crossed with every way the
// hands can already be full. That is the pairing that actually failed: the
// rule was sound and the window's copy of the list it depends on was eleven
// words where the engine has twenty-one, so for thirteen weapons the window
// confidently sent a wield into a refusal and said nothing.
//
// The window's two tables are read out of window-web.html rather than copied
// again here. A third copy would be a third thing to drift.
import { readFileSync } from 'node:fs'
const WIN = readFileSync(new URL('../window-web.html', import.meta.url), 'utf8')
const winSet = (name) => new Set([...WIN.slice(WIN.indexOf(`const ${name} = new Set([`))
  .slice(0, WIN.slice(WIN.indexOf(`const ${name} = new Set([`)).indexOf('])'))
  .matchAll(/'([^']+)'/g)].map((m) => m[1]))
const winTable = (name) => {
  const i = WIN.indexOf(`const ${name} = {`)
  const o = {}
  for (const m of WIN.slice(i, WIN.indexOf('\n}', i)).matchAll(/'([^']+)':\s*'(\w+)'/g)) o[m[1]] = m[2]
  return o
}
const WIN_TWO = winSet('TWO_HANDED')
const WIN_SLOT = winTable('EQUIP_SLOT')
const winSlotOf = (it) => WIN_SLOT[it] ?? 'weapon'

// what the window decides to send, in the words of its own handler
const windowPlan = (worn, item) => {
  const takingUpTwoHander = WIN_TWO.has(item)
  const raisingShieldOverHaft = winSlotOf(item) === 'offhand' && WIN_TWO.has(worn.weapon)
  const inTheWay = takingUpTwoHander ? (worn.offhand ? ['offhand'] : [])
    : raisingShieldOverHaft ? ['weapon'] : []
  return inTheWay
}

test('for every weapon and every state of the hands, the window sends what the engine takes', () => {
  const gear = [...E.EQUIPPABLE].filter((w) => typeof w === 'string')
  const states = [
    { weapon: null, offhand: null },
    { weapon: SWORD, offhand: null },
    { weapon: SWORD, offhand: SHIELD },
    { weapon: HAFT, offhand: null },
    { weapon: 'wooden-bow', offhand: null },
  ]
  const wrong = []
  for (const worn of states) {
    for (const item of gear) {
      const { go, p } = armed(worn, [item, null, null])
      void p
      const plan = windowPlan(worn, item)
      if (plan.length === 0) {
        // the window sends a plain wield: the engine must take it
        const r = go({ type: 'wield', slot: 0 })
        const landed = r.weapon === item || r.offhand === item
          || r.head === item || r.pack[0] !== item
        if (!landed && r.pack[0] === item) {
          wrong.push(`${item} on ${worn.weapon}/${worn.offhand}: window sent a plain wield, engine refused it`)
        }
      } else {
        // the window lowers what is in the way first, then wields
        const r1 = go({ type: 'unwield', gear: plan[0] })
        if (r1[plan[0]] !== null) {
          wrong.push(`${item} on ${worn.weapon}/${worn.offhand}: the ${plan[0]} would not come down`)
          continue
        }
        const r2 = go({ type: 'wield', slot: 0 })
        if (r2.pack[0] === item) {
          wrong.push(`${item} on ${worn.weapon}/${worn.offhand}: lowered the ${plan[0]} and the wield still failed`)
        }
      }
    }
  }
  assert.deepEqual(wrong.slice(0, 8), [],
    `${wrong.length} of ${gear.length * states.length} cases disagree`)
})
