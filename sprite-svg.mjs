// THE BROWSER WINDOW'S ITEM DRAWINGS, AS VECTOR ART FOR THE PRINTED BOOK.
//
// `itemSprite` in window-web.html is 1,188 lines of canvas paths and contains
// no drawImage, no getImageData and no bitmap of any kind. It is pinned to a
// 32-unit box only by `c.width = 32`. So the drawings are not pictures of a
// size: they are instructions, and a printed page can have them at the page's
// own resolution rather than at 32 pixels blown up to 7.6mm.
//
// This file runs that function against a recorder standing in for a 2d
// context, and writes out what it asked for as SVG. Nothing is rasterised at
// any point. The handbook then inlines the SVG, which is both sharper than
// the PNG it replaces and about a hundredth of the bytes.
//
// WHY NOT A HEADLESS BROWSER AND A SCREENSHOT: because that would put a
// resolution back in, and the whole reason this is possible is that there
// isn't one. It would also make the book's art depend on Chrome being
// installed and on which Chrome.
//
// THE DRAWING CODE IS NOT COPIED. It is read out of window-web.html every
// run, so a sprite the window gains or fixes is in the next printing and
// there is no second copy to drift. The one price is that the slices below
// name landmarks in that file, and `--check` fails loudly if one moves.
//
//   node sprite-svg.mjs --check          draws every word the world has
//   node sprite-svg.mjs iron-hatchet     writes one to stdout
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const HERE = fileURLToPath(new URL('.', import.meta.url))

// ---------------------------------------------------------------- the recorder
//
// A 2d context's worth of state, writing SVG elements instead of pixels.
//
// TRANSFORMS ARE BAKED INTO THE COORDINATES rather than emitted as a <g
// transform>. The sprites only ever translate and rotate, never scale, so a
// circle stays a circle and an ellipse keeps its radii with its rotation
// turned; and baking avoids having to mirror canvas's save/restore stack in
// nested groups, which is where a shim like this usually goes wrong.
const TAU = Math.PI * 2
const r2 = (n) => {
  const v = Math.round(n * 100) / 100
  return Object.is(v, -0) ? 0 : v
}

class SvgPen {
  constructor (size) {
    this.size = size
    this.out = []           // finished elements, in paint order
    this.m = [1, 0, 0, 1, 0, 0]
    this.stack = []
    this.fillStyle = '#000000'
    this.strokeStyle = '#000000'
    this.lineWidth = 1
    this.lineCap = 'butt'
    this.font = '10px sans-serif'
    this.textAlign = 'start'
    this.globalAlpha = 1
    this.globalCompositeOperation = 'source-over'
    // One box PER ELEMENT rather than one for the drawing. A creature's
    // health bar sits above its head, so a bar dropped after the fact would
    // go on deciding how the picture is cropped and leave the beast small in
    // a box of nothing. Each element carries its own extent and the crop is
    // the union of the ones kept.
    this.boxes = []
    this.pend = [Infinity, Infinity, -Infinity, -Infinity]
    this.skipText = false
    this._newPath()
  }

  // ---- state
  save () { this.stack.push([this.m.slice(), this.fillStyle, this.strokeStyle, this.lineWidth, this.lineCap, this.globalAlpha, this.globalCompositeOperation]) }
  restore () {
    const s = this.stack.pop()
    if (!s) return
    ;[this.m, this.fillStyle, this.strokeStyle, this.lineWidth, this.lineCap, this.globalAlpha, this.globalCompositeOperation] = s
  }
  translate (tx, ty) {
    const [a, b, c, d, e, f] = this.m
    this.m = [a, b, c, d, e + a * tx + c * ty, f + b * tx + d * ty]
  }
  rotate (th) {
    const [a, b, c, d, e, f] = this.m
    const s = Math.sin(th), k = Math.cos(th)
    this.m = [a * k + c * s, b * k + d * s, c * k - a * s, d * k - b * s, e, f]
  }
  scale (sx, sy) {
    const [a, b, c, d, e, f] = this.m
    this.m = [a * sx, b * sx, c * sy, d * sy, e, f]
  }

