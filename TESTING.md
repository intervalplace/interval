# Interval. Testing & Freeze Evidence

Release 1.0.6, protocol spec v1.05, consensus spec v1.10, rules hash
`589867972d8d5e35…`.

This document states exactly what is tested, with what inputs, for how
long. Coverage is **finite and enumerated**, the claims below are about
the specific scenarios, seeds, and durations listed, not about all
possible executions.

## Unit + property suite (`npm test`)

`node --test test/*.test.mjs`, 658 tests across:

- `leak.test.mjs`, §21c: no write reaches the caller's state. Exercises the
  paths where one citizen touches another (striking, being hunted, trading,
  following), which is precisely where the rest of the suite had no coverage
  and four such writes survived undetected.

- `engine.test.mjs`, pure state-machine transitions; §5u the crushing floor,
  where `stamp` had a schema, a place in DEEDS and a floor standing on the
  island, and no gate and no executor, so a signed canonical input was
  accepted and did nothing while `quick-grit` sat in RECIPES and the first
  rung of the quickmetal chain was beaten at the one anvil; and §5c-ii the
  table:
  the switch (changing your side after the other has agreed), the
  substitution (wielding an advertised slot in the settling tick), the
  gift, walking away mid-trade, and that standing up clears your own side
  and nobody else's
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

