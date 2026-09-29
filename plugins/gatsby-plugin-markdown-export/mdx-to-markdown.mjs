// Converts a Data Guide MDX article to plain Markdown for developers and coding agents:
// custom components become Markdown equivalents, promotional panels are dropped, and
// links and images point at absolute URLs.
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMdx from 'remark-mdx'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'

// Product panels: useful on the site, clutter in a plain-text copy of the article
const DROPPED = new Set(['PrismaOutlinks', 'PostgresCallout'])

const text = (value) => ({ type: 'text', value })
const paragraph = (children) => ({ type: 'paragraph', children })
const link = (url, children) => ({ type: 'link', url, children })

const isJsx = (node) => node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement'

// The value of a JSX attribute: strings, `{'string'}` expressions and boolean flags
const attribute = (node, name) => {
  const attr = node.attributes?.find((a) => a.type === 'mdxJsxAttribute' && a.name === name)
  if (!attr) return undefined
  if (attr.value === null || attr.value === undefined) return true
  if (typeof attr.value === 'string') return attr.value
  const expression = attr.value.data?.estree?.body?.[0]?.expression
  if (expression?.type === 'Literal') return expression.value
  if (expression?.type === 'TemplateLiteral' && expression.expressions.length === 0) {
    return expression.quasis.map((quasi) => quasi.value.cooked).join('')
  }
  return undefined
}

const plainText = (node) =>
  node.type === 'text' || node.type === 'inlineCode'
    ? node.value
    : (node.children || []).map(plainText).join('')

// A literal string expression such as {' '}
const stringExpression = (node) => {
  const expression = node.data?.estree?.body?.[0]?.expression
  return expression?.type === 'Literal' && typeof expression.value === 'string'
    ? expression.value
    : undefined
}

export const mdxToMarkdown = (source, context) => {
  const footnotes = []

  const convertChildren = (parent) => {
    const children = []
    for (const child of parent.children || []) children.push(...convert(child))
    // Consecutive links (e.g. DocLink cards) form a single list
    parent.children = children.reduce((merged, node) => {
      const previous = merged[merged.length - 1]
      if (node.type === 'list' && node.data?.linkList && previous?.data?.linkList) {
        previous.children.push(...node.children)
      } else {
        merged.push(node)
      }
      return merged
    }, [])
    return parent
  }

  const unwrap = (node) => convertChildren({ children: node.children }).children

  const convert = (node) => {
    switch (node.type) {
      case 'mdxjsEsm':
      case 'mdxFlowExpression':
        return []
      case 'mdxTextExpression': {
        const value = stringExpression(node)
        return value === undefined ? [] : [text(value)]
      }
      case 'link':
      case 'definition':
        node.url = context.resolveUrl(node.url)
        break
      case 'image':
        node.url = context.resolveImage(node.url)
        break
    }

    if (!isJsx(node)) {
      if (node.children) convertChildren(node)
      return [node]
    }

    switch (node.name) {
      case 'DocLink': {
        const item = link(context.resolveUrl(String(attribute(node, 'href') ?? '')), [
          text(String(attribute(node, 'text') ?? '').replace(/^[\s • ]+/, '')),
        ])
        return [
          {
            type: 'list',
            ordered: false,
            spread: false,
            data: { linkList: true },
            children: [{ type: 'listItem', spread: false, children: [paragraph([item])] }],
          },
        ]
      }
      case 'Subsections':
        return context.subsections(Number(attribute(node, 'depth') ?? 1))
      case 'AnchorItem':
        return [
          { type: 'heading', depth: 3, children: [text(String(attribute(node, 'title') ?? ''))] },
          ...unwrap(node),
        ]
      case 'summary': {
        const children = unwrap(node).flatMap((child) =>
          child.type === 'paragraph' ? child.children : [child]
        )
        return [paragraph([{ type: 'strong', children }])]
      }
      case 'Footnote': {
        const children = node.children || []
        const note = children.find((child) => isJsx(child) && child.name === 'note')
        const label = children.filter((child) => isJsx(child) && child.name === 'text')
        const identifier = String(footnotes.length + 1)
        if (note) {
          footnotes.push({
            type: 'footnoteDefinition',
            identifier,
            label: identifier,
            children: [paragraph(unwrap(note))],
          })
        }
        return [
          ...label.flatMap(unwrap),
          ...(note ? [{ type: 'footnoteReference', identifier, label: identifier }] : []),
        ]
      }
      case 'CmdResult':
        return [paragraph([text('Output:')]), ...unwrap(node)]
      case 'FileWithIcon':
        return [text(String(attribute(node, 'text') ?? ''))]
      case 'ButtonLink':
      case 'a':
        return [link(context.resolveUrl(String(attribute(node, 'href') ?? '')), unwrap(node))]
      case 'br':
        return [{ type: 'break' }]
      case 'kbd':
        return [{ type: 'inlineCode', value: plainText(node) }]
      case 'i':
      case 'em':
        return [{ type: 'emphasis', children: unwrap(node) }]
      case 'b':
      case 'strong':
        return [{ type: 'strong', children: unwrap(node) }]
      default:
        if (DROPPED.has(node.name)) return []
        // Layout-only components (details, tabs, code with result, ...) keep their content
        return unwrap(node)
    }
  }

  const processor = unified().use(remarkParse).use(remarkMdx).use(remarkGfm).use(remarkStringify, {
    bullet: '-',
    emphasis: '_',
    strong: '*',
    fences: true,
    listItemIndent: 'one',
    rule: '-',
  })

  const tree = convertChildren(processor.parse(source))
  tree.children.push(...footnotes)
  return processor.stringify(tree).trim() + '\n'
}

// Resolves links in an article to absolute URLs.
// `pagePath` is the article's path within the Data Guide (e.g. `/postgresql/date-types`),
// `isIndex` whether the article is a section hub (relative links resolve inside it).
export const createUrlResolver = ({ siteRoot, pagePath, isIndex }) => {
  const base = `${siteRoot}${isIndex ? pagePath.replace(/\/?$/, '/') : pagePath.replace(/[^/]*$/, '')}`
  return (url) => {
    if (!url || /^[a-z][a-z0-9+.-]*:/i.test(url)) return url
    if (url.startsWith('#')) return `${siteRoot}${pagePath}${url}`
    if (url.startsWith('/')) return `${siteRoot}${url}`.replace(/\/(?=[#?]|$)/, '')
    return new URL(url, base).href.replace(/\/(?=[#?]|$)/, '')
  }
}
