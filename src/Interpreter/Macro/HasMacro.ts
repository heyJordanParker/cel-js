import { InvalidMacroCallException } from '../../Exception/InvalidMacroCallException.js'
import type { CallExpression } from '../../Syntax/Member/CallExpression.js'
import { MemberAccessExpression } from '../../Syntax/Member/MemberAccessExpression.js'
import { stringKey } from '../../Util/MapKeyUtil.js'
import { BooleanValue } from '../../Value/BooleanValue.js'
import { MapValue } from '../../Value/MapValue.js'
import { OptionalValue } from '../../Value/OptionalValue.js'
import type { Value } from '../../Value/Value.js'
import type { MacroContextInterface } from './MacroContextInterface.js'
import type { MacroInterface } from './MacroInterface.js'

export class HasMacro implements MacroInterface {
  getName(): string {
    return 'has'
  }

  canHandle(call: CallExpression): boolean {
    return call.target === null && call.arguments.count() === 1
  }

  execute(call: CallExpression, context: MacroContextInterface): Value {
    const argument = call.arguments.elements[0]

    if (!(argument instanceof MemberAccessExpression)) {
      throw new InvalidMacroCallException(
        'The `has` macro requires a single member access expression as an argument.',
        argument.getSpan(),
      )
    }

    let operand = context.evaluate(argument.operand)
    if (operand instanceof OptionalValue) {
      if (operand.value === null) {
        return new BooleanValue(false)
      }

      operand = operand.value
    }

    if (!(operand instanceof MapValue)) {
      throw new InvalidMacroCallException(
        `The \`has\` macro requires a message or map operand, got \`${operand.getType()}\``,
        argument.operand.getSpan(),
      )
    }

    return new BooleanValue(operand.has(stringKey(argument.field.name)))
  }
}
