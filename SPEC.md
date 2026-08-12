# Interval: Protocol Specification v0.87 ("The Constitution")

A decentralized, deterministic MMO protocol. The rules in this document
**are** the game. Any client that implements this spec exactly is a valid
window into the shared world. State disagreements mean one party broke the
rules and is ignored by the network.

The world advances in fixed intervals, ticks, and everything that ever
happens, happens on one.

## 0. Nought (the world before the tick)

**Nought is Tallyholm unwalked.** The same island, the same towns, the same
monuments, the same coastline, computed from the same seed by the same pure
functions. Nothing about it is younger: geography is law (§9d) and a world is
founded once, so a changed building is a changed hash and therefore a different
world. What Nought lacks is not age. It lacks **marks** -- no worn paths, no
survey findings, no watchfire lit, no race won, no name on anything, the inn's
yard still waiting for its brewer. The only thing this world accumulates is what
citizens did, and in Nought no citizen has done anything.

**Who is there.** Every key that is not in `players` and is not held under
`archiveRoot`. Nought has no roll, no root and no record. A key is not admitted
to it and cannot be evicted from it; it is in Nought exactly when the world has
never heard of it. A key generated this second is in Nought.

**What happens there.** The rules, entire, run by the resident's own window: the
same engine, the same interval, the same drops, the same death. A resident chops
a real tree at real speed for real logs and real experience, and none of it is
in the world, because they are not in the world. Death costs nothing, because
there is nothing there to destroy.

**Nought is never consensus.** No state hash depends on it. No node computes it
for anyone but its own operator. A node that had never heard of Nought would
compute every tick of this world correctly, forever. What the world holds is not
Nought; it is the two structures below, which exist so that a wait can be
proved.

**Leaving.** `spawn` (§5b), on the terms of §0c. The soul it creates is the soul
§5b has always created. Nothing held, learned, killed or banked in Nought comes
across, because nothing in Nought was ever in the world to come across.

**Returning.** There is none, and no rule is needed to forbid it: Nought is the
set of keys the world does not hold, and after `spawn` the world holds you.
§5b's sentence that a playerId spawns at most once, ever, is now also the
sentence that shuts the door.

## 0a. Nought is a different world that draws the same island

The founding state a resident computes carries `genesis.nought = true`. Nothing
a generator reads changes -- same seed, same size, same generator, so the same
coastline, the same towns, the same fountain, tile for tile -- but the world id
the founding hashes to is not Tallyholm's.

This is the only part of Nought's honesty that does not depend on a window.

**Why it is here and not left to §0e.** A window is asked to say plainly that
nothing in Nought is real, and an honest one does. Nothing in this document can
MAKE it, any more than anything can make a window render speech faithfully
(§9c). A citizen in a careless window could practise for a week believing every
hour of it counted. So the difference is put where no window can blur it:

1. **Nought answers for itself.** `isNought(state)` is one field. Every window
   and every executor ever written gets the same answer, and none of them can
   be lied to about it by a pillar.
2. **"Nothing crosses" becomes arithmetic.** §1 binds every input to a world id,
   so an input signed in Nought is refused by Tallyholm and an input signed in
   Tallyholm is refused by Nought. It stops being an architectural note and
   becomes a rule with teeth, enforced by nodes that have never heard of §0.
3. **A dishonest window is detectable.** Anyone who can read a world hash can
   tell which world they are in, so a window that hides it is not hiding
   something unknowable -- it is hiding something one field wide.

None of that, on its own, tells a person anything. A world id is invisible: no
citizen reads it, and a window that means to deceive will not mention it. What
the marker buys is an unambiguous answer for anyone who asks and a boundary
enforced by arithmetic. It is plumbing, and it should not be mistaken for
legibility.

**The notice goes in the furniture, because nothing else reaches a person.**
This document cannot render, so there is exactly one channel from it to a
citizen's eyes: WORLD CONTENT. A window draws signposts and carries criers
because drawing the world is what makes it a window rather than a frame around
one. So in a practice founding every signpost on the island and every crier in
every town says where you are -- in the same place a citizen already looks to
find out where they are.

A window MUST apply this itself on the founding it is given, rather than trust a
pillar to have done it. A pillar cannot then strip what was never its to strip.

**Who is being designed against.** Not malice. A window that passes Nought off
as the world steals nothing: there is nothing in Nought to take, and a key never
leaves the machine it was minted on. Anyone willing to write a dishonest window
has far better uses for one in the world itself. The realistic adversary is
CARELESSNESS -- an author who never read this section -- and carelessness is
answerable in a way malice is not, by making the lazy path the safe one. A
pillar therefore serves the practice founding already marked, so that a window
which does nothing at all still shows a resident where they are.

**And a citizen need not believe any window.** A soul in Nought has no citizen
in the world: their key is in no `players`, on no hiscore, in no other window.
That is checkable from anywhere, by anyone, without trusting the page they are
looking at, and a window SHOULD say so plainly rather than ask to be believed.
It is the only assurance here that survives a window being wrong on purpose.

**Where the line actually is.** This document cannot render, so it has exactly
one instrument: what it puts in the state. Everything a window MUST draw in
order to be a window is therefore reachable from here, and everything a window
merely CHOOSES to draw is not. That is the whole of it, and it is not a gap in
any implementation -- it is what the word "engine" means in this system.

What the state carries on its own account, with no cooperation asked:

- the tick. A practice world counts from ZERO. Any window that shows the world's
  clock shows two digits where Tallyholm shows eight, forever, without being
  told to.
- every signpost on the island, and every crier in every town.
- every keeper's name.
- the citizen's own name, which is `nought`.
- the population, which is one and never changes. A world with other people in
  it that has nobody in it is its own tell.

What no rule can reach: a banner, a card, a countdown, an explanation. Those are
a window's to give or withhold, and §0g asks for them knowing it cannot compel
them.

A window can still filter the text. Nothing here can stop that and nothing ever
will. But there is a real difference between a window that omits a banner it was
asked to draw and one that rewrites the world's own signposts to hide what they
say. The second is not carelessness; it is forgery, and it is visible to anybody
who stands at the same post in another window.

A pillar serves the practice founding under its own id (§0g). A window MUST
refuse a founding that is not marked, because a pillar serving the real one
would have that window running a private copy of Tallyholm and calling it
practice.

## 0b. Presence in Nought (auxiliary, never consensus)

Residents may see one another. A window MAY relay `{playerId, x, y}` to other
residents over an auxiliary channel, on the same terms as speech (§9c): never
consensus, never judged, never in any state hash.

Each resident computes their own island, so nothing else is shared and nothing
else should pretend to be: a tree one has felled still stands for another, and
their ticks are not the same tick. They are drawn walking the same ground, and
that is all.

A resident may lie about where they are standing. This is permitted and
uninteresting. Nothing in Nought is scarce, contested, ranked or recorded, so
there is no claim a liar could profit from and no ledger a lie could corrupt.
The channel exists so that the place is populated, not so that it is proved.

**Why it is worth having.** A practice world that nobody else is ever in is a
lonelier thing than the world it is practice for, and a first hour spent alone
teaches a newcomer the wrong thing about what they are joining. Everyone
arrives through here. They should be able to see that.

## 0c. The tideline

State carries `tideline`: the finalized state hash of every `TIDE_STRIDE` (10)
ticks, truncated to `TIDE_CHARS` (16) hex characters, `TIDE_LEN` (100) of them.
At the top of any tick where the previous tick number is a multiple of the
stride, that previous tick's resulting state hash is truncated and appended and
the oldest falls off. The buffer is fixed-width: one write per ten intervals,
about 1.6 KB, and it never grows.

The tideline is not what admits a soul. It is the world's own short memory, and
it is here so that a window can show a resident their wait against something the
world will vouch for rather than against its own clock.

## 0d. The attendance

State carries `attend`: entries of `[tick, playerId-prefix]`, ascending by tick,
one per key, holding the `ATTEND_CHARS` (16) leading characters of the id.

- **`attend`** is valid for a key that is not in `players` and does not already
  hold a live entry. On success the world records the tick it saw the knock.
- At most `ATTEND_PER_TICK` (2) are admitted in an interval, in canonical
  `playerId` order, budgeted apart from actions exactly as spawning is (§5h).
  An attend that will be refused does not consume the budget.
- An entry ages out after `ATTEND_WINDOW` (2,000 ticks) and is pruned at the end
  of the tick. Nobody closes this gate: a wait that was never spent simply stops
  being one, and the key may knock again.
- The buffer's ceiling is therefore `ATTEND_PER_TICK * ATTEND_WINDOW` entries,
  four thousand, about a hundred kilobytes, forever. It cannot grow, needs no
  sweep, and is the only structure in this world that forgets by itself.

## 0e. A soul is born of a wait it kept

`spawn` is valid only when the sender's attendance is **ripe**: recorded at
least `VIGIL_TICKS` (1,000 ticks, ten minutes) ago and not yet stale. The wait
is **spent** on success -- the entry is removed -- so one attendance stands
behind exactly one birth.

The window between ripe and stale is the ten minutes in which a resident may
cross. Before it they are early; after it the wait is gone and must be kept
again. Nothing fires at either boundary: `spawn` is an input a soul signs, and a
resident who stays for a year is a resident who never signed it.

**Why the world must write it down.** An earlier draft had the newcomer sign the
world's recent state hashes and present the chain as a vigil. It does not work,
and the reason generalises: those hashes are in state, so any node hands out all
hundred on request, and a key minted this second reads them, signs them in a
loop, and its ten-minute vigil is indistinguishable from a real one.
Verification requires the verifier to hold the data, and whatever the verifier
holds, the prover can read. **Knowledge of public data cannot prove presence over
time.** Elapsed time can only be proved by the world recording something at a
tick nobody can backdate, and that is what an attendance is.

**Why this is not the thing §8 forbids.** §8's rule is that the clock may never
*gate value*: a bot's patience is infinite, so a timer that pays out pays bots
first. The wait pays out nothing. It is not a timer on a reward, it is the price
of entry, and every vessel pays it in the same intervals -- `join.mjs` holds its
key and waits exactly as a person does. The rule that would violate §8 is the
*skippable* wait, where the executor enters at once and only the person waits.

**What a wait proves, and what it does not.** It proves that this key was known
to the world ten minutes ago. It does not prove a deed, and it does not prove
that the waiter and the newcomer are the same person: a key is a key, and where
it was minted is not a fact the world can see. Both limits are accepted. The
first cannot be closed without replaying a resident's run, and a replay costs the
verifier what it cost the resident. The second cannot be closed at all.

**Imported citizens keep no wait.** A founding may seed `players`, which is how
citizens of an old world cross into a new one whole. They exist at genesis, never
call `spawn`, and are never in Nought.

**Before the world is old enough, no soul can be born.** A wait cannot ripen
before `VIGIL_TICKS` have passed, so a world stands unwalked for its first ten
minutes, once, and no citizen will ever see that again.

## 0f. The fountain

A `fountain` is an inert node with no verb, no validity case and no behaviour in
this document beyond standing where it stands. It is the only object in the
world that the world itself never uses. That is its justification and not a gap:
the crossing needs a tile every window agrees on, and the constitution can supply
the tile without supplying a rule.

Exactly one is founded, in Anchor, beside the tile a citizen wakes on. It is
**not a well**: `drink` restores a citizen to full with no cooldown (§6l), which
in a place where death is free and fighting is the point makes the well the
most-touched object a resident has, and an irreversible act does not share
furniture with a habit. The two stand near each other in Anchor and say opposite
things with the same water.

The engine cannot check where a resident stands -- they are not in `players` and
have no position any node computes -- so no rule requires the fountain and none
pretends to. §0g is convention, and convention is sufficient for what it is for.

## 0g. What a window owes a resident

- A window that mints a key MUST open in Nought and MUST send `attend` at once.
- A window MUST NOT send `spawn` on its own initiative, at the wait's ripening
  or at any other time. The crossing is an act; there is one thing in this world
  that shuts a door behind a citizen and it may never be done for them.
- A window MUST NOT send `spawn` until the resident's key has been exported. The
  citizen is the keypair (§1), and a soul that crosses with its key held only in
  a browser is a soul with a countdown on it.
- A window offers the crossing at the fountain in Anchor and nowhere else, and
  MUST NOT complete it on a single action. It MUST name, in plain words, that
  everything held and learned in Nought ends here, that this key can never be in
  Nought again in this world, and that the key is the only thing that crosses.
- A window SHOULD furnish a resident with every tool the world is gated on, a
  set of gear, material to work, and gold enough for its shops. This world is
  tool-gated (§6ao), so a soul made as §5b makes one cannot cut, mine or fish
  at all, and an unfurnished Nought is a practice ground where almost nothing
  can be practised. It costs nobody anything: none of it crosses.
- A window SHOULD tell a resident how to check without it: their key holds no
  citizen in the world, on any hiscore, in any other window. An assurance that
  depends on the window making it is worth nothing against a window that lies.
- A window SHOULD show the resident THE OTHER WORLD while they stand in this
  one: Tallyholm's live tick and how many citizens are in it. A newcomer cannot
  tell there are two worlds because they have only ever seen one, and being told
  does not fix that. A real population counting up beside a wait counting down
  is the whole idea in one line, and it is worth more than any paragraph.
- A window MUST make it plain, continuously and not only once, that nothing in
  Nought is in the world. It SHOULD do so in the plainest words it can find. A
  window that says a beautiful thing a newcomer cannot decode has not said it:
  most people arriving here have never heard of Tallyholm, and the sentence they
  need is that there are two worlds and this is the practice one. A resident may stay for an hour or a year, and the one
  unforgivable outcome is that they find out late. A banner that does not leave
  and a world drawn visibly apart are worth more than any number of messages,
  because neither can be looked away from.
- A window SHOULD show the queue rather than hide it. §5h admits one soul per
  interval, so a crossing may not take on the first tick and the window simply
  keeps sending. That wait is the rule, and it is the only place in the world
  where a person can watch it happen to them.

An executor is not a window and is bound by none of §0e. It sends `attend`,
waits the same ten minutes, sends `spawn`, and renders nothing. The protocol
cannot tell the difference, and does not want to.

## 1. Core principles

1. **Determinism.** Given `(state, inputs, beacon)` for tick N, every
   correct implementation computes byte-identical state for tick N+1.
2. **Discreteness.** All quantities are integers. No floating point
   anywhere in consensus-relevant logic.

   A note on words. The protocol field is `tick`, and this document uses
   that name whenever it is describing the field, the wire, or the
   arithmetic. The world's word for the same span is an **interval**,
   and the manual, the windows and the site use that. They are the same
   600 milliseconds. Neither is more correct: one is what implementers
   type, the other is what citizens say.
3. **Verifiability.** Randomness derives from a public beacon; every drop
   roll can be re-computed and audited by any peer.
4. **Bot indifference.** The protocol does not attempt to detect bots:
   because bots are not tolerated guests here, they are load-bearing
   citizens. Witnesses are bots. The joiners that keep quiet hours alive
   are bots. Since v0.38 their deeds feed the very randomness beacon.
   Economy and progression are designed so automation is priced in, not
   policed (see §8).
5. **Governance by exit.** The rules cannot be amended, only succeeded.
   A rule change is a new world (see §9); players choose their
   constitution by where they play.

## 2. Time

- The world advances in **intervals (ticks)** of 600 ms.
- Tick numbers are unsigned 64-bit integers starting at 0 (genesis).
- All actions resolve on tick boundaries. There is no sub-tick time.
- The genesis object contains `anchorMs`, the wall-clock epoch (Unix ms)
  of tick 0. Tick N finalizes at `anchorMs + (N+1) * 600`. Every node
  runs this schedule independently: the world has one clock, and it is
  arithmetic, not a server. Inputs for tick N must reach a node before
  it finalizes N; a node that stalls past a boundary must re-sync from
  checkpoints rather than guess.

## 2b. Geography (founding layout)

A founding grows two hamlets joined by a trail. **Westhearth** stands
at the western end and **Eastmere** at the eastern end; each holds a
bank, an anvil, and a hearth campfire arranged around the trail row
(`trailY = floor(worldH / 2)`). Fishing waters pool near each hamlet.
Trees, rocks, and goblins scatter across the meadows between,
seed-placed, avoiding the trail and the hamlet grounds. Spawn is the
center of the trail: every citizen arrives on the road, halfway
between the two lights. The trail itself is not state; windows may
paint the road however they like, but the buildings stand where the
constitution says.

## 2d. The city of Anchor

North of the crossroads, at the road's end, stands **Anchor**: the
walled city, named for the founding moment every genesis carries. Its
bounds are the rectangle `x in [cx-8, cx+8], y in [2, 10]` where
`cx = floor(worldW / 2)`. Walls (inert, impassable) trace the
perimeter, broken by a three-tile gate in the south wall at
`x in [cx-1, cx+1]`, flanked by guards. **No mob may enter the city
bounds**: the wander rule refuses any step into them. Inside stand a
bank, a walled smithy with its anvil and smith, hearths, a well, and a
hearth. Inert citizen-shaped nodes (`guard`, `smith`) are furniture
with faces: impassable, unattackable, and reassuring.

New inert node types: `wall`, `signpost`, `guard`, `smith`, `well`.

## 2e. The highlands, the cave, and the deep forest

Northeast of Anchor rise the **rocky highlands**: dense ore and, glinting
among the gray, **magic rocks**, veined with light. Sunk into the
highlands is **the cave**, a dark gallery where **trolls** dwell.
Southwest across the trail spreads the **deep forest**, thick with
trees. Windows may paint the cave dark and the forest deep; the nodes
and mobs stand where the founding says.

## 2f. The wide world (v0.30)

The founding grows to town scale. Along the great east-west road:
**Westhearth** and **Eastmere** as before. North up the king's road:
**Anchor**, the walled city. Northeast: the **highlands** and the
**cave**. Southwest: the **deep forest**, now the haunt of the
**bear**. South down the lake road lies **Stillwater**, a fishing
village on the shore of the great lake, keeping the world's first
**general store**. Southeast sits **Milbrook**, a quiet town of
hearths, bank, anvil, and well. Roads are painted by windows; every
building, water tile, and creature stands where the founding says.

## 6l. The store and gold (the first coin)

Each citizen carries `gold` (an integer, starting 0). `sell {slot}`
is valid beside a `store` node when the slot's item has a listed
price; it resolves same-tick: the whole stack is consumed and
`gold += price * qty`. Prices: logs 2, ore 5, raw-fish 3,
cooked-fish 6, bones 2, arrows 1, magic-stone 20, bronze-sword 15,
bronze-hatchet 10, bronze-pickaxe 10, bronze-helm 12, bronze-plate 30,
wooden-bow 8. Gold survives death (coin knows no master) and is not
an inventory item. What gold BUYS is reserved for a future amendment:
the till is patient.

New inert node type: `store` (with its `keeper`).

## 6q. Starmetal (v0.37): the second use of magic stone

At any anvil, magic stones smith into **starmetal**, and here the
world gains its first level requirements: some things must be earned
before they can be made. `star-sword` (3 magic-stone, 2 ore; requires
smithing 20 AND magic 10; +4 max hit). `star-helm` (2 magic-stone,
1 ore; smithing 15, magic 5). `star-plate` (4 magic-stone, 3 ore;
smithing 30, magic 15). Starmetal armor soaks 2 per piece where
bronze soaks 1. It sells dearly (sword 120, helm 60, plate 200) and
dies with you like everything else. The requirements are validity,
not ceremony: an unearned hammer strikes nothing.

## 6r. The chain (v0.37): the one fast weapon

Trolls rarely drop an **old-chain**: iron links, worn smooth; nobody
remembers what it anchored. Wielded, it grants +1 max hit: and one
property no other weapon has. Combat breathes (6m), **but the chain
does not**: its wielder swings every tick. The defender's rhythm is
unchanged; the chain simply refuses to wait. There is exactly one
fast weapon in this world, and it must be taken from a troll.

It falls at **2 in 65536**, one troll in some thirty-two thousand,
which is upward of a week of unbroken hunting. It also has no price at
any store: it is the only thing in this world a keeper will not buy and
cannot sell. A chain therefore only ever passes from the citizen who
took it to the citizen who asked, and no amount of gold can conjure one
where none has fallen. The best weapon here is the one thing wealth
cannot reach directly.

## 6p. Fletching (v0.35): the fourteenth skill

Whittling a bow never taught anyone to aim. `fletch` xp moves to its
own skill: bows grant 15 fletching xp, arrows 5. `ranged` is earned
only the honest way: by loosing arrows at something that objects.

## 6o. Farming (v0.34): the thirteenth skill

Tilled plots stand in the farm country. A citizen adjacent to one may `plant`
a seed; **1,200 ticks** later — twelve minutes — it is ripe and may be
`harvest`ed for two grain.

### A crop belongs to the citizen, not to the ground (v0.81)

What is sown is recorded on the **citizen**, as `p.crops`: a bounded map from
plot node id to the tick it was sown. The plot node itself carries nothing.

This was not so. A crop was recorded on the plot — one `plantedAt`, one `by` —
which made a plot a thing exactly one person could use at a time, and had two
consequences neither of them intended:

- with a hundred and ninety plots and any number of citizens, **farming was a
  queue**;
- and because a plot was released in exactly one place — its own planter
  harvesting it — **a citizen who planted and never returned held that ground
  forever.** One person with a hundred and ninety seeds could end farming for
  the world, permanently, and nothing in the engine would notice.

So: everyone may work the same ground at the same time, each tending their own
row, and nobody can hold a plot against anybody. Somebody else's wheat is not
your wheat; the same tilled square is bare to you and ripe to them.

```
three citizens plant the same tick of ground
  each has a row      the plot node is untouched
  all three harvest   two grain apiece
```

**Bounded at 32 rows per citizen**, in the same shape and for the same reason
`attuned` is bounded at 64.

**A crop still goes over.** `CROP_ROTS_AFTER` is 3,600 ticks — three times its
ripening, leaving twenty-four minutes to collect after it is ripe. It no
longer frees ground, since a row blocks nobody; it clears so that a citizen
who plants and forgets does not fill their own thirty-two and lose the skill.

### Determinism

The shared `findAdjacentNode` never passes a node id to its predicate, and a
per-citizen crop is keyed by id. Planting therefore uses `freePlotFor`, which
walks in **minimum node-id order** exactly as the shared finder does, so every
node chooses the same plot for the same citizen.

### What kind of resource this is

A tree or a rock depletes and recovers: two citizens working one take turns.
A plot is now closer to the ground itself — **there is enough for everybody
because using it does not use it up.** It is the first thing in this world
that is shared without being contested.

## 6n. The quiver (v0.33)

Arrows **stack without limit** in a single slot: fletching and pickup
merge into any arrows already carried. And an archer whose quiver
runs dry mid-fight does not lower the bow in confusion: if the target
stands adjacent, the fight continues bare-handed (or with whatever
the melee math says of a bow used as a club: nothing good). At range
with no arrows, the engagement ends; distance unpaid is distance
lost.

## 6m. Combat breathes (v0.32)

A citizen's arm keeps its weapon's rhythm: a swing resolves only once
`weapon.every` ticks have passed since the last one. There is no fast blade
in this world, only a patient one.

**A beast keeps its OWN clock (§6aa, v0.81).** This section used to say the
rhythm paced citizen and beast alike, on a shared `(tick - since) mod 2`.
That is no longer true and the change it describes was a fault, not a
feature: because the defender's turn hung off the ATTACKER'S action, a beast
could only act while being acted upon. Nothing could gang up, a slow weapon
made you measurably harder to hit, and an archer at four tiles was untouchable
by construction. Every one of those was a bug wearing the costume of a rule.

**Instant acts do not lower your guard, but a meal costs a swing.**
`eat` does not clear a combat action -- swallowing a fish mid-fight is
the veteran's way and nobody has to give the order again. But it spends
the ARM, exactly as a special does, so the next blow comes a cycle
later. Before this, eating cost nothing at all: full healing and a blow
in the same interval, so a fight was decided by who brought more food
and never by when they ate it.

It is a tempo cost and not a survivability one -- the gullet allows one
meal in eight intervals, so it is at most one swing in eight.

A MENDING FROM SOMEBODY ELSE COSTS THE WOUNDED NOTHING: twenty
hitpoints and they never break rhythm. Fighting in a pair should be
worth something that fighting alone is not.

**The gullet rhythm is repealed (v0.85).** A citizen may eat every
interval. The rate was written in v0.41 because nothing in this world
could kill anybody, and somebody with brews ate every tick and was
immortal; that reason has been gone for a long time.

It was defended afterwards on the grounds that food would otherwise
out-heal damage, and that does not survive arithmetic. The old chain
lands up to ELEVEN every interval, a maul's special seventeen, the
long shot thirty -- and a fish heals six. Nothing about eating has
ever made a citizen unkillable against anything that could really hurt
them. The difference the rate actually bought was between a four
minute fight and a seventy-two minute one, which is not a distinction
anybody will ever feel.

**And a mending spends it too.** A cooked fish restores six and costs
a swing; a mending restored TWENTY and cost nothing at all, so the
best heal in the world was also the only free one. One rule covers
both: whatever restores YOUR OWN hitpoints spends your arm. Being
mended by somebody else stays free to the wounded, and that asymmetry
is the whole reason to fight in a pair.

What remains is the cost that bites: **a meal spends the arm.** Eat
every interval if you like -- you will heal six and deal nothing, and
anybody serious will kill you anyway or simply walk away. The brake is
that eating is not fighting, and it needs no constant at all.

The restoratives keep their order, now per meal rather than per
interval: a deep fish ten, a cooked fish and forage six, broth five,
ale four. Forage keeps what always mattered about it -- no slot, eaten
where it lies, rotting in fifty intervals -- and loses only the
exemption from a rule that no longer exists.

**Every town flies its own arms.** A `banner` node stands where a road
crosses into a settlement, and bears a `tag`: which town it speaks
for. It bears nothing else. The arms themselves -- field, tincture,
charge -- are DERIVED from the tag by each window, not recorded here,
for the same reason a `look` is a seed and not a description: a
terminal has no tincture, and writing one window's heraldry into the
constitution would make every other window wrong. What the world
guarantees is that the tag is the same everywhere, so a citizen who
learns Anchor's colours in one window still knows them in another.

A banner is inert and impassable, like a wall. Its purpose is to be
seen from outside: a road that begins to be paved and a device on a
pole are how a place announces itself at a distance, and a world in
which towns simply BEGIN, with no approach, is a world of rooms.

**A mourner of seventy carries one thing through.** Prayer is trained
by burying the dead and, until now, changed nothing that ever happened
to a citizen. At prayer seventy the most valuable PRICED item a
citizen holds -- in the pack or in their hands -- survives their
death; everything else is lost exactly as before.

Priced is the whole of the rule. A store's list is the ordinary goods:
ore, a bronze sword, a cooked fish, a plate. The things that make this
world worth a decade are not on it -- the old chain, a dragonbow, a
sigil, a chart -- because they are traded between citizens and priced
by nobody. Those stay exactly as losable at prayer ninety-nine as at
prayer one. A mourner's working gear comes home; the Wilds keep every
tooth that matters.

**A tool is worth carrying, and a vein refuses a beginner.** The
chance of taking a yield from a tree, a rock or the water rises with
the skill and with the tool in hand, and is capped where only a master
holding the better tool will reach it. Star tools exist for the two
trades that use one all day -- a hatchet and a pickaxe -- and ask
sixty in the skill they serve rather than a sword arm. `magic-rock`
asks mining seventy: mining is the one gathering skill whose second
ore was open in its first hour, and a skill with nothing at the end of
its road has no road.

**A master gets more from the same hour, never a shorter one.** Where
a skill rewards mastery it does so by raising what an action is WORTH,
and never by raising the experience it pays. A woodcutter of ninety
takes heartwood from a tree instead of logs; a fisher of ninety takes
the deep fish instead of the shallow; a fletcher of eighty gets eight
arrows from a bone instead of five; a farmer of ninety takes three
sheaves from a row instead of two. The road to ninety-nine is the
same length for everybody.

This is the only kind of reward that does not make the grind cheaper.
Faster experience shortens the road and devalues everyone already on
it; a better yield leaves the road exactly as long and makes the
country at the end of it worth reaching.

