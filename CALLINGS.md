# §5k — the calling, the ceiling, and what a mastery is worth

## The correction this began with

An earlier note called `p.calling !== undefined` a mastery cap. **It is not.**
It caps how many callings a citizen may HOLD; it restrains no training at all.
A calling was a bonus and nothing else:

```
your own calling's work        xp x 1.5
a sibling calling, same trade  xp x 0.5
any of the other eight trades  xp x 1.0   <- unchanged
```

So an unsworn citizen could master all nine at full rate and lose only the
bonus. The engine said as much at line 5996: *"Callings are not sworn yet (§5k,
coming) ... the hook exists so the day swearing lands is a change to ONE
function."* The hook was there. The policy was not.

## Why a ceiling, and not a longer curve

Where the grind is scripted — and this world ships a window for writing the
script — **curve length measures uptime, not commitment.** Doubling it buys six
months of waiting for the same writ. A ceiling is the one limit a script cannot
out-wait, and so it is the only real limit this world has.

```
unsworn            nothing passes 50. Depth is what swearing buys.
sworn, your own    no ceiling at all: masters pass 100 and compete.
sworn, any other   70. Enough to round out and to fight with;
                   not enough to be a second career.
```

Chosen against the real cost of a level, measured from the engine's own gather
formula — a roll out of 65,536, a node retiring about one pull in four, and the
walk to the next one. At a star axe on ironbark: **50 is ~2h, 70 is ~22h, 100 is
~1,800h.** Eight other trades at 70 is about a tenth of one mastery, which is
rounding out. At 80 it would have been a quarter, which is a second career.

`SWEAR_LEVEL` moves 30 → 50. Thirty was six minutes of chopping.

## One gate

Eighteen places wrote `p.skills.x += y` directly — prowess on a blow landed,
marksmanship on a shot, sorcery on a sigil spent. A ceiling in `awardXp` alone
would have left the **combat** skills uncapped, which is precisely the wrong
hole. All nineteen gains now pass `gainXp`, which clamps to `xpCeiling`. Both
are exported: a window wants to say *"you cannot pass seventy here"* without
knowing why, so the rule is a query rather than a number to copy.

## A mastery is a yield — and a calling is NOT a rate

The ceiling alone was not an economy. Measured against the same formula,
**thirty levels of mastery bought an eight per cent rate** — while a better axe
bought thirteen times that. So on ordinary logs there was no reason to buy from
a master rather than chop your own, and only **twelve of the world's 148 gates**
sit above seventy.

Denial was never the missing piece: `NODE_GATE` already refuses the gather
itself, not merely the experience. What was missing is that being a master
barely made you faster.

A calling briefly multiplied the gather rate 3/2, on exactly that reasoning.
**It was reverted, and the argument against it is the better one:**

* **Keepers buy nothing** (§6l). Every price in this world is set by a citizen
  selling to a citizen, so more supply is undercut supply: the price falls until
  the advantage is competed away, and all that is left is cheaper logs.
* **A rate scales automation.** This world ships a window for writing the
  citizen, and a writ collects a multiplier better than a person does because it
  never stops. A rate bonus therefore rewards most exactly the play the ceiling
  was built to blunt — an argument that has nothing to do with prices and is
  worse than the price one.

So there is **one lever, not two**:

* **A master takes two where anyone else takes one.** Yield rather than rate,
  because yield shows in the world instead of on the clock, it sits behind 1,800
  hours and a ceiling nobody else may pass, and it is the only thing in the
  world that only a master has.

A master out-produces a capped seventy by **2.16x** on yield alone. Whether that
is enough is a tuning question and there are no players yet: ship one lever,
watch a real market, add the second only if masters turn out not to matter.

## §5w — teaching, and a mark only finishing can mint

A master may take an unsworn citizen on; the swearing that follows may name
them, and the mark goes into the record for ever. It buys **no rate, no level
and no ceiling**. The reward is entirely reputational — and it is the one kind
of reputation that cannot be faked, because it is a signature in a replayable
log rather than a claim.

```
teach(to)               a master takes a citizen on. Consent is a signed input
                        of its own, mirroring offer_trade: a master cannot be
                        volunteered.
swear(calling, attester) the student may name a master whose apprenticeship is
                        live and who is standing here.
part(who)               either party may end it. NOT `release` — the
                        consignment already owns that word, and a second case
                        with the same label would have shadowed it silently.
```

**The mark is minted by finishing, and only by finishing.** A master cannot
collect lineages by taking on forty people and walking away: each one holds one
of `APPRENTICE_SLOTS` (three) until they swear, and only the swearing writes
`sworn_by` and raises the master's count. Taking somebody on writes nothing but
the tick it happened.

