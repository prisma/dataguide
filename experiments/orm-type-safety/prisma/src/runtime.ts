import assert from 'node:assert/strict'
import { prisma } from './model.js'
import { record, finish } from './helper.js'
try {
  const alice = await prisma.user.create({ data: { email: 'alice@lab.invalid', name: null } })
  await prisma.post.create({ data: { title: 'seed', authorId: alice.id } })
  const subset = await prisma.user.findMany({ select: { id: true, email: true } })
  assert.deepEqual(Object.keys(subset[0]).sort(), ['email', 'id'])
  record('partial select', {
    keys: Object.keys(subset[0]),
    nameType: typeof (subset[0] as unknown as { name?: unknown }).name,
  })
  const unloaded = await prisma.user.findUniqueOrThrow({ where: { id: alice.id } })
  assert.equal(Object.hasOwn(unloaded, 'posts'), false)
  assert.equal(unloaded.name, null)
  const loaded = await prisma.user.findUniqueOrThrow({
    where: { id: alice.id },
    include: { posts: true },
  })
  assert.equal(loaded.posts[0].title, 'seed')
  assert.equal(loaded.posts[0].published, false)
  record('relations and nullable', {
    unloadedKeys: Object.keys(unloaded),
    loadedTitles: loaded.posts.map((p) => p.title),
    name: unloaded.name,
  })
  const raw = await prisma.$queryRaw`SELECT id, email, name FROM "User"`
  assert.ok(Array.isArray(raw))
  record('raw rows', raw)
} finally {
  await prisma.$disconnect()
}
finish()