Where it can be a REPLACEMENT it should be, as heartwood and the deep
fish are: a master can no longer take the ordinary yield at all, which
leaves the cheap end of the market to the citizens who still need it.
Where there is nothing to replace -- an arrow is an arrow -- more from
the same material is the honest form.

**A wand sends a stilling instead of striking with it.** A `wand` is
fletched from a log and held in the weapon hand, and it is a poor
weapon on purpose: magic is the anti-combat skill, so the fullest
expression of it is a thing carried INSTEAD of a weapon -- you have
given up fighting to be better at not fighting.

What it changes is `still`. Cast bare-handed a stilling takes hold at
once and holds six intervals. Cast with a wand it is SENT: it arrives
three intervals later and then holds ten. You cannot panic-still with
a wand; you have to cast before you need it, and you keep acting while
it travels.

That is what a world made of intervals is for. The interval is the
unit of skill here, so a spell that lands on a chosen future interval
is a decision no other kind of world can offer: three intervals is
three deeds -- swing, step, swing -- and the stillness arrives on top
of them. It lands whether or not the caster is still alive, still
holding the wand, or still in the world. A thing let go of is let go
of.

**A wand sends a mending too.** `mendp` spends a sigil to heal
another citizen within four tiles by twenty, and it requires a wand:
what a bare hand keeps, a wand sends. It is the same rule as the sent
stilling wearing a different coat, and it is what stops the wand being
an item nobody can use before magic 85 -- still is a late spell and
mend is not, so a wand has a job from fifty.

It also gives this world something it has never had: a citizen whose
whole part in a fight is keeping somebody else standing. Which is the
most anti-combat thing magic could be asked to do.

**A staff is the tool of the alchemist.** Woodcutting has a hatchet
and mining a pickaxe; alchemy is the working half of magic and had
nothing in the hand. A `staff` is fletched from a log, and a
`heartwood-staff` from two heartwood at fletching ninety. Bare-handed
alchemy takes four intervals, a stave three, a heartwood stave two --
so each is a real reason to take the next, and the experience per cast
never moves. A staff buys more work in an hour and never a shorter
road. The fletcher's stall sells the plain stave, so a citizen who has
not trained fletching may still buy the tool of a trade they have.

Its cost is the hand it fills. A staff is wielded, so a citizen
carrying one carries no sword -- an alchemist crossing the Wilds with
a full pack chooses between converting faster and being able to fight,
which is the same choice a pickaxe already asks of a miner. Nothing
else was needed to price it.

**Alchemy pays less than a store, and pays it anywhere.** Any citizen
may `alch` a slot: ONE of the item is destroyed -- never the stack -- and they are
paid the lesser of FOUR COINS and a coin under what a keeper would
give, and twenty-five magic
experience, once every three intervals -- the SAME twenty-five whatever was melted, which is what
a log is worth to a woodcutter and a set of bones to a priest. It requires nothing but the item.

One at a time is deliberate. A citizen holding twenty ale who cast
once and lost all twenty would have been trapped rather than served,
and trading already knows better: an offer of arrows moves one arrow.
It also makes a stack worth carrying -- twenty ale is twenty casts in
one slot, an afternoon of alchemy a brewer can walk out with.

The flat experience is deliberate. Tied to value, a star-plate would
teach seventy-five times what a log teaches, and the efficient way to
learn magic would be to acquire and destroy the most valuable gear in
the world -- a fighter's path, for the one skill in this world that is
not about fighting. Flat, the two questions come apart: what is worth
alching is about price and distance, and what is worth alching for
PRACTICE is whatever a citizen can gather most of. A woodcutter can
learn magic from logs, and nobody burns a star-plate to learn a
spell.

The pittance is the design, and it is what keeps a keeper's purse
meaning anything. It is capped at four so that unmaking a star plate
is never worth doing, and held under the keeper's price so that
unmaking a log is never worth doing either: a flat four paid twice
what a keeper paid for logs and bones and four times what it paid for
arrows, which inverted the whole rule for exactly the goods a beginner
gathers. An arrow now pays nothing at all and is unmade for the
practice, which is the honest worth of unmaking an arrow. Alchemy has no purse -- there is no keeper in the
Wilds -- so a payment that followed the item's price would be the one
uncapped mint in the world, and one that grew with what it was fed:
an alchemist unmaking star plates would coin three hundred and
thirty-eight an interval against the island's whole supply of twenty.
Four coins cannot outrun anything.

What a citizen buys with the difference is not having to walk, which
was always the rule; it is simply now true of a star plate as well as
a log. Valuable things deserve the walk, and nobody will unmake good
gear for four coins -- they will carry it home through the Wilds,
which is the risk that made the Wilds worth having.

Alchemy is ungated because magic had no beginning without it. Every
other use of the skill -- pressing a sigil, `still`, `mend`, `anchor`
-- needs magic-stone, and magic-stone lies only in the Wilds. Reaching
magic 30 by the routes open below magic 30 costs six hundred and
sixty-nine of them. That is not a gate but a wall, and it meant a
citizen could not cast their first spell until they had survived the
most dangerous country in the world several hundred times. Alchemy is
where magic begins, on the first log a citizen picks up; the sigil
spells are what it becomes.

It works IN THE WILDS, deliberately. Gold is the one thing death does
not take, so out there alchemy turns what a citizen could lose into
what they cannot -- and that would erase the Wilds if it were free.
It is not free: a citizen submits one input per interval, so a full
pack is twenty-odd intervals stood still in open country. Nothing in
the rules prices this; the tick does. Carry it out, or stand and
convert.

**There is one dragonbow, and every road out of a citizen's hands
takes it off them.** Whoever stops holding it gives it back to the
dragon: they fall to a beast, they fall to a citizen and it spills,
they drop it and it rots, they are absent six hours, they are swept,
or they are archived. In every one of those the item is removed as
well as the flag -- the archive route cleared the flag and sealed the
record UNCHANGED, so a restored citizen came back carrying a bow the
dragon had already replaced, and there were two.

**The bow lives exactly as long as the dragon is dead.** It falls when
the dragon falls and goes home when the dragon rises six hours later,
wherever it is and whoever holds it. Six hours is a possession, not a
punishment: it is yours, it is running out, use it.

An earlier rule kept it for as long as its bearer kept logging in and
took it away only after six hours ABSENT, which punished sleep -- a
citizen went to bed holding the finest thing in the world and woke
without it. It was a clock anyway; only some people were on it.

The objection that rule was written against was that a clock lets
people wait instead of hunt. It does not. Waiting gets you a
four-hundred-and-twenty hitpoint dragon that hits for twenty-eight,
standing between you and the bow exactly as it did the first time. The
clock hands the bow back to the DRAGON, never to the patient -- and
inside those six hours the only way to take it from a citizen is still
to take it from a citizen.

**The bow's special is the shot nobody should have made.** The
dragonbow reaches nine tiles, four further than anything else, and its
special blow takes the DISTANCE it crossed instead of the weapon's own
weight. At touching range it is worse than a dagger; at the end of
nine tiles it is the hardest blow in the world. The reach stops being
a number in a table and becomes the skill.

It is deliberately a fourth KIND of special and not a fourth copy of
one: this world's others are two blows (`twice`), off the rhythm
(`now`) and cannot miss (`true`).

And like all of them it is DAMAGE-NEUTRAL at its best and a loss
everywhere else. A special spends the arm for this cycle and the next,
so it costs two ordinary blows; the shot is worth exactly ONE ordinary
blow at touching range and exactly TWO at the end of nine tiles, and
the scale is taken from the ordinary blow at the same level -- so it
is neutral at ranged forty and at ranged ninety-nine alike. An earlier
draft added a flat distance bonus to a base the bow's own divisor did
not apply to, which made the special better than two shots at every
level below the cap: the answer was always "special", and a blow that
is simply better has no moment to choose.

Armour soaks it, as it soaks any other arrow. What an archer buys is
not more damage but all of it at once, from further away than anyone
can answer.

**The dragon sleeps twelve hours.** Its respawn is the bow's whole
life, so the number is the one that decides how often the finest thing
in the world changes hands: twice a day rather than four times. The
clock runs from the kill and not from a fixed hour, so tenures drift
across the day by themselves and no timezone owns the dragon.

**Every taking is announced, not only the first.** The world is told
when the dragon falls, when anyone takes the bow up off the ground or
off a body, and by which of the six roads it went home.

**A tree does not end at one log.** A node gave one thing and slept,
so two citizens at one tree was a RACE: the first took the log and the
second found it asleep. A resource nobody can share is a resource that
pushes people apart, in a world whose best moments are the ones where
they meet.

It also made gathering mostly walking. The nearest other tree is 2.8
tiles off, so at woodcutting fifty-seven with a bronze axe a log was
2.3 intervals of cutting and 2.8 of shuffling to the next trunk:
fifty-five per cent of the work was travel between things that are
identical, which is not the same as the walk being the content.

A node now yields until a roll retires it -- one success in four --
which needs no new field on the node and is decided by the same beacon
as every other chance here. A tree gives four logs on average,
sometimes one, sometimes nine, which is how a tree behaves.

**Wood only where the wood holds it together, and the hard metal
teaches.** A hatchet is a head and a haft, a spear a point and a
shaft, a maul weight on a handle, a crossbow a lock on a stock: take
the timber away and there is nothing to hold. A helm and a plate are
beaten out of sheet and a sword is a blade with a tang, so none of the
three asks for a log -- asking for one to make a breastplate was
carpentry, and it also made the metals disagree with each other for no
reason, a star sword needing no wood while a bronze one did.

And smithing experience counts magic-stone at twice an ore. It counted
ore alone, so a star helm -- smithing forty, magic twenty, two stones
carried out of the Wilds -- taught THIRTY, exactly what a bronze
dagger teaches at smithing one. A stone is the harder metal, mined at
seventy where ore is mined at one, and it comes from the only country
that kills people.

**Every forged thing asks for a smith.** Both metals have a ladder,
and both are built on the same two things: the material a piece eats
and the shaping it needs. Bronze runs dagger and tools 1, spear 5,
helm 7, sword 10, maul 14, plate 20; star runs helm 40, tools 42,
sword and dagger 45, spear 46, plate 50, maul 52, and asks magic as
well. The orders differ between the metals because the entry to each
is whatever is CHEAPEST to make, and in star that is the helm while in
bronze it is the dagger.

Bronze had no ladder at all until now -- a citizen of smithing 1 could
beat out a plate on their first afternoon -- while a window had
invented one and been refusing work the world would have done.

**Nobody is "a keeper".** A `keeper` node may carry a `kind`, and it
is what that person does: banker, merchant, sawyer, shepherd, delver,
miller, quarrier, watchman, wizard, fisher, brewer, innkeeper,
collier, drover, beekeeper, mourner, or one of the six trades a stall
keeps. Fifty-nine people stood about this island under one word, and a
window could say nothing better than "Keeper" about any of them --
which is how a world made by hand comes to read as one made by a
machine.

None of them was invented. A calling is read off what a person already
stands beside and off what their own id already called them: the bank
has bankers because there is a bank there, and `kpr-fold-shep` was
always a shepherd, in a name somebody chose years ago and then threw
away at the door.

A keeper may also carry NO calling, and fifteen do. They live in a
house, and a house is not a job.

**The monastery, and consecrated ground.** Prayer was the only skill
with nowhere to go: a woodcutter has the Greenwood, a miner the Wilds,
a fisher the water, and a mourner had a verb and buried wherever their
feet happened to be. There is an `ossuary` on the Downs, in a walled
precinct with a hearth, a well, a mourner and standing stones outside
it. Bones buried beside it pay THIRTY-ONE where a field pays
twenty-five.

The quarter is chosen so the place stays a decision. Prayer is
bone-bound, not tick-bound -- burying is one input an interval, so
what limits it is that bones exist only where beasts die, perhaps
sixteen intervals of hunting each -- and against that a walk is small.
A generous bonus would be worth making from anywhere on the island and
the monastery would stop being a choice and become a chore everybody
performs. At thirty-one the walk pays for itself out to about fifty
tiles: hunt the Downs and it is worth carrying your bones in, hunt the
Wilds and it is not.

It stands FORTY-TWO TILES FROM THE NEAREST BANK, and that is a rule
about siting rather than an accident. Bones do not stack, so a bank
beside the ossuary would make the walk a one-time cost and the bonus a
flat multiplier, and the decision would vanish.

**And at prayer ninety-nine, TWO things survive.** The same rule
deeper rather than a new power: at seventy the dearest priced thing a
citizen carries comes home, at ninety-nine the two dearest do. Still
only priced things, so the old chain, a dragonbow, a sigil and a chart
are exactly as losable at ninety-nine as at one.

**A survey's cap follows the world.** A survey is paid in distance --
forty, and ten a tile from where souls arrive -- and then capped. The
cap was eighteen hundred, which the sum reaches at a hundred and
seventy-six tiles: exactly right for a world of 320 by 200, whose far
corner sat a hundred and eighty-nine tiles out. Tallyholm is 896 by
512 and its furthest walkable tile is four hundred and forty-seven
away, so for four foundings MORE THAN HALF THE ISLAND paid what a
middling walk paid, and nothing said so.

The cap is derived from the world now -- souls arrive at the middle,
so the furthest anywhere can be is half the longer side -- and it
cannot go stale again whatever size the next world is.

**A sigil in the binding.** Fletching's endgame -- the finest bow and
the finest stave in the world -- was made from heartwood alone, by
somebody who never left the safe country. Everything else of that rank
costs the Wilds: star gear eats magic-stone and every spell eats
sigils, which ARE magic-stone. The heartwood line ate nothing, so the
peaceful trades and the dangerous ones never had to meet. Both now
take one sigil, which is three stones mined at seventy in the one
place that kills people.

**A dragon is worth something to the people who killed it.** Four
hundred and twenty hitpoints and twenty-eight a blow, and it dropped
two bones and an ore -- less than a skeleton knight. It is not a fight
one citizen wins, and everything it gave was a bow that ONE of them
could carry and which goes home in twelve hours; there was nothing for
the others to divide.

It drops six magic-stone and a set of DRAGON-BONES. The stones are the
Wilds' own currency, so a party splits something every trade in the
world wants. It drops THREE sets, so a party has something to divide: one set among
four citizens is an argument, not a reward.

**Dragon-bones teach a thousand times a goblin's, because bones do not
stack.** Prayer is 521,377 ordinary bones to ninety-nine and a pack
holds twenty-four, so buying the road is twenty-one thousand separate
trades: impossible rather than expensive. A rich citizen could not
spend their way to ninety-nine however much gold they had, which makes
gold worth less and makes the longest road in the world unbuyable
instead of dear.

Dragon-bones are the compressed form -- what noted items would have
been, without inventing notes.

The number is set from the DRAGON'S CLOCK rather than from the bones.
One dragon is worth a little under two per cent of the longest road in
the world, which puts a whole ninety-nine at fifty-eight dragons:
twenty-nine days if every one of them falls on time and every set goes
to a single buyer, and nobody's world works like that. Call it a
season of outbidding every other mourner on the island. A route that
cannot be completed is not a market, it is scenery.

A keeper pays five hundred, far under what the thing does -- three
thousand ordinary bones fetch six thousand. The keeper is the worst
buyer in the world for it and another citizen the best, which is how
every good out of the Wilds is priced here. The longest road in the world stays
long; it simply now has a reason to pass through the most dangerous
ground.

**A tool that good is worked toward, not given.** The heartwood bow is
fletched at ninety and drawn at ranged forty. The heartwood staff was
fletched at ninety and held by ANYBODY -- and it halves the cadence of
a transmuting, so one handed to a citizen of magic one halved their
whole road from the first interval, three hundred and forty-eight
hours to a hundred and seventy-four. It asks for magic seventy now.

The number is a signal rather than a pacing lever, and that is worth
saying plainly so nobody later mistakes it for balance. Experience is
exponential, so a gate low down covers almost none of the road: at
forty the staff opens after 0.29% of the way to ninety-nine and the
journey is 174 hours, which is exactly what NO gate gives. Seventy is
5.66% of the way and costs ten hours in a hundred and eighty-four.
Only eighty-five would truly pace it, and eighty-five is where the
stilling lives; a second thing there would dilute the one capstone
magic has. What keeps this staff rare is that somebody must reach
fletching ninety and spend two heartwood on it -- the level only has
to say what kind of thing it is.

The plain staff and the wand stay open to anyone: the staff is a
modest thing cut from one log, and what a wand does is gated by the
spells themselves, which want fifty and eighty-five.

**A beacon is a public work, not a ladder.** A watchfire paid two
hundred a log: EIGHT TIMES what those same logs pay in woodcutting and
five times an ordinary fire, thirty-seven hours to ninety-nine against
two hundred and ninety-five for the axe that fed it. It was not a way
of doing firemaking, it was the only way, and it broke the rule the
rest of this world keeps -- a master gets more from an hour, never a
shorter road.

Sixty a log now: half again an ordinary fire, a fair premium for
tending a thing the whole country can see and which costs ten logs to
raise. About a hundred and twenty hours to ninety-nine, in line with
everything else. The gate moves to EIGHTY: at sixty it opened after
four hours of ordinary fires, so almost the whole skill was watchfire;
at eighty it takes about twenty-eight, and the beacon is what a
practised firekeeper graduates to.

A log fed to a full fire is still fed. The stoke was refused outright
once the fire was at its cap, which spent the citizen's whole interval
on silence. The work was done and the log was cut; the fire simply
cannot hold more burn, so it takes the log and the firekeeper earns.

**A master surveyor comes home with something.** Not the lifted cap:
that was a stale constant, and a bug is fixed for everybody rather
than sold back at ninety. From ninety, ANY rumour yields a chart, where an
ordinary surveyor gets one only from the rare rumour that is about a
waystone -- and NOT merely a waystone the surveyor lacks. Reaching
ninety takes about two thousand surveys against twenty waystones, a
hundred apiece, so a master learned the last of them long ago; a
mastery that only filled gaps would have been worth nothing at all.
A chart is not for the person who drew it. It gives the one skill with no output an output, and one
that is already tradeable: a chart is worth something to somebody who
would rather not walk.

**The deep broth (v0.85).** A deep fish already brewed -- into
ordinary broth, five, the same as any fish out of the shallows, so a
master fisher's catch was worth no more in a pot than a beginner's. At
brewing NINETY it makes a deep broth instead, which heals eight and
stacks. The same shape as woodcutting ninety giving heartwood where a
lesser axe gives logs.

Eight and not ten, so the cooked deep fish stays worth cooking: ten in
one slot against eight that stacks is a real choice, and ten against
ten is not. The ladder stays evenly spaced -- four, five, six, eight,
ten -- with no gap wide enough to make the rungs beneath it pointless.

And it is NOT doubled by the ninety mastery. Two eights would be
sixteen against a cooked fish's ten, which would end cooking as a
trade. A deep fish makes one draught; there is no second in it.

**A master brewer draws two.** Brewing was the one skill whose levels
bought nothing at all -- no gate on raising a pot, none on brewing,
none on collecting -- so it rose and the world never changed. At
ninety a pot gives two draughts instead of one, which is the shape
every other mastery here takes: eight arrows from a bone instead of
five, three sheaves from a row instead of two, heartwood instead of
logs. Not a faster ferment. The world does the waiting, and a master
should get MORE from the wait rather than a shorter one.

It suits what brewing is for. A cooked fish is six healing and does
not stack; ale is four and does, so a brewer's whole advantage is what
a pack slot can carry, and doubling the pot doubles exactly that.

**A citizen's stall sells while they sleep.** Every economic rule here
ends the same way: the only sensible buyer is another citizen.
Magic-stone at twenty when a plate wants seven. Dragon-bones at five
hundred when they are worth six thousand. A keeper's purse holding
twelve hundred against a master smith's thirty-five million. The world
is built to force citizens to trade with each other, and until now
that required both of them awake at the same moment.

Sixteen logs and eight ore -- twenty-four of a pack of twenty-eight,
so it costs most of a pack and cannot be carried with much else. It is
RAISED as an action, twenty intervals of standing at the spot, so
moving or swinging cancels it: that is why nobody can raise one
mid-fight, and why raising one in the Wilds is twenty intervals
motionless with two dozen items on you. One stall to a citizen. It
never blocks a tile, so no row of stalls can wall anybody in or out.

**Stock is one-way.** You may put things in; the only ways out are a
SALE or a SPILL, never a withdrawal. That single rule is what keeps it
a shop: without it a stall in the Wilds is a BANK in the Wilds -- mine
twenty-eight stones, walk five tiles, empty the pack, mine
twenty-eight more -- and the six thousand journeys out of the Wilds
that the whole star economy rests on would evaporate.

**The order of a pile is the world's; the choice is the citizen's.**
`pickup` names a groundId, and it should -- taking the ore instead of
the plate is a decision somebody may want to make. But every window
needs a DEFAULT for a plain click on a heap, and a default is not
neutral: in a race for a spilled pack the window reaching for the
plate beats the window reaching for whatever fell first, which is the
same unfairness as two windows disagreeing about where the Fens are.

**And a window must offer what a script can reach.** `pickup` names a
groundId, so an automated citizen may lift the twenty-seventh thing in
a heap. A window that shows eight and ends with a dead label reading
"and twenty more beneath" is telling a person about an advantage it
will not give them; one that offers only the dearest is worse. Every
window must let a citizen reach anything in a pile, by paging or
otherwise. What may be done by a script may be done by hand.

So `worthRank` lives here. Unpriced does not mean worthless -- the
dragonbow, the old chain, a sigil and a chart are the four rarest
things in the world and no keeper prices any of them, so ranking by
price alone put them BELOW a handful of bones. Forage is the one
unpriced thing that really is worth nothing.

**Anything but the bow.** A stall takes any known good, including the
ones no keeper will price: the old chain, a sigil, a chart. A keeper
declining to price a thing is not the world forbidding its sale, it is
the world declining to have an opinion -- which is the whole reason a
citizen's stall exists.

The DRAGONBOW is refused, for exactly the reason a bank refuses it: a
citizen cannot opt out of being hunted without giving the bow up, and
a stall is somewhere safe. It is also somewhere the dragon cannot
reach -- the reclaim at its rising searches citizens and the ground,
not shelves -- so a stalled bow would outlive the dragon that dropped
it and clear the flag as well. There would be two.

**The price is not the world's business.** There is no cap on the ask.
What a thing is worth between two citizens is the one number here that
no rule should touch; a ceiling would be the constitution having an
opinion about a market it exists to make possible.

**An empty stall stands, unbound and unpriced.** It falls on its
OWNER'S clock -- three days from their last attention -- not on the
shelf's, so selling out does not knock it down. It is free to be
restocked with anything: a stall is not married to the good it sold
first.

But the ask does not outlive the stock. Sell two hundred logs at two,
restock with magic-stone, forget, and the stones would go for two
apiece in silence -- so emptying the shelf clears the price, and the
owner must name one for the thing actually on it. An unpriced stall
sells NOTHING, which is also what a stall raised and stocked but never
priced does: it would otherwise hand its stock out for free, which is
the opposite of what somebody who spent a pack on it intended.

Only the owner collects the takings, alive or dead -- a stall is the
one thing in this world that death does not reach. Three days
untouched and it falls, and its shelf spills where it stood on the
ordinary hundred-interval clock: two citizens standing over it for the
whole minute could save two hundred, one could save half. The state is
public, so everybody can read the clock on somebody else's stall. An
abandoned one is an appointment, and in the Wilds it is an appointment
where the other guests may kill you.

**A brewhouse is not world furniture.** `brewpot` carries `by`, the
citizen who raised it, so the generator cannot place one and does not
try: brewing is the single trade whose premises a CITIZEN builds, in a
house they have made their own. The Lantern has a hearth and an
innkeeper; whether it ever has a pot is somebody's business and not
the generator's. The world holding none is the rule working, not a
thing left undone.

**Every keeper carries a name, and every window says the same words.**
A citizen looking at somebody reads `Name, the calling` -- "Rosamund,
the banker", "Oberon, the wizard" -- and for somebody with no calling,
the name alone. The names have been on the nodes since the fourth
founding; no window looked at them, and each said "Keeper" instead.

The wording of a calling is fixed HERE, in `CALLING_NAMES`, and not in
any window's private table. It is not a rule about the world in the
way a price is, but it is a rule about the world's NAME for a thing,
and a citizen's name for their neighbour should not depend on which
door they came in by. A window that renders different words is wrong
on the same terms as one that draws the Fens in the wrong place.

**A rampart is not a house wall.** `rampart` is the node a fortified
town is built of: it blocks exactly as a `wall` does, nothing is
walkable about it, and it carries no roof. The town drawings have
always told the two apart -- `%` for a town's outer work, `#` for a
building -- and the legend flattened both, so four hundred and
seventy-eight tiles of curtain across Anchor, Norwick, Thornbury and
Cragfoot stood as domestic masonry. Nothing about movement changes.
What changes is that a citizen can tell a wall they live behind from a
wall they shelter behind.

**A harmless creature may still come at you.** Beasts only set about a
citizen in the Wilds, the Crags and the Moor -- the settled country
does not hunt anybody. That rule exists to keep people safe, so it
does not bind a creature that cannot hurt them: a `harmless` beast
follows its aggro wherever it lives. A shore-crab will bustle across
the sand at a citizen and swing at them and never once land a blow,
and teaches nothing for the trouble. It costs a citizen nothing but
company.

**Unmaking at range, which is denial and not theft.** A citizen falls
and their pack spills; the one who felled them walks over to take it.
Five tiles off, an alchemist with a heartwood stave burns a sigil and
the pile is simply GONE -- the plate, the sword, the stones. Nobody
gets them, the caster least of all: no coin comes of it, because the
thing was unmade rather than sold, and unmaking somebody else's spoil
must never be a living. What the caster gets is the practice, twenty-
five, and whatever they wanted from denying it. It is not announced:
a spell cast on every spilled pack would be a drumbeat nobody could
read past.

With ONE exception. The dragonbow cannot be unmade -- there is one and
there will only ever be one -- so it goes back to the Wilds instead,
by the sixth road home, and the island is told. Somebody spent three
magic-stone to deny a dragonbow; everyone should hear about that.

A sigil is three magic-stone out of the Wilds -- sixty gold of
materials no keeper will sell -- against the seven gold a beginner's
goblin drops. It costs nine times what it would deny them, so it
cannot be used to torment newcomers; against a star-plate lying in the
grass it is very much worth doing, which is the fight where it
belongs. The stave is the instrument because the stave is what alchemy
is done with, and because it is already the rarest thing a fletcher
makes.

**A keeper will not deal with the branded.** Strike first in the Wilds
and the mark rides on you for fifteen minutes -- and until it cools,
no keeper in any town will take your money or your goods. **And the waystones will not take them.** You may still bank, still
fight, still trade with another citizen. What you may not do is turn
what you took into anything, or leave quickly.

A keeper's refusal punishes somebody who needs a keeper, and a citizen
of any standing does not -- they sell to each other, and a purse holds
only twelve hundred anyway -- so the mark cost the people it was
written for the least. The stones cost everybody the same thing:
strike first and you WALK home, for fifteen minutes, carrying whatever
you took, through exactly the window in which the person you struck
and their friends might like a word. The Brand makes you catchable,
which is the social enforcement it always meant and never had.

**And a marked citizen is already provocation.** Striking somebody who
wears the Brand does not brand you. The rule marked you unless your
target was ALREADY swinging at you by name, so chasing a raider marked
the posse exactly as it marked the raider: the law punished justice
and crime alike, and the only safe answer to being robbed was to let
it go, which is the opposite of what the mark is for.

**And prayer does not cover the marked.** This is the one that
matters. A citizen who struck first walked away with the two dearest
things in their pack -- often the very things they had just taken off
the person they struck. The victim lost everything; the raider was
insured, by a skill about making peace with dying. For fifteen minutes
prayer holds nothing back, whatever level it has reached.

The keeper's refusal is an errand and the closed stones are a walk;
this is the danger. You carry what you took with nothing protected,
and anybody may take it from you at no cost to themselves. The Brand
does not punish. It withdraws a protection and lets the world do the
rest.

