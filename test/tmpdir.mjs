// A SCRATCH DIRECTORY SHORT ENOUGH FOR A WITNESS TO LOCK.
//
// A witness takes its process lock through a Unix domain socket, and the
// kernel truncates a socket path over 100 bytes, so node.mjs refuses one
// rather than hold a lock that can neither exclude nor be cleaned up.
//
// `os.tmpdir()` is 49 characters on macOS (/var/folders/xx/…/T), and the
// safety directory, the `locks` folder and a 16-hex socket name add another
// fifty. Every lifecycle test failed on that by between one and six bytes: not
// a fault in the code under test, and not visible on Linux, where tmpdir is
// /tmp and there is room to spare.
//
// So scratch directories for anything that starts a witness go under the home
// directory, which is short on both. They are named and removed by the caller
// exactly as an `os.tmpdir()` one would be.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const shortTmp = (prefix) => fs.mkdtempSync(path.join(os.homedir(), '.iv-' + prefix))
export default shortTmp
