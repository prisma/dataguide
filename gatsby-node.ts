import siteConfig from './config'

const path = require('path')

// Some articles use a relative path to an image file as `metaImage`. Without an
// explicit type, Gatsby may infer the field as `File` (depending on which article
// it looks at first) and break the queries that expect a string.
exports.createSchemaCustomization = ({ actions }: any) => {
  actions.createTypes(`
    type Mdx implements Node {
      frontmatter: MdxFrontmatter
    }
    type MdxFrontmatter {
      metaImage: String
      # Set when an article's content changes substantively (YYYY-MM-DD), never automatically
      lastUpdated: Date @dateformat
    }
  `)
}

exports.onCreateNode = ({ node, getNode, actions }: any) => {
  const { createNodeField } = actions
  if (node.internal.type === `Mdx`) {
    const parent = getNode(node.parent)
    let value = parent.relativePath.replace(parent.ext, '')
    if (value === 'index') {
      value = ''
    }

    createNodeField({
      node,
      name: `slug`,
      value: `/${value}`,
    })
    createNodeField({
      node,
      name: 'id',
      value: node.id,
    })
    createNodeField({
      node,
      name: 'modSlug',
      value: `/${value.replace('/index', '')}`,
    })
  }
}

exports.createPages = async ({ graphql, actions, reporter }: any) => {
  const { createPage, createRedirect } = actions

  const redirects = siteConfig.redirects

  redirects.forEach((redirect) => {
    createRedirect(redirect)
  })
  const result = await graphql(`
    query {
      allMdx {
        nodes {
          id
          fields {
            slug
            id
            modSlug
          }
          frontmatter {
            title
            metaTitle
            metaImage
            metaDescription
            skipBuild
          }
          internal {
            contentFilePath
          }
        }
      }
    }
  `)

  if (result.errors) {
    reporter.panicOnBuild('Error loading MDX result', result.errors)
  }

  // Create blog post pages.
  const posts = result.data.allMdx.nodes

  // you'll call `createPage` for each result
  posts.forEach((node: any) => {
    createPage({
      path: node.fields.modSlug ? node.fields.modSlug.replace(/\d{2,}-/g, '') : '/',
      component: `${path.resolve('./src/templates/docs.tsx')}?__contentFilePath=${node.internal.contentFilePath}`,
      context: {
        id: node.fields.id,
        seoTitle: node.frontmatter.metaTitle || node.frontmatter.title,
        seoDescription: node.frontmatter.metaDescription || node.frontmatter.title,
        metaImage: node.frontmatter.metaImage || '',
      },
    })
  })
}

exports.onCreateWebpackConfig = ({ actions }: any) => {
  actions.setWebpackConfig({
    resolve: {
      modules: [path.resolve(__dirname, 'src'), 'node_modules'],
      alias: {
        $components: path.resolve(__dirname, 'src/components'),
      },
    },
  })
}
