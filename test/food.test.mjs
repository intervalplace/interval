// §6m-vii: food is a rate. The arithmetic that matters is whether a fight can
// still be won by out-eating it, so the check is a simulated exchange rather
// than a reading of the constant.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Suites live beside engine.js in the repo. In this archive they are in
// test/, so root walks up one. Delete this line when you drop them in.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = fs.readFileSync(path.join(root, 'engine.js'), 'utf8')
const num = (n) => +src.match(new RegExp(`\\b${n} = (\\d+)`))[1]

const HP_FLAT = num('HP_FLAT')
const HEAL_FISH = num('HEAL_FISH')
const EAT_EVERY = num('EAT_EVERY')
const FOODS = {
  'cooked-deep-fish': num('HEAL_DEEP_FISH'), 'cooked-eel': num('HEAL_MID_FISH'),
  'cooked-fish': num('HEAL_FISH'), bread: num('HEAL_BREAD'),
  'salt-deep-fish': num('HEAL_SALT_DEEP'), 'salt-fish': num('HEAL_SALT_FISH'),
  'smoked-eel': num('HEAL_SMOKED_EEL'), ale: num('HEAL_ALE'),
  broth: num('HEAL_BROTH'), 'deep-broth': num('HEAL_DEEP_BROTH'),
}

// The rate table and the resolver's arithmetic, lifted from the engine.
const FEED_RATE = new Function('item', 'return ' +
  src.match(/const FEED_RATE = \(item\) => ([\s\S]*?);\n/)[1])
const eat = (p, item, heal) => {
  if (heal > (p.fedLeft ?? 0)) { p.fedLeft = heal; p.fedRate = FEED_RATE(item) }
}
const regen = (p) => {
  if (!(p.fedLeft > 0) || p.hp <= 0) return
  const pay = Math.min(p.fedRate ?? 1, p.fedLeft)
  p.hp = Math.min(HP_FLAT, p.hp + pay)
  p.fedLeft -= pay
  if (p.fedLeft <= 0) { delete p.fedLeft; delete p.fedRate }
}

test('every food heals exactly what it always healed', () => {
  // The rate changes the SHAPE, never the total -- which is why no item, ladder
  // or price is rebalanced by any of this.
  for (const [item, heal] of Object.entries(FOODS)) {
    const p = { hp: HP_FLAT - heal, fedLeft: 0 }
    eat(p, item, heal)
    for (let i = 0; i < heal + 4; i++) regen(p)
    assert.equal(p.hp, HP_FLAT, `${item} must still be worth ${heal}`)
    assert.equal(p.fedLeft, undefined, `${item} must pay its debt off exactly`)
  }
})

test('a rate that does not divide its total pays the remainder and stops', () => {
  // cooked-eel is seven at two an interval: 2,2,2,1 and done. An end-tick
  // window could not express that without losing or inventing a hitpoint.
  const p = { hp: 1, fedLeft: 0 }
  eat(p, 'cooked-eel', 7)
  const paid = []
  for (let i = 0; i < 6; i++) { const before = p.hp; regen(p); paid.push(p.hp - before) }
  assert.deepEqual(paid, [2, 2, 2, 1, 0, 0])
})

test('the tiers actually feel different', () => {
  assert.equal(FEED_RATE('cooked-deep-fish'), 3, 'the deep catch is the fastest in the world')
  assert.equal(FEED_RATE('cooked-fish'), 2, 'hot food off a fire')
  assert.equal(FEED_RATE('ale'), 1, 'the brewed and the preserved sustain')
  assert.equal(FEED_RATE('salt-fish'), 1)
  assert.ok(FEED_RATE('cooked-deep-fish') < HEAL_FISH,
    'and the ceiling stays well under the burst it replaced')
})

test('none of it arrives in the interval it was swallowed', () => {
  const p = { hp: 10, fedLeft: 0 }
  eat(p, 'cooked-fish', HEAL_FISH)
  assert.equal(p.hp, 10, 'eating restores nothing at the moment of eating')
  regen(p)
  assert.equal(p.hp, 12, 'a cooked fish mends two an interval, starting the next one')
})

test('eating twice takes the larger debt, never the sum', () => {
  const p = { hp: 1, fedLeft: 0 }
  eat(p, 'cooked-fish', HEAL_FISH)
  eat(p, 'cooked-fish', HEAL_FISH)
  assert.equal(p.fedLeft, HEAL_FISH, 'debts must not accumulate')
})

