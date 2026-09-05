<!-- 137 sections drafted by spec-stubs.mjs from engine.js.
     Every one of them is DERIVED, NOT RATIFIED: the words are the engine's
     comment, not a decision that this is law. Edit, cut, or promote them.
     Re-run `node spec-stubs.mjs --write` to refresh the ones still untouched. -->

## §1c. The Interval Is A Second, And It Is The One Number That Was Inherited

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:57` by `spec-stubs.mjs`.

§1c: THE INTERVAL IS A SECOND, AND IT IS THE ONE NUMBER THAT WAS INHERITED.

Six hundred milliseconds was RuneScape's tick and it arrived here with no
argument attached -- every other number in this file has one. A second is
chosen rather than copied, and it buys two things.

EVERY OTHER TIME IN THIS FILE WAS WRITTEN AT 600ms. Comments arguing in
minutes and seconds -- "a swing is 2.4 seconds", "a log is 8.7 seconds", "it
kills a master in four minutes" -- were all measured at the old interval and
now understate by 1.67x. The ones stating a RULE a citizen acts on (the
Brand, the gullet, the toll, an attendance window) have been corrected in
place; the ones arguing a TUNING have not, because both sides of every such
comparison moved together and the argument is unchanged. See §4b-ii, which
says the same of every figure given in hours.

It makes the clock legible. An interval is a second, so the Brand is
twenty-five minutes and a duel is thirty-five seconds and a watchfire is five
days, and a citizen can do that arithmetic in their head. At 600ms every
duration was a number you had to convert before you could feel it, and a
world meant to outlive the person who wrote it should keep time in units a
human holds.

And it makes the game turn-based in the honest sense. A blow, a step, a
mouthful: one a second is a pace somebody THINKS at rather than reacts at,
which is what this world is -- a MUD's deliberation in a shared persistent
map, not an action game that happens to be networked.

It was not taken further. At two seconds a duel is seventy seconds of
thirty-five decisions and a special's recovery is sixteen seconds of standing
still unable to act, which is not tension but dead air; the recoveries tuned
in §6af assume a pause a citizen can sit through. A second is the slowest
interval that still holds attention.

Everything in this file counts INTERVALS, not milliseconds; only the
scheduler converts. The constants that had a wall-clock claim written into
them are marked below -- some were rescaled to keep the claim, and some kept
their count because the thing they measure should stretch with the world.

## §2b-iv. You Cannot Be Paid Twice For One Interval

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:1615` by `spec-stubs.mjs`. Amends §2b.

§6am: YOU CANNOT BE PAID TWICE FOR ONE INTERVAL.

A gather is an ACTION: it runs on by itself, interval after interval, and
costs no input once given. An instant deed costs the input. So a citizen who
set a pickaxe going and then transmuted, fletched, smithed, cooked, buried,
or pressed a sigil was earning TWO skills at full rate from one interval,
for as long as the rock lasted -- and every one of these left the action
running. Only drinking, mending and the stilling stopped it, and those three
are the ones that teach nothing.

The line is what a deed TEACHES. A deed that pays experience ends whatever
else the citizen had going; eating, drinking, picking a thing up, banking
and trading do not, because they pay nothing and a citizen should be able to
eat without losing their tree.
§2b-iv: THE MARK AND THE ANSWER, IN ONE PLACE.

`brandedUntil` was assigned in exactly one line of this engine, inside
`attackp`. The `special` handler deals damage, kills, spills packs and ends
fights -- and never branded, and carried no copy of the retaliation that
makes a struck citizen strike back. Measured: identical kill speed, no mark,
and no damage taken, because the victim never answered.

Every §2b enforcement hung off that one line, so a band that only ever sent
`special` was invisible to the law: no keeper refused them, no stone was
closed, prayer still covered them, and nobody was licensed to hunt them.
"A raiding party marks itself in public and cannot deny having been one" was
true of one verb out of two.

So the mark and the answer live here, and BOTH paths call it. A future third
way of hurting somebody will call it too, or it will be obvious in review
that it did not.

## §2b-v. A Hood Outlives Its Bearer

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:6261` by `spec-stubs.mjs`. Amends §2b.

§6ax: A HOOD OUTLIVES ITS BEARER.

Death is the deepest sink in this world and stays so: every death still
annihilates a pack, or spills one that rots in a hundred ticks. A hood is
the single exception, and it is an exception because it is the only object
whose worth is a fact about the past. Burning one deletes a piece of the
world's record, permanently, with no rule anywhere able to mint another --
and it would be deleted most often by an ordinary accident on an ordinary
evening, which is the worst possible way to lose a thing like that.

So it falls where its bearer fell, and it does NOT expire (§2b-v gives
ground a hundred ticks; MAX_TIME is that rule declining to apply). What
this buys is not preservation but a GRAVE MARKER: a hood lying in the deep
Wilds years later says whose it was and how far they got, and nobody wrote
it there. It is the only record in the world placed by history rather than
by a generator.

Anyone may take it. That is deliberate: a hood is never destroyed, only
TRANSFERRED, and since a citizen crosses the mark once they can never have
another. Your name walks away on somebody else's head. The whole penalty
sits in the register the object was made for, and costs no power at all.

## §4b-ii. The Interval Is A Second, And It Is The One Number That Was Inherited

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:69` by `spec-stubs.mjs`. Amends §4b.

§1c: THE INTERVAL IS A SECOND, AND IT IS THE ONE NUMBER THAT WAS INHERITED.

Six hundred milliseconds was RuneScape's tick and it arrived here with no
argument attached -- every other number in this file has one. A second is
chosen rather than copied, and it buys two things.

EVERY OTHER TIME IN THIS FILE WAS WRITTEN AT 600ms. Comments arguing in
minutes and seconds -- "a swing is 2.4 seconds", "a log is 8.7 seconds", "it
kills a master in four minutes" -- were all measured at the old interval and
now understate by 1.67x. The ones stating a RULE a citizen acts on (the
Brand, the gullet, the toll, an attendance window) have been corrected in
place; the ones arguing a TUNING have not, because both sides of every such
comparison moved together and the argument is unchanged. See §4b-ii, which
says the same of every figure given in hours.

It makes the clock legible. An interval is a second, so the Brand is
twenty-five minutes and a duel is thirty-five seconds and a watchfire is five
days, and a citizen can do that arithmetic in their head. At 600ms every
duration was a number you had to convert before you could feel it, and a
world meant to outlive the person who wrote it should keep time in units a
human holds.

And it makes the game turn-based in the honest sense. A blow, a step, a
mouthful: one a second is a pace somebody THINKS at rather than reacts at,
which is what this world is -- a MUD's deliberation in a shared persistent
map, not an action game that happens to be networked.

It was not taken further. At two seconds a duel is seventy seconds of
thirty-five decisions and a special's recovery is sixteen seconds of standing
still unable to act, which is not tension but dead air; the recoveries tuned
in §6af assume a pause a citizen can sit through. A second is the slowest
interval that still holds attention.

Everything in this file counts INTERVALS, not milliseconds; only the
scheduler converts. The constants that had a wall-clock claim written into
them are marked below -- some were rescaled to keep the claim, and some kept
their count because the thing they measure should stretch with the world.

## §5k-ii. What The Berserker Gets For The Sixteen

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:3268` by `spec-stubs.mjs`. Amends §5k.

§7cm: `desperate` rides in hitOf so it reaches EVERY path -- citizens,
beasts and the yard butt alike -- rather than being added at each call site
the way `bare` is. (The bare-blade's bonus is applied at the PvP and dummy
sites only, which is why a bare-blade is an ordinary blade against a wolf.
A weapon whose whole argument is about dying would be a lie if it forgot
the things most likely to kill you.)
§5r: WHAT THE BERSERKER GETS FOR THE SIXTEEN.

§5k gave the berserker -16 flesh and the warden +16 and stopped there, which
left the berserker paying a price for nothing at all. A bargain with only one
side is not a bargain, it is a trap for whoever reads the flavour and not the
table.

The arm and the guard, then, at the two choke points every melee blow already
passes through:

  berserker  -16 flesh, +BERSERK_HIT to every blow landed
  warden     +16 flesh, +WARD_GUARD to what an attacker must beat
  fighter     neither, and 64 -- the one who takes no bargain

It goes in `hitOf` and in the guard rather than at the call sites because
there are four of those and one of these. A bonus applied in three places out
of four is worse than none: it would be a weapon that hits harder against
mobs than against citizens, discovered by whoever tried it and nobody else.
§5r-ii: A BARGAIN HAS TWO SIDES, AND THE FIRST DRAFT ONLY HAD ONE.

As first written the warden took +16 flesh AND +12 guard for nothing, while
the berserker paid -16 flesh for +2 damage. Modelled at mastery in star plate
that is not three bargains, it is a ladder: warden beat fighter 0.70, fighter
beat berserker 0.84, warden beat berserker 0.59. The berserker was simply the
worst thing a citizen could swear, and the warden simply the best.

The error was not the size of the gap. It was that ONE side of the table was
paying. A quarter of your life is worth about a third more damage, not a
seventh; and a guard bonus on top of a flesh bonus is two upsides wearing one
name.

Now every calling gives something up. The spread is also halved -- sixteen
rather than thirty-two -- because the balance never needed it: what needed
fixing was the trade, not the distance.

(Those were 56/64/72 and +3/-2/+4. Both ends were doubled afterwards --
§5k-ii for the berserker, §5k-iii for the warden -- so the table now reads:)

  berserker  48 flesh, +6 to every blow
  fighter    64, and nothing either way
  warden     80 flesh, -4 to every blow, +6 to what an attacker must beat

Measured at mastery, star plate, star-sword: every pairing inside |z|<2 over
a hundred and twenty duels, and the three fights feel nothing alike. The
axis is the EXECUTE WINDOW rather than the win rate -- against the largest
special in the world a berserker is at 96% of their flesh, a fighter 72%, a
warden 58%. A warden is the only citizen a haymaker cannot end from half
health; a berserker is the only one it can end from full.
§5k-ii: AND A BERSERKER HAS TO BE WORTH BEING.

Three hit for eight flesh was a real trade and too quiet a one to feel like
anything. Measured at mastery, the three callings killed a fighter in eleven,
thirteen and sixteen intervals -- close enough that nobody would describe
them differently. Six for sixteen widens it to twelve, sixteen and seventeen,
and win rates stay level (57:53 and 57:53 over a hundred duels): a shorter
fight cuts both ways, so damage up and flesh down cancel in a duel.

What does NOT cancel is the execute window, and that is where the fragility
lives. Against the largest special burst in the world:

  berserker  48 flesh -> a 46-burst is  96% of them
  fighter    64 flesh ->                72%
  warden     72 flesh ->                64%

A berserker at full health can be ended by one good special. Nobody else can.
They also win closer: sixteen flesh left on an average win against a
fighter's twenty-one. Powerful and fragile, in the numbers rather than the
name.

## §5k-iii. What The Berserker Gets For The Sixteen

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:3268` by `spec-stubs.mjs`. Amends §5k.

§7cm: `desperate` rides in hitOf so it reaches EVERY path -- citizens,
beasts and the yard butt alike -- rather than being added at each call site
the way `bare` is. (The bare-blade's bonus is applied at the PvP and dummy
sites only, which is why a bare-blade is an ordinary blade against a wolf.
A weapon whose whole argument is about dying would be a lie if it forgot
the things most likely to kill you.)
§5r: WHAT THE BERSERKER GETS FOR THE SIXTEEN.

§5k gave the berserker -16 flesh and the warden +16 and stopped there, which
left the berserker paying a price for nothing at all. A bargain with only one
side is not a bargain, it is a trap for whoever reads the flavour and not the
table.

The arm and the guard, then, at the two choke points every melee blow already
passes through:

  berserker  -16 flesh, +BERSERK_HIT to every blow landed
  warden     +16 flesh, +WARD_GUARD to what an attacker must beat
  fighter     neither, and 64 -- the one who takes no bargain

It goes in `hitOf` and in the guard rather than at the call sites because
there are four of those and one of these. A bonus applied in three places out
of four is worse than none: it would be a weapon that hits harder against
mobs than against citizens, discovered by whoever tried it and nobody else.
§5r-ii: A BARGAIN HAS TWO SIDES, AND THE FIRST DRAFT ONLY HAD ONE.

As first written the warden took +16 flesh AND +12 guard for nothing, while
the berserker paid -16 flesh for +2 damage. Modelled at mastery in star plate
that is not three bargains, it is a ladder: warden beat fighter 0.70, fighter
beat berserker 0.84, warden beat berserker 0.59. The berserker was simply the
worst thing a citizen could swear, and the warden simply the best.

The error was not the size of the gap. It was that ONE side of the table was
paying. A quarter of your life is worth about a third more damage, not a
seventh; and a guard bonus on top of a flesh bonus is two upsides wearing one
name.

Now every calling gives something up. The spread is also halved -- sixteen
rather than thirty-two -- because the balance never needed it: what needed
fixing was the trade, not the distance.

(Those were 56/64/72 and +3/-2/+4. Both ends were doubled afterwards --
§5k-ii for the berserker, §5k-iii for the warden -- so the table now reads:)

  berserker  48 flesh, +6 to every blow
  fighter    64, and nothing either way
  warden     80 flesh, -4 to every blow, +6 to what an attacker must beat

Measured at mastery, star plate, star-sword: every pairing inside |z|<2 over
a hundred and twenty duels, and the three fights feel nothing alike. The
axis is the EXECUTE WINDOW rather than the win rate -- against the largest
special in the world a berserker is at 96% of their flesh, a fighter 72%, a
warden 58%. A warden is the only citizen a haymaker cannot end from half
health; a berserker is the only one it can end from full.
§5k-ii: AND A BERSERKER HAS TO BE WORTH BEING.

Three hit for eight flesh was a real trade and too quiet a one to feel like
anything. Measured at mastery, the three callings killed a fighter in eleven,
thirteen and sixteen intervals -- close enough that nobody would describe
them differently. Six for sixteen widens it to twelve, sixteen and seventeen,
and win rates stay level (57:53 and 57:53 over a hundred duels): a shorter
fight cuts both ways, so damage up and flesh down cancel in a duel.

What does NOT cancel is the execute window, and that is where the fragility
lives. Against the largest special burst in the world:

  berserker  48 flesh -> a 46-burst is  96% of them
  fighter    64 flesh ->                72%
  warden     72 flesh ->                64%

A berserker at full health can be ended by one good special. Nobody else can.
They also win closer: sixteen flesh left on an average win against a
fighter's twenty-one. Powerful and fragile, in the numbers rather than the
name.

## §5n. Woodwright

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:6322` by `spec-stubs.mjs`.

§5n: WOODWRIGHT. The axe, the bench and the fire were one trade split
three ways: you fell a tree to shape it or to burn it, and nobody fells
one for the sake of holding logs. 'forester', 'fletcher' and 'firekeeper'
are parked until §5k, where they come back as things a citizen swears.

## §5o. ore has no use unmelted, and nobody digs for the sake of holding rock.

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:6327` by `spec-stubs.mjs`.

§5o: SMITH. The pick and the anvil were one trade split at the pithead --
ore has no use unmelted, and nobody digs for the sake of holding rock. The
word for the whole of it is the one the anvil already had. 'miner' is
parked until §5k.

