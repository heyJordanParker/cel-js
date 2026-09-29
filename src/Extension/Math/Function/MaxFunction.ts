import { EvaluationException } from '../../../Exception/EvaluationException.js'
import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { FloatValue } from '../../../Value/FloatValue.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { ListValue } from '../../../Value/ListValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

export class MaxFunction implements FunctionInterface {
  getName(): string {
    return 'max'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [
      [ValueKind.List],
      (call, args) => {
        let result: IntegerValue | FloatValue | null = null
        for (const item of get(args, 0, ListValue).value) {
          if (!(item instanceof IntegerValue) && !(item instanceof FloatValue)) {
            throw new EvaluationException(
              `max() only supports lists of integers and floats, got \`${item.getType()}\``,
              call.getSpan(),
            )
          }

          if (result === null || item.value > result.value) {
            result = item
          }
        }

        if (result === null) {
          throw new EvaluationException('max() requires a non-empty list', call.getSpan())
        }

        return result
      },
    ]

    const scalar: FunctionOverloadHandler = (call, args) => {
      const [left, right] = args
      if (
        (!(left instanceof IntegerValue) && !(left instanceof FloatValue)) ||
        (!(right instanceof IntegerValue) && !(right instanceof FloatValue))
      ) {
        throw new EvaluationException(
          `max() only supports integers and floats, got \`${left?.getType() ?? 'null'}\` and \`${right?.getType() ?? 'null'}\``,
          call.getSpan(),
        )
      }

      return left.value >= right.value ? left : right
    }

    const kinds = [ValueKind.Integer, ValueKind.Float]
    for (const left of kinds) {
      for (const right of kinds) {
        yield [[left, right], scalar]
      }
    }
  }
}
