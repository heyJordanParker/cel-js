import { BooleanValue } from './BooleanValue.js'
import { BytesValue } from './BytesValue.js'
import { FloatValue } from './FloatValue.js'
import { IntegerValue } from './IntegerValue.js'
import { NullValue } from './NullValue.js'
import { StringValue } from './StringValue.js'
import { UnsignedIntegerValue } from './UnsignedIntegerValue.js'
import type { Value } from './Value.js'

const WRAPPERS: Readonly<Record<string, () => Value>> = {
  'google.protobuf.BoolValue': () => new BooleanValue(false),
  'google.protobuf.Int32Value': () => new IntegerValue(0),
  'google.protobuf.Int64Value': () => new IntegerValue(0),
  'google.protobuf.UInt32Value': () => new UnsignedIntegerValue(0),
  'google.protobuf.UInt64Value': () => new UnsignedIntegerValue(0),
  'google.protobuf.FloatValue': () => new FloatValue(0),
  'google.protobuf.DoubleValue': () => new FloatValue(0),
  'google.protobuf.StringValue': () => new StringValue(''),
  'google.protobuf.BytesValue': () => new BytesValue(new Uint8Array()),
}

export function allowedFields(typename: string): string[] | null {
  if (Object.hasOwn(WRAPPERS, typename)) {
    return ['value']
  }

  return typename === 'google.protobuf.Value' ? [] : null
}

export function construct(typename: string, fields: Map<string, Value>): Value | null {
  if (Object.hasOwn(WRAPPERS, typename)) {
    return fields.get('value') ?? WRAPPERS[typename]()
  }

  return typename === 'google.protobuf.Value' ? new NullValue() : null
}
