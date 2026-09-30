import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateVerification } from '../../scripts/verification.mjs'

test('a date or label cannot establish an executed tutorial without evidence', () => {
  const errors = validateVerification({
    articles: [
      {
        file: 'content/04-postgresql/11-date-types.mdx',
        owner: 'PostgreSQL maintainer',
        scope: 'SQL examples',
        level: 'executed',
        releaseChannel: 'stable',
        reviewDate: '2026-09-30',
      },
    ],
  })
  assert.ok(errors.some((error) => error.includes('requires fixture')))
})

test('source-reviewed theory is distinct from executable verification', () => {
  assert.deepEqual(
    validateVerification({
      articles: [
        {
          file: 'content/04-postgresql/11-date-types.mdx',
          owner: 'PostgreSQL maintainer',
          scope: 'Source review only',
          level: 'source-reviewed',
          releaseChannel: 'stable',
        },
      ],
    }),
    []
  )
})
