// §6dj, for the mist window: DOES IT RESPECT THE WAIT.
//
// §0b/§0c: birth is two phases. A window that sends `attend` and `spawn` in
// the same breath gets the spawn refused for ten minutes and shows the person
// nothing at all — press the key, nothing happens, no reason given. This
// window did exactly that until it didn't. The test stands a new soul at the
// door and checks it knocks, waits like everyone, and crosses only when it may.
//
// fetch is stubbed to 404 here on purpose: no practice island is served, so
// this measures the WAIT alone, which must hold with or without Nought.
//
// Needs three.js:  npm i three@0.128.0

import { readFileSync } from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let THREE; try { THREE = require('three') } catch { console.log('  skip  no three'); process.exit(0) }
const noop = () => {}
const ctx2d = () => new Proxy({ measureText: () => ({ width: 10 }) },
  { get: (t,k)=> (k in t ? t[k] : noop), set: (t,k,v)=>(t[k]=v,true) })
const canvas = () => { const c = { width:320,height:240,style:{},_h:{},
  getContext:(k)=>(k==='2d'?ctx2d():null), addEventListener:(t,f)=>{(c._h[t]||=[]).push(f)},
  requestPointerLock:noop, toDataURL:()=>'data:' }; return c }
const els={}, raf=[], win={}; let CLOCK=1000
global.window=global
global.document={createElement:canvas,getElementById:(id)=>(els[id]||=canvas()),addEventListener:noop,exitPointerLock:noop,pointerLockElement:null}
global.location={protocol:'http:',host:'x'}
global.localStorage={getItem:()=>'birth',setItem:noop}
global.innerWidth=960; global.innerHeight=720
global.addEventListener=(t,f)=>{(win[t]||=[]).push(f)}
global.prompt=()=>''; global.AudioContext=undefined
const def=(k,v)=>Object.defineProperty(global,k,{value:v,configurable:true})
def('navigator',{getGamepads:()=>[]}); def('crypto',{randomUUID:()=>'birth'}); def('performance',{now:()=>CLOCK})
global.requestAnimationFrame=(fn)=>raf.push(fn)
global.fetch = async () => ({ ok: false, status: 404 })   // no pillar serving a founding
const sent=[], socks=[]
global.WebSocket=class{constructor(){this.readyState=1;socks.push(this)}
  send(r){try{const m=JSON.parse(r);if(m.type==='act')sent.push(m.action)}catch{}} close(){}}
THREE.WebGLRenderer=class{constructor(){this.domElement=canvas()}
  setPixelRatio(){}setSize(){}setClearColor(){}clear(){}clearDepth(){}setRenderTarget(){}render(){}}
global.THREE=THREE
for (const b of [...readFileSync('window-mist.html','utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1])) (0,eval)(b)
const frames=(n)=>{for(let i=0;i<n;i++){CLOCK+=40;for(const fn of raf.splice(0,raf.length))fn(CLOCK)}}
const key=(k)=>{for(const f of win.keydown||[])f({key:k,preventDefault:noop,shiftKey:false})}
const tap=(k)=>{key(k);for(const f of win.keyup||[])f({key:k,preventDefault:noop})}
const st = (tick, attend, born) => ({ tick, genesis:{worldW:64,worldH:64,genesisSeed:'b'},
  players: born ? { me:{x:10,y:10,hp:10,maxHp:10,inventory:[],gold:0} } : {},
  mobs:{}, nodes:{}, ground:{}, attend })
const send=(m)=>{for(const s of socks)s.onmessage({data:JSON.stringify(m)})}
for(const s of socks)s.onopen&&s.onopen()
send({type:'hello',playerId:'birthkey0123456789'}); frames(2)
let bad=0
const ok=(c,m)=>{console.log((c?'  ok  ':'  FAIL')+'  '+m); if(!c)bad++}

send({type:'state',state:st(500,[]),worldId:'w'}); frames(2)
ok(sent.some(a=>a.do==='attend'), 'it knocks when it has never knocked')
sent.length=0
const mine = [[500, 'birthkey0123456789'.slice(0,16)]]
// §0c: the vigil is VIGIL_TICKS = 300 and an interval is 1000ms. This window
// once believed a thousand and 600ms, and so refused a legal spawn for nearly
// seventeen minutes while the world had been open since the fifth.
send({type:'state',state:st(600,mine),worldId:'w'}); frames(2)
tap('e'); tap(' '); frames(2)
ok(!sent.some(a=>a.do==='spawn'), 'it refuses to cross while the vigil is green (100/300)')
send({type:'state',state:st(790,mine),worldId:'w'}); frames(2)
sent.length=0; tap('e'); frames(2)
ok(!sent.some(a=>a.do==='spawn'), 'still refuses at 290 ticks')
send({type:'state',state:st(800,mine),worldId:'w'}); frames(2)
sent.length=0; tap('e'); frames(2)
ok(sent.some(a=>a.do==='spawn'), 'it crosses the moment the vigil is ripe (300/300)')
// and it must NOT knock again once ripe: re-attending restarts the wait
sent.length=0
send({type:'state',state:st(1400,mine),worldId:'w'}); frames(4)
ok(!sent.some(a=>a.do==='attend'), 'a long-ripe soul is not sent back to the queue')
sent.length=0
send({type:'state',state:st(1560,mine,true),worldId:'w'}); frames(2)
ok(!sent.some(a=>a.do==='attend'), 'once in the world it stops knocking')
console.log(bad?'\n  '+bad+' failed':'\n  ok    the window knocks, waits like everyone, and crosses when it may')
process.exit(bad?1:0)
