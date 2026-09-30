import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
const {
  GATSBY_ALGOLIA_APP_ID: appId,
  GATSBY_ALGOLIA_SEARCH_KEY: searchKey,
  GATSBY_ALGOLIA_INDEX_NAME: indexName,
} = process.env
if (!appId || !searchKey || !indexName)
  throw new Error('Read-only search credentials and index name are required')
const revision = process.argv[2]
if (!revision) throw new Error('Pass the expected content revision from content-manifest.json')
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
      passed: !!match && match.contentRevision === revision && snippetMatches,
      hits: hits.map(({ dataguidePath, heading, content, contentRevision }) => ({
        dataguidePath,
        heading,
        content,
        contentRevision,
      })),
    })
  } catch (error) {
    results.push({ ...item, passed: false, error: error.message })
  }
}
mkdirSync('.verification-runs', { recursive: true })
writeFileSync(
  '.verification-runs/search.json',
  `${JSON.stringify({ checkedAt: new Date().toISOString(), expectedRevision: revision, results }, null, 2)}\n`
)
if (results.some((result) => !result.passed)) process.exitCode = 1
