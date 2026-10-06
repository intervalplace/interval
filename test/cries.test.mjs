// §9f: WHAT THE WORLD SAYS TO EVERYBODY, AND WHETHER ANY WINDOW HEARS IT.
//
// `announce()` has seventy-four call sites: a dragon risen, the last lamprey
// dead, a stall fallen in the grass, every first, every mastery, and the deep
// tide turning. The browser windows read `state.announce` straight off the
// world, because they are handed the world. The Unreal window is handed a
// curated frame, and for the whole life of that window nothing in the frame
// carried the list -- so the deluxe client was silent for all seventy-four.
//
// THAT MATTERED MOST FOR THE TIDE. §14i cut three tides to one on the grounds
// that the announcement and the moot it names ARE the feature. In a window that
// cannot hear an announcement, the tide does nothing observable whatever.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import E from '../engine.js'
import { rulesHash } from '../rules-hash.mjs'

const RH = rulesHash(new URL('../', import.meta.url))

// ---- THE TIDE IS READ, THE ANNOUNCEMENT IS RUN ----
//
// Two questions and they want two different things. "How many tides does this
// world seat" is a fact about the GENERATOR, and `handbook.mjs` already decided
// how to ask it: read `g.tide` out of the source, because building a whole
// genesis to learn three numbers takes the better part of a minute. "Does the
// turn announce itself" is a fact about the ENGINE's tick loop, and that holds
// for any genesis carrying a tide at all.
//
// Founding the real island was tried and is the wrong tool twice over: a minute
// per run for a question about a list, and the v7 road solver only converges at
// the full 896x512, so the small world that would have made it quick is refused
// outright with "the crossings or the passes have sealed a settlement off".
const GEN = readFileSync(new URL('../worldgen-expanse7.mjs', import.meta.url), 'utf8')
const TIDE = (() => {
  const m = GEN.match(/g\.tide = \{\s*periods:\s*\[([^\]]*)\]\s*,\s*opens:\s*\[([^\]]*)\]/)
  assert.ok(m, 'the generator no longer sets a tide this test can read')
  const nums = (t) => t.split(',').map((x) => Number(x.trim())).filter((n) => n > 0)
  return { periods: nums(m[1]), opens: nums(m[2]) }
})()

// A WORLD WITH THIS WORLD'S TIDE ON IT, and nothing else that costs anything.
// The announcement lives in the tick loop and reads `genesis.tide`; it has no
// opinion about how many trees the island has.
function ticking() {
  const g = E.makeGenesis('cry-test', RH, 0)
  g.tide = { periods: [...TIDE.periods], opens: [...TIDE.opens] }
  assert.equal(E.validateGenesis(g) ?? null, null,
    'a genesis carrying this world\'s tide must be constitutional')
  return g
}

test('the deep tide announces itself when it turns', () => {
  assert.equal(TIDE.periods.length, 1, '§14i: this world seats one tide')
  const g = ticking()
  const s0 = E.newWorld(g)
  // THE INTERVAL BEFORE THE TURN. The tide is up from 0 to 1799 of every
  // period, so the first transition a running world sees is at the period
  // itself -- a genesis starts already inside the window and `nextState` never
  // evaluates the edge at tick zero.
  s0.tick = g.tide.periods[0] - 1
  const s = E.nextState(s0, [])
  assert.ok(Array.isArray(s.announce) && s.announce.length >= 1,
    'the turn should put something on the announce list')
  assert.match(s.announce[s.announce.length - 1].text, /deep tide/i,
    'and it should be the tide that said it')
})

test('an announcement carries the interval it happened on', () => {
  // The bridge watermarks on this, so a cry with no tick, or a tick it does not
  // trust, is a cry that is either replayed for ever or never shown at all.
  const g = ticking()
  const s0 = E.newWorld(g)
  s0.tick = g.tide.periods[0] - 1
  const s = E.nextState(s0, [])
  for (const a of s.announce) {
    assert.equal(typeof a.tick, 'number', 'every cry is stamped')
    assert.equal(typeof a.text, 'string', 'and every cry is words')
    assert.ok(a.tick <= s.tick, 'and nothing is announced from the future')
  }
})

// ---- AND THAT THE UNREAL WINDOW IS STILL WIRED FOR THEM ----
//
// Read from the source on both sides of the crossing, because the fault this
// replaces was not a broken line of code: it was a field nobody had thought to
// send, which no test can see by running anything. The two halves have to name
// each other or the deluxe client goes quietly deaf again.
test('the bridge forwards the world\'s cries to the Unreal window', () => {
  const b = readFileSync(new URL('../unreal-bridge.mjs', import.meta.url), 'utf8')
  assert.match(b, /held\.announce/,
    'the bridge must read the world\'s announce list')
  assert.match(b, /k: 'cry'/,
    'and send each one on its own kind, not disguised as chat from nobody')
  // THE WATERMARK IS THE WHOLE OF THE CORRECTNESS HERE. The world keeps a
  // backlog of recent cries in state, so a bridge that forwards everything it
  // sees greets a newcomer with an hour of old news about a dragon that rose
  // before they arrived.
  assert.match(b, /_criedTo/, 'the bridge must watermark what it has already said')
  const fn = b.slice(b.indexOf('function pushCries'), b.indexOf('function pushFrame'))
  assert.ok(fn.indexOf('_criedTo === null') < fn.indexOf("k: 'cry'"),
    'the watermark must be set before anything is sent, or joining replays history')
})
