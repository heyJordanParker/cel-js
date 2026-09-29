import { BooleanValue } from '../Value/BooleanValue.js'
import { FloatValue } from '../Value/FloatValue.js'
import { IntegerValue } from '../Value/IntegerValue.js'
import { StringValue } from '../Value/StringValue.js'
import { UnsignedIntegerValue } from '../Value/UnsignedIntegerValue.js'
import type { Value } from '../Value/Value.js'

const BOOLEAN_TAG = 'b:'
const NUMBER_TAG = 'n:'
const STRING_TAG = 's:'

const INT64_BOUND = 9223372036854775808

function doubleToInt(value: number): number | null {
  return Number.isInteger(value) && value >= -INT64_BOUND && value < INT64_BOUND
    ? value + 0
    : null
}

function decimalToInt(decimal: string): number | null {
  const number = Number(decimal)
  return Number.isSafeInteger(number) && String(number) === decimal ? number : null
}

export function isKeyType(value: Value): boolean {
  return (
    value instanceof StringValue ||
    value instanceof IntegerValue ||
    value instanceof UnsignedIntegerValue ||
    value instanceof BooleanValue ||
    value instanceof FloatValue
  )
}

export function stringKey(value: string): string {
  return STRING_TAG + value
}

export function resolve(value: Value): string | null {
  if (value instanceof StringValue) {
    return stringKey(value.value)
  }

  if (value instanceof IntegerValue || value instanceof UnsignedIntegerValue) {
    return NUMBER_TAG + BigInt(value.value).toString()
  }

  if (value instanceof BooleanValue) {
    return BOOLEAN_TAG + (value.value ? '1' : '0')
  }

  if (value instanceof FloatValue) {
    const integer = doubleToInt(value.value)
    return integer === null ? null : NUMBER_TAG + BigInt(integer).toString()
  }

  return null
}

export function resolveIndex(value: Value): number | null {
  if (value instanceof IntegerValue) {
    return value.value
  }

  if (value instanceof UnsignedIntegerValue) {
    return typeof value.value === 'number' ? value.value : null
  }

  if (value instanceof FloatValue) {
    return doubleToInt(value.value)
  }

  return null
}

export function keyToValue(key: string): Value {
  if (key.startsWith(BOOLEAN_TAG)) {
    return new BooleanValue(key === BOOLEAN_TAG + '1')
  }

  if (key.startsWith(STRING_TAG)) {
    return new StringValue(key.slice(STRING_TAG.length))
  }

  const decimal = key.slice(NUMBER_TAG.length)
  const asInt = decimalToInt(decimal)
  return asInt === null ? new UnsignedIntegerValue(decimal) : new IntegerValue(asInt)
}

export function keyToRaw(key: string): string | number {
  if (key.startsWith(BOOLEAN_TAG)) {
    return key === BOOLEAN_TAG + '1' ? 1 : 0
  }

  if (key.startsWith(STRING_TAG)) {
    return key.slice(STRING_TAG.length)
  }

  const decimal = key.slice(NUMBER_TAG.length)
  return decimalToInt(decimal) ?? decimal
}
