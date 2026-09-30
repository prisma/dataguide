---
title: 'Evaluating type safety in TypeScript ORMs and query builders (2026)'
metaTitle: 'TypeScript ORM Type Safety, Tested: Prisma, Drizzle, Kysely & More'
metaDescription: 'We ran the same seven type safety checks against Prisma ORM, Drizzle, Kysely, TypeORM, Sequelize, MikroORM, Mongoose and Knex with strict TypeScript and recorded which mistakes each library catches at compile time.'
metaImage: '/social/docs-social.png'
lastUpdated: 2026-09-30
---

## Introduction

An ORM or query builder sits between your TypeScript code and a database that the compiler can't see. Its type definitions are a promise about what the database accepts and returns. When that promise is accurate, the compiler catches a misspelled column or a missing field before the code runs. When it isn't, you get something worse than no types: code that compiles, looks right, and fails when it runs.

Every library in this article ships its own TypeScript types, so "does it support TypeScript?" is no longer a useful question. This article asks a narrower one: **which common mistakes does the compiler actually catch?** We modeled the same small schema in eight libraries, wrote the same seven checks as code, and let `tsc` decide. Where a mistake compiled, we also ran it against a throwaway database to see what happened instead.

This article is published by Prisma, the company behind Prisma ORM, one of the libraries tested; the versions and method are listed so that you can repeat the checks.

For the popularity, release activity and maintenance of these libraries, see the companion article, [Top Node.js ORMs, query builders and database libraries](/database-tools/top-nodejs-orms-query-builders-and-database-libraries). If you're new to the difference between ORMs and query builders, start with [Comparing SQL, query builders, and ORMs](/types/relational/comparing-sql-query-builders-and-orms).

## How the libraries were tested

### Versions

Each library was tested at its latest stable release on npm at the end of September 2026:

| Library     | Version tested | Kind                           | Notes                                                                                                                                                                         |
| ----------- | -------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prisma ORM  | 7.10.0         | ORM with a generated client    | The same checks were repeated on the Prisma ORM 8 release candidate (`prisma` `8.0.0-rc.19` with `@prisma/orm-postgres` `8.0.0-rc.13`), with identical results for checks 1–6 |
| Drizzle ORM | 0.45.3         | ORM and SQL-like query builder | The same checks were repeated on the `1.0.0-rc.4` release candidate, with identical results                                                                                   |
| Kysely      | 0.29.6         | Query builder                  | `0.30.0-beta.2`, on the `next` tag, wasn't tested                                                                                                                             |
| TypeORM     | 1.1.1          | ORM                            |                                                                                                                                                                               |
| Sequelize   | 6.37.8         | ORM                            | Sequelize 7 (`@sequelize/core`) is still in alpha (`7.0.0-alpha.48`) and wasn't tested                                                                                        |
| MikroORM    | 7.2.2          | ORM                            |                                                                                                                                                                               |
| Mongoose    | 9.10.3         | Object-document mapper (ODM)   | For MongoDB                                                                                                                                                                   |
| Knex.js     | 3.3.0          | Query builder                  | Included as a baseline                                                                                                                                                        |

Prisma's documentation now defaults to Prisma ORM 8, and the `latest` tag of the `prisma` package resolves to the release candidate, so pin `prisma@7` and `@prisma/client@7` to reproduce the 7.10.0 results.

The compiler was [TypeScript 7.0.2](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/), the native compiler. Every check was repeated with TypeScript 6.0.3 and 5.9.3, and the results were identical. The SQL libraries used their PostgreSQL drivers. The runtime checks ran on Node.js 24 against PostgreSQL 18.6 and MongoDB 8.0.32 in local Docker containers.

### Setup

Each library got its own project with exact version pins and this `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es2023",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src"]
}
```

