import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { TimestampValue } from '../../../Value/TimestampValue.js'
import type { ValueKind } from '../../../Value/ValueKind.js'

export class NowFunction implements FunctionInterface {
  getName(): string {
    return 'now'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [[], () => new TimestampValue(BigInt(Date.now()) * 1_000_000n)]
  }
}
