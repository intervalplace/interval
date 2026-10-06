# Succession

> **BUILT, AND NOT RATIFIED.** The mechanism described here exists:
> `genesis.from` and the `restore` door (§9b-iii in engine.js), the seal over
> the living (`protocol.mjs`), the inherited tree and its paths
> (`incoming.mjs`, `/api/home`), the continuation and eligibility checks, the
> handover, successor discovery over the old world's peers (`/api/successor`),
> and a homecoming that happens by itself in both clients. What is
> not settled is the policy: see "Open" at the end. No world has been
> continued yet, and the first time anybody does it will be the first time any
> of this runs for real.

## What this is for

A world's witnesses are fixed at founding and a quorum is always a majority or
a supermajority (n=10 needs 7; n=31 needs 21). So more witnesses makes liveness
worse, not better, and there is no configuration in which a few people "do not
matter" for the clock but do for safety. With a fixed set, somebody always
matters.

The answer is not to find more trustworthy people. It is to make a lost quorum
**survivable**, so that witnesses going quiet costs a chapter rather than the
world. Then nobody has to be trusted to keep caring.

## The hole this closes first

Today a refounding derives its genesis from the FOUNDER'S OWN ENVIRONMENT:
generator from `INTERVAL_GEN`, seed from `INTERVAL_SEED`, size from
`INTERVAL_W`/`INTERVAL_H`, rules from whatever files that node is running. The
citizens are carried across faithfully and everything around them is whatever
the person doing the founding felt like.

So whoever founds a successor can presently change the island, the rules and
the engine, and the citizens arrive in it regardless. Any convergence rule laid
on top of that would make "whoever founds first wins" a way to rewrite the
constitution.

## How long the silence must be

`ABANDON_GAP` is **a month**: 2,592,000 intervals at a second. The existing
`REFOUND_GAP` is a day, and a day is the right number for a node deciding
whether to resume its OWN saved world after a crash. It is far too short for
a stranger to declare somebody else's world abandoned and continue it.

A month means a founder can go on holiday, be ill, move house or lose a
machine without anybody being able to take the line from them, and it is still
short enough that a genuinely dead world is not lost for a year. It is also the
whole budget for the partition attack below: to steal a line you would have to
keep somebody cut off from every certificate for a month.

**The danger here is not a hostile successor but an eager one.** A world whose
witnesses are offline for an afternoon has not ended. A successor founded in
that afternoon splits the people in it: some walk into the new world with their
files while the old one comes back up, and then both exist, with the same
citizens in each and no way to reconcile them. Nobody has to be malicious for
that. Being keen is enough, and the gap is what makes it impossible rather
than merely rude.

**Or the witnesses hand the line over.** A quorum of the predecessor's own
witnesses sign the successor's worldId, and then there is nothing to wait for:
the people who could have kept the old world going have said in signatures
that they are not going to. `protocol.mjs:makeHandover` and `verifyHandover`,
domain `INTERVAL_HANDOVER_V1|`. It is the graceful ending, and it is the one
available to whoever already runs a world.

A handover names ONE successor and cannot be reused, because the worldId it
signs commits to the whole founding and two rival successors have two worldIds.
A witness who signs two has equivocated in public with their own key, and
anybody holding both can show it.

It is served as a file beside the world (`/api/handover`) rather than carried
inside the genesis, and it could not be carried inside: a handover signs the
worldId, and the worldId is the hash of the genesis. The node is only a
courier, since whoever reads it checks it against the founding their own kept
file carries.

`protocol.mjs:eligible` is both halves of the question in one call: is this the
same world, and was it entitled to begin. A broken handover is reported as a
broken handover rather than falling back silently to the gap, because somebody
produced signatures that do not hold and that is worth saying.

## The rule

**A successor's genesis is derived from the checkpoint it continues, not chosen
by whoever founds it.** Every field below is dictated, and any client holding
the checkpoint can check all of them. A genesis that fails any of them is not a
successor; it is a different world that happens to import some people, and no
client follows it.

1. **The provenance verifies.** The cited state hashes to the claimed
   `stateHash`. `crossing.mjs:provenance` already refuses to attest otherwise,
   for the reason written there: a doctored checkpoint carrying the real
   world's id "would have produced a successor whose genesis attested that a
   state it never saw contained citizens that never existed, and the worldId
   would have committed to the lie permanently".
2. **`rulesHash` is the predecessor's.** Not the founder's. **The line IS the
   rules**: a genesis under different rules does not inherit the line, however
   faithfully it carries the people.
