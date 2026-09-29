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

const TRUE_STRINGS = ['1', 't', 'true', 'TRUE', 'True']

const FALSE_STRINGS = ['0', 'f', 'false', 'FALSE', 'False']

export class BoolFunction implements FunctionInterface {
  getName(): string {
    return 'bool'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [[ValueKind.Boolean], (_, args) => get(args, 0, BooleanValue)]
    yield [[ValueKind.Integer], (_, args) => new BooleanValue(get(args, 0, IntegerValue).value !== 0)]
    yield [
      [ValueKind.UnsignedInteger],
      (_, args) => {
        const value = get(args, 0, UnsignedIntegerValue).value
        return new BooleanValue(value !== '0' && value !== 0)
      },
    ]
    yield [[ValueKind.Float], (_, args) => new BooleanValue(get(args, 0, FloatValue).value !== 0)]
    yield [
      [ValueKind.String],
      (call, args) => {
        const value = get(args, 0, StringValue).value
        if (TRUE_STRINGS.includes(value)) return new BooleanValue(true)
        if (FALSE_STRINGS.includes(value)) return new BooleanValue(false)

        throw new TypeConversionException(`Cannot convert string "${value}" to boolean.`, call.getSpan())
      },
    ]
    yield [
      [ValueKind.Bytes],
      (call, args) => {
        const bytes = get(args, 0, BytesValue).value
        const lower = new TextDecoder().decode(bytes).toLowerCase()
        if (lower === 'true') return new BooleanValue(true)
        if (lower === 'false') return new BooleanValue(false)

        throw new TypeConversionException(`Cannot convert bytes "${octets(bytes)}" to boolean.`, call.getSpan())
      },
    ]
  }
}
