// EVERY GAMBIT, FIRED, FRAME BY FRAME.
//
// Seven weapons have one and each is a different shape: a flurry of four, a
// whole blow that waits for the arm, a shot with everything in it. None of
// that can be judged from the code, and a still picture of a thing that
// lasts seven hundred milliseconds is not a judgement either.
//
// So this fires each one in the real window, in a real browser, and keeps
// every frame. The world is stood up the way sweep.mjs does it: the pillar's
// own frames, fed to the window's own handler, with nothing between.
//
// HOW A GAMBIT IS FIRED FROM OUTSIDE. The window does not watch for a verb,
// it watches the state: a citizen whose `lastSwing` has jumped PAST the
// current tick has spent their arm on one, because no ordinary swing ever
// does that. So two states, the second with the arm spent ahead of the
// clock, is a gambit as far as the window is concerned, which is as far as
// anything here needs it to be.
//
//   node gambitfilm.mjs                 all seven
//   node gambitfilm.mjs horn-bow        one of them
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import E from './engine.js'

const HERE = fileURLToPath(new URL('.', import.meta.url))
const OUT = process.env.FILM_OUT || (HERE + 'sweep-out/gambits')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const FRAMES = 26, STEP_MS = 40            // just over a second, which outlives every effect

const RANGED = new Set(['crossbow', 'dragonbow', 'great-crossbow', 'handgonne',
  'heartwood-bow', 'hollow-bow', 'horn-bow', 'iron-javelin', 'sigil-bow',
  'quick-javelin', 'steel-javelin', 'wooden-bow'])

const gambits = Object.entries(E.WEAPONS).filter(([, w]) => w && w.gambit)
  .map(([item, w]) => ({ item, kind: w.gambit, blows: w.blows ?? (w.gambit === 'flurry' ? 2 : 1) }))
const only = process.argv[2]
const plan = only ? gambits.filter((g) => g.item === only) : gambits
if (!plan.length) { console.log('no such gambit. have: ' + gambits.map((g) => g.item).join(', ')); process.exit(1) }

// one small world per weapon, with somebody to use it on
function sceneFor (item) {
  const g = E.makeGenesis('film', 'a'.repeat(64), 0, 48, 36)
  const s = E.newWorld(g)
  const me = 'f'.repeat(64)
  // Somewhere with light on it. The first films were fought on the Wilds'
  // dark brown, which is the one ground a yellow ring and a wooden shaft
  // both disappear into.
  const AT_X = +(process.env.FILM_X ?? 20), AT_Y = +(process.env.FILM_Y ?? 28)
  E.addPlayer(s, me, AT_X, AT_Y)
  const p = s.players[me]
  p.name = 'alder'
  p.equipment.weapon = { item, qty: 1 }
  for (const sk of Object.keys(p.skills)) p.skills[sk] = 20000
  const far = RANGED.has(item)
  s.mobs = { m1: { type: 'troll', x: AT_X + (far ? 5 : 1), y: AT_Y, health: 20, hx: AT_X, hy: AT_Y } }
  s.tick = 600                       // noon, so the fight is not fought in the dark
  p.lastSwing = 597
  const before = JSON.parse(JSON.stringify(s))
  // and the moment itself: the arm spent PAST the clock, and a target named
  s.tick = 601
  p.lastSwing = 606
  p.action = { type: 'attack', mobId: 'm1' }
  return { me, before, after: JSON.parse(JSON.stringify(s)) }
}

