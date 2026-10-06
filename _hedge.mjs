import pkg from './node_modules/ws/index.js'; const { WebSocket } = pkg;
const ws = new WebSocket('ws://127.0.0.1:7777')
ws.on('message', (d) => {
  const f = JSON.parse(d.toString())
  if (!f.me) return
  const me = f.me
  const out = []
  for (const id in (f.nodes || {})) {
    const n = f.nodes[id]
    if (n.type !== 'landmark' || n.kind !== 'old-oak-lm') continue
    const away = Math.max(Math.abs(n.x - me.x), Math.abs(n.y - me.y))
    out.push([away, id, n.x, n.y])
  }
  out.sort((a, b) => a[0] - b[0])
  console.log(`ME ${me.x},${me.y}, nearest oaks:`)
  for (const [a, id, x, y] of out.slice(0, 6)) console.log(`  ${a} tiles  ${id}  @${x},${y}`)
  process.exit(0)
})
setTimeout(() => process.exit(0), 20000)
