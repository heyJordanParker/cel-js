import { describe, expect, it } from 'vitest'
import { evaluate } from '../index.js'

describe('null-safe member access', () => {
  it('returns null when a link in the chain is null, without throwing', () => {
    const expr = 'a.b.c'
    const context = { a: { b: null } }

    expect(evaluate(expr, context)).toBeNull()
  })

  it('returns null when a link in the chain is missing, without throwing', () => {
    const expr = 'a.b.c'
    const context = { a: {} }

    expect(evaluate(expr, context)).toBeNull()
  })

  it('returns null when the root identifier is missing', () => {
    const expr = 'customer.firstName'

    expect(evaluate(expr, {})).toBeNull()
  })

  it('returns null for a null-rooted index chain', () => {
    const expr = 'a["b"]["c"]'
    const context = { a: null }

    expect(evaluate(expr, context)).toBeNull()
  })

  it('still resolves a real value through a present chain', () => {
    const expr = 'a.b.c'
    const context = { a: { b: { c: 7 } } }

    expect(evaluate(expr, context)).toBe(7)
  })
})

describe('?? coalesce operator', () => {
  it('falls back when the left operand is null', () => {
    expect(evaluate('a ?? "fallback"', { a: null })).toBe('fallback')
  })

  it('falls back when the left operand is a missing field (null-safe)', () => {
    expect(evaluate('a.b ?? "fallback"', { a: {} })).toBe('fallback')
  })

  it('falls back when the left operand is an empty string', () => {
    expect(evaluate('a ?? "fallback"', { a: '' })).toBe('fallback')
  })

  it('falls back when the left operand is an empty array', () => {
    expect(evaluate('a ?? "fallback"', { a: [] })).toBe('fallback')
  })

  it('falls back when the left operand is an empty map', () => {
    expect(evaluate('a ?? "fallback"', { a: {} })).toBe('fallback')
  })

  it('does NOT fall back on a real string value', () => {
    expect(evaluate('a ?? "fallback"', { a: 'real' })).toBe('real')
  })

  it('does NOT fall back on 0', () => {
    expect(evaluate('a ?? 99', { a: 0 })).toBe(0)
  })

  it('does NOT fall back on false', () => {
    expect(evaluate('a ?? true', { a: false })).toBe(false)
  })

  it('does NOT fall back on a non-empty array', () => {
    expect(evaluate('a ?? [9]', { a: [1, 2] })).toStrictEqual([1, 2])
  })

  it('chains left-associatively, taking the first non-empty operand', () => {
    expect(evaluate('a ?? b ?? c', { a: null, b: '', c: 'third' })).toBe('third')
    expect(evaluate('a ?? b ?? c', { a: null, b: 'second', c: 'third' })).toBe(
      'second',
    )
    expect(evaluate('a ?? b ?? c', { a: 'first', b: 'second', c: 'third' })).toBe(
      'first',
    )
  })

  it('returns the last operand when every operand is empty', () => {
    expect(evaluate('a ?? b ?? c', { a: null, b: '', c: null })).toBeNull()
  })

  it('binds looser than comparison (precedence)', () => {
    // If ?? bound tighter than ==, this would parse as `1 == (2 ?? 3)` -> false.
    // Looser binding parses as `(1 == 2) ?? 3` -> false (a real boolean, no fallback).
    expect(evaluate('1 == 2 ?? 3', {})).toBe(false)
  })

  it('binds looser than logical or (precedence)', () => {
    // Parses as `(false || false) ?? "fallback"`. The left is a real boolean
    // (false is not empty), so no fallback.
    expect(evaluate('false || false ?? "fallback"', {})).toBe(false)
  })

  it('resolves the sample firstName expression', () => {
    const expr = "customer.firstName ?? 'there'"

    expect(evaluate(expr, { customer: { firstName: 'Ada' } })).toBe('Ada')
    expect(evaluate(expr, { customer: null })).toBe('there')
    expect(evaluate(expr, { customer: { firstName: '' } })).toBe('there')
    expect(evaluate(expr, {})).toBe('there')
  })
})
