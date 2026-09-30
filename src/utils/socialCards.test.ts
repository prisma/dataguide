import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, unlink, rmdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { THEMED_TOPICS } from './topicThemes.ts'
import { escapeMarkup, loadCardThemes, renderSocialCard, writeSocialCard } from './socialCards.ts'

const root = fileURLToPath(new URL('../../', import.meta.url))

test('social cards reuse all registered CSS themes and valid transparent artwork', async () => {
  const themes = await loadCardThemes(root)
  assert.deepEqual([...themes.keys()].sort(), [...THEMED_TOPICS].sort())
  for (const theme of themes.values()) {
    assert.match(theme.wash, /^#[0-9a-f]{6}$/)
    const metadata = await sharp(theme.scene).metadata()
    assert.equal(metadata.format, 'webp')
    assert.equal(metadata.hasAlpha, true)
  }
})

test('markup is escaped and long article titles render into opaque, full-sized PNGs', async () => {
  assert.equal(escapeMarkup('Tables <tuples> & "types"'), 'Tables &lt;tuples&gt; &amp; "types"')
  const themes = await loadCardThemes(root)
  for (const title of [
    'What are databases?',
    'Comparing database types: how database types evolved to meet different needs',
    'Tables <tuples> & "types"',
  ]) {
    const png = await renderSocialCard({
      root,
      theme: themes.get('intro')!,
      title,
      topicTitle: 'Introduction to databases',
    })
    const metadata = await sharp(png).metadata()
    assert.equal(metadata.format, 'png')
    assert.equal(metadata.width, 1200)
    assert.equal(metadata.height, 630)
    assert.equal(metadata.hasAlpha, false)
    assert.ok(png.length < 1_000_000, 'Keep social preview downloads below 1 MB')
  }
})

test('content-addressed files and metadata stay in sync when a title or theme changes', async () => {
  const output = await mkdtemp(path.join(tmpdir(), 'dataguide-social-test-'))
  try {
    const themes = await loadCardThemes(root)
    const options = {
      root,
      theme: themes.get('intro')!,
      title: 'What are databases?',
      topicTitle: 'Introduction to databases',
    }
    const image = await writeSocialCard(options, output)
    const duplicate = await writeSocialCard(options, output)
    assert.deepEqual(duplicate, image)
    assert.equal((await readdir(output)).length, 1)
    const metadata = await sharp(
      await readFile(path.join(output, path.basename(image.url)))
    ).metadata()
    assert.equal(image.width, metadata.width)
    assert.equal(image.height, metadata.height)
    assert.equal(image.type, `image/${metadata.format}`)
    assert.ok(image.alt.includes(options.title))
    assert.match(image.url, /^\/social\/generated\/[a-f0-9]{20}\.png$/)
    assert.notEqual(
      (await writeSocialCard({ ...options, title: 'Introduction to database schemas' }, output))
        .url,
      image.url
    )
    assert.notEqual(
      (await writeSocialCard({ ...options, theme: themes.get('mysql')! }, output)).url,
      image.url
    )
  } finally {
    // Only the disposable directory created by this test is removed.
    for (const file of await readdir(output)) await unlink(path.join(output, file))
    await rmdir(output)
  }
})
