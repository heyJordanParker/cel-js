import { expect, describe, it } from 'vitest'

import { evaluate } from '..'

const value = (expression: string): unknown => evaluate(expression).getRawValue()

describe('logical operators', () => {
  describe('AND', () => {
    it('should return true if second expressions are true', () => {
      expect(value('true && true')).toBe(true)
    })

    it('should return false if second expression is false', () => {
      expect(value('true && false')).toBe(false)
    })

    it('should return true if all expressions are true', () => {
      expect(value('true && true && true')).toBe(true)
    })

    it('should return false if at least one expressions is false', () => {
      expect(value('true && false && true')).toBe(false)
    })

    it('should throw if the right operand is not a bool', () => {
      expect(() => value('true && 1')).toThrow('No such overload for `bool` && `int`')
    })
  })

  describe('OR', () => {
    it('should return true if at least one expression is true', () => {
      expect(value('true || false')).toBe(true)
    })

    it('should return false if all expressions are false', () => {
      expect(value('false || false')).toBe(false)
    })

    it('should return true if at least expression is true', () => {
      expect(value('false || true || false')).toBe(true)
    })
  })

  it('should be able to combine AND and OR', () => {
    expect(value('true && true || false')).toBe(true)
  })

  it('should not reach the right operand once the left settles the result', () => {
    expect(value('true || 1')).toBe(true)
  })

  it('should throw if the right operand is not a bool', () => {
    expect(() => value('false || 1')).toThrow('No such overload for `bool` || `int`')
  })
})
