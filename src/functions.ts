import { CelEvaluationError } from './errors/CelEvaluationError.js'
import { formatDate, zoneOffset } from './date-format.js'

/**
 * The functions available to every expression, beyond the macros.
 *
 * Each one is named and behaves as its counterpart in the other
 * implementations of this language does, so an expression authored once
 * evaluates the same wherever it runs. A missing counterpart is what made
 * `sum`, `max`, `double`, `date`, `contains` and `join` throw here while
 * resolving there.
 */

/**
 * ISO 8601 without an offset, which the format characters deliberately cannot
 * express. It is the neutral choice for a library that does not know where its
 * output will be read; a host with a display convention passes its own.
 */
export const ISO_8601 = 'Y-m-d\\TH:i:s'

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

function describe(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'list'
  return typeof value
}

/** The CEL double conversion: a number, a boolean, or a numeric string. */
export function double(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'boolean') return value ? 1 : 0

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }

  throw new CelEvaluationError(`double() cannot convert a ${describe(value)}`)
}

/** Totals a list of numbers. An empty list totals zero. */
export function sum(list: unknown): number {
  if (!Array.isArray(list)) {
    throw new CelEvaluationError(
      `sum() only supports lists of integers and floats, got \`${describe(list)}\``,
    )
  }

  let total = 0
  for (const item of list) {
    if (!isNumber(item)) {
      throw new CelEvaluationError(
        `sum() only supports lists of integers and floats, got \`${describe(item)}\``,
      )
    }
    total += item
  }

  return total
}

/**
 * The largest of a list, or of two numbers.
 *
 * A null operand is not accepted: a list holding a non-number is rejected, and
 * the two-argument form holds the same line. An operand that may be absent is
 * given a value by the caller, with `max(0.0, discount ?? 0.0)`.
 */
export function max(first: unknown, second?: unknown): unknown {
  if (second === undefined && Array.isArray(first)) {
    if (first.length === 0) {
      throw new CelEvaluationError('max() requires a non-empty list')
    }

    let largest: number | null = null
    for (const item of first) {
      if (!isNumber(item)) {
        throw new CelEvaluationError(
          `max() only supports lists of integers and floats, got \`${describe(item)}\``,
        )
      }
      if (largest === null || item > largest) largest = item
    }

    return largest
  }

  if (!isNumber(first) || !isNumber(second)) {
    throw new CelEvaluationError(
      `max() only supports integers and floats, got \`${describe(first)}\` and \`${describe(second)}\``,
    )
  }

  return first >= second ? first : second
}

/** Whether a string holds a substring, or a list holds a value. */
export function contains(haystack: unknown, needle: unknown): boolean {
  if (typeof haystack === 'string') {
    if (typeof needle !== 'string') {
      throw new CelEvaluationError('contains: expects a string to search for')
    }
    return haystack.includes(needle)
  }

  if (Array.isArray(haystack)) {
    return haystack.includes(needle)
  }

  throw new CelEvaluationError(
    `contains: expects a string or a list, got \`${describe(haystack)}\``,
  )
}

/** Joins a list of strings, with an optional separator. */
export function join(list: unknown, separator?: unknown): string {
  if (!Array.isArray(list)) {
    throw new CelEvaluationError(
      `join: expects a list, got \`${describe(list)}\``,
    )
  }

  for (const item of list) {
    if (typeof item !== 'string') {
      throw new CelEvaluationError('join: expects a list of strings')
    }
  }

  if (separator !== undefined && typeof separator !== 'string') {
    throw new CelEvaluationError('join: expects a string separator')
  }

  return list.join(separator === undefined ? '' : separator)
}

/**
 * Renders a date as text. The value may be a Unix second count, a parsable
 * string, or a Date; null and the empty string mean now, so a field that is not
 * set yet still renders a date rather than nothing.
 */
export function createDate(timeZone = 'UTC', defaultFormat = ISO_8601) {
  return (value?: unknown, format?: unknown): string => {
    const pattern =
      typeof format === 'string' && format !== '' ? format : defaultFormat

    const date = readDate(value, timeZone)
    if (Number.isNaN(date.getTime())) {
      throw new CelEvaluationError(`date() cannot read \`${String(value)}\``)
    }

    return formatDate(date, pattern, timeZone)
  }
}

/**
 * An ISO-8601 date, optionally with a time, a fraction, and an offset. The
 * string form of a date is ISO-8601 across every implementation of this
 * language; a looser string is whatever the host platform makes of it, and the
 * two platforms do not agree there.
 */
const ISO_DATE =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d{1,3})\d*)?)?(Z|[+-]\d{2}:?\d{2})?$/

function readDate(value: unknown, timeZone: string): Date {
  if (value instanceof Date) return value
  if (value === null || value === undefined || value === '') return new Date()
  if (typeof value === 'number') return new Date(value * 1000)

  if (typeof value !== 'string') {
    throw new CelEvaluationError(`date() cannot read a ${describe(value)}`)
  }

  const match = ISO_DATE.exec(value.trim())
  if (match === null) return new Date(value)

  // A string carrying its own offset names an instant outright.
  if (match[8] !== undefined) return new Date(value.trim().replace(' ', 'T'))

  // Without one it names a wall-clock reading, which belongs to the caller's
  // timezone rather than to wherever this happens to run.
  const reading = Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4] ?? 0),
    Number(match[5] ?? 0),
    Number(match[6] ?? 0),
    Number((match[7] ?? '').padEnd(3, '0') || 0),
  )

  return new Date(reading - zoneOffset(new Date(reading), timeZone))
}
