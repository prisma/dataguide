// Build-time only: compose existing artwork and text into crawler-readable PNGs.
import sharp from 'sharp'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { THEMED_TOPICS } from './topicThemes.ts'
import type { SocialImage } from './socialMetadata.ts'

export interface CardTheme {
  wash: string
  border: string
  scene: string
}

export const loadCardThemes = async (root: string): Promise<Map<string, CardTheme>> => {
  const cssPath = path.join(root, 'src/styles/topic-themes.css')
  const css = await readFile(cssPath, 'utf8')
  const themes = new Map<string, CardTheme>()
  for (const [, topic, block] of css.matchAll(
    /\.top-section\[data-topic='([^']+)'\] \{([^}]+)\}/g
  )) {
    const wash = block.match(/--topic-wash: (#[0-9a-f]{6});/)?.[1]
    const border = block.match(/--topic-border: (#[0-9a-f]{6});/)?.[1]
    const scene = block.match(/--topic-scene: url\('([^']+)'\);/)?.[1]
    if (!wash || !border || !scene) throw new Error(`Incomplete social card theme: ${topic}`)
    themes.set(topic, { wash, border, scene: path.resolve(path.dirname(cssPath), scene) })
  }
  if (themes.size !== THEMED_TOPICS.length || THEMED_TOPICS.some((topic) => !themes.has(topic))) {
    throw new Error('Social card themes do not match the topic registry')
  }
  return themes
}

export const escapeMarkup = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const textImage = (text: string, size: number, color: string, width: number, fontfile: string) =>
  sharp({
    text: {
      text: `<span foreground="${color}">${escapeMarkup(text)}</span>`,
      // Pango's unqualified sizes are points and depend on the host's logical DPI.
      font: `Sora Medium ${size}px`,
      fontfile,
      width,
      rgba: true,
      wrap: 'word',
      dpi: 72,
      spacing: 6,
    },
  })
    .png()
    .toBuffer({ resolveWithObject: true })

export const renderSocialCard = async ({
  title,
  topicTitle,
  theme,
  root,
}: {
  title: string
  topicTitle: string
  theme: CardTheme
  root: string
}) => {
  const fontfile = path.join(root, 'src/fonts/Sora.ttf')
  let headline: Awaited<ReturnType<typeof textImage>> | undefined
  for (let size = 64; size >= 32; size -= 2) {
    const candidate = await textImage(title, size, '#141414', 640, fontfile)
    if (candidate.info.height <= 296 && candidate.info.width <= 640) {
      headline = candidate
      break
    }
  }
  if (!headline) throw new Error(`Social card title does not fit: ${title}`)
  const label = await textImage(topicTitle, 24, '#5639ef', 640, fontfile)
  if (label.info.height > 68) throw new Error(`Social card topic label does not fit: ${topicTitle}`)
  const footer = await textImage('Prisma / dataguide', 23, '#141414', 480, fontfile)
  const artwork = await sharp(theme.scene).resize(420, 315, { fit: 'contain' }).png().toBuffer()
  const logo = await sharp(path.join(root, 'src/images/favicon.svg'))
    .resize(34, 34)
    .png()
    .toBuffer()
  const background = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <defs><linearGradient id="wash" x1="0" y1="0" x2="1" y2="0.5">
      <stop offset="25%" stop-color="#ffffff"/><stop offset="100%" stop-color="${theme.wash}"/>
    </linearGradient></defs>
    <rect width="1200" height="630" fill="#f9faf5"/>
    <rect x="1" y="1" width="1198" height="628" rx="30" fill="url(#wash)" stroke="${theme.border}" stroke-width="2"/>
  </svg>`)
  return sharp(background)
    .composite([
      { input: label.data, left: 72, top: 92 },
      { input: headline.data, left: 72, top: 186 },
      { input: artwork, left: 746, top: 140 },
      { input: logo, left: 72, top: 535 },
      { input: footer.data, left: 122, top: 541 },
    ])
    .flatten({ background: '#f9faf5' })
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toBuffer()
}

export const writeSocialCard = async (
  options: Parameters<typeof renderSocialCard>[0],
  outputDir: string
): Promise<SocialImage> => {
  const png = await renderSocialCard(options)
  const name = `${createHash('sha256').update(png).digest('hex').slice(0, 20)}.png`
  await mkdir(outputDir, { recursive: true })
  await writeFile(path.join(outputDir, name), png)
  return {
    url: `/social/generated/${name}`,
    alt: `${options.title}. Prisma's Data Guide, with Prismo artwork for ${options.topicTitle}.`,
    width: 1200,
    height: 630,
    type: 'image/png',
  }
}
