// Interval door v1.0: a sovereign peer that also opens a door.
// ===========================================================================
// `serve.mjs` founds a world and serves windows into it. `join.mjs` joins
// somebody else's world as a full peer -- its own node computing every tick,
// its own keys, no custodian -- but it is headless, so there is nothing to
// look through.
//
// That left one gap, and it is the wrong way round economically. A visitor in
// a browser is pure LOAD on whichever pillar serves them: a socket, and a
// state snapshot pushed every six hundred milliseconds, for as long as they
// stay. A sovereign peer is CAPACITY: it computes its own ticks and verifies
// everyone else's. So the more people who run a node, the cheaper the network
// gets -- but only if running a node also gets you something to look at.
// Otherwise the easy path (open a browser at somebody else's pillar) is the
// one that costs the network most, and the expensive path buys you a log file.
//
// This closes it. `node door.mjs interval.place` joins that world exactly the
// way join.mjs does -- same founding record, same constitution check, same
// lockstep verification, same divergence detection -- and then serves the
// windows at http://localhost:8788 against ITS OWN copy of the state.
//
// What that buys, precisely:
//
//   * The state you are shown is one YOUR machine computed. A browser pointed
//     at a stranger's pillar cannot check what it is told; a browser pointed
//     at your own node is looking at a tick you verified yourself.
//   * Your door is a bootstrap for anyone else. It serves /api/genesis,
//     /api/peers and /api/announce, so `join.mjs yourhost:8788` works, and the
//     mesh grows sideways instead of through one pillar.
//   * The pillar can go down and you keep playing. The founding is cached, the
//     peer book remembers doors, and the world talks around the hole.
//
// What it does NOT change: your key was always yours. The browser mints
// Ed25519 in WebCrypto and signs every input locally whichever node it talks
// to. No pillar could ever act as you. What it could do is lie to you about
// the world, and that is the thing this removes.
//
//   usage: node door.mjs [world] [--http=8788] [--port=4601] [--witness=f.json]
//
//     node door.mjs                       join interval.place, door on 8788
//     node door.mjs localhost:8787        join a world on this machine
//     node door.mjs some.other.place      somebody else's world
//
// ===========================================================================

import fs from 'fs'
import http from 'http'
import { WebSocketServer } from 'ws'
import { multiaddr } from '@multiformats/multiaddr'
import E from './engine.js'
import { IntervalNode } from './node.mjs'
import { DEFAULT_STARTUP_VERIFY_RECENT_N } from './errors.mjs'
// EVERY GENERATOR, NOT JUST THE FIRST ONE.
// worldgen.mjs registers the classic founding alone. worldgen-any.mjs
// registers all of them, which is what serve.mjs has always imported --
// and it is why join.mjs cannot currently enter any expanse world.
import { buildWorld } from './worldgen-any.mjs'

const argOf = (k, d) => {
  const a = process.argv.find(s => s.startsWith('--' + k + '='))
  return a ? a.split('=')[1] : d
}
const HTTP_PORT = Number(argOf('http', process.env.INTERVAL_HTTP_PORT || 8788))
const P2P_PORT = Number(argOf('port', process.env.INTERVAL_P2P_PORT || 0))
const DEFAULT_WORLD = process.env.INTERVAL_WORLD || 'interval.place'
const RAW = process.argv.slice(2).find(a => !a.startsWith('--')) || DEFAULT_WORLD

function asWorldUrl(a) {
  let t = String(a).trim().replace(/\/+$/, '')
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(t)) {
    const local = /^(localhost|127\.\d+\.\d+\.\d+|\[::1\]|0\.0\.0\.0)(:\d+)?$/i.test(t)
    t = (local ? 'http://' : 'https://') + t
  }
  try { new URL(t) } catch { return null }
  return t
}
let URL_ = asWorldUrl(RAW)
if (!URL_) { console.log('  "' + RAW + '" is not a world. Try: node door.mjs interval.place'); process.exit(1) }
let host = new URL(URL_).hostname

// a peer that dies of a wrong number is no peer at all
const UNREACHABLE = new Set(['ECONNREFUSED', 'EHOSTUNREACH', 'ENETUNREACH', 'ETIMEDOUT', 'ECONNRESET'])
process.on('uncaughtException', (e) => {
  const code = e?.code ?? e?.message
  console.log('[net] ' + (UNREACHABLE.has(code)
    ? 'a peer address would not answer (' + code + '); most nodes sit behind a router'
    : 'a connection died rudely (' + code + ')') + '; the interval continues')
})
process.on('unhandledRejection', (e) =>
  console.log('[net] a promise died rudely (' + (e?.code ?? e?.message ?? e) + '); the interval continues'))

