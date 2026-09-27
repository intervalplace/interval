// Wait until this citizen is actually standing in the world, then say where.
import { WebSocket } from 'ws'
const ws = new WebSocket('ws://127.0.0.1:7777')
let noted = false
ws.on('message', (b) => {
  const m = JSON.parse(b); if (m.k !== 'frame') return
  const bi = m.birth; if (!bi) return
  if (bi.state === 'ripe' && !noted) { noted = true; console.log('RIPE at tick ' + m.tick) }
  if (m.me) { console.log('BORN at tick ' + m.tick + ': standing on tile ' + m.me.x + ',' + m.me.y + ' with ' + m.me.hp + ' hp'); process.exit(0) }
})
ws.on('error', (e) => { console.log('bridge error: ' + e.message); process.exit(1) })
