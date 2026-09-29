import { expect, describe, it } from 'vitest'

import { evaluate } from '..'
import { NoSuchOverloadException } from '../Exception/NoSuchOverloadException'

const value = (expression: string, variables: Record<string, unknown> = {}): unknown =>
  evaluate(expression, variables).getRawValue()

describe('lists expressions', () => {
  describe('literals', () => {
    it('should create a empty list', () => {
      expect(value('[]')).toStrictEqual([])
    })

    it('should create a one element list', () => {
      expect(value('[1]')).toStrictEqual([1])
    })

    it('should create a many element list', () => {
      expect(value('[1, 2, 3]')).toStrictEqual([1, 2, 3])
    })

    it('should create a list of mixed types', () => {
      expect(value('[1, true]')).toStrictEqual([1, true])
    })
  })

  describe('lists', () => {
    it('should create a one element list', () => {
      expect(value('[[1]]')).toStrictEqual([[1]])
    })

    it('should create a many element list', () => {
      expect(value('[[1], [2], [3]]')).toStrictEqual([[1], [2], [3]])
    })
  })

  describe('index', () => {
    it('should access list by index', () => {
      expect(value('a[1]', { a: [1, 2, 3] })).toBe(2)
    })

    it('should access list by index if literal used', () => {
      expect(value('[1, 2, 3][1]')).toBe(2)
    })

    it('should access list on zero index', () => {
      expect(value('[7, 8, 9][0]')).toBe(7)
    })

    it('should access first element if index 0.0', () => {
      expect(value('[7, 8, 9][0.0]')).toBe(7)
    })

    it('should throw error on index 0.1', () => {
      expect(() => value('[7, 8, 9][0.1]')).toThrow(NoSuchOverloadException)
      expect(() => value('[7, 8, 9][0.1]')).toThrow('List indices must be an integer or integral double, got `double`')
    })

    it('should access list a singleton', () => {
      expect(value('["foo"][0]')).toBe('foo')
    })

    it('should access list on the last index', () => {
      expect(value('[7, 8, 9][2]')).toBe(9)
    })

    it('should access the list on middle values', () => {
      expect(value('[0, 1, 1, 2, 3, 5, 8, 13][4]')).toBe(3)
    })

    it('should read an index out of bounds as null', () => {
      expect(value('[1][5]')).toBeNull()
    })
  })

  describe('concatenation', () => {
    it('should concatenate two lists', () => {
      expect(value('[1, 2] + [3, 4]')).toStrictEqual([1, 2, 3, 4])
    })

    it('should concatenate two lists with the same element', () => {
      expect(value('[2] + [2]')).toStrictEqual([2, 2])
    })

    it('should return empty list if both elements are empty', () => {
      expect(value('[] + []')).toStrictEqual([])
    })

    it('should return correct list if left side is empty', () => {
      expect(value('[] + [1, 2]')).toStrictEqual([1, 2])
    })

    it('should return correct list if right side is empty', () => {
      expect(value('[1, 2] + []')).toStrictEqual([1, 2])
    })

    it('should concatenate lists of different types', () => {
      expect(value('[1] + [true]')).toStrictEqual([1, true])
    })
  })
})