// ---- 1. the founding record, from the world or from our own cache ---------
fs.mkdirSync('identities', { recursive: true })
let G_CACHE = `identities/genesis-${host}.json`
let P_BOOK = `identities/peers-${host}.json`
// LOOPBACK IS TWO ADDRESSES AND NODE PICKS ONE.
//
// A pillar listens on 0.0.0.0, which is IPv4 only. Node's fetch resolves
// `localhost` through the system resolver and may try ::1 first, get nothing,
// and report the world unreachable -- intermittently, depending on how the
// machine feels about IPv6 that day. Some sandboxes are the other way round.
// curl tries every address a name resolves to; so do we, rather than betting.
async function reachGenesis() {
  const alts = [URL_]
  const h = new URL(URL_).hostname
  if (h === 'localhost') alts.push(URL_.replace('//localhost', '//127.0.0.1'))
  else if (h === '127.0.0.1') alts.push(URL_.replace('//127.0.0.1', '//localhost'))
  let last = null
  for (const u of alts) {
    try {
      // AbortSignal.timeout: a pillar that accepts the TCP connection but never
      // answers must not hang the boot before we even have the founding.
      const res = await fetch(u + '/api/genesis', { signal: AbortSignal.timeout(10000) })
      const got = JSON.parse(await res.text())
      URL_ = u; host = new URL(u).hostname
      return got
    } catch (e) { last = e }
  }
  throw last
}
let info
try {
  info = await reachGenesis()
  G_CACHE = `identities/genesis-${host}.json`
  P_BOOK = `identities/peers-${host}.json`
  fs.writeFileSync(G_CACHE, JSON.stringify(info))
} catch {
  try {
    info = JSON.parse(fs.readFileSync(G_CACHE, 'utf8'))
    console.log('[door] that world is not answering: rising from the cached founding')
  } catch {
    console.log('cannot reach ' + host + ', and no cached founding for it.')
    console.log('open the door once while the world lives; after that the cache carries you.')
    process.exit(1)
  }
}

// ---- 2. the same constitution, or nothing --------------------------------
const myRulesHash = E.sha256(fs.readFileSync(new URL('./SPEC.md', import.meta.url))).toString('hex')
if (myRulesHash !== info.genesis.rulesHash) {
  console.log('constitution mismatch: that world runs different rules than your SPEC.md')
  console.log(`  theirs: ${info.genesis.rulesHash.slice(0, 16)}…  yours: ${myRulesHash.slice(0, 16)}…`)
  console.log('pull the matching version, or found your own with serve.mjs.')
  process.exit(1)
}
const WORLD_ID = E.worldId(info.genesis)
console.log(`world ${WORLD_ID.slice(0, 12)}… (constitution ${info.genesis.rulesHash.slice(0, 12)}…)`)

// ---- 3. our node, verifying every tick ------------------------------------
const W_ARG = argOf('witness', null)
let witnessKey = null
if (W_ARG) {
  const wk = E.loadOrCreateIdentity(fs, W_ARG)
  if ((info.genesis.witnesses ?? []).includes(wk.playerId)) {
    witnessKey = wk
    console.log(`witness key accepted: ${wk.playerId.slice(0, 12)}…`)
  } else console.log(`witness key ${wk.playerId.slice(0, 12)}… is not in this world's founding set — opening as observer`)
}
const node = await new IntervalNode({
  peerKeyFile: 'identities/peer-door-' + host + '.json',
  genesis: info.genesis, buildWorld, name: 'door', witnessKey,
  safetyDir: witnessKey ? 'witness-safety' : null,
  finalityBackend: process.env.INTERVAL_FINALITY_BACKEND || 'sqlite',
  startupVerifyRecentN: process.env.INTERVAL_STARTUP_VERIFY_RECENT
    ? Number(process.env.INTERVAL_STARTUP_VERIFY_RECENT) : DEFAULT_STARTUP_VERIFY_RECENT_N,
  listen: '/ip4/0.0.0.0/tcp/' + P2P_PORT,
}).start()
console.log('[door] listening for peers on tcp/' + node.listenPort()
  + (P2P_PORT ? '' : ' (random; use --port=4601 and open it inbound to be dialable)'))

