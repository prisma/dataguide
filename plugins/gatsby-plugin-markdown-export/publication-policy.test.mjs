import { test } from 'node:test'
import assert from 'node:assert/strict'
import policy from '../publication-policy.cjs'

test('publication flags have explicit independent contracts', () => {
  assert.deepEqual(policy(), {
    published: true,
    indexed: true,
    searchable: true,
    navigable: true,
    exported: true,
  })
  assert.deepEqual(policy({ hidePage: true }), {
    published: true,
    indexed: true,
    searchable: true,
    navigable: false,
    exported: true,
  })
  for (const flags of [{ publish: false }, { skipBuild: true }]) {
    assert.ok(Object.values(policy(flags)).every((value) => value === false))
  }
  assert.equal(policy({ search: false }).searchable, false)
  assert.equal(policy({ index: false }).indexed, false)
  assert.equal(policy({ index: false }).searchable, false)
  assert.equal(policy({ export: false }).exported, false)
  // A noindex page has no crawlable Markdown copy
  assert.equal(policy({ index: false }).exported, false)
})
