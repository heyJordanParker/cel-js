import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { BytesValue } from '../../../Value/BytesValue.js'
import { StringValue } from '../../../Value/StringValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'
import { asciiUpper } from './ToAsciiUpperFunction.js'

export class ToUpperFunction implements FunctionInterface {
  getName(): string {
    return 'toUpper'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [[ValueKind.String], (_, args) => new StringValue(get(args, 0, StringValue).value.toUpperCase())]
    yield [[ValueKind.Bytes], (_, args) => new BytesValue(asciiUpper(get(args, 0, BytesValue).value))]
  }
}