## §5p. Craft --

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:6345` by `spec-stubs.mjs`.

§5p: WAYFARER. Exploration and hauling were the same trade counted twice:
one measures ground never seen, the other weight moved across ground you
have. Both are the road, and this world already says the road is real.

'waycraft' and 'tradecraft' were both wrong. Neither is a CRAFT -- nothing
is made -- and 'tradecraft' is an English word already spoken for: it means
espionage, and hauling is not trading. The word for going out and coming
back is the one that has always meant it.

CARTOGRAPHER and RUNNER are parked with the rest until §5k, where the
mapper and the carrier become two things a road-worker may swear rather
than two numbers that happened to rise separately.

## §5w. Apprentice

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:6504` by `spec-stubs.mjs`.

§5w: TEACHING. A master may take a citizen on, and the swearing that follows
carries the master's mark for ever.

APPRENTICE_SLOTS is small on purpose. A master with three apprentices is
making a commitment; a master with forty is running a mill, and the word
stops meaning attention. APPRENTICE_LAPSE is the only clock this needs: a
student who finishes FREES THEIR OWN SLOT by swearing, so the timer exists
solely for the one who drifts away and never comes back.
§5y: WHAT THE TAIL PAST A HUNDRED IS FOR.

Your own trade has no ceiling and XP_TABLE runs to 171, so there is no
completion state — but the levels did nothing except count. Measured from the
gather formula, 105 is a month past mastery, 110 is three, 120 is sixteen. So
milestones live at 105 and 110; anything at 120 is decoration for people who
will never see it.

They must not multiply throughput — the same argument that killed the calling
rate: a rate scales automation, and past-mastery play is the most automated
play there is. So the tail buys CAPACITY FOR OTHER PEOPLE instead. A very deep
master is visibly a school.

## §5x. The Grades, And Why 'apprentice' Moved

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:6543` by `spec-stubs.mjs`.

§5w: THE GRADES, AND WHY 'APPRENTICE' MOVED.

Apprentice used to mean "below fifty", which is a number, and everyone was
one by default — a word that applies to everybody describes nobody. It now
means SOMEBODY TOOK YOU ON: a state another citizen consented to, and one
they are spending a slot on. What everyone starts as is a newcomer.

  newcomer    unsworn, unattached
  apprentice  unsworn, but taken on by a master
  journeyman  sworn
  master      at MASTERY in the trade they swore to
§5x: THE RITUAL. YOU ARE NOT A MASTER UNTIL YOU HAVE MADE ONE.

Reaching MASTERY makes a citizen ELIGIBLE. What makes them a master is having
raised somebody to their own swearing — the old guild rule, where a
journeyman stayed a journeyman until the craft admitted them, and admission
was a piece of work laid before it. Here the piece of work is a person.

Why this and not a quest:

  · It is UNIFORM. Nine trades, no hand-authored tasks, nothing to keep in
    step with the tables. Five of the nine have no deep node and no dear
    recipe to build a quest around at all.
  · It cannot be ground. It needs another citizen to reach fifty and swear,
    which is theirs to do and not yours.
  · It is done ONCE, ever, so there is no point automating it: writing a
    script for a thing you do once costs more than doing it.
  · It makes the endgame social by construction. A master of Interval is not
    a person with nine hundred hours; it is a line of people.

An alt can do it — two hours to fifty and a swearing before yourself — and
that is the correct price rather than a hole. It is also LEGIBLE: the
lineage is signed and public, and a master whose only apprentice appears
nowhere else has told everybody what they did.

Nothing new is stored. `raised` already exists and is already minted only by
finishing, so proof is derived, and no citizen can be given it.

## §5y. Apprentice

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:6512` by `spec-stubs.mjs`.

§5w: TEACHING. A master may take a citizen on, and the swearing that follows
carries the master's mark for ever.

APPRENTICE_SLOTS is small on purpose. A master with three apprentices is
making a commitment; a master with forty is running a mill, and the word
stops meaning attention. APPRENTICE_LAPSE is the only clock this needs: a
student who finishes FREES THEIR OWN SLOT by swearing, so the timer exists
solely for the one who drifts away and never comes back.
§5y: WHAT THE TAIL PAST A HUNDRED IS FOR.

Your own trade has no ceiling and XP_TABLE runs to 171, so there is no
completion state — but the levels did nothing except count. Measured from the
gather formula, 105 is a month past mastery, 110 is three, 120 is sixteen. So
milestones live at 105 and 110; anything at 120 is decoration for people who
will never see it.

They must not multiply throughput — the same argument that killed the calling
rate: a rate scales automation, and past-mastery play is the most automated
play there is. So the tail buys CAPACITY FOR OTHER PEOPLE instead. A very deep
master is visibly a school.

## §5z. Integers over integers, like every other rate here, so two peers canno

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:6500` by `spec-stubs.mjs`.

§5z: and for the trade with nothing to double, the arm comes back sooner.
Integers over integers, like every other rate here, so two peers cannot
disagree about a fraction.

## §6af-ii. The Cost

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:14511` by `spec-stubs.mjs`. Amends §6af.

THE COST: the arm is spent for this cycle AND the next
§6af-ii: THE COST, and it must be the cost the VALIDATOR quoted.

The validator checks the arm against `state.tick`; this runs after
`s.tick = state.tick + 1`, so writing `s.tick + every` charged
every + 1. A special quietly cost an interval more than the rule
said, and the extra interval refused a legitimate second blow in a
way indistinguishable from lag -- exactly the failure §6b names for
the old hardcoded bow reach.
§6af: THE COST -- this cycle and the next, which is what makes the
special exactly neutral over time and a burst in the moment. Written
against the validator's tick, not the advanced one (defect 1.3).

It is also what stops `now` chaining: the arm is spent INTO THE
FUTURE, so a second special cannot follow. One interruption, then
the full price -- which is what §6af always said and what the pool
quietly undid.
`now` is gated on `lastSwing <= tick`, not on the full cadence, so
its recovery must be written ABSOLUTELY. Netting the cadence out of
it -- as every other special requires -- let the maul fire twice as
often as its own rule allowed: 208% of neutral, measured.

## §6af-iii. A Round A Blow, Not A Round A Burst

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:14238` by `spec-stubs.mjs`. Amends §6af.

§6df: A ROUND A BLOW, NOT A ROUND A BURST.

This spent ONE arrow and then ran the blow loop, so a horn-bow flurry
put six shafts into somebody for the price of one and the handgonne
fired both barrels off a single load. The comment below still says a
special "costs TWO ordinary blows" and `flurry` "pays two blows back"
-- which was true when a flurry WAS two blows. §6af-iii raised it to
six and lengthened the recovery to match, correctly, for the damage;
nobody came back for the ammunition.

The result was backwards from what a special is for. A burst is meant
to cost more and pay it back in timing; this one cost SIX TIMES LESS
per point of damage than the weapon's ordinary shot, so an archer had
no reason ever to loose a plain arrow. A weapon whose special is
strictly cheaper has no moment, and choosing the moment is the whole
of §6af.

§6av's "both barrels are one report" governs the NOISE and the beacon,
not the load: two barrels are two loads, and a handgonne's shot is
iron and gunpowder both.

## §6af-iv. A Burst Is A Compression, And The Pause Is Its Price

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:14349` by `spec-stubs.mjs`. Amends §6af.

§6af-iii: A BURST IS A COMPRESSION, AND THE PAUSE IS ITS PRICE.

`twice` gave two blows for two intervals of arm: neutral, but a burst
of twelve per cent of a health bar, which is a rounding error and not
a moment. Blow COUNT and RECOVERY are now both read from the table and
move together, so a bigger burst buys a longer hole and the damage
over time never changes.

Measured: burst-per-recovery-interval lands on each weapon's own
ordinary damage rate, which is what neutrality MEANS. No special can
be stronger than another; the ordering only mirrors the weapon table,
so balance stays in one place.
§6af-iv: AND THE HEAVY WEAPON COMMITS HARDER.

At a shared recovery the burst is dps x recovery, so the DAGGER --
best damage rate of anything carrying a special -- owned the biggest
burst, while the maul, whose single blow is the largest in the world
at seventeen, had the smallest. Backwards. The maul now buys a rarer,
heavier commitment instead: eight blows for twenty-four intervals of
arm, the largest burst anybody can throw and the longest hole to
stand in afterwards. Neutral all the same.

AND THE COUNT IS SET AGAINST THE COMBO, NOT THE SPECIAL ALONE. `now`
is the one special that can INTERRUPT -- it is gated on a spent arm
rather than a recovered one -- so an ordinary blow lands and the
special drops on top of it the very next interval. Measuring the
special by itself misses the whole point of the weapon. Measured as
the pair: eight blows put 89% of a health bar into two intervals,
which is a one-shot wearing a gamble's clothing. Five puts 70% there,
so there is a line to hold above and a real fight below it. A dagger
cannot do this at all -- `twice` waits for the arm, so its ordinary
blow and its special can never share a moment.

## §6af-v. Style Shapes The Blow, Not Its Size

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:3106` by `spec-stubs.mjs`. Amends §6af.

§6as-iv: STYLE SHAPES THE BLOW, NOT ITS SIZE.

A symmetric inset on the damage range: the MEAN is untouched, so no style is
stronger and none is a trap, and the SPREAD moves, so they are differently
USEFUL. Measured on a star-sword: aim lands for 4-11 with a spread of 2.3,
force for 1-14 with 4.1, and damage per swing is 3.74 against 3.61 -- the
same, within noise.

It deliberately does NOT trade against the accuracy roll, which was the first
attempt: accuracy is clamped at 250/256, so against a low-defence target
extra accuracy buys nothing while lost damage costs everything. Measured,
that version had force beating even by 25% against defence 1 and losing to
it against plate. A trade against a ceiling is lopsided at one end and dead
at the other.

Variance only survives where there are few rolls to average it, so this is a
dial for BURSTS, not for attrition -- see §6af-v.

## §6af-vi. And A Haymaker May Not Be A One-shot

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:2730` by `spec-stubs.mjs`. Amends §6af.

§6af-vi: AND A HAYMAKER MAY NOT BE A ONE-SHOT.

`bite: 2` was set when a star-maul's hit was 7. At 13 the same multiplier
makes a per-blow maximum of 46, and `now` is the special that can land ON
TOP of an ordinary blow -- so the pair reached 104 against a citizen with
99, measured, in about one combo in twelve hundred. A weapon that removes a
full bar from full health in two intervals is not a gamble, it is a coin
that sometimes deletes somebody.

Bite and recovery move TOGETHER or neutrality breaks: at 1.6 alone the maul
fell to 77% of its own ordinary damage. The pair is 1.5 and six.

AND IT IS THE SAME PAIR ON BOTH MAULS. They were briefly 1.6/7 and 1.4/6 --
not because a great-maul swings differently, but because each was lowered
only until it stopped one-shotting and then left there. `hit` already says
one is bigger than the other (sixteen against thirteen); a second number
saying it again is two rules for one weapon class, and a reader would go
looking for the distinction it draws. There is none.

## §6af-vii. And The Bursts Were Tuned Against Ninety-nine Flesh

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:2715` by `spec-stubs.mjs`. Amends §6af.

§6af-vii: AND THE BURSTS WERE TUNED AGAINST NINETY-NINE FLESH.

Every blow count and recovery in this table was set when a citizen carried
ninety-nine hitpoints and they grew with a skill. Flesh is FLAT SIXTY-FOUR
now (§5j) and no skill feeds it, so the same numbers became one-shots:
measured, four of the seven specials could take a citizen from full health
to nothing in a single interval, and the handgonne did it in all three
styles. A burst that always kills is not a gamble, it is a delete button.

Scaled to the new flesh, the worst case across every weapon and style now
falls between sixty-three and eighty per cent of a bar -- enough to end a
fight somebody was already losing, never enough to end one they were not.

## §6ah. would leave the fletch refused here and the change invisible --

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:10628` by `spec-stubs.mjs`.

§6ah: and a sigil in the binding. Relaxing the executor alone
would leave the fletch refused here and the change invisible --
the validator/executor pairing this file has been bitten by before.

## §6ai. What A Dragon Is Worth To The People Who Killed It

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:3755` by `spec-stubs.mjs`.

§6ai: WHAT A DRAGON IS WORTH TO THE PEOPLE WHO KILLED IT.

Four hundred and twenty hitpoints, twenty-eight a blow, and it
dropped two bones and an ore -- less than a skeleton knight. It
is not a fight one citizen wins, and everything it gave was a
bow that ONE of them could carry and that goes home in twelve
hours. There was nothing for the others to divide.

Six magic-stone and a set of dragon-bones. The stones are the
Wilds' own currency, so a party splits something every trade in
the world wants; the bones are the only ones worth more than a
goblin's, which gives the longest road in the world -- prayer,
fourteen hundred hours -- a reason to come here.

## §6aj. Unmaking At Range

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:3903` by `spec-stubs.mjs`.

§6aj: UNMAKING AT RANGE, which is denial and not theft.

A citizen falls and their pack spills; the one who felled them walks over to
take it. Five tiles away, an alchemist with a heartwood stave burns a sigil
and the pile is simply GONE -- the plate, the sword, the stones. Nobody gets
them. The caster least of all: no coin comes of it, because the thing was
unmade rather than sold, and unmaking somebody else's spoil should never be
a living.

A sigil is three magic-stone out of the Wilds, sixty gold of materials that
no keeper will sell, against the seven gold a beginner's goblin drops. It
costs nine times what it would deny them, so it cannot be used to torment
newcomers -- and against a star-plate on the ground it is very much worth
doing, which is the fight where it belongs.

§6bn: THE INSTRUMENT MOVED. It was the heartwood stave, and the heartwood
stave is the ALCHEMY PACE staff -- two intervals against three, the whole
reason to walk to fletching ninety. So the fastest tool for the day's work
also carried the one verb that destroys another citizen's goods, and every
alchemy master was armed with it whether or not they ever wanted to be.
Nobody chose `unmake`; it arrived with the tool they were carrying anyway.

The wand shows the shape this world already had for it: a pure verb item,
no cadence at all, worth six coins. `unmake` belongs on that side of the
line, so it now lives on the goo staff -- which is a verb item and nothing
else, and which comes off the great-spider rather than off a bench.

The heartwood stave keeps its job. Two intervals against three is still the
whole of what its four hundred and ninety-five gold buys.

## §6ak. A Tree Does Not End At One Log

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:716` by `spec-stubs.mjs`.

§6ak: A TREE DOES NOT END AT ONE LOG.

A node gave one thing and slept, so two citizens at one tree was a RACE:
the first took the log and the second found it asleep. A resource nobody can
share is a resource that pushes people apart, in a world whose best moments
are the ones where they meet.

And it made gathering mostly walking. The nearest other tree is 2.8 tiles
off, so at woodcutting 57 with a bronze axe a log was 2.3 intervals of
cutting and 2.8 of shuffling to the next trunk -- fifty-five per cent of the
work was travel between things that are identical.

So a node yields until a roll retires it: one success in four. No new field
on the node, nothing to migrate, and the same beacon that decides every
other chance in this world decides this one. A tree gives four logs on
average, sometimes one, sometimes nine -- which is how a tree behaves.

## §6al. A Citizen's Stall

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:1344` by `spec-stubs.mjs`.

