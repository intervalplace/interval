// THE APP ICON, which was Unreal's.
//
//   node appicon.mjs
//
// A packaged build carries whatever `Engine/Build/IOS/Resources/Assets.xcassets`
// holds, and that is Epic's logo, so the app on a phone announced the engine
// it was built with rather than the world it opens. A project overrides it by
// putting its own asset catalogue at the same path under `Build/IOS/Resources`,
// which is what this writes.
//
// IT IS THE COAST, for the same reason the handbook's cover is. The island's
// shape falls out of `worldgen-expanse7.mjs` at the founding, so it can be
// drawn without publishing anything about what is ON the island, and it is the
// one image that is unmistakably this world and no other. A book and an app
// that carry the same picture are obviously the same thing, which is worth
// more than either of them having a cleverer mark.
//
// AND IT IS COMPUTED, NOT DRAWN. Nothing here is a file somebody exported
// once: add an isle to the generator and the next icon has it, exactly as the
// handbook's cover does.
import * as WG from './worldgen-expanse7.mjs'
import { execFileSync } from 'node:child_process'
import { mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = fileURLToPath(new URL('.', import.meta.url))
const OUT = HERE + '../interval/Build/IOS/Resources/Assets.xcassets/AppIcon.appiconset/'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

// The founding record holds the world's size; see the note in handbook.mjs for
// how 896 by 512 was established rather than guessed.
const WORLD_W = 896, WORLD_H = 512

const coast = () => {
  const g = { genesisSeed: WG.TALLYHOLM_SEED, worldW: WORLD_W, worldH: WORLD_H }
  const out = []
  for (let y = 0; y < WORLD_H; y++) {
    let x = 0
    while (x < WORLD_W) {
      if (WG.inSea(g, x, y)) { x++; continue }
      const from = x
      while (x < WORLD_W && !WG.inSea(g, x, y)) x++
      // A hair over one tall so the rows overlap; at exactly one the renderer
      // antialiases each row against the next and the island comes out striped.
      out.push(`<rect x="${from}" y="${y}" width="${x - from}" height="1.04"/>`)
    }
  }
  return out.join('')
}

// NO TRANSPARENCY AND NO ROUNDED CORNERS. iOS masks the corners itself and
// rejects an icon with an alpha channel, so this is a full square.
//
// The island is set a little above centre and large. At sixty points on a home
// screen the shape is all that survives, so it has to be the whole picture
// rather than a device sitting on a field.
const page = (px) => `<!doctype html><meta charset="utf-8"><style>
  html, body { margin: 0; width: ${px}px; height: ${px}px; }
  body { background: #171009;
    background-image: radial-gradient(70% 60% at 50% 38%, #241a0e 0%, #140e08 70%); }
  .coast { position: absolute; left: 6%; top: 50%; width: 88%;
    transform: translateY(-52%); }
  .coast path, .coast rect { fill: #d8c395; }
  .rule { position: absolute; left: 22%; right: 22%; bottom: 13.5%; height: ${
    Math.max(1, Math.round(px * 0.006))}px; background: #b9902a; }
</style>
<svg class="coast" viewBox="0 0 ${WORLD_W} ${WORLD_H}" xmlns="http://www.w3.org/2000/svg">
  <g>${coast()}</g></svg>
<div class="rule"></div>`

const SIZES = [
  ['Icon1024.png', 1024],
  ['IPadIcon83.5@2x.png', 167],
  ['IPadIcon76@2x.png', 152],
  ['IPhoneIcon60@2x.png', 120],
]

mkdirSync(OUT, { recursive: true })
// RENDERED AT EACH SIZE, not shrunk from the big one. A coastline is a great
// many one-pixel rows, and reducing that by a factor of eight turns a crisp
// edge into grey mush; drawing it into the frame it will live in keeps the
// silhouette hard at sixty points, which is the only size most people see.
for (const [name, px] of SIZES) {
  const tmp = OUT + '_icon.html'
  writeFileSync(tmp, page(px))
  execFileSync(CHROME, ['--headless', '--disable-gpu', '--hide-scrollbars',
    `--window-size=${px},${px}`, `--screenshot=${OUT}${name}`,
    pathToFileURL(tmp).href], { stdio: 'ignore' })
  // AND CHECKED FOR AN ALPHA CHANNEL RATHER THAN STRIPPED OF ONE. iOS refuses
  // an icon that has one. Chrome writes these opaque already because the body
  // has a background, so converting was solving a problem that did not exist,
  // and `sips --setProperty hasAlpha` refuses the job anyway. This asks, and
  // says so if the answer ever changes.
  const alpha = execFileSync('/usr/bin/sips', ['-g', 'hasAlpha', OUT + name],
    { encoding: 'utf8' })
  if (!/hasAlpha:\s*no/.test(alpha)) {
    throw new Error(`${name} has an alpha channel; iOS will refuse it`)
  }
  console.log(`${name.padEnd(22)} ${px}x${px}`)
}

writeFileSync(OUT + 'Contents.json', JSON.stringify({
  images: [
    { size: '60x60', idiom: 'iphone', filename: 'IPhoneIcon60@2x.png', scale: '2x' },
    { size: '76x76', idiom: 'ipad', filename: 'IPadIcon76@2x.png', scale: '2x' },
    { size: '83.5x83.5', idiom: 'ipad', filename: 'IPadIcon83.5@2x.png', scale: '2x' },
    { size: '1024x1024', idiom: 'ios-marketing', filename: 'Icon1024.png', scale: '1x' },
  ],
  info: { version: 1, author: 'interval' },
}, null, 2) + '\n')

writeFileSync(OUT + '../Contents.json', JSON.stringify(
  { info: { version: 1, author: 'interval' } }, null, 2) + '\n')
rmSync(OUT + '_icon.html', { force: true })
console.log('written to ' + OUT)
