# Three windows: mist, hill and writ

**Three windows.** `window-mist.html` is first person in eleven tiles of fog.
`window-hill.html` is the same world from above it: an orthographic camera at the
old isometric angle, twenty-odd tiles of country, your own citizen small in the
middle, and the board turned in whole quarters rather than a head being turned.

`window-writ.html` is neither: it is a citizen you **write** rather than steer.
One function, called once an interval, returning one deed — a signature that is
the engine's own rule made into a shape you cannot hold wrongly, since a writ
cannot act twice in a tick because the function returns once. It runs in a
Worker with `fetch`, `XMLHttpRequest`, `WebSocket`, `importScripts` and
`EventSource` deleted before your code is reached; it is handed a state and
returns a deed, which is the same bargain every window here makes. Beside the
world runs a decision log, tick by tick, because watching your citizen do
something stupid and working out why is the actual game.

It is not a macro, and for reasons that come from the engine rather than from
taste: a writ is **not faster than a person** (one input an interval, and §0c
makes a scripted soul sit the same vigil), a run is **checkable** (signed inputs
into a pure function, so a citizen can be published beside its log and replayed
by a stranger), and a citizen becomes an **object you can hand to somebody**.

What it costs, said plainly: a writ is not better than you, but it is
**tireless**, and for gathering, tireless is better. A world where the good play
is to write a woodcutter and go to bed has more work happening in it and fewer
people. The rate limit caps throughput, not attendance, and nothing in that file
fixes it. That is a design decision to take deliberately, not a bug to find later.

`check-window-writ.mjs` is adversarial rather than descriptive, because this
window's central claim is a *constraint*: it hands the sandbox writs that return
arrays, that return strings, that throw, that never return, that go looking for
the network, and that ask for verbs the pillar does not carry — and asserts none
of them buys an advantage a person at a keyboard could not have.

All three share a great deal of code, and that is a **fork** — forks drift. The
sixteen checks are therefore run twice, once against each file
(`check-window-hill-*.mjs` and `check-window-writ-*.mjs` are the same questions
asked of the other two), so
that where the two disagree about the world, the disagreement is caught rather
than discovered.

Two things had to be re-tuned for the projection rather than merely ported.
**The board is sixteen tiles, not the whole built radius** — at twenty-two a
troll was twenty pixels and a fight was legible only through its hitsplats,
which is the mist window's fault in reverse: too much country and not enough of
what is happening in it. `?tiles=N` adjusts it. And **particles are scaled 2.8x**:
a spark sized for something a hand's breadth from your eye is four pixels across
at twelve pixels to the metre, so the entire feedback layer silently vanished —
the deeds still happened and nothing on the screen said so.

The hill window exists because the mist window's projection fights the engine in
two places. Interval's economy wants to be visible at once and a keyhole puts it
behind eight panels; and a world whose mean distance from a land tile to any
built thing is thirty-six tiles is a landscape from above and a corridor from
inside. What the hill window gives up is atmosphere, which is the mist window's
entire argument. Neither is the right answer; they are answers to different
questions, which is the point of a protocol anyone may write a window against.

---

# The mist window

An Interval window that renders the same world the flat window renders, the way
a fifth-generation console would have rendered it: a 320×240 frame, vertices
snapped to whole pixels, textures mapped without perspective so the floor swims,
and fog thick enough to hide that it can only see eleven tiles.

It is not a filter over a modern picture. It is a machine with those limits.
And it does not lie: where a citizen stands, what they carry, what they are
fighting and what it costs are read off the same protocol as every other window
and agree with it tick for tick. The fog is the window's opinion. The tile under
it is not.

---

## Installing

**Two of these files are yours and I changed them.** If you have edited either
since you sent me the project, do NOT overwrite — apply the changes by hand,
they are one line each.

### `serve.mjs` — two routes and the act ladder

```js
if (path === '/play/mist' || path === '/mist') return sendFile('./window-mist.html', 'text/html')
if (path === '/play/hill' || path === '/hill') return sendFile('./window-hill.html', 'text/html')
```

### `serve.mjs` — the act ladder, extended

