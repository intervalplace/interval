// §for the mist window: TURNING, AND THE KEY THAT WOULD NOT LET GO.
//
// Reported from real play on a Mac: "when rotating the camera with the mouse I
// keep walking sideways, the same direction as before turning". Two faults, and
// either alone is survivable:
//
//   ·  did not clear the held keys, and losing a lock does
//     not deliver the keyup for whatever is down. So  stayed true.
//   · OUT of the lock,  returns early and  stops changing.
//
// Together: a citizen walking on in the last direction they were pointed, and a
// camera that will not turn to show you why. This drives the real handlers.

import { readFileSync } from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const THREE = require('three')
const noop = () => {}
const ctx2d = () => new Proxy({ measureText: () => ({ width: 10 }) }, { get: (t,k)=> (k in t?t[k]:noop), set: ()=>true })
const canvas = () => { const c = { width:320, height:240, style:{}, _h:{}, getContext:(k)=>(k==='2d'?ctx2d():null),
  addEventListener:(t,f)=>{(c._h[t]||=[]).push(f)}, requestPointerLock:noop, toDataURL:()=>'d',
  getBoundingClientRect:()=>({left:0,top:0,width:960,height:720}) }; return c }
const els={}, raf=[], win={}, doc={}
let CLOCK=1000
global.window = global
const glc = canvas()
global.document = { createElement: canvas, getElementById:(id)=>(els[id]||=(id==='gl'?glc:canvas())),
  addEventListener:(t,f)=>{(doc[t]||=[]).push(f)}, exitPointerLock:noop, pointerLockElement:null }
global.location={protocol:'http:',host:'x',search:''}
global.localStorage={getItem:()=>null,setItem:noop}
global.innerWidth=960; global.innerHeight=720
global.addEventListener=(t,f)=>{(win[t]||=[]).push(f)}
global.prompt=()=>''; global.AudioContext=undefined; global.fetch=async()=>({ok:false})
const def=(k,v)=>Object.defineProperty(global,k,{value:v,configurable:true})
def('navigator',{getGamepads:()=>[]}); def('crypto',{randomUUID:()=>'t'}); def('performance',{now:()=>CLOCK})
global.requestAnimationFrame=(fn)=>raf.push(fn)
const sent=[], socks=[]
global.WebSocket=class{constructor(){this.readyState=1;socks.push(this)}
  send(r){try{const m=JSON.parse(r);if(m.type==='act')sent.push(m.action)}catch{}} close(){}}
THREE.WebGLRenderer=class{constructor(){this.domElement=glc}
  setPixelRatio(){}setSize(){}setClearColor(){}clear(){}clearDepth(){}setRenderTarget(){}render(){}}
global.THREE=THREE
for (const b of [...readFileSync(process.argv[2]||'window-mist.html','utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1])) (0,eval)(b)
const frames=(n)=>{for(let i=0;i<n;i++){CLOCK+=34;for(const fn of raf.splice(0,raf.length))fn(CLOCK)}}
const send=(m)=>{for(const s of socks)s.onmessage({data:JSON.stringify(m)})}
const key=(k)=>{for(const f of win.keydown||[])f({key:k,preventDefault:noop,shiftKey:false})}
const mouse=(dx)=>{ global.document.pointerLockElement = glc
  for(const f of doc.mousemove||[])f({movementX:dx,movementY:0,clientX:0,clientY:0}) }
for(const s of socks) s.onopen&&s.onopen()
send({type:'hello',playerId:'me'})
const st=(t,x,y)=>({tick:t,genesis:{worldW:64,worldH:64,genesisSeed:'t'},
  players:{me:{x,y,hp:10,maxHp:10,gold:0,inventory:[],skills:{}}},mobs:{},nodes:{},ground:{}})
send({type:'state',state:st(900,20,20),worldId:'w'}); frames(4)
global.document.pointerLockElement = glc   // as clicking the door does
key('w'); frames(2)
sent.length=0
send({type:'state',state:st(901,20,19),worldId:'w'}); frames(2)
let bad = 0
const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL') + '  ' + m); if (!c) bad++ }
const last = () => sent.slice(-1)[0]
ok(last() && last().dx === 0 && last().dy === -1, 'holding W, it walks the way you face')
// now turn a quarter to the right
mouse(-Math.PI/2/0.0032); frames(2)
sent.length=0
send({type:'state',state:st(902,20,18),worldId:'w'}); frames(2)
ok(last() && last().dx === -1 && last().dy === 0, 'a quarter turn turns the walk with it')
mouse(-Math.PI/2/0.0032); frames(2)
sent.length=0
send({type:'state',state:st(903,21,18),worldId:'w'}); frames(2)
ok(last() && last().dx === 0 && last().dy === 1, 'and a half turn reverses it')
// and now the lock is lost, as Escape or macOS does it
global.document.pointerLockElement = null
for (const f of doc.pointerlockchange || []) f({})
sent.length = 0
send({ type: 'state', state: st(904, 21, 18), worldId: 'w' }); frames(2)
ok(sent.length === 0, 'and losing the lock stops the walk rather than running away with it')
// (it stops because the KEYS were cleared, not because walking is forbidden
// without a lock: that guard broke three checks that were right, and refusing
// an input because of how the window is focused is a bigger rule than this bug
// deserved.)
const src = readFileSync('window-mist.html', 'utf8')
ok(/for \(const k in keys\) keys\[k\] = false/.test(src.slice(src.indexOf("pointerlockchange"), src.indexOf("pointerlockchange") + 1200)),
   'because the lock drops the keys with it')
ok(/document\.hidden/.test(src), 'and a hidden tab does too')
console.log(bad ? '\n  ' + bad + ' failed'
  : '\n  ok    the walk follows the eye, and stops when nobody is steering')
process.exit(bad ? 1 : 0)
