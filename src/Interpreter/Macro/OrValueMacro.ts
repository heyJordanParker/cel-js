import { InvalidMacroCallException } from '../../Exception/InvalidMacroCallException.js'
import type { CallExpression } from '../../Syntax/Member/CallExpression.js'
import { OptionalValue } from '../../Value/OptionalValue.js'
import type { Value } from '../../Value/Value.js'
import type { MacroContextInterface } from './MacroContextInterface.js'
import type { MacroInterface } from './MacroInterface.js'

export class OrValueMacro implements MacroInterface {
  getName(): string {
    return 'orValue'
  }

  canHandle(call: CallExpression): boolean {
    return call.target !== null && call.arguments.count() === 1
  }

  execute(call: CallExpression, context: MacroContextInterface): Value {
    const target = call.target!
    const optional = context.evaluate(target)
    if (!(optional instanceof OptionalValue)) {
      throw new InvalidMacroCallException(
        `The \`orValue\` macro requires an optional target, got \`${optional.getType()}\``,
        target.getSpan(),
      )
    }

    return optional.value ?? context.evaluate(call.arguments.elements[0])
  }
}