---------------------------------------------------------------------------
A CITIZEN'S STALL
---------------------------------------------------------------------------
Every economic rule in this constitution ends the same way: the only
sensible buyer is another citizen. Magic-stone at twenty when a plate wants
seven. Dragon-bones at five hundred when they are worth six thousand. A
keeper's purse holding twelve hundred against a master smith's thirty-five
million. The world is built to force citizens to trade with each other --
and until now that required both of them awake at the same moment.

A stall a citizen raises sells while they sleep.

STOCK IS ONE-WAY, and that single rule is what keeps it a shop. You may put
things in; the only ways out are a SALE or a SPILL. Never a withdrawal.
Without it a stall in the Wilds is a vault in the Wilds -- mine twelve
stones, walk five tiles, empty the pack, mine twelve more -- and the
six thousand trips out of the Wilds that the whole star economy rests on
would simply evaporate.

THE PRICE IS NOT THE WORLD'S BUSINESS. There is no cap on the ask. What a
thing is worth between two citizens is the one number in this world that no
rule should touch; a ceiling would be the constitution having an opinion
about a market it exists to make possible.

It never blocks a tile, so no run of stalls can wall anybody in or out.
§7cp: A BUILT THING IS BUILT OF BOARDS.

The stall cost SIXTEEN LOGS and eight ore -- twenty-four slots of a pack of
twenty-eight -- and it still did after the sawpit and planks were added. The
toll at Millbrook takes planks and nothing else in the world does, so the
whole middle of that chain existed for one bridge-keeper.

A log is a tree you dragged. A board is a thing somebody made. Everything
this world BUILDS should be built of the second, and the sawpit is where the
first becomes it.

The arithmetic is deliberate: sixteen logs sawn is THIRTY-TWO planks, so the
stall costs the same wood and MORE WORK -- fell sixteen, walk to a sawpit,
saw sixteen, then build. What it costs less of is CARRYING, because planks
stack and logs do not: twenty-four slots becomes two. That is the right trade
for a thing you build once and stand beside for hours.
§7da: IRON ORE, BECAUSE `ore` CANNOT BE MINED.

The old `rock` seam that yielded `ore` was retired and replaced by `iron-rock`
yielding `iron-ore` -- and the stall's recipe was never moved with it. There
are ZERO rock nodes on the island, so a stall cost eight of a thing no pickaxe
can produce. It survives only as a rare mob drop and a waymark find, which is
not a supply, it is a lottery.

A recipe whose material was retired is a recipe nobody can complete, and it
had been that way since the seam table was rewritten. This is the same fault
as the room list that outlived its town (7bd) and the buildLogs key that
outlived planks (7cp): a table changed, and the things that read it did not.

## §6am. The Middle Of The Road Gets A Ground Of Its Own

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:583` by `spec-stubs.mjs`.

§6am (v6): THE MIDDLE OF THE ROAD GETS A GROUND OF ITS OWN.

Two tiers only -- bronze at one, star and the master yields at the far end
-- left the whole middle of every gathering skill as featureless slope: a
place a citizen passed through in an afternoon and never stood in. The
fix is not a better log from the same trunk (that has no PLACE); it is a
new stand of trees, a new seam, a new shoal, set deeper in each country
than the baseline, so the middle of the game is somewhere you WALK TO.

These are the exact sibling of `magic-rock`: their own node, their own
item, gated by a level and rewarded by a tool -- only the level is the
middle (thirty-five) where the magic-rock's is the end (seventy). A world
that founds itself on a generator which never seats them is unchanged: no
v1-v5 world contains one, so the yield, the gate and the tool below are
never reached in it.

## §6an. The Deep Broth

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:2559` by `spec-stubs.mjs`.

§6an: THE DEEP BROTH, and why it is eight rather than ten.

A deep fish already brewed -- into ordinary broth, five, the same as any
fish out of the shallows, so a master fisher's catch was worth no more in a
pot than a beginner's. This is the same shape as woodcutting ninety giving
heartwood where a lesser axe gives logs.

EIGHT, and not ten, because the cooked deep fish must stay worth cooking:
ten in one slot against eight that stacks is a real choice, and ten against
ten is not. The ladder stays evenly spaced -- ale four, broth five, a cooked
fish six, a deep broth eight, a cooked deep fish ten -- with no gap wide
enough to make the rungs beneath it pointless.

AND IT IS NOT DOUBLED. A brewer of ninety draws two draughts from a pot, and
two eights would be sixteen against the cooked fish's ten, which would end
cooking as a trade. A deep fish makes ONE draught; there is no second in it.

## §6ao. The Seam Gives Ore, Not A Finished Bar

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:821` by `spec-stubs.mjs`.

§6ao (v6): the clean mining chain -- iron (baseline) -> coal (mid) -> steel.
v6 mines IRON where v5 mined generic 'ore'; the baseline gear is bronze
still (bronze is iron worked simply here), and STEEL is iron quenched with
coal. v6 places iron-rock, never the old rock, so v5's ore is untouched.
§7p: THE SEAM GIVES ORE, NOT A FINISHED BAR. It gave `iron` -- metal,
ready for the anvil -- so the deepest supply chain in the world was also
the shortest: strike the rock, walk to the forge, done. Ore now, and the
furnace at Cragfoot turns two of it and a coal into the bar.
§7p: THE SEAM GIVES IRON ORE. It gave `iron` -- a finished bar, ready for
the anvil -- so the deepest chain in the world was also the shortest.

The first cut of this pointed it at `ore`, which was WRONG and worth
recording: `ore` is the generic of the first founding, what the plain
`rock` gives, from when there was one tier and it was bronze. Iron ore is
not that, and a seam that gave the retired generic would have made bronze
stock and iron stock the same substance.

## §6ap. Armour Is Not A Subtraction

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:4886` by `spec-stubs.mjs`.

§6ap: ARMOUR IS NOT A SUBTRACTION.

SOAK took a flat two a piece off every blow, against a maxHit that never
passes about fourteen. That halved damage at ninety-nine and approached
immunity below it, and it made a star-clad duel a minute of uninterrupted
swinging for single-digit hits: "2, 2, 2". A miss is dramatic; a two is not.

Armour now makes you HARDER TO HIT rather than harder to hurt. The same
duel lasts about as long -- sixty seconds against the sixty-six it took
before -- but it reads as "miss, miss, THIRTEEN", which is a fight.

It also repairs the maul without touching the maul: its whole problem was
that low accuracy was punished twice, once in the roll and again by a soak
its slow cadence could not out-pace.
§7l: a full star suit is helm 16 + plate 24 = 40, which is the ceiling the
bare-blade measures against.

THE CURVE IS NOT A LINE, and the reason is a measurement. A flat
floor((40 - armour) / 4) gave +10 naked and +5 in iron, and the duels said
the middle beat both ends: naked won 40% against a star-clad star-sword,
and the SAME blade over an iron suit won 45%. Half the bonus plus real
protection was the optimum, so a weapon meant to ask "will you strip?"
was really asking "will you wear medium?" -- a duller question, and not the
one it was built for.

Squaring it puts the whole bonus in the last few points of armour. A citizen
in nothing keeps ten; one in a leather cap has already lost a third of it;
iron keeps two. The choice is now the one the design promised: bare, or not.

  armour   0    8   16   20   25   30   40
  bonus   10    6    4    2    1    0    0

## §6ap-ii. const Tr = hitChance256(rLvl, stats.def, weaponOf(p)?.acc ?? 0, 0); //

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:16178` by `spec-stubs.mjs`.

        const Tr = hitChance256(rLvl, stats.def, weaponOf(p)?.acc ?? 0, 0); // §6ap-ii

## §6aq. Repealed

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:5017` by `spec-stubs.mjs`.

§6aq (REPEALED, v0.87): STEEL IS NOT TAXED, AND NEVER NEEDED TO BE.

Armour carried a price for three revisions: first an interval added to every
swing, then a step every other interval, then that narrowed to the Wilds. The
argument was always that armour which only helps is a checklist rather than a
choice -- everybody wears the best they own and going without is a handicap.

The argument was answered by a rule this world already had. THE FLIGHT RULE
(§2b-i): everyone walks at the same speed and no reach-1 weapon lands on
somebody who is leaving, so a clad citizen CANNOT MAKE ANYBODY FIGHT THEM.
Armour only ever decides fights that were agreed to. It was never able to
dominate, so there was nothing to tax, and each version of the tax was a
second bolt on a door the first one already held.

The measurements say the same. With the tax and without it, the standing duel
orders identically -- star full 73/96 against 78/96, and every loadout in the
same place -- so three rules, a state field and two off-by-one bugs bought a
difference that does not appear in the numbers. What they did buy was a
citizen who could be run down for wearing a helmet.

The armour VALUES stay. They belong to the roll (§6ap), where a suit makes
you harder to hit rather than harder to hurt, and that fix stands on its own.

## §6as. Hauling Is The Eighteenth Skill

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:498` by `spec-stubs.mjs`.

§11: HAULING IS THE EIGHTEENTH SKILL (v0.87).

It grants no power -- like prayer, exploration and brewing, the level IS the
achievement. What it adds is a REASON to be on the road carrying something
worth taking, and a rule saying who may take it. See §11.
§6as: STRENGTH IS ITS OWN SKILL (v0.86).

One skill drove both how often you land and how hard, so there was no build
space at all: every fighter in this world was the same fighter, further
along. A separate strength is what makes ninety-nine strength at
seventy-five attack a genuinely different citizen from the reverse, and it
is the thing that lets somebody choose what kind of fighter to be.

It is a constitutional change -- a new skill, a new rules hash, a new
founding -- which is why it comes last of the combat work and not first.

ATTACK decides the roll. STRENGTH decides the blow. Ranged keeps both, for
itself, because a bow's draw is the same muscle as its aim; splitting it
would need a second ranged skill nobody asked for.
6bz/6ca: FIVE SLOTS. `offhand` for a shield, `legs` for gold and nothing
else. Every layer reads this one list -- the wield validator, the state shape
check at 4242 which demands the keys match EXACTLY, and the hood sweep -- so
adding a slot anywhere but here would make a state that runs and will not
import. A citizen founded before this rule has three keys and must gain two
empty ones; see the migration below.

## §6as-ii. taught attack alone, so a fighter who favoured it never raised the

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:14412` by `spec-stubs.mjs`.

§6as-ii: split exactly as an ordinary melee blow splits. A special
taught attack alone, so a fighter who favoured it never raised the
number their own special scores from.

## §6as-iii. Where The Lesson Goes Is The Citizen's Choice, Not The Weapon's

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:5212` by `spec-stubs.mjs`.

§6as-iii: WHERE THE LESSON GOES IS THE CITIZEN'S CHOICE, NOT THE WEAPON'S.

Splitting a blow evenly is a sane default and a poor ceiling: measured at a
matched experience budget, roughly sixty attack to ninety strength is the
best melee anybody can bring against a lightly-armoured citizen (3.42 a
tick against 3.07 for an even build), while about eighty to seventy is what
beats a star-clad one (1.36 against 1.27). Two different characters, and
the even split reaches neither.

Routing by WEAPON was the obvious alternative and it is a trap: the natural
strength weapon is the maul, second-worst damage in the world, so a citizen
would grind hundreds of hours with a weapon they do not want in order to
fight with one they do. It also binds two questions that are not the same
question -- what I swing, and what I am becoming -- and it has no honest
answer for the flail, the chain or the wand.

## §6as-iv. Style Shapes The Blow, Not Its Size

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:3090` by `spec-stubs.mjs`.

§6as-iv: STYLE SHAPES THE BLOW, NOT ITS SIZE.

A symmetric inset on the damage range: the MEAN is untouched, so no style is
stronger and none is a trap, and the SPREAD moves, so they are differently
USEFUL. Measured on a star-sword: aim lands for 4-11 with a spread of 2.3,
force for 1-14 with 4.1, and damage per swing is 3.74 against 3.61 -- the
same, within noise.

It deliberately does NOT trade against the accuracy roll, which was the first
attempt: accuracy is clamped at 250/256, so against a low-defence target
extra accuracy buys nothing while lost damage costs everything. Measured,
that version had force beating even by 25% against defence 1 and losing to
it against plate. A trade against a ceiling is lopsided at one end and dead
at the other.

Variance only survives where there are few rolls to average it, so this is a
dial for BURSTS, not for attrition -- see §6af-v.

## §6as-v. Style Is The Swing, Not The School

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:3331` by `spec-stubs.mjs`.

§5s: STYLE IS THE SWING, NOT THE SCHOOL.

`style` used to decide which of attack, strength or defence a blow taught.
§5j made prowess one number and left the field inert -- validated, carried on
every action, and deciding nothing. A field that means nothing is worse than
no field: it reads like a choice and answers like a placebo.

It is the per-swing lever now, against the calling's permanent one. AIM buys
accuracy with damage, FORCE buys damage with accuracy, EVEN buys neither.
A citizen may change it every blow; a calling is said once and never again.
§6as-v: EIGHT, AND EACH STYLE WINS SOMEWHERE.

Measured at true mastery (100, not the 92 an old table made of it) against a
bare target, twenty-five hundred intervals a side:

  opponent prowess 1     aim 3.58   even 3.79   force 4.05   <- force
  opponent prowess 50    aim 2.85   even 2.94   force 2.92   <- even
  opponent prowess 100   aim 2.13   even 1.94   force 1.82   <- aim

Which is the whole design: force against a soft target where accuracy is
already near its ceiling and buys nothing, aim against a hard one where it
buys the most, and even in the middle where neither does. The spreads are
thirteen, three and seventeen per cent -- enough that the choice pays, little
enough that a wrong one is not a lost fight.

It was briefly twelve, on a measurement taken before the special bug was
found and sampled at only two defence levels, which missed the crossover
entirely and read as "force always wins". At twelve aim leads by thirty-one
per cent at mastery; at sixteen, forty-seven; at twenty, fifty-seven. The
trade only stays a trade at eight.

## §6au. A Maul Swings At The Same Speed As Everything Else

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:2683` by `spec-stubs.mjs`.

§6au: A MAUL SWINGS AT THE SAME SPEED AS EVERYTHING ELSE.

`every: 3` was flavour the arithmetic could not pay for. A blow is
1 + level/10 + hit, and the level term is shared, so a slower weapon can
only buy back its lost interval through `hit` -- which is FLAT, and
therefore distorts low levels far more than high ones. At ninety-nine the
maul landed 3.62 a swing against a dagger's 3.83 and took half again as
long to do it: 1.21 a tick against 1.92. Measured over sixty duels with
neither citizen using a special, that is 5:55. Not situational -- broken.

At `every: 2` with the same hit and the same poor accuracy it is 30:30
against the dagger, and it keeps every bit of its character: the largest
ordinary blow in the world at seventeen against the dagger's twelve, the
worst chance of landing it at forty per cent against fifty-nine, and the
only special that can drop on top of an ordinary swing. It is the swingy
weapon, not the slow one. The alternative -- `hit: 16` to make `every: 3`
pay -- was measured too, and it hands a level-forty citizen 1.69 a tick
where the honest build gets 1.22. A flat number is a low-level number.

## §6av. road -- past a beginner, short of the fifty that straps on starmetal.

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:995` by `spec-stubs.mjs`.

§6am (v6): the mid arms and armour, worn at the middle of the fighting
road -- past a beginner, short of the fifty that straps on starmetal.

## §6av-ii. carried on the creature that heard the report, so the extra reach

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:3183` by `spec-stubs.mjs`.

