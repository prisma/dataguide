import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkLinks } from './check-links.mjs'

const site = (pages, options = {}) =>
  checkLinks({
    pages: new Map(Object.entries(pages)),
    files: new Set(['/llms.txt', '/static/diagram.png']),
    pathPrefix: '/dataguide',
    siteRoot: 'https://www.prisma.io/dataguide',
    ...options,
  })

test('accepts links to pages, anchors and files', () => {
  const result = site({
    '/': '<a href="/dataguide/intro">Intro</a> <a href="/dataguide/llms.txt">llms</a>',
    '/intro': `<h2 id="what-is-sql">SQL</h2><dt id="acid"></dt>
      <a href="#what-is-sql">up</a> <a href="/dataguide/intro#acid">ACID</a>
      <a href="/dataguide/static/diagram.png">diagram</a> <a href="/dataguide/">home</a>`,
  })
  assert.deepEqual(result.broken, [])
  assert.equal(result.checked, 6)
})

test('reports missing pages and anchors once per link, with the pages they appear on', () => {
  const result = site({
    '/': '<a href="/dataguide/intro#nope">x</a> <a href="/dataguide/gone">y</a>',
    '/intro': '<h2 id="sql"></h2><a href="/dataguide/gone">y</a>',
  })
  assert.deepEqual(result.broken, [
    { href: '/dataguide/intro#nope', reason: 'no element with id "nope" on /intro', pages: ['/'] },
    { href: '/dataguide/gone', reason: 'no page /gone', pages: ['/', '/intro'] },
  ])
})

test('checks absolute links to the canonical site and ignores other sites', () => {
  const result = site({
    '/intro': `<a href="https://www.prisma.io/dataguide/intro#missing">a</a>
      <a href="https://www.prisma.io/docs/orm">docs</a>
      <a href="https://example.com/dataguide/x">other</a>
      <a href="/docs">outside the guide</a> <a href="mailto:a@b.c">mail</a>`,
  })
  assert.equal(result.checked, 1)
  assert.equal(result.broken[0].reason, 'no element with id "missing" on /intro')
})

test('resolves relative links against the page, and decodes entities and escapes', () => {
  const result = site({
    '/postgresql/joins': '<a href="date-types#time-zones">t</a> <a href="?a=1&amp;b=2">q</a>',
    '/postgresql/date-types': '<h2 id="time-zones"></h2>',
  })
  assert.deepEqual(result.broken, [])
})

test('ignores text fragments', () => {
  const result = site({ '/': '<a href="/dataguide/intro#:~:text=foo">t</a>', '/intro': '' })
  assert.deepEqual(result.broken, [])
})

test('reports links to redirected paths by path, and still checks their anchors', () => {
  const result = site(
    {
      '/': '<a href="/dataguide/old">old</a> <a href="/dataguide/moved#a">a</a> <a href="/dataguide/moved#b">b</a>',
      '/moved': '<h2 id="a"></h2><a href="#a">in-page links are fine</a>',
    },
    { redirects: ['/old', '/moved'] }
  )
  assert.deepEqual(result.broken, [
    { href: '/dataguide/moved#b', reason: 'no element with id "b" on /moved', pages: ['/'] },
  ])
  assert.deepEqual(
    result.redirected.map(({ href, pages }) => [href, pages]),
    [
      ['/old', ['/']],
      ['/moved', ['/']],
    ]
  )
})

test('works without a path prefix', () => {
  const result = site(
    { '/': '<a href="/intro#a">x</a>', '/intro': '<h2 id="a"></h2>' },
    { pathPrefix: '' }
  )
  assert.deepEqual(result.broken, [])
  assert.equal(result.checked, 1)
})
