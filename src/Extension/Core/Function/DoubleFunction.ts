import { TypeConversionException } from '../../../Exception/TypeConversionException.js'
import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { tryParse } from '../../../Util/FloatParser.js'
import { BooleanValue } from '../../../Value/BooleanValue.js'
import { BytesValue, octets } from '../../../Value/BytesValue.js'
import { FloatValue } from '../../../Value/FloatValue.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { StringValue } from '../../../Value/StringValue.js'
import { UnsignedIntegerValue } from '../../../Value/UnsignedIntegerValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

export class DoubleFunction implements FunctionInterface {
  getName(): string {
    return 'double'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [[ValueKind.Float], (_, args) => get(args, 0, FloatValue)]
    yield [[ValueKind.Integer], (_, args) => new FloatValue(get(args, 0, IntegerValue).value)]
    yield [[ValueKind.UnsignedInteger], (_, args) => new FloatValue(Number(get(args, 0, UnsignedIntegerValue).value))]
    yield [[ValueKind.Boolean], (_, args) => new FloatValue(get(args, 0, BooleanValue).value ? 1 : 0)]
    yield [
      [ValueKind.String],
      (call, args) => {
        const value = get(args, 0, StringValue).value
        const float = tryParse(value)
        if (float === null) {
          throw new TypeConversionException(`Cannot convert string "${value}" to float.`, call.getSpan())
        }

        return new FloatValue(float)
      },
    ]
    yield [
      [ValueKind.Bytes],
      (call, args) => {
        const value = octets(get(args, 0, BytesValue).value)
        const float = tryParse(value)
        if (float === null) {
          throw new TypeConversionException(`Cannot convert bytes "${value}" to float.`, call.getSpan())
        }

        return new FloatValue(float)
      },
    ]
  }
}
