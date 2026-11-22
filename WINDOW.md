# Interval: The Window (`WINDOW.md`)

*Not part of the constitution. Not hashed. Binding on no node.*

## Why this file exists

`SPEC.md`, `LIFTED.md` and `HISTORY.md` are hashed together into the rules
hash, and that hash is in the genesis: a world founded under one cannot accept
another. That is correct for the rules, and it had an absurd consequence. A
note about which way a creature faces, or how fast an arm swings, or what
colour a bow is painted, was going into a hashed document, so **a drawing
change forced a refounding of the world**. The last round of window work moved
the rules hash three times for changes no node computes anything from.

The rules say what the world DOES. This file says what a window DRAWS and how
it answers a hand. Nothing here constrains the engine, the generator or the
protocol; nothing here is consensus; a node that disagrees with every word of
it is still a node in good standing. A second window could implement none of
this and be correct, only worse.

**The boundary is the subject, not the file the code lives in.** A rule about
what a client may SEND is protocol and stays in `SPEC.md`: that is why §0g,
which says a window must never send `spawn` on its own initiative, is not in
here, and why the ground-serving family at §7ec is not either, since it
defines an endpoint. What is in here is drawing, sound, and the interface.

## The numbers are the ones the code already cites

These sections keep the numbers they had in `SPEC.md`, because the window's own
comments cite them by number in several hundred places and renumbering them all
would be churn with a chance of error and no gain. A citation of §7ek resolves
here now. Two exceptions, corrected on the way out: §7f-iv and §7f-v were
written against a §7f that is a rule about market houses and has nothing to do
with bows, so they are **§7eq** and **§7er** here.

One known fault left standing. The window writes a bare **§7f** 57 times under
26 different headlines, and `SPEC.md`'s §7f is "One Trade To A House, And Never
In The Doorway", which is a rule about seating market stalls.

It was first recorded here as a mis-citation of the window's weapon-movement
rule. That was wrong, and reading the headlines is what showed it: they cover
the sound coming back on, the signposts, wall thickness, the edge of an empty
pack slot, landmark art, dragon bones, bows, gambits and what the world calls
`health`. **It is not a citation at all.** It is a tag from one round of window
work, reused for everything done in that round, and the same is true of the
§7f-ii, -iii, -vi, -viii and -ix beneath it.

So there is no single rule to author and point them at. Either they are struck
out as the markers they are, or each is given the section it actually belongs
to. Neither is done here.

## 7ef. The world does not label itself

**A creature says what it is when it is pointed at, when it is fighting, and
when it is wounded. Not otherwise.** Every creature carried its name, its
health and its maximum hit in a plate over its head at all times. Nine sheep
at the Sheepfolds put up a wall of text that overlapped itself into "sheep
40/40 hp hitsheep 40/40 hp hits 1" and covered more of the field than the
sheep did; three goblins at the High Delving took more screen in labels than
in goblins.

This is the same rule the menus already follow (§7y: a menu lists only what
is possible at that moment), applied to the picture. The interaction model
this window took from has no floating nameplates either: you hover and the
window tells you, and a health bar appears over a creature once it is in a
fight.

**A wound is an event with a tail, not a state.** Three rules were tried and
the first two were both wrong. "While wounded" put a permanent bar over a
citizen who took one blow and walked away: an hour of a fixture saying
something that stopped being news in the first second, which is the always-on
fault this section exists to end. "Only at the blow", the 320ms of the
flinch, is worse -- an exchange lands every tick or two, so the bar strobes
through a fight and is absent between the blows, exactly when it is wanted.

So it stays while the wound is RECENT: eight seconds, long enough that no
fight can gap it and short enough that walking away clears it. The same
number for citizens and creatures, so a fight does not have two clocks in
it.

**Nothing tracked the pointer at all.** The only thing the window knew about
the mouse was where it had been CLICKED, which is why everything labelled
itself: there was no other moment to say it in. A hovered tile is a
three-line addition and it is what lets the rest of the picture be the world.

**The health bar follows the name.** A sheep at full health standing in a
field is not in a fight and has nothing to report. Pointed at, fighting or
wounded, same as the words. The citizens' bar already worked this way; the
creatures' did not, in fourteen separate places, one per creature. It is one
decision now and all fourteen read it.

