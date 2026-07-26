// Two independent builds must agree, tile for tile and node for node. The
// router is the new risk: a heap that returns ties in insertion order would
// place a road one tile apart on two engines and fork the world silently.
import * as X from '/home/claude/work/interval-main/worldgen-expanse4.mjs'
const R='f1b7060d09685d91'.padEnd(64,'0')
const a=X.makeExpanse4Genesis('tallyholm',R,0,896,512)
const b=X.makeExpanse4Genesis('tallyholm',R,0,896,512)
console.log('geographyHash equal:', a.geographyHash===b.geographyHash, a.geographyHash.slice(0,16))
// re-route from scratch and compare paths exactly
const p1=X.routedPathsOf(a).map(r=>r.tag+':'+r.path.map(([x,y])=>x+','+y).join(' '))
const fresh=X.roadSegsOf(a).filter(([,,t])=>t!==X.CAUSEWAY_TAG)
  .map(([s,e,t])=>t+':'+X.routePath(a,s.x,s.y,e.x,e.y).map(([x,y])=>x+','+y).join(' '))
console.log('routes reproducible:', JSON.stringify(p1)===JSON.stringify(fresh))
console.log('road tiles:', X.roadTilesOf(a).size)
// reversed-direction sanity: cost is symmetric, so A->B and B->A should
// have the same LENGTH even though the tie-break may pick a mirrored line
const segs=X.roadSegsOf(a).filter(([,,t])=>t!==X.CAUSEWAY_TAG)
let same=0
for(const [s,e,t] of segs){
  const f=X.routePath(a,s.x,s.y,e.x,e.y), r=X.routePath(a,e.x,e.y,s.x,s.y)
  if(Math.abs(f.length-r.length)<=2) same++
}
console.log('routes stable under reversal:', same+'/'+segs.length)
