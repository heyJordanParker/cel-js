import { expect, describe, it } from 'vitest'

import { evaluate } from '..'
import { NoSuchOverloadException } from '../Exception/NoSuchOverloadException'

describe('addition', () => {
  it('should evaluate addition', () => {
    expect(evaluate('1 + 1').getRawValue()).toBe(2)
  })

  it('should evaluate subtraction', () => {
    expect(evaluate('1 - 1').getRawValue()).toBe(0)
  })

  it('should evaluate addition with multiple terms', () => {
    expect(evaluate('1 + 1 + 1').getRawValue()).toBe(3)
  })

  it('should evaluate addition with multiple terms with different signs', () => {
    expect(evaluate('1 + 1 - 1').getRawValue()).toBe(1)
  })

  it('should evaluate float addition', () => {
    expect(evaluate('0.333 + 0.333').getRawValue()).toBe(0.666)
  })

  it('should concatenate strings', () => {
    expect(evaluate('"a" + "b"').getRawValue()).toBe('ab')
  })

  describe('should throw when', () => {
    it('is a boolean', () => {
      expect(() => evaluate('true + 1')).toThrow(NoSuchOverloadException)
      expect(() => evaluate('true + 1')).toThrow('No such overload for `bool` + `int`')
    })

    it('is a null', () => {
      expect(() => evaluate('null + 1')).toThrow(NoSuchOverloadException)
      expect(() => evaluate('null + 1')).toThrow('No such overload for `null_type` + `int`')
    })
  })
})
