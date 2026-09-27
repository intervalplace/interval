// A HOST FOR A JAVASCRIPT ENGINE THAT IS NOT NODE, standing in for an app.
//
// `unreal-bridge.mjs` reaches the machine underneath it through one object --
// see host-node.mjs for what the seven entries are and why. This is the same
// object built for JavaScriptCore, which is the engine iOS gives an app, so
// that the bridge itself can be RUN there and not merely reasoned about.
//
// WHAT IS REAL HERE AND WHAT IS A STAND-IN. The engine, the key, the settings,
// the clock and the source text are real and are exactly what an app would do.
// The two things that reach the network are not: `fetch` answers out of a file
// of recorded replies, and `dial` returns a socket that records what it was
// asked to send and never opens. JavaScriptCore has no networking at all, so
// on a phone both of those are Unreal's -- its HTTP module and its WebSockets
// module -- and both are a few lines of C++ wrapping. What this proves is
// everything ABOVE them: that the file loads, that it builds its tables from
// the world's own hello, and that it gets as far as dialling a node.
export function jscHost(loadEngine, readSource, canned) {
  const replies = JSON.parse(canned);
  const settings = { pillar: 'https://interval.place', port: '7777',
                     key: './portable-key.json' };
  let minted = null;

  // A FETCH, WHICH IS A GLOBAL AND NOT A HOST ENTRY. The bridge calls it by
  // name like any browser would, so a host installs it rather than being
  // asked for it. On iOS it is Unreal's HTTP module; here it is a file.
  globalThis.fetch = async (url) => {
    const at = String(url).indexOf('/api/');
    const path = at < 0 ? String(url) : String(url).slice(at);
    if (!(path in replies)) {
      return { ok: false, status: 404, json: async () => ({}) };
    }
    return { ok: true, status: 200, json: async () => replies[path] };
  };

  const socket = () => {
    const sent = [];
    const on = {};
    return {
      sent,
      readyState: 0,
      on (what, fn) { (on[what] ??= []).push(fn); return this; },
      send (msg) { sent.push(String(msg).slice(0, 80)); },
      close () {},
    };
  };

  return {
    name: 'javascriptcore',
    engine: loadEngine,
    option (name, dflt) { return settings[name] ?? dflt; },
    source (name) { return readSource(name); },
    // THE CITIZEN. A file here; on a phone the keychain, which is the same
    // promise with better locks. Held in memory for this proof so that running
    // it twice mints twice and neither run leaves anything behind.
    readKey () { return minted; },
    writeKey (where, record) { minted = record; },
    dial () { return socket(); },
    // AN APP HAS NO DOOR. On a desktop the window is a separate program and
    // knocks on a loopback socket; in an app the window and the bridge are one
    // process and the frames are handed straight across -- which is what the
    // captured handler stands for. Keeping it is what lets this proof ASK the
    // bridge something, rather than only watching it start.
    door (port, onClient) { this.knock = onClient; return null; },
    every (ms, fn) { return null; },   // nothing ticks inside a one-shot proof
    after (ms, fn) { return null; },
    stop () {},
  };
}
