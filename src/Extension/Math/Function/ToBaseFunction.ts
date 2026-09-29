import { EvaluationException } from '../../../Exception/EvaluationException.js'
import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { toBase } from '../../../Util/NumberBase.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { StringValue } from '../../../Value/StringValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

export class ToBaseFunction implements FunctionInterface {
  getName(): string {
    return 'toBase'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [
      [ValueKind.Integer, ValueKind.Integer],
      (call, args) => {
        const number = get(args, 0, IntegerValue).value
        const base = get(args, 1, IntegerValue).value
        if (number < 0) {
          throw new EvaluationException(
            `toBase: number ${number} is negative, only non-negative integers are supported`,
            call.getSpan(),
          )
        }

        if (base > 36 || base < 2) {
          throw new EvaluationException(`toBase: base ${base} is not in the range 2-36`, call.getSpan())
        }

        return new StringValue(toBase(number, base))
      },
    ]
  }
}
