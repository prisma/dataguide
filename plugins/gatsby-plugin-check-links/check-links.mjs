// Checks the links in the built HTML: every link into the Data Guide must reach a published
// page or file, and every #fragment must match an id on the target page. Checking the
// rendered output covers links in content, components (glossary anchors, cards) and navigation.

const entities = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", '#x27': "'" }
const decodeEntities = (value) =>
  value.replace(/&(amp|lt|gt|quot|#39|#x27);/g, (_, e) => entities[e])

const hrefs = (html) =>
  [...html.matchAll(/<a\s[^>]*?\bhref="([^"]*)"/g)].map((match) => decodeEntities(match[1]))

const anchors = (html) =>
  new Set([...html.matchAll(/\s(?:id|name)="([^"]+)"/g)].map((match) => decodeEntities(match[1])))

/**
 * @param {object} site
 * @param {Map<string, string>} site.pages HTML of every page by path within the guide ('/', '/intro')
 * @param {Set<string>} site.files Other published files by path ('/llms.txt', '/intro.md')
 * @param {string} site.pathPrefix Prefix the pages are served under ('/dataguide', or '')
 * @param {string} site.siteRoot Canonical root of the guide ('https://www.prisma.io/dataguide')
 * @param {string[]} [site.redirects] Paths that redirect elsewhere
 */
export const checkLinks = ({ pages, files, pathPrefix, siteRoot, redirects = [] }) => {
  const canonical = new URL(siteRoot)
  const canonicalPrefix = canonical.pathname.replace(/\/$/, '')
  const anchorCache = new Map()
  const anchorsOf = (page) => {
    if (!anchorCache.has(page)) anchorCache.set(page, anchors(pages.get(page)))
    return anchorCache.get(page)
  }

  const broken = new Map()
  const redirected = new Map()
  const record = (map, href, from, reason) => {
    if (!map.has(href)) map.set(href, { href, reason, pages: [] })
    const { pages } = map.get(href)
    if (!pages.includes(from)) pages.push(from)
  }

  let checked = 0
  for (const [from, html] of pages) {
    const base = new URL(`${pathPrefix}${from}`, 'https://site.internal')
    for (const href of hrefs(html)) {
      if (!href || /^(mailto|tel|javascript|data):/i.test(href)) continue
      let url
      try {
        url = new URL(href, base)
      } catch {
        record(broken, href, from, 'invalid URL')
        continue
      }

      // Only links into the guide: served paths, or absolute links to the canonical site
      let prefix
      if (url.host === 'site.internal') prefix = pathPrefix
      else if (url.host === canonical.host) prefix = canonicalPrefix
      else continue
      if (url.pathname !== prefix && !url.pathname.startsWith(`${prefix}/`)) continue

      checked++
      const target = decodeURIComponent(url.pathname.slice(prefix.length)).replace(/\/$/, '') || '/'
      if (redirects.includes(target) && target !== from) record(redirected, target, from)
      if (pages.has(target)) {
        const fragment = decodeURIComponent(url.hash.slice(1))
        // Text fragments (#:~:text=) are not ids
        if (fragment && !fragment.startsWith(':~:') && !anchorsOf(target).has(fragment)) {
          record(broken, href, from, `no element with id "${fragment}" on ${target}`)
        }
      } else if (!files.has(target) && !redirects.includes(target)) {
        record(broken, href, from, `no page ${target}`)
      }
    }
  }

  return { checked, broken: [...broken.values()], redirected: [...redirected.values()] }
}

// Reads the built site: the HTML of every page, and the paths of all other files
export const readSite = async (publicDir) => {
  const { readdir, readFile } = await import('node:fs/promises')
  const path = await import('node:path')
  const pages = new Map()
  const files = new Set()
  for (const entry of await readdir(publicDir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue
    const file = path.join(entry.parentPath, entry.name)
    const route = `/${path.relative(publicDir, file).split(path.sep).join('/')}`
    if (entry.name === 'index.html') {
      pages.set(route.replace(/\/?index\.html$/, '') || '/', await readFile(file, 'utf8'))
    } else if (!entry.name.endsWith('.html')) {
      files.add(route)
    }
  }
  return { pages, files }
}
