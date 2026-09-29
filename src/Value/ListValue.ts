import { UnsupportedOperationException } from '../Exception/UnsupportedOperationException.js'
import { Value } from './Value.js'
import { ValueKind } from './ValueKind.js'

export class ListValue extends Value {
  constructor(readonly value: Value[]) {
    super()
  }

  getKind(): ValueKind {
    return ValueKind.List
  }

  isZeroValue(): boolean {
    return this.value.length === 0
  }

  isEqual(other: Value): boolean {
    return (
      other instanceof ListValue &&
      this.value.length === other.value.length &&
      this.value.every((item, index) => item.isEqual(other.value[index]))
    )
  }

  isLessThan(other: Value): boolean {
    throw UnsupportedOperationException.forComparison(this, other)
  }

  isGreaterThan(other: Value): boolean {
    throw UnsupportedOperationException.forComparison(this, other)
  }

  getRawValue(): unknown[] {
    return this.value.map((item) => item.getRawValue())
  }
}
