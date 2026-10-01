import { test } from 'node:test'
import assert from 'node:assert/strict'
import createConfig from './gatsby-config.js'
import mdxToSearchable from './mdx-to-searchable.js'
import { REVISION_RECORD_ID } from './revision-record.cjs'

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
  const articles = records.filter((record) => record.id !== REVISION_RECORD_ID)
  assert.equal(articles.length, 2)
  assert.ok(
    articles.every(
      (record) => record.id.startsWith('visible') || record.id.startsWith('navigation-hidden')
    )
  )
  assert.ok(
    articles.every(
      (record) =>
        record.dataguidePath === '/postgresql/date-types#dates' && !('sourceRevision' in record)
    )
  )
  // The build's revisions are in one record, which has nothing to search or link to
  const revision = records.find((record) => record.id === REVISION_RECORD_ID)
  assert.match(revision.contentRevision, /^[a-f0-9]{64}$/)
  assert.match(revision.sourceRevision, /^[a-f0-9]{40,64}$/)
  assert.match(revision.transformerRevision, /^[a-f0-9]{64}$/)
  for (const field of [...config.queries[0].settings.searchableAttributes, 'dataguidePath', 'slug'])
    assert.equal(revision[field], undefined)
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
