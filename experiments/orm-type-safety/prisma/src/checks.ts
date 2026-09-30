import { prisma } from './model.js'
import { expectType, type Equal } from './helper.js'

export async function checks() {
  // CASE required
  // @ts-expect-error missing required email
  await prisma.user.create({ data: { name: 'missing' } })
  await prisma.user.create({ data: { email: 'positive@lab.invalid' } })
  // CASE value
  // @ts-expect-error boolean accepts no string
  await prisma.post.create({ data: { title: 'wrong', published: 'yes', authorId: 1 } })
  await prisma.post.create({ data: { title: 'positive', published: true, authorId: 1 } })
  // CASE filter
  // @ts-expect-error misspelled column
  await prisma.user.findMany({ where: { emial: 'alice@lab.invalid' } })
  await prisma.user.findMany({ where: { email: 'alice@lab.invalid' } })
  // CASE select
  const subset = await prisma.user.findMany({ select: { id: true, email: true } })
  expectType<Equal<typeof subset, { id: number; email: string }[]>>()
  // @ts-expect-error an unselected field is absent
  subset[0].name
  // CASE relations
  const withoutPosts = await prisma.user.findFirstOrThrow()
  // @ts-expect-error unloaded relation absent
  withoutPosts.posts
  const withPosts = await prisma.user.findFirstOrThrow({ include: { posts: true } })
  expectType<Equal<(typeof withPosts.posts)[number]['title'], string>>()
  // @ts-expect-error misspelled relation
  await prisma.user.findMany({ include: { postz: true } })
  // CASE nullable
  expectType<Equal<typeof withoutPosts.name, string | null>>()
  // @ts-expect-error null must be handled
  withoutPosts.name.toUpperCase()
  withoutPosts.name?.toUpperCase()
  // CASE raw
  const raw = await prisma.$queryRaw`SELECT id, email, name FROM "User"`
  expectType<Equal<typeof raw, unknown>>()
}