```js
// line 727, beside the other window routes
if (path === '/play/mist' || path === '/mist') return sendFile('./window-mist.html', 'text/html')

// line 941, in the act ladder, after attackp
else if (a.do === 'special') { if (client.special) client.special(String(a.targetId)) }
```

and then **thirty-three more**, in one block, for the same reason:

```
survey drink offer alch grind still mendp unmake seal grave brew collect
kindle stoke consign deliver release pay lay found dismantle charter nock
saw smelt raise_market stock_market price_market take_market
dismantle_market build_brewpot deposit_all walk set_look
```

The ladder now carries **67 of the engine's 84 inputs**, up from 34. The
seventeen still missing have no `sdk.mjs` method at all, so no client can send
them either: `archive befriend char dedicate follow haul read_chart restore
rifle rot sail sound swear taking turn unfollow unfriend unload waking
withering`. Most are curses, oaths and friendships — a system of their own.

**None of this is invented.** Every one of these already existed twice over: the
engine has an input for it, `sdk.mjs` has a method for it, and `window-web`
sends most of them. Only the ladder was missing, so they were dropped in
silence — and **two whole skills were unreachable by any window as a result**.
`mourning` is paid only by `offer` at an ossuary; `wayfaring` only by `survey`
and `deliver`. A citizen could not have found out why, because there was
nothing to see.

`node check-window-skills.mjs` prints the table. Before: 7 of 9. After: 9 of 9.

### `worldgen-expanse7.mjs` — the height of the land, exported

`elevGrid(g)`. **This field is not new and it is not decoration.** `elevAt` is
what routed every road in the world: the router charges six for each unit a step
climbs, which is why the roads follow valley floors, contour along hillsides and
arrive at passes rather than summits. The hills were already true — they are the
*reason* the roads wander — and every window has been drawing flat ground
underneath a winding road, disagreeing with the world about why it winds.

Served on a four-tile lattice, because the field's finest octave is eight tiles
across: sampling every fourth tile and interpolating reproduces it, and costs
**29 KB for the whole expanse** instead of 459.

It changes no tile's walkability and enters no geography hash. A window may draw
the land as it lies. Whether a step should *cost* what it climbs is a question
for the spec and the engine, and neither the table nor the window gets to answer
it.

Both eras draw it, because it is truth rather than decoration: a 1994 machine
would have drawn these hills too.

### `engine.js` — four tables exported

`NODE_GATE`, `NODE_YIELD`, `GATHER_TOOLS` and `STALL_SELLS`. No logic changed;
they were already there, just not visible outside the file. `NODE_GATE` is the
one that matters most: it is the only place in the world that says an ironbark
wants woodcraft 45, and without it a window can only tell a citizen to go and
read the engine — which is not a thing a window should ever have to say.

### `serve.mjs` also gains `/api/tables`

The engine already exports `RECIPES`, `PRICES`, `WEAPONS`, `SMITH_REQS`,
`MOB_STATS`, `VIGIL_TICKS` and the rest. Nothing served them, so every window
kept a hand copy — and when the mist window's forge table was measured against
the engine, **twenty of its fifty-eight costs had drifted**. It offered recipes
that could not be made, hid ones that could, and named two ingredients
(`steel-ingot`) that do not exist in the world. The route is a door onto tables
that were already there. Windows fetch it at boot; the old copies stay only as a
fallback for a pillar too old to answer.

### `sdk.mjs` — five methods added

`offerAtOssuary(slot)`, plus `charter`, `nock`, `saw` and `smelt`. The sdk's
existing `offer()` is the *trade* offer — a bargain struck with a person — and
had to stay that; the other kind of offering, the thing given up at an ossuary,
had no word at all, so no script and no window could mourn and the skill sat at
its floor forever. The other four are a chart drawn up, a shaft nocked, a log
sawn and an ore smelted: four inputs the engine has always validated that no
script could ever send. The sdk's own tests still pass.

### `site/windows.html` — the doors

**This is the served page** (`PAGES` resolves to `./site/`), not the copy in the
repository root. The root copy is untouched.

Two doors are gone, one is new:

