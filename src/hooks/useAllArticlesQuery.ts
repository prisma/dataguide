import { graphql, useStaticQuery } from 'gatsby'
import { AllArticles } from '../interfaces/AllArticles.interface'

export const useAllArticlesQuery = () => {
  const { allMdx }: AllArticles = useStaticQuery(graphql`
    query {
      allMdx {
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
