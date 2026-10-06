# The Unreal window · plan

*A fifth vessel for the same soul. Same key as /play, /deluxe, /photo and
/writ; same island, same interval, same refusals.*

Three files, same paths as the repo root:

```
unreal-bridge.mjs        the half that knows things (layer 2.5)
check-window-unreal.mjs  proof that the other half does not
UNREAL-WINDOW.md         this
```

Plus a UE 5.5+ project, `UnrealWindow/`, which is built conversationally
through the Unreal MCP plugin and is deliberately the dumbest thing in the
repository.

## State of play

| session | what | where |
|---|---|---|
| 0 · the socket | **written** | `UnrealWindow/Plugins/IntervalBridge/` |
| 1 · the ground | **written**, minus the material | `IntervalChunk`, `IntervalGround`, `SESSION-1.md` |
| 2 · the hour | not started | |
| 3 · wear | not started | |
| 4 · scatter | not started | |
| 5 · citizens | not started | |
| 6 · the hand | not started | |
| 7 · the door | not started | |

The bridge is tested end to end against a stub pillar: its canonical bytes
and signature pass `engine.js` `verifyInputSig`. The C++ has not been
compiled: there is no editor here, so expect first-build friction on
engine-version-sensitive calls (`TryGetObjectField` overloads,
`GetPlatformData`).

---

## 1. Why the work splits where it splits

`terrain-mirror.mjs` opens by explaining that the geography used to exist
three times, that two copies had already drifted, and that a drifting copy
is *a window in breach of the constitution*, because two citizens whose
windows disagree about where the Fens end cannot arrange to meet there.
`check-window-*.mjs` exists to catch the same failure in the tables.

An Unreal project is the largest hand copy anyone could possibly add here.
So it gets no copy at all:

