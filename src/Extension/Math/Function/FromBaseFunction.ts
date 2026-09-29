import { EvaluationException } from '../../../Exception/EvaluationException.js'
import { NumberFormatException } from '../../../Exception/NumberFormatException.js'
import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { fromBase } from '../../../Util/NumberBase.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { StringValue } from '../../../Value/StringValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

export class FromBaseFunction implements FunctionInterface {
  getName(): string {
    return 'fromBase'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [
      [ValueKind.String, ValueKind.Integer],
      (call, args) => {
        const number = get(args, 0, StringValue).value
        const base = get(args, 1, IntegerValue).value
        if (number === '') {
          throw new EvaluationException('fromBase: cannot convert empty string', call.getSpan())
        }

        if (base > 36 || base < 2) {
          throw new EvaluationException(`fromBase: base ${base} is not in the range 2-36`, call.getSpan())
        }

        try {
          return new IntegerValue(fromBase(number, base))
        } catch (error) {
          if (error instanceof NumberFormatException) {
            throw new EvaluationException(error.message, call.getSpan(), error)
          }

          throw error
        }
      },
    ]
  }
}
