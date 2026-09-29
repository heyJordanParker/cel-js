import { EvaluationException } from '../../../Exception/EvaluationException.js'
import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import type { CallExpression } from '../../../Syntax/Member/CallExpression.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { ListValue } from '../../../Value/ListValue.js'
import { StringValue } from '../../../Value/StringValue.js'
import type { Value } from '../../../Value/Value.js'
import { ValueKind } from '../../../Value/ValueKind.js'

function strings(call: CallExpression, list: Value[]): string[] {
  return list.map((item) => {
    if (!(item instanceof StringValue)) {
      throw new EvaluationException('join: expects a list of strings', call.getSpan())
    }

    return item.value
  })
}

export class JoinFunction implements FunctionInterface {
  getName(): string {
    return 'join'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [[ValueKind.List], (call, args) => new StringValue(strings(call, get(args, 0, ListValue).value).join(''))]
    yield [
      [ValueKind.List, ValueKind.String],
      (call, args) =>
        new StringValue(strings(call, get(args, 0, ListValue).value).join(get(args, 1, StringValue).value)),
    ]
  }
}