- `crossing.test.mjs`, §9b-ii and §9b-iv: a crossing carries what happened.
  It used to drop all money (gold is a number, so it fell through the
  vault's item filter), the death tally, `raised`, lineage, travels and
  every name known. It also dropped the nine races, so the citizen who
  climbed a skill to the top first lost their name at every refounding and
  the next one to cross in the new world was announced in their place.
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
- `rooms.test.mjs`, every drawn room is a declared room. PLAN_ROOMS answers
  both "where may a stall stand" and, through `isIndoor`, "is this tile inside
  a building", and the paving reads the second. A room left off the table is
  one the world calls outdoors: no floor, no roof, and whatever the drawing put
  in it standing in a walled box open to the sky. §7bd fixed this once and left
  slivers behind, so thirty-one rooms across nine towns were still half out in
  the weather. A fix that has come back once is a test, not a note.
- `nokeys.test.mjs`, no tracked file carries a citizen. A citizen is a private
  key, so a key in a public repository is not a leak that can be tidied up: it
  is a person given away. `unreal-key.json` sat on the public remote carrying
  one, with its own note reading "do not commit it", while `.gitignore` had
  listed it the whole time and made no difference, because an ignore rule does
  not untrack a file that is already tracked. `.gitignore` says what must not
  be ADDED; this asks `git ls-files` what is CARRIED, and matches the key value
  rather than the field name, since the engine says `privateKey` constantly.
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
- `items.test.mjs` (§6bf), that everything the world prices, equips, stacks,
  makes or hands to a citizen is in ITEMS. A word that is not is an item the
  world can mint and cannot keep: `carriedFrom` strips it out of the pack at a
  crossing and nulls it out of the weapon hand. It had happened three times --
  `rod`, `sapling`, `hollow-bow` -- and the last two were found by the
  handbook printing a sapling with no picture beside it
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
  name, a duplicate key in an object literal, a drifted threshold, the two
  tables the window has to copy because a browser file cannot import the
  engine (which weapons take both hands, and which slot a thing is worn in),
  that the world's `health` is translated into the window's `hp` at the one
  door every state comes through, that no landmark drawing sits behind a gate
  that does not name it, that a wall is the same thickness whichever way it
  runs, and that a signpost reads the words the world put on it rather than
  three painted into the drawing
- `hands.test.mjs`, one pair of hands, played rather than read: a shield
  cannot go up beside a two-handed weapon and a two-handed weapon cannot go up
  beside a shield, so the window says the two inputs instead. Crosses every
  equippable word with every state the hands can be in and checks the window
  sends only wields the engine will take: it was sending 29 it would not, and
  saying nothing when they were refused
- `windows.exist.test.mjs`, that every window the router offers is on disk,
  and that every one of them PARSES: four were blank pages when that check
  was written, for a ternary whose colon had ended up inside a comment
- in `window.test.mjs`, that a stall is bought from AT the stall. Clicking
  one printed its wares into the log and said "buy from the bar below",
  and clicking your OWN stall called `openMyStall`, which does not exist
  anywhere in the file and never has.
- in `window.test.mjs`, that the health bar has a height the panel cannot
  squeeze. `#panel` is a flex column, so a child with a fixed height is
  shrunk when the column overflows: measured at FOURTEEN pixels in the
  stylesheet and NOUGHT on the screen, with the number still showing
  because it is positioned absolutely and overflows the box. The one
  readout you must take in at a glance mid-fight, on every phone.
- in `site.content.test.mjs`, that the law and the island agree there is
  one crushing floor, and that only one thing on the island is the drowned
  bell
- in `window.test.mjs`, that the flat window can build every input a CITIZEN
  may send. Eight could not be built by any window the router offers: the
  two bridge verbs, the bellwork rope, the barrow hoard, the boat, the
  ossuary offering, the promise and the crushing floor. Each now has a
  place it is pressed, and a test that it does. The test itself was reading
  the schema keys by INDENT, which finds a key only where it begins a line,
  and twenty-two of the ninety-one share a line with another -- so it checked
  sixty-nine and its own `length > 60` guard waved that through. It counts
  braces now.
- in `window.test.mjs`, that the drowned bell RISES as the town pulls. The
  engine has always had the work; the window drew a bar under a bell that
  hung in one place from the first pull to the last.
- in `window.test.mjs`, that a menu opens under the thing that was pressed.
  `chooseAction` opened at the pointer only for a right-click, and a phone
  has no right button, so every menu on a phone came out as a row above
  the pack.
- in `window.test.mjs`, §4c-ii the cape: that it is the GRADE and not a
  level. Two of its three steps could never happen, because §5k caps every
  skill outside a citizen's sworn calling at seventy, so exactly one can
  reach a hundred; and it arrived at a hundred, which §5x says makes a
  citizen eligible rather than a master. Also that no window the router
  offers reads a skill the engine retired: that check had held window-web
  clean for months while window-diablo read five retired names and had a
  standing of nought, a cape that could never appear and a frame of one
  for everybody
- in `window.test.mjs`, that every word the engine lets a citizen take up is
  one this window lets them take up. The window writes that set out by hand
  and the engine DERIVES it, so it has gone stale three times: seven words,
  then twenty-five, then thirteen. A word missing from it cannot be worn at
  all. And that a LIVING citizen is drawn in the gear they are wearing:
  `headItem` and `bodyItem` were passed only to the falling citizen, so a
  great helm, a shell helm, a king's shroud, a shell plate, a great plate or
  any of the four barrow masks showed only as its wearer began to die
- the island sweep's findings, in `window.test.mjs`: that a palisade joins
  a palisade (the neighbour index read one type and the branch served two,
  so a curtain wall drew as a row of separate posts), that a fence knows
  which way it runs, that every gated landmark has a drawing, that a
  keeper's look comes from the calling the world gave them rather than
  from scraps of their id, and that a coast wears sand on all four sides.
  The slow half is `check-window-words.mjs`, which founds the whole island
  and reports every word in it the window names nowhere
- in `window.test.mjs`, that the canvas click handler DRAWS nothing. This has
  happened twice and in both directions. First five interaction branches (the
  furnace, the altar, the rockfall, the mill and the sawpit) were written into
  `drawScene`, so each ran its logic on every animation frame and a citizen
  crashed the window by walking past a thing. Then a DRAWING of a citizen's
  stall was pasted into the click handler above the branch that tends and buys
  from one: it painted trestles on a click, matched first and returned, so the
  whole menu below it was unreachable and a stall could be neither bought from
  nor priced. One mistake, one tell: a canvas call where the clicks are
- in `window.test.mjs`, that the anvil quotes the engine's price. The forge
  table had drifted on TWENTY of fifty-eight recipes -- a quick-ingot at 20
  quick-stone when the world wants 8 quick-grit, a great-sword at ten ingots
  and twenty-six brimstone when it wants five quick-alloy and a haft, a
  `steel-ingot` named in two recipes which is not a word this world has -- and
  the furnace offered four of the engine's five smelts, missing the alloy the
  whole great line is made of. The window now takes the ledgers from
  /api/tables as well as carrying a generated fallback
- in `window.test.mjs`, that the window draws the ground the WORLD lays
  (`check-mirror-ground.mjs`). Every window carries a copy of the island's
  surfaces, because a browser cannot import a nine-thousand-line generator
  that imports the engine, and the copies had never been compared to the thing
  they copy. Measured tile by tile: the flat window drew different ground from
  the one a citizen walks on in FIFTEEN THOUSAND places. Not one floor tile was
  drawn anywhere on the island, so every house in every town stood on grass;
  the chalk ways of the Downs, the peat ways of the Moor, the causey over the
  fen and every beach were the bare country. `check-mirrors-seeds.mjs` was
  supposed to catch this: it reads terrain blocks out of the window HTML files,
  which have not held one since the mirror was factored out; it tests expanse4,
  three foundings ago; and it throws before it compares anything. The cure is
  not a better copy but no copy: `/api/ground` serves every tile the world
  names, 13KB gzipped for the island, and the window is told, exactly as it is
  already told the town seats and the road network
- in `window.test.mjs`, that the bank and the counter OPEN A LIST, the way the
  stall does. Both answered with a single sentence and no way to act on it:
  the bank said "tap items to deposit, tap the vault to withdraw" and tapping
  the vault printed that same sentence again, so the one thing a bank is FOR,
  knowing what you have in it, could not be done at the bank. The counter said
  "discharge what you carried, or set the container down" and offered neither,
  at the only place in the world where a consignment may be taken up or set
  down. The test searches inside the CLICK HANDLER, because both types have a
  branch in `drawScene` under the identical condition and the drawing comes
  first: a plain indexOf tests the art and reports that the bank is fine
- in `window.test.mjs`, that a floor does not fray into the street. Fraying is
  for ground that wears into its neighbour, grass creeping over a yard or a
  beach eating a bank; a floor ends at a wall, which is a built edge and a
  straight one, and boards crumbling into the road look like a ruin
- `tables.test.mjs`, every constitutional table a window COPIES, against the
  engine's own export, on every run. Neither window can import `engine.js`:
  both are one file served to a browser with no build step, so the tables are
  copies held honest by a note in the margin asking whoever changes the engine
  to change the window too. That failed on four tables in a row and every
  failure was invisible from the window: `PRICES` (window-photo held 77 of
  105, and ten of its 77 were retired words), `MOB_STATS` (window-web knew
  eleven of twenty-five creatures, so a barrow wight, a fen adder, a boar and
  the gibbet king all drew a FULL health bar at every wound and nothing warned
  a citizen they had been noticed), `EQUIPPABLE` (window-photo held seventeen
  words of which FOURTEEN were retired, so a citizen there could put on three
  of eighty things) and `CALLING_NAMES` (the bridge-keeper, who has a node and
  a verb of his own and no name). It also checks the wire they come over: four
  of those tables are Sets, `JSON.stringify(new Set())` is `{}`, and
  /api/tables served all four whole -- so a window that trusted them would
  have learned that nothing in the world can be worn
- `check-window-photo-landmarks.mjs`, wrapped in `photo.test.mjs`: every one of
  the ninety-seven landmark kinds the engine will accept, BUILT against the
  real three.js, and asked four things. Does it build; did it make anything; is
  every material a material; does anything still fall through to the fallback.
  Fifty-five kinds had no arm in that window's drawing chain, so all 1,821 of
  them on the island drew as the `else` at the bottom of it, which built a hull
  and a mast: a meadow of beached boats. And the hull used `mats.trunk`, which
  was asked for fourteen times in the file and defined NOWHERE, so they were
  WHITE boats -- `new THREE.Mesh(geo, undefined)` neither fails nor warns,
  three.js hands the mesh its default unlit white. Both faults are silent by
  construction and neither a grep of the source nor a sweep of the world finds
  them. It also measures size and footing, which catches a bench the size of a
  keep or a thing buried in the ground, and it is the only check that could
  have found `wellspring` and `grave`: both are in LANDMARK_KINDS, the island
  does not currently grow either, and both words appear elsewhere in the file
  as text, so every other check called them drawn
- `sweep-photo.mjs` is the eyes. It stands the real photo window up in a real
  browser, hands it the real island and photographs the places where the new
  art is. Not in the suite, because it needs Chrome: the standing rule here is
  to test through the window's own interface, and no check of geometry will
  tell you whether a pine looks like a pine
- `photo.test.mjs`, whether a thumb can reach the world from the photo window.
  It could BUILD 83 of the 88 inputs a citizen may send and could REACH four:
  a beast to attack, a node to gather from, a pile to walk to, and ten verbs
  in a pack sheet. Tapping another citizen did nothing whatever, because the
  tap handler had no branch for `player` and the press fell through to the
  ground behind them. The test slices the sheet section out of the window and
  PRESSES it, which is the standing rule about testing through the window's
  own interface: that every food can be eaten, that every equippable word can
  be worn, that a two-handed weapon lowers the shield first and does it in two
  inputs, that every node type in the world answers a tap, that the deeds
  which happen at a place are reachable from that place, and that the anvil
  offers exactly what the engine smiths and not what the furnace smelts
- `site.test.mjs`, that the hiscores board's ranking and its label agree
- `site.content.test.mjs`, the FACTS in the site's prose against the engine,
  and that every page the router offers loads only assets that are on disk
- `prose.test.mjs`, the two rules nothing was enforcing: that
  `spec-conformance.mjs` passes (it was never run by anything, which is how
  fifteen divergences sat in the report unactioned), and that no long dash
  survives anywhere this project writes. It checked the character and the `\u`
  escape, and there is a third spelling: the HTML entity, which had got five of
  them past it. Found by looking, which is not how a rule stays kept
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
