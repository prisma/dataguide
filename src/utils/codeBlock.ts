// Code blocks marked with `diff` (```js diff) show a +, - or | marker at the start of changed
// lines. The markers are not part of the code, so they are left out when copying.
export const DIFF_MARKERS = ['+', '-', '|']

export const copyableText = (code: string, diff: boolean): string =>
  diff
    ? code
        .split('\n')
        .map((line) => (DIFF_MARKERS.includes(line.charAt(0)) ? line.slice(1) : line))
        .join('\n')
    : code
