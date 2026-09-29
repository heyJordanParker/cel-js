import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import type { ValueKind } from '../../../Value/ValueKind.js'
import { trimOverloads } from './TrimFunction.js'

export class TrimRightFunction implements FunctionInterface {
  getName(): string {
    return 'trimRight'
  }

  getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    return trimOverloads(false, true)
  }
}
