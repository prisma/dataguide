const config = require('./config')
require('dotenv').config()

const gatsbyRemarkPlugins = [
  'gatsby-remark-sectionize',
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
    },
  },
  {
    resolve: `gatsby-remark-images`,
    options: {
      disableBgImageOnAlpha: true,
    },
  },
  {
    resolve: require.resolve('./plugins/gatsby-remark-to-absoluteurl'),
    options: {
      redirects: config.redirects,
    },
  },
  {
    resolve: require.resolve('./plugins/gatsby-remark-check-links-numberless'),
  },
]

module.exports = {
  pathPrefix: process.env.ADD_PREFIX === 'true' ? config.gatsby.pathPrefix : '/',
  siteMetadata: {
    pathPrefix: config.gatsby.pathPrefix,
    title: config.siteMetadata.title,
    description: config.siteMetadata.description,
    keywords: config.siteMetadata.keywords,
    twitter: config.siteMetadata.twitter,
    og: config.siteMetadata.og,
    header: config.header,
    siteUrl: config.gatsby.siteUrl,
    footer: config.footer,
    docsLocation: config.siteMetadata.docsLocation,
  },
  plugins: [
    'gatsby-plugin-react-helmet',
    'gatsby-transformer-sharp',
    'gatsby-plugin-sharp',
    'gatsby-plugin-typescript',
    'gatsby-image',
    'gatsby-plugin-styled-components',
    'gatsby-plugin-smoothscroll',
    'gatsby-plugin-catch-links',
    {
      resolve: `gatsby-plugin-sitemap`,
      options: {
        sitemapSize: 5000,
        excludes: [
          // Remove these from sitemap for SEO purposes
          `/dummy`,
          `/intro/example`,
        ],
        resolvePagePath: (page) => {
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
            allow: '/',
          },
        ],
      },
    },
    // 'gatsby-plugin-offline', // it causes infinite loop issue with workbox
    {
      resolve: `gatsby-plugin-mdx`,
      options: {
        decks: [],
        defaultLayouts: {
          default: require.resolve('./src/layouts/articleLayout.tsx'),
        },
        extensions: ['.mdx', '.md'],
        gatsbyRemarkPlugins,
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'docs',
        path: `${__dirname}/content`,
        ignore: ['**/.tsx*'],
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'images',
        path: `${__dirname}/src/images`,
      },
    },
    'gatsby-plugin-remove-trailing-slashes',
    'gatsby-plugin-page-list',
    {
      resolve: 'gatsby-plugin-google-tagmanager',
      options: {
        id: 'GTM-KCGZPWB',

        // Include GTM in development.
        //
        // Defaults to false meaning GTM will only be loaded in production.
        includeInDevelopment: false,

        // datalayer to be set before GTM is loaded
        // should be an object or a function that is executed in the browser
        //
        // Defaults to null
        defaultDataLayer: { website: 'dataguide' },
      },
    },
  ],
}
