import E from './engine.js'
if (E.initCrypto) await E.initCrypto()
const RULES='a'.repeat(64), G=E.makeGenesis('aggro',RULES,0,40,30), WID=E.worldId(G)
const a=E.generateIdentity()
let s=E.newWorld(G); E.addPlayer(s,a.playerId,10,10)
const p=()=>s.players[a.playerId]
p().skills.attack=E.XP_TABLE[70]; p().skills.strength=E.XP_TABLE[70]; p().hp=E.effLevel(p().skills.hitpoints)
p().equipment.weapon={item:'star-sword',qty:1}
s.mobs['g1']={type:'goblin',x:11,y:10,hx:11,hy:10,hp:5,respawnAt:0}
const sign=(f)=>E.signInput({worldId:WID,playerId:a.playerId,...f},a.privateKey)
let bad=0; const ok=(c,m)=>{console.log((c?'  ok  ':'  FAIL')+'  '+m); if(!c)bad++}
for(let t=0;t<40 && s.mobs['g1'].hp>0;t++) s=E.nextState(s,[sign({tick:t,type:'attack',mobId:'g1',style:'even'})])
console.log('\n--- a goblin killed at its post ---')
ok(s.mobs['g1'].hp<=0, 'it is dead')
console.log('  grudge while dead:', s.mobs['g1'].mad ? 'held' : 'none')
// walk far away, then wait for the respawn
for(let t=0;t<30;t++) s=E.nextState(s,[sign({tick:s.tick,type:'move',dx:1,dy:0})])
while(s.mobs['g1'].hp<=0 && s.tick<400) s=E.nextState(s,[])
console.log('  risen at', s.mobs['g1'].x+','+s.mobs['g1'].y, ' hp', s.mobs['g1'].hp)
ok(s.mobs['g1'].mad === undefined, 'it rises without the grudge')
ok(s.mobs['g1'].lastSwing === undefined, 'and without a spent arm')
ok(Math.abs(s.mobs['g1'].x-11)<=1 && Math.abs(s.mobs['g1'].y-10)<=1, 'and at its own post (it may have taken a step since)')
ok(E.validateState(s)===null, 'the world validates')
process.exit(bad?1:0)
