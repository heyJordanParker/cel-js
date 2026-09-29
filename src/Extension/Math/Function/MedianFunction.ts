import { EvaluationException } from '../../../Exception/EvaluationException.js'
import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { FloatValue } from '../../../Value/FloatValue.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { ListValue } from '../../../Value/ListValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

export class MedianFunction implements FunctionInterface {
  getName(): string {
    return 'median'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [
      [ValueKind.List],
      (call, args) => {
        const numbers = get(args, 0, ListValue).value.map((item) => {
          if (!(item instanceof IntegerValue) && !(item instanceof FloatValue)) {
            throw new EvaluationException(
              `median() only supports lists of integers and floats, got \`${item.getType()}\``,
              call.getSpan(),
            )
          }

          return item.value
        })

        if (numbers.length === 0) {
          throw new EvaluationException('median() requires a non-empty list', call.getSpan())
        }

        numbers.sort((a, b) => a - b)
        const middle = Math.floor(numbers.length / 2)
        const upper = numbers[middle] as number
        if (numbers.length % 2 === 1) {
          return new FloatValue(upper)
        }

        return new FloatValue(upper / 2 + (numbers[middle - 1] as number) / 2)
      },
    ]
  }
}
