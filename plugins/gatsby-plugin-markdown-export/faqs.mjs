import { mdxParser, mdxToMarkdown } from './mdx-to-markdown.mjs'

// Text for schema.org Answer.text. Keep block boundaries, code and link destinations.
const readableText = (node) => {
  if (['text', 'inlineCode', 'code'].includes(node.type)) return node.value
  if (node.type === 'image') return node.alt || ''
  if (node.type === 'break') return '\n'
  const content = (node.children || []).map(readableText)
  if (node.type === 'link') return `${content.join('')} (${node.url})`
  return content.join(
    ['root', 'list', 'listItem', 'blockquote', 'table', 'tableRow'].includes(node.type)
      ? '\n\n'
      : ''
  )
}

export const faqAnswerText = (markdown) => readableText(mdxParser().parse(markdown)).trim()

// Only explicit FAQ sections qualify: ordinary expandable setup examples are not FAQs.
// Use the same MDX parser and converter as the article export; never evaluate JSX.
export const extractFaqs = (source, context) => {
  const parser = mdxParser()
  const nodes = parser.parse(source).children
  const faqs = []
  const add = (questionNode, answerSource) => {
    const question = readableText(questionNode).trim()
    const answer = mdxToMarkdown(answerSource, context).trim()
    const text = faqAnswerText(answer)
    if (!question || !text) throw new Error('FAQ questions and answers must not be empty')
    faqs.push({ question, answer, text })
  }
  const findSummary = (node) =>
    node.name === 'summary' ? node : (node.children || []).map(findSummary).find(Boolean)
  const details = (node) => {
    if (node.name === 'details') {
      const summary = findSummary(node)
      if (!summary) throw new Error('FAQ details must have a summary')
      const closing = source.lastIndexOf('</details', node.position.end.offset)
      add(summary, source.slice(summary.position.end.offset, closing))
      return
    }
    node.children?.forEach(details)
  }
  let faqDepth = null
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (
      node.type === 'heading' &&
      /^(faq|frequently asked questions)$/i.test(readableText(node).trim())
    ) {
      faqDepth = node.depth
      continue
    }
    if (node.type === 'heading' && faqDepth !== null && node.depth <= faqDepth) faqDepth = null
    if (faqDepth === null) continue
    if (node.type === 'heading' && node.depth === faqDepth + 1) {
      let end = i + 1
      while (
        end < nodes.length &&
        !(nodes[end].type === 'heading' && nodes[end].depth <= node.depth)
      )
        end++
      add(
        node,
        nodes
          .slice(i + 1, end)
          .map((child) => source.slice(child.position.start.offset, child.position.end.offset))
          .join('\n\n')
      )
      i = end - 1
    } else details(node)
  }
  return faqs
}
