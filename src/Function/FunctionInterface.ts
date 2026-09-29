import type { CallExpression } from '../Syntax/Member/CallExpression.js'
import type { Value } from '../Value/Value.js'
import type { ValueKind } from '../Value/ValueKind.js'

export type FunctionOverloadHandler = (call: CallExpression, args: Value[]) => Value

export interface FunctionInterface {
  getName(): string
  getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]>
  getHandler?(): FunctionOverloadHandler
}
