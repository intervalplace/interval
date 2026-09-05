// Interval executor: THE MOURNER.
//
// A script is a citizen (README), and the thing a script is best at is
// waiting. Every trade in this world converts TIME into levels, which is to
// say every trade is a thing an executor wins by not sleeping -- except one.
//
// §5v: mourning converts WEALTH, and the goods are gone. You cannot out-wait
// it. And the decay is per KIND and per citizen -- worth x HEAD / (HEAD +
// given), settling after TAIL -- so you cannot farm one cheap thing forever
// either. The only way up is to give up DIFFERENT things, which means making
// or buying different things, which means the whole economy.
//
// So this file is not a gather loop with an ossuary on the end of it. It is a
// small planner with three parts:
//
//   the LEDGER   what each kind is worth to give, right now, read off the
//                world's own `p.offered` tally
//   the WORKS    which errand to run next, ranked by worth-per-interval of
//                the kind it produces, filtered by what the ceiling allows
//   the ROAD     getting there, and the pilgrimage to the ossuary
//
// And it ends where a script cannot follow. §5x: reaching MASTERY makes a
// citizen ELIGIBLE; what ADMITS them is having raised somebody else to their
// own swearing. `isProven(p)` is `raised >= 1`. This executor's last
// instruction is therefore not an instruction -- it is an offer to teach,
// held open until a person takes it.

import E from './engine.js'

// ---------------------------------------------------------------------------
// what the constitution will and will not tell us
// ---------------------------------------------------------------------------
//
// PRICES, SWORN, SWEAR_LEVEL, MASTERY, xpCeiling, masterOf and gradeOf are all
// exported, so nothing below copies a number that the engine would answer for.
//
// OFFER_HEAD, OFFER_TAIL and OFFER_XP_PER_COIN are NOT exported -- an executor
// cannot ask what an offering is worth. Rather than paste three constants out
// of engine.js and quietly go stale the day they are tuned, the ledger below
// CALIBRATES: the first gift of a fresh kind is paid at full rate, which names
// XP_PER_COIN outright, and the second names HEAD. Until then it runs on a
// prior and says so. A number the world would not hand over is a number worth
// measuring rather than assuming.
const PRIOR = { perCoin: 4, head: 4, tail: 12 }

const PRICES = E.PRICES
const priced = (item) => (PRICES[item] ?? 0) > 0

// §5v: only priced things may be offered, and that is the rule rather than a
// gap -- a keeper's list is what the world can put a number on.
const OFFERABLE = Object.keys(PRICES).filter((k) => PRICES[k] > 0)

// The tools of the trades a mourner funds themselves with, plus the two things
// the vault itself refuses (§6w the bow, §6ax the hood). Never given, whatever
// the arithmetic says: an axe offered is an axe that stops paying for the next
// four hundred offerings.
const KEEP = new Set([
  'iron-hatchet', 'steel-hatchet', 'star-hatchet', 'great-hatchet',
  'iron-pickaxe', 'steel-pickaxe', 'star-pickaxe', 'great-pickaxe',
  'rod', 'oak-rod', 'ironbark-rod', 'heartwood-rod',
  'dragonbow', 'hood',
])

