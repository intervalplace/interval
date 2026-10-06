// crossing.mjs: WHAT A CITIZEN CARRIES OUT OF A WORLD THAT STOPPED.
//
// A world halts permanently when quorum is gone, and the only continuation is
// a successor world whose genesis `imported` seats the citizens of the last
// certified checkpoint (CONSENSUS.md §9). This file is that crossing: the
// filter that decides who comes, and the record each of them arrives with.
//
// It lived inside serve.mjs for its whole life, fifty lines in the middle of a
// fifteen-hundred-line server, which is why nothing ever tested it: there was
// no way to call it without starting a node. It is the world's afterlife, and
// it was the least exercised code in the project. Two faults had already
// reached it unnoticed:
//
//   §5k  `calling` was not carried, so every sworn citizen arrived unsworn.
//        An unsworn citizen's ceiling is level 50 in every skill, so the new
//        world refused itself at founding the moment anybody carried had
//        passed it, and a master arrived with the wrong maximum health.
//   §6g  vaults are keyed by BANK NODE ID, and the ids of a world that no
//        longer exists name nothing. Carried whole they would strand
//        everything on shelves in a building that was never built.
//
// Both are covered by test/afterlife.test.mjs now. Keep it that way: this is
// the code that runs exactly once per world, at the moment nobody is watching
// and nothing can be tried again.
import E from './engine.js'

// ONE constitutional item registry (rev5 §4): engine, validator and imports
// all share it, so a crossing can never invent an item the new world lacks.
const KNOWN_ITEMS = E.ITEMS

// WHO COMES. Everyone who LIVED: a name, any xp beyond birth, anything owned.
// Pure ghosts (spawned once, did nothing, never returned) rest in the old
// world's history rather than being seated again in the new one.
//
// The `hitpoints` arm is history. That skill was retired when the frame went
// flat, but a checkpoint written before then starts every citizen at 1154 xp
// in it, so reading a pre-rename world needs the threshold or every ghost in
// it looks like somebody who lived.
// MONEY COUNTS, AND IT DID NOT.
//
// §9b-ii fixed a crossing dropping everybody's gold: the vault filter kept
// KNOWN_ITEMS and gold is a number, so a life's savings fell through a test
// written to strip unknown goods. This is the same fault one level up. The
// money crossed after that fix; the PERSON still did not, because this test
// never looked at it. A citizen who sold everything they owned and was
// standing on four thousand gold with no name, no levels and an empty pack was
// a ghost by this reckoning, and a crossing left them behind entirely.
//
// Gold cannot simply be added to the list, which is presumably why it was not:
// every newcomer wakes with `genesis.newcomerGold` (§6ao), so any-gold-at-all
// would make every ghost look like somebody who lived. What counts is money
// they did not wake with, so the purse has to be known, and `carry` is given
// the founding to read it from.
//
// WITHOUT A FOUNDING this behaves as it always did and ignores gold, because
// guessing the purse would be worse: too low and every ghost crosses, too high
// and the fault stays. Callers that have the old genesis pass it, which is
// every caller that matters. With one, the purse is exact: the field if the
// founding sets it, and zero if it does not, since that is what `addPlayer`
// gives a newcomer either way.
export const lived = (p, newcomerGold = null) => Boolean(
  p.name
  || Object.entries(p.skills ?? {}).some(([k, xp]) => (k !== 'hitpoints' ? xp > 0 : xp > 1154))
  || (p.inventory ?? []).some(Boolean)
  || Object.keys(p.vaults ?? {}).length > 0
  || p.equipment?.weapon
  || (newcomerGold !== null && (p.gold ?? 0) > newcomerGold)
)

// WHAT THEY BRING. Imports are FOUNDING data: they live inside the genesis,
// the worldId commits to them, and worldgen applies them on every node
// identically, so this has to be a pure function of the old state.
export function carry(players, genesis = null) {
  // ONE ANSWER TO "WHAT CROSSES", and it is the engine's (§9b-iii:
  // `carriedFrom`). This function used to hold the projection itself, which
  // was fine while a founder reading a checkpoint was the only way back from a
  // world that stopped. It is not any more: a citizen can also `restore` on
  // their own months later, against the root their successor's genesis names,
  // and if that door and this one disagreed about gold or callings or who
  // taught whom, then what a citizen got back would depend on how they came.
  //
  // So the list lives beside `IMPORT_FIELDS`, which is the list it has to
  // satisfy, and this is a filter and a map over it. WHO comes is still a
  // question for this file: `lived` is about a world's history rather than
  // about the constitution.
  // A FOUNDING ALWAYS DETERMINES THE PURSE. `newcomerGold` is optional in a
  // genesis, and `addPlayer` reads it as `?? 0`, so a founding without the
  // field wakes its newcomers penniless and every coin is money they earned.
  // Absent is therefore zero, not unknown. Unknown is only the case where no
  // founding was handed over at all.
  const purse = genesis ? (Number.isInteger(genesis.newcomerGold) ? genesis.newcomerGold : 0) : null
  return Object.entries(players ?? {}).filter(([, p]) => lived(p, purse))
    .map(([pid, p]) => E.carriedFrom(pid, p))
}

// WHERE THEY CAME FROM. The genesis commits to WHICH attested state carried
// them, so a successor world states in its own identity which world it
// continues and at what tick.
//
// THE STATE MUST ACTUALLY HASH TO THE HASH BEING CLAIMED. The crossing itself
// is deliberately generous: it carries people out of a checkpoint even when
// serve.mjs has just refused that checkpoint as damaged, because losing
// everybody to a half-written file is the worse failure. But being generous
// about WHO CROSSES is not the same as being generous about WHAT THE NEW WORLD
// SWEARS, and the two were the same line until this was tested. A doctored
// checkpoint carrying the real world's `worldId` and `stateHash` would have
// produced a successor whose genesis attested that a state it never saw
// contained citizens that never existed, and the worldId would have committed
// to the lie permanently.
//
// So the claim is checked against the state it describes. Citizens still
// cross; only the attestation is withheld. An unprovenanced crossing says "we
// do not know which state these came from", which is true and recoverable. A
// false one cannot be taken back.
export function provenance(savedCp) {
  if (!(savedCp?.worldId && savedCp?.stateHash && Number.isInteger(savedCp?.tick))) return null
  if (!savedCp.state) return null
  if (E.stateHash(savedCp.state) !== savedCp.stateHash) return null
  return { worldId: savedCp.worldId, stateHash: savedCp.stateHash, tick: savedCp.tick }
}

export default { lived, carry, provenance }
