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

export class FilterMacro implements MacroInterface {
  getName(): string {
    return 'filter'
  }

  canHandle(call: CallExpression): boolean {
    return call.target !== null && call.arguments.count() === 2
  }

  execute(call: CallExpression, context: MacroContextInterface): Value {
    const callTarget = call.target!
    const [name, callback] = call.arguments.elements

    if (!(name instanceof IdentifierExpression)) {
      throw new InvalidMacroCallException(
        'The `filter` macro requires the first argument to be an identifier.',
        name.getSpan(),
      )
    }

    const target = context.evaluate(callTarget)
    if (!(target instanceof ListValue) && !(target instanceof MapValue)) {
      throw new InvalidMacroCallException(
        `The \`filter\` macro requires a list or map target, got \`${target.getType()}\``,
        callTarget.getSpan(),
      )
    }

    return context.withEnvironment(context.getEnvironment().fork(), () => {
      const results: Value[] = []
      for (const item of iterationItems(target)) {
        context.getEnvironment().addVariable(name.identifier.name, item)

        const result = context.evaluate(callback)
        if (!(result instanceof BooleanValue)) {
          throw new InvalidMacroCallException(
            `The \`filter\` macro predicate must result in a boolean, got \`${result.getType()}\``,
            callback.getSpan(),
          )
        }

        if (result.value) {
          results.push(item)
        }
      }

      return new ListValue(results)
    })
  }
}
