import { execFileSync } from 'node:child_process'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import assert from 'node:assert/strict'

const image = 'mongo@sha256:4968f22d0c6c10ef29952f3e807f62872ba22b3312f25803564fbfc08255efc2'
const name = `dg-transactions-${randomUUID().slice(0, 8)}`
const file = 'content/08-mongodb/12-mongodb-transactions.mdx'
const source = readFileSync(file, 'utf8')
const blocks = [...source.matchAll(/```javascript\n([\s\S]*?)```/g)].map(([, code]) => code)
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
const shell = (code) => docker(['exec', '-i', name, 'mongosh', '--quiet', '--port', '27017'], code)
let started = false
try {
  docker([
    'run',
    '--rm',
    '-d',
    '--name',
    name,
    '-p',
    '127.0.0.1::27017',
    image,
    'mongod',
    '--replSet',
    'tutorial',
    '--bind_ip',
    '127.0.0.1',
  ])
  started = true
  let ready = false
  for (let i = 0; i < 100; i++) {
    try {
      shell('db.adminCommand({ping:1})')
      ready = true
      break
    } catch {}
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100)
  }
  assert.ok(ready, 'MongoDB startup timed out')
  shell('rs.initiate({_id:"tutorial",members:[{_id:0,host:"127.0.0.1:27017"}]})')
  shell(
    'for(let i=0;i<100&&!db.hello().isWritablePrimary;i++) sleep(100); if(!db.hello().isWritablePrimary) throw new Error("Replica set election timed out")'
  )
  // One eval keeps all extracted shell statements in the same session scope.
  const statements = blocks.filter((code) => !code.includes('abortTransaction'))
  const start = blocks.find((code) => code.startsWith('session.startTransaction'))
  const insert = blocks.find((code) => code.startsWith('authors.insertOne'))
  const output = docker([
    'exec',
    name,
    'mongosh',
    '--quiet',
    '--eval',
    `
    const assert = require('node:assert/strict');
    db = db.getSiblingDB('literature');
    const seed = ${source.match(/```\n(\[\n[\s\S]*?)```/)[1]};
    db.authors.insertMany(seed);
    const outside = () => db.authors.find({}, {_id:0}).sort({_id:1}).toArray();
    const initial = outside();
    ${statements.filter((code) => !code.includes('commitTransaction')).join(';\n')};
    const inside = authors.find({}, {_id:0}).sort({_id:1}).toArray();
    assert.deepEqual(inside.length,5);
    assert.deepEqual(outside(),initial);
    ${blocks.find((code) => code.includes('commitTransaction'))};
    assert.deepEqual(outside(),inside);
    ${start};
    ${insert};
    assert.deepEqual(authors.countDocuments({}),6);
    ${blocks.find((code) => code.includes('abortTransaction'))};
    assert.deepEqual(outside(),inside);
    session.endSession();
    print(JSON.stringify({version:db.version(),initial,inside,committed:outside(),checks:['article transaction statements execute','uncommitted write visible only in session','commit visible outside session','abort discards second insert']}));
  `,
  ])
  const result = JSON.parse(output.trim())
  // Displayed IDs vary; every displayed author field must match actual session visibility.
  const samples = [...source.matchAll(/```\n(\[\n[\s\S]*?)```/g)].map(([, code]) =>
    code.replace(/_id: ObjectId\("[a-f0-9]+"\),\s*/g, '')
  )
  for (const [sample, actual] of [
    [samples[0], result.initial],
    [samples[1], result.inside],
    [samples[2], result.initial],
  ]) {
    const parsed = JSON.parse(sample.replace(/(\w+):/g, '"$1":').replace(/'([^']*)'/g, '"$1"'))
    assert.deepEqual(actual, parsed)
  }
  Object.assign(report, result, { status: 'passed' })
  console.log(`PASS MongoDB ${report.version}: commit, isolation and abort`)
} finally {
  if (started) docker(['rm', '-f', name])
  assert.equal(
    docker(['ps', '-a', '--filter', `name=^/${name}$`, '--format', '{{.Names}}']).trim(),
    ''
  )
  report.cleanedUp = started
  report.completedAt = new Date().toISOString()
  mkdirSync('.verification-runs', { recursive: true })
  writeFileSync('.verification-runs/mongodb.json', `${JSON.stringify(report, null, 2)}\n`)
}
