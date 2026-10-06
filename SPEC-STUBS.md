<!-- 199 sections drafted by spec-stubs.mjs from engine.js.
     Every one of them is DERIVED, NOT RATIFIED: the words are the engine's
     comment, not a decision that this is law. Edit, cut, or promote them.
     Re-run `node spec-stubs.mjs --write` to refresh the ones still untouched. -->

## 1c. The Interval Is A Second, And It Is The One Number That Was Inherited

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:57` by `spec-stubs.mjs`.

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
thirty-five decisions and a gambit's recovery is sixteen seconds of standing
still unable to act, which is not tension but dead air; the recoveries tuned
in §6af assume a pause a citizen can sit through. A second is the slowest
interval that still holds attention.

Everything in this file counts INTERVALS, not milliseconds; only the
scheduler converts. The constants that had a wall-clock claim written into
them are marked below -- some were rescaled to keep the claim, and some kept
their count because the thing they measure should stretch with the world.

## 2b-iv. The Mark And The Answer, In One Place

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:1839` by `spec-stubs.mjs`. Amends §2b.

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
`attackp`. The `gambit` handler deals damage, kills, spills packs and ends
fights -- and never branded, and carried no copy of the retaliation that
makes a struck citizen strike back. Measured: identical kill speed, no mark,
and no damage taken, because the victim never answered.

Every §2b enforcement hung off that one line, so a band that only ever sent
`gambit` was invisible to the law: no keeper refused them, no stone was
closed, prayer still covered them, and nobody was licensed to hunt them.
"A raiding party marks itself in public and cannot deny having been one" was
true of one verb out of two.

So the mark and the answer live here, and BOTH paths call it. A future third
way of hurting somebody will call it too, or it will be obvious in review
that it did not.

## 2b-v. Content-addressed

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:15666` by `spec-stubs.mjs`. Amends §2b.

§2b-v: CONTENT-ADDRESSED, like every other ground key here.

This was `g{tick}-{ground.length}` -- the only positional key
in the engine, where `drop` uses g{tick}-{pid}-{slot} and mob
drops use g{tick}-{mobId}-{i}-{item}. If the ground SHRANK
between two spills in one interval, the second reused the
first's key and destroyed it. Reproducible: a gambit kills
one citizen, somebody picks up an unrelated pile, an attackp
kills a second in the action phase, and the first citizen's
pack is simply gone.

Griefable, not merely wrong: inputs apply in sorted playerId
order, so a patient griefer can grind a key that sorts after a
killer's and delete other people's kills on purpose.

## 4b-ii. Every Hour Figure Written Above This Line Is Historical

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:6640` by `spec-stubs.mjs`. Amends §4b.

§4b-ii: EVERY HOUR FIGURE WRITTEN ABOVE THIS LINE IS HISTORICAL.

Notes throughout this file argue their numbers in hours -- "886 hours that
take fishing to ninety-nine", "an iron dagger 962 hours", "1,629 hours to
ninety-nine while every other trade sat near nine hundred". Every one was
true when it was written and none of them is true now, for two reasons that
compound:

  they say NINETY-NINE, and mastery is a hundred          x1.16
  the interval was 600ms and is a second (see TICK_MS)    x1.67

so an old figure understates today's by about 1.9x. The reasoning that USED
it -- this trade sits beside that one, this gate costs ten hours in a
hundred and eighty -- is still sound, because both sides of every comparison
moved together. The arguments hold; the absolute numbers are archaeology.

Measured against this curve, at a second an interval, with a pack of twelve:

  prowess        2,047h    melee a beast
  earthcraft     2,212h    mine, smelt, smith
  sorcery        2,604h    alchemy bare-handed (1,555 with a heartwood staff)
  woodcraft      2,742h    chop and fletch
  shorecraft     3,266h    fish and cook
  marksmanship   3,592h    shoot, outranging what you shoot at
  wayfaring      1,021h surveying, 2,763h hauling plate, 8,334h hauling logs
  hearthcraft    priced by the market rather than the clock -- the grain has
  mourning       to come from somewhere, and buying it is not being unaided

Six trades inside 1.75x of each other, after a skill collapse, a doubled
interval and a flat sixty-four flesh. Nobody tuned that; it fell out.

## 5g-ii. The Root Over The Living

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:308` by `spec-stubs.mjs`. Amends §5g.

---------- §5g-ii: THE ROOT OVER THE LIVING ----------

The archive root exists so that archived citizens cost the tick nothing: the
engine never holds that tree, because whoever wants something out of it
brings the path and the root judges it.

The LIVING had no root at all, and that was the hole under everything else.
A world's state is hashed whole by `stateHash`, which yields no inclusion
proof, so a citizen could not demonstrate what they were without somebody
producing the entire state. That put a world's continuity back on whoever
still held a full checkpoint, which does not scale and is exactly the
dependency the archive root was invented to remove.

WHY THIS COSTS NO STATE. The reason the engine cannot hold the archive tree
does not apply here: the living are ALREADY in the state, every one of them,
under `players`. A root over them is therefore pure computation over data
the tick already carries, not a second copy of anything.

WHAT IT BUYS. Every living citizen, at every interval, has a proof available
of exactly what they were -- their own record and a few hundred bytes of
path -- which any node can check against a root that the world's own
certificate covers. They can keep it themselves. A world that dies suddenly
therefore costs nobody their life, and a citizen can return to a successor
years later carrying their own evidence, with nobody holding anything on
their behalf.

THE CONVENTION IS `_smtFold`'S, exactly. The levels, the empty-sibling
heights and the left/right rule are all taken from it rather than restated,
because a root built one way and proved another is a root that proves
nothing. `test/livingroot.test.mjs` holds the two against each other.

## 5i-iii. The Opening Step Is Taken Once

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:13169` by `spec-stubs.mjs`. Amends §5i.

§5i-iii: THE OPENING STEP IS TAKEN ONCE. A walk input takes its first step
in the input phase (below) and sets an ongoing action; the ongoing-walk
resolver later in THIS SAME tick would then step that fresh action a second
time, moving the body TWO tiles on the interval a run begins. The total
distance stayed right, so tests passed, but the opening tick jumped two
tiles -- which a window can only render as a teleport (a >1-tile move is by
definition not a walk). This set names the citizens who already stepped
from an input this tick so the resolver leaves them be until the next one.
It is a per-tick local, never part of state, so it changes no hash beyond
the engine's own (the movement rule itself is what changed).

## 5j-ii. And The Merge Did Not Need Paying For

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:5961` by `spec-stubs.mjs`. Amends §5j.

§5j: ONE BLOW, ONE PAYMENT. Attack, strength and hitpoints were three
numbers rising off the same event -- a landed blow paid the aim, the arm,
and the flesh, twice over in total. They are one skill now, and it is paid
once. `style` no longer decides where experience goes; it decides how the
blow lands, and nothing else. Choosing what to become is what a calling is
for, and it is a thing a citizen swears rather than a thing they grind.
§5j-ii: AND THE MERGE DID NOT NEED PAYING FOR. ONE, AND HERE IS WHY.

This constant was three for a while, on the argument that §5j collapsed
four ledgers into one without touching what a blow awards, and that combat
measured 3.3x short of the gathering trades at every rung.

THE MEASUREMENT WAS WRONG, and wrong in a way worth writing down, because
the same mistake is available to anyone who tunes from a test yard. The
harness stood a citizen in a camp of eight trolls and counted experience
over five hundred intervals. Trolls respawn in three hundred. So the camp
emptied -- eight beasts, then six, then four, then two -- and most of the
run was a fighter standing in a field with nothing in reach. That is not a
combat rate. It is a respawn timer with a fighter attached.

Measured against a beast that is actually there, prowess pays 5.6 an
interval at level thirty, 5.8 at fifty, 6.0 at seventy and 7.4 at ninety
-- ABOVE the gathering trades' 4.3, not a third of them. And the founded
island supplies it: the richest ground within twelve tiles sustains 27
experience an interval, four times what a fighter can consume, so combat
out there is bound by how fast you swing and not by what is standing near
you. At three it was seventeen to twenty-two an interval, four to five
times every other trade in the world.

Combat is also the only trade paid twice, in drops as well as levels: a
troll camp yields 0.64 coins an interval against a coal seam's 0.52. It
did not need a third stream.

The constant stays, at one, because the argument for its existence should
stay findable. See check-engine-rates.mjs.

## 5k-ii. And A Berserker Has To Be Worth Being

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:3541` by `spec-stubs.mjs`. Amends §5k.

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
the berserker paid -16 flesh for +2 damage. Modelled at mastery in quick plate
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

Measured at mastery, quick plate, quick-sword: every pairing inside |z|<2 over
a hundred and twenty duels, and the three fights feel nothing alike. The
axis is the EXECUTE WINDOW rather than the win rate -- against the largest
gambit in the world a berserker is at 96% of their flesh, a fighter 72%, a
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
lives. Against the largest gambit burst in the world:

  berserker  48 flesh -> a 46-burst is  96% of them
  fighter    64 flesh ->                72%
  warden     72 flesh ->                64%

A berserker at full health can be ended by one good gambit. Nobody else can.
They also win closer: sixteen flesh left on an average win against a
fighter's twenty-one. Powerful and fragile, in the numbers rather than the
name.

## 5k-iii. The Nine Generic Craft Words Are Gone

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:6867` by `spec-stubs.mjs`. Amends §5k.

6ch: waystoneStandingFor removed with the stones.
§5k-iii: THE NINE GENERIC CRAFT WORDS ARE GONE.

`CALLINGS` named one word per craft -- woodwright, smith, shorekeeper,
mourner, archer, alchemist, wayfarer, hearthkeeper, fighter -- and was what
a citizen was called before §5k gave them an oath to swear. Its own comments
said the finer words were "parked until §5k, where they come back as things
a citizen swears", and they did: `SWORN` holds seventeen of them.

It outlived its purpose badly. FIVE of the nine are also callings somebody
can swear, so the word could not be told from an oath -- `serve.mjs` had to
ship the raw oath beside it because "a citizen who swore it and a citizen
who merely has the most experience there read identically". And once
`callingOf` stopped guessing a trade for the unsworn, the other four could
no longer be anybody at all: nothing in the world could ever be called a
woodwright, a shorekeeper, a wayfarer or a hearthkeeper.

Removed rather than left sitting, because a table nothing reads is read by
the next person as law. What a citizen is called is `callingOf`; which
trades a craft opens is `SWORN`.
Chosen by EXPERIENCE, not by level. Levels are a step function of xp, so the
skill with the most experience always holds the highest level too: comparing
xp settles ties between equal levels the way a citizen expects, and gives the
identical answer everywhere else. Ties in raw xp fall to the constitutional
skill order, so every node still answers the same.
§5k: THE CALLINGS A CITIZEN MAY SWEAR.

Nine trades, seventeen callings. Merging the skills (§5m) took ten good
words out of the world -- forester, firekeeper, fletcher, miner, fisher,
cook, farmer, brewer, berserker, warden -- because a DERIVED calling cannot
tell a berserker from a warden once one number covers both. They come back
here, and they come back better: as a thing a citizen says about themselves
rather than a thing computed from whichever of their numbers is highest.

This is what the merges were for. A skill says how much you can do; a
calling says what you are.

`health` is the flesh a calling carries against HEALTH_FLAT (§5j). Only prowess
spends it, because only prowess has two answers to the same question: the
berserker trades frame for the arm, the warden the reverse, and the fighter
takes neither bargain. Every other calling is 0 -- a cook is not tougher
than a fisher, and pretending otherwise would make swearing a stat check.

## 5n. And The Fire Earns Its Keeper When Somebody Cooks At It

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:16825` by `spec-stubs.mjs`.

§7s: AND THE FIRE EARNS ITS KEEPER WHEN SOMEBODY COOKS AT IT.

Without this the quayside fire is a charity. A firekeeper stands in
the Greenwood because that is where the logs are; asking him to
carry them to the docks and burn them for other people's dinners is
asking him to work for nothing, and he will not, and the fire will
never be there. He needs the crowd to be his income.

So a cook at a citizen's fire pays that citizen. Site your fire
where the fishermen are and the fishermen pay for it -- the same
bargain as a stall on a road, which is sited for the traffic and for
no other reason. This is what makes "fire plz" a thing somebody
WANTS to hear.

## 5o. A Master Presses Two Sigils From The Same Three Stones

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:15978` by `spec-stubs.mjs`.

§5z: A MASTER PRESSES TWO SIGILS FROM THE SAME THREE STONES.

The obvious boon was "a master casts without spending the sigil", and
it has a trap in it: sorcery's experience COMES FROM spending sigils
(XP_SPEND_SIGIL), so a master who stopped spending would stop earning
and be quietly frozen out of the tail past a hundred that §5o just
gave a purpose. Pressing two keeps the spending, and the earning,
and is the same "two where others take one" every other trade has.

## 5r-iv. And How Much Of The Island A Citizen Must Have Seen First

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:6936` by `spec-stubs.mjs`. Amends §5r.

§5r-iv: AND HOW MUCH OF THE ISLAND A CITIZEN MUST HAVE SEEN FIRST.

Swearing is the one irreversible decision in a life here. It fixes the only
craft that may ever reach a hundred, and §5k caps every other at seventy for
ever. Measured against the levelling curve, level fifty arrives after about
an hour and three quarters of work -- a bit over one day's allowance -- so a
citizen could be asked to choose their calling on their second evening,
having stood at one rock the whole time and seen nothing of the island.

A LEVEL IS THE WRONG PREREQUISITE FOR THIS, and raising it would not help:
grinding one craft to sixty-five teaches a citizen nothing about the other
eight, and the thing they lack is not practice but acquaintance with the
world they are choosing a place in.

So the second half of the door is TRAVEL. The island has seven countries a
citizen can stand in, and they must have stood in this many before they may
swear. It cannot be ground in one spot, which is the whole point, and the
world records it as they walk rather than asking them to declare it.

FIVE, and not seven, because two of the seven are the Wilds and the Moor --
where anybody may hunt anybody, and where the King's dead walk. A door that
required those would send every newcomer somewhere they will be killed in
order to take up a trade. Five is exactly the peaceful island, all of it,
and leaves the dangerous two as a choice rather than a toll.

Measured on the founded island: the cheapest tour of five countries from the
spawn is 392 tiles, about six and a half minutes of pure walking, through
the Heartlands, the Downs, the Fens, the Greenwood and the Crags. That is
not a chore; it is one afternoon's wandering, and a citizen who has done it
knows where the furnace is.

## 5w. The Grades, And Why 'apprentice' Moved

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:7050` by `spec-stubs.mjs`.

§5w: THE GRADES, AND WHY 'APPRENTICE' MOVED.

Apprentice used to mean "below fifty", which is a number, and everyone was
one by default: a word that applies to everybody describes nobody. It now
means SOMEBODY TOOK YOU ON: a state another citizen consented to, and one
they are spending a slot on. What everyone starts as is a newcomer.

  newcomer    unsworn, unattached
  apprentice  unsworn, but taken on by a master
  journeyman  sworn
  master      at MASTERY in the trade they swore to
§5x: THE RITUAL. YOU ARE NOT A MASTER UNTIL YOU HAVE MADE ONE.

Reaching MASTERY makes a citizen ELIGIBLE. What makes them a master is having
raised somebody to their own swearing: the old guild rule, where a
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

An alt can do it: two hours to fifty and a swearing before yourself, and
that is the correct price rather than a hole. It is also LEGIBLE: the
lineage is signed and public, and a master whose only apprentice appears
nowhere else has told everybody what they did.

Nothing new is stored. `raised` already exists and is already minted only by
finishing, so proof is derived, and no citizen can be given it.

## 5x. The Ritual

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:7061` by `spec-stubs.mjs`.

§5w: THE GRADES, AND WHY 'APPRENTICE' MOVED.

Apprentice used to mean "below fifty", which is a number, and everyone was
one by default: a word that applies to everybody describes nobody. It now
means SOMEBODY TOOK YOU ON: a state another citizen consented to, and one
they are spending a slot on. What everyone starts as is a newcomer.

  newcomer    unsworn, unattached
  apprentice  unsworn, but taken on by a master
  journeyman  sworn
  master      at MASTERY in the trade they swore to
§5x: THE RITUAL. YOU ARE NOT A MASTER UNTIL YOU HAVE MADE ONE.

Reaching MASTERY makes a citizen ELIGIBLE. What makes them a master is having
raised somebody to their own swearing: the old guild rule, where a
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

An alt can do it: two hours to fifty and a swearing before yourself, and
that is the correct price rather than a hole. It is also LEGIBLE: the
lineage is signed and public, and a master whose only apprentice appears
nowhere else has told everybody what they did.

Nothing new is stored. `raised` already exists and is already minted only by
finishing, so proof is derived, and no citizen can be given it.

## 5x-ii. Which Citizen This Is, Without Relying On A Field They Do Not Have

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:7105` by `spec-stubs.mjs`.

§5x-ii: WHICH CITIZEN THIS IS, WITHOUT RELYING ON A FIELD THEY DO NOT HAVE.

This compared a master's apprentice list against `p.id`, and a player
object in this world carries no `id`: they are the KEYS of `state.players`
and nothing copies the key onto the value. So the comparison was
`who === undefined`, 'apprentice' could never be returned, and a citizen a
master had taken on read `newcomer` for ever -- while the handbook
documented apprentice as one of the four ranks.

It worked from `serve.mjs` alone, because that one caller happens to know
to pass `{ ...p, id: pid }`, and nothing said it had to; `mourner.mjs`
passes a bare player and has been getting the wrong answer.

So the id is a parameter now, and when it is not given it is found: by the
caller's own `id` if they still set one, and otherwise by looking up which
key of `state.players` holds this very object.

## 5y. What The Tail Past A Hundred Is For

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:7030` by `spec-stubs.mjs`.

§5w: TEACHING. A master may take a citizen on, and the swearing that follows
carries the master's mark for ever.

APPRENTICE_SLOTS is small on purpose. A master with three apprentices is
making a commitment; a master with forty is running a mill, and the word
stops meaning attention. APPRENTICE_LAPSE is the only clock this needs: a
student who finishes FREES THEIR OWN SLOT by swearing, so the timer exists
solely for the one who drifts away and never comes back.
§5y: WHAT THE TAIL PAST A HUNDRED IS FOR.

Your own trade has no ceiling and XP_TABLE runs to 171, so there is no
completion state, but the levels did nothing except count. Measured from the
gather formula, 105 is a month past mastery, 110 is three, 120 is sixteen. So
milestones live at 105 and 110; anything at 120 is decoration for people who
will never see it.

They must not multiply throughput: the same argument that killed the calling
rate: a rate scales automation, and past-mastery play is the most automated
play there is. So the tail buys CAPACITY FOR OTHER PEOPLE instead. A very deep
master is visibly a school.

## 5z. A Master Fighter's Arm Comes Back Sooner

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:15748` by `spec-stubs.mjs`.

§5z: A MASTER FIGHTER'S ARM COMES BACK SOONER.

Prowess has no seam and no recipe, so there is no yield to double:
and the two obvious boons both fail the test the other five pass.
Dual wielding and a second blow are MULTIPLIERS, and a multiplier in
a fight is a balance problem before it is a reward: it changes what a
master does to another citizen, not what a master is worth.

Recovery is rhythm rather than damage. A master hits exactly as hard
as anyone else and no more often in the ordinary exchange: the
cadence gate below is untouched, but the GAMBIT, the once-in-a-while
blow this trade is defined by, is ready again a quarter sooner. It is
visible to whoever they are fighting, which is the point.

## 6af-ii. The Cost

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:15727` by `spec-stubs.mjs`. Amends §6af.

THE COST: the arm is spent for this cycle AND the next
§6af-ii: THE COST, and it must be the cost the VALIDATOR quoted.

The validator checks the arm against `state.tick`; this runs after
`s.tick = state.tick + 1`, so writing `s.tick + every` charged
every + 1. A gambit quietly cost an interval more than the rule
said, and the extra interval refused a legitimate second blow in a
way indistinguishable from lag -- exactly the failure §6b names for
the old hardcoded bow reach.
§6af: THE COST -- this cycle and the next, which is what makes the
gambit exactly neutral over time and a burst in the moment. Written
against the validator's tick, not the advanced one (defect 1.3).

It is also what stops `now` chaining: the arm is spent INTO THE
FUTURE, so a second gambit cannot follow. One interruption, then
the full price -- which is what §6af always said and what the pool
quietly undid.
`now` is gated on `lastSwing <= tick`, not on the full cadence, so
its recovery must be written ABSOLUTELY. Netting the cadence out of
it -- as every other gambit requires -- let the mell fire twice as
often as its own rule allowed: 208% of neutral, measured.

## 6af-iii. A Burst Is A Compression, And The Pause Is Its Price

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:15550` by `spec-stubs.mjs`. Amends §6af.

§6af-iii: A BURST IS A COMPRESSION, AND THE PAUSE IS ITS PRICE.

`twice` gave two blows for two intervals of arm: neutral, but a burst
of twelve per cent of a health bar, which is a rounding error and not
a moment. Blow COUNT and RECOVERY are now both read from the table and
move together, so a bigger burst buys a longer hole and the damage
over time never changes.

Measured: burst-per-recovery-interval lands on each weapon's own
ordinary damage rate, which is what neutrality MEANS. No gambit can
be stronger than another; the ordering only mirrors the weapon table,
so balance stays in one place.
§6af-iv: AND THE HEAVY WEAPON COMMITS HARDER.

At a shared recovery the burst is dps x recovery, so the DAGGER --
best damage rate of anything carrying a gambit -- owned the biggest
burst, while the mell, whose single blow is the largest in the world
at seventeen, had the smallest. Backwards. The mell now buys a rarer,
heavier commitment instead: eight blows for twenty-four intervals of
arm, the largest burst anybody can throw and the longest hole to
stand in afterwards. Neutral all the same.

AND THE COUNT IS SET AGAINST THE COMBO, NOT THE GAMBIT ALONE. `now`
is the one gambit that can INTERRUPT -- it is gated on a spent arm
rather than a recovered one -- so an ordinary blow lands and the
gambit drops on top of it the very next interval. Measuring the
gambit by itself misses the whole point of the weapon. Measured as
the pair: eight blows put 89% of a health bar into two intervals,
which is a one-shot wearing a gamble's clothing. Five puts 70% there,
so there is a line to hold above and a real fight below it. A dagger
cannot do this at all -- `twice` waits for the arm, so its ordinary
blow and its gambit can never share a moment.

## 6af-iv. And The Heavy Weapon Commits Harder

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:15562` by `spec-stubs.mjs`. Amends §6af.

§6af-iii: A BURST IS A COMPRESSION, AND THE PAUSE IS ITS PRICE.

`twice` gave two blows for two intervals of arm: neutral, but a burst
of twelve per cent of a health bar, which is a rounding error and not
a moment. Blow COUNT and RECOVERY are now both read from the table and
move together, so a bigger burst buys a longer hole and the damage
over time never changes.

Measured: burst-per-recovery-interval lands on each weapon's own
ordinary damage rate, which is what neutrality MEANS. No gambit can
be stronger than another; the ordering only mirrors the weapon table,
so balance stays in one place.
§6af-iv: AND THE HEAVY WEAPON COMMITS HARDER.

