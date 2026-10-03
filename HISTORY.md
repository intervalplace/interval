# Interval: The Record (`HISTORY.md`)

*Part of the constitution by hash, and binding on nothing. §0-i explains
why it is hashed anyway.*

This file exists because `SPEC.md` was a constitution and a changelog at
the same time, and a repealed number kept sitting in load-bearing
sentences where nothing caught it. The reasoning is the most valuable
thing in this specification and none of it is discarded here: it is
moved, so that the law can be read as law.

## A jump was being drawn as a walk

The Unreal window interpolated every citizen from last tile to new tile
whatever the distance, and drove the animation rate off tiles-moved per
interval. A citizen stays within one tile an interval except twice: the ferry
(Eastmere to Whiting is fifty-five tiles, Fenmarch to the Lists a hundred and
fifty-eight) and a death (up to four hundred). Both came out as a one-second
glide across open water with the walk cycle playing at a hundred and fifty
tiles a second. Not a teleport, which would at least read as a cut.

`DrawnPosition` places rather than slides when the move is more than one tile,
and `GroundSpeed` reports no pace for one, which covers beasts too: a beast
respawning at its home used to sprint back across the moor. The rule is the
dual of "walking must never show the tick": a move the citizen could not have
walked must never be drawn as walking.

## The First Tally had only one half

A tally stick is split and both halves are kept: that is the whole of what the
monument means. One at Anchor, one across the water on Shrine Isle, and the
founder's own key cut into the isle's half, so the world's name is carved in the
world. **The island carried one half from the day v7 was written.**

It was not a failed seat. Probed: `tally-isle` goes in where it should and is
gone by the time the founding returns. A landmark is clearable by several later
passes -- the plough clears scrub, a holding sweeps its yard, a hand-drawn place
corrects what it finds -- and not one of them can tell a tally from a tree
stump. Chasing the single line that took it would have fixed this founding and
not the next sweep somebody adds.

It is seated LAST now, after everything that clears ground, which is the
discipline the file already states: "the later pass corrects what it finds." And
it is counted, because the symptom was nothing at all -- a unique monument
quietly absent looks exactly like a unique monument nobody has walked to.

The seat search on Shrine Isle also widened and now warns rather than returning
in silence, which is how this would have been found years sooner.

## The two thresholds were invisible walls

Two tiles on the island refuse a citizen, and the GROUND does the refusing: the
squeeze into the Whitechalk barrow takes nobody carrying more than three slots
(§7dn), and the Smother's mouth takes nobody without a light (§7dq). When the
ground refuses, the engine does not move you and nothing is wrong -- no refusal,
no error, no message. In the window that is an invisible wall, which is the one
thing a place built on preparation must not look like.

The bridge now says what the ground ahead will ask, within two tiles, and
whether the citizen may pass as they stand. Said on APPROACH rather than after
the fact, because a refusal that arrives once the step has failed explains
something that already looks broken, and said again if it changes while they
stand there -- a torch burning out in front of the mouth is the item doing
exactly what it is for, and the citizen should be told the door has just shut.

## And a keeper is somebody, not something

A hundred and fifty-seven keepers stand on the island. Each carries a name the
world gave it and eighty-one also carry a `kind`, which `CALLING_NAMES` turns
into a trade: `banker` into "the banker", `lumber` into "the axe man". The
window had the name and not the trade, so a street in Anchor was a row of people
called things with no way to tell which one takes a deposit.

**No keeper carries words**, which is the difference between this and the
signposts, and is why `read` is the wrong verb for one. A sign has a `text` and
reading it is reading. A keeper has a name and a trade, both facts the world
states, so the window can say who they are without inventing a line of dialogue
this world has no mechanism for. The seventy-six with no kind are residents and
stay just their name, which is the truth about them.

## Two hundred and ten signs, none of them readable

The island carries a lot of authored writing: a hundred and ninety-nine
signposts, eight landmarks and three tollgates, each with a `text`. "Bleakfell.
The last roof. Past here the moor keeps its own hours." "Watersmeet. Boats, and
a ferryman with no ferry. Ask Gilbert what he is building." The window had never
shown one word of it.

Not an oversight, a structure. A node's options in the window come from the
engine's affordance table, which lists what a VERB may do to a thing, and
nothing in the engine reads a sign. Nor should it: reading changes no state,
costs no interval and files no input. So a window that waits to be told about
reading waits for ever, and §7ds -- which put a board outside the Smother on the
grounds that "a wall with no explanation is a puzzle box and not a place" -- had
been writing to nobody.

`read` is answered in the window, like `walk`, and offered on evidence rather
than on affordance: the node has words, therefore they can be read. It is the
DEFAULT row, because the interaction model is RuneScape's and a left click does
the thing you obviously meant, which at a post by the road is reading it. On a
tollgate it comes first and paying is one row down, since you want the price
before you pay it.

**Nine posts have nothing written on them**, and that is pinned rather than
fixed: five that a village drawing seats after the hamlet's own sign has already
gone up, and four at named places -- the Gallows Oak, Wayfarer's Cross, Beggar's
Bridge and the monument. A citizen can now walk to Wayfarer's Cross, read the
post and be told nothing. The words are the world's voice to write;
`signs.test.mjs` holds the number at nine so it cannot grow quietly.

## And the window went dark in it

Three pieces, and none of them existed. `Surface` carries the ground's name on
every frame and `bLit` carries whether anything in hand is burning, both from
the bridge rather than worked out in the client. `IntervalHour` eases a
`Underground` factor toward one on cave ground, with the same `FInterpTo` the
shelter beside it uses and for the reason that note gives: "a doorway is a tile
wide and stepping across it should not switch the weather off like a light". The
sun and the sky light are multiplied by it, to six per cent carrying nothing
and sixteen carrying a light, which is a floor rather than a blackout on the
same argument the night already makes: "a black night is a night nobody plays
through".

