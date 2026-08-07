// Interval SDK v0.5 — Layer 2: the window-maker.
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
  spawn() { return this.#send({ type: 'spawn' }) }
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
  unequip(gear) { return this.#send({ type: 'unwield', gear }) }

  // ---- exploration ----
  survey() { return this.#send({ type: 'survey' }) }
  readChart(slot) { return this.#send({ type: 'read_chart', slot }) }

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
  recall(to) { return this.#send({ type: 'recall', to }) }
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

  // ---- the rest of what the engine will hear ----
  unmake(groundId) { return this.#send({ type: 'unmake', groundId }) }

  // ---- what a pot will take ----
  // brew() is unchanged: grain makes ale, a raw fish makes broth, and a DEEP
  // fish makes a deep broth once brewing is ninety. The verb never needed to
  // know -- the world decides from what you put in and what you have learned,
  // which is why a new brew took no new SDK call at all. Named here so a
  // script author does not go looking for one.
  static BREWS = { grain: 'ale', 'raw-fish': 'broth', 'deep-fish': 'broth or deep-broth (brewing 90)' }
  buildBrewpot() { return this.#send({ type: 'build_brewpot' }) }
  readChart(slot) { return this.#send({ type: 'read_chart', slot }) }

  chat(text) { return this.node.publishChat(this.identity, text) }
  onChat(cb) { this.node.onChat = cb }

  // ---- the heartbeat ----
  onTick(cb) { this.node.onTick = cb }
}
