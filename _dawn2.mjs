import { WebSocket } from 'ws'
let done=false
function look(){const ws=new WebSocket('ws://127.0.0.1:7777')
ws.on('message',d=>{const f=JSON.parse(d.toString());if(!f.sky)return
if(f.sky.dayAmt>0.92){console.log('DAY');done=true}
ws.close()})
ws.on('close',()=>{done?process.exit(0):setTimeout(look,15000)})
ws.on('error',()=>{if(!done)setTimeout(look,15000)})}
look();setTimeout(()=>{console.log('GAVEUP');process.exit(1)},1700000)
