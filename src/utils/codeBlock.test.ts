import { test } from 'node:test'
import assert from 'node:assert/strict'
import { copyableText } from './codeBlock.ts'

test('code is copied as written', () => {
  const psqlOutput = ' id | name\n----+------\n  1 | Ada\n-- a comment'
  assert.equal(copyableText(psqlOutput, false), psqlOutput)
})

test('diff markers are not copied', () => {
  assert.equal(
    copyableText('model User {\n+  email String\n-  name String\n|  id Int\n}', true),
    'model User {\n  email String\n  name String\n  id Int\n}'
  )
})
