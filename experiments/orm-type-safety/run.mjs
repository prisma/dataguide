import { execFileSync, spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'

const root = fileURLToPath(new URL('.', import.meta.url))
const repository = path.resolve(root, '../..')
const article =
  'content/09-database-tools/02-evaluating-type-safety-in-the-top-8-typescript-orms.md'
const projects = JSON.parse(readFileSync(path.join(root, 'projects.json'), 'utf8'))
const postgresImage =
  'postgres@sha256:5a5a84b19854a9ffaa54082c166ff4ec27473a361e496e5ea167f298f2da9722'
const mongoImage = 'mongo@sha256:4968f22d0c6c10ef29952f3e807f62872ba22b3312f25803564fbfc08255efc2'
const id = randomUUID().slice(0, 8)
const names = { postgres: `dg-orm-pg-${id}`, mongo: `dg-orm-mongo-${id}` }
const report = {
  startedAt: new Date().toISOString(),
  runtime: process.version,
  postgresImage,
  mongoImage,
  projects: [],
  status: 'failed',
}
const resources = []
// The report is published, so it must not reveal local paths
const home = homedir()
const redact = (value) => (home.length > 1 ? value.replaceAll(home, '~') : value)
const hash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex')
const docker = (args, input) =>
  execFileSync('docker', args, { input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
const invoke = (cwd, command, args, env) => {
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 180000,
  })
  return {
    command: redact([path.basename(command), ...args].join(' ')),
    exitCode: result.status,
    stdout: redact(result.stdout || ''),
    stderr: redact(result.stderr || ''),
    ...(result.error ? { failure: redact(result.error.message) } : {}),
    ...(result.signal ? { signal: result.signal } : {}),
  }
}
const success = (result) =>
  assert.equal(result.exitCode, 0, `${result.command}\n${result.stdout}\n${result.stderr}`)
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const sourceFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (
      ['node_modules', 'dist', '.verification-runs'].includes(entry.name) ||
      entry.name.includes('unsuppressed')
    )
      return []
    const file = path.join(dir, entry.name)
    return entry.isDirectory()
      ? sourceFiles(file)
      : [{ file: path.relative(root, file), sha256: hash(file) }]
  })
const sql = (database, statement, flags = []) =>
  docker(
    [
      'exec',
      '-i',
      names.postgres,
      'psql',
      '-X',
      ...flags,
      '-v',
      'ON_ERROR_STOP=1',
      '-U',
      'postgres',
      '-d',
      database,
    ],
    statement
  )

