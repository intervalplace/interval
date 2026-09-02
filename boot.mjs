import { spawn } from 'child_process'
const child = spawn(process.execPath, ['serve.mjs'],
  { env: { ...process.env, INTERVAL_HTTP_PORT: '8791' }, stdio: ['ignore','pipe','pipe'] })
child.stdout.on('data', b => { const s = String(b)
  if (/live:|practice island ready|FOUNDING/.test(s)) process.stdout.write('  ..  ' + s.trim().split('\n').pop() + '\n') })
child.stderr.on('data', b => process.stdout.write('  ERR ' + String(b).slice(0,200) + '\n'))
const sleep = ms => new Promise(r => setTimeout(r, ms))
let up = false
for (let i = 0; i < 380 && !up; i++) { await sleep(1500)
  // §wait for the TABLES, not the page: a refounding pillar serves a holding
  // page on every route, so /play/mist being 200 says nothing at all
  try { const r = await fetch('http://127.0.0.1:8791/api/tables')
        if (r.ok) { const j = await r.json(); up = Object.keys(j.recipes||{}).length > 40 } } catch {} }
if (!up) { console.log('  FAIL  the pillar never came up'); child.kill('SIGKILL'); process.exit(1) }
let bad = 0
const ok = (c,m) => { console.log((c?'  ok  ':'  FAIL')+'  '+m); if(!c) bad++ }
for (const u of ['/play/mist','/play/hill','/play/writ']) {
  const r = await fetch('http://127.0.0.1:8791'+u); const t = await r.text()
  ok(r.ok && t.length > 100000, u.padEnd(12)+r.status+'  '+Math.round(t.length/1024)+' KB')
}
const t = await (await fetch('http://127.0.0.1:8791/api/tables')).json()
ok(Object.keys(t.recipes||{}).length > 40, '/api/tables serves '+Object.keys(t.recipes||{}).length+' recipes')
for (const k of ['sworn','callings','swearLevel','capUnsworn','capOther','masterYield','apprenticeSlots','nodeGate','smelted'])
  ok(t[k] !== undefined, '  and '+k+' = '+JSON.stringify(t[k]).slice(0,40))
const meta = await (await fetch('http://127.0.0.1:8791/nought/terrain.json')).json()
ok(meta.elev && meta.elev.v && meta.elev.v.length > 1000,
   'the ground carries the elevation lattice ('+(meta.elev?meta.elev.w+'x'+meta.elev.h:'MISSING')+')')
ok(t.swearLevel === 50 && t.capUnsworn === 50 && t.capOther === 70,
   'and the ceilings the pillar serves are the ones the engine holds')
child.kill('SIGKILL')
console.log(bad ? '\n  '+bad+' failed' : '\n  ok    the pillar boots and serves everything the three windows need')
process.exit(bad?1:0)
