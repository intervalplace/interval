// §6g: vaults are local. The three things that would break silently are the
// clone (a shared vault reaches backwards into history), the gate/resolver
// pair (which counter am I standing at), and the crossing (ids from a world
// that no longer exists). None of them needs a running world to check.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { carry } from '../crossing.mjs'

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
  ${grab('adjacentVaultId')} ${grab('vaultAt')} ${grab('adjacent')}
  return { _clonePlayer, adjacentVaultId, vaultAt }`)()

const player = () => ({
  x: 5, y: 5, health: 64, skills: { woodcraft: 0 }, inventory: [null, null],
  equipment: {}, vaults: { foldvault: { logs: 40 }, anchorvault: { 'iron-ore': 7 } },
  gold: 0, action: null, name: null, trade: null, lastInput: 0,
})

test('a cloned vault is not shared with the state it came from', () => {
  // _cloneFlat copies ONE level. A two-deep bank left the inner vault aliased,
  // so writing to it in tick N+1 edited the state of tick N. Two nodes would
  // then compute different worlds from the same history, silently.
  const a = player()
  const b = api._clonePlayer(a)
  b.vaults.foldvault.logs = 1
  b.vaults.anchorvault['iron-ore'] = 1
  assert.equal(a.vaults.foldvault.logs, 40, 'the original vault must be untouched')
  assert.equal(a.vaults.anchorvault['iron-ore'], 7)
  assert.notEqual(a.vaults.foldvault, b.vaults.foldvault, 'vaults must not be the same object')
})

test('a vault is read at the counter you are standing at', () => {
  const state = { nodes: {
    foldvault:   { type: 'vault', x: 5, y: 6 },
    anchorvault: { type: 'vault', x: 90, y: 90 },
  } }
  const p = player()
  const id = api.adjacentVaultId(state, null, p)
  assert.equal(id, 'foldvault', 'the adjacent counter, not the first one defined')
  assert.deepEqual(api.vaultAt(p, id), { logs: 40 })
  assert.equal(api.vaultAt(p, 'anchorvault').logs, undefined,
    'the far vault holds no logs, however many are banked elsewhere')
})

test('standing at no counter reads no vault', () => {
  const state = { nodes: { anchorvault: { type: 'vault', x: 90, y: 90 } } }
  assert.equal(api.adjacentVaultId(state, null, player()), null)
  assert.equal(api.vaultAt(player(), null), null, 'a null id must not select a vault')
})

test('reading a vault never creates one', () => {
  // A read that writes would grow the state by walking past a counter, and
  // state that grows with traffic is what §5 exists to prevent.
  const p = player()
  const before = JSON.stringify(p.vaults)
  api.vaultAt(p, 'a-counter-never-visited')
  assert.equal(JSON.stringify(p.vaults), before)
})

test('the gate and the resolver ask the same function', () => {
  // Every silent disagreement in this codebase has been two functions asking
  // the same question differently. There must be exactly one bank lookup.
  const uses = [...src.matchAll(/adjacentVaultId\(/g)].length
  assert.ok(uses >= 4, `expected the gate and all three resolvers to call it, saw ${uses}`)
  assert.equal([...src.matchAll(/hasAdjacentNode\([^)]*'vault'/g)].length, 0,
    'no bank check may bypass adjacentVaultId: a boolean cannot name a vault')
})

test('the crossing carries goods and not geography', () => {
  // The flattening moved twice: out of serve.mjs into crossing.mjs, where it
  // could be called without starting a node, and then into the engine as
  // §9b-iii `carriedFrom`, because a citizen can now also come back through
  // `restore` and the two doors must not disagree. So this asks the question
  // of the BEHAVIOUR rather than of whichever file currently holds the lines:
  // an anchor on source text has broken twice in this suite already.
  const twoShelves = {
    skills: { woodcraft: 400 }, name: 'rowan', health: 64, inventory: [], equipment: {},
    vaults: { 'vault-millbrook': { logs: 4, gold: 100 }, 'vault-norwick': { logs: 3, iron: 2 } },
    gold: 7,
  }
  const [out] = carry({ ['a'.repeat(64)]: twoShelves })
  assert.deepEqual(out.vaults, { logs: 7, iron: 2 },
    'the shelves are summed into one flat map on the way out, and the buildings are not carried')
  assert.equal(out.gold, 107, 'and gold comes off the shelves onto the person')
  const serve = fs.readFileSync(path.join(root, 'serve.mjs'), 'utf8')
  // matched loosely on purpose: this asserts that serve.mjs DELEGATES rather
  // than keeping its own copy of the projection, and the argument list is not
  // the thing being asserted. Pinning it exactly broke this test when the old
  // founding started travelling with the players (`lived` needs the purse).
  assert.match(serve, /\bcarry\(old\.players\b/, 'and serve.mjs delegates to it rather than keeping a copy')

  // §9: THE SEATING IS ONE FUNCTION. It was copied into six generators, which
  // is how the landing vault reached exactly one of them -- every other world
  // silently dropped a crossing's goods -- and how an imported citizen woke at
  // ONE HITPOINT in five of them, because the clamp read `skills.hitpoints`,
  // a skill §5j deleted, and `levelForXp(undefined)` is 1.
  assert.match(src, /function seatImport/, 'the crossing lives in the engine')
  assert.match(src, /function landingVaultId/)
  assert.match(src, /Object\.keys\(state\.nodes\)\.sort\(\)/,
    'the landing counter is chosen in a fixed order, or two nodes found different worlds')

  for (const f of ['worldgen.mjs', 'worldgen-expanse3.mjs', 'worldgen-expanse4.mjs',
                   'worldgen-expanse5.mjs', 'worldgen-expanse6.mjs', 'worldgen-expanse7.mjs']) {
    const g = fs.readFileSync(path.join(root, f), 'utf8')
    assert.match(g, /E\.seatImport\(/, `${f} must delegate the crossing`)
    // Code only. A comment may NAME the deleted skill to explain what was
    // repealed -- that is how the fix documents itself.
    const code = g.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n')
    assert.equal(/skills\.hitpoints/.test(code), false, `${f} must not read a skill §5j deleted`)
  }
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
  const v = { 'quick-stone': VAULT_CAP - 10 }
  const r = deposit(v, 'quick-stone', 50)
  assert.equal(r.moved, 10, 'as much as fits')
  assert.equal(r.left, 40, 'and the rest is still carried')
  assert.equal(v['quick-stone'], VAULT_CAP)
})

test('a full vault takes nothing and says so', () => {
  const v = { 'quick-stone': VAULT_CAP }
  assert.deepEqual(deposit(v, 'quick-stone', 12), { moved: 0, left: 12 })
})

test('the cap is per kind, not per vault', () => {
  // Filling on ore must not stop a citizen banking a sword at the same counter.
  const v = { 'quick-stone': VAULT_CAP }
  assert.equal(deposit(v, 'quick-sword', 1).moved, 1)
})

test('the gate refuses exactly when the resolver would move nothing', () => {
  // The §7.3a fault: a gate saying yes to work the resolver will not do, so the
  // deed is recorded and nothing happens, with no refusal to read.
  const gate = src.match(/AND THE COUNTER MUST HAVE ROOM FOR AT LEAST ONE[\s\S]*?\n      \}/)[0]
  assert.match(gate, />= VAULT_CAP\) return false/, 'the gate knows the cap')
  assert.match(gate, /adjacentVaultId/, 'and asks the same counter')
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

// The rename is only done if nothing anywhere still names the node type,
// the field, or the helper by the word that described the repealed rule.
// A bank is reachable from any branch; that is the property §6g removed, so
// the word was actively wrong rather than merely borrowed.
test('nothing live still calls a vault a bank', () => {
  const files = fs.readdirSync(root)
    .filter((f) => /\.(js|mjs|html)$/.test(f) && !f.startsWith('window-diablo'))
  const bad = []
  for (const f of files) {
    // Code only, on the same principle as the seatImport check above: a
    // comment may NAME the repealed word to explain what was repealed and why
    // the code beside it changed. That is how a fix documents itself, and a
    // rule that forbids even saying the old name pushes the explanation out of
    // the file where it is needed.
    const t = fs.readFileSync(path.join(root, f), 'utf8')
      .split('\n').filter((l) => !l.trim().startsWith('//')).join('\n')
    for (const [re, why] of [
      [/'bank'/g, "node type 'bank'"],
      [/\.bank\b(?!er|ed|ing|able)/g, 'the field .bank'],
      [/adjacentBankId/g, 'the old helper'],
      [/\bfoldbank\b/g, 'the old node id'],
    ]) if (re.test(t)) bad.push(`${f}: ${why}`)
  }
  assert.deepEqual(bad, [], bad.join('\n'))
})

test('every rules-hash call site uses the shared module', () => {
  // The constitution is three documents. Six files hashed SPEC.md alone, so a
  // pillar and a joining peer would have computed different worlds -- and
  // play.mjs founded a solo world nobody could cross out of.
  // Reading SPEC.md is not the offence; HASHING it alone is. `spec-stubs.mjs`
  // reads it to splice section stubs into it, which is the whole job of the
  // tool and has nothing to do with any world's identity. The check asked the
  // easier question and flagged it, which is how a rule people trust starts
  // getting ignored. It asks the real one now: a file that both reads SPEC.md
  // and hashes something, without going through the shared module.
  const bad = []
  for (const f of fs.readdirSync(root).filter((x) => x.endsWith('.mjs'))) {
    const t = fs.readFileSync(path.join(root, f), 'utf8')
    if (!/readFileSync\(new URL\('\.\/SPEC\.md'/.test(t)) continue
    if (/from '\.\/rules-hash\.mjs'/.test(t)) continue
    if (/createHash|sha256|rulesHash/.test(t)) bad.push(f)
  }
  assert.deepEqual(bad, [], `these hash SPEC.md alone: ${bad}`)
})
