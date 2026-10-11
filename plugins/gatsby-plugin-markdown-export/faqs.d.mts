export function extractFaqs(
  source: string,
  context: {
    resolveUrl: (url: string) => string
    resolveImage: (url: string) => string
    subsections: (depth: number) => unknown[]
  }
): { question: string; answer: string; text: string }[]
