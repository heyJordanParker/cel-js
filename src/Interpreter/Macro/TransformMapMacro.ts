import { InvalidMacroCallException } from '../../Exception/InvalidMacroCallException.js'
import type { CallExpression } from '../../Syntax/Member/CallExpression.js'
import { resolve } from '../../Util/MapKeyUtil.js'
import { BooleanValue } from '../../Value/BooleanValue.js'
import { MapValue } from '../../Value/MapValue.js'
import type { Value } from '../../Value/Value.js'
import { bindAll, comprehensionBindings, iterationVariable } from './ComprehensionSupport.js'
import type { MacroContextInterface } from './MacroContextInterface.js'
import type { MacroInterface } from './MacroInterface.js'

export class TransformMapMacro implements MacroInterface {
  getName(): string {
    return 'transformMap'
  }

  canHandle(call: CallExpression): boolean {
    return call.target !== null && (call.arguments.count() === 3 || call.arguments.count() === 4)
  }

  execute(call: CallExpression, context: MacroContextInterface): Value {
    const count = call.arguments.count()
    const filter = count === 4 ? call.arguments.elements[2] : null
    const transform = call.arguments.elements[count - 1]
    const keyVariable = iterationVariable('transformMap', call.arguments.elements[0])
    const bindings = comprehensionBindings('transformMap', call, context, 2)

    return context.withEnvironment(context.getEnvironment().fork(), () => {
      const results = new Map<string, Value>()
      for (const variables of bindings) {
        bindAll(context, variables)

        if (filter !== null) {
          const keep = context.evaluate(filter)
          if (!(keep instanceof BooleanValue)) {
            throw new InvalidMacroCallException(
              `The \`transformMap\` macro filter must result in a boolean, got \`${keep.getType()}\``,
              filter.getSpan(),
            )
          }

          if (!keep.value) {
            continue
          }
        }

        const key = resolve(variables.get(keyVariable)!)
        if (key === null) {
          throw new InvalidMacroCallException(
            'The `transformMap` macro key cannot be represented as a map key.',
            call.getSpan(),
          )
        }

        results.set(key, context.evaluate(transform))
      }

      return new MapValue(results)
    })
  }
}
