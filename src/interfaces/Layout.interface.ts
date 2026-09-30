import type { SocialImage } from '../utils/socialMetadata'

export interface HeaderProps {
  logoLink: string
}

export interface FooterProps {
  newsletter: { text: string }
}

interface SiteMeta {
  siteMetadata: {
    header: HeaderProps
    title: string
    footer: FooterProps
  }
}

export interface LayoutQueryData {
  site: SiteMeta
}

export interface CreatePageContext {
  pageContext: {
    seoTitle: string
    seoDescription: string
    metaImage: string
    socialImage?: SocialImage
    publication?: {
      published: boolean
      indexed: boolean
      searchable: boolean
      navigable: boolean
      exported: boolean
    }
    verification?: {
      level: string
      scope: string
      versions?: string[]
      reviewDate?: string
      fixture?: string
      evidence?: string
    }
  }
}
