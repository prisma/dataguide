import { User, Post } from './model.js'
import { Types } from 'mongoose'
import { expectType, type Equal, type IsAny } from './helper.js'
export async function checks() {
  // CASE required
  await User.create({ name: 'missing' })
  await User.create({ email: 'positive@lab.invalid' })
  // CASE value
  // @ts-expect-error boolean accepts no string
  await Post.create({ title: 'wrong', published: 'yes', author: new Types.ObjectId() })
  await Post.create({ title: 'positive', published: true, author: new Types.ObjectId() })
  // @ts-expect-error filter value for a schema field accepts no string
  await Post.find({ published: 'yes' })
  await Post.find({ published: true })
  // CASE filter
  await User.find({ emial: 'alice@lab.invalid' })
  await User.find({ email: 'alice@lab.invalid' })
  // CASE select
  const subset = await User.find().select({ email: 1 }).lean()
  expectType<Equal<(typeof subset)[number]['name'], string | null | undefined>>()
  // CASE relations
  const withAuthor = await Post.findOne().populate('author').orFail()
  expectType<Equal<typeof withAuthor.author, Types.ObjectId>>()
  await Post.findOne().populate<{ author: { nickname: number } }>('author').orFail()
  const withPosts = await User.findOne().populate('posts').orFail()
  // @ts-expect-error the posts virtual is not part of the inferred type
  withPosts.posts
  const typedPosts = await User.findOne().populate<{ posts: { title: string }[] }>('posts').orFail()
  expectType<Equal<(typeof typedPosts.posts)[number]['title'], string>>()
  // CASE nullable
  const user = await User.findOne().orFail()
  expectType<Equal<typeof user.name, string | null | undefined>>()
  // @ts-expect-error null/undefined must be handled
  user.name.toUpperCase()
  user.name?.toUpperCase()
  // CASE raw
  const raw = await User.aggregate([{ $match: {} }])
  expectType<IsAny<(typeof raw)[number]>>()
  const trusted = await User.aggregate<{ nickname: number }>([{ $match: {} }])
  expectType<Equal<typeof trusted, { nickname: number }[]>>()
  const driverRows = await User.collection.find({}).toArray()
  expectType<IsAny<(typeof driverRows)[number]['email']>>()
}
