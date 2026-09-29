import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { ListValue } from '../../../Value/ListValue.js'
import type { Value } from '../../../Value/Value.js'
import { ValueKind } from '../../../Value/ValueKind.js'

function compare(a: Value, b: Value): number {
  if (a.isEqual(b)) {
    return 0
  }

  return a.isLessThan(b) ? -1 : 1
}

export class SortFunction implements FunctionInterface {
  getName(): string {
    return 'sort'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [[ValueKind.List], (_, args) => new ListValue([...get(args, 0, ListValue).value].sort(compare))]
  }
}
