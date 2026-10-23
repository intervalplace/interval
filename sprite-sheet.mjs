// EVERY PICTURE IN THE BOOK, ON ONE PAGE, TWICE.
//
// Once at 20mm so a fault is visible, and once at the 7.6mm it is actually
// printed at, because those are two different questions: whether the drawing
// is right, and whether it still says what it is at the size of a fingernail.
//
//   node sprite-sheet.mjs            writes the sheet and prints its path
import fs from 'node:fs'
import E from './engine.js'
import { spriteSvg, beastSvg } from './sprite-svg.mjs'

const OUT = process.env.OUT || '/private/tmp/claude-501/-Users-matsjulner-Documents-Unreal-Projects-interval/d4aebce9-c39a-4f8e-86ec-ab2848a159a1/scratchpad/sprite-sheet.html'
const list = (v) => v instanceof Set ? [...v] : Array.isArray(v) ? v : Object.keys(v || {})

const cells = []
for (const w of list(E.ITEMS).sort()) {
  const svg = spriteSvg(w)
  cells.push([w, svg, svg ? '' : 'no drawing'])
}
for (const w of Object.keys(E.MOB_STATS ?? {}).sort()) {
  let svg = null, why = ''
  try { svg = beastSvg(w) } catch (e) { why = e.message }
  cells.push([w, svg, why || (svg ? '' : 'no drawing'), true])
}

const html = `<!doctype html><meta charset="utf-8">
<title>interval: every drawing the book prints</title>
<style>
  body { font: 10px/1.3 Verdana, sans-serif; background: #efe9dc; color: #241f18;
         margin: 0; padding: 6mm 5mm }
  h1 { font-size: 13px; letter-spacing: .07em; margin: 0 0 1mm }
  p { margin: 0 0 4mm; color: #5a5146 }
  .grid { display: flex; flex-wrap: wrap; gap: 2mm }
  .c { width: 26mm; background: #f7f3ea; border: 1px solid #ddd3c0; padding: 1.2mm;
       text-align: center }
  .c.mob { background: #f1ece0 }
  .big { width: 20mm; height: 20mm; display: block; margin: 0 auto }
  .big svg { width: 100%; height: 100% }
  .row svg { width: 7.6mm; height: 7.6mm }
  .row { display: flex; align-items: center; justify-content: center; gap: 1.4mm;
         margin-top: .8mm; border-top: 1px solid #e6dcc8; padding-top: .8mm }
  .small { width: 7.6mm; height: 7.6mm }
  .nm { display: block; font-size: 8px; color: #4a4336; word-break: break-all }
  .bad { color: #a32; font-weight: bold }
</style>
<h1>EVERY DRAWING THE BOOK PRINTS</h1>
<p>${cells.length} pictures: ${cells.filter((c) => !c[3]).length} items and
${cells.filter((c) => c[3]).length} creatures, all of them the browser window's own.
Large at 20&nbsp;mm, and beside it the 7.6&nbsp;mm the book prints.</p>
<div class="grid">
${cells.map(([w, svg, why, mob]) => `<div class="c${mob ? ' mob' : ''}">
  ${svg ? `<div class="big">${svg}</div><div class="row">${svg}</div>`
        : `<div class="big bad">?</div>`}
  <span class="nm">${w}</span>${why ? `<span class="nm bad">${why}</span>` : ''}
</div>`).join('\n')}
</div>
`
fs.writeFileSync(OUT, html)
console.log(OUT)
console.log('%d pictures, %d with no drawing', cells.length, cells.filter((c) => !c[1]).length)