§6av-ii: `heard` is what lets it come further than it can SEE. It is
carried on the creature that heard the report, so the extra reach
belongs to the gunshot and to nothing else.

## §6ax. What A Vault Will Not Take

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:1956` by `spec-stubs.mjs`.

§7.3a: WHAT A VAULT WILL NOT TAKE, in one place.

Two items are refused and for opposite reasons -- the dragonbow so its
bearer cannot opt out of being hunted (§6w), the wayfarer's hood so its
bearer cannot opt out of being seen (§6ax). Both rules already existed and
both lived in a DIFFERENT function from each other: the bow was checked in
the gate and the hood in the resolver, so `mayDo` and `apply` disagreed
about what a deposit would do. Adding a bulk deposit with two more copies
of that disagreement is exactly the §11h fault, so they are one predicate
now and every caller asks the same question.

## §6ba. The Cinder-crown

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:3775` by `spec-stubs.mjs`.

§6da: THE CINDER-CROWN, one dragon in thirty-two. Counted
per citizen like every rare drop (the Reading Rule, §6ba),
so it cannot be timed by holding the dragon at a point of
life and reading the beacon -- and it falls into the same
shared pile as the stones, to be fought over at the pickup.

## §6bb. A Wider Lot, Because One Byte Cannot Say 'rare'

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:7158` by `spec-stubs.mjs`.

§6bb: A WIDER LOT, BECAUSE ONE BYTE CANNOT SAY 'RARE'.

`roll` reads a single byte, so the rarest a per-interval event can be is one
in two hundred and fifty-six -- about two and a half minutes. Everything in
this world that is genuinely scarce is scarce by DROP CHANCE out of 65,536
(the old-chain is two), and a gathered thing had no way to be.

Two bytes of the same hash, BIG-ENDIAN, which is written here in words as
well as in code because it is the whole of the compatibility surface: a
second implementation that reads them the other way round agrees with this
one on nothing. High byte first, low byte second, no arithmetic but a shift
and an or -- integers only, per 2m, and nothing a floating point unit could
disagree about.

`roll` is untouched. Every existing lot in this world draws the same byte it
has always drawn, from the same hash; this reads one more byte of it under a
different tag.

## §6bk. One Bone In

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:15096` by `spec-stubs.mjs`.

§6bk: ONE BONE IN, one lesson -- so take ONE, not the slot. This
nulled the whole slot, which is right for a bone (they do not stack)
and silently destroys the rest of any stack that ever does. The
comment above already said "one bone in": the code took whatever was
there. Spending exactly what the yield is paid for costs nothing
today and cannot become a hole later.

## §6br. undrafted

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:3413` by `spec-stubs.mjs`.

§6br: one siren in sixty-four, counted per citizen like every other rarity.

## §6bs. this is the first thing it pulls out that a smith BURNS rather than be

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:814` by `spec-stubs.mjs`.

§6bs: the vent. Mining's late game was a rarer metal and a deeper one;
this is the first thing it pulls out that a smith BURNS rather than beats.

## §6bt. The Third Great Arm

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:936` by `spec-stubs.mjs`.

§6bt: seventy, where every gathering skill already has its mastery tool.
§7ap: THE THIRD GREAT ARM. The great tier had a sword for attack and a
crossbow for ranged, and nothing for strength -- which was invisible while
mauls were gated on attack (§7ao) and glaring the moment they were not. A
citizen who trains strength alone now has a ladder that reaches the top of
the world like everybody else's.

## §6bu. Brimstone Catches, And The Fire Never Lands The Last Blow

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:1844` by `spec-stubs.mjs`.

§6bu: BRIMSTONE CATCHES, AND THE FIRE NEVER LANDS THE LAST BLOW.

A landed blow from a `burns` weapon sets the target alight for BURN_TICKS
intervals; while lit they take one point every BURN_EVERY. It does not
stack -- a second blow REFRESHES it, exactly as a root does not chain --
so the whole of it is two points a window. Felt, never decisive.

TWO RULES MAKE IT CONSTITUTIONAL, and without either it could not exist:

  IT CANNOT KILL. Burn floors at one hitpoint, on a citizen and on a beast
  alike. §2b-i promises no one can be run down, and a fire that finishes
  somebody four intervals after they broke away and fled has run them down
  -- by the clock rather than on foot, which is worse, because there is no
  answer to it. Now there is: you always survive the fire, and whoever
  wants you dead must catch you. It also disposes of a whole class of bug,
  since a burn that killed a beast would have no striker to give the drop
  to.

  IT DOES NOT TOUCH A BEAST THAT MENDS. This is arithmetic, not flavour.
  §6ab's hard promise is that ONE citizen can never take the great-spider:
  the best sustained output in the world is the chain's 5.74 a interval
  against the web's six, a deficit of 0.26. A quarter-point of burn erases
  it almost exactly. Gated on the `mends` PROPERTY rather than the spider's
  name, so it is a rule and not an exception -- and so that any beast a
  later founding gives a web is covered by the same sentence.

## §6bv. undrafted

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:3415` by `spec-stubs.mjs`.

§6bv: one incursion in thirty-two. They are events, not a farm.

## §6bv-ii. And What It Teaches Follows What Came Apart

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:4039` by `spec-stubs.mjs`.

§6bv-ii: AND WHAT IT TEACHES FOLLOWS WHAT CAME APART.

The lesson was flat -- twenty for a log and twenty for a star plate -- and
the note below the cast argued for it: value-scaling made "acquire and
destroy the most valuable gear in the world" the efficient road to magic,
which is a fighter's road to what was then the anti-combat skill.

Two things have changed. Sorcery is not the anti-combat skill any more: the
barrow-work (§7ce) is offensive, and it TAKES alch away, so the caster who
wants to burn things and the caster who wants to unmake them are already two
different citizens. And the objection turns out not to survive arithmetic.
Measured, with the cost of OBTAINING the input counted:

  chop a log, melt it            8,000 xp per hour of labour
  mine 400 magic-stone,
    forge a plate, melt it         675 xp per hour of labour

A star plate is four hundred and fifty times a log in price and about four
hundred times a log in labour, so scaling the reward against price very
nearly cancels against the cost of getting one. The two roads land within
two per cent of each other for a citizen's own hours, and melting plate is
twelve times WORSE per hour the world spends. Nobody strips the Wilds to
learn a spell; they chop logs, exactly as before.

What it buys is a real ITEM SINK at the top of the economy. Starmetal put
into a plate can now leave the world again, which gives smiths ongoing
demand for the same reason the handgonne's bursting does (§6av). A citizen
who wants to unmake something magnificent may, and it is a choice rather
than a mistake.

THE GOLD IS UNTOUCHED. ALCH_PAYS is four whatever came apart, and it stays
four: one integer sets the money supply of this world (§6bv) and this is not
that integer. Only the lesson follows the loss.
(three quarters, the same share ALCH_SHARE/ALCH_OF names below -- written
out here because that pair is declared further down and this is only ever
called from the apply path, long after both exist.)

## §6by. More Than One

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:2850` by `spec-stubs.mjs`.

§7cn: THE BARB. The first weapon in this world that strikes MORE THAN ONE
THING.

`flurry` hits twice at the same target and that was as close as anything
came. Meanwhile §6by deliberately built content out of CROWDS -- the risen
the King calls up, an incursion, and the carrion-crows that are weak alone
and never alone -- and the arsenal had no answer to numbers at all, only
to armour (the flail), to shields (the great arms) and to plate at reach
(the siphon).

It is pure geometry. It applies no state, which is why it is a weapon and
not a spell: the six words the barrow book already owns -- anchor, mend,
still, wither, taking, rot -- have between them claimed every status worth
having, and a seventh wearing a haft would be `flurry` and `volley` all
over again.

The domain selects itself, in the star-maul special's manner, with no
exception clause anywhere: worthless on the dragon, worthless on the
gibbet-dead behind their rail, worse than a sword in a duel, and the only
thing anybody wants when an incursion has fixed on a neighbour.

## §6bz. Two Hands Or One, And What The Off Hand Holds

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:4990` by `spec-stubs.mjs`.

6bz: TWO HANDS OR ONE, AND WHAT THE OFF HAND HOLDS.

The star-sword and the star-maul sit in the same wield band, and measured
against an ARMOURED citizen they were already 87 intervals against 89 -- the
maul's -12 accuracy costing exactly what its +5 damage buys. That balance
was not designed and it is remarkably tight, so anything added here has to
preserve it.

A shield alone does not: any shield at all tips a coin-flip duel decisively
to the one-handed line. So the two arrive together. Two-handed arms gain six
to their blow; one-handed arms may carry a shield, which DIVIDES what lands.
At a star shield's three-quarters the duel returns to 87 against 86.

A DIVISOR, NOT A BLOCK AND NOT MORE ARMOUR. More armour feeds the same
hitChance curve that already saturates, so a shield would be a number nobody
could feel. A block would need its own roll and would raise the question of
whether a blocked blow is a MISS -- which is what teaches defence, so it
would quietly retune a skill. A divisor touches neither the roll nor the
miss: what a defender learns and what an attacker learns are exactly what
they were, and the shield only changes what arrives.
§7cm: the bone spear is on the list because it is a spear. §6bz's trade is
the point -- reach and weight are bought with the off hand -- and a weapon
that gave a two-tile haft AND a star shield would be answering a question
nobody asked it.

## §6cg. The Records --

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:11981` by `spec-stubs.mjs`.

§7dk: THE RECORDS -- the one prize on this island that never runs out.

A FIRST IS SPENT THE DAY IT IS WON. There are thirty-eight of them and the
founding cohort will have every one inside a year; a citizen who arrives in
year ten walks into a world where every permanent mark has been taken. That
is the shape of a world that can only ever be finished.

A RECORD CANNOT BE SPENT. Somebody always walks it faster, and the board is
as alive in year twenty as on the first day -- at no cost in content, in a
world that has frozen its content on purpose.

AND THIS WORLD CAN PROVE ONE. Deterministic ticks, no wall clock, signed
inputs, a certified history: "fastest from fifty to ninety-nine in fishing,
in intervals" is a VERIFIABLE fact here in a way it is in no other game ever
made. Every other leaderboard in the world is a claim its operator asks you
to believe. This one is arithmetic anybody can redo.

It also repairs something. `master:<skill>` fires only on CROSSING ninety-
nine, so a citizen imported at ninety-nine arrives above the line, never
crosses it, and in any refounded world containing a master that first is
permanently unwinnable. A record is per-world, measured from a floor a
crossing citizen is already above -- so `began` must NOT ride in
GENESIS.imported, exactly as `firsts` does not. A clock that started in a
world which no longer exists is not a clock.

BOUNDED, and that is not negotiable. Three per board, NINE trades, two
boards each: fifty-four entries, fixed for ever, however many citizens ever
live here. (This said eighteen skills and a hundred and eight entries,
written when it was true and never touched again after §5m merged them --
the same fault as §6cg's 'all sixteen'. The CODE was always right; it
counts SKILLS.) §5's whole argument is that state which grows with
participation eventually stops the world -- "not because anyone was playing
but because everyone once did". Three is also the naming stone's number,
and for the same reason: a monument that keeps no history is only an
advertisement.

TWO BOARDS, because supplied and unaided are different disciplines and one
board that mixes them measures neither. Neither is the cheat. Being supplied
is what an island with an economy is FOR.

## §6ch. By Nodeid --

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:11748` by `spec-stubs.mjs`.

reference: every matching node, BY NODEID -- the same canonical order the
indexed path below uses.

v0.81 sorted the indexed path and left this one in Object.entries
enumeration order, so the two halves of the same function answered
differently the moment two matching nodes stood beside one citizen. That
is the exact fault v0.81 was written to fix, surviving in the branch it
did not touch: `findAdjacentNode` got the nodeId tie-break in v0.80 and
this reference path never did.

Caught by the phase2 differential, which had been unable to see it because
its own fixture named a node type -- `waystone` -- that §6ch deleted, so
the comparison ran over an empty list and agreed with itself.

## §6cz. not for a blow. It came for one citizen and it answers only them.

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:3180` by `spec-stubs.mjs`.

§6cz: an incursion NEVER changes who it is fixed on -- not for a gunshot,
not for a blow. It came for one citizen and it answers only them.

## §6dj. The Skill Is

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:15902` by `spec-stubs.mjs`.

§6dj: THE SKILL IS `marksmanship`, AND THE TAG HAS TO SAY SO.

This read `tag2 = 'ranged'`, left behind when the skills were cut
to nine. Line 14523 spends the tag -- `p.skills[tag2] += dmg` --
so every drawn bow added a number to a skill that does not exist:
`undefined + dmg` is NaN, and a NaN in the skills is a state that
CANNOT BE CANONICALISED. Not a wrong number, an unencodable one.
The tick throws, the state never hashes, and the world stops for
everybody the moment somebody looses an arrow at range.

Melee never hit it because 'prowess' is a real key. Only the drawn
half was wrong, which is why an adjacent bow was fine.

## §6m-ii. The Gullet Rhythm Stays, And The Swing Is On Top Of It

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:10817` by `spec-stubs.mjs`. Amends §6m.

§6m-iii: THE GULLET RHYTHM STAYS, AND THE SWING IS ON TOP OF IT.

Removing the rate and keeping only the arm cost looked equivalent -- a
meal costs a swing, so an eater cannot also be fighting. It is not
equivalent, because a citizen can EAT AND SWING ALTERNATELY. Brews
stack to a million in one slot, so the pack never empties.

Measured, mirror duel at ninety-nine in full starmetal: even without
food it is 5:3, a coin flip. With a stack of ALE -- four hitpoints, the
cheapest thing anybody can brew -- it is 0:8. Whoever brought the stack
simply won, which is exactly the failure §6m-ii predicted in its own
comment while the code deleted the rule that prevented it.

## §6m-iii. The Gullet Rhythm Is Repealed

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:1734` by `spec-stubs.mjs`. Amends §6m.

v0.73: the gullet has its own rhythm, as the arm does (§6b, lastSwing).
Without one, a citizen ate every interval while the fight held, and broth
heals 5 against a skeleton-knight's 2 hp per interval at absolute maximum:
nobody carrying brews could die, so death, the Wilds and the brand were all
decoration. Eating mid-fight stays legal, as §6m intends. It simply has a
rate now, and that rate is what makes a beast dangerous to the unready.
§6m-iii: THE GULLET RHYTHM IS REPEALED.

It was written in v0.41 because nothing in this world could kill anybody,
and a citizen with brews ate every interval and was immortal. That reason is
long gone. What it was defended with afterwards -- that food would otherwise
out-heal damage -- does not survive arithmetic: the old chain lands up to
eleven EVERY interval, a maul special seventeen, the long shot thirty, and a
fish heals six. Nothing about eating has ever made a citizen unkillable
against anything that could really hurt them.

What is left is the cost that actually bites, and it arrived tonight: a meal
SPENDS THE ARM. Eat every interval if you like -- you will heal six and deal
nothing, and anybody serious will kill you anyway or simply walk off. The
brake is that eating is not fighting, which needs no constant at all.

The value stays for old states, which carry `lastAte`, and for nothing else.

