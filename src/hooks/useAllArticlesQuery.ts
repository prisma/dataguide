import { graphql, useStaticQuery } from 'gatsby'
import { AllArticles } from '../interfaces/AllArticles.interface'

export const useAllArticlesQuery = () => {
  const { allMdx }: AllArticles = useStaticQuery(graphql`
    query {
      # Sort by the numbered file path, so previous/next links follow the sidebar order
      allMdx(filter: { fields: { navigable: { eq: true } } }, sort: { fields: { slug: ASC } }) {
        edges {
          node {
            frontmatter {
              title
              duration
              staticLink
              experimental
              hidePage
            }
            fields {
              slug
              modSlug
            }
          }
        }
      }
    }
  `)

  return { allMdx }
}
