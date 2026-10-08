# Interval. Testing & Freeze Evidence

Release 1.0.5, protocol spec v1.05, consensus spec v1.10, rules hash
`4cbf903bee7dd6b5…`.

This document states exactly what is tested, with what inputs, for how
long. Coverage is **finite and enumerated**, the claims below are about
the specific scenarios, seeds, and durations listed, not about all
possible executions.

## Unit + property suite (`npm test`)

`node --test test/*.test.mjs`, 522 tests across:

- `leak.test.mjs`, §21c: no write reaches the caller's state. Exercises the
  paths where one citizen touches another (striking, being hunted, trading,
  following), which is precisely where the rest of the suite had no coverage
  and four such writes survived undetected.

- `engine.test.mjs`, pure state-machine transitions
- `proofweb.test.mjs`, §5g-ii: the browser's fold held against the engine's.
  A browser player cannot build their own proof, so the node serves it and
  the window checks the fold before keeping it. If that fold drifts the
  window silently refuses every honest proof and nobody is told.
- `livingroot.test.mjs`, §5g-ii: a root over the LIVING, not only the
  archived. Every citizen can prove what they were from their own record and
  a few hundred bytes of path, and cannot edit it: the leaf changes and the
  fold no longer reaches a root the world certified. Also the SEAL: the
  witnesses sign the root on its own, so move the root and the signature
  dies, a relay cannot swap it on a certificate in flight, and the whole
  sentence a kept proof makes is checkable from the founding alone.
- `incoming.test.mjs`, §9b-iii: the inherited tree, held outside the tick.
  Spending a leaf moves the root, so the first citizen home invalidates
  everybody else's kept path, and `incoming.mjs` is what rebuilds them. It
  holds no key: a wrong path is refused by the root, so the only thing it must
  never do is hand out a path that looks good and is not, and a service that
  has fallen out of step says so and serves nothing. A service starting late
  starts cold reads who has come home off the citizens themselves, since a
  homecoming writes the interval on the citizen, and checks the derivation by
  rebuilding the tree. Where the citizens cannot say, because one came home and
  has since been archived, a single spend is proved against the root; several
  are not guessed at. A list borrowed from another node is checked the same way:
  an empty list, a list one short, the right length with the wrong people and a
  list that is not a list are each refused by one hash comparison, and a
  stranger's name in an otherwise correct list is filtered as noise.

- `succession.test.mjs`, §9b-iii: the OTHER way back from a world that
  stopped. A successor's genesis names one root and nothing about the
  population, and each citizen walks back in on their own record and path. A
  doctored record is refused, a stranger's path is refused, one proof seats one
  citizen once, and what crosses is identical to what a founder's import would
  have carried, because both doors now call the same projection. It also holds
  WHO MAY CONTINUE A WORLD: a successor must be the same rules, the same engine
  and the same island, and must either wait a month of silence or be handed the
  line by a quorum of the old world's own witnesses. Both are a citizen's
  questions, answered by their own client from the founding their kept file
  carries, and the browser's copy of that decision is held against the
  protocol's in `proofweb.test.mjs`. And WHERE THE WORLD WENT: an offer of a
  successor arrives from a stranger, so the id must be the hash of the founding
  offered, or a liar could pair a world everybody would accept with the address
  of one they control.

- `crossing.test.mjs`, §9b-ii: a crossing carries what happened. It used to
  drop all money (gold is a number, so it fell through the vault's item
  filter), the death tally, `raised`, lineage, travels and every name known.
- `calling.test.mjs`, §5r-iv: a calling asks for travel as well as practice.
  Level fifty arrives in under two hours, so without the second half a
  citizen could swear their one lifelong trade from one rock.
- `attendance.test.mjs`, §7dw-iii: a burning fire pays only a citizen who
  is actually there. It had leaked twice, once on place and once on person;
  the second let somebody stoke, quit, and earn for the hour it burned.
- `worklog.test.mjs`, §7cy: a work records the hands that have been on it.
  The fires recorded nothing, which is the case the log exists for: whoever
  has been feeding one is the only way to know it will still be alight.
- `reachable.test.mjs`, every verb a place affords can be filed from some
  row of the window's menus. `stoke` and `brew` are the two deeds that name
  both a node and a slot, and both were offered and silently discarded.
