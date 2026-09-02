# Interval: The Record (`HISTORY.md`)

*Part of the constitution by hash, and binding on nothing. §0-i explains
why it is hashed anyway.*

This file exists because `SPEC.md` was a constitution and a changelog at
the same time, and a repealed number kept sitting in load-bearing
sentences where nothing caught it. The reasoning is the most valuable
thing in this specification and none of it is discarded here — it is
moved, so that the law can be read as law.

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
Sites where twenty-eight is still correct — the dragon's blow, the
twenty-eight-level gap in the accuracy clamp, the twenty-eight living
things on the Downs, and §5t's own account of whose number it was —
were left alone.

## Two things the split could not settle

**§6al, the stall's cost — settled before founding.** The recipe moved
from sixteen logs and eight ore to thirty-two planks and eight iron-ore
on the argument that planks stack and logs do not, so twenty-four slots
would become two. `planks` was never in `STACKABLE`, so the cost was
forty slots against a pack of twelve and `raise_market` could not be
satisfied by anybody — the same fault as §7da's retired `rock` seam,
arriving with the fix for it.

Planks stay unstackable. The recipe is **ten planks and two iron-ore**:
twelve slots, the whole pack, which is what §6al always said it cost.

**And `addItem` was not enforcing `STACKABLE`.** The placement path wrote
`{item, qty}` into one slot at any quantity, so a non-stackable added in
bulk stacked anyway — thirty-two planks in a single slot on dismantling
a stall, two on every saw. Five call sites relied on it. The set is now
the rule at every quantity, `saw` asks whether `SAW_YIELD` planks will
fit rather than one, and the bulk refunds spill what will not fit on the
same hundred-interval ground clock a spilled shelf uses.

**And `fire-arrows` did not stack.** Four shafts and a measure of
brimstone made four fire arrows, into a pack that had just been emptied
of one slot — so once the placement path was corrected the craft would
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

Seventeen more buttons was the obvious fix and the wrong one — the page had
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
with *combat is three skills of sixteen* — written before §5j made prowess
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
trade or calling redraws the count — it previously survived the population it
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
state a tick was computed from and the one it produced — a write reaching
backwards into history, and a fork. `bank` also left `_cowDeep`, because the
copy-on-write wrapper memoises one level and would have handed back an
unwrapped vault. And the deposit gate proved *some counter* by boolean while
the resolver chose *this counter*; every bank check now goes through one
lookup, which returns the node KEY — nodes carry no `id` field, so the obvious
implementation would have keyed every vault on `null`.

**The food.** Healing arrived whole in the interval it was swallowed, so a
duel was a contest in clicking fish. §6m-ii had already noticed and answered
with a rhythm, which is a rate limit bolted onto a burst.

The sustained rate is unchanged — the rhythm already bounded how often a
citizen could eat, so a window of the same length preserves `healOf` over the
rhythm exactly. Nothing in the item table, the cook's ladder or the brewer's
economy is rebalanced. Only the peak moves, from six in an interval to one.

## The vault's bounds, corrected (§6g)

The 512-kind bound came across from the global vault and could never fire:
there are ninety-one items in this world. A bound that cannot fire reads as
protection while being furniture, so it is gone and the item table is the
bound on kinds, as it always really was.

What replaced it is a bound on DEPTH — eight thousand of any one kind per
vault, which is `SHELF_CAP`, because a vault holding what a shelf holds is one
number rather than two nearly-equal ones. That is the half of local vaults
that makes goods circulate instead of merely sitting somewhere specific.

It is deliberately not a state invariant. A crossing sums the shelves of a
world that no longer exists and may seat more than a deposit could add, and
enforcing the cap in `validateState` would mean destroying the excess — which
contradicts a crossing carrying a citizen whole. An over-full vault is lawful
and drains by being used.

## The incursion could walk into a town (§6ao)

Its seat was chosen from the twelve tiles around the target, testing bounds,
terrain and mob collision and nothing else — so a citizen standing at a
counter in Anchor could have one appear beside them. The event's whole design
is that neighbours notice and come, and it hits softly so they safely can; but
a town is the one place this world promises nothing may strike you, and it
was being broken for whoever happened to be banking rather than for somebody
who chose to be out.

The SEAT is tested, not the target: a citizen just outside a town may still be
answered, and one inside is simply not seated. The roll passes with nothing
spawned, which costs nobody anything — §6bv already says an unanswered
incursion is a story.

**And there is one definition of a town now.** `inCity` names Anchor and
Norwick; this island has seven towns. §6dc had already needed the real
question and answered it inline — a bank within sixteen tiles, since every
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
four, and every citizen takes four whatever they are. That is correct — four
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
whole point — *on a road everybody is mounted and it tells you nothing, but off
one, mounted means CARRYING.* A silhouette that means one thing on a road and
another beside it is not a signal. The traveller's horse is gone; a rider is a
hauler, on any tile. The flicker linger went with it: a consignment is a
discrete state, not a meandering set of tiles.

