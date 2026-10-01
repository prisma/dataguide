import assert from 'node:assert/strict'
import { EagerLoadingError } from 'sequelize'
import { User, Post, sequelize, Mismatched } from './model.js'
import { failure, state, record, finish } from './helper.js'
try {
  await sequelize.sync({ force: true })
  const alice = await User.create({ email: 'alice@lab.invalid', name: null })
  await Post.create({ title: 'seed', authorId: alice.id })
  const subset = await User.findAll({ attributes: ['id', 'email'] })
  assert.equal(subset[0].name, undefined)
  record('partial select remains full entity type', {
    keys: Object.keys(subset[0].toJSON()),
    nameType: typeof subset[0].name,
  })
  await failure(
    'misspelled selected attribute compiles',
    () => User.findAll({ attributes: ['id', 'emial'] }),
    state('42703')
  )
  await failure(
    'misspelled relation alias compiles',
    () => User.findOne({ include: [{ model: Post, as: 'postz' }] }),
    (e) => e instanceof EagerLoadingError
  )
  const unloaded = await User.findByPk(alice.id, { rejectOnEmpty: true })
  assert.equal(unloaded.posts, undefined)
  assert.equal(unloaded.name, null)
  const loaded = await User.findByPk(alice.id, {
    include: [{ model: Post, as: 'posts' }],
    rejectOnEmpty: true,
  })
  assert.equal(loaded.posts![0].title, 'seed')
  assert.equal(loaded.posts![0].published, false)
  record('relations and nullable', {
    unloadedKeys: Object.keys(unloaded.toJSON()),
    loadedTitles: loaded.posts?.map((p) => p.title),
    name: unloaded.name,
  })
  const mismatch = await Mismatched.create({ name: null as unknown as string })
  assert.equal(mismatch.name, null)
  record('nullable schema with nonnullable declaration', { value: mismatch.name })
  record('raw rows', (await sequelize.query('SELECT id, email, name FROM users'))[0])
} finally {
  await sequelize.close()
}
finish()
