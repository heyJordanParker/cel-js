import { Environment } from '../Environment/Environment.js'
import { Interpreter } from '../Interpreter/Interpreter.js'
import type { Expression } from '../Syntax/Expression.js'
import type { Value } from '../Value/Value.js'
import type { Configuration } from './Configuration.js'
import { OperationRegistry } from './OperationRegistry.js'

export class Runtime {
  private readonly registry = new OperationRegistry()

  constructor(private readonly configuration: Configuration) {
    for (const extension of configuration.getExtensions()) {
      this.registry.register(extension)
    }
  }

  run(expression: Expression, variables: Record<string, unknown> = {}): Value {
    return new Interpreter(this.configuration, this.registry, Environment.fromObject(variables)).run(expression)
  }
}
