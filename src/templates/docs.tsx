import { RouterProps } from '@reach/router'
import * as React from 'react'
import { ArticleQueryData } from '../interfaces/Article.interface'
import Layout from '../components/layout'
import TopSection from '../components/topSection'
import PageBottom from '../components/pageBottom'
import SEO from '../components/seo'
import { graphql, useStaticQuery } from 'gatsby'
import MDXRenderer from 'gatsby-plugin-mdx/mdx-renderer'
import { navigate } from '@reach/router'
import { CreatePageContext } from '../interfaces/Layout.interface'
import SocialShareSection from '../components/socialShareSection'
import NextPrevious from '../components/nextPrevious'
import AuthorDetails from '../components/authorDetails'

type ArticleLayoutProps = ArticleQueryData & RouterProps & CreatePageContext

const ArticleLayout = ({ data, ...props }: ArticleLayoutProps) => {
  if (!data) {
    return null
  }
  const {
    mdx: {
      fields: { slug, modSlug },
      frontmatter: { title, toc, hnPostId, authors },
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
      {!isHomePage && (
        <section className="top-section">
          <TopSection
            title={title}
            slug={modSlug}
            toc={toc || toc == null ? tableOfContents : []}
          />
          <SocialShareSection hnPostId={hnPostId} slug={modSlug} />
        </section>
      )}
      <MDXRenderer>{body}</MDXRenderer>
      {authors && (
        <section>
          <AuthorDetails authors={authors} />
        </section>
      )}
      {!slug.includes('index') && <NextPrevious slug={modSlug} />}
      <PageBottom editDocsPath={`${docsLocation}/${parent.relativePath}`} pageUrl={slug} />
    </Layout>
  )
}

export default ArticleLayout

export const Head = ({
  pageContext: { seoTitle, seoDescription, metaImage },
}: ArticleLayoutProps) => {
  return <SEO title={seoTitle} description={seoDescription} image={metaImage || undefined} />
}

export const query = graphql`
  query ($id: String!) {
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
        authors
      }
    }
  }
`
