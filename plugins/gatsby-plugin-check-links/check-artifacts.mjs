import { faqAnswerText } from '../gatsby-plugin-markdown-export/faqs.mjs'

// Local checks only. Network failures belong in deployment smoke tests.
export const checkArtifacts = ({
  pages,
  files,
  markdown = new Map(),
  sitemaps = new Map(),
  agentIndexes = new Map(),
  pathPrefix,
  siteRoot,
}) => {
  const root = new URL(siteRoot)
  const canonicalPrefix = root.pathname.replace(/\/$/, '')
  const broken = []
  const resolve = (href, from, kind, asset = false) => {
    if (!href || /^(data|mailto|tel|javascript):/i.test(href)) return
    let url
    try {
      url = new URL(href.replaceAll('&amp;', '&'), `https://site.internal${pathPrefix}${from}`)
    } catch {
      broken.push({ from, href, kind, reason: 'invalid URL' })
      return
    }
    let prefix
    if (url.host === 'site.internal') prefix = pathPrefix
    else if (url.host === root.host) prefix = canonicalPrefix
    else return
    if (url.pathname !== prefix && !url.pathname.startsWith(`${prefix}/`)) return
    let target
    try {
      target = decodeURIComponent(url.pathname.slice(prefix.length)).replace(/\/$/, '') || '/'
    } catch {
      broken.push({ from, href, kind, reason: 'invalid URL encoding' })
      return
    }
    if (!(asset ? files.has(target) : files.has(target) || pages.has(target))) {
      broken.push({ from, href, kind, reason: `missing ${target}` })
    }
  }
  for (const [from, html] of pages) {
    for (const [, attrs] of html.matchAll(/<(?:img|source)\b([^>]+)>/g)) {
      const src = attrs.match(/\bsrc="([^"]+)"/)?.[1]
      if (src) resolve(src, from, 'image', true)
      const set = attrs.match(/\bsrc[Ss]et="([^"]+)"/)?.[1]
      if (set && !set.startsWith('data:'))
        for (const candidate of set.split(','))
          resolve(candidate.trim().split(/\s+/)[0], from, 'srcset', true)
    }
    for (const [, attrs] of html.matchAll(/<meta\b([^>]+)>/g)) {
      if (!/(?:property|name)="(?:og:image|twitter:image)"/.test(attrs)) continue
      resolve(attrs.match(/\bcontent="([^"]+)"/)?.[1], from, 'social image', true)
    }
    for (const [, attrs] of html.matchAll(/<link\b([^>]+)>/g)) {
      if (
        /\brel="alternate"/.test(attrs) &&
        /\btype="(?:text\/(?:markdown|plain)|application\/json)"/.test(attrs)
      ) {
        resolve(attrs.match(/\bhref="([^"]+)"/)?.[1], from, 'agent alternate', true)
      }
      if (!/\brel="canonical"/.test(attrs)) continue
      const href = attrs.match(/\bhref="([^"]+)"/)?.[1]
      try {
        const canonical = new URL(href)
        const expected = `${siteRoot.replace(/\/$/, '')}${from === '/' ? '' : from}`
        if (canonical.href.replace(/\/$/, '') !== expected)
          broken.push({ from, href, kind: 'canonical', reason: `expected ${expected}` })
      } catch {
        broken.push({ from, href, kind: 'canonical', reason: 'canonical must be absolute' })
      }
    }
  }
  for (const [from, body] of markdown) {
    for (const [, href] of body.matchAll(/\]\((<?[^\s)]+>?)(?:\s+"[^"]*")?\)/g))
      resolve(href.replace(/^<|>$/g, ''), from, 'Markdown link')
  }
  for (const [from, xml] of sitemaps) {
    for (const [, href] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) resolve(href, from, 'sitemap')
  }
  for (const [from, body] of agentIndexes) {
    try {
      const catalog = JSON.parse(body)
      if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.articles))
        throw new Error('invalid catalog schema')
      const paths = new Set()
      for (const article of catalog.articles) {
        if (paths.has(article.path)) throw new Error(`duplicate article ${article.path}`)
        paths.add(article.path)
        resolve(article.url, from, 'agent canonical')
        resolve(article.markdownUrl, from, 'agent Markdown', true)
        const html = pages.get(article.path)
        if (!html) throw new Error(`missing HTML for ${article.path}`)
        const graphs = [
          ...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
        ].flatMap(([, json]) => JSON.parse(json)['@graph'] || [])
        const faq = graphs.find((node) => node['@type'] === 'FAQPage')
        const expected = article.faqs.map(({ question, answerMarkdown }) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: faqAnswerText(answerMarkdown) },
        }))
        if (expected.some((question) => !question.name.trim() || !question.acceptedAnswer.text))
          throw new Error(`empty FAQ for ${article.path}`)
        if (JSON.stringify(faq?.mainEntity || []) !== JSON.stringify(expected))
          throw new Error(`HTML and catalog FAQs differ for ${article.path}`)
      }
    } catch (error) {
      broken.push({ from, kind: 'agent catalog', reason: error.message })
    }
  }
  return broken
}
