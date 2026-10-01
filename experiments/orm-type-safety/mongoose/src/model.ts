import { localConnection } from './helper.js'
import mongoose, { Schema, model } from 'mongoose'
const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, default: null },
})
userSchema.virtual('posts', { ref: 'Post', localField: '_id', foreignField: 'author' })
const postSchema = new Schema({
  title: { type: String, required: true },
  published: { type: Boolean, default: false },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
})
export const User = model('User', userSchema)
export const Post = model('Post', postSchema)
export { mongoose }
