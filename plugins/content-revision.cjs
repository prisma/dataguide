const { execFileSync } = require('node:child_process')
const { readFileSync, readdirSync } = require('node:fs')
const { join, relative, sep } = require('node:path')
const { createHash } = require('node:crypto')
let cached
module.exports = () => {
  if (cached) return cached
  const root = process.cwd()
  const hash = createHash('sha256')
  const walk = (dir) =>
    readdirSync(dir, { withFileTypes: true })
      // Code-unit order and POSIX paths keep the hash the same on every machine
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
      .forEach((entry) => {
        const file = join(dir, entry.name)
        if (entry.isDirectory()) walk(file)
        else if (/\.mdx?$/.test(file))
          hash
            .update(relative(root, file).split(sep).join('/'))
            .update('\0')
            .update(readFileSync(file))
            .update('\0')
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
      // Not trimmed: the first line's leading space is part of its status code
      const changes = execFileSync('git', ['status', '--porcelain', '--untracked-files=normal'], {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      })
        .split('\n')
        .filter(Boolean)
        .map((line) => ({ state: line.slice(0, 2), file: line.slice(3) }))
      // Vercel's Gatsby builder rewrites gatsby-node/gatsby-config while building, keeps the original
      // as <file>.__vercel_builder_backup__.<ext>, and writes vercel.json. Those aren't source
      // changes, as long as each backup is identical to the committed file.
      const backup = /^(.+)\.__vercel_builder_backup__\.[a-z]+$/
      const backups = new Map(
        changes.flatMap(({ state, file }) =>
          state === '??' && backup.test(file) ? [[file.match(backup)[1], file]] : []
        )
      )
      const builderChange = ({ state, file }) =>
        !!process.env.VERCEL &&
        ((state === '??' && (file === 'vercel.json' || backup.test(file))) ||
          (state === ' M' &&
            backups.has(file) &&
            git(['hash-object', backups.get(file)]) === git(['rev-parse', `HEAD:${file}`])))
      dirty = changes.some((change) => !builderChange(change))
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
