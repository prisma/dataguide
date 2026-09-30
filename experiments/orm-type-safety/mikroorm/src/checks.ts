import { User, Post, initialize } from './model.js'
import { expectType, type Equal, type IsAny } from './helper.js'
export async function checks() {
  const orm = await initialize()
  const em = orm.em.fork()
  // CASE required
  // @ts-expect-error missing required email
  em.create(User, { name: 'missing' })
  em.create(User, { email: 'positive@lab.invalid' })
  // CASE value
  // @ts-expect-error boolean accepts no string
  em.create(Post, { title: 'wrong', published: 'yes', author: 1 })
  em.create(Post, { title: 'positive', published: true, author: 1 })
  // CASE filter
  // @ts-expect-error misspelled object filter
  await em.find(User, { emial: 'alice@lab.invalid' })
  await em.find(User, { email: 'alice@lab.invalid' })
  // CASE select
  const subset = await em.find(User, {}, { fields: ['id', 'email'] })
  expectType<Equal<(typeof subset)[number]['email'], string>>()
  // @ts-expect-error unselected field absent
  subset[0].name
  // CASE relations
  const withoutPosts = await em.findOneOrFail(User, 1)
  // @ts-expect-error loaded accessor absent on an unpopulated collection
  withoutPosts.posts.$
  withoutPosts.posts.getItems()
  const withPosts = await em.findOneOrFail(User, 1, { populate: ['posts'] })
  const titles = withPosts.posts.$.map((post) => post.title)
  expectType<Equal<(typeof titles)[number], string>>()
  // @ts-expect-error misspelled populate hint
  await em.find(User, {}, { populate: ['postz'] })
  const post = await em.findOneOrFail(Post, 1)
  expectType<Equal<typeof post.author.id, number>>()
  // @ts-expect-error unpopulated Ref exposes no user email
  post.author.email
  // CASE nullable
  expectType<Equal<typeof withoutPosts.name, string | null | undefined>>()
  // @ts-expect-error null/undefined must be handled
  withoutPosts.name.toUpperCase()
  withoutPosts.name?.toUpperCase()
  // CASE raw
  const raw = await em.execute('SELECT id, email, name FROM users')
  expectType<IsAny<(typeof raw)[number]['email']>>()
  const kyselySubset = await em.getKysely().selectFrom('users').select(['id', 'email']).execute()
  expectType<Equal<typeof kyselySubset, { id: number; email: string }[]>>()
}