// ---- 4. the mesh: the world's door first, then every door it knows -------
const LOCAL_OK = ['localhost', '127.0.0.1', '::1'].includes(host)
const usableDoor = (a) => LOCAL_OK || !(/\/ip4\/127\./.test(a) || /\/ip6\/::1\//.test(a))
let book = []
try { book = JSON.parse(fs.readFileSync(P_BOOK, 'utf8')).filter(usableDoor) } catch {}
const remember = (a) => {
  if (!usableDoor(a) || book.includes(a)) return
  book.push(a); book = book.slice(-20)
  try { fs.writeFileSync(P_BOOK, JSON.stringify(book)) } catch {}
}
const proto = /^\d+\.\d+\.\d+\.\d+$/.test(host) ? 'ip4' : 'dns4'
// ---- hardening: no network await may gate the boot ----
// Sequential awaited dials let one silent peer (dropping SYNs behind a router)
// hold the boot open for a full TCP timeout. Race every network await against a
// timer; fire gossip dials in the background so a dead peer can't stall startup.
const withTimeout = (p, ms, label) => Promise.race([
  Promise.resolve(p),
  new Promise((_, rej) => setTimeout(() => rej(new Error('timeout ' + ms + 'ms (' + label + ')')), ms)),
])
const pillarAddr0 = multiaddr(`/${proto}/${host}/tcp/${info.p2pPort}/p2p/${info.peerId}`)
let pillarUp = true
try { await withTimeout(node.dial(pillarAddr0), 8000, 'pillar') }
catch { pillarUp = false; console.log('[door] that world\'s door did not answer in time; the book remembers ' + book.length + ' other(s)') }
for (const a of book) {   // background — book peers are redundancy, not a boot dependency
  withTimeout(node.dial(multiaddr(a)), 8000, 'book').then(() => {}).catch(() => {})
}

const dialed = new Set([node.peerId()])
async function meshUp() {
  const port = node.listenPort(); if (!port) return
  try { await withTimeout(fetch(URL_ + '/api/announce', { method: 'POST', body: JSON.stringify({ peerId: node.peerId(), port }) }), 8000, 'announce') } catch {}
  let peers = []
  try { peers = (await (await withTimeout(fetch(URL_ + '/api/peers'), 8000, 'peers')).json()).peers ?? [] } catch { return }
  for (const a of peers) {
    const pid = /\/p2p\/(.+)$/.exec(a)?.[1]
    if (!pid || dialed.has(pid) || !usableDoor(a)) continue
    dialed.add(pid)
    // background dial: a dead entry must not stall the sweep
    withTimeout(node.dial(multiaddr(a)), 8000, 'peer')
      .then(() => { console.log('[mesh] peer connected: ' + a); remember(a) })
      .catch(() => { dialed.delete(pid) })
  }
}
meshUp(); setInterval(meshUp, 20000)   // don't await the first sweep

// ---- 4b. SYNC BEFORE TICKING ---------------------------------------------
// A node that starts ticking from genesis while the world is at tick 60,000 is
// not behind, it is in a different world -- it computes forward from an empty
// island and agrees with nobody. Pull a checkpoint from whoever is actually
// alive first (a dead pillar's address must not crash the resurrection it
// exists to enable), and afterwards keep a certified catch-up on a timer, so a
// stall or a missed proposal is repaired by replay rather than by drift.
const pillarAddr = pillarAddr0
// Sync from the LIVE pillar alone first (allowSingle), timeout-guarded so a
// stale book address fed to syncFromPeers — which dials sources sequentially —
// cannot hang the boot. Fall back to book sources one at a time.
let synced = false
if (pillarUp) {
  try { await withTimeout(node.syncFromPeers([pillarAddr], { allowSingle: true }), 20000, 'sync/pillar'); synced = true }
  catch (e) { console.log('[door] pillar checkpoint not adopted (' + e.message + ')') }
}
if (!synced) for (const a of book) {
  try { await withTimeout(node.syncFromPeers([multiaddr(a)], { allowSingle: true }), 12000, 'sync/book'); synced = true; break }
  catch {}
}
if (synced) {
  console.log('[door] ' + (node.log[node.log.length - 1] ?? 'synced'))
} else {
  // A SERVING door must not publish a divergent view, so unlike join.mjs it
  // refuses to tick from an empty island rather than catch up live.
  console.log('[door] could not sync a checkpoint from the pillar or the book.')
  console.log('[door] refusing to tick forward from an empty island: nothing would agree with you.')
  console.log('[door] retry once the world\'s pillar (or a known peer) is reachable.')
  process.exit(1)
}
if (node.agreement) setInterval(async () => {
  const behind = node.scheduledTick - node.state.tick
  if (behind <= 10 || node.agreement.halted || node._catchingUp) return
  node._catchingUp = true
  try { await node.catchUpFrom(pillarAddr, node.scheduledTick - 1) }
  catch (e) { console.log('[sync] certified catch-up: ' + e.message) }
  node._catchingUp = false
}, 5000)

// ---- 5. our own peer directory, so this door is a bootstrap too ----------
// A door that cannot be joined THROUGH is still a bottleneck, just a smaller
// one. Serving these three endpoints means `join.mjs yourhost:8788` works and
// the mesh can grow sideways instead of through one pillar.
const announced = new Map()

// ===========================================================================
// THE DOOR ITSELF
// ===========================================================================
const MIME = {
  html: 'text/html', js: 'text/javascript', css: 'text/css', json: 'application/json',
  png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml',
  ico: 'image/x-icon', m4a: 'audio/mp4', mp3: 'audio/mpeg', ogg: 'audio/ogg',
  wav: 'audio/wav', opus: 'audio/opus', flac: 'audio/flac',
}
const WINDOWS = {
  '/play/lantern': 'window-diablo.html', '/lantern': 'window-diablo.html', '/diablo': 'window-diablo.html',
  '/play/flat': 'window-web.html', '/window-web': 'window-web.html',
  '/play/deep': 'window-3d.html', '/deluxe': 'window-3d.html',
  '/play/photo': 'window-photo.html', '/photo': 'window-photo.html',
  '/play/holo': 'window-holo.html', '/holo': 'window-holo.html',
}

const server = http.createServer((req, res) => {
  const path = (req.url || '/').split('?')[0]
  const json = (o) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)) }
  const sendFile = (rel, type) => {
    try {
      const b = fs.readFileSync(new URL(rel, import.meta.url))
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' }); res.end(b)
    } catch { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('nothing here') }
  }
  try {
    // the three that make this a bootstrap
    if (path === '/api/genesis') return json({
      genesis: node.genesis, peerId: node.peerId(), p2pPort: node.listenPort(),
      note: 'a door, not a pillar: this node joined ' + host + ' and verifies every tick itself',
    })
    if (path === '/api/announce' && req.method === 'POST') {
      let body = ''
      req.on('data', (c) => { body += c })
      req.on('end', () => {
        try {
          const { peerId, port } = JSON.parse(body)
          if (!/^12D3Koo[1-9A-HJ-NP-Za-km-z]+$/.test(peerId ?? '') || !Number.isInteger(port)) { res.writeHead(400); res.end(); return }
          const fwd = (req.headers['x-forwarded-for'] ?? '').split(',')[0].trim()
          const ip = (fwd || req.socket.remoteAddress || '').replace(/^::ffff:/, '')
          const kind = ip.includes(':') ? 'ip6' : 'ip4'
          announced.set(peerId, { addr: `/${kind}/${ip}/tcp/${port}/p2p/${peerId}`, at: Date.now() })
          res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"ok":true}')
        } catch { res.writeHead(400); res.end() }
      })
      return
    }
    if (path === '/api/peers') {
      const fresh = Date.now() - 5 * 60 * 1000
      for (const [id, e] of announced) if (e.at < fresh) announced.delete(id)
      return json({ peers: [...announced.values()].map(e => e.addr), count: announced.size })
    }
    if (path === '/api/world') return json({
      tick: node.state.tick, finalizedTick: node.finalizedTick, scheduledTick: node.scheduledTick,
      worldId: node.worldId, joined: host, divergent: node.divergent?.size ?? 0,
    })
    if (path === '/api/audio') {
      let names = []
      try { names = fs.readdirSync(new URL('./audio/', import.meta.url))
        .filter(n => /\.(mp3|ogg|m4a|wav|opus|flac)$/i.test(n)) } catch {}
      return json({ tracks: names })
    }
    if (path.startsWith('/audio/')) {
      const f = decodeURIComponent(path.slice(7)).replace(/[^a-zA-Z0-9._-]/g, '')
      return sendFile('./audio/' + f, MIME[f.split('.').pop()] ?? 'application/octet-stream')
    }
    if (WINDOWS[path]) return sendFile('./' + WINDOWS[path], 'text/html')
    if (path === '/' || path === '/play' || path === '/windows') return sendFile('./site/windows.html', 'text/html')
    if (path.startsWith('/site/')) {
      const f = path.slice(6).replace(/[^a-z0-9.-]/g, '')
      return sendFile('./site/' + f, MIME[f.split('.').pop()] ?? 'text/plain')
    }
    { const am = /^\/([a-z0-9_-]+)\.(png|jpg|webp|svg|ico|css|js)$/.exec(path)
      if (am) return sendFile('./site/' + am[1] + '.' + am[2], MIME[am[2]]) }
    res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('nothing here')
  } catch (e) {
    console.error('[door] request failed: ' + (e?.stack ?? e))
    if (res.headersSent) { try { res.end() } catch {} return }
    try { res.writeHead(500); res.end('error') } catch {}
  }
})

