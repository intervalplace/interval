// §6dj, for the mist window: DEATH IS A STATE, NOT A GAP.
//
// §6c: five intervals after you fall the world puts you back at the founding
// with your health whole. It is processed at the top of a tick and needs no
// input at all. This window used to offer a dead citizen a `wake` that sent
// `spawn` — the input for a soul NOT in the world, refused for one who is —
// so on the single screen where a person most needs telling what is happening,
// it showed an unchanged HUD with the bar at zero and a button that did
// nothing. What they need is the count, and that the count is not theirs.
//
// Needs three.js:  npm i three@0.128.0

import { readFileSync } from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const THREE = require('three')
const noop=()=>{}
const painted=[]
const ctx2d=()=>new Proxy({measureText:()=>({width:10})},{get:(t,k)=>{if(k in t)return t[k]
  return (...a)=>{if(k==='fillText')painted.push(String(a[0]))}},set:(t,k,v)=>true})
const canvas=()=>{const c={width:320,height:240,style:{},_h:{},getContext:(k)=>(k==='2d'?ctx2d():null),
  addEventListener:(t,f)=>{(c._h[t]||=[]).push(f)},requestPointerLock:noop,toDataURL:()=>'d'};return c}
const els={},raf=[],win={}; let CLOCK=1000
global.window=global
global.document={createElement:canvas,getElementById:(id)=>(els[id]||=canvas()),addEventListener:noop,exitPointerLock:noop,pointerLockElement:null}
global.location={protocol:'http:',host:'x',search:''}
global.localStorage={getItem:()=>null,setItem:noop}
global.innerWidth=960;global.innerHeight=720
global.addEventListener=(t,f)=>{(win[t]||=[]).push(f)}
global.prompt=()=>'';global.AudioContext=undefined;global.fetch=async()=>({ok:false})
const def=(k,v)=>Object.defineProperty(global,k,{value:v,configurable:true})
def('navigator',{getGamepads:()=>[]});def('crypto',{randomUUID:()=>'d'});def('performance',{now:()=>CLOCK})
global.requestAnimationFrame=(fn)=>raf.push(fn)
const sent=[],socks=[]
global.WebSocket=class{constructor(){this.readyState=1;socks.push(this)}
  send(r){try{const m=JSON.parse(r);if(m.type==='act')sent.push(m.action.do)}catch{}}close(){}}
let cam=null
THREE.WebGLRenderer=class{constructor(){this.domElement=canvas()}
  setPixelRatio(){}setSize(){}setClearColor(){}clear(){}clearDepth(){}setRenderTarget(){}
  render(sc,c){if(sc.children.length>3)cam=c}}
global.THREE=THREE
for(const b of [...readFileSync('window-mist.html','utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]))(0,eval)(b)
const frames=(n)=>{for(let i=0;i<n;i++){CLOCK+=40;for(const fn of raf.splice(0,raf.length))fn(CLOCK)}}
const send=(m)=>{for(const s of socks)s.onmessage({data:JSON.stringify(m)})}
const key=(k)=>{for(const f of win.keydown||[])f({key:k,preventDefault:noop,shiftKey:false})}
const up=(k)=>{for(const f of win.keyup||[])f({key:k,preventDefault:noop})}
let bad=0; const ok=(c,m)=>{console.log((c?'  ok  ':'  FAIL')+'  '+m);if(!c)bad++}
const st=(over)=>({tick:900,genesis:{worldW:64,worldH:64,genesisSeed:'d'},
  players:{me:{x:20,y:20,hp:10,maxHp:10,gold:0,inventory:[],skills:{},deaths:0,wounds:0,...over}},
  mobs:{},nodes:{t1:{type:'tree',x:19,y:20,depletedUntil:0}},ground:{}})
for(const s of socks)s.onopen&&s.onopen()
send({type:'hello',playerId:'me'}); send({type:'state',state:st(),worldId:'w'}); frames(6)
const alive=cam.position.y
// now fall
send({type:'state',state:st({hp:0,deadUntil:905,deaths:1,wounds:1}),worldId:'w'}); frames(30)
painted.length=0; frames(2)
ok(painted.some(t=>/YOU FELL/.test(t)),'the screen says you fell')
ok(painted.some(t=>/STANDS YOU UP/.test(t)),'and how long until the world stands you up')
ok(cam.position.y < alive-0.4,'the eye drops to the grass ('+alive.toFixed(2)+' \u2192 '+cam.position.y.toFixed(2)+')')
sent.length=0
for(const k of ['w','a','s','d']){key(k);up(k)}; frames(4)
ok(!sent.includes('move'),'you cannot walk while you are down')
key('e');up('e');key(' ');up(' ');frames(4)
ok(!sent.includes('spawn'),'and it does not offer a wake the world would refuse')
ok(!sent.includes('gather'),'nor a deed')
// the world stands you up
send({type:'state',state:st({hp:10}),worldId:'w'}); frames(30)
ok(cam.position.y > alive-0.2,'and the eye comes back up when it does')
sent.length=0; key('w');up('w');frames(4)
ok(sent.includes('move'),'and you can walk again')
console.log(bad?'\n  '+bad+' failed':'\n  ok    death is a state the window shows, and does not ask you to fix')
process.exit(bad?1:0)