The TypeORM project also set `experimentalDecorators` and `emitDecoratorMetadata`, which its decorators need. [`strict`](https://www.typescriptlang.org/tsconfig/#strict) matters here: without `strictNullChecks`, which it turns on, no library can make you handle a nullable column.

Each project models the same two tables, using the approach the library's documentation recommends for TypeScript:

- `User`: `id` (auto-incremented primary key), `email` (required and unique) and `name` (nullable)
- `Post`: `id`, `title` (required), `published` (a boolean that defaults to `false`) and `authorId` (a reference to `User`)

In Mongoose, these are two collections, with `Post.author` referencing a user and a virtual `posts` field on `User` for populating a user's posts.

### The seven checks

1. **Missing required field**: create a user without an `email`.
2. **Wrong value type**: create a post with `published: 'yes'`.
3. **Misspelled column in a filter**: find users where `emial` equals a value.
4. **Partial select**: select only `id` and `email`. Does the result type drop `name`?
5. **Relations**: load a user with its posts. Is `posts` typed, and is it absent from the type when the query didn't load it?
6. **Nullability**: is `name` typed so that you have to handle `null`?
7. **Raw SQL**: what type does the library's raw SQL escape hatch return?

Checks 1 to 6 are caught, not caught or partially caught. Check 7 records a type instead, because the TypeScript compiler can't check a SQL string against your database. Two rules keep the grading consistent:

- SQL that you write as a string, whether a whole raw query or a fragment passed to a query builder, only counts under check 7.
- For check 6, nullability counts as caught when it is declared in one place and the TypeScript type follows from that declaration. It counts as partial when it is declared twice, as a TypeScript type and as a column option, and nothing checks that the two agree.

### How the test files prove the results

Each line that the compiler should reject is preceded by a [`// @ts-expect-error`](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-9.html) comment. If the line compiles anyway, `tsc` reports the comment as unused and fails, so a passing build proves that every expected error happened. Because the comment suppresses any error on the next line, each project was compiled a second time with the comments removed to confirm that each error was the intended one, and each rejected write and filter has a corrected control line next to it that compiles.

Mistakes that the compiler doesn't catch are written without the comment, so the passing build proves that they compile. Result types are pinned with a small helper that only compiles when two types are identical:

```typescript
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
function expectType<T extends true>(): void {}

// Compiles only if `subset` is exactly { id: number; email: string }[]
expectType<Equals<typeof subset, { id: number; email: string }[]>>()
```

The checks are about compile time. When a mistake compiled, it was also run against the database, and the section on that library says what happened. Nothing in this article about runtime behavior is inferred from types alone.

## Results

Many of the results follow from one design choice, where each library's types come from:

| Library     | You define the model in      | The TypeScript types come from                                |
| ----------- | ---------------------------- | ------------------------------------------------------------- |
| Prisma ORM  | A Prisma schema file         | Code generated from the schema                                |
| Drizzle ORM | TypeScript table definitions | Inferred from the table definitions                           |
| Kysely      | A `Database` interface       | The interface, written by hand or generated from the database |
| TypeORM     | Decorated entity classes     | The class property declarations                               |
| Sequelize   | Model classes and `init()`   | The class property declarations                               |
| MikroORM    | `defineEntity()`             | Inferred from the entity definition                           |
| Mongoose    | A `Schema`                   | Inferred from the schema                                      |
| Knex.js     | A `Tables` interface         | The interface, written by hand                                |

What the compiler caught:

| Library     | 1. Required field | 2. Value type | 3. Filter column | 4. Partial select | 5. Relations | 6. Nullability | 7. Raw SQL returns             |
| ----------- | ----------------- | ------------- | ---------------- | ----------------- | ------------ | -------------- | ------------------------------ |
| Prisma ORM  | Caught            | Caught        | Caught           | Caught            | Caught       | Caught         | `unknown`                      |
| Drizzle ORM | Caught            | Caught        | Caught           | Caught            | Caught       | Caught         | `Record<string, unknown>` rows |
| Kysely      | Caught            | Caught        | Caught           | Caught            | Caught ¹     | Caught ²       | `unknown` rows                 |
| TypeORM     | Not caught        | Caught        | Caught ³         | Not caught        | Not caught   | Partial ⁴      | `any`                          |
| Sequelize   | Caught            | Caught        | Caught           | Not caught        | Partial ⁵    | Partial ⁴      | `unknown[]`                    |
| MikroORM    | Caught            | Caught        | Caught           | Caught            | Partial ⁶    | Caught ⁷       | Rows with `any` properties     |
| Mongoose    | Not caught        | Caught        | Not caught       | Not caught        | Not caught   | Caught ⁷       | `any[]` ⁸                      |
| Knex.js     | Partial ⁹         | Caught        | Partial ¹⁰       | Caught            | Partial ¹¹   | Caught ²       | `any`                          |

1. Kysely has no relation model. You load posts with a subquery, for example with its `jsonArrayFrom` helper, and the result of that subquery is fully typed and absent from the type when you don't select it.
2. Nullability is declared once, in the `Database` or `Tables` interface, and that interface is written by hand. For Kysely, tools such as kysely-codegen can generate it from the database instead. As with every library's model, nothing checks the interface against the actual database.
3. Caught in the `where` option of TypeORM's `find` methods. The conditions you pass to its `QueryBuilder` are SQL strings, which count under check 7.
4. Nullability is declared twice: as the property's TypeScript type and as a column option (`nullable: true` in TypeORM, `allowNull: true` in Sequelize). Nothing checks that they agree, and a model that declares `name: string` for a nullable column compiles.
5. `posts` is declared optional, so using it without a check, such as reading `posts.length`, doesn't compile whether or not the query included posts. But the type doesn't change when you include them.
6. A populated collection is typed as loaded, its typed accessor `posts.$` doesn't compile unless the collection was populated, and an unpopulated reference only exposes its primary key. But the `posts` collection is present in the type either way, and `posts.getItems()` compiles on a collection that wasn't populated. Calling it at runtime threw an error.
7. Typed as `string | null | undefined`, because nullable fields are also optional.
8. MongoDB has no SQL. The escape hatches tested were `aggregate()`, which returns `any[]`, and the underlying MongoDB driver collection, whose documents have `any` properties.
9. Caught only when you write the table's insert type by hand with `Knex.CompositeTableType`. If you only declare a row type, `insert()` accepts partial rows.
10. The object form, `where({ emial: … })`, is caught. The column-name form, `where('emial', …)`, isn't.
11. Knex has no relation model. A join's rows are typed when you select unqualified column names (`Pick<User & Post, 'email' | 'title'>[]`), but table-qualified names such as `'users.email'`, and misspelled names, give `any[]` without an error.

A few patterns stand out:

- **Writes**: every library rejects a wrong value type. They differ on missing fields: TypeORM's `insert()`, `save()` and `create()` and Mongoose's `create()` accept partial objects, so a missing required field is only reported by the database or by Mongoose's validation at runtime.
- **Reads**: the result type is where the libraries differ most. Prisma ORM, Drizzle, Kysely and, for most cases, MikroORM compute the result type from the query, so selecting fewer columns or loading a relation changes the type. TypeORM, Sequelize and Mongoose return the full model type whatever the query selected or loaded, so the type can disagree with the value. In these tests, properties typed `string | null` held `undefined`, and a populated reference typed `ObjectId` held a document.
- **Raw SQL**: the TypeScript compiler can't check a SQL string against your database. A result typed `unknown` makes you narrow or validate the rows before you use them, while `any` turns off checking for everything that touches the result. The raw query methods of every library tested also accept a type argument, such as `$queryRaw<T>`, `sql<T>` or `knex.raw<T>`, that is trusted without being checked against the query. Prisma ORM's TypedSQL and MikroORM's Kysely integration go further by deriving the types for you.

## Prisma ORM

In Prisma ORM 7, you define models in a Prisma schema file, and a generate step writes a client with types for that schema into your project. The client's methods take plain objects, and their return types are computed from the objects you pass, which is how `select` and `include` change the result type. Because the types are generated, you rerun the generate step after changing the schema.

```prisma
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id        Int     @id @default(autoincrement())
  title     String
  published Boolean @default(false)
  author    User    @relation(fields: [authorId], references: [id])
  authorId  Int
}
```

All six pass/fail checks were caught:

```typescript
await prisma.user.findMany({ where: { emial: 'alice@example.com' } })
// error TS2561: Object literal may only specify known properties, but 'emial' does not
// exist in type 'UserWhereInput'. Did you mean to write 'email'?

const subset = await prisma.user.findMany({ select: { id: true, email: true } })
// { id: number; email: string }[]

const withPosts = await prisma.user.findFirstOrThrow({ include: { posts: true } })
// withPosts.posts: { id: number; title: string; published: boolean; authorId: number }[]

const withoutPosts = await prisma.user.findFirstOrThrow()
withoutPosts.posts
// error TS2339: Property 'posts' does not exist on type '{ id: number; email: string; name: string | null; }'.
```

A misspelled relation name in `include` is rejected the same way. The runtime values matched the types: the partial select returned objects with only `id` and `email`, and the query without `include` returned no `posts` property.

For raw SQL, `$queryRaw` returns `unknown`, and `$queryRaw<T>` trusts whatever type you pass. TypedSQL, a preview feature in Prisma ORM 7, instead generates a typed function for each `.sql` file in your project during its generation step, which connects to a database that has your schema to work out the types. For a query file that selects `id`, `email` and `name` and takes a string parameter, the generated function typed both, including the nullable `name` column, and rejected a number as the parameter:

```typescript
const rows = await prisma.$queryRawTyped(getUserEmails('example.com'))
// { id: number; email: string; name: string | null }[]
```

Prisma ORM 8, a release candidate at the time of writing, keeps the schema file and a generate step but replaces Prisma Client with a chained query API: `db.orm.public.User.select('id', 'email').all()` is typed `{ id: number; email: string }[]`, and `.include('posts')` adds a typed `posts` array. Against `8.0.0-rc.19`, checks 1 to 6 gave the same results as Prisma ORM 7. For [raw SQL](https://www.prisma.io/docs/orm/reference/raw-queries), a whole statement declares its row type with `returnsRow()`, one type per column. That declaration isn't checked against the SQL when you compile, but a declared column that the query didn't return threw `RUNTIME.RAW_ROW_COLUMN_MISSING` at runtime. See [Reading data](https://www.prisma.io/docs/orm/fundamentals/reading-data) in the Prisma ORM 8 documentation.

<PrismaOutlinks>

Prisma ORM's documentation explains how to reuse the generated types in your own functions: [Model and result types in Prisma ORM 8](https://www.prisma.io/docs/orm/reference/orm-client#model-and-result-types).

</PrismaOutlinks>

## Drizzle ORM

In Drizzle, you define tables in TypeScript, and the types are inferred from those definitions, with no generate step. Columns are nullable unless you call `.notNull()`, so `name` is `string | null` here:

```typescript
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
})
```

Drizzle has two query APIs: a SQL-like one (`db.select().from(users)`) and a relational one (`db.query.users.findMany()`). All six pass/fail checks were caught, in both APIs where a check applies to both:

```typescript
await db.select().from(users).where(eq(users.emial, 'alice@example.com'))
// error TS2551: Property 'emial' does not exist on type 'PgTableWithColumns<…>'. Did you mean 'email'?

const subset = await db.select({ id: users.id, email: users.email }).from(users)
// { id: number; email: string }[]

const withPosts = await db.query.users.findFirst({ with: { posts: true } })
// withPosts.posts is typed; without `with`, `posts` isn't part of the type
```

In the SQL-like API, joins are typed too: after `leftJoin(posts, …)`, each row's `posts` value is typed as a post or `null`, because a left join can return a user without posts.

The error messages for inserts are harder to read than the others. Because `values()` accepts one row or an array of rows, TypeScript reports the mismatch against the array form. For `published: 'yes'`, the message said that `'title' does not exist in type '{ … }[]'` instead of pointing at `published`.

For raw SQL, ``db.execute(sql`…`)`` types the rows as `Record<string, unknown>`. The `sql<T>` template tag, which you can also use for a single expression inside a typed `select()`, trusts the type you give it.

Drizzle's documentation now describes the upcoming 1.0 release, which changes how relations are defined (`defineRelations()`) and lets the relational API filter with plain objects (`where: { email: … }`). The same checks against `1.0.0-rc.4` gave identical results, including for a misspelled key in an object filter. See [Upgrade to Drizzle 1.0](https://orm.drizzle.team/docs/upgrade-v1) and the [relational query API](https://orm.drizzle.team/docs/rqb).

## Kysely

Kysely is a query builder, not an ORM. You describe your tables in a `Database` interface, and Kysely computes the type of every query from it, including selected columns, joins and subqueries:

```typescript
interface Database {
  users: { id: Generated<number>; email: string; name: string | null }
  posts: { id: Generated<number>; title: string; published: Generated<boolean>; author_id: number }
}
```

`Generated<>` marks columns that the database fills in, so they're optional on insert. All six pass/fail checks were caught:

```typescript
await db.selectFrom('users').selectAll().where('emial', '=', 'alice@example.com').execute()
// error TS2345: Argument of type '"emial"' is not assignable to parameter of type 'ReferenceExpression<Database, "users">'.

const subset = await db.selectFrom('users').select(['id', 'email']).execute()
// { id: number; email: string }[]
```

Kysely has no concept of relations, so you load related rows with a join or a subquery. With the `jsonArrayFrom` helper from `kysely/helpers/postgres`, the nested array is typed from the subquery:

```typescript
const withPosts = await db
  .selectFrom('users')
  .selectAll('users')
  .select((eb) => [
    jsonArrayFrom(
      eb.selectFrom('posts').selectAll('posts').whereRef('posts.author_id', '=', 'users.id')
    ).as('posts'),
  ])
  .executeTakeFirstOrThrow()
// withPosts.posts: { id: number; title: string; published: boolean; author_id: number }[]
```

The interface is the only thing Kysely knows about your database, so if it disagrees with the real tables, the types are wrong without any error. Generating the interface from the database, with a tool such as [kysely-codegen](https://github.com/RobinBlomberg/kysely-codegen), avoids that; Kysely's documentation lists [several type generators](https://kysely.dev/docs/generating-types).

For raw SQL, ``sql`…`.execute(db)`` types the rows as `unknown`, and `sql<T>` trusts the type you give it.

## TypeORM

In TypeORM, entities are classes whose properties you declare in TypeScript and decorate with column and relation options:

```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ unique: true })
  email!: string

  @Column({ type: 'text', nullable: true })
  name!: string | null

  @OneToMany(() => Post, (post) => post.author)
  posts!: Relation<Post>[]
}
```

The property types are what the rest of your code sees, and they don't depend on the query. Wrong value types, misspelled columns in `find` options and misspelled relation names in `relations` were caught. These compiled:

```typescript
// Missing required field: insert(), save() and create() accept partial entities
await users.insert({ name: 'Alice' })

// QueryBuilder conditions are SQL strings
await users
  .createQueryBuilder('user')
  .where('user.emial = :email', { email: 'alice@example.com' })
  .getMany()

// Partial select: still typed as User[]
const subset = await users.find({ select: { id: true, email: true } })
subset[0].name // typed string | null

// Relations: posts is typed Post[] whether or not it was loaded
const withoutPosts = await users.findOneOrFail({ where: { id: 1 } })
withoutPosts.posts.length
```

At runtime, PostgreSQL rejected the insert with `null value in column "email" of relation "user" violates not-null constraint`, and the `QueryBuilder` query failed with a database error. `subset[0].name` was `undefined`, not a string or `null`. `withoutPosts.posts` was `undefined`, so reading `.length` threw a `TypeError`.

The nullability of `name` depends on your declaration. TypeORM doesn't compare the property type with the column options, so this entity compiles although its `name` column is nullable:

```typescript
@Entity()
export class Mismatched {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: 'text', nullable: true })
  name!: string
}
```

For raw SQL, `dataSource.query()` returns `Promise<any>`, and the query builder's `getRawMany()` returns `any[]`. The `QueryBuilder` conditions shown above are SQL fragments too, so, like raw SQL in every library, they aren't checked. See TypeORM's documentation on [find options](https://typeorm.io/docs/working-with-entity-manager/find-options) and the [select query builder](https://typeorm.io/docs/query-builder/select-query-builder).

## Sequelize

The [TypeScript approach recommended for Sequelize 6](https://sequelize.org/docs/v6/other-topics/typescript/) declares each attribute's type on the model class and its column definition in `init()`:

```typescript
export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>
  declare email: string
  declare name: string | null
  declare posts?: NonAttribute<Post[]>
}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: true },
  },
  { sequelize, tableName: 'users' }
)
```

With these declarations, `create()` rejected a missing `email` and a wrong value type, and `findAll({ where })` rejected a misspelled column. Reads are where the types stop following the query:

```typescript
// Partial select: still typed as User[], and attribute names aren't checked
const subset = await User.findAll({ attributes: ['id', 'email'] })
subset[0].name // typed string | null
await User.findAll({ attributes: ['id', 'emial'] })

// The association alias in include isn't checked
await User.findOne({ include: [{ model: Post, as: 'postz' }] })
```

At runtime, `subset[0].name` was `undefined`, the misspelled attribute failed with `column "emial" does not exist`, and the misspelled alias threw an `EagerLoadingError`.

Relations are safer than in TypeORM. Because the documented declaration makes `posts` optional (`NonAttribute<Post[]> | undefined`), reading `posts.length` on a user loaded without its posts doesn't compile:

```typescript
const withoutPosts = await User.findOne({ rejectOnEmpty: true })
withoutPosts.posts.length
// error TS18048: 'withoutPosts.posts' is possibly 'undefined'.
```

The type doesn't narrow when you include posts, though, so the same check (`posts?.length`) is needed after including them. As with TypeORM, a model that declares `name: string` while `init()` sets `allowNull: true` compiles.

For raw SQL, `sequelize.query()` returns `[unknown[], unknown]`. With `type: QueryTypes.SELECT`, it returns `object[]`, or whatever type argument you pass.

## MikroORM

MikroORM 7 recommends [`defineEntity()`](https://mikro-orm.io/docs/define-entity) for defining entities without decorators. The entity types are inferred from the definition:

```typescript
const UserSchema = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    email: p.string().unique(),
    name: p.string().nullable(),
    posts: () => p.oneToMany(Post).mappedBy('author'),
  },
})

export class User extends UserSchema.class {}
UserSchema.setClass(User)
```

Result types track what a query loaded. Partial loading and populated relations are part of the type:

```typescript
const subset = await em.find(User, {}, { fields: ['id', 'email'] })
subset[0].name
// error TS2339: Property 'name' does not exist on type 'Loaded<User, never, "email" | "id", never>'.

const withPosts = await em.findOneOrFail(User, 1, { populate: ['posts'] })
for (const post of withPosts.posts.$) post.title // typed access to a populated collection

const withoutPosts = await em.findOneOrFail(User, 1)
withoutPosts.posts.$
// error TS2339: Property '$' does not exist on type 'Collection<Post, object>'.
```

Misspelled populate hints were rejected, and a many-to-one reference that wasn't populated only exposed its primary key. The gap is that the `posts` collection itself is in the type whether or not it was populated, and its `getItems()` method compiles either way. At runtime, calling it on the unpopulated collection threw `Collection<Post> of entity User[1] not initialized`. The [type-safe relations guide](https://mikro-orm.io/docs/type-safe-relations) describes the `$` accessor and the `Ref` wrapper.

For raw SQL, `em.execute()` types the rows' properties as `any`, and `em.execute<T>()` trusts the type you pass. MikroORM 7 also exposes a [Kysely instance](https://mikro-orm.io/docs/kysely) through `em.getKysely()`, typed from the entity definitions: `selectFrom('user').select(['id', 'email'])` is typed `{ id: number; email: string }[]`.

## Mongoose

Mongoose's documentation recommends [letting it infer types from the schema](https://mongoosejs.com/docs/typescript/schemas.html) instead of writing a separate interface:

```typescript
const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, default: null },
})
userSchema.virtual('posts', { ref: 'Post', localField: '_id', foreignField: 'author' })

export const User = model('User', userSchema)
```

The inferred document type had `email: string` and `name: string | null | undefined`. Wrong value types were rejected in `create()` and, for fields that exist in the schema, in filters. But `create()` accepts partial documents, filters accept keys that aren't in the schema, and query results keep the full document type:

```typescript
await User.create({ name: 'Alice' }) // missing email
await User.find({ emial: 'alice@example.com' }) // misspelled key

const subset = await User.find().select({ email: 1 }).lean()
subset[0].name // typed string | null | undefined

const post = await Post.findOne().populate('author').orFail()
post.author // typed Types.ObjectId
```

At runtime, `create()` failed Mongoose's validation with ``Path `email` is required.`` The misspelled filter didn't fail: Mongoose passed the unknown key to MongoDB, and the query matched no documents instead of one. With the [`strictQuery`](https://mongoosejs.com/docs/guide.html#strictQuery) option set to `'throw'`, the same query threw a `StrictModeError`. `subset[0].name` was `undefined`, and the populated `author` was the user document, not an `ObjectId`.

Mongoose's documentation recommends [passing the populated type as a type argument](https://mongoosejs.com/docs/typescript/populate.html), as in `populate<{ author: UserType }>('author')`. That type isn't checked against the schema: `populate<{ author: { nickname: number } }>('author')` compiled too. The virtual `posts` field isn't part of the inferred type, so it also needs a type argument.

MongoDB has no SQL. Of the equivalent escape hatches, `aggregate()` is typed `any[]`, and the MongoDB driver's collection object returns documents whose properties are typed `any`. `aggregate<T>()` trusts the type you pass.

## Knex.js

Knex is a query builder whose [TypeScript support](https://knexjs.org/guide/#typescript) its documentation describes as best effort. Without any type declarations, queries return `any`. To type tables, you augment its `Tables` interface. `Knex.CompositeTableType` lets you declare a separate type for inserts:

```typescript
declare module 'knex/types/tables.js' {
  interface Tables {
    users: Knex.CompositeTableType<User, Omit<User, 'id' | 'name'> & Partial<Pick<User, 'name'>>>
  }
}
```

With that declaration, inserts without an `email` and inserts with wrong value types were rejected. A table typed with only its row type, `users: User`, accepted an insert without `email`. Selecting columns narrowed the result type to `Pick<User, 'id' | 'email'>[]`.

Knex has no relation model, but joins between declared tables are typed, as long as you select unqualified column names. Table-qualified names, which you need when both tables have a column with the same name, and misspelled names fall back to `any[]` without an error:

```typescript
await knex('users').join('posts', 'posts.author_id', 'users.id').select('email', 'title')
// Pick<User & Post, 'email' | 'title'>[]

await knex('users')
  .join('posts', 'posts.author_id', 'users.id')
  .select('users.email', 'posts.title')
// any[]

await knex('users').where('emial', 'alice@example.com')
// compiles; the object form, where({ emial: … }), is rejected
```

At runtime, the misspelled column failed with `column "emial" does not exist`. Tables you haven't declared in `Tables` are typed `any`, and so is the result of `knex.raw()`, unless you pass a type argument such as `knex.raw<T>()`, which is trusted without being checked.

## Libraries that weren't tested

The 2022 version of this article also covered three libraries that weren't tested this time. Their latest releases on npm are Objection.js 3.1.5 (September 2024), Bookshelf.js 1.2.0 (June 2020) and Waterline 0.15.2 (December 2022). Objection.js and Bookshelf.js are built on Knex, and Waterline is the ORM of the Sails framework. Check their repositories ([Objection.js](https://github.com/Vincit/objection.js), [Bookshelf.js](https://github.com/bookshelf/bookshelf), [Waterline](https://github.com/balderdashy/waterline)) for their current status before starting a new project with them.

## Conclusion

In these tests, the libraries that compute result types from the query caught the most mistakes. Prisma ORM, Drizzle and Kysely caught all six pass/fail checks, and MikroORM caught everything except one way of reading a relation that wasn't loaded. They get there in different ways: Prisma ORM generates types from its own schema language, Drizzle and MikroORM infer them from TypeScript definitions, and Kysely relies on an interface that you write or generate.

Sequelize catches mistakes in writes and filters, and its optional relation properties make you check for `undefined` before using them, but its result types don't follow what a query selected or included. TypeORM and Mongoose accept partial objects on create and return the full model type from queries, so several mistakes in this test compiled and only showed up at runtime, or, in Mongoose's case, as a query that silently matched nothing. Knex's types help once you declare your tables, but joins are only typed when you select unqualified column names, and raw queries are typed `any` unless you pass a type yourself.

Across all eight libraries, the raw query escape hatch is the weakest point. Prefer escape hatches that return `unknown`, validate rows before using them, and use a tool that derives types from the query where one is available.

Keep in mind what a compiler can't check: every one of these libraries trusts a description of the database, whether that's a schema file, table definitions or an interface. If the real database doesn't match it, the types are wrong, so tests against a real database are still necessary. And type safety is one criterion among several. The API style, migrations, database support and the health of the project matter too; the [companion comparison](/database-tools/top-nodejs-orms-query-builders-and-database-libraries) covers popularity and maintenance.

<PostgresCallout />
