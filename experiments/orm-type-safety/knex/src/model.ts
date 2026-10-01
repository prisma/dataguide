import { localConnection } from './helper.js'
import knex, { type Knex } from 'knex'
export interface User {
  id: number
  email: string
  name: string | null
}
export interface Post {
  id: number
  title: string
  published: boolean
  author_id: number
}
declare module 'knex/types/tables.js' {
  interface Tables {
    users: Knex.CompositeTableType<User, Omit<User, 'id' | 'name'> & Partial<Pick<User, 'name'>>>
    users_row_only: User
    posts: Knex.CompositeTableType<
      Post,
      Omit<Post, 'id' | 'published'> & Partial<Pick<Post, 'published'>>
    >
  }
}
export const db = knex({ client: 'pg', connection: localConnection('EXPERIMENT_DATABASE_URL') })
