# Phase 2 Engine Scaling — Results Report

Release under test: interval 0.23.0 (phase-1-freeze + Phase 2), spec 0.52,
Node v22.22.2. All measurements from `bench/bench-phase2.mjs` (deterministic
seeded scenarios; raw JSON in `bench/p2-*.json`). Hardware: the container
this campaign ran in — absolute numbers will differ on release hardware;
ratios and hash equalities will not. The frozen Phase 1 engine is preserved
verbatim at `bench/phase1-engine.cjs` and is the differential reference for
every equivalence claim below.

## What changed

1. **Protocol-aware state clone** (`cloneStateForTick`, Phase 2B). `nextState`
   no longer begins with `JSON.parse(JSON.stringify(state))`. The replacement
   is a direct schema-aware structural copy: players (skills, inventory
   slots, equipment, bank, action, trade, attuned — every nested mutable
   object copied), nodes/mobs/ground entity maps, markers, announcements,
   names, firsts; unknown fields fall to a generic deep copy that mirrors
   JSON round-trip semantics exactly (objects drop `undefined`-valued keys,
   arrays map `undefined` to `null`). The genesis object is classified
   immutable-and-safe-to-share and is the only shared reference; a
   deep-frozen-genesis campaign in `test/phase2.test.mjs` proves nothing
   ever writes it. No proxies, no copy-on-write, no libraries — the
   recommended simplicity boundary held, and the optional lazy-cloning
   fallback was **not needed** (see measurements).
2. **Minimal per-tick node indexes** (`buildTickContext`, Phase 2C). Two
   process-local contexts per transition: one over the pre-state (serving
   `validInput`'s spatial checks — the pre-state is never mutated during a
   tick, so one build serves every input) and one over the working clone,
   maintained exclusively through the centralized `addIndexedNode` /
   `deleteIndexedNode` helpers. Exactly the three indexes the brief named:
   tile → ordered node IDs, type → ordered node IDs, owner → brewpot count,
   plus a per-node insertion sequence so that "first match in enumeration
   order" is reproducible (Phase 2D). Every converted call site preserves
   the reference predicate verbatim, including walkable brewpots in the
   movement rule and sorted waystone enumeration in survey placement. The
   scan-based reference behavior remains callable (ctx = null) and is the
   test-only reference mode (`INTERVAL_INDEXES=off` / `_phase2Testing.setIndexes`).
3. **Benchmark and instrumentation** (Phase 2A). `bench/phase2-lib.mjs` adds
   the expanded target-world fixture and three deterministic workloads;
   `bench/bench-phase2.mjs` reports per-section `nextState` timings and
   scan/index counters via the non-consensus `_phase2Perf` hooks.

Nothing else. Every explicitly deferred item (Merkle state, incremental
serialization/hashing, workers, sharding, expiry queues, player/mob/ground
tile indexes, proxy copy-on-write, persistent-structure libraries) remains
deferred; profiling did not justify any of them (see cost centers).

## The expanded target world (benchmark data, not a protocol amendment)

Intended-world numbers are not yet fixed by any founding record, so the
fixture uses documented assumptions: 640×400 (4× area) built by the frozen
classic generator, then deterministically augmented with seeded, spread
placement to **3,772 nodes** (vs 1,291 current) and **331 mobs** (vs 88),
including 150 standing player-built brewpots with concentrated ownership,
400 ground objects, 18 waystones, and extra houses/plots/campfires/banks/
stores/anvils. It is built with the engine's own constructors and passes
`validateState`. Workloads: **ordinary** (role mix: movers, idlers,
gatherers, bankers, fighters, cooks, farmers, trade pairs), **fully active**
(every citizen submits every tick), **adversarial-valid** (correctly signed,
shaped, tick-current inputs rotated to maximize spatial-check, inventory,
and object-creation/expiry work — plants with no plot, sells/buys with no
store, brewpot builds, fire lighting).

## Phase 2B: the clone experiment, as ordered

`structuredClone` was benchmarked first as the drop-in candidate
(expanded world, 1,000 citizens, per-tick clone-section medians):

