import { RouterProps } from '@reach/router'
import * as React from 'react'
import { ArticleQueryData, CreateArticleContext } from '../interfaces/Article.interface'
import TopSection from '../components/topSection'
// import PageBottom from '../components/pageBottom'
import SEO from '../components/seo'
import { graphql } from 'gatsby'
import MDXRenderer from 'gatsby-plugin-mdx/mdx-renderer'
import Layout from '../components/layout'
import PageBottom from '../components/pageBottom'
import SocialShareSection from '../components/socialShareSection'
import NextPrevious from '../components/nextPrevious'

type ArticleLayoutProps = ArticleQueryData & RouterProps & CreateArticleContext

const ArticleLayout = ({ data, pageContext: { seoTitle, seoDescription }, ...props }: ArticleLayoutProps) => {
  if (!data) {
    return null
  }
  const {
    mdx: {
      fields: { slug, modSlug },
      frontmatter: { title, metaImage, toc, hnPostId },
      body,
      parent,
      tableOfContents,
    },
    site: {
      siteMetadata: { docsLocation },
    },
  } = data

  const isHomePage = slug === '/'

  return (
    <Layout isHomePage={isHomePage} slug={slug} {...props}>
      <SEO
        title={seoTitle}
        description={seoDescription}
        image={metaImage || undefined}
      />
      {!isHomePage && (
        <section className="top-section">
          <TopSection
            title={title}
            slug={modSlug}
            toc={toc || toc == null ? tableOfContents : []}
          />
          <SocialShareSection hnPostId={hnPostId} slug={modSlug}/>
        </section>
      )}

      <MDXRenderer>{body}</MDXRenderer>
      {!slug.includes('index') && <NextPrevious slug={modSlug}/>}
      <PageBottom editDocsPath={`${docsLocation}/${parent.relativePath}`} pageUrl={slug} />
    </Layout>
  )
}

export default ArticleLayout

export const query = graphql`
  query($id: String!) {
    site {
      siteMetadata {
        docsLocation
      }
    }
    mdx(fields: { id: { eq: $id } }) {
      fields {
        slug
        modSlug
      }
      body
      parent {
        ... on File {
          relativePath
        }
      }
      tableOfContents
      frontmatter {
        title
        metaTitle
        metaImage
        metaDescription
        toc
        hnPostId
      }
    }
  }
`
