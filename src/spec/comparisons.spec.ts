import { expect, describe, it } from 'vitest'

import { evaluate } from '..'
import { NoSuchOverloadException } from '../Exception/NoSuchOverloadException'

const value = (expression: string): unknown => evaluate(expression).getRawValue()

describe('comparisons', () => {
  it('should evaluate greater than operator', () => {
    expect(value('2 > 1')).toBe(true)
  })

  it('should evaluate less than operator', () => {
    expect(value('2 < 1')).toBe(false)
  })

  it('should evaluate greater than or equal operator', () => {
    expect(value('1 >= 1')).toBe(true)
  })

  it('should evaluate less than or equal operator', () => {
    expect(value('1 <= 1')).toBe(true)
  })

  it('should evaluate equal operator', () => {
    expect(value('1 == 1')).toBe(true)
  })

  it('should evaluate not equal operator', () => {
    expect(value('1 != 1')).toBe(false)
  })

  describe('in', () => {
    it('should return false for element in empty list', () => {
      expect(value('1 in []')).toBe(false)
    })

    it('should return true for element the only element on the list', () => {
      expect(value('1 in [1]')).toBe(true)
    })

    it('should return true for element the first element of the list', () => {
      expect(value('"first" in ["first", "second", "third"]')).toBe(true)
    })

    it('should thrown an error if used on something else than list', () => {
      expect(() => value('"a" in "asd"')).toThrow(NoSuchOverloadException)
    })

    it.each(['"install"', '"inin"', '"stalin"'])('should not be recognized in string', (aString) => {
      expect(value(aString)).toBe(aString.slice(1, -1))
    })
  })
})
