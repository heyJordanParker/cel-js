import { describe, expect, it } from 'vitest'
import { referencePaths } from '../index.js'

const keys = (expression: string) =>
  referencePaths(expression)?.map((path) =>
    path.segments.map((segment) => segment.key).join('.'),
  )

describe('referencePaths', () => {
  it('reads a bare root', () => {
    expect(keys('article')).toEqual(['article'])
  })

  it('reads a member chain', () => {
    expect(keys('article.author.email')).toEqual(['article.author.email'])
  })

  it('marks the indexed step of a chain', () => {
    const [path] = referencePaths('article.links[0].title') ?? []

    expect(path.segments).toEqual([
      { key: 'article', indexed: false },
      { key: 'links', indexed: true },
      { key: 'title', indexed: false },
    ])
  })

  it('reads both sides of a binary expression', () => {
    expect(keys('order.total > cart.subtotal')).toEqual([
      'order.total',
      'cart.subtotal',
    ])
  })

  it('does not treat a function name as a root', () => {
    expect(keys('money(cart.total)')).toEqual(['cart.total'])
  })

  it('reads a chain used as an index', () => {
    expect(keys('a[b.c]')).toEqual(['a', 'b.c'])
  })

  it('does not read names inside a string literal', () => {
    expect(keys('"article.title"')).toEqual([])
  })

  it('returns null for an expression that does not parse', () => {
    expect(referencePaths('article.')).toBeNull()
  })
})

describe('referencePaths and consumed collections', () => {
  it('does not mark a bare terminal chain consumed', () => {
    const [path] = referencePaths('article.links') ?? []

    expect(path.consumed).toBe(false)
  })

  it('marks a chain in a function argument consumed', () => {
    const [path] = referencePaths('size(article.links)') ?? []

    expect(path.consumed).toBe(true)
  })

  it('ends a chain at the collection a comprehension operates on', () => {
    const paths = referencePaths('article.links.map(l, l.title)') ?? []

    expect(paths).toHaveLength(1)
    expect(paths[0].segments.map((segment) => segment.key)).toEqual([
      'article',
      'links',
    ])
    expect(paths[0].consumed).toBe(true)
  })

  it('drops a chain rooted at a comprehension loop variable', () => {
    expect(keys('article.links.filter(l, l.published)')).toEqual([
      'article.links',
    ])
  })

  it('still reads a real root inside a comprehension body', () => {
    expect(keys('article.links.filter(l, l.date > cutoff.value)')).toEqual([
      'article.links',
      'cutoff.value',
    ])
  })

  it('does not mark an index expression consumed', () => {
    const paths = referencePaths('a[b.c]') ?? []

    expect(paths[1].consumed).toBe(false)
  })
})