And the lamp a citizen already had under a roof becomes the only light there
is. Same component, because two point lights on one mesh for one purpose is two
things to keep in step; what changes is the character, since a hearth fills a
room and a torch makes a circle you walk inside. It goes out when the torch
does.

**A field name nearly broke three verbs on the way.** The frame's new field was
written as `underfoot` first, which is already a key in that object literal for
the verbs doable on your tile, and a duplicate key in a literal silently wins:
it would have deleted the list that lets a citizen kindle a watchfire, raise a
stall or survey a marker. `ground` was taken too. It is `surface`, which is what
the generator calls it, and the only thing that caught the collision was the
C++ happening to have a field of that name already.

## The Smother had no way to say it was a cave

§7dq puts eight quenchers in a cave in the Cragscar. Steel passes through them;
only fire tells. Its mouth refuses anybody not carrying a light, and the place
is written around the dark: its own note says the mouth needs no marker because
"the dark either side of it is the marker".

There was no dark. `floors: false` was the only thing a place could say about
its ground, and it means "let the country show through", which is right for a
ruin and wrong for a cave: every tile in the Smother answered `crags`, exactly
like the fellside outside the mouth. No window could tell it was underground.

A place may name a ground now (§7dq-ii), the Smother names `cave`, and the
hundred and fifty-two tiles of it come out shaped like a cave: a lobed chamber
narrowing to a waist with the mouth at the bottom. The window's tile list has
had `cave` in it since it was written and the ground shader has had a near-black
albedo at that index, both unused.

## The torch's clock was defeated twice, the second time by the weapon table

A torch is meant to be a clock: light it, it burns, it goes out, and the cave
asks you to keep one going. The first version compared `torchUntil > 0`, so a
torch lit once was lit for ever, and the note in the engine records that fix.

The fix did not work. A torch is in WEAPONS with `burns: true`, correctly,
because swung at a quencher it IS a burning weapon, and the clause that reads
`burns` answered before the clock was consulted. A citizen who had ever held a
torch could walk into the Smother for the rest of their life. Neither failure
is visible in either line on its own, which is why `light.test.mjs` is a table
of seven cases rather than a sentence.

`carriesLight` is exported now, so the rule has one definition: it had existed
only inside `crossingView`, computed for the terrain predicate and thrown away,
and a window needs the same answer to know what a citizen sees by.

## And the generator's citations were never checked

`spec-stubs.mjs` and `spec-conformance.mjs` read engine.js and only engine.js.
The worldgen files cite the constitution in exactly the same way, and
**forty-one sections pointed nowhere**: §7bd from four files at once, §7z from
two, the whole §7a-to-§7b run that draws the shire. Geography is law (§2q) and
those files are where that law is implemented. Both tools read all ten sources
now, each draft says which file and line its argument came from, and the
checker fails on a dangling citation from any of them.

## The mourner's grace had never once been paid

`prayerKeeps` decided what a dying citizen keeps from `p.skills.prayer`. §5m
renamed that trade `mourning` and this one read did not follow, so the level was
`effLevel(undefined ?? 0)`, which is 1, which is below `PRAYER_KEEP` (70), so
the function returned an empty list to every citizen who ever died in every
world ever founded.

It is the one thing mourning buys. The trade grants no power by design, and the
guide promises "the dearest priced thing you carry survives your death" at
seventy and "the two dearest do" at mastery. None of it worked. The only thing
that did was the king-shroud, which spares its wearer down a separate path, so
the fault read as "the shroud is good" rather than as a bug.

`skill-check.mjs` has been reporting the read since it was written, and is in no
npm script and imported by nothing: the third checker found that way, after
`spec-conformance.mjs` and the margin of the lake shoreline. It runs in the
suite now, it no longer reads its own comments as code, and
`mourning.test.mjs` kills a citizen through the real death site at 50, 70 and
100 to hold the three outcomes.

## Labour stopped twenty levels short of the door it is named for

§5r-iii says labour "carries a citizen to exactly the level at which a calling
may be sworn (§5k) and no further", and gave a figure beside it: "about two
hundred and fifty shifts at the heap". Those are two different levels. The door
is fifty; two hundred and fifty shifts is thirty. The engine implemented the
figure, as `LABOUR_PROWESS_CAP = 30`, under a comment asserting `=== SWEAR_LEVEL`
and above an assertion in `skill-check.mjs` that says the same, correctly, to
nobody. So the farmer who digs their way to a calling could not, which is the
one story the section tells. The cap is fifty and the figure is seven hundred.

## The spade is one wight in eleven, not one in six thousand

Both engine.js and §26 said "one time in six thousand". The table says 6144 out
of a `DROP_DEN` of 65536, which is one in ten point seven, and it is counted
rather than rolled, so it is exact. Five hundred and sixty times out, in the two
places anybody would look. The cost of a spade is the wight, which is a real
fight at ninety-five health; finding one is not the cost.

## The high street was speckled rather than paved

A town's streets come from its drawn plan and the King's road is a spline laid
independently, and `groundKindAt` asked the plan first: where the spline clipped
a drawn lane you got a cobble, and where it did not you got a dirt trail.
Millbrook came out as fifty tiles of flagstone with two cobbles in the middle of
its high street, single cobbles speckled round the market, and a track cutting
diagonally across the square. The road goes first now, so it is cobbled from end
to end, the plan's lanes are the footway and are flagged, and the grass comes up
between the backs of the houses as before. Millbrook's dirt went from a diagonal
scar across the market to two tiles.

## And safe-spotting was measured rather than argued about

A beast closes by greedy step with no pathfinding and abandons a blocked one, so
an archer behind water cannot be answered. `check-safespot.mjs` floods the
ground each beast can reach within its own leash and asks how much of the world
that covers: **36 of 599 aggressive beasts, six per cent**, at the horn-bow's
five tiles, and twenty-two per cent at the dragonbow's nine, of which there is
one in the world. The dragon, the Gibbet King and the siren are zero at both.

Two are a hundred per cent. The quencher lives at the vents, which is terrain
nobody chose for it. **The great spider is the one that matters**: it mends six
a tick, which makes it a damage race by design, and a race is exactly what a
safe spot removes.

