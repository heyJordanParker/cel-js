import { OverflowException } from '../../../Exception/OverflowException.js'
import type {
  BinaryOperatorOverloadHandler,
  BinaryOperatorOverloadInterface,
} from '../../../Operator/BinaryOperatorOverloadInterface.js'
import { BinaryOperatorKind } from '../../../Syntax/Binary/BinaryOperatorKind.js'
import { multiply } from '../../../Util/IntegerMath.js'
import { assertLeft, assertRight } from '../../../Util/OperandUtil.js'
import { FloatValue } from '../../../Value/FloatValue.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { UnsignedIntegerValue } from '../../../Value/UnsignedIntegerValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'
import { UINT64_MAX } from './AdditionOperator.js'
import { overloads } from './NumericPromotion.js'

const floatFloat: BinaryOperatorOverloadHandler = (_, left, right) =>
  new FloatValue(assertLeft(left, FloatValue).value * assertRight(right, FloatValue).value)

export class MultiplicationOperator implements BinaryOperatorOverloadInterface {
  getOperator(): BinaryOperatorKind {
    return BinaryOperatorKind.Multiply
  }

  *getOverloads(): Iterable<[[ValueKind, ValueKind], BinaryOperatorOverloadHandler]> {
    yield [
      [ValueKind.Integer, ValueKind.Integer],
      (expression, left, right) => {
        const result = multiply(assertLeft(left, IntegerValue).value, assertRight(right, IntegerValue).value)
        if (result === null) {
          throw new OverflowException('Integer overflow on multiplication', expression.getSpan())
        }

        return new IntegerValue(result)
      },
    ]
    yield [
      [ValueKind.UnsignedInteger, ValueKind.UnsignedInteger],
      (expression, left, right) => {
        const result =
          BigInt(assertLeft(left, UnsignedIntegerValue).value) *
          BigInt(assertRight(right, UnsignedIntegerValue).value)
        if (result > UINT64_MAX) {
          throw new OverflowException('Unsigned integer overflow on multiplication', expression.getSpan())
        }

        return new UnsignedIntegerValue(result.toString())
      },
    ]
    yield [[ValueKind.Float, ValueKind.Float], floatFloat]
    yield* overloads(floatFloat)
  }
}
