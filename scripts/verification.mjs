import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'

export const validateVerification = (manifest, root = process.cwd()) => {
  const errors = []
  const seen = new Set()
  for (const entry of manifest.articles) {
    if (seen.has(entry.file)) errors.push(`duplicate article: ${entry.file}`)
    seen.add(entry.file)
    if (!entry.file?.startsWith('content/') || !existsSync(`${root}/${entry.file}`))
      errors.push(`missing article: ${entry.file}`)
    if (
      !entry.owner ||
      !entry.scope ||
      !['unreviewed', 'source-reviewed', 'executed', 'partial', 'external-needed'].includes(
        entry.level
      )
    )
      errors.push(`invalid verification metadata: ${entry.file}`)
    if (!['stable', 'preview', 'not-applicable'].includes(entry.releaseChannel))
      errors.push(`invalid release channel: ${entry.file}`)
    if (entry.level !== 'executed') continue
    if (!entry.evidence || !entry.fixture || !entry.versions?.length || !entry.reviewDate) {
      errors.push(`tested article requires fixture, evidence, versions and date: ${entry.file}`)
      continue
    }
    try {
      const run = JSON.parse(readFileSync(`${root}/${entry.evidence}`, 'utf8'))
      const hash = createHash('sha256')
        .update(readFileSync(`${root}/${entry.file}`))
        .digest('hex')
      const recorded = run.articles?.find((a) => a.file === entry.file)
      if (run.status !== 'passed' || run.cleanedUp !== true || recorded?.sourceSha256 !== hash)
        errors.push(`tested status has no successful matching-source run: ${entry.file}`)
      if (!existsSync(`${root}/${entry.fixture}`)) errors.push(`missing fixture: ${entry.fixture}`)
      else if (
        run.fixtureSha256 !==
        createHash('sha256')
          .update(readFileSync(`${root}/${entry.fixture}`))
          .digest('hex')
      )
        errors.push(`tested status has no matching-fixture run: ${entry.file}`)
      for (const source of run.supportingSources || []) {
        if (
          !existsSync(`${root}/${source.file}`) ||
          createHash('sha256')
            .update(readFileSync(`${root}/${source.file}`))
            .digest('hex') !== source.sha256
        )
          errors.push(`tested supporting source changed: ${source.file}`)
      }
    } catch (error) {
      errors.push(`unreadable evidence for ${entry.file}: ${error.message}`)
    }
  }
  return errors
}

if (process.argv[1]?.endsWith('/verification.mjs')) {
  const errors = validateVerification(JSON.parse(readFileSync('content-verification.json', 'utf8')))
  if (errors.length) {
    console.error(errors.join('\n'))
    process.exitCode = 1
  } else console.log('Verification metadata and tested-source evidence match')
}