The apprenticeship does not so much end as **turn into the permanent thing**:
the swearing closes it in the same breath that mints the lineage. Which means
the only clock needed is for the student who drifts away and never comes back —
`APPRENTICE_LAPSE`, twelve hours of intervals, after which the slot is free.

Two rulings worth writing down:

* **The same trade, not the same calling.** A master forester may raise a
  fletcher. The trade is what is taught; which calling within it they choose is
  theirs.
* **The lineage carries the calling, not only the person.** *Raised by Verity,
  forester.* It survives Verity changing name, and it says what was passed on.

### If the apprentice swears to something else entirely

Three ways it can go, and one of them leaked.

* **Attested, to another trade** — refused. A forester cannot vouch for a miner;
  the validator requires the attester share the student's trade.
* **Attested, same trade** — the mark is minted and the slot freed.
* **Unattested, to any trade** — allowed, and this is the one that leaked. It
  used to leave the master holding a slot occupied by somebody now sworn, who
  `teach` would refuse for ever, until the twelve-hour lapse ran out.

A swearing now ends **every** apprenticeship it was in, whoever attested it and
whatever trade it was to. An apprentice is by definition unsworn — `teach`
refuses anyone with a calling — so the moment they swear, none of it can still
be live.

The ruling behind it: **an apprentice promised nothing.** The master consented
to teach, not to be owed. Walking off to another trade is entirely their right,
and it costs them only the mark they would have had.

And **unattested swearing stays legal**. The first forester has nobody to attest
them, and anyone playing at an empty hour would otherwise be stuck. The mark is
the reward; its absence is not a wall.

### The grades moved with it

`apprentice` used to mean *below fifty*, which is a number, and everyone was one
by default — a word that applies to everybody describes nobody.

```
newcomer     unsworn, unattached          what everyone starts as
apprentice   unsworn, but taken on        a state another citizen consented to
journeyman   sworn
master       at MASTERY in their trade
```

`gradeOf(state, p)` is the engine's, and exported, so no window invents the
words. `check-engine-teaching.mjs` drives all of it, including that a forgotten
apprenticeship lapses back to newcomer.

## §5x — the ritual: you are not a master until you have made one

Reaching `MASTERY` makes a citizen **eligible**. What admits them is having
raised somebody to their own swearing — the old guild rule, where a journeyman
stayed a journeyman until the craft accepted a piece of work laid before it.
Here the piece of work is a person.

Why this rather than a quest:

* **It is uniform.** Nine trades, no hand-authored tasks, nothing to keep in
  step with the tables. Five of the nine have no deep node and no dear recipe to
  build a quest around at all — measured, not assumed.
* **It cannot be ground.** It needs another citizen to reach fifty and swear,
  which is theirs to do and not yours.
* **It is done once, ever**, so there is no point automating it: writing a
  script for a thing you do once costs more than doing it.
* **It makes the endgame social by construction.** A master of Interval is not a
  person with nine hundred hours; it is a line of people.

An alt can do it — two hours to fifty and a swearing before yourself — and that
is the correct price rather than a hole. It is also **legible**: the lineage is
signed and public, and a master whose only apprentice appears nowhere else has
told everybody what they did.

**Nothing new is stored.** `raised` already exists and is already minted only by
finishing, so proof is *derived*: `isProven(p)` is `raised >= 1`. No citizen can
be handed it, and there is no field to migrate.

## §5y — what the tail past a hundred is for

Your own trade has no ceiling and `XP_TABLE` runs to 171, so there is no
completion state; but the levels did nothing except count. Measured from the
gather formula: **105 is a month past mastery, 110 is three, 120 is sixteen.**
So the milestones are 100 / 105 / 110, and nothing lives past 110 where nobody
would see it.

They must not multiply throughput — the same argument that killed the calling
rate, and it is stronger here, because past-mastery play is the most automated
play there is. So **the tail buys capacity for other people**: one apprentice
slot at each milestone. A very deep master is visibly a school.

Teaching itself stays at `MASTERY` rather than moving up. Gating it at 110 would
starve the early world of teachers entirely, and the mechanic would never get
used. Note that `teach` checks MASTERY **xp**, not the master *grade*, so there
is no deadlock: reach a hundred, take somebody on, raise them, and the craft
admits you.

## §5z — what a mastery is worth, in every trade

§5k paid the four gathering trades a double yield and left the other five with
nothing to double: mourning has no seam, prowess no recipe, and marksmanship,
sorcery and wayfaring produce no stack of things. A mastery that pays in four
trades and pays a word in five is not a mastery.