// ---------------------------------------------------------------------------
// the WORKS: every errand a mourner may run, and what it makes
// ---------------------------------------------------------------------------
//
// Read from NODE_YIELD/NODE_GATE would be better, but neither is exported, so
// this is the one table here that mirrors the engine. It is checked against the
// engine at boot (`auditWorks` below) by looking for the node types in the
// world and refusing to plan around a seam the founding does not have.
//
// The gates are worth reading as a list, because they are the shape of the
// whole calling. A SWORN MOURNER IS CAPPED AT CAP_OTHER (70) IN EVERY OTHER
// TRADE. So:
//
//     reachable        tree 0, iron-rock 0, fishing-spot 0, oak 20, coal 20,
//                      eel 20, muck-heap 25, ironbark 45, brimstone-vent 70
//     shut forever     heartwood 78, deep-fish 78, magic-rock 78, gold 85,
//                      and every doubled Wilds place at 92
//
// The ceiling lands EXACTLY on the vent. Brimstone at 46 coins is the deepest
// thing a mourner may ever pull out of the ground with their own hands, and
// everything dearer than it has to be bought from somebody else. That is not a
// coincidence I can prove, but it is the trade's own argument in numbers.
const WORKS = [
  { node: 'brimstone-vent', item: 'brimstone', skill: 'earthcraft', gate: 70, tool: 'pickaxe' },
  { node: 'muck-heap', item: 'saltpetre', skill: 'hearthcraft', gate: 25, tool: null },
  { node: 'coal-rock', item: 'coal', skill: 'earthcraft', gate: 20, tool: 'pickaxe' },
  { node: 'ironbark-tree', item: 'ironbark', skill: 'woodcraft', gate: 45, tool: 'hatchet' },
  { node: 'eel-spot', item: 'eel', skill: 'shorecraft', gate: 20, tool: 'rod' },
  { node: 'oak-tree', item: 'oak-logs', skill: 'woodcraft', gate: 20, tool: 'hatchet' },
  { node: 'iron-rock', item: 'iron-ore', skill: 'earthcraft', gate: 0, tool: 'pickaxe' },
  { node: 'fishing-spot', item: 'raw-fish', skill: 'shorecraft', gate: 0, tool: 'rod' },
  { node: 'tree', item: 'logs', skill: 'woodcraft', gate: 0, tool: 'hatchet' },
]

// The kitchen: one input becomes a DIFFERENT KIND, and a different kind has a
// fresh head. This is the whole reason a mourner cooks. A raw fish given is 3
// coins; cooked it is 6, and it is a kind the ledger has never seen, so the
// first twelve of them pay at the head rate all over again. Turning a thing
// into another thing is worth more to this trade than gathering twice.
const KITCHEN = [
  { from: 'raw-fish', to: 'cooked-fish', verb: 'cook', at: null },
  { from: 'eel', to: 'cooked-eel', verb: 'cook', at: null },
  { from: 'grain', to: 'flour', verb: 'grind', at: 'mill' },
  { from: 'logs', to: 'planks', verb: 'saw', at: 'sawpit' },
]

const TOOL_FOR = {
  hatchet: ['great-hatchet', 'star-hatchet', 'steel-hatchet', 'iron-hatchet'],
  pickaxe: ['great-pickaxe', 'star-pickaxe', 'steel-pickaxe', 'iron-pickaxe'],
  rod: ['heartwood-rod', 'ironbark-rod', 'oak-rod', 'rod'],
}
const STALL_FOR = { hatchet: ['lumber', 'iron-hatchet', 20], pickaxe: ['delve', 'iron-pickaxe', 20], rod: ['fisher', 'rod', 20] }

const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
const adjacent = (a, b) => dist(a, b) === 1

export class Mourner {
  constructor(client, { name = null, say = () => {} } = {}) {
    this.c = client
    this.name = name
    this.say = say
    this.cal = { ...PRIOR, num: 1, den: 1, sure: false }
    this.seen = { mourning: 0 }
    this.lastOffer = null            // { kind, given, xpBefore } — the calibration probe
    this.obs = []                    // what the ledger actually paid, per gift
    this.errand = null
    this.phase = 'enter'
    this.gifts = 0
    this.spent = 0                   // coins of goods destroyed
    this.taught = new Set()
    this.notes = []
  }

  // -- the LEDGER -----------------------------------------------------------

  given(kind) { return this.c.me?.offered?.[kind] ?? 0 }

  /** what one more of this kind teaches, right now */
  worth(kind) {
    const price = PRICES[kind] ?? 0
    if (!price) return 0
    const { perCoin, head, tail, num = 1, den = 1 } = this.cal
    const n = Math.min(this.given(kind), tail)
    return Math.floor(Math.floor(price * perCoin * head / (head + n)) * num / den)
  }