## The generator's trigonometry, measured instead of asserted

`worldgen-expanse7.mjs` said twice, in capitals, that it used no `Math.sin`,
and gave the right reason: geography is hashed into the founding, and two nodes
whose trigonometry disagrees in the last place build two different worlds. The
claim was true of `coastR` and `meander` and of nothing else in the file.
`inlandSet` draws every mere, tarn and pool with five `Math.sin` harmonics and
an `Math.atan2`, and about fifty scatters that seat props and landmarks use
`Math.cos`, `Math.sin` and `Math.hypot`.

**The hazard is real.** Hash a hundred and forty thousand of those calls under
V8 and under JavaScriptCore, the two engines this project ships on, and the two
numbers differ.

**This world is nowhere near it.** Every placement rounds to a tile, which is
half a unit of cushion. The one comparison with no rounding at all is the lake
shoreline, `d < rAt(atan2(dy, dx), x, y)`, and across the founded island the
closest tile clears its own boundary by 4.7e-5 against a last-place difference
of about 2.2e-16. Eleven orders of magnitude.

**And it is not a lottery.** `ISLE(g)` replaces a founding's seed with
`TALLYHOLM_SEED` before any hash is taken, so v7's land is the same in every
world founded on it: two foundings with entirely different genesis seeds differ
by zero tiles. That margin is one fixed number for the generator, not a roll at
each founding.

**And the islands are identical.** Built under both engines and compared over
all 458,752 tiles, every settlement and every road: the same.

**§2s forbade all of it, and that was the real finding.** The law says terrain
may use "only the operations IEEE-754 requires to be exactly rounded ... and
never the transcendentals", and the generator had done so in fifty places since
it was written. The rule was also stricter than its own reasoning: the failure
it guards against needs the difference to survive to the tile decision, and
rounding to a tile is half a unit of cushion.

So §2s now states the rule it actually requires, in three cases: rounded to a
tile is lawful; comparing two distances between tiles is lawful, because the
integers underneath are 5.556e-4 apart at their closest and the engines differ
by 1e-16; and a fraction deciding a tile any other way is not.

**`inlandSet` was the one that was not.** Its shorelines are built from
`meander` and `angleOf` now, the same two `coastR` and `isleR` have always
used, so no fraction decides a tile anywhere in the terrain. The meres and
pools changed shape: every one stayed within sixteen per cent of its old size,
1,794 tiles changed hands along the shorelines, the towns did not move and the
roads reroute slightly. `terrain-mirror.mjs` carried its own copy and
`mirror.test.mjs` caught the drift the moment the generator changed, which is
what it was written for.

`worldgen-exact.mjs` holds the terrain files to the three cases and
`npm run check:engines` builds the island under both engines and compares.

## Four windows sent verbs the engine does not have

Three input types in `window-web.html` were words the engine does not have, so
`validateInputShape` answered "unknown input type" and the input never reached a
rule:

- **`prowess`** for striking a beast. §5j merged attack, strength, defence and
  hitpoints into one SKILL called prowess, and the rename was applied to the
  VERB as well. The engine's verb is `attack` and always was. Nothing in that
  window could hit anything.
- **`special`** for the burst, renamed `gambit` in the engine, which the SDK, the
  bridge and the server all followed and this window did not. The comment beside
  the line records the same failure happening once before, one layer up.
- **`alch`** for transmuting, which is `transmute`.

Three more branches were unreachable: an earlier arm of the same conditional
chain already matched `offer` and `accept`, and nothing ever sent `decline`.
Two of the three named types the engine does not have either.

§0-i now says the rule the three of them broke: a skill or a material may keep
an old name in the prose, because the reader has a table, but a VERB is the
`type` on a signed input and is renamed rather than translated.
Three of the other seven windows the router serves carried the same class of
fault: `window-diablo.html` could not burst, sell or transmute, `window-3d.html`
still offered to attune to a waystone the world has not had since v6, and
`window-photo.html` carried a dead burst branch. `sell` is repealed outright
(§6l, a keeper buys nothing), so that menu entry is gone rather than renamed.

`window.test.mjs` asks the engine about every input EVERY SERVED WINDOW builds,
and `spec-conformance.mjs` asks it about every verb the law names.

## Apprenticeship could not be entered or ended (§5w)

`teach` and `part` had a rule in `mayDo` and an effect in `apply` and no entry
in `INPUT_SCHEMAS`, so `validateInputShape` answered "unknown input type" and no
node would carry either one. In every world ever founded, a master could not
take an apprentice on and neither party could end it. §5w tabulates both verbs,
so anybody building an implementation from the constitution would have written
them correctly and been refused by this engine.

It is the third time: the note above INPUT_SCHEMAS already records `drink` and
`set_look` going the same way, and says in capitals that a verb needs three
things. The shapes are added, and `constants.test.mjs` now asks the engine
whether every verb it will rule on has a shape to arrive in, so there is no
fourth time.

## What the numbering pass moved

- **Eighteen section numbers named more than one section.** §9b was both
  "terrain must be exactly reproducible" and "catch-up by replay"; §9a, §9d,
  §7, §7a, §7c, §8, §10, §21, §21b, §4c and §41e were each two. It happened
  because the document is numbered by when a section was written and sections
  arrived in blocks: exploration, brewing and the geography of the expanse each
  took §7, §8 and §9 again, on top of a v0.1 core that already had them.
  Exploration is §59 now, brewing §60, the expanse's geography §2p to §2v, the
  window's own sections §61, and the v0.1 scope note §62. `spec-conformance.mjs`
  fails on a repeated number now.
- **§31, §31a, §31b and §32 were in the file twice**, eighty lines apart: a
  draft and the revision that corrected it, both left in. The draft said the
  slow founding was one line and the revision says that was a misreading of the
  profiler. The draft is gone.
