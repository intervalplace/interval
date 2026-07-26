// The mirrors, across MANY SEEDS. One seed proved one world; the seating
// logic is where a client and a server most easily part company, and it
// only parts company on terrain neither has seen.
import { readFileSync } from 'fs'
import E from './engine.js'
import * as G from './worldgen-expanse4.mjs'
const ROOT = process.env.INTERVAL_ROOT ?? './'
const FILES = [['window-web.html','function terrainOfE(x, y) {'],
  ['window-3d.html','function terrainOfE(x, y) {'],
  ['window-photo.html','function terrainOfE(x, y) {'],
  ['window-grim.html','function terrainOfE(x, y) {'],
  ['window-grim3d.html','function terrainOfE(x, y) {'],
  ['window-holo.html','function terrainAt(x, y) {'],
  ['site/map.html','const V4 =']]
const SEEDS = ['solo-world','tallyholm','interval']
let allOk = true
for (const [f, endMark] of FILES) {
  const html = readFileSync(ROOT + f, 'utf8')
  const cands = ['function seedNumC()','function meander(','function thashE(']
    .map(k => html.indexOf(k)).filter(i => i >= 0)
  const src = html.slice(Math.min(...cands), html.indexOf(endMark))
  console.log(f)
  for (const seed of SEEDS) {
    const g = G.makeExpanse4Genesis(seed, 'f1b7060d09685d91'.padEnd(64,'0'), 0, 896, 512)
    const W = g.worldW, H = g.worldH
    const ownsWH = /\blet\s+W\s*=/.test(src)
    const shim = 'let GW='+W+',GH='+H+',GSEED='+JSON.stringify(seed)+',_seedNumC=null,GEN="interval-expanse-v4";'
      + (ownsWH ? '' : 'let W='+W+',H='+H+';')
      + (/function _v4dims/.test(src) ? '' : 'function _v4dims(){}')
    let win
    try { win = new Function(shim + src + ';if(typeof _v4dims==="function")_v4dims();return {biomeAtE4,onRoad4,settlementsE4,localeAt4}')() }
    catch (e) { console.log(seed.padEnd(12), 'LOAD FAIL', e.message.slice(0,60)); allOk=false; continue }
    let bio=0, road=0, loc=0
    for (let y=2;y<H-2;y+=6) for (let x=2;x<W-2;x+=6) {
      if (win.biomeAtE4(x,y)!==G.biomeAt(g,x,y)) bio++
      if (win.onRoad4(x,y)!==G.onRoad(g,x,y)) road++
      if ((win.localeAt4(x,y)??'')!==(G.localeAt(g,x,y)??'')) loc++
    }
    const ws=win.settlementsE4(), gs=G.settlementsOf(g)
    const bad=gs.filter(t=>{const u=ws.find(v=>v.tag===t.tag);return !u||u.x!==t.x||u.y!==t.y})
    const n=bio+road+loc+bad.length
    if (n) allOk=false
    console.log('  '+seed.padEnd(12), `biome ${bio} road ${road} locale ${loc} seats ${gs.length-bad.length}/${gs.length}`, n?' <-- MISMATCH '+bad.map(t=>t.tag).join(','):'')
  }
}
console.log('\n' + (allOk ? 'MIRROR AGREES ON EVERY SEED' : 'MIRROR DIVERGES'))
