// The web window is 15,000 lines of client that nothing checks. These are the
// faults that hide there: a skill name the engine retired (the verb silently
// disappears), a duplicate key in an object literal (the last one wins), and a
// threshold that drifted from the engine's.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Suites live beside engine.js in the repo. In this archive they are in
// test/, so root walks up one. Delete this line when you drop them in.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const win = fs.readFileSync(path.join(root, 'window-web.html'), 'utf8')
const eng = fs.readFileSync(path.join(root, 'engine.js'), 'utf8')
const TRADES = [...eng.match(/const SKILLS = \[([\s\S]*?)\];/)[1]
  .matchAll(/'([a-z]+)'/g)].map((m) => m[1])

test('the client reads no skill the engine retired', () => {
  // §5m merged eighteen skills into nine. A client reading `skills.mining`
  // gets undefined, falls to level one, and the gate it guards can never open
  // -- so a whole verb vanishes with no error anywhere.
  // Comments may name a retired skill to explain what was repealed; code may not.
  const code = win.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n')
  const read = new Set([...code.matchAll(/skills\??\.([a-z]+)/g)].map((m) => m[1]))
  const dead = [...read].filter((s) => !TRADES.includes(s))
  assert.deepEqual(dead, [], `retired skills still read by the client: ${dead}`)
})

test('every trade has its own cape colour', () => {
  const blk = win.match(/const CAPE_COLORS = \{([\s\S]*?)\n\}/)[1]
  const keys = [...blk.matchAll(/^\s*([a-z]+):/gm)].map((m) => m[1])
  assert.equal(keys.length, new Set(keys).size,
    'a duplicate key in an object literal is silently the last one')
  assert.deepEqual(keys.slice().sort(), TRADES.slice().sort())
  const cols = [...blk.matchAll(/'(#[0-9a-f]{6})'/g)].map((m) => m[1])
  assert.equal(cols.length, new Set(cols).size, 'two trades must not wear one colour')
})

test('the cape arrives at mastery, not a level early', () => {
  // §4b: mastery is one hundred. The last level alone is near a seventh of the
  // whole ascent, so a cape at ninety-nine is very early indeed.
  const capeOf = win.match(/function capeOf[\s\S]*?\n\}/)[0]
  assert.match(capeOf, /XP_TO_LVL\(xp\) >= 100/)
  assert.equal(/>= 99\b/.test(capeOf), false)
})

test('mounted means carrying and nothing else', () => {
  const fn = win.match(/function mountedNow[\s\S]*?\n\}/)[0]
  assert.match(fn, /return !!p\.consignment/, 'the consignment is the whole rule')
  assert.equal(/onRoadE/.test(fn), false, 'the road no longer puts anyone on a horse')
  // The linger existed only to smooth road tiles clipping on and off. A
  // consignment is a discrete state, so there is nothing left to smooth.
  assert.equal(/MOUNT_LINGER|_rodeAt/.test(fn), false)
  assert.match(fn, /_fellOffAt/, 'but a rider still gets down to fight')
})

test('tap and right-click offer one list', () => {
  // Two option builders would drift, and a citizen would be learning two
  // worlds. `chooseAction` is the only place a verb list is made.
  assert.equal([...win.matchAll(/function chooseAction/g)].length, 1)
  const fn = win.match(/function chooseAction[\s\S]*?\n\}/)[0]
  assert.match(fn, /floatMenu\(opts, where\)/, 'the pointer path takes the same opts')
  assert.match(win, /addEventListener\('contextmenu'/, 'right-click is wired')
  assert.match(win, /_menuAt = \{ x: e\.clientX, y: e\.clientY \}/)
  // and the tap path is untouched: the bar is still what a thumb gets
  assert.match(fn, /getElementById\('choosebar'\)/)
})

test('the pointer menu can always be dismissed', () => {
  // A menu that outlives its context covers the world it is about.
  for (const ev of ['pointerdown', 'keydown', 'wheel', 'blur']) {
    assert.match(win, new RegExp(`addEventListener\\('${ev}'`), `${ev} closes it`)
  }
})
