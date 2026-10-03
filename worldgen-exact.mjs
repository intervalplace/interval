#!/usr/bin/env node
// §2s, ENFORCED: NO TRANSCENDENTAL MAY DECIDE A TILE.
//
// This file replaces `worldgen-margin.mjs`, which measured how close the lake
// shoreline came to being decided by the last bit of a `Math.sin`. The answer
// was eleven orders of magnitude, which was reassuring and was never the point:
// `inlandSet` is built from `meander` and `angleOf` now, so there is no margin
// left to measure and nothing to be reassured about.
//
// What is worth checking is the rule itself. §2s permits a transcendental where
// the result is ROUNDED TO A WHOLE TILE in the same expression, because half a
// tile of cushion cannot be crossed by a last-place difference, and forbids it
// anywhere a fraction decides, is compared, or is carried on. The generator has
// about fifty of the first kind and, until this was written, one of the second.
//
// The difference is visible in the source and nowhere else: both are a call to
// `Math.cos`. So this reads the terrain functions and asks, of every
// transcendental in them, whether the value is wrapped in a `Math.round`,
// `Math.floor` or `Math.ceil` that closes in the same expression.
//
//   node worldgen-exact.mjs [--verbose]
//
// Exits non-zero if any terrain function lets a raw transcendental out.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const verbose = process.argv.includes('--verbose')

// ECMA-262 leaves these implementation-approximated. `sqrt` is not among them:
// IEEE-754 requires it to be exactly rounded, which is why §2s permits it.
const LOOSE = /\bMath\.(sin|cos|tan|asin|acos|atan|atan2|exp|log|log2|log10|pow|hypot|cbrt|sinh|cosh|tanh|expm1|log1p)\b/

// AND `hypot` BETWEEN TWO TILES IS A THIRD CASE, neither rounded nor raw.
//
// V8 and JavaScriptCore return different doubles for it, like everything else
// in that list. What makes a comparison of two such distances safe is the
// INTEGERS underneath: a distance between tiles is the square root of an
// integer, so two distances are equal only when the integers are, and when the
// integers differ the distances differ by at least 1/(2d). Measured over every
// integer distance a world this size can hold, the smallest gap between two
// adjacent ones is 5.556e-4 -- twelve orders of magnitude above the error in
// any `hypot` worth the name.
//
// THAT ARGUMENT NEEDS THE ARGUMENTS TO BE INTEGERS, and loses all its force
// without them: `Math.hypot(x * 0.3, y * 0.7) < t` has no such floor under it
// and is exactly as unsafe as a sine. So the exemption is not granted to the
// name, it is granted to the shape: coordinates, their differences, and whole
// numbers. Anything else is reported.
// `q[0] - b.x` is a tile too: an index into a recorded pair of coordinates.
const TILE_ARGS = /^[-+(),\[\]\s\w.]*$/
const FLOATY = /\d*\.\d|\/|\*/

// The files that decide what the ground is. A scatter that seats a prop is in
// here too, because a node's tile is as hashed as a river's.
const FILES = ['worldgen-expanse7.mjs', 'worldgen-water-v7.mjs', 'terrain-mirror.mjs']

/** is this call's value closed by a rounding in the same expression? */
function rounded(line, at) {
  // walk left from the call looking for an unclosed round/floor/ceil
  const before = line.slice(0, at)
  const m = before.match(/Math\.(round|floor|ceil)\(/g)
  if (!m) return false
  // and make sure it has not already closed: count brackets since the last one
  const i = before.lastIndexOf('Math.' + m[m.length - 1].slice(5, -1) + '(')
  let depth = 0
  for (let k = i + m[m.length - 1].length; k < at; k++) {
    if (before[k] === '(') depth++
    else if (before[k] === ')') { if (depth === 0) return false; depth-- }
  }
  return true
}

/** the text between a call's brackets, or null if they do not close on the line */
function argsOf(line, from) {
  if (line[from] !== '(') return null
  let depth = 0
  for (let k = from; k < line.length; k++) {
    if (line[k] === '(') depth++
    else if (line[k] === ')') { depth--; if (!depth) return line.slice(from + 1, k) }
  }
  return null
}

const bad = []
let calls = 0, safe = 0, tiles = 0
for (const f of FILES) {
  const lines = readFileSync(path.join(here, f), 'utf8').split('\n')
  lines.forEach((line, i) => {
    if (/^\s*(\/\/|\*)/.test(line)) return          // a comment may name one
    let at = 0
    for (;;) {
      const m = LOOSE.exec(line.slice(at))
      if (!m) break
      const pos = at + m.index
      calls++
      if (rounded(line, pos)) { safe++; at = pos + m[0].length; continue }
      if (m[0] === 'Math.hypot') {
        const args = argsOf(line, pos + m[0].length)
        if (args !== null && TILE_ARGS.test(args) && !FLOATY.test(args)) {
          tiles++; at = pos + m[0].length; continue
        }
        bad.push(`${f}:${i + 1}: ${m[0]} over something that is not two tiles`
          + `\n      ${line.trim().slice(0, 96)}`)
        at = pos + m[0].length
        continue
      }
      bad.push(`${f}:${i + 1}: ${m[0]} is not closed by a rounding\n      ${line.trim().slice(0, 96)}`)
      at = pos + m[0].length
    }
  })
}

if (verbose || bad.length) {
  console.log(`${calls} transcendental calls across ${FILES.length} terrain files`)
  console.log(`${safe} are rounded to a tile in the same expression`)
  console.log(`${tiles} are a distance between two tiles, which is integers underneath`)
}
if (bad.length) {
  console.log(`\nFAIL, ${bad.length} let a raw value out (§2s):`)
  for (const b of bad) console.log('  ' + b)
  console.log('\nA fraction that decides a tile must come from `meander` and `angleOf`,')
  console.log('which are exact. See `isleR` and `coastR`.')
  process.exit(1)
}
if (verbose) console.log('\nPASS, no transcendental decides a tile')
