import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import mdxToSearchable from './mdx-to-searchable.js'

// Exercise the installed publisher's real digest comparison and persistent cache,
// replacing only its network client and publishing inputs. No Algolia credentials.
test('successive search builds refresh unchanged MDX after publishing changes', async () => {
  const require = createRequire(import.meta.url)
  const pluginFile = require.resolve('gatsby-plugin-algolia/gatsby-node.js')
  const pluginRequire = createRequire(pluginFile)
  const saved = []
  const cacheValues = new Map()
  const index = {
    indexName: 'fixture',
    getSettings: async () => ({}),
    browseObjects: async ({ batch }) => batch([]),
    saveObjects: async (objects) => saved.push(JSON.parse(JSON.stringify(objects))),
    setSettings: () => ({ wait: async () => {} }),
    deleteObjects: () => ({ wait: async () => {} }),
  }
  const plugin = { exports: {} }
  vm.runInNewContext(readFileSync(pluginFile, 'utf8'), {
    exports: plugin.exports,
    require: (name) =>
      name === 'algoliasearch' ? () => ({ initIndex: () => index }) : pluginRequire(name),
    console,
  })
  let revisions = { contentRevision: 'a'.repeat(64), sourceRevision: 'b'.repeat(40) }
  let transformSuffix = ''
  const configModule = { exports: {} }
  vm.runInNewContext(readFileSync(new URL('./gatsby-config.js', import.meta.url), 'utf8'), {
    module: configModule,
    require: (name) => {
      if (name === '../content-revision.cjs') return () => revisions
      if (name === './mdx-to-searchable')
        return async (body) =>
          (await mdxToSearchable(body)).map((record) => ({
            ...record,
            text: record.text + transformSuffix,
          }))
      return require(name)
    },
  })
  const data = {
    allMdx: {
      edges: [
        {
          node: {
            id: 'unchanged',
            body: '## Dates\n\nUse date subtraction.',
            fields: { modSlug: '/04-postgresql/11-date-types' },
            internal: { contentDigest: 'unchanged-mdx-digest' },
            frontmatter: { title: 'Dates' },
            tableOfContents: { items: [{ title: 'Dates', url: '#dates' }] },
          },
        },
      ],
    },
  }
  const timer = {
    start() {},
    end() {},
    setStatus() {},
    panicOnBuild(message, error) {
      throw error || new Error(message)
    },
  }
  const reporter = { activityTimer: () => timer, panicOnBuild: timer.panicOnBuild }
  const cache = {
    get: async (key) => cacheValues.get(key),
    set: async (key, value) => cacheValues.set(key, value),
  }
  const build = async () =>
    plugin.exports.onPostBuild(
      { graphql: async () => ({ data }), reporter, cache },
      configModule.exports({ appId: 'fixture', adminKey: 'fixture', indexName: 'fixture' })
        .plugins[0].options
    )

  // Migrate records created before the full-record digest was introduced.
  cacheValues.set('algolia-objects-fixture', {
    unchanged0: { internal: { contentDigest: 'unchanged-mdx-digest' } },
  })
  await build()
  assert.equal(saved.length, 1)
  await build()
  assert.equal(saved.length, 1, 'identical builds skip writes')
  revisions = { ...revisions, sourceRevision: 'c'.repeat(40) }
  await build()
  assert.equal(saved.length, 2)
  assert.equal(saved.at(-1)[0].sourceRevision, revisions.sourceRevision)
  revisions = { ...revisions, contentRevision: 'd'.repeat(64) }
  await build()
  assert.equal(saved.length, 3)
  transformSuffix = ' Updated by publishing code.'
  await build()
  assert.equal(saved.length, 4)
  assert.match(saved.at(-1)[0].content, /Updated by publishing code/)
  assert.equal(data.allMdx.edges[0].node.internal.contentDigest, 'unchanged-mdx-digest')
  assert.equal(new Set(saved.map((batch) => batch[0].internal.contentDigest)).size, 4)
})
