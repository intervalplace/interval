#!/usr/bin/env node
// verify-clip.mjs — read a signed clip from the deep window's theatre.
//
//   node verify-clip.mjs clip.json
//   node verify-clip.mjs clip.json --pillar https://interval.place
//   node verify-clip.mjs clip.json --json
//
// A photograph carries its pixels and a hash to nail them down. A clip
// carries neither, and needs neither. Interval is a deterministic state
// machine, so naming the world, the range of ticks, the subject and the
// camera names the footage EXACTLY: anyone with the seed and the input
// log renders the same frames, to the pixel.
//
// That makes a clip a stronger artifact than a video file, not a weaker
// one. A video can be cut, resequenced, slowed, or have a frame removed,
// and nothing about the file objects. A clip that has been edited simply
// stops verifying, because the only thing it asserts is *which ticks*,
// and the ticks are not the clip's to invent.
//
// What is proved: this citizen claims this range of this world, seen
// this way. What is not: that the range is interesting, or that they
// were there. The world settles both, and the world is replayable.

import fs from 'node:fs'
import { createRequire } from 'node:module'
const E = createRequire(import.meta.url)('./engine.js')
import { skyAt, DAY, asClock } from './sky.mjs'

const TICK_MS = 600

function main() {
  const args = process.argv.slice(2)
  const file = args.find((a) => !a.startsWith('--'))
  const asJson = args.includes('--json')
  const pillar = args[args.indexOf('--pillar') + 1]
  if (!file) {
    console.error('usage: node verify-clip.mjs <clip.json> [--pillar <url>] [--json]')
    process.exit(2)
  }

  let clip
  try { clip = JSON.parse(fs.readFileSync(file, 'utf8')) }
  catch (e) { fail('that file is not readable JSON: ' + (e.message ?? e)) }

  function fail(why, extra = {}) {
    if (asJson) console.log(JSON.stringify({ ok: false, why, ...extra }, null, 2))
    else console.log('\n  \u2717 ' + why + '\n')
    process.exit(1)
  }

  const REQUIRED = ['v', 'worldId', 'tickFrom', 'tickTo', 'playerId', 'subject', 'cam', 'sig']
  for (const k of REQUIRED) if (clip[k] === undefined) fail('the clip is missing "' + k + '"')
  if (!(Number.isInteger(clip.tickFrom) && Number.isInteger(clip.tickTo)
        && clip.tickTo >= clip.tickFrom)) fail('the clip names an impossible range')

  // the same function that decides whether an axe swing was authorized
  const { sig, ...body } = clip
  if (!E.verifyInputSig({ ...body, sig }, E.SIG_DOMAINS.clip))
    fail('the signature does not hold for this clip', { clip: body })

  const n = clip.tickTo - clip.tickFrom + 1
  // what the light did across the range, from the same ladder the window
  // draws with: a clip can be described without ever being rendered
  const seen = []
  for (let t = clip.tickFrom; t <= clip.tickTo; t += Math.max(1, Math.floor(n / 24))) {
    const s = skyAt(t)
    if (!seen.length || seen[seen.length - 1].kind !== s.name) seen.push({ tick: t, kind: s.name })
  }
  const out = { ok: true, clip: body, ticks: n,
    seconds: Math.round(n * TICK_MS / 1000), light: seen }

  if (pillar) {
    out.pillar = { url: pillar }
    // deliberately synchronous-looking: one fetch, printed at the end
    return withPillar(pillar, out, clip, asJson)
  }
  report(out, asJson)
}

async function withPillar(pillar, out, clip, asJson) {
  try {
    const w = await (await fetch(pillar.replace(/\/$/, '') + '/api/world')).json()
    out.pillar.worldId = w.worldId
    out.pillar.tick = w.tick
    out.pillar.sameWorld = w.worldId === clip.worldId
    out.pillar.hasHappened = clip.tickTo <= w.tick
    const pr = await fetch(pillar.replace(/\/$/, '') + '/api/player/' + clip.subject)
    out.pillar.subjectKnown = pr.ok
    if (pr.ok) out.pillar.subject = (await pr.json()).name ?? null
  } catch (e) { out.pillar.error = String(e.message ?? e) }
  report(out, asJson)
}

function report(out, asJson) {
  if (asJson) { console.log(JSON.stringify(out, null, 2)); return }
  const c = out.clip
  const row = (k, v) => '    ' + k.padEnd(11) + v
  console.log('')
  console.log('  \u2713 THE CLIP HOLDS')
  console.log('')
  console.log('    It carries no frames and needs none: the world is')
  console.log('    deterministic, so this range IS the footage.')
  console.log('')
  console.log(row('citizen', c.playerId))
  console.log(row('world', c.worldId))
  console.log(row('range', c.tickFrom + ' \u2192 ' + c.tickTo
    + '  (' + out.ticks + ' ticks, ' + out.seconds + 's)'))
  console.log(row('day', 'day ' + Math.floor(c.tickFrom / DAY) + ' at ' + asClock(c.tickFrom)
    + '  \u2192  day ' + Math.floor(c.tickTo / DAY) + ' at ' + asClock(c.tickTo)))
  console.log(row('subject', c.subject === c.playerId ? 'themselves' : c.subject))
  console.log(row('camera', 'az ' + c.cam.az + '  pitch ' + c.cam.pitch + '  dist ' + c.cam.dist))
  console.log(row('light', out.light.map((l) => l.kind).join(' \u2192 ')))
  if (out.pillar) {
    console.log('')
    const p = out.pillar
    if (p.error) console.log(row('pillar', 'unreachable: ' + p.error))
    else {
      console.log(row('pillar', p.url + '  (now at tick ' + p.tick + ')'))
      console.log(row('', (p.sameWorld ? '\u2713' : '\u2717') + ' same world'))
      console.log(row('', (p.hasHappened ? '\u2713' : '\u2717') + ' the range has happened'))
      console.log(row('', (p.subjectKnown ? '\u2713' : '\u2717') + ' the subject is known'
        + (p.subject ? ' (' + p.subject + ')' : '')))
    }
  }
  console.log('')
  console.log('    To watch it, a pillar must replay the range. Every pillar')
  console.log('    can: that is what a pillar is. Unlike a video file, this')
  console.log('    cannot be cut without ceasing to verify \u2014 the only thing')
  console.log('    it asserts is which ticks, and the ticks are not its own.')
  console.log('')
}

main()
