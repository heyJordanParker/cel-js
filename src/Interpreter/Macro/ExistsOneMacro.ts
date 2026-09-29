import { InvalidMacroCallException } from '../../Exception/InvalidMacroCallException.js'
import type { CallExpression } from '../../Syntax/Member/CallExpression.js'
import { IdentifierExpression } from '../../Syntax/Member/IdentifierExpression.js'
import { BooleanValue } from '../../Value/BooleanValue.js'
import { ListValue } from '../../Value/ListValue.js'
import { MapValue } from '../../Value/MapValue.js'
import type { Value } from '../../Value/Value.js'
import { iterationItems } from './ComprehensionSupport.js'
import type { MacroContextInterface } from './MacroContextInterface.js'
import type { MacroInterface } from './MacroInterface.js'

export class ExistsOneMacro implements MacroInterface {
  getName(): string {
    return 'exists_one'
  }

  canHandle(call: CallExpression): boolean {
    return call.target !== null && call.arguments.count() === 2
  }

  execute(call: CallExpression, context: MacroContextInterface): Value {
    const callTarget = call.target!
    const [name, callback] = call.arguments.elements

    if (!(name instanceof IdentifierExpression)) {
      throw new InvalidMacroCallException(
        'The `exists_one` macro requires the first argument to be an identifier.',
        name.getSpan(),
      )
    }

    const target = context.evaluate(callTarget)
    if (!(target instanceof ListValue) && !(target instanceof MapValue)) {
      throw new InvalidMacroCallException(
        `The \`exists_one\` macro requires a list or map target, got \`${target.getType()}\``,
        callTarget.getSpan(),
      )
    }

    const items = iterationItems(target)

    return context.withEnvironment(context.getEnvironment().fork(), () => {
      let trueCount = 0
      for (const value of items) {
        context.getEnvironment().addVariable(name.identifier.name, value)

        const result = context.evaluate(callback)
        if (!(result instanceof BooleanValue)) {
          throw new InvalidMacroCallException(
            `The \`exists_one\` macro predicate must result in a boolean, got \`${result.getType()}\``,
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
