import pkg from './node_modules/ws/index.js'; const { WebSocket } = pkg;
const ws = new WebSocket('ws://127.0.0.1:7777')
ws.on('message', (d) => {
  const f = JSON.parse(d.toString())
  if (!f.me) return
  const me = f.me
  const g = f.ground || {}
  const near = []
  for (const id in g) {
    const o = g[id]
    const away = Math.max(Math.abs(o.x - me.x), Math.abs(o.y - me.y))
    if (away <= 3) near.push(`${away} tiles  ${id}  ${o.item ?? JSON.stringify(o)} @${o.x},${o.y}`)
  }
  console.log(`ME ${me.x},${me.y} hp ${me.hp}, loot on the ground:`)
  console.log(near.length ? near.join('\n') : '  nothing within 3 tiles')
  process.exit(0)
})
setTimeout(() => process.exit(0), 20000)
