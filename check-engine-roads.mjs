// check-engine-roads.mjs — HOW LONG IS EACH ROAD, ACTUALLY?
//
// CALLINGS.md quotes one skill's rate ("a star axe on ironbark: 50 is ~2h, 70
// is ~22h, 100 is ~1,800h") and every estimate since has quietly applied that
// one number to all nine trades. It does not hold. Mourning is bone-bound and
// came in about three times slower when it was measured; nobody had measured
// the other eight at all.
//
// This does not model anything. It seats a citizen in a yard where every
// facility is adjacent, drives the canonical training loop for each trade
// through nextState with real signed inputs, and reads the skill back out.
// Travel is deliberately excluded: this measures the RATE, and geography is a
// separate multiplier that belongs in a separate number.
//
// The days columns use genesis.ceiling — a citizen may act for `allow`
// intervals in `window`, so a "day" here is 5,400 intervals and not 86,400.
// Every road below is quoted in the only unit that now matters, which is
// calendar time under closing time.
//
// NON-CONSENSUS: builds a throwaway world, touches no live state.
//
// Usage: node check-engine-roads.mjs [intervals-per-trade]

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let E; try { E = require('./engine.js') } catch (e) { console.log('  skip  ' + e.message); process.exit(0) }
const { rulesHash } = await import('./rules-hash.mjs')

const N = Number(process.argv[2]) || 1200
const WORLD = process.argv.includes('--world')
const RH = rulesHash(new URL('./', import.meta.url))
const G = E.makeGenesis('measuring-yard', RH, 0, 64, 64)
const ALLOW = G.ceiling?.allow ?? 5400          // acting intervals a citizen gets a day

// ---- the yard: one of everything, all within reach --------------------------
const SP = E.spawnOf(G)
function yard() {
  const w = E.newWorld(G)
  const at = (id, type, dx, dy) => { E.addNode(w, id, type, SP.x + dx, SP.y + dy); return w.nodes[id] }
  at('tree', 'tree', 1, 0)
  at('rock', 'iron-rock', -1, 0)
  at('spot', 'fishing-spot', 0, 1)
  at('oss', 'ossuary', 0, -1)
  at('dummy-post', 'dummy', 2, 0)
  at('butt-post', 'butt', -2, 0)
  at('anvil', 'anvil', 2, 1)
  at('hearth', 'hearth', -2, 1)
  // a four-plot cluster around (0,4): freePlotFor only sees ADJACENT plots, so
  // four is all one standing farmer can hold, and CROP_CAP (48) is what a
  // farmer who tours clusters is really limited by.
  at('plot-n', 'plot', 0, 3); at('plot-s', 'plot', 0, 5)
  at('plot-e', 'plot', 1, 4); at('plot-w', 'plot', -1, 4)
  return w
}

// ---- a node small enough to fit in a test ----------------------------------
class Yard {
  constructor() { this.state = yard(); this.pending = new Map() }
  submit(i) { if (!this.pending.has(i.playerId)) this.pending.set(i.playerId, i) }
  advance() {
    const ins = [...this.pending.values()]; this.pending.clear()
    this.state = E.nextState(this.state, ins, E.beaconValue(G.genesisSeed, this.state.tick))
  }
}

const ID = E.generateIdentity()
const me = () => yardNode.state.players[ID.playerId]
let yardNode

/** run a loop for `n` intervals at a given starting level; return xp/interval */
async function measure(label, skill, setup, loop, calling, atLevel = 1, n = N) {
  yardNode = new Yard()
  E.addPlayer(yardNode.state, ID.playerId, SP.x, SP.y)
  const p = me()
  setup(p, yardNode.state)
  // THE RATE IS NOT CONSTANT ALONG THE ROAD. `GATHER_BASE + floor(lvl/10) +
  // toolBonus` means a gatherer at seventy strikes more often than one at one,
  // so a days-to-mastery computed from the level-1 rate is wrong by whatever
  // the slope is worth. Seat the citizen at the level being measured.
  // ...and SWEAR THEM IN. Seating an unsworn citizen at level 70 does not
  // measure a level-70 rate: `gainXp` clamps to xpCeiling, CAP_UNSWORN is 50,
  // and the skill falls to 50 the first time it is touched -- which showed up
  // as a NEGATIVE xp rate the first time this was run. Anybody actually on the
  // road to mastery is sworn to that trade's calling, so measure them that way,
  // which also picks up §5q's own-calling rate where the award carries a tag.
  if (calling) p.calling = calling
  p.skills[skill] = E.XP_TABLE[atLevel] ?? 0
  const before = p.skills[skill] ?? 0
  let acted = 0, idle = 0
  for (let t = 0; t < n; t++) {
    const inp = loop(me(), yardNode.state)
    if (!inp && !me().action) idle++
    if (inp) {
      const full = await E.signInput({ ...inp, playerId: ID.playerId, tick: yardNode.state.tick,
        worldId: E.worldId(G) }, ID.privateKey)
      yardNode.submit(full); acted++
    }
    yardNode.advance()
  }
  const gained = (me().skills[skill] ?? 0) - before
  // AN IDLE INTERVAL IS NOT A SLOW INTERVAL.
  //
  // This is the fault that produced three wrong answers about combat. The
  // prowess loop stood a citizen in a camp of eight trolls and counted five
  // hundred intervals; trolls respawn in three hundred, so the camp emptied
  // and most of the run was a fighter with nothing in reach. The harness
  // divided experience by the whole run and reported 1.3 an interval, a third
  // of a gatherer. Measured against a beast that is actually there it is 5.8,
  // ABOVE a gatherer. Nothing was wrong with the engine; the yard ran dry and
  // the arithmetic counted the empty field as work.
  //
  // So starvation is now a RESULT and not a rate. A measurement taken while
  // the citizen had nothing to do is refused rather than reported low.
  return { label, skill, gained, rate: gained / n, acted, idle, starved: idle / n > 0.05 }
}

