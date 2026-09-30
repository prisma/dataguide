import assert from 'node:assert/strict'
import { db } from './model.js'
import { failure, state, record, finish } from './helper.js'
try {
  const [alice] = await db('users')
    .insert({ email: 'alice@lab.invalid', name: null })
    .returning('*')
  await db('posts').insert({ title: 'seed', author_id: alice.id })
  await failure(
    'row-only insertion type accepts missing email',
    () => db('users_row_only').insert({ name: 'missing' }),
    state('23502')
  )
  await db('users_row_only').insert({ email: 'positive@lab.invalid' })
  await failure(
    'misspelled string filter compiles',
    () => db('users').where('emial', alice.email),
    state('42703')
  )
  await failure(
    'misspelled qualified select compiles',
    () => db('users').select('users.emial'),
    state('42703')
  )
  assert.equal((await db('users').where({ email: alice.email })).length, 1)
  const subset = await db('users').select('id', 'email')
  assert.deepEqual(Object.keys(subset[0]).sort(), ['email', 'id'])
  record('partial select', {
    keys: Object.keys(subset[0]),
    nameType: typeof (subset[0] as unknown as { name?: unknown }).name,
  })
  const unqualified = await db('users')
    .join('posts', 'posts.author_id', 'users.id')
    .select('email', 'title')
  const qualified = await db('users')
    .join('posts', 'posts.author_id', 'users.id')
    .select('users.email', 'posts.title')
  assert.deepEqual(qualified, unqualified)
  assert.equal(qualified[0].title, 'seed')
  record('qualified join loses types but not runtime values', { unqualified, qualified })
  const full = (await db('users').where({ id: alice.id }).first())!
  assert.equal(full.name, null)
  record('nullable', full.name)
  record('raw rows', (await db.raw('SELECT id, email, name FROM users')).rows)
} finally {
  await db.destroy()
}
finish()
