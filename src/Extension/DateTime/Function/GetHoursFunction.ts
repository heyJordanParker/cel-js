import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { readWallClock } from '../../../Util/TimezoneUtil.js'
import { DurationValue } from '../../../Value/DurationValue.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

export class GetHoursFunction implements FunctionInterface {
  getName(): string {
    return 'getHours'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    const handler: FunctionOverloadHandler = (call, args) =>
      new IntegerValue(readWallClock(call, args, this.getName()).hours)

    yield [[ValueKind.Duration], (_, args) => new IntegerValue(Number(get(args, 0, DurationValue).nanoseconds / 3_600_000_000_000n))]
    yield [[ValueKind.Timestamp], handler]
    yield [[ValueKind.Timestamp, ValueKind.String], handler]
  }
}
