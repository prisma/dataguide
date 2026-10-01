// Explicitly marked diffs copy the resulting code: removed lines are omitted.
export const DIFF_MARKERS = ['+', '-', '|']

export const copyableText = (code: string, diff: boolean): string =>
  diff
    ? code
        .split('\n')
        .filter((line) => !line.startsWith('-'))
        .map((line) => (DIFF_MARKERS.includes(line.charAt(0)) ? line.slice(1) : line))
        .join('\n')
    : code

export const copyLabel = (language: string, props: Record<string, unknown>): string => {
  if (props.patch) return 'Copy patch'
  if (props.diff) return 'Copy resulting code'
  if (props.output || language === 'text') return 'Copy output'
  if (props['expected-failure']) return 'Copy expected failure'
  if (props.pseudocode) return 'Copy pseudocode'
  return 'Copy code'
}
