import pg from 'pg'
import type { PoolClient } from 'pg'
import { createServer } from 'node:http'

export type DatabaseTarget = pg.Pool | ReadonlyMap<string, { pool: pg.Pool; schema: string }>

export const tenantTransaction = async <T>(
  target: DatabaseTarget,
  tenant: string,
  work: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const connection =
    target instanceof pg.Pool ? { pool: target, schema: 'library' } : target.get(tenant)
  if (!connection) throw new Error('Unknown tenant')
  // Schema identifiers come from trusted provisioning, never request strings.
  if (!/^[a-z][a-z0-9_]*$/.test(connection.schema)) throw new Error('Invalid provisioned schema')
  const client = await connection.pool.connect()
  let discard = false
  try {
    await client.query('BEGIN')
    await client.query("SELECT set_config('search_path', $1, true)", [connection.schema])
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenant])
    const result = await work(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch {
      discard = true
    }
    throw error
  } finally {
    client.release(discard)
  }
}

// The key and business operation are committed with the result and outbox event.
// A retry of an unknown outcome returns the recorded result, not another decrement.
export const borrow = (pool: DatabaseTarget, tenant: string, key: string, bookId: number) =>
  tenantTransaction(pool, tenant, async (client) => {
    // Serialize a tenant/key pair, including the first request before a row exists.
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [
      `${tenant}:${key}`,
    ])
    const previous = await client.query('SELECT book_id, result FROM requests WHERE key=$1', [key])
    if (previous.rowCount) {
      if (previous.rows[0].book_id !== bookId)
        throw new Error('Idempotency key reused for a different operation')
      return previous.rows[0].result
    }
    const book = await client.query(
      'UPDATE books SET copies=copies-1, version=version+1 WHERE id=$1 AND copies>0 RETURNING id, copies, version',
      [bookId]
    )
    if (!book.rowCount) throw new Error('Book unavailable')
    const result = book.rows[0]
    await client.query('INSERT INTO requests(tenant_id,key,book_id,result) VALUES($1,$2,$3,$4)', [
      tenant,
      key,
      bookId,
      result,
    ])
    await client.query('INSERT INTO outbox(tenant_id,payload) VALUES($1,$2)', [
      tenant,
      { type: 'borrowed', bookId, version: result.version },
    ])
    return result
  })

// Synthetic bearer tokens represent authenticated principals in this local lab.
// Production must derive the tenant from trusted authentication, not a caller's tenant header.
export const createLibraryServer = (
  pool: DatabaseTarget,
  options: { dropCommittedResponse?: (key: string) => boolean } = {}
) =>
  createServer(async (request, response) => {
    const principals: Record<string, string> = {
      'Bearer lab-alpha': 'alpha',
      'Bearer lab-beta': 'beta',
    }
    const tenant = principals[request.headers.authorization || '']
    response.setHeader('Content-Type', 'application/json')
    if (!tenant) {
      response.writeHead(401).end(JSON.stringify({ error: 'Unauthorized' }))
      return
    }
    try {
      if (request.method === 'GET' && request.url === '/books') {
        const books = await tenantTransaction(pool, tenant, (client) =>
          client.query('SELECT id,title,copies,version FROM books ORDER BY id')
        )
        response.end(JSON.stringify(books.rows))
      } else if (request.method === 'POST' && request.url === '/borrow/1') {
        const key = request.headers['idempotency-key']
        if (typeof key !== 'string' || key.length < 1 || key.length > 100) {
          response.writeHead(400).end(JSON.stringify({ error: 'Idempotency-Key required' }))
          return
        }
        const result = await borrow(pool, tenant, key, 1)
        // A local fault hook lets the lab cut the transport after durable commit.
        if (options.dropCommittedResponse?.(key)) {
          response.destroy()
          return
        }
        response.end(JSON.stringify(result))
      } else response.writeHead(404).end(JSON.stringify({ error: 'Not found' }))
    } catch {
      response.writeHead(409).end(JSON.stringify({ error: 'Operation rejected' }))
    }
  })

// All retrieval methods receive only rows authorized by the database policy.
// The vectors are hand-authored, normalized, two-dimensional teaching data.
export const retrieve = (
  pool: DatabaseTarget,
  tenant: string,
  query: string,
  vector: number[],
  mode: 'lexical' | 'vector' | 'hybrid'
) =>
  tenantTransaction(pool, tenant, async (client) => {
    const rows = await client.query('SELECT id,body,embedding FROM documents')
    return rows.rows
      .map((row) => {
        const lexical = query
          .toLowerCase()
          .split(/\s+/)
          .filter((word) => row.body.toLowerCase().includes(word)).length
        const semantic = row.embedding.reduce(
          (sum: number, value: number, i: number) => sum + value * (vector[i] || 0),
          0
        )
        return {
          id: row.id,
          body: row.body,
          score: mode === 'lexical' ? lexical : mode === 'vector' ? semantic : lexical + semantic,
        }
      })
      .sort((a, b) => b.score - a.score || a.id - b.id)
  })

// No arbitrary generated SQL is executed. A validated plan selects a fixed template.
export const executeReadPlan = (pool: DatabaseTarget, tenant: string, plan: unknown) => {
  if (!plan || typeof plan !== 'object' || !('operation' in plan) || !('limit' in plan))
    throw new Error('Invalid plan')
  const { operation, limit } = plan
  if (
    operation !== 'listBooks' ||
    typeof limit !== 'number' ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 20
  )
    throw new Error('Query budget or operation rejected')
  return tenantTransaction(pool, tenant, async (client) => {
    await client.query('SET TRANSACTION READ ONLY')
    await client.query("SET LOCAL statement_timeout = '500ms'")
    return (await client.query('SELECT id,title FROM books ORDER BY id LIMIT $1', [limit])).rows
  })
}
