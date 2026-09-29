import { describe, expect, it } from 'vitest'
import { Exception, Template } from '../index.js'

const template = new Template()
const withChains = new Template({ enableChains: true })

describe('rendering a whole expression', () => {
  it('keeps the value type of a whole expression', () => {
    expect(template.render('{{ order.total }}', { order: { total: 12 } })).toBe(12)
  })

  it('keeps the value type of a whole raw expression', () => {
    expect(template.render('{{{ order.total }}}', { order: { total: 12 } })).toBe(12)
  })

  it('tolerates whitespace around a whole expression', () => {
    expect(template.render('  {{ total }}  ', { total: 3 })).toBe(3)
  })

  it('renders a value with no expression unchanged', () => {
    expect(template.render('plain text', {})).toBe('plain text')
  })

  it('walks an array of values', () => {
    expect(template.render(['{{ a }}', 'x {{ a }}'], { a: 2 })).toStrictEqual([2, 'x 2'])
  })
})

describe('rendering expressions inside text', () => {
  it('interpolates an expression surrounded by text', () => {
    expect(template.render('Hi {{ name }}!', { name: 'Ada' })).toBe('Hi Ada!')
  })

  it('interpolates several expressions', () => {
    expect(template.render('{{ a }} and {{ b }}', { a: 1, b: 2 })).toBe('1 and 2')
  })

  it('renders a boolean as the string conversion does', () => {
    expect(template.render('paid: {{ paid }}', { paid: true })).toBe('paid: true')
    expect(template.render('paid: {{ paid }}', { paid: false })).toBe('paid: false')
  })

  it('renders an absent value as nothing', () => {
    expect(template.render('[{{ missing }}]', {})).toBe('[]')
  })

  it('renders a failing expression as nothing', () => {
    expect(template.render('[{{ 1 + "a" }}]', {})).toBe('[]')
  })
})

describe('the escape', () => {
  it('renders an escaped opener as a literal', () => {
    expect(template.render('\\{{ not an expression }}', {})).toBe('{{ not an expression }}')
  })

  it('marks every opener', () => {
    expect(Template.escape('a {{ b }} c')).toBe('a \\{{ b }} c')
  })

  it('renders an escaped opener beside a real expression', () => {
    expect(template.render('a \\{{ b }} {{ c }}', { c: 1 })).toBe('a {{ b }} 1')
  })

  it('renders escaped text back to what the author wrote', () => {
    const original = 'if (x) {{ y }}'

    expect(template.render(Template.escape(original), {})).toBe(original)
  })
})

describe('validity', () => {
  it('accepts a valid expression', () => {
    expect(Template.isValid('{{ order.total > 0 }}')).toBe(true)
  })

  it('accepts a value with no expression', () => {
    expect(Template.isValid('plain')).toBe(true)
  })

  it('rejects an expression that does not parse', () => {
    expect(Template.isValid('{{ order. }}')).toBe(false)
  })

  it('rejects an empty expression', () => {
    expect(Template.isValid('{{}}')).toBe(false)
  })

  it('rejects an opener with no closer', () => {
    expect(Template.isValid('{{ order.total')).toBe(false)
  })

  it('accepts an escaped opener with no closer', () => {
    expect(Template.isValid('\\{{ order.total')).toBe(true)
  })

  it('walks an array of values', () => {
    expect(Template.isValid(['{{ a }}', '{{ b. }}'])).toBe(false)
  })
})

describe('roots', () => {
  it('names the variable an expression reads', () => {
    expect(template.roots('{{ order.total }}')).toStrictEqual(['order'])
  })

  it('does not name a field', () => {
    expect(template.roots('{{ a.b.c }}')).toStrictEqual(['a'])
  })

  it('does not name a function', () => {
    expect(template.roots('{{ size(cart.items) }}')).toStrictEqual(['cart'])
  })

  it('names every variable across expressions', () => {
    expect(template.roots('{{ a }} x {{ b.c }}')).toStrictEqual(['a', 'b'])
  })

  it('walks an array of values', () => {
    expect(template.roots(['{{ a }}', '{{ b }}'])).toStrictEqual(['a', 'b'])
  })

  it('names the receiver of a comprehension and not its variable', () => {
    expect(template.roots('{{ article.links.map(l, l.title) }}')).toStrictEqual(['article'])
  })

  it('names nothing for an expression that does not parse', () => {
    expect(template.roots('{{ a. }}')).toStrictEqual([])
  })

  it('names nothing inside a string literal', () => {
    expect(template.roots('{{ "order.total" }}')).toStrictEqual([])
  })
})

