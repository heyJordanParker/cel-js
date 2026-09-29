import { DivisionByZeroException } from '../../../Exception/DivisionByZeroException.js'
import { EvaluationException } from '../../../Exception/EvaluationException.js'
import type {
  BinaryOperatorOverloadHandler,
  BinaryOperatorOverloadInterface,
} from '../../../Operator/BinaryOperatorOverloadInterface.js'
import { BinaryOperatorKind } from '../../../Syntax/Binary/BinaryOperatorKind.js'
import { assertLeft, assertRight } from '../../../Util/OperandUtil.js'
import { FloatValue } from '../../../Value/FloatValue.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { UnsignedIntegerValue } from '../../../Value/UnsignedIntegerValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'
import { overloads } from './NumericPromotion.js'

const floatFloat: BinaryOperatorOverloadHandler = (_, left, right) =>
  new FloatValue(assertLeft(left, FloatValue).value / assertRight(right, FloatValue).value)

export class DivisionOperator implements BinaryOperatorOverloadInterface {
  getOperator(): BinaryOperatorKind {
    return BinaryOperatorKind.Divide
  }

  *getOverloads(): Iterable<[[ValueKind, ValueKind], BinaryOperatorOverloadHandler]> {
    yield [
      [ValueKind.Integer, ValueKind.Integer],
      (expression, left, right) => {
        const dividend = assertLeft(left, IntegerValue).value
        const divisor = assertRight(right, IntegerValue).value
        if (divisor === 0) {
          throw new DivisionByZeroException('Failed to evaluate division: division by zero', expression.getSpan())
        }

        return new IntegerValue(Number(BigInt(dividend) / BigInt(divisor)))
      },
    ]
    yield [
      [ValueKind.UnsignedInteger, ValueKind.UnsignedInteger],
      (expression, left, right) => {
        const divisor = BigInt(assertRight(right, UnsignedIntegerValue).value)
        if (divisor === 0n) {
          throw new EvaluationException('Failed to evaluate division: division by zero', expression.getSpan())
        }

        return new UnsignedIntegerValue((BigInt(assertLeft(left, UnsignedIntegerValue).value) / divisor).toString())
      },
    ]
    yield [[ValueKind.Float, ValueKind.Float], floatFloat]
    yield* overloads(floatFloat)
  }
}