  // ---- the point and the angle, under the current transform
  //
  // Every point the pen reaches is also remembered, so a drawing laid out for
  // a place in the world can be cropped to itself afterwards. The items don't
  // need it -- they are composed inside a 32 box on purpose -- but a creature
  // is drawn at an X and a Y on the map with a name plate above it, and
  // printing that box would be printing mostly grass.
  pt (x, y) {
    const [a, b, c, d, e, f] = this.m
    const p = [a * x + c * y + e, b * x + d * y + f]
    const pad = this.lineWidth / 2
    const q = this.pend
    if (p[0] - pad < q[0]) q[0] = p[0] - pad
    if (p[1] - pad < q[1]) q[1] = p[1] - pad
    if (p[0] + pad > q[2]) q[2] = p[0] + pad
    if (p[1] + pad > q[3]) q[3] = p[1] + pad
    return p
  }
  get turn () { return Math.atan2(this.m[1], this.m[0]) }   // no scale, so exact

  // ---- paths
  _newPath () { this.d = ''; this.here = null; this.start = null; this.sole = null; this.ops = 0 }
  beginPath () { this._newPath() }
  moveTo (x, y) {
    const p = this.pt(x, y)
    this.d += `M${r2(p[0])} ${r2(p[1])}`
    this.here = p; this.start = p; this.ops++; this.sole = null
  }
  lineTo (x, y) {
    const p = this.pt(x, y)
    if (!this.here) return this.moveTo(x, y)
    this.d += `L${r2(p[0])} ${r2(p[1])}`
    this.here = p; this.ops++; this.sole = null
  }
  quadraticCurveTo (cx, cy, x, y) {
    const q = this.pt(cx, cy), p = this.pt(x, y)
    if (!this.here) this.moveTo(cx, cy)
    this.d += `Q${r2(q[0])} ${r2(q[1])} ${r2(p[0])} ${r2(p[1])}`
    this.here = p; this.ops++; this.sole = null
  }
  closePath () { if (this.here) { this.d += 'Z'; this.here = this.start; this.ops++ } }
  rect (x, y, w, h) {
    this.moveTo(x, y); this.lineTo(x + w, y); this.lineTo(x + w, y + h); this.lineTo(x, y + h); this.closePath()
  }

  arc (cx, cy, r, a0, a1, ccw) { this.ellipse(cx, cy, r, r, 0, a0, a1, ccw) }

  // Canvas and SVG disagree about almost everything here, so this is written
  // out rather than guessed: canvas normalises the sweep and lines to the
  // arc's first point if a path is already open, and SVG's own arc command is
  // degenerate at a full turn. Both are handled by cutting the sweep into
  // quarter-turns at most, which no flag combination can misread.
  ellipse (cx, cy, rx, ry, rot, a0, a1, ccw) {
    let sweep = a1 - a0
    if (!ccw) {
      if (sweep < 0) sweep = ((sweep % TAU) + TAU) % TAU
      if (sweep > TAU) sweep = TAU
    } else {
      if (sweep > 0) sweep = -((((-sweep) % TAU) + TAU) % TAU)
      if (sweep < -TAU) sweep = -TAU
    }
    const whole = Math.abs(sweep) >= TAU - 1e-9
    const on = (t) => {
      const x = cx + rx * Math.cos(t) * Math.cos(rot) - ry * Math.sin(t) * Math.sin(rot)
      const y = cy + rx * Math.cos(t) * Math.sin(rot) + ry * Math.sin(t) * Math.cos(rot)
      return this.pt(x, y)
    }
    // A full turn drawn on its own is the commonest shape in the whole file:
    // remember it so fill() can write a <circle> or an <ellipse> instead of
    // four arc segments.
    const fresh = this.ops === 0
    const p0 = on(a0)
    if (this.here) this.d += `L${r2(p0[0])} ${r2(p0[1])}`
    else this.d += `M${r2(p0[0])} ${r2(p0[1])}`
    const n = Math.max(1, Math.ceil(Math.abs(sweep) / (Math.PI / 2)))
    const flag = sweep > 0 ? 1 : 0
    const xr = r2((rot + this.turn) * 180 / Math.PI)
    for (let i = 1; i <= n; i++) {
      const p = on(a0 + sweep * i / n)
      this.d += `A${r2(rx)} ${r2(ry)} ${xr} 0 ${flag} ${r2(p[0])} ${r2(p[1])}`
      this.here = p
    }
    this.ops++
    this.sole = (fresh && whole) ? { cx, cy, rx, ry, rot } : null
  }

