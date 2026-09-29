import { UnsupportedOperationException } from '../Exception/UnsupportedOperationException.js'
import { Value } from './Value.js'
import { ValueKind } from './ValueKind.js'

export const NANOS_PER_SECOND = 1_000_000_000n

export class TimestampValue extends Value {
  constructor(readonly nanoseconds: bigint) {
    super()
  }

  seconds(): bigint {
    const seconds = this.nanoseconds / NANOS_PER_SECOND
    return this.nanoseconds < 0n && this.nanoseconds % NANOS_PER_SECOND !== 0n ? seconds - 1n : seconds
  }

  nanos(): number {
    return Number(this.nanoseconds - this.seconds() * NANOS_PER_SECOND)
  }

  getKind(): ValueKind {
    return ValueKind.Timestamp
  }

  override getType(): string {
    return 'google.protobuf.Timestamp'
  }

  isZeroValue(): boolean {
    return false
  }

  isEqual(other: Value): boolean {
    return other instanceof TimestampValue && this.nanoseconds === other.nanoseconds
  }

  isGreaterThan(other: Value): boolean {
    if (!(other instanceof TimestampValue)) throw UnsupportedOperationException.forComparison(this, other)
    return this.nanoseconds > other.nanoseconds
  }

  isLessThan(other: Value): boolean {
    if (!(other instanceof TimestampValue)) throw UnsupportedOperationException.forComparison(this, other)
    return this.nanoseconds < other.nanoseconds
  }

  getRawValue(): Date {
    return new Date(Number(this.seconds()) * 1000 + Math.floor(this.nanos() / 1_000_000))
  }
}
