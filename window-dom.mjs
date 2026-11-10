// §7ek: A DOCUMENT SMALL ENOUGH TO READ AND REAL ENOUGH TO PRESS.
//
// window-web builds most of its controls by setting `innerHTML` to a string
// of HTML and then finding the pieces again with `querySelectorAll` to hang
// handlers on them. The stall, the bank, the counter, the trade table and the
// spellbook are all that shape. A harness whose document answers every
// question with a shrug -- which is what `check-window-panel.mjs` uses, on
// purpose, to ask only "does a frame throw" -- cannot press any of them, so
// the half of this window that is panels was never pressed by anything.
//
// This is the other instrument: a document with children, attributes and
// handlers, so a test can set a state, let the window draw its panel, find
// the button a citizen would find, and click it.
//
// It is deliberately small. No layout, no CSS cascade, no events bubbling
// anywhere they are not needed. What it has is what this window asks for, and
// anything it does not have should be added here rather than worked around in
// a checker, or the two drift.

const DATA = /^data-(.+)$/

// The crudest HTML parse that is honest about nesting: walk the tags.
// Attribute values may hold '>' inside quotes, so the scan is quote-aware --
// the first version split on '>' and cut every style attribute in half.
function parseInto (parent, html, doc) {
  let i = 0
  const stack = [parent]
  const text = []
  const flush = () => {
    const t = text.join('')
    text.length = 0
    if (t.trim()) stack[stack.length - 1]._text.push(t)
  }
  while (i < html.length) {
    const lt = html.indexOf('<', i)
    if (lt < 0) { text.push(html.slice(i)); break }
    text.push(html.slice(i, lt))
    // find the matching '>' outside quotes
    let j = lt + 1, q = null
    for (; j < html.length; j++) {
      const c = html[j]
      if (q) { if (c === q) q = null; continue }
      if (c === '"' || c === "'") { q = c; continue }
      if (c === '>') break
    }
    const raw = html.slice(lt + 1, j)
    i = j + 1
    if (raw.startsWith('!')) continue                 // a comment or a doctype
    flush()
    if (raw.startsWith('/')) { if (stack.length > 1) stack.pop(); continue }
    const selfClose = raw.endsWith('/')
    const body = selfClose ? raw.slice(0, -1) : raw
    const sp = body.search(/\s/)
    const tag = (sp < 0 ? body : body.slice(0, sp)).toLowerCase()
    const el = doc.createElement(tag)
    if (sp > 0) {
      for (const m of body.slice(sp).matchAll(/([a-zA-Z_:][-\w:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g))
        el.setAttribute(m[1], m[3] ?? m[4] ?? m[5] ?? '')
      for (const m of body.slice(sp).matchAll(/(^|\s)([a-zA-Z_:][-\w:.]*)(?=\s|$)/g))
        if (!el.hasAttribute(m[2])) el.setAttribute(m[2], '')
    }
    stack[stack.length - 1].appendChild(el)
    const VOID = ['br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'path', 'rect', 'circle', 'use']
    if (!selfClose && !VOID.includes(tag)) stack.push(el)
  }
  flush()
}

function matches (el, sel) {
  for (const part of sel.split(',').map((s) => s.trim()).filter(Boolean)) {
    // only the three shapes this window uses, and an exact tag
    let m = /^\[([-\w]+)(?:=["']?([^\]"']*)["']?)?\]$/.exec(part)
    if (m) { if (!el.hasAttribute(m[1])) continue
      if (m[2] !== undefined && el.getAttribute(m[1]) !== m[2]) continue
      return true }
    m = /^\.([-\w]+)$/.exec(part)
    if (m) { if ((el.getAttribute('class') ?? '').split(/\s+/).includes(m[1])) return true; continue }
    m = /^#([-\w]+)$/.exec(part)
    if (m) { if (el.getAttribute('id') === m[1]) return true; continue }
    if (/^[a-zA-Z][\w-]*$/.test(part) && el.tagName === part.toLowerCase()) return true
  }
  return false
}

class El {
  constructor (tag, doc) {
    this.tagName = tag
    this._doc = doc
    this._attrs = new Map()
    this.children = []
    this._text = []
    this.parentNode = null
    this._handlers = {}
    this.style = new Proxy({ cssText: '' }, {
      get: (t, k) => (k in t ? t[k] : ''),
      set: (t, k, v) => { t[k] = v; if (k === 'cssText') t._raw = v; return true },
    })
    this.dataset = new Proxy({}, {
      get: (t, k) => this._attrs.get('data-' + String(k).replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())),
      set: (t, k, v) => { this.setAttribute('data-' + String(k), String(v)); return true },
      has: (t, k) => this._attrs.has('data-' + String(k)),
    })
    this.classList = {
      add: (c) => this.setAttribute('class', ((this.getAttribute('class') ?? '') + ' ' + c).trim()),
      remove: (c) => this.setAttribute('class',
        (this.getAttribute('class') ?? '').split(/\s+/).filter((x) => x !== c).join(' ')),
      contains: (c) => (this.getAttribute('class') ?? '').split(/\s+/).includes(c),
    }
  }
  setAttribute (k, v) {
    this._attrs.set(k, String(v))
    if (k === 'id') this._doc._byId.set(String(v), this)
    if (k === 'style') this.style.cssText = String(v)
  }
  getAttribute (k) { return this._attrs.has(k) ? this._attrs.get(k) : null }
  hasAttribute (k) { return this._attrs.has(k) }
  removeAttribute (k) { this._attrs.delete(k) }
  get id () { return this.getAttribute('id') ?? '' }
  set id (v) { this.setAttribute('id', v) }
  get value () { return this.getAttribute('value') ?? '' }
  set value (v) { this.setAttribute('value', v) }
  appendChild (c) { c.parentNode = this; this.children.push(c); return c }
  insertBefore (c, ref) {
    c.parentNode = this
    const at = ref ? this.children.indexOf(ref) : -1
    if (at < 0) this.children.push(c); else this.children.splice(at, 0, c)
    return c
  }
  removeChild (c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c }
  remove () { this.parentNode?.removeChild(this) }
  get innerHTML () { return this._html ?? '' }
  set innerHTML (v) {
    this._html = String(v)
    this.children.length = 0
    this._text.length = 0
    parseInto(this, this._html, this._doc)
  }
  get textContent () {
    return [...this._text, ...this.children.map((c) => c.textContent)].join('')
  }
  set textContent (v) { this.children.length = 0; this._text = [String(v)]; this._html = '' }
  get firstChild () { return this.children[0] ?? null }
  get nextSibling () {
    const k = this.parentNode?.children ?? []
    return k[k.indexOf(this) + 1] ?? null
  }
  get offsetWidth () { return 800 }
  get offsetHeight () { return 600 }
  get clientWidth () { return 800 }
  get clientHeight () { return 600 }
  get offsetLeft () { return 0 }
  get offsetTop () { return 0 }
  // THE RECT MUST AGREE WITH THE BACKING STORE. A canvas whose box says one
  // size and whose pixels say another makes the window scale every press, so
  // a click lands on a different tile than the one it was aimed at. The
  // window sets `width` and `height` on the element itself; this answers with
  // those where they exist, which is what a browser does when no CSS resizes
  // the canvas.
  getBoundingClientRect () {
    const w = typeof this.width === 'number' ? this.width : 800
    const h = typeof this.height === 'number' ? this.height : 600
    return { left: 0, top: 0, right: w, bottom: h, width: w, height: h, x: 0, y: 0 }
  }
  scrollIntoView () {}
  focus () {}
  blur () {}
  getContext () { return this._doc._ctx2d() }
  toDataURL () { return 'data:,' }
  requestPointerLock () {}
  addEventListener (t, f) { (this._handlers[t] ||= []).push(f) }
  removeEventListener (t, f) {
    this._handlers[t] = (this._handlers[t] ?? []).filter((g) => g !== f)
  }
  dispatchEvent (e) {
    const t = e.type
    for (const f of this._handlers[t] ?? []) f(e)
    const on = this['on' + t]
    if (typeof on === 'function') on(e)
    return true
  }
  // A CLICK BUBBLES. Several of this window's panes wire one listener on the
  // pane and find the control with `e.target.closest(...)`, so a click that
  // does not travel up reaches nothing at all: the trade table, which is
  // entirely delegated, answered no press until this was fixed.
  click (ev = {}) {
    let stopped = false
    const e = { type: 'click', target: this, bubbles: true,
      preventDefault () {}, stopPropagation () { stopped = true }, ...ev }
    let n = this
    while (n) {
      for (const f of n._handlers[e.type] ?? []) f(e)
      const on = n['on' + e.type]
      if (typeof on === 'function') on(e)
      if (stopped || e.bubbles === false) break
      n = n.parentNode
    }
    return true
  }
  closest (sel) {
    let n = this
    while (n) { if (matches(n, sel)) return n; n = n.parentNode }
    return null
  }
  _walk (out = []) { for (const c of this.children) { out.push(c); c._walk(out) } return out }
  querySelectorAll (sel) { return this._walk().filter((e) => matches(e, sel)) }
  querySelector (sel) { return this.querySelectorAll(sel)[0] ?? null }
}

// The canvas pen: it must answer everything and remember nothing, EXCEPT the
// words. What a window writes on the world is the one thing about a frame
// that can be read back and held to a rule, so every `fillText` is kept.
export const penSaid = []
// and what colour it filled with, for the marks that are not words: a chart's
// dots cannot be read back any other way.
export const penInk = []
// §7ef: AND WHERE IT PUT THEM. Ink alone cannot answer "is this drawn the
// way its line runs", which is the one question three kinds of boundary kept
// getting wrong: a hedge in a north-south run drew the same east-west block
// as one in a row. Shape is the whole of that question, so every filled and
// stroked rectangle keeps its box, and a check can ask whether what the
// window drew is taller than it is wide.
export const penRect = []
const ctx2d = () => {
  const o = { measureText: () => ({ width: 10 }), canvas: null,
  fillText: (t) => { penSaid.push(String(t)) },
  strokeText: (t) => { penSaid.push(String(t)) },
  fillRect: (x, y, w, h) => { penInk.push(String(o.fillStyle ?? ''))
    if (Number.isFinite(w) && Number.isFinite(h)) penRect.push([+x, +y, +w, +h]) },
  strokeRect: (x, y, w, h) => {
    if (Number.isFinite(w) && Number.isFinite(h)) penRect.push([+x, +y, +w, +h]) },
  // and a line is a shape too: the iron railing is drawn entirely in strokes,
  // so a check that only watched rectangles could not see it at all and
  // reported that it had drawn nothing.
  moveTo: (x, y) => { o._pen = [+x, +y] },
  lineTo: (x, y) => {
    if (o._pen && Number.isFinite(x) && Number.isFinite(y))
      penRect.push([Math.min(o._pen[0], +x), Math.min(o._pen[1], +y),
        Math.abs(+x - o._pen[0]), Math.abs(+y - o._pen[1])])
    o._pen = [+x, +y] },
  createRadialGradient: () => ({ addColorStop () {} }),
  createLinearGradient: () => ({ addColorStop () {} }),
  createPattern: () => null, getImageData: () => ({ data: new Uint8ClampedArray(4) }),
  putImageData () {}, drawImage () {} }
  return new Proxy(o, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => (t[k] = v, true) })
}

export function makeDocument (html = '') {
  const doc = {
    _byId: new Map(),
    _ctx2d: ctx2d,
    createElement: (tag) => new El(String(tag).toLowerCase(), doc),
    createTextNode: (t) => { const e = new El('#text', doc); e.textContent = t; return e },
    createElementNS: (ns, tag) => new El(String(tag).toLowerCase(), doc),
    getElementById: (id) => doc._byId.get(id) ?? null,
    addEventListener (t, f) { (doc._handlers[t] ||= []).push(f) },
    removeEventListener () {},
    exitPointerLock () {},
    pointerLockElement: null,
    _handlers: {},
  }
  doc.documentElement = new El('html', doc)
  doc.body = new El('body', doc)
  doc.head = new El('head', doc)
  doc.documentElement.appendChild(doc.head)
  doc.documentElement.appendChild(doc.body)
  doc.querySelector = (s) => doc.documentElement.querySelector(s)
  doc.querySelectorAll = (s) => doc.documentElement.querySelectorAll(s)
  // EVERY ID THE SHIPPED PAGE HAS. The window reaches for these by name
  // before it has drawn anything, and a null there is a throw a real browser
  // never gives it. Taken from the file rather than listed here, so a new one
  // added to the page is present the day it is added.
  if (html) {
    const body = html.replace(/<script\b[\s\S]*?<\/script>/g, '')
    for (const m of body.matchAll(/<([a-zA-Z][\w-]*)\b[^>]*\bid\s*=\s*["']([^"']+)["']/g)) {
      if (doc._byId.has(m[2])) continue
      const el = doc.createElement(m[1])
      el.setAttribute('id', m[2])
      doc.body.appendChild(el)
    }
  }
  return doc
}

export { El, matches }
