import { EvaluationException } from '../../../Exception/EvaluationException.js'
import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { FloatValue } from '../../../Value/FloatValue.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { ListValue } from '../../../Value/ListValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

export class MinFunction implements FunctionInterface {
  getName(): string {
    return 'min'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [
      [ValueKind.List],
      (call, args) => {
        let result: IntegerValue | FloatValue | null = null
        for (const item of get(args, 0, ListValue).value) {
          if (!(item instanceof IntegerValue) && !(item instanceof FloatValue)) {
            throw new EvaluationException(
              `min() only supports lists of integers and floats, got \`${item.getType()}\``,
              call.getSpan(),
            )
          }

          if (result === null || item.value < result.value) {
            result = item
          }
        }

        if (result === null) {
          throw new EvaluationException('min() requires a non-empty list', call.getSpan())
        }

        return result
      },
    ]
  }
}