  /** the head still unspent on a kind: what the next TAIL gifts are worth in total */
  head(kind) {
    const { tail } = this.cal
    let sum = 0
    const g0 = this.given(kind)
    for (let n = g0; n < g0 + tail; n++) {
      const { perCoin, head } = this.cal
      sum += Math.floor((PRICES[kind] ?? 0) * perCoin * head / (head + Math.min(n, tail)))
    }
    return sum
  }

  /**
   * Calibrate from what actually happened. The first gift of a kind the world
   * has never had from us is paid at the full rate, so it names perCoin
   * exactly; the second names head. Nothing here is believed until the world
   * has been observed paying it.
   */
  calibrate(p) {
    const now = p.skills.mourning
    const probe = this.lastOffer
    this.seen.mourning = now
    if (!probe) return
    this.lastOffer = null
    const gained = now - probe.xpBefore
    if (gained <= 0) return          // refused, or the ceiling ate it
    this.obs.push({ price: PRICES[probe.kind], given: probe.given, gained })
    if (this.obs.length > 400) this.obs.shift()

    // perCoin comes free from any FIRST gift, where the head factor is 1 --
    // but only from a kind dear enough that the floor cannot swallow the
    // signal. An arrow is one coin, so `floor(1 * perCoin * h/(h+n))` is a
    // handful of small integers and every candidate curve explains it equally.
    // The first cut of this file calibrated off arrows and concluded the head
    // was 3.
    for (let i = this.obs.length - 1; i >= 0; i--) {
      const o = this.obs[i]
      if (o.given !== 0 || o.price < 5) continue
      const perCoin = o.gained / o.price
      if (Number.isInteger(perCoin) && perCoin > 0 && !this.cal.perCoinSure) {
        this.cal.perCoin = perCoin; this.cal.perCoinSure = true
        this.note(`the ledger pays ${perCoin} a coin of loss`)
      }
      break                            // the LATEST word, not every past one
    }
    // head and tail by fit: the pair that explains every observation exactly.
    // Cheap (16 x 24 x |obs|), run on a schedule rather than every gift.
    //
    // AND A FIT IS ONLY BELIEVED WHERE IT IS UNIQUE. The first version took
    // the best-scoring pair and got head 1, tail 4 with zero error, because
    // every gift it had seen so far was a FIRST gift and at n = 0 every curve
    // in the family agrees. So: keep only the pairs that explain every
    // observation exactly, and adopt a parameter only when all of them concur
    // about it. head is identified early, once anything has been given twice;
    // tail not until something has been given past the settling point. Until
    // then the prior stands, and the executor knows it is guessing.
    const useful = this.obs.filter((o) => o.price >= 3)
    if (useful.length < 4 || this.gifts % 8) return
    //
    // THE FAMILY HAS A THIRD DIMENSION, and running this is how I found it.
    // Post-swearing the fit failed outright -- no head and tail explained the
    // ledger at all -- because §5q's own-calling rate rides on top: `awardXp`
    // tags an offering 'mourner', so a sworn mourner's gift is
    // floor(floor(worth x HEAD/(HEAD+n)) x 3/2), TWO floors and not one. A
    // single perCoin of 6 cannot express that; the roundings do not commute.
    // (Which also settles a question the §5q note leaves open: it says the
    // sibling rate applies "only where the merge created siblings", and
    // mourning has one calling -- but the multiplier is on the CALLING TAG,
    // and mourning gets it.)
    const RATES = [[1, 1], [3, 2], [1, 2]]
    const fits = []
    for (let head = 1; head <= 16; head++) {
      for (let tail = 4; tail <= 28; tail++) {
        for (const [num, den] of RATES) {
          let ok = true
          for (const o of useful) {
            const base = Math.floor(o.price * this.cal.perCoin * head / (head + Math.min(o.given, tail)))
            if (Math.floor(base * num / den) !== o.gained) { ok = false; break }
          }
          if (ok) fits.push({ head, tail, num, den })
        }
      }
    }
    if (!fits.length) { if (!this._noFit) { this._noFit = true; this.note('no curve in the family explains the ledger — staying on the prior') } return }
    const heads = [...new Set(fits.map((f) => f.head))]
    const tails = [...new Set(fits.map((f) => f.tail))]
    if (heads.length === 1) {
      const was = this.cal.head, confirmed = this.cal.sure
      this.cal.head = heads[0]; this.cal.sure = true
      if (!confirmed) this.note(was === heads[0]
        ? `the head is ${heads[0]} — the prior held, and now it is measured`
        : `the head is ${heads[0]}, not the ${was} I assumed`)
    }
    const rates = [...new Set(fits.map((f) => f.num + '/' + f.den))]
    if (rates.length === 1 && this.cal.num + '/' + this.cal.den !== rates[0]) {
      const [num, den] = rates[0].split('/').map(Number)
      this.cal.num = num; this.cal.den = den
      if (num !== 1 || den !== 1) this.note(`and my own calling's work pays ${num}/${den} on top of it (§5q)`)
    }
    if (tails.length === 1 && !this.cal.tailSure) {
      const was = this.cal.tail
      this.cal.tail = tails[0]; this.cal.tailSure = true
      this.note(was === tails[0]
        ? `the rate settles after ${tails[0]} of a kind, as assumed`
        : `the rate settles after ${tails[0]}, not ${was}`)
    }
  }