const WIN = readFileSync(HERE + 'window-web.html', 'utf8')
const BEFORE = `<script>
  window.WebSocket = class { constructor () { this.readyState = 1; this.binaryType = '' }
    send () {} close () {} addEventListener () {} }
  window.fetch = () => Promise.resolve({ ok: false, json: async () => null })
  window.AudioContext = undefined; window.webkitAudioContext = undefined

  // THE CLOCK IS DRIVEN, NOT WAITED FOR.
  //
  // The first cut of this waited forty milliseconds between captures and got
  // twenty-six copies of one still: under --virtual-time-budget Chrome races
  // the timers and barely runs an animation frame at all. Measured, the draw
  // loop ran SIX times in a second and a half.
  //
  // So the window's clock is replaced by one this script turns by hand, and
  // the animation frame is pumped rather than scheduled. performance.now and
  // the frame timestamp are the same number, which they have to be: an
  // effect is stamped with the first and aged against the second. The film
  // is exact as well as correct -- frame n is always the same picture.
  window.__clock = 1000
  window.__pending = []
  window.requestAnimationFrame = (f) => window.__pending.push(f)
  window.cancelAnimationFrame = () => {}
  const _perf = window.performance
  Object.defineProperty(window, 'performance', { configurable: true, value: {
    now: () => window.__clock, timeOrigin: _perf.timeOrigin,
    mark () {}, measure () {}, getEntriesByName: () => [],
  } })
  window.__turn = (ms) => {
    window.__clock += ms
    const due = window.__pending.splice(0, window.__pending.length)
    for (const f of due) { try { f(window.__clock) } catch (e) {} }
  }
</script>`

mkdirSync(OUT, { recursive: true })
const films = []
for (const g of plan) {
  const { me, before, after } = sceneFor(g.item)
  const AFTER = `<script>
    ;(async () => {
      try {
        onMessage({ data: JSON.stringify({ type: 'hello', playerId: ${JSON.stringify(me)} }) })
        try { entered = true } catch (e) {}
        for (const id of ['gate', 'gateinfo']) {
          const el = document.getElementById(id); if (el) el.style.display = 'none'
        }
        const cv = document.getElementById('world')
        const wait = (ms) => new Promise((r) => setTimeout(r, ms))
        onMessage({ data: JSON.stringify({ type: 'state', state: ${JSON.stringify(before)}, worldId: 'film' }) })
        await wait(60)
        for (let i = 0; i < 8; i++) window.__turn(${STEP_MS})   // the ground bakes, the body settles
        onMessage({ data: JSON.stringify({ type: 'state', state: ${JSON.stringify(after)}, worldId: 'film' }) })
        // CROPPED TO THE FIGHT. The whole window is eighteen tiles across and
        // the gambit happens in about six of them, so a full frame shown at a
        // readable width makes the ring four pixels wide. The camera centres
        // on the citizen, so the crop is taken from the middle and reaches
        // far enough right to hold a target five tiles away.
        const CW = Math.round(cv.width * 0.56), CH = Math.round(cv.height * 0.40)
        const CX = Math.round(cv.width / 2 - CW * 0.30), CY = Math.round(cv.height / 2 - CH / 2)
        const cut = document.createElement('canvas')
        cut.width = CW; cut.height = CH
        const cg = cut.getContext('2d')
        const out = []
        for (let i = 0; i < ${FRAMES}; i++) {
          window.__turn(${STEP_MS})
          await wait(0)                       // let anything the frame queued settle
          cg.clearRect(0, 0, CW, CH)
          cg.drawImage(cv, CX, CY, CW, CH, 0, 0, CW, CH)
          out.push(cut.toDataURL('image/png'))
        }
        const box = document.createElement('div'); box.id = 'film'
        box.textContent = out.join('|')
        document.body.appendChild(box)
        document.title = 'FILMDONE ' + out.length
      } catch (e) { document.title = 'FILMFAIL ' + e.message }
    })()
  </script>`
  const page = OUT + '/page-' + g.item + '.html'
  writeFileSync(page, WIN.replace('<head>', '<head>' + BEFORE).replace('</body>', AFTER + '</body>'))
  const dom = execFileSync(CHROME, ['--headless', '--disable-gpu', '--dump-dom', '--hide-scrollbars',
    '--virtual-time-budget=20000', '--window-size=1200,900', pathToFileURL(page).href],
    { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 })
  const title = (/<title>([^<]*)<\/title>/.exec(dom) || [, ''])[1]
  // ONLY THE BOX THE FRAMES WENT IN. Scraping every data:image/png in the
  // document picked up the window's own pictures too -- the minimap, an icon
  // or two -- so twenty-six frames came back as twenty-eight images and every
  // one of them was off by the difference.
  const box = /<div id="film">([\s\S]*?)<\/div>/.exec(dom)
  const uris = box ? box[1].split('|').filter((u) => u.startsWith('data:image/png')) : []
  console.log(`${g.item.padEnd(14)} ${g.kind.padEnd(7)} ${g.blows} blow(s)  ${title}  ${uris.length} frames`)
  if (!title.startsWith('FILMDONE')) continue
  const dir = OUT + '/' + g.item
  if (existsSync(dir)) rmSync(dir, { recursive: true })
  mkdirSync(dir, { recursive: true })
  uris.forEach((u, i) => writeFileSync(dir + '/' + String(i).padStart(2, '0') + '.png',
    Buffer.from(u.split(',')[1], 'base64')))
  // the frames go into the player itself, so the film is one file that can
  // be opened anywhere, with nothing beside it to lose
  films.push({ ...g, n: uris.length, dir: g.item, frames: uris })
}

