import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { BytesValue, fromOctets, octets } from '../../../Value/BytesValue.js'
import { StringValue } from '../../../Value/StringValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

function replace(haystack: string, needle: string, replacement: string, units: string[]): string {
  if (needle !== '') {
    return haystack.split(needle).join(replacement)
  }

  const result = units.join(replacement) + replacement
  return haystack === '' ? result : replacement + result
}

export class ReplaceFunction implements FunctionInterface {
  getName(): string {
    return 'replace'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [
      [ValueKind.String, ValueKind.String, ValueKind.String],
      (_, args) => {
        const haystack = get(args, 0, StringValue).value
        return new StringValue(
          replace(haystack, get(args, 1, StringValue).value, get(args, 2, StringValue).value, Array.from(haystack)),
        )
      },
    ]
    yield [
      [ValueKind.Bytes, ValueKind.Bytes, ValueKind.Bytes],
      (_, args) => {
        const haystack = octets(get(args, 0, BytesValue).value)
        return new BytesValue(
          fromOctets(
            replace(
              haystack,
              octets(get(args, 1, BytesValue).value),
              octets(get(args, 2, BytesValue).value),
              haystack.split(''),
            ),
          ),
        )
      },
    ]
  }
}