- **Forty citations pointed at the wrong section.** The engine used §7a for the
  rockfall and the wild span, which are written at §12c and §14d; §7b for the
  scree-imp (§12d), §7c for the eel buck (§13h), §7d for the looking glass
  (§13j) and §7e for the inn's brewpot (§8a, now §60a). A reader following any
  of them landed on survey markers or the Reading Rule.
- **A hundred and eighteen headings carried a version stamp** and no longer do.
  See §0-i.

## What the v1.0 split moved

- **Part 20** left `SPEC.md` for `LIFTED.md`. It is still constitutional
  and still hashed; it was never history, it is a backlog.
- **141 duplicate paragraphs** were removed from the lifted material. A
  single engine comment cited from eleven sites had been lifted eleven
  times.

## The pack was twenty-eight and is twelve (§5t)

Sixteen sentences in the constitution still described a twenty-eight
slot pack after §5t set it to twelve: the stall's cost, the Wilds
mining loop, the `consign` input shape, the size of a spilled
consignment, the fish a duel is made of, the toll at Millbrook. Two
passages contradicted themselves inside a single paragraph, naming
`INV_SLOTS` in one sentence and twenty-eight in the next.

They were corrected against `engine.js` rather than against each other.
Sites where twenty-eight is still correct: the dragon's blow, the
twenty-eight-level gap in the accuracy clamp, the twenty-eight living
things on the Downs, and §5t's own account of whose number it was,
were left alone.

## Two things the split could not settle

**§6al, the stall's cost, settled before founding.** The recipe moved
from sixteen logs and eight ore to thirty-two planks and eight iron-ore
on the argument that planks stack and logs do not, so twenty-four slots
would become two. `planks` was never in `STACKABLE`, so the cost was
forty slots against a pack of twelve and `raise_market` could not be
satisfied by anybody: the same fault as §7da's retired `rock` seam,
arriving with the fix for it.

Planks stay unstackable. The recipe is **ten planks and two iron-ore**:
twelve slots, the whole pack, which is what §6al always said it cost.

**And `addItem` was not enforcing `STACKABLE`.** The placement path wrote
`{item, qty}` into one slot at any quantity, so a non-stackable added in
bulk stacked anyway, thirty-two planks in a single slot on dismantling
a stall, two on every saw. Five call sites relied on it. The set is now
the rule at every quantity, `saw` asks whether `SAW_YIELD` planks will
fit rather than one, and the bulk refunds spill what will not fit on the
same hundred-interval ground clock a spilled shelf uses.

**And `fire-arrows` did not stack.** Four shafts and a measure of
brimstone made four fire arrows, into a pack that had just been emptied
of one slot, so once the placement path was corrected the craft would
have consumed its materials and returned nothing. Every other kind of
ammunition in this world stacks, because the pack is the magazine.
This one was simply missing from the set.

**§11e, the hauling table.** Its `xp/trip`, `trips to 99` and `hours`
columns were computed against a twenty-eight slot consignment and a
mastery of ninety-nine. Both changed. These are derived numbers and
must be re-derived, not edited.

## The hiscores gained a second axis (§5k)

The board ranked nine trades and standing. A calling had none, so the best
brewer alive had no way to learn that they were: hearthcraft ranks farmers
and brewers in one column, and prowess ranks a berserker against a warden
who took the opposite bargain.

Seventeen more buttons was the obvious fix and the wrong one, the page had
already tried it and backed off, because a wall of buttons pushes the ranks
off the bottom of a phone. A calling is a filter on the trade it belongs to
instead, appearing only once a trade is chosen: at most three, under the nine.

**Only the sworn appear on a calling board.** §5k says unsworn is a choice
and not a waiting room, so inferring somebody's calling from their numbers
would be the derived calling coming back through the window it was thrown out
of.

**And `callingOf` collapsed two facts into one string.** `CALLINGS.earthcraft`
is `'smith'` and so is `SWORN.smith`, so a citizen who swore it and a citizen
who merely has the most experience there read identically. The raw sworn field
now travels beside the word in `/api/hiscores`.

## Counts that outlived their tables

`RECORD_KEEP`'s bound was written as *eighteen skills, two boards each: a
hundred and eight entries*. There are nine trades and fifty-four entries; the
code was always right, because it counts `SKILLS`. The hiscores page carried
the same fault in five places and a heading that read **The Sixteen**, and
`index.html` still introduced a citizen by *the sum of all sixteen skills*
with *combat is three skills of sixteen*: written before §5j made prowess
one trade. All corrected, and §6cg's note about `'all sixteen'` is the third
instance of this exact fault, which is why the tests now read the constants
rather than the prose.

## The unaided filter counted the wrong people

§7dk gives the unaided toggle a count for a specific reason: on a young
world nobody has taken a thing from another, so the filter removes nobody
and the board looks identical, and a control whose no-op is
indistinguishable from a fault is worse than no control.

The count read the whole island. That was merely loose while every board was
either the island or a trade. The calling boards made it wrong: three brewers
on screen under a button reading *show unaided: 40 of 62*.

The board and the button now ask one function, `population()`, and changing
trade or calling redraws the count, it previously survived the population it
was counting. An empty board disables the toggle rather than offering a choice
between two empty lists.

**And the trade/calling pair is validated where it is read.** `brewer` on the
woodcraft board is not a narrow board, it is brewers ranked by woodcutting.
The picker cleared the calling on every trade change and that was enough, which
is the shape of every silent disagreement in this codebase: correct because a
caller remembered. `activeCalling()` checks the pair at the point of use, and
the picker highlights through it too, so a stale value cannot look pressed.

`site.test.mjs` exercises the selection out of the document with no browser.

## Vaults became local, and food became a rate (v1.0)

Two changes made together because both are about geography mattering.

**The vault.** `player.bank` was one map readable at every counter, which
§11e itself described as a teleport for goods. That is what left `wayfaring`
with a `runner` calling and nothing to run, and hauling an errand nobody
needed. Vaults are keyed by bank node id now.

