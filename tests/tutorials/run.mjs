import { execFileSync, spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import { constants } from 'node:os'
import assert from 'node:assert/strict'

const usage = `Usage: node tests/tutorials/run.mjs [--update-output]

Runs the PostgreSQL tutorial checks in a disposable Docker container, removes the
container (also on Ctrl-C or SIGTERM) and writes .verification-runs/postgresql.json.

Options:
  --update-output  Replace each \`text output\` block that follows an executed SQL
                   block (currently in the dates article) with the actual psql output,
                   instead of failing when they differ. Review the diff, then run again
                   without this option to verify the outputs and record evidence.
  -h, --help       Show this message and exit without starting Docker.
`
const args = process.argv.slice(2)
if (args.includes('--help') || args.includes('-h')) {
  process.stdout.write(usage)
  process.exit(0)
}
const unknown = args.filter((arg) => arg !== '--update-output')
if (unknown.length) {
  process.stderr.write(`Unknown option: ${unknown.join(' ')}\n\n${usage}`)
  process.exit(2)
}
const updateOutput = args.includes('--update-output')

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
let launched = false
let started = false
let finished = false
// Runs once, from `finally` or a signal handler: remove the container, then write the report.
const finish = () => {
  if (finished) return
  finished = true
  let removed = false
  if (launched) {
    try {
      docker(['rm', '-f', name])
    } catch (error) {
      console.error(`Could not remove ${name}: ${error.stderr || error.message}`)
    }
    try {
      removed =
        docker(['ps', '-a', '--filter', `name=^/${name}$`, '--format', '{{.Names}}']).trim() === ''
    } catch (error) {
      console.error(`Could not confirm removal of ${name}: ${error.stderr || error.message}`)
    }
    if (!removed) {
      console.error(`${name} may still exist; remove it with: docker rm -f ${name}`)
      process.exitCode = 1
    }
  }
  report.completedAt = new Date().toISOString()
  report.cleanedUp = started && removed
  try {
    mkdirSync('.verification-runs', { recursive: true })
    writeFileSync('.verification-runs/postgresql.json', `${JSON.stringify(report, null, 2)}\n`)
  } catch (error) {
    console.error(`Could not write the report: ${error.message}`)
    process.exitCode = 1
  }
}
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    console.error(`Received ${signal}; removing ${name}`)
    report.interruptedBy = signal
    finish()
    process.exit(128 + constants.signals[signal])
  })
