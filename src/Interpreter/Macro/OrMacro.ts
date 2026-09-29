import { InvalidMacroCallException } from '../../Exception/InvalidMacroCallException.js'
import type { CallExpression } from '../../Syntax/Member/CallExpression.js'
import { OptionalValue } from '../../Value/OptionalValue.js'
import type { Value } from '../../Value/Value.js'
import type { MacroContextInterface } from './MacroContextInterface.js'
import type { MacroInterface } from './MacroInterface.js'

export class OrMacro implements MacroInterface {
  getName(): string {
    return 'or'
  }

  canHandle(call: CallExpression): boolean {
    return call.target !== null && call.arguments.count() === 1
  }

  execute(call: CallExpression, context: MacroContextInterface): Value {
    const target = call.target!
    const optional = context.evaluate(target)
    if (!(optional instanceof OptionalValue)) {
      throw new InvalidMacroCallException(
        `The \`or\` macro requires an optional target, got \`${optional.getType()}\``,
        target.getSpan(),
      )
    }

    if (optional.hasValue()) {
      return optional
    }

    const alternativeExpression = call.arguments.elements[0]
    const alternative = context.evaluate(alternativeExpression)
    if (!(alternative instanceof OptionalValue)) {
      throw new InvalidMacroCallException(
        `The \`or\` macro requires an optional argument, got \`${alternative.getType()}\``,
        alternativeExpression.getSpan(),
      )
    }

    return alternative
  }
}
