import { describe, expect, it } from 'vitest'
import { evaluate } from '../index.js'

/**
 * The functions every implementation of this language provides under the same
 * names, so an expression authored once evaluates the same wherever it runs.
 */
describe('sum()', () => {
  it('totals a list of integers', () => {
    expect(evaluate('sum([1, 2, 3])')).toBe(6)
  })

  it('totals a list of floats', () => {
    expect(evaluate('sum([1.0, 2.0])')).toBe(3)
  })

  it('totals a list of mixed numbers', () => {
    expect(evaluate('sum([1, 2.5])')).toBe(3.5)
  })

  it('totals an empty list as zero', () => {
    expect(evaluate('sum([])')).toBe(0)
  })

  it('rejects a list holding a non-number', () => {
    expect(() => evaluate('sum([1, "a"])')).toThrow()
  })
})

describe('max()', () => {
  it('takes the largest of a list', () => {
    expect(evaluate('max([1, 5, 2])')).toBe(5)
  })

  it('takes the larger of two integers', () => {
    expect(evaluate('max(1, 5)')).toBe(5)
  })

  it('takes the larger of an integer and a float', () => {
    expect(evaluate('max(0, 2.5)')).toBe(2.5)
  })

  it('floors a smaller value', () => {
    expect(evaluate('max(0.0, -2.5)')).toBe(0)
  })

  it('rejects a null operand', () => {
    expect(() => evaluate('max(0.0, null)')).toThrow()
  })

  it('takes an absent operand given a value by the caller', () => {
    expect(evaluate('max(0.0, discount ?? 0.0)', { discount: null })).toBe(0)
  })

  it('rejects an empty list', () => {
    expect(() => evaluate('max([])')).toThrow()
  })
})

describe('double()', () => {
  it('passes a number through', () => {
    expect(evaluate('double(2.5)')).toBe(2.5)
    expect(evaluate('double(2)')).toBe(2)
  })

  it('converts a numeric string', () => {
    expect(evaluate('double("2.5")')).toBe(2.5)
  })

  it('converts a boolean', () => {
    expect(evaluate('double(true)')).toBe(1)
  })

  it('rejects a non-numeric string', () => {
    expect(() => evaluate('double("abc")')).toThrow()
  })
})

describe('contains()', () => {
  it('finds a substring', () => {
    expect(evaluate('contains("hello world", "world")')).toBe(true)
    expect(evaluate('contains("hello", "world")')).toBe(false)
  })

  it('finds a list member', () => {
    expect(evaluate('contains([1, 2], 2)')).toBe(true)
    expect(evaluate('contains([1, 2], 3)')).toBe(false)
  })
})

describe('join()', () => {
  it('joins a list of strings', () => {
    expect(evaluate('join(["a", "b"])')).toBe('ab')
  })

  it('joins with a separator', () => {
    expect(evaluate('join(["a", "b"], ", ")')).toBe('a, b')
  })

  it('rejects a list holding a non-string', () => {
    expect(() => evaluate('join(["a", 1])')).toThrow()
  })

  it('joins what a comprehension produced', () => {
    expect(
      evaluate('join(article.links.map(l, l.title), ", ")', {
        article: { links: [{ title: 'One' }, { title: 'Two' }] },
      }),
    ).toBe('One, Two')
  })
})

describe('|| short circuit', () => {
  it('does not evaluate an operand after a true one', () => {
    // `unknownMethod()` has no implementation, so reaching it throws. A true
    // left operand settles the result and the right is never evaluated.
    expect(evaluate('true || unknown.field.missingMethod()')).toBe(true)
  })

  it('still evaluates the right operand when the left is false', () => {
    expect(evaluate('false || true')).toBe(true)
  })
})
