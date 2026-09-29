import { EvaluationException } from '../../../Exception/EvaluationException.js'
import { OverflowException } from '../../../Exception/OverflowException.js'
import type {
  BinaryOperatorOverloadHandler,
  BinaryOperatorOverloadInterface,
} from '../../../Operator/BinaryOperatorOverloadInterface.js'
import type { BinaryExpression } from '../../../Syntax/Binary/BinaryExpression.js'
import { BinaryOperatorKind } from '../../../Syntax/Binary/BinaryOperatorKind.js'
import { isValid } from '../../../Util/DurationRange.js'
import { add } from '../../../Util/IntegerMath.js'
import { assertLeft, assertRight } from '../../../Util/OperandUtil.js'
import { isValidSeconds } from '../../../Util/TimestampRange.js'
import { BytesValue } from '../../../Value/BytesValue.js'
import { DurationValue } from '../../../Value/DurationValue.js'
import { FloatValue } from '../../../Value/FloatValue.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { ListValue } from '../../../Value/ListValue.js'
import { StringValue } from '../../../Value/StringValue.js'
import { TimestampValue } from '../../../Value/TimestampValue.js'
import { UnsignedIntegerValue } from '../../../Value/UnsignedIntegerValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'
import { overloads } from './NumericPromotion.js'

export const UINT64_MAX = 18446744073709551615n


const floatFloat: BinaryOperatorOverloadHandler = (_, left, right) =>
  new FloatValue(assertLeft(left, FloatValue).value + assertRight(right, FloatValue).value)

function shift(expression: BinaryExpression, timestamp: TimestampValue, duration: DurationValue): TimestampValue {
  const result = new TimestampValue(timestamp.nanoseconds + duration.nanoseconds)
  if (!isValidSeconds(result.seconds())) {
    throw new EvaluationException('Timestamp is outside the valid range', expression.getSpan())
  }

  return result
}

export class AdditionOperator implements BinaryOperatorOverloadInterface {
  getOperator(): BinaryOperatorKind {
    return BinaryOperatorKind.Plus
  }

  *getOverloads(): Iterable<[[ValueKind, ValueKind], BinaryOperatorOverloadHandler]> {
    yield [
      [ValueKind.Integer, ValueKind.Integer],
      (expression, left, right) => {
        const result = add(assertLeft(left, IntegerValue).value, assertRight(right, IntegerValue).value)
        if (result === null) {
          throw new OverflowException('Integer overflow on addition', expression.getSpan())
        }

        return new IntegerValue(result)
      },
    ]
    yield [
      [ValueKind.UnsignedInteger, ValueKind.UnsignedInteger],
      (expression, left, right) => {
        const result =
          BigInt(assertLeft(left, UnsignedIntegerValue).value) +
          BigInt(assertRight(right, UnsignedIntegerValue).value)
        if (result > UINT64_MAX) {
          throw new OverflowException('Unsigned integer overflow on addition', expression.getSpan())
        }

        return new UnsignedIntegerValue(result.toString())
      },
    ]
    yield [[ValueKind.Float, ValueKind.Float], floatFloat]
    yield* overloads(floatFloat)
    yield [
      [ValueKind.String, ValueKind.String],
      (_, left, right) =>
        new StringValue(assertLeft(left, StringValue).value + assertRight(right, StringValue).value),
    ]
    yield [
      [ValueKind.Bytes, ValueKind.Bytes],
      (_, left, right) =>
        new BytesValue(
          Uint8Array.from([...assertLeft(left, BytesValue).value, ...assertRight(right, BytesValue).value]),
        ),
    ]
    yield [
      [ValueKind.List, ValueKind.List],
      (_, left, right) =>
        new ListValue([...assertLeft(left, ListValue).value, ...assertRight(right, ListValue).value]),
    ]
    yield [
      [ValueKind.Timestamp, ValueKind.Duration],
      (expression, left, right) =>
        shift(expression, assertLeft(left, TimestampValue), assertRight(right, DurationValue)),
    ]
    yield [
      [ValueKind.Duration, ValueKind.Timestamp],
      (expression, left, right) =>
        shift(expression, assertRight(right, TimestampValue), assertLeft(left, DurationValue)),
    ]
    yield [
      [ValueKind.Duration, ValueKind.Duration],
      (expression, left, right) => {
        const result = assertLeft(left, DurationValue).nanoseconds + assertRight(right, DurationValue).nanoseconds
        if (!isValid(result)) {
          throw new EvaluationException('Duration is outside the valid range', expression.getSpan())
        }

        return new DurationValue(result)
      },
    ]
  }
}
