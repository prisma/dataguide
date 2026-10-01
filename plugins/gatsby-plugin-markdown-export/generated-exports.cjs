const fs = require('node:fs/promises')
const path = require('node:path')
const manifestName = '.dataguide-markdown-exports.json'

const validName = (name) =>
  typeof name === 'string' &&
  name.endsWith('.md') &&
  !name.includes('\\') &&
  !name.includes('\0') &&
  !path.posix.isAbsolute(name) &&
  name.split('/').every((part) => part && part !== '.' && part !== '..')

exports.previousExports = async (publicDir, siteName) => {
  try {
    const manifest = JSON.parse(await fs.readFile(path.join(publicDir, manifestName), 'utf8'))
    if (
      manifest.version !== 1 ||
      !Array.isArray(manifest.files) ||
      !manifest.files.every(validName)
    )
      throw new Error('Invalid Markdown export ownership manifest')
    return manifest.files
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  // Adopt exports from older builds once, identified by the exporter's header.
  // Static Markdown files without this signature are never owned or removed.
  const files = []
  const prefix = `> Part of ${siteName}. The complete index is at `
  for (const entry of await fs.readdir(publicDir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue
    const file = path.join(entry.parentPath, entry.name)
    const body = await fs.readFile(file, 'utf8')
    if (
      body.split('\n').some((line) => line.startsWith(prefix) && line.endsWith('/llms.txt.')) &&
      /^Canonical URL: https?:\/\//m.test(body)
    )
      files.push(path.relative(publicDir, file).split(path.sep).join('/'))
  }
  return files
}

exports.pruneExports = async (publicDir, previous, current) => {
  if (![...previous, ...current].every(validName))
    throw new Error('Invalid generated Markdown path')
  const root = await fs.realpath(publicDir)
  for (const name of previous.filter((name) => !current.includes(name))) {
    const file = path.join(publicDir, name)
    try {
      const parent = await fs.realpath(path.dirname(file))
      const relative = path.relative(root, parent)
      if (relative.startsWith('..') || path.isAbsolute(relative))
        throw new Error('Markdown export path escapes public directory')
      await fs.unlink(file)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }
  const manifest = path.join(publicDir, manifestName)
  await fs.writeFile(
    `${manifest}.tmp`,
    `${JSON.stringify({ version: 1, files: current.sort() }, null, 2)}\n`
  )
  await fs.rename(`${manifest}.tmp`, manifest)
}
