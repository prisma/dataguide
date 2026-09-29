const path = require('path')
const fs = require('fs/promises')

// Publishes a Markdown version of every article next to its HTML page (append `.md` to the URL)
// and an index of them at /llms.txt, like the Prisma docs do.

const publicDir = path.resolve('public')
const stripOrder = (slug) => slug.replace(/\d{2,}-/g, '')
const isIndexSlug = (slug) => slug === '/' || /\/index$/.test(slug)
// The page path within the Data Guide: `/01-intro/index` -> `/intro`, `/` -> `/`
const pagePath = (slug) => stripOrder(slug).replace(/\/index$/, '') || '/'
const markdownFile = (pathname) => (pathname === '/' ? '/index.md' : `${pathname}.md`)

// Published URLs of the images on a built page, by file name
const publishedImages = async (pathname) => {
  const htmlFile = path.join(publicDir, pathname, 'index.html')
  const html = await fs.readFile(htmlFile, 'utf8').catch(() => '')
  const urls = new Map()
  // Prefer the full-size images that gatsby-remark-images links to
  const patterns = [
    /class="gatsby-resp-image-link" href="([^"]+)"/g,
    /(?:src|href)="([^"]*\/static\/[^"]+)"/g,
  ]
  for (const pattern of patterns) {
    for (const [, url] of html.matchAll(pattern)) {
      const name = decodeURIComponent(url.split('/').pop().split('?')[0])
      if (!urls.has(name)) urls.set(name, url)
    }
  }
  return urls
}

exports.onPostBuild = async ({ graphql, reporter }, { exclude = [], repository }) => {
  const { mdxToMarkdown, createUrlResolver } = await import('./mdx-to-markdown.mjs')

  const { data, errors } = await graphql(`
    {
      site {
        siteMetadata {
          siteUrl
          pathPrefix
          description
          og {
            site_name
          }
        }
      }
      allMdx(sort: { fields: { slug: ASC } }) {
        nodes {
          body
          fields {
            slug
          }
          frontmatter {
            title
            metaDescription
            hidePage
            lastUpdated
          }
          internal {
            contentFilePath
          }
        }
      }
    }
  `)
  if (errors) {
    reporter.panicOnBuild('Markdown export: GraphQL query failed', errors)
    return
  }

  const { siteUrl, pathPrefix, description: siteDescription, og } = data.site.siteMetadata
  const siteName = og.site_name
  const siteRoot = `${siteUrl}${pathPrefix}`
  const pages = data.allMdx.nodes
    .map((node) => ({
      ...node,
      pathname: pagePath(node.fields.slug),
      isIndex: isIndexSlug(node.fields.slug),
    }))
    .filter((page) => !page.frontmatter.hidePage && !exclude.includes(page.pathname))

  const contentRoot = path.resolve('content')
  const markdownUrl = (page) => `${siteRoot}${markdownFile(page.pathname)}`

  // The articles in a section hub, `depth` levels deep
  const subsections = (hub, depth) => {
    const prefix = hub.pathname === '/' ? '/' : `${hub.pathname}/`
    const children = pages.filter(
      (page) =>
        page !== hub &&
        page.pathname.startsWith(prefix) &&
        page.pathname.slice(prefix.length).split('/').length === 1
    )
    if (children.length === 0) return []
    return [
      {
        type: 'list',
        ordered: false,
        spread: false,
        children: children.map((child) => ({
          type: 'listItem',
          spread: false,
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'link',
                  url: markdownUrl(child),
                  children: [{ type: 'text', value: child.frontmatter.title }],
                },
              ],
            },
            ...(depth > 1 && child.isIndex ? subsections(child, depth - 1) : []),
          ],
        })),
      },
    ]
  }

  let written = 0
  for (const page of pages) {
    const images = await publishedImages(page.pathname)
    const sourceDir = path.dirname(page.internal.contentFilePath)
    const resolveImage = (url) => {
      if (/^[a-z]+:/i.test(url)) return url
      const published = images.get(path.basename(url))
      if (published) return `${siteUrl}${published}`
      // Fall back to the file in the repository
      const file = path.relative(contentRoot, path.resolve(sourceDir, url))
      return `${repository}/content/${file.split(path.sep).join('/')}`
    }

    let body
    try {
      body = mdxToMarkdown(page.body, {
        resolveUrl: createUrlResolver({ siteRoot, pagePath: page.pathname, isIndex: page.isIndex }),
        resolveImage,
        subsections: (depth) => subsections(page, depth),
      })
    } catch (error) {
      reporter.panicOnBuild(`Markdown export failed for ${page.pathname}`, error)
      return
    }

    const header = [
      `# ${page.frontmatter.title}`,
      '',
      `> Part of ${siteName}. The complete index is at ${siteRoot}/llms.txt.`,
      '',
      ...(page.frontmatter.metaDescription &&
      page.frontmatter.metaDescription !== page.frontmatter.title
        ? [page.frontmatter.metaDescription.replace(/\s+/g, ' '), '']
        : []),
      `Canonical URL: ${page.pathname === '/' ? siteRoot : `${siteRoot}${page.pathname}`}`,
      ...(page.frontmatter.lastUpdated
        ? [`Last updated: ${page.frontmatter.lastUpdated.slice(0, 10)}`]
        : []),
      '',
    ]
    const file = path.join(publicDir, markdownFile(page.pathname))
    await fs.mkdir(path.dirname(file), { recursive: true })
    await fs.writeFile(file, `${header.join('\n')}\n${body}`)
    written++
  }

  // llms.txt: one section per top-level topic, in reading order
  const description = (page) =>
    page.frontmatter.metaDescription && page.frontmatter.metaDescription !== page.frontmatter.title
      ? `: ${page.frontmatter.metaDescription.replace(/\s+/g, ' ')}`
      : ''
  const entry = (page) => `- [${page.frontmatter.title}](${markdownUrl(page)})${description(page)}`
  const home = pages.find((page) => page.pathname === '/')
  const sections = pages.filter((page) => page.isIndex && /^\/[^/]+$/.test(page.pathname))
  const lines = [
    `# ${siteName}`,
    '',
    `> ${siteDescription}`,
    '',
    'A Markdown version of every article is available by appending `.md` to its URL.',
    ...(home ? [`The overview of all topics is at ${markdownUrl(home)}.`] : []),
    '',
  ]
  for (const section of sections) {
    const articles = pages.filter((page) => page.pathname.startsWith(`${section.pathname}/`))
    lines.push(`## ${section.frontmatter.title}`, '', entry(section), ...articles.map(entry), '')
  }
  await fs.writeFile(path.join(publicDir, 'llms.txt'), lines.join('\n'))

  reporter.info(`Markdown export: wrote ${written} articles and llms.txt`)
}