// ---- 6. the wire, and only the sovereign half of it ----------------------
// serve.mjs also accepts `auth`, which asks the PILLAR to hold a key on a
// visitor's behalf. A personal door deliberately does not: holding strangers'
// keys is the exact custody this whole file exists to remove, and a browser
// that cannot do Ed25519 should be told so rather than quietly handed to a
// custodian. Every current browser can.
const wss = new WebSocketServer({ server })
const sockets = new Map()
wss.on('connection', (ws) => {
  sockets.set(ws, null)
  ws.on('close', () => sockets.delete(ws))
  ws.on('message', (buf) => {
    let m; try { m = JSON.parse(buf) } catch { return }
    try {
      if (m.type === 'adopt') {
        if (!/^[0-9a-f]{64}$/.test(m.pub ?? '')) return
        sockets.set(ws, { external: true, playerId: m.pub })
        ws.send(JSON.stringify({ type: 'hello', playerId: m.pub, external: true }))
        return
      }
      if (m.type === 'auth') {
        ws.send(JSON.stringify({ type: 'refused', of: 'auth',
          why: 'this door holds no keys for anyone. Your browser must sign its own '
             + 'inputs (Ed25519 in WebCrypto). Update the browser, or use a pillar.' }))
        return
      }
      const ext = sockets.get(ws)
      if (m.type === 'rawsay') {
        if (!ext?.external || m.msg?.playerId !== ext.playerId) return
        node.publishSignedChat(m.msg).catch(() => {})
        return
      }
      if (m.type === 'raw') {
        if (!ext?.external) return
        const inp = m.input
        if (!inp || inp.playerId !== ext.playerId || typeof inp.sig !== 'string') return
        node.submitInput(inp).catch((e) => {
          const why = String(e?.message ?? e).slice(0, 120)
          try {
            if (ws.readyState === 1 && (ws.bufferedAmount ?? 0) < 2 * 1024 * 1024)
              ws.send(JSON.stringify({ type: 'refused', of: inp.type ?? '?', tick: inp.tick ?? null, why }))
          } catch {}
        })
        return
      }
    } catch (err) { console.error('[door] ws error: ' + err.message) }
  })
})

