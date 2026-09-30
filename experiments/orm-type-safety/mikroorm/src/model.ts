import { localConnection } from './helper.js'
import { defineEntity, p } from '@mikro-orm/core'
import { MikroORM } from '@mikro-orm/postgresql'
const UserSchema = defineEntity({
  name: 'User',
  tableName: 'users',
  properties: {
    id: p.integer().primary(),
    email: p.string().unique(),
    name: p.string().nullable(),
    posts: () => p.oneToMany(Post).mappedBy('author'),
  },
})
export class User extends UserSchema.class {}
UserSchema.setClass(User)
const PostSchema = defineEntity({
  name: 'Post',
  tableName: 'posts',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    published: p.boolean().default(false),
    author: () => p.manyToOne(User).ref().inversedBy('posts'),
  },
})
export class Post extends PostSchema.class {}
PostSchema.setClass(Post)
export const initialize = () =>
  MikroORM.init({
    entities: [UserSchema, PostSchema],
    clientUrl: localConnection('EXPERIMENT_DATABASE_URL'),
  })
