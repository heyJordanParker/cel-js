import { EvaluationException } from '../../../Exception/EvaluationException.js'
import { NumberFormatException } from '../../../Exception/NumberFormatException.js'
import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { baseConvert } from '../../../Util/NumberBase.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { StringValue } from '../../../Value/StringValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

export class BaseConvertFunction implements FunctionInterface {
  getName(): string {
    return 'baseConvert'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [
      [ValueKind.String, ValueKind.Integer, ValueKind.Integer],
      (call, args) => {
        const number = get(args, 0, StringValue).value
        const from = get(args, 1, IntegerValue).value
        const to = get(args, 2, IntegerValue).value
        if (number === '') {
          throw new EvaluationException('baseConvert: cannot convert empty string', call.getSpan())
        }

        if (from > 36 || from < 2) {
          throw new EvaluationException(`baseConvert: from base ${from} is not in the range 2-36`, call.getSpan())
        }

        if (to > 36 || to < 2) {
          throw new EvaluationException(`baseConvert: to base ${to} is not in the range 2-36`, call.getSpan())
        }

        try {
          return new StringValue(baseConvert(number, from, to))
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
