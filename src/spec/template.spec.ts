import { describe, expect, it } from 'vitest'
import { Template } from '../index.js'

/**
 * The template contract.
 *
 * Every case here is asserted by the other implementations of this language
 * too, so text authored once resolves the same wherever it renders.
 */
const template = new Template()
const withChains = new Template({ enableChains: true })

describe('rendering a whole binding', () => {
  it('keeps the value type of a whole binding', () => {
    expect(template.render('{{ order.total }}', { order: { total: 12 } })).toBe(
      12,
    )
  })

  it('keeps the value type of a whole executable binding', () => {
    expect(template.render('{{{ order.total }}}', { order: { total: 12 } })).toBe(
      12,
    )
  })

  it('tolerates whitespace around a whole binding', () => {
    expect(template.render('  {{ total }}  ', { total: 3 })).toBe(3)
  })

  it('renders a value with no binding unchanged', () => {
    expect(template.render('plain text', {})).toBe('plain text')
  })

  it('walks an array of values', () => {
    expect(template.render(['{{ a }}', 'x {{ a }}'], { a: 2 })).toEqual([
      2,
      'x 2',
    ])
  })
})

describe('rendering bindings inside text', () => {
  it('interpolates a binding surrounded by text', () => {
    expect(template.render('Hi {{ name }}!', { name: 'Ada' })).toBe('Hi Ada!')
  })

  it('interpolates several bindings', () => {
    expect(template.render('{{ a }} and {{ b }}', { a: 1, b: 2 })).toBe(
      '1 and 2',
    )
  })

  it('renders a boolean as the string conversion does', () => {
    expect(template.render('paid: {{ paid }}', { paid: true })).toBe(
      'paid: true',
    )
    expect(template.render('paid: {{ paid }}', { paid: false })).toBe(
      'paid: false',
    )
  })

  it('renders an absent value as nothing', () => {
    expect(template.render('[{{ missing }}]', {})).toBe('[]')
  })

  it('renders a failing binding as nothing', () => {
    expect(template.render('[{{ 1 + "a" }}]', {})).toBe('[]')
  })
})

describe('the escape', () => {
  it('renders an escaped opener as a literal', () => {
    expect(template.render('\\{{ not a binding }}', {})).toBe(
      '{{ not a binding }}',
    )
  })

  it('escapes every opener in a value', () => {
    expect(Template.escape('a {{ b }} c')).toBe('a \\{{ b }} c')
  })

  it('renders escaped text back to what the author wrote', () => {
    const original = 'if (x) {{ y }}'

    expect(template.render(Template.escape(original), {})).toBe(original)
  })
})

describe('validity', () => {
  it('accepts a valid binding', () => {
    expect(template.isValid('{{ order.total > 0 }}')).toBe(true)
  })

  it('accepts a value with no binding', () => {
    expect(template.isValid('plain')).toBe(true)
  })

  it('rejects a binding that does not parse', () => {
    expect(template.isValid('{{ order. }}')).toBe(false)
  })

  it('rejects an empty binding', () => {
    expect(template.isValid('{{}}')).toBe(false)
  })

  it('rejects an opener with no closer', () => {
    expect(template.isValid('{{ order.total')).toBe(false)
  })

  it('accepts an escaped opener with no closer', () => {
    expect(template.isValid('\\{{ order.total')).toBe(true)
  })

  it('walks an array of values', () => {
    expect(template.isValid(['{{ a }}', '{{ b. }}'])).toBe(false)
  })
})

