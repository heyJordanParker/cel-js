import { describe, expect, it } from 'vitest'
import { evaluate } from '../index.js'
import { EvaluationException } from '../Exception/EvaluationException.js'

const value = (expression: string, variables: Record<string, unknown> = {}): unknown =>
  evaluate(expression, variables).getRawValue()

describe('Ternary Operator', () => {
  it('should handle simple ternary expressions', () => {
    expect(value('true ? 1 : 2')).toBe(1)
    expect(value('false ? 1 : 2')).toBe(2)
  })

  it('should handle complex conditions in ternary expressions', () => {
    expect(value('1 < 2 ? "yes" : "no"')).toBe('yes')
    expect(value('2 < 1 ? "yes" : "no"')).toBe('no')
    expect(value('1 + 1 == 2 ? "correct" : "incorrect"')).toBe('correct')
  })

  it('should handle nested ternary expressions - true case', () => {
    expect(value('true ? (true ? 1 : 2) : 3')).toBe(1)
    expect(value('true ? (false ? 1 : 2) : 3')).toBe(2)
  })

  it('should handle nested ternary expressions - false case', () => {
    expect(value('false ? 1 : (true ? 2 : 3)')).toBe(2)
    expect(value('false ? 1 : (false ? 2 : 3)')).toBe(3)
  })

  it('should handle complex expressions in all parts of the ternary', () => {
    expect(value('1 + 1 == 2 ? 3 * 2 : 5 * 2')).toBe(6)
    expect(value('1 + 1 != 2 ? 3 * 2 : 5 * 2')).toBe(10)
  })

  it('should work with variables', () => {
    expect(
      value('user.admin ? "Admin" : "User"', { user: { admin: true } }),
    ).toBe('Admin')
    expect(
      value('user.admin ? "Admin" : "User"', { user: { admin: false } }),
    ).toBe('User')
  })

  it('should support logical operators in condition', () => {
    expect(value('true && true ? "yes" : "no"')).toBe('yes')
    expect(value('true && false ? "yes" : "no"')).toBe('no')
    expect(value('false || true ? "yes" : "no"')).toBe('yes')
    expect(value('false || false ? "yes" : "no"')).toBe('no')
  })

  it('should refuse a condition that is not a bool', () => {
    expect(() => value('null ? "true" : "false"')).toThrow(EvaluationException)
    expect(() => value('!null ? "true" : "false"')).toThrow(EvaluationException)
  })
})
