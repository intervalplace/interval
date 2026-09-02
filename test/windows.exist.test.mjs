// EVERY WINDOW THE ROUTER OFFERS MUST BE ON DISK.
//
// A missing window does not fail loudly. `sendFile` cannot find it, logs one
// line nobody is watching, and answers 404 as `text/plain` — and a browser
// handed text/plain at a URL ending `/mist` does not show an error, it saves a
// file called `mist.txt`. Every other window still works, so the fault looks
// like it lives in the one window rather than in the deploy.
//
// This is the test that would have caught that in CI instead of in a browser.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'

const src = fs.readFileSync(new URL('../serve.mjs', import.meta.url), 'utf8')

// The routes are read out of serve.mjs rather than kept as a second list here.
// A hand-maintained list is exactly the thing that drifts, and drift is the
// bug this file exists to prevent.
function promisedWindows() {
  const out = []
  for (const m of src.matchAll(/sendFile\('\.\/(window-[a-z0-9-]+\.html)'/g))
    if (!out.includes(m[1])) out.push(m[1])
  return out
}

test('the router offers at least the windows the site links to', () => {
  const promised = promisedWindows()
  assert.ok(promised.length >= 6, 'found ' + promised.length + ' window routes')
  assert.ok(promised.includes('window-mist.html'), 'the mist window is offered')
  assert.ok(promised.includes('window-web.html'), 'the flat window is offered')
})

test('EVERY window the router offers is actually on disk', () => {
  const missing = promisedWindows().filter(
    (f) => !fs.existsSync(new URL('../' + f, import.meta.url)))
  assert.deepEqual(missing, [],
    'a window offered but absent is served as a 404 in text/plain, which browsers download')
})

test('every window on disk is a document, not a truncated one', () => {
  for (const f of promisedWindows()) {
    const buf = fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8')
    assert.ok(buf.length > 1000, f + ' is suspiciously short')
    assert.match(buf.slice(0, 200).trim(), /^<!doctype html/i, f + ' does not begin as HTML')
    assert.match(buf.slice(-400), /<\/html>/i, f + ' is truncated: no closing tag')
  }
})

test('every window the SITE links to is a route the router answers', () => {
  // the chooser page is what people actually click, so its links are the
  // promises that matter most
  let page
  try { page = fs.readFileSync(new URL('../site/windows.html', import.meta.url), 'utf8') }
  catch { return }   // a deploy without the chooser has nothing to check
  const linked = [...page.matchAll(/href="(\/play\/[a-z0-9-]+)"/g)].map((m) => m[1])
  assert.ok(linked.length > 0, 'the chooser links somewhere')
  for (const href of new Set(linked)) {
    assert.ok(src.includes("'" + href + "'"),
      'the chooser offers ' + href + ' and the router does not answer it')
  }
})
