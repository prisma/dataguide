// Section hubs are the `index.mdx` files of each folder; the homepage has the slug `/`.
// Match the file name exactly: articles such as `mongodb-indexes` are not hubs.
export const isIndexSlug = (slug?: string | null): boolean =>
  !!slug && (slug === '/' || /\/index$/.test(slug))

export interface NavItem {
  title: string
  url: string
}

// The articles before and after `url` in the reading order
export const getNavNeighbours = (
  nav: NavItem[],
  url: string
): { previous: NavItem | null; next: NavItem | null } => {
  const index = nav.findIndex((item) => item.url === url)
  if (index === -1) return { previous: null, next: null }
  return { previous: nav[index - 1] ?? null, next: nav[index + 1] ?? null }
}
