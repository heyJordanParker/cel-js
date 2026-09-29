import { describe, expect, it } from 'vitest'
import { evaluate } from '../index.js'
import { NoSuchOverloadException } from '../Exception/NoSuchOverloadException.js'

const value = (expression: string): unknown => evaluate(expression).getRawValue()

describe('Unary Operators', () => {
  describe('Logical negation (!)', () => {
    it('should negate boolean values correctly', () => {
      expect(value('!true')).toBe(false)
      expect(value('!false')).toBe(true)
      expect(value('!!true')).toBe(true)
      expect(value('!!false')).toBe(false)
      expect(value('!!!true')).toBe(false)
    })

    it.each(['!null', '!!null', '!"string"', '!123', '![]', '!{}'])('should throw on %s', (expression) => {
      expect(() => value(expression)).toThrow(NoSuchOverloadException)
    })
  })

  describe('Arithmetic negation (-)', () => {
    it('should negate numeric values correctly', () => {
      expect(value('-5')).toBe(-5)
      expect(value('--5')).toBe(5)
      expect(value('---5')).toBe(-5)
      expect(value('-0')).toBe(0)
      expect(value('-3.14')).toBe(-3.14)
    })

    it.each(['-"string"', '-true', '-null', '-[]', '-{}'])('should throw on %s', (expression) => {
      expect(() => value(expression)).toThrow(NoSuchOverloadException)
    })
  })

  describe('Integration with other operators', () => {
    it('should work with comparison operators', () => {
      expect(value('!true == false')).toBe(true)
      expect(value('!(5 > 3) == false')).toBe(true)
      expect(value('-5 < 0')).toBe(true)
    })

    it('should work with conditional operators', () => {
      expect(value('!true ? "yes" : "no"')).toBe('no')
      expect(value('!false ? "yes" : "no"')).toBe('yes')
    })

    it('should respect operator precedence', () => {
      expect(value('!true || true')).toBe(true)
      expect(value('!(true || true)')).toBe(false)
      expect(value('-5 + 3')).toBe(-2)
    })
  })
})
