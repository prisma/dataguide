import type { GatsbyConfig } from 'gatsby'
import dataguideConfig from './config'
import { rehypeTopicSections } from './src/utils/rehypeTopicSections'

// MDX 2 no longer parses GitHub Flavored Markdown (tables, strikethrough, ...)
// by default. remark-gfm is ESM-only, which Node >= 20.19 can `require`.
const remarkGfm = require('remark-gfm').default
// Gatsby doesn't stop on errors thrown while it loads this file: it builds with an empty config
// instead, which fails later with unrelated GraphQL errors. So problems found here are collected,
// and gatsby-plugin-content-manifest stops the build with them in onPreInit.
const configErrors: string[] = []
let contentRevision: { contentRevision: string | null; sourceRevision: string | null } = {
  contentRevision: null,
  sourceRevision: null,
}
try {
  contentRevision = require('./plugins/content-revision.cjs')()
} catch (error) {
  configErrors.push((error as Error).message)
}

// MDX 1 turned code fence meta (```js copy line-number) into props on the
// `code` element. MDX 2 drops it, so copy it over to keep the Code component
// options working.
const rehypeCodeMeta = () => (tree: any) => {
  const visit = (node: any) => {
    if (node.type === 'element' && node.tagName === 'code' && node.data?.meta) {
      for (const token of node.data.meta.trim().split(/\s+/)) {
        const [key, ...value] = token.split('=')
        if (key) node.properties[key] = value.length ? value.join('=') : true
      }
    }
    node.children?.forEach(visit)
  }
  visit(tree)
}

