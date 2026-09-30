import { test } from 'node:test'
import assert from 'node:assert/strict'
import createConfig from './gatsby-config.js'
import mdxToSearchable from './mdx-to-searchable.js'

const node = (id, frontmatter) => ({
  node: {
    id,
    body: '## Dates\n\nUse PostgreSQL date subtraction.',
    fields: { slug: '/04-postgresql/11-date-types', modSlug: '/04-postgresql/11-date-types' },
    internal: { contentDigest: id },
    frontmatter: { title: 'Dates', ...frontmatter },
    tableOfContents: { items: [{ title: 'Dates', url: '#dates' }] },
  },
})

test('search exclusion fields are queried and applied before record creation', async () => {
  const config = createConfig({ appId: 'test-app', adminKey: 'test-key', indexName: 'test-index' })
    .plugins[0].options
  assert.equal(config.continueOnFailure, false)
  for (const field of ['search', 'publish', 'skipBuild', 'index'])
    assert.match(config.queries[0].query, new RegExp(`\\b${field}\\b`))
  const records = await config.queries[0].transformer({
    data: {
      allMdx: {
        edges: [
          node('visible', { search: true }),
          node('excluded', { search: false }),
          node('draft', { publish: false }),
          node('skipped', { skipBuild: true }),
          node('noindex', { index: false }),
          node('navigation-hidden', { hidePage: true, search: true }),
        ],
      },
    },
  })
  assert.equal(records.length, 2)
  assert.ok(
    records.every(
      (record) => record.id.startsWith('visible') || record.id.startsWith('navigation-hidden')
    )
  )
  assert.ok(
    records.every(
      (record) =>
        record.dataguidePath === '/postgresql/date-types#dates' &&
        /^[a-f0-9]{64}$/.test(record.contentRevision)
    )
  )
})

test('required indexing fails visibly when credentials are missing', () => {
  assert.throws(
    () => createConfig({ appId: 'test-app', adminKey: '', indexName: 'test-index' }),
    /requires/
  )
})

test('search snippets preserve teaching notes and exclude output and promotions', async () => {
  const records = await mdxToSearchable(
    '## Restore\n\nExplain recovery.\n\n```text output\npsql result table\n```\n\n<PrismaOutlinks>\n\nSignup promotion.\n\n</PrismaOutlinks>\n\n<TechnicalNote>\n\nPreserve required seed prerequisites.\n\n</TechnicalNote>'
  )
  const text = records.map((record) => record.text).join(' ')
  assert.match(text, /Explain recovery/)
  assert.match(text, /required seed/)
  assert.doesNotMatch(text, /result table|Signup promotion/)
})
