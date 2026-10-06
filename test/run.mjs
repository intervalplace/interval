// `node --test test/` reports the directory as a single failing unit here,
// because the suites are in a folder their fixtures are not. Run them named.
//
// THE TOTALS ARE READ FROM TWO REPORTERS. Node's TAP reporter writes `# pass 7`
// and its spec reporter writes `ℹ pass 7`, and which one you get depends on the
// Node version and on whether stdout is a terminal. This read only the TAP
// form, so under Node 23 every suite reported `? pass, ? fail`, every `?` was
// counted as a failure, and the whole run printed every suite's full output and
// exited 1 with nothing wrong. A runner that cannot tell green from red is
// worse than no runner: it trains you to ignore it.
//
// A suite whose totals cannot be read at all is still a failure, because the
// alternative is a suite that crashed before printing them being counted as
// passing.
import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const files = readdirSync(dir).filter((f) => f.endsWith('.test.mjs')).sort()

// `# pass 7` (TAP) or `ℹ pass 7` (spec). The counters are the same numbers.
const total = (out, name) => (out.match(new RegExp('^[#ℹ] ' + name + ' (\\d+)', 'm')) ?? [])[1]

let failed = 0
for (const f of files) {
  const started = Date.now()
  const r = spawnSync(process.execPath, ['--test', path.join(dir, f)], { encoding: 'utf8' })
  const out = (r.stdout ?? '') + (r.stderr ?? '')
  const pass = total(out, 'pass')
  const fail = total(out, 'fail')
  const secs = ((Date.now() - started) / 1000).toFixed(1)
  const bad = fail === undefined || pass === undefined || fail !== '0'
  if (bad) { failed++; process.stdout.write(out) }
  console.log(`${f.padEnd(26)} ${pass ?? '?'} pass, ${fail ?? '?'} fail`
    + (pass === undefined ? '  (totals unreadable: exit ' + r.status + ')' : '')
    + `   ${secs}s`)
}
console.log(failed ? `\n${failed} suite(s) failing` : '\nall green')
process.exit(failed ? 1 : 0)
