import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mdxToSearchable from './mdx-to-searchable.js'
import { REVISION_RECORD_ID } from './revision-record.cjs'

// Exercise the installed publisher's real digest comparison and persistent cache,
// replacing only its network client and publishing inputs. No Algolia credentials.
test('search builds rewrite only what changed, and record the build in one revision record', async () => {
  const require = createRequire(import.meta.url)
  const pluginFile = require.resolve('gatsby-plugin-algolia/gatsby-node.js')
  const pluginRequire = createRequire(pluginFile)
  const saved = []
  const deleted = []
  const cacheValues = new Map()
  const index = {
    indexName: 'fixture',
    getSettings: async () => ({}),
    browseObjects: async ({ batch }) => batch([]),
    saveObjects: async (objects) => saved.push(JSON.parse(JSON.stringify(objects))),
    setSettings: () => ({ wait: async () => {} }),
    deleteObjects: (ids) => {
      deleted.push([...ids])
      return { wait: async () => {} }
    },
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
  // Loads the indexer's config, optionally as if one of its source files had changed
  const loadConfig = (changedSource) => {
    const configModule = { exports: {} }
    vm.runInNewContext(readFileSync(new URL('./gatsby-config.js', import.meta.url), 'utf8'), {
      module: configModule,
      __dirname: path.dirname(fileURLToPath(import.meta.url)),
      require: (name) => {
        if (name === '../content-revision.cjs') return () => revisions
        if (name === './mdx-to-searchable')
          return async (body) =>
            (await mdxToSearchable(body)).map((record) => ({
              ...record,
              text: record.text + transformSuffix,
            }))
        if (name === 'node:fs' && changedSource)
          return {
            ...require('node:fs'),
            readFileSync: (file, ...rest) =>
              file.endsWith(changedSource)
                ? `${readFileSync(file, ...rest)}\n// changed`
                : readFileSync(file, ...rest),
          }
        return require(name)
      },
    })
    return configModule.exports({ appId: 'fixture', adminKey: 'fixture', indexName: 'fixture' })
      .plugins[0].options
  }
  let config = loadConfig()
  const article = (id) => ({
    node: {
      id,
      body: '## Dates\n\nUse date subtraction.',
      fields: { modSlug: `/04-postgresql/${id}` },
      internal: { contentDigest: `${id}-mdx-digest` },
      frontmatter: { title: 'Dates' },
      tableOfContents: { items: [{ title: 'Dates', url: '#dates' }] },
    },
  })
  const data = { allMdx: { edges: [article('unchanged'), article('removed')] } }
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
    plugin.exports.onPostBuild({ graphql: async () => ({ data }), reporter, cache }, config)
  const lastSave = () => saved.at(-1).map((record) => record.id)

  // Migrate records created before the full-record digest was introduced.
  cacheValues.set('algolia-objects-fixture', {
    unchanged0: { internal: { contentDigest: 'unchanged-mdx-digest' } },
  })
  await build()
  assert.deepEqual(lastSave(), ['unchanged0', 'removed0', REVISION_RECORD_ID])
  const [revisionRecord] = saved.at(-1).filter((record) => record.id === REVISION_RECORD_ID)
  assert.deepEqual(Object.keys(revisionRecord).sort(), [
    'contentRevision',
    'id',
    'internal',
    'objectID',
    'recordType',
    'sourceRevision',
    'transformerRevision',
  ])
  assert.ok(
    saved
      .at(-1)
      .every((record) => record.id === REVISION_RECORD_ID || !('sourceRevision' in record))
  )
  await build()
  assert.equal(saved.length, 1, 'identical builds skip writes')

  // A new commit or content hash rewrites only the revision record
  revisions = { ...revisions, sourceRevision: 'c'.repeat(40) }
  await build()
  assert.deepEqual(lastSave(), [REVISION_RECORD_ID])
  assert.equal(saved.at(-1)[0].sourceRevision, revisions.sourceRevision)
  revisions = { ...revisions, contentRevision: 'd'.repeat(64) }
  await build()
  assert.deepEqual(lastSave(), [REVISION_RECORD_ID])
  assert.equal(saved.at(-1)[0].contentRevision, revisions.contentRevision)

  // Changed output rewrites the affected records
  transformSuffix = ' Updated by publishing code.'
  await build()
  assert.deepEqual(lastSave(), ['unchanged0', 'removed0'])
  assert.match(saved.at(-1)[0].content, /Updated by publishing code/)

  // A change to the transformer's source rewrites every record, even with the same output
  config = loadConfig('remark-mdx-searchable.js')
  await build()
  assert.deepEqual(lastSave(), ['unchanged0', 'removed0', REVISION_RECORD_ID])
  assert.equal(data.allMdx.edges[0].node.internal.contentDigest, 'unchanged-mdx-digest')

  // Records of an article that's gone are deleted; the revision record stays
  assert.equal(deleted.length, 0)
  data.allMdx.edges.pop()
  await build()
  assert.deepEqual(deleted, [['removed0']])
})