## §6m-iv. And It Spends The Arm

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:14768` by `spec-stubs.mjs`. Amends §6m.

§6m-iv: AND IT SPENDS THE ARM, as a meal does.

A cooked fish restores six and costs a swing. A mending restored
TWENTY and cost nothing at all -- the `p.action = null` above belongs
to the stilling, not to this. So the best heal in the world was also
the only free one, which is backwards.

One rule covers both: whatever restores YOUR OWN hitpoints spends
your arm. Being mended by somebody else stays free to the wounded,
and that asymmetry is the whole reason to fight in a pair.

## §6m-v. A Richer Meal Is A Longer One

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:1751` by `spec-stubs.mjs`. Amends §6m.

§6m-v: A RICHER MEAL IS A LONGER ONE.

A flat rhythm made the heal value a RATE, and the rate is what decides a
fight. A deep broth restored one hitpoint an interval for ever -- against the
1.11 a star-sword lands through starmetal and the 0.62 a maul does -- so the
citizen with the stack could not be killed. Measured 0:12, and the burst
could not close it either: a finisher that removes half a health bar is no
answer to somebody who never falls below three quarters.

So the gullet asks in proportion to what it was given. Every food now
restores the SAME half-hitpoint an interval over time, and the heal value
buys something better than throughput: it buys the SIZE of one swallow, which
is how a wounded citizen leaves an execute window in a single interval.
A deep fish is still the best food in the world -- it lifts you ten in one
breath, out of reach of any burst -- it simply cannot also be a wall.

Below the weakest weapon in the world by a clear margin, so food lengthens a
fight and never decides one.
Tenths of an interval of gullet per hitpoint restored. At 25 every food
sustains 0.40 a tick, comfortably under the 1.11 a star-sword lands through
starmetal. Measured with both citizens fed and star-clad: at the old flat
rhythm a pair with stacked broth STALLED -- sixteen fights of three thousand
intervals, nobody ever fell. At 25 the same fight resolves in about two
hundred and forty and is decided by the burst (11:5 for the citizen who uses
it), which is the shape this world wants: food lengthens a fight, timing ends
one.
§6m-vi: A PACK RUNS OUT; A STACK DOES NOT.

One rate for everything left food as decoration. Measured at 25: a survivor
finished an old-chain duel holding 18 of 20 fish, having eaten THREE, while
spending 78% of the fight wanting to eat and being refused. The pack was not
a decision, and four fish played the same as twenty.

Dropping the rate fixes that for fish and breaks it for brews, because a
faster clock helps an ENDLESS source proportionally more: at 12 a stacked
deep-broth went to 0:20, which is the v0.86 regression wearing a new hat.

So they are clocked apart. Fish are bounded by the pack and may be eaten
briskly; brews pool to a million in one slot and may not. Measured at 12/25:
a long armoured fight runs a citizen dry a third of the time, a short one is
still decided by damage, and an endless brew stays where it was at 4:16.

## §6m-vi. A Richer Meal Is A Longer One

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:1777` by `spec-stubs.mjs`. Amends §6m.

§6m-v: A RICHER MEAL IS A LONGER ONE.

A flat rhythm made the heal value a RATE, and the rate is what decides a
fight. A deep broth restored one hitpoint an interval for ever -- against the
1.11 a star-sword lands through starmetal and the 0.62 a maul does -- so the
citizen with the stack could not be killed. Measured 0:12, and the burst
could not close it either: a finisher that removes half a health bar is no
answer to somebody who never falls below three quarters.

So the gullet asks in proportion to what it was given. Every food now
restores the SAME half-hitpoint an interval over time, and the heal value
buys something better than throughput: it buys the SIZE of one swallow, which
is how a wounded citizen leaves an execute window in a single interval.
A deep fish is still the best food in the world -- it lifts you ten in one
breath, out of reach of any burst -- it simply cannot also be a wall.

Below the weakest weapon in the world by a clear margin, so food lengthens a
fight and never decides one.
Tenths of an interval of gullet per hitpoint restored. At 25 every food
sustains 0.40 a tick, comfortably under the 1.11 a star-sword lands through
starmetal. Measured with both citizens fed and star-clad: at the old flat
rhythm a pair with stacked broth STALLED -- sixteen fights of three thousand
intervals, nobody ever fell. At 25 the same fight resolves in about two
hundred and forty and is decided by the burst (11:5 for the citizen who uses
it), which is the shape this world wants: food lengthens a fight, timing ends
one.
§6m-vi: A PACK RUNS OUT; A STACK DOES NOT.

One rate for everything left food as decoration. Measured at 25: a survivor
finished an old-chain duel holding 18 of 20 fish, having eaten THREE, while
spending 78% of the fight wanting to eat and being refused. The pack was not
a decision, and four fish played the same as twenty.

Dropping the rate fixes that for fish and breaks it for brews, because a
faster clock helps an ENDLESS source proportionally more: at 12 a stacked
deep-broth went to 0:20, which is the v0.86 regression wearing a new hat.

So they are clocked apart. Fish are bounded by the pack and may be eaten
briskly; brews pool to a million in one slot and may not. Measured at 12/25:
a long armoured fight runs a citizen dry a third of the time, a short one is
still decided by damage, and an endless brew stays where it was at 4:16.

## §6t. take back out of a bank. `deposit` takes a SLOT and `isItemName` accep

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:5196` by `spec-stubs.mjs`.

§6t: a chart is a thing a citizen can hold, so it is a thing they can
take back out of a bank. `deposit` takes a SLOT and `isItemName` accepts
charts, so one banked fine and `withdraw` -- which takes a name and
checked ITEMS only -- could never return it. Silent, permanent loss of a
survey reward, from two gates disagreeing about what an item is.

## §6x-ii. And The Accuracy Is A Ratio, Not A Clamp

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:5053` by `spec-stubs.mjs`. Amends §6x.

§6ap: AND THE ACCURACY IS A RATIO, NOT A CLAMP.

`clamp(128 + 4*(atk - def) + acc, 16, 240)` saturated at a twenty-eight
level gap, so against a ninety-nine attacker DEFENCE 1 THROUGH 71 WERE
LITERALLY IDENTICAL: seventy levels bought nothing. It was symmetric --
attack 50, 60 and 71 all sat at 6.3% against a defence-99 target -- and
against a low-defence target everything clamped to the ceiling, so weapon
accuracy stopped existing and the whole table collapsed to maxHit/every.

Ratios asymptote instead of clamping, so every level keeps buying
something and no two builds are the same character. Integer arithmetic
throughout: this decides fights, and every node must agree to the bit.
§6x-ii: AND `pierces` NOW MEANS THE ARMOUR IS NOT THERE.

The flail's whole identity was that it ignored SOAK -- "the only weapon in
the world that ignores this subtraction", paid for with the lowest base
damage of any steel. Moving armour out of the damage and into the roll
deleted that identity in one line: `pierces` had nothing left to ignore, and
the flail became simply a weak sword.

The translation is exact rather than approximate. Armour used to subtract
from the blow and the flail went round it; armour now subtracts from the
CHANCE, and the flail goes round that. A citizen in a full star suit is as
easy to hit with a flail as a naked one -- which is what the weapon has
always meant, expressed in the new currency.

## §6y. nothing is still nothing, so it asks a real bow-arm first.

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:950` by `spec-stubs.mjs`.

§6y: sigils bound to the limbs. The draw is half the arrows, and half of
nothing is still nothing, so it asks a real bow-arm first.

## §7ab. undrafted

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:7935` by `spec-stubs.mjs`.

§7ab: the Moorgrave

## §7ac. Iron Railing

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:680` by `spec-stubs.mjs`.

§7ac: IRON RAILING. A rampart is a war wall -- earth and stone, the thing
Norwick's garrison stands behind -- and the Moorgrave was drawn with one
because it was the only long boundary the vocabulary had. A churchyard is
not a fort. Railing blocks like a wall and reads like a fence: you can see
through it, which is most of what a graveyard wall is for.

## §7ah. A Country Wants A Creature Of Its Own

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:3534` by `spec-stubs.mjs`.

§7ah: A COUNTRY WANTS A CREATURE OF ITS OWN.

Four species were doing all the work across seven countries -- 168 goblins,
166 skeleton-knights, 113 wolves, 64 trolls -- and they overlapped so
completely that no country had anything to itself: skeleton-knights in the
Wilds AND in the meadow outside Anchor, trolls in the Crags AND the Wilds,
goblins in the Fens AND the heartlands. Walk anywhere and meet the same
four things.

These five need drop nothing new. A creature that exists so the Fens do not
feel like the Downs is doing a job -- the same argument as the landmark
trees, one layer up.

BOAR -- the Greenwood. Heavy, short-sighted, and it charges: the one beast
in the wood that comes at a citizen rather than waiting to be found.

## §7ai. undrafted

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:2181` by `spec-stubs.mjs`.

§7ai: ten bones to a flask
§7cy: how many hands a work remembers, and for how long

## §7al. undrafted

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:2477` by `spec-stubs.mjs`.

§7al: what a spade may be put into, and what a shift at it is worth

## §7am. citizen. `shotsFired` is the gonne's counter and is reused deliberatel

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:1966` by `spec-stubs.mjs`.

§7am: a fuelled weapon spends a measure every `per` blows, counted on the
citizen. `shotsFired` is the gonne's counter and is reused deliberately: a
citizen cannot wield both at once, the field is already constitutional, and
a second counter for the same idea is how state tables rot.

## §7ao. A Maul Answers To Strength

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:894` by `spec-stubs.mjs`.

§7ao: A MAUL ANSWERS TO STRENGTH.

Every maul was gated on ATTACK, which is the finesse stat -- and a maul is
the one weapon in the world that has no finesse: `acc: -12`, the worst
accuracy on the table, bought with the largest blow. It was asking for the
exact quality it does not have.

It also left a build with nowhere to go. The spade (7al) gave strength a
way to rise without fighting, and a citizen who took it had nothing worth
wielding at the end of it: every weapon in the world wanted attack. A
strength pure can pick up a maul now, which is what a strength pure would
pick up.

## §7ap. The Third Great Arm

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:937` by `spec-stubs.mjs`.

§6bt: seventy, where every gathering skill already has its mastery tool.
§7ap: THE THIRD GREAT ARM. The great tier had a sword for attack and a
crossbow for ranged, and nothing for strength -- which was invisible while
mauls were gated on attack (§7ao) and glaring the moment they were not. A
citizen who trains strength alone now has a ladder that reaches the top of
the world like everybody else's.

## §7bq. The Hollow Bow

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:2940` by `spec-stubs.mjs`.

§7bq: THE HOLLOW BOW, and the asymmetry it answers.

Melee trains itself: pick up a sword or nothing at all and keep swinging,
forever, for free. Ranged asks for a continuous supply of arrows AND falls
apart the moment the beast closes -- `clubbed` says a drawn bow at arm's
length is a stick. So an archer looses two or three, gets rushed, and is
holding an expensive club. That is a lot of friction to put on one skill's
ladder and none on another's.

A bow of hollow bone that whistles instead of shooting. `selfAmmo` sends
`ammoOf` to the weapon's own name and the bow is in the WEAPON slot, not
the pack -- so there is nothing to spend, and the same flag exempts it from
`clubbed`, which is the other half of the problem. An archer can train.

It is deliberately poor: hit 2 against the horn bow's 8, accuracy -10, and
reach 3 where a horn bow reaches 5. Nobody takes this into the Wilds when
they can afford arrows. It is the thing you own before you can.
`noAmmo` rather than `selfAmmo`: selfAmmo means THE PACK IS THE MAGAZINE,
which is right for a javelin and wrong here -- a bow in the weapon slot is
not in the pack, so the first cut of this could not shoot at all. It needs
nothing, and it is exempt from `clubbed` for the same reason a javelin is.

## §7br. - (firingFire(p) ? FIRE_ARROW_REACH : 0));   // §7br

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:3089` by `spec-stubs.mjs`.

  - (firingFire(p) ? FIRE_ARROW_REACH : 0));   // §7br

## §7bs. Fire Arrows

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:3137` by `spec-stubs.mjs`.

§7br: FIRE ARROWS, if the archer is carrying them and nothing else.

Melee already has a shape to choose between -- a maul that answers plate, a
flail that goes round it, a bare blade that pays for nakedness. Ranged had
one arrow and a ladder of bows, so the only decision an archer ever made
was which bow they could afford.

A fire arrow is a cage of tinder on a head: it SETS THE TARGET ALIGHT, it
flies shorter because it is heavy and dirty in the air, and it is bad
against armour, because there is no point on it to drive through plate.
Historically right and mechanically the opposite of the siphon, which is
fire that goes ROUND armour rather than failing against it.

Chosen by what is in the pack: plain arrows first, so an archer who wants
fire carries only fire.
§7bs: what the archer nocked, if they still have any of it.

## §7bu. A Ferry Is Not A Waystone

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:686` by `spec-stubs.mjs`.

§7bu: A FERRY IS NOT A WAYSTONE.

Waystones were taken out of this world on purpose: recall dissolves the
tolls, the roads, the two hundred tiles between the seam and the anvil, and
the flight rule with them. A boat does the opposite. It runs between TWO
NAMED POINTS and nowhere else, you must walk to the quay to take it, and
what it reaches cannot be reached any other way. That is geography, not a
shortcut -- it is the reason Karamja feels far rather than near.

## §7bw. A Saltern

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:695` by `spec-stubs.mjs`.

§7bw: A SALTERN. Shallow pans cut in the rock where the sea is let in and
the wind takes the water. There is one on Whiting Isle and nowhere else.

## §7bx. The Hollow Bow Is Not Made

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:15024` by `spec-stubs.mjs`.

§7bx: THE HOLLOW BOW IS NOT MADE. It was four bones and a log at
fletching 12 -- an hour's work for a weapon that removes the arrow
economy from training altogether. A bow that needs no ammunition is a
large thing to hand out for the price of a log, however poor its
numbers are, because what it costs is not damage: it is the SUPPLY
LINE, and that is the whole of ranged's asymmetry.

It comes off a skeleton-knight, one in five hundred. An archer who
wants to train without arrows goes and earns it, which is a fair price
for never buying another shaft.

## §7by. undrafted

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:2755` by `spec-stubs.mjs`.

§7by: identical, and cast in gold. That is the entire difference.

## §7ca. undrafted

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:8357` by `spec-stubs.mjs`.

§7ca: what each blow of a flurry did, this interval only

## §7cb. Barrow-wight --

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:3576` by `spec-stubs.mjs`.

BARROW-WIGHT -- the Moor again, and the reason to be careful there. It is
what the Moorgrave is full of, if anybody had dug.
§7ai: WARDED. A wight takes ONE from any blow unless the citizen striking
it carries holy water -- and the flask is spent when it falls. Ten bones
buried in consecrated ground for one fight.

It is the only gate in this world that is not a level or a tool: you
cannot buy past it, smith past it, or out-level it. You go and bury the
dead first. That is a strange requirement and it is the point -- the Moor
is a country of graves, and the thing that walks there answers to the only
courtesy anybody ever paid it.

GRAVE-SILVER is what it carries: worth seven hundred, made by nothing,
mined nowhere, and the only way to it is through the ossuary.
§7cb: THE GIBBET-DEAD. What the Mourner keeps behind the bars.

It stands in a ring of iron railing in the Moorgrave: see-through, and no
way in or out. Nobody can put a blade in it and it cannot put a hand on
anybody, so it is fought at four tiles or not at all -- the one creature in
the world that is ranged-only for BOTH sides.

It never wanders, because it cannot. It hurls what comes to hand.

## §7cd. undrafted

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:2249` by `spec-stubs.mjs`.

