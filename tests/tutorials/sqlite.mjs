import { execFileSync } from 'node:child_process'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import assert from 'node:assert/strict'

const image = 'node@sha256:6f7b03f7c2c8e2e784dcf9295400527b9b1270fd37b7e9a7285cf83b6951452d'
const name = `dg-sqlite-${randomUUID().slice(0, 8)}`
const file = 'content/06-sqlite/06-update-data.mdx'
const source = readFileSync(file, 'utf8')
const blocks = [...source.matchAll(/```(sql[^\n]*)\n([\s\S]*?)```/g)]
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
try {
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
    const db = new DatabaseSync(':memory:');
    db.exec("PRAGMA foreign_keys=ON; CREATE TABLE my_table(id INTEGER PRIMARY KEY,column1 TEXT,column2 INTEGER,color TEXT); INSERT INTO my_table VALUES(1,'old',0,'blue'),(2,'keep',0,'red'); CREATE TABLE table1(column1 TEXT,column2 INTEGER); CREATE TABLE table2(column1 TEXT,column2 INTEGER UNIQUE); INSERT INTO table1 VALUES('old',1),('old',2); INSERT INTO table2 VALUES('matched',1);");
    const outputs = [];
    for (const [_, info, original] of ${JSON.stringify(blocks.map(([whole, info, code]) => [whole, info, code]))}) {
      const code = info.includes('pseudocode') ? original.replace(/\\bvalue1\\b/g, "'updated'").replace(/\\bvalue2\\b/g, '2') : original;
      const statement = db.prepare(code);
      // The seed block contains several statements; exec runs all of them.
      if (code.trimStart().startsWith('CREATE TABLE')) db.exec(code);
      else outputs.push({sql: original, rows: statement.all()});
      if (code.includes('UPDATE my_table')) {
        assert.equal(db.prepare('SELECT column1 FROM my_table WHERE id=1').get().column1, 'updated');
        assert.equal(db.prepare('SELECT column1 FROM my_table WHERE id=2').get().column1, 'keep');
      }
      if (code.includes('UPDATE table1')) assert.deepEqual(db.prepare('SELECT column1 FROM table1 ORDER BY column2').all().map(r=>r.column1), ['matched',null]);
    }
    const authors = db.prepare('SELECT id,first_name,last_name,last_publication FROM author ORDER BY id').all();
    assert.deepEqual(authors.map(r=>r.last_publication), ['Anna Karenina','Ulysses','Nausea']);
    assert.throws(()=>db.exec("INSERT INTO book(author_id,title) VALUES(999,'orphan')"), /FOREIGN KEY/);
    console.log(JSON.stringify({ version: db.prepare('SELECT sqlite_version() AS version').get().version, outputs, authors, checks: ['all article and FAQ SQL blocks', 'UPDATE targeting and RETURNING', 'correlated subquery including unmatched row', 'latest publication per author', 'foreign key rejects orphan'] }));
    db.close();
  `
  )
  Object.assign(report, JSON.parse(stdout), { status: 'passed' })
  // Compare the table printed in the article with the real rows, independent of padding.
  const output = source.match(/```text output\n([\s\S]*?)```/)[1]
  const expected = output
    .split('\n')
    .filter((line) => /^\|\s*\d/.test(line))
    .map((line) =>
      line
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim())
    )
  assert.deepEqual(
    report.authors.map((row) => Object.values(row).map(String)),
    expected
  )
  console.log(`PASS SQLite ${report.version}: ${blocks.length} article blocks`)
} finally {
  assert.equal(
    docker(['ps', '-a', '--filter', `name=^/${name}$`, '--format', '{{.Names}}']).trim(),
    ''
  )
  report.cleanedUp = true
  report.completedAt = new Date().toISOString()
  mkdirSync('.verification-runs', { recursive: true })
  writeFileSync('.verification-runs/sqlite.json', `${JSON.stringify(report, null, 2)}\n`)
}