  note(m) { this.notes.push(m); this.say('[ledger] ' + m) }

  // -- the pack -------------------------------------------------------------

  /** slots we are willing to give, best first */
  givable(p) {
    return p.inventory
      .map((sl, i) => (sl && priced(sl.item) && !KEEP.has(sl.item) ? { i, kind: sl.item, w: this.worth(sl.item) } : null))
      .filter(Boolean)
      .sort((a, b) => b.w - a.w)
  }

  hasTool(p, kind) {
    if (!kind) return true
    const want = TOOL_FOR[kind]
    if (p.equipment?.weapon && want.includes(p.equipment.weapon.item)) return true
    return p.inventory.some((sl) => sl && want.includes(sl.item))
  }

  toolSlot(p, kind) {
    const want = TOOL_FOR[kind]
    return p.inventory.findIndex((sl) => sl && want.includes(sl.item))
  }

  // -- the ROAD -------------------------------------------------------------

  /**
   * §5i: a journey is one deed. A straight leg goes out as a single `walk`, so
   * a two-hundred-tile pilgrimage costs one input rather than two hundred. BFS
   * handles the last, cluttered part -- greedy stepping oscillates around
   * walls, and this world is mostly walls.
   */
  road(s, p, goal, reach = true) {
    const g = s.genesis, W = g.worldW, H = g.worldH
    const blocked = new Set(Object.values(s.nodes).map((n) => n.x + ',' + n.y))
    const goals = new Set()
    if (reach) {
      for (const [mx, my] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const gx = goal.x + mx, gy = goal.y + my
        if (gx >= 0 && gx < W && gy >= 0 && gy < H && !blocked.has(gx + ',' + gy)) goals.add(gx + ',' + gy)
      }
    } else goals.add(goal.x + ',' + goal.y)
    if (goals.has(p.x + ',' + p.y)) return null

    // the long straight: if the whole leg along the dominant axis is open,
    // spend ONE deed on it
    const far = dist(p, goal)
    if (far > 8) {
      const dx = Math.sign(goal.x - p.x), dy = Math.sign(goal.y - p.y)
      for (const [ax, ay] of dx && Math.abs(goal.x - p.x) >= Math.abs(goal.y - p.y)
        ? [[dx, 0], [0, dy]] : [[0, dy], [dx, 0]]) {
        if (!ax && !ay) continue
        const span = ax ? Math.abs(goal.x - p.x) : Math.abs(goal.y - p.y)
        let n = 0
        while (n < span - 1 && n < 200) {
          const nx = p.x + ax * (n + 1), ny = p.y + ay * (n + 1)
          if (nx < 0 || nx >= W || ny < 0 || ny >= H || blocked.has(nx + ',' + ny)) break
          n++
        }
        if (n >= 6) return this.c.walk(ax, ay, n)
      }
    }

    const from = new Map([[p.x + ',' + p.y, null]])
    const q = [[p.x, p.y]]
    let found = null, guard = 0
    while (q.length && !found && guard++ < 60000) {
      const [cx, cy] = q.shift()
      for (const [mx, my] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + mx, ny = cy + my, k = nx + ',' + ny
        if (nx < 0 || nx >= W || ny < 0 || ny >= H || blocked.has(k) || from.has(k)) continue
        from.set(k, cx + ',' + cy)
        if (goals.has(k)) { found = k; break }
        q.push([nx, ny])
      }
    }
    if (!found) return null
    let cur = found, prev = from.get(cur)
    while (prev !== p.x + ',' + p.y && prev !== null) { cur = prev; prev = from.get(cur) }
    const [tx, ty] = cur.split(',').map(Number)
    return this.c.move(Math.sign(tx - p.x), Math.sign(ty - p.y))
  }

