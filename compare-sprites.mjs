// THE TWO KINDS OF ITEM ART, SIDE BY SIDE AT THE SIZE THEY ARE PRINTED.
//
// The handbook draws its items from Art/Icons: a photograph of the thing as
// it stands in the Unreal window, rendered to 512 and composed down to 128.
// The browser window draws its own, in canvas paths. One word therefore has
// two pictures, and a third if you count the mesh itself.
//
// THE SPRITES ARE NOT PIXEL ART. itemSprite is 1,219 lines and contains no
// drawImage, no getImageData, no bitmap of any kind -- 1,131 vector calls
// pinned to a 32-unit box only by `c.width = 32`. So they can be drawn at any
// size, and whether they belong in a printed book is an art question rather
// than a resolution one. This sheet is for answering it by looking.
//
// Both columns are at the handbook's own measurements: 7.6mm for an icon in
// running text and 36mm for a plate. Print it, or use the browser's print
// preview, and the millimetres are real.
//
//   node compare-sprites.mjs            writes the sheet and prints its path
import fs from 'node:fs'
import path from 'node:path'

const W = fs.readFileSync('window-web.html', 'utf8')
const ICONS = '/Users/matsjulner/Documents/Unreal Projects/interval/Art/Icons/'
const OUT = process.env.OUT || '/private/tmp/claude-501/-Users-matsjulner-Documents-Unreal-Projects-interval/d4aebce9-c39a-4f8e-86ec-ab2848a159a1/scratchpad/sprite-compare.html'

// A SPREAD, not a flattering selection: a tool, a blade in two metals, food,
// raw stuff, armour, and seven of the nineteen that had no drawing at all
// until today, which are the ones most worth doubting.
const SHOW = [
  'iron-hatchet', 'iron-sword', 'quick-sword', 'wooden-bow', 'iron-shield',
  'steel-helm', 'logs', 'ore', 'coal', 'gold-bar',
  'ale', 'cooked-fish', 'horn', 'seeds', 'rod', 'heartwood-rod',
  // the three that were reported as one picture, and the dead drawings the
  // check found beside them
  'coal', 'quick-stone', 'deep-fish', 'heartwood', 'great-hatchet',
  // drawn for the first time today
  'bread', 'flour', 'planks', 'torch', 'chart', 'graver', 'sapling', 'wolf-mask',
]

// ---- the window's own drawing code, lifted whole ----
const slice = (startsWith, endsAt) => {
  const a = W.indexOf(startsWith)
  if (a < 0) throw new Error('not found: ' + startsWith)
  const b = W.indexOf(endsAt, a + startsWith.length)
  return W.slice(a, b)
}
// A TABLE ENDS AT ITS OWN CLOSING BRACE, not at whatever happens to be
// declared next. Ending ICON_TINT at `const NODE_FAMILY` swept up the
// fall-stone block in between and declared it twice, which the parser caught
// and a looser check would not have.
const table = (name) => {
  const a = W.indexOf(`const ${name} = {`)
  if (a < 0) throw new Error('no table ' + name)
  return W.slice(a, W.indexOf('\n}', a) + 2)
}
const line = (starts) => {
  const a = W.indexOf(starts)
  if (a < 0) throw new Error('no line ' + starts)
  return W.slice(a, W.indexOf('\n', a))
}
const pieces = [
  'const ICON_CV = {}',                       // itemSprite's own cache
  table('METAL_PALETTE'),
  line('const METAL = (it) =>'),
  table('ICON_ALIAS'),
  table('ICON_TINT'),
  line('const isFallStoneId ='),
  line('const iconAliasOf ='),
  line('const iconTintOf'),
  slice('function itemSprite(', '\nconst ICONS = new Proxy'),
]
let code = pieces.join('\n')
// ONE CHANGE, AND IT IS THE POINT OF THE EXERCISE: the canvas is made at the
// size asked for and the context scaled, so the same paths are drawn large.
code = code
  .replace("const c = document.createElement('canvas'); c.width = 32; c.height = 32",
           "const c = document.createElement('canvas'); c.width = SIZE; c.height = SIZE")
  .replace("const g = c.getContext('2d')",
           "const g = c.getContext('2d'); g.scale(SIZE / 32, SIZE / 32)")
  .replace('function itemSprite(item) {', 'function itemSprite(item, SIZE) {\n  SIZE = SIZE || 32')
  .replace('if (ICON_CV[item]) return ICON_CV[item]', 'if (ICON_CV[item + SIZE]) return ICON_CV[item + SIZE]')
  .replace('return ICON_CV[item] = c', 'return ICON_CV[item + SIZE] = c')