  // ---- paint
  //
  // A canvas fill followed by a stroke of the same path is one SVG element
  // carrying both, because SVG paints a shape's fill before its own stroke in
  // exactly that order. Emitting two elements would also be correct and would
  // double the book's art.
  _el (fill, stroke) {
    let g
    if (this.sole) {
      const { cx, cy, rx, ry, rot } = this.sole
      const p = this.pt(cx, cy)
      const turn = r2((rot + this.turn) * 180 / Math.PI)
      g = Math.abs(rx - ry) < 1e-9
        ? `<circle cx="${r2(p[0])}" cy="${r2(p[1])}" r="${r2(rx)}"`
        : `<ellipse cx="${r2(p[0])}" cy="${r2(p[1])}" rx="${r2(rx)}" ry="${r2(ry)}"` +
          (turn ? ` transform="rotate(${turn} ${r2(p[0])} ${r2(p[1])})"` : '')
    } else {
      g = `<path d="${this.d}"`
    }
    g += fill ? ` fill="${fill}"` : ' fill="none"'
    if (stroke) {
      g += ` stroke="${stroke}" stroke-width="${r2(this.lineWidth)}"`
      if (this.lineCap !== 'butt') g += ` stroke-linecap="${this.lineCap}"`
    }
    if (this.globalAlpha < 1) g += ` opacity="${r2(this.globalAlpha)}"`
    this.out.push(g + '/>')
    this._kept()
    return this.out.length - 1
  }
  _kept () {
    this.boxes.push(this.pend)
    this.pend = [Infinity, Infinity, -Infinity, -Infinity]
  }
  // Elements this picture should not carry, by index: see beastPen.
  dropAt (ix) {
    this.out = this.out.filter((_, i) => !ix.has(i))
    this.boxes = this.boxes.filter((_, i) => !ix.has(i))
  }
  get box () {
    const b = [Infinity, Infinity, -Infinity, -Infinity]
    for (const q of this.boxes) {
      if (q[0] < b[0]) b[0] = q[0]
      if (q[1] < b[1]) b[1] = q[1]
      if (q[2] > b[2]) b[2] = q[2]
      if (q[3] > b[3]) b[3] = q[3]
    }
    return b
  }
  fill () { this._last = this._el(this.fillStyle, null); this._lastD = this.d }
  stroke () {
    // the stroke of the path just filled: fold it into that element
    if (this._lastD === this.d && this._last === this.out.length - 1 && this.out[this._last].includes('fill="')) {
      const was = this.out[this._last]
      if (!was.includes('stroke=')) {
        let add = ` stroke="${this.strokeStyle}" stroke-width="${r2(this.lineWidth)}"`
        if (this.lineCap !== 'butt') add += ` stroke-linecap="${this.lineCap}"`
        this.out[this._last] = was.replace('/>', add + '/>')
        // the same element, now also stroked: its extent is already banked,
        // so fold the stroke's points into it rather than opening a new box
        const b = this.boxes[this._last], q = this.pend
        if (q[0] < b[0]) b[0] = q[0]
        if (q[1] < b[1]) b[1] = q[1]
        if (q[2] > b[2]) b[2] = q[2]
        if (q[3] > b[3]) b[3] = q[3]
        this.pend = [Infinity, Infinity, -Infinity, -Infinity]
        return
      }
    }
    this._el(null, this.strokeStyle); this._lastD = null
  }
  fillRect (x, y, w, h) {
    if (this.globalCompositeOperation === 'source-atop') return this._tintAll(this.fillStyle, this.globalAlpha)
    if (this.skipFills && this.skipFills.has(this.fillStyle)) return
    this._rect(x, y, w, h, this.fillStyle, null)
  }
  strokeRect (x, y, w, h) { this._rect(x, y, w, h, null, this.strokeStyle) }
  _rect (x, y, w, h, fill, stroke) {
    const keep = [this.d, this.here, this.start, this.sole, this.ops]
    const square = Math.abs(this.m[1]) < 1e-9 && Math.abs(this.m[2]) < 1e-9
    if (square) {
      const p = this.pt(x, y), q = this.pt(x + w, y + h)
      this.sole = null; this.ops = 1
      this.d = `M${r2(p[0])} ${r2(p[1])}L${r2(q[0])} ${r2(p[1])}L${r2(q[0])} ${r2(q[1])}L${r2(p[0])} ${r2(q[1])}Z`
      this.out.push(
        `<rect x="${r2(Math.min(p[0], q[0]))}" y="${r2(Math.min(p[1], q[1]))}" ` +
        `width="${r2(Math.abs(q[0] - p[0]))}" height="${r2(Math.abs(q[1] - p[1]))}"` +
        (fill ? ` fill="${fill}"` : ' fill="none"') +
        (stroke ? ` stroke="${stroke}" stroke-width="${r2(this.lineWidth)}"` : '') +
        (this.globalAlpha < 1 ? ` opacity="${r2(this.globalAlpha)}"` : '') + '/>')
      this._kept()
    } else {
      this._newPath(); this.rect(x, y, w, h); this._el(fill, stroke)
    }
    ;[this.d, this.here, this.start, this.sole, this.ops] = keep
    this._lastD = null
  }

