import { UnsupportedOperationException } from '../Exception/UnsupportedOperationException.js'
import { NANOS_PER_SECOND } from './TimestampValue.js'
import { Value } from './Value.js'
import { ValueKind } from './ValueKind.js'

export class DurationValue extends Value {
  constructor(readonly nanoseconds: bigint) {
    super()
  }

  getKind(): ValueKind {
    return ValueKind.Duration
  }

  override getType(): string {
    return 'google.protobuf.Duration'
  }

  isZeroValue(): boolean {
    return this.nanoseconds === 0n
  }

  isEqual(other: Value): boolean {
    return other instanceof DurationValue && this.nanoseconds === other.nanoseconds
  }

  isGreaterThan(other: Value): boolean {
    if (!(other instanceof DurationValue)) throw UnsupportedOperationException.forComparison(this, other)
    return this.nanoseconds > other.nanoseconds
  }

  isLessThan(other: Value): boolean {
    if (!(other instanceof DurationValue)) throw UnsupportedOperationException.forComparison(this, other)
    return this.nanoseconds < other.nanoseconds
  }

  getRawValue(): { seconds: number; nanoseconds: number } {
    return {
      seconds: Number(this.nanoseconds / NANOS_PER_SECOND),
      nanoseconds: Number(this.nanoseconds % NANOS_PER_SECOND),
    }
  }
}
