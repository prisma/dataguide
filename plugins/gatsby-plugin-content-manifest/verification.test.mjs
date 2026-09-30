import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { createHash } from 'node:crypto'
import path from 'node:path'
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

test('a changed dependency lock invalidates executed evidence even if the runner is unchanged', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'dg-verification-'))
  const sha = (value) => createHash('sha256').update(value).digest('hex')
  try {
    mkdirSync(path.join(root, 'content'))
    writeFileSync(path.join(root, 'content/article.md'), 'article')
    writeFileSync(path.join(root, 'run.mjs'), 'runner')
    writeFileSync(path.join(root, 'package-lock.json'), 'original lock')
    writeFileSync(
      path.join(root, 'evidence.json'),
      JSON.stringify({
        status: 'passed',
        cleanedUp: true,
        fixtureSha256: sha('runner'),
        articles: [{ file: 'content/article.md', sourceSha256: sha('article') }],
        supportingSources: [{ file: 'package-lock.json', sha256: sha('original lock') }],
      })
    )
    const metadata = {
      articles: [
        {
          file: 'content/article.md',
          owner: 'Test maintainer',
          scope: 'Locked comparison',
          level: 'executed',
          releaseChannel: 'stable',
          reviewDate: '2026-09-30',
          evidence: 'evidence.json',
          fixture: 'run.mjs',
          versions: ['fixture'],
        },
      ],
    }
    assert.deepEqual(validateVerification(metadata, root), [])
    writeFileSync(path.join(root, 'package-lock.json'), 'changed lock')
    assert.ok(
      validateVerification(metadata, root).some((error) =>
        error.includes('supporting source changed')
      )
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
