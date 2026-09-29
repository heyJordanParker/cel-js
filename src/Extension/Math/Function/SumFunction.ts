import { EvaluationException } from '../../../Exception/EvaluationException.js'
import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { FloatValue } from '../../../Value/FloatValue.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { ListValue } from '../../../Value/ListValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

export class SumFunction implements FunctionInterface {
  getName(): string {
    return 'sum'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [
      [ValueKind.List],
      (call, args) => {
        let total = 0
        let isFloat = false
        for (const item of get(args, 0, ListValue).value) {
          if (item instanceof IntegerValue) {
            total += item.value
            continue
          }

          if (item instanceof FloatValue) {
            total += item.value
            isFloat = true
            continue
          }

          throw new EvaluationException(
            `sum() only supports lists of integers and floats, got \`${item.getType()}\``,
            call.getSpan(),
          )
        }

        return isFloat ? new FloatValue(total) : new IntegerValue(total)
      },
    ]
  }
}