describe('paths', () => {
  it('names the fields an expression reads', () => {
    expect(template.paths('{{ order.total }}')).toStrictEqual({ order: [['total']] })
  })

  it('keeps the whole chain', () => {
    expect(template.paths('{{ a.b.c }}')).toStrictEqual({ a: [['b', 'c']] })
  })

  it('reads a literal index as its own segment', () => {
    expect(template.paths('{{ funnel.currentStep.offers[1].price }}')).toStrictEqual({
      funnel: [['currentStep', 'offers', 1, 'price']],
    })
  })

  it('stops at an index it cannot name', () => {
    expect(template.paths('{{ offers[position].price }}')).toStrictEqual({ offers: [[]], position: [[]] })
  })

  it("names the index expression's own reads", () => {
    expect(template.paths('{{ offers[position.current].price }}').position).toStrictEqual([['current']])
  })

  it('gives a bare root the empty chain', () => {
    expect(template.paths('{{ order }}')).toStrictEqual({ order: [[]] })
  })

  it('does not name a function', () => {
    expect(template.paths('{{ size(cart.items) }}')).toStrictEqual({ cart: [['items']] })
  })

  it('stops at the collection a comprehension walks', () => {
    expect(template.paths('{{ article.links.map(l, l.title) }}')).toStrictEqual({ article: [['links']] })
  })

  it('gathers every chain of one root', () => {
    expect(template.paths('{{ order.total }} {{ order.currency }}')).toStrictEqual({ order: [['total'], ['currency']] })
  })

  it('names one chain once', () => {
    expect(template.paths('{{ order.total }} {{ order.total }}')).toStrictEqual({ order: [['total']] })
  })

  it('walks an array of values', () => {
    expect(template.paths(['{{ a.b }}', '{{ c.d }}'])).toStrictEqual({ a: [['b']], c: [['d']] })
  })

  it('names nothing for an expression that does not parse', () => {
    expect(template.paths('{{ a. }}')).toStrictEqual({})
  })

  it('names nothing inside a string literal', () => {
    expect(template.paths('{{ "order.total" }}')).toStrictEqual({})
  })
})

describe('references', () => {
  it('names each path the code reads', () => {
    expect(Template.references('order.total > 0 && contact.email != ""')).toStrictEqual([
      ['order', 'total'],
      ['contact', 'email'],
    ])
  })

  it('gives a bare root its own path', () => {
    expect(Template.references('order')).toStrictEqual([['order']])
  })

  it('names each path once', () => {
    expect(Template.references('a.b + a.b')).toStrictEqual([['a', 'b']])
  })

  it('reads a literal index as its own segment', () => {
    expect(Template.references('offers[1].price')).toStrictEqual([['offers', 1, 'price']])
    expect(Template.references('labels["en"].title')).toStrictEqual([['labels', 'en', 'title']])
  })

  it('reads a computed index as every item', () => {
    expect(Template.references('items[i].price')).toStrictEqual([['items', null, 'price'], ['i']])
  })

  it('reads through parentheses', () => {
    expect(Template.references('(order).total')).toStrictEqual([['order', 'total']])
  })

  it('does not name a function or a string', () => {
    expect(Template.references('size(cart.items) > 0 && "order.total" != ""')).toStrictEqual([['cart', 'items']])
  })

  it('reads the argument of has', () => {
    expect(Template.references('has(contact.email)')).toStrictEqual([['contact', 'email']])
  })

  it.each([
    'offers.map(o, o.active)',
    'offers.filter(o, o.active)',
    'offers.all(o, o.active)',
    'offers.exists(o, o.active)',
    'offers.exists_one(o, o.active)',
  ])('reads the variable of %s through its collection', (code) => {
    expect(Template.references(code)).toStrictEqual([['offers'], ['offers', null, 'active']])
  })

  it('reads every argument of a filtering map', () => {
    expect(Template.references('offers.map(o, o.active, o.price)')).toStrictEqual([
      ['offers'],
      ['offers', null, 'active'],
      ['offers', null, 'price'],
    ])
  })

  it('reads a bare comprehension variable as every item', () => {
    expect(Template.references('offers.map(o, o)')).toStrictEqual([['offers'], ['offers', null]])
  })

  it('reads no path for an index or key variable', () => {
    expect(Template.references('offers.all(i, o, o.price > i)')).toStrictEqual([['offers'], ['offers', null, 'price']])
    expect(Template.references('offers.transformList(i, o, i < 3, o.price)')).toStrictEqual([
      ['offers'],
      ['offers', null, 'price'],
    ])
  })

  it("reads an optional's value as the optional", () => {
    expect(Template.references('contact.?address.optMap(a, a.city)')).toStrictEqual([
      ['contact', 'address'],
      ['contact', 'address', 'city'],
    ])
  })

  it('reads nested comprehensions through each collection', () => {
    expect(Template.references('funnel.steps.map(s, s.offers.map(o, o.price))')).toStrictEqual([
      ['funnel', 'steps'],
      ['funnel', 'steps', null, 'offers'],
      ['funnel', 'steps', null, 'offers', null, 'price'],
    ])
  })

  it('lets a comprehension variable shadow a root', () => {
    expect(Template.references('item.map(item, item.name)')).toStrictEqual([['item'], ['item', null, 'name']])
  })

  it('reads a root inside a comprehension body', () => {
    expect(Template.references('offers.filter(o, o.price < cart.total)')).toStrictEqual([
      ['offers'],
      ['offers', null, 'price'],
      ['cart', 'total'],
    ])
  })

  it('reads no path through a collection that is not one', () => {
    expect(Template.references('[a, b].map(x, x.y)')).toStrictEqual([['a'], ['b']])
  })

  it('reads a variable over a filter through the filtered items', () => {
    expect(Template.references('offers.filter(o, o.active).map(o, o.name)')).toStrictEqual([
      ['offers'],
      ['offers', null, 'active'],
      ['offers', null, 'name'],
    ])
    expect(
      Template.references('offers.filter(o, o.active).filter(p, p.price > 0).exists(q, q.nope)'),
    ).toStrictEqual([
      ['offers'],
      ['offers', null, 'active'],
      ['offers', null, 'price'],
      ['offers', null, 'nope'],
    ])
    expect(Template.references('(offers.filter(o, o.active)).all(o, o.ok)')).toStrictEqual([
      ['offers'],
      ['offers', null, 'active'],
      ['offers', null, 'ok'],
    ])
  })

  it('reads no path for a variable over built items', () => {
    expect(Template.references('offers.map(o, o.price).map(p, p.nope)')).toStrictEqual([
      ['offers'],
      ['offers', null, 'price'],
    ])
    expect(
      Template.references('offers.map(o, o.price).filter(p, p > 1).map(q, q.x)'),
    ).toStrictEqual([['offers'], ['offers', null, 'price']])
  })

  it('throws when the code does not parse', () => {
    expect(() => Template.references('order.')).toThrow(Exception)
  })
})