- **retired**: the lantern window and the holo window
- **added**: the mist window, beside the flat one

Neither retirement deletes anything. Both routes still answer, both files still
ship, and both are now named in the paragraph the page already keeps for this —
"Four others ship with the node and are not listed here" — alongside the deep
and photo windows. That paragraph's own argument is the reason: *a window nobody
maintains is still a window, and the point of this page is that anyone may write
one, which is worth less if the ones that fall behind quietly disappear.*

If you do want them properly gone, the routes are `serve.mjs` lines 724–726 and
the files are `window-holo.html` and `window-diablo.html`. I did not touch
either — deleting your work is not mine to do unasked.

### Everything else is new

Drop `window-mist.html` beside the other windows. Then:

```
node serve.mjs
open http://localhost:8787/play/mist
```

Cold start takes about three minutes: the expanse is founded from the generator
and the §0 practice island is built once at boot.

**There was an era switch here, and it is gone.** `?era=ps2` and `?era=ps3`
turned off the affine mapping and the vertex snap, put bilinear and mipmaps on
the textures, widened the palettes, doubled the frame, added a specular and a
rim and a filmic grade, and finished the light per pixel against a normal
derived from the texture's own luminance. Every one of those worked. Together
they looked **worse**, and the reason is worth keeping written down:

> The content was PS1 content — sixty-four-pixel textures painted to be seen at
> 320&times;240 through a dither, and bodies built out of boxes. Filtering and
> resolution do not flatter that, they **expose** it. A grass card that reads as
> grass at 240p is a set of enormous hard-edged blades at 512p, standing next to
> a tree that is still a 1994 tree. Nothing agreed about what year it was.

The 1994 picture is better because it is *coherent*: the dither, the texel size,
the flat fog and the chunky tree all belong to one machine, so the limits read as
a style rather than as a shortfall. Constraints were doing the design work, and
removing them left the art carrying weight it was never drawn to carry.
`renders/judge-ps1.png` and `renders/judge-ps2.png` are the same tile, tick and
heading in both, if you want to check the reasoning.

Two things survived the deletion, because neither was ever about an era: the
**ground clutter**, now at this machine's fidelity — a field with grass in it
beats a bare green plane at any resolution — and the **height of the land**,
which is the world's own data and was never a rendering choice at all.

**`?far=N`** widens the draw distance, 8 to 64 tiles, default 13. It moves the
built ground and the fog together, because moving one without the other gives
you a country that stops at a hard edge. Eleven tiles is the window's argument;
this is how you find out whether you agree with it.

---

## The files

| file | what it is |
|---|---|
| `window-mist.html` | the window. One file, no build step, three.js from a CDN |
| `serve.mjs` | **yours, 2 lines changed** — the route and the special |
| `windows.html` | **yours, 1 door added** |
| `preview-mist.mjs` | looks at the window without a browser (see below) |
| `montage.mjs` | stands in twelve places in the live world and puts the frames side by side |
| `check-window-mist.mjs` | it boots, and builds a country around the citizen |
| `check-window-verbs.mjs` | all 32 verbs reachable, and none offered where they cannot happen |
| `check-window-birth.mjs` | §0c: it knocks, waits like everyone, and crosses only when it may |
| `check-window-feedback.mjs` | it *shows* what happens, not only sends it |
| `check-window-stride.mjs` | a step snaps, a journey flows, and both of them arrive |
| `check-window-sound.mjs` | the door has a theme and every deed has a noise |
| `check-window-motion.mjs` | all 33 engine deeds throw something, and it clears up after itself |
| `check-window-skills.mjs` | which of the nine skills can be trained, and whose fault it is when one cannot |
| `check-window-guide.mjs` | a citizen can learn what a skill is for without reading the engine |
| `check-window-tables.mjs` | the recipes and prices are the pillar's, and the window takes them |
| `check-window-fuzz.mjs` | thirty malformed states, and it keeps drawing through all of them |
| `check-window-death.mjs` | death is a state the window shows, and does not ask you to fix |
| `check-window-cost.mjs` | a real world fits inside the frame budget, and an hour does not grow |
| `check-window-nodes.mjs` | every node type the world puts on a tile has a body of its own |
| `check-window-ground.mjs` | the ground agrees with the terrain table the pillar serves |
| `check-window-pad.mjs` | the whole window is reachable from a controller |
| `check-window-chart.mjs` | the chart-table draws the served ground, and costs you standing still |
| `check-window-live.mjs` | boots a real pillar and drives the real window against the real world |

