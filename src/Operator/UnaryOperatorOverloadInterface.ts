import type { UnaryExpression } from '../Syntax/Unary/UnaryExpression.js'
import type { UnaryOperatorKind } from '../Syntax/Unary/UnaryOperatorKind.js'
import type { Value } from '../Value/Value.js'
import type { ValueKind } from '../Value/ValueKind.js'

export type UnaryOperatorOverloadHandler = (expression: UnaryExpression, operand: Value) => Value

export interface UnaryOperatorOverloadInterface {
  getOperator(): UnaryOperatorKind
  getOverloads(): Iterable<[ValueKind, UnaryOperatorOverloadHandler]>
}
