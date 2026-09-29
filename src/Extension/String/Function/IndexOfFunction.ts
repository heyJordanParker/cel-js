import { EvaluationException } from '../../../Exception/EvaluationException.js'
import { OutOfRangeException } from '../../../Exception/OutOfRangeException.js'
import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import type { CallExpression } from '../../../Syntax/Member/CallExpression.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { indexOf, length } from '../../../Util/Multibyte.js'
import { normalize } from '../../../Util/SearchOffset.js'
import { BytesValue, octets } from '../../../Value/BytesValue.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { StringValue } from '../../../Value/StringValue.js'
import type { Value } from '../../../Value/Value.js'
import { ValueKind } from '../../../Value/ValueKind.js'

function search(call: CallExpression, haystack: string, needle: string, offset: number | null): IntegerValue {
  if (needle === '') {
    return new IntegerValue(offset ?? 0)
  }

  if (offset === null) {
    return new IntegerValue(indexOf(haystack, needle, 0))
  }

  try {
    return new IntegerValue(indexOf(haystack, needle, normalize(offset, length(haystack))))
  } catch (error) {
    if (error instanceof OutOfRangeException) {
      throw new EvaluationException(`String operation failed: ${error.message}`, call.getSpan(), error)
    }

    throw error
  }
}

const text = (args: Value[], index: number): string => get(args, index, StringValue).value

const bytes = (args: Value[], index: number): string => octets(get(args, index, BytesValue).value)

export class IndexOfFunction implements FunctionInterface {
  getName(): string {
    return 'indexOf'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [[ValueKind.String, ValueKind.String], (call, args) => search(call, text(args, 0), text(args, 1), null)]
    yield [
      [ValueKind.String, ValueKind.String, ValueKind.Integer],
      (call, args) => search(call, text(args, 0), text(args, 1), get(args, 2, IntegerValue).value),
    ]
    yield [[ValueKind.Bytes, ValueKind.Bytes], (call, args) => search(call, bytes(args, 0), bytes(args, 1), null)]
    yield [
      [ValueKind.Bytes, ValueKind.Bytes, ValueKind.Integer],
      (call, args) => search(call, bytes(args, 0), bytes(args, 1), get(args, 2, IntegerValue).value),
    ]
  }
}
