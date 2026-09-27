import pkg from './node_modules/ws/index.js'; const { WebSocket } = pkg;
const ws = new WebSocket('ws://127.0.0.1:7777')
ws.on('open', () => ws.send(JSON.stringify({k:'terrain', x0:610, y0:220, w:22, h:10, skirt:0})))
ws.on('message', (d) => {
  const f = JSON.parse(d.toString())
  if (f.k !== 'terrain') return
  if (!f.ridge) { console.log('no ridge plane in the chunk'); process.exit(0) }
  const r = Buffer.from(f.ridge, 'base64')
  for (let y = 0; y < f.h; y++) {
    let row = ''
    for (let x = 0; x < f.w; x++) row += r[y * f.w + x] ? '#' : '.'
    console.log((f.y0 + y) + ' ' + row)
  }
  console.log('     x from ' + f.x0)
  process.exit(0)
})
setTimeout(() => process.exit(0), 20000)