At a shared recovery the burst is dps x recovery, so the DAGGER --
best damage rate of anything carrying a gambit -- owned the biggest
burst, while the mell, whose single blow is the largest in the world
at seventeen, had the smallest. Backwards. The mell now buys a rarer,
heavier commitment instead: eight blows for twenty-four intervals of
arm, the largest burst anybody can throw and the longest hole to
stand in afterwards. Neutral all the same.

AND THE COUNT IS SET AGAINST THE COMBO, NOT THE GAMBIT ALONE. `now`
is the one gambit that can INTERRUPT -- it is gated on a spent arm
rather than a recovered one -- so an ordinary blow lands and the
gambit drops on top of it the very next interval. Measuring the
gambit by itself misses the whole point of the weapon. Measured as
the pair: eight blows put 89% of a health bar into two intervals,
which is a one-shot wearing a gamble's clothing. Five puts 70% there,
so there is a line to hold above and a real fight below it. A dagger
cannot do this at all -- `twice` waits for the arm, so its ordinary
blow and its gambit can never share a moment.

## 6af-v. And Blow Count Is The Variance Of A Burst

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:15491` by `spec-stubs.mjs`. Amends §6af.

§6af-v: AND BLOW COUNT IS THE VARIANCE OF A BURST.

Every gambit's blows were set for its CEILING, and nobody noticed
that the same number sets its RELIABILITY. Six blows of twelve and
two of thirty-six carry the same burst and are not the same weapon:
the first reliably takes a chunk, the second either ends the fight or
wastes the recovery. Measured, style is worth twenty points of
execute threshold at two blows and nothing at all at six -- six rolls
average their own spread away.

So the mell, whose whole identity is the largest single blow in the
world, becomes a HAYMAKER: two blows at two and a half times, which
is the same expected burst on the same recovery of ten. The dagger
stays a flurry. A citizen now picks a shape as well as a weapon.

## 6af-vi. And A Haymaker May Not Be A One-shot

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:2998` by `spec-stubs.mjs`. Amends §6af.

§6af-vi: AND A HAYMAKER MAY NOT BE A ONE-SHOT.

`bite: 2` was set when a quick-mell's hit was 7. At 13 the same multiplier
makes a per-blow maximum of 46, and `now` is the gambit that can land ON
TOP of an ordinary blow -- so the pair reached 104 against a citizen with
99, measured, in about one combo in twelve hundred. A weapon that removes a
full bar from full health in two intervals is not a gamble, it is a coin
that sometimes deletes somebody.

Bite and recovery move TOGETHER or neutrality breaks: at 1.6 alone the mell
fell to 77% of its own ordinary damage. The pair is 1.5 and six.

AND IT IS THE SAME PAIR ON BOTH MAULS. They were briefly 1.6/7 and 1.4/6 --
not because a great-mell swings differently, but because each was lowered
only until it stopped one-shotting and then left there. `hit` already says
one is bigger than the other (sixteen against thirteen); a second number
saying it again is two rules for one weapon class, and a reader would go
looking for the distinction it draws. There is none.

## 6af-vii. And The Bursts Were Tuned Against Ninety-nine Flesh

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:2983` by `spec-stubs.mjs`. Amends §6af.

§6af-vii: AND THE BURSTS WERE TUNED AGAINST NINETY-NINE FLESH.

Every blow count and recovery in this table was set when a citizen carried
ninety-nine hitpoints and they grew with a skill. Flesh is FLAT SIXTY-FOUR
now (§5j) and no skill feeds it, so the same numbers became one-shots:
measured, four of the seven gambits could take a citizen from full health
to nothing in a single interval, and the handgonne did it in all three
styles. A burst that always kills is not a gamble, it is a delete button.

Scaled to the new flesh, the worst case across every weapon and style now
falls between sixty-three and eighty per cent of a bar -- enough to end a
fight somebody was already losing, never enough to end one they were not.

## 6ah. And A Sigil In The Binding

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:16321` by `spec-stubs.mjs`.

§6ah: AND A SIGIL IN THE BINDING.

Woodcraft's endgame -- the finest bow and the finest stave in the world
-- was made from two logs by somebody who never left the safe country.
Every other thing of that rank costs the Wilds: quick gear eats stones,
and every spell eats sigils, which ARE stones. The heartwood line ate
nothing, so the peaceful trades and the dangerous ones never had to
meet.

One sigil is three quick-stone, mined at seventy in the one place that
kills people. A fletcher who wants to sell staves must now buy from
somebody who goes in -- which is the whole point.

## 6ai. What A Dragon Is Worth To The People Who Killed It

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:4048` by `spec-stubs.mjs`.

§6ai: WHAT A DRAGON IS WORTH TO THE PEOPLE WHO KILLED IT.

Four hundred and twenty health, twenty-eight a blow, and it
dropped two bones and an ore -- less than a skeleton knight. It
is not a fight one citizen wins, and everything it gave was a
bow that ONE of them could carry and that goes home in twelve
hours. There was nothing for the others to divide.

Six quick-stone and a set of dragon-bones. The stones are the
Wilds' own currency, so a party splits something every trade in
the world wants; the bones are the only ones worth more than a
goblin's, which gives the longest road in the world -- prayer,
fourteen hundred hours -- a reason to come here.

## 6aj. Unmaking At Range

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:4219` by `spec-stubs.mjs`.

§6aj: UNMAKING AT RANGE, which is denial and not theft.

A citizen falls and their pack spills; the one who felled them walks over to
take it. Five tiles away, an alchemist with a heartwood stave burns a sigil
and the pile is simply GONE -- the plate, the sword, the stones. Nobody gets
them. The caster least of all: no coin comes of it, because the thing was
unmade rather than sold, and unmaking somebody else's spoil should never be
a living.

A sigil is three quick-stone out of the Wilds, sixty gold of materials that
no keeper will sell, against the seven gold a beginner's goblin drops. It
costs nine times what it would deny them, so it cannot be used to torment
newcomers -- and against a quick-plate on the ground it is very much worth
doing, which is the fight where it belongs.

§6bn: THE INSTRUMENT MOVED. It was the heartwood stave, and the heartwood
stave is the ALCHEMY PACE staff -- two intervals against three, the whole
reason to walk to woodcraft ninety. So the fastest tool for the day's work
also carried the one verb that destroys another citizen's goods, and every
alchemy master was armed with it whether or not they ever wanted to be.
Nobody chose `unmake`; it arrived with the tool they were carrying anyway.

The wand shows the shape this world already had for it: a pure verb item,
no cadence at all, worth six coins. `unmake` belongs on that side of the
line, so it now lives on the goo staff -- which is a verb item and nothing
else, and which comes off the great-spider rather than off a bench.

The heartwood stave keeps its job. Two intervals against three is still the
whole of what its four hundred and ninety-five gold buys.

## 6ak. A Tree Does Not End At One Log

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:838` by `spec-stubs.mjs`.

§6ak: A TREE DOES NOT END AT ONE LOG.

A node gave one thing and slept, so two citizens at one tree was a RACE:
the first took the log and the second found it asleep. A resource nobody can
share is a resource that pushes people apart, in a world whose best moments
are the ones where they meet.

And it made gathering mostly walking. The nearest other tree is 2.8 tiles
off, so at woodcraft 57 with an iron axe a log was 2.3 intervals of
cutting and 2.8 of shuffling to the next trunk -- fifty-five per cent of the
work was travel between things that are identical.

So a node yields until a roll retires it: one success in four. No new field
on the node, nothing to migrate, and the same beacon that decides every
other chance in this world decides this one. A tree gives four logs on
average, sometimes one, sometimes nine -- which is how a tree behaves.

## 6al. A Stall Nobody Tends Falls Down

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:13585` by `spec-stubs.mjs`.

§6al: A STALL NOBODY TENDS FALLS DOWN, and its shelf spills where it
stood. Three days. The state is public, so everybody can read the clock
on somebody else's stall -- an abandoned one with a fortune in it becomes
an appointment, and if it stands in the Wilds, an appointment where the
other guests may kill you.

## 6am. You Cannot Be Paid Twice For One Interval

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:1825` by `spec-stubs.mjs`.

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
`attackp`. The `gambit` handler deals damage, kills, spills packs and ends
fights -- and never branded, and carried no copy of the retaliation that
makes a struck citizen strike back. Measured: identical kill speed, no mark,
and no damage taken, because the victim never answered.

Every §2b enforcement hung off that one line, so a band that only ever sent
`gambit` was invisible to the law: no keeper refused them, no stone was
closed, prayer still covered them, and nobody was licensed to hunt them.
"A raiding party marks itself in public and cannot deny having been one" was
true of one verb out of two.

So the mark and the answer live here, and BOTH paths call it. A future third
way of hurting somebody will call it too, or it will be obvious in review
that it did not.

## 6am-ii. And The Skills Have The Names The World Uses

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:2986` by `spec-stubs.mjs`.

§6am (v6): STAR IS THE ENDGAME NOW. With a mid tier filling the middle of
the road (mid-ore and mid-wood at thirty-five), quick rises to where it was
always meant to be -- the ninety-tier gear, forged from the quick-stone a
citizen carries out of the Wilds, so that reaching mastery finally buys
something to WEAR. The shape is the constitution's; these numbers are this
world's, and a v5 world (no gearReqs) keeps the old ladder to the byte.
§6am-ii: AND THE SKILLS HAVE THE NAMES THE WORLD USES.

This table named six skills that do not exist: `defence`, `attack`,
`woodcutting`, `mining`, `smithing` and `magic`, from before the nine
crafts were named. A requirement on a skill a citizen cannot have reads
`effLevel(undefined)`, which is ONE, so every line of it was `1 >= 80` and
false for ever.

The whole quick tier was therefore unobtainable: measured, a citizen with
every one of the nine skills at two hundred million experience could not
wield a quick-sword, while an iron one went straight into their hand. The
endgame gear this founding exists to introduce -- "so that reaching
mastery finally buys something to WEAR" -- could not be worn or forged by
anybody, and nothing said so.

It is the third time this exact rename has bitten: §5r-iii lost twenty
levels of labour the same way, and mourning's own `PRAYER_KEEP` read a
skill called `prayer`. `validateGenesis` refuses an unknown skill here
now, so it is the last time.

## 6an. The Deep Broth

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:2822` by `spec-stubs.mjs`.

§6an: THE DEEP BROTH, and why it is eight rather than ten.

A deep fish already brewed -- into ordinary broth, five, the same as any
fish out of the shallows, so a master fisher's catch was worth no more in a
pot than a beginner's. This is the same shape as woodcraft ninety giving
heartwood where a lesser axe gives logs.

EIGHT, and not ten, because the cooked deep fish must stay worth cooking:
ten in one slot against eight that stacks is a real choice, and ten against
ten is not. The ladder stays evenly spaced -- ale four, broth five, a cooked
fish six, a deep broth eight, a cooked deep fish ten -- with no gap wide
enough to make the rungs beneath it pointless.

AND IT IS NOT DOUBLED. A brewer of ninety draws two draughts from a pot, and
two eights would be sixteen against the cooked fish's ten, which would end
cooking as a trade. A deep fish makes ONE draught; there is no second in it.

## 6ao. Not In A Town

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:13062` by `spec-stubs.mjs`.

§6ao: NOT IN A TOWN. The incursion's whole job is that neighbours
notice and come, and it hits softly so they safely can -- but a town
is where this world promises nothing may strike you (§6dd says so of
the well, §6al of a stall). A thing walking out of the dark into the
middle of Anchor breaks the one place that was safe, and it does it
to whoever happened to be standing at a counter rather than to
somebody who chose to be out.

Checked on the SEAT, not the target: a citizen just outside a town
may still be answered, and one inside it is simply not seated, so
the roll passes with nothing spawned. That is the correct outcome
and not a missed event -- §6bv already says an unanswered incursion
is a story, and an unspawned one costs a citizen nothing.

## 6ap. Armour Is Not A Subtraction

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:5289` by `spec-stubs.mjs`.

§6ap: ARMOUR IS NOT A SUBTRACTION.

SOAK took a flat two a piece off every blow, against a maxHit that never
passes about fourteen. That halved damage at ninety-nine and approached
immunity below it, and it made a quick-clad duel a minute of uninterrupted
swinging for single-digit hits: "2, 2, 2". A miss is dramatic; a two is not.

Armour now makes you HARDER TO HIT rather than harder to hurt. The same
duel lasts about as long -- sixty seconds against the sixty-six it took
before -- but it reads as "miss, miss, THIRTEEN", which is a fight.

It also repairs the mell without touching the mell: its whole problem was
that low accuracy was punished twice, once in the roll and again by a soak
its slow cadence could not out-pace.
§7l: a full quick suit is helm 16 + plate 24 = 40, which is the ceiling the
bare-blade measures against.

THE CURVE IS NOT A LINE, and the reason is a measurement. A flat
floor((40 - armour) / 4) gave +10 naked and +5 in iron, and the duels said
the middle beat both ends: naked won 40% against a quick-clad quick-sword,
and the SAME blade over an iron suit won 45%. Half the bonus plus real
protection was the optimum, so a weapon meant to ask "will you strip?"
was really asking "will you wear medium?" -- a duller question, and not the
one it was built for.

Squaring it puts the whole bonus in the last few points of armour. A citizen
in nothing keeps ten; one in a leather cap has already lost a third of it;
iron keeps two. The choice is now the one the design promised: bare, or not.

  armour   0    8   16   20   25   30   40
  bonus   10    6    4    2    1    0    0

## 6ap-ii. And The Beasts Are Rolled For The Same Way

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:17523` by `spec-stubs.mjs`.

§6ap-ii: AND THE BEASTS ARE ROLLED FOR THE SAME WAY.

Only the mob-strikes-citizen half was moved to the ratio. This half was
left on `clamp(128 + 4*(atk - def) + acc)`, so the twenty-eight level
plateau still existed against everything with teeth, and a weapon's acc
was read on the additive scale here and the multiplicative one in the
Wilds. The same steel cannot mean two things.

## 6aq. Repealed

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:5420` by `spec-stubs.mjs`.

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
orders identically -- quick full 73/96 against 78/96, and every loadout in the
same place -- so three rules, a state field and two off-by-one bugs bought a
difference that does not appear in the numbers. What they did buy was a
citizen who could be run down for wearing a helmet.

The armour VALUES stay. They belong to the roll (§6ap), where a suit makes
you harder to hit rather than harder to hurt, and that fix stands on its own.

## 6as. Strength Is Its Own Skill

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:615` by `spec-stubs.mjs`.

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

## 6as-ii. Strength'

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:17533` by `spec-stubs.mjs`.

§6as-ii: and the blow is STRENGTH's here too, or the only place to
raise a max hit would be on other citizens.
6bu: A FLOOR OF THREE, which touches the bottom and nothing else.

A newcomer holds 22 gold. The arms stall sells the iron-dagger at 16,
the spear at 28, the sword at 30 -- so the ONLY weapon they can buy
has hit 0, and `1 + floor(1/10) + 0` is one. `dmg = 1 + (roll % 1)`
is then ALWAYS EXACTLY ONE: never a two, never a lucky blow, for the
first several hours. Attack was 27 minutes to level five where every
other trade in this world takes three, and a beginner who never sees
a different number is not playing a combat system, they are watching
a subtraction.

A FLOOR rather than a larger base, deliberately. `3 + floor(str/10)`
would have added two to every max hit in the world, including a
master's quick-mell at ninety-nine -- eleven per cent more damage in
every duel, and a retune of a system that is correct at the top. The
floor binds only while `floor(str/10) + weapon.hit < 2`: a dagger or
bare hands under strength twenty, which is a newcomer and nobody
else. Buy a sword and it has never applied to you.

## 6as-iii. Where The Lesson Goes Is The Citizen's Choice, Not The Weapon's

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:5615` by `spec-stubs.mjs`.

§6as-iii: WHERE THE LESSON GOES IS THE CITIZEN'S CHOICE, NOT THE WEAPON'S.

Splitting a blow evenly is a sane default and a poor ceiling: measured at a
matched experience budget, roughly sixty attack to ninety strength is the
best melee anybody can bring against a lightly-armoured citizen (3.42 a
tick against 3.07 for an even build), while about eighty to seventy is what
beats a quick-clad one (1.36 against 1.27). Two different characters, and
the even split reaches neither.

Routing by WEAPON was the obvious alternative and it is a trap: the natural
strength weapon is the mell, second-worst damage in the world, so a citizen
would grind hundreds of hours with a weapon they do not want in order to
fight with one they do. It also binds two questions that are not the same
question -- what I swing, and what I am becoming -- and it has no honest
answer for the flail, the chain or the wand.

## 6as-iv. Style Shapes The Blow, Not Its Size

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:3363` by `spec-stubs.mjs`.

§6as-iv: STYLE SHAPES THE BLOW, NOT ITS SIZE.

A symmetric inset on the damage range: the MEAN is untouched, so no style is
stronger and none is a trap, and the SPREAD moves, so they are differently
USEFUL. Measured on a quick-sword: aim lands for 4-11 with a spread of 2.3,
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

## 6as-v. Eight, And Each Style Wins Somewhere

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:3604` by `spec-stubs.mjs`.

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

It was briefly twelve, on a measurement taken before the gambit bug was
found and sampled at only two defence levels, which missed the crossover
entirely and read as "force always wins". At twelve aim leads by thirty-one
per cent at mastery; at sixteen, forty-seven; at twenty, fifty-seven. The
trade only stays a trade at eight.

## 6au. A Maul Swings At The Same Speed As Everything Else

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:2951` by `spec-stubs.mjs`.

§6au: A MAUL SWINGS AT THE SAME SPEED AS EVERYTHING ELSE.

`every: 3` was flavour the arithmetic could not pay for. A blow is
1 + level/10 + hit, and the level term is shared, so a slower weapon can
only buy back its lost interval through `hit` -- which is FLAT, and
therefore distorts low levels far more than high ones. At ninety-nine the
mell landed 3.62 a swing against a dagger's 3.83 and took half again as
long to do it: 1.21 a tick against 1.92. Measured over sixty duels with
neither citizen using a gambit, that is 5:55. Not situational -- broken.

At `every: 2` with the same hit and the same poor accuracy it is 30:30
against the dagger, and it keeps every bit of its character: the largest
ordinary blow in the world at seventeen against the dagger's twelve, the
worst chance of landing it at forty per cent against fifty-nine, and the
only gambit that can drop on top of an ordinary swing. It is the swingy
weapon, not the slow one. The alternative -- `hit: 16` to make `every: 3`
pay -- was measured too, and it hands a level-forty citizen 1.69 a tick
where the honest build gets 1.22. A flat number is a low-level number.

## 6av. The Handgonne

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:3343` by `spec-stubs.mjs`.

THE DRAGONBOW (spec 6w). There is one, and there will only ever be one.
Reach 9 is the whole weapon: nothing else in the world touches past five,
so whoever draws it fights at a distance where almost nothing can answer.
Against a citizen in the Wilds that is not a duel, it is a decision made
before they knew it started.
§6w: THE LONG SHOT. The dragonbow reaches nine, further than anything
else in the world by four tiles, and had no gambit at all -- so its one
distinction was a number in a table.

It is not another 'flurry'. This world already has three gambits and they
are three different KINDS: two blows, off the rhythm, cannot miss. A
fourth should be a fourth kind, and the obvious one for this weapon is the
thing it alone can do.

'far' scales the blow with the distance it crossed. At arm's length it is
feeble -- worse than a dagger -- and at nine tiles it is the hardest blow
in the world. The bow's reach stops being a number and becomes the skill:
the shot you should not have been able to make is the one that kills.
§6av: THE HANDGONNE. Slow, short, wildly inaccurate, and it hits like
nothing else in the world -- a maximum blow of thirty-nine where the next
largest is fifteen. Measured at 1.54 a tick it sits mid-table among the
bows (heartwood 1.78, crossbow 1.57, sigil 1.51), and it loses to the two
best weapons in the game: 9:31 against an old-chain, 11:29 against a
dragonbow. Its `twice` is both barrels -- neutral like every other gambit,
with a ceiling near eighty on the roughly one load in nine where both land.

Four prototypes went into this and three were cleverer. A wind-up that
could be walked away from landed nothing in sixty fights; a wind that
survived walking killed a fleeing citizen thirty-three times in sixty and
repealed §2b-i doing it. The mechanism was never the interesting part. It
was `hit: 30`.

## 6av-ii. The Noise Belongs To The Gunshot, Not To Every Blow

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:14076` by `spec-stubs.mjs`.

§6av-ii: THE NOISE BELONGS TO THE GUNSHOT, NOT TO EVERY BLOW.

This read `d <= max(senses, GUN_NOISE)` for ANY maddened beast,
so eight tiles of pursuit -- written for a handgonne's report --
applied to a creature struck by an arrow, a sword or a javelin.
It silently repealed the archer's ladder written above: a goblin
that perceives THREE came for a citizen eight tiles off, so every
bow in the world was outranged by every beast in it. Measured, a
wooden bow at its full reach of four was closed on four times out
of four, and marksmanship trained at 0.03 an interval against
melee's 5.09 -- because a bow held adjacent IS melee, and pays
prowess. An archer could not train the skill they were using.

A beast that heard a gunshot still comes the eight, marked when
the shot was fired. Everything else comes exactly as far as it
perceives, which is what §6aa says and what the ladder needs.

## 6ax. A Vault Will Not Take A Hood

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:16473` by `spec-stubs.mjs`.

§6ax: A VAULT WILL NOT TAKE A HOOD.

Not to stop hoarding -- it cannot; a sleeping citizen in a town is a
twelve-slot vault that costs nothing. It is to force the CHOICE.
A hood that can be banked is a hood nobody ever risks, and one that is
never worn is one nobody ever sees, which is the entire point of it.
Owning one has to be a decision renewed every time you leave a town.
This is the dragonbow's rule, and its reason inverted: the bow is
refused so its bearer cannot opt out of being hunted; the hood is
refused so its bearer cannot opt out of being seen.
§7.3a: THE WHOLE SLOT, and the rate limit goes with it.

This banked ONE UNIT an interval, so a stack of twenty-five arrows was
twenty-five intervals at the counter. The justification for that rate
is written at `transmute`: one input an interval means a full pack is
twenty-odd intervals of STANDING STILL IN THE OPEN, and standing still
in dangerous country is a real thing to choose.

That argument is exactly right, and it is an argument about the WILDS.
A bank is in a town. Nothing may strike you there, nothing may be
taken, and no decision is on offer -- the twenty-five intervals buy no
risk and no choice, only waiting. §8 says patience is never the tax,
and a script does not mind twenty-five clicks, so the whole of that
cost fell on the person and none of it on the thing §8 worries about.

