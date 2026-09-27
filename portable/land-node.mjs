// The same walk, under node, through node's own module loader: the number to
// match. See land.mjs.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const E = require('../engine.js');
E.declareEngine(fs.readFileSync(new URL('../engine.js', import.meta.url), 'utf8'));
const WG = await import('../worldgen-any.mjs');
console.log('worldgen loaded, exports: ' + Object.keys(WG).length);
// THE REAL FOUNDING, not a made-up one. `expanse7` was founded with these six
// values and they are public -- any node will hand them over -- so a phone that
// computes this genesis is computing the island people are standing on, and
// the hash below can be compared against a node rather than only against
// another copy of this test.
const g = WG.foundGenesis('interval-expanse-v7', 'solo-538',
  '6cde7f4e2631a1af4ff405cb51d1bf78f66ba3ec83531d18adee6599d8ca1cdd',
  1789813895202, 896, 512);
console.log('genesis ' + g.worldGenerator + ' ' + g.worldW + 'x' + g.worldH);
const G = WG.generatorFor(g);
let h = 2166136261, counted = 0;
for (let y = 0; y < g.worldH; y += 6) {
  for (let x = 0; x < g.worldW; x += 6) {
    let k = G.groundKindAt(g, x, y);
    if (!k) k = G.isWater(g, x, y) ? (G.inSea(g, x, y) ? 'sea' : 'river')
                                   : G.biomeAt(g, x, y);
    for (let i = 0; i < k.length; i++) { h ^= k.charCodeAt(i); h = (h * 16777619) >>> 0; }
    counted++;
  }
}
console.log('ground over ' + counted + ' tiles: ' + ('0000000' + h.toString(16)).slice(-8));
const S = G.settlementsOf(g);
console.log('settlements: ' + S.length + ', first ' + (S[0] ? (S[0].name ?? S[0].tag) : '-'));
const R = G.roadTilesOf(g);
console.log('road tiles: ' + (R.size ?? R.length));

// AND THE TWO MOST DERIVED THINGS THERE ARE, hashed rather than counted: the
// same number of roads in a different place is the same count and a different
// island. Settlements carry a name, a tag and a rectangle; the road set is
// every tile the founders' routing actually laid.
function fnv(s, h) {
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
  return h;
}
let sh = 2166136261;
for (const s of S) sh = fnv(JSON.stringify([s.tag ?? '', s.name ?? '', s.x, s.y, s.w, s.h]), sh);
let rh = 2166136261;
for (const t of Array.from(R).sort()) rh = fnv(String(t), rh);
console.log('settlements hash: ' + ('0000000' + sh.toString(16)).slice(-8));
console.log('road hash:        ' + ('0000000' + rh.toString(16)).slice(-8));
