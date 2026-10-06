// THE AFTERLIFE: a world stops, and its citizens cross into the next one.
//
// When quorum is permanently gone a world halts and cannot be restarted. The
// only continuation is a successor world whose genesis `imported` seats the
// citizens of the last certified checkpoint (CONSENSUS.md §9). That crossing
// is the single most important piece of code in the project that nobody can
// ever re-run: it happens once, at the moment a world ends, with no chance to
// try it again and usually with nobody watching.
//
// It had never been tested. It lived inline in serve.mjs, fifty lines in the
// middle of a fifteen-hundred-line server, where there was no way to call it
// without starting a node. Two faults had already reached it unseen:
//
//   §5k  `calling` was not carried, so every sworn citizen arrived unsworn.
//        An unsworn citizen is capped at level 50 in every skill, so a
//        forester carried at woodcraft 70 made `validateState` refuse the
//        world the founding had just built, and a master arrived with the
//        wrong maximum health.
//   §6g  vaults are keyed by BANK NODE ID. Carried whole, they would strand
//        everything on the shelves of a building the new world never built.
//
// And this suite found a third while it was being written: the crossing
// carries people out of a checkpoint that serve.mjs has ALREADY refused as
// damaged (which is right, losing everybody to a half-written file is worse)
// but it also stamped that checkpoint's `stateHash` into the new genesis as
// provenance without ever checking the state hashed to it. A doctored
// checkpoint would have produced a successor world permanently attesting to a
// state it never saw. Citizens still cross; the attestation is now withheld.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import E from '../engine.js'
import { lived, carry, provenance } from '../crossing.mjs'
import { foundGenesis, buildWorld, seatsImports, generatorIds } from '../worldgen-any.mjs'
import { rulesHash } from '../rules-hash.mjs'
import { shortTmp } from './tmpdir.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// The smallest generator that seats imports at all. `worldgen.mjs` (classic)
// and the first two expanses predate `seatImport` and silently drop anyone
// carried, so a crossing test written against them would pass by testing
// nothing. v3 at its minimum size builds in well under a second.
const GEN = 'interval-expanse-v3'
const [W, H] = [448, 256]

const PID = (n) => String(n).repeat(64).slice(0, 64)
const xpAt = (lvl) => E.XP_TABLE[lvl]

// A citizen with one of everything the crossing has to carry: a name, a sworn
// calling, xp past the unsworn ceiling, goods on two different banks' shelves,
// a weapon, and two items this world has no word for.
function aCitizen(over = {}) {
  const p = {
    x: 100, y: 100,
    skills: Object.fromEntries(E.SKILLS.map((s) => [s, 0])),
    health: 40,
    equipment: { weapon: null, head: null, body: null, offhand: null, legs: null },
    vaults: {},
    lastInput: 0, gold: 7,
    inventory: Array(E.INV_SLOTS).fill(null),
    consignment: null, action: null, name: 'alder', trade: null,
    calling: 'warden',
  }
  p.skills.prowess = xpAt(70)      // warden's own skill, past the unsworn cap of 50
  p.skills.woodcraft = xpAt(30)
  p.inventory[0] = { item: 'oak-logs', qty: 5 }
  p.inventory[3] = { item: 'ghost-item', qty: 1 }   // a word this world does not know
  p.equipment.weapon = { item: 'iron-sword', qty: 1 }
  p.vaults = {
    'bank-anchor': { 'oak-logs': 10, coal: 4 },
    'bank-millbrook': { 'oak-logs': 5, 'not-an-item': 99 },
  }
  return { ...p, ...over }
}

// ---------------------------------------------------------------- who crosses

test('a pure ghost does not cross, and each way of having lived does', () => {
  const blank = () => ({
    skills: Object.fromEntries(E.SKILLS.map((s) => [s, 0])),
    inventory: Array(E.INV_SLOTS).fill(null), vaults: {}, equipment: { weapon: null }, name: null,
  })
  assert.equal(lived(blank()), false, 'spawned once, did nothing, never returned')

  assert.equal(lived({ ...blank(), name: 'alder' }), true, 'a name')
  assert.equal(lived({ ...blank(), skills: { ...blank().skills, woodcraft: 1 } }), true, 'one xp')
  const withItem = blank(); withItem.inventory[4] = { item: 'coal', qty: 1 }
  assert.equal(lived(withItem), true, 'something in hand')
  assert.equal(lived({ ...blank(), vaults: { 'bank-anchor': {} } }), true, 'a shelf')
  assert.equal(lived({ ...blank(), equipment: { weapon: { item: 'iron-sword', qty: 1 } } }), true, 'a weapon')
})

