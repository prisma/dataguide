const config = {
  gatsby: {
    pathPrefix: '',
    siteUrl: 'https://dataguide.prisma.com', // replace with correct site
  },
  redirects: [],
  header: {
    logoLink: '/', // replace with correct site
    title: "Prisma's Data Guide",
    search: {
      indexName: process.env.GATSBY_ALGOLIA_INDEX_NAME,
      algoliaAppId: process.env.GATSBY_ALGOLIA_APP_ID,
      algoliaSearchKey: process.env.GATSBY_ALGOLIA_SEARCH_KEY,
      algoliaAdminKey: process.env.GATSBY_ALGOLIA_ADMIN_API_KEY,
    },
  },
  siteMetadata: {
    title: "Prisma's Data Guide",
    description: "Prisma's Data Guide",
    keywords: "Prisma's Data Guide, dataguide, howtodata",
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
  feedback: {
    function_name: 'https://dataguide.netlify.app/.netlify/functions/index', // Replace with correct one
  },
  sidebar: {
    tablet_menu_split: [], // Slugs for top level folders which should appear in right pane on tablet
  },
  footer: {
    newsletter: {
      text:
        "Sign up to get notified by email when new content is added to Prisma's Data Guide.",
    },
  },
}

module.exports = config
