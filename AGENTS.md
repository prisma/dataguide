# Instructions for coding agents

Prisma's Data Guide is a Gatsby 5 site (React 19, MDX 2) whose articles in `content/` teach databases. Follow [CONTRIBUTING.md](./CONTRIBUTING.md); these rules add to it.

## Rules

- **Never fabricate.** Don't invent command output, error messages, benchmark numbers, version numbers, dates or links. If you can't run or verify something, leave it unchanged and say so in the pull request.
- **Verify in throwaway environments.** Run every SQL statement and command you add or change in a disposable container for the version the article covers, and remove the container afterwards. Use `127.0.0.1` port bindings and container names that won't clash with others.
- **No production access.** Never connect to a production or shared database, and never use real credentials, even if they are available to you.
- **Label uncertainty.** When provider behavior (a cloud console, a managed service's defaults or pricing) can't be verified, say that in the article or leave the claim out. Don't guess.
- **Keep changes surgical.** Keep an article's structure and voice, and fix what's wrong without rewriting what's right.
- **Don't bump dates.** Only set `lastUpdated` on an article you substantively corrected and re-tested. For articles you can't re-test, add a `<StatusNotice>` that tells readers what is known to be out of date (see CONTRIBUTING.md). Never use a notice to describe your own review or testing.
- **Security-sensitive changes need a human.** Say in the pull request when you changed guidance on authentication, permissions, encryption, network exposure, or DDL that could destroy data, so a human expert reviews it.

## Commands

```bash
npm install
npm test          # unit tests
npm run typecheck # TypeScript
npm run build     # full build; fails on broken internal links and anchors (takes a few minutes)
```

## Where things are

- `content/`: articles. Numeric prefixes set the order and are stripped from URLs.
- `src/components/customMdx/`: the components available in MDX. `src/templates/docs.tsx` renders articles.
- `plugins/gatsby-plugin-markdown-export/`: the Markdown version of each article and `llms.txt`.
- `plugins/gatsby-plugin-check-links/`: the post-build check of internal links and anchors.
- `config.ts`: site settings and redirects for moved articles.