test('a pre-rename checkpoint’s hitpoints xp does not make a ghost look alive', () => {
  // `hitpoints` was retired when the frame went flat, but every checkpoint
  // written before then starts a citizen at 1154 xp in it. Read without the
  // threshold, every ghost in a pre-rename world looks like somebody who lived.
  const ghost = {
    skills: { ...Object.fromEntries(E.SKILLS.map((s) => [s, 0])), hitpoints: 1154 },
    inventory: [], vaults: {}, equipment: { weapon: null }, name: null,
  }
  assert.equal(lived(ghost), false)
  assert.equal(lived({ ...ghost, skills: { ...ghost.skills, hitpoints: 1155 } }), true)
})

// --------------------------------------------------------------- what crosses

test('a sworn citizen crosses whole', () => {
  const [c] = carry({ [PID('a')]: aCitizen() })
  assert.equal(c.pid, PID('a'))
  assert.equal(c.name, 'alder')
  assert.equal(c.calling, 'warden', '§5k: the swearing crosses, or the new world refuses itself')
  assert.equal(c.health, 40)
  assert.equal(c.skills.prowess, xpAt(70))
  assert.deepEqual(c.weapon, { item: 'iron-sword', qty: 1 })
})

test('vaults are summed across banks, and the geography is left behind', () => {
  // §6g: vault keys are bank NODE IDs, and the ids of a world that no longer
  // exists name nothing. The shelves are summed on the way out and worldgen
  // seats the total at the counter nearest where the citizen wakes.
  const [c] = carry({ [PID('a')]: aCitizen() })
  assert.deepEqual(c.vaults, { 'oak-logs': 15, coal: 4 }, '10 + 5 from two different banks')
  assert.equal(Object.keys(c.vaults).some((k) => k.startsWith('bank-')), false, 'no node ids survive')
})

test('anything this world has no word for is dropped, everywhere it can hide', () => {
  const p = aCitizen()
  p.equipment.weapon = { item: 'ghost-sword', qty: 1 }
  const [c] = carry({ [PID('a')]: p })
  assert.equal(c.inventory.length, 1, 'ghost-item dropped from the pack')
  assert.equal(c.inventory[0].item, 'oak-logs')
  assert.equal(c.vaults['not-an-item'], undefined, 'and from the shelves')
  assert.equal(c.weapon, null, 'and from the hand')
  for (const it of [...c.inventory.map((s) => s.item), ...Object.keys(c.vaults)])
    assert.ok(E.ITEMS.has(it), it + ' is not a word this world knows')
})

test('a name the constitution would refuse crosses as no name at all', () => {
  const [c] = carry({ [PID('a')]: aCitizen({ name: 'Alder The Third!!' }) })
  assert.equal(c.name, null, 'constitutional or nothing (rev5 §3)')
  assert.equal(c.pid, PID('a'), 'the citizen still crosses')
})

test('a checkpoint written before the health rename is read correctly', () => {
  const old = aCitizen()
  delete old.health
  old.hp = 33
  const [c] = carry({ [PID('a')]: old })
  assert.equal(c.health, 33, 'this is the one place that has to know the old word')
})

// ----------------------------------------------------- the new world accepts

test('what the crossing produces is what the door accepts', () => {
  // The §5k regression, stated as the engine states it. `validateImports` is
  // the door into a new world, and it is the only door no validated input ever
  // passed through. What `carry` hands it must be admissible by construction.
  const imported = carry({ [PID('a')]: aCitizen(), [PID('b')]: aCitizen({ name: 'brin' }) })
  assert.equal(imported.length, 2)
  assert.equal(E.validateImports(imported), null, E.validateImports(imported))

  // and strip the calling, as the crossing did before §5k, and the same
  // citizen is refused: prowess 70 above an unsworn ceiling of 50
  const unsworn = imported.map((c) => ({ ...c, calling: null }))
  assert.notEqual(E.validateImports(unsworn), null, 'an unsworn citizen may not hold level 70')
})

