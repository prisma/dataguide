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
    visit(
      tree,
      ({ type }) => {
        return ['heading', 'paragraph', 'code', 'table'].includes(type)
      },
      (node) => {
        if (node.type === 'heading') return (heading = flattenNode(visit, node))

        file.data.push({
          heading,
          text: flattenNode(visit, node),
        })
      }
    )
  }
