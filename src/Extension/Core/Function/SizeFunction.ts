import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { BytesValue } from '../../../Value/BytesValue.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { ListValue } from '../../../Value/ListValue.js'
import { MapValue } from '../../../Value/MapValue.js'
import { StringValue } from '../../../Value/StringValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

const codePoints = (text: string): number => Array.from(text).length

export class SizeFunction implements FunctionInterface {
  getName(): string {
    return 'size'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [[ValueKind.String], (_, args) => new IntegerValue(codePoints(get(args, 0, StringValue).value))]
    yield [
      [ValueKind.Bytes],
      (_, args) => new IntegerValue(codePoints(new TextDecoder().decode(get(args, 0, BytesValue).value))),
    ]
    yield [[ValueKind.List], (_, args) => new IntegerValue(get(args, 0, ListValue).value.length)]
    yield [[ValueKind.Map], (_, args) => new IntegerValue(get(args, 0, MapValue).value.size)]
  }
}
