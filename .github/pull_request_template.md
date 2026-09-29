## What changed and why

<!-- Which articles or parts of the site, and what was wrong or missing. -->

## How it was verified

<!-- The database/tool versions you tested against, and how (e.g. "ran every example in the postgres:18 container"). List anything you couldn't verify. -->

## Checklist

- [ ] Every command and SQL example I added or changed was run, and the output shown is the output I got.
- [ ] Examples use secure defaults (passwords, least privilege, localhost bindings) and no real credentials.
- [ ] Versions are named where behavior differs, and there is no `@latest` in install commands.
- [ ] `lastUpdated` is set only on articles that were substantively reviewed and re-tested.
- [ ] `npm test`, `npm run typecheck` and `npm run build` pass.
- [ ] Changes to authentication, permissions, encryption or destructive DDL are pointed out for expert review.
