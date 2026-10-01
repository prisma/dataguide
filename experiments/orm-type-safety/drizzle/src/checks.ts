import { db, users, posts } from './model.js'
import { eq, sql } from 'drizzle-orm'
import { expectType, type Equal } from './helper.js'

export async function checks() {
  // CASE required
  // @ts-expect-error missing required email
  await db.insert(users).values({ name: 'missing' })
  await db.insert(users).values({ email: 'positive@lab.invalid' })
  // CASE value
  // @ts-expect-error boolean accepts no string
  await db.insert(posts).values({ title: 'wrong', published: 'yes', authorId: 1 })
  await db.insert(posts).values({ title: 'positive', published: true, authorId: 1 })
  // CASE filter
  // @ts-expect-error misspelled column
  await db.select().from(users).where(eq(users.emial, 'alice@lab.invalid'))
  await db.select().from(users).where(eq(users.email, 'alice@lab.invalid'))
  // @ts-expect-error relational callback has the same typed columns
  await db.query.users.findMany({ where: (user, { eq }) => eq(user.emial, 'alice@lab.invalid') })
  await db.query.users.findMany({ where: (user, { eq }) => eq(user.email, 'alice@lab.invalid') })
  // CASE select
  const subset = await db.select({ id: users.id, email: users.email }).from(users)
  expectType<Equal<typeof subset, { id: number; email: string }[]>>()
  // @ts-expect-error unselected field absent
  subset[0].name
  const relationalSubset = await db.query.users.findMany({ columns: { id: true, email: true } })
  expectType<Equal<typeof relationalSubset, { id: number; email: string }[]>>()
  // CASE relations
  const withoutPosts = (await db.query.users.findFirst())!
  // @ts-expect-error unloaded relation absent
  withoutPosts.posts
  const withPosts = (await db.query.users.findFirst({ with: { posts: true } }))!
  expectType<Equal<(typeof withPosts.posts)[number]['title'], string>>()
  const joined = await db.select().from(users).leftJoin(posts, eq(posts.authorId, users.id))
  expectType<Equal<(typeof joined)[number]['posts'], typeof posts.$inferSelect | null>>()
  // @ts-expect-error misspelled relation
  await db.query.users.findFirst({ with: { postz: true } })
  // CASE nullable
  expectType<Equal<typeof withoutPosts.name, string | null>>()
  // @ts-expect-error null must be handled
  withoutPosts.name.toUpperCase()
  withoutPosts.name?.toUpperCase()
  // CASE raw
  const raw = await db.execute(sql`SELECT id, email, name FROM users`)
  expectType<Equal<(typeof raw.rows)[number], Record<string, unknown>>>()
  const trusted = await db.select({ email: sql<number>`${users.email}` }).from(users)
  expectType<Equal<typeof trusted, { email: number }[]>>()
}