let plugins: any = [
  'gatsby-plugin-image',
  'gatsby-plugin-sharp',
  'gatsby-transformer-sharp',
  'gatsby-plugin-styled-components',
  'gatsby-plugin-smoothscroll',
  'gatsby-plugin-catch-links',
  {
    resolve: `gatsby-plugin-mdx`,
    options: {
      extensions: ['.mdx', '.md'],
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeCodeMeta, rehypeTopicSections],
      },
      gatsbyRemarkPlugins: [
        'gatsby-remark-sectionize',
        'gatsby-remark-normalize-paths',
        {
          resolve: `gatsby-remark-autolink-headers`,
          options: {
            icon: `<svg width="17" height="18" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.5 6.33337H15.5" stroke="#CBD5E0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M1.5 11.6666H15.5" stroke="#CBD5E0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6.75 1L5 17" stroke="#CBD5E0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 1L10.25 17" stroke="#CBD5E0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
            className: `title-link`,
            // Land linked headings below the sticky header (see scroll-padding-top in layout.css)
            offsetY: 80,
            enableCustomId: true,
          },
        },
        {
          resolve: `gatsby-remark-images`,
          options: {
            disableBgImageOnAlpha: true,
            quality: 100,
          },
        },
        {
          resolve: 'gatsby-remark-to-absoluteurl',
          options: {
            redirects: dataguideConfig.redirects,
          },
        },
        {
          resolve: 'gatsby-remark-copy-linked-files',
          options: {
            destinationDir: 'static',
          },
        },
      ],
    },
  },
  {
    resolve: 'gatsby-plugin-google-tagmanager',
    options: {
      id: 'GTM-KCGZPWB',
      includeInDevelopment: false,
      defaultDataLayer: { website: 'docs' },
    },
  },
  {
    resolve: `gatsby-plugin-sitemap`,
    options: {
      // Keep the sitemap at /sitemap/sitemap-index.xml (the default before v6)
      output: '/sitemap',
      entryLimit: 5000,
      resolvePages: ({ allSitePage }: any) =>
        allSitePage.nodes.filter((page: any) => page.pageContext?.publication?.indexed !== false),
      query: `{ site { siteMetadata { siteUrl } } allSitePage { nodes { path pageContext } } }`,
      excludes: [
        // Pages that aren't meant to be found
        `/intro/example`,
        // Pages that moved elsewhere: production redirects them
        ...dataguideConfig.redirects.map((redirect) => redirect.fromPath),
      ],
      resolvePagePath: (page: any) => {
        return page.path.replace(/\/$/, '')
      },
    },
  },
  // This robots.txt ends up at the root of the deployment's own domain (e.g. *.vercel.app) and
  // keeps that duplicate of the site out of search results. Crawling of the Data Guide itself is
  // governed by https://www.prisma.io/robots.txt, which allows /dataguide.
  {
    resolve: 'gatsby-plugin-robots-txt',
    options: {
      sitemap: '/sitemap/sitemap-index.xml',
      policy: [
        {
          userAgent: '*',
          disallow: ['/', '/*?query=*', '/*?page=*', '/*&query=*', '/*&page=*'],
        },
      ],
    },
  },
  {
    resolve: 'gatsby-source-filesystem',
    options: {
      name: 'images',
      path: `${__dirname}/src/images/`,
    },
    __key: 'images',
  },
  {
    resolve: 'gatsby-source-filesystem',
    options: {
      name: `docs`,
      path: `${__dirname}/content`,
    },
    __key: 'pages',
  },
  'gatsby-plugin-meta-redirect',
  'gatsby-plugin-page-list',
  {
    resolve: 'gatsby-plugin-markdown-export',
    options: {
      // Moved elsewhere: production redirects these pages
      exclude: dataguideConfig.redirects.map((redirect) => redirect.fromPath),
      repository: 'https://github.com/prisma/dataguide/blob/main',
    },
  },
  {
    // Fails the build on broken internal links and anchors, checked in the rendered pages
    resolve: 'gatsby-plugin-check-links',
    options: {
      redirects: dataguideConfig.redirects.map((redirect) => redirect.fromPath),
    },
  },
  { resolve: 'gatsby-plugin-content-manifest', options: { configErrors } },
]

if (process.env.INDEX_ALGOLIA === 'true') {
  if (process.env.GATSBY_ALGOLIA_APP_ID) {
    // only set this up when we actually need it
    const algoliaPlugin = {
      resolve: 'gatsby-algolia-indexer',
      options: {
        appId: process.env.GATSBY_ALGOLIA_APP_ID,
        adminKey: process.env.GATSBY_ALGOLIA_ADMIN_API_KEY,
        searchKey: process.env.GATSBY_ALGOLIA_SEARCH_KEY,
        indexName: process.env.GATSBY_ALGOLIA_INDEX_NAME,
        types: [`Mdx`],
      },
      __key: 'search',
    }

    plugins.push(algoliaPlugin)

    console.log(
      'INDEX_ALGOLIA is `true`, and GATSBY_ALGOLIA_APP_ID is set, so pushing algoliaPlugin to list of plugins to trigger search indexing.'
    )
  } else if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    // Previews never publish search, so missing credentials only skip indexing there
    console.warn(
      'INDEX_ALGOLIA=true, but GATSBY_ALGOLIA_APP_ID is undefined. Skipping search indexing in this preview.'
    )
  } else {
    configErrors.push('INDEX_ALGOLIA=true requires GATSBY_ALGOLIA_APP_ID and indexing credentials')
  }
} else {
  console.log('INDEX_ALGOLIA not `true`, not pushing algoliaPlugin to skip any search indexing.')
}

const config: GatsbyConfig = {
  pathPrefix: process.env.ADD_PREFIX === 'true' ? dataguideConfig.gatsby.pathPrefix : '/',
  // Keep page paths exactly as created (Gatsby 5 defaults to `always` adding a trailing slash)
  trailingSlash: 'ignore',
  // React 19 warns about the classic `React.createElement` JSX transform
  jsxRuntime: 'automatic',
  siteMetadata: {
    contentRevision: contentRevision.contentRevision,
    sourceRevision: contentRevision.sourceRevision,
    pathPrefix: dataguideConfig.gatsby.pathPrefix,
    title: dataguideConfig.siteMetadata.title,
    description: dataguideConfig.siteMetadata.description,
    keywords: dataguideConfig.siteMetadata.keywords,
    twitter: dataguideConfig.siteMetadata.twitter,
    og: dataguideConfig.siteMetadata.og,
    header: dataguideConfig.header,
    siteUrl: dataguideConfig.gatsby.siteUrl,
    footer: dataguideConfig.footer,
    docsLocation: dataguideConfig.siteMetadata.docsLocation,
  },
  // More easily incorporate content into your pages through automatic TypeScript type generation and better GraphQL IntelliSense.
  // If you use VSCode you can also use the GraphQL plugin
  // Learn more at: https://gatsby.dev/graphql-typegen
  plugins,
}

export default config
