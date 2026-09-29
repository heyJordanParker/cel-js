import { OverflowException } from '../../../Exception/OverflowException.js'
import { TypeConversionException } from '../../../Exception/TypeConversionException.js'
import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { BooleanValue } from '../../../Value/BooleanValue.js'
import { BytesValue, octets } from '../../../Value/BytesValue.js'
import { FloatValue } from '../../../Value/FloatValue.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { StringValue } from '../../../Value/StringValue.js'
import { UnsignedIntegerValue } from '../../../Value/UnsignedIntegerValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'
import { canonicalInteger } from './IntFunction.js'

export class UIntFunction implements FunctionInterface {
  getName(): string {
    return 'uint'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [[ValueKind.UnsignedInteger], (_, args) => get(args, 0, UnsignedIntegerValue)]
    yield [
      [ValueKind.Integer],
      (call, args) => {
        const value = get(args, 0, IntegerValue).value
        if (value < 0) {
          throw new OverflowException(`Integer value ${value} overflows unsigned integer`, call.getSpan())
        }

        return new UnsignedIntegerValue(value)
      },
    ]
    yield [
      [ValueKind.Float],
      (call, args) => {
        const value = get(args, 0, FloatValue).value
        if (value < 0 || value === Infinity || Math.trunc(value) > Number.MAX_SAFE_INTEGER) {
          throw new OverflowException(`Float value ${value.toFixed(6)} overflows unsigned integer`, call.getSpan())
        }

        return new UnsignedIntegerValue(Number.isNaN(value) ? 0 : Math.trunc(value) + 0)
      },
    ]
    yield [[ValueKind.Boolean], (_, args) => new UnsignedIntegerValue(get(args, 0, BooleanValue).value ? 1 : 0)]
    yield [
      [ValueKind.String],
      (call, args) => {
        const value = get(args, 0, StringValue).value
        const integer = canonicalInteger(value)
        if (integer === null) {
          throw new TypeConversionException(`Cannot convert string "${value}" to unsigned integer.`, call.getSpan())
        }

        return new UnsignedIntegerValue(integer)
      },
    ]
    yield [
      [ValueKind.Bytes],
      (call, args) => {
        const value = octets(get(args, 0, BytesValue).value)
        const integer = canonicalInteger(value)
        if (integer === null) {
          throw new TypeConversionException(`Cannot convert bytes "${value}" to unsigned integer.`, call.getSpan())
        }

        return new UnsignedIntegerValue(integer)
      },
    ]
  }
}
