import type {
  BinaryOperatorOverloadHandler,
  BinaryOperatorOverloadInterface,
} from '../../../Operator/BinaryOperatorOverloadInterface.js'
import { BinaryOperatorKind } from '../../../Syntax/Binary/BinaryOperatorKind.js'
import { BooleanValue } from '../../../Value/BooleanValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

export class EqualityOperator implements BinaryOperatorOverloadInterface {
  constructor(private readonly operator: BinaryOperatorKind) {}

  getOperator(): BinaryOperatorKind {
    return this.operator
  }

  *getOverloads(): Iterable<[[ValueKind, ValueKind], BinaryOperatorOverloadHandler]> {
    const isEqual = this.operator === BinaryOperatorKind.Equal
    const handler: BinaryOperatorOverloadHandler = (_, left, right) =>
      new BooleanValue(left.isEqual(right) === isEqual)

    for (const left of Object.values(ValueKind)) {
      for (const right of Object.values(ValueKind)) {
        yield [[left, right], handler]
      }
    }
  }
}
