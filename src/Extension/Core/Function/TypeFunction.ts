import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { TypeValue } from '../../../Value/TypeValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

export class TypeFunction implements FunctionInterface {
  getName(): string {
    return 'type'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    const handler: FunctionOverloadHandler = (_, args) => new TypeValue(args[0].getType())
    for (const kind of Object.values(ValueKind)) {
      yield [[kind], handler]
    }
  }
}
