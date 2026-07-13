// Interval worldgen: shared by every node of a world.
// The terrain is a pure function of genesis: any node, anywhere,
// grows the identical landscape from the founding record.
// v0.36 geography (spec 2b-2h): the river, the sea, the mountains.
import E from './engine.js'

// the river's course: pure, shared with every window that paints it
export function riverX(genesis, y) {
  const cx = Math.floor(genesis.worldW / 2)
  const h = E.sha256(Buffer.from(genesis.genesisSeed + ':river:' + y))[0]
  return cx + 22 + Math.round(Math.sin(y / 9) * 7) + (h % 3) - 1
}

export function buildWorld(genesis) {
  const w = E.newWorld(genesis)
  const W = genesis.worldW, H = genesis.worldH
  const trailY = Math.floor(H / 2)
  const cx = Math.floor(W / 2)
  const city = E.cityRectOf(genesis)
  const spawn = { x: cx, y: trailY }
  const taken = new Set()
  const put = (id, type, x, y) => { taken.add(x + ',' + y); E.addNode(w, id, type, x, y) }
  const hamlet = (tag, hx) => {
    put('bank-' + tag, 'bank', hx, trailY - 2)
    put('anvil-' + tag, 'anvil', hx, trailY + 2)
    put('hearth-' + tag, 'campfire', hx + (hx < cx ? 2 : -2), trailY - 1)
    put('house-' + tag + '1', 'house', hx - 2, trailY - 3)
    put('house-' + tag + '2', 'house', hx + 3, trailY - 3)
    put('house-' + tag + '3', 'house', hx - 2, trailY + 3)
  }
  hamlet('west', 6)
  hamlet('east', W - 10) // Eastmere: a coastal town now

  // ---- Anchor (spec 2d) ----
  let wi = 0
  for (let x = city.x0; x <= city.x1; x++) for (const y of [city.y0, city.y1]) {
    if (y === city.y1 && x >= cx - 1 && x <= cx + 1) continue
    put('wall-' + (wi++), 'wall', x, y)
  }
  for (let y = city.y0 + 1; y < city.y1; y++) for (const x of [city.x0, city.x1]) put('wall-' + (wi++), 'wall', x, y)
  put('guard-w', 'guard', cx - 2, city.y1 + 1)
  put('guard-e', 'guard', cx + 2, city.y1 + 1)
  put('sign-x', 'signpost', cx + 1, trailY - 1)
  for (const [x, y] of [[city.x0+2, city.y0+2], [city.x0+3, city.y0+2], [city.x0+4, city.y0+2],
                        [city.x0+2, city.y0+4], [city.x0+3, city.y0+4], [city.x0+4, city.y0+4],
                        [city.x0+2, city.y0+3]]) put('wall-' + (wi++), 'wall', x, y)
  put('anvil-city', 'anvil', city.x0 + 3, city.y0 + 3)
  put('smith-1', 'smith', city.x0 + 4, city.y0 + 3)
  put('bank-city', 'bank', city.x1 - 3, city.y0 + 2)
  put('house-c1', 'house', city.x0 + 3, city.y1 - 2)
  put('house-c2', 'house', city.x1 - 3, city.y1 - 2)
  put('house-c3', 'house', city.x1 - 6, city.y0 + 2)
  put('well-1', 'well', cx, city.y0 + 4)
  put('hearth-city', 'campfire', cx, city.y1 - 2)

  // ---- Stillwater and Milbrook, scaled south ----
  const lakeC = { x: cx - 10, y: H - 16 }
  for (let dx = -6; dx <= 6; dx++) for (let dy = -4; dy <= 4; dy++) {
    const x = lakeC.x + dx, y = lakeC.y + dy
    const rr = (dx * dx) / 36 + (dy * dy) / 16
    const wob = (E.sha256(Buffer.from(genesis.genesisSeed + ':lake:' + x + ':' + y))[0] % 100) / 100
    if (rr < 0.75 + wob * 0.3) put('lake-' + x + '-' + y, 'fishing-spot', x, y)
  }
  put('store-1', 'store', lakeC.x + 9, lakeC.y - 4)
  put('keeper-1', 'smith', lakeC.x + 10, lakeC.y - 4)
  put('bank-still', 'bank', lakeC.x + 9, lakeC.y - 7)
  put('hearth-still', 'campfire', lakeC.x + 7, lakeC.y - 6)
  put('house-s1', 'house', lakeC.x + 12, lakeC.y - 6)
  put('house-s2', 'house', lakeC.x + 12, lakeC.y - 3)
  put('sign-south', 'signpost', cx + 1, lakeC.y - 6)
  const mb = { x: W - 22, y: H - 14 }
  put('bank-mil', 'bank', mb.x, mb.y)
  put('anvil-mil', 'anvil', mb.x + 3, mb.y)
  put('well-mil', 'well', mb.x + 1, mb.y + 3)
  put('hearth-mil', 'campfire', mb.x - 2, mb.y + 2)
  put('house-m1', 'house', mb.x - 3, mb.y - 2)
  put('house-m2', 'house', mb.x + 4, mb.y - 2)
  put('house-m3', 'house', mb.x - 3, mb.y + 4)
  put('house-m4', 'house', mb.x + 4, mb.y + 4)

  // ---- the river (spec 2h): mountains to lake, bridged by roads ----
  const onRoadAt = (x, y) => Math.abs(y - trailY) <= 1
    || (Math.abs(x - cx) <= 1 && y > city.y1 && y < lakeC.y - 4)
  for (let y = 6; y <= lakeC.y - 4; y++) {
    for (const rx of [riverX(genesis, y), riverX(genesis, y) + 1]) {
      if (onRoadAt(rx, y)) continue // the bridge: the road wins
      if (!taken.has(rx + ',' + y)) put('river-' + rx + '-' + y, 'fishing-spot', rx, y)
    }
  }
  // ---- the sea (spec 2h): the east is open water ----
  for (let y = 1; y < H - 1; y++) for (const sx of [W - 3, W - 2]) {
    if (!taken.has(sx + ',' + y)) put('sea-' + sx + '-' + y, 'fishing-spot', sx, y)
  }

  // ---- plots (spec 6o) ----
  const plotsAt = (tag, px2, py2) => { for (let i = 0; i < 3; i++) put('plot-' + tag + i, 'plot', px2 + i, py2) }
  plotsAt('west', 4, trailY + 4)
  plotsAt('east', W - 14, trailY + 4)
  plotsAt('mil', mb.x - 4, mb.y - 5)
  plotsAt('anchor', cx + 4, city.y1 + 3)
  plotsAt('still', lakeC.x + 8, lakeC.y - 9)

  put('fire-way1', 'campfire', Math.floor(W / 3), trailY - 1)
  put('fire-way2', 'campfire', Math.floor(2 * W / 3), trailY + 1)
  put('fire-way3', 'campfire', cx - 1, Math.floor((trailY + lakeC.y) / 2))
  for (const [i, [x, y]] of [[0, [12, trailY + 5]], [1, [13, trailY + 5]], [2, [12, trailY + 6]]])
    put('fish-w' + i, 'fishing-spot', x, y)

  // ---- regions ----
  const inMountains = (x, y) => y <= 8 && (x < city.x0 - 2 || x > city.x1 + 2)
  const inHighlands = (x, y) => x >= W - 46 && y <= 26
  const inCave = (x, y) => x >= W - 30 && x <= W - 10 && y >= 5 && y <= 16
  const inForest = (x, y) => x <= 50 && y >= H - 30
  const nearLake = (x, y) => Math.abs(x - lakeC.x) <= 12 && Math.abs(y - lakeC.y) <= 9
  const nearMilbrook = (x, y) => Math.abs(x - mb.x) <= 8 && Math.abs(y - mb.y) <= 7
  const isEdge = (x, y) => x <= 0 || y <= 0 || x >= W - 1 || y >= H - 1
  const nearRiver = (x, y) => Math.abs(x - riverX(genesis, y)) <= 2 && y >= 6 && y <= lakeC.y - 4
  const inSea = (x, y) => x >= W - 4
  const inCityArea = (x, y) => x >= city.x0 - 1 && x <= city.x1 + 1 && y >= city.y0 - 1 && y <= city.y1 + 2
  const inHamlet = (x, y) => (x <= 14 || x >= W - 16) && Math.abs(y - trailY) <= 4
  const nearSpawn = (x, y) => Math.max(Math.abs(x - spawn.x), Math.abs(y - spawn.y)) <= 1
  const clearOf = (x, y) => !taken.has(x + ',' + y) && !isEdge(x, y) && !onRoadAt(x, y)
    && !inCityArea(x, y) && !inHamlet(x, y) && !nearSpawn(x, y) && !nearMilbrook(x, y)
    && !nearRiver(x, y) && !inSea(x, y)

  const place = (kind, count, ok, addFn) => {
    let placed = 0, i = 0
    while (placed < count && i < count * 120) {
      const h = E.sha256(Buffer.from(genesis.genesisSeed + ':' + kind + ':' + i))
      const x = (h[0] * 256 + h[1]) % W, y = (h[2] * 256 + h[3]) % H
      i++
      if (!clearOf(x, y) || !ok(x, y)) continue
      taken.add(x + ',' + y); addFn(kind + '-' + placed, x, y); placed++
    }
  }
  place('tree', 90, (x, y) => !inHighlands(x, y) && !inMountains(x, y) && !nearLake(x, y), (id, x, y) => E.addNode(w, id, 'tree', x, y))
  place('foresttree', 80, (x, y) => inForest(x, y), (id, x, y) => E.addNode(w, id, 'tree', x, y))
  place('rock', 18, (x, y) => !inHighlands(x, y) && !inMountains(x, y) && !inForest(x, y) && !nearLake(x, y), (id, x, y) => E.addNode(w, id, 'rock', x, y))
  place('highrock', 30, (x, y) => inHighlands(x, y) && !inCave(x, y), (id, x, y) => E.addNode(w, id, 'rock', x, y))
  place('mtnrock', 24, (x, y) => inMountains(x, y), (id, x, y) => E.addNode(w, id, 'rock', x, y))
  place('magicrock', 7, (x, y) => inHighlands(x, y) && !inCave(x, y), (id, x, y) => E.addNode(w, id, 'magic-rock', x, y))
  place('mtnmagic', 5, (x, y) => inMountains(x, y), (id, x, y) => E.addNode(w, id, 'magic-rock', x, y))
  place('gob', 34, (x, y) => x > 20 && x < W - 40 && !nearLake(x, y) && !inForest(x, y) && !inMountains(x, y), (id, x, y) => E.addMob(w, id, 'goblin', x, y))
  place('wolf', 16, (x, y) => (y <= 10 || y >= H - 9 || x <= 10) && !inHighlands(x, y) && !nearLake(x, y) && !nearMilbrook(x, y) && !inMountains(x, y), (id, x, y) => E.addMob(w, id, 'wolf', x, y))
  place('troll', 7, (x, y) => inCave(x, y), (id, x, y) => E.addMob(w, id, 'troll', x, y))
  place('bear', 7, (x, y) => inForest(x, y), (id, x, y) => E.addMob(w, id, 'bear', x, y))
  return w
}
