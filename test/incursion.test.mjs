// §6ao: the incursion is one body wearing faces. The things worth pinning are
// that no face is stronger than another, and that it cannot be seated in a town.
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
const api = new Function(`${grab('inTown')}
  const TOWN_RADIUS = ${src.match(/const TOWN_RADIUS = (\d+)/)[1]};
  return { inTown, TOWN_RADIUS }`)()

test('every face is the same body', () => {
  // The faces choose DROPS and nothing else. If one ever carried stats, the
  // event would stop being "a thing walks out of the dark" and start being a
  // bestiary a citizen has to learn before deciding whether to answer a call.
  const faces = src.match(/const INCURSION_FACE_DROPS = \{([\s\S]*?)\n\};/)[1]
  for (const bad of ['maxHp', 'atk', 'def', 'maxHit', 'aggro']) {
    assert.ok(!faces.includes(bad), `a face must not carry ${bad}`)
  }
  const named = [...faces.matchAll(/^\s{2}'?([a-z-]+)'?:/gm)].map((m) => m[1])
  assert.deepEqual(named.sort(),
    ['drownling', 'gargoyle', 'haunt', 'wilds-shade', 'woodwraith'],
    'five faces, one incursion')
})

test('the fallback face is the biome, not a weaker mob', () => {
  const pick = src.match(/CONTEXTUAL[\s\S]*?m\.face = face;/)[0]
  assert.match(pick, /b === 'wilds' \? 'wilds-shade' : 'haunt'/,
    "unclassified country wears the haunt; it is a fallback FACE, not a fallback body")
})

test('an incursion is not seated in a town', () => {
  const state = { nodes: {
    foldbank: { type: 'bank', x: 100, y: 100 },
    tree:     { type: 'tree', x: 300, y: 300 },
  } }
  assert.equal(api.inTown(state, null, 100, 100), true, 'at the counter')
  assert.equal(api.inTown(state, null, 100 + api.TOWN_RADIUS, 100), true, 'at the edge')
  assert.equal(api.inTown(state, null, 100 + api.TOWN_RADIUS + 1, 100), false, 'one tile out')
  assert.equal(api.inTown(state, null, 300, 300), false, 'a tree is not a town')
})

test('the seat is what is tested, not the target', () => {
  // A citizen just outside a town may still be answered. One inside it is
  // simply not seated, and the roll passes with nothing spawned -- which costs
  // that citizen nothing, since an unanswered incursion is already a story.
  const seat = src.match(/for \(const \[dx, dy\] of \[\[1,0\][\s\S]*?seated = true; break;/)[0]
  assert.match(seat, /inTown\(s, _ctx, nx, ny\)/, 'the candidate tile is tested')
  assert.ok(!/inTown\(s, _ctx, t\.x, t\.y\)/.test(seat), 'the target is not')
})

test('one definition of where a town is', () => {
  // §6dc asked this question inline first. Two functions deciding separately
  // would eventually disagree, which is this codebase's recurring fault.
  assert.equal([...src.matchAll(/function inTown\(/g)].length, 1)
  assert.ok(src.includes('const TOWN_RADIUS'), 'the radius is named, not repeated')
})