  nearest(s, p, type, pred = () => true) {
    let best = null
    for (const [id, n] of Object.entries(s.nodes)) {
      if (n.type !== type || !pred(n)) continue
      const d = dist(p, n)
      if (!best || d < best.d) best = { id, n, d }
    }
    return best
  }

  // -- the WORKS ------------------------------------------------------------

  /**
   * Rank the errands by worth-per-interval of what they make. A seam's `hard`
   * divides how often it pays, so a brimstone vent at 46 coins is not eight
   * times a coal rock at 12 -- and as a kind's head is spent its errand falls
   * down the list on its own, which is the rotation the trade is asking for
   * without a schedule anywhere in this file.
   */
  plan(s, p) {
    const lvl = (sk) => E.levelForXp(p.skills[sk])
    const options = []
    for (const w of WORKS) {
      if (lvl(w.skill) < w.gate) continue
      // §6ao: a founding MAY require the tool ("a world that omits `toolGated`
      // gathers as v1-v5 do"), so this asks the founding rather than assuming
      // the live island's answer. Assuming it cost this executor an afternoon
      // of standing at a stall buying an axe it did not need.
      if (s.genesis.toolGated && !this.hasTool(p, w.tool)) continue
      const seam = this.nearest(s, p, w.node, (n) => n.depletedUntil <= s.tick)
      if (!seam) continue
      // rough intervals per unit: the strike rate falls with hardness, and the
      // walk is amortised over a pack
      const hard = { 'brimstone-vent': 8, 'muck-heap': 4, 'coal-rock': 2, 'ironbark-tree': 2, 'eel-spot': 2 }[w.node] ?? 1
      const perUnit = hard * 3 + seam.d / 10
      options.push({ ...w, seam, score: this.worth(w.item) / perUnit })
    }
    return options.sort((a, b) => b.score - a.score)[0] ?? null
  }

  packFull(p) { return p.inventory.every((sl) => sl !== null) }
  packEmptyish(p) { return this.givable(p).length === 0 }

  // -- the loop -------------------------------------------------------------

