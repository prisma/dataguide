import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
const sources = JSON.parse(readFileSync('lifecycle-sources.json', 'utf8'))
const simulate = process.argv.find((arg) => arg.startsWith('--simulate='))?.split('=')[1]
const record = process.argv.includes('--record')
const baseline =
  record || simulate ? [] : JSON.parse(readFileSync('lifecycle-baseline.json', 'utf8'))
const observations = []
for (let i = 0; i < sources.length; i += 4)
  observations.push(
    ...(await Promise.all(
      sources.slice(i, i + 4).map(async (source) => {
        if (simulate) return { ...source, changed: source.id === simulate, result: 'simulated' }
        try {
          const response = await fetch(source.url, { signal: AbortSignal.timeout(15000) })
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const body = (await response.text())
            .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
          const sha256 = createHash('sha256').update(body).digest('hex')
          return {
            ...source,
            sha256,
            changed: !record && baseline.find((item) => item.id === source.id)?.sha256 !== sha256,
            result: 'observed',
          }
        } catch (error) {
          return { ...source, result: 'inconclusive', error: error.message }
        }
      })
    ))
  )
const checkedAt = new Date().toISOString()
if (record && observations.every((item) => item.result === 'observed'))
  writeFileSync(
    'lifecycle-baseline.json',
    `${JSON.stringify(
      observations.map(({ id, url, sha256 }) => ({ id, url, sha256, checkedAt })),
      null,
      2
    )}\n`
  )
const tasks = observations
  .filter((item) => item.changed || item.result === 'inconclusive')
  .map((item) => ({
    title: `Review ${item.id} lifecycle source`,
    owner: item.owner,
    affectedPaths: item.paths,
    lane: item.lane,
    source: item.url,
    reason:
      item.error ||
      'Upstream documentation fingerprint changed; determine whether behavior changed before editing',
    acceptance:
      'Keep preview separate; rerun affected fixtures before changing tested versions or test dates.',
  }))
mkdirSync('.verification-runs', { recursive: true })
writeFileSync(
  '.verification-runs/lifecycle.json',
  `${JSON.stringify({ checkedAt, simulated: !!simulate, observations, tasks }, null, 2)}\n`
)
for (const task of tasks)
  console.log(`${task.title}: ${task.owner}; ${task.affectedPaths.join(', ')}`)
if (!simulate && tasks.length) process.exitCode = 1