| Clone | median clone ms | final hash |
|---|---|---|
| JSON round trip | 13.0 | ba8b4a7e… |
| `structuredClone` | 20.1 | ba8b4a7e… (identical) |
| `cloneStateForTick` | 8.5 | ba8b4a7e… (identical) |

`structuredClone` is canonically correct but **slower than the JSON round
trip** on these states — measured and rejected, per the brief's "do not
assume it is faster." The schema-aware clone was adopted. Note what
measurement also showed: at these state sizes the clone was **not** the
dominant cost — the broad scans were (below). The brief's own final
principle ("measure the actual cost") governed.

## Phase 2C: what the scans actually cost

Same configuration (expanded, 1,000 citizens, ordinary), fast clone in both
runs, identical per-tick and final hashes:

| | indexes off (reference scans) | indexes on |
|---|---|---|
| full node scans / tick | 17,916 | 0 |
| input application (median) | 1,411 ms | 30 ms |
| `nextState` (median) | 1,532 ms | 96 ms |
| engine total (median / p95) | 1,711 / 2,175 ms | 294 / 397 ms |

The dominant Phase 1 cost on the expanded world was the per-input
`Object.values(state.nodes)` scans (movement blocking checks, waystone
attunement, adjacency checks, wandering collision), which grow with total
node count exactly as the brief predicted. Index construction costs ~4 ms
per context per tick at 3,772 nodes and is invisible next to what it
removes.

## Before / after

Total engine work per tick (admission verify + prev/post stateHash +
nextState), 600 ms live budget, 30-tick runs. **Expanded target world,
ordinary workload** (the primary configuration):

| Population | Phase 1 median / p95 | Phase 2 median / p95 | Replay speedup P1 → P2 | Final hash equal |
|---|---|---|---|---|
| 100   | 374 / 513 ms   | **83 / 145 ms**  | 1.7× → **6.8×** | yes |
| 500   | 926 / 1,164 ms | **145 / 235 ms** | 0.6× → **3.9×** | yes |
| 1,000 | 1,716 / 2,055 ms | **245 / 309 ms** | 0.3× → **2.5×** | yes |
| 2,000 | 3,276 / 3,739 ms | **447 / 495 ms** | 0.2× → **1.3×** | yes |

Expanded world, other workloads (Phase 2, median / p95): fully active —
1,000: 256 / 367 ms, 2,000: 469 / 533 ms; adversarial-valid — 1,000:
262 / **291** ms, 2,000: 488 / 563 ms.

Current world, ordinary (Phase 1 → Phase 2 median): 100: 115 → 63 ms;
500: 344 → 117 ms; 1,000: 664 → 223 ms (p95 302); 2,000: 1,352 → 400 ms.

`nextState` sections at 1,000 citizens, expanded, ordinary (median ms):
clone 4.5, index build 3.8 (both contexts), pre-tick maintenance 4.9,
input prep 0.3, input application 28.6, actions 0.8, **beacon delay chain
34.8**, mastery pass 1.1. The largest cost inside `nextState` is now the
constitutional beacon evolution; the largest cost in the whole tick is
admission signature verification (p95 137 ms at 1,000; 282 ms at 2,000).

## Correctness campaign

- **Full unit suite**: 185/185 pass (`node run-tests.mjs`; 173 existing +
  12 new in `test/phase2.test.mjs`). `manifest --check` passes; TESTING.md
  updated 188 → 200.
- **Phase 2 suite** (`test/phase2.test.mjs`): clone equivalence across
  JSON / structuredClone / cloneStateForTick on a schema fixture exercising
  **every optional state field** (validated constitutional), byte-identical
  canonical encodings; absence preservation (no `undefined`, no holes, no
  resurrected optional fields); deep clone independence; `nextState` purity
  against fully deep-frozen inputs under **all three clone modes**;
  frozen-genesis campaign (licenses the one shared reference); all clone
  modes transition-identical on every tick; 4,000-query randomized index
  differentials against the reference scans; multi-match adjacency ordering
  (insertion order deliberately different from tile order — the indexed
  path selects the same object); maintained context equals a fresh rebuild
  after adds/deletes; indexed vs unindexed transitions hash-identical on
  every tick across all three workloads; decay/expiry through the
  centralized helpers; and a Phase-1-binary lockstep smoke.
