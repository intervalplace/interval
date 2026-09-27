// BUILD THE SAME WORLD AND WALK IT, AND SAY WHAT CAME OUT.
//
// The engine hash proves the RULES are byte-identical. This proves they
// AGREE: same founding, same deeds, same ticks, and the digest of the state
// at the end. If a phone and a node disagree about that, the phone is not
// playing this world, and no amount of the rest working would matter.
import { loadEngine } from './boot.mjs';
let seed = 7;
const entropy = (a) => { for (let i = 0; i < a.length; i++) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; a[i] = seed & 255; } return a; };
const E = loadEngine((n) => readFile(n), entropy);

const g = E.makeGenesis('agree-seed', 'x'.repeat(64), 0, 320, 200, 'interval-classic-v1');
let w = E.newWorld(g);
const sp = E.spawnOf(g);
E.addPlayer(w, 'walker', sp.x, sp.y);
for (let i = 0; i < 40; i++) w = E.nextState(w, []);
const p = w.players['walker'];
print(JSON.stringify({
  engine: E.engineHash().slice(0, 16),
  world: String(E.worldId(g)).slice(0, 16),
  tick: w.tick,
  where: [p.x, p.y],
  hp: p.hp,
  gold: p.gold,
  nodes: Object.keys(w.nodes).length,
  mobs: Object.keys(w.mobs || {}).length,
}));
