import { UnsupportedOperationException } from '../Exception/UnsupportedOperationException.js'
import { Value } from './Value.js'
import { ValueKind } from './ValueKind.js'

export class OptionalValue extends Value {
  constructor(readonly value: Value | null = null) {
    super()
  }

  static of(value: Value): OptionalValue {
    return new OptionalValue(value)
  }

  static none(): OptionalValue {
    return new OptionalValue(null)
  }

  hasValue(): boolean {
    return this.value !== null
  }

  getKind(): ValueKind {
    return ValueKind.Optional
  }

  isZeroValue(): boolean {
    return false
  }

  isEqual(other: Value): boolean {
    if (!(other instanceof OptionalValue)) {
      return false
    }

    if (this.value === null || other.value === null) {
      return this.value === other.value
    }

    return this.value.isEqual(other.value)
  }

  isLessThan(other: Value): boolean {
    throw UnsupportedOperationException.forComparison(this, other)
  }

  isGreaterThan(other: Value): boolean {
    throw UnsupportedOperationException.forComparison(this, other)
  }

  getRawValue(): unknown {
    return this.value === null ? null : this.value.getRawValue()
  }
}
