// enter the world as an external citizen (signed inputs over the socket),
// earn nothing, then try to post; then be given standing and try again.
import { webcrypto } from 'node:crypto'
import { WebSocket } from 'ws'
import E from './engine.js'
await E.initCrypto?.()
const BASE = 'http://127.0.0.1:8787'
const signed = (p) => JSON.stringify({ body: p.body, key: p.key, subject: p.subject, ts: p.ts })
const hex = (b) => Buffer.from(b).toString('hex')

const id = E.generateIdentity()
const genesis = await (await fetch(BASE + '/api/genesis')).json()
const worldId = genesis.worldId ?? genesis.genesis?.worldId

const ws = new WebSocket('ws://127.0.0.1:8787')
await new Promise(r => ws.on('open', r))
ws.send(JSON.stringify({ type: 'ext', playerId: id.playerId }))
await new Promise(r => setTimeout(r, 600))
const tick = (await (await fetch(BASE + '/api/world')).json()).tick
const inp = E.signInput({ worldId, playerId: id.playerId, tick, type: 'spawn' }, id.privateKey)
ws.send(JSON.stringify({ type: 'input', input: inp }))
await new Promise(r => setTimeout(r, 2500))

const w = await (await fetch(BASE + '/api/hiscores')).json()
const me = w.players.find(p => p.playerId === id.playerId)
console.log('entered the world:', !!me, me ? '(standing ' + me.total + ')' : '')

async function post(subject, body) {
  const kp = null
  const p = { key: id.playerId, subject, body, ts: Date.now() }
  // sign with the same Ed25519 private key the world knows
  const raw = Buffer.from(id.privateKey, 'hex').subarray(0, 32)
  const pk = await webcrypto.subtle.importKey('jwk', {
    kty: 'OKP', crv: 'Ed25519', d: raw.toString('base64url'),
    x: Buffer.from(id.playerId, 'hex').toString('base64url'),
  }, { name: 'Ed25519' }, true, ['sign'])
  p.sig = hex(await webcrypto.subtle.sign({ name: 'Ed25519' }, pk, Buffer.from(signed(p), 'utf8')))
  const r = await fetch(BASE + '/api/board', { method: 'POST', body: JSON.stringify(p) })
  return { status: r.status, ...(await r.json()) }
}
console.log('posting with a brand new citizen (standing 25):')
console.log('  ' + JSON.stringify(await post('selling logs', 'four hundred, cheap')))
ws.close()
