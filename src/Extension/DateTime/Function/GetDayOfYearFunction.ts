import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { readWallClock } from '../../../Util/TimezoneUtil.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

export class GetDayOfYearFunction implements FunctionInterface {
  getName(): string {
    return 'getDayOfYear'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    const handler: FunctionOverloadHandler = (call, args) =>
      new IntegerValue(readWallClock(call, args, this.getName()).dayOfYear - 1)

    yield [[ValueKind.Timestamp], handler]
    yield [[ValueKind.Timestamp, ValueKind.String], handler]
  }
}
