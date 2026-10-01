import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createServer } from 'node:http'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { robotsAllows } from '../../scripts/deployment-policy.mjs'

const exec = promisify(execFile)
const script = fileURLToPath(new URL('../../scripts/deployment-smoke.mjs', import.meta.url))
const search = fileURLToPath(new URL('../../scripts/search-smoke.mjs', import.meta.url))
const hash = 'a'.repeat(64)
const commit = 'b'.repeat(40)

test('hosted checks reject stale HTML, Markdown and manifest source revisions despite a matching article hash', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'dg-deployment-'))
  let stale,
    dirty = false
  let indexingRegression,
    preview = false
  const canonicalRoot = 'https://www.prisma.io/dataguide'
  const encodedPath = (value) => value.split('/').map(encodeURIComponent).join('/')
  const escapeHtml = (value) => value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)
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
      res.end(
        indexingRegression === 'invalid-robots'
          ? '<html>Missing</html>'
          : indexingRegression === 'bot-blocked'
            ? 'User-agent: *\nAllow: /\nUser-agent: Googlebot\nDisallow: /dataguide'
            : preview || indexingRegression === 'blocked-robots'
              ? 'User-agent: *\nDisallow: /dataguide'
              : 'User-agent: *\nAllow: /'
      )
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
      if (indexingRegression === 'markdown-noindex') res.setHeader('x-robots-tag', 'noindex')
      if (indexingRegression === 'canonical-header')
        res.setHeader(
          'link',
          '<https://wrong.example/date-types>; type="text/html"; rel="canonical"'
        )
      const canonical =
        indexingRegression === 'markdown-canonical'
          ? 'https://wrong.example'
          : canonicalRoot + encodedPath(req.url.replace('/dataguide', '').replace(/\.md$/, ''))
      res.end(
        `# Dates\nCanonical URL: ${canonical}\nContent revision: ${hash}\nSource revision: ${sourceRevision}\n`
      )
      return
    }
    res.setHeader('content-type', 'text/html')
    if (preview || indexingRegression === 'header-noindex')
      res.setHeader('x-robots-tag', 'googlebot: NOINDEX, follow')
    const canonical = escapeHtml(
      canonicalRoot + encodedPath(req.url.replace('/dataguide', '').replace(/\/$/, ''))
    )
    res.end(
      `<title>Guide</title>${indexingRegression === 'missing-canonical' ? '' : `<link rel="canonical" href="${indexingRegression === 'wrong-canonical' ? 'https://preview.example/dataguide' : canonical}">`}${['meta-noindex', 'bot-noindex'].includes(indexingRegression) ? `<meta name="${indexingRegression === 'bot-noindex' ? 'googlebot' : 'robots'}" content="noindex, follow">` : ''}<meta name="dataguide:content-revision" content="${hash}"><meta name="dataguide:source-revision" content="${sourceRevision}"><h2 id="get-the-interval-between-two-dates">Dates</h2>`
    )
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const args = [
    script,
    `http://127.0.0.1:${server.address().port}/dataguide`,
    hash,
    commit,
    'production',
    canonicalRoot,
  ]
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
    dirty = false
    for (const regression of [
      'wrong-canonical',
      'missing-canonical',
      'markdown-canonical',
      'canonical-header',
      'meta-noindex',
      'bot-noindex',
      'header-noindex',
      'markdown-noindex',
      'blocked-robots',
      'bot-blocked',
      'invalid-robots',
    ]) {
      indexingRegression = regression
      await assert.rejects(exec(process.execPath, args, { cwd: root }), regression)
      const report = JSON.parse(
        readFileSync(path.join(root, '.verification-runs/deployment.json'), 'utf8')
      )
      assert.ok(
        report.failures.some((row) => row.indexingError),
        regression
      )
      assert.ok(
        report.results
          .filter((row) => row.contentRevision)
          .every((row) => row.contentRevision === hash && row.sourceRevision === commit)
      )
    }
    indexingRegression = null
    preview = true
    args[4] = 'preview'
    await exec(process.execPath, args, { cwd: root })
    preview = false
    await assert.rejects(
      exec(process.execPath, args, { cwd: root }),
      'preview crawling must be blocked'
    )
    await assert.rejects(
      exec(process.execPath, args.slice(0, 4), { cwd: root }),
      'environment must be explicit'
    )
  } finally {
    await new Promise((resolve) => server.close(resolve))
    rmSync(root, { recursive: true, force: true })
  }
})

test('robots policy respects bot groups, longest paths, allow ties, wildcards and anchors', () => {
  const url = 'https://www.prisma.io/dataguide/postgresql/date-types'
  assert.equal(robotsAllows('User-agent: *\nDisallow: /\nAllow: /dataguide/', url), true)
  assert.equal(robotsAllows('User-agent: *\nDisallow: /dataguide\nAllow: /dataguide', url), true)
  assert.equal(robotsAllows('User-agent: *\nDisallow: /*date-types$', url), false)
  assert.equal(robotsAllows('User-agent: *\nDisallow: /*date-types$', url + '/other'), true)
  assert.equal(robotsAllows('User-agent: *\nDisallow:\n', url), true)
  assert.equal(
    robotsAllows('User-agent: *\nDisallow:\nUser-agent: Googlebot\nDisallow: /', url),
    true
  )
  const bots =
    'User-agent: *\nDisallow: /\nUser-agent: Googlebot\nAllow: /\nUser-agent: Googlebot\nDisallow: /dataguide'
  assert.equal(robotsAllows(bots, url), false)
  assert.equal(robotsAllows(bots, url, 'googlebot'), false)
  assert.equal(robotsAllows(bots, 'https://www.prisma.io/docs', 'googlebot'), true)
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