- `wound.test.mjs`, the wound the dead leave, the tally, and the wellspring (§6c-ii)
- `node.test.mjs`, libp2p node boundary
- `agreement.test.mjs`, proposer rotation, quorum, lock discipline
- `safety.test.mjs`, one-vote-per-tick, intersecting quorums
- `persistence.test.mjs`, durable stores, versioned records, stale-round
- `crashsafety.test.mjs`, crash windows, durable-vote-before-broadcast
- `recovery.test.mjs`, fail-closed reads, proof-gated recovery, halt-forward
- `constitution.test.mjs`, names, items, relational validation, namespacing
- `closure.test.mjs`, execution↔validation closure; a ~190-transition
  property test asserting `validateState(nextState(...)) === null`
- `canonical.test.mjs`, trade XOR in state, slot correctness, node rules
- `prefreeze.test.mjs`, per-action canonical schemas, genesis matrix,
  SDK byte-identity, all-29-types transition closure
- `sdk.test.mjs`, every SDK action emits canonical input; gold/item trade
  helpers; malformed calls refused before signing
- `perf.test.mjs`. Phase 1 engine-scaling equivalence: native/fallback
  ed25519 backend parity (known-answer vectors, malformed material),
  bounded signature-verification cache correctness (positive and negative
  caching, collision-freedom, eviction neutrality, cold-vs-warm hash
  equality), identity-keyed state-hash memoization (memo equals the flat
  canonical hash, never crosses objects, never enters state), and the
  nextState purity discipline the memo relies on
- `identity.test.mjs`, standing and calling (spec 10): proof that both windows
  derive a citizen's identity, and the XP curve beneath it, exactly as the
  engine does, past mastery included.
- `expanse.test.mjs`, the expanse world (spec 9a): determinism, the measured
  node/mob envelope, every country present, nothing founded on water, and the
  proof that window-web's integer terrain mirror matches the engine tile for
  tile across the whole map.
- `phase2.test.mjs`. Phase 2 engine-scaling equivalence: the protocol-aware
  state clone is canonically byte-identical to the JSON round trip
  (equivalence, deep independence, absence preservation, frozen-input and
  frozen-genesis campaigns, all clone modes transition-identical), and the
  derived per-tick node indexes answer exactly what the reference scans
  answer (randomized query differentials, multi-match ordering, maintained
  context equals a fresh rebuild, indexed/unindexed and Phase-1/Phase-2
  transitions hash identically on every tick)
- Three suites this list used to name are gone: the rule-change tests were
  folded into `founding.test.mjs`, the world freeze into `expanse.test.mjs`,
  and the window sanity checks became `windows.exist.test.mjs`. They are
  dropped rather than kept as a courtesy, because a document that names a file
  nobody can open is the thing this list exists to prevent.
- `founding.test.mjs` (§21e), that a world survives its own serialization: the
  node-bytes memo is keyed by object identity, so anything that edits a node in
  place after canonicalisation leaves the memo holding the old bytes
- `afterlife.test.mjs`, a world stops and its citizens cross into the next one
- `grove-and-buck.test.mjs` (§7dy, §7dz), the grove's plots and the eel buck
- `stint.test.mjs` (§7dv), the tide and the stint
- `ceiling.test.mjs` (§7dw), closing time
- `span.test.mjs` (§14d), the wild span, founded plank by plank and contested
- `vault.test.mjs` (§6g), that vaults are local and stay local
- `incursion.test.mjs` (§6ao), one body wearing faces, no face stronger than
  another, and never seated in a town
- `food.test.mjs` (§6m-vii), food as a rate, measured as a simulated exchange
- `constants.test.mjs`, the fault where a table changed and its readers did not
- `archive.test.mjs` (spec 5g), the merkle archive driven adversarially
- `storage.test.mjs`, the storage backends, byte-for-byte interchangeable
- `mirror.test.mjs`, the window's copy of the geography against the world's,
  tile for tile across every generator a world could still be standing in
- `fields.test.mjs`, that every hand-drawn furlong and close lies on ground
  that will take it, rather than inside its own town
- `dial.test.mjs`, that `dial.mjs` duplicates the tide and ceiling arithmetic
  without drifting from it
- `window.test.mjs`, the faults that hide in the web window: a retired skill
  name, a duplicate key in an object literal, a drifted threshold
