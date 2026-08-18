import E from './engine.js'
if (E.initCrypto) await E.initCrypto()
const RULES='a'.repeat(64), M=E.XP_TABLE[99]
const SRC=(await import('fs')).readFileSync('engine.js','utf8')
const W=Function('return '+SRC.slice(SRC.indexOf('const WEAPONS = {')+'const WEAPONS = '.length, SRC.indexOf('\n};',SRC.indexOf('const WEAPONS = {'))+2))()

// ---------- 1. what does a javelin TEACH at each distance? ----------
console.log('\n--- what a javelin teaches ---')
for (const gap of [1,3]) {
  const G=E.makeGenesis('teach'+gap,RULES,0,60,40), WID=E.worldId(G)
  const a=E.generateIdentity(), b=E.generateIdentity()
  let s=E.newWorld(G); E.addPlayer(s,a.playerId,5,5); E.addPlayer(s,b.playerId,5+gap,5)
  const A=s.players[a.playerId], B=s.players[b.playerId]
  for(const p of [A,B]){ for(const k of ['attack','strength','defence','hitpoints','ranged']) p.skills[k]=M
    p.hp=E.effLevel(M); p.consignment={from:'f',route:['t'],leg:0,items:[{item:'logs',qty:1},...Array(27).fill(null)]} }
  A.equipment.weapon={item:'star-javelin',qty:1}; A.inventory[0]={item:'star-javelin',qty:500}
  const before={...A.skills}
  const sign=(f)=>E.signInput({worldId:WID,playerId:a.playerId,...f},a.privateKey)
  for(let t=0;t<40;t++) s=E.nextState(s,[sign({tick:t,type:'attackp',targetId:b.playerId,style:'even'})])
  const af=s.players[a.playerId].skills
  console.log(`  gap ${gap}: ranged +${af.ranged-before.ranged}  attack +${af.attack-before.attack}  strength +${af.strength-before.strength}  hitpoints +${af.hitpoints-before.hitpoints}`)
}

// ---------- 2. archer vs swordsman, both playing to win ----------
const PAIRS=20, T=Number(process.argv[2]??300)
function duel(archerWpn, otherWpn, startGap){
  const G=E.makeGenesis('d-'+archerWpn+'-'+otherWpn,RULES,0,600,PAIRS*3+8), WID=E.worldId(G)
  let s=E.newWorld(G); const ps=[]
  for(let i=0;i<PAIRS;i++){
    const y=3+i*3, a=E.generateIdentity(), b=E.generateIdentity()
    E.addPlayer(s,a.playerId,20,y); E.addPlayer(s,b.playerId,20+startGap,y)
    const A=s.players[a.playerId], B=s.players[b.playerId]
    for(const p of [A,B]){ for(const k of ['attack','strength','defence','hitpoints','ranged']) p.skills[k]=M
      p.hp=E.effLevel(M); p.consignment={from:'f',route:['t'],leg:0,items:[{item:'logs',qty:1},...Array(27).fill(null)]} }
    A.equipment.weapon={item:archerWpn,qty:1}
    const wa=W[archerWpn]; if(wa.ranged) A.inventory[0]={item:wa.selfAmmo?archerWpn:(wa.powder?'shot':'arrows'),qty:1000000}
    B.equipment.weapon={item:otherWpn,qty:1}
    const wb=W[otherWpn]; if(wb.ranged) B.inventory[0]={item:wb.selfAmmo?otherWpn:(wb.powder?'shot':'arrows'),qty:1000000}
    ps.push({a,b,done:null})
  }
  s.mobs={}
  const sign=(f,who)=>E.signInput({worldId:WID,playerId:who.playerId,...f},who.privateKey)
  const cheb=(x,y)=>Math.max(Math.abs(x.x-y.x),Math.abs(x.y-y.y))
  const wa=W[archerWpn], wb=W[otherWpn]
  for(let t=0;t<T;t++){
    const ins=[]
    for(const pr of ps){
      const A=s.players[pr.a.playerId], B=s.players[pr.b.playerId]
      if(!A||!B||pr.done) continue
      if(A.hp<=0){pr.done='melee';continue} if(B.hp<=0){pr.done='archer';continue}
      const g=cheb(A,B)
      // the archer: shoot when it can do so at range, otherwise keep away
      const aReady=s.tick-(A.lastSwing??-99)>=(wa.every??2)
      if(g>=2 && g<=(wa.reach??1) && aReady)
        ins.push(sign({tick:t,type:'attackp',targetId:pr.b.playerId,style:'even'},pr.a))
      else ins.push(sign({tick:t,type:'move',dx:A.x>=B.x?1:-1,dy:0},pr.a))
      // the other: strike when in reach, otherwise close
      const bReady=s.tick-(B.lastSwing??-99)>=(wb.every??2)
      if(g<=(wb.reach??1) && bReady)
        ins.push(sign({tick:t,type:'attackp',targetId:pr.a.playerId,style:'even'},pr.b))
      else ins.push(sign({tick:t,type:'move',dx:B.x>A.x?-1:1,dy:0},pr.b))
    }
    s=E.nextState(s,ins); s.mobs={}
  }
  let aw=0,bw=0,draw=0,ahp=0,bhp=0,gapEnd=0
  for(const pr of ps){
    const A=s.players[pr.a.playerId], B=s.players[pr.b.playerId]
    if(pr.done==='archer'||!B||B.hp<=0) aw++
    else if(pr.done==='melee'||!A||A.hp<=0) bw++
    else {draw++; ahp+=A.hp; bhp+=B.hp; gapEnd+=cheb(A,B)}
  }
  const n=draw||1
  console.log(`  ${(archerWpn+' vs '+otherWpn).padEnd(34)}gap ${startGap}  archer ${aw}  melee ${bw}  stalemate ${draw}` +
    (draw?`   (archer ${(ahp/n).toFixed(0)}hp, other ${(bhp/n).toFixed(0)}hp, ${(gapEnd/n).toFixed(1)} tiles apart)`:''))
}
console.log(`\n--- ${T}-interval duels, both playing to win, 20 each ---`)
duel('horn-bow','star-sword',5)
duel('dragonbow','star-sword',9)
duel('crossbow','star-spear',4)
duel('star-javelin','star-sword',3)
duel('horn-bow','horn-bow',5)
duel('dragonbow','horn-bow',9)
