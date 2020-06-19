const config = {
  gatsby: {
    pathPrefix: '',
    siteUrl: 'https://howtodata.netlify.app/', // replace with correct site
  },
  redirects: [],
  header: {
    logoLink: '/', // replace with correct site
    title: 'How To Data',
    search: {
      indexName: process.env.GATSBY_ALGOLIA_INDEX_NAME,
      algoliaAppId: process.env.GATSBY_ALGOLIA_APP_ID,
      algoliaSearchKey: process.env.GATSBY_ALGOLIA_SEARCH_KEY,
      algoliaAdminKey: process.env.GATSBY_ALGOLIA_ADMIN_API_KEY,
    },
  },
  siteMetadata: {
    title: 'How To Data - title',
    description: 'How To Data - desc',
    keywords: 'Docs, How To Data, 1.0',
    docsLocation: 'https://github.com/prisma/how-to-data-docs/tree/master/content',
    twitter: {
      site: '@howtodata',
      creator: '@howtodata',
      image: '/social/docs-social.png',
    },
    og: {
      site_name: 'How To Data',
      type: 'website',
      image: {
        alt: 'How To Data',
        height: '630',
        type: 'image/png',
        url: '/social/docs-social.png', //replace social image
        width: '1200',
      },
    },
  },
  feedback: {
    function_name: 'https://howtodata.netlify.app/.netlify/functions/index', // Replace with correct one
  },
  sidebar: {
    tablet_menu_split: [], // Slugs for top level folders which should appear in right pane on tablet
  },
  footer: {
    newsletter: {
      text:
        'Pellentesque facilisi nisi, sem neque mauris, hendrerit. Ultrices et donec in tincidunt lectus interdum. Eu dui et, nec pulvinar.',
    },
  },
}

module.exports = config
