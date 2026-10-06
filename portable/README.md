# Running the world's rules where there is no Node

The window's architecture is one sentence: **the bridge holds the key and all
world knowledge; Unreal holds only pixels.** On a desktop the bridge is a Node
process beside the game. On iOS there can be no such process: the platform
will neither ship Node nor let an app start an interpreter, so the bridge has
to run *inside* the app, in the JavaScript engine iOS already has.

That is JavaScriptCore, and macOS ships the same engine with a shell, so the
whole question can be answered on a laptop with no device, no certificate and
no toolchain. `Tools/jsc.sh` runs a script against it.

## What is proven

Run `Tools/jsc.sh portable/agree.mjs`, `portable/sign.mjs`, `portable/land.mjs`
and `portable/world.mjs`. `node portable/land-node.mjs` prints the numbers to
match.

| | |
|---|---|
| `engine.js` loads and runs under JavaScriptCore | 164 exports, no Node |
| the engine hash is identical | `d63bce4c…` under both JSC and Node |
| the same founding builds the same world | same world id, same tick, same citizen, same position, same nodes |
| a key minted in JSC signs a deed a node accepts | `verifyInputSig` → true |
| **the whole landscape computes identically** | see below |
| the terrain mirror, the view and the sky all answer | `tileHash(460,264,97)` → 724393517 both ways |
| **the whole bridge runs, and answers a window** | see below |

The signature and the landscape are the two that matter. A citizen whose
signature a node will not take is not a citizen; and a phone that draws a
different island is not looking at this world.

### The landscape, which is the hard half

`expanse7`'s real founding: the six public values any node will hand over,
built on a phone's engine and on a node, and every derived thing compared:

```
                        JavaScriptCore      Node
ground over 12900 tiles   1d9bdd30          1d9bdd30
settlements               15, first Anchor  15, first Anchor
settlements hash          e2632e97          e2632e97
road tiles                5183              5183
road hash                 f73d4cd0          f73d4cd0
```

The road hash is the one to look at. Where a road runs is the most derived
thing this generator produces: a cost field over the whole island, routed,
smoothed, and laid, and it comes out tile for tile the same.

**`engine.js` is never transpiled.** The host hands its source across as text
and it is compiled by `new Function`, byte for byte as it is on disk. That is
not fastidiousness: the SHA of those bytes *is* what a founding records about
which rules made it.

## What the host has to provide

Six things, and the list is closed, see `shim.js`, which says why for each.

- `require`, for two modules, and it must **fail** for `'crypto'` so the
  engine takes its own portable path. It is written to; that is not a hack.
- `Buffer`, as much of one as the engine and the landscape use: hex and utf8 in
  and out, `readUInt32BE`, `readUInt16BE`, `readUInt8`, `writeUInt32BE`,
  `slice`, `equals`, `concat`.
- `process`, whose `env` is only ever read with a default behind it.
- `crypto.getRandomValues`, for minting a key and nothing else. On iOS that is
  `SecRandomCopyBytes`. There is no fallback and it throws without one: a key
  from a weak source is a citizen anybody can become.
- `console`, which the rules never use and the generator does, it counts the
  scenes it laid and the residents who had nowhere to stand. A host that wants
  those lines is given them; one that does not gets a console that swallows
  them, because whether anybody is listening must not change the island.
- a way to read a file's text, which is the only thing `boot.mjs` asks for by
  name. Under `jsc` that is `readFile`; on a phone it is a string out of the
  app bundle, where there is no filesystem and no working directory.

**Two things the host must also get right, both found the hard way.**

`sha256` must accept a string. `engine.js` hashes through Node's crypto when
there is one and through noble when there is not, and the two branches were not
given the same argument: Node's wraps its input in `Buffer.from(buf)` first and
noble's does not. Nothing noticed while the portable path was only ever a
browser, because a browser never runs the landscape, and the generator hashes
strings constantly, because naming a town's keeper is a hash of their town and
their trade. `boot.mjs` encodes it, which is a host adapting its libraries to
the engine rather than the other way round.

`readUInt16BE` is not optional. The engine reads four bytes out of a digest
seven times; the **landscape** reads two bytes out of one a hundred and
thirty-three times: every wander of a river, every bend of a road, every
jitter of a tree. A shim written against the engine alone will build a world
and refuse to build an island.

## How the landscape is loaded, and why not with a bundler

