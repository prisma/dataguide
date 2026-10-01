import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
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
const cases = JSON.parse(readFileSync('tests/search-journeys.json', 'utf8'))
const results = []
for (const item of cases) {
  try {
    const response = await fetch(
      `https://${appId}-dsn.algolia.net/1/indexes/${encodeURIComponent(indexName)}/query`,
      {
        method: 'POST',
        headers: {
          'X-Algolia-Application-Id': appId,
          'X-Algolia-API-Key': searchKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: item.query, hitsPerPage: 5 }),
        signal: AbortSignal.timeout(15000),
      }
    )
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
      passed:
        !!match &&
        match.contentRevision === revision &&
        match.sourceRevision === sourceRevision &&
        snippetMatches,
      hits: hits.map(({ dataguidePath, heading, content, contentRevision, sourceRevision }) => ({
        dataguidePath,
        heading,
        content,
        contentRevision,
        sourceRevision,
      })),
    })
  } catch (error) {
    results.push({ ...item, passed: false, error: error.message })
  }
}
mkdirSync('.verification-runs', { recursive: true })
writeFileSync(
  '.verification-runs/search.json',
  `${JSON.stringify({ checkedAt: new Date().toISOString(), expectedRevision: revision, expectedSourceRevision: sourceRevision, results }, null, 2)}\n`
)
if (results.some((result) => !result.passed)) process.exitCode = 1
