/**
 * Renders a date through the format characters `date()` understands.
 *
 * The set below is the contract, and it is deliberately narrower than the set a
 * server-side date formatter offers. Expressions are authored once and
 * evaluated by more than one implementation of this language, so a character is
 * in the set only where every implementation can produce the same output for it
 * without timezone or locale data of its own. A character outside the set
 * renders as itself, and a backslash renders the character after it literally.
 *
 * Excluded on purpose: `T`, `e`, `P`, `p`, `O`, `Z` and `I` name the timezone;
 * `c` and `r` embed an offset through those; `W` and `o` need ISO week rules.
 *
 * Every case in the accompanying spec is asserted character for character by
 * the other implementations too, so changing one here without changing it there
 * breaks the guarantee that one expression renders the same text everywhere.
 */

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

const pad = (value: number, length = 2): string =>
  String(value).padStart(length, '0')

/** The English ordinal suffix for a day of the month. */
function ordinalSuffix(day: number): string {
  if (day % 100 >= 11 && day % 100 <= 13) return 'th'
  if (day % 10 === 1) return 'st'
  if (day % 10 === 2) return 'nd'
  if (day % 10 === 3) return 'rd'
  return 'th'
}

/**
 * A date whose UTC getters read as the wall clock in `timeZone`.
 *
 * Every character below one step removed from a timezone is derived from this,
 * so day-of-year, weekday and hour all agree with the zone the caller named
 * rather than with wherever the code happens to run.
 */
function wallClock(date: Date, timeZone: string): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)

  const read = (type: string): number => {
    const part = parts.find((candidate) => candidate.type === type)
    return part ? Number(part.value) : 0
  }

  // A 24-hour clock reports midnight as hour 24 in some environments.
  const hour = read('hour') % 24

  return new Date(
    Date.UTC(
      read('year'),
      read('month') - 1,
      read('day'),
      hour,
      read('minute'),
      read('second'),
      date.getMilliseconds(),
    ),
  )
}

/**
 * How far `timeZone`'s wall clock sits from UTC at a given instant, in
 * milliseconds. Reading a date string that carries no offset of its own means
 * placing its wall-clock reading in the named zone, which is this shift applied
 * backwards.
 */
export function zoneOffset(date: Date, timeZone: string): number {
  return wallClock(date, timeZone).getTime() - date.getTime()
}

function token(character: string, date: Date, original: Date): string | null {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const day = date.getUTCDate()
  const weekday = date.getUTCDay()
  const hours = date.getUTCHours()
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0

  switch (character) {
    // Year
    case 'Y':
      return String(year)
    case 'y':
      return pad(year % 100)
    case 'L':
      return isLeap ? '1' : '0'

    // Month
    case 'n':
      return String(month + 1)
    case 'm':
      return pad(month + 1)
    case 'M':
      return MONTHS[month].slice(0, 3)
    case 'F':
      return MONTHS[month]
    case 't':
      return String(new Date(Date.UTC(year, month + 1, 0)).getUTCDate())

    // Day
    case 'j':
      return String(day)
    case 'd':
      return pad(day)
    case 'D':
      return DAYS[weekday].slice(0, 3)
    case 'l':
      return DAYS[weekday]
    case 'N':
      return String(weekday === 0 ? 7 : weekday)
    case 'w':
      return String(weekday)
    case 'z':
      return String(
        Math.floor(
          (Date.UTC(year, month, day) - Date.UTC(year, 0, 1)) / 86_400_000,
        ),
      )
    case 'S':
      return ordinalSuffix(day)

    // Time
    case 'H':
      return pad(hours)
    case 'G':
      return String(hours)
    case 'h':
      return pad(hours % 12 === 0 ? 12 : hours % 12)
    case 'g':
      return String(hours % 12 === 0 ? 12 : hours % 12)
    case 'i':
      return pad(date.getUTCMinutes())
    case 's':
      return pad(date.getUTCSeconds())
    case 'A':
      return hours < 12 ? 'AM' : 'PM'
    case 'a':
      return hours < 12 ? 'am' : 'pm'

    // Fraction and the absolute second, both read from the real instant.
    case 'v':
      return pad(original.getMilliseconds(), 3)
    case 'u':
      return pad(original.getMilliseconds() * 1000, 6)
    case 'U':
      return String(Math.floor(original.getTime() / 1000))

    default:
      return null
  }
}

export function formatDate(
  date: Date,
  pattern: string,
  timeZone = 'UTC',
): string {
  const local = wallClock(date, timeZone)

  let rendered = ''
  let index = 0

  while (index < pattern.length) {
    const character = pattern[index]

    // A backslash renders the character after it literally, so both are
    // consumed together.
    if (character === '\\') {
      rendered += pattern[index + 1] ?? ''
      index += 2
      continue
    }

    const value = token(character, local, date)
    rendered += value === null ? character : value
    index += 1
  }

  return rendered
}
