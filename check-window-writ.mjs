// §6dj, for the writ window: CAN A WRIT BREAK THE RULE IT IS SHAPED BY.
//
// Every other window is checked for what it SHOWS. This one's central claim is
// a constraint — one function, called once an interval, returning one deed —
// and a constraint is only worth anything if it holds against somebody trying.
// So this check is adversarial: it hands the window writs that return arrays,
// that throw, that never return, that ask for verbs the pillar does not take,
// and that go looking for the network, and asserts that none of them buys an
// advantage a person at a keyboard could not have.
//
// It runs the real worker source out of the real file, in a real Worker.
//
// Needs three.js:  npm i three@0.128.0

import { readFileSync } from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let THREE; try { THREE = require('three') } catch { console.log('  skip  no three.js'); process.exit(0) }
const { Worker } = await import('worker_threads')

let bad = 0
const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL') + '  ' + m); if (!c) bad++ }
const src = readFileSync('window-writ.html', 'utf8')

// ---- 1. the sandbox, read out of the file rather than described ----
const w = src.slice(src.indexOf('const WORKER_SRC = `') + 20, src.indexOf('`\nlet WORKER = null'))
for (const gone of ['fetch', 'XMLHttpRequest', 'WebSocket', 'importScripts', 'EventSource'])
  ok(new RegExp('self\\.' + gone + ' = undefined').test(w),
     'the sandbox closes ' + gone + ' before the writ is reached')
ok(!/postMessage\([^)]*socket/i.test(w), 'and the writ never touches the socket: it returns a deed')

// ---- 2. run real writs in a real worker ----
// the worker source lives in a template literal, so what readFileSync hands
// back still has its escapes doubled: \\n where the running window sees \n.
// Undo that, or the writ is compiled with a literal backslash in it.
const runner = w.replace(/\\\\/g, '\\').replace(/self\./g, 'GLOBAL.')
const harness = `
const { parentPort } = require('worker_threads')
// §GLOBAL MUST BE THE REAL GLOBAL. In a browser Worker \`self\` IS globalThis,
// so \`self.fetch = undefined\` genuinely removes fetch. A harness that maps it
// onto a private object proves nothing: it would report a sandbox that does not
// exist. Point it at the real one and let the sandbox actually bite.
const GLOBAL = globalThis
GLOBAL.postMessage = (m) => parentPort.postMessage(m)
${runner}
parentPort.on('message', (m) => GLOBAL.onmessage({ data: m }))
`
const ask = (writ, world, me) => new Promise((res) => {
  const wk = new Worker(harness, { eval: true })
  const out = []
  const done = (v) => { wk.terminate(); res(v) }
  const timer = setTimeout(() => done({ timedOut: true, out }), 900)
  wk.on('message', (m) => { out.push(m)
    if (m.kind === 'deed') { clearTimeout(timer); done({ deed: m.deed, err: m.err, lines: m.lines, out }) } })
  wk.on('error', (e) => { clearTimeout(timer); done({ threw: e.message, out }) })
  wk.postMessage({ kind: 'writ', src: writ })
  wk.postMessage({ kind: 'tick', at: 900, world, me })
})

const me = { x: 20, y: 20, hp: 10, maxHp: 10, inventory: [{ item: 'cooked-fish' }], skills: {} }
const world = { tick: 900, players: { me }, mobs: { g: { type: 'goblin', hp: 4, x: 21, y: 20 } },
  nodes: { t: { type: 'tree', x: 19, y: 20, depletedUntil: 0 } }, ground: {} }

// the one that should simply work
let r = await ask('function decide(w,m){ const t = nearest(w,m,"tree"); return adjacent(m,t) ? {do:"gather",nodeId:t.id} : stepToward(m,t) }', world, me)
ok(r.deed && r.deed.do === 'gather' && r.deed.nodeId === 't', 'a writ that works, works (' + JSON.stringify(r.deed) + ')')

// ---- 3. ONE DEED. Not two, not a list, not a stream. ----
r = await ask('function decide(){ return [{do:"attack",mobId:"g"},{do:"attack",mobId:"g"},{do:"move",dx:1,dy:0}] }', world, me)
ok(r.deed && !Array.isArray(r.deed) && r.deed.do === 'attack',
   'a writ returning three deeds gets ONE of them out (' + JSON.stringify(r.deed) + ')')
r = await ask('function decide(){ return "gather" }', world, me)
ok(!r.deed, 'a writ returning nonsense returns nothing rather than something')
r = await ask('function decide(){ return { nodeId: "t" } }', world, me)
ok(!r.deed, 'and a deed with no verb is not a deed')

// ---- 4. a writ that fails must not take the window with it ----
r = await ask('function decide(){ throw new Error("I have made a mistake") }', world, me)
ok(!r.threw && /mistake/.test(r.err || ''), 'a writ that throws is REPORTED, not fatal (' + r.err + ')')
r = await ask('this is not javascript at all {{{', world, me)
ok(!r.threw && (r.err || '').length > 0, 'a writ that will not parse says so')
r = await ask('const x = 1', world, me)
ok(/no decide/.test(r.err || ''), 'a writ with no decide() says so')

// ---- 5. and one that never returns must not hang the citizen ----
r = await ask('function decide(){ while (true) {} }', world, me)
ok(r.timedOut, 'a writ that never returns misses its interval rather than freezing the world')

// ---- 6. the network is not reachable from inside ----
r = await ask('function decide(){ if (typeof fetch === "function") return {do:"chat",text:"I have the network"}; return {do:"stop"} }', world, me)
ok(r.deed && r.deed.do === 'stop', 'fetch is gone from inside the writ')
r = await ask('function decide(){ try { new WebSocket("ws://x") } catch (e) { return {do:"stop"} } return {do:"chat",text:"socket"} }', world, me)
ok(r.deed && r.deed.do === 'stop', 'and so is WebSocket')

// ---- 7. it cannot be faster than a person: the pillar takes one an interval ----
const ladder = new Set([...readFileSync('serve.mjs', 'utf8').matchAll(/a\.do === '([a-z_]+)'/g)].map(m => m[1]))
r = await ask('function decide(){ return {do:"become_king"} }', world, me)
ok(r.deed && !ladder.has(r.deed.do),
   'a writ may ASK for a verb the pillar does not carry \u2014 and the pillar drops it, as it would from any window')
ok(/writWaiting/.test(src) && /missed it/.test(src),
   'and a writ that has not answered by the next tick misses that interval rather than queueing')

// ---- 8. say() reaches the log, which is what makes this debuggable ----
r = await ask('function decide(){ say("hp", 10); return null }', world, me)
ok((r.lines || []).some(l => /hp 10/.test(l)), 'say() from inside the writ reaches the log beside it')
console.log(bad ? '\n  ' + bad + ' failed' : '\n  ok    a writ can ask for anything and buy no advantage by it')
process.exit(bad ? 1 : 0)
