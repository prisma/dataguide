const { execFileSync } = require('node:child_process')
const { readFileSync, readdirSync } = require('node:fs')
const { join, relative } = require('node:path')
const { createHash } = require('node:crypto')
let cached
module.exports = () => {
  if (cached) return cached
  const root = process.cwd()
  const hash = createHash('sha256')
  const walk = (dir) =>
    readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((entry) => {
        const file = join(dir, entry.name)
        if (entry.isDirectory()) walk(file)
        else if (/\.mdx?$/.test(file))
          hash.update(relative(root, file)).update('\0').update(readFileSync(file)).update('\0')
      })
  walk(join(root, 'content'))
  let sourceRevision
  let dirty = null
  let sourceRevisionSource = 'deployment-metadata'
  const git = (args) =>
    execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  try {
    // Do not accidentally identify a parent checkout as the deployed site.
    if (git(['rev-parse', '--show-toplevel']) === root) {
      sourceRevision = git(['rev-parse', 'HEAD'])
      dirty = git(['status', '--porcelain', '--untracked-files=normal']) !== ''
      sourceRevisionSource = 'git'
    }
  } catch {}
  sourceRevision ||= process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA
  if (!/^[a-f0-9]{40,64}$/i.test(sourceRevision || ''))
    throw new Error(
      'Source revision unavailable: supply VERCEL_GIT_COMMIT_SHA or GITHUB_SHA when building without a Git checkout'
    )
  cached = { sourceRevision, sourceRevisionSource, dirty, contentRevision: hash.digest('hex') }
  return cached
}
