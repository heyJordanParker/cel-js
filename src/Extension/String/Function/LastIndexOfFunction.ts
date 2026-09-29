import { EvaluationException } from '../../../Exception/EvaluationException.js'
import { OutOfRangeException } from '../../../Exception/OutOfRangeException.js'
import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import type { CallExpression } from '../../../Syntax/Member/CallExpression.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { lastIndexOf, length } from '../../../Util/Multibyte.js'
import { normalize } from '../../../Util/SearchOffset.js'
import { BytesValue, octets } from '../../../Value/BytesValue.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { StringValue } from '../../../Value/StringValue.js'
import type { Value } from '../../../Value/Value.js'
import { ValueKind } from '../../../Value/ValueKind.js'

function search(call: CallExpression, haystack: string, needle: string, offset: number): IntegerValue {
  if (needle === '') {
    return new IntegerValue(offset)
  }

  try {
    return new IntegerValue(lastIndexOf(haystack, needle, normalize(offset, length(haystack))))
  } catch (error) {
    if (error instanceof OutOfRangeException) {
      throw new EvaluationException(`String operation failed: ${error.message}`, call.getSpan(), error)
    }

    throw error
  }
}

const text = (args: Value[], index: number): string => get(args, index, StringValue).value

const bytes = (args: Value[], index: number): string => octets(get(args, index, BytesValue).value)

export class LastIndexOfFunction implements FunctionInterface {
  getName(): string {
    return 'lastIndexOf'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [
      [ValueKind.String, ValueKind.String],
      (_, args) =>
        text(args, 1) === ''
          ? new IntegerValue(length(text(args, 0)))
          : new IntegerValue(lastIndexOf(text(args, 0), text(args, 1), 0)),
    ]
    yield [
      [ValueKind.String, ValueKind.String, ValueKind.Integer],
      (call, args) => search(call, text(args, 0), text(args, 1), get(args, 2, IntegerValue).value),
    ]
    yield [
      [ValueKind.Bytes, ValueKind.Bytes],
      (_, args) =>
        bytes(args, 1) === ''
          ? new IntegerValue(length(new TextDecoder().decode(get(args, 0, BytesValue).value)))
          : new IntegerValue(lastIndexOf(bytes(args, 0), bytes(args, 1), 0)),
    ]
    yield [
      [ValueKind.Bytes, ValueKind.Bytes, ValueKind.Integer],
      (call, args) => search(call, bytes(args, 0), bytes(args, 1), get(args, 2, IntegerValue).value),
    ]
  }
}
