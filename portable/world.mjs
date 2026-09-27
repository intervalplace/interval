// AND THE REST OF WHAT THE BRIDGE KNOWS: the terrain mirror, the view, the sky
// and the generator that grew this island. None of them touches Node at all --
// no fs, no ws, no require -- so if they load and answer here then everything
// the window is ever told comes from code a phone can run.
//
// THEY GO THROUGH THE PORTABLE LOADER, not through the host's import. That is
// not a detail: three of these four load perfectly well under JavaScriptCore's
// own module loader, and `worldgen-any.mjs` does not and never will, because
// it default-imports a CommonJS file and only Node synthesises that default.
// An iOS app has one loader for the whole world layer, so this uses one too --
// otherwise the proof would be of an arrangement nobody is going to ship.
import { loadEngine, loadWorldgen, loadModule } from './boot.mjs';

const readSource = (n) => readFile(n);
const E = loadEngine(readSource, null);
const WG = loadWorldgen(readSource, E);

const g = WG.foundGenesis('interval-expanse-v7', 'solo-538',
  '6cde7f4e2631a1af4ff405cb51d1bf78f66ba3ec83531d18adee6599d8ca1cdd',
  1789813895202, 896, 512);

const G = WG.generatorFor(g);
print('generator for this founding: ' + typeof G);

const sky = loadModule('sky.mjs');
print('sky at interval 1000: ' + JSON.stringify(sky.skyAt(g, 1000)).slice(0, 90));

const view = loadModule('view.mjs');
print('view: zone of 460,264 is ' + JSON.stringify(view.zoneOf(460, 264))
      + ', ' + view.zonesAround(460, 264).length + ' zones around it');

const TM = loadModule('terrain-mirror.mjs');
print('terrain mirror exports: ' + Object.keys(TM).length);
TM.configure({ W: g.worldW, H: g.worldH, GEN: g.worldGenerator, GSEED: g.genesisSeed });
print('the scatter plane at 460,264: ' + TM.tileHash(460, 264, 97));
print('and the ground there, from the generator: '
      + (G.groundKindAt(g, 460, 264) ?? G.biomeAt(g, 460, 264)));
