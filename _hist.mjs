import pkg from './node_modules/ws/index.js'; const { WebSocket } = pkg;
const NAMES = ['meadow','trail','cobble','plaza','gravel','sand','scree','chalk','peat','cave','wilds','sea','river','mountain','bridge','causey','forest','greenwood','crags','fens','floor','flag','moor','heartlands','downs','shingle','trodden']
const ws = new WebSocket('ws://127.0.0.1:7777')
// the window asks for 64-tile chunks aligned to the grid; 632,336 -> chunk 9,5
const X0 = 9 * 64, Y0 = 5 * 64
ws.on('open', () => ws.send(JSON.stringify({ k: 'terrain', x0: X0, y0: Y0, w: 64, h: 64, skirt: 1 })))
ws.on('message', (d) => {
  const f = JSON.parse(d.toString())
  if (f.k !== 'terrain') return
  const t = Buffer.from(f.tiles, 'base64')
  const sw = f.w + f.skirt * 2, sh = f.h + f.skirt * 2
  console.log(`chunk at ${f.x0},${f.y0} ${f.w}x${f.h} skirt ${f.skirt}: ${t.length} bytes, expected ${sw * sh}`)
  const tally = {}
  for (const b of t) tally[b] = (tally[b] || 0) + 1
  for (const [k, n] of Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 8))
    console.log(`  code ${String(k).padStart(3)} ${(NAMES[k] ?? '?').padEnd(12)} ${n}`)
  console.log('  ridge plane:', f.ridge ? Buffer.from(f.ridge, 'base64').length + ' bytes' : 'MISSING')
  console.log('  road plane :', f.road ? Buffer.from(f.road, 'base64').length + ' bytes' : 'MISSING')
  console.log('  hash plane :', f.hash ? Buffer.from(f.hash, 'base64').length + ' bytes' : 'MISSING')
  process.exit(0)
})
setTimeout(() => process.exit(0), 20000)
