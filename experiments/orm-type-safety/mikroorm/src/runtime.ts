import assert from 'node:assert/strict'
import { User, Post, initialize } from './model.js'
import { failure, record, finish } from './helper.js'
const orm = await initialize()
try {
  await orm.schema.refresh()
  const em = orm.em.fork()
  const alice = em.create(User, { email: 'alice@lab.invalid', name: null })
  em.create(Post, { title: 'seed', author: alice })
  await em.flush()
  const subset = await orm.em.fork().find(User, {}, { fields: ['id', 'email'] })
  assert.equal((subset[0] as unknown as { name?: unknown }).name, undefined)
  record('partial select', {
    keys: Object.keys(subset[0]),
    nameType: typeof (subset[0] as unknown as { name?: unknown }).name,
  })
  const unloaded = await orm.em.fork().findOneOrFail(User, alice.id)
  await failure(
    'uninitialized collection getItems compiles',
    async () => unloaded.posts.getItems(),
    (e) => e instanceof Error && e.message.includes('not initialized')
  )
  assert.equal(unloaded.name, null)
  const loaded = await orm.em.fork().findOneOrFail(User, alice.id, { populate: ['posts'] })
  assert.equal(loaded.posts.$[0].title, 'seed')
  assert.equal(loaded.posts.$[0].published, false)
  record('relations and nullable', {
    loadedTitles: loaded.posts.$.map((p) => p.title),
    name: unloaded.name,
  })
  record('raw rows', await em.execute('SELECT id, email, name FROM users'))
  const kyselySubset = await em.getKysely().selectFrom('users').select(['id', 'email']).execute()
  assert.deepEqual(Object.keys(kyselySubset[0]).sort(), ['email', 'id'])
  record('entity-derived Kysely selection', kyselySubset)
} finally {
  await orm.close(true)
}
finish()
