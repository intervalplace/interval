# Tallyholm: the Drowning Beck, the wild span, and the river's two mouths

A new-world change set (protocol v0.97 → **v0.98**, rules hash
`971459f9f2739b84…`). It changes the rules, so it founds a *new* world on the
same island rather than editing the live one — which is what you chose.

## What changed, and why

### 1. The Drowning Beck (river fix — geography)
The Drowning Pool sat orphaned in the Wilds: a closed body with no inlet or
outlet, the one water on the island that broke the rule every other water keeps.
Added **the Drowning Beck** — a watercourse from the Marchwater's western tip
(192,316) north-west into the pool (156,274). It flows downhill into the hollow
the pool lies in, stays entirely in the Wilds, and crosses no roads. The pool
now drains to the wider river system, and the Wilds finally has a watercourse.
- `worldgen-water-v7.mjs`: new `BECKS` entry.

### 1b. The Drowning Beck drains the pool (direction fix — lore only)
The beck now flows OUT of the Drowning Pool, down into the Marchwater, instead
of the march feeding up into the pool. A pool in a Wilds hollow is the high
point of its own basin; its overflow runs downhill to the lower Marchwater, so
the west becomes one convergent drainage (pool → beck → march → Great River →
sea) rather than a distributary fork that splits to feed two places. Identical
tiles (a polyline reversed rasterizes the same water); only the source end,
the path order, and the description changed.

### 2. The Great River reaches the sea (river fix — geography)
The river's northern (source) end stopped full-width in the middle of the
Greenwood — the "river starts on dry land" mistake. Pulled the head up to the
north coast so it meets the sea as an estuary, water-to-water, exactly as its
southern mouth does at the fens.
- `worldgen-expanse7.mjs`: `SRC_YF` 0.105 → 0.06.
- `window-web.html`: `SRC_YF6` matched.

### 3. The wild span (new feature — nodes, not geography)
A bridge the citizens build together over the beck, at **one** authored crossing
site (max scarcity: one contested tile in the Wilds). Modeled on the toll gate
(dynamic crossing) and rockfall (node-not-terrain) precedents, so it never
touches the geography hash.
- Node types `spanwork` (rising pool, blocks its tile like the water) → `span`
  (finished decking, walkable by everyone forever).
- Verbs `found` (stand ON the site, lay the first plank) and `lay` (bank up to
  `perLay` planks/interval). **Accumulate-only**: the pool only rises; nothing
  lowers it and nothing un-builds a span.
- Saboteurs suppress the *rate* by killing carriers — carried planks spill on
  death (existing mechanic), banked planks are permanent.
- Monument record: first hand + interval, last hand + interval, deaths-on-tile
  (only rises), last-10 carriers, and — on completion — who laid the last plank,
  when, and how many intervals it took start to finish.
- `g.span = { pool: 10000, perLay: 5, xpPerPlank: 6 }`.
- `engine.js`: node types, verbs, schemas, movement hook (`spanDeckAt`), death
  tally (`tallySpanDeath` at all 3 death sites), validation, node-type reindex.
- `worldgen-expanse7.mjs`: `SPAN_SITES` + `spanSites` registry accessor.
- `sdk.mjs`: `found()` / `lay()`.
- `SPEC.md`: §14d.

## Tests
- **NEW** `test/span.test.mjs` — 11 tests, all pass: lifecycle (found → lay →
  open → cross), accumulate-only, rate cap, monument record, deaths-on-tile,
  scarcity, and **determinism** (two engines compute the identical pool).
- Full suite: **no new failures** vs. the untouched original (the 36 pre-existing
  failures are stale version pins and one stale mirror-locator test, all present
  before this work).

## Version tuple (moved together)
`package.json` 0.98.0 · `SPEC.md` header v0.98 · engine `SPEC_VERSION` 0.98 ·
rules hash `971459f9f2739b84` · README / CONSENSUS.md / TESTING.md banners.
Consensus spec unchanged (1.9 — consensus logic didn't change).

## To see it live
`INTERVAL_SEED=tallyholm node serve.mjs`, then open `/map`.

## Renders (drawn from real engine terrain, window-web palette)
`tallyholm_final.png` (whole island, labeled), `_wilds.png` (the beck + span),
`_rivermouth.png` (the new northern estuary).
