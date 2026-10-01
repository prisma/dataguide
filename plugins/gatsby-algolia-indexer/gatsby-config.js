const mdxToSearchable = require('./mdx-to-searchable')
const withDefaults = require('./options')
const publicationPolicy = require('../publication-policy.cjs')
const revision = require('../content-revision.cjs')
const { createHash } = require('node:crypto')
const { readFileSync } = require('node:fs')
const path = require('node:path')
const { REVISION_RECORD_ID } = require('./revision-record.cjs')

const sha256 = (value) => createHash('sha256').update(value).digest('hex')

// Records are rewritten only when they change. A record's digest covers its payload and this
// transformer's own source, so a publishing-code change still refreshes every record without
// re-indexing all of them on each deploy.
const transformerRevision = sha256(
  [
    'gatsby-config.js',
    'mdx-to-searchable.js',
    'remark-mdx-searchable.js',
    '../publication-policy.cjs',
  ]
    .map((file) => readFileSync(path.join(__dirname, file)))
    .join('\0')
)

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
      slug: rest.modSlug,
      apiReference: isApiTerm(item.text) ? getApiVal(item.text) : null,
      heading: item.heading ? removeInlineCode(item.heading) : null,
      content: item.text.replace(/\s+/g, ' ').trim(),
      dataguidePath: `${rest.modSlug.replace(/\d{2,}-/g, '')}${getTitlePath(item)}`,
    }
    // Algolia's incremental publisher compares only this digest. It covers the complete
    // transformed payload and the transformer's source, not the MDX node's digest (which
    // cannot detect publishing-code changes). The build's revisions live in one revision
    // record instead, so an unchanged article isn't rewritten on every deploy.
    record.internal = { contentDigest: sha256(JSON.stringify({ record, transformerRevision })) }
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
        // The one record that changes on every deploy: the revisions this index was built from,
        // which scripts/search-smoke.mjs checks. It has no searchable text.
        const { contentRevision, sourceRevision } = revision()
        const revisionRecord = {
          id: REVISION_RECORD_ID,
          recordType: 'revision',
          contentRevision,
          sourceRevision,
          transformerRevision,
        }
        revisionRecord.internal = { contentDigest: sha256(JSON.stringify(revisionRecord)) }
        records.push(revisionRecord)
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
          // A failed indexing run warns instead of failing the site's deploy. The revision record
          // isn't updated then, so the post-deploy search check reports the index as stale.
          continueOnFailure: true,
        },
      },
    ],
  }
}
