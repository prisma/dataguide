import * as React from 'react'
import favicon from '../images/favicon-32x32.png'
import faviconSvg from '../images/favicon.svg'
import { useStaticQuery, graphql } from 'gatsby'
import { PageLocation } from '../hooks/useLocation'
import {
  articleStructuredData,
  serializeJsonLd,
  websiteStructuredData,
} from '../utils/structuredData'

type SEOProps = {
  location: PageLocation
  title?: string
  description?: string
  image?: string
  // Whether a Markdown version of the page is published (see gatsby-plugin-markdown-export)
  hasMarkdown?: boolean
  // Structured data: the site for the homepage, an article for everything else
  article?: {
    type?: 'TechArticle' | 'CollectionPage'
    headline: string
    authors: string[]
    dateModified?: string
    // Parent sections, as paths within the Data Guide
    breadcrumbs: { name: string; path: string }[]
  }
}

// Build a well-formed absolute OG/Twitter image URL.
// Frontmatter `metaImage` is sometimes a content-relative path
// (e.g. ../dataguide-images/...); left raw it concatenates into malformed
// "dataguide.." URLs. Normalize by dropping relative path segments ('.', '..')
// entirely — splitting on '/' avoids the reconstruction pitfall of a single
// regex replace — then join cleanly to siteUrl + pathPrefix.
const buildMetaImageURL = (siteUrl: string, pathPrefix: string, img: string): string => {
  if (/^https?:\/\//.test(img)) return img
  const cleaned = img
    .split('/')
    .filter((segment) => segment !== '' && segment !== '.' && segment !== '..')
    .join('/')
  return `${siteUrl}${pathPrefix}/${cleaned}`
}

const SEO = ({ location, title, description, image, hasMarkdown, article }: SEOProps) => {
  const { site } = useStaticQuery(query)
  const {
    siteMetadata: {
      pathPrefix,
      siteUrl,
      keywords,
      twitter: { site: tSite, creator: tCreator, image: tUrl },
      og: {
        site_name: oSite,
        type: oType,
        image: { alt: oImgAlt, url: oUrl, type: oImgType, width: oImgWidth, height: oImgHeight },
      },
    },
  } = site

  const metaImageURL = buildMetaImageURL(siteUrl, pathPrefix, image || oUrl)

  let canonicalUrl = `${siteUrl}${location.pathname === '/' ? '' : location.pathname}`.replace(
    /\/$/,
    ''
  )

  const siteRoot = `${siteUrl}${pathPrefix}`
  const markdownUrl = canonicalUrl === siteRoot ? `${siteRoot}/index.md` : `${canonicalUrl}.md`
  const structuredData = article
    ? articleStructuredData({
        type: article.type,
        url: canonicalUrl,
        title: article.headline,
        description,
        image: metaImageURL,
        authors: article.authors,
        dateModified: article.dateModified,
        breadcrumbs: [
          { name: oSite, url: siteRoot },
          ...article.breadcrumbs.map((crumb) => ({
            name: crumb.name,
            url: `${siteRoot}${crumb.path}`,
          })),
        ],
      })
    : websiteStructuredData(oSite, siteRoot, description)

  return (
    <>
      {/* <meta charSet="utf-8" /> */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={tSite} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:creator" content={tCreator} />
      <meta name="twitter:image" content={metaImageURL} />
      {/* Open Graph */}
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={oSite} />
      <meta property="og:type" content={oType} />
      <meta property="og:image" content={metaImageURL} />
      <meta property="og:image:alt" content={oImgAlt} />
      <meta property="og:image:type" content={oImgType} />
      <meta property="og:image:width" content={oImgWidth} />
      <meta property="og:image:height" content={oImgHeight} />
      <link rel="canonical" href={canonicalUrl} />
      {hasMarkdown && <link rel="alternate" type="text/markdown" href={markdownUrl} />}
      <link rel="icon" href={faviconSvg} type="image/svg+xml" />
      <link rel="icon" href={favicon} type="image/png" sizes="32x32" />
      <meta name="theme-color" content="#f9faf5" />
      {article?.dateModified && (
        <meta property="article:modified_time" content={article.dateModified} />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />
    </>
  )
}

export default SEO

const query = graphql`
  query SEO {
    site {
      siteMetadata {
        pathPrefix
        siteUrl
        twitter {
          site
          creator
          image
        }
        og {
          site_name
          type
          image {
            url
            alt
            type
            height
            width
          }
        }
      }
    }
  }
`