§7cd: past this many tiles you have lost them and the follow lapses

## §7ce. add('sorcery', WITHER_LEVEL, 'the withering \u2014 from the barrow-wor

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:1117` by `spec-stubs.mjs`.

  add('sorcery', WITHER_LEVEL, 'the withering \u2014 from the barrow-work');    // §7ck       // §7ce

## §7cf. Two Books, And Nothing In Both

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:2251` by `spec-stubs.mjs`.

§7cf: TWO BOOKS, AND NOTHING IN BOTH.

Magic in this world was built as THE REJECTION OF COMBAT -- 8b. Stilling ends
a fight, sealing shuts a way, charring unmakes, alching turns a thing into
money. Not one of them hurts anybody, and that is the whole argument for the
skill: a caster is somebody who has decided not to swing.

A book of the dead is therefore not an ADDITION to that. It is the reversal
of it, and the honest form of a reversal is that you cannot hold both. The
first cut took only alch away, which made the barrow-work "the common book
plus a war spell" -- the exact tier-with-a-ceremony it was written not to be.

So the two lists are disjoint and every spell asks the same question. A
citizen at an ossuary chooses which kind of caster they are, and walks back
to change their mind.

## §7cg. magic, from its first spell to its last

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:1114` by `spec-stubs.mjs`.

magic, from its first spell to its last

## §7ci. magic, from its first spell to its last

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:1115` by `spec-stubs.mjs`.

magic, from its first spell to its last

## §7cj. The Bone Staff

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:2871` by `spec-stubs.mjs`.

§7cj: THE BONE STAFF. Not a better weapon -- a worse one.

"A WAND SENDS WHAT A BARE HAND KEEPS" is the rule already: a caster can
mend themselves bare-handed and needs a wand to mend anybody else. The
barrow book had no such instrument, so the rot, the taking and the waking
all worked out of an empty hand, which made the wand's rule look arbitrary
rather than principled.

The bone staff sends what the barrow book keeps. It is the WORST weapon in
the world by accuracy -- worse than the wand, which was already terrible on
purpose -- because a caster who has turned to the dead has given up hitting
people with a stick even harder than an ordinary one has. What it does is
carry a spell, and it is the only thing that will.

## §7ck. add('sorcery', WITHER_LEVEL, 'the withering \u2014 from the barrow-wor

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:1117` by `spec-stubs.mjs`.

  add('sorcery', WITHER_LEVEL, 'the withering \u2014 from the barrow-work');    // §7ck       // §7ce

## §7cl. And The Barrow Book Had No Cadence At All

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:2390` by `spec-stubs.mjs`.

§7cl: AND THE BARROW BOOK HAD NO CADENCE AT ALL.

A citizen submits ONE input an interval, so nothing can be cast twice in the
same tick -- but nothing stopped the WAKING going off every single interval
forever, nine damage to a whole clump for three sigils, or the TAKING moving
eight hitpoints a tick with no leash whatsoever. The common book has leashes
everywhere: MEND_EVERY 25, STILL_CD 150. I gave the new book none, and wrote
in the SPEC that the taking has "no leash at all" as though that were the
design rather than an omission.

The rot and the withering were already self-limiting -- neither stacks on
somebody who has it -- so they keep their own shape. The other two get a
leash each, and they are the SAME leash the common book uses for the same
kind of thing:

  TAKING every 12   -- half of mend's 25, because it heals less than half of
                       mend's 20 and takes it from somebody who felt it
  WAKING every 40   -- it strikes a whole clump; a quarter of the stilling's
                       150, because stopping a fight is worth more than
                       hurting everybody in it

## §7cm. roll -- and §7ao's point stands: a strength pure should have something

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:929` by `spec-stubs.mjs`.

§7cm: strength alone, and high. It is the maul's argument -- a blow, not a
roll -- and §7ao's point stands: a strength pure should have something to
pick up at the end of the spade.

## §7cn. somebody who has already stood in one.

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:933` by `spec-stubs.mjs`.

§7cn: attack, mid-high. A weapon that answers a crowd should be carried by
somebody who has already stood in one.

## §7cn-ii. And A Cleave May Not Spend What It Cannot Pay For

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:16259` by `spec-stubs.mjs`.

§7cn-ii: AND A CLEAVE MAY NOT SPEND WHAT IT CANNOT PAY FOR.

A cleaved beast dies without dropping: the loot block below is
inside the named target's `hp <= 0`, and only the named target
ever reaches it. For an ordinary wolf that is the weapon's price
-- it kills more and loots less. For a FINITE beast it was a hole
in the floor of the economy: a lamprey has 448 lives in the whole
world and each one is a spit, two of which are a barb. A citizen
holding a barb, standing where two lampreys meet, burned the
world's only supply of barbs and left nothing on the ground. The
weapon ate its own source.

So the cleave does not touch a finite beast at all. Not "drops
nothing" -- it is not reached. Its life is spent only by a blow
aimed at it, which is the blow that pays.

## §7cn-iii. The Two Refusals

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:1905` by `spec-stubs.mjs`.

§6bw: THE TWO REFUSALS.

The mastery armour does not soak better than steel. Each piece spends itself
to say NO, once, to the worst thing in its category -- and then it is gone.

  the plate refuses DEATH: a blow that would put you at nothing leaves you
  at one instead, and shatters.
  the helm refuses being HELD: the next root that would take your feet does
  not, and it shatters.

Death for the body, and the loss of your own control for the head -- which
are the two things §2b-i already says this constitution cares most about. It
keeps both pieces off the damage ladder entirely: neither is "more armour",
so neither starts an arms race with the great arms that answer armour.

A HELM NEVER REFUSES A STILLING. A root is a weapon's grip and may be broken
by better gear; a stilling is a TRUCE, and §6k built the whole of magic on
it. Armour that let a master ignore a peace would undo the one capstone in
this world that exists to stop fights rather than win them.

They break rather than persist, which makes them the first consumable at the
top of this game: a sink that scales with how often people actually fight,
rather than with how long they have played.
§7cn-iii: WHAT A CORPSE LEAVES, asked in ONE place.

The drop loop lived inside the named target's death, so a beast killed by a
cleave left NOTHING -- and the barb, whose whole purpose is a crowd, killed
six wolves for a sword's eight and produced a third of the loot. It was worse
at the only thing it exists for. A body is a body: what it carried does not
depend on which blow of the swing reached it.

XP is NOT here, and that is deliberate. A drop is the BEAST'S and belongs to
the corpse; a lesson is YOURS and belongs to the swing, of which there was
one. §7cn already says a weapon that taught six times an interval in a lair
of crows would be the fastest ladder in the world, and it is right.

The counted tally comes with it (v0.64): the rate is per citizen per drop, so
five bodies in one interval advance one counter five times and the promised
rate is the rate. A second copy of this loop is how the two halves drifted
apart in the first place, which is the fault §11h is about.

## §7cp. A Citizen's Stall

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:1316` by `spec-stubs.mjs`.

---------------------------------------------------------------------------
A CITIZEN'S STALL
---------------------------------------------------------------------------
Every economic rule in this constitution ends the same way: the only
sensible buyer is another citizen. Magic-stone at twenty when a plate wants
seven. Dragon-bones at five hundred when they are worth six thousand. A
keeper's purse holding twelve hundred against a master smith's thirty-five
million. The world is built to force citizens to trade with each other --
and until now that required both of them awake at the same moment.

A stall a citizen raises sells while they sleep.

STOCK IS ONE-WAY, and that single rule is what keeps it a shop. You may put
things in; the only ways out are a SALE or a SPILL. Never a withdrawal.
Without it a stall in the Wilds is a vault in the Wilds -- mine twelve
stones, walk five tiles, empty the pack, mine twelve more -- and the
six thousand trips out of the Wilds that the whole star economy rests on
would simply evaporate.

THE PRICE IS NOT THE WORLD'S BUSINESS. There is no cap on the ask. What a
thing is worth between two citizens is the one number in this world that no
rule should touch; a ceiling would be the constitution having an opinion
about a market it exists to make possible.

It never blocks a tile, so no run of stalls can wall anybody in or out.
§7cp: A BUILT THING IS BUILT OF BOARDS.

The stall cost SIXTEEN LOGS and eight ore -- twenty-four slots of a pack of
twenty-eight -- and it still did after the sawpit and planks were added. The
toll at Millbrook takes planks and nothing else in the world does, so the
whole middle of that chain existed for one bridge-keeper.

A log is a tree you dragged. A board is a thing somebody made. Everything
this world BUILDS should be built of the second, and the sawpit is where the
first becomes it.

The arithmetic is deliberate: sixteen logs sawn is THIRTY-TWO planks, so the
stall costs the same wood and MORE WORK -- fell sixteen, walk to a sawpit,
saw sixteen, then build. What it costs less of is CARRYING, because planks
stack and logs do not: twenty-four slots becomes two. That is the right trade
for a thing you build once and stand beside for hours.
§7da: IRON ORE, BECAUSE `ore` CANNOT BE MINED.

The old `rock` seam that yielded `ore` was retired and replaced by `iron-rock`
yielding `iron-ore` -- and the stall's recipe was never moved with it. There
are ZERO rock nodes on the island, so a stall cost eight of a thing no pickaxe
can produce. It survives only as a rare mob drop and a waymark find, which is
not a supply, it is a lottery.

A recipe whose material was retired is a recipe nobody can complete, and it
had been that way since the seam table was rewritten. This is the same fault
as the room list that outlived its town (7bd) and the buildLogs key that
outlived planks (7cp): a table changed, and the things that read it did not.

## §7cs. && !(state && inLists(state, p.x, p.y));   // §7cs

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:2290` by `spec-stubs.mjs`.

  && !(state && inLists(state, p.x, p.y));   // §7cs

## §7ct. Eight intervals: long enough that fleeing is a decision and not a refl

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:2445` by `spec-stubs.mjs`.

§7ct: how long after a blow -- struck or taken -- the boat will not have you.
Eight intervals: long enough that fleeing is a decision and not a reflex,
short enough that a fight that is genuinely over lets you go home.

## §7cv. The Charter

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:2449` by `spec-stubs.mjs`.

§7cv: THE CHARTER, and why it is not a chart.

A master explorer already makes CHARTS -- and the engine says of them, "it
opens no doors, nobody travels by it, it is the export of a trade whose whole
product was previously experience." That sentence is worth keeping true, so
the charter is a different thing MADE from one: a chart of a crossing, drawn
up as a licence for a voyage, which is what the word has always meant.

It is spent on the boat to the LISTS and not on the boat to Whiting. Whiting
is work -- salt, and the fish that becomes cargo -- and gating a trade behind
somebody else's skill would put a toll on a living. The Lists is a place you
go to fight, and a fight can afford a price.

What it buys is an economy nobody designed: the master explorer is a citizen
who has done nothing but WALK, peacefully, for a very long time, and he turns
out to be the person who supplies the fighters. Ninety levels of wandering,
sold to people about to lose everything they carry.

## §7cw. undrafted

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:8271` by `spec-stubs.mjs`.

§7cw: whether the boat to the Lists knows them

## §7cx. The Siphon

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:2785` by `spec-stubs.mjs`.

§7am: THE SIPHON. A brass tube on a pump, and what comes out of it sticks
and keeps burning.

Fire is the one thing in this world already written to go ROUND armour --
the dragon's breath takes no soak, and the note on it says so in as many
words -- so a weapon that throws fire inherits that and needs no new rule:
`pierces` is the flail's word for it and it is used here unchanged.

Reach TWO, because you do not stand next to something you are setting
alight, and `burns` so it goes on burning after the blow. The cost is the
brimstone: six of it, which is the Crags' scarcest thing and until now was
spent on nothing but endgame plate.

It is not a gonne. A gonne is a bang and a ball and a supply line three
countries long. This is a nasty short-range thing that a citizen can build
once and carry forever, and it answers armour rather than distance.
§7am: and it EATS. A weapon that pierces plate at reach two and costs
nothing to swing is a weapon nobody puts down -- so the siphon burns
brimstone, one measure to every eight blows, and will not light without
it. That gives the Crags' scarcest thing an ongoing buyer instead of a
one-off, and it means a long fight has a bottom to it.

A `spec` of 'now' is the right special for a siphon and the wrong one for
a gonne: no flurry, no volley -- one sustained gout, out of rhythm,
when you decide. It costs the arm exactly as the maul's does.
§7cx: AND A SIPHON HAS TO BEAT THE FLAIL IT COPIES.

Measured at hit 3, every 3: 1.34 a tick bare and 1.39 through star plate --
against a star-flail, which pierces the same way, at 2.23 and 2.29. The
flail wants no fuel, no smithing 62, no attack 60 and no 1450 gold, so the
siphon was strictly dominated by a cheaper weapon that does its trick
better. Nothing about `burns` closes that: a fire is one point every four
intervals for eight, which is two points that cannot land the last blow --
about a twentieth of a tick, invisible next to a gap of nine tenths.

So the cadence goes to two, where every other short arm in the world sits,
and the blow rises to answer the price. It keeps its own shape: the only
weapon that pierces AND burns, and the only one that drinks brimstone.

## §7cy. undrafted

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:2182` by `spec-stubs.mjs`.

§7ai: ten bones to a flask
§7cy: how many hands a work remembers, and for how long

## §7cz. Rubble, Which Did Nothing At All

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:4204` by `spec-stubs.mjs`.

§7cz: RUBBLE, WHICH DID NOTHING AT ALL.

Two mentions in the whole engine: the rockfall that yields it and the item
list. You could mine it and it fed nothing, bought nothing, and built
nothing -- a gather with no consequence, which is the only kind of work this
world has that is not work.

And FARMING took nothing from any other skill. Seeds go in, twelve minutes
pass, grain comes out; no tool, no input, no reason to have done anything
else first. It is the most isolated skill on the island.

So the two answer each other. Rubble is broken stone, and broken stone
spread on a plot is what makes ground drain and warm: MARL. Sow with rubble
in the pack and the crop comes on in two thirds the time. It is not a bigger
harvest -- farming's yield is farming's business -- it is the WAIT, which is
the thing a farmer actually spends.

A miner who has never sown now makes something a farmer wants, out of a node
that was previously a way to waste a pickaxe.

## §7da. A Citizen's Stall

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:1332` by `spec-stubs.mjs`.

---------------------------------------------------------------------------
A CITIZEN'S STALL
---------------------------------------------------------------------------
Every economic rule in this constitution ends the same way: the only
sensible buyer is another citizen. Magic-stone at twenty when a plate wants
seven. Dragon-bones at five hundred when they are worth six thousand. A
keeper's purse holding twelve hundred against a master smith's thirty-five
million. The world is built to force citizens to trade with each other --
and until now that required both of them awake at the same moment.

A stall a citizen raises sells while they sleep.

STOCK IS ONE-WAY, and that single rule is what keeps it a shop. You may put
things in; the only ways out are a SALE or a SPILL. Never a withdrawal.
Without it a stall in the Wilds is a vault in the Wilds -- mine twelve
stones, walk five tiles, empty the pack, mine twelve more -- and the
six thousand trips out of the Wilds that the whole star economy rests on
would simply evaporate.