// ---- the loops --------------------------------------------------------------
const dropFull = (p) => p.inventory.every(s => s !== null) ? { type: 'drop', slot: 0 } : null
const gatherLoop = (id) => (p) => dropFull(p) ?? { type: 'gather', nodeId: id }

const tools = (p, ...items) => { let i = 0; for (const it of items) p.inventory[i++] = { item: it, qty: 1 } }

const ROADS = [
  { label: 'woodcraft — an axe on a tree', skill: 'woodcraft', calling: 'forester',
    setup: (p) => { tools(p, 'iron-hatchet'); p.equipment = { weapon: { item: 'iron-hatchet' } } },
    loop: gatherLoop('tree') },
  { label: 'earthcraft — a pick on iron', skill: 'earthcraft', calling: 'miner',
    setup: (p) => { tools(p, 'iron-pickaxe'); p.equipment = { weapon: { item: 'iron-pickaxe' } } },
    loop: gatherLoop('rock') },
  { label: 'shorecraft — a rod on a shoal', skill: 'shorecraft', calling: 'fisher',
    setup: (p) => { tools(p, 'rod'); p.equipment = { weapon: { item: 'rod' } } },
    loop: gatherLoop('spot') },
  { label: 'prowess — a steel sword, a live beast', skill: 'prowess', calling: 'fighter',
    // §7t: A DUMMY TEACHES THE FIRST RUNGS AND NOTHING AFTER -- `teachMelee`
    // pays nothing past YARD_CAP (20), because "levels come from things that
    // hit back". So the yard cannot measure this road; it has to be a real mob,
    // and the respawn between kills is part of the rate rather than overhead
    // to be excluded.
    setup: (p, s) => { tools(p, 'steel-sword'); p.equipment = { weapon: { item: 'steel-sword' } }
      p.hp = p.maxHp = E.maxHp(p)
      // STAND CLEAR OF THE YARD. All four tiles beside spawn hold nodes, and a
      // goblin seated on one of them never fought -- which is what the first
      // three attempts at this road were actually measuring.
      p.x = SP.x + 6; p.y = SP.y + 6
      // EIGHT, AND TROLLS. One goblin measures a respawn timer, not a road:
      // 5 hitpoints killed in three blows and then sixteen intervals of
      // nothing. A camp is what a fighter actually stands in, and trolls pay
      // roughly twice what goblins or wolves do because 20 hitpoints is 20
      // experience whatever it took to reach them.
      E.addMob(s, 'm0', 'troll', SP.x + 7, SP.y + 6) },
    // ONE goblin, not four. Four stacked on a tile out-damaged a level-1
    // citizen's 64 hitpoints inside the run, and a corpse trains nothing --
    // which is what the first measurement of this road was actually reporting.
    // The citizen is kept standing here; food is a real cost of this road and
    // is priced in the note rather than smuggled into the rate.
    // ONE BEAST, KEPT STANDING. Not because the world works that way, but
    // because this file measures the CEILING -- what a citizen can consume --
    // and the founded island supplies four times that within twelve tiles
    // (see --world), so combat out there is bound by the swing and not by
    // what is nearby. A camp that empties measures neither.
    loop: (p, s) => { p.hp = p.maxHp ?? p.hp
      const m = s.mobs?.m0
      if (m && m.hp <= 0) { m.hp = E.MOB_STATS.troll.maxHp; m.respawnAt = 0; m.x = p.x + 1; m.y = p.y }
      if (p.action) return null
      return s.mobs?.m0?.hp > 0 ? { type: 'attack', mobId: 'm0', style: 'even' } : null } },
  { label: 'marksmanship — a bow on the butt', skill: 'marksmanship', calling: 'archer',
    setup: (p, s) => { p.inventory[0] = { item: 'wooden-bow', qty: 1 }
      p.inventory[1] = { item: 'arrows', qty: 5000 }
      p.equipment = { weapon: { item: 'wooden-bow' } }
      E.addMob(s, 'bt', 'butt', SP.x - 2, SP.y) },
    loop: (p, s) => (!p.action && s.mobs?.bt) ? { type: 'attack', mobId: 'bt', style: 'even' } : null },
  { label: 'hearthcraft — four plots, standing', skill: 'hearthcraft', calling: 'farmer',
    setup: (p) => { p.x = SP.x; p.y = SP.y + 4; p.inventory[0] = { item: 'seeds', qty: 200 } },
    // `plant` sows, `harvest` reaps 720 intervals later, and THE SEED COMES
    // BACK -- so this road is not seed-bound at all. It is bound by
    // GROW_TICKS_RIPE and by how many plots a farmer can stand beside.
    loop: (p, s) => {
      for (const id of ['plot-n', 'plot-s', 'plot-e', 'plot-w']) {
        const sown = p.crops?.[id] ?? 0
        if (sown > 0 && (s.tick - sown) >= 720) return { type: 'harvest', nodeId: id }
      }
      const seed = p.inventory.findIndex(x => x?.item === 'seeds')
      const free = ['plot-n', 'plot-s', 'plot-e', 'plot-w'].some(id => !(p.crops?.[id] > 0))
      return (seed !== -1 && free) ? { type: 'plant', slot: seed } : null } },

  { label: 'sorcery — unmaking, pack kept full', skill: 'sorcery', calling: 'alchemist',
    setup: (p) => { for (let i = 0; i < p.inventory.length; i++) p.inventory[i] = { item: 'logs', qty: 1 } },
    // Like mourning, this measures the CEILING: the things being unmade are
    // free here. Sorcery is input-bound and the input has to be gathered.
    loop: (p) => { let i = p.inventory.findIndex(x => x?.item === 'logs')
      if (i === -1) { for (let k = 0; k < p.inventory.length; k++) p.inventory[k] = { item: 'logs', qty: 1 }; i = 0 }
      return { type: 'alch', slot: i } } },

  { label: 'mourning — bones on consecrated ground', skill: 'mourning', calling: 'mourner',
    setup: (p) => { for (let i = 0; i < p.inventory.length; i++) p.inventory[i] = { item: 'bones', qty: 1 } },
    loop: (p) => { let i = p.inventory.findIndex(s => s?.item === 'bones')
      // bones are FREE here on purpose: this measures the ceiling of the bury
      // road, and the hunting that supplies it is priced separately below.
      if (i === -1) { for (let k = 0; k < p.inventory.length; k++) p.inventory[k] = { item: 'bones', qty: 1 }; i = 0 }
      return { type: 'bury', slot: i } } },
]