**And people are not an exception.** The first attempt at this kept a name
permanently over every citizen's head, on the argument that a crowd of
unnamed figures is a crowd you cannot speak to, and that the game this
window takes its interaction from does it that way.

The second half was false. It does not: what floats over a player's head
there is their CHAT, and the name is hover text, the right-click menu and the
line in the chat box. This window has had speech bubbles over heads, four
seconds, since long before any of this -- so the mechanism that puts a name
into the world was already present and already the right one. Somebody says
something; their words appear over them and their name appears in the chat
box beside the words.

**A person announces themselves by speaking.** That is what chat being the
centre (§1) actually means, and it is a better thing than a label saying
somebody is standing there. Hover for who they are; speak to be known. The
camera follows your own citizen, so you do not need a label to find yourself.


## 7eh. A creature faces the way it is going

**Fourteen of the window's twenty-two creature drawings never read their own
facing.** The window works one out for every creature on every frame --
`mobFacing`, from the direction it moved, or from whoever it is angry at --
and fourteen of them threw it away and drew a fixed side-on sprite.

The sheep's face was written at `X + 31`. So every sheep on the island faced
right, permanently, whichever way it was walking; and so did every boar,
goat, crow and adder, the shore crab, the great spider, the siren, the
lamprey, the barrow-wight, the scree imp and both gibbet creatures. They
wander. They simply never turned while doing it.

**This is what "the world looks generated" is actually made of.** Not the
scatter and not the shapes: a field of nine sheep standing in identical
poses pointing the same way is a thing nobody would ever draw and a thing a
table produces by default.

**One mirror, not fourteen fixes.** A horizontal flip about the tile's centre
when the facing is left, wrapped round the art, so a drawing does not have to
know it is being turned and the next creature somebody writes gets it for
free. The flip ends before anything that prints a WORD -- the siren's "taken",
the lamprey's "spent" -- or the word comes out back to front, and before the
health bar, or it would empty from the wrong end.


## 7ei. The right button belongs to the world

**Right-clicking anything in the flat window raised the browser's menu.**
Back, Reload, Save As, Inspect, over the game. The world had exactly one
pointer listener on its canvas, `click`, which is the left button, and
nothing ever called `preventDefault` on a `contextmenu` there. So the button
the interaction model is built on (§5t: left does the default thing, right
offers every option) reached the world nowhere except the pack, which
suppresses it on its own element.

**The handler is a named function and both buttons call it.** A listener body
cannot be called twice. The browser's menu is refused over the canvas always,
including on tiles where the world offers nothing: a right-click that
sometimes gives you Reload is worse than one that reliably gives you nothing.

**What it reaches, measured.** Thirty-one kinds of thing answer a press.
Thirteen build a list through `chooseAction` and now open it under the
pointer. The other eighteen have exactly one thing that can be done to them
-- a waystone is read, an anvil is worked, a guard nods -- so they do it, and
that is §7y rather than a gap: a menu of one option is worse than the option.

**And every menu over the world carries `walk here`.** It is the one option
the left button can never give you, because the left button's whole job is to
do the thing: a way onto a tile that has something on it without setting the
something off. It is appended in `chooseAction` rather than written into
twenty option lists, for the reason that function already gives -- one list
either way, or the two inputs drift into offering different verbs.

**So the eighteen offer their one action instead of performing it, when it is
the right button.** The word for each is the plain verb for what the branch
already does, taken from the sentence the window already feeds when it does
it: the bell "goes out over the whole town", so you ring it; the pell "takes
a BLOW", so you strike it; the sigil "is made". Nothing is invented.

**A phone has no right button, so the long press is the right button.**
`contextmenu` is a desktop event. Android Chrome happens to fire it on a long
press, so the menu worked there by accident; iOS fires it never and raises
its own selection callout instead, which is the same fault as the browser
menu opening over the game, on the client that cannot work around it. The
packaged iOS app is a web view and inherits it exactly.

So the window times the press itself rather than waiting for an event the
platform may never send: 450ms, cancelled by a lift or by moving more than
ten pixels, which is a thumb's wobble rather than a drag. The canvas also has
to tell the system to keep its hands off the gesture -- `touch-action: none`,
`-webkit-touch-callout: none`, `user-select: none` -- or the browser gets
there first.

