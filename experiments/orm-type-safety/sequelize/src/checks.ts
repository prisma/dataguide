import { User, Post, sequelize, type Mismatched } from './model.js'
import { expectType, type Equal } from './helper.js'
import { QueryTypes } from 'sequelize'
export async function checks() {
  // CASE required
  // @ts-expect-error missing required email
  await User.create({ name: 'missing' })
  await User.create({ email: 'positive@lab.invalid', name: null })
  // CASE value
  // @ts-expect-error boolean accepts no string
  await Post.create({ title: 'wrong', published: 'yes', authorId: 1 })
  await Post.create({ title: 'positive', published: true, authorId: 1 })
  // CASE filter
  // @ts-expect-error misspelled object filter
  await User.findAll({ where: { emial: 'alice@lab.invalid' } })
  await User.findAll({ where: { email: 'alice@lab.invalid' } })
  // CASE select
  const subset = await User.findAll({ attributes: ['id', 'email'] })
  expectType<Equal<typeof subset, User[]>>()
  subset[0].name
  await User.findAll({ attributes: ['id', 'emial'] })
  // CASE relations
  const withoutPosts = await User.findOne({ rejectOnEmpty: true })
  // @ts-expect-error optional relation requires narrowing
  withoutPosts.posts.length
  const withPosts = await User.findOne({
    include: [{ model: Post, as: 'posts' }],
    rejectOnEmpty: true,
  })
  // @ts-expect-error type does not narrow after including the relation
  withPosts.posts.length
  withPosts.posts?.map((post) => post.title)
  await User.findOne({ include: [{ model: Post, as: 'postz' }] })
  // CASE nullable
  expectType<Equal<typeof withoutPosts.name, string | null>>()
  // @ts-expect-error null must be handled with the correct declaration
  withoutPosts.name.toUpperCase()
  expectType<Equal<Mismatched['name'], string>>()
  // CASE raw
  const raw = await sequelize.query('SELECT id, email, name FROM users')
  expectType<Equal<(typeof raw)[0], unknown[]>>()
  const selectRaw = await sequelize.query('SELECT id, email, name FROM users', {
    type: QueryTypes.SELECT,
  })
  expectType<Equal<typeof selectRaw, object[]>>()
  const trusted = await sequelize.query<{ nickname: number }>('SELECT id, email, name FROM users', {
    type: QueryTypes.SELECT,
  })
  expectType<Equal<typeof trusted, { nickname: number }[]>>()
}
