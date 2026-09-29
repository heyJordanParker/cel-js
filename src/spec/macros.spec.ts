import { expect, describe, it } from 'vitest'

import { Configuration, evaluate } from '..'
import { InvalidMacroCallException } from '../Exception/InvalidMacroCallException'
import { NoSuchFunctionException } from '../Exception/NoSuchFunctionException'
import type { HostFunction } from '../Extension/Callable/CallableFunction'

const value = (
  expression: string,
  variables: Record<string, unknown> = {},
  functions: Record<string, HostFunction> = {},
): unknown => evaluate(expression, variables, new Configuration({ functions })).getRawValue()

describe('macros', () => {
  describe('has', () => {
    const context = { object: { property: true } }

    it('should return true when nested property exists', () => {
      expect(value('has(object.property)', context)).toBe(true)
    })

    it('should return false when property does not exists', () => {
      expect(value('has(object.nonExisting)', context)).toBe(false)
    })

    it('should return false when property does not exists, combined with property usage', () => {
      expect(value('has(object.nonExisting) && object.nonExisting', context)).toBe(false)
    })

    it('should throw when no arguments are passed', () => {
      expect(() => value('has()', context)).toThrow(NoSuchFunctionException)
    })

    it.each(['has(object)', 'has(object[0])', 'has(object[property])', 'has("")', 'has([1, 2, 3])', 'has(true)', 'has(42)'])(
      'should throw when %s holds no member access',
      (expression) => {
        expect(() => value(expression, context)).toThrow(InvalidMacroCallException)
        expect(() => value(expression, context)).toThrow(
          'The `has` macro requires a single member access expression as an argument.',
        )
      },
    )
  })

  describe('size', () => {
    describe('list', () => {
      it('should return 0 for empty list', () => {
        expect(value('size([])')).toBe(0)
      })

      it('should return 1 for one element list', () => {
        expect(value('size([1])')).toBe(1)
      })

      it('should return 3 for three element list', () => {
        expect(value('size([1, 2, 3])')).toBe(3)
      })
    })

    describe('map', () => {
      it('should return 0 for empty map', () => {
        expect(value('size({})')).toBe(0)
      })

      it('should return 1 for one element map', () => {
        expect(value('size({"a": 1})')).toBe(1)
      })

      it('should return 3 for three element map', () => {
        expect(value('size({"a": 1, "b": 2, "c": 3})')).toBe(3)
      })
    })

    describe('string', () => {
      it('should return 0 for empty string', () => {
        expect(value('size("")')).toBe(0)
      })

      it('should return length of string', () => {
        expect(value('size("abc")')).toBe(3)
      })
    })
  })
})

describe('host functions', () => {
  describe('single argument', () => {
    it('should execute a single argument host function', () => {
      expect(value('foo(bar)', { bar: 'bar' }, { foo: (arg: unknown) => `foo:${arg}` })).toBe('foo:bar')
    })
  })

  describe('multi argument', () => {
    it('should execute a two argument host function', () => {
      const foo = (thing: unknown, intensity: unknown) => `foo:${thing} ${intensity}`

      expect(value('foo(bar, 42)', { bar: 'bar' }, { foo })).toBe('foo:bar 42')
    })
  })

  describe('interaction with engine functions', () => {
    const foo = (thing: unknown, intensity: unknown, enable: unknown) => `foo:${thing} ${intensity} ${enable}`

    it('should keep engine functions beside host functions', () => {
      expect(value('foo(bar, size("ubernete"), true)', { bar: 'bar' }, { foo })).toBe('foo:bar 8 true')
    })

    it('should run an engine overload before a host function of the same name', () => {
      expect(value('foo(bar, size("ubernete"), true)', { bar: 'bar' }, { foo, size: () => 'strange' })).toBe(
        'foo:bar 8 true',
      )
    })

    it('should run a host function where no engine overload takes the arguments', () => {
      expect(value('size(123)', {}, { size: () => 'strange' })).toBe('strange')
    })
  })

  describe('unknown functions', () => {
    it('should throw when an unknown function is called', () => {
      expect(() => value('foo(bar)', { bar: 'bar' })).toThrow('Function `foo` is not defined')
    })

    it('should not treat context values as first-class functions', () => {
      expect(() => value('foo(bar)', { foo: 'foo', bar: 'bar' })).toThrow(NoSuchFunctionException)
    })
  })
})
