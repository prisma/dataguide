import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createServer } from 'node:http'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const exec = promisify(execFile)
const script = fileURLToPath(new URL('../../scripts/deployment-smoke.mjs', import.meta.url))
const search = fileURLToPath(new URL('../../scripts/search-smoke.mjs', import.meta.url))
const hash = 'a'.repeat(64)
const commit = 'b'.repeat(40)

test('hosted checks reject stale HTML, Markdown and manifest source revisions despite a matching article hash', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'dg-deployment-'))
  let stale,
    dirty = false
  const server = createServer((req, res) => {
    const type = req.url.endsWith('.md')
      ? 'markdown'
      : req.url.endsWith('.json')
        ? 'manifest'
        : 'html'
    const sourceRevision = stale === type ? 'c'.repeat(40) : commit
    if (req.url.includes('definitely-missing')) {
      res.writeHead(404)
      res.end('missing')
      return
    }
    if (req.url.endsWith('/robots.txt')) {
      res.end('User-agent: *')
      return
    }
    if (req.url.endsWith('.xml')) {
      res.setHeader('content-type', 'application/xml')
      res.end('<sitemapindex/>')
      return
    }
    if (req.url.endsWith('/llms.txt')) {
      res.end('# Guide')
      return
    }
    if (type === 'manifest') {
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ contentRevision: hash, sourceRevision, dirty }))
      return
    }
    if (type === 'markdown') {
      res.setHeader('content-type', 'text/markdown')
      res.end(`# Dates\nContent revision: ${hash}\nSource revision: ${sourceRevision}\n`)
      return
    }
    res.setHeader('content-type', 'text/html')
    res.end(
      `<title>Guide</title><meta name="dataguide:content-revision" content="${hash}"><meta name="dataguide:source-revision" content="${sourceRevision}"><h2 id="get-the-interval-between-two-dates">Dates</h2>`
    )
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const args = [script, `http://127.0.0.1:${server.address().port}/dataguide`, hash, commit]
  try {
    await exec(process.execPath, args, { cwd: root })
    for (const type of ['html', 'markdown', 'manifest']) {
      stale = type
      await assert.rejects(exec(process.execPath, args, { cwd: root }))
      const report = JSON.parse(
        readFileSync(path.join(root, '.verification-runs/deployment.json'), 'utf8')
      )
      assert.ok(
        report.failures.some((row) => row.sourceRevision !== commit && row.contentRevision === hash)
      )
    }
    stale = null
    dirty = true
    await assert.rejects(exec(process.execPath, args, { cwd: root }))
  } finally {
    await new Promise((resolve) => server.close(resolve))
    rmSync(root, { recursive: true, force: true })
  }
})

test('search checks reject records from an older transformer revision', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'dg-search-'))
  const cases = readFileSync(new URL('../../tests/search-journeys.json', import.meta.url), 'utf8')
  const preload = path.join(root, 'fetch.mjs')
  writeFileSync(
    preload,
    `const cases=${cases};globalThis.fetch=async(url,options)=> {if(!url.startsWith('https://test-app-dsn.algolia.net/')) throw new Error('unexpected network request');const query=JSON.parse(options.body).query;const item=cases.find(item=>item.query===query);return new Response(JSON.stringify({hits:[{dataguidePath:item.path+(item.anchor?'#'+item.anchor:''),heading:'Guide',content:item.snippetTerms.join(' '),contentRevision:${JSON.stringify(hash)},sourceRevision:process.env.FIXTURE_SOURCE_REVISION}]}));}`
  )
  const env = {
    ...process.env,
    GATSBY_ALGOLIA_APP_ID: 'test-app',
    GATSBY_ALGOLIA_SEARCH_KEY: 'read-only-fixture',
    GATSBY_ALGOLIA_INDEX_NAME: 'test-index',
    FIXTURE_SOURCE_REVISION: commit,
  }
  mkdirSync(path.join(root, 'tests'))
  writeFileSync(path.join(root, 'tests/search-journeys.json'), cases)
  const cwd = root
  try {
    await exec(process.execPath, ['--import', preload, search, hash, commit], { cwd, env })
    env.FIXTURE_SOURCE_REVISION = 'c'.repeat(40)
    await assert.rejects(
      exec(process.execPath, ['--import', preload, search, hash, commit], { cwd, env })
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
