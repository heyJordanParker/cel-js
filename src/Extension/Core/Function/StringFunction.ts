import { TypeConversionException } from '../../../Exception/TypeConversionException.js'
import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { BooleanValue } from '../../../Value/BooleanValue.js'
import { BytesValue, octets } from '../../../Value/BytesValue.js'
import { DurationValue } from '../../../Value/DurationValue.js'
import { FloatValue } from '../../../Value/FloatValue.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { StringValue } from '../../../Value/StringValue.js'
import { NANOS_PER_SECOND, TimestampValue } from '../../../Value/TimestampValue.js'
import { UnsignedIntegerValue } from '../../../Value/UnsignedIntegerValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

const PRECISION = 6

const trimFraction = (digits: string): string =>
  digits.includes('.') ? digits.replace(/0+$/, '').replace(/\.$/, '') : digits

export function formatDouble(value: number): string {
  if (Number.isNaN(value)) return 'NaN'
  if (!Number.isFinite(value)) return value < 0 ? '-Inf' : 'Inf'
  if (value === 0) return Object.is(value, -0) ? '-0' : '0'

  const [mantissa, exponent] = value.toExponential(PRECISION - 1).split('e')
  const power = Number(exponent)

  if (power < -4 || power >= PRECISION) {
    const digits = trimFraction(mantissa)
    const significand = digits.includes('.') ? digits : digits + '.0'
    return `${significand}e${power < 0 ? '-' : '+'}${Math.abs(power)}`
  }

  return trimFraction(value.toFixed(PRECISION - 1 - power))
}

const pad = (value: number, length: number): string => String(value).padStart(length, '0')

export function formatTimestamp(timestamp: TimestampValue): string {
  const date = new Date(Number(timestamp.seconds()) * 1000)
  const nanos = timestamp.nanos()
  const fraction = nanos === 0 ? '' : '.' + pad(nanos, 9).replace(/0+$/, '')

  return (
    `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1, 2)}-${pad(date.getUTCDate(), 2)}` +
    `T${pad(date.getUTCHours(), 2)}:${pad(date.getUTCMinutes(), 2)}:${pad(date.getUTCSeconds(), 2)}${fraction}Z`
  )
}

export class StringFunction implements FunctionInterface {
  getName(): string {
    return 'string'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [[ValueKind.String], (_, args) => get(args, 0, StringValue)]
    yield [[ValueKind.Integer], (_, args) => new StringValue(String(get(args, 0, IntegerValue).value))]
    yield [
      [ValueKind.UnsignedInteger],
      (_, args) => new StringValue(String(get(args, 0, UnsignedIntegerValue).value)),
    ]
    yield [[ValueKind.Float], (_, args) => new StringValue(formatDouble(get(args, 0, FloatValue).value))]
    yield [[ValueKind.Boolean], (_, args) => new StringValue(get(args, 0, BooleanValue).value ? 'true' : 'false')]
    yield [
      [ValueKind.Bytes],
      (call, args) => {
        const bytes = get(args, 0, BytesValue).value
        try {
          return new StringValue(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
        } catch {
          throw new TypeConversionException(
            `Cannot convert bytes "${octets(bytes)}" to string: invalid UTF-8 sequence.`,
            call.getSpan(),
          )
        }
      },
    ]
    yield [[ValueKind.Timestamp], (_, args) => new StringValue(formatTimestamp(get(args, 0, TimestampValue)))]
    yield [
      [ValueKind.Duration],
      (_, args) => new StringValue(`${get(args, 0, DurationValue).nanoseconds / NANOS_PER_SECOND}s`),
    ]
  }
}
