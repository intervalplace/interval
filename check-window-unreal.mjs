// check-window-unreal.mjs — hold the Unreal window to the one rule that
// makes it a window and not a rumour.
//
// Every other check-window-*.mjs compares the window's COPY of a table to
// the engine's. This one asserts there is no copy to compare: the .uproject
// must contain no price, no reach, no recipe, no calling, no terrain name,
// no ed25519. Unreal is told everything at runtime by unreal-bridge.mjs and
// therefore cannot hold a stale opinion about the world.
//
// That is a stronger guarantee than the web windows have, and it is the only
// reason a renderer this big is safe to add: 400,000 lines of C++ and
// uasset that nobody can diff against engine.js would otherwise be the
// largest unaudited hand copy in the project.
//
//   node check-window-unreal.mjs [path/to/UnrealWindow]

import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'

const require = createRequire(import.meta.url)
const E = require('./engine.js')

const ROOT = process.argv[2] ?? './UnrealWindow'
let bad = 0
const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL') + '  ' + m); if (!c) bad++ }

// ---------- 1. the bridge imports, it does not copy ----------
console.log('\n--- the bridge stands on the shared files ---')
const B = fs.readFileSync('unreal-bridge.mjs', 'utf8')
// GEOGRAPHY COMES FROM THE GENERATOR, NOT FROM A COPY OF IT.
//
// terrain-mirror.mjs exists because a browser cannot import worldgen-*.mjs.
// This bridge is node, in the repo, so it has no such excuse -- and the
// distinction is not academic: pointed at a v7 pillar the mirror drew two of
// the island's five isles, started the Great River on dry land at v6's old
// source latitude, and had never heard of worldgen-water-v7's nineteen meres,
// tarns and pools. A window is allowed to mirror only when it cannot ask.
ok(/from '\.\/worldgen-any\.mjs'/.test(B) && /groundKindAt\(/.test(B),
  'terrain comes from the generator this founding names, via worldgen-any.mjs')
ok(/generatorFor\(/.test(B),
  'an unbuildable founding is refused, not guessed at')
// The scatter plane must still be the SHARED hash. It decides where the
// crooked oak grows, and an Unreal window that rolled its own would break
// "meet me by the oak" for everyone else.
ok(/from '\.\/terrain-mirror\.mjs'/.test(B) && /TM\.tileHash\(/.test(B),
  'the scatter plane is terrain-mirror.mjs tileHash, shared with every window')
// Told beats derived: the founder laid these, the bridge does not re-lay them.
ok(/\/api\/roads/.test(B) && !/onRoadE\(/.test(B),
  'made ways are the ones the founder laid, not a re-derivation')
ok(!/function (coastR|riverX|islesOf|biomeAt|regionAt)/.test(B),
  'the bridge computes no coastline, river, isle or biome of its own')
ok(/from '\.\/view\.mjs'/.test(B), 'deltas are applied by view.mjs, not a lifted shim')
ok(/require\('\.\/engine\.js'\)/.test(B), 'signing comes from engine.js')
ok(/E\.normalizeInput\(/.test(B) && /E\.signInput\(/.test(B),
  'inputs go through the engine normalizer before the signature')
ok(!/const (PRICES|WEAPONS|RECIPES|FORGE) =/.test(B), 'the bridge holds no table of its own')
ok(/\/api\/tables/.test(B), 'tables are fetched from the pillar at boot')

// ---------- 2. the editor project knows nothing ----------
console.log('\n--- the .uproject holds no opinion about the world ---')
if (!fs.existsSync(ROOT)) {
  console.log('  skip  no project at ' + ROOT + ' yet (pass its path as argv[2])')
} else {
  // the vocabulary a window is not allowed to have memorised
  const forbidden = new Set([
    ...Object.keys(E.PRICES ?? {}),
    ...Object.keys(E.WEAPONS ?? {}),
    ...Object.keys(E.RECIPES ?? {}),
    ...(E.CALLINGS ? Object.keys(E.CALLINGS) : []),
  ].filter((w) => w.length > 5))            // short nouns collide with C++
  const TERRAINS = ['greenwood', 'crags', 'fens', 'causey', 'meadow', 'cobble']

  const files = []
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) { if (!/^(Binaries|Intermediate|DerivedDataCache|Saved)$/.test(e.name)) walk(p) }
      else if (/\.(h|cpp|cs|ini|json)$/.test(e.name)) files.push(p)
    }
  }
  walk(ROOT)
  console.log('  scanned ' + files.length + ' source files under ' + ROOT)

  const hits = new Map()
  const signers = []
  // SCAN CODE, NOT PROSE. check-window.mjs strips comments before comparing
  // tables for the same reason: a file that EXPLAINS why it holds no terrain
  // enum must not be failed for containing the words.
  const decomment = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').split('\n')
    .filter((l) => !/^\s*(\/\/|#|;)/.test(l)).join('\n')
  for (const f of files) {
    const t = decomment(fs.readFileSync(f, 'utf8'))
    for (const w of forbidden) if (t.includes("'" + w + "'") || t.includes('"' + w + '"')) {
      ;(hits.get(w) ?? hits.set(w, []).get(w)).push(f)
    }
    for (const w of TERRAINS) if (t.includes('"' + w + '"')) {
      ;(hits.get(w) ?? hits.set(w, []).get(w)).push(f)
    }
    // NO EXEMPTIONS, not even for the transport module. The editor has no
    // key to sign with, so any of these words means somebody is building a
    // second signer -- and a second signer is a second canonical encoder.
    if (/ed25519|Ed25519|PrivateKey|signInput|generateIdentity/.test(t)) signers.push(f)
  }
  ok(signers.length === 0, 'nothing in the project tries to sign anything')
  for (const f of signers) console.log('    signs: ' + f)
  ok(hits.size === 0, 'no engine noun is hard-coded in the project')
  for (const [w, where] of hits) console.log('    ' + w + ' in ' + where.slice(0, 3).join(', '))

  // ---------- 3. smoothness may not become an intent ----------
  //
  // The world advances once a second. Everything smooth in an Unreal window
  // is a number between 0 and 1 measured against that second, and that number
  // is COSMETIC: a citizen is on the tile the last frame said they were on.
  // The figure sliding between two tiles is a DRAWING of a citizen.
  //
  // Let the drawn position feed a click, a reach test or a "which tile am I
  // on" and the window starts acting on an interval that has already passed --
  // which is exactly the failure that makes a smooth client walk one step and
  // stop. So: no file may both read the interpolation and make an intent.
  // CALLS, not declarations: the subsystem is where both of these live, and
  // a file that merely declares them has not used anything.
  const reads = files.filter((f) => /[-.>]\s*GetInterpAlpha\s*\(/.test(decomment(fs.readFileSync(f, 'utf8'))));
  const acts = files.filter((f) => /[-.>]\s*SendIntent\s*\(/.test(decomment(fs.readFileSync(f, 'utf8'))));
  const both = reads.filter((f) => acts.includes(f));
  ok(both.length === 0, 'no file both reads the interpolation and sends an intent');
  for (const f of both) console.log('    reads alpha AND acts: ' + f);

  // tile codes must come down the wire, not out of a header
  const hasEnum = files.some((f) => /enum\s+class\s+E\w*Terrain/.test(decomment(fs.readFileSync(f, 'utf8'))))
  ok(!hasEnum, 'no terrain enum: codes are whatever the bridge said they were')
}

console.log(bad ? '\n' + bad + ' FAILED' : '\nall good')
process.exit(bad ? 1 : 0)
