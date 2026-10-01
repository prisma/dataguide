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
