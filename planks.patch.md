# `planks` do not stack — the engine changes

Four edits to `engine.js`. Line numbers are against release 0.99.0.

---

## 1. `addItem` must honour `STACKABLE` at every quantity

`addItem` consulted `STACKABLE` only to decide whether to *merge into an
existing* stack. The placement path wrote `{ item, qty }` into a single slot
regardless, so any non-stackable added in bulk silently stacked. Five call
sites did exactly that, and one of them (`dismantle_market`) returned
thirty-two planks in one slot — a pack cap that a build-and-unbuild loop
could walk straight through.

Non-stackable now means one unit per slot, everywhere, and the add is
atomic: it takes the room it needs or it takes nothing.

```diff
+// A non-stackable item occupies ONE SLOT PER UNIT at every quantity. This
+// used to be true only of `qty === 1`: the placement path wrote `{item, qty}`
+// into a single slot without consulting STACKABLE, so `addItem(inv, 'planks',
+// 32)` stacked a thing this world had decided does not stack. The set is the
+// rule; nothing may route around it by passing a bigger number.
+//
+// Atomic, as before: fully added or nothing added, never partial.
 function addItem(inv, item, qty = 1) {
   if (STACKABLE.has(item)) {
     const i = inv.findIndex(sl => sl?.item === item);
     if (i !== -1) { inv[i].qty = (inv[i].qty ?? 1) + qty; return true; }
+    const slot = firstFreeSlot(inv);
+    if (slot === -1) return false;
+    inv[slot] = { item, qty };
+    return true;
   }
-  const slot = firstFreeSlot(inv);
-  if (slot === -1) return false;
-  inv[slot] = { item, qty };
-  return true;
+  const free = [];
+  for (let i = 0; i < inv.length && free.length < qty; i++) if (!inv[i]) free.push(i);
+  if (free.length < qty) return false;
+  for (const i of free) inv[i] = { item, qty: 1 };
+  return true;
 }
```

## 2. `canAddItem` must be askable about a quantity

```diff
 function canAddItem(inv, item) {
   if (STACKABLE.has(item) && inv.some(sl => sl?.item === item)) return true;
   return firstFreeSlot(inv) !== -1;
 }
+
+// The gate and the resolver must ask the same question. `saw` asked whether
+// ONE plank would fit and then added SAW_YIELD of them.
+function canAddItems(inv, item, qty = 1) {
+  if (qty <= 1) return canAddItem(inv, item);
+  if (STACKABLE.has(item) && inv.some(sl => sl?.item === item)) return true;
+  let free = 0;
+  for (const sl of inv) if (!sl) free++;
+  return free >= qty;
+}
```

## 3. `saw` — the gate asked about one plank and delivered two

Both the validator (9134) and the resolver (14542) must ask for `SAW_YIELD`.

```diff
-      return countLogs(p.inventory) >= SAW_LOGS && canAddItem(p.inventory, 'planks');
+      return countLogs(p.inventory) >= SAW_LOGS && canAddItems(p.inventory, 'planks', SAW_YIELD);
```

```diff
       if (hasAdjacentNode(s, _ctx, p, 'sawpit') && countLogs(p.inventory) >= SAW_LOGS
-          && canAddItem(p.inventory, 'planks')) {
+          && canAddItems(p.inventory, 'planks', SAW_YIELD)) {
```

## 4. The stall's recipe, and the refund that cannot fit

`MARKET_PLANKS = 32` was chosen when planks were believed to stack. They do
not, so the recipe asked for forty slots against a pack of twelve.

```diff
-const MARKET_PLANKS = 32, MARKET_ORE = 8;
+const MARKET_PLANKS = 10, MARKET_ORE = 2;
```

Ten and two is **exactly twelve slots**, which makes §6al's own sentence
literally true: it costs the whole pack and cannot be carried with anything
else. It stays dearer than the brewpot (`buildPlanks: 8, buildOre: 2`), which
preserves the ordering the old sixteen-logs-to-four recipe had. What it does
not preserve is the wood: five logs sawn, against sixteen felled. Restoring
that cost needs a `spanwork`-shaped incremental raise, not a bigger number —
a recipe payable in one trip is capped by the pack, and that is §5t's whole
argument for depth over bulk.

**`dismantle_market` now needs a spill.** With the fix above, refunding ten
planks and two ore into a pack that is not completely empty returns `false`
and the materials vanish. The stall is deleted either way.

```diff
         spillShelf(s, mk);
         if ((mk.coin ?? 0) > 0) p.gold = (p.gold ?? 0) + mk.coin;
-        addItem(p.inventory, 'planks', MARKET_PLANKS);
-        addItem(p.inventory, 'iron-ore', MARKET_ORE);
+        // §6al: the timber comes back, and what will not fit falls where the
+        // stall stood. A refund that silently destroys twelve slots of goods
+        // because the pack was half full is the worst of the three outcomes.
+        for (let i = 0; i < MARKET_PLANKS; i++)
+          if (!addItem(p.inventory, 'planks', 1)) dropAt(s, _ctx, p.x, p.y, 'planks', 1);
+        for (let i = 0; i < MARKET_ORE; i++)
+          if (!addItem(p.inventory, 'iron-ore', 1)) dropAt(s, _ctx, p.x, p.y, 'iron-ore', 1);
         deleteIndexedNode(s, _ctx, mid);
```

`dropAt` is a stand-in for whatever `spillShelf` already uses to put goods on
a tile — wire it to that, so a dismantled stall spills by exactly the rule its
own shelf does.

The same overflow exists at `13861` (brewpot, half the boards back) and
`13936` (`fire-arrows x 4`). Both need the same loop.
