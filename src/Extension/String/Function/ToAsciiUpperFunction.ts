import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { BytesValue } from '../../../Value/BytesValue.js'
import { StringValue } from '../../../Value/StringValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

export const asciiUpper = (bytes: Uint8Array): Uint8Array =>
  bytes.map((byte) => (byte >= 97 && byte <= 122 ? byte - 32 : byte))

export class ToAsciiUpperFunction implements FunctionInterface {
  getName(): string {
    return 'toAsciiUpper'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [
      [ValueKind.String],
      (_, args) => new StringValue(get(args, 0, StringValue).value.replace(/[a-z]/g, (char) => char.toUpperCase())),
    ]
    yield [[ValueKind.Bytes], (_, args) => new BytesValue(asciiUpper(get(args, 0, BytesValue).value))]
  }
}
