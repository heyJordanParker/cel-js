import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { BytesValue } from '../../../Value/BytesValue.js'
import { StringValue } from '../../../Value/StringValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'
import { asciiLower } from './ToAsciiLowerFunction.js'

export class ToLowerFunction implements FunctionInterface {
  getName(): string {
    return 'toLower'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [[ValueKind.String], (_, args) => new StringValue(get(args, 0, StringValue).value.toLowerCase())]
    yield [[ValueKind.Bytes], (_, args) => new BytesValue(asciiLower(get(args, 0, BytesValue).value))]
  }
}
