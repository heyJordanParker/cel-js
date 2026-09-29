import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { FloatValue } from '../../../Value/FloatValue.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

export class ClampFunction implements FunctionInterface {
  getName(): string {
    return 'clamp'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [
      [ValueKind.Integer, ValueKind.Integer, ValueKind.Integer],
      (_, args) =>
        new IntegerValue(
          Math.max(get(args, 1, IntegerValue).value, Math.min(get(args, 2, IntegerValue).value, get(args, 0, IntegerValue).value)),
        ),
    ]
    yield [
      [ValueKind.Float, ValueKind.Float, ValueKind.Float],
      (_, args) =>
        new FloatValue(
          Math.max(get(args, 1, FloatValue).value, Math.min(get(args, 2, FloatValue).value, get(args, 0, FloatValue).value)),
        ),
    ]
  }
}
