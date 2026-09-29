import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { ListValue } from '../../../Value/ListValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

export class FlattenFunction implements FunctionInterface {
  getName(): string {
    return 'flatten'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [
      [ValueKind.List],
      (_, args) =>
        new ListValue(get(args, 0, ListValue).value.flatMap((item) => (item instanceof ListValue ? item.value : [item]))),
    ]
  }
}