The world layer is twenty-four ES modules, and eight of them do
`import E from './engine.js'`: a *default* import of a CommonJS file. Node
synthesises that default; a plain ES loader does not, and it fails at LINK
time, before a line of anybody's code runs, so no runtime fallback rescues it.

The obvious answer is esbuild, and it was the plan for an evening. It is the
wrong one here. `build-window.mjs` says out loud that the browser client has
"no bundler and no external asset", and the argument for a downloadable client
at all is that a person can read what they are running. A dependency that
rewrites every line of the world's landscape before it reaches a phone is
exactly the thing this project keeps refusing.

So `esm.js` is a module loader, in the open, in about two hundred lines. It is
**not general**: it handles the syntax these twenty-four files actually use and
throws by name on anything else rather than guessing. The vocabulary was
counted before it was written: every import and export line in all
twenty-four, and it is small:

    import * as ns from './x.mjs'        import D from './engine.js'
    import { a, b as c } from './x.mjs'  (over several lines, with comments)
    export function f    export const X    export { a, b as c }
    export { a, b as c } from './x.mjs'

There is no `export default`, no `export class`, no `export let`, no
`export *`, and no cycle anywhere in the graph, all five checked, because a
cycle is the one thing a require-shaped loader gets wrong that a real one does
not. Exports are **getters**, so a binding stays live; imports are **hoisted**,
because these files put imports in the middle of themselves and a real loader
evaluates them all first.

Two of the four cases were missed by the first survey and threw on the first
run: a re-export in `worldgen-shire-v6.mjs`, and comments inside
`terrain-mirror.mjs`'s export list. That is the argument for failing loudly on
unknown syntax instead of skipping a line nobody recognised: a loader that
shrugged would have produced an island quietly missing a table.

Everything in the world layer goes through **one** loader and so out of one
cache. Loading a module a second way gives a second copy of everything
underneath it, and two copies of a landscape that memoises its own tables are
two islands that agree only until one of them is asked something first.
`loadModule` refuses to start a second cache.

### The bridge itself, in the engine a phone would give it

`bridge.mjs` loads `unreal-bridge.mjs` -- all nineteen hundred lines of it --
under JavaScriptCore with no Node anywhere, and then asks it the first question
a window ever asks: give me the ground for this rectangle.

```
                                    JavaScriptCore        Node
[bridge] citizen                    192448c950c2…         0bf832f33529…
[bridge] world                      ec83a95a86c8… 896x512 interval-expanse-v7
the bridge sent                     1 chunk, 786 bytes    1 chunk, 786 bytes
ground hash                         45e80c5c              45e80c5c
hello bytes                         204512                204512
```

`bridge-node.mjs` runs the identical stack under Node -- the same loader, the
same shim, the same recorded replies, the same rectangle -- so what is compared
is the ENGINE and nothing else. The citizens differ because Node has a real
`crypto.getRandomValues` and the shim rightly leaves it alone, while the `jsc`
run is given deterministic entropy; the ISLAND does not depend on who is
looking at it, and comes out byte for byte the same.

WHAT IS STOOD IN FOR **in that proof**, and it is two things: `fetch` answers
out of a file of replies recorded from a real node, and `dial` returns a socket
that records what it was asked to send and never opens. **`fetch` is no longer
a stand-in inside Unreal** -- see `FIntervalScript::InstallFetch`, which is the
engine's own HTTP module with the promise built in JavaScript, and
`interval.js.world`, which asks interval.place about the world and gets an
answer in three frames. **And `dial` is no longer a stand-in either** -- see
`FIntervalScript::InstallSockets` and `interval.js.dial`, which mints a citizen,
is adopted by interval.place, and reads the island the node sends back as world
`ec83a95a86c84d90…`. Both are Unreal's own modules now, and the host layer is
complete.

## And the whole window now runs on it

`-intervalbridge=inproc` and there is no Node process at all: `unreal-bridge.mjs`
loads inside the editor and the window draws from it. `globalThis.__intervalTraffic()`
counts the door in both directions.

```
the window said {"enter":3,"terrain":112,"seen":37}
the bridge said {"hello":1,"terrain":112,"frame":37,"refused":2}
```

