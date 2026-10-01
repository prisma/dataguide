import { execFileSync, spawn } from 'node:child_process'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import assert from 'node:assert/strict'

const image = 'mongo@sha256:4968f22d0c6c10ef29952f3e807f62872ba22b3312f25803564fbfc08255efc2'
const name = `dg-transactions-${randomUUID().slice(0, 8)}`
const file = 'content/08-mongodb/12-mongodb-transactions.mdx'
const source = readFileSync(file, 'utf8')
const blocks = [...source.matchAll(/```javascript\n([\s\S]*?)```/g)].map(([, code]) => code)
const printed = [...source.matchAll(/```text output\n([\s\S]*?)```/g)].map(([, text]) => text)
const block = (prefix) => blocks.find((code) => code.startsWith(prefix))
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
  outputs: [],
  checks: [],
  negativeControls: [],
}
const docker = (args, input) =>
  execFileSync('docker', args, { input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
const shell = (code) => docker(['exec', '-i', name, 'mongosh', '--quiet', '--port', '27017'], code)
// Statements are piped into the mongosh REPL, so results print exactly as an interactive shell shows them.
// A marker after each statement splits the stream; the REPL prompt and continuation markers are removed.
const marker = '<<dg-statement-end>>'
const terminated = (code) => `${code.trimEnd()}\nprint('${marker}')\n`
const results = (stdout) =>
  stdout
    .split(new RegExp(`^.*${marker}\\n`, 'm'))
    .map((part) => part.replace(/^\n?\S+ \[direct: primary\] \S+> (?:\| )*/, ''))
const otherShell = (code) => {
  const [result] = results(shell(terminated('use literature') + terminated(code))).slice(1)
  report.outputs.push({ shell: 'other', code, stdout: result })
  return result
}
let started = false
let session
try {
  // The fixture's own seed, matching the collection the article starts from; IDs are fixed so output is stable.
  const seed = [
    ['620397dd4b871fc65c193106', 'James', 'Joyce', 'Ulysses'],
    ['620398016ed0bb9e23785973', 'William', 'Gibson', 'Neuromancer'],
    ['6203981d6ed0bb9e23785974', 'George', 'Orwell', 'Homage to Catalonia'],
    ['620398516ed0bb9e23785975', 'James', 'Baldwin', 'The Fire Next Time'],
  ]
    .map(
      ([id, first, last, title]) =>
        `{_id: ObjectId('${id}'), first_name: '${first}', last_name: '${last}', title: '${title}'}`
    )
    .join(',')
  assert.equal(printed.length, 4, 'the article prints four shell results')
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
  shell(`db.getSiblingDB('literature').authors.insertMany([${seed}])`)
  report.version = docker(['exec', name, 'mongod', '--version']).match(/db version v(\S+)/)[1]
  report.shellVersion = docker(['exec', name, 'mongosh', '--version']).trim()

  // The session shell stays open while another shell checks what is visible outside the transaction.
  const child = spawn('docker', ['exec', '-i', name, 'mongosh', '--quiet', '--port', '27017'])
  let stdout = ''
  let closed = false
  child.stdout.setEncoding('utf8').on('data', (data) => (stdout += data))
  child.stderr.setEncoding('utf8').on('data', (data) => (stdout += data))
  child.on('close', () => (closed = true))
  session = child
  let count = 0
  const run = async (code) => {
    const index = count++
    child.stdin.write(terminated(code))
    for (let i = 0; i < 300 && results(stdout).length <= index + 1 && !closed; i++)
      await new Promise((resolve) => setTimeout(resolve, 100))
    const result = results(stdout)
    assert.ok(result.length > index + 1, `mongosh did not finish: ${code}\n${stdout}`)
    report.outputs.push({ shell: 'session', code, stdout: result[index] })
    return result[index]
  }
  const empty = (code) => run(code).then((result) => assert.equal(result.trim(), '', code))

  assert.equal(await run('use literature'), 'switched to db literature\n')
  const initial = await run(block('db.authors.find()'))
  assert.equal(initial, printed[0], 'initial find() output')
  await empty(block('var session'))
  await empty(block('session.startTransaction'))
  await empty(block('var authors'))
  const inserted = await run(block('authors.insertOne'))
  const id = inserted.match(/insertedId: ObjectId\('([a-f0-9]{24})'\)/)[1]
  // Generated IDs vary between runs; the article must use one ID for the insert and the document.
  const shownId = printed[1].match(/insertedId: ObjectId\(['"]([a-f0-9]{24})['"]\)/)[1]
  const generated = (text, value) => text.replaceAll(value, '<generated ObjectId>')
  assert.equal(generated(inserted, id), generated(printed[1], shownId), 'insertOne() output')
  const inside = await run('authors.find()')
  assert.equal(generated(inside, id), generated(printed[2], shownId), 'in-session find() output')
  report.checks.push('displayed output matches mongosh exactly apart from the generated ObjectId')

  const outside = otherShell('db.authors.find()')
  assert.equal(outside, printed[3], 'other shell find() output')
  assert.equal(outside, initial)
  assert.doesNotMatch(outside, /Despentes/)
  report.negativeControls.push('another shell does not see the uncommitted insert')
  report.checks.push('uncommitted write visible only in session')

  report.commit = await run(block('session.commitTransaction'))
  assert.equal(otherShell('db.authors.find()'), inside)
  report.checks.push('commit visible outside session')

  // The article repeats the start and insert before aborting.
  await empty(block('session.startTransaction'))
  const retried = await run(block('authors.insertOne'))
  assert.notEqual(retried.match(/insertedId: ObjectId\('([a-f0-9]{24})'\)/)[1], id)
  assert.equal(await run('authors.countDocuments()'), '6\n')
  report.abort = await run(block('session.abortTransaction'))
  assert.equal(otherShell('db.authors.find()'), inside)
  assert.equal(otherShell('db.authors.countDocuments()'), '5\n')
  report.negativeControls.push('abort discards the repeated insert')
  report.checks.push('abort discards second insert')

  await empty('session.endSession()')
  child.stdin.end()
  for (let i = 0; i < 100 && !closed; i++) await new Promise((resolve) => setTimeout(resolve, 100))
  assert.ok(closed, 'session shell did not exit')
  report.status = 'passed'
  console.log(`PASS MongoDB ${report.version}: commit, isolation, abort and exact shell output`)
} finally {
  session?.kill()
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
