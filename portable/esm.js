// RUN THE WORLD'S ES MODULES IN AN ENGINE THAT HAS NO MODULE LOADER.
//
// `engine.js` is the rules and it loads already (see boot.mjs): it is one
// CommonJS file and a `new Function` evaluates it byte for byte, which is what
// keeps the world's identity intact. The LANDSCAPE is a different shape. It is
// twenty-four ES modules -- `worldgen-any.mjs` and everything it reaches --
// and eight of them do `import E from './engine.js'`, a DEFAULT import of a
// CommonJS file. Node synthesises that default; a plain ES module loader does
// not, and it fails at LINK time, before a line of anybody's code runs.
//
// WHY NOT A BUNDLER. esbuild would do this in a second and correctly, and it
// would be the first build step this project has ever had. `build-window.mjs`
// says out loud that the browser window has "no bundler and no external
// asset", and the whole argument for a downloadable client here is that a
// person can read what they are running. A dependency that rewrites every line
// of the world's landscape before it reaches a phone is exactly the thing this
// project keeps refusing. So the loader is here, in the open, in a hundred and
// fifty lines, and it is not general: it handles the syntax these files
// actually use and throws on anything else rather than guessing.
//
// WHAT IT HANDLES, which was counted rather than assumed -- every import and
// export line in all twenty-four modules was listed first:
//
//   import * as ns from './x.mjs'          import D from './engine.js'
//   import { a, b as c } from './x.mjs'    (including over several lines)
//   export function f            export const X        export { a, b as c }
//   export { a, b as c } from './x.mjs'
//
// There is no `export default`, no `export class`, no `export let`, no
// `export *` and no cycle anywhere in the graph -- all four checked, because a
// cycle is the one thing a require-shaped loader gets wrong that a real one
// does not. The re-export was NOT in the first survey and threw on the first
// run, which is the argument for failing loudly on syntax rather than
// skipping a line nobody recognised.
//
// LIVE BINDINGS, which is why the exports are getters and not assignments. A
// module that exports a name and then reassigns it would otherwise hand out
// the value it had at definition time. Nothing here does that today; the
// getter costs nothing and means nobody has to check again.