// ---- report -----------------------------------------------------------------
const T = E.XP_TABLE
const days = (xp, rate) => rate > 0 ? xp / rate / ALLOW : Infinity
const fmt = (d) => !Number.isFinite(d) ? '   —' : d < 10 ? d.toFixed(1) : String(Math.round(d))

console.log('measuring yard — ' + N + ' intervals a trade, every facility adjacent, travel excluded')
console.log('')
console.log('THESE ARE YARD RATES: the ceiling a citizen can CONSUME, with the input always')
console.log('in reach. What the founded island SUPPLIES is a different number -- run with')
console.log('--world for the mob density, and see check-engine-haul.mjs for route geometry.')
console.log('A trade is as fast as the lesser of the two, and which one binds is the answer.')
console.log('a "day" is ' + ALLOW + ' acting intervals (genesis.ceiling), not 86,400\n')
console.log('trade                            xp/int @ lvl 1/30/50/70/90   d@50   d@70   d@100')

const STOPS = [1, 30, 50, 70, 90]
/** integrate 1/rate along the road, so the slope of the rate is not thrown away */
const roadTo = (rates, lvl) => {
  let d = 0
  for (let i = 0; i < STOPS.length; i++) {
    const lo = STOPS[i], hi = Math.min(STOPS[i + 1] ?? lvl, lvl)
    if (hi <= lo) continue
    const span = (T[hi] ?? 0) - (T[lo] ?? 0)
    const r = rates[i]
    if (!(r > 0)) return Infinity
    d += span / r / ALLOW
    if (hi >= lvl) break
  }
  return d
}

