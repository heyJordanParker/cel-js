import { expect, describe, it } from 'vitest'

import { evaluate } from '..'
import { DivisionByZeroException } from '../Exception/DivisionByZeroException'
import { EvaluationException } from '../Exception/EvaluationException'
import { NoSuchOverloadException } from '../Exception/NoSuchOverloadException'

const value = (expression: string): unknown => evaluate(expression).getRawValue()

describe('multiplication', () => {
  it('should evaluate multiplication', () => {
    expect(value('2 * 3')).toBe(6)
  })

  it('should evaluate division', () => {
    expect(value('6 / 3')).toBe(2)
  })

  it('should truncate integer division', () => {
    expect(value('7 / 2')).toBe(3)
  })

  it('should evaluate modulo', () => {
    expect(value('6 % 4')).toBe(2)
  })

  it('should evaluate multiplication with multiple terms', () => {
    expect(value('2 * 3 * 4')).toBe(24)
  })

  it('should evaluate multiplication with multiple terms with different signs', () => {
    expect(value('2 * 3 / 3')).toBe(2)
  })

  describe('should throw when', () => {
    it('is a boolean', () => {
      expect(() => value('true * 1')).toThrow(NoSuchOverloadException)
    })

    it('is a null', () => {
      expect(() => value('null / 1')).toThrow('No such overload for `null_type` / `int`')
    })

    it('is dividing by 0', () => {
      expect(() => value('1 / 0')).toThrow(DivisionByZeroException)
      expect(() => value('1 / 0')).toThrow('Failed to evaluate division: division by zero')
    })

    it('is modulo by 0', () => {
      expect(() => value('1 % 0')).toThrow(EvaluationException)
      expect(() => value('1 % 0')).toThrow('Failed to evaluate modulo: division by zero')
    })
  })

  describe('double division by zero follows IEEE-754', () => {
    it('is positive infinity', () => {
      expect(value('1.5 / 0')).toBe(Infinity)
    })

    it('is negative infinity', () => {
      expect(value('-1.5 / 0')).toBe(-Infinity)
    })

    it('is infinity for an integral double', () => {
      expect(value('1.0 / 0.0')).toBe(Infinity)
    })

    it('divides a double by a double', () => {
      expect(value('3.0 / 1.5')).toBe(2)
    })

    it('divides two doubles into a fraction', () => {
      expect(value('7.5 / 2.5')).toBe(3)
    })
  })
})
