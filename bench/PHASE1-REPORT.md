# Phase 1 Engine Scaling — Results Report

Release under test: interval 0.23.0 (phase-1-freeze), spec 0.52, Node v22.22.2.
All measurements from `bench/bench-engine.mjs` (deterministic seeded scenarios;
raw JSON in `bench/baseline-*.json` and `bench/after-*.json`). Hardware: the
container this campaign ran in — absolute numbers will differ on release
hardware; ratios and hash equalities will not.

## What changed

1. **Native Ed25519 verification** (`engine.js`, perf brief 1B). OpenSSL-backed
   verify behind the unchanged `verifyInputSig` / `verifyPayload` contracts.
   Structured as native-accept fast path with the pure-JS implementation
   remaining the sole authority on every rejection, so the constitutional
   accepted set is preserved by construction (strict-RFC-8032 acceptance is a
   subset of the fallback's acceptance). Startup runs a six-vector
   known-answer cross-check; backend disagreement on a strict vector throws
   `ERR_ED25519_BACKEND_DISAGREEMENT` and refuses to start. Native capability
   absent → quiet fallback mode.
2. **Signature-verification cache** (perf brief 1C). Process-local bounded LRU
   (16,384 entries) keyed by `sha256(len‖pubkey‖len‖sig‖payload)`. Positive
   and negative verdicts cached; `Map.has` distinguishes cached-false from
   absent; `validInput` still calls the verification function.
3. **State-hash memoization** (perf brief 1D). `WeakMap` keyed by object
   identity only. The memo is byte-equal to `sha256(canonical(state))` by
   definition (asserted per fixture in tests) and never crosses objects,
   ticks, or state-carried fields.

Nothing else. All deferred items in the brief remain deferred.

## Before / after

Median engine work per tick (admission verify + prev/post stateHash + nextState),
600 ms live budget:

| Population | Tick median before | Tick median after | Tick p95 after | Replay speedup before → after | Final hash equal |
|---|---|---|---|---|---|
| 100   | 404 ms  | **112 ms**  | 162 ms  | 2.8× → **9.2×** | yes |
| 500   | 1,820 ms | **366 ms**  | 433 ms  | 0.6× → **2.3×** | yes |
| 1,000 | 3,632 ms | **773 ms**  | 989 ms  | 0.3× → **1.1×** | yes |
| 2,000 | 7,348 ms | **1,299 ms** | 1,427 ms | 0.1× → **0.4×** | yes |

Speedup on median tick: 3.6× / 5.0× / 4.7× / 5.7×.

Counters at 500 citizens (30 ticks): sig-cache hit rate 72% (35,262 hits /
13,566 misses — the admission→state-machine double verification now costs one
curve operation), native calls 13,566, fallback calls 47 (= exactly the invalid
inputs in the stream), state-hash hit rate ~48% (the second hash of each object
is free), zero evictions below 2,000 citizens.

## Correctness campaign

- **Phase 1 suite** `test/perf.test.mjs`: 16/16 pass (backend parity incl.
  malformed material and domain separation, positive/negative caching,
  collision-freedom, eviction neutrality, cold-vs-warm hash equality,
  memo-equals-flat-hash, identity keying, nextState purity).
- **Full unit suite**: 173/173 pass (`node run-tests.mjs`).
- **Adversarial CI battery**: 14/15 pass. The one failure (`crashes`
  convergence spread 24 > 3) **fails identically under the pristine
  pre-optimization engine on this machine** (A/B, two runs each) — it is a
  container-timing sensitivity, not a Phase 1 regression; your attached
  freeze evidence shows it passing on release hardware. Re-run there.
- **Deterministic old-vs-new replay** (`bench/compare-equivalence.mjs`):
  two campaigns — 300 ticks × 100 citizens and 60 ticks × 500 citizens,
  ~54,000 inputs including corrupted signatures, stale duplicates, and idle
  citizens. Every admission verdict and every per-tick resulting state hash
  identical across engines; both final states constitutionally valid.
- **Cross-config hash anchors**: all four benchmark populations produce
  byte-identical final hashes on the old and new engines.

## Acceptance criteria (perf brief)

Every criterion met on this machine, with two environment notes:

- native and fallback Ed25519 agree — **yes** (KAT at startup + parity tests)
- malformed inputs retain existing behavior — **yes**
- `validInput` still performs signature verification — **yes** (tested)
- signature cache bounded and process-local — **yes**
- state-hash cache uses object identity — **yes**
- canonical state encoding unchanged — **yes** (byte-asserted)
- every old fixture produces the same state hash — **yes**
- all unit tests pass — **yes** (173/173)
- all adversarial simulations pass — **14/15 here; the failing scenario also
  fails pre-change on this hardware → re-run on release hardware**
- deterministic old/new replay matches at every tick — **yes**
- mixed-version witnesses finalize identical histories — **in-process
  lockstep equivalence done here; the two-binary 100k-tick live campaign
  needs your real network topology → run on release infra** (old and new
  builds as co-witnesses of one world)
- benchmark results documented — **yes** (this file + JSON)
- no deferred optimization entered the implementation — **yes**

## The brief's five stop-condition questions

1. **What fits comfortably in the tick budget?** With the p95 ≤ 300 ms
   safety target: **~300–400 active citizens** (500 sits at p95 433 ms —
   inside the 600 ms budget but without the reserved headroom). Versus
   ~100 before. The world's own resource capacity (~150–200) is now the
   *lower* of the two limits again.
2. **Largest remaining cost center?** `nextState` internals other than
   crypto: the `JSON.parse(JSON.stringify(state))` deep copy per transition
   and the per-entity/per-player scans (~0.6 ms per citizen-tick at 500).
   Verification is down to ~14% of the tick; hashing ~4%.
3. **Is replay comfortably faster than real time?** At ≤ 500 citizens, yes
   (2.3–9.2×). At 1,000+ it hovers near 1× — populations beyond ~700 would
   need Phase 2 (cheap clone) before stalled witnesses can rely on catch-up.
4. **Does measured capacity satisfy the intended initial world?** Yes, with
   margin: the current world sustains ~150–200 players by resources; the
   engine now clears that roughly 2× over.
5. **Would another optimization materially improve a real constraint?** Only
   if the expanded world targets > ~400 citizens: then the deep copy (§3c of
   the earlier scaling brief) is the next real constraint, followed by
   incremental serialization. Until the worldgen amendment lands, stop here.

## Housekeeping notes

- `TESTING.md` counts updated 172 → 188 (the manifest-derived drift check
  demanded it; `manifest --check` now passes).
- The shipped `freeze-evidence/` was already stale relative to this tree
  (spec 0.47 evidence in a 0.52 tree; two doc-consistency tests failed on
  the *pristine* zip). It is preserved unmodified at
  `freeze-evidence-stale-spec0.47/`; mint fresh evidence for the optimized
  tree with `INTERVAL_LIVE=1 npm run evidence` on release hardware.
- One test-only hook was added (`E._perfTesting`) so the suite can exercise
  cache eviction without minting 16k signatures. It is not API and is never
  touched by protocol code.
- Suggested commit boundaries when this lands in the real repository, per
  the brief: `bench:` harness, `perf:` native backend, `perf:` sig cache,
  `perf:` state-hash memo, `test:` equivalence campaign, `docs:` TESTING.md.
