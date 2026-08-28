// The hiscores page ranks a board and then labels it, and the label and the
// ranking are computed in different functions. Everywhere else in this project
// that has happened -- §7cp, §7da, §6ao -- the two disagreed and the
// disagreement was silent. So the page's selection function is exercised
// directly, out of the document, with no browser.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Suites live beside engine.js in the repo. In this archive they are in
// test/, so root walks up one. Delete this line when you drop them in.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const page = fs.readFileSync(path.join(root, 'site', 'hiscores.html'), 'utf8')

// Pull the real source out of the page rather than restating it here: a copy
// would pass forever after the page changed.
const grab = (re, what) => {
  const m = page.match(re)
  assert.ok(m, `hiscores.html defines ${what}`)
  return m[0]
}
const build = () => new Function(`
  let VIEW = 'standing', CALLING = null;
  ${grab(/const CALLINGS_OF = \{[\s\S]*?\n\}/, 'CALLINGS_OF')}
  ${grab(/function activeCalling \(\)[\s\S]*?\n\}/, 'activeCalling')}
  ${grab(/function population \(j\)[\s\S]*?\n\}/, 'population')}
  return {
    population,
    activeCalling,
    set: (v, c) => { VIEW = v; CALLING = c },
  }`)()

const WORLD = { players: [
  { playerId: 'a', name: 'ann', sworn: 'brewer', unaided: true,  skillXp: { hearthcraft: 900, woodcraft: 10 } },
  { playerId: 'b', name: 'bo',  sworn: 'farmer', unaided: false, skillXp: { hearthcraft: 500 } },
  { playerId: 'c', name: 'cai', sworn: null,     unaided: true,  skillXp: { hearthcraft: 100 } },
  { playerId: 'd', name: 'dee', sworn: 'brewer', unaided: false, skillXp: { woodcraft: 400 } },
] }

const who = (api, v, c) => { api.set(v, c); return api.population(WORLD).map((p) => p.name) }

test('standing is every citizen', () => {
  assert.deepEqual(who(build(), 'standing', null), ['ann', 'bo', 'cai', 'dee'])
})

test('a trade board is everyone who has worked that trade', () => {
  // dee has no hearthcraft and is absent; cai has never sworn and is present
  assert.deepEqual(who(build(), 'hearthcraft', null), ['ann', 'bo', 'cai'])
})

test('a calling board is only the citizens who swore it', () => {
  const api = build()
  assert.deepEqual(who(api, 'hearthcraft', 'brewer'), ['ann'])
  assert.deepEqual(who(api, 'hearthcraft', 'farmer'), ['bo'])
})

test('an unsworn citizen is on no calling board', () => {
  // §5k: unsworn is a choice, not a waiting room. cai out-works nobody into
  // a calling by having the experience for one.
  const api = build()
  for (const c of ['brewer', 'farmer']) assert.ok(!who(api, 'hearthcraft', c).includes('cai'))
})

test('a calling from another trade falls back to the trade, never a mixed board', () => {
  // 'brewer' on the woodcraft board must not mean "brewers, ranked by
  // woodcutting" -- which is exactly what it meant before activeCalling.
  const api = build()
  api.set('woodcraft', 'brewer')
  assert.equal(api.activeCalling(), null, 'the guard rejects the mismatched pair')
  assert.deepEqual(who(api, 'woodcraft', 'brewer'), who(build(), 'woodcraft', null),
    'the whole trade, not a subset of it chosen by an unrelated word')
})

test('a real calling nobody has sworn is empty, not the whole trade', () => {
  // fisher IS a shorecraft calling and nobody in this world has sworn it. The
  // board must be empty, because the page says "nobody has sworn this yet" --
  // silently widening to the trade would make that sentence a lie.
  const api = build()
  api.set('shorecraft', 'fisher')
  assert.equal(api.activeCalling(), 'fisher', 'the pair is valid')
  assert.deepEqual(who(api, 'shorecraft', 'fisher'), [])
})

test('the unaided count describes the board, not the island', () => {
  const api = build()
  const un = (v, c) => { api.set(v, c); return api.population(WORLD).filter((p) => p.unaided === true).length }
  assert.equal(un('standing', null), 2)
  assert.equal(un('hearthcraft', null), 2)
  assert.equal(un('hearthcraft', 'brewer'), 1, 'one brewer, and she is unaided')
  assert.equal(un('hearthcraft', 'farmer'), 0)
})