**And the tap that ends a long press is not a tap.** It arrives as an
ordinary `click`, so without refusing it the world would open the menu AND do
the thing the menu was offering. It is refused inside the handler rather than
by a listener that swallows the event: for a listener on the TARGET element
the capture flag changes nothing, the two run in registration order, and the
swallower would have fired second.

**The list of eighteen was wrong, and the test is what asks.** Written by
reading the handler for branches that ACT, it missed six: `bell` is the same
rope as `bellwork` under a second name, `butt` is the pell's archery twin,
and `signpost`, `crier`, `palisade` and `wall` are only ever READ, so a search
for branches that do something could not see them. The check asks the HANDLER
what types it answers and refuses any that neither build a list nor have a
word, which is the difference between a list somebody wrote and a list the
code agrees with.


## 7ej. Everything in the world reacts to being hit, and moves between ticks

**A struck creature is thrown back, the way a struck citizen is.** The window
has recoiled a wounded citizen for a long time: 320ms, along their own
facing. Nothing else in the world did, because the comparison that notices a
blow -- this tick's health against last tick's -- was only ever made over the
PLAYERS. You could hit a wolf and the wolf did not move. The number on its
health bar was the only thing that said the blow had landed, and while that
bar was always on (§7ef) a fight read as two figures standing in a field
while an arithmetic went on somewhere else.

The same two lines over the creatures, and the recoil applied ONCE around the
whole creature chain rather than in twenty-two drawings. Anything written per
creature is written twenty-two times, forgotten on the twenty-third, and the
twenty-third is the one somebody adds next year.

**And it lunges when it lands one.** A creature that flinches but never
strikes is being beaten rather than fought: every piece of motion in an
exchange belonged to the citizen. Nothing on the wire says "this beast hit
you", so the window reads the same two facts the engine used to decide it --
a citizen whose health just fell, and a beast that is angry at them BY NAME.
A beast merely standing near somebody who took a wound does not lunge.

The lunge is 260ms against the recoil's 320, deliberately, so an exchange
reads as two separate things happening rather than one wobble.

**No flash.** The first attempt lit the creature under the blow by painting a
tint through `source-atop`, which paints wherever the canvas is already
opaque -- and the GROUND is opaque, so it put a pale square on the grass. The
citizen has no flash either. A thing thrown backwards has visibly been hit.

**And they move between ticks, which is the whole job of this window.** Four
creatures animated off `world.tick`: a crow flapping once a second is not
flight, it is a shrug, and a hanged body twitching once a second is not a
sway. Three more had no motion written at all -- a boar, a goat and an adder
standing perfectly still in open country.

**Tick-aligned motion stays tick-aligned**, and the two are different things.
The gibbet-dead's arm winds back on the tick on purpose, because it matches
the interval at which the thing strikes. Its SWAY is not an action, it is a
body hanging in the wind, and that belongs to the frame clock.

**The training pell is the one thing allowed to stand still**, because that is
what it does. It flinches when struck like everything else.


## 7ek. Every deed the rules allow is reachable in the window

**A verb the engine accepts and the main window has no button for is, for
practical purposes, a rule that does not exist.** window-web is the window
almost everybody will ever use. Measured by pressing every kind of thing on
the island rather than by reading the source, six deeds the rules allow could
not be filed from it at all: `swear`, `teach`, `part`, `grave`, `setbuck` and
`sapling`. Swearing a calling is the centre of this world -- one mastery to a
citizen -- and the bar stopped at fifty, the skill guide said "until you
swear", and there was no way to swear.

**Three checks looked like they were asking this and none of them was.** Each
read the ACT LADDER, which has carried `swear`, `teach` and `part` since §5w,
and a grep of the ladder passes whether or not anything sends the word. That
is the same trap as a fallback that draws a real thing (§7f-ix) and a margin
note that says "generated" (§7f-viii): the evidence looked like the fact.

**So the question is asked of the HANDLER.** `check-window-reach.mjs` stands
the real window up with a fake document and a fake audio graph, presses every
one of the sixty-six node types and every one of the hundred and twenty-nine
things a citizen can hold, and reads what comes back. It asks four things:

1. every input type the engine has a schema for is either sent by the window
   or named as something no citizen presses, with the reason;
2. every node type answers the right button with a menu that SAYS WHAT IT IS
   and offers more than one thing;
3. every item answers both buttons: a left click does the first thing on the
   list, a right click shows the list;
4. every verb that goes out has a noise and a posture, or is named as
   deliberately silent or deliberately instant.

**A right press must never do the left press's work.** Thirty-one node types
had no entry in §7ei's table and no branch of their own, so they fell through
everything to the gathering fallback: right-clicking a tree swung the axe, and
pressing a FENCE sent the engine `gather` on a fence, which it refuses in
silence. A cold furnace was lit on either button and a stranger's stall was
bought from on either button.

**A menu says what it is about.** Every menu over the world is headed with the
thing's own name and carries a way to ask what it is, written in
`chooseAction` for the same reason `walk here` is written there: one list
either way, or thirty option lists drift into offering different things. What
a look says is NAMES AND LEVELS, never yields, odds or tactics, by the rule
the skill guide already follows (§6bv).

**The pack had the two buttons the wrong way round.** A left click built the
menu and the right button called the same function, so the one place a citizen
spends most of their clicks taught the opposite of §5t. `invOptions` is now the
only place an item's verbs are written down and the first option in the list is
what a left click does: the obvious single act where there is one, and a look
where there are several real uses that cannot be ranked, because a left click
must not spend a thing on a guess.

**A window may not guess a constitutional number.** The stall-raising option
counted sixteen `logs` and eight `ore` against an engine that asks for ten
`planks` and two `iron-ore`, and printed a third pair of numbers on the
button: three copies and no two agreeing, with no door to compare against. The
house's brewpot option read a variable that was never declared, so standing
beside a house and pressing it threw, every time, and a brewpot could not be
built from this window at all. `MARKET_PLANKS`, `MARKET_ORE`, `MARKET_OWNED`,
`GROVE_PLANT_LEVEL`, `GROVE_SPECIES`, `BUCKS_AT`, `SMOKE_TICKS`,
`SMOKE_WINDOW`, `GRAVABLE` and `SWEAR_COUNTRIES` are exported and served with
the rest at `/api/tables`.

**And where the water is, which no window knew.** `groundKindAt` answers null
on a water tile on purpose, because water is not a surface you walk on, so
once the ground was served (§7ec) the flat window had no way to tell a wet
tile from a dry one: its `blockedAt` knows only nodes. The engine asks for
water BESIDE you before a willow buck may be set. `isWater` is in the
geography hash, so the water is told with the ground, run-length encoded by
row, and a window may only read it.

**A deed that is not mimed is named.** `DOING_ANIM` was a list of what IS
drawn, so a verb wired this session was silent and still and nothing noticed.
`ACTION_STILL` is the other half, each group with its reason, and a verb in
neither table is a gap the check reports. Burying was filed under the posture
for stirring a pot: a two pixel lean and an empty hand, which is why it was
reported as having no animation at all. A spade is its own posture and the
drawing already existed.


## 7el. A blow sounds like the weapon that struck it, and a place sounds like itself

**The window had one combat sound and it played in one place: when your own
health fell.** So your blow landing on a wolf was silent, every weapon in the
world hit with the same noise, a gambit made no sound at all, and nothing in
the world made a sound when it hit you. Ten sounds for the whole game, and
`hit` was one of them.

**The families are the SWING's families.** The arm already moves five ways --
mell, spear, chain, blade, staff -- and the voices use that same
classification, plus the ranged and burning arms that are not swung. One
table, so a weapon cannot look like a spear and sound like a mell.

**And what it is made of, over the top.** Quickmetal rings where iron clanks;
the great arms land heavier. §6x's argument for quickmetal is that it should
feel different in the hand, and one clang for all of them takes that back.

**A gambit is the same blow taken further, so it is the same voice taken
further**: wound up before, ringing after. Not a second effect, because a
gambit is not a different act (§6af). That it WAS one is told by the engine's
own record -- `blows` carries an entry per blow of the exchange (§36) -- and
not guessed from what the window last armed.