  step(s) {
    const c = this.c
    const p = c.me
    if (!p) { this.phase = 'enter'; return this.cross(s) }
    this.calibrate(p)

    // §5a/v0.70: A NAME COSTS TIME. `claim_name` is refused below
    // NAME_STANDING, which is not exported, so this asks the world instead of
    // asserting: try, sparingly, and never block the trade on it. The first
    // version of this file returned `claimName` every interval and a nameless
    // newcomer therefore never did anything else, for ever.
    if (this.name && !p.name && E.standingOf(p) > 0
      && (this._triedName === undefined || s.tick - this._triedName > 120)) {
      this._triedName = s.tick
      return c.claimName(this.name)
    }

    const mourn = E.levelForXp(p.skills.mourning)

    // §5k: swearing takes no interval and interrupts nothing, so it is checked
    // before anything else and costs the errand nothing.
    if (p.calling === undefined && mourn >= E.SWEAR_LEVEL) {
      const master = this.attesterNear(s, p)
      this.say(master
        ? `swearing MOURNER, attested by ${c.displayName(master)}`
        : 'swearing MOURNER, unattested — there was nobody to vouch, and that is legal (§5w)')
      // §5q: swearing CHANGES THE RATE -- `awardXp` tags an offering
      // 'mourner', so once sworn the same gift teaches half again as much.
      // Every observation taken before this moment describes a different
      // curve, so the ledger starts again rather than averaging two worlds.
      this.obs = []; this.cal.sure = false; this.cal.tailSure = false; this._noFit = false
      return c.swear('mourner', master ?? undefined)
    }

    // §5x: a mastery is a line of people, not a number. Held open, not ground.
    if (p.calling === 'mourner' && p.skills.mourning >= this.masteryXp()) {
      const pupil = this.pupilNear(s, p)
      if (pupil) {
        this.taught.add(pupil)
        this.say(`offering to teach ${c.displayName(pupil)} — this is the one thing here I cannot do alone`)
        return c.teach(pupil)
      }
    }

    if (p.action) return              // mid-deed: the constitution is busy with us

    // the pilgrimage, and the giving
    const oss = this.nearest(s, p, 'ossuary')
    const load = this.givable(p)
    if (load.length && (this.packFull(p) || this.phase === 'give')) {
      if (!oss) return                // a world with no ossuary pays no mourner
      if (adjacent(p, oss.n)) {
        this.phase = 'give'
        const best = load[0]
        this.lastOffer = { kind: best.kind, given: this.given(best.kind), xpBefore: p.skills.mourning }
        this.gifts++
        this.spent += PRICES[best.kind]
        return c.offerAtOssuary(best.i)
      }
      this.phase = 'pilgrimage'
      return this.road(s, p, oss.n)
    }

    // nothing left worth giving: back to the works
    this.phase = 'work'
    if (!this.errand || !s.nodes[this.errand.seam.id]
      || s.nodes[this.errand.seam.id].depletedUntil > s.tick) this.errand = this.plan(s, p)
    const e = this.errand
    if (!e) return this.outfit(s, p)

    const seam = s.nodes[e.seam.id]
    if (!seam) { this.errand = null; return }
    if (!adjacent(p, seam)) return this.road(s, p, seam)

    // 6bd: the gate asks for the tool IN THE HAND, not in the pack
    if (e.tool && s.genesis.toolGated) {
      const want = TOOL_FOR[e.tool]
      if (!want.includes(p.equipment?.weapon?.item)) {
        const i = this.toolSlot(p, e.tool)
        if (i !== -1) return c.wield(i)
      }
    }
    return c.gather(e.seam.id)
  }

  /**
   * §0b/§0c: knock, wait the wait everyone waits, cross.
   *
   * This is `IntervalClient.enter` with ONE change, and the change is the
   * reason it is written out here instead of called: the SDK holds the vigil
   * at a literal 1000 and re-knocks past a literal 2000, while the engine
   * EXPORTS `VIGIL_TICKS`, and it is 300. So every executor written against
   * the SDK stands outside for eleven and a half minutes where the
   * constitution asks for five. It is not a rule broken -- 1000 is inside the
   * window, so the door opens either way -- but it is a number copied where a
   * query was available, which is exactly what the ceiling note warns against:
   * "a window wants to say 'you cannot pass seventy here' without knowing why,
   * so the rule is a query rather than a number to copy."
   *
   * ATTEND_WINDOW is not exported, so the staleness bound below IS a guess,
   * and is marked as one: ten vigils is comfortably inside the hour the buffer
   * actually keeps.
   */
  cross(s) {
    const c = this.c
    const key = c.identity.playerId.slice(0, 16)
    const e = Array.isArray(s.attend) ? s.attend.find((x) => x[1] === key) : null
    const age = e ? s.tick - e[0] : -1
    const vigil = E.VIGIL_TICKS ?? 1000
    if (age < 0 || age > vigil * 10) {
      if (this._knockedAt !== undefined && s.tick - this._knockedAt < 12) return null
      this._knockedAt = s.tick
      this.say('knocking')
      return c.attend()
    }
    if (age < vigil) {
      if (!this._waited) { this._waited = true; this.say(`waiting ${vigil} intervals, like everyone`) }
      return null
    }
    this.say('crossing')
    return c.spawn()
  }