So for fifteen minutes a raider may be hunted, in the Wilds, by
anybody, at no cost. That is the danger the mark never had, and it
costs the world nothing outside the one country where blood is already
legal. Nothing follows them into a town: no guard draws on them and no
citizen may strike them on a road. The Wilds judge what happened in
the Wilds.

Trade between citizens stays open, deliberately. A keeper refusing is
the town's judgement; whether another citizen deals with you is
theirs, and taking that decision away would remove the very thing the
mark exists to provoke.

The Brand was evidence and nothing else: a mark that existed only if a
window chose to paint one, and for four foundings not one of them did.
A rule a window may quietly decline to enforce is not a rule; it is a
suggestion the engine makes about art. Now it costs exactly the thing
a raider wants, and it costs it in public. Its purpose is unchanged --
a raiding party still marks itself and cannot deny having been one --
but the marking no longer depends on anybody's goodwill to exist.

**You cannot be paid twice for one interval.** A gather is an ACTION:
it runs on by itself and costs no input once given. An instant deed
costs the input. So a citizen who set a pickaxe going and then
transmuted, fletched, smithed, cooked, buried or pressed a sigil was
earning TWO skills at full rate from one interval, for as long as the
rock lasted -- and every one of those left the action running. Only
drinking, mending and the stilling stopped it, and those three are the
ones that teach nothing.

The line is what a deed TEACHES. A deed that pays experience ends
whatever else was running; eating, drinking, picking a thing up,
banking and trading do not, because they pay nothing and a citizen
should be able to eat without losing their tree.

**The mark and the answer live in one place (v0.86).** `brandedUntil`
was assigned in exactly one line of the engine, inside `attackp`. The
`special` handler dealt damage, killed, spilled packs and ended
fights, and never branded -- and carried no copy of the retaliation
that makes a struck citizen strike back. Measured: identical kill
speed, no mark, and no damage taken, because the victim never
answered. Every §2b enforcement hung off that one line, so a band that
only ever sent `special` was invisible to the law. Both paths now call
one helper, and a third way of hurting somebody will call it too.

**A pack spills to a key nobody else can take.** Both PvP spill sites
keyed ground piles by `g{tick}-{count of the ground}` -- the only
positional key in the engine, where dropping uses
`g{tick}-{pid}-{slot}`. If the ground SHRANK between two spills in one
interval, the second reused the first's key and destroyed it: a
special kills one citizen, somebody picks up an unrelated pile, an
attackp kills a second, and the first pack is gone. Griefable, since
inputs apply in sorted playerId order and a patient griefer can grind
a key that sorts after a killer's. Content-addressed now, like
everything else on the ground.

**Accuracy is a ratio, and armour is in the roll.** The old
`clamp(128 + 4*(atk - def) + acc, 16, 240)` saturated at a
twenty-eight level gap, so against a ninety-nine attacker DEFENCE ONE
THROUGH SEVENTY-ONE WERE IDENTICAL -- seventy levels bought nothing --
and it was symmetric, attack fifty through seventy-one all sitting at
6.3% against a master. Against a weak target everything clamped to the
ceiling, so weapon accuracy stopped existing and the table collapsed
to maxHit over cadence.

Ratios asymptote instead of clamping, so every level keeps buying
something. And armour makes a citizen HARDER TO HIT rather than harder
to hurt: the flat two-a-piece soak against a maxHit that never passes
fourteen made a star-clad duel a minute of swinging for single-digit
hits. A miss is dramatic; a two is not. The same duel now lasts about
as long and reads as "miss, miss, THIRTEEN".

It repairs the maul without touching the maul, whose whole problem was
that low accuracy was punished twice -- once in the roll and again by
a soak its slow cadence could not out-pace. The beasts roll on the
same ratio, so steel does not work one way against a citizen and
another against a wolf. Fire is the exception it always was: a breath
cannot be dodged, and that is now the whole of its privilege.

**Steel is heavy.** A substantial suit -- a full bronze one, or any
single starmetal piece -- adds ONE interval to a weapon's cadence.
Armour that only helps is not a choice but a checklist; everybody
wears the best they own and going without is a handicap rather than a
build. Measured at ninety-nine with star swords: the naked citizen
deals 0.99 a tick against a full suit, the clad citizen 1.07 against
bare skin. Nine per cent, which is a real choice rather than an
obvious one.

**A special is neutral over time and a burst in the moment.** It
spends the arm for this cycle and the next, so it costs two swings and
delivers two: a star-dagger at ninety-nine lands 1.612 a tick either
way. What changes is WHEN -- twelve blows spread evenly across
twenty-four intervals, or the same twelve delivered in six pairs.

A review found specials damage-NEGATIVE at 1.47 against 1.84 and
concluded that no burst was possible in this world, recommending a
regenerating pool as the only way to create one. A pool was built on
that finding, and the finding was an artefact of defect 1.3: the arm
was spent for `every + 1` because the handler wrote `s.tick + every`
after `s.tick` had advanced. One off-by-one, and a design that worked
looked like one that could not.

The pool is repealed. It made a special damage-POSITIVE when banked --
the one property this design exists to refuse -- and once chaining was
closed it produced exactly the rhythm the arm already produced. The
lesson is worth more than the mechanic: A MEASUREMENT TAKEN OVER A
DEFECT WILL RECOMMEND A FEATURE TO FIX THE DEFECT. Repair first, then
measure, then design.

Spending the arm into the future is also what stops `now` chaining. It
may interrupt the recovery from an ordinary SWING -- that is what it
is for -- but never a second special. One interruption, then the full
price.

**And no special may follow another.** Spending only the swing it
replaces is right for the ordinary rhythm and it silently unlocked
CHAINING for `now`, whose whole nature is ignoring a recovering arm:
from a full bar that was six maul specials in six intervals, about a
hundred damage, which is not a burst window but a deletion. A special
has its own clock -- one per cadence, whatever the arm is doing. The
interruption `now` exists for still works; a second special on top of
it does not.
Two can be banked over a minute and unloaded together. The sustained
rate is unchanged, since regen allows one special per thirty-five
intervals; what it buys is a MOMENT, and a moment is what makes a
fight a story.

**Strength is its own skill.** One skill drove both how often you land
and how hard, so every fighter in this world was the same fighter
further along. Attack decides the ROLL and strength decides the BLOW,
and a landed blow teaches both, split evenly. Ranged keeps both for
itself: a bow's draw is the same muscle as its aim.

This is what makes ninety-nine strength at seventy-five attack a
different citizen from the reverse, and with the ratio and the cadence
above it is what finally makes a low-defence build expressible rather
than merely worse. There is still deliberately no combat level; what
the constitution owes a pure is not matchmaking but VIABILITY.

**A flail goes round the roll.** Its whole identity was ignoring the
soak -- "the only weapon in the world that ignores this subtraction",
paid for with the lowest base damage of any steel. Moving armour into
the roll deleted that in one line. The translation is exact: armour
used to subtract from the blow and the flail went round it; armour now
subtracts from the CHANCE, and the flail goes round that. A citizen in
full starmetal is as easy to hit with a flail as a naked one.

**A mending has a rhythm.** It healed twenty, cost a sigil and had no
rate at all: twenty-seven sigils is five hundred and forty extra
hitpoints, and survival against the best weapon in the world went from
thirty intervals to a hundred and eighty-four. A mender cannot win,
because casting spends the arm -- but two prepared citizens could not
resolve a fight at all, and that was the binding constraint on the top
of this world. Twenty-five intervals between mendings.

**A deed is done where people can see it.** An `action` is something a
citizen is in the middle of, and has always sat in the state for every
window to draw. A deed that finishes inside ONE interval left no trace
at all -- eating, drinking, burying, transmuting, pressing a sigil --
so they were invisible to everyone but the doer.

A citizen carries `deed`, one word, set on the interval an accepted
input lands and cleared at the top of the next. Fourteen bytes on the
interval they act, against a citizen record of six hundred.

It matters more than its size. Watching somebody eat mid-fight is how
you know they are in trouble; watching somebody stand at the Brandline
and unmake a haul is a thing people gather to see. A world whose deeds
are private is a world of people standing still and quietly getting
richer -- and every window reads it, so no window has to be clever
enough to infer a deed from a skill going up.

**Forage is eaten where it lies.** A goblin, a wolf or a bear may
leave `forage` when it falls -- about a third of the time. A troll, a
skeleton-knight and the dragon never do, and that is a rule and not an
oversight: those three are the Wilds, and everything about the Wilds
is that it does not help you. No recall out of it, no keeper, no well,
and nothing growing where a thing dies. The settled country feeds a
citizen at four hitpoints; the Wilds do not. It cannot be picked up, banked, sold, traded or priced: taking
it restores six hitpoints on the spot, needs no free slot and no
gullet cooldown, and it rots in fifty intervals -- half of what
anything else on the ground lasts.

It is the only thing in this world that is not inventory. Everything
else a citizen touches is a number moving between a pack, a vault, a
shelf and the ground; this exists on a tile and only for a moment. A
fight therefore has geography: the ground where a beast fell is worth
something and the ground ahead is not, and a citizen at four
hitpoints has a reason to look at where they are standing rather than
at what they are carrying. Its worth is TIMING, never throughput --
which is why it heals a fixed six and why nothing can be stockpiled.

**A keeper's purse is finite, and the world's money supply is this
sentence.** A `store` holds `coin`, at most twelve hundred, recovering
two an interval. Selling spends it; buying off the shelf returns it. A
keeper who cannot pay in full refuses the sale rather than paying
part, and the citizen still has their goods and the road to the next
town.

Before this a store conjured what it paid, so gold entered the world
at whatever rate a citizen could gather -- seventeen hundred an hour
for a beginner and twenty-eight thousand for a master -- and left it
only through a tenth on resale. That is a money supply with a source
and no ceiling, in a world that will never be amended. Now the whole
island mints at most ten towns times two coin an interval, and that
number is fixed here forever.

What it costs a citizen is a walk, and what it buys is that the ten
towns finally differ: a keeper who has been bought out is a fact about
a place, and carrying goods to a town that can still pay is the first
trade this world has had that is not simply gathering.

**The store makes nothing.** A general store's shelf holds only what
citizens have carried in and sold; nothing appears there from nowhere.
The keeper's own goods are gone -- seeds were the last of them, and
they now belong to the seedsman at Hollybarrow. A store is a MARKET,
and its keeper's cut remains what it always was: the spread between
what a seller is paid and what the next buyer pays, which is this
world's oldest gold sink.

What follows from this is the point of it. Farming now BEGINS
somewhere. A citizen who wants to grow anything walks to Hollybarrow
first, and afterwards knows for the rest of their life what
Hollybarrow is for. Nothing in the rules compels anyone to gather
there; the geography does it, which is the better way.

**A town has stalls, and they are dear.** A `stall` node bears a
`kind` -- `lumber`, `delve`, `arms`, `armour` or `bows` -- and sells
that trade's basic bronze gear from nothing, adjacent, at roughly
twice what the same thing costs elsewhere. It buys nothing: selling
remains the general store's business, and a stall is where a thing
comes FROM.

The premium is not an oversight. A stall does not compete with the
market, it competes with WALKING, and it wins by always being there
and always being the same. What it sells a citizen will stop needing
within a month; that is intended. Its purpose is to make a building
worth knowing, so that "the axe man in Greenhollow" becomes a fact
somebody carries around, and a fact you carry is worth more than the
coin it costs.

Nothing rare is sold at a stall, ever: no star gear, no bow-strings of
heartwood, and no ARROWS. Arrows are meant to be hard to come by, and
a stall selling them from nothing undoes that in an afternoon -- there
is no stock to run out. The fletcher sells the bow; a citizen makes
their own shafts, which is what fletching is for.

**The well restores.** A citizen standing adjacent to a `well` may
`drink`, and is restored to full hitpoints. There is no cooldown and
no cost. The price is already paid in geography: wells stand in
settlements, settlements are tens of tiles from anywhere worth
hunting, and a citizen moves one tile per interval. Against food that
restores three to ten while you stand where you are, walking home is
never the better trade -- so the well is not a combat tool and cannot
be made into one. What it is instead is a reason for a town to be
somewhere a citizen RETURNS to: drink, restock, go out again. Before
this, home was only where the bank was.

A note on what is NOT here. No cooldown field guards this, and that is
deliberate. A rule that guards against a behaviour geography already
prevents costs a field in every hash, in every validator and in every
window's idea of a citizen, forever, and buys nothing. If it ever
proves otherwise, a later founding may add one.

**A citizen may choose their own face.** A player carries an optional
`look`: a single integer, 0-255, set by the `set_look` input, free and
changeable at will. The engine never reads it and no rule depends on
it. It is a SEED, not a description -- deliberately not a set of named
features, because a window told "hair: brown" is being told in some
other window's vocabulary, and the windows of this world do not share
one. A terminal has a letter where a lit window has a coat. So the
world records only WHICH person this is, and every window says it in
its own language. Absent, a citizen's appearance derives from their
key, as it always has. This is 5a's own argument applied to a face:
what everyone can see about a person belongs where everyone can read
it, and not in one browser's local storage.

**A struck citizen strikes back.** In the Wilds, when a citizen with
no combat action of their own is hit by another citizen, they
automatically engage their attacker. Flight remains possible: any
move breaks the engagement, and the boundary still protects.

The same is true of beasts, anywhere. A citizen with no combat action
of their own who is struck by a beast engages that beast, and keeps
engaging it until it falls or they move. This was written of citizens
alone for four foundings and left out of the beasts for no recorded
reason, so a person fought back on reflex against a person and stood
still while a wolf ate them. It is one rule, and it belongs to
everyone: a window that supplies it for its own users is deciding a
citizen's reflexes by which window they chose, and that is not a
window's to decide.

## 2h. The real world (v0.36): the river, the sea, the mountains

The founding grows to 192 x 96, and gains geography that ROUTES:

**The river** rises in the northern mountains east of Anchor and winds
south to the great lake: a chain of water, impassable and fishable
along its whole length. Where the roads meet it, **bridges** stand:
the road wins, the water flows beneath. **The sea** bounds the east:
the last three columns are open water, and Eastmere is a coastal town.
**The mountains** span the far north on both sides of Anchor: rich in
ore, richer in magic rock. The deep forest, the highlands, the cave,
Stillwater, and Milbrook keep their places, scaled. The Wilds grow
with the world: `x in [1, 34], y in [1, 22]`.

## 2i. Norwick and the wider world (v0.40)

The founding grows again, to 288 x 144, lengthening every road the
constitution already draws. Fixed near the Wilds' southern border,
at `x in [36, 50], y in [24, 36]`, stands **Norwick**: a walled
garrison town, smaller and grimmer than Anchor, built for one reason:
holding the line against the lawless quarter at its back. Walls
trace its perimeter, broken by a gate in the south wall flanked by
guards; **no mob may enter its bounds**, the same law that protects
Anchor. Inside stand a bank, an anvil, hearths, a well, and
farming plots. Outside its walls, on the side facing away from the
Wilds, a small quarry supplies the ore a garrison spends on itself.
Norwick is reached by leaving the king's road on foot; no path is
drawn in state, as ever, only the town itself is law.

New inert node type: none (Norwick reuses `wall`, `guard`, `bank`,
`anvil`, `well`, `hearth`, `signpost`, `rock`, `plot`). New founding
constant: a second mob-forbidden rectangle, checked alongside
Anchor's wherever the wander rule applies.

## 2j. The road learns to bend, and the world to feel walked (v0.41)

The founding grows once more, to 320 x 200, calibrated rather than
guessed: at one tile per interval, Westhearth to Eastmere along the
full breadth of the road is a three-minute walk, Anchor to Stillwater
under two, the shortest hop under a minute. Distance in tiles **is**
distance in seconds; a founding's dimensions are now chosen against
that arithmetic, not eyeballed.

**The road bends.** `trailYAt(genesis, x)` replaces the flat trail
row: true and level through every settlement and the river crossing,
it winds through open country between them on a seeded curve, same
treatment the river has always had. Nothing paints the road as state;
windows compute the curve themselves, as they already do for the
river.

**The hamlets stop mirroring each other.** Westhearth keeps its
modest bank-and-anvil founding. Eastmere trades its anvil for a
store and two dockside fishing spots: a port, not a second
Westhearth. Anchor gains a second forge and its own store: the
capital both smiths and trades. Milbrook keeps no forge at all: bank,
well, hearths, plots, nothing else: a farming town and only that.

**Danger now shows before it bites.** Approaching the mountains, the
Wilds, or the cave, trees thin probabilistically the closer a tile
sits to the boundary, and bare rock backfills the gaps: the ground
tells a citizen they are leaving the safe country before any wolf
does. This is a founding-time density gradient, not a client tint:
the thinned tiles are genuinely treeless in every node's state.

**Growth clusters.** Trees, open-field rock, and goblins no longer
seed independently across their whole range; each kind rolls a
handful of cluster centers first, then place mostly near one of them.
Woods read as woods, and goblins keep camps, not a uniform sprinkle.

**Landmarks (§3, node field `text`).** `addNode` now accepts an
optional extra-fields object, merged onto the node. Signposts carry
a `text` field: unique flavor per post, shown on interaction, in
place of one generic message repeated at every post. Eight stand
along the founding's roads, plus two solitary `wall` nodes standing
alone in open country as ruins: nothing built beside them, on
purpose.

New founding constant: none. New node field: `text` (optional,
currently used by `signpost`).

## 2k. Waystones (v0.42): the road remembers who walked it

Each settlement holds a **waystone** node. Stand orthogonally beside one
and you **attune** to it: its id is appended to your `attuned` list, and
the world remembers it forever. Thereafter `recall {to}` steps you out of
the world beside one waystone and back in beside another you have walked
to: instant, free, no material spent. Convenience, not power.

Two rules keep it honest. You may only recall to a stone you have
**attuned**, so the first journey to any place is always made on foot and
the world still feels walked. And you may **never** recall while inside
the Wilds: magic will not carry you out of danger you chose to enter. The
slow road stays open to everyone; the waystone only spares you the
re-walking of ground you have already earned.

New node type: `waystone`. New player field: `attuned` (array of waystone
ids, defaults empty). New action: `recall`.

**Amended (v6): the sixth expanse has no waystones.** Tallyholm removes the
travel network entirely — no `waystone` nodes, no `recall`, no attunement.
The reasoning is the whole thesis of §2o: this world is built on the walk —
the ore hauled to the anvil, the market walked to, the seam reached — and
hauling (§11) is an entire trade built on the length of the road. A network
that let a citizen skip the road would dissolve the gathering it exists to
create, and would pay a hauler for a journey nobody took. The road IS the
content. Earlier worlds (v0.42–v5) keep their waystones forever, because the
genesis is the world; v6 simply seats none, and any stray `waystone` a frozen
town-drawing would place is converted to a standing-stone landmark before the
world is sealed.

## 2l. The Expanse (v0.76): every direction means something

The classic world says "a safe town, then danger", a radial gradient,
the same whichever way you walk, which is why it can be large without
ever becoming a place you *know*. The second generator,
**`interval-expanse-v1`**, says something else: **every direction means
something.** North is wood, east is stone, south is water, west is
danger, and the middle is home. A citizen holds that in their head
after one walk and still has it years later, which is the point of a
world you return to rather than a level you finish.

**Determinism is stricter here than anywhere.** Expanse terrain uses
only operations IEEE-754 requires to be exactly rounded (`+ - * /`,
`Math.sqrt`) over an integer avalanche hash, never `Math.sin`, whose
last bit ECMA-262 leaves implementation-defined, and never SHA-256 in
the hot path, so a window can paint the country tile-for-tile without a
crypto library and without going async mid-frame. The classic world's
windows could only *approximate* their river; here the map a window
draws is the map the engine placed nodes on, to the tile. Bends are
built from hashed control points joined by smoothstep
(`meander(g, tag, u, seg, amp)`), which is also closer to how water and
footpaths behave than a sine wave is.

**The five countries.** With `W x H` the founding dimensions and
`cx = floor(W/2), cy = floor(H/2)`:

- **the Wilds**, `x <= round(W * 0.19)`, the whole western march
  (sealed into `genesis.geo.wilds`, because recall and the Brand read
  it as law);
- **the Greenwood**, `y <= H * 0.32`, the north wood;
- **the Crags**, `x >= W * 0.70`, the eastern stone;
- **the Fens**, `y >= H * 0.70`, the southern water;
- **the Heartlands**, everything between, plus the settled disc
  around Anchor where `((x-cx)/W)^2 + ((y-cy)/H)^2 < 0.019`.

**The water.** The great river falls out of the Greenwood, past
Anchor, into the fens:
`riverX(y) = cx + meander(21, y, 46, 26) + meander(22, y, 14, 5)`,
water where `|x - riverX(y)| <= 1`. The southeast is open sea, the
bay, where `x > W*0.80` and `y > H*0.74` and the normalized reach
`dx + dy > 0.55`. Fen pools scatter by hash through the wetland south
of `y = H * 0.66`. `isWater` is the union of the three.

**The seven settlements**, at the compass points a citizen learns
first (position by founding dimensions, `w x h` the walled extent):

| name | kind | at | size |
|---|---|---|---|
| Anchor | capital | `(cx, cy)` | 24 x 14 |
| Greenhollow | timber | `(0.46W, 0.14H)` | 14 x 10 |
| Millbrook | mill | `(0.72W, 0.24H)` | 14 x 10 |
| Cragfoot | forge | `(0.86W, 0.50H)` | 14 x 10 |
| Eastmere | port | `(0.74W, 0.70H)` | 14 x 10 |
| Fenmarch | port | `(0.44W, 0.84H)` | 14 x 10 |
| Norwick | garrison | `(0.26W, 0.46H)` | 16 x 12 |

Every town is walled with a gate at the middle of each face, so no
town is sealed; a wall stops at the water's edge, and where the river
enters a town there is a **watergate** rather than masonry. Every town
keeps a bank, a well, a hearth, and a signpost bearing its name; the
capital adds smiths, anvils, two stores, six hearths, and a guard line;
forges, garrisons, and mills keep an anvil and a smith; ports, timber
towns, and mills keep a store; garrisons muster guards. The settled
country farms: four plots stand outside every wall.

**The roads.** Every road leads to Anchor, spokes, not a maze, but a
world you can navigate by memory. Each spoke is two tiles wide,
carries no nodes (it costs the tick nothing), and wanders by
`meander(g, 90 + i, u, 26, 9)` scaled by the taper
`min(1, min(t, 1-t) * 6)`, so a trail meanders where the country is
open and straightens as it comes in to a gate, meeting its town square
on.

**A bend is a landmark.** A path that wanders for no reason is noise;
a path that wanders around a boulder is a place, and "left at the
split rock" is how people actually navigate. So the bends are computed
first (`roadBendsOf`: every offset of at least 4 tiles, away from the
gates), and the thing being avoided, an old boulder in stone country,
an old tree in green, is placed **on the straight line the trail
declined to take**, which is the physically true position for it.

**Node law.** Ground a node may occupy: in bounds, dry, unclaimed, off
the road, out of every town's walled extent plus one tile. Fishing
waters are *sampled* along the true shore, never paved onto it.

**The beasts, each where it belongs.** Goblins (118) hold the fens and
the south-and-west heartlands; wolves (68) the Greenwood and the fens;
bears (44) the deep Greenwood north of `H * 0.22`; trolls (50) the
Crags and the far Wilds west of `W * 0.09`. Skeleton-knight warbands
muster on the frontier **in companies, never alone**.

**Waystones.** One stands outside every town gate, and frontier
anchors hold the far country: `greendeep (0.60W, 0.08H)`,
`greenwest (0.30W, 0.10H)`, `fensdeep (0.60W, 0.92H)`,
`fenswest (0.28W, 0.88H)`, `baywatch (0.70W, 0.90H)`, and
`crossroads (0.50W, 0.66H)`. Attunement law is unchanged (§2k): the
first journey to any place is always made on foot.

**Founding.** The generator floor is 256 x 160; the calibrated
founding is 640 x 400 via `makeExpanseGenesis`, which also seals the
geography rectangles into `genesis.geo` and retunes watchfires and
survey for a wider, darker country. `interval-classic-v1` remains
lawful: a world keeps the generator named in its genesis forever,
because the genesis is the world. **New foundings use the third
expanse (§9d).**

## 2o. The gathering world (v6): scarce, clustered, and thrice-deep

The sixth expanse (`interval-expanse-v6`, world **Tallyholm**, 896 x 512, ten
towns, seven countries) keeps v5's terrain but rebuilds what grows on it. The
governing idea is **manufactured congregation**: a citizen cannot be counted,
and the tuning cannot be redone after founding, so the world must gather people
by its shape, at every scale, without knowing how many there are.

**Commit to scarce.** RuneScape held four thousand trees and congregation still
happened — at its few scarce willows, while the abundance did nothing. It
stumbled into the pattern without seeing it; v6 does it deliberately. There are
about **fifty gatherable nodes in the whole world**. Every tree in a town
garden, every rock in a copse, every decorative shoal — the thousands that once
scattered the population across the map — is now a **landmark**: it stands where
it stood, as texture, but it grows nothing and cannot be worked. The only places
to gather are the seams the founding placed. A newcomer walks to the grove to
chop, the way they walk to the mine to mine.

**Nine places: three skills, three rungs each, each a real destination.** Every
gathering skill is a journey across the map, not a number that climbs in one
spot. The mid and master rungs are their OWN nodes in their OWN places — the old
trick of upgrading the baseline node's yield at the mastery level is gone,
because a tier with no place of its own is not a destination.

```
woodcutting:  logs (Greenhollow grove) → oak-logs (the oak grove) → heartwood (the deep eastern Greenwood)
mining:        iron (Cragfoot) → coal (the deep Crags) → magic-stone (the Wilds)
fishing:       raw-fish (the ports) → eel (the eel shoals) → deep-fish (the Wilds water at the gibbet)
```

The baseline is a **nursery**: a citizen reaches the mid gate in roughly eighty
minutes, so the crowd at the first grove is always turning over — a shared
starting place everyone passes through, not a cattle-car. The master rung's
placement follows its economic weight: **heartwood** (few need it — a bow, a
staff) sits remote but SAFE in the deep wood, drawn by the length of the walk;
**deep-fish** (food, which everyone in a fight needs) sits IN the Wilds, drawn
by the crowd that dangerous food pulls; **magic-stone** (the late economy's
whole spine) sits deepest of all, the serious expedition.

**The doubled seams: the same good, twice, in the Wilds, priced in blood.** Each
gathering skill also has a Wilds rung that yields the master good **doubled** —
`gallows-oak` (two heartwood), `mother-lode` (two magic-stone), `gibbet-shoal`
(two deep-fish) — for the same experience and the same action. Yield-per-action
is uncapped and costs the experience curve nothing; the only price is that
**anybody may kill you while you work there**. This is the one lever that ties
the peaceful half of a trade to the dangerous half: the gatherer who wants twice
the good and the raider who wants the gatherer are forced into the same water.

**Gold: the patient wealth.** Magic-stone is dangerous wealth; the world needed
a slow kind too, or it has only one sort of rich citizen. Far south in the Crags,
a long walk from anywhere, the `gold-rock` seam is a **lottery inside mining** —
capped at level eighty-five, not ninety-nine — and the only thing it costs is the
mastery you are not earning while you wait on it.

**Tools that make two countries meet.** The gathering tool now carries the RATE
and the level buys ACCESS. Above the steel tools sit the great tools:
`great-hatchet` and `great-pickaxe`, forged from a **starmetal head** (the Wilds)
and an **ironbark haft** (the deep Greenwood) — so the fastest tools cannot be
made by a citizen who keeps to one half of the world. The same rule that gives
the heartwood bow its two ingredients gives the great tools theirs: the peaceful
and dangerous halves of the world are made to need each other.

## 2g. The Wilds (where the law thins)

The northwest quarter's far corner is the **Wilds**: the rectangle
`x in [1, 34], y in [1, 22]` (as amended in 2h). Inside it, and only inside it,
`attackp {targetId}` is valid: citizen against citizen, melee adjacent
or bow within 4, resolved by the same combat law as any beast. Both
attacker AND target must stand inside the Wilds: the boundary protects
whoever keeps a foot in the lawful world. A citizen slain in the Wilds
drops every carried item where they fall, for anyone to take: the only
place in the world where loot comes from people. Equipment is
destroyed as ever. Enter armed, or enter fast.

