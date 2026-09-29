import { UnsupportedOperationException } from '../Exception/UnsupportedOperationException.js'
import { FloatValue } from '../Value/FloatValue.js'
import { IntegerValue } from '../Value/IntegerValue.js'
import { UnsignedIntegerValue } from '../Value/UnsignedIntegerValue.js'
import type { Value } from '../Value/Value.js'

const MAX_UINT64 = 2 ** 64

export type NumericValue = IntegerValue | UnsignedIntegerValue | FloatValue

export function isNumeric(value: Value): value is NumericValue {
  return (
    value instanceof IntegerValue ||
    value instanceof UnsignedIntegerValue ||
    value instanceof FloatValue
  )
}

function isNaNValue(value: Value): boolean {
  return value instanceof FloatValue && Number.isNaN(value.value)
}

export function equals(a: NumericValue, b: NumericValue): boolean {
  if (isNaNValue(a) || isNaNValue(b)) {
    return false
  }

  return compare(a, b) === 0
}

export function order(a: NumericValue, b: NumericValue): number {
  if (isNaNValue(a) || isNaNValue(b)) {
    throw UnsupportedOperationException.forNaN()
  }

  return compare(a, b)
}

function compare(a: NumericValue, b: NumericValue): number {
  if (a instanceof FloatValue && b instanceof FloatValue) {
    return compareDouble(a.value, b.value)
  }

  if (a instanceof FloatValue) {
    return b instanceof IntegerValue ? compareDouble(a.value, b.value) : compareDoubleUint(a.value, b)
  }

  if (b instanceof FloatValue) {
    return a instanceof IntegerValue ? -compareDouble(b.value, a.value) : -compareDoubleUint(b.value, a)
  }

  const left = BigInt(a.value)
  const right = BigInt(b.value)
  if (left === right) {
    return 0
  }

  return left < right ? -1 : 1
}

function compareDoubleUint(d: number, u: UnsignedIntegerValue): number {
  if (d < 0) {
    return -1
  }

  if (d > MAX_UINT64) {
    return 1
  }

  return compareDouble(d, Number(u.value))
}

function compareDouble(a: number, b: number): number {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}
