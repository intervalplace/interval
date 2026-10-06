// WHAT THE WORLD WRITES DOWN, AND THEREFORE WHAT ANY WINDOW CAN SHOW.
//
// `deed` is one optional word on a citizen, set on the interval an instant act
// lands and dropped at the top of the next. It is the whole of how a watcher
// learns that somebody cast, forged, paid a toll or swore a calling: those acts
// finish inside one interval and leave no `action` behind them.
//
// WHY THIS FILE EXISTS. The list was written for the deeds that PAY, and for a
// long time that was all it held. Everything else a citizen performs in one
// interval went unrecorded: a gambit, all four spells of the barrow book,
// swearing a calling, drawing a bow, sailing, every craft at a workshop and
// every act at a market stall. Nobody standing beside them could see any of it.
//
// The cost was measured in the Unreal window, which keys both a figure's
// ANIMATION and its SOUND off this word: fifty-four animations and sixteen
// noises had been authored, wired and shipped for verbs the world could never
// name. Four careful clips for the gambit and five synthesised blows, none of
// which anything could ever play. The audits did not catch it because they
// counted the rows in the window's tables rather than asking whether the world
// could ever say the word.
//
// So this holds the two halves that together make the word trustworthy: every
// entry is a verb that exists, and the word really does arrive and really does
// go away again.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import E from '../engine.js'

const SRC = readFileSync(new URL('../engine.js', import.meta.url), 'utf8')

function deedList() {
  const at = SRC.indexOf('const DEEDS = [')
  assert.ok(at > 0, 'engine.js has no DEEDS list')
  const body = SRC.slice(at, SRC.indexOf('];', at))
  // the comments inside the list quote section numbers, not verbs, so only
  // the quoted lowercase words are taken
  return [...new Set([...body.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]))]
}

const VERBS = new Set([...SRC.matchAll(/inp\.type === '([a-z_]+)'/g)].map((m) => m[1]))

// AND THE WORDS A HANDLER NAMES FOR ITSELF. A deed is normally the verb the
// citizen sent. Where the verb does not describe what happened, the handler
// overwrites it: taking forage arrives as `pickup` and is nothing like one,
// because forage never enters the pack and taking it is eating it.
const OWN = new Set([...SRC.matchAll(/\.deed = '([a-z_]+)'/g)].map((m) => m[1]))

test('every deed the world records is a word the world can write', () => {
  // THE FAILURE THIS CATCHES IS SILENT, which is what makes it worth a test.
  // `recall` sat in this list after §6ch repealed the waystones: `mayDo`
  // answers it false for everyone forever, so no input of that type is ever
  // applied and the word could never be written. A stray here reads as a deed
  // the world supports and is a dead letter.
  const stray = deedList().filter((d) => !VERBS.has(d) && !OWN.has(d))
  assert.deepEqual(stray, [],
    'these are in DEEDS and nothing can ever write them: ' + stray.join(', '))
})

test('forage is recorded as itself and not as a pickup', () => {
  // The deed arrives through the `pickup` handler and the handler renames it.
  // If that overwrite is ever tidied away, forage silently becomes an ordinary
  // pickup again: same word, same animation, same noise as pocketing a log,
  // and the one act in the world that is taken and eaten in one interval stops
  // being distinguishable from any other.
  assert.ok(OWN.has('forage'),
    'the pickup handler must name this deed `forage`')
  assert.ok(new Set(deedList()).has('forage'),
    'and DEEDS must list it, because that list is what a citizen can be seen to do')
})

test('nothing a bystander would plainly see is left unrecorded', () => {
  // The judgement about which verbs are public is argued out in the comment
  // over DEEDS. This does not re-make it; it pins the ones whose absence was
  // the actual fault, so they cannot quietly fall out again.
  const deeds = new Set(deedList())
  for (const v of ['gambit', 'rot', 'taking', 'waking', 'withering',
                   'swear', 'wield', 'unwield', 'nock', 'sail', 'turn',
                   'smelt', 'saw', 'grind', 'brew', 'stoke', 'survey',
                   'pay', 'consign', 'deliver', 'accept_trade']) {
    assert.ok(VERBS.has(v), v + ' is no longer a verb; this list needs revising')
    assert.ok(deeds.has(v), v + ' is a thing anybody watching would see, and the world does not write it down')
  }
})

test('the four verbs that run on by themselves are NOT deeds', () => {
  // They set an `action` instead, which the world already shows and which a
  // window reads for as long as the work lasts. Recording them as a deed as
  // well would say the act happened on one interval when it happens on many.
  const deeds = new Set(deedList())
  for (const v of ['gather', 'attack', 'attackp', 'raise_market'])
    assert.ok(!deeds.has(v), v + ' leaves an action behind it and must not also be a deed')
})

// ---- AND THAT THE WORD ACTUALLY ARRIVES, AND ACTUALLY LEAVES ----
//
// The list being right is half of it. A deed set on the wrong interval, or
// never cleared, is a citizen who appears to be forever casting.
const RULES = 'b'.repeat(64)

function oneCitizen() {
  const g = E.makeGenesis('deed-test', RULES, 0)
  const s = E.newWorld(g)
  const who = E.generateIdentity()
  E.addPlayer(s, who.playerId, Math.floor(g.worldW / 2), Math.floor(g.worldH / 2))
  return { g, s, who }
}

test('a deed is written on the interval it lands and gone on the next', () => {
  const { g, s, who } = oneCitizen()
  const p = s.players[who.playerId]
  E.addItem(p.inventory, 'iron-dagger', 1)
  const slot = p.inventory.findIndex((i) => i && i.item === 'iron-dagger')

  const input = E.signInput(
    { worldId: E.worldId(g), playerId: who.playerId, tick: s.tick,
      type: 'wield', slot }, who.privateKey)
  const after = E.nextState(s, [input])
  assert.equal(after.players[who.playerId].deed, 'wield',
    'wielding is an instant act and the world should say so')

  const later = E.nextState(after, [])
  assert.equal(later.players[who.playerId].deed, undefined,
    'and it is one interval old: the word must not linger')
})

test('taking forage writes `forage`, not `pickup`', () => {
  // The behaviour, not the source line. A citizen stooping to eat in the
  // middle of a fight is how anybody watching knows they are in trouble, and
  // that reading only works if the word is different from pocketing a log.
  const { g, s, who } = oneCitizen()
  const p = s.players[who.playerId]
  p.health = 2
  s.ground = s.ground ?? {}
  s.ground.g1 = { item: 'forage', qty: 1, x: p.x, y: p.y, expiresAt: s.tick + 50 }

  const input = E.signInput(
    { worldId: E.worldId(g), playerId: who.playerId, tick: s.tick,
      type: 'pickup', groundId: 'g1', confirm: false }, who.privateKey)
  const after = E.nextState(s, [input])
  const them = after.players[who.playerId]

  assert.equal(them.deed, 'forage',
    'the verb sent was `pickup` and the act was eating: the world records the act')
  assert.ok(them.health > 2, 'and it healed them where it lay')
  assert.ok(!after.ground.g1, 'and it is gone from the ground')
  assert.ok(!them.inventory.some((i) => i && i.item === 'forage'),
    'it never reaches the pack: that is the whole of why it is not a pickup')
})
