import type {
  UnaryOperatorOverloadHandler,
  UnaryOperatorOverloadInterface,
} from '../../../Operator/UnaryOperatorOverloadInterface.js'
import { UnaryOperatorKind } from '../../../Syntax/Unary/UnaryOperatorKind.js'
import { assertOperand } from '../../../Util/OperandUtil.js'
import { BooleanValue } from '../../../Value/BooleanValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

export class LogicalNotOperator implements UnaryOperatorOverloadInterface {
  getOperator(): UnaryOperatorKind {
    return UnaryOperatorKind.Not
  }

  *getOverloads(): Iterable<[ValueKind, UnaryOperatorOverloadHandler]> {
    yield [ValueKind.Boolean, (_, operand) => new BooleanValue(!assertOperand(operand, BooleanValue).value)]
  }
}