Three things would have broken silently and each has a test. `_cloneFlat`
copies one level, so a two-deep bank left the inner vault ALIASED between the
state a tick was computed from and the one it produced: a write reaching
backwards into history, and a fork. `bank` also left `_cowDeep`, because the
copy-on-write wrapper memoises one level and would have handed back an
unwrapped vault. And the deposit gate proved *some counter* by boolean while
the resolver chose *this counter*; every bank check now goes through one
lookup, which returns the node KEY: nodes carry no `id` field, so the obvious
implementation would have keyed every vault on `null`.

**The food.** Healing arrived whole in the interval it was swallowed, so a
duel was a contest in clicking fish. §6m-ii had already noticed and answered
with a rhythm, which is a rate limit bolted onto a burst.

The sustained rate is unchanged: the rhythm already bounded how often a
citizen could eat, so a window of the same length preserves `healOf` over the
rhythm exactly. Nothing in the item table, the cook's ladder or the brewer's
economy is rebalanced. Only the peak moves, from six in an interval to one.

## The vault's bounds, corrected (§6g)

The 512-kind bound came across from the global vault and could never fire:
there are ninety-one items in this world. A bound that cannot fire reads as
protection while being furniture, so it is gone and the item table is the
bound on kinds, as it always really was.

What replaced it is a bound on DEPTH: eight thousand of any one kind per
vault, which is `SHELF_CAP`, because a vault holding what a shelf holds is one
number rather than two nearly-equal ones. That is the half of local vaults
that makes goods circulate instead of merely sitting somewhere specific.

It is deliberately not a state invariant. A crossing sums the shelves of a
world that no longer exists and may seat more than a deposit could add, and
enforcing the cap in `validateState` would mean destroying the excess, which
contradicts a crossing carrying a citizen whole. An over-full vault is lawful
and drains by being used.

## The incursion could walk into a town (§6ao)

Its seat was chosen from the twelve tiles around the target, testing bounds,
terrain and mob collision and nothing else, so a citizen standing at a
counter in Anchor could have one appear beside them. The event's whole design
is that neighbours notice and come, and it hits softly so they safely can; but
a town is the one place this world promises nothing may strike you, and it
was being broken for whoever happened to be banking rather than for somebody
who chose to be out.

The SEAT is tested, not the target: a citizen just outside a town may still be
answered, and one inside is simply not seated. The roll passes with nothing
spawned, which costs nobody anything: §6bv already says an unanswered
incursion is a story.

**And there is one definition of a town now.** `inCity` names Anchor and
Norwick; this island has seven towns. §6dc had already needed the real
question and answered it inline: a bank within sixteen tiles, since every
town has its counting house. That is a named function both callers share,
because two functions deciding separately where a town is would eventually
disagree about it.

**A note on the faces.** `woodwraith`, `gargoyle`, `drownling`, `wilds-shade`
and `haunt` are faces of the incursion and not mobs. They share one scaled
body and differ only in drops; the biome faces are the fallback when the
target was not gathering. A test now pins that no face may carry stats, because
the day one does, answering a call stops being a decision about whether to
help and becomes a bestiary lookup.

**And §6cz's blow scaling is dead.** It made maxHit a tenth of the target's
frame, written when hitpoints were a skill and a newcomer had ten. §5j made
the frame flat at sixty-four, so the tenth is six, capped back to the table's
four, and every citizen takes four whatever they are. That is correct: four
against sixty-four is the "come help, never flee" it was reaching for, and the
flat frame does the job the scaling was invented for. Left standing rather than
replaced with the constant, because a calling moves the frame (§5k) and the day
one moves it far enough this starts working again on its own. The comment
claimed a world §5j abolished, and now says so.

## The food rate, and a clamp §5j left behind

**Foods got their tiers back.** The first version of §6m-vii made healing a
window at one hitpoint an interval, which was a good rule that threw the ladder
away: every food felt identical moment to moment and differed only in how long
it lasted. A cooked deep fish is the capstone of shorecraft and should not mend
like a swallow of ale.

A food now carries a RATE as well as a total. Three for the deep catch, two for
the cooked, one for the preserved and the brewed. The totals are untouched, so
still nothing is rebalanced; the peak rises from one to three, which is a long
way under the ten a deep fish used to restore in a single interval.

The state became a DEBT rather than an end tick, because a rate that does not
divide its total evenly would lose or invent a hitpoint at the last payment.
Cooked eel is seven at two: two, two, two, one.

**And `WOUND_FLOOR` no longer binds anything.** §6c-ii clamps a wounded frame
at ten on the argument that *the people who die most are the people who have
just arrived, and a rule that lands hardest on whoever is still learning the
world is a rule that teaches them to go away.* That was written when hitpoints
were a skill and a novice's frame was ten. §5j made the frame flat at
sixty-four, so a full ten wounds leaves fifty-four and the floor is never
reached by anybody.

Left standing, like §6cz's blow scaling, and for the same reason: flatness now
does most of the job the clamp was invented for, since ten of sixty-four is the
same fraction for a newcomer and a master. The residual is that beginners die
more often and the wellspring is remote, so they will carry a wounded frame for
longer than a veteran will. That is a thing to watch when the world is played,
not a thing to fix before it has been.

## Forage outlived the citizen it was written for (§6m-vii)

Goblin, wolf and bear leave forage about a third of the time: six hitpoints
eaten where it lies, rotting in fifty intervals, impossible to carry. Its
rationale said it gave *a citizen at four hitpoints a reason to look at where
they are standing rather than what they are carrying.*

There is no citizen at four hitpoints in the hunting country any more. §5j made
the frame flat at sixty-four and a goblin lands half a hitpoint an interval, so
reaching four would take two minutes of unanswered swinging. That is the fourth
thing found this session sized against a ten-hitpoint newcomer, after
§6cz's blow scaling, `WOUND_FLOOR`, and §6ao's town-safety assumption.

