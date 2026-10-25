// THE HUD, AT THE SIZE A PHONE ACTUALLY GIVES IT.
//
// The window is built on a desktop and read on a phone, and the panel is the
// half that suffers: it is a column of small dark boxes on a dark page, and
// whether they can be told apart is not a thing anybody can judge from the
// stylesheet. An empty pack slot was #191108 on a #14100a page, a difference
// of five units out of 255, and it looked fine in the editor.
//
// Same trick as sweep.mjs: the real window, in a real browser, fed the
// frames the pillar would send. This one photographs the PAGE rather than
// the canvas, because the panel is the thing in question.
//
//   node hudshot.mjs                 a phone
//   HUD_W=1280 HUD_H=900 node hudshot.mjs   a desktop
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import E from './engine.js'

const HERE = fileURLToPath(new URL('.', import.meta.url))
const OUT = process.env.HUD_OUT || (HERE + 'sweep-out')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const W = process.env.HUD_W || '430', H = process.env.HUD_H || '932'

// a small world, because the panel is what is being looked at
const g = E.makeGenesis('hud', 'a'.repeat(64), 0, 64, 48)
const world = E.newWorld(g)
const me = 'f'.repeat(64)
E.addPlayer(world, me, 20, 20)
const p = world.players[me]
p.name = 'alder'
p.health = 59
// some of the pack full and some of it empty, which is the case that matters:
// a slot with a thing in it was always visible and an empty one was not
p.inventory[0] = { item: 'iron-hatchet', qty: 1 }
p.inventory[1] = { item: 'logs', qty: 40 }
p.inventory[4] = { item: 'cooked-fish', qty: 3 }
p.equipment.weapon = { item: 'iron-sword', qty: 1 }
p.equipment.head = { item: 'iron-helm', qty: 1 }
for (const [sk, lv] of Object.entries({ woodcraft: 21, earthcraft: 25, shorecraft: 50, prowess: 50 })) {
  let xp = 0; while (E.levelForXp(xp) < lv) xp++
  p.skills[sk] = xp
}

const WIN = readFileSync(HERE + 'window-web.html', 'utf8')
const BEFORE = `<script>
  window.WebSocket = class { constructor () { this.readyState = 1; this.binaryType = '' }
    send () {} close () {} addEventListener () {} }
  window.fetch = () => Promise.resolve({ ok: false, json: async () => null })
  window.AudioContext = undefined; window.webkitAudioContext = undefined
</script>`
const AFTER = `<script>
  ;(async () => {
    try {
      onMessage({ data: JSON.stringify({ type: 'hello', playerId: ${JSON.stringify(me)} }) })
      try { entered = true } catch (e) {}
      for (const id of ['gate', 'gateinfo']) {
        const el = document.getElementById(id); if (el) el.style.display = 'none'
      }
      onMessage({ data: JSON.stringify({ type: 'state', state: ${JSON.stringify(world)}, worldId: 'hud' }) })
      await new Promise((r) => setTimeout(r, 700))
      document.title = 'HUDREADY'
    } catch (e) { document.title = 'HUDFAIL ' + e.message }
  })()
</script>`

mkdirSync(OUT, { recursive: true })
const page = OUT + '/hud-page.html'
writeFileSync(page, WIN.replace('<head>', '<head>' + BEFORE).replace('</body>', AFTER + '</body>'))
const shot = OUT + `/hud-${W}x${H}.png`
execFileSync(CHROME, ['--headless', '--disable-gpu', '--screenshot=' + shot, '--hide-scrollbars',
  '--force-device-scale-factor=2', '--virtual-time-budget=9000',
  '--window-size=' + W + ',' + H, pathToFileURL(page).href], { encoding: 'utf8', stdio: 'pipe' })
console.log(shot)
