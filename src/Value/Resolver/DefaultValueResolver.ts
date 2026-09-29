import { IncompatibleValueTypeException } from '../../Exception/IncompatibleValueTypeException.js'
import { resolve as mapKey } from '../../Util/MapKeyUtil.js'
import { BooleanValue } from '../BooleanValue.js'
import { FloatValue } from '../FloatValue.js'
import { IntegerValue } from '../IntegerValue.js'
import { ListValue } from '../ListValue.js'
import { MapValue } from '../MapValue.js'
import { NullValue } from '../NullValue.js'
import { StringValue } from '../StringValue.js'
import { Value } from '../Value.js'

function isPlainObject(value: object): value is Record<string, unknown> {
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

const INTEGER_KEY = /^(0|-?[1-9][0-9]*)$/

function arrayKey(key: string): Value {
  const number = Number(key)
  return INTEGER_KEY.test(key) && Number.isSafeInteger(number)
    ? new IntegerValue(number)
    : new StringValue(key)
}

function fromObject(value: Record<string, unknown>): ListValue | MapValue {
  const defined = Object.entries(value).filter(([, item]) => item !== undefined)
  const keys = defined.map(([key]) => arrayKey(key))

  if (keys.every((key, index) => key instanceof IntegerValue && key.value === index)) {
    return new ListValue(defined.map(([, item]) => resolve(item)))
  }

  const entries = new Map<string, Value>()
  defined.forEach(([, item], index) => {
    entries.set(mapKey(keys[index])!, resolve(item))
  })

  return new MapValue(entries)
}

export function resolve(value: unknown): Value {
  if (value instanceof Value) {
    return value
  }

  if (value === null || value === undefined) {
    return new NullValue()
  }

  if (typeof value === 'boolean') {
    return new BooleanValue(value)
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? new IntegerValue(value + 0) : new FloatValue(value)
  }

  if (typeof value === 'string') {
    return new StringValue(value)
  }

  if (Array.isArray(value)) {
    return new ListValue(value.map(resolve))
  }

  if (typeof value === 'object' && isPlainObject(value)) {
    return fromObject(value)
  }

  throw new IncompatibleValueTypeException(`Incompatible JavaScript type "${typeof value}"`)
}