node.onChat = (msg) => {
  const name = node.state.players[msg.playerId]?.name ?? msg.playerId.slice(0, 6)
  const out = JSON.stringify({ type: 'chat', playerId: msg.playerId, name, text: msg.text })
  for (const ws of sockets.keys())
    if (ws.readyState === 1 && (ws.bufferedAmount ?? 0) < 2 * 1024 * 1024) ws.send(out)
}

// The backpressure rule is serve.mjs's, carried over whole and for its own
// stated reasons: a state broadcast is a SNAPSHOT, not a stream, so a socket
// that has not drained tick 1000 gains nothing from also being sent 1001. The
// numbers are load-bearing -- a skipped state mutes the citizen, because an
// input must carry the exact current tick and the window learns the tick only
// from the states it receives.
const SKIP_ABOVE = 12 * 1024 * 1024
const DROP_ABOVE = 32 * 1024 * 1024
node.onTick = (state) => {
  const msg = JSON.stringify({ type: 'state', state, worldId: node.worldId })
  for (const ws of sockets.keys()) {
    if (ws.readyState !== 1) continue
    const backlog = ws.bufferedAmount ?? 0
    if (backlog > DROP_ABOVE) { try { ws.terminate ? ws.terminate() : ws.close() } catch {}; continue }
    if (backlog > SKIP_ABOVE) continue
    ws.send(msg)
  }
}

node.startTicking()
server.listen(HTTP_PORT, () => {
  console.log('')
  console.log('  your door is open: http://localhost:' + HTTP_PORT + '/play/lantern')
  console.log('')
  console.log('  joined ' + host + ' as a full peer. Every tick you are shown is one')
  console.log('  this machine computed and verified. Your browser signs its own inputs;')
  console.log('  this node holds no key for you and could not act as you if it wanted to.')
  console.log('')
  console.log('  others may join THROUGH you: node join.mjs <this host>:' + HTTP_PORT + ' <n>')
  console.log('')
})

let lastSaid = 0
setInterval(() => {
  const s = node.state
  if (s.tick - lastSaid < 200) return
  lastSaid = s.tick
  const awake = Object.values(s.players).filter(p => E.isAwake(p, s.tick)).length
  console.log(`tick ${s.tick} · ${awake} awake · peers ${dialed.size - 1} · watching ${sockets.size}`
    + ` · divergences ${node.divergent?.size ?? 0}`)
}, 5000)
