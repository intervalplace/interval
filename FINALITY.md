# Deadline finality

> **CONSIDERED AND NOT ADOPTED.** Nothing in this file is implemented, and on
> the evidence below it should not be. It is kept because the classification of
> the world's 91 inputs is useful on its own, and because a design refused for
> stated reasons is worth more than one quietly dropped.
>
> The conclusion is at the bottom, under "Why this is not adopted".

## The problem it solves

A world's tick is already unstoppable. The interval a world ought to be at is
`floor((Date.now() - anchorMs) / TICK_MS)`: a pure function of wall clock and
the founding. Nobody computes it, nobody can withhold it, and empty intervals
replay deterministically.

The state is already a pure function of the genesis and the **set** of inputs
per interval. Order is not negotiated: within an interval the engine sorts by
`playerId`, a citizen may file at most one input (two and both are discarded),
and the per-interval cap is applied deterministically rather than by arrival,
"because arrival order differs between nodes".

So exactly one thing in this world depends on other people: **closing the
set.** A quorum of witnesses says "interval N is final". That is the only
reason a world can stop, and the witness set is immutable, so it is the only
reason a world can stop *permanently*.

## The trade, stated plainly

Nobody escapes this choice:

| | the record | the world |
|---|---|---|
| **Quorum finality** (today) | never rewinds | can stop |
| **Deadline finality** | can lose a late input | cannot stop |

The current design chose the first. This proposal chooses the second, and the
whole question is what a lost input costs.

## The rule

Interval N closes when the wall clock passes N by `FINALITY_LAG` intervals. An
input for N arriving after that is **too late** and is not applied. There is no
vote, no proposer, no quorum, and nothing to resign from.

`FINALITY_LAG` is a founding fact, in the genesis, so every node agrees on the
deadline without being told.

## What a lost input costs, by input

Measured against the engine's 91 inputs rather than reasoned from memory.

### Solitary deeds: 73 of 91. Lost is harmless.

`gather`, `walk`, `smith`, `eat`, `drink`, `wield`, `cast`, `stoke`, `brew`,
`plant`, `harvest` and the rest. A lost one costs the citizen one interval of
work: the axe did not bite that second. There is nothing to recover and nobody
else is affected. These need no protection at all, which is the finding that
makes this proposal cheap.

### Property by consent: trades. Lost must become DELAYED.

`offer_trade` and `accept_trade` are the only deeds where goods change hands by
agreement. The protection is not a longer deadline, it is **evidence**: an
accepted trade carries both parties' signatures, so either party can re-file it
at a later interval. A missed deadline is then a delay and never a loss, and no
rewind is required to honour it.

This is the one place co-signing helps, and the reason is worth stating: a deed
both parties signed cannot be a surprise to either of them, so neither can be
the node that silently lost it.

### Property by race: loot and death. Neither can be co-signed.

- `pickup` of another's goods, which is contested between scavengers over a body.
- `attackp` and `gambit`, where a killing blow scatters everything the dead
  were carrying.

There is no consenting second party to either, so there is no signature to
collect. What protects them is that a race over a **known set** has a
deterministic winner: canonical order by `playerId` decides it, on every node,
with no vote. The exposure is not the ordering, it is whether two nodes held
different sets.

So these are protected by three things and not by co-signature:

1. `FINALITY_LAG` set generously enough that gossip has converged. The
   deadline is the whole budget for propagation, and it costs nothing but
   latency on things nobody is watching in real time.
2. Divergence **detected**, as today: a certified result that disagrees with a
   local replay halts with evidence (H3). A node that is wrong learns it is
   wrong rather than quietly playing a different world.
3. Healing by **input exchange**, not by vote: two nodes that disagree compare
   input sets, and the one missing an input for a closed interval resyncs from
   the log rather than rewriting history.

