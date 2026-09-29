import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { readWallClock } from '../../../Util/TimezoneUtil.js'
import { DurationValue } from '../../../Value/DurationValue.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { NANOS_PER_SECOND } from '../../../Value/TimestampValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

export class GetSecondsFunction implements FunctionInterface {
  getName(): string {
    return 'getSeconds'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    const handler: FunctionOverloadHandler = (call, args) =>
      new IntegerValue(readWallClock(call, args, this.getName()).seconds)

    yield [[ValueKind.Duration], (_, args) => new IntegerValue(Number(get(args, 0, DurationValue).nanoseconds / NANOS_PER_SECOND))]
    yield [[ValueKind.Timestamp], handler]
    yield [[ValueKind.Timestamp, ValueKind.String], handler]
  }
}
