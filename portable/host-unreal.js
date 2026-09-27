// THE MACHINE UNDER THE BRIDGE, WHEN THE MACHINE IS UNREAL.
//
// `host-node.mjs` is this same list for a desktop: a setting, a file's text, a
// file written, the citizen's key, the rules, a socket out, a door in, a clock.
// Every one of those is something `unreal-bridge.mjs` asks of the platform and
// nothing it knows about the world, which is the whole reason the seam is
// there. This is the other side of it.
//
// WHY THERE HAS TO BE ANOTHER SIDE. On iOS there can be no Node process beside
// the app: the platform will neither ship one nor let an app start an
// interpreter. So the bridge has to run inside the app, in the JavaScript
// engine the phone already has, which is JavaScriptCore -- and macOS ships the
// same engine, so all of this is written and proven on a laptop against a
// window that already works. See portable/README.md.
//
// IT IS A SCRIPT AND NOT A MODULE, for the same reason `start.js` is: the C
// interface JavaScriptCore exposes evaluates scripts, and there is no module
// loader to hand an `import` to. It expects `shim.js`, `esm.js` and `start.js`
// to have been evaluated before it, and it takes everything it cannot do from
// natives the host installed:
//
//   readFile   __write   __dial   __toWindow   (and the clock below)
//
(function () {
  'use strict';

  // ---- THE CLOCK, WHICH JAVASCRIPTCORE DOES NOT HAVE ----
  //
  // There is no `setTimeout` in the engine itself: timers belong to whatever
  // is pumping the event loop, and in a browser that is the browser and in
  // Node it is libuv. Here it is the game thread, which is already running
  // sixty times a second and needs no help.
  //
  // So the table is kept here and Unreal calls `run` once a frame. The world
  // ticks once a second and the longest wait in the bridge is that tick, so a
  // frame's worth of granularity is two orders of magnitude finer than
  // anything that reads it.
  const timers = new Map();
  let nextTimer = 1;
  const clock = {
    every (ms, fn) {
      const id = nextTimer++;
      timers.set(id, { fn, ms: Math.max(1, ms | 0), due: Date.now() + ms, repeat: true });
      return id;
    },
    after (ms, fn) {
      const id = nextTimer++;
      timers.set(id, { fn, ms: Math.max(1, ms | 0), due: Date.now() + ms, repeat: false });
      return id;
    },
    stop (id) { timers.delete(id); },
    // WHAT IS DUE, ONCE EACH, AND NEVER TWICE IN ONE FRAME.
    //
    // A repeating timer whose handler takes longer than its interval would
    // otherwise be run again immediately, and again, for as long as it is
    // behind -- which for the world's tick means a bridge that spends every
    // frame catching up with a second that has already gone. The next due
    // time is counted from now rather than from the last one, so a slow frame
    // costs a beat instead of a debt.
    run () {
      // THE WINDOW FIRST, THEN THE WORLD. What it has to say is mostly what it
      // has already seen, and the bridge sends no new frame until it knows
      // that -- so taking the window's word before turning the clock is the
      // difference between a frame a second and a frame every other second.
      let fired = deliver();
      const now = Date.now();
      for (const [id, t] of [...timers]) {
        if (t.due > now) continue;
        if (t.repeat) { t.due = now + t.ms; } else { timers.delete(id); }
        fired++;
        try { t.fn(); } catch (e) {
          print('a timer threw: ' + ((e && e.message) || e));
        }
      }
      return fired;
    },
    count () { return timers.size; },
  };
  globalThis.__intervalClock = clock;

  // ---- THE DOOR, WHICH IN THIS PROCESS IS NOT A DOOR ----
  //
  // On a desktop the window is a separate program and knocks on a loopback
  // socket. Here the window and the bridge are the same process, and there is
  // nothing to listen on and nothing to serialise for a wire -- so what the
  // bridge is handed is an object wearing a socket's shape whose `send` puts
  // the text straight into Unreal.
  //
  // IT IS STILL A STRING. The frame could have been handed across as an
  // object and it is not, because the window parses JSON on the other side
  // either way and a bridge that hands one shape to a desktop and another to
  // a phone is two bridges. The cost is a parse the desktop was already
  // paying; the gain is that there is one code path and it is the proven one.
  let theWindow = null;
  let pendingClient = null;
  globalThis.__intervalHostReady = false;

  // ---- WHO SAID WHAT, COUNTED ----
  //
  // With a socket in the middle there is a port to watch and a process on
  // either end of it. With the bridge inside the window there is neither, and
  // "the window is not drawing" has at least three causes that look identical
  // from a log: the window is not asking, the bridge is not answering, or the
  // answer is not arriving. Two counters tell those apart in one line, and
  // they cost a `k` out of a string that was already there.
  const heard = {};
  const said = {};

  // WHAT THE WINDOW HAS SAID AND THE BRIDGE HAS NOT YET HEARD. See
  // `__fromWindow` below for why there is a queue here at all.
  const waiting = [];
  const deliver = () => {
    if (!theWindow || waiting.length === 0) return 0;
    // A SNAPSHOT, NOT A DRAIN. Answering one of these makes the window ask
    // the next thing -- a region of ground arrives, the chunk beside it is
    // wanted -- and a `while (waiting.length)` would therefore keep going for
    // as long as the citizen keeps walking. Whatever arrives during this turn
    // is next turn's work.
    const batch = waiting.splice(0, waiting.length);
    for (const text of batch) {
      for (const fn of (theWindow.handlers.message || [])) {
        try { fn(text); } catch (e) {
          print('the window said something the bridge could not take: '
            + ((e && e.stack) || (e && e.message) || e));
        }
      }
    }
    return batch.length;
  };
  const tally = (into, text) => {
    const at = text.indexOf('"k":"');
    const kind = at < 0 ? '?'
      : text.slice(at + 5, text.indexOf('"', at + 5));
    into[kind] = (into[kind] || 0) + 1;
  };
  globalThis.__intervalTraffic = () =>
    'the window said ' + JSON.stringify(heard)
    + ' and the bridge said ' + JSON.stringify(said);

  const host = {
    name: 'unreal',

    // THE RULES. `start.js` has already read `engine.js` as text and compiled
    // it with `new Function`, byte for byte as it is on disk, because the SHA
    // of those bytes is what a founding records about which rules made it.
    engine () { return globalThis.__intervalEngine; },

    // A SETTING. On a desktop a command-line flag; here whatever Unreal
    // decided -- the node the player chose, the key file to keep.
    option (name, dflt) {
      const o = globalThis.__intervalOptions || {};
      return (o[name] !== undefined && o[name] !== null && o[name] !== '')
        ? o[name] : dflt;
    },

    // THE SOURCE OF THE RULES, as text. The bridge reads `engine.js`'s own
    // source to find two tables it does not export.
    source (name) { return readFile(name); },

    // THE CITIZEN, which is the one piece of state that must survive the app
    // being closed and must never leave the machine.
    readKey (where) {
      try {
        const text = readFile(where);
        return text ? JSON.parse(text) : null;
      } catch (e) {
        // A MISSING FILE IS NOT AN ERROR HERE. `readFile` throws when there is
        // nothing there, and the first launch of a client is exactly that: no
        // key yet, so mint one. Anything else -- a file that is there and will
        // not parse -- must NOT be swallowed, because minting over a citizen
        // that exists is losing a person.
        const why = String((e && e.message) || e);
        if (why.indexOf('no such source') >= 0) return null;
        throw e;
      }
    },
    writeKey (where, record) {
      if (!__write(where, JSON.stringify(record, null, 2))) {
        throw new Error('could not write the citizen to ' + where);
      }
    },

    // A SOCKET OUT, to a node: Unreal's WebSockets module wearing the `ws`
    // package's shape. See FIntervalScript::InstallSockets.
    dial (url) { return globalThis.__dial(url); },

    // AND THE DOOR IN.
    //
    // THE WINDOW IS LET IN LAST, AND THAT IS THE WHOLE SUBTLETY HERE. On a
    // desktop the bridge opens this door as it finishes loading and then goes
    // on to ask a node for the founding; the window is a separate program that
    // takes seconds to get as far as connecting, so by the time it knocks the
    // tables it is greeted with are filled in. In one process there is no such
    // gap: the door opens and the client is already standing in it, so the
    // `hello` went out ninety-one characters long -- the citizen's name and
    // nothing else, no weapons, no prices, no spell books, no settlements.
    //
    // A window greeted like that draws an island it has no words for. So the
    // client is BUILT here and handed over only when the bridge's own loading
    // has finished, which is the moment the desktop's window would have been
    // knocking anyway.
    door (port, onClient) {
      theWindow = {
        // ALWAYS OPEN, AND NOTHING EVER BUFFERED. `readyState` and
        // `bufferedAmount` are read by the bridge's stop-and-wait, which asks
        // whether the window is behind before it sends a frame. A socket
        // answers that with what it has written and the reader has not taken;
        // in one process there is no such thing, so the only measure left is
        // the one the window reports itself -- `{ k: 'seen' }` -- and that is
        // the measure the bridge prefers anyway.
        readyState: 1,
        bufferedAmount: 0,
        handlers: {},
        on (what, fn) { (this.handlers[what] ||= []).push(fn); return this; },
        send (text) {
          const t = String(text);
          tally(said, t);
          __toWindow(t);
        },
        close () { this.readyState = 3; },
      };
      // WHAT THE WINDOW SAYS, HANDED THE OTHER WAY. Unreal calls this with
      // each of its requests -- a region of terrain, a tick it has seen, a
      // deed, a line of chat -- exactly as the loopback socket delivered them.
      //
      // AND IT IS QUEUED, NOT DELIVERED. This is the one place where a socket
      // was doing something for the bridge that nothing else does, and taking
      // it away broke the window in a way no error could show.
      //
      // The bridge's door callback runs in this order: add the client, hook
      // `close`, send `hello`, push a frame, hook `message`. With a socket
      // that is fine, because a reply to the `hello` cannot possibly arrive
      // before the callback has returned -- the bytes have not even left the
      // process. In ONE process it arrives during the `send`: the window is
      // told hello, asks for its first regions of ground immediately, and
      // those requests land HERE, three lines before `ws.on('message')` has
      // been reached. The handler list was empty, so the window asked for a
      // hundred and twelve regions of ground, was answered none of them, and
      // nothing threw. It drew the inside of the sky.
      //
      // So nothing from the window is ever delivered inside a call the bridge
      // is already in. It is queued and handed over on the next turn of the
      // clock, which is what a socket does and is a frame of latency on a
      // world that ticks once a second.
      globalThis.__fromWindow = (text) => {
        if (!theWindow) return false;
        tally(heard, String(text));
        waiting.push(String(text));
        return true;
      };
      pendingClient = onClient;
      return { close () { theWindow = null; } };
    },

    every (ms, fn) { return clock.every(ms, fn); },
    after (ms, fn) { return clock.after(ms, fn); },
    stop (t) { clock.stop(t); },
  };

  globalThis.__intervalHost = host;

  // ---- AND THE BRIDGE ITSELF, ON TOP OF IT ----
  //
  // Loaded through the same portable loader `start.js` used for the landscape,
  // which is why `unreal-bridge.mjs` does not have to be transformed either:
  // it is the file the desktop runs, read off the disk and hoisted as it is.
  //
  // SEPARATE FROM INSTALLING THE HOST, deliberately. Loading the bridge asks a
  // node five questions and builds the whole island, which takes as long as it
  // takes; installing the host takes no time at all. Unreal wants to do the
  // first of those when it is ready to and not as a side effect of the second.
  // AND IT IS LOADED THE ASYNCHRONOUS WAY, which is not optional.
  //
  // `unreal-bridge.mjs` ends with `await announceWorld()` and `await
  // refreshDoor()`: it asks a node for the founding and builds the island from
  // it, and both of those are fetches. A module that awaits at its top level
  // cannot be compiled as an ordinary function at all -- `await` outside an
  // async function is a syntax error -- so the loader compiles it as an async
  // body and hands it back through `loadAsync` instead.
  //
  // THIS WAS THE BUG. Loaded with the plain `__req`, the bridge compiled, was
  // cached, and its body never ran: no citizen, no node, no frames, and not
  // one word in the log to say so, because nothing had thrown. A module whose
  // body has not run looks exactly like a module with no exports.
  globalThis.__intervalBridgeState = 'not asked';
  globalThis.__intervalOpenBridge = () => {
    if (globalThis.__intervalBridgeState !== 'not asked') {
      return globalThis.__intervalBridgeState;
    }
    globalThis.__intervalBridgeState = 'loading';
    globalThis.__intervalReq.loadAsync('./unreal-bridge.mjs').then((mod) => {
      globalThis.__intervalBridge = mod;
      globalThis.__intervalBridgeState = 'open';
      print('[bridge] the bridge is up, with no Node anywhere near it');
      // AND NOW THE WINDOW MAY COME IN, with a `hello` that has the world's
      // own tables in it. See `door` above for why this waits.
      if (pendingClient && theWindow) {
        const let_in = pendingClient;
        pendingClient = null;
        globalThis.__intervalHostReady = true;
        let_in(theWindow);
      }
    }, (e) => {
      globalThis.__intervalBridgeState = 'failed: ' + ((e && e.message) || e);
      print('[bridge] the bridge would not start: '
        + ((e && e.stack) || (e && e.message) || e));
    });
    return globalThis.__intervalBridgeState;
  };
})();
