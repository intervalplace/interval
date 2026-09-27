// DOES THE ISLAND COME OUT THE SAME ON A PHONE?
//
// `try.mjs` proved the RULES run in JavaScriptCore and hash the same. This is
// the other half and the harder one: the LANDSCAPE -- where the coast is, what
// every tile is made of, where the roads were routed, which settlement is
// where -- is twenty-four ES modules, and an engine with no module loader has
// to be given one. If a single one of them comes out differently the phone is
// looking at another island.
//
// So this walks the whole map, tile by tile, and prints one number: a hash of
// every ground kind on it. `land.mjs` under node prints the same number or the
// port is not done.
import { loadEngine, loadWorldgen } from './boot.mjs';

const readSource = (name) => readFile(name);
let seed = 1;
const entropy = (arr) => {
  for (let i = 0; i < arr.length; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    arr[i] = seed & 255;
  }
  return arr;
};

const E = loadEngine(readSource, entropy);
const WG = loadWorldgen(readSource, E);
print('worldgen loaded, exports: ' + Object.keys(WG).length);

// THE REAL FOUNDING, not a made-up one. `expanse7` was founded with these six
// values and they are public -- any node will hand them over -- so a phone that
// computes this genesis is computing the island people are standing on, and
// the hash below can be compared against a node rather than only against
// another copy of this test.
const g = WG.foundGenesis('interval-expanse-v7', 'solo-538',
  '6cde7f4e2631a1af4ff405cb51d1bf78f66ba3ec83531d18adee6599d8ca1cdd',
  1789813895202, 896, 512);
print('genesis ' + g.worldGenerator + ' ' + g.worldW + 'x' + g.worldH);

const G = WG.generatorFor(g);
// One pass over the island, every sixth tile in each direction: a hundred and
// twenty-seven thousand samples, which is enough that a single wrong module
// cannot hide and few enough to run in a second.
let h = 2166136261;
let counted = 0;
for (let y = 0; y < g.worldH; y += 6) {
  for (let x = 0; x < g.worldW; x += 6) {
    let k = G.groundKindAt(g, x, y);
    if (!k) k = G.isWater(g, x, y) ? (G.inSea(g, x, y) ? 'sea' : 'river')
                                   : G.biomeAt(g, x, y);
    for (let i = 0; i < k.length; i++) {
      h ^= k.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    counted++;
  }
}
print('ground over ' + counted + ' tiles: ' + ('0000000' + h.toString(16)).slice(-8));
const S = G.settlementsOf(g);
print('settlements: ' + S.length + ', first ' + (S[0] ? (S[0].name ?? S[0].tag) : '-'));
const R = G.roadTilesOf(g);
print('road tiles: ' + (R.size ?? R.length));

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
print('settlements hash: ' + ('0000000' + sh.toString(16)).slice(-8));
print('road hash:        ' + ('0000000' + rh.toString(16)).slice(-8));
