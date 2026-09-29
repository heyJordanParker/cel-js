import { expect, describe, it } from 'vitest'
import { evaluate } from '..'

const value = (expression: string): unknown => evaluate(expression).getRawValue()

describe('maps expressions', () => {
  describe('literal', () => {
    it('should create a empty map', () => {
      const expr = '{}'

      const result = value(expr)

      expect(result).toStrictEqual({})
    })

    it('should create a one element map', () => {
      const expr = '{"a": 1}'

      const result = value(expr)

      expect(result).toStrictEqual({ a: 1 })
    })

    it('should create a many element map', () => {
      const expr = '{"a": 1, "b": 2, "c": 3}'

      const result = value(expr)

      expect(result).toStrictEqual({ a: 1, b: 2, c: 3 })
    })

    it('should create a map of mixed value types', () => {
      expect(value('{"a": 1, "b": true}')).toStrictEqual({ a: 1, b: true })
    })
  })

  describe('index', () => {
    describe('dot expression', () => {
      it('should get the value of a key', () => {
        const expr = '{"a": 1}.a'

        const result = value(expr)

        expect(result).toBe(1)
      })

      it('should return null if the key does not exist', () => {
        const expr = '{"a": 1}.b'

        const result = value(expr)

        expect(result).toBeNull()
      })
    })
    describe('index expression', () => {
      it('should get the value of a key', () => {
        const expr = '{"a": 1}["a"]'

        const result = value(expr)

        expect(result).toBe(1)
      })

      it('should return null if the key does not exist', () => {
        const expr = '{"a": 1}["b"]'

        const result = value(expr)

        expect(result).toBeNull()
      })

      it('should return null if the key is not present', () => {
        const expr = '{"a": 1}[1]'

        const result = value(expr)

        expect(result).toBeNull()
      })
    })
  })

  describe('equal', () => {
    it('should compare two equal maps', () => {
      const expr = '{"c": 1, "a": 1, "b": 2} == {"a": 1, "b": 2, "c": 1}'

      const result = value(expr)

      expect(result).toBe(true)
    })
    it('should compare two different maps', () => {
      const expr = '{"a": 1, "b": 2} == {"a": 1, "b": 2, "c": 1}'

      const result = value(expr)

      expect(result).toBe(false)
    })
  })
  describe('not equal', () => {
    it('should compare two equal maps', () => {
      const expr = '{"c": 1, "a": 1, "b": 2} != {"a": 1, "b": 2, "c": 1}'

      const result = value(expr)

      expect(result).toBe(false)
    })
    it('should compare two different maps', () => {
      const expr = '{"a": 1, "b": 2} != {"a": 1, "b": 2, "c": 1}'

      const result = value(expr)

      expect(result).toBe(true)
    })
  })
  describe('in', () => {
    it('should find a key in the map', () => {
      const expr = '"c" in {"c": 1, "a": 1, "b": 2}'

      const result = value(expr)

      expect(result).toBe(true)
    })
    it('should not find a key in the map', () => {
      const expr = '"z" in {"c": 1, "a": 1, "b": 2}'

      const result = value(expr)

      expect(result).toBe(false)
    })
  })
})
