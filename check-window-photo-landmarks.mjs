// §7f-ix, for the photo window: BUILD EVERY LANDMARK AND LOOK AT WHAT CAME OUT.
//
// Fifty-five of the ninety-seven landmark kinds had no arm in this window's
// drawing chain, so every one of them fell to the `else` at the bottom, which
// built a hull and a mast: a meadow of beached boats, 1,821 of them on the
// island. And the hull was built with `mats.trunk`, which was used fourteen
// times in the file and defined NOWHERE, so they were WHITE boats, because
// `new THREE.Mesh(geo, undefined)` neither fails nor warns -- three.js hands
// the mesh a default MeshBasicMaterial, which is unlit white.
//
// Both faults are silent by construction. Neither a grep of the source nor a
// reading of the tables finds them: the only thing that does is building each
// kind and looking at the meshes. So that is what this does. It runs the
// landmark block against the REAL three.js, with the one-line stubs the block
// reaches outside itself, and asks three questions of each kind:
//
//   does it build at all
//   did it make anything
//   is every material a material, rather than three.js's white default
//
// SLOW-ISH but not slow: no world is founded, no renderer is made.
//
// Needs three.js:  npm i three@0.128.0
import { readFileSync } from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let THREE, E
try { THREE = require('three'); E = require('./engine.js') }
catch (e) { console.log('  skip  ' + e.message.split('\n')[0]); process.exit(0) }

let bad = 0
const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL') + '  ' + m); if (!c) bad++ }

const src = readFileSync('window-photo.html', 'utf8')

// ---- the tables and helpers the block reads, sliced from the window ----
const slice = (from, to) => {
  const a = src.indexOf(from)
  if (a < 0) throw new Error('window-photo no longer has: ' + from)
  const b = src.indexOf(to, a)
  if (b < 0) throw new Error('window-photo no longer has: ' + to)
  return src.slice(a, b)
}
const TABLES = slice('const LM_TREE = {', 'const famOf =')

// ---- the landmark block itself ----
const blockStart = src.indexOf("  if (n.type === 'landmark') {")
if (blockStart < 0) { console.log('  FAIL  window-photo has no landmark branch'); process.exit(1) }
let depth = 0, blockEnd = -1
for (let i = src.indexOf('{', blockStart); i < src.length; i++) {
  if (src[i] === '{') depth++
  else if (src[i] === '}') { depth--; if (!depth) { blockEnd = i + 1; break } }
}
const BLOCK = src.slice(blockStart, blockEnd)

// ---- what the block reaches outside itself, and nothing more ----
const PRELUDE = `
// the window's own report is in the slice; catch what it says rather than
// stubbing it, so the test exercises the real thing
const console = { warn: (m) => warned.push(m), log: () => {} }
const tileHash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 2246822519) >>> 0
  h = (h ^ (h >>> 13)) * 1274126177 >>> 0
  return (h ^ (h >>> 16)) >>> 0 }
const _tint = new Map()
const tintedMat = (hex, rough = 0.9, extra = null) => {
  const k = hex + ':' + rough + (extra ? ':' + JSON.stringify(extra) : '')
  let m = _tint.get(k)
  if (!m) { m = new THREE.MeshStandardMaterial({ color: hex, roughness: rough, ...(extra ?? {}) }); _tint.set(k, m) }
  return m
}
const _leaf = new Map()
const leafMat = (hex, extra = null) => {
  const k = hex + (extra ? ':' + JSON.stringify(extra) : '')
  let m = _leaf.get(k)
  if (!m) { m = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.9, ...(extra ?? {}) }); _leaf.set(k, m) }
  return m
}
const canopyGeo = () => new THREE.IcosahedronGeometry(1, 1)
const rockGeo = () => new THREE.IcosahedronGeometry(1, 0)
const smokeTex = null
const mats = {}
const LM18 = new Set(${JSON.stringify([...(await import('./terrain-mirror.mjs')).LM18])})
`
// every material name the file defines, so the stub table is the real one
const matNames = (() => {
  const i = src.indexOf('const mats = {')
  let d = 0, close = -1
  for (let k = src.indexOf('{', i); k < src.length; k++) {
    if (src[k] === '{') d++
    else if (src[k] === '}') { d--; if (!d) { close = k; break } }
  }
  const body = src.slice(src.indexOf('{', i) + 1, close)
  const names = new Set([...body.matchAll(/^ {2}([A-Za-z_][A-Za-z0-9_]*)\s*:/gm)].map((m) => m[1]))
  for (const m of src.matchAll(/\bmats\.([A-Za-z_][A-Za-z0-9_]*)\s*=/g)) names.add(m[1])
  return [...names]
})()
const MATS = '\n' + matNames.map((k) =>
  `mats.${k} = new THREE.MeshStandardMaterial({ name: ${JSON.stringify(k)} })`).join('\n') + '\n'

