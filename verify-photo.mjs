#!/usr/bin/env node
// verify-photo.mjs — read the plate off an Interval photograph.
//
//   node verify-photo.mjs shot.png
//   node verify-photo.mjs shot.png --pillar https://interval.place
//   node verify-photo.mjs shot.png --json
//
// A photograph taken in the photo window leaves that window carrying an
// Ed25519 statement, inside the PNG's own bytes, by a named citizen:
// at tick T, in world W, standing on tile (x,y), with the eye HERE and
// pointed THERE, the world looked like this. "This" is pinned by a
// SHA-256 over the pixels, so the claim cannot be lifted off one picture
// and dropped onto another.
//
// Two things are checked here, and neither of them asks anyone's
// permission:
//
//   1. The pixels are the pixels the claim was made about.
//   2. The signature over the claim holds, under the SAME function the
//      state machine uses to decide whether a deed was authorized.
//      A photograph is verified exactly like an axe swing.
//
// What this does NOT prove on its own is that the citizen was really
// standing there at that tick — that is a question for the world, not
// the file. Pass --pillar and it will be asked. The full answer needs a
// pillar that will replay to an arbitrary tick; see the note at the end.

import fs from 'node:fs'
import crypto from 'node:crypto'
import { createRequire } from 'node:module'
const E = createRequire(import.meta.url)('./engine.js')
// The sky is imported, not transcribed. This file used to carry its own
// copy of the ladder and it had already drifted: it called every daylit
// minute 'morning', because the test was dayF < 0.5 when the sun sets
// at 0.5. A verifier that names light the window never showed is worse
// than no verifier.
import { skyAt, DAY } from './sky.mjs'

const PLATE_KW = 'Interval', PLATE_KW_SIG = 'Interval-Sig'
// every tEXt chunk under the Interval namespace is the window's, and none
// of them is covered by the image hash; strip them and you have the bytes
// the camera made, which is what was signed
const isOurs = (kw) => kw === PLATE_KW || kw.startsWith(PLATE_KW + '-')

