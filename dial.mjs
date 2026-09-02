// THE DIAL. §7dv (the tide) and §7dw (closing time), on the wall.
//
// A WATCH, NOT A TIMER, and the distinction is the whole design. A countdown
// shows a magnitude draining toward a target, which is the device every other
// game uses to manufacture urgency. A watch has no zero. It shows POSITION,
// and you read it and infer. That is what a watch face beside a shower is
// doing: not counting down, just telling you where you are.
//
// So: two rings and no ticking number. The outer ring is the tide -- three
// markers travelling their own cycles toward the lit arcs where the far
// channel stands open. The inner ring is what is left of the allowance, and
// because the ceiling window ROLLS rather than resetting, it refills
// continuously and never reads as depletion.
//
// EVERYTHING IS ROUNDED TO FIVE MINUTES. A precise interval counter is both
// the stressful version and the optimisable one -- "twelve hundred left, I can
// fit one more run" -- and the moment a citizen is playing against the clock
// rather than reading it, the dial has become the thing it was meant to
// prevent. A parent said "about ten more minutes", never "nine minutes forty",
// and that was not imprecision.
//
// ---------------------------------------------------------------------------
// THE ARITHMETIC BELOW MUST MIRROR THE ENGINE EXACTLY (§7dv, §7dw).
// It is duplicated here so a window can draw the dial without pulling the
// engine in, and `test/dial.test.mjs` asserts the two agree over a long run.
// If that test ever fails, the ENGINE is right and this file is wrong.
// ---------------------------------------------------------------------------

const CEIL_BINS = 24

export function tideUp(g, tick, i) {
  const td = g?.tide; if (!td) return false
  const per = td.periods[i], op = td.opens[i]
  if (!per) return false
  return ((tick % per) + per) % per < op
}
export function anyTideOpen(g, tick) {
  const td = g?.tide; if (!td) return false
  for (let i = 0; i < td.periods.length; i++) if (tideUp(g, tick, i)) return true
  return false
}
export function nextTideTurn(g, tick, i) {
  const td = g?.tide; if (!td) return null
  const per = td.periods[i], op = td.opens[i]
  if (!per) return null
  const at = ((tick % per) + per) % per
  return tick + (at < op ? op - at : per - at)
}
function ceilStood(p, g, tick) {
  const led = p?.ledger; if (!led || !g?.ceiling) return 0
  const b = Math.floor(tick / (g.ceiling.window / CEIL_BINS))
  const gap = b - led.at
  if (gap >= CEIL_BINS) return 0
  let sum = 0
  for (let k = 0; k < CEIL_BINS - gap; k++) sum += led.bins[(led.at - k + CEIL_BINS * 2) % CEIL_BINS]
  return sum
}
export function ceilingLeft(world, pid) {
  const g = world?.genesis, p = world?.players?.[pid]
  if (!g?.ceiling || !p) return Infinity
  return Math.max(0, g.ceiling.allow - ceilStood(p, g, world.tick))
}

// ---- the face ----

const NS = 'http://www.w3.org/2000/svg'
const R_OUT = 44, R_IN = 33, CX = 52, CY = 52
// FIVE MINUTES. Three hundred intervals, which is also the sample, so the
// dial cannot show a resolution the world does not actually keep.
const ROUND = 300

const el = (n, a = {}) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e }
const pol = (r, t) => [CX + r * Math.cos(t - Math.PI / 2), CY + r * Math.sin(t - Math.PI / 2)]
function arc(r, from, to, w, stroke, op = 1) {
  const [x0, y0] = pol(r, from), [x1, y1] = pol(r, to)
  const big = (to - from) > Math.PI ? 1 : 0
  const p = el('path', { d: `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${big} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`,
    fill: 'none', stroke, 'stroke-width': w, 'stroke-linecap': 'round', opacity: op })
  return p
}
// "about forty-five minutes", never a countdown to the second
function coarse(intervals) {
  if (!isFinite(intervals)) return ''
  const m = Math.round(intervals / ROUND) * 5
  if (m <= 0) return 'now'
  if (m < 60) return '~' + m + 'm'
  const h = Math.floor(m / 60), r = m % 60
  return '~' + h + 'h' + (r ? String(r).padStart(2, '0') : '')
}

/**
 * Mount the dial. Returns { el, update(world, playerId), setHidden(bool) }.
 * `update` is safe to call every frame; it only touches the DOM when the
 * coarse reading actually changes, so it costs nothing at sixty a second.
 */
