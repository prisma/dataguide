# Contributing to Prisma's Data Guide

The Data Guide teaches how databases work. Readers copy its commands into their terminals and its SQL into their applications, so being correct matters more than being complete. These are the standards every change is held to, whether a person or a coding agent wrote it. Coding agents should also read [AGENTS.md](./AGENTS.md).

## Setup

You need Node.js 22.18.0 or later (CI uses Node.js 24).

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

| Field             | Required | Purpose                                                                                              |
| ----------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `title`           | yes      | Page heading and sidebar entry                                                                       |
| `metaTitle`       | yes      | `<title>` and social title                                                                           |
| `metaDescription` | yes      | Meta description and the summary in `llms.txt`                                                       |
| `metaImage`       | no       | Legacy fallback only; see [sharing cards](docs/topic-artwork.md#social-sharing-cards).               |
| `authors`         | no       | Keys from [`authors.json`](./authors.json)                                                           |
| `lastUpdated`     | no       | See [`lastUpdated`](#lastupdated)                                                                    |
| `toc`             | no       | `false` hides the table of contents                                                                  |
| `hidePage`        | no       | `true` hides navigation and discovery in `llms.txt`; the public URL can still be used directly       |
| `publish`         | no       | `false` omits HTML, Markdown, navigation, sitemap and search; `skipBuild: true` has the same meaning |
| `index`           | no       | `false` adds HTML `noindex` and excludes sitemap, search and `llms.txt` discovery                    |
| `search`          | no       | `false` excludes the article from the search index                                                   |
| `export`          | no       | `false` omits the Markdown representation and its advertised alternate link                          |

Generated topic cards override `metaImage` on the homepage, topic hubs, and articles.
All current content sections are themed, so setting this legacy field on those pages
has no effect. It remains a fallback for future pages without a generated topic card.

Formatting:

- Start sections at `##` and don't skip heading levels.
- Give every code block a language. Keep runnable `sql` and `bash` separate from `text output`; do not put prompts, result tables or comments showing expected output into copied commands. Use `pseudocode` for templates requiring substitution, and `expected-failure sqlstate=23505` (with the actual state) for deliberate SQL failures. Copy buttons name their role. Add `no-copy` to remove one. `diff` highlights changes and copies the resulting code with removed lines omitted. Add `patch` when the copy should retain patch markers. Unmarked blocks preserve literal operators and output. `line-number` numbers the lines.
- Link to other articles with root-relative paths without the `/dataguide` prefix, such as `/postgresql/date-types#time-zones`. The build checks that every internal link and anchor exists.
- Put images in `content/dataguide-images` and describe them in the alt text.
- Give every table a header row.
- The components you can use (`StatusNotice`, `Footnote`, `AnchorItem`, `DocLink`, `Subsections`, `CodeWithResult`, and others) are demonstrated on the hidden [example page](./content/01-intro/99-example.mdx), at `http://localhost:8000/intro/example` when running locally.

Published articles normally have a Markdown representation (append `.md` to the URL) and discoverable articles appear in `/llms.txt`, according to the flags above. Both are generated at build time by [`plugins/gatsby-plugin-markdown-export`](./plugins/gatsby-plugin-markdown-export). Put technical prerequisites, version caveats and mappings in `TechnicalNote`, which the exporter preserves. `PrismaOutlinks` is for removable promotional material. If you add a component, teach the exporter what it should become in Markdown.

## Verification and release evidence

Maintain [`content-verification.json`](./content-verification.json). Every article has an owner role, scope, release channel and disposition; a named human reviewer remains separate from automated execution. `executed` requires the fixture, immutable successful run evidence, exact versions and actual review date. The build rejects missing evidence and changed article or fixture hashes. A date alone establishes no test claim. `source-reviewed`, `partial`, `external-needed` and `unreviewed` express different scopes. Only advertise the scope actually exercised.

The PostgreSQL tutorial runner and [`examples/library-app`](./examples/library-app) use pinned disposable images and synthetic data. The Database tutorials workflow repeats them for relevant changes and weekly, retaining reports even on failure. It receives no production secrets. Checked-in evidence is a record of a specific run, not a substitute for rerunning changed examples. Regenerate evidence after a substantive fixture or tested-source change and inspect negative controls and cleanup before copying the successful report into `tests/tutorials/evidence`.

The build validates local assets, social images, canonical URLs, Markdown links and sitemap destinations in addition to HTML anchors. `/content-manifest.json` records the content hash, source revision, dirty-tree status and generated artifact hashes. HTML, Markdown and search records carry the same content revision. A dirty-tree build is a local check; release evidence should identify a committed revision.

When publishing search, set `INDEX_ALGOLIA=true` and supply all configured credentials. Missing credentials and indexer failures fail a required publication. The normal credential-free build checks source and generated artifacts; it cannot prove freshness of a hosted search index. After deployment, use `scripts/deployment-smoke.mjs` and `scripts/search-smoke.mjs` against the actual preview/production URL and expected content revision. Preserve reports separately for each deployment. The latter needs a read-only search key. Network failures remain inconclusive. Do not reuse production database credentials to obtain provider or application evidence.

[`lifecycle-sources.json`](./lifecycle-sources.json) maps primary upstream sources to affected paths, owner roles and stable/preview lanes. The scheduled lifecycle workflow emits scoped review tasks when fingerprints change or retrieval fails; it does not automatically change versions or dates. `scripts/lifecycle-review.mjs --simulate=postgresql` exercises the mapping without a network call. A changed document is a review trigger, not proof of a behavioral change. Update the baseline only after reviewing the source and rerunning affected fixtures where needed. Assign the owner roles to people before treating the maintenance programme as staffed.

## Pull requests

Describe what changed and how you verified it: the versions you tested against and anything you couldn't test. Changes to authentication, permissions, encryption or other security-sensitive guidance need a review from someone who knows that database well.
