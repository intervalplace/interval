// §0-i: THE CONSTITUTION IS THREE DOCUMENTS.
//
// The rules hash was `sha256(SPEC.md)`, computed inline in fifteen places.
// That made every byte of one file consensus-critical, which is correct, and
// also made the file impossible to split -- so a constitution and a changelog
// stayed welded together and a repealed number sat in a load-bearing sentence
// for four releases with nothing to catch it.
//
// The hash now covers an ORDERED LIST of documents. The order is part of the
// rule: concatenating in a different order is a different world. HISTORY.md
// binds nothing and is hashed anyway -- a constitution that can quietly drop
// its own record of what it repealed is not a record.
//
// One definition, one import. If this list ever disagrees with itself across
// two call sites, the door and the founder are computing different worlds.
import fs from 'node:fs'
import { createHash } from 'node:crypto'

export const CONSTITUTION = ['SPEC.md', 'LIFTED.md', 'HISTORY.md']

export function rulesHash (dir = new URL('./', import.meta.url)) {
  const h = createHash('sha256')
  for (const f of CONSTITUTION) {
    // The NAME is hashed with the bytes: renaming a document is a new world,
    // and a document that goes missing must not hash the same as one that is
    // empty. Length-prefixed so no filename can straddle a boundary.
    const b = fs.readFileSync(new URL(f, dir))
    h.update(Buffer.from(`${f}\0${b.length}\0`))
    h.update(b)
  }
  return h.digest('hex')
}

if (import.meta.url === `file://${process.argv[1]}`) console.log(rulesHash())