THE PRICE IS NOT THE WORLD'S BUSINESS. There is no cap on the ask. What a
thing is worth between two citizens is the one number in this world that no
rule should touch; a ceiling would be the constitution having an opinion
about a market it exists to make possible.

It never blocks a tile, so no run of stalls can wall anybody in or out.
§7cp: A BUILT THING IS BUILT OF BOARDS.

The stall cost SIXTEEN LOGS and eight ore -- twenty-four slots of a pack of
twenty-eight -- and it still did after the sawpit and planks were added. The
toll at Millbrook takes planks and nothing else in the world does, so the
whole middle of that chain existed for one bridge-keeper.

A log is a tree you dragged. A board is a thing somebody made. Everything
this world BUILDS should be built of the second, and the sawpit is where the
first becomes it.

The arithmetic is deliberate: sixteen logs sawn is THIRTY-TWO planks, so the
stall costs the same wood and MORE WORK -- fell sixteen, walk to a sawpit,
saw sixteen, then build. What it costs less of is CARRYING, because planks
stack and logs do not: twenty-four slots becomes two. That is the right trade
for a thing you build once and stand beside for hours.
§7da: IRON ORE, BECAUSE `ore` CANNOT BE MINED.

The old `rock` seam that yielded `ore` was retired and replaced by `iron-rock`
yielding `iron-ore` -- and the stall's recipe was never moved with it. There
are ZERO rock nodes on the island, so a stall cost eight of a thing no pickaxe
can produce. It survives only as a rare mob drop and a waymark find, which is
not a supply, it is a lottery.

A recipe whose material was retired is a recipe nobody can complete, and it
had been that way since the seam table was rewritten. This is the same fault
as the room list that outlived its town (7bd) and the buildLogs key that
outlived planks (7cp): a table changed, and the things that read it did not.

## §7dc. Twenty-six

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:2519` by `spec-stubs.mjs`.

§7r: one coal buys the furnace this many intervals of heat, and it will not
bank more than the cap -- so a fire cannot be stoked once and left for a
week, and there is a reason for somebody to be standing there.
§7r: one coal buys the furnace this many intervals of heat (§1c: an hour is
3,600 intervals at a second), and it will not bank past the cap -- so a fire cannot
be stoked once and left for a week, and there is a reason for somebody to be
standing there.

TWENTY-SIX, and the first cut said twelve. The watchfire -- this world's
other public fire -- pays TWENTY for a log, and coal is dearer than a log by
every measure the constitution already has: mining 21 against a chop, and
hardness 2. Twelve made the dearer fuel pay less, which meant the fireman
was doing it for the greater good and nobody does a job for the greater good
twice. A stoke may be sent every interval, and a full fire still takes the
coal and still pays for it (the watchfire's own rule, for the same reason),
so the rate is bounded by what a citizen can mine -- which is the honest
bound, and self-limiting.
§7dc: COAL BURNS LONGER THAN CHARCOAL, AND IS NOW WORTH MINING.

Coal was strictly the worse material. It substituted for charcoal as fuel
ONE FOR ONE, and charcoal also had a monopoly on gunpowder -- which is
correct and should stay, because real powder wants charcoal and coal's
sulphur makes a bad one. So a woodcutter at firemaking 60 could do
everything a coal miner could, plus one thing more, and coal existed to be
the option you took when you could not be bothered.

What coal actually IS, is denser. It burns hotter and longer, which is why
the world went to the trouble of digging it out of the ground instead of
making charcoal forever. So it lasts half again as long in the furnace.

The result is two fuels with two masters. A fire-keeper wants COAL, because
each one buys more hours of fire; a powder-maker wants CHARCOAL, because
nothing else will do. A miner and a woodcutter now supply different people,
instead of one of them supplying everybody.
§1c: rescaled for the second-long interval. A coal was fifteen minutes of
heat and a charcoal ten; the cap was an hour, which is what stops a furnace
being stoked once and left for a week.

## §7dd. And Coal Banks A Watchfire

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:4857` by `spec-stubs.mjs`.

§7dd: AND COAL BANKS A WATCHFIRE. Six seams feed ONE furnace, which is why
coal is thirty times oversupplied -- the demand does not grow with the number
of citizens, because there is only ever one fire that wants it.

A WATCHFIRE does grow: they are player-built, two to a citizen, and every one
of them has to be fed or it goes out. Coal banks one the way it banks a
furnace -- three logs' worth from a single lump, because that is what denser
fuel means and it is the same 1.5x the furnace already gives it over
charcoal.

It closes a loop that was half-open: CHARRING NEEDS A LIT WATCHFIRE, and
charcoal is what powder is made of. So a coal miner keeps the fire that makes
the charcoal that somebody else turns into powder. The miner supplies the
burner supplies the gunner, and none of the three can do the others' work.

## §7dg. The Smokerack

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:520` by `spec-stubs.mjs`.

§7dg: THE SMOKERACK, and why it is not a shelf.

The Eel Sheds were drawn with four 'v' glyphs -- shelves -- years before
anything could be done with one. A shelf is a `landmark`: it is furniture,
it is scenery, and nothing may be left on it. A rack holds one citizen's
catch for a fixed number of intervals and hands it back changed, which is
a different noun and earns its own type, exactly as the fountain did.

NOT 'rack', and not 'eel-rack'. `eel-rack` is already a landmark KIND in
the fen group beside `sunken-wall` -- decorative plank racks over standing
water. Two nouns one letter apart, one of them scenery and one of them
holding your dinner, is a bug waiting for whoever reads this next.

## §7di. The Scene Nouns

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:7974` by `spec-stubs.mjs`.

§7di: THE SCENE NOUNS (worldgen-scenes-v7).

The island had fifty-seven kinds and two thousand of them standing about,
one at a time, spread by a hash. It was never short of nouns; it was short
of SENTENCES. A stump alone is texture. A stump, a second stump, a
chopping-block and a cold charcoal-ring within four tiles is somebody’s
afternoon, and the difference between those two things is the whole of
what makes a world look authored rather than generated.

These are the words the scenes needed and the fifty-seven could not say.
Most of them are LABOUR CAUGHT IN THE MIDDLE -- a scaffold, wood-chips, a
wheel-rut, an unfired shot-hole -- because a trace of work implies a
person who is not on the map, and that implication is most of what makes
a country feel lived in.

Cheap, and safe, for the reason §7o gives: no verb in this constitution
reaches a landmark. It cannot be worked, fought, lit or consumed. A kind
adds texture to the world without adding a rule to the world.

## §7dj. Gravable

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:8024` by `spec-stubs.mjs`.

§7dj: and four that exist only because the obvious word already has a job.
A stone-heap is not a cairn, a way-post is not a milestone, a slag-lump is
not a glass-stone and a hay-wain is not a cart -- each of those four is
reachable by a verb (the first three are GRAVABLE, the fourth is a node
type a hauler drops on death with a shelf anybody may unload). Scenery is
cosmetic and nothing else, so scenery gets its own words.

## §7dk. The Record Band --

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:2616` by `spec-stubs.mjs`.

§7dk: THE RECORD BAND -- fifty to ninety-nine.

A record needs a clock, and the two obvious places to start it are both
wrong. FROM WAKING means a citizen must decide their trade before they have
seen the island: a bet placed blind, and every record thereafter belongs to
whoever guessed. FROM FIRST EXPERIENCE is better but it cannot be refused:
prowess is paid both to whoever LANDS a blow and to whoever is HIT, so one
goblin on your first day starts a clock you never chose, and a year at the
trees afterwards has ruined a board by playing normally. (This note is older
than §5j and named three skills where there is now one; the hazard it
describes is unchanged and so is the reasoning. It used to add that
1154, so its "first experience" is at waking for everybody alive.

FIFTY IS THE ONE LINE THAT WORKS FOR ALL EIGHTEEN. Nothing crosses it by
accident, nobody has to choose before waking, and it is about an eighth of
the way to ninety-nine by experience -- so the band is the great majority of
the work and all of the interesting part, since everything below it is the
tutorial of whichever trade it belongs to.

It also bounds the obvious cheat. Started at first experience, a citizen
could bank two hundred thousand raw fish across a year and only THEN gain
one cooking experience, and the record would measure nothing but how fast
they could press a button. Crossing fifty first means the preparation window
is narrow and the preparer is already committed to that trade.

## §7dl. Passability Is A Property Of The Crossing, Not Only Of The Tile

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:5975` by `spec-stubs.mjs`.

§7dl: PASSABILITY IS A PROPERTY OF THE CROSSING, NOT ONLY OF THE TILE.

`terrainBlocked` answers whether a tile can be stood on, and that is all the
island ever needed while every obstacle was a wall. It is not enough for the
kind of friction that makes a country memorable: a gap you can only squeeze
through with a light pack, a scree you can come down and not climb, a ford
the river takes back twice a day, a pass that wants something burning.

AND IT MUST NOT TOUCH SPEED. Everyone walks one tile an interval and §2b-i
leans on it -- a pursuer who moves cannot swing, so the runner gains a tile
-- which is why no citizen can be robbed and why the armour tax was
repealed. Slow ground would mean relitigating the flight rule to get a snow
effect. So the friction is in WHETHER, never in HOW FAST.

A SECOND PREDICATE, NOT A REPLACEMENT. `terrainBlocked` is asked first and
unchanged; this is only consulted for a tile the citizen could otherwise
stand on. Nine of the ten places the engine asks about terrain are the world
moving itself -- mob wander, spawn, scatter, the incursion -- and none of
them carries a pack or a direction, so none of them changes. Exactly one
call site is a citizen moving.

A generator that exports no `crossing` produces a world identical in every
tile, which is the same courtesy layPlan gives its legend.

THE ROUTER GETS THE PESSIMISTIC ANSWER, deliberately -- see the note in
worldgen. A road that depended on a crossing a citizen might fail is a road
that is sometimes not there, and §14a's rule stands: a way round must exist,
or the gate is a hostage rather than a choice.

## §7dm. undrafted

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:8062` by `spec-stubs.mjs`.

§7dm: the hardest rung ever worked, per skill

## §7dn. The Ruin Nouns

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:8035` by `spec-stubs.mjs`.

§7dn: THE RUIN NOUNS. A ruin is legible when you can still read what it
WAS -- one wall to full height with a window in it, a stump of tower, a
course of stone at knee height you step over. A half-wall is the one that
matters: it lets a ruin be a floor plan a citizen walks THROUGH rather
than a silhouette they walk around, and a ruin you cannot enter is only
scenery. Cosmetic, like every landmark: no verb reaches them.

## §7do. Chooses

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:533` by `spec-stubs.mjs`.

§7do: A HOARD. Grave goods, in a barrow, behind a squeeze.

Not a cart: a cart's `unload` takes the DEAREST thing automatically,
because whoever stops at a dead hauler's shelf would reach for the plate
before the ore and a script would do it anyway. A hoard is the opposite --
the whole of it is that a citizen CHOOSES, having got in with three slots.

Not a stall either: nothing is bought here and there is no keeper. It is a
hole in the ground with things in it that somebody was buried with.

## §7dp. so a masked citizen was an unconstitutional one -- the two lists have 

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:4581` by `spec-stubs.mjs`.

§7dp: the four barrow masks. `slotOf` knew where they sit and this did not,
so a masked citizen was an unconstitutional one -- the two lists have to
agree or an item can be worn by the executor and rejected by the validator,
which is a fork.

## §7dq. The Stats, Not The Recipe

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:2990` by `spec-stubs.mjs`.

§7dq: THE STATS, NOT THE RECIPE. This line held `{ 'star-alloy': 4 }` --
the great-crossbow's SMITHING RECIPE, pasted into the weapon table over
its stats. The weapon therefore had no hit, no cadence, no reach and no
`ranged` flag: `reachOf` fell to 1, so a six-tile crossbow could only be
fired at somebody standing on top of you, it drew no arrows because
nothing marked it ranged, and it scored off prowess rather than
marksmanship. It is smithed, priced, gated at marksmanship 70 and listed
as two-handed everywhere else in this file; only the line that says what
it DOES was wrong. Restored from the numbers it carried before the
mastery rebuild, with `hit` scaled to the flesh of 64 (§5j).

## §7dr. How Long A Torch Lasts

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:1870` by `spec-stubs.mjs`.

§7dr: HOW LONG A TORCH LASTS, and why it going out is the best part.

It turns the cave into a clock without adding a single system. A citizen goes
in knowing how much light they have; they may always walk out and relight,
because the mouth is only asked about on the way IN -- but the walk back costs
them the trip. That is the whole tension, and it is one integer.

A FIXED TIMER, not "while held". A torch burning in your pack is a torch
burning, and a rule that paused it would be a rule about inventory management
rather than about fire.

## §7dt. 'torch'].includes(v)   // §7dt: a log and a knife

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:5208` by `spec-stubs.mjs`.

                'torch'].includes(v)   // §7dt: a log and a knife

## §7du. The Drowned Bell

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:656` by `spec-stubs.mjs`.

§7du: THE DROWNED BELL, and the one raising on this island that CANNOT be
done alone.

Every other collective work here is many hands OVER TIME: the South Pass
is 41 rockfalls and six strikes an hour however many citizens swing, the
spanwork is a pool of planks, a watchfire is fed. Each of them is finishable
by one determined person given enough weeks, and so each of them is really
a long errand that several people may share.

This is many hands IN ONE INTERVAL. Three citizens must haul on the same
tick or the water takes it back, and no amount of patience substitutes.
It is the only thing in the constitution that requires a citizen to have
found two others and agreed a moment with them -- which is a different
social shape from anything else on the island, and the reason to build it.

Once in the world's life. When it comes up it is a BELL: a thing that
rings, that everybody hears, that nobody can un-ring, and that carries the
names of whoever was on the rope.

## §7dv. How Many Citizens One May Be Known To

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:2414` by `spec-stubs.mjs`.

§7dv: HOW MANY CITIZENS ONE MAY BE KNOWN TO. Larger than FRIEND_CAP, which
is a list a citizen curates by hand; this one the world writes, one entry
per distinct person ever stood beside inside a stint. It is bounded because
state has to hash, not because acquaintance should be rationed.

## §7dw. Closing Time

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:5718` by `spec-stubs.mjs`.

§7dw: CLOSING TIME.

A ceiling on how much of the world one citizen may stand in any rolling
window. Not a day: a DAY would need a wall clock, and every midnight anybody
could pick is dinnertime for somebody else. A rolling window has no calendar,
no reset to race toward, and nothing to hoard or waste -- it refills
continuously, which removes the whole "use it or lose it" pressure that makes
a daily allowance itself a retention hook.

It counts PRESENCE, not stint time. A ceiling that only counted sworn
intervals would be escaped by never swearing, and a citizen could stand the
world forever so long as they stayed unreachable. The promise and the
ceiling measure the same thing for the same reason.

It is enforced the way every other rule here is enforced: every node
computes it from state it already holds, and no owner is involved. A second
keypair is not a way around it, it is the price of it -- skills, standing, a
calling sworn at thirty that cannot be put down, kept names, and vaults that
have a location. A limit you must pay that much to leave is a limit.

The ledger is BINNED rather than exact. `bins` counts of `window / bins.length`
intervals each, advanced and zeroed as the count moves. The window is
therefore accurate to within one bin, which is the right trade: an exact
rolling sum would want a stamp per sample and hundreds of integers per
citizen in a state that has to hash.

## §7g. The Altar

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:706` by `spec-stubs.mjs`.

