import { OverflowException } from '../../../Exception/OverflowException.js'
import { TypeConversionException } from '../../../Exception/TypeConversionException.js'
import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { BooleanValue } from '../../../Value/BooleanValue.js'
import { BytesValue, octets } from '../../../Value/BytesValue.js'
import { FloatValue } from '../../../Value/FloatValue.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { StringValue } from '../../../Value/StringValue.js'
import { TimestampValue } from '../../../Value/TimestampValue.js'
import { UnsignedIntegerValue } from '../../../Value/UnsignedIntegerValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

const CANONICAL = /^-?[1-9][0-9]*$/

export function canonicalInteger(text: string): number | null {
  const trimmed = text.replace(/^0+/, '')
  const number = Number(trimmed)
  return CANONICAL.test(trimmed) && Number.isSafeInteger(number) ? number : null
}

export class IntFunction implements FunctionInterface {
  getName(): string {
    return 'int'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [[ValueKind.Integer], (_, args) => get(args, 0, IntegerValue)]
    yield [
      [ValueKind.UnsignedInteger],
      (call, args) => {
        const value = BigInt(get(args, 0, UnsignedIntegerValue).value)
        if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
          throw new OverflowException(
            `Unsigned integer value ${value} overflows maximum integer value ${Number.MAX_SAFE_INTEGER}`,
            call.getSpan(),
          )
        }

        return new IntegerValue(Number(value))
      },
    ]
    yield [
      [ValueKind.Float],
      (call, args) => {
        const value = get(args, 0, FloatValue).value
        if (!Number.isFinite(value) || Math.abs(Math.trunc(value)) > Number.MAX_SAFE_INTEGER) {
          throw new OverflowException(
            `Double value ${Number.isFinite(value) ? value : 'NaN or infinity'} overflows the integer range`,
            call.getSpan(),
          )
        }

        return new IntegerValue(Math.trunc(value) + 0)
      },
    ]
    yield [[ValueKind.Boolean], (_, args) => new IntegerValue(get(args, 0, BooleanValue).value ? 1 : 0)]
    yield [
      [ValueKind.String],
      (call, args) => {
        const value = get(args, 0, StringValue).value
        const integer = canonicalInteger(value)
        if (integer === null) {
          throw new TypeConversionException(`Cannot convert string "${value}" to integer.`, call.getSpan())
        }

        return new IntegerValue(integer)
      },
    ]
    yield [
      [ValueKind.Bytes],
      (call, args) => {
        const value = octets(get(args, 0, BytesValue).value)
        const integer = canonicalInteger(value)
        if (integer === null) {
          throw new TypeConversionException(`Cannot convert bytes "${value}" to integer.`, call.getSpan())
        }

        return new IntegerValue(integer)
      },
    ]
    yield [[ValueKind.Timestamp], (_, args) => new IntegerValue(Number(get(args, 0, TimestampValue).seconds()))]
  }
}