  /** the newcomer's errand: one tool, bought with the coin they woke with */
  outfit(s, p) {
    if (!s.genesis.toolGated) return null
    for (const kind of ['hatchet', 'pickaxe', 'rod']) {
      if (this.hasTool(p, kind)) continue
      const [stall, item, price] = STALL_FOR[kind]
      if ((p.gold ?? 0) < price) continue
      const sl = this.nearest(s, p, 'stall', (n) => n.kind === stall)
      if (!sl) continue
      if (adjacent(p, sl.n)) { this.say(`buying a ${item}`); return this.c.buy(item) }
      return this.road(s, p, sl.n)
    }
    return null
  }

  masteryXp() {
    if (this._mx) return this._mx
    let lo = 0, hi = 1e9
    while (lo < hi) { const m = Math.floor((lo + hi) / 2); if (E.levelForXp(m) >= E.MASTERY) hi = m; else lo = m + 1 }
    return (this._mx = lo)
  }

  /** §5w: a master of OUR trade, standing here, whose apprenticeship is live */
  attesterNear(s, p) {
    for (const [pid, q] of Object.entries(s.players)) {
      if (pid === this.c.identity.playerId) continue
      if (E.SWORN[q.calling]?.skill !== 'mourning') continue
      if (!q.apprentices || q.apprentices[this.c.identity.playerId] === undefined) continue
      if (dist(p, q) > 1) continue
      return pid
    }
    return null
  }

  /** an unsworn citizen standing here, not already taken on */
  pupilNear(s, p) {
    for (const [pid, q] of Object.entries(s.players)) {
      if (pid === this.c.identity.playerId) continue
      if (q.calling !== undefined) continue
      if (this.taught.has(pid)) continue
      if (dist(p, q) > 1) continue
      return pid
    }
    return null
  }

  // -- the report -----------------------------------------------------------

  report() {
    const p = this.c.me
    if (!p) return 'not yet in the world'
    const xp = p.skills.mourning
    const lvl = E.levelForXp(xp)
    const grade = E.gradeOf?.(this.c.world, p) ?? '?'
    const kinds = Object.keys(p.offered ?? {}).length
    const target = p.calling === 'mourner' ? this.masteryXp() : 34046
    const left = Math.max(0, target - xp)
    const rate = this.gifts ? xp / this.gifts : 0
    const eta = rate ? Math.round(left / rate) : Infinity
    return [
      `tick ${this.c.tick}`,
      `${p.name ?? '—'} ${grade}${p.calling ? ' (' + p.calling + ')' : ''}`,
      `mourning ${lvl} (${xp})`,
      `${this.gifts} gifts of ${kinds} kinds`,
      `${this.spent} coins burned`,
      `${this.phase}`,
      Number.isFinite(eta) ? `~${eta} gifts to ${p.calling === 'mourner' ? 'mastery' : 'the swearing'}` : '',
    ].filter(Boolean).join(' · ')
  }
}

/** Wire a mourner to a client and let it run. Returns the controller. */
export function mourn(client, opts = {}) {
  const m = new Mourner(client, opts)
  client.onTick((s) => { try { m.step(s) } catch (e) { opts.say?.('[mourner] ' + e.message) } })
  return m
}

export default Mourner
