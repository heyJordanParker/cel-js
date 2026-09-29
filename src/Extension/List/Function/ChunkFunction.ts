import { EvaluationException } from '../../../Exception/EvaluationException.js'
import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { ListValue } from '../../../Value/ListValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

export class ChunkFunction implements FunctionInterface {
  getName(): string {
    return 'chunk'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [
      [ValueKind.List, ValueKind.Integer],
      (call, args) => {
        const list = get(args, 0, ListValue).value
        const size = get(args, 1, IntegerValue).value
        if (size <= 0) {
          throw new EvaluationException('Chunk size must be a positive integer', call.getSpan())
        }

        const chunks: ListValue[] = []
        for (let start = 0; start < list.length; start += size) {
          chunks.push(new ListValue(list.slice(start, start + size)))
        }

        return new ListValue(chunks)
      },
    ]
  }
}
