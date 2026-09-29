import type { CallExpression } from '../../Syntax/Member/CallExpression.js'
import type { Value } from '../../Value/Value.js'
import type { MacroContextInterface } from './MacroContextInterface.js'

export interface MacroInterface {
  getName(): string
  canHandle(call: CallExpression): boolean
  execute(call: CallExpression, context: MacroContextInterface): Value
}
