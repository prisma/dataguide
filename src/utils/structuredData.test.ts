import { test } from 'node:test'
import assert from 'node:assert/strict'
import { articleStructuredData, serializeJsonLd, websiteStructuredData } from './structuredData.ts'

const article = {
  url: 'https://www.prisma.io/dataguide/postgresql/benefits-of-postgresql',
  title: 'The benefits of PostgreSQL',
  description: 'Why PostgreSQL',
  authors: ['Justin Ellingwood'],
  breadcrumbs: [
    { name: "Prisma's Data Guide", url: 'https://www.prisma.io/dataguide' },
    { name: 'PostgreSQL', url: 'https://www.prisma.io/dataguide/postgresql' },
  ],
}

test('article data describes the article and its breadcrumb trail', () => {
  const [page, breadcrumbs] = articleStructuredData(article)['@graph'] as any[]
  assert.equal(page['@type'], 'TechArticle')
  assert.equal(page.headline, article.title)
  assert.deepEqual(page.author, [{ '@type': 'Person', name: 'Justin Ellingwood' }])
  assert.deepEqual(
    breadcrumbs.itemListElement.map((item: any) => [item.position, item.name, item.item]),
    [
      [1, "Prisma's Data Guide", 'https://www.prisma.io/dataguide'],
      [2, 'PostgreSQL', 'https://www.prisma.io/dataguide/postgresql'],
      [3, 'The benefits of PostgreSQL', article.url],
    ]
  )
})

test('section hubs are collection pages', () => {
  const [page] = articleStructuredData({ ...article, type: 'CollectionPage' })['@graph'] as any[]
  assert.equal(page['@type'], 'CollectionPage')
})

test('dates and authors are only included when known', () => {
  const [page] = articleStructuredData({ ...article, authors: [] })['@graph'] as any[]
  assert.equal('author' in page, false)
  assert.equal('dateModified' in page, false)

  const [updated] = articleStructuredData({ ...article, dateModified: '2026-09-29' })[
    '@graph'
  ] as any[]
  assert.equal(updated.dateModified, '2026-09-29')
})

test('the website data names the site', () => {
  assert.deepEqual(
    websiteStructuredData("Prisma's Data Guide", 'https://www.prisma.io/dataguide'),
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: "Prisma's Data Guide",
      url: 'https://www.prisma.io/dataguide',
      publisher: { '@type': 'Organization', name: 'Prisma', url: 'https://www.prisma.io' },
    }
  )
})

test('serialized data cannot close the script tag', () => {
  const json = serializeJsonLd({ title: '</script><script>alert(1)</script>' })
  assert.equal(json.includes('</script>'), false)
  assert.equal(JSON.parse(json).title, '</script><script>alert(1)</script>')
})
