import type {
  BinaryOperatorOverloadHandler,
  BinaryOperatorOverloadInterface,
} from '../../../Operator/BinaryOperatorOverloadInterface.js'
import { BinaryOperatorKind } from '../../../Syntax/Binary/BinaryOperatorKind.js'
import { assertLeft, assertRight } from '../../../Util/OperandUtil.js'
import { BooleanValue } from '../../../Value/BooleanValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

export class LogicalOrOperator implements BinaryOperatorOverloadInterface {
  getOperator(): BinaryOperatorKind {
    return BinaryOperatorKind.Or
  }

  *getOverloads(): Iterable<[[ValueKind, ValueKind], BinaryOperatorOverloadHandler]> {
    yield [
      [ValueKind.Boolean, ValueKind.Boolean],
      (_, left, right) =>
        new BooleanValue(assertLeft(left, BooleanValue).value || assertRight(right, BooleanValue).value),
    ]
  }
}