The checks need three.js, which the node does not depend on. Without it they
skip rather than fail:

```
npm i three@0.128.0
for c in mist verbs birth feedback sound motion chart pad skills ground nodes death fuzz tables guide stride; do node check-window-$c.mjs; done
node --expose-gc check-window-cost.mjs      # needs a world dump from check-window-live.mjs
node check-window-live.mjs      # boots its own pillar; ~3 minutes
```

---

## preview-mist.mjs

Nothing in this window has ever rendered in a browser here, so this exists: it
loads `window-mist.html` for real — real three.js, real geometry, real
materials, real procedural textures — and then rasterises the scene **in
software** using exactly the arithmetic the window's own shaders use. Same
vertex snap, same affine UV premultiply, same perspective-correct varying
interpolation, same per-vertex fog, same 4×4 dither and 5:5:5 truncation. The
artifacts that come out are the real ones.

```
node preview-mist.mjs out.png [tick] [yaw]
SLICE=/tmp/live-world.json AT=540,220 FAR=30 node preview-mist.mjs town.png 1150 0.7
MENU=Tab node preview-mist.mjs pack.png            # photograph a panel
BESTIARY=wolf,bear,boar node preview-mist.mjs rank.png
```

It found real bugs a browser would have shown me later and an invented state
never would: the terrain atlas was upside down (every cell drew its vertical
neighbour), `box()` doesn't alpha-test so every crop row in the expanse was a
charred stick, and the left wing of the dragon had a sign error that fired one
finger bone into the sky like a mast.

---

## What the window does

**The era, reproduced rather than filtered.** Affine texture mapping (UVs
premultiplied by `w` and divided back out, defeating perspective correction —
this is the signature of the machine). Vertices snapped to the 320-wide grid.
Per-vertex Gouraud light and per-vertex fog, computed once per corner and
smeared across the triangle. 16-colour 64px textures, nearest, no mipmaps.
5:5:5 output with a 4×4 ordered dither. One-bit alpha, plus the hardware's
half-and-half semi-transparency mode for mist. 30fps.

**The country.** Ground lumped off the world seed so every mist window trips
over the same root. Fifty-odd landmark kinds — the wire carries `kind` and the
window was throwing it away, so 2,635 landmarks were identical grey monoliths.
Hedges, fences, ramparts, hearths. Firelight as vertex-summed point lights, so
a fire lights the four corners of its tile and the ground goes warm in a
lozenge, not a circle. Mist that lies in the low ground and pools over water.

**The bestiary.** Two chassis and a parts bin, not one box with a smaller box
on the front. Twenty-four beasts with their own bodies, plus a dragon with a
neck, a hinged jaw, furled wings of bone and membrane, and a drooping tail.

**Everything the pillar accepts.** All 32 verbs, reachable from a pack screen
with per-item icons (35 of them, no item falling through to a generic bundle),
a place panel, a self panel and a trade panel — and **nothing offered where it
cannot happen**. No `deposit` beside a fish in a wood; instead, in grey, "sell:
needs a counter".

**The interval is a second.** Worth saying loudly because I had it wrong: the
engine's `TICK_MS` is 1000, and almost every comment inside `engine.js` still
argues at 600 because that is what it was written at. This window inherited the
mistake three times over — it ran Nought at 600ms (a practice of the world, two
thirds faster than the world), it converted the vigil to minutes at 0.6, and it
used a thousand ticks for a vigil that is `VIGIL_TICKS = 300`. Between them it
showed a ten-minute countdown for a five-minute wait and then **refused to send
`spawn` for nearly seventeen minutes while the world had been willing since the
fifth.** Offering a deed the world forbids is the fault this window polices
everywhere; withholding one the world permits is the same fault from the other
side. It now reads `VIGIL_TICKS` and `TICK_MS` off the engine in Nought, and the
day and crop arithmetic is written down beside the constants.

