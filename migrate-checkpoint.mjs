// migrate-checkpoint.mjs — normalise a checkpoint's player equipment to the
// current EQUIP_SLOTS (weapon, head, body, offhand, legs). Fills any missing
// slot with null so a world founded under a 3-slot engine (or corrupted by the
// pre-fix death-reset bug) loads cleanly under the 5-slot engine.
//
// Usage:  node migrate-checkpoint.mjs /var/interval-data/checkpoints/web.json
// Writes <file>.migrated next to it; it does NOT touch the original.
import fs from 'fs'

const SLOTS = ['weapon', 'head', 'body', 'offhand', 'legs']
const path = process.argv[2]
if (!path) { console.error('usage: node migrate-checkpoint.mjs <checkpoint.json>'); process.exit(1) }

const cp = JSON.parse(fs.readFileSync(path))
let touched = 0, players = 0
const st = cp.state ?? cp   // checkpoints wrap state under .state; tolerate either
const pl = st.players ?? {}
for (const pid of Object.keys(pl)) {
  players++
  const p = pl[pid]
  if (!p.equipment || typeof p.equipment !== 'object') { p.equipment = {}; }
  const eq = {}
  let changed = false
  for (const s of SLOTS) {
    eq[s] = (p.equipment[s] !== undefined) ? p.equipment[s] : null
    if (p.equipment[s] === undefined) changed = true
  }
  // drop any non-constitutional slots that snuck in
  for (const k of Object.keys(p.equipment)) if (!SLOTS.includes(k)) changed = true
  p.equipment = eq
  if (changed) touched++
}
const out = path + '.migrated'
fs.writeFileSync(out, JSON.stringify(cp))
console.log(`checked ${players} player(s); normalised equipment on ${touched}.`)
console.log(`wrote ${out}`)
console.log(`if it looks right:  mv ${out} ${path}  (back up the original first)`)