**Every creature has a voice**, and it is played only for a blow landed on
YOU: a window that sounded every creature fighting every other would be a
field of noise. A generic snarl for everything is the health-bar fault again,
a noise that carries no information played constantly.

**The country you stand in is what you hear.** The ambience was one bird by
day and one cricket by night, identical on every acre, in a window that has
named the country under your feet since §7ec-ii. Frogs are the fens, gulls
are the shore, a curlew is the moor and nothing else. Every country the
window can NAME must have a voice, or the ambience falls back to the old bird
and nobody finds out.

**The Wilds are mostly silence with one far-off howl in them.** That is the
only way a window can say a place is dangerous without putting a label on it.

**And a citizen's working day is not mute.** Counted: the window sends
seventy-seven verbs and ELEVEN of them made a sound. Drinking, cooking,
smelting, smithing, burying, planting, sawing, fletching, grinding, brewing,
wielding, dropping, picking up, banking, sailing, sealing, founding,
surveying, ringing the bell, casting a spell -- silence, all of it.

They are grouped by what the HANDS are doing, not one effect per verb:
seventy-seven bespoke noises are seventy-seven chances to sound wrong, and a
smith smelting and a smith forging are the same forge. What matters is that
sawing does not sound like banking. Sorcery is the exception that gets its
own: it is the one thing here that is not somebody's hands and a tool.

**It is counted, not listed.** A verb the window learns to send either has a
voice or is named as deliberately silent, and the silent list is capped so it
cannot quietly become the answer. The combat verbs are on it because they are
heard off the blow LANDING instead, which is the honest moment.

**A footstep is decided by the ground.** Boards over a span, chalk on the
downs, sand on the shore, water in a fen and a floor indoors are five
different noises, and a window that plays one of them everywhere says the
island is all one place. Walking is most of what anybody does here, because
the distances between places ARE the design.

It is played off the citizen having MOVED, not off a `walk` being sent: one
input carries a citizen across many tiles, so the input is one event and the
footfalls are many.


## 7em. A gate may be shown; a yield is the player's to find

**"I do not think it should say that it takes two minutes to go around.
Discovery, you know. Things should not be spelled out like that, it should be
discovered by the player."** The keeper at the Millbrook bar priced the detour
for you, in minutes, in the same breath as he refused you.

**The window already had half of this rule and had been keeping it since the
skill guide was written: a look says names and levels, never yields, odds or
tactics (§6bv).** What it did not have was the other half. A DURATION, a
DISTANCE and a COUNT OF HOW MANY EXIST are the same kind of telling as a
yield, and they were everywhere. The well said how many seconds before it drew
again. The eel rack and the willow buck each counted minutes at you, twice:
once when you set them and once when you asked. Four spells printed how much
they take and how long it lasts. A fire announced that it would burn for a
minute. Raising a stall quoted twenty intervals. Six looks gave away a yield
or a tally: "two to a cast", "worth a quarter more", "there are seven on the
island", "there is one, and this is it". An item's look said how far a weapon
reached, which had already been struck from the spellbook for exactly this
reason, and how much a food mends and at what rate.

**Where the line falls.**

- **A GATE may be shown.** A gate is a door somebody would otherwise rattle in
  the dark: the level a deed wants, what it costs, which tool it needs, how
  many bucks you may have out at once, what a thing is FOR. Hiding a gate does
  not make it discoverable, it makes it a silent refusal, and this window has
  been burned by silent refusals before (§7ek).
- **A YIELD may not.** How much it gives, how long it takes, how far it
  reaches, how many of it there are. All of these a player learns by doing the
  thing once.
- **An item's stats stay.** Damage, accuracy, armour, two-handedness and
  whether it goes round armour are what somebody compares two swords with, and
  that comparison is the equipment screen of every game of this kind. Reach
  went, and what a food mends went, because those are discovery.
- **Feedback after the deed is not telling beforehand**, but it must not teach
  the mechanism either: eating says you ate, and the bar says the rest.

**The world may still tell you, in the world's own voice.** Cragfoot's
signpost says the anvil is at Thornbury. That is a sign somebody put up, which
a citizen finds by walking to Cragfoot, and it is worth more than the same
sentence in a right-click menu, because finding it is the game. The look on
the anvil now says only that anybody may stand at it.