### 2b-iii. One arm, one speed (v0.68)

§2b-ii tied the swing clock to the order rather than to the citizen, which
closed one door and left another open beside it. Turning from one foe to
the next makes every interval's order a *new* order, and a new order came
with a new clock: a citizen standing between two others could strike one,
turn, strike the other, turn back, and swing every single interval. It was
worth two thirds again as much harm as an honest fight, and like massing it
is a thing a script performs perfectly and a person does not.

The mistake was locating the rhythm in the wrong place. A fight does not
have a tempo; **an arm** does. A citizen has one pair of hands, and they
recover at the speed their weapon allows no matter who the last blow
landed on.

The cadence is therefore kept on the citizen, as the interval of their
last swing. A blow may be struck only when the weapon's full recovery has
passed since that swing, counted across all foes together. Changing
target, repeating an order, being interrupted and beginning again: none of
them return an arm that has already been spent. A maul is slow at
everything, and a chain rests at nothing.

### 2b-ii. Repeating an order does not restart it (v0.67)

Combat breathes: a swing lands every second interval (§6m), counted from
the interval the order was given. Re-sending the same order used to
overwrite that mark with the present interval, so a citizen who re-sent
`attack` or `attackp` every interval swung every interval, while one who
gave the order once and let it stand swung every second one. Measured at
mastery: ninety-six points of harm against forty-six, for nothing but
extra keypresses.

That is precisely the shape of advantage this world refuses. A script
can re-send an order sixty times a minute and a person cannot, so the
rhythm of a fight would have belonged to whoever was automating it.

Therefore an order that is already being carried out is **left
untouched**: repeating `attack` on the beast you are already fighting, or
`attackp` on the citizen you are already fighting, changes nothing at
all. The clock belongs to the fight, not to how often it is asked for.
Changing target starts a new fight and a new clock, as it always did.

### 2b-i. The Flight Rule: no one can be run down (v0.67)

This was not designed. It falls out of §1's oldest rule, that a citizen
commits **one deed per interval**, and it was found by simulation rather
than by intent. It is written down here because a world's promises must
be readable in its constitution, not discovered by the disappointed.

Fleeing costs an action. So does striking. A pursuer who moves cannot
swing that interval, and a pursuer who swings does not move, so the
runner gains a tile. Both walk at one tile per interval and neither can
walk faster, so the distance between a hunter and a willing runner never
closes. Measured over sixty intervals of unbroken pursuit at mastery, a
fleeing citizen takes **nothing** from a sword, a spear or a bow, and
ends the chase further away than it began. Reach buys an oscillation in
and out of range and almost no blows. Because §2b requires attacker and
target to stand inside the Wilds, running for the border ends any
pursuit absolutely.

Therefore: **no citizen may be robbed by one other citizen.** Not the
strongest, not the best equipped, not the most patient. In the open, on
foot, violence in this world requires the consent of the person
receiving it.

Three things take that consent away, and only three.

**One: standing still.** Every deed costs a tick. Mining, woodcutting,
fishing, smithing, cooking, lighting a fire, and above all **fighting**
are ticks in which you are not running. All forty-six skeleton-knights
stand inside the Wilds, which means the very reason to go there is the
thing that pins you to the ground: a citizen locked in a fight with a
knight is already wounded, already committed, and must choose between
finishing what they came for and keeping what they carry. The Wilds does
not endanger travellers. It endangers **workers**, and it always will.

**Two: the root.** The star-dagger's freeze (§6q) is the single
instrument in the world that removes a citizen's choice to leave. It is
three ticks on a hundred-and-twenty-tick leash with ten ticks of
immunity after, and it cannot kill on its own. It is rare and expensive
by design because it is the only key to this lock.

**Three: numbers.** One hunter cannot corner anyone. A band can: one
roots, the others fall on what is held. Killing an unwilling citizen is
therefore a **social act** requiring several people to agree on a victim
and act together within three ticks. It cannot be performed by one
script, and every striker wears the Brand (§2b) for fifteen minutes
afterward, so a raiding party marks itself in public and cannot deny
having been one.

None of this is enforcement, and none of it can be tuned. It is the
arithmetic of one deed per interval, and it holds for bots and citizens
identically because the interval does not care who is spending it.

## 2c. The hedge is law

The outermost ring of tiles is impassable to players and mobs alike:
the world ends one tile before its arithmetic does. Windows may paint
the boundary as hedgerow, fence, cliff, or sea; what they may not do
is let anyone stand in it.

## 3. World state

The world state is a canonical JSON object (sorted keys, no whitespace)
containing:

- `tick`: current tick number
- `players`: map of playerId → Player
- `nodes`: map of nodeId → ResourceNode
- `names`: map of name → playerId (see §5a)
- `mobs`: map of mobId → Mob (see §3.3)

`playerId` is the hex-encoded public key of the player's keypair.
The **state hash** is SHA-256 of the canonical JSON encoding.

The genesis object is
`{specVersion, rulesHash, genesisSeed, anchorMs, worldW, worldH,
worldGenerator}`. `worldGenerator` names the deterministic generator
that founds this world, `"interval-classic-v1"` or
`"interval-expanse-v1"` (§2l), `"interval-expanse-v2"` (§9b), or
`"interval-expanse-v3"` (§9d), (§9d), or `"interval-expanse-v6"` (§2o), the sixth expanse being the canonical
choice for new foundings, so a founding record can never be ambiguous about
which world it founds; a node that does not implement the named
generator refuses to build the world rather than guessing. The genesis schema is EXACT: the seven
fields above plus the optional fields `witnesses`/`quorum`/`imported`/
`importedFrom`, `importedFrom = {worldId, stateHash, tick}` names the
attested state the import list was carried from; the worldId commits
to it, so a founder cannot later claim a different source, and anyone
holding that world's certified state can recompute the lived-citizen
list and check it. An import WITHOUT provenance is the founder's bare
word, and wears that openly: whether such a founding is "the" world is
a question for its witnesses and its citizens, never for the protocol ,
a genesis is sovereign, and canonicity is earned, not encoded  
any other key is refused (a key execution ignores still changes the
worldId, minting a distinct founding identity with identical behavior),
and `witnesses` and `quorum` are supplied together or not at all.
Signed inputs are equally exact: one canonical serialized form per
action (per-type field schemas with explicit types; trade offers carry
BOTH demand fields, `wantItem: null` or `wantGold: 0` written out  
omission is not a representation).

### 3.1 Player

| Field       | Type            | Rules                                  |
|-------------|-----------------|----------------------------------------|
| `x`, `y`    | int             | Tile coordinates                       |
| `skills`    | map skill→xp    | XP is a non-negative integer           |
| `inventory` | array, max 28   | Slots hold `{item, qty}` or null       |
| `action`    | Action or null  | Current ongoing action                 |
| `name`      | string or null  | Claimed display name (see §5a)         |
| `trade`     | Offer or null   | Open trade offer (see §5c)             |
| `equipment` | {weapon}        | Wielded item or null (see §5d)         |
| `bank`      | map item→qty    | Vaulted goods (see §6g)                |
| `consignment` | Consignment or null | Goods committed to the road (§11) |

A **Consignment** is `{from, route, leg, items}`: the town it was sealed
in, the drawn list of one to three towns it must reach, how many have
been reached, and a container of exactly `INV_SLOTS` slots holding
`{item, qty}` or null. It is a SECOND container and not more pockets:
the pack is still twenty-eight and is untouched by any of it. A citizen
carrying one carries two sets of goods under two different laws, and the
whole of §11 is the difference between them. An empty one cannot stand:
persisted state holding a consignment with nothing in it is refused.

### 3.2 Resource nodes

A node is `{type, x, y, depletedUntil}`. Types: `tree`, `rock`,
`fishing-spot` (gatherable); `campfire` (permanent; enables cooking,
§6a); `fire` (player-made via firemaking §6f, carries `expiresAt` and
vanishes at the start of that tick; enables cooking like a campfire);
`anvil` (enables smithing, §6d); `bank` (enables banking, §6g); and
`hearth` (inert and impassable: the fire a dwelling is built around, §2b).
Renamed from `house` at the fourth founding: the building is the ROOM you walk
into, made of `wall` nodes on floor terrain, and what stands inside it is its
fire. A node called `house` that draws as a fireplace taught every window the
wrong thing, and two of them drew a cottage inside a hall before anyone caught
it. A node with `depletedUntil > tick` yields nothing and
cannot be targeted.

Gather yield table: `tree` → `logs` (woodcutting, 25 XP), `rock` →
`ore` (mining, 35 XP), `fishing-spot` → `raw-fish` (fishing, 30 XP).

### 3.3 Mobs

**Keepers, fences, hedges (v0.79).** A `keeper` is a person-shaped
fixture: the named face of a town's trade, standing at their counter
from the founding on. Their NAME is not stored, it is a pure function
of the town and the role, computed identically by every window, so
Maud is Maud in every mirror without a byte of state. Keepers hold
their tile and answer to no verb (yet). `fence` and `hedge` are field
boundaries: they block like walls and yield nothing, the land bearing
the marks of being TENDED. All three exist so home looks kept, not
merely generated.

**Landmarks (v0.79).** A node of type `landmark` is a PLACE, not a
resource: no verb in this constitution reaches it, it cannot be
gathered, fought, lit, planted, read, or consumed, and it blocks its
tile like any node. A landmark bears exactly one extra field, `kind`,
drawn from a closed set (`elder-tree`, `old-oak`, `standing-stone`,
`broken-tower`, `sentinel`, `drowned-bell`, `shipwreck`, `tally-half`),
and only landmarks bear it. Landmarks exist so the
map tells the truth: a named place that cannot be founded would be a
lie on every chart.

A mob is `{type, x, y, hp, respawnAt}`. Mobs are placed in genesis, do
not move, and act only when attacked (fully deterministic). A mob with
`hp <= 0` is dead until `respawnAt`, when its hp resets to max at the
start of the tick.

Mob stats table (v0.9): `goblin`: 5 max HP, attack 1, defence 1,
max hit 1, respawns 16 ticks after death. Drops on death, rolled on the
beacon: `bones` (always) and `ore` (chance 64/256).

### 3.4 Ground items

World state includes `ground`: a map of groundId →
`{item, x, y, expiresAt}`. Dropped items lie where they fell, visible
to all and takeable by anyone; at the start of each tick, items with
`expiresAt <= tick` vanish. The ground forgets in about a minute.

**Wandering (v0.20).** At the start of each tick, after respawn
processing, every living mob that no living player's action targets
takes a wander roll in lexicographic mobId order:
`roll(beacon, mobId, "wander") < 48` (about one step every five
ticks). On success, `roll(beacon, mobId, "dir") % 4` picks north,
east, south, or west. The step is taken only if the destination is in
bounds, free of nodes, and within Chebyshev distance 2 of the mob's
**home** (its genesis position, stored as `hx, hy`). A mob under
attack stands and fights. Mobs respawn at home. The goblins pace
because the beacon says so; every node watches them pace identically.
**Beasts and water (v0.78).** A wander step onto blocked terrain is
skipped like any other refused step: the leash, the walls, and the
water bind a beast equally. (Mobs placed in genesis are already placed
on free ground; this closes the last door, the stroll.)

