// MINT A KEY AND SIGN A DEED, WITH NO NODE ANYWHERE.
//
// This is the half of the architecture that cannot be compromised: the key is
// the citizen, it is made on the player's own machine and never leaves it. On
// a phone that means ed25519 has to work in JavaScriptCore, on the pure-JS
// path, with the host supplying nothing but randomness.
import { loadEngine } from './boot.mjs';
let seed = 20260926;
const entropy = (a) => { for (let i = 0; i < a.length; i++) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; a[i] = seed & 255; } return a; };
const E = loadEngine((n) => readFile(n), entropy);
E.initCrypto && E.initCrypto();

const me = E.generateIdentity();
const input = E.signInput({
  worldId: 'a4de408dc51d2528', tick: 12, playerId: me.playerId,
  type: 'walk', dx: 1, dy: 0, steps: 1,
}, me.privateKey);
print(JSON.stringify({ playerId: me.playerId, input }));