3. **`engineHash` is the predecessor's**, where it named one (§2n).
4. **`worldGenerator`, `genesisSeed`, `worldW` and `worldH` are the
   predecessor's**, which makes `geographyHash` identical. It is the same
   island, re-founded, and that is checkable rather than promised.
5. **The genesis commits to the predecessor's final `livingRoot`**, and
   nothing else about the population.

   This replaced an earlier draft that required `imported` to equal `carry()`
   of the whole checkpoint, which does not scale: at a million citizens that is
   hundreds of megabytes somebody must hold and keep current, which is the
   dependency the roots exist to remove. Committing to the root instead makes a
   successor's genesis a CONSTANT SIZE whatever the population.

   Citizens then arrive one at a time by `restore`, each bringing their own
   record and path, judged by a root written into the successor's identity. So
   nobody holds anybody else's data, and a citizen who does not come back on
   the first day can come back in the third year: their proof is still good
   against a root that cannot be edited without changing the worldId.

   **One root, and only the last one.** A citizen keeps a new proof every ten
   minutes, so by the end they hold hundreds. Exactly one of them is good here,
   and it is not theirs to choose. See "The one root, and why the choice is not
   the citizen's" below: letting a citizen pick which of their own proofs to
   present is the worst hole in this whole design.
6. **`anchorMs` is not before the predecessor's last certified moment.** No
   backdating a world to win a tie.

What a founder still chooses is the **witness set** and the moment. Nothing
else. There is no field left to tamper with.

## What the witnesses sign (and what it fixed)

Until this was built, a witness signed the bundle and the resulting state hash.
The resulting state hash covers the root over the living, because the root is a
field of the state. That sounds like enough and it is not: a flat hash over a
whole state yields no inclusion proof, so confirming that a root was real meant
producing the entire state. That is the dependency the root exists to remove,
and leaving it in place meant a citizen's kept file proved only that their
record folded to *some* root they had been handed.

So the root is now signed on its own. An attestation reads

    { v, worldId, tick, round, bundleHash, resultingStateHash, livingRoot,
      witness, sig }

and a quorum of those, stripped of the bundle, is a **seal**: a few hundred
bytes saying *root R stood over the living at interval N of world W, and these
witnesses put their names to it.* `protocol.mjs:verifyLivingSeal` checks one
against a genesis and nothing else. No state, no checkpoint, no node still
running, and no cooperation from whoever took the world over.

Mind the off-by-one, which is written down once in `sealTickOf`: an
attestation's own tick is the interval the bundle applied AT, so a seal over
the state at interval N is built from attestations stamped N-1.

Three things this makes checkable that were not:

1. **A citizen can check their own file is worth keeping.** The desktop window
   and the browser both verify the seal before they store a proof, and the
   browser will not let a sealed proof be replaced by an unsealed one. An
   unsealed proof rests on the word of the node that served it, which is the
   word the seal exists to do without.
2. **A client can check a successor's genesis.** Rule 5 says the genesis
   commits to the predecessor's final root. Before the seal, "the predecessor's
   final root" was whatever the founder said it was, and checking it meant
   holding the predecessor's final state. Now the founder publishes the seal
   beside the genesis and anybody can check the root was sealed, at which
   interval, and by whom.
3. **A tie between rival successors can be settled by arithmetic.** The
   tie-break below is "highest cited tick wins". That was only as good as the
   claim, since a founder could cite a tick they had no evidence for. A seal is
   the evidence, and it is comparable by anyone, instantly, with nothing in
   hand.

## The one root, and why the choice is not the citizen's

**A stale proof is a richer proof.** This is the sharpest attack on anything
built here, and it comes from the good part: once a citizen can prove *root R
held at interval N*, they hold hundreds of such proofs, one from every ten
minutes they ever played, and each is as valid as the last.

If a successor accepted any sealed root, every citizen would present the
interval they were richest at. Lose a duel and your pack goes to the winner:
present yesterday's proof and you have it back. Sell a sword for ten thousand
gold, then restore from before the sale, and the sword exists twice in the
successor while the buyer restores holding it too. The world is made of trades
and deaths, and this would unwind every one of them that went badly for
whoever is restoring. It is not a rewind of the world; it is a rewind each
citizen performs privately, choosing their own best moment.

So **a successor accepts exactly one root: the one its genesis names**, which
is the predecessor's last sealed root. A proof against any earlier interval
does not fold to it and is refused by arithmetic rather than by judgement.
There is no choice to make and no window to game.