## 6ba. The Lots Are Drawn From This Tick's Deeds, Not The Last One's

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:13488` by `spec-stubs.mjs`.

§6ba: THE LOTS ARE DRAWN FROM THIS TICK'S DEEDS, NOT THE LAST ONE'S.

v0.38 folded the input digest into the beacon and left it in the state for
the NEXT tick. That closed long-range prediction and left a one-tick hole
open: a citizen who has applied tick T-1 holds `s.beacon` before signing
for tick T, so `roll(beacon, pid, tag)` for tick T is knowable at the
moment the input is chosen.

An executor -- and this world expects executors -- reads that byte and
acts only on the ticks that win. It skips the gathers that would deplete
its node, so a tree never sleeps; and with a gold seam it would stand
between two rocks and strike the gold one on precisely the ticks the gold
one pays, keeping full ordinary mining experience AND every nugget. The
entire cost of gold -- an hour forgone -- would evaporate.

So the chain advances at the TOP of the tick and everything resolves
against the new value. The digest covers every input applied this tick,
including other citizens', so the lots a citizen is trying to read are
reshuffled by the very deed they are reading them for -- which is exactly
what the v0.38 note claimed and the ordering quietly did not deliver.

Nothing is stored that was not stored before and no message changes: the
same value that used to be written at the end of tick T-1 is now written
at the start of tick T. It is the same chain, advanced in a different
place, and only a founding may change where.

## 6bb. A Wider Lot, Because One Byte Cannot Say 'rare'

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:7714` by `spec-stubs.mjs`.

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

## 6bk. One Bone In

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:16364` by `spec-stubs.mjs`.

§6bk: ONE BONE IN, one lesson -- so take ONE, not the slot. This
nulled the whole slot, which is right for a bone (they do not stack)
and silently destroys the rest of any stack that ever does. The
comment above already said "one bone in": the code took whatever was
there. Spending exactly what the yield is paid for costs nothing
today and cannot become a hole later.

## 6bp-ii. The First Tally Has Two Halves, And One Had Gone

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:8597` by `spec-stubs.mjs`. Amends §6bp.

---- §6bp-ii: THE FIRST TALLY HAS TWO HALVES, AND ONE HAD GONE ----

A tally stick is split and both halves are kept, which is the whole of what
the monument means: one at Anchor, one across the water on Shrine Isle,
and the founder's own key cut into the isle's half. The island has been
carrying ONE half since v7 was written.

It was seated and then swept. Probed: `tally-isle` goes in where it should
and is gone by the time the founding returns, and a landmark is CLEARABLE
by more than one later pass -- the plough clears scrub, a holding sweeps
its yard, a place corrects what it finds. Every one of those is right about
what it is for and none of them knows a tally from a tree stump. Chasing
the single line that took it would fix this founding and not the next
sweep somebody adds.

So it is seated HERE, last, after every pass that clears ground, which is
the discipline this file already states: "the later pass corrects what it
finds." And it is CHECKED, because a unique monument quietly absent looks
exactly like a unique monument nobody has walked to.

## 6br. And She Gives Up The Graver

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:3923` by `spec-stubs.mjs`.

THE SIREN (spec 6ac). The third thing, and the only one that FORBIDS a
party. The dragon needs one because you die alone; the spider needs one
because the arithmetic does not close; she will not have one at all.

She MIRRORS whoever engages her -- their combat levels, their weapon, and
their quiver as it stood at the moment she took their shape. So the fight
is exactly even, at any level, forever: it never trivialises and it never
gates. What breaks the tie is the one thing she cannot copy, which is
that you brought food and she did not.

`maxHealth` and `atk` here are only a floor for an unarmed opponent; almost
everything about her is read from the citizen at `bound` time.

`aggro` is what a beast can PERCEIVE, and she needs one or she perceives
nothing: senses default to zero, `d <= 0` is never true at any distance,
and she stood on her strand and never once swung back. Ten, because she
is looking out to sea and sees you coming a long way off -- and because a
mirrored archer must be answerable at their own reach, which can be nine.

§6br: AND SHE GIVES UP THE GRAVER, one kill in sixty-four. The mirror of
yourself is the source of the one item you cannot use on yourself, which
is the sort of joke this island's geography already tells.

She is ALONE on the island and comes back every twelve minutes, so even
camped without pause she mints under two a day. And she cannot be farmed
asleep: she copies your levels, your weapon and your quiver, so the fight
is exactly even at any level, forever.

## 6bs. The Brimstone Vents

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:6400` by `spec-stubs.mjs`.

§6bs: THE BRIMSTONE VENTS. The southern crags, where the iron and the coal
already are -- brimstone belongs with the working seams and not with the
patient wealth in the north, because it is a REAGENT and a master smith
will be coming back for it, load after load, for as long as they forge.

Safe country, deliberately. The great arms already cost fourteen quick
ingots, and quickmetal is Wilds work: asking the Wilds for the brimstone
too would be two dangers for one weapon, which is the mistake §6av names
about the handgonne's powder.

## 6bt. The Great Arms

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:3231` by `spec-stubs.mjs`.

§6bt: THE GREAT ARMS. Level seventy, where woodcraft, earthcraft and shorecraft
each got a mastery tool and combat got nothing at all -- attack's last
unlock was fifty-five and then forty-four levels of nothing to want.

They are NOT a fourth tier. A tier is a bigger number and would make
quickmetal a stepping stone; the `great` tools earn their place by ACCESS
(a great-hatchet fells a wood nothing else fells), and these earn theirs
the same way: they answer a defence rather than out-damage one.

  `breaks` -- the off-hand shield is not there. §6x gave the flail
  `pierces` against ARMOUR and reasoned that the answer to a defensive
  system belongs to people who have earned that system. A shield is the
  other defensive system and had no answer at all: a quick-shield takes a
  flat quarter off everything, forever, and nothing in the world could
  do anything about it.

  `burns` -- brimstone catches. Small, short, and it can never kill
  (§6bu). It is the only damage in this world that arrives on an interval
  the striker did not act on.

AND NO GAMBIT. The flurries and the bite belong to the quick line, and a
mastery arm that took those as well would retire five weapons at a
stroke. Quick strikes oddly; great strikes through.
§7dr: worse than anything else you could hold, and the only thing that
answers the dark before level sixty. `burns` is the whole of its worth.

## 6bu. Brimstone Catches, And The Fire Never Lands The Last Blow

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:2068` by `spec-stubs.mjs`.

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

## 6bv. And Whoever Puts One Down May Get The Horn

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:4129` by `spec-stubs.mjs`.

§6ao (v6): THE INCURSION. A thing that walks out of the dark, fixes on ONE
citizen, and takes a while to put down -- long enough that the neighbours
notice and come, which is the whole point. It hits SOFTLY (maxHit stays
low even scaled) so that anyone may safely turn and help; the danger was
never the point, the gathering is. High HP so the fight LASTS; a leash so
it can be led toward help or lost; and it despawns on a timer so an
unanswered one is a story ("it came, none came, it left") and never a
permanent fixture. Its maxHealth and def are SCALED to the target at spawn by
the event step; these are the floor a level-one target would face.
§6bv: AND WHOEVER PUTS ONE DOWN MAY GET THE HORN. The incursion exists so
that "the neighbours notice and come" -- it fixes on one citizen and takes
long enough that help can arrive. The reward for having answered a call
being the power to MAKE one is the tightest loop in this world: the item
is worth nothing to somebody alone, and everything to somebody who is not.
§6cz: maxHit LOWERED to 4 (was 8). The incursion's whole job is to last
long enough that neighbours come -- the danger was never the point, the
gathering is -- so it must be safe to turn your back on and go help someone
else's. It keeps its high HP (the fight LASTS) and its atk (so it connects),
but a single blow can no longer be frightening. Its drops are chosen PER
FACE (see INCURSION_FACE_DROPS) -- and no bones: a woodwraith or a drownling
is conjured of the country, not a beast with a skeleton to leave.

## 6bv-ii. And What It Teaches Follows What Came Apart

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:4355` by `spec-stubs.mjs`.

§6bv-ii: AND WHAT IT TEACHES FOLLOWS WHAT CAME APART.

The lesson was flat -- twenty for a log and twenty for a quick plate -- and
the note below the cast argued for it: value-scaling made "acquire and
destroy the most valuable gear in the world" the efficient road to magic,
which is a fighter's road to what was then the anti-combat skill.

Two things have changed. Sorcery is not the anti-combat skill any more: the
barrow-work (§7ce) is offensive, and it TAKES transmute away, so the caster who
wants to burn things and the caster who wants to unmake them are already two
different citizens. And the objection turns out not to survive arithmetic.
Measured, with the cost of OBTAINING the input counted:

  chop a log, melt it            8,000 xp per hour of labour
  mine 400 quick-stone,
    forge a plate, melt it         675 xp per hour of labour

A quick plate is four hundred and fifty times a log in price and about four
hundred times a log in labour, so scaling the reward against price very
nearly cancels against the cost of getting one. The two roads land within
two per cent of each other for a citizen's own hours, and melting plate is
twelve times WORSE per hour the world spends. Nobody strips the Wilds to
learn a spell; they chop logs, exactly as before.

What it buys is a real ITEM SINK at the top of the economy. Quickmetal put
into a plate can now leave the world again, which gives smiths ongoing
demand for the same reason the handgonne's bursting does (§6av). A citizen
who wants to unmake something magnificent may, and it is a choice rather
than a mistake.

THE GOLD IS UNTOUCHED. TRANSMUTE_PAYS is four whatever came apart, and it stays
four: one integer sets the money supply of this world (§6bv) and this is not
that integer. Only the lesson follows the loss.
(three quarters, the same share TRANSMUTE_SHARE/TRANSMUTE_OF names below -- written
out here because that pair is declared further down and this is only ever
called from the apply path, long after both exist.)

## 6by. The Mere-lamprey

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:4106` by `spec-stubs.mjs`.

§7cn: THE MERE-LAMPREY, and the first creature in this world that can be
USED UP.

§12c opened a door that can never be shut again: the South Pass, dug out by
whoever swung, and "every citizen who arrives afterwards lives in the world
they made and cannot join them in making it. That is a one-way door and it
is meant to be." This is the same door pointed the other way -- a thing the
island can SPEND -- and it is built out of the same two anti-farm
materials, calendar and appetite, because §12c is still true: identity is a
keypair and a threshold denominated in labour is denominated in the one
currency an executor has infinitely much of.

SEVEN OF THEM, sixty-four lives apiece. Not one boss with a counter: a
small named population that goes one at a time, because "there are three
left" is a sentence a world can say and "four hundred and eighty of five
hundred" is a progress bar. The first death barely registers. The fourth is
an argument. The last is `lasts`.

NOBODY DECIDES THIS. There is no vote, no committee and no seal to build --
which is the whole reason it is allowed to exist. §18a already works this
way: at most forty-one fall-stones, "the real number is the island's
decision", and no citizen ever cast one. Appetite decided. Each digger
wanted a stone and the sum of wanting ended the seam. A lamprey dies of
being wanted, every kill is somebody who came for spit, and there is no
villain anywhere in it.

AND WHAT IT LEAVES IS WALKABLE. When the last one is gone the mere is still
there and still empty. §12c's best line is that the road to the South Pass
still ARRIVES at rock; a reed-bed you can wade into with nothing in it says
more than a reed-bed that was never drawn.

The numbers: it kills a master in a shade over four minutes, which is the
band §6by set for the four things that are supposed to be dangerous. It is
not a boss. It is a hard beast in bad ground that four hundred and forty
eight people will each want a piece of.

## 6bz. Two Hands Or One, And What The Off Hand Holds

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:5393` by `spec-stubs.mjs`.

6bz: TWO HANDS OR ONE, AND WHAT THE OFF HAND HOLDS.

The quick-sword and the quick-mell sit in the same wield band, and measured
against an ARMOURED citizen they were already 87 intervals against 89 -- the
mell's -12 accuracy costing exactly what its +5 damage buys. That balance
was not designed and it is remarkably tight, so anything added here has to
preserve it.

A shield alone does not: any shield at all tips a coin-flip duel decisively
to the one-handed line. So the two arrive together. Two-handed arms gain six
to their blow; one-handed arms may carry a shield, which DIVIDES what lands.
At a quick shield's three-quarters the duel returns to 87 against 86.

A DIVISOR, NOT A BLOCK AND NOT MORE ARMOUR. More armour feeds the same
hitChance curve that already saturates, so a shield would be a number nobody
could feel. A block would need its own roll and would raise the question of
whether a blocked blow is a MISS -- which is what teaches defence, so it
would quietly retune a skill. A divisor touches neither the roll nor the
miss: what a defender learns and what an attacker learns are exactly what
they were, and the shield only changes what arrives.
§7cm: the bone spear is on the list because it is a spear. §6bz's trade is
the point -- reach and weight are bought with the off hand -- and a weapon
that gave a two-tile haft AND a quick shield would be answering a question
nobody asked it.

## 6cg. The Records

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:12920` by `spec-stubs.mjs`.

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

## 6ch. By Nodeid

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:12687` by `spec-stubs.mjs`.

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

## 6cz. Its Blow Scales To The One It Came For

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:13084` by `spec-stubs.mjs`.

§6cz: ITS BLOW SCALES TO THE ONE IT CAME FOR -- and since §5j this
scaling is DEAD, deliberately left standing.

It was written when hitpoints were a skill and a newcomer had ten, so
a flat 4 was a third of them. A tenth of the target's frame, capped at
the table's maxHit, meant a newcomer took 1 and a veteran took 4.

§5j made the frame FLAT at sixty-four for everyone. Sixty-four tenths
is six, capped back to four, so every citizen now takes four whatever
they are -- and that is correct, because four against a frame of
sixty-four is the "come help, never flee" this was reaching for. The
flat frame does the job the scaling was invented to do.

Left in place rather than replaced with the constant: a calling moves
the frame (§5k, the berserker at forty-eight) and the day one moves it
far enough, this starts working again on its own.

## 6cz-ii. The Hollow Bow Is Not Made

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:4755` by `spec-stubs.mjs`.

§7bq: bone and gut. A fletcher's first bow, and it costs no metal at all.
§6cz-ii: THE HOLLOW BOW IS NOT MADE. It was `{ bones: 4, logs: 1 }` at
woodcraft twelve, and that is four bones from beasts that sixteen of the
world's twenty-four drop, for a bow that is `noAmmo` and `selfAmmo` -- it
draws its own. Never buying an arrow again is the largest single thing a
ranged weapon can offer, and it was a day-one craft out of trash.

It also DROPS, from gibbet-dead at one in two hundred and fifty and from
skeleton-knight at one in a hundred and thirty-one, and while the craft
stood those drops were worthless: nobody waits five hundred kills for a
thing they can whittle in an afternoon. Removing the recipe does not take
the bow out of the world. It puts it back where the drop table already
said it was.
§7l: CHEAP ON PURPOSE. A weapon whose whole point is that you are wearing
nothing is a weapon carried by people with nothing to lose -- and by
pures, who never gear up and should not have to risk a fortune to train
the only build the world offers them. Steel, and not much of it.

## 6cz-iii. Twelve Hours, And It Is A Floor Rather Than A Rate

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:4032` by `spec-stubs.mjs`.

TWELVE HOURS, because the bow now lives exactly as long as the
dragon is dead. At six it changed hands fourteen hundred times a
year, which is a great deal of turnover for a thing whose rule
is that there is one. At twelve a tenure is long enough to plan
something with and short enough that two citizens a day get the
chance -- and the clock runs from the KILL, not a fixed hour, so
tenures drift across the day by themselves and no timezone ends
up owning the dragon.
§6cz-iii: TWELVE HOURS, AND IT IS A FLOOR RATHER THAN A RATE.
43,200 intervals is twelve hours at §1c's second, which is the
figure the prayer note below argues from and was written at.
It stood at 72,000 for a while, which was the same twelve hours
measured at RuneScape's 600ms and never rescaled -- §1c warned
that comments arguing a TUNING were left alone because both
sides of the comparison moved together, and here they did not:
the respawn is in intervals and scaled with the clock, the road
to a mastery is in experience and did not.

Nobody takes it at the moment it stands up, so the real supply
is well under two a day. That is the point of a floor: it bounds
what the world can pour out at its most generous, and everything
slower than that is the market's business rather than the
engine's.

## 6dj. The Height Of The Land, As Data

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:2839` by `spec-stubs.mjs`.

§6dj: THE HEIGHT OF THE LAND, AS DATA.

This field is not new and it is not decoration: it is what routed every
road in the world. `elevAt` charges six for every unit a step climbs, which
is why the roads follow valley floors, contour along hillsides and arrive
at passes rather than summits. The hills are already TRUE: they are the
reason the roads wander, and every window has been drawing flat ground
underneath a winding road and disagreeing with the world about why it winds.

Served on a four-tile lattice, because the field's finest octave is eight
tiles wide: sampling every fourth tile and interpolating between reproduces
it, and costs a thirty-second of a byte a tile instead of a whole one.

It changes NO tile's walkability and enters no geography hash. A window may
draw the land as it lies; whether a step should COST what it climbs is a
question for the spec and the engine, not for this table.

## 6m-ii. And It Costs A Swing

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:16665` by `spec-stubs.mjs`. Amends §6m.

§6m-ii: AND IT COSTS A SWING.

v0.32 said eating does not lower your guard, and the fight still
holds -- the ACTION is untouched, so nobody has to give an order
again. But swallowing something cost nothing at all: full healing
and a blow in the same interval, so a fight was decided by who
brought more food and never by when they ate it.

The arm is spent, exactly as a gambit spends it, so the next blow
comes a cycle later. One swing in eight -- the gullet allows no more
than that -- so it is a tempo cost and not a survivability one.

The RATE stays, and its reason has changed. It was written when
nothing in this world could kill anybody; now it is the only thing
stopping food from out-healing damage. Without it a citizen eating
every other interval restores three a tick against the two a sword
at ninety-nine lands, and fights become a question of who empties
their pack first.

A MENDING FROM SOMEBODY ELSE COSTS THE WOUNDED NOTHING, and that is
deliberate: twenty health and they never break rhythm. Fighting
in a pair should be worth something that fighting alone is not.

## 6m-iii. The Gullet Rhythm Is Repealed

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:1958` by `spec-stubs.mjs`. Amends §6m.

v0.73: the gullet has its own rhythm, as the arm does (§6b, lastSwing).
Without one, a citizen ate every interval while the fight held, and broth
heals 5 against a skeleton-knight's 2 health per interval at absolute maximum:
nobody carrying brews could die, so death, the Wilds and the brand were all
decoration. Eating mid-fight stays legal, as §6m intends. It simply has a
rate now, and that rate is what makes a beast dangerous to the unready.
§6m-iii: THE GULLET RHYTHM IS REPEALED.

It was written in v0.41 because nothing in this world could kill anybody,
and a citizen with brews ate every interval and was immortal. That reason is
long gone. What it was defended with afterwards -- that food would otherwise
out-heal damage -- does not survive arithmetic: the old chain lands up to
eleven EVERY interval, a mell gambit seventeen, the long shot thirty, and a
fish heals six. Nothing about eating has ever made a citizen unkillable
against anything that could really hurt them.

What is left is the cost that actually bites, and it arrived tonight: a meal
SPENDS THE ARM. Eat every interval if you like -- you will heal six and deal
nothing, and anybody serious will kill you anyway or simply walk off. The
brake is that eating is not fighting, which needs no constant at all.

The value stays for old states, which carry `lastAte`, and for nothing else.

## 6m-iv. And It Spends The Arm

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:16033` by `spec-stubs.mjs`. Amends §6m.

§6m-iv: AND IT SPENDS THE ARM, as a meal does.

A cooked fish restores six and costs a swing. A mending restored
TWENTY and cost nothing at all -- the `p.action = null` above belongs
to the stilling, not to this. So the best heal in the world was also
the only free one, which is backwards.

One rule covers both: whatever restores YOUR OWN health spends
your arm. Being mended by somebody else stays free to the wounded,
and that asymmetry is the whole reason to fight in a pair.

## 6m-v. A Richer Meal Is A Longer One

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:1975` by `spec-stubs.mjs`. Amends §6m.

§6m-v: A RICHER MEAL IS A LONGER ONE.

A flat rhythm made the heal value a RATE, and the rate is what decides a
fight. A deep broth restored one point of health an interval for ever -- against the
1.11 a quick-sword lands through quickmetal and the 0.62 a mell does -- so the
citizen with the stack could not be killed. Measured 0:12, and the burst
could not close it either: a finisher that removes half a health bar is no
answer to somebody who never falls below three quarters.

So the gullet asks in proportion to what it was given. Every food now
restores the SAME half a point an interval over time, and the heal value
buys something better than throughput: it buys the SIZE of one swallow, which
is how a wounded citizen leaves an execute window in a single interval.
A deep fish is still the best food in the world -- it lifts you ten in one
breath, out of reach of any burst -- it simply cannot also be a wall.

Below the weakest weapon in the world by a clear margin, so food lengthens a
fight and never decides one.
Tenths of an interval of gullet per point of health restored. At 25 every food
sustains 0.40 a tick, comfortably under the 1.11 a quick-sword lands through
quickmetal. Measured with both citizens fed and quick-clad: at the old flat
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

## 6m-vi. A Pack Runs Out

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:2001` by `spec-stubs.mjs`. Amends §6m.

§6m-v: A RICHER MEAL IS A LONGER ONE.

A flat rhythm made the heal value a RATE, and the rate is what decides a
fight. A deep broth restored one point of health an interval for ever -- against the
1.11 a quick-sword lands through quickmetal and the 0.62 a mell does -- so the
citizen with the stack could not be killed. Measured 0:12, and the burst
could not close it either: a finisher that removes half a health bar is no
answer to somebody who never falls below three quarters.

So the gullet asks in proportion to what it was given. Every food now
restores the SAME half a point an interval over time, and the heal value
buys something better than throughput: it buys the SIZE of one swallow, which
is how a wounded citizen leaves an execute window in a single interval.
A deep fish is still the best food in the world -- it lifts you ten in one
breath, out of reach of any burst -- it simply cannot also be a wall.

Below the weakest weapon in the world by a clear margin, so food lengthens a
fight and never decides one.
Tenths of an interval of gullet per point of health restored. At 25 every food
sustains 0.40 a tick, comfortably under the 1.11 a quick-sword lands through
quickmetal. Measured with both citizens fed and quick-clad: at the old flat
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

## 6t. Take Back Out Of A Bank

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:5599` by `spec-stubs.mjs`.

§6t: a chart is a thing a citizen can hold, so it is a thing they can
take back out of a bank. `deposit` takes a SLOT and `isItemName` accepts
charts, so one banked fine and `withdraw` -- which takes a name and
checked ITEMS only -- could never return it. Silent, permanent loss of a
survey reward, from two gates disagreeing about what an item is.

## 6x-ii. And The Accuracy Is A Ratio, Not A Clamp

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:5456` by `spec-stubs.mjs`. Amends §6x.

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
CHANCE, and the flail goes round that. A citizen in a full quick suit is as
easy to hit with a flail as a naked one -- which is what the weapon has
always meant, expressed in the new currency.

## 6y. The Sigil-bow Spends Half The Arrows

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:17489` by `spec-stubs.mjs`.

§6y: THE SIGIL-BOW SPENDS HALF THE ARROWS.

A quiver must still be in the pack -- you cannot shoot from an
empty one -- but on alternate draws nothing leaves it. The tick
decides which, not the citizen, so it cannot be timed: the Reading
Rule reaches arrows too.

