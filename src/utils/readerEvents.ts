// Explicit journey events carry bounded context, never copied code or search text.
export const ctaEvent = (element: Element, pathname: string, revision: string) => {
  const link = element.closest('a[href]') as HTMLAnchorElement | null
  const placement = link?.closest('[data-cta-placement]') as HTMLElement | null
  if (!link || !placement) return null
  return {
    event: 'dataguide_cta_click',
    properties: {
      article_path: pathname,
      placement: placement.dataset.ctaPlacement,
      cluster: placement.dataset.ctaCluster,
      destination_path: new URL(link.href).pathname,
      content_revision: revision,
    },
  }
}

export const installCtaTracking = (
  document: Document,
  capture: (event: string, properties: Record<string, unknown>) => void
) => {
  const handler = (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return
    const revision =
      document.querySelector('meta[name="dataguide:content-revision"]')?.getAttribute('content') ||
      ''
    const result = ctaEvent(event.target, document.location.pathname, revision)
    if (result) capture(result.event, result.properties)
  }
  document.addEventListener('click', handler)
  return () => document.removeEventListener('click', handler)
}
