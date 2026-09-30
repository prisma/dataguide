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
  const sourceRevision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  const dirty =
    execFileSync('git', ['status', '--porcelain', '--untracked-files=normal'], {
      encoding: 'utf8',
    }).trim() !== ''
  cached = { sourceRevision, dirty, contentRevision: hash.digest('hex') }
  return cached
}
