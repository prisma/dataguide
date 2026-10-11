export function createUrlResolver(context: {
  siteRoot: string
  pagePath: string
  isIndex: boolean
}): (url: string) => string
