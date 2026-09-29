import { EvaluationException } from '../../../Exception/EvaluationException.js'
import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import type { CallExpression } from '../../../Syntax/Member/CallExpression.js'
import { offsetSeconds } from '../../../Util/TimezoneUtil.js'
import { FloatValue } from '../../../Value/FloatValue.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { NullValue } from '../../../Value/NullValue.js'
import { StringValue } from '../../../Value/StringValue.js'
import { TimestampValue } from '../../../Value/TimestampValue.js'
import type { Value } from '../../../Value/Value.js'
import { ValueKind } from '../../../Value/ValueKind.js'
import { apply, type Instant } from '../DateFormat.js'

export const ISO_8601 = 'Y-m-d\\TH:i:s'

const VALUE_KINDS = [ValueKind.Timestamp, ValueKind.String, ValueKind.Integer, ValueKind.Float, ValueKind.Null]

const OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(.*))?$/
const ISO_SECONDS = /^:(\d{2})(?:\.(\d+))?$/

function now(): Instant {
  const milliseconds = Date.now()
  return { seconds: Math.floor(milliseconds / 1000), microseconds: (milliseconds % 1000) * 1000 }
}

function fromMilliseconds(milliseconds: number, microseconds = 0): Instant {
  const seconds = Math.floor(milliseconds / 1000)
  return { seconds, microseconds: (milliseconds - seconds * 1000) * 1000 + microseconds }
}

function readString(text: string, timeZone: string): Instant | null {
  const trimmed = text.trim()

  if (OFFSET.test(trimmed)) {
    const milliseconds = new Date(trimmed.replace(' ', 'T')).getTime()
    return Number.isNaN(milliseconds) ? null : fromMilliseconds(milliseconds)
  }

  const match = ISO_DATE.exec(trimmed)
  const seconds = ISO_SECONDS.exec(match?.[6] ?? '')
  if (match === null || (match[6] !== undefined && match[6] !== '' && seconds === null)) {
    const milliseconds = new Date(text).getTime()
    return Number.isNaN(milliseconds) ? null : fromMilliseconds(milliseconds)
  }

  const fraction = (seconds?.[2] ?? '').slice(0, 6).padEnd(6, '0')
  const reading =
    Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4] ?? 0),
      Number(match[5] ?? 0),
      Number(seconds?.[1] ?? 0),
    ) / 1000

  return {
    seconds: reading - (offsetSeconds(reading, timeZone) ?? 0),
    microseconds: Number(fraction),
  }
}

function read(call: CallExpression, value: Value, timeZone: string): Instant {
  if (value instanceof TimestampValue) {
    return { seconds: Number(value.seconds()), microseconds: Math.floor(value.nanos() / 1000) }
  }

  if (value instanceof IntegerValue) {
    return { seconds: value.value, microseconds: 0 }
  }

  if (value instanceof FloatValue) {
    const seconds = Math.floor(value.value)
    return { seconds, microseconds: Math.round((value.value - seconds) * 1_000_000) }
  }

  if (value instanceof NullValue || (value instanceof StringValue && value.value === '')) {
    return now()
  }

  if (value instanceof StringValue) {
    const instant = readString(value.value, timeZone)
    if (instant === null) {
      throw new EvaluationException(`date() cannot read \`${value.value}\` as a date`, call.getSpan())
    }

    return instant
  }

  throw new EvaluationException(`date() cannot read a \`${value.getType()}\` as a date`, call.getSpan())
}

export class DateFunction implements FunctionInterface {
  constructor(
    private readonly timezone = 'UTC',
    private readonly defaultFormat = ISO_8601,
  ) {}

  getName(): string {
    return 'date'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    const handler: FunctionOverloadHandler = (call, args) => {
      const format = args[1]
      const pattern = format instanceof StringValue && format.value !== '' ? format.value : this.defaultFormat

      return new StringValue(apply(read(call, args[0] ?? new NullValue(), this.timezone), pattern, this.timezone))
    }

    yield [[], handler]
    for (const kind of VALUE_KINDS) {
      yield [[kind], handler]
      yield [[kind, ValueKind.String], handler]
    }
  }
}
