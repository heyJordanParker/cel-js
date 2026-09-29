import { EvaluationException } from '../../Exception/EvaluationException.js'
import { InvalidMacroCallException } from '../../Exception/InvalidMacroCallException.js'
import type { CallExpression } from '../../Syntax/Member/CallExpression.js'
import { BooleanValue } from '../../Value/BooleanValue.js'
import type { Value } from '../../Value/Value.js'
import { bindAll, comprehensionBindings } from './ComprehensionSupport.js'
import type { MacroContextInterface } from './MacroContextInterface.js'
import type { MacroInterface } from './MacroInterface.js'

export class AllMacro implements MacroInterface {
  getName(): string {
    return 'all'
  }

  canHandle(call: CallExpression): boolean {
    return call.target !== null && (call.arguments.count() === 2 || call.arguments.count() === 3)
  }

  execute(call: CallExpression, context: MacroContextInterface): Value {
    const variableCount = call.arguments.count() - 1
    const callback = call.arguments.elements[variableCount]
    const bindings = comprehensionBindings('all', call, context, variableCount)

    return context.withEnvironment(context.getEnvironment().fork(), () => {
      let pendingError: EvaluationException | null = null
      for (const variables of bindings) {
        bindAll(context, variables)

        let result: Value
        try {
          result = context.evaluate(callback)
        } catch (error) {
          if (!(error instanceof EvaluationException)) throw error
          pendingError ??= error
          continue
        }

        if (!(result instanceof BooleanValue)) {
          throw new InvalidMacroCallException(
            `The \`all\` macro predicate must result in a boolean, got \`${result.getType()}\``,
            callback.getSpan(),
          )
        }

        if (!result.value) {
          return new BooleanValue(false)
        }
      }

      if (pendingError !== null) {
        throw pendingError
      }

      return new BooleanValue(true)
    })
  }
}