**Mob kinds.** `goblin` (5 hp, meadow-dweller) and, from v0.25,
`wolf` (8 hp, hits up to 2, drops bones and sometimes more bones); and, from
v0.29, `troll` (20 hp, hits up to 3, dwells in the cave, drops bones,
ore, and rarely a bronze-plate it has no use for); and, from v0.30,
`bear` (14 hp, hits up to 2, keeps the deep forest, drops bones and
rarely the hatchet of the last woodcutter who argued); and, from v0.42,
the **`skeleton-knight`** (18 hp, defence 6, hits up to 4, respawns 120
ticks), a horned, shield-bearing warrior that musters in **warbands** in
and around the Wilds, seldom alone. Its round shield makes it hard to
strike; its longsword bites back. A fallen knight gives up **double
bones** (the frontier's best prayer), sometimes scavenged ore, and rarely
the horned helm itself.
Wolves keep to the fringes of the world; the hedgerows are theirs.
Every mob kind inherits wandering, pinning, home respawn, and
drops-to-ground from the universal mechanisms; a new creature costs
one stats row and one sprite.

## 4. Skills and XP

v0.25 skills: `woodcutting`, `mining`, `fishing` (gathering);
`cooking`, `smithing`, `firemaking` (processing); `prayer` (rite);
`attack`, `defence`, `hitpoints` (combat). Gathering
creates items, processing consumes them, combat consumes everything.
Players start with `hitpoints` at 1,154 XP (level 10); all other skills
at 0. Max HP equals the hitpoints level.

Level from XP uses a classic exponential curve: level L requires total XP

```
xp(L) = floor( (1/4) * sum_{n=1}^{L-1} floor(n + 300 * 2^(n/7)) )
```

The table is **hardcoded as spec constants** (see the reference
implementation's `XP_TABLE`); implementations MUST use the constants,
not recompute them. Anchor values: level 2 = 83 XP, level 50 = 101,333,
level 99 = 13,034,431. Levels range 1-99.

## 4b. Beyond mastery

The level function does not stop at 99: it continues by the same
recurrence. Every mechanic that reads a level reads `min(level, 99)`:
mastery is the ceiling of power, and nothing past it buys a stronger
swing or a faster axe. Levels past 99 are honor, proof of intervals
spent. A bot can reach them; so can you. The ledger does not care, and
that is the point.

The recurrence is not literally infinite, and the constitution should
not pretend otherwise. Experience is a state field, and every state
field is bounded so that a hostile checkpoint cannot carry an absurd
number and so that all arithmetic stays exactly representable: the bound
is `MAX_XP`, 10^12, which is **level 212**, one hundred and thirteen
levels above mastery. This is a bound on what a number can *be*, not a
wall the design puts in anyone's way. Mastery costs 13,034,431
experience; the ceiling is 76,720 times that, some four centuries of
unbroken play in a single skill at a rate nobody sustains. It is written
down here because a constitution that claims "without bound" and means
"bounded at 212" is lying in a way that would eventually have to be
corrected, and corrections cost forks.

## 4c. Mastery and the cape

**Mastery** is level 99 in a skill: the ceiling of power (4b). The
recurrence runs far past it, to the representational bound of §4b, which
no amount of play reaches.

The mastery cape is not an item. It cannot be bought, traded, dropped,
or lost to death, because it is not a thing: it is a fact about a
citizen's XP, and windows are invited to paint that fact as cloth. The
reference window renders one cape in the color of the mastered skill,
gold trim for a second mastery, and a radiant cape for all seventeen.
Mastery is proved by the state and verified by every node; the cape is
simply what proof looks like from a distance.

**Trade pays one unit (v0.80).** A trade offer names a wanted item, never
a quantity, so its price is exactly one unit of that item. Accepting a
trade surrenders one unit of the wanted good, not the acceptor's whole
stack: a citizen who accepts a trade wanting arrows pays one arrow and
keeps the rest. The offered goods and the single payment move together or
not at all.

**Durable identifiers are whole (v0.80).** A node or ground record a
citizen creates (a fire, a watchfire, a brewpot, a dropped stack) is
identified by the tick, the creator's FULL public key, and where needed
the slot. A prefix is never enough: two citizens who shared a short prefix
and acted on the same tick would once have collided, the later destroying
the earlier's node and its sunk resources. Identifiers admit up to 96
characters to carry the whole key.

**Canonical iteration (v0.80).** Any per-tick loop that writes canonical
state iterates in a canonical order, never in map-insertion order.
Mastery and first-deed announcements walk citizens in playerId order, and
when several adjacent nodes match a query the one with the least nodeId is
chosen. Insertion order can differ between a node replaying from genesis
and one restored from a checkpoint, so an insertion-ordered write would let
two honest nodes record a different history for the same tick: a fork, or a
permanently mis-attributed first. Canonical order removes the divergence.

**Constitutional geography (v0.80).** A world's identity is its land, not
merely the name of the code that draws it. A generator may declare a
`geographyHash`: the SHA-256 of the island it produces for THIS founding's
own seed, over every settled node and a terrain raster. It commits to the
island the world is actually founded on, not a fixed probe, so the played
geography can never drift from the committed one. That hash is folded into
the founding record, and `worldId` already commits to the whole record, so
from here a world's identity commits to its geography itself.
A node that implements the named generator MUST draw the same island the
founding committed, or the genesis is refused at validation, at the door,
not discovered at tick 1. Two implementations therefore either compute the
same island or compute different `worldId`s and know they are different
worlds. Any change to what a generator draws changes its hash and founds a
different world: geography is frozen at founding exactly as the rules are.
Generators that declare no hash (the classic family, and any legacy world)
remain committed by name, unaffected. This is the seam that makes an
implementation in another language checkable: conform to the SPEC and draw
the committed island, or you are elsewhere.

**The founder's mark (v0.80).** A founding may commit a `founderKey`: the
founder's full public key, the signature of the world's origin. It is the
whole key, not a prefix, because a prefix could be ground out (a forger
brute-forcing a keypair whose public half begins the same way), while a
whole public key cannot be collided, so the mark on the tally cannot be
forged. It rides in the genesis, so `worldId` commits to it and every
client shows the same mark; it cannot drift into a caption a renderer could
rewrite. The
generator cuts it into the far half of the First Tally, the half that
stands across the water on Shrine Isle, so the founder's signature is a
thing found, not advertised, at the end of the pilgrimage rather than at
the door. The node that bears the mark MUST carry exactly the key the
genesis committed, or the state is invalid: the split stick's two halves
prove each other, and the monument cannot say a different thing than the
world was founded with. A founding that commits no `founderKey` bears no
mark, and every prior world (which never had the field) is unaffected.

**Fires are walkable (v0.80).** A fire a citizen lights does not block
its tile. Nodes are impassable as a rule, but everything a citizen
MAKES is exempt (brewpot, watchfire, and now fire), because a blocking
node any stranger can create is a weapon: movement is cardinal, so four
logs fence a citizen in place and one log closes a ford. The hearths
placed at the founding (`campfire`) still block, being furniture rather
than weather. A fire underfoot counts as a fire at hand: `cook` accepts
a fire on the cook's own tile as well as an adjacent one.

**Stepping aside (v0.80).** A lit fire appears on the lighter's own
tile, and nodes are impassable, so the lighter steps aside: west, east,
south, north, the first tile that a `move` would have allowed. That
step obeys every rule a step obeys, the walls, the water, and the beast
that holds its tile. If no neighbour is lawful, the lighter keeps their
tile and the fire burns where they stand.

**The stilling (v0.80).** Magic completes its identity: the skill of
refusing combat. `anchor` flees, `mend` endures, and `still` denies.
The stilling is its own input (`still`, one field: `target`, a mob or
citizen id). It demands magic 85, consumes THREE sigils, reaches 6
tiles (a spell of sight, not touch), and grants 150 magic experience.
Its whole law is one sentence: **the stilled cannot act, and cannot be
struck.** For 6 intervals the target neither moves, works, fights, nor
suffers any blow, a truce, enforced, binding its speaker first (the
caster's own action clears on cast). Fights touching the stilled END
rather than pause. When it lifts, 15 intervals of immunity follow, and
the caster's word sleeps 150 intervals. Citizens may be stilled but
never held: there is no still-then-kill, only still-then-leave.

**Magic pays its way (v0.80).** The rates are retuned to parity with
the gathering trades, simulated against the constitutional curve:
pressing a sigil grants 60, `mend` 55, `anchor` 35. And `anchor`
comes home: its fixed point is the REGISTERED spawn of the world's
own generator, the old constant aimed at the classic plaza, which on
this island is open sea. Three skills remain pure races by design ,
prayer, exploration, brewing, their levels being the achievement
itself. Magic now belongs to the trades that do things.

**Melee geometry and occupancy (v0.79).** Movement is cardinal, and a
reach-1 weapon strikes only along lines the wielder could step: the
four faced tiles, the same orthogonality §5 gives the axe and the
pick. A long haft (reach 2 or more) may thrust past a corner. Nothing
strikes the tile it stands on. And a living beast holds its tile: a
`move` onto a tile occupied by a mob with `hp > 0` is invalid, the
troll bars the way.

## 5. Actions

Players submit **inputs**, each signed by their key:

```
{ tick, playerId, type, ...params, sig }
```

v0.1 input types:

- `move` → `{dx, dy}` where dx,dy ∈ {-1,0,1}; moves 1 tile per tick.
  The world is a bounded grid of **genesis-defined size**: the genesis
  object carries `worldW` and `worldH` (defaults 320 × 200, the canonical classic-generator size), and a move
  whose destination lies outside is invalid. The world has edges
  because its founding says so: and how much world there is, is a
  founding decision like everything else. Resource nodes (all types,
  including campfires) are **impassable**: a move onto a tile occupied
  by a node is invalid. You fish beside the water, not in it.
- `gather` → `{nodeId}`; must be adjacent. Throughout this spec,
  **adjacent means orthogonally adjacent** (Manhattan distance exactly
  1): you stand before what you work, facing it. Diagonal interaction
  is invalid; diagonal *movement* remains legal.
- `stop` → cancels current action.
- `recall` → `{to}` (v0.42); teleport beside waystone `to`. Valid only if
  you have **attuned** to that waystone (stood beside it) and you are
  **not** in the Wilds. Instant, free. The slow road remains for those who
  would walk it.
- `claim_name` → `{name}`; see §5a.
- `spawn` → no params; see §5b.
- `offer_trade` → `{to, giveSlot, wantItem}`; see §5c.
- `accept_trade` → `{from}`; see §5c.
- `cancel_trade` → no params; see §5c.
- `cook` → `{slot}`; see §6a.
- `attack` → `{mobId}`; mob must exist, be alive, and be adjacent.
  Sets an ongoing attack action (§6b).
- `smith` → `{recipe}`; see §6d.
- `wield` → `{slot}`; slot must hold an equippable item. Swaps it with
  the current weapon (which returns to that slot).
- `unwield` → no params; weapon returns to the first free slot.
- `light` → `{slot}`; slot must hold `logs`; see §6f.
- `deposit` → `{slot}` and `withdraw` → `{item}`; see §6g.
- `drop` → `{slot}`; slot must hold an item. The item leaves the
  inventory and becomes a **ground item** on the player's tile,
  expiring 100 ticks later (§3.4).
- `pickup` → `{groundId}`; valid iff the item exists, the player stands
  on its tile, and a free inventory slot exists.
- `consign` → `{slots}` (v0.87); an array of one to twenty-eight distinct
  slot indices. Valid beside a `store` when the citizen bears no
  consignment. The named slots leave the pack, enter the container, and
  the route is drawn. See §11b.
- `release` → no params (v0.87); valid beside a `store` while bearing one.
  Returns as many slots as will fit; what does not fit stays, and the
  consignment stands. A citizen is never made to destroy their own cargo.
- `deliver` → `{slot}` (v0.87); sells one slot of the container at the
  route's LAST town, and pays Hauling XP. See §11e.
- `eat` → `{slot}`; slot must hold `cooked-fish`, `ale` or `broth`.
  Consumes one, heals 3, 4 or 5 HP respectively (capped at max HP).
  It does **not** clear the player's current action: swallowing a fish
  mid-fight is the veteran's way (§6m). It may be done at most once
  every **8 ticks**; an `eat` inside that span is invalid, exactly as a
  swing before the arm recovers is invalid. Resolves in the same tick.

Rules:

- Inputs are signed with the player's ed25519 key over the canonical
  encoding of the input without its `sig` field. The state machine
  itself verifies signatures: an input with a missing, forged, or
  stale-tick signature is invalid. `playerId` is the hex-encoded raw
  32-byte public key.
- One input per player per tick. Extra inputs for the same tick are
  invalid; the entire tick bundle from that player is discarded.
- Inputs for tick N must arrive before the network finalizes tick N
  (transport concern, out of scope for the state machine).
- Invalid inputs (out of range, bad node, full inventory) are **ignored**,
  never partially applied.

## 5a. Names

Names are in-world objects governed by the constitution, not an
external service.

- A name matches `^[a-z0-9-]{1,12}$` and may not start or end with `-`.
- `claim_name` is valid iff the name is unclaimed, the claiming player
  has no name, AND the claiming player's standing is at least 50.
  First valid claim wins, forever (there is no release and no transfer;
  a future constitution may add them: that is a fork, as always).

  The standing requirement exists because a name is permanent and the
  supply of good ones is small. Identities are free, so without a toll
  one machine could mint keys and take every short word in the language
  before anyone arrived, and no rule in this constitution could give
  them back. Standing cannot be minted: it is time spent acting in the
  world at one deed per interval, which is the only cost here that an
  attacker cannot parallelize away. A citizen reaches 50 in an
  afternoon; a squatter pays that afternoon again for every name.
- On success: `names[name] = playerId` and `player.name = name`.
- Clients SHOULD render names where known and MUST fall back to the
  playerId prefix otherwise.

## 5b. Spawning

A player need not exist in genesis to join a world.

- `spawn` is valid iff `playerId` is not already in `players`. It is the
  ONLY input type valid for an unknown playerId.
- On success the player is created at the **spawn point**: the center
  tile `(floor(worldW/2), floor(worldH/2))`: with
  a pack empty but for the newcomer's quiver (below), no name, no
  action, level-1 skills.
- Spawning is permanent: there is no despawn. Identities are
  free, but each playerId spawns at most once, ever.
- **At most `MAX_SPAWNS_PER_TICK` (1) souls are born in any one tick**,
  taken in canonical `playerId` order (§5h). A spawn that does not fit
  is not applied and may be sent again.

**The newcomer's quiver (v0.78).** Every soul wakes with twenty-five
arrows in the first slot of their pack. The number is arithmetic, not
generosity: at ranged 1 with a wooden bow, an arrow lands half the time
for 1 damage, so a goblin costs about ten expected arrows, the quiver
is two goblins with slack. The archer need not first be a brawler,
which is §7f's own principle brought home to combat's house. Spawning
is creation-only, so death never refills the quiver; imported citizens
arrive with their own packs and receive nothing; and at one gold an
arrow, the kit is worth less than the walk it saves.

## 5h. Spawning is not an action

Spawning competes for its own budget, not for the tick's input cap.

- **At most one soul is born per tick.** The rest of the tick's capacity
  belongs to citizens who already exist.
- Spawns are admitted in canonical `playerId` order, so every node admits
  the same soul. The others are not queued and not remembered: they may
  simply be sent again.

**Why.** A spawn used to compete for the same 4,096 slots as a footstep,
which meant four thousand souls could be born in six hundred milliseconds.
No real world has that rate; even a launch day is a handful a second, and a
crowd arriving together can wait a tick.

It is also what made the world killable. A permanent citizen costs one
spawn, ten steps and one gather, so at four thousand spawns a tick an
attacker could fill the archive in nine minutes. At one a tick the world
still admits a hundred and forty-four thousand new citizens a day, which no
world needs, and the same flood must be sustained for two days instead.

The cost to an honest newcomer is a tick or two of waiting on the busiest
day this world will ever have.

## 5.4. How many inputs a tick applies

A tick applies at most **4096** inputs. When more than that many distinct
players submit a valid input for the same tick, WHICH ones apply is
decided by this rule and not by which arrived first:

1. Players that already exist in `state.players` are taken before
   players that do not.
2. Within each group, canonical ascending `playerId` order.
3. At most **256** of the 4096 are given to players the world does not
   yet know. If fewer than 256 strangers are present the remainder goes
   to existing citizens, and if fewer than 3840 citizens are present the
   remainder goes to strangers: no seat is left empty.
4. The first 4096 of that ordering apply. The rest are discarded as
   though they had never been sent, and their senders may retry on a
   later tick.

The reserved share exists because serving citizens first, on its own,
hands the world to whoever arrives earliest. Spawning costs nothing, so
a single machine present on the first day can mint citizens by the
thousand and thereafter fill the whole tick as KNOWN, with every honest
arrival behind them for as long as the world lasts. A world that cannot
be entered is a world that ends with the people already in it, and it
would end quietly, with every rule obeyed.

Arrival order differs between nodes and always will. A cap applied at
the door therefore let two correct nodes hold different inputs for the
same tick, compute different states, and reach no quorum: a flood of
worthless keys could stop the world without breaking a single rule.
This ordering is computable from the state and the inputs alone, so
every node discards exactly the same ones.

Placing existing citizens first is deliberate. Identities are free, so
an attacker can always fill the field with keys that have never done
anything. Under such a flood the world becomes hard to ENTER, which is
recoverable, rather than impossible to PLAY, which is not.

Nodes SHOULD buffer more than 4096 inputs per tick so that this
selection is made over the whole field rather than over an arbitrary
subset of it.

## 5b-ii. The keeper's shelf

A `store` node may hold a **shelf**: a map of item name to count, at most
**1000** of any one item. It is the only node that may hold one.

- `sell` pays the seller `PRICES[item]` per unit, as before, and places
  the goods on the shelf of the store they are standing beside. Above
  the cap the keeper still pays and the goods are lost.
- `buy` may take either the keeper's own goods (`STORE_SELLS`, made from
  nothing and priced by this document) or anything on that store's
  shelf. Shelf goods cost `PRICES[item] + max(1, PRICES[item] / 10)`,
  integer division: what the seller was paid, plus the keeper's cut.
  Bought shelf goods leave the shelf.
- Every **1500 ticks**, each store loses a sixteenth of every stock it
  holds, rounded up, and a stock that reaches nought is forgotten.

Three things follow from this, and all three are the point.

**Trade no longer needs both citizens awake.** `offer_trade` requires
two people in the same interval, which in a world of a few dozen souls
across many hours means most exchanges never happen. A shelf holds what
somebody sold six hours ago.

**Each store is its own market.** The shelves are not shared, so the
settlements develop separate strengths, and carrying goods from a town
that has them to a town that wants them is a trade in itself. Nothing
enforces this: it is what happens when stock has a location.

**Selling stops minting coin from nothing.** Before this, `sell` was the
world's only source of gold and it was unbounded, while the only sinks
were the keeper's seeds and death. Now every purchase from a shelf
destroys the spread. A flat tenth would round to zero on the nine
cheapest goods, which are the ones that actually move, so the cut is
never less than a single coin.

Decay is the item sink that selling used to be. Goods still on a shelf
are goods nobody wanted at that price, and a world where every log ever
cut waits in a shop is a world whose economy only grows.

## 5c. Trade

Trade is a two-phase atomic swap between adjacent players. Adjacency is
deliberate: trade requires *being there*.

- `offer_trade {to, giveSlots, wantItem}`: valid iff `to` is another
  existing player, every slot in `giveSlots` holds an item, and
  `wantItem` is an item string. `giveSlots` is a non-empty list of
  distinct slot indexes in ascending order, at most `INV_SLOTS` long:
  one offer has exactly one serialized form, so two nodes always read
  the same offer from the same bytes. Sets
  `player.trade = {to, giveSlots, wantItem}`. A new offer replaces any
  previous one.
- `accept_trade {from}`: valid iff `from` has an open offer targeting
  the acceptor, the two players are adjacent (orthogonally), the
  acceptor holds at least one `wantItem`, and the acceptor has room for
  every offered item at the moment of the swap. On success, executed
  atomically in the same tick: all of the offerer's `giveSlots` items
  pass to the acceptor, the acceptor's first `wantItem` slot passes to
  the offerer (landing in the first slot the goods vacated), and the
  offer clears. If any condition no longer holds at application time
  (an item gone, the players moved apart, no room for the whole
  parcel), the accept is ignored: never partially applied.

  A trade carries as many slots as the offerer names because hauling is
  the cost this world charges for moving goods, and pressing accept is
  not. Twenty logs is twenty slots carried to the meeting either way;
  it should not also be twenty exchanges.
- `cancel_trade`: clears the caller's open offer.

There is no partial trade, no negotiation protocol, and no escrow: the
swap either happens whole in one tick or not at all.

## 5e. Presence: awake and asleep

Each player carries `lastInput`: the tick of their most recent applied
input, set at spawn and updated whenever any input of theirs applies.
A citizen is **awake** iff `tick - lastInput <= 500` or their `action`
is non-null; otherwise they are **asleep**. Sleep is never stored: it
is derived, like the time of day. A sleeping citizen stands where they
stopped, blocks nothing, and can complete no trade (accepting requires
an input, which would wake them). Any input wakes the sleeper. The
world never forgets a citizen; it lets them rest.

## 5f. The world forgets what nobody ever was

At the end of every tick, in canonical `playerId` order, a player is removed
if **both** hold:

1. **absent** — `FORGET_AFTER` (36,000 ticks, six hours) with no input;
2. **empty-handed** — no name, no gold, nothing banked, nothing equipped, no
   action, no trade, every skill still at its floor, and nothing in the pack
   but the twenty-five arrows every soul wakes with.

Both. One level, one coin, one name, one item beyond the quiver, and the
world keeps that citizen for good.

**Why both.** Time alone would forget the founder after a long absence.
Emptiness alone would forget a newcomer who has not started. Together they
describe exactly one thing: a key that was created and never used — which is
the only thing an attacker mints in bulk, because giving each bot something
to hold costs what giving a real citizen something costs.

Forgetting an empty key costs its owner nothing. They had nothing. They may
spawn again and are exactly where they were.

## 5g. The archive: the absent leave the tick without leaving the world

Every citizen who ever earned a single xp would otherwise stay in `players`
forever, and the tick clones that map a hundred times a minute. The world
would stop, not because anyone was playing but because everyone once did.

The state therefore carries **one hash**, `archiveRoot`: the root of a sparse
merkle tree of depth 64 over `playerId`, whose leaves are
`sha256(canonical(record))` and whose empty subtrees are the constants
`_EMPTY[d]`. Almost every leaf is empty. **Ten million archived souls cost
the tick exactly what none do.**

The engine never holds the tree. It cannot: it is a pure function of a state
that contains only the root. Whoever wants a citizen archived or restored
brings the **path**, and the root judges it.

**`archive`** — valid when the subject is present, absent longer than
`ARCHIVE_AFTER` (1,008,000 ticks, seven days), and would not simply be
forgotten under §5f. Anyone may submit it: it is a deed nobody owns, like
closing a gate behind someone. The path must prove the subject's slot is
**empty** under the root as it stands at application.

**`restore`** — carries the record the world put away and the path that
proves the root holds it. The record is rehashed and compared; one altered
field hashes differently and proves nothing. On success the slot is
**vacated**, which is what prevents the same record being restored twice.

**Paths are judged against the root AS IT IS**, at the moment the input is
applied — not as it stood when the tick opened. Two archives in one tick
each move the root, and the second must answer to what the first left
behind. This is the property that makes batching safe, and its absence is
not loud: an earlier draft archived three citizens into a root that could
prove none of them, and nothing looked wrong.

**A standing stone bears words.** `text` (up to 256 characters) is valid on a
`signpost` and on a `landmark` whose kind is `standing-stone` — nothing else.
The Ring's teaching is CARVED into the stones rather than propped beside them
on boards: the stones were there first, and a wooden sign is not how that
gets said. A cut-face or a spoil-heap bearing prose would be somebody's
graffiti, not the world's own voice.

**An archived citizen keeps their name.** They are absent, not gone, and a
name paid for with the toll in §5a does not fall vacant because somebody
took a fortnight off. The registry holds it for whoever proves they own it
when they return.

The records themselves are kept by every node on disk. They all archived the
same citizen on the same tick from the same state, so they all have it, and
none of them has to be trusted for it: the root decides.

## 5f-ii. World announcements: milestones every citizen sees (v0.48)

The world keeps a short herald's log, `state.announce`: an ordered list
of at most 24 recent `{tick, text}` entries, and a permanent honors
roll, `state.firsts`, mapping a milestone key to the id of the citizen
who reached it first. Both are written only by the deterministic rules
below, so every node computes byte-identical announcements and one
agreed record of who was first: "first ever" is a fact of the state,
not a claim any window can invent.

**Mastery.** When a citizen's XP in a skill first crosses the mastery
threshold (`XP_TABLE[99]`) on a tick, the world announces it. The very
first citizen ever to master a given skill is named as such (and
recorded in `firsts` under `master:<skill>`); everyone after is
announced plainly. When the crossing that a tick produces leaves a
citizen at mastery in **all** skills for the first time, the world
announces a **Master of Interval**: and the first ever to achieve it is
recorded under `firsts.totalmaster`. This is expected to be
vanishingly rare; the honor is permanent.

**Anniversaries.** On every tick that is an exact multiple of
`TICKS_PER_YEAR` (`round(365.25 · 24 · 3600 · 1000 / TICK_MS)`), the
world marks its own age. Because it is a pure function of the tick, the
year turns identically for everyone.

The log is bounded and the honors roll is finite (one entry per skill
plus totals and any named firsts), so neither grows without limit. The
herald changes no other state: a windows renders these cries how it
likes, or ignores them; the record is the same regardless.

## 6. Gathering resolution

While a player's `action` is `gather(nodeId)`, on each tick:

1. If node is depleted or player is no longer adjacent → action ends.
2. Compute success roll `r = roll(beacon, tick, playerId, "gather")`,
   a uniform integer in [0, 255].
3. Success threshold: `T = 64 + 2 * level(skill)` capped at 240.
   Success iff `r < T`.
4. On success: add 1 resource item (`logs` for tree, `ore` for rock) to
   the first free inventory slot; award XP (`tree`: 25, `rock`: 35);
   node becomes depleted for 8 ticks (`depletedUntil = tick + 8`).
5. If inventory is full, the action ends with no roll.

## 6a. Cooking (the first sink)

`cook {slot}` is valid iff the slot holds `raw-fish` and the player is
orthogonally adjacent to a `campfire` node. It resolves in the same
tick:

1. `r = roll(beacon, playerId, "cook")`, uniform in [0, 255].
2. `T = 64 + 2 * level(cooking)`, capped at 240. Success iff `r < T`.
3. Success: the slot becomes `cooked-fish`; award 30 cooking XP.
4. Failure: the slot becomes `burnt-fish`; no XP.

Either way the raw fish is consumed: cooking destroys supply. Burn
rate falls as the skill grows, exactly like the classic curve.

## 6b. Combat resolution

While a player's `action` is `attack(mobId)`, on each tick, after mob
respawns are processed:

1. If the mob is dead or no longer adjacent → action ends.
2. Player swing: `r = roll(beacon, playerId, "atk")`;
   hit threshold `T = clamp(128 + 4*(attackLvl − mobDef), 16, 240)`.
   On hit: `dmg = 1 + (roll(beacon, playerId, "dmg") mod maxHit)` where
   `maxHit = 1 + floor(attackLvl / 10)`. Subtract from mob HP; award
   `4×dmg` attack XP and `dmg` hitpoints XP.
3. If the mob dies: drops roll on the beacon and go to the killer's
   free inventory slots (full inventory forfeits that drop);
   `respawnAt = tick + respawn`; action ends.
4. **The mob does not answer here.** As of §6aa it acts in its own phase,
   on its own clock, whether or not anybody is acting on it — see that
   section for what a beast does and when. Striking one does make it
   ANGRY (`mob.mad`), which is how a creature that hunts nobody still
   fights back.

   A blow that lands always costs at least one hit point. Armour makes
   a citizen harder to hurt, never impossible to hurt: a full suit of
   starmetal turns aside four, which is the hardest blow any beast in
   this world can throw, and without that floor the best-equipped
   citizen alive would walk the Wilds in no danger at all.

   Defence is the only skill paid for in danger rather than in time, so
   the danger has to be real. A citizen shooting from beyond a beast's
   reach is never swung at, and therefore never defends: they train
   ranged and hitpoints, and nothing else. This costs an archer nothing
   they earned, and it stops the safest way to fight from also being a
   way to train the skill for surviving being fought.

## 6c. Death (provisional: the most fork-worthy rule in this document)

If a player's HP reaches 0, the body lies where it fell for **5 ticks**
(v0.41): during them the dead act on nothing and cannot be acted upon.
The world holds its breath; windows may grieve. At the fifth tick the
citizen returns to the spawn point at full HP with their action cleared
and their **entire inventory and equipment destroyed** (in the Wilds,
spilled where they fell: spec 2g). Skills, XP, name, and **bank**
survive. Destroyed items leave the world: death is the deepest sink.

This severity is explicitly provisional. No sentence in this document
can declare a fork legitimate or illegitimate: legitimacy is adoption,
and adoption belongs to whoever shows up. Softer death rules are simply
expected.

## 6d. Smithing (the ore sink)

`smith {recipe}` is valid iff the player is orthogonally adjacent to an
`anvil` and holds the materials. It resolves in the same tick, always
succeeds, consumes the materials, places the product in a free slot,
and awards 30 smithing XP per ore consumed.

| Recipe           | Materials       | Effect when wielded            |
|------------------|-----------------|--------------------------------|
| `bronze-sword`   | 2 ore + 1 logs  | +2 max hit in combat           |
| `bronze-hatchet` | 1 ore + 1 logs  | +24 gather threshold on trees  |
| `bronze-pickaxe` | 1 ore + 1 logs  | +24 gather threshold on rocks  |

## 5d. Equipment

`equipment.weapon` holds at most one wielded item. Wielded gear is
destroyed on death along with the inventory (§6c): the sink spares
nothing. Tool bonuses apply only when the wielded tool matches the node
type; the sword bonus applies only in combat.

## 6f. Firemaking (the logs sink)

`light {slot}` is valid iff the slot holds `logs` and the player's own
tile carries no node. It resolves in the same tick on the beacon:
`T = 64 + 2*level(firemaking)`, capped at 240. On success the logs are
consumed, 40 firemaking XP is awarded, and a `fire` node appears on the
player's tile with `expiresAt = tick + 100`: light that cooks, made by
hand, gone in a minute. On failure the logs survive for another try.
On success the maker **steps aside** to the first free orthogonal tile
(west, east, south, north, in that order); only if all four are blocked
do they remain standing amid their own flames. Nobody builds a fire to
stand in it.

## 6g. The bank

`player.bank` is a map of item → quantity: goods vaulted outside the
world's dangers. `deposit {slot}` and `withdraw {item}` are valid only
orthogonally adjacent to a `bank` node (withdraw also needs a free
inventory slot). One item per interval: patience is the fee.
**The bank survives death** (§6c): what you carry can burn; what you
vault endures. This is the world's memory, and the foundation of wealth.

## 6k. Magic (the dark half of the interval)

Mining a `magic-rock` yields a `magic-stone` (30 mining xp; the rock
rests long after). **The night gate is repealed (v0.40).** Invoking a
sigil requires three magic-stones and nothing else: any tick, any sky.
The old rule (`invoke` valid only while the shared day-cycle read
night) was deterministic arithmetic, not wall-clock authority: but its
only effect was mandatory waiting, and waiting is the one cost this
constitution rejects. The stones price the sigil. The day cycle
remains in the spec as shared cosmology for the windows to paint:
it decides nothing.

`cast {spell}` spends sigils. The first spell is `anchor` (1 sigil,
30 magic xp): the caster is returned instantly to the plaza beside the
well of Anchor, the fixed point every genesis carries. Further spells
are reserved for future amendments; the dark is patient too.

`magic` joins the skills: the twelfth.

## 6i. Armor (the deeper ore sink)

Two new anvil recipes: `bronze-helm` (1 ore, 1 logs, 30 xp) and
`bronze-plate` (3 ore, 1 logs, 90 xp). Equipment gains `head` and
`body` slots beside `weapon`; `wield` routes each item to its slot.
Worn armor soaks incoming damage: each piece reduces every hit taken
by 1, to a minimum of 0. Death destroys all of it. The sink spares
nothing, and now it eats plate.

## 6v. The star-dagger and the root (v0.49)

A fourth star recipe: `star-dagger` (2 magic-stone, 1 ore; smithing 20,
magic 15; wield attack 20). It strikes for less than the star-sword (a
+2 hit, not +4): its worth is not the edge but the **root**.

When a successful star-dagger blow lands on a living target: mob or
citizen: and the wielder's root is ready and the target is neither
already rooted nor within its post-root immunity, three things happen
together: the target is **rooted** for `ROOT_TICKS` (3) ticks and cannot
move for their duration; the target gains **immunity** for a further
`ROOT_IMMUNE` (10) ticks, during which no dagger may root it again; and
the wielder's dagger goes on **cooldown** for `ROOT_CD` (120) ticks. A
rooted entity's move inputs resolve to no motion; a rooted mob does not
wander or pursue. Damage is unaffected by any of this: only the root
is gated. Roots never stack and never chain: at most one target is held
by one dagger at a time, and the immunity window forbids a second
dagger from seizing a body the instant the first releases it. The long
cooldown makes landing a root a decision, not a rhythm: a rare, earned,
expensive thing, as a frontier weapon forged from compressed night
should be.

## 7. Exploration: the world as profession (v0.50)

The fifteenth skill. Its verb is `survey`; its XP is paid in distance;
its goods are **charts**. Every value below is deterministic: markers,
rewards, and charts are pure functions of the beacon and the state, so
every node agrees without a word passing between them.

### 7a. Survey markers

`state.markers` holds `genesis.survey.k` points of interest, each a
`{ x, y, kind, bornAt }` (and a `ws` id when it is a rumor). Whenever
the world holds fewer than `k`, the top-up mints replacements. Marker
position and kind are drawn from `H(beacon || tick || index || salt)`,
rejected until the tile is in-bounds, outside every city, off every
node, and (v0.79) **off any ground the world's terrain bars** (the
sea, the ridge, the river away from its fords): a marker is a place a
citizen can stand, because `survey` is standing there. A world whose
generator registers no terrain replays bit-identically under this rule,
since nothing is barred. Placement is also **distance-weighted**, so
most markers land in the near and middle country and the deep-Wilds
ones are genuinely rare. A marker unclaimed after `MARKER_LIFE` (3000)
ticks relocates: the frontier never goes stale.

*Why v0.79 exists:* the rejection list above predates terrain-bearing
generators (v0.50 shipped when nothing but nodes barred the way). On
the third expanse's geometry, roughly half of all candidate tiles are
sea or stone; without this rule half the frontier minted unclaimable
and sat dead until staleness relocated it, silently halving the
effective `k`. The survey-simulation that founds a world's constants
(7c) must be run against this rule, not the old one.

Most markers are `ord` (ordinary). A minority are `ws` **rumors**,
minted beside a waystone; surveying one yields that waystone's chart.
And a minority are **findings** (7f): the traces of those who came
before, classed at birth and never after.

### 7b. `survey`

`survey` is valid when a living citizen stands on a marker's tile. It is
**instant**: the cost was the walk, not a channel. On resolution it
pays Exploration XP by distance (7c), yields a chart if the marker was a
rumor and the pack has room, records the first-ever surveyor in the
honors roll, and **relocates the marker**. First-come and single-claim:
reaching the deep one first is the race.

### 7c. XP paid in distance

```
xp = min( survey.max, survey.base + survey.perTile * chebyshev(marker, anchor) )
```

**These constants live in the genesis, not the protocol.** The classic
world founds itself with `{ k: 8, base: 40, perTile: 10, max: 1800 }`  
values *derived from a survey-simulation of its own geometry*. They
are not a universal curve. A larger world is free: indeed expected: to
found itself with a different `k`, `base`, `perTile`, and `max`, derived
from *its* geometry by *its* own simulation. One numerical curve does
not fit every world scale, and the constitution does not pretend it
does. What is constitutional is the *form* of the reward; the *numbers*
are a property of the founded world.

Why this reaches mastery on a finite map: it is not coverage that is the
grind but *journeys*. Markers relocate forever, so the XP is bounded
only by traversal time: exactly as a finite set of respawning rocks
supports mining to 99. A bot cartographer pays for it in the same walked
ticks a human does.


### 7f. Survey findings (v0.77): the traces of those who came before

The world does not need an excavation profession; it needs a past. So a
minority of survey markers are classed as what earlier hands left
behind, a **burial**, an **old working**, a cold **camp**, a forgotten
**cache**, and surveying one yields the single item its class names:
bones, ore, logs, or seeds. One item, always one, and never
magic-stone: the one scarcity that is constitutional stays
constitutional.

The class is drawn at the marker's birth, from the same digest that
placed it, and never changes; no randomness survives to the claim. The
weighting is the country's: the generator that registered its terrain
(§2l) also names its countries, and the classer listens, the dead
outnumber the living out west in the Wilds, the Crags keep old
workings, the Greenwood cold camps, the fens keep what they take, and
the settled Heartlands are mostly just ground. A world whose generator
registered no countries keeps flat, modest odds; cities mint no
findings because cities mint no markers.

A full pack forfeits the finding and the claim stands, exactly as
charts have always behaved. Exploration XP is unchanged. Mining's
primacy over ore is protected structurally, not by tuning: `k` markers,
their lifetimes, relocation on claim, and the walk itself are the rate
limit, and Prayer gains what it always lacked, a peaceful source of
bones: the mourner need not first be a killer.
### 7d. Charts: knowledge as a portable capability

A chart is `chart:<waystoneId>`: an ordinary, stackable, **tradeable**
inventory item. Because canonical state is public, a chart is not secret
information: the waystone's location was always derivable. A chart is a
transferable **capability**: `read_chart` spends it to add that waystone
to the bearer's `attuned` set, granting recall access *without ever
walking there*. The explorer converts distance walked into charts and
sells recall access to citizens who would rather pay than walk. The
waystone set is fixed at founding, so charts are a small set of fixed
variants: no per-item payload, no change to the slot schema.

### 7e. Constitutional consequences

`SKILLS` gains `exploration`; **Master of Interval is now mastery in all
fifteen**, and the honors roll gains `master:exploration` and a first
`surveyor`. `genesis.survey` joins the founding record (and the worldId
it hashes to). `state.markers` is bounded to `k`. Two items
(`chart:*`) and two actions (`survey`, `read_chart`) join the
vocabulary. Bot indifference holds: a bot that walks the frontier and
sells charts is a load-bearing citizen, not an exploit.

## 8. Brewing: the profession the world waits for (v0.51)

The sixteenth skill, and the first whose passive part is genuine: the
*world* does the waiting. A brewer starts a batch, lives the rest of
their day, and returns to a finished, tradeable draught. It stays honest
the way every passive thing must: **the gain consumes a good that took
active effort to make** (grain, fish, and the logs and ore of the pot
itself), so a bot earns nothing it did not first gather.

### 8a. Brewpots

A brewpot is an owned, placed node (`type: 'brewpot'`, fields `by`, and
while fermenting `readyAt` + `brewKind`). `build_brewpot` raises one on a
free tile beside the founder, consuming `brew.buildLogs` logs and
`brew.buildOre` ore: **but only adjacent to a `hearth`.** The protocol
knows nothing of taverns; it knows only "a brewpot must stand by a
roof." A brewhouse: a hearth ringed with brewpots and the people who
gather there: is a meaning *players* assign, the way they made trade
routes of waystones. A citizen may own at most `brew.potCap` brewpots.
The cap is flat: capacity is bought, not leveled: running four pots is
an act of supply and organization, not a reward the protocol hands out
for grinding.

A brewpot is **walkable**: a citizen may stand on or step through its
tile: so no arrangement of pots can ever wall a doorway or fence a
citizen in or out; the commons stays passable. A pot **abandoned** (not
built, brewed, or collected at) for longer than `brew.decayTicks`
crumbles and returns its tile to the world, so brewpots can never
permanently enclose the buildable space against newcomers: active pots
reset the clock, only neglect reclaims. And a founder may `dismantle`
their own pot, recovering half its makings and freeing the ground, so a
brewhouse can be moved rather than merely abandoned. Owned, yes: but
never a permanent private claim on the common ground.

### 8b. Brew, wait, collect

At an idle brewpot they own, a founder `brew`s, consuming one input  
`grain → ale`, `raw-fish → broth`: and setting `readyAt = tick +
brew.ferment`. Nothing more happens until the world reaches that tick;
fermentation is **deterministic**, so a brewer knows exactly when a
batch lands (Interval treats time constitutionally; a brewer should not
be made to guess). Pots ferment on world-ticks whether their founder is
present or not. When `tick >= readyAt`, the founder `collect`s: the
draught enters the pack, Brewing XP is paid **on the completed batch**,
and the pot returns to idle. Active at both ends, patient in the middle.

### 8c. The goods

`ale` and `broth` are ordinary, stackable, tradeable items that
**restore** on `eat` (broth a little more than a cooked fish, ale a
little less): restoration, not buffs, so Brewing stays inside the food
system without a layer of buff-management. Their point is the market:
farmer → grain → brewer → ale → everyone; fisher → fish → brewer →
broth. Brewing couples the professions that already exist.

### 8d. The constants are the world's

`brew: { ferment, potCap, buildLogs, buildOre, xpPerBatch }` lives in the
**genesis**, part of the founding record. The classic world founds
itself with values derived from a brew-simulation of a brewer tending a
rotation of pots: sized so mastery is a matter of *regular brewing over
time*, not a number of hours anyone announces. A larger or busier world
tunes its own. What is constitutional is the *shape*: start, wait,
collect, at a flat-capped rotation: not the numbers.

### 8e. Watchfires: Firemaking as public infrastructure (v0.53)

The public-light idea that first wore the name "Beaconry" belongs in
**Firemaking**, not in a skill of its own. A citizen is not "a
beacon-keeper"; they are an experienced firemaker tending a great fire.
Folded in, it enriches an existing profession and leaves the skill list,
and Master of Interval, honest.

A **watchfire** is an owned, placed node (`type: 'watchfire'`, fields
`by` and `fuelUntil`). At Firemaking `watch.level` a citizen may
`kindle` one on free ground, spending `watch.kindleLogs` logs at once. It
**burns** while `tick < fuelUntil`, and while it burns it lights the
country around it for every citizen who passes, not only its keeper. No
one owns the light.

**Fuel is the whole economy of it.** `stoke` feeds one log to any
watchfire and extends its burn by `watch.perLog` ticks, banking forward
from whichever is later, the present tick or the fire's remaining burn,
and never past `watch.cap` ticks ahead. A fire cannot be loaded with a
year of wood and abandoned; it must be *returned to*. Every log
delivered pays `watch.xpPerLog` Firemaking experience to **whoever
delivered it**, so feeding a neighbour's fire is not charity. While a
fire burns, its keeper earns a further `watch.burnXp` per tick: the light
is public, the vigil is theirs. Because burn time is bought only with
logs, that trickle is fuel-proportional, and no citizen earns anything a
forester did not first cut. A citizen keeps at most `watch.maxOwned`
watchfires, so the map cannot be carpeted for a passive wage.

Watchfires are **walkable**, as brewpots are: nothing a citizen builds
may wall a door or fence a neighbour in. A fire left cold for longer
than `watch.decayTicks` crumbles to ash and returns its ground to the
commons.

As with survey and brewing, `genesis.watch` lives in the founding
record, not the protocol: a larger, darker world may want longer burns,
cheaper fuel, or more fires to a keeper, and is free to found itself
that way. What is constitutional is the shape, logs in, light out,
never a wage without wood.

## 10. Standing and calling: who a citizen is (v0.55)

For a while every window invented its own idea of a citizen's "level" and
they disagreed about the same public state: one averaged three combat
skills, another averaged five and subtracted two, and computed the skill
levels themselves from a curve that was not the constitutional one. A
number shown beside a citizen's name was therefore a property of the
software someone happened to open, rather than of the person. In a world
whose windows are meant to be views of one truth, that is a category
error. Both are derived here instead.

**Standing** is the sum of a citizen's true level in all sixteen skills:

```
standing = sum over SKILLS of levelForXp(xp)
```

It is `levelForXp`, the continuing level of §4b, and deliberately not
`effLevel`: mastery at 99 is a milestone, not a ceiling, and a citizen
who keeps going past it keeps rising. The only limit on standing is the
representational one of §4b, which puts it near 3,392 and which nobody
will approach. It privileges no profession: an explorer who never draws
a sword and a knight who never brews are measured by the same rule,
which is the only honest measure in a world of sixteen trades.

There is deliberately **no combat level.** Combat is three skills of
sixteen. A world whose countries are wood, stone, water, danger, and
home does not rank its people by their capacity for violence.

**Calling** is the trade a citizen has the most **experience** in,
rendered as a word: forester, miner, fisher, cook, smith, firekeeper,
mourner, archer, alchemist, farmer, fletcher, fighter, warden,
cartographer, brewer.

Experience, not level, is what decides it. Levels are a step function of
experience, so the trade with the most experience always holds the
highest level as well: comparing experience gives the same answer
wherever the levels differ, and settles a tie between two equal levels
the way the citizen expects, in favour of the one they are further
along. Two skills at level 8 are not really equal to the person who
spent the evening at one of them. Only a tie in raw experience falls to
the constitutional skill order, so every node still answers identically.

Hitpoints is excluded, being a consequence of fighting rather than a
trade, and starting at 10: without that exclusion every citizen would
be born a fighter. A citizen whose every trade is still level 1 has no
calling yet and is a **newcomer**.

A citizen who has mastered all sixteen has a calling of their own:
**Master of Interval**, the same condition the world announces. It is
written now, while nobody is close to it, for a constitutional reason
rather than an aesthetic one: every rule change is a fork, and the day
someone approaches total mastery is the worst possible day to need one.

A calling at mastery reads as one: **master brewer**, **master smith**.
Mastery is the single milestone this world already stops to announce, so
the word a citizen is known by says it. This needs no second rule, and
covers no second case: because the calling is the *most-experienced*
trade, a citizen who has mastered anything at all necessarily has at
least that much experience in their calling, so the word turns to master
exactly when they have mastered something. Past mastery it does not
change again; standing carries the rest. Hitpoints being
excluded, no amount of surviving makes anyone a master of anything.

Together they read as an introduction rather than a score:

```
Erik · brewer (412)
```

The number says how much of the world someone has touched; the word says
who they are. A single scalar would flatten sixteen professions into one
hierarchy, which this world refuses everywhere else. The calling restores
what the scalar throws away, and it is the more useful half socially:
it tells you who to ask for a smithing job, who sells charts, and whose
tavern you are standing in.

Both are pure functions of public state. Neither is stored, so neither
can drift from the skills it describes.

### 4c. The curve is computed exactly (v0.60)

The ninety-eight thresholds of §4b are constants, written out, not
recomputed. Past mastery the curve continues by the same recurrence, and
that continuation is evaluated in exact integer arithmetic rather than
with `Math.pow`, which ECMA-262 leaves implementation-defined. The same
rule governs terrain (§9b) and for the same reason: anything two
implementations could round differently is a place where one world can
quietly become two. A window that recomputes the thresholds instead of
copying them is making the same mistake more cheaply, and is equally
forbidden.

### 7c. The Reading Rule reaches loot (v0.64)

The rule of §7 is that chance may only judge deeds whose lots are not yet
drawn, because the beacon for a tick is public during that tick. It was
first applied to instant deeds: cooking and firemaking are counted, not
rolled, so no one can wait for a kind tick to light a fire.

Loot was not, and it should have been. A drop judged by the beacon can be
**timed**: fight the beast to its last point of life, read the beacon,
and withhold the killing blow until a favourable tick comes round. The
wait for a one-in-thirty-two drop is about twenty seconds, which makes it
not a rare drop but a slow certainty, and it rewards the patience to
exploit rather than the work.

Loot is therefore counted, on the same accumulator: the tally is per
citizen and per drop, so the thousandth troll yields what a troll owes,
in a fixed order that no timing can bend.

Something real is lost here and it is worth naming: the lottery. A rare
drop on the tenth kill is a story, and counting cannot tell it. But in a
world whose beacon is public, dice do not give that story to everyone
equally. A patient program reads the lots and lands its killing blows on
kind ticks; a person swinging in real time cannot. Dice here are not a
lottery, they are a tax on whoever is not automating, and this world's
first promise is that the ledger does not care which of the two you are.
Counting is what makes the rare thing cost the same for a bot and for a
citizen. Most citizens will not keep the tally anyway, so the moment
still arrives unannounced for the person actually playing; the program
knows exactly when it is coming, and feels nothing when it does.

Rates are given out of 65536. The old eight-bit denominator could not
express anything rarer than one in 256, which is not rare enough for a
thing that ends a search. Over any span the count
is exactly the promised rate, with no variance in either direction. The
rare thing stays rare, and it costs the same thirty-two fights whoever
you are.

### 6s. Weapons: the metal is the tier, the shape is the choice (v0.65)

There were two weapons worth carrying and everyone carried the same one.
A world where the only question is *how much ore have you got* answers
nothing about the person holding the sword.

So the shapes were separated from the tiers. No new material was added,
and none will be: the same ore and the same star-stone, worked into
different answers to the same question. A weapon differs along four axes
and each is a real trade, not a bigger number:

| | max blow | swings every | reach | odds |
|---|---|---|---|---|
| dagger | lowest | 2 ticks | 1 | **best** |
| sword | middling | 2 ticks | 1 | even |
| spear | modest | 2 ticks | **2** | even |
| maul | **highest** | 3 ticks | 1 | worst |

A dagger lands often for little, which is what you want against a
skeleton-knight's guard. A maul lands seldom for a great deal, and misses
in a way you feel. A spear keeps a tile between you and the troll. A
sword asks no questions. Bronze asks nothing of the arm; star-steel does.

The **old-chain** remains what it is and stands outside this: it swings
every tick, and nothing else ever will. The **horn-bow** is the archer's
equivalent, drawn from a bear about once in a thousand, and it is the
only reason to hunt one. Neither can be forged, and that is the point:
almost everything in this world is reachable through a skill, and those
two are reachable only through patience.

## 9. A world's geography is its own (v0.54)

Anchor's walls, Norwick's bounds, and the marches of the Wilds were
written as constants when there was only one world. The Wilds in
particular are **law**, not scenery: recall is refused from inside them
and the Brand is earned inside them, so where they lie is a
constitutional question. A constant cannot answer it for a world of a
different size: on a map four times the classic one, a fixed 34-by-22
rectangle is a rounding error in a corner.

So the three rectangles join the founding record as `genesis.geo`:

```
geo: { city: {x0,x1,y0,y1}, wilds: {...}, norwick: {...} }
```

Each region is optional, and **a genesis that names none of them gets
exactly the classic numbers**, so the classic world is unchanged to the
byte: same nodes, same mobs, same hashes. A world that names its own
regions is telling every node where its law runs, in the same record
that fixes its size, its seed, and its rules. `inWilds` now asks the
world it is standing in rather than a constant.

This is the same principle already governing `survey`, `brew`, and
`watch`: the *shape* of a rule is constitutional, its *numbers* belong
to the world that was founded with them.

### 9d. Geography is law

A generator does not merely place nodes: it publishes **named regions**,
and the boundary between them is a pure function of the founding record
like everything else. `biomeAt(genesis, x, y)` is as constitutional as
the terrain it partitions, and windows read it rather than inventing
their own idea of where the Fens begin.

This is not decoration. A world whose citizens cannot say *where* they
are cannot coordinate. "Meet me at the fens edge" is only useful if it
denotes one place to everyone who hears it, and a boundary each client
guessed at separately would denote as many places as there are clients.
So the countries are named in the constitution and drawn from the same
arithmetic everywhere: the Greenwood, the Crags, the Fens, the Wilds,
the Heartlands, and the seven settlements.

The boundary is a line, not a gradient, and it is crossed before the
country's heart is reached, exactly as a city limit is. A citizen walking
south from Anchor is *in* the Fens well before the water and the goblin
warrens begin, and their window says so, which is the warning and the
welcome both.

Regions are derived, never stored. Like standing and calling (§10), a
thing computable from the founding record does not belong in the state.

### 9c. A generator name means one landscape, forever

A founding record names its generator (`interval-expanse-v1`) but does
not hash the code behind that name. The name is therefore a **promise**:
whoever publishes a generator id promises that this id builds this
country, in every implementation, for as long as the world runs. Changing
what an id builds does not fork the world, which sounds harmless and is
the opposite: every node goes on claiming the same worldId while building
a different country, and nothing announces the split.

So a change to a published generator is published as a **new id**. The
old world keeps its landscape and its name; the new one is a new world,
and the divergence is visible in the founding record where it belongs. A
node that meets an id it does not implement refuses to build rather than
approximating, for the same reason.

### 9b. Terrain must be exactly reproducible

A generator's landscape is not decoration: it decides where nodes stand,
and those nodes are the founded world. So terrain may use only the
operations IEEE-754 requires to be **exactly rounded**: addition,
subtraction, multiplication, division, and square root: and never the
transcendentals (`Math.sin`, `cos`, `pow`, `exp`, `log`), which ECMA-262
leaves implementation-defined. Two engines that disagree in the last
place about a sine would place a river one tile apart and found two
worlds from one genesis, which no amount of consensus can later
reconcile. Meanders are built instead from hashed control points joined
by smoothstep, which is exact, and looks more like real water and real
footpaths than a sine wave does anyway.

### 9a. The expanse (`interval-expanse-v1`)

A second generator, and the first world designed for the founding record
rather than around it. Where the classic generator reads "a safe town,
then danger": a radial gradient, identical in every direction: the
expanse gives every direction a meaning: **north is wood, east is stone,
south is water, west is danger, and the middle is home.** Five
countries, seven walled settlements, every road a spoke to Anchor, and
eighteen waystones. The country is *knowable*: a citizen who learns it
once still knows it after a year away, which is what a world owes people
who leave and come back.

Where a trail bends, something stands at the bend. The generator places
a boulder or an old tree at the straight line the path declined to take,
so a curve has a cause a traveller can see, and so the country can be
navigated the way people actually navigate: left at the split rock,
rather than by counting tiles. A landmark is an ordinary resource too,
so the thing you steer by is also somewhere to work.

The generator is not part of the rules hash: `SPEC.md` is: but the
world it founds is named in the genesis, and a node that does not
implement that generator refuses to guess at its landscape rather than
grow a different one.

### 9b. The expanse, second founding (`interval-expanse-v2`)

The land is the first expanse's land, unchanged: for the same seed, the
same river, the same bay, the same pools, the same five countries, tile
for tile. What the second founding changes is everything the first walk
revealed, and per §9c it changes them under a **new name**, so no world
that ever ran under `interval-expanse-v1` can quietly become a
different country.

**A water town stands on its water.** Millbrook and Fenmarch stand six
tiles east of the river's centerline at their own latitude
(`riverX(g, y) + 6`), so the river runs along their western streets
inside the walls, entering through watergates; Eastmere stands at
`(0.85W, 0.80H)`, its southeast corner opening on the bay. A mill with
no millstream and two ports with no dock were promises the terrain
didn't keep.

**Where a road meets a wall, that is a gate.** The first expanse cut
gates on a town's center axes and let a diagonally-arriving road run
into the masonry beside them. Now a wall tile is never founded on a
road tile: the trail pierces the wall wherever it arrives, and the
axis gates remain besides.

**Every ford is visible.** Crossings are unchanged in law (the road
pays for its crossings; every main street crosses on pilings), but a
window that mirrors this generator must paint a ford tile, road or
main street over water, as a **bridge**, never as open water. A
crossing the rules permit must be a crossing the eye can find.

**The country is thicker.** Densities in the wild countries roughly
double the first founding (the greenwood ~1,500 trees at the calibrated
640 x 400, the crags ~860 rocks, the beasts in proportion), and each
spoke carries a **wayside hearth** near its midpoint, a permanent
campfire a step off the trail, so the long walk has light, warmth, and
somewhere to cook halfway to anywhere. A town's essential buildings
(bank, well, hearth, signpost, anvils, stores) seat themselves by a
deterministic ring search inside the walls when their fixed offset
lands in the water, so a river town never silently loses its bank.

**Founding.** The generator floor is 256 x 160; the calibrated founding
is 640 x 400 via `makeExpanse2Genesis`, sealing the same `genesis.geo`,
watchfire, and survey retunes as the first expanse. The founding was
measured before it was founded: at 1,000 citizens under the Phase 2
ordinary workload, the calibrated world (~5,100 nodes, ~470 mobs) runs
`nextState` cheaper than the already-measured 3,772-node benchmark
fixture, because terrain nodes are lighter than the fixture's brewpots
and ground litter. The envelope is pinned in `test/expanse2.test.mjs`.

### 9d. The expanse, third founding (`interval-expanse-v3`)

The structural lesson the third founding acts on: **geography must pose
routing problems, and a border must be a thing you can stand beside.**
Every border is now a physical feature, and the world's own edge is the
first of them: **the world is an island, and the island is named
Tallyholm.** A tally is the split stick whose two halves prove each
other (which is how this world stays real) and a holm is what the old
tongue called an island. The name is written on the land itself, on the
capital's signpost. The calibrated founding is
896 x 512 via `makeExpanse3Genesis` (generator floor 448 x 256); the
canvas grew so the island's land matches the second founding's rectangle
within a few percent, tiles are functions, not state, so a silhouette
costs nothing.

**The coast.** The island's radius is a meander of its angle, and the
angle is built from octant arithmetic (`+ - * /` and comparisons only) ,
never `atan2`, which ECMA-262 leaves implementation-defined. The west
reaches out in the Wilds cape past a pinched neck; the southeast is
bitten by the bay; the fens meet the sea in an estuary.

**The borders that are features.** The wilds end at the **Brandline**,
marked by standing stones and freely crossable, a line stepped over
deliberately and never a gate. The law and the look are the SAME line:
`genesis.geo.wilds` ends where the ground turns, so a citizen who can
see they are in the Wilds is in them, and one who can see they are not
is not.

An earlier draft of this promised a margin -- "the legal rectangle
sits strictly inside the visual march: the land warns before the law
binds" -- and no such margin was ever built. It should not be. A
warning band is a ditch, and a ditch turns a border into a ceremony:
something you stop at, confirm, and step across on purpose. What is
lost is everything that depends on a line being crossable without
meaning to -- the misstep, the pursuit that carries you over, the
argument afterwards about who crossed first. The stones say where it
is. Reading them is the citizen's business. The crags begin at the **Ridge**, high stone
that blocks like water and is crossed at the **North Pass** and the
**South Pass**, or skirted the long way through the deep wood, where
the ridge sinks beneath the trees. The treeline and fenline meander.

**The waters.** The Great River rises in the northern wood, passes
Millbrook, gathers the western **Marchwater** at the **Watersmeet**, and
reaches the bay as a widening delta with a distributary at Fenmarch.
**Stillwater** lies in the eastern wood. Two islands stand off the
coast: **Shrine Isle**, reached by a long causeway and carrying a
waystone, the pilgrimage is walked once (§2k) and the recall is yours
forever, and the **Farshore**, which is reached by nothing at all, and
shall remain so: the mystery is constitutional.

**The roads.** A graph of routes through named junctions with three
independent loops, so a walk can be a circuit. Settlements self-seat
from the geography (the port from the bay's shoreline, the river towns
from the river) rather than sitting at fractions the terrain could
drown. All of the second founding's law carries: walls yield to water
and to roads, essentials seat by ring search, every ford is painted as
a bridge, wayside hearths rest the long walks, and the second
founding's proven densities are carried whole onto the island's land.

**Singular places.** The Old Oak, the Ring, the Ruined Tower, and the
Shrine are founded exactly once each; a named place that failed to be
founded would be a lie on every map, and `test/expanse3.test.mjs`
refuses the founding if any is missing, if the Farshore becomes
reachable, or if the Ridge fails to hold between its passes.

### 8f. Constitutional consequences

`SKILLS` gains `brewing`; **Master of Interval is now mastery in all
sixteen.** The honors roll gains `master:brewing` and a first `brewer`.
`genesis.brew` joins the founding record. A new node `brewpot`, two
items (`ale`, `broth`), and three actions (`build_brewpot`, `brew`,
`collect`) join the vocabulary. Watchfires add the `watchfire` node, the
`kindle` and `stoke` actions, `genesis.watch`, and a first `watchfire`. Bot indifference holds: a bot brewer
still has to gather every log, every grain, and tend the rotation in
real returns: it simply runs a small business, like anyone else.

## 6j. Ranged (the bow and the bone arrow)

`fletch {slot, make}` works anywhere: `make: "bow"` turns 1 logs into
a `wooden-bow` (15 ranged xp); `make: "arrows"` turns 1 bones into 5
`arrows` (5 ranged xp): the second bones sink. With a bow wielded and
arrows carried, `attack` is valid at Chebyshev distance <= 4. Each
attack roll consumes one arrow, hit or miss: distance is paid for in
ammunition. Ranged max hit is `1 + floor(rangedLevel / 12)`; damage
grants 4 ranged xp per point and 1 hitpoints xp. A pinned target
endures under fire; hunting behavior is reserved for a future
amendment.

`ranged` joins the skills. The eleventh: `woodcutting`, `mining`,
`fishing`, `cooking`, `smithing`, `firemaking`, `prayer`, `ranged`,
`attack`, `defence`, `hitpoints`.

## 6h. Prayer (the bones sink)

`bury {slot}` is valid iff the slot holds `bones`. It resolves in the
same tick, always: the bones are consumed, the earth accepts them, and
25 prayer XP is awarded. Prayer has no mechanical effect yet; its
powers are reserved for a future amendment. The dead are patient.

## 6e. Mob drops lie where they fall

On a mob's death its drops become **ground items** (§3.4) on the mob's
tile rather than entering anyone's inventory. The killer has no special
claim: loot belongs to whoever walks over and takes it.

## 9h. A node must be able to COMPUTE the world, not merely recognise it

`WORLD_GENERATORS` is a static list of names this engine has heard of.
`TERRAINS` is the registry of generators actually loaded. **They are not the
same thing, and the difference was a hole underneath every other safety
check.**

A node with only v3 imported still recognised `interval-expanse-v4`, passed
`validateGenesis`, and then answered every terrain question with *walkable*:

```
a v5 world with only v3 loaded, over 40,000 tiles
  blocked 0 · walkable 40,000
  of which genuinely impassable: 7,911 (sea, river, ridge, wall)
```

`terrainBlocked` returned `false` when the generator was absent — a
validation path that **failed open**, and failed silently. The node believed
it had a map and did not. The observable was routes being rejected with no
reason given, which is a very expensive thing to diagnose.

Note the sibling path was already correct: `buildWorld` refuses outright on a
geography-hash mismatch. But that refusal can only fire once the right
generator is loaded, so it sat on top of the hole rather than closing it.

Two rules now:

1. **`validateGenesis` refuses a genesis whose generator is not registered on
   this node.** Recognising a name is not being able to compute a world.
2. **`terrainBlocked` fails closed.** An unregistered generator means every
   tile reads as blocked, with one loud warning. The world becomes instantly
   and obviously unplayable, which is the point.

The one exception is named once, in `TERRAINLESS`: `interval-classic-v1`
registers nothing because it has no impassable terrain at all. **Putting that
exception in the door check and forgetting it in `terrainBlocked` blocked
every tile of every classic world and hung the benchmark suite** — which is
why it lives in a single named set rather than as two string comparisons.

This changes no hash. For any world that can be built, `terrainBlocked`
behaves exactly as before; the new branch is reachable only by a genesis the
door now refuses.

## 9c-ii. Why an input was refused (auxiliary, never consensus)

A refused input used to be observable only as `lastInput` failing to advance,
which is indistinguishable from the client never having sent anything.

Nodes MAY report a refusal to the submitting client out of band, as
`{ type: 'refused', of, tick, why }`. Like chat (§9c) this is **not world
state**, affects no hash, and the world does not remember that anyone was
refused. An honest client sees its own errors; a hostile one learns nothing
it could not learn by trying.

This matters because of the tick window. An input is stamped for the tick
AFTER the frame it was planned from, and mobs move every tick — so a
perfectly legal move can be refused because something stepped into the square
in between. Measured at **671 such windows in 600 ticks** with 49 goblins in
an open field. That is inherent to the protocol, not a fault. But a client
that cannot tell a transient collision from real terrain will conclude the
map is wrong and stop trusting its own routing, which is exactly the wrong
lesson. Clients SHOULD treat a refusal naming occupancy, reach or tick as
transient and retry; terrain is permanent and should not be retried.

## 9c. Chat (auxiliary, never consensus)

Chat is NOT part of world state and never affects a state hash. It is a
separate gossip topic, `interval/<ns>/chat/1.0.0`, carrying
`{playerId, tick, text, sig}` signed by the speaking key. Nodes MUST
drop messages over 80 characters, with invalid signatures, or exceeding
one message per tick per key: the interval applies to speech too.
Clients may mute any key locally. The world does not remember what was
said; only who said it.

## 6u. Earned strength, open doors (v0.41)

- **Wield requirements.** star-sword: attack 20. old-chain: attack 30.
  star-helm: defence 15. star-plate: defence 30. Bronze has no
  requirement: the door is open; the tower is climbed.
- **Magic-rock mining floor.** Gathering a magic-rock requires mining
  level 10: the vein refuses an unpracticed pick.
- **`mend` (magic 20).** The sigil's second use: `cast {spell:"mend"}`
  consumes one sigil and restores 20 HP to the caster (v0.41: a strong heal, not a full reset). 40 magic XP.
  The same three stones, a deeper word.
- **The Brand.** A citizen who initiates `attackp` against a target not
  currently striking them wears `brandedUntil = tick + 1500`. The state
  is law; the windows choose the paint. The Brand carries no mechanical
  penalty (v0.41): it is reputation, made legible.
- **Gold trades.** `offer_trade` may name `wantGold` instead of
  `wantItem`: coin settles like any item, atomically, adjacent.
- **The store sells.** `buy {item}` adjacent to a store: currently
  `seeds` at 15 gold. Farming no longer waits on goblin luck.

## 7. Verifiable randomness: the drawing of lots (v0.38)

Each tick carries a **beacon** in the state itself: 32 bytes drawn
from the world's own history. The old formula
(`SHA-256("beacon" || genesisSeed || tick)`) was a pure function of
public constants: every roll for all eternity was computable at
genesis. The lots were dealt face-up. v0.38 redraws them from the one
thing nobody controls alone: the citizens' deeds.

```
beacon(0)   = SHA-256("beacon" || genesisSeed || tick0)   (migration seed)
deeds(T)    = SHA-256("deeds" || sorted signatures of inputs applied at T)
beacon(T+1) = SHA-256^N( beacon(T) || deeds(T) ),  N = 20,000

roll(beacon(T), playerId, tag) =
  first byte of SHA-256( beacon(T) || playerId || tag )
```

Properties, honestly stated:

- **Deterministic & replayable.** The beacon is part of the state; the
  same genesis and input log always reproduce it. Verification is
  recomputation, which is what a witness does all day anyway.
- **Unpredictable while it matters.** Tomorrow's lots depend on today's
  deeds, then walk N sequential hashes (~65ms on commodity hardware):
  by the time anyone could know them, the inputs that will be judged by
  them are already committed (the tick allocator stamps ahead).
- **Acting reshuffles the draw.** Your attack is itself an input to the
  digest that seeds the roll that judges it. You cannot read the lots
  and then act, because acting redraws the lots.
- **Residual bias, bounded.** A lone actor on a quiet night can grind at
  most one bit per tick (submit or withhold their own deed) and must
  still outrun the chain to see the result before committing. On a
  quiet night with no deeds at all the chain advances predictably: but
  the only rolls worth predicting involve acting, and acting ends the
  quiet. The bias buys nothing it doesn't immediately destroy.

No client-side randomness exists anywhere in the protocol.

### 7a. The Reading Rule (v0.39)

The beacon for tick T is public **during** T: it was drawn at the close
of T-1. Chance may therefore only judge deeds whose lots are not yet
drawn: multi-tick deeds (combat exchanges, gathering yields, drops on a
future death) are safe, because their rolls land on beacons that do not
exist when the deed is committed, and committing reshuffles them.

**Instant deeds are judged by counting, not chance.** Cooking and
firemaking resolve the same tick they are submitted; under any beacon
they could be pre-read and timed. They now use a per-citizen tally and
a Bresenham accumulator:

```
success on attempt n  iff  floor(n*q/256) > floor((n-1)*q/256)
q = min(64 + 2*level, 240)      (the same curve as before)
```

Over any window of attempts the success count is exact: the promised
rate with zero variance. Attempt n's outcome is a pure function of n
and level: no tick is kinder than another, so timing buys nothing.
The pan counts; it does not gamble.

## 8. Bot indifference (design doctrine)

Bots are not a problem this protocol tolerates: they are infrastructure
it depends on. Every witness node is a bot: they replay every tick,
verify every signature, and hold every checkpoint: **bots enforce the
rules.** Every scripted citizen chopping through the night keeps the
world's pulse and, since v0.38, feeds its randomness: their deeds are
entropy. A world with no bots is a world with no witnesses.

The rules therefore never ask "is this player human," and never need to:

- Resource nodes deplete and are shared → automation increases supply,
  which markets price in, rather than granting private infinite yield.
- Rare value comes from **scarcity mechanisms** (depletion timers,
  per-region caps), not per-player RNG lotteries that bots could farm
  in parallel for free: and since v0.39, instant actions carry no RNG
  at all.
- The clock may work, but it may never gate (v0.40): a bot's patience
  is infinite, so rules that tax patience tax only humans. There are
  none.

## 9. Worlds, versions, and forks

The genesis object contains the spec version and the **rules hash**
(SHA-256 of this document's canonical text), the genesis seed, the
anchor time, the world dimensions, and any imported founding citizens.
Two peers are in the same world if and only if their genesis objects
match byte-for-byte in canonical encoding.

**World identity (v0.43).** The world's identifier is

```
worldId = SHA-256(canonical(genesis))
```

hex-encoded, never truncated for protocol use (a short prefix is
display-only). The rules hash names a constitution; the worldId names
one exact founded world. Two worlds under the same constitution but
different seeds, anchors, sizes, or imports are different worlds and
different networks: every gossip topic and request protocol is
namespaced by the complete worldId
(`interval/<worldId>/inputs`, `interval/<worldId>/hashes`,
`interval/<worldId>/chat/2.0.0`, `/interval/<worldId>/checkpoint/2.0.0`,
`/interval/<worldId>/ticklog/2.0.0`).

**Genesis is immutable.** After founding, no field of genesis may
change, including `anchorMs`. A node that cannot honor the original
schedule catches up by replay or founds a NEW world (new anchor, new
worldId) whose genesis imports the citizens (`genesis.imported`), which
every node applies deterministically at world construction.

**Signature domains (v0.43).** Every signature binds a purpose and a
world. The signed bytes are `domain || canonical(payload-without-sig)`
with domains `INTERVAL_INPUT_V1|` (game inputs) and `INTERVAL_CHAT_V1|`
(chat). Every signed payload includes the full `worldId`; the state
machine rejects any input whose `worldId` is not this world's, so an
input signed for World A is unverifiable and invalid in World B.

Changing any rule changes the rules hash and creates a new world sharing
history up to the fork tick. Characters exist in every timeline that
shares their history. Clients display the spec version and worldId
prominently; players choose their constitution.

## 9a. Checkpoints and late join

A **checkpoint** is the envelope
`{formatVersion, worldId, tick, stateHash, state}` where `state` is the
full canonical world state at that tick. Checkpoints are self-verifying
up to identity: anyone can recompute the state hash. Before ANY
checkpoint is adopted (from disk or from a peer), the receiver MUST
verify: `worldId` equals its own, `state.genesis` is byte-identical in
canonical form, `state.tick === tick`, and the recomputed hash of
`state` equals `stateHash`. Trust that a checkpoint is *the* canonical
timeline comes from corroboration, not authority:

- Nodes persist a checkpoint locally through a serialized, crash-safe
  writer (one write in flight, newest snapshot wins, unique temp file,
  flush, atomic rename; failures are surfaced, never swallowed) and
  serve their latest on `/interval/<worldId>/checkpoint/2.0.0`.
- A joining peer MUST fetch checkpoints from at least two independent
  peers and verify the state hashes match before adopting one. More
  corroboration is better; one peer is never enough.
- After adopting a checkpoint at tick T, the peer buffers gossiped
  inputs and advances normally from T. Its hashes must then agree with
  the network's: if they don't, the peer adopted a minority timeline
  and should re-sync from different peers.

## 9b. Catch-up by replay

Nodes retain a recent **input log** (the exact input sets applied per
tick) and serve contiguous ranges of it on
`/interval/<worldId>/ticklog/2.0.0`, bounded per request (at most 256
ticks and 4 MiB per response). A node that stalls past one or more tick
boundaries recovers by fetching the missed range and replaying it
through the state machine: recomputing, not trusting: hash gossip
still judges the result. If no reachable peer's log extends back far
enough, the node falls back to checkpoint re-sync (§9a). Determinism
makes history replayable; replayability makes stalls survivable.

## 9d. Network limits (v0.43)

Every network surface is bounded before allocation. Nodes MUST reject:
gossip frames over 16 KiB (chat over 2 KiB) before parsing; inputs more
than 20 ticks in the future or for any other world; malformed player
ids; more than 4096 buffered inputs per interval or 64 buffered future
intervals; hash gossip outside a 512-tick window. Rate/retention maps
(input buffers, hash history, chat rate table) are pruned by tick or
capped in size. Values are protocol constants published by the
implementation (`LIMITS` in node.mjs).

## 9e. Two kinds of world

A genesis that lists a **witness set** (§9f) is an *authoritative
world*: intervals finalize only through quorum-attested bundles, and
the claim "one finalized world every honest node independently
verifies" holds against the network model in §9f. A genesis without one
runs the older optimistic mode: deterministic peer-to-peer input
propagation with state-hash divergence detection: which remains
accurately described as a prototype: adverse timing can make honest
nodes apply different input sets for a tick, and hash gossip detects
but does not repair this. Optimistic worlds exist for development and
demonstration; a network that intends to be one world MUST found with
witnesses.

## 9f. Certified interval bundles (v0.44)

Authoritative worlds finalize through **IntervalBundles**: for each
tick, one canonical, certified set of inputs.

**Witnesses and quorum.** `genesis.witnesses` is an ordered list of
ed25519 public keys; `genesis.quorum` is an integer with
`1 <= quorum <= |witnesses|` and: constitutionally  
`2 * quorum > |witnesses|`, so any two quorums intersect. A genesis
violating this MUST be refused at founding and by every verifier. Both
are founding facts: immutable forever, committed to by the worldId, and
never changed in-protocol; witness replacement means founding a new
world (with imports). A different witness configuration is a different
world.

**Proposal.** The proposer for `(tick, round)` is
`witnesses[(H(worldId || previousStateHash || tick) + round) mod n]`.
At the schedule boundary the round-0 proposer publishes a bundle
`{v, worldId, tick, round, previousStateHash, proposer, inputs, sig}`
where `inputs` are player-signed inputs sorted by
`(playerId, inputHash)`, at most **two** per player (one action, or the
pair that proves equivocation, which the state machine's duplicate rule
then excludes deterministically), and `sig` is the proposer's signature
under domain `INTERVAL_BUNDLE_V1|`. The proposer selects which inputs a
tick contains; it cannot invent one (all remain player-signed) and
cannot forge an outcome (see attestation).

**Attestation and the vote lock.** Every witness that receives a bundle
validates it structurally (world, tick, lineage via
`previousStateHash`, expected proposer, order, caps, every input
signature), **recomputes the state transition itself**, and publishes
an attestation `{v, worldId, tick, round, bundleHash,
resultingStateHash, witness, sig}` under domain
`INTERVAL_ATTESTATION_V1|`. Voting is governed by the **tick lock**
(CONSENSUS.md §4): the first valid bundle a witness signs for a tick is
written durably to disk *before* the attestation is broadcast, and the
witness thereafter signs no other bundle hash for that tick: across
ALL rounds, across restarts. The identical bundle may be re-attested
and rebroadcast freely. Locks are released only by finalization of the
tick, never by rounds or timeouts.

**Finality.** An interval is FINAL when `quorum` distinct witnesses
attest to the same `(bundleHash, resultingStateHash)`. The bundle plus
that quorum of attestations is a **finality record**: a portable proof
anyone can verify against genesis alone. Nothing finalizes on a timer;
the 600 ms schedule only paces proposals. `scheduledTick` (what local
time predicts) and the finalized tick (what quorum evidence proves) are
distinct quantities and MUST NOT be conflated.

**Timeout and fallback.** If round `r` produces no finalization within
`ROUND_TIMEOUT_MS`, round `r+1` opens with the next proposer in
canonical order. A round cannot be jumped early. If quorum is
unreachable (partition, dead witnesses), the world **stops finalizing**
and resumes when quorum returns: a stopped world, never two worlds.
Because locks are never released, a multi-round partition can strand
locks across bundles such that a tick can never finalize
(CONSENSUS.md §8, H2): that too is a stop, recovered by refounding, and
is the accepted price of fork-freedom.

**Fairness (honesty clause).** The protocol guarantees deterministic
execution and deterministic finality; it does NOT guarantee complete
input inclusion. The round's proposer chooses the bundle from what it
saw; an omitted input dies with its tick (inputs are tick-bound) and
the client resubmits. Proposer misbehavior: omission or signing two
bundles for one round: is detectable, and proposer equivocation yields
portable evidence. See CONSENSUS.md §7.

**Mismatch means halt.** A node whose own computation of a certified
bundle's result differs from the quorum-certified
`resultingStateHash`: or that observes a quorum certify a structurally
invalid bundle: HALTS: it refuses to finalize further intervals,
preserves the conflicting evidence, and recovers only from a certified
checkpoint. Silent self-repair onto an unverified state is forbidden.

**The consensus specification.** The full agreement protocol: model,
fault assumptions, locking rules, the common verifier, liveness limits,
halting conditions, and witness lifecycle: is normatively specified in
CONSENSUS.md v1.0. Where implementation and CONSENSUS.md disagree, the
document wins.

**Certified sync.** A checkpoint from an authoritative world carries
the finality record certifying its state; a receiver verifies the proof
and the recomputed state hash, so a checkpoint from ONE peer is
trustworthy (§9a's two-peer corroboration remains the rule only for
optimistic worlds). Catch-up serves finality records, not raw inputs:
the recovering node verifies each proof and replays each bundle,
demanding the certified result byte-for-byte.

## 6aa. The beasts act (v0.81)

Everything a beast does to a citizen happens in **one phase, on the beast's
own clock**, whether or not anybody is acting on it.

Before this, retaliation lived inside the attacking citizen's action, against
the single mob they had targeted. Three consequences, all of them faults
dressed as rules: nothing could gang up, because a beast had no way to act
unless acted upon; a slow weapon made you measurably harder to hit, because
the whole block hung off the citizen's swing timer; and an archer at four
tiles was untouchable by construction.

### What a beast wants

A beast takes a target for one of two reasons:

- it is **angry** — somebody struck it, and it remembers who (`mob.mad`)
- it is **hunting** — a citizen came within `aggro` and it hunts by nature

A creature with no `aggro` never starts anything. Striking one makes it
angry anywhere.

### Where a beast will start something

**Aggression is a property of COUNTRY, not creature.** A goblin in the
Heartlands is the same goblin as one in the Moor; what differs is whether
anybody has made the ground safe. That is what a settled country IS.

Beasts hunt in the **Wilds, the Crags and the Moor**. Everywhere else they
answer a blow and otherwise mind their own business.

```
country       lvl 1    lvl 20   lvl 50     worst case: beasts able to reach one tile
heartlands       0        0        0       1
downs            0        0        0       -
greenwood        0        0        0       -
fens             0        0        0       -
moor          DIED       14        3       2
wilds         DIED     DIED       32       7
crags         DIED     DIED        9      15
```

Every skill remains trainable in safe country — 386 rocks, 1,409 trees, 156
fishing spots — while the richest ground, 610 rocks in the Crags, now costs
risk.

### Three at a time

`MAX_ON_ONE = 3`. Density is uneven: one tile in the Crags had **fifteen**
beasts able to reach it against one in the Heartlands. Fifteen is not a
fight, it is a wall, and a wall does not make a country dangerous — it makes
it closed. The rest hang back and take a turn as others fall away.

### A beast comes for what it can perceive

Its reach for an attacker is exactly its `aggro`, and no further. This is
what makes an archer possible again:

```
beast (aggro)      sword@1  wooden@4  horn@5  dragon@8
goblin (3)              46         0       0         0
wolf (5)                74        69      88         0
```

Any bow clears a goblin. A wolf outranges the common bows. **Not *hold a bow
and be safe* but *hold enough bow, and know what is looking at you*.**

### Nothing sets about a sleeping citizen

Death drops everything, and somebody whose connection dropped should not lose
an hour's gathering to a wolf they never saw. A beast will not set about a
citizen the world already considers asleep (`isAwake`, §5). It is not
immunity: the moment they act they are awake and fair game.

### Kiting, which follows from the leash

A beast may chase to `aggro + 8` tiles from where it belongs and no further.
That tether exists to stop mobs wandering across the island, and an
unintended consequence is that **an archer can walk one to the end of its
rope and then shoot freely** — measured at twelve ticks of retreat buying a
hundred and eighty-eight of free shooting.

This is intended to stand. It costs attention rather than resources, it fails
in close terrain and against numbers, and it trains no defence.

**It does not work citizen against citizen**, because a citizen has no leash:
retreat forever and they follow forever, so backing off means never standing
still long enough to loose. Measured, a kiting archer fired one arrow in two
hundred ticks and lost a duel they would otherwise have won.

## 6w. The dragon, and the one bow

There is a dragon. Not a kind of thing that spawns in the Wilds — a thing
that is there, like the Barrow and the Ring and the Brandline. It sits deep
in the west, well past the Brand, and the walk is meant to be a decision.

```
maxHp 420 · atk 115 · def 24 · maxHit 28 · every 4 · respawn 36,000 (six hours)
meleeOnly · aggro 9 · breath 5 · breathHit 14 · breathEvery 5
```

**It breathes before you arrive (v0.81).** It notices at nine tiles and
breathes from five, so the approach costs and a party arrives already hurt:
somebody has to survive the walk. Fire goes ROUND armour the way a flail does
— no soak — while claws at arm's length are soaked normally. And it still
cannot be answered from out there, because the scales turn arrows: you may
cross the fire, never trade with it.

**`every 4`, and the reason is worth recording.** Damage was never the
binding constraint — a pair lost identically at maxHit 28, 22 and 18. What
decides the fight is TIME: one citizen tanks while the others swing, and a
lone swinger cannot take 420 points down before the tank runs out of broth.
The lever is how OFTEN it strikes. Measured over seven attempts, walking in
from ten tiles in full star with sixteen broth:

| party | wins |
|---|---|
| one | 0 of 7 |
| two | 5 of 7 |
| three | 7 of 7 |

**Two can take it and two will sometimes fail**, which is a better answer
than a guaranteed win — *on broth*. Re-measured after the deep catch (§6ad)
existed:

| party | on broth (heals 5) | on cooked deep fish (heals 10) |
|---|---|---|
| one | 0 of 5 | 0 of 5 |
| two | 3 of 5 | **5 of 5** |
| three | 5 of 5 | 5 of 5 |

The floor holds: one citizen cannot, on any food. What mastery buys is
**reliability** rather than possibility — fishing 90 and cooking 80 turn a
marginal pair into a dependable one, and that is a fair thing for mastery to
buy.

**`atk 115` is the whole design.** Every other beast is atk 1–5, and the
accuracy rule is `Tm = clamp(128 + 4*(atk − defence), 16, 240)`: against a
citizen at defence 99 an atk-5 wolf is clamped to sixteen in two hundred and
fifty-six. It lands one blow in sixteen, and a star-clad citizen is
immortal. That is not an oversight; it is what a world where combat is not
the point looks like. The dragon is the single exception, and it is an
exception on the **citizen's** scale.

Measured against maxed citizens in full star gear carrying broth:

| | |
|---|---|
| one citizen | **dies**, every time |
| two | win, and it is a real fight |
| four | win comfortably |

**Scales turn arrows.** The dragon is immune to ranged attack entirely — a
drawn bow does nothing to it at any distance, and that is asked BEFORE reach
is considered. `inReach` measures the weapon's reach, so a dragonbow at nine
tiles was already "in reach" and returned before the immunity was ever
tested: the one creature arrows cannot touch could be shot from outside its
own stride.

**A beast keeps its own clock (§6b.4).** Its swing cadence is `stats.every`,
not the citizen's. Two faults lived here: the retaliation sat behind a
`continue` that fired when the CITIZEN's arm was not ready, so a slow weapon
made you harder to hit — pick up a maul and a troll attacked a third less
often than if you were barehanded, which is defence by choosing a heavy
weapon and a rule nobody wrote. And the cadence was hardcoded to every other
tick, so `every: 1` on the dragon did nothing and it struck like a goblin. This is the only reason a
citizen must ever close with anything, and it means the bow made from the
dragon can never be turned on the dragon.

### The dragonbow

```
hit 6 · every 2 · reach 9 · acc +12 · requires ranged 40
```

**Reach nine is the weapon.** Nothing else in the world touches past five, so
whoever draws it fights at a distance where almost nothing can answer.

**There is one, and there will only ever be one.** It is not a drop that
accumulates: it is a thing the dragon HAS, and it changes hands rather than
multiplying.

- the dragon holds it whenever no citizen does
- kill the dragon while it holds the bow, and the bow is yours
- kill it afterwards and you get scales and bones, because somebody has it
- die in the Wilds and your killer takes it, like anything else in a pack
- **be archived or forgotten while holding it, and it goes home to the
  dragon** — a unique thing held by somebody who never comes back is a
  unique thing lost, and the best object in the world sitting in a dead pack
  forever is worse than no unique object at all

`state.bowOut` is the world remembering that the bow is loose. Nothing needs
to track WHO holds it: it is in somebody's pack, and packs are already the
world's record of who has what.

**No keeper prices it**, so it can never be bought — the same rule as
`old-chain`, and for the same reason. Gold has no top end in this world:
status here is never purchasable. Names cost standing, the old chain costs
asking, and the bow costs blood.

**It cannot be banked.** A `deposit` of the dragonbow is refused at any
strongroom.

This world is against hidden power: names are public, standing is public,
the hiscores are public. A unique weapon locked in a vault would be the one
thing in it nobody could see and nobody could reach, and its holder would
carry the status with none of the risk. So the bow lives in a pack or it
lies on the ground. Whoever has it carries it everywhere, into every fight
and past the Brand, and can never set it down somewhere safe and go about
their day.

That is what makes being hunted TRUE rather than merely said: **you cannot
opt out of it without giving the bow up.**

And it can be answered. Moving cancels your action (§5), so a bow-holder
cannot shoot and flee in the same tick: to loose an arrow you must stand
still, and every arrow costs you ground. Measured, in the open, against
maxed hunters in star gear:

| | |
|---|---|
| one hunter with a maul | the holder falls |
| two | the holder falls, quickly |

Reach nine is a devastating opening, not an escape. The bow is a burden as
much as a prize, and that is what keeps it moving without a market.

## 6x. The flail, and the crossbow

### A flail goes round the plate

Armour turns aside one point a piece and two for starmetal, and between
citizens that subtraction floors at **nothing**: a full suit of star soaks
four, so a sword that rolls low does no harm at all. Correct, and it left the
Wilds with a single answer to a star-clad citizen — land more blows than the
armour can absorb.

A flail has a head on a chain. It does not meet the plate square, it comes
round the edge of it, and `pierces: true` says so: **SOAK does not apply.**

```
bronze-flail  hit 1 · every 2 · reach 1 · acc -12 · pierces
star-flail    hit 3 · every 2 · reach 1 · acc -12 · pierces
```

It pays for it everywhere else. Its base damage is the lowest of any steel,
so against an unarmoured citizen — which is most of the world — it is simply
worse. **An answer to one thing, not an upgrade to everything.**

### A crossbow is the maul of the ranged line

Ranged had one feel repeated three times: wooden, horn and dragon all loose
every two ticks and differ only in how far and how hard. Melee has four — a
dagger lands often for little, a maul seldom for a lot, a spear keeps its
distance, a sword asks no questions. Ranged deserved the same choice.

```
crossbow  hit 5 · every 3 · reach 4 · acc +32 · ranged
```

Slow to crank, heavy, and the most accurate thing in the world. It reaches
less far than a horn-bow, because a bow's arc is a bow's arc.

### The sigil-bow: imbued, not made

Arrows are the whole cost of shooting — one per draw, hit or miss — and
running out ends the action where you stand. Every bow paid that identically.
This one pays **half**.

```
sigil-bow   hit 2 · every 2 · reach 5 · acc 0 · ranged · thrift
```

Identical to the horn-bow it was made from. Imbuing does not make a bow hit
harder; it makes it thrifty. So it is the third *feel* in the line rather
than a fourth set of numbers: the bow you carry when you are going somewhere
you cannot restock, which in the Wilds is the difference between a trip and a
raid.

The sparing alternates per **draw**, not per tick — a bow with `every: 2`
only ever looses on ticks of one parity, so a tick test either spares every
arrow or none.

### Making them, and being allowed to

```
                 recipe                         smith         wield
bronze-flail     ore 2 · logs 1                 smithing 8    attack 10
crossbow         ore 2 · logs 2                 smithing 18   ranged 25
star-flail       magic-stone 3 · ore 2 · logs 1 smithing 26   attack 25
                                                magic 14
sigil-bow        horn-bow 1 · sigil 3           smithing 12   ranged 30
                                                magic 25      magic 20
```

Which puts the ranged line behind a smithing bench for the first time, and
the sigil-bow behind a magician.

**All four shipped with no requirement at all** in their first draft — a
starmetal flail was wieldable at level one while a star-maul asked for attack
25, and a crossbow with `acc +32` was free to anybody. Adding a weapon means
adding two gates, and forgetting them is silent.

### A note on reach and safety

A spear reaches two, and a beast retaliates against a spear at two tiles as
hard as at one — the retaliation is gated on whether a **bow** is drawn, not
on distance. Measured: 76 dealt and 92 taken at reach 2. There is no safe
melee training, and there never was.

A **bow** beyond adjacent takes nothing, which is the archer's bargain and
paid for in arrows.

## 6ad. What a master brings back (v0.81)

Four skills had exactly one thing to do, forever: woodcutting one log,
fishing one fish, cooking one meal, fletching a beginner's bow. At ninety,
the same tree and the same water give something else — **instead of** the
ordinary yield, not as well as it.

```
woodcutting 90+   a tree yields heartwood, not logs
fishing     90+   a spot yields deep-fish, not raw-fish
```

Replacement rather than addition costs no new node and no new spot, and it
leaves the cheap end of both markets to the people who still need it: a
master can no longer supply ordinary logs or ordinary fish. **Specialisation
by exclusion**, which is the same shape as each town being *for* something.

Heartwood is worth 9 against a log's 2; a deep fish 11 against 3. A master's
hour should be worth more than a beginner's.

### A log is a log

`isLog(item)` is asked once, and everything that wanted logs by name now
wants either kind: kindling a campfire, feeding a watchfire, seven smithing
recipes, the wooden-bow. Written out at each site that would have been nine
chances to miss one, **and the one you miss is a skill a master can no longer
train.**

### The deep catch

```
deep-fish -> cooked-deep-fish   requires cooking 80, or it burns every time
HEAL_DEEP_FISH = 10             against a broth's 5
```

Ten is the largest single bite in the world, and it does not outclass broth,
because **a fish does not stack and a broth does.** A pack of broth is the
greater total; a cooked deep fish is the greater mouthful. Burst against
volume — a choice, not a replacement.

### The heartwood bow

```
heartwood-bow  hit 4 · every 2 · reach 3 · acc +6
               3 heartwood · fletching 90 · wield ranged 40
```

**The only good bow anybody can make.** Every other is found (horn-bow),
imbued (sigil-bow), forged (crossbow) or unique (dragonbow) — fletching
topped out at a beginner's stick.

It is not a tier above the horn-bow but a choice against it: more damage,
**less reach than any bow in the world**. Three puts you inside a goblin's
senses and a troll's, so you cannot stand beyond their perception and shoot
freely. You trade the kite for the damage — the archer's weapon for somebody
who means to be in the fight.

## 6aa-ii. Defence is learned in a fight (v0.81)

A swing that misses teaches four, as it always has. But it teaches **only a
citizen who has swung at something within the last twenty ticks**.

Aggression broke an assumption nothing had needed to state: before it, a
beast only swung when you were swinging at it, so *being attacked* and
*fighting* were the same thing. They are not any more, and a citizen could
stand in a crowd with their hands in their pockets and earn what a real fight
earns.

```
defence 50 in star, 200 ticks where many beasts hunt
  standing idle, no action            0
  set an attack once, then walked away 0
  actually playing                  1148
```

`lastSwing` already existed and is already constitutional. It survives a
beast wandering out of reach — which is what defeated an earlier attempt to
gate on `action`, since an action clears the moment its target steps away and
would have flickered off through every honest fight.

**Two earlier attempts were worse than the fault** and are recorded here so
they are not tried again: scaling the award by accuracy closed the farm and
walled defence off at about thirty-two, which no living citizen had passed;
gating on `action` was correct in principle and unusable in practice.

## 6cx. The Gibbet King, the risen, and the shroud (v6)

There is a Gibbet King. Like the dragon, not a kind of thing that spawns —
a thing that **is** there, one of him, standing at the gibbet in the middle
of the **Moor**. Before him the Moor was dead country: goblins and wolves
already found in three other lands, and nothing of its own. It is his now.
The Moor keeps no goblins and no wolves; it is undead ground, quiet until a
citizen comes near.

```
gibbet-king · maxHp 200 · atk 55 · def 16 · maxHit 22 · every 4 · respawn 9,000 (ninety minutes)
meleeOnly · aggro 8 · raises · raiseEvery 5 · raiseCap 4
drops: 2×bones always · magic-stone 1/8 · king-shroud 1/164
```

**He does not hunt. He raises.** His threat is not his arm — it is the dead
he calls up and sends. When a citizen comes within his reach he raises a
**risen** every `raiseEvery` ticks, up to `raiseCap` alive at once, each one
maddened at whoever came. To reach the King a citizen must cut through the
wave faster than he renews it. The cap is what makes it a hard solo rather
than a wall: four at a time is survivable, but they come again while you
close the distance.

```
risen · maxHp 12 · atk 4 · def 3 · maxHit 2 · aggro 6 · summoned · drops: bones
```

**The risen exist only while he does.** A risen is his: it carries the mark
of the King who raised it, and when he falls — or when the citizen leaves and
he stops raising — the risen he called **crumble** back into the moor. A
risen you actually put down leaves its bones; one that crumbles leaves
nothing. The world never fills with permanent summoned dead. Killing the King
quiets the Moor until, ninety minutes on, he rises again.

**The king-shroud is his, and it is authority over the dead.** One in a
hundred and sixty-four kills yields the **king-shroud**: a hooded mantle, worn
on the body (armour 22, requires 40 defence), never smithed — the only way to
it is through him. It is not merely armour. Worn, it does three things, each an
expression of one idea — *mastery over death*:

1. **The dead do not rise against a wearer.** In the Wilds, the risen and the
   skeleton-knights will not START on someone in the shroud — the dead do not
   see the mantle of the one who commanded them as prey. They still retaliate
   if struck; the living care nothing for it.

2. **The King himself raises at half rate against a wearer.** His own mantle
   slows him: against a citizen wearing the shroud, `raiseEvery` doubles. Not
   stilled — he can still call his dead — but slower, so the one who took the
   shroud from him has an easier road back to him.

3. **The wearer carries more of themselves through death — but not everywhere.**
   The shroud is death's own cloth, and where you die decides whether it spares
   you:
   - **Outside the Wilds**, the shroud is kept on its own account, separate from
     what prayer holds (§6c) — it does not compete by price, so it never falls
     out to a dearer item and never wastes a low-mourner's single slot. In the
     settled world it is not a fragile trinket.
   - **Inside the Wilds**, it earns no such grace. It drops into the same
     value-sorted pool as everything else you carry and must win a keep-slot on
     price like any loot — so it CAN be lost. Wearing it into the Wilds to still
     the dead is itself a wager on the shroud: the thing that makes that country
     safer from the dead is staked on your surviving it.
   - **Branded** (§2b), the wearer keeps nothing at all, shroud included. That is
     forfeiture, the raider's price, and a different thing entirely from the
     Wilds' risk. The shroud shelters those who FACE death and is lost by those
     who DEAL it — and so it circulates, from every raider who dies marked and
     every citizen who carried something dearer into the Wilds and did not come
     back.

## 6cy. The two events (v6): the incursion and the bloom

The sixth expanse founds with `genesis.events`. A world without it (every
v1–v5 world) runs the event step as a **no-op** and stays byte-identical; the
shape of the events is the constitution's, their numbers are the world's. Both
are seeded from the beacon (`sha256(beacon | "event" | tag)`), so they are as
deterministic as everything else — the same world computes the same events on
every node.

**The incursion — a roaming shared fight.** A thing walks out of the dark, fixes
on **one** citizen, and takes a while to put down — two to seven minutes for a
master. Its body is **scaled to its target at spawn** (an incursion carries its
own `maxHp`, `def`, `goneBy`, `leash`, and origin tile — the only mob permitted
those fields). It hits softly relative to its bulk, so anyone may safely turn and
help; the danger is not the point, the **gathering** is. It never loses the scent
of the one it came for, out to its leash, and it is bounded in time — it must be
gone by `goneBy` — so it is a shared fight that flares and passes, not a fixture.
Its face is contextual: the dark takes the shape of the country and the skill it
interrupts.

**The bloom — a roaming rich spot.** Where the incursion is a threat that gathers
people to fight, the bloom is an **opportunity** that gathers them to work: a
transient rich place that pays continuous experience to whoever attends it while
it lasts, in the manner of a watchfire. It roams, it blooms, it fades — an
invitation to be somewhere at a certain time, which is the same congregation the
whole world is built to make, arriving by chance instead of by geography.

## 6ac. The siren on the strand (v0.81)

The third thing that cannot be done alone, and the only one that **forbids**
a party.

```
siren  maxHp 60 · atk 20 · def 20 · maxHit 6 · every 2
       aggro 10 · mirrors · respawn 1,200 (twenty minutes)
```

```
dragon  you need a party      (you die alone)
spider  you need a party      (the arithmetic does not close)
siren   you may not have one
```

### She takes one at a time

The first blow **binds** her (`mob.bound`). Every other citizen is refused at
the door rather than merely ignored, so somebody learns it from the world
instead of from a health bar that will not move. The binding releases when
its citizen falls, walks more than 24 tiles away, or goes to sleep, so nobody
can hold her by logging off.

### She mirrors whoever took her

Her accuracy is the citizen's own attack level; her damage is their weapon's
max hit; her reach is their reach; and her quiver is **the arrows in their
pack at the moment she took their shape**.

```
                      her hardest blow    the citizen's maxHit
bare hands, level 1          1                    1
star-maul, level 99         17                   17
dragonbow, level 99         16                   16
```

The quiver matters more than it looks. Without it a mirrored archer fights
somebody who never runs out and loses to arithmetic rather than to the fight.

**So the encounter is exactly even, at every level, forever.** It never
trivialises and it never gates: a citizen at twenty has the same fight as one
at ninety-nine. What breaks the tie is the one thing she cannot copy —
**you brought food and she did not.**

### She does not wander

Every other beast drifts a tile or two about its home. That is fine for
something you hunt and fatal for something you **duel**: she stepped aside
between the validation and the swing, `inReach` went from true to false
inside a single tick, and the citizen's action was cleared before it ever
landed. A siren sits on her strand.

### She gives nothing, and the world marks it once

No drop. A creature that does not want to fight, farmed for parts, would be
the one outcome that undoes her.

`claimFirst` announces the first citizen ever to walk away from the strand,
once, in the world's history. After that each citizen's own `slain.siren`
counts it privately — a tally that already existed for loot, so no new state.

**She is common on purpose.** A solo fight gates ONE citizen per spawn where
a party fight serves three or four: at six hours only four citizens a day
could ever attempt her, which on a world of twenty is a five-day queue for a
fight whose whole premise is that it is yours alone. Scarcity is the wrong
lever for her — the difficulty is already the fight.

## 6ab. The great spider (v0.81)

The second thing that cannot be done alone, and it cannot be done alone for
a **different reason** than the dragon.

```
great-spider  maxHp 300 · atk 26 · def 18 · maxHit 9 · every 3
              aggro 6 · mends 6 · respawn 36,000 (six hours)
```

The dragon asks *can you survive long enough*. This asks **are there enough
of you**, and it asks with arithmetic rather than danger. `mends` is
hitpoints the web returns each tick while the spider lives, applied before
anything else in the tick — so a citizen watches their damage being undone
rather than discovering afterwards that it was.

One maxed citizen in star gear puts out, measured: chain 5.74, sword 3.40,
dragonbow 3.70, maul 2.98, horn-bow 2.75, crossbow 2.31. Against six a tick:

```
spider hitpoints, ten ticks apart, star-mauls, everyone kept standing
1 citizen : 293 -> 300 -> 300 -> 293 -> 294 -> 296     never gains
2 citizens: 279 -> 288 -> 281 -> 283 -> 279 -> 269     grinding
3 citizens: 283 -> 291 -> 271 -> 249 -> 215 -> 183     winning
```

**No level, no gear and no patience substitutes for another person.** The
dragon can in principle be soloed by somebody good enough with enough broth.
This cannot be soloed by anybody, ever. Two is possible and absurd — a soft
wall rather than a hard one, which is better: nobody is told no, they are
shown the arithmetic.

It is deliberately **not very dangerous**. `atk 26` against a maxed defence
lands about one swing in sixteen. Somebody must hold it, but the fight is a
sum and not a gauntlet.

### The web is the rule, made visible

A creature that silently heals is illegible — a citizen concludes their
weapon is broken. A spider does not heal: **the web mends it.** The healing
is a thing sitting in the world that you walk into and can see, thirty
strands thick at the middle and thinning outward, pulsing as it knits.

Six husks hang in it, which is how you know what this is before you meet it,
and a signpost twelve tiles south reads *the wood ends here · go back or go
together*.

### Where

The far north of the **Greenwood** — measured as the furthest walkable
ground from any town outside the Wilds: **215 tiles** from Cragfoot, against
the dragon's 166 from Norwick. A longer journey than the dragon's and a
different kind: long, but not lawless. The Greenwood's far end had no reason
to be visited at all.

## 6af. The special blow (v0.81)

Three weapons can strike off the rhythm. Each does **one thing you can say in
a sentence**:

```
star-dagger   'twice'   two blows land in one tick
star-maul     'now'     it swings whatever your arm says
horn-bow      'true'    the shot cannot miss
```

**The cost is the arm.** A special spends this cycle and the next
(`lastSwing = tick + every`). There is no second resource, no charge bar and
no cooldown of its own: the arm is the cooldown, and it is a decision rather
than a button.

**`'now'` interrupts your own rhythm ONCE.** It may be used while the arm is
merely recovering from an ordinary swing, but never while the arm is already
spent *into the future* by a special. Without that second clause the maul
could special every tick forever — seven to seventeen damage a tick against a
normal three — and the neutrality this whole design rests on did not hold for
it. With it, chaining maul specials yields about 2.25 a tick against 3.00 for
simply attacking: still a choice about the moment, never a rotation.

**It does not touch the tick.** A special resolves inside the tick that
carries it, the tick advances by exactly one, and replaying the same state and
input gives the same state hash. `lastSwing` may sit in the future; it is an
ordinary bounded integer field and always was. Two identical specials
submitted in one tick do not double — the one-input-per-key-per-tick rule
already refuses them.

### Why it needs no rule confining it to PvP

The cost makes it damage-neutral over the exchange:

```
weapon        normal/tick   after a special
star-maul          3.00          3.00
star-sword         3.75          3.75

horn-bow, target defence 99   normal over 4 ticks 6.50 · special 6.50
horn-bow, target defence 50   normal over 4 ticks 12.22 · special 6.50
```

Against four hundred and twenty points of dragon it buys nothing at all.
Against a citizen at fifteen hitpoints it ends the fight, because they do not
get a later. A shot that cannot miss is neutral against an even opponent and
**worse** against a weak one — it buys certainty, not damage.

So the mechanic selects its own domain. A rule saying *specials do not work
on beasts* would have had no reason behind it except that the bosses were
already tuned, and one arbitrary rule teaches a world to expect more of them.

### It does not stack with the root

The star-dagger's root (§6v) fires on a **normal** landed hit and nothing
else. The special is an alternative to it, not an addition: two blows now, or
one blow that may pin them for three ticks on a hundred-and-twenty-tick
cooldown. Both are the dagger being a dagger.

### And the world must show it

A special resolves off the rhythm and produces damage, so without a mark of
its own it is indistinguishable from an ordinary hit — the same illegibility
as the dragon's undrawn fire (§6w) and a swing that missed (§6aa).

## 6ae. Starmetal is a late thing (v0.81)

```
             wield          forge
star-sword   attack 50      smithing 45, magic 25
star-maul    attack 55      smithing 52, magic 30
star-flail   attack 55      smithing 50, magic 29
star-helm    defence 45     smithing 40, magic 20
star-plate   defence 50     smithing 50, magic 30
```

The two halves must agree. Before this, star-plate was forgeable at smithing
30 and wearable at defence 50, so a citizen could fill a bank with gear they
could not put on. **A tier is one wall, not two at different heights.**

**Starmetal turns fire.** The dragon's breath ignores armour the way a flail
does — except starmetal, which halves it:

```
60 ticks in the fire, four tiles out
  bare            48 damage
  full BRONZE     48 damage
  full STARMETAL  36 damage
```

That is what makes the second tier a tier. Star is only 15-20% better than
bronze by the numbers, so a harder gate alone would have meant working harder
for a thing barely better; the property is the reason to reach fifty.

**The flail is starmetal only.** `pierces` ignores an entire defensive
system, and on a starter weapon it meant a level-ten citizen with two ore
beat a star-clad opponent more efficiently than a star-sword does.

**`magic-rock` teaches 40**, against ordinary rock's 35. It taught 30: the
rarer stone taught less than a common one.

There is **no mining gate**, and there is none anywhere in this world.
Everything is a success *rate*, which is the same *standing is time* thesis:
nothing is forbidden, some things are slow.

## 6ag. The sheep (v0.82)

The Downs is twenty-two thousand tiles carrying **twenty-eight living
things** — twelve per ten thousand, against the Fens' sixty-one — and it
holds a locale named **the Sheepfolds**. The map had been promising sheep
since the fourth founding and the world never put any there.

```
sheep  maxHp 40 · atk 2 · def 8 · maxHit 1 · every 4 · respawn 120
       harmless · NO aggro · drops wool, sometimes a second
```

**No `aggro` at all**, which is what separates this from the crab. A crab
keeps its aggro deliberately, so it walks to you and you gather three at
once. A sheep that walked at you would not be a sheep. With no aggro it
never starts anything; `harmless` means that if *you* start it, it swings,
never lands, and teaches no defence for it.

The forty hitpoints are the balance, not decoration. Safe country plus a
quick kill is a training dummy, and standing here is paid for in time — a
five-hitpoint sheep in the safest country on the island would be the
cheapest attack experience in the world. Forty at defence eight is about a
minute's work. It is the same reason the crab is ninety.

**Wool is worth money and nothing else**, exactly as `crab-shell` is. Not
every drop has to be an input to something. Clothing was considered and
rejected: armour in this world only soaks and never penalises ranged, so an
archer's tunic would be a star-plate that soaks less, and giving it a niche
would mean nerfing every archer who already earned their gear.

Forty sheep, in flocks, with one flock seated in the Folds themselves — a
named place should hold the thing it is named for rather than hope the
hashed clumps land on it. That takes the Downs to about thirty per ten
thousand: below the Crags at thirty-five, well below the Fens. The emptiest
country stops being empty without becoming busy.

## 6z. The shore-crab

Eastmere had **nothing alive within forty-five tiles** — the emptiest named
place on the island, and a port, which is where people arrive.

```
shore-crab  maxHp 90 · atk 8 · def 14 · maxHit 2 · every 3 · respawn 90
            aggro 4 · harmless · drops crab-shell, sometimes a raw fish
```

A crab rather than anything more exotic because Eastmere is a cold harbour on
downland, and an animal should belong to its place rather than be imported
into it.

What it is FOR is **training**: a great deal of shell and very little malice.
**It cannot hurt anybody** (§6z, v0.81). It swings and never lands, which
makes Eastmere the one place you can learn to fight without gambling an
hour's gathering on it. It keeps its aggro, so a few will come to you at
once, and it takes a long time to open. Measured with a bronze sword:

| level | damage taken | attack xp | defence xp |
|---|---|---|---|
| 1 | **0** | 488 | **0** |

And it teaches **no defence**, which is the same rule the archer lives under
(§6j): defence is paid for in risk and only in risk. Something that cannot
hurt you cannot teach you to be hurt. Attack and hitpoints, honestly earned. **Mobs do not hunt in settled country** (§6aa) — a citizen can
stand beside a crab for eighty ticks and take nothing — so nobody is killed
by one who did not choose to open it.

They are placed **on the shore only**, thickest near the town and thinning
along the coast. A crab inland is a crab somebody carried.

## 2n. The engine is part of the constitution (v0.81)

`rulesHash` binds `SPEC.md`, which is prose **about** the rules. This binds
the rules.

A genesis MAY carry `engineHash`. Where it does, a node whose own engine
hashes differently MUST refuse the world: it is not the same world, it only
looks like one until somebody exercises the difference.

### Why this is not optional in spirit

Two nodes running different engines are running different worlds whatever
else they agree on. Refusing to check does not prevent that fork — it delays
the discovery from the handshake to whenever somebody happens to hit the
divergence, which is the worst possible moment, because by then both sides
have a history they believe in.

Measured, on the day this was added: the same signed input, one tick, gave
smithing experience of 40 on one build and `NaN` on another — while both
agreed on `rulesHash`, `genesisSeed`, `geographyHash` and every other check
they made.

And "it is only an optimisation" is a claim nobody verifies. The only way to
establish that a change preserves behaviour is to compare state hashes across
it, which is precisely the mechanism being waived.

**The cost, stated plainly: after founding, an engine bug is a world bug,
permanently.** That is the deal `SPEC.md` already makes; this stops the
implementation from quietly exempting itself. It means an audit must be clean
BEFORE a founding, not after.

### Normalisation

The hash is taken over a normalised form, not the raw file:

1. remove block comments (`/* … */`)
2. remove from `//` to end of line, **wherever it appears**
3. collapse every run of whitespace to a single space
4. trim

Step 2 is wrong as a parser — it strips inside string literals too — and
correct as a hash. The normalised text is never executed, only hashed, so the
only property required is that every node computing it over the same bytes
arrives at the same answer.

Hashing the raw file instead would mean **a typo fixed in a comment forks the
world**. That is absurd enough that people would work around it, and a
worked-around rule is worse than no rule at all. Documentation must be free
to improve; the rules must not.

```
a trailing comment edit    same hash
a whole-line comment edit  same hash
extra blank lines          same hash
a rule change              DIFFERENT
a threshold change         DIFFERENT
```

## 2m. The fifth founding

New foundings use `interval-expanse-v5`. It keeps **every acre of v4's land**
— the lobed countries, the capes, the Barrow the roads bend around, the four
named crossings, the shire against its frontier — and changes only how much
furniture stands on it.

The diagnosis v4 was written to cure was right: *you walk past nothing.* The
cure overshot. At 966 landmarks over 214,000 land tiles, nothing on the
island was ever further than 54 tiles from one, and **a landmark is a
landmark by contrast.** When none of them is ever far, none of them is an
event.

Three changes and no others:

1. **The floors are halved.** Every country's furniture floor is cut to about
   half, and the spread between the richest and the barest is widened rather
   than kept.
2. **Furniture follows the roads.** A clump may seat itself where a road is
   near; further off it needs a hash to agree, and further still it almost
   never does. Things are where people go.
3. **The quiet quarters.** Six hashed tracts of backcountry, seeded only
   where no road comes within forty tiles, refuse furniture outright. That is
   how the island gets somewhere genuinely bare — on purpose and by name,
   not as an accident of the fill.

Measured against v4, same method, same seed:

```
             landmarks   median   p90   p99   max   spread(sd)
v4                 966        9    20    36    54          7.4
v5                 552       13    30    48    60         10.6

             landmarks within 5 of a road   land within 5 of a road
v4                              22%                       13%
v5                              31%                       13%
```

**A fourth, smaller change.** v4 set a companion stone at a FIXED offset
beside a cairn, a bone pile and a charcoal clamp, which left 82 pairs at
exactly (-1,-1) and 63 at (+1,+1). The island was statistically detectable as
generated — invisible to any citizen, obvious to a nearest-neighbour
histogram. Companions are now optional and their offset is hashed.

Determinism is v4's, unchanged: `+ - * /` and `sqrt`, comparisons, hashed
control points, smoothstep. No transcendentals.

## 9g. Two additions to the vocabulary

### A keeper bears a name

`keeper` nodes carry a `name` of one to thirty-two characters, and no other
node type may.

The name was always hashed out of a keeper's place and trade — but it lived
in a FUNCTION each window called for itself, never in the state. A window
that did not know the trick showed "the keeper", and once the towns were
hand-drawn the ids stopped matching the trick at all: forty-five keepers on
the island and not one of them named anywhere but in a guess. A name is part
of who stands there, so it belongs in the world, where the hash covers it
and every window reads the same person.

### The eighteen nouns

`LANDMARK_KINDS` gained eighteen entries:

```
table · bed · shelf · barrel · crate          things inside a room
stump · charcoal-clamp · log-pile             the wood, worked
spoil-heap · cut-face                         the quarry
bone-pile · crude-hearth                      what the Wilds leaves
gibbet · cart · haystack · hurdle             the road and the farm
eel-rack · sunken-wall                        the fen
```

Seventy per cent of everything a citizen walked past was a wall, a tree or a
rock: the island was dense and monotonous, four to six different things
within twenty tiles wherever you stood. The answer was not more trees; it
was more kinds.

They are landmark KINDS and not node types deliberately. No verb in the
constitution reaches a landmark — it cannot be worked, fought, lit or
consumed — so a new kind adds **vocabulary** to the world without adding a
**rule** to it. That is the safe way to enrich a world that freezes on
founding.

## 11. Hauling: the eighteenth skill (v0.87)

The eighteenth skill. Its verb is `consign`; its XP is paid in **weight over
distance**; its goods are whatever a citizen puts in the container. Like
prayer, exploration and brewing it grants no power at all — the level is the
achievement, and a hauler at ninety-nine swings no harder than one at one.

What it adds to the world is not a reward. It is a **reason to be on the road
carrying something worth taking**, and a rule that says who may take it.

### 11a. The consignment

`player.consignment` is null, or:

```
{ from, route, leg, items }
```

`from` is the tag of the town where it was sealed. `route` is an ordered list
of one to three town tags, drawn at consign and never redrawn. `leg` counts
how many of them have been reached. `items` is the cargo: an array of at most
`INV_SLOTS` slots, holding `{item, qty}` or null, exactly as the pack does.

It is **a second container, not more pockets**. The pack is still twenty-eight
and is untouched by any of this. A citizen carrying a consignment carries two
sets of goods under two different laws, and the difference between them is the
whole design:

**Nothing in a consignment may enter the bank.** Not by `deposit`, not by any
other verb, not ever. The bank is `player.bank`, one map per citizen reachable
at any `bank` node in the world (§6g), which makes it a teleport for goods
exactly as `recall` is a teleport for the body. Every earlier draft of this
section failed on that one fact: as long as the cargo could be banked at one
end and withdrawn at the other, no rule could make the walk mandatory, and
without a mandatory walk there is nothing on the road to rob. The container is
the answer, and it is the only answer that worked.

Goods enter it exactly one way — `consign`, standing beside a store. Goods
leave it exactly two ways: **sold at a store in the route's last town**, or
**spilled where the bearer falls**.

### 11b. `consign`, `release`, `deliver`

`consign` and `release` are valid only beside a `store` node, which is the entire discipline.
Stores stand inside walled towns, so a citizen may take up a consignment or
put one down only somewhere safe. On the road, between the gates, the choice
has already been made and cannot be unmade.

`consign → {slots}` is valid when the citizen bears no consignment, stands
beside a store, and names at least one occupied slot. The named slots move
from the pack into the container. Then the route is drawn.

`release` is valid when the citizen bears a consignment and stands beside a
store, and returns the cargo to the pack, as many slots as will fit. What does
not fit stays in the container and the consignment stands. A citizen is never
made to destroy their own cargo to put it down.

`deliver → {slot}` sells one slot of the container, and is valid only beside a
store in the route's LAST town. It is a separate verb from `sell` rather than a
flag on it, because a container is not a pack and the two must never be
addressable by the same index: `sell {3}` and `deliver {3}` name different
goods, and a world where they could be confused would sell the wrong thing.

**An empty consignment lifts itself.** The moment the last slot empties — by
sale, by spill, by release — the container is null. This is not tidiness. A
citizen bearing an empty consignment would be attack-capable at no cost
whatsoever (§11d), and the entire honesty of this section rests on nobody
being able to become dangerous without also becoming worth robbing.

### 11c. The route is drawn, not chosen

```
route = draw( H(beacon(T) || playerId || "route"), towns \ {from} )
```

One, two or three towns, ordered, the origin excluded, by the drawing of lots
(§7 v0.38) exactly as survey markers are placed. The citizen does not pick
where they are going. Progress advances by standing beside the store of
`route[leg]`; at the last of them, and only there, the cargo may be sold.

**Why drawn and not chosen.** A citizen who picks their own destination picks
the nearest one, forever. On the fifth expanse's geometry the shortest pair of
stores is seventy-four tiles apart and the longest four hundred and forty, so
a free choice collapses the entire profession into a forty-four-second shuttle
between Anchor and Oxenford, which is neither a journey nor a risk. Drawn
routes span seventy-four to twelve hundred tiles, median five hundred and
seventy-five: three-quarters of an hour of walking at the far end.

**Re-consigning redraws, and that is left alone deliberately.** A citizen may
`release` and `consign` again and take a different route, and there is no fee,
no cooldown and no lock. It is not worth their time: because XP is linear in
distance and so is the walking, the rate is nearly flat across the whole
distribution — 0.97× at the first quartile, 1.03× at the longest hundredth.
The only spread comes from the fixed thirty intervals spent in town, and it
points the wrong way for a rerolling citizen: the shortest routes pay that
overhead most often and sit at 0.75×, the worst rate on the board. A merchant
rerolling for long routes gains at most two and a half per cent. The exploit
costs more than it returns, so the constitution does not need a rule against
it, and does not have one.

**The route is public**, because everything is. State is consensus state and
every window reads all of it; there is no such thing as a secret in this
world. A thief can see where a caravan is bound. This is correct and not a
concession — under the Flight Rule (§2b-i) an ambusher must already be
standing still when their mark walks past, and nobody can stand in the right
place without knowing where the road goes.

### 11d. What the container costs

While a citizen bears one:

1. **`attack_player` is valid against them anywhere, by any citizen who also
   bears one.** Not only in the Wilds. The Wilds is a rectangle where the law
   thins (§2g); a consignment is the same thinning, carried on a body, by
   consent, and it reaches wherever that body goes.
2. **On death the container spills where they fall** rather than burning, on
   the ordinary hundred-interval ground clock (§3.4). Without this, killing a
   hauler destroys the cargo and there is nothing to steal, only somebody to
   ruin.
3. **`recall` is invalid.** The road will not be skipped by anyone who profits
   from its length.
4. **The bank is closed** — `deposit` and `withdraw` both, not merely
   `deposit`. A hauler who could withdraw at the far end would consign at
   Cragfoot, walk to Anchor carrying nothing, draw twenty-eight plates out of
   the vault there and sell them, having risked nothing at all.
5. **The container itself is never bankable**, per §11a.

The first clause is what makes a thief. There is **no thieving skill and there
will not be one**: it could only be trained on other citizens, so on a quiet
night or in a thin year it would be untrainable, and the citizens who founded
early would hold a standing advantage nobody after them could ever close.
Killing already pays attack, strength, defence and hitpoints; the cargo is the
prize; and §10 refuses to rank citizens by their capacity for violence, which
a calling word reading *thief* would undo in the one place a citizen's name is
shown.

**So a thief is a hauler with different intentions.** To be able to attack a
caravan you must be carrying one, which means buying cargo, sealing it, and
standing at a chokepoint as the most attackable thing on the island. Predation
costs capital and exposure. There is no way to be dangerous here without being
worth robbing, and the world never asks which of the two you meant to be —
consistent with §8, which does not ask whether a citizen is human either.

### 11e. XP: weight over distance

```
xp = floor( tiles * slots * haul.perTileSlot * haul.mult[item] / 10000 )
```

`tiles` is the drawn route's total length, store to store, measured as
**chebyshev distance between store tiles** — exactly as survey XP is paid by
chebyshev to the anchor (§7c). A walk graph would be truer and cannot be
computed by every node every interval; this can, and the constant derived from
it came out the same to the digit either way. `slots` is how many of the container's slots held
goods at the moment of sale. `haul.perTileSlot` is in hundredths;
`haul.mult[item]` is in hundredths, one entry per known good.

All integer. **No transcendental appears anywhere in this section**, by the
same rule that binds terrain (§2m): `+ - * /` and `sqrt`, nothing else. An
earlier draft scaled the multiplier as `1 + log₂(price/base)`, which reads
beautifully and cannot be computed identically by two implementations. A table
of integers can. It is also more honest about what it is — a founding
decision, not a law of nature.

**The multiplier is capped at 3.00, and the cap is the point.** A citizen
hauling star-plates should have a reason to, and a citizen hauling grain
should still have a profession. Linear-in-price fails both ways: normalised to
the dearest good it puts grain at 0.01× and ore at 0.02×, which deletes bulk
hauling entirely, and normalised any other way it invites the trap §6k already
names — that the efficient path to a skill becomes acquiring and destroying
the most valuable gear in the world.

A worked table, at `perTileSlot = 23` on the fifth expanse, where six stores
make 510 drawn routes of one to three legs, mean 641 tiles, and a trip is that
plus about thirty intervals in town:

```
good           price   mult   xp/trip (full)   trips to 99   hours
logs               2   1.00            4,116         3,167   353.9
grain              4   1.23            5,068         2,572   287.4
ore                5   1.30            5,348         2,437   272.4
magic-stone       20   1.75            7,196         1,811   202.4
star-helm        270   2.61           10,752         1,212   135.5
star-sword       540   2.83           11,648         1,119   125.1
star-plate       900   3.00           12,376         1,053   117.7
```

**Those hours are for a citizen who BUYS their cargo.** One who gathers and
smiths it themselves pays for it twice: a pack of twenty-eight plates is a
thousand and thirty-six intervals of mining before it is a single step of
walking, which puts the self-sufficient plate hauler back at about three
hundred and twenty-five hours — beside the grain hauler at three hundred and
thirty. Production very nearly cancels the multiplier. A self-sufficient
citizen runs at between 1.00× and 1.35× a grain hauler whatever they carry,
and the peak is star-helm, mid-ladder, because helms are cheap to make against
what they pay.

So what the multiplier actually prices is **buying your cargo instead of
making it**. It is the first thing in this world that gold buys, and what it
buys is time, not power — which is the only kind of purchase §6s and §4c leave
room for.

**Half-empty containers pay half.** A seven-slot consignment is nearly ten
times slower than a full one. Capacity is the thing worth protecting, which is
what puts a caravan on the road with something on it.

### 11f. The constants live in the genesis

`genesis.haul = { perTileSlot, mult, legMin, legMax }`, following §7c exactly:
the *form* of the reward is constitutional, the *numbers* are a property of
the founded world. The fifth expanse founds itself with `perTileSlot: 23` and
`legMin: 1, legMax: 3`, derived from a haul-simulation of its own geometry — a
world half the size or twice it is expected to found itself with different
ones, from its own simulation, not from this table.

**This amends the genesis schema, which §3 declares EXACT.** A world carrying
`haul` is not the same founding as one without it, and cannot be: the key
changes the worldId, as §3 says any key does. This is a founding-level change
and wears it openly.

### 11g. What this does not do

- **It pays no gold.** Every draft that did died the same way. A store's purse
  holds twelve hundred and recovers two an interval (§6l), so the island mints
  a fixed sum per hour no matter how many citizens haul. Simulation put a lone
  merchant at 43,666 coin an hour and sixteen merchants at 2,974 each — below
  what a citizen earns *standing at a store selling nothing but what the purse
  refills*. A reward drawn from a rationed pool dilutes to nothing at exactly
  the population where the profession would otherwise come alive. XP is not
  rationed. Mine does not reduce yours.
- **It does not touch prices, purses, or the money supply.** Keepers,
  alchemy, stalls and beginners are all exactly as they were.
- **It adds no hunter or escort role.** One may arise — a caravan carrying a
  thousand intervals of somebody's mining is the moment a guard is worth
  hiring — but it needs no rule. Two citizens can arrange it on the board and
  settle in goods.
- **It gates nothing on the clock.** §8 holds: a bot's patience is infinite,
  so patience is never the tax. A hauling bot pays in the same walked ticks a
  human does, and that is the whole cost either way.

### 11h. What the building of it found

**A rule spelled out five times is five rules.** Where one citizen may strike
another lived, longhand, in `attackp`'s validity and the `special`'s, in the
`attackp` resolver, in the special blow, and in the swing itself. Adding the
consignment to the first of them alone produced the worst kind of failure this
world can have: a blow accepted by the gate and then silently dropped by the
resolver, valid and invisible at once, with nothing anywhere to read. Fixing
four of the five left the mirror of the same bug in the fifth -- the special
was refused at its gate while its resolver would have allowed it -- and that
one was found only because somebody asked whether specials reach a hauler.
It is now ONE predicate, `mayStrike`, and the five sites call it. Any future
condition on PvP goes there and nowhere else.

**The same disease was already in the stalls.** §6ao's rule that a stall lines
the road (`stallsLineRoads`) was enforced only where the raising COMPLETES, and
not in `raise_market`'s validity — so a citizen stood twenty intervals in the
wrong place, was refused nothing, and got nothing. One predicate,
`stallGroundOk`, now answers for both gates. Two gates that must agree.

**A container is state, so the validator must know its shape.** `consignment`
was added to the Player and to nothing else, and twelve unrelated tests fell
over at once on `unknown player field`. `validateState` holds an allowlist and
a shape check for every field a citizen has, deliberately, and a new one is not
finished until it is in both.

**The multiplier could not be a logarithm.** The shape wanted is logarithmic in
price — it keeps the middle of the ladder alive instead of leaving a choice
between grain and plates. §2m binds this world to `+ - * /` and `sqrt`, and
§3.1 requires XP to be an integer. So it is a table of thirty integers in
hundredths, which is exact, and which is also more honest about being a
founding decision rather than a law of nature.

### 11i. What is still open

1. **`worthRank` and the spilled container.** A consignment spills as ground
   items on the hundred-interval clock. Twenty-eight star-plates landing at
   once is the largest single heap this world can produce, and §5b-ii's default
   pickup order was written for smaller piles.
2. **The four storeless towns.** Millbrook, Thornbury, Hollybarrow and Norwick
   hold no `store` node, so no route can end there and the drawing has six
   destinations rather than ten. Thornbury's `kind` is literally `market`.
   Giving them stores would raise the island's mint from twelve coin an
   interval to twenty — which is what §6l already claims it is.
3. **The standing ceiling.** An eighteenth skill changes the maximum standing
   in §10 and every threshold derived from it, including
   `waystoneStandingReq`.
4. **A hauler's calling.** §10 has no word for this trade yet. *Hauler* is the
   obvious one and costs nothing, being display-only.

## 10. Out of scope for v0.1

Sharding, combat, hidden information, name release/transfer,
multi-item trades, distributed beacon. The v0.x series exists to prove one thing:
**independent implementations replaying the same inputs agree on every
byte of the world: and anyone can join it, leave it, or fork it.**
