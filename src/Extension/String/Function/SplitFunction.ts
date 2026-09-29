import { EvaluationException } from '../../../Exception/EvaluationException.js'
import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import type { CallExpression } from '../../../Syntax/Member/CallExpression.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { characters } from '../../../Util/StringSplit.js'
import { BytesValue, fromOctets, octets } from '../../../Value/BytesValue.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { ListValue } from '../../../Value/ListValue.js'
import { StringValue } from '../../../Value/StringValue.js'
import type { Value } from '../../../Value/Value.js'
import { ValueKind } from '../../../Value/ValueKind.js'

function limitOf(call: CallExpression, args: Value[]): number {
  const limit = get(args, 2, IntegerValue).value
  if (limit < 1) {
    throw new EvaluationException(
      `split: limit ${limit} is less than 1, only positive integers are supported`,
      call.getSpan(),
    )
  }

  return limit
}

function split(haystack: string, delimiter: string, limit: number | null, bytes: boolean): string[] {
  if (delimiter === '') {
    return characters(haystack, limit, bytes)
  }

  const parts = haystack.split(delimiter)
  if (limit === null || parts.length <= limit) {
    return parts
  }

  return [...parts.slice(0, limit - 1), parts.slice(limit - 1).join(delimiter)]
}

const strings = (args: Value[], limit: number | null): ListValue =>
  new ListValue(
    split(get(args, 0, StringValue).value, get(args, 1, StringValue).value, limit, false).map(
      (part) => new StringValue(part),
    ),
  )

const bytes = (args: Value[], limit: number | null): ListValue =>
  new ListValue(
    split(octets(get(args, 0, BytesValue).value), octets(get(args, 1, BytesValue).value), limit, true).map(
      (part) => new BytesValue(fromOctets(part)),
    ),
  )

export class SplitFunction implements FunctionInterface {
  getName(): string {
    return 'split'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [[ValueKind.String, ValueKind.String], (_, args) => strings(args, null)]
    yield [[ValueKind.String, ValueKind.String, ValueKind.Integer], (call, args) => strings(args, limitOf(call, args))]
    yield [[ValueKind.Bytes, ValueKind.Bytes], (_, args) => bytes(args, null)]
    yield [[ValueKind.Bytes, ValueKind.Bytes, ValueKind.Integer], (call, args) => bytes(args, limitOf(call, args))]
  }
}
