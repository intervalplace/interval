// WHAT A BRIDGE NEEDS FROM THE MACHINE IT IS RUNNING ON, and nothing else.
//
// `unreal-bridge.mjs` is the world's knowledge: what a tile is made of, what a
// verb needs, which deeds a citizen may be offered, where the land lies. None
// of that is about Node. What IS about Node is a short, countable list -- a
// file to read, a key to keep, a socket to dial, a door to answer, a clock --
// and this is that list, on one side of a seam.
//
// THE REASON THE SEAM EXISTS is iOS. There can be no Node process beside an
// app on a phone: the platform will neither ship one nor let an app start an
// interpreter. So the bridge has to run INSIDE the app, in the JavaScript
// engine iOS already has, and everything above is exactly as portable as the
// list below is short. See portable/README.md, where the world's rules and the
// whole landscape are already proven to run there.
//
// A host that is not Node installs itself as `globalThis.__intervalHost`
// before the bridge is loaded and this file is never called, only linked --
// which is why it imports what it needs at the top like any other module and
// does its work in a function.
import fs from 'fs'
import { createRequire } from 'module'
import { WebSocketServer, WebSocket } from 'ws'

// MADE WHEN IT IS ASKED FOR, NOT WHEN THIS FILE LOADS. A host that is not Node
// installs itself before the bridge loads and never calls anything here -- but
// the file is still LINKED, and a `createRequire` called at module scope runs
// during that link and brings the whole load down on a machine that has no
// such function. Everything in this file does its work inside a function for
// exactly that reason; this was the one line that did not.
let _require = null
const nodeRequire = () => (_require ??= createRequire(import.meta.url))

export function nodeHost () {
  return {
    name: 'node',

    // THE RULES THEMSELVES. On a desktop that is a CommonJS require; in an
    // app it is the source out of the bundle, compiled as it is, because the
    // SHA of those bytes is what a founding records about which rules made
    // it. See interval-bridge/portable/boot.mjs, which does the second one.
    engine () { return nodeRequire()('./engine.js') },

    // A SETTING, which on a desktop is a command-line flag and on a phone is
    // whatever the app decided -- a saved node address, a chosen port.
    option (name, dflt) {
      const i = process.argv.indexOf('--' + name)
      return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt
    },

    // THE SOURCE OF THE RULES, as text. The bridge reads engine.js's own
    // source to find two tables it does not export -- the spell books and the
    // input schemas -- and an app has that as a string out of its bundle,
    // where there is no filesystem and no working directory.
    source (name) {
      return fs.readFileSync(new URL('./' + name, import.meta.url), 'utf8')
    },

    // THE CITIZEN, which is the one piece of state that must survive the app
    // being closed and must never leave the machine. A file here; on a phone
    // the keychain, which is the same promise with better locks.
    readKey (where) {
      if (!fs.existsSync(where)) return null
      return JSON.parse(fs.readFileSync(where, 'utf8'))
    },
    writeKey (where, record) {
      fs.writeFileSync(where, JSON.stringify(record, null, 2), { mode: 0o600 })
    },

    // A SOCKET OUT, to a node. Unreal has its own WebSockets module, which is
    // what an iOS host hands over here.
    dial (url) { return new WebSocket(url) },

    // AND A DOOR IN, which only a desktop has: there the window is a separate
    // program that connects over a loopback socket. In an app the window and
    // the bridge are the same process and there is nothing to listen on, so an
    // iOS host returns null here and hands frames straight across.
    door (port, onClient) {
      const wss = new WebSocketServer({ port, host: '127.0.0.1' })
      wss.on('connection', onClient)
      return wss
    },

    every (ms, fn) { return setInterval(fn, ms) },
    after (ms, fn) { return setTimeout(fn, ms) },
    stop (t) { clearInterval(t) },
  }
}
