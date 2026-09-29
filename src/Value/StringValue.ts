import { UnsupportedOperationException } from '../Exception/UnsupportedOperationException.js'
import { Value } from './Value.js'
import { ValueKind } from './ValueKind.js'

const SPACE = '[ \\t\\n\\r\\v\\f]*'

const NUMERIC = new RegExp(`^${SPACE}[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?${SPACE}$`)

export function compareStrings(a: string, b: string): number {
  if (NUMERIC.test(a) && NUMERIC.test(b)) {
    const left = parseFloat(a)
    const right = parseFloat(b)
    if (left === right) {
      return 0
    }

    return left < right ? -1 : 1
  }

  const left = Array.from(a, (char) => char.codePointAt(0)!)
  const right = Array.from(b, (char) => char.codePointAt(0)!)
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    if (left[i] !== right[i]) {
      return left[i] < right[i] ? -1 : 1
    }
  }

  return Math.sign(left.length - right.length)
}

export class StringValue extends Value {
  constructor(readonly value: string) {
    super()
  }

  getKind(): ValueKind {
    return ValueKind.String
  }

  isZeroValue(): boolean {
    return this.value === ''
  }

  isEqual(other: Value): boolean {
    return other instanceof StringValue && this.value === other.value
  }

  isGreaterThan(other: Value): boolean {
    if (!(other instanceof StringValue)) throw UnsupportedOperationException.forComparison(this, other)
    return compareStrings(this.value, other.value) > 0
  }

  isLessThan(other: Value): boolean {
    if (!(other instanceof StringValue)) throw UnsupportedOperationException.forComparison(this, other)
    return compareStrings(this.value, other.value) < 0
  }

  getRawValue(): string {
    return this.value
  }
}
