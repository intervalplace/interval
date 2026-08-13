// Interval SDK v0.6 — Layer 2: the window-maker.
// A clean client library between the node (layer 1: constitution +
// consensus) and any renderer (layer 3: terminal, web, spreadsheet…).
// The SDK knows nothing about pixels; renderers know nothing about
// gossip. Humans and bots use this exact same interface — that is the
// bot-indifference doctrine made concrete.

import E from './engine.js'

export class IntervalClient {
  constructor({ node, identity }) {
    this.node = node
    this.identity = identity        // { playerId, privateKey } — your key IS your character
  }

  // ---- reading the world (all state is public and verifiable) ----
  get world() { return this.node.state }
  get tick() { return this.node.state.tick }
  get finalizedTick() { return this.node.finalizedTick }   // highest interval with a quorum proof
  get scheduledTick() { return this.node.scheduledTick }   // where local time PREDICTS the world should be
  get me() { return this.node.state.players[this.identity.playerId] ?? null }
  get peers() { return this.node.p2p.getConnections().length }
  get worldId() { return this.node.worldId }                      // the COMPLETE world ID (fix brief §2)
  get worldIdShort() { return this.node.worldId.slice(0, 12) }    // display only — never for protocol use

  players() {
    return Object.entries(this.world.players).map(([pid, p]) => ({
      pid, ...p, display: p.name ?? pid.slice(0, 6) + '…',
    }))
  }
  nodesAt() { return Object.entries(this.world.nodes).map(([id, n]) => ({ id, ...n })) }
  displayName(pid) { return this.world.players[pid]?.name ?? pid.slice(0, 6) + '…' }
  level(skill) { return this.me ? E.levelForXp(this.me.skills[skill]) : 0 }
  inventoryCount() { return this.me ? this.me.inventory.filter(Boolean).length : 0 }

