import { offsetSeconds } from '../../Util/TimezoneUtil.js'

export interface Instant {
  seconds: number
  microseconds: number
}

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

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const pad = (value: number, length = 2): string => String(value).padStart(length, '0')

function ordinalSuffix(day: number): string {
  if (day % 100 >= 11 && day % 100 <= 13) return 'th'
  if (day % 10 === 1) return 'st'
  if (day % 10 === 2) return 'nd'
  if (day % 10 === 3) return 'rd'
  return 'th'
}

function token(character: string, local: Date, instant: Instant): string | null {
  const year = local.getUTCFullYear()
  const month = local.getUTCMonth()
  const day = local.getUTCDate()
  const weekday = local.getUTCDay()
  const hours = local.getUTCHours()
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0

  switch (character) {
    case 'Y':
      return pad(year, 4)
    case 'y':
      return pad(year % 100)
    case 'L':
      return isLeap ? '1' : '0'
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
      return String(Math.floor((Date.UTC(year, month, day) - Date.UTC(year, 0, 1)) / 86_400_000))
    case 'S':
      return ordinalSuffix(day)
    case 'H':
      return pad(hours)
    case 'G':
      return String(hours)
    case 'h':
      return pad(hours % 12 === 0 ? 12 : hours % 12)
    case 'g':
      return String(hours % 12 === 0 ? 12 : hours % 12)
    case 'i':
      return pad(local.getUTCMinutes())
    case 's':
      return pad(local.getUTCSeconds())
    case 'A':
      return hours < 12 ? 'AM' : 'PM'
    case 'a':
      return hours < 12 ? 'am' : 'pm'
    case 'v':
      return pad(Math.floor(instant.microseconds / 1000), 3)
    case 'u':
      return pad(instant.microseconds, 6)
    case 'U':
      return String(instant.seconds)
    default:
      return null
  }
}

export function apply(instant: Instant, pattern: string, timeZone: string): string {
  const local = new Date((instant.seconds + (offsetSeconds(instant.seconds, timeZone) ?? 0)) * 1000)

  let rendered = ''
  let index = 0
  while (index < pattern.length) {
    const character = pattern[index] as string

    if (character === '\\') {
      rendered += pattern[index + 1] ?? ''
      index += 2
      continue
    }

    rendered += token(character, local, instant) ?? character
    index++
  }

  return rendered
}
