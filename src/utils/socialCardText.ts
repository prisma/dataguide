// Build-time text: use the bundled font's outlines instead of native font substitution.
import sharp from 'sharp'
import { readFile } from 'node:fs/promises'
import { create as createFont } from 'fontkit'
import type { Font } from 'fontkit'

const fonts = new Map<string, Promise<Font>>()
const loadFont = (fontfile: string) => {
  if (!fonts.has(fontfile)) {
    fonts.set(
      fontfile,
      readFile(fontfile).then((buffer) => {
        const font = createFont(buffer)
        if (!('layout' in font)) throw new Error('Social card font must be a single font')
        return font.getVariation({ wght: 500 })
      })
    )
  }
  return fonts.get(fontfile)!
}

export const textImage = async (
  text: string,
  size: number,
  color: string,
  width: number,
  fontfile: string
) => {
  const font = await loadFont(fontfile)
  for (const character of text) {
    if (!/\s/.test(character) && !font.hasGlyphForCodePoint(character.codePointAt(0)!)) {
      throw new Error(`Social card font does not support character: ${character}`)
    }
  }
  const scale = size / font.unitsPerEm
  const lines: string[] = []
  let line = ''
  for (const word of text.trim().split(/\s+/)) {
    const next = line ? `${line} ${word}` : word
    if (line && font.layout(next).advanceWidth * scale > width) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  if (!lines.length) throw new Error('Social card text must not be empty')
  const runs = lines.map((value) => font.layout(value))
  const top = Math.max(...runs.map((run) => run.bbox.maxY))
  const bottom = Math.min(...runs.map((run) => run.bbox.minY))
  const lineHeight = size * 1.2 + 6
  const svgWidth =
    Math.ceil(
      Math.max(
        ...runs.map(
          (run) => (Math.max(run.advanceWidth, run.bbox.maxX) - Math.min(0, run.bbox.minX)) * scale
        )
      )
    ) + 4
  const svgHeight = Math.ceil((top - bottom) * scale + (runs.length - 1) * lineHeight) + 4
  const paths = runs
    .flatMap((run, row) => {
      let cursor = -Math.min(0, run.bbox.minX)
      return run.glyphs.map((glyph, index) => {
        const position = run.positions[index]
        const x = 2 + (cursor + position.xOffset) * scale
        const y = 2 + (top - position.yOffset) * scale + row * lineHeight
        cursor += position.xAdvance
        return `<path d="${glyph.path.toSVG()}" transform="translate(${x} ${y}) scale(${scale} ${-scale})"/>`
      })
    })
    .join('')
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}"><g fill="${color}">${paths}</g></svg>`
  )
  const result = await sharp(svg).trim().png().toBuffer({ resolveWithObject: true })
  return { ...result, lines: lines.length }
}
