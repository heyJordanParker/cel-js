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

export class MapMacro implements MacroInterface {
  getName(): string {
    return 'map'
  }

  canHandle(call: CallExpression): boolean {
    return call.target !== null && call.arguments.count() >= 2 && call.arguments.count() <= 3
  }

  execute(call: CallExpression, context: MacroContextInterface): Value {
    const callTarget = call.target!
    const name = call.arguments.elements[0]

    if (!(name instanceof IdentifierExpression)) {
      throw new InvalidMacroCallException(
        'The `map` macro requires the first argument to be an identifier.',
        name.getSpan(),
      )
    }

    const target = context.evaluate(callTarget)
    if (!(target instanceof ListValue) && !(target instanceof MapValue)) {
      throw new InvalidMacroCallException(
        `The \`map\` macro requires a list or map target, got \`${target.getType()}\``,
        callTarget.getSpan(),
      )
    }

    const filter = call.arguments.count() === 3 ? call.arguments.elements[1] : null
    const transform = call.arguments.elements[call.arguments.count() - 1]

    return context.withEnvironment(context.getEnvironment().fork(), () => {
      const results: Value[] = []
      for (const item of iterationItems(target)) {
        context.getEnvironment().addVariable(name.identifier.name, item)

        if (filter !== null) {
          const keep = context.evaluate(filter)
          if (!(keep instanceof BooleanValue)) {
            throw new InvalidMacroCallException(
              `The \`map\` macro filter must result in a boolean, got \`${keep.getType()}\``,
              filter.getSpan(),
            )
          }

          if (!keep.value) {
            continue
          }
        }

        results.push(context.evaluate(transform))
      }

      return new ListValue(results)
    })
  }
}
