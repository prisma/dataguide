import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const plugin = fileURLToPath(new URL('../content-revision.cjs', import.meta.url))
test('archive builds use deployment metadata and fail clearly if the revision is unknown', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'dg-revision-'))
  const env = { ...process.env }
  delete env.VERCEL_GIT_COMMIT_SHA
  delete env.GITHUB_SHA
  const run = () =>
    JSON.parse(
      execFileSync(
        process.execPath,
        ['-e', `console.log(JSON.stringify(require(${JSON.stringify(plugin)})()))`],
        { cwd: root, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
      )
    )
  try {
    mkdirSync(path.join(root, 'content'))
    writeFileSync(path.join(root, 'content/article.md'), 'unchanged article')
    assert.throws(run, /Source revision unavailable/)
    env.VERCEL_GIT_COMMIT_SHA = 'a'.repeat(40)
    assert.deepEqual(
      { ...run(), contentRevision: undefined },
      {
        sourceRevision: 'a'.repeat(40),
        sourceRevisionSource: 'deployment-metadata',
        dirty: null,
        contentRevision: undefined,
      }
    )
    env.VERCEL_GIT_COMMIT_SHA = 'not-a-commit'
    assert.throws(run, /Source revision unavailable/)
    delete env.VERCEL_GIT_COMMIT_SHA
    env.GITHUB_SHA = 'b'.repeat(40)
    assert.equal(run().sourceRevision, env.GITHUB_SHA)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('renderer, exporter and search changes alter the source revision even when the articles are unchanged', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'dg-publisher-'))
  const git = (args) =>
    execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  const revision = () =>
    JSON.parse(
      execFileSync(
        process.execPath,
        ['-e', `console.log(JSON.stringify(require(${JSON.stringify(plugin)})()))`],
        { cwd: root, encoding: 'utf8' }
      )
    )
  try {
    mkdirSync(path.join(root, 'content'))
    writeFileSync(path.join(root, 'content/article.md'), 'unchanged article')
    git(['init', '-q'])
    git(['add', '.'])
    git([
      '-c',
      'user.name=Fixture',
      '-c',
      'user.email=fixture@example.test',
      'commit',
      '-qm',
      'Seed fixture',
    ])
    const original = revision()
    for (const file of ['renderer.js', 'exporter.js', 'search-transformer.js']) {
      writeFileSync(path.join(root, file), 'changed publisher')
      assert.equal(revision().dirty, true)
      git(['add', file])
      git([
        '-c',
        'user.name=Fixture',
        '-c',
        'user.email=fixture@example.test',
        'commit',
        '-qm',
        `Change ${file}`,
      ])
      const current = revision()
      assert.equal(current.contentRevision, original.contentRevision)
      assert.notEqual(current.sourceRevision, original.sourceRevision)
      assert.equal(current.dirty, false)
    }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test("Vercel's build-time rewrite of gatsby-node.ts doesn't count as a dirty checkout", () => {
  const root = mkdtempSync(path.join(tmpdir(), 'dg-vercel-'))
  const git = (args) =>
    execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  const dirty = (env) =>
    JSON.parse(
      execFileSync(
        process.execPath,
        ['-e', `console.log(JSON.stringify(require(${JSON.stringify(plugin)})()))`],
        { cwd: root, encoding: 'utf8', env: { ...process.env, VERCEL: '', ...env } }
      )
    ).dirty
  try {
    mkdirSync(path.join(root, 'content'))
    writeFileSync(path.join(root, 'content/article.md'), 'article')
    writeFileSync(path.join(root, 'gatsby-node.ts'), 'export const original = true\n')
    git(['init', '-q'])
    git(['add', '.'])
    git([
      '-c',
      'user.name=Fixture',
      '-c',
      'user.email=fixture@example.test',
      'commit',
      '-qm',
      'Seed',
    ])
    // What Vercel's builder leaves behind
    writeFileSync(path.join(root, 'gatsby-node.ts'), 'export const injected = true\n')
    writeFileSync(
      path.join(root, 'gatsby-node.ts.__vercel_builder_backup__.ts'),
      'export const original = true\n'
    )
    writeFileSync(path.join(root, 'vercel.json'), '{}\n')
    assert.equal(dirty({ VERCEL: '1' }), false)
    assert.equal(dirty({}), true, 'outside Vercel the same changes are dirty')
    // A backup that differs from the commit means the source itself was changed
    writeFileSync(
      path.join(root, 'gatsby-node.ts.__vercel_builder_backup__.ts'),
      'export const edited = true\n'
    )
    assert.equal(dirty({ VERCEL: '1' }), true)
    writeFileSync(
      path.join(root, 'gatsby-node.ts.__vercel_builder_backup__.ts'),
      'export const original = true\n'
    )
    writeFileSync(path.join(root, 'content/article.md'), 'edited article')
    assert.equal(dirty({ VERCEL: '1' }), true, 'other changes stay dirty on Vercel')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
