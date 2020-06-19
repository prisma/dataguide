import { graphql, useStaticQuery } from 'gatsby'
import { LayoutQueryData } from '../interfaces/Layout.interface'

export const useLayoutQuery = () => {
  const { site }: LayoutQueryData = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
          footer {
            newsletter {
              text
            }
          }
          header {
            logoLink
            title
          }
        }
      }
    }
  `)

  return { site }
}