This costs something real and the cost should be stated rather than hidden.
**A citizen's own saved proof will almost never be the one that seats them.**
Their newest file is against the root as it stood when they last saved, and the
world kept moving after that: anybody else taking a step changes the root, so
their path is stale within the second. What they can prove with it is that they
existed and what they were at interval N, which is worth having, but not that
they belong in the root the successor names.

What seats them is a path against the final root, and deriving one needs the
final state. Rule 1 already requires the founder to hold exactly that: the
cited state must hash to the claimed `stateHash`, or `provenance` refuses to
attest. So the founder holds the final state by construction, and so does every
other node that was running when it stopped, and so does every client that kept
a checkpoint. Any one of them can hand any citizen their path, and none of them
has to be trusted while doing it, because the root judges what they hand over.

The honest shape of the dependency, then:

- **The genesis is constant size** whatever the population, which is what rule
  5 was for, and that is unaffected.
- **Nobody needs to hold anybody else's data to PLAY**, which is what the root
  was for, and that is unaffected.
- **Founding a successor needs one surviving copy of the final state**, held by
  anybody at all. That is not a weakening of the archive argument; it is rule 1
  restated. The thing that was wrong was the sentence promising a citizen could
  be seated from their own file alone.
- **A citizen's own file is the fallback for the case where no copy survived.**
  Then no successor can be founded under these rules at all, and what the files
  collectively prove is the strongest claim anybody can make about who was
  there. That is a worse world and it is not nothing.

## Where the world went

A line nobody can find is a line nobody inherits, and until this was built
every mechanism above assumed the citizen already knew which world continued
theirs.

A node answers one question, `/api/successor?of=<worldId>`, two ways and says
which: `self`, meaning it is running a world whose genesis names that one, and
hands over its own founding plus the handover beside it; or `told`, meaning
somebody left a note naming one, which it relays without vouching for it. A
node answering for itself reports no address of its own, because whoever asked
already holds the address they asked at.

**Neither is trusted, and that is what makes it safe to ask strangers.**
`protocol.mjs:acceptSuccessor` checks an offer with nothing but the founding in
the citizen's own kept file: the id must be the hash of the founding offered,
so a liar cannot pair a world everybody would accept with the address of one
they control, and the founding must be eligible. A node that lies sends nobody
anywhere, and the worst it achieves is wasting a request.

Both clients go looking by themselves when nothing answers for their world, and
say so in the plainest words they have before moving: the browser in the feed
and on the gate, the desktop window on its refusal channel. Moving a citizen
between worlds quietly is the one thing a client must never do, and a successor
is still a different world even when it is checked to be the same rules on the
same island.

The nodes to ask are the ones the client learned while the world was alive. The
browser already kept up to sixteen from `/api/peers`; the desktop bridge now
keeps up to thirty-two in a file beside the key, so they outlive the world they
came from. The bridge waits for four failures before asking, because a node
that is founding stops answering for minutes and declaring a world dead because
it is busy would walk a citizen out of a world that was coming back.

## The door, as built

`restore` already existed, for citizens the world had archived: it carries the
record and a path, and the engine checks it against `archiveRoot`, empties the
leaf, and seats them. §9b-iii gives it a second tree to answer to.

- `genesis.from` is `{ worldId, livingRoot, tick }`, three fields and no more,
  so the worldId commits to exactly this claim. `validateGenesis` refuses any
  other shape, refuses a root that is not a hash, and refuses a world that
  names itself.
- `newWorld` copies that root into `state.incomingRoot`. The genesis keeps the
  claim and cannot be edited by anybody; the state keeps the ledger of who has
  used it, and spends each returning citizen's leaf exactly as an archive
  restore does. Both are ONE HASH, so neither grows with the number of people
  who ever come home.
- A record arriving this way is NOT seated raw. It holds a position on a clock
  that has stopped and a deed from an interval that no longer exists, so it
  goes through the door a founder's import goes through: `carriedFrom`, then
  `validateImports`, then `seatImport`.
- `carriedFrom` used to live in `crossing.mjs` as part of `carry()`. There are
  two doors now, so the projection moved into the engine beside
  `IMPORT_FIELDS`, and `carry()` is a filter and a map over it. A second
  implementation of "what crosses" is how a citizen's goods come to depend on
  which way they came back.
- A name somebody else has taken in the successor costs the name and never the
  citizen: they arrive unnamed and may claim another.
