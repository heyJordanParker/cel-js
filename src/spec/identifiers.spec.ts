import { expect, describe, it } from 'vitest'
import { evaluate } from '..'
import { NoSuchVariableException } from '../Exception/NoSuchVariableException'
import { UnexpectedTokenException } from '../Parser/Exception/UnexpectedTokenException'

const value = (expression: string, variables: Record<string, unknown> = {}): unknown =>
  evaluate(expression, variables).getRawValue()

describe('identifiers', () => {
  describe('dot notation', () => {
    it('should evaluate single identifier', () => {
      expect(value('a', { a: 2 })).toBe(2)
    })

    it('should evaluate nested identifiers', () => {
      expect(value('a.b.c', { a: { b: { c: 2 } } })).toBe(2)
    })
  })

  describe('index notation', () => {
    it('should evaluate single identifier', () => {
      expect(value('a["b"]', { a: { b: 2 } })).toBe(2)
    })

    it('should evaluate nested identifiers', () => {
      expect(value('a["b"]["c"]', { a: { b: { c: 2 } } })).toBe(2)
    })
  })

  it('should evaluate identifiers - mixed', () => {
    expect(value('a.b["c"].d', { a: { b: { c: { d: 2 } } } })).toBe(2)
  })

  it('should evaluate identifiers - multiple usage of the same identifiers', () => {
    expect(value('a.b["c"].d + a.b["c"].d', { a: { b: { c: { d: 2 } } } })).toBe(4)
  })

  it('should return object if identifier is object', () => {
    expect(value('a', { a: { b: 2 } })).toStrictEqual({ b: 2 })
  })

  it('should throw if access to identifier but w/o context', () => {
    expect(() => value('a')).toThrow(NoSuchVariableException)
  })

  it('should throw if identifier is not in context', () => {
    expect(() => value('a', { b: 2 })).toThrow('Variable `a` is not defined in the environment')
  })

  describe('reserved identifiers', () => {
    it('should throw if reserved identifier is used', () => {
      expect(() => value('as')).toThrow(UnexpectedTokenException)
    })

    it('should throw if reserved is used as a statment', () => {
      expect(() => value('as + 1')).toThrow(UnexpectedTokenException)
    })

    it('should throw if reserved is the root of a chain', () => {
      expect(() => value('as.b', { as: { b: 2 } })).toThrow(UnexpectedTokenException)
    })

    it('should throw if reserved is a field of a chain', () => {
      expect(() => value('b.as', { b: { as: 2 } })).toThrow(UnexpectedTokenException)
    })

    it('should not throw if reserved is start of an identifire string', () => {
      expect(value('asx.b', { asx: { b: 2 } })).toBe(2)
    })

    it('should not throw if reserved is in the middle of an identifire string', () => {
      expect(value('xasx.b', { xasx: { b: 2 } })).toBe(2)
    })

    it('should not throw if reserved is at the end of an identifire string', () => {
      expect(value('xas.b', { xas: { b: 2 } })).toBe(2)
    })
  })
})