It kept a job anyway, and a better one, by accident. Food became a RATE, so a
fixed six ARRIVING AT ONCE is now the only instant mending a citizen can get
alone in the field. The bursts are a closed set of three, each paid for
differently: the well is a PLACE (dry behind you), `mend` is a PERSON (someone
must cast it), forage is the GROUND (it rots, and you cannot take it with you).
A test pins that set, because a fourth added quietly would undo the reason the
rate exists.

The old note called it *deliberately not better food*. It is not food at all
now, which is what it should always have been.

## The web window, and five verbs it had quietly switched off

**Right-click.** The pack's verbs now appear at the pointer as well as in the
bar above the pack. One list either way: `chooseAction` is still the only place
options are built, so the two inputs cannot drift into offering different
verbs. The tap path is untouched, because a floating menu under a thumb covers
the thing it is about.

**The horse belongs to the consignment.** The old note ended by conceding the
whole point: *on a road everybody is mounted and it tells you nothing, but off
one, mounted means CARRYING.* A silhouette that means one thing on a road and
another beside it is not a signal. The traveller's horse is gone; a rider is a
hauler, on any tile. The flicker linger went with it: a consignment is a
discrete state, not a meandering set of tiles.

**And §5m had switched five things off in the client.** The merge from eighteen
skills to nine renamed the engine's ladders and left the window reading the old
names. `skills.mining`, `skills.smithing`, `skills.firemaking`,
`skills.exploration` and `skills.magic` are all `undefined`, which falls to
level one, which fails every gate they guard: with no error anywhere. The
charter was unreachable for a master wayfarer, charcoal for a master
woodcrafter, and **every spell above level one reported itself uncastable to
every citizen in the world.**

`CAPE_COLORS` was the same merge failing differently: eighteen entries renamed
in place, so four keys were written two or three times and JavaScript silently
kept the last. Woodcraft was green, then red, then ochre. Five colours were
dead on arrival and `wayfaring` had none at all. And `capeOf` gated on
ninety-nine, so a cape arrived a level before mastery, which, since the last
level is near a seventh of the whole ascent, is a very long time early.

`window.test.mjs` now reads the client's skill names against `SKILLS`, checks
`CAPE_COLORS` for duplicate keys and colours, and pins the mastery threshold.
None of this needed a browser.

## The tide, the stint, and the one thing befriending lost (v1.00, §14e)

This world had no seams. It advanced one interval a second forever, which is
exactly what was asked of it, and it meant nothing in it ever finished. Every
mechanism that would coerce a citizen into staying had already been refused:
no live-ops, no patience tax, no lockout for absence, and that was most of
the work, but the last part cannot be done by refusing things. A citizen had
to stop by themselves, unassisted, and that is the one moment a person is
worst equipped for.

§14e adds a tide (windows computed from the interval count, the same for
everyone) and a stint (a promise a citizen swears against one). What follows
is what it cost, and what was tried and thrown away.

**`befriend` was repealed and re-granted narrower.** §7cn made a kept name
cost nothing but proximity: be within twelve tiles of somebody alive, and the
name is yours to keep. In a world with a tide it now also costs a tide being
up and BOTH citizens standing inside stints they swore in advance. That is a
repeal of a rule four releases old and it is recorded here as one rather than
described as an addition, because a citizen who could keep a name yesterday
and cannot today is owed the sentence that says so.

The narrowing is not there to make names scarce. A name kept under §7cn could
be a coincidence: two people who happened to be in the same field. Under
§14e it cannot: it takes two promises made separately and beforehand, and
then kept. **A founding that omits `genesis.tide` keeps §7cn exactly as it
was**, which is what governance by exit is for.

**A queue was considered and thrown out.** The obvious model was the login
queues of the old subscription worlds, which did produce the effect wanted:
an hour of waiting meant nobody entered casually, and once in, people stayed
and made the wait worth something. But a queue is a capacity limit, and a
capacity limit is patience charged as an entry fee. This world's pillars
scale; imposing one would have been inventing a scarcity that does not exist
in order to price the one thing §6am says must never be priced. What the
queue really did was put the cost at the DOOR, where it falls on the person
and blocks them from the thing. §14e moves the cost inside: entry is instant
and free, and the deliberateness comes from swearing a length rather than
from waiting for permission.

**A random per-citizen grant was considered and thrown out.** It was proposed
on the grounds that the ionosphere does not ask either. But the ionosphere is
indifferent, not arbitrary: it is the same for everybody and it is
forecastable, which is why it reads as weather rather than as a dealt hand.
A window rolled per citizen would have been the first random thing in a
protocol whose every other value is a pure function of the seed, and it would
have killed the mechanism it was meant to serve, a promise you did not make
is not a promise, and two people assigned overlapping windows have a
coincidence, not an appointment.

**`isAwake` was the wrong instrument and the tests caught it.** The first cut
measured standing with `isAwake`, which is generous by design: `SLEEP_AFTER`
is five hundred intervals. Any stint shorter than that could be stood in FULL
by a citizen who left on the interval they swore it. `stintPresent` uses the
founding's own `sample` instead, and keeps the running-action clause, because
a citizen watching a pickaxe work is present and should not have to jog the
keys to prove it.

**And the tally counts the overlap, not the stint.** The first shape recorded
how long a citizen stood their own promise, which is a bot leaderboard: a
script never overruns and never forgets. What settles instead is who ELSE was
inside a stint within twelve tiles, sampled. A script can stand a flawless
stint alone forever and its tally stays empty. That is the only measure in
this world a bot cannot saturate, and it is the reason the feature exists at
all.

**What it deliberately does not do.** It gates no yield, no price, no blow. A
settled stint pays nothing. It ends nobody's evening: everything after a
stint closes works as it did before, and what ends is only the part that was
promised. And it charges no patience: a citizen who misses every tide for a
year loses no ground to one who caught them all.

## Closing time, and what it excludes (v1.01, §14f)

§14e gave the world a bounded thing inside it. This bounds the world itself:
ninety minutes of standing in any rolling twenty-four hours, ten minutes'
notice, and then the citizen stands down until the window rolls.

