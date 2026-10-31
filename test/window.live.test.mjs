// §7em: THE ONE TEST THAT RUNS THE WINDOW.
//
// `test/window.test.mjs` holds a hundred and forty tests and every one of them
// reads the SOURCE. Not one runs it. That is how two frozen windows reached
// interval.place inside a week:
//
//   - a `const` read forty lines above its own declaration, which threw on the
//     first creature drawn and took the whole world view with it;
//   - a `cx.save()` at the top of a closure that twenty-three branches
//     `return` out of, leaking one canvas state per creature per frame until
//     the context stopped drawing.
//
// Both were runtime faults. Both were invisible to every grep in the suite.
// Both shipped green.
//
// So this stands the real window in a real browser, feeds it the real world,
// and asks the three questions a reading cannot:
//
//   did it report a draw error, did it draw anything, is it STILL drawing.
//
// The third is the one that catches a window which has quietly stopped. A
// frozen canvas is identical frame to frame; a live one never is, because
// something is always flickering or breathing somewhere.
//
// IT IS VERIFIED BOTH WAYS. Each fault above was put back and this failed:
// the first naming the ReferenceError, the second saying the canvas had not
// changed in two and a half seconds. A check nobody has watched fail is a
// check nobody should trust (see the two useless versions of the
// use-before-declaration test, which both passed with the bug reinstated).
//
// Chrome is already a test dependency: site.content.test.mjs builds the
// handbook, which drives it.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

test('the window draws the world, and keeps drawing', { timeout: 420000 }, (t) => {
  // A MISSING BROWSER IS NOT A PASS. It is the one thing that would turn this
  // into the dead checker it was written to replace, so it is said out loud
  // and skipped, rather than quietly succeeding.
  if (!fs.existsSync(CHROME)) {
    t.skip('no Chrome at ' + CHROME + ': the window cannot be stood up here')
    return
  }
  let out = ''
  try {
    out = execFileSync(process.execPath, [path.join(root, 'sweep.mjs'), '--smoke', '--only', 'anchor'],
      // A BUFFER BIG ENOUGH FOR CHROME'S OPINIONS. `execFileSync` defaults to
      // one megabyte and a headless Chrome writes far more than that to
      // stderr -- CVDisplayLink, task_policy, the allocator -- so the default
      // KILLS the child part way through. The window was then reported as
      // having stopped drawing, which was true and was our doing: the first
      // wiring of this test failed for exactly that reason while the same
      // command run by hand passed three times out of three.
      { cwd: root, encoding: 'utf8', timeout: 400000, maxBuffer: 256 * 1024 * 1024,
        env: { ...process.env, SWEEP_OUT: path.join(root, '.smoke-out') } })
  } catch (e) {
    out = (e.stdout ?? '') + (e.stderr ?? '')
    const said = /SMOKE FAILED: ([^\n]*)/.exec(out)
    assert.fail('the window did not draw: ' + (said ? said[1] : out.slice(-400)))
  }
  assert.match(out, /SMOKEOK/,
    'the smoke run finished without saying the window drew:\n' + out.slice(-400))
})

// §7en: WHAT A FRAME COSTS, COUNTED RATHER THAN TIMED.
//
// The window has carried a frame meter in its status line for a long time and
// nothing ever recorded it or held it to anything.
//
// It cannot be TIMED here, and pretending otherwise would be worse than not
// measuring: Chrome's virtual clock pauses while a task runs, so
// `performance.now()` is constant inside one, and sixty draws of a 2400x1714
// scene came back as 0.00ms each -- a stopped clock reported as a fast
// window. A millisecond figure belongs in the packaged client on real
// hardware, which is the lesson the Unreal window learned the same way.
//
// So the work is COUNTED: every canvas call one frame makes. Immune to the
// clock, deterministic run to run, and the thing that actually regresses when
// somebody adds a pass over every tile.
//
// THE BALANCE IS THE IMPORTANT HALF. An unbalanced save/restore pair is what
// froze this window on a phone: the stack grew by one per creature per frame
// until the context stopped drawing. A static check for that exists, and this
// is the same question asked of the RUNNING window, which is strictly better.
test('a frame balances the canvas, and does not quietly double in cost',
  { timeout: 420000 }, (t) => {
  if (!fs.existsSync(CHROME)) { t.skip('no Chrome: the window cannot be stood up here'); return }
  let out = ''
  try {
    out = execFileSync(process.execPath, [path.join(root, 'sweep.mjs'), '--meter', '--only', 'anchor'],
      { cwd: root, encoding: 'utf8', timeout: 400000, maxBuffer: 256 * 1024 * 1024,
        env: { ...process.env, SWEEP_OUT: path.join(root, '.smoke-out') } })
  } catch (e) { out = (e.stdout ?? '') + (e.stderr ?? '') }
  const m = /METER calls (\d+) saves (\d+) restores (\d+)/.exec(out)
  assert.ok(m, 'the meter did not report:\n' + out.slice(-400))
  const [, calls, saves, restores] = m.map(Number)
  // EXACTLY equal. Not "close": one leaked state per frame is the fault that
  // froze a real session, and it only ever leaks by small numbers at first.
  assert.equal(saves, restores,
    `a frame saved the canvas ${saves} times and restored it ${restores}: `
    + 'the stack grows every frame and the window will stop drawing')
  // and a ceiling with room in it. A town frame measured 46,061 calls; this
  // is not a performance target, it is a guard against somebody adding a pass
  // over every tile and nobody noticing.
  assert.ok(calls < 90000,
    `a town frame makes ${calls} canvas calls, up from the 46,061 measured `
    + 'when this was written. Something has started drawing far more.')
  assert.ok(calls > 5000,
    `a town frame makes only ${calls} canvas calls, which means it has stopped `
    + 'drawing most of the world rather than become fast')
})
