import test from 'node:test'
import assert from 'node:assert/strict'
import { ctaEvent, installCtaTracking } from './readerEvents.ts'

test('CTA event retains attribution while excluding arbitrary query strings', () => {
  const placement = { dataset: { ctaPlacement: 'mobile_sticky', ctaCluster: 'managed_ops' } }
  const link = {
    href: 'https://console.prisma.io/login?secret=never-record-this',
    closest: () => placement,
  }
  const icon = { closest: () => link } as unknown as Element
  assert.deepEqual(ctaEvent(icon, '/dataguide/postgresql/date-types', 'revision'), {
    event: 'dataguide_cta_click',
    properties: {
      article_path: '/dataguide/postgresql/date-types',
      placement: 'mobile_sticky',
      cluster: 'managed_ops',
      destination_path: '/login',
      content_revision: 'revision',
    },
  })
})
test('ordinary navigation is not counted as a product CTA', () => {
  assert.equal(ctaEvent({ closest: () => null } as unknown as Element, '/intro', ''), null)
})

test('delegated click reaches the injected transport once and can be removed', () => {
  const original = globalThis.Element
  class FakeElement {
    href = 'https://console.prisma.io/login?ignored=value'
    dataset = { ctaPlacement: 'end_cta', ctaCluster: 'managed_ops' }
    closest() {
      return this
    }
  }
  Object.assign(globalThis, { Element: FakeElement })
  try {
    let listener: ((event: unknown) => void) | undefined
    const fakeDocument = {
      location: { pathname: '/dataguide/postgresql/date-types' },
      querySelector: () => ({ getAttribute: () => 'revision' }),
      addEventListener: (_name: string, handler: typeof listener) => {
        listener = handler
      },
      removeEventListener: (_name: string, handler: typeof listener) => {
        assert.equal(handler, listener)
        listener = undefined
      },
    }
    const events: unknown[] = []
    const remove = installCtaTracking(fakeDocument as unknown as Document, (event, properties) =>
      events.push({ event, properties })
    )
    listener!({ target: new FakeElement() })
    assert.equal(events.length, 1)
    assert.equal((events[0] as { event: string }).event, 'dataguide_cta_click')
    remove()
    assert.equal(listener, undefined)
  } finally {
    Object.assign(globalThis, { Element: original })
  }
})
