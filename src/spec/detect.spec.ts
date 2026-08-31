import { describe, expect, it } from 'vitest'
import { SpanVerdict, detectQuery, findSpans } from '../index.js'

const chains = { enableChains: true }

/** Marks every candidate valid, so a test can look at spans alone. */
const anything = (): SpanVerdict => 'valid'

describe('detectQuery in a brace binding', () => {
  it('reports the binding being typed', () => {
    const text = 'Hi {{ article.au'

    expect(detectQuery(text, text.length)).toEqual({
      opener: 'braces',
      anchor: 3,
      caret: 16,
      query: ' article.au',
    })
  })

  it('reports nothing before an opener', () => {
    expect(detectQuery('Hi {{ a }}', 2)).toBeNull()
  })

  it('reports nothing inside a binding that already closed', () => {
    const text = 'Hi {{ a }} there'

    expect(detectQuery(text, text.length)).toBeNull()
  })

  it('reports nothing when the caret sits inside a finished binding', () => {
    expect(detectQuery('Hi {{ a }}', 8)).toBeNull()
  })

  it('reports nothing across a line break', () => {
    const text = '{{ a\nb'

    expect(detectQuery(text, text.length)).toBeNull()
  })

  it('reports the innermost opener when a second one follows', () => {
    const text = '{{ a }} and {{ b'

    expect(detectQuery(text, text.length)?.anchor).toBe(12)
  })

  it('does not open on an escaped opener', () => {
    const text = '\\{{ a'

    expect(detectQuery(text, text.length)).toBeNull()
  })
})

describe('detectQuery with the chain opener', () => {
  it('reports nothing for a chain when chains are off', () => {
    const text = 'write to @support.te'

    expect(detectQuery(text, text.length)).toBeNull()
  })

  it('reports the chain being typed when chains are on', () => {
    const text = 'write to @support.te'

    expect(detectQuery(text, text.length, chains)).toEqual({
      opener: 'at',
      anchor: 9,
      caret: 20,
      query: 'support.te',
    })
  })

  it('does not open inside an email address', () => {
    const text = 'mail jordan@example'

    expect(detectQuery(text, text.length, chains)).toBeNull()
  })

  it('does not open on a digit-led chain', () => {
    const text = 'call @2fast'

    expect(detectQuery(text, text.length, chains)).toBeNull()
  })

  it('closes once the caret leaves the chain', () => {
    const text = '@article.title and more'

    expect(detectQuery(text, text.length, chains)).toBeNull()
  })

  it('reports the opener nearest the caret', () => {
    const text = '@a and {{ b'

    expect(detectQuery(text, text.length, chains)?.opener).toBe('braces')
  })
})

describe('findSpans', () => {
  it('finds a finished binding', () => {
    expect(findSpans('Hi {{ a }}!', anything)).toEqual([
      { opener: 'braces', start: 3, end: 10, inner: ' a ', valid: true },
    ])
  })

  it('finds several bindings in document order', () => {
    const spans = findSpans('{{ a }} x {{ b }}', anything)

    expect(spans.map((span) => span.inner.trim())).toEqual(['a', 'b'])
  })

  it('does not find an unfinished binding', () => {
    expect(findSpans('{{ a }} and {{ b', anything)).toHaveLength(1)
  })

  it('does not find an escaped opener', () => {
    expect(findSpans('\\{{ a }}', anything)).toHaveLength(0)
  })

  it('marks an empty binding invalid without asking the validator', () => {
    const spans = findSpans('{{}}', () => 'valid')

    expect(spans[0].valid).toBe(false)
  })

  it('marks a binding by the validator verdict', () => {
    const spans = findSpans('{{ a }}', () => 'invalid')

    expect(spans[0].valid).toBe(false)
  })

  it('omits a candidate the validator drops', () => {
    expect(findSpans('{{ a }}', () => 'drop')).toHaveLength(0)
  })
})

describe('findSpans with the chain opener', () => {
  it('finds no chain when chains are off', () => {
    expect(findSpans('write to @support.team', anything)).toHaveLength(0)
  })

  it('finds a chain when chains are on', () => {
    expect(findSpans('write to @support.team', anything, chains)).toEqual([
      { opener: 'at', start: 9, end: 22, inner: 'support.team', valid: true },
    ])
  })

  it('excludes a trailing dot from a chain', () => {
    const [span] = findSpans('@article. done', anything, chains)

    expect(span.inner).toBe('article')
    expect(span.end).toBe(8)
  })

  it('does not scan a chain inside a brace binding', () => {
    const spans = findSpans('{{ a }} @b', anything, chains)

    expect(spans.map((span) => span.opener)).toEqual(['braces', 'at'])
  })

  it('leaves a dropped chain out, so prose stays prose', () => {
    const verdict = (inner: string): SpanVerdict =>
      inner === 'article.title' ? 'valid' : 'drop'

    const spans = findSpans('hi @everyone, see @article.title', verdict, chains)

    expect(spans.map((span) => span.inner)).toEqual(['article.title'])
  })

  it('does not find a chain inside an email address', () => {
    expect(findSpans('mail jordan@example.com', anything, chains)).toHaveLength(
      0,
    )
  })
})
