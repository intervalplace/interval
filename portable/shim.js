// WHAT A JAVASCRIPT ENGINE THAT IS NOT NODE HAS TO BE GIVEN.
//
// The plan this belongs to: run the world's own rules INSIDE the app on iOS,
// in JavaScriptCore, instead of beside it in a Node process. The bridge holds
// the key and all world knowledge and that must not change -- it is the whole
// architecture -- but iOS will neither ship Node nor let an app start an
// interpreter, so the interpreter has to be the one iOS already has.
//
// ENGINE.JS IS ALREADY WRITTEN FOR THIS, which is the good news and not an
// accident: it probes for Node's crypto and falls through to pure-JS noble
// hashes when there is none, and says so in its own comments. So what it
// wants from a host is small and nameable, and this is the whole list.
//
//   require   three modules and nothing else: the two noble packages, and
//             'crypto', which must FAIL so the portable path is taken.
//   Buffer    hex and utf8 in and out. Not Node's Buffer: the twelve things
//             the engine actually does with one.
//   process   env, which is only ever read with a `??` default behind it,
//             and hrtime for one timing call.
//   crypto.getRandomValues   for minting a key, and only for that.
//
// Nothing here knows about iOS. It is the same shim under `jsc` on a Mac,
// which is how it gets tested at all -- see Tools/jsc.sh.
'use strict';

