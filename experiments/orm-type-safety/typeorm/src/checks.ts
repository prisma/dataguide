import { users, posts, source, type User, type Mismatched } from './model.js'
import { expectType, type Equal, type IsAny } from './helper.js'
export async function checks() {
  // CASE required
  await users.insert({ name: 'missing' })
  users.create({ name: 'missing' })
  await users.save({ name: 'missing' })
  await users.insert({ email: 'positive@lab.invalid' })
  // CASE value
  // @ts-expect-error boolean accepts no string
  await posts.insert({ title: 'wrong', published: 'yes', author: { id: 1 } })
  await posts.insert({ title: 'positive', published: true, author: { id: 1 } })
  // CASE filter
  // @ts-expect-error misspelled object filter
  await users.find({ where: { emial: 'alice@lab.invalid' } })
  await users.find({ where: { email: 'alice@lab.invalid' } })
  await users
    .createQueryBuilder('account')
    .where('account.emial = :email', { email: 'alice@lab.invalid' })
    .getMany()
  // CASE select
  const subset = await users.find({ select: { id: true, email: true } })
  expectType<Equal<typeof subset, User[]>>()
  subset[0].name
  // CASE relations
  const withoutPosts = await users.findOneOrFail({ where: { id: 1 } })
  withoutPosts.posts.length
  const withPosts = await users.findOneOrFail({ where: { id: 1 }, relations: { posts: true } })
  expectType<Equal<(typeof withPosts.posts)[number]['title'], string>>()
  // @ts-expect-error misspelled relation
  await users.find({ relations: { postz: true } })
  // CASE nullable
  expectType<Equal<typeof withoutPosts.name, string | null>>()
  // @ts-expect-error null must be handled with the correct declaration
  withoutPosts.name.toUpperCase()
  expectType<Equal<Mismatched['name'], string>>()
  // CASE raw
  const raw = await source.query('SELECT id, email, name FROM users')
  expectType<IsAny<typeof raw>>()
  const rawMany = await users.createQueryBuilder('account').getRawMany()
  expectType<IsAny<(typeof rawMany)[number]>>()
  const trusted = await source.query<{ nickname: number }[]>('SELECT id, email, name FROM users')
  expectType<Equal<typeof trusted, { nickname: number }[]>>()
}
