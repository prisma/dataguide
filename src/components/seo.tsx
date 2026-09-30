import * as React from 'react'
import favicon from '../images/favicon-32x32.png'
import faviconSvg from '../images/favicon.svg'
import { useStaticQuery, graphql } from 'gatsby'
import { PageLocation } from '../hooks/useLocation'
import { buildMetaImageURL, canonicalPageURL } from '../utils/socialMetadata'
import type { SocialImage } from '../utils/socialMetadata'
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
  socialImage?: SocialImage
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

const SEO = ({
  location,
  title,
  description,
  image,
  socialImage,
  hasMarkdown,
  article,
}: SEOProps) => {
  const { site } = useStaticQuery(query)
  const {
    siteMetadata: {
      pathPrefix,
      siteUrl,
      keywords,
      twitter: { site: tSite, creator: tCreator },
      og: {
        site_name: oSite,
        type: oType,
        image: { alt: oImgAlt, url: oUrl, type: oImgType, width: oImgWidth, height: oImgHeight },
      },
    },
  } = site

  const metaImageURL = buildMetaImageURL(siteUrl, pathPrefix, socialImage?.url || image || oUrl)
  const imageAlt = socialImage?.alt || (image ? title : oImgAlt)
  const imageType = socialImage?.type || (image ? undefined : oImgType)
  const imageWidth = socialImage?.width || (image ? undefined : oImgWidth)
  const imageHeight = socialImage?.height || (image ? undefined : oImgHeight)

  const canonicalUrl = canonicalPageURL(siteUrl, pathPrefix, location.pathname)

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
      <meta name="twitter:image:alt" content={imageAlt} />
      {/* Open Graph */}
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={oSite} />
      <meta property="og:type" content={article?.type === 'TechArticle' ? 'article' : oType} />
      <meta property="og:image" content={metaImageURL} />
      {metaImageURL.startsWith('https://') && (
        <meta property="og:image:secure_url" content={metaImageURL} />
      )}
      <meta property="og:image:alt" content={imageAlt} />
      {imageType && <meta property="og:image:type" content={imageType} />}
      {imageWidth && <meta property="og:image:width" content={String(imageWidth)} />}
      {imageHeight && <meta property="og:image:height" content={String(imageHeight)} />}
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
