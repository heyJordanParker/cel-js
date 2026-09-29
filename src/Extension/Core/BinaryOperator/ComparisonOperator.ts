import { InternalException } from '../../../Exception/InternalException.js'
import type {
  BinaryOperatorOverloadHandler,
  BinaryOperatorOverloadInterface,
} from '../../../Operator/BinaryOperatorOverloadInterface.js'
import { BinaryOperatorKind } from '../../../Syntax/Binary/BinaryOperatorKind.js'
import { assertLeft, assertRight } from '../../../Util/OperandUtil.js'
import { BooleanValue } from '../../../Value/BooleanValue.js'
import { BytesValue } from '../../../Value/BytesValue.js'
import { DurationValue } from '../../../Value/DurationValue.js'
import { StringValue } from '../../../Value/StringValue.js'
import { TimestampValue } from '../../../Value/TimestampValue.js'
import type { Value } from '../../../Value/Value.js'
import { ValueKind } from '../../../Value/ValueKind.js'

type ValueClass = abstract new (...args: never[]) => Value

const NUMERIC_KINDS = [ValueKind.Integer, ValueKind.UnsignedInteger, ValueKind.Float]

const SAME_KIND: [ValueKind, ValueClass][] = [
  [ValueKind.String, StringValue],
  [ValueKind.Bytes, BytesValue],
  [ValueKind.Boolean, BooleanValue],
  [ValueKind.Timestamp, TimestampValue],
  [ValueKind.Duration, DurationValue],
]

export class ComparisonOperator implements BinaryOperatorOverloadInterface {
  constructor(private readonly operator: BinaryOperatorKind) {}

  getOperator(): BinaryOperatorKind {
    return this.operator
  }

  *getOverloads(): Iterable<[[ValueKind, ValueKind], BinaryOperatorOverloadHandler]> {
    const numeric: BinaryOperatorOverloadHandler = (_, left, right) =>
      new BooleanValue(this.compare(left, right))

    for (const left of NUMERIC_KINDS) {
      for (const right of NUMERIC_KINDS) {
        yield [[left, right], numeric]
      }
    }

    for (const [kind, type] of SAME_KIND) {
      yield [
        [kind, kind],
        (_, left, right) => new BooleanValue(this.compare(assertLeft(left, type), assertRight(right, type))),
      ]
    }
  }

  private compare(a: Value, b: Value): boolean {
    switch (this.operator) {
      case BinaryOperatorKind.LessThan:
        return a.isLessThan(b)
      case BinaryOperatorKind.LessThanOrEqual:
        return a.isLessThan(b) || a.isEqual(b)
      case BinaryOperatorKind.GreaterThan:
        return a.isGreaterThan(b)
      case BinaryOperatorKind.GreaterThanOrEqual:
        return a.isGreaterThan(b) || a.isEqual(b)
      default:
        throw InternalException.forMessage(`Invalid operator: ${this.operator}`)
    }
  }
}