## 7ab. The Moorgrave

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-places-v7.mjs:101` by `spec-stubs.mjs`.

A tower with no roof and no stair, four days' walk from anywhere, and
whoever built it is not on any list.
§7ab: THE MOORGRAVE. The one big place on Tallyholm.

Everything a citizen walks into here is small: a cottage is three by four,
the training yard is nine by six, the largest drawn place before this was
the Barrow Crown. That is a world of rooms and no HALLS, and a landscape
wants somewhere that takes a while to cross.

Twenty-nine by seventeen, on the open moor, on the road that runs up to the
Gibbet King -- so it is a thing you pass on the way to the worst fight in
the world, and a thing you pass again coming back with the bones. The
ossuary inside is the point: kill on the moor, bury on the way home,
consecrated. It closes a loop that had no middle.

Not the Boneyard again. The Boneyard is bones lying in the open Wilds where
nobody put them. This is a graveyard: walled, gated, laid out in rows, with
a mort-house and a mourner and yews at the corners. Somebody dug these.

## 7ac. Iron Railing

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:802` by `spec-stubs.mjs`.

§7ac: IRON RAILING. A rampart is a war wall -- earth and stone, the thing
Norwick's garrison stands behind -- and the Moorgrave was drawn with one
because it was the only long boundary the vocabulary had. A churchyard is
not a fort. Railing blocks like a wall and reads like a fence: you can see
through it, which is most of what a graveyard wall is for.

## 7af. The Generic Scatter Is Off

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:7643` by `spec-stubs.mjs`.

§7af: THE GENERIC SCATTER IS OFF.

This is the last scatter on an island whose seams, camps, holdings,
fields, works, residents and places are all hand-placed tables -- and it
shows. Three carts abreast. Four wells fenced into a two-by-two. A
standing stone every few paces of nothing.

The distinction that matters: A TREE CAN STAND ANYWHERE and read as
landscape, because nobody put it there. A cart cannot. A cart is
EVIDENCE OF A PERSON, and evidence of a person in a nonsensical
arrangement reads worse than bare ground -- it says the world was
generated, which is the one thing this island is trying not to say.

So all of it goes, and the country gets more trees instead (§7u), which
is the one kind that never looks placed by a machine. What remains is
hand-drawn or unique: the spider's web, the dragon's burnt ring, the
Drowned Bell, the capes, the mills, the clamp, the orchards, the works
and everything inside a drawing.

## 7ag. A Waymark Is For A Junction, Not For Every Wiggle

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:5686` by `spec-stubs.mjs`.

---- what the trails go around ----
§7ag: A WAYMARK IS FOR A JUNCTION, NOT FOR EVERY WIGGLE.

This put one at every road BEND, and a routed road bends constantly -- so
a winding stretch collected a mark every few tiles. Measured: 133 of them,
median nearest-neighbour distance FIVE tiles, minimum one, and seventy of
the hundred and thirty-three with another inside six. Whatever that is, it
is not "one thing every thirty-five tiles of road", and it is exactly why
the roadsides read as generated.

A mark means SOMETHING HAPPENS HERE: a fork, a ford, a county boundary, a
pass. So a bend qualifies only if nothing else has been marked within
twenty-five tiles -- which cuts a winding lane to one mark and leaves the
junctions, because a junction is a place a road actually turns toward
somewhere.

## 7ah. A Country Wants A Creature Of Its Own, And The Heartlands Want Peace

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-camps-v7.mjs:28` by `spec-stubs.mjs`.

---- SOURCE: worldgen-camps-v7.mjs ----
THE CAMPS AND LAIRS OF TALLYHOLM.

Seven hundred beasts scattered by rule is not a population, it is weather.
The resource seams on this island were designed as SCHELLING POINTS -- a few
remembered places a crowd converges on, rather than a smear of trees over
every wood -- and the beasts were the one thing still smeared.

So they are camps. A camp is a KIND, a MIDDLE, a COUNT and a SPREAD: "eight
goblins round the burnt croft", not eight coordinates. That is the unit a
person actually places, it is the unit that can be moved and thinned by
hand, and it is the unit a citizen remembers -- nobody says "there is a wolf
at 412,208", they say "the wolves are on the Hollybarrow road".

Baked once off the scatter and edited from there, the way the holdings were.
Capped on the way in, because the scatter put nineteen wolves in one clump
and a lair is six: the numbers here start at something a person would have
written rather than at something an accumulator produced.

The hand-placed spawns are NOT in this table and never were -- the beasts in
the eighteen places, the goblin pound, the scree-imps in the South Pass, and
the four named things (the dragon, the siren, the spider, the Gibbet King)
each have their own reason to be where they are.

  kind   what stands there
  x, y   the middle of the camp
  n      how many
  r      how far they spread from the middle
§7ah: A COUNTRY WANTS A CREATURE OF ITS OWN, AND THE HEARTLANDS WANT PEACE.

Four species did all the work across seven countries and overlapped so
completely that none of them belonged anywhere: skeleton-knights in the Wilds
AND in the meadow outside Anchor, trolls in the Crags AND the Wilds, goblins
in the Fens AND the heartlands. Meanwhile the Moor held the Gibbet King and
two sheep.

Seventeen camps moved home -- goblins to the Fens, skeletons to the Wilds,
wolves to the Greenwood, trolls to the Crags -- so the peaceful country is
peaceful, which is what a starting country is for and what the training yard
standing in it already implied.

And five creatures that belong somewhere: the BOAR charging in the Greenwood,
the MOUNTAIN-GOAT on the Crags (harmless, and the island had exactly two
things a pure could train on, both at sea level), the CARRION-CROW and the
BARROW-WIGHT over the Moor's graves, the FEN-ADDER in the wet. None of them
drops anything new. A creature that exists so the Fens do not feel like the
Downs is doing a job.

## 7ai. Ten Burials Make A Flask

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:16450` by `spec-stubs.mjs`.

§7ai: TEN BURIALS MAKE A FLASK.

An ossuary paid experience and nothing else, so consecrated ground
was a better rate and not a PLACE. Ten bones laid in it -- at the
Moorgrave, the monastery, or the Boneyard -- and the ground gives
something back: a flask of holy water.

It is the only thing in the world made by an act of respect rather
than by labour, and it is counted on the CITIZEN rather than the
node, so a burial in the Moorgrave and a burial at the monastery are
the same errand and neither place can be farmed by itself.

## 7aj. A Folded Flock

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-camps-v7.mjs:189` by `spec-stubs.mjs`.

§7aj: A FOLDED FLOCK.

Sheep were fifty-two head loose across the Downs, and a sheep on an open
hillside is wallpaper: you walk past it, you kill one in passing, it means
nothing. Penned, it is a PLACE -- you go to the Sheepfolds, you go IN, and
the fight is somewhere rather than everywhere.

The Sheepfolds have stood since the first week as six empty pens with a
shepherd beside them. Six empty pens. This is the same argument as the
goblin pound and the training yard: a thing behind a fence is a
destination, and a thing roaming loose is scenery.

A tight radius, so they stay in the pens they belong to.

## 7ak. A Few, Not A Ring

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:6783` by `spec-stubs.mjs`.

§7ak: A FEW, NOT A RING. Forty-six were raised around the mound's edge
and they came out shoulder to shoulder -- a fence of skeletons, which
reads as a spawner rather than as a haunting. The Barrow is the one
dangerous thing in the safe country and it works by being UNEXPECTED,
not by being crowded: three or four standing among the stones is more
frightening than forty, because forty is obviously a farm.

## 7al. The Spade Pays Prowess, And It Is The Only Thing That Does

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:17955` by `spec-stubs.mjs`.

§7al: THE SPADE PAYS PROWESS, AND IT IS THE ONLY THING THAT DOES
WITHOUT A FIGHT.

Prowess came from melee and from nowhere else, so a citizen who
wanted a strong arm had to want to be a fighter, and the only arm in
the world was a fighter's. Digging is the obvious answer and this
world already has two things worth digging: the muck heaps of the
farm country and the rockfall shutting the South Pass.

A spade in the hand instead of a sword: it turns a shift at either
into prowess. It is a poor weapon, it comes off a barrow-wight about
one kill in eleven, and it asks a citizen to give up their weapon slot
to use it.

THAT NUMBER WAS WRITTEN AS "one time in six thousand" HERE AND IN §26,
and it is 6144 out of a DROP_DEN of 65536, which is one in ten point
seven. Five hundred and sixty times out. It is also COUNTED rather than
rolled, so it is exactly one in eleven and not a gamble. A wight is a
real fight at ninety-five health, which is the cost; finding one is not.

## 7am. The Siphon

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:3028` by `spec-stubs.mjs`.

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

A `spec` of 'now' is the right gambit for a siphon and the wrong one for
a gonne: no flurry, no volley -- one sustained gout, out of rhythm,
when you decide. It costs the arm exactly as the mell's does.
§7cx: AND A SIPHON HAS TO BEAT THE FLAIL IT COPIES.

Measured at hit 3, every 3: 1.34 a tick bare and 1.39 through quick plate --
against a quick-flail, which pierces the same way, at 2.23 and 2.29. The
flail wants no fuel, no earthcraft 62, no attack 60 and no 1450 gold, so the
siphon was strictly dominated by a cheaper weapon that does its trick
better. Nothing about `burns` closes that: a fire is one point every four
intervals for eight, which is two points that cannot land the last blow --
about a twentieth of a tick, invisible next to a gap of nine tenths.

So the cadence goes to two, where every other short arm in the world sits,
and the blow rises to answer the price. It keeps its own shape: the only
weapon that pierces AND burns, and the only one that drinks brimstone.

## 7ao. A Maul Answers To Strength

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:1041` by `spec-stubs.mjs`.

§7ao: A MAUL ANSWERS TO STRENGTH.

Every mell was gated on ATTACK, which is the finesse stat -- and a mell is
the one weapon in the world that has no finesse: `acc: -12`, the worst
accuracy on the table, bought with the largest blow. It was asking for the
exact quality it does not have.

It also left a build with nowhere to go. The spade (7al) gave strength a
way to rise without fighting, and a citizen who took it had nothing worth
wielding at the end of it: every weapon in the world wanted attack. A
strength pure can pick up a mell now, which is what a strength pure would
pick up.

## 7ap. The Third Great Arm

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:1084` by `spec-stubs.mjs`.

§6bt: seventy, where every gathering skill already has its mastery tool.
§7ap: THE THIRD GREAT ARM. The great tier had a sword for attack and a
crossbow for ranged, and nothing for strength -- which was invisible while
mells were gated on attack (§7ao) and glaring the moment they were not. A
citizen who trains strength alone now has a ladder that reaches the top of
the world like everybody else's.

## 7aq. A Town, Not Three Terraces -- Second Drawing

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-shire-v6.mjs:219` by `spec-stubs.mjs`.

§7aq: A TOWN, NOT THREE TERRACES -- SECOND DRAWING.

The first attempt got the principle right and the execution wrong: the
lanes came out four and five tiles across, which reads as a courtyard
rather than a street, and nothing in it dominated -- 7x6 beside 6x4
beside 5x4 is one register, not a town.

Six rules, off a map of Varrock:

  LANES ONE TILE WIDE. A street is a gap you walk down, not a plaza you
  cross. The buildings crowd it on both sides.

  SOMETHING DOMINATES. The hall is 13x7 and holds the whole north end;
  the smallest building on the plan is 3x3. That is the range a town has
  -- a manor and a shed -- and it is what the first drawing lacked.

  SEPARATE FOOTPRINTS. Nothing shares a wall with anything.

  BROKEN ALIGNMENT. No two doors on a line, no two frontages flush.

  LANES THAT FORK AND DEAD-END. Three run north-south, one runs the
  width of the town, and the smithy's lane stops at the smithy.

  A KEEPER IN EVERY HOUSE. Nine buildings, nine people. A room nobody
  lives in is the fault of 16 all over again, and the first drawing
  left four of them.

§7as: AND NO ANVIL. The first pass of this drawing gave Oxenford a
smithy -- 's' and 'A' -- which put a SECOND anvil on an island whose own
crier says, at Cragfoot, "Mine here; the anvil is at Thornbury." One
anvil is a rule this world states out loud and builds a two-hundred-mile
errand around; a drawing does not get to quietly add another.

A ford town gets the trade a ford town has: a wheelwright's shop, which
is a hearth, a bench and a man, and no forge.

Nothing stands below plan row 24: that band is water and blocked ground
at this seat, which the validator refused three times before the first
drawing was accepted. The lane runs down through it to the ford.

§7bf: AND ROOM TO STAND IN. Two of these were drawn so small that their
furniture filled every tile of the floor -- a 3x1 interior with three
things in it, a 2x2 with four. Nobody could enter, and the audit that
found it only ran because PLAN_ROOMS finally listed every room rather
than the shops (7bd). A room needs a tile with nothing on it.

§7bi: a panel or two opened by planopen.mjs. The linter found floor here
that no citizen could reach -- rooms with nobody in them, which every
check before it was blind to -- and this cuts one wall between each and
the nearest ground the town can walk. A repair, not a design: the
drawing was wrong, and a door nobody chose still beats a sealed room.

## 7ar. A Street Is Drawn, Not Inferred

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:2463` by `spec-stubs.mjs`.

§7ar: A STREET IS DRAWN, NOT INFERRED.

This paved any tile within ONE of anything built -- which was fine for a
town of three long terraces with wide bands between them, and is wrong for a
town of scattered buildings: every gap is within one of a wall, so the whole
interior comes out as a single sheet of flagstone. Oxenford was rebuilt with
separate houses and lanes bending between them, and the lanes vanished --
not because they were not drawn, but because the ground around them was
paved too.

A town is roads with GROUND either side of them. So the pavement follows
what the drawing says is a lane: ',' outside a building is a street; '.' is
the grass between the houses, and stays grass.

## 7as. And No Anvil

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-shire-v6.mjs:246` by `spec-stubs.mjs`.

§7aq: A TOWN, NOT THREE TERRACES -- SECOND DRAWING.

The first attempt got the principle right and the execution wrong: the
lanes came out four and five tiles across, which reads as a courtyard
rather than a street, and nothing in it dominated -- 7x6 beside 6x4
beside 5x4 is one register, not a town.

Six rules, off a map of Varrock:

  LANES ONE TILE WIDE. A street is a gap you walk down, not a plaza you
  cross. The buildings crowd it on both sides.

  SOMETHING DOMINATES. The hall is 13x7 and holds the whole north end;
  the smallest building on the plan is 3x3. That is the range a town has
  -- a manor and a shed -- and it is what the first drawing lacked.

  SEPARATE FOOTPRINTS. Nothing shares a wall with anything.

  BROKEN ALIGNMENT. No two doors on a line, no two frontages flush.

  LANES THAT FORK AND DEAD-END. Three run north-south, one runs the
  width of the town, and the smithy's lane stops at the smithy.

  A KEEPER IN EVERY HOUSE. Nine buildings, nine people. A room nobody
  lives in is the fault of 16 all over again, and the first drawing
  left four of them.

§7as: AND NO ANVIL. The first pass of this drawing gave Oxenford a
smithy -- 's' and 'A' -- which put a SECOND anvil on an island whose own
crier says, at Cragfoot, "Mine here; the anvil is at Thornbury." One
anvil is a rule this world states out loud and builds a two-hundred-mile
errand around; a drawing does not get to quietly add another.

A ford town gets the trade a ford town has: a wheelwright's shop, which
is a hearth, a bench and a man, and no forge.

Nothing stands below plan row 24: that band is water and blocked ground
at this seat, which the validator refused three times before the first
drawing was accepted. The lane runs down through it to the ford.

§7bf: AND ROOM TO STAND IN. Two of these were drawn so small that their
furniture filled every tile of the floor -- a 3x1 interior with three
things in it, a 2x2 with four. Nobody could enter, and the audit that
found it only ran because PLAN_ROOMS finally listed every room rather
than the shops (7bd). A room needs a tile with nothing on it.

§7bi: a panel or two opened by planopen.mjs. The linter found floor here
that no citizen could reach -- rooms with nobody in them, which every
check before it was blind to -- and this cuts one wall between each and
the nearest ground the town can walk. A repair, not a design: the
drawing was wrong, and a door nobody chose still beats a sealed room.

## 7at. The Market Town, Third Drawing

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-shire-v6.mjs:148` by `spec-stubs.mjs`.

§7at: THE MARKET TOWN, THIRD DRAWING.

Five terrace bands first. Then thirteen buildings scattered evenly over a
52x36 rect, which came out as ISLANDS IN A CAR PARK -- five to ten tiles
of pavement between every pair, so nothing read as a street because there
was no ground for a street to be a street AGAINST.

A town is DENSE. Varrock's houses nearly touch; the gap between them IS
the street, one tile, and the open ground is one square everything faces.
Seventeen buildings here, shoulder to shoulder in four ranges, from a 9x6
store down to a 4x4 cot, with a one-tile gap between neighbours, a spur
from every door to the nearest lane, and the middle left clear.

THE MIDDLE IS EMPTY ON PURPOSE. 7k lays plaza where the centre is open
and no wall stands within a tile, and that plaza is the only ground on
Tallyholm a citizen may raise a stall on.

§7bo: THREE MORE ROOMS UNKEPT. The lumber stall walked back out into the
square every time the room list changed -- the seater takes rooms in
index order, so growing the list moves which house each stall gets, and
a stall whose house is now occupied falls back to open ground. Slack is
the answer: more unkept rooms than stalls, so the order cannot matter.

## 7au. And Only The Lanes Are Flagged

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:2595` by `spec-stubs.mjs`.

§7au: AND ONLY THE LANES ARE FLAGGED. This returned 'flag' for
EVERY remaining tile in Millbrook's rect -- fifty-two by
thirty-six of unbroken pavement -- so when the town was redrawn as
separate buildings they came out as islands standing in a car
park. There were no streets because there was no ground for a
street to be a street AGAINST.

A market town is paved where people walk and where they trade.
Between the backs of two houses it is grass, exactly as it is
everywhere else on the island.
§7au-ii: THE ROAD IS PAVED THROUGH THE TOWN, NOT SPECKLED ACROSS IT.

This asked the town's plan first and the road second, and the two
do not agree about where a street is: the plan draws the lanes and
the King's road is a spline laid centuries earlier. Where the
spline clipped a drawn lane you got a cobble; where it did not, you
got a dirt trail. Millbrook came out as fifty tiles of flagstone
with TWO cobbles in the middle of its high street, single cobbles
speckled round the market, and a dirt track cutting diagonally
across the square. That is not a carriageway and a footway, it is
noise, and it is what "cobblestone and flagstone is mixed" means.

The road goes first now. A road through a town is the high street
and it is cobbled from end to end; the plan's lanes are the footway
and they are flagged; between the backs of two houses it is grass,
as it was. The distinction the rule was reaching for survives and
is finally visible, because the cobble is continuous.

## 7au-ii. The Road Is Paved Through The Town, Not Speckled Across It

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:2605` by `spec-stubs.mjs`.

§7au: AND ONLY THE LANES ARE FLAGGED. This returned 'flag' for
EVERY remaining tile in Millbrook's rect -- fifty-two by
thirty-six of unbroken pavement -- so when the town was redrawn as
separate buildings they came out as islands standing in a car
park. There were no streets because there was no ground for a
street to be a street AGAINST.

A market town is paved where people walk and where they trade.
Between the backs of two houses it is grass, exactly as it is
everywhere else on the island.
§7au-ii: THE ROAD IS PAVED THROUGH THE TOWN, NOT SPECKLED ACROSS IT.

This asked the town's plan first and the road second, and the two
do not agree about where a street is: the plan draws the lanes and
the King's road is a spline laid centuries earlier. Where the
spline clipped a drawn lane you got a cobble; where it did not, you
got a dirt trail. Millbrook came out as fifty tiles of flagstone
with TWO cobbles in the middle of its high street, single cobbles
speckled round the market, and a dirt track cutting diagonally
across the square. That is not a carriageway and a footway, it is
noise, and it is what "cobblestone and flagstone is mixed" means.

The road goes first now. A road through a town is the high street
and it is cobbled from end to end; the plan's lanes are the footway
and they are flagged; between the backs of two houses it is grass,
as it was. The distinction the rule was reaching for survives and
is finally visible, because the cobble is continuous.

## 7ax. And A House Somebody Already Lives In Is Not A Shop

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:7764` by `spec-stubs.mjs`.

§7ax: AND A HOUSE SOMEBODY ALREADY LIVES IN IS NOT A SHOP.

The `busy` test that chose these rooms reads the DRAWING, and the
residents pass puts people into empty rooms at a different point in
the founding -- so a room the drawing left bare could have a citizen
in it by the time the roster arrived, and the stall sat down beside
them. Millbrook came out with two keepers in one building and a
stall alone in the next, which is a shop with a lodger and a lodging
with a shop.

The world is built by now. Ask IT, not the plan.

## 7ay. The Capital, Rebuilt

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-shire-v6.mjs:78` by `spec-stubs.mjs`.

§7ay: THE CAPITAL, REBUILT.

Four terrace bands and a walled compound: seventeen near-identical rooms
in ruled rows, every door on the same line. The starkest statement of the
fault Oxenford and Millbrook were redrawn to fix, and the biggest town on
the island wearing it.

A capital needs something that DOMINATES and Anchor had nothing -- its
largest room was a 13x6 in a row of 13x6s. THE KEEP is 16x8 and holds the
whole north: the three banks, the vault clerk, and a hall behind them.
Everything else defers to it, which is what a capital is.

The GAOL is kept as it was drawn: a curtain wall of its own, three cell
blocks, two guards and the second bank. It is the one thing in this town
that should read as a compound rather than a street.

THE FOUNTAIN STAYS. The crossing out of Nought is offered at Anchor's
fountain and nowhere else in the world; a redrawing that lost it would
have closed the only door into this island.

Drawn against planlint.mjs and roomfind.mjs: no essential cut off, and
nine rooms left unkept for the roster's stalls.

## 7b. Cannot Follow You Out Of The Throat: The Pass Should Have A Noise In It

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:3887` by `spec-stubs.mjs`.

§7b: and something lives in it. Two scree-imps, which hit for one and
cannot follow you out of the throat: the pass should have a NOISE in it,
not a danger. Whoever is digging has company and nothing worse.

## 7bb. The Forge Town

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-shire-v6.mjs:304` by `spec-stubs.mjs`.

§7bb: THE FORGE TOWN.

Three terrace bands and a walled quarter, with the island's only anvil
sitting in the middle band between a bed and a barrel -- the single most
important object on Tallyholm, drawn as a piece of furniture in a row of
cottages.

THE FORGE IS THE TOWN. It is 11x8, alone in its own yard inside the
wall, the largest building here by a long way, and everything else
stands outside looking at it. Cragfoot's crier says "Mine here; the
anvil is at Thornbury" and a citizen who walks two hundred tiles on the
strength of that should arrive somewhere that looks like the reason.

The wall is kept: this is where the metal of the island is worked, and a
town like that is guarded.

§7bi: a panel or two opened by planopen.mjs. The linter found floor here
that no citizen could reach -- rooms with nobody in them, which every
check before it was blind to -- and this cuts one wall between each and
the nearest ground the town can walk. A repair, not a design: the
drawing was wrong, and a door nobody chose still beats a sealed room.

