import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { BooleanValue } from '../../../Value/BooleanValue.js'
import { ListValue } from '../../../Value/ListValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

export class ContainsFunction implements FunctionInterface {
  getName(): string {
    return 'contains'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    const handler: FunctionOverloadHandler = (_, args) =>
      new BooleanValue(get(args, 0, ListValue).value.some((item) => item.isEqual(args[1])))

    for (const kind of Object.values(ValueKind)) {
      yield [[ValueKind.List, kind], handler]
    }
  }
}
