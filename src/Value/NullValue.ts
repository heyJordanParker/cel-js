import { UnsupportedOperationException } from '../Exception/UnsupportedOperationException.js'
import { Value } from './Value.js'
import { ValueKind } from './ValueKind.js'

export class NullValue extends Value {
  getRawValue(): null {
    return null
  }

  getKind(): ValueKind {
    return ValueKind.Null
  }

  override getType(): string {
    return 'null_type'
  }

  isZeroValue(): boolean {
    return true
  }

  isEqual(other: Value): boolean {
    return other instanceof NullValue
  }

  isLessThan(other: Value): boolean {
    throw UnsupportedOperationException.forComparison(this, other)
  }

  isGreaterThan(other: Value): boolean {
    throw UnsupportedOperationException.forComparison(this, other)
  }
}
