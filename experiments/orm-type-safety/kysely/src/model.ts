import { localConnection } from './helper.js'
import pg from 'pg'
import { Kysely, PostgresDialect, type Generated } from 'kysely'
export interface Database {
  users: { id: Generated<number>; email: string; name: string | null }
  posts: { id: Generated<number>; title: string; published: Generated<boolean>; author_id: number }
}
export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new pg.Pool({ connectionString: localConnection('EXPERIMENT_DATABASE_URL') }),
  }),
})