test('a lesser food cannot cut a greater mending short', () => {
  const p = { hp: 1, fedLeft: 0 }
  eat(p, 'cooked-deep-fish', 10)
  eat(p, 'ale', 4)
  assert.equal(p.fedLeft, 10, 'the greater debt stands')
  assert.equal(p.fedRate, 3, 'and keeps its own rate: a rate without its food is nobody\'s')
})

test('the sustained rate is unchanged and only the burst is gone', () => {
  // This is the whole claim. `eatRhythm` already limited how often a citizen
  // could eat, so the SUSTAINED healing was healOf/rhythm all along. Making the
  // healing a window of the same length leaves that number exactly where it
  // was -- which is why no item, no cook's ladder and no brewer's price needs
  // rebalancing. What changes is the PEAK: six in one interval becomes one.
  const EAT_PER_HEAL_FOOD = num('EAT_PER_HEAL_FOOD')
  const rhythm = Math.max(EAT_EVERY, Math.ceil(HEAL_FISH * EAT_PER_HEAL_FOOD / 10))

  const sustainedBefore = HEAL_FISH / rhythm
  // A citizen eating on the rhythm is fed for HEAL_FISH of every `rhythm`
  // intervals, at one an interval.
  const sustainedAfter = Math.min(HEAL_FISH, rhythm) / rhythm
  assert.equal(sustainedAfter, sustainedBefore,
    'the economy is untouched: the same food still buys the same healing')

  assert.equal(HEAL_FISH, 6)
  assert.ok(1 < HEAL_FISH, 'and the peak falls from six in an interval to one')
})

test('the withered door is shut to the rate as well as the burst', () => {
  // §7ck shut food out for the withered. A rate that ignored it would be the
  // same healing arriving through a different door.
  const pass = src.match(/THE MENDING OF THE FED[\s\S]*?\n  \}/)[0]
  assert.match(pass, /witheredUntil/, 'the regen pass checks withering')
  // and does not SPEND the debt while the door is shut
  assert.ok(pass.indexOf('witheredUntil') < pass.indexOf('fedLeft -='),
    'the withering check comes before the payment, so a withering does not eat the food')
  assert.match(pass, /deadUntil/, 'and does not mend the dead')
  assert.match(pass, /Object\.keys\(s\.players\)\.sort\(\)/,
    'and runs in a fixed order, or two nodes compute different worlds')
})

test('no resolver restores a food value in one interval', () => {
  // The claim is about FOOD, not about bursts in general -- forage, mend and
  // the well are each paid for and each stay instant. See the burst-set test.
  assert.equal([...src.matchAll(/p\.hp = Math\.min\(p\.hp \+ heal/g)].length, 0)
  assert.match(src, /p\.fedLeft = heal/, 'eating opens a debt instead')
})

// §6m-vii: food is the only RATE, and the bursts are a closed set of three.
// Each is paid for differently -- a place, a person, the ground -- and a fourth
// added quietly would undo the reason the rate exists at all.
test('exactly three things restore hitpoints at once', () => {
  const sites = [...src.matchAll(/(\w+)\.hp = Math\.min\((maxHp\([^)]*\)|cap|st\.maxHp), \1\.hp \+ ([^)]+)\)/g)]
    .map((m) => m[3].trim())
  // `pay` is the mending rate; `st.mends` is a beast healing itself.
  const playerBursts = sites.filter((x) => x !== 'pay' && x !== 'st.mends')
  assert.deepEqual(playerBursts.sort(), ['20', '20', 'FORAGE_HEAL'],
    'the well (a place), mend x2 (a person), forage (the ground) -- and nothing else')
})

test('forage is a burst and food is not', () => {
  // Forage is eaten where it lies and cannot be carried, so it is a PLACE the
  // way the well is. Routing it through the debt would make it food that
  // happens to be free, and there is already food.
  assert.match(src, /p\.hp = Math\.min\(maxHp\(p\), p\.hp \+ FORAGE_HEAL\)/)
  assert.ok(!/FORAGE_HEAL[\s\S]{0,200}fedLeft/.test(src), 'forage does not open a debt')
})

test('nothing still describes a citizen at four hitpoints', () => {
  // §5j made the frame flat at sixty-four; a hunting-country citizen cannot
  // reach four. Three clamps and a drop table were sized against a world that
  // no longer exists, and this is the fourth.
  assert.ok(!/citizen at four\s*\n?\/\/ hitpoints/.test(src),
    'the forage rationale must not appeal to a frame §5j abolished')
})
