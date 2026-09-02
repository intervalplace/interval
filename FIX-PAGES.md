# Your Pages deploy, and what the upload was still missing

## Why the readme was the website

`.github/workflows/publish-window.yml` was not in the repository, so Pages fell
back to **Deploy from a branch** — which only offers `/` or `/docs`. Root has no
`index.html`, so Jekyll rendered `README.md` as the site. That is the page in
your screenshot, banner and all.

**Two ways to fix it. Either works.**

### A. GitHub Actions (recommended)
The workflow is in this zip. Commit it, then
**Settings → Pages → Source: `GitHub Actions`** — not "Deploy from a branch".
Layout stops mattering.

### B. Deploy from a branch
`docs/` is built and included here. Commit it, then
**Settings → Pages → Deploy from a branch → `main` / `/docs`.**

Rebuild either at any time:

    node build-window.mjs --out=docs --domain=play.interval.place
    node build-window.mjs --domain=play.interval.place        # dist/, for Actions

`.nojekyll` is now emitted too — otherwise Pages runs Jekyll over a branch
deploy, which ignores paths starting with an underscore and rewrites others. An
odd thing to let happen to a client whose whole claim is that its bytes are
checkable.

`PUBLISHING.md` documents both paths.

---

## Four real faults in the upload

**1. The rename reached the engine and not the generators.** `NODE_TYPES` had
only `vault`, but `worldgen.mjs` and `worldgen-expanse{,2,3,4,5}.mjs` still
emitted `'bank'` — so **six of the eight registered generators could not found a
world at all**: *"worldgen produced an invalid state (unknown node type)."*
Also fixed in `census`, `check-seeds`, `check-window*`, `preview-*`,
`measure-world`, `site/map.html`, and five windows.

**2. The one-hitpoint crossing was still live in four generators.**
`worldgen.mjs` and `expanse3/4/5` each kept their own copy of the crossing,
clamping `hp` with `E.levelForXp(p.skills.hitpoints)` — a skill §5j deleted, so
`levelForXp(undefined)` is 1. An imported citizen woke at **one hitpoint**, and
those generators never seated a vault, so a crossing's goods vanished. All four
now delegate to `E.seatImport`.

**3. The test suites predated the rename.** `test/vault.test.mjs` crashed on
import looking for `adjacentBankId`; canonical, engine, persistence, phase2,
closure, constitution, safety and prefreeze all carried flat-`bank` fixtures.
Replaced with the vault-aware versions, plus `test/founding.test.mjs`.

**4. The banner on your live page was stale.** It read
*Release 1.0.0 · spec v1.0 · `b8a093a8`* while `package.json` says **1.0.2 /
1.02 / `b961c123`**. README and CONSENSUS synced; `test/version.test.mjs` was
also still hashing `SPEC.md` alone rather than the three constitution documents,
so it was certifying a prefix no node computes.

## One of your own changes

`window-web.html` gained a `/api/tables` fetch that ran as a parse-time IIFE
against the page's own origin — the assumption the node resolver exists to
remove. On a static host it fetched a path on nothing and silently kept the
built-in tables, so a citizen would see the wrong callings or swear level with
no error. It is now `loadTables()`, called from `connect()` once a node has been
chosen and checked. The build caught this: it refuses to produce a page that
still has an origin-relative call.

---

**Battery: 377 tests, all green** (adversarial excluded; it fails one timing
floor identically on the untouched upload).

Rules hash `b961c123b73d67c0`. Built window sha256 in `docs/index.html.sha256`.