| trade | what a mastery pays |
|---|---|
| woodcraft, earthcraft, shorecraft, hearthcraft | two where others take one |
| marksmanship | an arrow that hits is an arrow you keep |
| sorcery | three stones press two sigils |
| mourning | an offering counts double |
| prowess | the special is ready a quarter sooner |
| wayfaring | a consignment is not spilled on death |

Every one passes the test that killed the calling rate: **no multipliers on
throughput, and nothing that merely rewards uptime.** Where a trade has an
output a master gets two of it; where it does not, the boon is rhythm or
protection.

Three judgements worth recording:

* **Not two arrows, and not dual wielding.** Both are multipliers, and a
  multiplier in a fight is a balance problem before it is a reward: it changes
  what a master does to another citizen rather than what a master is worth.
  Arrow recovery is a *material* saving — the same shape as the double yield,
  and bounded, since you can never end a fight with more than you began with.
* **Not "a master casts without spending the sigil."** It has a trap: sorcery's
  experience *comes from* spending sigils (`XP_SPEND_SIGIL`), so a master who
  stopped spending would stop earning and be quietly frozen out of the tail past
  a hundred that §5y just gave a purpose. Pressing two keeps the spending, the
  earning, and the shape.
* **Wayfaring's is a protection, not a reward**, because its output is arriving
  rather than a stack. Death already costs the walk back; for a runner it also
  cost the load, which is the one trade where dying undoes hours of *somebody
  else's* goods.

All six go through one `masterOf(p, skill)`, which asks all three questions:
sworn to that trade, at `MASTERY`, and admitted by §5x. **A boon nobody was
admitted for is a number rewarding itself.**

### And the guide had to be reorganised for it

With the boon, the ceiling, five seams and three callings above them, a skill
page ran to twelve rows before the first unlock — of which nine are visible, so
the unlocks were simply off the bottom. A citizen cannot read what they cannot
see. Seams and callings now sit behind a row each; the unlocks, which are what
the guide is *for*, come back up where they can be seen.

## What is NOT done

* **The rest of the mastery boons.** The double yield is the first thing only a
  master has. One per trade remains: a smelt without fuel, cooking that never
  burns, plots that ripen in two thirds the ticks, arrows recovered on a hit.
  Each is a line at a site that already exists.
* **A second thing for the milestones.** One apprentice slot each is thin. The
  non-throughput candidates worth considering: permanence (a fire a master
  kindles never goes out, a span they lay never rots), and authority over the
  map (found a settlement that joins the served `settlements` table, so every
  window forever draws a place with your name on it).
* **The live pillar has not been booted since the merge.** It refounds correctly
  — changing `engine.js` changes its hash, so a world founded under the old
  build cannot be continued — and it got as far as writing a new checkpoint
  before the sandbox ran out of time. `node serve.mjs`, wait for *"Interval is
  live"*, then `curl localhost:8787/api/tables` is the first thing to run.

## Checks

`check-engine-ceiling.mjs` drives the engine's own gate, asserts the rule for
unsworn / own-trade / other-trade citizens, names the combat skills explicitly,
greps the file to prove no route bypasses it, and holds the economy numbers.
`check-window-calling.mjs` (and the hill and writ copies) hold the window side:
offered where it can happen, never twice, never one keystroke away, and never a
calling name written into a window.

## What the ceiling did to standing and the hood

`standingOf` sums nine true levels, and two things were tuned against a range
that §5k shrank.

**`HOOD_STANDING` was 1200 and had become unreachable.** The widest citizen the
rules now allow stands at 8&times;70 plus their own trade — about 660. Worse than
the arithmetic: the hood was explicitly the *generalist's* peer to the cape
(*"the cape says you went far in one thing; the hood says you went
everywhere"*), and §5k abolished the generalist. It is **600** now: every trade
taken as far as the ceiling allows, about forty-eight hours. The rest of §6ax is
untouched — the threshold was always only a sybil toll and a pace.

**Standing is no longer the generalists' board.** Once sworn, 560 of it is a
constant, so it reads as one trade's level plus a fixed number. Kept because the
waystones and the hood are tuned against it, not because it ranks anything the
nine boards do not. The comment claiming otherwise is corrected.

**The hiscores gain a `raised` board**, and the feed carries `raised`, `grade`
and `sworn_by` per citizen. It is the only number here that measures a thing a
citizen did for somebody else, it is minted only by an apprentice finishing, and
every entry is backed by signatures anybody may replay.

**Callings do not need a board of their own** — they already have one, as a
filter under the trade, and the reasoning in `site/hiscores.html` still holds:
seventeen equal buttons is a wall, and a berserker and a warden take opposite
bargains that one column measures neither of. What changed is that the filter
now partitions the deep end of every trade board cleanly, because above fifty
every citizen is sworn.
