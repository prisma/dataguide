import * as React from 'react'
import { ArticleQueryData } from '../interfaces/Article.interface'
import Layout from '../components/layout'
import TopSection from '../components/topSection'
import FloatingToc from '../components/floatingToc'
import PageBottom from '../components/pageBottom'
import SEO from '../components/seo'
import { graphql, PageProps } from 'gatsby'
import { CreatePageContext } from '../interfaces/Layout.interface'
import SocialShareSection from '../components/socialShareSection'
import NextPrevious from '../components/nextPrevious'
import AuthorDetails from '../components/authorDetails'
import EndCta from '../components/cta/EndCta'
import MobileStickyCta from '../components/cta/MobileStickyCta'
import { isIndexSlug } from '../utils/navigation'
import { urlGenerator } from '../utils/urlGenerator'
import { getParentTitle } from '../utils/parentTitle'
import { useAllArticlesQuery } from '../hooks/useAllArticlesQuery'
import authorsJSON from '../../authors.json'
import dataguideConfig from '../../config'
import { getThemedTopic } from '../utils/topicThemes'

type ArticleLayoutProps = ArticleQueryData &
  Pick<PageProps, 'location'> &
  CreatePageContext & { children?: React.ReactNode }

const ArticleLayout = ({ data, children, ...props }: ArticleLayoutProps) => {
  if (!data) {
    return null
  }
  const {
    mdx: {
      fields: { slug, modSlug },
      frontmatter: { title, toc, hnPostId, authors, lastUpdated, lastUpdatedLabel },
      parent,
      tableOfContents,
    },
    site: {
      siteMetadata: { docsLocation },
    },
  } = data

  const isHomePage = slug === '/'
  const themedTopic = getThemedTopic(urlGenerator(modSlug))
  const tocItems = toc || toc == null ? tableOfContents?.items : undefined

  return (
    <Layout
      isHomePage={isHomePage}
      slug={slug}
      aside={tocItems && <FloatingToc items={tocItems} />}
      {...props}
    >
      {!isHomePage && (
        <section className="top-section" data-topic={themedTopic}>
          <TopSection
            title={title}
            slug={modSlug}
            toc={toc || toc == null ? tableOfContents : []}
          />
          <SocialShareSection
            hnPostId={hnPostId}
            slug={modSlug}
            lastUpdated={lastUpdated}
            lastUpdatedLabel={lastUpdatedLabel}
          />
        </section>
      )}
      {children}
      {!isHomePage && <EndCta slug={modSlug} />}
      {authors && (
        <section>
          <AuthorDetails authors={authors} />
        </section>
      )}
      {!isIndexSlug(slug) && <NextPrevious slug={modSlug} />}
      <PageBottom editDocsPath={`${docsLocation}/${parent.relativePath}`} pageUrl={slug} />
      {!isHomePage && <MobileStickyCta slug={modSlug} />}
    </Layout>
  )
}

export default ArticleLayout

export const Head = ({
  data,
  location,
  pageContext: { seoTitle, seoDescription, metaImage, socialImage },
}: ArticleLayoutProps) => {
  const { allMdx } = useAllArticlesQuery()
  const {
    fields: { slug, modSlug },
    frontmatter: { title, authors, lastUpdated, hidePage },
  } = data.mdx
  // Hidden and moved pages have no Markdown version
  const hasMarkdown =
    !hidePage &&
    !dataguideConfig.redirects.some((redirect) => redirect.fromPath === urlGenerator(modSlug))
  const article =
    slug === '/'
      ? undefined
      : {
          type: isIndexSlug(slug) ? ('CollectionPage' as const) : ('TechArticle' as const),
          headline: title,
          authors: (authors || [])
            .map((id) => (authorsJSON as Record<string, { name: string }>)[id]?.name)
            .filter(Boolean),
          dateModified: lastUpdated || undefined,
          breadcrumbs: getParentTitle(modSlug, allMdx).map((part: any) => ({
            name: part.title,
            path: part.link,
          })),
        }
  return (
    <SEO
      location={location}
      title={seoTitle}
      description={seoDescription}
      image={metaImage || undefined}
      socialImage={socialImage}
      hasMarkdown={hasMarkdown}
      article={article}
    />
  )
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
        hidePage
        lastUpdated
        lastUpdatedLabel: lastUpdated(formatString: "MMMM D, YYYY")
      }
    }
  }
`
