// schema.org structured data for articles (https://developers.google.com/search/docs/appearance/structured-data/article)

export interface Breadcrumb {
  name: string
  url: string
}

export interface ArticleData {
  // Section hubs list articles rather than being one
  type?: 'TechArticle' | 'CollectionPage'
  url: string
  title: string
  description?: string
  image?: string
  authors: string[]
  dateModified?: string
  breadcrumbs: Breadcrumb[]
}

const publisher = {
  '@type': 'Organization',
  name: 'Prisma',
  url: 'https://www.prisma.io',
}

export const articleStructuredData = (article: ArticleData) => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': article.type ?? 'TechArticle',
      headline: article.title,
      ...(article.description && { description: article.description }),
      ...(article.image && { image: article.image }),
      url: article.url,
      mainEntityOfPage: article.url,
      ...(article.authors.length > 0 && {
        author: article.authors.map((name) => ({ '@type': 'Person', name })),
      }),
      ...(article.dateModified && { dateModified: article.dateModified }),
      publisher,
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [...article.breadcrumbs, { name: article.title, url: article.url }].map(
        (crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: crumb.url,
        })
      ),
    },
  ],
})

export const websiteStructuredData = (name: string, url: string, description?: string) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name,
  url,
  ...(description && { description }),
  publisher,
})

// JSON for a <script> tag: `<` is escaped, so content can't close the tag
export const serializeJsonLd = (data: object) => JSON.stringify(data).replace(/</g, '\\u003c')