## 7bc. The Mining Town, Cut Into The Crag

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-shire-v6.mjs:452` by `spec-stubs.mjs`.

§7bc: THE MINING TOWN, CUT INTO THE CRAG.

Six identical blocks in a two-by-three grid, with retaining walls between
them and every stair in a line. The banded structure was RIGHT -- a town
on a hillside is terraced, and those walls are what hold it up -- and
everything inside them was the same fault as everywhere else.

Same terraces, stairs off-centre on each, and eleven buildings of
different sizes crowding the lanes: the store holding the top level,
where a delver spends what the seam pays, and the cots stepping down
below it.

Nothing stands below the last wall. That band is three rows deep -- a
house needs three for itself and a fourth for the street it faces -- so
it is the town's approach: open ground, a fire, and the road to the seam.

Drawn with townkit: lanes first, then each house chooses the wall that
faces one. Four towns were drawn houses-first and every one cost several
passes to the same three faults -- a door a later stroke overwrote,
furniture on the threshold, a door opening on ground no lane reached.
The kit cannot make any of them, and it refuses a house no street
touches, by name, before the world is built.

§7bi: a panel or two opened by planopen.mjs. The linter found floor here
that no citizen could reach -- rooms with nobody in them, which every
check before it was blind to -- and this cuts one wall between each and
the nearest ground the town can walk. A repair, not a design: the
drawing was wrong, and a door nobody chose still beats a sealed room.

## 7bd. Every Room, Not Just The Shops

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-shire-v6.mjs:25` by `spec-stubs.mjs`.

§7bd: EVERY ROOM, NOT JUST THE SHOPS.

This table has two readers and they want different things from it. The
stall seater treats it as "rooms a rostered stall may stand in", so the
redrawn towns listed only the ones left unkept. But `isIndoor` reads the
SAME table to answer "is this tile inside a building" -- and it is
consulted by the paving, so every room NOT listed was outdoors as far as
the world was concerned, and its floor was flagged as street.

Listing every room satisfies both: isIndoor gets the truth, and the stall
seater filters the list by what is already occupied, which is what its
`busy` test was always for.

Found by roomfind.mjs -- flood the interior, stop at the door -- rather
than typed by hand, so a redrawn town's list cannot drift from its drawing.

## 7be. The Port

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-shire-v6.mjs:359` by `spec-stubs.mjs`.

§7be: THE PORT.

Three terrace bands with the sea to the east and three jetties reaching
out of them -- the same ruled rows as everywhere else, and a town whose
whole reason is the water arranged so that almost nothing faced it.

A port is a ROAD ALONG THE WATER with the town pressed against it. The
quayside street runs the length of the shore, three ways lead down to the
jetties, and the warehouses stand on the quay with the houses behind
them and the cots behind those.

The jetties are kept exactly: 21 deck tiles and three fishing marks off
their ends. The first draft laid its warehouses straight ACROSS them and
took six of the twenty-one -- a later stroke over an earlier one, and
this time over the thing the whole town is for. They stand between the
jetties now.

§7bg: AND A SHOP FOR THE FISHMONGER. Eastmere's rostered stall stood in
the open because every room in the town had a keeper in it -- the same
fault as Millbrook (7aw), committed again one town later, because "leave
rooms unkept" was learned as a fact about Millbrook rather than as a rule
about towns that hold a stall. Two quayside rooms are empty on purpose.

§7bi: a panel or two opened by planopen.mjs. The linter found floor here
that no citizen could reach -- rooms with nobody in them, which every
check before it was blind to -- and this cuts one wall between each and
the nearest ground the town can walk. A repair, not a design: the
drawing was wrong, and a door nobody chose still beats a sealed room.

## 7bf. And Room To Stand In

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-shire-v6.mjs:259` by `spec-stubs.mjs`.

§7aq: A TOWN, NOT THREE TERRACES -- SECOND DRAWING.

The first attempt got the principle right and the execution wrong: the
lanes came out four and five tiles across, which reads as a courtyard
rather than a street, and nothing in it dominated -- 7x6 beside 6x4
beside 5x4 is one register, not a town.

Six rules, off a map of Varrock:

  LANES ONE TILE WIDE. A street is a gap you walk down, not a plaza you
  cross. The buildings crowd it on both sides.

  SOMETHING DOMINATES. The hall is 13x7 and holds the whole north end;
  the smallest building on the plan is 3x3. That is the range a town has
  -- a manor and a shed -- and it is what the first drawing lacked.

  SEPARATE FOOTPRINTS. Nothing shares a wall with anything.

  BROKEN ALIGNMENT. No two doors on a line, no two frontages flush.

  LANES THAT FORK AND DEAD-END. Three run north-south, one runs the
  width of the town, and the smithy's lane stops at the smithy.

  A KEEPER IN EVERY HOUSE. Nine buildings, nine people. A room nobody
  lives in is the fault of 16 all over again, and the first drawing
  left four of them.

§7as: AND NO ANVIL. The first pass of this drawing gave Oxenford a
smithy -- 's' and 'A' -- which put a SECOND anvil on an island whose own
crier says, at Cragfoot, "Mine here; the anvil is at Thornbury." One
anvil is a rule this world states out loud and builds a two-hundred-mile
errand around; a drawing does not get to quietly add another.

A ford town gets the trade a ford town has: a wheelwright's shop, which
is a hearth, a bench and a man, and no forge.

Nothing stands below plan row 24: that band is water and blocked ground
at this seat, which the validator refused three times before the first
drawing was accepted. The lane runs down through it to the ford.

§7bf: AND ROOM TO STAND IN. Two of these were drawn so small that their
furniture filled every tile of the floor -- a 3x1 interior with three
things in it, a 2x2 with four. Nobody could enter, and the audit that
found it only ran because PLAN_ROOMS finally listed every room rather
than the shops (7bd). A room needs a tile with nothing on it.

§7bi: a panel or two opened by planopen.mjs. The linter found floor here
that no citizen could reach -- rooms with nobody in them, which every
check before it was blind to -- and this cuts one wall between each and
the nearest ground the town can walk. A repair, not a design: the
drawing was wrong, and a door nobody chose still beats a sealed room.

## 7bg. And A Shop For The Fishmonger

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-shire-v6.mjs:376` by `spec-stubs.mjs`.

§7be: THE PORT.

Three terrace bands with the sea to the east and three jetties reaching
out of them -- the same ruled rows as everywhere else, and a town whose
whole reason is the water arranged so that almost nothing faced it.

A port is a ROAD ALONG THE WATER with the town pressed against it. The
quayside street runs the length of the shore, three ways lead down to the
jetties, and the warehouses stand on the quay with the houses behind
them and the cots behind those.

The jetties are kept exactly: 21 deck tiles and three fishing marks off
their ends. The first draft laid its warehouses straight ACROSS them and
took six of the twenty-one -- a later stroke over an earlier one, and
this time over the thing the whole town is for. They stand between the
jetties now.

§7bg: AND A SHOP FOR THE FISHMONGER. Eastmere's rostered stall stood in
the open because every room in the town had a keeper in it -- the same
fault as Millbrook (7aw), committed again one town later, because "leave
rooms unkept" was learned as a fact about Millbrook rather than as a rule
about towns that hold a stall. Two quayside rooms are empty on purpose.

§7bi: a panel or two opened by planopen.mjs. The linter found floor here
that no citizen could reach -- rooms with nobody in them, which every
check before it was blind to -- and this cuts one wall between each and
the nearest ground the town can walk. A repair, not a design: the
drawing was wrong, and a door nobody chose still beats a sealed room.

## 7bi. A Town, Not Three Terraces -- Second Drawing

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-shire-v6.mjs:265` by `spec-stubs.mjs`.

§7aq: A TOWN, NOT THREE TERRACES -- SECOND DRAWING.

The first attempt got the principle right and the execution wrong: the
lanes came out four and five tiles across, which reads as a courtyard
rather than a street, and nothing in it dominated -- 7x6 beside 6x4
beside 5x4 is one register, not a town.

Six rules, off a map of Varrock:

  LANES ONE TILE WIDE. A street is a gap you walk down, not a plaza you
  cross. The buildings crowd it on both sides.

  SOMETHING DOMINATES. The hall is 13x7 and holds the whole north end;
  the smallest building on the plan is 3x3. That is the range a town has
  -- a manor and a shed -- and it is what the first drawing lacked.

  SEPARATE FOOTPRINTS. Nothing shares a wall with anything.

  BROKEN ALIGNMENT. No two doors on a line, no two frontages flush.

  LANES THAT FORK AND DEAD-END. Three run north-south, one runs the
  width of the town, and the smithy's lane stops at the smithy.

  A KEEPER IN EVERY HOUSE. Nine buildings, nine people. A room nobody
  lives in is the fault of 16 all over again, and the first drawing
  left four of them.

§7as: AND NO ANVIL. The first pass of this drawing gave Oxenford a
smithy -- 's' and 'A' -- which put a SECOND anvil on an island whose own
crier says, at Cragfoot, "Mine here; the anvil is at Thornbury." One
anvil is a rule this world states out loud and builds a two-hundred-mile
errand around; a drawing does not get to quietly add another.

A ford town gets the trade a ford town has: a wheelwright's shop, which
is a hearth, a bench and a man, and no forge.

Nothing stands below plan row 24: that band is water and blocked ground
at this seat, which the validator refused three times before the first
drawing was accepted. The lane runs down through it to the ford.

§7bf: AND ROOM TO STAND IN. Two of these were drawn so small that their
furniture filled every tile of the floor -- a 3x1 interior with three
things in it, a 2x2 with four. Nobody could enter, and the audit that
found it only ran because PLAN_ROOMS finally listed every room rather
than the shops (7bd). A room needs a tile with nothing on it.

§7bi: a panel or two opened by planopen.mjs. The linter found floor here
that no citizen could reach -- rooms with nobody in them, which every
check before it was blind to -- and this cuts one wall between each and
the nearest ground the town can walk. A repair, not a design: the
drawing was wrong, and a door nobody chose still beats a sealed room.

## 7bj. The Fen Town, And The Mirror It Was

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-shire-v6.mjs:516` by `spec-stubs.mjs`.

§7bj: THE FEN TOWN, AND THE MIRROR IT WAS.

A pier down the middle with the SAME blocks either side of it, twice
over: four identical 9x4s, then four more, in perfect bilateral symmetry.
A town does not grow symmetrically; a fen town least of all, because it
grows where the reed lets it.

The pier stays -- it is the one dry line through the marsh -- and the
walks branch off it at different lengths on each side. THE EEL HOUSE is
10x6 and holds the east, where the fen's catch is smoked and packed; a
3x5 cot hangs off a walk on the other side.

(It also held a SMITH, which the anvil rule of 7as forbids and nobody
had noticed, because the rule lived in a comment rather than in the
tool. townkit refuses it now.)

A BOARDWALK IS A STREET. The kit counted only ',' as a lane, so in a town
that is nothing but decking no house could find a frontage and the whole
drawing was refused. Decking is footing: it is what a fen town walks on.

## 7bl. The Garrison And The Monastery

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-shire-v6.mjs:561` by `spec-stubs.mjs`.

§7bl: THE GARRISON AND THE MONASTERY.

Four blocks in a two-by-two, guards scattered between them, and a SMITH
in the north-east range -- which 7as forbids, and which nobody had seen
because the rule lived in a comment until townkit was taught to refuse it.

The curtain wall stays: a place that holds both a garrison and the only
ossuary outside the Boneyard is walled. THE MONASTERY HALL holds the
north-west, and the ossuary is the reason a citizen walks to Norwick at
all. The garrison ranges sit below the cross of the gates.

§7bo: AND NO WAYSTONE. The first drawing put a 'W' in the hall and the
comment called it a waystone -- and THERE ARE NO WAYSTONES IN V7. They
were taken out deliberately: this world has no recall, and a stone that
moves a citizen across it would undo the tolls, the roads, the two
hundred tiles between the seam and the anvil, and the flight rule.

Nothing was placed, because the engine no longer knows the type -- which
is worse, not better: a character the loader silently drops is a landmine
that arms itself the day somebody makes the type valid again.

## 7bm. The Clearing

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-shire-v6.mjs:415` by `spec-stubs.mjs`.

§7bm: THE CLEARING.

Four blocks in a two-by-two with a neat border of trees round them, and a
SMITH in the south-east range that 7as forbids. A clearing is not a
rectangle with a hedge of trees: the wood closes in raggedly, and the
town is what the wood has not taken back.

One crooked street through the middle, forking at the timber end. THE LOG
HALL is 9x6 and holds the centre -- where the Greenwood's timber is
graded and stacked, which is the whole reason anyone lives here.

## 7bn. The Farm Town

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-shire-v6.mjs:609` by `spec-stubs.mjs`.

§7bn: THE FARM TOWN.

Four blocks in a two-by-two inside a hedge, with the orchard and the
crofts laid out in rows as regular as the houses. A farm is the least
regular place there is: it is a yard with buildings round it, and the
buildings are of every size because they do different work.

THE GREAT BARN is 13x7 and holds the east -- a farm's biggest building is
not a house -- with the farmhouse, the byres and the cots round the yard,
and the ploughed strips where the hedge lets them run.

The hedge stays, gates north and south where the drove road runs through.

§7bo: AND TWO ROOMS LEFT UNKEPT. Hollybarrow's seed stall stood in the
open yard -- the fourth town to make this mistake, after Millbrook,
Eastmere and the rest. A stall brings its own keeper. townkit refuses a
drawing that leaves no room for one now, and this drawing predated the
check being applied to it.

## 7bo. Three More Rooms Unkept

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-shire-v6.mjs:165` by `spec-stubs.mjs`.

§7at: THE MARKET TOWN, THIRD DRAWING.

Five terrace bands first. Then thirteen buildings scattered evenly over a
52x36 rect, which came out as ISLANDS IN A CAR PARK -- five to ten tiles
of pavement between every pair, so nothing read as a street because there
was no ground for a street to be a street AGAINST.

A town is DENSE. Varrock's houses nearly touch; the gap between them IS
the street, one tile, and the open ground is one square everything faces.
Seventeen buildings here, shoulder to shoulder in four ranges, from a 9x6
store down to a 4x4 cot, with a one-tile gap between neighbours, a spur
from every door to the nearest lane, and the middle left clear.

THE MIDDLE IS EMPTY ON PURPOSE. 7k lays plaza where the centre is open
and no wall stands within a tile, and that plaza is the only ground on
Tallyholm a citizen may raise a stall on.

§7bo: THREE MORE ROOMS UNKEPT. The lumber stall walked back out into the
square every time the room list changed -- the seater takes rooms in
index order, so growing the list moves which house each stall gets, and
a stall whose house is now occupied falls back to open ground. Slack is
the answer: more unkept rooms than stalls, so the order cannot matter.

## 7bq. The Hollow Bow

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:3208` by `spec-stubs.mjs`.

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

## 7br. Fire Arrows

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:3395` by `spec-stubs.mjs`.

§7br: FIRE ARROWS, if the archer is carrying them and nothing else.

Melee already has a shape to choose between -- a mell that answers plate, a
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

## 7bs. Which Shaft Is On The String

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:10756` by `spec-stubs.mjs`.

§7bs: WHICH SHAFT IS ON THE STRING.

`ammoOf` took plain arrows whenever any were carried, so an archer with
both kinds in the pack always shot plain and the choice fire arrows
exist to offer could not be made. There is no way to reorder a pack in
this world -- no swap, no drag -- so slot order cannot carry it either.

One verb. Nock a slot and that is what the bow draws until you nock
something else or run out, at which point it falls back to whatever
remains. A citizen meeting a naked goblin and a plated citizen in the
same hour changes shaft between them, which is the whole point.

## 7bt. The Greenwood Had No Excuse

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-places-v7.mjs:185` by `spec-stubs.mjs`.

---- THE GREENWOOD -------------------------------------------------------
The sawyer's camp: a lean-to, a fire, a stack of what he cut. He is not
here today either.
§7bt: THE GREENWOOD HAD NO EXCUSE.

Measured tiles-per-node by country: the heartlands 14, the downs 21, the
crags 27, the moor 28, the fens 37 -- and the GREENWOOD 68, second only to
the Wilds at 111. The Wilds is meant to be bare; that emptiness is what it
is for, and a world with nowhere empty reads as built rather than found.
The Greenwood is the timber country, the whole reason woodcutting exists,
and it was the emptiest place on the island that had a reason to be full.

Three camps, the work of the wood: burning, felling, and the man who counts
what leaves it.

## 7bu. The Deep Fishing Moved To Whiting Isle

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-seams-v7.mjs:143` by `spec-stubs.mjs`.

§7bu: THE DEEP FISHING MOVED TO WHITING ISLE.

It sat in the north-western sea, reachable on foot along the shore, and an
island whose only draw is a second-best copy of something is a detour
rather than a destination. The master fishing is the isle's whole reason,
it is nowhere else, and the only way to it is the boat from Eastmere.
Placed HERE after all. The isle pass tried three ways and landed none: the
search stopped short of the water, then `put()` silently refused every sea
tile because SEA IS NOT FREE, then addNode placed nothing I could find. The
seam table demonstrably works -- it has carried these four since v5 -- so
they move by changing their coordinates, which is what "moving a tier"
should have meant in the first place.
REVERTED to the north-western sea, where they have stood since v5.

Four attempts to move this tier to Whiting Isle landed none of them: the
isle search stopped short of the water; `put()` silently refuses a sea tile
because SEA IS NOT FREE; `addNode` placed nothing I could find; and moving
the coordinates in this table -- which demonstrably works, it has carried
these four for two versions -- produced zero as well, for a reason I did
not find before running out of room to look.

A tier deleted from the world is far worse than a tier in the wrong place,
so it goes back. The isle and its ferries stand and are sound; what the
isle is FOR is unfinished, and that is the next thing to do.

## 7bv. This Line Is Seventy Per Cent Of The Founding

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:6509` by `spec-stubs.mjs`.

§7bv: THIS LINE IS SEVENTY PER CENT OF THE FOUNDING.

It asks "is anything standing here" by walking all 9,582 nodes, for
every candidate tile of every camp's ring. The profiler puts it at
3.5 billion ticks against the next line's 1.0 billion -- most of a
two-minute world, on one `some`.

The fix is an occupancy Set built once. It is NOT APPLIED: two
attempts to splice it in put it between a `for` head and its body
(rebuilding it sixty thousand times, so the founding stopped
finishing) and then above the line where `w` exists at all. A fix
that is slower than the bug, then a fix that does not run, so the
scan stands and the measurement is written down instead.

## 7bw. Salting Is Cooking Without A Fire

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:16710` by `spec-stubs.mjs`.

§7i/§7j: FLOUR BECOMES BREAD, on the same tally as every other cook.
Grain goes to the mill first (see `grind`); a loaf is two steps and a
destination, which is what earns it seven points and beats a fish.
§7bw: SALTING IS COOKING WITHOUT A FIRE.

The saltern needed no new verb: `cook` already means "turn this raw
thing into food where you are standing", and where you are standing is
the whole difference. At a fire a fish is cooked; at the pans on
Whiting Isle it is SALTED -- worth two less to eat and stackable, so a
citizen crosses with an empty pack and comes home with a column.

It never burns. Salt does not overcook, and a trade that cannot fail is
the compensation for a trade that must be done on an island.
...and ANY raw fish, not just the common one. The first cut asked for
'raw-fish' by name, so a deep fish or an eel carried to the pans could
not be salted at all -- an arbitrary line through three things the rest
of this function treats alike, and exactly the fault the note at the
top of the rule describes about cooking deep fish.

A salted deep fish is worth more, as a cooked one is. An eel salts to
the common bite: it is a poor fish however you keep it.

## 7bx. The Hollow Bow Is Not Made

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:16292` by `spec-stubs.mjs`.

§7bx: THE HOLLOW BOW IS NOT MADE. It was four bones and a log at
woodcraft 12 -- an hour's work for a weapon that removes the arrow
economy from training altogether. A bow that needs no ammunition is a
large thing to hand out for the price of a log, however poor its
numbers are, because what it costs is not damage: it is the SUPPLY
LINE, and that is the whole of ranged's asymmetry.

It comes off a skeleton-knight, one in five hundred. An archer who
wants to train without arrows goes and earns it, which is a fair price
for never buying another shaft.

## 7by. The Gold Chain

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:4966` by `spec-stubs.mjs`.

§7by: THE GOLD CHAIN. Gold armour is quick armour's equal in defence and
nothing more -- a pure cosmetic, worn because it is worth being seen in.
Melee had no such thing, so a citizen who wanted to look like they had
arrived could dress the part and not arm it.

The OLD CHAIN is the one to gild, and the joke is the whole reason: it is a
length of rusted chain, the worst weapon in the world, and this is the
version cast in gold. Same numbers exactly. Somebody will carry it.

## 7c. undrafted

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:12504` by `spec-stubs.mjs`.

§11e: TILES. Chebyshev between store tiles, exactly as survey XP is paid by
chebyshev to the anchor (§7c). A walk graph would be truer and cannot be
computed every interval by every node; this can.

## 7ca. A Flurry Is Six Blows And Said So Once

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:15610` by `spec-stubs.mjs`.

§7ca: A FLURRY IS SIX BLOWS AND SAID SO ONCE.

The window makes a hit splat by DIFFING health between ticks, so
six blows landing in one interval come out as a single number. All
the information exists here and is thrown away at the door: a
dagger's flurry of 3,0,5,2,0,4 reads as 14, and a citizen cannot
tell a lucky burst from an even one, or see the two that missed.

`blows` is a list of what each swing did, cleared at the top of the
next tick. It is state, so it is in the hash and validated -- a
cosmetic that lies is worse than no cosmetic, and the only honest
way to show six numbers is for the engine to have said six.

## 7cb. The Gibbet-dead

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:3854` by `spec-stubs.mjs`.

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

## 7cd. Fall In

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:13205` by `spec-stubs.mjs`.

§7cd: FALL IN -- the step, and everything that breaks it.

A follower takes ONE tile toward the person they are following and stops
beside them. It obeys the flight rule the same as any other step, by the
same line: a step clears your action, so a follower who is carried into
reach cannot also swing that interval. A pursuer who moves cannot swing --
that is true of feet, whoever chose the direction.

It breaks by itself when the following stops making sense: they are gone,
they are dead, or they are further off than you can see. It does NOT break
in the Wilds, because a band crossing the Wilds behind one navigator is the
whole point of the thing, and it never copies an action, because a follow
that swings for you is a bot with extra steps.

## 7ce. The Second Book

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:10610` by `spec-stubs.mjs`.

§7ce: THE SECOND BOOK.

Magic here was four unrelated verbs -- still, seal, char, transmute -- each
with its own requirement and no sense of WHICH magic you are doing.
What makes a second spellbook worth having is not that its spells are
stronger. It is that you WALK TO IT, that it changes your whole hand at
once, and that it TAKES SOMETHING AWAY. A book that is strictly better
is a tier with a ceremony attached.

The barrow-work is turned to at an ossuary -- the Boneyard's, or the
one at Norwick, or the Moorgrave's -- which is a journey wherever you
start. It gives you the WAKING, which strikes everything standing
round your mark, and it takes TRANSMUTE: the barrow-dead do not do commerce,
and a caster who wants to turn things into money speaks the common book
like everybody else.

## 7cf. Two Books, And Nothing In Both

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:2479` by `spec-stubs.mjs`.

§7cf: TWO BOOKS, AND NOTHING IN BOTH.