**`check-window-reach.mjs` section 8k reads the window's own prose** for the
shapes a tell takes, and names its six exceptions with a reason each, in the
manner of section 1: the login page, the vigil before a new citizen may enter
(which nobody could discover by waiting, they would only think the window had
hung), and four false positives of the idiom "on the island". A line added
next year is caught the day it is added. `NODE_LOOK` and `MOB_LOOK` are held
to carrying no number at all.

**AND THE PRINTED BOOK KEEPS THE SAME LINE.** The handbook was still giving
the barrow spells' damage and how many intervals the rot and the withering
last, a far shot ending "at the end of its nine tiles", and the gibbet dead
"fought at four tiles or not at all". Its job is untouched by this: the clock
is still one interval a second, food is still a rate rather than a burst, a
smoked eel still ends the rot and nothing still mends a withering, because
none of those can be found out by playing. What went is what a single cast or
a single shot teaches anyway. `test/prose.test.mjs` holds it, with the same
kind of named exception list.

**THE OTHER HALF OF THIS RULE IS THAT A GATE MUST ACTUALLY BE SAID.** This
founding is tool-gated: the engine refuses a gather unless the right tool is
WIELDED, and it refuses in SILENCE. The window went on saying "you swing your
axe at the tree" to a citizen holding nothing, every press, while the world
did not move. The level gate was worse: it was written out once, for
quick-rock alone, against a hand-typed 70 while the served table asks 78, so
one of thirteen gated grounds was checked and that one quoted the wrong
number. Both gates come from the pillar now (`gatherTools`, `nodeSkill`,
`NODE_GATE`), both are said before anything is filed, and the window names the
tool that is actually in the hand rather than the one the sentence assumed.
§6bd's distinction is the one that catches people out, so the refusal makes
it: carrying an axe and holding an axe are different, and the window says
which one you have.

**And §7q had never reached the window at all.** The Millbrook toll stopped
taking logs when the sawpit arrived and a deck became sawn boards. The window
still asked for `logs`, so a citizen carrying exactly what the engine wanted
was turned away and sent to the Greenwood for a thing that would not open the
bar. It had no copy of the cost to go stale, which is how it went unnoticed
for as long as it did: `TOLL_PLANKS` is served now. The engine's own margin
note beside the gate still said "why the toll is a log", three years after it
stopped being one.



## 7en. A living thing stands on ground that will hold it

**"I just saw rabbits walking on water."** The country's ambient life was put
down at a random offset from the citizen and hopped at a random offset again,
and neither asked what was underfoot. A hare on the downs was born on a beck
as readily as on the turf, and one born on good ground could hop out onto the
water a few seconds later.

A hare may not stand on water and a **frog must**, which is why this is a list
of waders rather than a ban: the fens are water, and a frog confined to dry
land would never be seen in the one country it belongs to. Neither may stand
inside a wall.

**And if there is nowhere near you that will hold it, nothing appears.** The
alternative is nudging a bad spot until it is legal, which walks every hare on
a shoreline to the same tile. A country is allowed to be empty; most wakings
nothing happens anyway, which is the whole design of this.


## 7eo. The chart shows what stops you

**"The barrow's mound was not visible on the minimap."** Measured: the mound is
**1,225 tiles, every one of them blocked, and `groundKindAt` answers null on
every one**, because a hill is not a surface. The chart was baked from
`terrainOf` alone, so it fell through to its meadow fallback and painted a
hill nobody can climb, in the middle of the heartlands, as a field.

The same was true of every cliff, of the Ridge, and of the wall round a town:
**3,049 tiles of dry land a citizen cannot cross, none of it on the chart.**

This is §7ec one layer out. The world drawing had exactly this fault until the
walls were served, and the fix there was the same: the window was not asking.
The chart goes back over the walled tiles in stone, drawn OVER the surface
rather than instead of it, because a town wall standing on flagstone is a wall
first.


## 7ep. The shape of a blow, and when it lands

**"Combat animations should be more smooth, not so hacky. I know there is an
interval every second but animations still do not have to look hacky."**

Two faults wearing one face, and neither is about the tick rate.

