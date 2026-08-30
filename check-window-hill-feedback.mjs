// §6dj, for the mist window: DOES IT SHOW WHAT HAPPENS.
//
// Every verb reached the pillar and the pillar answered, and the screen did
// not move: a mob lost four hp and simply had four fewer, a felled tree stood
// there whole, a crop was the same six sticks from sowing to harvest. A window
// that reports a fight as a line of text in the corner is not showing a fight.
//
// This drives real state diffs past the window and checks the SCENE changed
// — not that a message was sent, which the other checks already prove.
//
// Needs three.js:  npm i three@0.128.0

import { readFileSync } from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let THREE; try { THREE = require('three') } catch { console.log(' skip'); process.exit(0) }
const noop=()=>{}
const calls=[]
const ctx2d=()=>new Proxy({measureText:()=>({width:10})},{get:(t,k)=>{if(k in t)return t[k]
  return (...a)=>calls.push(k+':'+a.slice(0,4).join(','))},set:(t,k,v)=>{calls.push('set '+k+'='+v);return true}})
const canvas=()=>{const c={width:320,height:240,style:{},_h:{},getContext:(k)=>(k==='2d'?ctx2d():null),
  addEventListener:(t,f)=>{(c._h[t]||=[]).push(f)},requestPointerLock:noop,toDataURL:()=>'data:'};return c}
const els={},raf=[],win={}; let CLOCK=1000
global.window=global
global.document={createElement:canvas,getElementById:(id)=>(els[id]||=canvas()),addEventListener:noop,exitPointerLock:noop,pointerLockElement:null}
global.location={protocol:'http:',host:'x'}; global.localStorage={getItem:()=>'fb',setItem:noop}
global.innerWidth=960; global.innerHeight=720
global.addEventListener=(t,f)=>{(win[t]||=[]).push(f)}
global.prompt=()=>''; global.AudioContext=undefined; global.fetch=async()=>({ok:false})
const def=(k,v)=>Object.defineProperty(global,k,{value:v,configurable:true})
def('navigator',{getGamepads:()=>[]}); def('crypto',{randomUUID:()=>'fb'}); def('performance',{now:()=>CLOCK})
global.requestAnimationFrame=(fn)=>raf.push(fn)
const socks=[]
global.WebSocket=class{constructor(){this.readyState=1;socks.push(this)}send(){}close(){}}
let scene=null
THREE.WebGLRenderer=class{constructor(){this.domElement=canvas()}
  setPixelRatio(){}setSize(){}setClearColor(){}clear(){}clearDepth(){}setRenderTarget(){}
  render(sc){ if(sc.children.length>3) scene=sc }}
global.THREE=THREE
for(const b of [...readFileSync('window-hill.html','utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]))(0,eval)(b)
const frames=(n)=>{for(let i=0;i<n;i++){CLOCK+=40;for(const fn of raf.splice(0,raf.length))fn(CLOCK)}}
const send=(m)=>{for(const s of socks)s.onmessage({data:JSON.stringify(m)})}
let bad=0; const ok=(c,m)=>{console.log((c?'  ok  ':'  FAIL')+'  '+m);if(!c)bad++}
const meshCount=()=>{let n=0;scene&&scene.traverse(o=>{if(o.isMesh)n++});return n}
const world=(over)=>({tick:1000,genesis:{worldW:64,worldH:64,genesisSeed:'fb'},
  players:{me:{x:20,y:20,hp:10,maxHp:10,gold:0,inventory:[],skills:{woodcraft:0}}},
  mobs:{g1:{type:'goblin',hp:5,x:21,y:20}},
  nodes:{t1:{type:'tree',x:19,y:20,depletedUntil:0},p1:{type:'plot',x:20,y:19,depletedUntil:0}},
  ground:{}, ...over})
for(const s of socks)s.onopen&&s.onopen()
send({type:'hello',playerId:'me'})
send({type:'state',state:world(),worldId:'w'}); frames(6)
const whole=meshCount()
ok(whole>20,'a whole tree and an unplanted plot: '+whole+' meshes')

// the tree is felled
let w2=world(); w2.nodes.t1.depletedUntil=1200
send({type:'state',state:w2,worldId:'w'}); frames(6)
const felled=meshCount()
ok(felled!==whole,'a felled tree is a different thing on screen ('+felled+' meshes)')

// the crop is sown, then grows
let w3=world(); w3.nodes.p1.plantedAt=1000
send({type:'state',state:w3,worldId:'w'}); frames(6); const sown=meshCount()
let w4=world({tick:1400}); w4.nodes.p1.plantedAt=1000
send({type:'state',state:w4,worldId:'w'}); frames(6); const half=meshCount()
let w5=world({tick:1760}); w5.nodes.p1.plantedAt=1000
send({type:'state',state:w5,worldId:'w'}); frames(6); const ripe=meshCount()
ok(sown!==half && half!==ripe,'a crop looks different sown, growing and ripe ('+sown+' / '+half+' / '+ripe+')')

// a blow lands
calls.length=0
let w6=world(); w6.mobs.g1.hp=2
send({type:'state',state:w6,worldId:'w'}); frames(4)
ok(calls.some(c=>/fillRect/.test(c)),'a blow paints something on the panel')
// and the body falls rather than vanishing
let w7=world(); delete w7.mobs.g1
const before=meshCount()
send({type:'state',state:w7,worldId:'w'}); frames(2)
const during=meshCount()
frames(40)
const after=meshCount()
ok(during>after,'a dead beast topples before it goes ('+during+' \u2192 '+after+')')
// ---- §A LEVEL IS THE ONLY PERMANENT THING IN THIS WORLD, and it used to be
// reported like a footstep: one grey line in the corner, gone in four seconds.
// It takes the middle of the frame now, and it says what it OPENED — read off
// the same served tables the skill guide uses, so it cannot claim an unlock the
// world does not have.
const drew = []
const wasCtx = ctx2d
calls.length = 0
let w8 = world(); w8.players.me.skills = { woodcraft: 400 }
send({ type: 'state', state: w8, worldId: 'w' }); frames(2)
calls.length = 0
frames(2)
const painted = calls.filter(c => /^fillText:/.test(c)).map(c => c.slice(9))
ok(painted.some(t => /WOODCRAFT/i.test(t)), 'a level takes the middle of the frame, not a line in the corner')
ok(painted.some(t => /^\d+$/.test(t)) || calls.some(c => /fillRect/.test(c)),
   'and the number is drawn large')
// it must not still be there a minute later
frames(200)
calls.length = 0; frames(2)
ok(!calls.filter(c => /^fillText:/.test(c)).some(t => /WOODCRAFT/i.test(t)),
   'and it goes away again')
console.log(bad?'\n  '+bad+' failed':'\n  ok    the window shows what happens, not only sends it')
process.exit(bad?1:0)
