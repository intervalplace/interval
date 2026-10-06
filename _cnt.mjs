import pkg from './node_modules/ws/index.js'; const { WebSocket } = pkg;
const ws = new WebSocket('ws://127.0.0.1:7777')
ws.on('message', (d) => {
  const f = JSON.parse(d.toString())
  if (!f.me) return
  const me = f.me
  const away = (o) => Math.max(Math.abs(o.x - me.x), Math.abs(o.y - me.y))
  const tally = {}
  let near = 0
  for (const id in (f.nodes || {})) {
    const n = f.nodes[id]
    if (away(n) > 22) continue
    near++
    const k = n.kind ? `${n.type}.${n.kind}` : n.type
    tally[k] = (tally[k] || 0) + 1
  }
  console.log(`ME ${me.x},${me.y}, ${near} nodes within 22 tiles:`)
  for (const [k, c] of Object.entries(tally).sort((a,b)=>b[1]-a[1])) console.log(`  ${String(c).padStart(4)}  ${k}`)
  process.exit(0)
})
setTimeout(() => process.exit(0), 20000)
