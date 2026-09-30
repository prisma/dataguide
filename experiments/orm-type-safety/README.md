# Independent type-safety comparison

This is a new reproduction of the seven checks in the Data Guide comparison. It does not recover the missing projects from the earlier refresh. The eight stable libraries have separate models, exact dependency pins and npm lockfiles. Release candidates, beta versions and Prisma TypedSQL are outside this experiment.

Use Node.js 24.18.0, npm and Docker. From the repository root:

```bash
npm run test:orms
```

The runner installs each locked project, generates Prisma Client, compiles with TypeScript 7.0.2, 6.0.3 and 5.9.3, removes `@ts-expect-error` comments for a second compilation, then runs the runtime controls. Compiler checks are never executed as application code. Each deliberately rejected statement has a corrected control. Assertions pin selected types, nullable types, loaded relations and `any`/`unknown` boundaries. Runtime assertions distinguish database rejection, validation errors, missing properties, unloaded collections and silently empty results.

PostgreSQL 18.6 and MongoDB 8.0.32 images are pinned by digest in `run.mjs`. Every invocation creates uniquely named disposable containers with randomly allocated ports bound to `127.0.0.1`. The runner supplies its own synthetic database URLs, initializes only those databases and removes both containers in `finally`. It does not use a caller's database URL. Run the orchestrator; do not point individual runtime files at an existing database. Schema synchronization in TypeORM, Sequelize and MikroORM belongs only to this disposable setup.

Actual command exits, stdout, stderr, unsuppressed diagnostics, runtime observations, installed versions, image digests and source hashes are saved in `.verification-runs/comparison.json`. A failed run is saved as failed. Successful reports require matching sources and verified cleanup. Project files and lockfiles are hashed, so changing them invalidates an executed article's checked-in evidence. Absolute paths and ephemeral ports in logs describe the actual environment; they are not reproduction inputs.

Each project's `src/model.ts` defines the model, `src/checks.ts` proves compiler behavior and `src/runtime.ts` tests values. `src/helper.ts` contains type assertions and runtime reporting. `tsconfig.runtime.json` emits only the model, helpers and runtime controls. Generated clients, emitted JavaScript and transient unsuppressed files are ignored.

The Database tutorials workflow runs this experiment for relevant changes and weekly without production secrets, retaining the report even on failure. These results describe the APIs and model declarations in these fixtures. They are not a migration, performance, security or production-readiness ranking.
