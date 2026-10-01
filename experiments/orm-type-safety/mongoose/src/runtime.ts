import assert from 'node:assert/strict'
import { User, Post, mongoose } from './model.js'
import { failure, localConnection, record, finish } from './helper.js'
await mongoose.connect(localConnection('EXPERIMENT_MONGO_URL'))
try {
  await User.init()
  const alice = await User.create({ email: 'alice@lab.invalid' })
  await Post.create({ title: 'seed', author: alice._id })
  await failure(
    'missing required email compiles',
    () => User.create({ name: 'missing' }),
    (e) => e instanceof mongoose.Error.ValidationError
  )
  await User.create({ email: 'positive@lab.invalid' })
  const typo = await User.find({ emial: alice.email })
  assert.equal(typo.length, 0)
  assert.equal((await User.find({ email: alice.email })).length, 1)
  record('misspelled filter silently matches nothing', {
    misspelledCount: typo.length,
    correctCount: 1,
  })
  await failure(
    'strictQuery positive policy rejects typo',
    () => User.find({ emial: alice.email }).setOptions({ strictQuery: 'throw' }).exec(),
    (e) => e instanceof mongoose.Error.StrictModeError
  )
  const subset = await User.find().select({ email: 1 }).lean()
  assert.equal(subset[0].name, undefined)
  record('partial select retains full inferred document type', {
    keys: Object.keys(subset[0]),
    nameType: typeof subset[0].name,
  })
  const unloaded = await Post.findOne().orFail()
  assert.ok(unloaded.author instanceof mongoose.Types.ObjectId)
  const loaded = await Post.findOne().populate('author').orFail()
  assert.equal(loaded.author instanceof mongoose.Types.ObjectId, false)
  const actual = loaded.author as unknown as { email: string }
  assert.equal(actual.email, alice.email)
  assert.equal(alice.name, null)
  record('populated reference differs from inferred ObjectId', {
    unloadedIsObjectId: true,
    populatedIsObjectId: false,
    populatedEmail: actual.email,
    name: alice.name,
  })
  record('raw aggregate rows', await User.aggregate([{ $match: { email: alice.email } }]))
  record('raw driver rows', await User.collection.find({ email: alice.email }).toArray())
} finally {
  await mongoose.disconnect()
}
finish()