// The steps are synchronous, so signal handlers only run when the event loop gets a turn.
const yieldToSignals = () => new Promise((resolve) => setImmediate(resolve))
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
const check = async (label, fn) => {
  await yieldToSignals()
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
        if (!updateOutput)
          assert.equal(presented(output), presented(next[2]), `${file}: output for ${code}`)
        // Rewrite only blocks that differ, so unchanged blocks keep their formatting.
        else if (presented(output) !== presented(next[2]))
          outputs.push([next[0], `\`\`\`text output\n${presented(output)}\n\`\`\``])
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
  launched = true
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
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  assert.ok(ready, 'PostgreSQL startup timed out')
  report.version = scalar('SELECT version();')
  await check('every executable dates example and recorded result', () =>
    executeArticle('content/04-postgresql/11-date-types.mdx', 'dates')
  )
  await check('every monitoring diagnostic query parses and reads live system views', () => {
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
      scope: 'diagnostic SELECT/SHOW queries; logging administration checked separately below',
    })
  })
  await check(
    'article logging configuration reload, units, new sessions and real slow-query logs',
    () => {
      const file = 'content/04-postgresql/13-reading-and-querying-data/04-optimizing-postgresql.mdx'
      const source = readFileSync(file, 'utf8')
      const config = source.match(/```conf logging\n([\s\S]*?)```/)[1]
      const blocks = [...source.matchAll(/```sql logging\n([\s\S]*?)```/g)].map(([, code]) => code)
      assert.equal(blocks.length, 7, 'all logging SQL/psql steps must remain covered')
      const configFile = scalar('SHOW config_file;')
      const original = docker(['exec', name, 'cat', configFile])
      docker(
        ['exec', '-i', name, 'sh', '-c', 'cat >> "$1"', 'sh', configFile],
        `\n${config}\nlog_line_prefix = '%m [%p] %d '\n`
      )
      report.outputs.push({ file, configuration: config, configFile })
      const execute = (code) => {
        const stdout = sql(code)
        report.outputs.push({ file, sql: code, stdout })
        return stdout
      }
      execute(blocks[0])
      let reloaded = false
      for (let i = 0; i < 50; i++) {
        if (scalar('SHOW log_min_duration_statement;') === '5s') {
          reloaded = true
          break
        }
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100)
      }
      assert.ok(reloaded, 'configuration reload did not apply five-second threshold')
      sql('CREATE DATABASE helloprisma;')
      // ALTER DATABASE must not change the already-connected session's threshold.
      const existing = scalar(`\\c helloprisma\n${blocks[1]}\nSHOW log_min_duration_statement;`)
      assert.equal(existing.split('\n').at(-1), '5s')
      report.outputs.push({ file, sql: blocks[1], existingSession: existing })
      assert.equal(scalar('SHOW log_min_duration_statement;', 'helloprisma'), '2s')
      assert.match(execute(blocks[2]), /log_min_duration_statement=2000/)
      execute(blocks[3])
      assert.equal(scalar('SHOW log_min_duration_statement;', 'helloprisma'), '2s')
      assert.equal(
        scalar(
          "SELECT setting || '|' || unit || '|' || source FROM pg_settings WHERE name='log_min_duration_statement';"
        ),
        '5000|ms|configuration file'
      )
      execute(blocks[4])
      execute(blocks[5])
      execute(blocks[6])
      const logResult = spawnSync('docker', ['logs', name], { encoding: 'utf8' })
      assert.equal(logResult.status, 0, logResult.stderr)
      const logs = logResult.stdout + logResult.stderr
      // Docker captures PostgreSQL stderr as well as stdout.
      report.logging = logs
      assert.match(logs, /duration: [\d.]+ ms\s+statement: SELECT pg_sleep\(10\);/)
      assert.match(
        logs,
        /helloprisma LOG:\s+duration: [\d.]+ ms\s+statement: SELECT pg_sleep\(4\);/
      )
      assert.doesNotMatch(
        logs,
        /postgres LOG:\s+duration: [\d.]+ ms\s+statement: SELECT pg_sleep\(4\);/
      )
      assert.equal(
        (logs.match(/duration: [\d.]+ ms\s+statement: SELECT pg_sleep\(4\);/g) || []).length,
        1
      )
      // Restore the original server configuration before other fixture groups run.
      docker(['exec', '-i', name, 'sh', '-c', 'cat > "$1"', 'sh', configFile], original)
      sql('SELECT pg_reload_conf();')
      const article = report.articles.find((article) => article.file === file)
      article.executableBlocks += blocks.length
      article.scope =
        'diagnostic queries, global logging configuration/reload, numeric and unit-bearing database defaults, existing/new session behavior and slow-query log presence/absence'
    }
  )
  await check('date subtraction, age and truncation values and types', () => {
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
  await check('constraints including precise rejected writes', () =>
    executeArticle('content/02-datamodeling/05-correctness-constraints.mdx', 'constraints')
  )
  await check('constraint positive controls', () => {
    assert.equal(scalar('SELECT count(*) FROM default_pairs;', 'constraints'), '2')
    assert.equal(scalar('SELECT count(*) FROM strict_pairs;', 'constraints'), '1')
    assert.equal(scalar('SELECT count(*) FROM branch_books;', 'constraints'), '1')
    assert.equal(
      scalar('SELECT assignee IS NULL FROM tickets WHERE ticket_id = 3;', 'constraints'),
      't'
    )
  })
  await check(
    'OID column, constraints, rows and sequences survive plain and archive restore',
    () => {
      // The custom-format commands, including creating the destination, come from the article.
      const file =
        'content/04-postgresql/12-inserting-and-modifying-data/04-importing-and-exporting-data-in-postgresql.mdx'
      const source = readFileSync(file, 'utf8')
      const archive = source.match(/```shell\n(createdb [\s\S]*?)\n```/)?.[1].split('\n')
      assert.deepEqual(
        archive?.map((command) => command.split(' ')[0]),
        ['createdb', 'pg_dump', 'pg_restore'],
        `${file}: archive dump and restore block`
      )
      const [createArchive, dumpArchive, restoreArchive] = archive
      for (const database of ['mydb', 'plain_restore'])
        sql(`CREATE DATABASE ${database} TEMPLATE template0;`)
      sql(
        "CREATE TABLE items (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, label text NOT NULL UNIQUE, object_id oid); INSERT INTO items(label, object_id) VALUES ('snapshot', 12345);",
        'mydb'
      )
      docker([
        'exec',
        '-e',
        'PGUSER=postgres',
        '-w',
        '/tmp',
        name,
        'sh',
        '-ec',
        `pg_dump --help >/tmp/help; pg_dump mydb >/tmp/mydb.sql; ${createArchive}; ${dumpArchive}`,
      ])
      sql("INSERT INTO items(label) VALUES ('after snapshot');", 'mydb')
      docker([
        'exec',
        '-e',
        'PGUSER=postgres',
        '-w',
        '/tmp',
        name,
        'sh',
        '-ec',
        `psql -X -v ON_ERROR_STOP=1 -d plain_restore -f /tmp/mydb.sql; ${restoreArchive}`,
      ])
      sql('CREATE ROLE app_smoke;')
      for (const database of ['plain_restore', 'archive_restore']) {
        assert.equal(
          scalar('SELECT id, label, object_id FROM items;', database),
          '1|snapshot|12345'
        )
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
      report.articles.push({
        file,
        sourceSha256: createHash('sha256').update(source).digest('hex'),
        executableBlocks: 1,
        scope: 'custom-format createdb, pg_dump and pg_restore commands',
      })
    }
  )
  await check('malformed restore exits nonzero and stops subsequent SQL', () => {
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
  await check('supported physical base backup restores into a separate server', () => {
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
  await check('verified TLS accepts the correct host and rejects wrong-host certificates', () => {
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
  await check(
    'physical replication HBA rules do not authorize logical database connections',
    () => {
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
    }
  )
  report.status = 'passed'
} finally {
  finish()
}