report.fixtureSha256 = hash(import.meta.filename)
report.articles = [{ file: article, sourceSha256: hash(path.join(repository, article)) }]
report.supportingSources = sourceFiles(root).map(({ file, sha256 }) => ({
  file: `experiments/orm-type-safety/${file}`,
  sha256,
}))
try {
  for (const [engine, image, port] of [
    ['postgres', postgresImage, 5432],
    ['mongo', mongoImage, 27017],
  ]) {
    const args = ['run', '--rm', '-d', '--name', names[engine], '-p', `127.0.0.1::${port}`]
    if (engine === 'postgres') args.push('-e', 'POSTGRES_PASSWORD=disposable-orm-password')
    docker([...args, image])
    resources.push(names[engine])
  }
  for (const engine of ['postgres', 'mongo']) {
    let ready = false
    for (let attempt = 0; attempt < 100; attempt++) {
      try {
        if (engine === 'postgres') docker(['exec', names.postgres, 'pg_isready', '-h', '127.0.0.1'])
        else
          docker([
            'exec',
            names.mongo,
            'mongosh',
            '--quiet',
            '--eval',
            'if (!db.adminCommand({ping:1}).ok) quit(1)',
          ])
        ready = true
        break
      } catch {
        await pause(200)
      }
    }
    assert.ok(ready, `${engine} startup timed out`)
  }
  // -qAt: the bare version string, not psql's table with a header and row count
  report.postgresVersion = sql('postgres', 'SELECT version();', ['-qAt']).trim()
  report.mongoVersion = docker([
    'exec',
    names.mongo,
    'mongosh',
    '--quiet',
    '--eval',
    'db.version()',
  ]).trim()
  const pgPort = Number(docker(['port', names.postgres, '5432/tcp']).trim().split(':').at(-1))
  const mongoPort = Number(docker(['port', names.mongo, '27017/tcp']).trim().split(':').at(-1))

  for (const name of projects) {
    const cwd = path.join(root, name)
    const database = `dg_${name}`
    const env = {
      ...process.env,
      EXPERIMENT_DATABASE_URL: `postgresql://postgres:disposable-orm-password@127.0.0.1:${pgPort}/${database}`,
      EXPERIMENT_MONGO_URL: `mongodb://127.0.0.1:${mongoPort}/dg_mongoose`,
    }
    const item = { name, sources: sourceFiles(cwd), commands: [], compilers: [], status: 'failed' }
    report.projects.push(item)
    const install = invoke(cwd, 'npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], env)
    item.commands.push(install)
    success(install)
    const pkg = JSON.parse(readFileSync(path.join(cwd, 'package.json'), 'utf8'))
    item.versions = Object.fromEntries(
      [...Object.keys(pkg.dependencies), ...Object.keys(pkg.devDependencies)].map((dependency) => [
        dependency,
        JSON.parse(readFileSync(path.join(cwd, 'node_modules', dependency, 'package.json'), 'utf8'))
          .version,
      ])
    )
    if (name !== 'mongoose') sql('postgres', `CREATE DATABASE ${database};`)
    if (['drizzle', 'kysely', 'knex'].includes(name))
      sql(
        database,
        `
      CREATE TABLE users (id serial PRIMARY KEY, email text NOT NULL UNIQUE, name text);
      CREATE TABLE posts (id serial PRIMARY KEY, title text NOT NULL, published boolean NOT NULL DEFAULT false, author_id integer NOT NULL REFERENCES users(id));
      CREATE VIEW users_row_only AS SELECT id, email, name FROM users;
    `
      )
    if (name === 'prisma') {
      sql(
        database,
        `
        CREATE TABLE "User" (id serial PRIMARY KEY, email text NOT NULL UNIQUE, name text);
        CREATE TABLE "Post" (id serial PRIMARY KEY, title text NOT NULL, published boolean NOT NULL DEFAULT false, "authorId" integer NOT NULL REFERENCES "User"(id));
      `
      )
      for (const args of [['generate']]) {
        const result = invoke(
          cwd,
          process.execPath,
          ['node_modules/prisma/build/index.js', ...args],
          env
        )
        item.commands.push(result)
        success(result)
      }
    }

    const source = readFileSync(path.join(cwd, 'src/checks.ts'), 'utf8')
    const lines = source.split('\n')
    const markers = lines.flatMap((line, index) => {
      const match = line.match(/\/\/ CASE (\w+)/)
      return match ? [{ name: match[1], line: index + 1 }] : []
    })
    assert.deepEqual(
      markers.map((m) => m.name),
      ['required', 'value', 'filter', 'select', 'relations', 'nullable', 'raw']
    )
    const expected = lines.flatMap((line, index) =>
      line.includes('@ts-expect-error') ? [index + 2] : []
    )
    for (const compiler of ['typescript', 'typescript6', 'typescript5']) {
      const binary = `node_modules/${compiler}/bin/tsc`
      const baseline = invoke(
        cwd,
        process.execPath,
        [binary, '--pretty', 'false', '-p', 'tsconfig.json'],
        env
      )
      const version = invoke(cwd, process.execPath, [binary, '--version'], env)
      item.compilers.push({ version: version.stdout.trim(), baseline })
      success(baseline)
      success(version)
      writeFileSync(
        path.join(cwd, 'src/unsuppressed.ts'),
        source.replace(
          /\/\/ @ts-expect-error[^\n]*/g,
          '// Deliberately unsuppressed negative check'
        )
      )
      writeFileSync(
        path.join(cwd, 'tsconfig.unsuppressed.json'),
        JSON.stringify({
          extends: './tsconfig.json',
          include: ['src/model.ts', 'src/helper.ts', 'src/unsuppressed.ts'],
        })
      )
      try {
        const negative = invoke(
          cwd,
          process.execPath,
          [binary, '--pretty', 'false', '-p', 'tsconfig.unsuppressed.json'],
          env
        )
        assert.notEqual(negative.exitCode, 0, 'unsuppressed negatives must fail')
        const diagnostics = [
          ...negative.stdout.matchAll(/^(.+?)\((\d+),(\d+)\): error TS(\d+): (.*)$/gm),
        ].map(([, file, line, column, code, message]) => {
          assert.ok(file.endsWith('unsuppressed.ts'), `unexpected model/helper diagnostic: ${file}`)
          const group = markers.findLast((marker) => marker.line <= Number(line))
          assert.ok(group, 'diagnostic has no case')
          return {
            case: group.name,
            line: Number(line),
            column: Number(column),
            code: `TS${code}`,
            message,
          }
        })
        assert.ok(
          diagnostics.length >= expected.length,
          'every suppressed negative must produce a diagnostic'
        )
        for (const line of expected)
          assert.ok(
            diagnostics.some((d) => d.line === line),
            `no intended diagnostic at line ${line}`
          )
        assert.ok(
          diagnostics.every((d) => expected.includes(d.line)),
          'unexpected diagnostic outside the marked negative statements'
        )
        item.compilers.at(-1).negative = negative
        item.compilers.at(-1).diagnostics = diagnostics
      } finally {
        rmSync(path.join(cwd, 'src/unsuppressed.ts'), { force: true })
        rmSync(path.join(cwd, 'tsconfig.unsuppressed.json'), { force: true })
      }
    }
    rmSync(path.join(cwd, 'dist'), { recursive: true, force: true })
    const compile = invoke(
      cwd,
      process.execPath,
      ['node_modules/typescript/bin/tsc', '--pretty', 'false', '-p', 'tsconfig.runtime.json'],
      env
    )
    item.commands.push(compile)
    success(compile)
    const runtime = invoke(cwd, process.execPath, ['dist/runtime.js'], env)
    item.commands.push(runtime)
    success(runtime)
    const data = runtime.stdout
      .trim()
      .split('\n')
      .findLast((line) => line.startsWith('{"observations"'))
    assert.ok(data, 'runtime observations missing')
    item.runtime = JSON.parse(data)
    item.status = 'passed'
    console.log(`PASS ${name}: three compilers, unsuppressed diagnostics and runtime controls`)
  }
  assert.equal(hash(import.meta.filename), report.fixtureSha256, 'runner changed during execution')
  for (const source of [
    ...report.supportingSources,
    ...report.articles.map((a) => ({ file: a.file, sha256: a.sourceSha256 })),
  ])
    assert.equal(
      hash(path.join(repository, source.file)),
      source.sha256,
      `source changed during execution: ${source.file}`
    )
  report.status = 'passed'
} finally {
  // The report is written even when cleanup fails, so a failed run keeps its evidence
  try {
    for (const name of resources.reverse()) docker(['rm', '-f', name])
    for (const name of Object.values(names))
      assert.equal(
        docker(['ps', '-a', '--filter', `name=${name}`, '--format', '{{.Names}}']).trim(),
        ''
      )
    report.cleanedUp = true
  } catch (error) {
    report.cleanedUp = false
    report.status = 'failed'
    report.cleanupError = error.message
    process.exitCode = 1
  }
  report.completedAt = new Date().toISOString()
  mkdirSync(path.join(root, '.verification-runs'), { recursive: true })
  writeFileSync(
    path.join(root, '.verification-runs/comparison.json'),
    `${JSON.stringify(report, null, 2)}\n`
  )
}
