const textTypes = ['text', 'emphasis', 'strong', 'inlineCode', 'code']

const flattenNode = (visit, node) => {
  const p = []
  visit(node, (node) => {
    if (!textTypes.includes(node.type)) return
    p.push(node.value)
  })
  return p.join(``)
}

module.exports =
  ({ visit }) =>
  (tree, file) => {
    file.data = []
    let heading = null
    visit(tree, (node) => {
      if (['PrismaOutlinks', 'PostgresCallout'].includes(node.name)) return 'skip'
      if (!['heading', 'paragraph', 'code', 'table'].includes(node.type)) return
      if (node.type === 'heading') return (heading = flattenNode(visit, node))
      if (
        node.type === 'code' &&
        (node.lang === 'text' || /(?:^|\s)(?:output|pseudocode)(?:\s|$)/.test(node.meta || ''))
      )
        return

      file.data.push({
        heading,
        text: flattenNode(visit, node),
      })
    })
  }
