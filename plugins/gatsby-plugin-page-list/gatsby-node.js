const path = require('path')
const fsPromises = require('fs').promises

const publicPath = `./public`

const excludedPaths = []

exports.onPostBuild = async ({ graphql, pathPrefix, basePath = pathPrefix }, pluginOptions) => {
  const outputFile = path.join(publicPath, '/pages.json')

  const query = `
    {
      site {
        siteMetadata {
          siteUrl
          pathPrefix
        }
      }
      allSitePage {
        edges {
          node {
            path
            pageContext
          }
        }
      }  
  }`
  const { data } = await graphql(query)

  // Construct the pages json by iterating over the mdx files.
  const pages = data.allSitePage.edges
    .map((edge, i) => {
      // Skip the 404 pages and pages without seoTitle
      if (!edge.node.pageContext || !edge.node.pageContext.seoTitle) return null
      if (edge.node.pageContext.publication?.navigable === false) return null
      // Skip explicitly excluded paths
      if (excludedPaths.includes(edge.node.path)) return null

      return {
        title: edge.node.pageContext.seoTitle,
        url: new URL(
          path.join(data.site.siteMetadata.pathPrefix, edge.node.path),
          data.site.siteMetadata.siteUrl
        ).href,
      }
    })
    .filter((edge) => edge !== null)
  await fsPromises.writeFile(outputFile, JSON.stringify(pages))
}
