import { EvaluationException } from '../../../Exception/EvaluationException.js'
import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { FloatValue } from '../../../Value/FloatValue.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { ListValue } from '../../../Value/ListValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

export class MeanFunction implements FunctionInterface {
  getName(): string {
    return 'mean'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [
      [ValueKind.List],
      (call, args) => {
        const numbers = get(args, 0, ListValue).value.map((item) => {
          if (!(item instanceof IntegerValue) && !(item instanceof FloatValue)) {
            throw new EvaluationException(
              `mean() only supports lists of integers and floats, got \`${item.getType()}\``,
              call.getSpan(),
            )
          }

          return item.value
        })

        if (numbers.length === 0) {
          throw new EvaluationException('mean() requires a non-empty list', call.getSpan())
        }

        return new FloatValue(numbers.reduce((mean, number) => mean + number / numbers.length, 0))
      },
    ]
  }
}
