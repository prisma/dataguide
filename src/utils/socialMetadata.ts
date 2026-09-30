export interface SocialImage {
  url: string
  alt: string
  width: number
  height: number
  type: string
}

const normalizePrefix = (prefix: string) => `/${prefix.split('/').filter(Boolean).join('/')}`

export const canonicalPageURL = (siteUrl: string, prefix: string, pathname: string) => {
  const base = normalizePrefix(prefix).replace(/\/$/, '')
  const page = `/${pathname.split('/').filter(Boolean).join('/')}`
  const path = page === base || page.startsWith(`${base}/`) ? page : `${base}${page}`
  return `${siteUrl.replace(/\/$/, '')}${path}`.replace(/\/$/, '')
}

export const buildMetaImageURL = (siteUrl: string, prefix: string, image: string) => {
  if (/^https?:\/\//.test(image)) return image
  const cleaned = image
    .split('/')
    .filter((segment) => segment !== '' && segment !== '.' && segment !== '..')
    .join('/')
  return canonicalPageURL(siteUrl, prefix, `/${cleaned}`)
}
