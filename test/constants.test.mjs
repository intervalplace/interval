// The class of fault this suite exists for: a table changed and the things
// that read it did not. §7cp (the buildLogs key that outlived planks), §7da
// (the rock seam that outlived its recipe), §7bd (the room list that outlived
// its town) are the same bug three times, and each was found by hand.
//
// Two checks. The first asks whether a recipe can be satisfied by a citizen
// who is standing there wanting to. The second asks whether the prose still
// agrees with the constants. Neither needs a world.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Suites live beside engine.js in the repo. In this archive they are in
// test/, so root walks up one. Delete this line when you drop them in.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = fs.readFileSync(path.join(root, 'engine.js'), 'utf8')

const num = (n) => {
  const m = src.match(new RegExp(`\\b${n}\\s*=\\s*(\\d+)`))
  assert.ok(m, `engine defines ${n}`)
  return +m[1]
}
const STACKABLE = new Set(
  [...src.match(/const STACKABLE = new Set\(\[([\s\S]*?)\]\)/)[1]
        .matchAll(/'([^']+)'/g)].map((m) => m[1]))

const INV_SLOTS = num('INV_SLOTS')

// Slots a citizen must free to hold this bill of materials at one moment.
const slotsFor = (bill) =>
  bill.reduce((n, [item, qty]) => n + (STACKABLE.has(item) ? 1 : qty), 0)

// Every recipe gated on what is IN THE PACK. A recipe that cannot be held
// cannot be made, and the engine will refuse it forever with no refusal to
// read -- which is worse than a rule that is merely wrong.
const PACK_RECIPES = [
  ['raise_market', [['planks', num('MARKET_PLANKS')], ['iron-ore', num('MARKET_ORE')]]],
]

for (const [verb, bill] of PACK_RECIPES) {
  test(`${verb} can be held in one pack`, () => {
    const need = slotsFor(bill)
    assert.ok(need <= INV_SLOTS,
      `${verb} needs ${need} slots against a pack of ${INV_SLOTS}: ` +
      bill.map(([i, q]) => `${q} ${i}${STACKABLE.has(i) ? ' (stacks)' : ''}`).join(' + '))
  })
}

// Prose drift. Numbers are written as words in this constitution, so the check
// is a spelt-out one: no document may call the pack anything but its size.
const WORD = { 12: 'twelve', 28: 'twenty-eight' }
const DOCS = ['SPEC.md', 'LIFTED.md', 'HISTORY.md']

// A constitution that records its own repeals must be allowed to say the old
// number out loud. Each exemption names the section and why, so the list
// cannot quietly become a place to hide drift.
const HISTORICAL = [
  { doc: 'SPEC.md', match: 'against a pack of twenty-eight. At twelve',
    why: '\u00a75t argues FOR twelve by naming what it replaced' },
]

test('no document describes a pack of the wrong size', () => {
  const wrong = Object.entries(WORD)
    .filter(([n]) => +n !== INV_SLOTS).map(([, w]) => w)
  const bad = []
  for (const doc of DOCS) {
    const p = path.join(root, doc)
    if (!fs.existsSync(p)) continue
    fs.readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
      for (const w of wrong) {
        // "a pack of twenty-eight", "twenty-eight slots", "pack is twenty-eight"
        if (!new RegExp(`(pack (of|is) ${w}|${w} slots)`).test(line)) continue
        if (HISTORICAL.some((h) => h.doc === doc && line.includes(h.match))) continue
        bad.push(`${doc}:${i + 1}: ${line.trim().slice(0, 72)}`)
      }
    })
  }
  assert.deepEqual(bad, [],
    `pack is ${WORD[INV_SLOTS]} (INV_SLOTS=${INV_SLOTS}); these disagree:\n` + bad.join('\n'))
})


// STACKABLE is the rule, and nothing may route around it by passing a bigger
// number. `addItem` consulted the set only when MERGING; the placement path
// wrote `{item, qty}` into one slot at any quantity, so every bulk add of a
// non-stackable stacked it anyway. This is a BEHAVIOURAL check -- the bug was
// correct at qty 1 and wrong above it, so reading the call sites finds nothing.
const sandbox = () => {
  const grab = (name) => {
    const i = src.indexOf(`function ${name}(`)
    assert.ok(i !== -1, `engine defines ${name}`)
    let d = 0, j = src.indexOf('{', i)
    for (let k = j; k < src.length; k++) {
      if (src[k] === '{') d++
      else if (src[k] === '}' && --d === 0) return src.slice(i, k + 1)
    }
    throw new Error(`unbalanced ${name}`)
  }
  const decl = src.match(/const STACKABLE = new Set\(\[[\s\S]*?\]\);/)[0]
  return new Function(`${decl}
    ${grab('firstFreeSlot')} ${grab('addItem')} ${grab('canAddItems')} ${grab('canAddItem')}
    return { STACKABLE, addItem, canAddItems }`)()
}