**§0.** Birth is two-phase and this window was doing one. It knocks, shows you
the wait counting down, and crosses only when it may. And it runs Nought — the
practice island, on the browser engine, at the same 600ms tick — with a bar
across every frame saying so.

**Motion.** `p.deed` is one word in the state, set for *everybody*: all 33 deed
words throw particles, for every citizen in the fog, not just you. Hitsplats,
flinch, bodies that topple before they go. Arrows and bolts that cross the
ground and arrive. Six tool arcs. The three specials, and other people's
specials read off `lastSwing` jumping past the tick.

**Work that runs on.** §6am: a gather is an *action*, not a deed — it costs one
input and then goes on by itself, interval after interval, for as long as the
seam lasts. The window animated the first swing and then froze, holding an axe
an inch from a tree it was supposedly felling. It now reads `p.action` and keeps
working: the axe keeps swinging, the pick keeps striking sparks, the rod stays
cast, and it stops the moment the seam is spent. The same for everybody else —
a citizen at a seam eight tiles off moves their arm, rather than standing in a
field looking at a rock.

**A hand, not a block.** The viewmodel hand was one box with three cubes stuck
to it, and at 320&times;240 a slab of flat tan an inch from the eye reads as a
crate. What makes a hand read at this size is not detail — there is no room for
detail — it is the DARK GAPS between four separate fingers curled over the haft,
and a wrist that is a different colour from the skin. It also has a light of its
own now: the viewmodel sits at a fixed place in front of the eye, so at some
hours the world's sun hit the palm dead on and every face came back the same
tan. It keeps the hour's *brightness* — a hand at midnight is still a hand at
midnight — and only the direction is fixed, over your shoulder.

**And a rod is a rod.** `rod` was missing from the weapon list, so fishing was
done with visibly bare hands. It has a tapering pole and a line on it now,
because without the line it is a stick.

**A step is a step.** This window spent its first month *hiding* the tick: the
camera chased the citizen's tile with a per-frame lerp, the head-bob ran on a
free sine, and the footfalls came off a timer with no relation to where the feet
were. An exponential chase never actually arrives, so the eye was permanently
behind the body it was following — and being permanently behind at a one-second
interval is precisely what reads as lag rather than smoothness.

It now takes strides, and it can tell a step from a journey. A **lone** step
snaps: 260ms, hard out, done, and then genuinely still. Steps that keep arriving
are **walking**, and stretch to 820ms with an ease that runs one into the next,
so crossing the fens is not two hundred hard stops — 74% of frames are moving
rather than 25%. Both shapes *land* exactly on the tile, the body dips through
the stride and the footfall sounds when the foot lands, and the leading foot
alternates. Interval moves one tile per interval; this is what that feels like
when a window stops apologising for it.

**A skill guide, derived and never written.** Every gate in this world is a
number in a table, and none of it was anywhere a person could see: you found out
by walking to a tree and being refused, with no reason given. `Q` &rarr; *your
hand, and what it opens* lists the nine skills with your level and the next
number that matters; open one and it says what to hold, what each seam gives and
teaches, what is **still shut** with the level it wants, and what is already
yours. Every line is read off the tables the pillar serves — so it cannot go
stale, cannot disagree with the world, and a gate added to the engine appears in
the guide without anybody remembering to write it down. That matters here: this
window has already been bitten twice by hand-kept copies.

**It does not trust the world to be tidy.** A window that throws stops drawing —
not a wrong pixel, a black screen and a console nobody is reading. Thirty
malformed states are thrown at it and then *used*, panels opened and keys
pressed, because half the reads happen inside a panel and a state that renders
can still explode the moment somebody presses TAB. Three broke it on the first
run: a null node, a mob with no type, and `markers` that was not a list. Every
read of the world is defended at its edge now. The pillar this was built against
sends none of these, but a peer node, an older engine or a newer one might, and
a window is not entitled to assume the world it is shown is well-formed.

