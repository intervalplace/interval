# Unreal window · sessions 0 to 7

Built against the live pillar at `interval.place`, world
`ec83a95a86c8…`, `interval-expanse-v7`, 896×512, seed `solo-538`.

| session | what | state |
|---|---|---|
| 0 · the socket | `IntervalBridge` compiled and mounted on UE 5.8 | **done** |
| 1 · the ground | `M_IntervalGround`, `AIntervalGround`, whole island drawn | **done** |
| 2 · the hour | sun, sky, cloud, fog, Lumen, filmic grade, fixed exposure band | **done** |
| 3 · wear | ruts, verge, and everything the world says is standing | **done** |
| 4 · scatter | keyed on (tile code, seed), subordinate by construction | **done** |
| 5 · citizens | drawn, interpolated, named | **done** |
| 6 · the hand | click-to-walk, refusals in the feed, birth | **done** |
| 7 · the door | world, interval, finality, witnesses, birth, key path | **done** |

`node check-window-unreal.mjs "<path to interval.uproject>"` passes: the
project scans clean for engine nouns, terrain names, terrain enums and
anything that tries to sign.

---

## 1. The bridge stopped mirroring and started asking

**The mirror was drawing the wrong island, and patching it was not enough.**

First pass: `terrain-mirror.mjs` dispatches terrain on an exact generator
string and its newest branch was `GEN === 'interval-expanse-v6'`, so a **v7**
world fell past every expanse branch into `terrainOfE`, the first founding's
island. `ssE` already read `v6 || v7`, so the settlements, roads and river
were correct **on top of completely wrong ground**. That is the mistake
`IS_EXPANSE4` was added to that file to document, one founding later.
`terrain-mirror-v7.patch` fixes it and belongs upstream: every window pointed
at a v7 pillar has been drawing the v1 island.

But reaching v6's land is still not v7's land. **The v7 header's "v6's LAND is
v6's land, byte-for-byte" is not literally true of water**, and the mirror's
v6 block is behind in three ways at once:

| | mirror's v6 block | worldgen-expanse7 |
|---|---|---|
| isles | 2 (shrine, farshore) | **5**, adds whiting (`shingle`), lists (`trodden`) and dragon, which is `rx30 ry22` and the biggest thing offshore |
| river head | `SRC_YF 0.105` | **`0.06`**, v7 pulls it to the north coast so the river meets the sea and becomes an estuary, instead of beginning full-width on dry land in the Greenwood |
| inland water | none | **`worldgen-water-v7.mjs`**, 19 hand-drawn meres, tarns, moss pools and 6 becks, none of which the mirror has ever heard of |

Hand-mirroring all of that would be a **new** hand copy of the largest and
most hand-drawn part of the founding, written by someone who already knows it
is a copy. That is precisely the drift this project exists to refuse.

`terrain-mirror.mjs` exists because a **browser** cannot import
`worldgen-*.mjs`. This bridge is node, in the repo, with the generator in the
next file. It has no such excuse. So it now asks:

```js
const k = GEN.groundKindAt(GG, x, y)          // decking, floors, flag, plaza, lanes…
if (k) return k
if (GEN.isWater(GG, x, y))                     // null means water OR open country
  return GEN.inSea(GG, x, y) ? 'sea' : 'river'
return GEN.biomeAt(GG, x, y)
```

`groundKindAt` is a **surface**, not a classification of every tile: it
returns null both for water *and* for plain open country. Reading that null as
water paints 47% of the landmass as river, which is exactly what the first
attempt did. Ask the two questions in order and it is right.

Made ways now come from `/api/roads`: the tiles the founder actually laid,
rather than a re-derivation, and `TM.configure` is finally handed the real
settlement seats it was never given, so the mirror stops guessing them with
its own simplified dry-spiral. Seating is the one thing v7 exists to fix.

What the mirror is still used for, and must be: **`tileHash`**, the scatter
plane. It decides where the crooked oak grows, and a window that rolled its
own would break "meet me by the oak" for everyone else.

### What that was worth

| | mirrored (v6 branch) | asked (generator) |
|---|---|---|
| river | 2,958 | **8,209** |
| made ways | 2,449 | **5,183** |
| shoreline sand | 0 | **5,515** |
| town floors / flagstone / plaza | 0 | **3,619** |
| isles | 2 | **5** |
| terrain kinds | 12 | **22** |

`check-window-unreal.mjs` was asserting *"geography comes from
terrain-mirror.mjs"*, which is no longer the rule. It now asserts the stronger
one: terrain comes from the generator the founding names, an unbuildable
founding is refused rather than guessed at, the scatter plane is still the
shared hash, ways are told rather than derived, and the bridge computes no
coastline, river, isle or biome of its own.

**Still open for the browser windows:** the patch gets them to v6's land,
which is closer but still not v7's. They cannot import the generator, so they
need real v7 mirroring: isles, `SRC_YF`, and the whole of
`worldgen-water-v7`. Until then `/play`, `/deluxe`, `/photo` and `/writ` are
drawing an island with three isles missing and no inland water at all.

## 2. The mirror's v7 dispatch (the patch, for upstream)

`terrain-mirror.mjs` dispatches terrain on an exact generator string. Its
newest branch was `GEN === 'interval-expanse-v6'`, so a **v7** world fell
past every expanse branch into `terrainOfE`: the first founding's island.
`ssE` already read `v6 || v7`, so the settlements, the roads and the river
were all correct **on top of completely wrong ground**: rectangular bands
where v7 has lobed countries, and no coast at all.

That is the mistake `IS_EXPANSE4` was added to this very file to document,
one founding later. The fix takes the same shape: a named predicate used by
both dispatchers, and `worldgen-expanse7`'s own first line licenses it:
*"v6's LAND is v6's land … byte-for-byte what they were."*

Patch, with the full rationale: `terrain-mirror-v7.patch`. It belongs
upstream in the interval repo, because **every** window pointed at a v7
pillar has been drawing the v1 island, not just this one.

Before and after, whole island, one pixel per tile:

| | sea | greenwood | crags | fens |
|---|---|---|---|---|
| v1 fallback (wrong) | 4.4% | 25.6% | 15.4% | 14.4% |
| v7 (right) | 53.4% | 6.2% | 6.7% | 4.7% |

`node preview-island.mjs` regenerates `island-expanse7.png`. It paints any
terrain its palette does not know in magenta on purpose: a terrain the
mirror learned and nobody drew should be loud, not plausible.

## 3. The terrain list grew by itself, and then was pinned

Pointed at v7, `codeFor` minted three codes nobody had seeded: `moor`,
`heartlands`, `downs`, and broadcast the new list, exactly as designed.
But a code minted by *discovery order* is a different code if the chunks are
requested in a different order, and a window whose layer 23 depends on which
way it walked is not reproducible. They are now seeded in `TILE_NAMES`, so
22/23/24 are fixed; `codeFor` still catches the next surprise. Together they
are 20% of the island.

## 4. Friction fixed on the way through

- **`WebSockets` is an engine module on 5.8, not a plugin.** Listing it in
  `IntervalBridge.uplugin` fails the build outright. It is a `Build.cs`
  dependency and nothing else.
- **`AIntervalChunk` and `FIntervalChunk` cannot coexist.** UHT refuses a
  class and a struct that reduce to the same engine name. The struct is now
  `FIntervalTerrainChunk`; the actor, which draws one, keeps the short name.
- **A Blueprint-only project cannot compile a source plugin.** The project
  now carries an empty `Source/interval` module purely so UnrealBuildTool has
  a target to hang `IntervalBridge` on. It must stay empty.
- **The MCP server does not auto-start.** `bAutoStartServer=True` is now in
  `Config/DefaultEditorPerProjectUserSettings.ini`; a missing tool looks
  exactly like a stopped editor from the outside, and that cost a restart.
- **Never `kill -9` the editor: `CrashReportClient` inherits its sockets.**
  A hard kill leaves the crash reporter alive holding `127.0.0.1:8000`, so the
  next editor logs `LogHttpListener: Error: HttpListener unable to bind to
  127.0.0.1:8000` and starts with no MCP listener at all. The failure is
  vicious because `nc -z 8000` still succeeds: the *old* socket answers, so
  every symptom points at a hung editor rather than a squatted port. If the
  tools stop answering, check `lsof -nP -iTCP:8000` before anything else, and
  close the editor with a plain `kill` so it shuts down cleanly.

## 5. The ground split along every chunk boundary (fixed in §17)

`AIntervalChunk::BuildMesh` gives a vertex the average of the tiles that meet
at it, and a chunk holds only its own tiles. At a shared edge the left chunk
averages the last tile it has and the right chunk averages the first tile it
has, so **the two disagree about the height of a vertex they both own**. The
result is a hard seam every 64 tiles, the full width of the island, clearly
visible at play range.

Clamping instead of skipping does not help: the two sides still read
different tiles. Nothing computable from chunk-local data helps.

Relief amplitude is therefore **0** for now, which makes the ground flat and
seamless, and flat is what the world actually is. The real fix, for whenever
relief is wanted back, is a one-tile skirt: ask for `(X0-1, Y0-1, W+2, H+2)`,
build the mesh from the interior, take vertex relief from the skirt, and key
the chunk off the interior origin. `terrainChunk` is a pure function of
coordinates, so the skirt costs bytes and nothing else. The rationale is
written into `IntervalGeometry.h` where the next person will hit it.

## 6. The material

`M_IntervalGround` is one `Custom` HLSL node. It snaps to the texel centre
(`floor(UV * ChunkSize) + 0.5`), reads R as the code, G as the made way and
B as the scatter seed, feathers the way by one texel with four taps, and
indexes a 25-entry layer table. **No terrain is named anywhere in it**: only
indices, and an index past the end of the table falls to layer 0, so a world
with ground this build has never drawn still has ground.

Per-tile break-up is deliberately small (±6%). A per-tile value has no mip
chain, so anything stronger stops reading as ground and starts reading as
dither the moment you back away from it, which is exactly what the first
pass did at ±14%.

`T_IntervalControlDefault` is a 4×4 linear texture holding code 0, no way,
mid seed: it is what an unbuilt chunk reads as, so a chunk that has not
arrived is plausible ground rather than a shader error.

## 7. The hour

Sun at 19° and 5200 K, 9 lux, Movable, casting on cloud and atmosphere.
Sky Atmosphere + Volumetric Clouds + a real-time captured Sky Light.
Filmic grade at engine defaults (slope 0.88, toe 0.55, shoulder 0.26) after
a first pass at toe 0.95 turned the whole island into a highlighter.
Exposure is a **narrow auto band** (0.12–1.4, bias 0) rather than a slider or
a free-running eye: it cannot blow out and it cannot crush, and there is no
time-of-day control anywhere.

8°, the angle in the plan, does not work with a physical atmosphere: the
transmittance at that elevation eats the sun and exposure bottoms out at
−9.9 EV with the ground pure black. 19° still reads as late afternoon and
actually lights the island.

## 8. Session 3 · wear, and the things that are standing

**Ruts and a verge.** The made-way plane is one byte per tile, so the first
pass cut its grooves with `frac()` inside each tile and the road came out as a
ladder: a fresh pair of ruts every two metres. The mask now gets its own
bilinear reconstruction in the shader (four taps, lerped) while the terrain
**code** stays hard-sampled on the texel centre, because a blurred code is a
blurred answer to where the Fens end and two citizens have to agree on that.
Wear is not a boundary anyone meets at, so it may be smooth.

With a continuous mask, distance from the centreline is just `1 - Way`, and
the grooves run along the track and bend with it without anything knowing the
road's direction. On a paved square `Way` is 1 everywhere, the distance
collapses to zero, and no rut is cut: the right answer, for free.

**Wear may not touch what somebody paved.** The way mask runs straight down a
town's streets, so blending worn earth over it turned every lane, square and
room floor in all fifteen settlements to mud. People lay flagstone precisely
so that it does not become a rut. The generator already distinguishes the
paved kinds from the beaten ones; the material only had to respect it.

**`AIntervalStructures`.** The frames carry 10,530 things standing on the
island: 3,160 wall, 842 rampart, 1,233 hedge, 459 fence, 207 signpost, 157
named keepers, plus the trees, rocks and fishing marks that are the only
things a citizen may actually gather. This actor draws them as instanced
meshes and knows nothing else about them. It currently draws 9,239 of them.

There is **no switch on kind in the C++**, and that is the whole design.
`IntervalTypes.h` allows a renderer to switch on the world's strings to pick a
mesh, but a `switch` in a compiled binary fixes which words exist, and this
founding has already proved it adds them (v7 brought three ground kinds and
three isles nobody had drawn). So the word-to-mesh map is **data, edited in
the level**; C++ writes down no word at all. A key may be `type` or
`type.kind`, the more specific winning, so a level can single out one sort of
landmark without this file learning that the sort exists. A word with no entry
is not drawn **and is named in the log**: silence is how a stale window hides.

Two details worth keeping:

- **Angles come from the node's own id, never from its position.** A barrel
  keeps its rotation when it is evicted from view and streamed back, and two
  citizens describing the same barrel describe the same barrel.
- **`bHideWhenDepleted`.** A stump that still looks like a tree is a window
  telling a citizen they can chop something the world will refuse them, which
  is §4's legibility rule one session early.

The rebuild is skipped unless a digest of what-is-standing-where changes. The
island's furniture changes when somebody chops something, not sixty times a
second, and clearing ten thousand instances every interval to put back the
same ten thousand is a cost that gets paid forever because nobody measured it.

**Props were lit for a studio.** Every albedo sat near 0.12 and the town came
out as one brown mass in its own shadow. Weathered limestone is nearer 0.33,
oak 0.17, thatch 0.31.

## 9. Session 4 · scatter, and the silhouette language

Scatter is placed by `AIntervalChunk` from the seed plane the bridge already
sends: **one byte per tile, and nothing else**. The byte decides whether
anything grows; one fixed scramble of the same byte decides where inside the
tile, at what angle, and at what size. No clock, no random stream, no
per-machine state, so every Unreal window grows the same fern on the same tile
forever. Reusing one byte for both correlates them slightly, which is
invisible at one item per four square metres and is the price of not inventing
a second plane that no other window would agree with.

