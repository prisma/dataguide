const siteConfig = {
  gatsby: {
    pathPrefix: '/dataguide',
    siteUrl: 'https://www.prisma.io',
  },
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
      fromPath: '/intro/database-glossary',
      toPath: "https://www.prisma.io/docs/orm/more/help-and-troubleshooting/dataguide/database-glossary",
      isPermanent: false,
    }
  ],
  header: {
    logoLink: '/',
    title: "Prisma's Data Guide - Educational articles to make databases more approachable",
    search: {
      indexName: process.env.GATSBY_ALGOLIA_INDEX_NAME,
      algoliaAppId: process.env.GATSBY_ALGOLIA_APP_ID,
      algoliaSearchKey: process.env.GATSBY_ALGOLIA_SEARCH_KEY,
    },
  },
  siteMetadata: {
    title: "Prisma's Data Guide - Educational articles to make databases more approachable",
    description:
      'Learn how databases work, how to choose the right one, and how to use databases with your applications to their full potential.',
    keywords: "Prisma's Data Guide, prisma, database, mysql, postgres, postgresql, dataguide",
    docsLocation: 'https://github.com/prisma/dataguide/tree/master/content',
    twitter: {
      site: '@prisma',
      creator: '@prisma',
      image: '/social/docs-social.png',
    },
    og: {
      site_name: "Prisma's Data Guide",
      type: 'website',
      image: {
        alt: "Prisma's Data Guide",
        height: '630',
        type: 'image/png',
        url: '/social/docs-social.png', //replace social image
        width: '1200',
      },
    },
  },
  sidebar: {
    tablet_menu_split: ['04-datamodeling'], // Slugs for top level folders which should appear in right pane on tablet
  },
  footer: {
    newsletter: {
      text: "Sign up to get notified by email when new content is added to Prisma's Data Guide.",
    },
  },
}

export default siteConfig
