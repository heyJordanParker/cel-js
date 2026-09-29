import { EvaluationException } from '../../../Exception/EvaluationException.js'
import type {
  BinaryOperatorOverloadHandler,
  BinaryOperatorOverloadInterface,
} from '../../../Operator/BinaryOperatorOverloadInterface.js'
import { BinaryOperatorKind } from '../../../Syntax/Binary/BinaryOperatorKind.js'
import { assertLeft, assertRight } from '../../../Util/OperandUtil.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { UnsignedIntegerValue } from '../../../Value/UnsignedIntegerValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

export class ModuloOperator implements BinaryOperatorOverloadInterface {
  getOperator(): BinaryOperatorKind {
    return BinaryOperatorKind.Modulo
  }

  *getOverloads(): Iterable<[[ValueKind, ValueKind], BinaryOperatorOverloadHandler]> {
    yield [
      [ValueKind.Integer, ValueKind.Integer],
      (expression, left, right) => {
        const divisor = assertRight(right, IntegerValue).value
        if (divisor === 0) {
          throw new EvaluationException('Failed to evaluate modulo: division by zero', expression.getSpan())
        }

        return new IntegerValue((assertLeft(left, IntegerValue).value % divisor) + 0)
      },
    ]
    yield [
      [ValueKind.UnsignedInteger, ValueKind.UnsignedInteger],
      (expression, left, right) => {
        const divisor = BigInt(assertRight(right, UnsignedIntegerValue).value)
        if (divisor === 0n) {
          throw new EvaluationException('Failed to evaluate modulo: division by zero', expression.getSpan())
        }

        return new UnsignedIntegerValue((BigInt(assertLeft(left, UnsignedIntegerValue).value) % divisor).toString())
      },
    ]
  }
}
