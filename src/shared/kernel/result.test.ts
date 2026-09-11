import { describe, expect, it } from 'vitest'
import { err, ok } from './result'

describe('result', () => {
  it('ok wraps value', () => {
    expect(ok(42)).toEqual({ ok: true, value: 42 })
  })

  it('err wraps code and message', () => {
    expect(err('x', 'y')).toEqual({ ok: false, error: { code: 'x', message: 'y' } })
  })
})
