// DO TWO JAVASCRIPT ENGINES BUILD THE SAME ISLAND?
//
// The generator uses `Math.sin`, `Math.cos`, `Math.atan2` and `Math.hypot` in
// about fifty places: every mere and pool's shoreline, and every scatter that
// seats a prop or a landmark. ECMAScript does not require any of them to be
// correctly rounded, and the two engines this project actually ships on do
// differ: hash a hundred and forty thousand of those calls under V8 and under
// JavaScriptCore and the two numbers are not the same.
//
// That is survivable only because of what the generator does NEXT. Every
// placement rounds to a tile, which is half a unit of cushion, and the one
// comparison with no rounding at all, the lake shoreline, clears its boundary
// by 4.676e-5 at the closest tile on the island against a last-place difference
// of about 2.2e-16. THAT MARGIN IS GONE AND SO IS THE NEED FOR IT: `inlandSet`
// is built from `meander` and `angleOf` now, which are exact, so no fraction
// decides a tile anywhere in the terrain. `worldgen-exact.mjs` enforces that.
//
// This is the other half: not an argument that the island comes out the same,
// but the island, built twice, by two engines, and compared. Measured once by
// hand over all 458,752 tiles plus every settlement and every road: identical.
//
// IT IS NOT IN THE DEFAULT RUN, because it founds the world twice and that is
// about eighty seconds, nearly all of it the founding rather than the walk. The
// suite already has four worldgen suites that time out when the machine is
// loaded. Ask for it:
//
//   INTERVAL_CROSS_ENGINE=1 node --test test/engines.test.mjs
//   npm run check:engines
//
// It needs JavaScriptCore, which macOS ships and other systems do not, so it
// skips rather than fails where there is only one engine to ask.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const JSC = '/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc'

const asked = process.env.INTERVAL_CROSS_ENGINE === '1'
const haveJsc = fs.existsSync(JSC)
// `{ skip: null }` is still a skip to node's runner, so this has to be either a
// string or absent. It ran green and skipped silently for one commit.
const why = !asked ? 'set INTERVAL_CROSS_ENGINE=1 to run it (about eighty seconds)'
  : !haveJsc ? 'no JavaScriptCore on this machine, so there is only one engine to ask'
  : false

test('V8 and JavaScriptCore found the same island', why ? { skip: why } : {}, () => {
  const run = (cmd, args) => {
    const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', timeout: 600000 })
    assert.equal(r.status, 0, `${cmd} exited ${r.status}\n${r.stdout}${r.stderr}`)
    // the four lines both walks print, which between them cover the ground, the
    // towns and the roads: a single module coming out differently moves one
    const want = ['ground over', 'settlements:', 'road tiles:', 'settlements hash:', 'road hash:']
    const lines = r.stdout.split('\n').filter((l) => want.some((w) => l.startsWith(w)))
    assert.equal(lines.length, want.length, `expected the walk's summary, got:\n${r.stdout}`)
    return lines.join('\n')
  }
  const v8 = run(process.execPath, ['portable/land-node.mjs'])
  const jsc = run(JSC, ['-m', 'portable/land.mjs'])
  assert.equal(jsc, v8,
    'the two engines disagree about the island. Every tile of it is hashed into '
    + 'the founding, so this is a fork with no error message.\n'
    + `V8:\n${v8}\nJavaScriptCore:\n${jsc}`)
})

// AND NO TRANSCENDENTAL DECIDES A TILE. This one is cheap, needs no second
// engine and runs always: it reads the terrain files and holds every
// `Math.sin`, `cos`, `atan2` and `hypot` in them to the three cases §2s allows.
// It is what would have caught the lake shoreline, which went five years as a
// raw `Math.sin` comparison without anybody looking.
test('no transcendental decides a tile (§2s)', () => {
  const r = spawnSync(process.execPath, [path.join(root, 'worldgen-exact.mjs')],
    { cwd: root, encoding: 'utf8' })
  assert.equal(r.status, 0, r.stdout + r.stderr)
})
