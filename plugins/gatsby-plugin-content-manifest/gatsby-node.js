const { readdir, readFile, writeFile } = require('node:fs/promises')
const path = require('node:path')
const { createHash } = require('node:crypto')
const revision = require('../content-revision.cjs')

exports.onPostBuild = async ({ reporter }) => {
  const publicDir = path.resolve('public')
  const artifacts = []
  for (const entry of await readdir(publicDir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue
    const file = path.join(entry.parentPath, entry.name)
    const name = path.relative(publicDir, file).split(path.sep).join('/')
    if (!(
      /(?:index\.html|\.md|sitemap[^/]*\.xml|llms\.txt)$/.test(name) ||
      name.startsWith('social/generated/') ||
      name.startsWith('experiments/')
    ))
      continue
    artifacts.push({
      path: `/${name}`,
      sha256: createHash('sha256')
        .update(await readFile(file))
        .digest('hex'),
    })
  }
  const manifest = {
    ...revision(),
    builtAt: new Date().toISOString(),
    search: {
      requested: process.env.INDEX_ALGOLIA === 'true',
      verification: 'Query the deployed index separately; a site build is not a search smoke test.',
    },
    artifacts: artifacts.sort((a, b) => a.path.localeCompare(b.path)),
  }
  await writeFile(
    path.join(publicDir, 'content-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`
  )
  reporter.info(
    `Content revision: ${manifest.contentRevision}; source: ${manifest.sourceRevision}${manifest.dirty ? ' (working tree)' : ''}`
  )
}
