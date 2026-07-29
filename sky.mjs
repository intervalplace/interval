// sky.mjs — the light, which is a pure function of the tick.
//
// Sun elevation and azimuth off `tick % DAY`, weather hashed off the
// constitutional day, seasons off `dayIdx % 28`. Nothing here touches a
// player, a socket or a scene: give it a tick and it tells you what the
// sky is doing, forwards or backwards, as far ahead as you care to look.
// That is why the photo window can forecast at all, and no ordinary
// game can: its weather is a decision someone made at runtime, and this
// is arithmetic that was true before anyone opened a window.
//
// This file exists because it was briefly written TWICE — once in
// window-photo.html to draw the forecast, once in verify-photo.mjs to
// read a photograph's plate back — and two transcriptions of the same
// ladder is exactly how window-3d's terrain mirror fell thirteen nouns
// behind. A verified photograph that names light the window never
// showed is a lie told by the verifier, which is worse than no
// verifier. So: one ladder, imported by both.
//
// Every line MIRRORS the render loop in window-photo.html. If the two
// ever disagree, this file is the thing that has to give: the frame is
// the truth about what you will see.

const DAY = 2400, TICK_MS = 600
const tileHash = (x, y, salt) => {
  let h = (x * 374761393 + y * 668265263 + salt * 1442695041) >>> 0
  h = (h ^ (h >> 13)) >>> 0; h = (h * 1274126177) >>> 0
  return (h ^ (h >> 16)) >>> 0
}

const _cl = (a, b2, c2) => Math.min(c2, Math.max(b2, a))
const _ss = (x2, a, b2) => { const u = _cl((x2 - a) / (b2 - a), 0, 1); return u * u * (3 - 2 * u) }
const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
function skyAt(tick) {
  const dayF = (tick % DAY) / DAY
  const dayIdx = Math.floor(tick / DAY)
  const elev = Math.sin(dayF * Math.PI * 2)
  const azim = dayF * Math.PI * 2 + 0.6
  // the same spherical convention the renderer uses for sunDir
  const phi = (90 - Math.max(elev * 62, -12)) * Math.PI / 180
  const sx = Math.sin(phi) * Math.sin(azim), sz = Math.sin(phi) * Math.cos(azim)
  const wOf = (d2) => { const h = tileHash(d2, 999, 777) % 100; return h < 42 ? 0 : h < 74 ? 0.5 : 1 }
  const wk = _ss(dayF, 0.88, 1)
  const wthr = wOf(dayIdx) * (1 - wk) + wOf(dayIdx + 1) * wk
  const overcast = _cl(wthr * 1.4, 0, 1)
  const rain = _cl((wthr - 0.55) * 2.2, 0, 1)
  const dayAmt = _cl(elev * 4, 0, 1)
  const warm = _cl(1 - Math.abs(elev) * 2.6, 0, 1)
  const shower = _cl(1 - Math.abs(wthr - 0.5) * 4, 0, 1)
  const rainbow = shower * dayAmt * (1 - rain) * (0.5 + warm * 0.4)
  const auroraOf = (d2) => (tileHash(d2, 5, 888) % 100) < 28 ? 1 : 0
  const aurora = (auroraOf(dayIdx) * (1 - wk) + auroraOf(dayIdx + 1) * wk) * (1 - dayAmt) * (1 - overcast)
  const yearF = ((dayIdx % 28) + dayF) / 28
  const petal = (c2) => Math.max(0, 1 - Math.abs(((yearF - c2 + 1.5) % 1) - 0.5) * 4)
  // north is -z in this window's ground plane; east is +x
  const bearing = (Math.atan2(sx, -sz) * 180 / Math.PI + 360) % 360
  return { tick, dayIdx, dayF, elev, elevDeg: elev * 62, bearing,
    compass: COMPASS[Math.round(bearing / 22.5) % 16],
    overcast, rain, dayAmt, warm, rainbow, aurora,
    spring: petal(0.125), autumn: petal(0.625), winter: petal(0.875) }
}
// What the light IS and what it is WORTH, decided together. These used
// to be two functions and they disagreed: the scorer would rate a minute
// highly and the namer would call it ordinary, so the panel promised
// something and the sky delivered something else. One function, one
// verdict. A kind that is not worth going out for scores zero and never
// reaches the forecast.
//
// The sun rises at dayF 0 and sets at 0.5, so daylight is the FIRST HALF
// of the constitutional day and 'morning' is dayF < 0.25 — not < 0.5,
// which is every daylit minute there is.
function lightOf(s) {
  const rising = s.dayF < 0.25 || s.dayF >= 0.75
  const half = rising ? 'morning' : 'evening'
  if (s.aurora > 0.35) return { kind: 'aurora', score: Math.min(1, s.aurora * 1.25) }
  if (s.rainbow > 0.3) return { kind: 'rainbow', score: Math.min(1, s.rainbow * 1.15) }
  if (s.elev > 0.015 && s.warm > 0.5)
    return { kind: 'golden hour, ' + half, score: s.warm * (1 - s.overcast * 0.75) }
  if (s.elev > -0.16 && s.elev <= 0.015)
    return { kind: 'blue hour, ' + (rising ? 'dawn' : 'dusk'), score: (1 - s.overcast * 0.6) * 0.72 }
  if (s.rain > 0.75 && s.dayAmt > 0.35) return { kind: 'storm light', score: 0.55 }
  if (s.dayAmt < 0.02 && s.overcast < 0.18) return { kind: 'clear night, milky way', score: 0.5 }
  // everything below here is light you would not set an alarm for
  if (s.overcast > 0.75) return { kind: 'flat overcast', score: 0 }
  if (s.dayAmt > 0.9) return { kind: 'high sun, hard shadows', score: 0 }
  return { kind: 'ordinary light', score: 0 }
}
const lightName = (s) => lightOf(s).kind
const lightScore = (s) => lightOf(s).score

// Scan forward and hand back the peaks. A run breaks when the light
// stops being worth having OR when it becomes a DIFFERENT KIND of light:
// without that second test a wet day merges dawn, the storm and dusk
// into one four-hour smear labelled by whichever minute scored highest,
// which is exactly the sort of confident nonsense a forecast must not
// produce.
function forecast(fromTick, days = 3, step = 8) {
  const out = []
  const span = DAY * days
  let run = null
  const close = () => { if (run) { if (run.to > run.from) out.push(run); run = null } }
  for (let d2 = 0; d2 <= span; d2 += step) {
    const t2 = fromTick + d2
    const s = skyAt(t2)
    const { kind, score: v } = lightOf(s)
    if (v > 0.42) {
      if (run && run.kind !== kind) close()
      if (!run) run = { kind, best: v, at: s, from: t2, to: t2 }
      else { run.to = t2; if (v > run.best) { run.best = v; run.at = s } }
    } else close()
    if (out.length >= 10) break
  }
  close()
  return out
}
const asClock = (t2) => { // an in-world day is 24 hours of 100 ticks
  const h = Math.floor((t2 % DAY) / DAY * 24), m2 = Math.floor(((t2 % DAY) / DAY * 24 % 1) * 60)
  return String(h).padStart(2, '0') + ':' + String(m2).padStart(2, '0')
}
const asWait = (n) => {
  const secs = Math.round(n * TICK_MS / 1000)
  if (secs < 60) return secs + 's'
  const m2 = Math.round(secs / 60)
  return m2 < 60 ? m2 + ' min' : Math.floor(m2 / 60) + 'h ' + (m2 % 60) + 'm'
}

export { DAY, TICK_MS, skyAt, lightOf, lightName, lightScore, forecast, asClock, asWait, COMPASS }