  // ---- acting in the world (signed inputs, one per tick) ----
  #send(fields) {
    // §2.3: worldId is inside the signed payload — this action is valid in
    // exactly one world, and the signature enforces it
    // pre-freeze §5: ONE shared normalizer builds the object that gets
    // signed — equivalent requests always produce byte-identical
    // canonical bytes (e.g. an item trade without wantGold gains
    // wantGold: 0 here, not in some client's private convention)
    const canon = E.normalizeInput(fields)
    const input = E.signInput(
      { worldId: this.node.worldId, tick: this.tick, playerId: this.identity.playerId, ...canon },
      this.identity.privateKey)
    return this.node.submitInput(input)
  }
  move(dx, dy) { return this.#send({ type: 'move', dx, dy }) }
  gather(nodeId) { return this.#send({ type: 'gather', nodeId }) }
  stop() { return this.#send({ type: 'stop' }) }
  claimName(name) { return this.#send({ type: 'claim_name', name }) }
  // §0b: the first half of a birth. An executor attends, waits the same ten
  // minutes a person waits, and then spawns. There is no faster path and there
  // is not meant to be one.
  attend() { return this.#send({ type: 'attend' }) }

  /**
   * §0: AM I IN THE WORLD, OR IN A PRACTICE OF IT?
   *
   * One field, unforgeable, and the same answer in every window and every
   * executor ever written. A client that never asks is not deceived by
   * anything -- an executor attends, waits and crosses without Nought
   * existing for it -- but a client that DOES render a world owes its citizen
   * this, and now cannot get it wrong.
   */
  get inNought() { return this.node.state ? this.node.state.genesis?.nought === true : false }
  spawn() { return this.#send({ type: 'spawn' }) }

  /**
   * §0c: GET ME INTO THE WORLD, whatever that currently takes.
   *
   * Birth is two-phase now, and every executor in this repository used to open
   * with `if (!this.me) return client.spawn()` -- which under §0c is an input
   * that will be refused forever, because no wait stands behind it. That is not
   * a bug in those bots; it is a bug in asking each of them to know about
   * §0b. So the knowledge lives here, once.
   *
   * Safe to call every tick: it attends when there is nothing to wait on, waits
   * in silence while the wait ripens, and spawns the moment it may. It reports
   * what it is doing so an operator watching a log is never left wondering why
   * their bot is standing still for ten minutes.
   */
  enter(onNote) {
    if (this.me) return null
    const st = this.node.state
    const k = this.identity.playerId.slice(0, 16)
    const e = Array.isArray(st.attend) ? st.attend.find((x) => x[1] === k) : null
    const age = e ? st.tick - e[0] : -1
    if (age < 0 || age > 2000) {                       // no wait, or a stale one
      if (this._attendAt !== undefined && st.tick - this._attendAt < 12) return null
      this._attendAt = st.tick
      onNote?.('nought: knocking')
      return this.attend()
    }
    if (age < 1000) {                                  // waiting, as everyone does
      if (!this._waitNoted) { this._waitNoted = true; onNote?.('nought: waiting ten minutes, like everyone') }
      return null
    }
    onNote?.('nought: crossing')
    return this.spawn()                                // ripe; §5h may still queue us
  }
  // v0.69: one slot or many. A number is still accepted because one slot is
  // the common case and a caller should not have to write [3] to mean 3.
  #slots(v) {
    const a = Array.isArray(v) ? v.slice() : [v]
    return [...new Set(a)].sort((x, y) => x - y)
  }
  offerTradeForItem(to, giveSlots, wantItem) { return this.#send({ type: 'offer_trade', to, giveSlots: this.#slots(giveSlots), wantItem, wantGold: 0 }) }
  offerTradeForGold(to, giveSlots, wantGold) { return this.#send({ type: 'offer_trade', to, giveSlots: this.#slots(giveSlots), wantItem: null, wantGold }) }
  acceptTrade(from) { return this.#send({ type: 'accept_trade', from }) }
  cancelTrade() { return this.#send({ type: 'cancel_trade' }) }
  cook(slot) { return this.#send({ type: 'cook', slot }) }
  // §6as-iii: style is 'even' (the split), 'aim' (attack) or 'force' (strength)
  attack(mobId, style = 'even') { return this.#send({ type: 'attack', mobId, style }) }
  eat(slot) { return this.#send({ type: 'eat', slot }) }
  drop(slot) { return this.#send({ type: 'drop', slot }) }
  pickup(groundId) { return this.#send({ type: 'pickup', groundId }) }
  light(slot) { return this.#send({ type: 'light', slot }) }
  bury(slot) { return this.#send({ type: 'bury', slot }) }
  fletch(slot, make) { return this.#send({ type: 'fletch', slot, make }) }
  attackp(targetId, style = 'even') { return this.#send({ type: 'attackp', targetId, style }) }
  plant(slot) { return this.#send({ type: 'plant', slot }) }
  harvest(nodeId) { return this.#send({ type: 'harvest', nodeId }) }
  sell(slot) { return this.#send({ type: 'sell', slot }) }
  invoke() { return this.#send({ type: 'invoke' }) }
  cast(spell) { return this.#send({ type: 'cast', spell }) }
  // 6cj: FIVE SLOTS, not three. `offhand` and `legs` joined the constitution
  // with shields and gold legs; a script that only knew 'weapon', 'head' and
  // 'body' could put a shield on and never take it off again. The list is read
  // from the engine rather than written here, so the next slot needs no edit.
  static SLOTS = E.EQUIP_SLOTS ?? ['weapon', 'head', 'body', 'offhand', 'legs']
  unequip(gear) { return this.#send({ type: 'unwield', gear }) }

  // ---- exploration ----
  survey() { return this.#send({ type: 'survey' }) }

  // ---- brewing ----
  buildBrewpot() { return this.#send({ type: 'build_brewpot' }) }
  brew(nodeId, slot) { return this.#send({ type: 'brew', nodeId, slot }) }
  collect(nodeId) { return this.#send({ type: 'collect', nodeId }) }
  dismantle(nodeId) { return this.#send({ type: 'dismantle', nodeId }) }

  // ---- watchfires: the public good, kept alight by whoever passes ----
  kindle() { return this.#send({ type: 'kindle' }) }
  stoke(nodeId, slot) { return this.#send({ type: 'stoke', nodeId, slot }) }
  deposit(slot) { return this.#send({ type: 'deposit', slot }) }
  withdraw(item) { return this.#send({ type: 'withdraw', item }) }
  smith(recipe) { return this.#send({ type: 'smith', recipe }) }
  wield(slot) { return this.#send({ type: 'wield', slot }) }
  buy(item) { return this.#send({ type: 'buy', item }) }
  // v0.82: THE VERBS THAT ARRIVED WITHOUT AN SDK.
  //
  // A bot is a citizen here -- an executor runs a full node and its deeds feed
  // the beacon -- so a verb the SDK cannot express is a verb half the
  // population cannot use. `drink`, `alch` and `set_look` all shipped into the
  // engine without one, which quietly made them window-only features in a
  // world that does not have window-only features.
  drink() { return this.#send({ type: 'drink' }) }
  alch(slot) { return this.#send({ type: 'alch', slot }) }
  setLook(look) { return this.#send({ type: 'set_look', look }) }
  // and the four the SDK never spoke, which an audit turned up alongside
  // them. `restore` and `archive` are a node's business rather than a
  // citizen's, but `still` and `special` are things a citizen DOES, and a bot
  // that cannot root an opponent or spend a special is fighting with one hand.
  still(target) { return this.#send({ type: 'still', target }) }
  special(targetId, style = 'even') { return this.#send({ type: 'special', targetId, style }) }
  mendp(target) { return this.#send({ type: 'mendp', target }) }
  // ---- trading with another citizen ----
  // The SDK could not do this at all: a script could buy from a keeper and
  // never from a person, in a world whose whole economy insists the only
  // sensible buyer is another citizen.
  offer(to, giveSlots, { item = null, gold = 0 } = {}) {
    return this.#send({ type: 'offer_trade', to, giveSlots, wantItem: item, wantGold: gold })
  }
  accept(from) { return this.#send({ type: 'accept_trade', from }) }
  cancelTrade() { return this.#send({ type: 'cancel_trade' }) }

  // ---- a citizen's own stall ----
  // raise() begins twenty intervals of standing still; moving or swinging
  // cancels it, so a script must wait rather than issue the next order.
  raiseStall() { return this.#send({ type: 'raise_market' }) }
  stockStall(slot) { return this.#send({ type: 'stock_market', slot }) }
  priceStall(ask) { return this.#send({ type: 'price_market', ask }) }
  takeStall() { return this.#send({ type: 'take_market' }) }
  dismantleStall() { return this.#send({ type: 'dismantle_market' }) }

  // ---- hauling: the road ----
  //
  // 6cj: THE SDK COULD NOT HAUL AT ALL.
  //
  // `consign`, `deliver` and `release` never reached this file, so a script
  // written against the SDK could not take a consignment, could not walk a leg
  // and could not put one down -- which is to say a bot could not train one of
  // the eighteen skills, in a world whose whole premise is that a bot IS a
  // citizen. It is exactly the fault the v0.82 note above describes, and it had
  // been sitting beside it the whole time.
  //
  // The shape is a citizen's rather than a machine's: take() names the slots
  // you are carrying for somebody, the legs are walked with move() like any
  // other journey, and deliver() is called ONCE PER SLOT at each store on the
  // route -- the engine pays per slot per leg and refuses the lot if you are
  // not beside the right counter. releaseConsignment() abandons the load
  // where you stand.
  //
  // One thing a script author will otherwise learn the hard way, so it is
  // written down: a consignment makes you STRIKEABLE ANYWHERE by any other
  // citizen also bearing one (11d). Hauling is the only trade in this world
  // that thins the law around the person doing it.
  take(slots) { return this.#send({ type: 'consign', slots: this.#slots(slots) }) }
  deliver(slot) { return this.#send({ type: 'deliver', slot }) }
  releaseConsignment() { return this.#send({ type: 'release' }) }
  get consignment() { return this.me?.consignment ?? null }

  // ---- a node's business, not a citizen's ----
  //
  // 6cj: both want a merkle path, which a citizen cannot produce by hand and a
  // node produces as a matter of course. A script that needs these is a node
  // operator's script; they are here so the SDK can express everything the
  // engine will hear, which is the only test this file has to pass.
  restore(record, path) { return this.#send({ type: 'restore', record, path }) }
  archive(subject, path) { return this.#send({ type: 'archive', subject, path }) }

  // ---- the rest of what the engine will hear ----
  unmake(groundId) { return this.#send({ type: 'unmake', groundId }) }
  // §6bn: the other half of the goo staff. Sealing reserves the pile for
  // WHOEVER DROPPED IT -- never for the caster, so a script that seals gains
  // nothing it can carry. It holds only while the caster stands within five
  // tiles, alive, with the staff still in hand, and a pile may be sealed once
  // and once only.
  seal(groundId) { return this.#send({ type: 'seal', groundId }) }
  // §6br: cut another citizen's name into a stone. Never your own -- the world
  // refuses a graver aimed at its holder -- and both of you must be standing
  // at it. One name per stone, and the chisel is spent.
  grave(nodeId, target) { return this.#send({ type: 'grave', nodeId, target }) }

  // ---- what a pot will take ----
  // brew() is unchanged: grain makes ale, a raw fish makes broth, and a DEEP
  // fish makes a deep broth once brewing is ninety. The verb never needed to
  // know -- the world decides from what you put in and what you have learned,
  // which is why a new brew took no new SDK call at all. Named here so a
  // script author does not go looking for one.
  static BREWS = { grain: 'ale', 'raw-fish': 'broth', 'deep-fish': 'broth, or deep-broth at brewing 78' }   // 6cj: 78, not 90
  buildBrewpot() { return this.#send({ type: 'build_brewpot' }) }

  // 6cj: WHAT THIS FILE DELIBERATELY DOES NOT OFFER.
  //
  // `recall` and `read_chart` are still in the engine's schemas so that an old
  // client is REFUSED rather than desynced -- but both always fail now: the
  // waystones are gone (6ch) and a chart is a good rather than a key (6ci).
  // An SDK method that can only ever return a rejection is a trap dressed as a
  // feature, so there is none. If a diff of engine schemas against this file
  // ever lists those two again, that is correct and expected.

  chat(text) { return this.node.publishChat(this.identity, text) }
  onChat(cb) { this.node.onChat = cb }

  // ---- the heartbeat ----
  onTick(cb) { this.node.onTick = cb }
}