- `windows.exist.test.mjs`, that every window the router offers is on disk
- `site.test.mjs`, that the hiscores board's ranking and its label agree
- `site.content.test.mjs`, the FACTS in the site's prose against the engine
- `prose.test.mjs`, the two rules nothing was enforcing: that
  `spec-conformance.mjs` passes (it was never run by anything, which is how
  fifteen divergences sat in the report unactioned), and that no long dash
  survives anywhere this project writes
- `engines.test.mjs`, two checks on the one thing in this project that is not
  exact arithmetic. The generator uses `Math.sin`, `Math.cos`, `Math.atan2` and
  `Math.hypot` in about fifty places, and ECMAScript does not require any of
  them to be correctly rounded: V8 and JavaScriptCore really do return different
  doubles for these calls. **The §2s check runs always** and is cheap:
  it reads the terrain files and holds every transcendental in them to the three
  cases §2s allows, which is what would have caught the lake shoreline. **The
  cross-engine build is opt-in**, because it founds the world twice and takes
  about eighty seconds: `npm run check:engines` builds the island under node and
  under JavaScriptCore and compares the ground, the settlements and the roads.
  It skips where there is no second engine to ask.
- `mourning.test.mjs` (§5m), what a dying citizen keeps, through the real death
  site rather than a faked `health = 0`: nothing below seventy, the dearest
  priced thing at seventy, the two dearest at mastery. All three were [] for
  every citizen in every world until `skills.prayer` was corrected to
  `skills.mourning`.
- `light.test.mjs` (§7dq), what counts as carrying a light, as a table: the
  Smother's mouth refuses anybody who is not lit and the quenchers inside take
  nothing from a weapon that does not burn, so this one boolean decides both
  whether a citizen may go in and whether going in is any use. The torch's
  timer was defeated twice by two different routes.
- `cave.test.mjs` (§7dq), the chain that makes the Smother dark: the place names
  a ground, the generator returns it, `cave` is a name the window already draws,
  the mouth is inside it and the fellside outside is not. Four links, all of
  them broken until now, and the only symptom of any of them breaking again is
  that a cave looks like a hill.
- `web.test.mjs` (§6ab-ii), that the great-spider's web knits faster while
  nobody is tangled in it. Its seat is the one place in the world that can be
  shot from ground it can never reach, and the arithmetic says that never broke
  the promise that one citizen cannot take it: a lone archer's 3.70 loses to a
  web of six for ever. What it broke was "somebody must hold it". The reach that
  decides is the SPIDER's, not the citizen's, which is the fault the file exists
  to pin: written against `inReach` an archer nine tiles off would have counted
  as holding the thing they were avoiding.
- `cries.test.mjs` (§9f), that the world announces the deep tide's turn and that
  the bridge carries every announcement to the Unreal window. `announce()` has
  seventy-four call sites and the browser windows read them off the world state;
  the Unreal window is handed a curated frame that never carried the list, so it
  was silent for all of them. That mattered most for the tide, because §14i cut
  three tides to one on the grounds that the announcement IS the feature.
- `deeds.test.mjs` (§6bc), what the world writes down about an act that finishes
  inside one interval. The list held only the deeds that PAY, so a gambit, the
  four spells of the barrow book, swearing a calling, sailing and every craft at
  a workshop were invisible to anybody standing beside them. The Unreal window
  keys both a figure's animation and its sound off that word, and had fifty-four
  clips and sixteen noises authored for verbs the world could never name.
- `signs.test.mjs` (§7ds), that the island is signposted and every settlement
  names itself on a post. Two hundred and ten nodes carry authored words and the
  window had never shown one: a node's options come from the engine's affordance
  table and nothing in the engine reads a sign, so a window waiting to be told
  waited for ever. The nine wordless posts are pinned at nine so the number
  cannot grow quietly.
- `adversarial.test.mjs`, the adversarial battery as CI (see below)
- `errors.test.mjs`, typed protocol error codes: startup refusals and
  halts carry stable `ERR_*`/`HALT_*` codes with evidence
- `version.test.mjs`, every release reference agrees with `package.json`
  (README, TESTING, CONSENSUS, SPEC banners) and with the release manifest
