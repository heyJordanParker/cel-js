import { UnsupportedOperationException } from '../Exception/UnsupportedOperationException.js'
import { equals, isNumeric, order } from '../Util/NumericComparator.js'
import { Value } from './Value.js'
import { ValueKind } from './ValueKind.js'

export class UnsignedIntegerValue extends Value {
  constructor(readonly value: number | string) {
    super()
  }

  getKind(): ValueKind {
    return ValueKind.UnsignedInteger
  }

  isZeroValue(): boolean {
    return BigInt(this.value) === 0n
  }

  isEqual(other: Value): boolean {
    return isNumeric(other) && equals(this, other)
  }

  isGreaterThan(other: Value): boolean {
    if (!isNumeric(other)) throw UnsupportedOperationException.forComparison(this, other)
    return order(this, other) > 0
  }

  isLessThan(other: Value): boolean {
    if (!isNumeric(other)) throw UnsupportedOperationException.forComparison(this, other)
    return order(this, other) < 0
  }

  getRawValue(): number | string {
    return this.value
  }
}