It is the most intrusive rule in the constitution and it was argued about
longest. What follows is what was rejected, what was wrong on the first
attempt, and: the part this document exists for, who it costs.

**Three hours was the first number and it was wrong.** It is more than most
working adults have in an evening, so the ceiling would never have bound for
the citizens it was built for. A limit nobody reaches is not a design, it is a
decoration. Ninety is the number that binds, and it is roughly the number a
parent gives a child, which is the only piece of evidence anybody actually had.

**A daily cap was rejected for a rolling window.** A day needs a wall clock,
and this protocol's only truth is the interval count; every midnight anybody
could pick is dinnertime for somebody else. Worse, a resetting allowance is
itself a retention hook: "I have not used today's yet" is the same engine as a
daily reward, and it makes absence costly, which is the exact thing §6am
refuses.

**A freeze was rejected for a stand down.** A limit that lands in the Wilds,
mid-fight, carrying a full pack, and takes the haul, is not a boundary. It is a
punishment, and the notice exists because of it. The announcement is not a
courtesy wrapped around the rule; it IS the rule. What a bounded session did
was never the stopping: it was knowing it was coming.

**And the argument that nearly stopped it was wrong.** It was held, at length,
that enforcement requires an owner, and that Interval cannot have one. That is
backwards: consensus IS enforcement without an owner, and it is what this
protocol has claimed from the start. A rolling budget on a citizen's own key is
no less enforceable than the stint cap, and no more owned. The sybil objection
was wrong for a different reason: a second keypair here costs skills,
standing, a sworn calling, kept names, and vaults that have a location. A limit
you must pay that much to leave is a limit.

**WHO THIS EXCLUDES.** Someone housebound. Someone retired. Someone snowed in
for a week in February. Their relationship with a world is legitimately
long-form, and to them this rule says their life is the wrong shape. They will
be among the most devoted citizens here and they will feel it most. The
intended answer is rotation between several citizens, which is a real trade
where depth is what gets ranked, but it is not free and it is not nothing.

This was chosen with that in front of us, not discovered afterwards. If it
proves wrong, the next founding should see the reasoning and not only the rule.

**It is not a wellbeing feature.** It should not be described as one. Anybody
for whom stopping is genuinely compulsive will make a second key without much
internal argument. What it actually does is shape play for citizens who care
about their citizen, and cap what any one identity can accumulate per unit of
real time, which closes the last gap in "what a script cannot do is be
somewhere".

**And a correction on the record.** During the work it was reported that
citizens in the expanse are walled in on all four sides and that spawn
placement might not be checking walkability. That was wrong. The test was
placing citizens at the northwest corner of an 896x512 island, which is sea:
101 walkable of 625 sampled there, against 142 of 144 around the real anchor at
448,256, which is itself walkable. Nothing was broken. The instrument was in
the water.

## The overlap tally was inflatable, and what replaced it (v1.02, §14e)

§14e claimed the co-presence tally was the one measure in this world a script
could not saturate, because what a script cannot do is make anybody else show
up. That is true of a script standing ALONE. It was never true of a FARM.

One operator running two citizens stands them side by side, both sworn, both
present, and the world read it as company. Overlap counted in intervals was
inflated by leaving the machines there. The measure the whole design leaned on
was fake against anybody willing to run two keys, which is a low bar.

What accumulates now is `known`: distinct citizens ever met inside a stint,
gated by `genesis.stint.meets` so a passing is not an acquaintance. A farm of N
keys can manufacture at most N(N-1)/2 pairs: bounded, paid once in the price
of N identities, and flat in time. The per-stint overlap is still recorded,
because it is the texture of an evening. It is no longer what gets ranked.

This is recorded as a correction rather than a feature. The earlier claim was
stated confidently in this document and it was wrong.

## The chat gate and the name gate, repealed (v1.03, §14g)

§14e made the far channel need a tide up and an open stint, and made a kept
name need the same. Two releases later §14f bounded presence itself: ninety
minutes in any rolling day. Both rules were kept for one release and they
should not have been.

**The gates were right when they were written.** With an unbounded session,
gating the far channel manufactured a scarcity that did not otherwise exist,
and that was the whole point of it. Closing time supplies the same scarcity
directly, and better, because it bounds the thing that actually wanted
bounding.

**Kept together they multiplied.** The far channel stands open about a sixth
of all intervals. A citizen spending their entire ninety minutes could be
heard across the island for roughly fifteen of them. That is not a bounded
conversation; it is mostly not being able to talk, inside a window that was
already short, and typing to people while the world goes on around you is
most of what there is to do here.

**And they taxed the wrong thing.** The ceiling bounds how long a citizen is
here. The tide bounded whether they could be heard while here. Only the first
of those is a boundary. The second is an obstacle dressed as one.

The name gate fell with it, and more obviously: two people who spent a whole
evening together should never have been told the band was shut. §7cn stands as
originally written: be near somebody living, and the name is yours.

**The tide is kept and given a different job.** It permits nothing now. The
longest of the three announces its turning, four times a day, because a
Schelling point is not a rule: it is a moment everybody can compute and agree
on without being made to. Ninety minutes each, across every timezone, would
scatter people into windows that never overlap; a shared hour nobody chose and
everybody can read is what fixes that. The short tide stays silent: twenty
announcements a day is wallpaper, not an event.

**Recorded as a repeal, twice over.** §14e argued at length that the licensing
analogy was exactly right, receiving unrestricted, transmitting licensed. The
analogy was good. The rule it produced was wrong once the world had a ceiling,
and a constitution that hashes its own repeals should say so in those words
rather than quietly deleting the paragraph.

## The maul became the mell, and its special stopped being a burst (v1.04, §6ag)

The maul carried `spec: 'now'` -- a blow gated on a SPENT arm, so it dropped on
top of an ordinary swing and ended fights. That is, recognisably, another
game's weapon, and this world had spent a great deal of effort not looking
like that game. The name said the same thing twice over.

**The special is now `whole`: the blow does not roll. It lands the top of its
own style's range, and its chance of landing is scaled by mean over maximum.**