const out = []
for (const r of ROADS) {
  const rates = [], starved = []
  for (const lv of STOPS) {
    const m = await measure(r.label, r.skill, r.setup, r.loop, r.calling, lv)
    rates.push(m.rate); starved.push(m.starved)
  }
  out.push({ ...r, rates, rate: rates[0], starved: starved.some(Boolean) })
  console.log(r.label.padEnd(38)
    + (starved.some(Boolean)
      ? '  STARVED — the yard ran dry, so this is not a rate'
      : rates.map(x => x.toFixed(1)).join('/').padStart(20)
        + fmt(roadTo(rates, 50)).padStart(7)
        + fmt(roadTo(rates, 70)).padStart(7)
        + fmt(roadTo(rates, 100)).padStart(8)))
}

const base = out.find(o => o.skill === 'woodcraft')?.rate ?? 0
console.log('\nCALLINGS.md assumes one rate for all nine. Against woodcraft:')
for (const o of out) if (o.skill !== 'woodcraft')
  console.log('  ' + o.skill.padEnd(14) + (o.rate / base).toFixed(2) + 'x')

console.log('\n§7t IS ENFORCED FOR MELEE AND NOT FOR RANGED.')
console.log('teachMelee() takes a `dummy` flag and pays nothing past YARD_CAP (' + 20 + ').')
console.log('The archery butt is MOB_STATS.butt, dummy:true, ranged:true, 100,000 hp, and')
console.log('never hits back -- but the ranged award is a bare gainXp(p, "marksmanship", dmg)')
console.log('with no such flag. Measured above: the dummy pays 0 from level 30 on; the butt')
console.log('keeps paying at 30, 50, 70 and 90. Marksmanship can be taken to mastery at a')
console.log('post that cannot hurt you. That is the exact thing §7t says the yard must not be.')

console.log('\nNOT MEASURED, and they are the input-bound three: hearthcraft needs seeds,')
console.log('sorcery needs things to unmake, and mourning above is measured with the bones')
console.log('already in the pack. A bone costs ~16 intervals of hunting, so the mourning')
console.log('rate below is the CEILING of that road and not its rate:')
const mo = out.find(o => o.skill === 'mourning')
if (mo) {
  const real = mo.rate / 17            // one bury interval + ~16 hunting for the bone
  console.log('  mourning, bones included: ' + real.toFixed(2) + ' xp/int -> '
    + fmt(days(T[100], real)) + ' days to mastery')
}

// ---- what the island actually supplies -------------------------------------
//
// A yard rate is a ceiling. It is only the answer where the world can keep the
// citizen fed, and whether it can is a property of the FOUNDED WORLD, not of
// this file. For combat that is mob density against respawn: every beast within
// reach contributes maxHp/respawn hitpoints an interval, and a fighter who can
// swing for more than the sum of that is standing in an empty field for the
// difference -- which is exactly how this harness once reported combat at a
// third of its real rate.
if (WORLD) {
  console.log('\nfounding a world to ask what it supplies…')
  const { foundGenesis, buildWorld } = await import('./worldgen-any.mjs')
  const { rulesHash } = await import('./rules-hash.mjs')
  const g2 = foundGenesis('interval-expanse-v7', 'roads-supply',
    rulesHash(new URL('./', import.meta.url)), 0)
  const w2 = buildWorld(g2)
  const beasts = Object.values(w2.mobs ?? {}).filter((m) => {
    const st = E.MOB_STATS[m.type]; return st && !st.dummy && st.respawn })
  const supplyOf = (m) => E.MOB_STATS[m.type].maxHp / E.MOB_STATS[m.type].respawn
  console.log('  ' + beasts.length + ' beasts placed at founding')
  for (const R of [6, 12, 20]) {
    let best = null
    for (const a of beasts) {
      let sup = 0, n = 0
      for (const m of beasts) {
        if (Math.abs(m.x - a.x) + Math.abs(m.y - a.y) > R) continue
        sup += supplyOf(m); n++
      }
      if (!best || sup > best.sup) best = { sup, n, x: a.x, y: a.y }
    }
    console.log('  within ' + String(R).padStart(2) + ' tiles, the richest ground ('
      + best.x + ',' + best.y + ') holds ' + String(best.n).padStart(3)
      + ' beasts and sustains ' + best.sup.toFixed(1) + ' xp/interval')
  }
  const pro = out.find((o) => o.skill === 'prowess')
  if (pro && !pro.starved) console.log('  a fighter consumes ' + pro.rates[2].toFixed(1)
    + ' — so out there combat is bound by the SWING, not by what is standing near you')
}
