// Apply robots.txt's most specific user-agent group and longest matching rule.
// An equally specific Allow wins over Disallow; wildcards and end anchors are supported.
export const robotsAllows = (body, url, agent = '*') => {
  const groups = []
  let group = { agents: [], rules: [], directives: false }
  for (const line of body.split(/\r?\n/)) {
    const match = line.replace(/#.*$/, '').match(/^\s*([\w-]+)\s*:\s*(.*?)\s*$/)
    if (!match) continue
    const [, key, value] = match
    if (key.toLowerCase() === 'user-agent') {
      if (group.directives) {
        groups.push(group)
        group = { agents: [], rules: [], directives: false }
      }
      if (value) group.agents.push(value.toLowerCase())
    } else if (group.agents.length) {
      group.directives = true
      if (/^(allow|disallow)$/i.test(key) && value)
        group.rules.push({ allow: key.toLowerCase() === 'allow', pattern: value })
    }
  }
  groups.push(group)
  const specificity = (group) =>
    Math.max(
      -1,
      ...group.agents.map((value) =>
        value === '*' ? 0 : agent.toLowerCase().includes(value) ? value.length : -1
      )
    )
  const best = Math.max(...groups.map(specificity))
  const target = new URL(url)
  const pathname = target.pathname + target.search
  const matches = groups
    .filter((group) => specificity(group) === best)
    .flatMap((group) => group.rules)
    .filter(({ pattern }) => {
      const anchored = pattern.endsWith('$')
      const literal = anchored ? pattern.slice(0, -1) : pattern
      const expression = literal
        .split('*')
        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('.*')
      return new RegExp(`^${expression}${anchored ? '$' : ''}`).test(pathname)
    })
    .sort(
      (a, b) =>
        Buffer.byteLength(b.pattern.replace(/[*$]/g, '')) -
          Buffer.byteLength(a.pattern.replace(/[*$]/g, '')) || Number(b.allow) - Number(a.allow)
    )
  return matches[0]?.allow ?? true
}

export const indexingFailures = (results, { environment, canonicalRoot }) => {
  const failures = []
  const robots = results.find((row) => row.route === '/robots.txt (origin)')
  if (
    robots?.status !== 200 ||
    typeof robots.robotsPolicy !== 'string' ||
    !/^\s*user-agent\s*:\s*[^#\s]+/im.test(robots.robotsPolicy) ||
    robots.contentType?.includes('text/html')
  )
    failures.push({
      route: '/robots.txt (origin)',
      indexingError: 'Missing or invalid robots.txt policy',
    })
  for (const row of results) {
    if (
      row.route.includes('definitely-missing') ||
      row.route.startsWith('/robots') ||
      /\.(json|xml)$/.test(row.route) ||
      row.route === '/llms.txt'
    )
      continue
    const route = row.route.split('#')[0].replace(/\.md$/, '').replace(/\/$/, '')
    const expected = canonicalRoot.replace(/\/$/, '') + route
    const canonicals = row.canonicals || [row.canonical].filter(Boolean)
    if (!canonicals.length || canonicals.some((canonical) => canonical !== expected))
      failures.push({ ...row, indexingError: `Canonical must be ${expected}` })
    const noindex = [row.indexingHeader, ...(row.robotsMetas || [row.robotsMeta])]
      .filter(Boolean)
      .some((value) => /(?:^|[\s,:])(?:noindex|none)(?:$|[\s,;])/i.test(value))
    if (environment === 'production' && noindex)
      failures.push({ ...row, indexingError: 'Production representation forbids indexing' })
    if (robots?.status === 200 && typeof robots.robotsPolicy === 'string') {
      for (const agent of ['*', 'googlebot', 'bingbot']) {
        const allowed = robotsAllows(robots.robotsPolicy, row.requestedUrl, agent)
        if (allowed !== (environment === 'production'))
          failures.push({
            ...row,
            indexingError: `${environment} robots.txt must ${environment === 'production' ? 'allow' : 'block'} ${agent} crawling`,
          })
      }
    }
  }
  return failures
}
