// LOAD THE WORLD'S OWN RULES IN AN ENGINE THAT IS NOT NODE.
//
// `engine.js` is CommonJS and the two libraries it needs are ES modules, which
// is a mismatch Node papers over and a bare JavaScript engine does not. So the
// modules are imported HERE, where import works, handed to the shim's tiny
// `require`, and the engine's source is then evaluated as the CommonJS module
// it is.
//
// The source comes from the HOST and not from a file path. Under `jsc` on a
// Mac that is readFile; on iOS it is a string out of the app bundle, where
// there is no filesystem to speak of and no working directory. Nothing in here
// knows which.
import * as ed25519 from '../node_modules/@noble/ed25519/index.js';
import * as sha2 from '../node_modules/@noble/hashes/sha2.js';
import '../portable/shim.js';
import '../portable/esm.js';

// UTF-8, by hand, because JavaScriptCore has no TextEncoder and this is the
// only place in the port that needs one. Two hundred characters of it beats a
// dependency that would have to be shipped in the app as well.
function utf8(str) {
  const out = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
      const lo = str.charCodeAt(i + 1);
      if (lo >= 0xdc00 && lo <= 0xdfff) {
        c = 0x10000 + ((c - 0xd800) << 10) + (lo - 0xdc00);
        i++;
      }
    }
    if (c < 0x80) { out.push(c); }
    else if (c < 0x800) { out.push(0xc0 | (c >> 6), 0x80 | (c & 63)); }
    else if (c < 0x10000) {
      out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    } else {
      out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63),
               0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
  }
  return Uint8Array.from(out);
}

export function loadEngine(readSource, entropy) {
  const { install } = globalThis.__intervalShim;
  // ---- THE ONE PLACE THE TWO PATHS DID NOT MATCH ----
  //
  // engine.js hashes through Node's crypto when there is one and through noble
  // when there is not, and the two were not given the same argument: the Node
  // branch wraps its input in `Buffer.from(buf)` first and the noble branch
  // hands it straight over. Node's Buffer takes a STRING and encodes it;
  // noble refuses one outright -- "expected Uint8Array, got type=string".
  //
  // Nothing noticed for as long as the portable path was only ever a browser,
  // because a browser never runs the landscape. The generator does hash
  // strings: naming a town's keeper is a hash of their town and their trade.
  // So the world came out identical for five ticks of rules and fell over the
  // moment it was asked where anybody lived.
  //
  // The engine is not touched -- its bytes are the world's identity -- so the
  // encoding is done HERE, where a host's job is to make its libraries look
  // like the ones the engine was written against. Which is all a shim is.
  const bytes = (v) => (typeof v === 'string' ? utf8(v) : v);
  const hashes = {
    ...sha2,
    sha256: (v) => sha2.sha256(bytes(v)),
    sha512: (v) => sha2.sha512(bytes(v)),
  };
  install(globalThis, {
    '@noble/ed25519': ed25519,
    '@noble/hashes/sha2.js': hashes,
  }, entropy);

  const src = readSource('engine.js');
  const module = { exports: {} };
  // THE FUNCTION CONSTRUCTOR, WHICH IS THE POINT. JavaScriptCore compiles a
  // string the same way it compiles a file, so the engine arrives byte for
  // byte as it is on disk -- and that matters more here than anywhere else in
  // the project, because the SHA of these bytes IS the world's identity. A
  // transpiled or bundled engine is a different world.
  const factory = new Function('module', 'exports', 'require', src);
  factory(module, module.exports, globalThis.require);
  // §2n: A FOUNDING NAMES THE ENGINE THAT MADE IT, and the engine only knows
  // its own hash if whoever loaded the source tells it. `serve.mjs` does this
  // on a node; anything that loads the engine has to, or every world it founds
  // is anonymous about which rules made it.
  if (typeof module.exports.declareEngine === 'function') {
    module.exports.declareEngine(src);
  }
  return module.exports;
}


// ---- AND THE LANDSCAPE, which is twenty-four ES modules ----
//
// The engine above is the RULES. Where the island is, what a tile is made of,
// where the roads run and which town is which are `worldgen-any.mjs` and
// everything it reaches -- and those are ES modules, in an engine with no
// module loader. See esm.js for what that costs and why it is not a bundler.
//
// The engine is handed in rather than loaded again: it is the same object, so
// a generator and the rules agree about the world by construction and not by
// two files happening to hash the same.
let _req = null;

export function loadWorldgen(readSource, engine) {
  const { makeLoader } = globalThis.__intervalEsm;
  _req = makeLoader(readSource, (spec) => {
    if (spec === './engine.js' || spec === 'engine.js') return engine;
    return globalThis.require(spec);
  });
  return _req('./worldgen-any.mjs');
}

// ANYTHING ELSE IN THE WORLD LAYER, through the SAME loader and so out of the
// same cache: the sky, the view's zoning, the terrain mirror's scatter plane.
// Loading one of them a second way would give a second copy of every module
// underneath it, and two copies of a landscape that memoises its own tables is
// two islands that agree only until one of them is asked something first.
// The loader itself, for the one caller that needs `loadAsync`: the entry
// module awaits at its top level and so cannot be required like the rest.
export function sharedLoader() {
  if (!_req) {
    throw new Error('load the landscape first: the world layer shares one '
      + 'module cache and this would start a second one');
  }
  return _req;
}

export function loadModule(name) {
  if (!_req) {
    throw new Error('load the landscape first: the world layer shares one '
      + 'module cache and this would start a second one');
  }
  return _req('./' + String(name).replace(/^\.\//, ''));
}
