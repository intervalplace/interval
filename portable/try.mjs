// Does the world run in JavaScriptCore? Build one and tick it.
import { loadEngine } from './boot.mjs';

// The host's two jobs, standing in for what an iOS app does.
const readSource = (name) => readFile(name);
let seed = 1;
const entropy = (arr) => {
  // A TEST SOURCE AND NAMED AS ONE. Deterministic, so a failure is repeatable;
  // on a phone this is SecRandomCopyBytes and nothing like this.
  for (let i = 0; i < arr.length; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    arr[i] = seed & 255;
  }
  return arr;
};

const E = loadEngine(readSource, entropy);
print('engine loaded, exports: ' + Object.keys(E).length);

// A FOUNDING, WITH EVERY FIELD, because a genesis with an undefined member is
// not canonically encodable and the engine says so in as many words.
const g = E.makeGenesis('a-seed-for-the-test', 'rules-hash', 0, 320, 200,
                        'interval-classic-v1');
print('genesis made, generator ' + g.worldGenerator);
print('genesis valid: ' + (E.validateGenesis ? (E.validateGenesis(g) ?? 'yes') : '?'));

const id = E.worldId(g);
print('world id ' + String(id).slice(0, 24));

let w = E.newWorld(g);
print('world built at tick ' + w.tick);

// A CITIZEN, AND A HANDFUL OF TICKS. Building a world proves the tables load;
// ticking one proves the rules RUN, which is the thing a phone has to do
// sixty times a minute.
E.addPlayer(w, 'test-citizen', E.spawnOf(g).x, E.spawnOf(g).y);
for (let i = 0; i < 5; i++) w = E.nextState(w, []);
print('ticked to ' + w.tick + ', citizens ' + Object.keys(w.players).length);

// AND THE HASH OF THE ENGINE'S OWN BYTES, which is what makes this port
// matter: if the source had to be transpiled or bundled to run here, this
// number would change and it would be a different world.
print('engine hash ' + String(E.engineHash ? E.engineHash() : 'not declared').slice(0, 24));