**And §5m had switched five things off in the client.** The merge from eighteen
skills to nine renamed the engine's ladders and left the window reading the old
names. `skills.mining`, `skills.smithing`, `skills.firemaking`,
`skills.exploration` and `skills.magic` are all `undefined`, which falls to
level one, which fails every gate they guard — with no error anywhere. The
charter was unreachable for a master wayfarer, charcoal for a master
woodcrafter, and **every spell above level one reported itself uncastable to
every citizen in the world.**

`CAPE_COLORS` was the same merge failing differently: eighteen entries renamed
in place, so four keys were written two or three times and JavaScript silently
kept the last. Woodcraft was green, then red, then ochre. Five colours were
dead on arrival and `wayfaring` had none at all. And `capeOf` gated on
ninety-nine, so a cape arrived a level before mastery — which, since the last
level is near a seventh of the whole ascent, is a very long time early.

`window.test.mjs` now reads the client's skill names against `SKILLS`, checks
`CAPE_COLORS` for duplicate keys and colours, and pins the mastery threshold.
None of this needed a browser.

## The tide, the stint, and the one thing befriending lost (v1.00, §14e)

This world had no seams. It advanced one interval a second forever, which is
exactly what was asked of it, and it meant nothing in it ever finished. Every
mechanism that would coerce a citizen into staying had already been refused —
no live-ops, no patience tax, no lockout for absence — and that was most of
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
be a coincidence — two people who happened to be in the same field. Under
§14e it cannot: it takes two promises made separately and beforehand, and
then kept. **A founding that omits `genesis.tide` keeps §7cn exactly as it
was**, which is what governance by exit is for.

**A queue was considered and thrown out.** The obvious model was the login
queues of the old subscription worlds, which did produce the effect wanted —
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
have killed the mechanism it was meant to serve — a promise you did not make
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
settled stint pays nothing. It ends nobody's evening — everything after a
stint closes works as it did before, and what ends is only the part that was
promised. And it charges no patience: a citizen who misses every tide for a
year loses no ground to one who caught them all.

## Closing time, and what it excludes (v1.01, §14f)

§14e gave the world a bounded thing inside it. This bounds the world itself:
ninety minutes of standing in any rolling twenty-four hours, ten minutes'
notice, and then the citizen stands down until the window rolls.

It is the most intrusive rule in the constitution and it was argued about
longest. What follows is what was rejected, what was wrong on the first
attempt, and — the part this document exists for — who it costs.

**Three hours was the first number and it was wrong.** It is more than most
working adults have in an evening, so the ceiling would never have bound for
the citizens it was built for. A limit nobody reaches is not a design, it is a
decoration. Ninety is the number that binds, and it is roughly the number a
parent gives a child, which is the only piece of evidence anybody actually had.

**A daily cap was rejected for a rolling window.** A day needs a wall clock,
and this protocol's only truth is the interval count; every midnight anybody
could pick is dinnertime for somebody else. Worse, a resetting allowance is
itself a retention hook — "I have not used today's yet" is the same engine as a
daily reward, and it makes absence costly, which is the exact thing §6am
refuses.

**A freeze was rejected for a stand down.** A limit that lands in the Wilds,
mid-fight, carrying a full pack, and takes the haul, is not a boundary. It is a
punishment, and the notice exists because of it. The announcement is not a
courtesy wrapped around the rule; it IS the rule. What a bounded session did
was never the stopping — it was knowing it was coming.

**And the argument that nearly stopped it was wrong.** It was held, at length,
that enforcement requires an owner, and that Interval cannot have one. That is
backwards: consensus IS enforcement without an owner, and it is what this
protocol has claimed from the start. A rolling budget on a citizen's own key is
no less enforceable than the stint cap, and no more owned. The sybil objection
was wrong for a different reason — a second keypair here costs skills,
standing, a sworn calling, kept names, and vaults that have a location. A limit
you must pay that much to leave is a limit.

**WHO THIS EXCLUDES.** Someone housebound. Someone retired. Someone snowed in
for a week in February. Their relationship with a world is legitimately
long-form, and to them this rule says their life is the wrong shape. They will
be among the most devoted citizens here and they will feel it most. The
intended answer is rotation between several citizens, which is a real trade
where depth is what gets ranked — but it is not free and it is not nothing.

This was chosen with that in front of us, not discovered afterwards. If it
proves wrong, the next founding should see the reasoning and not only the rule.

**It is not a wellbeing feature.** It should not be described as one. Anybody
for whom stopping is genuinely compulsive will make a second key without much
internal argument. What it actually does is shape play for citizens who care
about their citizen, and cap what any one identity can accumulate per unit of
real time — which closes the last gap in "what a script cannot do is be
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
keys can manufacture at most N(N-1)/2 pairs — bounded, paid once in the price
of N identities, and flat in time. The per-stint overlap is still recorded,
because it is the texture of an evening. It is no longer what gets ranked.

This is recorded as a correction rather than a feature. The earlier claim was
stated confidently in this document and it was wrong.
