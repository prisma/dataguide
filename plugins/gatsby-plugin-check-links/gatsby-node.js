const path = require('path')

// Fails the build when a link into the Data Guide points at a page, file or anchor that
// does not exist. Links to redirected paths are reported, since they cost readers a hop.
exports.onPostBuild = async ({ graphql, reporter, pathPrefix }, { redirects = [] }) => {
  const { checkLinks, readSite } = await import('./check-links.mjs')
  const { checkArtifacts } = await import('./check-artifacts.mjs')
  const { data } = await graphql(`
    {
      site {
        siteMetadata {
          siteUrl
          pathPrefix
        }
      }
    }
  `)
  const { siteUrl, pathPrefix: canonicalPrefix } = data.site.siteMetadata
  const site = await readSite(path.resolve('public'))
  const { pages, files } = site
  const artifactErrors = checkArtifacts({
    ...site,
    pathPrefix: pathPrefix || '',
    siteRoot: `${siteUrl}${canonicalPrefix}`,
  })
  if (artifactErrors.length) {
    reporter.panicOnBuild(
      `Artifact check: ${artifactErrors.length} invalid references:\n${artifactErrors.map(({ from, href, kind, reason }) => `  ${from}: ${kind} ${href} (${reason})`).join('\n')}`
    )
    return
  }
  const { checked, broken, redirected } = checkLinks({
    pages,
    files,
    pathPrefix: pathPrefix || '',
    siteRoot: `${siteUrl}${canonicalPrefix}`,
    redirects,
  })

  const describe = ({ href, reason, pages }) =>
    `  ${href}${reason ? ` (${reason})` : ''}\n    on ${pages.slice(0, 3).join(', ')}${
      pages.length > 3 ? ` and ${pages.length - 3} more` : ''
    }`
  if (redirected.length) {
    reporter.warn(
      `Link check: links to paths that redirect elsewhere:\n${redirected
        .map(({ href, pages }) => `  ${href} (linked from ${pages.length} pages)`)
        .join('\n')}`
    )
  }
  if (broken.length) {
    reporter.panicOnBuild(
      `Link check: ${broken.length} broken internal links:\n${broken.map(describe).join('\n')}`
    )
    return
  }
  reporter.info(`Link check: ${checked} internal links on ${pages.size} pages resolve`)
}