(function () {
  'use strict';

  // THE NAMES IN A LIST, WITH WHAT ANYBODY WROTE BESIDE THEM TAKEN OFF.
  //
  // `terrain-mirror.mjs` annotates its export list -- "the one every window
  // actually calls", "the landmarks with bespoke art" -- and a splitter that
  // does not know about a comment reads the annotation as a name and refuses
  // the file. Line comments only: nothing in this graph puts a block comment
  // inside a brace, and a parser that guesses is the thing this file avoids.
  function names(inside) {
    return inside.split('\n')
      .map((l) => l.replace(/\/\/.*$/, ''))
      .join('\n')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }

  // `await` inside a STRING or a COMMENT is not an await. Two of the world's
  // files talk about awaiting in prose, and a loader that believed them would
  // wrap a perfectly ordinary module in a promise nobody waits on.
  function stripStrings(code) {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
      .replace(/'(?:\\.|[^'\\\n])*'/g, "''")
      .replace(/"(?:\\.|[^"\\\n])*"/g, '""')
      .replace(/`(?:\\.|[^`\\])*`/g, '``');
  }

  // Whether a file is an ES module, asked of the file. A line beginning
  // `import` or `export` outside a block comment is the whole test -- and the
  // comment matters: `@noble/ed25519` opens with a doc block whose @example
  // begins `import * as ed from ...` at column zero.
  function isModule(text) {
    let inBlock = false;
    for (const line of text.split('\n')) {
      const opens = (line.match(/\/\*/g) || []).length;
      const closes = (line.match(/\*\//g) || []).length;
      const was = inBlock;
      if (opens > closes) { inBlock = true; }
      else if (closes > opens) { inBlock = false; }
      if (was) continue;
      if (/^(import|export)[\s{*]/.test(line)) return true;
    }
    return false;
  }

  function fail(where, line) {
    throw new Error('the portable loader does not understand this line in '
      + where + ', and will not guess: ' + line.trim());
  }

  // ---- one module's source, rewritten ----
  //
  // Imports are HOISTED to the top, which is what a real loader does: every
  // import of a module is evaluated before any of its body. These files put
  // imports in the middle -- worldgen-expanse7 has a `const` between two of
  // them -- and leaving them where they lie would read a binding that has not
  // been made yet.
  function rewrite(src, where) {
    const lines = src.split('\n');
    const head = [];
    const body = new Array(lines.length).fill(null);
    const named = [];        // { as, from } -- from is an expression in scope

    // ---- AND NOT INSIDE A BLOCK COMMENT ----
    //
    // `@noble/ed25519` opens with a doc block containing an `@example`, and
    // the example is a line beginning `import * as ed from ...` at column
    // zero. A scanner that reads lines and not code takes that for a real
    // import, hoists it, and asks the host for a module the file never wanted.
    // Harmless there by luck; not harmless in general.
    let inBlock = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const opens = (line.match(/\/\*/g) || []).length;
      const closes = (line.match(/\*\//g) || []).length;
      const wasInBlock = inBlock;
      if (opens > closes) { inBlock = true; }
      else if (closes > opens) { inBlock = false; }
      if (wasInBlock) {
        body[i] = line;
        continue;
      }
      if (/^import\s/.test(line) || /^import\{/.test(line)) {
        // Gather until the statement names its module.
        let stmt = line, j = i;
        while (!/\sfrom\s+['"][^'"]+['"]/.test(stmt) && !/^import\s+['"]/.test(stmt)) {
          j++;
          if (j >= lines.length) fail(where, line);
          stmt += '\n' + lines[j];
        }
        for (let k = i; k <= j; k++) body[k] = '';
        i = j;
        head.push(importLine(stmt, where));
        continue;
      }
      if (/^export\s/.test(line)) {
        const m = line.match(/^export\s+(function|const)\s+([A-Za-z_$][\w$]*)/);
        if (m) {
          named.push({ as: m[2], from: m[2] });
          body[i] = line.replace(/^export\s+/, '');
          continue;
        }
        // `export { ... }`, possibly over several lines.
        if (/^export\s*\{/.test(line)) {
          let stmt = line, j = i;
          while (!stmt.includes('}')) {
            j++;
            if (j >= lines.length) fail(where, line);
            stmt += '\n' + lines[j];
          }
          for (let k = i; k <= j; k++) body[k] = '';
          i = j;
          // A RE-EXPORT, `export { a, b as c } from './x.mjs'`. Two of these
          // modules pass a neighbour's exports straight through -- v6 of the
          // shire keeps most of the frozen shire's tables and redraws one --
          // and it is the same statement with somewhere else to read from.
          let src2 = null;
          if (/\bfrom\b/.test(stmt)) {
            const at = stmt.match(/from\s+['\"]([^'\"]+)['\"]/);
            if (!at) fail(where, line);
            src2 = '__re' + head.length;
            head.push('const ' + src2 + ' = __req('
              + JSON.stringify(at[1]) + ');');
          }
          for (const t of names(stmt.slice(stmt.indexOf('{') + 1,
                                            stmt.lastIndexOf('}')))) {
            const as = t.match(/^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/);
            const one = /^[A-Za-z_$][\w$]*$/.test(t);
            if (!as && !one) { fail(where, t); continue; }
            const from = as ? as[1] : t;
            const name = as ? as[2] : t;
            named.push({ as: name, from: src2 ? (src2 + '.' + from) : from });
          }
          continue;
        }
        fail(where, line);
      }
      body[i] = line;
    }

    // ---- `import.meta.url`, WHICH IS SYNTAX AND NOT A VALUE ----
    //
    // A module compiled by `new Function` is not a module as far as the parser
    // is concerned, so `import.meta` anywhere in it is a syntax error and the
    // whole file is refused. `host-node.mjs` uses it twice, to find the engine
    // and to find a file beside itself.
    //
    // It is replaced with the module's own name as a URL, which is what it
    // means. Anything else off `import.meta` is refused by name rather than
    // guessed at -- there is no honest answer for `import.meta.resolve` here.
    const body2 = body.map((l) => (l === null ? null
      : l.replace(/import\.meta\.url/g, JSON.stringify('file:///' + where))
         // ---- AND A DYNAMIC `import()`, WHICH IS ALSO SYNTAX ----
         //
         // `new Function` compiles a script, and JavaScriptCore will not take
         // `import(...)` in one: "Unexpected keyword 'import'". The bridge
         // uses it once, to load the ridge predicate softly -- a world that is
         // not expanse7 should lose the ridge rather than fall over -- and
         // that `try` is exactly the shape a dynamic import is for.
         //
         // Here the whole graph is already synchronous, so it becomes a
         // require wrapped in a resolved promise: the same value, the same
         // catch, and the softness kept.
         .replace(/\bimport\(\s*(['"])(\.\/[^'"]+)\1\s*\)/g,
                  'Promise.resolve(__req($1$2$1))')));
    for (let i = 0; i < body2.length; i++) {
      if (body2[i] && /import\.meta/.test(stripStrings(body2[i]))) {
        fail(where, body2[i]);
      }
    }

    const tail = named.map((n) =>
      'Object.defineProperty(exports, ' + JSON.stringify(n.as)
      + ', { get: function () { return ' + n.from
      + '; }, enumerable: true, configurable: true });').join('\n');
    // The head is one line, so every line of the original keeps its number in
    // a stack trace -- which is most of what makes a loader like this bearable
    // to debug at all.
    return head.join(' ') + '\n' + body2.map((l) => (l === null ? '' : l)).join('\n')
      + '\n' + tail + '\n';
  }

  function importLine(stmt, where) {
    const at = stmt.match(/from\s+['"]([^'"]+)['"]/)
      || stmt.match(/^import\s+['"]([^'"]+)['"]/);
    if (!at) fail(where, stmt);
    const req = '__req(' + JSON.stringify(at[1]) + ')';
    const clause = stmt.replace(/^import\s*/, '').replace(/\s*from\s+['"][^'"]+['"]\s*;?\s*$/, '')
      .replace(/^['"][^'"]+['"]\s*;?\s*$/, '').trim();
    if (!clause) return req + ';';                       // import './x'
    const star = clause.match(/^\*\s+as\s+([A-Za-z_$][\w$]*)$/);
    if (star) return 'const ' + star[1] + ' = ' + req + ';';
    // A default import of a CommonJS file IS its module.exports -- which is
    // the one incompatibility this whole file exists for.
    const plain = clause.match(/^([A-Za-z_$][\w$]*)$/);
    if (plain) return 'const ' + plain[1] + ' = ' + req + ';';
    const braced = clause.match(/^\{([\s\S]*)\}$/);
    if (braced) {
      const binds = names(braced[1]).map((p) => {
        const as = p.match(/^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/);
        if (as) return as[1] + ': ' + as[2];
        if (/^[A-Za-z_$][\w$]*$/.test(p)) return p;
        fail(where, p);
        return '';
      });
      return 'const { ' + binds.join(', ') + ' } = ' + req + ';';
    }
    fail(where, stmt);
    return '';
  }

  // ---- the loader itself ----
  //
  // `readSource(name)` is the host's: readFile under jsc, a string out of the
  // app bundle on a phone. Nothing here knows which, and nothing here has a
  // filesystem, a working directory or a path -- every module in this graph
  // names its neighbour as `./thing.mjs` and they all live together.
  function makeLoader(readSource, baseRequire) {
    const cache = new Map();
    // The modules that await at their top level, waiting to be run by
    // `loadAsync`. See the note in `req`.
    const pending = new Map();
    function req(spec) {
      const name = spec.replace(/^\.\//, '');
      if (cache.has(name)) return cache.get(name);
      // ---- WHAT IS A MODULE IS A QUESTION ABOUT THE FILE ----
      //
      // This asked the EXTENSION, and `.mjs` is not what makes something a
      // module: `@noble/ed25519` ships `index.js` with `"type": "module"` in
      // its package, so the loader handed it to the host's require, the host
      // did not have it, and back came the absent-module stand-in -- whose
      // every property is a function that throws. `typeof ed.sign` was
      // 'function' and `Object.keys(ed)` was empty, which is a confusing pair
      // of facts to be given at four in the morning.
      //
      // So the file is asked instead. A module says `import` or `export` at
      // the start of a line; `engine.js` says neither and is handed to the
      // host, which is what puts the rules in by name.
      const text = /\.(mjs|js)$/.test(name) ? readSource(name) : null;
      if (text === null || !isModule(text)) return baseRequire(spec);
      const module = { exports: {} };
      // In the cache BEFORE it runs, which is the only defence a loader of
      // this shape has against a cycle: a module that came back round would
      // otherwise be evaluated a second time and get two of everything.
      cache.set(name, module.exports);
      const code = rewrite(text, name);
      // ---- AN ASYNC FACTORY WHEN THE MODULE AWAITS AT ITS TOP LEVEL ----
      //
      // `new Function` compiles an ORDINARY function, and `await` outside an
      // async one is a syntax error -- so `unreal-bridge.mjs`, which ends with
      // `await announceWorld()`, could not be compiled at all. One module in
      // twenty-five does this, and making every load a promise to suit it
      // would turn the whole landscape asynchronous for no reason.
      //
      // So the factory is only async where it has to be, and such a module is
      // loaded through `loadAsync` rather than through `require`. Asking for it
      // synchronously says so instead of handing back a promise that looks
      // like a module and is not.
      // ---- ASKED OF THE PARSER, NOT OF A REGULAR EXPRESSION ----
      //
      // Whether a module awaits at its TOP level is a question about scope,
      // and a pattern cannot answer it: the first cut matched the word inside
      // a comment in `terrain-mirror.mjs` and quietly declared the whole
      // terrain mirror an entry module, so its body never ran and every one of
      // its eighteen exports came back undefined.
      //
      // `new Function` is a parser. If it refuses the code for an await
      // outside an async function it says so, and that is the exact answer to
      // the exact question. Anything else it refuses is a real syntax error
      // and is thrown on rather than worked around.
      // AND THE MESSAGE IS NOT READ EITHER. The first version of this caught
      // the SyntaxError and looked for the word "await" in it, which is a
      // second guess about a second engine's prose: JavaScriptCore reports
      // `await Promise.resolve(...)` outside an async function as "Unexpected
      // identifier 'Promise'", because to a script parser `await` is just a
      // name. Compile it the other way instead and see.
      let factory = null;
      try {
        factory = new Function('module', 'exports', '__req', code);
      } catch (err) {
        if (!(err instanceof SyntaxError)) {
          throw new Error(name + ' will not compile: ' + err.message);
        }
      }
      if (!factory) {
        let async_;
        try {
          async_ = new Function('module', 'exports', '__req',
            'return (async () => {' + code + '})();');
        } catch (err) {
          // It did not compile either way, so it is a real syntax error and
          // the async attempt is the one whose message is about the code.
          throw new Error(name + ' will not compile: ' + err.message);
        }
        pending.set(name, async_);
        return module.exports;
      }
      // NO `require` PARAMETER. Every import in these files is rewritten to
      // `__req`, so the name was never used -- and `host-node.mjs` declares a
      // `const require` of its own, which against a parameter of the same name
      // is "Cannot declare a const variable twice" and stops the whole load.
      factory(module, module.exports, req);
      // `exports` is what the getters were defined on, so a module that also
      // assigned module.exports outright would be lost -- none do, and this
      // says so rather than silently preferring one.
      if (module.exports !== cache.get(name)) {
        throw new Error(name + ' replaced module.exports, which this loader '
          + 'does not carry: it hands out the exports object it cached first');
      }
      return module.exports;
    }
    // ---- THE ENTRY, WHICH IS ALLOWED TO AWAIT ----
    //
    // Everything the entry needs is loaded synchronously first, exactly as
    // `require` would; only the entry's own body runs inside a promise. The
    // caller gets that promise and waits on it, which is what a host does once
    // at startup and never again.
    async function loadAsync(spec) {
      const name = String(spec).replace(/^\.\//, '');
      const exports = req(name);
      const run = pending.get(name);
      if (!run) return exports;
      pending.delete(name);
      await run({ exports }, exports, req);
      delete exports.__awaits;
      return exports;
    }

    req.loadAsync = loadAsync;
    return req;
  }

  globalThis.__intervalEsm = { makeLoader, rewrite };
})();