- `lifecycle.test.mjs`, startup/shutdown lifecycle: shutdown drains all
  checkpoint I/O to genuine completion (no timeout) before releasing the
  process lock, fails closed if the final checkpoint cannot be written
  (lock retained), no writes after exclusivity release, pending-replacement
  drain, fail-safe startup cleanup, and immediate clean restart
- `startupverify.test.mjs`, bounded startup verification is the generic
  default: omitted config resolves to the shared bounded constant (never
  Infinity), explicit bounded / Infinity / zero all honored, structure
  checked on every row while cert verification is bounded, and direct
  construction matches the launcher default
- `byzantine.test.mjs`, the constitutional fault model: quorum math
  (incl. non-minimal witness sets), threshold validation, historical
  conflicting-certificate detection (immediate, after the memory window,
  and across restart via the durable finality index), cryptographic
  halt-evidence, accountable failure, AND the finality index as a
  first-class safety record: MANDATORY for production witnesses (all
  three durable stores required), store-level immutability (first append
  wins, identical idempotent, conflicting rejected, reopens see the
  original), fail-closed append/read halts, startup corruption refusal,
  long-history O(1) lookup, and recovery after an index-persist halt

## Adversarial simulation (`npm run advsim`)

`advsim.mjs` is a deterministic, seeded, event-driven network under a
hostile transport. Each run is a pure function of `(scenario, seed,
durationMs)`, identical inputs replay identically (asserted by a
determinism test).

Every witnessed scenario declares a Byzantine threshold `f` and its
actor count never exceeds it (a scenario that spawns more Byzantine
actors than `n,q,f` tolerates is rejected as a scenario bug, testing
outside the model would make a fork "expected").

**Invariants asserted every scenario, every seed:**

- **S1** no two honest nodes finalize different hashes for one tick
- **S2** no honest witness signs two bundle hashes for one tick (wire-judged)
- **S3** every committed finality record verifies standalone vs genesis
Every scenario declares a Byzantine threshold `f`; a scenario may not
spawn more Byzantine actors than `f` (the harness refuses), so the
simulator always tests behavior *inside* the constitutional model, never
outside it.

- **S4** honest nodes halt only under Byzantine presence, and only with a
  recognized structural halt CODE plus supporting evidence (an uncoded or
  evidence-free halt fails the scenario); classification is by typed code,
  not message text
- **Harness**: any unexpected exception (not a modelled safety refusal)
  fails the scenario
- **Convergence**: when the network is healthy at cutoff, honest nodes'
  finalized-height spread must be ≤ 3 (the `heal` scenario asserts spread 0)

**Scenarios** (`n` witnesses, quorum `q`):

| scenario | n/q | transport | faults | liveness floor |
|---|---|---|---|---|
| benign | 4/3 | clean |, | slowest ≥ 15 finalized |
| lossy | 4/3 | 25% loss, 10–900ms, 30% dup |, | slowest ≥ 2 |
| crashes | 4/3 | 5% loss | crash-restart, 50%/tick | fastest ≥ 5 |
| partitions | 5/3 | 5% loss | asymmetric splits 70%/tick | fastest ≥ 4 |
| equivocator | 4/3 | 5% loss | Byzantine proposer (2 bundles + double-sign) | fastest ≥ 0 |
| liar | 4/3 | 5% loss | Byzantine attester (corrupt result hash) | slowest ≥ 3 |
| replayer | 4/3 | 5% loss, 10% dup | replayed bundles/attestations | slowest ≥ 3 |
| garbage | 4/3 | 5% loss | malformed message floods | slowest ≥ 3 |
| chaos | 7/5 (f=2) | 20% loss, 10–700ms, 25% dup | crashes + partitions + 2 Byzantine | fastest ≥ 0 |
| heal | 4/3 | 10% loss | partition burst then quiet tail | slowest ≥ 3, **spread = 0** (requiredSpread) |
| byzantine-max | 7/5 (f=2) | 5% loss | two equivocators at the boundary | fastest ≥ 0, no fork |
| lockstorm | 7/5 (f=2) | 10% loss | 2 equivocators + early partition burst, then heal | no fork; halts only with evidence |

Liveness floors are deliberately conservative: under simultaneous faults
the model promises **safety always, liveness when able**. A "fastest ≥ 0"
floor means the scenario asserts only safety and convergence, not
progress, because a hard-enough fault storm may legitimately finalize
nothing while never forking.

