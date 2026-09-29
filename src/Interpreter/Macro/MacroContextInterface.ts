import type { Environment } from '../../Environment/Environment.js'
import type { Expression } from '../../Syntax/Expression.js'
import type { Value } from '../../Value/Value.js'

export interface MacroContextInterface {
  evaluate(expression: Expression): Value
  getEnvironment(): Environment
  withEnvironment<T>(environment: Environment, callback: () => T): T
}
