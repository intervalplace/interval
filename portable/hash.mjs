// THE ONE NUMBER THAT SETTLES WHETHER THIS IS THE SAME WORLD.
//
// A port that computes a different engine hash is not a port, it is a fork:
// the hash is what a founding records about which rules made it, and two
// engines that disagree cannot agree about anything else either.
import { loadEngine } from './boot.mjs';
const E = loadEngine((name) => readFile(name), null);
print(E.engineHash());