test('a non-stackable item takes one slot per unit', () => {
  const { addItem } = sandbox()
  const inv = Array(INV_SLOTS).fill(null)
  assert.equal(addItem(inv, 'planks', 4), true)
  assert.equal(inv.filter((s) => s?.item === 'planks').length, 4,
    'four planks must occupy four slots')
  assert.ok(inv.every((s) => !s || s.qty === 1), 'no non-stackable slot may hold a stack')
})

test('a bulk add that will not fit takes nothing', () => {
  const { addItem } = sandbox()
  const inv = Array(INV_SLOTS).fill(null)
  for (let i = 0; i < INV_SLOTS - 2; i++) inv[i] = { item: 'iron-ore', qty: 1 }
  assert.equal(addItem(inv, 'planks', 5), false, 'five planks into two slots must refuse')
  assert.equal(inv.filter((s) => s?.item === 'planks').length, 0, 'and must add none of them')
})

test('every ammunition stacks', () => {
  const { STACKABLE } = sandbox()
  const ammo = ['arrows', 'shot', 'fire-arrows', 'iron-javelin', 'steel-javelin', 'star-javelin']
  const bad = ammo.filter((a) => src.includes(`'${a}'`) && !STACKABLE.has(a))
  assert.deepEqual(bad, [], `the pack is the magazine; these do not stack: ${bad}`)
})

// A gate that asks whether ONE will fit and then adds two is the §7cp fault
// in miniature: the validator and the resolver taught different things.
test('saw asks for room for its whole yield', () => {
  const yieldN = num('SAW_YIELD')
  if (yieldN <= 1) return
  const sites = [...src.matchAll(/canAddItem\(\s*[^,]+,\s*'planks'\s*\)/g)]
  assert.equal(sites.length, 0,
    `SAW_YIELD is ${yieldN}; every 'planks' room check must ask for the yield, ` +
    'not for one (use canAddItems)')
})

// §5k: the page's calling table must be the engine's. A site that keeps its
// own copy of SWORN will disagree with the world the day a calling is added,
// and it will disagree quietly -- an empty board reads as "nobody has sworn
// this yet", which is also what a typo looks like.
test('the hiscores page knows exactly the callings the engine does', () => {
  const page = fs.readFileSync(path.join(root, 'site', 'hiscores.html'), 'utf8')
  const table = page.match(/const CALLINGS_OF = \{([\s\S]*?)\n\}/)
  assert.ok(table, 'hiscores.html declares CALLINGS_OF')
  const onPage = new Set([...table[1].matchAll(/'([a-z]+)'/g)].map((m) => m[1]))

  const swornBlock = src.match(/const SWORN = \{([\s\S]*?)\n\};/)[1]
  const inEngine = new Set([...swornBlock.matchAll(/^\s{2}([a-z]+):/gm)].map((m) => m[1]))

  // the page's table also names the trades, which are not callings
  const trades = new Set([...src.match(/const SKILLS = \[([\s\S]*?)\];/)[1]
    .matchAll(/'([a-z]+)'/g)].map((m) => m[1]))
  const pageCallings = new Set([...onPage].filter((x) => !trades.has(x)))

  assert.deepEqual([...pageCallings].sort(), [...inEngine].sort(),
    'site/hiscores.html and engine SWORN disagree about the callings')
})

// Every trade must appear in the page's table, or a whole trade silently loses
// its second axis.
test('every trade has its callings listed', () => {
  const page = fs.readFileSync(path.join(root, 'site', 'hiscores.html'), 'utf8')
  const table = page.match(/const CALLINGS_OF = \{([\s\S]*?)\n\}/)[1]
  const trades = [...src.match(/const SKILLS = \[([\s\S]*?)\];/)[1]
    .matchAll(/'([a-z]+)'/g)].map((m) => m[1])
  const missing = trades.filter((t) => !new RegExp(`^\\s*${t}:`, 'm').test(table))
  assert.deepEqual(missing, [], `trades absent from CALLINGS_OF: ${missing}`)
})
