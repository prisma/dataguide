import assert from 'node:assert/strict'
import { db, users, posts, pool } from './model.js'
import { eq, sql } from 'drizzle-orm'
import { record, finish } from './helper.js'
try {
  const [alice] = await db
    .insert(users)
    .values({ email: 'alice@lab.invalid', name: null })
    .returning()
  await db.insert(posts).values({ title: 'seed', authorId: alice.id })
  await db.insert(users).values({ email: 'without-posts@lab.invalid' })
  const subset = await db.select({ id: users.id, email: users.email }).from(users)
  assert.deepEqual(Object.keys(subset[0]).sort(), ['email', 'id'])
  record('partial select', {
    keys: Object.keys(subset[0]),
    nameType: typeof (subset[0] as unknown as { name?: unknown }).name,
  })
  const relationalSubset = await db.query.users.findMany({ columns: { id: true, email: true } })
  assert.deepEqual(Object.keys(relationalSubset[0]).sort(), ['email', 'id'])
  const filtered = await db.query.users.findMany({
    where: (user, { eq }) => eq(user.email, alice.email),
  })
  assert.equal(filtered.length, 1)
  const joined = await db.select().from(users).leftJoin(posts, eq(posts.authorId, users.id))
  assert.equal(joined.find((row) => row.users.email === 'without-posts@lab.invalid')?.posts, null)
  record('relational select, filter and nullable left join', { relationalSubset, joined })
  const unloaded = (await db.query.users.findFirst({ where: eq(users.id, alice.id) }))!
  assert.equal(Object.hasOwn(unloaded, 'posts'), false)
  assert.equal(unloaded.name, null)
  const loaded = (await db.query.users.findFirst({
    where: eq(users.id, alice.id),
    with: { posts: true },
  }))!
  assert.equal(loaded.posts[0].title, 'seed')
  assert.equal(loaded.posts[0].published, false)
  record('relations and nullable', {
    unloadedKeys: Object.keys(unloaded),
    loadedTitles: loaded.posts.map((p) => p.title),
    name: unloaded.name,
  })
  const raw = await db.execute(sql`SELECT id, email, name FROM users`)
  record('raw rows', raw.rows)
} finally {
  await pool.end()
}
finish()
