import * as React from 'react'
import favicon from '../images/favicon-32x32.png'
import { useStaticQuery, graphql } from 'gatsby'
import { useLocation } from '@reach/router'

type SEOProps = {
  title?: string
  description?: string
  image?: string
}

// Build a well-formed absolute OG/Twitter image URL.
// Frontmatter `metaImage` is sometimes a content-relative path
// (e.g. ../dataguide-images/...); left raw it concatenates into malformed
// "dataguide.." URLs. Mirror the in-article <img> handling by stripping the
// relative `../` prefixes, then join cleanly to siteUrl + pathPrefix.
const buildMetaImageURL = (siteUrl: string, pathPrefix: string, img: string): string => {
  if (/^https?:\/\//.test(img)) return img
  const cleaned = img.replace(/\.\.\//g, '').replace(/^\/+/, '')
  return `${siteUrl}${pathPrefix}/${cleaned}`.replace(/([^:])\/{2,}/g, '$1/')
}

const SEO = ({ title, description, image }: SEOProps) => {
  const location = useLocation()
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
      <link rel="icon" href={favicon} />
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