// ---- A PLAYER, BECAUSE A GAMBIT IS NOT A PICTURE ----
const html = `<!doctype html><meta charset="utf-8"><title>interval: every gambit</title>
<style>
  body { font: 13px/1.5 Verdana, sans-serif; background: #191108; color: #d6c49c; margin: 0; padding: 14px }
  h1 { font-size: 17px; letter-spacing: .07em; color: #e2b63e; margin: 0 0 2px }
  p.note { color: #94805a; margin: 0 0 12px; max-width: 64em }
  .row { display: flex; flex-wrap: wrap; gap: 12px }
  .f { background: #241b10; border: 1px solid #3d3220; border-radius: 3px; padding: 6px; width: 400px }
  .f img { width: 100%; display: block; border-radius: 2px; background: #000 }
  .nm { color: #e2b63e; font-size: 13px; padding: 4px 2px 0 }
  .kd { color: #94805a; font-size: 11px; padding: 0 2px 4px }
  button { font: inherit; background: #291f12; color: #d6c49c; border: 1px solid #55462d;
           border-radius: 3px; padding: 3px 10px; cursor: pointer }
  #bar { margin: 0 0 12px; display: flex; gap: 8px; align-items: center }
</style>
<h1>EVERY GAMBIT, FIRED</h1>
<p class="note">The seven weapons that have one, each fired in the window itself and kept frame by
frame. A ring is thrown from the striker; a ranged one at distance sends a shaft and a sound for
every blow; the hit is counted where it lands. The blow count is the engine's own.</p>
<div id="bar"><button id="play">pause</button><button id="step">step</button>
  <span id="at"></span></div>
<div class="row">
${films.map((f, k) => `<div class="f"><img data-k="${k}" src="${f.frames[0]}">
  <div class="nm">${f.item.replace(/-/g, ' ')}</div>
  <div class="kd">${f.kind} &middot; ${f.blows} blow${f.blows === 1 ? '' : 's'}</div></div>`).join('\n')}
</div>
<script>
  const FILM = ${JSON.stringify(films.map((f) => f.frames))}
  const imgs = [...document.querySelectorAll('.f img')]
  let i = 0, on = true
  const show = () => {
    for (const im of imgs) {
      const fr = FILM[+im.dataset.k]
      im.src = fr[i % fr.length]
    }
    document.getElementById('at').textContent = 'frame ' + (i % ${FRAMES}) + ' of ${FRAMES}'
  }
  setInterval(() => { if (on) { i++; show() } }, ${STEP_MS * 2})
  document.getElementById('play').onclick = (e) => { on = !on; e.target.textContent = on ? 'pause' : 'play' }
  document.getElementById('step').onclick = () => { on = false; document.getElementById('play').textContent = 'play'; i++; show() }
  show()
</script>
`
writeFileSync(OUT + '/gambits.html', html)
console.log('\n' + films.length + ' gambits filmed -> ' + OUT + '/gambits.html')
