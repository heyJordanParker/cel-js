import { UnsupportedOperationException } from '../Exception/UnsupportedOperationException.js'
import { Value } from './Value.js'
import { ValueKind } from './ValueKind.js'

const DENOTATIONS: ReadonlySet<string> = new Set([
  'bool',
  'bytes',
  'double',
  'int',
  'uint',
  'string',
  'list',
  'map',
  'null_type',
  'type',
  'optional_type',
  'google.protobuf.Timestamp',
  'google.protobuf.Duration',
])

export class TypeValue extends Value {
  constructor(readonly name: string) {
    super()
  }

  static denotation(name: string): TypeValue | null {
    return DENOTATIONS.has(name) ? new TypeValue(name) : null
  }

  getKind(): ValueKind {
    return ValueKind.Type
  }

  isZeroValue(): boolean {
    return false
  }

  isEqual(other: Value): boolean {
    return other instanceof TypeValue && this.name === other.name
  }

  isGreaterThan(other: Value): boolean {
    throw UnsupportedOperationException.forComparison(this, other)
  }

  isLessThan(other: Value): boolean {
    throw UnsupportedOperationException.forComparison(this, other)
  }

  override getType(): string {
    return 'type'
  }

  getRawValue(): string {
    return this.name
  }
}
