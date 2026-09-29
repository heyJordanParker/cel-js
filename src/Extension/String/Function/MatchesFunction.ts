import { EvaluationException } from '../../../Exception/EvaluationException.js'
import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { BooleanValue } from '../../../Value/BooleanValue.js'
import { StringValue } from '../../../Value/StringValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

export class MatchesFunction implements FunctionInterface {
  getName(): string {
    return 'matches'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [
      [ValueKind.String, ValueKind.String],
      (call, args) => {
        const pattern = get(args, 1, StringValue).value
        let compiled: RegExp
        try {
          compiled = new RegExp(pattern, 'u')
        } catch (error) {
          throw new EvaluationException(`Invalid regular expression \`${pattern}\``, call.getSpan(), error)
        }

        return new BooleanValue(compiled.test(get(args, 0, StringValue).value))
      },
    ]
  }
}