test('a world founded on a crossing seats every citizen whole', () => {
  const RH = rulesHash(new URL('../', import.meta.url))
  const g = foundGenesis(GEN, 'afterlife-test', RH, 1700000000000, W, H)
  g.imported = carry({ [PID('a')]: aCitizen() })
  g.witnesses = [PID('f')]
  g.quorum = 1
  g.byzantineTolerance = 0

  const w = buildWorld(g)
  const p = w.players[PID('a')]
  assert.ok(p, 'the citizen woke up in the new world')
  assert.equal(p.name, 'alder')
  assert.equal(w.names.alder, PID('a'), 'and the registry knows the name is theirs')
  assert.equal(p.calling, 'warden')
  assert.equal(p.skills.prowess, xpAt(70))
  assert.equal(E.levelForXp(p.skills.prowess), 70, 'the level survived the crossing')
  assert.deepEqual(p.equipment.weapon, { item: 'iron-sword', qty: 1 })
  assert.equal(p.inventory[0].item, 'oak-logs')

  // §5j: the frame is flat and a calling moves it. A warden carries +16, which
  // is the number that was wrong for every carried master before §5k.
  assert.equal(E.maxHealth(p), E.maxHealth({ ...p, calling: null }) + 16)

  // the shelves landed at a real counter in a world that had never heard of
  // the bank they were stored in
  const shelves = Object.values(p.vaults)
  assert.equal(shelves.length, 1, 'one counter, the nearest to where they woke')
  assert.deepEqual(shelves[0], { 'oak-logs': 15, coal: 4 })

  // and the world the founding built is a world the engine will accept
  assert.equal(E.validateState(w), null, E.validateState(w))
})

// ------------------------------------------------------------------ the claim

test('provenance is withheld when the state does not hash to the hash it carries', () => {
  const state = { tick: 3, players: {} }
  const good = { worldId: 'w'.repeat(64), tick: 3, state, stateHash: E.stateHash(state) }
  assert.deepEqual(provenance(good), { worldId: 'w'.repeat(64), stateHash: good.stateHash, tick: 3 })

  // a checkpoint carrying a real world's identity and a state it never held:
  // the citizens in it still cross, but the new world must not swear to it
  const forged = { ...good, state: { tick: 3, players: { [PID('a')]: aCitizen() } } }
  assert.equal(provenance(forged), null, 'a successor may not attest to a state it never saw')

  assert.equal(provenance(null), null)
  assert.equal(provenance({ worldId: 'w'.repeat(64), tick: 3 }), null, 'no state, no claim')
  assert.equal(provenance({ ...good, tick: 'three' }), null)
})

// ---------------------------------------------- the country has to seat them

