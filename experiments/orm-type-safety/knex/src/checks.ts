import { db, type User, type Post } from './model.js'
import { expectType, type Equal, type IsAny } from './helper.js'
export async function checks() {
  // CASE required
  // @ts-expect-error explicit insertion type requires email
  await db('users').insert({ name: 'missing' })
  await db('users').insert({ email: 'positive@lab.invalid' })
  await db('users_row_only').insert({ name: 'missing' })
  // CASE value
  // @ts-expect-error boolean accepts no string
  await db('posts').insert({ title: 'wrong', published: 'yes', author_id: 1 })
  await db('posts').insert({ title: 'positive', published: true, author_id: 1 })
  // CASE filter
  // @ts-expect-error misspelled object filter
  await db('users').where({ emial: 'alice@lab.invalid' })
  await db('users').where({ email: 'alice@lab.invalid' })
  await db('users').where('emial', 'alice@lab.invalid')
  // CASE select
  const subset = await db('users').select('id', 'email')
  expectType<Equal<typeof subset, Pick<User, 'id' | 'email'>[]>>()
  // @ts-expect-error unselected field absent
  subset[0].name
  // CASE relations
  const joined = await db('users')
    .join('posts', 'posts.author_id', 'users.id')
    .select('email', 'title')
  expectType<Equal<typeof joined, Pick<User & Post, 'email' | 'title'>[]>>()
  const qualified = await db('users')
    .join('posts', 'posts.author_id', 'users.id')
    .select('users.email', 'posts.title')
  expectType<IsAny<(typeof qualified)[number]>>()
  const misspelled = await db('users').select('users.emial')
  expectType<IsAny<(typeof misspelled)[number]>>()
  // CASE nullable
  const user = await db('users')
    .first()
    .then((row) => row!)
  expectType<Equal<typeof user.name, string | null>>()
  // @ts-expect-error null must be handled with the correct interface
  user.name.toUpperCase()
  user.name?.toUpperCase()
  // CASE raw
  const raw = await db.raw('SELECT id, email, name FROM users')
  expectType<IsAny<typeof raw>>()
  const trusted = await db.raw<{ nickname: number }[]>('SELECT id, email, name FROM users')
  expectType<Equal<typeof trusted, { nickname: number }[]>>()
  const undeclared = await db('comments').select('body')
  expectType<IsAny<(typeof undeclared)[number]>>()
}
