import { OverflowException } from '../../../Exception/OverflowException.js'
import type {
  UnaryOperatorOverloadHandler,
  UnaryOperatorOverloadInterface,
} from '../../../Operator/UnaryOperatorOverloadInterface.js'
import { UnaryOperatorKind } from '../../../Syntax/Unary/UnaryOperatorKind.js'
import { negate } from '../../../Util/IntegerMath.js'
import { assertOperand } from '../../../Util/OperandUtil.js'
import { FloatValue } from '../../../Value/FloatValue.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

export class NegationOperator implements UnaryOperatorOverloadInterface {
  getOperator(): UnaryOperatorKind {
    return UnaryOperatorKind.Negate
  }

  *getOverloads(): Iterable<[ValueKind, UnaryOperatorOverloadHandler]> {
    yield [
      ValueKind.Integer,
      (expression, operand) => {
        const result = negate(assertOperand(operand, IntegerValue).value)
        if (result === null) {
          throw new OverflowException('Integer overflow on negation', expression.getSpan())
        }

        return new IntegerValue(result)
      },
    ]
    yield [ValueKind.Float, (_, operand) => new FloatValue(-assertOperand(operand, FloatValue).value)]
  }
}
