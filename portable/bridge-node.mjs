// THE SAME PROOF, ON A NODE, AND THE NUMBER TO MATCH.
//
// `bridge.mjs` runs the whole bridge in JavaScriptCore -- the engine an iPhone
// gives an app -- and asks it the first question a window ever asks: give me
// the ground for this rectangle. This runs the identical stack under Node and
// prints the same hash, so what is being compared is the ENGINE and nothing
// else: the same loader, the same shim, the same canned replies, the same
// deterministic entropy, the same rectangle.
//
//   node portable/bridge-node.mjs
//   Tools/jsc.sh portable/bridge.mjs
import fs from 'node:fs';

globalThis.print = (...a) => console.log(...a);
globalThis.readFile = (name) => fs.readFileSync(
  new URL('../' + name.replace(/^\.\//, ''), import.meta.url), 'utf8');

await import('./bridge.mjs');
