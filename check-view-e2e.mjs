// End-to-end: drive the real engine, run the SERVER's fan-out shape, feed the
// CLIENT shim lifted out of window-web.html, and prove the window's world
// matches the pillar's inside the citizen's view -- including resync.
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const E = require('./engine.js')
import { foundGenesis } from './worldgen-any.mjs'
import { zoneDeltas, worldDelta, zoneFull, zonesAround, makeTracker } from './view.mjs'
import fs from 'fs'
// lift the shim straight out of the shipped window, so this test fails if the
// two copies ever drift
const html = fs.readFileSync('window-web.html', 'utf8')
const shim = html.slice(html.indexOf('var _held = null'), html.indexOf('function onMessage'))
const ctx = {}; new Function('g', shim + '\ng.vApplyTick=vApplyTick;g.vEvictOutside=vEvictOutside;g.vZonesAround=vZonesAround')(ctx)
const { vApplyTick, vEvictOutside, vZonesAround } = ctx
console.log('shim lifted from window-web.html: ' + shim.split('\n').length + ' lines')

const g = foundGenesis('interval-expanse-v7','tallyholm','b961c123b73d67c0'.padEnd(64,'0'),0)
const base = JSON.parse(fs.readFileSync('/home/claude/world-interval-expanse-v7.json','utf8'))
const WID = E.worldId(g)
const gen = await import('./worldgen-expanse7.mjs')
const occ = new Set(Object.values(base.nodes).map(n=>n.x+','+n.y))
const all=[]
for(let y=2;y<g.worldH-2;y++)for(let x=2;x<g.worldW-2;x++){
  if(gen.blockedAt(g,x,y)||occ.has(x+','+y))continue; all.push({x,y})}
const ids=[]; const idFor=i=>{while(ids.length<=i)ids.push(E.generateIdentity());return ids[i]}
let st=JSON.parse(JSON.stringify(base))
const N=600, step=Math.floor(all.length/N)
for(let i=0;i<N;i++){const t=all[(i*step)%all.length];E.addPlayer(st,idFor(i).playerId,t.x,t.y)}
const me=idFor(0).playerId

// the window's world, exactly as the shipped code holds it
let held=JSON.parse(JSON.stringify(st))   // snapshot on connect
const tracker=makeTracker()
let prev=st, checked=0, bad=0, resyncs=0
let had={has:()=>true}   // the snapshot held everything
for(let k=0;k<120;k++){
  const inputs=[]
  for(let i=0;i<Math.round(N*0.5);i++){const id=idFor(i),dx=(i%3)-1,dy=((i>>1)%3)-1
    inputs.push(E.signInput({worldId:WID,tick:st.tick,playerId:id.playerId,type:'walk',dx:(dx===0&&dy===0)?1:dx,dy,steps:8},id.privateKey))}
  inputs.sort((a,b)=>a.playerId<b.playerId?-1:1)
  prev=st; st=E.nextState(st,inputs,E.beaconValue(g.genesisSeed,st.tick))

  // --- server side, exactly as serve.mjs does it ---
  const zd=zoneDeltas(tracker,st)
  const wbuf=JSON.stringify(worldDelta(tracker,st))
  const mine=st.players[me]
  const zones=zonesAround(mine.x,mine.y)
  const parts=[wbuf]
  for(const z of zones){
    if(!had || !had.has(z)){ parts.push(JSON.stringify(zoneFull(st,z))); continue }
    const b=zd.get(z); if(b) parts.push(JSON.stringify(b))
  }
  had=new Set(zones)
  const frame='{"type":"patch","d":['+parts.join(',')+']}'

  // --- simulate a skipped interval: the pillar resyncs, the window reloads ---
  if(k===40||k===80){ held=JSON.parse(JSON.stringify(st)); had={has:()=>true}; resyncs++; continue }

  const m=JSON.parse(frame)
  vApplyTick(held,m.d)
  const hm=held.players[me]
  if(hm) vEvictOutside(held,vZonesAround(hm.x,hm.y))

  // truth: everything in my 3x3 zones must match, and nodes must be whole
  const watch=new Set(zones)
  for(const key of ['players','mobs']){
    for(const id in st[key]){const e=st[key][id]
      if(!watch.has(((e.y/32)|0)*100000+((e.x/32)|0)))continue
      checked++
      if(JSON.stringify(held[key]?.[id])!==JSON.stringify(e)){bad++
        if(bad<4){console.log('  MISMATCH '+key+' '+id.slice(0,8)+' tick '+st.tick)
          console.log('    truth :',JSON.stringify(e))
          console.log('    window:',JSON.stringify(held[key]?.[id]))
          console.log('    my pos:',mine.x+','+mine.y,' its zone:',((e.y/32)|0)*100000+((e.x/32)|0))
          console.log('    zones sent:',zones.join(','))
          console.log('    was in zbuf?',zd.has(((e.y/32)|0)*100000+((e.x/32)|0)))}}}}
  if(Object.keys(held.nodes).length!==Object.keys(st.nodes).length){bad++;console.log('  NODE COUNT DRIFT at tick '+st.tick)}
  for(const id in st.nodes){ if(held.nodes[id].depletedUntil!==st.nodes[id].depletedUntil){bad++
    if(bad<6)console.log('  NODE STATE DRIFT '+id+' at tick '+st.tick); break}}
}
console.log('intervals: 120, resyncs exercised: '+resyncs)
console.log('entities checked in view: '+checked)
console.log('nodes held by window: '+Object.keys(held.nodes).length+' of '+Object.keys(st.nodes).length+' (whole island)')
console.log(bad===0?'PASS — window matches pillar':'FAIL — '+bad+' mismatches')
process.exit(bad===0?0:1)