Magic in this world was built as THE REJECTION OF COMBAT -- 8b. Stilling ends
a fight, sealing shuts a way, charring unmakes, transmuting turns a thing into
money. Not one of them hurts anybody, and that is the whole argument for the
skill: a caster is somebody who has decided not to swing.

A book of the dead is therefore not an ADDITION to that. It is the reversal
of it, and the honest form of a reversal is that you cannot hold both. The
first cut took only transmute away, which made the barrow-work "the common book
plus a war spell" -- the exact tier-with-a-ceremony it was written not to be.

So the two lists are disjoint and every spell asks the same question. A
citizen at an ossuary chooses which kind of caster they are, and walks back
to change their mind.

## 7cg. The Rot

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:2553` by `spec-stubs.mjs`.

§7cg: THE ROT, and where the barrow book's rungs actually go.

The common ladder is sparser than it looks: TRANSMUTE at 1, MEND at 50, STILLING
at 85. Three rungs, and the top one is the highest requirement of any spell
in the world -- because ending a fight outright is the strongest thing magic
does and it is priced accordingly.

So the barrow book is set against THAT and not against a guess. ROT at 40 is
below mend: it is what a turned caster has instead of a first useful spell,
and it must be reachable or nobody would ever turn before 50. THE WAKING at
75 sits below the stilling, because striking a clump is a lesser thing than
stopping a fight, and above everything else, because it is the reason to walk
to an ossuary at all.

    common     transmute 1        mend 50       stilling 85
    barrow     rot 40        waking 75

Rot is cheap in sigils and SLOW: it does nothing at all the interval it is
cast. It costs the caster the opening of the fight and pays over the next
twenty-four, which is the opposite of every blade here and the reason it is
worth having. It ignores armour entirely -- plate does not stop decay -- the
exact inverse of the fire arrow, where plate counts double.

## 7ci. The Taking

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:2600` by `spec-stubs.mjs`.

§7ci: THE TAKING, priced against the mend it replaces.

MEND is +20 every twenty-five intervals -- a strong heal on a long leash,
which keeps it premium without making sigil-stackers unkillable. The barrow
book loses it, so the taking is what a turned caster has instead, and it must
answer the same question differently rather than better.

It heals LESS and has NO leash: what it costs is not time but somebody else.
A mend closes your wounds out of nothing; a taking moves the health across
-- exactly what it does to them is what it does for you, so it can never heal
more than they had left, and against a corpse or a full-strength caster it
does nothing at all.

Level 60: above the rot at 40, below the waking at 75, and ten above the mend
it stands in for -- because taking life is a worse thing to know than mending
it, and this world charges for the worse thing.

## 7cj. The Bone Staff

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:3139` by `spec-stubs.mjs`.

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

## 7ck. The Withering

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:2617` by `spec-stubs.mjs`.

§7ck: THE WITHERING, and what an endgame spell has to be the inverse OF.

The common book's top is the STILLING at 85: it ENDS a fight outright, and it
is the highest requirement in the world because that is the strongest thing
magic does. The barrow book's answer cannot be a bigger number -- a bigger
number is a tier -- so it is the exact reversal: the stilling stops a fight,
and the withering makes one IMPOSSIBLE TO SURVIVE BY THE USUAL MEANS.

For sixteen intervals the marked citizen cannot be healed. Not by food, not
by a mend, not by a taking, not by anything. Their health only goes down.

It is terrifying because in a fight in this world, EATING IS HOW YOU LIVE --
twelve slots of cooked fish is what a duel is made of -- and this shuts
that door while the blows keep landing. And it is the perfect price for what
the book gave up: a caster who surrendered the mending of anybody, including
themselves, gets in exchange the power to deny it to everybody.

Level 88, three above the stilling: the last thing anybody learns. Four
sigils, two tiles -- you must be close enough to be in the fight yourself.

## 7cl. And The Barrow Book Had No Cadence At All

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:2637` by `spec-stubs.mjs`.

§7cl: AND THE BARROW BOOK HAD NO CADENCE AT ALL.

A citizen submits ONE input an interval, so nothing can be cast twice in the
same tick -- but nothing stopped the WAKING going off every single interval
forever, nine damage to a whole clump for three sigils, or the TAKING moving
eight health a tick with no leash whatsoever. The common book has leashes
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

## 7cm. The Desperate Curve

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:5325` by `spec-stubs.mjs`.

§7cm: THE DESPERATE CURVE. `bare` pays you for what you are not wearing;
`desperate` pays you for what you have already lost. They are the same
argument on two axes -- one chosen at the bank and permanent for the trip,
the other involuntary and arriving whether you wanted it or not.

THE SHAPE IS BORROWED ON PURPOSE, and so is the reasoning behind it. §7l
measured a FLAT bare bonus and found the middle beat both ends: half the
bonus plus real protection was the optimum, so a weapon meant to ask "will
you strip?" was really asking "will you wear medium?". A linear hitpoint
curve fails in exactly the same way -- the optimum becomes hovering at half
health, half the bonus and a real margin of safety, and the weapon asks
"will you hover?", which is a duller question and not the one it is for.

Squaring puts the whole bonus in the last few points of life.

  health/max   99   50   25   15    5    1
  bonus     0    2    6    7    9   10

SEVEN AT FIFTEEN is not a coincidence and was not tuned to be one. Fifteen
health is the quick-mell's bite -- "against a citizen at fifteen it ends
the fight, because they do not get a later". The interval where this weapon
becomes worth carrying is the interval in which you can be deleted in one
blow, and the price is therefore already in the engine: to hold the bonus
you must stand inside somebody else's execute window. Nothing new had to be
invented to pay for it, which is the same sentence §7l ends on.

## 7cn. The Mere-lamprey

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:4074` by `spec-stubs.mjs`.

§7cn: THE MERE-LAMPREY, and the first creature in this world that can be
USED UP.

§12c opened a door that can never be shut again: the South Pass, dug out by
whoever swung, and "every citizen who arrives afterwards lives in the world
they made and cannot join them in making it. That is a one-way door and it
is meant to be." This is the same door pointed the other way -- a thing the
island can SPEND -- and it is built out of the same two anti-farm
materials, calendar and appetite, because §12c is still true: identity is a
keypair and a threshold denominated in labour is denominated in the one
currency an executor has infinitely much of.

SEVEN OF THEM, sixty-four lives apiece. Not one boss with a counter: a
small named population that goes one at a time, because "there are three
left" is a sentence a world can say and "four hundred and eighty of five
hundred" is a progress bar. The first death barely registers. The fourth is
an argument. The last is `lasts`.

NOBODY DECIDES THIS. There is no vote, no committee and no seal to build --
which is the whole reason it is allowed to exist. §18a already works this
way: at most forty-one fall-stones, "the real number is the island's
decision", and no citizen ever cast one. Appetite decided. Each digger
wanted a stone and the sum of wanting ended the seam. A lamprey dies of
being wanted, every kill is somebody who came for spit, and there is no
villain anywhere in it.

AND WHAT IT LEAVES IS WALKABLE. When the last one is gone the mere is still
there and still empty. §12c's best line is that the road to the South Pass
still ARRIVES at rock; a reed-bed you can wade into with nothing in it says
more than a reed-bed that was never drawn.

The numbers: it kills a master in a shade over four minutes, which is the
band §6by set for the four things that are supposed to be dangerous. It is
not a boss. It is a hard beast in bad ground that four hundred and forty
eight people will each want a piece of.

## 7cn-ii. And A Cleave May Not Spend What It Cannot Pay For

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:17591` by `spec-stubs.mjs`.

§7cn-ii: AND A CLEAVE MAY NOT SPEND WHAT IT CANNOT PAY FOR.

A cleaved beast dies without dropping: the loot block below is
inside the named target's `health <= 0`, and only the named target
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

## 7cn-iii. What A Corpse Leaves

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:2133` by `spec-stubs.mjs`.

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

## 7cp. A Built Thing Is Built Of Boards

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:1490` by `spec-stubs.mjs`.

---------------------------------------------------------------------------
A CITIZEN'S STALL
---------------------------------------------------------------------------
Every economic rule in this constitution ends the same way: the only
sensible buyer is another citizen. Quick-stone at twenty when a plate wants
seven. Dragon-bones at five hundred when they are worth six thousand. A
keeper's purse holding twelve hundred against a master smith's thirty-five
million. The world is built to force citizens to trade with each other --
and until now that required both of them awake at the same moment.

A stall a citizen raises sells while they sleep.

STOCK IS ONE-WAY, and that single rule is what keeps it a shop. You may put
things in; the only ways out are a SALE or a SPILL. Never a withdrawal.
Without it a stall in the Wilds is a vault in the Wilds -- mine twelve
stones, walk five tiles, empty the pack, mine twelve more -- and the
six thousand trips out of the Wilds that the whole quick economy rests on
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
§6al: twelve slots, the whole pack. ONE DECLARATION EACH, because anything
that reads a constant out of this source reads `const NAME = <digits>;` and
a pair on one line is invisible to it: the handbook could not print what a
stall costs, which is a rule, and said nothing rather than guessing.

## 7cs. The Lists

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:2681` by `spec-stubs.mjs`.

§7cs: THE LISTS. What the isle refuses.

A rule that removes something is only interesting where the thing mattered,
and armour and magic only matter where people fight -- so the isle is Wilds
ground, and the three refusals do different work on it:

  NO ARMOUR   makes the accuracy ratio the whole game (6ap put armour in the
              roll, so removing it is removing the roll's other half), and it
              is the first place the bare-blade bonus is worth anything.
  NO MAGIC    means the barrow book is real everywhere EXCEPT the place people
              go to fight, which is a better trade than making it real there.
  NO PRAYER   means always full risk. Prayer's only effect is that your
              dearest priced thing survives your death; on the isle nothing
              does. You brought it, you can lose it.

It is enforced at the QUAY and not on the ground: the boat will not take you
wearing armour. If you cannot bring it you cannot wear it, and that is one
check when you sail rather than a check every interval forever.

## 7ct. And The Boat Is Not An Escape Hatch

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:10733` by `spec-stubs.mjs`.

§7ct: AND THE BOAT IS NOT AN ESCAPE HATCH.

`sail` refused nothing -- not rooted, not branded, not mid-fight -- so
on the Lists it was a keystroke that ended any fight you were losing,
from a tile everybody knows the location of. That is exactly what 2k
forbids the ANCHOR for: "the walk out, the decision whether to keep
going with a full pack, was answered by a keystroke."

A boat is not a recall and it should not become one. It answers to the
same two rules the anchor does, and to a third of its own: a fight you
are in is a fight you are in.

## 7cu. An Isle Is Ground, And Had None

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:2667` by `spec-stubs.mjs`.

§7cu: AN ISLE IS GROUND, AND HAD NONE.

This fell through to null on every isle tile, and a window paints null as
SEA -- so Whiting and the Lists were drawn as open water on the chart, an
island you can walk on and cannot see. The shrine isle only ever looked
right because it is small enough to be entirely beach: every tile of it was
caught by the `sand` line above.

Their ground follows what they ARE: Whiting is a salt shore of shingle and
pan, the Lists is bare trodden ground with nothing growing on it, because
nothing on it is allowed to grow.

## 7cv. The Charter

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:2704` by `spec-stubs.mjs`.

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

## 7cw. A Charter Is Spent Once, And You Are Chartered For Good

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:10714` by `spec-stubs.mjs`.

§7cw: A CHARTER IS SPENT ONCE, AND YOU ARE CHARTERED FOR GOOD.

It was consumed on every crossing out, and DEATH RETURNS YOU TO SPAWN
-- 142 tiles from the Fenmarch quay. So on a duelling isle where the
whole point is fighting repeatedly and losing everything, each death
cost a fresh charter and a walk across the island. That is not risk,
it is FRICTION, and the two are not the same thing: risk makes a
decision interesting, friction makes it tiresome.

Spent once. After that the boat knows you. What the explorer sells is
not a ticket but an INTRODUCTION -- every citizen buys exactly one,
ever, and the market is every citizen who ever decides to fight rather
than every fight anybody has.

(Which is also the honest version of what a charter IS. A licence for a
voyage is a thing you are granted, not a thing you hand over at a gate
each time.)

## 7cx. And A Siphon Has To Beat The Flail It Copies

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:3053` by `spec-stubs.mjs`.

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

A `spec` of 'now' is the right gambit for a siphon and the wrong one for
a gonne: no flurry, no volley -- one sustained gout, out of rhythm,
when you decide. It costs the arm exactly as the mell's does.
§7cx: AND A SIPHON HAS TO BEAT THE FLAIL IT COPIES.

Measured at hit 3, every 3: 1.34 a tick bare and 1.39 through quick plate --
against a quick-flail, which pierces the same way, at 2.23 and 2.29. The
flail wants no fuel, no earthcraft 62, no attack 60 and no 1450 gold, so the
siphon was strictly dominated by a cheaper weapon that does its trick
better. Nothing about `burns` closes that: a fire is one point every four
intervals for eight, which is two points that cannot land the last blow --
about a twentieth of a tick, invisible next to a gap of nine tenths.

So the cadence goes to two, where every other short arm in the world sits,
and the blow rises to answer the price. It keeps its own shape: the only
weapon that pierces AND burns, and the only one that drinks brimstone.

## 7cy. The Hands That Have Been Here

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:9494` by `spec-stubs.mjs`.

§7cy: THE HANDS THAT HAVE BEEN HERE.

A specialist in this world is unfindable. The rune-crafter was findable
because they STOOD at the altar for hours and you could see them -- but
this world will not have a directory of who is online and where, because
that repeals the walk as surely as a waystone does.

A TRACE, then, and not a tracker. A work remembers the last few citizens
who used it and how long ago, and it tells you when you stand beside it.
It says who works here; it does not say where they are. You still have to
go to the furnace to learn who works the furnace, and you still have to
find them yourself.

WHICH WORKS REMEMBER. The four where something is made -- the anvil, the
furnace, the sawpit and the mill -- and both fires, the furnace and the
watchfire, whenever somebody feeds one or burns it down for charcoal.

The fires were missing, and that was the wrong way round for the whole
purpose of this. A smith who smelted an hour ago tells you nothing you
need to know. Whoever has been feeding the fire tells you whether it will
still be alight when you get there and whether to bring coal, which is
the one thing on this island that genuinely has to be arranged between
people who cannot see each other. `stokedBy` kept the LAST hand only and
the next person to feed it overwrote them, so one name was all anybody
could ever read and it was gone a minute later.

## 7cz. Rubble, Which Did Nothing At All

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:4567` by `spec-stubs.mjs`.

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

## 7d. The Looking Glass

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:4977` by `spec-stubs.mjs`.

================= THE LOOKING GLASS =================

§7d. A citizen's first face is free, at the door. Changing it afterwards
is a walk to the one place on the island you can see yourself.

Two things are wrong with a face you edit in a menu. It costs nothing, so
it means nothing -- and every window wired the verb to its own door, so
the world had no idea the choice existed. Meanwhile Anchor's Hall 2 is a
four-by-nine room containing one hearth, and the same is true of most of
the eighty-one buildings on this island: a door, a floor, and no reason.

One glass, in one hall, in the capital. Scarce on purpose: it is a
Schelling point like the seams, and the walk is the whole point of it.

## 7da. Iron Ore, Because

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:1506` by `spec-stubs.mjs`.

---------------------------------------------------------------------------
A CITIZEN'S STALL
---------------------------------------------------------------------------
Every economic rule in this constitution ends the same way: the only
sensible buyer is another citizen. Quick-stone at twenty when a plate wants
seven. Dragon-bones at five hundred when they are worth six thousand. A
keeper's purse holding twelve hundred against a master smith's thirty-five
million. The world is built to force citizens to trade with each other --
and until now that required both of them awake at the same moment.

A stall a citizen raises sells while they sleep.

STOCK IS ONE-WAY, and that single rule is what keeps it a shop. You may put
things in; the only ways out are a SALE or a SPILL. Never a withdrawal.
Without it a stall in the Wilds is a vault in the Wilds -- mine twelve
stones, walk five tiles, empty the pack, mine twelve more -- and the
six thousand trips out of the Wilds that the whole quick economy rests on
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
§6al: twelve slots, the whole pack. ONE DECLARATION EACH, because anything
that reads a constant out of this source reads `const NAME = <digits>;` and
a pair on one line is invisible to it: the handbook could not print what a
stall costs, which is a rule, and said nothing rather than guessing.

## 7dc. Coal Burns Longer Than Charcoal, And Is Now Worth Mining

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:2780` by `spec-stubs.mjs`.

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
sulphur makes a bad one. So a woodcutter at woodcraft 60 could do
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

## 7dd. And Coal Banks A Watchfire

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:5260` by `spec-stubs.mjs`.

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

## 7dg. Smoking, And The Window

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:2577` by `spec-stubs.mjs`.

§7dg: SMOKING, AND THE WINDOW.

Longer than a ferment (genesis.brew.ferment is 3000) because smoking is
slower than fermenting and because the rack is the scarcer vessel: there
are four in the world and eight brewpots to a citizen.

Module constants and NOT genesis, deliberately. validateGenesis pins
genesis.brew by an exact key list -- Object.keys(bw).sort().join(',') --
so a `smoke` block there is a constitutional change to a table that has
nothing to do with eels. These are the same shape as ROT_TICKS above.

THE WINDOW IS THE LOAD-BEARING NUMBER. §8a made the inn's pot hold nothing
so that no citizen could sit on it, and four racks world-wide is exactly
the case that rule feared. The answer is not the public-pot trick -- the
scarcity here IS the design -- it is a clock on BOTH ends: a rack finishes,
stays collectable for a window, and then the catch is over-smoked and the
rack clears itself. The longest anyone can hold a rack is bounded, it
costs them the eel, and it resolves with nobody intervening.

It also turns a rack into an APPOINTMENT. You have to come back, and being
late is a real loss -- which is the one thing a world with no clock of its
own has been short of.

## 7dh. A Lane Ends At A Village

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:1677` by `spec-stubs.mjs`.

§7dh: A LANE ENDS AT A VILLAGE. IT DOES NOT GO THROUGH THE KITCHEN.

A road reserves its tile before any plan is laid, and layPlan silently
skips a reserved tile -- so a road crossing a drawing does not knock a wall
down, it deletes whatever the drawing put there and says nothing. Measured
on the first honest founding: the road from Fenmarch ran through the Eel
Sheds and took the fourth rack with it. Three racks in the world, four in
the drawing, and no warning anywhere.

A town does not meet this. Its outer work is '%', and layPlan's gate rule
lets a rampart yield to a road wherever the traffic really arrives. A
village has no rampart -- it is four cottages and a well, drawn in '#',
and a house's wall holds: "a road clipping the corner of somebody's
kitchen is not a doorway, it is a hole."

THE FIX CANNOT BE AT SEAT TIME. A village is a road's ENDPOINT, so a seat
that tested onRoad would ask for the roads that are waiting for the seat.
(It does, loudly: stack overflow on the first attempt.)

So the road aims at the village's DOOR instead of its middle: the tile just
outside the drawing, on the side the traffic is coming from. The lane still
arrives -- that is the whole point of siting these on roads people already
walk -- and the village street takes over from there, which is exactly what
happens when you walk into a village.

Pure arithmetic on seats that already exist, so no cycle and no hash draw.

## 7di. The Scene Nouns

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:8777` by `spec-stubs.mjs`.

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

## 7dj. Gravable

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:8827` by `spec-stubs.mjs`.

§7dj: and four that exist only because the obvious word already has a job.
A stone-heap is not a cairn, a way-post is not a milestone, a slag-lump is
not a glass-stone and a hay-wain is not a cart -- each of those four is
reachable by a verb (the first three are GRAVABLE, the fourth is a node
type a hauler drops on death with a shelf anybody may unload). Scenery is
cosmetic and nothing else, so scenery gets its own words.

## 7dk. The Records

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:12891` by `spec-stubs.mjs`.

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

## 7dl. The Cleat Is Gone, And Why

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:632` by `spec-stubs.mjs`.

§7dl: THE CLEAT IS GONE, AND WHY -- the note stays so nobody rebuilds it.

A third gap in the ridge, three rows wide, passable only with a light pack.
It worked, it was tested, and it was WRONG, for a reason no tuning of the
threshold could reach.

THE SOUTH PASS'S WHOLE JOB IS TO BE THE SECOND WAY THROUGH. Forty-one
rockfalls, weeks of collective digging, and the country changes because
people worked at it. A cleat hands a second crossing to most travellers most
of the time, free, from the first interval -- so the citizens digging at the
Pass are working for weeks to unlock something the map already gave away.
And the North Pass being ALONE is a forcing function: everyone funnels there,
which is where they meet. A third gap thins that out.

Ask what would make it not simply the better option, and the answer is
nothing: for a light traveller it is shorter and free, always.

THE RULE THIS TAUGHT, which is worth more than the gate was:

  AN ENCUMBRANCE GATE SHOULD GATE A PLACE, NOT A CROSSING.

A crossing always has an alternative to be measured against, so a
conditional one is either better than the alternative (and undermines the
work that made it) or worse (and nobody walks it). There is no third result.
A place has no alternative. You are in or you are not, the gate competes
with nothing, and "you may carry eight slots in and eight out" becomes a
property worth having rather than a restriction worth resenting: whatever is
inside must be worth a light trip, and nobody empties it in one visit.

The MECHANISM was right and stays -- `crossing` in the registry below, and
crossingBlocked in the engine. It never assumed a ridge. Only the content
came out.

## 7dm. The High-water Mark

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:17928` by `spec-stubs.mjs`.

§7dm: THE HIGH-WATER MARK -- the hardest rung this citizen has ever
worked in this skill.

Two years and 532,000 shrimp for a ninety-nine caught on the small net
alone. Somebody did that, and a company's data team had to be asked to
go through their logs and confirm it. THIS WORLD CAN SETTLE IT IN ONE
COMPARISON, for ever, and it costs one small integer.

Half of what the genre argues about is already free here: a citizen
who has never fought reads zero prowess, one who has never cast reads
zero sorcery, and one who worked the shore and nothing else reads
nine numbers of which eight are zero. Every "pure" is a DERIVED fact
of state that anybody can check.

What is NOT visible in a skill number is METHOD -- only the small net,
only the shallow seam -- and this is the whole of what method costs. It
is monotonic, so it cannot be washed off, and it needs no history at
all, which matters because a node DISCARDS its inputs the interval it
executes them. Nothing not written down here can ever be asked later.

FACTS, NOT ACHIEVEMENTS. There is no table of blessed challenges and
there must not be: nobody designed "only small net", a player invented
it, and a challenge the world has already named and rewarded is not
self-imposed any more -- it is a quest. The world records dumb
monotonic facts and leaves the inventing to citizens.

## 7dn. The Squeeze

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:2238` by `spec-stubs.mjs`.

§7dn: THE SQUEEZE -- the mouth of the Chalk Barrow, and the one piece of
ground on Tallyholm that asks a question before it lets somebody through.

A GATE ON A PLACE, NOT ON A CROSSING, and that distinction cost a whole
build to learn. The first version of this was a third gap in the ridge
passable with a light pack, and it was wrong in a way no threshold could
reach: a crossing always has an alternative to be measured against, so a
conditional one either beats the alternative -- and quietly undoes the weeks
of digging that opened the South Pass -- or is never walked. There is no
third result.