**Death is a state, not a gap.** §6c: five intervals after you fall, the world
puts you back at the founding with your health whole — processed at the top of a
tick, needing no input at all. This window used to offer a dead citizen a
*wake* that sent `spawn`, which is the input for a soul **not** in the world and
is refused for one who is. So on the single screen where a person most needs
telling what is happening, it showed an unchanged HUD with the bar at zero and a
button that did nothing. Now the eye drops to the grass and rolls, the frame
goes dark and says **YOU FELL**, and it gives the count and says the count is
not yours to hurry. No deed, no step and no panel while you are down.

**It runs at thirty, on a real world.** The other checks ask whether the window
is truthful; `check-window-cost.mjs` asks whether it is playable, and only a
real world can answer that — an invented state with four nodes in it will never
find this. It found that `nodesNear` walked all ten thousand nodes, `options`
called it a dozen times, and the HUD called `options` **every frame**: a hundred
and forty thousand iterations and thirteen ten-thousand-entry arrays allocated
sixty times a second, to answer a question that changes only when the citizen
moves. The window cost **59ms a frame against a 33ms budget** — seventeen frames
a second, in a window whose whole argument is that it runs at thirty. The
country is now indexed once per state and the frame reads the index: **1.5ms**.
A step across a tile went from 86ms to 22ms.

It also found that removing a thing from the scene is not the same as letting it
go: `remove` unhooks it from the graph and leaves the geometry alive on the GPU,
and this window builds a fresh one for every tree, rock and body that walks into
the fog. Geometries are disposed on removal now (materials and textures are not
— they are shared and the next tree wants them), and the nameplate cache is
pruned. Nine hundred steps: the scene stays bounded and the heap settles.

**Everything the world puts on a tile looks like itself.** `makeNode` has a
default — an unknown type becomes a grey stone with a cap — and that default is
right, because a window must draw *something* for a thing the world invented
after it was written. It is also where detail goes to die quietly: **21 of the
51 node types in a real expanse were falling through it**, including every ore
seam. An iron rock, a coal rock, a gold rock and a mother-lode were the same
grey stone, so walking to a particular seam had no point — you could not tell it
from any other. Seams now show the ore in them and a scatter of spoil, the six
trees differ in shape as well as tint (an ironbark is a spar, an oak is broad, a
heartwood is squat), a fountain is not a well, a keeper wears an apron where a
guard carries a spear, and the ferry, tollgate, banner, railing, sawpit,
smokerack, furnace, bellwork and hoard all have bodies. `check-window-nodes.mjs`
builds every type one at a time and compares silhouettes, so the next one to
slip through the default gets caught.

**The ground is the pillar's, not the window's guess.** The chart-table fetched
`blocked`, `road` and `country` and drew a map from them — and the 3D ground
then ignored all three and picked its texture out of hash noise. So a lake
looked like grass and you walked at it and were blocked with no warning, a road
with two hundred signposts along it looked like a field, and the fens, the moor
and the heartlands were all the same sage-green. The ground page now has a cell
for each of the eight countries the generator names, in the generator's own
order, so the `country` byte indexes it directly; roads are drawn as rutted
earth, the sea lies lower than the land it meets, and blocked-but-dry ground is
bare stone. The table is fetched at boot, not the first time you press M.

**Blob shadows.** A one-bit dithered circle under every body, beast, tree and
building — what the era did instead of shadow maps, and the single biggest fix
for things reading as hovering rather than standing.

**Every weapon is HELD like itself, too.** Everything in the hand shared one
rest pose — rolled over at 0.74 radians, which is right for a haft you swing and
wrong for a stave you draw. Rolled that far, a bowstring offset sideways swung
across the *front* of the stave, so the picture showed a stick with a wire laid
over it. Bows, gonnes, rods and spears have their own poses now, and the bow is
one continuous arc of seven segments with the riser deepest away from the
archer, a straight string on the near side, and an arrow on the rest.

**A blow on a person is still a blow.** Damage was read off the mob table and
off your own health and nowhere else, so a fight between two citizens was the
one fight in the world with no numbers in the air. Other citizens take
hitsplats and flinch now, and a citizen who goes down gets the dagger mark.

