import { InvalidMacroCallException } from '../../Exception/InvalidMacroCallException.js'
import type { CallExpression } from '../../Syntax/Member/CallExpression.js'
import { IdentifierExpression } from '../../Syntax/Member/IdentifierExpression.js'
import { OptionalValue } from '../../Value/OptionalValue.js'
import type { Value } from '../../Value/Value.js'
import type { MacroContextInterface } from './MacroContextInterface.js'
import type { MacroInterface } from './MacroInterface.js'

export class OptMapMacro implements MacroInterface {
  getName(): string {
    return 'optMap'
  }

  canHandle(call: CallExpression): boolean {
    return call.target !== null && call.arguments.count() === 2
  }

  execute(call: CallExpression, context: MacroContextInterface): Value {
    const target = call.target!
    const [name, transform] = call.arguments.elements
    if (!(name instanceof IdentifierExpression)) {
      throw new InvalidMacroCallException(
        'The `optMap` macro requires the first argument to be an identifier.',
        name.getSpan(),
      )
    }

    const optional = context.evaluate(target)
    if (!(optional instanceof OptionalValue)) {
      throw new InvalidMacroCallException(
        `The \`optMap\` macro requires an optional target, got \`${optional.getType()}\``,
        target.getSpan(),
      )
    }

    const inner = optional.value
    if (inner === null) {
      return OptionalValue.none()
    }

    return context.withEnvironment(context.getEnvironment().fork(), () => {
      context.getEnvironment().addVariable(name.identifier.name, inner)
      return OptionalValue.of(context.evaluate(transform))
    })
  }
}
