// Wait until this citizen's birth ripens, then say so once and stop.
import { WebSocket } from 'ws'
const ws = new WebSocket('ws://127.0.0.1:7777')
let last = -1
ws.on('message', (b) => {
  const m = JSON.parse(b); if (m.k !== 'frame') return
  const bi = m.birth; if (!bi) return
  if (bi.state === 'in') { console.log('BORN: standing at tile ' + m.me.x + ',' + m.me.y); process.exit(0) }
  if (bi.state === 'ripe') { console.log('RIPE at tick ' + m.tick + ', the window may cross'); process.exit(0) }
  if (bi.state === 'waiting' && bi.waited - last >= 200) { last = bi.waited; console.log('waiting ' + bi.waited + '/' + bi.ripeAt) }
})
ws.on('error', (e) => { console.log('bridge error: ' + e.message); process.exit(1) })