describe('rename', () => {
  it('rewrites a path', () => {
    expect(Template.rename('fields.email == "x"', 'fields.email', 'fields.contact')).toBe('fields.contact == "x"')
  })

  it('rewrites every read', () => {
    expect(Template.rename('fields.email + fields.email', 'fields.email', 'fields.contact')).toBe(
      'fields.contact + fields.contact',
    )
  })

  it('keeps the rest of a longer path', () => {
    expect(Template.rename('fields.email.domain', 'fields.email', 'fields.contact')).toBe('fields.contact.domain')
    expect(Template.rename('fields.items[0].name', 'fields.items', 'fields.rows')).toBe('fields.rows[0].name')
  })

  it('rewrites a root', () => {
    expect(Template.rename('contact.name', 'contact', 'person')).toBe('person.name')
  })

  it('leaves another path alone', () => {
    expect(Template.rename('fields.emails == "x"', 'fields.email', 'fields.contact')).toBe('fields.emails == "x"')
    expect(Template.rename('fields["email"]', 'fields.email', 'fields.contact')).toBe('fields["email"]')
  })

  it('rewrites a root inside a comprehension body', () => {
    expect(Template.rename('items.map(i, fields.email == i.x)', 'fields.email', 'fields.contact')).toBe(
      'items.map(i, fields.contact == i.x)',
    )
  })

  it('leaves a comprehension variable that shadows the root', () => {
    expect(Template.rename('items.map(fields, fields.email)', 'fields.email', 'fields.contact')).toBe(
      'items.map(fields, fields.email)',
    )
  })

  it('leaves code that does not parse', () => {
    expect(Template.rename('fields.email ==', 'fields.email', 'fields.contact')).toBe('fields.email ==')
  })
})

describe('parts', () => {
  it('splits text from expressions', () => {
    expect(Template.parts('Hi {{ name }}!')).toStrictEqual(['Hi ', { code: 'name', raw: false }, '!'])
  })

  it('marks a raw expression', () => {
    expect(Template.parts('{{{ html }}}')).toStrictEqual([{ code: 'html', raw: true }])
  })

  it('trims the code', () => {
    expect(Template.parts('{{   a   }}')).toStrictEqual([{ code: 'a', raw: false }])
  })

  it('reads an escaped opener as text', () => {
    expect(Template.parts('\\{{ literal }} {{ a }}')).toStrictEqual(['{{ literal }} ', { code: 'a', raw: false }])
  })

  it('keeps a chain as text', () => {
    expect(Template.parts('mail @support.team')).toStrictEqual(['mail @support.team'])
  })

  it('has no empty text', () => {
    expect(Template.parts('{{ a }}{{ b }}')).toStrictEqual([
      { code: 'a', raw: false },
      { code: 'b', raw: false },
    ])
    expect(Template.parts('')).toStrictEqual([])
  })

  it('reads an opener inside an expression as its code', () => {
    expect(Template.parts('{{ a {{ b }}')).toStrictEqual([{ code: 'a {{ b', raw: false }])
  })
})

