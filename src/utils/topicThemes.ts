// The CSS defines the artwork and colors; topicThemes.test.ts checks this registry against it.
export const THEMED_TOPICS = [
  'intro',
  'datamodeling',
  'types',
  'postgresql',
  'mysql',
  'sqlite',
  'mssql',
  'mongodb',
  'database-tools',
  'managing-databases',
  'serverless',
  'just-for-fun',
] as const

export const getThemedTopic = (path: string): string | undefined => {
  // Accept local site paths only; external links and heading permalinks are not topic hooks.
  if (!path.startsWith('/') || path.startsWith('//')) return undefined
  const topic = path.replace(/^\/dataguide(?=\/)/, '').split('/')[1]
  return THEMED_TOPICS.find((value) => value === topic)
}
