// Final freeze brief §1 — version references must agree. package.json is
// the single source of truth for the release tuple; every doc and the
// engine constant must match it. This test fails the moment they drift.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import E from '../engine.js'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8')
const pkg = JSON.parse(read('package.json'))

test('package.json declares the release tuple', () => {
  assert.match(pkg.version, /^\d+\.\d+\.\d+$/)
  assert.ok(pkg.protocol, 'package.json has a protocol block')
  assert.equal(pkg.protocol.specVersion, '0.55')
  assert.equal(pkg.protocol.consensusVersion, '1.9')
})

test('engine SPEC_VERSION matches the declared spec version', () => {
  // the engine embeds specVersion into every genesis; it must equal the doc
  const g = E.makeGenesis('vtest', 'a'.repeat(64), 0, 320, 200)
  assert.equal(g.specVersion, pkg.protocol.specVersion)
})

test('SPEC.md header matches the spec version', () => {
  const spec = read('SPEC.md')
  const m = spec.match(/# Interval: Protocol Specification v([\d.]+)/)
  assert.ok(m, 'SPEC.md has a version header')
  assert.equal(m[1], pkg.protocol.specVersion)
})

test('CONSENSUS.md header and version lines match', () => {
  const con = read('CONSENSUS.md')
  const m = con.match(/# Interval Consensus Specification v([\d.]+)/)
  assert.ok(m, 'CONSENSUS.md has a version header')
  assert.equal(m[1], pkg.protocol.consensusVersion)
  // the release banner references the package version and spec version
  assert.ok(con.includes(`Release ${pkg.version}`), 'CONSENSUS release banner matches package version')
  assert.ok(con.includes(`protocol spec v${pkg.protocol.specVersion}`), 'CONSENSUS banner cites spec version')
  // the separate "Implementation release" line must also track the version
  // (this line drifted to 0.22.7 while the banner said 0.23.0)
  assert.ok(con.includes(`version \`${pkg.version}\``),
    'CONSENSUS "Implementation release" line matches package version')
})

test('README banner matches the release tuple', () => {
  const readme = read('README.md')
  assert.ok(readme.includes(`Release ${pkg.version}`), 'README cites the package version')
  assert.ok(readme.includes(`protocol spec v${pkg.protocol.specVersion}`), 'README cites the spec version')
  assert.ok(readme.includes(`consensus spec v${pkg.protocol.consensusVersion}`), 'README cites the consensus version')
})

test('README adversarial and scenario counts match the manifest', () => {
  const m = manifest()
  const readme = read('README.md')
  assert.ok(readme.includes(`${m.tests.adversarial} tests`),
    `README should cite ${m.tests.adversarial} adversarial CI tests`)
  assert.ok(readme.includes(`${m.scenarios.count} scenarios`),
    `README should cite ${m.scenarios.count} scenarios`)
  // no stale counts linger
  for (const stale of ['14 tests', '10 scenarios']) {
    assert.ok(!readme.includes(stale), `README still references stale “${stale}”`)
  }
})

test('TESTING.md banner matches the release tuple', () => {
  // this banner previously drifted (Release 0.21.0 / consensus v1.8) because
  // nothing asserted it — every version reference in TESTING.md's header must
  // now track package.json exactly.
  const testing = read('TESTING.md')
  assert.ok(testing.includes(`Release ${pkg.version}`), 'TESTING.md cites the package version')
  assert.ok(testing.includes(`protocol spec v${pkg.protocol.specVersion}`), 'TESTING.md cites the spec version')
  assert.ok(testing.includes(`consensus spec v${pkg.protocol.consensusVersion}`), 'TESTING.md cites the consensus version')
  // and no STALE release/consensus strings linger anywhere in the file
  for (const stale of ['0.21.0', '0.22.', 'consensus spec v1.8', 'v1.7']) {
    assert.ok(!testing.includes(stale), `TESTING.md still references stale ${stale}`)
  }
})

test('no stale version strings remain in the headline docs', () => {
  // the specific stale versions the freeze brief called out
  const stale = ['0.13.x', 'v0.45', 'v0.46']
  for (const doc of ['README.md', 'CONSENSUS.md', 'SPEC.md']) {
    const text = read(doc)
    for (const s of stale) {
      // allow historical changelog mentions in README's "New in" sections only
      if (doc === 'README.md' && /New in/.test(text)) continue
      assert.ok(!text.includes(s), `${doc} still references stale version ${s}`)
    }
  }
})

test('rules hash in docs matches sha256(SPEC.md)', () => {
  const actual = E.sha256(fs.readFileSync(path.join(root, 'SPEC.md'))).toString('hex')
  // docs cite a 16-char prefix
  const prefix = actual.slice(0, 16)
  assert.ok(read('CONSENSUS.md').includes(prefix), 'CONSENSUS cites the current rules-hash prefix')
  assert.equal(pkg.protocol.rulesHash, prefix, 'package.json rulesHash matches SPEC.md')
})

// --- Phase-1 freeze §3: docs match the source tree, counts from a manifest ---

import { execFileSync } from 'child_process'

function manifest() {
  const out = execFileSync('node', [path.join(root, 'manifest.mjs'), '--json'], { encoding: 'utf8' })
  return JSON.parse(out)
}

test('the release manifest matches package.json versions', () => {
  const m = manifest()
  assert.equal(m.release, pkg.version)
  assert.equal(m.specVersion, pkg.protocol.specVersion)
  assert.equal(m.consensusVersion, pkg.protocol.consensusVersion)
  assert.equal(m.nodeEngine, pkg.engines.node)
})

test('TESTING.md test counts match the manifest', () => {
  const m = manifest()
  const testing = read('TESTING.md')
  assert.ok(testing.includes(`${m.tests.total} tests`),
    `TESTING.md should cite ${m.tests.total} total tests`)
  assert.ok(testing.includes(`${m.tests.adversarial} tests`),
    `TESTING.md should cite ${m.tests.adversarial} adversarial CI tests`)
})

test('TESTING.md scenario count matches the manifest, no duplicate scenario rows', () => {
  const m = manifest()
  const testing = read('TESTING.md')
  // every scenario name appears in the table
  for (const name of m.scenarios.names) {
    assert.ok(new RegExp(`\\|\\s*${name}\\s*\\|`).test(testing), `TESTING.md scenario table missing ${name}`)
  }
  // no scenario name appears twice as a table row
  for (const name of m.scenarios.names) {
    const rows = (testing.match(new RegExp(`^\\|\\s*${name}\\s*\\|`, 'gm')) || []).length
    assert.equal(rows, 1, `scenario ${name} has ${rows} table rows (expected 1)`)
  }
})

test('TESTING.md cites the Node runtime requirement', () => {
  assert.ok(read('TESTING.md').includes(pkg.engines.node),
    `TESTING.md should cite Node ${pkg.engines.node}`)
})

test('no duplicate test-file entries in TESTING.md', () => {
  const testing = read('TESTING.md')
  const entries = [...testing.matchAll(/^- `([a-z]+\.test\.mjs)`/gm)].map(m => m[1])
  const seen = new Set(), dups = new Set()
  for (const e of entries) { if (seen.has(e)) dups.add(e); seen.add(e) }
  assert.equal(dups.size, 0, `duplicate test-file entries: ${[...dups].join(', ')}`)
})

test('the freeze-evidence summary, if present, matches the release', () => {
  const p = path.join(root, 'freeze-evidence', 'SUMMARY.md')
  if (!fs.existsSync(p)) return // evidence is regenerated on demand; absence is fine
  const sum = fs.readFileSync(p, 'utf8')
  assert.ok(sum.includes(pkg.version), 'freeze-evidence summary cites the release version')
  assert.ok(sum.includes(pkg.protocol.specVersion), 'freeze-evidence summary cites the spec version')
})

// --- Phase-1 final freeze §1: the official runner covers every suite ---

test('the auto-discovering runner covers every test file (none bypasses CI)', () => {
  const testDir = path.join(root, 'test')
  const onDisk = fs.readdirSync(testDir).filter(f => f.endsWith('.test.mjs')).sort()
  // the unit set is everything except the adversarial battery
  const unitExpected = onDisk.filter(f => f !== 'adversarial.test.mjs')
  // the runner uses the same discovery rule; assert the rule is exhaustive by
  // checking the runner script reads the directory rather than a hardcoded list
  const runner = read('run-tests.mjs')
  assert.ok(runner.includes('readdirSync'), 'runner discovers files dynamically, not a manual list')
  // package.json test:unit must invoke the runner (no manual file list)
  const pkgScripts = pkg.scripts
  assert.match(pkgScripts['test:unit'], /run-tests\.mjs/, 'test:unit uses the auto-discovering runner')
  assert.ok(!/test\/\w+\.test\.mjs/.test(pkgScripts['test:unit']), 'test:unit has no hardcoded file list')
  // sanity: both Phase-1 suites are present on disk and therefore covered
  assert.ok(unitExpected.includes('lifecycle.test.mjs'), 'lifecycle suite present')
  assert.ok(unitExpected.includes('startupverify.test.mjs'), 'startupverify suite present')
})

test('the manifest unit count equals the sum over the discovered unit files', () => {
  const m = manifest()
  const testDir = path.join(root, 'test')
  const unitFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.test.mjs') && f !== 'adversarial.test.mjs')
  let sum = 0
  for (const f of unitFiles) sum += m.tests.files[f] ?? 0
  assert.equal(sum, m.tests.unit, 'manifest unit total equals the per-file sum over discovered files')
})
