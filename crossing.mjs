// crossing.mjs — WHAT A CITIZEN CARRIES OUT OF A WORLD THAT STOPPED.
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

// ONE constitutional item registry (rev5 §4) — engine, validator and imports
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
export const lived = (p) => Boolean(
  p.name
  || Object.entries(p.skills ?? {}).some(([k, xp]) => (k !== 'hitpoints' ? xp > 0 : xp > 1154))
  || (p.inventory ?? []).some(Boolean)
  || Object.keys(p.vaults ?? {}).length > 0
  || p.equipment?.weapon
)

// WHAT THEY BRING. Imports are FOUNDING data: they live inside the genesis,
// the worldId commits to them, and worldgen applies them on every node
// identically, so this has to be a pure function of the old state.
export function carry(players) {
  return Object.entries(players ?? {}).filter(([, p]) => lived(p)).map(([pid, p]) => ({
    pid,
    skills: p.skills,
    name: E.isValidName(p.name) ? p.name : null,   // constitutional or nothing (rev5 §3)
    // BOTH SPELLINGS, and only here. Every checkpoint written before the
    // rename says `hp`; this is the one place a world built under the old
    // rules is read by the new ones, so it is the one place that has to know
    // the old word.
    health: p.health ?? p.hp,
    // §5k: AND WHAT THEY SWORE. See the note at the top of this file.
    calling: p.calling ?? null,
    // §6g: A CROSSING CARRIES GOODS, NOT GEOGRAPHY. The shelves are summed
    // into one map on the way out, and worldgen seats the total at the counter
    // nearest where the citizen wakes. Founding data does not expire with the
    // world that held it; the building it sat in does.
    vaults: (() => {
      const flat = {}
      for (const vault of Object.values(p.vaults ?? {}))
        for (const [it, q] of Object.entries(vault ?? {}))
          if (KNOWN_ITEMS.has(it)) flat[it] = (flat[it] ?? 0) + q
      return flat
    })(),
    inventory: (p.inventory ?? []).filter(sl => sl && KNOWN_ITEMS.has(sl.item)),
    weapon: p.equipment?.weapon && KNOWN_ITEMS.has(p.equipment.weapon.item) ? p.equipment.weapon : null,
  }))
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
