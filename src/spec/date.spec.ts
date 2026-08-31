import { describe, expect, it } from 'vitest'
import { createDate, evaluate } from '../index.js'

/**
 * The `date()` format contract.
 *
 * Every case here is asserted, character for character, by the other
 * implementations of this language too, so an expression authored once renders
 * the same text wherever it runs. Changing an expectation here without changing
 * it there breaks that.
 */
describe('date() format characters', () => {
  const on = (pattern: string, value = '2026-06-11') =>
    evaluate(`date(value, pattern)`, { value, pattern })

  it('uses ISO 8601 as the library default format', () => {
    expect(evaluate('date("2026-06-11")')).toBe('2026-06-11T00:00:00')
  })

  it('falls back to the default format for an empty one', () => {
    expect(evaluate('date("2026-06-11", "")')).toBe('2026-06-11T00:00:00')
  })

  it('renders numeric year, month and day', () => {
    expect(on('Y-m-d')).toBe('2026-06-11')
  })

  it('renders short year and unpadded month and day', () => {
    expect(on('y/n/j')).toBe('26/6/11')
  })

  it('renders month and weekday names', () => {
    expect(on('l, F jS')).toBe('Thursday, June 11th')
  })

  it('renders abbreviated month and weekday names', () => {
    expect(on('D M')).toBe('Thu Jun')
  })

  it('renders weekday numbers, day of year, days in month and leap year', () => {
    expect(on('N w z t L')).toBe('4 4 161 30 0')
  })

  it('renders twenty-four hour time', () => {
    expect(on('H:i:s', '2026-06-11 15:04:05')).toBe('15:04:05')
  })

  it('renders twelve hour time with a meridiem', () => {
    expect(on('g:i a', '2026-06-11 15:04:05')).toBe('3:04 pm')
  })

  it('renders unpadded and padded hours', () => {
    expect(on('G h A', '2026-06-11 05:04:05')).toBe('5 05 AM')
  })

  it('renders the unix second', () => {
    expect(on('U', '1970-01-01 00:00:42')).toBe('42')
  })
})

describe('date() characters outside the set', () => {
  const on = (pattern: string) =>
    evaluate('date(value, pattern)', { value: '2026-06-11', pattern })

  it('renders a timezone character as itself', () => {
    expect(on('Y T')).toBe('2026 T')
  })

  it('renders an offset character as itself', () => {
    expect(on('Y P O')).toBe('2026 P O')
  })

  it('renders an ISO week character as itself', () => {
    expect(on('W o')).toBe('W o')
  })

  it('renders a whole-datetime character as itself', () => {
    expect(on('c r')).toBe('c r')
  })

  it('renders the parts of a word that are format characters', () => {
    // `o` is outside the set and `n` is the unpadded month, so the word "on"
    // renders as its parts. This is why a literal needs escaping.
    expect(on('on M j')).toBe('o6 Jun 11')
  })
})

describe('date() escaping', () => {
  const on = (pattern: string) =>
    evaluate('date(value, pattern)', { value: '2026-06-11', pattern })

  it('renders the character after a backslash literally', () => {
    expect(on('\\Y Y')).toBe('Y 2026')
  })

  it('renders nothing for a trailing backslash', () => {
    expect(on('Y\\')).toBe('2026')
  })
})

describe('date() values', () => {
  it('reads a unix second count', () => {
    expect(evaluate('date(0, "Y-m-d")')).toBe('1970-01-01')
  })

  it('reads a fractional unix second count', () => {
    expect(evaluate('date(86400.9, "Y-m-d")')).toBe('1970-01-02')
  })

  it('keeps the fraction of a unix second count', () => {
    expect(evaluate('date(86400.9, "H:i:s.v")')).toBe('00:00:00.900')
  })

  it('reads a string carrying its own offset', () => {
    expect(evaluate('date("2026-06-11T15:04:05Z", "Y-m-d H:i")')).toBe(
      '2026-06-11 15:04',
    )
  })

  it('reads a variable carrying a date string', () => {
    expect(
      evaluate('date(order.placedAt, "Y-m-d")', {
        order: { placedAt: '2026-06-11 15:04:05' },
      }),
    ).toBe('2026-06-11')
  })

  it('reads null as the current moment', () => {
    expect(evaluate('size(date(null, "Y")) == 4')).toBe(true)
  })

  it('reads an empty string as the current moment', () => {
    expect(evaluate('size(date("", "Y")) == 4')).toBe(true)
  })

  it('reads no argument at all as the current moment', () => {
    expect(evaluate('size(date()) > 0')).toBe(true)
  })
})

describe('date() wired by a host', () => {
  const host = (timeZone: string, defaultFormat?: string) => ({
    date: createDate(timeZone, defaultFormat),
  })

  it('uses the host default format', () => {
    expect(evaluate('date("2026-06-11")', {}, host('UTC', 'M j, Y'))).toBe(
      'Jun 11, 2026',
    )
  })

  it('lets a call name its own format over the host default', () => {
    expect(evaluate('date("2026-06-11", "Y")', {}, host('UTC', 'M j, Y'))).toBe(
      '2026',
    )
  })

  it('renders in the host timezone', () => {
    expect(
      evaluate(
        'date("2026-06-11T23:30:00Z", "Y-m-d H:i")',
        {},
        host('Australia/Sydney'),
      ),
    ).toBe('2026-06-12 09:30')
  })

  it('reads a string without an offset as the host timezone wall clock', () => {
    expect(
      evaluate(
        'date("2026-06-11 09:30", "Y-m-d H:i")',
        {},
        host('Australia/Sydney'),
      ),
    ).toBe('2026-06-11 09:30')
  })
})
