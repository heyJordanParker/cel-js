import { expect, describe, it } from 'vitest'
import { evaluate } from '..'
import { NoSuchOverloadException } from '../Exception/NoSuchOverloadException'

const value = (expression: string): unknown => evaluate(expression).getRawValue()

describe('hexadecimal integers', () => {
  it('should evaluate a simple hex integer', () => {
    expect(value('0xA')).toBe(10)
  })

  it('should evaluate a hex integer with lowercase', () => {
    expect(value('0xabc')).toBe(2748)
  })

  it('should handle hex integers in comparison operations', () => {
    expect(value('0xA > 0x5')).toBe(true)
  })

  it('should handle hex integers in lists', () => {
    expect(value('[0xA, 0x14, 0x1E][1]')).toBe(20) // 0x14 = 20
  })

  it('should evaluate hex unsigned integers with uppercase suffix', () => {
    expect(value('0xAU')).toBe(10)
  })

  it('should handle hex unsigned integers in arithmetic operations', () => {
    expect(value('0xAu + 10u')).toBe('20')
  })

  it('should refuse to add an unsigned integer to a signed one', () => {
    expect(() => value('0xAu + 10')).toThrow(NoSuchOverloadException)
  })
})
