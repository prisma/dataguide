const searchable = require('./remark-mdx-searchable')

// remark and its plugins are ESM-only, so load them lazily
const getProcessor = async () => {
  const [
    { unified },
    { default: remarkParse },
    { default: remarkMdx },
    { default: remarkGfm },
    { visit },
  ] = await Promise.all([
    import('unified'),
    import('remark-parse'),
    import('remark-mdx'),
    import('remark-gfm'),
    import('unist-util-visit'),
  ])
  return unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkGfm)
    .use(searchable, { visit })
    .use(function () {
      this.Compiler = () => ''
    })
    .freeze()
}

let processor

module.exports = async (doc) => {
  processor = processor || (await getProcessor())
  const result = await processor.process(doc)
  return result.data
}
