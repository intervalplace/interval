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
| `check-window-sound.mjs` | the door has a theme and every deed has a noise |
| `check-window-motion.mjs` | all 33 engine deeds throw something, and it clears up after itself |
| `check-window-skills.mjs` | which of the nine skills can be trained, and whose fault it is when one cannot |
| `check-window-nodes.mjs` | every node type the world puts on a tile has a body of its own |
| `check-window-ground.mjs` | the ground agrees with the terrain table the pillar serves |
| `check-window-pad.mjs` | the whole window is reachable from a controller |
| `check-window-chart.mjs` | the chart-table draws the served ground, and costs you standing still |
| `check-window-live.mjs` | boots a real pillar and drives the real window against the real world |

The checks need three.js, which the node does not depend on. Without it they
skip rather than fail:

```
npm i three@0.128.0
for c in mist verbs birth feedback sound motion chart pad skills ground nodes; do node check-window-$c.mjs; done
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

**Every weapon swings like itself.** Six arcs, not one: a maul is wound right
back and dropped, a dagger is three inches and back twice, a spear thrusts down
its own line, a bow draws and holds and releases, a staff sweeps right to left,
a sword cuts shoulder to hip — each at its own speed and with its own noise.
Bare hands get a short hook.

**The ground under your feet has a voice.** A footstep was one dull thud on a
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
- The stall prices and forge recipes are **copied tables**. If the engine's
  numbers move, the window will show a stale price and the pillar will refuse
  the deed. The refusal is correct; the window would be lying about the cost.
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
