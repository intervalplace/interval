// Interval worldgen: shared by every node of a world.
// The terrain is a pure function of genesis: any node, anywhere,
// grows the identical landscape from the founding record.
// v0.27 geography (spec 2b, 2d): Westhearth, Eastmere, and the city of Anchor.
import E from './engine.js'

export function buildWorld(genesis) {
  const w = E.newWorld(genesis)
  const W = genesis.worldW, H = genesis.worldH
  const trailY = Math.floor(H / 2)
  const cx = Math.floor(W / 2)
  const city = E.cityRectOf(genesis)
  const spawn = { x: cx, y: trailY }
  const taken = new Set()
  const put = (id, type, x, y) => { taken.add(x + ',' + y); E.addNode(w, id, type, x, y) }

  // ---- the hamlets ----
  put('bank-west', 'bank', 5, trailY - 2)
  put('anvil-west', 'anvil', 5, trailY + 2)
  put('hearth-west', 'campfire', 7, trailY - 1)
  put('house-w1', 'house', 3, trailY - 3)
  put('house-w2', 'house', 8, trailY - 3)
  put('house-w3', 'house', 3, trailY + 3)
  put('bank-east', 'bank', W - 6, trailY - 2)
  put('anvil-east', 'anvil', W - 6, trailY + 2)
  put('hearth-east', 'campfire', W - 8, trailY - 1)
  put('house-e1', 'house', W - 4, trailY - 3)
  put('house-e2', 'house', W - 9, trailY - 3)
  put('house-e3', 'house', W - 4, trailY + 3)

  // ---- the city of Anchor (spec 2d) ----
  let wi = 0
  for (let x = city.x0; x <= city.x1; x++) for (const y of [city.y0, city.y1]) {
    if (y === city.y1 && x >= cx - 1 && x <= cx + 1) continue // the gate
    put('wall-' + (wi++), 'wall', x, y)
  }
  for (let y = city.y0 + 1; y < city.y1; y++) for (const x of [city.x0, city.x1]) {
    put('wall-' + (wi++), 'wall', x, y)
  }
  put('guard-w', 'guard', cx - 2, city.y1 + 1)
  put('guard-e', 'guard', cx + 2, city.y1 + 1)
  put('sign-x', 'signpost', cx + 1, trailY - 1)
  // the smithy: a walled workshop, open to the east
  for (const [x, y] of [[city.x0+2, 4], [city.x0+3, 4], [city.x0+4, 4],
                        [city.x0+2, 6], [city.x0+3, 6], [city.x0+4, 6],
                        [city.x0+2, 5]]) put('wall-' + (wi++), 'wall', x, y)
  put('anvil-city', 'anvil', city.x0 + 3, 5)
  put('smith-1', 'smith', city.x0 + 4, 5)
  put('bank-city', 'bank', city.x1 - 3, 4)
  put('house-c1', 'house', city.x0 + 3, 8)
  put('house-c2', 'house', city.x1 - 3, 8)
  put('house-c3', 'house', city.x1 - 6, 4)
  put('well-1', 'well', cx, 6)
  put('hearth-city', 'campfire', cx, 8)

  const isEdge = (x, y) => x === 0 || y === 0 || x === W - 1 || y === H - 1
  const onTrail = (x, y) => Math.abs(y - trailY) <= 1
  const onNorthRoad = (x, y) => Math.abs(x - cx) <= 1 && y > city.y1 && y < trailY
  const inCityArea = (x, y) => x >= city.x0 - 1 && x <= city.x1 + 1 && y >= city.y0 - 1 && y <= city.y1 + 2
  const inHamlet = (x, y) => (x <= 10 || x >= W - 11) && Math.abs(y - trailY) <= 4
  const nearSpawn = (x, y) => Math.max(Math.abs(x - spawn.x), Math.abs(y - spawn.y)) <= 1

  const place = (kind, count, ok, addFn) => {
    let placed = 0, i = 0
    while (placed < count && i < count * 80) {
      const h = E.sha256(Buffer.from(genesis.genesisSeed + ':' + kind + ':' + i))
      const x = h[0] % W, y = h[1] % H, k = x + ',' + y
      i++
      if (taken.has(k) || isEdge(x, y) || onTrail(x, y) || onNorthRoad(x, y)
        || inCityArea(x, y) || inHamlet(x, y) || nearSpawn(x, y) || !ok(x, y)) continue
      taken.add(k); addFn(kind + '-' + placed, x, y); placed++
    }
  }
  place('tree', 40, () => true, (id, x, y) => E.addNode(w, id, 'tree', x, y))
  place('rock', 16, (x, y) => y > trailY || x < cx - 12 || x > cx + 12, (id, x, y) => E.addNode(w, id, 'rock', x, y))
  place('fish', 0, () => true, () => {})
  const waters = [
    [10, trailY + 4], [11, trailY + 4], [10, trailY + 5],
    [W - 11, trailY - 5], [W - 12, trailY - 5], [W - 11, trailY - 4], [W - 12, trailY - 4],
  ]
  waters.forEach(([x, y], i) => put('fish-' + i, 'fishing-spot', x, y))
  put('fire-way1', 'campfire', Math.floor(W / 3), trailY - 1)
  put('fire-way2', 'campfire', Math.floor(2 * W / 3), trailY + 1)
  place('gob', 14, (x) => x > 13 && x < W - 14, (id, x, y) => E.addMob(w, id, 'goblin', x, y))
  place('wolf', 7, (x, y) => y <= 4 || y >= H - 5, (id, x, y) => E.addMob(w, id, 'wolf', x, y))
  return w
}
