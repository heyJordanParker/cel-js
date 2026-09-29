import { expect, describe, it } from 'vitest'

import { evaluate, FloatValue } from '..'
import { NoSuchOverloadException } from '../Exception/NoSuchOverloadException.js'
import { UnexpectedTokenException } from '../Parser/Exception/UnexpectedTokenException.js'

describe('an unterminated string', () => {
  it.each(['"foo', "'foo", '"""foo"', 'r"foo', 'b"foo', '"foo\\', '"', '"a" + "b'])(
    '%s is a parse error',
    (code) => {
      expect(() => evaluate(code)).toThrow(UnexpectedTokenException)
    },
  )
})

describe('a whole number the host passes', () => {
  it('reads as an int', () => {
    expect(evaluate('quantity / 2', { quantity: 5 }).getRawValue()).toBe(2)
  })

  it('reads as a double when the host passes a FloatValue', () => {
    const quantity = new FloatValue(5)

    expect(evaluate('quantity / 2', { quantity }).getRawValue()).toBe(2.5)
    expect(evaluate('type(quantity) == double', { quantity }).getRawValue()).toBe(true)
  })
})

describe('an operand of the wrong type', () => {
  it.each(['true * 1', '1 * true', '"a" + 0', '!!1', '--"a"', '1 && true', '1 || false'])(
    '%s is an error, as it is on the server',
    (code) => {
      expect(() => evaluate(code)).toThrow(NoSuchOverloadException)
    },
  )
})

describe('miscellaneous', () => {
  it('order of arithmetic operations', () => {
    const expr = '1 + 2 * 3 + 1'

    const result = evaluate(expr).getRawValue()

    expect(result).toBe(8)
  })

  describe('parenthesis', () => {
    it('should prioritize parenthesis expression', () => {
      const expr = '(1 + 2) * 3 + 1'

      const result = evaluate(expr).getRawValue()

      expect(result).toBe(10)
    })

    it('should allow multiple expressions', () => {
      const expr = '(1 + 2) * (3 + 1)'

      const result = evaluate(expr).getRawValue()

      expect(result).toBe(12)
    })
  })
})
