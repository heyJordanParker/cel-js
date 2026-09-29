import { InternalException } from '../Exception/InternalException.js'
import type { Value } from '../Value/Value.js'

type ValueClass<T extends Value> = abstract new (...args: never[]) => T

function check<T extends Value>(argument: Value, index: number, expected: ValueClass<T>): T {
  if (!(argument instanceof expected)) {
    throw InternalException.forMessage(
      `Argument at index ${index} is not of expected type ${expected.name}, got ${argument.constructor.name}`,
    )
  }

  return argument
}

export function get<T extends Value>(args: Value[], index: number, expected: ValueClass<T>): T {
  const argument = args[index]
  if (argument === undefined) {
    throw InternalException.forMessage(`Argument at index ${index} is missing`)
  }

  return check(argument, index, expected)
}

export function getOptional<T extends Value>(args: Value[], index: number, expected: ValueClass<T>): T | null {
  const argument = args[index]
  return argument === undefined ? null : check(argument, index, expected)
}