  // THE DEAD-TINT PASS, AND WHY IT IS A COLOUR CHANGE RATHER THAN AN OVERLAY.
  //
  // The window tints a borrowed drawing with `source-atop` and a flat fill at
  // alpha 0.62, which is how coal and gold ore stop being one grey lump. SVG
  // has no source-atop without a mask, and a mask built from the drawing
  // would triple it. But a flat colour laid over an opaque pixel at alpha a
  // IS just that pixel's colour mixed with the tint at a, so the same result
  // comes out of mixing every colour in the sprite once.
  //
  // The one place the two differ is a stroke that was already translucent:
  // source-atop would tint it in proportion to what it had covered, and this
  // tints it fully. Nothing in the book is a translucent lump and the
  // difference is invisible at 7.6mm.
  _tintAll (colour, alpha) {
    const t = parseColour(colour)
    if (!t) return
    for (let i = 0; i < this.out.length; i++) {
      this.out[i] = this.out[i].replace(/(fill|stroke)="([^"]+)"/g, (all, which, was) => {
        if (was === 'none') return all
        const c = parseColour(was)
        return c ? `${which}="${mix(c, t, alpha)}"` : all
      })
    }
  }

  fillText (text, x, y) {
    if (this.skipText) return
    const p = this.pt(x, y)
    const f = /^\s*(bold\s+)?([\d.]+)px\s+(.+)$/.exec(this.font) || [, '', '10', 'sans-serif']
    const anchor = this.textAlign === 'center' ? 'middle' : this.textAlign === 'right' ? 'end' : 'start'
    this.out.push(
      `<text x="${r2(p[0])}" y="${r2(p[1])}" fill="${this.fillStyle}" ` +
      `font-family="${f[3]}" font-size="${f[2]}"` + (f[1] ? ' font-weight="bold"' : '') +
      (anchor !== 'start' ? ` text-anchor="${anchor}"` : '') +
      `>${String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`)
    this._kept()
  }

  // these exist so a sprite that reaches for them does not throw
  setLineDash () {}
  clip () {}
  measureText (s) { return { width: String(s).length * 5 } }

  svg (tight) {
    let vb = `0 0 ${this.size} ${this.size}`
    const bx = this.box
    if (tight && bx[0] < bx[2]) {
      const [x0, y0, x1, y1] = bx
      const m = Math.max(x1 - x0, y1 - y0) * 0.04
      vb = `${r2(x0 - m)} ${r2(y0 - m)} ${r2(x1 - x0 + m * 2)} ${r2(y1 - y0 + m * 2)}`
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">` + this.out.join('') + '</svg>'
  }
  // the geometry alone, for telling a real drawing from the fallback
  bones () { return this.out.map((e) => e.replace(/ (fill|stroke|opacity)="[^"]*"/g, '')).join('') }
}

const parseColour = (s) => {
  if (typeof s !== 'string') return null
  let m = /^#([0-9a-f]{3})$/i.exec(s)
  if (m) return [parseInt(m[1][0] + m[1][0], 16), parseInt(m[1][1] + m[1][1], 16), parseInt(m[1][2] + m[1][2], 16), 1]
  m = /^#([0-9a-f]{6})$/i.exec(s)
  if (m) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16), 1]
  m = /^rgba?\(([^)]+)\)$/i.exec(s)
  if (m) {
    const p = m[1].split(',').map((v) => parseFloat(v))
    return [p[0] | 0, p[1] | 0, p[2] | 0, p.length > 3 ? p[3] : 1]
  }
  return null
}
const hex2 = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
const mix = (c, t, a) => {
  const r = c[0] * (1 - a) + t[0] * a, g = c[1] * (1 - a) + t[1] * a, b = c[2] * (1 - a) + t[2] * a
  const base = '#' + hex2(r) + hex2(g) + hex2(b)
  return c[3] < 1 ? `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${c[3]})` : base
}

