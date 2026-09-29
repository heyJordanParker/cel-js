import { InvalidMacroCallException } from '../../Exception/InvalidMacroCallException.js'
import type { CallExpression } from '../../Syntax/Member/CallExpression.js'
import { BooleanValue } from '../../Value/BooleanValue.js'
import type { Value } from '../../Value/Value.js'
import { bindAll, comprehensionBindings } from './ComprehensionSupport.js'
import type { MacroContextInterface } from './MacroContextInterface.js'
import type { MacroInterface } from './MacroInterface.js'

export class ExistsOneTwoVarMacro implements MacroInterface {
  getName(): string {
    return 'existsOne'
  }

  canHandle(call: CallExpression): boolean {
    return call.target !== null && call.arguments.count() === 3
  }

  execute(call: CallExpression, context: MacroContextInterface): Value {
    const callback = call.arguments.elements[2]
    const bindings = comprehensionBindings('existsOne', call, context, 2)

    return context.withEnvironment(context.getEnvironment().fork(), () => {
      let trueCount = 0
      for (const variables of bindings) {
        bindAll(context, variables)

        const result = context.evaluate(callback)
        if (!(result instanceof BooleanValue)) {
          throw new InvalidMacroCallException(
            `The \`existsOne\` macro predicate must result in a boolean, got \`${result.getType()}\``,
            callback.getSpan(),
          )
        }

        if (result.value) {
          trueCount++
        }
      }

      return new BooleanValue(trueCount === 1)
    })
  }
}
