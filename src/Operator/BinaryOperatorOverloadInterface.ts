import type { BinaryExpression } from '../Syntax/Binary/BinaryExpression.js'
import type { BinaryOperatorKind } from '../Syntax/Binary/BinaryOperatorKind.js'
import type { Value } from '../Value/Value.js'
import type { ValueKind } from '../Value/ValueKind.js'

export type BinaryOperatorOverloadHandler = (
  expression: BinaryExpression,
  left: Value,
  right: Value,
) => Value

export interface BinaryOperatorOverloadInterface {
  getOperator(): BinaryOperatorKind
  getOverloads(): Iterable<[[ValueKind, ValueKind], BinaryOperatorOverloadHandler]>
}