describe('compose', () => {
  it('writes parts back as the template they came from', () => {
    const written = 'Hi {{ name }}, \\{{ not }} {{{ raw }}}'

    expect(Template.compose(Template.parts(written))).toBe(written)
  })

  it('escapes text so it renders as written', () => {
    expect(Template.compose(['a {{ b }}'])).toBe('a \\{{ b }}')
    expect(template.render(Template.compose(['a {{ b }}']), {})).toBe('a {{ b }}')
  })

  it('refuses code that would close early', () => {
    expect(() => Template.compose([{ code: '{"a": {"b": 1}}', raw: false }])).toThrow(
      'An expression body cannot contain `}}`',
    )
  })

  it('refuses text that would escape the next expression', () => {
    expect(() => Template.compose(['a \\', { code: 'b', raw: false }])).toThrow(
      'would escape the expression after it',
    )
  })
})

describe('the chain opener', () => {
  it('is ordinary text when off', () => {
    expect(template.render('write to @support.team', { support: { team: 'x' } })).toBe('write to @support.team')
  })

  it('resolves when the host turns it on', () => {
    expect(withChains.render('write to @support.team', { support: { team: 'x' } })).toBe('write to x')
  })

  it('keeps the value type of a whole chain', () => {
    expect(withChains.render('@order.total', { order: { total: 12 } })).toBe(12)
  })

  it('leaves an unresolvable chain as the text the author wrote', () => {
    expect(withChains.render('mail jordan@example.com', {})).toBe('mail jordan@example.com')
  })

  it('does not open inside an email address', () => {
    expect(withChains.render('mail jordan@example.com', { example: { com: 'x' } })).toBe('mail jordan@example.com')
  })

  it('names a chain variable in roots only when turned on', () => {
    expect(template.roots('@order.total')).toStrictEqual([])
    expect(withChains.roots('@order.total')).toStrictEqual(['order'])
  })
})

describe('the stored body', () => {
  it('wraps a body in an expression', () => {
    expect(Template.expression('contact.optedIn')).toBe('{{ contact.optedIn }}')
  })

  it('refuses a body that would close early', () => {
    expect(() => Template.expression('a }} b')).toThrow('An expression body cannot contain `}}`')
  })

  it('reads the body back out of a whole expression', () => {
    expect(Template.body('{{ contact.optedIn }}')).toBe('contact.optedIn')
  })

  it('refuses a value that interpolates', () => {
    expect(() => Template.body('x {{ a }} y')).toThrow('Only a whole expression has an expression body.')
  })
})

describe('the failure policy', () => {
  it('resolves a failed expression to null by default', () => {
    expect(template.render('{{ 1 + "a" }}', {})).toBeNull()
  })

  it('hands the failure to the host', () => {
    const seen: string[] = []
    const reporting = new Template({
      onFailure: (expression) => {
        seen.push(expression)
        return 'fallback'
      },
    })

    expect(reporting.render('{{ 1 + "a" }}', {})).toBe('fallback')
    expect(seen).toStrictEqual(['1 + "a"'])
  })

  it('lets the host surface the failure by throwing', () => {
    const strict = new Template({
      onFailure: (expression) => {
        throw new Error(`bad expression: ${expression}`)
      },
    })

    expect(() => strict.render('{{ 1 + "a" }}', {})).toThrow('bad expression')
  })
})

describe('the fragment hook', () => {
  it('reports each piece with its mark', () => {
    const seen: Array<[unknown, boolean | null]> = []
    template.render('a {{ b }} c {{{ d }}}', { b: 1, d: 2 }, (value, mark) => {
      seen.push([value, mark])
      return value
    })

    expect(seen).toStrictEqual([
      ['a ', null],
      [1, false],
      [' c ', null],
      [2, true],
      ['', null],
    ])
  })

  it('lets a host render a value its own way', () => {
    const asHostWrites = (value: unknown, mark: boolean | null): unknown => {
      if (mark === null) {
        return value
      }

      return value ? '1' : ''
    }

    const rendered = template.render('paid: {{ paid }}', { paid: true }, asHostWrites)

    expect(rendered).toBe('paid: 1')
  })
})