const b64 = (w) => {
  const f = path.join(ICONS, w + '.png')
  return fs.existsSync(f) ? 'data:image/png;base64,' + fs.readFileSync(f).toString('base64') : ''
}
const rows = SHOW.map((w) => `  ['${w}', '${b64(w)}']`).join(',\n')

const html = `<!doctype html><meta charset="utf-8">
<title>interval: two kinds of item art</title>
<style>
  @page { size: A4 portrait; margin: 12mm }
  body { font: 11px/1.5 Verdana, sans-serif; color: #241f18; background: #efe9dc;
         margin: 0; padding: 10mm 12mm }
  h1 { font-size: 15px; margin: 0 0 2mm; letter-spacing: .06em }
  p.note { max-width: 150mm; color: #5a5146; margin: 0 0 6mm }
  .ruler { height: 4mm; width: 50mm; border: 1px solid #241f18; margin: 0 0 7mm;
           position: relative; background: repeating-linear-gradient(90deg,
             #241f18 0 .3mm, transparent .3mm 10mm) }
  .ruler span { position: absolute; top: 5mm; left: 0; font-size: 9px; color: #5a5146 }
  table { border-collapse: collapse; width: 100%; background: #f7f3ea }
  th, td { border-bottom: 1px solid #ddd3c0; padding: 2.5mm 3mm; text-align: center;
           vertical-align: middle }
  th { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #5a5146;
       border-bottom: 1.4px solid #8a7f6a }
  td.word { text-align: left; font-size: 11px; width: 34mm }
  td.word em { display: block; font-style: normal; font-size: 9px; color: #8a7f6a }
  .small { width: 7.6mm; height: 7.6mm; image-rendering: auto }
  .big { width: 36mm; height: 36mm; object-fit: contain }
  .on { background: #efe9dc }
</style>
<h1>ONE WORD, TWO PICTURES</h1>
<p class="note">Left of each pair is the handbook's rendered icon, a photograph of the
thing as it stands in the Unreal window. Right is the browser window's own canvas
drawing, redrawn here at full size rather than at 32 pixels. Both columns are at
the handbook's real measurements: <strong>7.6&nbsp;mm</strong> for an icon in running
text, <strong>36&nbsp;mm</strong> for a plate. Print this, or open the browser's print
preview, and the millimetres are true.</p>
<div class="ruler"><span>50 mm, to check your zoom</span></div>
<table>
  <tr><th></th><th colspan="2">at 7.6 mm, in running text</th>
      <th colspan="2">at 36 mm, a plate</th></tr>
  <tr><th></th><th>rendered</th><th>drawn</th><th>rendered</th><th>drawn</th></tr>
  <tbody id="rows"></tbody>
</table>
<script>
${code}
const SHOW = [
${rows}
]
const mm = 3.7795275591   // CSS px per mm at 96dpi
const tb = document.getElementById('rows')
for (const [word, png] of SHOW) {
  const tr = document.createElement('tr')
  const nice = word.replace(/-/g, ' ')
  tr.innerHTML = '<td class="word">' + nice + '</td>'
  for (const [cls, sizeMm] of [['small', 7.6], ['big', 36]]) {
    const a = document.createElement('td')
    a.className = 'on'
    if (png) { const im = new Image(); im.src = png; im.className = cls; a.appendChild(im) }
    else a.textContent = '--'
    tr.appendChild(a)
    const b = document.createElement('td')
    // drawn at twice the printed pixel count so the comparison is of the art
    // and not of the browser's upscaler
    const px = Math.round(sizeMm * mm * 2)
    const cv = itemSprite(word, px)
    cv.style.width = sizeMm + 'mm'; cv.style.height = sizeMm + 'mm'
    b.appendChild(cv)
    tr.appendChild(b)
  }
  tb.appendChild(tr)
}
</script>
`
fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, html)
console.log(OUT)
console.log('%d items, %d of them drawn for the first time today', SHOW.length, 8)
