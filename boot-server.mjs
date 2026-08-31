// Interval boot server.
// ===========================================================================
// Founding a world takes real time: two worldgens, a certified catch-up, and
// on a cold start the practice island as well. Until that finished, the HTTP
// port was not bound, so a browser got ECONNREFUSED -- which is what a machine
// that does not exist looks like. A citizen concludes the world is gone, and a
// window fails over away from a node that was seconds from ready.
//
// Nobody minds a game loading. RuneScape loaded. What nobody forgives is a
// blank nothing with no reason attached.
//
// This cannot live on the main thread. Worldgen is straight-line synchronous
// JavaScript: while it runs the event loop is blocked and a bound socket still
// answers nothing. So the boot server runs in a WORKER, which owns the port
// from the first moment and keeps answering while the main thread grinds. When
// the world is up the worker hands the port back and exits.
//
// It serves exactly two things and knows nothing about the world:
//   GET /api/status  -> { booting: true, stage, pct, since }
//   anything else    -> a page with a progress bar that reloads when ready
import http from 'node:http'
import { parentPort, workerData } from 'node:worker_threads'

const PORT = workerData?.port ?? 8787
const started = Date.now()
let stage = 'founding the world'
let pct = 0

// THE BAR MUST MOVE WHILE THE MAIN THREAD CANNOT SPEAK.
//
// Progress arrives at stage boundaries, and a single worldgen chunk can run for
// fifteen seconds without yielding -- so a bar fed only by messages sits dead
// still through the longest waits, which is exactly when a person decides the
// page is broken and closes it.
//
// So the worker creeps on its own between messages, and never past what it has
// actually been told plus a small margin. It cannot overtake the truth, and it
// cannot reach the end on its own: a bar that fills and then waits is a lie,
// and this world is not in the business of those.
let told = 0
let live = null
setInterval(() => { if (pct < told + 6) pct = Math.min(told + 6, pct + 1) }, 900).unref?.()

// The main thread posts progress. It cannot post while it is blocked inside a
// worldgen chunk, so the bar advances in steps at stage boundaries rather than
// smoothly -- honest about what is happening, which is better than a fake
// animation that keeps moving after the process has died.
parentPort?.on('message', (m) => {
  if (m?.type === 'progress') {
    stage = m.stage ?? stage
    told = Math.max(told, m.pct ?? told)
    pct = Math.max(pct, told)
  }
  if (m?.type === 'done') {
    // NAME THE MOMENT. A bar that vanishes leaves somebody wondering whether it
    // worked; a line saying the world is live at interval 41,208 tells them
    // what they waited for and that it is a real, running thing with a clock.
    // It also proves the number is not decoration: they can watch it move.
    live = { tick: m.tick ?? null, worldId: m.worldId ?? null }
    stage = 'ready'; pct = 100; told = 100
    // Held briefly so a poller actually SEES this before the port changes
    // hands. The real server cannot bind until this closes, and nobody can
    // connect during the gap anyway, so the second is free.
    setTimeout(() => server.close(() => process.exit(0)), 1200)
  }
})

const PAGE = () => `<!doctype html><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Interval — founding</title>
<style>
 html,body{margin:0;height:100%;background:#14110b;color:#c9a227;
   font:13px Verdana,Geneva,sans-serif;display:flex;align-items:center;justify-content:center}
 .box{width:min(420px,86vw);text-align:center}
 h1{font:20px Georgia,serif;letter-spacing:.22em;margin:0 0 6px;color:#e8d9a0}
 .sub{color:#8a7a55;margin-bottom:20px}
 .bar{height:12px;background:#241f16;border:1px solid #6e5433;overflow:hidden}
 .fill{height:100%;width:0;background:#c9a227;transition:width .5s ease}
 .stage{margin-top:10px;color:#8a7a55;min-height:1.3em}
 .note{margin-top:26px;color:#5f5540;line-height:1.6}
</style>
<div class="box">
  <h1>INTERVAL</h1>
  <div class="sub">This node is founding its world.</div>
  <div class="bar"><div class="fill" id="f"></div></div>
  <div class="stage" id="s">starting</div>
  <div class="note">Paid once, at startup. The world itself is already running —
    if you are in a hurry, any other peer will serve you now.</div>
</div>
<script>
// Polls its own origin. When /api/status stops reporting a boot, the node has
// taken the port back and a reload lands in the world.
setInterval(async () => {
  try {
    const r = await fetch('/api/status', { cache: 'no-store' })
    const j = await r.json()
    if (!j.booting) {
      const n = j.live && j.live.tick
      document.getElementById('f').style.width = '100%'
      document.getElementById('s').textContent = n
        ? 'This world is live at interval ' + n.toLocaleString() + '.'
        : 'This world is live.'
      return setTimeout(() => location.reload(), 900)
    }
    document.getElementById('f').style.width = (j.pct || 0) + '%'
    document.getElementById('s').textContent = j.stage || ''
  } catch { location.reload() }   // port handed over mid-poll: try the world
}, 700)
</script>`

const server = http.createServer((req, res) => {
  const cors = { 'Access-Control-Allow-Origin': '*' }
  if ((req.url || '/').split('?')[0] === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors })
    return res.end(JSON.stringify({ booting: !live, stage, pct, since: started, live }))
  }
  // A window asking about the world must not be told a world exists yet.
  // 503 is the honest answer and keeps a client's failover logic correct.
  if ((req.url || '').startsWith('/api/')) {
    res.writeHead(503, { 'Content-Type': 'application/json', 'Retry-After': '5', ...cors })
    return res.end(JSON.stringify({ booting: true, stage, pct }))
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', ...cors })
  res.end(PAGE())
})

// EADDRINUSE is not an error worth stopping for -- and it is common, because a
// restarted node races its own predecessor for the port. The world does not
// need this server; it is a courtesy. So it reports and stands down, and the
// main thread founds in silence exactly as it always used to.
server.on('error', (e) => {
  parentPort?.postMessage({ type: 'error', message: e.message, code: e.code })
  if (e.code === 'EADDRINUSE') process.exit(0)
})
server.listen(PORT, () => parentPort?.postMessage({ type: 'listening', port: PORT }))