- **Adversarial CI battery**: 14/15. The one failure (`crashes` convergence
  spread) **fails identically under the pristine Phase 1 engine on this
  machine** (A/B verified again this campaign) — the same container-timing
  sensitivity documented in the Phase 1 report. Re-run on release hardware.
- **Cross-binary differential campaigns** (`bench/compare-phase2.mjs`,
  Phase 1 binary vs Phase 2 binary, one process, identical histories):
  expanded world × {ordinary, active, adversarial} at 60 citizens × 60
  ticks, and current world ordinary at 100 citizens × 120 ticks — every
  admission verdict and every per-tick resulting state hash identical;
  final states constitutionally valid. The pre-Phase-1 anchor also still
  holds: `bench/compare-equivalence.mjs` (v0.2-era baseline engine vs this
  engine) passes 100 × 100.
- **Long replays** (`bench/long-replay-phase2.mjs`, expanded world):
  3,000 ticks × 100 (ordinary), 800 × 500 (fully active), 400 × 1,000
  (ordinary), with an indexed-vs-reference single-tick spot comparison
  every 100–250 ticks (all agreed) and constitutional validation of the
  final states. Heap flat across all three runs (11.2 → 12.0 MB over 3,000
  ticks at 100 citizens; no sustained growth at 500 or 1,000). Content
  exercised: gathering with depletion, cooking, fire creation and expiry,
  planting, trades, mob combat, deaths and returns, wandering, ground
  creation/expiry, marker relocation. The constitutional campaign lengths
  (100,000 / 25,000 / 10,000 ticks) are specified for release hardware;
  the harness takes `--ticks` accordingly. Brew fermentation (4,500 ticks)
  and brewpot decay (432,000 ticks) exceed these scaled runs; both paths
  are covered by dedicated unit and differential tests.
- **Mixed-version witness campaign**: in-process lockstep equivalence is
  done (above). The two-binary 100k-tick live campaign on release hardware
  and real network topology remains for release infra — as does the
  **still-pending Phase 1 live witness campaign** the Phase 1 report
  flagged; run both there (Phase 1 binary and Phase 2 binary as
  co-witnesses of one world).

## Acceptance criteria (scaling brief)

- expanded target-world benchmark exists — **yes** (`phase2-lib.mjs`; raw
  data retained: `p2-baseline-phase1-{current,expanded}.json`,
  `p2-final-*.json`)
- input state untouched by `nextState` — **yes** (deep-frozen-input tests,
  all clone modes)
- new clone canonically identical to the Phase 1 clone — **yes**
  (byte-asserted on every fixture and every benchmark final hash)
- derived indexes never enter canonical state / checkpoints / hashes —
  **yes** (contexts are locals of `nextState`; nothing writes them to `s`;
  canonical encodings byte-compared throughout)
- indexed and scan-based queries return identical results — **yes**
  (randomized differentials + whole-transition hash equality)
- node index ordering preserves current semantics — **yes** (seq-ordered
  selection; dedicated multi-match ordering tests)
- every node mutation inside `nextState` goes through the centralized
  helpers — **yes** (build, light, decay, expiry, dismantle; grep-verified
  no direct `s.nodes` writes remain in the transition)
- all existing unit tests pass, none weakened or removed — **yes** (185/185;
  the only doc edit is the TESTING.md count the manifest check demands)
- all new differential tests pass — **yes**
- adversarial simulations show no Phase 2 regression — **14/15; the failing
  scenario fails identically pre-change on this hardware → release infra**
- old/new replay hashes match after every tick — **yes**
- mixed-version witnesses finalize identical histories — **in-process
  lockstep done; live two-binary campaign → release infra**
- memory bounded during long replay — **yes**
- no explicitly deferred work entered the implementation — **yes**

