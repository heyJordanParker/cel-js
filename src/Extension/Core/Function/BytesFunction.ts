import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { BytesValue } from '../../../Value/BytesValue.js'
import { StringValue } from '../../../Value/StringValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

export class BytesFunction implements FunctionInterface {
  getName(): string {
    return 'bytes'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [[ValueKind.Bytes], (_, args) => get(args, 0, BytesValue)]
    yield [[ValueKind.String], (_, args) => new BytesValue(new TextEncoder().encode(get(args, 0, StringValue).value))]
  }
}
