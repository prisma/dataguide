import { mkdirSync, writeFileSync } from 'node:fs'

const base = process.argv[2]
if (!base || !/^https?:\/\//.test(base))
  throw new Error('Pass the deployment URL including /dataguide when appropriate')
const root = base.replace(/\/$/, '')
const expectedRevision = process.argv[3]
const expectedSourceRevision = process.argv[4]
if (!expectedRevision || !/^[a-f0-9]{40,64}$/i.test(expectedSourceRevision || ''))
  throw new Error(
    'Pass both the expected content hash and full source commit from the build being released'
  )
const restored = [
  '/postgresql/setting-up-a-local-postgresql-database',
  '/postgresql/introduction-to-data-types',
  '/postgresql/date-types',
  '/postgresql/connecting-to-postgresql-databases',
  '/postgresql/short-guides/connection-uris',
  '/intro/database-glossary',
]
const routes = [
  '/',
  ...restored,
  '/sqlite/update-data',
  '/sqlite/update-data.md',
  '/mongodb/mongodb-transactions',
  '/mongodb/mongodb-transactions.md',
  '/postgresql/reading-and-querying-data/optimizing-postgresql',
  '/postgresql/reading-and-querying-data/optimizing-postgresql.md',
  '/postgresql/date-types/',
  '/postgresql/date-types#get-the-interval-between-two-dates',
  '/postgresql/date-types.md',
  '/llms.txt',
  '/sitemap/sitemap-index.xml',
  '/content-manifest.json',
  '/definitely-missing-review-route-91f6',
]
// These are the actual destinations from config.ts at 056fa03, not guessed Docs URLs.
const formerDocs = restored.map(
  (route) =>
    `${new URL(root).origin}/docs/orm/more/help-and-troubleshooting/dataguide/${route.split('/').at(-1)}`
)
const inspect = async (url) => {
  const chain = []
  for (let hop = 0; hop < 6; hop++) {
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000) })
    chain.push({ url, status: response.status, location: response.headers.get('location') })
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      url = new URL(response.headers.get('location'), url).href
      await response.body?.cancel()
      continue
    }
    const body = await response.text()
    const documentTitle = body.match(/<title[^>]*>(.*?)<\/title>/is)?.[1] || null
    const unavailable = documentTitle === 'Deployment has failed'
    let manifestRevision = null
    let manifestSourceRevision = null
    let dirty = null
    let representationError = null
    if (url.endsWith('/content-manifest.json') && response.ok && !unavailable) {
      try {
        const manifest = JSON.parse(body)
        manifestRevision = manifest.contentRevision
        manifestSourceRevision = manifest.sourceRevision
        dirty = manifest.dirty
      } catch (error) {
        representationError = error.message
      }
    }
    if (
      /(?:\.md|llms\.txt|sitemap[^/]*\.xml)$/.test(new URL(url).pathname) &&
      response.headers.get('content-type')?.includes('text/html')
    )
      representationError = 'Received HTML for a Markdown, llms or sitemap representation'
    const fragment = new URL(chain[0].url).hash.slice(1)
    const attribute = (tag, key) =>
      tag?.match(new RegExp(`\\b${key}=["']([^"']+)["']`, 'i'))?.[1] || null
    const tags = [...body.matchAll(/<(?:link|meta)\b[^>]*>/gi)].map(([tag]) => tag)
    const canonicalTag = tags.find((tag) => attribute(tag, 'rel') === 'canonical')
    const meta = (name) =>
      attribute(
        tags.find((tag) => attribute(tag, 'name') === name),
        'content'
      )
    return {
      requestedUrl: chain[0].url,
      finalUrl: url,
      chain,
      status: response.status,
      result: unavailable ? 'unavailable' : undefined,
      documentTitle,
      representationError,
      contentType: response.headers.get('content-type'),
      indexingHeader: response.headers.get('x-robots-tag'),
      canonicalHeader: response.headers.get('link'),
      canonical:
        attribute(canonicalTag, 'href') || body.match(/Canonical URL: ([^\n]+)/)?.[1] || null,
      robotsMeta: meta('robots'),
      contentRevision:
        meta('dataguide:content-revision') ||
        body.match(/Content revision: ([^\n]+)/)?.[1] ||
        manifestRevision,
      sourceRevision:
        meta('dataguide:source-revision') ||
        body.match(/Source revision: ([^\n]+)/)?.[1] ||
        manifestSourceRevision,
      dirty,
      anchorExists: fragment
        ? [...body.matchAll(/\bid=["']([^"']+)["']/g)].some(
            ([, id]) => id === decodeURIComponent(fragment)
          )
        : undefined,
      robotsPolicy: url.endsWith('/robots.txt') ? body : undefined,
    }
  }
  throw new Error('redirect chain exceeds six hops')
}
const results = []
// Bound requests, preserve network errors as inconclusive rather than fabricated 404s.
for (let i = 0; i < routes.length; i += 4) {
  results.push(
    ...(await Promise.all(
      routes.slice(i, i + 4).map(async (route) => {
        try {
          return { route, ...(await inspect(`${root}${route === '/' ? '' : route}`)) }
        } catch (error) {
          return { route, result: 'inconclusive', error: error.message }
        }
      })
    ))
  )
}
try {
  results.push({
    route: '/robots.txt (origin)',
    ...(await inspect(`${new URL(root).origin}/robots.txt`)),
  })
} catch (error) {
  results.push({ route: '/robots.txt (origin)', result: 'inconclusive', error: error.message })
}
// Former destinations are observations for the Docs owner, not acceptance of unrelated 200 pages.
const docsResults = []
if (!new URL(root).hostname.match(/^(127\.0\.0\.1|localhost)$/))
  for (let i = 0; i < formerDocs.length; i += 4) {
    docsResults.push(
      ...(await Promise.all(
        formerDocs.slice(i, i + 4).map(async (url) => {
          try {
            return { scope: 'former Docs destination', ...(await inspect(url)) }
          } catch (error) {
            return { requestedUrl: url, result: 'inconclusive', error: error.message }
          }
        })
      ))
    )
  }
const failures = results.filter(
  (result) =>
    result.result === 'inconclusive' ||
    result.result === 'unavailable' ||
    result.representationError ||
    result.anchorExists === false ||
    (result.route.includes('definitely-missing') ? result.status !== 404 : result.status !== 200) ||
    ((result.route.endsWith('.md') ||
      (!/\.(md|json|xml)$/.test(result.route) &&
        result.route !== '/llms.txt' &&
        !result.route.startsWith('/robots')) ||
      result.route === '/content-manifest.json') &&
      !result.route.includes('definitely-missing') &&
      (result.contentRevision !== expectedRevision ||
        result.sourceRevision !== expectedSourceRevision ||
        result.dirty === true))
)
const report = {
  checkedAt: new Date().toISOString(),
  base: root,
  expectedRevision: expectedRevision || null,
  expectedSourceRevision,
  results,
  formerDocs: docsResults,
  failures,
  scope:
    'HTTP status, redirects, indexing signals, canonical, one retained anchor, content hash and source commit. A dirty deployed build fails. Robots content is retained for policy review; network errors remain inconclusive.',
}
mkdirSync('.verification-runs', { recursive: true })
writeFileSync('.verification-runs/deployment.json', `${JSON.stringify(report, null, 2)}\n`)
for (const row of results)
  console.log(
    `${row.result || (row.representationError ? 'invalid-representation' : row.status)} ${row.route} ${row.finalUrl || row.error}`
  )
if (failures.length) process.exitCode = 1