- A citizen lands where newcomers land (`spawnOf`), because the coordinate they
  were standing on belonged to a clock that has stopped.
- `incoming.mjs` holds the tree outside the tick and hands out paths.
  `/api/home?pid=` serves them, and a node that has fallen out of step with
  the world's own `incomingRoot` says so and serves nothing, rather than
  handing somebody a path that will be refused at the door and leaving them to
  wonder whether their citizen survived.
- The homecoming is NOT a menu item. Both clients do it by themselves on
  arrival: check the world is a faithful continuation, check the kept seal,
  ask for a current path, file the deed, and say so in one line. A citizen
  should not have to find a button at the only moment this whole mechanism
  exists for.

### Who has come home, and how a service recovers

Spending a leaf moves the root, so a service has to know who has already
returned or it cannot build anybody a path. From the root alone that is
recoverable one step at a time and no further: several homecomings leave a root
explained only by a SET of spends, and choosing the right set would be a search
over hashes with nothing to guide it.

So it is not derived, it is kept. The leaves never change, so the spent list is
the whole of a service's mutable state, and a service is leaves plus that list.
A pillar writes it whenever it grows, which is at most once an interval, and
reads it back on startup.

A node starting cold asks another node, `/api/incoming`. **That is not a
trusted channel.** `IncomingTree.adopt` rebuilds the tree with whatever it is
told and keeps it only if the result is the root the world is actually holding,
so a hostile list, a stale list and an honest one are told apart by one hash
comparison, and a name that was never in the old world is filtered out as noise
rather than treated as a lie. This is the same shape as the rest of §9b-iii:
the data may come from strangers because the root is the judge.

A service that cannot establish the list serves nothing and says why. It never
hands out a path that will be refused at the door, because whoever got it would
be left wondering whether their citizen had survived.

### The record is the valuable part. The path is not.

Spending a leaf moves the root, so **the first citizen to come home
invalidates everybody else's kept path.** This is the same chaining the archive
already has, and it is written in `validInput` in so many words: a path answers
to the root as it now stands, and checking it when the interval opened once
lost three citizens silently.

So a kept proof holds two things of very different kinds.

The **record** is the valuable one. It cannot be forged, edited or borrowed:
change a level and the leaf changes, use somebody else's and the route is
wrong. It is good for ever and it is the thing worth keeping off the machine.

The **path** is a perishable routing detail. It is public, it is worth nothing
to an attacker, and it can be rebuilt by anyone holding the inherited tree,
which is derivable from the predecessor's final state plus the successor's own
history of who has already returned. So a citizen coming home in the third year
brings their record and asks anybody at all for a current path. If they are
handed a bad one, nothing happens: the root refuses it. There is no trust in
that exchange, which is why it can be asked of strangers.

What this means in practice, and it should be said plainly: **a node tracking
the inherited tree and serving paths is a thing somebody has to run** for a
successor to seat anybody but the first comer. It needs no key and no
authority and anybody may run one, but today nothing in this repository does.
`test/smt-helper.mjs` tracks such a tree for the archive, in test code only.
That is the next hole, and it is a liveness hole rather than a safety one.

## Choosing between eligible successors

All eligible successors are identical except for witnesses and anchor, so the
choice only decides who keeps the clock. A pure function of observable facts,
computed identically by every client, needing no vote:

1. **Highest cited tick.** The most real history preserved wins.
2. **Then the greatest total standing of its witness set, as recorded in the
   cited checkpoint.** The world is continued by the people who actually
   invested in it rather than by whoever was quickest.

   This is Sybil-resistant where weighting live finality by standing was not:
   the standing must ALREADY EXIST in a hash-verified checkpoint, and an
   attacker cannot fabricate a past. A thousand fresh keys carry a thousand
   times nothing.
3. **Then the lowest worldId**, purely so that two honest clients never
   disagree.

## What this buys

- A lost quorum costs the tick count and nothing else. Every citizen arrives
  whole: money, deaths, `raised`, lineage, travels, calling, acquaintances.
- Nobody needs to be trusted to keep caring. A stranger who runs the world for
  a week cannot alter it; they can only carry it.
- And if nobody runs it at all, it waits. A world with nobody in it has no
  reason to advance, which §7dw already half says: a world left unattended for
  a day is abandoned.

## What it does not buy