describe('roots', () => {
  it('names the variable a binding reads', () => {
    expect(template.roots('{{ order.total }}')).toEqual(['order'])
  })

  it('does not name a field', () => {
    expect(template.roots('{{ a.b.c }}')).toEqual(['a'])
  })

  it('does not name a function', () => {
    expect(template.roots('{{ money(cart.total) }}')).toEqual(['cart'])
  })

  it('names every variable across several bindings', () => {
    expect(template.roots('{{ a }} x {{ b.c }}')).toEqual(['a', 'b'])
  })

  it('names variables across an array of values', () => {
    expect(template.roots(['{{ a }}', '{{ b }}'])).toEqual(['a', 'b'])
  })

  it('names the receiver of a method call', () => {
    expect(template.roots('{{ article.links.map(l, l.title) }}')).toContain(
      'article',
    )
  })

  it('names nothing for a binding that does not parse', () => {
    expect(template.roots('{{ a. }}')).toEqual([])
  })

  it('names nothing inside a string literal', () => {
    expect(template.roots('{{ "order.total" }}')).toEqual([])
  })
})

describe('the chain opener', () => {
  it('is off by default, so a chain is ordinary text', () => {
    expect(template.render('write to @support.team', { support: { team: 'x' } })).toBe(
      'write to @support.team',
    )
  })

  it('resolves a chain when the host turns it on', () => {
    expect(
      withChains.render('write to @support.team', { support: { team: 'x' } }),
    ).toBe('write to x')
  })

  it('keeps the value type of a whole chain', () => {
    expect(withChains.render('@order.total', { order: { total: 12 } })).toBe(12)
  })

  it('leaves an unresolvable chain as the text the author wrote', () => {
    expect(withChains.render('mail jordan@example.com', {})).toBe(
      'mail jordan@example.com',
    )
  })

  it('does not open a chain inside an email address', () => {
    expect(
      withChains.render('mail jordan@example.com', { example: { com: 'x' } }),
    ).toBe('mail jordan@example.com')
  })

  it('names a chain variable in roots only when turned on', () => {
    expect(template.roots('@order.total')).toEqual([])
    expect(withChains.roots('@order.total')).toEqual(['order'])
  })
})

describe('the stored body', () => {
  it('wraps a body in a binding', () => {
    expect(Template.binding('contact.optedIn')).toBe('{{ contact.optedIn }}')
  })

  it('refuses a body that would close the binding early', () => {
    expect(() => Template.binding('a }} b')).toThrow()
  })

  it('reads the body back out of a whole binding', () => {
    expect(Template.body('{{ contact.optedIn }}')).toBe('contact.optedIn')
  })

  it('refuses to read a body from a value that interpolates', () => {
    expect(() => Template.body('x {{ a }} y')).toThrow()
  })
})

describe('the failure policy', () => {
  it('resolves a failed binding to null by default', () => {
    expect(template.render('{{ 1 + "a" }}', {})).toBeNull()
  })

  it('hands the failure to the host when one is given', () => {
    const seen: string[] = []
    const reporting = new Template({
      onFailure: (expression) => {
        seen.push(expression)
        return 'fallback'
      },
    })

    expect(reporting.render('{{ 1 + "a" }}', {})).toBe('fallback')
    expect(seen).toEqual(['1 + "a"'])
  })

  it('lets the host surface the failure by throwing', () => {
    const strict = new Template({
      onFailure: (expression) => {
        throw new Error(`bad binding: ${expression}`)
      },
    })

    expect(() => strict.render('{{ 1 + "a" }}', {})).toThrow('bad binding')
  })
})

describe('the fragment hook', () => {
  it('reports each piece with whether its author marked it executable', () => {
    const seen: Array<[unknown, boolean | null]> = []
    template.render('a {{ b }} c {{{ d }}}', { b: 1, d: 2 }, (value, mark) => {
      seen.push([value, mark])
      return value
    })

    expect(seen).toEqual([
      ['a ', null],
      [1, false],
      [' c ', null],
      [2, true],
      ['', null],
    ])
  })

  it('lets a host render a value its own way', () => {
    const rendered = template.render(
      'paid: {{ paid }}',
      { paid: true },
      (value, mark) => (mark === null ? value : value ? '1' : ''),
    )

    expect(rendered).toBe('paid: 1')
  })
})
