import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { BytesValue, fromOctets, octets } from '../../../Value/BytesValue.js'
import { StringValue } from '../../../Value/StringValue.js'
import type { Value } from '../../../Value/Value.js'
import { ValueKind } from '../../../Value/ValueKind.js'

const WHITESPACE = ' \n\r\t\v\0'

function characterSet(characters: string): Set<string> {
  const units = Array.from(characters)
  const set = new Set<string>()
  let index = 0
  while (index < units.length) {
    const unit = units[index] as string
    const end = units[index + 3]
    if (units[index + 1] === '.' && units[index + 2] === '.' && end !== undefined) {
      for (let point = unit.codePointAt(0) as number; point <= (end.codePointAt(0) as number); point++) {
        set.add(String.fromCodePoint(point))
      }

      index += 4
      continue
    }

    set.add(unit)
    index++
  }

  return set
}

export function trim(value: string, characters: string, left: boolean, right: boolean): string {
  const set = characterSet(characters)
  const units = Array.from(value)
  let start = 0
  let end = units.length
  while (left && start < end && set.has(units[start] as string)) start++
  while (right && end > start && set.has(units[end - 1] as string)) end--

  return units.slice(start, end).join('')
}

export function* trimOverloads(left: boolean, right: boolean): Iterable<[ValueKind[], FunctionOverloadHandler]> {
  const text = (args: Value[], index: number): string => get(args, index, StringValue).value
  const bytes = (args: Value[], index: number): string => octets(get(args, index, BytesValue).value)

  yield [[ValueKind.String], (_, args) => new StringValue(trim(text(args, 0), WHITESPACE, left, right))]
  yield [
    [ValueKind.String, ValueKind.String],
    (_, args) => new StringValue(trim(text(args, 0), text(args, 1), left, right)),
  ]
  yield [[ValueKind.Bytes], (_, args) => new BytesValue(fromOctets(trim(bytes(args, 0), WHITESPACE, left, right)))]
  yield [
    [ValueKind.Bytes, ValueKind.Bytes],
    (_, args) => new BytesValue(fromOctets(trim(bytes(args, 0), bytes(args, 1), left, right))),
  ]
}

export class TrimFunction implements FunctionInterface {
  getName(): string {
    return 'trim'
  }

  getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    return trimOverloads(true, true)
  }
}
