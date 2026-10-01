import { db } from './model.js'
import { sql } from 'kysely'
import { jsonArrayFrom } from 'kysely/helpers/postgres'
import { expectType, type Equal } from './helper.js'
export async function checks() {
  // CASE required
  // @ts-expect-error missing required email
  await db.insertInto('users').values({ name: 'missing' }).execute()
  await db.insertInto('users').values({ email: 'positive@lab.invalid', name: null }).execute()
  // CASE value
  // @ts-expect-error boolean accepts no string
  await db.insertInto('posts').values({ title: 'wrong', published: 'yes', author_id: 1 }).execute()
  await db
    .insertInto('posts')
    .values({ title: 'positive', published: true, author_id: 1 })
    .execute()
  // CASE filter
  // @ts-expect-error misspelled column
  await db.selectFrom('users').selectAll().where('emial', '=', 'alice@lab.invalid').execute()
  await db.selectFrom('users').selectAll().where('email', '=', 'alice@lab.invalid').execute()
  // CASE select
  const subset = await db.selectFrom('users').select(['id', 'email']).execute()
  expectType<Equal<typeof subset, { id: number; email: string }[]>>()
  // @ts-expect-error unselected field absent
  subset[0].name
  // CASE relations
  const withoutPosts = await db.selectFrom('users').selectAll().executeTakeFirstOrThrow()
  // @ts-expect-error unselected subquery result absent
  withoutPosts.posts
  const withPosts = await db
    .selectFrom('users')
    .selectAll('users')
    .select((eb) => [
      jsonArrayFrom(
        eb.selectFrom('posts').selectAll().whereRef('posts.author_id', '=', 'users.id')
      ).as('posts'),
    ])
    .executeTakeFirstOrThrow()
  expectType<Equal<(typeof withPosts.posts)[number]['title'], string>>()
  // CASE nullable
  expectType<Equal<typeof withoutPosts.name, string | null>>()
  // @ts-expect-error null must be handled
  withoutPosts.name.toUpperCase()
  withoutPosts.name?.toUpperCase()
  // CASE raw
  const raw = await sql`SELECT id, email, name FROM users`.execute(db)
  expectType<Equal<(typeof raw.rows)[number], unknown>>()
  const trusted = await sql<{ nickname: number }>`SELECT id, email, name FROM users`.execute(db)
  expectType<Equal<(typeof trusted.rows)[number], { nickname: number }>>()
}