**Be honest about what this does not buy.** It does not make a disputed kill
impossible. It makes it impossible *given the same inputs*, and makes input
loss unlikely and detectable rather than silent. A world where nobody can stop
the clock but two partitions can briefly disagree is a different set of risks
from a world that halts when one key goes quiet; it is not a strictly safer one.

### Records: the remaining 16. Lost is re-doable.

`befriend`, `unfriend`, `follow`, `part`, `teach`, `grave`, `archive`, the
spells cast on another, and `swear`'s attester. Each is a statement the actor
can simply make again. No property moves and nothing is destroyed.

## What has to be built

1. `genesis.finalityLag`, validated, with the witness fields becoming optional
   rather than required.
2. The close rule, replacing the quorum's certificate as the thing that makes
   an interval final.
3. Co-signed trades: `accept_trade` carries the offer and both signatures, and
   is re-filable until it lands or the offer is withdrawn.
4. Divergence detection kept exactly as it is, and an input-exchange resync
   path to replace "refound" as the first answer to disagreement.
5. Deterministic successor selection, which is wanted either way, because a
   rule change will always mean a new founding.

## Open questions

- **What is `FINALITY_LAG`?** It is latency against safety and the number
  should be measured on real gossip, not chosen. Three to five intervals is a
  guess and should not be written into a founding as one.
- **Does a re-filable trade expire?** An offer that can be accepted for ever is
  a standing option on somebody else's goods, which is not nothing.
- **What does a node do when it halts on divergence and no quorum exists to
  appeal to?** Today the answer is social. Under this proposal it has to be
  mechanical, and that is the least finished part of this design.

## Why this is not adopted

The question that settled it was "how could someone abuse this", asked before
any code moved. Four answers, and the first is fatal.

**Engineered partition gives item duplication.** An attacker signs an input for
interval N and releases it to some nodes before the deadline and to others
after. Those who received it include it; those who did not reject it as late.
The attacker has chosen who sees what. They then take a body's pack on one side
while somebody else takes it on the other, and the item exists twice in two
worlds that cannot reconcile without a rewind. Under a quorum this cannot
happen, because the certificate is the single truth about what interval N
contained.

**Clock skew becomes security-critical.** The deadline is wall clock, so every
node's clock becomes part of the protocol rather than a convenience. A
deliberately skewed node disagrees about what was late, and NTP becomes a
dependency of safety.

**Censorship becomes cheap and unprovable.** A relay that does not forward an
input until it is too late has silently deleted somebody's action and left no
evidence. Under a quorum a censoring witness is routed around and the
misbehaviour is portable.

**And this world is made of races.** Two miners on one seam that depletes, the
last blow on a beast, a dead citizen's pack. Co-signing protects a trade
because both parties hold the evidence; nothing holds evidence for a race, and
under divergence every race duplicates.

So the real trade is not the one in the table above. It is: a liveness
dependency on named people, exchanged for a safety dependency on network
propagation and clocks, in a world almost entirely composed of contested
resources. For a world with property that is the wrong direction.

### What is done instead

The thing that actually fails today is not the quorum, it is that the quorum is
ONE key. Three changes get "the line cannot be stopped" without giving up
"the record never diverges":

1. **Found with many witnesses.** The trust is liveness only and bounded: the
   world lives while `q` remain, a minority that misbehaves cannot fork it, and
   misbehaviour yields portable evidence. Trusting people not to ALL quit is a
   much smaller thing than trusting one key not to be lost.
2. **Deterministic successor selection.** When a quorum is genuinely lost, any
   client may found a successor from the last certified checkpoint, and every
   client converges on the same one by a pure function of observable facts:
   highest attested `importedFrom.tick` first, ties broken by lowest worldId,
   refusing any successor whose cited checkpoint it cannot verify. No
   designated operator and nobody's permission.
3. **A crossing that carries a life**, which is done: §9b-ii.

That is a smaller claim than one eternal world and it is the honest one. A
studio with one world and one owner cannot make it at all.
