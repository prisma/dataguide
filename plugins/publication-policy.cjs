// hidePage is navigation-only. Other publication decisions are explicit.
module.exports = (frontmatter = {}) => {
  const published = frontmatter.publish !== false && frontmatter.skipBuild !== true
  return {
    published,
    indexed: published && frontmatter.index !== false,
    searchable: published && frontmatter.search !== false && frontmatter.index !== false,
    navigable: published && frontmatter.hidePage !== true,
    exported: published && frontmatter.export !== false,
  }
}
