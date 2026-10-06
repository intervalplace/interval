// incoming.mjs: THE INHERITED TREE, AND PATHS OUT OF IT.
//
// §9b-iii gives a successor one root over the citizens of the world it
// continues, and a citizen comes home by bringing their own record and a path
// against it. The engine builds roots and judges paths; it never holds a tree,
// which is the whole reason a root costs the tick nothing. So somebody has to
// hold this one.
//
// Nobody has to be TRUSTED to hold it, and that is the point. The record is
// the valuable half of a kept proof: unforgeable, unborrowable, good for ever.
// The path is a perishable routing detail, public, worth nothing to an
// attacker, and invalidated for everybody the moment one citizen comes home,
// because spending a leaf moves the root. So a path is something a returning
// citizen asks any stranger for, and a bad answer costs them nothing: the root
// refuses it and they ask somebody else.
//
// This holds the tree and serves those answers. It needs no key and no
// authority, anybody may run one, and a world with none of them running is
// still safe -- only the first citizen to come home can use a file they
// already hold, and everybody else has to wait for somebody to run this.
//
// WHAT IT IS BUILT FROM is a list of leaves, not a state: one id and one
// digest per citizen of the world that stopped, which is 128 bytes each
// against a state measured in hundreds of kilobytes. A million citizens is
// 128MB, and it is derived from the final checkpoint once by whoever has it.
//
// IT NEVER SERVES AN UNVERIFIED PATH. Every answer is folded first, and the
// root it folds to is checked against the live world's own `incomingRoot`. A
// service that has fallen behind says so and serves nothing, rather than
// handing somebody a path that will be refused at the door and leaving them to
// wonder whether their citizen survived.
import E from './engine.js'

// One leaf per citizen of the world that stopped, in the engine's own order.
// Taken from the final state, which is what rule 1 of SUCCESSION.md already
// requires the founder to hold.
export function leavesOf (finalState) {
  return Object.keys(finalState.players ?? {}).sort()
    .map((pid) => [pid, E.recordDigest(finalState.players[pid])])
}

export class IncomingTree {
  // `leaves` is [[pid, digest], ...]. `spent` is the ids that have already
  // come home, which a follower learns by watching the world.
  constructor (leaves, spent = []) {
    this.leaves = new Map(leaves)
    this.spent = new Set(spent)
  }

  get size () { return this.leaves.size - this.spent.size }

  // the pairs as the engine would see them: a spent leaf is EMPTY, not absent,
  // because an empty leaf is what the restore wrote.
  pairs () {
    const out = []
    for (const pid of [...this.leaves.keys()].sort())
      if (!this.spent.has(pid)) out.push([pid, this.leaves.get(pid)])
    return out
  }

  root () { return E.rootOfLeaves(this.pairs()) }

  // A path for one citizen, or null when they are not in this tree or have
  // already come home. Folded before it is returned: this module would rather
  // return nothing than something that does not work.
  path (pid) {
    if (!this.leaves.has(pid) || this.spent.has(pid)) return null
    const p = E.pathInLeaves(this.pairs(), pid)
    if (!p) return null
    if (!E.provesDigest(this.root(), pid, this.leaves.get(pid), p)) return null
    return p
  }

  spend (pid) { if (this.leaves.has(pid)) this.spent.add(pid) }

  // Who has come home, as a list somebody else can be handed. It is the whole
  // of this tree's mutable state: the leaves never change, so a service is
  // recoverable from the leaf file plus this.
  spentList () { return [...this.spent].sort() }

  // ---- TAKING SOMEBODY ELSE'S WORD, AND NOT TRUSTING IT ----
  //
  // A service that starts late cannot work the spent set out from the root
  // alone, because several homecomings leave a root explained only by a SET of
  // spends and choosing the right set would be a search over hashes. But it
  // does not have to work it out. Anybody already running one can simply say
  // who has come home, and the answer is CHECKABLE: build the tree with it and
  // the root either matches the world's own `incomingRoot` or it does not.
  //
  // So there is nothing to trust here. A hostile list, a stale list and an
  // honest list are told apart by one hash comparison, and a wrong one is
  // refused rather than serving one citizen a path that cannot work. This is
  // the same shape as everything else in §9b-iii: the data may come from
  // strangers because the root is the judge.
  //
  // Returns true when the list was adopted. On failure the tree is left
  // exactly as it was.
  adopt (spent, state) {
    if (!Array.isArray(spent)) return false
    const was = this.spent
    const live = state.incomingRoot ?? E.EMPTY_ROOT
    this.spent = new Set(spent.filter((pid) => this.leaves.has(pid)))
    if (this.root() === live) return true
    this.spent = was
    return false
  }

