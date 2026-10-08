// NO CITIZEN GOES INTO THE REPOSITORY.
//
// A citizen is a private key. This project's standing rule is that anybody who
// reads one holds that citizen for ever, so a key in a public repository is
// not a leak that can be cleaned up: it is a person given away.
//
// It happened. `unreal-key.json` carried a playerId and a privateKey and sat
// on the public remote through many pushes, with its own note field reading
// "THIS FILE IS THE CITIZEN. Back it up; do not commit it." `.gitignore` had
// listed `unreal-key*.json` the whole time and it made no difference, because
// AN IGNORE RULE DOES NOT UNTRACK A FILE THAT IS ALREADY TRACKED. The rule was
// written after the commit, git carried the file past it on every push, and
// nothing ever said a word.
//
// That is the gap this closes. `.gitignore` describes what should not be ADDED.
// Nothing described what must not be CARRIED, so this asks git what is actually
// tracked and reads it.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function tracked() {
  try {
    return execFileSync('git', ['ls-files', '-z'], { cwd: root, maxBuffer: 1 << 26 })
      .toString().split('\0').filter(Boolean)
  } catch {
    return null   // not a checkout (an archive, a tarball); nothing to check
  }
}

// A key here is 32 bytes as hex. Matching the VALUE and not the field name
// matters: engine.js and half the tools mention `privateKey` constantly and
// must go on doing so. What may never appear is sixty-four hex characters
// sitting in a field that holds a secret.
const SECRET = /["'](?:privateKey|secretKey|seedHex|sk)["']\s*[:=]\s*["'][0-9a-fA-F]{64}["']/
// and the shape of a key file, whatever it is called
const KEYFILE = /"playerId"\s*:\s*"[0-9a-fA-F]{64}"[\s\S]{0,400}?"privateKey"\s*:/

test('no tracked file carries a citizen', () => {
  const files = tracked()
  if (!files) return
  const guilty = []
  for (const f of files) {
    if (/^(paper|Art)\//.test(f)) continue
    let s
    try { s = fs.readFileSync(path.join(root, f)) } catch { continue }
    if (s.length > 4 << 20) continue
    // a binary file is not a key file
    if (s.includes(0)) continue
    const text = s.toString('utf8')
    if (SECRET.test(text) || KEYFILE.test(text)) guilty.push(f)
  }
  assert.deepEqual(guilty, [],
    'these tracked files carry key material, and a tracked key is a citizen '
    + 'given away: ' + guilty.join(', '))
})

test('the ignore rules that matter are present', () => {
  const ig = fs.readFileSync(path.join(root, '.gitignore'), 'utf8')
  for (const rule of ['unreal-key', 'identities/']) {
    assert.ok(ig.includes(rule), `.gitignore must still ignore ${rule}`)
  }
  // AND THE RULE IS NOT ENOUGH ON ITS OWN. Kept together so that reading one
  // leads to the other: the ignore rule stops the next ADD, the test above
  // stops the next CARRY, and it was the second that was missing.
})
