import { describe, expect, it } from 'vitest'
import { evaluate, Exception } from '../index.js'

const value = (expression: string, variables: Record<string, unknown> = {}): unknown =>
  evaluate(expression, variables).getRawValue()

/**
 * The functions every implementation of this language provides under the same
 * names, so an expression authored once evaluates the same wherever it runs.
 */
describe('sum()', () => {
  it('totals a list of integers', () => {
    expect(value('sum([1, 2, 3])')).toBe(6)
  })

  it('totals a list of floats', () => {
    expect(value('sum([1.0, 2.0])')).toBe(3)
  })

  it('totals a list of mixed numbers', () => {
    expect(value('sum([1, 2.5])')).toBe(3.5)
  })

  it('totals an empty list as zero', () => {
    expect(value('sum([])')).toBe(0)
  })

  it('rejects a list holding a non-number', () => {
    expect(() => value('sum([1, "a"])')).toThrow(Exception)
  })
})

describe('max()', () => {
  it('takes the largest of a list', () => {
    expect(value('max([1, 5, 2])')).toBe(5)
  })

  it('takes the larger of two integers', () => {
    expect(value('max(1, 5)')).toBe(5)
  })

  it('takes the larger of an integer and a float', () => {
    expect(value('max(0, 2.5)')).toBe(2.5)
  })

  it('floors a smaller value', () => {
    expect(value('max(0.0, -2.5)')).toBe(0)
  })

  it('rejects a null operand', () => {
    expect(() => value('max(0.0, null)')).toThrow(Exception)
  })

  it('takes an absent operand given a value by the caller', () => {
    expect(value('max(0.0, discount ?? 0.0)', { discount: null })).toBe(0)
  })

  it('rejects an empty list', () => {
    expect(() => value('max([])')).toThrow(Exception)
  })
})

describe('double()', () => {
  it('passes a number through', () => {
    expect(value('double(2.5)')).toBe(2.5)
    expect(value('double(2)')).toBe(2)
  })

  it('converts a numeric string', () => {
    expect(value('double("2.5")')).toBe(2.5)
  })

  it('converts a boolean', () => {
    expect(value('double(true)')).toBe(1)
  })

  it('rejects a non-numeric string', () => {
    expect(() => value('double("abc")')).toThrow(Exception)
  })
})

describe('contains()', () => {
  it('finds a substring', () => {
    expect(value('contains("hello world", "world")')).toBe(true)
    expect(value('contains("hello", "world")')).toBe(false)
  })

  it('finds a list member', () => {
    expect(value('contains([1, 2], 2)')).toBe(true)
    expect(value('contains([1, 2], 3)')).toBe(false)
  })
})

describe('join()', () => {
  it('joins a list of strings', () => {
    expect(value('join(["a", "b"])')).toBe('ab')
  })

  it('joins with a separator', () => {
    expect(value('join(["a", "b"], ", ")')).toBe('a, b')
  })

  it('rejects a list holding a non-string', () => {
    expect(() => value('join(["a", 1])')).toThrow(Exception)
  })

  it('joins what a comprehension produced', () => {
    expect(
      value('join(article.links.map(l, l.title), ", ")', {
        article: { links: [{ title: 'One' }, { title: 'Two' }] },
      }),
    ).toBe('One, Two')
  })
})

describe('|| short circuit', () => {
  it('does not evaluate an operand after a true one', () => {
    // `unknownMethod()` has no implementation, so reaching it throws. A true
    // left operand settles the result and the right is never evaluated.
    expect(value('true || unknown.field.missingMethod()')).toBe(true)
  })

  it('still evaluates the right operand when the left is false', () => {
    expect(value('false || true')).toBe(true)
  })
})
