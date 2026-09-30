export type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
export type IsAny<T> = 0 extends 1 & T ? true : false
export function expectType<T extends true>(): void {}

export function localConnection(name: string): string {
  const value = process.env[name]
  if (!value || new URL(value).hostname !== '127.0.0.1')
    throw new Error('The experiment requires its disposable loopback URL')
  return value
}

import assert from 'node:assert/strict'
export const observations: unknown[] = []
export async function failure(
  label: string,
  operation: () => Promise<unknown>,
  valid: (error: unknown) => boolean
) {
  try {
    await operation()
  } catch (error) {
    assert.ok(valid(error), `${label}: unexpected error ${String(error)}`)
    const e = error as {
      name?: string
      code?: string
      message?: string
      original?: { code?: string }
      driverError?: { code?: string }
    }
    observations.push({
      label,
      rejected: true,
      error: {
        name: e.name,
        code: e.code || e.original?.code || e.driverError?.code,
        message: e.message,
      },
    })
    return
  }
  throw new Error(`${label}: expected rejection`)
}
export const state = (code: string) => (error: unknown) => {
  const e = error as {
    code?: string
    original?: { code?: string }
    driverError?: { code?: string }
  }
  return (e.code || e.original?.code || e.driverError?.code) === code
}
export function record(label: string, value: unknown) {
  observations.push({ label, value })
}
export function finish() {
  console.log(JSON.stringify({ observations }))
}
