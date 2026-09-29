import { InternalException } from '../Exception/InternalException.js'
import type { Value } from '../Value/Value.js'

type ValueClass<T extends Value> = abstract new (...args: never[]) => T

function check<T extends Value>(value: Value, expected: ValueClass<T>, role: string): T {
  if (!(value instanceof expected)) {
    throw InternalException.forMessage(
      `${role} is not of expected type ${expected.name}, got ${value.constructor.name}`,
    )
  }

  return value
}

export const assertOperand = <T extends Value>(value: Value, expected: ValueClass<T>): T =>
  check(value, expected, 'Operand')

export const assertLeft = <T extends Value>(value: Value, expected: ValueClass<T>): T =>
  check(value, expected, 'Left operand')

export const assertRight = <T extends Value>(value: Value, expected: ValueClass<T>): T =>
  check(value, expected, 'Right operand')
