import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { BooleanValue } from '../../../Value/BooleanValue.js'
import { BytesValue, octets } from '../../../Value/BytesValue.js'
import { StringValue } from '../../../Value/StringValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

export class ContainsFunction implements FunctionInterface {
  getName(): string {
    return 'contains'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [
      [ValueKind.String, ValueKind.String],
      (_, args) => new BooleanValue(get(args, 0, StringValue).value.includes(get(args, 1, StringValue).value)),
    ]
    yield [
      [ValueKind.Bytes, ValueKind.Bytes],
      (_, args) =>
        new BooleanValue(octets(get(args, 0, BytesValue).value).includes(octets(get(args, 1, BytesValue).value))),
    ]
  }
}
