// `node --test test/` reports the directory as a single failing unit here,
// because the suites are in a folder their fixtures are not. Run them named.
import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const files = readdirSync(dir).filter((f) => f.endsWith('.test.mjs')).sort()
let failed = 0
for (const f of files) {
  const r = spawnSync(process.execPath, ['--test', path.join(dir, f)], { encoding: 'utf8' })
  const pass = (r.stdout.match(/^# pass (\d+)/m) ?? [])[1] ?? '?'
  const fail = (r.stdout.match(/^# fail (\d+)/m) ?? [])[1] ?? '?'
  if (fail !== '0') { failed++; process.stdout.write(r.stdout) }
  console.log(`${f.padEnd(26)} ${pass} pass, ${fail} fail`)
}
console.log(failed ? `\n${failed} suite(s) failing` : '\nall green')
process.exit(failed ? 1 : 0)
