// THE BRIDGE ITSELF, RUN IN THE ENGINE A PHONE WOULD GIVE IT.
//
// `try.mjs` proved the rules run here and `land.mjs` proved the landscape comes
// out tile for tile the same. This is the file that sits between them and the
// window -- nineteen hundred lines of what a tile is made of, what a verb
// needs, which deeds a citizen may be offered -- loaded and run by
// JavaScriptCore with no Node anywhere.
//
// It is loaded through the portable loader, which had to learn one thing to do
// it: `unreal-bridge.mjs` ends with `await announceWorld()`, and `new Function`
// compiles an ordinary function where `await` is a syntax error. One module in
// twenty-five awaits at its top level, so the loader builds an async factory
// for that one and leaves the other twenty-four alone. See `loadAsync`.
import { loadEngine, loadWorldgen, loadModule, sharedLoader } from './boot.mjs';

const readSource = (name) => readFile(name);
let seed = 7;
const entropy = (arr) => {
  for (let i = 0; i < arr.length; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    arr[i] = seed & 255;
  }
  return arr;
};

const E = loadEngine(readSource, entropy);
loadWorldgen(readSource, E);            // the landscape, into the same cache
print('the rules and the landscape are loaded');

const { jscHost } = await import('./host-jsc.mjs');
globalThis.__intervalHost = jscHost(() => E, readSource,
                                    readFile('portable/canned.json'));
print('a host installed: ' + globalThis.__intervalHost.name);

await sharedLoader().loadAsync('./unreal-bridge.mjs');
print('unreal-bridge.mjs ran to the end of its own body');

// ---- AND THEN ASK IT WHAT A WINDOW ASKS IT ----
//
// Starting is not working. The window's first question is always the same --
// give me the ground for this rectangle -- and the answer is four planes of
// bytes: what each tile is made of, which are roads, which are on the ridge,
// and the scatter hash that decides where every tuft of grass in the world
// stands. If a phone answers that with the same bytes a desktop does, the two
// are drawing one island.
const host = globalThis.__intervalHost;
const seen = [];
const ws = {
  handlers: {},
  on (what, fn) { (this.handlers[what] ??= []).push(fn); return this; },
  send (msg) { seen.push(msg); },
  close () {},
};
host.knock(ws);
for (const fn of ws.handlers.message ?? []) {
  fn(JSON.stringify({ k: 'terrain', x0: 456, y0: 268, w: 8, h: 8, skirt: 1 }));
}

// FNV over the whole reply, which is the four planes and the rectangle they
// are for. One number to compare against a node.
function fnv(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
  return ('0000000' + h.toString(16)).slice(-8);
}
const terrain = seen.filter((m) => m.includes('"k":"terrain"'));
print('the window asked for ground and the bridge sent ' + terrain.length
      + ' chunk(s), ' + (terrain[0] ? terrain[0].length : 0) + ' bytes');
// THE GROUND ONLY, and not the hello. The hello carries the citizen's own
// public key, and the two runs mint different citizens -- Node has a real
// `crypto.getRandomValues` and the shim rightly leaves it alone, while under
// `jsc` the entropy is the deterministic one this file passes in. The ISLAND
// is the thing being compared, and it does not depend on who is looking.
print('  ground hash: ' + fnv(terrain.join('|')));
print('  hello bytes: ' + (seen.find((m) => m.includes('"k":"hello"')) || '').length);
for (const m of seen) {
  const k = (m.match(/"k":"([a-z]+)"/) || [])[1];
  print('  it sent a ' + k + ', ' + m.length + ' bytes');
}