A place has no alternative. You are in or you are not, the gate competes
with nothing, and the restriction turns into a PROPERTY worth having: eight
slots in, eight slots out, so whatever is down there has to be worth a light
trip and nobody empties it in one visit. It is also, precisely, why the
barrow has not already been stripped -- which the drawing has claimed since
v4 without anything making it true.

It gates nothing anybody needs. Not a road, not a seam, not a way home:
§14a's rule holds trivially, because there is nothing on the far side except
the barrow itself.
THREE, NOT EIGHT.

Eight slots was a haulier's limit and it left the barrow a place you visited
with a shopping bag. Three is a decision: you go in carrying almost nothing,
and what you carry out has to be worth the walk back. That is only worth
asking BECAUSE there is now something in there to choose between -- a gate on
an empty room is a rule about nothing.

It also means nobody clears the barrow in one visit, which is the property
the drawing has claimed since v4 without anything making it true.
§7dq: AND THE SMOTHER'S MOUTH ASKS FOR FIRE.

The second use of the crossing predicate, and the second gate on a PLACE
rather than a crossing. It goes nowhere: a citizen refused here has lost a
visit, never a way home, so §14a holds as trivially as it does at the barrow.

Something BURNING, which is a thing anybody may bring at any level and
nobody carries by accident -- a great sword, a great crossbow, the fire-
siphon fed on brimstone. Not a level and not a tier: gating on great weapons
would lock the cave behind gear, where this locks it behind forethought.

## 7do. A Hoard

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:655` by `spec-stubs.mjs`.

§7do: A HOARD. Grave goods, in a barrow, behind a squeeze.

Not a cart: a cart's `unload` takes the DEAREST thing automatically,
because whoever stops at a dead hauler's shelf would reach for the plate
before the ore and a script would do it anyway. A hoard is the opposite --
the whole of it is that a citizen CHOOSES, having got in with three slots.

Not a stall either: nothing is bought here and there is no keeper. It is a
hole in the ground with things in it that somebody was buried with.

## 7dp. Four Masks, And A Citizen Takes One

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:5098` by `spec-stubs.mjs`.

§7dn: RUIN IN A SHAPE. Four glyphs, and between them a citizen can
read what a building USED TO BE.

A rubble field says nothing. One wall standing to full height with a
window still in it says "chapel", and a stump of tower beside it says
how it ended. The Wilderness shot this island keeps being measured
against does exactly that: the ruin is legible because it is BROKEN IN
A SHAPE rather than merely broken.

'j' is the one that does the work. A wall you can see over and step
across is what lets a drawing be a FLOOR PLAN a citizen walks through
rather than a fenced-off silhouette they walk around. A ruin you
cannot enter is scenery; a ruin whose rooms you can pace is a place.
§7do: the grave goods. Eight kinds at most and one of each -- a hoard
is what somebody was buried WITH, not a shop, and the whole design is
that a citizen who got in with three slots has to choose.
Four kinds, and a citizen with three slots takes three of them. The
helm is the prize; the graver is the useful thing; the holy water is
the thing you want if you are going on to the Moorgrave; the bones are
what was actually buried here, and prayer is what they are for.
§7dp: FOUR MASKS, AND A CITIZEN TAKES ONE.

The gold helm that was here took a hundred hours at an anvil, which
made the barrow a shortcut past somebody else's work. These are worth
nothing at all: they soak nothing, sell for nothing, and do nothing
but say where their wearer has been and which of the four they chose.

Four kinds and one take, so the choice is the whole of it -- and it is
made in the dark, three slots deep, past the knight.

## 7dq. And The Smother's Mouth Asks For Fire

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:2269` by `spec-stubs.mjs`.

§7dn: THE SQUEEZE -- the mouth of the Chalk Barrow, and the one piece of
ground on Tallyholm that asks a question before it lets somebody through.

A GATE ON A PLACE, NOT ON A CROSSING, and that distinction cost a whole
build to learn. The first version of this was a third gap in the ridge
passable with a light pack, and it was wrong in a way no threshold could
reach: a crossing always has an alternative to be measured against, so a
conditional one either beats the alternative -- and quietly undoes the weeks
of digging that opened the South Pass -- or is never walked. There is no
third result.

A place has no alternative. You are in or you are not, the gate competes
with nothing, and the restriction turns into a PROPERTY worth having: eight
slots in, eight slots out, so whatever is down there has to be worth a light
trip and nobody empties it in one visit. It is also, precisely, why the
barrow has not already been stripped -- which the drawing has claimed since
v4 without anything making it true.

It gates nothing anybody needs. Not a road, not a seam, not a way home:
§14a's rule holds trivially, because there is nothing on the far side except
the barrow itself.
THREE, NOT EIGHT.

Eight slots was a haulier's limit and it left the barrow a place you visited
with a shopping bag. Three is a decision: you go in carrying almost nothing,
and what you carry out has to be worth the walk back. That is only worth
asking BECAUSE there is now something in there to choose between -- a gate on
an empty room is a rule about nothing.

It also means nobody clears the barrow in one visit, which is the property
the drawing has claimed since v4 without anything making it true.
§7dq: AND THE SMOTHER'S MOUTH ASKS FOR FIRE.

The second use of the crossing predicate, and the second gate on a PLACE
rather than a crossing. It goes nowhere: a citizen refused here has lost a
visit, never a way home, so §14a holds as trivially as it does at the barrow.

Something BURNING, which is a thing anybody may bring at any level and
nobody carries by accident -- a great sword, a great crossbow, the fire-
siphon fed on brimstone. Not a level and not a tier: gating on great weapons
would lock the cave behind gear, where this locks it behind forethought.

## 7dq-ii. A Place May Name Its Own Ground, And The Smother Has To

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:2490` by `spec-stubs.mjs`.

§7dq-ii: A PLACE MAY NAME ITS OWN GROUND, AND THE SMOTHER HAS TO.

`floors` was the only thing a place could say about what is underfoot, and it
says one of two things: a roofed room lays `floor`, and anything else lets
the country show through. That is right for the Nine Stones and the Boneyard,
which are ruins with the moor in them.

It is wrong for a cave. The Smother has rock over it, not sky, and with
`floors: false` every tile in it answered `crags` exactly like the fellside
outside the mouth -- so no window could tell it was underground, and the
whole place is written around being dark. Its own note says the mouth needs
no marker because "the dark either side of it is the marker", and there was
no dark: the window drew a cave as a patch of hillside with eight creatures
standing on it, in daylight, taking no damage from anything, with nothing
said about why.

So a place may name a ground, and naming one is the whole of it: the bridge
already forwards whatever this function returns, `cave` has been in the
window's tile list since it was written, and a surface the window knows is a
surface it can light differently.

## 7dq-iii. And A Window Has To Know

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:6570` by `spec-stubs.mjs`.

§7dq-iii: AND A WINDOW HAS TO KNOW, so there is one definition and not two.

`lit` decides whether the Smother's mouth lets a citizen through, and until
now it existed only inside `crossingView` -- computed for the terrain
predicate, used once, thrown away. A window needs the same answer for a
different reason: the cave is dark, the light a citizen carries is what they
see by, and a torch BURNS DOWN, so the thing is a clock and not a state.

A window that worked it out for itself would be reimplementing the rule: the
weapon table's `burns`, the siphon's fuel, fire-arrows counting as a light,
and the torch's timer. Four things, in a client, drifting. This is the same
argument the terrain makes and it gets the same answer: ask, do not copy.

## 7dr. A Cave-mouth Inside A Cave Is A Door In The Middle Of A Room

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-places-v7.mjs:341` by `spec-stubs.mjs`.

§7dr: A CAVE-MOUTH INSIDE A CAVE IS A DOOR IN THE MIDDLE OF A ROOM.
The first draft put one at the centre, which said nothing except that
whoever drew it had not pictured standing in the place. You are already
in the cave. The mouth is the gap at the bottom and needs no marker: the
dark either side of it is the marker.

AND IT HAD TO GET BIGGER. A fire deep inside is only a checkpoint if
there is a depth for it to be at the bottom of -- a hearth eight tiles
from daylight is a hearth beside the door. So: a mouth, an upper
chamber, a throat one tile wide, and a lower hall with the fire in it.
A citizen with a guttering torch has to decide whether to press on to
the fire or turn round, and that decision is the whole cave.

Solid rock throughout, one gap, exactly as the barrow had to be: '~' is
nothing and the country shows through, so a ring of corners is not a
ring.

## 7ds. And Near The Door, Where There Is One

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:5193` by `spec-stubs.mjs`.

a board at the near edge, because a place with no name is scenery

§7ds: AND NEAR THE DOOR, WHERE THERE IS ONE. The four candidates below
are the four sides in a fixed order, which is right for a ring of
stones and wrong for anything a citizen walks INTO: the Smother's
board fell through to the far side and stood eighteen tiles away at
the deep end, where nobody approaching the mouth would ever read it.

So a drawing with a gap in its closing wall gets its board beside that
gap first. A warning nobody passes is not a warning.

## 7dt. A Torch Is A Log And Nothing Else

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:11537` by `spec-stubs.mjs`.

§6ad: THE HEARTWOOD BOW IS FLETCHED, NOT FORGED.

It was in RECIPES with a `fletching: 90` gate, which made it a bow
you MAKE AT AN ANVIL while shaping heartwood by hand still gave a
beginner's wooden bow. The one crafted bow in the world, forged. Its
whole point is that woodcraft finally has a summit, so it belongs at
the bench with the rest of the bowyer's work.
§7dt: A TORCH IS A LOG AND NOTHING ELSE.

Deliberately the cheapest thing anybody makes: no level, no second
ingredient, no bench. The whole reason the torch exists is that the
Smother was gated on gear at level sixty and should have been gated on
forethought -- so the answer has to be something a citizen on their
first afternoon can carry, or it is the same fault wearing a different
hat. One log, one torch, and the cost is that it burns out.

## 7du. The Drowned Bell

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:778` by `spec-stubs.mjs`.

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

## 7dv. The Tide

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:2911` by `spec-stubs.mjs`.

§7dv: THE TIDE. One window, computed from the interval count, the same for
everyone, and it is the whole of the feature.

THERE WERE THREE AND TWO OF THEM DID NOTHING. A six-minute window twenty
times a day, a fifteen-minute one five times, and this one. They were
chosen when the tide GATED SPEECH at range, and the case for three was a
coverage argument: the far channel stood open 16.7% of all intervals, an
hour at the world caught a window 94% of the time, and the longest stretch
with everything shut was sixty-six minutes. Every one of those numbers was
about whether a citizen could be HEARD.

§7dx repealed that gate, because a world that already allows ninety
minutes a day was making two scarcities out of one and the second only
stopped people talking. The coverage argument went with it and nobody
noticed, so the two short tides stayed: computed every interval, validated
by the constitution, printed in the handbook as "tide 1" and "tide 2", and
read by nothing. The announcement has only ever looked at the longest.

WITH NO GATE, COVERAGE IS THE WRONG QUESTION. You do not need to be inside
a tide. You need to be able to say "at the deep tide" to a stranger and
have them know when that is, and three of them makes that sentence
ambiguous rather than more available. One unmistakable time is the feature;
the rest was answering a question that is no longer asked.

WHY THESE TWO NUMBERS AND NOT PRETTIER ONES. The tide turns every 43801
seconds, so two turns take 87602 -- twelve hundred and two seconds, twenty
minutes, longer than a day. The window therefore slips twenty minutes
later every day and goes right round the twelve-hour cycle in thirty-six.
43200 would be exactly twice a day for ever, so whoever drew four in the
morning would keep four in the morning for life, which is the unfairness
of a raid schedule arriving without anybody choosing it.

(The old note here said `86400 mod P` was the drift. It is not: for this
period that leaves 42599 seconds and means nothing. The rule of thumb was
written for the two short tides, which turn many times a day, and it was
carried onto the long one where it does not hold.)

Thirty minutes open is long enough to arrive late and still find people.

THE SCHEMA STILL ALLOWS EIGHT. A later founding may want more, and the
burden is on that founding to say what they are for; this world ships one
because one is what it uses.

## 7dw. Closing Time

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:6204` by `spec-stubs.mjs`.

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

## 7dw-ii. The Ledger Keeps Its Own Clock Now, Separate From The Promise

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:8259` by `spec-stubs.mjs`.

§7dw-ii: THE LEDGER KEEPS ITS OWN CLOCK NOW, SEPARATE FROM THE PROMISE.

Both ran on `stint.sample`, and only one of them wanted to. The stint is
sampled coarsely on purpose -- "a promise measured to the interval
invites the citizen to watch a clock" -- and the ledger inherited that
without the argument applying to it. A sample charges a citizen for the
WHOLE block it finds them in, so at five minutes a two-minute visit to
look at your crops cost five, and a citizen could lose most of an
allowance to a handful of short visits.

Finer is strictly fairer here, and it cannot be gamed in the other
direction either: the presence lookback equals the sample period, so
there is no quiet gap between blocks to act inside.

IT IS NOT EXACT, AND THE IMPRECISION ROUNDS AGAINST THE CITIZEN. The
lookback is inclusive, so a burst landing on a sample boundary is caught
by that sample and by the next one and costs TWO blocks rather than one.
Measured, not reasoned: one step costs 10 of a 10-interval sample when
it falls mid-block and 20 when it falls on the edge. Left alone, because
the lookback is shared with the promise and tightening it there would
quietly shorten every stint; the honest fix for the cost was to make the
block small, which is this. At five minutes the rough edge was worth up
to ten minutes of somebody's day; at one it is worth two.

## 7dw-iii. Attendance Pay Requires Somebody To Be Attending

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:13619` by `spec-stubs.mjs`.

§7dw-iii: ATTENDANCE PAY REQUIRES SOMEBODY TO BE ATTENDING.

This is the second time this rule has had to learn the same lesson. It
once paid a firekeeper every interval their beacon burned, "anywhere in
the world, asleep, in another country -- twelve thousand experience a
cycle for having once lit something", and the fix was to require them to
be NEXT TO IT. That fixed the place and left the person: a body stays
standing where it stood after the window is closed, so a citizen could
feed the furnace, step one tile, shut the client and go to bed earning an
experience an interval for the hour the fire holds -- and the ceiling
never charged them for it, because the ceiling counts inputs and there
were none.

So it is the world's own measure of presence, the one the promise uses: an
input within the last sample, or an action still running, which is what
keeps somebody watching a pickaxe from having to jog the keys. A citizen
who has done nothing at all for five minutes is indistinguishable from
one who walked away, and the engine says so itself: "a world cannot see
somebody walk away from a keyboard. What it can see is that no input
arrived."

AND NOT THE STOOD DOWN. They have spent their day; the world has stopped
transacting with them, and paying them to stand beside a fire would be
the ceiling's one hole.

## 7dx. A Voice Is Not A Licence Any More

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:6268` by `spec-stubs.mjs`.

§7dx: A VOICE IS NOT A LICENCE ANY MORE.

This required a tide up AND an open stint, on the amateur-radio analogy:
receiving unrestricted, transmitting licensed. The analogy was good and
the rule was wrong, and closing time is what made it wrong.

When a session was unbounded, gating the far channel MANUFACTURED a
scarcity that did not otherwise exist. Now presence itself is scarce --
ninety minutes in any rolling day -- and the two scarcities multiplied.
The far channel stands open about a sixth of all intervals, so a citizen
spending their whole allowance could be heard across the island for
roughly fifteen minutes of it. That is not a bounded conversation. That is
mostly not being able to talk, inside a window that was already short.

And it taxed the wrong thing. The ceiling bounds HOW LONG YOU ARE HERE,
which is the boundary this world wanted. The tide bounded WHETHER YOU
COULD BE HEARD WHILE HERE, which adds no shape and only frustration --
and typing to people while the world goes on around you is most of what
there is to do here.

## 7dy. The Grove

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:4519` by `spec-stubs.mjs`.

§7dy: THE GROVE. A ring of empty plots around each of the two stands worth
tending, and a tree takes two days to come on. Days rather than minutes
because a grove is meant to be an INVESTMENT and not a rotation -- and it
costs nobody any of their ninety minutes, since growth runs off the interval
count and asks for no presence at all.
§7dy: SIX HOURS, not two days, and the experience is the reason.

Two days made a grove an ornament: a farmer could not use it, so the only
citizens planting would be ones doing it as a favour, and public goods that
need favours do not get built. At six hours a farmer sows in the morning,
comes back in the evening, fells and sows again -- and because the ninety
minutes may be split however a citizen likes, two short visits a day is a
perfectly ordinary way to live here.

The experience is the crop rate, exactly. A row of grain is forty for seven
hundred and twenty intervals; a tree is six hours of the same arithmetic, so
it pays 1200 and not a point more. This is NOT a faster method. It is a
LOWER-ATTENTION one -- the same wage for waiting instead of clicking -- and
under a presence ceiling that is worth having without being worth
abandoning the fields for.

What stops it dominating is that there are SIXTEEN plots in the world. The
whole island's grove throughput is capped at a number you can count, and
the ring being empty when you arrive is a race that puts people at the
stands -- which is what the stands were placed for.

## 7dz. The Eels Belong To Whoever Pulls Them Out

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:15824` by `spec-stubs.mjs`.

§7dz: THE EELS BELONG TO WHOEVER PULLS THEM OUT. THE SKILL BELONGS
TO WHOEVER WOVE THE TRAP AND CHOSE THE RUN.

Anybody may lift a buck -- §13h said working an eel spot is
"emptying somebody's trap" and meant it. But paying the lifter the
experience made robbing the fen strictly better than working it:
one action for a full catch against one action, one log and half an
hour of waiting. That is a parasite, and the easiest thing in this
world to script.

So a thief gets supper and no progress. The experience is not
transferred to the setter either -- it is simply gone. Paying an
absent citizen would mean levels arriving while nobody is playing,
and this world does not pay anybody for not being here.

## 7e. One Thing You Can Only Do There

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:4153` by `spec-stubs.mjs`.

================= ONE THING YOU CAN ONLY DO THERE =================

§7e. Thirty-nine of this island's eighty-one buildings hold nothing but a
bed, a hearth and a table -- a door, a floor, and no reason to open it.
The answer is not to furnish them. It is to give a FEW of them the only
place in the world where something can be done, the way the looking glass
has the only face-changing in Tallyholm.

Scarce on purpose. Eight brewhouses would be wallpaper for exactly the
reason nine shrines were.

## 7ea. The Dragon's Isle

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:312` by `spec-stubs.mjs`.

§7ea: THE DRAGON'S ISLE, and it is a different KIND of place from the
three above.

Whiting is twelve by eight and the Lists nine by six -- rocks you cross
in under a minute, visited inside an evening spent mostly elsewhere.
This is thirty by twenty-two: about eight times Whiting's area, and it
is meant to BE the evening rather than an errand inside one.

AND IT IS IN THE WILDS. That is not a detail, it is the whole design.
The dragon cannot be killed alone, so it wants a party -- and a party
that assembled in a place where anybody may hunt anybody is a party you
had to TRUST. Put the isle in safe water and the fight becomes a raid
with a boat ride, which is the one thing it must never be.

It sits at 34,30: open sea inside the Wilds rectangle, a hundred and
sixty tiles west of the Norwick frontier. `inWilds` already covers it --
no rule changes, because the sea west of the line was always the Wilds.

The APPROACH is the content. You cross the frontier at Norwick and walk
west through open hunting ground to reach the quay, and you may simply
not arrive. Everything after that is a fight you chose to have with
people who could have taken it from you on the way.

Closing time is why it is thirty by twenty-two rather than another
twelve-by-eight rock. Ninety minutes is the whole allowance and the walk
spends a real share of it, so the destination has to hold the rest of
the evening or nobody makes the trip twice.

## 7ea-ii. And The Isle Is Swept Last

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:8292` by `spec-stubs.mjs`.

§7dy: THE RINGS GO LAST. Placed mid-build they encircled where the
ironbark stood at the time, and a later pass moved the stand seventy-five
tiles -- leaving eight plots in an empty field. A ring must be drawn round
the trees' FINAL position, so it is drawn when nothing will move again.
§7ea-ii: AND THE ISLE IS SWEPT LAST.

General scatter passes do not know this isle exists, and they left a
campfire and two keepers on it -- a fire to warm yourself at and two
people who would trade with you, on the one shore in the world where
nobody is bound to keep faith with you. Absence is doing the work here,
so the absence has to be enforced after everything else has finished
placing things, or a later pass quietly makes the place habitable again.

## 7eb. An Isle Has A Shore

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:342` by `spec-stubs.mjs`.

§7eb: AN ISLE HAS A SHORE, not a circumference.

This was `dx*dx + dy*dy < 1` and nothing else, so every isle in the world
was a flawless ellipse. It reads as exactly what it is -- a formula rather
than a place -- and it is the more obvious the smaller the isle, because a
nine-by-six rock is entirely outline.

THE MAINLAND ALREADY SOLVED THIS. `coastR` gives the big island its shape by
taking a base radius and adding two `meander` harmonics keyed on the bearing,
and `meander` is hash-based with a smoothstep between whole numbers: exact
arithmetic, no `Math.sin` in it. `angleOf` is trig-free for the same reason.
Geography is hashed into the founding, and two nodes whose trigonometry
disagrees in the last place would build two different worlds.

THAT IS TRUE OF THE COAST AND IT IS NOT TRUE OF THIS FILE. `inlandSet` draws
every mere, tarn and pool with `Math.sin` and `Math.atan2`, and the roughly
fifty places that seat a prop or scatter a cluster use `Math.cos`, `Math.sin`
and `Math.hypot`. The sentence that used to stand here said "no `Math.sin`
anywhere", which was never true of anything but `coastR` and `meander`.

MEASURED, BECAUSE THE CLAIM IS CHECKABLE AND WAS NOT BEING CHECKED. V8 and
JavaScriptCore, the two engines this project ships on, do return different
doubles for these calls: hash a hundred and forty thousand of them and the
two engines disagree. What saves the fifty is that none of them keeps the
double. Every one rounds to a tile, which is half a unit of cushion, or
compares two distances between tiles, which is integers underneath.

THE ONE THAT KEPT IT WAS THE LAKE SHORELINE. `inlandSet` drew every mere and
pool with five sine harmonics and asked `d < rAt(atan2(dy, dx), x, y)`: two
doubles compared raw, deciding water. It had eleven orders of margin and
would never have said so if it had not. It is `meander` and `angleOf` now,
like everything else that decides where the ground stops.

So the two engines build a byte-identical island: all 458,752 tiles, every
settlement, every road. `test/engines.test.mjs` runs both and compares, and
`worldgen-exact.mjs` holds every call in these files to the three cases §2s
allows.

So an isle gets the same treatment as the island it sits beside, at a
smaller scale: one coarse harmonic for the headlands and one fine for the
bites out of them.

AND THE WOBBLE ONLY EVER ADDS. Every tile that was land stays land, which is
not an aesthetic choice: the shrine, the tally-half, the Lists and both
ferry quays are seated by `islesOf` coordinates, and an inward wobble could
drop any of them into the sea and strand a landmark nobody can reach.