The table is keyed by the world's **name** for the ground, not by its code,
and resolved through `GetTileNames()` every time the list changes. A code is
an index into a list the bridge appends to at runtime: this founding appended
three terrains mid-session, so level data keyed by number would quietly mean
something else the day a founding adds a terrain.

### The silhouette language, written down

| shape | means |
|---|---|
| **cone** | a tree a citizen may chop |
| **sphere above ~1 m** | a rock a citizen may mine |
| **low dome, flat slab** | scenery, and never either of those |

The first pass got this wrong in the most instructive way: undergrowth was
**cones**, the same word the trees speak, in a smaller voice, so a wood read
as trees of assorted sizes with no way to tell which six of them the world
would actually let you touch. Ferns are domes now, and crag rubble is a slab
rather than a small boulder for the same reason.

Tone carries the rest. A gatherable tree was wearing the same green as the
fern at its foot and the field behind it; canopy is darker and cooler than
undergrowth in every real wood, and that one difference does more for
legibility than any amount of silhouette.

### Two bugs that had been hiding since session 3

**A material must declare it will be used on instanced meshes.** Without
`bUsedWithInstancedStaticMeshes`, Unreal silently substitutes the default
material: the grey checker, and says so only as a log warning:

```
Material MI_PropStone missing usage flag InstancedStaticMeshes!
Default Material will be used in game.
```

Every prop and every tuft had been rendering as that checker since the moment
the structures actor was written. It reads as a *lighting* fault, not a
missing assignment, which is why it survived a whole session and two rounds of
retinting the very materials that were not being used. Diagnosis only landed
by setting one tint to magenta and watching nothing turn magenta.

**A material override set before `RegisterComponent` is dropped**, leaving the
mesh's own slot, which, for an engine primitive, is the same grey checker.
Fixed in both actors. It was not the cause here, but it would have been the
next one.

## 10. Session 5 · citizens, and the rule that makes smoothness safe

`AIntervalCitizens` draws the players as skeletal meshes: the mannequin,
playing idle or walk depending on whether the tile changed between the last
two intervals, and the 706 mobs as instanced meshes, one pool per kind, keyed
by the world's own word exactly as the structures actor does. The cast list is
rebuilt only when somebody joins, dies or leaves view; the transforms are
written every rendered frame, because adding and removing instances is the
expensive half and moving them is not.

### The interpolation is cosmetic, and now the check says so

The world advances once a second. Everything smooth here is one number
between 0 and 1 measured against that second, and a citizen is on **the tile
the last frame said they were on**. The figure sliding between two tiles is a
drawing of a citizen, not the citizen.

That is not a comment any more. `check-window-unreal.mjs` now asserts that **no
file both reads the interpolation and sends an intent**: matching calls, not
declarations, since the subsystem is where both of those live. Today
`GetInterpAlpha` has exactly one caller and `SendIntent` has none, so the rule
holds by a wide margin; the point is that the day somebody wires a click to a
drawn position, the harness says so rather than the game walking one step and
stopping.

### One level of nesting, under a dotted key

`action` arrives as an object: `{"type":"gather","nodeId":"seam-80"}`, and a
name plate that prints the whole of it says less than the one word inside it.
`ParseEntity` now also flattens one level under dotted keys, so a window can
ask for `action.type` without anything in C++ knowing that `action` has a
shape, or what any of its words mean.

### What does not work: the name plates

`UTextRenderComponent` renders nothing, from any angle, at any size. Ruled
out, each by observation rather than reasoning:

- the component is created, registered and reports itself visible;
- `bShowNamePlates`, `PlateHeight`, `PlateMaxDistance` and `PlateSize` all
  hold the values the level set;
- the distance test passes, this began as a genuine bug, where an absent view
  location left the fallback at the world origin so every plate tested as
  infinitely far away, and fixing it changed nothing;
- font and material are explicitly assigned from the level and the log
  confirms both as `set`;
- a view location **is** available in simulate, so the facing code does run;
- and the facing itself is now a tunable `PlateYawOffset`, both 0 and 180
  draw nothing, so it is not which way the glyphs point.

Whatever is left is inside the component. The next thing to try is a material
of our own on a quad, or a UMG widget component, rather than a sixth guess at
this one. The facing knob and the diagnostic log stay for whoever picks it up.

## 11. Session 6 · the hand, and what silence was hiding

`AIntervalHand` turns a click into **one deed**. A click eight tiles away
sends one intent that says walk, this way, eight steps, not eight intents,
and not one per interval as the citizen goes. The world is a ledger of deeds;
a window that files eight of them for one decision has told the world eight
things that did not happen.

The step count is measured from **the tile the last frame reported**, never
from the smooth position the citizens actor is drawing. Those two disagree for
most of every second and only one of them is a fact. The conformance check
enforces the separation rather than trusting the comment, and it is the reason
the hand and the citizens live in different files.

The tile under the cursor is where the ray crosses **z = 0**, not what a trace
hits. The world is flat: it has tiles, not heights, so a click on a tree, a
wall or a sheep answers with the tile beneath it, which is the honest answer in
every case. Tracing geometry would answer with whatever is standing there, or
with nothing.

### The silence, and what was behind it

The first walk sent to the live pillar produced **nothing**: no refusal, no
movement, no citizen. Then a bare `spawn` did the same. Neither is a bug in
the transport: both were signed, relayed and accepted.

Birth is two-phase (`sdk.mjs` §0b/§0c). A citizen **attends**, waits the same
ten minutes a person waits: 1000 ticks, and only then crosses. A bare spawn
"is an input that will be refused forever, because no wait stands behind it",
and it is refused **inside the state machine at application time**, where no
`refused` ever comes back down the socket.

So the window could click, send a perfectly valid signed input, and be told
nothing at all. That is exactly the failure §6 exists to prevent, arriving
from a direction §6 did not anticipate.

Three changes, each in the layer that should own it:

- **The bridge measures the wait** and ships a `birth` block in every frame:
  `in`, `waiting`, `ripe`, `lapsed` or `unknown`, with `waited` and `ripeAt`.
- **The bridge owns the protocol.** Unreal sends `{k:"enter"}`, one word,
  and the bridge knocks, waits or crosses as the state requires. This is the
  same reason `sdk.mjs` keeps `enter()` in one place instead of teaching every
  executor about §0b. The window knows it wants in; it does not know what a
  birth is.
- **The hand says which nothing.** A click with no citizen now answers
  "waiting to be born (58/1000)" or "nobody has knocked" rather than "nothing
  happened", and knocks on the citizen's behalf.

Verified against the live pillar: the knock landed, and `birth` went from
`unknown` to `waiting` and began counting.

## 12. Session 7 · the door

Built in C++ as a `UUserWidget` that constructs its own tree: no asset. A
door that reports the rules should live beside them, and a widget tree built
in code cannot drift away from the fields it exists to show.

```
world ec83a95a86c8…   896 × 512
citizen 7add598b6ee59fd4…
interval 93903
finalized 93900  (3 behind)   witnesses 1 of 1
waiting to be born: 660 of 1000
this citizen is the file ./unreal-key.json, held by the bridge, never by this window
```

**Finalized is the number that matters.** The interval climbs whether or not
anyone agrees; the finalized tick only moves when the witnesses do, and the
gap between them is the difference between a world that is running and a world
that is running *and agreeing*. The row turns warm when the gap opens past
five, because a citizen whose deeds are not sticking is entitled to see why
rather than to conclude the window is broken.

**The key does not come through the door.** The bridge reports the PATH to the
file that is the citizen, so a person can copy it, back it up, or carry it to
another vessel by hand. Its bytes never cross the socket and are never in this
process. An exported key that passed through here would be in the editor's
memory, in its crash dumps, and in whatever the editor writes to disk, which
is a great deal. The plugin cannot sign, and it also cannot leak what it was
never given. That is a narrower door than the browser windows have, and it is
narrower on purpose.

### And it solves the name plates

**UMG text renders perfectly** in this project, at the first attempt, in the
same viewport where `UTextRenderComponent` drew nothing from any angle at any
size. That settles §10's open question: the failure is specific to
TextRender, not to fonts, materials, visibility, distance or facing. The fix
for name plates is a `UWidgetComponent` carrying a text block: the same
machinery the door already proves works, rather than a sixth guess at the
component that would not draw.

## 13. The window is a citizen

Proven against the live pillar, end to end, on `interval-expanse-v7`:

```
RIPE at tick 94243
BORN at tick 94244: standing on tile 467,265 with 64 hp

standing at 467,265, sending ONE deed: walk dx=1 dy=0 steps=5
tick 94254 | at 468,265   <- MOVED
tick 94255 | at 469,265
tick 94256 | at 470,265
tick 94257 | at 471,265
tick 94258 | at 472,265
tick 94259 | at 472,265        (the deed is spent; nothing further was sent)
```

**The window crossed by itself.** Nothing scripted the birth: the hand asked
`{k:"enter"}` once an interval, the bridge knocked, counted out the ten
minutes, and spawned the moment it could. The citizen woke beside Anchor.

**One deed, five steps, one tile per interval, then stop**: §5i exactly. Five
intervals of movement from a single signed input, and the sixth interval is
still. The window did not send five inputs, and it did not send one per tile.

And the door, at that moment:

```
interval 94271
finalized 94270  (1 behind)   witnesses 1 of 1
standing at 472, 265
```

That is the whole chain: a verb chosen in Unreal, normalized and signed in the
bridge by the engine's own code, agreed by the pillar, returned as a frame, and
drawn, with the window holding no key, no table, and no opinion about whether
any of it was allowed.

### Name plates, closed

Replaced `UTextRenderComponent` with a `UWidgetComponent` carrying a
code-built text block, in **screen space**, which also disposes of the facing
question that cost two rebuilds, since a screen-space widget always faces the
camera and holds its size. They render. Five sessions of ruling things out
ended at "it is that component", and the door proved the alternative in one
attempt.

Two things still want a tune: the plate sits a little high and wide of the
head, and distance culling does not apply when the engine reports no view
location, `ViewLocationsRenderedLastFrame` is populated in some simulate
sessions and empty in others, and the fallback deliberately draws rather than
hides, because a missing name is worse than a distant one.

## 14. The blotching, and what it had really been doing

**Cause: the ground was in the Lumen scene.** A chunk is a flat 128 m square,
so Lumen's surface cache covers the whole of it with one very coarse card and
then reads the indirect term back out of that card. Hence soft patches at
card-texel scale, worst at grazing angles, where a wide shot crosses many
metres of ground per pixel.

`Mesh->SetAffectDynamicIndirectLighting(false)` on the chunk's procedural mesh
takes the ground **out of** the Lumen scene while leaving it **receiving**
normally. It is a level-settable flag (`bGroundAffectsIndirect`) rather than a
constant, because it is a judgement: it costs a little green bounce onto the
walls standing on the grass, and buys back every wide shot.

**And it had been doing more damage than "blotches".** A wide view of the
heartlands from 32 m up was rendering *near black*, and I attributed that to
looking across the moor at a grazing angle and moved on. That was wrong: it
was this artefact at full strength, the coarse card darkening an entire
country. The same camera, the same hour, with the ground out of the Lumen
scene, renders clean green. A diagnosis that explains the small version of a
symptom is worth re-testing against the large version before it is believed.

## 15. Everything standing is now drawn

The twenty words the log had been naming at every startup: the workshop
fittings (anvil, smith, furnace, brewpot, sawpit, bellwork, stamp), the stores
and vaults, the watchfire, the ossuary, the ferry, the fishing marks and the
worked plots, each got **one line of level data and no line of code**, which
was the entire point of keeping the word-to-mesh map out of C++.

```
tick 95127: drew 10530 of 10530 things standing
```

The fishing marks are deliberately flat discs rather than boulders: they sit
in water and are gathered from, and nothing about them may read as the rock
silhouette a citizen mines.

## 16. Roofs, derived rather than invented

A building is not measured here. The generator already answers, per tile,
whether a citizen standing on it is **indoors**: that is what makes a tile a
room's floor rather than the lane outside it, so the footprint of every
building on the island is already in the terrain plane, told. A roof is that
footprint raised to the height of the walls. Nothing guesses a building's
extent or decides where one ends and the next begins; each tile roofs itself
and they meet.

One slab per tile, exactly one tile square, so neighbours tile edge to edge
with nothing overlapping and no coplanar faces to fight. Walls span 0–270 cm;
the slab is 24 cm thick centred at 282, so it sits on the wall tops.

**Laid only over the floor, it sits inside the walls** and every house reads as
a little courtyard with the walls standing proud of its roof. The wall ring is
exactly the tiles touching an inside tile, so the roof is the inside **dilated
by one**, which covers the walls and stops at the lane beyond them, because a
lane is two tiles from any floor. The dilation stops at the chunk edge, so a
building spanning two chunks loses the far row of its eaves; the proper fix is
the same one-tile skirt `IntervalGeometry.h` describes for relief.

Which kinds of ground get roofed is level data keyed by the world's word, like
scatter: C++ writes down no word.

**And the roofs put the exposure on the floor.** Thatch went in at an albedo of
0.31, against ground at 0.18; once every building wore it, the auto-exposure
band did what it is there to do and stopped down, and the whole island went
dark. The first reading was "the roofs broke the lighting". They had not:
weathered thatch is nearer 0.20 than 0.31, and at 0.20 the exposure sits where
it did and the roofs still read. A palette is a lighting decision, and a
material that covers a thousand buildings is a big one.

## 17. The skirt, and the two things it bought

A chunk that can only see its own tiles cannot agree with its neighbour about
anything computed from a **neighbourhood**. Two failures came from exactly
that, one session apart:

* **Vertex relief.** A vertex takes the average of the four tiles meeting at
  it. At a shared edge the chunk on the left averaged the last tile it had and
  the chunk on the right averaged the first tile IT had: two different answers
  for a vertex they both own. The ground split along every chunk boundary, a
  seam every 64 tiles, the full width of the island. Relief was set to zero to
  hide it.
* **Roof eaves.** The roof is the indoor footprint dilated by one, so a
  building spanning a boundary lost the far row of its eaves.

Both are the same bug, and the fix was never a smaller number. Every chunk now
asks for the rectangle it means to **draw** plus a one-tile border it reads and
never draws:

```
{ k:"terrain", x0, y0, w, h, skirt: 1 }
   -> planes are (w + 2*skirt) x (h + 2*skirt), from (x0-skirt, y0-skirt)
      x0, y0, w, h stay the INTERIOR, what was asked for and what is drawn
```

`terrainChunk` is a pure function of coordinates, so the border costs bytes and
nothing else: 4356 per plane instead of 4096, for a 64×64 chunk. Tiles beyond
the edge of the world come back **unknown** rather than as a guess, because
past the edge of the map there is no ground to be right or wrong about.

Inside the chunk it is one indexing change. `Local(x, y)` takes **interior**
coordinates and will happily accept `-1` or `Width`: that is the whole point,
while `IndexOf`, which answers for the world, still reports only the interior,
because two chunks both claiming the same tile is how a seam becomes a
disagreement about where anything is.

**Relief is back**, at 14 cm, and the boundary that used to split is
continuous: the same camera, the same chunk edge at x = 89600, and a worn track
crossing it without a break.

## 18. English medieval, properly

A flat slab reads as a warehouse at any distance and no texture fixes it. So
the roof became **geometry**, and the walls became a **frame**.

### The roof is a gable, derived from the footprint

Still nothing invented. The generator says which tiles are indoors; that
footprint, dilated over its own walls, is the roof's plan. Then:

1. **Flood fill** the covered tiles into connected buildings, so each gets its
   own ridge. Two houses sharing a wall come out as one building under one long
   roof, which is what a terrace is.
2. **The ridge runs along the long axis** of each footprint, because that is
   what a ridge does: a hall is long, and so is its roof.
3. **Height falls in a straight line** from the ridge to the eaves, which is a
   gable rather than a hip.
4. **Where the roof stops, a wall rises to meet it.** On the long sides both
   corners sit at eaves height and that face has no area; at the ends it is the
   triangle that makes the building a gable instead of a shed.

The skirt is what makes this possible at all, and it had to grow from one tile
to **four**: relief needs to see one tile past the edge, but a ridge needs to
see the whole building, which may begin in the chunk next door. Four covers
every house on the island at 5184 bytes a plane instead of 4096.

Pitch is 210 cm of rise per tile: about 46°, because thatch sheds water by
slope alone, and anything under about 30° stops reading as a roof.

### The walls are half timbered, drawn rather than textured

`M_IntervalTimberFrame` is straight lines: a sill, a wall plate, a mid rail,
studs at half-metre centres, and a brace across each upper panel, in oak that
has weathered almost black, against limewashed daub. Splashback darkens the
bottom 40 cm off the street.

Both materials are driven by **world** position, not by the mesh's own UVs, so
the frame and the thatch courses run continuously along a terrace instead of
restarting at every tile. Restarting is exactly what gives away a wall built
out of repeated cubes.

The thatch lays its courses **horizontally**, parallel to the eaves. Running
them down the slope instead is the commonest way a thatched roof comes out
looking like corrugated iron.

### One knock-on

With the ground out of the Lumen scene there is less bounce to fill a shaded
roof plane, and the north slopes crushed to near black. The sky light went from
1.0 to 1.45, which is the honest fix: on a real overcast-and-sun English
afternoon the sky IS most of the fill.

## 19. No two houses alike

Every building was identical, which no street has ever been. Variety here has
to obey the same rule the scatter plane does: **deterministic, and the same in
every window**, or two citizens describing the same house describe different
houses.

**The roofs get it properly.** `AIntervalChunk` already flood-fills the
footprints to find each building's ridge, so each one also gets a seed, a hash
of its own corner **in world tiles**. Not in chunk-local tiles: the seed must
not depend on which chunk drew it or on what order chunks arrived. From that
seed:

* **pitch** varies ±17%, a village roofline is not one angle repeated, because
  rafters were cut to the timber that was there;
* **age** varies, and thatch is renewed in patches over decades, so one house
  is fresh straw, its neighbour twenty years grey, the damp one on the north
  side green;
* **course depth** varies, because no two thatchers laid the same.

The seed rides to the material in the **vertex colour**, which is how the roof
knows which house it belongs to without anything having to look a building up.

**The walls get it approximately, and this is the honest part.** Walls are
placed from told *nodes* by `AIntervalStructures`, which has never met the
flood fill, it knows a wall is at a tile, not which building the tile belongs
to. So the limewash is keyed to a hash of the world quantised to eleven tiles:
wider than any house on the island, so neighbours differ. A house straddling a
cell boundary gets two washes, and a terrace where the plaster changes at a
party wall is what half the streets in England look like, so it is wrong in a
forgiving direction. The proper fix is for the chunk to publish a per-tile
building id that the structures actor can read.

Limewash was not always white. It was tinted with whatever was to hand: ox
blood, ochre, copperas, so the street runs cream, buff and pink, and stud
spacing varies too, because close studding was a boast only the well-off could
afford in oak.

**And the jetty.** An English town house carries its upper storey out over the
street on the ends of the floor joists, so the first floor is wider than the
ground floor and throws a shadow along the wall beneath. That overhang cannot
be painted on: it is the building being two different widths at two heights,
so `PropsUpper` draws a second band for any word that has one, 20 cm proud on
each side, with the joint landing exactly on the mid rail the frame material
already draws.

## 20. The roofs were right; the walls were lying

The towns looked half-built: walls standing round open ground with no roof on
them. The roofs were not the problem. Counted over Millbrook and its surrounds:

```
wall tiles in view: 359
  touching an indoor floor (get roofed): 295
  touching NO indoor floor (stay open):   64
what the open ones stand next to: heartlands 469, flag 64, trail 35
```

Those 64 enclose **grass and paving**. They are yards, pens and garden walls,
and a yard has no roof. The world was right and the roof was right.

What was wrong is that every `wall` was drawn the same: a 2.7 m, two-storey,
jettied, timber-framed **house** wall. Put that round a vegetable patch and it
reads as a roofless building. A garden wall is low, stone, single storey and
has no frame, and the moment it is drawn that way the town stops looking
unfinished.

### The window's own fact, and the fix for both complaints

A told node says a wall is at a tile. It never says whether that tile is part
of a house or the edge of a yard, and only the **footprint** knows, which the
chunk worked out when it laid the roofs. So the chunk now keeps the building
seed per tile, the ground publishes it, and the structures actor asks.

The look-up gained a third step. It was `type.kind` then `type`; now it is
`type.kind`, then **`type.roofed` / `type.unroofed`**, then `type`. The middle
one is not the world's word: it is a fact this window derived about its own
drawing, and naming it that way keeps the rule intact: C++ decides *whether
there is a roof over this tile*, and the level decides what either case looks
like. `wall.roofed` is a jettied timber-framed house; `wall.unroofed` is a low
stone wall.

It also retires the approximation from §19. Walls now carry the **real**
per-building seed as per-instance custom data, so limewash, stud spacing and
whether a house is braced at all vary per building rather than per map cell,
and every wall of one house agrees, because they are all hashing the same
building's corner in world tiles.

`AIntervalGround` broadcasts `OnGroundChanged` when a chunk lands, because a
wall placed before its ground existed was told there was no building under it
and drew itself as a yard wall. It has to hear that the answer changed.

## 21. What the photo window had

Read for atmosphere, not for content. Two of its ideas carry straight over,
and UE does both natively:

* **In-scattering takes the light's colour.** *"fog looking TOWARD the light
  takes the light's color: at golden hour the whole west half of the air goes
  amber, and every silhouette in front of it is suddenly a movie."* That is
  `DirectionalInscattering` on the height fog, and the exponent was at 12,
  a tight little glare round the sun instead of half the sky. At 6, with a
  warm luminance, the air downsun actually turns.
* **Fog pools low.** *"valleys hold their breath while ridgelines stand clear
  of it."* A second fog layer, dense and with a steep falloff, offset below the
  ground plane, so mist lies in the fields and the buildings stand out of it.

Also taken: light-shaft bloom off the sun, a wider soft angle so shadows
harden at contact and soften with distance the way a real disc's do, and
cloud shadows strong enough to read as weather crossing the country.