## Honest outcome classification

On this container, for the expanded target world at 1,000 active citizens:
p95 total engine work is **309 ms (ordinary)**, **291 ms (adversarial-
valid)**, **367 ms (fully active)** against the ≤ 300 ms target; medians
245–262 ms against the preferred ≤ 220 ms; replay 2.3–2.5× real time
(target ≥ 2× — met); memory bounded; no event-loop stalls attributable to
clone or index construction (clone + index build ≈ 8 ms/tick).

Classification: **Operationally Viable, at the threshold of Goal Reached.**
Ordinary and adversarial p95 sit within a few percent of the 300 ms line on
container hardware and every workload is far below the 600 ms tick with
replay comfortably above real time; but the fully-active p95 (367 ms) does
not clear the reserved-headroom bar here, so Goal Reached is not claimed.
Re-measure on target release hardware before deciding; the classification
may move to Goal Reached there without any code change. 2,000 citizens
(headroom evidence only): median 447–488 ms, p95 495–563 ms — inside the
live tick even at double the target population.

## The brief's seven stop-condition questions

1. **1,000-citizen median and p95?** Expanded world: 245 / 309 ms ordinary,
   256 / 367 ms fully active, 262 / 291 ms adversarial-valid (this
   container).
2. **Replay comfortably faster than real time?** Yes: 2.3–2.5× at 1,000;
   6.8–7.0× at 100. Stalled witnesses at 1,000 citizens can catch up again.
3. **Percentage of tick time in cloning?** ~1.8% (4.5 ms of ~245 ms);
   ~3.4% including index construction. The optional lazy-clone fallback is
   not justified.
4. **Percentage in broad scans?** ~0% of node scans remain (17,916/tick →
   0). Remaining full-collection iteration: expiry/decay walks and the
   per-player mastery snapshot, together ~6 ms/tick at 1,000 — below any
   deferred-index threshold.
5. **Largest cost center now?** Admission signature verification (p95
   137 ms at 1,000, 282 ms at 2,000) — Phase 1 territory; parallel
   verification is explicitly deferred. Inside `nextState`: the beacon
   delay chain (~35 ms), which is constitutional.
6. **Enough headroom for the expanded world?** At 1,000 citizens, ~300 ms
   of a 600 ms tick remains for networking/agreement/finality/checkpoints
   on this container — the intended reserve, marginally. At 2,000, ~100 ms
   remains: viable but without reserve.
7. **Is another phase justified by an actual constraint?** Not by the
   engine at 1,000 citizens. If the target moves beyond ~1,500–2,000, or
   release-hardware admission measurements show verification crowding the
   tick, the next real constraint is signature-verification throughput
   (parallel verification), then incremental hashing — both currently
   deferred. Do not continue into Phase 3 without that evidence.

## Housekeeping

- Phase 1 engine snapshot: `bench/phase1-engine.cjs` (byte-frozen reference).
- Runtime switches (non-consensus, test/bench only): `INTERVAL_CLONE=
  json|structured|fast`, `INTERVAL_INDEXES=off`, and the `_phase2Testing`
  / `_phase2Perf` hooks. Production defaults: fast clone, indexes on.
  The scan-based reference mode is test infrastructure, not a runtime option.
- TESTING.md test counts updated 188 → 200 (manifest drift check).
- Suggested commit boundaries when this lands in the real repository:
  `bench: add expanded-world scaling scenarios` (phase2-lib, bench-phase2,
  phase1-engine snapshot) · `bench: instrument nextState cost centers`
  (_phase2Perf, section marks) · `perf: replace JSON state clone`
  (cloneStateForTick + selection) · `perf: add derived node indexes`
  (buildTickContext, centralized mutation helpers) · `perf: use indexed
  spatial and type queries` (call-site conversions in validInput/nextState)
  · `test: add clone and index differential campaigns` (phase2.test.mjs,
  compare-phase2, long-replay) · `test: add phase-1/phase-2 witness
  equivalence` (in-suite lockstep) · `docs: record phase 2 scaling results`
  (this file, TESTING.md).
