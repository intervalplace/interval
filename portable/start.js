// THE APP'S OWN WAY IN, which is a SCRIPT and not a module.
//
// `boot.mjs` is the way in for a shell: it imports the two crypto packages,
// installs the shim and evaluates the engine. An app cannot do that. The C
// interface JavaScriptCore exposes evaluates SCRIPTS -- there is no module
// loader to hand an `import` to -- so the entry has to be a plain file that
// expects `shim.js` and `esm.js` to have been evaluated before it, and takes
// everything else from the host.
//
// AND THE CRYPTO IS THE PLATFORM'S. `boot.mjs` hands the shim two ES modules;
// this hands it two functions of the host's, because on an Apple platform the
// digest is in a header that needs no framework and is faster than any
// JavaScript. `engine.js` already prefers a native digest where there is one
// -- it looks for Node's first and falls back to the pure-JS noble hashes --
// so this is the path it was written for, and SHA-256 is SHA-256.
//
// What is NOT here yet is ed25519, which is what signs a deed. The rest of
// this file works without it: a world can be built, a landscape computed and
// a frame drawn. Only minting a key and signing need it.
//
//   the host must already have installed: print, readFile, __digest, __entropy
(function () {
  'use strict';

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

  // The same adapter `boot.mjs` explains at length: engine.js hands a STRING
  // to the digest on its noble path and a Buffer on its Node one, and noble
  // refuses a string outright. The generator hashes strings constantly.
  const bytes = (v) => (typeof v === 'string' ? utf8(v) : v);
  const hashes = {
    sha256: (v) => __digest(256, bytes(v)),
    sha512: (v) => __digest(512, bytes(v)),
  };

  // ---- AND ED25519, WHICH IS WHAT SIGNS A DEED ----
  //
  // This one is NOT the platform's. Apple's own ed25519 is in CryptoKit,
  // which is Swift-only; the Security framework does not offer it and
  // CommonCrypto has never had it. So it is the same `@noble/ed25519` the
  // desktop bridge uses, loaded through the portable loader out of the same
  // node_modules the packaged client already ships.
  //
  // Which is the better answer anyway. Ed25519 is deterministic by
  // specification -- RFC 8032 -- so a correct implementation produces the
  // same signature as any other, and a citizen who signs on a phone signs
  // with the identical code a node verifies with. One implementation, not two
  // that have to be kept in step.
  //
  // IT IS HANDED OVER EMPTY AND FILLED IN. The shim's `require` is built by
  // `install`, and the loader needs that `require` to exist before it can
  // load anything -- so the module cannot be loaded before install and cannot
  // be added after it. An empty object goes in, is filled the moment there is
  // a loader, and `engine.js` -- which is evaluated after both -- takes it
  // whole. It needs sha512, and the engine wires that itself in
  // `ensureEdHash`: the native digest above goes in behind it.
  const ed = {};

  globalThis.__intervalShim.install(globalThis, {
    '@noble/hashes/sha2.js': hashes,
    '@noble/ed25519': ed,
  }, (arr) => __entropy(arr));

  const loader = globalThis.__intervalEsm.makeLoader(readFile,
    (spec) => globalThis.require(spec));
  const real = loader('./node_modules/@noble/ed25519/index.js');
  for (const name of Object.getOwnPropertyNames(real)) {
    if (name === '__awaits') continue;
    Object.defineProperty(ed, name,
      Object.getOwnPropertyDescriptor(real, name));
  }

  // ---- THE RULES, BYTE FOR BYTE ----
  //
  // Read as text and compiled as text. The SHA of these bytes IS what a
  // founding records about which rules made it, so a build that transformed
  // them would be a different world and would say so in that one number.
  const src = readFile('engine.js');
  const module = { exports: {} };
  const factory = new Function('module', 'exports', 'require', src);
  factory(module, module.exports, globalThis.require);
  if (typeof module.exports.declareEngine === 'function') {
    module.exports.declareEngine(src);
  }
  globalThis.__intervalEngine = module.exports;

  // ---- AND THE LANDSCAPE, through the portable loader ----
  const { makeLoader } = globalThis.__intervalEsm;
  const req = makeLoader(readFile, (spec) => {
    if (spec === './engine.js' || spec === 'engine.js') return module.exports;
    return globalThis.require(spec);
  });
  globalThis.__intervalReq = req;
  globalThis.__intervalWorldgen = req('./worldgen-any.mjs');
})();
