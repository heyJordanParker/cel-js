import { InvalidMacroCallException } from '../../Exception/InvalidMacroCallException.js'
import type { CallExpression } from '../../Syntax/Member/CallExpression.js'
import { BooleanValue } from '../../Value/BooleanValue.js'
import { ListValue } from '../../Value/ListValue.js'
import type { Value } from '../../Value/Value.js'
import { bindAll, comprehensionBindings } from './ComprehensionSupport.js'
import type { MacroContextInterface } from './MacroContextInterface.js'
import type { MacroInterface } from './MacroInterface.js'

export class TransformListMacro implements MacroInterface {
  getName(): string {
    return 'transformList'
  }

  canHandle(call: CallExpression): boolean {
    return call.target !== null && (call.arguments.count() === 3 || call.arguments.count() === 4)
  }

  execute(call: CallExpression, context: MacroContextInterface): Value {
    const count = call.arguments.count()
    const filter = count === 4 ? call.arguments.elements[2] : null
    const transform = call.arguments.elements[count - 1]
    const bindings = comprehensionBindings('transformList', call, context, 2)

    return context.withEnvironment(context.getEnvironment().fork(), () => {
      const results: Value[] = []
      for (const variables of bindings) {
        bindAll(context, variables)

        if (filter !== null) {
          const keep = context.evaluate(filter)
          if (!(keep instanceof BooleanValue)) {
            throw new InvalidMacroCallException(
              `The \`transformList\` macro filter must result in a boolean, got \`${keep.getType()}\``,
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
