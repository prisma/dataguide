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
  }
}
