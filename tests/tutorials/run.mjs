import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'

export const image =
  'postgres@sha256:5a5a84b19854a9ffaa54082c166ff4ec27473a361e496e5ea167f298f2da9722'
const name = `dg-tutorial-${randomUUID().slice(0, 8)}`
const report = {
  startedAt: new Date().toISOString(),
  image,
  fixtureSha256: createHash('sha256')
    .update(readFileSync(import.meta.filename))
    .digest('hex'),
  articles: [],
  outputs: [],
  checks: [],
  status: 'failed',
}
// Keep raw stdout as evidence; presentation only removes trailing line whitespace.
const presented = (value) =>
  value
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trimEnd()
const docker = (args, input) =>
  execFileSync('docker', args, { input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
let started = false
const sql = (statement, database = 'postgres') =>
  docker(
    [
      'exec',
      '-i',
      name,
      'psql',
      '-X',
      '-q',
      '-v',
      'ON_ERROR_STOP=1',
      '-v',
      'VERBOSITY=verbose',
      '-U',
      'postgres',
      '-d',
      database,
    ],
    statement
  )
const scalar = (statement, database = 'postgres') =>
  docker(
    [
      'exec',
      '-i',
      name,
      'psql',
      '-X',
      '-qAt',
      '-v',
      'ON_ERROR_STOP=1',
      '-U',
      'postgres',
      '-d',
      database,
    ],
    statement
  ).trim()
const check = (label, fn) => {
  fn()
  report.checks.push(label)
  console.log(`PASS ${label}`)
}
const expectedFailure = (statement, state, database) => {
  try {
    sql(statement, database)
  } catch (error) {
    assert.match(error.stderr, new RegExp(`ERROR:\\s+${state}:`))
    return
  }
  throw new Error(`Expected SQLSTATE ${state}: ${statement}`)
}

// Only approved articles are executed. Templates/output are never guessed to be SQL.
const executeArticle = (file, database) => {
  const source = readFileSync(file, 'utf8')
  sql(`CREATE DATABASE ${database};`)
  const blocks = [...source.matchAll(/```([^\n]*)\n([\s\S]*?)```/g)]
  const outputs = []
  let count = 0
  for (let i = 0; i < blocks.length; i++) {
    const [, info, code] = blocks[i]
    if (!/^sql(?:\s|$)/.test(info) || /pseudocode/.test(info)) continue
    if (info.includes('expected-failure')) {
      const state = info.match(/sqlstate=(\w+)/)?.[1]
      assert.ok(state, `${file}: expected failures need a SQLSTATE`)
      expectedFailure(code, state, database)
      count++
      continue
    }
    // The older constraints examples include a success sequence and one rejected write.
    if (file.includes('correctness-constraints')) {
      for (const statement of code
        .replace(/--[^\n]*/g, '')
        .split(';')
        .filter((s) => s.trim())) {
        const state = statement.includes('(4, NULL)')
          ? '23502'
          : statement.includes('10:30:00Z')
            ? '23P01'
            : null
        state ? expectedFailure(`${statement};`, state, database) : sql(`${statement};`, database)
        count++
      }
    } else {
      const output = sql(code, database)
      const next = blocks[i + 1]
      if (next && /^text output/.test(next[1])) {
        report.outputs.push({ file, sql: code, stdout: output })
        if (process.argv.includes('--update-output'))
          outputs.push([next[0], `\`\`\`text output\n${presented(output)}\n\`\`\``])
        else assert.equal(presented(output), presented(next[2]), `${file}: output for ${code}`)
      }
      count++
    }
  }
  let updated = source
  for (const [before, after] of outputs) updated = updated.replace(before, after)
  if (outputs.length) writeFileSync(file, updated)
  report.articles.push({
    file,
    sourceSha256: createHash('sha256').update(updated).digest('hex'),
    executableBlocks: count,
    database,
  })
}

try {
  docker([
    'run',
    '--rm',
    '-d',
    '--name',
    name,
    '-e',
    'POSTGRES_PASSWORD=disposable-tutorial-password',
    '-p',
    '127.0.0.1::5432',
    image,
  ])
  started = true
  let ready = false
  for (let i = 0; i < 100; i++) {
    try {
      docker(['exec', name, 'pg_isready', '-h', '127.0.0.1', '-U', 'postgres'])
      ready = true
      break
    } catch {}
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100)
  }
  assert.ok(ready, 'PostgreSQL startup timed out')
  report.version = scalar('SELECT version();')
  check('every executable dates example and recorded result', () =>
    executeArticle('content/04-postgresql/11-date-types.mdx', 'dates')
  )
  check('every monitoring diagnostic query parses and reads live system views', () => {
    const file = 'content/04-postgresql/13-reading-and-querying-data/04-optimizing-postgresql.mdx'
    const source = readFileSync(file, 'utf8')
    const blocks = [...source.matchAll(/```sql diagnostic\n([\s\S]*?)```/g)]
    for (const [, code] of blocks) report.outputs.push({ file, sql: code, stdout: sql(code) })
    const waitQuery = blocks.find(([, code]) => code.includes('AND wait_event IS NOT NULL'))[1]
    // An idle transaction supplies a real non-null ClientRead event without timing a slow query.
    docker([
      'exec',
      '-i',
      name,
      'sh',
      '-c',
      "(printf 'BEGIN; SELECT 1;\\n'; sleep 15) | PGAPPNAME=diagnostic_wait psql -X -q -U postgres >/tmp/diagnostic-wait.log 2>&1 &",
    ])
    let waiting = false
    for (let i = 0; i < 50; i++) {
      if (
        scalar(
          "SELECT count(*) FROM pg_stat_activity WHERE application_name='diagnostic_wait' AND state='idle in transaction' AND wait_event IS NOT NULL;"
        ) === '1'
      ) {
        waiting = true
        break
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100)
    }
    assert.ok(waiting, 'diagnostic wait control never became visible')
    const waitingOutput = sql(waitQuery)
    assert.match(waitingOutput, /SELECT 1;/)
    assert.match(waitingOutput, /ClientRead/)
    sql(
      "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE application_name='diagnostic_wait';"
    )
    report.articles.push({
      file,
      sourceSha256: createHash('sha256').update(source).digest('hex'),
      executableBlocks: blocks.length,
      scope: 'diagnostic SELECT/SHOW queries only; logging administration excluded',
    })
  })
  check('date subtraction, age and truncation values and types', () => {
    assert.equal(
      scalar(
        "SELECT (DATE '2021-09-27' - DATE '1922-02-02')::text || '|' || pg_typeof(DATE '2021-09-27' - DATE '1922-02-02')::text;"
      ),
      '36397|integer'
    )
    assert.equal(
      scalar("SELECT age(DATE '2000-01-01', DATE '1922-02-02');"),
      '77 years 10 mons 27 days'
    )
    assert.equal(
      scalar("SELECT date_trunc('hour', TIMESTAMP '2022-03-17 02:09:30');"),
      '2022-03-17 02:00:00'
    )
    assert.equal(scalar('SELECT last_checkout = CURRENT_DATE FROM checkouts;', 'dates'), 't')
    assert.equal(
      scalar('SELECT pg_typeof(now()), pg_typeof(now()::date), pg_typeof(current_date);'),
      'timestamp with time zone|date|date'
    )
  })
  check('constraints including precise rejected writes', () =>
    executeArticle('content/02-datamodeling/05-correctness-constraints.mdx', 'constraints')
  )
  check('constraint positive controls', () => {
    assert.equal(scalar('SELECT count(*) FROM default_pairs;', 'constraints'), '2')
    assert.equal(scalar('SELECT count(*) FROM strict_pairs;', 'constraints'), '1')
    assert.equal(scalar('SELECT count(*) FROM branch_books;', 'constraints'), '1')
    assert.equal(
      scalar('SELECT assignee IS NULL FROM tickets WHERE ticket_id = 3;', 'constraints'),
      't'
    )
  })
  check('OID column, constraints, rows and sequences survive plain and archive restore', () => {
    for (const database of ['mydb', 'plain_restore', 'archive_restore'])
      sql(`CREATE DATABASE ${database} TEMPLATE template0;`)
    sql(
      "CREATE TABLE items (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, label text NOT NULL UNIQUE, object_id oid); INSERT INTO items(label, object_id) VALUES ('snapshot', 12345);",
      'mydb'
    )
    docker([
      'exec',
      '-e',
      'PGUSER=postgres',
      name,
      'sh',
      '-ec',
      'pg_dump --help >/tmp/help; pg_dump mydb >/tmp/mydb.sql; pg_dump -Fc --file=/tmp/mydb.dump mydb',
    ])
    sql("INSERT INTO items(label) VALUES ('after snapshot');", 'mydb')
    const restoreStarted = performance.now()
    docker([
      'exec',
      '-e',
      'PGUSER=postgres',
      name,
      'sh',
      '-ec',
      'psql -X -v ON_ERROR_STOP=1 -d plain_restore -f /tmp/mydb.sql; pg_restore --exit-on-error --dbname=archive_restore /tmp/mydb.dump',
    ])
    sql('CREATE ROLE app_smoke;')
    for (const database of ['plain_restore', 'archive_restore']) {
      assert.equal(scalar('SELECT id, label, object_id FROM items;', database), '1|snapshot|12345')
      assert.equal(
        scalar("INSERT INTO items(label) VALUES ('after restore') RETURNING id;", database),
        '2'
      )
      expectedFailure("INSERT INTO items(label) VALUES ('snapshot');", '23505', database)
      expectedFailure('INSERT INTO items(label) VALUES (NULL);', '23502', database)
      sql(
        'GRANT USAGE ON SCHEMA public TO app_smoke; GRANT SELECT, INSERT ON items TO app_smoke; GRANT USAGE ON SEQUENCE items_id_seq TO app_smoke;',
        database
      )
      assert.equal(
        scalar(
          "SET ROLE app_smoke; SELECT label FROM items WHERE id=1; INSERT INTO items(label) VALUES ('application write') RETURNING label;",
          database
        ),
        'snapshot\napplication write'
      )
      assert.equal(
        scalar("SELECT count(*) FROM items WHERE label='after snapshot';", database),
        '0'
      )
    }
    for (const option of [
      '--data-only',
      '--schema-only',
      '--large-objects',
      '--no-large-objects',
      '--table=items',
      '--exclude-table=items',
    ]) {
      docker(['exec', name, 'pg_dump', '-U', 'postgres', option, 'mydb'])
    }
    report.recovery = {
      restoreAndValidationMs: performance.now() - restoreStarted,
      recoveryPoint: 'dump snapshot',
      postSnapshotRowsRecovered: 0,
    }
  })
  check('malformed restore exits nonzero and stops subsequent SQL', () => {
    sql('CREATE DATABASE broken_restore;')
    expectedFailure(
      'CREATE TABLE first_step (id integer); SELECT missing_column; CREATE TABLE never_run(id integer);',
      '42703',
      'broken_restore'
    )
    assert.equal(
      scalar(
        "SELECT to_regclass('first_step') IS NOT NULL, to_regclass('never_run') IS NULL;",
        'broken_restore'
      ),
      't|t'
    )
  })
  check('supported physical base backup restores into a separate server', () => {
    docker([
      'exec',
      '-e',
      'PGPASSWORD=disposable-tutorial-password',
      name,
      'pg_basebackup',
      '-h',
      '127.0.0.1',
      '-U',
      'postgres',
      '-D',
      '/tmp/physical-backup',
      '-X',
      'stream',
      '--checkpoint=fast',
    ])
    docker(['exec', name, 'chown', '-R', 'postgres:postgres', '/tmp/physical-backup'])
    docker([
      'exec',
      '-u',
      'postgres',
      name,
      'pg_ctl',
      '-D',
      '/tmp/physical-backup',
      '-l',
      '/tmp/physical-restore.log',
      '-o',
      '-p 55432 -c listen_addresses=127.0.0.1',
      '-w',
      'start',
    ])
    const restored = docker([
      'exec',
      '-e',
      'PGPASSWORD=disposable-tutorial-password',
      name,
      'psql',
      '-X',
      '-qAt',
      '-h',
      '127.0.0.1',
      '-p',
      '55432',
      '-U',
      'postgres',
      '-d',
      'mydb',
      '-c',
      'SELECT count(*) FROM items;',
    ]).trim()
    assert.equal(restored, '2')
    docker([
      'exec',
      '-u',
      'postgres',
      name,
      'pg_ctl',
      '-D',
      '/tmp/physical-backup',
      '-m',
      'fast',
      '-w',
      'stop',
    ])
  })
  check('verified TLS accepts the correct host and rejects wrong-host certificates', () => {
    docker([
      'exec',
      name,
      'sh',
      '-ec',
      `
      openssl req -x509 -newkey rsa:2048 -nodes -keyout /tmp/server.key -out /tmp/server.crt -days 1 -subj /CN=db.example.test -addext subjectAltName=DNS:db.example.test >/dev/null 2>&1
      chown postgres:postgres /tmp/server.key /tmp/server.crt
      chmod 600 /tmp/server.key
      printf '127.0.0.1 db.example.test wrong.example.test\\n' >> /etc/hosts
      printf 'db.example.test:5432:applicationdb:app_user:disposable-client-password\\n' > /tmp/passfile
      chmod 600 /tmp/passfile
    `,
    ])
    sql("CREATE ROLE app_user LOGIN PASSWORD 'disposable-client-password';")
    sql('CREATE DATABASE applicationdb OWNER app_user;')
    sql('CREATE DATABASE app_user OWNER app_user;')
    sql('ALTER SYSTEM SET ssl = on;')
    sql("ALTER SYSTEM SET ssl_cert_file = '/tmp/server.crt';")
    sql("ALTER SYSTEM SET ssl_key_file = '/tmp/server.key';")
    sql('SELECT pg_reload_conf();')
    const connection =
      'host=db.example.test port=5432 user=app_user dbname=applicationdb sslmode=verify-full sslrootcert=/tmp/server.crt'
    const client = (args, env = []) =>
      docker([
        'exec',
        ...env.flatMap((v) => ['-e', v]),
        '-e',
        'PGPASSFILE=/tmp/passfile',
        name,
        'psql',
        '-X',
        '-qAt',
        ...args,
        '-c',
        'SELECT current_user, current_database();',
      ]).trim()
    assert.equal(client([connection]), 'app_user|applicationdb')
    assert.equal(
      client([
        'postgresql://app_user@db.example.test:5432/applicationdb?sslmode=verify-full&sslrootcert=/tmp/server.crt',
      ]),
      'app_user|applicationdb'
    )
    assert.equal(
      client(
        ['-h', 'db.example.test', '-p', '5432', '-U', 'app_user', '-d', 'applicationdb'],
        ['PGSSLMODE=verify-full', 'PGSSLROOTCERT=/tmp/server.crt']
      ),
      'app_user|applicationdb'
    )
    let wrongHostFailure
    assert.throws(
      () =>
        client([
          connection.replace('host=db.example.test', 'host=wrong.example.test hostaddr=127.0.0.1'),
        ]),
      (error) => {
        wrongHostFailure = error.stderr.trim()
        assert.match(wrongHostFailure, /does not match host name/)
        return true
      }
    )
    // Local socket tests isolate database/user defaults from environment overrides.
    assert.equal(client(['-U', 'app_user']), 'app_user|app_user')
    assert.equal(client(['-U', 'app_user'], ['PGDATABASE=applicationdb']), 'app_user|applicationdb')
    assert.equal(
      client(['-U', 'app_user', '-d', 'applicationdb'], ['PGDATABASE=app_user']),
      'app_user|applicationdb'
    )
    report.connections = {
      wrongHostFailure,
      templates:
        'Remote flags and quoted URI with a temporary protected passfile; local -U/-d/PGDATABASE defaults',
      certificate: 'Disposable self-signed test CA, never provider verification',
    }
  })
  check('physical replication HBA rules do not authorize logical database connections', () => {
    sql("CREATE ROLE replicator LOGIN REPLICATION PASSWORD 'disposable-replication-password';")
    const hba = scalar('SHOW hba_file;')
    const original = docker(['exec', name, 'cat', hba])
    const physical =
      'hostssl replication replicator 127.0.0.1/32 scram-sha-256\nhostssl all replicator 127.0.0.1/32 reject\n'
    docker(['exec', '-i', name, 'sh', '-c', 'cat > "$1"', 'sh', hba], physical + original)
    sql('SELECT pg_reload_conf();')
    const repl = (mode) =>
      docker([
        'exec',
        '-e',
        'PGPASSWORD=disposable-replication-password',
        name,
        'psql',
        '-X',
        '-qAt',
        `host=db.example.test user=replicator dbname=applicationdb replication=${mode} sslmode=verify-full sslrootcert=/tmp/server.crt`,
        '-c',
        'IDENTIFY_SYSTEM;',
      ])
    assert.ok(repl('true').trim())
    assert.throws(() => repl('database'), /pg_hba.conf rejects connection/)
    docker(
      ['exec', '-i', name, 'sh', '-c', 'cat > "$1"', 'sh', hba],
      'hostssl applicationdb replicator 127.0.0.1/32 scram-sha-256\n' + physical + original
    )
    sql('SELECT pg_reload_conf();')
    assert.ok(repl('database').trim())
  })
  report.status = 'passed'
} finally {
  if (started) {
    docker(['rm', '-f', name])
    assert.equal(
      docker(['ps', '-a', '--filter', `name=^/${name}$`, '--format', '{{.Names}}']).trim(),
      ''
    )
  }
  report.completedAt = new Date().toISOString()
  report.cleanedUp = started
  mkdirSync('.verification-runs', { recursive: true })
  writeFileSync('.verification-runs/postgresql.json', `${JSON.stringify(report, null, 2)}\n`)
}
