import { expect, describe, it } from 'vitest'
import { evaluate } from '..'
import { NoSuchOverloadException } from '../Exception/NoSuchOverloadException'

const value = (expression: string): unknown => evaluate(expression).getRawValue()

describe('unsigned integers', () => {
  it('should evaluate a simple unsigned integer', () => {
    expect(value('123u')).toBe(123)
  })

  it('should evaluate a uppercase U unsigned integer', () => {
    expect(value('456U')).toBe(456)
  })

  it('should evaluate zero as unsigned integer', () => {
    expect(value('0u')).toBe(0)
  })

  it('should add two unsigned integers into the numeric string the server returns', () => {
    expect(value('10u + 5u')).toBe('15')
  })

  it('should refuse to add a signed integer to an unsigned one', () => {
    expect(() => value('10u + 5')).toThrow(NoSuchOverloadException)
  })

  it('should handle unsigned integers in comparisons', () => {
    expect(value('100u > 50')).toBe(true)
  })

  it('should evaluate a hexadecimal unsigned integer with uppercase', () => {
    expect(value('0xABCDU')).toBe(43981)
  })
})
