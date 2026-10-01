import assert from 'node:assert/strict'
import { db } from './model.js'
import { sql } from 'kysely'
import { jsonArrayFrom } from 'kysely/helpers/postgres'
import { record, finish } from './helper.js'
try {
  const alice = await db
    .insertInto('users')
    .values({ email: 'alice@lab.invalid', name: null })
    .returningAll()
    .executeTakeFirstOrThrow()
  await db.insertInto('posts').values({ title: 'seed', author_id: alice.id }).execute()
  const subset = await db.selectFrom('users').select(['id', 'email']).execute()
  assert.deepEqual(Object.keys(subset[0]).sort(), ['email', 'id'])
  record('partial select', {
    keys: Object.keys(subset[0]),
    nameType: typeof (subset[0] as unknown as { name?: unknown }).name,
  })
  const unloaded = await db.selectFrom('users').selectAll().executeTakeFirstOrThrow()
  assert.equal(Object.hasOwn(unloaded, 'posts'), false)
  assert.equal(unloaded.name, null)
  const loaded = await db
    .selectFrom('users')
    .selectAll('users')
    .select((eb) => [
      jsonArrayFrom(
        eb.selectFrom('posts').selectAll().whereRef('posts.author_id', '=', 'users.id')
      ).as('posts'),
    ])
    .executeTakeFirstOrThrow()
  assert.equal(loaded.posts[0].title, 'seed')
  assert.equal(loaded.posts[0].published, false)
  record('relations and nullable', {
    unloadedKeys: Object.keys(unloaded),
    loadedTitles: loaded.posts.map((p) => p.title),
    name: unloaded.name,
  })
  record('raw rows', (await sql`SELECT id, email, name FROM users`.execute(db)).rows)
} finally {
  await db.destroy()
}
finish()
