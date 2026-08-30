// §6dj, for the mist window: WHAT IF THE WORLD IS NOT WELL-FORMED.
//
// A window that throws stops drawing. Not a wrong pixel — a black screen and
// a console nobody is reading. The pillar this was built against sends none of
// the states below, but a peer node, an older engine or a newer one might, and
// a window is not entitled to assume the world it is shown is tidy.
//
// Thirty malformed states, each one then USED: panels opened, keys pressed,
// deeds attempted — because half the reads of the world happen in a panel and
// a state that renders can still explode the moment somebody presses TAB.
//
// Needs three.js:  npm i three@0.128.0

import { readFileSync } from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const THREE = require('three')
const noop=()=>{}
const ctx2d=()=>new Proxy({measureText:()=>({width:10})},{get:(t,k)=>(k in t?t[k]:noop),set:()=>true})
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
def('navigator',{getGamepads:()=>[]});def('crypto',{randomUUID:()=>'f'});def('performance',{now:()=>CLOCK})
global.requestAnimationFrame=(fn)=>raf.push(fn)
const socks=[]
global.WebSocket=class{constructor(){this.readyState=1;socks.push(this)}send(){}close(){}}
THREE.WebGLRenderer=class{constructor(){this.domElement=canvas()}
  setPixelRatio(){}setSize(){}setClearColor(){}clear(){}clearDepth(){}setRenderTarget(){}render(){}}
global.THREE=THREE
for(const b of [...readFileSync('window-mist.html','utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]))(0,eval)(b)
const send=(m)=>{for(const s of socks)s.onmessage({data:JSON.stringify(m)})}
const key=(k)=>{for(const f of win.keydown||[])f({key:k,preventDefault:noop,shiftKey:false})}
const up=(k)=>{for(const f of win.keyup||[])f({key:k,preventDefault:noop})}
let thrown=[]
const frames=(n)=>{for(let i=0;i<n;i++){CLOCK+=40
  for(const fn of raf.splice(0,raf.length)){ try{fn(CLOCK)}catch(e){thrown.push(e.message)} }}}
for(const s of socks)s.onopen&&s.onopen()
send({type:'hello',playerId:'me'})
const base={tick:900,genesis:{worldW:64,worldH:64,genesisSeed:'f'},
  players:{me:{x:20,y:20,hp:10,maxHp:10,gold:0,inventory:[],skills:{}}},
  mobs:{},nodes:{},ground:{}}
const cases={
  'no players':          {...base, players:undefined},
  'no nodes':            {...base, nodes:undefined},
  'no mobs':             {...base, mobs:undefined},
  'no ground':           {...base, ground:undefined},
  'no genesis':          {...base, genesis:undefined},
  'genesis without size':{...base, genesis:{genesisSeed:'f'}},
  'no tick':             {...base, tick:undefined},
  'a null node':         {...base, nodes:{a:null}},
  'a node with no type': {...base, nodes:{a:{x:20,y:19}}},
  'a node off the map':  {...base, nodes:{a:{type:'tree',x:-9999,y:9e9}}},
  'a node at NaN':       {...base, nodes:{a:{type:'tree',x:NaN,y:20}}},
  'a mob with no type':  {...base, mobs:{m:{hp:3,x:21,y:20}}},
  'a mob with no hp':    {...base, mobs:{m:{type:'wolf',x:21,y:20}}},
  'a null inventory slot':{...base, players:{me:{...base.players.me, inventory:[null,{item:'logs'},undefined]}}},
  'an item with no name':{...base, players:{me:{...base.players.me, inventory:[{}]}}},
  'no inventory at all': {...base, players:{me:{x:20,y:20,hp:10}}},
  'a player with no x':  {...base, players:{me:{hp:10,maxHp:10,inventory:[]}}},
  'negative hp':         {...base, players:{me:{...base.players.me, hp:-4}}},
  'hp above max':        {...base, players:{me:{...base.players.me, hp:900}}},
  'a huge inventory':    {...base, players:{me:{...base.players.me, inventory:Array.from({length:200},()=>({item:'logs'}))}}},
  'a nameless neighbour':{...base, players:{...base.players, pal:{x:21,y:20,hp:5,inventory:[]}}},
  'an action to nowhere':{...base, players:{me:{...base.players.me, action:{type:'gather',nodeId:'gone'}}}},
  'an attack on nobody': {...base, players:{me:{...base.players.me, action:{type:'attack',mobId:'gone'}}}},
  'a trade to nobody':   {...base, players:{me:{...base.players.me, trade:{to:'gone',giveSlot:0,wantGold:5}}}},
  'a deed nobody knows': {...base, players:{me:{...base.players.me, deed:'wibble'}}},
  'markers that are not':{...base, markers:'nonsense'},
  'a bank that is a list':{...base, players:{me:{...base.players.me, bank:[1,2,3]}}},
  'equipment of nulls':  {...base, players:{me:{...base.players.me, equipment:{weapon:null,head:undefined}}}},
  'a consignment of air':{...base, players:{me:{...base.players.me, consignment:{}}}},
  'the empty state':     {},
}
let bad=0
for(const [name, st] of Object.entries(cases)){
  thrown=[]
  try { send({type:'state',state:st,worldId:'w'}) } catch(e){ thrown.push('onState: '+e.message) }
  frames(4)
  // and try to USE it, since a panel is where half the reads happen
  for(const k of ['Tab','e','q','r','m',' ','c','Escape','Escape']){ try{key(k);up(k)}catch(e){thrown.push('key '+k+': '+e.message)} }
  frames(4)
  for(const k of ['Escape','Escape']){ key(k);up(k) }
  if(thrown.length){ bad++; console.log('  FAIL  '+name+' \u2014 '+[...new Set(thrown)].slice(0,2).join(' | ')) }
  else console.log('  ok    '+name)
}
console.log(bad? '\n  '+bad+' of '+Object.keys(cases).length+' malformed states broke it'
                : '\n  ok    it survives every malformed state thrown at it')
process.exit(bad?1:0)
