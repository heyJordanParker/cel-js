import { UnsupportedOperationException } from '../Exception/UnsupportedOperationException.js'
import { compareStrings } from './StringValue.js'
import { Value } from './Value.js'
import { ValueKind } from './ValueKind.js'

export const octets = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')

export const fromOctets = (value: string): Uint8Array => Uint8Array.from(value, (octet) => octet.charCodeAt(0))

export class BytesValue extends Value {
  constructor(readonly value: Uint8Array) {
    super()
  }

  getKind(): ValueKind {
    return ValueKind.Bytes
  }

  isZeroValue(): boolean {
    return this.value.length === 0
  }

  isEqual(other: Value): boolean {
    return other instanceof BytesValue && octets(this.value) === octets(other.value)
  }

  isGreaterThan(other: Value): boolean {
    if (!(other instanceof BytesValue)) throw UnsupportedOperationException.forComparison(this, other)
    return compareStrings(octets(this.value), octets(other.value)) > 0
  }

  isLessThan(other: Value): boolean {
    if (!(other instanceof BytesValue)) throw UnsupportedOperationException.forComparison(this, other)
    return compareStrings(octets(this.value), octets(other.value)) < 0
  }

  getRawValue(): Uint8Array {
    return this.value
  }
}