  // ---- following a live world ----
  //
  // The tree's shape is a pure function of who has come home, and a follower
  // has to work that set out from the outside. The obvious way is wrong: a
  // citizen who is a player in the successor has NOT necessarily come home.
  // They may have attended and spawned as a newcomer under the same key,
  // because the homecoming failed or because they chose to. Spending their
  // leaf on that evidence would lock them out of their own file for ever.
  //
  // So nothing is taken on appearance. A spend is accepted only when it
  // REPRODUCES THE WORLD'S OWN ROOT, which is a fact and not an inference. At
  // most one homecoming lands per interval (paths chain, so the first applied
  // moves the root and the rest answer to a root that has gone), so the change
  // between two ticks is one leaf, and finding which one is a pass over the
  // candidates.
  //
  // If nothing explains the root, this service is behind or wrong, and it says
  // so rather than guessing. The caller stops serving.
  // ---- READING IT OFF THE STATE ----
  //
  // §9b-iii: a citizen who came home carries the interval they came home at,
  // so who has already returned is a pure function of the state every node
  // holds. This is how a service starts from nothing: no file kept, no peer
  // asked, no history replayed.
  //
  // CHECKED, like everything else here. The derivation is short by any citizen
  // who came home and has since been archived, since they are not in `players`
  // any more, so the root is the judge and `follow` closes the remainder.
  fromState (state) {
    const seen = []
    for (const [pid, p] of Object.entries(state.players ?? {}))
      if (p?.returned !== undefined && this.leaves.has(pid)) seen.push(pid)
    return this.adopt(seen, state)
  }

  follow (state) {
    const live = state.incomingRoot ?? E.EMPTY_ROOT
    if (this.root() === live) return true
    const was = this.spent

    // START FROM WHAT THE CITIZENS THEMSELVES SAY. Everyone who came home
    // carries the interval they came home at, so this is exact for everybody
    // still standing in the world, and it is free.
    const base = new Set(was)
    for (const [pid, p] of Object.entries(state.players ?? {}))
      if (p?.returned !== undefined && this.leaves.has(pid)) base.add(pid)
    this.spent = base
    if (this.root() === live) return true

    // WHAT IS LEFT IS THE ONES WHO ARE NOT THERE TO SAY: a citizen who came
    // home and has since been archived is out of the tick, so nothing in the
    // state names them. One such is found by trying each remaining leaf and
    // keeping the spend only if it REPRODUCES the root, which makes it a fact
    // rather than an inference, and unique as well, since two different leaves
    // give two different roots.
    //
    // Several at once cannot be found this way: the root is then explained only
    // by a SET of spends, and choosing it would be a search over hashes with
    // nothing to guide it. Then this says so, and whoever runs the service
    // stops offering paths rather than offering wrong ones. A list from another
    // node (`adopt`) closes that case, and a world whose citizens all carry the
    // field never reaches it.
    for (const pid of this.leaves.keys()) {
      if (base.has(pid)) continue
      this.spent = new Set(base)
      this.spent.add(pid)
      if (this.root() === live) return true
    }
    this.spent = was
    return false
  }
}

export default { IncomingTree, leavesOf }

// ---- the leaf list, cut from a final checkpoint ----
//
//   node incoming.mjs <checkpoint.json> [out.json]
//
// Run once by whoever holds the state the world stopped on, which rule 1 of
// SUCCESSION.md already requires of a founder. The result is what a path
// service holds: one id and one digest per citizen, and the root they build,
// which must be the root the successor's genesis names or the file is for a
// different world.
if (process.argv[1] && process.argv[1].endsWith('incoming.mjs') && process.argv[2]) {
  const fs = await import('node:fs')
  const raw = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
  const state = raw.state ?? raw
  if (!state?.players) {
    console.error('that file holds no world')
    process.exit(1)
  }
  const leaves = leavesOf(state)
  const root = new IncomingTree(leaves).root()
  const live = state.livingRoot ?? E.livingRootOf(state)
  if (root !== live) {
    console.error('refusing to write: the leaves do not build the state\'s own root')
    process.exit(1)
  }
  const out = {
    v: 1,
    note: 'The citizens of a world that stopped, as leaves. Hold this and you '
      + 'can hand any of them the path home. It is public: a wrong path is '
      + 'refused by the root, so there is nothing here to protect.',
    worldId: E.worldId(state.genesis),
    tick: state.tick,
    livingRoot: root,
    leaves,
  }
  const where = process.argv[3] ?? 'incoming-leaves.json'
  fs.writeFileSync(where, JSON.stringify(out, null, 1) + '\n')
  console.log(`${leaves.length} citizens, root ${root.slice(0, 16)}… → ${where}`)
}
