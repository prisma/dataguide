import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
const { REVISION_RECORD_ID } = createRequire(import.meta.url)(
  '../plugins/gatsby-algolia-indexer/revision-record.cjs'
)
const {
  GATSBY_ALGOLIA_APP_ID: appId,
  GATSBY_ALGOLIA_SEARCH_KEY: searchKey,
  GATSBY_ALGOLIA_INDEX_NAME: indexName,
} = process.env
if (!appId || !searchKey || !indexName)
  throw new Error('Read-only search credentials and index name are required')
const revision = process.argv[2]
const sourceRevision = process.argv[3]
if (!revision || !/^[a-f0-9]{40,64}$/i.test(sourceRevision || ''))
  throw new Error(
    'Pass both the expected content hash and full source commit from the build being released'
  )
const indexUrl = `https://${appId}-dsn.algolia.net/1/indexes/${encodeURIComponent(indexName)}`
const headers = { 'X-Algolia-Application-Id': appId, 'X-Algolia-API-Key': searchKey }

// The indexer keeps the build's revisions in one record, so that unchanged articles aren't
// rewritten on every deploy. It shows which build last published the index.
let indexRevision
try {
  const response = await fetch(`${indexUrl}/${encodeURIComponent(REVISION_RECORD_ID)}`, {
    headers,
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error(`Revision record HTTP ${response.status}`)
  const record = await response.json()
  indexRevision = {
    contentRevision: record.contentRevision,
    sourceRevision: record.sourceRevision,
    transformerRevision: record.transformerRevision,
    passed: record.contentRevision === revision && record.sourceRevision === sourceRevision,
  }
} catch (error) {
  indexRevision = { passed: false, error: error.message }
}

// The journeys check that the index's records, not only its revision record, are current
const cases = JSON.parse(readFileSync('tests/search-journeys.json', 'utf8'))
const results = []
for (const item of cases) {
  try {
    const response = await fetch(`${indexUrl}/query`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: item.query, hitsPerPage: 5 }),
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) throw new Error(`Search HTTP ${response.status}`)
    const { hits } = await response.json()
    const match = hits.find(
      (hit) =>
        hit.dataguidePath?.split('#')[0] === item.path &&
        (!item.anchor || hit.dataguidePath.endsWith(`#${item.anchor}`))
    )
    const snippet = `${match?.heading || ''} ${match?.content || ''}`.toLowerCase()
    const snippetMatches = item.snippetTerms.every((term) => snippet.includes(term.toLowerCase()))
    results.push({
      ...item,
      snippetMatches,
      passed: !!match && snippetMatches,
      hits: hits.map(({ dataguidePath, heading, content }) => ({
        dataguidePath,
        heading,
        content,
      })),
    })
  } catch (error) {
    results.push({ ...item, passed: false, error: error.message })
  }
}
mkdirSync('.verification-runs', { recursive: true })
writeFileSync(
  '.verification-runs/search.json',
  `${JSON.stringify({ checkedAt: new Date().toISOString(), expectedRevision: revision, expectedSourceRevision: sourceRevision, indexRevision, results }, null, 2)}\n`
)
if (!indexRevision.passed || results.some((result) => !result.passed)) process.exitCode = 1
