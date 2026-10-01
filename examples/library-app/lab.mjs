import pg from 'pg'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { randomUUID, createHash } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import {
  borrow,
  tenantTransaction,
  createLibraryServer,
  retrieve,
  executeReadPlan,
} from './library.ts'

const postgresImage =
  'postgres@sha256:5a5a84b19854a9ffaa54082c166ff4ec27473a361e496e5ea167f298f2da9722'
const poolerImage =
  'edoburu/pgbouncer@sha256:b17551c776ef7e5769ef80b956d20f85e2fd25dd8912d31d58f782aad495b711'
const id = randomUUID().slice(0, 8)
const databaseName = `dg-library-${id}`
const poolerName = `dg-pooler-${id}`
const network = `dg-library-net-${id}`
const docker = (args, input) =>
  execFileSync('docker', args, { input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
const report = {
  startedAt: new Date().toISOString(),
  postgresImage,
  poolerImage,
  sources: [
    'lab.mjs',
    'library.ts',
    'schema.sql',
    'package.json',
    'package-lock.json',
    'tsconfig.json',
  ].map((file) => ({
    file,
    sha256: createHash('sha256')
      .update(readFileSync(new URL(file, import.meta.url)))
      .digest('hex'),
  })),
  checks: [],
  status: 'failed',
}
const resources = []
const pools = []
let server
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const test = async (name, fn) => {
  await fn()
  report.checks.push(name)
  console.log(`PASS ${name}`)
}
const expectState = async (promise, code) => assert.rejects(promise, (error) => error.code === code)
const makePool = (config) => {
  const pool = new pg.Pool({
    host: '127.0.0.1',
    port,
    database: 'postgres',
    user: 'library_app',
    password: 'disposable-library-password',
    max: 4,
    connectionTimeoutMillis: 1000,
    query_timeout: 3000,
    ...config,
  })
  pools.push(pool)
  return pool
}
let port

try {
  docker(['network', 'create', network])
  resources.push(['network', 'rm', network])
  docker([
    'run',
    '--rm',
    '-d',
    '--name',
    databaseName,
    '--network',
    network,
    '-e',
    'POSTGRES_PASSWORD=disposable-admin-password',
    '-p',
    '127.0.0.1::5432',
    postgresImage,
    'postgres',
    '-c',
    'wal_level=logical',
  ])
  resources.push(['rm', '-f', databaseName])
  let ready = false
  for (let i = 0; i < 100; i++) {
    try {
      docker(['exec', databaseName, 'pg_isready', '-h', '127.0.0.1'])
      ready = true
      break
    } catch {
      await pause(100)
    }
  }
  assert.ok(ready, 'database startup timed out')
  port = Number(docker(['port', databaseName, '5432/tcp']).trim().split(':').at(-1))
  const schema = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8')
  docker(
    ['exec', '-i', databaseName, 'psql', '-U', 'postgres', '-X', '-v', 'ON_ERROR_STOP=1'],
    schema
  )
  const admin = makePool({ user: 'postgres', password: 'disposable-admin-password' })
  const app = makePool({ max: 1 })
  report.databaseVersion = (await admin.query('SELECT version()')).rows[0].version
  report.schemaSha256 = createHash('sha256').update(schema).digest('hex')
  report.runtime = process.version
  await test('clean schema/seed versions and restricted HTTP application', async () => {
    const versions = (
      await app.query(
        'SELECT (SELECT version FROM library.schema_version) AS schema, (SELECT version FROM library.seed_version) AS seed'
      )
    ).rows[0]
    assert.deepEqual(versions, { schema: 1, seed: 1 })
    let cutResponse = true
    server = createLibraryServer(app, {
      dropCommittedResponse: (key) => {
        if (key === 'transport-failure' && cutResponse) {
          cutResponse = false
          return true
        }
        return false
      },
    })
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    const url = `http://127.0.0.1:${server.address().port}`
    assert.equal((await fetch(`${url}/books`)).status, 401)
    const alpha = await (
      await fetch(`${url}/books`, {
        headers: { Authorization: 'Bearer lab-alpha', 'X-Tenant': 'beta' },
      })
    ).json()
    assert.deepEqual(
      alpha.map((row) => row.title),
      ['Ulysses']
    )
    const headers = { Authorization: 'Bearer lab-alpha', 'Idempotency-Key': 'http-request' }
    const first = await (await fetch(`${url}/borrow/1`, { method: 'POST', headers })).json()
    const retry = await (await fetch(`${url}/borrow/1`, { method: 'POST', headers })).json()
    assert.deepEqual(retry, first)
    const before = alpha[0].copies - 1
    const failureHeaders = {
      Authorization: 'Bearer lab-alpha',
      'Idempotency-Key': 'transport-failure',
    }
    await assert.rejects(
      fetch(`${url}/borrow/1`, { method: 'POST', headers: failureHeaders }),
      /fetch failed/
    )
    const reconnected = await (
      await fetch(`${url}/borrow/1`, { method: 'POST', headers: failureHeaders })
    ).json()
    assert.equal(reconnected.copies, before - 1)
    assert.equal(
      (
        await admin.query(
          "SELECT count(*)::int AS n FROM library.requests WHERE key='transport-failure'"
        )
      ).rows[0].n,
      1
    )
  })
  await test('adversarial tenant reads/writes, owner boundary and reused connections', async () => {
    assert.equal((await app.query('SELECT * FROM library.books')).rowCount, 0)
    await expectState(
      tenantTransaction(app, 'alpha', (c) =>
        c.query("INSERT INTO library.books VALUES ('beta', 99, 'forbidden', 1, 1)")
      ),
      '42501'
    )
    assert.equal(
      (
        await tenantTransaction(app, 'alpha', (c) =>
          c.query("UPDATE library.books SET title='forbidden' WHERE tenant_id='beta'")
        )
      ).rowCount,
      0
    )
    assert.deepEqual(
      (
        await tenantTransaction(app, 'beta', (c) => c.query('SELECT title FROM library.books'))
      ).rows.map((r) => r.title),
      ['Private beta book']
    )
    assert.equal((await app.query('SELECT * FROM library.books')).rowCount, 0)
    const owner = await admin.connect()
    try {
      await owner.query('SET ROLE library_owner')
      assert.equal((await owner.query('SELECT * FROM library.books')).rowCount, 0)
      await owner.query('RESET ROLE')
      assert.equal((await owner.query('SELECT * FROM library.books')).rowCount, 2) // explicit superuser bypass control
    } finally {
      owner.release()
    }
    await expectState(app.query('SET ROLE library_owner'), '42501')
    await expectState(app.query('DROP TABLE library.books'), '42501')
  })
  await test('same HTTP application across schema and database tenant isolation', async () => {
    const strategies = []
    for (const strategy of ['schema', 'database']) {
      const targets = new Map()
      const migrationTargets = []
      for (const tenant of ['alpha', 'beta']) {
        const role = `${strategy}_${tenant}`
        const namespace = strategy === 'schema' ? `tenant_${tenant}` : 'library'
        await admin.query(`CREATE ROLE ${role} LOGIN PASSWORD 'disposable-tenant-password'`)
        let database = 'postgres'
        if (strategy === 'database') {
          database = `tenant_${tenant}`
          await admin.query(`CREATE DATABASE ${database}`)
          await admin.query(`REVOKE CONNECT ON DATABASE ${database} FROM PUBLIC`)
          await admin.query(`GRANT CONNECT ON DATABASE ${database} TO ${role}`)
        }
        const migration = makePool({
          database,
          user: 'postgres',
          password: 'disposable-admin-password',
        })
        // Reuse the same migration and synthetic seed; global roles already exist.
        const provision = schema
          .replace(/^CREATE ROLE .*;\n/gm, '')
          .replaceAll('library_app', role)
          .replaceAll('library.', `${namespace}.`)
          .replace('CREATE SCHEMA library ', `CREATE SCHEMA ${namespace} `)
          .replace('ON SCHEMA library ', `ON SCHEMA ${namespace} `)
          .replace('IN SCHEMA library ', `IN SCHEMA ${namespace} `)
        await migration.query(provision)
        await migration.query(`DELETE FROM ${namespace}.books WHERE tenant_id<>$1`, [tenant])
        await migration.query(`DELETE FROM ${namespace}.documents WHERE tenant_id<>$1`, [tenant])
        const restricted = makePool({
          database,
          user: role,
          password: 'disposable-tenant-password',
          max: 1,
        })
        targets.set(tenant, { pool: restricted, schema: namespace })
        migrationTargets.push({ pool: migration, schema: namespace })
        if (strategy === 'schema' && tenant === 'beta') {
          await expectState(
            targets.get('alpha').pool.query('SELECT * FROM tenant_beta.books'),
            '42501'
          )
        }
      }
      if (strategy === 'database') {
        const crossed = makePool({
          database: 'tenant_beta',
          user: 'database_alpha',
          password: 'disposable-tenant-password',
        })
        await expectState(crossed.query('SELECT 1'), '42501')
      }
      const alternateServer = createLibraryServer(targets)
      await new Promise((resolve) => alternateServer.listen(0, '127.0.0.1', resolve))
      try {
        const url = `http://127.0.0.1:${alternateServer.address().port}`
        for (const tenant of ['alpha', 'beta', 'alpha']) {
          const headers = {
            Authorization: `Bearer lab-${tenant}`,
            'X-Tenant': tenant === 'alpha' ? 'beta' : 'alpha',
            'Idempotency-Key': 'isolated-borrow',
          }
          const books = await (await fetch(`${url}/books`, { headers })).json()
          assert.deepEqual(
            books.map((row) => row.title),
            [tenant === 'alpha' ? 'Ulysses' : 'Private beta book']
          )
          const first = await (await fetch(`${url}/borrow/1`, { method: 'POST', headers })).json()
          const replay = await (await fetch(`${url}/borrow/1`, { method: 'POST', headers })).json()
          assert.deepEqual(replay, first)
          assert.equal(first.copies, tenant === 'alpha' ? 9 : 19)
        }
        // A tenant-wide additive migration uses owner credentials, separately from runtime.
        for (const target of migrationTargets) {
          await target.pool.query(
            `BEGIN; ALTER TABLE ${target.schema}.books ADD COLUMN shelf text; UPDATE ${target.schema}.schema_version SET version=2; COMMIT`
          )
          assert.equal(
            (await target.pool.query(`SELECT version FROM ${target.schema}.schema_version`)).rows[0]
              .version,
            2
          )
        }
        strategies.push({
          strategy,
          tenants: [...targets.keys()],
          schemaVersionAfterMigration: 2,
          crossTenantDenied: true,
        })
      } finally {
        await new Promise((resolve) => alternateServer.close(resolve))
      }
    }
    report.tenantStrategies = strategies
  })
  await test('lost updates and corrected atomic/optimistic invariants', async () => {
    const two = makePool({ max: 2 })
    const a = await two.connect(),
      b = await two.connect()
    try {
      for (const c of [a, b]) {
        await c.query('BEGIN')
        await c.query("SELECT set_config('app.tenant_id','alpha',true)")
      }
      const readA = (await a.query('SELECT copies,version FROM library.books WHERE id=1')).rows[0]
      const readB = (await b.query('SELECT copies,version FROM library.books WHERE id=1')).rows[0]
      await a.query('UPDATE library.books SET copies=$1 WHERE id=1', [readA.copies - 1])
      await a.query('COMMIT')
      await b.query('UPDATE library.books SET copies=$1 WHERE id=1', [readB.copies - 1])
      await b.query('COMMIT')
      const after = (
        await tenantTransaction(app, 'alpha', (c) =>
          c.query('SELECT copies FROM library.books WHERE id=1')
        )
      ).rows[0].copies
      assert.equal(after, readA.copies - 1) // two requests lost one decrement
      const correction = makePool({ max: 2 })
      await Promise.all(
        [1, 2].map(() =>
          tenantTransaction(correction, 'alpha', (c) =>
            c.query('UPDATE library.books SET copies=copies-1 WHERE id=1')
          )
        )
      )
      assert.equal(
        (
          await tenantTransaction(app, 'alpha', (c) =>
            c.query('SELECT copies FROM library.books WHERE id=1')
          )
        ).rows[0].copies,
        after - 2
      )
      const version = (
        await tenantTransaction(app, 'alpha', (c) =>
          c.query('SELECT version FROM library.books WHERE id=1')
        )
      ).rows[0].version
      const attempts = await Promise.all(
        [1, 2].map(() =>
          tenantTransaction(correction, 'alpha', (c) =>
            c.query('UPDATE library.books SET version=version+1 WHERE id=1 AND version=$1', [
              version,
            ])
          )
        )
      )
      assert.equal(
        attempts.reduce((sum, r) => sum + r.rowCount, 0),
        1
      )
    } finally {
      for (const c of [a, b]) {
        await c.query('ROLLBACK')
        c.release()
      }
    }
  })
  await test('serialization rejection, full-transaction retry and idempotent unknown outcome', async () => {
    const two = makePool({ max: 2 })
    const a = await two.connect(),
      b = await two.connect()
    try {
      for (const c of [a, b]) {
        await c.query('BEGIN ISOLATION LEVEL SERIALIZABLE')
        await c.query("SELECT set_config('app.tenant_id','alpha',true)")
        await c.query('SELECT copies FROM library.books WHERE id=1')
      }
      await a.query('UPDATE library.books SET version=version+1 WHERE id=1')
      await a.query('COMMIT')
      await expectState(b.query('UPDATE library.books SET version=version+1 WHERE id=1'), '40001')
      await b.query('ROLLBACK')
      await b.query('BEGIN ISOLATION LEVEL SERIALIZABLE')
      await b.query("SELECT set_config('app.tenant_id','alpha',true)")
      await b.query('UPDATE library.books SET version=version+1 WHERE id=1')
      await b.query('COMMIT')
    } finally {
      for (const c of [a, b]) {
        await c.query('ROLLBACK')
        c.release()
      }
    }
    const first = await borrow(app, 'alpha', 'unknown-outcome', 1)
    // Discard the response to a committed operation, then reconnect and retry the same key.
    const replayPool = makePool()
    assert.deepEqual(await borrow(replayPool, 'alpha', 'unknown-outcome', 1), first)
    const same = await Promise.all([1, 2].map(() => borrow(two, 'alpha', 'parallel-key', 1)))
    assert.deepEqual(same[0], same[1])
    await assert.rejects(borrow(app, 'alpha', 'unknown-outcome', 2), /different operation/)
  })
  await test('deadlock SQLSTATE with controlled two-client interleaving', async () => {
    await admin.query("INSERT INTO library.books VALUES ('alpha',2,'Second book',10,1)")
    const two = makePool({ max: 2 })
    const a = await two.connect(),
      b = await two.connect()
    try {
      for (const c of [a, b]) {
        await c.query('BEGIN')
        await c.query("SELECT set_config('app.tenant_id','alpha',true)")
      }
      await a.query('UPDATE library.books SET version=version+1 WHERE id=1')
      await b.query('UPDATE library.books SET version=version+1 WHERE id=2')
      const waiting = a.query('UPDATE library.books SET version=version+1 WHERE id=2')
      const outcomes = await Promise.allSettled([
        waiting,
        b.query('UPDATE library.books SET version=version+1 WHERE id=1'),
      ])
      assert.equal(
        outcomes.filter((r) => r.status === 'rejected' && r.reason.code === '40P01').length,
        1
      )
    } finally {
      for (const c of [a, b]) {
        await c.query('ROLLBACK')
        c.release()
      }
    }
  })
  await test('outbox atomicity, crash replay, consumer deduplication and checkpoint', async () => {
    // A deliberately unsafe dual write leaves a committed business update with no event.
    await tenantTransaction(app, 'alpha', (c) =>
      c.query('UPDATE library.books SET version=version+1 WHERE id=1')
    )
    const eventsBeforeFailure = (await admin.query('SELECT count(*)::int AS n FROM library.outbox'))
      .rows[0].n
    await assert.rejects(
      Promise.reject(new Error('external publish unavailable')),
      /external publish unavailable/
    )
    assert.equal(
      (await admin.query('SELECT count(*)::int AS n FROM library.outbox')).rows[0].n,
      eventsBeforeFailure
    )
    await assert.rejects(
      tenantTransaction(app, 'alpha', async (c) => {
        await c.query('UPDATE library.books SET copies=copies-1 WHERE id=1')
        await c.query(
          'INSERT INTO library.outbox(tenant_id,payload) VALUES(\'alpha\',\'{"type":"rolled-back"}\')'
        )
        throw new Error('crash before commit')
      }),
      /crash before commit/
    )
    assert.equal(
      (
        await admin.query(
          "SELECT count(*)::int AS n FROM library.outbox WHERE payload->>'type'='rolled-back'"
        )
      ).rows[0].n,
      0
    )
    const event = (
      await tenantTransaction(app, 'alpha', (c) =>
        c.query('SELECT * FROM library.outbox WHERE NOT acknowledged ORDER BY id LIMIT 1')
      )
    ).rows[0]
    const deliver = () =>
      tenantTransaction(app, 'alpha', (c) =>
        c.query(
          'INSERT INTO library.deliveries(tenant_id,event_id,payload) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',
          ['alpha', event.id, event.payload]
        )
      )
    await deliver() // simulated crash after durable effect, before acknowledgement
    assert.equal((await deliver()).rowCount, 0)
    await tenantTransaction(app, 'alpha', (c) =>
      c.query('UPDATE library.outbox SET acknowledged=true WHERE id=$1', [event.id])
    )
    assert.equal(
      (
        await admin.query('SELECT count(*)::int AS n FROM library.deliveries WHERE event_id=$1', [
          event.id,
        ])
      ).rows[0].n,
      1
    )
    const future = (
      await admin.query(
        'INSERT INTO library.outbox(tenant_id,payload,schema_version) VALUES(\'alpha\',\'{"type":"future"}\',2) RETURNING id'
      )
    ).rows[0]
    const consume = (version) => {
      if (version !== 1) throw new Error('Unsupported event schema')
    }
    assert.throws(() => consume(2), /Unsupported event schema/)
    assert.equal(
      (await admin.query('SELECT acknowledged FROM library.outbox WHERE id=$1', [future.id]))
        .rows[0].acknowledged,
      false
    )
    await admin.query('DELETE FROM library.outbox WHERE acknowledged AND schema_version=1')
    assert.equal((await deliver()).rowCount, 0) // retained deduplication survives outbox retention
  })
  await test('logical decoding replay, checkpoint, ordering and slot cleanup', async () => {
    await admin.query(
      "SELECT * FROM pg_create_logical_replication_slot('dg_outbox', 'test_decoding')"
    )
    const a = await admin.connect(),
      b = await admin.connect()
    try {
      await a.query('BEGIN')
      await b.query('BEGIN')
      const firstId = (
        await a.query(
          'INSERT INTO library.outbox(tenant_id,payload) VALUES(\'alpha\',\'{"type":"allocated-first"}\') RETURNING id'
        )
      ).rows[0].id
      const secondId = (
        await b.query(
          'INSERT INTO library.outbox(tenant_id,payload) VALUES(\'alpha\',\'{"type":"committed-first"}\') RETURNING id'
        )
      ).rows[0].id
      assert.ok(BigInt(firstId) < BigInt(secondId))
      await b.query('COMMIT')
      await a.query('COMMIT')
      const peek = async () =>
        (
          await admin.query(
            "SELECT lsn::text, data FROM pg_logical_slot_peek_changes('dg_outbox',NULL,NULL)"
          )
        ).rows
      const one = await peek(),
        replay = await peek()
      assert.deepEqual(replay, one)
      const text = one.map((row) => row.data).join('\n')
      assert.ok(text.includes('library.outbox'))
      assert.ok(text.indexOf('committed-first') < text.indexOf('allocated-first'))
      const retained = (
        await admin.query(
          "SELECT restart_lsn::text, confirmed_flush_lsn::text, pg_wal_lsn_diff(pg_current_wal_lsn(),restart_lsn)::text AS retained_bytes FROM pg_replication_slots WHERE slot_name='dg_outbox'"
        )
      ).rows[0]
      assert.ok(retained.restart_lsn)
      assert.ok(Number(retained.retained_bytes) >= 0)
      const consumed = (
        await admin.query(
          "SELECT lsn::text, data FROM pg_logical_slot_get_changes('dg_outbox',NULL,NULL)"
        )
      ).rows
      assert.deepEqual(consumed, one)
      assert.equal((await peek()).length, 0)
      report.logicalDecoding = {
        plugin: 'test_decoding',
        events: one,
        retainedBeforeAcknowledgement: retained,
      }
    } finally {
      for (const client of [a, b]) {
        await client.query('ROLLBACK')
        client.release()
      }
      await admin.query("SELECT pg_drop_replication_slot('dg_outbox')")
      assert.equal(
        (await admin.query("SELECT * FROM pg_replication_slots WHERE slot_name='dg_outbox'"))
          .rowCount,
        0
      )
    }
  })
  await test('permission-aware retrieval and bounded generated plans', async () => {
    const evaluation = []
    const corpus = [
      { query: 'backup', vector: [1, 0], relevantId: 1 },
      { query: 'restore lost records', vector: [1, 0], relevantId: 1 },
      { query: 'request congestion', vector: [0.6, 0.8], relevantId: 3 },
      { query: 'calendar', vector: [1, 0], relevantId: 2 }, // deliberately wrong semantic signal
    ]
    for (const item of corpus)
      for (const mode of ['lexical', 'vector', 'hybrid']) {
        const start = performance.now()
        const results = await retrieve(app, 'alpha', item.query, item.vector, mode)
        if (item.query === 'backup') assert.equal(results[0].id, 1)
        assert.ok(results.every((r) => !r.body.includes('Private')))
        evaluation.push({
          mode,
          query: item.query,
          relevantId: item.relevantId,
          firstId: results[0].id,
          precisionAt1: Number(results[0].id === item.relevantId),
          recallAt1: Number(results[0].id === item.relevantId),
          elapsedMs: performance.now() - start,
          externalModelCalls: 0,
          providerCost: null,
        })
      }
    assert.ok(
      evaluation.some((row) => row.precisionAt1 === 0),
      'evaluation must expose an actual failure case'
    )
    report.retrieval = evaluation
    assert.throws(
      () => executeReadPlan(app, 'alpha', { operation: 'DROP TABLE books', limit: 1 }),
      /rejected/
    )
    assert.throws(
      () => executeReadPlan(app, 'alpha', { operation: 'listBooks', limit: 100000 }),
      /rejected/
    )
    assert.throws(() => executeReadPlan(app, 'alpha', 'SELECT pg_sleep(100)'), /Invalid plan/)
    assert.ok(
      (await executeReadPlan(app, 'alpha', { operation: 'listBooks', limit: 2 })).every(
        (r) => !r.title.includes('Private')
      )
    )
  })
  await test('isolated developer/agent schemas and mismatch detection', async () => {
    for (const actor of ['developer_one', 'developer_two', 'coding_agent']) {
      await admin.query(`CREATE ROLE ${actor} LOGIN PASSWORD 'disposable-environment-password'`)
      await admin.query(`CREATE DATABASE ${actor} OWNER ${actor}`)
      await admin.query(`REVOKE CONNECT ON DATABASE ${actor} FROM PUBLIC`)
      const isolated = makePool({
        database: actor,
        user: actor,
        password: 'disposable-environment-password',
      })
      await isolated.query(
        'CREATE TABLE environment_version(schema_version int, seed_version int); INSERT INTO environment_version VALUES(1,1); CREATE TABLE private_change(value text)'
      )
      await isolated.query('INSERT INTO private_change VALUES($1)', [actor])
      assert.deepEqual((await isolated.query('SELECT value FROM private_change')).rows, [
        { value: actor },
      ])
      await isolated.query('UPDATE environment_version SET seed_version=2')
      assert.equal(
        (
          await isolated.query(
            'SELECT schema_version=seed_version AS compatible FROM environment_version'
          )
        ).rows[0].compatible,
        false
      )
    }
    const wrongEnvironment = makePool({
      database: 'developer_two',
      user: 'developer_one',
      password: 'disposable-environment-password',
    })
    await expectState(wrongEnvironment.query('SELECT 1'), '42501')
  })
  await test('connection budget burst exposes acquisition time and saturation', async () => {
    const burst = makePool({ max: 2, connectionTimeoutMillis: 80 })
    const metrics = {
      clients: 10,
      poolMax: 2,
      completed: 0,
      errors: 0,
      acquisitionMs: [],
      peakBackends: 0,
    }
    const start = performance.now()
    await Promise.all(
      Array.from({ length: metrics.clients }, async () => {
        const entered = performance.now()
        let client
        try {
          client = await burst.connect()
          metrics.acquisitionMs.push(performance.now() - entered)
          metrics.peakBackends = Math.max(metrics.peakBackends, burst.totalCount)
          await client.query('SELECT pg_sleep(0.2)')
          metrics.completed++
        } catch {
          metrics.errors++
        } finally {
          client?.release()
        }
      })
    )
    metrics.elapsedMs = performance.now() - start
    metrics.throughputPerSecond = metrics.completed / (metrics.elapsedMs / 1000)
    assert.equal(metrics.peakBackends, 2)
    assert.ok(metrics.errors > 0)
    assert.equal(metrics.completed + metrics.errors, 10)
    report.burst = metrics
  })
  // Actual pooler protocol/session tests are deliberately separate from the direct pool.
  docker([
    'run',
    '--rm',
    '-d',
    '--name',
    poolerName,
    '--network',
    network,
    '-p',
    '127.0.0.1::5432',
    '-e',
    `DB_HOST=${databaseName}`,
    '-e',
    'DB_NAME=postgres',
    '-e',
    'DB_USER=library_app',
    '-e',
    'DB_PASSWORD=disposable-library-password',
    '-e',
    'AUTH_TYPE=scram-sha-256',
    '-e',
    'POOL_MODE=transaction',
    '-e',
    'MAX_PREPARED_STATEMENTS=100',
    '-e',
    'DEFAULT_POOL_SIZE=2',
    poolerImage,
  ])
  resources.push(['rm', '-f', poolerName])
  const poolerPort = Number(docker(['port', poolerName, '5432/tcp']).trim().split(':').at(-1))
  const pooled = makePool({ port: poolerPort, max: 4 })
  let connected = false
  let lastPoolerError
  for (let i = 0; i < 50; i++) {
    try {
      await pooled.query('SELECT 1')
      connected = true
      break
    } catch (error) {
      lastPoolerError = error.message
      await pause(100)
    }
  }
  assert.ok(connected, `PgBouncer startup failed: ${lastPoolerError}`)
  report.poolerVersion = docker(['exec', poolerName, 'pgbouncer', '--version']).trim()
  await test('protocol prepared statements survive conflicting client names, backend reassignment and recycling', async () => {
    const clients = await Promise.all(Array.from({ length: 4 }, () => pooled.connect()))
    const queries = clients.map((_, index) => ({
      name: 'shared-statement-name',
      text: `SELECT $1::integer + ${index * 100} AS value, pg_backend_pid() AS pid, pg_sleep(0.02)`,
      values: [42],
    }))
    const pids = new Set()
    try {
      const first = (await clients[0].query(queries[0])).rows[0]
      assert.equal(first.value, 42)
      await clients[1].query('BEGIN')
      const held = (await clients[1].query('SELECT pg_backend_pid() AS pid')).rows[0].pid
      assert.equal(held, first.pid, 'second client must hold the first prepared statement backend')
      const reassigned = (await clients[0].query(queries[0])).rows[0]
      assert.notEqual(
        reassigned.pid,
        first.pid,
        'prepared client must execute on a different backend'
      )
      assert.equal(reassigned.value, 42)
      await clients[1].query('COMMIT')
      for (let round = 0; round < 3; round++) {
        const rows = await Promise.all(
          clients.map(
            async (client, index) =>
              (await client.query({ ...queries[index], values: [round] })).rows[0]
          )
        )
        rows.forEach((row, index) => {
          assert.equal(row.value, round + index * 100)
          pids.add(row.pid)
        })
      }
      assert.equal(pids.size, 2, 'four concurrent clients must share two backends')
      for (const pid of pids)
        assert.equal(
          (await admin.query('SELECT pg_terminate_backend($1) AS terminated', [pid])).rows[0]
            .terminated,
          true
        )
      await pause(100)
      // A simple query establishes fresh backends before reusing the clients' cached named statements.
      await Promise.all(clients.map((client) => client.query('SELECT 1')))
      const recycled = await Promise.all(
        clients.map(async (client, index) => (await client.query(queries[index])).rows[0])
      )
      recycled.forEach((row, index) => {
        assert.equal(row.value, 42 + index * 100)
        assert.ok(!pids.has(row.pid))
      })
      report.preparedStatements = {
        clients: 4,
        backends: 2,
        conflictingName: 'shared-statement-name',
        originalPid: first.pid,
        reassignedPid: reassigned.pid,
        recycledPids: recycled.map((row) => row.pid),
      }
    } finally {
      await clients[1].query('ROLLBACK')
      clients.forEach((client) => client.release())
    }
  })
  await test('transaction tenant state stays scoped to each transaction', async () => {
    for (const tenant of ['alpha', 'beta', 'alpha']) {
      const rows = (
        await tenantTransaction(pooled, tenant, (c) =>
          c.query('SELECT tenant_id FROM library.books')
        )
      ).rows
      assert.ok(rows.length > 0 && rows.every((row) => row.tenant_id === tenant))
    }
    assert.equal((await pooled.query('SELECT * FROM library.books')).rowCount, 0)
    await expectState(
      tenantTransaction(pooled, 'alpha', (c) =>
        c.query("INSERT INTO library.books VALUES('beta',100,'forbidden',1,1)")
      ),
      '42501'
    )
  })
  const disabledName = `${poolerName}-disabled`
  docker([
    'run',
    '--rm',
    '-d',
    '--name',
    disabledName,
    '--network',
    network,
    '-p',
    '127.0.0.1::5432',
    '-e',
    `DB_HOST=${databaseName}`,
    '-e',
    'DB_NAME=postgres',
    '-e',
    'DB_USER=library_app',
    '-e',
    'DB_PASSWORD=disposable-library-password',
    '-e',
    'AUTH_TYPE=scram-sha-256',
    '-e',
    'POOL_MODE=transaction',
    '-e',
    'MAX_PREPARED_STATEMENTS=0',
    '-e',
    'DEFAULT_POOL_SIZE=1',
    poolerImage,
  ])
  resources.push(['rm', '-f', disabledName])
  const disabledPort = Number(docker(['port', disabledName, '5432/tcp']).trim().split(':').at(-1))
  const disabled = makePool({ port: disabledPort, max: 2 })
  let disabledReady = false
  for (let i = 0; i < 50; i++) {
    try {
      await disabled.query('SELECT 1')
      disabledReady = true
      break
    } catch {
      await pause(100)
    }
  }
  assert.ok(disabledReady, 'disabled-feature pooler startup failed')
  await test('disabled prepared statement tracking rejects conflicting names and fails after backend recycling', async () => {
    const clients = await Promise.all([disabled.connect(), disabled.connect()])
    const query = {
      name: 'negative-control-name',
      text: 'SELECT $1::integer AS value, pg_backend_pid() AS pid',
      values: [42],
    }
    try {
      const first = (await clients[0].query(query)).rows[0]
      assert.equal(first.value, 42)
      await expectState(
        clients[1].query({ ...query, text: 'SELECT $1::integer + 1 AS value' }),
        '42P05'
      )
      assert.equal(
        (await admin.query('SELECT pg_terminate_backend($1) AS terminated', [first.pid])).rows[0]
          .terminated,
        true
      )
      await pause(100)
      const next = (await clients[0].query('SELECT pg_backend_pid() AS pid')).rows[0].pid
      assert.notEqual(next, first.pid)
      await expectState(clients[0].query(query), '26000')
      report.preparedStatements.disabledControl = {
        maxPreparedStatements: 0,
        conflictingNameSqlstate: '42P05',
        recycledBackendSqlstate: '26000',
        originalPid: first.pid,
        recycledPid: next,
      }
    } finally {
      clients.forEach((client) => client.release())
    }
  })
  report.status = 'passed'
} finally {
  if (server) await new Promise((resolve) => server.close(resolve))
  for (const pool of pools) await pool.end()
  for (const command of resources.reverse()) docker(command)
  assert.equal(
    docker(['ps', '-a', '--filter', `name=dg-library-${id}`, '--format', '{{.Names}}']).trim(),
    ''
  )
  assert.equal(
    docker(['ps', '-a', '--filter', `name=dg-pooler-${id}`, '--format', '{{.Names}}']).trim(),
    ''
  )
  report.cleanedUp = true
  report.completedAt = new Date().toISOString()
  mkdirSync(new URL('./.verification-runs/', import.meta.url), { recursive: true })
  writeFileSync(
    new URL('./.verification-runs/library.json', import.meta.url),
    `${JSON.stringify(report, null, 2)}\n`
  )
}
