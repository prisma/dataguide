const searchable = require('./remark-mdx-searchable')

// remark and its plugins are ESM-only, so load them lazily
const getProcessor = async () => {
  const [{ remark }, { default: remarkMdx }, { default: remarkGfm }, { visit }] = await Promise.all(
    [import('remark'), import('remark-mdx'), import('remark-gfm'), import('unist-util-visit')]
  )
  return remark().use(remarkMdx).use(remarkGfm).use(searchable, { visit }).freeze()
}

let processor

module.exports = async (doc) => {
  processor = processor || (await getProcessor())
  const result = await processor.process(doc)
  return result.data
}
