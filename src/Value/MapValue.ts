import { UnsupportedOperationException } from '../Exception/UnsupportedOperationException.js'
import { keyToRaw } from '../Util/MapKeyUtil.js'
import { Value } from './Value.js'
import { ValueKind } from './ValueKind.js'

export class MapValue extends Value {
  constructor(readonly value: Map<string, Value>) {
    super()
  }

  getKind(): ValueKind {
    return ValueKind.Map
  }

  isZeroValue(): boolean {
    return this.value.size === 0
  }

  isEqual(other: Value): boolean {
    if (!(other instanceof MapValue) || this.value.size !== other.value.size) {
      return false
    }

    for (const [key, value] of this.value) {
      const otherValue = other.get(key)
      if (otherValue === null || !value.isEqual(otherValue)) {
        return false
      }
    }

    return true
  }

  isLessThan(other: Value): boolean {
    throw UnsupportedOperationException.forComparison(this, other)
  }

  isGreaterThan(other: Value): boolean {
    throw UnsupportedOperationException.forComparison(this, other)
  }

  has(key: string): boolean {
    return this.value.has(key)
  }

  get(key: string): Value | null {
    return this.value.get(key) ?? null
  }

  getRawValue(): Record<string, unknown> {
    const raw: Record<string, unknown> = {}
    for (const [key, value] of this.value) {
      raw[keyToRaw(key)] = value.getRawValue()
    }

    return raw
  }
}