The clock of a single world can still stop. This makes the LINE unstoppable,
not the instance, and the distinction has to be stated plainly wherever the
project makes its claim. The homepage used to say "If we vanish, it keeps its
tick", which is not true of a one-witness founding; it now says that if every
machine stops the clock stops, that the hours do not go with it, and that
anybody at all can found the world that continues this one. That is both true
and the stronger sentence, because it names the mechanism instead of asserting
the outcome.

## What a citizen's own client refuses

This is the answer to the sharpest objection to the whole design, and it was
the user's own: if anybody may found a successor, the first to found one gets
to change whatever they like and is inherited anyway, because that is where
everybody's friends went.

The answer is that nothing on a network decides this. A citizen's kept file
carries the founding they lived under, so their own client can check the claim
before it walks them into anything: `protocol.mjs:continuation`, mirrored in
the browser as `continuationW` and held against it by `test/proofweb.test.mjs`.

- **the rules** byte-identical, by hash. THE LINE IS THE RULES: a world under
  different rules does not inherit this one, however faithfully it carries the
  people.
- **the engine** identical, where the predecessor named one (§2n).
- **the island** same generator, same seed, same dimensions, so the geography
  hash is identical and every place-name a citizen walked still means what it
  meant.
- **the moment** not before the predecessor's last certified interval. No
  backdating a world to win a tie.

A world that fails any of these is not refused anything. It simply does not get
to claim anybody: their file keeps, and they walk in as a newcomer or not at
all. Both clients say which clause failed, in those words, rather than failing
quietly.

## Open

Still unsettled, in rough order of how much it matters.

- **Being sent to a faithful world nobody else is in.** A client now asks
  every node it has heard of where the world went (`/api/successor?of=`), and
  checks the answer with `acceptSuccessor`: the id must be the hash of the
  founding offered, and the founding must be eligible. So a liar cannot pair a
  world everybody would accept with an address they control, and cannot change
  the rules. What no arithmetic can decide is which of several FAITHFUL
  successors everybody else chose. The tie-break under "Choosing between
  eligible successors" is the intended answer and nothing implements it: a
  client today follows the first good offer it is given.

  This is the one place where being told by a person still beats anything the
  protocol does. A citizen who is given the address of the world their friends
  went to will always be better off than one who takes the first answer.
- **Nothing in the repository serves paths against the inherited tree in a
  real deployment yet.** `incoming.mjs` and `/api/home` exist and are tested,
  but the leaf file has to be cut by hand from a final checkpoint
  (`node incoming.mjs <checkpoint.json>`), and no node does that for itself.
  Until somebody runs one, only the first citizen home can use the file they
  already hold.
- **A path service still needs one other service to exist before it can start
  late.** Who has come home is now remembered on disk and served at
  `/api/incoming`, so a restart is free and a node starting cold asks another
  node and checks the answer by rebuilding the tree. But if NO node of the
  successor has the list, nothing recovers it from the root alone, and the
  honest fallback is to read the world's own certificates and find the restores
  in them. Nothing does that yet. It only bites a successor whose every path
  service was lost at once.
- **One homecoming per interval, measured.** Eight citizens filing a restore
  in the same interval seat ONE: paths chain, so the first to be applied moves
  the root and the other seven answer to a root that has already gone. They
  retry and get in on later intervals, so nothing is lost, but the ceiling is
  86,400 homecomings a day. For a world of hundreds that is minutes; for a
  million citizens it is a fortnight of queueing, and they would collide at
  random rather than queue politely.

  The archive restore has had this property since it was written and it is the
  same cause, which is why `validInput` says so in as many words. The fix, if
  it ever matters, is in the path service rather than the engine: a service
  that knows who else is coming in this interval can hand out paths that
  chain, the way `test/archive.test.mjs` already does for three archives in one
  tick. `incoming.mjs` does not do this.
- **What stops a flood of eligible successors?** Each is cheap to found and
  they all converge, so the cost is noise rather than harm, but it wants a
  bound.
- **Does a successor inherit the old world's death counts for the boards**, or
  do the boards reset with the clock?
- **How long does a founding stay contestable?** The tie-break is "highest
  cited tick", so somebody who held the final state and kept quiet could found
  a successor citing an earlier interval and hope nobody shows a later seal.
  The window closes as soon as one person does, and the predecessor's own
  witnesses can each produce the latest they signed, but no rule says when it
  is shut.
- **Nothing yet stops a citizen presenting a proof from the predecessor's
  predecessor**, two worlds back. The worldId in the seal is checked against
  the world being continued, so it fails, but that means a line's history is
  not cumulative evidence and somebody will ask why.
