import siteConfig from './config'
import {
  loadCardThemes,
  loadCardPalette,
  writeSocialCard,
  pruneSocialCards,
} from './src/utils/socialCards'
import { getThemedTopic } from './src/utils/topicThemes'
import type { SocialImage } from './src/utils/socialMetadata'

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

  const root = process.cwd()
  const cardThemes = await loadCardThemes(root)
  const cardPalette = await loadCardPalette(root)
  const pagePath = (node: any) => node.fields.modSlug.replace(/\d{2,}-/g, '') || '/'
  const topicTitles = new Map<string, string>(
    posts.map((node: any) => [pagePath(node), node.frontmatter.title])
  )

  // Generate before HTML rendering, so sharing crawlers need neither JavaScript nor a live image service.
  const socialImages = new Map<string, SocialImage>()
  const socialOutput = path.join(root, 'public/social/generated')
  for (const node of posts) {
    const pathname = pagePath(node)
    const topic = pathname === '/' ? 'intro' : getThemedTopic(pathname)
    const theme = topic && cardThemes.get(topic)
    if (!theme) continue
    const topicTitle =
      pathname === '/' ? 'Databases, made approachable' : topicTitles.get(`/${topic}`)
    if (!topicTitle) throw new Error(`Missing social card topic title: ${topic}`)
    socialImages.set(
      node.id,
      await writeSocialCard(
        {
          root,
          theme,
          palette: cardPalette,
          title: pathname === '/' ? "Prisma's Data Guide" : node.frontmatter.title,
          topicTitle,
        },
        socialOutput
      )
    )
  }
  await pruneSocialCards(socialOutput, socialImages.values())
  reporter.info(`Social cards: generated ${socialImages.size} page previews`)

  // you'll call `createPage` for each result
  posts.forEach((node: any) => {
    createPage({
      path: pagePath(node),
      component: `${path.resolve('./src/templates/docs.tsx')}?__contentFilePath=${node.internal.contentFilePath}`,
      context: {
        id: node.fields.id,
        seoTitle: node.frontmatter.metaTitle || node.frontmatter.title,
        seoDescription: node.frontmatter.metaDescription || node.frontmatter.title,
        metaImage: node.frontmatter.metaImage || '',
        socialImage: socialImages.get(node.id),
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
