import type { Element, Root } from 'hast'
import { getThemedTopic } from './topicThemes.ts'

const findTopicLink = (node: Element): string | undefined => {
  if (node.tagName === 'a' && typeof node.properties?.href === 'string') {
    const topic = getThemedTopic(node.properties.href)
    if (topic) return topic
  }
  for (const child of node.children) {
    if (child.type !== 'element') continue
    const topic = findTopicLink(child)
    if (topic) return topic
  }
}

// Sectionize has already wrapped homepage h2s. Use their hub links, never their prose or ids.
export const rehypeTopicSections = () => (tree: Root, file: { path?: string }) => {
  if (!file.path?.replace(/\\/g, '/').endsWith('/content/index.mdx')) return
  for (const section of tree.children) {
    if (section.type !== 'element' || section.tagName !== 'section') continue
    const heading = section.children.find(
      (child): child is Element => child.type === 'element' && child.tagName === 'h2'
    )
    const topic = heading && findTopicLink(heading)
    if (topic) section.properties = { ...section.properties, 'data-topic': topic }
  }
}