§7g: THE ALTAR. Three magic-stones become a sigil here and nowhere else.

## §7i. The Muck Heap

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:600` by `spec-stubs.mjs`.

§7i: THE MUCK HEAP. Nitre is scraped off a dung heap; it is the one thing
a farm makes that a soldier needs.

## §7j. undrafted

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:1648` by `spec-stubs.mjs`.

§7j: grain to flour, at a mill and nowhere else

## §7j-ii. Bread Is The Hearth's, Not The Shore's

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:15459` by `spec-stubs.mjs`.

§7j-ii: BREAD IS THE HEARTH'S, NOT THE SHORE'S.

When fishing and cooking became `shorecraft`, one thing came with
them that never had anything to do with the shore: a loaf. Grain is
farmed, the mill grinds it for hearthcraft (see `grind` below), and
then the bake -- the last step of the same chain -- paid a different
skill and asked the shore for its odds. A farmer who milled their own
grain had to be a fisher to finish the loaf.

Both halves move: the roll reads hearthcraft, and so does the lesson.
It costs no new skill and no new calling. A citizen who only ever
bakes is a hearthkeeper, which is true, and they may call themselves
the baker of Anchor without the engine's help.

## §7k. Or The Market Square

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:11662` by `spec-stubs.mjs`.

§7k: ...OR THE MARKET SQUARE. A stall lines the road because commerce
belongs where the traffic is, and that rule already let a citizen trade
anywhere in Millbrook -- there are a hundred and seven legal verges inside
its walls. But a hundred and seven scattered verges is not a market, it is
a hundred and seven people standing along a road.

The square is the one piece of ground on Tallyholm where stalls may stand
in the OPEN, shoulder to shoulder, which is what a market is. Same
argument as the Lantern's pot: you do not get people to gather by
forbidding the alternatives, you give them somewhere worth gathering.

## §7l. Measured

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:923` by `spec-stubs.mjs`.

§7l: MEASURED, not guessed. A naked bare-blade wins 23-37% of duels
against a star-sword over a full star suit, at every level from 40 to 99 --
it is an option, not an answer, and it never dominates. No level gate is
needed for balance; this one is here so that a citizen meets the choice
after they have met armour, not before.

## §7m. The Fall-stone

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:7433` by `spec-stubs.mjs`.

§7m: THE FALL-STONE. Rubble is what the mountain gives everybody; a
fall-stone is what it gives the citizen who finished a boulder. Same rock,
same swing, and the only difference is that it was the last one.

Built on the hood exactly: head slot, absent from ARMOUR so it is worth
nothing in a fight, tradeable, and the id stores the KEY rather than the
name -- so a citizen who takes a name in year three is retroactively legible
on every stone they broke, including the ones they sold. Every one is
therefore DIFFERENT: whose it was and which day of the world. The first ever
broken, and the one that opened the way, will be worth more than the
fortieth, and that value is history rather than a rarity table.

There are at most forty-one, and the real number is not mine to set: the
pass opens on a five-stone tunnel, so if the island digs the minimum then
FIVE exist for all time. Every stone past that is trophy-mining -- a
thousand rate-limited strikes for a thing that does nothing. Whatever the
count turns out to be, it is a fossil of one collective decision made in the
first week, and the seam is deleted afterwards. Nothing issues another.

## §7n. A Field Is Not A Wall

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:11366` by `spec-stubs.mjs`.

§7n: A FIELD IS NOT A WALL. A plot blocked its tile, so a block of them
was a solid mass and only the outer ring could be stood beside -- and
`harvest` wants ADJACENCY. Measured on the seventh founding: 1,269 of the
island's 1,370 field plots could not be reached by anybody. Seventy per
cent of the ploughed land was scenery, and no drawing could fix it: any
shape two tiles thick has an unreachable middle.

Ploughed ground is walked over. You stand in one furrow to work the next,
exactly as nothing in this engine strikes the tile it stands on, and the
hedge round the furlong still says where the field ends.
§7a: a FINISHED span is decking, and decking is water you can walk on. The
spanwork it grew from is deliberately NOT here -- an unfinished bridge bars
its tile exactly as the beck under it does, which is the entire reason the
crossing is worth fighting over before it is done.

## §7o. Monotonous

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:7915` by `spec-stubs.mjs`.

---- and the nouns the world was short of ----

Seventy per cent of everything a citizen walked past was a wall, a tree
or a rock: the island was DENSE and MONOTONOUS, four to six different
things within twenty tiles anywhere you stood. The answer is not more
trees; it is more KINDS.

A landmark is the right vehicle and the safe one. No verb in the
constitution reaches it -- it cannot be worked, fought, lit or consumed
-- so a new kind can add texture to the world without adding a rule to
the world. That is why these are kinds and not node types: the verb set
is complete, the vocabulary was not.
§7o (v0.88): AND THE NOUNS THE ROADSIDES WERE SHORT OF.

The same argument one more time, measured. 135 waymarks along every road
on the island were drawn from TWO kinds -- a stump or a standing stone --
and an orchard was eight identical old-oaks in a five-tile square, which
put sixteen of one thing inside two tiles where two orchards met. 317 of
the island's 1,023 landmarks stood in a clump of three or more of exactly
themselves. That is what makes a hand-drawn country read as generated.

A kind is free -- no verb reaches a landmark -- so the roadsides now speak
their own country: cairns and cut faces in the Crags, withy and eel racks
in the Fens, thorn and peat on the Moor, hurdles and dew-marks on the
Downs. Twelve words instead of two.
§7u: THE TREES THAT ARE NOT TIMBER. Every tree on this island was a thing
you could chop, so the countryside could only be wooded where the world
wanted woodcutting. These are landmarks -- no verb reaches them -- so a
country can have trees the way a country does: willows where the water is,
dead ones where the land turned, pines on the high ground, and an AVENUE,
which is the only one of them that says a person did it on purpose.

## §7p. The Looking Glass

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:678` by `spec-stubs.mjs`.

§7d: THE LOOKING GLASS. A citizen's first face is free, at the door. To
change it afterwards you go and look at yourself in something, and there
is one of them on the island.
§7p: THE FURNACE. Ore becomes metal here and nowhere else on the island.

## §7p-ii. Count The Units, Not The Slots, And Spend Only What Is Asked

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:14100` by `spec-stubs.mjs`.

§7p-ii: COUNT THE UNITS, NOT THE SLOTS, AND SPEND ONLY WHAT IS ASKED.

This counted SLOTS holding the item and then nulled whole slots to pay
the cost. For a bar that is the same thing -- bars do not stack -- but
several smithing inputs DO: shot, flour, arrows, javelins. A recipe
asking for one unit of a stacked good was told the citizen had one
(one slot), then took the entire stack for it. A hundred shot bought a
single forging.

## §7p-iii. What A Recipe Costs, Paid In One Place

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:9249` by `spec-stubs.mjs`.

Removes qty units from a slot; clears the slot when it empties.
Returns true if the slot held at least qty units.
§7p-iii: WHAT A RECIPE COSTS, PAID IN ONE PLACE.

The anvil and the furnace each carried their own copy of this: count what is
held, then spend it. Two copies of one rule is how they drifted -- BOTH
counted SLOTS rather than units and paid by nulling whole slots, so a recipe
asking for one unit of a stacked good (shot, flour, arrows, javelins) was
told the citizen had one, then took the entire stack. It was invisible for
bars and ore, which do not stack, and a hole for everything that does.

`fills` is passed in because only the caller knows what substitutes for what
-- charcoal for coal at both fires (§6bo). The spend runs twice on purpose:
the exact good first, the substitute after, so what was cheaper to come by
is spent before what was dearer, exactly as `consumeLogs` spends ordinary
logs before heartwood.

## §7q. The Sawpit

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:698` by `spec-stubs.mjs`.

§7q: THE SAWPIT. Logs become planks here and nowhere else.

## §7r. Twenty-six

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:2502` by `spec-stubs.mjs`.

§7r: one coal buys the furnace this many intervals of heat, and it will not
bank more than the cap -- so a fire cannot be stoked once and left for a
week, and there is a reason for somebody to be standing there.
§7r: one coal buys the furnace this many intervals of heat (§1c: an hour is
3,600 intervals at a second), and it will not bank past the cap -- so a fire cannot
be stoked once and left for a week, and there is a reason for somebody to be
standing there.

TWENTY-SIX, and the first cut said twelve. The watchfire -- this world's
other public fire -- pays TWENTY for a log, and coal is dearer than a log by
every measure the constitution already has: mining 21 against a chop, and
hardness 2. Twelve made the dearer fuel pay less, which meant the fireman
was doing it for the greater good and nobody does a job for the greater good
twice. A stoke may be sent every interval, and a full fire still takes the
coal and still pays for it (the watchfire's own rule, for the same reason),
so the rate is bounded by what a citizen can mine -- which is the honest
bound, and self-limiting.
§7dc: COAL BURNS LONGER THAN CHARCOAL, AND IS NOW WORTH MINING.

Coal was strictly the worse material. It substituted for charcoal as fuel
ONE FOR ONE, and charcoal also had a monopoly on gunpowder -- which is
correct and should stay, because real powder wants charcoal and coal's
sulphur makes a bad one. So a woodcutter at firemaking 60 could do
everything a coal miner could, plus one thing more, and coal existed to be
the option you took when you could not be bothered.

What coal actually IS, is denser. It burns hotter and longer, which is why
the world went to the trouble of digging it out of the ground instead of
making charcoal forever. So it lasts half again as long in the furnace.

The result is two fuels with two masters. A fire-keeper wants COAL, because
each one buys more hours of fire; a powder-maker wants CHARCOAL, because
nothing else will do. A miner and a woodcutter now supply different people,
instead of one of them supplying everybody.
§1c: rescaled for the second-long interval. A coal was fifteen minutes of
heat and a charcoal ten; the cap was an hour, which is what stops a furnace
being stoked once and left for a week.

## §7s. Twenty-six

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:2542` by `spec-stubs.mjs`.

§7r: one coal buys the furnace this many intervals of heat, and it will not
bank more than the cap -- so a fire cannot be stoked once and left for a
week, and there is a reason for somebody to be standing there.
§7r: one coal buys the furnace this many intervals of heat (§1c: an hour is
3,600 intervals at a second), and it will not bank past the cap -- so a fire cannot
be stoked once and left for a week, and there is a reason for somebody to be
standing there.

TWENTY-SIX, and the first cut said twelve. The watchfire -- this world's
other public fire -- pays TWENTY for a log, and coal is dearer than a log by
every measure the constitution already has: mining 21 against a chop, and
hardness 2. Twelve made the dearer fuel pay less, which meant the fireman
was doing it for the greater good and nobody does a job for the greater good
twice. A stoke may be sent every interval, and a full fire still takes the
coal and still pays for it (the watchfire's own rule, for the same reason),
so the rate is bounded by what a citizen can mine -- which is the honest
bound, and self-limiting.
§7dc: COAL BURNS LONGER THAN CHARCOAL, AND IS NOW WORTH MINING.

Coal was strictly the worse material. It substituted for charcoal as fuel
ONE FOR ONE, and charcoal also had a monopoly on gunpowder -- which is
correct and should stay, because real powder wants charcoal and coal's
sulphur makes a bad one. So a woodcutter at firemaking 60 could do
everything a coal miner could, plus one thing more, and coal existed to be
the option you took when you could not be bothered.

What coal actually IS, is denser. It burns hotter and longer, which is why
the world went to the trouble of digging it out of the ground instead of
making charcoal forever. So it lasts half again as long in the furnace.

The result is two fuels with two masters. A fire-keeper wants COAL, because
each one buys more hours of fire; a powder-maker wants CHARCOAL, because
nothing else will do. A miner and a woodcutter now supply different people,
instead of one of them supplying everybody.
§1c: rescaled for the second-long interval. A coal was fifteen minutes of
heat and a charcoal ten; the cap was an hour, which is what stops a furnace
being stoked once and left for a week.

## §7t. The Training Yard

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:702` by `spec-stubs.mjs`.

§7t: THE TRAINING YARD. A dummy takes a blow and a butt takes an arrow;
neither ever hits back, and past a low level neither teaches anything.

## §7u. Monotonous

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:7928` by `spec-stubs.mjs`.

---- and the nouns the world was short of ----

Seventy per cent of everything a citizen walked past was a wall, a tree
or a rock: the island was DENSE and MONOTONOUS, four to six different
things within twenty tiles anywhere you stood. The answer is not more
trees; it is more KINDS.

A landmark is the right vehicle and the safe one. No verb in the
constitution reaches it -- it cannot be worked, fought, lit or consumed
-- so a new kind can add texture to the world without adding a rule to
the world. That is why these are kinds and not node types: the verb set
is complete, the vocabulary was not.
§7o (v0.88): AND THE NOUNS THE ROADSIDES WERE SHORT OF.

The same argument one more time, measured. 135 waymarks along every road
on the island were drawn from TWO kinds -- a stump or a standing stone --
and an orchard was eight identical old-oaks in a five-tile square, which
put sixteen of one thing inside two tiles where two orchards met. 317 of
the island's 1,023 landmarks stood in a clump of three or more of exactly
themselves. That is what makes a hand-drawn country read as generated.

A kind is free -- no verb reaches a landmark -- so the roadsides now speak
their own country: cairns and cut faces in the Crags, withy and eel racks
in the Fens, thorn and peat on the Moor, hurdles and dew-marks on the
Downs. Twelve words instead of two.
§7u: THE TREES THAT ARE NOT TIMBER. Every tree on this island was a thing
you could chop, so the countryside could only be wooded where the world
wanted woodcutting. These are landmarks -- no verb reaches them -- so a
country can have trees the way a country does: willows where the water is,
dead ones where the land turned, pines on the high ground, and an AVENUE,
which is the only one of them that says a person did it on purpose.

## §7x. And Steel Is A Bar

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:4553` by `spec-stubs.mjs`.

§7x: AND STEEL IS A BAR. It was the last incoherent corner: every other
metal in the world is smelted, and steel gear was forged straight out of
iron AND COAL at the anvil -- which is to say the anvil was doing the
furnace's job, in nine recipes, for the one metal that is actually MADE
rather than merely shaped. Iron carburised in the fire is a bar like any
other, and the coal is the furnace's fire, per §7r.

## §21d-ii. Has To Be Re-read, Because It Is No Longer The Same

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:14216` by `spec-stubs.mjs`. Amends §21d.

§21d-ii: AND `q` HAS TO BE RE-READ, BECAUSE IT IS NO LONGER THE SAME
OBJECT.

`ownPlayer` is copy-on-write: the first write to a citizen in a tick
REPLACES s.players[pid] with a fresh copy. `strikeConsequences` is
that first write for the victim -- it brands and sets their answer --
so every line after it held a pointer to a discarded object. Each
blow of the special was rolled, computed and applied to a ghost: the
damage was right, the hp went down, and the state that got hashed
never saw it. EVERY special in the world dealt exactly nothing,
melee and drawn alike, while still spending the arm and the arrows.

The ordinary path never hit this because it resolves in the action
phase, where the target is already owned.

## §2287. Equivocation

> **DERIVED — NOT YET RATIFIED.** Drafted from `engine.js:5298` by `spec-stubs.mjs`.

§7.3a: the whole pack, in one input. One input per interval is a rule
about EQUIVOCATION (§2287), not about how much a single deed may move.
