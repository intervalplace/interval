// Interval join v0.17 — the foreign node.
// Run this against any pillar's URL and you enter that world as a full
// peer: your OWN node computing every tick, your OWN keys signing every
// action, held locally. No custodian. The pillar can't lie to you —
// divergence detection judges its hashes like anyone else's.
//
//   usage: node join.mjs http://host:8787 [name]
//
// Includes an example executor: the citizen trains woodcutting on the
// nearest tree, forever. A bot and a person enter this world the same way.

import fs from 'fs'
import { multiaddr } from '@multiformats/multiaddr'
import E from './engine.js'
import { IntervalNode } from './node.mjs'
import { IntervalClient } from './sdk.mjs'
import { buildWorld } from './worldgen.mjs'

const URL_ = process.argv[2]
const NAME = (process.argv[3] || '').toLowerCase()
if (!URL_) { console.log('usage: node join.mjs http://host:8787 [name]'); process.exit(1) }

// 1. fetch the founding record
const info = await (await fetch(URL_.replace(/\/$/, '') + '/api/genesis')).json()
const host = new URL(URL_).hostname
const proto = /^\d+\.\d+\.\d+\.\d+$/.test(host) ? 'ip4' : 'dns4' // names resolve via dns4
const pillarAddr = multiaddr(`/${proto}/${host}/tcp/${info.p2pPort}/p2p/${info.peerId}`)
console.log(`world ${info.genesis.rulesHash.slice(0, 12)}… · joining as a full peer`)

// 2. verify we run the same constitution before anything else
const myRulesHash = E.sha256(fs.readFileSync(new URL('./SPEC.md', import.meta.url))).toString('hex')
if (myRulesHash !== info.genesis.rulesHash) {
  console.log('constitution mismatch: their world runs different rules than your SPEC.md')
  console.log(`  theirs: ${info.genesis.rulesHash.slice(0, 16)}…  yours: ${myRulesHash.slice(0, 16)}…`)
  console.log('pull the matching version, or found your own world.')
  process.exit(1)
}

// 3. your key IS your character — generated and held HERE, never sent
fs.mkdirSync('identities', { recursive: true })
const me = E.loadOrCreateIdentity(fs, `identities/join-${NAME || 'wanderer'}.json`)
console.log(`your key: ${me.playerId.slice(0, 12)}… (identities/join-${NAME || 'wanderer'}.json — guard it)`)

// 4. own node: sync the world, then march in lockstep
const node = await new IntervalNode({ genesis: info.genesis, buildWorld, name: 'join' }).start()
await node.dial(pillarAddr)
await node.syncFromPeers([pillarAddr], { allowSingle: true })
console.log(node.log[node.log.length - 1])
node.startTicking()

const client = new IntervalClient({ node, identity: me })

// 5. the example executor: spawn, claim name, chop the nearest tree forever
const step = (me2, goal) => {
  const dx = Math.sign(goal.x - me2.x), dy = Math.sign(goal.y - me2.y)
  const blocked = (x, y) => Object.values(node.state.nodes).some(n => n.x === x && n.y === y)
  for (const [mx, my] of [[dx, dy], [dx, 0], [0, dy], [dx, -1], [-1, dy]]) {
    if (!mx && !my) continue
    const nx = me2.x + mx, ny = me2.y + my
    if (nx < 0 || nx >= info.genesis.worldW || ny < 0 || ny >= info.genesis.worldH || blocked(nx, ny)) continue
    return client.move(mx, my)
  }
}
let said = false
client.onTick((s) => {
  const p = client.me
  if (!p) return client.spawn()
  if (NAME && !p.name) return client.claimName(NAME)
  if (!said) { said = true; return client.chat('the interval provides') }
  if (p.action) return
  const trees = Object.entries(s.nodes)
    .filter(([, n]) => n.type === 'tree' && n.depletedUntil <= s.tick)
    .sort(([, a], [, b]) => (Math.abs(a.x - p.x) + Math.abs(a.y - p.y)) - (Math.abs(b.x - p.x) + Math.abs(b.y - p.y)))
  if (!trees.length) return
  const [id, t] = trees[0]
  if (Math.abs(p.x - t.x) + Math.abs(p.y - t.y) === 1) return client.gather(id)
  step(p, t)
})

setInterval(() => {
  const p = client.me
  if (!p) return
  const logs = p.inventory.filter(sl => sl?.item === 'logs').length
  console.log(`tick ${node.state.tick} · (${p.x},${p.y}) · wc ${client.level('woodcutting')} · ${logs} logs · peers ${client.peers} · flags ${node.divergent.size}`)
}, 6000)
