import assert from 'node:assert/strict'
import { source, users, posts } from './model.js'
import { failure, state, record, finish } from './helper.js'
await source.initialize()
try {
  await source.synchronize()
  const alice = await users.save({ email: 'alice@lab.invalid', name: null })
  await posts.save({ title: 'seed', author: alice })
  await failure(
    'missing required email compiles',
    () => users.insert({ name: 'missing' }),
    state('23502')
  )
  await failure(
    'save with missing email compiles',
    () => users.save({ name: 'missing' }),
    state('23502')
  )
  await users.insert({ email: 'positive@lab.invalid' })
  await failure(
    'SQL string filter compiles',
    () =>
      users
        .createQueryBuilder('account')
        .where('account.emial = :email', { email: alice.email })
        .getMany(),
    state('42703')
  )
  assert.equal((await users.find({ where: { email: alice.email } })).length, 1)
  const subset = await users.find({ select: { id: true, email: true } })
  assert.equal(subset[0].name, undefined)
  record('partial select remains full entity type', {
    keys: Object.keys(subset[0]),
    nameType: typeof subset[0].name,
  })
  const unloaded = await users.findOneOrFail({ where: { id: alice.id } })
  await failure(
    'unloaded posts access compiles',
    async () => unloaded.posts.length,
    (e) => e instanceof TypeError
  )
  assert.equal(unloaded.name, null)
  const loaded = await users.findOneOrFail({ where: { id: alice.id }, relations: { posts: true } })
  assert.equal(loaded.posts[0].title, 'seed')
  assert.equal(loaded.posts[0].published, false)
  record('relations and nullable', {
    unloadedKeys: Object.keys(unloaded),
    loadedTitles: loaded.posts.map((p) => p.title),
    name: unloaded.name,
  })
  record('raw rows', await source.query('SELECT id, email, name FROM users'))
} finally {
  await source.destroy()
}
finish()
