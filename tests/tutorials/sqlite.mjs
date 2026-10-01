import { execFileSync } from 'node:child_process'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import assert from 'node:assert/strict'

const image = 'node@sha256:6f7b03f7c2c8e2e784dcf9295400527b9b1270fd37b7e9a7285cf83b6951452d'
// The image has no sqlite3 shell. For the article's .mode output, the fixture builds one from
// SQLite's official source for the release node:sqlite uses, so both run the same SQLite.
const shellVersion = '3.53.1'
const shellSource = 'https://sqlite.org/2026/sqlite-autoconf-3530100.tar.gz'
// SQLite publishes both values in its release log.
const shellReleaseLog = 'https://sqlite.org/releaselog/3_53_1.html'
const shellSqlite3cSha3 = '414432ae5719f6cdc485f3927e12c7ad107e2b8c6b434e5df2eadb5312bfabb5'
const shellSourceId =
  '2026-05-05 10:34:17 c88b22011a54b4f6fbd149e9f8e4de77658ce58143a1af0e3785e4e6475127e9'
const shellBuild = 'gcc -O2 shell.c sqlite3.c -lm -o /usr/local/bin/sqlite3'
const id = randomUUID().slice(0, 8)
const name = `dg-sqlite-${id}`
const shellName = `dg-sqlite-shell-${id}`
const file = 'content/06-sqlite/06-update-data.mdx'
const source = readFileSync(file, 'utf8')
const blocks = [...source.matchAll(/```(sql[^\n]*)\n([\s\S]*?)```/g)]
const block = (test) => blocks.find(([, , code]) => test(code))[2]
const setup = block((code) => code.includes('CREATE TABLE author'))
const update = block((code) => code.startsWith('UPDATE author'))
const select = block((code) => code.includes('SELECT * FROM author'))
const printed = source.match(/```text output\n([\s\S]*?)```/)[1]
const pragma = 'PRAGMA foreign_keys = ON;'
const orphan = "INSERT INTO book (author_id, title) VALUES (999, 'orphan');"
const report = {
  startedAt: new Date().toISOString(),
  image,
  status: 'failed',
  fixtureSha256: createHash('sha256')
    .update(readFileSync(import.meta.filename))
    .digest('hex'),
  articles: [
    {
      file,
      sourceSha256: createHash('sha256').update(source).digest('hex'),
      executableBlocks: blocks.length,
    },
  ],
}
const docker = (args, input) =>
  execFileSync('docker', args, { input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
let shellStarted = false
try {
  assert.ok(setup.startsWith(pragma), 'the article setup must turn on foreign keys itself')
  const stdout = docker(
    [
      'run',
      '--rm',
      '-i',
      '--name',
      name,
      '--network',
      'none',
      image,
      'node',
      '--input-type=module',
    ],
    `
    import { DatabaseSync } from 'node:sqlite';
    import assert from 'node:assert/strict';
    // node:sqlite turns foreign keys on by default; SQLite and its shell start with them off.
    const open = () => new DatabaseSync(':memory:', { enableForeignKeyConstraints: false });
    const db = open();
    db.exec("CREATE TABLE my_table(id INTEGER PRIMARY KEY,column1 TEXT,column2 INTEGER,color TEXT); INSERT INTO my_table VALUES(1,'old',0,'blue'),(2,'keep',0,'red'); CREATE TABLE table1(column1 TEXT,column2 INTEGER); CREATE TABLE table2(column1 TEXT,column2 INTEGER UNIQUE); INSERT INTO table1 VALUES('old',1),('old',2); INSERT INTO table2 VALUES('matched',1);");
    const outputs = [];
    for (const [_, info, original] of ${JSON.stringify(blocks.map(([whole, info, code]) => [whole, info, code]))}) {
      // sqlite3 shell dot-commands such as .mode are not SQL; the shell run below executes them.
      const sql = original.split('\\n').filter((line) => !line.startsWith('.')).join('\\n');
      const code = info.includes('pseudocode') ? sql.replace(/\\bvalue1\\b/g, "'updated'").replace(/\\bvalue2\\b/g, '2') : sql;
      // The setup block contains several statements; exec runs all of them.
      if (code.includes('CREATE TABLE')) db.exec(code);
      else outputs.push({sql: original, rows: db.prepare(code).all()});
      if (code.includes('UPDATE my_table')) {
        assert.equal(db.prepare('SELECT column1 FROM my_table WHERE id=1').get().column1, 'updated');
        assert.equal(db.prepare('SELECT column1 FROM my_table WHERE id=2').get().column1, 'keep');
      }
      if (code.includes('UPDATE table1')) assert.deepEqual(db.prepare('SELECT column1 FROM table1 ORDER BY column2').all().map(r=>r.column1), ['matched',null]);
    }
    const authors = db.prepare('SELECT id,first_name,last_name,last_publication FROM author ORDER BY id').all();
    assert.deepEqual(authors.map(r=>r.last_publication), ['Anna Karenina','Ulysses','Nausea']);
    assert.equal(db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
    assert.throws(()=>db.exec(${JSON.stringify(orphan)}), /FOREIGN KEY/);
    // Negative control: the same setup without the article's pragma accepts the orphan row.
    const control = open();
    control.exec(${JSON.stringify(setup.replace(pragma, ''))});
    control.exec(${JSON.stringify(orphan)});
    assert.equal(control.prepare('SELECT count(*) AS n FROM book WHERE author_id = 999').get().n, 1);
    control.close();
    console.log(JSON.stringify({ version: db.prepare('SELECT sqlite_version() AS version').get().version, sourceId: db.prepare('SELECT sqlite_source_id() AS id').get().id, outputs, authors, checks: ['all article and FAQ SQL blocks', 'UPDATE targeting and RETURNING', 'correlated subquery including unmatched row', 'latest publication per author', 'article pragma makes foreign keys reject an orphan'] }));
    db.close();
  `
  )
  Object.assign(report, JSON.parse(stdout))
  report.negativeControls = ['node:sqlite: article setup without its pragma accepts an orphan row']

  // The printed table comes from the sqlite3 shell, so run the article's statements there too.
  docker(['run', '--rm', '-d', '--name', shellName, image, 'sleep', 'infinity'])
  shellStarted = true
  // The image has no compiler either; Debian's gcc builds the shell.
  docker([
    'exec',
    shellName,
    'sh',
    '-ec',
    'apt-get update -qq >/dev/null && apt-get install -y -qq --no-install-recommends gcc libc6-dev >/dev/null',
  ])
  const download = JSON.parse(
    docker(
      ['exec', '-i', shellName, 'node', '--input-type=module'],
      `
      import { execFileSync } from 'node:child_process';
      import { createHash } from 'node:crypto';
      import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
      const response = await fetch(${JSON.stringify(shellSource)});
      if (!response.ok) throw new Error(\`${shellSource}: HTTP \${response.status}\`);
      const archive = Buffer.from(await response.arrayBuffer());
      writeFileSync('/tmp/sqlite.tar.gz', archive);
      mkdirSync('/tmp/sqlite');
      execFileSync('tar', ['-xzf', '/tmp/sqlite.tar.gz', '-C', '/tmp/sqlite', '--strip-components=1']);
      const sha3 = (data) => createHash('sha3-256').update(data).digest('hex');
      console.log(JSON.stringify({ archiveSha3: sha3(archive), sqlite3cSha3: sha3(readFileSync('/tmp/sqlite/sqlite3.c')) }));
    `
    )
  )
  assert.equal(
    download.sqlite3cSha3,
    shellSqlite3cSha3,
    `sqlite3.c from ${shellSource} must have the SHA3-256 published in ${shellReleaseLog}`
  )
  docker(['exec', '-w', '/tmp/sqlite', shellName, 'sh', '-ec', shellBuild])
  const shellVersionLine = docker(['exec', shellName, 'sqlite3', '--version']).trim()
  assert.equal(
    shellVersionLine.split(' ').slice(0, 4).join(' '),
    `${shellVersion} ${shellSourceId}`,
    `the sqlite3 shell must be SQLite ${shellVersion} built from the released source`
  )
  assert.equal(report.version, shellVersion, 'node:sqlite must run the same SQLite release')
  assert.equal(report.sourceId, shellSourceId, 'node:sqlite must run the same SQLite source')
  const sqlite3 = (input) =>
    docker(['exec', '-i', shellName, 'sqlite3', '-bail', ':memory:'], input)
  const stdoutTable = sqlite3(`${setup}\n${update}\n${select}`)
  assert.equal(stdoutTable, printed, 'article output must match the sqlite3 shell byte for byte')
  let rejection
  assert.throws(
    () => sqlite3(`${setup}\n${orphan}`),
    (error) => {
      rejection = error.stderr.trim()
      return /FOREIGN KEY constraint failed/.test(rejection)
    }
  )
  assert.equal(
    sqlite3(
      `${setup.replace(pragma, '')}\n${orphan}\nSELECT count(*) FROM book WHERE author_id = 999;`
    ),
    '1\n'
  )
  report.negativeControls.push(
    'sqlite3 shell: article setup without its pragma accepts an orphan row'
  )
  report.shell = {
    version: shellVersionLine,
    source: shellSource,
    sqlite3cSha3: download.sqlite3cSha3,
    sqlite3cSha3PublishedIn: shellReleaseLog,
    archiveSha3: download.archiveSha3,
    build: shellBuild,
    compiler: docker(['exec', shellName, 'gcc', '--version']).split('\n')[0],
    stdout: stdoutTable,
    foreignKeyRejection: rejection,
  }
  report.checks.push(
    `sqlite3.c matches the SHA3-256 published for SQLite ${shellVersion}`,
    'sqlite3 shell and node:sqlite report the same SQLite version and source ID',
    'sqlite3 shell output matches the article byte for byte',
    'sqlite3 shell rejects an orphan row after the article setup'
  )
  report.status = 'passed'
  console.log(
    `PASS SQLite ${report.version} and sqlite3 shell ${report.shell.version.split(' ')[0]}: ${blocks.length} article blocks`
  )
} finally {
  if (shellStarted) docker(['rm', '-f', shellName])
  for (const container of [name, shellName])
    assert.equal(
      docker(['ps', '-a', '--filter', `name=^/${container}$`, '--format', '{{.Names}}']).trim(),
      ''
    )
  report.cleanedUp = true
  report.completedAt = new Date().toISOString()
  mkdirSync('.verification-runs', { recursive: true })
  writeFileSync('.verification-runs/sqlite.json', `${JSON.stringify(report, null, 2)}\n`)
}
