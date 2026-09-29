import { UnsupportedOperationException } from '../Exception/UnsupportedOperationException.js'
import { equals, isNumeric, order } from '../Util/NumericComparator.js'
import { Value } from './Value.js'
import { ValueKind } from './ValueKind.js'

export class FloatValue extends Value {
  constructor(readonly value: number) {
    super()
  }

  getKind(): ValueKind {
    return ValueKind.Float
  }

  override getType(): string {
    return 'double'
  }

  isZeroValue(): boolean {
    return this.value === 0
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

  getRawValue(): number {
    return this.value
  }
}