const build = new Function('THREE', 'kind', 'x', 'y', 'warned', `
${PRELUDE}
${MATS}
${TABLES}
const n = { type: 'landmark', kind, x, y, id: 'lm-' + kind, text: 'words' }
const g = new THREE.Group()
g.userData = {}
const hsh9 = tileHash(x, y, 29)
const add = (mesh, px = 0, py = 0, pz = 0, shadow = true) => {
  mesh.position.set(px, py, pz); mesh.castShadow = shadow
  if (shadow) mesh.receiveShadow = true
  g.add(mesh); return mesh
}
${BLOCK}
// the block ends in its own \`return g\`, so anything after it is unreachable
return g
`)

const kinds = [...E.LANDMARK_KINDS]
const threw = [], empty = [], whiteMats = [], reported = []
for (const kind of kinds) {
  // three positions, because the shapes branch on a hash of where they stand
  for (const [x, y] of [[40, 40], [41, 97], [233, 11]]) {
    const warned = []
    let g
    try { g = build(THREE, kind, x, y, warned) }
    catch (e) { threw.push(`${kind}: ${e.message}`); break }
    if (!g) { empty.push(kind); continue }
    let meshes = 0
    g.traverse((o) => {
      if (!o.isMesh && !o.isSprite) return
      meshes++
      const m = o.material
      if (!m || (m.isMeshBasicMaterial && m.color?.getHex() === 0xffffff && !m.name))
        whiteMats.push(`${kind}: a mesh with three.js's default white material`)
    })
    if (!meshes) empty.push(kind)
    if (warned.length) reported.push(kind)
  }
}
// ---- 2. and does it stand on the ground, at a size a person could walk past ----
//
// Geometry that builds is not geometry that is right. The two ways a prop goes
// wrong without throwing are SCALE (a bench the size of a keep, a pine the
// size of a bench) and PLACEMENT (a thing floating over the ground, or buried
// in it). Both are obvious in a picture and invisible to every other check.
// The world is one tile to one unit and a citizen is about 1.7 units tall.
//
// THESE BOUNDS ARE GROSS, NOT TASTEFUL. A first pass set them tight and every
// failure it reported was the art being right: a mark on the ground IS flat
// (a wheel rut is 0.000 tall, which is what a rut is), a standing stone IS set
// into the ground, and a monument tree IS seven tiles wide, because that is
// what makes it a monument. Judging whether a thing looks good is a job for
// eyes. This only catches a prop that could not possibly be what it says.
const SANE = { low: -1.4, high: 13, wide: 9, float: 0.9 }
const sized = [], sunk = []
for (const kind of kinds) {
  let g
  try { g = build(THREE, kind, 40, 40, []) } catch { continue }
  if (!g) continue
  const box = new THREE.Box3().setFromObject(g)
  if (!isFinite(box.min.y) || !isFinite(box.max.y)) { sized.push(`${kind}: no extent at all`); continue }
  const h = box.max.y - box.min.y
  const w = Math.max(box.max.x - box.min.x, box.max.z - box.min.z)
  if (h > SANE.high) sized.push(`${kind}: ${h.toFixed(1)} tiles tall`)
  if (w > SANE.wide) sized.push(`${kind}: ${w.toFixed(1)} tiles wide`)
  // a mark is allowed to be flat; nothing is allowed to have no extent at all
  if (box.max.y <= 0.001 && w < 0.02) sized.push(`${kind}: no extent in any direction`)
  if (box.min.y < SANE.low) sunk.push(`${kind}: buried, reaching ${box.min.y.toFixed(2)} down`)
  if (box.min.y > SANE.float) sunk.push(`${kind}: floats, its lowest point is ${box.min.y.toFixed(2)} up`)
}
ok(sized.length === 0, sized.length ? 'wrong size: ' + sized.slice(0, 8).join('; ')
  : 'every kind is a size a citizen could walk past')
ok(sunk.length === 0, sunk.length ? 'off the ground: ' + sunk.slice(0, 8).join('; ')
  : 'every kind stands on the ground rather than in it or over it')

ok(threw.length === 0, threw.length ? 'kinds that threw: ' + threw.slice(0, 6).join('; ')
  : 'every one of the ' + kinds.length + ' landmark kinds builds')
ok(empty.length === 0, empty.length ? 'kinds that drew NOTHING: ' + [...new Set(empty)].join(' ')
  : 'every kind puts at least one mesh in the world')
ok(whiteMats.length === 0, whiteMats.length
  ? [...new Set(whiteMats)].slice(0, 6).join('; ') + ' (and ' + whiteMats.length + ' in all)'
  : 'no mesh is built with a material that does not exist')
// and the fallback must be REACHED by nothing, because every word is drawn
ok(reported.length === 0, reported.length
  ? 'kinds that fell through to the fallback: ' + [...new Set(reported)].join(' ')
  : 'no kind falls through to the fallback')
console.log(bad ? '\n  ' + bad + ' failed' : '\n  ok    the island has no undrawn landmark left in it')
process.exit(bad ? 1 : 0)