test('every generator either seats the citizens who cross, or is refused', () => {
  // Carrying people is only half the crossing: the generator is what stands
  // them on the ground. `worldgen-expanse.mjs` and `worldgen-expanse2.mjs`
  // have no line that reads `imported` at all, so a world founded on either
  // while carrying citizens builds a valid, empty country and says nothing.
  //
  // They are not fixed: they exist to rebuild worlds that already happened,
  // and a generator that builds a different state from the same genesis is no
  // longer that generator. They are refused at founding instead. This test
  // exists so that a NEW generator cannot quietly join them, which is the way
  // this would actually happen.
  const bySource = new Map()
  for (const f of fs.readdirSync(root).filter((x) => /^worldgen(-expanse\d*)?\.mjs$/.test(x))) {
    const src = fs.readFileSync(path.join(root, f), 'utf8')
    const id = (src.match(/^export const GENERATOR_ID = '([^']+)'/m) ?? [])[1]
    if (id) bySource.set(id, /\bE\.seatImport\s*\(/.test(src))
  }
  assert.ok(bySource.size >= 8, 'found ' + bySource.size + ' generators; expected every worldgen file')

  for (const [id, seats] of bySource)
    assert.equal(seatsImports(id), seats,
      seats ? `${id} seats imports but worldgen-any.mjs says it does not`
        : `${id} does not seat imports but worldgen-any.mjs says it does`)

  for (const id of generatorIds())
    assert.ok(bySource.has(id), `${id} is registered but no worldgen file declares it`)
})

// -------------------------------------------------- and now do it for real

// Everything above tests the crossing. This runs it: a node founds a world,
// ticks, checkpoints, is killed, and a second node starts over the same data
// directory and carries the dead world's citizens into a new one. It is the
// afterlife end to end, through serve.mjs, with nothing stubbed.
//
// It runs by default and costs about fifteen seconds. A test of the thing that
// happens once and cannot be retried is worth little if it is the test nobody
// runs; set INTERVAL_SKIP_E2E=1 when iterating on something else.
const SKIP_E2E = process.env.INTERVAL_SKIP_E2E === '1'

function runNode(dataDir, env, until, timeoutMs = 90000) {
  return new Promise((resolve, reject) => {
    const log = path.join(dataDir, env.INTERVAL_SEED + '.log')
    const out = fs.openSync(log, 'a')
    const child = spawn(process.execPath, ['serve.mjs'], {
      cwd: root, stdio: ['ignore', out, out],
      env: { ...process.env, INTERVAL_DATA: dataDir, INTERVAL_GEN: GEN, INTERVAL_W: String(W), INTERVAL_H: String(H),
        INTERVAL_CHECKPOINT_INTERVAL: '2', INTERVAL_NO_CACHE: '1', ...env },
    })
    let done = false
    const finish = (err) => {
      if (done) return
      done = true
      clearInterval(poll); clearTimeout(bell)
      try { child.kill('SIGKILL') } catch { /* already gone */ }
      try { fs.closeSync(out) } catch { /* already closed */ }
      const text = fs.existsSync(log) ? fs.readFileSync(log, 'utf8') : ''
      err ? reject(new Error(err + '\n--- node log ---\n' + text)) : resolve(text)
    }
    child.on('error', (e) => finish('could not start serve.mjs: ' + e.message))
    child.on('exit', (code) => { if (!done && !until()) finish('serve.mjs exited early (code ' + code + ')') })
    const poll = setInterval(() => { if (until()) finish(null) }, 250)
    const bell = setTimeout(() => finish('timed out after ' + timeoutMs + 'ms waiting for the node'), timeoutMs)
  })
}

test('a world dies and its citizens wake up in the next one', { skip: SKIP_E2E, timeout: 240000 }, async () => {
  const dir = shortTmp('afterlife-')
  const cp = path.join(dir, 'checkpoints', 'web.json')
  const worldFile = path.join(dir, 'checkpoints', 'world.json')
  const port = 8800 + (process.pid % 300)
  try {
    // --- the first world lives, and writes down what it is
    await runNode(dir, { INTERVAL_SEED: 'alpha', INTERVAL_HTTP_PORT: String(port), INTERVAL_P2P_PORT: String(port + 1000) },
      () => fs.existsSync(cp) && JSON.parse(fs.readFileSync(cp, 'utf8')).tick >= 2)
    const before = JSON.parse(fs.readFileSync(cp, 'utf8'))
    const deadWorld = before.worldId
    assert.ok(deadWorld, 'the first world has an identity')

    // --- somebody lives in it. The node is stopped, so this writes the
    // citizen straight into the checkpoint and re-hashes it, which is exactly
    // the artefact the afterlife has to work from: a saved state and nothing
    // else. Playing a citizen up to a sworn calling would take a real week.
    before.state.players[PID('a')] = aCitizen()
    before.state.players[PID('b')] = {   // a ghost, who stays behind
      x: 1, y: 1, skills: Object.fromEntries(E.SKILLS.map((s) => [s, 0])), health: 40,
      equipment: { weapon: null }, vaults: {}, lastInput: 0, gold: 0,
      inventory: Array(E.INV_SLOTS).fill(null), consignment: null, action: null, name: null, trade: null,
    }
    before.stateHash = E.stateHash(before.state)
    fs.writeFileSync(cp, JSON.stringify(before))

    // --- the world is gone. A changed seed is the cheapest way to say "this
    // world cannot be continued": the same refusal a lost quorum produces, and
    // the same branch in serve.mjs, without waiting a day for the gap.
    const log = await runNode(dir, { INTERVAL_SEED: 'omega', INTERVAL_HTTP_PORT: String(port), INTERVAL_P2P_PORT: String(port + 1000) },
      () => {
        if (!fs.existsSync(worldFile)) return false
        try { return JSON.parse(fs.readFileSync(worldFile, 'utf8')).genesis?.genesisSeed === 'solo-omega' }
        catch { return false }
      })

    assert.match(log, /REFOUNDING/, 'the node said why the world started over')
    assert.match(log, /carrying 1 citizen/, 'one citizen crossed, and the ghost did not')

    // --- and the citizen is there, in a world that did not exist an hour ago
    const g = JSON.parse(fs.readFileSync(worldFile, 'utf8')).genesis
    assert.notEqual(E.worldId(g), deadWorld, 'a successor, honestly: a new identity, not a resurrection')
    assert.equal(g.imported.length, 1)
    const [c] = g.imported
    assert.equal(c.pid, PID('a'))
    assert.equal(c.name, 'alder')
    assert.equal(c.calling, 'warden')
    assert.equal(c.skills.prowess, xpAt(70))
    assert.deepEqual(c.vaults, { 'oak-logs': 15, coal: 4 })
    assert.deepEqual(c.weapon, { item: 'iron-sword', qty: 1 })

    // the new world says, in its own identity, which world it continues
    assert.equal(g.importedFrom.worldId, deadWorld)
    assert.equal(g.importedFrom.stateHash, before.stateHash)
    assert.ok(Number.isInteger(g.importedFrom.tick))

    // and the citizen is not merely listed in the founding record: the world
    // the generator built from it has them standing in it
    const w = buildWorld(g)
    assert.equal(w.players[PID('a')].name, 'alder')
    assert.equal(w.players[PID('a')].calling, 'warden')
    assert.equal(w.players[PID('b')], undefined, 'the ghost stayed in the old world')
    assert.equal(E.validateState(w), null, E.validateState(w))
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})