**The swing was `sin(beat * PI)`:** a symmetric curve across the whole
interval, out and back at one speed. Nothing moves like that, and no amount of
smoothing fixes it, because the problem is the shape. A blow is three unequal
parts: it draws BACK slowly, goes THROUGH very fast, and settles over what is
left. It now begins and ends at the guard, so an exchange tick no longer opens
with the arm jumping from a quarter to nothing, and the step goes with it
INCLUDING the wind-up, which is negative: the weight shifts back before it
comes through. That is anticipation, and it is most of what makes a strike
read as a strike rather than an arm sliding forward.

**And everything else happened at the wrong time.** The damage, the creature's
flinch, the clang of the weapon and the citizen's recoil all fired the instant
the state arrived, which is **four hundred and sixty milliseconds before the
arm reaches the target**. Effect, then cause, on every hit in the game. They
are all on one constant now, `BLOW_LANDS`, which is where the arm is furthest
out: the check written for this rule measured the curve's own peak and found
the number still sixty milliseconds early.

**An exchange is two blows, not one jolt.** The engine resolves both sides on
the same tick and the window played both at once, so a fight was two figures
lurching at each other at the top of every interval and then standing still
for three quarters of a second. The answering blow lands later in the same
interval: you strike, it reels, it strikes back.

Everything timed forward has to be read with that in mind. Six places compared
`now - mark` against a window and every one of them was true, or above one,
for the whole stretch BEFORE the mark: a beast recoiled hardest before it had
been hit, and a citizen staggered first and was struck afterwards. A mark in
the future needs a floor at zero as well as a ceiling.


## 7eq. One table for the bows

*"The horn bow is identical to a normal bow when held and walking. Only in
combat does it change into the appearance it actually has."*

There were **three** drawings of a bow in this window: slung on the back, in
the fist, and in the archer's stance. Only the stance told the eight bows
apart, and it carried its own private table to do it, under a comment claiming
the carried drawing had told them apart for a long time. It never had: the
slung bow was one hardcoded brown for all eight, so the rarest arm in the
world looked like the first one anybody is given right up to the moment a
fight started.

**And two of the three drew at once.** `o.bow` is true for anything ranged, so
an archer standing still carried the slung bow AND a second, smaller one in
the fist, three pixels of rotation apart. Turning left puts the hand on the
near side of the body and sets them side by side, which is *"when I wield horn
bow and turn towards the left I am wielding two bows at the same time, one
smaller and one normal"*. An earlier note in the fight branch had photographed
an archer in both facings, found one bow every time, and recorded that the
reported fault was still out there. It was two drawings, not one drawing twice.

So: `BOW_LOOK`, one row per bow, read by every drawing of one. A bow is drawn
**once**, on the back, and the hand draws nothing. The three javelins and the
hand cannon are no longer drawn as bows: a javelin is a short shaft and a
spare, carried point-up, and a thrower walked about with a bow in his fist and
another on his back.


## 7er. The body shoots

*"When shooting with the bow the string goes backwards and the arrow goes
flying, that is good, but the citizen is standing completely still. It looks
weird."*

`striking` excludes a shot on purpose, because an archer must not swing, and
**nothing was put in its place**: the bow drew and loosed in front of a body
that never moved a muscle, which reads as a bow working by itself.

The shot is timed once and the body and the bow both read it, or the hands and
the string disagree by a frame and the arrow leaves before the fingers do. On
that one clock:

- **the feet**, which is where a stance starts. The two legs take `step` in
  opposite directions, so one steady negative value is a man stood square with
  his weight spread. The brace deepens as the string comes back and lets go on
  the loose.
- **the weight**, back onto the rear foot at full draw and forward as it is
  released. Two pixels.
- **the bow arm**, held a hair above level instead of hanging at the hip, and
  giving a little under load.
- **the draw hand**, which is the half anybody actually watches, because it is
  the half that moves. The rear arm comes across the body and the hand sits on
  the string wherever the string is.

A photograph is an instant and a stance is a motion, so `sweep.mjs --pull <ms>`
names a point in the draw: Chrome's virtual clock does not advance inside a
task but does between them, so settling a chosen number of milliseconds after
the fight state lands is exactly a chosen point in the draw. The sweep also
left `since` undefined, and the exchange flag wants an even number of ticks
since, so half the archer pictures ever taken were of a bow at rest and nobody
could tell which.