## 7f. One Trade To A House, And Never In The Doorway

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:7830` by `spec-stubs.mjs`.

§7f: ONE TRADE TO A HOUSE, AND NEVER IN THE DOORWAY.

Two faults, both visible the moment every room on the island was
drawn on one sheet. Millbrook's bowyer and delver were seated THREE
TILES APART -- the same 4x3 market house -- so one house held two
trades and the house next door held none, and the chart read as
though the bowyer had gone missing. And Eastmere's fishmonger stood
in the gap in its own wall: a stall blocks its tile, so the trade
was corking the only way into the building it trades from.

A doorway is a gap in a run of wall, so it has wall on two OPPOSITE
sides. `freeSides >= 2` cannot see that -- a doorway has exactly two
free sides, in and out, which is why it passed.

## 7g. The Altar

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:828` by `spec-stubs.mjs`.

§7g: THE ALTAR. Three quick-stones become a sigil here and nowhere else.

## 7h. Who Lives Here

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:4208` by `spec-stubs.mjs`.

---- WHO LIVES HERE ----
§7h. Thirty-nine rooms held a bed, a hearth and nobody. The answer is
not another verb -- three rooms with the only place in the world where
something can be done is the right number of those -- it is that
somebody lives here. See worldgen-residents-v7.mjs.

A resident blocks their tile like any keeper, so each seat was chosen
off the room census: interior floor, never the doorway, never the cell
whose removal seals the room. The founding checks all three anyway,
because a person standing in a door is how this island has corked a
building three separate times.

## 7i. A Gonne Is Not A Magic Item

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:4783` by `spec-stubs.mjs`.

§6av: quickmetal, because that is where the scarcity already lives -- a
quick-stone is mined in the WILDS, so every one has survived a trip
somebody could have died on. Against citizens who automate, effort is not
a limit and risk is: a level gate is paid overnight and a failed roll is
only a throughput multiplier, but a pack dropped in the Wilds is gone.
§7i: A GONNE IS NOT A MAGIC ITEM. This asked for four quick-stones, which
is the Wilds' ore, because the handgonne was designed before this world
had coal or brimstone and the only "gambit" material to hand was magic.
A firearm made of magic is a wand with extra steps.

Iron for the barrel, ironbark for the stock, brimstone for the proofing:
the Crags and the Greenwood, and no errand into the Wilds. The comment
below already complained that asking the Wilds for the powder as well was
two bottlenecks for one weapon; it is now zero.

## 7j. Flour Becomes Bread

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:16707` by `spec-stubs.mjs`.

§7i/§7j: FLOUR BECOMES BREAD, on the same tally as every other cook.
Grain goes to the mill first (see `grind`); a loaf is two steps and a
destination, which is what earns it seven points and beats a fish.
§7bw: SALTING IS COOKING WITHOUT A FIRE.

The saltern needed no new verb: `cook` already means "turn this raw
thing into food where you are standing", and where you are standing is
the whole difference. At a fire a fish is cooked; at the pans on
Whiting Isle it is SALTED -- worth two less to eat and stackable, so a
citizen crosses with an empty pack and comes home with a column.

It never burns. Salt does not overcook, and a trade that cannot fail is
the compensation for a trade that must be done on an island.
...and ANY raw fish, not just the common one. The first cut asked for
'raw-fish' by name, so a deep fish or an eel carried to the pans could
not be salted at all -- an arbitrary line through three things the rest
of this function treats alike, and exactly the fault the note at the
top of the rule describes about cooking deep fish.

A salted deep fish is worth more, as a cooked one is. An eel salts to
the common bite: it is a poor fish however you keep it.

## 7j-ii. Bread Is The Hearth's, Not The Shore's

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:16737` by `spec-stubs.mjs`.

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

## 7k. And The Square Itself Is Plaza

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:2570` by `spec-stubs.mjs`.

§6cz: MILLBROOK IS A MARKET, AND A MARKET IS PAVED. The market's
drawing is spacious -- shops with a plaza between them -- and
townPaved only pays the tiles beside a building, so the open market
came out as grass with shops standing in a field. A market square is
cobbled end to end; pave the whole of its rect.
§7k: AND THE SQUARE ITSELF IS PLAZA. `plaza` is a ground kind this
constitution has always declared and NEVER LAID -- not one tile of
it existed anywhere on the island, while 5,334 tiles of flagstone
did. The market town's market square was flagstone like its side
streets, which is why it read as a wide street rather than a place.

The middle of Millbrook's rect, clear of its buildings, is plaza
now: the ground a citizen may raise a stall on (§7k in engine.js),
and the only such ground on Tallyholm.

## 7l. The Bare-blade

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:3069` by `spec-stubs.mjs`.

§7l: THE BARE-BLADE. Its damage is what you are NOT wearing.

`bare` adds floor((40 - armourOf(you)) / 4) to maxHit -- ten when you
stand in nothing, nothing when you stand in a full quick suit. Naked it
strikes like a mell without the mell's poor accuracy; clad it is worse
than an iron dagger. It is not an upgrade. It is the flail's argument
pointed the other way: an ANSWER, and only to one thing, and the thing it
answers is your own plate.

The price is already in the engine and it is severe. Since 6x-ii armour
does not soak damage, it lowers an attacker's CHANCE -- so standing in
nothing does not merely forgo protection, it hands every enemy in the
world a far better roll against you. This weapon doubles what you deal
and roughly doubles what you take. Nothing new had to be invented to pay
for it.

6aq repealed the armour tax on the grounds that "armour which only helps
is a checklist rather than a choice -- everybody wears the best they own
and going without is a handicap". The repeal answered whether armour
DOMINATES; it never made going without a decision. This does.

(The name is the old one. A berserkr was a bear-shirt, and the reading
that has always fitted the fighting is ber-serkr: BARE of shirt.)

## 7m. The Fall-stone

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:8020` by `spec-stubs.mjs`.

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

## 7n. A Field Is Not A Wall

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:12286` by `spec-stubs.mjs`.

§7n: A FIELD IS NOT A WALL. A plot blocked its tile, so a block of them
was a solid mass and only the outer ring could be stood beside -- and
`harvest` wants ADJACENCY. Measured on the seventh founding: 1,269 of the
island's 1,370 field plots could not be reached by anybody. Seventy per
cent of the ploughed land was scenery, and no drawing could fix it: any
shape two tiles thick has an unreachable middle.

Ploughed ground is walked over. You stand in one furrow to work the next,
exactly as nothing in this engine strikes the tile it stands on, and the
hedge round the furlong still says where the field ends.
§14d: a FINISHED span is decking, and decking is water you can walk on. The
spanwork it grew from is deliberately NOT here -- an unfinished bridge bars
its tile exactly as the beck under it does, which is the entire reason the
crossing is worth fighting over before it is done.

## 7o. And The Country Speaks Its Own Vocabulary

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:5715` by `spec-stubs.mjs`.

§6ao (v6): a waymark is TEXTURE at a road bend, not a gatherable node.
It used to drop a tree or a rock at every bend -- eighty scattered
little gathering spots along the roads, exactly the scatter that keeps
citizens apart. Now it is a landmark (a standing stone or a stump): the
same silhouette to steer by, but you gather at the Schelling points.
§7o: AND THE COUNTRY SPEAKS ITS OWN VOCABULARY.

One hundred and thirty-five waymarks drawn from TWO kinds -- a stump or
a standing stone -- is why the roadsides read as generated. It is the
wallpaper fault again (see the note in worldgen-places-v7 about eight
rotating kinds), and the cure is not fewer marks, it is more words: a
node kind costs nothing, and a country that repeats itself twice a mile
has no landmarks at all, only furniture.

So each country marks its roads with what that country has. The Crags
put up stones and cairns; the Greenwood leaves stumps and log-piles;
the Moor has cairns and lone thorns; the Fens have hurdles and eel
racks; the Downs have sheep hurdles and dew-marks; the Wilds have
whatever was left standing. Same silhouette to steer by, twelve words
instead of two.

## 7p. The Seam Gives Ore, Not A Finished Bar

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:947` by `spec-stubs.mjs`.

§6ao (v6): the clean mining chain -- iron (baseline) -> coal (mid) -> steel.
v6 mines IRON where v5 mined generic 'ore'; the baseline gear is iron
worked simply, and STEEL is iron quenched with coal. v6 places iron-rock,
never the old rock, so v5's ore is untouched.
§7p: THE SEAM GIVES ORE, NOT A FINISHED BAR. It gave `iron` -- metal,
ready for the anvil -- so the deepest supply chain in the world was also
the shortest: strike the rock, walk to the forge, done. Ore now, and the
furnace at Cragfoot turns two of it and a coal into the bar.
§7p: THE SEAM GIVES IRON ORE. It gave `iron` -- a finished bar, ready for
the anvil -- so the deepest chain in the world was also the shortest.

The first cut of this pointed it at `ore`, which was WRONG and worth
recording: `ore` is the generic of the first founding, what the plain
`rock` gives, from when there was one tier and it was iron. Iron ore is
not that, and a seam that gave the retired generic would have made iron
stock and iron stock the same substance.

## 7p-ii. Count The Units, Not The Slots, And Spend Only What Is Asked

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:15280` by `spec-stubs.mjs`.

§7p-ii: COUNT THE UNITS, NOT THE SLOTS, AND SPEND ONLY WHAT IS ASKED.

This counted SLOTS holding the item and then nulled whole slots to pay
the cost. For a bar that is the same thing -- bars do not stack -- but
several earthcraft inputs DO: shot, flour, arrows, javelins. A recipe
asking for one unit of a stacked good was told the citizen had one
(one slot), then took the entire stack for it. A hundred shot bought a
single forging.

## 7p-iii. What A Recipe Costs, Paid In One Place

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:10164` by `spec-stubs.mjs`.

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

## 7q. A Round Log Is Not A Plank

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:10771` by `spec-stubs.mjs`.

§7q: A ROUND LOG IS NOT A PLANK.

Woodcraft went tree straight to use, like earthcraft before the furnace,
and the difference is that a plank already had THREE buyers waiting: a
citizen's stall, a citizen's brewpot, and the deck of the Millbrook
Bridge -- whose keeper is mending it, and you cannot plank a bridge
with a round log. That last one was always slightly wrong and nobody
noticed until the sawpit existed to make it right.

One sawpit, at the Sawyer's Camp in the Deepwood: a place that has had
a sawyer standing in it and nothing to saw since the day it was drawn.

## 7r. The Furnace Burns Too, And Somebody Has To Keep It Lit

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:11500` by `spec-stubs.mjs`.

§7r: THE FURNACE BURNS TOO, AND SOMEBODY HAS TO KEEP IT LIT.

Coal was an ingredient of the iron bar and of nothing else that
mattered -- while steel gear took iron AND coal at the anvil, and
steel itself was never smelted at all. Three different answers to one
question, which is how you can tell nobody had asked it.

One answer: THE FIRE IS THE FUEL. A bar costs only its ore; the coal
goes into the furnace, by anybody, at any time, and while it burns
anyone standing there may smelt. That is the watchfire's design
exactly -- the one public work in the world -- and it makes a JOB out
of a vending machine: somebody feeds the fire while the crowd smelts,
and is paid in earthcraft for doing it.

## 7s. And A Lit Public Fire Cooks As Well As A Hearth

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:16787` by `spec-stubs.mjs`.

6bf: a proper hearth forgives a cook what a field fire does not
§7s: AND A LIT PUBLIC FIRE COOKS AS WELL AS A HEARTH.

Cooking's bonus lived at a hearth, and every hearth in the world is
indoors in a town -- so the best place to cook was always a kitchen,
and the fisherman on the quay carried their catch home. Anyone who
has fished in a game like this remembers the other thing: somebody
calls for a fire, somebody else lays one, and a crowd cooks together
at the water's edge.

A watchfire that is BURNING now cooks like a hearth. Not a rule about
quays -- a rule about fires, which makes the quay the best cooking
spot on the island only because somebody chose to keep a fire there.
The same bargain as the furnace: one citizen feeds it, everybody
works at it, and the feeder is paid for the feeding.
there is no adjacentNode() helper -- hasAdjacentNode answers yes or
no, and the keeper's fee needs the node itself

## 7t. The Yard

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:3800` by `spec-stubs.mjs`.

THE SHEEP (spec 6ag). The Downs is downland: twenty-two thousand tiles
of it, twenty-eight living things on it, and a locale in the middle
called the Sheepfolds. The map has been promising sheep since the fourth
founding and the world never delivered any.

NO `aggro` AT ALL, which is the difference between this and the crab. A
crab keeps its aggro on purpose -- it walks at you so you can gather
three at once. A sheep that walked at you would not be a sheep. With no
aggro it never starts anything, and `harmless` means that if you start
it, it swings and never lands.

The health is the whole balance and it is not decoration. Safe country
plus a quick kill is a training dummy, and this world's position is that
standing is paid for in time: a sheep with five health in the safest
country on the island would be the cheapest prowess in the world. Forty,
at defence eight, makes a sheep about a minute's work
-- livestock, not a dummy -- which is the same reason the crab is ninety.
§7t: THE YARD. A dummy and a butt are MOBS, not furniture, and that is the
whole trick: `attack`, `attackp`'s gambits, a drawn bow and the damage
readout all work on them already, unchanged. A new verb would have had to
reimplement combat badly beside the real one.

Enormous health so they are never actually felled, no aggro, harmless,
and def 1 so they are hit nearly every swing -- you came to read a number,
not to roll for it.

## 7u. The Trees That Are Not Timber

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:8731` by `spec-stubs.mjs`.

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
wanted woodcraft. These are landmarks -- no verb reaches them -- so a
country can have trees the way a country does: willows where the water is,
dead ones where the land turned, pines on the high ground, and an AVENUE,
which is the only one of them that says a person did it on purpose.

## 7v. A Deck Is A Rectangle

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:1238` by `spec-stubs.mjs`.

§7v: A DECK IS A RECTANGLE.

Each row used to span exactly as far as the water ran ON THAT ROW,
which is right for a straight channel and wrong where two waters meet.
At the Watersmeet the march joins the river, the water runs diagonally
across the crossing, and the deck came out ragged: continuous on one
row and leaving open water beside it on the next two. You could cross,
on one row of three, and it read as a blob rather than a bridge --
which is verbatim the fault this function's own note describes from an
earlier version, fixed for straight channels and never checked at the
one crossing where two waters meet.

So the span is measured across ALL the deck's rows and the widest run
wins. A bridge is one shape.

## 7w. A Shed Round The Fire, And The Approaches Left Clear

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:4859` by `spec-stubs.mjs`.

§7w: A SHED ROUND THE FIRE, AND THE APPROACHES LEFT CLEAR.

Two faults in the first cut and the second is the bad one. The
furnace was ONE TILE in an open grey waste -- smaller than a
barrel, for the only furnace on the island, when the mill was given
a five-tile round-house precisely so it would not read as a
trinket. And its spoil heap, log pile and cut face went at x+1,
x-1 and y+1: THREE OF THE FOUR WAYS IN, leaving a single approach
tile to a place a crowd is meant to gather at.

A bloomery shed now, with a wide door, and the yard goods set well
outside it. Nothing that blocks stands beside the furnace.
§7w: THE BLOOMERY SHED. Walls, a wide south door, the fire in the
middle where the crowd can reach it from three sides at once.

## 7x. And Steel Is A Bar

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:4957` by `spec-stubs.mjs`.

§7x: AND STEEL IS A BAR. It was the last incoherent corner: every other
metal in the world is smelted, and steel gear was forged straight out of
iron AND COAL at the anvil -- which is to say the anvil was doing the
furnace's job, in nine recipes, for the one metal that is actually MADE
rather than merely shaped. Iron carburised in the fire is a bar like any
other, and the coal is the furnace's fire, per §7r.

## 7y. A Place Outranks A Field It Was Drawn Through

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:5147` by `spec-stubs.mjs`.

§7y: A PLACE OUTRANKS A FIELD IT WAS DRAWN THROUGH.

The towns' furlongs are laid earlier and sprawl a long way -- Oxenford's
reach from x315 to x380 -- and the hand-drawn places are set down
afterwards, so the apiary's fence came down INTERLEAVED with ploughed
rows: `..p.p.###` on one line, a pen and a field sharing tiles. It is
the ordering fault of §19e once more, and the answer is the one that
rule already gives: the later pass corrects what it finds.

A place is eighteen hand-drawn buildings; a furlong is a pattern
stamped over half a shire. The plough gives way.

## 7z. A Place May Not Seed A Tier

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-expanse7.mjs:5297` by `spec-stubs.mjs`.

§7z: A PLACE MAY NOT SEED A TIER.

The Sawyer's Camp asked for two oaks and a heartwood, Deadreach for a
gallows-oak, the Kingswood for a heartwood -- five gatherable trees
standing outside the seam table, in clusters of two and three. The
seam table's own tree clusters are THREE, FOUR and TWO nodes, so
these were not decoration beside a tier, they were extra tiers: a
fourth and fifth place a woodcutter could stand that nothing
sanctioned.

This island already carries two or three clusters per tier rather
than the one a Schelling point wants. It cannot afford five. A
forester walks to the seam and carries the logs to the sawpit, which
is what a sawpit is for.

## 7aa. One Schelling Point Per Tier

> **DERIVED, NOT YET RATIFIED.** Drafted from `worldgen-seams-v7.mjs:17` by `spec-stubs.mjs`.

---- SOURCE: worldgen-seams-v7.mjs ----
THE SEAMS OF TALLYHOLM.

Ninety-two gatherable nodes on an island of 458,752 tiles, and that ratio is
the design rather than an oversight. A seam here is a SCHELLING POINT: a few
remembered places a crowd converges on, so that "I am going to Cragfoot to
mine" is a sentence with a destination in it. A wood with a tree on every
third tile has no Greenhollow in it, and a citizen who can gather anywhere
never goes anywhere.

These were already placed that way. What changes here is that they are
WRITTEN DOWN: six seeding routines that had to be re-derived to be
understood are now a list somebody can read, move a line in, and re-found.
The numbers are unchanged from the founding that produced them.

A place's own seam is NOT in this table -- the coal at the High Delving and
the heartwood at the King's Oak belong to those drawings and move with them.
§7aa: ONE SCHELLING POINT PER TIER.

The seams were made few and findable on purpose -- 94 nodes where the old
scatter had 653 -- and the reason was that scarcity only makes a MEETING
PLACE if there is one place. Three tiers had drifted into two and three
clusters apiece: iron in three, quick-rock in two, the plain tree in three.
That is not scarcity, it is the same scarcity divided, and it buys nothing.

Nineteen nodes moved into their tier's main cluster. The plain tree keeps
its Hollybarrow pair, which is not drift: a starter tier beside the first
town a newcomer reaches is a second point somebody chose.

## 8a. Smoking, And The Window

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:2588` by `spec-stubs.mjs`.

§7dg: SMOKING, AND THE WINDOW.

Longer than a ferment (genesis.brew.ferment is 3000) because smoking is
slower than fermenting and because the rack is the scarcer vessel: there
are four in the world and eight brewpots to a citizen.

Module constants and NOT genesis, deliberately. validateGenesis pins
genesis.brew by an exact key list -- Object.keys(bw).sort().join(',') --
so a `smoke` block there is a constitutional change to a table that has
nothing to do with eels. These are the same shape as ROT_TICKS above.

THE WINDOW IS THE LOAD-BEARING NUMBER. §8a made the inn's pot hold nothing
so that no citizen could sit on it, and four racks world-wide is exactly
the case that rule feared. The answer is not the public-pot trick -- the
scarcity here IS the design -- it is a clock on BOTH ends: a rack finishes,
stays collectable for a window, and then the catch is over-smoked and the
rack clears itself. The longest anyone can hold a rack is bounded, it
costs them the eel, and it resolves with nobody intervening.

It also turns a rack into an APPOINTMENT. You have to come back, and being
late is a real loss -- which is the one thing a world with no clock of its
own has been short of.

## 8e. The Clamp

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:7888` by `spec-stubs.mjs`.

§6bo: THE CLAMP. Ten ironbark charred at a burning
watchfire make one charcoal. The constants live here
because §8e says a shape is constitutional and a number
is a founding's: a world that finds ten too dear founds
itself with eight and forks nothing.

## 9b-ii. And The Record Of What Happened

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:8463` by `spec-stubs.mjs`. Amends §9b.

Imported citizens are FOUNDING data: they enter the world before any
input is ever validated, so they get a dedicated, complete validator
(rev6 §2) IDs, names, skills, XP, HP, inventory, bank, equipment,
quantities, item vocabulary, and cross-entry uniqueness.
§5k: `calling` is in this list because `xpCeiling` reads it. A crossing
that drops the swearing does not lose a title, it makes every hour the
citizen spent past level 50 illegal, and the founding then refuses the
state it has just built. See the note in validateImports.
§9b-ii: AND THE RECORD OF WHAT HAPPENED, which a crossing used not to carry.
Every one of these is a tally or a list that only ever grew, so carrying it
is continuing a life rather than editing one. Position, health and the ground
are the new world's business and are deliberately absent.

## 9b-iii. Or From The World Before This One

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:14560` by `spec-stubs.mjs`. Amends §9b.

---------- §9b-iii: OR FROM THE WORLD BEFORE THIS ONE ----------

The same deed, the same shape, a different tree. A citizen whose
world lost its quorum holds their own record and a path against the
root that world ended on, and this founding's genesis named that root
(`genesis.from`). So they walk back in on their own, months later,
without the founder having read them out of a checkpoint and without
anybody holding anybody else's data.

NOT SEATED RAW. The record above came out of THIS world's own
archive, so it is already a citizen of here. This one is not: it
holds a position on another clock, an action half finished, a deed
from an interval that no longer exists. It goes through the same door
a founder's import does -- `carriedFrom`, then `validateImports`,
then `seatImport` -- because what crosses must not depend on which
way a citizen came.

AND THE LEAF IS SPENT, in the state's copy of the tree. The genesis
keeps the claim and cannot be edited; the state keeps the record of
who has used it. Without this, a citizen could come home, go absent
long enough to be archived, and come home again on the same file.

## 21d-ii. Has To Be Re-read, Because It Is No Longer The Same

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:15396` by `spec-stubs.mjs`. Amends §21d.

§21d-ii: AND `q` HAS TO BE RE-READ, BECAUSE IT IS NO LONGER THE SAME
OBJECT.

`ownPlayer` is copy-on-write: the first write to a citizen in a tick
REPLACES s.players[pid] with a fresh copy. `strikeConsequences` is
that first write for the victim -- it brands and sets their answer --
so every line after it held a pointer to a discarded object. Each
blow of the gambit was rolled, computed and applied to a ghost: the
damage was right, the health went down, and the state that got hashed
never saw it. EVERY gambit in the world dealt exactly nothing,
melee and drawn alike, while still spending the arm and the arrows.

The ordinary path never hit this because it resolves in the action
phase, where the target is already owned.

## 2287. Interval To Stop Them Equivocating -- Signing Two Different Futures

> **DERIVED, NOT YET RATIFIED.** Drafted from `engine.js:16515` by `spec-stubs.mjs`.

§7.3a: and the pack, in one deed. §2287 gives a citizen one INPUT an
interval to stop them equivocating -- signing two different futures
for the same tick. It says nothing about how much one deed may move,
and every other resolver here moves as much as its rule describes.
