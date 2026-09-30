import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { compile } from '@mdx-js/mdx'
import type { Element, Root } from 'hast'
import { THEMED_TOPICS, getThemedTopic } from './topicThemes.ts'
import { rehypeTopicSections } from './rehypeTopicSections.ts'

const sectionize = createRequire(import.meta.url)('remark-sectionize')
const compileSections = async (value: string, path = '/repo/content/index.mdx') => {
  let result: Root
  await compile(
    { value, path },
    {
      remarkPlugins: [sectionize],
      rehypePlugins: [
        rehypeTopicSections,
        () => (tree: Root) => {
          result = tree
        },
      ],
    }
  )
  return result!.children.filter(
    (node): node is Element => node.type === 'element' && node.tagName === 'section'
  )
}

test('theme registry matches CSS hooks and every referenced scene exists', () => {
  const css = readFileSync(new URL('../styles/topic-themes.css', import.meta.url), 'utf8')
  const themes = [...css.matchAll(/\.top-section\[data-topic='([^']+)'\] \{([^}]+)\}/g)]
  assert.deepEqual(themes.map((match) => match[1]).sort(), [...THEMED_TOPICS].sort())
  assert.equal(new Set(THEMED_TOPICS).size, THEMED_TOPICS.length)
  for (const [, topic, declarations] of themes) {
    assert.ok(css.includes(`.topic-home > section[data-topic='${topic}']`))
    assert.match(declarations, /--topic-wash: #[0-9a-f]{6};/)
    assert.match(declarations, /--topic-border: #[0-9a-f]{6};/)
    const scene = declarations.match(/--topic-scene: url\('([^']+)'\);/)
    assert.ok(scene, `Missing scene for ${topic}`)
    assert.ok(existsSync(new URL(scene[1], new URL('../styles/topic-themes.css', import.meta.url))))
  }
  assert.ok(!css.includes(':has(> h2'), 'Theme CSS must not depend on heading copy')
})

test('homepage MDX emits one stable topic hook for every registered theme', async () => {
  const source = readFileSync(new URL('../../content/index.mdx', import.meta.url), 'utf8')
  const sections = await compileSections(source.replace(/^---[\s\S]*?---\s*/, ''))
  assert.deepEqual(
    sections.map((node) => node.properties?.['data-topic']),
    [...THEMED_TOPICS]
  )
})

test('copy edits and permalink anchors do not change the theme; nested headings do not override it', async () => {
  const sections = await compileSections(
    '## [Permalink](#renamed-heading) [Completely renamed heading](/intro)\n\nCopy.\n\n### [Nested heading](/mysql)'
  )
  assert.equal(sections[0].properties?.['data-topic'], 'intro')
})

test('article sections and unknown or external homepage links remain unthemed', async () => {
  const article = await compileSections('## [Intro](/intro)', '/repo/content/01-intro/index.mdx')
  assert.equal(article[0].properties?.['data-topic'], undefined)
  const home = await compileSections(
    '## [Unknown](/unknown)\n\n## [External](https://example.com/intro)'
  )
  assert.ok(home.every((node) => node.properties?.['data-topic'] === undefined))
})

test('nested and production-prefixed article paths share the homepage theme', () => {
  assert.equal(getThemedTopic('/postgresql/reading-and-querying-data/basic-select'), 'postgresql')
  assert.equal(getThemedTopic('/dataguide/intro/what-are-databases'), 'intro')
  for (const path of [
    '/',
    '/unknown',
    '#intro',
    'https://example.com/intro',
    '//example.com/intro',
  ]) {
    assert.equal(getThemedTopic(path), undefined)
  }
})
