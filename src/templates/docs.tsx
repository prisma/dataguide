import { RouterProps } from '@reach/router'
import * as React from 'react'
import { ArticleQueryData } from '../interfaces/Article.interface'
import Layout from '../components/layout'
import TopSection from '../components/topSection'
import PageBottom from '../components/pageBottom'
import SEO from '../components/seo'
import { graphql } from 'gatsby'
import { CreatePageContext } from '../interfaces/Layout.interface'
import SocialShareSection from '../components/socialShareSection'
import NextPrevious from '../components/nextPrevious'
import AuthorDetails from '../components/authorDetails'
import EndCta from '../components/cta/EndCta'
import MobileStickyCta from '../components/cta/MobileStickyCta'

type ArticleLayoutProps = ArticleQueryData &
  RouterProps &
  CreatePageContext & { children?: React.ReactNode }

const ArticleLayout = ({ data, children, ...props }: ArticleLayoutProps) => {
  if (!data) {
    return null
  }
  const {
    mdx: {
      fields: { slug, modSlug },
      frontmatter: { title, toc, hnPostId, authors },
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
      {children}
      {!isHomePage && <EndCta slug={modSlug} />}
      {authors && (
        <section>
          <AuthorDetails authors={authors} />
        </section>
      )}
      {!slug.includes('index') && <NextPrevious slug={modSlug} />}
      <PageBottom editDocsPath={`${docsLocation}/${parent.relativePath}`} pageUrl={slug} />
      {!isHomePage && <MobileStickyCta slug={modSlug} />}
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
