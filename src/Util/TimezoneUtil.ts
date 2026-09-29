import { EvaluationException } from '../Exception/EvaluationException.js'
import type { CallExpression } from '../Syntax/Member/CallExpression.js'
import { StringValue } from '../Value/StringValue.js'
import { NANOS_PER_SECOND, TimestampValue } from '../Value/TimestampValue.js'
import type { Value } from '../Value/Value.js'
import { get, getOptional } from './ArgumentsUtil.js'

export interface WallClock {
  year: number
  month: number
  day: number
  hours: number
  minutes: number
  seconds: number
  nanoseconds: number
  weekday: number
  dayOfYear: number
}

const FIXED_OFFSET = /^([+-])(\d{2}):?(\d{2})$/

function zoneFormat(zone: string): Intl.DateTimeFormat | null {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      era: 'short',
    })
  } catch {
    return null
  }
}

export function offsetSeconds(seconds: number, zone: string): number | null {
  const named = zone !== '' && /[0-9]/.test(zone[0]) ? `+${zone}` : zone

  const fixed = FIXED_OFFSET.exec(named)
  if (fixed !== null) {
    const magnitude = Number(fixed[2]) * 3600 + Number(fixed[3]) * 60
    return fixed[1] === '-' ? -magnitude : magnitude
  }

  const format = zoneFormat(named)
  if (format === null) {
    return null
  }

  const parts = Object.fromEntries(
    format.formatToParts(new Date(seconds * 1000)).map((part) => [part.type, part.value]),
  )
  const year = parts.era === 'BC' ? 1 - Number(parts.year) : Number(parts.year)
  const reading = new Date(0)
  reading.setUTCFullYear(year, Number(parts.month) - 1, Number(parts.day))
  reading.setUTCHours(Number(parts.hour), Number(parts.minute), Number(parts.second), 0)

  return Math.round(reading.getTime() / 1000) - seconds
}

export function wallClock(timestamp: TimestampValue, offset = 0): WallClock {
  const date = new Date((Number(timestamp.seconds()) + offset) * 1000)
  const year = date.getUTCFullYear()
  const start = new Date(0)
  start.setUTCFullYear(year, 0, 1)

  return {
    year,
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hours: date.getUTCHours(),
    minutes: date.getUTCMinutes(),
    seconds: date.getUTCSeconds(),
    nanoseconds: timestamp.nanos(),
    weekday: date.getUTCDay(),
    dayOfYear: Math.floor((date.getTime() - start.getTime()) / 86_400_000) + 1,
  }
}

export function localize(timestamp: TimestampValue, zone: string): WallClock | null {
  const offset = offsetSeconds(Number(timestamp.seconds()), zone)
  return offset === null ? null : wallClock(timestamp, offset)
}

export function readWallClock(call: CallExpression, args: Value[], name: string): WallClock {
  const timestamp = get(args, 0, TimestampValue)
  const zone = getOptional(args, 1, StringValue)
  if (zone === null) {
    return wallClock(timestamp)
  }

  const clock = localize(timestamp, zone.value)
  if (clock === null) {
    throw new EvaluationException(`${name}: timezone \`${zone.value}\` is not valid`, call.getSpan())
  }

  return clock
}

export const fromSeconds =(seconds: number, nanoseconds = 0): TimestampValue =>
  new TimestampValue(BigInt(seconds) * NANOS_PER_SECOND + BigInt(nanoseconds))