// ------------------------------------------------- the window's own drawing code
//
// Lifted out of window-web.html at every run. The landmarks are checked, so
// this fails with the name of the piece that moved rather than with a
// ReferenceError from the middle of a 900KB file.
const lift = (file) => {
  const W = readFileSync(file, 'utf8')
  const table = (name) => {
    const a = W.indexOf(`const ${name} = {`)
    if (a < 0) throw new Error(`sprite-svg: window-web.html no longer has a table called ${name}`)
    return W.slice(a, W.indexOf('\n}', a) + 2)
  }
  const line = (starts) => {
    const a = W.indexOf(starts)
    if (a < 0) throw new Error(`sprite-svg: window-web.html no longer has the line "${starts}"`)
    return W.slice(a, W.indexOf('\n', a))
  }
  const span = (from, to) => {
    const a = W.indexOf(from)
    if (a < 0) throw new Error(`sprite-svg: window-web.html no longer has "${from}"`)
    const b = W.indexOf(to, a + from.length)
    if (b < 0) throw new Error(`sprite-svg: window-web.html no longer has "${to}" after "${from}"`)
    return W.slice(a, b)
  }
  return [
    'const ICON_CV = {}',
    table('METAL_PALETTE'),
    line('const METAL = (it) =>'),
    table('ICON_ALIAS'),
    table('ICON_TINT'),
    line('const isFallStoneId ='),
    line('const iconAliasOf ='),
    line('const iconTintOf'),
    span('function itemSprite(', '\nconst ICONS = new Proxy'),
  ].join('\n')
}

let draw = null
const ready = () => {
  if (draw) return draw
  const code = lift(HERE + 'window-web.html')
  // The sprite code asks the document for a canvas; it gets a pen. Nothing
  // else of the browser is needed, which is the measure of how self-contained
  // these drawings are.
  const body = `
    'use strict'
    const document = { createElement: () => {
      const o = { width: 32, height: 32, _pen: null,
        getContext: () => (o._pen = new Pen(o.width)) }
      return o
    } }
    ${code}
    return (word) => { ICON_CV = {}; return itemSprite(word)._pen }
  `.replace('const ICON_CV = {}', 'let ICON_CV = {}')
  draw = new Function('Pen', body)(SvgPen)
  return draw
}

// What a word the world has never heard of comes out as. Anything that draws
// the same geometry as this reached `default:` and has no picture of its own,
// which the book needs to know: an empty space is better than a generic bag
// standing in for a named thing.
let fallbackBones = null
export const spritePen = (word) => ready()(word)

export const spriteSvg = (word, { allowFallback = false } = {}) => {
  const pen = spritePen(word)
  if (!allowFallback) {
    if (fallbackBones === null) fallbackBones = spritePen('no-such-thing-in-this-world').bones()
    if (pen.bones() === fallbackBones) return null
  }
  return pen.svg()
}

