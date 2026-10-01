import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, access, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import exporter from './gatsby-node.js'
import ownership from './generated-exports.cjs'

test('incremental Markdown builds prune renamed, removed and unpublished owned exports', async () => {
  const cwd = process.cwd()
  const root = await mkdtemp(path.join(tmpdir(), 'dg-markdown-'))
  const oldSha = process.env.GITHUB_SHA
  process.env.GITHUB_SHA = 'b'.repeat(40)
  const publicDir = path.join(root, 'public')
  await mkdir(publicDir)
  await mkdir(path.join(root, 'content'))
  await mkdir(path.join(root, '.cache'))
  await writeFile(path.join(root, '.cache/keep'), 'persistent cache')
  await writeFile(path.join(publicDir, 'static.md'), '# Static asset\n')
  await writeFile(
    path.join(publicDir, 'legacy.md'),
    `# Old\n\n> Part of Guide. The complete index is at https://example.test/dataguide/llms.txt.\n\nCanonical URL: https://example.test/dataguide/legacy\nContent revision: ${'a'.repeat(64)}\n`
  )
  const page = (slug, flags = {}) => ({
    body: 'Use PostgreSQL dates.',
    fields: { slug },
    frontmatter: { title: 'Dates', ...flags },
    internal: { contentFilePath: path.join(root, 'content/dates.mdx') },
  })
  let nodes = [page('/'), page('/04-postgresql/11-date-types')]
  const build = (options = {}) =>
    exporter.onPostBuild(
      {
        graphql: async () => ({
          data: {
            site: {
              siteMetadata: {
                siteUrl: 'https://example.test',
                pathPrefix: '/dataguide',
                description: 'Guide',
                og: { site_name: 'Guide' },
              },
            },
            allMdx: { nodes },
          },
        }),
        reporter: {
          info() {},
          panicOnBuild(message, error) {
            throw error || new Error(message)
          },
        },
      },
      { repository: 'https://example.test/repo', ...options }
    )
  const exists = async (name) => {
    await access(path.join(publicDir, name))
  }
  const missing = async (name) => {
    await assert.rejects(exists(name), { code: 'ENOENT' })
  }
  try {
    process.chdir(root)
    await build()
    await exists('index.md')
    await exists('postgresql/date-types.md')
    await missing('legacy.md')
    for (const flag of ['publish', 'export', 'skipBuild']) {
      nodes = [page('/'), page('/04-postgresql/11-date-types')]
      await build()
      nodes[1].frontmatter[flag] = flag === 'skipBuild'
      await build()
      await missing('postgresql/date-types.md')
      assert.doesNotMatch(await readFile(path.join(publicDir, 'llms.txt'), 'utf8'), /date-types/)
    }
    nodes = [page('/'), page('/04-postgresql/11-date-types')]
    await build()
    nodes[1] = page('/04-postgresql/11-new-dates')
    await build()
    await missing('postgresql/date-types.md')
    await exists('postgresql/new-dates.md')
    await build({ exclude: ['/postgresql/new-dates'] })
    await missing('postgresql/new-dates.md')
    nodes = []
    await build()
    await missing('index.md')
    assert.equal(await readFile(path.join(publicDir, 'static.md'), 'utf8'), '# Static asset\n')
    assert.equal(await readFile(path.join(root, '.cache/keep'), 'utf8'), 'persistent cache')
    assert.deepEqual(
      JSON.parse(await readFile(path.join(publicDir, '.dataguide-markdown-exports.json'), 'utf8'))
        .files,
      []
    )
    await assert.rejects(ownership.pruneExports(publicDir, ['../outside.md'], []), /Invalid/)
  } finally {
    process.chdir(cwd)
    if (oldSha === undefined) delete process.env.GITHUB_SHA
    else process.env.GITHUB_SHA = oldSha
    await rm(root, { recursive: true, force: true })
  }
})
