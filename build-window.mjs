#!/usr/bin/env node
// Interval: build a standalone window.
// ===========================================================================
// A pillar serving the page it also serves the world from is a single point of
// failure wearing two hats. If it goes down, the world is still there -- other
// sovereign peers are computing it right now -- but nobody can reach a page to
// look through.
//
// `window-web.html` no longer assumes the machine that served it is the machine
// running the world: it resolves a node, checks that node is serving THIS world
// before trusting it, reconnects when one dies, and remembers the others. So
// the page is just a file, and a file can live somewhere that does not go down
// with any one operator: a CDN, GitHub Pages, IPFS, a shared drive, a USB
// stick, an email attachment.
//
// This writes that file. It bakes in a fallback list so a page opened with no
// query string and no memory still has somewhere to start, and it never touches
// anything else -- there is no bundler and no external asset, because the window
// has none. It is one HTML file with no `src` that is not a data URL.
//
//   node build-window.mjs                                  # dist/index.html
//   node build-window.mjs --nodes=https://a.example,https://b.example
//   node build-window.mjs --out=/var/www/interval
//
// Publish the result anywhere. It is a complete client.
import fs from 'node:fs'
import path from 'node:path'

const arg = (k, d) => {
  const hit = process.argv.find((a) => a.startsWith(`--${k}=`))
  return hit ? hit.slice(k.length + 3) : d
}
const out = arg('out', 'dist')
// GitHub Pages reads the custom domain from a CNAME file in the published
// directory, and DELETES the domain setting if a deploy arrives without one.
// So it is emitted by the build rather than committed by hand: a workflow that
// silently reverts your domain on every push is a very annoying way to find
// this out.
const domain = arg('domain', '')
const nodes = arg('nodes', 'https://interval.place')
  .split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean)

if (!nodes.length) { console.error('--nodes must name at least one node'); process.exit(1) }
for (const n of nodes) {
  try {
    const u = new URL(n)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('scheme')
  } catch { console.error(`not a usable node address: ${n}`); process.exit(1) }
}

const srcPath = new URL('./window-web.html', import.meta.url)
let html = fs.readFileSync(srcPath, 'utf8')

// The one substitution. Everything else in the file is already origin-free.
const re = /const NODE_FALLBACKS = \[[^\]]*\]/
if (!re.test(html)) {
  console.error('window-web.html has no NODE_FALLBACKS: it may predate the node resolver')
  process.exit(1)
}
html = html.replace(re, 'const NODE_FALLBACKS = [' + nodes.map((n) => `'${n}'`).join(', ') + ']')

// A built page must not smuggle in a dependency on the machine that built it.
const leaks = []
if (/fetch\('\/api\//.test(html)) leaks.push("an origin-relative fetch('/api/...)")
if (/new WebSocket\(\(location\.protocol/.test(html)) leaks.push('a socket bound to location.host')
for (const m of html.matchAll(/\ssrc="(?!'\s*\+)([^"]*)"/g)) {
  if (!/^data:/.test(m[1])) leaks.push(`an external asset: ${m[1]}`)
}
if (leaks.length) {
  console.error('this window is not standalone:\n  ' + leaks.join('\n  '))
  process.exit(1)
}

fs.mkdirSync(out, { recursive: true })

// GitHub Pages runs Jekyll over a branch deploy unless told not to. Jekyll
// ignores files and folders beginning with an underscore and rewrites some
// others, which is a strange thing to let happen to a client whose whole claim
// is that its bytes are checkable. One empty file turns it off.
fs.writeFileSync(path.join(out, '.nojekyll'), '')

const file = path.join(out, 'index.html')
fs.writeFileSync(file, html)

// The sidecar. The list baked into the page is frozen at build time; this one
// sits beside it and can be replaced without rebuilding an 800 KB file, by
// anyone who can write to wherever the page is published. It shares a failure
// domain with the PAGE (a CDN, a repo, a drive) rather than with the world, so
// it is available exactly when the page is -- which is the whole point.
//
// Not overwritten if it already exists: whoever is publishing has probably
// curated it, and a build should not quietly undo that.
if (domain) {
  fs.writeFileSync(path.join(out, 'CNAME'), domain.replace(/^https?:\/\//, '').replace(/\/$/, '') + '\n')
  console.log(`wrote  ${path.join(out, 'CNAME')}  (${domain})`)
}

const peersFile = path.join(out, 'peers.json')
if (fs.existsSync(peersFile)) {
  console.log(`kept   ${peersFile}  (already published; delete it to regenerate)`)
} else {
  fs.writeFileSync(peersFile, JSON.stringify({
    _: 'Nodes this window may read the world from. Any peer of the world will do.'
     + ' Edit and republish freely -- the page reads this file from beside itself,'
     + ' so it works from a CDN, a repo, or a USB stick.',
    nodes,
  }, null, 2) + '\n')
  console.log(`wrote  ${peersFile}`)
}

// A CHECKSUM, BECAUSE THE WHOLE POINT IS NOT TRUSTING ANYONE.
//
// A stranger at a library is being asked to run a page that mints a key. The
// answer to "is this a keylogger" cannot be "trust us" -- that is the sentence
// this entire project exists to avoid saying. It has to be: here is the file's
// hash, here is the repository it was built from, check them.
//
// Same idea as the rules hash. A world is identified by the hash of its
// constitution; a client should be identified by the hash of its bytes.
import { createHash } from 'node:crypto'
const sum = createHash('sha256').update(fs.readFileSync(file)).digest('hex')
fs.writeFileSync(file + '.sha256', sum + '  index.html\n')

const kb = (fs.statSync(file).size / 1024).toFixed(0)
console.log(`wrote ${file}  (${kb} KB, one file, no external assets)`)
console.log(`nodes: ${nodes.join(', ')}`)
console.log(`sha256: ${sum}`)
console.log('')
console.log('Anyone can verify the published page against this repository:')
console.log('  curl -s https://YOUR-HOST/index.html | shasum -a 256')
console.log('')
console.log('Publish BOTH files together. peers.json is how a fresh browser on a')
console.log('public machine finds a live node when every baked address is down.')
console.log('')
console.log('To point one visit at a different node:')
console.log(`  file:///path/to/index.html?node=http://localhost:8788`)
