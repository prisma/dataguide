import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkArtifacts } from './check-artifacts.mjs'

test('missing images, srcset, social cards, exports and canonicals fail independently', () => {
  const site = {
    pages: new Map([
      [
        '/lesson',
        '<img src="/dataguide/missing.png" srcSet="/dataguide/missing-2.png 2x"><meta property="og:image" content="https://www.prisma.io/dataguide/social/missing.png"><link rel="canonical" href="https://www.prisma.io/dataguide/old">',
      ],
    ]),
    files: new Set(),
    markdown: new Map([['/lesson.md', '[old](https://www.prisma.io/dataguide/gone)']]),
    sitemaps: new Map([['/sitemap.xml', '<loc>https://www.prisma.io/dataguide/absent</loc>']]),
    pathPrefix: '/dataguide',
    siteRoot: 'https://www.prisma.io/dataguide',
  }
  assert.deepEqual(
    checkArtifacts(site).map((e) => e.kind),
    ['image', 'srcset', 'social image', 'canonical', 'Markdown link', 'sitemap']
  )
})

test('existing assets and canonical links pass; external images are separate checks', () => {
  assert.deepEqual(
    checkArtifacts({
      pages: new Map([
        [
          '/lesson',
          '<img src="/static/book.png"><img src="https://cdn.example.test/image.png"><link rel="canonical" href="https://www.prisma.io/dataguide/lesson">',
        ],
      ]),
      files: new Set(['/static/book.png']),
      pathPrefix: '',
      siteRoot: 'https://www.prisma.io/dataguide',
    }),
    []
  )
})

test('agent alternates and catalog destinations exist and FAQ metadata matches the catalog', () => {
  const siteRoot = 'https://www.prisma.io/dataguide'
  const article = {
    path: '/lesson',
    url: `${siteRoot}/lesson`,
    markdownUrl: `${siteRoot}/lesson.md`,
    faqs: [{ question: 'A question?', answerMarkdown: '**A complete answer.**' }],
  }
  const html = `<link rel="alternate" type="text/markdown" href="${article.markdownUrl}"><script type="application/ld+json">${JSON.stringify(
    {
      '@graph': [
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'A question?',
              acceptedAnswer: { '@type': 'Answer', text: 'A complete answer.' },
            },
          ],
        },
      ],
    }
  )}</script>`
  const site = {
    pages: new Map([['/lesson', html]]),
    files: new Set(['/lesson.md']),
    agentIndexes: new Map([
      ['/agent-index.json', JSON.stringify({ schemaVersion: 1, articles: [article] })],
    ]),
    pathPrefix: '/dataguide',
    siteRoot,
  }
  assert.deepEqual(checkArtifacts(site), [])
  site.files.clear()
  assert.ok(checkArtifacts(site).some((error) => error.kind === 'agent alternate'))
  assert.ok(checkArtifacts(site).some((error) => error.kind === 'agent Markdown'))
  site.files.add('/lesson.md')
  site.pages.set('/lesson', html.replace('A complete answer.', 'Truncated'))
  assert.ok(checkArtifacts(site).some((error) => error.reason.includes('FAQs differ')))
  site.agentIndexes.set('/agent-index.json', '<html>Not JSON</html>')
  assert.ok(checkArtifacts(site).some((error) => error.kind === 'agent catalog'))
})
