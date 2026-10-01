import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createUrlResolver, mdxToMarkdown } from './mdx-to-markdown.mjs'

const siteRoot = 'https://www.prisma.io/dataguide'
const context = {
  resolveUrl: createUrlResolver({
    siteRoot,
    pagePath: '/datamodeling/correctness-constraints',
    isIndex: false,
  }),
  resolveImage: (url) => `${siteRoot}/static/${url.split('/').pop()}`,
  subsections: () => [],
}
const convert = (source, overrides = {}) => mdxToMarkdown(source, { ...context, ...overrides })

test('technical integration notes survive while signup panels are removed', () => {
  const result = convert(
    '<TechnicalNote>\n\nPrisma ORM 8 has no seed command. Use a script.\n\n</TechnicalNote>\n\n<PrismaOutlinks>\n\nSign up.\n\n</PrismaOutlinks>'
  )
  assert.match(result, /Prisma ORM 8 has no seed command/)
  assert.doesNotMatch(result, /Sign up/)
})

test('links resolve to absolute Data Guide URLs', () => {
  const markdown = convert(
    'See [joins](/types/relational/what-are-joins-in-sql), [this](#faq), [that](making-connections) and [docs](https://www.prisma.io/docs).'
  )
  assert.match(
    markdown,
    /\(https:\/\/www\.prisma\.io\/dataguide\/types\/relational\/what-are-joins-in-sql\)/
  )
  assert.match(
    markdown,
    /\(https:\/\/www\.prisma\.io\/dataguide\/datamodeling\/correctness-constraints#faq\)/
  )
  assert.match(
    markdown,
    /\(https:\/\/www\.prisma\.io\/dataguide\/datamodeling\/making-connections\)/
  )
  assert.match(markdown, /\(https:\/\/www\.prisma\.io\/docs\)/)
})

test('relative links in section hubs resolve inside the section', () => {
  const resolve = createUrlResolver({ siteRoot, pagePath: '/postgresql', isIndex: true })
  assert.equal(resolve('date-types'), `${siteRoot}/postgresql/date-types`)
})

test('images use their published URL', () => {
  assert.match(
    convert('![A diagram](../dataguide-images/joins.png)'),
    /!\[A diagram\]\(https:\/\/www\.prisma\.io\/dataguide\/static\/joins\.png\)/
  )
})

test('product panels and MDX comments are removed', () => {
  const markdown = convert(`Before

<PrismaOutlinks>

Try [Prisma](https://www.prisma.io).

</PrismaOutlinks>

<PostgresCallout />

{/* a comment */}

After`)
  assert.equal(markdown, 'Before\n\nAfter\n')
})

test('FAQ entries keep the question and the answer', () => {
  const markdown = convert(`<details>
<summary>What is a tuple?</summary>

A row in a table.

</details>`)
  assert.equal(markdown, '**What is a tuple?**\n\nA row in a table.\n')
})

test('footnotes become GFM footnotes', () => {
  const markdown = convert(
    'A <Footnote><note>Also "attribute".</note><text>column</text></Footnote> or record.'
  )
  assert.equal(markdown, 'A column[^1] or record.\n\n[^1]: Also "attribute".\n')
})

test('links from components become a single list', () => {
  const markdown =
    convert(`<DocLink icon="file" text="What are databases?" href={'/intro/what-are-databases'} />
<DocLink icon="file" text="&emsp;&bull;&nbsp; Schemas" href={'/intro/intro-to-schemas'} />`)
  assert.equal(
    markdown,
    `- [What are databases?](${siteRoot}/intro/what-are-databases)\n- [Schemas](${siteRoot}/intro/intro-to-schemas)\n`
  )
})

test('glossary entries become headings', () => {
  const markdown = convert(`<AnchorItem id="acid" title="ACID">
  A set of guarantees.
</AnchorItem>`)
  assert.equal(markdown, '### ACID\n\nA set of guarantees.\n')
})

test('commands keep their output', () => {
  const markdown = convert(`<CodeWithResult>
<Cmd>

\`\`\`sql
SELECT 1;
\`\`\`

</Cmd>
<CmdResult>

\`\`\`
1
\`\`\`

</CmdResult>
</CodeWithResult>`)
  assert.equal(markdown, '```sql\nSELECT 1;\n```\n\nOutput:\n\n```\n1\n```\n')
})

test('section hubs list their articles', () => {
  const subsections = () => [
    {
      type: 'list',
      ordered: false,
      spread: false,
      children: [
        {
          type: 'listItem',
          spread: false,
          children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Child' }] }],
        },
      ],
    },
  ]
  assert.equal(
    convert('## In this section\n\n<Subsections />', { subsections }),
    '## In this section\n\n- Child\n'
  )
})

test('tables are kept', () => {
  const markdown = convert('| a | b |\n| - | - |\n| 1 | 2 |')
  assert.match(markdown, /\| a \| b \|/)
})

test('inline spacing expressions are kept', () => {
  assert.equal(
    convert("A{' '}<a href='https://example.com'>link</a>{' '}here"),
    'A [link](https://example.com) here\n'
  )
})

test('status notices become a blockquote that leads with their title', () => {
  const markdown = convert(
    '<StatusNotice>\n\nWritten for MongoDB 4.4. Follow [the current guide](https://www.mongodb.com/docs/manual/installation/).\n\nThe concepts still apply.\n\n</StatusNotice>'
  )
  assert.equal(
    markdown,
    '> **This article is out of date.** Written for MongoDB 4.4. Follow [the current guide](https://www.mongodb.com/docs/manual/installation/).\n>\n> The concepts still apply.\n'
  )
})
