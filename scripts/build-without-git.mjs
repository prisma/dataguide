import { execFileSync } from 'node:child_process'
import {
  mkdtempSync,
  mkdirSync,
  cpSync,
  symlinkSync,
  existsSync,
  readFileSync,
  rmSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'

const root = process.cwd()
const archive = mkdtempSync(path.join(tmpdir(), 'dg-archive-build-'))
const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
try {
  const files = execFileSync(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    { encoding: 'utf8' }
  )
    .split('\0')
    .filter(Boolean)
  for (const file of files) {
    mkdirSync(path.dirname(path.join(archive, file)), { recursive: true })
    cpSync(path.join(root, file), path.join(archive, file))
  }
  symlinkSync(path.join(root, 'node_modules'), path.join(archive, 'node_modules'), 'dir')
  assert.equal(existsSync(path.join(archive, '.git')), false)
  assert.throws(() =>
    execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: archive, stdio: 'pipe' })
  )
  execFileSync('npm', ['run', 'build'], {
    cwd: archive,
    stdio: 'inherit',
    env: { ...process.env, VERCEL_GIT_COMMIT_SHA: sha, ADD_PREFIX: 'true', INDEX_ALGOLIA: 'false' },
  })
  const manifest = JSON.parse(
    readFileSync(path.join(archive, 'public/content-manifest.json'), 'utf8')
  )
  assert.equal(manifest.sourceRevision, sha)
  assert.equal(manifest.sourceRevisionSource, 'deployment-metadata')
  assert.equal(manifest.dirty, null)
  assert.ok(manifest.artifacts.length > 0)
  console.log(`PASS complete build without .git: ${manifest.sourceRevision}`)
} finally {
  rmSync(archive, { recursive: true, force: true })
}