export const spriteDataUri = (word, opts) => {
  const s = spriteSvg(word, opts)
  if (!s) return null
  // base64 and not percent-encoding: the handbook also goes through Chrome's
  // print pipeline, and a '#' in a colour inside a bare data: URI ends the URI.
  return 'data:image/svg+xml;base64,' + Buffer.from(s, 'utf8').toString('base64')
}

// ------------------------------------------------------- AND THE BESTIARY
//
// The creatures are not drawn by a function like itemSprite. They are a chain
// of `if (m.type === ...)` blocks inside the scene drawer, 846 lines of it,
// drawn at the place on the map where the thing is standing and leaning on
// whatever that loop has to hand: the facing, the clock, whether it is
// fighting you, and its remaining health.
//
// So this does not call it; it STANDS IN FOR THE WORLD AROUND IT. The clock
// is stopped at zero, which every creature reads through a sine and so puts
// all of them in their neutral pose rather than mid-stride. Nothing is
// fighting anybody. Each one is at full health, facing right.
//
// Anything else the chain reaches for and this does not supply will throw
// with the name of the creature, which is the behaviour wanted: a beast that
// quietly came out as a goblin is the fault this file exists to avoid.
const beastChain = (file) => {
  const W = readFileSync(file, 'utf8')
  const a = W.indexOf("      if (m.type === 'dragon') {")
  if (a < 0) throw new Error('sprite-svg: the creature chain no longer starts at the dragon')
  const b = W.indexOf('\n    }})', a)
  if (b < 0) throw new Error('sprite-svg: cannot find the end of the creature chain')
  const pa = W.indexOf('function poly(pts, fill, stroke) {')
  if (pa < 0) throw new Error('sprite-svg: window-web.html no longer has poly()')
  // THE WINDOW'S OWN STATS, not the engine's. The window keeps a copy of
  // MOB_STATS under its own field names -- `maxHp` where the engine says
  // `maxHealth` -- and a test holds the two to each other. The chain reads
  // that copy, so handing it the engine's put NaN through every health bar:
  // nothing then differed between a creature at full health and one at half,
  // no bar was found, and all of them printed with the bar still on.
  const ma = W.indexOf('const MOB_STATS = {')
  if (ma < 0) throw new Error('sprite-svg: window-web.html no longer has MOB_STATS')
  return {
    chain: W.slice(a, b),
    poly: W.slice(pa, W.indexOf('\n}', pa) + 2),
    stats: W.slice(ma, W.indexOf('\n}', ma) + 2),
  }
}

// THE HEALTH BAR EVERY BLOCK PAINTS OVER ITS OWN HEAD, FOUND BY ASKING
// RATHER THAN BY LISTING. A first pass dropped two known reds and left five
// bars standing, because the dragon bars in crimson, the spider in pink, the
// lamprey in pale green, the siren in navy and the risen in purple. The thing
// they have in common is not a colour: it is that the bar's WIDTH is the
// creature's remaining health.
//
// So each creature is drawn three times, with its health and its tally moved
// between runs, and anything that CHANGES is the window reporting rather than
// the creature itself. The dark backing behind a bar does not change, so it
// is taken with the element it backs when the two are rectangles sharing a
// top edge.
//
// Two runs were not enough: the mere-lamprey carries a second bar for the
// lives it has left of the sixty-four it was born with, and that one is not
// health, so it survived a health-only comparison and printed as a green
// stripe over the mere.

let beast = null
const beastReady = () => {
  if (beast) return beast
  const { chain, poly, stats } = beastChain(HERE + 'window-web.html')
  const body = `
    ${stats}
    return (Pen, type, st) => {
      const cx = new Pen(40)
      cx.skipText = true     // "THE DRAGON", "taken", "3 left": the window's HUD
      ${poly.replace('function poly(pts, fill, stroke) {', 'function poly(pts, fill, stroke) {')}
      const X = 0, Y = 0, MF = 1, now = 0, engaged = false, hop = 0, myId = ''
      // Five of them read the world's own tick instead of the wall clock,
      // which is the same stopped clock by another route: the crow's
      // wingbeat, the lamprey's drift, the barrow-wight's bob.
      const world = { tick: 0 }
      const m = { type, x: 0, y: 0, hp: st.hp, slain: st.slain,
                  mad: null, rootedUntil: 0, lastSwing: 0, id: 'x' }
      const s = { tick: 0, players: {}, mobs: {}, nodes: {}, _pinnedBy: {} }
      const shadow = () => {}
      const rootBind = () => {}
      const draw = () => {
        ${chain}
      }
      draw()
      return cx
    }
  `
  beast = new Function(body)()
  beast.stats = new Function(`${stats}\n    return MOB_STATS`)()
  return beast
}