export function makeDial({ corner = 'bottom-right', scale = 1 } = {}) {
  const host = document.createElement('div')
  const [vy, vx] = corner.split('-')
  host.style.cssText = `position:fixed;${vy}:14px;${vx}:14px;z-index:60;`
    + `width:${104 * scale}px;height:${118 * scale}px;pointer-events:none;`
    + `font:10px/1.3 ui-monospace,monospace;color:#9a8f78;text-align:center;`
    + `transition:opacity .6s ease`

  const svg = el('svg', { viewBox: '0 0 104 104', width: 104 * scale, height: 104 * scale })
  host.appendChild(svg)
  const label = document.createElement('div')
  host.appendChild(label)

  // the two grooves the hands run in
  svg.appendChild(el('circle', { cx: CX, cy: CY, r: R_OUT, fill: 'none', stroke: '#3a3325', 'stroke-width': 3 }))
  svg.appendChild(el('circle', { cx: CX, cy: CY, r: R_IN, fill: 'none', stroke: '#3a3325', 'stroke-width': 5 }))

  const lit = [], mark = []
  const allowArc = arc(R_IN, 0, 0.001, 5, '#c8a24a')
  svg.appendChild(allowArc)
  const centre = el('text', { x: CX, y: CY + 4, 'text-anchor': 'middle', fill: '#cdbf9f',
    'font-family': 'ui-monospace,monospace', 'font-size': '11' })
  svg.appendChild(centre)

  let last = ''
  function update(world, pid) {
    const g = world?.genesis
    if (!g) return
    const t = world.tick ?? 0

    // ---- outer: the tide, three markers walking toward their lit arcs ----
    const td = g.tide
    if (td) {
      for (let i = 0; i < td.periods.length; i++) {
        const r = R_OUT - i * 4.5
        if (!lit[i]) {
          // the open stretch of this tide's cycle, drawn once and left there:
          // it is a fixed fraction of the ring and it never moves
          lit[i] = arc(r, 0, 2 * Math.PI * (td.opens[i] / td.periods[i]) || 0.001, 2, '#e0a94a', 0.55)
          svg.appendChild(lit[i])
          mark[i] = el('circle', { r: 2, fill: '#cdbf9f' })
          svg.appendChild(mark[i])
        }
        const phase = ((t % td.periods[i]) + td.periods[i]) % td.periods[i]
        const [mx, my] = pol(r, 2 * Math.PI * (phase / td.periods[i]))
        mark[i].setAttribute('cx', mx.toFixed(2))
        mark[i].setAttribute('cy', my.toFixed(2))
        // a marker inside the lit arc is a channel that is open right now
        mark[i].setAttribute('fill', tideUp(g, t, i) ? '#ffd98a' : '#6b6252')
        mark[i].setAttribute('r', tideUp(g, t, i) ? 2.8 : 2)
      }
    }

    // ---- inner: what is left of the allowance ----
    let left = Infinity, frac = 1
    if (g.ceiling && pid) {
      left = ceilingLeft(world, pid)
      frac = Math.max(0, Math.min(1, left / g.ceiling.allow))
      const warn = left <= g.ceiling.warn
      allowArc.setAttribute('stroke', left <= 0 ? '#8a5a3a' : warn ? '#e08a4a' : '#c8a24a')
      const [x0, y0] = pol(R_IN, 0), [x1, y1] = pol(R_IN, 2 * Math.PI * frac || 0.0001)
      allowArc.setAttribute('d',
        `M${x0.toFixed(2)} ${y0.toFixed(2)} A${R_IN} ${R_IN} 0 ${frac > 0.5 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`)
    }

    // ---- the reading, coarse ----
    // the soonest a shut channel opens, so the dial answers "when can I be
    // heard" without anybody counting rings
    let soonest = null
    if (td) for (let i = 0; i < td.periods.length; i++) {
      if (tideUp(g, t, i)) { soonest = 0; break }
      const at = nextTideTurn(g, t, i)
      if (at !== null && (soonest === null || at - t < soonest)) soonest = at - t
    }
    const openNow = soonest === 0
    const txt = g.ceiling && pid
      ? (left <= 0 ? 'stood down' : coarse(left))
      : ''
    const sub = td ? (openNow ? 'the tide is up' : 'tide in ' + coarse(soonest)) : ''
    const line = txt + '|' + sub
    if (line !== last) {                       // only touch the DOM when the reading moves
      last = line
      centre.textContent = txt
      centre.setAttribute('fill', left <= 0 ? '#c07a4a' : left <= (g.ceiling?.warn ?? 0) ? '#e8b06a' : '#cdbf9f')
      label.textContent = sub
      label.style.color = openNow ? '#e0a94a' : '#7a7160'
    }
  }

  // A CITIZEN MAY PUT THE CLOCK AWAY. Some people read a dial and relax; some
  // read it and tense. Hiding it hides only the DISPLAY -- closing time is
  // announced in world state ten minutes out and arrives either way, so
  // nobody is ambushed and nobody has to watch a clock who does not want to.
  function setHidden(h) { host.style.opacity = h ? '0' : '1' }

  return { el: host, update, setHidden }
}