// ---------- PNG: pull our chunks out, and hand back the rest ----------
function readPlate(buf) {
  if (buf.length < 8 || buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG')
  const keep = [buf.subarray(0, 8)]
  const found = {}
  let p = 8
  while (p + 8 <= buf.length) {
    const len = buf.readUInt32BE(p)
    const type = buf.toString('latin1', p + 4, p + 8)
    const end = p + 12 + len
    let mine = false
    if (type === 'tEXt') {
      const d = buf.subarray(p + 8, p + 8 + len)
      const z = d.indexOf(0)
      if (z > 0) {
        const kw = d.toString('latin1', 0, z)
        if (isOurs(kw)) {
          found[kw] = d.toString('latin1', z + 1)
          mine = true
        }
      }
    }
    if (!mine) keep.push(buf.subarray(p, end))
    if (type === 'IEND') break
    p = end
  }
  return { bare: Buffer.concat(keep), plate: found[PLATE_KW], sig: found[PLATE_KW_SIG] }
}

// ---------- the check ----------
async function main() {
  const args = process.argv.slice(2)
  const file = args.find((a) => !a.startsWith('--'))
  const asJson = args.includes('--json')
  const pillar = args[args.indexOf('--pillar') + 1]
  if (!file) {
    console.error('usage: node verify-photo.mjs <file.png> [--pillar <url>] [--json]')
    process.exit(2)
  }

  const buf = fs.readFileSync(file)
  const { bare, plate, sig } = readPlate(buf)
  const fail = (why, extra = {}) => {
    if (asJson) console.log(JSON.stringify({ ok: false, why, ...extra }, null, 2))
    else { console.log('\n  ✗ ' + why + '\n'); }
    process.exit(1)
  }
  if (!plate || !sig) fail('no plate: this is an ordinary picture, and claims nothing')

  let obj
  try { obj = JSON.parse(plate) } catch { fail('the plate is not readable JSON') }

  // 1. do the pixels belong to this claim?
  const imgHash = crypto.createHash('sha256').update(bare).digest('hex')
  if (imgHash !== obj.img)
    fail('the plate belongs to a different picture: these pixels hash to '
      + imgHash.slice(0, 16) + '…, the claim names ' + String(obj.img).slice(0, 16) + '…', { plate: obj })

  // 2. does the signature hold? Same function the state machine uses to
  //    decide whether a deed was authorized. No special case for photos.
  if (!E.verifyInputSig({ ...obj, sig }, E.SIG_DOMAINS.photo))
    fail('the signature does not hold for this claim', { plate: obj })

  const sky = skyAt(obj.tick)
  const out = { ok: true, plate: obj, imgHash, sky }

  // 3. optionally, ask a pillar whether it agrees this world exists and
  //    this citizen does. The tick-level question needs a replay.
  if (pillar) {
    out.pillar = { url: pillar }
    try {
      const w = await (await fetch(pillar.replace(/\/$/, '') + '/api/world')).json()
      out.pillar.worldId = w.worldId
      out.pillar.tick = w.tick
      out.pillar.sameWorld = w.worldId === obj.worldId
      out.pillar.inThePast = obj.tick <= w.tick
      const pr = await fetch(pillar.replace(/\/$/, '') + '/api/player/' + obj.playerId)
      out.pillar.citizenKnown = pr.ok
      if (pr.ok) { const pj = await pr.json(); out.pillar.citizen = pj.name ?? null }
    } catch (e) { out.pillar.error = String(e.message ?? e) }
  }

  if (asJson) { console.log(JSON.stringify(out, null, 2)); return }

  const row = (k, v) => '    ' + k.padEnd(11) + v
  console.log('')
  console.log('  ✓ THE PLATE HOLDS')
  console.log('')
  console.log('    The signature covers both the claim and the pixels, so')
  console.log('    neither can be swapped for the other.')
  console.log('')
  console.log(row('citizen', obj.playerId))
  console.log(row('world', obj.worldId))
  console.log(row('tick', obj.tick + '  ·  day ' + sky.dayIdx + ' at ' + sky.clock + '  ·  ' + sky.season))
  console.log(row('light', sky.name + (sky.overcast > 0.55 ? ' (cloud)' : '')))
  console.log(row('stood', obj.at ? obj.at.join(', ') : 'not recorded'))
  console.log(row('eye', (obj.eye ?? []).join(', ')))
  console.log(row('facing', (obj.look ?? []).join(', ')))
  console.log(row('lens', Math.round(24 / (2 * Math.tan(obj.fov * Math.PI / 360))) + 'mm equiv  ·  '
    + obj.fov + '° vertical'))
  console.log(row('pixels', (obj.px ?? []).join(' × ')))
  console.log(row('sha256', imgHash))
  if (out.pillar) {
    console.log('')
    const pl = out.pillar
    if (pl.error) console.log(row('pillar', 'unreachable: ' + pl.error))
    else {
      console.log(row('pillar', pl.url + '  (now at tick ' + pl.tick + ')'))
      console.log(row('', (pl.sameWorld ? '✓' : '✗') + ' same world'))
      console.log(row('', (pl.inThePast ? '✓' : '✗') + ' the tick has happened'))
      console.log(row('', (pl.citizenKnown ? '✓' : '✗') + ' the citizen is known'
        + (pl.citizen ? ' (' + pl.citizen + ')' : '')))
    }
  }
  console.log('')
  console.log('    What is proved: this citizen made this claim about this')
  console.log('    picture. What is not: that they were really standing there')
  console.log('    at that tick. The world knows; the file cannot. A pillar')
  console.log('    that will replay to an arbitrary tick can settle it, and')
  console.log('    the world is deterministic, so any pillar can.')
  console.log('')
}

main().catch((e) => { console.error(String(e.message ?? e)); process.exit(1) })
