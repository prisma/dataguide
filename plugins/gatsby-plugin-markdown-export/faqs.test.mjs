import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { extractFaqs } from './faqs.mjs'
import { createUrlResolver, mdxParser, mdxToMarkdown } from './mdx-to-markdown.mjs'

const context = {
  resolveUrl: createUrlResolver({
    siteRoot: 'https://example.test/dataguide',
    pagePath: '/intro/example',
    isIndex: false,
  }),
  resolveImage: (url) => url,
  subsections: () => [],
}

test('FAQ details retain full answers, code, lists and absolute links; setup details are excluded', () => {
  const source = `<details><summary>Setup</summary>Example</details>

## FAQ

<details>
<summary>What is a \`tuple\`?</summary>

A **row**. See [the glossary](/intro/database-glossary).

- First caveat.
- Second caveat.

\`\`\`text
example
  indentation
\`\`\`

</details>

## More

<details><summary>More setup</summary>Instructions</details>`
  const faqs = extractFaqs(source, context)
  assert.equal(faqs.length, 1)
  assert.equal(faqs[0].question, 'What is a tuple?')
  assert.match(faqs[0].answer, /\*\*row\*\*/)
  assert.match(
    faqs[0].text,
    /A row\. See the glossary \(https:\/\/example.test\/dataguide\/intro\/database-glossary\)/
  )
  assert.match(faqs[0].text, /First caveat\.\n\nSecond caveat\./)
  assert.match(faqs[0].text, /example\n  indentation/)
})

test('heading FAQs include nested subsections and stop at the next question or section', () => {
  const source = `## Frequently asked questions

### First question?

First answer.

#### Caveat

Keep this too.

### Second question?

Second answer.

<PrismaOutlinks>Signup</PrismaOutlinks>

## Conclusion

Leave this out.`
  const faqs = extractFaqs(source, context)
  assert.deepEqual(
    faqs.map((faq) => faq.question),
    ['First question?', 'Second question?']
  )
  assert.match(faqs[0].text, /Keep this too/)
  assert.equal(faqs[1].text, 'Second answer.')
})

test('empty questions, answers and missing summaries fail instead of publishing incomplete FAQ data', () => {
  for (const source of [
    '## FAQ\n\n<details><summary></summary>Answer</details>',
    '## FAQ\n\n<details><summary>Question?</summary></details>',
    '## FAQ\n\n<details>Answer</details>',
    '## FAQ\n\n### Question?',
  ])
    assert.throws(() => extractFaqs(source, context), /FAQ/)
})

test('every source article converts and every extracted FAQ survives its Markdown export', async (t) => {
  const root = new URL('../../content/', import.meta.url)
  const files = (await readdir(root, { recursive: true })).filter((file) => /\.mdx?$/.test(file))
  let questions = 0,
    faqPages = 0
  for (const file of files) {
    const source = (await readFile(new URL(file, root), 'utf8')).replace(
      /^---\r?\n[\s\S]*?\r?\n---\r?\n/,
      ''
    )
    const markdown = mdxToMarkdown(source, context)
    const codeBlocks = (tree) => {
      if (['PrismaOutlinks', 'PostgresCallout'].includes(tree.name)) return []
      if (tree.type === 'code') return [{ lang: tree.lang, meta: tree.meta, value: tree.value }]
      return (tree.children || []).flatMap(codeBlocks)
    }
    assert.deepEqual(
      codeBlocks(mdxParser().parse(markdown)),
      codeBlocks(mdxParser().parse(source)),
      `${file}: code or output changed in export`
    )
    const faqs = extractFaqs(source, context)
    if (faqs.length) faqPages++
    questions += faqs.length
    for (const faq of faqs) {
      assert.ok(faq.text.trim(), `${file}: missing answer`)
      assert.ok(markdown.includes(faq.answer), `${file}: answer differs from article export`)
    }
    if (/^## (?:FAQ|Frequently asked questions)\s*$/im.test(source)) {
      assert.ok(faqs.length, `${file}: FAQ section was missed`)
    }
  }
  assert.ok(questions > 0)
  t.diagnostic(
    `Converted ${files.length} source articles; extracted ${questions} questions from ${faqPages} FAQ articles.`
  )
})
