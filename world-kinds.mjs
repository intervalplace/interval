// WHAT THIS WORLD ACTUALLY SEATS, written where the art tools can read it.
//
// The Unreal window's prop table carries a row for every node type any
// generator has ever placed, and `interval-expanse-v7` places about half of
// them. `Tools/audit_size.py` on the window side measures every drawn thing
// against its mesh's real extent, and without this list it spends its report
// on art nobody can walk up to: the waystone is 4.5 metres across and wrong,
// and is also v1-v5 only -- SPEC §29t says there are none in v7 -- so it is
// not a fault, it is a leftover.
//
// A world build is about two minutes, so this is not something to run in a
// loop. Run it when the generator changes what it seats.
//
//   node world-kinds.mjs
//
import { buildWorld } from './worldgen-expanse7.mjs'
import fs from 'node:fs'
import path from 'node:path'

const OUT = path.join(process.env.HOME,
  'Documents', 'Unreal Projects', 'interval', 'Tools', 'world_kinds.json')

const g = buildWorld(JSON.parse(
  fs.readFileSync('checkpoints/world.json', 'utf8')).genesis)

const n = {}
for (const q of Object.values(g.nodes)) {
  const k = q.kind ? q.type + '.' + q.kind : q.type
  n[k] = (n[k] || 0) + 1
  // a bare type that only ever appears with a kind still gets a row, at zero,
  // so the audit can tell "never seated" from "not a node type at all"
  if (q.kind && n[q.type] === undefined) n[q.type] = 0
}
fs.writeFileSync(OUT, JSON.stringify(n, null, 0))
console.warn('WORLD-KINDS: ' + Object.keys(n).length + ' kinds -> ' + OUT)
