// §6g: vaults are local. The three things that would break silently are the
// clone (a shared vault reaches backwards into history), the gate/resolver
// pair (which counter am I standing at), and the crossing (ids from a world
// that no longer exists). None of them needs a running world to check.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Suites live beside engine.js in the repo. In this archive they are in
// test/, so root walks up one. Delete this line when you drop them in.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = fs.readFileSync(path.join(root, 'engine.js'), 'utf8')

const grab = (name) => {
  const i = src.indexOf(`function ${name}(`)
  assert.ok(i !== -1, `engine defines ${name}`)
  let d = 0
  for (let k = src.indexOf('{', i); k < src.length; k++) {
    if (src[k] === '{') d++
    else if (src[k] === '}' && --d === 0) return src.slice(i, k + 1)
  }
  throw new Error(`unbalanced ${name}`)
}

const api = new Function(`
  ${grab('_cloneFlat')} ${grab('_deepCloneJson')} ${grab('_clonePlayer')}
  ${grab('adjacentBankId')} ${grab('vaultAt')} ${grab('adjacent')}
  return { _clonePlayer, adjacentBankId, vaultAt }`)()

const player = () => ({
  x: 5, y: 5, hp: 64, skills: { woodcraft: 0 }, inventory: [null, null],
  equipment: {}, bank: { foldbank: { logs: 40 }, anchorbank: { 'iron-ore': 7 } },
  gold: 0, action: null, name: null, trade: null, lastInput: 0,
})

test('a cloned vault is not shared with the state it came from', () => {
  // _cloneFlat copies ONE level. A two-deep bank left the inner vault aliased,
  // so writing to it in tick N+1 edited the state of tick N. Two nodes would
  // then compute different worlds from the same history, silently.
  const a = player()
  const b = api._clonePlayer(a)
  b.bank.foldbank.logs = 1
  b.bank.anchorbank['iron-ore'] = 1
  assert.equal(a.bank.foldbank.logs, 40, 'the original vault must be untouched')
  assert.equal(a.bank.anchorbank['iron-ore'], 7)
  assert.notEqual(a.bank.foldbank, b.bank.foldbank, 'vaults must not be the same object')
})

test('a vault is read at the counter you are standing at', () => {
  const state = { nodes: {
    foldbank:   { type: 'bank', x: 5, y: 6 },
    anchorbank: { type: 'bank', x: 90, y: 90 },
  } }
  const p = player()
  const id = api.adjacentBankId(state, null, p)
  assert.equal(id, 'foldbank', 'the adjacent counter, not the first one defined')
  assert.deepEqual(api.vaultAt(p, id), { logs: 40 })
  assert.equal(api.vaultAt(p, 'anchorbank').logs, undefined,
    'the far vault holds no logs, however many are banked elsewhere')
})

test('standing at no counter reads no vault', () => {
  const state = { nodes: { anchorbank: { type: 'bank', x: 90, y: 90 } } }
  assert.equal(api.adjacentBankId(state, null, player()), null)
  assert.equal(api.vaultAt(player(), null), null, 'a null id must not select a vault')
})

test('reading a vault never creates one', () => {
  // A read that writes would grow the state by walking past a counter, and
  // state that grows with traffic is what §5 exists to prevent.
  const p = player()
  const before = JSON.stringify(p.bank)
  api.vaultAt(p, 'a-counter-never-visited')
  assert.equal(JSON.stringify(p.bank), before)
})

test('the gate and the resolver ask the same function', () => {
  // Every silent disagreement in this codebase has been two functions asking
  // the same question differently. There must be exactly one bank lookup.
  const uses = [...src.matchAll(/adjacentBankId\(/g)].length
  assert.ok(uses >= 4, `expected the gate and all three resolvers to call it, saw ${uses}`)
  assert.equal([...src.matchAll(/hasAdjacentNode\([^)]*'bank'/g)].length, 0,
    'no bank check may bypass adjacentBankId: a boolean cannot name a vault')
})

test('the crossing carries goods and not geography', () => {
  const serve = fs.readFileSync(path.join(root, 'serve.mjs'), 'utf8')
  assert.match(serve, /for \(const vault of Object\.values\(p\.bank \?\? \{\}\)\)/,
    'serve.mjs sums the vaults into one flat map on the way out')
  const wg = fs.readFileSync(path.join(root, 'worldgen-expanse7.mjs'), 'utf8')
  assert.match(wg, /landingBank/, 'worldgen seats the total at one counter')
  assert.match(wg, /Object\.keys\(w\.nodes\)\.sort\(\)/,
    'the landing counter is chosen in a fixed order, or two nodes found different worlds')
})

// §6g: the depth cap. What matters is that the gate and the resolver agree
// about "full", and that a partly-full vault takes what fits rather than
// refusing a stack because its last few would not go in.
const VAULT_CAP = +src.match(/const SHELF_CAP = (\d+)/)[1]

// The resolver's arithmetic, lifted.
const deposit = (vault, item, qty) => {
  const room = VAULT_CAP - (vault[item] ?? 0)
  const move = Math.min(qty, room)
  if (move <= 0) return { moved: 0, left: qty }
  vault[item] = (vault[item] ?? 0) + move
  return { moved: move, left: qty - move }
}

test('a vault fills to the cap and the remainder stays in the pack', () => {
  const v = { 'magic-stone': VAULT_CAP - 10 }
  const r = deposit(v, 'magic-stone', 50)
  assert.equal(r.moved, 10, 'as much as fits')
  assert.equal(r.left, 40, 'and the rest is still carried')
  assert.equal(v['magic-stone'], VAULT_CAP)
})

test('a full vault takes nothing and says so', () => {
  const v = { 'magic-stone': VAULT_CAP }
  assert.deepEqual(deposit(v, 'magic-stone', 12), { moved: 0, left: 12 })
})

test('the cap is per kind, not per vault', () => {
  // Filling on ore must not stop a citizen banking a sword at the same counter.
  const v = { 'magic-stone': VAULT_CAP }
  assert.equal(deposit(v, 'star-sword', 1).moved, 1)
})

test('the gate refuses exactly when the resolver would move nothing', () => {
  // The §7.3a fault: a gate saying yes to work the resolver will not do, so the
  // deed is recorded and nothing happens, with no refusal to read.
  const gate = src.match(/AND THE COUNTER MUST HAVE ROOM FOR AT LEAST ONE[\s\S]*?\n      \}/)[0]
  assert.match(gate, />= VAULT_CAP\) return false/, 'the gate knows the cap')
  assert.match(gate, /adjacentBankId/, 'and asks the same counter')
})

test('the depth cap is not a state invariant, so a crossing loses nothing', () => {
  // A crossing sums the shelves of a world that no longer exists and may seat
  // more than a deposit could add. Enforcing the cap in validateState would
  // mean destroying the excess, which contradicts the crossing carrying a
  // citizen whole. An over-full vault is legal and drains by being used.
  const v = src.match(/A VAULT PER COUNTER[\s\S]*?return 'vault exceeds bounds'/)[0]
  // The comment names VAULT_CAP to explain the absence; what must not appear is
  // an ENFORCEMENT of it -- a comparison that could reject a crossing.
  const code = v.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n')
  assert.ok(!/VAULT_CAP/.test(code), 'validateState must not enforce the depth cap')
  assert.match(code, /ITEMS\.size/, 'and the kind bound is the item table itself')
})

test('the dead 512 bound is gone', () => {
  // 91 items in the world: a bound of 512 kinds could never fire, and a bound
  // that cannot fire reads as protection while being furniture.
  assert.equal(/VAULT_ITEMS/.test(src), false)
})