| | knows | does not know |
|---|---|---|
| **unreal-bridge.mjs** | the key, the mirror, `normalizeInput`, `/api/tables`, the delta protocol | nothing about pixels |
| **UnrealWindow/** | meshes, materials, lighting, cameras, interpolation | prices, reaches, recipes, callings, terrain names, ed25519 |

Every table Unreal uses arrives at runtime. Every tile comes from the one
mirror. Every signature is made in `unreal-bridge.mjs` by `engine.js`
itself. The editor project cannot hold a stale opinion because it is not
permitted to hold an opinion.

`check-window-unreal.mjs` enforces exactly that: it greps the whole
`.uproject` for any engine noun, any terrain string, any `enum class
E*Terrain`, and any attempt to sign. The Unreal window passes conformance
by construction, which is the only reason a renderer this large is safe to
add to a project whose windows are audited line by line.

**Verified before writing any of this down:** the bridge's canonical bytes
and Ed25519 signature pass `engine.js` `verifyInputSig`, end to end,
through the same `adopt` / `raw` path `window-photo.html` uses.

---

## 2. Running it

```bash
node unreal-bridge.mjs --pillar https://interval.place --port 7777
```

Mints `./unreal-key.json` on first run, **that file is the citizen**. To
play an existing soul, drop in the same identity JSON any other window
exports from its door.

The bridge speaks WebSocket on `127.0.0.1:7777`, localhost only. Unreal
never talks to the pillar directly, in the editor or in a packaged build.

### The local protocol

Bridge → editor:

```jsonc
{ "k":"hello", "playerId":"…", "worldId":"…", "genesis":{…},
  "tables":{…},           // everything /api/tables serves, verbatim
  "settlements":[…],      // as the founder SEATED them, not as anyone derived them
  "roads":{…}, "tickMs":1000,
  "tiles":["meadow","trail","cobble",…] }   // index = the code in every chunk

{ "k":"frame", "tick":91234, "me":{…}, "players":{…}, "mobs":{…},
  "nodes":{…}, "ground":{…}, "weather":… }   // one per interval, view-scoped

{ "k":"terrain", "x0":96,"y0":48,"w":64,"h":64,
  "tiles":"<base64 u8>",   // index into `tiles`, 255 = a terrain this bridge is too old to name
  "road":"<base64 u8>",    // onRoadE, for wear, ruts, verge and lamp placement
  "hash":"<base64 u8>" }   // tileHash(x,y,97): the scatter seed

{ "k":"tiles",  "tiles":[…] }   // the list grew: a new terrain exists, re-warm materials
{ "k":"chat",   "playerId":"…","name":"…","text":"…" }
{ "k":"refused","of":"walk","tick":91234,"why":"…" }
```

Editor → bridge:

```jsonc
{ "k":"terrain", "x0":96,"y0":48,"w":64,"h":64 }   // pure function; cached both ends
{ "k":"do", "type":"walk", "dx":1, "dy":0, "steps":8 }   // any engine input type
{ "k":"resync" }
```

`k:"do"` carries a bare intent. The bridge stamps `worldId`, `tick` and
`playerId`, runs `normalizeInput`, signs, and relays. Unreal supplies a
verb and integers and nothing else: it cannot even choose the tick, which
is what stops a smooth 60 fps renderer from ever acting on an interval that
has already passed.

### The scatter plane, and why it is in the protocol

A fern is not consensus, so nothing in the constitution cares where it
grows. But *"meet me by the crooked oak"* is a sentence people say, and a
window that rolled its own dice for decoration makes it a lie. `hash` is
`tileHash`: the generator's own pure function, so every Unreal window
grows the same oak on the same tile forever, and two citizens can arrange
to meet at something the pillar has never heard of.

---

## 3. Build order, for the MCP session

Enable the `ModelContextProtocol` and `AllToolsets` plugins, run
`ModelContextProtocol.StartServer` in the UE console, point Claude Code at
it, and work down this list. One session per heading; screenshot at the end
of each, from the same three vantage points (§4).

**0 · The socket.** A C++ module `IntervalBridge`: `FWebSocketsModule`
client to `ws://127.0.0.1:7777`, and a `UIntervalSubsystem`
(`UGameInstanceSubsystem`) that holds the latest two frames and broadcasts
`OnFrame`, `OnTerrainChunk`, `OnRefused` to Blueprint. Everything else is
Blueprint and data. *Have MCP look up `FWebSocketsModule` before it writes
a line of this.*

**1 · The ground.** *Written.* `AIntervalChunk` builds one procedural mesh
per 64×64 tiles plus a control texture: one texel per tile, R terrain
code, G made way, B scatter seed, and a dynamic material instance reads
it. `AIntervalGround` follows `me` and keeps a square of chunks around
them. Relief is cosmetic, derived from the seed plane, and therefore
identical in every window. What is left is the material itself: see
`UnrealWindow/SESSION-1.md` for the prompts. It will look like a boardgame
at the end of this session and that is correct.

**2 · The hour.** Commit to the light before adding a single prop. Sky
Atmosphere, Volumetric Clouds, one Directional Light at roughly 8° with a
warm tint, Lumen GI + Reflections, Virtual Shadow Maps, and a post-process
volume with a filmic tonemap you do not touch again. `/photo` already made
this choice for the project: golden hour, and matching it is not
imitation, it is the world having a time of day.

**3 · Wear.** Roads get ruts, verge, and the settlement footprints from
`settlements` rather than anything derived. This is where the boardgame
stops looking like one: not more polygons, but evidence that people walk.

**4 · Scatter.** PCG graph keyed on `(tile code, hash)`. Density by biome.
**Decoration must never look gatherable**: the 144 nodes the pillar sends
are the only things a citizen can chop, and an Unreal window that scatters
a thousand identical beautiful trees has made the game unplayable while
making the screenshot better. Nodes get a silhouette language of their own
and the scatter stays visually subordinate.

**5 · Citizens.** One skeletal mesh, name plates, action states from
`p.action`. All motion is interpolation between two frames one second
apart, and **the interpolation is cosmetic**: it is never read back, never
rounded into an intent, never allowed to decide what tile you are on.

**6 · The hand.** Click-to-walk emits `{k:"do", type:"walk", dx, dy,
steps}`, one deed, not one tile (§5i). Show refusals in the feed the way
the flat window does; a silent refusal is indistinguishable from a dead
input handler, and that cost the WebGL windows a day.

**7 · The door.** UMG: import/export identity JSON, world id, tick,
finalized tick, peers. Same door as every other window.

Run `node check-window-unreal.mjs ./UnrealWindow` at the end of every
session. The first time it fails will be the session somebody types a
terrain name into C++ "just for now".

---

## 4. What *breathtaking* has to mean here

Not "Unreal, therefore beautiful". Three vantage points, screenshotted
every session, judged side by side with `/photo`:

1. Standing in a settlement square at ground height, looking down a road.
2. The Fens edge at range, where the biome transition is.
3. Over the shoulder of a citizen chopping, at the range you actually play.

The bar for each:

- **Legibility first.** At play range you can tell a gatherable from
  scenery, a citizen from a mob, and a road from a verge, in one glance,
  in motion. A shot that fails this is not AAA, it is a wallpaper.
- **One committed hour.** No time-of-day slider until everything else is
  done. Worlds with a slider look like tech demos.
- **Ground truth beats detail.** A correct island with honest wear reads
  better than a wrong island with Megascans on it.
- **60 fps at the target, with the world ticking once a second.** If the
  frame budget is spent, spend it on shadows and ground, never on scatter
  count.

And the rule that outranks all four: **the window never shows a citizen
something the world does not say.** Every tile from the mirror, every
entity from a frame, every refusal shown. A breathtaking window that is
wrong about where the Fens end is a window in breach: it is just in
breach at a higher resolution.
