import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canonicalPageURL, buildMetaImageURL } from './socialMetadata.ts'

const site = 'https://www.prisma.io'

test('canonical URLs include the production prefix exactly once, including unprefixed previews', () => {
  for (const pathname of ['/intro/what-are-databases', '/dataguide/intro/what-are-databases/']) {
    assert.equal(
      canonicalPageURL(`${site}/`, '/dataguide/', pathname),
      `${site}/dataguide/intro/what-are-databases`
    )
  }
  assert.equal(canonicalPageURL(site, '/dataguide', '/'), `${site}/dataguide`)
  assert.equal(canonicalPageURL(site, '/dataguide', '/dataguide/'), `${site}/dataguide`)
  assert.equal(canonicalPageURL(site, '', '/intro/'), `${site}/intro`)
  assert.equal(canonicalPageURL(site, '/', '/'), site)
  assert.equal(
    canonicalPageURL(site, '/dataguide', '/dataguide-example'),
    `${site}/dataguide/dataguide-example`
  )
})

test('social images resolve to absolute URLs without doubling the prefix or changing remote URLs', () => {
  for (const image of ['/social/generated/card.png', '/dataguide/social/generated/card.png']) {
    assert.equal(
      buildMetaImageURL(site, '/dataguide', image),
      `${site}/dataguide/social/generated/card.png`
    )
  }
  assert.equal(
    buildMetaImageURL(site, '/dataguide', '../../dataguide-images/card.png'),
    `${site}/dataguide/dataguide-images/card.png`
  )
  assert.equal(
    buildMetaImageURL(site, '/dataguide', 'https://images.example.com/card.png'),
    'https://images.example.com/card.png'
  )
})
