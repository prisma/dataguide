import type { GatsbyConfig } from 'gatsby'
import dataguideConfig from './config'

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
      gatsbyRemarkPlugins: [
        'gatsby-remark-sectionize',
        'gatsby-remark-normalize-paths',
        {
          resolve: `gatsby-remark-autolink-headers`,
          options: {
            icon: `<svg width="17" height="18" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.5 6.33337H15.5" stroke="#CBD5E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1.5 11.6666H15.5" stroke="#CBD5E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6.75 1L5 17" stroke="#CBD5E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 1L10.25 17" stroke="#CBD5E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>`,
            className: `title-link`,
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
          resolve: 'gatsby-remark-check-links-numberless',
          options: {
            // Do not surface links to these pages as broken:
            exceptions: [
              '/guides/upgrade-guides/upgrade-from-prisma-1/schema-incompatibilities-postgres',
              '/guides/upgrade-guides/upgrade-from-prisma-1/upgrading-the-prisma-layer-postgres',
              '/getting-started/setup-prisma/add-to-existing-project/relational-databases-typescript-postgresql',
              '/getting-started/setup-prisma/start-from-scratch/relational-databases-typescript-postgresql',
              '/getting-started/setup-prisma/add-to-existing-project/relational-databases-typescript-planetscale',
              '/getting-started/setup-prisma/start-from-scratch/relational-databases-typescript-planetscale',
              '/getting-started/setup-prisma/add-to-existing-project/relational-databases/introspection-typescript-planetscale',
              '/getting-started/setup-prisma/start-from-scratch/relational-databases/connect-your-database-typescript-planetscale',
              '/getting-started/setup-prisma/add-to-existing-project/mongodb-typescript-mongodb',
              '/getting-started/setup-prisma/start-from-scratch/mongodb-typescript-mongodb',
              '/getting-started/setup-prisma/add-to-existing-project/relational-databases-typescript-cockroachdb',
              '/getting-started/setup-prisma/start-from-scratch/relational-databases-typescript-cockroachdb',
            ],
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
      entryLimit: 5000,
      excludes: [
        // Remove these from sitemap for SEO purposes as they're redirected
        `/dummy`,
        `/intro/example`,
      ],
      resolvePagePath: (page: any) => {
        return page.path.replace(/\/$/, '')
      },
    },
  },
  {
    resolve: 'gatsby-plugin-robots-txt',
    options: {
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
  {
    resolve: 'gatsby-plugin-redirect',
    options: {
      redirects: [
        {
          fromPath: '/postgresql/setting-up-a-local-postgresql-database',
          toPath: 'https://www.prisma.io/docs/orm/more/help-and-troubleshooting/dataguide/setting-up-a-local-postgresql-database',
          isPermanent: false,
        },
        {
          fromPath: '/postgresql/introduction-to-data-types',
          toPath: 'https://www.prisma.io/docs/orm/more/help-and-troubleshooting/dataguide/introduction-to-data-types',
          isPermanent: false,
        },
        {
          fromPath: '/postgresql/date-type',
          toPath: 'https://www.prisma.io/docs/orm/more/help-and-troubleshooting/dataguide/date-types',
          isPermanent: false,
        },
        {
          fromPath: '/postgresql/connecting-to-postgresql-databases',
          toPath: 'https://www.prisma.io/docs/orm/more/help-and-troubleshooting/dataguide/connecting-to-postgresql-databases',
          isPermanent: false,
        },
        {
          fromPath: '/postgresql/short-guides/connection-uris',
          toPath: 'https://www.prisma.io/docs/orm/more/help-and-troubleshooting/dataguide/connection-uris',
          isPermanent: false,
        },
        {
          fromPath: "/intro/database-glossary",
          toPath: "https://www.prisma.io/docs/orm/more/help-and-troubleshooting/dataguide/database-glossary",
          isPermanent: false,
        }
        // Add more redirects as needed
      ],
    },
  },
  'gatsby-plugin-page-list',
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
  } else {
    console.warn('INDEX_ALGOLIA === true, but GATSBY_ALGOLIA_APP_ID is undefined.')
  }
} else {
  console.log('INDEX_ALGOLIA not `true`, not pushing algoliaPlugin to skip any search indexing.')
}

const config: GatsbyConfig = {
  pathPrefix: process.env.ADD_PREFIX === 'true' ? dataguideConfig.gatsby.pathPrefix : '/',
  // trailingSlash: 'never',
  siteMetadata: {
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
