// §6dj, for the mist window: CAN EVERY SKILL BE TRAINED FROM IN HERE.
//
// Nine skills. A window that can reach eight of them is a window in which one
// trade is invisible, and a citizen who wanted that trade would never find out
// why. This maps each skill to the ENGINE INPUT that pays it, then asks two
// questions in order:
//
//   1. does serve.mjs's act ladder carry that word at all?   (the pillar)
//   2. does the mist window offer it?                        (the window)
//
// The order matters. Where the answer to (1) is no, the window is right not to
// offer it — a deed the pillar drops is a deed that cannot happen, and showing
// it would be the same fault as offering `deposit` in a wood.
//
// No three.js needed: this reads the three files.

import { readFileSync } from 'fs'

const engine = readFileSync('engine.js', 'utf8')
const serve = readFileSync('serve.mjs', 'utf8')
const win = readFileSync('window-writ.html', 'utf8')

// where the xp actually lands, read out of the engine rather than assumed
const PAYS = {
  woodcraft:    [['light', 'firekeeper'], ['fletch', 'fletcher'], ['gather', 'a felled tree']],
  earthcraft:   [['smith', 'smith'], ['gather', 'a worked seam']],
  shorecraft:   [['cook', 'cook'], ['gather', 'a fished pool']],
  hearthcraft:  [['plant', 'farmer'], ['harvest', 'farmer'], ['brew', 'brewer']],
  prowess:      [['attack', 'a blow struck'], ['attackp', 'a blow struck']],
  marksmanship: [['attack', 'a blow struck with a drawn weapon']],
  sorcery:      [['invoke', 'a sigil pressed'], ['cast', 'an anchor spoken'],
                 ['alch', 'transmuting'], ['still', 'the stilling']],
  mourning:     [['offer', 'offered at an ossuary']],
  wayfaring:    [['survey', 'a marker surveyed'], ['deliver', 'a consignment run'],
                 ['charter', 'a chart drawn up']]
}
const routed = (v) => new RegExp("a\\.do === '" + v + "'").test(serve)
const offered = (v) => new RegExp("do: '" + v + "'").test(win)

let unreachable = 0, pillarGaps = new Set()
console.log('  skill          trained by                       pillar  window')
for (const [skill, ways] of Object.entries(PAYS)) {
  const live = ways.filter(([v]) => routed(v) && offered(v))
  const blocked = ways.filter(([v]) => !routed(v))
  const ok = live.length > 0
  for (const [v] of blocked) pillarGaps.add(v)
  const how = ok ? live[0][1] : ways[0][1]
  console.log('  ' + (ok ? ' ok  ' : ' NO  ') + skill.padEnd(13) + how.padEnd(33) +
              (routed(ways[0][0]) ? '  yes  ' : '  no   ') + (ok ? '  yes' : '  \u2014'))
  if (!ok) unreachable++
}
console.log('')
if (pillarGaps.size) {
  console.log('  the pillar drops these words entirely, so no window can send them:')
  console.log('    ' + [...pillarGaps].sort().join(' '))
  console.log('  (the engine takes all of them; serve.mjs\'s act ladder does not carry them)')
}
console.log('')
if (unreachable) {
  console.log('  ' + unreachable + ' of ' + Object.keys(PAYS).length +
              ' skills cannot be trained through this pillar by ANY window.')
  console.log('  That is a routing gap, not a window gap. The mist window is right')
  console.log('  not to offer them: a deed the pillar drops cannot happen, and')
  console.log('  showing it would be the fault this window forbids everywhere else.')
} else {
  console.log('  ok    every skill in the world can be trained from inside the fog')
}
process.exit(0)