Two things the socket had been doing for the bridge, which only showed when it
was taken away. **The door cannot open before the bridge has anything to say**:
the bridge greets a window as the door opens and fills its tables afterwards, so
in one process the `hello` went out ninety-one characters long. And **nothing
the window says may be delivered inside a call the bridge is already in**: the
door callback hooks `message` AFTER it has sent that hello, so the window's first
hundred and twelve requests for ground landed on an empty handler list and were
answered with nothing, with no error anywhere. The host queues them and delivers
on the next turn of the clock, which is what a socket does. JavaScriptCore has no networking at all, so on iOS both are
Unreal's -- its HTTP module and its WebSockets module. Everything above them is
real: the key minting, the world's own tables, the terrain planes.

FIVE THINGS THE LOADER HAD TO LEARN, each found by running it:

  * an **async factory**, because the entry ends with `await announceWorld()`
    and `new Function` compiles an ordinary function. One module in
    twenty-five does this; the other twenty-four stay synchronous.
  * **which module that is, asked of the parser** rather than of a regular
    expression. The first cut matched the word `await` inside a comment in
    `terrain-mirror.mjs` and declared the whole terrain mirror an entry, so its
    body never ran and all eighteen of its exports came back undefined.
  * **`import.meta.url`**, which is syntax and not a value: it becomes the
    module's own name as a URL, which is what it means.
  * **a dynamic `import()`**, which JavaScriptCore will not take in a script.
    The bridge uses one to load the ridge predicate softly; it becomes a
    require wrapped in a resolved promise, same value, same `catch`.
  * **an absent module that links and refuses to run.** `unreal-bridge.mjs`
    imports `nodeHost` from a file that imports `fs` and `ws`; on a phone that
    function is never called but the file is still linked. An unknown module
    now comes back as something whose every property is a function that throws
    with a true message: this host has no `fs`.

And two things the shim had to learn: **base64**, which is how the four terrain
planes travel and which stopped the bridge on the first question a window asked
it; and to **leave an existing `crypto` alone**, because Node's global is a
read-only accessor and assigning over it threw before anything else installed.

## The seam in the bridge itself

`unreal-bridge.mjs` is nineteen hundred lines and almost none of it is about
Node. Everything it knew about the machine underneath is now one object with
six entries: `host-node.mjs`:

| | |
|---|---|
| `option(name, dflt)` | a flag on a desktop; a saved setting in an app |
| `source(name)` | a file's text: the bridge reads engine.js's own source for two tables it does not export |
| `readKey` / `writeKey` | the citizen. A file here; the keychain on a phone |
| `dial(url)` | a socket out to a node. Unreal has its own WebSockets module |
| `door(port, onClient)` | a socket in, which **only a desktop has**: there the window is a separate program. In an app the window and the bridge are one process and there is nothing to listen on, so an iOS host returns null |
| `every` / `after` / `stop` | a clock |
| `engine()` | the rules themselves. On a desktop a CommonJS require; in an app the source out of the bundle, compiled as it is, because the SHA of those bytes is what a founding records |

Everything else in that file: what a tile is made of, what a verb needs, which
deeds a citizen may be offered, where the land lies, is world knowledge and is
about nothing but the world. `globalThis.__intervalHost`, set before the file
loads, replaces the lot.

**Counted, not claimed.** `grep -cE '\bfs\.|process\.argv|createRequire|new
WebSocket|WebSocketServer|setInterval|setTimeout' unreal-bridge.mjs` returns
two, and both are inside a comment explaining what used to be there. The file
makes no Node call at all.

Verified by running it: the desktop bridge restarted on the seam, minted
nothing, reached interval.place, adopted its citizen, opened Nought, and the
window walked a citizen across the Heartlands with deeds signed as before.

## What is left

1. ~~bundle the ESM world layer~~: done, and with no bundler: `esm.js`
2. ~~the host interface~~: done: `host-node.mjs`, seven entries, and the
   bridge makes no Node call at all
3. ~~run the bridge itself~~: done: it mints a citizen, reads the world,
   opens its door and answers a window's request for ground with the same
   bytes a node sends

**The JavaScript side of this port is finished.** What is left is C++ and a
certificate.
4. an Unreal module that hosts JavaScriptCore and speaks to
   `UIntervalBridgeSubsystem` where the local socket is today. It should be
   written and tested on **macOS first**, where the same JavaScriptCore is a
   system framework and there is a working window to point it at; iOS then
   becomes a packaging detail rather than a debugging session on a phone. It
   supplies the two stand-ins above for real: `fetch` over Unreal's HTTP
   module and `dial` over its WebSockets module.
5. touch: tap for the default deed, long press for the menu, the interaction
   model already implies it
6. iOS packaging, and a device to run it on
