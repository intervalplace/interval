import pkg from './node_modules/ws/index.js'; const { WebSocket } = pkg;
const ws = new WebSocket('ws://127.0.0.1:7777')
ws.on('message', (d) => {
  const f = JSON.parse(d.toString())
  if (!f.me) return
  const want = [[354,265],[354,266],[353,265]]
  for (const [x,y] of want) {
    const hits = []
    for (const id in (f.nodes||{})) { const n=f.nodes[id]; if (n.x===x && n.y===y) hits.push(`${n.type}${n.kind?'.'+n.kind:''} (${id})`) }
    console.log(`${x},${y}: ${hits.join(', ') || 'nothing in the frame'}`)
  }
  process.exit(0)
})
setTimeout(() => process.exit(0), 20000)