const rectAt = (e) => {
  const m = /^<rect x="([-\d.]+)" y="([-\d.]+)" width="([-\d.]+)" height="([-\d.]+)"/.exec(e)
  return m ? { x: +m[1], y: +m[2], w: +m[3], h: +m[4] } : null
}
export const beastPen = (type, hp) => {
  const draw = beastReady()
  // Full health unless told otherwise: a bestiary plate shows the creature,
  // not the state somebody left it in.
  const max = hp ?? draw.stats[type]?.maxHp ?? 100
  const full = draw(SvgPen, type, { hp: max, slain: 0 })
  const drop = new Set()
  for (const other of [{ hp: max / 2, slain: 0 }, { hp: max, slain: 32 }]) {
    const o = draw(SvgPen, type, other)
    if (o.out.length !== full.out.length) continue
    for (let i = 0; i < full.out.length; i++) {
      if (full.out[i] === o.out[i]) continue
      drop.add(i)
      const a = rectAt(full.out[i]), b = i > 0 ? rectAt(full.out[i - 1]) : null
      if (a && b && Math.abs(a.y - b.y) < 0.6 && Math.abs(a.h - b.h) < 0.6) drop.add(i - 1)
    }
  }
  full.dropAt(drop)
  full.barsDropped = drop.size
  return full
}
export const beastSvg = (type, hp) => beastPen(type, hp).svg(true)
export const beastDataUri = (type, hp) => {
  const svg = beastSvg(type, hp)
  return svg ? 'data:image/svg+xml;base64,' + Buffer.from(svg, 'utf8').toString('base64') : null
}

// ------------------------------------------------------------------ the check
if (process.argv[1] && process.argv[1].endsWith('sprite-svg.mjs')) {
  const arg = process.argv[2]
  if (arg && arg !== '--check') {
    const s = spriteSvg(arg, { allowFallback: true })
    console.log(s)
  } else {
    const E = (await import('./engine.js')).default
    const list = (v) => v instanceof Set ? [...v] : Array.isArray(v) ? v : Object.keys(v || {})
    const words = list(E.ITEMS)
    let drawn = 0, fell = 0, broke = []
    const bones = new Map()
    for (const w of words) {
      try {
        const s = spriteSvg(w)
        if (s === null) { fell++; continue }
        drawn++
        if (!/^<svg[^>]*>.+<\/svg>$/.test(s)) broke.push(w + ': empty')
        // THE WHOLE ELEMENT, not its geometry and its fill. A first pass
        // compared fills only and reported the four fishing rods as one
        // picture: each rod's wood is a STROKE colour, so the one thing that
        // tells oak from heartwood was the one thing not being read.
        const b = spritePen(w).svg()
        if (bones.has(b)) bones.set(b, bones.get(b) + ',' + w); else bones.set(b, w)
      } catch (e) { broke.push(w + ': ' + e.message) }
    }
    const twins = [...bones.values()].filter((v) => v.includes(','))
    const bytes = words.reduce((n, w) => n + (spriteSvg(w) || '').length, 0)
    console.log('%d words in the world', words.length)
    console.log('%d have a drawing of their own, %d fall back', drawn, fell)
    console.log('%d threw', broke.length)
    for (const b of broke.slice(0, 10)) console.log('   ' + b)
    console.log('%d sets of words draw the same picture', twins.length)
    for (const t of twins.slice(0, 12)) console.log('   ' + t)
    console.log('%d KB of vector art for all of it', Math.round(bytes / 1024))
    if (broke.length) process.exitCode = 1
  }
}
