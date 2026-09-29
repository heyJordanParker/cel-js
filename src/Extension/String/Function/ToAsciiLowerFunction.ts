import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { BytesValue } from '../../../Value/BytesValue.js'
import { StringValue } from '../../../Value/StringValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

export const asciiLower = (bytes: Uint8Array): Uint8Array =>
  bytes.map((byte) => (byte >= 65 && byte <= 90 ? byte + 32 : byte))

export class ToAsciiLowerFunction implements FunctionInterface {
  getName(): string {
    return 'toAsciiLower'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [
      [ValueKind.String],
      (_, args) => new StringValue(get(args, 0, StringValue).value.replace(/[A-Z]/g, (char) => char.toLowerCase())),
    ]
    yield [[ValueKind.Bytes], (_, args) => new BytesValue(asciiLower(get(args, 0, BytesValue).value))]
  }
}