**Every weapon swings like itself.** Six arcs, not one: a maul is wound right
back and dropped, a dagger is three inches and back twice, a spear thrusts down
its own line, a bow draws and holds and releases, a staff sweeps right to left,
a sword cuts shoulder to hip — each at its own speed and with its own noise.
Bare hands get a short hook.

**The bar is made at the furnace, the tool at the anvil.** The guide labelled
every `SMITH_REQS` entry a *forge* &mdash; and all five `SMELTED` recipes have
one. So it was telling a citizen to make iron at an anvil that refuses it, and
&sect;7p's whole point is that the anvil at Thornbury stands **238 tiles** from
the furnace at Cragfoot. That is a long way to carry ore on a window's word.
`serve.mjs` now sends the `SMELTED` set with the other tables, and the guide
says *smelt* where the engine says furnace.

**And where a thing comes from when it is not made.** A guide that knows only the
crafting tables knows half the world: a hollow bow is forged at woodcraft 12
*and* carried by the gibbet-dead and skeleton-knights. `MOB_STATS` already
carries every drop table and the pillar already served it &mdash; nothing was
missing but the question. Any item in your pack now offers *where it comes
from*: which seams yield it, whether it is forged or smelted, which beasts carry
it and how often, and which stall sells it and for how much.

**The chime is window-web's, note for note.** C, E, G, then the octave held long
with the fifth still ringing under it &mdash; the same five tones, the same
triangle wave, the same eight-millisecond attack and exponential fall, which is
what makes it a chime rather than a beep. Taken deliberately rather than
re-invented: a person who has played this world in one window should recognise
the sound of getting better at something in another. It is the same world, and
this is one of the few places a window may agree about a *feeling* rather than
only about a fact. `check-window-sound.mjs` reads the notes out of
`window-web.html` itself and compares, so the two cannot drift apart.

**A level takes the middle of the frame.** It used to be one grey line in the
corner, in the same colour as everything else the feed says, gone in four
seconds &mdash; and a level is the only thing in this world that is *permanent*.
Hours of a trade, and it never goes back down. It was being reported like a
footstep. Now it is a plate in the centre with the skill and the new number, a
ring of motes off the citizen, and &mdash; the part that matters &mdash; **what
it opened**, read off the same `NODE_GATE` / `WIELD_REQS` / `SMITH_REQS` the
skill guide uses, so it cannot claim an unlock the world does not have. A level
that opens nothing says what the next one opens instead, because otherwise the
banner is a number congratulating itself.

**Beasts have voices, and here that is not decoration.** You can see eleven
tiles; everything else you know about where you are, you know by ear. A world
where the wolves are silent is a world where the only warning is the one that
arrives too late. Every one of the 24 beasts has a throat chosen by CHASSIS
rather than by name &mdash; a growl, a roar, a shriek, a moan, a keen, a rattle,
a hiss, a chitter, a caw, a snort, a bleat &mdash; each carrying its own distance
(a dragon is heard at sixteen tiles, a crab at six) and falling off with it. One
voice at a time, nearest first, because a wood where every beast calls at once is
noise and noise carries no information. And the dragon's breath is the only sound
in the world with a warning in the front of it: an inhale, then a second and a
half of it.

**A blow that lands sounds like the thing that landed it.** Every hit in the
world used to be one `thud`. A maul is a low collapse, a dagger a short bright
tick, a spear a pierce, a sword a cut with a ring in it, a staff or a pickaxe a
crack of bone. Struck at distance, quieter.

**And the deeds stopped borrowing.** Cooking was a hammer on an anvil; it is a
sizzle now. Drinking pours, a mill grinds, a brewpot bubbles, a sawpit saws, an
ossuary tolls, kindling catches, digging is soft, fletching is three strokes of a
knife. 63 sounds, none of them sampled &mdash; all four oscillators and a bucket
of noise, which is roughly what a disc had left after the textures.

