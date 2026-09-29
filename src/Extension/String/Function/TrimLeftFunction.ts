import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import type { ValueKind } from '../../../Value/ValueKind.js'
import { trimOverloads } from './TrimFunction.js'

export class TrimLeftFunction implements FunctionInterface {
  getName(): string {
    return 'trimLeft'
  }

  getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    return trimOverloads(true, false)
  }
}
