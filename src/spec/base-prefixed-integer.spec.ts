import { expect, describe, it } from 'vitest'
import { evaluate } from '..'

describe('octal integers', () => {
  it('should evaluate a simple octal integer', () => {
    expect(evaluate('0o17')).toBe(15)
  })

  it('should evaluate an octal unsigned integer', () => {
    expect(evaluate('0o17u')).toBe(15)
  })

  it('should handle octal integers in arithmetic operations', () => {
    expect(evaluate('0o10 + 1')).toBe(9)
  })
})

describe('binary integers', () => {
  it('should evaluate a simple binary integer', () => {
    expect(evaluate('0b1010')).toBe(10)
  })

  it('should evaluate a binary unsigned integer with uppercase suffix', () => {
    expect(evaluate('0b1010U')).toBe(10)
  })

  it('should handle binary integers in comparison operations', () => {
    expect(evaluate('0b1010 > 0b0101')).toBe(true)
  })

  it('should handle binary integers in lists', () => {
    expect(evaluate('[0b1, 0b10, 0b11][2]')).toBe(3)
  })
})
