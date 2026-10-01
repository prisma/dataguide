import { localConnection } from './helper.js'
import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { pgTable, serial, text, boolean, integer } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
})
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  published: boolean('published').notNull().default(false),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id),
})
export const userRelations = relations(users, ({ many }) => ({ posts: many(posts) }))
export const postRelations = relations(posts, ({ one }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
}))
export const pool = new pg.Pool({ connectionString: localConnection('EXPERIMENT_DATABASE_URL') })
export const db = drizzle(pool, { schema: { users, posts, userRelations, postRelations } })
