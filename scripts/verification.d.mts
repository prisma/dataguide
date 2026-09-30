export function validateVerification(
  manifest: {
    articles: Array<{
      file: string
      owner: string
      scope: string
      level: string
      releaseChannel: string
      evidence?: string
      fixture?: string
      versions?: string[]
      reviewDate?: string
    }>
  },
  root?: string
): string[]
