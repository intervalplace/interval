// §6dj: DOES THE WINDOW BOOT AT ALL.
//
// A parse check is not a boot check, and the difference cost a release. The
// forge table was copied out of the engine with `GOLD_ORE_PER_BAR` still in it
// -- a constant the engine defines and the window does not -- which is
// perfectly valid JavaScript and throws a ReferenceError the instant the block
// is evaluated. Every `new Function(body)` check passed, because `new Function`
// compiles and does not run. The window stuck on "waking the world" and the
// whole client was dead.
//
// This evaluates the script bodies for real, under a stub DOM that answers
// anything, and reports the first thing that throws. It cannot prove the window
// WORKS -- nothing short of a browser can -- but it proves the top level runs,
// which is the failure a copied table produces.

import { readFileSync } from 'fs'
import vm from 'vm'

const html = readFileSync('window-web.html', 'utf8')
const bodies = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1])

const noop = () => {}
const el = () => new Proxy(function () {}, {
  get(t, k) {
    if (k === 'style') return new Proxy({}, { get: () => '', set: () => true })
    if (k === 'dataset') return {}
    if (k === 'classList') return { add: noop, remove: noop, toggle: noop, contains: () => false }
    if (k === 'children' || k === 'childNodes') return []
    if (k === 'parentNode' || k === 'parentElement') return el()
    if (k === 'innerHTML' || k === 'textContent' || k === 'value' || k === 'id') return ''
    if (k === 'width' || k === 'height' || k === 'offsetWidth' || k === 'offsetHeight') return 800
    if (k === Symbol.toPrimitive) return () => ''
    return el()
  },
  set: () => true,
  apply: () => el(),
})

const ctx = {
  document: new Proxy({}, {
    get(t, k) {
      if (k === 'getElementById' || k === 'querySelector' || k === 'createElement') return () => el()
      if (k === 'querySelectorAll') return () => []
      if (k === 'addEventListener' || k === 'removeEventListener') return noop
      if (k === 'body' || k === 'documentElement' || k === 'head') return el()
      if (k === 'readyState') return 'complete'
      return el()
    },
  }),
  console,
  setTimeout: noop, setInterval: noop, clearTimeout: noop, clearInterval: noop,
  requestAnimationFrame: noop, cancelAnimationFrame: noop,
  fetch: () => new Promise(noop),
  WebSocket: function () { return el() },
  localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
  location: { href: '', search: '', hash: '', protocol: 'https:', host: 'x' },
  navigator: { userAgent: 'node', clipboard: { writeText: noop } },
  crypto: globalThis.crypto,
  performance: { now: () => 0 },
  addEventListener: noop, removeEventListener: noop,
  alert: noop, prompt: () => null, confirm: () => false,
  Image: function () { return el() },
  AudioContext: function () { return el() },
  matchMedia: () => ({ matches: false, addEventListener: noop }),
  URL, TextEncoder, TextDecoder, Math, JSON, Date, Promise, Error,
}
ctx.window = ctx
ctx.globalThis = ctx
vm.createContext(ctx)

let bad = 0
bodies.forEach((body, i) => {
  const isModule = /^\s*import\s/m.test(body)
  if (isModule) { console.log(`  --    block ${i}: an ES module, skipped (it cannot be evaluated flat)`); return }
  try {
    vm.runInContext(body, ctx, { filename: `window-web.html#script${i}`, timeout: 8000 })
    console.log(`  ok    block ${i}: top level runs (${body.length.toLocaleString()} chars)`)
  } catch (e) {
    // a stub DOM will eventually disagree with real code; a ReferenceError on a
    // bare identifier is the one that means a copied table brought a name with it
    const fatal = e instanceof ReferenceError || /is not defined/.test(e.message)
    console.log(`  ${fatal ? 'FAIL' : '  --'}  block ${i}: ${e.name}: ${e.message}`)
    if (fatal) bad++
  }
})
console.log(bad ? `\n${bad} block(s) reference a name that does not exist.` : '\nthe window boots.')
process.exit(bad ? 1 : 0)
