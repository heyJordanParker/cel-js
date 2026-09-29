import { expect, describe, it } from 'vitest'

import { evaluate } from '..'

describe('atomic expressions', () => {
  it('should evaluate a number', () => {
    expect(evaluate('1').getRawValue()).toBe(1)
  })

  it('should evaluate a hexadecimal number', () => {
    expect(evaluate('0xA').getRawValue()).toBe(10)
  })

  it('should evaluate a true boolean literal', () => {
    expect(evaluate('true').getRawValue()).toBe(true)
  })

  it('should evaluate a false boolean literal', () => {
    expect(evaluate('false').getRawValue()).toBe(false)
  })

  it('should evaluate null literal', () => {
    expect(evaluate('null').getRawValue()).toBeNull()
  })

  it('should evaluate a double-quoted string literal', () => {
    expect(evaluate('"foo"').getRawValue()).toBe('foo')
  })

  it('should evaluate a single-quoted string literal', () => {
    expect(evaluate("'foo'").getRawValue()).toBe('foo')
  })

  it('should keep a newline inside a double-quoted string', () => {
    expect(evaluate('"fo\no"').getRawValue()).toBe('fo\no')
  })

  it('should keep a newline inside a single-quoted string', () => {
    expect(evaluate("'fo\no'").getRawValue()).toBe('fo\no')
  })

  it('should evaluate a float', () => {
    expect(evaluate('1.2').getRawValue()).toBe(1.2)
  })
})
