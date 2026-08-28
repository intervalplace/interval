# Interval

*A world with a constitution instead of an owner.*

*Release 1.0.0 · protocol spec v1.0 · consensus spec v1.9 · rules hash `b8a093a8716d0bd4`…
These four move together; a change to any one of them is a new release, and a
change to the constitution is a new world.*

Interval is a decentralized MMO. The game is a deterministic state machine and
the spec is its constitution: the rules are the authority, not a server. The
world advances one **interval** a second, and everything that has ever happened
here happened on one. Any machine running the same rules computes the same
world; a machine that disagrees has, by definition, broken them, and is ignored.

Your citizen is a keypair. Every action is an Ed25519-signed input and the
signature is the authorization — no session, no account, no server grant stands
between you and your soul. Keys are made locally and never leave the device.
Lose the key, lose the citizen. Hold it, and every window into the world is
equally yours, because the citizen was never the session.

The live world is **Tallyholm**: [interval.place](https://interval.place).

## Play

Open [interval.place/play](https://interval.place/play). A key is minted in your
browser and you wake in the Heartlands with twelve empty slots and twenty-two
coins. Chop, dig, fish, cook, carry, trade, fight if you want to. Swear a
calling when you know what you are; you will not be able to take it back.

| | |
|---|---|
| **/play** | the flat window. Fast, complete, runs anywhere |
| **/deluxe** | the 3D window |
| **/photo** | the painterly window. Same world, golden hour |
| **/map** | the living chart, computed in your browser from the seed. If the chart and the world ever disagreed, one of them would be in breach of the constitution |
| **/hiscores** | ranked by trade, and by calling within it. Every rank is arithmetic anyone can redo |
| **/board** | arrangements with people who are not standing next to you, signed with the same key that swings your axe |
| **/manual** | how everything works, in the world's own terms |

Export your key from any window's door, or paste an executor identity JSON
straight in. One soul, any vessel.

## What kind of world it is

**Nine trades, and none of them ranks you.** A citizen is introduced by their
**standing** — the sum of all nine — and by a **calling** sworn at level thirty
in the trade it belongs to, which can never be put down. Fighting is one trade
of nine. Sorcery is the trade of refusing combat. Mourning is the only trade
paid in what it cost you: every other converts time into levels, and that one
converts wealth, and the goods are gone.

**Every citizen has the same frame,** sixty-four, from the first interval to the
last. What progresses is not how much you can absorb but how often you are
missed — armour is in the roll, not subtracted from the blow. A master in star
plate is not shrugging hits off. Death takes your pack, leaves your trades, name
and coin, and adds a **wound**: one permanent point off the frame, cleared only
at a wellspring that is not in any town.

**Goods stay where you left them.** Every counting house is its own vault, so
ore banked in the Crags is in the Crags. There is no counter anywhere from which
a citizen can reach the whole of what they own, which is why hauling is a job
somebody will pay for and why the road is a trade.

**A script is a citizen.** Automation is expected and priced into the economy
rather than forbidden. An executor runs its own node like everybody else, so the
same program grinding timber is also verifying every interval and holding itself
to the constitution. Nothing here charges patience, because a script does not
mind waiting and the whole of that cost would land on the person. What a script
cannot do is be somewhere.

## Run a pillar

A pillar founds a world, witnesses it, and serves the windows.

```bash
git clone https://github.com/intervalplace/interval && cd interval
npm install
INTERVAL_DATA=/var/interval-data INTERVAL_SEED=my-world node serve.mjs
```

**`INTERVAL_DATA` is the one setting that matters.** World memory — checkpoints,
identities, witness safety — lives there. Unset, it lives inside the deploy
directory, and a replaced deploy is a wiped world; the server warns loudly about
this at boot. Set it to a persistent path, put it in your service unit
(`Environment=INTERVAL_DATA=/var/interval-data`), and never think about it
again. Prefix env vars inline as above: a bare `VAR=value` on its own shell line
applies to nothing.

`INTERVAL_SEED` names the founding. Booting a new seed founds a new world, and
citizens of the old one cross into it carrying their trades, names, wounds and
goods — goods arrive at the counter nearest where they wake, since the vaults of
a world that no longer exists name nothing. Founding data does not expire with
the world that held it. Old founding records and checkpoints are archived, never
deleted. If disaster leaves you with a frontier and no matching state,
`node recover.mjs` rebuilds the exact finalized present from genesis and the
accountability store's quorum-signed certificates, trusting nothing it cannot
verify.

## Join as a sovereign peer

Two sovereign machines already run this world. Any stranger runs
`node join.mjs <name>` and becomes a full peer: the machine fetches the founding
record, refuses unless its own constitution hashes the same, syncs a checkpoint,
then computes every interval independently and compares state hashes with
everyone else. The first foreign citizen was named zezima, because of course it
was.

By default a joined citizen simply exists while its node verifies. Add `--chop`
for the example executor, a bot that trains woodcraft and banks its logs. Bots
and people enter this world the same way; the protocol cannot tell them apart,
and does not want to.

## Tested against a hostile network

Consensus safety is exercised by a seeded, deterministic adversarial simulator
(`npm run advsim`): honest witnesses under packet loss, delay, reordering,
duplication and timed partitions, alongside Byzantine witnesses — equivocating
proposers, lying attesters, replayers, garbage floods — and crash-restart
recovery from durable stores. Three surfaces cover it, all enumerated in
[TESTING.md](TESTING.md): the CI battery (`test/adversarial.test.mjs`, 15 tests,
every scenario at one seed plus convergence and determinism checks), the
attached freeze evidence (`freeze-evidence/`, 12 scenarios × 1 seed × 11s), and
the full campaign on demand (`node advsim.mjs all 3 30000`).

Across the runs in the attached evidence, no two honest nodes finalized
different hashes for the same interval, no honest witness double-signed, and
every committed certificate verified. **The world stops rather than forks.**
These are claims about the enumerated runs, not a proof over all executions. The
same properties are shown live over real libp2p (`npm run demo7`) and across
real OS processes (`npm run e2e`); those bind real sockets and are captured
separately.

## The constitution

The constitution is **three documents**, and the rules hash covers all three in
order:

| | |
|---|---|
| [SPEC.md](SPEC.md) | the settled law: every rule, every number, every verb |
| [LIFTED.md](LIFTED.md) | rules relocated from the engine's own comments, binding and marked `[LIFTED]` until somebody reads them back against the code |
| [HISTORY.md](HISTORY.md) | what was tried and repealed. Binds nothing, and is hashed anyway, because a constitution that can quietly drop its own record is not a record |

A node that hashes any of them differently is playing a different game and is
refused at the door — not as a version check, but because it literally is a
different world. [CONSENSUS.md](CONSENSUS.md) governs how independent witnesses
agree: quorum-signed finality certificates for every interval, a per-witness
safety frontier that refuses to re-sign history, and certified recovery for any
node that falls behind.

Nothing in the protocol is random and nothing consults a wall clock for truth.
Terrain, towns, roads, monuments, even the poster on the homepage are pure
functions of the seed, mirrored identically by every window, which is why the
map can promise it cannot drift.

**Governance is by exit.** There are no votes. If you want different rules, edit
the constitution, and you have founded a different world with a different hash.
Citizens choose worlds by walking into them, and the crossing carries them
whole.

## The world

Tallyholm is an island of ten towns and seven countries — the Greenwood, the
Heartlands, the Downs, the Moor, the Crags, the Fens and the Wilds — run through
the same pure functions in every window. It has monuments older than its towns:
an oak that cannot be cut, a bell tower drowned to its shoulders, a wreck
implying a sea worth sailing. None of them will be explained.

Its keepers stand at their counters from the founding on, every one named by a
hash except the wizard, who chose his own. It has fenced fields, worksites where
each country's trade gathers, an inn on the north road whose yard is waiting for
its first brewer, two passes through a Ridge that runs sea to sea — the southern
one shut behind a rockfall the island may dig through together — and a race for
each of the nine trades, each winnable exactly once, the winner named for as
long as the world lasts. One island in the northwest appears on no road and
carries no label. It is drawn faithfully.

Some things on the island are not in this file on purpose.

## The files

| | |
|---|---|
| `SPEC.md` · `LIFTED.md` · `HISTORY.md` | the constitution: the rules **are** the game |
| `CONSENSUS.md` | how strangers agree the same world happened |
| `rules-hash.mjs` | the one definition of what the constitution hashes to |
| `engine.js` | the deterministic state machine (validation, application, intervals) |
| `node.mjs` | a full node: p2p, witnessing, finality, storage |
| `agreement.mjs` | quorum finality, safety frontier, certified recovery |
| `serve.mjs` | the pillar: founds, witnesses, serves the site and windows |
| `join.mjs` | become a sovereign peer of an existing world |
| `recover.mjs` | rebuild the finalized present from certificates alone |
| `worldgen-expanse7.mjs` | Tallyholm: the island as pure functions of the seed |
| `worldgen-any.mjs` | which landscape a founding record describes |
| `window-web.html` · `window-3d.html` · `window-photo.html` | three windows, one world |
| `site/` | the map, hiscores, board, manual, served by the pillar |
| `sdk.mjs` · `session.mjs` | build your own window or executor |
| `advsim.mjs` | the adversarial network simulator |

## Testing

```bash
npm install && node run-tests.mjs
```

The battery covers the engine's invariants, canonical input forms, persistence
round-trips, window/engine agreement, consensus safety under adversaries, and
the release tuple itself. It fails if this README's banner drifts from
`package.json`.

It also now checks the things that used to drift silently: that a recipe can be
held in one pack, that the client reads no skill the engine retired, that no
page states a repealed number. Those faults were all found by hand, and each one
had been true for months — a stall nobody could raise, a spell nobody could
cast, a pack size four documents disagreed about. Anything stated twice will
eventually be stated two ways, so the second statement gets a test.

Freeze evidence and methodology live in [TESTING.md](TESTING.md).

## Lineage

Interval is a tick-based world in a line that runs from MUD1 through the
graphical worlds that followed it. The debts worth naming: **Ultima Online**
(1997) for a skill-based world with no classes, a player-run economy and the
argument that a virtual place needs somewhere dangerous; **RuneScape** (2001)
for proving a persistent world could live in a browser and reach anyone;
**A Tale in the Desert** for taking seriously that players might make rules;
**EVE Online** for the idea that storage having a location is what makes an
economy; and the whole MUD tradition for the deterministic tick.

None of it is copied and this is not affiliated with any of their makers. This
section used to gesture at an era instead — the browser and cartridge years, no
live-ops, discrete time — which names influences without naming them. A project
whose central claim is that rules should be legible ought to be legible about
where its own came from.
