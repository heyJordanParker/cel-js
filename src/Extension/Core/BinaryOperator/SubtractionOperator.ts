import { EvaluationException } from '../../../Exception/EvaluationException.js'
import { OverflowException } from '../../../Exception/OverflowException.js'
import type {
  BinaryOperatorOverloadHandler,
  BinaryOperatorOverloadInterface,
} from '../../../Operator/BinaryOperatorOverloadInterface.js'
import { BinaryOperatorKind } from '../../../Syntax/Binary/BinaryOperatorKind.js'
import { isValid } from '../../../Util/DurationRange.js'
import { subtract } from '../../../Util/IntegerMath.js'
import { assertLeft, assertRight } from '../../../Util/OperandUtil.js'
import { isValidSeconds } from '../../../Util/TimestampRange.js'
import { DurationValue } from '../../../Value/DurationValue.js'
import { FloatValue } from '../../../Value/FloatValue.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { TimestampValue } from '../../../Value/TimestampValue.js'
import { UnsignedIntegerValue } from '../../../Value/UnsignedIntegerValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'
import { overloads } from './NumericPromotion.js'

const floatFloat: BinaryOperatorOverloadHandler = (_, left, right) =>
  new FloatValue(assertLeft(left, FloatValue).value - assertRight(right, FloatValue).value)

export class SubtractionOperator implements BinaryOperatorOverloadInterface {
  getOperator(): BinaryOperatorKind {
    return BinaryOperatorKind.Minus
  }

  *getOverloads(): Iterable<[[ValueKind, ValueKind], BinaryOperatorOverloadHandler]> {
    yield [
      [ValueKind.Integer, ValueKind.Integer],
      (expression, left, right) => {
        const result = subtract(assertLeft(left, IntegerValue).value, assertRight(right, IntegerValue).value)
        if (result === null) {
          throw new OverflowException('Integer overflow on subtraction', expression.getSpan())
        }

        return new IntegerValue(result)
      },
    ]
    yield [
      [ValueKind.UnsignedInteger, ValueKind.UnsignedInteger],
      (expression, left, right) => {
        const result =
          BigInt(assertLeft(left, UnsignedIntegerValue).value) -
          BigInt(assertRight(right, UnsignedIntegerValue).value)
        if (result < 0n) {
          throw new OverflowException('Unsigned integer overflow on subtraction', expression.getSpan())
        }

        return new UnsignedIntegerValue(result.toString())
      },
    ]
    yield [[ValueKind.Float, ValueKind.Float], floatFloat]
    yield* overloads(floatFloat)
    yield [
      [ValueKind.Timestamp, ValueKind.Duration],
      (expression, left, right) => {
        const result = new TimestampValue(
          assertLeft(left, TimestampValue).nanoseconds - assertRight(right, DurationValue).nanoseconds,
        )
        if (!isValidSeconds(result.seconds())) {
          throw new EvaluationException('Timestamp is outside the valid range', expression.getSpan())
        }

        return result
      },
    ]
    yield [
      [ValueKind.Timestamp, ValueKind.Timestamp],
      (expression, left, right) => {
        const result = assertLeft(left, TimestampValue).nanoseconds - assertRight(right, TimestampValue).nanoseconds
        if (!isValid(result)) {
          throw new EvaluationException('Duration is outside the valid range', expression.getSpan())
        }

        return new DurationValue(result)
      },
    ]
    yield [
      [ValueKind.Duration, ValueKind.Duration],
      (expression, left, right) => {
        const result = assertLeft(left, DurationValue).nanoseconds - assertRight(right, DurationValue).nanoseconds
        if (!isValid(result)) {
          throw new EvaluationException('Duration is outside the valid range', expression.getSpan())
        }

        return new DurationValue(result)
      },
    ]
  }
}