**The ground under your feet has a voice, and it is the ground you can SEE.**
The footstep and the ground texture used to decide separately — the eye read the
pillar's terrain table, the ear still read the hash noise the ground used before
that table existed. So a citizen could stand on visibly tilled earth and hear
grass, or cross the fens to the sound of a dry field. Both now ask one
`cellAt()`, and the eight countries are eight surfaces: the greenwood swallows a
footfall in leaf litter, the moor rustles through heather, the downs crunch on
dry chalk, the fens squelch, a crag is bare rock, a road is stone, the shore is
shingle. A window whose eye and ear disagree about where it is standing is a
smaller version of the fault this whole file is about.

**And the older claim, kept for the record:** A footstep was one dull thud on a
road, in a fen and through a field. It now reads the tile the window already
picked a texture for: grass, dirt, stone on a road, and a wet slap near water.
And a fire is a sound before it is a light — a filtered crackle that rises as
you come within seven tiles of any hearth, forge, kiln or watchfire.

**A controller, if you have one.** The Gamepad API needs no permission and no
library. The layout is the era's, not a modern shooter's: cross acts, circle
goes back, square reaches, triangle is the special — the same four places they
have been since 1994. Left stick walks (folded onto the grid like the keys),
right stick looks, L1 the pack, R1 the chart, START yourself, SELECT trade. The
panels take it too, or half the window would be unreachable. Holding one opens
the door without a click, since a pad needs no pointer lock, and the HUD swaps
its key names for button glyphs — a window that says "press E" while you are
holding a controller is telling you the wrong thing.

**The chart-table (M).** Not a corner minimap: the whole argument of this window
is that you can see eleven tiles, and a panel showing forty hands back exactly
what the fog took. So the map takes the screen and you cannot walk while it is
open. It draws the terrain table the pillar already serves — blocked ground,
roads, country, and the towns *as the founder seated them* — which is public and
static, so drawing it is an opinion about presentation, not a claim about the
world. It is emphatically **not** the `chart` item: the engine is flat that a
chart "opens no doors, nobody travels by it". The names are yours: a signpost
carries its text on the wire and the window was throwing it away — walk past one
and it inks itself for good. Those marks live in this browser, not in the world.

**Sound.** No samples. A wind whose cutoff brightens with daylight and whose
gain rises with the fog, a pedal that loses its fifth at night, birds by day and
an owl or crickets after dark. Every deed has its own noise. The door plays
`theme-deep`, the same theme the photo window opens with, and ducks under the
world rather than stopping when you go in.

---

## What it does not do

- Nothing here has ever run in a browser. The software rasteriser is faithful
  because I wrote both halves, which is exactly the risk.
- The copied tables are gone: the window fetches `/api/tables` from the pillar
  at boot and only falls back to its own stale copy if the route is missing,
  saying so on the anvil panel when it does.
- `cast: mend` and `mendp` are deliberately absent. The engine has both, but
  this pillar maps every `cast` to an anchor and does not take `mendp` at all.
  Offering them would be the exact fault the window forbids everywhere else.
  The missile that would carry a mending is written; ranged attacks use it.
- The chart-table's marks are in `localStorage`, so they are per-browser rather
  than per-citizen: another window cannot see them and clearing the browser
  loses them. That is honest — they are your reckoning of where you have been,
  not something the world knows — but it does mean they do not travel with you.
- The pad layout is fixed. There is no rebinding, and a pad the browser reports
  in a non-standard mapping will have its buttons in the wrong places.
- **The window now offers every one of the 67 words the ladder carries.** The
  gap that remains is below it: seventeen engine inputs with no sdk method,
  listed above.
- Some offered deeds will simply be refused. `still`, `mendp`, `seal` and
  `unmake` are §7cf *spoken* deeds with level and equipment requirements the
  window cannot fully check, and `found` needs ground the pillar will accept.
  They are offered where their obvious precondition holds — a sigil in the
  pack, a goo-staff in hand — and the pillar decides the rest. That is a
  deliberate exception to the no-impossible-deeds rule: the alternative was
  hiding whole trades behind conditions no window can evaluate.
- Crops don't sway. Fishing shows no fish. There is no arrow-in-flight for a
  mob shooting at *you*, only for shots you can attribute to a citizen.
