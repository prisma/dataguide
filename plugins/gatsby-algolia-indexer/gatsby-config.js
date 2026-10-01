const mdxToSearchable = require('./mdx-to-searchable')
const withDefaults = require('./options')
const publicationPolicy = require('../publication-policy.cjs')
const revision = require('../content-revision.cjs')

const settings = {
  searchableAttributes: ['apiReference', 'title', 'heading', 'content'],
  attributesToHighlight: ['title', 'heading', 'content'],
  attributesToSnippet: ['title:20', 'heading:20', 'content:25'],
  hitsPerPage: 20,
  attributeForDistinct: 'slug',
  distinct: 2,
  // Use textual relevance; alphabetic content is not a relevance signal.
  customRanking: [],
  ignorePlurals: true,
  separatorsToIndex: '!#()[]{}*+-_一,:;<>?@/^|%&~£¥$§€†‡',
}

// Util functions

const flat = (array) => {
  var result = []
  array.forEach(function (a) {
    result.push(a)
    if (Array.isArray(a.items)) {
      result = result.concat(flat(a.items))
    }
  })
  return result
}

const removeInlineCode = (heading, path) =>
  path
    ? heading.replace(/inlinecode/g, '')
    : heading.replace('<inlinecode>', '').replace('</inlinecode>', '')

const isApiTerm = (term) => term.includes('AlgoliaTerm') && term.split('"')[1] === 'apiReference'

const getApiVal = (term) => term.split('"')[3]

const unnestFrontmatter = (node) => {
  const { fields, frontmatter, ...rest } = node

  return {
    ...fields,
    ...frontmatter,
    ...rest,
  }
}

// Transform function

const handleBody = async (node) => {
  const { body, ...rest } = node

  const getTitlePath = (item) => {
    const tocItem =
      rest.tableOfContents &&
      rest.tableOfContents.items &&
      item.heading &&
      flat(rest.tableOfContents.items).find(
        (t) => t.title && removeInlineCode(t.title) === item.heading.replace(/`/g, '')
      )
    return tocItem && tocItem.url ? removeInlineCode(tocItem.url, true) : ''
  }

  // `body` is the raw MDX source without frontmatter
  const data = await mdxToSearchable(body)

  const records = data.map((item, index) => {
    const record = {
      id: rest.id + index,
      title: rest.title,
      contentRevision: revision().contentRevision,
      sourceRevision: revision().sourceRevision,
      slug: rest.modSlug,
      apiReference: isApiTerm(item.text) ? getApiVal(item.text) : null,
      heading: item.heading ? removeInlineCode(item.heading) : null,
      content: item.text.replace(/\s+/g, ' ').trim(),
      dataguidePath: `${rest.modSlug.replace(/\d{2,}-/g, '')}${getTitlePath(item)}`,
      internal: {
        contentDigest: rest.internal.contentDigest,
      },
    }
    return record
  })

  return records
}

module.exports = (options) => {
  const { appId, adminKey, indexName } = withDefaults(options)
  if (!appId || !adminKey || !indexName)
    throw new Error('Search publication requires appId, adminKey and indexName')
  const queries = [
    {
      query: `{
        allMdx{
          edges {
            node {
              id
              body
              fields {
                slug
                modSlug
              }
              internal {
                contentDigest
              }
              frontmatter {
                title
                search
                publish
                skipBuild
                hidePage
                index
                export
              }
              tableOfContents
            }
          }
        }
      }`,
      indexName,
      settings,
      transformer: async ({ data }) => {
        const noSearchFlag = Array.from(data.allMdx.edges).filter(
          (e) => publicationPolicy(e.node.frontmatter).searchable
        )
        const records = []
        for (const node of noSearchFlag.map((edge) => edge.node).map(unnestFrontmatter)) {
          records.push(...(await handleBody(node)))
        }
        return records
      },
    },
  ]
  return {
    plugins: [
      {
        resolve: `gatsby-plugin-algolia`,
        options: {
          appId,
          apiKey: adminKey,
          queries,
          continueOnFailure: false,
        },
      },
    ],
  }
}
