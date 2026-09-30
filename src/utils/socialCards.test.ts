import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, readdir, unlink, rmdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { THEMED_TOPICS } from './topicThemes.ts'
import {
  loadCardThemes,
  loadCardPalette,
  renderSocialCard,
  writeSocialCard,
  pruneSocialCards,
} from './socialCards.ts'

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

test('CSS palette changes reach headline, label, footer, and background pixels', async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), 'dataguide-social-palette-'))
  const styles = path.join(fixture, 'src/styles')
  const cssPath = path.join(styles, 'layout.css')
  const css = ':root { --ink: #912345; --accent: #087654; --surface: #fffaf0; --page-bg: #e4e5e6; }'
  try {
    await mkdir(styles, { recursive: true })
    await writeFile(cssPath, css)
    const palette = await loadCardPalette(fixture)
    const themes = await loadCardThemes(root)
    const png = await renderSocialCard({
      root,
      palette,
      theme: themes.get('intro')!,
      title: 'What are databases?',
      topicTitle: 'Introduction to databases',
    })
    for (const [top, left, width, height, rgb] of [
      [92, 72, 640, 68, [8, 118, 84]],
      [186, 72, 640, 296, [145, 35, 69]],
      [541, 122, 480, 40, [145, 35, 69]],
      [300, 10, 10, 10, [255, 250, 240]],
      [0, 0, 1, 1, [228, 229, 230]],
    ] as const) {
      const { data, info } = await sharp(png)
        .extract({ top, left, width, height })
        .raw()
        .toBuffer({ resolveWithObject: true })
      let matches = 0
      for (let i = 0; i < data.length; i += info.channels) {
        if (rgb.every((value, channel) => data[i + channel] === value)) matches++
      }
      assert.ok(matches > 0, `Expected CSS token color ${rgb} in region at ${left},${top}`)
    }
    await writeFile(cssPath, css.replace('--ink: #912345;', '--ink: var(--unknown);'))
    await assert.rejects(loadCardPalette(fixture), /Missing or invalid.*--ink/)
    await writeFile(cssPath, css.replace('--accent: #087654;', ''))
    await assert.rejects(loadCardPalette(fixture), /Missing or invalid.*--accent/)
  } finally {
    await unlink(cssPath)
    await rmdir(styles)
    await rmdir(path.join(fixture, 'src'))
    await rmdir(fixture)
  }
})

test('punctuation and long article titles render into opaque, full-sized PNGs', async () => {
  const themes = await loadCardThemes(root)
  const palette = await loadCardPalette(root)
  for (const title of [
    'What are databases?',
    'Comparing database types: how database types evolved to meet different needs',
    'Tables <tuples> & "types"',
  ]) {
    const png = await renderSocialCard({
      root,
      palette,
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

test('short headlines stay on one line regardless of the build host font DPI', async () => {
  const themes = await loadCardThemes(root)
  const palette = await loadCardPalette(root)
  const png = await renderSocialCard({
    root,
    palette,
    theme: themes.get('intro')!,
    title: 'What are databases?',
    topicTitle: 'Introduction to databases',
  })
  const { data, info } = await sharp(png)
    .extract({ left: 72, top: 186, width: 640, height: 296 })
    .raw()
    .toBuffer({ resolveWithObject: true })
  const rows: number[] = []
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const offset = (y * info.width + x) * info.channels
      if (data[offset] < 60 && data[offset + 1] < 60 && data[offset + 2] < 60) {
        rows.push(y)
        break
      }
    }
  }
  assert.ok(rows.length > 25, 'The headline must be present and readable')
  assert.ok(rows.at(-1)! - rows[0] < 75, 'The short headline should occupy one line')
})

test('content-addressed files and metadata stay in sync when a title or theme changes', async () => {
  const output = await mkdtemp(path.join(tmpdir(), 'dataguide-social-test-'))
  try {
    const themes = await loadCardThemes(root)
    const options = {
      root,
      palette: await loadCardPalette(root),
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
    assert.notEqual(
      (
        await writeSocialCard(
          { ...options, palette: { ...options.palette, ink: '#912345' } },
          output
        )
      ).url,
      image.url
    )
  } finally {
    // Only the disposable directory created by this test is removed.
    for (const file of await readdir(output)) await unlink(path.join(output, file))
    await rmdir(output)
  }
})

test('rebuild cleanup removes obsolete cards while preserving active cards and unrelated files', async () => {
  const output = await mkdtemp(path.join(tmpdir(), 'dataguide-social-prune-'))
  try {
    const themes = await loadCardThemes(root)
    const options = {
      root,
      palette: await loadCardPalette(root),
      theme: themes.get('intro')!,
      title: 'What are databases?',
      topicTitle: 'Introduction to databases',
    }
    const old = await writeSocialCard(options, output)
    const current = await writeSocialCard(
      { ...options, title: 'Introduction to database schemas' },
      output
    )
    await writeFile(path.join(output, 'notes.txt'), 'Unrelated file')
    await pruneSocialCards(output, [current])
    assert.deepEqual(
      (await readdir(output)).sort(),
      [path.basename(current.url), 'notes.txt'].sort()
    )
    await assert.rejects(readFile(path.join(output, path.basename(old.url))), { code: 'ENOENT' })
    await pruneSocialCards(output, [current])
    assert.equal((await readdir(output)).length, 2, 'Cleanup is idempotent')
    await pruneSocialCards(output, [])
    assert.deepEqual(await readdir(output), ['notes.txt'])
  } finally {
    for (const file of await readdir(output)) await unlink(path.join(output, file))
    await rmdir(output)
  }
})
