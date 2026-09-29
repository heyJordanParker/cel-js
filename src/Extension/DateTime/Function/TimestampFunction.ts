import { EvaluationException } from '../../../Exception/EvaluationException.js'
import { TypeConversionException } from '../../../Exception/TypeConversionException.js'
import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { isValidSeconds, MAX_SECONDS, MIN_SECONDS } from '../../../Util/TimestampRange.js'
import { fromSeconds } from '../../../Util/TimezoneUtil.js'
import { FloatValue } from '../../../Value/FloatValue.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { StringValue } from '../../../Value/StringValue.js'
import { TimestampValue } from '../../../Value/TimestampValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

const RFC3339 = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:\d{2})$/

function daysFromCivil(year: number, month: number, day: number): number {
  const shifted = year - (month <= 2 ? 1 : 0)
  const era = Math.trunc((shifted >= 0 ? shifted : shifted - 399) / 400)
  const yearOfEra = shifted - era * 400
  const dayOfYear = Math.trunc((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1
  const dayOfEra = yearOfEra * 365 + Math.trunc(yearOfEra / 4) - Math.trunc(yearOfEra / 100) + dayOfYear

  return era * 146_097 + dayOfEra - 719_468
}

function isValidDate(year: number, month: number, day: number): boolean {
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  return month >= 1 && month <= 12 && date.getUTCDate() === day
}

function offsetSeconds(designator: string): number {
  if (designator === 'Z') {
    return 0
  }

  const magnitude = Number(designator.slice(1, 3)) * 3600 + Number(designator.slice(4, 6)) * 60
  return designator.startsWith('-') ? -magnitude : magnitude
}

export class TimestampFunction implements FunctionInterface {
  getName(): string {
    return 'timestamp'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [
      [ValueKind.Integer],
      (call, args) => {
        const seconds = get(args, 0, IntegerValue).value
        if (!isValidSeconds(BigInt(seconds))) {
          throw new EvaluationException('Timestamp is outside the valid range', call.getSpan())
        }

        return fromSeconds(seconds)
      },
    ]
    yield [
      [ValueKind.Float],
      (call, args) => {
        const seconds = get(args, 0, FloatValue).value
        if (!Number.isFinite(seconds) || seconds < Number(MIN_SECONDS) || seconds >= Number(MAX_SECONDS) + 1) {
          throw new EvaluationException('Timestamp is outside the valid range', call.getSpan())
        }

        const whole = Math.trunc(seconds)
        return fromSeconds(whole, Math.trunc((seconds - whole) * 1_000_000_000))
      },
    ]
    yield [
      [ValueKind.String],
      (call, args) => {
        const text = get(args, 0, StringValue).value
        const match = RFC3339.exec(text)
        if (match === null) {
          throw new TypeConversionException(`Failed to parse timestamp string "${text}".`, call.getSpan())
        }

        const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number)
        if (year < 1) {
          throw new TypeConversionException(`Timestamp "${text}" is outside the valid range.`, call.getSpan())
        }

        if (!isValidDate(year, month, day) || hour > 23 || minute > 59 || second > 59) {
          throw new TypeConversionException(`Failed to parse timestamp string "${text}".`, call.getSpan())
        }

        const seconds =
          daysFromCivil(year, month, day) * 86_400 + hour * 3600 + minute * 60 + second - offsetSeconds(match[8])

        if (!isValidSeconds(BigInt(seconds))) {
          throw new TypeConversionException(`Timestamp "${text}" is outside the valid range.`, call.getSpan())
        }

        const fraction = match[7] === undefined ? 0 : Number(match[7].padEnd(9, '0').slice(0, 9))
        return fromSeconds(seconds, fraction)
      },
    ]
    yield [[ValueKind.Timestamp], (_, args) => get(args, 0, TimestampValue)]
  }
}