**CI sample** (`test/adversarial.test.mjs`, 15 tests): each scenario at
seed 7919 (heal at 26s for full convergence), plus convergence-mechanism
checks (heal enforces spread 0; the check has teeth) and a determinism
check.
**Full battery**: `node advsim.mjs all 3 30000` (all scenarios × 3 seeds
× 30s). **Single scenario**: `node advsim.mjs <name> <seeds> <ms>`.

Seeds are `seed_index × 7919`; the CLI default is 3 seeds. These are the
tested seeds, other seeds are not claimed.

## Live surfaces (socket-binding; `INTERVAL_LIVE=1`)

- `npm run demo7`, 4 witnesses (q=3) + observer over **real libp2p
  gossipsub**, a **real malicious peer** flooding forged bundles,
  attestations, and garbage on the real topics, an honest witness
  **killed and restarted from durable disk stores**, and a late observer
  proof-syncing through the flood. Asserts zero forks, zero invalid
  certificates.
- `npm run e2e`, `serve` founds a 3-witness world (quorum 2); two
  `join --witness` **separate OS processes** attest from isolated working
  copies with their own durable stores. Phases: 3 witnesses advance →
  kill one, 2-of-3 still advances → restart it, resumes → kill two, the
  world halts (never forks).

Both are environment-sensitive (they bind real TCP sockets) and are
excluded from the default evidence run; set `INTERVAL_LIVE=1` to include
them in `freeze-evidence.sh`.

## Supported runtime

Node `>=22.5.0` (declared in `package.json` `engines`) the minimum for the built-in `node:sqlite` used by the production backend. The engine
resolves SHA hashing through Node's built-in `crypto` when present and
falls back to `@noble/hashes` in browsers; hashing is lazily resolved so
concurrent dynamic `import()` of the engine is race-free across Node
versions (a prior ordering bug under 22.16 is fixed). The full suite
runs under `node --test`.

## Release test structure

Split by purpose (storage brief §8):
- `npm run test:unit`, all non-adversarial suites (fast)
- `npm run test:adversarial:ci`, the deterministic adversarial CI battery
- `npm run test:adversarial:full`, `advsim all 3 30000` (long campaign, run separately)
- `npm test`, unit + adversarial CI (the release gate)

## Storage backends

The finality store is selectable behind one interface: SQLite (production default) or the flat-file append log
(`finalityBackend: 'flatfile'`, dev/compat). SQLite uses
`journal_mode=WAL`, `synchronous=FULL`, `foreign_keys=ON`, an indexed
`(world_id, tick)` primary key, and schema-enforced append-only
immutability. `migrateFlatFileToSqlite()` performs a validated one-time
migration preserving the source as a read-only backup. Storage choice
never changes protocol records.

## Storage operations tooling

`storage-ops.mjs` operates on a witness's SQLite finality store without
touching consensus:
- `npm run storage:health <db>`, sizes, row count, WAL state, quick_check
- `node storage-ops.mjs integrity <db>`, full `PRAGMA integrity_check`
- `npm run storage:backup <db> <dest>`, consistent online backup (VACUUM INTO), verified
- `npm run storage:verify <db> [worldId]`, validate a backup/restore

## Large-history benchmark

`node bench-storage.mjs [ticks] [sqlite|flatfile]` builds a synthetic
history and measures append throughput, indexed lookup, startup
validation, integrity check, and online backup. At 1,000,000 ticks the
SQLite backend measures (on this environment): batched append ≈168k
rows/s, random lookup ≈15 µs, ≈402 bytes/row, integrity quick_check
≈275 ms, online backup ≈4.8 s. Bounded startup validation is ≈0.4 s vs
≈22 s unbounded, startup is constant-time in history length.

## Reproducible evidence (`npm run evidence`)

`freeze-evidence.sh` captures runtime environment, dependency lockfile,
exact commands, per-stage exit codes, and full logs into
`freeze-evidence/`. Its own exit code is nonzero if any stage failed, so
it doubles as the freeze gate.

```
npm ci                             # exact reproduction from the committed lockfile
npm run evidence                   # core suites
INTERVAL_LIVE=1 npm run evidence   # + live libp2p and multi-process E2E
```