function install(globals, modules, entropy) {
  // ---- Buffer, as much of one as the engine asks for ----
  //
  // Node's Buffer is a Uint8Array subclass with a string codec bolted on. The
  // engine uses it for exactly two things -- hashing bytes and printing hex --
  // so that is what this is, and it says so rather than pretending to be the
  // real thing.
  class Bytes extends Uint8Array {
    static from(src, encoding) {
      if (typeof src === 'string') {
        if (encoding === 'base64') {
          return Bytes._fromBase64(src);
        }
        if (encoding === 'latin1' || encoding === 'binary') {
          const out = new Bytes(src.length);
          for (let i = 0; i < src.length; i++) { out[i] = src.charCodeAt(i) & 255; }
          return out;
        }
        if (encoding === 'hex') {
          const out = new Bytes(src.length >> 1);
          for (let i = 0; i < out.length; i++) {
            out[i] = parseInt(src.substr(i * 2, 2), 16);
          }
          return out;
        }
        // utf8, written out because there is no TextEncoder in this engine.
        const bytes = [];
        for (let i = 0; i < src.length; i++) {
          let c = src.codePointAt(i);
          if (c > 0xffff) i++;
          if (c < 0x80) { bytes.push(c); }
          else if (c < 0x800) { bytes.push(0xc0 | (c >> 6), 0x80 | (c & 63)); }
          else if (c < 0x10000) {
            bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
          } else {
            bytes.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63),
                       0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
          }
        }
        return new Bytes(bytes);
      }
      if (src instanceof Uint8Array || Array.isArray(src)) {
        const out = new Bytes(src.length);
        out.set(src);
        return out;
      }
      if (src && src.buffer) { return new Bytes(new Uint8Array(src.buffer)); }
      return new Bytes(0);
    }

    static _fromBase64(str) {
      const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
              + '0123456789+/';
      const clean = String(str).replace(/[^A-Za-z0-9+/]/g, '');
      const out = new Bytes((clean.length * 3) >> 2);
      let at = 0;
      for (let i = 0; i < clean.length; i += 4) {
        const n = (A.indexOf(clean[i]) << 18) | (A.indexOf(clean[i + 1]) << 12)
                | ((A.indexOf(clean[i + 2]) & 63) << 6)
                | (A.indexOf(clean[i + 3]) & 63);
        if (at < out.length) out[at++] = (n >> 16) & 255;
        if (at < out.length) out[at++] = (n >> 8) & 255;
        if (at < out.length) out[at++] = n & 255;
      }
      return out;
    }

    static concat(list) {
      let n = 0;
      for (const b of list) n += b.length;
      const out = new Bytes(n);
      let at = 0;
      for (const b of list) { out.set(b, at); at += b.length; }
      return out;
    }

    static isBuffer(x) { return x instanceof Bytes; }

    toString(encoding) {
      // ---- BASE64, WHICH IS HOW THE GROUND TRAVELS ----
      //
      // A terrain chunk is four planes of one byte a tile and they go to the
      // window as base64. Without this the bridge starts, reads the world,
      // opens its door -- and falls over on the FIRST question a window ever
      // asks it, inside `toString`, trying to read the tile codes as text.
      // JavaScriptCore has no `btoa` and no Buffer, so it is written out.
      if (encoding === 'base64') {
        const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
                + '0123456789+/';
        let out = '';
        let i = 0;
        for (; i + 2 < this.length; i += 3) {
          const n = (this[i] << 16) | (this[i + 1] << 8) | this[i + 2];
          out += A[(n >> 18) & 63] + A[(n >> 12) & 63]
               + A[(n >> 6) & 63] + A[n & 63];
        }
        const left = this.length - i;
        if (left === 1) {
          const n = this[i] << 16;
          out += A[(n >> 18) & 63] + A[(n >> 12) & 63] + '==';
        } else if (left === 2) {
          const n = (this[i] << 16) | (this[i + 1] << 8);
          out += A[(n >> 18) & 63] + A[(n >> 12) & 63] + A[(n >> 6) & 63] + '=';
        }
        return out;
      }
      if (encoding === 'hex') {
        let s = '';
        for (let i = 0; i < this.length; i++) {
          s += (this[i] < 16 ? '0' : '') + this[i].toString(16);
        }
        return s;
      }
      // ---- LATIN-1, WHICH IS ONE CHARACTER A BYTE AND NOTHING ELSE ----
      //
      // The engine binds a signature to its payload by hashing them together
      // and keeping the digest as a STRING -- `sha256(...).toString('latin1')`
      // -- because a string is what a Map keys on. Falling through to utf8 for
      // it is not an approximation, it is a different string: every byte above
      // 0x7f is read as the start of a multi-byte sequence and the result is
      // shorter, so a deed signed here would not verify anywhere, including
      // here. It came back as "Arguments contain a value that is out of range
      // of code points", from `fromCodePoint`, five frames from anything to do
      // with signing.
      if (encoding === 'latin1' || encoding === 'binary') {
        let s = '';
        for (let i = 0; i < this.length; i++) {
          s += String.fromCharCode(this[i]);
        }
        return s;
      }
      // utf8 out, again by hand.
      let s = '';
      for (let i = 0; i < this.length;) {
        const b = this[i];
        if (b < 0x80) { s += String.fromCharCode(b); i += 1; }
        else if (b < 0xe0) {
          s += String.fromCharCode(((b & 31) << 6) | (this[i + 1] & 63)); i += 2;
        } else if (b < 0xf0) {
          s += String.fromCharCode(((b & 15) << 12) | ((this[i + 1] & 63) << 6)
                                   | (this[i + 2] & 63)); i += 3;
        } else {
          const cp = ((b & 7) << 18) | ((this[i + 1] & 63) << 12)
                   | ((this[i + 2] & 63) << 6) | (this[i + 3] & 63);
          s += String.fromCodePoint(cp); i += 4;
        }
      }
      return s;
    }

    // THE NUMERIC READS, which are a digest turned into a number: some bytes
    // out of a hash, big-endian. Uint8Array has no such method and Node's
    // Buffer does, which is the whole of the difference.
    //
    // The engine does four-byte reads and does them seven times. THE
    // LANDSCAPE does two-byte reads and does them a hundred and thirty-three:
    // every wander of a river, every bend of a road and every jitter of a
    // tree is `thash(...).readUInt16BE(0)`. The first pass at this shim read
    // only the engine and the island would not build.
    readUInt32BE(at) {
      at = at | 0;
      return ((this[at] << 24) >>> 0) + (this[at + 1] << 16)
           + (this[at + 2] << 8) + this[at + 3];
    }

    readUInt16BE(at) {
      at = at | 0;
      return (this[at] << 8) + this[at + 1];
    }

    readUInt8(at) { return this[at | 0]; }

    // AND THE ONE WRITE, which is how a seed is put back into bytes before it
    // is hashed again. Node's Buffer returns the offset past what it wrote.
    writeUInt32BE(v, at) {
      at = at | 0;
      v = v >>> 0;
      this[at] = (v >>> 24) & 255;
      this[at + 1] = (v >>> 16) & 255;
      this[at + 2] = (v >>> 8) & 255;
      this[at + 3] = v & 255;
      return at + 4;
    }

    // SLICE HAS TO STAY A Bytes. Uint8Array.prototype.slice builds `new
    // this.constructor`, which is right here by luck rather than by design --
    // it is spelled out so that a later refactor cannot quietly hand back a
    // plain array and take `.toString('hex')` away with it.
    slice(a, b) { return Bytes.from(super.slice(a, b)); }
    subarray(a, b) { return Bytes.from(super.subarray(a, b)); }

    equals(other) {
      if (!other || other.length !== this.length) return false;
      for (let i = 0; i < this.length; i++) if (this[i] !== other[i]) return false;
      return true;
    }
  }
  globals.Buffer = Bytes;

  // ---- process, which is read four times and always with a default ----
  globals.process = globals.process || {
    env: {},
    // One call, for a duration. Milliseconds are fine where nanoseconds were
    // asked for, because the only thing done with it is a subtraction.
    hrtime: { bigint: () => BigInt(Math.round((globals.Date.now()) * 1e6)) },
    platform: 'jsc',
  };

  // ---- randomness, which only key minting needs ----
  //
  // The HOST supplies it. On iOS that is SecRandomCopyBytes through the app;
  // under `jsc` for a test it is whatever the caller passed. A key minted from
  // a weak source is a citizen anybody can become, so there is no default and
  // no fallback: absent entropy, this throws rather than inventing some.
  // A HOST THAT ALREADY HAS ONE KEEPS IT, and a host whose `crypto` is a
  // read-only accessor -- which Node's global is -- is not written to at all.
  // Assigning over it threw, which stopped the shim before anything else in
  // it had been installed.
  if (!globals.crypto) try { globals.crypto = {
    getRandomValues: (arr) => {
      if (!entropy) {
        throw new Error('no entropy: the host must supply getRandomValues '
                      + 'before a key can be minted');
      }
      return entropy(arr);
    },
  }; } catch { /* a global that will not be written to already has one */ }

  // ---- console, which the LANDSCAPE wants and the rules do not ----
  //
  // engine.js never says anything. The generator does: it counts the scenes it
  // laid, the residents who had nowhere to stand, the fields it could not
  // finish, and it says so through `console.warn`. JavaScriptCore has no
  // console at all, so the first attempt to build the island died on
  // "undefined is not an object (evaluating 'console.warn')" -- in the middle
  // of a founding, with nothing wrong with the founding.
  //
  // A host that wants these lines gives us somewhere to put them; one that
  // does not gets a console that swallows them, which is what a phone wants.
  // Either way the world is built, because whether anybody is listening is not
  // allowed to change what the island looks like.
  if (!globals.console) {
    const say = (typeof globals.print === 'function')
      ? (args) => globals.print(args.join(' '))
      : () => {};
    globals.console = {
      log: function () { say([].slice.call(arguments)); },
      warn: function () { say([].slice.call(arguments)); },
      error: function () { say([].slice.call(arguments)); },
      info: function () { say([].slice.call(arguments)); },
      debug: function () {},
    };
  }

  // ---- require, for three names ----
  //
  // 'crypto' MUST throw. engine.js asks for it first and falls through to the
  // pure-JS path when it is not there, which is the path a phone takes; a
  // half-answer here would put it down a road with no Node at the end of it.
  const cache = new Map(Object.entries(modules));
  function require(name) {
    if (name === 'crypto' || name === 'node:crypto') {
      throw new Error('no node crypto here, and that is deliberate');
    }
    if (cache.has(name)) return cache.get(name);
    // ---- A MODULE THAT IS LINKED AND NEVER USED ----
    //
    // `unreal-bridge.mjs` imports `nodeHost` from `host-node.mjs`, and that
    // file imports `fs` and `ws` at its top. On a phone the host is installed
    // beforehand so `nodeHost()` is never CALLED -- but the module is still
    // linked, and a loader that threw on `fs` would refuse the whole bridge
    // for a function nobody was ever going to run.
    //
    // So an unknown module comes back as something that throws the moment
    // anybody touches it, naming itself. Linking succeeds; using it fails
    // loudly, and the message is true: this machine has no filesystem.
    //
    // It hands back a FUNCTION that throws rather than throwing on the access
    // itself, because a named import destructures the module the instant it is
    // linked: `import { createRequire } from 'module'` reads the property, and
    // a proxy that threw there would refuse the file for a name nobody calls.
    // Throwing on the CALL is the true statement -- the thing does not exist
    // here, and you find that out when you try to use it.
    return new Proxy({}, {
      get (_, prop) {
        if (prop === Symbol.toPrimitive || prop === 'toString') {
          return () => '[absent module ' + name + ']';
        }
        return function () {
          throw new Error('this host has no ' + name + ', and something '
                        + 'called ' + name + '.' + String(prop));
        };
      },
    });
  }
  globals.require = require;
  return { Bytes, require };
}

globalThis.__intervalShim = { install };
