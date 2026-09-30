import { test } from 'node:test'
import assert from 'node:assert/strict'
import { copyableText, copyLabel } from './codeBlock.ts'

test('code is copied as written', () => {
  const psqlOutput = ' id | name\n----+------\n  1 | Ada\n-- a comment'
  assert.equal(copyableText(psqlOutput, false), psqlOutput)
})

test('diff copying produces the resulting code', () => {
  assert.equal(
    copyableText('model User {\n+  email String\n-  name String\n|  id Int\n}', true),
    'model User {\n  email String\n  id Int\n}'
  )
})

test('ordinary operators and output are copied unchanged', () => {
  assert.equal(copyableText('-5 + 2\n---+---', false), '-5 + 2\n---+---')
  assert.equal(copyLabel('text', {}), 'Copy output')
  assert.equal(copyLabel('sql', { pseudocode: true }), 'Copy pseudocode')
  assert.equal(copyLabel('sql', { 'expected-failure': true }), 'Copy expected failure')
  assert.equal(copyLabel('js', { diff: true }), 'Copy resulting code')
  assert.equal(copyLabel('diff', { patch: true }), 'Copy patch')
})