`styleRoll` has mean (M+1)/2 for every style -- the inset moves both ends of
the range inward by the same amount, so it changes spread and never average.
So scaling the chance by mean/max leaves the expectation exactly unchanged.
Measured across M of 8, 13, 23 and 46, the ratio of whole to ordinary
expectation is 1.0000 at every scale.

That makes it the only special in the table neutral BY CONSTRUCTION rather
than by a measured pair. `flurry` needs blows and recovery moving together;
`now` needed bite and recovery moving together, and §6af-vii is a long note
about the release where they did not. `whole` needs neither, and the row lost
its `bite` -- one fewer tuned number in the world.

**What it sells is variance**, which nothing else here trades in. `flurry` and
`now` rearrange damage in TIME; this rearranges it in SHAPE. It selects its own
domain the same way: against four hundred points of dragon a fatter tail is
worth nothing, and against a citizen one good blow from dead it is the fight.

**And it waits for the arm.** `now` was the one special that could interrupt,
which meant it had to be balanced as a PAIR with an ordinary blow rather than
on its own -- the whole subject of §6af-vii. There is no combo to measure now.
The ceiling is two whole blows and nothing may land on top of them.

`now` survives on the fire-siphon, where §7am argues for it on its own terms:
one sustained gout, out of rhythm, when you decide. The mechanic was not lost,
only taken off the weapon it was wrong for.

**On the name.** `mell` is a northern English and Scots word for a heavy
hammer, the same root as *mallet* through Old French *mail*. It is real, short,
and unspoken for. Both mauls kept every other number: the largest ordinary blow
in the world, and the worst chance of landing it.

**LIFTED.md was NOT renamed.** It records what the rules were, and a repealed
rule that quietly acquires today's vocabulary is a falsified record. Thirty-four
occurrences of the old word stand there on purpose.

## Texture in the gathering trades, and three things got wrong first (v1.05, §14h)

Woodcraft and shorecraft gathered the same way earthcraft did before the
furnace: stand at a node, spend the arm, take the item. §14h gives each of
them a second act. What follows is what was wrong on the way there, because
each of the three was wrong in a different and instructive direction.

**The trees were nearly made finite, and it would have been vandalism.** The
first design made wild trees permanent and replantable. Then the counts were
measured: SIX ironbark trees exist in the whole world, and their job is the
watchfire. One citizen with an axe would have ended the one public work here
in an afternoon, with nobody able to undo it until a planting system existed.
At those counts permanence is not stewardship, it is a griefing surface. The
wild stands were left exactly as they were and permanence moved to the
cultivated layer, where a stripped ring is always somebody's to restore.

**And the groves were nearly scattered.** There are twelve hundred farm plots
already placed, and putting saplings in them was the obvious move. It was
also wrong: ABUNDANCE DISPERSES AND SCARCITY CONCENTRATES. Twelve hundred
plantable plots would have given everybody a garden and nobody a neighbour,
which is how self-sufficiency hollowed out the social density of a good many
worlds. The low counts in this one are deliberate gathering points. Eight
plots ringing each of the two stands EXTEND those points instead of replacing
them: a tended site holds a crowd rather than three citizens taking turns.

**The buck paid the wrong citizen.** The first cut awarded the lift experience
to whoever lifted, and anybody may lift a buck -- so patrolling the fen
emptying other people's traps was strictly better than running your own: one
action for a full catch against one action, one log and half an hour of
waiting. That is a parasite and the easiest thing in this world to script. The
eels now go to whoever pulls them out and the skill stays with whoever wove the
trap. A thief gets supper and no progress, and the experience is not passed to
the absent setter either -- this world does not pay anybody for not being here.

**The dragon's isle was built in the wrong place twice.** First in safe water
off the north-east coast, which deletes the entire point: the dragon cannot be
killed alone, so it wants a party, and a party assembled in open hunting
ground is one you had to TRUST. In safe water it is a raid with a boat ride.
Then it was moved -- to the far east, still the wrong side of a map whose
Wilds is the whole western strip. It now sits at 34,30, in sea that `inWilds`
already covered, with its quay on mainland Wilds coast a hundred and
fifty-seven tiles west of the Norwick frontier. You may simply not arrive, and
the boat buys no safety: the isle is Wilds too, so it only commits you.

None of these three were caught by reasoning. They were caught by measuring the
counts, by asking what the dragon was FOR, and by asking who the experience
went to. The general lesson is that a design argument about a world is worth
less than a query against it.

## The grove regrown to six hours, and a verb that had quietly killed another

Two corrections to §14h, both found after it was written.

**Two days was wrong.** At that rate a grove was an ornament: no farmer could
train on it, so the only citizens planting would have been ones doing it as a
favour, and a public good that needs favours does not get built. Six hours lets
a farmer sow in the morning, come back in the evening, fell and sow again --
and the ninety minutes may be split however a citizen likes, so two short
visits a day is an ordinary way to live here.

The experience is now the crop rate held exactly: forty per seven hundred and
twenty intervals, so a six-hour tree pays 1200 and not a point more. It is not
a faster method, it is a lower-attention one -- the same wage for waiting
rather than clicking. Sixteen plots cap the island's whole grove throughput,
which is what stops a lower-attention method from dominating.

**And `plant` already existed.** The grove's verb was called `plant`, and so is
the verb that sows a seed from a pack slot (§6o). `INPUT_SCHEMAS` is an object
literal, so the later key simply won and FARMING STOPPED WORKING with nothing
to show for it -- the world still founded, the state still validated, the
grove's own tests still passed. Only the §13 canonical action battery noticed,
because it is the one thing that enumerates every verb and demands exactly one
accepted form for each.

The grove's verb is `sapling` now. The lesson is written into the schema beside
it: a new verb in this world is not done when the engine accepts it. It wants
an entry in `INPUT_SCHEMAS`, a validation case, an effect, a line in the
canonical battery and an SDK action -- and skipping the last two does not fail
loudly, it fails silently and takes an unrelated trade down with it.
