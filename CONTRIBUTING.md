# Contributing to Prisma's Data Guide

The Data Guide teaches how databases work. Readers copy its commands into their terminals and its SQL into their applications, so being correct matters more than being complete. These are the standards every change is held to, whether a person or a coding agent wrote it. Coding agents should also read [AGENTS.md](./AGENTS.md).

## Setup

You need Node.js 22 or later (CI uses Node.js 24).

```bash
npm install
npm run dev       # http://localhost:8000
```

Before opening a pull request, run the same checks CI runs:

```bash
npm test          # unit tests for the site code and build plugins
npm run typecheck # TypeScript
npm run build     # production build; fails on broken internal links and anchors
```

## Content standards

### Test what you publish

- Run every command and SQL statement you add or change against the version the article is about, and paste the output you actually got. Never write output by hand or "fix up" output to look plausible.
- Use a throwaway environment, such as a Docker container, for this: `docker run --rm -d --name dg-test -e POSTGRES_PASSWORD=test -p 127.0.0.1:5432:5432 postgres:18`. Never test against a database that holds real data.
- Where behavior differs between versions or engines, say which version you tested (for example, "In MySQL 8.4, …") and describe the difference only if you verified it.
- Back up claims about how a database behaves with a link to the vendor's documentation or with an example the reader can run.

### Secure defaults

The first example a reader sees is the one they copy. Make it the safe one:

- Accounts have passwords and only the privileges the example needs. Show broad grants (`ALL PRIVILEGES ON *.*`, superuser roles) only when the text is explaining them.
- PostgreSQL authentication examples use `scram-sha-256`, and MySQL examples use its default `caching_sha2_password`.
- Local servers and containers listen on localhost (`-p 127.0.0.1:5432:5432`), not on every interface.
- Never include real credentials, hostnames or connection strings. Use obvious placeholders.

### Versions

- Write for versions that the vendor still supports, and check their lifecycle pages (for example [PostgreSQL](https://www.postgresql.org/support/versioning/), [MySQL](https://www.mysql.com/support/eol-notice.html), [MongoDB](https://www.mongodb.com/legal/support-policy/lifecycles)).
- Don't put `@latest` in install commands. It resolves to whatever is published at the time, which can be a new major version or even a release candidate.
- For Prisma setup steps, link to the [Prisma docs](https://www.prisma.io/docs) instead of copying commands; the docs are maintained for each release. Anything Prisma-specific that you do include must name the Prisma ORM version it applies to.

### When an article can't be re-tested

Don't guess, and don't change its date. Add a `<StatusNotice>` at the top that says what is known to have changed and links to the maintained instructions:

```mdx
<StatusNotice>

This guide was written in 2021 for MongoDB 4.4, which reached end of life on February 29, 2024. To install a supported version, follow [MongoDB's installation guide](https://www.mongodb.com/docs/manual/installation/).

</StatusNotice>
```

`title` is optional (default: "This article is out of date").

### `lastUpdated`

Set `lastUpdated: YYYY-MM-DD` in the frontmatter only when the article's content was substantively reviewed or corrected and its examples were re-tested. It is shown to readers and search engines as the date the article was last updated, so typo fixes, formatting changes and date bumps don't count. It is never set automatically.

## Writing articles

Articles are MDX files in [`content`](./content). The numeric prefixes (`03-`) set the order in the sidebar and are removed from URLs: `content/04-postgresql/11-date-types.mdx` is published at `/dataguide/postgresql/date-types`. Renaming or moving a file changes its URL, so add a redirect in [`config.ts`](./config.ts) and update the links to it. The `mdtool` CLI described in the [README](./README.md) helps with renumbering.

Frontmatter:

| Field             | Required | Purpose                                                                                                             |
| ----------------- | -------- | ------------------------------------------------------------------------------------------------------------------- |
| `title`           | yes      | Page heading and sidebar entry                                                                                      |
| `metaTitle`       | yes      | `<title>` and social title                                                                                          |
| `metaDescription` | yes      | Meta description and the summary in `llms.txt`                                                                      |
| `metaImage`       | no       | Social preview image                                                                                                |
| `authors`         | no       | Keys from [`authors.json`](./authors.json)                                                                          |
| `lastUpdated`     | no       | See [`lastUpdated`](#lastupdated)                                                                                   |
| `toc`             | no       | `false` hides the table of contents                                                                                 |
| `hidePage`        | no       | `true` keeps the page out of navigation and `llms.txt`; also add it to the sitemap `excludes` in `gatsby-config.ts` |

Formatting:

- Start sections at `##` and don't skip heading levels.
- Give every code block a language: ` ```sql `, ` ```bash `, ` ```text ` for output. Every block gets a copy button; add `no-copy` to remove it. Add `diff` to highlight lines that start with `+` or `-`; without it, those characters are shown as they are, which is what you want for query output. `line-number` numbers the lines.
- Link to other articles with root-relative paths without the `/dataguide` prefix, such as `/postgresql/date-types#time-zones`. The build checks that every internal link and anchor exists.
- Put images in `content/dataguide-images` and describe them in the alt text.
- Give every table a header row.
- The components you can use (`StatusNotice`, `Footnote`, `AnchorItem`, `DocLink`, `Subsections`, `CodeWithResult`, and others) are demonstrated on the hidden [example page](./content/01-intro/99-example.mdx), at `http://localhost:8000/intro/example` when running locally.

Every article is also published as Markdown (append `.md` to its URL) and listed in `/llms.txt`. Both are generated at build time by [`plugins/gatsby-plugin-markdown-export`](./plugins/gatsby-plugin-markdown-export); if you add a component, teach the exporter what it should become in Markdown.

## Pull requests

Describe what changed and how you verified it: the versions you tested against and anything you couldn't test. Changes to authentication, permissions, encryption or other security-sensitive guidance need a review from someone who knows that database well.
