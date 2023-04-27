const path = require('path')

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
  const { createPage } = actions

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
      component: path.resolve('./src/templates/docs.tsx'),
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
        buble: '@philpl/buble', // to reduce bundle size
      },
    },
  })
}
