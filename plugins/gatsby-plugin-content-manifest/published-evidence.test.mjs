import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const directory = fileURLToPath(new URL('../../static/experiments/', import.meta.url))

test('published experiment reports contain no home-directory paths', () => {
  const reports = readdirSync(directory).filter((name) => name.endsWith('.json'))
  assert.ok(reports.length > 0, 'no published experiment reports found')
  for (const name of reports) {
    const content = readFileSync(path.join(directory, name), 'utf8')
    for (const prefix of ['/Users/', '/home/'])
      assert.ok(!content.includes(prefix), `static/experiments/${name} contains ${prefix}`)
  }
})
