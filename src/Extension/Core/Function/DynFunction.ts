import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { ValueKind } from '../../../Value/ValueKind.js'

export class DynFunction implements FunctionInterface {
  getName(): string {
    return 'dyn'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    const handler: FunctionOverloadHandler = (_, args) => args[0]
    for (const kind of Object.values(ValueKind)) {
      yield [[kind], handler]
    }
  }
}
