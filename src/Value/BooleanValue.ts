import { UnsupportedOperationException } from '../Exception/UnsupportedOperationException.js'
import { Value } from './Value.js'
import { ValueKind } from './ValueKind.js'

export class BooleanValue extends Value {
  constructor(readonly value: boolean) {
    super()
  }

  getKind(): ValueKind {
    return ValueKind.Boolean
  }

  isZeroValue(): boolean {
    return !this.value
  }

  isEqual(other: Value): boolean {
    return other instanceof BooleanValue && this.value === other.value
  }

  isGreaterThan(other: Value): boolean {
    if (!(other instanceof BooleanValue)) throw UnsupportedOperationException.forComparison(this, other)
    return Number(this.value) > Number(other.value)
  }

  isLessThan(other: Value): boolean {
    if (!(other instanceof BooleanValue)) throw UnsupportedOperationException.forComparison(this, other)
    return Number(this.value) < Number(other.value)
  }

  getRawValue(): boolean {
    return this.value
  }
}