**Both went in too strong first.** Second-layer density at 0.035 with the
in-scattering at 2.6 blanketed the island and the whole town went to mud. The
photo window's own numbers are restrained: `prm: {mist 0, base 0.3, falloff
0.22}`, and mine were not. At a third of that it does what it is supposed to:
you notice the air, not the fog.

## 22. A building is built of what it is for

Every house was timber framed, which no town has ever been. But a building's
**trade is already told**: the world says what stands inside it, an anvil, a
brewpot, a vault, an altar, and a strongroom is not built of sticks.

So `AIntervalStructures` makes a first pass over the nodes, asks the ground
which building each one stands in, and records what that building is for.
Then a wall looks up `wall.<trade>` before anything else.

Both halves are level data. `TradeOf` maps the world's word for a thing to a
word of the **level's** own choosing for the construction its building takes;
`Props` says what that construction looks like. C++ knows only that a building
may have a trade and that a trade may change how its walls are drawn. It does
not know that forges exist, or that they are built of stone.

Where a building holds several, the first in the map wins, so the map is
ordered from the most telling to the least: **a hall with a hearth in it is a
hall**, not a cottage with a fire.

On Tallyholm that comes to roughly fifty buildings out of many: eleven vaults,
nine consecrations, three ossuaries, ten stores, seven stalls, and exactly one
smithy, which is the right proportion. A town where every third building was
a church would be as wrong as one where none was.

### It needed a key, not a seed

A seed is enough to make two houses look different. It is **not** enough to say
that this wall and that anvil are the same building, because a byte collides
and the island has hundreds of buildings. So a chunk now stores the building's
corner packed into an int64: unique, and the same from either chunk that
touches it, and the seed is *derived* from the key through one shared hash in
`IntervalGeometry.h`. Deriving rather than storing both is what stops the roof
and the four walls of one house drifting apart.

## 23. The roofs were inside out

Every building was missing half its roof, and from inside the forge the thatch
overhead was complete. Those are the same fact: **the roof's front faces were
pointing down.**

`CreateMeshSection` decides what is drawn from triangle winding, not from the
normal you hand it. The ground mesh -- the only thing in the file already known
to face the right way -- winds `TopLeft, BottomLeft, TopRight`; the roof wound
the other way round. So the surface was front-facing downward: invisible from
outside, perfectly solid seen from within.

Making the material two-sided proved it in one property with no rebuild -- the
holes closed instantly, and the roofs went black, because the shading normal
then disagreed with the face being lit. The fix is the winding, and the normal
still points up: **geometry decides what is drawn, the normal decides how it is
lit, and they are allowed to differ.**

### The roof stands aside rather than being permanently half gone

A roof kept open so the inside can be seen is a bad trade: the town reads as
ruined from every distance to buy something only wanted up close. So the roof
is solid, and dissolves only for whoever is standing under it -- gone within
about eight metres, whole by sixteen, thinning in between, with the material's
own dither so temporal AA resolves it to a soft fade rather than a
checkerboard.

Nothing about that is shared. It is a property of where **this** camera is
standing, it never reaches the world, and two citizens looking at the same
house still see the same house.

## 24. The warp, the closure, and where the look lives

### The ground was drawn with a set square

Every country's edge was a staircase of two-metre corners, because the terrain
code is one texel per tile and a pixel read the texel it was standing in. The
fix is not to blur the code -- a blurred code is a blurred answer to where the
Fens end -- but to **warp where the pixel asks**. Each pixel offsets its lookup
through a standing wave before snapping to a texel centre, so the answer changes
along a ragged line instead of a square one.

Three things keep that honest. The code is still sampled hard, so a pixel shows
one country and never a smear of two. The warp is a pure function of world
position -- no time, no chunk, no view -- so every window that computes it draws
the same ragged line and two citizens agree about the edge they are looking at.
And the amplitude is held under **half a tile**, which buys the invariant that
matters: at a tile's centre the warp cannot reach past its own texel, so the
ground under your feet is always your tile's ground.

The warp needs the neighbour's real code to read, so the **control texture now
carries the skirt** as well as the interior. Without that a warped read at a
chunk edge lands on the clamped border texel and prints a seam -- the same fault
as the relief seam and the lost eaves, and the same answer.

At full strength it went too far the other way: every lane and market place
dissolved into mud with grass islands in it. People lay flagstone *square*. So
the tile is read twice, once where it really is and once through the warp, and
**the straight answer wins wherever the straight answer is something somebody
paved**. Country wanders; pavement does not. Both reads are hard samples of a
real texel and neither invents a code.

### The roofs were standing on nothing

The world says which tiles are roofed, and separately where walls stand. Those
do not have to agree, and at a hall or a barn they do not: the roof covers
twenty tiles and the world names walls on six. Drawn straight that is a roof
hanging in the air with daylight under it -- which is what it was doing, and
half of what "the roofs are not adding up" meant.

So the window closes the **roof's own perimeter** down to the ground, as a
second mesh section in its own material. That invents nothing: the world said
this ground is roofed, and a roof stands on something. Where the world does name
a wall, the wall is drawn in front of the closure and it is never seen -- which
is why it is set back seven centimetres from the tile edge rather than sitting
exactly on it, where the two would fight for the same pixels, and carried forty
below zero so the ground's relief cannot open a line of daylight underneath.

Two smaller faults fell out of it. The closure has no per-instance data, so the
frame material read the house seed as zero: the closest studding money could buy,
no braces and the palest limewash, on every hall on the island. A static mesh's
vertex colour is opaque white unless somebody painted it, so a **zero blue**
is a safe signal that these vertices were built by the window and carry the seed
in red -- one material, both kinds of wall, neither knowing the other exists.
And the frame was laid out for a fixed 270cm plate, which on a five-metre barn
put the plate halfway up with nothing above it. The **wall's own height rides in
the green channel**, and the rails divide it into storeys of roughly two metres,
because that is what the timber came in and what a floor wants to be.

### Buildings are not all one height

A street of identical eaves is the thing that reads as a model kit. Height now
comes from `UIntervalGeometry::BuildingHeight`, one function off the key the
walls and the roof already share, so they cannot disagree -- ask it any other
way and the thatch floats a hand above the timber on half the houses. Free-
standing stonework, which nothing roofs, takes its height from the tile's own id
instead, so the top of a run undulates the way a wall laid by hand undulates.

And a big building has big walls. Held at one height for everything, a
twenty-metre hall came out as a cottage wall under eight metres of thatch. The
eaves now answer the same span the rise does.

### A well is not a cylinder

A prop kind may now carry **parts**: further pieces, drawn at the same tile and
turned by the same angle, each in its own pool so it costs one draw call across
the island rather than one per well. Nothing in C++ knows what a well looks
like; a level says the word `well` is drawn as a drum, a coping, two posts, a
windlass beam, a thatched hood and a bucket -- exactly as it already says the
word `wall` is drawn as a scaled cube.

The bigger find came from asking the bridge what words were actually in use.
`landmark` is the second most numerous word in the world -- two and a half
thousand in one neighbourhood -- and it carries **eighty-nine sub-kinds**: pine,
willow, standing-stone, barrel, bed, grave, skep, spoil-heap, cairn. Keyed only
as `landmark`, every one of them was the same stone drum. That, more than the
buildings, is why the country read as repeated. Fifty-four of them now have
their own entry under `landmark.<kind>`; the rest still fall back to the plain
one and are still drawn.

### The look had nowhere to live

All of this used to be set on the level's own actors, which is where an Unreal
project normally puts it. It cannot stay there. They are external-actor packages
and **nothing available here can save one under automation** -- `save_actor` and
`save_assets` both report the package does not exist, because the asset registry
does not index it. A whole session of meshes, offsets and materials lived in
memory and went with the editor on every rebuild; the earlier sessions' numbers
in this document were only ever as durable as the editor process.

So the look moved into `UIntervalLook`, a data asset, which saves. A level may
point at one; unset, the window loads the one at a conventional path. `Tools/`
holds the script that writes it, which is now the record of what the look is and
why.

### Two things about driving the editor

`CaptureViewport` renders the **editor** world. If what you want to photograph
is built at runtime -- and all of this is, by a `UGameInstanceSubsystem` --
ordinary Play-In-Editor puts it in a world the camera never sees, and every shot
comes back as featureless fog while `find_actors` cheerfully lists the actors.
**Simulate** is the mode where the level viewport shows the play world and the
camera stays a free editor camera. It is the only way to get both.

And the MCP server answers plain JSON-RPC on its port, which is worth using from
a shell for two things: a few kilobytes of HLSL can be read from a file instead
of escaped by hand into JSON inside JSON, and a viewport capture can be decoded
straight to a PNG instead of a megabyte of base64 going through the transcript.

## 25. Doors, voices, motion -- and a normal that had to come out again

### The doorways were being walled up, and the measurement said why

The world puts a room's FLOOR down as one terrain and stands the walls on the
ring of tiles OUTSIDE it. Not one roofed tile in the measurement carried a
wall. So the roof footprint is dilated by a tile before anything else happens,
which is how the roof comes to sit on the walls at all.

Of the tiles in that ring, every single one carrying a wall stood on raw
country or a trail. The one or two per building that carried nothing stood on
`flag` or `cobble`. **The generator lays a threshold where the door is**, and
no walled tile in the sample stood on either. That is a told fact, free, and
the window had been closing straight over it: the under-eaves closure from §24
ran round the whole perimeter and bricked up every doorway on the island.

A level now names which grounds are thresholds. A covered tile standing on one
gets a hole with a head on it -- a jamb either side, a lintel over, and the
leaf set back a hand's breadth into the reveal. Only one per tile: a threshold
on a corner has two faces open to the street, and cutting both put a door
through each and left the corner of the house missing.

**The leaf lies IN the wall.** Hung on a jamb and swung open, as it was first
built, it was a slab standing out in the street at an angle, the wrong size for
the hole it came out of and attached to nothing -- a door the way a plank
leaning on a shed is a door. Which houses stand open is the building's own
number, so it is the same door open in every window.

### Every word now has a look

`landmark`'s remaining forty sub-kinds are drawn -- cart, mill, cave-mouth,
shipwreck, siege-engine, ladder, eel-rack. So are `keeper`'s twenty-two and
`stall`'s seven. At the distance people are seen from, a robe colour says
almost nothing and a SILHOUETTE says everything, so each keeper has a hat and
the thing they are holding, and each stall has its goods on the trestle.

### What the window hears

The browser window's eleven themes are imported and keyed by the world's own
word for the ground, so a citizen who knows Anchor by its music knows it here
too. The ambience beds are synthesised, because there is no field recording to
hand and wind, surf and a river are all shaped noise: white noise through
one-pole filters, breathed by slow modulation, each loop cross-faded into
itself so the join is silent. Nothing tries to fake a blackbird; a bad
blackbird is worse than none.

The bed cross-fades, because the edge of the Fens is a place you walk over.
The piece does not: it arrives and is then left alone to finish, and a country
is heard once per visit. Restarting a good theme every time somebody steps
back across a boundary is the most reliable way to make it hateful.

### What a citizen is doing

The engine gives a citizen an `action` and the frame parser already flattens
it, so `action.type` was sitting there the whole time: `walk`, `attack`,
`attackp`, `gather`, `raise`. Two more are the window's own -- `still`, for a
citizen nothing is being said about, and `felled`, read off hit points. A level
says what each word looks like.

Every working verb loops. A deed takes a while and the world keeps saying it is
happening, so a swing that plays once leaves a citizen frozen mid-chop for the
rest of the interval. Dying is the exception; it happens once.

Beasts that are person-shaped get a skeleton and a component of their own
rather than a place in an instance pool, and read their verb from the same
table -- though the world says nothing about what a mob is DOING, so all there
is to go on is whether it moved and whether it is still alive.

### The normal came out again

A procedural ground normal was added and then removed. Close up it did what it
was meant to. But a normal is a lie told at the scale of one pixel, and across
a valley one pixel is most of a tile: the height field folds several times
inside it and what comes out is a hard grid over the whole country. Two things
are worth keeping from it.

First, **a product of two sines is a grid by construction.** `sin(ax)*sin(by)`
is a checkerboard, and using it as "noise" made the island tartan. Plane waves
crossing at angles that share no common period look like country.

Second, **an hour went into chasing an artefact that was not there.** After the
plaid was fixed a fine comb appeared over every frame, sky included, and the
post-process was stripped back piece by piece looking for it. The viewport
renders at about four thousand pixels across and a single `sips -Z 1400`
point-samples that down; the comb was the preview, not the render, and a crop
at full size showed it clean. The capture tool now halves in steps. The lesson
is older than this session: look at the thing itself before theorising about
what is wrong with it.

## 26. A person, not a mannequin

The only skeleton this project has is the engine's grey figure, and grey
plastic is a costume like any other -- it just happens to be a shop dummy's.
There is no texture to put on it and no UV layout worth trusting, so the
clothes are drawn the way the half-timbering is: from POSITION, banded up the
body. Boots, hose, a tunic to mid-thigh with the belt worn over it, a collar,
a hood, and skin at the face and the hands.

The colours come from one number per citizen, hashed from **the world's own id
for them** -- not the order they arrived in and not a random draw, because
either of those dresses somebody differently in two windows or gives them new
clothes tomorrow, and "the woman in the blue kirtle" is a sentence people say
to each other. Nothing brighter than a dye you can make from a root: undyed
brown, oatmeal, madder, woad, weld, fulled grey-green.

Three things cost time and are worth writing down.

**The body's own space came back constant.** The obvious way to band a figure
by height is a world-to-local transform in the material graph. On a skinned
mesh it returns the same value for every pixel and the whole figure comes out
one flat colour. What the material needs -- where they are standing, and which
way they face -- is known exactly by the code that just placed them that frame,
so it is handed in as two parameters instead.

**A hip is about twenty centimetres from the spine.** The rule for finding
hands was "further out than the body is", set at twenty, and it put a patch of
bare skin across the seat of every citizen's hose. A hand at rest hangs a good
deal further out than a hip; twenty-three to twenty-seven finds it.

**And the usage flag, again.** A material not marked as usable on a skeletal
mesh is silently swapped for the default one at draw time. No warning, no
error, the graph compiles clean, and the figure just comes out plain -- which
is indistinguishable from a material that is wired wrong, and sent this session
chasing a shader bug through a debug probe before the component's own material
list showed the instance was applied all along. This is the SECOND time in this
project: `bUsedWithInstancedStaticMeshes` cost an afternoon on the props. It
looks like a shader bug both times and is a checkbox both times. Any new
material here should have its usage flags set in the same breath as its code.

## 27. The hour, the wardrobe, and the tool in the hand

### The window was permanently at noon

`sky.mjs` has existed all along: the light as a pure function of the interval
count, written once and imported by the photo window and by the verifier
because two transcriptions of one ladder is how the terrain mirror fell
thirteen nouns behind. The bridge now imports it too and hands the window flat
numbers -- the sun is this far up, on this bearing, it is this overcast, it is
raining this hard.

Until this the window sat at noon on a fine day whatever hour the world was
at. A citizen could stand in a field at three in the morning in full daylight,
and two citizens in the same field could not agree about where their shadows
fell. Now the level's own sun, sky light and fog are pointed at the world's
hour, and this file does not know what a season is, how long a day is, or that
the weather is hashed off the day. That ignorance is exactly what makes it
impossible for this window to disagree with another about the weather.

### Painted clothes are not clothes

Banding the engine's grey figure by height got the COLOURS right and left the
silhouette of a shop dummy -- a person with a tunic drawn on rather than a
person in a tunic. The clothes are now real pieces hung on bones: a skirt from
the pelvis, a hood on the head, so they move with whoever is wearing them.

**A bone's axes are not the world's.** On this skeleton a bone's X runs ALONG
the bone -- up the spine, up through the skull -- so a piece hung with no
rotation lies on its side, which is how the first skirt came out pointing
horizontally across the street. A pitch of -90 turns a piece's own up onto the
bone's, and an offset meaning "higher" is +X rather than +Z.

A garment with no material of its own takes the WEARER'S, which is the
clothing material banded by height, so a skirt hung at the hips comes out the
colour of that citizen's tunic without anything looking up what colour it is.

And people differ now: a hand's breadth of height and a little more or less
across the shoulders, both from their own number, so they are the same person
tomorrow. The material is told that height, because the bands are in
centimetres up a person of ordinary size and a short citizen was otherwise
wearing their belt round their chest.

### A swing is a swing

What makes a swing FELLING A TREE rather than cutting a seam is the hatchet
and the tempo. The world already names the node being worked, so `gather`
carries it -- `gather.tree`, `gather.iron-rock`, `gather.fishing-spot` -- and a
motion may bring its own tool with it. A kind with no row falls back to plain
`gather`, which is a citizen working at something without the window claiming
to know what.

Weapons and armour are drawn from the same table, keyed by the world's own word
for the item and hung on `hand_r`, `hand_l`, `head` or `spine_03`. Thirty-six
weapons and thirteen pieces of armour are described by family rather than one
row at a time: what distinguishes `iron-sword` from `steel-sword` at forty
paces is the colour of the metal, not the shape of it.

## 28. Rain, glow-worms, and moving the vertices

### A material is not only paint

"Can we do nothing about the form of the figure?" -- yes, and this is how. A
material is asked every frame not only what colour a pixel is but WHERE each
vertex should be, and that is enough to reshape a mesh without owning another
one. The engine's figure is a comic-book athlete: a shelf of deltoid, a waist
like a wasp, a small stylised head. All of that is now moved -- shoulders in,
arms slimmer, chest flatter, head a little larger, the tunic standing off the
body as loose cloth, and a belly and a stoop for those whose number says so.
It happens after skinning, so it survives the animation, and it is all drawn
from the citizen's own number, so they are the same shape tomorrow.

The head also has a face now: two dark marks and a brow. That is the whole of
what a face has to be at the distance anybody is ever seen from, and without
it a head is an egg -- which was the other half of why a dressed figure still
read as a dummy.

### Rain, and two ways of getting it wrong

The sky already said how hard it was raining; nothing drew it. A cylinder
fourteen metres across now rides with the citizen -- not with the camera,
which was wrong twice over: while the editor is simulating there is a player
controller that answers with the world origin, so it rained in the sea a
kilometre away, and weather is a thing a person stands in rather than a thing
a lens is pointed at.

Then it drew nothing, and the way to find out why was to stop reasoning about
it. A probe that painted the cylinder solid red proved the geometry, the
placement and the visibility were all fine in one shot; a second probe that put
each factor of the equation into its own colour channel proved every one of
them was firing. The fault was never in the logic. It was that the streaks were
painted the colour of wet air, and **a streak is a few pixels wide at fourteen
metres**: the same value as the night behind it is nothing at all. Rain is
visible in a dark landscape precisely because water is BRIGHTER than the dark.

The second mistake was quantising world x and y into cells to make columns.
This is a cylinder: a cell sixteen centimetres across is sixteen centimetres of
curved wall, and a drop that fills one is a white brick a hand's breadth wide.
What makes a streak a streak is being thin the way round and long the way down,
and the way round a cylinder is the ANGLE.

### Glow-worms

Not a flourish borrowed from somewhere warmer. *Lampyris noctiluca* is an
English hedgerow animal, a summer night in long grass is exactly where you
would see one, and it does not flash like the American firefly -- the female
sits still and shines for an hour or two, brightening and fading over many
seconds. So these breathe rather than blink, each at its own rate.

They are placed by hashing the world tile they sit on, so the same tuft glows
in every window and "past the third light along the hedge" is a direction
somebody can give. The grounds they are found on are named by a level, like
the thresholds; a world that names none has none. And they came out white
until they were made big enough for the colour to read -- at five centimetres
each was three pixels, and a glow-worm that is not green is just a bright dot.

### Night is not pitch

At a tenth of noon the island went black and a citizen could not see the
ground they were standing on. That is not what night is like anywhere that has
a moon, and it is not what anybody wants to spend half of every twenty-four
minutes looking at. Night here is dim, blue and legible.

## 29. Wet ground, and something to light the dark

### One place to read the weather from

Telling the ground it is raining meant finding a hundred and twelve chunk
material instances and setting each one, rebuilt every time a citizen walks --
and the thatch and the timber could not be told at all. A material parameter
collection is a handful of numbers the whole project can see, set once a frame
by whoever knows the hour: `Rain`, `Day`, `Wet`, `Night`.

`Wet` is not `Rain`. Ground stays dark and shining for a while after a shower
and takes a while to darken when one starts, so it chases the rain rather than
tracking it.

### Wet ground is two things and only one is obvious

It is DARKER, because water fills the air between the grains and stops them
scattering light back out. It is also SMOOTHER, because the same water fills in
the surface -- which is why a road shines after rain and a dry one never does.
Doing only the first gives you mud with the lights off.

And water does not stand everywhere. It runs off grass and pools in the ruts a
cart cut, so the shine follows the wear the material already knew about. That
is the whole reason the ruts were worth having.

### Rain is grey, not bright

The streaks were painted bright so they would show at night, and then vanished
in daylight: against a bright sky a bright streak reads as nothing at all. Real
rain is neither bright nor dark -- it is the same grey water in both cases, and
what changes is what is behind it. One mid value, blended over the scene,
darkens a bright sky and lightens a dark field, which is exactly what rain does
to both.

### Fires that light something

There are hearths, watchfires, forges and torches all over this island and not
one of them lit anything: after dark the only light in the world was the sky,
and a village at midnight was a silhouette with nothing going on in it.

A hundred and fifty hearths is a hundred and fifty lights and no frame can pay
for that, so the window lights the nearest few -- fourteen -- and moves them as
a citizen walks. Nothing about the world changes with which ones are lit; this
is a budget, not a fact. Each gutters on two waves that share no period, so it
wavers rather than pulses, and each fire is on its own phase taken from its own
id. A hearth burns only after dark; a forge burns whenever the world says the
forge is there.

## 30. Flames, and a setter that had been dropping work on the floor

### The write that half-succeeded

Every flame added to every hearth went missing, and nothing said so. The
property setter refuses to grow an array and change its contents in one call --
"ArrayAdd: elements changed alongside the size change; insertion points are
ambiguous" -- and it reports that PER PROPERTY and carries on. So the rest of
the write lands, the call returns success, and the change is simply not there.
`parts` went from two entries to three and the whole map was refused while the
run printed `save: true`.

This had been costing quietly for some time: the same fault is why the material
`Inputs` array needed two calls, and that was treated as a quirk of Custom
nodes rather than what it is -- a rule about every array in the project.

Anything holding a list is now written twice: a pass that changes only LENGTHS,
padding with a copy of whatever is already at the end, then a pass that changes
only CONTENTS. Both halves are legal alone. `Tools/apply.py` does it for the
whole look asset, so it cannot be forgotten for the next table that grows.

### A flame

The fires cast light and were themselves cold shapes: a hearth was a ring of
stone with nothing in it. Now there is something in it -- a cone, lit from
within, white at the heart, orange through the body, nearly out at the tip.

Two things make it a flame rather than a traffic cone. It is **ragged at the
top**, and the lick rides the threshold so the whole tongue rises and falls
rather than the colour merely brightening. And it is **feathered at the sides**,
because a flame is a volume: you see through more of it down the middle than at
the edges, and the edges are where it is thinning into smoke.

The gradient and the feathering both need to know how big this particular fire
is, and a hearth and a watchfire share one material at four times the scale.
`ObjectBounds` gives the half-extent of whichever instance is being shaded, so
both come out right without either being told a number. Each fire also takes
its rhythm from where it stands, so two hearths in one room do not gutter in
unison and the same hearth gutters the same way in every window.

## 31. Kits, shelter, and water

### A hatchet is a haft and a head

A motion carried one held piece and a slot held one worn piece, so every tool
on the island was a stick and every sword was a bar. Both now carry a KIT --
several pieces that travel together. A hatchet is a haft, a blade and a beard;
a sword is a blade, a grip and a guard, and at forty paces the guard is most of
what says it is a sword. A map cannot hold an array directly in this engine,
which is the only reason a kit is a struct rather than a list.

A citizen's kit is kept as one flat list of components with a SIGNATURE of what
it is showing, rather than a component per slot. A slot can want one piece or
four now, and chasing that per slot is bookkeeping for something that changes
when somebody picks up a sword and not otherwise.

### Rain stops under a roof

The window already works out which tiles a building covers -- it is how the
walls know what house they belong to -- so whether a citizen is indoors is a
thing it can simply look up. It is not a hard cut: a doorway is a tile wide and
stepping across it should not switch the weather off like a light.

### Water

Standing water, in the things people made or the land collected: a fountain's
basin, a dew pond, a bog pool, a birdbath, a well. Not the sea -- the sea is
ground, and the ground material draws that.

Three things make water read as water and none of them is blue. It is dark
looking straight down and bright at a glancing angle, which is most of it. It
is smooth, so what you see in it is the sky. And it moves, in rings that cross
at angles sharing no period -- a grid of sines being a grid, as established.
When it rains the surface chops and the shine goes off it, which it reads for
free from the shared weather channel.

### And the thing that fell out of it

None of this was aimed at the shot it produced. With the fires lit, the rain
falling, the ground wet and the glow-worms out, a village at night turned out
to have firelight spilling from its doorways across standing water. Nothing
draws that: it is the hearth light, the door cut where the generator laid a
threshold, and the puddles in the ruts, all of which were built for other
reasons and none of which knows about the others.

## 32. Looking at the thing, again

The kits were described and had never been seen, because a citizen carries
nothing until they pick something up and picking something up is a deed in a
world other people live in. So the tool was put in the hand **in this window
only** -- the window's own motion table changed, no intent sent, the world
neither asked nor told, and the next frame from the bridge said exactly what it
said before. `Tools/tryhold.py` does it and puts it back.

Everything about the offsets was wrong, and two things about the tooling were
wrong in ways that made it look like the offsets were right.

**A hand bone's X runs UP the arm.** There are no finger bones on the simple
mannequin, so `hand_r` is a leaf and keeps its parent's direction, which runs
wrist to elbow. Hung at a positive offset the hatchet floated behind the
citizen's shoulder. Everything held hangs at a NEGATIVE offset now -- beyond
the fingers, which with the arms down is toward the ground.

**Starting a play session that is already running does nothing.** Not an error,
not a restart: nothing. The actors survive, so a change to the look asset
appears not to have taken when in truth it was never re-read -- and the
evidence for that is a component still holding the previous offsets while the
asset on disk plainly holds the new ones. Half an hour went into doubting the
write before doubting the restart. `Tools/sim.sh` stops first now.

A third thing is worth writing down as a fault that has not been fixed. A
citizen's kit is rebuilt when a SIGNATURE of what they are carrying changes,
and that signature names the verb and the equipment -- not the contents of the
table those name. In play the table does not change while the world is
running, so it never matters. It matters a great deal when the table is being
edited to look at something, which is exactly when a person is least likely to
suspect their tools.

## 33. The rest of the kit, and one people in two windows

### Several at once

A restart is the slow part of looking at something, and every piece names its
own bone -- so a kit can be the concatenation of several kits and they all hang
where they belong. A sword in the right hand, a bow in the left, a helm on the
head and a cuirass on the chest, in one restart instead of four.

Two of the four were badly wrong and one was subtly wrong, which is about the
rate the hatchet predicted.

**A bow rolled flat is a lance.** It lay horizontally through the citizen's
ribs and out the far side. Upright along the arm, like everything else held.

**Round things cannot face the wrong way.** A cuirass drawn as a slab came out
as a sandwich board hung off the back, because a spine bone's other two axes
are not the ones you would guess and there is no guessing them from a still.
A cylinder about the spine is a breastplate from every angle and needs to know
nothing. The same goes for a helm.

### Can the browser window's people be used here?

Not as assets: there are none. `window-3d` has a rigged-model path and it is
switched OFF, pointing at a three.js demo file on the open web -- its people
are hand-built from primitives, a lathe torso and a torus collar and a cone for
a nose, exactly the approach taken here.

What it has that IS worth taking is the DERIVATION. It reads the first eight
hex digits of a citizen's id and gets their whole appearance from it: tunic
hue, one skin of six, one hair of seven. This window now reads the same digits
and the same tables, so a citizen is recognisably the same person whichever
window they are seen through -- and "the woman in the blue kirtle" stays a
sentence somebody can act on across the two.

Two details fell out of that. Those palettes are sRGB bytes off a web page and
the renderer works in linear light, so they need converting or they come out
washed and chalky. And tinting the hose from the same hue made the whole figure
one colour head to boot, which is not how anybody has ever dressed: the dye
went on the garment that showed.

## 34. The editor wedges, and `kill` then waits forever

Rebuilding a master material while a Simulate session was running left the
editor alive, holding port 8000, accepting connections and never answering
one. Every MCP call sat until its timeout.

It happened TWICE, the second time deliberately enough to be sure of the
trigger: recompiling a material that actors in the running session are using
wedges the editor, and it wedges on the FIRST call of the rebuild, so the
StopPIE sent afterwards never lands either. Editor-only work during PIE is
documented as unreliable; the rule here is stronger and simpler. **Stop the
session before touching a material, not after noticing.**

What cost the time was the recovery. `ue.sh` sent SIGTERM and then waited for
the process to disappear, and a wedged editor never disappears: the script hung
too, so "restart the editor" produced no editor and no error. It now asks for
twenty seconds and then sends SIGKILL.

Nothing was lost, because every asset this session touched had been saved
through `save_assets` as it was written. That is the reason to save as you go
rather than at the end: the editor's own memory is not where the work lives.
## 35. The people, third attempt

Three CC0 packs were tried. The first two failed on JUDGEMENT, not pipeline,
and both failures are the same mistake in different clothes: I looked at a pack
and did not look at the pack NEXT TO THIS WORLD.

**KayKit adventurers.** Beautiful, and chibi -- a big-headed four-foot figure
standing beside a timbered house modelled at human scale reads as a visitor
from another game. Proportion, not polygon count.

**Quaternius Ultimate Modular Characters.** Right proportions, wrong century.
Its "Worker" is a hi-vis jacket and a hard hat; its "Adventurer" is a business
suit and a tie. Only the women's Medieval and Witch belonged here at all, and I
found that out by rendering the whole wardrobe as a contact sheet before
wiring any of it up -- which is the cheap step that should come first every
time.

**Quaternius Universal.** Modular Character Outfits - Fantasy (peasants and
hooded rangers), Universal Base Characters (bodies, heads, faces, six
hairstyles), Universal Animation Library (forty-three motions), Medieval
Weapons. All CC0, all free tiers, all on ONE skeleton -- and that skeleton is
**Epic's own**: root, pelvis, spine_01, clavicle_l, hand_r, with real finger
bones. Any animation made for the Unreal mannequin will play on these people
untouched, and `hand_r` is a hand whose axes run the way a hand's do.

### The hair is dyed, not painted

The hairstyles ship as their own meshes rigged to the head bone -- the base
body has a face, eyes and eyebrows and no hair at all -- and their atlases are
NEUTRAL GREY. Measured rather than assumed: both average about (143,143,141)
with everything between 88 and 178, which is strand detail and no colour. So
the colour comes from the citizen, off a different turn of the same key than
their clothes, out of a palette of six colours hair actually comes in. A hue
wheel is the wrong instrument for hair: it gives somebody green eventually, and
there is no village where that reads as variety.

They also ship no ORM sheet, so roughness has to be told rather than read --
reading it out of the colour map makes dark hair mirror-smooth, a black bob
with a highlight like a car bonnet. `RoughFloor` is the least rough a surface
is allowed to be, which is a thing the art cannot say and a level can.

### Three things that cost an hour each

**The free base body does not fit the free clothes.** A citizen is two meshes:
the outfit, which stops at the collar, and a bare body, which is where the face
comes from. The free base is the "Superhero" physique and the outfits are cut
for the "Regular" one, so the chest and biceps stand several centimetres
outside the shirt. Holding the cloth off the skin at 0.8, 2.0 and 3.0 cm and
photographing each is what proved it was not depth-fighting -- none of them
helped, because the body is simply bigger. The body is only there for a head,
so below the collar it is not drawn: `Cut`, a height in the figure's own BIND
POSE, masks it away. Bind pose and not current pose, or a raised arm takes a
shoulder's worth of skin with it.

**"Compile: clean" was a lie I wrote myself.** The builder grepped the
recompile output for the word `error`. Unreal answers a broken material with
"Material failed to compile: ..." and the word never appears, so a material
that was falling back to the default grey one reported clean. Three separate
afternoons in this project have now been spent on "why is it grey"; the check
looks for failure now, not for a word.

**A Custom node cannot be in two shaders at once.** `PreSkinnedPosition` is not
available to the pixel shader, so the cut has to cross by a VertexInterpolator
(pins `VS` in, `PS` out). But a Custom node that reads an interpolator is a
pixel-shader node, and World Position Offset is a vertex-shader output, so the
same node cannot also do the cloth stand-off. That is a plain multiply of the
vertex normal and belongs in the graph, not in the node.

## 36. The ramparts, and a measurement that lied

Anchor is a walled town and always has been. `rampart` is a node type the
world uses eight hundred and forty-two times in this founding, a hundred and
eighty-six of them ringing Anchor from (440,247) to (491,282). The gaps in that
ring are the gates -- the world leaves tiles out and stands a `guard` in each
opening, five of them at Anchor -- so the window never has to work out where a
way through belongs. The word was already being drawn. It was being drawn as a
scaled cube, which is a garden wall, and that is the whole of what was wrong.

What a level now says is how to BUILD the word: a curtain 6.4 m to the walkway
and 2.6 m thick, teeth along the top, a tower wherever the told run turns and
every nine tiles along the long straights, and a gatepost wherever the world
stopped laying stones. Corners are found from the told tiles themselves, so a
tower lands where the world actually bent its wall rather than where a
rectangle would have put one.

### The measurement that lied

Before any of that, I swept every node in the frame for a wall-shaped KIND,
found barrels and oaks and benches on Anchor's boundary and nothing else, and
concluded that the world does not say any town is walled -- that a wall would
be this window's invention, and wrote several careful paragraphs justifying the
invention as a rendering convention.

All of it was wrong, and wrong in a way worth remembering. Nodes carry a `type`
AND a `kind`; `landmark/half-wall` has both, and `rampart` has a type and **no
kind at all**. A sweep of kinds cannot see it. The frame had 3160 `wall` and
842 `rampart` nodes sitting in plain view the entire time.

**When a measurement says a thing the world obviously has does not exist, doubt
the measurement.** Anchor looked walled in every screenshot taken that
afternoon. The right response to "the data says otherwise" was to go and find
the other field, not to start writing justifications for inventing one.

It also took the user saying "I think rampart was what I meant" to turn the
question round. The window's own vocabulary was there to be read -- `rampart`
was already a key in the look asset's own Props table, next to `wall` and
`tollgate` and `guard`.

## 37. The rain, and the silent orphan

The curtain is a cylinder of streaks that rides with the citizen, and at
fourteen metres across you could see where the rain stopped: from a camera a
few metres off their shoulder the far wall was a clean vertical line with a dry
village behind it, which reads as a rain machine following one person around.
It is forty-five metres now, its silhouette fades where the wall turns edge-on
to the eye, and rain falls across the whole view.

Two things had to be understood to widen it, and one of them cost the evening.

### A column is an ANGLE

Widening the drum, I first scaled the column count with the radius so that a
column stayed four centimetres of wall whatever the size. That is exactly
backwards and drew nothing at all. A streak is SEEN, not measured: four
centimetres at fourteen metres is a few pixels, and the same four centimetres
at forty-five metres falls below one pixel and averages into a faint wash.
Fixed angle is fixed apparent width, so a distant streak is correctly wider in
the world. What does want scaling with the drum is the streaks' LENGTH and
SPEED, which are seen at a distance too.

### Deleting a material orphans every live pointer to it

`make_rain.py` deletes the material and creates a new one at the same path.
Everything already loaded in the running editor -- the look asset above all --
goes on pointing at the OLD object, which is now trash. A material instance
made from a trashed material renders **nothing**: no warning, no error, a clean
compile, an asset that reads back with all the right properties, and a
component that reports itself visible, correctly placed, correctly scaled, with
the right mesh and a material of the right name.

Every one of those things was checked, and each came back healthy, which is
what made it take so long. A solid-red probe rendered fine one minute and
nothing the next, and the difference was not the shader -- it was whether the
editor had been restarted since the material was last rebuilt.

Running `apply.py` after a material rebuild re-creates the look asset and
re-resolves the pointer. Every `make_*.py` now says so in its own last line.

### And one wasted hour that was nobody's fault but mine

Half of that evening was spent photographing a citizen the curtain was not
centred on. The window follows **`Frame.Me`** -- our citizen, at Anchor -- and
I was photographing the other player in the world, nine kilometres away,
wondering why the rain would not appear. The wet ground was global and looked
right, which made the frame seem half-working rather than aimed at the wrong
person. `Tools/look.py` exists now and asks the bridge where OUR citizen is.

### Two knobs moved to the asset

`RainRadius` and `ForceRain` used to live on the hour actor. A level-placed
actor's SAVED property beats the C++ default, and an external-actor package is
a thing this project cannot write under automation -- so changing the default
did nothing, silently, and an hour went into photographing dry meadows. They
live on the look asset now, where `apply.py` can reach them. This is the third
time that lesson has been learned in this file.

### And a log, at last

The project had no `Saved/Logs` at all and every `UE_LOG` written this session
went nowhere. `ue.sh` passes `-abslog=/tmp/ue.log` now. Debugging a renderer
without a log is how an evening goes the way this one did.

## 38. One bad reference empties a table

Wiring the bestiary, the setter answered "the following properties could not be
set: Mobs" and the mob table went from twenty-two rows to eleven. The refusal
is not partial in the way the array setter's is -- the write is rejected whole,
and what is left behind is whatever the freshly re-created asset had, which is
half of nothing.

The cause was one path. The importer had renamed the skeleton mesh to
`Skeleton1`, because an asset of type Skeleton already owned `Skeleton` in that
folder, and the FOLDER kept the original name. Four rows pointed at
`/Beasts/Skeleton1/Skeleton1`, which does not exist, and **one dangling object
reference makes the setter refuse every row in the map**, including the
twenty-one that were fine.

Two things follow, and both are now in the scripts:

**Never trust the obvious asset path.** The importer renames on collision and
does not say so. `beasts.json` records what it actually made; the table is
built from that.

**A script that reads a table and writes it back will propagate its own
damage.** apply.py reads `Mobs` out of the look asset, so once the asset was
short by half it stayed short by half every run afterwards. The citizens actor
still carried the original, and apply.py now takes whichever copy is longer.
Any table this project edits in place wants that guard.

## 39. Three silent ways to turn the world grey

A night's work on the foliage was interrupted twice by the whole island going
colourless, and both times the cause was a script doing exactly what it was
written to do. They are worth listing together because they are the same shape:
**an asset is deleted and re-created at the same path, and everything that
pointed at the old one goes on pointing at the old one.** Nothing errors.

**A master material orphans its instances.** Every `make_*.py` deletes its
material and makes another. Every `MP_*` instance parented to it then renders
as the engine's default grey, while still reading back with all the right
parameters and a clean compile. The `dress_*` scripts have to run afterwards --
all of them, every time.

**A parameter collection orphans its readers, and worse.** A material does not
reference a collection parameter by NAME; it stores the parameter's GUID, and a
fresh collection mints fresh GUIDs. So deleting and re-creating
`MPC_IntervalSky` silently unbinds the weather from the ground, the rain, the
flames, the water and the people at once -- the collection reads back with all
five parameter names present and correct, and the ground quietly stops knowing
whether it is raining. It cost a green meadow turning to bare earth.
`make_mpc.py` updates in place now and says why at length.

**And the look asset points at all of it**, so it is rebuilt last.

`Tools/rebuild.sh` does the three in the one order that works. The bestiary is
not in it, because re-parenting seventy imported instances needs a commandlet
and a commandlet needs the editor closed.

### The general rule

When a thing in this project goes grey, the question is not "what did I break
in the shader". It is **"what did I re-create, and what was pointing at it?"**
That question would have saved an hour on the rain curtain in §37 and two more
here.

## 40. The night's work: weather you can see

### The dead are the living, drained

The cartoon skeleton was dropped -- the user's judgement, and plainly right
beside people modelled at human proportions. It was the chibi mistake again in
a smaller place. The five words for a corpse that walks now take the citizens'
OWN body, uncut and drained of colour by a `Pallor` parameter, out of a copy
made so that dressing a corpse cannot touch the living. And it turned up a bug
worth having found: `skeleton-knight` already pointed at the base body, whose
materials are masked off at the neck so that clothes can cover the rest, so it
had been rendering as a floating head.

The kit's snake went back to being a primitive. It has cartoon eyes the size of
its head, and a thing that claims to be a snake and is a cartoon is worse than
a shape that claims nothing.

### Wind

`Gale` is a new channel on the collection, derived rather than invented: the
world reports overcast and rain, and a wet grey day is a windy one. Every plant
reads it, so a field leans together.

Two things had to be got right. **A column is an angle**, and the wind node had
to be **its own node**: the material's other Custom node reads a vertex
interpolator, which makes it pixel-only, and world position offset is a vertex
output. Bark and leaves of one tree must share both numbers or the trunk holds
still while the canopy walks off, and the tree tears at the join.

### Somebody walking through it

`Walker` is a vector on the same collection, set once a frame to where the
citizen is standing. Within about a metre and a half of a pair of boots the
grass is pushed radially away and flattened, and it springs back behind them
because the only thing it ever knew was where they are NOW -- one vector, no
memory, and the difference between walking through a meadow and walking
through a photograph of one.

### A tile may carry more than one thing

The scatter plane allowed exactly one thing per two-metre tile, so a meadow at
ninety per cent was ninety per cent of tiles carrying ONE tuft. Each try now
gets its own scramble of the same tile byte, so a tile can carry seven and the
arrangement is still a pure function of the tile -- which is the property that
makes every window agree about it.

### A wood is not one tree repeated

`Variants` on a prop kind: a word may name five meshes and a node picks one by
its own id. So the crooked oak at the ford is the same crooked oak in every
window and tomorrow, which is what makes it a landmark somebody can name.

### The keepers are people

Twenty-three trades stood at stalls as cylinders with hats on. A prop kind can
now carry a whole modular figure -- `Skeletal` leads, `SkeletalParts` follow --
which is the citizens' own arrangement moved across, and the structures actor
grew a component path for the handful of nodes that need one. The gate guards
got the same treatment. A stall is still a stall: the world has both words, and
turning both into people put a shopkeeper where the shop should be.

### One node broke every person and no tree

The wind reads how far up the plant a vertex is, and the obvious node for that
is `LocalPosition`. It is correct on a static mesh and it breaks the material
on a SKELETAL one -- silently. The recompile reports clean, every tree and
barrel and helmet in the world renders perfectly, and every PERSON turns the
engine's default grey, because only the skeletal permutation failed to build.

It took a while to see because the evidence pointed at the instances: the grey
figure's material had the right parent, the right texture, and was correctly
assigned to the right slot on the right mesh, and the usage flags were set. All
of that was true. The material simply had no skeletal permutation.

`PreSkinnedPosition` is the vertex before any bone has moved it -- the same
thing as local position on a tree, and the right thing on a body. The rule that
falls out is worth keeping: **when something renders for static meshes and not
for skeletal ones, suspect the material's vertex chain, not the instances.**

### An hour you can choose

A day here is long in wall-clock terms -- long enough that photographing a
change to the ground can mean waiting the better part of an hour for the sun,
and a screenshot taken in the dark is not a check but a guess with a picture
attached. More than one thing in these notes was "measured" at midnight and got
the wrong answer for it: the wind was declared barely visible on the strength
of two frames of a black field.

`ForceDay` on the look asset sets the hour the way `ForceRain` sets the
weather, and for the same reason and with the same rule: below zero the world
decides. It changes nothing but pixels.

### And a hall is dark at noon

`bLightAtNightOnly` keeps the window from paying for a hundred hearths in broad
daylight, which outdoors is right and indoors is exactly wrong: a roof stops
the sky. A fire under a roof now burns whatever the hour. The window already
worked out which tiles are roofed, for the walls.

## 42. The night the black came out of the world

Everything in this section is one fault wearing five hats. A surface the sun
could not see came out BLACK -- not dark, black -- and every time it was met it
looked like a different bug, because it was met on a different surface each
time.

### The measurement that averaged the background in

The leaf sheets "measured" (38, 46, 19) in sRGB, near enough to black, and that
number is why a `Lift` multiply was added to the person master and set to 4.2
on every canopy. The number is wrong. `Leaves_NormalTree_C` is a 1024-square
PALETTE and 78 per cent of it is fully transparent; `Tools/sheet.py` composites
transparency onto a flat (24,24,24) so that a contact sheet has something to
show, so averaging the file averaged the grey. Over the OPAQUE pixels the leaf
is a single flat (88, 123, 0) -- 0.16 luminance in linear, an ordinary healthy
green.

`sheet.read_raw` now exists and keeps the alpha, and the rule is written on the
`Lift` input: **measure a sheet with its alpha, or you are measuring the
decoder.**

### Half the art had its colour map hung in the ORM slot

`AO` was read from the red channel of the ORM texture. The nature kit ships no
ORM, nor do the hairstyles, nor the armour, so the COLOUR map stood in for one
-- and a colour map's red channel is not occlusion, it is how red the thing is.
A green leaf is (88, 123, 0). Red 88 is 0.10 in linear. Every canopy in the
world was telling the renderer that ninety per cent of the sky was blocked from
reaching a leaf hanging in open air.

`AOFloor` is the answer: a floor, not a switch, so a sheet that really is an ORM
keeps its occlusion. One for everything standing in, zero for the outfits and
the props that ship the real thing.

### A leaf is lit from behind

With the occlusion fixed the canopies still read as half-bright, half-black:
the cards facing the sun were green and the rest were not. That is what
Default Lit does to a thin translucent sheet, because it has no path for light
that goes THROUGH a surface, and most of what you see of a canopy backlit is
exactly that.

So `make_person_mat.py` now builds the same shader twice -- `M_IntervalPerson`
and `M_IntervalFoliage`, the second with the Two Sided Foliage shading model
and a `Trans` output feeding Subsurface Colour. One script, two masters, so a
fix to the dye or the weather or the wind lands on the wood and the citizen
together. Leaves, grass, petals and bushes take the foliage master; bark, stone
and mushroom caps do not, because a boulder that glows from the inside is worse
than a dark one.

### And the exposure was undoing the hour

The post process volume came with the template and nobody had read it. Auto
exposure was on, ranging 0.12 to 1.4, which means the window spent six seconds
after every change in the light UNDOING that change: midnight and midday came
out the same brightness and only the colour survived. Everything this project
does to make the hour legible was being cancelled by one checkbox.

It is pinned now -- minimum equal to maximum -- and `FilmToe` came down from
the template's 0.55, which is how hard the tonemapper crushes the dark end.
`Tools/make_post.py` writes both, with the reasons, and is in `rebuild.sh`.

### `SkyLift`, which is a number to look at

Even with all of that, a face that the sun cannot see is lit by the sky and by
nothing else, and the sky in this window is captured against a sun of 6.2 in
whatever units the project settled on rather than the hundred thousand lux of a
real noon. The ratio that falls out is not the ratio outdoors. `SkyLift` on the
look asset multiplies it, and the note on the property says plainly that nobody
here can derive the right value and it is meant to be looked at.

### The man in the market place was a green balloon

Found while photographing the above, and nothing to do with it. `wind.hlsl`
pushes vegetation away from wherever the citizen is standing -- and the tread
was not gated by `Sway`, which is the one thing in that material that says
"this surface is a plant". A citizen's tunic has `Sway` 0, correctly, and was
standing at EXACTLY the walker position, because the walker IS that citizen.
`Tread` came out 1, forty-six centimetres of shove went out along every vertex,
and the ranger in Anchor's market place was a green balloon with boots on.

The wind and the tread now answer to the same switch.

### A wall is made of stones

`M_IntervalProp` was a vector wired to base colour and a scalar wired to
roughness: no weather, no grain, no courses. Anchor's ramparts are six and a
half metres of it and read as tan cardboard. The fourteen prop instances were
moved onto `M_IntervalFlat` -- one master for anything that is a flat colour --
which grew world-space grain at two scales and, where `Course` is not zero,
masonry: blocks of that height, every other row offset by half, a mortar line
between them and no two stones quite the same colour. All of it a pure function
of world position, so the joint between two wall segments cannot show and every
window computes the same stones.

`Tools/make_prop.py` is new and holds those fourteen colours and what each one
is for; they existed only as hand-made assets before, with no record of why a
stone is 0.33 grey.

### `incursion` was a family, not a creature

It had been left deliberately undrawn -- "nothing in the frame says what an
incursion looks like, and a cylinder claiming to be one is worse than a
findable gap". The gap was findable, and the user filled it: an incursion has
faces. `woodwraith`, `gargoyle`, `drownling`, `wilds-shade`, `haunt`, and the
bare word is the generic fallback.

The field was in the frame the whole time. `ParseEntity` flattens every key a
mob carries into `Fields`, so `face` had been arriving since the door was
written; nothing in this window had been asking for it, because the bestiary
was looked up by `type` alone while nodes had always preferred `type.kind`.
`AIntervalCitizens::MobKey` now makes the same preference, falling back to the
bare word so a world that grows a sixth face still draws.

Two things fell out of wiring it:

  **The cast digest has to see the face.** It hashed `type`, so a second
  incursion with a different face would never have caused a pool to be built.

  **A material named for a mob paints the WHOLE figure.** It was set on slot
  zero only, and these figures are modular -- skin, hair, eyes and outfit are
  separate slots on one mesh -- so the first woodwraith came out in a mossy
  shirt with a citizen's face still on it.

The look is the browser's own decision, not a new one: one silhouette in five
skins. The same walking-corpse figure the risen use, standing a little taller
and a little off the ground because the thing has no feet, painted whole in the
colour of the country it was conjured out of. The five colours are the hexes
the other windows use, converted in `make_prop.py` rather than eyeballed, so a
woodwraith is the same green in Unreal as it is in a tab.

### 261 MB of dropped art, gone

With the user's go-ahead. `Content/Interval/KayKit` (175 MB), `Art/KayKit`
(37 MB), and the `Men` and `Women` halves of the Quaternius modular characters
(15 + 13 MB imported, 11 + 10 MB source).

**What did NOT go, and nearly did.** `Art/Quaternius` and
`Content/Interval/Quaternius` were on the list as whole folders, and both hold
a live `Weapons`/`Kit` beside the dead halves -- every blade, bow and shield a
citizen carries. `apply.py` names twenty-four of them. Reading the folder
before deleting it is the only reason the world still has weapons in it.

Nothing referenced the deleted art: the look asset, all three level actors and
every table were checked for a path into it first, and all came back zero. The
import scripts are kept, with a line at the top saying the art is gone and why
-- they are the record of how it was brought in, and the packs are CC0 and can
be fetched again.

### A dashed line is a line

Anchor's wall looked, from the road, like a picket of free-standing stone
slabs. The builder was not wrong: it lays a curtain a full tile long so
consecutive stones meet, and the boxes are thicker than a tile, so nothing
can fall between them. The TILES were the dashes. The world tells this wall
every other tile the whole way round -- a line sampled, not a line drawn --
and taken literally that is a hundred and forty-one gateposts and about
seventy holes.

`CloseGapsUpTo` reads it as a line: a hole of that many tiles or fewer with
told stone on both sides is filled in. It does not invent a wall anywhere the
world did not put one, and it leaves the wide holes alone -- which is where
the gates are, and where the world already stands a guard and runs a road.

### An editor that is up, listening, and answering nothing

Twenty minutes went on a restart that never finished. The process was running,
`lsof` showed the MCP port LISTENING, connections were accepted -- and every
call timed out. The log's last line was a font loading successfully, and the
frame counter never left zero.

An editor that did not exit cleanly leaves `Saved/Autosaves/PackageRestoreData.json`
behind, and the next one opens a modal "these packages have newer auto-saved
versions -- restore them?" box before it finishes starting. MCP dispatch runs
on the game thread, and the game thread is sitting in that dialog's message
loop. Under automation there is nobody to click it and nothing says so.

`ue.sh` deletes that file before launching now. Declining the restore is the
right answer here, because every asset these scripts touch is saved explicitly
by the script that touched it.

**A game thread stuck at frame zero is a dialog until proved otherwise.**

### The armour, finished, by cutting up a knight

Every armour word the world names is now drawn -- thirteen of thirteen, where
this morning it was eight, and the five that were missing were all `*-plate`.

Nothing CC0 in any pack in use ships a breastplate: the free tiers carry helms
and nothing for the body. Three OpenGameArt candidates were looked at and all
three rejected on their own pages -- "Fantasy Breastplate" is CC-BY-SA 3.0,
"Leather Breastplate" is CC-BY 3.0, and a pack the site's own **CC0 filter
returned** says CC-BY 4.0 in its own licence field. The filter is not the
licence; the page is.

Quaternius's CC0 **LowPoly Animated Knight** does have one, and gave four other
things besides: three more helmets and a pair of shoulder pads, all rigid
props. But his whole suit of armour is ONE material group called `Armor`,
greaves to gorget.

So `Tools/slice_obj.py` cuts it out. A `.obj` is a text file of vertices and
faces; taking the faces that use one material, and of those the ones lying
between two heights, is arithmetic. The cut is y 2.45 to 4.05 out of a figure
5.58 tall, which is waist to gorget, and it is left open at the waist and the
arm holes because it is worn over a body and the body is what shows through.
Two rules fell out of doing it: take the WHOLE face or none of it, or you get
shards of metal hanging in the air where a triangle straddled the cut; and move
the piece to its own origin, or the offset that hangs it on a bone is a number
nobody can read.

`Tools/rack.py` is the other half. A helmet cannot be judged from an asset
thumbnail -- for a mesh two centimetres across it comes out as a speck -- and a
breastplate cannot be judged in the world, because the world gives one to
somebody when it feels like it and not before. So they are stood in a row in
the editor level, photographed, and deleted again. It is how the roll of minus
ninety was found: these `.obj` files are modelled Y-up and arrive lying on
their backs, and a breastplate photographed edge-on is a sheet of paper.

And the guards wear it. The world stands a `guard` in each gap it leaves in
Anchor's ramparts, and a man in a hood is not what should be standing in a
gateway.

### The second way an editor is up and answering nothing

The first was a modal dialog (above). This one is different and looks the same
from outside: the editor starts, every toolset registers, the log is clean, it
is ticking frames -- and the MCP HTTP server never binds. `lsof` on the process
shows it listening on 1985 and nothing else. There is no error anywhere.

`ue.sh` now waits for port 8000 after launching and says so if it does not
come up, which turns four minutes of "it must still be starting" into one line.

### Nine minutes of a rebuild was the rebuild talking to itself

Every `dress_*` script called `mcp.py` as a COMMAND -- a fresh interpreter, a
fresh connection and a fresh MCP `initialize` per material parameter, several
hundred times. `Tools/rpc.py` opens the session once and keeps it. `apply.py`
went from minutes to five seconds and the whole wardrobe from twenty-five
minutes to under seven, which is the difference between looking at a change
twice an hour and looking at it whenever you like.

## 42b. A naked bodybuilder walking across a moor

The bestiary had never been looked at all at once, because the world hands out
a wolf or a barrow-wight when it feels like it and not when somebody is
watching. `Tools/gallery.py` stands the art up in the editor instead -- in a
grid, wearing what the LOOK ASSET says it wears, lit for the photograph and
taken down again -- and reads the look asset rather than the tables in Tools/,
because the look asset is what the window actually uses. A row that is wrong
there is wrong in the world.

The first sheet showed it: every humanoid in the bestiary was nude. The risen,
the gibbet dead, the gibbet king, the skeleton knight and all five faces of an
incursion are the citizens' own body, and that body is a BARE one -- an outfit
is a separate mesh that follows its pose, which is how a citizen is built. The
mob path in `AIntervalCitizens` only ever set `Skeletal`; `SkeletalParts` was
in the struct and used by the keepers and simply never read here.

It is read now, with the same leader-and-follower the citizens and the keepers
use, and two things came with it: a part attached to the ACTOR rather than to
the leader is culled the moment the camera looks away from the actor's origin,
and `SetVisibility` does not reach a child unless told to -- a hidden wight
left its outfit standing on the moor.

The dead now wear peasant cloth, and their material was changed to cut at the
collar like the living, for the reason it always was: the free base figure is a
broader physique than the outfits are cut for and stands several centimetres
outside them.

And the incursion wears the ranger's hood, which is the only hooded outfit in
the wardrobe, with the country's colour painted over the body AND the outfit.
That is what makes it a conjured thing rather than somebody in a cloak, and it
is the browser's silhouette arrived at from the other end.

`skeleton-knight` lost a stale override on the way. It had been forced onto the
LIVING base figure back when that was the only way to get it off a cartoon
skeleton -- which gave it a living man's face, and, once the bestiary started
wearing clothes, a bare one, because the living copy is uncut and undressed.

**One bug the gallery introduced and then caught.** It moves the level's sun to
light the photograph and puts it back afterwards, except that it did not:
`get_properties` answers `{"returnValue": "<json>"}` -- the properties are a
STRING inside an envelope -- and handing the envelope back to `set_properties`
sets a property called `returnValue`, which fails without saying so. The sun
sat where the photograph left it for three runs. It is unwrapped twice now. The
level was never saved, so the sun on disk is untouched.

## 43. Can a pillar serve this window?

Yes, and it already does -- on the same protocol as every other window, with
one real mismatch that is worth knowing about.

### What the window is actually on

`unreal-bridge.mjs` is not a special case. It `adopt`s with the citizen's
public key, asks for one `resync`, and from then on takes `patch` messages,
applies them with `applyTick`, keeps `zonesAround(me.x, me.y)` and evicts
everything outside. That is the zone-delta path `serve.mjs` built for the
browser windows, and it is the cheap one.

The numbers are the pillar's own, measured and written down in `serve.mjs`:

  the old shape  -- whole state to every socket -- was 10.3 MB per client per
  second at 20,000 present, and about a hundred windows saturated a gigabit;

  the shape now is **25 KB per client per interval** at 20,000 present, 4.1 Gbps
  aggregate, because nodes are world-scope and sent once while players, mobs
  and ground are cut into 32-tile zones and each socket gets the 3x3 around it;

  fan-out cost tracks BYTES rather than sockets, so one process serves
  **about ten thousand windows** on a modern core at 30% of the interval. Past
  that you run another pillar, and a pillar is a peer.

Nothing about this window adds to that. The sky is computed locally by the
bridge from the tick, off the shared ladder; the look asset is local; no extra
subscription is asked for. From the pillar's side an Unreal window is one more
socket in a zone.

### The mismatch: it draws twice as far as it is told

`view.mjs` sends `ZONE = 32` tiles with `VIEW_ZONES = 1`, so a socket is told
about **96 x 96 tiles**, 192 m on a side.

`AIntervalGround::Rings = 1` over `IntervalGeometry::ChunkTiles = 64` keeps a
3x3 of 64-tile chunks: **192 x 192 tiles**, 384 m on a side.

Exactly twice the span. That is what the blank ring in the wide shots is --
not a streaming bug and not a rendering one. The outer half of every chunk has
no ground codes because nobody sent any, so it falls back to layer 0. Nodes
still draw out there, because nodes are world-scope, which is why distant trees
and rooftops hang over blank ground in an aerial photograph.

Three honest answers and none of them is obviously right:

  **`Rings = 0`** -- one 64-tile chunk, 128 m, comfortably inside what is sent.
  Everything drawn is real. The view gets much smaller.

  **A 32-tile chunk with `Rings = 1`** -- 96 tiles, which matches the
  subscription exactly. Costs a chunk-size change and more draw calls.

  **Ask for more zones.** `VIEW_ZONES` is a module constant on the pillar, so
  raising it raises it for every client, and the browser windows render
  14/ZOOM by 10/ZOOM tiles and do not want it.

The third is the only one that makes a top-down window genuinely wide, and it
is a conversation with the pillar rather than a change to this window.

### The key is not a pillar question

A pillar never sees one. `act()` in the bridge is the only place a signature is
made: Unreal sends a noun and a couple of integers, the bridge builds the
canonical input through the engine's own normalizer and signs it. So a pillar
could serve a READ-ONLY Unreal window directly and nothing would break -- this
window sends no intents at all today -- but the moment it acts it needs a door
to sign for it, and that door is where the key lives.

## 44. The gate, and the afternoon spent tuning a volume nobody was reading

### The air was never the level's to set

`AIntervalAir` spawns itself UNBOUND at priority ten, over anything the level
carries -- it says so in its own constructor comment -- and it overrides
exposure, ambient occlusion, the whole film curve, vignette, grain and sharpen.
`Tools/make_post.py` wrote every one of those onto the level's own
PostProcessVolume at priority one, and every one of them lost.

So the shadow work in §42 needs correcting. The exposure pin never applied. The
film toe never applied. What actually opened the shadows was `SkyLift`, the
occlusion floor and the two-sided foliage -- and the claim that "auto exposure
was undoing the hour" was overstated besides: the band is 0.12 to 1.4, about
three and a half stops, which COMPRESSES a night towards a day rather than
cancelling it.

The numbers were right and the PLACE was wrong. `ExposureAt`, `FilmToe` and
`Occlusion` are on the look asset now and the air reads them; `make_post.py` is
kept as the record and is out of `rebuild.sh`.

**A property that is being overridden looks exactly like a property that is
being ignored, and both look like a number that did not matter.**

### And the pinned exposure, measured rather than argued

Which direction `AutoExposureMinBrightness` goes was worth three wrong
paragraphs of reasoning and one photograph each. At the same forced hour, from
the same camera, mean luminance over the frame:

| exposure | mean |
|---|---|
| pinned at 0.62 | 74.6 |
| automatic (0.12 – 1.4) | 67.7 |
| pinned at 1.25 | 60.6 |

So a LOWER pinned value is a brighter picture, and 0.62 is a small lift over
what the band was doing anyway. The number stays.

### The gate

Every other window has a door: a plate with the world's name on it, the theme
playing, and the world moving behind the glass while you decide to go in. This
one opened straight into the middle of somebody's life.

`AIntervalGate` is that door, built the way `AIntervalDoor` is -- a widget tree
in C++, no asset -- with the browser's own words in the browser's own order:
INTERVAL, "a world that runs on rules, not servers", which window this is, the
world and the interval, and one button. What it does NOT carry is the key row.
The flat window offers to export and import a key because the key is in that
tab; here it is in the bridge, and the plate says where the file is and stops.

Three things fell out of building it.

**The gate takes itself down where there is no player controller**, which is
every Simulate session and therefore every photograph in these notes. Nothing
in the capture tooling had to learn it exists.

**The button cannot be pressed by automation.** The PIE viewport's UMG does not
appear in the editor's Slate tree at all -- `Snapshot` walks the editor windows
and finds a Message Log and a menu bar and nothing of the game. So the gate
also opens when a level turns `bGate` off, which exercises the same path and is
how it was proved: the plate goes, the log says so, the view blends.

**And it opened onto a blue disc.** Handing the view back to the player pawn
put the TopDown template's mannequin at the origin, which is sea. There is no
pawn to give a window back to. The gate's camera stops going round and settles
behind the citizen instead, and stays there -- which is not a shortcut, it is
what this window is.

### The wild animals, by the fourth route

Nine of the ten primitive mobs now have CC0 art, after three dead ends and one
that worked.

  Quaternius's itch.io has only the FARM animals.

  poly.pizza gates its BUNDLE download behind a reCAPTCHA.

  The official link is a Google Drive folder whose page is rendered by
  JavaScript and carries no file ids at all -- and `embeddedfolderview`, the
  plain-HTML view Drive serves for embedding, lists it perfectly and then
  answers every download with "Quota exceeded". `Tools/drive.py` does that walk
  and reports the quota rather than writing a two-kilobyte web page where a
  mesh should be.

  poly.pizza mirrors the same models ONE AT A TIME, and each model page carries
  a plain CDN link to its .glb with no captcha in front of it.
  `Tools/polypizza.py` searches, reads the licence off the page, and refuses
  anything that is not CC0 -- which matters, because the site hosts CC-BY work
  beside it and a search filter is not a licence.

Found: wolf, goat, crab, goblin, snake, ogre, orc, mermaid, raven and three
unnamed monsters. Still missing: a bear. Nothing CC0 in the first eight results
for bear, grizzly or any word tried.

## 45. Step one: the bestiary stops lying

### Every beast in the world had been standing in its bind pose

Since the first one was drawn. A sheep frozen mid-stride, a wolf on its back
with its legs in the air, a spider splayed flat. It read as a broken import for
weeks and it was nothing of the sort: `FIntervalPropKind` had no motion table,
so the beast path asked the WARDROBE's table -- which holds clips authored for
the citizens' skeleton, and a wolf will not take one. The creatures had simply
never been told to do anything.

`FIntervalPropKind::Motions` is that table now, keyed by the citizens' own
verbs so a word means one thing across the window: `still`, `walk`, `felled`,
`fight`. Three things had to be right:

  **It is a smaller struct.** `FIntervalMotion` holds what a citizen is
  HOLDING, which means it knows about prop parts, which means IntervalMotion.h
  includes IntervalStructures.h and a table declared the other way round is a
  circular include. `FIntervalBeastMotion` is a clip, a rate and whether it
  loops, which is all a wolf needs.

  **A creature with no table falls through to the wardrobe**, and that is not a
  fallback -- the risen, the gibbet king and the five faces an incursion wears
  ARE the citizens' body, so the wardrobe's clips fit them and are the right
  thing to play. Twelve rows have their own table; the humanoid half correctly
  has none.

  **The table is built by matching, not by typing.** Every pack names its clips
  after the creature -- `wolf_aAnimalArmature_Idle`, `SheepArmature_Idle`,
  `SpiderHumanArmature_Spider_Death` -- so `beast_motions()` reads the folder
  and picks the plainest clip for each verb. A hundred and forty asset paths
  typed out by hand would be wrong the first time anything was re-imported.

And a creature is told to stand on the frame it is BUILT, not the one after:
otherwise it is seen once, by everybody, in the pose this was meant to fix.

### A dressing script that reads its own output works exactly once

The crab came out grey. `dress_wild.py` read each slot's colour off the
material the mesh was currently pointing at -- which, on a second run, is the
instance the script made last time, which has no `Constant3Vector`, so every
colour fell back to the grey default. A red crab became a grey crab the moment
anybody re-ran the script, silently.

It reads the import's own material BY NAME now. Interchange names it after the
slot, so the original is always findable and a re-run is a no-op.

**Anything that transforms an asset in place has to be able to find its input
after it has written its output.**

### `Lean`, because half the art is Y-up

The bear measured 247 cm long, 198 cm through and 51 cm from top to bottom,
which is a bear lying on its side -- or rather a bear modelled Y-up, like the
.obj helms before it. There is nothing to fix in the file; it is a convention,
and a convention is a number. `FIntervalPropKind::Lean` is that number, applied
before the world's own yaw so a creature still turns to face where it is going.

### And the bear was on the second page

Nothing CC0 in the first eight results for `bear`. Two of them in the first
eighteen. The search stopped one page too early the first time, and the lesson
is the cheap one: when a search says a common thing does not exist, look
further before believing it.

## 46. Step two: nothing in this world blended

Every figure was driven by `USkeletalMeshComponent::PlayAnimation`, which is the
single-node path: it sets one sequence and plays it, and there is no blend in it
anywhere. So a citizen who stopped walking did not settle into standing -- they
WERE standing, on the next frame, mid-stride. A wolf that started walking
teleported its legs into the first frame of the walk. It is the loudest thing
wrong with how this world moves and it reads as unfinished rather than as
stylised.

### A native animation instance, and no Blueprint

`UIntervalAnimInstance` keeps two clips -- the one being left and the one being
arrived at -- and an alpha between them. No Animation Blueprint, no graph, no
asset: `CreateAnimInstanceProxy` hands back a member proxy and the proxy's
`Evaluate` blends two poses.

**It extracts the poses itself** rather than hosting `FAnimNode_SequencePlayer`s.
That node's fields are private behind setters that come and go between engine
versions, while `UAnimSequence::GetAnimationPose` has been stable for years.
Owning the clock also buys the two things the old path could not do: a start
offset per creature, so a flock does not breathe in unison, and a play rate that
follows how fast the figure is actually crossing the ground.

Two things had to be right and were not, at first:

  **`Update` and `Evaluate`, not `Update_AnyThread` and `Evaluate_AnyThread`.**
  The `_AnyThread` pair belong to `FAnimNode_Base`. Marked `override` on a proxy
  they do not compile -- which is the lucky version of that mistake; without the
  keyword they would have compiled to nothing and silently never run.

  **A clip that does not loop holds its last frame.** Wrapping a death animation
  is a corpse that stands up again every two seconds, which is the sort of thing
  nobody reports because nobody believes they saw it.

### Asking every frame, on purpose

The verb call is no longer guarded by "did the verb change". `CrossFade` early-
outs when asked for the clip that is already arriving -- except that it updates
the RATE. That is what lets something slow its legs as it slows down rather than
only when it stops.

### `Pace`, which cannot be derived

A walk cycle is a fixed number of steps a second, and a citizen in this world
crosses a whole tile in an interval when they are going somewhere and not at all
when they are not. `FIntervalMotion::Pace` is the ground speed a clip was cut
for; the rate is scaled by how far off that the figure actually is.

It is a number to set by watching the feet and nothing else: these clips carry
no root motion, so there is no distance inside them to divide by. Two hundred --
one tile an interval -- is where it starts, because that is the speed everything
was already tuned at, so nothing changes at full speed and everything slower now
moves its legs slower.

### And they turn

A figure's heading is read off the difference between the tile it was on and the
tile it is on, so it changes in eighth turns and nothing in between. Applied
straight, a citizen rounding a corner faces east and then, on one frame, north.
`YawShown` chases the heading instead -- five hundred degrees a second for a
person, three hundred for an animal, because a wolf swinging its whole body
round in a tenth of a second reads as a glitch and at three hundred it reads as
an animal.

## 41. Open, in priority order

1. **A flame is a cone and reads as one up close.** Good at ten paces, plainly
   a cone at two. It also gives off no smoke and does not gutter in wind.
2. **The hood hides the hair and the helm does not hide the hood.** Everything
   worn on the head is drawn at once and they sit inside each other.
3. **Nobody has a face from the front.** The eyes and brow were put in and the
   citizen has been photographed from behind every time since.
3. **The rain makes no sound.** The ambience bed follows the ground underfoot
   and knows nothing about the weather.
4. **No window openings are cut**, only doors. The same threshold trick will
   not find them; the world says nothing about where a window goes.
5. **A fountain has no water in it.** There is no water material for props; the
   basin, plinth and bowl are there and the middle is empty.
6. **The motions are one clip each, with no blending.** A citizen snaps from
   standing to swinging. Walk is the forward clip only, so a citizen crossing
   the screen sideways still faces the way they are going -- correct, but it is
   turning rather than strafing, and there is a directional set sitting unused.
7. **Nothing is heard at a distance**: no hearth crackling as you pass it, no
   river getting louder. The beds follow the tile underfoot and nothing else.
8. **The old item 4:** The frame implies a doorway where the
   generator leaves a gap in a wall, but nothing is actually opened.
5. **The roof does not know the trade.** A stone church wears thatch like
   everything else. The roof is drawn by the chunk, which sees footprints but
   not nodes; the trade would have to reach it the way the key reaches the
   walls.
6. **Name plate placement and culling**: see §13.
7. **The template's floor and blocks still sit at the origin**, which is the
   north-west corner of the island and is sea. Harmless for the vantage
   points, wrong in a wide shot.
8. **The browser windows are still drawing the wrong island**: the one item
   here that affects anybody but this window. See §2.

9. ~~**Anchor should be a fortified town.**~~ Done -- see §36.


10. **The dye has not really been seen.** Every citizen's key sets `Shift`,
    which turns their clothes around the colour wheel and picks their hair out
    of a palette of six, but there are two citizens in this world and a crowd
    is the only thing that would actually show it.
11. **The rangers are bald under their hoods**, deliberately -- a bun through a
    hood is worse than no bun. If a hood ever comes off, they want hair.
13. ~~**The KayKit and old-Quaternius art is still on disk.**~~ Deleted, with
    the user's go-ahead -- 261 MB. The Quaternius WEAPONS were nearly taken
    with them; see §42.
12. ~~**The rain curtain has a visible edge.**~~ Done -- see §37.
13. ~~**Armour is the one thing with no art.**~~ Done -- see §42. Thirteen of
    thirteen. The cuirass is a slice out of a CC0 knight and wants replacing
    with a mesh somebody modelled as a breastplate, when one exists.
14. **What a citizen CARRIES is not drawn**, only what they wield. The frame
    flattens `inventory` to a raw JSON string, so showing a slung bow or a
    quiver on the back needs C++ to read it, not just a table row.
15. **The leaves could follow the season.** The sky already reports `Autumn`
    and `Winter` as numbers, and the twisted trees ship a red leaf sheet
    against the common tree's green -- so a russet October is one lerp in the
    foliage material and one more scalar on the collection.
16. **Five trees per species are imported and one is used.** The kit has
    CommonTree_1..5, Pine_1..5, TwistedTree_1..5, DeadTree_1..5; a word maps to
    exactly one of them, so a wood is one tree repeated. A `Variants` array on
    the prop kind, picked by the node's own id, would make a wood a wood.
17. **Ten mobs are still engine primitives**: bear, carrion-crow, fen-adder,
    goblin, mountain-goat, scree-imp, shore-crab, siren, troll, wolf. The wolf
    and the deer are in Quaternius's CC0 Ultimate Animated Animals and that
    pack is genuinely hard to fetch: it is not on his itch.io (only the FARM
    animals are), poly.pizza gates its download behind reCAPTCHA, and the
    official link is a Google Drive folder whose listing is rendered by
    JavaScript and carries no file ids in the HTML. Three routes tried, three
    dead ends. It wants a browser or the Drive API.
    There is no CC0 bear, goblin or troll anywhere yet. Quaternius's Bestiary
    kit has them and is QAL-licensed, not CC0, so it was not taken.

18. ~~**`incursion` is a mob word with no row.**~~ Drawn -- see §42. It is a
    family of five faces and the bare word is the fallback. A hooded, legless,
    drifting silhouette would be better than the corpse figure standing in for
    it; there is no CC0 one yet.

19. **The red wood.** The nature kit's twisted trees carry a genuinely red leaf
    sheet -- measured (167,23,23) -- and five words take that mesh, so there is
    a belt of scarlet north of Anchor. `willow` was moved off it, because a
    willow is not red. Whether the rest should stay autumn is a judgement
    somebody should make by looking.

20. **Night is now actually night.** With auto exposure pinned, the world's
    hour finally reads -- and a midnight is dim. That is correct and it is also
    a choice: `NoonBrightness` 6.2 against `NightBrightness` 0.55 is about
    three and a half stops. If it is too dark to play through, the number to
    move is `NightBrightness`, not the exposure.
18. **The skeleton and the snake are too cartoonish for this world.** They come
    from the Easy Enemies and Animated Monsters kits and have big round heads
    and cartoon eyes -- the same mismatch that got KayKit dropped. The pig,
    sheep, spider, dragon and fish sit fine. Four words (`risen`,
    `barrow-wight`, `gibbet-dead`, `gibbet-king`) are currently that skeleton.
19. **138 of 180 props are still engine primitives**, now that there is an
    audit that says so. `Tools/audit.py` asks the world for its vocabulary and
    the look asset for its rows, and reports both the words with no row at all
    and the rows that are a scaled cube.
20. **A tile can carry one scattered thing, and a meadow needs a dozen.** The
    scatter plane places at most ONE instance per two-metre tile, so even at
    ninety-two per cent the ground reads as tufts on a lawn rather than as a
    sward. The clumps were made larger to compensate, which helps and is not
    the same thing. Several instances per tile -- each with its own offset off
    the same tile hash, so every window still agrees -- is the real answer.
21. **Everything was scaled against nothing until it was photographed.** The
    trees came in at seven metres and the grass at a metre and a half, which
    put a redwood forest over the village and a man wading chest-deep through a
    pasture. A citizen is 1.81 m and a cottage about four; those are the two
    rulers, and new art should be held up against them before it is wired.
