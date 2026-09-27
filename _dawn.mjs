import { WebSocket } from 'ws'
let done=false
function look(){const ws=new WebSocket('ws://127.0.0.1:7777')
ws.on('message',d=>{const f=JSON.parse(d.toString());if(!f.sky)return
if(f.sky.dayAmt>0.92){const ps=Object.values(f.players)
console.log('DAY '+JSON.stringify(ps.map(p=>({x:p.x,y:p.y}))));done=true}
ws.close()})
ws.on('close',()=>{done?process.exit(0):setTimeout(look,20000)})
ws.on('error',()=>{if(!done)setTimeout(look,20000)})}
look();setTimeout(()=>{console.log('GAVEUP');process.exit(1)},1700000)
