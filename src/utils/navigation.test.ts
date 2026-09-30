import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getNavNeighbours, isIndexSlug } from './navigation.ts'

test('isIndexSlug matches section hubs and the homepage', () => {
  assert.equal(isIndexSlug('/'), true)
  assert.equal(isIndexSlug('/08-mongodb/index'), true)
  assert.equal(isIndexSlug('/04-postgresql/07-authentication-and-authorization/index'), true)
})

test('isIndexSlug does not match articles that mention indexes', () => {
  assert.equal(isIndexSlug('/08-mongodb/11-mongodb-indexes'), false)
  assert.equal(isIndexSlug('/10-managing-databases/indexing'), false)
  assert.equal(isIndexSlug(''), false)
  assert.equal(isIndexSlug(undefined), false)
})

const nav = [
  { title: 'First', url: '/a' },
  { title: 'Second', url: '/b' },
  { title: 'Third', url: '/c' },
]

test('the first article has a next link but no previous link', () => {
  assert.deepEqual(getNavNeighbours(nav, '/a'), { previous: null, next: nav[1] })
})

test('a middle article links both ways', () => {
  assert.deepEqual(getNavNeighbours(nav, '/b'), { previous: nav[0], next: nav[2] })
})

test('the last article has a previous link but no next link', () => {
  assert.deepEqual(getNavNeighbours(nav, '/c'), { previous: nav[1], next: null })
})

test('pages outside the reading order have no neighbours', () => {
  assert.deepEqual(getNavNeighbours(nav, '/elsewhere'), { previous: null, next: null })
})
