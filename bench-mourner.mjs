// bench-mourner: a practice yard for the mourner executor.
//
// This is NOT a world. It founds a small classic country, seats one citizen,
// and drives them with the real engine, the real SDK and real signed inputs --
// but there is no gossip, no witness set and no quorum, so nothing here is
// finalized and nothing here is Tallyholm. It exists because an executor that
// has never been run is a guess.
//
//   node bench-mourner.mjs [ticks] [--endow] [--quiet]
//
// `--endow` fills the citizen's pack at the moment they wake. That is a
// bench-only hand on the scales and it is written down as one: it exists so
// the SWEARING can be exercised in a couple of thousand intervals instead of
// the couple of hundred thousand the real curve asks for. Every input the
// executor sends is still validated by the constitution; the only thing the
// bench forges is the starting wealth.

import E from './engine.js'
import { IntervalClient } from './sdk.mjs'
import { Mourner } from './mourner.mjs'
import { rulesHash } from './rules-hash.mjs'

const TICKS = Number(process.argv[2]) || 3000
const ENDOW = process.argv.includes('--endow')
const QUIET = process.argv.includes('--quiet')

const RH = rulesHash(new URL('./', import.meta.url))
const GENESIS = E.makeGenesis('mourner-yard', RH, 0, 64, 48)

// The yard: an ossuary, one seam of every kind the ceiling lets a mourner
// reach, a stall to buy the first tool from, and a hearth to cook at.
function buildWorld(g) {
  const w = E.newWorld(g)
  const sp = E.spawnOf(g)
  E.addNode(w, 'oss-1', 'ossuary', sp.x - 3, sp.y)
  E.addNode(w, 'stall-lumber', 'stall', sp.x + 2, sp.y - 1)
  w.nodes['stall-lumber'].kind = 'lumber'
  E.addNode(w, "stall-delve", "stall", sp.x + 6, sp.y + 6)
  w.nodes['stall-delve'].kind = 'delve'
  E.addNode(w, 'hearth-1', 'hearth', sp.x, sp.y + 3)
  E.addNode(w, 'vault-1', 'vault', sp.x - 1, sp.y + 3)
  for (let i = 0; i < 4; i++) E.addNode(w, 'tree-' + i, 'tree', sp.x + 5 + i, sp.y - 4)
  for (let i = 0; i < 4; i++) E.addNode(w, 'iron-' + i, 'iron-rock', sp.x + 5 + i, sp.y + 4)
  for (let i = 0; i < 2; i++) E.addNode(w, 'fish-' + i, 'fishing-spot', sp.x - 6, sp.y + 2 + i)
  return w
}

// ---- the smallest node that will satisfy the SDK -------------------------
// state, a tick, a way to submit a signed input, and a heartbeat. No p2p: the
// SDK reads `peers` off getConnections(), so it gets an empty list and an
// honest zero.
class YardNode {
  constructor(genesis) {
    this.genesis = genesis
    this.state = buildWorld(genesis)
    this.worldId = E.worldId(genesis)
    this.pending = new Map()
    this.onTick = null
    this.p2p = { getConnections: () => [] }
    this.divergent = new Map()
    this.log = []
  }
  get finalizedTick() { return this.state.tick }
  get scheduledTick() { return this.state.tick }
  submitInput(input) {
    // one input per citizen per interval, exactly as the buffer does it
    if (!this.pending.has(input.playerId)) this.pending.set(input.playerId, input)
    return true
  }
  publishChat(_id, text) { if (!QUIET) console.log('  « ' + text) }
  advance() {
    const inputs = [...this.pending.values()].sort((a, b) => (a.sig < b.sig ? -1 : 1))
    this.pending.clear()
    this.state = E.nextState(this.state, inputs, E.beaconValue(this.genesis.genesisSeed, this.state.tick))
    if (this.onTick) this.onTick(this.state)
  }
}

const node = new YardNode(GENESIS)
const me = E.generateIdentity()
const client = new IntervalClient({ node, identity: me })

const say = (m) => { if (!QUIET) console.log('  ' + m) }
const bot = new Mourner(client, { name: 'ashkeeper', say })

// the bench-only hand on the scales, applied once, the interval the citizen
// wakes. A spread of kinds, because the trade is about VARIETY and a bench
// that endowed one kind would prove nothing about the ledger.
const ENDOWMENT = [
  'great-maul', 'gold-plate', 'gold-legs', 'gold-helm', 'fire-siphon',
  'star-plate', 'king-shroud', 'star-maul', 'grave-silver', 'heartwood-bow', 'horn-bow',
]
let endowed = false
function endow(s) {
  const p = s.players[me.playerId]
  if (!p || endowed) return
  endowed = true
  let i = 1
  for (const item of ENDOWMENT) { if (i < p.inventory.length) p.inventory[i++] = { item, qty: 1 } }
  p.gold = 200
  say('[bench] endowed with ' + ENDOWMENT.length + ' kinds — a hand on the scales, and the only one')
}

console.log('interval bench: the mourner')
console.log('world ' + node.worldId.slice(0, 12) + '… · rules ' + GENESIS.rulesHash.slice(0, 8)
  + ' · swear at ' + E.SWEAR_LEVEL + ' · mastery at ' + E.MASTERY
  + ' · other trades capped at ' + E.CAP_OTHER)
console.log('')

let sworn = null
const t0 = Date.now()
for (let t = 0; t < TICKS; t++) {
  try { bot.step(node.state) } catch (e) { console.log('  !! ' + e.stack.split('\n')[0]) }
  node.advance()
  if (ENDOW) endow(node.state)
  const p = client.me
  if (p && p.calling && !sworn) {
    sworn = p.calling
    console.log('\n  >>> SWORN: ' + p.calling + ' at interval ' + node.state.tick
      + ' — ' + E.levelForXp(p.skills.mourning) + ' mourning, and it can never be put down\n')
  }
  if (t % 250 === 0) console.log('  ' + bot.report())
}

console.log('')
console.log(bot.report())
const p = client.me
if (p) {
  const tally = Object.entries(p.offered ?? {}).sort((a, b) => b[1] - a[1])
  console.log('the ledger: ' + (tally.length ? tally.map(([k, n]) => `${k}x${n}`).join(', ') : 'nothing given yet'))
  console.log('calibrated: ' + JSON.stringify(bot.cal))
  console.log('skills: ' + Object.entries(p.skills).filter(([, v]) => v > 0)
    .map(([k, v]) => k + ' ' + E.levelForXp(v)).join(', '))
}
console.log(`\n${TICKS} intervals in ${((Date.now() - t0) / 1000).toFixed(1)}s`)
